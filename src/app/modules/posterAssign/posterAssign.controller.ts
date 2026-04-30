import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { poster_assign_service } from "./posterAssign.service";

const create_new_poster_assign = catchAsync(async (req, res) => {
  const assignedBy = req.user!.id;

  const { eventId } = req.params;

  const result = await poster_assign_service.create_new_poster_assign_into_db({
    ...req.body,
    eventId,
    assignedBy,
  });

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Poster assigned to reviewer successfully",
    data: result,
  });
});

const reassign_poster_to_reviewer = catchAsync(async (req, res) => {
  const assignedBy = req.user!.id;
  const { eventId } = req.params;

  const result =
    await poster_assign_service.reassign_poster_to_reviewer_into_db({
      ...req.body,
      eventId,
      assignedBy,
    });

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Poster reassigned to reviewer successfully",
    data: result,
  });
});

const get_unassigned_files = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const data = await poster_assign_service.get_unassigned_files(
    eventId as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unassigned files fetched successfully",
    data,
  });
});

const get_assigned_files = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { type } = req.query; // "pdf" | "image"

  const data = await poster_assign_service.get_assigned_files(
    eventId,
    type as "pdf" | "image",
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assigned files fetched successfully",
    data,
  });
});

const get_reported_files = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const data = await poster_assign_service.get_reported_files(eventId);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reported files fetched successfully",
    data,
  });
});

const get_reviewer_stats = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  console.log(eventId);
  const data = await poster_assign_service.get_reviewer_stats(
    eventId as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviewer stats fetched successfully",
    data,
  });
});

const search_speakers = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const search = req.query.search?.toString() || "";

  const data = await poster_assign_service.get_all_reviewers_by_event(
    eventId,
    search,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviewers fetched successfully",
    data,
  });
});

const search_unassigned_files = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { search, type } = req.query;

  const data = await poster_assign_service.search_unassigned_files_for_assign({
    eventId,
    search: search?.toString(),
    type: type as "pdf" | "image",
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "documents fetch successfully",
    data,
  });
});

// send mail
const send_review_reminder = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;

  const result =
    await poster_assign_service.send_review_reminder_into_db(assignmentId);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reminder sent successfully",
    data: result,
  });
});

const get_top_posters = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 3;

  const result = await poster_assign_service.get_top_posters_into_db(
    eventId as string,
    limit,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Top posters fetched successfully",
    data: result,
  });
});
export const poster_assign_controller = {
  create_new_poster_assign,
  get_unassigned_files,
  get_assigned_files,
  get_reported_files,
  // submit_review,
  get_reviewer_stats,
  search_speakers,
  search_unassigned_files,
  reassign_poster_to_reviewer,
  send_review_reminder,
  get_top_posters,
};
