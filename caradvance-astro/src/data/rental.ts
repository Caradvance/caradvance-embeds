// Bérlési adatok build-időben, UGYANABBÓL a forrásból, mint az /autoink "Bérelhető" kártyák.
//
// A napi Choice-szinkron (11:15) a seo-abo.mjs-t frissíti: abban van a kártyák adata
// (window.SUB), a foglaló ablak konfigurációja (window.__ABCFG) és a fotók (PHOTO).
// Ez a modul a build elején kiolvassa ezeket, így a Részletek oldalak ára, futáskerete,
// futamideje, kauciója, változatai és elérhetősége mindig egyezik a kártyával — kézzel
// beírt számok nélkül. Hiba esetén null-t / üres listát ad, a build nem áll meg.
//
// FONTOS: a huName() / rentSlug() logikát a kártya JS-e (seo-abo.mjs, rslug) is ugyanígy
// számolja, hogy a "Részletek" gomb a helyes oldalra mutasson.
import fs from 'node:fs';
import path from 'node:path';
import { stockCars } from './rentalStock';

export interface RentalTrim { name: string; eur: number; huf: number; dep: number; depHuf: number; fuel: string; }
export interface RentalRelated { key: string; name: string; href: string; img: string; eur: number; huf: number; }
export interface RentalData {
  key: string; brand: string; model: string; name: string; slug: string; cat: string;
  count: number; now: number; later: { d: string; c: number }[];
  fuels: string[]; gears: string[]; km: number[]; months: number[];
  psMin: number; psMax: number; packages: string[];
  eur: number; huf: number; dep: number; depHuf: number;
  trims: RentalTrim[]; colors: string[]; colorsHex?: string[]; avail: string[]; rate: number;
  photo: string; related: RentalRelated[];
  stock?: boolean; years?: string; // saját raktári (nem Choice) modell: használt, kevés km-es autók — nem „vadonatúj, 0 km”
}

const MARGIN = 750; // ugyanaz, mint a kártyán: effNet = net + 750 (km-pricing.mjs: a 2 000 km/hó keret ára)
let cache: { SUB: any; CFG: any; PHOTO: any } | null | undefined;

function extract(src: string, marker: string): any {
  const i = src.indexOf(marker);
  if (i < 0) return null;
  const j = i + marker.length;
  let depth = 0, inStr = false, q = '', esc = false, k = j;
  for (; k < src.length; k++) {
    const ch = src[k];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === q) inStr = false; continue; }
    if (ch === '"' || ch === "'") { inStr = true; q = ch; continue; }
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') { depth--; if (depth === 0) { k++; break; } }
  }
  const txt = src.slice(j, k);
  try { return JSON.parse(txt); } catch { try { return new Function('return (' + txt + ')')(); } catch { return null; } }
}

