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
  ensureCrm, json, parseJ, clean, addEvent, sendCrmMail, notifyTo, esc, sha256hex, bytesToB64, b64ToBytes, putFile, fileData,
  rateOk, randomDigits, maskEmail, huDateTime, SIGN_STATEMENT, SIGN_STATEMENT_DE, SITE, getSetting, deleteFile
} from '../../../lib/crm.js';
import { renderDocPdf, jpegInfo } from '../../../lib/docpdf.js';

const TOKEN_RE = /^[a-f0-9]{64}$/;
const SEC = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff' };
const J = (o, s) => json(o, s || 200, SEC);
const KIND_SUB = { szerzodes: 'Szerződés', meghatalmazas: 'Meghatalmazás', nyilatkozat: 'Nyilatkozat', melleklet: 'Melléklet', egyeb: 'Dokumentum' };
const now = () => Math.floor(Date.now() / 1000);
// ellenjegyzés: az ügyfél aláírása után a kétnyelvű (DE/HU) dokumentumokat a német partner (Caradvance GmbH) is aláírja — német nyelvű oldalon
const isDe = (r) => r.signer_role === 'partner';
const fwdOf = (env) => (env.CRM_TEST_FORWARD === 'off' ? null : (env.CRM_TEST_FORWARD || 'marc.nemethy@bhgeu.com'));
const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((x) => x.toString(16).padStart(2, '0')).join('');
const fileBase = (name) => (name.split(' — ')[0]).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/_+/g, '_').slice(0, 80);
/** A korábbi (ügyfél-) aláírás adatai egy dokumentumhoz → renderDocPdf sign objektum. */
function priorSigns(r, d) {
  const pr = parseJ(r.prior, {}); if (!d.prior || !pr.jpeg) return [];
  return [{ ...d.prior, jpeg: b64ToBytes(pr.jpeg) }];
}

