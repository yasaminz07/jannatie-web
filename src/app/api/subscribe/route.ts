export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendMail } from "@/lib/mailer";
import { newsletterWelcomeEmailHtml } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email?: string };

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();

  try {
    const ref = doc(collection(db, "newsletterSubscribers"), normalised);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, { email: normalised, subscribedAt: new Date().toISOString() });
    }
  } catch (err) {
    console.error("Firestore subscribe write failed:", err);
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await sendMail({
        to: normalised,
        subject: "Welcome to Jannatie — you're subscribed 🌙",
        html: newsletterWelcomeEmailHtml({ email: normalised }),
        from: "Jannatie",
      });
    } catch (err) {
      console.error("Subscribe welcome email failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
