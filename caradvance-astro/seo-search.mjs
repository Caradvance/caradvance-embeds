// seo-search.mjs — okos kereső a teljes oldalhoz (a build UTOLSÓ lépése).
//
// MIT TESZ
// 1. Végigolvassa a kész dist/ HTML-oldalakat (magyar fa + minden nyelvi fa: en, de, fr, uk, zh, sk, cs),
//    és nyelvenként keresőindexet ír:  dist/kereses-index.json, dist/<nyelv>/kereses-index.json
//    (cím, leírás, H1, alcímek, autó-adatok a JSON-LD-ből: márka, karosszéria, üzemanyag, ár, km, év, kW,
//    a bérautóknál az összehasonlító adataiból ülések/csomagtartó is).
// 2. Ár nélküli index a külföldi látogatóknak: dist/_np/…/kereses-index.json (a middleware ezt adja nekik),
//    a _np oldalak ár nélküli címeiből/leírásaiból, ár mezők nélkül. A _routes.json-ba felveszi a /kereses-index.json-t.
// 3. Minden HTML-oldal menüjébe (a „Rólunk” és a „Kapcsolat” közé) beteszi a kereső gombot,
//    és behúzza a /kereses.css + /kereses.js fájlt (public/ mappából, verzió-hash-sel).
//
// BIZTONSÁG: bármilyen hiba esetén a build NEM áll le (exit 0) — legfeljebb nincs kereső.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = 'dist';
const SITE = 'https://www.caradvance.hu';
const LANGS = ['en', 'de', 'fr', 'uk', 'zh', 'sk', 'cs'];
const SKIP_TOP = new Set([...LANGS, '_np', '_astro', 'belso', 'ajanlat', 'auto-osszehasonlitas', 'auto-osszehasonlitas-teszt']);
const DEFAULT_IMG = /caradvance-hero-|og-default|logo/i;
const LABEL = { hu: 'Keresés', en: 'Search', de: 'Suche', fr: 'Rechercher', uk: 'Пошук', zh: '搜索', sk: 'Hľadať', cs: 'Hledat' };

const log = (...a) => console.log('[search]', ...a);

