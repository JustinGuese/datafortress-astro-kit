/**
 * Shapes for the article layer (`ArticleLayout`, `ArticleGrid`).
 *
 * Deliberately not tied to Astro's content-collection entry type: the same grid
 * renders a "read next" strip built from collection entries and a hand-written
 * list of external links, and coupling it to `CollectionEntry<'articles'>` would
 * rule the second one out for no gain.
 */

export interface ArticleCard {
  href: string;
  title: string;
  description?: string;
  /** Small label above the title, usually the category. */
  kicker?: string;
  /** Small label at the foot, e.g. '7 Min. Lesezeit'. */
  meta?: string;
  /**
   * Read-more affordance at the foot of the card, e.g. 'Lesen'. Rendered with
   * the arrow — the whole card is already the link, so this is a visual cue,
   * not a nested anchor.
   */
  cta?: string;
}

/** A table-of-contents entry, matching the shape Astro's `render()` returns. */
export interface TocEntry {
  slug: string;
  text: string;
  depth?: number;
}

/**
 * Astro's `render()` gives every heading in the document. A table of contents
 * built from all of them is unreadable; `depth === 2` is almost always what you
 * want, and this makes that the one-liner rather than a filter each page
 * re-invents.
 */
export function tocFrom(headings: TocEntry[], depth = 2): TocEntry[] {
  return headings.filter((h) => h.depth === depth);
}
