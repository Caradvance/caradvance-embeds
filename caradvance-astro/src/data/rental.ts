// Bérlési adatok build-időben, UGYANABBÓL a forrásból, mint az /autoink "Bérelhető" kártyák.
//
// A napi Choice-szinkron (11:15) a seo-abo.mjs-t frissíti: abban van a kártyák adata
// (window.SUB), a foglaló ablak konfigurációja (window.__ABCFG) és a fotók (PHOTO).
// Ez a modul a build elején kiolvassa ezeket, így a Részletek oldalak (pl. BMW X3 bérlés)
// ára, futáskerete, futamideje, kauciója, változatai és elérhetősége mindig egyezik a
// kártyával — kézzel beírt számok nélkül. Hiba esetén null-t ad, a build nem áll meg.
import fs from 'node:fs';
import path from 'node:path';

export interface RentalTrim { name: string; eur: number; huf: number; dep: number; depHuf: number; fuel: string; }
export interface RentalRelated { name: string; href: string; img: string; eur: number; huf: number; }
export interface RentalData {
  key: string; brand: string; model: string; cat: string;
  count: number; now: number; later: { d: string; c: number }[];
  fuels: string[]; gears: string[]; km: number[]; months: number[];
  eur: number; huf: number; dep: number; depHuf: number;
  trims: RentalTrim[]; colors: string[]; avail: string[]; rate: number;
  related: RentalRelated[];
}

const MARGIN = 650; // ugyanaz, mint a kártyán: effNet = net + 650
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
    cache = { SUB, CFG, PHOTO };
  } catch (e: any) { console.log('rental: hiba - ' + (e && e.message)); cache = null; }
  return cache;
}

const dn = (s: string) => String(s).replace(/(\d)er\b/g, '$1').replace(/^VW(?=\s|$)/, 'Volkswagen');
const toHuf = (eur: number, R: number) => Math.ceil((eur * R) / 10000) * 10000;
const toDepHuf = (eur: number, R: number) => Math.round((eur * R) / 1000) * 1000;

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
  if (c && Array.isArray(c.X) && Array.isArray(c.TR)) {
    trims = c.TR.map((name: string, ti: number) => {
      const rows = c.X.filter((r: number[]) => r[4] === ti);
      if (!rows.length) return null;
      const tEur = Math.min(...rows.map((r: number[]) => r[7])) + MARGIN;
      const tDep = Math.min(...rows.map((r: number[]) => r[6]));
      const fuel = Array.from(new Set(rows.map((r: number[]) => c.F[r[0]]))).join(' / ');
      return { name, eur: tEur, huf: toHuf(tEur, R), dep: tDep, depHuf: toDepHuf(tDep, R), fuel };
    }).filter(Boolean) as RentalTrim[];
    trims.sort((a, b) => a.eur - b.eur);
    dep = Math.min(...c.X.map((r: number[]) => r[6]));
  }

  const related: RentalRelated[] = (SUB.models || [])
    .filter((x: any) => x.brand === brand && x.model !== model && x.net && String(x.cat) === String(m.cat))
    .sort((a: any, b: any) => Math.abs(a.net - m.net) - Math.abs(b.net - m.net))
    .slice(0, 4)
    .map((x: any) => {
      const e = x.net + MARGIN;
      return { name: dn(brand + ' ' + x.model), href: '/autoink#berelheto', img: String(PHOTO[brand + ' ' + x.model] || ''), eur: e, huf: toHuf(e, R) };
    });

  return {
    key, brand, model, cat: m.cat || '',
    count: m.count || 0, now: m.now || 0, later: m.later || [],
    fuels: m.fuels || [], gears: m.gears || [], km: m.km || [], months: m.months || [],
    eur, huf: toHuf(eur, R), dep, depHuf: toDepHuf(dep, R),
    trims, colors: (m.colors || []).map((x: any) => x.n), avail: (c && c.A) || [], rate: R,
    related,
  };
}

export const fmtNum = (n: number) => new Intl.NumberFormat('hu-HU').format(n);
