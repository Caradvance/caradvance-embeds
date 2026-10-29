// CarAdvance CRM — az elektronikus aláírás közös magja (aláírási link: /api/crm-alairas, partnerfelület: /api/partner).
// Egy aláírási kérelem (crm_sign sor) aláírása: PDF-ek (tanúsítvánnyal), fájlok mentése, státuszok, e-mailek,
// ügyfél aláírása után az ellenjegyzendő (kétnyelvű) dokumentumok továbbítása az illetékes partnernek (crm_partners).
import {
  parseJ, addEvent, sendCrmMail, notifyTo, esc, sha256hex, bytesToB64, b64ToBytes, putFile, deleteFile,
  huDateTime, SIGN_STATEMENT, SIGN_STATEMENT_DE, SITE, syncDocChecklist
} from './crm.js';
import { renderDocPdf } from './docpdf.js';

export const KIND_SUB = { szerzodes: 'Szerződés', meghatalmazas: 'Meghatalmazás', nyilatkozat: 'Nyilatkozat', melleklet: 'Melléklet', egyeb: 'Dokumentum' };
export const nowSec = () => Math.floor(Date.now() / 1000);
export const isPartnerReq = (r) => r.signer_role === 'partner';
export const fwdOf = (env) => (env.CRM_TEST_FORWARD === 'off' ? null : (env.CRM_TEST_FORWARD || 'marc.nemethy@bhgeu.com'));
export const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((x) => x.toString(16).padStart(2, '0')).join('');
const fileBase = (name) => (name.split(' — ')[0]).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/_+/g, '_').slice(0, 80);

/** A korábbi (ügyfél-) aláírás adatai egy dokumentumhoz → renderDocPdf sign objektum. */
export function priorSigns(r, d) {
  const pr = parseJ(r.prior, {}); if (!d.prior || !pr.jpeg) return [];
  return [{ ...d.prior, jpeg: b64ToBytes(pr.jpeg) }];
}
export function pdfFor(doc, sign) { // sign: egy aláírás vagy aláírások tömbje
  const specimens = (doc.sigs || []).map((z) => ({ names: z.names, jpeg: b64ToBytes(z.b64) }));
  return renderDocPdf(doc.text, { title: doc.name, number: doc.number || '', hash: doc.hash, sub: KIND_SUB[doc.kind] || 'Dokumentum', sign, specimens });
}
/** Aktív partnerek (ellenjegyzők) országonként. */
export async function activePartners(env) {
  return ((await env.DB.prepare(`SELECT * FROM crm_partners WHERE active = 1 ORDER BY id`).all()).results || []);
}

/**
 * Egy már lefoglalt (status = 'signing') kérelem aláírása.
 * o: { name (begépelt név), sigBytes, sigB64, ip, ua, ident (azonosítás leírása, opcionális) }
 * Hiba esetén kivételt dob — a hívó állítja vissza a státuszt 'pending'-re.
 */
