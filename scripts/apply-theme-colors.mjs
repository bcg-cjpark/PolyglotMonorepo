#!/usr/bin/env node
/**
 * Apply primary/secondary brand colors to the design-system token files.
 *
 * Usage:
 *   node scripts/apply-theme-colors.mjs --primary=#2563eb --secondary=#f97316
 *
 * - --primary  (optional) hex → regenerates `--base-colors-primary-primary*` scale
 *   in `libs/tokens/styles/__tokens-light.css` AND `__tokens-dark.css`.
 * - --secondary (optional) hex → same, for `--base-colors-secondary-secondary*`.
 *   Secondary block is inserted right after the primary block if it does not
 *   yet exist. The `--color-secondary` Tailwind alias lives in
 *   `libs/tailwind-config/globals.css` as a static definition, so the script
 *   does not need to inject it.
 *
 * Tonal scale is generated from the input hex using HSL interpolation. The
 * input hex is anchored at `<name>800` (brand color). Lighter steps
 * (050–700) are interpolated toward high lightness for the light theme and
 * toward the dark-theme background for the dark theme. `900` is a slightly
 * darker hover tone. `-deep` is the highest-contrast variant (darker in
 * light theme, lighter in dark theme).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const LIGHT_PATH = path.join(repoRoot, 'libs/tokens/styles/__tokens-light.css');
const DARK_PATH = path.join(repoRoot, 'libs/tokens/styles/__tokens-dark.css');

const LEVELS = ['050', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'deep'];

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([a-zA-Z0-9-]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function normalizeHex(hex) {
  const m = hex.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) throw new Error(`Invalid hex: ${hex}`);
  let s = m[1];
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return `#${s.toLowerCase()}`;
}

function hexToRgb(hex) {
  const s = normalizeHex(hex).slice(1);
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const to = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hh >= 0 && hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

function toHex(hsl) {
  const { r, g, b } = hslToRgb({
    h: hsl.h,
    s: Math.max(0, Math.min(100, hsl.s)),
    l: Math.max(0, Math.min(100, hsl.l)),
  });
  return rgbToHex(r, g, b);
}

/**
 * Generate a 11-step tonal scale anchored at the input hex = `800`.
 * Light theme: lower numbers go toward white, `-deep` is darker than 800.
 * Dark theme:  lower numbers go toward the dark background color,
 *              `-deep` is brighter than 800 for contrast.
 */
function generateScale(inputHex, theme) {
  const anchor = rgbToHsl(hexToRgb(inputHex));
  const { h, s } = anchor;
  if (theme === 'light') {
    return {
      '050': toHex({ h, s: Math.max(s - 5, 30), l: 96 }),
      '100': toHex({ h, s: Math.max(s - 5, 40), l: 92 }),
      '200': toHex({ h, s, l: 85 }),
      '300': toHex({ h, s, l: 78 }),
      '400': toHex({ h, s, l: 70 }),
      '500': toHex({ h, s, l: 62 }),
      '600': toHex({ h, s, l: 54 }),
      '700': toHex({ h, s, l: Math.max(anchor.l - 5, 30) }),
      '800': normalizeHex(inputHex),
      '900': toHex({ h, s, l: Math.max(anchor.l - 5, 0) }),
      'deep': toHex({ h, s, l: Math.max(anchor.l - 15, 0) }),
    };
  }
  // dark
  const dl = anchor.l;
  return {
    '050': toHex({ h, s: Math.max(s - 40, 10), l: 12 }),
    '100': toHex({ h, s: Math.max(s - 35, 15), l: 14 }),
    '200': toHex({ h, s: Math.max(s - 25, 25), l: 20 }),
    '300': toHex({ h, s: Math.max(s - 15, 35), l: 28 }),
    '400': toHex({ h, s, l: 36 }),
    '500': toHex({ h, s, l: 44 }),
    '600': toHex({ h, s, l: 52 }),
    '700': toHex({ h, s, l: Math.max(dl - 8, 30) }),
    '800': normalizeHex(inputHex),
    '900': toHex({ h, s, l: Math.max(dl - 5, 0) }),
    'deep': toHex({ h, s, l: Math.min(dl + 15, 92) }),
  };
}

