/**
 * CarAdvance — ügyfélfiók API (Cloudflare Pages Function)
 * Útvonal: /api/fiok/*      D1 kötés: DB (ugyanaz, mint a /belso-é)
 *
 * Belépés jelszó nélkül: az ügyfél megadja az e-mail címét, kap egy 6 jegyű kódot
 * és egy egykattintásos belépő linket (Resend). Első belépéskor a fiók magától létrejön.
 *
 *   POST /api/fiok/kod        {email, lang}          → kód + link e-mailben
 *   POST /api/fiok/belepes    {email, code} | {t}    → munkamenet-süti (180 nap)
 *   GET  /api/fiok/me                                → profil, ügyek, igények, ajánlatok, mentett autók
 *   POST /api/fiok/profil     {name, phone, company, lang, marketing}
 *   POST /api/fiok/kedvenc    {url, title, img, price, remove?}
 *   POST /api/fiok/kilepes
 *   POST /api/fiok/torles     {confirm: true}        → fiók és adatai törlése
 *
 * A munkatársi /belso munkamenettől teljesen független (külön süti: ca_cust).
 */
import { ensureTables, rateOk, STAGES, sha256hex, randomHex, randomCode, ACCOUNT_PATH } from '../../../lib/fiok.js';

const SESSION_DAYS = 180;
const CODE_MIN = 15;
const LANGS = ['hu', 'en', 'de', 'fr', 'uk', 'zh', 'sk', 'cs'];
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
    if (route === 'kedvenc' && m === 'POST') return await fav(request, env);
    if (route === 'kilepes' && m === 'POST') return await logout(request, env);
    if (route === 'torles' && m === 'POST') return await removeAccount(request, env);
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
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'mail_not_configured' }, 501);

  const code = randomCode();
  const link = randomHex(24);
  const exp = Math.floor(Date.now() / 1000) + CODE_MIN * 60;
  await env.DB.prepare(`INSERT INTO cust_codes (email, code_hash, link_hash, expires_at, attempts, lang) VALUES (?, ?, ?, ?, 0, ?)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, link_hash = excluded.link_hash, expires_at = excluded.expires_at, attempts = 0, lang = excluded.lang`)
    .bind(email, await sha256hex(email + '|' + code), await sha256hex('l|' + link), exp, lang).run();

  const url = new URL(request.url);
  const dl = DOMAINS[url.hostname];
  const base = dl ? 'https://www.' + url.hostname.replace(/^www\./, '') + ACCOUNT_PATH[dl].replace(/^\/(sk|cs)\//, '/') : 'https://www.caradvance.hu' + ACCOUNT_PATH[lang];
  const href = base + '?t=' + link;
  const T = MAIL[lang] || MAIL.en;
  const html = `<div style="background:#f4f7fb;padding:24px 12px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#141519">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf1">
    <div style="background:#0b0b0d;padding:18px 24px"><img src="https://www.caradvance.hu/caradvance-logo-email.png" alt="CarAdvance" width="180" height="60" style="width:180px;height:60px;display:block;border:0"></div>
    <div style="padding:26px 24px 22px">
      <p style="margin:0 0 6px;font-size:18px;font-weight:bold">${T.title}</p>
      <p style="margin:0 0 18px;color:#4b5563">${T.lead}</p>
      <div style="font:bold 34px/1 'Courier New',monospace;letter-spacing:10px;background:#f4f7fb;border:1px solid #e6eaf1;border-radius:12px;padding:18px 0;text-align:center;color:#0b2a4a">${code}</div>
      <p style="margin:20px 0 8px;color:#4b5563">${T.or}</p>
      <p style="margin:0 0 20px"><a href="${href}" style="display:inline-block;background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;border-radius:999px;padding:12px 24px">${T.btn}</a></p>
      <p style="margin:0;color:#6b7280;font-size:13px">${T.valid.replace('{m}', CODE_MIN)}</p>
    </div>
    <div style="padding:14px 24px;background:#f4f7fb;color:#6b7280;font-size:12px;line-height:1.55"><b style="color:#141519">Caradvance GmbH</b> · Bgm-Graf-Ring 21 · D-82538 Geretsried<br>${T.ignore}</div>
  </div></div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CUSTOMER_EMAIL_FROM || env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>',
      to: [email],
      subject: T.subj.replace('{c}', code),
      html,
      text: T.title + '\n\n' + T.lead + '\n\n' + code + '\n\n' + T.btn + ': ' + href + '\n\n' + T.valid.replace('{m}', CODE_MIN)
    })
  });
  if (!r.ok) return json({ ok: false, error: 'mail_failed' }, 502);
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
  await env.DB.prepare(`INSERT INTO cust_users (email, lang, last_login) VALUES (?, ?, datetime('now')) ON CONFLICT(email) DO UPDATE SET last_login = datetime('now')`).bind(email, row.lang || 'hu').run();
  const user = await env.DB.prepare(`SELECT * FROM cust_users WHERE email = ?`).bind(email).first();

  // Ha még nincs neve, a legutóbbi beküldött űrlapról kitöltjük (név, telefon, cég).
  if (!user.name || !user.phone) {
    const last = await env.DB.prepare(`SELECT summary FROM cust_requests WHERE email = ? ORDER BY id DESC LIMIT 5`).bind(email).all();
    for (const r of last.results || []) {
      let s = {}; try { s = JSON.parse(r.summary || '{}'); } catch (e) {}
      const nm = s['Név'] || s['Kapcsolattartó'] || [s['Vezetéknév'], s['Keresztnév']].filter(Boolean).join(' ');
      if (!user.name && nm) user.name = nm;
      if (!user.phone && s['Telefon']) user.phone = s['Telefon'];
      if (!user.company && s['Cégnév']) user.company = s['Cégnév'];
    }
    await env.DB.prepare(`UPDATE cust_users SET name = ?, phone = ?, company = ? WHERE id = ?`).bind(user.name || '', user.phone || '', user.company || '', user.id).run();
  }

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

  const reqs = (await env.DB.prepare(`SELECT id, kind, car, summary, page, created_at FROM cust_requests WHERE email = ? ORDER BY id DESC LIMIT 50`).bind(email).all()).results || [];
  const requests = reqs.map((r) => { let s = {}; try { s = JSON.parse(r.summary || '{}'); } catch (e) {} return { id: r.id, kind: r.kind, car: r.car, created_at: r.created_at, fields: s }; });

  // A munkatársak CRM-jében (deals) ugyanehhez az e-mailhez tartozó ügyek, folyamat-lépéssel.
  let deals = [];
  let offers = [];
  try {
    const d = (await env.DB.prepare(`SELECT * FROM deals WHERE lower(trim(email)) = ? ORDER BY id DESC LIMIT 30`).bind(email).all()).results || [];
    deals = d.map((x) => {
      const stages = STAGES[x.line] || [];
      return { id: x.id, line: x.line || '', stage: x.stage || '', car: x.car || '', stages, idx: stages.indexOf(x.stage), created_at: x.created_at || '' };
    });
    if (d.length) {
      const ids = d.map((x) => x.id);
      const o = (await env.DB.prepare(`SELECT * FROM offer_tokens WHERE deal_id IN (${ids.map(() => '?').join(',')}) ORDER BY rowid DESC LIMIT 20`).bind(...ids).all()).results || [];
      offers = o.map((x) => { let c = []; try { c = JSON.parse(x.candidates_json || '[]'); } catch (e) {} return { token: x.token, car: x.car || '', count: Array.isArray(c) ? c.length : 0, created_at: x.created_at || '', responded: !!x.responded_at, deal_id: x.deal_id }; });
    }
  } catch (e) { /* a CRM táblái hiányozhatnak — a fiók enélkül is működik */ }

  const favs = ((await env.DB.prepare(`SELECT url, title, img, price, created_at FROM cust_favs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`).bind(user.id).all()).results) || [];
  return json({ ok: true, user: pubUser(user), requests, deals, offers, favs });
}

async function profile(request, env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ ok: false, error: 'not_logged_in' }, 401);
  const b = await body(request);
  const name = clean(b.name, 120), phone = clean(b.phone, 40), company = clean(b.company, 160);
  const lang = LANGS.includes(b.lang) ? b.lang : user.lang;
  const marketing = b.marketing ? 1 : 0;
  await env.DB.prepare(`UPDATE cust_users SET name = ?, phone = ?, company = ?, lang = ?, marketing = ? WHERE id = ?`).bind(name, phone, company, lang, marketing, user.id).run();
  const u = { ...user, name, phone, company, lang, marketing };
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  h.append('Set-Cookie', `ca_cust_n=${encodeURIComponent(initial(u))}; Path=/; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
  return new Response(JSON.stringify({ ok: true, user: pubUser(u) }), { status: 200, headers: h });
}

