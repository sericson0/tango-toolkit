import type { Context } from "@netlify/functions";
import { getLikeCounts, recordLike } from "../lib/likes.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";
import { tools } from "../../src/data/tools.ts";
import { interviews } from "../../src/data/interviews.ts";

/**
 * Public per-tool "like" counts for the DJ Tools directory.
 *
 *   GET  /api/likes            -> { counts: { [toolId]: number } }
 *   POST /api/likes  { toolId, delta: 1 | -1 }  -> 204
 *
 * A like is anonymous and aggregate — no cookies or identifiers. The browser
 * remembers its own likes in localStorage and sends delta +1 (like) or -1
 * (unlike); the server only keeps net counts. `toolId` is validated against the
 * known ids so the blob store can't be polluted with arbitrary keys.
 *
 * The same store also backs the interview library's per-card stars — interview
 * ids share this namespace (they never collide with tool ids), so the reader on
 * either page simply ignores counts for ids it doesn't render.
 */

const VALID_IDS = new Set<string>([
  ...tools.map((t) => t.id),
  ...interviews.map((i) => i.id),
]);

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const rateLimited = checkRateLimit(req, "likes-get", {
      max: 60,
      windowSeconds: 60,
    });
    if (rateLimited) return rateLimited;

    let counts: Record<string, number> = {};
    try {
      counts = await getLikeCounts();
    } catch (err) {
      console.error("[likes] failed to read counts:", err);
      // Non-critical: fall back to empty so the page still renders.
    }

    return new Response(JSON.stringify({ counts }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Brief shared caching keeps repeat loads cheap without going stale.
        "Cache-Control": "public, max-age=30",
      },
    });
  }

  if (req.method === "POST") {
    const rateLimited = checkRateLimit(req, "likes-post", {
      max: 30,
      windowSeconds: 60,
    });
    if (rateLimited) return rateLimited;

    let toolId = "";
    let delta: 1 | -1 = 1;
    try {
      const body = await req.json();
      toolId = typeof body?.toolId === "string" ? body.toolId : "";
      delta = body?.delta === -1 ? -1 : 1;
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    if (!VALID_IDS.has(toolId)) {
      return new Response("Unknown tool", { status: 400 });
    }

    await recordLike(toolId, delta);
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/likes",
};
