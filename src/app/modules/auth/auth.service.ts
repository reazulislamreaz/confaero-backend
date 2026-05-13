import { AppError } from "../../utils/app_error";
import { TAccount, TLoginPayload, TRegisterPayload } from "./auth.interface";
import { Account_Model } from "./auth.schema";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { jwtHelpers, JwtPayloadType } from "../../utils/JWT";
import { configs } from "../../configs";
import { JwtPayload, Secret } from "jsonwebtoken";
import sendMail from "../../utils/mail_sender";
import { isAccountExist } from "../../utils/isAccountExist";
import { UserProfile_Model } from "../user/user.schema";
// import admin from "../../utils/firebaseAdmin";

// register user
const register_user_into_db = async (payload: TRegisterPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. validation (later section)
    if (
      !payload?.email ||
      !payload?.password ||
      !payload?.confirmPassword ||
      !payload?.name
    ) {
      throw new AppError("All fields are required", httpStatus.BAD_REQUEST);
    }

    // 2. check existing account
    const isExistAccount = await Account_Model.findOne(
      { email: payload.email },
      null,
      { session },
    );

    if (isExistAccount) {
      throw new AppError("Account already exist!!", httpStatus.BAD_REQUEST);
    }

    if (payload.password !== payload.confirmPassword) {
      throw new AppError(
        "New password and confirm password do not match",
        httpStatus.BAD_REQUEST,
      );
    }

    // 3. hash password
    const hashPassword = await bcrypt.hash(payload.password, 10);

    // 4. generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // 5. create account
    const accountPayload: TAccount = {
      email: payload.email,
      password: hashPassword,
      lastPasswordChange: new Date(),
      emailNotificationOn: true,
      verificationCode,
      verificationExpire: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    };

    const newAccount = await Account_Model.create([accountPayload], {
      session,
    });

    if (!newAccount.length) {
      throw new AppError("Failed to create account", httpStatus.BAD_REQUEST);
    }

    // 2️ User profile create
    await UserProfile_Model.create(
      [
        {
          accountId: newAccount[0]._id,
          name: payload.name,
        },
      ],
      { session },
    );

    // 7. Send Verification Email
    await sendMail({
      to: payload.email,
      name: payload.name,
      subject: "Account Verification Code",
      textBody: `Account verification code is successfully created on ${new Date().toLocaleDateString()}`,
      htmlBody: `
            <p>Thanks for creating an account with us. We’re excited to have you on board! Use the code below to
                verify your email and activate your account:</p>


            <div style="text-align: center; margin: 30px 0;">
                <h1 style="background-color: #f4f4f4; color: #333; padding: 10px; display: inline-block; letter-spacing: 5px;">
                    ${verificationCode}
                </h1>
            </div>

            <p>This code is valid for 10 minutes.</p>
            <p>If you did not create this account, please ignore this email.</p>
            `,
    });

    // 6. COMMIT (VERY IMPORTANT)
    await session.commitTransaction();

    const userObj = newAccount[0].toObject();
    userObj.password = "";

    return userObj;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

// login user
const login_user_from_db = async (payload: TLoginPayload) => {
  // check account info
  const isExistAccount = await isAccountExist(payload?.email);

  const isPasswordMatch = await bcrypt.compare(
    payload.password,
    isExistAccount.password,
  );
  if (!isPasswordMatch) {
    throw new AppError("Invalid password", httpStatus.UNAUTHORIZED);
  }
  const accessToken = jwtHelpers.generateToken(
    {
      email: isExistAccount.email,
      id: isExistAccount._id,
      activeRole: isExistAccount.activeRole,
    },
    configs.jwt.access_token as Secret,
    configs.jwt.access_expires as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      email: isExistAccount.email,
      id: isExistAccount._id,
      activeRole: isExistAccount.activeRole,
    },
    configs.jwt.refresh_token as Secret,
    configs.jwt.refresh_expires as string,
  );
  console.log(refreshToken);
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    activeRole: isExistAccount.activeRole,
  };
};

const get_my_profile_from_db = async (email: string) => {
  const isExistAccount = await isAccountExist(email);
  const accountProfile = await UserProfile_Model.findOne({
    accountId: isExistAccount._id,
  });
  isExistAccount.password = "";
  return {
    account: isExistAccount,
    profile: accountProfile,
  };
};