export async function completeSign(env, r, o) {
  const de = isPartnerReq(r);
  const { name, sigBytes, sigB64, ip, ua } = o;
  const atIso = new Date().toISOString(); const when = huDateTime(atIso);
  const sigSha = await sha256hex(sigBytes);
  const statement = de ? SIGN_STATEMENT_DE : SIGN_STATEMENT;
  const lb = (hu, g) => (de ? g + ' / ' + hu : hu);
  const ident = o.ident || (de ? 'Einmalcode (OTP) an die E-Mail-Adresse geprüft' : 'az e-mail címre küldött egyszeri kód (OTP) ellenőrizve');
  // ellenjegyzés: az ügyfél aláírása után a kétnyelvű dokumentumok az illetékes partnerhez kerülnek (crm_partners)
  const partners = de ? [] : await activePartners(env);
  const docs = parseJ(r.docs, []); const result = []; const att = []; const cos = [];
  for (const d of docs) {
    // ellenőrzés: a befagyasztott szöveg lenyomata nem változott
    if ((await sha256hex(d.text)) !== d.hash) throw new Error('integrity');
    const rows = [
      [lb('Dokumentum', 'Dokument'), d.name], [lb('Dokumentum-azonosító (tartalom SHA-256)', 'Dokument-ID (Inhalt SHA-256)'), d.hash],
      [lb('Aláírási kérelem', 'Signaturanfrage'), '#' + r.id + ' · ' + (r.created_by || 'CarAdvance') + ', ' + huDateTime(r.created_at)],
      [lb('Aláíró (nyilvántartott)', 'Unterzeichner (registriert)'), r.signer_name], [lb('Aláíró által begépelt név', 'Vom Unterzeichner eingegebener Name'), name], [lb('E-mail cím', 'E-Mail-Adresse'), r.email],
      [lb('Azonosítás', 'Identifizierung'), ident + ' — ' + when],
      [lb('Aláírás időpontja', 'Zeitpunkt der Unterschrift'), when + ' (Europe/Budapest) · ' + atIso + ' (UTC)'],
      [lb('IP-cím', 'IP-Adresse'), ip || '—'], [lb('Eszköz / böngésző', 'Gerät / Browser'), ua || '—'], [lb('Aláíráskép SHA-256', 'Unterschriftsbild SHA-256'), sigSha]
    ];
    const mine = { jpeg: sigBytes, match: de ? (d.match || []) : (d.match || r.signer_name), when, statement, rows, de, title: de ? 'Gegenzeichnung / Ellenjegyzés' : '' };
    // melyik partner jegyzi ellen (a kiküldéskor rögzített hasábnevek alapján; régi kérelmeknél az első partner)
    const P = !de && Array.isArray(d.cosign) && d.cosign.length ? (partners.find((p) => p.id === d.cosign_pid) || (!d.cosign_pid && partners[0]) || null) : null;
    const pdf = pdfFor(d, priorSigns(r, d).concat([mine]));
    const pdfSha = await sha256hex(pdf);
    const fname = fileBase(d.name) + (P ? '_ALAIRT_UGYFEL' : '_ALAIRT') + '.pdf';
    const b64 = bytesToB64(pdf);
    const f = await putFile(env, r.deal_id, fname, 'application/pdf', b64, null);
    await env.DB.prepare(`UPDATE crm_docs SET sign_status = ?, signed_file_id = ? WHERE id = ? AND deal_id = ?`).bind(P ? 'cosign' : 'signed', f.id, d.doc_id, r.deal_id).run();
    result.push({ doc_id: d.doc_id, name: d.name, file_id: f.id, pdf_sha: pdfSha, cosign: !!P });
    att.push({ filename: fname, content: b64, cosign: !!P, pid: P ? P.id : null });
    if (P) cos.push({ pid: P.id, doc: { doc_id: d.doc_id, name: d.name, kind: d.kind, text: d.text, hash: d.hash, number: d.number || '', match: d.cosign, sigs: d.sigs || [],
      prior: { match: mine.match, when, statement, rows, name }, client_file_id: f.id } });
  }
  await env.DB.prepare(`UPDATE crm_sign SET status = 'signed', signed_at = datetime('now'), sign_name = ?, sign_ip = ?, sign_ua = ?, sig_sha = ?, result = ? WHERE id = ?`)
    .bind(name, ip, ua, sigSha, JSON.stringify(result), r.id).run();
  await addEvent(env, r.deal_id, 'sign', `${de ? 'ELLENJEGYEZVE (partner: ' + r.signer_name + ')' : 'ALÁÍRVA elektronikusan'}: ${name} (${r.email}, ${o.ident ? 'partnerfelület + egyszeri kód' : 'egyszeri kóddal azonosítva'}, IP: ${ip}) — ${result.map((x) => x.name + ' [PDF SHA-256: ' + x.pdf_sha.slice(0, 16) + '…]').join('; ')}`, de ? 'Partner' : 'Ügyfél');
  const fwd = fwdOf(env);
  if (de) await finishCosign(env, r, result, att, name, when, fwd);
  else await afterClientSign(env, r, result, att, cos, partners, name, when, fwd, sigB64);
  try {
    await sendCrmMail(env, notifyTo(env), `${de ? 'ELLENJEGYEZVE' : 'ALÁÍRVA'}: ${de ? (parseJ(r.prior, {}).client || '') + ' — ' + name + ' (' + r.signer_name + ')' : (r.signer_name || name)} — ${result.length} dokumentum`,
      `<p><b>${esc(name)}</b> (${esc(r.email)}) elektronikusan ${de ? 'ellenjegyezte (partner: ' + esc(r.signer_name) + ')' : 'aláírta'}:</p><ul>${result.map((x) => `<li>${esc(x.name)}${x.cosign ? ' — <i>a partner ellenjegyzésére vár</i>' : ''}</li>`).join('')}</ul><p>IP: ${esc(ip)} · ${esc(when)}</p><p><a href="${SITE}/belso/ugyfel/?id=${r.deal_id}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px;display:inline-block">Ügyfél adatlap megnyitása</a></p>`);
  } catch (e) { /* nem kritikus */ }
  try { await syncDocChecklist(env, r.deal_id); } catch (e) { console.error('checklist', e); } // szerződések / meghatalmazások pipái
  return { when, result };
}

