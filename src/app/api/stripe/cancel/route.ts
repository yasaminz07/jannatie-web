export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUserDoc, updateUserDoc } from "@/lib/firestore-admin";

export async function POST(request: NextRequest) {
  const { uid } = await request.json() as { uid: string };
  if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

  let userDoc: Record<string, unknown>;
  try {
    userDoc = await getUserDoc(uid);
  } catch {
    return NextResponse.json({ error: "Could not read user data" }, { status: 500 });
  }

  const subscriptionId = (userDoc.stripeSubscriptionId as string | null) ?? null;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription found. If you were manually upgraded, contact jannatieteam@gmail.com to cancel." }, { status: 400 });
  }

  try {
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    // Mark in Firestore so the UI can reflect "cancels at period end"
    const isCommunity = userDoc.accountType === "community";
    if (isCommunity) {
      await updateUserDoc(uid, { communitySubscriptionStatus: "cancelling" });
    } else {
      await updateUserDoc(uid, { subscriptionStatus: "cancelling" });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stripe-cancel]", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
