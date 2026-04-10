import type { Context } from "@netlify/functions";
import Stripe from "stripe";
import { createHash, randomBytes } from "node:crypto";

/**
 * Stripe Webhook Handler for Hisstory License Key Delivery
 *
 * Listens for checkout.session.completed events:
 *   1. Generates a SHA-512 keyed-hash license key (matches hisstory keygen.py)
 *   2. Adds customer to Resend Audience (newsletter or critical-only)
 *   3. Emails the license key via Resend
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY        - Stripe API secret key
 *   STRIPE_WEBHOOK_SECRET    - Stripe webhook signing secret (whsec_...)
 *   HISSTORY_KEYGEN_SECRET   - Hex-encoded 32-byte secret (matches keygen.py / LicenseManager.cpp)
 *   RESEND_API_KEY           - Resend API key for sending emails
 *   RESEND_FROM_EMAIL        - Sender email address
 *   RESEND_AUDIENCE_ID       - Resend Audience ID for subscriber storage
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateLicenseKey(secretHex: string): string {
  const secretBytes = Buffer.from(secretHex, "hex");

  // Generate 12 random chars from ALPHABET
  const randBytes = randomBytes(12);
  let payload = "";
  for (let i = 0; i < 12; i++) {
    payload += ALPHABET[randBytes[i] % ALPHABET.length];
  }

  // SHA-512(secret + payload) -> first 4 bytes -> map to ALPHABET for checksum
  const hash = createHash("sha512")
    .update(Buffer.concat([secretBytes, Buffer.from(payload, "utf-8")]))
    .digest();

  let checksum = "";
  for (let i = 0; i < 4; i++) {
    checksum += ALPHABET[hash[i] % ALPHABET.length];
  }

  const full = payload + checksum;
  return `${full.slice(0, 4)}-${full.slice(4, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}`;
}

async function addToResendAudience(
  email: string,
  firstName: string | undefined,
  optedIntoNewsletter: boolean,
  apiKey: string,
  audienceId: string
): Promise<void> {
  const response = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        first_name: firstName || "",
        unsubscribed: !optedIntoNewsletter,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to add contact to Resend Audience: ${response.status} ${error}`);
  }
}

async function sendLicenseEmail(
  to: string,
  licenseKey: string,
  apiKey: string,
  fromEmail: string
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: "Your Hisstory License Key",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
          <h1 style="color: #f97316; margin-bottom: 0.5rem;">Hisstory</h1>
          <p style="color: #94a3b8; font-style: italic; margin-top: 0;">Keep the music, ditch the noise</p>

          <p>Thank you for purchasing Hisstory! Here is your license key:</p>

          <div style="background: #1e293b; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
            <code style="color: #fb923c; font-size: 0.85rem; word-break: break-all;">${licenseKey}</code>
          </div>

          <h3>How to activate:</h3>
          <ol style="color: #475569; line-height: 1.8;">
            <li>Open Hisstory (standalone or VST3 plugin)</li>
            <li>Click <strong>"Enter Key"</strong></li>
            <li>Paste the key above and click <strong>"Activate"</strong></li>
          </ol>

          <p style="color: #475569;">Your license is permanent — no subscription, no expiration. It works offline and includes all future updates.</p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0;" />
          <p style="color: #94a3b8; font-size: 0.85rem;">
            If you have any questions, reply to this email.<br />
            &mdash; The Tango Toolkit
          </p>
        </div>
      `,
    }),
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
  const keygenSecret = process.env.HISSTORY_KEYGEN_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Hisstory <noreply@tangotoolkit.com>";
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!webhookSecret || !keygenSecret || !resendApiKey || !audienceId) {
    console.error("Missing required environment variables");
    return new Response("Server configuration error", { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-03-31.basil",
  });

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

  try {
    // 1. Generate license key
    const licenseKey = generateLicenseKey(keygenSecret);
    console.log(
      `Generated license key for ${customerEmail} (session: ${session.id})`
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
    await sendLicenseEmail(customerEmail, licenseKey, resendApiKey, fromEmail);
    console.log(`License key emailed to ${customerEmail}`);

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
