# Changelog

All notable changes to this package. Versions follow [semver](https://semver.org/);
while `0.x`, a **minor** bump may contain breaking changes.

Removing or renaming an export is breaking for every consuming site — grep the
sibling repos' `src/` first and update the call sites in the same release.

## [Unreleased]

## [0.1.0] — 2026-08-25

Initial release. Extracted from `website-pflegenachweisde` and
`website-ai-router-de`, which were the same stack copy-pasted and then drifted.

### Components

- **`Consent.astro`** — Google Consent Mode v2 with all four signals starting
  `denied`; GA4 and the Meta Pixel are injected only after acceptance, and a
  stored acceptance is re-applied on load for returning visitors. Ships no
  `<noscript>` pixel, which cannot be consent-gated.
- **`CookieBanner.astro`** — records the decision and announces it. Scoped
  styles, English default copy, `strings` override.
- **`Attribution.astro`** — first-touch UTM/click-id capture, stamped into
  `[data-track-field]` inputs.
- **`TrackingFields.astro`** — hidden attribution inputs plus a honeypot.
- **`FunnelTracking.astro`** — one delegated `[data-cta]` / `[data-contact-cta]`
  listener for the whole site.
- **`ConversionTracking.astro`** — Formspree redirect handling: reveal panel,
  fire `generate_lead`, strip the flag from the URL.
- **`SeoHead.astro`** — query-free canonical, Open Graph, Twitter, JSON-LD.
- **`StickyCta.astro`** — mobile sticky CTA that hides when a real CTA is on
  screen.

### Libraries

- `lib/seo` — `organizationSchema`, `articleSchema`, `faqSchema`, `breadcrumbSchema`
- `lib/sitemap` — `sitemapConfig()`
- `lib/collections` — `legalSchema()`, `articleSchema(categories)`
- `lib/consent`, `lib/attribution` — the shared event names, storage keys and
  data attributes that keep paired components from desyncing

### Styles

- `styles/tokens.css` — role tokens (`canvas`, `ink`, `accent`, `signal`,
  `support`, `premium`, `line`) with deliberately neutral placeholder values
- `styles/prose.css` — `.article-body`

### Notes

The bug that motivated the extraction: on pruefanfrage.de the cookie banner
dispatched its event and wrote localStorage while the layout loaded GA4 and the
Meta Pixel unconditionally — on a site selling GDPR compliance. Separately, the
funnel-CTA listener existed on 3 of 11 pages in 2 incompatible versions.
