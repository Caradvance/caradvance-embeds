// CarAdvance CRM — ügyféllista + Ügyfél adatlap API (munkatársi, bejelentkezés szükséges)
// Route: www.caradvance.hu/api/belso-crm/*
// Ugyanazt a munkamenetet (ca_session süti) és jogosultságot használja, mint az /api/belso/*:
// admin mindent lát, a többi munkatárs csak a hozzá rendelt ügyfeleket.
import {
  ensureCrm, statusFromDeal, addEvent, listEvents, json, parseJ, clean, cleanMulti, randomHex, getCard, saveCard, inventory, STATUSES, CHECKLIST, checklistFor, checklistItems, checklistProgress, MAX_FILE, eurHuf, finSummary, vehiclesOf,
  offerEmailHtml, sendCrmMail, notifyTo, TEMPLATES, VAR_LABELS, varsFor, defaultVars, fillTemplate, contractPdfFromText,
  bytesToB64, b64ToBytes, sha256hex, priceLabel, esc, SITE,
  VAR_GROUPS, PERSON_ROLES, DOC_KINDS, getSetting, setSetting, docVars
} from '../../../lib/crm.js';

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
  const files = (await env.DB.prepare(`SELECT id, name, mime, size, created_at FROM crm_files WHERE deal_id = ? AND id NOT IN (SELECT file_id FROM crm_fin WHERE deal_id = ? AND file_id IS NOT NULL) ORDER BY id`).bind(id, id).all()).results || [];
  const fin = await finList(env, id);
  const events = await listEvents(env, id);
  let users = [];
  if (user.role === 'admin') users = (await env.DB.prepare(`SELECT id, name, email FROM users ORDER BY name`).all()).results || [];
  return json({
    deal, card: { status: card.status, address: card.address, data: { ...card.data, vehicles: vehiclesOf(card.data) }, checklist: card.checklist, contract: card.contract, status_at: card.status_at, updated_at: card.updated_at },
    offers, files, events, fin, statuses: STATUSES, checklist: checklistFor(deal.line), me: user, users, testForward: testForward(env)
  });
}

