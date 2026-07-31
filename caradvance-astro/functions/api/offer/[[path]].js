// CarAdvance public "choose your car" offer API — no login, no cookies.
// Route: www.caradvance.hu/api/offer/*
// D1 binding name expected: DB (same Pages project binding as /api/belso/*)
//
// This is intentionally its own, separate, unauthenticated router: the person
// hitting these endpoints is the CLIENT (via a link in an email), not a
// logged-in CarAdvance user. It only ever reads/writes rows addressed by a
// random, unguessable token (see randomHex(20) in the belso API where the
// token is created) — there is no way to enumerate or browse other offers.

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}

const TOKEN_RE = /^[a-f0-9]{16,64}$/;

async function handleGetOffer(env, token) {
  if (!TOKEN_RE.test(token)) return json({ error: 'Érvénytelen ajánlat-hivatkozás.' }, 400);
  const row = await env.DB.prepare(`SELECT * FROM offer_tokens WHERE token = ?`).bind(token).first();
  if (!row) return json({ error: 'Ez az ajánlat nem található, vagy már nem érvényes.' }, 404);
  let candidates = [];
  try { candidates = JSON.parse(row.candidates_json || '[]'); } catch (e) { candidates = []; }
  let selected = [];
  try { selected = row.selected_json ? JSON.parse(row.selected_json) : []; } catch (e) { selected = []; }
  return json({
    clientName: row.client_name || '',
    car: row.car || '',
    candidates,
    responded: !!row.responded_at,
    selected
  });
}

async function handleSelectOffer(request, env, token) {
  if (!TOKEN_RE.test(token)) return json({ error: 'Érvénytelen ajánlat-hivatkozás.' }, 400);
  const row = await env.DB.prepare(`SELECT * FROM offer_tokens WHERE token = ?`).bind(token).first();
  if (!row) return json({ error: 'Ez az ajánlat nem található, vagy már nem érvényes.' }, 404);
  if (row.responded_at) return json({ error: 'Erre az ajánlatra már érkezett válasz.' }, 400);

  const b = await request.json().catch(() => ({}));
  let candidates = [];
  try { candidates = JSON.parse(row.candidates_json || '[]'); } catch (e) { candidates = []; }
  const rawPicks = Array.isArray(b.picks) ? b.picks : [];
  const picks = [...new Set(rawPicks.filter(i => Number.isInteger(i) && i >= 0 && i < candidates.length))].slice(0, 2);
  if (!picks.length) return json({ error: 'Válasszon ki legalább egy autót.' }, 400);

  const selectedCars = picks.map(i => candidates[i]);
  const now = new Date().toISOString().slice(0, 19);
  await env.DB.prepare(`UPDATE offer_tokens SET selected_json = ?, responded_at = ? WHERE token = ?`)
    .bind(JSON.stringify(selectedCars), now, token).run();
  await env.DB.prepare(`UPDATE deals SET client_picks_json = ?, client_responded_at = ? WHERE id = ?`)
    .bind(JSON.stringify(selectedCars), now, row.deal_id).run();

  return json({ ok: true, selected: selectedCars });
}

// EUR->HUF rate for the public offer page — duplicated (rather than shared) from
// the /api/belso/fx endpoint on purpose: this file has no session/auth concept at
// all, and keeping the two completely independent means a change to belso's auth
// logic can never accidentally affect this public, unauthenticated surface.
async function handleFx(env) {
  const cache = (typeof caches !== 'undefined') ? caches.default : null;
  const cacheKey = 'https://internal.cache/fx-eur-huf-public';
  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) return cached;
  try {
    const resp = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=HUF');
    if (!resp.ok) return json({ error: 'Árfolyam lekérés sikertelen.' }, 502);
    const j = await resp.json();
    const rate = j && j.rates && j.rates.HUF;
    if (!rate) return json({ error: 'Nincs HUF árfolyam.' }, 502);
    const out = json({ rate, date: j.date || null }, 200, { 'Cache-Control': 'public, max-age=3600' });
    if (cache) await cache.put(cacheKey, out.clone());
    return out;
  } catch (e) {
    return json({ error: 'Árfolyam lekérési hiba.' }, 502);
  }
}

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  let path = url.pathname;
  const prefix = '/api/offer';
  if (path.startsWith(prefix)) path = path.slice(prefix.length) || '/';
  const method = request.method;

  try {
    if (path === '/fx' && method === 'GET') return await handleFx(env);

    let m = path.match(/^\/([a-f0-9]{16,64})$/);
    if (m && method === 'GET') return await handleGetOffer(env, m[1]);

    m = path.match(/^\/([a-f0-9]{16,64})\/select$/);
    if (m && method === 'POST') return await handleSelectOffer(request, env, m[1]);

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Szerver hiba', detail: String((e && e.message) || e) }, 500);
  }
}
