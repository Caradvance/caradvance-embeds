// CarAdvance CRM — ügyféllista + Ügyfél adatlap API (munkatársi, bejelentkezés szükséges)
// Route: www.caradvance.hu/api/belso-crm/*
// Ugyanazt a munkamenetet (ca_session süti) és jogosultságot használja, mint az /api/belso/*:
// admin mindent lát, a többi munkatárs csak a hozzá rendelt ügyfeleket.
import {
  ensureCrm, statusFromDeal, addEvent, listEvents, json, parseJ, clean, cleanMulti, randomHex, getCard, saveCard, inventory, STATUSES, CHECKLIST, checklistFor, checklistItems, checklistProgress, MAX_FILE, eurHuf, finSummary,
  offerEmailHtml, sendCrmMail, notifyTo, TEMPLATES, VAR_LABELS, varsFor, defaultVars, fillTemplate, contractPdfFromText,
  bytesToB64, b64ToBytes, sha256hex, priceLabel, esc, SITE
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
      progress: pr.progress, done: pr.done, total: pr.total, created_at: r.created_at, when_text: r.when_text, assigned_to: r.assigned_to
    };
  });
  return json({ clients, statuses: STATUSES });
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
    deal, card: { status: card.status, address: card.address, data: card.data, checklist: card.checklist, contract: card.contract, status_at: card.status_at, updated_at: card.updated_at },
    offers, files, events, fin, statuses: STATUSES, checklist: checklistFor(deal.line), me: user, users, testForward: testForward(env)
  });
}

