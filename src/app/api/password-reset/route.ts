export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebase-admin";
import { sendMail } from "@/lib/mailer";
import { passwordResetEmailHtml } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email?: string };

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!getApps().length) {
    // Admin SDK not configured — tell the client to fall back to Firebase default
    return NextResponse.json({ fallback: true });
  }

  try {
    const resetUrl = await getAuth().generatePasswordResetLink(email.trim().toLowerCase());

    await sendMail({
      to: email.trim().toLowerCase(),
      subject: "Reset your Jannatie password",
      html: passwordResetEmailHtml({
        greeting: "Assalamu Alaykum,",
        resetUrl,
      }),
      from: "Jannatie",
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    // auth/user-not-found — don't reveal whether the email exists
    if (code === "auth/user-not-found") {
      return NextResponse.json({ success: true });
    }
    console.error("Password reset error:", err);
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}
