/**
 * CarAdvance — Google-tábla proxy az ár nélküli (külföldi) nézethez.
 * GET /api/sheet?s=rent | biz
 * A táblát szerveroldalon tölti le, és az ár-oszlopokat üresre állítja, így
 * a külföldi látogató böngészője az árakat egyáltalán nem kapja meg.
 * Magyar / amerikai látogató (vagy munkatársi süti) esetén a teljes táblát adja vissza.
 */
import { priceAllowed } from '../../lib/geo.js';

const BASE = 'https://docs.google.com/spreadsheets/d/1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y/gviz/tq?tqx=out:csv';
const SOURCES = { rent: BASE, biz: BASE + '&sheet=bizomanyos' };
const PRICE_COLS = new Set(['berlet_eur', 'vetel_eur', 'vetel_eur_netto', 'vetel_huf', 'kaucio_eur', 'berlet_2000_eur',
  'berlet_3000_eur', 'seo_title', 'seo_description', 'json_ld', 'ar', 'ar_eur', 'ar_huf', 'price']);

function parseCsv(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const toCsv = (rows) => rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');

export async function onRequestGet({ request }) {
  const s = new URL(request.url).searchParams.get('s');
  const src = SOURCES[s];
  if (!src) return new Response('bad source', { status: 400 });
  const r = await fetch(src, { cf: { cacheTtl: 60, cacheEverything: true } });
  if (!r.ok) return new Response('upstream error', { status: 502 });
  let body = await r.text();
  if (!(await priceAllowed(request))) {
    const rows = parseCsv(body);
    if (rows.length) {
      const idx = rows[0].map((h, i) => (PRICE_COLS.has(h.trim().toLowerCase()) ? i : -1)).filter((i) => i >= 0);
      for (let n = 1; n < rows.length; n++) for (const i of idx) if (i < rows[n].length) rows[n][i] = '';
      body = toCsv(rows);
    }
  }
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'private, no-store' } });
}
