import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe price IDs — create these in your Stripe dashboard, then add to .env.local:
//   STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxx
//   STRIPE_PRICE_PREMIUM_ANNUAL=price_xxxx
//   STRIPE_PRICE_FAMILY_MONTHLY=price_xxxx
const PRICE_IDS: Record<string, Record<string, string>> = {
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? "",
  },
  family: {
    monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_FAMILY_ANNUAL ?? "",
  },
};

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const { plan = "premium", interval = "monthly", uid, email } = await req.json();

    const priceId = PRICE_IDS[plan]?.[interval];
    if (!priceId) {
      return NextResponse.json(
        { error: `No price ID configured for ${plan}/${interval}. Add it to .env.local` },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?plan=${plan}&interval=${interval}`,
      metadata: { uid: uid ?? "", plan, interval },
      subscription_data: { metadata: { uid: uid ?? "", plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
