import type { Context } from "@netlify/functions";
import Stripe from "stripe";

const PRODUCT_PRICE_MAP: Record<string, string> = {
  hisstory: process.env.HISSTORY_STRIPE_PRICE_ID || "",
};

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    return new Response("Server configuration error", { status: 500 });
  }

  let body: { productId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const productId = body.productId;
  if (!productId || !PRODUCT_PRICE_MAP[productId]) {
    return new Response("Invalid product ID", { status: 400 });
  }

  const priceId = PRODUCT_PRICE_MAP[productId];
  if (!priceId) {
    return new Response("Product not configured for checkout", { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-03-31.basil",
  });

  const origin = new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      consent_collection: { promotions: "auto" },
      allow_promotion_codes: true,
      success_url: `${origin}/dj/paid/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dj/paid/`,
      metadata: { product_id: productId },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to create checkout session:", err);
    return new Response("Failed to create checkout session", { status: 500 });
  }
};

export const config = {
  path: "/api/create-checkout-session",
};
