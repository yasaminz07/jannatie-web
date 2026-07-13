import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Used by /api/checkout/session
export const PRICE_IDS: Record<string, Record<string, string>> = {
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "",
    annual:  process.env.STRIPE_PRICE_PREMIUM_ANNUAL  ?? "",
  },
  family: {
    monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? "",
    annual:  process.env.STRIPE_PRICE_FAMILY_ANNUAL  ?? "",
  },
  community_premium: {
    monthly: process.env.STRIPE_PRICE_COMMUNITY_MONTHLY ?? "",
    annual:  process.env.STRIPE_PRICE_COMMUNITY_ANNUAL  ?? "",
  },
};

export function planFromPriceId(priceId: string | undefined | null): "premium" | "family" | "community_premium" | "free" {
  const premiumIds   = [process.env.STRIPE_PRICE_PREMIUM_MONTHLY,   process.env.STRIPE_PRICE_PREMIUM_ANNUAL];
  const familyIds    = [process.env.STRIPE_PRICE_FAMILY_MONTHLY,     process.env.STRIPE_PRICE_FAMILY_ANNUAL];
  const communityIds = [process.env.STRIPE_PRICE_COMMUNITY_MONTHLY,  process.env.STRIPE_PRICE_COMMUNITY_ANNUAL];
  if (premiumIds.includes(priceId   ?? "")) return "premium";
  if (familyIds.includes(priceId    ?? "")) return "family";
  if (communityIds.includes(priceId ?? "")) return "community_premium";
  return "free";
}

// Stripe price IDs for one-time gem pack purchases (pack data itself lives
// client-safe in src/lib/gemPacks.ts)
export const GEM_PACK_PRICE_IDS: Record<string, string> = {
  gems_100:  process.env.STRIPE_PRICE_GEMS_100  ?? "",
  gems_500:  process.env.STRIPE_PRICE_GEMS_500  ?? "",
  gems_1500: process.env.STRIPE_PRICE_GEMS_1500 ?? "",
  gems_5000: process.env.STRIPE_PRICE_GEMS_5000 ?? "",
};

export const PLANS = {
  FREE: { name: "Free", price: 0, interval: null },
  PREMIUM_MONTHLY: {
    name: "Premium",
    price: 499,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  },
  PREMIUM_ANNUAL: {
    name: "Premium Annual",
    price: 3999,
    interval: "year",
    priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
  },
  FAMILY: {
    name: "Family",
    price: 999,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_FAMILY_MONTHLY,
  },
  MOSQUE: {
    name: "Mosque",
    price: 2900,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_MOSQUE_MONTHLY,
  },
  SCHOOL: {
    name: "School",
    price: 4900,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_SCHOOL_MONTHLY,
  },
} as const;
