import { defineCollection, z } from 'astro:content';

const djCourses = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    published: z.boolean().default(true),
  }),
});

const djLessons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    course: z.string(),
    order: z.number(),
    published: z.boolean().default(true),
  }),
});

export const collections = {
  'dj-courses': djCourses,
  'dj-lessons': djLessons,
};
