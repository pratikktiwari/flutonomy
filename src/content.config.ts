import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    minutes: z.number(),
    tools: z.array(z.string()).default([]),
  }),
});

export const collections = { lessons };
