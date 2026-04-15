import type { Context } from "@netlify/functions";
import { createStripeClient } from "../lib/stripe-client.mts";
import { getProductRegistry } from "../lib/products.mts";
import { generateLicenseKey } from "../lib/license-key.mts";

/**
 * License Key Recovery
 *
 * Accepts a customer email and searches Stripe for completed checkout
 * sessions. For each session with a recognised product, regenerates the
 * deterministic license key so the customer can recover it without
 * contacting support.
 */

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  let stripe;
  try {
    stripe = createStripeClient();
  } catch (err) {
    console.error(err);
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const products = getProductRegistry();

    const sessions = await stripe.checkout.sessions.list({
      customer_details: { email },
      status: "complete",
      limit: 100,
    });

    const results: { productName: string; licenseKey: string; purchaseDate: string }[] = [];

    for (const session of sessions.data) {
      const productId = session.metadata?.product_id;
      const product = productId ? products[productId] : undefined;

      if (!product || !product.keygenSecret) continue;

      const licenseKey = generateLicenseKey(product.keygenSecret, session.id);
      const purchaseDate = session.created
        ? new Date(session.created * 1000).toISOString()
        : new Date().toISOString();

      results.push({
        productName: product.name,
        licenseKey,
        purchaseDate,
      });
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to recover license keys:", err);
    return new Response("Failed to recover license keys", { status: 500 });
  }
};

export const config = {
  path: "/api/recover-license",
};
