import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { photo_service } from "./photo.service";

const create_new_photo = catchAsync(async (req, res) => {
  const result = await photo_service.create_new_photo_into_db({
    eventId: req.params.eventId,
    imageUrl: req.body.imageUrl,
    type: req.body.type,
    userId: req.user!.id,
    role: req.user!.activeRole,
  });
 

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Photo uploaded successfully",
    data: result,
  });
});

const get_event_photos = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 6;

  const result = await photo_service.get_event_photos_from_db({
    eventId: req.params.eventId,
    page,
    limit,
    type: req.query.type as string | undefined,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Photos retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const delete_photo = catchAsync(async (req, res) => {
  await photo_service.delete_photo_from_db({
    photoId: req.params.photoId,
    userId: req.user!.id,
    role: req.user!.activeRole,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Photo deleted successfully",
    data: null,
  });
});

const get_public_event_photos = catchAsync(async (req, res) => {
  const result = await photo_service.get_public_event_photos_from_db({
    eventId: req.params.eventId,
    type: req.query.type as string | undefined,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Public event photos retrieved successfully",
    data: result,
  });
});

export const photo_controller = {
  create_new_photo,
  get_event_photos,
  delete_photo,
  get_public_event_photos,
};
