#!/usr/bin/env node
/**
 * seo-final.mjs — SEO-audit javítások a kész dist-en (Marc, 2026-11-03)
 *
 * A share-meta.mjs után, a mirror-car-photos.mjs ELŐTT fut. Hibára exit 0.
 *  1) Kattintásarány: a konfigurátor-oldalak leírása az ajánlatunkat mondja (nem a gyári oldalra küld);
 *     a .sk / .cz bérlési főoldal címe a keresett kifejezést tartalmazza („Dlhodobý prenájom auta”);
 *     a magyar új autós modelloldalak címében az évszám (2026) és a helyes ezres tagolás („22 633 €”).
 *  2) Sebesség: a hero-videó poszterképe előtöltve (LCP), az autókártyák listaképei kis méretben
 *     (mobile.de rule=mo-640 a 1600/2048 px helyett; a mirror-car-photos ezt tölti le).
 *  3) Sitemap: csak élő, indexelhető, végleges (nem átirányító) oldalak; eladott autók nélkül.
 * Többszöri futtatásra ugyanazt adja.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const st = { meta: 0, year: 0, num: 0, preload: 0, thumbs: 0, files: 0 };

const unesc = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (m, e) => {
  const k = e.toLowerCase(); if (k === 'amp') return '&'; if (k === 'quot') return '"'; if (k === 'apos') return "'"; if (k === 'lt') return '<'; if (k === 'gt') return '>'; if (k === 'nbsp') return ' ';
  return String.fromCodePoint(k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
});
const escA = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const metaRe = (key) => new RegExp(`<meta\\b[^>]*\\b(?:name|property)="${key.replace(/:/g, '\\:')}"[^>]*>`, 'gi');
const getTitle = (h) => { const m = h.match(/<title>([\s\S]*?)<\/title>/i); return m ? unesc(m[1]) : null; };
function setMeta(h, key, val) { return h.replace(metaRe(key), (tag) => /\bcontent="/i.test(tag) ? tag.replace(/\bcontent="[^"]*"/i, `content="${escA(val)}"`) : tag); }
function setTitle(h, t) {
  h = h.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escT(t)}</title>`);
  const short = t.replace(/\s\|\s*CarAdvance$/, '');
  for (const k of ['og:title', 'twitter:title']) h = setMeta(h, k, short);
  return h;
}
function setDesc(h, d) { for (const k of ['description', 'og:description', 'twitter:description']) h = setMeta(h, k, d); return h; }

// ---- 1) kattintásarány: oldalankénti leírások (csak a magyar eredeti; a nyelvi másolatok a saját fordításukat tartják) ----
const DESC = {
  'mercedes-konfigurator': 'Mercedes konfigurátor magyarul: állítsd össze az új Mercedes-Benzed, küldd el nekünk, és német áron, kulcsrakészen megrendeljük. Díjmentes ajánlat.',
  'audi-konfigurator': 'Audi konfigurátor magyarul: állítsd össze az új Audidat, küldd el nekünk, és német áron, kulcsrakészen megrendeljük. Díjmentes ajánlat.',
  'mini-konfigurator': 'MINI konfigurátor magyarul: állítsd össze az új MINI-det, küldd el nekünk, és német áron, kulcsrakészen megrendeljük. Díjmentes ajánlat.',
  'egyedi-auto-rendeles': 'BMW konfigurátor magyarul: állítsd össze az új BMW-d (vagy MINI, Mercedes, Audi), küldd el nekünk, és német áron, kulcsrakészen megrendeljük.',
};
const TITLE = { 'mercedes-konfigurator': 'Mercedes konfigurátor magyarul – új Mercedes német áron' };
// .sk / .cz bérlési főoldal: a keresett „… auta” kifejezés a címben (a többi rész marad)
const TITLE_FIX = {
  'sk/prenajom': [[/^Dlhodobý prenájom (20\d\d) — nové auto od (.+?\/mes\.), od 6 mesiacov/, 'Dlhodobý prenájom auta $1 — od $2, od 6 mesiacov']],
  'cs/pronajem': [[/^Dlouhodobý pronájem (20\d\d) — nový vůz od (.+?\/měs\.), od 6 měsíců/, 'Dlouhodobý pronájem auta $1 — od $2, od 6 měsíců']],
};
const YEAR = String(new Date().getFullYear());

function* walk(dir, rel = '') {
  let es; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of es) {
    if (e.isDirectory()) { if (!/^(?:_astro|auto-foto|media|icons|l10n|berles-press|i18n)$/.test(e.name)) yield* walk(path.join(dir, e.name), rel + e.name + '/'); }
    else if (e.name === 'index.html') yield rel;
  }
}

const HUB = /(?:^|\/)(?:autoink|auta|vozy|samochody|fahrzeuge|vehicules|veicoli|vehiculos)\/$/;
function pagePass() {
  for (const rel of walk(DIST)) {
    const f = path.join(DIST, rel, 'index.html');
    let h = fs.readFileSync(f, 'utf8'); const h0 = h;
    const key = rel.replace(/\/$/, '');

    // 1a) konfigurátor-leírások és -cím (magyar eredeti + ár nélküli _np másolat)
    const k1 = key.replace(/^_np\//, '');
    if (DESC[k1]) { h = setDesc(h, DESC[k1]); if (TITLE[k1]) h = setTitle(h, TITLE[k1] + (/\|\s*CarAdvance<\/title>/i.test(h) ? ' | CarAdvance' : '')); st.meta++; }
    // 1b) .sk / .cz bérlési főoldal címe
    if (TITLE_FIX[key]) {
      const t = getTitle(h); if (t) { let n = t; for (const [re, to] of TITLE_FIX[key]) n = n.replace(re, to); if (n !== t) { h = setTitle(h, n); st.meta++; } }
    }
    // 1c) magyar új autós modelloldal: évszám + ezres tagolás a címben/leírásban
    if (/^(?:_np\/)?egyedi-auto-rendeles\/[^/]+$/.test(key)) {
      let t = getTitle(h);
      if (t) {
        let n = t.replace(/(\d{1,3})\.(\d{3})(\s?€)/g, '$1 $2$3');
        if (!/20\d\d/.test(n) && /^Új .+? ára:/.test(n)) { const y = n.replace(/ ára:/, ` ára ${YEAR}:`); if (y.replace(/\s\|\s*CarAdvance$/, '').length <= 62) { n = y; st.year++; } }
        if (n !== t) h = setTitle(h, n);
      }
      const dm = h.match(/<meta name="description" content="([^"]*)"/i);
      if (dm) { const d = unesc(dm[1]); const nd = d.replace(/(\d{1,3})\.(\d{3})(\s?€)/g, '$1 $2$3'); if (nd !== d) { h = setDesc(h, nd); st.num++; } }
    }

    // 2a) LCP: a hero-videó poszterének előtöltése
    const pm = h.match(/<video\b[^>]*class="[^"]*\bca-lv\b[^"]*"[^>]*\bposter="([^"]+)"/i) || h.match(/<video\b[^>]*\bposter="([^"]+)"[^>]*class="[^"]*\bca-lv\b/i);
    if (pm && !h.includes('rel="preload" as="image" href="' + pm[1] + '"')) {
      h = h.replace(/<\/head>/i, `<link rel="preload" as="image" href="${pm[1]}" fetchpriority="high">\n</head>`); st.preload++;
    }
    // 2c) a Google Fonts stíluslap ne blokkolja a megjelenítést (display=swap mellett): preconnect + nem blokkoló betöltés
    if (!/data-ca-font/.test(h)) h = h.replace(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2[^"]*)"\s*\/?>/i, (m, u) => { st.font = (st.font || 0) + 1; return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${u}" media="print" onload="this.media='all'" data-ca-font><noscript><link rel="stylesheet" href="${u}"></noscript>`; });
    // 2b) autókártyák listaképei kis méretben (csak a gyűjtőoldalakon, csak <img src>)
    if (HUB.test(rel)) {
      h = h.replace(/(<img\b[^>]*\bsrc=")(https:\/\/img\.classistatic\.de\/[^"]*?[?&]rule=)mo-(\d+)/g, (m, a, b, n) => (+n > 640 ? (st.thumbs++, a + b + 'mo-640') : m));
    }
    if (h !== h0) { fs.writeFileSync(f, h); st.files++; }
  }
}

// ---- 3) sitemap: csak élő, indexelhető, végleges oldalak ----
const HOSTDIR = { 'www.caradvance.hu': '', 'caradvance.hu': '', 'www.caradvance.sk': 'sk', 'www.caradvance.cz': 'cs', 'www.caradvance.pl': 'pl', 'www.caradvance.ch': 'ch', 'www.caradvance.eu': 'eu' };
const SOLD = /^(?:Elkelt|Eladva|Sold|Verkauft|Predané|Prodáno|Sprzedan[ey]|Vendu|Venduto|Vendido|Продано|已售)\b/i;
function sitemapPass() {
  const out = [];
  for (const sm of ['sitemap.xml', 'sk/sitemap.xml', 'cs/sitemap.xml', 'pl/sitemap.xml', 'ch/sitemap.xml', 'eu/sitemap.xml']) {
    const f = path.join(DIST, sm); if (!fs.existsSync(f)) continue;
    const x = fs.readFileSync(f, 'utf8');
    if (!/<urlset\b/.test(x)) continue;
    let total = 0, drop = 0; const why = { missing: 0, noindex: 0, redirect: 0, sold: 0, dup: 0 }; const seen = new Set();
    const nx = x.replace(/[ \t]*<url>[\s\S]*?<\/url>\s*\n?/g, (blk) => {
      const m = blk.match(/<loc>([^<]+)<\/loc>/); if (!m) return blk;
      total++;
      let u; try { u = new URL(unesc(m[1])); } catch (e) { return blk; }
      const root = HOSTDIR[u.hostname]; if (root === undefined) return blk;
      if (seen.has(u.href)) { drop++; why.dup++; return ''; } seen.add(u.href);
      if (/\.[a-z0-9]{2,5}$/i.test(u.pathname)) return blk;
      let p = decodeURIComponent(u.pathname); if (!p.endsWith('/')) p += '/';
      const file = path.join(DIST, root, p, 'index.html');
      if (!fs.existsSync(file)) { drop++; why.missing++; return ''; }
      const h = fs.readFileSync(file, 'utf8');
      if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(h)) { drop++; why.noindex++; return ''; }
      if (/http-equiv=["']?refresh/i.test(h) && h.length < 6000) { drop++; why.redirect++; return ''; }
      if (/\/auto\/[^/]+\/$/.test(p) && SOLD.test(getTitle(h) || '')) { drop++; why.sold++; return ''; }
      return blk;
    });
    if (total && drop / total > 0.6) { out.push(`${sm}: KIHAGYVA (${drop}/${total} törlendő — gyanús, nem írom át)`); continue; }
    if (nx !== x) fs.writeFileSync(f, nx);
    out.push(`${sm}: ${total - drop}/${total} (kivéve ${Object.entries(why).filter(([, v]) => v).map(([k, v]) => k + ' ' + v).join(', ') || '0'})`);
  }
  return out.join(' · ');
}

try {
  if (!fs.existsSync(DIST)) { console.log('[seo-final] nincs dist'); }
  else {
    pagePass();
    const sm = sitemapPass();
    console.log(`[seo-final] meta ${st.meta}, évszám ${st.year}, ezres tagolás ${st.num}, poszter-előtöltés ${st.preload}, nem blokkoló betűtípus ${st.font || 0}, kis listakép ${st.thumbs}, ${st.files} fájl · sitemap: ${sm}`);
  }
} catch (e) { console.log('[seo-final] hiba: ' + (e && e.stack || e)); }
