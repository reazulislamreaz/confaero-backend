import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { booth_service } from "./booth.service";

const create_new_booth = catchAsync(async (req, res) => {
  const exhibitorId = req.user?.id;

  const payload = {
    ...req.body,
    exhibitorId,
  };

  const result = await booth_service.create_new_booth_into_db(payload);

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "New booth created successfully!",
    data: result,
  });
});

const get_my_booth = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await booth_service.get_my_booth_from_db(
    req.user?.id,
    eventId as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth fetched successfully",
    data: result,
  });
});

const update_my_booth = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await booth_service.update_my_booth_into_db(
    req.user?.id,
    eventId as string,
    req.body,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth updated successfully",
    data: result,
  });
});

const add_booth_staff_by_email = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await booth_service.add_staff_by_email_into_db(
    req.user?.id,
    eventId as string,
    req.body.email,
  );

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Booth staff added successfully",
    data: result,
  });
});

const get_booth_staff_list = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await booth_service.get_booth_staff_list_from_db(
    req.user?.id,
    eventId as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth staff list fetched successfully",
    data: result,
  });
});

const get_booth_analytics = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await booth_service.get_booth_analytics_from_db(
    req.user?.id,
    eventId as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth analytics fetched successfully",
    data: result,
  });
});

export const booth_controller = {
  create_new_booth,
  get_my_booth,
  update_my_booth,
  add_booth_staff_by_email,
  get_booth_staff_list,
  get_booth_analytics,
};
