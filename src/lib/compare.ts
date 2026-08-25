/**
 * The shape of a comparison table.
 *
 * Two different tables in this kit are the same data structure: `PricingMatrix`
 * compares your own tiers against each other, `CompareBlock` compares your offer
 * against the alternatives a buyer is actually weighing (doing it by hand, a raw
 * LLM, a competitor). Same grid, different columns — so they share the row type
 * rather than each inventing one.
 *
 * `values` is keyed by column id in both. A renamed column then fails at the
 * type level instead of silently blanking a column, which is the failure mode a
 * positional `string[]` row has and the reason this is a record.
 */

export interface CompareColumn {
  /** Stable id. The key used in every row's `values`. */
  id: string;
  label: string;
  /** Second line under the label, e.g. 'kostenlos, aber ungeprüft'. */
  note?: string;
  /**
   * The column you want chosen. Renders inverted. Exactly one should carry it —
   * highlighting two highlights neither.
   */
  highlight?: boolean;
}

/**
 * One comparison row. A missing value renders as an em dash — which is itself
 * information, and the reason a matrix beats independent cards: every row is
 * answered by every column.
 */
export interface CompareRow {
  label: string;
  /** Group heading this row sits under, if the table is sectioned. */
  group?: string;
  values: Record<string, string | boolean>;
}

/** Shared by `PricingMatrix` and `CompareBlock`: `true` → ✓, missing → em dash. */
export function compareCell(row: CompareRow, columnId: string): string {
  const v = row.values[columnId];
  if (v === true) return '✓';
  if (v === false || v === undefined || v === '') return '—';
  return v;
}

/** Highlighting more than one column defeats the purpose; catch it in dev. */
export function assertSingleHighlight(
  items: { highlight?: boolean }[],
  what = 'columns',
): void {
  const n = items.filter((t) => t.highlight).length;
  if (n > 1) {
    console.warn(
      `[astro-kit] ${n} ${what} are highlighted. Highlighting more than one removes the ` +
        `signal — pick the one you actually want chosen.`,
    );
  }
}
