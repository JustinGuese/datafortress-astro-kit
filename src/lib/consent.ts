/**
 * The contract between `CookieBanner.astro` and `Consent.astro`.
 *
 * These two components talk to each other only through a DOM event and a
 * localStorage key — they are separate components because the banner is visual
 * and the loader must sit in `<head>` before any tracker call.
 *
 * That indirection is exactly what silently broke on pruefanfrage.de: the
 * banner dispatched the event, no listener existed, and the trackers loaded
 * unconditionally anyway. The banner looked like it worked. Keeping both names
 * here means a rename cannot desynchronise the two halves.
 */

/** Dispatched on `window` with `detail: { accepted: boolean }`. */
export const CONSENT_EVENT = 'cookie-consent-updated';

/** localStorage key holding the string `'true'` | `'false'`, or absent if undecided. */
export const CONSENT_STORAGE_KEY = 'cookie-consent';
