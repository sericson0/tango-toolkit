import type { Context } from "@netlify/functions";
import Stripe from "stripe";
import { createStripeClient } from "../lib/stripe-client.mts";
import { getProductRegistry, type ProductConfig } from "../lib/products.mts";
import { resendFetch } from "../lib/resend.mts";
import { generateLicenseKey } from "../lib/license-key.mts";

/**
 * Stripe Webhook Handler for License Key Delivery
 *
 * Listens for checkout.session.completed events:
 *   1. Identifies the product from session metadata
 *   2. Generates a SHA-512 keyed-hash license key seeded from session.id
 *      (deterministic -- same session always produces the same key)
 *   3. Adds customer to Resend Audience (newsletter or critical-only)
 *   4. Emails the license key via Resend
 */

async function addToResendAudience(
  email: string,
  firstName: string | undefined,
  optedIntoNewsletter: boolean,
  apiKey: string,
  audienceId: string
): Promise<void> {
  const response = await resendFetch(
    `/audiences/${audienceId}/contacts`,
    apiKey,
    {
      email,
      first_name: firstName || "",
      unsubscribed: !optedIntoNewsletter,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(
      `Failed to add contact to Resend Audience: ${response.status} ${error}`
    );
  }
}

async function sendLicenseEmail(
  to: string,
  licenseKey: string,
  apiKey: string,
  product: ProductConfig
): Promise<void> {
  const response = await resendFetch("/emails", apiKey, {
    from: product.fromEmail,
    to: [to],
    subject: product.subject,
    html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
          <h1 style="color: ${product.color}; margin-bottom: 0.5rem;">${product.name}</h1>
          <p style="color: #94a3b8; font-style: italic; margin-top: 0;">${product.tagline}</p>

          <p>Thank you for purchasing ${product.name}! Here is your license key:</p>

          <div style="background: #1e293b; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
            <code style="color: #fb923c; font-size: 0.85rem; word-break: break-all;">${licenseKey}</code>
          </div>

          <h3>How to activate:</h3>
          <ol style="color: #475569; line-height: 1.8;">${product.activationSteps}
          </ol>

          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #334155;">What your license includes</h3>
            <p style="color: #475569; margin-bottom: 0;">Your license is permanent &mdash; no subscription, no expiration. It works offline and includes all future updates.</p>
          </div>

          <div style="margin: 1.5rem 0;">
            <h3 style="color: #334155;">Getting Started</h3>
            <p style="color: #475569;">Ready to dive in? These resources will help you get up and running:</p>
            <ul style="color: #475569; line-height: 1.8; padding-left: 1.25rem;">
              <li><a href="https://tangotoolkit.com/dj/software-setup/" style="color: ${product.color}; text-decoration: underline;">Software Setup Guide</a> &mdash; step-by-step installation and configuration</li>
              <li><a href="https://tangotoolkit.com/dj/starter-kit/" style="color: ${product.color}; text-decoration: underline;">DJ Starter Kit</a> &mdash; everything you need to start DJing tango</li>
            </ul>
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #334155;">Need Help?</h3>
            <p style="color: #475569; margin-bottom: 0;">If you run into any issues or have questions, reach out at <a href="mailto:tangotoolkit@gmail.com" style="color: ${product.color}; text-decoration: underline;">tangotoolkit@gmail.com</a>.</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0;" />
          <p style="color: #94a3b8; font-size: 0.85rem;">
            &mdash; The Tango Toolkit
          </p>
        </div>
      `,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${error}`);
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!webhookSecret || !resendApiKey || !audienceId) {
    console.error("Missing required environment variables");
    return new Response("Server configuration error", { status: 500 });
  }

  let stripe;
  try {
    stripe = createStripeClient();
  } catch (err) {
    console.error(err);
    return new Response("Server configuration error", { status: 500 });
  }

  // Verify webhook signature
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Only handle completed checkouts
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const customerEmail = session.customer_details?.email;

  if (!customerEmail) {
    console.error("No customer email in checkout session:", session.id);
    return new Response("No customer email", { status: 400 });
  }

  const customerName = session.customer_details?.name?.split(" ")[0];
  const optedIntoNewsletter = session.consent?.promotions === "opt_in";

  // Resolve product from checkout metadata
  const productId = session.metadata?.product_id;
  const products = getProductRegistry();
  const product = productId ? products[productId] : undefined;

  if (!product) {
    console.error(`Unknown product_id in session metadata: ${productId}`);
    return new Response("Unknown product", { status: 400 });
  }

  if (!product.keygenSecret) {
    console.error(`Missing keygen secret for product: ${productId}`);
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    // 1. Generate license key (deterministic from session.id)
    const licenseKey = generateLicenseKey(product.keygenSecret, session.id);
    console.log(
      `Generated ${product.name} license key for ${customerEmail} (session: ${session.id})`
    );

    // 2. Add to Resend Audience
    await addToResendAudience(
      customerEmail,
      customerName,
      optedIntoNewsletter,
      resendApiKey,
      audienceId
    );
    console.log(
      `Added ${customerEmail} to audience (newsletter: ${optedIntoNewsletter})`
    );

    // 3. Email license key
    await sendLicenseEmail(customerEmail, licenseKey, resendApiKey, product);
    console.log(`${product.name} license key emailed to ${customerEmail}`);

    return new Response(
      JSON.stringify({ received: true, email_sent: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Failed to process checkout:", err);
    return new Response("Internal error", { status: 500 });
  }
};

export const config = {
  path: "/api/stripe-webhook",
};
