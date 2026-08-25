#!/usr/bin/env node
/**
 * Packs the kit, installs that tarball into examples/starter, builds it, and
 * asserts on the emitted HTML/CSS.
 *
 * It installs the PACKED TARBALL rather than linking the working tree, so the
 * thing under test is exactly what a consumer would download — a file missing
 * from `files` in package.json fails here instead of in someone's site.
 *
 * The fixture itself is the README quickstart, copy-pasted. That is deliberate:
 * a README nobody executes drifts from reality, and this package exists
 * precisely for the case where the details are no longer in anyone's head.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(root, 'examples', 'starter');

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });

const failures = [];
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(label);
  }
}

const staging = mkdtempSync(join(tmpdir(), 'astro-kit-'));
try {
  console.log('› packing kit');
  const tarball = run('npm', ['pack', '--pack-destination', staging], root).trim().split('\n').pop();

  console.log('› installing fixture deps');
  run('npm', ['install', '--no-audit', '--no-fund'], fixture);
  // --no-save: otherwise npm writes the temp tarball path into the fixture's
  // package.json and leaves the repo dirty (and unbuildable on the next run).
  run('npm', ['install', '--no-audit', '--no-fund', '--no-save', join(staging, tarball)], fixture);

  console.log('› building fixture');
  run('npm', ['run', 'build'], fixture);

  const dist = join(fixture, 'dist');
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const cssDir = join(dist, '_astro');
  const css = readdirSync(cssDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(cssDir, f), 'utf8'))
    .join('\n');

  console.log('\nconsent gating');
  check(
    'no eager tracker <script src> in the HTML',
    !/<script[^>]*src="https:\/\/(www\.googletagmanager|connect\.facebook)/.test(html),
  );
  check(
    'no <noscript> Meta pixel (it cannot be consent-gated)',
    !/facebook\.com\/tr\?id=/.test(html),
  );
  check("consent defaults are installed", html.includes("consent', 'default'"));
  check(
    'all four consent signals start denied',
    ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'].every((sig) =>
      new RegExp(`${sig}:\\s*'denied'`).test(html),
    ),
  );
  check(
    'banner and loader agree on the event name',
    (html.match(/cookie-consent-updated/g) || []).length >= 2,
  );
  check(
    'a withdrawal trigger exists (GDPR Art. 7(3))',
    html.includes('data-consent-reopen'),
    'consent must be as easy to withdraw as to give',
  );
  check(
    'withdrawal clears already-set tracker cookies',
    html.includes('clearTrackerCookies'),
  );

  console.log('\nscoped styles survive the package boundary');
  // If these are missing, a consumer gets invisible components and no error.
  for (const cls of ['.df-banner', '.df-sticky', '.article-body']) {
    check(`${cls} is emitted into the built CSS`, css.includes(cls));
  }
  check(
    "site @theme overrides the kit's placeholder tokens",
    css.includes('--color-accent:#9a2c1c') || css.includes('--color-accent: #9a2c1c'),
    'the fixture sets its own accent; seeing the grey placeholder means overrides do not apply',
  );

  console.log('\nseo');
  check('canonical is absolute and query-free', html.includes('<link rel="canonical" href="https://example.de/">'));
  check('Organization JSON-LD is present', html.includes('"@type":"Organization"'));
  check('og:image resolves against the site origin', html.includes('property="og:image" content="https://example.de/'));

  console.log('\nattribution + tracking');
  for (const field of ['utm_source', 'utm_campaign', 'ad_click_id', 'first_seen']) {
    check(`hidden input for ${field}`, html.includes(`data-track-field="${field}"`));
  }
  check('honeypot present', html.includes('name="_gotcha"'));
  check('delegated CTA listener present', html.includes("closest?.('[data-cta]')"));

  console.log('\nsitemap');
  const sitemap = readFileSync(join(dist, 'sitemap-0.xml'), 'utf8');
  check('homepage priority is 1.0', sitemap.includes('<priority>1.0</priority>'));
} finally {
  rmSync(staging, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\nall checks passed');
