#!/usr/bin/env node
/**
 * seo-langsoon.mjs  —  v1  (2026-09-22)
 *
 * NYELVVÁLTÓ: csak a MAGYAR aktív, a többi nyelv "Hamarosan" (letiltva).
 *
 * MIÉRT
 * A fordítások még nem készültek el (a nem-magyar oldalak a golive.mjs-ben
 * noindex-et kapnak, és kikerülnek a sitemapból). A fejléc nyelvváltójában
 * viszont még kattinthatók voltak a nyelvek — ez félrevezető. Ez a lépés a KÉSZ
 * dist/ minden oldalán a nyelvválasztóban a nem-magyar opciókat kattinthatatlanná
 * teszi és "Hamarosan" címkével látja el. A magyar opció változatlanul aktív marad.
 * Ahogy egy-egy nyelv elkészül, a hozzá tartozó opció újra élővé tehető.
 *
 * MIT TESZ (a dist összes .html oldalán, template-től függetlenül)
 *   1. a .langopt / .m-langopt linkek közül a NEM "Magyar" feliratúakat
 *      <a>-ból <span>-né alakítja (href nélkül), és "Hamarosan" badge-et fűz hozzájuk
 *   2. egyszer beszúr egy kis <style>-t a badge + halványítás megjelenítéséhez
 *
 * Idempotens (a ca-langsoon-css marker alapján kihagyja a kész oldalakat).
 * Hibára exit 0 — a buildet sosem állítja meg.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const MARKER = 'ca-langsoon-css';
const SOON = 'Hamarosan';

const STYLE =
`<style id="${MARKER}">` +
`.langopt-soon{display:flex;align-items:center;gap:10px;opacity:.55;cursor:default;pointer-events:none;}` +
`.langopt-soon .ca-soon{margin-left:auto;font-size:11px;font-weight:600;color:#8a94a6;background:#eef1f6;border-radius:999px;padding:2px 8px;white-space:nowrap;letter-spacing:.02em;}` +
`</style>`;

// A nyelvopció linkek: <a class="langopt" ...>...</a>  és  <a class="m-langopt" ...>...</a>
// A magyar opció felirata "<span>Magyar</span>" — azt békén hagyjuk (marad aktív).
const RE = /<a class="(langopt|m-langopt)"([^>]*)>([\s\S]*?)<\/a>/g;

function transform(html) {
  return html.replace(RE, (m, cls, _attrs, inner) => {
    if (inner.includes('>Magyar<')) return m;               // magyar marad kattintható
    return `<span class="${cls} langopt-soon">${inner}<span class="ca-soon">${SOON}</span></span>`;
  });
}

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e);
    let s;
    try { s = await stat(full); } catch { continue; }
    if (s.isDirectory()) out.push(...await walk(full));
    else if (e.endsWith('.html')) out.push(full);
  }
  return out;
}

async function run() {
  const files = await walk(DIST);
  let changed = 0, skipped = 0, noMenu = 0;
  for (const f of files) {
    let html;
    try { html = await readFile(f, 'utf8'); } catch { continue; }
    if (!/class="(langopt|m-langopt)"/.test(html)) { noMenu++; continue; }
    if (html.includes(MARKER)) { skipped++; continue; }      // már kész
    let updated = transform(html);
    const idx = updated.lastIndexOf('</head>');
    if (idx !== -1) updated = updated.slice(0, idx) + STYLE + '\n' + updated.slice(idx);
    if (updated !== html) { try { await writeFile(f, updated, 'utf8'); changed++; } catch { skipped++; } }
    else skipped++;
  }
  console.log(`[langsoon] nyelvváltó frissítve: ${changed} oldal | kihagyva: ${skipped} | nincs menü: ${noMenu}`);
}

run().catch(e => { console.error('[langsoon] HIBA (a build folytatódik):', e.message); });
