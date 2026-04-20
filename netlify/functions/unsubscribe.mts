import type { Context } from "@netlify/functions";
import { resendFetch } from "../lib/resend.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Marks a contact as unsubscribed in the Resend audience.
 * Resend's PATCH endpoint accepts the email address as the contact identifier,
 * so we don't need to look up the contact ID first.
 *
 * Returns 200 even when the email isn't found in the audience, so we don't
 * leak information about which addresses are subscribed.
 */

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "unsubscribe", {
    max: 10,
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

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Invalid email address", { status: 400 });
  }

  try {
    const response = await resendFetch(
      `/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`,
      resendApiKey,
      { unsubscribed: true },
      "PATCH"
    );

    // Treat 404 as success — don't reveal whether the email is in the audience.
    if (!response.ok && response.status !== 404) {
      const errBody = await response.text();
      console.error(
        `[unsubscribe] Resend PATCH failed for ${email}: ${response.status} ${errBody}`
      );
      return new Response(
        JSON.stringify({ error: "Unsubscribe failed. Try again or email tangotoolkit@gmail.com." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[unsubscribe] Marked ${email} as unsubscribed`);
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(`[unsubscribe] Threw for ${email}:`, err);
    return new Response(
      JSON.stringify({ error: "Unsubscribe failed. Try again or email tangotoolkit@gmail.com." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/unsubscribe",
};