async function load(env, t) {
  if (!TOKEN_RE.test(String(t || ''))) return { err: J({ ok: false, error: 'bad_link' }, 400) };
  const r = await env.DB.prepare(`SELECT * FROM crm_sign WHERE token_hash = ?`).bind(await sha256hex('crmsign|' + t)).first();
  if (!r) return { err: J({ ok: false, error: 'not_found' }, 404) };
  if (r.status === 'pending' && r.expires_at < now()) { await env.DB.prepare(`UPDATE crm_sign SET status = 'expired' WHERE id = ? AND status = 'pending'`).bind(r.id).run(); r.status = 'expired'; }
  return { r };
}
function pdfFor(doc, sign) { // sign: egy aláírás vagy aláírások tömbje
  const specimens = (doc.sigs || []).map((z) => ({ names: z.names, jpeg: b64ToBytes(z.b64) }));
  return renderDocPdf(doc.text, { title: doc.name, number: doc.number || '', hash: doc.hash, sub: KIND_SUB[doc.kind] || 'Dokumentum', sign, specimens });
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
    const de = isDe(r);
    const ua = clean(request.headers.get('user-agent') || '', 300);
    const at = new Date(); const atIso = at.toISOString(); const when = huDateTime(atIso);
    const sigSha = await sha256hex(sigBytes);
    const statement = de ? SIGN_STATEMENT_DE : SIGN_STATEMENT;
    const lb = (hu, g) => (de ? g + ' / ' + hu : hu);
    // ellenjegyzés: az ügyfél aláírása után a partnerhez kerülő dokumentumok (beállítás: partner_sign_email; üres = kikapcsolva)
    const partnerEmail = de ? '' : String(await getSetting(env, 'partner_sign_email', 'import@caradvance.de') || '').trim();
    const docs = parseJ(r.docs, []); const result = []; const att = []; const cos = [];
    for (const [i, d] of docs.entries()) {
      // ellenőrzés: a befagyasztott szöveg lenyomata nem változott
      if ((await sha256hex(d.text)) !== d.hash) throw new Error('integrity');
      const rows = [
        [lb('Dokumentum', 'Dokument'), d.name], [lb('Dokumentum-azonosító (tartalom SHA-256)', 'Dokument-ID (Inhalt SHA-256)'), d.hash],
        [lb('Aláírási kérelem', 'Signaturanfrage'), '#' + r.id + ' · ' + (r.created_by || 'CarAdvance') + ', ' + huDateTime(r.created_at)],
        [lb('Aláíró (nyilvántartott)', 'Unterzeichner (registriert)'), r.signer_name], [lb('Aláíró által begépelt név', 'Vom Unterzeichner eingegebener Name'), name], [lb('E-mail cím', 'E-Mail-Adresse'), r.email],
        [lb('Azonosítás', 'Identifizierung'), (de ? 'Einmalcode (OTP) an die E-Mail-Adresse geprüft — ' : 'az e-mail címre küldött egyszeri kód (OTP) ellenőrizve — ') + when],
        [lb('Aláírás időpontja', 'Zeitpunkt der Unterschrift'), when + ' (Europe/Budapest) · ' + atIso + ' (UTC)'],
        [lb('IP-cím', 'IP-Adresse'), ip || '—'], [lb('Eszköz / böngésző', 'Gerät / Browser'), ua || '—'], [lb('Aláíráskép SHA-256', 'Unterschriftsbild SHA-256'), sigSha]
      ];
      const mine = { jpeg: sigBytes, match: de ? (d.match || []) : (d.match || r.signer_name), when, statement, rows, de, title: de ? 'Gegenzeichnung / Ellenjegyzés' : '' };
      const needCo = !de && partnerEmail && Array.isArray(d.cosign) && d.cosign.length;
      const pdf = pdfFor(d, priorSigns(r, d).concat([mine]));
      const pdfSha = await sha256hex(pdf);
      const fname = fileBase(d.name) + (needCo ? '_ALAIRT_UGYFEL' : '_ALAIRT') + '.pdf';
      const b64 = bytesToB64(pdf);
      const f = await putFile(env, r.deal_id, fname, 'application/pdf', b64, null);
      await env.DB.prepare(`UPDATE crm_docs SET sign_status = ?, signed_file_id = ? WHERE id = ? AND deal_id = ?`).bind(needCo ? 'cosign' : 'signed', f.id, d.doc_id, r.deal_id).run();
      result.push({ doc_id: d.doc_id, name: d.name, file_id: f.id, pdf_sha: pdfSha, cosign: !!needCo });
      att.push({ filename: fname, content: b64, cosign: !!needCo });
      if (needCo) cos.push({ doc_id: d.doc_id, name: d.name, kind: d.kind, text: d.text, hash: d.hash, number: d.number || '', match: d.cosign, sigs: d.sigs || [],
        prior: { match: mine.match, when, statement, rows, name }, client_file_id: f.id });
    }
    await env.DB.prepare(`UPDATE crm_sign SET status = 'signed', signed_at = datetime('now'), sign_name = ?, sign_ip = ?, sign_ua = ?, sig_sha = ?, result = ? WHERE id = ?`)
      .bind(name, ip, ua, sigSha, JSON.stringify(result), r.id).run();
    await addEvent(env, r.deal_id, 'sign', `${de ? 'ELLENJEGYEZVE (partner)' : 'ALÁÍRVA elektronikusan'}: ${name} (${r.email}, egyszeri kóddal azonosítva, IP: ${ip}) — ${result.map((x) => x.name + ' [PDF SHA-256: ' + x.pdf_sha.slice(0, 16) + '…]').join('; ')}`, de ? 'Partner' : 'Ügyfél');
    const fwd = fwdOf(env);
    if (de) await finishCosign(env, r, result, att, name, when, fwd);
    else await afterClientSign(env, r, result, att, cos, name, when, fwd, partnerEmail, mm[1]);
    try {
      await sendCrmMail(env, notifyTo(env), `${de ? 'ELLENJEGYEZVE' : 'ALÁÍRVA'}: ${de ? (parseJ(r.prior, {}).client || '') + ' — ' + name + ' (partner)' : (r.signer_name || name)} — ${result.length} dokumentum`,
        `<p><b>${esc(name)}</b> (${esc(r.email)}) elektronikusan ${de ? 'ellenjegyezte (partner)' : 'aláírta'}:</p><ul>${result.map((x) => `<li>${esc(x.name)}${x.cosign ? ' — <i>a partner ellenjegyzésére vár</i>' : ''}</li>`).join('')}</ul><p>IP: ${esc(ip)} · ${esc(when)}</p><p><a href="${SITE}/belso/ugyfel/?id=${r.deal_id}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px;display:inline-block">Ügyfél adatlap megnyitása</a></p>`);
    } catch (e) { /* nem kritikus */ }
    return J({ ok: true, signed_at: when, docs: result.map((x, i) => ({ i, name: x.name })) });
  } catch (e) {
    console.error('crm-alairas sign', e && e.stack || e);
    await env.DB.prepare(`UPDATE crm_sign SET status = 'pending' WHERE id = ? AND status = 'signing'`).bind(r.id).run();
    return J({ ok: false, error: e.message === 'integrity' ? 'integrity' : 'server' }, 500);
  }
}

