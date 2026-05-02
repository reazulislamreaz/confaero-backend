import { Types } from "mongoose";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { note_service } from "./note.service";

const create_new_note = catchAsync(async (req, res) => {
  const result = await note_service.create_new_note_into_db(
    new Types.ObjectId(req.user!.id),
    req.body,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note saved successfully",
    data: result,
  });
});
const get_notes = catchAsync(async (req, res) => {
  const result = await note_service.get_notes_into_db(
    new Types.ObjectId(req.user!.id),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "get all notes successfully",
    data: result,
  });
});

export const note_controller = { create_new_note, get_notes };