function walk(dir, out = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const dec = (s) => String(s || '')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const strip = (s) => dec(String(s || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const meta = (h, re) => { const m = h.match(re); return m ? dec(m[1]).trim() : ''; };
const cleanTitle = (t) => t.replace(/\s*[|—–-]\s*CarAdvance\s*$/i, '').trim();
const num = (s) => { const n = parseInt(String(s).replace(/[^\d]/g, ''), 10); return Number.isFinite(n) ? n : 0; };

function ldItems(h) {
  const out = [];
  for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      const arr = Array.isArray(j) ? j : (j['@graph'] || [j]);
      for (const x of arr) if (x && typeof x === 'object') out.push(x);
    } catch { /* hibás JSON-LD — kihagyjuk */ }
  }
  return out;
}

function kindOf(rel) {
  const top = rel.split('/')[0];
  if (top === 'berelheto-auto' || top === 'uj-auto-berlese') return rel.includes('/') && rel.split('/')[1] ? 'berles' : 'oldal';
  if (top === 'auto') return rel.split('/')[1] ? 'keszlet' : 'oldal';
  if (top === 'egyedi-auto-rendeles') return rel.split('/')[1] ? 'rendeles' : 'oldal';
  if (top === 'blog') return rel.split('/')[1] ? 'blog' : 'oldal';
  if (/kalkulator|calculator|rechner/.test(top)) return 'eszkoz';
  return 'oldal';
}

// Bérautók kiegészítő adatai (ülések, csomagtartó, karosszéria) az összehasonlító oldal adataiból
// Bérautók: ugyanaz a kártyafotó, mint az /autoink „Bérelhető” listában (seo-abo.mjs PHOTO + SUB).
// Kulcs: /berelheto-auto/<slug>-berles/ — a slug ugyanúgy készül, mint src/data/rental.ts rentSlug().
let PHOTOS = new Map();
function cardPhotos() {
  const map = new Map();
  try {
    const src = fs.readFileSync(path.resolve('seo-abo.mjs'), 'utf8');
    const b64 = (src.match(/const SEC_B64 = "([^"]+)"/) || [])[1];
    if (!b64) return map;
    const sec = Buffer.from(b64, 'base64').toString('utf8');
    const grab = (s, marker) => {
      const i = s.indexOf(marker); if (i < 0) return null;
      let k = i + marker.length, depth = 0, inStr = false, q = '', esc = false;
      const j = k;
      for (; k < s.length; k++) {
        const ch = s[k];
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === q) inStr = false; continue; }
        if (ch === '"' || ch === "'") { inStr = true; q = ch; continue; }
        if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') { depth--; if (depth === 0) { k++; break; } }
      }
      const txt = s.slice(j, k);
      try { return JSON.parse(txt); } catch { try { return new Function('return (' + txt + ')')(); } catch { return null; } }
    };
    const PHOTO = grab(sec, 'var PHOTO=') || {};
    const SUB = grab(sec, 'window.SUB=') || {};
    const DIG = { '1': '1-es', '2': '2-es', '3': '3-as', '4': '4-es', '5': '5-ös', '6': '6-os', '7': '7-es', '8': '8-as' };
    const huName = (b, m) => (b === 'VW' ? 'Volkswagen' : b) + ' ' + String(m).replace(/\b(\d)er\b/g, (_, d) => DIG[d] || d).replace(/\bLimousine\b/g, 'Limuzin').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, '$1-osztály');
    const slugify = (s) => String(s).toLowerCase().replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/í/g, 'i').replace(/[óöő]/g, 'o').replace(/[úüű]/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    for (const m of SUB.models || []) {
      if (!m || !m.brand || !m.model) continue;
      const ph = PHOTO[m.brand + ' ' + m.model];
      if (ph) map.set('/berelheto-auto/' + slugify(huName(m.brand, m.model)) + '-berles/', String(ph));
    }
  } catch (e) { log('bérautó kártyafotók nem olvashatók:', e.message); }
  return map;
}

