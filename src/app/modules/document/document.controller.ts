import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { AppError } from "../../utils/app_error";
import { document_service } from "./document.service";

/* Speaker */

const create_new_document = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const uploadedBy = req.user!.id;
  const activeRole = req.user!.activeRole;

  if (
    req.body.documentUrl &&
    !req.body.documentUrl.toLowerCase().endsWith(".pdf")
  ) {
    throw new AppError("Only PDF files are allowed", httpStatus.BAD_REQUEST);
  }

  const result = await document_service.create_new_document_into_db(
    eventId,
    uploadedBy,
    req.body,
    activeRole,
  );

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Document uploaded successfully",
    data: result,
  });
});

const get_my_documents = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const uploadedBy = req.user!.id;

  const result = await document_service.get_my_documents_from_db(
    eventId,
    uploadedBy,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My documents retrieved",
    data: result,
  });
});

const delete_my_document = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const uploadedBy = req.user!.id;

  const result = await document_service.delete_my_document_from_db(
    documentId,
    uploadedBy,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Document deleted successfully",
    data: result,
  });
});

/* Organizer / Super Admin */

const get_pending_documents = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const result = await document_service.get_pending_documents_from_db({
    ...req.query,
    eventId,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Documents retrieved successfully",
    data: result,
  });
});

const get_all_documents = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const result = await document_service.get_all_documents_from_db({
    ...req.query,
    eventId,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Documents retrieved successfully",
    data: result,
  });
});

const get_details = catchAsync(async (req, res) => {
  const { eventId, documentId } = req.params;

  const result = await document_service.get_details_from_db({
    eventId,
    documentId,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Documents retrieved successfully",
    data: result,
  });
});

const update_document_status = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const { status } = req.body;

  const result = await document_service.update_document_status_into_db(
    documentId,
    status,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Document status updated",
    data: result,
  });
});
const get_all_documents_for_view = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const result = await document_service.get_all_documents_for_view_from_db(
    eventId,
    req.query,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All documents retrieved successfully",
    data: result,
  });
});

export const document_controller = {
  create_new_document,
  get_my_documents,
  delete_my_document,
  get_all_documents,
  update_document_status,
  get_pending_documents,
  get_details,
  get_all_documents_for_view,
};
