import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { legalSchema } from '@justinguese/astro-kit/lib/collections';

export const collections = {
  legal: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/legal' }),
    schema: legalSchema(),
  }),
};
