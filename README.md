# @datafortress/astro-kit

Shared plumbing for DataFortress Astro landing pages: consent-gated analytics,
first-touch attribution, SEO head, funnel and conversion tracking.

## 1. What this is — and what it deliberately is not

**In scope: the invisible layer, where a bug fixed once must propagate.**
Consent gating, attribution, canonical URLs, JSON-LD, click and conversion
events. Nobody looks at these, everybody depends on them, and every site needs
them to behave identically.

**Out of scope: the visible layer.** `Hero`, `Pricing`, `Faq`, `SocialProof`,
the page funnel itself — these live in each site and are *supposed* to diverge.
Their divergence is the product.

> Do not add a section component here. A shared `Hero` accumulates `variant`
> flags until it serves nobody. If you want a section to look the same on two
> sites, copy it — copying is cheap and reversible; a bad shared abstraction is
> neither.

The line is: **would a difference between sites be a bug, or a feature?** Bug →
kit. Feature → site.

### Why the kit exists

pruefanfrage.de and konforme-ki.de were the same stack, copy-pasted and then
drifted. The drift shipped a real bug: the cookie banner dispatched an event,
nothing listened, and GA4 + the Meta Pixel loaded unconditionally on a site
selling GDPR compliance. Meanwhile the funnel-CTA listener existed on three of
eleven pages, in two mutually incompatible versions. Everything in this package
is a piece of plumbing that had already broken by being copied.

## 2. Quickstart for a new site

**Fastest path — clone the starter:**

```sh
npx degit JustinGuese/datafortress-astro-kit/examples/starter my-site
cd my-site && npm install
```

You get a working site with the layout wired up, a themed `global.css`, a typed
`site.ts`, a `legal` content collection with its route, and a consent-withdrawal
link already in the footer. Edit `src/config/site.ts` and
`src/styles/global.css`, then delete the placeholder page.

`examples/starter` is also this repo's CI fixture — it is built and asserted on
for every push, so the thing you clone is known to work.

**Or add the kit to an existing Astro site:**

```sh
npm install @datafortress/astro-kit
```

Requires Astro 7 and Node ≥ 22.12. Tailwind 4 is optional — only
`styles/tokens.css` needs it, because it declares tokens via `@theme`.

Commit your `package-lock.json`: the caret range in `package.json` is what
allows a fix to reach you, and the lockfile is what keeps builds reproducible
until you run `npm update`. See §5.

### `src/styles/global.css`

```css
@import "tailwindcss";
@import "@datafortress/astro-kit/styles/tokens.css";   /* role tokens (placeholder values) */
@import "@datafortress/astro-kit/styles/prose.css";    /* .article-body, optional */

/* Your brand. Redefining a role token here overrides the kit default. */
@theme {
  --font-display: "Archivo", ui-sans-serif, sans-serif;
  --color-canvas: #f4f2ea;
  --color-ink: #15181b;
  --color-accent: #9a2c1c;
  --color-line: #d9d4c6;
  /* …see §4 for the full list */
}
```

> **If you use kit class names in your own markup, add
> `@source "../../node_modules/@datafortress/astro-kit";`.**
> Tailwind 4 does not scan `node_modules`. The kit's own components are styled
> with scoped `<style>` blocks precisely so they do not depend on this — but
> anything *you* write referencing them does.

### `src/config/site.ts`

One file holding every value that identifies this site. Nothing below should
ever be typed into a component again.

```ts
import { defineSiteConfig } from '@datafortress/astro-kit/lib/site';

export const site = defineSiteConfig({
  name: 'example.de',
  legalName: 'DataFortress.cloud GmbH',
  url: 'https://example.de',
  locale: 'de_DE',
  description: 'What this site does, one sentence.',
  address: {
    streetAddress: 'Gewerbestraße 13',
    postalCode: '82064',
    addressLocality: 'Straßlach-Dingharting',
    addressCountry: 'DE',
  },
  ga4Id: 'G-XXXXXXXXXX',
  metaPixelId: '000000000000000',
  formspreeId: 'xxxxxxxx',
  privacyHref: '/datenschutz',
});
```

