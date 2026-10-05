#!/usr/bin/env node
/**
 * seo-fix.mjs — SEO-audit javítások (2026-10, Ahrefs + saját crawl alapján)
 *
 *   node seo-fix.mjs pre    — az i18n-mirror ELŐTT (csak a magyar oldalakon; a tükör ebből fordít)
 *     · AutoDealer JSON-LD kiegészítése (cím, telefon, logó, nyitvatartás, sameAs, www URL) — Google rich result hibák
 *     · /uj-auto-berlese/: "tartós bérlet" cím + valódi <h1>
 *     · /bizomanyos/: saját cím + leírás (eddig a főoldaléval egyezett)
 *     · /autoink/, /kapcsolat/: JSON-LD (eddig nem volt)
 *
 *   node seo-fix.mjs post   — az i18n-mirror UTÁN, a seo-noprice ELŐTT (minden nyelven)
 *     · túl hosszú title (>65): a " | CarAdvance" utótag elhagyása
 *     · túl hosszú meta description (>165): vágás mondat/szóhatáron (≤160)
 *     · hiányzó Open Graph / Twitter tagek pótlása
 *     · hiányzó alt attribútum pótlása (kártya-címből, különben alt="")
 *     · <!--email_off--> — a Cloudflare e-mail-elrejtés /cdn-cgi/l/email-protection linkjei (Ahrefs: 404) helyett
 *     · /auto/ és /bizomanyos-auto/ (JS-sablon oldalak, tartalom nélkül): noindex + ki a sitemapből
 *     · meta-refresh átirányító oldalak → valódi 301 a _redirects-ben + ki a sitemapből
 * Hiba esetén exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.caradvance.hu';
const MODE = process.argv[2] || 'post';
const LANG_DIR = /^(en|de|fr|uk|zh|sk|cs|pl)\//;

function walk(dir, rel = '', out = []) {
  let es; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of es) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (/^(_np|_astro|i18n|api|cdn-cgi)$/.test(r)) continue; walk(path.join(dir, e.name), r, out); }
    else if (e.name === 'index.html') out.push(r);
  }
  return out;
}
const pathOf = (rel) => '/' + rel.replace(/index\.html$/, '');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decode = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

/* ------------------------------------------------------------------ PRE */
const DEALER = {
  url: SITE + '/',
  logo: SITE + '/caradvance-logo.webp',
  image: SITE + '/caradvance-iroda.webp',
  telephone: '+36 30 233 6060',
  email: 'info@caradvance.hu',
  priceRange: '€€€',
  address: { '@type': 'PostalAddress', streetAddress: 'Ibolya utca 18.', postalCode: '2083', addressLocality: 'Solymár', addressRegion: 'Pest', addressCountry: 'HU' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' }],
  sameAs: ['https://www.facebook.com/share/19BfQsJxSk/', 'https://www.instagram.com/caradvance_hungary', 'https://www.youtube.com/channel/UCbmogjjIDqVwFtFoA-h3jjw', 'https://www.hasznaltauto.hu/partner/bh_group_zrt-20676'],
  parentOrganization: { '@type': 'Organization', name: 'Caradvance GmbH', url: 'https://www.caradvance.de/', address: { '@type': 'PostalAddress', streetAddress: 'Bgm.-Graf-Ring 21', postalCode: '82538', addressLocality: 'Geretsried', addressCountry: 'DE' } },
};
function enrich(o) {
  if (Array.isArray(o)) { o.forEach(enrich); return; }
  if (!o || typeof o !== 'object') return;
  const t = o['@type'];
  if (t === 'AutoDealer' || (Array.isArray(t) && t.includes('AutoDealer'))) {
    for (const [k, v] of Object.entries(DEALER)) if (o[k] == null || o[k] === '') o[k] = JSON.parse(JSON.stringify(v));
    if (typeof o.url === 'string') o.url = o.url.replace(/^https?:\/\/caradvance\.hu/, SITE);
    if (!o['@id']) o['@id'] = SITE + '/#dealer';
  }
  for (const v of Object.values(o)) if (v && typeof v === 'object') enrich(v);
}
function fixLd(h) {
  return h.replace(/(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, body, c) => {
    if (!/AutoDealer|caradvance\.hu/.test(body)) return m;
    try {
      const j = JSON.parse(body); enrich(j);
      let s = JSON.stringify(j).replace(/"https?:\/\/caradvance\.hu\//g, '"' + SITE + '/');
      return a + s + c;
    } catch { return m; }
  });
}
const setTitle = (h, t) => h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
  .replace(/(<meta[^>]+property="og:title"[^>]+content=")[^"]*(")/i, `$1${escAttr(t)}$2`)
  .replace(/(<meta[^>]+name="twitter:title"[^>]+content=")[^"]*(")/i, `$1${escAttr(t)}$2`);
const setDesc = (h, d) => h.replace(/(<meta[^>]+name="description"[^>]+content=")[^"]*(")/i, `$1${escAttr(d)}$2`)
  .replace(/(<meta[^>]+property="og:description"[^>]+content=")[^"]*(")/i, `$1${escAttr(d)}$2`)
  .replace(/(<meta[^>]+name="twitter:description"[^>]+content=")[^"]*(")/i, `$1${escAttr(d)}$2`);
const addLd = (h, obj) => h.replace(/<\/head>/i, `<script type="application/ld+json">${JSON.stringify(obj)}</script>\n</head>`);
const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + u })) });

function pre() {
  const files = walk(DIST).filter((r) => !LANG_DIR.test(r));
  let ld = 0, pages = 0;
  for (const rel of files) {
    const f = path.join(DIST, rel); const p = pathOf(rel);
    let h = fs.readFileSync(f, 'utf8'); const before = h;
    try {
      h = fixLd(h);
      if (p === '/uj-auto-berlese/') {
        h = setTitle(h, 'Tartós bérlet – új prémium autók havidíjjal | CarAdvance');
        if (!/<h1[\s>]/i.test(h)) h = h.replace(/<div class="egl-mhero-h1">([\s\S]*?)<\/div>/, '<h1 class="egl-mhero-h1">Tartós bérlet új prémium autókra</h1>');
      }
      if (p === '/bizomanyos/') {
        h = setTitle(h, 'Bizományos autók – eladó prémium használt autók | CarAdvance');
        h = setDesc(h, 'Eladó bizományos prémium autók ellenőrzött előélettel és valós futással, átlátható feltételekkel. Jutalékunk 30%-át jótékony célra fordítjuk.');
      }
      if (p === '/autoink/' && !/application\/ld\+json/.test(h)) {
        h = addLd(h, { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Megvásárolható autóink', url: SITE + '/autoink/', isPartOf: { '@type': 'WebSite', name: 'CarAdvance', url: SITE + '/' }, provider: { '@id': SITE + '/#dealer' } });
        h = addLd(h, crumbs([['Főoldal', '/'], ['Autóink', '/autoink/']]));
      }
      if (p === '/kapcsolat/' && !/application\/ld\+json/.test(h)) {
        const dealer = { '@type': 'AutoDealer', name: 'CarAdvance' }; enrich(dealer);
        h = addLd(h, { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Kapcsolat', url: SITE + '/kapcsolat/', mainEntity: dealer });
        h = addLd(h, crumbs([['Főoldal', '/'], ['Kapcsolat', '/kapcsolat/']]));
      }
    } catch (e) { console.log('[seo-fix pre] ' + rel + ': ' + e.message); h = before; }
    if (h !== before) { fs.writeFileSync(f, h); pages++; if (/AutoDealer/.test(h)) ld++; }
  }
  console.log(`[seo-fix pre] ${pages} oldal frissítve (AutoDealer-adatok ${ld} oldalon)`);
}

/* ------------------------------------------------------------------ POST */
function trimDesc(d) {
  if (d.length <= 165) return d;
  const cut = d.slice(0, 160);
  const s = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), cut.lastIndexOf('。'));
  if (s >= 90) return cut.slice(0, s + 1).trim();
  const w = cut.lastIndexOf(' ');
  return (w > 100 ? cut.slice(0, w) : cut).replace(/[,;:–—\-\s]+$/, '') + '…';
}
function altFor(tagStart, html, idx, pageH1) {
  // a képet tartalmazó kártya/link címe
  const win = html.slice(idx, idx + 1600);
  const m = win.match(/<(h[2-4])[^>]*>([\s\S]*?)<\/\1>/i);
  if (m) { const t = decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); if (t && t.length < 120) return t; }
  return '';
}
function post() {
  const files = walk(DIST);
  const redirects = [];
  const dropFromSitemap = new Set();
  const st = { title: 0, desc: 0, og: 0, alt: 0, email: 0, shell: 0, redir: 0 };
  for (const rel of files) {
    const f = path.join(DIST, rel); const p = pathOf(rel);
    let h = fs.readFileSync(f, 'utf8'); const before = h;
    try {
      // meta-refresh átirányító oldal → 301
      const rf = h.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']\s*\d+\s*;\s*url=([^"']+)["']/i);
      if (rf && h.length < 3000) {
        let t = decode(rf[1]).replace(/^https?:\/\/(?:www\.)?caradvance\.hu/i, '');
        if (t.startsWith('/')) {
          const [pp, hash] = t.split('#'); const clean = pp.split('?')[0]; const tgt = (clean.endsWith('/') ? clean : clean + '/') + (pp.includes('?') ? pp.slice(pp.indexOf('?')) : '') + (hash ? '#' + hash : '');
          if (tgt.split('#')[0] !== p) { redirects.push([p, tgt]); dropFromSitemap.add(SITE + p); st.redir++; }
        }
        continue;
      }
      const base = p.replace(/^\/(en|de|fr|uk|zh|sk|cs)\//, '/');
      // JS-sablon oldalak: noindex
      if (base === '/auto/' || base === '/bizomanyos-auto/') {
        h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, '').replace(/<\/head>/i, '<meta name="robots" content="noindex,follow">\n</head>');
        dropFromSitemap.add(SITE + p); st.shell++;
      }
      // title
      const tm = h.match(/<title>([\s\S]*?)<\/title>/i);
      let title = tm ? decode(tm[1]).replace(/\s+/g, ' ').trim() : '';
      if (title.length > 65 && / \| CarAdvance$/.test(title)) {
        const nt = title.replace(/ \| CarAdvance$/, '');
        h = h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escAttr(nt).replace(/&quot;/g, '"')}</title>`);
        h = h.replace(/(<meta[^>]+(?:property="og:title"|name="twitter:title")[^>]+content=")([^"]*)(")/gi, (m, a, v, c) => (/ \| CarAdvance$/.test(decode(v)) && decode(v).length > 65 ? a + escAttr(decode(v).replace(/ \| CarAdvance$/, '')) + c : m));
        title = nt; st.title++;
      }
      // description
      const dm = h.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
      let desc = dm ? decode(dm[1]) : '';
      if (desc.length > 165) {
        const nd = trimDesc(desc);
        h = h.replace(/(<meta[^>]+(?:name="description"|property="og:description"|name="twitter:description")[^>]+content=")([^"]*)(")/gi, (m, a, v, c) => (decode(v) === desc ? a + escAttr(nd) + c : m));
        desc = nd; st.desc++;
      }
      // Open Graph / Twitter
      if (/<head[\s>]/i.test(h) && !/http-equiv=["']?refresh/i.test(h)) {
        const canon = (h.match(/<link rel="canonical" href="([^"]+)"/i) || [])[1] || SITE + p;
        const img = (h.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) || [])[1] || SITE + '/caradvance-hero-x5-poster.jpg';
        const add = [];
        const has = (re) => re.test(h);
        if (!has(/property="og:type"/i)) add.push(`<meta property="og:type" content="website">`);
        if (!has(/property="og:site_name"/i)) add.push(`<meta property="og:site_name" content="CarAdvance">`);
        if (!has(/property="og:title"/i) && title) add.push(`<meta property="og:title" content="${escAttr(title)}">`);
        if (!has(/property="og:description"/i) && desc) add.push(`<meta property="og:description" content="${escAttr(desc)}">`);
        if (!has(/property="og:url"/i)) add.push(`<meta property="og:url" content="${escAttr(canon)}">`);
        if (!has(/property="og:image"/i)) add.push(`<meta property="og:image" content="${escAttr(img)}">`);
        if (!has(/name="twitter:card"/i)) add.push(`<meta name="twitter:card" content="summary_large_image">`);
        if (!has(/name="twitter:title"/i) && title) add.push(`<meta name="twitter:title" content="${escAttr(title)}">`);
        if (!has(/name="twitter:description"/i) && desc) add.push(`<meta name="twitter:description" content="${escAttr(desc)}">`);
        if (!has(/name="twitter:image"/i)) add.push(`<meta name="twitter:image" content="${escAttr(img)}">`);
        if (add.length) { h = h.replace(/<\/head>/i, add.join('\n') + '\n</head>'); st.og++; }
      }
      // alt
      let altN = 0;
      const segs = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<template\b[^>]*>[\s\S]*?<\/template>)/i);
      for (let i = 0; i < segs.length; i += 2) {
        segs[i] = segs[i].replace(/<img\b(?![^>]*\balt=)([^>]*?)(\/?)>/gi, (m, attrs, sl, off, full) => { altN++; const a = altFor(m, full, off); return `<img${attrs} alt="${escAttr(a)}"${sl}>`; });
      }
      if (altN) { h = segs.join(''); st.alt++; }
      // Cloudflare e-mail elrejtés kikapcsolása az oldalon (különben /cdn-cgi/l/email-protection linkek)
      if (!/<!--email_off-->/.test(h) && /<body[^>]*>/i.test(h)) { h = h.replace(/(<body[^>]*>)/i, '$1<!--email_off-->').replace(/<\/body>/i, '<!--/email_off--></body>'); st.email++; }
      // sk/cs: a vállalkozás címe a JSON-LD-ben teljesen szlovák legyen (a szöveges csere csak az utcát írja át)
      if (/^\/(sk|cs)\//.test(p)) {
        h = h.replace(/(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, body, c) => {
          if (!/PostalAddress/.test(body)) return m;
          try {
            const j = JSON.parse(body);
            const fix = (o) => { if (Array.isArray(o)) return o.forEach(fix); if (!o || typeof o !== 'object') return;
              if (o['@type'] === 'PostalAddress' && /Ibolya|Cesta na Senec|Solymár/.test(JSON.stringify(o))) { o.streetAddress = 'Cesta na Senec 2/A'; o.postalCode = '821 04'; o.addressLocality = 'Bratislava'; o.addressRegion = 'Bratislavský kraj'; o.addressCountry = 'SK'; }
              for (const v of Object.values(o)) if (v && typeof v === 'object') fix(v); };
            fix(j); return a + JSON.stringify(j) + c;
          } catch { return m; }
        });
      }
      // magyar elírás
      if (p === '/honositas-kalkulator/') h = h.replace(/2026 —az/g, '2026 — az');
    } catch (e) { console.log('[seo-fix post] ' + rel + ': ' + e.message); h = before; }
    if (h !== before) fs.writeFileSync(f, h);
  }
  // _redirects
  try {
    const rf = path.join(DIST, '_redirects'); let r = fs.existsSync(rf) ? fs.readFileSync(rf, 'utf8') : '';
    const have = new Set(r.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean));
    const lines = [];
    for (const [from, to] of redirects) {
      for (const src of [from, from.replace(/\/$/, '')]) if (src && !have.has(src)) { lines.push(`${src} ${to} 301`); have.add(src); }
    }
    if (lines.length) { r = r.replace(/\s*$/, '\n') + '# seo-fix: régi URL-ek (meta-refresh oldalak) → végleges 301\n' + lines.join('\n') + '\n'; fs.writeFileSync(rf, r); }
    console.log(`[seo-fix post] _redirects +${lines.length} sor`);
  } catch (e) { console.log('[seo-fix post] _redirects: ' + e.message); }
  // sitemapek
  for (const sm of ['sitemap.xml', 'sk/sitemap.xml', 'cs/sitemap.xml']) {
    try {
      const smf = path.join(DIST, sm); if (!fs.existsSync(smf)) continue;
      let x = fs.readFileSync(smf, 'utf8'); const n0 = (x.match(/<url>/g) || []).length;
      x = x.replace(/\s*<url><loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g, (m, u) => (dropFromSitemap.has(u) ? '' : m));
      fs.writeFileSync(smf, x); console.log(`[seo-fix post] ${sm}: ${n0} → ${(x.match(/<url>/g) || []).length} URL`);
    } catch (e) { console.log('[seo-fix post] ' + sm + ': ' + e.message); }
  }
  console.log('[seo-fix post] ' + JSON.stringify(st));
}

try { if (MODE === 'pre') pre(); else post(); }
catch (e) { console.log('[seo-fix] FIGYELEM - ' + (e && e.stack || e) + ' (a build megy tovabb)'); }
process.exit(0);
