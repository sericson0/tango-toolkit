import { defineCollection } from 'astro:content';

const djCourses = defineCollection({
  type: 'content',
  schema: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    order: { type: 'number', required: true },
    published: { type: 'boolean', default: true },
  },
});

const djLessons = defineCollection({
  type: 'content',
  schema: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    course: { type: 'string', required: true },
    order: { type: 'number', required: true },
    published: { type: 'boolean', default: true },
  },
});

export const collections = {
  'dj-courses': djCourses,
  'dj-lessons': djLessons,
};
