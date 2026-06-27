export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

function makeToken(code: string, phone: string, uid: string, ts: number): string {
  const secret = process.env.OTP_SECRET ?? "jannatie-otp-secret-change-me";
  return createHmac("sha256", secret).update(`${code}:${phone}:${uid}:${ts}`).digest("hex");
}

export async function POST(request: NextRequest) {
  const { uid, phone, code, token, ts, expiresAt } = await request.json() as {
    uid: string;
    phone: string;
    code: string;
    token: string;
    ts: number;
    expiresAt: number;
  };

  if (!uid || !phone || !code || !token || !ts || !expiresAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (Date.now() > expiresAt) {
    return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
  }

  const expected = makeToken(code.trim(), phone, uid, ts);
  if (expected !== token) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
