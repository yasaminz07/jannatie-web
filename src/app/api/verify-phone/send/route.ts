export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomInt } from "crypto";
import { sendMail } from "@/lib/mailer";
import { phoneVerifyEmailHtml } from "@/lib/email-templates";

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

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json(
      { error: "Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to your environment variables." },
      { status: 503 }
    );
  }

  const code = randomInt(100000, 999999).toString();
  const ts = Date.now();
  const expiresAt = ts + 10 * 60 * 1000;
  const token = makeToken(code, phone, uid, ts);

  const greeting = displayName ? `Assalamu Alaykum ${displayName},` : "Assalamu Alaykum,";
  const html = phoneVerifyEmailHtml({ greeting, phone, code });

  try {
    await sendMail({
      to: email,
      subject: `${code} is your Jannatie verification code`,
      html,
      from: "Jannatie",
    });
  } catch (err) {
    console.error("Phone verify email failed:", err);
    return NextResponse.json({ error: "Failed to send verification email." }, { status: 500 });
  }

  return NextResponse.json({ token, ts, expiresAt });
}
