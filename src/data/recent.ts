/**
 * "Recently Added" feed for the home page.
 * Tools from tools.ts are included automatically (via dateAdded).
 * Anything that isn't a tool — games, articles, discographies, classes —
 * goes in the `extras` list below.
 */

import { tools, toolCategories } from './tools';

export interface RecentItem {
  title: string;
  description: string;
  href: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Short badge label, e.g. 'Game', 'Article', 'DJ Players' */
  tag: string;
  external?: boolean;
  /** Logo/icon shown on the card (URL or /public path). */
  image?: string;
  /** Made by The Tango Toolkit — the newest such item leads the "Recently Added" feed. */
  firstParty?: boolean;
}

/** Non-tool additions — add new games, articles, and sections here. */
const extras: RecentItem[] = [
  {
    title: 'Name That Tango',
    description: 'Ear-training game — guess the orchestra, now with bandleader portraits and more rounds.',
    href: '/name-that-tango/',
    date: '2026-06-29',
    tag: 'Game',
    firstParty: true,
  },
];

const categoryTitles = Object.fromEntries(toolCategories.map((c) => [c.id, c.title]));

const toolItems: RecentItem[] = tools.map((t) => ({
  title: t.name,
  description: t.tagline,
  href: t.url,
  date: t.dateAdded,
  tag: categoryTitles[t.category] ?? 'Tool',
  external: t.external,
  image: t.image,
  firstParty: t.author === 'The Tango Toolkit',
}));

/** The newest `n` additions across tools and extras. */
export function recentlyAdded(n = 4): RecentItem[] {
  const byDate = [...toolItems, ...extras].sort((a, b) => b.date.localeCompare(a.date));
  // Lead with the most recent Tango Toolkit item; everything else stays in date order.
  const leadIdx = byDate.findIndex((item) => item.firstParty);
  if (leadIdx > 0) byDate.unshift(byDate.splice(leadIdx, 1)[0]);
  return byDate.slice(0, n);
}

/** Format '2026-07-02' as 'Jul 2, 2026' without timezone surprises. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}