/** Partnerlevelek szövege (német; más nyelvű partnernél angol). */
function pT(lang) {
  const de = lang === 'de';
  return {
    hello: de ? 'Sehr geehrte Damen und Herren,' : 'Dear Sir or Madam,',
    regards: de ? 'Mit freundlichen Grüßen<br>CarAdvance' : 'Kind regards,<br>CarAdvance',
    subjReq: (c) => (de ? `Zur Gegenzeichnung: ${c} — CarAdvance` : `For countersignature: ${c} — CarAdvance`),
    reqBody: (c, when) => (de ? `unser Kunde <b>${esc(c)}</b> hat die folgenden Dokumente am ${esc(when)} elektronisch unterschrieben:` : `our client <b>${esc(c)}</b> electronically signed the following documents on ${esc(when)}:`),
    reqAsk: de ? 'Bitte prüfen und unterschreiben Sie die Dokumente ebenfalls elektronisch — im <b>Partnerportal</b> (mit Ihrer gespeicherten Unterschrift, auch mehrere auf einmal) oder direkt über den Link unten. Die vom Kunden unterschriebenen Exemplare (PDF) sind beigefügt.'
      : 'Please review and countersign the documents electronically — in the <b>partner portal</b> (with your saved signature, several at once) or directly via the link below. The copies signed by the client (PDF) are attached.',
    btnPortal: de ? 'Partnerportal öffnen' : 'Open partner portal',
    btnLink: de ? 'Nur diese Dokumente unterschreiben' : 'Sign these documents only',
    after: de ? 'Nach Ihrer Unterschrift erhalten Sie, der Kunde und unser Vertrieb die von beiden Seiten unterschriebenen Dokumente per E-Mail.' : 'After your signature, you, the client and our sales team receive the documents signed by both parties by e-mail.',
    valid: (d) => (de ? `Der Link ist persönlich, bitte nicht weiterleiten. Gültig bis ${d}.` : `The link is personal, please do not forward it. Valid until ${d}.`),
    subjDone: (c) => (de ? `Beidseitig unterschriebene Dokumente: ${c} — CarAdvance` : `Documents signed by both parties: ${c} — CarAdvance`),
    doneBody: (c, when) => (de ? `vielen Dank für Ihre Gegenzeichnung (${esc(when)}). Anbei die von beiden Seiten unterschriebenen Dokumente (PDF mit Signaturprotokollen) für <b>${esc(c)}</b>:` : `thank you for your countersignature (${esc(when)}). Attached are the documents signed by both parties (PDF with signature certificates) for <b>${esc(c)}</b>:`)
  };
}