const PERSON_KEYS = ['name', 'address', 'phone', 'email', 'tax', 'id_number', 'mother_name', 'birth_place', 'birth_date', 'residence', 'bank', 'licence'];
const COMPANY_KEYS = ['name', 'address', 'tax', 'reg'];
const CONTACT_KEYS = ['name', 'phone', 'email', 'role'];
const VEHICLE_KEYS = ['brand', 'model', 'year', 'vin', 'plate', 'color', 'engine', 'fuel', 'km'];
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
    notes: cleanMulti(b.notes, 4000)
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
    url: /^https:\/\//.test(it.url || '') ? clean(it.url, 400) : '', note: clean(it.note, 400),
    price: Math.max(0, Number(it.price) || 0), currency: it.currency === 'EUR' ? 'EUR' : 'HUF', period: clean(it.period, 20), deposit: Math.max(0, Number(it.deposit) || 0)
  })).filter((it) => it.title && it.price > 0);
  if (!items.length) return json({ error: 'Jelölj ki legalább egy autót, és adj meg árat.' }, 400);
  const message = cleanMulti(b.message, 2000).trim();
  const token = randomHex(20);
  const link = `${SITE}/ajanlat/valasz/?t=${token}`;
  const clientName = (card.data.kind === 'ceg' && card.data.contact_differs && card.data.contact && card.data.contact.name) || (card.data.person && card.data.person.name) || deal.name;
  const fwd = testForward(env);
  const subject = `${fwd ? '[TESZT — ' + to + '] ' : ''}Ajánlatunk — ${items.length > 1 ? items.length + ' autó' : items[0].title}`;
  const r = await sendCrmMail(env, fwd || to, subject, offerEmailHtml({ clientName, items, message, link }));
  await env.DB.prepare(`INSERT INTO crm_offers (token, deal_id, line, client_name, items, message, sent_to, sent, created_by) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(token, id, deal.line || '', clientName || '', JSON.stringify(items), message, fwd || to, r.ok ? 1 : 0, user.id).run();
  const carList = items.map((it) => `${it.title} (${priceLabel(it)})`).join('; ');
  if (!r.ok) { await addEvent(env, id, 'offer', `Ajánlat küldése sikertelen — ${items.length} autó: ${carList}`, user.name); return json({ ok: false, error: r.error + ' — az ajánlat-link elkészült, kézzel is elküldheted.', link }, 502); }
  await addEvent(env, id, 'offer', `Ajánlat elküldve e-mailben (${fwd ? 'TESZT → ' + fwd : to}) — ${items.length} autó: ${carList}`, user.name);
  await saveCard(env, id, { status: 'Ajánlat kiküldve' }, user.id, user.name, 'ajánlat elküldve');
  return json({ ok: true, link, status: 'Ajánlat kiküldve', sentTo: fwd || to, test: !!fwd });
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
  if (size > MAX_FILE) return json({ error: 'A fájl legfeljebb 1,4 MB lehet.' }, 400);
  const name = clean(b.name, 160).replace(/[\\/]/g, '_') || 'dokumentum';
  const mime = /^[a-z]+\/[a-z0-9.+-]+$/i.test(b.mime || '') ? b.mime : 'application/octet-stream';
  const res = await env.DB.prepare(`INSERT INTO crm_files (deal_id, name, mime, size, data, created_by) VALUES (?,?,?,?,?,?)`).bind(id, name, mime, size, data, user.id).run();
  await addEvent(env, id, 'file', `Dokumentum feltöltve: ${name}`, user.name);
  return json({ ok: true, file: { id: res.meta.last_row_id, name, mime, size } });
}
async function handleDownload(env, user, id, fid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const f = await env.DB.prepare(`SELECT * FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
  if (!f) return json({ error: 'Nem található.' }, 404);
  return new Response(b64ToBytes(f.data), { headers: { 'content-type': f.mime, 'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(f.name)}`, 'cache-control': 'private, no-store' } });
}
async function handleDeleteFile(env, user, id, fid) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const f = await env.DB.prepare(`SELECT name FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
  await env.DB.prepare(`DELETE FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).run();
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
    const f = await env.DB.prepare(`SELECT name, data, size FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
    if (f) { total += f.size; att.push({ filename: f.name, content: f.data }); }
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
    settings: { partner_email: await getSetting(env, 'partner_email', ''), partner_name: await getSetting(env, 'partner_name', 'Caradvance GmbH') }
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

const P_KEYS = ['name', 'address', 'id_number', 'mother_name', 'birth_place', 'birth_date', 'email', 'phone', 'note'];
async function personsList(env) { return (await env.DB.prepare(`SELECT id, ${P_KEYS.join(', ')} FROM crm_persons WHERE active = 1 ORDER BY name`).all()).results || []; }
async function handlePersonSave(request, env) {
  const b = await request.json().catch(() => ({}));
  const p = {}; for (const k of P_KEYS) p[k] = clean(b[k], k === 'note' ? 400 : 200);
  p.birth_date = isoDate(p.birth_date);
  if (!p.name) return json({ error: 'Add meg a nevet.' }, 400);
  const id = Number.isInteger(b.id) && b.id > 0 ? b.id : 0;
  if (id) await env.DB.prepare(`UPDATE crm_persons SET ${P_KEYS.map((k) => k + '=?').join(', ')}, updated_at=datetime('now') WHERE id=?`).bind(...P_KEYS.map((k) => p[k]), id).run();
  else await env.DB.prepare(`INSERT INTO crm_persons (${P_KEYS.join(', ')}) VALUES (${P_KEYS.map(() => '?').join(',')})`).bind(...P_KEYS.map((k) => p[k])).run();
  return json({ ok: true, persons: await personsList(env) });
}
async function handleSettings(request, env, user) {
  if (request.method === 'POST') {
    if (user.role !== 'admin') return json({ error: 'Csak admin módosíthatja.' }, 403);
    const b = await request.json().catch(() => ({}));
    const em = clean(b.partner_email, 300).split(/[,;\s]+/).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)).join(', ');
    await setSetting(env, 'partner_email', em); await setSetting(env, 'partner_name', clean(b.partner_name, 120) || 'Caradvance GmbH');
  }
  return json({ settings: { partner_email: await getSetting(env, 'partner_email', ''), partner_name: await getSetting(env, 'partner_name', 'Caradvance GmbH') } });
}

/* --- ügyfélhez kitöltött dokumentumok --- */
function docRow(r, full) {
  const o = { id: r.id, template_id: r.template_id, name: r.name, kind: r.kind, vehicle_id: r.vehicle_id || '', persons: parseJ(r.persons, {}), created_by: r.created_by, created_at: r.created_at, updated_at: r.updated_at, updated_by: r.updated_by, sent_at: r.sent_at, sent_to: r.sent_to || '', number: parseJ(r.vars, {}).szerzodes_szam || '' };
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
  const vars = docVars(deal, card, vehicle, tpl, persons, 0);
  const used = usedKeys(tpl.body); const keep = {}; for (const k of used) keep[k] = vars[k] != null ? String(vars[k]) : '';
  if (!keep.szerzodes_szam) keep.szerzodes_szam = vars.szerzodes_szam; // fájlnévhez
  const name = tpl.name + (vehicle ? ' — ' + vehName(vehicle) : '');
  const r = await env.DB.prepare(`INSERT INTO crm_docs (deal_id, template_id, name, kind, vehicle_id, persons, text, vars, created_by, updated_at, updated_by) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),?)`)
    .bind(id, tpl.id, name, tpl.kind, vehicle ? vehicle.id : '', JSON.stringify(ids), tpl.body, JSON.stringify(keep), user.name, user.name).run();
  await addEvent(env, id, 'doc', `Dokumentum kitöltve: ${name}`, user.name);
  const row = await env.DB.prepare(`SELECT * FROM crm_docs WHERE id = ?`).bind(r.meta.last_row_id).first();
  return json({ ok: true, doc: docRow(row, true) });
}
async function getDoc(env, id, did) { return env.DB.prepare(`SELECT * FROM crm_docs WHERE id = ? AND deal_id = ?`).bind(did, id).first(); }
function varsInput(o) { const vars = {}; for (const [k, v] of Object.entries(o || {})) if (/^[a-z0-9_]{1,40}$/.test(k)) vars[k] = clean(v, 600); return vars; }
async function handleDocGet(env, user, id, did) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ error: 'Nem található.' }, 404);
  return json({ doc: docRow(r, true) });
}
async function handleDocPatch(request, env, user, id, did) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ error: 'Nem található.' }, 404);
  const b = await request.json().catch(() => ({}));
  let text = b.text != null ? cleanMulti(b.text, TPL_MAX) : r.text;
  let vars = b.vars ? varsInput(b.vars) : parseJ(r.vars, {});
  let pids = parseJ(r.persons, {}); let vid = r.vehicle_id || '';
  if (b.persons) pids = (await docPersons(env, b.persons)).ids;
  if (b.vehicle_id != null) vid = clean(b.vehicle_id, 20);
  if (b.refill) { // adatok újratöltése az adatlapból (a kézi szövegmódosítás megmarad, a változók frissülnek)
    const card = await getCard(env, id);
    const vehicle = vehiclesOf(card.data).find((v) => v.id === vid) || null;
    const tpl = (r.template_id && await env.DB.prepare(`SELECT kind, party FROM crm_templates WHERE id = ?`).bind(r.template_id).first()) || { kind: r.kind, party: 'client' };
    const { persons } = await docPersons(env, pids);
    const fresh = docVars(deal, card, vehicle, tpl, persons, 0);
    const keepNo = vars.szerzodes_szam;
    const isRole = (k) => Object.keys(PERSON_ROLES).some((r) => k.indexOf(r + '_') === 0);
    for (const k of usedKeys(text)) { const fv = fresh[k] != null ? String(fresh[k]) : ''; if (fv || isRole(k) || b.refill === 'all') vars[k] = fv; }
    if (keepNo) vars.szerzodes_szam = keepNo;
  }
  const name = b.name != null ? (clean(b.name, 200) || r.name) : r.name;
  await env.DB.prepare(`UPDATE crm_docs SET name=?, text=?, vars=?, persons=?, vehicle_id=?, updated_at=datetime('now'), updated_by=? WHERE id=?`)
    .bind(name, text, JSON.stringify(vars), JSON.stringify(pids), vid, user.name, did).run();
  await addEvent(env, id, 'doc:' + did, `Dokumentum módosítva: ${name}`, user.name, 30);
  return json({ ok: true, doc: docRow(await getDoc(env, id, did), true) });
}
async function handleDocDelete(env, user, id, did) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ ok: true });
  await env.DB.prepare(`DELETE FROM crm_docs WHERE id = ? AND deal_id = ?`).bind(did, id).run();
  await addEvent(env, id, 'doc', `Dokumentum törölve: ${r.name}`, user.name);
  return json({ ok: true });
}
const KIND_SUB = { szerzodes: 'Szerződés', meghatalmazas: 'Meghatalmazás', nyilatkozat: 'Nyilatkozat', melleklet: 'Melléklet', egyeb: 'Dokumentum' };
async function docPdf(r, override) {
  const text = override && override.text != null ? cleanMulti(override.text, TPL_MAX) : r.text;
  const vars = override && override.vars ? varsInput(override.vars) : parseJ(r.vars, {});
  const filled = fillTemplate(text, vars);
  const hash = await sha256hex(filled);
  const number = vars.szerzodes_szam && /\{\{\s*szerzodes_szam\s*\}\}/.test(text) ? vars.szerzodes_szam : '';
  const pdf = contractPdfFromText(filled, { number, hash, title: r.name, sub: KIND_SUB[r.kind] || 'Dokumentum' });
  const fname = (r.name.split(' — ')[0] + (number ? ' ' + number : '')).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/_+/g, '_').slice(0, 90) + '.pdf';
  return { pdf, hash, fname };
}
async function handleDocPdf(request, env, user, id, did) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const r = await getDoc(env, id, did); if (!r) return json({ error: 'Nem található.' }, 404);
  const override = request.method === 'POST' ? await request.json().catch(() => null) : null;
  const { pdf, fname } = await docPdf(r, override);
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
    const { pdf, fname } = await docPdf(r);
    total += pdf.length; att.push({ filename: fname, content: bytesToB64(pdf) }); names.push(r.name); sentDocs.push(r);
  }
  for (const fid of fileIds) {
    const f = await env.DB.prepare(`SELECT name, data, size FROM crm_files WHERE id = ? AND deal_id = ?`).bind(fid, id).first();
    if (f) { total += f.size; att.push({ filename: f.name, content: f.data }); names.push(f.name); }
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
    if (path === '/templates' && method === 'GET') return await handleTemplates(env, url);
    if (path === '/templates' && method === 'POST') return await handleTemplateSave(request, env, user);
    if (path === '/templates/import' && method === 'POST') return await handleTemplateImport(request, env, user);
    if (path === '/persons' && method === 'GET') return json({ persons: await personsList(env) });
    if (path === '/persons' && method === 'POST') return await handlePersonSave(request, env);
    if (path === '/settings') return await handleSettings(request, env, user);
    let m = path.match(/^\/templates\/(\d+)$/);
    if (m && method === 'GET') return await handleTemplateGet(env, Number(m[1]));
    if (m && method === 'DELETE') return await handleTemplateDelete(env, Number(m[1]));
    m = path.match(/^\/persons\/(\d+)$/);
    if (m && method === 'DELETE') { await env.DB.prepare(`UPDATE crm_persons SET active = 0 WHERE id = ?`).bind(Number(m[1])).run(); return json({ ok: true, persons: await personsList(env) }); }
    m = path.match(/^\/card\/(\d+)\/docs$/);
    if (m && method === 'GET') return await handleDocsList(env, user, Number(m[1]));
    if (m && method === 'POST') return await handleDocCreate(request, env, user, Number(m[1]));
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
