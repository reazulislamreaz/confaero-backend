import { Router } from "express";
import RequestValidator from "../../middlewares/request_validator";
import { booth_controller } from "./booth.controller";
import { booth_validations } from "./booth.validation";
import auth from "../../middlewares/auth";

const booth_router = Router();

booth_router.post(
  "/create",
  auth("EXHIBITOR", "STAFF"),
  RequestValidator(booth_validations.create),
  booth_controller.create_new_booth,
);

booth_router.get(
  "/me/:eventId",
  auth("EXHIBITOR", "STAFF"),
  booth_controller.get_my_booth,
);

booth_router.patch(
  "/me/:eventId",
  auth("EXHIBITOR", "STAFF"),
  // RequestValidator(booth_validations.update),
  booth_controller.update_my_booth,
);

// add more routes as needed

booth_router.post(
  "/staff/:eventId",
  auth("EXHIBITOR", "STAFF"),
  booth_controller.add_booth_staff_by_email,
);

booth_router.get("/staff/:eventId", auth("EXHIBITOR", "STAFF"), booth_controller.get_booth_staff_list);

booth_router.get(
  "/analytics/:eventId",
  auth("EXHIBITOR", "STAFF"),
  booth_controller.get_booth_analytics,
);

export default booth_router;
