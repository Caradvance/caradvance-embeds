// CarAdvance /belso irányítópult — a valódi megkeresések a Notion „Ügyfelek” adatbázisból
// Route: GET /api/belso-notion   (csak bejelentkezett munkatársnak — ugyanaz a ca_session süti, mint a /api/belso)
// Env: NOTION_TOKEN, NOTION_DB_ID (ugyanazok, amikkel a lead.js ír), DB (D1: sessions, users)
// Autóképek: a keresett autó márka + modell alapján a Wikipédia (Wikimedia Commons) képe, 7 napig gyorsítótárazva.

const NOTION_VERSION = '2022-06-28';
const TEST_NAME = /^(teszt|test)\b|töröld|^\d+$|^teszt\b/i;
const MULTI_MAKES = ['Alfa Romeo', 'Aston Martin', 'Land Rover', 'Range Rover', 'Rolls Royce', 'Rolls-Royce', 'Mercedes Benz', 'Mercedes-Benz', 'Lynk & Co'];
const FUEL_ONLY = /^(benzin|dízel|diesel|hibrid|hybrid|elektromos|elektro|plug-in hibrid|lpg|mindegy)$/i;

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', ...extra } });
}
function parseCookies(request) {
  const out = {}; const h = request.headers.get('cookie') || '';
  h.split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
async function sessionUser(request, env) {
  const token = parseCookies(request).ca_session; if (!token || !env.DB) return null;
  const row = await env.DB.prepare(`SELECT u.id, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).bind(token).first();
  if (!row || new Date(row.expires_at + 'Z').getTime() < Date.now()) return null;
  return row;
}

const txt = (p) => (p && (p.title || p.rich_text) ? (p.title || p.rich_text).map((t) => t.plain_text).join('') : '');
const sel = (p) => (p && p.select ? p.select.name : '');
const multi = (p) => (p && p.multi_select ? p.multi_select.map((x) => x.name) : []);

/* „Jaguar F-Pace — évjárat: 2016 – 2019 · …” → { make: 'Jaguar', model: 'F-Pace', label: 'Jaguar F-Pace' } */
function carOf(s) {
  s = String(s || '').trim(); if (!s) return null;
  let head = s.split(/\s[—–-]\s|,|\(|\n|·|;/)[0].trim();
  head = head.replace(/\s+(19|20)\d\d\+?$/, '').replace(/\s{2,}/g, ' ').trim();
  if (!head || FUEL_ONLY.test(head) || head.length > 60) return null;
  let make = '', rest = '';
  const mm = MULTI_MAKES.find((m) => head.toLowerCase().startsWith(m.toLowerCase() + ' ') || head.toLowerCase() === m.toLowerCase());
  if (mm) { make = mm.replace('Mercedes Benz', 'Mercedes-Benz'); rest = head.slice(mm.length).trim(); }
  else { const p = head.split(' '); make = p[0]; rest = p.slice(1).join(' '); }
  if (!/^[A-ZÀ-ŽŠ]/.test(make)) return null;
  const mp = rest.split(' ').filter(Boolean);
  let model = mp[0] || '';
  // pár modellnév két szóból áll („Passat CC”, „Range Rover Sport”, „Niro EV”)
  if (mp[1] && /^(CC|Variant|Touring|Avant|Sportback|Coupé|Coupe|Cabrio|Sport|Evoque|Velar|Tourer|Allspace|Cross|Active)$/i.test(mp[1])) model += ' ' + mp[1];
  return { make, model, label: (make + ' ' + model).trim() };
}

async function wikiImage(label) {
  const q = label + ' car';
  const u = 'https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=1&gsrnamespace=0&prop=pageimages&piprop=thumbnail&pithumbsize=320&gsrsearch=' + encodeURIComponent(q);
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'CarAdvance-admin/1.0 (info@caradvance.hu)' }, cf: { cacheTtl: 604800, cacheEverything: true } });
    if (!r.ok) return '';
    const j = await r.json(); const pages = j && j.query && j.query.pages; if (!pages) return '';
    const p = Object.values(pages)[0];
    return (p && p.thumbnail && p.thumbnail.source) || '';
  } catch (e) { return ''; }
}

async function queryNotion(env) {
  const out = []; let cursor;
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + env.NOTION_TOKEN, 'notion-version': env.NOTION_VERSION || NOTION_VERSION, 'content-type': 'application/json' },
      body: JSON.stringify({ page_size: 100, sorts: [{ timestamp: 'created_time', direction: 'descending' }], ...(cursor ? { start_cursor: cursor } : {}) })
    });
    if (!r.ok) throw new Error('Notion ' + r.status + ': ' + (await r.text()).slice(0, 160));
    const j = await r.json(); out.push(...(j.results || []));
    if (!j.has_more) break; cursor = j.next_cursor;
  }
  return out;
}

/* a lead.js az űrlap minden mezőjét a Notion-oldal törzsébe írja („- Autó: …”, „- Becsült havidíj: …”) —
   ha a „Keresett autó / igény” mezőben nincs autó (pl. bérlésnél csak az üzemanyag), innen olvassuk ki. */
async function pageFields(env, page) {
  const key = new Request('https://cache.caradvance.internal/notion-fields/' + page.id + '/' + encodeURIComponent(page.last_edited_time || ''));
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (cache) { const hit = await cache.match(key); if (hit) return hit.json(); }
  const r = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children?page_size=60`, {
    headers: { authorization: 'Bearer ' + env.NOTION_TOKEN, 'notion-version': env.NOTION_VERSION || NOTION_VERSION }
  });
  if (!r.ok) return {};
  const j = await r.json(); const f = {};
  (j.results || []).forEach((b) => {
    const blk = b[b.type]; if (!blk || !blk.rich_text) return;
    const t = blk.rich_text.map((x) => x.plain_text).join('');
    const m = /^([^:]{2,40}):\s*(.+)$/.exec(t); if (m && !f[m[1].trim()]) f[m[1].trim()] = m[2].trim();
  });
  const out = { car: f['Autó'] || f['Kiválasztott autó'] || '', fee: f['Becsült havidíj'] || '', price: f['Ár (tájékoztató)'] || f['Ár'] || '', page: f['Oldal'] || '',
    first: f['Első megkeresés'] || '', last: f['Utolsó aktivitás'] || '', keret: f['Keret'] || '' };
  if (cache) await cache.put(key, new Response(JSON.stringify(out), { headers: { 'cache-control': 'max-age=2592000' } }));
  return out;
}
async function limitAll(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k).catch(() => null); } }));
  return out;
}