/** Ügyfél aláírása után: a kész PDF-ek az ügyfélnek; a kétnyelvűek (az ügyfél aláírásával) ellenjegyzésre a partnernek. */
async function afterClientSign(env, r, result, att, cos, name, when, fwd, partnerEmail, sigB64) {
  const done = result.filter((x) => !x.cosign); const wait = result.filter((x) => x.cosign);
  const li = (a) => `<ul>${a.map((x) => `<li>${esc(x.name)}</li>`).join('')}</ul>`;
  try {
    await sendCrmMail(env, fwd || r.email, `${fwd ? '[TESZT — ' + r.email + '] ' : ''}Aláírt dokumentumok — CarAdvance`,
      `<p>Kedves ${esc(r.signer_name || name)}!</p><p>Köszönjük, az alábbi dokumentumokat elektronikusan aláírta (${esc(when)}):</p>${li(result)}`
      + (done.length ? `<p>${wait.length ? 'A már végleges' : 'Az aláírt'} példányokat (PDF, aláírási tanúsítvánnyal) csatoltan küldjük — kérjük, őrizze meg őket.</p>` : '')
      + (wait.length ? `<p>A kétnyelvű szerződéseket (${wait.map((x) => esc(x.name)).join(', ')}) most a Caradvance GmbH is aláírja; a mindkét fél által aláírt példányokat ezt követően e-mailben megküldjük.</p>` : '')
      + `<p>Üdvözlettel:<br>CarAdvance</p>`, att.filter((a) => !a.cosign).map(({ filename, content }) => ({ filename, content })));
  } catch (e) { /* a levél hibája nem érvényteleníti az aláírást */ }
  if (!cos.length) return;
  const token = randomHex(32); const exp = now() + 14 * 86400;
  const partnerName = await getSetting(env, 'partner_name', 'Caradvance GmbH');
  const ins = await env.DB.prepare(`INSERT INTO crm_sign (token_hash, deal_id, signer_role, signer_name, email, docs, message, created_by, expires_at, parent_id, prior) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(await sha256hex('crmsign|' + token), r.deal_id, 'partner', partnerName, partnerEmail.toLowerCase(), JSON.stringify(cos), '', 'Rendszer (ügyfél aláírása után)', exp, r.id,
      JSON.stringify({ jpeg: sigB64, client: r.signer_name || name })).run();
  const pid = ins.meta.last_row_id;
  await env.DB.prepare(`UPDATE crm_docs SET sign_id = ? WHERE deal_id = ? AND sign_status = 'cosign' AND id IN (${cos.map(() => '?').join(',')})`).bind(pid, r.deal_id, ...cos.map((d) => d.doc_id)).run();
  const link = `${SITE}/alairas/#${token}`;
  const client = r.signer_name || name;
  const m = await sendCrmMail(env, fwd || partnerEmail, `${fwd ? '[TESZT — ' + partnerEmail + '] ' : ''}Zur Gegenzeichnung: ${client} — CarAdvance`,
    `<p>Sehr geehrte Damen und Herren,</p><p>unser Kunde <b>${esc(client)}</b> hat die folgenden Dokumente am ${esc(when)} elektronisch unterschrieben:</p>${li(cos)}
     <p>Bitte prüfen und unterschreiben Sie die Dokumente ebenfalls elektronisch. Die vom Kunden unterschriebenen Exemplare (PDF) sind beigefügt.</p>
     <p style="margin:18px 0"><a href="${esc(link)}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:999px;display:inline-block">Dokumente prüfen und unterschreiben</a></p>
     <p>Zur Identifizierung senden wir Ihnen bei der Unterschrift einen Einmalcode an diese E-Mail-Adresse. Nach Ihrer Unterschrift erhalten Sie, der Kunde und unser Vertrieb die von beiden Seiten unterschriebenen Dokumente per E-Mail.</p>
     <p style="color:#6b7280;font-size:12px">Der Link ist persönlich, bitte nicht weiterleiten. Gültig bis ${new Date(exp * 1000).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}.</p><p>Mit freundlichen Grüßen<br>CarAdvance</p>`,
    att.filter((a) => a.cosign).map(({ filename, content }) => ({ filename, content })), { noCopy: true });
  await addEvent(env, r.deal_id, 'sign', `Ellenjegyzésre kiküldve a partnernek (#${pid}) → ${fwd ? 'TESZT → ' + fwd : partnerEmail}: ${cos.map((d) => d.name).join('; ')}${m.ok ? '' : ' — AZ E-MAIL NEM MENT KI: ' + m.error}`, 'Rendszer');
}

/** Partner ellenjegyzése után: a mindkét fél által aláírt PDF-ek az ügyfélnek, a partnernek és a sales@ címre; a köztes (csak ügyfél által aláírt) fájlok törlése. */
async function finishCosign(env, r, result, att, name, when, fwd) {
  const parent = r.parent_id ? await env.DB.prepare(`SELECT * FROM crm_sign WHERE id = ?`).bind(r.parent_id).first() : null;
  const docs = parseJ(r.docs, []);
  if (parent) {
    const pres = parseJ(parent.result, []);
    for (const [i, d] of docs.entries()) {
      const x = result[i]; if (!x) continue;
      const pr = pres.find((p) => p.doc_id === d.doc_id); if (pr) { pr.file_id = x.file_id; pr.pdf_sha = x.pdf_sha; pr.cosign = false; pr.cosigned = true; }
      if (d.client_file_id) await deleteFile(env, r.deal_id, d.client_file_id);
    }
    await env.DB.prepare(`UPDATE crm_sign SET result = ? WHERE id = ?`).bind(JSON.stringify(pres), parent.id).run();
  }
  const files = att.map(({ filename, content }) => ({ filename, content }));
  const li = `<ul>${result.map((x) => `<li>${esc(x.name)}</li>`).join('')}</ul>`;
  const client = (parent && parent.signer_name) || parseJ(r.prior, {}).client || '';
  const cEmail = parent ? parent.email : '';
  const sales = env.CRM_BCC && env.CRM_BCC !== 'off' ? env.CRM_BCC : 'sales@caradvance.hu';
  try {
    if (cEmail) await sendCrmMail(env, fwd || cEmail, `${fwd ? '[TESZT — ' + cEmail + '] ' : ''}Mindkét fél által aláírt dokumentumok — CarAdvance`,
      `<p>Kedves ${esc(client)}!</p><p>A Caradvance GmbH is aláírta az alábbi dokumentumokat (${esc(when)}):</p>${li}<p>A mindkét fél által aláírt végleges példányokat (PDF, aláírási tanúsítványokkal) csatoltan küldjük — kérjük, őrizze meg őket.</p><p>Üdvözlettel:<br>CarAdvance</p>`, files, { noCopy: true });
  } catch (e) { /* nem kritikus */ }
  try {
    await sendCrmMail(env, fwd || r.email, `${fwd ? '[TESZT — ' + r.email + '] ' : ''}Beidseitig unterschriebene Dokumente: ${client} — CarAdvance`,
      `<p>Sehr geehrte Damen und Herren,</p><p>vielen Dank für Ihre Gegenzeichnung (${esc(when)}). Anbei die von beiden Seiten unterschriebenen Dokumente (PDF mit Signaturprotokollen) für <b>${esc(client)}</b>:</p>${li}<p>Mit freundlichen Grüßen<br>CarAdvance</p>`, files, { noCopy: true });
  } catch (e) { /* nem kritikus */ }
  try {
    await sendCrmMail(env, sales, `Mindkét fél által aláírva: ${client} — ${result.length} dokumentum`,
      `<p>A(z) <b>${esc(client)}</b> ügyfél és a Caradvance GmbH (${esc(name)}) is aláírta az alábbi dokumentumokat (${esc(when)}):</p>${li}<p>A végleges PDF-ek csatolva, és az ügyfél adatlapján a feltöltött fájlok között is megtalálhatók.</p><p><a href="${SITE}/belso/ugyfel/?id=${r.deal_id}">Ügyfél adatlap megnyitása</a></p>`, files, { noCopy: true });
  } catch (e) { /* nem kritikus */ }
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
