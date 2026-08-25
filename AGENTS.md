# AGENTS.md — `@datafortress/astro-kit`

Instructions for LLM agents working in this repo. Read this before editing
anything here. `README.md` is for *consumers*; this file is for *contributors*.

## What this is

A shared Astro package holding the **invisible correctness layer** of
DataFortress marketing sites: consent-gated analytics, first-touch attribution,
SEO head, funnel/conversion tracking, prose CSS, role tokens.

It is consumed by sibling repos in `~/code/websites/` via a **pinned git tag**.
There is no build step — `.astro` and `.ts` ship as source and the consumer's
Astro compiles them.

## Prime directive: the scope boundary

Before adding anything, answer: **would a difference between two sites be a bug,
or a feature?**

- **Bug → belongs here.** Consent gating, canonical URLs, attribution, event
  names, JSON-LD shape.
- **Feature → belongs in the site.** `Hero`, `Pricing`, `Faq`, `SocialProof`,
  page funnels, palettes, copy.

**Never add a section/marketing component to this package**, however similar two
sites' heroes look today. A shared `Hero` accumulates `variant` booleans until it
serves nobody. Copying a section between sites is cheap and reversible; a bad
shared abstraction is neither.

If a user asks for a shared `Hero`/`Pricing`/`Faq`, say no and explain the
boundary — do not silently comply.

## Hard rules

These are not style preferences. Each one is a bug that already happened, here
or in `df_flutter_shared`.

1. **Zero colour literals outside `styles/tokens.css`.** No `#hex`, no
   `rgb()`, no named colours in any component. A literal here bakes one site's
   brand into every site. (This is how NaviCare teal ended up inside
   `df_paywall` and made dark mode unreadable.)
2. **Zero hardcoded user-facing copy.** Every string a visitor can read lives in
   `src/lib/strings.ts` with an **English** default and a `strings` prop
   override. Use `{placeholder}` + `fill()`, never template literals or `%s` —
   translations must be free to reorder.
3. **No site vocabulary in types.** No domains, product names, tier names, offer
   names, category slugs. Where a site needs its own set, take a `string` or a
   generic parameter (see `articleSchema(categories)` in `lib/collections.ts`).
4. **Never retype a contract string.** Event names, storage keys and data
   attributes live in `src/lib/consent.ts` and `src/lib/attribution.ts`. Import
   them into both halves. Retyping `'cookie-consent-updated'` in one place is
   *literally the original bug this package exists to prevent.*
5. **Kit components style themselves with scoped `<style>` + role tokens, not
   Tailwind utilities.** Tailwind 4 does not scan `node_modules`; a consumer who
   forgets `@source` would get silently unstyled components with no error
   anywhere. Scoped styles cannot be purged.
6. **Keep files under ~250 lines.**

## Architecture: paired contracts

Three component pairs talk through the DOM rather than through props, because
one half must sit in `<head>` and the other in `<body>`. **These are the
fragile seams — treat them as a unit:**

| writes | reads | via |
|---|---|---|
| `CookieBanner.astro` | `Consent.astro` | `CONSENT_EVENT`, `CONSENT_STORAGE_KEY` (`lib/consent.ts`) |
| `Attribution.astro` | `TrackingFields.astro` | `TRACK_FIELD_ATTR`, `ATTRIBUTION_FIELDS` (`lib/attribution.ts`) |
| your markup (`data-cta`) | `FunnelTracking.astro` | the `data-cta` / `data-contact-cta` attributes |

**Changing one half means changing the other in the same commit.** A desynced
pair fails *silently and plausibly*: the banner animates, the form submits, the
button clicks — and nothing is gated, recorded, or counted.

## Before you change anything

1. `grep` the consuming sites for the symbol:
   `grep -rn "SymbolName" ~/code/websites/website-*/src/`
2. If it appears anywhere, removing or renaming it is a **breaking change** —
   update those call sites in the same release and bump the minor/major.
3. Check `README.md` §6 for who is pinned to what.

## Common tasks

