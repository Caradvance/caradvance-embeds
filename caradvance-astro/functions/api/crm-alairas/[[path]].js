// CarAdvance CRM — dokumentumok elektronikus aláírása (nyilvános, bejelentkezés nélkül; oldal: /alairas/#<token>)
// Biztonság:
//  - a link tokenje 256 bites véletlen; az adatbázisban csak SHA-256 lenyomata van; a token az URL #-részében utazik
//    (nem kerül szervernaplóba / Referer-be), a böngésző POST törzsben küldi;
//  - az aláíró azonosítása: az e-mail címére küldött 6 jegyű egyszeri kód (10 percig érvényes, 5 próbálkozás,
//    óránként max. 5 kód; 15 hibás kód után a kérelem zárolódik);
//  - az aláírandó szöveg a kiküldéskor rögzítve (befagyasztva) és SHA-256-tal azonosítva — utólag nem módosítható;
//  - az aláírt PDF a végén aláírási tanúsítványt (audit-napló) kap; a PDF SHA-256 lenyomata is tárolódik;
//  - IP-alapú rate limit minden végponton; a kérelem lejár (14 nap), visszavonható; egy kérelem csak egyszer írható alá.
import {
  ensureCrm, json, parseJ, clean, addEvent, sendCrmMail, esc, sha256hex, b64ToBytes, fileData,
  rateOk, randomDigits, maskEmail, huDateTime, SIGN_STATEMENT, SIGN_STATEMENT_DE
} from '../../../lib/crm.js';
import { jpegInfo } from '../../../lib/docpdf.js';
import { completeSign, pdfFor, priorSigns, fwdOf, isPartnerReq as isDe, nowSec as now } from '../../../lib/crmsign.js';

const TOKEN_RE = /^[a-f0-9]{64}$/;
const SEC = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff' };
const J = (o, s) => json(o, s || 200, SEC);

async function load(env, t) {
  if (!TOKEN_RE.test(String(t || ''))) return { err: J({ ok: false, error: 'bad_link' }, 400) };
  const r = await env.DB.prepare(`SELECT * FROM crm_sign WHERE token_hash = ?`).bind(await sha256hex('crmsign|' + t)).first();
  if (!r) return { err: J({ ok: false, error: 'not_found' }, 404) };
  if (r.status === 'pending' && r.expires_at < now()) { await env.DB.prepare(`UPDATE crm_sign SET status = 'expired' WHERE id = ? AND status = 'pending'`).bind(r.id).run(); r.status = 'expired'; }
  return { r };
}
async function view(env, r) {
  const docs = parseJ(r.docs, []); const res = parseJ(r.result, []);
  if (!r.opened_at && r.status === 'pending') {
    await env.DB.prepare(`UPDATE crm_sign SET opened_at = datetime('now') WHERE id = ?`).bind(r.id).run();
    await addEvent(env, r.deal_id, 'sign', `Az aláíró megnyitotta az aláírási oldalt (#${r.id}: ${docs.length} dokumentum)`, 'Ügyfél');
  }
  return J({
    ok: true, id: r.id, status: r.status, signer: r.signer_name, email: maskEmail(r.email), message: r.message || '', lang: isDe(r) ? 'de' : 'hu',
    prior: isDe(r) ? ((docs[0] && docs[0].prior) ? { name: docs[0].prior.name || '', when: docs[0].prior.when || '' } : null) : null,
    expires: new Date(r.expires_at * 1000).toISOString(), statement: isDe(r) ? SIGN_STATEMENT_DE : SIGN_STATEMENT,
    signed_at: r.signed_at ? huDateTime(r.signed_at) : null, sign_name: r.sign_name || null,
    docs: docs.map((d, i) => ({ i, name: d.name, kind: d.kind, text: r.status === 'pending' || r.status === 'signed' ? d.text : '', hash: d.hash, signed: !!(res[i] && res[i].file_id), cosign: !!(res[i] && res[i].cosign), sigs: r.status === 'pending' ? (d.sigs || []).map((z) => ({ names: z.names, src: 'data:image/jpeg;base64,' + z.b64 })).concat(d.prior && parseJ(r.prior, {}).jpeg ? [{ names: [].concat(d.prior.match || []), src: 'data:image/jpeg;base64,' + parseJ(r.prior, {}).jpeg }] : []) : [] }))
  });
}

