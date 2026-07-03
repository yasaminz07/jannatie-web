export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserDoc } from "@/lib/firestore-admin";
import { planFromPriceId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  const body = await req.arrayBuffer();
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(body), sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        const plan = (session.metadata?.plan ?? "premium") as "premium" | "family";
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

        if (uid) {
          await updateUserDoc(uid, {
            plan,
            subscriptionStatus: "active",
            ...(customerId     && { stripeCustomerId:      customerId }),
            ...(subscriptionId && { stripeSubscriptionId: subscriptionId }),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (uid) {
          const priceId = sub.items.data[0]?.price.id;
          await updateUserDoc(uid, {
            plan: planFromPriceId(priceId),
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (uid) {
          await updateUserDoc(uid, { plan: "free", subscriptionStatus: "cancelled" });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook]", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
