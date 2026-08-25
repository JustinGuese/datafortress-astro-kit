# AGENTS.md — `@justinguese/astro-kit`

Instructions for LLM agents working in this repo. Read this before editing
anything here. `README.md` is for *consumers*; this file is for *contributors*.

## What this is

A shared Astro package holding the **invisible correctness layer** of
DataFortress marketing sites: consent-gated analytics, first-touch attribution,
SEO head, funnel/conversion tracking, prose CSS, role tokens.

It is published to npm as `@justinguese/astro-kit` and consumed by sibling repos
in `~/code/websites/` via a caret range plus a committed lockfile. There is no
build step — `.astro` and `.ts` ship as source and the consumer's Astro compiles
them.

Note that a caret range on a `0.x` version locks the MINOR: `^0.2.0` will not
accept `0.3.0`. Every minor release needs each site's range bumped by hand.

## Prime directive: the scope boundary

Before adding anything, answer: **would a difference between two sites be a bug,
or a feature?**

- **Bug → belongs here.** Consent gating, canonical URLs, attribution, event
  names, JSON-LD shape.
- **Feature → belongs in the site.** Page funnels, palettes, copy, and any
  section whose *layout* is that site's identity.

Section blocks sit across this line and have their own rule — see below. The
short version: the kit owns a section's data shape, schema and tracking; the
site owns its copy and anything visually load-bearing.

### Blocks: the refined rule

An earlier version of this file said *never* add a section component. That was
too absolute — it would have blocked the whole point of the kit, which is that a
new site should be mostly text. The rule that actually holds:

> Share the section's **data shape, schema.org wiring and tracking**. Let visual
> divergence happen through **named slots** or by **opting out entirely** —
> never through boolean variant props.

The evidence: eight section roles recur across the two sites (hero, pricing,
scarcity bar, article upsell, proof strip, comparison table, forms, guides
index+article), but the two `Hero` implementations had *incompatible* props —
one took `title/subtitle/bullets/stats`, the other `marginalie/primaryCta/
secondaryCta` with its copy hardcoded inside. **What recurs is the role and the
data, not the markup.** That is what belongs here.

**Slots, never flags.** A slot is unbounded and costs nothing; a boolean
multiplies with every site that adopts the block. `HeroBlock` takes an aside
slot — pruefanfrage puts a file-folder card there, konforme-ki a hash-chain
diagram — and neither needed a prop. A site that needs something genuinely
different writes its own component and does not touch the block.

**Encode conversion decisions in the API.** `HeroBlock` has exactly one `cta`
and no `secondaryCta` prop, because both sites' funnel doc says "one CTA above
the fold, nothing else clickable" and one of the two heroes was violating it.
A rule expressed as a type survives; a rule expressed as a comment does not.

Still true: do not add a block whose *layout* is one site's identity. The
file-folder card, the stamped label device, the hash-chain — those stay in their
sites.

### Invariants inside the blocks

Each of these encodes a decision. Removing one silently undoes it, and the
starter asserts most of them so the build catches you.

- **`HeroBlock` has no `secondaryCta`, and must not gain one.** Two equally
  weighted buttons split attention at the decision point, against both sites'
  funnel doc. A subordinate path goes in the `cta-secondary` slot. The starter
  asserts exactly one `.df-hero__btn` renders.
- **`FaqBlock` renders the accordion and the FAQPage JSON-LD from the same
  array.** Never add a way to pass schema separately from visible content:
  markup whose answers are not on the page is a manual-action risk, and the
  single-array design is what makes that unwritable. The starter asserts each
  answer appears at least twice in the HTML (DOM + JSON-LD).
- **Two pricing layouts, never one with a `layout` prop.** `PricingCards` and
  `PricingMatrix` share `lib/pricing`'s `Tier`. If a third presentation is
  needed, add a third component or write it site-side — do not grow a flag.
- **`CompareRow.values` is keyed by `Tier.id`, not positional.** The old
  positional array silently blanked a column when a tier was renamed or
  reordered. Keep it a `Record`.
- **A missing matrix value renders as an em dash, never blank.** "Not included"
  is information; an empty cell reads as an oversight.
- **`PricingMatrix.caption` is required.** A comparison table is meaningless to
  a screen reader without one, and an optional prop would go unset.
- **`ScarcityBlock` is not a countdown and must not become one.** A timer that
  restarts on reload reads as a trick. Its `layout` enum is the only justified
  presentation switch in the kit: both sites independently arrived at the same
  two densities of the same content, which is evidence it is real rather than
  speculative. Do not treat it as licence for more.
