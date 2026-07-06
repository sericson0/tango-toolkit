/**
 * Build-time discography counts, read straight from the source data so the
 * "N songs from M artists" figures on the site always match what is actually
 * in the discography. Runs in Astro frontmatter (Node) at build time.
 *
 * The CSV's first column is the Bandleader and never contains a comma, so a
 * simple split on the first comma is enough to count unique artists — no need
 * to pull in a full CSV parser here.
 */
import fs from 'node:fs';
import path from 'node:path';

function computeStats(): { songCount: number; artistCount: number } {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'metadata.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  lines.shift(); // drop header row

  const artists = new Set<string>();
  let songs = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    songs++;
    const comma = line.indexOf(',');
    artists.add(comma === -1 ? line : line.slice(0, comma));
  }
  return { songCount: songs, artistCount: artists.size };
}

const { songCount, artistCount } = computeStats();

export { songCount, artistCount };

/** e.g. "17,104" — locale-grouped song count for display. */
export const songCountFormatted = songCount.toLocaleString('en-US');
