import httpStatus from "http-status";
import { Account_Model } from "../auth/auth.schema";
import { AppError } from "../../utils/app_error";
import { task_model } from "./volunteer.schema";
import { Event_Model } from "../superAdmin/event.schema";
import { task_report_model } from "../report/report.schema";
import { UserProfile_Model } from "../user/user.schema";

const create_task_and_assign = async (payload: any, creatorId: string) => {
  const {
    eventId,
    volunteerEmail,
    title,
    startDate,
    endDate,
    time,
    location,
    instruction,
    referenceImage,
  } = payload;

  // 1️⃣ find volunteer account
  const account = await Account_Model.findOne({ email: volunteerEmail });
  if (!account) {
    throw new AppError("Volunteer not found", httpStatus.NOT_FOUND);
  }

  // 2️⃣ check event + participant role
  const event = await Event_Model.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  const isVolunteer = event.participants.some(
    (p: any) =>
      p.accountId.toString() === account._id.toString() &&
      p.role === "VOLUNTEER",
  );

  if (!isVolunteer) {
    throw new AppError(
      "This user is not a volunteer of this event",
      httpStatus.BAD_REQUEST,
    );
  }

  // 3️⃣ create task
  return await task_model.create({
    eventId,
    title,
    startDate,
    endDate,
    time,
    location,
    instruction,
    referenceImage,
    assignedVolunteer: account._id,
    createdBy: creatorId,
  });
};

const get_task_details_by_id = async (
  taskId: any,
  userId: string,
  role?: string,
) => {
  const task: any = await task_model
    .findById(taskId)
    .populate("createdBy", "email activeRole")
    .populate("assignedVolunteer", "email")
    .lean();

  if (!task) {
    throw new AppError("Task not found", httpStatus.NOT_FOUND);
  }

  const userProfile = await UserProfile_Model.findOne({
    accountId: task.createdBy._id,
  });
  // 🔐 Volunteer restriction

  if (role === "VOLUNTEER") {
    if (task.assignedVolunteer._id.toString() !== userId.toString()) {
      throw new AppError(
        "You are not allowed to view this task",
        httpStatus.FORBIDDEN,
      );
    }
  }

  return {
    taskId: task._id,
    title: task.title,
    startDate: task.startDate,
    endDate: task.endDate,
    time: task.time,
    location: task.location,
    instruction: task.instruction,
    referenceImage: task.referenceImage,
    status: task.status,

    assignedVolunteer: {
      accountId: task.assignedVolunteer?._id,
      email: task.assignedVolunteer?.email,
    },

    createdBy: {
      email: task.createdBy?.email,
      name: userProfile?.name,
      photo: userProfile?.avatar,
      role: task.createdBy?.activeRole,
    },

    createdAt: task.createdAt,
  };
};

const get_my_tasks = async (volunteerId: any, filterType?: string) => {
  const query: any = { assignedVolunteer: volunteerId };
  
  if (filterType === "current") {
    query.status = { $in: ["PENDING", "IN_PROGRESS"] };
  } else if (filterType === "history") {
    query.status = { $in: ["COMPLETED", "DUE"] };
  }

  const tasks = await task_model
    .find(query)
    .populate("createdBy", "email activeRole name")
    .sort({ createdAt: -1 });
  return tasks;
};

const complete_task = async (taskId: any, volunteerId: string) => {
  const task = await task_model.findOne({
    _id: taskId,
    assignedVolunteer: volunteerId,
  });

  if (!task) {
    throw new AppError("Task not found", httpStatus.NOT_FOUND);
  }

  task.status = "COMPLETED" as any;
  await task.save();
  return task;
};

const get_today_progress = async (volunteerId: any) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const tasks = await task_model.find({
    assignedVolunteer: new Object(volunteerId),
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const remainingTasks = totalTasks - completedTasks;

  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    totalTasks,
    completedTasks,
    remainingTasks,
    progress,
  };
};

