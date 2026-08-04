/**
 * Download + tool-usage counters (tool downloads, game plays, …).
 *
 * A thin naming layer over the shared append-only counter in
 * `event-counter.mts`; see that file for how recording and compaction work.
 * The store name and key format are unchanged from the original standalone
 * implementation, so existing counters carry over untouched.
 */

import { createCounter, type CounterRow } from "./event-counter.mts";

const counter = createCounter("download-stats");

export interface ToolSummary {
  toolId: string;
  total: number;
  /** Downloads in the trailing 30 days. */
  last30: number;
}

/**
 * Record one download. Best-effort: swallows its own errors so a Blobs hiccup
 * can never block the actual download.
 */
export async function recordDownload(toolId: string): Promise<void> {
  await counter.record(toolId);
}

/**
 * Record any counted event (game play, tool use, …). Same counter as
 * {@link recordDownload}; separate name so call sites read clearly. The `id`
 * becomes its own row in the stats output.
 */
export const recordEvent = recordDownload;

/**
 * Read every tool's counters, summarizing total + trailing-30-day downloads,
 * sorted by all-time total (descending). Compacts pending events as a side
 * effect.
 */
export async function getAllStats(): Promise<ToolSummary[]> {
  const { rows } = await counter.readAll();
  return rows.map(toToolSummary);
}

function toToolSummary(row: CounterRow): ToolSummary {
  return { toolId: row.id, total: row.total, last30: row.last30 };
}
