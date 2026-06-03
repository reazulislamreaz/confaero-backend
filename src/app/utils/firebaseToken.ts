import { AppError } from "./app_error";
import httpStatus from "http-status";
import { configs } from "../configs";
import { getFirebaseAdmin } from "../config/firebase";
import type { DecodedIdToken } from "firebase-admin/auth";

const isLikelyPrivateKeyOrSecret = (value: string): boolean => {
  if (/BEGIN\s+(RSA\s+)?PRIVATE\s+KEY/i.test(value)) return true;
  if (/service_account|client_email|private_key_id/i.test(value)) return true;
  // PEM body fragment without JWT dots (common mistake in Swagger)
  if (!value.includes(".") && /^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 80) {
    return true;
  }
  return false;
};

export const sanitizeFirebaseIdToken = (rawToken: string): string => {
  let token = rawToken?.trim().replace(/^Bearer\s+/i, "") ?? "";

  if (!token) {
    throw new AppError("Firebase ID token is required", httpStatus.BAD_REQUEST);
  }

  if (isLikelyPrivateKeyOrSecret(token)) {
    throw new AppError(
      "You sent a Firebase private key or secret, not an ID token. " +
        "Never paste service-account keys into this API. " +
        "Use user.getIdToken() after Google sign-in, or open /dev/google-token to generate a test token.",
      httpStatus.BAD_REQUEST,
    );
  }

  // Allow pasted JWTs with accidental line breaks
  const compact = token.replace(/\s/g, "");
  if (compact.split(".").length === 3) {
    token = compact;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AppError(
      "Invalid token format. A Firebase ID token is a JWT with three parts (header.payload.signature). " +
        "Get it with: const idToken = await user.getIdToken(); after Google sign-in.",
      httpStatus.BAD_REQUEST,
    );
  }

  try {
    const header = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8"),
    ) as { alg?: string; typ?: string };

    if (header.alg === "HS256") {
      throw new AppError(
        "Invalid token: use the Firebase ID token from getIdToken(), not your API access token from /login.",
        httpStatus.UNAUTHORIZED,
      );
    }

    if (header.alg && header.alg !== "RS256") {
      throw new AppError(
        `Unexpected token algorithm "${header.alg}". Firebase ID tokens use RS256.`,
        httpStatus.BAD_REQUEST,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Invalid Firebase ID token header. Paste the full token from user.getIdToken().",
      httpStatus.BAD_REQUEST,
    );
  }

  return token;
};

/** Verifies a Firebase ID token (RS256 JWT from client getIdToken()). */
export const verifyFirebaseIdToken = async (
  rawToken: string,
): Promise<DecodedIdToken> => {
  const token = sanitizeFirebaseIdToken(rawToken);

  try {
    return await getFirebaseAdmin().auth().verifyIdToken(token, true);
  } catch (error) {
    const message = (error as Error)?.message ?? "";
    if (
      message.includes("Firebase credentials") ||
      message.includes("not initialized")
    ) {
      throw new AppError(
        "Firebase authentication is not configured on the server.",
        httpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (configs.env === "development") {
      console.error(
        "[Firebase] verifyIdToken failed:",
        (error as { code?: string })?.code,
        message,
      );
    }
    throw mapFirebaseAuthError(error);
  }
};

export const mapFirebaseAuthError = (error: unknown): AppError => {
  const firebaseError = error as { code?: string; message?: string };

  switch (firebaseError.code) {
    case "auth/id-token-expired":
      return new AppError(
        "Google sign-in token expired. Please sign in with Google again.",
        httpStatus.UNAUTHORIZED,
      );
    case "auth/argument-error":
      return new AppError(
        "Malformed Firebase ID token. Obtain it with user.getIdToken() after Google sign-in.",
        httpStatus.BAD_REQUEST,
      );
    case "auth/invalid-id-token":
      return new AppError(
        "Invalid Firebase ID token. Ensure the frontend uses the same Firebase project (confaero-dc284).",
        httpStatus.UNAUTHORIZED,
      );
    case "auth/project-not-found":
      return new AppError(
        "Firebase project configuration error on the server.",
        httpStatus.INTERNAL_SERVER_ERROR,
      );
    default:
      return new AppError(
        "Invalid or expired Google token",
        httpStatus.UNAUTHORIZED,
      );
  }
};
