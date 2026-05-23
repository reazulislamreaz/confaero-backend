import { configs } from "../../configs";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import { auth_services } from "./auth.service";
import httpStatus from "http-status";

const register_user = catchAsync(async (req, res) => {
  const result = await auth_services.register_user_into_db(req?.body);
  manageResponse(res, {
    success: true,
    message: "Account created successful",
    statusCode: httpStatus.OK,
    data: result,
  });
});

const login_user = catchAsync(async (req, res) => {
  const result = await auth_services.login_user_from_db(req.body);

  res.cookie("refreshToken", result.refreshToken, {
    secure: configs.env == "production",
    httpOnly: true,
  });
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User is logged in successful !",
    data: result,
  });
});

const google_signin = catchAsync(async (req, res) => {
  const result = await auth_services.google_signin_from_db(req.body.idToken);

  res.cookie("refreshToken", result.refreshToken, {
    secure: configs.env == "production",
    httpOnly: true,
  });

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signed in with Google successfully",
    data: result,
  });
});

const get_my_profile = catchAsync(async (req, res) => {
  const { email } = req.user!;
  const result = await auth_services.get_my_profile_from_db(email);
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully!",
    data: result,
  });
});

const refresh_token = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await auth_services.refresh_token_from_db(refreshToken);
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Refresh token generated successfully!",
    data: result,
  });
});

const change_password = catchAsync(async (req, res) => {
  const user = req?.user;
  const result = await auth_services.change_password_from_db(user!, req.body);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully!",
    data: result,
  });
});

const forget_password = catchAsync(async (req, res) => {
  const { email } = req?.body;
  await auth_services.forget_password_from_db(email);
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verification code sent to your email",
    data: null,
  });
});
const verify_reset_code = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const result = await auth_services.verify_reset_code_from_db(email, code);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Code verified successfully",
    data: result, // resetToken
  });
});
const reset_password = catchAsync(async (req, res) => {
  const { token, newPassword, confirmPassword, email } = req.body;
  const result = await auth_services.reset_password_into_db(
    token,
    email,
    newPassword,
    confirmPassword,
  );
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: result,
  });
});

const verified_account = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const result = await auth_services.verified_account_into_db(email, code);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Account Verification successful.",
    data: result,
  });
});

const get_new_verification_link = catchAsync(async (req, res) => {
  const result = await auth_services.get_new_verification_link_from_db(
    req?.body?.email,
  );
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New Verification code is send on email.",
    data: result,
  });
});

const delete_account = catchAsync(async (req, res) => {
  const user = req.user!;
  const { currentPassword } = req.body;

  await auth_services.delete_account_from_db(user, currentPassword);

  // optional: clear refresh token
  res.clearCookie("refreshToken");

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Account deleted successfully",
    data: null,
  });
});
const change_role = catchAsync(async (req, res) => {
  const user = req.user!;
  const { role } = req.body;

  const result = await auth_services.change_role_from_db(user, role);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role changed successfully",
    data: result, // new access token
  });
});

const get_my_roles = catchAsync(async (req, res) => {
  const result = await auth_services.get_my_roles_from_db(req.user!);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User roles fetched successfully",
    data: result,
  });
});

const change_notification = catchAsync(async (req, res) => {
  const result = await auth_services.change_notification_from_db(
    req.user!,
    req.body.emailNotificationOn,
  );
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User notification changed successfully",
    data: result,
  });
});


export const auth_controllers = {
  register_user,
  login_user,
  google_signin,
  get_my_profile,
  refresh_token,
  change_password,
  reset_password,
  forget_password,
  verify_reset_code,
  verified_account,
  get_new_verification_link,
  delete_account,
  change_role,
  get_my_roles,
  change_notification,
};
