import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { configs } from "../configs";

const normalizePrivateKey = (key?: string): string | undefined => {
  if (!key) return undefined;

  let value = key.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value.replace(/\\n/g, "\n");
};

let initAttempted = false;

/** Lazy init so email/password auth still works if Firebase is misconfigured. */
export const getFirebaseAdmin = () => {
  if (admin.apps.length) return admin;

  if (initAttempted) {
    throw new Error("Firebase Admin is not initialized. Check server credentials.");
  }
  initAttempted = true;

  const serviceAccountPath = configs.firebase.service_account_path;

  if (serviceAccountPath) {
    const resolvedPath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath);

    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(resolvedPath, "utf8"),
      ) as admin.ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return admin;
    }
  }

  const projectId = configs.firebase.project_id;
  const clientEmail = configs.firebase.client_email;
  const privateKey =
    normalizePrivateKey(configs.firebase.private_key) ??
    normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return admin;
};

export default admin;
