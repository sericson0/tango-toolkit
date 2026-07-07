import type { Context } from "@netlify/functions";
import { recordDownload } from "../lib/download-stats.mts";

/**
 * Redirects to the download URL of an asset from a GitHub repo's latest
 * release, so tool cards can link straight to a file instead of the
 * release page. Asset filenames often embed the version (e.g.
 * "TangoDisplay-v3.28.0-universal.zip"), so GitHub's own
 * /releases/latest/download/<name> shortcut can't be used directly.
 *
 * Query params:
 *   repo - required, "owner/name"
 *   ext  - optional file extension to match, defaults to "zip"
 *   id   - optional tool id used for download stats (defaults to repo)
 */

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const repo = url.searchParams.get("repo");
  const ext = url.searchParams.get("ext") ?? "zip";
  const statsId = url.searchParams.get("id") ?? repo ?? undefined;

  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return new Response("Missing or invalid repo", { status: 400 });
  }

  let release;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "tangotoolkit.com" },
    });
    if (!res.ok) {
      return new Response("Release not found", { status: 502 });
    }
    release = await res.json();
  } catch (err) {
    console.error("Failed to fetch latest release:", err);
    return new Response("Failed to fetch latest release", { status: 502 });
  }

  const asset = (release.assets ?? []).find((a: { name: string }) =>
    a.name.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
  );

  if (!asset) {
    return new Response(`No .${ext} asset found in latest release`, { status: 404 });
  }

  // Count the download (best-effort; never blocks the redirect).
  await recordDownload(statsId!);

  return new Response(null, {
    status: 302,
    headers: {
      Location: asset.browser_download_url,
      "Cache-Control": "public, max-age=0, s-maxage=600",
    },
  });
};

export const config = {
  path: "/api/github-latest-asset",
};
