// CarAdvance CRM — ügyféllista + Ügyfél adatlap API (munkatársi, bejelentkezés szükséges)
// Route: www.caradvance.hu/api/belso-crm/*
// Ugyanazt a munkamenetet (ca_session süti) és jogosultságot használja, mint az /api/belso/*:
// admin mindent lát, a többi munkatárs csak a hozzá rendelt ügyfeleket.
import {
  ensureCrm, statusFromDeal, addEvent, listEvents, json, parseJ, clean, cleanMulti, randomHex, getCard, saveCard, inventory, STATUSES, CHECKLIST, checklistFor, checklistItems, checklistProgress, MAX_FILE, eurHuf, finSummary, vehiclesOf,
  offerEmailHtml, sendCrmMail, notifyTo, TEMPLATES, VAR_LABELS, varsFor, defaultVars, fillTemplate, contractPdfFromText,
  bytesToB64, b64ToBytes, sha256hex, priceLabel, specLine, esc, SITE,
  VAR_GROUPS, PERSON_ROLES, DOC_KINDS, getSetting, setSetting, docVars, DOC_MAX, putFile, fileData, deleteFile, maskEmail, SIGN_STATEMENT, deriveVars, DERIVED, partnerSignKeys, hashPass, marketOf, partnerTakesMarket
} from '../../../lib/crm.js';
import { jpegInfo, renderOfferPdf } from '../../../lib/docpdf.js';

// TESZT-ÜZEM: amíg ez ki van töltve, minden ügyfélnek szóló CRM e-mail (ajánlat, szerződés) erre a
// címre megy az ügyfél helyett (a tárgyban ott a valódi címzett). Éles üzemhez állítsd null-ra,
// vagy add meg a CRM_TEST_FORWARD környezeti változót üresen ("off").
const TEST_FORWARD_EMAIL = 'marc.nemethy@bhgeu.com';
function testForward(env) {
  if (env.CRM_TEST_FORWARD === 'off') return null;
  return env.CRM_TEST_FORWARD || TEST_FORWARD_EMAIL || null;
}

function parseCookies(request) {
  const out = {};
  (request.headers.get('Cookie') || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return out;
}
async function getSessionUser(request, env) {
  const token = parseCookies(request)['ca_session'];
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT u.id, u.email, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).bind(token).first();
  if (!row) return null;
  if (new Date(row.expires_at + 'Z').getTime() < Date.now()) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}
async function loadDeal(env, user, id) {
  const deal = await env.DB.prepare(`SELECT * FROM deals WHERE id = ?`).bind(id).first();
  if (!deal) return { error: json({ error: 'Az ügyfél nem található.' }, 404) };
  if (user.role !== 'admin' && deal.assigned_to !== user.id) return { error: json({ error: 'Nincs jogosultság.' }, 403) };
  return { deal };
}

/* ---------------- lista ---------------- */
async function handleList(env, user) {
  const sql = `SELECT d.id, d.line, d.stage, d.ch, d.name, d.phone, d.email, d.car, d.price, d.created_at, d.when_text, d.assigned_to, d.client_responded_at,
      c.status, c.address, c.status_at, c.data, c.checklist
    FROM deals d LEFT JOIN crm_cards c ON c.deal_id = d.id ${user.role === 'admin' ? '' : 'WHERE d.assigned_to = ?'} ORDER BY d.id DESC`;
  const st = env.DB.prepare(sql);
  const rows = (user.role === 'admin' ? await st.all() : await st.bind(user.id).all()).results || [];
  const clients = rows.map((r) => {
    const data = parseJ(r.data, {});
    const isCo = data.kind === 'ceg' && data.company && data.company.name;
    const pr = checklistProgress(r.line, parseJ(r.checklist, {}));
    return {
      id: r.id, line: r.line, ch: r.ch, name: (isCo && data.person && data.person.name) || r.name, company: isCo ? data.company.name : '', phone: r.phone, email: r.email, car: r.car,
      address: r.address || '', status: r.status || statusFromDeal(r), status_at: r.status_at,
      progress: pr.progress, done: pr.done, total: pr.total, rent: rentAlert(data), created_at: r.created_at, when_text: r.when_text, assigned_to: r.assigned_to
    };
  });
  return json({ clients, statuses: STATUSES });
}

/* ---------------- bérlet-figyelmeztetések (napi futás) ---------------- */
// POST /api/belso-crm/cron — fejléc: X-Cron-Token = env.CRON_TOKEN (ugyanaz, mint a szerződés-cronnál).
// Az esedékes (dátuma elérkezett, még el nem küldött) figyelmeztetésekről összesítő e-mail megy a munkatársaknak,
// a figyelmeztetés „elküldve” jelölést kap, és bekerül az ügyfél történésnaplójába.
async function handleCron(request, env) {
  const tok = request.headers.get('X-Cron-Token') || '';
  if (!env.CRON_TOKEN || String(env.CRON_TOKEN).length < 16 || tok !== env.CRON_TOKEN) return json({ ok: false, error: 'forbidden' }, 403);
  const today = huToday();
  const rows = (await env.DB.prepare(`SELECT c.deal_id, c.data, d.name, d.line FROM crm_cards c JOIN deals d ON d.id = c.deal_id WHERE c.data LIKE '%"reminders"%'`).all()).results || [];
  const due = [];
  for (const r of rows) {
    const data = parseJ(r.data, {}); const list = vehiclesOf(data); let changed = false;
    for (const v of list) for (const rm of (v.reminders || [])) {
      if (rm.date && rm.date <= today && !rm.sent_at) {
        rm.sent_at = new Date().toISOString().slice(0, 19).replace('T', ' '); changed = true;
        due.push({ deal_id: r.deal_id, name: r.name, line: r.line, car: v.title || [v.brand, v.model].filter(Boolean).join(' ') || 'autó', end: v.rent_end, days: v.rent_end ? daysTo(v.rent_end) : null, note: rm.note });
      }
    }
    if (changed) await saveCard(env, r.deal_id, { data: { ...data, vehicles: list } }, null);
  }
  for (const x of due) await addEvent(env, x.deal_id, 'rent', `Figyelmeztetés: bérlet lejár — ${x.car}${x.end ? ' (' + x.end + (x.days != null ? ', ' + (x.days < 0 ? Math.abs(x.days) + ' napja lejárt' : x.days + ' nap múlva') : '') + ')' : ''}${x.note ? ' · ' + x.note : ''}`, 'Rendszer');
  let mailed = false;
  if (due.length) {
    const rowsHtml = due.map((x) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee"><b>${esc(x.name || '')}</b><br><span style="color:#6b7280;font-size:12px">${esc(x.line)}</span></td><td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(x.car)}${x.note ? '<br><span style="color:#6b7280;font-size:12px">' + esc(x.note) + '</span>' : ''}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap"><b>${esc(x.end || '—')}</b><br><span style="color:${x.days != null && x.days < 0 ? '#c0392b' : '#a2660b'};font-size:12px">${x.days == null ? '' : x.days < 0 ? Math.abs(x.days) + ' napja lejárt' : x.days + ' nap van hátra'}</span></td><td style="padding:6px 8px;border-bottom:1px solid #eee"><a href="${SITE}/belso/ugyfel/?id=${x.deal_id}#s2">Adatlap</a></td></tr>`).join('');
    const r = await sendCrmMail(env, notifyTo(env), `Lejáró bérletek — ${due.length} figyelmeztetés (${today})`,
      `<p>Az alábbi bérletekhez ma esedékes figyelmeztetés tartozik:</p><table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;border-collapse:collapse">${rowsHtml}</table>`);
    mailed = r.ok;
  }
  return json({ ok: true, today, due: due.length, mailed });
}

/* ---------------- adatlap ---------------- */
async function handleGetCard(env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const card = await getCard(env, id);
  const offers = ((await env.DB.prepare(`SELECT token, items, message, sent_to, sent, created_at, responded_at, action, choice, client_msg FROM crm_offers WHERE deal_id = ? ORDER BY created_at DESC`).bind(id).all()).results || [])
    .map((o) => ({ ...o, items: parseJ(o.items, []), link: `${SITE}/ajanlat/valasz/?t=${o.token}` }));
  const files = (await env.DB.prepare(`SELECT id, name, mime, size, created_at FROM crm_files WHERE deal_id = ? AND substr(name, 1, 8) <> '__media_' AND id NOT IN (SELECT file_id FROM crm_fin WHERE deal_id = ? AND file_id IS NOT NULL) ORDER BY id`).bind(id, id).all()).results || [];
  const fin = await finList(env, id);
  const events = await listEvents(env, id);
  let users = [];
  if (user.role === 'admin') users = (await env.DB.prepare(`SELECT id, name, email FROM users ORDER BY name`).all()).results || [];
  return json({
    deal, card: { status: card.status, address: card.address, data: { ...card.data, vehicles: vehiclesOf(card.data) }, checklist: card.checklist, contract: card.contract, status_at: card.status_at, updated_at: card.updated_at },
    offers, files, events, fin, statuses: STATUSES, checklist: checklistFor(deal.line), me: user, users, testForward: testForward(env)
  });
}

const PERSON_KEYS = ['name', 'address', 'phone', 'email', 'tax', 'id_number', 'mother_name', 'birth_place', 'birth_date', 'residence', 'bank', 'licence', 'address_card', 'vpid'];
const COMPANY_KEYS = ['name', 'address', 'tax', 'reg'];
const CONTACT_KEYS = ['name', 'phone', 'email', 'role'];
const VEHICLE_KEYS = ['brand', 'model', 'year', 'vin', 'plate', 'color', 'engine', 'fuel', 'km', 'ad_id', 'config_code', 'condition', 'body', 'gearbox'];
function pick(src, keys, max) { const o = {}; src = src || {}; for (const k of keys) o[k] = clean(src[k], max || 200); return o; }
function normVehicles(b) {
  const list = Array.isArray(b.vehicles) ? b.vehicles : vehiclesOf(b);
  const seen = new Set();
  return list.slice(0, 30).map((v, i) => {
    let id = /^[a-z0-9_-]{1,20}$/i.test(v && v.id || '') ? v.id : 'v' + (i + 1);
    while (seen.has(id)) id += 'x'; seen.add(id);
    return {
      id, ...pick(v, VEHICLE_KEYS), hybrid: !!(v && v.hybrid), title: clean(v && v.title, 200),
      source: ['inv', 'offer', 'manual'].includes(v && v.source) ? v.source : 'manual', key: clean(v && v.key, 120),
      price: Math.max(0, Number(v && v.price) || 0), currency: v && v.currency === 'EUR' ? 'EUR' : 'HUF', period: clean(v && v.period, 20), deposit: Math.max(0, Number(v && v.deposit) || 0),
      image: /^https:\/\//.test((v && v.image) || '') ? clean(v.image, 600) : '', url: /^https:\/\//.test((v && v.url) || '') ? clean(v.url, 400) : '',
      // bérlet (Eladás 1. üteme és Bérlés): kezdet, vég, figyelmeztetések a lejárat előtt
      rent_start: isoDate(v && v.rent_start), rent_end: isoDate(v && v.rent_end),
      reminders: (Array.isArray(v && v.reminders) ? v.reminders : []).slice(0, 20).map((r, j) => ({
        id: /^[a-z0-9_-]{1,20}$/i.test(r && r.id || '') ? r.id : 'r' + (j + 1),
        date: isoDate(r && r.date), days: Number.isInteger(r && r.days) && r.days >= 0 && r.days <= 730 ? r.days : null,
        note: clean(r && r.note, 200), sent_at: /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test((r && r.sent_at) || '') ? String(r.sent_at).slice(0, 19) : ''
      })).filter((r) => r.date)
    };
  });
}
function isoDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s + 'T00:00:00Z')) ? s : ''; }
function huToday() { return new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10); } // közép-európai nap (közelítőleg)
function daysTo(d) { return Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(huToday() + 'T00:00:00Z')) / 864e5); }
/** Az ügyfél legsürgősebb bérlet-figyelmeztetése (lista-jelvényhez): lejárt / esedékes emlékeztető / 60 napon belül lejár. */
function rentAlert(data) {
  let best = null;
  for (const v of vehiclesOf(data)) {
    if (!v.rent_end) continue;
    const d = daysTo(v.rent_end);
    const due = (v.reminders || []).some((r) => r.date && r.date <= huToday());
    if (d < 0 || due || d <= 60) {
      const a = { days: d, due, car: v.title || [v.brand, v.model].filter(Boolean).join(' '), end: v.rent_end };
      if (!best || d < best.days) best = a;
    }
  }
  return best;
}
function normData(b) {
  b = b || {};
  return {
    kind: b.kind === 'ceg' ? 'ceg' : 'magan',
    person: pick(b.person, PERSON_KEYS),
    company: pick(b.company, COMPANY_KEYS),
    contact_differs: !!b.contact_differs,
    contact: pick(b.contact, CONTACT_KEYS),
    // több autó / ügyfél (az első autó a régi „vehicle” mezőben is megmarad a visszafelé kompatibilitásért)
    vehicles: normVehicles(b),
    vehicle: (() => { const v0 = normVehicles(b)[0]; return v0 ? { ...pick(v0, VEHICLE_KEYS), hybrid: !!v0.hybrid } : { ...pick({}, VEHICLE_KEYS), hybrid: false }; })(),
    // Eladás 2. üteme: a vevő (a bérlőtől eltérő személy / cég)
    buyer: { kind: b.buyer && b.buyer.kind === 'ceg' ? 'ceg' : 'magan', person: pick(b.buyer && b.buyer.person, PERSON_KEYS), company: pick(b.buyer && b.buyer.company, COMPANY_KEYS) },
    notes: cleanMulti(b.notes, 4000),
    // Import: az ügyfél igénye (a munkatárs pontosíthatja)
    request: cleanMulti(b.request, 4000)
  };
}

