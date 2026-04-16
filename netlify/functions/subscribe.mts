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

  try {
    await resendFetch(`/audiences/${audienceId}/contacts`, resendApiKey, {
      email,
      first_name: "",
      unsubscribed: false,
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
