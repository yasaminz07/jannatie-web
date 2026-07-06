export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { updateUserDoc } from "@/lib/firestore-admin";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        const plan = session.metadata?.plan ?? "premium";
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

        if (uid) {
          if (plan === "community_premium") {
            await updateUserDoc(uid, {
              communityPlan: "premium",
              communitySubscriptionStatus: "active",
              ...(customerId     && { stripeCustomerId:      customerId }),
              ...(subscriptionId && { stripeSubscriptionId: subscriptionId }),
            });
          } else {
            await updateUserDoc(uid, {
              plan: plan as "premium" | "family",
              subscriptionStatus: "active",
              ...(customerId     && { stripeCustomerId:      customerId }),
              ...(subscriptionId && { stripeSubscriptionId: subscriptionId }),
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (uid) {
          const priceId = sub.items.data[0]?.price.id;
          const resolvedPlan = planFromPriceId(priceId);
          if (resolvedPlan === "community_premium") {
            await updateUserDoc(uid, {
              communityPlan: "premium",
              stripeSubscriptionId: sub.id,
              communitySubscriptionStatus: sub.status,
            });
          } else {
            await updateUserDoc(uid, {
              plan: resolvedPlan,
              stripeSubscriptionId: sub.id,
              subscriptionStatus: sub.status,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (uid) {
          const priceId = sub.items.data[0]?.price.id;
          const resolvedPlan = planFromPriceId(priceId);
          if (resolvedPlan === "community_premium") {
            await updateUserDoc(uid, { communityPlan: "free", communitySubscriptionStatus: "cancelled" });
          } else {
            await updateUserDoc(uid, { plan: "free", subscriptionStatus: "cancelled" });
          }
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
