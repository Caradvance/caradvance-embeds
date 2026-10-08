/**
 * CarAdvance — ügyfélfiók API (Cloudflare Pages Function)
 * Útvonal: /api/fiok/*      D1 kötés: DB (ugyanaz, mint a /belso-é)
 *
 * Csak meglévő ügyfeleknek: belépni csak az tud, akinek a fiókját munkatárs létrehozta
 * és aktiválta a /belso → Ügyfélfiókok oldalon. Regisztráció nincs.
 * Belépés jelszó nélkül: e-mail cím → 6 jegyű kód vagy egykattintásos link (Resend).
 *
 *   POST /api/fiok/kod        {email, lang}          → kód + link e-mailben (csak meglévő, aktív fióknak)
 *   POST /api/fiok/belepes    {email, code} | {t}    → munkamenet-süti (180 nap)
 *   GET  /api/fiok/me                                → profil, ügyek (lépés + várható érkezés), ajánlatok, számlák
 *   POST /api/fiok/profil     {name, phone, company, lang}
 *   POST /api/fiok/kilepes
 *
 * A munkatársi /belso munkamenettől független (külön süti: ca_cust).
 */
import { ensureTables, rateOk, STAGES, sha256hex, randomHex, issueCode, normEmail, emailShell, sendMail, ACCOUNT_PATH, LANGS } from '../../../lib/fiok.js';

const SESSION_DAYS = 180;
const CODE_MIN = 15;
const DOMAINS = { 'caradvance.sk': 'sk', 'www.caradvance.sk': 'sk', 'caradvance.cz': 'cs', 'www.caradvance.cz': 'cs' };

