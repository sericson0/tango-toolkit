import Stripe from "stripe";

export const STRIPE_API_VERSION = "2025-03-31.basil" as const;

export function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}
