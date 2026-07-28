/**
 * The dancer toolbox.
 *
 * Each section here becomes:
 *   - a card on /dancer/
 *   - a hub page at /dancer/<id>/
 *   - an entry in the "Dancer" nav dropdown and the footer
 *
 * Topics inside a section come from src/content/dancer/<id>/*.mdx — see
 * src/content/config.ts. To launch a section that is currently hidden, flip
 * `hidden` to false; every page, link, and nav entry turns on at once.
 */

export type DancerSectionId =
  | 'starter-kit'
  | 'musicality'
  | 'connection'
  | 'steps'
  | 'resources';

export interface DancerSection {
  id: DancerSectionId;
  /** Full title, used on the hub page and cards. */
  title: string;
  /** Shorter label for the nav dropdown. */
  navTitle: string;
  /** One line, used on the /dancer/ card. */
  blurb: string;
  /** Longer intro, used as the hub page lead. */
  lead: string;
  /** Which toolbox icon represents the section. */
  tool:
    | 'toolbox'
    | 'sliders'
    | 'gears'
    | 'tools'
    | 'compass';
  /** Hidden sections generate no pages and appear in no menus. */
  hidden?: boolean;
  /**
   * How the hub lists its topics.
   *   grid  independent topics you can read in any order
   *   path  a numbered route through the section, first to last
   */
  hubLayout?: 'grid' | 'path';
  /**
   * Also render the shared resource library (src/data/dancerResources.ts)
   * beneath this hub's topics — books, sites, and downloads by other people.
   */
  showResourceLibrary?: boolean;
}

export const dancerSections: DancerSection[] = [
  {
    id: 'starter-kit',
    title: 'Starter Kit',
    navTitle: 'Starter Kit',
    blurb: 'New to tango? Start here.',
    lead: 'What to expect, what to work on first, and how to get the most out of your first year of tango. Read it in order — each part builds on the one before.',
    tool: 'toolbox',
    hubLayout: 'path',
  },
  {
    id: 'musicality',
    title: 'Musicality',
    navTitle: 'Musicality',
    blurb: 'Hear more in the music, and let it shape how you move.',
    lead: 'The beat, the phrase, the orchestra. Ways to listen to tango music so that dancing to it feels obvious rather than guessed.',
    tool: 'sliders',
  },
  {
    id: 'connection',
    title: 'Connection',
    navTitle: 'Connection',
    blurb: 'The embrace, the lead, and the conversation between two dancers.',
    lead: 'How two people share an axis, an intention, and a moment.',
    tool: 'gears',
    // Being built out — nothing renders and nothing links here until this flips.
    hidden: true,
  },
  {
    id: 'steps',
    title: 'Steps, Sequences & Technique',
    navTitle: 'Steps & Sequences',
    blurb: 'The walk, ochos, crosses, pivots — one tool at a time.',
    lead: 'Each movement gets its own page: what it is, why it happens, how to make it feel good, and exercises you can take to a practica.',
    tool: 'tools',
  },
  {
    id: 'resources',
    title: 'Tools & Resources',
    navTitle: 'Tools & Resources',
    blurb: 'Practice tools, reading, and places to go deeper.',
    lead: 'Everything else worth having on hand — practice aids, recommended reading, and the rest of the Tango Toolkit.',
    tool: 'compass',
    showResourceLibrary: true,
  },
];

/** Sections that are live, in menu order. */
export const visibleDancerSections = dancerSections.filter((s) => !s.hidden);

export function getDancerSection(id: string): DancerSection | undefined {
  return dancerSections.find((s) => s.id === id);
}

/** True when the section exists and is not hidden. */
export function isLiveSection(id: string): boolean {
  return visibleDancerSections.some((s) => s.id === id);
}

/** Where a section's nav link should point. */
export function sectionHref(section: DancerSection): string {
  return `/dancer/${section.id}/`;
}