async function handlePatchCard(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const cur = await getCard(env, id);
  const f = {};
  if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return json({ error: 'Ismeretlen státusz.' }, 400); f.status = b.status; }
  if (b.data !== undefined) {
    f.data = normData(b.data);
    // a napi futás által beállított „elküldve” jelölést egy régebben megnyitott adatlap mentése se törölje
    const prevV = vehiclesOf(cur.data || {});
    for (const v of f.data.vehicles) {
      const pv = prevV.find((x) => x.id === v.id); if (!pv) continue;
      for (const r of v.reminders) { const pr = (pv.reminders || []).find((x) => x.id === r.id && x.date === r.date); if (pr && pr.sent_at && !r.sent_at) r.sent_at = pr.sent_at; }
    }
  }
  if (b.address !== undefined) f.address = clean(b.address, 300);
  else if (f.data) f.address = f.data.kind === 'ceg' ? (f.data.company.address || f.data.person.address) : f.data.person.address;
  if (b.checklist !== undefined) {
    const prev = cur.checklist || {}; const next = { ...prev }; const items = checklistItems(deal.line); const rule = checklistFor(deal.line).close;
    // egyetlen feladat átkapcsolása a szerver aktuális állapotán (a közben automatikusan kipipált feladatok nem vesznek el)
    if (b.toggle && items.some(([k]) => k === b.toggle)) {
      const t = b.toggle; const on = !!(b.checklist && b.checklist[t] && (b.checklist[t] === true || b.checklist[t].done));
      b.checklist = {}; for (const [k] of items) b.checklist[k] = k === t ? on : !!(prev[k] && prev[k].done);
    }
    for (const [k] of items) {
      const on = !!(b.checklist && b.checklist[k] && (b.checklist[k] === true || b.checklist[k].done));
      next[k] = on ? { done: true, at: (prev[k] && prev[k].done && prev[k].at) || new Date().toISOString().slice(0, 19), by: (prev[k] && prev[k].done && prev[k].by) || user.name } : { done: false };
    }
    f.checklist = next;
    for (const [k, label] of items) {
      const was = !!(prev[k] && prev[k].done);
      if (was !== next[k].done) f._log = (f._log || []).concat([['checklist', (next[k].done ? '✓ Kipipálva: ' : '✗ Pipa levéve: ') + label]]);
    }
    // lezárás: „Átadva” kipipálva, ill. Eladásnál mindkét ütem minden feladata kész → Lezárva
    if (rule === 'all') {
      const allNow = items.every(([k]) => next[k] && next[k].done), allBefore = items.every(([k]) => prev[k] && prev[k].done);
      if (allNow && !allBefore) { f.status = 'Lezárva'; f._reason = 'minden checklist-feladat kész'; }
    } else if (next[rule] && next[rule].done && !(prev[rule] && prev[rule].done)) { f.status = 'Lezárva'; f._reason = '„' + ((items.find(([k]) => k === rule) || [])[1] || rule) + '” kipipálva'; }
  }
  if (b.contract !== undefined) {
    const c = b.contract || {}; const vars = {};
    for (const [k, v] of Object.entries(c.vars || {})) if (/^[a-z0-9_]{1,40}$/.test(k)) vars[k] = clean(v, 400);
    f.contract = draftSet(cur.contract || {}, ctKey(deal, c.vid, c.tpl), { text: cleanMulti(c.text, 60000), vars, saved_at: new Date().toISOString().slice(0, 19), saved_by: user.name });
    f._draftTitle = tplTitle(deal, c.tpl);
  }
  const logs = f._log || []; const reason = f._reason; const draftTitle = f._draftTitle; delete f._log; delete f._reason; delete f._draftTitle;
  if (f.data) {
    const o = normData(cur.data || {}); const n = f.data; const J = (x) => JSON.stringify(x || {});
    if (J([o.kind, o.person, o.company, o.contact_differs, o.contact]) !== J([n.kind, n.person, n.company, n.contact_differs, n.contact])) logs.push(['data', 'Ügyfél személyes / céges adatai módosítva', 15]);
    if (J(o.vehicles) !== J(n.vehicles)) {
      const oi = new Set(o.vehicles.map((v) => v.id)), ni = new Set(n.vehicles.map((v) => v.id));
      const vt = (v) => v.title || [v.brand, v.model].filter(Boolean).join(' ') || 'új autó';
      n.vehicles.filter((v) => !oi.has(v.id)).forEach((v) => logs.push(['vehicle', 'Autó hozzáadva: ' + vt(v)]));
      o.vehicles.filter((v) => !ni.has(v.id)).forEach((v) => logs.push(['vehicle', 'Autó eltávolítva: ' + vt(v)]));
      if (n.vehicles.some((v) => oi.has(v.id) && J(v) !== J(o.vehicles.find((x) => x.id === v.id)))) logs.push(['vehicle:edit', 'Gépjármű adatai módosítva', 15]);
    }
    if (J(o.buyer) !== J(n.buyer)) logs.push(['buyer', 'Vevő adatai módosítva (2. ütem)', 15]);
  }
  if (f.contract) logs.push(['draft', `Szerződés-piszkozat mentve (${draftTitle})`, 15]);
  const res = await saveCard(env, id, f, user.id, user.name, reason);
  for (const [kind, text, merge] of logs) await addEvent(env, id, kind, text, user.name, merge);
  // a lista/kanban alapadatai (név, telefon, e-mail) kövessék az adatlapot
  if (f.data) {
    const p = f.data.person; const sets = []; const vals = [];
    const name = f.data.kind === 'ceg' && f.data.company.name ? f.data.company.name : p.name;
    if (name && name !== deal.name) { sets.push('name = ?'); vals.push(name); }
    if (p.phone !== (deal.phone || '')) { sets.push('phone = ?'); vals.push(p.phone); }
    if (p.email !== (deal.email || '')) { sets.push('email = ?'); vals.push(p.email); }
    const v0 = f.data.vehicles[0] || {}; const car = v0.title || [v0.brand, v0.model].filter(Boolean).join(' ');
    if (car && !deal.car) { sets.push('car = ?'); vals.push(car); }
    if (sets.length) { vals.push(id); await env.DB.prepare(`UPDATE deals SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run(); }
  }
  return json({ ok: true, status: res.status, checklist: res.checklist, contract: f.contract ? res.contract : undefined });
}

/* ---------------- új ügyfél (kézi felvitel) ---------------- */
async function handleCreate(request, env, user) {
  const b = await request.json().catch(() => ({}));
  const line = ['Eladás', 'Import', 'Bérlés', 'Bizományos'].includes(b.line) ? b.line : '';
  if (!line) return json({ error: 'Válassz üzletágat.' }, 400);
  const name = clean(b.name, 160); if (!name) return json({ error: 'Add meg az ügyfél nevét.' }, 400);
  const firstStage = { 'Eladás': 'Új', 'Import': 'Érdeklődés', 'Bérlés': 'Új', 'Bizományos': 'Új' }[line];
  const res = await env.DB.prepare(`INSERT INTO deals (line,stage,ch,name,phone,email,car,price,note,when_text,assigned_to) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(line, firstStage, clean(b.ch, 40) || 'Kézi', name, clean(b.phone, 60), clean(b.email, 160), clean(b.car, 160), Number(b.price) || 0, cleanMulti(b.note, 2000), 'most', user.role === 'admin' ? (b.assigned_to || null) : user.id).run();
  const id = res.meta.last_row_id;
  await saveCard(env, id, { status: STATUSES[0], address: clean(b.address, 300), data: normData({ kind: 'magan', person: { name, phone: b.phone, email: b.email, address: b.address } }) }, user.id);
  await addEvent(env, id, 'create', `Ügyfél felvéve a rendszerbe (${line}, csatorna: ${clean(b.ch, 40) || 'Kézi'})`, user.name);
  return json({ ok: true, id });
}

/* ---------------- készlet ---------------- */
async function handleInventory(url) {
  const line = url.searchParams.get('line') || '';
  try { return json({ items: await inventory(line) }); }
  catch (e) { return json({ error: String(e.message || e) }, 502); }
}

/* ---------------- ajánlat küldése ---------------- */
async function handleSendOffer(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const card = await getCard(env, id);
  const to = clean((card.data.person && card.data.person.email) || deal.email, 160);
  if (!to) return json({ error: 'Az ügyfélnek nincs e-mail címe — add meg az adatlap 1. szekciójában.' }, 400);
  const b = await request.json().catch(() => ({}));
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 12).map((it) => ({
    key: clean(it.key, 120), title: clean(it.title, 200), brand: clean(it.brand, 60), year: clean(it.year, 30), km: clean(it.km, 40),
    fuel: clean(it.fuel, 40), power: clean(it.power, 40), gearbox: clean(it.gearbox, 40), image: /^https:\/\//.test(it.image || '') ? clean(it.image, 600) : '',
    url: /^https:\/\//.test(it.url || '') && it.src !== 'mobile' ? clean(it.url, 400) : '', note: clean(it.note, 400),
    price: Math.max(0, Number(it.price) || 0), currency: it.currency === 'EUR' ? 'EUR' : 'HUF', period: clean(it.period, 20), deposit: Math.max(0, Number(it.deposit) || 0),
    // forrás: készlet / mobile.de hirdetés (Import) / gyári konfigurátor (Eladás) / egyedi
    src: ['inv', 'mobile', 'config', 'manual'].includes(it.src) ? it.src : 'manual', color: clean(it.color, 60),
    ad_id: /^\d{6,12}$/.test(String(it.ad_id || '')) ? String(it.ad_id) : '', ad_url: /^https:\/\/([a-z0-9-]+\.)*mobile\.de\//i.test(it.ad_url || '') ? clean(it.ad_url, 400) : '',
    src_price: Math.max(0, Number(it.src_price) || 0), config_code: clean(it.config_code, 60), config_url: /^https:\/\/([a-z0-9-]+\.)*(bmw|mini|mercedes-benz|mercedes|audi|volkswagen|vw)\.[a-z.]{2,12}(\/|$)/i.test(it.config_url || '') ? clean(it.config_url, 1500) : '', file_id: Number.isInteger(it.file_id) ? it.file_id : null,
    // gyári konfigurátorból kinyert képek (crm_files, „__media_” névvel) és felszereltség — ezekből készül a CarAdvance-ajánlat PDF
    images: (Array.isArray(it.images) ? it.images : []).filter((x) => Number.isInteger(x) && x > 0).slice(0, 8),
    equipment: (Array.isArray(it.equipment) ? it.equipment : String(it.equipment || '').split('\n')).map((x) => clean(x, 160)).filter(Boolean).slice(0, 150),
    attach_src: !!it.attach_src
  })).filter((it) => it.title && it.price > 0);
  if (!items.length) return json({ error: 'Jelölj ki legalább egy autót, és adj meg árat.' }, 400);
  const message = cleanMulti(b.message, 2000).trim();
  const token = randomHex(20);
  const link = `${SITE}/ajanlat/valasz/?t=${token}`;
  const clientName = (card.data.kind === 'ceg' && card.data.contact_differs && card.data.contact && card.data.contact.name) || (card.data.person && card.data.person.name) || deal.name;
  const fwd = testForward(env);
  const subject = `${fwd ? '[TESZT — ' + to + '] ' : ''}Ajánlatunk — ${items.length > 1 ? items.length + ' autó' : items[0].title}`;
  // gyári konfigurátoros autók: CarAdvance-arculatú ajánlat PDF (adatok + képek + felszereltség); a gyári PDF csak kérésre megy
  const att = [];
  for (const [i, it] of items.entries()) {
    if (it.src === 'config' && (it.images.length || it.equipment.length)) {
      try {
        const pdf = await buildOfferPdf(env, id, it, { client: clientName, number: offerNo(id, i, items.length), user });
        att.push({ filename: offerFileName(it), content: bytesToB64(pdf) });
        if (!it.image && it.images.length) it.image = `${SITE}/api/crm-ajanlat/${token}/kep/${it.images[0]}`;
        it.offer_pdf = true;
      } catch (e) { console.error('offer pdf', e); }
    }
    if (!it.file_id || (it.offer_pdf && !it.attach_src)) continue;
    const f = await env.DB.prepare(`SELECT id, name, data FROM crm_files WHERE id = ? AND deal_id = ?`).bind(it.file_id, id).first();
    if (f) att.push({ filename: f.name, content: await fileData(env, f) }); else it.file_id = null;
  }
  const r = await sendCrmMail(env, fwd || to, subject, offerEmailHtml({ clientName, items, message, link }), att);
  await env.DB.prepare(`INSERT INTO crm_offers (token, deal_id, line, client_name, items, message, sent_to, sent, created_by) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(token, id, deal.line || '', clientName || '', JSON.stringify(items), message, fwd || to, r.ok ? 1 : 0, user.id).run();
  const carList = items.map((it) => `${it.title} (${priceLabel(it)}${it.ad_id ? ', mobile.de: ' + it.ad_id : ''}${it.config_code ? ', konfig.: ' + it.config_code : ''})`).join('; ');
  if (!r.ok) { await addEvent(env, id, 'offer', `Ajánlat küldése sikertelen — ${items.length} autó: ${carList}`, user.name); return json({ ok: false, error: r.error + ' — az ajánlat-link elkészült, kézzel is elküldheted.', link }, 502); }
  await addEvent(env, id, 'offer', `Ajánlat elküldve e-mailben (${fwd ? 'TESZT → ' + fwd : to}) — ${items.length} autó: ${carList}`, user.name);
  await saveCard(env, id, { status: 'Ajánlat kiküldve' }, user.id, user.name, 'ajánlat elküldve');
  return json({ ok: true, link, status: 'Ajánlat kiküldve', sentTo: fwd || to, test: !!fwd });
}

/* ---------------- CarAdvance-ajánlat PDF (gyári konfigurátor adataiból és képeiből) ---------------- */
function offerNo(id, i, n) { const d = new Date(); return `AJ-${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}-${String(id).padStart(4, '0')}${n > 1 ? '-' + (i + 1) : ''}`; }
function offerFileName(it) { return ('CarAdvance_ajanlat_' + (it.title || 'auto')).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/_+/g, '_').slice(0, 80) + '.pdf'; }
async function buildOfferPdf(env, dealId, it, o) {
  const images = [];
  for (const fid of (it.images || []).slice(0, 8)) {
    const f = await env.DB.prepare(`SELECT id, data FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, dealId).first();
    if (f) { const b = b64ToBytes(await fileData(env, f)); if (jpegInfo(b)) images.push(b); }
  }
  const specs = [['Márka', it.brand], ['Évjárat', it.year], ['Üzemanyag', it.fuel], ['Teljesítmény', it.power], ['Váltó', it.gearbox], ['Szín', it.color], ['Km', it.km], ['Konfigurációs kód', it.config_code]];
  const d = new Date();
  return renderOfferPdf({
    title: it.title, brand: it.brand, subtitle: specLine(it), price: priceLabel(it), priceNote: '',
    code: it.config_code, number: o.number, date: d.toLocaleDateString('hu-HU', { timeZone: 'Europe/Budapest' }), 
    client: o.client || '', note: it.note || '', specs, equipment: it.equipment || [], images,
    contact: { name: o.user && o.user.name, email: 'sales@caradvance.hu', phone: '+36 30 233 6060' }
  });
}
async function handleOfferPdfPreview(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({})); const it = b.item || {};
  const item = { title: clean(it.title, 200), brand: clean(it.brand, 60), year: clean(it.year, 30), km: clean(it.km, 40), fuel: clean(it.fuel, 40), power: clean(it.power, 40), gearbox: clean(it.gearbox, 40), color: clean(it.color, 60),
    price: Math.max(0, Number(it.price) || 0), currency: it.currency === 'EUR' ? 'EUR' : 'HUF', period: clean(it.period, 20), note: clean(it.note, 400), config_code: clean(it.config_code, 60),
    images: (Array.isArray(it.images) ? it.images : []).filter((x) => Number.isInteger(x) && x > 0).slice(0, 8),
    equipment: (Array.isArray(it.equipment) ? it.equipment : String(it.equipment || '').split('\n')).map((x) => clean(x, 160)).filter(Boolean).slice(0, 150) };
  const card = await getCard(env, id);
  const pdf = await buildOfferPdf(env, id, item, { client: (card.data.person && card.data.person.name) || deal.name, number: offerNo(id, 0, 1) + ' (előnézet)', user });
  return new Response(pdf, { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${offerFileName(item)}"`, 'cache-control': 'no-store' } });
}
/** Konfigurátor-kép mentése (JPEG, a böngészőben kicsinyítve) — rejtett fájlként, a feltöltött fájlok között nem látszik. */
async function handleMediaUpload(request, env, user, id) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.data || ''));
  if (!mm || mm[1].length > 2200000) return json({ error: 'A kép túl nagy vagy hibás (JPEG, max. ~1,6 MB).' }, 400);
  if (!jpegInfo(b64ToBytes(mm[1]))) return json({ error: 'A kép nem olvasható.' }, 400);
  const f = await putFile(env, id, '__media_' + Date.now() + '.jpg', 'image/jpeg', mm[1], user.id);
  return json({ ok: true, id: f.id });
}

