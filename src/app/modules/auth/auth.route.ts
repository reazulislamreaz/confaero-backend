import { Router } from "express";
import { auth_controllers } from "./auth.controller";
import RequestValidator from "../../middlewares/request_validator";
import { auth_validation } from "./auth.validation";
import auth from "../../middlewares/auth";

const authRoute = Router();

authRoute.post(
  "/register",
  RequestValidator(auth_validation.register_validation),
  auth_controllers.register_user,
);
authRoute.post(
  "/login",
  RequestValidator(auth_validation.login_validation),
  auth_controllers.login_user,
);

authRoute.get(
  "/me",
  auth(
    "ORGANIZER",
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  auth_controllers.get_my_profile,
);

authRoute.post("/refresh-token", auth_controllers.refresh_token);
authRoute.post(
  "/change-password",
  auth(
    "SUPER_ADMIN",
    "ORGANIZER",
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  RequestValidator(auth_validation.changePassword),
  auth_controllers.change_password,
);
authRoute.post(
  "/forgot-password",
  RequestValidator(auth_validation.forgotPassword),
  auth_controllers.forget_password,
);

authRoute.post(
  "/verify-reset-code",
  RequestValidator(auth_validation.verifyResetCode),
  auth_controllers.verify_reset_code,
);

authRoute.post(
  "/reset-password",
  RequestValidator(auth_validation.resetPassword),
  auth_controllers.reset_password,
);

authRoute.post(
  "/verified-account",
  RequestValidator(auth_validation.verified_account),
  auth_controllers.verified_account,
);
authRoute.post(
  "/new-verification-link",
  RequestValidator(auth_validation.forgotPassword),
  auth_controllers.get_new_verification_link,
);

authRoute.delete(
  "/delete-account",
  auth(
    "ORGANIZER",
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  RequestValidator(auth_validation.deleteAccount),
  auth_controllers.delete_account,
);
authRoute.post(
  "/change-role",
  auth(
    "ORGANIZER",
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  RequestValidator(auth_validation.changeRole),
  auth_controllers.change_role,
);

authRoute.get(
  "/my-roles",
  auth(
    "ORGANIZER",
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  auth_controllers.get_my_roles,
);
authRoute.patch(
  "/notification",
  auth(
    "SUPER_ADMIN",
    "ORGANIZER",
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ),
  auth_controllers.change_notification,
);
export default authRoute;
