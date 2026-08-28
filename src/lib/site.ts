/**
 * The one config object every site writes.
 *
 * `defineSiteConfig` is an identity function that exists purely for its types:
 * it gives autocomplete, catches a typo'd key at build time, and — more
 * importantly — makes the SHAPE the same across every site, so a person (or an
 * agent) moving between two repos does not have to relearn where the GA4 id
 * lives.
 *
 *   // src/config/site.ts
 *   import { defineSiteConfig } from '@justinguese/astro-kit/lib/site';
 *   export const site = defineSiteConfig({ name: 'example.de', … });
 *
 * The generic preserves literal types, so `site.name` is `'example.de'` rather
 * than `string` — `as const` is not needed and adding it changes nothing.
 *
 * Everything here is PUBLIC: it is compiled into static HTML that anyone can
 * read. Never put an API key, a Formspree *account* token, or anything secret
 * in this object. Analytics IDs and Formspree *form* ids are public by design.
 */
import type { PostalAddress } from './seo';

export interface SiteConfig {
  /** Public brand name. Used as og:site_name and in JSON-LD. */
  name: string;
  /** Registered entity, when it differs from the brand. */
  legalName?: string;
  /** Origin, no trailing slash. Must match `site` in astro.config.mjs. */
  url: string;
  /** One sentence. Default meta description and JSON-LD description. */
  description: string;
  /** og:locale, e.g. 'de_DE'. */
  locale?: string;
  /** `lang` attribute, e.g. 'de'. */
  lang?: string;
  address?: PostalAddress;
  /** Country the service is offered in, e.g. 'Deutschland'. */
  areaServed?: string;

  /** GA4 measurement ID. Omit to load no analytics. */
  ga4Id?: string;
  /** Meta Pixel ID. Omit to load no pixel. */
  metaPixelId?: string;
  /** Formspree form id — the part after `/f/`. Public by design. */
  formspreeId?: string;
  /**
   * Base URL of a self-hosted forms endpoint, no trailing slash — e.g.
   * `https://marketing-api.datafortress.cloud/v1/forms/konforme-ki`. When set,
   * `FormBlock` posts to `<formsBase>/<form name>` instead of Formspree.
   *
   * The endpoint must answer a form POST with a **303 to `_next`**, because
   * that redirect is what makes `ConversionTracking` fire. A JSON response
   * silently stops every conversion on the site.
   */
  formsBase?: string;

  /** Where the cookie banner's privacy link points. */
  privacyHref?: string;
  /** Social preview image, relative to the site root. */
  ogImage?: string;
}

export function defineSiteConfig<const T extends SiteConfig>(config: T): T {
  return config;
}

/** `https://formspree.io/f/<id>` — so the URL is never hand-assembled twice. */
export function formspreeAction(formspreeId: string): string {
  return `https://formspree.io/f/${formspreeId}`;
}

/**
 * Where a form posts: the site's own endpoint when it has one, Formspree
 * otherwise.
 *
 * Sites migrate off Formspree one at a time, so both have to work at once —
 * and `FormBlock` should not grow a boolean for which backend a site is on.
 * Setting `formsBase` in the site config is the whole migration; the form
 * markup and every field name stay identical, which is the point.
 */
export function formAction(
  config: Pick<SiteConfig, 'formsBase' | 'formspreeId'>,
  formName: string,
): string {
  if (config.formsBase) return `${config.formsBase.replace(/\/$/, '')}/${formName}`;
  if (config.formspreeId) return formspreeAction(config.formspreeId);
  throw new Error(
    `No form endpoint for "${formName}": set formsBase or formspreeId in the site config.`,
  );
}
