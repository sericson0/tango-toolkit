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
  /** URL to the product's user guide */
  guideUrl: string;
  /** Label for the guide link */
  guideLabel: string;
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
            <li>Open Hisstory</li>
            <li>Click <strong>"Enter Key"</strong></li>
            <li>Paste the key above and click <strong>"Activate"</strong></li>`,
      guideUrl: "https://tangotoolkit.com/documentation/Hisstory%20User%20Guide.pdf",
      guideLabel: "Hisstory User Guide (PDF)",
    },
    "hisstory-lite": {
      name: "Hisstory Lite",
      stripePriceId: process.env.HISSTORY_LITE_STRIPE_PRICE_ID || "",
      // Signed with the Lite secret so the key only unlocks the "Hisstory Lite"
      // plugin, not the full "Hisstory" plugin. Must match `liteSecret` in the
      // Hisstory app's LicenseManager.cpp / keygen.py.
      keygenSecret: process.env.HISSTORY_LITE_KEYGEN_SECRET || "",
      fromEmail:
        process.env.RESEND_FROM_EMAIL ||
        "Hisstory <noreply@tangotoolkit.com>",
      subject: "Your Hisstory Lite License Key",
      color: "#f97316",
      tagline: "Keep the music, ditch the noise",
      activationSteps: `
            <li>Open the <strong>Hisstory Lite</strong> plugin (bundled with the Hisstory installer)</li>
            <li>Click <strong>"Enter Key"</strong></li>
            <li>Paste the key above and click <strong>"Activate"</strong></li>`,
      guideUrl: "https://tangotoolkit.com/documentation/Hisstory%20User%20Guide.pdf",
      guideLabel: "Hisstory User Guide (PDF)",
    },
    "hisstory-upgrade": {
      name: "Hisstory (Full Upgrade)",
      stripePriceId: process.env.HISSTORY_UPGRADE_STRIPE_PRICE_ID || "",
      // Reuses the FULL Hisstory secret so the upgrade delivers a real full
      // license key — the same one a $40 buyer receives.
      keygenSecret: process.env.HISSTORY_KEYGEN_SECRET || "",
      fromEmail:
        process.env.RESEND_FROM_EMAIL ||
        "Hisstory <noreply@tangotoolkit.com>",
      subject: "Your Hisstory Full License Key",
      color: "#f97316",
      tagline: "Keep the music, ditch the noise",
      activationSteps: `
            <li>Open the full <strong>Hisstory</strong> plugin (standalone or VST3)</li>
            <li>Click <strong>"Enter Key"</strong></li>
            <li>Paste the key above and click <strong>"Activate"</strong> to unlock the full version</li>`,
      guideUrl: "https://tangotoolkit.com/documentation/Hisstory%20User%20Guide.pdf",
      guideLabel: "Hisstory User Guide (PDF)",
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
      guideUrl: "https://tangotoolkit.com/documentation/TigerTag%20User%20Guide.pdf",
      guideLabel: "TigerTag User Guide (PDF)",
    },
  };
}
