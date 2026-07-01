export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

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

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1e293b;">
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">Jannatie</h1>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 28px;">Account Security Notice</p>
      <p style="font-size:15px;margin:0 0 12px;">${greeting}</p>
      <p style="font-size:15px;margin:0 0 24px;color:#475569;">
        Your <strong>${label}</strong> was just updated on your Jannatie account.
      </p>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">New ${label}</p>
        <p style="font-size:15px;color:#1e293b;font-weight:600;margin:0;">${maskedValue}</p>
      </div>
      <p style="font-size:14px;color:#64748b;margin:0 0 24px;">
        If this was you, no action is needed. If you did <strong>not</strong> make this change,
        please contact us immediately at <a href="mailto:jannatieteam@gmail.com" style="color:#2563eb;">jannatieteam@gmail.com</a>
        and change your password right away.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
      <p style="font-size:12px;color:#cbd5e1;margin:0;">
        Jannatie · This is an automated security notification · Do not reply
      </p>
    </div>
  `;

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
