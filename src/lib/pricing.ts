/**
 * The shared shape of an offer ladder.
 *
 * Both sites present tiers, but differently: pruefanfrage.de uses a row-wise
 * matrix so a buyer can compare like-for-like, konforme-ki uses column cards.
 * Those are genuinely different layouts, so the kit ships BOTH
 * (`PricingCards`, `PricingMatrix`) over this one type — rather than one
 * component with a `layout` flag.
 *
 * What is worth sharing is the data shape and the tracking contract, not the
 * grid. A site whose ladder needs a third presentation writes its own component
 * against this same `Tier[]` and loses nothing.
 */

export interface Tier {
  /** Stable id. Used as the analytics label on the CTA and as the column key. */
  id: string;
  name: string;
  /** Rendered as-is, e.g. '€49' or 'ab €1.900'. */
  price: string;
  /** Qualifier under the price, e.g. 'pro Fall · erste 3 gratis'. */
  priceNote?: string;
  /** One line of positioning. */
  tagline?: string;
  cta?: { label: string; href: string };
  /**
   * The tier you want chosen. Renders inverted. Exactly one should carry it —
   * highlighting two highlights neither.
   */
  highlight?: boolean;
  /** Free-form bullets. `PricingCards` renders these; `PricingMatrix` ignores them. */
  features?: string[];
  /** Short label over the tier, e.g. "Most popular". Usually only on the highlighted one. */
  badge?: string;
}

/**
 * One comparison row. `values` is keyed by `Tier.id`, so a renamed tier fails
 * loudly at the type level instead of silently blanking a column.
 *
 * A missing value renders as an em dash — which is itself information, and the
 * reason the matrix beats independent cards: every row is answered by every
 * tier.
 */
export interface CompareRow {
  label: string;
  /** Group heading this row sits under, if the table is sectioned. */
  group?: string;
  values: Record<string, string | boolean>;
}

/** Highlighting more than one tier defeats the purpose; catch it in dev. */
export function assertSingleHighlight(tiers: Tier[]): void {
  const n = tiers.filter((t) => t.highlight).length;
  if (n > 1) {
    console.warn(
      `[astro-kit] ${n} tiers are highlighted. Highlighting more than one removes the ` +
        `signal — pick the tier you actually want chosen.`,
    );
  }
}
