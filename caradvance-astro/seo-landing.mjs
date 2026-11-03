#!/usr/bin/env node
/**
 * seo-landing.mjs — márka- és témaoldalak a tartós bérlethez (Marc, 2026-11-03; SEO-audit)
 *
 * A seo-final.mjs után fut, a kész dist-en. Csak magyarul (caradvance.hu), a nyelvi tükrökön nincs megfelelőjük,
 * ezért nincs hreflang-klaszterük, és nem kerülnek a .sk/.cz/.pl/.ch/.eu oldalakra.
 *   /bmw-berles/  /mercedes-berles/  /audi-berles/  /mini-berles/  /volkswagen-berles/  /elektromos-auto-berles/
 * Minden szám a bérlési modelloldalakról (dist/berelheto-auto/…) jön, a napi Choice-szinkron adataiból:
 * havidíj (Ft, nettó), kaució, karosszéria, üzemanyag, fotó. Keret: a /tartos-berlet/ oldal (fejléc, menü, lábléc,
 * stílusok). Ár nélküli változat a dist/_np/ alá (külföldi látogatóknak, a middleware szolgálja ki).
 * A /tartos-berlet/ márkakártyái ezekre az oldalakra mutatnak. A sitemapba felkerülnek. Hibára exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.caradvance.hu';
const TODAY = new Date().toISOString().slice(0, 10);

const unesc = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (m, e) => {
  const k = e.toLowerCase(); if (k === 'amp') return '&'; if (k === 'quot') return '"'; if (k === 'apos') return "'"; if (k === 'lt') return '<'; if (k === 'gt') return '>'; if (k === 'nbsp') return '\u00a0';
  return String.fromCodePoint(k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
});
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
const num = (s) => +String(s).replace(/[^\d]/g, '');

// ---- adatok a bérlési modelloldalakról ----
function cars() {
  const dir = path.join(DIST, 'berelheto-auto'); const out = [];
  let ds = []; try { ds = fs.readdirSync(dir); } catch (e) { return out; }
  for (const d of ds) {
    if (!d.endsWith('-berles')) continue;
    const f = path.join(dir, d, 'index.html'); if (!fs.existsSync(f)) continue;
    const h = fs.readFileSync(f, 'utf8'); if (h.length < 8000 || /http-equiv=["']?refresh/i.test(h)) continue;
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(h)) continue;
    let car = null;
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { const j = JSON.parse(m[1]); for (const x of [].concat(j['@graph'] || j)) if (x && x['@type'] === 'Car') car = x; } catch (e) { }
    }
    const desc = unesc((h.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '');
    const ft = num((desc.match(/(\d[\d\s\u00a0]{2,})\s?Ft\/hó/) || [])[1] || '');
    if (!car || !ft) continue;
    const dep = num((desc.match(/kaució (\d[\d\s\u00a0]*)\s?€/) || [])[1] || '') || null;
    const img = [].concat(car.image || [])[0] || (h.match(/<meta property="og:image" content="([^"]+)"/i) || [])[1] || '';
    out.push({
      slug: d, url: `/berelheto-auto/${d}/`, name: unesc(car.name || ''), brand: unesc((car.brand && car.brand.name) || ''),
      body: unesc(car.bodyType || ''), fuel: unesc(String(car.fuelType || '')), ft, dep, img: String(img).replace(SITE, ''),
    });
  }
  return out.sort((a, b) => a.ft - b.ft || a.name.localeCompare(b.name, 'hu'));
}

const PAGES = [
  { slug: 'bmw-berles', brand: 'BMW', label: 'BMW', match: (c) => c.brand === 'BMW', marka: 'bmw' },
  { slug: 'mercedes-berles', brand: 'Mercedes-Benz', label: 'Mercedes', match: (c) => /^Mercedes/.test(c.brand), marka: 'mercedes' },
  { slug: 'audi-berles', brand: 'Audi', label: 'Audi', match: (c) => c.brand === 'Audi', marka: 'audi' },
  { slug: 'mini-berles', brand: 'MINI', label: 'MINI', match: (c) => c.brand === 'MINI', marka: 'mini' },
  { slug: 'volkswagen-berles', brand: 'Volkswagen', label: 'Volkswagen', match: (c) => /^(Volkswagen|VW)$/.test(c.brand), marka: 'volkswagen' },
  { slug: 'elektromos-auto-berles', ev: true, label: 'elektromos autó', match: (c) => /Elektromos/i.test(c.fuel) && !/Benzin|Dízel|Diesel/i.test(c.fuel) },
];
const short = (c) => (c.name.startsWith(c.brand + ' ') ? c.name.slice(c.brand.length + 1) : c.name);
const fuelHu = (f) => f.split(/,\s*|\s*\/\s*/).map((x) => x.toLowerCase()).join(', ');

