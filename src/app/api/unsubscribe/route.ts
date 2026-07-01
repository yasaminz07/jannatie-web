export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function makeToken(email: string): string {
  const secret = process.env.OTP_SECRET ?? "jannatie-otp-secret-change-me";
  return createHmac("sha256", secret).update(email).digest("hex").slice(0, 32);
}

export function buildUnsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://jannatie.com";
  const token = makeToken(email);
  return `${base}/unsubscribe?e=${encodeURIComponent(email)}&t=${token}`;
}

// GET — verify token then unsubscribe (one-click from email link)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("e");
  const token = searchParams.get("t");

  if (!email || !token) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }

  const expected = makeToken(email.toLowerCase());
  if (token !== expected) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });
  }

  await removeSubscriber(email.toLowerCase());
  return NextResponse.json({ success: true });
}

// POST — unsubscribe from settings page (user is authenticated client-side)
export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email?: string };
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }
  await removeSubscriber(email.trim().toLowerCase());
  return NextResponse.json({ success: true });
}

async function removeSubscriber(email: string) {
  try {
    // deleteDoc on a non-existent doc is a no-op; no need to getDoc first
    // (getDoc would fail server-side — no auth context, rule requires read auth)
    await deleteDoc(doc(db, "newsletterSubscribers", email));
  } catch (err) {
    console.error("Unsubscribe Firestore error:", err);
  }
}
