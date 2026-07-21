import type { Context } from "@netlify/functions";
import { recordDownload } from "../lib/download-stats.mts";

/**
 * Counts a download of a static file (e.g. the set-list spreadsheets) and
 * redirects to the real file in /downloads/. Files are whitelisted by id so
 * this can never be used as an open redirect or to probe arbitrary paths.
 *
 * Query params:
 *   id - required, one of the keys in FILES below
 */

const FILES: Record<string, string> = {
  "set-list-1": "/downloads/DJ Training Set List I.csv",
  "set-list-2": "/downloads/DJ Training Set List II.csv",
  "set-list-3": "/downloads/DJ Training Set List III.csv",
  "set-list-4": "/downloads/DJ Training Set List IV.csv",
};

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const path = FILES[id];

  if (!path) {
    return new Response("Unknown file id", { status: 404 });
  }

  // Count the download (best-effort; never blocks the redirect).
  await recordDownload(id);

  return new Response(null, {
    status: 302,
    headers: {
      Location: encodeURI(path),
      "Cache-Control": "no-store",
    },
  });
};

export const config = {
  path: "/api/download",
};