function content(P, list, np) {
  const min = list[0].ft, max = list[list.length - 1].ft;
  const deps = list.map((c) => c.dep).filter(Boolean); const dep = deps.length ? Math.min(...deps) : 2000;
  const n = list.length, cheap = list[0];
  const names = list.slice(0, 5).map((c) => (P.ev ? c.name : short(c)));
  const ttlBase = P.ev ? 'Elektromos autó bérlés' : `${P.label} bérlés`;
  let title = np ? `${ttlBase} – tartós bérlet 6 hónaptól | CarAdvance` : `${ttlBase} – tartós bérlet ${fmt(min)} Ft/hó-tól | CarAdvance`;
  if (title.length > 62) title = title.replace(' | CarAdvance', '');
  const what = P.ev ? 'új elektromos autó' : `új ${P.label} modell`;
  const desc = np
    ? `${ttlBase} tartós bérletben: ${n} ${what}, legalább 6 hónapra, casco, szerviz, adó és gumi a havidíjban, egyszeri visszajáró kaucióval.`
    : `${ttlBase} tartós bérletben: ${n} ${what} ${fmt(min)} Ft/hó-tól (nettó), 6 hónaptól. Casco, szerviz, adó és gumi a havidíjban, kaució ${fmt(dep)} €-tól.`;
  const h1 = P.ev ? 'Elektromos autó bérlés — <span class="accent">új villanyautó tartós bérletben</span>' : `${esc(P.label)} bérlés — <span class="accent">új ${esc(P.label)} tartós bérletben</span>`;
  const sub = np
    ? `${n} bérelhető ${P.ev ? 'elektromos modell' : esc(P.label) + ' modell'}, legalább 6 hónapra. Egy fix havidíj, amelyben a casco, a szerviz, az adó és a nyári-téli gumi is benne van.`
    : `${n} bérelhető ${P.ev ? 'elektromos modell' : esc(P.label) + ' modell'} ${fmt(min)} Ft/hó-tól (nettó), legalább 6 hónapra. Egy fix havidíj, amelyben a casco, a szerviz, az adó és a nyári-téli gumi is benne van.`;
  const chips = [`${n} modell`, np ? '6 hónaptól' : `${fmt(min)} Ft/hó-tól`, `kaució ${fmt(dep)} €-tól`, np ? 'casco + szerviz' : '6 hónaptól'];
  const listUrl = P.marka ? `/autoink/?marka=${P.marka}#berelheto` : '/autoink/#berelheto';
  const intro = P.ev
    ? `Az elektromos autó bérlés tartós bérletben a legkisebb kockázatú módja annak, hogy villanyautóra válts: nem kell aggódnod az akkumulátor öregedése, a gyorsan fejlődő technológia vagy a használt elektromos autók árának esése miatt — a bérlet végén egyszerűen visszaadod az autót. Jelenleg ${n} elektromos modell bérelhető, többek között: ${esc(names.join(', '))}.`
    : `A ${esc(P.label)} bérlés nálunk tartós bérletet jelent: vadonatúj, 0 km-es ${esc(P.label)} legalább 6 hónapra, egyetlen havidíjért. Nem kell megvenned, nem kell lízingszerződést kötnöd és önerőt fizetned — a havidíj fedezi a használatot, a szervizt, az adót, a biztosítást és a gumikat. Jelenleg ${n} ${esc(P.label)} modell bérelhető, többek között: ${esc(names.join(', '))}.`;
  const why = P.ev
    ? `<p>A havidíjban benne van a szerviz, a gépjárműadó, a casco és a nyári-téli gumi; neked csak a töltés költsége marad, ami otthoni töltéssel jellemzően töredéke a benzinnek. Az aktuális töltési árakat a <a href="/blog/elektromos-auto-toltes-ara-2026/">2026-os töltési árak</a> cikkben gyűjtöttük össze.</p>`
    : `<p>Cégeknek a nettó havidíj előre tervezhető, nincs lekötött tőke és értékvesztési kockázat; magánszemélyeknek nincs hitelbírálat és önerő, csak egy visszajáró kaució. A futamidő után hosszabbíthatsz, visszaadod az autót, vagy újabb modellre váltasz.</p>`;
  const cards = list.map((c) => `<a class="lp-card" href="${c.url}"><span class="lp-img">${c.img ? `<img src="${esc(c.img)}" alt="${esc(c.name)} bérlés" loading="lazy" width="490" height="260">` : ''}</span><span class="lp-body"><strong>${esc(c.name)}</strong><span class="lp-meta">${esc([c.body, fuelHu(c.fuel)].filter(Boolean).join(' · '))}</span>${np ? '<span class="lp-price">Részletek →</span>' : `<span class="lp-price">${fmt(c.ft)} Ft/hó-tól <small>nettó</small></span>`}</span></a>`).join('\n');
  const rows = list.map((c) => `<tr><td><a href="${c.url}">${esc(c.name)}</a></td><td>${esc(c.body)}</td><td>${esc(fuelHu(c.fuel))}</td>${np ? '' : `<td>${fmt(c.ft)} Ft</td>`}<td>${c.dep ? fmt(c.dep) + ' €' : '–'}</td></tr>`).join('\n');
  const faq = [
    np ? [`Mennyibe kerül ${P.ev ? 'egy elektromos autó' : 'egy ' + P.label} bérlése?`, 'A havidíj a modelltől, a változattól és a futáskerettől függ; minden modell oldalán megtalálod, vagy kérj díjmentes ajánlatot.']
       : [`Mennyibe kerül ${P.ev ? 'egy elektromos autó' : 'egy ' + P.label} bérlése?`, `A havidíj jelenleg ${fmt(min)} Ft-tól ${fmt(max)} Ft-ig terjed (nettó), modelltől függően; a legkedvezőbb a ${cheap.name}. Magánszemélyként a díj 19% német áfával nő.`],
    ['Mennyi a minimális futamidő?', 'Legalább 6 hónap. Utána 30 napos felmondással hosszabbíthatsz, visszaadhatod az autót, vagy újabb modellre válthatsz.'],
    ['Mekkora a havi futáskeret?', 'A havidíj havi 2 000 km-re szól; autótól függően 3 000 km (+250 €/hó) vagy 4 000 km (+500 €/hó, nettó) is választható.'],
    ['Mi van benne a havidíjban?', 'Casco és kötelező biztosítás, szerviz és karbantartás, gépjárműadó, nyári és téli gumi a cserével együtt. Csak az üzemanyag vagy a töltés, az útdíjak és a parkolás a tiéd.'],
    ['Mekkora a kaució?', `Egyszeri, modelltől függően ${fmt(dep)} €-tól; a bérlet végén visszajár.`],
    ['Cégként és magánszemélyként is bérelhetek?', 'Igen. Cégeknek nettó havidíjjal, magánszemélyeknek 19% német áfával számolunk; az autó a Caradvance GmbH nevén, német rendszámmal fut.'],
  ];
  const others = PAGES.filter((x) => x.slug !== P.slug).map((x) => `<a href="/${x.slug}/">${x.ev ? 'Elektromos autó bérlés' : esc(x.label) + ' bérlés'}</a>`).join(' · ');
  const main = `<main>
<style id="ca-lp-css">.lp-hero{background:#0B0B0D;color:#fff;padding:64px 0 44px}.lp-hero h1{font-size:40px;line-height:1.12;font-weight:800;letter-spacing:-.02em;margin:10px 0 14px;max-width:860px}.lp-hero .accent{color:#E2001A;display:block}.lp-hero p{color:#c9ccd3;font-size:17px;line-height:1.6;max-width:760px;margin:0 0 18px}.lp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}.lp-chips span{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 12px;font-size:13.5px;font-weight:600}.lp-cta{display:flex;flex-wrap:wrap;gap:10px}.lp-cta a{display:inline-block;padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none}.lp-cta .p{background:#E2001A;color:#fff}.lp-cta .w{background:#fff;color:#0B0B0D}.lp-wrap{max-width:1180px;margin:0 auto;padding:0 20px}.lp-sec{padding:44px 0}.lp-sec h2{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:6px 0 14px;color:#0B0B0D}.lp-eye{color:#E2001A;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.lp-sec p{color:#3d4656;font-size:16px;line-height:1.7;max-width:880px}.lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;margin-top:18px}.lp-card{display:flex;flex-direction:column;border:1px solid #E6EAF1;border-radius:14px;overflow:hidden;text-decoration:none;color:#141519;background:#fff;transition:box-shadow .15s}.lp-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.08)}.lp-img{display:block;background:#fff;aspect-ratio:980/520}.lp-img img{width:100%;height:100%;object-fit:contain;display:block}.lp-body{display:flex;flex-direction:column;gap:4px;padding:12px 14px 14px}.lp-body strong{font-size:16px}.lp-meta{color:#5A6B82;font-size:13px}.lp-price{color:#E2001A;font-weight:800;font-size:15px;margin-top:4px}.lp-price small{color:#5A6B82;font-weight:600}.lp-tbl{width:100%;border-collapse:collapse;margin-top:12px;font-size:14.5px}.lp-tbl th,.lp-tbl td{text-align:left;padding:9px 10px;border-bottom:1px solid #E9ECF2}.lp-tbl th{color:#5A6B82;font-size:12.5px;text-transform:uppercase;letter-spacing:.04em}.lp-tbl a{color:#141519;font-weight:600}.lp-faq details{border:1px solid #E6EAF1;border-radius:12px;padding:12px 16px;margin:0 0 10px;background:#fff}.lp-faq summary{cursor:pointer;font-weight:700;color:#141519}.lp-faq details p{margin:10px 0 0}.lp-links{color:#5A6B82;font-size:15px;line-height:1.9}.lp-links a{color:#E2001A;font-weight:700}.lp-crumb{font-size:13px;color:#8a93a3;margin:0 0 6px}.lp-crumb a{color:#c9ccd3}.lp-scroll{overflow-x:auto}@media(max-width:640px){.lp-hero h1{font-size:30px}.lp-sec h2{font-size:24px}}</style>
<section class="lp-hero"><div class="lp-wrap">
<nav class="lp-crumb"><a href="/">Főoldal</a> › <a href="/tartos-berlet/">Tartós bérlet</a> › ${P.ev ? 'Elektromos autó bérlés' : esc(P.label) + ' bérlés'}</nav>
<h1>${h1}</h1>
<p>${sub}</p>
<div class="lp-chips">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
<div class="lp-cta"><a class="p" href="${listUrl}">${P.ev ? 'Elektromos autóink fotókkal →' : 'Bérelhető ' + esc(P.label) + ' autóink →'}</a><a class="w" href="/tartos-berlet/#kalkulator">Költség kalkulátor</a></div>
</div></section>
<section class="lp-sec"><div class="lp-wrap">
<span class="lp-eye">${P.ev ? 'Elektromos autók' : esc(P.label)} · tartós bérlet</span>
<h2>${P.ev ? 'Bérelhető elektromos autók' : 'Bérelhető ' + esc(P.label) + ' modellek'}</h2>
<p>${intro}</p>
<div class="lp-grid">
${cards}
</div>
</div></section>
<section class="lp-sec" style="background:#F7F8FA"><div class="lp-wrap">
<span class="lp-eye">Havidíj</span>
<h2>Mi van benne a havidíjban?</h2>
<p>Új, 0 km-es autó, casco és kötelező biztosítás, szerviz és karbantartás, gépjárműadó, nyári és téli gumi a szezonális cserével, német rendszám. A havidíj havi 2 000 km futáskeretre szól; autótól függően 3 000 km (+250 €) vagy 4 000 km (+500 €) is választható. Neked csak az üzemanyag vagy a töltés marad.</p>
${why}
</div></section>
<section class="lp-sec"><div class="lp-wrap">
<span class="lp-eye">Árak</span>
<h2>${P.ev ? 'Elektromos autó bérlés árak' : esc(P.label) + ' bérlés árak'}</h2>
<div class="lp-scroll"><table class="lp-tbl"><thead><tr><th>Modell</th><th>Kategória</th><th>Üzemanyag</th>${np ? '' : '<th>Havidíj (nettó)</th>'}<th>Kaució</th></tr></thead><tbody>
${rows}
</tbody></table></div>
<p style="font-size:13.5px;color:#5A6B82">${np ? 'Legalább 6 hónapos futamidőre; a pontos díj a változattól, színtől és futáskerettől függ.' : 'Nettó, -tól árak, legalább 6 hónapos futamidőre, havi 2 000 km futáskerettel; a forintár a napi euróárfolyamtól, a pontos díj a változattól, színtől és csomagtól függ. Magánszemélyként 19% német áfával.'}</p>
</div></section>
<section class="lp-sec lp-faq" style="background:#F7F8FA"><div class="lp-wrap">
<span class="lp-eye">GYIK</span>
<h2>Gyakori kérdések</h2>
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
<p class="lp-links">Tovább: <a href="/tartos-berlet/">Tartós bérlet — minden modell</a> · <a href="/berlesi-folyamat/">Bérlési folyamat</a> · <a href="/berlesi-feltetelek/">Feltételek és kaució</a><br>Más márkák: ${others}</p>
<div class="lp-cta" style="margin-top:14px"><a class="p" href="${listUrl}">Autót választok és ajánlatot kérek →</a></div>
</div></section>
</main>`;
  const pageUrl = `${SITE}/${P.slug}/`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Tartós bérlet', item: SITE + '/tartos-berlet/' },
      { '@type': 'ListItem', position: 3, name: P.ev ? 'Elektromos autó bérlés' : `${P.label} bérlés`, item: pageUrl }] },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: P.ev ? 'Bérelhető elektromos autók' : `Bérelhető ${P.label} modellek`, url: pageUrl, numberOfItems: n,
      itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Car', name: `${c.name} bérlés`, url: SITE + c.url, brand: { '@type': 'Brand', name: c.brand }, ...(c.img ? { image: SITE + c.img } : {}), ...(np ? {} : { offers: { '@type': 'Offer', url: SITE + c.url, price: c.ft, priceCurrency: 'HUF', availability: 'https://schema.org/InStock', businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut', priceSpecification: { '@type': 'UnitPriceSpecification', price: c.ft, priceCurrency: 'HUF', unitCode: 'MON' } } }) } })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return { title, desc, main, ld, img: list[0].img };
}

