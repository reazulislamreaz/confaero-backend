import { Router } from "express";
import { attendee_controller } from "./attendee.controller";
import auth from "../../middlewares/auth";
import eventAccess from "../../middlewares/eventAccess.middleware";

const attendee_router = Router();

attendee_router.get(
  "/events",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  attendee_controller.get_all_upcoming_events,
);

attendee_router.get(
  "/all-events",
  auth("ATTENDEE"),
  attendee_controller.get_all_events,
);

// real register flow
attendee_router.post(
  "/events/:eventId/initiate-registration",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  attendee_controller.initiate_attendee_registration,
);
//
attendee_router.get(
  "/my-event",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ), // eventAccess(),
  attendee_controller.get_my_all_events,
);

// 🆕 Unified endpoint: registered events + invitations (MUST be before /my-events/:eventId)
attendee_router.get(
  "/my-events",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  attendee_controller.get_my_unified_events,
);

//
attendee_router.get(
  "/my-events/:eventId",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  eventAccess(),

  attendee_controller.get_my_events,
);
attendee_router.get(
  "/events/:eventId",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ), // eventAccess(),
  attendee_controller.get_single_event,
);

attendee_router.get(
  "/events/:eventId/sessions",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  eventAccess(),
  attendee_controller.get_event_sessions,
);

attendee_router.get(
  "/events/:eventId/home",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  eventAccess(),
  attendee_controller.get_event_home,
);

attendee_router.get(
  "/events/:eventId/qr-token",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  eventAccess(),
  attendee_controller.generate_qr_token,
);
attendee_router.patch(
  "/event/:eventId/join",
  auth(
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  eventAccess(),
  attendee_controller.join_event,
);

export default attendee_router;
