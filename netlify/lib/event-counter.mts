/**
 * Generic append-only event counter backed by Netlify Blobs.
 *
 * Recording is append-only: each event writes a brand-new, uniquely-keyed blob.
 * There is no read-modify-write, so simultaneous events never contend for or
 * clobber a shared counter — no increment can be lost, and it doesn't rely on
 * conditional-write semantics.
 *
 * Reading folds pending event blobs into a rolling `summary` blob and deletes
 * them (compaction), so the backlog stays small and reads stay fast. The id and
 * day are encoded in each event's key, so folding only lists keys — no per-event
 * fetch.
 *
 * Compaction is bounded (see MAX_FOLD_PER_READ): a high-volume counter such as
 * page views can accumulate more events than one function invocation can delete
 * inside its timeout. Events beyond the batch are still counted in the returned
 * numbers, but are left on disk — unfolded and unpersisted — so the next read
 * folds them exactly once. Callers can surface `pendingCompaction` to signal
 * that another read will drain the rest.
 *
 * Used by both `download-stats.mts` (downloads + tool usage) and
 * `page-stats.mts` (page views), each with its own store.
 */

import { getStore } from "@netlify/blobs";

const EVENT_PREFIX = "ev/";
const SUMMARY_KEY = "summary";
/** Days of per-day history to keep. 30 for "last month" plus generous buffer. */
const KEEP_DAYS = 120;
/** Max events folded + deleted in one read, sized to stay inside the timeout. */
const MAX_FOLD_PER_READ = 5000;
/** Parallel blob deletes during compaction. */
const DELETE_CONCURRENCY = 64;

export interface CounterStats {
  /** All-time count. */
  total: number;
  /** Per-day counts, keyed by UTC "YYYY-MM-DD". */
  daily: Record<string, number>;
}

/** Rolling compacted totals: id -> stats. */
type Summary = Record<string, CounterStats>;

export interface CounterRow {
  id: string;
  total: number;
  /** Count in the trailing 30 days. */
  last30: number;
}

export interface CounterRead {
  rows: CounterRow[];
  /** True when events were left unfolded; another read will drain them. */
  pendingCompaction: boolean;
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

/** Parse an id + day out of an event key, or null if it doesn't fit. */
function parseEventKey(key: string): { id: string; day: string } | null {
  // ev/<encodedId>/<YYYY-MM-DD>/<unique>
  const parts = key.slice(EVENT_PREFIX.length).split("/");
  if (parts.length < 3) return null;
  try {
    return { id: decodeURIComponent(parts[0]), day: parts[1] };
  } catch {
    return null;
  }
}

/** Run `fn` over every item with at most `limit` in flight at once. */
async function mapLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<unknown>
): Promise<void> {
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        await fn(items[next++]);
      }
    }
  );
  await Promise.all(workers);
}

export interface EventCounter {
  record(id: string): Promise<void>;
  readAll(): Promise<CounterRead>;
}

/**
 * Build a counter over the named Netlify Blobs store. Stores are independent:
 * a busy counter's compaction never slows an unrelated one down.
 */
export function createCounter(storeName: string): EventCounter {
  /**
   * Record one event. Best-effort and contention-free: writes a single,
   * uniquely-keyed event blob (no read, no shared counter). Swallows its own
   * errors so a Blobs hiccup can never block the user-facing action.
   */
  async function record(id: string): Promise<void> {
    if (!id) return;

    try {
      const store = getStore(storeName);
      const day = todayUTC();
      // Key encodes id + day so the reader can tally by listing keys alone.
      const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      const key = `${EVENT_PREFIX}${encodeURIComponent(id)}/${day}/${unique}`;
      await store.setJSON(key, { id, day });
    } catch (err) {
      console.error(`[${storeName}] failed to record event for "${id}":`, err);
    }
  }

  /**
   * Read every counter, summarizing total + trailing-30-day counts, sorted by
   * all-time total (descending).
   *
   * Side effect: folds a bounded batch of pending event blobs into the rolling
   * summary and deletes them. Concurrent callers converge on the same result; a
   * new event created mid-read is simply folded on the next read.
   */
  async function readAll(): Promise<CounterRead> {
    const store = getStore(storeName);

    const summary: Summary =
      ((await store.get(SUMMARY_KEY, { type: "json" })) as Summary | null) ?? {};

    // List pending events (keys only — no per-event fetch), paginated to catch
    // a backlog.
    const pending: string[] = [];
    for await (const page of store.list({ prefix: EVENT_PREFIX, paginate: true })) {
      for (const blob of page.blobs) pending.push(blob.key);
    }

    // Only fold what we can also delete in this invocation. Folding without
    // deleting would double-count on the next read.
    const batch = pending.slice(0, MAX_FOLD_PER_READ);
    const deferred = pending.slice(MAX_FOLD_PER_READ);

    for (const key of batch) {
      const ev = parseEventKey(key);
      if (!ev) continue;
      const s = (summary[ev.id] ??= { total: 0, daily: {} });
      s.total += 1;
      s.daily[ev.day] = (s.daily[ev.day] ?? 0) + 1;
    }

    for (const s of Object.values(summary)) pruneOldDays(s.daily);

    // Persist the compacted summary, then delete the events we folded. We only
    // delete keys we actually listed, so events created mid-read survive for the
    // next pass. (A failed delete can double-count one event later — acceptable
    // for a non-critical metric.)
    if (batch.length) {
      await store.setJSON(SUMMARY_KEY, summary);
      await mapLimit(batch, DELETE_CONCURRENCY, (key) => store.delete(key));
    }

    const cutoff = Date.now() - 30 * 86_400_000;
    const totals = new Map<string, CounterRow>();
    for (const [id, s] of Object.entries(summary)) {
      let last30 = 0;
      for (const [day, count] of Object.entries(s.daily)) {
        if (dayToMs(day) >= cutoff) last30 += count;
      }
      totals.set(id, { id, total: s.total, last30 });
    }

    // Deferred events count toward this response but are deliberately not
    // persisted, so the next read still folds them exactly once.
    for (const key of deferred) {
      const ev = parseEventKey(key);
      if (!ev) continue;
      const row = totals.get(ev.id) ?? { id: ev.id, total: 0, last30: 0 };
      row.total += 1;
      if (dayToMs(ev.day) >= cutoff) row.last30 += 1;
      totals.set(ev.id, row);
    }

    const rows = [...totals.values()].sort((a, b) => b.total - a.total);
    return { rows, pendingCompaction: deferred.length > 0 };
  }

  return { record, readAll };
}
