import type { Context } from "@netlify/functions";
import { recordEvent } from "../lib/download-stats.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Counts an anonymous usage event for a free web tool, so we can compare how
 * much each one gets used. Called fire-and-forget from the client when a tool
 * is actually used (e.g. a Name That Tango session starts).
 *
 * Body: { event: string, firstTime?: boolean }
 *   event     - must be one of ALLOWED (whitelisted so the blob store can't be
 *               polluted with arbitrary keys)
 *   firstTime - true on the first use ever from this browser, so unique users
 *               can be told apart from total uses
 *
 * For event "x" this records:
 *   x          - every use (all-time + per-day, surfaced as total / last30)
 *   x-unique   - unique browsers (first use only)
 *
 * No cookies or identifiers — just aggregate counters.
 */

const ALLOWED = new Set<string>([
  "name-that-tango",
  "tanda-builder",
  "discographies",
]);

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "track-event", {
    max: 30,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  let event = "";
  let firstTime = false;
  try {
    const body = await req.json();
    event = typeof body?.event === "string" ? body.event : "";
    firstTime = body?.firstTime === true;
  } catch {
    // fall through to validation below
  }

  if (!ALLOWED.has(event)) {
    return new Response("Unknown event", { status: 400 });
  }

  await recordEvent(event);
  if (firstTime) await recordEvent(`${event}-unique`);

  return new Response(null, { status: 204 });
};

export const config = {
  path: "/api/track-event",
};