- **`FormBlock.success.flag` must match the flag `ConversionTracking` listens
  for.** Another paired contract that fails silently: the form submits, the
  visitor returns, and the conversion goes uncounted.

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
   anywhere. Scoped styles cannot be purged — and because of that, **consumers
   must NOT add an `@source` for this package.** Doing so makes Tailwind scan
   the kit and emit utilities nothing uses: on pruefanfrage.de it took the built
   CSS from 41 kB to 75 kB with no visual change. If you ever add a component
   that relies on the consumer's Tailwind, you break this guarantee — don't.
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
| `FormBlock.astro` (`success.flag`) | `ConversionTracking.astro` | the `?<flag>=1` query parameter |

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
- **A consent banner with no withdrawal path is non-compliant** (GDPR Art.
  7(3)), and the first version of this package shipped exactly that: the banner
  rendered only when localStorage was empty, so an accept was permanent. Hence
  `data-consent-reopen`. Every consuming site must place one; the starter has it
  in the footer.
- **Consent Mode does not delete existing cookies.** Withdrawal has to clear
  `_ga*` / `_fb*` explicitly, and deleting a cookie means re-setting it with a
  past expiry on the right path *and* domain — which we cannot know, so
  `clearTrackerCookies()` tries the host and every parent domain.
- **Unquoted YAML dates are `Date`, not `string`.** `updated: 2026-08-25` parses
  as an object and a plain `z.string()` rejects it with an unhelpful message.
  `lib/collections.ts` accepts both spellings and normalises. Do the same for
  any new date field.
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

## Migrating an existing site onto the kit

Written after migrating pruefanfrage.de (20 files, 266 token renames). Every
item below is something that actually went wrong or actually saved the job.
`website-ai-router-de` is next and hits all of it.

### The one technique that makes this safe

**Snapshot `dist/` before touching anything, then diff VISIBLE TEXT, not HTML.**
Attribute and class churn is the whole point of the migration, so an HTML diff
is unreadable noise. Strip scripts, styles, comments and tags, then compare
word-by-word:

```sh
strip() { python3 -c "
import re,sys; s=open(sys.argv[1],encoding='utf8').read()
s=re.sub(r'<script.*?</script>','',s,flags=re.S); s=re.sub(r'<style.*?</style>','',s,flags=re.S)
s=re.sub(r'<!--.*?-->','',s,flags=re.S); s=re.sub(r'<[^>]*>',' ',s)
print(' '.join(s.split()))" "$1"; }
for f in $(cd dist && find . -name '*.html'); do
  diff <(strip "$BASE/$f" | tr ' ' '\n') <(strip "dist/$f" | tr ' ' '\n')
done
```

The target is **only your intended changes appear**, on every page. On
pruefanfrage.de the final diff was exactly two strings across 16 pages. Anything
else in that output is a regression you just caught for free.

Follow it with a CSS *declaration-set* diff (`tr '}' '\n'`, extract
`prop:value`, `sort -u`): renamed tokens must keep identical values, so the only
new entries should be the kit's `.df-banner` / `.df-sticky` rules.

### Order of operations

1. **Fix consent/tracking in place first, as its own commit.** Never entangle a
   compliance fix with a refactor — you want to be able to ship or revert it
   alone.
2. `site.ts` → token rename → `global.css` split → `Site.astro` → contracts →
   component renames.
3. Verify after **each** stage, not at the end. A visible-text diff that was
   clean an hour ago tells you exactly which stage broke something.

### Renaming tokens: script it

Do not hand-edit and do not hand this to a model — it is a pure substitution and
a regex is both faster and verifiable. Two rules:

- **Longest token first.** `paper-deep` must be replaced before `paper`, or you
  get `canvas-deep` → `canvasdeep` style corruption.
- **Anchor to Tailwind utility prefixes and `var(--color-X)`**, never bare
  words: `\b(bg|text|border|from|to|via|ring|outline|decoration|fill|stroke|shadow|divide|accent|caret|placeholder)-(TOKEN)\b`.
  A bare `\bfile\b` would rewrite German prose.

**The regex will not catch three things** — grep for each separately:

- **Site-level class systems named after old tokens** (`.tag-stamp`,
  `.tag-gold`). They are not utilities, so the prefix pattern misses them.
- **Discriminator values** in TS (`accent: 'stamp' as const`) and the prop
  unions that consume them (`accent?: 'stamp' | 'file'`).
- **Dynamically built class names** (`` `tag-${kategorie.accent}` ``) — grep for
  the *prefix*, never the whole class, or you will not find them at all.

### Traps that cost real time

