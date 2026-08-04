import type { Context } from "@netlify/functions";
import { getAllStats } from "../lib/download-stats.mts";
import { getPageStats } from "../lib/page-stats.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Returns site metrics as JSON: per-tool downloads and usage (`tools`), plus
 * per-page traffic (`pages`). Each row carries an all-time total and a
 * trailing-30-day count, sorted by total. Protected by a shared secret so the
 * numbers aren't public.
 *
 * Auth: pass the token via `Authorization: Bearer <token>` or `?token=<token>`.
 * Query: `?pages=0` skips the page-traffic section.
 *
 * Required environment variables:
 *   STATS_TOKEN - shared secret guarding this endpoint
 */

/** Constant-time string comparison to avoid leaking the token via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "download-stats", {
    max: 10,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  const expected = process.env.STATS_TOKEN;
  if (!expected) {
    console.error("[download-stats] STATS_TOKEN is not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  const url = new URL(req.url);
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("token") ||
    "";

  if (!provided || !safeEqual(provided, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const includePages = url.searchParams.get("pages") !== "0";

  // The two stores are independent, so read them at the same time. A failure in
  // the newer page counters must not take the tool numbers down with it.
  const [toolResult, pageResult] = await Promise.allSettled([
    getAllStats(),
    includePages ? getPageStats() : Promise.resolve(null),
  ]);

  if (toolResult.status === "rejected") {
    console.error("[download-stats] failed to read stats:", toolResult.reason);
    return new Response("Failed to read stats", { status: 502 });
  }
  const tools = toolResult.value;

  if (pageResult.status === "rejected") {
    console.error(
      "[download-stats] failed to read page stats:",
      pageResult.reason
    );
  }

  const body = {
    generatedAt: new Date().toISOString(),
    // Kept for compatibility: the sum of every `tools` row, which includes the
    // "-unique" counters and tool-usage events as well as file downloads.
    totalDownloads: tools.reduce((sum, t) => sum + t.total, 0),
    tools,
    pages: pageResult.status === "fulfilled" ? pageResult.value : null,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};

export const config = {
  path: "/api/download-stats",
};
