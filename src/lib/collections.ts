/**
 * Shared Astro content-collection schemas.
 *
 * These cover the two collections every DataFortress marketing site has: legal
 * boilerplate, and a long-form SEO article series. Both are factories rather
 * than fixed collections because the article categories are site-specific
 * vocabulary — that part must NOT be baked into the kit.
 *
 * Usage in `src/content.config.ts`:
 *
 *   import { defineCollection } from 'astro:content';
 *   import { glob } from 'astro/loaders';
 *   import { legalSchema, articleSchema } from '@justinguese/astro-kit/lib/collections';
 *
 *   export const collections = {
 *     legal: defineCollection({
 *       loader: glob({ pattern: '*.md', base: './src/content/legal' }),
 *       schema: legalSchema(),
 *     }),
 *     guides: defineCollection({
 *       loader: glob({ pattern: '*.md', base: './src/content/guides' }),
 *       schema: articleSchema(['pricing', 'compliance']),
 *     }),
 *   };
 */
import { z } from 'astro:schema';

/**
 * A `YYYY-MM-DD` string, accepting either YAML spelling.
 *
 * Unquoted `updated: 2026-08-25` is parsed by YAML as a **Date**, while
 * `updated: "2026-08-25"` stays a string — so a plain `z.string()` rejects the
 * more natural of the two with an error that says nothing useful
 * ("Expected type string, received object"). Accept both and always hand back a
 * string, so authors never have to know this.
 */
const isoDate = z
  .union([z.string(), z.date()])
  .transform((value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
  );

export function legalSchema() {
  return z.object({
    title: z.string(),
    /** Date of the last substantive revision. */
    updated: isoDate.optional(),
  });
}

/**
 * @param categories The site's own category slugs. Declared as a non-empty
 *   tuple so a typo in an article's frontmatter FAILS THE BUILD rather than
 *   silently dropping the article out of the category nav.
 */
export function articleSchema<T extends readonly [string, ...string[]]>(categories: T) {
  return z.object({
    /** H1 of the article. */
    title: z.string(),
    /** Keyword-first meta title; may differ from the H1. Falls back to `title`. */
    metaTitle: z.string().optional(),
    description: z.string(),
    /** The single search intent this article targets. */
    keyword: z.string(),
    category: z.enum(categories),
    /** Date of the last substantive revision. */
    updated: isoDate,
    /** Minutes. */
    readingTime: z.number(),
    /** Order within the category nav; lower first. */
    order: z.number().default(0),
    /**
     * Rendered as visible Q&A AND as FAQPage JSON-LD. Google only honours the
     * rich result when the answers are genuinely on the page, so never let
     * these two diverge.
     */
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    /** Slugs of related articles, for the internal-link block. */
    related: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  });
}
