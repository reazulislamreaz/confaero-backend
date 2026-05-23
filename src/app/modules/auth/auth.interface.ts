export type Role =
  | "SUPER_ADMIN"
  | "ORGANIZER"
  | "ATTENDEE"
  | "SPEAKER"
  | "EXHIBITOR"
  | "STAFF"
  | "SPONSOR"
  | "VOLUNTEER"
  | "ABSTRACT_REVIEWER"
  | "TRACK_CHAIR";

export type AuthProvider = "local" | "google";

export type TAccount = {
  email: string;
  password?: string;
  firebaseUid?: string;
  authProvider?: AuthProvider;
  lastPasswordChange?: Date;
  isDeleted?: boolean;
  accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role?: Role[];
  activeRole?: Role;
  refreshToken?: string;
  isVerified?: boolean;
  verificationCode?: string;
  verificationExpire?: Date;
  resetPasswordCode?: String;
  resetPasswordExpire?: Date;
  activeEvent?: any;
  emailNotificationOn: boolean;
};

export interface TRegisterPayload extends TAccount {
  name: string;
  confirmPassword: string;
}

export type TLoginPayload = {
  email: string;
  password: string;
};

export type TJwtUser = {
  email: string;
  activeRole?: Role;
};

export type TChangePasswordPayload = {
  email: string;
  oldPassword: string;
  newPassword: string;
  currentPassword: string;
};
