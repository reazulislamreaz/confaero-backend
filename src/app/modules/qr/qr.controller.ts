import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { qr_service, scan_qr_token } from "./qr.service";
import {
  create_instant_connection_from_scan,
  exhibitor_lead_service,
  volunteer_checkin_service,
} from "./utilities";
import { get_volunteer_checkin_history_service } from "./volunteer.service";
import {
  get_exhibitor_leads_service,
  update_lead_note_service,
  update_lead_tags_service,
} from "./leadService";
import { TQrPayload } from "./qr.interface";

const generate_qr = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const user = req.user;

  const result = qr_service.generate_qr_token(
    user?.id,
    user?.activeRole as TQrPayload["activeRole"] | undefined,
    eventId,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QR token generated successfully",
    data: result,
  });
});

export const scan_qr_controller = catchAsync(async (req, res) => {
  const { qrToken } = req.body;
  const scanner = req.user; // from auth middleware
  const { eventId } = req.params;

  const result = await scan_qr_token(qrToken, { ...scanner, eventId } as any);

  let data: any;

  switch (result.action) {
    case "CHECK_IN":
      data = await volunteer_checkin_service(result);
      break;

    case "CONNECTION":
      data = await create_instant_connection_from_scan({
        scannerId: result.scannerId,
        scannedUserId: result.scannedUserId,
        eventId: result.eventId,
        role: "ATTENDEE",
      });
      break;

    case "LEAD":
      data = await exhibitor_lead_service(result);
      break;

    default:
      throw new Error("Invalid scan action");
  }

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QR scanned successfully",
    data,
  });
});

// volunteer

export const get_volunteer_checkin_history = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const volunteerId = req.user?.id;

  const data = await get_volunteer_checkin_history_service({
    eventId,
    volunteerId,
  });

  manageResponse(res, {
    statusCode: 200,
    success: true,
    message: "Volunteer check-in history fetched",
    data,
  });
});

// leads

const get_exhibitor_leads = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const exhibitorId = req.user?.id;
  const { filter = "all", search = "" } = req.query;

  const data = await get_exhibitor_leads_service({
    eventId: eventId as string,
    exhibitorId,
    filter: filter as any,
    search: search as string,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Exhibitor leads fetched",
    data,
  });
});
const update_lead_note = catchAsync(async (req, res) => {
  const { leadId } = req.params;
  const { note } = req.body;
  const exhibitorId = req.user?.id;

  const data = await update_lead_note_service({
    leadId,
    exhibitorId,
    note,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead note updated",
    data,
  });
});

const update_lead_tags = catchAsync(async (req, res) => {
  const { leadId } = req.params;
  const { tags } = req.body;
  const exhibitorId = req.user?.id;

  const data = await update_lead_tags_service({
    leadId,
    exhibitorId,
    tags,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead tags updated",
    data,
  });
});

export const qr_controller = {
  generate_qr,
  scan_qr_controller,
  get_volunteer_checkin_history,
  get_exhibitor_leads,
  update_lead_note,
  update_lead_tags,
};
