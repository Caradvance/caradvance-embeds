#!/usr/bin/env node
/**
 * CarAdvance — ár nélküli ("no-price") változat a külföldi látogatóknak.
 *
 * Futtatás a build legvégén:  node seo-noprice.mjs [dist]
 *
 * Minden érintett HTML-oldalról és ár-adatfájlról készít egy másolatot a dist/_np/ alá,
 * amelyből az árak ki vannak véve (a forráskódból is). A functions/_middleware.js
 * a Magyarországon és az USA-ban kívüli látogatóknak ezt a változatot szolgálja ki
 * ugyanazon az URL-en. Magyar és amerikai (Google) látogató az eredetit kapja.
 *
 * Kiveszi: látható árszövegek, title/meta leírás, data-eur/data-net/... attribútumok,
 * JSON-LD ajánlatok (offers/price), beágyazott ár-adatok (__ABCFG, cdVarData),
 * rent-data.js / biz-data.js árai (a Google-táblát a /api/sheet proxy szűri).
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'dist';
const NP = path.join(ROOT, '_np');
const LABEL = 'Ár kérésre';

// Oldalak, amelyek nem kapnak ár nélküli változatot (jogi szöveg, kalkulátor, belső, ügyfélajánlat).
const SKIP = [/^_np\//, /^belso\//, /^ajanlat\//, /^api\//, /^aszf\//, /^adatkezeles\//, /^impresszum\//,
  /^berlesi-feltetelek\//, /^honositas-kalkulator\//, /^atiras-kalkulator\//, /^finanszirozas-lizing\//,
  /^eladom\//, /^jotekonysag\//, /^(en|de|fr|sk|cs|pl|uk|zh)\//];

// ---------- ár-felismerés ----------
const NUM = '(?:\\d{1,3}(?:[ \\u00a0\\u202f.,]\\d{3})+|\\d+)(?:,\\d{1,2})?';
const CUR = '(?:€|EUR\\b|Ft\\b|HUF\\b)';
const CORE = new RegExp(`(?:[−–-]\\s?)?${NUM}\\s?(?:[–-]\\s?${NUM}\\s?)?${CUR}|€\\s?${NUM}`, 'g');
const RATE = /1\s?€\s?[≈=]\s?\d[\d  ]*\s?Ft/g;

export function strip(s) {
  if (!s || !/[€]|Ft\b|EUR\b|HUF\b/.test(s)) return s;
  const keep = [];
  s = s.replace(RATE, (m) => { keep.push(m); return '⁣R' + (keep.length - 1) + '⁣'; });
  s = s.replace(CORE, '⁢');
  s = s.replace(/⁢(?:\s?\/\s?(?:hó|hónap|km|nap|év))?(?:\s?[-‑–]?\s?(?:tól|től|ig|ért))?(?:\s?\/\s?(?:hó|hónap))?(?:\s?nettó)?(?:[-‑](?:tól|től))?/g, '⁢');
  s = s.replace(/\s?\(\s?⁢\s?\)/g, '');
  s = s.replace(/⁢(?:\s?[·|,\/]\s?⁢)+/g, '⁢');
  s = s.replace(/⁢/g, LABEL);
  s = s.replace(/⁣R(\d+)⁣/g, (_, i) => keep[+i]);
  return s;
}

const PRICE_KEYS = new Set(['offers', 'price', 'lowPrice', 'highPrice', 'priceSpecification', 'priceCurrency', 'priceValidUntil']);
function cleanJson(v) {
  if (Array.isArray(v)) return v.map(cleanJson);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) { if (!PRICE_KEYS.has(k)) o[k] = cleanJson(x); }
    return o;
  }
  return typeof v === 'string' ? strip(v) : v;
}

const PRICE_ATTR = /^(eur|net|huf|price|k|p2|p3|dep|rent|kaucio|cross|save|gross|ft)$/;
function cleanAttrs(tag) {
  return tag.replace(/\s([a-zA-Z0-9:_-]+)="([^"]*)"/g, (m, name, val) => {
    const dn = name.startsWith('data-') ? name.slice(5) : '';
    if (dn && PRICE_ATTR.test(dn) && /^[\d\s., ]+$/.test(val)) return ` ${name}="0"`;
    const nv = strip(val);
    return nv === val ? m : ` ${name}="${nv}"`;
  });
}

// A böngészőben futó védőháló (public/np-guard.js): amit a szkriptek utólag kiírnak (pl. 0 Ft), azt is lecseréli.
const GUARD = '<style id="np-css">[data-cross],[data-save],.np-hide{display:none!important}</style><script src="/np-guard.js"></script>';

function transformHtml(h) {
  // 1. <script> és <style> blokkok külön kezelése
  const parts = [];
  h = h.replace(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (m, tag, attrs, body) => {
    let out = body;
    if (tag.toLowerCase() === 'script') {
      if (/application\/ld\+json/i.test(attrs)) {
        try { out = JSON.stringify(cleanJson(JSON.parse(body))); } catch { out = strip(body); }
      } else if (/application\/json/i.test(attrs)) {
        try { out = JSON.stringify(cleanJson(JSON.parse(body))); } catch { out = strip(body); }
      } else {
        out = body.replace(/window\.__ABCFG=(\{[\s\S]*?\});/, (mm, js) => {
          try {
            const d = JSON.parse(js);
            for (const k of Object.keys(d)) {
              if (Array.isArray(d[k].X)) d[k].X = d[k].X.map((r) => r.map((x, i) => (i >= 6 ? 0 : x)));
            }
            return 'window.__ABCFG=' + JSON.stringify(d) + ';';
          } catch { return mm; }
        });
        out = out.replace(/\b(from|price|eur|net|gross|p2|p3|kaucio|kaution)\s*:\s*\d+(?:\.\d+)?/g, '$1:0');
        out = strip(out);
      }
    }
    parts.push(`<${tag}${attrs}>${out}</${tag}>`);
    return '⁠' + (parts.length - 1) + '⁠';
  });
  // 2. tagek attribútumai
  h = h.replace(/<[a-zA-Z][^>]*>/g, cleanAttrs);
  // 3. szöveges csomópontok
  h = h.replace(/>([^<]+)</g, (m, t) => {
    let x = strip(t);
    if (/^\s*\/\s?hó(?:\s?·\s?Ár kérésre)?\s*$/.test(x) && x !== t) x = '';
    else if (/^\s*\/\s?hó\s*·\s*Ár kérésre/.test(x)) x = x.replace(/^\s*\/\s?hó\s*·\s*Ár kérésre/, '');
    x = x.replace(/^(\s*)[-‑](?:tól|től)/, '$1');
    return '>' + x + '<';
  });
  // ár egy elemben + körülötte zárójel / "/ hó" egy másik elemben
  h = h.replace(/\s?\(\s*(<[a-z][^>]*>)\s*Ár kérésre\s*(<\/[a-z]+>)\s*\)/g, '');
  h = h.replace(/(Ár kérésre\s*<\/[a-z]+>\s*)<([a-z]+)([^>]*)>\s*\/\s?hó\s*<\/\2>/g, '$1');
  // 4. vissza a szkriptek
  h = h.replace(/⁠(\d+)⁠/g, (_, i) => parts[+i]);
  // 5. védőháló a <head>-be
  h = h.replace(/<head([^>]*)>/i, (m) => m + GUARD);
  return h;
}

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '_np') yield* walk(p); }
    else if (e.isFile() && e.name.endsWith('.html')) yield p;
  }
}

async function out(rel, content) {
  const dest = path.join(NP, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, content);
}

let pages = 0;
const dirs = new Set();
for await (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (SKIP.some((r) => r.test(rel))) continue;
  const h = await readFile(file, 'utf8');
  if (/http-equiv=["']?refresh/i.test(h)) continue;
  const t = transformHtml(h);
  await out(rel, t);
  pages++;
  dirs.add(rel.includes('/') ? rel.split('/')[0] : '');
}

// ---------- ár-adatfájlok ----------
const DATA = {
  'rent-data.js': (s) => s
    .replace(/SHEET_CSV\s*=\s*'[^']*'/, "SHEET_CSV = '/api/sheet?s=rent'")
    .replace(/\b(price|kaution)\s*:\s*[\d.]+/g, '$1:0')
    .replace('if(!ri || !ri.price) continue;', 'if(!ri) continue;'),
  'biz-data.js': (s) => s
    .replace(/SHEET_CSV\s*=\s*'[^']*'/, "SHEET_CSV='/api/sheet?s=biz'")
    .replace(/\b(eur|huf|price)\s*:\s*[\d.]+/g, '$1:0'),
};
for (const [f, fn] of Object.entries(DATA)) {
  const p = path.join(ROOT, f);
  if (existsSync(p)) await out(f, strip(fn(await readFile(p, 'utf8'))));
}

// ---------- robots.txt: a /_np/ útvonal ne kerüljön indexbe ----------
const rob = path.join(ROOT, 'robots.txt');
if (existsSync(rob)) {
  let r = await readFile(rob, 'utf8');
  if (!/Disallow:\s*\/_np\//.test(r)) {
    r = r.replace(/(User-agent:\s*\*\s*\n)/i, '$1Disallow: /_np/\n');
    if (!/Disallow:\s*\/_np\//.test(r)) r += '\nUser-agent: *\nDisallow: /_np/\n';
    await writeFile(rob, r);
  }
}

// ---------- _routes.json: a függvény csak ott fusson, ahol kell ----------
const include = new Set(['/api/*', '/_np/*', '/', '/rent-data.js', '/biz-data.js']);
for (const d of dirs) if (d) { include.add('/' + d); include.add('/' + d + '/*'); }
const inc = [...include];
if (inc.length > 100) throw new Error('_routes.json: túl sok szabály (' + inc.length + ')');
await writeFile(path.join(ROOT, '_routes.json'), JSON.stringify({ version: 1, include: inc, exclude: [] }, null, 2));

console.log(`[noprice] ${pages} oldal + ${Object.keys(DATA).length} adatfájl → _np/ · _routes.json: ${inc.length} szabály`);
