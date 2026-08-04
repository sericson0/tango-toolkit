import type { Context } from "@netlify/functions";
import {
  normalizePath,
  recordPageView,
  resolvePageId,
  SESSION_KEY,
  UNIQUE_KEY,
} from "../lib/page-stats.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Counts one anonymous page view. Called fire-and-forget from every page via
 * the client helper in `src/components/PageTracker.astro`.
 *
 * Body: { path: string, firstVisit?: boolean, newSession?: boolean }
 *   path        - the page's location.pathname; validated and matched against
 *                 the sitemap so the store can't be filled with arbitrary keys
 *   firstVisit  - true on this browser's first ever visit (unique visitors)
 *   newSession  - true on the first page of this browser session (sessions)
 *
 * No cookies and no identifiers — just aggregate counters. Because the beacon
 * needs JavaScript, crawlers and most bots are excluded for free.
 */

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Roomier than the other endpoints: this fires on every page, so a fast
  // browsing session is normal traffic rather than abuse.
  const rateLimited = checkRateLimit(req, "track-page", {
    max: 60,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  let path: string | null = null;
  let firstVisit = false;
  let newSession = false;
  try {
    const body = await req.json();
    path = normalizePath(body?.path);
    firstVisit = body?.firstVisit === true;
    newSession = body?.newSession === true;
  } catch {
    // fall through to validation below
  }

  if (!path) {
    return new Response("Invalid path", { status: 400 });
  }

  const origin = new URL(req.url).origin;
  await recordPageView(await resolvePageId(path, origin));
  if (firstVisit) await recordPageView(UNIQUE_KEY);
  if (newSession) await recordPageView(SESSION_KEY);

  return new Response(null, { status: 204 });
};

export const config = {
  path: "/api/track-page",
};
