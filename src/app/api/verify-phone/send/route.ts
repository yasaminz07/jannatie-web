export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomInt } from "crypto";

function makeToken(code: string, phone: string, uid: string, ts: number): string {
  const secret = process.env.OTP_SECRET ?? "jannatie-otp-secret-change-me";
  return createHmac("sha256", secret).update(`${code}:${phone}:${uid}:${ts}`).digest("hex");
}

export async function POST(request: NextRequest) {
  const { uid, phone, email, displayName } = await request.json() as {
    uid: string;
    phone: string;
    email: string;
    displayName?: string;
  };

  if (!uid || !phone || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured. Add RESEND_API_KEY to your environment variables." },
      { status: 503 }
    );
  }

  const code = randomInt(100000, 999999).toString();
  const ts = Date.now();
  const expiresAt = ts + 10 * 60 * 1000; // 10 minutes
  const token = makeToken(code, phone, uid, ts);

  const greeting = displayName ? `Assalamu Alaykum ${displayName},` : "Assalamu Alaykum,";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1e293b;">
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">Jannatie</h1>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 28px;">Phone number verification</p>
      <p style="font-size:15px;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:15px;color:#475569;margin:0 0 24px;">
        Use the code below to verify the phone number <strong>${phone}</strong> on your Jannatie account.
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
        <p style="font-size:11px;color:#94a3b8;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;">Verification code</p>
        <p style="font-size:40px;font-weight:800;color:#1d4ed8;letter-spacing:.25em;margin:0;">${code}</p>
        <p style="font-size:12px;color:#94a3b8;margin:8px 0 0;">Expires in 10 minutes</p>
      </div>
      <p style="font-size:14px;color:#64748b;margin:0 0 24px;">
        If you did not request this, you can safely ignore this email. Your account has not been changed.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
      <p style="font-size:12px;color:#cbd5e1;margin:0;">Jannatie · Do not reply to this email</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jannatie <noreply@jannatie.com>",
      to: [email],
      subject: `${code} is your Jannatie verification code`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: (err as { message?: string }).message ?? "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ token, ts, expiresAt });
}
