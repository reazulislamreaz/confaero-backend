import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { organizer_booth_service } from "./organizerBooth.service";

const get_event_booths = catchAsync(async (req, res) => {
  const result = await organizer_booth_service.get_event_booths_into_db(
    req.params.eventId as string,
    req.user!.id,
    req.user!.activeRole,
    req.query.isAccepted as string,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booths fetched successfully",
    data: result,
  });
});

const get_booth_details = catchAsync(async (req, res) => {
  const result = await organizer_booth_service.get_booth_details_into_db(
    req.params.boothId as string,
    req.user!.id,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth details fetched",
    data: result,
  });
});

const update_booth_number = catchAsync(async (req, res) => {
  const result = await organizer_booth_service.update_booth_number_into_db(
    req.params.boothId as string,
    req.body.boothNumber,
    req.user!.id,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth number updated successfully",
    data: result,
  });
});

const accept_booth = catchAsync(async (req, res) => {
  const result = await organizer_booth_service.accept_booth_into_db(
    req.params.boothId as string,
    req.user!.id,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth accepted successfully",
    data: result,
  });
});

const cancel_booth = catchAsync(async (req, res) => {
  const result = await organizer_booth_service.cancel_booth_into_db(
    req.params.boothId as string,
    req.user!.id,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booth cancelled successfully",
    data: result,
  });
});

export const organizer_booth_controller = {
  get_event_booths,
  get_booth_details,
  update_booth_number,
  accept_booth,
  cancel_booth,
};
