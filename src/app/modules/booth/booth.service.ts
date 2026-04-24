import httpStatus from "http-status";
import { booth_model, booth_staff_model } from "./booth.schema";
import { T_Booth } from "./booth.interface";
import { AppError } from "../../utils/app_error";
import { Account_Model } from "../auth/auth.schema";
import { UserProfile_Model } from "../user/user.schema";
import { Types } from "mongoose";
import { Lead } from "../qr/qr.schema";

const create_new_booth_into_db = async (payload: T_Booth): Promise<T_Booth> => {
  const isBoothExist = await booth_model.findOne({
    eventId: payload.eventId,
    exhibitorId: payload.exhibitorId,
  });

  if (isBoothExist) {
    throw new AppError(
      "Booth already exists for this event",
      httpStatus.CONFLICT,
    );
  }

  const booth = await booth_model.create(payload);
  return booth;
};

const get_my_booth_from_db = async (userId: string, eventId: string) => {
  // 1️⃣ Try as Exhibitor (Allow fetching pending/inactive booths for own management)
  const boothAsExhibitor = await booth_model.findOne({
    exhibitorId: userId,
    eventId,
  });

  if (boothAsExhibitor) {
    return boothAsExhibitor;
  }

  // 2️⃣ Try as Staff
  const staff = await booth_staff_model
    .findOne({ userId })
    .populate({
      path: "boothId",
      match: { eventId }
    });

  if (!staff || !staff.boothId) {
    throw new AppError("Booth not found for this event", httpStatus.NOT_FOUND);
  }

  return staff.boothId;
};

const update_my_booth_into_db = async (
  exhibitorId: string,
  eventId: string,
  payload: Record<string, any>,
) => {
  // Ensure we update the booth for the specific event
  const booth = await booth_model.findOneAndUpdate(
    { exhibitorId, eventId },
    payload,
    { new: true },
  );

  if (!booth) {
    throw new AppError("Booth not found", httpStatus.NOT_FOUND);
  }

  return booth;
};

const add_staff_by_email_into_db = async (
  exhibitorId: string,
  eventId: string,
  email: string,
) => {
  const booth = await booth_model.findOne({ exhibitorId, eventId });

  if (!booth) {
    throw new AppError("Booth not found", httpStatus.NOT_FOUND);
  }

  const user = await Account_Model.findOne({ email });

  if (!user) {
    throw new AppError("User not registered", httpStatus.NOT_FOUND);
  }

  // Allow most roles except ORGANIZER/SUPER_ADMIN perhaps, 
  // but definitely more than just ATTENDEE.
  const restrictedRoles = ["ORGANIZER", "SUPER_ADMIN"];
  if (user.activeRole && restrictedRoles.includes(user.activeRole)) {
    throw new AppError(
      `Users with role ${user.activeRole} cannot be added as booth staff`,
      httpStatus.BAD_REQUEST,
    );
  }

  const staff = await booth_staff_model.create({
    boothId: booth._id,
    userId: user._id,
    addedBy: exhibitorId,
  });

  // Update user roles
  await Account_Model.findByIdAndUpdate(
    user._id,
    {
      $addToSet: { role: "STAFF" },
      activeRole: "STAFF",
    },
    { new: true },
  );

  return staff;
};

const get_booth_staff_list_from_db = async (exhibitorId: string, eventId: string) => {
  const objectUserId = new Types.ObjectId(exhibitorId);

  let booth = await booth_model.findOne({
    exhibitorId: objectUserId,
    eventId
  });

  if (!booth) {
    const staff = await booth_staff_model.findOne({ userId: objectUserId }).populate({
      path: "boothId",
      match: { eventId }
    });

    if (!staff || !staff.boothId) {
      throw new AppError("Booth not found for this user", httpStatus.NOT_FOUND);
    }
    booth = staff.boothId as any;
  }

  const staffList = await booth_staff_model
    .find({ boothId: booth!._id })
    .populate("userId");

  if (!staffList.length) {
    return [];
  }

  const profiles = await UserProfile_Model.find({
    accountId: {
      $in: staffList.map((staff: any) => staff.userId._id),
    },
  });

  const profileMap = new Map(
    profiles.map((profile) => [profile.accountId.toString(), profile]),
  );

  return staffList.map((staff: any) => {
    const user = staff.userId;
    return {
      _id: staff._id,
      boothId: staff.boothId,
      createdAt: staff.createdAt,
      user: {
        ...user.toObject(),
        profile: profileMap.get(user._id.toString()) || null,
      },
    };
  });
};

const get_booth_analytics_from_db = async (userId: string, eventId: string) => {
  const booth = await get_my_booth_from_db(userId, eventId);

  const [totalLeads, totalStaff] = await Promise.all([
    Lead.countDocuments({
      exhibitorId: (booth as any).exhibitorId,
      eventId: new Types.ObjectId(eventId),
    }),
    booth_staff_model.countDocuments({
      boothId: booth._id,
    }),
  ]);

  return {
    totalLeads,
    totalStaff,
  };
};

export const booth_service = {
  get_my_booth_from_db,
  update_my_booth_into_db,
  create_new_booth_into_db,
  add_staff_by_email_into_db,
  get_booth_staff_list_from_db,
  get_booth_analytics_from_db,
};
