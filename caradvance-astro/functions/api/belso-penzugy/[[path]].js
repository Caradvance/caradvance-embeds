/**
 * CarAdvance — belső PÉNZÜGY API (Cloudflare Pages Function, D1: env.DB). Csak admin szerepkör.
 * Felület: /belso/penzugy/   Logika: lib/penzugy.js
 *
 *   GET  meta                         — üzletágak, kategóriák, szabályok, számlák, felosztási kulcs, NAV állapot
 *   GET  pnl?from=YYYY-MM-DD&to=…     — eredménykimutatás nyers cellái (kategória × hónap × üzletág)
 *   GET  tx?from&to                   — tranzakciók
 *   POST tx                           — kézi tétel (készpénzes kiadás, elhatárolás…)
 *   POST tx/:id                       — besorolás módosítása (kézi), opcionálisan szabály mentése
 *   POST tx/:id/reset | tx/:id/delete | tx/:id/link {doc_id} | tx/bulk {ids, cat_id, split}
 *   GET  tx/:id/suggest               — lehetséges bizonylatok
 *   POST import {account, rows}       — banki kivonat sorai (a böngésző olvassa ki az XLS-ből)
 *   POST rules | rules/:id/delete | rules/run
 *   POST lines | cats | alloc | accounts/:id
 *   GET  docs?from&to | docs/:id/file    POST docs | docs/:id/delete
 *   POST match/auto | nav/sync {from,to} | fx/fill
 */
import {
  json, ensureFin, clean, isDate, addDays, normSplit, nowIso, importRows, applyRules, autoMatch, suggestDocs, saveFile, loadFile,
  pnl, getSetting, setSetting, navConfigured, navSync, fillFx, norm, subjectOf, loadBlock, purgeBlocked, deleteTxs, genRecurring,
  normPlate, splitTx, unsplitTx, refxAll, listRentals, payRental, unpayRental, finStart, purgeBefore
} from '../../../lib/penzugy.js';

