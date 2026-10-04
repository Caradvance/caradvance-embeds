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
import { writeRuntime } from './i18n-runtime.mjs';
import { makeTemplater, neutral } from './i18n-templates.mjs';
import { navSync } from './i18n-navsync.mjs';
import { makeRental } from './i18n-rental.mjs';
import { skczPost, fxOf, addSwitch, LBL, runtimeJs } from './i18n-skcz.mjs';

const DIST = 'dist';
const SITE = 'https://www.caradvance.hu';
const SKIPDIR = /^(_np|en|de|fr|uk|zh|sk|cs|pl|belso|ajanlat|api)(\/|$)/;
const HREFLANG = { hu: 'hu', en: 'en', de: 'de', fr: 'fr', uk: 'uk', zh: 'zh-Hans', sk: 'sk', cs: 'cs' };
const OG = { hu: 'hu_HU', en: 'en_GB', de: 'de_DE', fr: 'fr_FR', uk: 'uk_UA', zh: 'zh_CN', sk: 'sk_SK', cs: 'cs_CZ' };
const MIN_COVER = 0.85;
const FLAG = { en: 'gb', de: 'de', fr: 'fr', uk: 'ua', zh: 'cn', sk: 'sk', cs: 'cz' };
const LEGAL = /^(aszf|adatkezeles|impresszum|berlesi-feltetelek)\//;
const NOTE = {
  en: 'This is a translation for information only — the Hungarian version is legally binding.',
  de: 'Diese Übersetzung dient nur zur Information — rechtsverbindlich ist die ungarische Fassung.',
  fr: 'Traduction fournie à titre informatif — seule la version hongroise fait foi.',
  uk: 'Цей переклад має лише інформаційний характер — юридичну силу має угорська версія.',
  zh: '本译文仅供参考，以匈牙利语版本为准。',
  sk: LBL.sk.note,
  cs: LBL.cs.note,
};

function placeholdersOk(k, tr) {
  const sig = (s) => [...s.matchAll(/\{\d+\}|<\/?[gx]\d+\/?>/g)].map((m) => m[0]).sort().join('|');
  return sig(k) === sig(tr);
}

