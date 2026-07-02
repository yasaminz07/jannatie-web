export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { generatePasswordResetLink } from "@/lib/firebase-admin-rest";
import { sendMail } from "@/lib/mailer";
import { passwordResetEmailHtml } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email?: string };

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const firebaseUrl = await generatePasswordResetLink(email.trim().toLowerCase());

    // Rewrite the Firebase-hosted action URL to our own branded page
    const oobCode = new URL(firebaseUrl).searchParams.get("oobCode");
    const baseUrl = new URL(request.url).origin;
    const resetUrl = `${baseUrl}/reset-password?oobCode=${oobCode}`;

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
    if (code === "auth/user-not-found") {
      return NextResponse.json({ success: true });
    }
    console.error("[password-reset]", err);
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}