async function staffUser(request, env) {
  const ck = request.headers.get('cookie') || '';
  const mm = /(?:^|;\s*)ca_session=([^;]+)/.exec(ck);
  if (!mm) return null;
  try {
    const u = await env.DB.prepare(`SELECT u.id, u.email, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).bind(decodeURIComponent(mm[1])).first();
    if (!u) return null;
    if (u.expires_at && new Date(String(u.expires_at).replace(' ', 'T') + (String(u.expires_at).endsWith('Z') ? '' : 'Z')).getTime() < Date.now()) return null;
    return u;
  } catch (e) { return null; }
}
async function readJson(request) {
  const t = await request.text();
  if (t.length > 15000000) return null;
  try { const j = JSON.parse(t || '{}'); return j && typeof j === 'object' ? j : null; } catch (e) { return null; }
}
const num = (v) => (v === '' || v == null || !isFinite(Number(v)) ? null : Number(v));
const vatOk = (v) => (v === '' || v == null ? null : Math.max(0, Math.min(27, Math.round(Number(v)) || 0)));
const docModeOk = (v) => (v === 'invoice' || v === 'none' ? v : null);
function period(url) {
  const y = new Date().getUTCFullYear();
  let from = url.searchParams.get('from') || `${y}-01-01`, to = url.searchParams.get('to') || `${y}-12-31`;
  if (!isDate(from)) from = `${y}-01-01`;
  if (!isDate(to)) to = `${y}-12-31`;
  return [from, to];
}
async function lineSet(env) { return new Set((await env.DB.prepare(`SELECT id FROM fin_lines`).all()).results.map((r) => r.id)); }
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function onRequest(context) {
  const { request, env, params } = context;
  const parts = Array.isArray(params.path) ? params.path : String(params.path || '').split('/').filter(Boolean);
  const m = request.method;
  const url = new URL(request.url);
  try {
    if (!env.DB) return json({ error: 'Nincs adatbázis.' }, 500);
    const me = await staffUser(request, env);
    if (!me) return json({ error: 'Nincs bejelentkezve.' }, 401);
    if (me.role !== 'admin') return json({ error: 'A pénzügyi modul csak admin jogosultsággal érhető el.' }, 403);
    await ensureFin(env);
    if (m === 'POST' && !(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'Hibás kérés.' }, 415);
    const body = m === 'POST' ? await readJson(request) : {};
    if (body === null) return json({ error: 'Hibás vagy túl nagy kérés.' }, 400);
    const who = me.name || me.email;
    const [p0, p1, p2] = parts;
    const DB = env.DB;

    /* ---------- meta ---------- */
    if (m === 'GET' && p0 === 'meta') {
      const [lines, cats, rules, accounts, alloc, navLast, stats, vehicles] = await Promise.all([
        DB.prepare(`SELECT * FROM fin_lines ORDER BY sort, id`).all().then((r) => r.results),
        DB.prepare(`SELECT * FROM fin_cats ORDER BY sort, id`).all().then((r) => r.results),
        DB.prepare(`SELECT * FROM fin_rules ORDER BY prio, id`).all().then((r) => r.results),
        DB.prepare(`SELECT a.*, (SELECT COUNT(*) FROM fin_tx t WHERE t.account_id = a.id) AS n, (SELECT MAX(bdate) FROM fin_tx t WHERE t.account_id = a.id) AS last FROM fin_accounts a ORDER BY a.id`).all().then((r) => r.results),
        getSetting(env, 'alloc', { mode: 'fixed', key: {} }),
        getSetting(env, 'nav_last', null),
        DB.prepare(`SELECT MIN(bdate) AS min, MAX(bdate) AS max, COUNT(*) AS n FROM fin_tx`).first(),
        getSetting(env, 'vehicles', {})
      ]);
      const block = (await loadBlock(env)).map((b) => ({ id: b.id, name: b.name, pattern: b.pattern, created_at: b.created_at }));
      return json({ me: { name: me.name, email: me.email }, lines, cats, rules, accounts, alloc, block, nav: { configured: navConfigured(env), last: navLast, test: env.NAV_TEST === '1' }, stats, vehicles, fin_start: await finStart(env) });
    }

    /* ---------- P&L ---------- */
    if (m === 'GET' && p0 === 'pnl') { await genRecurring(env); const [from, to] = period(url); return json(await pnl(env, from, to)); }
    if (m === 'GET' && p0 === 'recurring') return json({ items: (await DB.prepare(`SELECT r.*, (SELECT COUNT(*) FROM fin_tx t WHERE t.uid LIKE 'rec-' || r.id || '-%') AS n FROM fin_recurring r ORDER BY r.active DESC, r.id`).all()).results });
    if (m === 'POST' && p0 === 'recurring' && p1 && p2 === 'delete') {
      await DB.prepare(`UPDATE fin_recurring SET active = 0 WHERE id = ?`).bind(Number(p1)).run();
      let removed = 0;
      if (body.remove_future) { const now = new Date().toISOString().slice(0, 7); removed = (await DB.prepare(`DELETE FROM fin_tx WHERE uid LIKE ? AND substr(bdate, 1, 7) > ?`).bind(`rec-${Number(p1)}-%`, now).run()).meta.changes; }
      return json({ ok: true, removed });
    }
    /* ---------- bérlések ---------- */
    if (m === 'GET' && p0 === 'rentals') return json({ rentals: await listRentals(env) });
    if (m === 'POST' && p0 === 'rentals' && !p1) {
      const renter = clean(body.renter, 160), start = isDate(body.start_date) ? body.start_date : null, amount = Math.abs(num(body.amount));
      if (!renter || !start || !amount) return json({ error: 'Bérlő, kezdő nap és havi díj kötelező.' }, 400);
      const vals = [renter, clean(body.co_renter, 160), clean(body.contact, 300), clean(body.car, 120), normPlate(body.plate), clean(body.contract_no, 60), Number(body.doc_id) || null, start,
        Math.max(1, Math.min(120, Math.round(num(body.months) || 1))), amount, /^[A-Z]{3}$/.test(body.currency || '') ? body.currency : 'EUR', vatOk(body.vat), body.pay_method === 'transfer' ? 'transfer' : 'cash',
        num(body.deposit) || null, clean(body.note, 600), body.status === 'ended' ? 'ended' : 'active', who];
      let id = Number(body.id) || null;
      if (id) await DB.prepare(`UPDATE fin_rentals SET renter = ?, co_renter = ?, contact = ?, car = ?, plate = ?, contract_no = ?, doc_id = ?, start_date = ?, months = ?, amount = ?, currency = ?, vat = ?, pay_method = ?, deposit = ?, note = ?, status = ?, updated_by = ? WHERE id = ?`).bind(...vals, id).run();
      else id = (await DB.prepare(`INSERT INTO fin_rentals (renter, co_renter, contact, car, plate, contract_no, doc_id, start_date, months, amount, currency, vat, pay_method, deposit, note, status, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(...vals).run()).meta.last_row_id;
      return json({ id });
    }
    if (m === 'POST' && p0 === 'rentals' && p1 && p2 === 'pay') {
      try { return json({ ok: true, tx_id: await payRental(env, Number(p1), Number(body.seq), body, who) }); } catch (e) { return json({ error: e.message }, 400); }
    }
    if (m === 'POST' && p0 === 'rentals' && p1 && p2 === 'unpay') return json({ ok: true, removed: await unpayRental(env, Number(p1), Number(body.seq), body.tx_id) });
    if (m === 'POST' && p0 === 'rentals' && p1 && p2 === 'delete') {
      if ((await DB.prepare(`SELECT COUNT(*) AS n FROM fin_tx WHERE rental_id = ?`).bind(Number(p1)).first()).n) return json({ error: 'Van már könyvelt díja – előbb vond vissza a fizetéseket, vagy állítsd „lezárt”-ra.' }, 400);
      await DB.prepare(`DELETE FROM fin_rentals WHERE id = ?`).bind(Number(p1)).run(); return json({ ok: true });
    }
    if (m === 'POST' && p0 === 'recurring' && !p1) {
      const name = clean(body.name, 120), amount = num(body.amount);
      if (!name || !amount) return json({ error: 'Név és (előjeles) havi összeg kötelező.' }, 400);
      const start = /^\d{4}-\d{2}$/.test(body.start || '') ? body.start : new Date().toISOString().slice(0, 7);
      const endM = /^\d{4}-\d{2}$/.test(body.end_month || '') ? body.end_month : '';
      const cur = /^[A-Z]{3}$/.test(body.currency || '') ? body.currency : 'HUF';
      const split = normSplit(body.split, await lineSet(env));
      const vals = [name, clean(body.partner, 160), amount, cur, Number(body.cat_id) || null, split ? JSON.stringify(split) : null, vatOk(body.vat), docModeOk(body.doc_mode), Math.min(28, Math.max(1, Math.round(num(body.day) || 1))), start, endM, body.active === false || body.active === 0 ? 0 : 1, normPlate(body.plate), body.accrue ? 1 : 0];
      let id = Number(body.id) || null;
      if (id) await DB.prepare(`UPDATE fin_recurring SET name = ?, partner = ?, amount = ?, currency = ?, cat_id = ?, split = ?, vat = ?, doc_mode = ?, day = ?, start = ?, end_month = ?, active = ?, plate = ?, accrue = ? WHERE id = ?`).bind(...vals, id).run();
      else id = (await DB.prepare(`INSERT INTO fin_recurring (name, partner, amount, currency, cat_id, split, vat, doc_mode, day, start, end_month, active, plate, accrue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(...vals).run()).meta.last_row_id;
      return json({ id, generated: await genRecurring(env) });
    }

    /* ---------- tranzakciók ---------- */
    if (m === 'GET' && p0 === 'tx' && !p1) {
      const [from, to] = period(url);
      const rows = (await DB.prepare(`SELECT t.*, a.name AS account_name, d.number AS doc_number, d.partner AS doc_partner, d.source AS doc_source, d.file_size AS doc_file, d.note AS doc_note, d.net AS doc_net, d.gross AS doc_gross
        FROM fin_tx t LEFT JOIN fin_accounts a ON a.id = t.account_id LEFT JOIN fin_docs d ON d.id = t.doc_id
        WHERE t.bdate BETWEEN ? AND ? ORDER BY t.bdate DESC, t.id DESC LIMIT 10000`).bind(from, to).all()).results;
      return json({ tx: rows });
    }
    if (m === 'GET' && p0 === 'tx' && p1 && p2 === 'suggest') return json({ docs: await suggestDocs(env, Number(p1)) });

    if (m === 'POST' && p0 === 'tx' && !p1) { // kézi tétel
      const bdate = isDate(body.bdate) ? body.bdate : null;
      const amount = num(body.amount);
      if (!bdate || !amount) return json({ error: 'Dátum és (előjeles) összeg kötelező.' }, 400);
      const cur = /^[A-Z]{3}$/.test(body.currency || '') ? body.currency : 'HUF';
      let acc = Number(body.account_id) || null;
      if (!acc) acc = ((await DB.prepare(`SELECT id FROM fin_accounts WHERE ext_id = 'CASH'`).first()) || {}).id || null;
      const split = normSplit(body.split, await lineSet(env));
      const uid = 'manual-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await DB.prepare(`INSERT INTO fin_tx (uid, account_id, src, bdate, vdate, ttype, amount, currency, fx, amount_huf, partner, memo, cat_id, split, vat, doc_mode, manual, note, plate, updated_at, updated_by)
        VALUES (?, ?, 'manual', ?, ?, 'Kézi tétel', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`)
        .bind(uid, acc, bdate, bdate, amount, cur, cur === 'HUF' ? 1 : null, cur === 'HUF' ? amount : null, clean(body.partner, 160), clean(body.memo, 400),
          Number(body.cat_id) || null, split ? JSON.stringify(split) : null, vatOk(body.vat), docModeOk(body.doc_mode), clean(body.note, 400), normPlate(body.plate), nowIso(), who).run();
      if (cur !== 'HUF') await fillFx(env);
      return json({ id: res.meta.last_row_id });
    }
    if (m === 'POST' && p0 === 'tx' && p1 === 'bulk-delete') {
      const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter(Boolean).slice(0, 2000);
      if (!ids.length) return json({ error: 'Nincs kijelölt tétel.' }, 400);
      return json({ ok: true, deleted: await deleteTxs(env, ids, who) });
    }
    if (m === 'GET' && p0 === 'deleted') return json({ items: (await DB.prepare(`SELECT d.*, a.name AS account_name FROM fin_deleted d LEFT JOIN fin_accounts a ON a.id = d.account_id ORDER BY d.deleted_at DESC LIMIT 500`).all()).results });
    if (m === 'POST' && p0 === 'deleted' && p1 === 'restore') { await DB.prepare(`DELETE FROM fin_deleted WHERE uid = ?`).bind(clean(body.uid, 80)).run(); return json({ ok: true }); }
    if (m === 'POST' && p0 === 'tx' && p1 === 'bulk') {
      const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter(Boolean).slice(0, 2000);
      if (!ids.length) return json({ error: 'Nincs kijelölt tétel.' }, 400);
      const ls = await lineSet(env);
      const sets = ['manual = 1', 'updated_at = ?', 'updated_by = ?'], vals = [nowIso(), who];
      if (Object.prototype.hasOwnProperty.call(body, 'cat_id')) { sets.push('cat_id = ?'); vals.push(Number(body.cat_id) || null); }
      if (Object.prototype.hasOwnProperty.call(body, 'split')) { const s = normSplit(body.split, ls); sets.push('split = ?'); vals.push(s ? JSON.stringify(s) : null); }
      if (Object.prototype.hasOwnProperty.call(body, 'doc_mode')) { sets.push('doc_mode = ?'); vals.push(docModeOk(body.doc_mode)); }
      const st = ids.map((id) => DB.prepare(`UPDATE fin_tx SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id));
      for (let i = 0; i < st.length; i += 80) await DB.batch(st.slice(i, i + 80));
      return json({ ok: true, n: ids.length });
    }
    if (m === 'POST' && p0 === 'tx' && p1) {
      const id = Number(p1);
      const t = await DB.prepare(`SELECT * FROM fin_tx WHERE id = ?`).bind(id).first();
      if (!t) return json({ error: 'Nem található.' }, 404);
      if (p2 === 'delete') {
        let purged = 0;
        if (body.block_partner && t.partner && t.partner !== 'Bank') { // a partner minden tétele is, a jövőben is
          const pat = norm(t.partner).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          await DB.prepare(`INSERT INTO fin_block (name, pattern) VALUES (?, ?)`).bind(t.partner, pat).run();
          purged = await purgeBlocked(env);
        }
        const n = (await DB.prepare(`SELECT id FROM fin_tx WHERE id = ?`).bind(id).first()) ? await deleteTxs(env, [id], who) : 0;
        return json({ ok: true, deleted: n + purged });
      }
      if (p2 === 'reset') {
        await DB.prepare(`UPDATE fin_tx SET manual = 0, updated_at = ?, updated_by = ? WHERE id = ?`).bind(nowIso(), who, id).run();
        await applyRules(env, new Set([id]));
        return json({ ok: true });
      }
      if (p2 === 'split') {
        try { return json({ ok: true, parts: await splitTx(env, id, body.parts, who, await lineSet(env)) }); }
        catch (e) { return json({ error: e.message }, 400); }
      }
      if (p2 === 'unsplit') { await unsplitTx(env, id, who); return json({ ok: true }); }
      if (p2 === 'link') {
        const did = body.doc_id ? Number(body.doc_id) : null;
        if (did && !(await DB.prepare(`SELECT id FROM fin_docs WHERE id = ?`).bind(did).first())) return json({ error: 'Nincs ilyen bizonylat.' }, 404);
        await DB.prepare(`UPDATE fin_tx SET doc_id = ?, match_kind = ? WHERE id = ?`).bind(did, did ? 'manual' : null, id).run();
        return json({ ok: true });
      }
      // besorolás módosítása
      const ls = await lineSet(env);
      const split = Object.prototype.hasOwnProperty.call(body, 'split') ? normSplit(body.split, ls) : normSplit(t.split, ls);
      const cat = Object.prototype.hasOwnProperty.call(body, 'cat_id') ? (Number(body.cat_id) || null) : t.cat_id;
      const vat = Object.prototype.hasOwnProperty.call(body, 'vat') ? vatOk(body.vat) : t.vat;
      const doc = Object.prototype.hasOwnProperty.call(body, 'doc_mode') ? docModeOk(body.doc_mode) : t.doc_mode;
      const note = Object.prototype.hasOwnProperty.call(body, 'note') ? clean(body.note, 400) : t.note;
      const extra = [];
      if (Object.prototype.hasOwnProperty.call(body, 'plate')) extra.push(['plate', normPlate(body.plate)]);
      if (Object.prototype.hasOwnProperty.call(body, 'period_from')) { extra.push(['period_from', isDate(body.period_from) ? body.period_from : null]); extra.push(['period_months', isDate(body.period_from) ? Math.max(1, Math.min(60, Math.round(num(body.period_months) || 1))) : null]); }
      if (t.src === 'split' && body.memo != null) extra.push(['memo', clean(body.memo, 400)]);
      if (t.src === 'manual') {
        if (isDate(body.bdate)) extra.push(['bdate', body.bdate]);
        if (num(body.amount)) { extra.push(['amount', num(body.amount)]); if (t.currency === 'HUF') extra.push(['amount_huf', num(body.amount)]); else extra.push(['amount_huf', null]); }
        if (body.partner != null) extra.push(['partner', clean(body.partner, 160)]);
        if (body.memo != null) extra.push(['memo', clean(body.memo, 400)]);
      }
      await DB.prepare(`UPDATE fin_tx SET cat_id = ?, split = ?, vat = ?, doc_mode = ?, note = ?, manual = 1, updated_at = ?, updated_by = ?${extra.map((e) => `, ${e[0]} = ?`).join('')} WHERE id = ?`)
        .bind(cat, split ? JSON.stringify(split) : null, vat, doc, note, nowIso(), who, ...extra.map((e) => e[1]), id).run();
      if (extra.some((e) => e[0] === 'amount') && t.currency !== 'HUF') await fillFx(env);
      let ruleId = null, applied = 0;
      if (body.make_rule) {
        const pat = clean(body.make_rule.pattern, 200) || escRe(norm(t.partner));
        if (!pat) return json({ error: 'A szabályhoz minta kell (pl. a partner neve).' }, 400);
        try { new RegExp(pat, 'i'); } catch (e) { return json({ error: 'Hibás minta (regex): ' + e.message }, 400); }
        const dir = ['in', 'out', 'any'].includes(body.make_rule.dir) ? body.make_rule.dir : (Number(t.amount) >= 0 ? 'in' : 'out');
        const res = await DB.prepare(`INSERT INTO fin_rules (prio, name, pattern, dir, cat_id, split, vat, doc_mode) VALUES (5, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(clean(body.make_rule.name, 120) || (t.partner || pat), pat, dir, cat, split ? JSON.stringify(split) : null, vat, doc).run();
        ruleId = res.meta.last_row_id;
        applied = await applyRules(env);
      }
      return json({ ok: true, rule_id: ruleId, applied });
    }

    /* ---------- import ---------- */
    if (m === 'POST' && p0 === 'import') {
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 20000) : [];
      if (!rows.length) return json({ error: 'Nincs importálható sor.' }, 400);
      const r = await importRows(env, body.account || {}, rows, who);
      return json(r);
    }

    /* ---------- szabályok ---------- */
    if (m === 'POST' && p0 === 'rules' && p1 === 'run') { const changed = await applyRules(env); const matched = await autoMatch(env); return json({ changed, matched }); }
    if (m === 'POST' && p0 === 'rules' && p1 && p2 === 'delete') { await DB.prepare(`DELETE FROM fin_rules WHERE id = ?`).bind(Number(p1)).run(); return json({ ok: true }); }
    if (m === 'POST' && p0 === 'rules' && !p1) {
      const pat = String(body.pattern || '').trim().slice(0, 300);
      if (!pat) return json({ error: 'Minta kötelező.' }, 400);
      try { new RegExp(pat, 'i'); } catch (e) { return json({ error: 'Hibás minta (regex): ' + e.message }, 400); }
      const split = normSplit(body.split, await lineSet(env));
      const vals = [Math.round(num(body.prio) ?? 50), clean(body.name, 120), pat, ['in', 'out', 'any'].includes(body.dir) ? body.dir : 'any', Number(body.cat_id) || null,
        split ? JSON.stringify(split) : null, vatOk(body.vat), docModeOk(body.doc_mode), body.active === false || body.active === 0 ? 0 : 1];
      if (body.id) await DB.prepare(`UPDATE fin_rules SET prio = ?, name = ?, pattern = ?, dir = ?, cat_id = ?, split = ?, vat = ?, doc_mode = ?, active = ? WHERE id = ?`).bind(...vals, Number(body.id)).run();
      else await DB.prepare(`INSERT INTO fin_rules (prio, name, pattern, dir, cat_id, split, vat, doc_mode, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(...vals).run();
      const changed = body.run === false ? 0 : await applyRules(env);
      return json({ ok: true, changed });
    }
    if (m === 'POST' && p0 === 'rules-test') { // minta próbája a meglévő tételeken
      let re; try { re = new RegExp(String(body.pattern || ''), 'i'); } catch (e) { return json({ error: 'Hibás minta: ' + e.message }, 400); }
      const rows = (await DB.prepare(`SELECT id, bdate, ttype, partner, memo, iban, amount, currency FROM fin_tx ORDER BY bdate DESC LIMIT 5000`).all()).results;
      const hit = rows.filter((t) => re.test(subjectOf(t)) && (!body.dir || body.dir === 'any' || (body.dir === 'in') === (t.amount >= 0)));
      return json({ n: hit.length, sample: hit.slice(0, 15) });
    }

    /* ---------- tiltólista ---------- */
    if (m === 'POST' && p0 === 'block' && !p1) {
      const pat = String(body.pattern || '').trim().slice(0, 300);
      if (pat.length < 3) return json({ error: 'Adj meg legalább 3 karakteres mintát (pl. a partner nevét ékezet nélkül, nagybetűvel).' }, 400);
      try { new RegExp(pat, 'i'); } catch (e) { return json({ error: 'Hibás minta (regex): ' + e.message }, 400); }
      await DB.prepare(`INSERT INTO fin_block (name, pattern) VALUES (?, ?)`).bind(clean(body.name, 120) || pat, pat).run();
      return json({ ok: true, purged: await purgeBlocked(env) });
    }
    if (m === 'POST' && p0 === 'block' && p1 && p2 === 'delete') { await DB.prepare(`DELETE FROM fin_block WHERE id = ?`).bind(Number(p1)).run(); return json({ ok: true }); }

    /* ---------- üzletágak, kategóriák, felosztás, számlák ---------- */
    if (m === 'POST' && p0 === 'lines') {
      const name = clean(body.name, 80); if (!name) return json({ error: 'Név kötelező.' }, 400);
      const color = /^#[0-9a-fA-F]{6}$/.test(body.color || '') ? body.color : '#5A6B82';
      const vals = [name, color, body.shared ? 1 : 0, Math.round(num(body.sort) ?? 50), body.active === false || body.active === 0 ? 0 : 1];
      if (body.id) await DB.prepare(`UPDATE fin_lines SET name = ?, color = ?, shared = ?, sort = ?, active = ? WHERE id = ?`).bind(...vals, Number(body.id)).run();
      else await DB.prepare(`INSERT INTO fin_lines (code, name, color, shared, sort, active) VALUES (?, ?, ?, ?, ?, ?)`).bind('L' + Date.now().toString(36).toUpperCase(), ...vals).run();
      return json({ ok: true });
    }
    if (m === 'POST' && p0 === 'cats') {
      const name = clean(body.name, 100); if (!name) return json({ error: 'Név kötelező.' }, 400);
      const kind = ['rev', 'cogs', 'opex', 'below', 'excl'].includes(body.kind) ? body.kind : 'opex';
      const vals = [name, kind, clean(body.grp, 60), docModeOk(body.doc_mode) || 'invoice', vatOk(body.vat) || 0, Math.round(num(body.sort) ?? 500), body.active === false || body.active === 0 ? 0 : 1];
      if (body.id) await DB.prepare(`UPDATE fin_cats SET name = ?, kind = ?, grp = ?, doc_mode = ?, vat = ?, sort = ?, active = ? WHERE id = ?`).bind(...vals, Number(body.id)).run();
      else await DB.prepare(`INSERT INTO fin_cats (code, name, kind, grp, doc_mode, vat, sort, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind('C' + Date.now().toString(36).toUpperCase(), ...vals).run();
      return json({ ok: true });
    }
    if (m === 'POST' && p0 === 'vehicles') { // rendszám → megnevezés (pl. „M-AO 1230” → „BMW X5 xDrive30d”)
      const out = {};
      for (const [k, v] of Object.entries(body.map || {})) { const pl = normPlate(k); if (pl) out[pl] = clean(v, 80); }
      await setSetting(env, 'vehicles', out);
      return json({ ok: true, vehicles: out });
    }
    if (m === 'POST' && p0 === 'alloc') {
      const mode = ['fixed', 'revenue', 'none'].includes(body.mode) ? body.mode : 'fixed';
      const ls = await lineSet(env); const key = {};
      for (const [k, v] of Object.entries(body.key || {})) if (ls.has(Number(k)) && Number(v) > 0) key[Number(k)] = Math.round(Number(v) * 100) / 100;
      await setSetting(env, 'alloc', { mode, key });
      return json({ ok: true });
    }
    if (m === 'POST' && p0 === 'accounts' && p1) {
      await DB.prepare(`UPDATE fin_accounts SET name = ?, entity = ? WHERE id = ?`).bind(clean(body.name, 80), clean(body.entity, 80), Number(p1)).run();
      return json({ ok: true });
    }

    /* ---------- bizonylatok ---------- */
    if (m === 'GET' && p0 === 'docs' && !p1) {
      const [from, to] = period(url);
      const rows = (await DB.prepare(`SELECT d.*, (SELECT GROUP_CONCAT(t.id) FROM fin_tx t WHERE t.doc_id = d.id) AS tx_ids FROM fin_docs d
        WHERE (d.issue_date BETWEEN ? AND ?) OR d.issue_date = '' ORDER BY d.issue_date DESC, d.id DESC LIMIT 5000`).bind(addDays(from, -60), to).all()).results;
      return json({ docs: rows });
    }
    if (m === 'GET' && p0 === 'docs' && p1 && p2 === 'file') {
      const d = await DB.prepare(`SELECT file_name, file_mime FROM fin_docs WHERE id = ?`).bind(Number(p1)).first();
      const bytes = d && await loadFile(env, Number(p1));
      if (!bytes) return json({ error: 'Nincs csatolt fájl.' }, 404);
      return new Response(bytes, { headers: { 'Content-Type': d.file_mime || 'application/octet-stream', 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(d.file_name || 'bizonylat')}`, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
    }
    if (m === 'POST' && p0 === 'docs' && p1 && p2 === 'delete') {
      const id = Number(p1);
      await DB.batch([DB.prepare(`UPDATE fin_tx SET doc_id = NULL, match_kind = NULL WHERE doc_id = ?`).bind(id), DB.prepare(`DELETE FROM fin_files WHERE doc_id = ?`).bind(id), DB.prepare(`DELETE FROM fin_docs WHERE id = ?`).bind(id)]);
      return json({ ok: true });
    }
    if (m === 'POST' && p0 === 'docs' && !p1) {
      const f = body.file && body.file.b64 ? body.file : null;
      if (f && f.b64.length > 11000000) return json({ error: 'A fájl túl nagy (max. ~8 MB).' }, 400);
      // külső azonosító (pl. Revolut expense ID): ugyanazt a bizonylatot ne vegyük fel kétszer
      const extKey = body.ext_key ? clean(body.ext_key, 120) : null;
      if (extKey && !body.id) { const ex = await DB.prepare(`SELECT id FROM fin_docs WHERE nav_key = ?`).bind(extKey).first(); if (ex) return json({ id: ex.id, dup: true, matched: 0 }); }
      // tranzakció a bank saját azonosítója alapján (Revolut Transaction ID); díj-sor helyett a fő tétel
      if (!body.link_tx && body.link_ref) {
        const t = await DB.prepare(`SELECT id FROM fin_tx WHERE bank_ref = ? AND doc_id IS NULL ORDER BY (ttype LIKE 'Díj%'), ABS(amount) DESC LIMIT 1`).bind(clean(body.link_ref, 80)).first();
        if (t) body.link_tx = t.id;
      }
      const cur = /^[A-Z]{3}$/.test(body.currency || '') ? body.currency : 'HUF';
      const gross = num(body.gross), net = num(body.net), vat = num(body.vat);
      const vals = [body.dir === 'out' ? 'out' : 'in', ['szamla', 'nyugta', 'egyeb'].includes(body.kind) ? body.kind : 'szamla', clean(body.number, 80), clean(body.partner, 160), clean(body.partner_tax, 20),
        isDate(body.issue_date) ? body.issue_date : '', cur, net, vat, gross, cur === 'HUF' ? gross : null, cur === 'HUF' ? net : null, clean(body.note, 400)];
      let id = Number(body.id) || null;
      if (id) await DB.prepare(`UPDATE fin_docs SET dir = ?, kind = ?, number = ?, partner = ?, partner_tax = ?, issue_date = ?, currency = ?, net = ?, vat = ?, gross = ?, gross_huf = ?, net_huf = ?, note = ? WHERE id = ?`).bind(...vals, id).run();
      else id = (await DB.prepare(`INSERT INTO fin_docs (dir, kind, number, partner, partner_tax, issue_date, currency, net, vat, gross, gross_huf, net_huf, note, source, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(...vals, body.source === 'gmail' ? 'gmail' : 'upload', who).run()).meta.last_row_id;
      if (extKey) await DB.prepare(`UPDATE fin_docs SET nav_key = ? WHERE id = ?`).bind(extKey, id).run();
      if (body.plate != null) await DB.prepare(`UPDATE fin_docs SET plate = ? WHERE id = ?`).bind(normPlate(body.plate), id).run();
      if (f) {
        await saveFile(env, id, String(f.b64).replace(/^data:[^,]*,/, ''));
        await DB.prepare(`UPDATE fin_docs SET file_name = ?, file_mime = ?, file_size = ? WHERE id = ?`).bind(clean(f.name, 120) || 'bizonylat', clean(f.mime, 80) || 'application/octet-stream', Math.round(f.b64.length * 0.75), id).run();
      }
      if (body.link_tx) await DB.prepare(`UPDATE fin_tx SET doc_id = ?, match_kind = 'manual' WHERE id = ?`).bind(id, Number(body.link_tx)).run();
      const matched = body.link_tx ? 0 : await autoMatch(env);
      return json({ id, matched, linked: body.link_tx ? Number(body.link_tx) : null });
    }

    /* ---------- párosítás, NAV, árfolyam ---------- */
    if (m === 'POST' && p0 === 'match' && p1 === 'auto') return json({ matched: await autoMatch(env) });
    if (m === 'POST' && p0 === 'nav' && p1 === 'sync') {
      const to = isDate(body.to) ? body.to : new Date().toISOString().slice(0, 10);
      const from = isDate(body.from) ? body.from : addDays(to, -60);
      if (from > to) return json({ error: 'Hibás időszak.' }, 400);
      return json(await navSync(env, from, to, who));
    }
    if (m === 'POST' && p0 === 'fx' && p1 === 'fill') return json({ missing: await fillFx(env) });
    if (m === 'POST' && p0 === 'fx' && p1 === 'mnb') return json({ missing: await refxAll(env) }); // minden devizás tétel újraszámolása MNB középárfolyammal
    if (m === 'POST' && p0 === 'fin-start') { // pénzügyi kezdőnap beállítása; az előtte lévő tételek törlődnek
      if (isDate(body.date)) await setSetting(env, 'fin_start', body.date);
      return json({ ok: true, start: await finStart(env), removed: await purgeBefore(env) });
    }
    if (m === 'GET' && p0 === 'fx' && p1 === 'status') return json({ err: await getSetting(env, 'fx_mnb_err', null), mnb: (await DB.prepare(`SELECT cur, COUNT(*) AS n, MIN(date) AS min, MAX(date) AS max FROM fin_fx WHERE cur LIKE '%@MNB' GROUP BY cur`).all()).results });
    if (m === 'POST' && p0 === 'fx' && p1 === 'rates') { // MNB-árfolyamok kézi betöltése (pl. ha az MNB szolgáltatás nem érhető el a szerverről): { cur, rates: { 'YYYY-MM-DD': rate } }
      const cur = /^[A-Z]{3}$/.test(body.cur || '') ? body.cur : null; if (!cur) return json({ error: 'cur' }, 400);
      const st = Object.entries(body.rates || {}).filter(([d, v]) => isDate(d) && Number(v) > 0).map(([d, v]) => DB.prepare(`INSERT OR REPLACE INTO fin_fx (cur, date, rate) VALUES (?, ?, ?)`).bind(cur + '@MNB', d, Number(v)));
      for (let i = 0; i < st.length; i += 80) await DB.batch(st.slice(i, i + 80));
      return json({ ok: true, n: st.length });
    }

    return json({ error: 'Nem található.' }, 404);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, 500);
  }
}
