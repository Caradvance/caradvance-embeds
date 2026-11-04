// Saját raktári bérautók (Google Sheet → generate.mjs → public/autoink/index.html „Prémium autók raktárról” rács)
// build-időben, UGYANÚGY kiolvasva, mint a seo-abo.mjs (window.__ABSTOCK) — így a Részletek-oldal és a kártya egyezik.
// A Choice-ban nem szereplő modellek (pl. BMW X5, X7) ebből kapnak saját /berelheto-auto/<slug>-berles oldalt
// (rental.ts). Marc, 2026-11-04.
import fs from 'node:fs';
import path from 'node:path';

export interface StockCar { u: string; b: string; k: string; f: string; t: string; y: string; s: string; i: string; r: number[][]; d: number; }

// Nem bérelhető raktári autók (Marc, 2026-11-04: „delete the M3 and delete the i5”) — a stock-rent.mjs és a rent-data.js ugyanezt szűri.
export const STOCK_EXCLUDE = /^BMW (M3|i5)\b/i;
// Az Excel-árlista szerinti bérelhető modellek, amelyek a Sheetben csak eladóként szerepelnek (mint a seo-abo.mjs EXTRA_RENT)
const EXTRA_RENT = [{ re: /^BMW X7\b/i, d: 7500, r: [[2000, 1870], [3000, 2250]] }];

const de = (x: string) => String(x || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const num = (x: string) => parseInt(String(x || '').replace(/[^0-9]/g, ''), 10) || 0;

let cache: StockCar[] | undefined;
export function stockCars(): StockCar[] {
  if (cache !== undefined) return cache;
  cache = [];
  try {
    const cands = ['public/autoink/index.html', '.gen/autoink/index.html'].map((p) => path.resolve(process.cwd(), p));
    const file = cands.find((f) => fs.existsSync(f));
    if (!file) return cache;
    const h = fs.readFileSync(file, 'utf8');
    const card = (m: RegExpExecArray): StockCar | null => {
      const at = m[2], body = m[3];
      const ga = (n: string) => ((at.match(new RegExp(n + '="([^"]*)"')) || [])[1] || '');
      const title = de((body.match(/<h3 class="title">([^<]*)/) || [])[1]);
      if (!title) return null;
      const rows: number[][] = []; const rr = /<div class="rp"><span>([^<]*)<\/span><b>([^<€]*)€/g; let r2;
      while ((r2 = rr.exec(body))) rows.push([num(r2[1]), num(r2[2])]);
      return {
        u: '/' + m[1].replace(/^(\.\.\/)+/, '').replace(/^\/+/, ''),
        b: de(ga('data-marka')) || title.split(' ')[0], k: de(ga('data-kar')), f: de(ga('data-uz')), t: title,
        y: de((body.match(/<span class="year">([^<]*)/) || [])[1]), s: de((body.match(/<div class="specs">([^<]*)/) || [])[1]),
        i: de((body.match(/<img[^>]*?src="([^"]+)"/) || [])[1]), r: rows, d: num((body.match(/<div class="rp kau"><span>Kaució<\/span><b>([^<€]*)€/) || [])[1]),
      };
    };
    // 1) a bérelhető panel raktári rácsa
    const pi = h.indexOf('<div class="autok-panel" id="panel-berelheto">');
    if (pi > -1) {
      const be = h.indexOf('<div class="autok-panel"', pi + 40);
      const seg = h.slice(pi, be > -1 ? be : h.length);
      const re = /<a class="card[^"]*" href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g; let m;
      while ((m = re.exec(seg))) { const c = card(m); if (c && c.r.length) cache.push(c); }
    }
    // 2) EXTRA_RENT: eladó listán szereplő, de bérelhető autók (BMW X7)
    const ep = h.indexOf('id="panel-eladas"');
    if (ep > -1) {
      const ee = h.indexOf('<div class="autok-panel"', ep + 20);
      const seg = h.slice(ep, ee > -1 ? ee : h.length);
      const have = new Set(cache.map((x) => x.u));
      const re = /<a class="card(?! sold)[^"]*" href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g; let m;
      while ((m = re.exec(seg))) {
        const c = card(m); if (!c) continue;
        const rule = EXTRA_RENT.find((x) => x.re.test(c.t)); if (!rule || have.has(c.u)) continue;
        have.add(c.u); c.r = rule.r; c.d = rule.d; cache.push(c);
      }
    }
    cache = cache.filter((c) => !STOCK_EXCLUDE.test(c.t));
  } catch (e: any) { console.log('rentalStock: hiba - ' + (e && e.message)); cache = []; }
  return cache;
}
