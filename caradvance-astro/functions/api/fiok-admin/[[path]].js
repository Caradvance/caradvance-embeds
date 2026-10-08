/**
 * CarAdvance — ügyfélfiókok kezelése munkatársaknak (Cloudflare Pages Function)
 * Útvonal: /api/fiok-admin/*     Jogosultság: bejelentkezett /belso munkatárs (ca_session süti)
 *
 *   GET  /api/fiok-admin/accounts                 → fiókok + javaslatok (CRM ügyfelek, akiknek még nincs fiókjuk)
 *   POST /api/fiok-admin/accounts                 {email, name, phone, lang, invite}   → létrehozás (+ meghívó)
 *   GET  /api/fiok-admin/accounts/:id             → fiók + ügyei (várható érkezés, üzenet) + számlák
 *   POST /api/fiok-admin/accounts/:id             {name, phone, company, lang, active} → módosítás
 *   POST /api/fiok-admin/accounts/:id/invite      → meghívó (újra)küldése
 *   POST /api/fiok-admin/accounts/:id/delete      → fiók törlése (a CRM ügyek maradnak)
 *   POST /api/fiok-admin/deal-info                {deal_id, eta, note}                 → várható érkezés + ügyfélnek látható üzenet
 *   POST /api/fiok-admin/invoices                 {id?, user_id, deal_id, number, title, amount, currency, due_date, paid}
 *   POST /api/fiok-admin/invoices/:id/delete
 */
import { ensureTables, normEmail, issueCode, emailShell, sendMail, ACCOUNT_PATH, LANGS, INVITE } from '../../../lib/fiok.js';

const INVITE_DAYS = 7;

export async function onRequest(context) {
  const { request, env, params } = context;
  if (!env.DB) return json({ error: 'not_configured' }, 501);
  const seg = [].concat(params.path || []);
  const m = request.method;
  try {
    const staff = await staffUser(request, env);
    if (!staff) return json({ error: 'Nincs bejelentkezve.' }, 401);
    await ensureTables(env);
    if (m === 'POST' && !/application\/json/i.test(request.headers.get('content-type') || '')) return json({ error: 'bad_content_type' }, 415);
    const [a, b, c] = seg;
    if (a === 'accounts' && !b && m === 'GET') return await listAccounts(env);
    if (a === 'accounts' && !b && m === 'POST') return await createAccount(request, env, staff);
    if (a === 'accounts' && /^\d+$/.test(b || '')) {
      const id = Number(b);
      if (!c && m === 'GET') return await getAccount(env, id);
      if (!c && m === 'POST') return await updateAccount(request, env, id);
      if (c === 'invite' && m === 'POST') return await invite(env, id, request);
      if (c === 'delete' && m === 'POST') return await deleteAccount(env, id);
    }
    if (a === 'deal-info' && m === 'POST') return await saveDealInfo(request, env, staff);
    if (a === 'invoices' && !b && m === 'POST') return await saveInvoice(request, env, staff);
    if (a === 'invoices' && /^\d+$/.test(b || '') && c === 'delete' && m === 'POST') {
      await env.DB.prepare(`DELETE FROM cust_invoices WHERE id = ?`).bind(Number(b)).run();
      return json({ ok: true });
    }
    return json({ error: 'not_found' }, 404);
  } catch (e) {
    return json({ error: 'Szerverhiba: ' + String(e && e.message || e).slice(0, 160) }, 500);
  }
}

async function listAccounts(env) {
  const accounts = (await env.DB.prepare(`SELECT u.id, u.email, u.name, u.phone, u.company, u.lang, u.active, u.invited_at, u.last_login, u.created_at,
      (SELECT COALESCE(SUM(amount),0) FROM cust_invoices i WHERE i.user_id = u.id AND i.paid_at IS NULL) AS open_amount,
      (SELECT COUNT(*) FROM cust_invoices i WHERE i.user_id = u.id AND i.paid_at IS NULL AND i.due_date <> '' AND i.due_date < date('now')) AS overdue
    FROM cust_users u ORDER BY u.id DESC`).all()).results || [];
  // Fiókonként a CRM ügyek száma
  let dealCounts = {}, candidates = [];
  try {
    for (const r of ((await env.DB.prepare(`SELECT lower(trim(email)) AS e, COUNT(*) AS n FROM deals WHERE email <> '' GROUP BY lower(trim(email))`).all()).results || [])) dealCounts[r.e] = r.n;
    const have = new Set(accounts.map((x) => x.email));
    const seen = new Set();
    const rows = ((await env.DB.prepare(`SELECT name, phone, lower(trim(email)) AS email, car, line, stage FROM deals WHERE email <> '' ORDER BY id DESC LIMIT 400`).all()).results || [])
      .concat(((await env.DB.prepare(`SELECT name, phone, lower(trim(email)) AS email, '' AS car, type AS line, '' AS stage FROM clients WHERE email <> '' ORDER BY id DESC LIMIT 400`).all().catch(() => ({ results: [] }))).results) || []);
    for (const r of rows) {
      if (!normEmail(r.email) || have.has(r.email) || seen.has(r.email)) continue;
      seen.add(r.email);
      candidates.push({ email: r.email, name: r.name || '', phone: r.phone || '', car: r.car || '', line: r.line || '', stage: r.stage || '' });
    }
  } catch (e) {}
  for (const a of accounts) a.deal_count = dealCounts[a.email] || 0;
  return json({ accounts, candidates: candidates.slice(0, 300) });
}

