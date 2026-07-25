/**
 * Name That Tango — leaderboards, backed by Netlify Blobs.
 *
 * Hosts several named boards (Survival high scores, Daily Challenge perfect
 * streaks, …). Same append-only pattern as {@link ./download-stats.mts} and
 * {@link ./likes.mts}: each submission writes a brand-new, uniquely-keyed
 * event blob (no read-modify-write, so concurrent submissions never clobber
 * each other), and the whole entry — board, month, score, timestamp, name —
 * is encoded in the key, so the reader folds by listing keys alone with no
 * per-event fetch.
 *
 * Reads fold pending events into a rolling `boards` blob. Like the likes
 * counter, boards are read on every visit to the game's setup screen, so we
 * only *compact* (persist + delete folded events) once the backlog crosses
 * COMPACT_THRESHOLD, or when a submission forces it.
 */

import { getStore } from "@netlify/blobs";

const STORE_NAME = "leaderboards";
const EVENT_PREFIX = "ev/";
const BOARDS_KEY = "boards";
/** Entries kept per board — deep enough that a monthly board never starves. */
const MAX_STORED = 50;
/** Months of per-month boards to keep (current month + buffer). */
const KEEP_MONTHS = 3;
/** Fold events in memory on every read; only rewrite blobs past this backlog. */
const COMPACT_THRESHOLD = 20;
/** Entries returned to the client per board. */
export const TOP_N = 5;

export interface BoardConfig {
  /** Keep per-calendar-month boards in addition to all-time. */
  monthly: boolean;
  /** Collapse to the single best score per name (for cumulative streaks). */
  dedupeByName: boolean;
  /** Lowest score that may be submitted / appear on the board. */
  minScore: number;
}

/** The boards this store hosts. A submission's `board` must be one of these. */
export const BOARDS: Record<string, BoardConfig> = {
  survival: { monthly: true, dedupeByName: false, minScore: 1 },
  // Daily streaks only make the board at 5 perfect days in a row.
  "daily-streak": { monthly: false, dedupeByName: true, minScore: 5 },
};

export function isBoard(name: unknown): name is keyof typeof BOARDS {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(BOARDS, name);
}

export interface ScoreEntry {
  name: string;
  score: number;
  /** Submission time (epoch ms) — earlier submission wins score ties. */
  ts: number;
}

export interface BoardData {
  alltime: ScoreEntry[];
  /** Per-month boards, keyed by UTC "YYYY-MM". Empty for all-time-only boards. */
  monthly: Record<string, ScoreEntry[]>;
}

type Boards = Record<string, BoardData>;

/** UTC month `offset` months before the current one, e.g. "2026-07". */
export function monthKey(offset = 0): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  return d.toISOString().slice(0, 7);
}

/** Sort key: higher score first, earlier submission breaks ties. */
function compareEntries(a: ScoreEntry, b: ScoreEntry): number {
  return b.score - a.score || a.ts - b.ts;
}

function insert(list: ScoreEntry[], entry: ScoreEntry, dedupeByName: boolean): void {
  if (dedupeByName) {
    // Streak boards keep one row per name — the best they've ever reached.
    const existing = list.find((e) => e.name === entry.name);
    if (existing) {
      if (compareEntries(entry, existing) < 0) {
        existing.score = entry.score;
        existing.ts = entry.ts;
      }
      list.sort(compareEntries);
      return;
    }
  } else if (list.some((e) => e.ts === entry.ts && e.name === entry.name && e.score === entry.score)) {
    // An event folded twice (uncompacted backlog re-read, or a failed delete
    // after compaction) must not become a duplicate row.
    return;
  }
  list.push(entry);
  list.sort(compareEntries);
  if (list.length > MAX_STORED) list.length = MAX_STORED;
}

function emptyBoard(): BoardData {
  return { alltime: [], monthly: {} };
}

/**
 * Record one submission to `board`. The caller has already validated the
 * board name, player name, and score. The whole entry lives in the key so
 * folding never fetches event bodies.
 */
export async function recordScore(board: string, name: string, score: number): Promise<ScoreEntry> {
  const entry: ScoreEntry = { name, score, ts: Date.now() };
  const store = getStore(STORE_NAME);
  const unique = `${entry.ts.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  // ev/<board>/<month>/<score>/<ts>/<unique>/<encodedName>
  const key = `${EVENT_PREFIX}${board}/${monthKey()}/${score}/${entry.ts}/${unique}/${encodeURIComponent(name)}`;
  await store.setJSON(key, entry);
  return entry;
}

/** Parse a submission event out of its key, or null if it doesn't fit. */
function parseEventKey(key: string): { board: string; month: string; entry: ScoreEntry } | null {
  const parts = key.slice(EVENT_PREFIX.length).split("/");
  if (parts.length < 6) return null;
  const score = parseInt(parts[2], 10);
  const ts = parseInt(parts[3], 10);
  if (!isBoard(parts[0]) || !Number.isFinite(score) || !Number.isFinite(ts)) return null;
  try {
    return { board: parts[0], month: parts[1], entry: { name: decodeURIComponent(parts[5]), score, ts } };
  } catch {
    return null;
  }
}

/**
 * Read every board, folding any pending events in. Compacts (persists the
 * folded boards and deletes the events) only past COMPACT_THRESHOLD, or when
 * `forceCompact` is set (used after a submission so a fresh score can't be
 * double-counted by later folds racing a slow backlog).
 */
export async function getBoards(forceCompact = false): Promise<{ month: string; boards: Boards }> {
  const store = getStore(STORE_NAME);

  const boards: Boards = ((await store.get(BOARDS_KEY, { type: "json" })) as Boards | null) ?? {};
  for (const name of Object.keys(BOARDS)) boards[name] ??= emptyBoard();

  const foldedKeys: string[] = [];
  for await (const page of store.list({ prefix: EVENT_PREFIX, paginate: true })) {
    for (const blob of page.blobs) {
      foldedKeys.push(blob.key);
      const parsed = parseEventKey(blob.key);
      if (!parsed) continue;
      const cfg = BOARDS[parsed.board];
      const board = (boards[parsed.board] ??= emptyBoard());
      insert(board.alltime, parsed.entry, cfg.dedupeByName);
      if (cfg.monthly) insert((board.monthly[parsed.month] ??= []), parsed.entry, cfg.dedupeByName);
    }
  }

  // Drop month boards old enough that no one will page back to them.
  const keep = new Set(Array.from({ length: KEEP_MONTHS }, (_, i) => monthKey(i)));
  for (const board of Object.values(boards)) {
    for (const m of Object.keys(board.monthly)) {
      if (!keep.has(m)) delete board.monthly[m];
    }
  }

  if (foldedKeys.length && (forceCompact || foldedKeys.length >= COMPACT_THRESHOLD)) {
    // Persist first, then delete only what we listed — an event created
    // mid-read survives for the next pass, and a failed delete just refolds
    // harmlessly (insert dedups).
    await store.setJSON(BOARDS_KEY, boards);
    await Promise.all(foldedKeys.map((key) => store.delete(key)));
  }

  return { month: monthKey(), boards };
}
