#!/usr/bin/env node
/**
 * `prepublishOnly` guard.
 *
 * Refuses to publish when the git tag and package.json disagree, or when a
 * colour literal has leaked out of styles/tokens.css. Both are mistakes that
 * are cheap to make and expensive to undo — npm unpublish is restricted to a
 * 72-hour window, and a hex in a component silently brands every consuming
 * site.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const problems = [];

// 1. The tag being published must match the version, when publishing from a tag.
const tagRef = process.env.GITHUB_REF ?? '';
if (tagRef.startsWith('refs/tags/')) {
  const tag = tagRef.slice('refs/tags/'.length).replace(/^v/, '');
  if (tag !== pkg.version) {
    problems.push(`git tag v${tag} does not match package.json version ${pkg.version}`);
  }
}

// 2. No colour literals outside styles/tokens.css — see AGENTS.md.
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const ALLOWED = new Set([join(root, 'styles', 'tokens.css')]);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!['.astro', '.css', '.ts'].includes(extname(full))) continue;
    if (ALLOWED.has(full)) continue;
    const text = readFileSync(full, 'utf8');
    text.split('\n').forEach((line, i) => {
      // `color-mix(... black)` and CSS keywords are fine; literals are not.
      if (COLOUR.test(line)) {
        problems.push(`colour literal at ${full.slice(root.length + 1)}:${i + 1} — ${line.trim()}`);
      }
    });
  }
}
walk(join(root, 'src'));
walk(join(root, 'styles'));

// 3. Every file the exports map points at must actually ship.
try {
  const packed = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }));
  const shipped = new Set(packed[0].files.map((f) => f.path));
  for (const target of Object.values(pkg.exports ?? {})) {
    const path = typeof target === 'string' ? target : target?.default;
    if (!path || path.includes('*')) continue;
    const rel = path.replace(/^\.\//, '');
    if (!shipped.has(rel)) problems.push(`exports points at ${rel}, which is not in the published files`);
  }
} catch {
  console.warn('  ! could not run `npm pack --dry-run`; skipping the exports/files cross-check');
}

if (problems.length) {
  console.error(`\nRefusing to publish:\n  - ${problems.join('\n  - ')}\n`);
  process.exit(1);
}
console.log('publish checks passed');
