// /api/uzemanyagar — a NAV hivatalos, havonta közzétett üzemanyagárai (benzin, gázolaj).
// Forrás: https://nav.gov.hu/ugyfeliranytu/uzemanyag/<év>-ban|ben-alkalmazhato-uzemanyagarak
// A választ 12 órára gyorsítótárazzuk (Cloudflare Cache API), így a NAV oldalát naponta legfeljebb 2x kérjük le.
// Hiba esetén a FALLBACK értékeket adja vissza, hogy a kalkulátor sose maradjon üresen.

const FALLBACK = { benzin: 605, dizel: 681, honap: 'október', ev: 2026, forras: 'NAV', fallback: true };

function urls(year) {
  const base = 'https://nav.gov.hu/ugyfeliranytu/uzemanyag/';
  return [`${base}${year}-ban-alkalmazhato-uzemanyagarak`, `${base}${year}-ben-alkalmazhato-uzemanyagarak`];
}

const num = (s) => { const n = parseInt(String(s).replace(/[^\d]/g, ''), 10); return Number.isFinite(n) && n > 100 && n < 2000 ? n : null; };
const clean = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function parseNav(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => clean(c[1])));
  // Első adatsor = legfrissebb hónap. Oszlopok: hónap | benzin védett | benzin piaci | gázolaj védett | gázolaj piaci | keverék | LPG | CNG
  for (const r of rows) {
    if (r.length >= 5 && /^(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)$/i.test(r[0])) {
      const benzin = num(r[2]) ?? num(r[1]);
      const dizel = num(r[4]) ?? num(r[3]);
      if (benzin && dizel) return { benzin, dizel, honap: r[0].toLowerCase() };
    }
  }
  return null;
}

export async function onRequestGet(ctx) {
  const cache = caches.default;
  const key = new Request('https://cache.caradvance.hu/api/uzemanyagar-v1');
  const hit = await cache.match(key);
  if (hit) return hit;

  const year = new Date().getFullYear();
  let out = null;
  for (const y of [year, year - 1]) {
    for (const u of urls(y)) {
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarAdvance-kalkulator/1.0)' }, cf: { cacheTtl: 43200 } });
        if (!r.ok) continue;
        const p = parseNav(await r.text());
        if (p) { out = { ...p, ev: y, forras: 'NAV', url: u, frissitve: new Date().toISOString() }; break; }
      } catch (e) { /* következő URL */ }
    }
    if (out) break;
  }
  const body = JSON.stringify(out || FALLBACK);
  const res = new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=43200' } });
  if (out) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
