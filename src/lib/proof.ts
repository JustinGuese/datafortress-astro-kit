/**
 * Types for `ProofBlock`. They live here rather than in the component's
 * frontmatter so a site can type its `copy.ts` entries without importing an
 * `.astro` file for a type.
 */

export interface ProofQuote {
  /** Short reference, e.g. a case number. Keeps attribution concrete without naming anyone. */
  ref?: string;
  quote: string;
  /** Who said it — a role, if the person is not named. */
  role: string;
  /** Where they said it from, e.g. 'Ambulanter Pflegedienst · ~140 Klienten · NRW'. */
  context?: string;
  /**
   * The outcome. This is the line that converts — "sehr zufrieden" persuades
   * nobody, "2 von 3 Herabstufungen abgewendet" is the sentence a buyer repeats
   * to their boss. Treat a quote without one as not yet finished.
   */
  metric?: string;
}

export interface ProofStat {
  value: string;
  label: string;
}
