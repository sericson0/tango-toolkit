import type { Context } from "@netlify/functions";
import { resendFetch } from "../lib/resend.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Captures a registration from /dj/register/, adds the contact to the
 * Resend audience, and sends a welcome email containing the Music Starter
 * Package link. Called from JS on form submit (the Netlify Forms submission
 * still happens natively — this function only handles email/audience).
 *
 * Required environment variables:
 *   RESEND_API_KEY     - Resend API key
 *   RESEND_AUDIENCE_ID - Resend Audience ID
 */

const STARTER_PACK_URL =
  "https://drive.google.com/drive/folders/1HtXmrbAP4PekJs3BjziY8KDDL8BQzTs0?usp=sharing";

interface RegisterBody {
  email?: string;
  name?: string;
  focus?: string;
}

function firstName(name: string | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

async function sendWelcomeEmail(
  email: string,
  name: string | undefined,
  focus: string | undefined,
  apiKey: string
): Promise<void> {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "The Tango Toolkit <noreply@tangotoolkit.com>";

  const greetingName = firstName(name) || "there";

  const tags: Array<{ name: string; value: string }> = [
    { name: "type", value: "register" },
    { name: "product", value: "starter-pack" },
  ];
  if (focus) {
    tags.push({ name: "focus", value: focus });
  }

  const response = await resendFetch("/emails", apiKey, {
    from: fromEmail,
    to: [email],
    subject: "Welcome to the Tango Toolkit — your Music Starter Package",
    tags,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h1 style="color: #f97316; margin-bottom: 0.5rem;">Hi ${greetingName},</h1>
        <p style="color: #475569; line-height: 1.7;">Thanks for registering with the Tango Toolkit! As promised, here's your Music Starter Package &mdash; a curated folder of music to help you get started on your tango DJ journey.</p>

        <div style="background: #fff7ed; border: 2px solid #fdba74; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; text-align: center;">
          <h2 style="margin-top: 0; color: #ea580c;">Your Music Starter Package</h2>
          <p style="color: #475569; margin: 0.5rem 0 1rem;">A curated Google Drive folder to get you started.</p>
          <a href="${STARTER_PACK_URL}" style="color: #f97316; font-weight: 600; text-decoration: underline;">Open Music Starter Package &rarr;</a>
        </div>

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
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />
        <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">
          Don't want these emails? <a href="https://tangotoolkit.com/unsubscribe/?email=${encodeURIComponent(email)}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>.
        </p>
      </div>
    `,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend send failed: ${response.status} ${error}`);
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "register", {
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

  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { email, name, focus } = body;

  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Invalid email address", { status: 400 });
  }

  // Normalize optional fields. `req.json()` returns any — a client could send
  // non-string values. Coerce to undefined rather than 400-ing, so a slightly
  // malformed payload still gets the welcome email.
  const safeName = typeof name === "string" ? name : undefined;
  const VALID_FOCUS = new Set(["dance", "dj", "organizer", "everything"]);
  const safeFocus =
    typeof focus === "string" && VALID_FOCUS.has(focus) ? focus : undefined;

  // Add to audience. Resend treats existing contacts as a 200, so re-subscribes
  // are fine. last_name is overridden to "register" as a tracking marker so
  // registrants can be sorted in the audience UI; the user's actual surname
  // lives in Netlify Forms.
  try {
    const audienceRes = await resendFetch(
      `/audiences/${audienceId}/contacts`,
      resendApiKey,
      {
        email,
        first_name: firstName(safeName),
        last_name: "register",
        unsubscribed: false,
      }
    );
    if (!audienceRes.ok) {
      const errBody = await audienceRes.text();
      console.error(
        `[register] Resend audience add failed for ${email}: ${audienceRes.status} ${errBody}`
      );
    }
  } catch (err) {
    console.error(`[register] Resend audience add threw for ${email}:`, err);
  }

  // Send welcome email. Log failures loudly but still return 200 — the client
  // only calls this as a best-effort before the native form submit, and we
  // don't want a Resend outage to cause browser-side retry loops.
  try {
    await sendWelcomeEmail(email, safeName, safeFocus, resendApiKey);
  } catch (emailErr) {
    console.error(`[register] Welcome email failed for ${email}:`, emailErr);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/register",
};