const refresh_token_from_db = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      configs.jwt.refresh_token as Secret,
    );
  } catch (err) {
    throw new Error("You are not authorized!");
  }
  const userData = await Account_Model.findOne({
    email: decodedData.email,
    isDeleted: false,
  });

  const accessToken = jwtHelpers.generateToken(
    {
      email: userData!.email,
      id: userData!._id,
      activeRole: userData!.activeRole,
    },
    configs.jwt.access_token as Secret,
    configs.jwt.access_expires as string,
  );

  return { accessToken };
};

const change_password_from_db = async (
  user: JwtPayloadType,
  payload: {
    email: string;
    oldPassword: string;
    newPassword: string;
    currentPassword: string;
  },
) => {
  const isExistAccount = await isAccountExist(user?.email);

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    isExistAccount.password,
  );

  if (!isCorrectPassword) {
    throw new AppError("Old password is incorrect", httpStatus.UNAUTHORIZED);
  }
  if (isCorrectPassword && payload.oldPassword === payload.newPassword) {
    throw new AppError(
      "Old password and new password can not be same",
      httpStatus.BAD_REQUEST,
    );
  }
  if (payload.newPassword !== payload.currentPassword) {
    throw new AppError(
      "New password and confirm password do not match",
      httpStatus.BAD_REQUEST,
    );
  }

  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 10);
  await Account_Model.findOneAndUpdate(
    { email: isExistAccount.email },
    {
      password: hashedPassword,
      lastPasswordChange: Date(),
    },
  );
  return "Password changed successful.";
};
const forget_password_from_db = async (email: string) => {
  const account = await isAccountExist(email);

  // If existing OTP still valid
  if (
    account.resetPasswordCode &&
    account.resetPasswordExpire &&
    account.resetPasswordExpire > new Date()
  ) {
    // resend same OTP
    await sendMail({
      to: email,
      subject: "Password Reset Code!",
      textBody: "Your password reset code",
      htmlBody: `<h3>${account.resetPasswordCode}</h3>
                 <p>This OTP is valid until ${account.resetPasswordExpire}</p>`,
    });

    return "Previous verification code resent to your email";
  }

  // otherwise generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Account_Model.findByIdAndUpdate(account._id, {
    resetPasswordCode: otp,
    resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000),
  });

  const emailTemplate = `
    <p>This link will expire in 10 minutes.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <br/>
    <p>Alternatively, you can use the following OTP to reset your password:</p>
    <h3>${otp}</h3>
    <p>This OTP is valid for 10 minutes.</p>
    `;

  await sendMail({
    to: email,
    subject: "Password Reset Code!",
    textBody: "Your password is successfully reset.",
    htmlBody: emailTemplate,
  });

  return "New verification code sent to your email";
};
// const forget_password_from_db = async (email: string) => {
//   const isAccountExists = await isAccountExist(email);

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   await Account_Model.findByIdAndUpdate(isAccountExists._id, {
//     resetPasswordCode: otp,
//     resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000), // 10 min
//   });

//   const resetToken = jwtHelpers.generateToken(
//     {
//       email: isAccountExists.email,
//       activeRole: isAccountExists.activeRole,
//     },
//     configs.jwt.reset_secret as Secret,
//     configs.jwt.reset_expires as string,
//   );

//   const resetPasswordLink = `${configs.jwt.front_end_url}/reset?token=${resetToken}&email=${isAccountExists.email}`;
//   const emailTemplate = `<p>Click the link below to reset your password:</p><a href="${resetPasswordLink}">Reset Password</a>
//   <p>This link will expire in 10 minutes.</p>
//   <p>If you did not request a password reset, please ignore this email.</p>
//   <br/>
//   <p>Alternatively, you can use the following OTP to reset your password:</p>
//   <h3>${otp}</h3>
//   <p>This OTP is valid for 10 minutes.</p>
//   `;

//   await sendMail({
//     to: email,
//     subject: "Password Reset Code!",
//     textBody: "Your password is successfully reset.",
//     htmlBody: emailTemplate,
//   });

//   return "Verification code sent to your email";
// };
const verify_reset_code_from_db = async (email: string, code: string) => {
  const account = await Account_Model.findOne({ email });

  if (!account) throw new AppError("Account not found", httpStatus.NOT_FOUND);

  if (
    account.resetPasswordCode !== code ||
    !account.resetPasswordExpire ||
    account.resetPasswordExpire < new Date()
  ) {
    throw new AppError("Invalid or expired code", httpStatus.BAD_REQUEST);
  }

  const resetToken = jwtHelpers.generateToken(
    { email },
    configs.jwt.reset_secret as Secret,
    "10m",
  );

  return { resetToken };
};

const reset_password_into_db = async (
  token: string,
  email: string,
  newPassword: string,
  confirmPassword: string,
) => {
  let decodedData: JwtPayload;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      configs.jwt.reset_secret as Secret,
    );
  } catch (err) {
    throw new AppError(
      "Your reset link is expire. Submit new link request!!",
      httpStatus.UNAUTHORIZED,
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(
      "New password and confirm password do not match",
      httpStatus.BAD_REQUEST,
    );
  }
  const isAccountExists = await isAccountExist(email);

  const hashedPassword: string = await bcrypt.hash(newPassword, 10);

  await Account_Model.findOneAndUpdate(
    { email: isAccountExists.email },
    {
      password: hashedPassword,
      lastPasswordChange: Date(),
    },
  );
  return "Password reset successfully!";
};

const verified_account_into_db = async (email: string, code: string) => {
  const account = await Account_Model.findOne({ email });

  if (!account) {
    throw new AppError("Account not found!!", httpStatus.NOT_FOUND);
  }

  if (account.isDeleted) {
    throw new AppError("Account deleted !!", httpStatus.BAD_REQUEST);
  }

  if (
    account.verificationCode !== code ||
    !account.verificationExpire ||
    account.verificationExpire < new Date()
  ) {
    throw new AppError("Invalid or expired code", httpStatus.BAD_REQUEST);
  }

  const result = await Account_Model.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      verificationCode: null,
      verificationExpire: null,
    },
    { new: true },
  );

  return result;
};

