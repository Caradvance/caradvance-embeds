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
  sameAs: ['https://www.facebook.com/caradvancehungary/', 'https://www.instagram.com/caradvance_hungary/', 'https://www.youtube.com/channel/UCbmogjjIDqVwFtFoA-h3jjw', 'https://www.hasznaltauto.hu/partner/bh_group_zrt-20676'],
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
  if (d.length <= 160) return d;
  const cut = d.slice(0, 160);
  const s = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), cut.lastIndexOf('。'));
  if (s >= 90) return cut.slice(0, s + 1).trim();
  const w = cut.lastIndexOf(' ');
  return (w > 100 ? cut.slice(0, w) : cut).replace(/[,;:–—\-\s]+$/, '') + '…';
}

/* ---- Bérlés: /autoink/#berelheto a fő bérlési oldal; modelloldalak Ft-ár, JSON-LD, kannibalizáció kezelése ---- */
const BRANDS2 = ['Mercedes-Benz', 'Mercedes-AMG', 'Land Rover', 'Alfa Romeo', 'Range Rover', 'Aston Martin'];
const brandOf = (n) => { const b = BRANDS2.find((x) => n.startsWith(x)); return b ? (b === 'Mercedes-AMG' ? 'Mercedes-Benz' : b) : n.split(' ')[0]; };
const ftNum = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10);
const ftFmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const keyOf = (slug) => slug.replace(/-berles$/, '').replace(/^mercedes-benz-/, 'mercedes-').replace(/^mercedes-amg-/, 'mercedes-amg-');
function rentalSeo() {
  const rd = (rel) => { const f = path.join(DIST, rel); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
  const wr = (rel, h) => fs.writeFileSync(path.join(DIST, rel), h);
  const dirOf = (d) => { try { return fs.readdirSync(path.join(DIST, d), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); } catch { return []; } };
  const cars = [];
  for (const slug of dirOf('berelheto-auto')) {
    const rel = `berelheto-auto/${slug}/index.html`; const h = rd(rel); if (!h) continue;
    const name = decode(((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim().replace(/ bérlés$/i, '');
    const desc = decode((h.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1] || '');
    const ft = ftNum((desc.match(/([\d   ]{3,})\s?Ft\/hó/) || [])[1] || '');
    if (!name || !ft) continue;
    const km = +((desc.match(/(\d{3,5})\s?km\/hó/) || [])[1] || 0), mo = +((desc.match(/(\d{1,2})\s?hónap/) || [])[1] || 0), dep = ftNum((desc.match(/kaució ([\d  ]+)\s?€/) || [])[1] || '');
    const img = (h.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) || [])[1] || '';
    cars.push({ slug, rel, name, brand: brandOf(name), ft, km, mo, dep, desc, img, url: `${SITE}/berelheto-auto/${slug}/`, key: keyOf(slug) });
  }
  if (!cars.length) { console.log('[seo-fix rental] nincs bérelhető modelloldal'); return; }
  const ujs = dirOf('uj-auto-berlese').map((slug) => ({ slug, rel: `uj-auto-berlese/${slug}/index.html` })).filter((u) => rd(u.rel));
  const match = (ujSlug) => cars.filter((c) => ujSlug === c.key || ujSlug.startsWith(c.key + '-')).sort((a, b) => b.key.length - a.key.length)[0];
  let nB = 0, nU = 0;
  // 1) bérelhető modelloldalak
  for (const c of cars) {
    let h = rd(c.rel);
    let t = `${c.name} bérlés ${ftFmt(c.ft)} Ft/hó-tól – tartós bérlet`;
    if (t.length > 60) t = `${c.name} bérlés ${ftFmt(c.ft)} Ft/hó-tól`;
    if (t.length > 60) t = `${c.name} bérlés – tartós bérlet`;
    h = h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escAttr(t).replace(/&quot;/g, '"')}</title>`)
      .replace(/(<meta[^>]+(?:property="og:title"|name="twitter:title")[^>]+content=")[^"]*(")/gi, `$1${escAttr(t)}$2`);
    const offer = { '@type': 'Offer', url: c.url, priceCurrency: 'HUF', price: c.ft, availability: 'https://schema.org/InStock', businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: c.ft, priceCurrency: 'HUF', unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } },
      seller: { '@id': SITE + '/#dealer' } };
    let hasCar = false, hasCrumb = false;
    h = h.replace(/(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a1, body, c1) => {
      let j; try { j = JSON.parse(body); } catch { return m; }
      if (j['@type'] === 'Product' && j.name === `${c.name} bérlés`) return '';            // korábbi saját Product → a Car kapja az ajánlatot
      if (j['@type'] === 'Car' || j['@type'] === 'Vehicle') { hasCar = true; j.url = c.url; j.offers = offer; if (!j.image && c.img) j.image = c.img; return a1 + JSON.stringify(j) + c1; }
      if (j['@type'] === 'BreadcrumbList') {
        if (hasCrumb) return '';                                                              // dupla morzsamenü ki
        hasCrumb = true;
        j.itemListElement = [['Főoldal', '/'], ['Bérelhető autóink', '/autoink/'], [`${c.name} bérlés`, `/berelheto-auto/${c.slug}/`]].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + u }));
        return a1 + JSON.stringify(j) + c1;
      }
      return m;
    });
    if (!hasCar) h = addLd(h, { '@context': 'https://schema.org', '@type': 'Product', name: `${c.name} bérlés`, description: c.desc, brand: { '@type': 'Brand', name: c.brand }, url: c.url, ...(c.img ? { image: c.img } : {}), offers: offer });
    if (!hasCrumb) h = addLd(h, crumbs([['Főoldal', '/'], ['Bérelhető autóink', '/autoink/'], [`${c.name} bérlés`, `/berelheto-auto/${c.slug}/`]]));
    // kereszt-link az új autós (rendelésre) oldalra, ha van ilyen modell
    const u = ujs.find((x) => match(x.slug) === c);
    if (u && !/data-ca-xlink/.test(h)) {
      const un = decode(((rd(u.rel).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() || c.name;
      h = h.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/i, `$1<p data-ca-xlink style="display:inline-block;margin:12px 0 0;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.14);font-size:13.5px;line-height:1.3">Inkább vadonatúj autót szeretnél? <a style="color:inherit;font-weight:800;text-decoration:underline" href="/uj-auto-berlese/${u.slug}/">Új ${escAttr(un)} tartós bérlet rendelésre →</a></p>`);
    }
    wr(c.rel, h); nB++;
  }
  // 2) új autós (rendelésre) modelloldalak: más kulcsszó + link a bérelhető oldalra
  for (const u of ujs) {
    const c = match(u.slug); if (!c) continue;
    let h = rd(u.rel);
    const name = decode(((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() || c.name;
    let t = `Új ${name} tartós bérlet – vadonatúj autó rendelésre`;
    if (t.length > 60) t = `Új ${name} tartós bérlet rendelésre`;
    h = h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escAttr(t).replace(/&quot;/g, '"')}</title>`)
      .replace(/(<meta[^>]+(?:property="og:title"|name="twitter:title")[^>]+content=")[^"]*(")/gi, `$1${escAttr(t)}$2`);
    if (!/data-ca-xlink/.test(h)) h = h.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/i, `$1<p data-ca-xlink style="display:inline-block;margin:12px 0 0;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.14);font-size:13.5px;line-height:1.3">Azonnal elérhető autó kell? <a style="color:inherit;font-weight:800;text-decoration:underline" href="/berelheto-auto/${c.slug}/">${escAttr(c.name)} bérlés ${ftFmt(c.ft)} Ft/hó-tól →</a></p>`);
    wr(u.rel, h); nU++;
  }
  // 3) /autoink/ — a fő bérlési (és vásárlási) gyűjtőoldal
  const ar = 'autoink/index.html'; let a = rd(ar);
  if (a) {
    const min = (k) => Math.min(...cars.map((c) => c[k]).filter(Boolean)), max = (k) => Math.max(...cars.map((c) => c[k]).filter(Boolean));
    const t = 'Eladó és bérelhető prémium autók – tartós bérlet | CarAdvance';
    const d = `Eladó és bérelhető prémium autók Németországból: BMW, Mercedes-Benz, Audi, MINI és más márkák. Tartós bérlet ${ftFmt(min('ft'))} Ft/hó-tól, átlátható kaucióval.`;
    a = a.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escAttr(t)}</title>`)
      .replace(/(<meta[^>]+(?:property="og:title"|name="twitter:title")[^>]+content=")[^"]*(")/gi, `$1${escAttr(t)}$2`)
      .replace(/(<meta[^>]+(?:name="description"|property="og:description"|name="twitter:description")[^>]+content=")[^"]*(")/gi, `$1${escAttr(d)}$2`);
    const byBrand = {}; for (const c of [...cars].sort((x, y) => x.name.localeCompare(y.name, 'hu'))) (byBrand[c.brand] = byBrand[c.brand] || []).push(c);
    const faq = [
      ['Mennyibe kerül egy autó tartós bérlete?', `A havidíj modelltől függ: bérelhető autóink ${ftFmt(min('ft'))} Ft/hó-tól ${ftFmt(max('ft'))} Ft/hó-ig érhetők el. A pontos díjat minden modell oldalán megtalálod.`],
      ['Milyen hosszú a bérleti idő és mekkora a futáskeret?', `A minimális bérleti idő ${min('mo') === max('mo') ? min('mo') : 'modelltől függően ' + min('mo') + '–' + max('mo')} hónap, a havi futáskeret ${min('km') === max('km') ? ftFmt(min('km')) : ftFmt(min('km')) + '–' + ftFmt(max('km'))} km.`],
      ['Mekkora kauciót kell fizetni?', `A kaució modelltől függően ${ftFmt(min('dep'))} €-tól indul; az összeget minden autó oldalán feltüntetjük.`],
      ['Hogyan bérelhetek autót a CarAdvance-től?', 'Válaszd ki az autót, küldd el az ajánlatkérést az oldalon, vagy hívj minket: +36 30 233 6060. Munkatársunk egyeztet veled a részletekről és az átadásról.'],
    ];
    const RS_CSS = `.ca-rent-seo{padding:48px 0 24px;font-family:inherit;max-width:900px}
.ca-rent-seo .rs-eye{display:inline-block;color:#E2001A;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.ca-rent-seo h2{font-size:36px;font-weight:800;letter-spacing:-.02em;line-height:1.15;color:#0B0B0D;margin:8px 0 12px}
.ca-rent-seo .rs-lead{color:#5A6B82;font-size:15.5px;line-height:1.65;margin:0 0 22px}
.ca-rent-seo .rs-models>summary{font-size:16px}
.ca-rent-seo .rs-cols{columns:3 250px;column-gap:14px;padding-top:4px}
.ca-rent-seo .rs-brand{break-inside:avoid;display:block;margin:0 0 14px;background:#F7F8FA;border:1px solid #E6EAF1;border-radius:12px;padding:12px 14px 6px}
.ca-rent-seo .rs-brand h4{margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#E2001A}
.ca-rent-seo .rs-brand .rs-r{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:7px 0;border-top:1px solid #E9ECF2}
.ca-rent-seo .rs-brand h4+.rs-r{border-top:0}
.ca-rent-seo .rs-brand .rs-r>a{color:#141519!important;text-decoration:none;font-size:14px;font-weight:600;line-height:1.3}
.ca-rent-seo .rs-brand .rs-r>a:hover{color:#E2001A!important}
.ca-rent-seo .rs-brand .rs-pr{display:inline-flex;align-items:center;gap:7px;color:#5A6B82;font-weight:700;font-size:13px;white-space:nowrap}
.ca-rent-seo .sub-tip{white-space:normal!important}
.ca-rent-seo .sub-tip,.ca-rent-seo .sub-tip *{color:#fff!important}
.ca-rent-seo .sub-tip a{color:#8fc7ff!important;text-decoration:underline}
.ca-rent-seo .rs-models,.ca-rent-seo .rs-models>div{overflow:visible!important}
.ca-rent-seo .rs-faq{margin-top:44px}
.ca-rent-seo .rs-faq h2{margin-bottom:20px}
.ca-rent-seo .rs-more{color:#5A6B82;font-size:15px;margin:18px 0 0}
.ca-rent-seo .rs-more a{color:#E2001A;font-weight:700}
@media(max-width:640px){.ca-rent-seo{padding-top:36px}.ca-rent-seo h2{font-size:27px}}`;
    const PREF = ['BMW', 'Mercedes-Benz', 'Audi', 'MINI', 'Volkswagen'];
    const leadBrands = [...PREF.filter((b) => byBrand[b]), ...Object.keys(byBrand).filter((b) => !PREF.includes(b))].slice(0, 5);
    const short = (c) => c.name.startsWith(c.brand + ' ') ? c.name.slice(c.brand.length + 1) : c.name;
    const block = `\n<section class="ca-rent-seo"><style>${RS_CSS}</style>
<span class="rs-eye">Bérlés</span>
<h2>Autóbérlés és tartós bérlet</h2>
<p class="rs-lead">Tartós bérlet Németországból: ${leadBrands.join(', ')} és más márkák, ${ftFmt(min('ft'))} Ft/hó-tól, átlátható futáskerettel és kaucióval.</p>
<details class="rs-models"><summary>Összes bérelhető modell (${cars.length})</summary><div class="rs-cols">
${Object.entries(byBrand).map(([b, cs]) => `<div class="rs-brand"><h4>${escAttr(b)}</h4>${cs.map((c) => { const tip = `A feltüntetett ár nettó havidíj: ${ftFmt(c.ft)} Ft/hó${c.mo || c.km ? ` (${[c.mo ? `${c.mo} hónapos futamidő` : '', c.km ? `${ftFmt(c.km)} km/hó futáskeret` : ''].filter(Boolean).join(', ')})` : ''}; a forintár tájékoztató jellegű, napi árfolyammal számolva.${c.dep ? ` A kaució (${ftFmt(c.dep)} €-tól) a bérlés végén hiánytalanul visszajár, amennyiben nincs sérülés, közlekedési bírság vagy egyéb, a bérlőnek felróható levonás.` : ''}`; return `<div class="rs-r"><a href="/berelheto-auto/${c.slug}/" title="${escAttr(c.name)} bérlés">${escAttr(short(c)).replace(/-/g, '‑')}</a><span class="rs-pr">${ftFmt(c.ft).replace(/ /g, ' ')} Ft/hó<span class="sub-info" tabindex="0">i<span class="sub-tip">${escAttr(tip)} <a href="/berlesi-folyamat/" target="_blank" rel="noopener">Így működik a bérlési folyamat →</a></span></span></span></div>`; }).join('')}</div>`).join('\n')}
</div></details>
<div class="rs-faq"><span class="rs-eye">GYIK</span>
<h2>Gyakori kérdések a bérlésről</h2>
${faq.map(([q, aa]) => `<details><summary>${escAttr(q)}</summary><p>${escAttr(aa)}</p></details>`).join('\n')}
<p class="rs-more">Vadonatúj autót szeretnél rendelésre? Nézd meg <a href="/uj-auto-berlese/">új autó tartós bérlet ajánlatainkat</a>.</p>
</div>
</section>\n`;
    if (!/class="ca-rent-seo"/.test(a)) a = a.replace(/(<\/div>\s*)(<div class="autok-panel" id="panel-premium")/, block + '$1$2');
    // egységes GYIK-stílus (ugyanaz, mint a többi oldalon — a seo-faq.mjs stíluslapja)
    if (!/id="ca-faq-unify"/.test(a)) {
      try { const css = (fs.readFileSync('seo-faq.mjs', 'utf8').match(/const CSS = `([\s\S]*?)`\.trim\(\)/) || [])[1]; if (css) a = a.replace(/<\/head>/i, `<style id="ca-faq-unify">${css.trim()}</style>\n</head>`); } catch {}
    }
    if (!/"@type":"OfferCatalog"/.test(a)) {
      a = addLd(a, { '@context': 'https://schema.org', '@type': 'OfferCatalog', name: 'Bérelhető autóink – prémium autóbérlés és tartós bérlet', url: SITE + '/autoink/#berelheto', provider: { '@id': SITE + '/#dealer' },
        itemListElement: cars.map((c, i) => ({ '@type': 'Offer', position: i + 1, url: c.url, priceCurrency: 'HUF', price: c.ft, businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
          priceSpecification: { '@type': 'UnitPriceSpecification', price: c.ft, priceCurrency: 'HUF', unitCode: 'MON' }, itemOffered: { '@type': 'Product', name: `${c.name} bérlés`, brand: { '@type': 'Brand', name: c.brand }, url: c.url } })) });
      a = addLd(a, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, aa]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: aa } })) });
    }
    wr(ar, a);
  }
  console.log(`[seo-fix rental] bérelhető modelloldal: ${nB}, új autós oldal kereszt-linkkel: ${nU}, /autoink/ gyűjtőoldal: ${a ? 'kész' : 'nincs'}`);
}
/* Ahrefs-audit javítások (2026-10-06) */
// belső linkek, amelyek 404-re mutattak → létező oldal (minden nyelvi előtaggal) + 301
const LINKFIX = {
  '/auto/volkswagen-golf-gti-clubsport-s-abt-370ps-19-1of400/': '/auto/volkswagen-golf-gti-clubsport-s-007-von-400-abt-370ps/',
  '/berelheto-auto/audi-q6-e-tron-berles/': '/berelheto-auto/audi-q6-sportback-berles/',
};
// külső linkek, amelyek átirányítanak → végleges cím
const EXTFIX = [
  [/https:\/\/www\.facebook\.com\/share\/19BfQsJxSk\/?/g, 'https://www.facebook.com/caradvancehungary/'],
  [/https:\/\/www\.instagram\.com\/caradvance_hungary(?=["'?#\\])/g, 'https://www.instagram.com/caradvance_hungary/'],
];
// magyar oldalak kézzel rövidített címei (≤60 karakter)
const HU_TITLES = {
  '/': 'Prémium autók Németországból – bérlés, import | CarAdvance',
  '/blog/': 'CarAdvance Magazin – autós útmutatók, lízing, import',
  '/miert-mi/': 'Miért a CarAdvance? Autókereskedés német háttérrel',
  '/referenciak/': 'Referenciák – vélemények, eladott és importált autóink',
  '/beszerzesi-folyamat/': 'Autóbehozatal Németországból lépésről lépésre',
  '/blog/eredetisegvizsgalat/': 'Eredetiségvizsgálat 2026 – ára, menete, érvényessége',
  '/blog/hosszu-tavu-autoberles/': 'Hosszú távú autóbérlés – kinek éri meg, mennyibe kerül?',
  '/blog/regisztracios-ado-2026/': 'Regisztrációs adó 2026 – számítás, táblázat, példák',
  '/blog/bmw-x5-vasarlas-behozatal/': 'BMW X5 behozatal Németországból – árak, folyamat',
  '/blog/bizomanyos-auto-ertekesites/': 'Bizományos autóértékesítés – add el gyorsan, jó áron',
  '/blog/nemet-hasznaltauto-vasarlas/': 'Német használtautó vásárlás – kiválasztás, ellenőrzés',
  '/blog/auto-lizing-maganszemelykent/': 'Autó lízing magánszemélyként 2026 – feltételek, kalkulátor',
  '/blog/auto-behozatal-nemetorszagbol/': 'Autó behozatal Németországból – költségek és folyamat',
  '/blog/autoberles-budapest-kulfoldre/': 'Autóbérlés Budapesten és külföldre – teljes útmutató',
  '/blog/hasznalt-auto-lizing-feltetelei/': 'Használt autó lízing feltételei – mire figyelj?',
  '/blog/elektromos-auto-lizing-tamogatas/': 'Elektromos autó lízing és támogatás 2026 – tudnivalók',
  '/blog/mercedes-behozatal-nemetorszagbol/': 'Mercedes behozatal Németországból – E-osztály, Sprinter',
  '/blog/ceges-auto-operativ-lizing-tartos-berlet/': 'Céges autó: operatív lízing vagy tartós bérlet?',
};
const HU_TAIL = [
  [/ — tartós autóbérlet havidíjjal$/, ' — tartós bérlet'],
  [/ — ár kérésre, rendelés Németországból$/, ' — rendelés Németországból'],
  [/ bérlés — tartós bérlet (\S+ €\/hó-tól)$/, ' bérlés — $1'],
];
const TMAX = 60;
function shortTitle(t, lang) {
  if (t.length <= TMAX) return t;
  let s = t.replace(/\s*[|—–-]\s*CarAdvance\s*$/, '');
  if (lang === 'hu') for (const [re, to] of HU_TAIL) if (s.length > TMAX) s = s.replace(re, to);
  if (s.length <= TMAX) return s;
  // vágás az utolsó elválasztónál (— – | :), ha az eleje legalább 25 karakter
  const seps = [' — ', ' – ', ' | ', ': '];
  let best = -1;
  for (const sp of seps) { let i = s.lastIndexOf(sp, TMAX); while (i > TMAX) i = s.lastIndexOf(sp, i - 1); if (i >= 25 && i > best) best = i; }
  if (best > 0) return s.slice(0, best).trim();
  // szóhatár
  let w = s.slice(0, TMAX + 1).lastIndexOf(' ');
  let out = (w > 30 ? s.slice(0, w) : s.slice(0, TMAX)).replace(/[\s,;:–—\-/|&(+]+$/, '');
  out = out.replace(/\s+(és|a|az|with|and|the|for|mit|und|für|de|et|la|le|des|і|та|з|для)$/i, '');
  return out;
}
const DSUF = {
  hu: [' Kérj ajánlatot: +36 30 233 6060.', ' Prémium autók Németországból – CarAdvance.'],
  en: [' Get a quote: +36 30 233 6060.', ' Premium cars from Germany – CarAdvance.'],
  de: [' Angebot anfordern: +36 30 233 6060.', ' Premium-Autos aus Deutschland – CarAdvance.'],
  fr: [' Demandez un devis : +36 30 233 6060.', ' Voitures premium d’Allemagne – CarAdvance.'],
  uk: [' Отримайте пропозицію: +36 30 233 6060.', ' Преміум-авто з Німеччини – CarAdvance.'],
};
function padDesc(d, lang) {
  const suf = DSUF[lang]; if (!suf || d.length >= 110) return d;
  let out = d.trim(); if (!/[.!?…]$/.test(out)) out += '.';
  for (const x of suf) { if (out.length >= 110) break; if (out.length + x.length <= 160 && !out.includes(x.trim())) out += x; }
  return out;
}
function altFor(tagStart, html, idx, pageH1) {
  // a képet tartalmazó kártya/link címe
  const win = html.slice(idx, idx + 1600);
  const m = win.match(/<(h[2-4])[^>]*>([\s\S]*?)<\/\1>/i);
  if (m) { const t = decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); if (t && t.length < 120) return t; }
  return '';
}
function post() {
  try { rentalSeo(); } catch (e) { console.log('[seo-fix rental] ' + e.message); }
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
      const lang = (p.match(/^\/(en|de|fr|uk|zh|sk|cs|pl)\//) || [, 'hu'])[1];
      let nt = (lang === 'hu' && HU_TITLES[p]) || shortTitle(title, lang);
      if (title && nt !== title) {
        const oldT = title;
        h = h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escAttr(nt).replace(/&quot;/g, '"')}</title>`);
        h = h.replace(/(<meta[^>]+(?:property="og:title"|name="twitter:title")[^>]+content=")([^"]*)(")/gi, (m, a, v, c) => (decode(v).replace(/\s+/g, ' ').trim() === oldT ? a + escAttr(nt) + c : m));
        title = nt; st.title++;
      }
      // description
      const dm = h.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
      let desc = dm ? decode(dm[1]) : '';
      let nd0 = desc.length > 160 ? trimDesc(desc) : padDesc(desc, lang);
      if (desc && nd0 !== desc) {
        const nd = nd0;
        h = h.replace(/(<meta[^>]+(?:name="description"|property="og:description"|name="twitter:description")[^>]+content=")([^"]*)(")/gi, (m, a, v, c) => (decode(v) === desc ? a + escAttr(nd) + c : m));
        desc = nd; st.desc++;
      }
      // hibás belső linkek + átirányító külső linkek
      for (const [from, to] of Object.entries(LINKFIX)) {
        const f0 = from.replace(/\/$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('href="(https://www\\.caradvance\\.hu)?(/(?:en|de|fr|uk|zh|sk|cs|pl))?' + f0 + '/?(?=["#?])', 'g');
        h = h.replace(re, (m, host, lp) => { st.link = (st.link || 0) + 1; return 'href="' + (host || '') + (lp || '') + to.replace(/\/$/, '') + '/'; });
      }
      for (const [re, to] of EXTFIX) h = h.replace(re, () => { st.ext = (st.ext || 0) + 1; return to; });
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
  for (const [from, to] of Object.entries(LINKFIX)) for (const lp of ['', '/en', '/de', '/fr', '/uk', '/zh', '/sk', '/cs']) redirects.push([lp + from, lp + to]);
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
