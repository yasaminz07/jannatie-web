export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { securityEmailHtml } from "@/lib/email-templates";

const CHANGE_LABELS: Record<string, string> = {
  name: "Display name",
  username: "Username",
  phone: "Phone number",
  email: "Email address",
};

export async function POST(request: NextRequest) {
  const { to, changeType, newValue, displayName } = await request.json() as {
    to: string;
    changeType: string;
    newValue: string;
    displayName?: string;
  };

  if (!to || !changeType || newValue === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json(
      { error: "Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to your environment variables." },
      { status: 503 }
    );
  }

  const label = CHANGE_LABELS[changeType] ?? changeType;
  const greeting = displayName ? `Assalamu Alaykum ${displayName},` : "Assalamu Alaykum,";
  const maskedValue = changeType === "email"
    ? newValue.replace(/(.{2}).+(@.+)/, "$1***$2")
    : changeType === "phone"
    ? newValue.slice(0, 4) + "****" + newValue.slice(-3)
    : newValue;

  const html = securityEmailHtml({ greeting, label, maskedValue });

  try {
    await sendMail({
      to,
      subject: `Your ${label} was changed — Jannatie Security Notice`,
      html,
      from: "Jannatie Security",
    });
  } catch (err) {
    console.error("Security email failed:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
