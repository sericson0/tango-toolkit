/**
 * Centralized product configuration.
 *
 * Every product-specific value lives here so the three Netlify functions
 * (create-checkout-session, stripe-webhook, get-license-info) pull from
 * a single source of truth.
 *
 * Environment variables are read at call time (not module load) so the
 * registry works correctly in both local dev and serverless runtimes.
 */

export interface ProductConfig {
  /** Display name shown in emails and logs */
  name: string;
  /** Stripe Price ID for checkout */
  stripePriceId: string;
  /** Hex-encoded 32-byte secret for license key generation */
  keygenSecret: string;
  /** "From" address for the license email */
  fromEmail: string;
  /** Email subject line */
  subject: string;
  /** Brand accent color (hex) */
  color: string;
  /** One-line tagline shown in the email */
  tagline: string;
  /** HTML <li> items describing how to activate */
  activationSteps: string;
}

export function getProductRegistry(): Record<string, ProductConfig> {
  return {
    hisstory: {
      name: "Hisstory",
      stripePriceId: process.env.HISSTORY_STRIPE_PRICE_ID || "",
      keygenSecret: process.env.HISSTORY_KEYGEN_SECRET || "",
      fromEmail:
        process.env.RESEND_FROM_EMAIL ||
        "Hisstory <noreply@tangotoolkit.com>",
      subject: "Your Hisstory License Key",
      color: "#f97316",
      tagline: "Keep the music, ditch the noise",
      activationSteps: `
            <li>Open Hisstory (standalone or VST3 plugin)</li>
            <li>Click <strong>"Enter Key"</strong></li>
            <li>Paste the key above and click <strong>"Activate"</strong></li>`,
    },
    tigertag: {
      name: "TigerTag",
      stripePriceId: process.env.TIGERTAG_STRIPE_PRICE_ID || "",
      keygenSecret: process.env.TIGERTAG_KEYGEN_SECRET || "",
      fromEmail:
        process.env.RESEND_FROM_EMAIL ||
        "TigerTag <noreply@tangotoolkit.com>",
      subject: "Your TigerTag License Key",
      color: "#f97316",
      tagline: "Tag your tango tunes",
      activationSteps: `
            <li>Open TigerTag</li>
            <li>Click <strong>"Enter Key"</strong></li>
            <li>Paste the key above and click <strong>"Activate"</strong></li>`,
    },
  };
}
