/**
 * The contract between `Attribution.astro` (writes) and `TrackingFields.astro`
 * (is written into).
 *
 * `Attribution` persists the FIRST touch that brought a browser to the site and
 * stamps it into any element carrying `data-track-field="<name>"`. Without a
 * shared list of names the two halves drift and forms silently submit empty
 * attribution — which reads exactly like organic traffic in the reports.
 */

export const TRACK_FIELD_ATTR = 'data-track-field';

/** Default localStorage key. Override per site if two sites share a domain. */
export const DEFAULT_ATTRIBUTION_KEY = 'df_attribution';

export const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

/** Ad-platform click identifiers, collapsed into a single `ad_click_id` field. */
export const CLICK_ID_PARAMS = ['fbclid', 'gclid', 'ttclid', 'msclkid'] as const;

/** Every field name `Attribution` can fill and `TrackingFields` renders. */
export const ATTRIBUTION_FIELDS = [
  ...UTM_PARAMS,
  'ad_click_id',
  'referrer',
  'first_seen',
] as const;

export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];
