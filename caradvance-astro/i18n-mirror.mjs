#!/usr/bin/env node
/**
 * i18n-mirror.mjs — a TELJES oldal lefordított tükre minden élő nyelven (2026-10)
 *
 * A kész magyar dist/ minden oldaláról (dist/<útvonal>/index.html) elkészíti a
 * dist/<nyelv>/<útvonal>/index.html változatot: a szövegeket, alt/title/placeholder
 * attribútumokat, meta leírásokat és a JSON-LD szövegeit a src/i18n/dict/<nyelv>.json
 * szótár alapján lefordítja, a belső linkeket a nyelvi útvonalra írja át, beállítja a
 * <html lang>, canonical, og:locale és a teljes hreflang-klasztert (a magyar oldalon is).
 * Ahol a fordítási lefedettség 85% alatt van, az oldal noindex lesz és kimarad a sitemapból.
 * Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize, visit, finishLd } from './i18n-core.mjs';
import { loadIntl, applyExpat } from './i18n-expat.mjs';

const DIST = 'dist';
const SITE = 'https://www.caradvance.hu';
const SKIPDIR = /^(_np|en|de|fr|uk|zh|sk|cs|pl|belso|ajanlat|api)(\/|$)/;
const HREFLANG = { hu: 'hu', en: 'en', de: 'de', fr: 'fr', uk: 'uk', zh: 'zh-Hans' };
const OG = { hu: 'hu_HU', en: 'en_GB', de: 'de_DE', fr: 'fr_FR', uk: 'uk_UA', zh: 'zh_CN' };
const MIN_COVER = 0.85;
const LEGAL = /^(aszf|adatkezeles|impresszum|berlesi-feltetelek)\//;
const NOTE = {
  en: 'This is a translation for information only — the Hungarian version is legally binding.',
  de: 'Diese Übersetzung dient nur zur Information — rechtsverbindlich ist die ungarische Fassung.',
  fr: 'Traduction fournie à titre informatif — seule la version hongroise fait foi.',
  uk: 'Цей переклад має лише інформаційний характер — юридичну силу має угорська версія.',
  zh: '本译文仅供参考，以匈牙利语版本为准。',
};

function placeholdersOk(k, tr) {
  const sig = (s) => [...s.matchAll(/\{\d+\}|<\/?[gx]\d+\/?>/g)].map((m) => m[0]).sort().join('|');
  return sig(k) === sig(tr);
}

try {
  const M = JSON.parse(fs.readFileSync('src/i18n/intl-map.json', 'utf8'));
  const LANGS = M.mirror || M.live;
  const dicts = {};
  for (const l of LANGS) { try { dicts[l] = JSON.parse(fs.readFileSync(`src/i18n/dict/${l}.json`, 'utf8')); } catch { dicts[l] = {}; } }

  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(DIST, p).split(path.sep).join('/'); if (e.isDirectory()) { if (!SKIPDIR.test(rel + '/')) walk(p); } else if (e.name === 'index.html') files.push(rel); } };
  walk(DIST);
  const pages = [];
  for (const rel of files) { const h = fs.readFileSync(path.join(DIST, rel), 'utf8'); if (/http-equiv=["']?refresh/i.test(h)) continue; pages.push(rel); }
  const huPath = (rel) => '/' + rel.replace(/index\.html$/, '');
  // kulcsoldalak SEO-URL-je (intl-map.json pages): /uj-auto-berlese/ -> /en/car-rental-budapest/ …
  const SLUG = {}; const KEY = {};
  for (const [k, g] of Object.entries(M.pages || {})) if (g.hu) { SLUG[g.hu] = g; KEY[g.hu] = k; }
  const L = (l, p) => (l === 'hu' ? p : (SLUG[p] && SLUG[p][l]) || '/' + l + p);
  const INTL = {}; for (const l of LANGS) INTL[l] = loadIntl(l);
  const switcher = (h, l, p) => h.replace(/<a([^>]*?)class="(langopt|m-langopt)"([^>]*)>/g, (m, a, cls, b) => {
    const lm = (a + b).match(/hreflang="([^"]+)"/); const code = lm ? (lm[1] === 'zh-Hans' ? 'zh' : lm[1]) : null;
    if (!code || (code !== 'hu' && !LANGS.includes(code))) return m;
    return m.replace(/href="[^"]*"/, `href="${L(code, p)}"`).replace(/\saria-current="[^"]*"/, '').replace(/>$/, code === l ? ' aria-current="true">' : '>');
  });
  const PAGESET = new Set(pages.map(huPath));
  const sitemapAdd = []; const stats = {};

  const linkFix = (html, l) => html.replace(/(\shref=")((?:https?:\/\/(?:www\.)?caradvance\.hu)?)(\/[^"]*)"/g, (m, pre, host, p) => {
    if (/^\/(en|de|fr|uk|zh|_np|api)\//.test(p)) return m;
    const clean = p.split(/[?#]/)[0]; const rest = p.slice(clean.length);
    const norm = clean.endsWith('/') ? clean : clean + '/';
    if (/\.[a-z0-9]{2,5}$/i.test(clean)) return m;        // fájl
    if (!PAGESET.has(norm)) return m;
    return `${pre}${L(l, norm)}${rest}"`;
  });

  for (const rel of pages) {
    const src = fs.readFileSync(path.join(DIST, rel), 'utf8');
    const p = huPath(rel);
    const cluster = ['hu', ...LANGS].map((l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE}${L(l, p)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE}${p}">`;
    const dropAlt = (h) => h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>\s*\n?/g, '');
    // magyar oldal: teljes klaszter
    fs.writeFileSync(path.join(DIST, rel), switcher(dropAlt(src), 'hu', p).replace(/<\/head>/i, cluster + '\n</head>'));

    for (const l of LANGS) {
      const D = dicts[l]; let hit = 0, miss = 0;
      const doc = parse(src);
      visit(doc, (kind, k, apply) => { const tr = D[k]; if (tr && placeholdersOk(k, tr)) { try { apply(tr); hit++; } catch { miss++; } } else miss++; });
      finishLd(doc);
      let h = serialize(doc);
      h = h.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${HREFLANG[l]}"`);
      if (!/<html[^>]*\slang=/i.test(h)) h = h.replace(/<html/i, `<html lang="${HREFLANG[l]}"`);
      h = linkFix(h, l);
      h = switcher(h, l, p);
      if (KEY[p]) h = applyExpat(h, KEY[p], l, INTL[l], M);
      h = dropAlt(h).replace(/<\/head>/i, cluster + '\n</head>');
      const url = `${SITE}${L(l, p)}`;
      h = /<link rel="canonical"[^>]*>/i.test(h) ? h.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}">`) : h.replace(/<\/head>/i, `<link rel="canonical" href="${url}">\n</head>`);
      h = h.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${url}">`);
      h = /<meta property="og:locale"[^>]*>/i.test(h) ? h.replace(/<meta property="og:locale"[^>]*>/i, `<meta property="og:locale" content="${OG[l]}">`) : h.replace(/<\/head>/i, `<meta property="og:locale" content="${OG[l]}">\n</head>`);
      if (LEGAL.test(rel) && NOTE[l]) h = h.replace(/<main([^>]*)>/i, `<main$1><div style="max-width:1100px;margin:12px auto 0;padding:10px 16px;border-radius:10px;background:#fff7e6;border:1px solid #ffe2a8;font-size:14px;color:#6b4e00">${NOTE[l]}</div>`);
      const cover = hit / Math.max(1, hit + miss);
      h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, '');
      if (cover < MIN_COVER) h = h.replace(/<\/head>/i, '<meta name="robots" content="noindex,follow">\n</head>');
      else sitemapAdd.push(url);
      const out = path.join(DIST, L(l, p).replace(/^\//, ''), 'index.html'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, h);
      const s = stats[l] || (stats[l] = { pages: 0, indexed: 0, hit: 0, miss: 0 }); s.pages++; s.hit += hit; s.miss += miss; if (cover >= MIN_COVER) s.indexed++;
    }
  }
  // sitemap kiegészítés
  const smf = path.join(DIST, 'sitemap.xml');
  if (fs.existsSync(smf) && sitemapAdd.length) {
    let sm = fs.readFileSync(smf, 'utf8'); const now = new Date().toISOString().slice(0, 10);
    const add = sitemapAdd.filter((u) => !sm.includes(`<loc>${u}</loc>`)).map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join('\n');
    sm = sm.replace('</urlset>', add + '\n</urlset>'); fs.writeFileSync(smf, sm);
  }
  for (const [l, s] of Object.entries(stats)) console.log(`[mirror] ${l}: ${s.pages} oldal, indexelve ${s.indexed}, lefedettség ${(100 * s.hit / Math.max(1, s.hit + s.miss)).toFixed(1)}%`);
} catch (e) {
  console.log('[mirror] FIGYELEM - ' + (e && e.stack || e) + ' (a build megy tovabb)');
  process.exit(0);
}
