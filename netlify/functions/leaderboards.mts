import type { Context } from "@netlify/functions";
import { checkRateLimit } from "../lib/rate-limit.mts";
import {
  getBoards,
  recordScore,
  isBoard,
  BOARDS,
  TOP_N,
  type BoardData,
  type ScoreEntry,
} from "../lib/leaderboards.mts";

/**
 * Name That Tango — leaderboards (Survival high scores + Daily Challenge
 * perfect streaks).
 *
 * GET -> { month, survival: {monthly, alltime}, dailyStreak: {alltime} }
 *   each list already sliced to the top TOP_N.
 * POST { board, name, score } -> the same boards plus `you` (the stored entry
 *   and its 1-based rank on each of that board's lists), so the client can
 *   celebrate a top-5 spot.
 *
 * Scores are client-reported, so these are honor-system arcade boards — the
 * validation below is about keeping junk and abuse out, not preventing a
 * determined cheater.
 */

const NAME_MAX = 20;
const SCORE_MAX = 500;

// Checked against the name with accents folded and non-letters stripped, so
// "F*u.c-k" and "fúck" are both caught. Substring matching is deliberately
// strict — a false positive just means picking another arcade name.
const BAD_WORDS = [
  "fuck", "shit", "cunt", "bitch", "asshole", "dick", "nigger", "nigga",
  "faggot", "whore", "puta", "puto", "mierda", "pendejo", "carajo", "concha",
  "pija", "verga", "culo", "hitler", "nazi",
];

/** Trim/collapse whitespace, strip control chars and angle brackets, filter. */
function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX)
    .trim();
  if (!name) return null;
  const flat = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  if (BAD_WORDS.some((w) => flat.includes(w))) return null;
  return name;
}

const top5 = (list: ScoreEntry[] = []) => list.slice(0, TOP_N);

function publicBoards(month: string, boards: Record<string, BoardData>) {
  return {
    month,
    survival: {
      monthly: top5(boards.survival?.monthly[month]),
      alltime: top5(boards.survival?.alltime),
    },
    dailyStreak: {
      alltime: top5(boards["daily-streak"]?.alltime),
    },
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const rateLimited = checkRateLimit(req, "leaderboards-get", {
      max: 30,
      windowSeconds: 60,
    });
    if (rateLimited) return rateLimited;

    const { month, boards } = await getBoards();
    return json(publicBoards(month, boards));
  }

  if (req.method === "POST") {
    const rateLimited = checkRateLimit(req, "leaderboards-post", {
      max: 5,
      windowSeconds: 60,
    });
    if (rateLimited) return rateLimited;

    let board: unknown = null;
    let name: string | null = null;
    let score: unknown = null;
    try {
      const body = await req.json();
      board = body?.board;
      name = cleanName(body?.name);
      score = body?.score;
    } catch {
      // fall through to validation below
    }
    if (!isBoard(board)) return new Response("Invalid board", { status: 400 });
    if (!name) return new Response("Invalid name", { status: 400 });
    if (!Number.isInteger(score) || (score as number) < BOARDS[board].minScore || (score as number) > SCORE_MAX) {
      return new Response("Invalid score", { status: 400 });
    }

    const entry = await recordScore(board, name, score as number);
    // Force compaction so the new entry lands in the persisted boards now.
    const { month, boards } = await getBoards(true);

    const rankIn = (list: ScoreEntry[] = []): number | null => {
      const i = list.findIndex(
        (e) => e.ts === entry.ts && e.name === entry.name && e.score === entry.score
      );
      return i === -1 ? null : i + 1;
    };

    const data = boards[board];
    return json({
      ...publicBoards(month, boards),
      you: {
        board,
        ...entry,
        alltimeRank: rankIn(data?.alltime),
        monthlyRank: BOARDS[board].monthly ? rankIn(data?.monthly[month]) : null,
      },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/leaderboards",
};
