/**
 * Priority rules for `@astrojs/sitemap`.
 *
 * Legal pages should be indexed but must not compete for rank with the pages
 * that actually convert, so they are pushed right down. `changefreq` is
 * deliberately never emitted — Google has stated it ignores it.
 */

export interface SitemapPriorityOptions {
  /**
   * Path prefixes mapped to a priority, most specific first. An entry whose key
   * ends in `/` also matches its children at a slightly lower priority.
   * Example: `{ '/': 1.0, '/guides/': 0.9 }`
   */
  priorities?: Record<string, number>;
  /** Priority for legal/boilerplate pages. */
  legalPriority?: number;
  /** Paths treated as legal/boilerplate. */
  legalPaths?: string[];
  /** Everything not otherwise matched. */
  defaultPriority?: number;
  /** Substrings that exclude a page from the sitemap entirely. */
  exclude?: string[];
}

/**
 * Returns the options object to hand to `sitemap()` in `astro.config.mjs`:
 *
 *   integrations: [sitemap(sitemapConfig({ priorities: { '/': 1.0 } }))]
 */
export function sitemapConfig(options: SitemapPriorityOptions = {}) {
  const {
    priorities = {},
    legalPriority = 0.2,
    legalPaths = ['/impressum', '/datenschutz', '/agb', '/imprint', '/privacy', '/terms'],
    defaultPriority = 0.6,
    exclude = [],
  } = options;

  // Longest key first, so '/guides/x' wins over '/guides/'.
  const ordered = Object.entries(priorities).sort((a, b) => b[0].length - a[0].length);
  const legal = new Set(legalPaths.map(normalise));

  return {
    ...(exclude.length && {
      filter: (page: string) => !exclude.some((fragment) => page.includes(fragment)),
    }),
    serialize(item: { url: string; priority?: number }) {
      const path = normalise(new URL(item.url).pathname);

      if (legal.has(path)) {
        item.priority = legalPriority;
        return item;
      }

      const exact = ordered.find(([prefix]) => normalise(prefix) === path);
      if (exact) {
        item.priority = exact[1];
        return item;
      }

      // A child of a configured section inherits slightly less than the section.
      const section = ordered.find(
        ([prefix]) => prefix.endsWith('/') && path.startsWith(normalise(prefix) + '/'),
      );
      item.priority = section
        ? Math.max(0, Math.round((section[1] - 0.1) * 10) / 10)
        : defaultPriority;
      return item;
    },
  };
}

/** '/guides/' and '/guides' both become '/guides'; '/' stays '/'. */
function normalise(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}
