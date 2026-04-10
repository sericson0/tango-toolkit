import type { Context } from "@netlify/functions";
import Stripe from "stripe";
import { generateLicenseKey } from "../lib/license-key.mts";

/**
 * Returns the license key and email for a completed Stripe Checkout Session.
 *
 * Called by the purchase success page to display the key directly in the
 * browser (in addition to the email sent by the webhook). The key is
 * deterministic from session.id, so the value matches what the webhook
 * sends in the email.
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY        - Stripe API secret key
 *   HISSTORY_KEYGEN_SECRET   - Hex-encoded 32-byte secret
 */

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const keygenSecret = process.env.HISSTORY_KEYGEN_SECRET;

  if (!stripeSecretKey || !keygenSecret) {
    console.error("Missing required environment variables");
    return new Response("Server configuration error", { status: 500 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return new Response("Missing session_id", { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-03-31.basil",
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const email = session.customer_details?.email ?? null;
    const licenseKey = generateLicenseKey(keygenSecret, session.id);

    return new Response(
      JSON.stringify({ email, licenseKey }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Failed to retrieve session:", err);
    return new Response("Failed to retrieve session", { status: 500 });
  }
};

export const config = {
  path: "/api/get-license-info",
};
