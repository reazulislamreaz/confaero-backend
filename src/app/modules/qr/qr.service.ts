import jwt from "jsonwebtoken";
import { TQrPayload } from "./qr.interface";
import { verifyQrToken } from "../../utils/qrCode.ts/verifyQrToken";

const QR_SECRET = process.env.QR_SECRET as string;

const generate_qr_token = (
  userId: string,
  activeRole?: TQrPayload["activeRole"],
  eventId?: any,
) => {
  const payload: TQrPayload = {
    userId,
    activeRole: activeRole || "ATTENDEE",
    eventId,
    type: "QR_ACCESS",
  };

  const token = jwt.sign(payload, QR_SECRET, {
    expiresIn: "30d",
  });

  return { qrToken: token };
};


type ScanResult =
  | {
      action: "CHECK_IN";
      attendeeId: string;
      eventId: string;
      checkedInBy: string;
    }
  | {
      action: "CONNECTION";
      scannerId: string;
      scannedUserId: string;
      eventId: string;
    }
  | {
      action: "LEAD";
      exhibitorId: string;
      attendeeId: string;
      eventId: string;
      scannedBy: string;
    };

export const scan_qr_token = async (
  qrToken: string,
  scanner?: {
    id: string;
    activeRole: "ATTENDEE" | "VOLUNTEER" | "EXHIBITOR" | "STAFF";
    eventId: string;
  },
): Promise<ScanResult | any> => {
  const payload = verifyQrToken(qrToken);

  if (!payload) {
    throw new Error("Invalid or expired QR code");
  }

  // backward compatibility (if used only to read QR)
  if (!scanner) {
    return payload;
  }

  // same event check (VERY IMPORTANT)

  if (scanner.eventId !== payload.eventId) {
    throw new Error("QR code is not from this event");
  }

  switch (scanner.activeRole) {
    case "VOLUNTEER":
      return {
        action: "CHECK_IN",
        attendeeId: payload.userId,
        eventId: payload.eventId,
        checkedInBy: scanner.id,
      };

    case "ATTENDEE":
      if (scanner.id === payload.userId) {
        throw new Error("You cannot scan your own QR code");
      }

      return {
        action: "CONNECTION",
        scannerId: scanner.id,
        scannedUserId: payload.userId,
        eventId: payload.eventId,
      };

    case "EXHIBITOR":
      return {
        action: "LEAD",
        exhibitorId: scanner.id,
        attendeeId: payload.userId,
        eventId: payload.eventId,
        scannedBy: scanner.id,
      };

    case "STAFF": {
      // For staff, we need to find which exhibitor they belong to
      // We'll import these models inside to avoid circular dependencies if any, 
      // but better to handle it in the service layer or utility.
      // For now, let's return the scannedBy and let the utility handle the exhibitor resolution or do it here.
      return {
        action: "LEAD",
        exhibitorId: null, // To be resolved in the utility or next step
        attendeeId: payload.userId,
        eventId: payload.eventId,
        scannedBy: scanner.id,
      };
    }

    default:
      throw new Error("This role cannot scan attendee QR");
  }
};

export const qr_service = {
  generate_qr_token,
  scan_qr_token,
};
