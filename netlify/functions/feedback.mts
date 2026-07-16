import type { Context } from "@netlify/functions";
import { resendFetch } from "../lib/resend.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";
import { tools } from "../../src/data/tools.ts";

/**
 * Tool feedback endpoint for the DJ Tools directory.
 *
 * POST /api/feedback  { toolId, message, email? }
 *
 * The browser only sends the tool id (never the destination address), so
 * author emails stay out of the client and can't be scraped. The server maps
 * the id to its destination: Tango Toolkit tools and any third-party tool
 * without a `feedbackEmail` go to tangotoolkit@gmail.com; third-party tools
 * with a `feedbackEmail` set in src/data/tools.ts reach their author directly.
 *
 * Required environment variables:
 *   RESEND_API_KEY   - Resend API key
 *   RESEND_FROM_EMAIL - optional; defaults to noreply@tangotoolkit.com
 */

const DEFAULT_EMAIL = "tangotoolkit@gmail.com";
const MAX_MESSAGE_LEN = 4000;

/** toolId -> { name, destination email }. */
const ROUTING = new Map(
  tools.map((t) => [
    t.id,
    { name: t.name, email: t.feedbackEmail || DEFAULT_EMAIL },
  ])
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Escape user-supplied text before dropping it into the HTML email body. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "feedback", {
    max: 5,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[feedback] Missing RESEND_API_KEY");
    return new Response("Server configuration error", { status: 500 });
  }

  let body: { toolId?: string; message?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const toolId = typeof body.toolId === "string" ? body.toolId : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const replyEmail = typeof body.email === "string" ? body.email.trim() : "";

  const route = ROUTING.get(toolId);
  if (!route) {
    return new Response("Unknown tool", { status: 400 });
  }
  if (!message) {
    return new Response("Message is required", { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return new Response("Message is too long", { status: 400 });
  }
  if (replyEmail && !EMAIL_RE.test(replyEmail)) {
    return new Response("Invalid email address", { status: 400 });
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "The Tango Toolkit <noreply@tangotoolkit.com>";

  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const fromLine = replyEmail
    ? `<a href="mailto:${escapeHtml(replyEmail)}">${escapeHtml(replyEmail)}</a>`
    : "an anonymous visitor (no reply address given)";

  try {
    const emailPayload: Record<string, unknown> = {
      from: fromEmail,
      to: [route.email],
      subject: `[Tool Feedback] ${route.name}`,
      tags: [
        { name: "type", value: "tool-feedback" },
        { name: "tool", value: toolId },
      ],
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
          <h1 style="color: #f97316; margin-bottom: 0.5rem; font-size: 1.35rem;">New feedback for ${escapeHtml(route.name)}</h1>
          <p style="color: #475569; line-height: 1.6;">Sent from the <a href="https://tangotoolkit.com/dj/tools/" style="color: #f97316;">DJ Tools directory</a> on The Tango Toolkit.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; margin: 1.25rem 0; color: #334155; line-height: 1.6;">${safeMessage}</div>
          <p style="color: #94a3b8; font-size: 0.85rem;">From: ${fromLine}</p>
        </div>
      `,
      text:
        `New feedback for ${route.name} (from tangotoolkit.com/dj/tools/)\n\n` +
        `${message}\n\n` +
        `From: ${replyEmail || "anonymous (no reply address given)"}`,
    };
    if (replyEmail) {
      emailPayload.reply_to = replyEmail;
    }

    const res = await resendFetch("/emails", resendApiKey, emailPayload);
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend send failed: ${res.status} ${errBody}`);
    }
  } catch (err) {
    console.error(`[feedback] Failed to send for "${toolId}":`, err);
    return new Response("Failed to send feedback", { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/feedback",
};
