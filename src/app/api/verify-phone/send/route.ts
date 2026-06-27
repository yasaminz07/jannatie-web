export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomInt } from "crypto";

function makeToken(code: string, phone: string, uid: string, ts: number): string {
  const secret = process.env.OTP_SECRET ?? "jannatie-otp-secret-change-me";
  return createHmac("sha256", secret).update(`${code}:${phone}:${uid}:${ts}`).digest("hex");
}

export async function POST(request: NextRequest) {
  const { uid, phone } = await request.json() as { uid: string; phone: string };

  if (!uid || !phone) {
    return NextResponse.json({ error: "Missing uid or phone" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: "SMS service not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER to your environment variables." },
      { status: 503 }
    );
  }

  const code = randomInt(100000, 999999).toString();
  const ts = Date.now();
  const expiresAt = ts + 10 * 60 * 1000; // 10 minutes
  const token = makeToken(code, phone, uid, ts);

  const body = `Your Jannatie verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this message.`;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: fromNumber, Body: body }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message ?? "SMS failed" }, { status: 500 });
  }

  return NextResponse.json({ token, ts, expiresAt });
}
