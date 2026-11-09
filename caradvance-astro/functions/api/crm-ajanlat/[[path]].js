// CarAdvance CRM — az ügyfél válasza egy kiküldött ajánlatra (nyilvános, bejelentkezés nélkül).
// Route: www.caradvance.hu/api/crm-ajanlat/*   (oldal: /ajanlat/valasz/?t=<token>)
// Csak a véletlen, kitalálhatatlan token által címzett sort olvassa/írja.
// A státusz CSAK a POST-ra változik (az e-mailes link megnyitása önmagában nem — a levelezők
// biztonsági előtöltése így nem fogad el ajánlatot az ügyfél helyett).
import { ensureCrm, addEvent, json, parseJ, clean, cleanMulti, saveCard, getCard, vehiclesOf, itemToVehicle, offerFields, newVehicleId, VEH_KEYS, sendCrmMail, notifyTo, esc, priceLabel, priceVatLabel, deliveryLabel, specLine, idLine, SITE, b64ToBytes, fileData, langOf } from '../../../lib/crm.js';
import { offerErr } from '../../../lib/crmi18n.js';
// nyelv: a domain (caradvance.sk → sk, .cz → cs), magyar domainen az ajánlat piaca szerint
const hostLang = (request) => { const h = new URL(request.url).hostname; return /\.sk$/.test(h) ? 'sk' : /\.cz$/.test(h) ? 'cs' : 'hu'; };
const langFor = (hl, row) => (hl !== 'hu' ? hl : langOf(row && row.market));

const TOKEN_RE = /^[a-f0-9]{40}$/;
const PUBLIC_KEYS = ['title', 'brand', 'year', 'km', 'fuel', 'power', 'gearbox', 'color', 'image', 'url', 'note', 'price', 'currency', 'period', 'ad_id', 'config_code', 'config_url', 'vat_mode'];

async function getOffer(env, token, hl) {
  if (!TOKEN_RE.test(token)) return { error: json({ error: offerErr(hl, 'bad') }, 400) };
  const row = await env.DB.prepare(`SELECT * FROM crm_offers WHERE token = ?`).bind(token).first();
  if (!row) return { error: json({ error: offerErr(hl, 'missing') }, 404) };
  return { row };
}

async function handleGet(env, token, hl) {
  const { row, error } = await getOffer(env, token, hl); if (error) return error;
  const lang = langFor(hl, row);
  const items = parseJ(row.items, []).map((it) => { const o = {}; for (const k of PUBLIC_KEYS) o[k] = it[k]; o.spec = specLine(it, lang); o.ids = idLine(it, lang); o.priceLabel = priceVatLabel(it, lang); o.delivery = deliveryLabel(it, lang); return o; });
  if (!row.responded_at) {
    const seen = await env.DB.prepare(`SELECT 1 FROM crm_events WHERE deal_id = ? AND kind = ? LIMIT 1`).bind(row.deal_id, 'opened:' + token.slice(0, 12)).first().catch(() => null);
    if (!seen) await addEvent(env, row.deal_id, 'opened:' + token.slice(0, 12), `Ügyfél megnyitotta az ajánlatot (kiküldve: ${new Date(String(row.created_at).replace(' ', 'T') + 'Z').toLocaleString('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })})`, 'Ügyfél');
  }
  const newer = await env.DB.prepare(`SELECT 1 FROM crm_offers WHERE deal_id = ? AND created_at > ? LIMIT 1`).bind(row.deal_id, row.created_at).first();
  return json({
    lang, clientName: row.client_name || '', line: row.line || '', message: row.message || '', items, createdAt: row.created_at,
    responded: !!row.responded_at, action: row.action || null, choice: row.choice, clientMsg: row.client_msg || '', superseded: !!newer
  });
}