async function createAccount(request, env, staff) {
  const b = await body(request);
  const email = normEmail(b.email);
  if (!email) return json({ error: 'Érvénytelen e-mail cím.' }, 400);
  const lang = LANGS.includes(b.lang) ? b.lang : 'hu';
  const ex = await env.DB.prepare(`SELECT id FROM cust_users WHERE email = ?`).bind(email).first();
  let id;
  if (ex) {
    await env.DB.prepare(`UPDATE cust_users SET active = 1, name = COALESCE(NULLIF(?, ''), name), phone = COALESCE(NULLIF(?, ''), phone), lang = ? WHERE id = ?`).bind(clean(b.name, 120), clean(b.phone, 40), lang, ex.id).run();
    id = ex.id;
  } else {
    const r = await env.DB.prepare(`INSERT INTO cust_users (email, name, phone, company, lang, active, created_by) VALUES (?, ?, ?, ?, ?, 1, ?)`).bind(email, clean(b.name, 120), clean(b.phone, 40), clean(b.company, 160), lang, staff.id).run();
    id = r.meta.last_row_id;
  }
  let invited = null;
  if (b.invite) invited = await sendInvite(env, id, request);
  return json({ ok: true, id, invited });
}

async function getAccount(env, id) {
  const account = await env.DB.prepare(`SELECT id, email, name, phone, company, lang, active, invited_at, last_login, created_at FROM cust_users WHERE id = ?`).bind(id).first();
  if (!account) return json({ error: 'Nem található.' }, 404);
  let deals = [];
  try {
    deals = (await env.DB.prepare(`SELECT d.id, d.line, d.stage, d.car, d.name, i.eta, i.note, i.updated_at FROM deals d LEFT JOIN cust_deal_info i ON i.deal_id = d.id WHERE lower(trim(d.email)) = ? ORDER BY d.id DESC`).bind(account.email).all()).results || [];
  } catch (e) {}
  const invoices = (await env.DB.prepare(`SELECT * FROM cust_invoices WHERE user_id = ? ORDER BY (paid_at IS NOT NULL), due_date, id DESC`).bind(id).all()).results || [];
  return json({ account, deals, invoices });
}

async function updateAccount(request, env, id) {
  const b = await body(request);
  const cur = await env.DB.prepare(`SELECT * FROM cust_users WHERE id = ?`).bind(id).first();
  if (!cur) return json({ error: 'Nem található.' }, 404);
  const v = (k, max) => (Object.prototype.hasOwnProperty.call(b, k) ? clean(b[k], max) : cur[k]);
  const lang = LANGS.includes(b.lang) ? b.lang : cur.lang;
  const active = Object.prototype.hasOwnProperty.call(b, 'active') ? (b.active ? 1 : 0) : cur.active;
  await env.DB.prepare(`UPDATE cust_users SET name = ?, phone = ?, company = ?, lang = ?, active = ? WHERE id = ?`).bind(v('name', 120), v('phone', 40), v('company', 160), lang, active, id).run();
  if (!active) await env.DB.prepare(`DELETE FROM cust_sessions WHERE user_id = ?`).bind(id).run();
  return json({ ok: true });
}

async function invite(env, id, request) {
  const r = await sendInvite(env, id, request);
  if (!r.ok) return json({ error: r.error }, r.status || 500);
  return json(r);
}

