/**
 * DJ Tools directory.
 * Every tool listed on /dj/tools/ lives here — both Tango Toolkit software
 * and tools made by other people. Add a new entry and it automatically
 * appears in its category section and (if recent) in the home page
 * "Recently Added" feed.
 *
 * To add a third-party tool, copy this template:
 * {
 *   id: 'tool-name',
 *   name: 'Tool Name',
 *   tagline: 'One-line hook',
 *   description: 'A sentence or two about what it does and who it is for.',
 *   category: 'dj-players',
 *   author: 'Author Name',
 *   url: 'https://example.com',
 *   external: true,
 *   price: 'Free',
 *   platforms: ['Windows', 'macOS'],
 *   dateAdded: '2026-07-15',
 * },
 */

export type ToolCategoryId =
  | 'dj-players'
  | 'displays-projections'
  | 'tanda-builders'
  | 'plugins-sound-quality';

export interface ToolCategory {
  id: ToolCategoryId;
  title: string;
  blurb: string;
}

export const toolCategories: ToolCategory[] = [
  {
    id: 'dj-players',
    title: 'DJ Players',
    blurb: 'Software for playing music at the milonga — reliable, tango-focused interfaces.',
  },
  {
    id: 'displays-projections',
    title: 'Displays & Projections',
    blurb: 'Show dancers what is playing — orchestra, singer, year, and tanda info on a second screen.',
  },
  {
    id: 'tanda-builders',
    title: 'Tanda Builders',
    blurb: 'Find songs that belong together and build killer tandas faster.',
  },
  {
    id: 'plugins-sound-quality',
    title: 'Plugins & Sound Quality',
    blurb: 'Audio plugins and utilities to clean up old recordings and keep your library in shape.',
  },
];

export interface Tool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: ToolCategoryId;
  /** Extra categories this tool also appears under (in addition to `category`). */
  categories?: ToolCategoryId[];
  /** Who makes it — 'The Tango Toolkit' for our own software. */
  author: string;
  /** Details page (internal path) or the tool's website (external URL). */
  url: string;
  /** true → link opens in a new tab (third-party sites). */
  external?: boolean;
  /** Optional direct download link — renders a Download button on the card. */
  downloadUrl?: string;
  price: string;
  platforms?: string[];
  image?: string;
  /** ISO date (YYYY-MM-DD) the tool was added to the site — drives "Recently Added". */
  dateAdded: string;
}

