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

/**
 * Any element carrying this attribute re-opens the banner:
 *
 *   <button data-consent-reopen>Cookie-Einstellungen ändern</button>
 *
 * GDPR Art. 7(3): withdrawing consent must be as easy as giving it. Without a
 * reopen path the banner is shown exactly once per browser, ever, and a visitor
 * who accepted has no way back — so put one of these in the footer or the
 * privacy policy of every site.
 */
export const CONSENT_REOPEN_ATTR = 'data-consent-reopen';

/**
 * Cookies dropped by GA4 and the Meta Pixel, cleared on withdrawal.
 *
 * `_ga_<STREAM>` and `_gac_<ID>` are suffixed per property, so matching is by
 * prefix. Consent Mode alone stops FUTURE storage but leaves what is already on
 * the device — which is not what a visitor clicking "decline" expects.
 */
export const TRACKER_COOKIE_PREFIXES = ['_ga', '_gid', '_gat', '_gac_', '_fbp', '_fbc'];