/* ---------------- pénzügy (ügyletenként) ---------------- */
async function finList(env, id) {
  const items = (await env.DB.prepare(`SELECT f.id, f.kind, f.title, f.amount, f.currency, f.fx, f.amount_huf, f.fdate, f.note, f.file_id, f.vehicle_id, f.created_name, f.created_at,
      fl.name AS file_name, fl.mime AS file_mime, fl.size AS file_size
    FROM crm_fin f LEFT JOIN crm_files fl ON fl.id = f.file_id WHERE f.deal_id = ? ORDER BY f.kind DESC, COALESCE(NULLIF(f.fdate, ''), f.created_at), f.id`).bind(id).all()).results || [];
  return { items, summary: finSummary(items) };
}
async function storeFile(env, id, file, userId) {
  if (!file || !file.data) return null;
  const data = String(file.data).replace(/^data:[^,]*,/, '');
  const size = Math.floor(data.length * 3 / 4);
  if (size > MAX_FILE) throw new Error('A csatolmány legfeljebb 1,4 MB lehet (a fotót a böngésző tömöríti).');
  const name = clean(file.name, 160).replace(/[\\/]/g, '_') || 'szamla';
  const mime = /^[a-z]+\/[a-z0-9.+-]+$/i.test(file.mime || '') ? file.mime : 'application/octet-stream';
  const r = await env.DB.prepare(`INSERT INTO crm_files (deal_id, name, mime, size, data, created_by) VALUES (?,?,?,?,?,?)`).bind(id, name, mime, size, data, userId).run();
  return r.meta.last_row_id;
}
async function finFields(b) {
  const kind = b.kind === 'income' ? 'income' : 'cost';
  const title = clean(b.title, 200);
  const amount = Math.round(Math.abs(Number(String(b.amount == null ? '' : b.amount).replace(/\s/g, '').replace(',', '.')) || 0) * 100) / 100;
  const currency = b.currency === 'EUR' ? 'EUR' : 'HUF';
  if (!title) throw new Error('Add meg a tétel megnevezését.');
  if (!(amount > 0)) throw new Error('Add meg az összeget.');
  let fx = null;
  if (currency === 'EUR') {
    fx = Number(b.fx) > 0 ? Number(b.fx) : await eurHuf();
    if (!fx) throw new Error('Az EUR árfolyam most nem érhető el — add meg az árfolyamot, vagy rögzítsd forintban.');
  }
  const fdate = /^\d{4}-\d{2}-\d{2}$/.test(b.fdate || '') ? b.fdate : new Date().toISOString().slice(0, 10);
  const vehicle_id = /^[a-z0-9_-]{1,20}$/i.test(b.vehicle_id || '') ? b.vehicle_id : '';
  return { kind, title, amount, currency, fx, amount_huf: Math.round(currency === 'EUR' ? amount * fx : amount), fdate, note: cleanMulti(b.note, 1000), vehicle_id };
}
const fmtFt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft';
const finLabel = (f) => `${f.kind === 'income' ? 'Bevétel' : 'Költség'}: ${f.title} — ${f.currency === 'EUR' ? fmtFt(f.amount).replace(' Ft', ' €') + ' (' + fmtFt(f.amount_huf) + ')' : fmtFt(f.amount_huf)}`;
async function handleFinAdd(request, env, user, id) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  let f, fileId = null;
  try { f = await finFields(b); fileId = await storeFile(env, id, b.file, user.id); } catch (e) { return json({ error: e.message }, 400); }
  await env.DB.prepare(`INSERT INTO crm_fin (deal_id, kind, title, amount, currency, fx, amount_huf, fdate, note, file_id, vehicle_id, created_by, created_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, f.kind, f.title, f.amount, f.currency, f.fx, f.amount_huf, f.fdate, f.note, fileId, f.vehicle_id, user.id, user.name).run();
  await addEvent(env, id, 'fin', finLabel(f) + ' hozzáadva' + (fileId ? ' (számlával)' : ''), user.name);
  return json({ ok: true, fin: await finList(env, id) });
}
async function handleFinPatch(request, env, user, id, fid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const cur = await env.DB.prepare(`SELECT * FROM crm_fin WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
  if (!cur) return json({ error: 'Nem található.' }, 404);
  const b = await request.json().catch(() => ({}));
  let f, fileId = cur.file_id;
  try {
    f = await finFields({ kind: cur.kind, title: cur.title, amount: cur.amount, currency: cur.currency, fdate: cur.fdate, note: cur.note, vehicle_id: cur.vehicle_id, fx: cur.currency === 'EUR' && b.currency !== 'HUF' && b.amount === undefined && b.fx === undefined ? cur.fx : undefined, ...b });
    if (b.file && b.file.data) { const nid = await storeFile(env, id, b.file, user.id); if (cur.file_id) await env.DB.prepare(`DELETE FROM crm_files WHERE id = ? AND deal_id = ?`).bind(cur.file_id, id).run(); fileId = nid; }
    else if (b.removeFile && cur.file_id) { await env.DB.prepare(`DELETE FROM crm_files WHERE id = ? AND deal_id = ?`).bind(cur.file_id, id).run(); fileId = null; }
  } catch (e) { return json({ error: e.message }, 400); }
  await env.DB.prepare(`UPDATE crm_fin SET kind = ?, title = ?, amount = ?, currency = ?, fx = ?, amount_huf = ?, fdate = ?, note = ?, file_id = ?, vehicle_id = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(f.kind, f.title, f.amount, f.currency, f.fx, f.amount_huf, f.fdate, f.note, fileId, f.vehicle_id, fid).run();
  await addEvent(env, id, 'fin:' + fid, finLabel(f) + ' módosítva', user.name, 10);
  return json({ ok: true, fin: await finList(env, id) });
}
async function handleFinDelete(env, user, id, fid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const cur = await env.DB.prepare(`SELECT * FROM crm_fin WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
  if (!cur) return json({ error: 'Nem található.' }, 404);
  await env.DB.prepare(`DELETE FROM crm_fin WHERE id = ?`).bind(fid).run();
  if (cur.file_id) await env.DB.prepare(`DELETE FROM crm_files WHERE id = ? AND deal_id = ?`).bind(cur.file_id, id).run();
  await addEvent(env, id, 'fin', finLabel(cur) + ' törölve', user.name);
  return json({ ok: true, fin: await finList(env, id) });
}
/** Gyűjtő: minden (látható) ügylet bevétele / költsége / haszna — a Pénzügy menü „Ügyletek” fülének. */
async function handleFinSummary(env, user) {
  const where = user.role === 'admin' ? '' : 'WHERE d.assigned_to = ?';
  const st = env.DB.prepare(`SELECT d.id, d.line, d.name, d.car, d.stage, d.client_responded_at, d.created_at, c.status, c.data FROM deals d LEFT JOIN crm_cards c ON c.deal_id = d.id ${where} ORDER BY d.id DESC`);
  const deals = ((user.role === 'admin' ? await st.all() : await st.bind(user.id).all()).results || []);
  const ids = new Set(deals.map((d) => d.id));
  const rows = ((await env.DB.prepare(`SELECT id, deal_id, kind, title, amount, currency, amount_huf, fdate, created_at, file_id, vehicle_id FROM crm_fin ORDER BY fdate`).all()).results || []).filter((r) => ids.has(r.deal_id));
  return json({
    deals: deals.map((d) => {
      const data = parseJ(d.data, {});
      const company = data.kind === 'ceg' && data.company && data.company.name ? data.company.name : '';
      return { id: d.id, line: d.line, name: company || d.name, car: d.car, created_at: d.created_at, status: d.status || statusFromDeal(d) };
    }),
    items: rows.map((r) => ({ id: r.id, deal_id: r.deal_id, kind: r.kind, title: r.title, amount: r.amount, currency: r.currency, amount_huf: r.amount_huf, fdate: r.fdate || String(r.created_at).slice(0, 10), has_file: !!r.file_id, vehicle_id: r.vehicle_id || '' }))
  });
}

/* ---------------- dokumentumok ---------------- */
async function handleUpload(request, env, user, id) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const data = String(b.data || '').replace(/^data:[^,]*,/, '');
  if (!data) return json({ error: 'Üres fájl.' }, 400);
  const size = Math.floor(data.length * 3 / 4);
  if (size > DOC_MAX) return json({ error: 'A fájl legfeljebb 9 MB lehet.' }, 400);
  const name = clean(b.name, 160).replace(/[\\/]/g, '_') || 'dokumentum';
  const mime = /^[a-z]+\/[a-z0-9.+-]+$/i.test(b.mime || '') ? b.mime : 'application/octet-stream';
  const res = await putFile(env, id, name, mime, data, user.id);
  if (!b.silent) await addEvent(env, id, 'file', `Dokumentum feltöltve: ${name}`, user.name);
  return json({ ok: true, file: { id: res.id, name, mime, size } });
}
async function handleDownload(env, user, id, fid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const f = await env.DB.prepare(`SELECT * FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
  if (!f) return json({ error: 'Nem található.' }, 404);
  return new Response(b64ToBytes(await fileData(env, f)), { headers: { 'content-type': f.mime, 'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(f.name)}`, 'cache-control': 'private, no-store' } });
}
async function handleDeleteFile(env, user, id, fid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const f = await env.DB.prepare(`SELECT name FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
  if (await env.DB.prepare(`SELECT 1 FROM crm_docs WHERE deal_id = ? AND signed_file_id = ? LIMIT 1`).bind(id, fid).first()) return json({ error: 'Aláírt dokumentum PDF-je nem törölhető.' }, 409);
  await deleteFile(env, id, fid);
  if (f) await addEvent(env, id, 'file', `Dokumentum törölve: ${f.name}`, user.name);
  return json({ ok: true });
}

/* ---------------- szerződés ---------------- */
async function chosenItem(env, id) {
  const o = await env.DB.prepare(`SELECT items, choice FROM crm_offers WHERE deal_id = ? AND action = 'elfogad' ORDER BY responded_at DESC LIMIT 1`).bind(id).first()
    || await env.DB.prepare(`SELECT items, choice FROM crm_offers WHERE deal_id = ? AND responded_at IS NOT NULL ORDER BY responded_at DESC LIMIT 1`).bind(id).first();
  if (!o) return null;
  const items = parseJ(o.items, []);
  return items[o.choice] || null;
}
/* Eladásnál két szerződés: 1. ütem bérleti (a bérlővel), 2. ütem adásvételi (a vevővel) — külön piszkozattal. */
function tplOf(deal, t) { return deal.line === 'Eladás' ? (t === 'berles' ? 'berles' : 'eladas') : ''; }
function tplTitle(deal, t) { const k = tplOf(deal, t); return k === 'berles' ? 'Bérleti szerződés' : (TITLES[deal.line] || 'Szerződés'); }
/** Piszkozat-kulcs: autó (+ Eladásnál a sablon). Kulcs nélkül (régi adat) a szerződés gyökere / drafts[tpl]. */
function ctKey(deal, vid, t) { const v = /^[a-z0-9_-]{1,20}$/i.test(vid || '') ? vid : ''; const tk = tplOf(deal, t); return v ? v + (tk ? ':' + tk : '') : tk; }
function draftGet(contract, key) { contract = contract || {}; return key ? ((contract.drafts || {})[key] || {}) : contract; }
function draftSet(contract, key, obj) {
  contract = contract || {};
  if (!key) return { ...contract, ...obj };
  return { ...contract, drafts: { ...(contract.drafts || {}), [key]: { ...draftGet(contract, key), ...obj } } };
}
async function handleTemplate(env, user, id, url) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const card = await getCard(env, id);
  const vehicles = vehiclesOf(card.data); const vid = url.searchParams.get('vid');
  const vi = Math.max(0, vehicles.findIndex((v) => v.id === vid)); const vehicle = vehicles[vi] || null;
  // ár: az autóhoz rögzített (készlet / elfogadott ajánlat), régi adatnál az elfogadott ajánlat
  const chosen = vehicle && vehicle.price > 0 ? vehicle : (vi === 0 ? await chosenItem(env, id) : null);
  const vo = vehicle ? { vehicle, suffix: vi > 0 ? String(vi + 1) : '' } : {};
  const keys = varsFor(tplOf(deal, url.searchParams.get('tpl')) === 'berles' ? 'Bérlés' : deal.line);
  return json({
    line: deal.line, tpl: tplOf(deal, url.searchParams.get('tpl')), title: tplTitle(deal, url.searchParams.get('tpl')),
    text: tplOf(deal, url.searchParams.get('tpl')) === 'berles' ? TEMPLATES['Bérlés'] : (TEMPLATES[deal.line] || TEMPLATES['Eladás']),
    vars: tplOf(deal, url.searchParams.get('tpl')) === 'berles' ? defaultVars(deal, card, chosen, { code: 'ELA-B', ...vo })
      : tplOf(deal, url.searchParams.get('tpl')) === 'eladas' ? defaultVars(deal, card, chosen, { party: card.data.buyer || {}, ...vo })
      : defaultVars(deal, card, chosen, vo),
    vid: vehicle ? vehicle.id : '',
    fields: keys.map((k) => ({ key: k, label: VAR_LABELS[k] || k })), chosen
  });
}
function contractInput(b) {
  const vars = {}; for (const [k, v] of Object.entries((b && b.vars) || {})) if (/^[a-z0-9_]{1,40}$/.test(k)) vars[k] = clean(v, 400);
  return { text: cleanMulti(b && b.text, 60000), vars, tpl: b && b.tpl, vid: b && b.vid };
}
const TITLES = { 'Eladás': 'Adásvételi szerződés', 'Import': 'Import megbízási szerződés', 'Bérlés': 'Bérleti szerződés', 'Bizományos': 'Bizományi szerződés' };
async function buildPdf(deal, input) {
  const ttl = tplTitle(deal, input.tpl);
  const filled = fillTemplate(input.text, input.vars);
  const hash = await sha256hex(filled);
  const number = input.vars.szerzodes_szam || '';
  return { pdf: contractPdfFromText(filled, { number, hash, title: ttl + ' ' + number }), number, hash };
}
async function handleContractPdf(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const input = contractInput(await request.json().catch(() => ({})));
  if (!input.text.trim()) return json({ error: 'Üres szerződésszöveg — töltsd be a tervezetet.' }, 400);
  const { pdf, number } = await buildPdf(deal, input);
  return new Response(pdf, { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${(number || 'szerzodes').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf"`, 'cache-control': 'no-store' } });
}
async function handleContractSend(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const input = contractInput(b);
  if (!input.text.trim()) return json({ error: 'Üres szerződésszöveg — töltsd be a tervezetet.' }, 400);
  const card = await getCard(env, id);
  const isSale = tplOf(deal, input.tpl) === 'eladas';
  const buyer = (card.data && card.data.buyer) || {};
  const to = isSale ? clean(buyer.person && buyer.person.email, 160) : clean((card.data.person && card.data.person.email) || deal.email, 160);
  if (!to) return json({ error: isSale ? 'A vevőnek nincs e-mail címe — add meg az 1. szekcióban a Vevő adatainál.' : 'Az ügyfélnek nincs e-mail címe.' }, 400);
  const { pdf, number, hash } = await buildPdf(deal, input);
  const att = [{ filename: `${(number || 'szerzodes').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`, content: bytesToB64(pdf) }];
  const fileIds = (Array.isArray(b.files) ? b.files : []).map(Number).filter(Number.isInteger).slice(0, 10);
  let total = pdf.length;
  for (const fid of fileIds) {
    const f = await env.DB.prepare(`SELECT id, name, data, size FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
    if (f) { total += f.size; att.push({ filename: f.name, content: await fileData(env, f) }); }
  }
  if (total > 30 * 1024 * 1024) return json({ error: 'A csatolmányok együtt túl nagyok (max. ~30 MB).' }, 400);
  const name = isSale ? ((buyer.person && buyer.person.name) || (buyer.company && buyer.company.name) || '')
    : ((card.data.kind === 'ceg' && card.data.contact_differs && card.data.contact.name) || (card.data.person && card.data.person.name) || deal.name);
  const msg = cleanMulti(b.message, 2000).trim();
  const title = tplTitle(deal, input.tpl);
  const fwd = testForward(env);
  const r = await sendCrmMail(env, fwd || to, `${fwd ? '[TESZT — ' + to + '] ' : ''}${title} — ${number}`,
    `<p>Kedves ${esc(name || 'Ügyfelünk')}!</p><p>Csatoltan küldjük a(z) <b>${esc(title.toLowerCase())}</b> végleges példányát (PDF)${att.length > 1 ? ', valamint a kapcsolódó dokumentumokat' : ''}.</p>${msg ? `<p style="white-space:pre-line">${esc(msg)}</p>` : ''}<p>Kérjük, nézze át; kérdés esetén keressen minket bizalommal.</p><p>Üdvözlettel:<br>CarAdvance</p>`, att);
  if (!r.ok) return json({ error: r.error }, 502);
  const contract = draftSet(card.contract || {}, ctKey(deal, input.vid, input.tpl), { text: input.text, vars: input.vars, sent_at: new Date().toISOString().slice(0, 19), sent_by: user.name, sent_to: fwd || to, sent_hash: hash, sent_files: fileIds });
  await saveCard(env, id, { contract }, user.id, user.name);
  const cv = vehiclesOf(card.data).find((v) => v.id === input.vid);
  await addEvent(env, id, 'contract', `${title}${cv ? ' — ' + (cv.title || [cv.brand, cv.model].filter(Boolean).join(' ')) : ''} elküldve e-mailben (${number}, ${fwd ? 'TESZT → ' + fwd : to})${att.length > 1 ? ' + ' + (att.length - 1) + ' dokumentum' : ''}`, user.name);
  return json({ ok: true, sentTo: fwd || to, test: !!fwd, contract });
}

/* ---------------- dokumentumsablonok, személyek, kitöltött dokumentumok ---------------- */
const LINES = ['Eladás', 'Import', 'Bérlés', 'Bizományos'];
const TPL_MAX = 250000;
function usedKeys(text) { const o = []; String(text || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (m, k) => { if (!o.includes(k)) o.push(k); return m; }); return o; }
function rolesOf(text) { const keys = usedKeys(text); return Object.keys(PERSON_ROLES).filter((r) => keys.some((k) => k.indexOf(r + '_') === 0)); }
function tplRow(r, withBody) {
  const o = { id: r.id, name: r.name, kind: r.kind, lines: parseJ(r.lines, []), party: r.party, client_type: r.client_type, note: r.note || '', active: !!r.active, sort: r.sort, updated_at: r.updated_at || r.created_at, updated_by: r.updated_by || '', roles: rolesOf(r.body), size: (r.body || '').length };
  if (withBody) o.body = r.body;
  return o;
}
function tplInput(b) {
  return {
    name: clean(b.name, 160), kind: DOC_KINDS[b.kind] ? b.kind : 'egyeb',
    lines: (Array.isArray(b.lines) ? b.lines : []).filter((l) => LINES.includes(l)),
    party: b.party === 'buyer' ? 'buyer' : 'client', client_type: ['magan', 'ceg'].includes(b.client_type) ? b.client_type : 'any',
    body: cleanMulti(b.body, TPL_MAX), note: clean(b.note, 400), sort: Number.isInteger(b.sort) ? b.sort : 100, active: b.active === false ? 0 : 1
  };
}
async function handleDocMeta(env) {
  return json({
    kinds: DOC_KINDS, lines: LINES, roles: PERSON_ROLES,
    groups: VAR_GROUPS.map(([t, keys]) => ({ title: t, vars: keys.map((k) => ({ key: k, label: VAR_LABELS[k] || k })) })),
    settings: { partner_email: await getSetting(env, 'partner_email', ''), partner_name: await getSetting(env, 'partner_name', 'Caradvance GmbH'), bh_bankszamla: await getSetting(env, 'bh_bankszamla', ''), partner_sign_email: await getSetting(env, 'partner_sign_email', 'import@caradvance.de') }
  });
}
async function handleTemplates(env, url) {
  const all = url.searchParams.get('all') === '1';
  const rows = (await env.DB.prepare(`SELECT * FROM crm_templates ${all ? '' : 'WHERE active = 1'} ORDER BY sort, name`).all()).results || [];
  return json({ templates: rows.map((r) => tplRow(r, false)) });
}
async function handleTemplateGet(env, tid) {
  const r = await env.DB.prepare(`SELECT * FROM crm_templates WHERE id = ?`).bind(tid).first();
  if (!r) return json({ error: 'A sablon nem található.' }, 404);
  return json({ template: tplRow(r, true) });
}
async function upsertTemplate(env, user, t, id) {
  if (id) {
    await env.DB.prepare(`UPDATE crm_templates SET name=?, kind=?, lines=?, party=?, client_type=?, body=?, note=?, sort=?, active=?, updated_at=datetime('now'), updated_by=? WHERE id=?`)
      .bind(t.name, t.kind, JSON.stringify(t.lines), t.party, t.client_type, t.body, t.note, t.sort, t.active, user.name, id).run();
    return id;
  }
  const r = await env.DB.prepare(`INSERT INTO crm_templates (name, kind, lines, party, client_type, body, note, sort, active, updated_at, updated_by) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),?)`)
    .bind(t.name, t.kind, JSON.stringify(t.lines), t.party, t.client_type, t.body, t.note, t.sort, t.active, user.name).run();
  return r.meta.last_row_id;
}
async function handleTemplateSave(request, env, user) {
  const b = await request.json().catch(() => ({}));
  const t = tplInput(b);
  if (!t.name) return json({ error: 'Adj nevet a sablonnak.' }, 400);
  if (!t.body.trim()) return json({ error: 'A sablon szövege üres.' }, 400);
  const id = Number.isInteger(b.id) && b.id > 0 ? b.id : 0;
  if (id && !(await env.DB.prepare(`SELECT id FROM crm_templates WHERE id = ?`).bind(id).first())) return json({ error: 'A sablon nem található.' }, 404);
  const nid = await upsertTemplate(env, user, t, id);
  return handleTemplateGet(env, nid);
}
async function handleTemplateImport(request, env, user) {
  const b = await request.json().catch(() => ({}));
  const items = Array.isArray(b) ? b : Array.isArray(b.items) ? b.items : Array.isArray(b.templates) ? b.templates : [];
  if (!items.length) return json({ error: 'A fájlban nincs sablon.' }, 400);
  let created = 0, updated = 0;
  for (const it of items.slice(0, 100)) {
    const t = tplInput(it || {}); if (!t.name || !t.body.trim()) continue;
    const ex = await env.DB.prepare(`SELECT id FROM crm_templates WHERE name = ?`).bind(t.name).first();
    await upsertTemplate(env, user, t, ex ? ex.id : 0); ex ? updated++ : created++;
  }
  return json({ ok: true, created, updated });
}
async function handleTemplateDelete(env, tid) {
  await env.DB.prepare(`UPDATE crm_templates SET active = 0, updated_at = datetime('now') WHERE id = ?`).bind(tid).run();
  return json({ ok: true });
}

const P_KEYS = ['name', 'address', 'id_number', 'mother_name', 'birth_place', 'birth_date', 'email', 'phone', 'note', 'kind', 'rep'];
async function personsList(env) {
  return ((await env.DB.prepare(`SELECT id, ${P_KEYS.join(', ')}, sign_as, sig FROM crm_persons WHERE active = 1 ORDER BY name`).all()).results || [])
    .map((p) => ({ ...p, sign_as: p.sign_as || '', sig: p.sig ? 'data:image/jpeg;base64,' + p.sig : '' }));
}
/** A dokumentumba illeszthető aláírásminták: a dokumentum személyei + a céges aláírók (aláírási megnevezéssel). */
async function specimensFor(env, pids, use) {
  if (use === 0) return [];
  const rows = (await env.DB.prepare(`SELECT id, name, sign_as, sig FROM crm_persons WHERE active = 1 AND sig IS NOT NULL AND sig != ''`).all()).results || [];
  const mine = new Set(Object.values(pids || {}).map(Number));
  return rows.filter((p) => mine.has(p.id) || (p.sign_as || '').trim())
    .map((p) => ({ names: (mine.has(p.id) ? [p.name] : []).concat(String(p.sign_as || '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)), b64: p.sig }));
}
/** Teljes dokumentum + a beilleszthető aláírásminták (a szerkesztő előnézetéhez). */
async function withSigs(env, r) {
  const o = docRow(r, true);
  o.sigs = (await specimensFor(env, parseJ(r.persons, {}), 1)).map((z) => ({ names: z.names, src: 'data:image/jpeg;base64,' + z.b64 }));
  return o;
}
/** A dokumentum kitöltetlen (üres) adatmezői. */
// nem kötelező adatok: üresen is generálható (a PDF-ben kitöltendő vonal marad)
const OPTIONAL_VARS = new Set(['auto_rendszam', 'fizetesi_munkanap', 'egyeb_okmany', 'kedvezmenyezett']);
/** docVars + állandó adatok a Beállításokból (pl. BH Group bankszámla). */
async function docVarsEnv(env, ...a) {
  const v = docVars(...a);
  if (!String(v.bh_bankszamla || '').trim()) v.bh_bankszamla = await getSetting(env, 'bh_bankszamla', '');
  return v;
}
/** Előzetes ellenőrzésnél a számított mezőt nem kérjük, ha a forrása is hiányzik (abból készül). */
function checkMissing(text, vars) {
  const m = missingVars(text, vars); const keys = new Set(m.map((x) => x.key));
  return m.filter((x) => !(DERIVED[x.key] && (keys.has(DERIVED[x.key]) || !String(vars[DERIVED[x.key]] == null ? '' : vars[DERIVED[x.key]]).trim())));
}
function missingVars(text, vars) {
  return usedKeys(text).filter((k) => !OPTIONAL_VARS.has(k) && !String(vars[k] == null ? '' : vars[k]).trim()).map((k) => ({ key: k, label: VAR_LABELS[k] || k }));
}
const missTxt = (m) => m.map((x) => x.label).join(', ');
async function handlePersonSave(request, env) {
  const b = await request.json().catch(() => ({}));
  const p = {}; for (const k of P_KEYS) p[k] = clean(b[k], k === 'note' ? 400 : 200);
  p.birth_date = isoDate(p.birth_date); p.kind = p.kind === 'ceg' ? 'ceg' : 'magan';
  if (!p.name) return json({ error: 'Add meg a nevet.' }, 400);
  const signAs = clean(b.sign_as, 300);
  // aláírásminta: JPEG data URL (a böngésző kékre színezi és tömöríti), '' = törlés, undefined = változatlan
  let sig;
  if (b.sig === '') sig = '';
  else if (b.sig != null) {
    const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.sig));
    if (!mm || mm[1].length > 300000) return json({ error: 'Az aláírásminta túl nagy vagy hibás formátumú.' }, 400);
    const inf = jpegInfo(b64ToBytes(mm[1])); if (!inf) return json({ error: 'Az aláírásminta nem olvasható.' }, 400);
    sig = mm[1];
  }
  const id = Number.isInteger(b.id) && b.id > 0 ? b.id : 0;
  let pid = id;
  if (id) await env.DB.prepare(`UPDATE crm_persons SET ${P_KEYS.map((k) => k + '=?').join(', ')}, sign_as=?, updated_at=datetime('now') WHERE id=?`).bind(...P_KEYS.map((k) => p[k]), signAs, id).run();
  else pid = (await env.DB.prepare(`INSERT INTO crm_persons (${P_KEYS.join(', ')}, sign_as) VALUES (${P_KEYS.map(() => '?').join(',')},?)`).bind(...P_KEYS.map((k) => p[k]), signAs).run()).meta.last_row_id;
  if (sig !== undefined) await env.DB.prepare(`UPDATE crm_persons SET sig = ? WHERE id = ?`).bind(sig, pid).run();
  return json({ ok: true, persons: await personsList(env) });
}
async function handleSettings(request, env, user) {
  if (request.method === 'POST') {
    if (user.role !== 'admin') return json({ error: 'Csak admin módosíthatja.' }, 403);
    const b = await request.json().catch(() => ({}));
    const em = clean(b.partner_email, 300).split(/[,;\s]+/).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)).join(', ');
    await setSetting(env, 'partner_email', em); await setSetting(env, 'partner_name', clean(b.partner_name, 120) || 'Caradvance GmbH');
    if (b.bh_bankszamla != null) await setSetting(env, 'bh_bankszamla', clean(b.bh_bankszamla, 80));
    if (b.partner_sign_email != null) { const e = clean(b.partner_sign_email, 160).trim().toLowerCase(); if (e && !/^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(e)) return json({ error: 'Az ellenjegyző e-mail címe érvénytelen (egy cím adható meg).' }, 400); await setSetting(env, 'partner_sign_email', e); }
  }
  return json({ settings: { partner_email: await getSetting(env, 'partner_email', ''), partner_name: await getSetting(env, 'partner_name', 'Caradvance GmbH'), bh_bankszamla: await getSetting(env, 'bh_bankszamla', ''), partner_sign_email: await getSetting(env, 'partner_sign_email', 'import@caradvance.de') } });
}

/* --- ügyfélhez kitöltött dokumentumok --- */
function docRow(r, full) {
  const o = { id: r.id, template_id: r.template_id, name: r.name, kind: r.kind, vehicle_id: r.vehicle_id || '', persons: parseJ(r.persons, {}), created_by: r.created_by, created_at: r.created_at, updated_at: r.updated_at, updated_by: r.updated_by, sent_at: r.sent_at, sent_to: r.sent_to || '', number: parseJ(r.vars, {}).szerzodes_szam || '', sign_status: r.sign_status || '', sign_id: r.sign_id || null, signed_file_id: r.signed_file_id || null, use_sigs: r.use_sigs == null ? 1 : r.use_sigs };
  o.missing_n = missingVars(r.text, parseJ(r.vars, {})).length;
  if (full) o.missing = missingVars(r.text, parseJ(r.vars, {}));
  if (full) { o.text = r.text; o.vars = parseJ(r.vars, {}); o.fields = usedKeys(r.text).map((k) => ({ key: k, label: VAR_LABELS[k] || k })); }
  return o;
}
async function docPersons(env, sel) {
  const out = {}; const ids = {};
  for (const role of Object.keys(PERSON_ROLES)) {
    const pid = Number(sel && sel[role]); if (!Number.isInteger(pid) || pid <= 0) continue;
    const p = await env.DB.prepare(`SELECT * FROM crm_persons WHERE id = ?`).bind(pid).first();
    if (p) { out[role] = p; ids[role] = pid; }
  }
  return { persons: out, ids };
}
const vehName = (v) => v ? (v.title || [v.brand, v.model].filter(Boolean).join(' ')) : '';
async function handleDocsList(env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const docs = ((await env.DB.prepare(`SELECT * FROM crm_docs WHERE deal_id = ? ORDER BY id`).bind(id).all()).results || []).map((r) => docRow(r, false));
  const tpls = ((await env.DB.prepare(`SELECT * FROM crm_templates WHERE active = 1 ORDER BY sort, name`).all()).results || []).map((r) => tplRow(r, false));
  return json({
    docs, templates: tpls.map((t) => ({ ...t, own: t.lines.includes(deal.line) })),
    persons: await personsList(env), roles: PERSON_ROLES, kinds: DOC_KINDS,
    partner: { email: await getSetting(env, 'partner_email', ''), name: await getSetting(env, 'partner_name', 'Caradvance GmbH') }
  });
}
async function handleDocCreate(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const tpl = await env.DB.prepare(`SELECT * FROM crm_templates WHERE id = ?`).bind(Number(b.template_id) || 0).first();
  if (!tpl) return json({ error: 'Válassz sablont.' }, 400);
  const card = await getCard(env, id);
  const vehicles = vehiclesOf(card.data); const vehicle = vehicles.find((v) => v.id === b.vehicle_id) || (b.vehicle_id === '' ? null : vehicles[0]) || null;
  const { persons, ids } = await docPersons(env, b.persons);
  // a szerződésszám az ügyfélhez + autóhoz kötött (a mellékletek, meghatalmazások ugyanarra a számra hivatkoznak)
  const vars = await docVarsEnv(env, deal, card, vehicle, tpl, persons, 0);
  const extra = varsInput(b.extra || {});
  for (const [k, x] of Object.entries(extra)) if (!String(vars[k] == null ? '' : vars[k]).trim()) vars[k] = x;
  deriveVars(vars);
  const used = usedKeys(tpl.body); const keep = {}; for (const k of used) keep[k] = String(vars[k] != null ? vars[k] : '');
  // csak akkor generálható, ha minden szükséges adat megvan
  const miss = missingVars(tpl.body, keep).map((m) => DERIVED[m.key] && String(vars[DERIVED[m.key]] || '').trim() ? { ...m, label: m.label + ' (nem számolható ki ebből: „' + vars[DERIVED[m.key]] + '”)' } : m);
  if (miss.length) return json({ error: `Hiányzó adatok (${tpl.name}): ${missTxt(miss)}`, missing: miss }, 422);
  if (!keep.szerzodes_szam) keep.szerzodes_szam = vars.szerzodes_szam; // fájlnévhez
  const name = tpl.name + (vehicle ? ' — ' + vehName(vehicle) : '');
  const r = await env.DB.prepare(`INSERT INTO crm_docs (deal_id, template_id, name, kind, vehicle_id, persons, text, vars, created_by, updated_at, updated_by) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),?)`)
    .bind(id, tpl.id, name, tpl.kind, vehicle ? vehicle.id : '', JSON.stringify(ids), tpl.body, JSON.stringify(keep), user.name, user.name).run();
  await addEvent(env, id, 'doc', `Dokumentum kitöltve: ${name}`, user.name);
  const row = await env.DB.prepare(`SELECT * FROM crm_docs WHERE id = ?`).bind(r.meta.last_row_id).first();
  return json({ ok: true, doc: await withSigs(env, row) });
}
/** Előzetes ellenőrzés: a kijelölt sablonokhoz mely adatok hiányoznak (az ügyfél / autó / személyek adataiból). */
async function handleDocCheck(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const card = await getCard(env, id); const vehicles = vehiclesOf(card.data);
  const vids = Array.isArray(b.vehicle_ids) ? b.vehicle_ids : [b.vehicle_id || ''];
  const { persons } = await docPersons(env, b.persons);
  const out = {};
  for (const tid of (Array.isArray(b.template_ids) ? b.template_ids : []).slice(0, 30)) {
    const tpl = await env.DB.prepare(`SELECT * FROM crm_templates WHERE id = ?`).bind(Number(tid) || 0).first(); if (!tpl) continue;
    for (const vid of vids) {
      const vehicle = vehicles.find((v) => v.id === vid) || null;
      const vars = await docVarsEnv(env, deal, card, vehicle, tpl, persons, 0);
      for (const m of checkMissing(tpl.body, vars)) { (out[m.key] = out[m.key] || { ...m, templates: [] }); if (!out[m.key].templates.includes(tpl.name)) out[m.key].templates.push(tpl.name); }
    }
  }
  return json({ missing: Object.values(out), roles: Object.keys(PERSON_ROLES) });
}
async function getDoc(env, id, did) { return env.DB.prepare(`SELECT * FROM crm_docs WHERE id = ? AND deal_id = ?`).bind(did, id).first(); }
function varsInput(o) { const vars = {}; for (const [k, v] of Object.entries(o || {})) if (/^[a-z0-9_]{1,40}$/.test(k)) vars[k] = clean(v, 600); return vars; }
async function handleDocGet(env, user, id, did) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ error: 'Nem található.' }, 404);
  return json({ doc: await withSigs(env, r) });
}
async function handleDocPatch(request, env, user, id, did) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ error: 'Nem található.' }, 404);
  if (r.sign_status === 'pending') return json({ error: 'A dokumentum aláírásra ki van küldve — módosítás előtt vond vissza az aláírási kérelmet.' }, 409);
  if (r.sign_status === 'signed' || r.sign_status === 'cosign') return json({ error: 'Az aláírt dokumentum nem módosítható. Szükség esetén készíts újat a sablonból.' }, 409);
  const b = await request.json().catch(() => ({}));
  let text = b.text != null ? cleanMulti(b.text, TPL_MAX) : r.text;
  const oldVars = parseJ(r.vars, {});
  let vars = b.vars ? varsInput(b.vars) : oldVars;
  if (b.vars) { // ha egy forrásérték (pl. havi díj, árfolyam) változott, a belőle számított mezők újraszámolódnak
    const chg = (x) => String(vars[x] || '') !== String(oldVars[x] || '');
    for (const [k, src] of Object.entries(DERIVED)) if ((chg(src) || (/^havi_dij_huf/.test(k) && chg('havi_dij'))) && !chg(k)) vars[k] = '';
    const had = new Set(Object.keys(vars)); deriveVars(vars); for (const k of Object.keys(vars)) if (!had.has(k)) delete vars[k];
  }
  let pids = parseJ(r.persons, {}); let vid = r.vehicle_id || '';
  if (b.persons) pids = (await docPersons(env, b.persons)).ids;
  if (b.vehicle_id != null) vid = clean(b.vehicle_id, 20);
  if (b.refill) { // adatok újratöltése az adatlapból (a kézi szövegmódosítás megmarad, a változók frissülnek)
    const card = await getCard(env, id);
    const vehicle = vehiclesOf(card.data).find((v) => v.id === vid) || null;
    const tpl = (r.template_id && await env.DB.prepare(`SELECT kind, party FROM crm_templates WHERE id = ?`).bind(r.template_id).first()) || { kind: r.kind, party: 'client' };
    const { persons } = await docPersons(env, pids);
    const fresh = await docVarsEnv(env, deal, card, vehicle, tpl, persons, 0);
    const keepNo = vars.szerzodes_szam;
    const isRole = (k) => Object.keys(PERSON_ROLES).some((r) => k.indexOf(r + '_') === 0);
    for (const k of usedKeys(text)) { const fv = fresh[k] != null ? String(fresh[k]) : ''; if (fv || isRole(k) || b.refill === 'all') vars[k] = fv; }
    if (keepNo) vars.szerzodes_szam = keepNo;
  }
  const name = b.name != null ? (clean(b.name, 200) || r.name) : r.name;
  const useSigs = b.use_sigs != null ? (b.use_sigs ? 1 : 0) : (r.use_sigs == null ? 1 : r.use_sigs);
  await env.DB.prepare(`UPDATE crm_docs SET name=?, text=?, vars=?, persons=?, vehicle_id=?, use_sigs=?, updated_at=datetime('now'), updated_by=? WHERE id=?`)
    .bind(name, text, JSON.stringify(vars), JSON.stringify(pids), vid, useSigs, user.name, did).run();
  await addEvent(env, id, 'doc:' + did, `Dokumentum módosítva: ${name}`, user.name, 30);
  return json({ ok: true, doc: await withSigs(env, await getDoc(env, id, did)) });
}
async function handleDocDelete(env, user, id, did) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ ok: true });
  if (r.sign_status === 'pending' || r.sign_status === 'signed' || r.sign_status === 'cosign') return json({ error: r.sign_status === 'pending' ? 'Aláírásra kiküldött dokumentum — előbb vond vissza a kérelmet.' : 'Aláírt dokumentum nem törölhető.' }, 409);
  await env.DB.prepare(`DELETE FROM crm_docs WHERE id = ? AND deal_id = ?`).bind(did, id).run();
  await addEvent(env, id, 'doc', `Dokumentum törölve: ${r.name}`, user.name);
  return json({ ok: true });
}
const KIND_SUB = { szerzodes: 'Szerződés', meghatalmazas: 'Meghatalmazás', nyilatkozat: 'Nyilatkozat', melleklet: 'Melléklet', egyeb: 'Dokumentum' };
async function docPdf(env, r, override) {
  const text = override && override.text != null ? cleanMulti(override.text, TPL_MAX) : r.text;
  const vars = override && override.vars ? varsInput(override.vars) : parseJ(r.vars, {});
  const filled = fillTemplate(text, vars);
  const hash = await sha256hex(filled);
  const number = vars.szerzodes_szam && /\{\{\s*szerzodes_szam\s*\}\}/.test(text) ? vars.szerzodes_szam : '';
  const use = override && override.use_sigs != null ? (override.use_sigs ? 1 : 0) : (r.use_sigs == null ? 1 : r.use_sigs);
  const specimens = (await specimensFor(env, parseJ(r.persons, {}), use)).map((z) => ({ names: z.names, jpeg: b64ToBytes(z.b64) }));
  const pdf = contractPdfFromText(filled, { number, hash, title: r.name, sub: KIND_SUB[r.kind] || 'Dokumentum', specimens });
  const fname = (r.name.split(' — ')[0] + (number ? ' ' + number : '')).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/_+/g, '_').slice(0, 90) + '.pdf';
  return { pdf, hash, fname };
}
async function handleDocPdf(request, env, user, id, did) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ error: 'Nem található.' }, 404);
  const override = request.method === 'POST' ? await request.json().catch(() => null) : null;
  if (!override) { const miss = missingVars(r.text, parseJ(r.vars, {})); if (miss.length) return json({ error: 'Hiányzó adatok: ' + missTxt(miss) + ' — töltsd ki a dokumentum szerkesztőjében.', missing: miss }, 422); }
  const { pdf, fname } = await docPdf(env, r, override);
  return new Response(pdf, { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${fname}"`, 'cache-control': 'no-store' } });
}
const EMAIL_RE = /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/;
async function handleDocsSend(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const docIds = (Array.isArray(b.doc_ids) ? b.doc_ids : []).map(Number).filter(Number.isInteger).slice(0, 30);
  const fileIds = (Array.isArray(b.file_ids) ? b.file_ids : []).map(Number).filter(Number.isInteger).slice(0, 20);
  if (!docIds.length && !fileIds.length) return json({ error: 'Jelölj ki legalább egy dokumentumot.' }, 400);
  const card = await getCard(env, id); const data = card.data || {};
  const targets = Array.isArray(b.to) ? b.to : [b.to];
  const rcpt = []; const labels = [];
  const add = (em, label) => { for (const e of String(em || '').split(/[,;\s]+/)) if (EMAIL_RE.test(e) && !rcpt.includes(e.toLowerCase())) { rcpt.push(e.toLowerCase()); } if (label) labels.push(label); };
  if (targets.includes('client')) { const e = (data.person && data.person.email) || deal.email; if (!e) return json({ error: 'Az ügyfélnek nincs e-mail címe.' }, 400); add(e, 'ügyfél'); }
  if (targets.includes('buyer')) { const e = data.buyer && data.buyer.person && data.buyer.person.email; if (!e) return json({ error: 'A vevőnek nincs e-mail címe (1. szekció, Vevő adatai).' }, 400); add(e, 'vevő'); }
  if (targets.includes('partner')) { const e = await getSetting(env, 'partner_email', ''); if (!e) return json({ error: 'A német partner e-mail címe nincs beállítva (Szerződések → Dokumentumok → Beállítások).' }, 400); add(e, await getSetting(env, 'partner_name', 'partner')); }
  if (b.emails) { const bad = String(b.emails).split(/[,;\s]+/).filter((e) => e && !EMAIL_RE.test(e)); if (bad.length) return json({ error: 'Hibás e-mail cím: ' + bad.join(', ') }, 400); add(b.emails, 'egyéb címzett'); }
  if (!rcpt.length) return json({ error: 'Válassz címzettet.' }, 400);
  const att = []; let total = 0; const names = []; const sentDocs = [];
  for (const did of docIds) {
    const r = await getDoc(env, id, did); if (!r) continue;
    if (r.signed_file_id) { // aláírt dokumentum: az aláírt PDF megy ki
      const f = await env.DB.prepare(`SELECT id, name, data, size FROM crm_files WHERE id = ? AND deal_id = ?`).bind(r.signed_file_id, id).first();
      if (f) { total += f.size; att.push({ filename: f.name, content: await fileData(env, f) }); names.push(r.name + ' (aláírt)'); sentDocs.push(r); continue; }
    }
    const miss = missingVars(r.text, parseJ(r.vars, {}));
    if (miss.length) return json({ error: `Hiányzó adatok (${r.name}): ${missTxt(miss)}` }, 422);
    const { pdf, fname } = await docPdf(env, r);
    total += pdf.length; att.push({ filename: fname, content: bytesToB64(pdf) }); names.push(r.name); sentDocs.push(r);
  }
  for (const fid of fileIds) {
    const f = await env.DB.prepare(`SELECT id, name, data, size FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
    if (f) { total += f.size; att.push({ filename: f.name, content: await fileData(env, f) }); names.push(f.name); }
  }
  if (!att.length) return json({ error: 'A kijelölt dokumentumok nem találhatók.' }, 404);
  if (total > 30 * 1024 * 1024) return json({ error: 'A csatolmányok együtt túl nagyok (max. ~30 MB).' }, 400);
  const clientName = (data.kind === 'ceg' && data.company && data.company.name) || (data.person && data.person.name) || deal.name || '';
  const partnerOnly = targets.length === 1 && targets[0] === 'partner' && !b.emails;
  const subject = clean(b.subject, 200) || (partnerOnly ? `Dokumente / Dokumentumok — ${clientName}` : `CarAdvance — dokumentumok (${clientName})`);
  const msg = cleanMulti(b.message, 4000).trim();
  const list = `<ul style="padding-left:18px;margin:10px 0">${names.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
  const greet = partnerOnly ? '<p>Sehr geehrte Damen und Herren,<br>Tisztelt Partnerünk!</p><p>Anbei senden wir Ihnen die folgenden Dokumente / Csatoltan küldjük az alábbi dokumentumokat' + (clientName ? ` (${esc(clientName)})` : '') + ':</p>'
    : `<p>Kedves ${esc(targets.includes('client') && !targets.includes('partner') ? (clientName || 'Ügyfelünk') : 'Címzett')}!</p><p>Csatoltan küldjük az alábbi dokumentumokat:</p>`;
  const fwd = testForward(env);
  const res = await sendCrmMail(env, fwd || rcpt, `${fwd ? '[TESZT — ' + rcpt.join(', ') + '] ' : ''}${subject}`,
    `${greet}${list}${msg ? `<p style="white-space:pre-line">${esc(msg)}</p>` : ''}<p>${partnerOnly ? 'Mit freundlichen Grüßen / Üdvözlettel:' : 'Üdvözlettel:'}<br>CarAdvance${user.name ? ' — ' + esc(user.name) : ''}</p>`, att);
  if (!res.ok) return json({ error: res.error }, 502);
  const to = fwd ? 'TESZT → ' + fwd + ' (' + rcpt.join(', ') + ')' : rcpt.join(', ');
  for (const r of sentDocs) await env.DB.prepare(`UPDATE crm_docs SET sent_at = datetime('now'), sent_to = ? WHERE id = ?`).bind(rcpt.join(', '), r.id).run();
  await addEvent(env, id, 'doc', `${att.length} dokumentum elküldve (${labels.join(', ')}: ${to}): ${names.join('; ')}`, user.name);
  return json({ ok: true, sentTo: fwd || rcpt.join(', '), test: !!fwd, count: att.length });
}

/* ---------------- elektronikus aláírás (kiküldés, lista, visszavonás) ---------------- */
async function handleSignCreate(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const ids = (Array.isArray(b.doc_ids) ? b.doc_ids : []).map(Number).filter(Number.isInteger).slice(0, 20);
  if (!ids.length) return json({ error: 'Jelölj ki legalább egy dokumentumot.' }, 400);
  const card = await getCard(env, id); const data = card.data || {};
  const role = b.signer === 'buyer' ? 'buyer' : 'client';
  const P = role === 'buyer' ? ((data.buyer || {}).person || {}) : (data.person || {});
  const email = clean(P.email || (role === 'client' ? deal.email : ''), 160).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: role === 'buyer' ? 'A vevőnek nincs érvényes e-mail címe (1. szekció).' : 'Az ügyfélnek nincs érvényes e-mail címe (1. szekció).' }, 400);
  const signerName = clean(P.name || (role === 'client' ? deal.name : ''), 120);
  if (!signerName) return json({ error: 'Add meg az aláíró nevét az 1. szekcióban.' }, 400);
  // piac (ország) a domain alapján; csak az ezt a piacot kiszolgáló partnerek jegyezhetnek ellen
  const market = marketOf(new URL(request.url).hostname);
  const docs = []; const partners = ((await env.DB.prepare(`SELECT id, sign_keys, markets FROM crm_partners WHERE active = 1 ORDER BY id`).all()).results || []).filter((p) => partnerTakesMarket(p, market));
  for (const did of ids) {
    const r = await getDoc(env, id, did); if (!r) continue;
    if (r.sign_status === 'pending') return json({ error: `Már aláírásra vár: ${r.name}` }, 409);
    if (r.sign_status === 'signed' || r.sign_status === 'cosign') return json({ error: `Már aláírt dokumentum: ${r.name}` }, 409);
    const vars = parseJ(r.vars, {});
    const miss = missingVars(r.text, vars); if (miss.length) return json({ error: `Hiányzó adatok (${r.name}): ${missTxt(miss)}` }, 422);
    const text = fillTemplate(r.text, vars);
    const sigs = await specimensFor(env, parseJ(r.persons, {}), r.use_sigs == null ? 1 : r.use_sigs);
    docs.push({ doc_id: r.id, name: r.name, kind: r.kind, text, hash: await sha256hex(text), number: /\{\{\s*szerzodes_szam\s*\}\}/.test(r.text) ? (vars.szerzodes_szam || '') : '', match: vars.ugyfel_nev || '', sigs, ...coFor(text, partners) });
  }
  if (!docs.length) return json({ error: 'A kijelölt dokumentumok nem találhatók.' }, 404);
  const token = randomHex(32);
  const exp = Math.floor(Date.now() / 1000) + 14 * 86400;
  const msg = cleanMulti(b.message, 2000).trim();
  const ins = await env.DB.prepare(`INSERT INTO crm_sign (token_hash, deal_id, signer_role, signer_name, email, docs, message, created_by, expires_at, market) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .bind(await sha256hex('crmsign|' + token), id, role, signerName, email, JSON.stringify(docs), msg, user.name, exp, market).run();
  const sid = ins.meta.last_row_id;
  for (const d of docs) await env.DB.prepare(`UPDATE crm_docs SET sign_status = 'pending', sign_id = ? WHERE id = ?`).bind(sid, d.doc_id).run();
  const link = `${SITE}/alairas/#${token}`;
  const fwd = testForward(env);
  const r = await sendCrmMail(env, fwd || email, `${fwd ? '[TESZT — ' + email + '] ' : ''}Aláírásra váró dokumentumok — CarAdvance`,
    `<p>Kedves ${esc(signerName)}!</p><p>Az alábbi dokumentumokat elektronikus aláírásra küldjük:</p><ul>${docs.map((d) => `<li>${esc(d.name)}</li>`).join('')}</ul>
     ${msg ? `<p style="background:#f4f7fb;border-radius:10px;padding:12px 14px;white-space:pre-line">${esc(msg)}</p>` : ''}
     <p>A dokumentumokat a lenti gombbal tudja átolvasni és aláírni. Az aláíráshoz egy egyszeri kódot küldünk erre az e-mail címre.</p>
     <p style="margin:18px 0"><a href="${esc(link)}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:999px;display:inline-block">Dokumentumok megtekintése és aláírása</a></p>
     <p style="color:#6b7280;font-size:12px">A link személyes, ne továbbítsa. Érvényes: ${new Date(exp * 1000).toLocaleDateString('hu-HU', { timeZone: 'Europe/Budapest' })}-ig. Ha nem Ön az érintett, kérjük, jelezze nekünk.</p>`);
  await addEvent(env, id, 'sign', `Aláírásra kiküldve (#${sid}) → ${signerName} (${fwd ? 'TESZT → ' + fwd : email}): ${docs.map((d) => d.name).join('; ')}${r.ok ? '' : ' — AZ E-MAIL NEM MENT KI: ' + r.error}`, user.name);
  return json({ ok: true, id: sid, link, sentTo: fwd || email, test: !!fwd, mailError: r.ok ? null : r.error });
}
/** Melyik partner jegyzi ellen a dokumentumot (a hasábnevek alapján) — { cosign: [nevek], cosign_pid }. */
function coFor(text, partners) {
  for (const p of partners) { const k = partnerSignKeys(text, parseJ(p.sign_keys, [])); if (k.length) return { cosign: k, cosign_pid: p.id }; }
  return { cosign: [] };
}
/* ---------- partnerek (országonkénti ellenjegyzők, partnerfelület) — csak admin módosíthatja ---------- */
const PARTNER_OUT = (p) => ({ id: p.id, markets: parseJ(p.markets, []), country: p.country, company: p.company, login: p.login, lang: p.lang, notify_email: p.notify_email || '', sign_keys: parseJ(p.sign_keys, []), active: !!p.active, must_change: !!p.must_change, has_sig: !!p.sig, sig_name: p.sig_name || '', last_login: p.last_login || '' });
async function handlePartners(request, env, user, pid) {
  if (request.method === 'GET') return json({ partners: ((await env.DB.prepare(`SELECT * FROM crm_partners ORDER BY country, id`).all()).results || []).map(PARTNER_OUT) });
  if (user.role !== 'admin') return json({ error: 'Csak admin módosíthatja.' }, 403);
  const b = await request.json().catch(() => ({}));
  const em = (v) => clean(v, 160).trim().toLowerCase();
  const login = em(b.login); const notify = em(b.notify_email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(login)) return json({ error: 'A bejelentkezési név egy e-mail cím legyen.' }, 400);
  if (notify && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(notify)) return json({ error: 'Az értesítési e-mail cím érvénytelen.' }, 400);
  const country = clean(b.country, 2).toUpperCase(); if (!/^[A-Z]{2}$/.test(country)) return json({ error: 'Az ország kétbetűs kód legyen (pl. DE, AT, CZ).' }, 400);
  const company = clean(b.company, 120); if (!company) return json({ error: 'Add meg a partnercég nevét.' }, 400);
  const lang = ['de', 'en', 'hu'].includes(b.lang) ? b.lang : 'de';
  const keys = (Array.isArray(b.sign_keys) ? b.sign_keys : String(b.sign_keys || '').split(/[,;\n]/)).map((x) => clean(x, 80).trim()).filter(Boolean).slice(0, 10);
  if (!keys.length) return json({ error: 'Add meg legalább egy aláírási hasáb nevét (pl. „Caradvance GmbH”).' }, 400);
  const markets = [...new Set((Array.isArray(b.markets) ? b.markets : String(b.markets || '').split(/[,;\s]+/)).map((x) => clean(x, 2).toUpperCase()).filter((x) => /^[A-Z]{2}$/.test(x)))].slice(0, 30);
  const pw = String(b.password || '');
  if (pw && pw.length < 6) return json({ error: 'A kezdő jelszó legalább 6 karakter legyen.' }, 400);
  try {
    if (pid) {
      await env.DB.prepare(`UPDATE crm_partners SET country=?, company=?, login=?, lang=?, notify_email=?, sign_keys=?, active=?, markets=? WHERE id=?`).bind(country, company, login, lang, notify, JSON.stringify(keys), b.active === false ? 0 : 1, JSON.stringify(markets), pid).run();
      if (pw) { // új kezdő jelszó: első belépéskor cserélni kell, a régi munkamenetek megszűnnek
        await env.DB.prepare(`UPDATE crm_partners SET pass_hash=?, must_change=1, fails=0, locked_until=0 WHERE id=?`).bind(await hashPass(pw), pid).run();
        await env.DB.prepare(`DELETE FROM crm_partner_sessions WHERE partner_id = ?`).bind(pid).run();
      }
      if (b.clear_sig) await env.DB.prepare(`UPDATE crm_partners SET sig=NULL, sig_name='', sig_at=NULL WHERE id=?`).bind(pid).run();
    } else {
      if (!pw) return json({ error: 'Új partnernél add meg a kezdő jelszót.' }, 400);
      await env.DB.prepare(`INSERT INTO crm_partners (country, company, login, lang, notify_email, pass_hash, must_change, sign_keys, active, markets) VALUES (?,?,?,?,?,?,1,?,?,?)`).bind(country, company, login, lang, notify, await hashPass(pw), JSON.stringify(keys), b.active === false ? 0 : 1, JSON.stringify(markets)).run();
    }
  } catch (e) { return json({ error: /UNIQUE/i.test(String(e)) ? 'Ez a bejelentkezési név már foglalt.' : 'Mentési hiba.' }, 400); }
  return handlePartners(new Request('https://x/'), env, user, 0);
}
/* ---------------- ügyfél-adatbekérő (személyes adatok + okmánymásolatok, link: /adatok/#token) ---------------- */
async function handleDataReqList(env, user, id) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const t = Math.floor(Date.now() / 1000);
  const rows = (await env.DB.prepare(`SELECT id, role, email, name, status, created_by, created_at, expires_at, opened_at, submitted_at, files FROM crm_datareq WHERE deal_id = ? ORDER BY id DESC`).bind(id).all()).results || [];
  return json({ requests: rows.map((r) => ({ ...r, status: r.status === 'pending' && r.expires_at < t ? 'expired' : r.status, files: parseJ(r.files, []) })) });
}
async function handleDataReqCreate(request, env, user, id) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  const card = await getCard(env, id); const data = card.data || {};
  const role = b.role === 'buyer' ? 'buyer' : 'client';
  const P = role === 'buyer' ? ((data.buyer || {}).person || {}) : (data.person || {});
  const email = clean(P.email || (role === 'client' ? deal.email : ''), 160).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: role === 'buyer' ? 'A vevőnek nincs érvényes e-mail címe.' : 'Az ügyfélnek nincs érvényes e-mail címe (1. szekció).' }, 400);
  const name = clean(P.name || (role === 'client' ? deal.name : ''), 120);
  // a korábbi, még nyitott kérelmek érvénytelenítése (mindig csak az utolsó link él)
  await env.DB.prepare(`UPDATE crm_datareq SET status = 'revoked' WHERE deal_id = ? AND role = ? AND status = 'pending'`).bind(id, role).run();
  const token = randomHex(32); const exp = Math.floor(Date.now() / 1000) + 14 * 86400;
  const msg = cleanMulti(b.message, 2000).trim();
  const ins = await env.DB.prepare(`INSERT INTO crm_datareq (token_hash, deal_id, role, email, name, message, created_by, expires_at) VALUES (?,?,?,?,?,?,?,?)`)
    .bind(await sha256hex('crmdata|' + token), id, role, email, name, msg, user.name, exp).run();
  const link = `${SITE}/adatok/#${token}`; const fwd = testForward(env);
  const r = await sendCrmMail(env, fwd || email, `${fwd ? '[TESZT — ' + email + '] ' : ''}Kérjük, adja meg adatait — CarAdvance`,
    `<p>Kedves ${esc(name || 'Ügyfelünk')}!</p><p>A szerződések elkészítéséhez kérjük, adja meg személyes adatait, és töltse fel a <b>személyazonosító igazolványa</b> és a <b>lakcímkártyája</b> másolatát (fénykép vagy PDF).</p>
     ${msg ? `<p style="background:#f4f7fb;border-radius:10px;padding:12px 14px;white-space:pre-line">${esc(msg)}</p>` : ''}
     <p style="margin:18px 0"><a href="${esc(link)}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:999px;display:inline-block">Adatok megadása és feltöltés</a></p>
     <p>Az adatok titkosított kapcsolaton keresztül, közvetlenül hozzánk kerülnek; kizárólag a szerződéskötéshez és a hatósági ügyintézéshez használjuk fel őket.</p>
     <p style="color:#6b7280;font-size:12px">A link személyes, ne továbbítsa. Érvényes: ${new Date(exp * 1000).toLocaleDateString('hu-HU', { timeZone: 'Europe/Budapest' })}-ig.</p><p>Üdvözlettel:<br>CarAdvance</p>`);
  await addEvent(env, id, 'datareq', `Adatbekérő e-mail kiküldve (#${ins.meta.last_row_id}) → ${name} (${fwd ? 'TESZT → ' + fwd : email})${r.ok ? '' : ' — AZ E-MAIL NEM MENT KI: ' + r.error}`, user.name);
  return json({ ok: true, sentTo: fwd || email, test: !!fwd, mailError: r.ok ? null : r.error });
}
async function handleDataReqRevoke(env, user, id, rid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  await env.DB.prepare(`UPDATE crm_datareq SET status = 'revoked' WHERE id = ? AND deal_id = ? AND status = 'pending'`).bind(rid, id).run();
  await addEvent(env, id, 'datareq', `Adatbekérő link visszavonva (#${rid})`, user.name);
  return json({ ok: true });
}
async function handleSignList(env, user, id) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const rows = (await env.DB.prepare(`SELECT id, signer_role, signer_name, email, docs, status, created_by, created_at, expires_at, opened_at, signed_at, sign_name, sign_ip, result, fails, parent_id FROM crm_sign WHERE deal_id = ? ORDER BY id DESC`).bind(id).all()).results || [];
  const t = Math.floor(Date.now() / 1000);
  return json({ requests: rows.map((r) => ({
    id: r.id, role: r.signer_role, signer: r.signer_name, email: r.email, status: r.status === 'pending' && r.expires_at < t ? 'expired' : r.status,
    created_by: r.created_by, created_at: r.created_at, expires: new Date(r.expires_at * 1000).toISOString(), opened_at: r.opened_at, signed_at: r.signed_at, sign_name: r.sign_name, sign_ip: r.sign_ip, fails: r.fails, parent_id: r.parent_id || null,
    docs: parseJ(r.docs, []).map((d) => ({ doc_id: d.doc_id, name: d.name, hash: d.hash })), result: parseJ(r.result, [])
  })) });
}
async function handleSignRevoke(env, user, id, sid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const r = await env.DB.prepare(`SELECT * FROM crm_sign WHERE id = ? AND deal_id = ?`).bind(sid, id).first();
  if (!r) return json({ error: 'Nem található.' }, 404);
  if (r.status === 'signed' || r.status === 'signing') return json({ error: 'Már aláírt kérelem nem vonható vissza.' }, 409);
  await env.DB.prepare(`UPDATE crm_sign SET status = 'revoked', revoked_by = ?, code_hash = NULL WHERE id = ?`).bind(user.name, sid).run();
  await env.DB.prepare(`UPDATE crm_docs SET sign_status = '', sign_id = NULL WHERE sign_id = ? AND deal_id = ? AND sign_status = 'pending'`).bind(sid, id).run();
  // a partner ellenjegyzésének visszavonása: a dokumentumok az ügyfél aláírásával maradnak
  if (r.signer_role === 'partner') await env.DB.prepare(`UPDATE crm_docs SET sign_status = 'signed' WHERE sign_id = ? AND deal_id = ? AND sign_status = 'cosign'`).bind(r.parent_id || 0, id).run();
  await addEvent(env, id, 'sign', `Aláírási kérelem visszavonva (#${sid})`, user.name);
  return json({ ok: true });
}

