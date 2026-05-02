import { Types } from "mongoose";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import httpStatus from "http-status";
import { connection_service } from "./connection.service";

const send_request = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await connection_service.send_connection_request_into_db({
    senderId: new Types.ObjectId(req.user!.id),
    receiverId: new Types.ObjectId(req.body.connectedAccountId),
    eventId: new Types.ObjectId(eventId as string),
    role: req.body.role,
    sessionsCount: req.body.sessionsCount,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Connection request sent",
    data: result,
  });
});

const incoming_requests = catchAsync(async (req, res) => {
  const result = await connection_service.get_incoming_requests_from_db(
    new Types.ObjectId(req.user!.id),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Incoming connection requests",
    data: result,
  });
});

const accept_request = catchAsync(async (req, res) => {
  const result = await connection_service.accept_connection_request_into_db(
    new Types.ObjectId(req.params.id as string),
    new Types.ObjectId(req.user!.id),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Connection request accepted",
    data: result,
  });
});

const get_connections = catchAsync(async (req, res) => {
  const filter = req.query.filter as string;
  const search = req.query.search as string;

  const result = await connection_service.get_all_connections_from_db(
    new Types.ObjectId(req.user!.id),
    filter,
    search,
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Connections retrieved",
    data: {
      total: result.length,
      bookmarked: result.filter((c) => c.isBookmarked).length,
      connections: result,
    },
  });
});

const toggle_bookmark = catchAsync(async (req, res) => {
  const result = await connection_service.toggle_bookmark_into_db(
    new Types.ObjectId(req.user!.id),
    new Types.ObjectId(req.params.id as string),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bookmark updated",
    data: result,
  });
});
const get_connection_detail = catchAsync(async (req, res) => {
  const result = await connection_service.get_connection_detail_from_db(
    new Types.ObjectId(req.params.connectionId as string),
    new Types.ObjectId(req.user!.id),
  );

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Connection detail retrieved",
    data: result,
  });
});

export const connection_controller = {
  send_request,
  incoming_requests,
  accept_request,
  get_connections,
  toggle_bookmark,
  get_connection_detail,
};
