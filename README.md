# @justinguese/astro-kit

[![CI](https://github.com/JustinGuese/datafortress-astro-kit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JustinGuese/datafortress-astro-kit/actions/workflows/ci.yml)
[![Publish](https://github.com/JustinGuese/datafortress-astro-kit/actions/workflows/publish.yml/badge.svg)](https://github.com/JustinGuese/datafortress-astro-kit/actions/workflows/publish.yml)
[![npm](https://img.shields.io/npm/v/@justinguese/astro-kit)](https://www.npmjs.com/package/@justinguese/astro-kit)
[![license](https://img.shields.io/npm/l/@justinguese/astro-kit)](LICENSE)

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
npm install @justinguese/astro-kit
```

Requires Astro 7 and Node ≥ 22.12. Tailwind 4 is optional — only
`styles/tokens.css` needs it, because it declares tokens via `@theme`.

Commit your `package-lock.json`: the caret range in `package.json` is what
allows a fix to reach you, and the lockfile is what keeps builds reproducible
until you run `npm update`. See §5.

### `src/styles/global.css`

```css
@import "tailwindcss";
@import "@justinguese/astro-kit/styles/tokens.css";   /* role tokens (placeholder values) */
@import "@justinguese/astro-kit/styles/prose.css";    /* .article-body, optional */

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

> **Do not add `@source "…/node_modules/@justinguese/astro-kit"`.** You do not
> need it: every kit component styles itself with a scoped `<style>` block,
> which Tailwind never purges. Adding it makes Tailwind scan the kit's source
> and emit utilities nothing uses — on pruefanfrage.de that took the built CSS
> from 41 kB to 75 kB, an 80% increase for no visual change.

### `src/config/site.ts`

One file holding every value that identifies this site. Nothing below should
ever be typed into a component again.

```ts
import { defineSiteConfig } from '@justinguese/astro-kit/lib/site';

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
import SeoHead from '@justinguese/astro-kit/SeoHead.astro';
import Consent from '@justinguese/astro-kit/Consent.astro';
import CookieBanner from '@justinguese/astro-kit/CookieBanner.astro';
import Attribution from '@justinguese/astro-kit/Attribution.astro';
import FunnelTracking from '@justinguese/astro-kit/FunnelTracking.astro';
import StickyCta from '@justinguese/astro-kit/StickyCta.astro';
import { organizationSchema } from '@justinguese/astro-kit/lib/seo';
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

### `HeroBlock.astro` — the above-the-fold hook

Unified from two diverged heroes. Takes **exactly one `cta`** — there is no
`secondaryCta` prop, because both sites' funnel doc says "one CTA above the
fold, nothing else clickable" and two equal buttons split attention at the
decision point. A genuinely secondary path goes in the `cta-secondary` slot,
which renders subordinate.

| prop | type | |
|---|---|---|
| `cta` | `{ label, href, track }` | required; `track` becomes `data-cta` |
| `eyebrow` | `string?` | small label above the headline |
| `headline` / `sub` | `string?` | or use the slots for rich markup |
| `note` | `string?` | friction remover under the button |
| `bullets` | `string[]` | trust tags |
| `stats` | `{value,label}[]` | proof, rendered next to the CTA |

Slots: `urgency`, `headline`, `sub`, `bullets`, `cta-secondary`, and the
default slot for the aside column. **Divergence goes in slots, never in variant
props** — pruefanfrage puts a file-folder card in the aside, konforme-ki a
hash-chain diagram, and the block needed no flag for either.

### `Field.astro` — one labelled form control

`input`, `select` or `textarea` with label, hint and optional `(optional)` note.
Sites had 24 copies of this markup with two drifting class variants.

| prop | type | |
|---|---|---|
| `name` / `label` | `string` | required; `id` defaults to `name` |
| `type` | `'text'\|'email'\|'tel'\|'url'\|'date'\|'number'\|'select'\|'textarea'` | |
| `options` | `{value,label}[]` | select only; blank prompt prepended |
| `prompt` | `string` | blank option text — override per language |
| `hint` / `note` | `string?` | fine print under / aside in the label |

### `FormBlock.astro` — a Formspree form with its plumbing wired

Put the fields in the default slot; the action, the hidden `form` name, the
`_next` redirect, `TrackingFields` and the submit button are handled for you.
That boilerplate appeared five times on pruefanfrage.de and had already drifted
— one form was missing its honeypot, another its `_next`.

| prop | type | |
|---|---|---|
| `formspreeId` | `string` | required; the part after `/f/` |
| `variant` | `string` | submission `variant` + `data-cta` on the button |
| `name` | `string?` | hidden `form` field; defaults to `variant` |
| `success` | `{ flag, anchor? }?` | builds `?flag=1#anchor` for the return trip |
| `submitLabel` | `string` | required |
| `class` | `string?` | your card styling on the `<form>` |

Slots: default (fields), `submit-icon`, `note`.

**The `success.flag` you set here is the flag `ConversionTracking` listens for** —
set one without the other and the form works while the conversion goes uncounted.

### `FaqBlock.astro` — accordion + FAQPage JSON-LD

| prop | type | |
|---|---|---|
| `items` | `{ q, a }[]` | required |
| `openIndex` | `number` | default `0`; `-1` opens none |
| `schema` | `boolean` | default `true`; off if the page already has FAQPage markup |

Both halves render from the **same array**, which is the point: Google issues
manual actions for FAQ markup whose answers are not visible on the page, and the
reliable way to prevent that is to make writing one without the other
impossible. Native `<details>`, so it is keyboard accessible and works before
hydration.

### `PricingCards.astro` / `PricingMatrix.astro` — the offer ladder

Two layouts over one `Tier` type from `lib/pricing`, **not one component with a
`layout` flag**. pruefanfrage uses the row-wise matrix so a five-rung ladder can
be compared like-for-like; konforme-ki uses column cards. Those are genuinely
different presentations, and a site needing a third writes its own component
against the same `Tier[]` losing nothing.

```ts
const tiers = [
  { id: 'pro', name: 'Pro', price: '€49', priceNote: 'per month',
    highlight: true, badge: 'Most popular',
    cta: { label: 'Choose Pro', href: '#signup' }, features: ['…'] },
] satisfies Tier[];
```

`PricingCards` takes `tiers` and an optional `footnote`.
`PricingMatrix` additionally takes `rows: CompareRow[]`, a **required**
`caption` (a comparison table is meaningless to a screen reader without one) and
an optional `rowHeader`.

`CompareRow.values` is keyed by `Tier.id`, so renaming a tier is a type error
rather than a silently blank column. A missing value renders as an em dash —
which is itself information, and the reason a matrix beats independent cards.
`cta.href` gets `data-cta={tier.id}` automatically.

Exactly one tier should carry `highlight`; highlighting two highlights neither,
and the kit warns in the console if you do.

### `ScarcityBlock.astro` — honest capacity

| prop | type | |
|---|---|---|
| `total` / `taken` | `number` | keep `taken` truthful |
| `layout` | `'badge' \| 'band'` | inline vs its own section |
| `badgeText` | `string` | supports `{left}` `{total}` `{period}` |
| `bandTitle` / `bandBody` | `string?` | band layout only |
| `period` | `string?` | substituted for `{period}` |

Only use this where intake really is capped — an unbacked scarcity claim is
misleading advertising (§5 UWG in DE), and a compliance-minded buyer is exactly
the audience that will ask you to justify the number.

**Deliberately not a countdown timer.** A clock that restarts on reload reads as
a trick and costs more trust than it buys urgency.

### `ArrowRight.astro`

The CTA arrow, so every block and site points the same way.

### `lib/`

- **`lib/seo`** — `organizationSchema`, `articleSchema`, `faqSchema`,
  `breadcrumbSchema`. Pass the results to `SeoHead`'s `schemas` prop.
- **`lib/sitemap`** — `sitemapConfig({ priorities, exclude })` for
  `astro.config.mjs`.
- **`lib/collections`** — `legalSchema()`, `articleSchema(categories)` for
  `content.config.ts`. Pass your own category slugs; a typo then fails the build
  instead of silently dropping an article out of the nav.
- **`lib/pricing`** — the `Tier` and `CompareRow` types shared by both pricing
  layouts, plus `assertSingleHighlight()`.
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
cd ../website-example && npm link @justinguese/astro-kit
```

### Release

```sh
npm version minor                           # or patch / major
git push --follow-tags
```

Pushing the tag triggers `.github/workflows/publish.yml`, which re-runs CI and
then publishes to npm with a provenance attestation. Then bump the range in each
consuming site (`npm update @justinguese/astro-kit`, commit the lockfile).

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

Granular npm tokens expire after 90 days at most and classic tokens no longer
exist, so a token in CI would be a standing rotation chore. An OIDC exchange
expires in minutes and lives only inside the job.

**The bootstrap publish was manual, once** (0.2.0), because the
trusted-publisher setting lives on a package page that has to exist first. It is
done; the remaining one-time step is on npmjs.com → the package → Settings →
**Trusted publisher** → GitHub Actions, `JustinGuese/datafortress-astro-kit`,
workflow `publish.yml`, no environment. Every tag after that publishes through
CI with no secret involved.

Two things that bite when publishing by hand:

- **`publishConfig.provenance` fails locally** with *"Automatic provenance
  generation not supported for provider: null"* — provenance needs a recognised
  CI provider. Pass `npm publish --no-provenance` for a manual publish. 0.2.0 is
  therefore unattested; everything released through CI is attested.
- **A 404 on `PUT` is about the scope, not the package.** npm returns 404 rather
  than 403 for a scope you do not own, so *"could not be found or you do not
  have permission"* on a first publish means the scope is wrong or the org does
  not exist — not that anything is missing locally.

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
| `website-pflegenachweisde` | pruefanfrage.de | `^0.2.0` |
| `website-ai-router-de` | konforme-ki.de | *(not yet migrated)* |

Keep this table current: it is how you see the blast radius of a breaking change
before you make one.
