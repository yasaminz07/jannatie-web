export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendMail } from "@/lib/mailer";
import { newsletterEmailHtml } from "@/lib/email-templates";
import { buildUnsubscribeUrl } from "@/app/api/unsubscribe/route";

export async function POST(request: NextRequest) {
  const { subject, body, adminEmail } = await request.json() as {
    subject?: string;
    body?: string;
    adminEmail?: string;
  };

  if (adminEmail !== "jannatieteam@gmail.com") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ error: "Gmail not configured." }, { status: 503 });
  }

  let subscribers: string[] = [];
  try {
    const snap = await getDocs(collection(db, "newsletterSubscribers"));
    subscribers = snap.docs.map(d => d.id);
  } catch (err) {
    console.error("Failed to fetch subscribers:", err);
    return NextResponse.json({ error: "Could not fetch subscribers." }, { status: 500 });
  }

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "No subscribers yet." });
  }

  let sent = 0;
  let failed = 0;

  // Send in small batches to avoid rate limits
  const BATCH = 5;
  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (email) => {
        try {
          await sendMail({
            to: email,
            subject,
            html: newsletterEmailHtml({
              subject,
              body,
              unsubscribeUrl: buildUnsubscribeUrl(email),
            }),
            from: "Jannatie",
          });
          sent++;
        } catch {
          failed++;
        }
      })
    );
    // Small delay between batches to stay within Gmail rate limits
    if (i + BATCH < subscribers.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
