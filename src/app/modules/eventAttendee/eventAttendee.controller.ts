import { Types } from "mongoose";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { event_attendee_service } from "./eventAttendee.service";

const getEventAttendees = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { search, role, bookmarked } = req.query;

  const result = await event_attendee_service.get_event_attendees_from_db(
    new Types.ObjectId(eventId as string),
    new Types.ObjectId(req.user!.id),
    {
      search: search as string,
      role: role as string,
      bookmarked: bookmarked === "true",
    },
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event attendees retrieved",
    data: result,
  });
});
const getEventAttendeeDetail = catchAsync(async (req, res) => {
  const { eventId, accountId } = req.params;

  const result = await event_attendee_service.get_event_attendee_detail_from_db(
    new Types.ObjectId(eventId as string),
    new Types.ObjectId(accountId as string),
    new Types.ObjectId(req.user!.id),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event attendee detail retrieved",
    data: result,
  });
});

const toggle_bookmark = catchAsync(async (req, res) => {
  const { eventId, accountId } = req.params;
  const result = await event_attendee_service.toggle_bookmark_into_db(
    new Types.ObjectId(req.user!.id),
    new Types.ObjectId(accountId as string),
    new Types.ObjectId(eventId as string),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bookmark updated",
    data: result,
  });
});
export const event_attendee_controller = {
  getEventAttendees,
  getEventAttendeeDetail,
  toggle_bookmark,
};
