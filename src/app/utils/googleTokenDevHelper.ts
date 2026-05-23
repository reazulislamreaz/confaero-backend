import { Express, Request, Response } from "express";
import { configs } from "../configs";

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const googleTokenHtml = (web: FirebaseWebConfig) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Firebase Google ID Token (Swagger testing)</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    button { padding: 0.6rem 1rem; font-size: 1rem; cursor: pointer; }
    textarea { width: 100%; height: 120px; margin-top: 1rem; font-family: monospace; font-size: 12px; }
    .warn { background: #fff3cd; padding: 1rem; border-radius: 6px; margin: 1rem 0; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Get Firebase ID token for Swagger</h1>
  <div class="warn">
    <strong>Do not</strong> paste your Firebase <code>private_key</code> or service account JSON into Swagger.
    This page signs in with Google and gives you a valid <code>idToken</code> for <code>POST /api/v1/auth/google</code>.
  </div>
  ${
    web.apiKey
      ? `<button id="signin">Sign in with Google</button>
  <p id="status"></p>
  <label for="token"><strong>idToken</strong> (copy into Swagger):</label>
  <textarea id="token" readonly placeholder="Sign in to generate token…"></textarea>
  <button id="copy" disabled>Copy to clipboard</button>`
      : `<p style="color:#c00">Set <code>FIREBASE_WEB_API_KEY</code> in <code>.env</code>, then restart the server.</p>`
  }
  <script type="module">
    ${
      web.apiKey
        ? `
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

    const app = initializeApp(${JSON.stringify(web)});
    const auth = getAuth(app);
    const status = document.getElementById("status");
    const tokenEl = document.getElementById("token");
    const copyBtn = document.getElementById("copy");

    document.getElementById("signin").onclick = async () => {
      status.textContent = "Opening Google sign-in…";
      try {
        const cred = await signInWithPopup(auth, new GoogleAuthProvider());
        const idToken = await cred.user.getIdToken();
        tokenEl.value = idToken;
        copyBtn.disabled = false;
        status.textContent = "Signed in as " + cred.user.email;
      } catch (e) {
        status.textContent = "Error: " + (e.message || e);
      }
    };

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(tokenEl.value);
      status.textContent = "Copied! Paste into Swagger → POST /api/v1/auth/google → idToken";
    };
    `
        : ""
    }
  </script>
</body>
</html>`;

const getFirebaseWebConfig = (): FirebaseWebConfig => {
  const projectId = configs.firebase.project_id ?? "confaero-dc284";

  return {
    apiKey: configs.firebase.web.api_key ?? "",
    authDomain:
      configs.firebase.web.auth_domain ?? `${projectId}.firebaseapp.com`,
    projectId,
    ...(configs.firebase.web.storage_bucket && {
      storageBucket: configs.firebase.web.storage_bucket,
    }),
    ...(configs.firebase.web.messaging_sender_id && {
      messagingSenderId: configs.firebase.web.messaging_sender_id,
    }),
    ...(configs.firebase.web.app_id && {
      appId: configs.firebase.web.app_id,
    }),
  };
};

export const setupGoogleTokenDevHelper = (app: Express) => {
  if (configs.env === "production") return;

  app.get("/dev/google-token", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(googleTokenHtml(getFirebaseWebConfig()));
  });
};
