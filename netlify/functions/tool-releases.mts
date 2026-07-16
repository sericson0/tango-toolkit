import type { Context } from "@netlify/functions";
import { getToolReleases } from "../lib/tool-releases.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Public version + last-updated date per tool, for the DJ Tools directory.
 *
 *   GET /api/tool-releases -> { releases: { [toolId]: { version, updated } } }
 *
 * Data comes from each tool's latest GitHub release and is cached server-side
 * (see ../lib/tool-releases.mts) plus at the CDN, so GitHub is rarely hit.
 */

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "tool-releases", {
    max: 60,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  let releases = {};
  try {
    releases = await getToolReleases();
  } catch (err) {
    console.error("[tool-releases] failed to read releases:", err);
    // Non-critical: fall back to empty so the page still renders.
  }

  return new Response(JSON.stringify({ releases }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Cache hard at the CDN so the origin (and GitHub) are rarely hit.
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
};

export const config = {
  path: "/api/tool-releases",
};
