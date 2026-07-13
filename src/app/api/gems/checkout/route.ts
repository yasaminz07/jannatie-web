import { NextRequest, NextResponse } from "next/server";
import { stripe, GEM_PACK_PRICE_IDS } from "@/lib/stripe";
import { GEM_PACKS } from "@/lib/gemPacks";

export async function POST(request: NextRequest) {
  try {
    const { packId, userId, userEmail } = await request.json() as {
      packId: string;
      userId: string;
      userEmail: string;
    };

    const pack = GEM_PACKS.find((p) => p.id === packId);
    const priceId = pack ? GEM_PACK_PRICE_IDS[pack.id] : "";
    if (!pack || !priceId) {
      return NextResponse.json({ error: "Invalid gem pack" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gems?purchased=${pack.gems}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/gems`,
      metadata: { type: "gems", gemsAmount: String(pack.gems), userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Gems checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