function compareData() {
  const map = new Map();
  try {
    const h = fs.readFileSync(path.join(ROOT, 'auto-osszehasonlitas/index.html'), 'utf8');
    const m = h.match(/const CARS=(\[[\s\S]*?\]);const PHOTOS/);
    if (!m) return map;
    const cars = JSON.parse(m[1].replace(/([{,])price:/g, '$1"price":'));
    for (const c of cars) if (c.href) map.set(c.href.replace(/\/?$/, '/'), c);
  } catch (e) { log('összehasonlító adatok nem olvashatók:', e.message); }
  return map;
}

function extract(file, rel, lang, cmp, eurRate) {
  const h = fs.readFileSync(file, 'utf8');
  const robots = meta(h, /<meta name="robots" content="([^"]*)"/i);
  const url = '/' + rel.replace(/index\.html$/, '');
  const t = cleanTitle(meta(h, /<title>([\s\S]*?)<\/title>/i));
  if (!t || /^Redirecting/i.test(t) || /http-equiv="refresh"/i.test(h.slice(0, 3000))) return null;
  const d = meta(h, /<meta name="description" content="([^"]*)"/i);
  const h1 = strip((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const hs = [...h.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].map((m) => strip(m[1])).filter((s) => s && s.length < 90);
  // a „Hasonló autók / Kapcsolódó cikkek” utáni alcímek más autókról szólnak — azokat nem indexeljük
  const cut = hs.findIndex((v) => /^(Hasonló|Kapcsolódó|Similar|Related|Ähnliche|Weitere)/i.test(v));
  const x = [...new Set(cut >= 0 ? hs.slice(0, cut) : hs)].join(' · ').slice(0, 260);
  let img = meta(h, /<meta property="og:image" content="([^"]*)"/i);
  if (DEFAULT_IMG.test(img)) img = '';
  const relNoLang = lang === 'hu' ? rel : rel.slice(lang.length + 1);
  const it = { u: url, t, d: d.slice(0, 220), k: kindOf(relNoLang) };
  if (h1 && h1 !== t) it.h = h1.slice(0, 120);
  if (x) it.x = x;

  for (const o of ldItems(h)) {
    const ty = [].concat(o['@type'] || []);
    if (!ty.some((v) => /^(Car|Vehicle|Product)$/.test(v))) continue;
    if (o.brand) it.b = typeof o.brand === 'string' ? o.brand : o.brand.name || '';
    if (o.name) it.n = String(o.name);
    if (o.bodyType) it.bt = String(o.bodyType);
    const fuel = o.fuelType || (o.vehicleEngine && o.vehicleEngine.fuelType);
    if (fuel) it.f = String(fuel);
    if (o.vehicleModelDate) it.y = num(o.vehicleModelDate) || undefined;
    const km = o.mileageFromOdometer && o.mileageFromOdometer.value;
    if (km) it.km = num(km);
    const pw = o.vehicleEngine && o.vehicleEngine.enginePower;
    if (pw && pw.value) it.kw = /BHP|HP|PS|LE/i.test(pw.unitCode || pw.unitText || '') ? Math.round(num(pw.value) * 0.7355) : num(pw.value);
    if (/AWD|4WD|4x4/i.test(o.driveWheelConfiguration || '') || /quattro|xdrive|4matic|4motion|allrad|awd|4x4/i.test(it.n || t)) it.aw = 1;
    if (/Automatic/i.test(o.vehicleTransmission || '')) it.at = 1;
    const off = Array.isArray(o.offers) ? o.offers[0] : o.offers;
    if (off && off.price != null && +off.price > 0) {
      const p = +off.price;
      if (/EUR/i.test(off.priceCurrency || '')) { it.ep = p; it.p = Math.round(p * eurRate); }
      else it.p = Math.round(p);
    }
    const im = Array.isArray(o.image) ? o.image[0] : o.image;
    if (im && !DEFAULT_IMG.test(im)) img = typeof im === 'string' ? im : im.url || img;
    break;
  }
  // havi díj a bérautóknál (cím / leírás)
  if (it.k === 'berles') {
    const mm = (t + ' ' + d).match(/(\d{1,3}(?:[ . ]\d{3})+)\s*Ft\s*\/\s*hó/i) || d.match(/\((\d{1,3}(?:[ . ]\d{3})+)\s*Ft\)/);
    if (mm) it.p = num(mm[1]);
    it.pu = 'ho';
    if (relNoLang.startsWith('uj-auto-berlese/')) it.sub = 'abo';
    const u0 = url.replace(/^\/[a-z]{2}\//, '/');
    const cp = PHOTOS.get(u0) || PHOTOS.get(u0.replace(/^\/uj-auto-berlese\/([^/]+)\/$/, '/berelheto-auto/$1-berles/'));
    if (cp) img = cp;
    it.cf = 1; // bérautó-kép: teljes autó látszik, nem vágjuk le
    const c = cmp.get(url.replace(/^\/[a-z]{2}\//, '/')) || null;
    if (c) {
      it.s = c.seats; if (c.seatsOpt > c.seats) it.so = c.seatsOpt;
      if (c.trunk) it.tr = c.trunk; if (c.isofix) it.iso = c.isofix; if (c.three) it.th = 1;
      if (!it.bt) it.bt = c.body; if (!it.f) it.f = c.fuel; if (!it.kw && c.kW) it.kw = c.kW;
      if (c.L) it.L = c.L;
    }
  } else if (it.k === 'rendeles') it.pu = 'netto';
  // ülésszám a szövegből (pl. „7 üléses”, „7 személyes”)
  if (!it.s) { const sm = (t + ' ' + d + ' ' + x).match(/(\d)\s*(?:-?\s*)(?:üléses|személyes|seats?|sitzer)/i); if (sm) it.s = +sm[1]; }
  if (img) it.i = img.replace(/rule=mo-\d+/, 'rule=mo-360').replace(/^https:\/\/www\.caradvance\.hu/, '');
  if (robots.includes('noindex') && lang === 'hu') return null;
  return it;
}

function buildTree(lang, cmp) {
  const base = lang === 'hu' ? ROOT : path.join(ROOT, lang);
  const files = walk(base).filter((f) => f.endsWith('index.html'));
  const items = [];
  let eurRate = 390;
  // EUR→Ft árfolyam a rendelős oldalak leírásából (pl. „27.437 €-tól (kb. 10,0 M Ft)”)
  try {
    const pre = path.join(base, 'egyedi-auto-rendeles') + path.sep;
    const sample = files.find((f) => f.startsWith(pre) && f !== pre + 'index.html');
    if (sample) {
      const dd = meta(fs.readFileSync(sample, 'utf8'), /<meta name="description" content="([^"]*)"/i);
      const m = dd.match(/(\d{1,3}(?:[ .\u00a0]\d{3})+)\s*€[^(]*\(kb\.\s*([\d,]+)\s*M\s*Ft\)/);
      if (m) { const r = (parseFloat(m[2].replace(',', '.')) * 1e6) / num(m[1]); if (r > 250 && r < 600) eurRate = Math.round(r); }
    }
  } catch { /* marad az alapérték */ }
  for (const f of files) {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    const top = rel.split('/')[lang === 'hu' ? 0 : 1];
    if (lang === 'hu' && SKIP_TOP.has(rel.split('/')[0])) continue;
    if (lang !== 'hu' && (top === '_np' || SKIP_TOP.has(top))) continue;
    if (rel === '404.html' || rel.endsWith('/404/index.html')) continue;
    // kanonikus: csak a saját URL-re mutató oldalak (a duplikátumok kimaradnak)
    const h = fs.readFileSync(f, 'utf8');
    const can = meta(h, /<link rel="canonical" href="([^"]*)"/i).replace(SITE, '');
    const own = '/' + rel.replace(/index\.html$/, '');
    if (lang === 'hu' && can && can !== own && can + '/' !== own) continue;
    const it = extract(f, rel, lang, cmp, eurRate);
    if (it) items.push(it);
  }
  return { items, eurRate };
}

function contactInfo() {
  try {
    const h = fs.readFileSync(path.join(ROOT, 'kapcsolat/index.html'), 'utf8');
    const tel = (h.match(/href="tel:(\+?\d{6,})"/) || [])[1] || '';
    const mail = (h.match(/href="mailto:([^"'+]+@[^"'+]+)"/) || [])[1] || '';
    return { tel, mail };
  } catch { return {}; }
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj));
}

