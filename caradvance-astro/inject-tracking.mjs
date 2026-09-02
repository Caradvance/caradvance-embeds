#!/usr/bin/env node
/**
 * CarAdvance — mérőkód beillesztése a kész buildbe.
 *
 * Használat:   node inject-tracking.mjs dist [további könyvtárak...]
 *
 * Minden .html fájl <head> szakaszának a végére beteszi a konfigurációt és a két
 * szkriptet. Idempotens: a már megjelölt fájlokat kihagyja, tehát újrafuttatható.
 * Ha a ca-config.json hiányzik vagy hibás, a build NEM áll meg — figyelmeztet és
 * kihagyja a beillesztést, hogy egy elgépelés soha ne vigye le az oldalt.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const START = '<!-- ca-tracking:start -->';
const END = '<!-- ca-tracking:end -->';
const CONFIG_FILE = process.env.CA_CONFIG || 'ca-config.json';

const dirs = process.argv.slice(2).filter(Boolean);
if (!dirs.length) dirs.push('dist');

let config;
try {
  if (!existsSync(CONFIG_FILE)) throw new Error(CONFIG_FILE + ' nem található');
  config = JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
} catch (e) {
  console.warn('[ca] FIGYELEM: a mérőkód beillesztése kimarad — ' + e.message);
  process.exit(0);
}

const missing = ['GA4_ID', 'ADS_ID', 'META_PIXEL_ID']
  .filter((k) => !config[k] || String(config[k]).includes('X'));
if (missing.length) {
  console.warn('[ca] FIGYELEM: még kitöltetlen azonosító: ' + missing.join(', ') +
    ' — a kód bekerül, de ezek a rendszerek nem mérnek, amíg ki nem töltöd.');
}

const block = [
  START,
  '<script>window.CA_CFG=' + JSON.stringify(config) + ';</script>',
  '<script src="/ca-consent.js" defer></script>',
  '<script src="/ca-track.js" defer></script>',
  END
].join('\n');

async function* walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { yield* walk(p); continue; }
    if (e.isFile() && /\.html?$/i.test(e.name)) yield p;
  }
}

let touched = 0, skipped = 0, noHead = 0;

for (const dir of dirs) {
  if (!existsSync(dir)) { console.warn('[ca] nincs ilyen könyvtár: ' + dir); continue; }
  const s = await stat(dir);
  if (!s.isDirectory()) { console.warn('[ca] nem könyvtár: ' + dir); continue; }

  for await (const file of walk(dir)) {
    const html = await readFile(file, 'utf8');

    if (html.includes(START)) { skipped++; continue; }
    const idx = html.toLowerCase().lastIndexOf('</head>');
    if (idx === -1) { noHead++; continue; }

    const out = html.slice(0, idx) + block + '\n' + html.slice(idx);
    await writeFile(file, out, 'utf8');
    touched++;
  }
}

console.log(`[ca] mérőkód beillesztve: ${touched} oldal` +
  (skipped ? `, kihagyva (már benne volt): ${skipped}` : '') +
  (noHead ? `, </head> nélkül: ${noHead}` : ''));
