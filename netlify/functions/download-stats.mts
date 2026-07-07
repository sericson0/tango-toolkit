import type { Context } from "@netlify/functions";
import { getAllStats } from "../lib/download-stats.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Returns download counts per tool as JSON: all-time total and trailing-30-day
 * count, sorted by total. Protected by a shared secret so the numbers aren't
 * public.
 *
 * Auth: pass the token via `Authorization: Bearer <token>` or `?token=<token>`.
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

  let tools;
  try {
    tools = await getAllStats();
  } catch (err) {
    console.error("[download-stats] failed to read stats:", err);
    return new Response("Failed to read stats", { status: 502 });
  }

  const body = {
    generatedAt: new Date().toISOString(),
    totalDownloads: tools.reduce((sum, t) => sum + t.total, 0),
    tools,
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
