#!/usr/bin/env node
/**
 * Bérlési árazás km-keret szerint (Marc, 2026-11-02) — a build LEGELSŐ lépése
 *
 * A Choice-autók ára: Choice nettó ár + 750 € (korábban + 650 €), ez a 2 000 km/hó keret ára.
 * Választható km-keret: 2 000 km (+0 €), 3 000 km (+250 €), 4 000 km (+500 €) — havonta, nettó.
 * Csak olyan keret választható, amely nem nagyobb a Choice-ajánlat saját km-kereténél
 * (pl. egy 2 500 km-es Choice-autónál csak a 2 000 km).
 * A saját raktári autók (window.__ABSTOCK, táblázatból) árai változatlanok: ott a táblázat km-sávjai érvényesek.
 *
 * A napi Choice-szinkron (tools/choice-sync.js) a seo-abo.mjs-t írja; ez a lépés a build-konténerben,
 * a szinkron által írt adatokból számol (a repóban lévő fájl nem változik), így a szinkron nem írja felül.
 * Átírja: window.__ABCFG (km-keret + ár soronként), window.SUB modellek km-listája, az árrés 650 → 750
 * a kártya-, a foglaló- és a raktári-kód szövegében. Többszöri futtatásra ugyanazt adja. Hibára exit 0.
 */
import fs from 'node:fs';

export const MARGIN = 750;
export const TIERS = [[2000, 0], [3000, 250], [4000, 500]];
const FILE = 'seo-abo.mjs';

function jsonAt(src, marker) {
  const i = src.indexOf(marker); if (i < 0) return null;
  const j = i + marker.length; let d = 0, q = null, e = false, k = j;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (!d) { k++; break; } }
  }
  return { i: j, j: k, v: JSON.parse(src.slice(j, k)) };
}
function tiersFor(K) {
  const max = Math.max(0, ...(K || []).filter((x) => typeof x === 'number'));
  const t = TIERS.filter(([km]) => km <= max);
  return t.length ? t : [TIERS[0]];
}
function convCfg(C) {
  let n = 0;
  for (const g of Object.values(C)) {
    if (!g || !Array.isArray(g.X) || !Array.isArray(g.K)) continue;
    const tiers = tiersFor(g.K);
    const best = new Map();   // kombináció (üzemanyag, futamidő, szín, kivitel, elérhetőség) → a legkisebb km-keretű sor
    for (const x of g.X) {
      if (!Array.isArray(x) || x[7] == null) continue;
      const key = [x[0], x[1], x[3], x[4], x[5]].join('|');
      const km = g.K[x[2]];
      const b = best.get(key);
      if (!b || km < b.km || (km === b.km && x[7] < b.x[7])) best.set(key, { km, x });
    }
    const X = [];
    for (const { km, x } of best.values()) {
      // ha már átalakított (km = 2 000-es sor), az ár a 2 000-es alapár; különben a Choice-ár az alap
      const base = x[7];
      tiers.forEach(([, add], ti) => X.push([x[0], x[1], ti, x[3], x[4], x[5], x[6], base + add]));
      void km;
    }
    g.K = tiers.map(([km]) => km); g.X = X; n++;
  }
  return n;
}

function run() {
  if (!fs.existsSync(FILE)) return 'nincs ' + FILE;
  let src = fs.readFileSync(FILE, 'utf8');
  const bm = src.match(/const SEC_B64 = "([^"]+)"/);
  const sm = src.match(/const STRIP = ("(?:[^"\\]|\\.)*")/);
  if (!bm || !sm) return 'SEC_B64 / STRIP nem található';
  let sec = Buffer.from(bm[1], 'base64').toString('utf8');
  let strip = JSON.parse(sm[1]);

  // 1) foglaló-konfiguráció (STRIP: window.__ABCFG=…)
  const c = jsonAt(strip, 'window.__ABCFG=');
  if (!c) return '__ABCFG nem olvasható';
  const nm = convCfg(c.v);
  strip = strip.slice(0, c.i) + JSON.stringify(c.v) + strip.slice(c.j);
  const KM = Object.fromEntries(Object.entries(c.v).map(([k, g]) => [k, g.K]));

  // 2) kártyák (SEC: window.SUB=…): modellenként a választható km-keret
  const s = jsonAt(sec, 'window.SUB=');
  let ns = 0;
  if (s && s.v && Array.isArray(s.v.models)) {
    for (const m of s.v.models) {
      const k = (m.brand === 'VW' ? 'VW' : m.brand) + ' ' + m.model;
      const K = KM[k] || KM[m.brand + ' ' + m.model];
      if (K) { m.km = K.slice(); ns++; }
    }
    sec = sec.slice(0, s.i) + JSON.stringify(s.v) + sec.slice(s.j);
  }

  // 3) árrés a kódban: 650 → 750 (kártya, foglaló ablak, raktári autók visszaszámolása)
  const R = [
    [sec, 'var effNet = m.net ? (m.net + 650) : 0;', `var effNet = m.net ? (m.net + ${MARGIN}) : 0;`],
    [sec, 'if(e&&(!best.net||e-650<best.net))best.net=e-650;', `if(e&&(!best.net||e-${MARGIN}<best.net))best.net=e-${MARGIN};`],
    [sec, 'c.d||0,r[1]-650]', `c.d||0,r[1]-${MARGIN}]`],
    [strip, 'Math.ceil((n+650)*_vm*_pr/10000)', `Math.ceil((n+${MARGIN})*_vm*_pr/10000)`],
    [strip, 'var _eu=_pp[0]+650;', `var _eu=_pp[0]+${MARGIN};`]
  ];
  let nr = 0;
  for (const [, a, b] of R) {
    if (sec.includes(a)) { sec = sec.split(a).join(b); nr++; }
    else if (strip.includes(a)) { strip = strip.split(a).join(b); nr++; }
    else if (sec.includes(b) || strip.includes(b)) nr++;          // már átírva
    else console.log('[km-pricing] nem található: ' + a.slice(0, 60));
  }
  src = src.replace(bm[0], 'const SEC_B64 = "' + Buffer.from(sec, 'utf8').toString('base64') + '"');
  src = src.replace(sm[0], () => 'const STRIP = ' + JSON.stringify(strip));
  fs.writeFileSync(FILE, src);
  return `[km-pricing] árrés ${MARGIN} €, km-keret 2000/3000/4000 (+0/+250/+500 €): ${nm} modell átalakítva, ${ns} kártya, ${nr}/${R.length} kódhely`;
}
try { console.log(run()); } catch (e) { console.log('[km-pricing] hiba: ' + (e && e.stack || e)); }