Everything in this object compiles into public HTML — never put a secret in it.
Analytics IDs and Formspree *form* ids are public by design.

### `src/layouts/Site.astro`

```astro
---
import '../styles/global.css';
import SeoHead from '@datafortress/astro-kit/SeoHead.astro';
import Consent from '@datafortress/astro-kit/Consent.astro';
import CookieBanner from '@datafortress/astro-kit/CookieBanner.astro';
import Attribution from '@datafortress/astro-kit/Attribution.astro';
import FunnelTracking from '@datafortress/astro-kit/FunnelTracking.astro';
import StickyCta from '@datafortress/astro-kit/StickyCta.astro';
import { organizationSchema } from '@datafortress/astro-kit/lib/seo';
import { site } from '../config/site';

interface Props { title?: string; description?: string; ogType?: 'website' | 'article' }
const {
  title = `${site.name} — …`,
  description = site.description,
  ogType = 'website',
} = Astro.props;
---
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />

    <SeoHead
      title={title}
      description={description}
      siteName={site.name}
      locale={site.locale}
      ogType={ogType}
      schemas={[organizationSchema({
        name: site.name,
        legalName: site.legalName,
        url: site.url,
        description: site.description,
        address: site.address,
      })]}
    />

    <!-- MUST come before anything that calls gtag. -->
    <Consent ga4Id={site.ga4Id} metaPixelId={site.metaPixelId} />

    <slot name="head" />
  </head>
  <body>
    <main><slot /></main>

    <CookieBanner privacyHref={site.privacyHref} strings={{
      message: 'Wir verwenden Cookies, um unseren Datenverkehr zu analysieren.',
      privacyLinkLabel: 'Datenschutzerklärung',
      acceptLabel: 'Alle akzeptieren',
      declineLabel: 'Alle ablehnen',
      regionLabel: 'Cookie-Einwilligung',
    }} />

    <StickyCta href="/#signup" cta="sticky" strings={{ ctaLabel: 'Jetzt starten' }}
               hideNear={['signup', 'pricing']} />

    <Attribution />
    <FunnelTracking />
  </body>
</html>
```

**Order matters in exactly one place:** `<Consent>` must render before any other
code that touches `gtag`. Everything else can go anywhere.

## 3. Components

### `Consent.astro` — `<head>`, once per page

Installs Consent Mode v2 with all four signals `denied`, then loads GA4 and the
Meta Pixel *only* after acceptance. Also re-applies a stored acceptance on load,
since a returning visitor never sees the banner and would otherwise never
trigger it.

| prop | type | default | |
|---|---|---|---|
| `ga4Id` | `string?` | — | omit to load no analytics |
| `metaPixelId` | `string?` | — | omit to load no pixel |
| `anonymizeIp` | `boolean` | `true` | |

There is intentionally **no `<noscript>` pixel** — it would fire on load with no
way to consult consent. Do not add one back.

### `CookieBanner.astro` — end of `<body>`, once per page

Renders the banner and records the decision. **It does not gate anything itself.**

| prop | type | |
|---|---|---|
| `privacyHref` | `string` | required |
| `strings` | `Partial<CookieBannerStrings>` | English defaults |

**Withdrawal is not optional.** Put this anywhere — footer, privacy policy, even
inside Markdown:

```html
<button type="button" data-consent-reopen>Cookie-Einstellungen ändern</button>
```

Any element with `data-consent-reopen` re-opens the banner. Without one, the
banner is shown **once per browser, ever**, and a visitor who accepted has no
way back — which GDPR Art. 7(3) does not allow. Withdrawing also deletes the
`_ga*` / `_fb*` cookies already on the device: Consent Mode stops future storage
but leaves what is there, which is not what someone clicking "decline" expects.

Focus moves into the banner when it opens and returns to the trigger when it
closes.