const PERSON_KEYS = ['name', 'address', 'phone', 'email', 'tax'];
const COMPANY_KEYS = ['name', 'address', 'tax', 'reg'];
const CONTACT_KEYS = ['name', 'phone', 'email', 'role'];
const VEHICLE_KEYS = ['brand', 'model', 'year', 'vin', 'color', 'engine', 'fuel', 'km'];
function pick(src, keys, max) { const o = {}; src = src || {}; for (const k of keys) o[k] = clean(src[k], max || 200); return o; }
function normData(b) {
  b = b || {};
  return {
    kind: b.kind === 'ceg' ? 'ceg' : 'magan',
    person: pick(b.person, PERSON_KEYS),
    company: pick(b.company, COMPANY_KEYS),
    contact_differs: !!b.contact_differs,
    contact: pick(b.contact, CONTACT_KEYS),
    vehicle: { ...pick(b.vehicle, VEHICLE_KEYS), hybrid: !!(b.vehicle && b.vehicle.hybrid) },
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
  if (b.data !== undefined) f.data = normData(b.data);
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
    f.contract = draftSet(cur.contract || {}, tplOf(deal, c.tpl), { text: cleanMulti(c.text, 60000), vars, saved_at: new Date().toISOString().slice(0, 19), saved_by: user.name });
    f._draftTitle = tplTitle(deal, c.tpl);
  }
  const logs = f._log || []; const reason = f._reason; const draftTitle = f._draftTitle; delete f._log; delete f._reason; delete f._draftTitle;
  if (f.data) {
    const o = normData(cur.data || {}); const n = f.data; const J = (x) => JSON.stringify(x || {});
    if (J([o.kind, o.person, o.company, o.contact_differs, o.contact]) !== J([n.kind, n.person, n.company, n.contact_differs, n.contact])) logs.push(['data', 'Ügyfél személyes / céges adatai módosítva', 15]);
    if (J(o.vehicle) !== J(n.vehicle)) logs.push(['vehicle', 'Gépjármű adatai módosítva', 15]);
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
    const car = [f.data.vehicle.brand, f.data.vehicle.model].filter(Boolean).join(' ');
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
  const items = (await env.DB.prepare(`SELECT f.id, f.kind, f.title, f.amount, f.currency, f.fx, f.amount_huf, f.fdate, f.note, f.file_id, f.created_name, f.created_at,
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
  return { kind, title, amount, currency, fx, amount_huf: Math.round(currency === 'EUR' ? amount * fx : amount), fdate, note: cleanMulti(b.note, 1000) };
}
const fmtFt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft';
const finLabel = (f) => `${f.kind === 'income' ? 'Bevétel' : 'Költség'}: ${f.title} — ${f.currency === 'EUR' ? fmtFt(f.amount).replace(' Ft', ' €') + ' (' + fmtFt(f.amount_huf) + ')' : fmtFt(f.amount_huf)}`;
async function handleFinAdd(request, env, user, id) {
  const { error } = await loadDeal(env, user, id); if (error) return error;
  const b = await request.json().catch(() => ({}));
  let f, fileId = null;
  try { f = await finFields(b); fileId = await storeFile(env, id, b.file, user.id); } catch (e) { return json({ error: e.message }, 400); }
  await env.DB.prepare(`INSERT INTO crm_fin (deal_id, kind, title, amount, currency, fx, amount_huf, fdate, note, file_id, created_by, created_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, f.kind, f.title, f.amount, f.currency, f.fx, f.amount_huf, f.fdate, f.note, fileId, user.id, user.name).run();
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
    f = await finFields({ kind: cur.kind, title: cur.title, amount: cur.amount, currency: cur.currency, fdate: cur.fdate, note: cur.note, fx: cur.currency === 'EUR' && b.currency !== 'HUF' && b.amount === undefined && b.fx === undefined ? cur.fx : undefined, ...b });
    if (b.file && b.file.data) { const nid = await storeFile(env, id, b.file, user.id); if (cur.file_id) await env.DB.prepare(`DELETE FROM crm_files WHERE id = ? AND deal_id = ?`).bind(cur.file_id, id).run(); fileId = nid; }
    else if (b.removeFile && cur.file_id) { await env.DB.prepare(`DELETE FROM crm_files WHERE id = ? AND deal_id = ?`).bind(cur.file_id, id).run(); fileId = null; }
  } catch (e) { return json({ error: e.message }, 400); }
  await env.DB.prepare(`UPDATE crm_fin SET kind = ?, title = ?, amount = ?, currency = ?, fx = ?, amount_huf = ?, fdate = ?, note = ?, file_id = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(f.kind, f.title, f.amount, f.currency, f.fx, f.amount_huf, f.fdate, f.note, fileId, fid).run();
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
  const rows = ((await env.DB.prepare(`SELECT id, deal_id, kind, title, amount, currency, amount_huf, fdate, created_at, file_id FROM crm_fin ORDER BY fdate`).all()).results || []).filter((r) => ids.has(r.deal_id));
  return json({
    deals: deals.map((d) => {
      const data = parseJ(d.data, {});
      const company = data.kind === 'ceg' && data.company && data.company.name ? data.company.name : '';
      return { id: d.id, line: d.line, name: company || d.name, car: d.car, created_at: d.created_at, status: d.status || statusFromDeal(d) };
    }),
    items: rows.map((r) => ({ id: r.id, deal_id: r.deal_id, kind: r.kind, title: r.title, amount: r.amount, currency: r.currency, amount_huf: r.amount_huf, fdate: r.fdate || String(r.created_at).slice(0, 10), has_file: !!r.file_id }))
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
function draftGet(contract, key) { contract = contract || {}; return key ? ((contract.drafts || {})[key] || {}) : contract; }
function draftSet(contract, key, obj) {
  contract = contract || {};
  if (!key) return { ...contract, ...obj };
  return { ...contract, drafts: { ...(contract.drafts || {}), [key]: { ...draftGet(contract, key), ...obj } } };
}
async function handleTemplate(env, user, id, url) {
  const { deal, error } = await loadDeal(env, user, id); if (error) return error;
  const card = await getCard(env, id);
  const chosen = await chosenItem(env, id);
  const keys = varsFor(tplOf(deal, url.searchParams.get('tpl')) === 'berles' ? 'Bérlés' : deal.line);
  return json({
    line: deal.line, tpl: tplOf(deal, url.searchParams.get('tpl')), title: tplTitle(deal, url.searchParams.get('tpl')),
    text: tplOf(deal, url.searchParams.get('tpl')) === 'berles' ? TEMPLATES['Bérlés'] : (TEMPLATES[deal.line] || TEMPLATES['Eladás']),
    vars: tplOf(deal, url.searchParams.get('tpl')) === 'berles' ? defaultVars(deal, card, chosen, { code: 'ELA-B' })
      : tplOf(deal, url.searchParams.get('tpl')) === 'eladas' ? defaultVars(deal, card, chosen, { party: card.data.buyer || {} })
      : defaultVars(deal, card, chosen),
    fields: keys.map((k) => ({ key: k, label: VAR_LABELS[k] || k })), chosen
  });
}
function contractInput(b) {
  const vars = {}; for (const [k, v] of Object.entries((b && b.vars) || {})) if (/^[a-z0-9_]{1,40}$/.test(k)) vars[k] = clean(v, 400);
  return { text: cleanMulti(b && b.text, 60000), vars, tpl: b && b.tpl };
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
  const contract = draftSet(card.contract || {}, tplOf(deal, input.tpl), { text: input.text, vars: input.vars, sent_at: new Date().toISOString().slice(0, 19), sent_by: user.name, sent_to: fwd || to, sent_hash: hash, sent_files: fileIds });
  await saveCard(env, id, { contract }, user.id, user.name);
  await addEvent(env, id, 'contract', `${title} elküldve e-mailben (${number}, ${fwd ? 'TESZT → ' + fwd : to})${att.length > 1 ? ' + ' + (att.length - 1) + ' dokumentum' : ''}`, user.name);
  return json({ ok: true, sentTo: fwd || to, test: !!fwd, contract });
}

/* ---------------- router ---------------- */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/api\/belso-crm/, '') || '/';
  const method = request.method;
  try {
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
    await ensureCrm(env);
    if (path === '/list' && method === 'GET') return await handleList(env, user);
    if (path === '/clients' && method === 'POST') return await handleCreate(request, env, user);
    if (path === '/inventory' && method === 'GET') return await handleInventory(url);
    if (path === '/fin/summary' && method === 'GET') return await handleFinSummary(env, user);
    if (path === '/fx' && method === 'GET') return json({ rate: await eurHuf() });
    let m = path.match(/^\/card\/(\d+)\/fin$/);
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
