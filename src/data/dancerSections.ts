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
  | 'drills'
  | 'resources';

/**
 * A page that belongs on a hub but does not live in the content collection —
 * a printable sheet, a tool, an index. Rendered after the section's topics.
 */
export interface SectionExtra {
  title: string;
  summary: string;
  href: string;
  /** Small label on the card — "Printable", "Tool", ... */
  badge?: string;
}

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
  /**
   * Opening body text shown on the hub page itself, before the topic list —
   * one string per paragraph. Lets a section say something readable up front
   * instead of greeting visitors with nothing but cards to click.
   */
  intro?: string[];
  /** Which toolbox icon represents the section. See TOOL_ICONS in ToolIcon.astro. */
  tool:
    | 'toolbox'
    | 'sliders'
    | 'gears'
    | 'tools'
    | 'hammer'
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
  /**
   * Also render the filterable drill library (src/data/dancerDrills.ts)
   * beneath this hub's topics.
   */
  showDrillLibrary?: boolean;
  /** Non-collection pages to list on the hub after the topics. */
  extras?: SectionExtra[];
}

export const dancerSections: DancerSection[] = [
  {
    id: 'starter-kit',
    title: 'Starter Kit',
    navTitle: 'Starter Kit',
    blurb: 'New to tango? Start here.',
    lead: 'Tools to help build your tango. \
         New to tango? Or looking for new ways to continue progressing? This kit is for you.',
    tool: 'toolbox',
    hubLayout: 'path',
    intro: [
      'Welcome to the wonderful world of tango! From its origins in the late 1800s in Buenos Aires \
      and the broader Río de la Plata, tango has grown to a thriving international community \
      accessible to anyone willing to learn. Travel anywhere in the world, and you can find \
      connection among fellow musicians, dancers, and artists.',
      'This starter kit is designed as a set of tools and resources to support your tango development.'
    ],
    extras: [
      {
        title: 'Quick Reference Sheet',
        summary:
          'The whole starter kit on two pages — the pillars, the movements, the milonga codes, and a first-month checklist. Print it or save it to your phone.',
        href: '/dancer/starter-kit/cheat-sheet/',
        badge: 'Printable',
      },
    ],
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
    title: 'Embrace & Connection',
    navTitle: 'Embrace & Connection',
    blurb: 'The embrace, the lead, and the conversation between two dancers.',
    lead: 'How two people share an axis, an intention, and a moment.',
    tool: 'gears',
    intro: [
      'Tango is a conversation held in contact. Before a single step happens, two people have \
      to agree on how they are going to stand together, where the weight is, and who is \
      listening for what. That agreement is the embrace, and everything else travels through it.',
      'These pages cover the part of the dance that is felt rather than seen — offering and \
      receiving an embrace, leading without pushing, following without waiting, and repairing \
      the connection when it slips. None of it requires knowing a single figure.',
    ],
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
    id: 'drills',
    title: 'Drills & Exercises',
    navTitle: 'Drills & Exercises',
    blurb: 'Things to actually do, sorted by what they fix.',
    lead: 'A searchable library of drills — most of them ten minutes, many of them alone in a kitchen. Filter by what you want to work on, how much time you have, and whether you have a partner.',
    tool: 'hammer',
    showDrillLibrary: true,
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
