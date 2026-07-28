import { defineCollection, z } from 'astro:content';

/**
 * Dancer content.
 *
 * One .mdx file per topic, living in a folder named after its section:
 *
 *   src/content/dancer/steps/walk.mdx        ->  /dancer/steps/walk/
 *   src/content/dancer/musicality/rhythm.mdx ->  /dancer/musicality/rhythm/
 *
 * The folder name must match a section id in src/data/dancerSections.ts.
 * Drop a new file in and it appears on the section hub, in the nav dropdown,
 * and in the prev/next footer without touching any other file.
 */
const dancer = defineCollection({
  type: 'content',
  schema: z.object({
    /** Shown as the page <h1> and on hub cards. */
    title: z.string(),
    /** One-line hook shown on cards and in the hero. */
    summary: z.string(),
    /** Longer meta description; falls back to `summary`. */
    description: z.string().optional(),
    /**
     * Which tool from the toolbox illustration represents this topic.
     * See TOOL_ICONS in src/components/dancer/ToolIcon.astro.
     */
    tool: z
      .enum([
        'hammer',
        'wrench',
        'pliers',
        'screwdriver',
        'spanner',
        'ruler',
        'gears',
        'sliders',
        'compass',
        'toolbox',
      ])
      .default('wrench'),
    /** Sort order within the section hub. Lower comes first. */
    order: z.number().default(100),
    /** Who the topic is aimed at — rendered as a chip. */
    level: z.enum(['new', 'developing', 'all']).default('all'),
    /** Hide from hubs, nav, and routing without deleting the file. */
    draft: z.boolean().default(false),
    /**
     * Cross-links rendered in the "Keep going" footer. Point them anywhere —
     * other dancer topics, the DJ side, discographies, or an external site.
     */
    related: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          note: z.string().optional(),
        }),
      )
      .default([]),
    /**
     * Write it as a bare YAML date — `updated: 2026-07-28`. Shown as
     * "Updated 28 July 2026" in the page header.
     */
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { dancer };
