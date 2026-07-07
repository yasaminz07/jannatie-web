import { createSign } from "crypto";

async function getFirestoreAccessToken(): Promise<string> {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!clientEmail || !rawKey) throw new Error("Missing Firebase admin credentials");

  const privateKey = rawKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const headerB64 = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");

  const unsigned = `${headerB64}.${payloadB64}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const sig = sign.sign(privateKey, "base64url");
  const jwt = `${unsigned}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  const { access_token } = await res.json() as { access_token: string };
  return access_token;
}

type FieldValue = string | number | boolean | null;

export async function updateUserDoc(userId: string, fields: Record<string, FieldValue>): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  const accessToken = await getFirestoreAccessToken();
  const updateMask = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");

  const firestoreFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === null)            firestoreFields[key] = { nullValue: "NULL_VALUE" };
    else if (typeof value === "boolean") firestoreFields[key] = { booleanValue: value };
    else if (typeof value === "number")  firestoreFields[key] = { integerValue: String(value) };
    else                           firestoreFields[key] = { stringValue: value };
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?${updateMask}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) throw new Error(`Firestore update failed: ${await res.text()}`);
}

export async function getUserDoc(userId: string): Promise<Record<string, unknown>> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const accessToken = await getFirestoreAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Firestore get failed: ${await res.text()}`);
  const doc = await res.json() as { fields?: Record<string, { stringValue?: string }> };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) {
    out[k] = v.stringValue ?? null;
  }
  return out;
}
