/**
 * Dancer video library.
 * Every video listed on /dancer/videos/ lives here. Add an entry and it
 * automatically appears in its section (Videos or the Interviews subsection).
 *
 * To add a video, copy this template into the `dancerVideos` array below:
 * {
 *   id: 'unique-slug',
 *   title: 'Video Title',
 *   description: 'A sentence about what the video covers.',
 *   url: 'https://www.youtube.com/watch?v=...', // YouTube or Vimeo
 *   category: 'interviews', // 'videos' | 'interviews'
 *   author: 'Speaker or channel name',          // optional
 *   dateAdded: '2026-07-16',                     // optional, YYYY-MM-DD
 * },
 */

export type DancerVideoCategoryId = 'videos' | 'interviews';

export interface DancerVideoCategory {
  id: DancerVideoCategoryId;
  title: string;
  blurb: string;
}

/** Sections rendered on /dancer/videos/, in order. "interviews" is a subsection of videos. */
export const dancerVideoCategories: DancerVideoCategory[] = [
  {
    id: 'videos',
    title: 'Videos',
    blurb: 'Performances, lessons, and talks for tango dancers.',
  },
  {
    id: 'interviews',
    title: 'Interviews',
    blurb: 'Conversations with dancers, teachers, and maestros of the tango world.',
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
 * The video list. Empty for now — this section is under construction.
 * Add entries using the template in the comment at the top of this file.
 */
export const dancerVideos: DancerVideo[] = [];

/** Videos in a given section, newest first when dates are present. */
export function videosByCategory(category: DancerVideoCategoryId): DancerVideo[] {
  return dancerVideos
    .filter((v) => v.category === category)
    .sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''));
}
