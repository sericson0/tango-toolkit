/**
 * Per-tool "like" counters, backed by Netlify Blobs.
 *
 * Like {@link ./download-stats.mts}, writes are append-only and
 * contention-free: each like/unlike writes a brand-new, uniquely-keyed event
 * blob whose key encodes a +1 or -1 delta. There's no read-modify-write, so
 * concurrent likes never clobber a shared counter, and because the delta lives
 * in the key the reader tallies by listing keys alone — no per-event fetch.
 *
 * Reads fold pending event blobs into a rolling `summary` blob. Unlike the
 * (rarely-hit, admin-only) download-stats reader, the likes count is read on
 * every visit to the tools page, so we only *compact* (persist the summary and
 * delete folded events) once the backlog crosses COMPACT_THRESHOLD — otherwise
 * we fold in memory and leave the events in place. That keeps the common read
 * cheap while still bounding the backlog.
 */

import { getStore } from "@netlify/blobs";

const STORE_NAME = "tool-likes";
const EVENT_PREFIX = "ev/";
const SUMMARY_KEY = "summary";
/** Fold events in memory on every read; only rewrite blobs past this backlog. */
const COMPACT_THRESHOLD = 25;

/** toolId -> net like count. */
type Counts = Record<string, number>;

/**
 * Record one like (delta = 1) or unlike (delta = -1). Best-effort and
 * contention-free: writes a single, uniquely-keyed event blob. Swallows its
 * own errors so a Blobs hiccup can't surface as a failed request.
 */
export async function recordLike(toolId: string, delta: 1 | -1): Promise<void> {
  if (!toolId) return;
  try {
    const store = getStore(STORE_NAME);
    // Key encodes tool + sign so the reader can tally by listing keys alone.
    const sign = delta === -1 ? "m" : "p";
    const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const key = `${EVENT_PREFIX}${encodeURIComponent(toolId)}/${sign}/${unique}`;
    await store.setJSON(key, { toolId, delta });
  } catch (err) {
    console.error(`[likes] failed to record like for "${toolId}":`, err);
  }
}

/** Parse a tool id + delta out of an event key, or null if it doesn't fit. */
function parseEventKey(key: string): { toolId: string; delta: number } | null {
  // ev/<encodedToolId>/<p|m>/<unique>
  const parts = key.slice(EVENT_PREFIX.length).split("/");
  if (parts.length < 3) return null;
  try {
    return { toolId: decodeURIComponent(parts[0]), delta: parts[1] === "m" ? -1 : 1 };
  } catch {
    return null;
  }
}

/**
 * Return net like counts per tool (never negative). Folds any pending event
 * blobs into the rolling summary, compacting to disk only once the backlog is
 * large enough to be worth the extra writes.
 */
export async function getLikeCounts(): Promise<Counts> {
  const store = getStore(STORE_NAME);

  const summary: Counts =
    ((await store.get(SUMMARY_KEY, { type: "json" })) as Counts | null) ?? {};

  const foldedKeys: string[] = [];
  for await (const page of store.list({ prefix: EVENT_PREFIX, paginate: true })) {
    for (const blob of page.blobs) {
      foldedKeys.push(blob.key);
      const ev = parseEventKey(blob.key);
      if (!ev) continue;
      summary[ev.toolId] = (summary[ev.toolId] ?? 0) + ev.delta;
    }
  }

  // Only pay for the rewrite + deletes once the backlog is worth it. Events we
  // leave behind are simply re-folded (idempotently) on the next read.
  if (foldedKeys.length >= COMPACT_THRESHOLD) {
    await store.setJSON(SUMMARY_KEY, summary);
    await Promise.all(foldedKeys.map((key) => store.delete(key)));
  }

  // Clamp to >= 0 for display; a race could momentarily net below zero.
  const out: Counts = {};
  for (const [toolId, count] of Object.entries(summary)) {
    out[toolId] = Math.max(0, count);
  }
  return out;
}
