import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------
export const PLANS = {
  starter: {
    name: "Starter",
    priceMonthly: 0,
    maxProjects: 2,
    buildMinutesPerMonth: 100,
    maxPlatformsPerBuild: 2,
    artifactRetentionDays: 7,
    stripePriceId: null as string | null, // free tier, no Stripe price
  },
  indie: {
    name: "Indie",
    priceMonthly: 19,
    maxProjects: 10,
    buildMinutesPerMonth: 500,
    maxPlatformsPerBuild: 6,
    artifactRetentionDays: 30,
    stripePriceId: process.env.STRIPE_INDIE_PRICE_ID ?? null,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlan(planId: string | null | undefined) {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.starter;
}
