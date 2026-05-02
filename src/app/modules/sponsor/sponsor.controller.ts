import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { sponsor_service } from "./sponsor.service";

const create_new_sponsor = catchAsync(async (req, res) => {
  const sponsorId = req.user!.id; // auth middleware
  const result = await sponsor_service.create_new_sponsor_into_db(
    req.body,
    sponsorId,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sponsor profile created successfully!",
    data: result,
  });
});
const get_my_sponsor = catchAsync(async (req, res) => {
  const sponsorId = req.user!.id;
  const { eventId } = req.params;
  const result = await sponsor_service.get_my_sponsor_from_db(
    eventId as any,
    sponsorId,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sponsor profile retrieved successfully!",
    data: result,
  });
});

const update_my_sponsor = catchAsync(async (req, res) => {
  const sponsorId = req.user!.id;
  const { sponsorId: sponsorProfileId } = req.params;

  const result = await sponsor_service.update_my_sponsor_into_db(
    sponsorId,
    sponsorProfileId as any,
    req.body,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sponsor profile updated successfully!",
    data: result,
  });
});
const increment_profile_view = catchAsync(async (req, res) => {
  const { sponsorProfileId } = req.params;
  console.log(sponsorProfileId);

  const result =
    await sponsor_service.increment_sponsor_profile_view(sponsorProfileId);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sponsor profile view incremented!",
    data: result,
  });
});
const get_sponsor_dashboard = catchAsync(async (req, res) => {
  const sponsorId = req.user!.id;
  const { eventId } = req.params;

  const result = await sponsor_service.get_sponsor_dashboard_from_db(
    eventId as string,
    sponsorId,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sponsor dashboard data fetched successfully!",
    data: result,
  });
});

export const sponsor_controller = {
  update_my_sponsor,
  create_new_sponsor,
  get_my_sponsor,
  increment_profile_view,
  get_sponsor_dashboard,
};
