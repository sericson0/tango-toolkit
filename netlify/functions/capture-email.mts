import type { Context } from "@netlify/functions";
import { resendFetch } from "../lib/resend.mts";

/**
 * Captures an email address for free product downloads.
 * Adds the contact to the Resend audience, then returns the download URL.
 *
 * Required environment variables:
 *   RESEND_API_KEY    - Resend API key
 *   RESEND_AUDIENCE_ID - Resend Audience ID
 */

const DOWNLOAD_URLS: Record<string, string> = {
  tigertanda: "https://github.com/sericson0/TigerTanda/releases",
  tigertango: "https://github.com/sericson0/TigerTango/releases",
};

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

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

  const downloadUrl = DOWNLOAD_URLS[productId];
  if (!downloadUrl) {
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

    return new Response(
      JSON.stringify({ downloadUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Failed to capture email:", err);
    // Still return the download URL even if email capture fails
    return new Response(
      JSON.stringify({ downloadUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/capture-email",
};
