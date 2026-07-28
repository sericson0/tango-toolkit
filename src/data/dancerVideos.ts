/**
 * Video library.
 * Every video listed on /videos/ lives here. Add an entry and it
 * automatically appears in its section.
 *
 * Interviews live in their own searchable directory — see
 * src/data/interviews.ts and /videos/interviews/ — not here.
 *
 * To add a video, copy this template into the `dancerVideos` array below:
 * {
 *   id: 'unique-slug',
 *   title: 'Video Title',
 *   description: 'A sentence about what the video covers.',
 *   url: 'https://www.youtube.com/watch?v=...', // YouTube or Vimeo
 *   category: 'videos',                          // or 'music-visualization'
 *   author: 'Speaker or channel name',          // optional
 *   dateAdded: '2026-07-16',                     // optional, YYYY-MM-DD
 * },
 */

export type DancerVideoCategoryId = 'videos' | 'music-visualization';

export interface DancerVideoCategory {
  id: DancerVideoCategoryId;
  title: string;
  blurb: string;
}

/** Sections rendered on /videos/, in order. */
export const dancerVideoCategories: DancerVideoCategory[] = [
  {
    id: 'videos',
    title: 'Videos',
    blurb: 'Performances, lessons, and talks for tango dancers.',
  },
  {
    id: 'music-visualization',
    title: 'Music Visualization',
    blurb: 'Animated visualizations that reveal the structure, layers, and phrasing of classic tango recordings.',
  },
];

export interface DancerVideo {
  id: string;
  title: string;
  description?: string;
  /** YouTube or Vimeo URL — handled by the VideoEmbed component. */
  url: string;
  category: DancerVideoCategoryId;
  /** Speaker, teacher, or channel name. */
  author?: string;
  /** YYYY-MM-DD. */
  dateAdded?: string;
}

/**
 * The video list.
 * Add entries using the template in the comment at the top of this file.
 */
export const dancerVideos: DancerVideo[] = [
  {
    id: 'toda-mi-vida-visualization',
    title: 'Toda Mi Vida',
    author: 'Aníbal Troilo & Francisco Fiorentino, 1941',
    url: 'https://www.youtube.com/watch?v=RDcTfSs2lqU',
    category: 'music-visualization',
    dateAdded: '2026-07-24',
  },
  {
    id: 'nada-visualization',
    title: 'Nada',
    author: 'Carlos Di Sarli & Alberto Podestá, 1944',
    url: 'https://www.youtube.com/watch?v=FxGWhKzwRYY',
    category: 'music-visualization',
    dateAdded: '2026-07-28',
  },
  {
    id: 'el-flete-visualization',
    title: 'El Flete',
    author: 'Juan D\'Arienzo, 1936',
    url: 'https://www.youtube.com/watch?v=RK_iDpPXP1s',
    category: 'music-visualization',
    dateAdded: '2026-07-28',
  },
];

/** Videos in a given section, newest first when dates are present. */
export function videosByCategory(category: DancerVideoCategoryId): DancerVideo[] {
  return dancerVideos
    .filter((v) => v.category === category)
    .sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''));
}