- **`'${site.url}'` in single quotes renders the placeholder literally.** A
  find/replace of a hardcoded domain lands inside ordinary quoted strings (JSON-LD
  objects especially) where it is *not* a template literal. Swap the outer quotes
  to backticks. Detect with a regex for a quoted string containing `${`.
  Be careful writing that grep in a shell — a naive attempt returns zero hits
  because of shell quoting, and zero hits looks like success.
- **A scripted replace does not add imports.** Files referencing `site.` without
  `import { site }` fail at *prerender* with `ReferenceError: site is not
  defined` — not at build time, so the error arrives late and points at a chunk
  file. Sweep for `\bsite\.\w` and inject the import with the right `../` depth.
- **Import paths come in several forms.** `./X.astro`, `../components/X.astro`,
  `../../components/X.astro`. Handling one form and missing the others is the
  most common cause of `UNRESOLVED_IMPORT` mid-migration. Match on the basename.
- **Do scripted edits BEFORE hand edits.** A script keyed on
  `const formspreeId = …` silently skips the one file where you already deleted
  that line by hand. Re-grep for the target after every scripted pass.
- **Delete the site's local copies** of `CookieBanner.astro` and
  `TrackingFields.astro` in the same commit that adds the kit's. Two banners
  render two banners; two attribution field sets submit the last one.
- **`astro check` catches what the build ships.** Renaming a prop union
  (`'stamp' | 'file'` → `'accent' | 'support'`) leaves callers passing the old
  value; the build succeeds and ships a wrongly-coloured button. Run it before
  declaring done — it found exactly that on pruefanfrage.de.
- **Astro escapes prop strings, so HTML entities double-escape.** Copy moved out
  of markup and into a prop keeps its `&quot;` / `&amp;` — which then renders
  as the literal characters `&quot;` on the page. Use the real character
  (`„ … “`) in props. Markup that read `Prüfung &amp; Kontrolle` becomes the
  plain string `Prüfung & Kontrolle`.
- **Decode entities before diffing visible text**, or the diff lights up with
  false positives: raw `&` in the old markup versus a correct `&amp;` in the new
  output are the same character to a reader. `html.unescape()` in the `strip()`
  helper above.

### Contract renames to apply site-wide

| site's old form | kit's form |
|---|---|
| `data-tier-cta="x"` | `data-cta="x"` |
| `<TrackingFields tier={…} />` | `<TrackingFields variant={…} />` |
| per-page CTA listeners | delete — `FunnelTracking` renders once in the layout |
| per-page Formspree success blocks | `ConversionTracking states={[…]}` |
| inline Organization JSON-LD | `organizationSchema()` via `SeoHead schemas={[…]}` |
| `.article-body` CSS in `global.css` | delete — import the kit's `prose.css` |

Keep `ctaEventName` set to whatever the site's GA4 property already records
(pruefanfrage.de passes `tier_cta_click`) so historical reporting survives.

### Splitting `global.css`

Three destinations. The site keeps only the middle one:

- **Kit**: `@theme` role tokens, `.article-body` prose → `@import` them.
- **Site**: the brand's own device classes (pruefanfrage's `.tag*`,
  `.mark-redact`, `stamp-in` keyframes). These are identity, not plumbing.
- **Site `@theme`**: the palette — role names from the kit, values from the
  brand. This is the only file with hexes.

