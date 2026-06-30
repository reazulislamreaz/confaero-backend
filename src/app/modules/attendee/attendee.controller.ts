import { Types } from "mongoose";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { attendee_service } from "./attendee.service";
import { AppError } from "../../utils/app_error";

const get_all_upcoming_events = catchAsync(async (req, res) => {
  const result = await attendee_service.get_all_upcoming_events_from_db();
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upcoming events fetched successfully",
    data: result,
  });
});
const get_all_events = catchAsync(async (req, res) => {
  const result = await attendee_service.get_all_events_from_db();
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All events fetched successfully",
    data: result,
  });
});

// real register flow
const initiate_attendee_registration = catchAsync(async (req, res) => {
  const result = await attendee_service.initiate_attendee_registration(
    new Types.ObjectId(req.user!.id),
    req.user!.email,
    new Types.ObjectId(req.params.eventId as string),
  );
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event registration initiated successfully",
    data: result,
  });
});

//
const get_my_all_events = catchAsync(async (req, res) => {
  const result = await attendee_service.get_my_registered_events_from_db(
    new Types.ObjectId(req.user!.id),
  );
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My events fetched successfully",
    data: result,
  });
});
//
const get_my_events = catchAsync(async (req, res) => {
  const result = await attendee_service.get_my_registered_events_from_db(
    new Types.ObjectId(req.user!.id),
  );
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My events fetched successfully",
    data: result,
  });
});
//

const get_single_event = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const result = await attendee_service.get_single_event_from_db(
    new Types.ObjectId(eventId as string),
    req.user!.id,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event fetched successfully",
    data: result,
  });
});

/**
 * Get sessions of an event
 */
const get_event_sessions = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const result = await attendee_service.get_event_sessions_from_db(
    new Types.ObjectId(eventId as string),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event sessions fetched successfully",
    data: result,
  });
});

const get_event_home = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const result = await attendee_service.get_event_home_from_db(
    new Types.ObjectId(eventId as string),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event home data fetched successfully",
    data: result,
  });
});
const generate_qr_token = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user?.id;

  const result = await attendee_service.generate_qr_token_from_db(
    new Types.ObjectId(userId!),
    new Types.ObjectId(eventId as string),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QR token generated successfully",
    data: result,
  });
});

const join_event = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user?.id;

  const role = req.query.role; // 👈 query role

  const result = await attendee_service.join_event_from_db(
    new Types.ObjectId(userId!),
    new Types.ObjectId(eventId as string),
    role as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "user join successfully",
    data: result,
  });
});

const get_my_unified_events = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  if (!userId || !userEmail) {
    throw new AppError("User authentication required", httpStatus.UNAUTHORIZED);
  }

  const result = await attendee_service.get_my_unified_events_from_db(
    new Types.ObjectId(userId),
    userEmail,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My events and invitations fetched successfully",
    data: result,
  });
});

export const attendee_controller = {
  get_all_upcoming_events,
  get_all_events,
  get_my_all_events,
  get_my_events,
  get_single_event,
  get_event_sessions,
  get_event_home,
  generate_qr_token,
  initiate_attendee_registration,
  join_event,
  get_my_unified_events,
};