/* ---------------- felszereltség-lista fordítása németről magyarra (Cloudflare Workers AI) ---------------- */
const TR_MODELS = ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct'];
async function handleTranslate(request, env) {
  const b = await request.json().catch(() => ({}));
  const lines = (Array.isArray(b.lines) ? b.lines : []).map((x) => clean(x, 200)).filter(Boolean).slice(0, 150);
  if (!lines.length) return json({ lines: [] });
  if (!env.AI) return json({ error: 'A fordítás nincs beállítva (Workers AI).' }, 501);
  const out = [];
  for (let i = 0; i < lines.length; i += 40) {
    const chunk = lines.slice(i, i + 40);
    const prompt = 'Fordítsd le magyarra az alábbi autó-felszereltségi tételeket (német gyári konfigurátorból). Szabályok: a márka- és termékneveket (pl. BMW Live Cockpit, Driving Assistant Plus, M Sportpaket, Harman Kardon, xDrive, AMG, S line, R-Line, Matrix LED) hagyd eredeti formában; a többit tömör, magyar autós szaknyelven add vissza (pl. Sitzheizung vorn → Ülésfűtés elöl, Anhängerkupplung → Vonóhorog, Metallic-Lackierung → Metálfényezés). Pontosan ugyanannyi tételt adj vissza, ugyanabban a sorrendben, kizárólag egy JSON tömbként (stringek), magyarázat nélkül.\n\n' + JSON.stringify(chunk);
    let res = null;
    for (const m of TR_MODELS) {
      try {
        const r = await env.AI.run(m, { messages: [{ role: 'system', content: 'Precíz német–magyar autóipari fordító vagy. Csak JSON tömböt adsz vissza.' }, { role: 'user', content: prompt }], max_tokens: 3000, temperature: 0.1 });
        const txt = String((r && (r.response ?? r.result?.response)) || '');
        const mm = txt.match(/\[[\s\S]*\]/); const arr = mm ? JSON.parse(mm[0]) : null;
        if (Array.isArray(arr) && arr.length === chunk.length) { res = arr.map((x, k) => clean(String(x || ''), 200) || chunk[k]); break; }
      } catch (e) { /* következő modell */ }
    }
    out.push(...(res || chunk));
  }
  return json({ lines: out, translated: out.some((x, k) => x !== lines[k]) });
}

