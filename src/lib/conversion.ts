/**
 * The contract between `TrackingFields.astro` (mints the id and submits it) and
 * `ConversionTracking.astro` (fires the pixel with it).
 *
 * Meta deduplicates a browser event against a server event when both carry the
 * same **event name** and the same **event id**. Without an id, a site that
 * reports conversions from both sides counts every submission twice — and
 * nothing looks wrong, the numbers are just quietly inflated. That is the state
 * konforme-ki.de was in the moment its server-side Conversions API went live.
 *
 * Both halves must agree on the name too. Firing `Lead` in the browser while
 * the server reports `Contact` for the same submission does not double-count a
 * single event — it records two different ones, which is worse, because the
 * totals look plausible.
 */

/** Hidden field name. The funnel API reads this as the submission's event id. */
export const EVENT_ID_FIELD = 'event_id';

/** Marks the input so the delegated submit handler can find it. */
export const EVENT_ID_ATTR = 'data-df-event-id';

/**
 * sessionStorage key carrying the id across the form's `_next` redirect.
 *
 * Deliberately one key rather than one per form: a visitor submits exactly one
 * form per navigation, and `ConversionTracking` clears it as soon as it fires.
 * A second submission overwrites it, so a stale value cannot be re-counted.
 *
 * sessionStorage rather than the URL, because the id would otherwise have to be
 * appended to `_next` — which is validated against the site's origin allowlist
 * server-side, and is a query parameter the visitor would see and could share.
 */
export const EVENT_ID_KEY = 'df_event_id';

/**
 * A random id, `crypto.randomUUID` where available.
 *
 * That API needs a secure context, so it is missing over plain http on anything
 * but localhost. The fallback keeps dev working; it is not required to be
 * cryptographically strong, only unique enough that two submissions never
 * collide and get merged into one conversion.
 */
export function newEventId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `df-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
