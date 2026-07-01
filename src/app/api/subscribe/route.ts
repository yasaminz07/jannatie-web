export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendMail } from "@/lib/mailer";
import { newsletterWelcomeEmailHtml } from "@/lib/email-templates";
import { buildUnsubscribeUrl } from "@/lib/newsletter-utils";

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email?: string };

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();

  // setDoc without reading first — server-side client SDK has no auth context so
  // getDoc would fail the rule; allow create: if true means setDoc always works.
  try {
    await setDoc(doc(db, "newsletterSubscribers", normalised), {
      email: normalised,
      subscribedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Firestore subscribe write failed:", err);
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await sendMail({
        to: normalised,
        subject: "Welcome to Jannatie — you're subscribed 🌙",
        html: newsletterWelcomeEmailHtml({ email: normalised, unsubscribeUrl: buildUnsubscribeUrl(normalised) }),
        from: "Jannatie",
      });
    } catch (err) {
      console.error("Subscribe welcome email failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