// search by email
const search_event_volunteer_by_email = async (
  eventId: any,
  email?: string,
) => {
  // 1️⃣ find event first
  const event = await Event_Model.findById(eventId).populate(
    "participants.accountId",
    "email",
  );

  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  // 2️⃣ filter only VOLUNTEERS
  const volunteers = event.participants.filter(
    (p: any) => p.role === "VOLUNTEER",
  );

  // 3️⃣ if no email provided → return all volunteers
  if (!email || email.trim() === "") {
    return volunteers.map((v: any) => ({
      accountId: v.accountId._id,
      email: v.accountId.email,
    }));
  }

  // 4️⃣ if email provided → find specific volunteer
  const matchedVolunteer = volunteers.find(
    (v: any) => v.accountId.email.toLowerCase() === email.toLowerCase(),
  );

  if (!matchedVolunteer) {
    throw new AppError(
      "This user is not a volunteer of this event",
      httpStatus.BAD_REQUEST,
    );
  }

  return {
    accountId: matchedVolunteer.accountId._id,
    email: matchedVolunteer.accountId.email,
  };
};

const get_volunteers_dashboard = async ({ page, limit, eventId }: any) => {
  const skip = (page - 1) * limit;

  // 1️⃣ get event volunteers
  const event = await Event_Model.findById(eventId);
  const volunteers = event?.participants.filter(
    (p: any) => p.role === "VOLUNTEER",
  );

  const total = volunteers?.length;
  const paginated = volunteers?.slice(skip, skip + limit);

  // 2️⃣ find event
  if (!paginated) {
    throw new AppError("Paginated not found", httpStatus.NOT_FOUND);
  }

  // 2️⃣ map volunteer cards
  const cards = await Promise.all(
    paginated.map(async (v: any) => {
      const account = await Account_Model.findById(v.accountId);
      const userProfile = await UserProfile_Model.findOne({
        accountId: v.accountId,
      });

      // all tasks
      const tasks = await task_model
        .find({
          assignedVolunteer: v.accountId,
          eventId,
        })
        .sort({ createdAt: -1 });

      const latestTask = tasks.length > 0 ? tasks[0] : null;

      // reports
      const reports = await task_report_model
        .find({ volunteerId: v.accountId })
        .sort({ createdAt: -1 });

      return {
        volunteer: {
          accountId: account?._id,
          name: userProfile?.name,
          email: account?.email,
        },
        taskStatus:
          latestTask?.status === "COMPLETED" ? "Completed" : "Pending",
        assignedArea: latestTask?.location || "—",
        reportsCount: reports.length,
        recentReports: reports.slice(0, 2).map((r) => ({
          _id: r._id,
          title: "Task Report",
          summary: r.description?.slice(0, 50),
          date: r.createdAt.toISOString().split("T")[0],
        })),
        tasks: tasks,
      };
    }),
  );

  return {
    meta: { page, limit, total },
    data: cards,
  };
};

const get_single_report = async (reportId: any) => {
  const report = await task_report_model.findById(reportId);
  if (!report) {
    throw new AppError("Report not found", httpStatus.NOT_FOUND);
  }

  // volunteer info
  const account = await Account_Model.findById(report.volunteerId);
  const profile = await UserProfile_Model.findOne({
    accountId: report.volunteerId,
  });

  // task info
  const task = await task_model.findById(report.taskId);

  return {
    _id: report._id,
    category: report.category,
    urgency: report.urgency,
    description: report.description,
    images: report.images || [],
    createdAt: report.createdAt.toISOString().split("T")[0],

    volunteer: {
      accountId: account?._id,
      name: profile?.name || "—",
      email: account?.email,
    },

    task: task
      ? {
          taskId: task._id,
          title: task.title,
          location: task.location,
          startDate: task.startDate,
          endDate: task.endDate,
          time: task.time,
        }
      : null,
  };
};

export const task_service = {
  create_task_and_assign,
  get_my_tasks,
  complete_task,
  get_today_progress,
  search_event_volunteer_by_email,
  get_volunteers_dashboard,
  get_single_report,
  get_task_details_by_id,
};
