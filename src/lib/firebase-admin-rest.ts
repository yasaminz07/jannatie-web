import { createSign } from "crypto";

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const headerB64 = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/identitytoolkit",
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  const { access_token } = await res.json() as { access_token: string };
  return access_token;
}

export async function generatePasswordResetLink(email: string): Promise<string> {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  // Project-scoped admin endpoint — requires NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (!clientEmail || !rawKey || !projectId) {
    throw new Error(
      "Missing Firebase admin credentials (FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID)"
    );
  }

  // Strip surrounding quotes (copy-paste issue) then convert literal \n to real newlines
  const privateKey = rawKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

  const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

  // Must use the project-scoped admin URL — the non-admin /accounts:sendOobCode
  // endpoint ignores returnOobLink and sends Firebase's own email instead
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:sendOobCode`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
        returnOobLink: true,
      }),
    }
  );

  const data = await res.json() as { oobLink?: string; error?: { message: string } };

  if (!res.ok || !data.oobLink) {
    const msg = data.error?.message ?? "unknown error";
    console.error("[firebase-admin-rest] sendOobCode failed:", msg);
    if (msg === "EMAIL_NOT_FOUND") {
      throw Object.assign(new Error("user not found"), { code: "auth/user-not-found" });
    }
    throw new Error(`generatePasswordResetLink failed: ${msg}`);
  }

  return data.oobLink;
}
