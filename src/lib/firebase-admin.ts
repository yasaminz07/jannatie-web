import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialise once — reused across requests in prod and hot-reloads in dev
if (!getApps().length) {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
}