async function fav(request, env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ ok: false, error: 'not_logged_in' }, 401);
  const b = await body(request);
  let path;
  try { const u = new URL(String(b.url || ''), 'https://www.caradvance.hu'); path = u.pathname; } catch (e) { path = ''; }
  if (!path || !path.startsWith('/') || path.length > 300) return json({ ok: false, error: 'bad_url' }, 400);
  if (b.remove) {
    await env.DB.prepare(`DELETE FROM cust_favs WHERE user_id = ? AND url = ?`).bind(user.id, path).run();
    return json({ ok: true, saved: false });
  }
  const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM cust_favs WHERE user_id = ?`).bind(user.id).first();
  if (n && n.n >= 100) return json({ ok: false, error: 'too_many' }, 400);
  let img = clean(b.img, 400);
  if (img && !/^(https:\/\/|\/)/.test(img)) img = '';
  await env.DB.prepare(`INSERT INTO cust_favs (user_id, url, title, img, price, created_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, url) DO UPDATE SET title = excluded.title, img = excluded.img, price = excluded.price`)
    .bind(user.id, path, clean(b.title, 160), img, clean(b.price, 60), Date.now()).run();
  return json({ ok: true, saved: true });
}

async function removeAccount(request, env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ ok: false, error: 'not_logged_in' }, 401);
  const b = await body(request);
  if (b.confirm !== true) return json({ ok: false, error: 'confirm_required' }, 400);
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM cust_sessions WHERE user_id = ?`).bind(user.id),
    env.DB.prepare(`DELETE FROM cust_favs WHERE user_id = ?`).bind(user.id),
    env.DB.prepare(`DELETE FROM cust_requests WHERE email = ?`).bind(user.email),
    env.DB.prepare(`DELETE FROM cust_codes WHERE email = ?`).bind(user.email),
    env.DB.prepare(`DELETE FROM cust_users WHERE id = ?`).bind(user.id)
  ]);
  return cleared({ ok: true, deleted: true });
}