const get_new_verification_link_from_db = async (email: string) => {
  const isExistAccount = await isAccountExist(email);

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  await Account_Model.findByIdAndUpdate(isExistAccount._id, {
    verificationCode,
    verificationExpire: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });

  await sendMail({
    to: email,
    subject: "New Verification Code",
    textBody: `New Account verification code is successfully created on ${new Date().toLocaleDateString()}`,
    htmlBody: `
            <p>Thanks for creating an account with us. We’re excited to have you on board! Use the code below to
                verify your email and activate your account:</p>


            <div style="text-align: center; margin: 30px 0;">
                <h1 style="background-color: #f4f4f4; color: #333; padding: 10px; display: inline-block; letter-spacing: 5px;">
                    ${verificationCode}
                </h1>
            </div>

            <p>This code is valid for 10 minutes.</p>
            <p>If you did not create this account, please ignore this email.</p>
            `,
  });

  return null;
};

// DELETE ACCOUNT
const delete_account_from_db = async (
  user: JwtPayloadType,
  currentPassword: string,
) => {
  const account = await Account_Model.findOne({
    email: user.email,
  });
  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    account.password,
  );

  if (!isPasswordMatch) {
    throw new AppError(
      "Current password is incorrect",
      httpStatus.UNAUTHORIZED,
    );
  }

  await UserProfile_Model.findOneAndDelete({ accountId: account._id });
  await Account_Model.findByIdAndDelete(account._id);
  return null;
};
const change_role_from_db = async (user: JwtPayloadType, role: any) => {
  const account = await Account_Model.findOne({
    email: user.email,
  });

  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }
  if (!account.role!.includes(role)) {
    throw new AppError(
      "You are not allowed to switch to this role",
      httpStatus.FORBIDDEN,
    );
  }
  // optional: prevent same role
  if (account.activeRole === role) {
    throw new AppError("Role already active", httpStatus.BAD_REQUEST);
  }

  account.activeRole = role;
  await account.save();

  //  generate new access token
  const accessToken = jwtHelpers.generateToken(
    {
      email: account.email,
      id: account._id,
      activeRole: role,
    },
    configs.jwt.access_token as Secret,
    configs.jwt.access_expires as string,
  );

  return { accessToken, activeRole: role };
};

const get_my_roles_from_db = async (user: JwtPayloadType) => {
  const account = await Account_Model.findOne(
    { email: user.email },
    { role: 1, activeRole: 1 },
  ).lean();

  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  return {
    roles: account.role, // all assigned roles
    activeRole: account.activeRole, // current active role
  };
};
const change_notification_from_db = async (
  user: JwtPayloadType,
  payload: any,
) => {
  const emailNotificationOn = payload;

  const notification = await Account_Model.updateOne(
    { _id: user },
    { emailNotificationOn },
  );
  return notification;
};

export const auth_services = {
  register_user_into_db,
  login_user_from_db,
  get_my_profile_from_db,
  refresh_token_from_db,
  change_password_from_db,
  forget_password_from_db,
  reset_password_into_db,
  verified_account_into_db,
  get_new_verification_link_from_db,
  verify_reset_code_from_db,
  delete_account_from_db,
  change_role_from_db,
  get_my_roles_from_db,
  change_notification_from_db,
};
