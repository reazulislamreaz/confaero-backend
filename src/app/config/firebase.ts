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
let lastInitError: string | null = null;

const projectRoot = path.resolve(__dirname, "../../..");

const resolveServiceAccountFilePath = (): string | undefined => {
  const configured = configs.firebase.service_account_path?.trim();
  if (!configured) return undefined;

  const candidates = new Set<string>();

  if (path.isAbsolute(configured)) {
    candidates.add(configured);
  } else {
    candidates.add(path.resolve(process.cwd(), configured));
    candidates.add(path.resolve(projectRoot, configured));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return undefined;
};

const loadServiceAccountFromFile = (): admin.ServiceAccount | undefined => {
  const filePath = resolveServiceAccountFilePath();
  if (!filePath) return undefined;

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as admin.ServiceAccount;
};

const loadServiceAccountFromEnvJson = (): admin.ServiceAccount | undefined => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON.",
    );
  }
};

const loadServiceAccountFromEnvFields = (): admin.ServiceAccount | undefined => {
  const projectId = configs.firebase.project_id;
  const clientEmail = configs.firebase.client_email;
  const privateKey =
    normalizePrivateKey(configs.firebase.private_key) ??
    normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) return undefined;

  return { projectId, clientEmail, privateKey };
};

const initializeFirebaseAdmin = (): typeof admin => {
  if (admin.apps.length) return admin;

  const serviceAccount =
    loadServiceAccountFromFile() ??
    loadServiceAccountFromEnvJson() ??
    loadServiceAccountFromEnvFields();

  if (!serviceAccount) {
    const configuredPath = configs.firebase.service_account_path;
    const triedPath = configuredPath
      ? resolveServiceAccountFilePath() ?? configuredPath
      : "(not set)";

    throw new Error(
      `Firebase credentials missing. Place service account at secrets/firebase-admin.json (tried: ${triedPath}) ` +
        `or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env`,
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    lastInitError = null;
    return admin;
  } catch (error) {
    const message = (error as Error)?.message ?? "Unknown Firebase init error";
    lastInitError = message;
    throw new Error(`Firebase Admin failed to initialize: ${message}`);
  }
};

/** Lazy init so email/password auth still works if Firebase is misconfigured. */
export const getFirebaseAdmin = () => {
  if (admin.apps.length) return admin;

  if (initAttempted && lastInitError) {
    throw new Error(lastInitError);
  }

  initAttempted = true;

  try {
    return initializeFirebaseAdmin();
  } catch (error) {
    initAttempted = false;
    throw error;
  }
};

export const isFirebaseAdminReady = (): boolean => admin.apps.length > 0;

export default admin;
