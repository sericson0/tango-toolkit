/**
 * Event counters (tool downloads, game plays, …), backed by Netlify Blobs.
 *
 * Recording an event is append-only: each event writes a brand-new,
 * uniquely-keyed event blob. There is no read-modify-write, so simultaneous
 * downloads never contend for or clobber a shared counter — no increment can
 * be lost, and it doesn't rely on conditional-write semantics.
 *
 * Reading (the admin stats endpoint) folds any pending event blobs into a
 * rolling `summary` blob and deletes them (compaction), so the event backlog
 * stays small and reads stay fast. The tool id and day are encoded in each
 * event's key, so folding only lists keys — no per-event fetch.
 */

import { getStore } from "@netlify/blobs";

const STORE_NAME = "download-stats";
const EVENT_PREFIX = "ev/";
const SUMMARY_KEY = "summary";
/** Days of per-day history to keep. 30 for "last month" plus generous buffer. */
const KEEP_DAYS = 120;

export interface ToolStats {
  /** All-time download count. */
  total: number;
  /** Per-day counts, keyed by UTC "YYYY-MM-DD". */
  daily: Record<string, number>;
}

/** Rolling compacted totals: toolId -> stats. */
type Summary = Record<string, ToolStats>;

export interface ToolSummary {
  toolId: string;
  total: number;
  /** Downloads in the trailing 30 days. */
  last30: number;
}

/** UTC calendar day, e.g. "2026-07-06". */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayToMs(day: string): number {
  return new Date(day + "T00:00:00Z").getTime();
}

/** Drop per-day entries older than KEEP_DAYS so the summary stays small. */
function pruneOldDays(daily: Record<string, number>): void {
  const cutoff = Date.now() - KEEP_DAYS * 86_400_000;
  for (const day of Object.keys(daily)) {
    if (dayToMs(day) < cutoff) delete daily[day];
  }
}

/**
 * Record one download. Best-effort and contention-free: writes a single,
 * uniquely-keyed event blob (no read, no shared counter). Swallows its own
 * errors so a Blobs hiccup can never block the actual download.
 */
export async function recordDownload(toolId: string): Promise<void> {
  if (!toolId) return;

  try {
    const store = getStore(STORE_NAME);
    // Key encodes tool + day so the reader can tally by listing keys alone.
    const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const key = `${EVENT_PREFIX}${encodeURIComponent(toolId)}/${todayUTC()}/${unique}`;
    await store.setJSON(key, { toolId, day: todayUTC() });
  } catch (err) {
    console.error(`[download-stats] failed to record event for "${toolId}":`, err);
  }
}

/**
 * Record any counted event (game play, tool use, …). Same append-only counter
 * as {@link recordDownload}; separate name so call sites read clearly. The
 * `id` becomes its own row in the stats output.
 */
export const recordEvent = recordDownload;

/** Parse a tool id + day out of an event key, or null if it doesn't fit. */
function parseEventKey(key: string): { toolId: string; day: string } | null {
  // ev/<encodedToolId>/<YYYY-MM-DD>/<unique>
  const parts = key.slice(EVENT_PREFIX.length).split("/");
  if (parts.length < 3) return null;
  try {
    return { toolId: decodeURIComponent(parts[0]), day: parts[1] };
  } catch {
    return null;
  }
}

/**
 * Read every tool's counters, summarizing total + trailing-30-day downloads,
 * sorted by all-time total (descending).
 *
 * Side effect: folds pending event blobs into the rolling summary and deletes
 * them, keeping the event backlog small. Concurrent callers converge on the
 * same result; a new event created mid-read is simply folded on the next read.
 */
export async function getAllStats(): Promise<ToolSummary[]> {
  const store = getStore(STORE_NAME);

  const summary: Summary =
    ((await store.get(SUMMARY_KEY, { type: "json" })) as Summary | null) ?? {};

  // Fold every pending event into the summary (paginated to catch a backlog).
  const foldedKeys: string[] = [];
  for await (const page of store.list({ prefix: EVENT_PREFIX, paginate: true })) {
    for (const blob of page.blobs) {
      const ev = parseEventKey(blob.key);
      foldedKeys.push(blob.key);
      if (!ev) continue;
      const s = (summary[ev.toolId] ??= { total: 0, daily: {} });
      s.total += 1;
      s.daily[ev.day] = (s.daily[ev.day] ?? 0) + 1;
    }
  }

  for (const s of Object.values(summary)) pruneOldDays(s.daily);

  // Persist the compacted summary, then delete the events we folded. We only
  // delete keys we actually listed, so events created mid-read survive for the
  // next pass. (A failed delete can double-count one event later — acceptable
  // for a non-critical metric.)
  if (foldedKeys.length) {
    await store.setJSON(SUMMARY_KEY, summary);
    await Promise.all(foldedKeys.map((key) => store.delete(key)));
  }

  const cutoff = Date.now() - 30 * 86_400_000;
  const out: ToolSummary[] = Object.entries(summary).map(([toolId, s]) => {
    let last30 = 0;
    for (const [day, count] of Object.entries(s.daily)) {
      if (dayToMs(day) >= cutoff) last30 += count;
    }
    return { toolId, total: s.total, last30 };
  });

  out.sort((a, b) => b.total - a.total);
  return out;
}