**Adding a component.** Confirm it passes the scope boundary. Scoped `<style>`,
role tokens, English strings in `lib/strings.ts`, add to the `exports` map only
if the wildcard `./*.astro` doesn't already cover it (it usually does), then
document it in `README.md` §3.

**Adding a role token.** Add it to `styles/tokens.css` with a neutral
placeholder default and a comment saying what ROLE it plays. Add the row to
`README.md` §4. Never name it after an appearance (`--color-red`) or a brand
(`--color-stamp`) — name it after its job (`--color-signal`).

**Changing a default string.** It must stay English. If a site needs different
copy, that is a `strings` prop at the call site, not an edit here.

**Changing an event name.** This breaks historical continuity in every consuming
site's GA4 property. Say so explicitly and get confirmation before doing it.

## Gotchas paid for already

- **A green consent step can gate nothing.** `CookieBanner` dispatched its event
  and wrote localStorage while `Site.astro` loaded GA4 unconditionally — on a
  site selling GDPR compliance. Everything looked fine. When touching consent,
  verify with the browser (below), never by reading the code.
- **`<noscript>` Meta pixels cannot be consent-gated.** They fire on load,
  full stop. `Consent.astro` deliberately ships none. Do not add one back
  "for completeness".
- **Per-page listeners drift.** The funnel-CTA listener existed on 3 of 11
  pages in 2 incompatible versions, so the sticky bar tracked nothing. That is
  why `FunnelTracking` delegates from `document` and is rendered **once per
  site**. Never add a second listener for the same attribute — it double-counts.
- **One event name per label is an anti-pattern.** `${tier}_cta_click` makes
  "total CTA clicks" unanswerable and burns GA4's event-name cap. One name, the
  label as a parameter.
- **`localStorage` throws in private mode / with site data blocked.** Every
  access in this package is wrapped in `try/catch` and every path renders
  correctly with no stored value. Keep it that way.
- **Returning visitors never see the banner**, so they never fire the event.
  `Consent.astro` re-applies the stored decision on load. Any new
  consent-dependent feature needs the same path.
- **Astro view transitions re-run nothing.** Components with listeners re-init
  on `astro:after-swap`. New client scripts need the same, or they die after the
  first client-side navigation.
- **Never commit a `file:` dep or a `pubspec_overrides`-style local path.** Use
  `npm link` for local development; it leaves `package.json` untouched.
- **`npm link` breaks scoped styles without `preserveSymlinks`.** A linked
  checkout fails the build with *"No cached compile metadata found for
  …CookieBanner.astro?astro&type=style"*: Astro keys its compile cache by
  resolved path, Vite resolves the symlink to the real location, and the two
  never match. Fix in the **consuming site's** `astro.config.mjs`:
  `vite: { resolve: { preserveSymlinks: true } }`. A normal tarball or git
  install is unaffected — so this failure appears only in local dev, which is
  exactly when it is most confusing. Do not "fix" it by moving component styles
  to Tailwind utilities; that trades a loud build error for silent unstyled
  output in production.

## Verifying a change

Static reading is not sufficient for anything in this package — the failure mode
is code that looks correct and gates nothing.

Build a consuming site, `npm run preview`, and drive it with the chrome-devtools
MCP in an **isolated browser context** (so localStorage starts clean):

```js
// fresh visitor — must be [] and all four signals denied
performance.getEntriesByType('resource').map(r => r.name)
  .filter(u => /googletagmanager|connect\.facebook/.test(u))
window.dataLayer.filter(a => a[0] === 'consent')
```

Cover all four paths every time consent is touched:

1. **Fresh visitor** → zero tracker requests, all signals `denied`, banner shown.
2. **Accept** → both trackers load, `consent update` all `granted`.
3. **Reload after accept** → both load immediately, banner NOT re-shown.
4. **Decline, then reload** → still zero tracker requests, banner NOT re-shown.

For tracking changes, click a CTA and assert exactly one event lands in
`dataLayer` — one, not zero (no listener) and not two (duplicate listeners).

## Releasing

See `README.md` §5. Short version: `npm version <patch|minor|major>`,
`git push --tags`, then bump the pin in each consuming site. **Never tell a
consumer to install `#main`.**
