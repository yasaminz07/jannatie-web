// Client-safe gem pack definitions — no Stripe SDK import here.
// Price IDs live server-side in src/lib/stripe.ts (GEM_PACK_PRICE_IDS).
export const GEM_PACKS = [
  { id: "gems_100",  gems: 100,  pence: 99,   label: "Starter" },
  { id: "gems_500",  gems: 500,  pence: 399,  label: "Boost"   },
  { id: "gems_1500", gems: 1500, pence: 999,  label: "Power"   },
  { id: "gems_5000", gems: 5000, pence: 2499, label: "Mega"    },
] as const;

export type GemPackId = (typeof GEM_PACKS)[number]["id"];
