import { initializeApp, getApps, cert } from "firebase-admin/app";

if (!getApps().length) {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  // Normalise private key: strip surrounding quotes (copy-paste from JSON adds them),
  // then convert literal \n sequences to real newlines
  const privateKey = rawKey
    ?.replace(/^["']|["']$/g, "")   // strip leading/trailing " or '
    ?.replace(/\\n/g, "\n");         // literal \n → real newline

  if (!clientEmail || !rawKey || !projectId) {
    console.warn(
      "[firebase-admin] Missing env vars — SDK will not initialise.",
      { hasClientEmail: !!clientEmail, hasPrivateKey: !!rawKey, hasProjectId: !!projectId }
    );
  } else {
    try {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: privateKey! }),
      });
      console.log("[firebase-admin] Initialised successfully for project:", projectId);
    } catch (err) {
      console.error("[firebase-admin] initializeApp failed:", err);
    }
  }
}
