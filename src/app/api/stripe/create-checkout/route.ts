import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { auth } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, userEmail } = await request.json();

    const planKey = plan?.toUpperCase()?.replace("-", "_") as keyof typeof PLANS;
    const selectedPlan = PLANS[planKey] as { name: string; price: number; interval: string | null; priceId?: string } | undefined;

    if (!selectedPlan || !selectedPlan.priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