/* ---------------- konfigurátor-képek átvétele (csak a gyártók képszervereiről; a böngésző JPEG-re alakítja) ---------------- */
const IMG_HOST_RE = /^https:\/\/([a-z0-9-]+\.)*(bmw|mini|bmwgroup|mercedes-benz|mercedes|daimler|mbusa|audi|audi-cdn|volkswagen|vw|vwgroup|vwg-connect|cosy)[a-z0-9-]*\.[a-z.]{2,12}(\/|$)/i;
async function handleImgProxy(url) {
  const u = String(url.searchParams.get('url') || '').slice(0, 3000);
  if (!IMG_HOST_RE.test(u)) return json({ error: 'Nem gyártói képcím.' }, 400);
  try {
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(u, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*' } });
    clearTimeout(tm);
    const ct = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\//i.test(ct)) return json({ error: 'A kép nem tölthető le (' + r.status + ').' }, 502);
    const buf = await r.arrayBuffer(); if (buf.byteLength > 12 * 1024 * 1024) return json({ error: 'A kép túl nagy.' }, 413);
    return new Response(buf, { headers: { 'content-type': ct, 'cache-control': 'private, max-age=600', 'x-content-type-options': 'nosniff' } });
  } catch (e) { return json({ error: 'A kép nem tölthető le.' }, 502); }
}
/* ---------------- gyári konfigurátor link: cím / kép (csak a márkák saját domainjeiről) ---------------- */
const CFG_HOST_RE = /^https:\/\/([a-z0-9-]+\.)*(bmw|mini|mercedes-benz|mercedes|audi|volkswagen|vw)\.[a-z.]{2,12}(\/|$)/i;
async function handleCfgMeta(url) {
  const u = String(url.searchParams.get('url') || '').trim().slice(0, 1500);
  if (!CFG_HOST_RE.test(u)) return json({ error: 'Csak BMW, MINI, Mercedes-Benz, Audi vagy Volkswagen konfigurátor link adható meg (https).' }, 400);
  const out = { title: '', image: '', description: '' };
  try {
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(u, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'Accept-Language': 'de-DE,de;q=0.9,hu;q=0.8' } });
    clearTimeout(tm);
    if (r.ok && CFG_HOST_RE.test(r.url || u) && /html/i.test(r.headers.get('content-type') || '')) {
      const html = (await r.text()).slice(0, 400000);
      const meta = (n) => { const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + n + '["\'][^>]+content=["\']([^"\']+)', 'i')) || html.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + n + '["\']', 'i')); return m ? m[1] : ''; };
      const dec = (t) => String(t || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
      out.title = dec(meta('og:title') || (html.match(/<title[^>]*>([^<]{3,160})<\/title>/i) || [])[1] || '').slice(0, 160);
      out.description = dec(meta('og:description') || meta('description')).slice(0, 300);
      const img = meta('og:image'); if (/^https:\/\//.test(img)) out.image = img.slice(0, 600);
    }
  } catch (e) { /* nem kritikus — a link akkor is használható */ }
  return json({ ok: true, ...out });
}

