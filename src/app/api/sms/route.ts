export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { to, senderName, friendName } = await request.json();

  if (!to || !senderName || !friendName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const message = `As-salamu alaykum ${friendName}! ${senderName} is sending you a reminder from Jannatie to check in on your daily habits. Keep going — every small step counts!`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: "SMS service not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER to your environment variables." },
      { status: 503 }
    );
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: message }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message ?? "SMS failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
