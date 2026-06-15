import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const plan = subscription.metadata?.plan;

    if (userId && plan) {
      const ref = doc(db, "users", userId);
      await updateDoc(ref, {
        plan: plan.toLowerCase().split("_")[0],
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (userId) {
      const ref = doc(db, "users", userId);
      await updateDoc(ref, { plan: "free", subscriptionStatus: "cancelled" });
    }
  }

  return NextResponse.json({ received: true });
}