Do **not** add `@source` for this package (see Hard rules #5).

### Moving a section onto a shared block

Written after unifying the two sites' heroes. The plumbing migration above is
mechanical; this part is design work and needs a decision per section.

1. **Diff the two sites' versions of the section first.** They will not be
   interchangeable — pruefanfrage's hero took `title/subtitle/bullets/stats`,
   konforme-ki's took `marginalie/primaryCta/secondaryCta` with its copy
   hardcoded inside. What recurs is the role and the data, never the markup.
2. **Pick the better-converting structure and say why in the file.** Do not
   average the two. For the hero, both sites' own funnel doc said "one CTA above
   the fold, nothing else clickable" and one of them shipped two competing
   buttons — so that structure lost, and `HeroBlock` has no `secondaryCta` prop
   at all. **Encode the decision in the API**; a rule expressed as a missing
   prop survives, a rule expressed as a comment does not.
3. **Sort the markup into three piles** before writing the block:
   - *structure* → the block (grid, headline, CTA, note, bullets, stats)
   - *identity* → stays in the site, passed through a slot (the file-folder
     card, the rotated stamp, the hash-chain diagram)
   - *content* → props, or a slot when the copy needs markup inside it
4. **Offer both a prop and a slot for text.** `headline` as a prop covers the
   common case; the `headline` slot lets a site put a `<strong>`, a link or a
   redaction mark inside it. Slot wins when both are given.
5. **Expect the visible-text diff to show content MOVING, not disappearing.**
   Unifying pruefanfrage's hero moved the three stats out of the aside card and
   under the CTA — the same words appear as one `<` and one `>` per word. Read
   the diff for words that vanish with no matching `>`; that is a real loss. One
   did: a decorative "Frist" stamp, recovered through the `headline` slot.

### While the kit is npm-linked

The consuming site needs `vite: { resolve: { preserveSymlinks: true } }` in
`astro.config.mjs` or its build dies on the kit's scoped styles. Harmless to
leave in permanently.

**`npm link` also hides a dependency that cannot be satisfied — this is the
dangerous one.** A linked site resolves imports against your working tree, so it
builds green while importing components that exist nowhere on the registry.
pruefanfrage.de imported `HeroBlock.astro`, `Field.astro` and `ArrowRight.astro`
against a declared `^0.2.0` whose published tarball contained none of them; the
first CI `npm install` would have died with `UNRESOLVED_IMPORT`.

**A linked build is not evidence that CI will work.** Before declaring a
migration done, prove it unlinked:

```sh
npm unlink --no-save @justinguese/astro-kit   # or: rm -rf node_modules
npm install && npm run build
```

If that needs a kit version that is not published yet, say so explicitly rather
than reporting the migration as finished — the site cannot deploy until it is.

## Releasing

`npm version <patch|minor|major>` then `git push --follow-tags`. The tag
triggers `.github/workflows/publish.yml`, which re-runs CI (via `workflow_call`,
so the two cannot drift) and publishes to npm with provenance.

**Always `npm version`; never `git tag` by hand.** `v0.2.1` was tagged manually,
so `package.json` at that commit still read `0.2.0`. `prepublishOnly` refused the
release and nothing reached npm — correct behaviour, but it looks like a
successful tag-and-push until you check `npm view <pkg> version`. `npm version`
moves the manifest, the commit and the tag together, which is the whole point.

**Recovering from a failed release: bump past it, do not retag.** The stale tag
is inert once the publish is refused, and deleting a tag from a shared remote is
a destructive operation that needs asking for. `v0.2.1` was left in place and
`0.2.2` released instead. Record the miss in `CHANGELOG.md` so the version gap
is not a mystery later.

**Confirm the release actually landed.** `npm view @justinguese/astro-kit version`
and, when a release adds components, check the published tarball really has
them: `npm pack @justinguese/astro-kit@<v>` then `tar -tzf`. A green workflow is
not the same as a published file.

**There is no npm token in this repo and there must never be one.** Publishing
goes through npm Trusted Publishing: the workflow's `id-token: write` permission
lets npm swap a GitHub OIDC token for a short-lived, single-publish credential.
Granular tokens cap out at 90 days, so a secret here would be a recurring
rotation chore and a standing credential to leak. If a publish fails on auth,
fix the trusted-publisher config on the package page — do not "temporarily" add
`NODE_AUTH_TOKEN`. Two consequences worth knowing: the job needs npm >= 11.5.1
(the Node 22 runner image ships npm 10, hence the explicit upgrade step), and
`NODE_AUTH_TOKEN` must stay unset, because a token present in the environment is
used in preference to the OIDC exchange.

Publishing by hand (only ever needed to bootstrap a new package name) requires
`npm publish --no-provenance`: `publishConfig.provenance` is `true`, and outside
a recognised CI provider npm refuses with *"not supported for provider: null"*.

`scripts/check-publish.mjs` runs as `prepublishOnly` and **refuses to publish**
when the git tag disagrees with `package.json`, when a colour literal has leaked
out of `styles/tokens.css`, or when the `exports` map points at a file that is
not in the published `files`. If it fails, fix the cause — never bypass it with
`--ignore-scripts`.

While `0.x`, a minor bump may break things; say so in `CHANGELOG.md`.

## Testing

`npm test` runs `scripts/verify-starter.mjs`: packs the kit, installs **that
tarball** into `examples/starter`, builds it, and asserts on the emitted HTML
and CSS. Testing the tarball rather than the working tree is the point — a file
missing from `files` fails here rather than in a consuming site.

**`examples/starter` does three jobs at once**: it is the README quickstart, the
CI fixture, and the `degit` target new sites are cloned from. That is deliberate
— one artifact cannot drift from itself. **A change to any of the three is a
change to all three, in the same commit.**

Add an assertion to `verify-starter.mjs` for every invariant you would otherwise
have to remember. Note its limits: it proves the *markup* is right, not that the
*runtime behaviour* is. Consent changes still need the browser check above —
static output cannot tell you whether a listener actually fires.

The starter has already earned its keep twice: it caught `npm link` breaking
scoped styles, and it caught `legalSchema` rejecting an unquoted YAML date.
