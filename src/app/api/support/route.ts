export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { supportEmailHtml } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  const { name, email, subject, message } = await request.json() as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json(
      { error: "Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to your environment variables." },
      { status: 503 }
    );
  }

  const html = supportEmailHtml({ name, email, subject, message });

  try {
    await sendMail({
      to: "jannatieteam@gmail.com",
      replyTo: email,
      subject: `[Support] ${subject}`,
      html,
      from: "Jannatie Support",
    });
  } catch (err) {
    console.error("Support email failed:", err);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