async function sendInvite(env, id, request) {
  const u = await env.DB.prepare(`SELECT * FROM cust_users WHERE id = ?`).bind(id).first();
  if (!u) return { ok: false, error: 'Nem található.', status: 404 };
  if (!u.active) return { ok: false, error: 'A fiók nincs aktiválva.', status: 400 };
  if (!env.RESEND_API_KEY) return { ok: false, error: 'Az e-mail küldés nincs beállítva (RESEND_API_KEY).', status: 501 };
  const lang = LANGS.includes(u.lang) ? u.lang : 'hu';
  const T = INVITE[lang] || INVITE.hu;
  const { link } = await issueCode(env, u.email, lang, INVITE_DAYS * 86400);
  const href = 'https://www.caradvance.hu' + ACCOUNT_PATH[lang] + '?t=' + link;
  const hello = { hu: 'Kedves {n}!', en: 'Dear {n},', de: 'Hallo {n},', fr: 'Bonjour {n},', uk: 'Вітаємо, {n}!', zh: '{n}，您好：', sk: 'Dobrý deň, {n},', cs: 'Dobrý den, {n},' }[lang];
  const html = emailShell(`${u.name ? `<p style="margin:0 0 12px">${esc(hello.replace('{n}', u.name))}</p>` : ''}
      <p style="margin:0 0 6px;font-size:18px;font-weight:bold">${T.title}</p>
      <p style="margin:0 0 20px;color:#4b5563">${T.lead}</p>
      <p style="margin:0 0 20px"><a href="${href}" style="display:inline-block;background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;border-radius:999px;padding:12px 24px">${T.btn}</a></p>
      <p style="margin:0 0 10px;color:#4b5563;font-size:14px">${esc(T.how.replace('{e}', u.email))}</p>
      <p style="margin:0;color:#6b7280;font-size:13px">${T.valid.replace('{d}', INVITE_DAYS)}</p>`, 'info@caradvance.hu · +36 30 233 6060');
  const ok = await sendMail(env, u.email, T.subj, html, T.title + '\n\n' + T.lead + '\n\n' + T.btn + ': ' + href + '\n\n' + T.how.replace('{e}', u.email));
  if (!ok) return { ok: false, error: 'Az e-mail küldése nem sikerült.', status: 502 };
  await env.DB.prepare(`UPDATE cust_users SET invited_at = datetime('now') WHERE id = ?`).bind(id).run();
  return { ok: true, sent_to: u.email };
}

async function deleteAccount(env, id) {
  const u = await env.DB.prepare(`SELECT email FROM cust_users WHERE id = ?`).bind(id).first();
  if (!u) return json({ error: 'Nem található.' }, 404);
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM cust_sessions WHERE user_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM cust_invoices WHERE user_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM cust_codes WHERE email = ?`).bind(u.email),
    env.DB.prepare(`DELETE FROM cust_users WHERE id = ?`).bind(id)
  ]);
  return json({ ok: true });
}

async function saveDealInfo(request, env, staff) {
  const b = await body(request);
  const dealId = Number(b.deal_id);
  if (!dealId) return json({ error: 'Hiányzó ügy.' }, 400);
  const eta = /^\d{4}-\d{2}-\d{2}$/.test(String(b.eta || '')) ? b.eta : '';
  await env.DB.prepare(`INSERT INTO cust_deal_info (deal_id, eta, note, updated_at, updated_by) VALUES (?, ?, ?, datetime('now'), ?)
    ON CONFLICT(deal_id) DO UPDATE SET eta = excluded.eta, note = excluded.note, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .bind(dealId, eta, clean(b.note, 1000), staff.id).run();
  return json({ ok: true });
}

async function saveInvoice(request, env, staff) {
  const b = await body(request);
  const userId = Number(b.user_id);
  const amount = Number(String(b.amount ?? '').replace(/\s/g, '').replace(',', '.'));
  if (!userId) return json({ error: 'Hiányzó ügyfél.' }, 400);
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'Adj meg egy érvényes összeget.' }, 400);
  const due = /^\d{4}-\d{2}-\d{2}$/.test(String(b.due_date || '')) ? b.due_date : '';
  const cur = ['HUF', 'EUR'].includes(b.currency) ? b.currency : 'HUF';
  const dealId = Number(b.deal_id) || null;
  const paid = b.paid ? (/^\d{4}-\d{2}-\d{2}/.test(String(b.paid_at || '')) ? String(b.paid_at).slice(0, 10) : new Date().toISOString().slice(0, 10)) : null;
  if (b.id) {
    await env.DB.prepare(`UPDATE cust_invoices SET deal_id = ?, number = ?, title = ?, amount = ?, currency = ?, due_date = ?, paid_at = CASE WHEN ? IS NULL THEN NULL ELSE COALESCE(paid_at, ?) END WHERE id = ? AND user_id = ?`)
      .bind(dealId, clean(b.number, 60), clean(b.title, 160), amount, cur, due, paid, paid, Number(b.id), userId).run();
    return json({ ok: true, id: Number(b.id) });
  }
  const r = await env.DB.prepare(`INSERT INTO cust_invoices (user_id, deal_id, number, title, amount, currency, due_date, paid_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(userId, dealId, clean(b.number, 60), clean(b.title, 160), amount, cur, due, paid, staff.id).run();
  return json({ ok: true, id: r.meta.last_row_id });
}

/* ---------------- segédek ---------------- */

async function staffUser(request, env) {
  const tok = cookie(request, 'ca_session');
  if (!tok) return null;
  const row = await env.DB.prepare(`SELECT u.id, u.email, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).bind(tok).first();
  if (!row) return null;
  if (new Date(String(row.expires_at).replace(' ', 'T') + 'Z').getTime() < Date.now()) return null;
  return row;
}
function cookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  for (const p of h.split(';')) {
    const i = p.indexOf('=');
    if (i > -1 && p.slice(0, i).trim() === name) return p.slice(i + 1).trim();
  }
  return '';
}
function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f<>]/g, ' ').trim().slice(0, max);
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
async function body(request) {
  try { const t = await request.text(); return t.length > 20000 ? {} : (JSON.parse(t) || {}); } catch (e) { return {}; }
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
