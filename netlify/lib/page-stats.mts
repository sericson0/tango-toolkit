/**
 * Per-page traffic counters — first-party, cookieless page views.
 *
 * Uses the same append-only counter as the download stats (see
 * `event-counter.mts`) but in its own Blobs store, so page-view volume never
 * slows the download-stats read down.
 *
 * Rows are the page paths themselves (e.g. "/dj/tools/"), plus three aggregate
 * rows using a "__" prefix that no real path can collide with:
 *   __unique  - browsers whose first ever visit this was
 *   __session - browser sessions started (one per tab session)
 *   __other   - views of paths not in the sitemap (404s, junk, stale links)
 *
 * Paths are validated against the site's own sitemap rather than a hand-kept
 * whitelist, so new pages are counted the moment they ship and nobody can
 * pollute the store with arbitrary keys by POSTing to the endpoint.
 */

import { createCounter, type CounterRow } from "./event-counter.mts";

const counter = createCounter("page-stats");

/** Browsers whose first ever visit this was. */
export const UNIQUE_KEY = "__unique";
/** Browser sessions started. */
export const SESSION_KEY = "__session";
/** Views of paths that aren't real pages. */
export const OTHER_KEY = "__other";

const AGGREGATE_KEYS = new Set([UNIQUE_KEY, SESSION_KEY, OTHER_KEY]);

const MAX_PATH_LENGTH = 128;
const MAX_SEGMENTS = 6;
/** Lowercase, slash-delimited, always trailing-slashed. "/" is valid. */
const PATH_SHAPE = /^\/(?:[a-z0-9][a-z0-9._-]*\/)*$/;

/** How long a loaded sitemap is trusted before being refetched. */
const SITEMAP_TTL_MS = 60 * 60 * 1000;
/** Cap on child sitemaps followed from an index, as a runaway guard. */
const MAX_CHILD_SITEMAPS = 10;

/**
 * Normalize a client-reported path into the canonical form used as a counter
 * key, or null if it can't be one. Defensive: the value arrives from a public
 * endpoint, so anything oddly shaped, overlong, or deeply nested is rejected
 * outright rather than becoming a row.
 */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;
  // "//host/path" is a protocol-relative URL, not a path. Reject it up front —
  // collapsing the slashes below would otherwise disguise it as one.
  if (raw.startsWith("//")) return null;

  // Query and hash never distinguish a page here; strip them defensively even
  // though the client sends location.pathname alone.
  let path = raw.split("#")[0].split("?")[0].toLowerCase();
  path = path.replace(/\/{2,}/g, "/");
  // The static build serves directory-style URLs; treat the explicit index file
  // as the directory it stands for.
  path = path.replace(/index\.html$/, "");
  if (!path.endsWith("/")) path += "/";

  if (path.length > MAX_PATH_LENGTH) return null;
  // "/a/b/" -> ["", "a", "b", ""], so subtract the two empty ends.
  if (path.split("/").length - 2 > MAX_SEGMENTS) return null;
  if (!PATH_SHAPE.test(path)) return null;

  return path;
}

