// CarAdvance CRM — az ügyfél válasza egy kiküldött ajánlatra (nyilvános, bejelentkezés nélkül).
// Route: www.caradvance.hu/api/crm-ajanlat/*   (oldal: /ajanlat/valasz/?t=<token>)
// Csak a véletlen, kitalálhatatlan token által címzett sort olvassa/írja.
// A státusz CSAK a POST-ra változik (az e-mailes link megnyitása önmagában nem — a levelezők
// biztonsági előtöltése így nem fogad el ajánlatot az ügyfél helyett).
import { ensureCrm, json, parseJ, clean, cleanMulti, saveCard, getCard, sendCrmMail, notifyTo, esc, priceLabel, specLine, SITE } from '../../../lib/crm.js';

const TOKEN_RE = /^[a-f0-9]{40}$/;
const PUBLIC_KEYS = ['title', 'brand', 'year', 'km', 'fuel', 'power', 'gearbox', 'image', 'url', 'note', 'price', 'currency', 'period'];

async function getOffer(env, token) {
  if (!TOKEN_RE.test(token)) return { error: json({ error: 'Érvénytelen ajánlat-hivatkozás.' }, 400) };
  const row = await env.DB.prepare(`SELECT * FROM crm_offers WHERE token = ?`).bind(token).first();
  if (!row) return { error: json({ error: 'Ez az ajánlat nem található, vagy már nem érvényes.' }, 404) };
  return { row };
}

async function handleGet(env, token) {
  const { row, error } = await getOffer(env, token); if (error) return error;
  const items = parseJ(row.items, []).map((it) => { const o = {}; for (const k of PUBLIC_KEYS) o[k] = it[k]; o.spec = specLine(it); o.priceLabel = priceLabel(it); return o; });
  const newer = await env.DB.prepare(`SELECT 1 FROM crm_offers WHERE deal_id = ? AND created_at > ? LIMIT 1`).bind(row.deal_id, row.created_at).first();
  return json({
    clientName: row.client_name || '', line: row.line || '', message: row.message || '', items, createdAt: row.created_at,
    responded: !!row.responded_at, action: row.action || null, choice: row.choice, clientMsg: row.client_msg || '', superseded: !!newer
  });
}

async function handleRespond(request, env, token) {
  const { row, error } = await getOffer(env, token); if (error) return error;
  if (row.responded_at) return json({ error: 'Erre az ajánlatra már válaszolt — köszönjük! Ha mégis változtatna, írjon nekünk vagy hívjon.' }, 409);
  const b = await request.json().catch(() => ({}));
  const action = b.action === 'elfogad' ? 'elfogad' : b.action === 'modosit' ? 'modosit' : '';
  if (!action) return json({ error: 'Ismeretlen művelet.' }, 400);
  const items = parseJ(row.items, []);
  const choice = Number.isInteger(b.choice) && b.choice >= 0 && b.choice < items.length ? b.choice : (items.length === 1 ? 0 : -1);
  if (action === 'elfogad' && choice < 0) return json({ error: 'Válassza ki, melyik autót kéri.' }, 400);
  const msg = cleanMulti(b.message, 2000).trim();
  if (action === 'modosit' && !msg) return json({ error: 'Kérjük, írja le röviden, mit módosítanánk.' }, 400);
  const ip = clean(request.headers.get('CF-Connecting-IP') || '', 60);
  const upd = await env.DB.prepare(`UPDATE crm_offers SET responded_at = datetime('now'), action = ?, choice = ?, client_msg = ?, client_ip = ? WHERE token = ? AND responded_at IS NULL`)
    .bind(action, choice >= 0 ? choice : null, msg, ip, token).run();
  if (!upd.meta || !upd.meta.changes) return json({ error: 'Erre az ajánlatra már válaszolt.' }, 409);

  await ensureCrm(env);
  const status = action === 'elfogad' ? 'Ajánlat elfogadva' : 'Ajánlat módosítva';
  // az elfogadott autó adataival kitöltjük az adatlap üres gépjármű-mezőit
  const it0 = choice >= 0 ? items[choice] : null;
  const fields = { status };
  if (action === 'elfogad' && it0) {
    const card = await getCard(env, row.deal_id);
    const data = card.data || {}; const v = { ...(data.vehicle || {}) };
    const fill = { brand: it0.brand, model: it0.brand && it0.title.indexOf(it0.brand) === 0 ? it0.title.slice(it0.brand.length).trim() : it0.title, year: it0.year, fuel: it0.fuel, km: it0.km, engine: it0.power };
    let changed = false;
    for (const [k, val] of Object.entries(fill)) if (!v[k] && val) { v[k] = String(val).slice(0, 200); changed = true; }
    if (changed) fields.data = { ...data, vehicle: v };
  }
  await saveCard(env, row.deal_id, fields, null);

  const it = choice >= 0 ? items[choice] : null;
  try {
    await sendCrmMail(env, notifyTo(env), `${action === 'elfogad' ? 'Ajánlat ELFOGADVA' : 'Módosítást kér'}: ${row.client_name || 'ügyfél'}${it ? ' — ' + it.title : ''}`,
      `<p><b>${esc(row.client_name || 'Az ügyfél')}</b> ${action === 'elfogad' ? 'elfogadta az ajánlatot.' : 'módosítást kért az ajánlaton.'}</p>
       ${it ? `<p>Választott autó: <b>${esc(it.title)}</b><br>${esc(priceLabel(it))}</p>` : ''}
       ${msg ? `<p>Üzenet:<br><i style="white-space:pre-line">${esc(msg)}</i></p>` : ''}
       <p><a href="${SITE}/belso/ugyfel/?id=${row.deal_id}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px;display:inline-block">Ügyfél adatlap megnyitása</a></p>`);
  } catch (e) { /* az értesítés hibája nem akadályozza az ügyfél válaszát */ }
  return json({ ok: true, action, choice });
}

export async function onRequest(context) {
  const { request, env } = context;
  const path = new URL(request.url).pathname.replace(/^\/api\/crm-ajanlat/, '') || '/';
  try {
    let m = path.match(/^\/([a-f0-9]{40})$/);
    if (m && request.method === 'GET') return await handleGet(env, m[1]);
    m = path.match(/^\/([a-f0-9]{40})\/valasz$/);
    if (m && request.method === 'POST') return await handleRespond(request, env, m[1]);
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Szerver hiba. Kérjük, próbálja újra, vagy hívjon minket: +36 30 233 6060.' }, 500);
  }
}
