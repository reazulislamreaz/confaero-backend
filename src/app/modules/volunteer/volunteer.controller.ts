import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { task_service } from "./volunteer.service";

const create_task = catchAsync(async (req, res) => {
  const result = await task_service.create_task_and_assign(
    req.body,
    req.user?.id,
  );

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Task created and assigned",
    data: result,
  });
});

const get_task_details = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user?.id;
  const role = req.user?.activeRole;

  const result = await task_service.get_task_details_by_id(
    taskId,
    userId,
    role,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task details fetched",
    data: result,
  });
});
const my_tasks = catchAsync(async (req, res) => {
  const { filter } = req.query;
  const result = await task_service.get_my_tasks(req.user?.id, filter as string);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My tasks fetched",
    data: result,
  });
});

const complete_task = catchAsync(async (req, res) => {
  const result = await task_service.complete_task(
    req.params.taskId,
    req.user?.id,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task completed",
    data: result,
  });
});

const today_progress = catchAsync(async (req, res) => {
  const result = await task_service.get_today_progress(req.user?.id);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Today's task progress fetched",
    data: result,
  });
});
// search by email
const search_volunteer_by_email = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { email } = req.query;

  const result = await task_service.search_event_volunteer_by_email(
    eventId,
    email as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Volunteer found",
    data: result,
  });
});
const get_volunteer_dashboard = catchAsync(async (req, res) => {
  const { page = 1, limit = 6, eventId } = req.query;

  const result = await task_service.get_volunteers_dashboard({
    page: Number(page),
    limit: Number(limit),
    eventId,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Volunteer dashboard data fetched",
    data: result,
  });
});
const view_single_report = catchAsync(async (req, res) => {
  const { reportId } = req.params;

  const result = await task_service.get_single_report(reportId);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report details fetched",
    data: result,
  });
});
export const task_controller = {
  create_task,
  my_tasks,
  complete_task,
  today_progress,
  search_volunteer_by_email,
  view_single_report,
  get_volunteer_dashboard,
  get_task_details,
};
