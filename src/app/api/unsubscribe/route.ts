export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { makeUnsubscribeToken } from "@/lib/newsletter-utils";
import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import "@/lib/firebase-admin";

// GET — verify HMAC token then unsubscribe (one-click from email link)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("e");
  const token = searchParams.get("t");

  if (!email || !token) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }

  const expected = makeUnsubscribeToken(email.toLowerCase());
  if (token !== expected) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });
  }

  const normalised = email.toLowerCase();

  // Use Admin SDK Firestore when available — bypasses security rules so we
  // can check existence and distinguish "just removed" vs "already gone"
  if (getApps().length) {
    const adminDb = getFirestore();
    const snap = await adminDb.doc(`newsletterSubscribers/${normalised}`).get();
    if (!snap.exists) {
      return NextResponse.json({ alreadyUnsubscribed: true });
    }
    await adminDb.doc(`newsletterSubscribers/${normalised}`).delete();
    return NextResponse.json({ success: true });
  }

  // Fallback: client SDK deleteDoc (no auth needed; can't detect already-removed)
  await removeSubscriberClientSdk(normalised);
  return NextResponse.json({ success: true });
}

// POST — unsubscribe from settings page button
export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email?: string };
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }
  const normalised = email.trim().toLowerCase();

  if (getApps().length) {
    const adminDb = getFirestore();
    await adminDb.doc(`newsletterSubscribers/${normalised}`).delete();
  } else {
    await removeSubscriberClientSdk(normalised);
  }

  return NextResponse.json({ success: true });
}

async function removeSubscriberClientSdk(email: string) {
  try {
    await deleteDoc(doc(db, "newsletterSubscribers", email));
  } catch (err) {
    console.error("Unsubscribe Firestore error:", err);
  }
}
