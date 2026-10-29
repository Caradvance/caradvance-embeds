// CarAdvance — Partnerportal (Ellenjegyzők országonként, pl. DE: Caradvance GmbH) — oldal: /partner/
// A partner bejelentkezik (login + jelszó), elmenti az aláírását, és a hozzá érkezett (az ügyfél által már aláírt)
// kétnyelvű szerződéseket egyszerre, a mentett aláírással írja alá; megerősítés: e-mailben kapott egyszeri kód.
// Biztonság:
//  - jelszó PBKDF2-SHA256 (100 000 iteráció, só); a kezdő jelszót az első belépéskor kötelező lecserélni (min. 10 karakter);
//  - 10 hibás belépés után 15 perc zárolás; IP-alapú rate limit; munkamenet: véletlen token, csak SHA-256 lenyomata tárolva,
//    HttpOnly + Secure + SameSite=Strict süti, 12 óra; POST csak JSON-nal és saját Originről;
//  - aláírás csak e-mailben kapott 6 jegyű kóddal (10 perc, 5 próbálkozás, óránként 5 kód); a tanúsítvány rögzíti a módot.
import {
  ensureCrm, json, parseJ, clean, sendCrmMail, esc, sha256hex, b64ToBytes, fileData, rateOk, randomDigits, maskEmail, huDateTime,
  verifyPass, hashPass, SIGN_STATEMENT_DE
} from '../../../lib/crm.js';
import { jpegInfo } from '../../../lib/docpdf.js';
import { completeSign, pdfFor, priorSigns, fwdOf, randomHex, nowSec } from '../../../lib/crmsign.js';

const SEC = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff' };
const J = (o, s, h) => json(o, s || 200, { ...SEC, ...(h || {}) });
const COOKIE = 'ca_partner';
const SESSION_TTL = 12 * 3600;