async function sendCode(env, r) {
  if (r.status !== 'pending') return J({ ok: false, error: 'locked' }, 409);
  if (!(await rateOk(env, 'sc:' + r.id, 5, 3600))) return J({ ok: false, error: 'too_many_codes' }, 429);
  const code = randomDigits(6);
  await env.DB.prepare(`UPDATE crm_sign SET code_hash = ?, code_exp = ?, code_attempts = 0 WHERE id = ?`).bind(await sha256hex('crmotp|' + r.id + '|' + code), now() + 600, r.id).run();
  const fwd = fwdOf(env);
  const big = `<p style="font:bold 34px/1 'Courier New',monospace;letter-spacing:6px;margin:18px 0">${code}</p>`;
  const m = isDe(r)
    ? await sendCrmMail(env, fwd || r.email, `${fwd ? '[TESZT — ' + r.email + '] ' : ''}Bestätigungscode für die Unterschrift: ${code}`,
      `<p>Sehr geehrte Damen und Herren,</p><p>bitte geben Sie zur Gegenzeichnung der von CarAdvance übermittelten Dokumente diesen Code ein:</p>${big}
       <p style="color:#6b7280;font-size:13px">Der Code ist 10 Minuten gültig und nur einmal verwendbar. Falls Sie ihn nicht angefordert haben, ignorieren Sie diese E-Mail bitte und informieren Sie uns.</p>`, null, { noCopy: true })
    : await sendCrmMail(env, fwd || r.email, `${fwd ? '[TESZT — ' + r.email + '] ' : ''}Aláírási kód: ${code}`,
      `<p>Kedves ${esc(r.signer_name || 'Ügyfelünk')}!</p><p>A CarAdvance által aláírásra küldött dokumentum(ok) aláírásához adja meg ezt a kódot:</p>${big}
       <p style="color:#6b7280;font-size:13px">A kód 10 percig érvényes, és csak egyszer használható. Ha nem Ön kérte, hagyja figyelmen kívül ezt az e-mailt, és kérjük, jelezze nekünk.</p>`, null, { noCopy: true }); // az aláírási kódról nem megy másolat
  if (!m.ok) return J({ ok: false, error: 'mail_failed' }, 502);
  await addEvent(env, r.deal_id, 'sign', `Aláírási kód elküldve (#${r.id}) → ${fwd ? 'TESZT → ' + fwd : r.email}`, 'Ügyfél');
  return J({ ok: true, email: maskEmail(r.email) });
}

