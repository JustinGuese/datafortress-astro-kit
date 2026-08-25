import { defineSiteConfig } from '@datafortress/astro-kit/lib/site';

/**
 * Everything that identifies this site. Nothing below should ever be typed
 * into a component again — that is how a logo ends up showing the wrong
 * domain, and how a pixel swap turns into a nine-file sweep.
 *
 * All of it is PUBLIC: it compiles into static HTML. No secrets here.
 */
export const site = defineSiteConfig({
  name: 'example.de',
  legalName: 'DataFortress.cloud GmbH',
  url: 'https://example.de',
  description: 'What this site does, in one sentence.',
  locale: 'de_DE',
  lang: 'de',
  address: {
    streetAddress: 'Gewerbestraße 13',
    postalCode: '82064',
    addressLocality: 'Straßlach-Dingharting',
    addressCountry: 'DE',
  },
  areaServed: 'Deutschland',

  ga4Id: 'G-SMOKETEST1',
  metaPixelId: '111111111111111',
  formspreeId: 'xxxxxxxx',

  privacyHref: '/datenschutz',
});
