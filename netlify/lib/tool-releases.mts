/**
 * Live tool version + last-updated date, sourced from each tool's latest
 * GitHub release and cached in Netlify Blobs.
 *
 * The DJ Tools page reads this on every visit, so hitting GitHub per request
 * would blow the unauthenticated 60/hour rate limit. Instead we keep a single
 * cached snapshot (one blob) and only refresh it once it's older than TTL_MS.
 * Combined with CDN caching on the endpoint, GitHub sees at most a handful of
 * calls per hour regardless of traffic. Set GITHUB_TOKEN to raise the limit.
 *
 * The tool -> repo mapping comes straight from `githubRepo` in
 * src/data/tools.ts, so adding a repo there is all it takes to surface a
 * version — no change here.
 */

import { getStore } from "@netlify/blobs";
import { tools } from "../../src/data/tools.ts";

const STORE_NAME = "tool-releases";
const CACHE_KEY = "cache";
/** How long a cached snapshot is served before we refresh from GitHub. */
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface Release {
  /** Release tag, e.g. "v3.28.0". */
  version: string;
  /** ISO timestamp the release was published, e.g. "2026-06-14T...". */
  updated: string;
}
export type ReleaseMap = Record<string, Release>;

interface Cache {
  fetchedAt: number;
  data: ReleaseMap;
}

/** toolId -> "owner/repo", taken from the tools data. */
const REPOS: Array<{ id: string; repo: string }> = tools
  .filter((t) => t.githubRepo)
  .map((t) => ({ id: t.id, repo: t.githubRepo as string }));

async function fetchRelease(repo: string): Promise<Release | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "tangotoolkit.com",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
      { headers }
    );
    if (!res.ok) return null;
    const rel = (await res.json()) as {
      tag_name?: string;
      published_at?: string;
    };
    const version = typeof rel.tag_name === "string" ? rel.tag_name : "";
    if (!version) return null;
    return {
      version,
      updated: typeof rel.published_at === "string" ? rel.published_at : "",
    };
  } catch (err) {
    console.error(`[tool-releases] fetch failed for ${repo}:`, err);
    return null;
  }
}

/**
 * Return the version/date map for all tools that declare a `githubRepo`.
 * Serves the cached snapshot until it's older than TTL_MS, then refreshes.
 * On refresh, a repo whose fetch fails keeps its previously cached value, so a
 * transient GitHub hiccup never blanks out a version.
 */
export async function getToolReleases(): Promise<ReleaseMap> {
  const store = getStore(STORE_NAME);

  let cache: Cache | null = null;
  try {
    cache = (await store.get(CACHE_KEY, { type: "json" })) as Cache | null;
  } catch {
    // Treat a read failure as a cold cache.
  }

  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.data;
  }

  // Start from the last known values so per-repo failures degrade gracefully.
  const data: ReleaseMap = { ...(cache?.data ?? {}) };
  await Promise.all(
    REPOS.map(async ({ id, repo }) => {
      const rel = await fetchRelease(repo);
      if (rel) data[id] = rel;
    })
  );

  // Stamp fetchedAt even if every fetch failed, so we don't hammer GitHub while
  // it's down — we'll simply retry after the next TTL window.
  try {
    await store.setJSON(CACHE_KEY, { fetchedAt: Date.now(), data });
  } catch (err) {
    console.error("[tool-releases] failed to write cache:", err);
  }

  return data;
}
