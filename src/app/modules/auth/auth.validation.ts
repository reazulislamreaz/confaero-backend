import { z } from "zod";

// Zod schema matching TAccount / authSchema
const register_validation = z.object({
  email: z.string({ message: "Email is required" }).email(),
  password: z.string({ message: "Password is required" }),
  confirmPassword: z.string({ message: "confirmPassword is required" }),
  name: z.string({ message: "Name is required" }),
});

const login_validation = z.object({
  email: z.string({ message: "Email is required" }),
  password: z.string({ message: "Email is required" }),
});

const changePassword = z.object({
  oldPassword: z.string({ message: "Old Password is required" }),
  newPassword: z.string({ message: "New Password is required" }),
});

const forgotPassword = z.object({
  email: z.string({ message: "Email is required" }),
});
const verifyResetCode = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});
const resetPassword = z.object({
  token: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
  email: z.string(),
});

const verified_account = z.object({
  email: z.string({ message: "Email is Required!!" }).email(),
  code: z.string({ message: "Code is Required!!" }).length(6),
});

const deleteAccount = z.object({
  currentPassword: z.string().min(6).optional(),
});

const googleSignIn = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
});

const firebaseLogin = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
});

const changeRole = z.object({
  role: z.enum([
    "ORGANIZER",
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ]),
});
export const auth_validation = {
  register_validation,
  login_validation,
  googleSignIn,
  firebaseLogin,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  verified_account,
  deleteAccount,
  changeRole,
};