try {
  const M = JSON.parse(fs.readFileSync('src/i18n/intl-map.json', 'utf8'));
  // sk/cs: saját domain (intl-map.json → domains). Élesítésig (domainsLive=false) csak előnézet: /sk/ /cs/, noindex, hreflang nélkül.
  const DOMS = M.domains || {}; const DL = Object.keys(DOMS); const DLIVE = M.domainsLive === true;
  const BASE = M.mirror || M.live; const LANGS = [...BASE, ...DL];
  const dicts = {};
  for (const l of LANGS) { try { dicts[l] = JSON.parse(fs.readFileSync(`src/i18n/dict/${l}.json`, 'utf8')); } catch { dicts[l] = {}; } }

  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(DIST, p).split(path.sep).join('/'); if (e.isDirectory()) { if (!SKIPDIR.test(rel + '/')) walk(p); } else if (e.name === 'index.html') files.push(rel); } };
  walk(DIST);
  const pages = [];
  const REDIR = {}; // régi slug → új oldal (meta refresh oldalak)
  for (const rel of files) { const h = fs.readFileSync(path.join(DIST, rel), 'utf8'); if (/http-equiv=["']?refresh/i.test(h)) { const m = h.match(/http-equiv=["']?refresh["']?[^>]*url=([^"'>]+)/i); if (m) { let t = m[1].replace(/^https?:\/\/(?:www\.)?caradvance\.hu/, '').split(/[?#]/)[0]; if (t.startsWith('/')) REDIR['/' + rel.replace(/index\.html$/, '')] = t.endsWith('/') ? t : t + '/'; } continue; } pages.push(rel); }
  console.log('[mirror] egységes menü: ' + navSync(DIST, pages) + ' oldal frissítve');
  const huPath = (rel) => '/' + rel.replace(/index\.html$/, '');
  // kulcsoldalak SEO-URL-je (intl-map.json pages): /uj-auto-berlese/ -> /en/car-rental-budapest/ …
  const SLUG = {}; const KEY = {};
  for (const [k, g] of Object.entries(M.pages || {})) if (g.hu) { SLUG[g.hu] = g; KEY[g.hu] = k; }
  const L = (l, p) => (l === 'hu' ? p : (SLUG[p] && SLUG[p][l]) || '/' + l + p);
  const DU = (l, p) => DOMS[l] + L(l, p).replace(new RegExp('^/' + l + '/'), '/'); // pl. https://www.caradvance.sk/autoink/
  const ABS = (l, p) => (DL.includes(l) && DLIVE ? DU(l, p) : SITE + L(l, p));
  const domMap = {}; for (const l of DL) domMap[l] = [];
  const INTL = {}; for (const l of LANGS) INTL[l] = loadIntl(l);
  const switcher = (h, l, p) => h.replace(/<a([^>]*?)class="(langopt|m-langopt)"([^>]*)>/g, (m, a, cls, b) => {
    const lm = (a + b).match(/hreflang="([^"]+)"/); const code = lm ? (lm[1] === 'zh-Hans' ? 'zh' : lm[1]) : null;
    if (!code || (code !== 'hu' && !LANGS.includes(code))) return m;
    return m.replace(/href="[^"]*"/, `href="${L(code, p)}"`).replace(/\saria-current="[^"]*"/, '').replace(/>$/, code === l ? ' aria-current="true">' : '>');
  });
  const PAGESET = new Set(pages.map(huPath));
  const sitemapAdd = []; const stats = {};
  const TPL = {}; for (const l of LANGS) { const t1 = makeTemplater(l, dicts[l]); let rt = {}; try { rt = JSON.parse(fs.readFileSync(`src/i18n/dict/rt-${l}.json`, 'utf8')); } catch {} const t2 = makeRental(l, dicts[l], rt); TPL[l] = (k) => t1(k) || t2(k); }
  const XJS = {}; for (const l of DL) XJS[l] = runtimeJs(fxOf(M, l));
  const rtn = writeRuntime(DIST, LANGS, [...PAGESET], SLUG, REDIR, XJS); const RTV = Date.now().toString(36);
  console.log('[mirror] runtime szótár: ' + Object.entries(rtn).map(([l, n]) => l + ' ' + n).join(', '));

  const linkFix = (html, l) => html.replace(/(\shref=")((?:https?:\/\/(?:www\.)?caradvance\.hu)?)(\/[^"]*)"/g, (m, pre, host, p) => {
    if (/^\/(en|de|fr|uk|zh|sk|cs|_np|api)\//.test(p)) return m;
    const clean = p.split(/[?#]/)[0]; const rest = p.slice(clean.length);
    if (/^\/berelheto\/?$/.test(clean)) return `${pre}${L(l, '/autoink/')}#berelheto"`; // a /berelheto/ oldal = /autoink/ Bérelhető fül
    const norm = clean.endsWith('/') ? clean : clean + '/';
    if (/\.[a-z0-9]{2,5}$/i.test(clean)) return m;        // fájl
    const tgt = PAGESET.has(norm) ? norm : (REDIR[norm] && PAGESET.has(REDIR[norm]) ? REDIR[norm] : null);
    if (!tgt) return m;
    return `${pre}${L(l, tgt)}${rest}"`;
  });

  for (const rel of pages) {
    const src = fs.readFileSync(path.join(DIST, rel), 'utf8');
    const p = huPath(rel);
    const cluster = ['hu', ...BASE, ...(DLIVE ? DL : [])].map((l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${ABS(l, p)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE}${p}">`;
    const dropAlt = (h) => h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>\s*\n?/g, '');
    // magyar oldal: teljes klaszter
    let huh = switcher(dropAlt(src), 'hu', p); if (DLIVE && DL.length) huh = addSwitch(huh, DL, (c) => DU(c, p), 'hu');
    fs.writeFileSync(path.join(DIST, rel), huh.replace(/<\/head>/i, cluster + '\n</head>'));

    for (const l of LANGS) {
      const D = dicts[l]; let hit = 0, miss = 0;
      const doc = parse(src);
      const TP = TPL[l];
      visit(doc, (kind, k, apply) => { const tr = D[k] || TP(k); if (tr && placeholdersOk(k, tr)) { try { apply(tr); hit++; } catch { miss++; } } else if (neutral(k)) hit++; else miss++; });
      finishLd(doc);
      let h = serialize(doc);
      h = h.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${HREFLANG[l]}"`);
      if (!/<html[^>]*\slang=/i.test(h)) h = h.replace(/<html/i, `<html lang="${HREFLANG[l]}"`);
      if (KEY[p]) h = applyExpat(h, KEY[p], l, INTL[l], M);
      h = linkFix(h, l);
      // nyelvi képváltozat: ha van dist/l10n/<nyelv>/<fájlnév>, azt használjuk (pl. feliratos grafikák)
      h = h.replace(/(\s(?:src|srcset|content|poster)=")((?:https?:\/\/(?:www\.)?caradvance\.hu)?\/)([^"\/?#]+\.(?:webp|png|jpe?g|avif))"/g, (m, pre, host, f) => (fs.existsSync(path.join(DIST, 'l10n', l, f)) ? `${pre}${host}l10n/${l}/${f}"` : m));
      h = h.replace(/(location\.href\s*=\s*')(\/[^'#?]*)/g, (m, pre, p0) => { const n = p0.endsWith('/') ? p0 : p0 + '/'; return PAGESET.has(n) ? pre + L(l, n) : m; });
      h = switcher(h, l, p);
      if (DL.length && (DLIVE || DL.includes(l))) h = addSwitch(h, DL, (c) => (DLIVE ? DU(c, p) : L(c, p)), l);
      h = h.replace(/(class="navflag" style="background-image:url\(https:\/\/flagcdn\.com\/w80\/)hu(\.png\))/g, `$1${FLAG[l]}$2`);
      h = h.replace(/<\/body>/i, `<script src="/i18n/rt-${l}.js?v=${RTV}" defer></script>\n</body>`);
      h = dropAlt(h).replace(/<\/head>/i, cluster + '\n</head>');
      const isDom = DL.includes(l); const url = ABS(l, p);
      h = /<link rel="canonical"[^>]*>/i.test(h) ? h.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}">`) : h.replace(/<\/head>/i, `<link rel="canonical" href="${url}">\n</head>`);
      h = h.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${url}">`);
      h = /<meta property="og:locale"[^>]*>/i.test(h) ? h.replace(/<meta property="og:locale"[^>]*>/i, `<meta property="og:locale" content="${OG[l]}">`) : h.replace(/<\/head>/i, `<meta property="og:locale" content="${OG[l]}">\n</head>`);
      if (LEGAL.test(rel) && NOTE[l]) h = h.replace(/<main([^>]*)>/i, `<main$1><div style="max-width:1100px;margin:12px auto 0;padding:10px 16px;border-radius:10px;background:#fff7e6;border:1px solid #ffe2a8;font-size:14px;color:#6b4e00">${NOTE[l]}</div>`);
      const cover = hit / Math.max(1, hit + miss);
      h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, '');
      if (cover < MIN_COVER || (isDom && !DLIVE)) h = h.replace(/<\/head>/i, '<meta name="robots" content="noindex,follow">\n</head>');
      else if (isDom) domMap[l].push(url); else sitemapAdd.push(url);
      if (isDom) h = skczPost(h, l, fxOf(M, l), LEGAL.test(rel));
      if (p === '/berelheto/') { const t = L(l, '/autoink/') + '#berelheto'; h = `<!DOCTYPE html><html lang="${HREFLANG[l]}"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${SITE}${L(l, '/autoink/')}"><meta http-equiv="refresh" content="0;url=${t}"><script>location.replace(${JSON.stringify(t)})</script></head><body><a href="${t}">${t}</a></body></html>`; }
      const out = path.join(DIST, L(l, p).replace(/^\//, ''), 'index.html'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, h);
      const s = stats[l] || (stats[l] = { pages: 0, indexed: 0, hit: 0, miss: 0 }); s.pages++; s.hit += hit; s.miss += miss; if (cover >= MIN_COVER) s.indexed++;
    }
  }
  // sitemap kiegészítés
  const smf = path.join(DIST, 'sitemap.xml');
  if (fs.existsSync(smf) && sitemapAdd.length) {
    let sm = fs.readFileSync(smf, 'utf8'); const now = new Date().toISOString().slice(0, 10);
    const add = sitemapAdd.filter((u) => !/\/berelheto\/$/.test(u) && !sm.includes(`<loc>${u}</loc>`)).map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join('\n');
    sm = sm.replace('</urlset>', add + '\n</urlset>'); fs.writeFileSync(smf, sm);
  }
  for (const l of DL) {
    const now = new Date().toISOString().slice(0, 10); fs.mkdirSync(path.join(DIST, l), { recursive: true });
    fs.writeFileSync(path.join(DIST, l, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + domMap[l].filter((u) => !/\/berelheto\/$/.test(u)).map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join('\n') + '\n</urlset>\n');
    fs.writeFileSync(path.join(DIST, l, 'robots.txt'), DLIVE ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${DOMS[l]}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
    console.log(`[mirror] ${l}: domain ${DOMS[l]} ${DLIVE ? 'ÉLES' : 'előnézet (noindex)'} — sitemap ${domMap[l].length} URL`);
  }
  for (const [l, s] of Object.entries(stats)) console.log(`[mirror] ${l}: ${s.pages} oldal, indexelve ${s.indexed}, lefedettség ${(100 * s.hit / Math.max(1, s.hit + s.miss)).toFixed(1)}%`);
} catch (e) {
  console.log('[mirror] FIGYELEM - ' + (e && e.stack || e) + ' (a build megy tovabb)');
  process.exit(0);
}
