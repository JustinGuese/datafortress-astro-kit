# Changelog

All notable changes to this package. Versions follow [semver](https://semver.org/);
while `0.x`, a **minor** bump may contain breaking changes.

Removing or renaming an export is breaking for every consuming site — grep the
sibling repos' `src/` first and update the call sites in the same release.

## [Unreleased]

## [0.4.0] — 2026-08-25

### Changed

- **The scope boundary moved.** The README used to say the visible layer was out
  of scope and that section components must never be added here. That was wrong
  in a way that worked against the point of the package: a landing page is a
  known sequence of moves, the sequence is the same across these sites, and only
  the words differ. The goal for a child site is now **`copy.ts` plus a
  palette**. The rule that line was protecting — *divergence goes through named
  slots or a separate component, never a boolean variant prop* — is unchanged
  and now stated on its own.

### Added

The article layer and the remaining funnel sections.

- **`ArticleLayout.astro`** — breadcrumbs, sticky TOC, header, body, FAQ,
  disclaimer, CTA and read-next in one component, with everything site-specific
  behind the `kicker` / `aside` / `disclaimer` / `cta` slots. This was ~455 lines
  duplicated across two page templates on one site, and the SEO furniture it
  carries is worth nothing if it is only on some articles — which it was.
- **`ArticleGrid.astro`** — the article card grid, shared by index-page category
  sections and the read-next strip. Those two had already drifted into two
  slightly different cards on the same site.
- **`Breadcrumbs.astro`**, **`ReadingProgress.astro`** — the pieces
  `ArticleLayout` composes, usable on their own.
- **`ProofBlock.astro`** — quotes with an outcome attached, over a counter strip.
  Its `unverified` prop prints a build warning on every build: these sites all
  get scaffolded with placeholder testimonials, and shipping one is misleading
  advertising (§5 UWG in DE). The starter asserts the warning is emitted, so it
  cannot be quietly deleted.
- **`CompareBlock.astro`** — your offer against the alternatives a buyer is
  actually weighing, over the same `CompareRow` type as `PricingMatrix`.
- **`SectionHeader.astro`** — eyebrow / headline / lead, the shape that opens
  every section and had been retyped ~20 times per site with drifting sizes. The
  `eyebrow` slot lets a site keep its own tag markup while adopting the block.
- **`CtaBand.astro`** — the closing CTA band. This one *does* take a secondary
  CTA, unlike `HeroBlock`; at the foot of the page the reader has self-selected.
- **`lib/compare`** (`CompareColumn`, `CompareRow`, `compareCell`,
  `assertSingleHighlight`), **`lib/proof`**, **`lib/article`** (`ArticleCard`,
  `TocEntry`, `tocFrom`).

`lib/pricing` re-exports `CompareRow` from `lib/compare`, so existing imports
keep working.

## [0.3.0] — 2026-08-25

### Added

Section blocks. The kit now covers most of a landing page, so a new site is
mostly a copy file plus a palette.

- **`FormBlock.astro`** — a Formspree form with its plumbing wired: action,
  hidden `form` name, the `_next` redirect carrying a success flag,
  `TrackingFields`, and the submit button. That boilerplate appeared five times
  on pruefanfrage.de and had already drifted — one form was missing its
  honeypot, another its `_next`.
- **`FaqBlock.astro`** — `<details>` accordion plus FAQPage JSON-LD emitted from
  the *same array*, so markup whose answers are not visible on the page (a
  manual-action risk) is impossible to write.
- **`PricingCards.astro`** and **`PricingMatrix.astro`** over a shared
  `lib/pricing` `Tier` type. Two layouts rather than one component with a
  `layout` flag: pruefanfrage uses a row-wise matrix, konforme-ki column cards,
  and those are genuinely different presentations of the same data. The matrix
  keys `values` by `Tier.id`, so renaming a tier is a type error instead of a
  silently blank column, and a missing value renders as an em dash — itself
  information. Its `caption` is required, because a comparison table is
  meaningless to a screen reader without one.
- **`ScarcityBlock.astro`** — honest capacity scarcity. Deliberately not a
  countdown: a clock that restarts on reload reads as a trick. `layout` is the
  one justified presentation switch, since both sites independently arrived at
  the same two densities of the same content.
- `Tier.badge` for a "most popular" label.

## [0.2.2] — 2026-08-25

### Added

- **`HeroBlock.astro`** — the above-the-fold hook, unified from the two sites'
  diverged heroes. Takes **exactly one `cta`**; there is deliberately no
  `secondaryCta` prop, because both sites' funnel doc says "one CTA above the
  fold, nothing else clickable" and konforme-ki's hero rendered two competing
  buttons. The conversion rule is enforced by the type, not by a comment.
  A subordinate path goes in the `cta-secondary` slot. Content is available as
  props for the common case and as slots when the copy needs markup; the aside
  slot takes whatever each site puts beside the headline (a file-folder card, a
  hash-chain diagram) with no variant flag.
- **`Field.astro`** — one labelled `input` / `select` / `textarea`. Sites had 24
  copies of this markup with two drifting class variants.
- **`ArrowRight.astro`** — the CTA arrow, previously inlined 16 times on
  pruefanfrage.de alone.

### Changed

- The prime directive in AGENTS.md said *never* add a section component.
  Revised: share the section's data shape, schema wiring and tracking; let
  visual divergence happen through named slots or by opting out entirely —
  never through boolean variant props.

### Note

- `v0.2.1` was tagged by hand rather than with `npm version`, so `package.json`
  at that tag still read `0.2.0`. The `prepublishOnly` guard refused the publish
  and nothing reached npm; the tag is inert. Always release with
  `npm version <patch|minor>` so the tag and the manifest move together.

## [0.2.0] — 2026-08-25

### Added

- **Consent withdrawal.** Any element with `data-consent-reopen` re-opens the
  banner, and declining now clears the `_ga*` / `_fb*` cookies already on the
  device. Previously the banner appeared once per browser and an accept was
  permanent — non-compliant with GDPR Art. 7(3). The banner also manages focus
  on open/close.
- `lib/site` — `defineSiteConfig()` and `formspreeAction()`.
- `examples/starter` — the `degit` target for new sites, which is also the CI
  fixture and the README quickstart, so the three cannot drift.

### Changed

- Consumers must **not** add `@source` for this package. It is unnecessary —
  every component uses scoped styles — and it makes Tailwind emit unused
  utilities: on pruefanfrage.de the built CSS went 41 kB → 75 kB with no visual
  change. Documented in README §2 and AGENTS.md.

### Fixed

- `legalSchema()` / `articleSchema()` rejected an unquoted YAML date
  (`updated: 2026-08-25` parses as `Date`, not `string`). Both spellings are now
  accepted and normalised to `YYYY-MM-DD`.
- Added `--color-support-bright` and `--color-premium-bright`: both sites carry
  two shades of those roles.

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
