import type { Context } from "@netlify/functions";
import { resendFetch } from "../lib/resend.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Newsletter subscribe endpoint.
 * Adds the contact to the Resend audience.
 */

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "subscribe", {
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

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { email } = body;

  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Invalid email address", { status: 400 });
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "The Tango Toolkit <noreply@tangotoolkit.com>";

  try {
    // Add to audience
    await resendFetch(`/audiences/${audienceId}/contacts`, resendApiKey, {
      email,
      first_name: "",
      unsubscribed: false,
    });

    // Send welcome email
    await resendFetch("/emails", resendApiKey, {
      from: fromEmail,
      to: [email],
      subject: "Welcome to The Tango Toolkit",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
          <h1 style="color: #f97316; margin-bottom: 0.5rem;">Welcome to The Tango Toolkit</h1>
          <p style="color: #475569; line-height: 1.7;">Thanks for subscribing! You'll receive updates on new tools, features, and tango resources.</p>

          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #334155;">Here's what we offer</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 1.25rem;">
              <li><a href="https://tangotoolkit.com/dj/starter-kit/" style="color: #f97316;">DJ Starter Kit</a> &mdash; everything you need to start tango DJing</li>
              <li><a href="https://tangotoolkit.com/dj/software/" style="color: #f97316;">DJ Tools</a> &mdash; software built for tango DJs</li>
              <li><a href="https://tangotoolkit.com/dj/resources/" style="color: #f97316;">Discographies</a> &mdash; nearly 15,000 tangos from 40+ artists</li>
              <li><a href="https://tangotoolkit.com/dj/tanda-builder/" style="color: #f97316;">Tanda Builder</a> &mdash; find the perfect tracks for your tandas</li>
            </ul>
          </div>

          <p style="color: #475569; line-height: 1.7;">If you have any questions, ideas, or feedback, just reply to this email or reach out at <a href="mailto:tangotoolkit@gmail.com" style="color: #f97316; text-decoration: underline;">tangotoolkit@gmail.com</a>.</p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0;" />
          <p style="color: #94a3b8; font-size: 0.85rem;">&mdash; Sean Ericson, creator of the Tango Toolkit</p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Failed to subscribe:", err);
    return new Response("Subscription failed", { status: 500 });
  }
};

export const config = {
  path: "/api/subscribe",
};
