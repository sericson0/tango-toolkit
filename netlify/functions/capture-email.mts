import type { Context } from "@netlify/functions";
import { resendFetch } from "../lib/resend.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Captures an email address for free product downloads.
 * Adds the contact to the Resend audience, sends a welcome email
 * with relevant guide if available, then returns the download URL.
 *
 * Required environment variables:
 *   RESEND_API_KEY    - Resend API key
 *   RESEND_AUDIENCE_ID - Resend Audience ID
 */

interface ProductInfo {
  downloadUrl: string;
  name: string;
  guideUrl?: string;
  guideLabel?: string;
}

const PRODUCTS: Record<string, ProductInfo> = {
  tigertanda: {
    downloadUrl: "https://github.com/sericson0/TigerTanda/releases",
    name: "TigerTanda",
    guideUrl: "https://tangotoolkit.com/documentation/TigerTanda%20Quickstart%20Guide.pdf",
    guideLabel: "TigerTanda Quickstart Guide (PDF)",
  },
  tigertango: {
    downloadUrl: "https://github.com/sericson0/TigerTango/releases",
    name: "TigerTango",
  },
};

async function sendWelcomeEmail(
  email: string,
  product: ProductInfo,
  apiKey: string
): Promise<void> {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "The Tango Toolkit <noreply@tangotoolkit.com>";

  const guideSection = product.guideUrl
    ? `
          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #334155;">Getting Started</h3>
            <p style="color: #475569; margin-bottom: 0;">Download the <a href="${product.guideUrl}" style="color: #f97316; text-decoration: underline;">${product.guideLabel}</a> to get up and running quickly.</p>
          </div>`
    : "";

  await resendFetch("/emails", apiKey, {
    from: fromEmail,
    to: [email],
    subject: `Welcome to ${product.name}`,
    html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
          <h1 style="color: #f97316; margin-bottom: 0.5rem;">Thanks for downloading ${product.name}!</h1>
          <p style="color: #475569; line-height: 1.7;">You're now signed up for updates on ${product.name} and other Tango Toolkit tools.</p>
          ${guideSection}
          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #334155;">More from the Tango Toolkit</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 1.25rem;">
              <li><a href="https://tangotoolkit.com/dj/starter-kit/" style="color: #f97316;">DJ Starter Kit</a> &mdash; everything you need to start tango DJing</li>
              <li><a href="https://tangotoolkit.com/dj/software/" style="color: #f97316;">DJ Tools</a> &mdash; software built for tango DJs</li>
              <li><a href="https://tangotoolkit.com/dj/resources/" style="color: #f97316;">Discographies</a> &mdash; nearly 15,000 tangos from 40+ artists</li>
              <li><a href="https://tangotoolkit.com/dj/tanda-builder/" style="color: #f97316;">Tanda Builder</a> &mdash; find the perfect tracks for your tandas</li>
            </ul>
          </div>

          <p style="color: #475569; line-height: 1.7;">If you have any questions or feedback, reply to this email or reach out at <a href="mailto:tangotoolkit@gmail.com" style="color: #f97316; text-decoration: underline;">tangotoolkit@gmail.com</a>.</p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0;" />
          <p style="color: #94a3b8; font-size: 0.85rem;">&mdash; Sean Ericson, creator of the Tango Toolkit</p>
        </div>
      `,
  });
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "capture-email", {
    max: 5,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!resendApiKey || !audienceId) {
    console.error("Missing RESEND_API_KEY or RESEND_AUDIENCE_ID");
    return new Response("Server configuration error", { status: 500 });
  }

  let body: { email?: string; productId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { email, productId } = body;

  if (!email || !productId) {
    return new Response("Missing email or productId", { status: 400 });
  }

  const product = productId ? PRODUCTS[productId] : undefined;
  if (!product) {
    return new Response("Invalid product ID", { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Invalid email address", { status: 400 });
  }

  try {
    await resendFetch(`/audiences/${audienceId}/contacts`, resendApiKey, {
      email,
      first_name: "",
      unsubscribed: false,
    });

    // Send welcome email with guide link
    try {
      await sendWelcomeEmail(email, product, resendApiKey);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
      // Don't fail the request if welcome email fails
    }

    return new Response(
      JSON.stringify({ downloadUrl: product.downloadUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Failed to capture email:", err);
    // Still return the download URL even if email capture fails
    return new Response(
      JSON.stringify({ downloadUrl: product.downloadUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/capture-email",
};