function cookieOf(request) { const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)ca_partner=([a-f0-9]{64})/); return m ? m[1] : ''; }
const setCookie = (v, age) => `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;

async function session(env, request) {
  const t = cookieOf(request); if (!t) return null;
  const s = await env.DB.prepare(`SELECT s.partner_id, s.expires, p.* FROM crm_partner_sessions s JOIN crm_partners p ON p.id = s.partner_id WHERE s.token_hash = ?`).bind(await sha256hex('psess|' + t)).first();
  if (!s || s.expires < nowSec() || !s.active) return null;
  return s;
}
const meOut = (p) => ({ company: p.company, country: p.country, lang: p.lang, login: p.login, must_change: !!p.must_change, has_sig: !!p.sig, sig_name: p.sig_name || '', sig_at: p.sig_at ? huDateTime(p.sig_at) : '', sig: p.sig ? 'data:image/jpeg;base64,' + p.sig : '', notify: maskEmail(p.notify_email || p.login) });
/** A partnerhez tartozó ellenjegyzési kérelmek (régi, partner_id nélküli kérelmek az e-mail cím alapján). */
function reqWhere(p) { return { sql: `signer_role = 'partner' AND (partner_id = ? OR (partner_id IS NULL AND email IN (?, ?)))`, args: [p.id, p.login, p.notify_email || p.login] }; }

async function login(env, request, b, ip) {
  if (!(await rateOk(env, 'plogin:' + ip, 20, 600))) return J({ ok: false, error: 'rate' }, 429);
  const lg = clean(b.login, 160).toLowerCase(); const pw = String(b.password || '').slice(0, 200);
  const p = await env.DB.prepare(`SELECT * FROM crm_partners WHERE login = ?`).bind(lg).first();
  if (!p || !p.active) { await hashPass(pw); return J({ ok: false, error: 'bad_login' }, 401); } // azonos válaszidő
  if ((p.locked_until || 0) > nowSec()) return J({ ok: false, error: 'locked' }, 429);
  if (!(await verifyPass(pw, p.pass_hash))) {
    const f = (p.fails || 0) + 1;
    await env.DB.prepare(`UPDATE crm_partners SET fails = ?, locked_until = ? WHERE id = ?`).bind(f >= 10 ? 0 : f, f >= 10 ? nowSec() + 900 : 0, p.id).run();
    return J({ ok: false, error: f >= 10 ? 'locked' : 'bad_login' }, 401);
  }
  const t = randomHex(32);
  await env.DB.prepare(`DELETE FROM crm_partner_sessions WHERE expires < ?`).bind(nowSec()).run();
  await env.DB.prepare(`INSERT INTO crm_partner_sessions (token_hash, partner_id, expires, ip, ua) VALUES (?,?,?,?,?)`).bind(await sha256hex('psess|' + t), p.id, nowSec() + SESSION_TTL, ip, clean(request.headers.get('user-agent') || '', 300)).run();
  await env.DB.prepare(`UPDATE crm_partners SET fails = 0, locked_until = 0, last_login = datetime('now') WHERE id = ?`).bind(p.id).run();
  return J({ ok: true, me: meOut(p) }, 200, { 'set-cookie': setCookie(t, SESSION_TTL) });
}

async function changePass(env, p, b) {
  const old = String(b.old || ''); const nw = String(b.new || '');
  if (!(await verifyPass(old, p.pass_hash))) return J({ ok: false, error: 'bad_old' }, 400);
  if (nw.length < 10 || nw.length > 200 || nw === old || /^(\d)\1*$|^123456/.test(nw)) return J({ ok: false, error: 'weak' }, 400);
  await env.DB.prepare(`UPDATE crm_partners SET pass_hash = ?, must_change = 0 WHERE id = ?`).bind(await hashPass(nw), p.id).run();
  return J({ ok: true });
}

async function saveSig(env, p, b) {
  const name = clean(b.name, 120); if (name.length < 3) return J({ ok: false, error: 'bad_name' }, 400);
  const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.sig || ''));
  if (!mm || mm[1].length > 400000) return J({ ok: false, error: 'bad_signature' }, 400);
  const inf = jpegInfo(b64ToBytes(mm[1])); if (!inf || inf.w < 100 || inf.h < 40 || inf.w > 3000 || inf.h > 2000) return J({ ok: false, error: 'bad_signature' }, 400);
  await env.DB.prepare(`UPDATE crm_partners SET sig = ?, sig_name = ?, sig_at = datetime('now') WHERE id = ?`).bind(mm[1], name, p.id).run();
  return J({ ok: true });
}

async function list(env, p) {
  const w = reqWhere(p);
  const rows = (await env.DB.prepare(`SELECT id, status, docs, prior, result, created_at, expires_at, signed_at, sign_name, market FROM crm_sign WHERE ${w.sql} ORDER BY id DESC LIMIT 300`).bind(...w.args).all()).results || [];
  const t = nowSec();
  return J({ ok: true, requests: rows.map((r) => {
    const docs = parseJ(r.docs, []); const pr = parseJ(r.prior, {}); const res = parseJ(r.result, []);
    return { id: r.id, market: r.market || 'HU', status: r.status === 'pending' && r.expires_at < t ? 'expired' : r.status, client: pr.client || '', client_signed: docs[0] && docs[0].prior ? docs[0].prior.when : '',
      received: huDateTime(r.created_at), expires: new Date(r.expires_at * 1000).toISOString(), signed_at: r.signed_at ? huDateTime(r.signed_at) : '', sign_name: r.sign_name || '',
      docs: docs.map((d, i) => ({ i, name: d.name, number: d.number || '', signed: !!(res[i] && res[i].file_id) })) };
  }) });
}

async function getReq(env, p, sid) {
  const w = reqWhere(p);
  return env.DB.prepare(`SELECT * FROM crm_sign WHERE id = ? AND ${w.sql}`).bind(sid, ...w.args).first();
}

async function pdf(env, p, b) {
  const r = await getReq(env, p, Number(b.id) || 0); if (!r) return J({ ok: false, error: 'not_found' }, 404);
  const d = parseJ(r.docs, [])[Number(b.i)]; if (!d) return J({ ok: false, error: 'not_found' }, 404);
  let bytes;
  if (r.status === 'signed') {
    const res = parseJ(r.result, [])[Number(b.i)]; if (!res) return J({ ok: false, error: 'not_found' }, 404);
    const f = await env.DB.prepare(`SELECT id, data FROM crm_files WHERE id = ? AND deal_id = ?`).bind(res.file_id, r.deal_id).first();
    if (!f) return J({ ok: false, error: 'not_found' }, 404);
    bytes = b64ToBytes(await fileData(env, f));
  } else { const ps = priorSigns(r, d); bytes = pdfFor(d, ps.length ? ps : null); }
  return new Response(bytes, { headers: { ...SEC, 'content-type': 'application/pdf', 'content-disposition': 'inline; filename="dokument.pdf"' } });
}

function pickIds(b) { return [...new Set((Array.isArray(b.ids) ? b.ids : []).map(Number).filter((x) => Number.isInteger(x) && x > 0))].slice(0, 50); }

async function sendCode(env, p, b) {
  const ids = pickIds(b); if (!ids.length) return J({ ok: false, error: 'none' }, 400);
  if (!p.sig) return J({ ok: false, error: 'no_sig' }, 400);
  if (!(await rateOk(env, 'pcode:' + p.id, 5, 3600))) return J({ ok: false, error: 'too_many_codes' }, 429);
  const code = randomDigits(6);
  await env.DB.prepare(`UPDATE crm_partners SET code_hash = ?, code_exp = ?, code_attempts = 0 WHERE id = ?`).bind(await sha256hex('pcode|' + p.id + '|' + code + '|' + ids.sort((a, c) => a - c).join(',')), nowSec() + 600, p.id).run();
  const to = p.notify_email || p.login; const fwd = fwdOf(env);
  const de = p.lang !== 'en';
  const m = await sendCrmMail(env, fwd || to, `${fwd ? '[TESZT — ' + to + '] ' : ''}${de ? 'Bestätigungscode für die Unterschrift' : 'Signature confirmation code'}: ${code}`,
    `<p>${de ? 'Sehr geehrte Damen und Herren,' : 'Dear Sir or Madam,'}</p><p>${de ? `zur Unterschrift von ${ids.length} Vorgang/Vorgängen im CarAdvance-Partnerportal geben Sie bitte diesen Code ein:` : `please enter this code to sign ${ids.length} request(s) in the CarAdvance partner portal:`}</p>
     <p style="font:bold 34px/1 'Courier New',monospace;letter-spacing:6px;margin:18px 0">${code}</p>
     <p style="color:#6b7280;font-size:13px">${de ? 'Der Code ist 10 Minuten gültig. Falls Sie ihn nicht angefordert haben, ändern Sie bitte Ihr Passwort und informieren Sie uns.' : 'The code is valid for 10 minutes. If you did not request it, please change your password and let us know.'}</p>`, null, { noCopy: true });
  if (!m.ok) return J({ ok: false, error: 'mail_failed' }, 502);
  return J({ ok: true, email: maskEmail(to) });
}

async function signMany(env, request, p, b, ip) {
  const ids = pickIds(b); if (!ids.length) return J({ ok: false, error: 'none' }, 400);
  if (!p.sig || !p.sig_name) return J({ ok: false, error: 'no_sig' }, 400);
  if (b.consent !== true) return J({ ok: false, error: 'consent' }, 400);
  if (!p.code_hash || !p.code_exp || p.code_exp < nowSec()) return J({ ok: false, error: 'code_expired' }, 400);
  if ((p.code_attempts || 0) >= 5) return J({ ok: false, error: 'too_many' }, 429);
  const ok = (await sha256hex('pcode|' + p.id + '|' + String(b.code || '').replace(/\D/g, '') + '|' + ids.sort((a, c) => a - c).join(','))) === p.code_hash;
  if (!ok) { await env.DB.prepare(`UPDATE crm_partners SET code_attempts = code_attempts + 1 WHERE id = ?`).bind(p.id).run(); return J({ ok: false, error: 'wrong_code', left: Math.max(0, 4 - (p.code_attempts || 0)) }, 400); }
  await env.DB.prepare(`UPDATE crm_partners SET code_hash = NULL, code_exp = NULL WHERE id = ?`).bind(p.id).run();
  const sigBytes = b64ToBytes(p.sig); const ua = clean(request.headers.get('user-agent') || '', 300);
  const ident = `Partnerportal (Anmeldung ${p.login}) + Einmalcode (OTP) an ${p.notify_email || p.login} — gespeicherte Unterschrift`;
  const out = [];
  for (const sid of ids) {
    const r = await getReq(env, p, sid);
    if (!r || r.status !== 'pending' || r.expires_at < nowSec()) { out.push({ id: sid, ok: false, error: 'locked' }); continue; }
    const claim = await env.DB.prepare(`UPDATE crm_sign SET status = 'signing', code_hash = NULL, code_exp = NULL, otp_at = datetime('now') WHERE id = ? AND status = 'pending'`).bind(sid).run();
    if (!claim.meta || !claim.meta.changes) { out.push({ id: sid, ok: false, error: 'locked' }); continue; }
    try {
      await completeSign(env, { ...r, status: 'signing' }, { name: p.sig_name, sigBytes, sigB64: p.sig, ip, ua, ident });
      out.push({ id: sid, ok: true });
    } catch (e) {
      console.error('partner sign', e && e.stack || e);
      await env.DB.prepare(`UPDATE crm_sign SET status = 'pending' WHERE id = ? AND status = 'signing'`).bind(sid).run();
      out.push({ id: sid, ok: false, error: e.message === 'integrity' ? 'integrity' : 'server' });
    }
  }
  return J({ ok: true, results: out });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/partner/, '') || '/';
  try {
    await ensureCrm(env);
    const ip = clean(request.headers.get('CF-Connecting-IP') || '', 60);
    if (!(await rateOk(env, 'pip:' + ip, 300, 600))) return J({ ok: false, error: 'rate' }, 429);
    if (request.method !== 'POST') return J({ ok: false, error: 'method' }, 405);
    // CSRF: csak JSON, csak saját Originről
    const origin = request.headers.get('origin'); if (origin && origin !== url.origin) return J({ ok: false, error: 'origin' }, 403);
    if (!/application\/json/i.test(request.headers.get('content-type') || '')) return J({ ok: false, error: 'type' }, 415);
    const b = await request.json().catch(() => ({}));
    if (path === '/login') return await login(env, request, b, ip);
    if (path === '/logout') {
      const t = cookieOf(request); if (t) await env.DB.prepare(`DELETE FROM crm_partner_sessions WHERE token_hash = ?`).bind(await sha256hex('psess|' + t)).run();
      return J({ ok: true }, 200, { 'set-cookie': setCookie('', 0) });
    }
    const p = await session(env, request);
    if (!p) return J({ ok: false, error: 'auth' }, 401);
    if (path === '/me') return J({ ok: true, me: meOut(p), statement: SIGN_STATEMENT_DE });
    if (path === '/password') return await changePass(env, p, b);
    if (p.must_change) return J({ ok: false, error: 'must_change' }, 403);
    if (path === '/signature') return await saveSig(env, p, b);
    if (path === '/list') return await list(env, p);
    if (path === '/pdf') return await pdf(env, p, b);
    if (path === '/code') return await sendCode(env, p, b);
    if (path === '/sign') return await signMany(env, request, p, b, ip);
    return J({ ok: false, error: 'not_found' }, 404);
  } catch (e) {
    console.error('partner api', e && e.stack || e);
    return J({ ok: false, error: 'server' }, 500);
  }
}