export const tools: Tool[] = [
  // ===== DJ Players =====
  {
    id: 'tigertango',
    name: 'TigerTango',
    tagline: 'An interface designed for tango DJs',
    description: 'A customized VirtualDJ skin built for the needs of tango DJs — clean layout, safety features, semiparametric EQ, and fade-out buttons for cortinas.',
    category: 'dj-players',
    author: 'The Tango Toolkit',
    url: '/dj/software/#tigertango',
    price: 'Free',
    platforms: ['Windows', 'macOS'],
    image: '/images/TigerTangoLogo.png',
    dateAdded: '2026-04-17',
  },
  {
    id: 'eleje-player',
    name: 'El Eje Player',
    tagline: 'A native macOS player built for tango',
    description: 'A native macOS app that organizes, understands, and plays Golden-Age tango the \
              way a DJ works a milonga: key &amp; BPM detection, pitch-preserving tempo, per-track EQ, \
              tanda building, synced lyrics with translation, a lunfardo thesaurus, and built-in learning \
              decks. Comes with an iOS companion app. <strong>Currently in free private beta.</strong>',
    category: 'dj-players',
    author: 'Abbas Kazemipour',
    url: 'https://el-eje.com/eleje-player',
    external: true,
    price: 'Free (beta)',
    platforms: ['macOS 13+'],
    image: '/images/eleje-player.png',
    dateAdded: '2026-07-05',
  },

  // ===== Displays & Projections =====
  {
    id: 'tigertango-video',
    name: 'TigerTango Video',
    tagline: 'Song and tanda display for the dance floor',
    description: 'Companion video skin for TigerTango that projects the current song, orchestra, and tanda info onto a second screen or projector.',
    category: 'displays-projections',
    author: 'The Tango Toolkit',
    url: '/dj/software/#tigertango',
    price: 'Free',
    platforms: ['Windows', 'macOS'],
    image: '/images/TigerTangoLogo.png',
    dateAdded: '2026-04-17',
  },
  {
    id: 'tangodisplay',
    name: 'TangoDisplay',
    tagline: 'Track info on a second screen, with cortina detection',
    description: 'A fully featured tango-centred audio player and clean, live dancer display in one.\
                 Use Setlist, the built-in player or your favourite music player. \
                 Auto-detects cortinas and shows track info, album art and custom \
                 backgrounds. <strong>Free and open source.</strong>',
    category: 'displays-projections',
    categories: ['dj-players'],
    author: 'Richard Slade',
    url: 'https://github.com/richardsladetdj-creator/TangoDisplay',
    external: true,
    downloadUrl: '/api/github-latest-asset?repo=richardsladetdj-creator/TangoDisplay&id=tangodisplay',
    price: 'Free',
    platforms: ['macOS 13+'],
    image: '/images/TangoDisplay.png',
    dateAdded: '2026-07-04',
  },

  // ===== Tanda Builders =====
  {
    id: 'tigertanda',
    name: 'TigerTanda',
    tagline: 'Find the tracks for the perfect tanda',
    description: 'VirtualDJ plugin that shows which songs in your library work well with the selected song, with filters for artist, singer, genre, and year.',
    category: 'tanda-builders',
    author: 'The Tango Toolkit',
    url: '/dj/software/#tigertanda',
    price: 'Free',
    platforms: ['Windows', 'macOS'],
    image: '/images/TigerTanda.png',
    dateAdded: '2026-04-17',
  },
  {
    id: 'tanda-builder-web',
    name: 'Tanda Builder (Web)',
    tagline: 'Build tandas right in your browser',
    description: 'Free online tool using the same logic and data as TigerTanda to help you find songs that work well together — no installation needed.',
    category: 'tanda-builders',
    author: 'The Tango Toolkit',
    url: '/dj/tanda-builder/',
    price: 'Free',
    platforms: ['Web'],
    dateAdded: '2026-05-01',
  },

  // ===== Plugins & Sound Quality =====
  {
    id: 'plugin-play',
    name: 'Plugin Play',
    tagline: 'Run your DJ software through a live VST3 effect chain',
    description: 'Routes any app — your DJ software, a browser, Spotify — through a chain of VST3 \
              effects (EQ, de-hissers, limiters) in real time, then out to your speakers. One-click \
              app routing, drag-to-reorder effects, floating plugin windows, and a built-in safety \
              limiter. <strong>Free and open source.</strong>',
    category: 'plugins-sound-quality',
    author: 'The Tango Toolkit',
    url: '/dj/software/#plugin-play',
    downloadUrl: '/api/github-latest-asset?repo=sericson0/plugin-play&ext=exe&id=plugin-play',
    price: 'Free',
    platforms: ['Windows', 'macOS'],
    image: '/images/plugin-play-icon.png',
    dateAdded: '2026-07-10',
  },
  {
    id: 'hisstory',
    name: 'Hisstory',
    tagline: 'Keep the music, ditch the noise',
    description: 'Real-time spectral gating plugin (VST3/AU) that removes hiss from old recordings while keeping music and transients intact. Full and Lite editions.',
    category: 'plugins-sound-quality',
    author: 'The Tango Toolkit',
    url: '/dj/software/#hisstory',
    price: '$9.99–$40',
    platforms: ['Windows', 'macOS'],
    image: '/images/hisstory-logo.png',
    dateAdded: '2026-04-17',
  },
  {
    id: 'hisstory-lite',
    name: 'Hisstory Lite',
    tagline: 'Real-time de-hissing, streamlined',
    description: 'The compact edition of Hisstory: the same de-hissing engine in a fixed, simplified view. Upgrade to the full version anytime for $30.',
    category: 'plugins-sound-quality',
    author: 'The Tango Toolkit',
    url: '/dj/software/#hisstory',
    price: '$9.99',
    platforms: ['Windows', 'macOS'],
    image: '/images/hisstory-logo.png',
    dateAdded: '2026-07-02',
  },
  {
    id: 'tigertag',
    name: 'TigerTag',
    tagline: 'Tag your tango tunes',
    description: 'Batch-tag your tango library with correct title, orchestra, singer, year, and genre from a database of more than 15,000 songs.',
    category: 'plugins-sound-quality',
    author: 'The Tango Toolkit',
    url: '/dj/software/#tigertag',
    price: '$40',
    platforms: ['Windows', 'macOS'],
    image: '/images/TigerTag.png',
    dateAdded: '2026-04-17',
  },
];

export function getToolsByCategory(categoryId: ToolCategoryId): Tool[] {
  return tools.filter(
    (t) => t.category === categoryId || t.categories?.includes(categoryId)
  );
}

/** Tools added within the last `days` days (build-time), newest first. */
export function isNew(tool: Tool, days = 45): boolean {
  const added = new Date(tool.dateAdded + 'T00:00:00Z').getTime();
  return Date.now() - added < days * 24 * 60 * 60 * 1000;
}