function tokenName(family, lvl) {
  // `deep` is separated by a hyphen in the existing token names.
  const suffix = lvl === 'deep' ? '-deep' : lvl;
  return `--base-colors-${family}-${family}${suffix}`;
}

function replaceBlock(content, family, scale) {
  let next = content;
  for (const lvl of LEVELS) {
    const re = new RegExp(
      `(${tokenName(family, lvl)}\\s*:\\s*)#[0-9a-fA-F]{3,8}`,
      'g'
    );
    if (re.test(next)) {
      next = next.replace(re, `$1${scale[lvl]}`);
    }
  }
  return next;
}

function buildSecondaryBlock(scale) {
  const order = ['800', '700', '600', '500', '400', '300', '200', '100', '050', 'deep', '900'];
  return order.map((lvl) => `  ${tokenName('secondary', lvl)}: ${scale[lvl]};`).join('\n');
}

function insertSecondaryAfterPrimary(content, block) {
  if (/--base-colors-secondary-secondary800\b/.test(content)) {
    return content;
  }
  const re = /(--base-colors-primary-primary900\s*:\s*#[0-9a-fA-F]{3,8};\s*)(\n)/;
  if (!re.test(content)) {
    throw new Error('Could not find primary900 marker to insert secondary block.');
  }
  return content.replace(re, `$1\n${block}\n$2`);
}

/**
 * Declarative spec of all semantic token overrides applied on every primary
 * palette change. Maps theme → { tokenName → value }.
 *
 * Each entry is handled by `replaceOrInsertToken()`:
 *   - If the token already exists in the theme block, its value is replaced.
 *   - Otherwise, the token is inserted right before the closing `}` of the
 *     `:root[data-theme="<theme>"]` block.
 *
 * This makes the spec idempotent: re-running the script on already-overridden
 * files is a no-op, and adding new semantic tokens here is the only edit
 * point (no need to touch `__tokens-*.css` manually).
 */
const SEMANTIC_OVERRIDES = {
  light: {
    // Primary-fill button text: always white (see contrast rationale below).
    '--button-primary-text': '#ffffff',
    // Light hover surface derived from current palette primary050.
    '--button-light-solid-background-hover': 'var(--base-colors-primary-primary050)',
    // Alert icon colors (design-notes/global-palette.md → Alert Semantic Tokens).
    '--alert-success-icon-color': 'var(--base-colors-green-green800)',
    '--alert-info-icon-color': 'var(--base-colors-blue-blue800-deep)',
    '--alert-warning-icon-color': 'var(--base-colors-secondary-secondary-deep)',
    '--alert-error-icon-color': 'var(--base-colors-red-red900)',
  },
  dark: {
    '--button-primary-text': '#ffffff',
    // Dark theme already has a var() reference for light-solid-hover; leave it.
    '--alert-success-icon-color': 'var(--base-colors-green-green700)',
    '--alert-info-icon-color': 'var(--base-colors-blue-blue800-deep)',
    '--alert-warning-icon-color': 'var(--base-colors-secondary-secondary-deep)',
    '--alert-error-icon-color': 'var(--base-colors-red-red900)',
  },
};

/**
 * Replace `<tokenName>: <anything>;` in the theme block, or insert the token
 * just before the theme block's closing `}` if it does not exist yet.
 *
 * `theme` is used only to locate the correct `:root[data-theme="..."]` block
 * when inserting — replace is global (theme file has a single :root block).
 */
function replaceOrInsertToken(content, tokenName, value, theme) {
  const escaped = tokenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const replaceRe = new RegExp(`(${escaped}:\\s*)[^;]+(;)`);
  if (replaceRe.test(content)) {
    return content.replace(replaceRe, `$1${value}$2`);
  }
  // Insert before the closing `}` of the `:root[data-theme="<theme>"]` block.
  const blockRe = new RegExp(
    `(:root\\[data-theme="${theme}"\\][^{]*\\{[\\s\\S]*?)(\\n\\})`
  );
  if (!blockRe.test(content)) {
    throw new Error(
      `Could not locate :root[data-theme="${theme}"] block to insert ${tokenName}.`
    );
  }
  return content.replace(blockRe, `$1\n  ${tokenName}: ${value};$2`);
}

/**
 * Apply policy-level semantic token overrides that depend on the *palette
 * being a brand color* rather than on any specific hex.
 *
 * Why this exists:
 *   The base tonal scale (050..900) is palette-neutral, but some semantic
 *   tokens encode contrast *policy* that was implicitly tuned for the legacy
 *   bright yellow primary (#ffc300, L~0.79). Swapping to a dark primary
 *   (e.g. indigo #4f46e5, L~0.12) breaks the tacit assumption that a
 *   "neutral800" label on top of primary800 will remain legible.
 *
 *   We therefore hard-bind policy semantics (button text color, hover
 *   surfaces, alert icon anchors) every time the primary/secondary changes,
 *   so the palette swap cannot regress WCAG AA contrast.
 *
 *   See `SEMANTIC_OVERRIDES` above for the declarative spec. New semantic
 *   tokens should be added there — `replaceOrInsertToken()` handles both
 *   existing (replace) and new (insert) entries idempotently.
 */
function applySemanticOverrides(lightContent, darkContent) {
  for (const [name, value] of Object.entries(SEMANTIC_OVERRIDES.light)) {
    lightContent = replaceOrInsertToken(lightContent, name, value, 'light');
  }
  for (const [name, value] of Object.entries(SEMANTIC_OVERRIDES.dark)) {
    darkContent = replaceOrInsertToken(darkContent, name, value, 'dark');
  }
  return { lightContent, darkContent };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.primary && !args.secondary) {
    console.error('Usage: node scripts/apply-theme-colors.mjs --primary=#hex [--secondary=#hex]');
    process.exit(1);
  }

  const changes = [];
  let lightContent = fs.readFileSync(LIGHT_PATH, 'utf8');
  let darkContent = fs.readFileSync(DARK_PATH, 'utf8');

  if (args.primary) {
    const hex = normalizeHex(args.primary);
    const lightScale = generateScale(hex, 'light');
    const darkScale = generateScale(hex, 'dark');
    lightContent = replaceBlock(lightContent, 'primary', lightScale);
    darkContent = replaceBlock(darkContent, 'primary', darkScale);
    // Re-bind contrast-sensitive semantic tokens to match the new palette.
    ({ lightContent, darkContent } = applySemanticOverrides(lightContent, darkContent));
    changes.push(`primary  → ${hex}`);
    const semanticNames = new Set([
      ...Object.keys(SEMANTIC_OVERRIDES.light),
      ...Object.keys(SEMANTIC_OVERRIDES.dark),
    ]);
    changes.push(`semantic → ${semanticNames.size} tokens (${[...semanticNames].join(', ')})`);
  }

  if (args.secondary) {
    const hex = normalizeHex(args.secondary);
    const lightScale = generateScale(hex, 'light');
    const darkScale = generateScale(hex, 'dark');
    if (/--base-colors-secondary-secondary800\b/.test(lightContent)) {
      lightContent = replaceBlock(lightContent, 'secondary', lightScale);
      darkContent = replaceBlock(darkContent, 'secondary', darkScale);
    } else {
      lightContent = insertSecondaryAfterPrimary(lightContent, buildSecondaryBlock(lightScale));
      darkContent = insertSecondaryAfterPrimary(darkContent, buildSecondaryBlock(darkScale));
    }
    changes.push(`secondary → ${hex}`);
  }

  fs.writeFileSync(LIGHT_PATH, lightContent);
  fs.writeFileSync(DARK_PATH, darkContent);

  console.log('Theme colors applied:');
  for (const c of changes) console.log('  ' + c);
  console.log('Files updated:');
  console.log('  ' + path.relative(repoRoot, LIGHT_PATH));
  console.log('  ' + path.relative(repoRoot, DARK_PATH));
}

main();
