import crypto from "crypto";

const appId = Number(process.env.ZEGOCLOUD_APP_ID);
const appSign = process.env.ZEGOCLOUD_APP_SIGN as string;

/**
 * Generate ZEGOCLOUD RTC token
 */
export const generateZegoToken = (
  userId: string,
  role: "SPEAKER" | "ATTENDEE",
  roomId: string,
) => {
  if (!appId || !appSign) {
    throw new Error("Zego credentials missing (AppID or AppSign)");
  }

  const effectiveTimeInSeconds = 3 * 60 * 60; // 3 hours
  const payload = {
    app_id: appId,
    user_id: userId,
    nonce: Math.floor(Math.random() * 100000),
    ctime: Math.floor(Date.now() / 1000),
    expire: effectiveTimeInSeconds,
    room_id: roomId,
    privilege: {
      // Speaker can publish audio/video
      publish: role === "SPEAKER" ? 1 : 0,
      // Everyone can join
      join: 1,
    },
  };

  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString).toString("base64");

  // HMAC-SHA256 signature using AppSign as a binary buffer (from hex)
  const hmac = crypto.createHmac("sha256", Buffer.from(appSign, "hex"));
  const signature = hmac.update(payloadBase64).digest("hex");

  return `${payloadBase64}.${signature}`;
};
