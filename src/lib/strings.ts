/**
 * User-facing copy for kit components.
 *
 * Every string here has an ENGLISH default and every component accepts a
 * `strings` prop to override it. No German (or any other language) may be
 * hardcoded in a kit component — the kit is consumed by sites in different
 * languages, and a hardcoded string bakes one site's locale into all of them.
 *
 * Interpolation uses `{placeholder}` + `fill()` rather than template literals
 * or positional `%s`, so a translation is free to reorder the placeholders.
 */

/** Replaces every `{key}` in `template` with `values[key]`. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

export interface CookieBannerStrings {
  /** Body copy. `{privacyLink}` is NOT interpolated here — the link is rendered as an element. */
  message: string;
  /** Link text pointing at the privacy policy. */
  privacyLinkLabel: string;
  acceptLabel: string;
  declineLabel: string;
  /** Accessible label for the banner region. */
  regionLabel: string;
}

export const defaultCookieBannerStrings: CookieBannerStrings = {
  message:
    'We use cookies to improve your experience and analyse our traffic. Clicking "Accept all" consents to our use of cookies.',
  privacyLinkLabel: 'Privacy policy',
  acceptLabel: 'Accept all',
  declineLabel: 'Decline all',
  regionLabel: 'Cookie consent',
};

export interface StickyCtaStrings {
  /** Optional line above the button. Supports `{placeholder}` via `fill()` at the call site. */
  note?: string;
  ctaLabel: string;
}

export const defaultStickyCtaStrings: StickyCtaStrings = {
  ctaLabel: 'Get started',
};