/** Ügyfél aláírása után: a kész PDF-ek az ügyfélnek; a kétnyelvűek (az ügyfél aláírásával) ellenjegyzésre az illetékes partner(ek)nek. */
async function afterClientSign(env, r, result, att, cos, partners, name, when, fwd, sigB64) {
  const done = result.filter((x) => !x.cosign); const wait = result.filter((x) => x.cosign);
  const li = (a) => `<ul>${a.map((x) => `<li>${esc(x.name)}</li>`).join('')}</ul>`;
  const coNames = [...new Set(cos.map((c) => (partners.find((p) => p.id === c.pid) || {}).company).filter(Boolean))].join(', ') || 'a partner';
  try {
    await sendCrmMail(env, fwd || r.email, `${fwd ? '[TESZT — ' + r.email + '] ' : ''}Aláírt dokumentumok — CarAdvance`,
      `<p>Kedves ${esc(r.signer_name || name)}!</p><p>Köszönjük, az alábbi dokumentumokat elektronikusan aláírta (${esc(when)}):</p>${li(result)}`
      + (done.length ? `<p>${wait.length ? 'A már végleges' : 'Az aláírt'} példányokat (PDF, aláírási tanúsítvánnyal) csatoltan küldjük — kérjük, őrizze meg őket.</p>` : '')
      + (wait.length ? `<p>A kétnyelvű szerződéseket (${wait.map((x) => esc(x.name)).join(', ')}) most a(z) ${esc(coNames)} is aláírja; a mindkét fél által aláírt példányokat ezt követően e-mailben megküldjük.</p>` : '')
      + `<p>Üdvözlettel:<br>CarAdvance</p>`, att.filter((a) => !a.cosign).map(({ filename, content }) => ({ filename, content })));
  } catch (e) { /* a levél hibája nem érvényteleníti az aláírást */ }
  const client = r.signer_name || name;
  for (const P of partners) {
    const mine = cos.filter((c) => c.pid === P.id).map((c) => c.doc); if (!mine.length) continue;
    const token = randomHex(32); const exp = nowSec() + 14 * 86400;
    const to = String(P.notify_email || P.login || '').toLowerCase();
    const ins = await env.DB.prepare(`INSERT INTO crm_sign (token_hash, deal_id, signer_role, signer_name, email, docs, message, created_by, expires_at, parent_id, prior, partner_id, market) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(await sha256hex('crmsign|' + token), r.deal_id, 'partner', P.company, to, JSON.stringify(mine), '', 'Rendszer (ügyfél aláírása után)', exp, r.id, JSON.stringify({ jpeg: sigB64, client }), P.id, r.market || 'HU').run();
    const pid = ins.meta.last_row_id;
    await env.DB.prepare(`UPDATE crm_docs SET sign_id = ? WHERE deal_id = ? AND sign_status = 'cosign' AND id IN (${mine.map(() => '?').join(',')})`).bind(pid, r.deal_id, ...mine.map((d) => d.doc_id)).run();
    const T = pT(P.lang); const link = `${SITE}/alairas/#${token}`; const portal = `${SITE}/partner/`;
    const btn = (href, txt, dark) => `<a href="${esc(href)}" style="background:${dark ? '#0f172a' : '#e2001a'};color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:999px;display:inline-block;margin:0 8px 8px 0">${txt}</a>`;
    const m = await sendCrmMail(env, fwd || to, `${fwd ? '[TESZT — ' + to + '] ' : ''}${T.subjReq(client)}`,
      `<p>${T.hello}</p><p>${T.reqBody(client, when)}</p>${li(mine)}<p>${T.reqAsk}</p><p style="margin:18px 0">${btn(portal, T.btnPortal, true)}${btn(link, T.btnLink)}</p><p>${T.after}</p>
       <p style="color:#6b7280;font-size:12px">${T.valid(new Date(exp * 1000).toLocaleDateString(P.lang === 'de' ? 'de-DE' : 'en-GB', { timeZone: 'Europe/Berlin' }))}</p><p>${T.regards}</p>`,
      att.filter((a) => a.pid === P.id).map(({ filename, content }) => ({ filename, content })), { noCopy: true });
    await addEvent(env, r.deal_id, 'sign', `Ellenjegyzésre kiküldve: ${P.company} (${P.country}, piac: ${r.market || 'HU'}, #${pid}) → ${fwd ? 'TESZT → ' + fwd : to}: ${mine.map((d) => d.name).join('; ')}${m.ok ? '' : ' — AZ E-MAIL NEM MENT KI: ' + m.error}`, 'Rendszer');
  }
}

/** Partner ellenjegyzése után: a mindkét fél által aláírt PDF-ek az ügyfélnek, a partnernek és a sales@ címre; a köztes (csak ügyfél által aláírt) fájlok törlése. */
async function finishCosign(env, r, result, att, name, when, fwd) {
  const parent = r.parent_id ? await env.DB.prepare(`SELECT * FROM crm_sign WHERE id = ?`).bind(r.parent_id).first() : null;
  const P = r.partner_id ? await env.DB.prepare(`SELECT * FROM crm_partners WHERE id = ?`).bind(r.partner_id).first() : null;
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
  const T = pT(P ? P.lang : 'de');
  try {
    if (cEmail) await sendCrmMail(env, fwd || cEmail, `${fwd ? '[TESZT — ' + cEmail + '] ' : ''}Mindkét fél által aláírt dokumentumok — CarAdvance`,
      `<p>Kedves ${esc(client)}!</p><p>A(z) ${esc(r.signer_name)} is aláírta az alábbi dokumentumokat (${esc(when)}):</p>${li}<p>A mindkét fél által aláírt végleges példányokat (PDF, aláírási tanúsítványokkal) csatoltan küldjük — kérjük, őrizze meg őket.</p><p>Üdvözlettel:<br>CarAdvance</p>`, files, { noCopy: true });
  } catch (e) { /* nem kritikus */ }
  try {
    await sendCrmMail(env, fwd || r.email, `${fwd ? '[TESZT — ' + r.email + '] ' : ''}${T.subjDone(client)}`,
      `<p>${T.hello}</p><p>${T.doneBody(client, when)}</p>${li}<p>${T.regards}</p>`, files, { noCopy: true });
  } catch (e) { /* nem kritikus */ }
  try {
    await sendCrmMail(env, sales, `Mindkét fél által aláírva: ${client} — ${result.length} dokumentum`,
      `<p>A(z) <b>${esc(client)}</b> ügyfél és a(z) ${esc(r.signer_name)} (${esc(name)}) is aláírta az alábbi dokumentumokat (${esc(when)}):</p>${li}<p>A végleges PDF-ek csatolva, és az ügyfél adatlapján a feltöltött fájlok között is megtalálhatók.</p><p><a href="${SITE}/belso/ugyfel/?id=${r.deal_id}">Ügyfél adatlap megnyitása</a></p>`, files, { noCopy: true });
  } catch (e) { /* nem kritikus */ }
}