/* ---------------- router ---------------- */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/api\/belso-crm/, '') || '/';
  const method = request.method;
  try {
    if (path === '/cron' && method === 'POST') { await ensureCrm(env); return await handleCron(request, env); }
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
    await ensureCrm(env);
    if (path === '/list' && method === 'GET') return await handleList(env, user);
    if (path === '/clients' && method === 'POST') return await handleCreate(request, env, user);
    if (path === '/inventory' && method === 'GET') return await handleInventory(url);
    if (path === '/fin/summary' && method === 'GET') return await handleFinSummary(env, user);
    if (path === '/fx' && method === 'GET') return json({ rate: await eurHuf() });
    if (path === '/docmeta' && method === 'GET') return await handleDocMeta(env);
    if (path === '/cfgmeta' && method === 'GET') return await handleCfgMeta(url);
    if (path === '/imgproxy' && method === 'GET') return await handleImgProxy(url);
    if (path === '/translate' && method === 'POST') return await handleTranslate(request, env);
    if (path === '/templates' && method === 'GET') return await handleTemplates(env, url);
    if (path === '/templates' && method === 'POST') return await handleTemplateSave(request, env, user);
    if (path === '/templates/import' && method === 'POST') return await handleTemplateImport(request, env, user);
    if (path === '/persons' && method === 'GET') return json({ persons: await personsList(env) });
    if (path === '/persons' && method === 'POST') return await handlePersonSave(request, env);
    if (path === '/settings') return await handleSettings(request, env, user);
    if (path === '/partners') return await handlePartners(request, env, user, 0);
    const pm = path.match(/^\/partners\/(\d+)$/); if (pm) return await handlePartners(request, env, user, Number(pm[1]));
    let m = path.match(/^\/templates\/(\d+)$/);
    if (m && method === 'GET') return await handleTemplateGet(env, Number(m[1]));
    if (m && method === 'DELETE') return await handleTemplateDelete(env, Number(m[1]));
    m = path.match(/^\/persons\/(\d+)$/);
    if (m && method === 'DELETE') { await env.DB.prepare(`UPDATE crm_persons SET active = 0 WHERE id = ?`).bind(Number(m[1])).run(); return json({ ok: true, persons: await personsList(env) }); }
    m = path.match(/^\/card\/(\d+)\/docs$/);
    if (m && method === 'GET') return await handleDocsList(env, user, Number(m[1]));
    if (m && method === 'POST') return await handleDocCreate(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/sign$/);
    if (m && method === 'GET') return await handleSignList(env, user, Number(m[1]));
    if (m && method === 'POST') return await handleSignCreate(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/datareq$/);
    if (m && method === 'GET') return await handleDataReqList(env, user, Number(m[1]));
    if (m && method === 'POST') return await handleDataReqCreate(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/datareq\/(\d+)\/revoke$/);
    if (m && method === 'POST') return await handleDataReqRevoke(env, user, Number(m[1]), Number(m[2]));
    m = path.match(/^\/card\/(\d+)\/sign\/(\d+)\/revoke$/);
    if (m && method === 'POST') return await handleSignRevoke(env, user, Number(m[1]), Number(m[2]));
    m = path.match(/^\/card\/(\d+)\/docs\/check$/);
    if (m && method === 'POST') return await handleDocCheck(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/docs\/send$/);
    if (m && method === 'POST') return await handleDocsSend(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/docs\/(\d+)$/);
    if (m && method === 'GET') return await handleDocGet(env, user, Number(m[1]), Number(m[2]));
    if (m && method === 'PATCH') return await handleDocPatch(request, env, user, Number(m[1]), Number(m[2]));
    if (m && method === 'DELETE') return await handleDocDelete(env, user, Number(m[1]), Number(m[2]));
    m = path.match(/^\/card\/(\d+)\/docs\/(\d+)\/pdf$/);
    if (m && (method === 'GET' || method === 'POST')) return await handleDocPdf(request, env, user, Number(m[1]), Number(m[2]));
    m = path.match(/^\/card\/(\d+)\/fin$/);
    if (m && method === 'POST') return await handleFinAdd(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/fin\/(\d+)$/);
    if (m && method === 'PATCH') return await handleFinPatch(request, env, user, Number(m[1]), Number(m[2]));
    if (m && method === 'DELETE') return await handleFinDelete(env, user, Number(m[1]), Number(m[2]));
    m = path.match(/^\/card\/(\d+)$/);
    if (m && method === 'GET') return await handleGetCard(env, user, Number(m[1]));
    if (m && method === 'PATCH') return await handlePatchCard(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/events$/);
    if (m && method === 'GET') { const { error } = await loadDeal(env, user, Number(m[1])); if (error) return error; return json({ events: await listEvents(env, Number(m[1])) }); }
    m = path.match(/^\/card\/(\d+)\/media$/);
    if (m && method === 'POST') return await handleMediaUpload(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/offerpdf$/);
    if (m && method === 'POST') return await handleOfferPdfPreview(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/offer$/);
    if (m && method === 'POST') return await handleSendOffer(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/files$/);
    if (m && method === 'POST') return await handleUpload(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/files\/(\d+)$/);
    if (m && method === 'GET') return await handleDownload(env, user, Number(m[1]), Number(m[2]));
    if (m && method === 'DELETE') return await handleDeleteFile(env, user, Number(m[1]), Number(m[2]));
    m = path.match(/^\/card\/(\d+)\/contract\/template$/);
    if (m && method === 'GET') return await handleTemplate(env, user, Number(m[1]), url);
    m = path.match(/^\/card\/(\d+)\/contract\/pdf$/);
    if (m && method === 'POST') return await handleContractPdf(request, env, user, Number(m[1]));
    m = path.match(/^\/card\/(\d+)\/contract\/send$/);
    if (m && method === 'POST') return await handleContractSend(request, env, user, Number(m[1]));
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Szerver hiba', detail: String((e && e.message) || e) }, 500);
  }
}