async function handleRespond(request, env, token) {
  const hl = hostLang(request);
  const { row, error } = await getOffer(env, token, hl); if (error) return error;
  const lang = langFor(hl, row);
  if (row.responded_at) return json({ error: offerErr(lang, 'answered') }, 409);
  const b = await request.json().catch(() => ({}));
  const action = b.action === 'elfogad' ? 'elfogad' : b.action === 'modosit' ? 'modosit' : '';
  if (!action) return json({ error: offerErr(lang, 'action') }, 400);
  const items = parseJ(row.items, []);
  const choice = Number.isInteger(b.choice) && b.choice >= 0 && b.choice < items.length ? b.choice : (items.length === 1 ? 0 : -1);
  if (action === 'elfogad' && choice < 0) return json({ error: offerErr(lang, 'choose') }, 400);
  const msg = cleanMulti(b.message, 2000).trim();
  if (action === 'modosit' && !msg) return json({ error: offerErr(lang, 'msg') }, 400);
  const ip = clean(request.headers.get('CF-Connecting-IP') || '', 60);
  const upd = await env.DB.prepare(`UPDATE crm_offers SET responded_at = datetime('now'), action = ?, choice = ?, client_msg = ?, client_ip = ? WHERE token = ? AND responded_at IS NULL`)
    .bind(action, choice >= 0 ? choice : null, msg, ip, token).run();
  if (!upd.meta || !upd.meta.changes) return json({ error: offerErr(lang, 'answered2') }, 409);

  await ensureCrm(env);
  const status = action === 'elfogad' ? 'Ajánlat elfogadva' : 'Ajánlat módosítva';
  // az elfogadott autó bekerül az adatlap autói közé (ha még nincs ott); egy üres, kézi autót kitölt
  const it0 = choice >= 0 ? items[choice] : null;
  const fields = { status };
  if (action === 'elfogad' && it0) {
    const card = await getCard(env, row.deal_id);
    const data = card.data || {}; const list = vehiclesOf(data).slice();
    const empty = (v) => !v.title && !VEH_KEYS.some((k) => v[k]);
    const same = list.findIndex((v) => (it0.key && v.key === it0.key) || (v.title && v.title === it0.title));
    if (same < 0) {
      const ei = list.findIndex(empty);
      if (ei >= 0) list[ei] = { ...itemToVehicle(it0, list[ei].id, 'offer'), vin: list[ei].vin || '', color: list[ei].color || '' };
      else list.push(itemToVehicle(it0, newVehicleId(list), 'offer'));
    } else {
      // már szerepel: az elfogadott ajánlat ára, ajánlatszáma, dátuma, árfolyama stb. frissül rajta
      const cur = list[same];
      list[same] = { ...cur, price: Number(it0.price) || cur.price, currency: it0.currency === 'EUR' ? 'EUR' : 'HUF', period: it0.period || cur.period, deposit: Number(it0.deposit) || cur.deposit || 0, ...offerFields(it0),
        rent_start: cur.rent_start || it0.rent_start || '', rent_end: cur.rent_end || it0.rent_end || '' };
    }
    fields.data = { ...data, vehicles: list, vehicle: list[0], web_pick: null };
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
       <p><a href="${SITE}/admin/ugyfel/?id=${row.deal_id}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px;display:inline-block">Ügyfél adatlap megnyitása</a></p>`);
  } catch (e) { /* az értesítés hibája nem akadályozza az ügyfél válaszát */ }
  return json({ ok: true, action, choice });
}

/** Az ajánlatban szereplő konfigurátor-kép (e-mailben és a válaszoldalon) — csak az adott ajánlat képei érhetők el. */
async function handleImage(env, token, fid) {
  const row = await env.DB.prepare(`SELECT deal_id, items FROM crm_offers WHERE token = ?`).bind(token).first();
  if (!row || !parseJ(row.items, []).some((it) => Array.isArray(it.images) && it.images.includes(fid))) return new Response('Not found', { status: 404 });
  const f = await env.DB.prepare(`SELECT id, data, mime FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, row.deal_id).first();
  if (!f) return new Response('Not found', { status: 404 });
  return new Response(b64ToBytes(await fileData(env, f)), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=2592000, immutable', 'x-content-type-options': 'nosniff' } });
}
export async function onRequest(context) {
  const { request, env } = context;
  const path = new URL(request.url).pathname.replace(/^\/api\/crm-ajanlat/, '') || '/';
  try {
    await ensureCrm(env);
    let m = path.match(/^\/([a-f0-9]{40})$/);
    if (m && request.method === 'GET') return await handleGet(env, m[1], hostLang(request));
    m = path.match(/^\/([a-f0-9]{40})\/kep\/(\d+)$/);
    if (m && request.method === 'GET') return await handleImage(env, m[1], Number(m[2]));
    m = path.match(/^\/([a-f0-9]{40})\/valasz$/);
    if (m && request.method === 'POST') return await handleRespond(request, env, m[1]);
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: offerErr(hostLang(request), 'server') }, 500);
  }
}