function load() {
  if (cache !== undefined) return cache;
  cache = null;
  try {
    const cands = [path.resolve(process.cwd(), 'seo-abo.mjs'), path.resolve(process.cwd(), 'caradvance-astro', 'seo-abo.mjs')];
    const file = cands.find((f) => fs.existsSync(f));
    if (!file) { console.log('rental: nincs seo-abo.mjs'); return cache; }
    const src = fs.readFileSync(file, 'utf8');
    const b64 = (src.match(/const SEC_B64 = "([^"]+)"/) || [])[1];
    const stripLit = (src.match(/const STRIP = ("(?:[^"\\]|\\.)*")/) || [])[1];
    if (!b64 || !stripLit) { console.log('rental: SEC_B64/STRIP nem található'); return cache; }
    const sec = Buffer.from(b64, 'base64').toString('utf8');
    const strip = JSON.parse(stripLit);
    const SUB = extract(sec, 'window.SUB=');
    const CFG = extract(strip, 'window.__ABCFG=');
    const PHOTO = extract(sec, 'var PHOTO=') || {};
    if (!SUB || !CFG) { console.log('rental: SUB/__ABCFG nem olvasható'); return cache; }
    addStockModels(SUB, PHOTO);
    cache = { SUB, CFG, PHOTO };
  } catch (e: any) { console.log('rental: hiba - ' + (e && e.message)); cache = null; }
  return cache;
}

// ---- saját raktári modellek, amelyeknek nincs Choice-kínálata (pl. BMW X5, X7): ugyanúgy, mint a kártya JS-e (seo-abo) ----
// A havidíj a táblázat 2 000 km-es ára + 100 € (km-pricing.mjs), a kaució a táblázatból; minden autó külön kivitelként jelenik meg.
const STOCK_FUEL: Record<string, string> = { diesel: 'Dízel', benzin: 'Benzin', elektro: 'Elektromos' };
const stockFuel = (f: string) => { const x = String(f || '').toLowerCase(); return /hybrid|hibrid/.test(x) ? 'Hibrid' : (STOCK_FUEL[x] || ''); };
const nz = (x: string) => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function addStockModels(SUB: any, PHOTO: any) {
  try {
    const M: any[] = SUB.models || (SUB.models = []);
    let egy: { b: string; n: string; img: string }[] = [];
    try {
      const src = fs.readFileSync(path.resolve(process.cwd(), 'src/data/egyediCars.ts'), 'utf8');
      const rr = /\{"brand":\s*"([^"]+)",\s*"key":\s*"[^"]*",\s*"name":\s*"([^"]+)"[^}]*?"img":\s*"([^"]+)"/g; let q;
      while ((q = rr.exec(src))) egy.push({ b: q[1], n: q[2], img: q[3] });
    } catch {}
    for (const c of stockCars()) {
      const br = c.b, bn = nz(br), rest = nz(c.t).replace(new RegExp('^' + bn + '\\s*'), '');
      if (M.some((m: any) => !m.stockOnly && nz(m.brand) === bn && nz(m.model) && (rest + ' ').indexOf(nz(m.model) + ' ') === 0)) continue; // Choice-modellbe olvad (pl. X6)
      const w = String(c.t).replace(new RegExp('^' + br + '\\s*', 'i'), '').split(/\s+/)[0] || '';
      if (!w || !(c.r && c.r[0])) continue;
      let m = M.find((x: any) => x.stockOnly && x.brand === br && x.model === w);
      if (!m) {
        m = { brand: br, model: w, cat: c.k === 'SUV' ? 'SUV / Terepjáró' : (c.k || ''), count: 0, now: 0, later: [], colors: [], variants: [], packages: [], fuels: [], gears: ['Automata'], km: [2000, 3000, 4000], months: [6], psMin: 0, psMax: 0, net: 0, stockOnly: true, __stock: [] };
        M.push(m);
        const key = br + ' ' + w;
        if (!PHOTO[key]) { const e = egy.find((x) => x.b === br && x.n === key); if (e) PHOTO[key] = e.img; }
      }
      m.count++; m.now++; m.__stock.push(c);
      const f = stockFuel(c.f); if (f && !m.fuels.includes(f)) m.fuels.push(f);
      const b0 = c.r.find((r) => +r[0] === 2000) || c.r.slice().sort((a, b) => a[0] - b[0])[0];
      const eur = b0[1] + 100;
      if (!m.net || eur - MARGIN < m.net) m.net = eur - MARGIN;
    }
  } catch (e: any) { console.log('rental: raktári modellek hiba - ' + (e && e.message)); }
}

// ---- magyar modellnév + URL-slug (a kártya JS-e ugyanezt számolja) ----
const DIG: Record<string, string> = { '1': '1-es', '2': '2-es', '3': '3-as', '4': '4-es', '5': '5-ös', '6': '6-os', '7': '7-es', '8': '8-as' };
export function huName(brand: string, model: string): string {
  const b = brand === 'VW' ? 'Volkswagen' : brand;
  const m = String(model)
    .replace(/\b(\d)er\b/g, (_: string, d: string) => DIG[d] || d)
    .replace(/\bLimousine\b/g, 'Limuzin')
    .replace(/\bCoupe\b/g, 'Coupé')
    .replace(/\b([A-Z])-Klasse\b/g, '$1-osztály');
  return b + ' ' + m;
}
export function slugify(s: string): string {
  return String(s).toLowerCase()
    .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/í/g, 'i').replace(/[óöő]/g, 'o').replace(/[úüű]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
export const rentSlug = (brand: string, model: string) => slugify(huName(brand, model));
export const rentHref = (brand: string, model: string) => '/berelheto-auto/' + rentSlug(brand, model) + '-berles';

const toHuf = (eur: number, R: number) => Math.ceil((eur * R) / 10000) * 10000;
const toDepHuf = (eur: number, R: number) => Math.round((eur * R) / 1000) * 1000;

export function listRentals(): { brand: string; model: string; key: string }[] {
  const d = load();
  if (!d) return [];
  return (d.SUB.models || []).filter((m: any) => m && m.brand && m.model && m.net).map((m: any) => ({ brand: m.brand, model: m.model, key: m.brand + ' ' + m.model }));
}

export function getRental(brand: string, model: string): RentalData | null {
  const d = load();
  if (!d) return null;
  const { SUB, CFG, PHOTO } = d;
  const R = Number(SUB.rate_fallback) || 364;
  const m = (SUB.models || []).find((x: any) => x.brand === brand && x.model === model);
  if (!m || !m.net) { console.log('rental: nincs adat - ' + brand + ' ' + model); return null; }
  const key = brand + ' ' + model;
  const c = CFG[key] || null;
  const eur = m.net + MARGIN;

  let trims: RentalTrim[] = [];
  let dep = 0;
  if (m.stockOnly && Array.isArray(m.__stock)) {
    const seen = new Map<string, RentalTrim>();
    for (const s of m.__stock) {
      const b0 = s.r.find((r: number[]) => +r[0] === 2000) || s.r.slice().sort((a: number[], b: number[]) => a[0] - b[0])[0];
      const tEur = b0[1] + 100;
      const name = String(s.t).replace(new RegExp('^' + brand + '\\s+' + model + '\\s*', 'i'), '').trim() || model;
      const t = { name, eur: tEur, huf: toHuf(tEur, R), dep: s.d || 0, depHuf: toDepHuf(s.d || 0, R), fuel: stockFuel(s.f) || 'Dízel' };
      const prev = seen.get(name); if (!prev || t.eur < prev.eur) seen.set(name, t);
    }
    trims = Array.from(seen.values()).sort((a, b) => a.eur - b.eur);
    dep = trims.length ? Math.min(...trims.map((t) => t.dep)) : 0;
  } else if (c && Array.isArray(c.X) && Array.isArray(c.TR)) {
    trims = c.TR.map((name: string, ti: number) => {
      const rows = c.X.filter((r: number[]) => r[4] === ti);
      if (!rows.length) return null;
      const tEur = Math.min(...rows.map((r: number[]) => r[7])) + MARGIN;
      const tDep = Math.min(...rows.map((r: number[]) => r[6]));
      const fuel = Array.from(new Set(rows.map((r: number[]) => c.F[r[0]]))).join(' / ');
      return { name, eur: tEur, huf: toHuf(tEur, R), dep: tDep, depHuf: toDepHuf(tDep, R), fuel };
    }).filter(Boolean) as RentalTrim[];
    trims.sort((a, b) => a.eur - b.eur);
    if (c.X.length) dep = Math.min(...c.X.map((r: number[]) => r[6]));
  }

  const related: RentalRelated[] = (SUB.models || [])
    .filter((x: any) => x.brand === brand && x.model !== model && x.net)
    .sort((a: any, b: any) => (String(a.cat) === String(m.cat) ? 0 : 1) - (String(b.cat) === String(m.cat) ? 0 : 1) || Math.abs(a.net - m.net) - Math.abs(b.net - m.net))
    .slice(0, 4)
    .map((x: any) => {
      const e = x.net + MARGIN;
      return { key: brand + ' ' + x.model, name: huName(brand, x.model), href: rentHref(brand, x.model), img: String(PHOTO[brand + ' ' + x.model] || ''), eur: e, huf: toHuf(e, R) };
    });

  return {
    key, brand, model, name: huName(brand, model), slug: rentSlug(brand, model), cat: m.cat || '',
    count: m.count || 0, now: m.now || 0, later: m.later || [],
    fuels: m.fuels || [], gears: m.gears || [], km: m.km || [], months: m.months || [],
    psMin: m.psMin || 0, psMax: m.psMax || 0, packages: m.packages || [],
    eur, huf: toHuf(eur, R), dep, depHuf: toDepHuf(dep, R),
    trims, colors: (m.colors || []).map((x: any) => x.n), colorsHex: (m.colors || []).map((x: any) => x.n + '¦' + (x.h || '#ccc')), avail: (c && c.A) || [], rate: R,
    photo: String(PHOTO[key] || ''), related,
    ...(m.stockOnly ? { stock: true, years: Array.from(new Set((m.__stock || []).map((s: any) => (String(s.y).match(/(\d{4})/) || [])[1]).filter(Boolean))).sort().join(', ') } : {}),
  };
}

export const fmtNum = (n: number) => new Intl.NumberFormat('hu-HU').format(n);
