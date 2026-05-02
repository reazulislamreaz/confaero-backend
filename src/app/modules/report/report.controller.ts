import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { report_service } from "./report.service";

const report_task_issue = catchAsync(async (req, res) => {
  const result = await report_service.report_issue(req.body, req.user!.id);

  manageResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Issue reported successfully",
    data: result,
  });
});

export const report_controller = { report_task_issue };