export async function onRequestGet({ request, env }) {
  const user = await sessionUser(request, env).catch(() => null);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  if (!env.NOTION_TOKEN || !env.NOTION_DB_ID) return json({ error: 'A Notion kapcsolat nincs beállítva (NOTION_TOKEN / NOTION_DB_ID).' }, 500);
  let pages;
  try { pages = await queryNotion(env); } catch (e) { return json({ error: String(e.message || e) }, 502); }
  const leads = pages.filter((p) => !p.archived && !p.in_trash).map((p) => {
    const P = p.properties || {};
    const name = txt(P['Név']).trim();
    const want = txt(P['Keresett autó / igény']).trim();
    return {
      id: p.id, url: p.url, name, created: p.created_time, edited: p.last_edited_time,
      status: sel(P['Státusz']), tags: multi(P['Címkék']), source: sel(P['Forrás']), owner: sel(P['Felelős']),
      phone: (P['Telefon'] && P['Telefon'].phone_number) || '', email: (P['Email'] && P['Email'].email) || '',
      want, budget: (P['Költségkeret (Ft)'] && P['Költségkeret (Ft)'].number) || 0,
      next: P['Következő lépés'] && P['Következő lépés'].date ? P['Következő lépés'].date.start : null,
      car: carOf(want)
    };
  }).filter((l) => l.name && !TEST_NAME.test(l.name) && !/example\.com$/i.test(l.email));

  // hiányzó autó / havidíj: az oldal törzséből (csak ahol kell, max. 3 párhuzamos Notion-hívás)
  const byId = {}; pages.forEach((p) => { byId[p.id] = p; });
  // e-mailből felvett leadek: az oldal törzse tartalmazza az első megkeresés dátumát és a keretet (EUR)
  const need = leads.filter((l) => !l.car || !l.budget || l.source === 'E-mail').slice(0, 150);
  const fields = await limitAll(need, 3, (l) => pageFields(env, byId[l.id]));
  const isoDay = (s) => { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(s || '').trim()); return m ? m[1] : ''; };
  need.forEach((l, i) => {
    const f = fields[i] || {};
    if (!l.car && f.car) { l.car = carOf(f.car); l.carText = f.car; }
    if (f.fee) l.fee = f.fee.replace(/\s*\(.*?\)\s*$/, '').replace(/^(nettó|bruttó)\s*/i, '');
    if (!l.budget && f.price) { const n = Number(String(f.price).replace(/[^\d]/g, '')); if (n > 1000) l.budget = /€/.test(f.price) ? 0 : n; l.priceText = f.price; }
    if (!l.budget && !l.fee && f.keret) l.fee = f.keret;
    if (f.page) l.page = f.page;
    const d1 = isoDay(f.first), d2 = isoDay(f.last);
    if (d1) { l.imported = l.created; l.created = d1 + 'T09:00:00.000Z'; }
    if (d2) l.edited = d2 + 'T09:00:00.000Z';
  });
  leads.sort((a, b) => String(b.created).localeCompare(String(a.created)));

  // autóképek (márka + modell szerint, egyszer kérdezve)
  const labels = [...new Set(leads.map((l) => l.car && l.car.label).filter(Boolean))].slice(0, 60);
  const imgs = {};
  await Promise.all(labels.map(async (lb) => { imgs[lb] = await wikiImage(lb); }));
  leads.forEach((l) => { l.img = l.car ? imgs[l.car.label] || '' : ''; });

  return json({ leads, statuses: ['Új érdeklődő', 'Kapcsolatfelvétel', 'Igényfelmérés', 'Autókeresés', 'Ajánlat kiküldve', 'Foglaló beérkezett', 'Behozatal folyamatban', 'Bizomány – hirdetés alatt', 'Átadás', 'Lezárt – sikeres', 'Lezárt – elveszett'], at: new Date().toISOString() });
}
