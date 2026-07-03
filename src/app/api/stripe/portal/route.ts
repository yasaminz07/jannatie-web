export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const { customerId } = await request.json() as { customerId?: string };

  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account linked. Please contact support." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
