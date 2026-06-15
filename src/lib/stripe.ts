import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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