/* ---------------- segédek ---------------- */

async function sessionUser(request, env) {
  const tok = cookie(request, 'ca_cust');
  if (!tok || !/^[a-f0-9]{64}$/.test(tok)) return null;
  const row = await env.DB.prepare(`SELECT u.*, s.expires_at AS s_exp FROM cust_sessions s JOIN cust_users u ON u.id = s.user_id WHERE s.token_hash = ?`).bind(await sha256hex(tok)).first();
  if (!row || row.s_exp < Math.floor(Date.now() / 1000)) return null;
  return row;
}
function pubUser(u) {
  return { email: u.email, name: u.name || '', phone: u.phone || '', company: u.company || '', lang: u.lang || 'hu', marketing: !!u.marketing, created_at: u.created_at || '' };
}
function initial(u) {
  const s = String(u.name || u.email || '?').trim();
  return (s[0] || '?').toUpperCase();
}
function normEmail(e) {
  const s = String(e || '').trim().toLowerCase();
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/.test(s) ? s : '';
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
  hu: { subj: 'Belépési kódod: {c} | CarAdvance', title: 'Belépés a CarAdvance fiókodba', lead: 'Ezzel a kóddal tudsz belépni:', or: 'Vagy lépj be egy kattintással:', btn: 'Belépés a fiókomba', valid: 'A kód és a link {m} percig érvényes.', ignore: 'Ha nem te kérted, nyugodtan hagyd figyelmen kívül ezt az e-mailt.' },
  en: { subj: 'Your sign-in code: {c} | CarAdvance', title: 'Sign in to your CarAdvance account', lead: 'Use this code to sign in:', or: 'Or sign in with one click:', btn: 'Sign in to my account', valid: 'The code and the link are valid for {m} minutes.', ignore: 'If you did not request this, you can safely ignore this e-mail.' },
  de: { subj: 'Ihr Anmeldecode: {c} | CarAdvance', title: 'Anmeldung bei Ihrem CarAdvance-Konto', lead: 'Mit diesem Code melden Sie sich an:', or: 'Oder melden Sie sich mit einem Klick an:', btn: 'Zu meinem Konto', valid: 'Code und Link sind {m} Minuten gültig.', ignore: 'Falls Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.' },
  fr: { subj: 'Votre code de connexion : {c} | CarAdvance', title: 'Connexion à votre compte CarAdvance', lead: 'Utilisez ce code pour vous connecter :', or: 'Ou connectez-vous en un clic :', btn: 'Accéder à mon compte', valid: 'Le code et le lien sont valables {m} minutes.', ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.' },
  uk: { subj: 'Ваш код входу: {c} | CarAdvance', title: 'Вхід до кабінету CarAdvance', lead: 'Використайте цей код для входу:', or: 'Або увійдіть одним кліком:', btn: 'Увійти до кабінету', valid: 'Код і посилання дійсні {m} хвилин.', ignore: 'Якщо ви цього не запитували, просто проігноруйте цей лист.' },
  zh: { subj: '您的登录验证码：{c} | CarAdvance', title: '登录您的 CarAdvance 账户', lead: '请使用此验证码登录：', or: '或一键登录：', btn: '进入我的账户', valid: '验证码和链接在 {m} 分钟内有效。', ignore: '如果这不是您本人的操作，请忽略此邮件。' },
  sk: { subj: 'Váš prihlasovací kód: {c} | CarAdvance', title: 'Prihlásenie do účtu CarAdvance', lead: 'Na prihlásenie použite tento kód:', or: 'Alebo sa prihláste jedným kliknutím:', btn: 'Prihlásiť sa do účtu', valid: 'Kód a odkaz sú platné {m} minút.', ignore: 'Ak ste o to nežiadali, tento e-mail pokojne ignorujte.' },
  cs: { subj: 'Váš přihlašovací kód: {c} | CarAdvance', title: 'Přihlášení k účtu CarAdvance', lead: 'K přihlášení použijte tento kód:', or: 'Nebo se přihlaste jedním kliknutím:', btn: 'Přihlásit se k účtu', valid: 'Kód a odkaz platí {m} minut.', ignore: 'Pokud jste o to nežádali, tento e-mail klidně ignorujte.' }
};
