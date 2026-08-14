import { getCollection, type CollectionEntry } from 'astro:content';
import { isLiveSection, type DancerSectionId } from './dancerSections';

export type DancerTopic = CollectionEntry<'dancer'>;

/** A topic's section id, taken from its folder: `steps/walk` -> `steps`. */
export function topicSection(entry: DancerTopic): DancerSectionId {
  return entry.slug.split('/')[0] as DancerSectionId;
}

/** A topic's own slug, without the section folder: `steps/walk` -> `walk`. */
export function topicSlug(entry: DancerTopic): string {
  return entry.slug.split('/').slice(1).join('/');
}

export function topicHref(entry: DancerTopic): string {
  return `/dancer/${entry.slug}/`;
}

/**
 * Every publishable topic, sorted by section order then title.
 * Drafts are visible while running `astro dev` so you can write in place,
 * and dropped from the production build.
 */
export async function getDancerTopics(): Promise<DancerTopic[]> {
  const entries = await getCollection('dancer', ({ data }) => import.meta.env.DEV || !data.draft);
  return entries
    .filter((entry) => isLiveSection(topicSection(entry)))
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

/** Topics belonging to one section, in hub order. */
export async function getSectionTopics(section: DancerSectionId): Promise<DancerTopic[]> {
  const topics = await getDancerTopics();
  return topics.filter((entry) => topicSection(entry) === section);
}

/** Previous/next topic within the same section, for the page footer. */
export async function getSiblingTopics(entry: DancerTopic) {
  const siblings = await getSectionTopics(topicSection(entry));
  const i = siblings.findIndex((s) => s.slug === entry.slug);
  return {
    prev: i > 0 ? siblings[i - 1] : undefined,
    next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : undefined,
  };
}