export async function onRequest(context) {
  const { request, env, params } = context;
  if (!env.DB) return json({ ok: false, error: 'not_configured' }, 501);
  const route = [].concat(params.path || []).join('/');
  const m = request.method;
  try {
    await ensureTables(env);
    if (m === 'POST' && !/application\/json/i.test(request.headers.get('content-type') || '')) return json({ ok: false, error: 'bad_content_type' }, 415);
    if (route === 'kod' && m === 'POST') return await sendCode(request, env);
    if (route === 'belepes' && m === 'POST') return await verify(request, env);
    if (route === 'me' && m === 'GET') return await me(request, env);
    if (route === 'profil' && m === 'POST') return await profile(request, env);
    if (route === 'kilepes' && m === 'POST') return await logout(request, env);
    return json({ ok: false, error: 'not_found' }, 404);
  } catch (e) {
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

/* ---------------- belépés ---------------- */

async function sendCode(request, env) {
  const b = await body(request);
  const email = normEmail(b.email);
  const lang = LANGS.includes(b.lang) ? b.lang : 'hu';
  if (!email) return json({ ok: false, error: 'bad_email' }, 400);
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  if (!(await rateOk(env, 'ip:' + ip, 20, 3600))) return json({ ok: false, error: 'too_many' }, 429);
  if (!(await rateOk(env, 'em:' + email, 6, 3600))) return json({ ok: false, error: 'too_many' }, 429);
  const user = await env.DB.prepare(`SELECT id, active FROM cust_users WHERE email = ?`).bind(email).first();
  if (!user || !user.active) return json({ ok: false, error: 'no_account' }, 404);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'mail_not_configured' }, 501);

  const { code, link } = await issueCode(env, email, lang, CODE_MIN * 60);
  const url = new URL(request.url);
  const dl = DOMAINS[url.hostname];
  const base = dl ? 'https://www.' + url.hostname.replace(/^www\./, '') + ACCOUNT_PATH[dl].replace(/^\/(sk|cs)\//, '/') : 'https://www.caradvance.hu' + ACCOUNT_PATH[lang];
  const href = base + '?t=' + link;
  const T = MAIL[lang] || MAIL.en;
  const html = emailShell(`<p style="margin:0 0 6px;font-size:18px;font-weight:bold">${T.title}</p>
      <p style="margin:0 0 18px;color:#4b5563">${T.lead}</p>
      <div style="font:bold 34px/1 'Courier New',monospace;letter-spacing:10px;background:#f4f7fb;border:1px solid #e6eaf1;border-radius:12px;padding:18px 0;text-align:center;color:#0b2a4a">${code}</div>
      <p style="margin:20px 0 8px;color:#4b5563">${T.or}</p>
      <p style="margin:0 0 20px"><a href="${href}" style="display:inline-block;background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;border-radius:999px;padding:12px 24px">${T.btn}</a></p>
      <p style="margin:0;color:#6b7280;font-size:13px">${T.valid.replace('{m}', CODE_MIN)}</p>`, T.ignore);
  const ok = await sendMail(env, email, T.subj.replace('{c}', code), html, T.title + '\n\n' + T.lead + '\n\n' + code + '\n\n' + T.btn + ': ' + href + '\n\n' + T.valid.replace('{m}', CODE_MIN));
  if (!ok) return json({ ok: false, error: 'mail_failed' }, 502);
  return json({ ok: true, minutes: CODE_MIN });
}

async function verify(request, env) {
  const b = await body(request);
  const now = Math.floor(Date.now() / 1000);
  let row = null;
  if (b.t) {
    const t = String(b.t);
    if (!/^[a-f0-9]{48}$/.test(t)) return json({ ok: false, error: 'bad_link' }, 400);
    row = await env.DB.prepare(`SELECT * FROM cust_codes WHERE link_hash = ?`).bind(await sha256hex('l|' + t)).first();
    if (!row || row.expires_at < now) return json({ ok: false, error: 'link_expired' }, 400);
  } else {
    const email = normEmail(b.email);
    const code = String(b.code || '').replace(/\D/g, '');
    if (!email || code.length !== 6) return json({ ok: false, error: 'bad_code' }, 400);
    row = await env.DB.prepare(`SELECT * FROM cust_codes WHERE email = ?`).bind(email).first();
    if (!row || row.expires_at < now) return json({ ok: false, error: 'code_expired' }, 400);
    if (row.attempts >= 5) return json({ ok: false, error: 'too_many' }, 429);
    if ((await sha256hex(email + '|' + code)) !== row.code_hash) {
      await env.DB.prepare(`UPDATE cust_codes SET attempts = attempts + 1 WHERE email = ?`).bind(email).run();
      return json({ ok: false, error: 'wrong_code', left: Math.max(0, 4 - row.attempts) }, 400);
    }
  }
  const email = row.email;
  await env.DB.prepare(`DELETE FROM cust_codes WHERE email = ?`).bind(email).run();
  const user = await env.DB.prepare(`SELECT * FROM cust_users WHERE email = ?`).bind(email).first();
  if (!user || !user.active) return json({ ok: false, error: 'no_account' }, 403);
  await env.DB.prepare(`UPDATE cust_users SET last_login = datetime('now') WHERE id = ?`).bind(user.id).run();

  const token = randomHex(32);
  await env.DB.prepare(`INSERT INTO cust_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`)
    .bind(await sha256hex(token), user.id, now + SESSION_DAYS * 86400, now).run();
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  h.append('Set-Cookie', `ca_cust=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
  h.append('Set-Cookie', `ca_cust_n=${encodeURIComponent(initial(user))}; Path=/; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
  return new Response(JSON.stringify({ ok: true, user: pubUser(user) }), { status: 200, headers: h });
}

async function logout(request, env) {
  const tok = cookie(request, 'ca_cust');
  if (tok) await env.DB.prepare(`DELETE FROM cust_sessions WHERE token_hash = ?`).bind(await sha256hex(tok)).run();
  return cleared({ ok: true });
}

/* ---------------- fiók ---------------- */

async function me(request, env) {
  const user = await sessionUser(request, env);
  if (!user) return cleared({ ok: false, error: 'not_logged_in' }, 401, !!cookie(request, 'ca_cust_n'));
  const email = user.email;

  // Ügyek a CRM-ből (deals) ugyanehhez az e-mailhez — folyamat-lépés + a munkatárs által megadott várható érkezés / üzenet.
  let deals = [], offers = [];
  try {
    const d = (await env.DB.prepare(`SELECT * FROM deals WHERE lower(trim(email)) = ? ORDER BY id DESC LIMIT 30`).bind(email).all()).results || [];
    const ids = d.map((x) => x.id);
    const info = {}, staff = {};
    if (ids.length) {
      const q = ids.map(() => '?').join(',');
      for (const r of ((await env.DB.prepare(`SELECT * FROM cust_deal_info WHERE deal_id IN (${q})`).bind(...ids).all()).results || [])) info[r.deal_id] = r;
      try {
        const sids = [...new Set(d.map((x) => x.assigned_to).filter(Boolean))];
        if (sids.length) for (const s of ((await env.DB.prepare(`SELECT id, name, email FROM users WHERE id IN (${sids.map(() => '?').join(',')})`).bind(...sids).all()).results || [])) staff[s.id] = { name: s.name || '', email: s.email || '' };
      } catch (e) {}
      try {
        const o = (await env.DB.prepare(`SELECT * FROM offer_tokens WHERE deal_id IN (${q}) ORDER BY rowid DESC LIMIT 20`).bind(...ids).all()).results || [];
        offers = o.map((x) => { let c = []; try { c = JSON.parse(x.candidates_json || '[]'); } catch (e) {} return { token: x.token, car: x.car || '', count: Array.isArray(c) ? c.length : 0, created_at: x.created_at || '', responded: !!x.responded_at, deal_id: x.deal_id }; });
      } catch (e) {}
    }
    deals = d.map((x) => {
      const stages = STAGES[x.line] || [];
      const i = info[x.id] || {};
      return { id: x.id, line: x.line || '', stage: x.stage || '', car: x.car || '', stages, idx: stages.indexOf(x.stage), eta: i.eta || '', note: i.note || '', contact: staff[x.assigned_to] || null, created_at: x.created_at || '' };
    });
  } catch (e) { /* a CRM táblái hiányozhatnak */ }

  const invoices = ((await env.DB.prepare(`SELECT id, deal_id, number, title, amount, currency, due_date, paid_at, created_at FROM cust_invoices WHERE user_id = ? ORDER BY (paid_at IS NOT NULL), due_date, id DESC LIMIT 200`).bind(user.id).all()).results) || [];
  return json({ ok: true, user: pubUser(user), deals, offers, invoices, today: new Date().toISOString().slice(0, 10) });
}

async function profile(request, env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ ok: false, error: 'not_logged_in' }, 401);
  const b = await body(request);
  const name = clean(b.name, 120), phone = clean(b.phone, 40), company = clean(b.company, 160);
  const lang = LANGS.includes(b.lang) ? b.lang : user.lang;
  await env.DB.prepare(`UPDATE cust_users SET name = ?, phone = ?, company = ?, lang = ? WHERE id = ?`).bind(name, phone, company, lang, user.id).run();
  const u = { ...user, name, phone, company, lang };
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  h.append('Set-Cookie', `ca_cust_n=${encodeURIComponent(initial(u))}; Path=/; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
  return new Response(JSON.stringify({ ok: true, user: pubUser(u) }), { status: 200, headers: h });
}

/* ---------------- segédek ---------------- */

async function sessionUser(request, env) {
  const tok = cookie(request, 'ca_cust');
  if (!tok || !/^[a-f0-9]{64}$/.test(tok)) return null;
  const row = await env.DB.prepare(`SELECT u.*, s.expires_at AS s_exp FROM cust_sessions s JOIN cust_users u ON u.id = s.user_id WHERE s.token_hash = ?`).bind(await sha256hex(tok)).first();
  if (!row || row.s_exp < Math.floor(Date.now() / 1000) || !row.active) return null;
  return row;
}
function pubUser(u) {
  return { email: u.email, name: u.name || '', phone: u.phone || '', company: u.company || '', lang: u.lang || 'hu', created_at: u.created_at || '' };
}
function initial(u) {
  const s = String(u.name || u.email || '?').trim();
  return (s[0] || '?').toUpperCase();
}
function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max);
}
function cookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  for (const p of h.split(';')) {
    const i = p.indexOf('=');
    if (i > -1 && p.slice(0, i).trim() === name) return p.slice(i + 1).trim();
  }
  return '';
}
async function body(request) {
  try { const t = await request.text(); return t.length > 20000 ? {} : (JSON.parse(t) || {}); } catch (e) { return {}; }
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
function cleared(obj, status = 200, doClear = true) {
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  if (doClear) {
    h.append('Set-Cookie', 'ca_cust=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    h.append('Set-Cookie', 'ca_cust_n=; Path=/; Secure; SameSite=Lax; Max-Age=0');
  }
  return new Response(JSON.stringify(obj), { status, headers: h });
}

const MAIL = {
  hu: { subj: 'Belépési kódod: {c} | CarAdvance', title: 'Belépés a CarAdvance ügyfélfiókodba', lead: 'Ezzel a kóddal tudsz belépni:', or: 'Vagy lépj be egy kattintással:', btn: 'Belépés a fiókomba', valid: 'A kód és a link {m} percig érvényes.', ignore: 'Ha nem te kérted, nyugodtan hagyd figyelmen kívül ezt az e-mailt.' },
  en: { subj: 'Your sign-in code: {c} | CarAdvance', title: 'Sign in to your CarAdvance account', lead: 'Use this code to sign in:', or: 'Or sign in with one click:', btn: 'Sign in to my account', valid: 'The code and the link are valid for {m} minutes.', ignore: 'If you did not request this, you can safely ignore this e-mail.' },
  de: { subj: 'Ihr Anmeldecode: {c} | CarAdvance', title: 'Anmeldung bei Ihrem CarAdvance-Kundenkonto', lead: 'Mit diesem Code melden Sie sich an:', or: 'Oder melden Sie sich mit einem Klick an:', btn: 'Zu meinem Konto', valid: 'Code und Link sind {m} Minuten gültig.', ignore: 'Falls Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.' },
  fr: { subj: 'Votre code de connexion : {c} | CarAdvance', title: 'Connexion à votre compte client CarAdvance', lead: 'Utilisez ce code pour vous connecter :', or: 'Ou connectez-vous en un clic :', btn: 'Accéder à mon compte', valid: 'Le code et le lien sont valables {m} minutes.', ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.' },
  uk: { subj: 'Ваш код входу: {c} | CarAdvance', title: 'Вхід до кабінету клієнта CarAdvance', lead: 'Використайте цей код для входу:', or: 'Або увійдіть одним кліком:', btn: 'Увійти до кабінету', valid: 'Код і посилання дійсні {m} хвилин.', ignore: 'Якщо ви цього не запитували, просто проігноруйте цей лист.' },
  zh: { subj: '您的登录验证码：{c} | CarAdvance', title: '登录您的 CarAdvance 客户账户', lead: '请使用此验证码登录：', or: '或一键登录：', btn: '进入我的账户', valid: '验证码和链接在 {m} 分钟内有效。', ignore: '如果这不是您本人的操作，请忽略此邮件。' },
  sk: { subj: 'Váš prihlasovací kód: {c} | CarAdvance', title: 'Prihlásenie do zákazníckeho účtu CarAdvance', lead: 'Na prihlásenie použite tento kód:', or: 'Alebo sa prihláste jedným kliknutím:', btn: 'Prihlásiť sa do účtu', valid: 'Kód a odkaz sú platné {m} minút.', ignore: 'Ak ste o to nežiadali, tento e-mail pokojne ignorujte.' },
  cs: { subj: 'Váš přihlašovací kód: {c} | CarAdvance', title: 'Přihlášení k zákaznickému účtu CarAdvance', lead: 'K přihlášení použijte tento kód:', or: 'Nebo se přihlaste jedním kliknutím:', btn: 'Přihlásit se k účtu', valid: 'Kód a odkaz platí {m} minut.', ignore: 'Pokud jste o to nežádali, tento e-mail klidně ignorujte.' }
};