async function sign(request, env, r, b, ip) {
  if (r.status !== 'pending') return J({ ok: false, error: 'locked' }, 409);
  const name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (name.length < 3) return J({ ok: false, error: 'bad_name' }, 400);
  if (b.consent !== true) return J({ ok: false, error: 'consent' }, 400);
  const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.sig || ''));
  if (!mm || mm[1].length > 400000) return J({ ok: false, error: 'bad_signature' }, 400);
  const sigBytes = b64ToBytes(mm[1]); const inf = jpegInfo(sigBytes);
  if (!inf || inf.w < 100 || inf.h < 40 || inf.w > 3000 || inf.h > 2000) return J({ ok: false, error: 'bad_signature' }, 400);
  // egyszeri kód
  if (!r.code_hash || !r.code_exp || r.code_exp < now()) return J({ ok: false, error: 'code_expired' }, 400);
  if ((r.code_attempts || 0) >= 5) return J({ ok: false, error: 'too_many' }, 429);
  const okCode = (await sha256hex('crmotp|' + r.id + '|' + String(b.code || '').replace(/\D/g, ''))) === r.code_hash;
  if (!okCode) {
    await env.DB.prepare(`UPDATE crm_sign SET code_attempts = code_attempts + 1, fails = fails + 1, status = CASE WHEN fails + 1 >= 15 THEN 'locked' ELSE status END WHERE id = ?`).bind(r.id).run();
    if ((r.fails || 0) + 1 >= 15) await addEvent(env, r.deal_id, 'sign', `Aláírási kérelem zárolva túl sok hibás kód miatt (#${r.id})`, 'Rendszer');
    return J({ ok: false, error: 'wrong_code', left: Math.max(0, 4 - (r.code_attempts || 0)) }, 400);
  }
  // a kérelem lefoglalása (egyszeri aláírás, párhuzamos kérések ellen)
  const claim = await env.DB.prepare(`UPDATE crm_sign SET status = 'signing', code_hash = NULL, code_exp = NULL, otp_at = datetime('now') WHERE id = ? AND status = 'pending'`).bind(r.id).run();
  if (!claim.meta || !claim.meta.changes) return J({ ok: false, error: 'locked' }, 409);
  try {
    const { when, result } = await completeSign(env, r, { name, sigBytes, sigB64: mm[1], ip, ua: clean(request.headers.get('user-agent') || '', 300) });
    return J({ ok: true, signed_at: when, docs: result.map((x, i) => ({ i, name: x.name })) });
  } catch (e) {
    console.error('crm-alairas sign', e && e.stack || e);
    await env.DB.prepare(`UPDATE crm_sign SET status = 'pending' WHERE id = ? AND status = 'signing'`).bind(r.id).run();
    return J({ ok: false, error: e.message === 'integrity' ? 'integrity' : 'server' }, 500);
  }
}

async function pdf(env, r, i) {
  const docs = parseJ(r.docs, []); const d = docs[i];
  if (!d) return J({ ok: false, error: 'not_found' }, 404);
  let bytes;
  if (r.status === 'signed') {
    const res = parseJ(r.result, [])[i]; if (!res) return J({ ok: false, error: 'not_found' }, 404);
    const f = await env.DB.prepare(`SELECT id, data FROM crm_files WHERE id = ? AND deal_id = ?`).bind(res.file_id, r.deal_id).first();
    if (!f) return J({ ok: false, error: 'not_found' }, 404);
    bytes = b64ToBytes(await fileData(env, f));
  } else if (r.status === 'pending') { const ps = priorSigns(r, d); bytes = pdfFor(d, ps.length ? ps : null); }
  else return J({ ok: false, error: 'locked' }, 409);
  return new Response(bytes, { headers: { ...SEC, 'content-type': 'application/pdf', 'content-disposition': 'inline; filename="dokumentum.pdf"' } });
}

export async function onRequest(context) {
  const { request, env } = context;
  const path = new URL(request.url).pathname.replace(/^\/api\/crm-alairas/, '') || '/';
  if (request.method !== 'POST') return J({ ok: false, error: 'method' }, 405);
  try {
    await ensureCrm(env);
    const ip = clean(request.headers.get('CF-Connecting-IP') || '', 60);
    if (!(await rateOk(env, 'ip:' + ip, 120, 600))) return J({ ok: false, error: 'rate' }, 429);
    const b = await request.json().catch(() => ({}));
    const { r, err } = await load(env, b.t); if (err) return err;
    if (path === '/view') return await view(env, r);
    if (path === '/code') return await sendCode(env, r);
    if (path === '/sign') return await sign(request, env, r, b, ip);
    if (path === '/pdf') return await pdf(env, r, Number(b.i));
    return J({ ok: false, error: 'not_found' }, 404);
  } catch (e) {
    return J({ ok: false, error: 'server' }, 500);
  }
}