let sitemapCache: { paths: Set<string>; at: number } | null = null;
let sitemapInFlight: Promise<Set<string> | null> | null = null;

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** Take a URL's path (and query) and re-point it at `origin`. */
function rebaseOnOrigin(url: string, origin: string): string | null {
  try {
    const { pathname, search } = new URL(url);
    return new URL(pathname + search, origin).href;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * Load the set of real page paths from the site's sitemap. Returns null when
 * the sitemap can't be read at all — callers treat that as "allowlist
 * unavailable" rather than "no pages exist".
 */
async function loadSitemapPaths(origin: string): Promise<Set<string> | null> {
  const root =
    (await fetchText(`${origin}/sitemap-index.xml`)) ??
    (await fetchText(`${origin}/sitemap.xml`));

  // @astrojs/sitemap emits an index pointing at sitemap-0.xml, but handle a
  // flat sitemap (or a missing index) just as happily.
  let documents: string[];
  if (root && /<sitemapindex/i.test(root)) {
    // The index lists absolute canonical URLs, so follow only their paths,
    // rebased onto the origin we were asked about. Otherwise a deploy preview
    // or local build would validate against the live site's sitemap instead of
    // its own — and we would be fetching whatever host the document names.
    const children = extractLocs(root)
      .map((loc) => rebaseOnOrigin(loc, origin))
      .filter((url): url is string => url !== null)
      .slice(0, MAX_CHILD_SITEMAPS);
    documents = (await Promise.all(children.map(fetchText))).filter(
      (doc): doc is string => doc !== null
    );
  } else if (root) {
    documents = [root];
  } else {
    const fallback = await fetchText(`${origin}/sitemap-0.xml`);
    documents = fallback ? [fallback] : [];
  }

  const paths = new Set<string>();
  for (const doc of documents) {
    for (const loc of extractLocs(doc)) {
      try {
        const path = normalizePath(new URL(loc).pathname);
        if (path) paths.add(path);
      } catch {
        // Not a URL we can parse — skip it.
      }
    }
  }

  return paths.size ? paths : null;
}

/**
 * Cached sitemap path set. Refetched at most once per TTL per warm instance,
 * and only once at a time when several requests race a cold start.
 */
async function getKnownPaths(origin: string): Promise<Set<string> | null> {
  if (sitemapCache && Date.now() - sitemapCache.at < SITEMAP_TTL_MS) {
    return sitemapCache.paths;
  }

  sitemapInFlight ??= loadSitemapPaths(origin).finally(() => {
    sitemapInFlight = null;
  });

  const paths = await sitemapInFlight;
  if (paths) sitemapCache = { paths, at: Date.now() };
  return paths;
}

/**
 * Map a normalized path to the counter row it belongs in: itself when it's a
 * real page, {@link OTHER_KEY} when it isn't.
 *
 * If the sitemap can't be loaded (local dev, or a transient failure) the path
 * is counted as-is. It has already passed {@link normalizePath}, so the worst
 * case in that degraded window is a few junk rows rather than an unbounded
 * store — and the endpoint is rate limited on top.
 */
export async function resolvePageId(
  path: string,
  origin: string
): Promise<string> {
  const known = await getKnownPaths(origin);
  if (!known) return path;
  return known.has(path) ? path : OTHER_KEY;
}

/** Record one page view (or one aggregate event). Best-effort. */
export async function recordPageView(id: string): Promise<void> {
  await counter.record(id);
}

export interface PageRow {
  path: string;
  views: number;
  /** Views in the trailing 30 days. */
  last30: number;
}

export interface PageStats {
  /** Views of real pages, all time. */
  totalViews: number;
  /** Views of real pages in the trailing 30 days. */
  totalViewsLast30: number;
  /** Browsers whose first ever visit was counted here. */
  uniqueVisitors: number;
  /** Sessions started. */
  sessions: number;
  /** Views of paths that aren't real pages (404s, stale links). */
  otherViews: number;
  /** Per-page rows, most-viewed first. */
  pages: PageRow[];
  /** True when another read is needed to fully compact the backlog. */
  pendingCompaction: boolean;
}

/**
 * Read per-page traffic, sorted by all-time views. Compacts pending events as a
 * side effect.
 */
export async function getPageStats(): Promise<PageStats> {
  const { rows, pendingCompaction } = await counter.readAll();

  const aggregate = (id: string): number =>
    rows.find((row) => row.id === id)?.total ?? 0;

  const pages = rows
    .filter((row) => !AGGREGATE_KEYS.has(row.id))
    .map(toPageRow);

  return {
    totalViews: pages.reduce((sum, page) => sum + page.views, 0),
    totalViewsLast30: pages.reduce((sum, page) => sum + page.last30, 0),
    uniqueVisitors: aggregate(UNIQUE_KEY),
    sessions: aggregate(SESSION_KEY),
    otherViews: aggregate(OTHER_KEY),
    pages,
    pendingCompaction,
  };
}

function toPageRow(row: CounterRow): PageRow {
  return { path: row.id, views: row.total, last30: row.last30 };
}
