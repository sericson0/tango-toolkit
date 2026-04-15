import type { Context } from "@netlify/functions";
import { createStripeClient } from "../lib/stripe-client.mts";
import { getProductRegistry } from "../lib/products.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { productId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const products = getProductRegistry();
  const productId = body.productId;
  if (!productId || !products[productId]) {
    return new Response("Invalid product ID", { status: 400 });
  }

  const priceId = products[productId].stripePriceId;
  if (!priceId) {
    return new Response("Product not configured for checkout", { status: 400 });
  }

  let stripe;
  try {
    stripe = createStripeClient();
  } catch (err) {
    console.error(err);
    return new Response("Server configuration error", { status: 500 });
  }

  const origin = new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      consent_collection: { promotions: "auto" },
      allow_promotion_codes: true,
      success_url: `${origin}/dj/paid/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dj/software/`,
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