function build(tpl, P, list, np) {
  const c = content(P, list, np);
  let h = tpl;
  h = h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(c.title)}</title>`);
  const setM = (key, val) => { h = h.replace(new RegExp(`<meta\\b[^>]*\\b(?:name|property)="${key.replace(/:/g, '\\:')}"[^>]*>`, 'gi'), (tag) => tag.replace(/\bcontent="[^"]*"/i, `content="${esc(val)}"`)); };
  setM('description', c.desc); setM('og:description', c.desc); setM('twitter:description', c.desc);
  const t2 = c.title.replace(/\s\|\s*CarAdvance$/, ''); setM('og:title', t2); setM('twitter:title', t2);
  setM('og:url', `${SITE}/${P.slug}/`);
  if (c.img) { setM('og:image', SITE + c.img); setM('twitter:image', SITE + c.img); setM('og:image:alt', t2); }
  h = h.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${SITE}/${P.slug}/">`);
  h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>\s*\n?/g, '');
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  h = h.replace(/<\/head>/i, c.ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n') + '\n</head>');
  h = h.replace(/<link rel="preload" as="image" href="[^"]*" fetchpriority="high">\s*/g, '');
  h = h.replace(/<main\b[\s\S]*<\/main>/i, () => c.main);
  // nyelvváltó: ennek az oldalnak csak magyar változata van → a nyelvi főoldalakra mutat
  h = h.replace(/(<a[^>]*class="(?:langopt|m-langopt)"[^>]*href=")([^"]*)(")/g, (m, a, href, b) => { const l = (href.match(/^\/(en|de|fr|uk|zh)\//) || [])[1]; return a + (l ? `/${l}/` : `/${P.slug}/`) + b; });
  h = h.replace(/(<a[^>]*href=")([^"]*)("[^>]*class="(?:langopt|m-langopt)")/g, (m, a, href, b) => { const l = (href.match(/^\/(en|de|fr|uk|zh)\//) || [])[1]; return a + (l ? `/${l}/` : `/${P.slug}/`) + b; });
  return h;
}

function run() {
  const tplF = path.join(DIST, 'tartos-berlet', 'index.html'); if (!fs.existsSync(tplF)) return 'nincs /tartos-berlet/ sablon';
  const tpl = fs.readFileSync(tplF, 'utf8'); if (!/<main\b[\s\S]*<\/main>/i.test(tpl)) return 'a sablonban nincs <main>';
  const tplNpF = path.join(DIST, '_np', 'tartos-berlet', 'index.html'); const tplNp = fs.existsSync(tplNpF) ? fs.readFileSync(tplNpF, 'utf8') : null;
  const all = cars(); if (all.length < 5) return `kevés bérlési modelloldal (${all.length})`;
  const made = [];
  for (const P of PAGES) {
    const list = all.filter(P.match); if (list.length < 2) continue;
    for (const [np, t, root] of [[false, tpl, ''], [true, tplNp, '_np']]) {
      if (!t) continue;
      const d = path.join(DIST, root, P.slug); fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, 'index.html'), build(t, P, list, np));
    }
    made.push(`${P.slug} (${list.length})`);
  }
  // a /tartos-berlet/ márkakártyái és elektromos szakasza az új oldalakra mutasson (csak a magyar eredetin)
  let nl = 0;
  for (const hf of [tplF, tplNpF]) {
    if (!fs.existsSync(hf)) continue;
    let hub = fs.readFileSync(hf, 'utf8');
    for (const P of PAGES) if (P.marka && made.some((m) => m.startsWith(P.slug))) hub = hub.replace(new RegExp(`href="/autoink/\\?marka=${P.marka}#berelheto"`, 'g'), () => (nl++, `href="/${P.slug}/"`));
    if (made.some((m) => m.startsWith('elektromos-auto-berles')) && !hub.includes('href="/elektromos-auto-berles/"')) hub = hub.replace(/(Kapcsolódó: )/, () => (nl++, '$1<a href="/elektromos-auto-berles/">elektromos autó bérlés</a> · '));
    fs.writeFileSync(hf, hub);
  }
  // sitemap
  const smF = path.join(DIST, 'sitemap.xml'); let sm = fs.existsSync(smF) ? fs.readFileSync(smF, 'utf8') : '';
  if (sm.includes('</urlset>')) {
    for (const m of made) { const slug = m.split(' ')[0]; const loc = `${SITE}/${slug}/`; if (!sm.includes(`<loc>${loc}</loc>`)) sm = sm.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${TODAY}</lastmod></url>\n</urlset>`); }
    fs.writeFileSync(smF, sm);
  }
  return `${made.length} oldal: ${made.join(', ')} · /tartos-berlet/ link ${nl}`;
}
try { console.log('[seo-landing] ' + run()); } catch (e) { console.log('[seo-landing] hiba: ' + (e && e.stack || e)); }