function noPrice(items, lang) {
  // ár nélküli változat: a _np oldal (ha van) címe/leírása, ár mezők nélkül
  return items.map((it) => {
    const o = { ...it };
    delete o.p; delete o.ep;
    const np = path.join(ROOT, '_np', it.u.replace(/^\//, ''), 'index.html');
    if (fs.existsSync(np)) {
      try {
        const h = fs.readFileSync(np, 'utf8');
        const t = cleanTitle(meta(h, /<title>([\s\S]*?)<\/title>/i)); if (t) o.t = t;
        const d = meta(h, /<meta name="description" content="([^"]*)"/i); o.d = d.slice(0, 220);
      } catch { /* marad */ }
    } else {
      // ha nincs _np oldal, a szövegből is kivesszük az árat
      const rx = /\s*[–—-]?\s*\d{1,3}(?:[ . ]\d{3})+\s*(?:Ft|€|EUR)(?:\s*\/\s*hó)?(?:-tól|-től)?/gi;
      o.t = o.t.replace(rx, '').trim(); o.d = (o.d || '').replace(rx, '').trim();
    }
    return o;
  });
}

function inject(files, ver) {
  const svg = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  let n = 0;
  for (const f of files) {
    let h;
    try { h = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (h.includes('data-ca-search') || !h.includes('<div class="navright">')) continue;
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    const parts = rel.split('/');
    const np = parts[0] === '_np';
    const lp = np ? parts[1] : parts[0];
    const lang = LANGS.includes(lp) ? lp : 'hu';
    const idx = (lang === 'hu' ? '' : '/' + lang) + '/kereses-index.json';
    const label = LABEL[lang] || LABEL.en;
    const btn = `<button class="ca-sbtn" type="button" data-ca-search data-idx="${idx}" data-lang="${lang}" aria-label="${label}" title="${label} (Ctrl+K)">${svg}</button>`;
    h = h.replace('<div class="navright">', '<div class="navright">' + btn);
    const assets = `<link rel="stylesheet" href="/kereses.css?v=${ver}"><script src="/kereses.js?v=${ver}" defer></script>`;
    h = h.includes('</head>') ? h.replace('</head>', assets + '</head>') : h + assets;
    fs.writeFileSync(f, h);
    n++;
  }
  return n;
}

try {
  if (!fs.existsSync(ROOT)) throw new Error('nincs dist/');
  const cmp = compareData();
  PHOTOS = cardPhotos();
  log('bérautó kártyafotók:', PHOTOS.size);
  const contact = contactInfo();
  const stamp = new Date().toISOString().slice(0, 16);
  let total = 0;
  for (const lang of ['hu', ...LANGS]) {
    if (lang !== 'hu' && !fs.existsSync(path.join(ROOT, lang))) continue;
    const { items, eurRate } = buildTree(lang, cmp);
    if (!items.length) continue;
    const pre = lang === 'hu' ? '' : lang + '/';
    writeJson(path.join(ROOT, pre + 'kereses-index.json'), { v: 1, lang, g: stamp, eur: eurRate, c: contact, items });
    writeJson(path.join(ROOT, '_np', pre + 'kereses-index.json'), { v: 1, lang, g: stamp, np: 1, c: contact, items: noPrice(items, lang) });
    // caradvance.sk / .cz saját domainen a /sk/… útvonal nem érhető el — gyökérbeli másolat
    if (lang === 'sk' || lang === 'cs') {
      writeJson(path.join(ROOT, 'kereses-index-' + lang + '.json'), { v: 1, lang, g: stamp, eur: eurRate, c: contact, items });
    }
    total += items.length;
    if (lang === 'hu') log(`hu: ${items.length} elem (` + Object.entries(items.reduce((a, i) => ((a[i.k] = (a[i.k] || 0) + 1), a), {})).map(([k, v]) => k + ' ' + v).join(', ') + `), EUR=${eurRate} Ft`);
  }
  // _routes.json: a magyar index is menjen át a middleware-en (külföldről ár nélküli változat)
  try {
    const rp = path.join(ROOT, '_routes.json');
    const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    if (!r.include.includes('/kereses-index.json') && r.include.length < 100) { r.include.push('/kereses-index.json'); fs.writeFileSync(rp, JSON.stringify(r, null, 2)); }
  } catch (e) { log('_routes.json nem módosítható:', e.message); }
  // verzió a gyorsítótár-ürítéshez
  let ver = 'x';
  try { ver = crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, 'kereses.js')) + fs.readFileSync(path.join(ROOT, 'kereses.css'))).digest('hex').slice(0, 8); } catch { log('figyelem: hiányzik a dist/kereses.js vagy kereses.css'); }
  const n = inject(walk(ROOT), ver);
  log(`index: ${total} elem összesen · gomb + script ${n} oldalon · v=${ver}`);
} catch (e) {
  log('HIBA (a build folytatódik):', e && e.stack || e);
}
process.exit(0);
