import { model, Schema } from "mongoose";
import { TAccount } from "./auth.interface";

const authSchema = new Schema<TAccount>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    firebaseUid: { type: String, sparse: true, unique: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    lastPasswordChange: { type: Date },
    isDeleted: { type: Boolean, default: false },
    accountStatus: { type: String, default: "ACTIVE" },
    role: {
      type: [String],
      default: ["ATTENDEE"],
    },
    activeRole: { type: String, default: "ATTENDEE" },
    refreshToken: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpire: { type: Date },
    resetPasswordCode: { type: String },
    resetPasswordExpire: { type: Date },
    activeEvent: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    emailNotificationOn: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const Account_Model = model("account", authSchema);
