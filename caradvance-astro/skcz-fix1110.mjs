// Build lépés (a skcz-fix1109.mjs után): Mr. JOB SK „Zostávajúce drobnosti” (2026-11-09), Marc — minden piacon és nyelven:
//  1  Bérelhető márkák: a menüben (statikus legördülő + mega-menu.js) csak az a márka marad, amelyből van bérelhető autó
//     (window.SUB.brand_totals a /autoink/ oldalon); közvetlen linknél (?marka=volvo) az autólista fölött üzenet:
//     „Momentálne nemáme v ponuke – radi vám auto zabezpečíme na objednávku.” (a piac nyelvén); SK / CZ: üzemanyag-szűrő feliratai
//  2  Régi, a bérelhető kínálatban már nem szereplő bérlési modelloldalak (pl. Audi Q7, BMW M5) törlése → a middleware 301-gyel a márkára
//     szűrt bérelhető listára irányít; kikerülnek a sitemapből és a keresőindexből
//  4  Kereső: eladott autók („Predané …”, „Elkelt …”) kivétele a „készleten” találatok közül (minden piac indexéből)
//  5  Kereső .cz: a készleten lévő autók euróára (ep) a szlovák indexből — a kereső € és Kč árat mutat
// Hiba esetén logol, a buildet nem állítja meg. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); }
  return out;
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const ALIAS = { vw: 'volkswagen', mercedesbenz: 'mercedes', mercedes: 'mercedes', seat: 'seat' };
const bkey = (s) => { const n = norm(s); return ALIAS[n] || n; };

/* ---------- 1) bérelhető márkák ---------- */
let BR = null;
try {
  const h = fs.readFileSync(path.join(DIST, 'autoink', 'index.html'), 'utf8');
  const m = h.match(/"brand_totals"\s*:\s*(\{[^}]*\})/);
  if (m) { const o = JSON.parse(m[1]); BR = new Set(Object.keys(o).filter((k) => +o[k] > 0).map(bkey)); }
} catch (e) { console.log('[skcz-fix1110] brand_totals hiba:', e.message); }
const NOTE = {
  sk: 'Momentálne nemáme v ponuke – radi vám auto zabezpečíme na objednávku.',
  cs: 'Momentálně nemáme v nabídce – rádi vám vůz zajistíme na objednávku.',
  hu: 'Ebből a márkából jelenleg nincs bérelhető autónk – szívesen beszerezzük Önnek rendelésre.',
  en: 'We currently have no cars of this brand for rent – we will gladly source one for you to order.',
  de: 'Derzeit haben wir keine Mietwagen dieser Marke – gern besorgen wir Ihnen eines auf Bestellung.',
  pl: 'Obecnie nie mamy w ofercie aut tej marki – chętnie sprowadzimy je dla Państwa na zamówienie.',
  fr: 'Nous n’avons actuellement aucune voiture de cette marque à louer – nous vous en procurons volontiers une sur commande.',
  it: 'Al momento non abbiamo auto a noleggio di questo marchio – saremo lieti di procurarne una su ordinazione.',
  es: 'Actualmente no tenemos coches de esta marca en alquiler – con gusto le conseguimos uno por encargo.',
  uk: 'Наразі в нас немає авто цієї марки в оренді – охоче привеземо його на замовлення.',
  zh: '我们目前没有该品牌的租赁车辆——可为您按订单采购。',
};
const FUEL = { sk: { 'Benzin': 'Benzín', 'Dízel': 'Diesel', 'Hibrid': 'Hybrid', 'Elektromos': 'Elektro', 'Plug-in hibrid': 'Plug-in hybrid' }, cs: { 'Benzin': 'Benzín', 'Dízel': 'Diesel', 'Hibrid': 'Hybrid', 'Elektromos': 'Elektro', 'Plug-in hibrid': 'Plug-in hybrid' } };
const hubJs = (lg) => '<script id="ca-brand-note">(function(){var N=' + JSON.stringify(NOTE[lg] || NOTE.en) + ',F=' + JSON.stringify(FUEL[lg] || null) + ';' +
  'function nq(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[^a-z]/g,"");}var AL={vw:"volkswagen",mercedesbenz:"mercedes"};' +
  'function run(){var s=document.getElementById("sf-brand");if(!s||!s.options.length)return false;' +
  'if(F){var fs=document.getElementById("sf-fuel");if(fs)[].forEach.call(fs.options,function(o){var t=o.textContent.trim();if(F[t])o.textContent=F[t];});}' +
  'var q=nq(new URLSearchParams(location.search).get("marka"));if(!q)return true;q=AL[q]||q;' +
  'var ok=[].some.call(s.options,function(o){var v=nq(o.value||o.textContent);return v&&(AL[v]||v)===q;});' +
  'if(ok||document.getElementById("ca-brand-msg"))return true;var l=document.getElementById("sub-list");if(!l)return true;' +
  'var d=document.createElement("div");d.id="ca-brand-msg";d.setAttribute("role","status");d.textContent=N;' +
  'd.style.cssText="margin:0 0 18px;padding:14px 18px;border-radius:12px;background:#fff4f4;border:1px solid #f3c6c9;color:#8a0f1a;font-weight:600;font-size:15px;line-height:1.45";' +
  'l.parentNode.insertBefore(d,l);return true;}' +
  'var n=0;(function t(){if(run()||++n>40)return;setTimeout(t,150);})();})();</script>';