> **Contract with `Consent.astro`:** they communicate only via the
> `cookie-consent-updated` window event and the `cookie-consent` localStorage
> key, both defined in `src/lib/consent.ts`. Render the banner without `Consent`
> and you get a banner that visibly works and gates nothing — the original bug.
> **Never hand-write either name; import them.**

### `Attribution.astro` — end of `<body>`, once per page

Stores the **first** touch (UTMs, `fbclid`/`gclid`/`ttclid`/`msclkid`, referrer)
in localStorage and stamps it into every `[data-track-field]` input. First touch
wins deliberately: a later organic visit must not overwrite the paid click that
acquired the lead.

| prop | type | default |
|---|---|---|
| `storageKey` | `string` | `'df_attribution'` |

Not consent-gated: it writes only first-party storage and loads nothing
third-party. If your privacy policy disagrees, gate it on `CONSENT_EVENT`.

### `TrackingFields.astro` — inside each `<form>`

Hidden attribution inputs + a `_gotcha` honeypot. Needs `Attribution` on the
same page or every submission arrives blank.

| prop | type | |
|---|---|---|
| `variant` | `string` | which form/offer this is |

`variant` is a free string on purpose — your offer names are site vocabulary.
Declare the union in your own config and pass it in.

### `FunnelTracking.astro` — end of `<body>`, once per **site**

One delegated listener for every CTA. Mark up buttons anywhere:

```html
<a href="#pricing" data-cta="hero">…</a>
<a href="/kontakt" data-contact-cta="footer">…</a>
```

| prop | type | default |
|---|---|---|
| `ctaEventName` | `string` | `'cta_click'` |
| `contactEventName` | `string` | `'contact'` |

One event name with the label as a **parameter**, never one event name per
label — otherwise "how many CTA clicks total" needs summing an open-ended set of
names, and GA4 caps distinct event names per property.

> Do not also add a per-page listener. That double-counts. This was previously
> duplicated across three pages in two incompatible versions.

### `ConversionTracking.astro` — on pages that receive form redirects

Handles Formspree `_next` returns: reveals the confirmation panel, fires
`generate_lead` + Meta `Lead`, and strips the flag from the URL so a reload does
not re-count.

```astro
<ConversionTracking states={[
  { flag: 'newsletter', revealId: 'newsletter-done', event: 'newsletter_lead', label: 'Newsletter' },
]} />
```

### `StickyCta.astro` — end of `<body>`

Mobile sticky footer CTA that hides whenever a real in-page CTA is on screen.
Carries `data-cta`, so `FunnelTracking` picks it up automatically.

| prop | type | default |
|---|---|---|
| `href` | `string` | required |
| `cta` | `string` | required — analytics label |
| `strings` | `Partial<StickyCtaStrings>` | English defaults |
| `showAfter` | `number` | `400` (px scrolled) |
| `hideNear` | `string[]` | `[]` — element ids that suppress it |

### `lib/`

- **`lib/seo`** — `organizationSchema`, `articleSchema`, `faqSchema`,
  `breadcrumbSchema`. Pass the results to `SeoHead`'s `schemas` prop.
- **`lib/sitemap`** — `sitemapConfig({ priorities, exclude })` for
  `astro.config.mjs`.
- **`lib/collections`** — `legalSchema()`, `articleSchema(categories)` for
  `content.config.ts`. Pass your own category slugs; a typo then fails the build
  instead of silently dropping an article out of the nav.
- **`lib/site`** — `defineSiteConfig()` types the one config file every site
  writes (autocomplete, typo'd keys caught at build, identical shape across
  repos) and `formspreeAction(id)` builds the form URL. Everything in that
  object compiles into public HTML — never put a secret in it.
- **`lib/consent`**, **`lib/attribution`** — the shared attribute/event/key
  names. Import these; never retype the string literals.

## 4. Theming

Kit components reference role tokens only. Redefine them in your `@theme`:

| token | role |
|---|---|
| `--color-canvas` / `-deep` / `--color-surface` | page ground / alternating band / raised card |
| `--color-ink` / `-soft` / `-faint` | text and dark fills, descending emphasis |
| `--color-accent` / `-bright` / `-pale` | **the** action colour — every primary CTA, nothing decorative |
| `--color-signal` | urgency, deadline, fail-closed. Never decoration. Alias to `accent` if you have only one |
| `--color-support` / `-bright` | secondary positive (verified, included) |
| `--color-premium` / `-bright` | highest tier only — it stops meaning "highest" the moment it decorates |
| `--color-line` | hairlines, dividers |
| `--font-display` / `--font-sans` / `--font-mono` | families only; you supply the webfonts |

Names describe **role, not appearance**. `--color-accent`, never
`--color-stamp` or `--color-red`: the same markup then reads correctly whether
the action colour is oxblood or verdigris. Brand-named tokens are what made the
first two sites un-reskinnable without a 600-occurrence find/replace.

The defaults in `tokens.css` are a flat neutral grey **on purpose** — an
unthemed site should look obviously unfinished, not plausibly deliberate.

**Contributor rule: `styles/tokens.css` is the only file in this package where a
colour literal may appear.** A hex anywhere else bakes one site's brand into
every site.

## 5. Releasing a change

### Test it locally first

```sh
npm test          # packs the kit, builds test/fixture against the tarball, asserts
```

`test/fixture` **is** the quickstart in §2, copy-pasted. It is built against the
packed tarball rather than the working tree, so a file missing from `files` in
`package.json` fails here instead of in someone's site. CI runs the same script
on every push.

To try a change against a real site before releasing:

```sh
cd datafortress-astro-kit && npm link       # once
cd ../website-example && npm link @datafortress/astro-kit
```

### Release

```sh
npm version minor                           # or patch / major
git push --follow-tags
```

Pushing the tag triggers `.github/workflows/publish.yml`, which re-runs CI and
then publishes to npm with a provenance attestation. Then bump the range in each
consuming site (`npm update @datafortress/astro-kit`, commit the lockfile).

- **`prepublishOnly` refuses to publish** if the git tag disagrees with
  `package.json`, if a colour literal has leaked out of `styles/tokens.css`, or
  if the `exports` map points at a file that is not actually shipped.
- **While `0.x`, a minor bump may break things.** Removing or renaming an export
  is breaking for every consumer: grep the sibling sites' `src/` and fix the
  call sites in the same release.
- `npm link` is never recorded in `package.json`, so no local path can leak into
  a commit and break CI.

**Publishing uses npm Trusted Publishing (OIDC) — there is no token in this
repo.** The workflow's `id-token: write` permission lets npm exchange a GitHub
identity token for a short-lived, single-publish credential, and attach
provenance automatically. Nothing to rotate.

**First publish is manual, once**, because the trusted-publisher setting lives
on a package page that does not exist yet:

1. Confirm you own the `@datafortress` scope on npm.
2. `npm login && npm publish` locally.
3. On npmjs.com → the package → Settings → Trusted publisher, add: GitHub
   Actions, `JustinGuese/datafortress-astro-kit`, workflow `publish.yml`, no
   environment.

Every tag after that publishes through CI with no secret involved.

> **`npm link` needs one line in the consuming site's `astro.config.mjs`:**
>
> ```js
> vite: { plugins: [tailwindcss()], resolve: { preserveSymlinks: true } }
> ```
>
> Without it the build dies with *"No cached compile metadata found for
> …CookieBanner.astro?astro&type=style"*. Astro keys its compile cache by
> resolved path, and Vite resolves the symlink to the real location, so the
> scoped `<style>` of any linked `.astro` component can never be found. It is
> harmless to leave the line in permanently — it changes nothing for a normal
> tarball/git install.

## 6. Consumers

| site | domain | pinned at |
|---|---|---|
| `website-pflegenachweisde` | pruefanfrage.de | *(migrating — see AGENTS.md)* |
| `website-ai-router-de` | konforme-ki.de | *(not yet migrated)* |

Keep this table current: it is how you see the blast radius of a breaking change
before you make one.
