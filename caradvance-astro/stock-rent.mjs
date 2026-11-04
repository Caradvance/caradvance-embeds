#!/usr/bin/env node
/**
 * stock-rent.mjs — saját raktári bérautók a kártyákon és a Részletek-oldalakon (Marc, 2026-11-04)
 *
 * A seo-abo.mjs után fut (a i18n-mirror előtt, így minden nyelv és piac örökli):
 *  1. /autoink/ (+ /en/autoink/): a nem bérelhető raktári autók (BMW M3, i5) kikerülnek a window.__ABSTOCK listából;
 *     a Choice-ban nem szereplő raktári modellek (BMW X5, X7) kártyájának „Részletek” gombja a saját bérlési oldalra
 *     mutat (/berelheto-auto/<slug>-berles — rental.ts + rentalStock.ts készíti), nem az eladó autó adatlapjára.
 *     Így az „⇄ Összehasonlítás” gomb is megjelenik (seo-perf.mjs, compareCars.ts).
 *  2. A raktári modellek bérlési oldalán az „Ajánlatot kérek” űrlap ugyanazokat a kiviteleket és árakat kapja, mint a
 *     kártyán: a raktári lista (__ABSTOCK) és az összefésülő szkript (seo-abo) bekerül az oldalra.
 *  3. Főoldal bérelhető-rács: a modellhez tartozó bérlési oldalra visz (X5, X6, X7…), nem az eladó adatlapra.
 * Idempotens; hibára nem állítja meg a buildet.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const EXCLUDE = /^BMW (M3|i5)\b/i; // = src/data/rentalStock.ts STOCK_EXCLUDE
const DIG = { '1': '1-es', '2': '2-es', '3': '3-as', '4': '4-es', '5': '5-ös', '6': '6-os', '7': '7-es', '8': '8-as' };
const huName = (b, m) => (b === 'VW' ? 'Volkswagen' : b) + ' ' + String(m).replace(/\b(\d)er\b/g, (_, d) => DIG[d] || d).replace(/\bLimousine\b/g, 'Limuzin').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, '$1-osztály');
const slugify = (s) => String(s).toLowerCase().replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/í/g, 'i').replace(/[óöő]/g, 'o').replace(/[úüű]/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const rhref = (b, m) => '/berelheto-auto/' + slugify(huName(b, m)) + '-berles';
const nz = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);
const pageOk = (href) => { const h = read(path.join(DIST, href.replace(/^\//, ''), 'index.html')); return !!h && h.length > 5000 && !/http-equiv=["']?refresh/i.test(h.slice(0, 3000)); };

function jsonAt(t, i) { // kiegyensúlyozott JSON a t[i]-től
  let d = 0, s = false, e = false;
  for (let k = i; k < t.length; k++) { const c = t[k]; if (s) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') s = false; continue; }
    if (c === '"') s = true; else if (c === '[' || c === '{') d++; else if (c === ']' || c === '}') { d--; if (d === 0) return [i, k + 1]; } }
  return null;
}

function run() {
  const hubF = path.join(DIST, 'autoink', 'index.html');
  const hub = read(hubF); if (!hub) return 'nincs dist/autoink';
  const si = hub.indexOf('window.__ABSTOCK='); if (si < 0) return 'nincs __ABSTOCK';
  const sr = jsonAt(hub, si + 'window.__ABSTOCK='.length); if (!sr) return '__ABSTOCK nem olvasható';
  const STOCK = JSON.parse(hub.slice(sr[0], sr[1]));
  const ui = hub.indexOf('window.SUB='); const ur = ui > -1 ? jsonAt(hub, ui + 'window.SUB='.length) : null;
  const SUB = ur ? JSON.parse(hub.slice(ur[0], ur[1])) : { models: [] };
  const mi = hub.indexOf('(function(){try{var S=window.__ABSTOCK');
  const me = mi > -1 ? hub.indexOf('</script>', mi) : -1;
  const MERGE = mi > -1 && me > -1 ? hub.slice(mi, me) : '';

  // raktári modellek → bérlési oldal (ha elkészült)
  const keep = STOCK.filter((c) => !EXCLUDE.test(c.t));
  const RENTPG = {}; const stockOnly = {};
  for (const c of keep) {
    const br = c.b, bn = nz(br), rest = nz(c.t).replace(new RegExp('^' + bn + '\\s*'), '');
    const choice = (SUB.models || []).find((m) => nz(m.brand) === bn && nz(m.model) && (rest + ' ').indexOf(nz(m.model) + ' ') === 0);
    const model = choice ? choice.model : (String(c.t).replace(new RegExp('^' + br + '\\s*', 'i'), '').split(/\s+/)[0] || '');
    if (!model) continue;
    const key = br + ' ' + model, href = rhref(br, model);
    if (!pageOk(href)) continue;
    RENTPG[key] = href + '/';
    if (!choice) (stockOnly[key] = stockOnly[key] || { href, cars: [] }).cars.push(c);
  }
  const out = [];

  // 1) /autoink/ (+ /en/autoink/)
  for (const f of [hubF, path.join(DIST, 'en', 'autoink', 'index.html')]) {
    let h = read(f); if (!h || h.includes('window.__RENTPG=')) continue;
    const i = h.indexOf('window.__ABSTOCK='); const r = i > -1 ? jsonAt(h, i + 'window.__ABSTOCK='.length) : null; if (!r) continue;
    h = h.slice(0, r[0]) + JSON.stringify(JSON.parse(h.slice(r[0], r[1])).filter((c) => !EXCLUDE.test(c.t))).replace(/</g, '\\u003c') + ';window.__RENTPG=' + JSON.stringify(RENTPG) + h.slice(r[1]);
    const A = 'var _det=(m.stockOnly&&m.stock&&m.stock[0]&&m.stock[0].u)?m.stock[0].u:rhref(m.brand,m.model);';
    const B = "var _det=(m.stockOnly&&m.stock&&m.stock[0]&&m.stock[0].u&&!(window.__RENTPG||{})[m.brand+' '+m.model])?m.stock[0].u:rhref(m.brand,m.model);";
    const n = h.split(A).length - 1; if (n) h = h.split(A).join(B);
    fs.writeFileSync(f, h); out.push(path.relative(DIST, f) + ` (kivéve ${STOCK.length - keep.length}, Részletek→bérlés ${n ? 'ok' : 'NINCS minta'})`);
  }

  // 2) raktári modellek bérlési oldala: az űrlap kivitelei és árai (mint a kártyán)
  for (const [key, v] of Object.entries(stockOnly)) {
    const f = path.join(DIST, v.href.replace(/^\//, ''), 'index.html');
    let h = read(f); if (!h || h.includes('id="ca-stockrent"') || !MERGE) continue;
    const inj = '<script id="ca-stockrent">window.__ABSTOCK=' + JSON.stringify(v.cars).replace(/</g, '\\u003c') + ';window.SUB=window.SUB||{models:[]};window.SUB.models=window.SUB.models||[];window.SUB.brand_order=window.SUB.brand_order||[];</script><script>' + MERGE + '</script>';
    h = h.replace(/<\/body>/i, inj + '</body>');
    fs.writeFileSync(f, h); out.push(`${key}: ${v.cars.length} autó → ${v.href}/`);
  }

  // 3) főoldal: bérelhető-rács → a modell bérlési oldala
  const homeF = path.join(DIST, 'index.html'); let home = read(homeF);
  if (home && !home.includes('window.__RENTPG=')) {
    const A = `href="/auto/'+slug+'/?rent=1"`;
    // a slugból (mindkét főoldali szkriptben elérhető: rent-home-grid és a „Bérelhető” körhinta) — pl. bmw-x5-… → /berelheto-auto/bmw-x5-berles/
    const B = `href="'+(function(s){var P=window.__RENTPGS||{};for(var k in P){if(String(s).indexOf(k+'-')===0)return P[k];}return '/auto/'+s+'/?rent=1';})(slug)+'"`;
    const n = home.split(A).length - 1;
    const RENTPGS = {}; for (const [k, v] of Object.entries(RENTPG)) RENTPGS[slugify(k)] = v;
    if (n) { home = home.split(A).join(B).replace(/<head>/i, '<head><script>window.__RENTPG=' + JSON.stringify(RENTPG) + ';window.__RENTPGS=' + JSON.stringify(RENTPGS) + ';</script>'); fs.writeFileSync(homeF, home); }
    out.push(`főoldal: ${n} link`);
  }
  return `${Object.keys(RENTPG).length} modell bérlési oldallal (${Object.keys(RENTPG).join(', ')}) · ` + out.join(' · ');
}
try { console.log('[stock-rent] ' + run()); } catch (e) { console.log('[stock-rent] hiba: ' + (e && e.stack || e)); }
