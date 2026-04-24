import { Request, Response } from "express";
import catchAsync from "../../utils/catch_async";
import { get_exhibitor_performance_service } from "./exhibitor.service";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { JwtPayloadType } from "../../utils/JWT";

const get_exhibitor_performance = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { interval, limit } = req.query as { 
    interval?: "daily" | "weekly";
    limit?: string;
  };
  const user = req.user as JwtPayloadType;
  const exhibitorId = user.id;

  const result = await get_exhibitor_performance_service({
    exhibitorId,
    eventId: eventId as string,
    interval,
    limit: limit ? parseInt(limit) : 5,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exhibitor performance analytics retrieved successfully",
    data: result,
  });
});

export const ExhibitorController = {
  get_exhibitor_performance,
};
