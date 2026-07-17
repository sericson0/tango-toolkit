/**
 * Dancer resources — guides, downloads, and learning materials for dancers.
 * Every card in the "Resources" section on /dancer/ lives here. Add an entry
 * and it appears automatically.
 *
 * Template:
 * {
 *   id: 'resource-name',
 *   title: 'Resource Title',
 *   author: 'Author Name',
 *   description: 'A sentence or two for the card.',
 *   url: 'https://example.com',        // card click / "Visit site"
 *   downloadUrl: 'https://example.com/download', // optional — adds a button
 *   downloadLabel: 'Get the Guide',    // optional button label (default "Download")
 *   image: '/images/example.png',      // optional cover/preview in /public/images
 *   external: true,                    // opens links in a new tab
 *   dateAdded: '2026-07-16',
 * },
 */

export interface DancerResource {
  id: string;
  title: string;
  /** Who created it. */
  author: string;
  /** Short blurb shown on the card. */
  description: string;
  /** Card click / "Visit site" target. */
  url: string;
  /** Optional direct link — renders a download button on the card. */
  downloadUrl?: string;
  /** Label for the download button (default "Download"). */
  downloadLabel?: string;
  /** Cover/preview image (in /public/images). */
  image?: string;
  /** true → links open in a new tab (third-party sites). */
  external?: boolean;
  /** ISO date (YYYY-MM-DD) the resource was added. */
  dateAdded: string;
}

export const dancerResources: DancerResource[] = [
  {
    id: 'sharna-tango-study-guide',
    title: 'Tango Study Guide',
    author: 'Sharna Fabiano',
    description:
      'A 16-page guide distilled from twenty years of teaching and troubleshooting. \
Improve your retention in classes and workshops, get the most out of private lessons, and \
communicate effectively with practice partners — and start to develop your own style.',
    url: 'https://www.sharnafabiano.com/learning-resources/',
    downloadUrl: 'https://www.sharnafabiano.com/learning-resources/#tango-training',
    downloadLabel: 'Get the Guide',
    image: '/images/TangoLearningGuide.png',
    external: true,
    dateAdded: '2026-07-16',
  },
];