const mm = { rm: 0, menu: 0, hub: 0, js: 0 };
try {
  if (BR && BR.size) {
    for (const f of walk(DIST, [])) {
      if (/\.html$/.test(f)) {
        let h = fs.readFileSync(f, 'utf8'); const s = h;
        if (h.indexOf('ddi-brand') > -1) {
          h = h.replace(/<a class="ddi ddi-brand" href="[^"]*[?&]marka=([a-z0-9-]+)[^"]*">[\s\S]*?<\/a>/g, (a, k) => { if (BR.has(bkey(k))) return a; mm.rm++; return ''; });
        }
        if (h.indexOf('id="sf-brand"') > -1 && h.indexOf('id="ca-brand-note"') < 0) {
          const lg = ((h.match(/<html[^>]*\slang="([a-z]{2})/i) || [])[1] || 'hu').toLowerCase();
          const bi = h.lastIndexOf('</body>'); if (bi > 0) { h = h.slice(0, bi) + hubJs(lg) + h.slice(bi); mm.hub++; }
        }
        if (h !== s) { fs.writeFileSync(f, h); mm.menu++; }
      } else if (/(^|[\\/])mega-menu(-test)?\.js$/.test(f)) {
        let j = fs.readFileSync(f, 'utf8'); const s = j;
        j = j.replace(/(var RENT_BRANDS = \[)([^\]]*)(\])/, (a, p1, body, p3) => p1 + body.split(/,\s*(?=B\()/).filter((b) => { const k = (b.match(/B\('([a-z]+)'/) || [])[1]; return !k || BR.has(bkey(k)); }).join(', ') + p3);
        if (j !== s) { fs.writeFileSync(f, j); mm.js++; }
      }
    }
  }
  console.log('[skcz-fix1110] bérelhető márkák: ' + (BR ? [...BR].join(',') : '?') + ' · menüből kivett link: ' + mm.rm + ' (' + mm.menu + ' oldal) · mega-menu.js: ' + mm.js + ' · lista-üzenet: ' + mm.hub + ' oldal');
} catch (e) { console.log('[skcz-fix1110] márkák hiba:', e && e.stack || e); }

/* ---------- 2) régi bérlési modelloldalak ---------- */
const RENT_DIR = /(^|\/)(berelheto-auto|prenajom|pronajem|wynajem|mieten|langzeitmiete|location-longue-duree|noleggio-lungo-termine|renting|alquiler|car-rental|noleggio|location)\/([a-z0-9-]+)\/index\.html$/;
const gone = [];
try {
  for (const f of walk(DIST, [])) {
    const rel = path.relative(DIST, f).split(path.sep).join('/');
    if (!/\/index\.html$/.test(rel) || /^(admin|i18n)\//.test(rel)) continue; // az ár nélküli (_np) változatok is
    const h = fs.readFileSync(f, 'utf8');
    // bérlési modelloldal sablon (cd-hero + cd-lead, magyar megfelelője /berelheto-auto/…), de bérlési ablak (sub-rent) nélkül = már nincs kínálatban
    if (h.indexOf('cd-hero') < 0 || h.indexOf('cd-lead') < 0 || h.indexOf('sub-rent') > -1 || h.indexOf('/berelheto-auto/') < 0) continue;
    gone.push('/' + rel.replace(/index\.html$/, ''));
    fs.rmSync(path.dirname(f), { recursive: true, force: true });
  }
  // sitemapek és keresőindexek
  const goneSet = new Set(gone.map((u) => u.replace(/^\/_np(?=\/)/, '').replace(/^\/(sk|cs|pl|ch|eu)(?=\/)/, '')));
  const isGone = (u) => { try { const p = new URL(u, 'https://x').pathname; return gone.includes(p) || goneSet.has(p); } catch (e) { return false; } };
  let smN = 0;
  for (const f of walk(DIST, [])) {
    if (/sitemap[^/\\]*\.xml$/.test(f)) {
      const s = fs.readFileSync(f, 'utf8');
      const h = s.replace(/\s*<url>(?:(?!<\/url>)[\s\S])*?<loc>([^<]+)<\/loc>(?:(?!<\/url>)[\s\S])*?<\/url>/g, (m, loc) => { if (isGone(loc)) { smN++; return ''; } return m; });
      if (h !== s) fs.writeFileSync(f, h);
    }
  }
  // a middleware ebből a listából 301-gyel irányít (nem a 404-re vár — az elő-gyorsítótárazott régi oldal se jöhessen vissza)
  const GL = {};
  for (const u of gone) {
    let x = u.replace(/^\/_np(?=\/)/, ''); let d = 'hu';
    const m = x.match(/^\/(sk|cs|pl|ch|eu)(\/.*)$/); if (m) { d = m[1]; x = m[2]; }
    (GL[d] = GL[d] || []); if (!GL[d].includes(x)) GL[d].push(x);
  }
  fs.writeFileSync(path.join(DIST, 'gone-paths.json'), JSON.stringify(GL));
  console.log('[skcz-fix1110] régi bérlési oldal törölve: ' + gone.length + ' (pl. ' + gone.slice(0, 4).join(', ') + ') · sitemapből kivéve: ' + smN);
} catch (e) { console.log('[skcz-fix1110] régi oldalak hiba:', e && e.stack || e); }

/* ---------- 4 + 5) keresőindexek ---------- */
const SOLD = /^(Elkelt|Eladva|Predané|Predaný|Predaná|Prodáno|Prodaný|Prodané|Prodaná|Sprzedan\w*|Verkauft|Sold|Vendu\w*|Venduto|Venduta|Vendido|Vendida|Продано|已售)(?=[\s:·,—–-]|$)/i;
try {
  const idxFiles = walk(DIST, []).filter((f) => /kereses-index[^/\\]*\.json$/.test(f));
  // SK index: autó-slug → euróár
  const EP = new Map();
  for (const f of idxFiles.filter((f) => /kereses-index-sk\.json$|[\\/]sk[\\/]kereses-index\.json$/.test(f))) {
    try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); for (const o of j.items || []) if (o.k === 'keszlet' && o.ep) { const m = String(o.u || '').match(/\/auto\/([^/]+)\//); if (m) EP.set(m[1], o.ep); } } catch (e) {}
  }
  let sold = 0, ep = 0, gi = 0;
  for (const f of idxFiles) {
    let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(j.items)) continue;
    const n0 = j.items.length; let ch = false;
    j.items = j.items.filter((o) => {
      if (o.k === 'keszlet' && (SOLD.test(String(o.t || '').trim()) || SOLD.test(String(o.h || '').trim()))) { sold++; return false; }
      if (gone.length && o.u && (gone.includes(o.u) || gone.includes(String(o.u).replace(/^\/(sk|cs|pl|ch|eu)(?=\/)/, '')))) { gi++; return false; }
      return true;
    });
    if (j.items.length !== n0) ch = true;
    if (/kereses-index-cs\.json$|[\\/]cs[\\/]kereses-index\.json$/.test(f)) {
      for (const o of j.items) { if (o.k === 'keszlet' && !o.ep) { const m = String(o.u || '').match(/\/auto\/([^/]+)\//); if (m && EP.has(m[1])) { o.ep = EP.get(m[1]); o.pc = 'CZK'; ep++; ch = true; } } }
    }
    if (ch) fs.writeFileSync(f, JSON.stringify(j));
  }
  console.log('[skcz-fix1110] keresőindex: ' + idxFiles.length + ' fájl · eladott autó kivéve: ' + sold + ' · régi bérlési oldal kivéve: ' + gi + ' · CZ euróár: ' + ep);
} catch (e) { console.log('[skcz-fix1110] index hiba:', e && e.stack || e); }

// 6  Belső linkek piaci előtaggal (pl. href="/sk/prenajom/proces/" a caradvance.sk-n) → előtag nélkül, hogy ne átirányításra mutassanak
try {
  let nl = 0, nf = 0;
  for (const c of ['sk', 'cs', 'pl', 'ch', 'eu']) {
    const re = new RegExp('(href=\\\\?["\'])/' + c + '/', 'g');
    for (const f of walk(path.join(DIST, c), [])) {
      if (!/\.html$/i.test(f)) continue;
      const s = fs.readFileSync(f, 'utf8'); if (s.indexOf('/' + c + '/') < 0) continue;
      let k = 0; const h = s.replace(re, (m, a) => { k++; return a + '/'; });
      if (k) { fs.writeFileSync(f, h); nl += k; nf++; }
    }
  }
  console.log('[skcz-fix1110] piaci előtagos belső link javítva: ' + nl + ' (' + nf + ' oldal)');
} catch (e) { console.log('[skcz-fix1110] link hiba:', e && e.stack || e); }
