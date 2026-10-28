// CarAdvance CRM — az ügyfél válasza egy kiküldött ajánlatra (nyilvános, bejelentkezés nélkül).
// Route: www.caradvance.hu/api/crm-ajanlat/*   (oldal: /ajanlat/valasz/?t=<token>)
// Csak a véletlen, kitalálhatatlan token által címzett sort olvassa/írja.
// A státusz CSAK a POST-ra változik (az e-mailes link megnyitása önmagában nem — a levelezők
// biztonsági előtöltése így nem fogad el ajánlatot az ügyfél helyett).
import { ensureCrm, addEvent, json, parseJ, clean, cleanMulti, saveCard, getCard, vehiclesOf, itemToVehicle, newVehicleId, VEH_KEYS, sendCrmMail, notifyTo, esc, priceLabel, specLine, idLine, SITE } from '../../../lib/crm.js';

const TOKEN_RE = /^[a-f0-9]{40}$/;
const PUBLIC_KEYS = ['title', 'brand', 'year', 'km', 'fuel', 'power', 'gearbox', 'color', 'image', 'url', 'note', 'price', 'currency', 'period', 'ad_id', 'config_code'];

async function getOffer(env, token) {
  if (!TOKEN_RE.test(token)) return { error: json({ error: 'Érvénytelen ajánlat-hivatkozás.' }, 400) };
  const row = await env.DB.prepare(`SELECT * FROM crm_offers WHERE token = ?`).bind(token).first();
  if (!row) return { error: json({ error: 'Ez az ajánlat nem található, vagy már nem érvényes.' }, 404) };
  return { row };
}

async function handleGet(env, token) {
  const { row, error } = await getOffer(env, token); if (error) return error;
  const items = parseJ(row.items, []).map((it) => { const o = {}; for (const k of PUBLIC_KEYS) o[k] = it[k]; o.spec = specLine(it); o.ids = idLine(it); o.priceLabel = priceLabel(it); return o; });
  if (!row.responded_at) {
    const seen = await env.DB.prepare(`SELECT 1 FROM crm_events WHERE deal_id = ? AND kind = ? LIMIT 1`).bind(row.deal_id, 'opened:' + token.slice(0, 12)).first().catch(() => null);
    if (!seen) await addEvent(env, row.deal_id, 'opened:' + token.slice(0, 12), `Ügyfél megnyitotta az ajánlatot (kiküldve: ${new Date(String(row.created_at).replace(' ', 'T') + 'Z').toLocaleString('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })})`, 'Ügyfél');
  }
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
  // az elfogadott autó bekerül az adatlap autói közé (ha még nincs ott); egy üres, kézi autót kitölt
  const it0 = choice >= 0 ? items[choice] : null;
  const fields = { status };
  if (action === 'elfogad' && it0) {
    const card = await getCard(env, row.deal_id);
    const data = card.data || {}; const list = vehiclesOf(data).slice();
    const empty = (v) => !v.title && !VEH_KEYS.some((k) => v[k]);
    if (!list.some((v) => (it0.key && v.key === it0.key) || (v.title && v.title === it0.title))) {
      const ei = list.findIndex(empty);
      if (ei >= 0) list[ei] = { ...itemToVehicle(it0, list[ei].id, 'offer'), vin: list[ei].vin || '', color: list[ei].color || '' };
      else list.push(itemToVehicle(it0, newVehicleId(list), 'offer'));
      fields.data = { ...data, vehicles: list, vehicle: list[0] };
    }
  }
  await saveCard(env, row.deal_id, fields, null, 'Ügyfél', 'válasz az ajánlatra');
  const pick = choice >= 0 ? items[choice] : null;
  await addEvent(env, row.deal_id, 'client', action === 'elfogad'
    ? `Ügyfél elfogadta az ajánlatot: ${pick ? pick.title + ' (' + priceLabel(pick) + ')' : ''}${msg ? ' — üzenet: ' + msg : ''}`
    : `Ügyfél módosítást kért${pick ? ' (' + pick.title + ')' : ''}: ${msg}`, 'Ügyfél');

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
    await ensureCrm(env);
    let m = path.match(/^\/([a-f0-9]{40})$/);
    if (m && request.method === 'GET') return await handleGet(env, m[1]);
    m = path.match(/^\/([a-f0-9]{40})\/valasz$/);
    if (m && request.method === 'POST') return await handleRespond(request, env, m[1]);
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Szerver hiba. Kérjük, próbálja újra, vagy hívjon minket: +36 30 233 6060.' }, 500);
  }
}
