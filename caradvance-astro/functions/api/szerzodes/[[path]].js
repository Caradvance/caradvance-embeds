/**
 * CarAdvance — online bérleti szerződés, ÜGYFÉL oldali API (Cloudflare Pages Function, D1: env.DB)
 * Az ügyfél a személyes linkjével (/szerzodes/?t=<token>) éri el; bejelentkezés nem kell.
 *
 *   GET  /api/szerzodes/:t                 — a szerződés állapota (adatok, okmánylista, fejezetek, terhelések)
 *   POST /api/szerzodes/:t/adatok          — ügyféladatok mentése (piszkozatként) {ctype, cust}
 *   POST /api/szerzodes/:t/fajl            — okmány feltöltése (nyers törzs; fejlécek: X-Kind, X-Person, X-Name)
 *   POST /api/szerzodes/:t/fajl-torles     — {id}
 *   POST /api/szerzodes/:t/bekuldes        — adatok + okmányok beküldése ellenőrzésre
 *   POST /api/szerzodes/:t/elfogad         — {section, value} fejezet elfogadása
 *   POST /api/szerzodes/:t/kod             — egyszeri aláírási kód e-mailben
 *   POST /api/szerzodes/:t/alairas         — {name, sig (JPEG data URL), code} aláírás
 *   POST /api/szerzodes/:t/fizetes         — {charge_id?} kártyás fizetés indítása (Stripe Checkout) / TESZT szimuláció
 *   POST /api/szerzodes/:t/ellenorzes      — {sid} visszatérés a Stripe-ról
 *   POST /api/szerzodes/:t/kartya          — kártyacsere (Stripe Checkout, setup)
 *   GET  /api/szerzodes/:t/pdf             — aláírt szerződés PDF (aláírás előtt: tervezet)
 *   POST /api/szerzodes/cron               — napi futás (fejléc: X-Cron-Token = env.CRON_TOKEN)
 */
import { ensureTables, rateOk } from '../../../lib/fiok.js';
import {
  ensureRc, rowToContract, normTerms, normCust, sections, missingDocs, missingFields, requiredKinds, listFiles, KIND_HU, STATUS_HU,
  addEvent, MAX_FILE, b64ToBytes, bytesToB64, sha256bytes, sniffMime, issueSignCode, checkSignCode, buildSnapshot, signedPdf, contractPdf,
  draftSnapshot, sendSignedMails, hasCo, CO, personsOf, stripeMode, stripe, ensureStripeCustomer, verifyCheckout, chargeNow, mailFirstPaid, firstAmount, runDue, money, minor,
  sendMailX, notifyTo, btn, hi, esc, linkFor, SITE, today, huDate
} from '../../../lib/szerzodes.js';

const EDITABLE = new Set(['draft', 'sent', 'changes']);

export async function onRequest(context) {
  const { request, env, params } = context;
  const parts = Array.isArray(params.path) ? params.path : String(params.path || '').split('/').filter(Boolean);
  const m = request.method;
  try {
    if (!env.DB) return json({ ok: false, error: 'db_missing' }, 500);
    await ensureTables(env); await ensureRc(env);
    const origin = request.headers.get('origin');
    if (m !== 'GET' && origin && !/^https:\/\/([a-z0-9-]+\.)*(caradvance\.(hu|sk|cz)|caradvance-astro\.pages\.dev)$/.test(origin)) return json({ ok: false, error: 'bad_origin' }, 403);

    if (parts[0] === 'cron' && m === 'POST') {
      const tok = request.headers.get('x-cron-token') || '';
      if (!env.CRON_TOKEN || String(env.CRON_TOKEN).length < 16 || tok !== env.CRON_TOKEN) return json({ ok: false, error: 'forbidden' }, 403);
      return json(await runDue(env));
    }

    const token = parts[0] || '';
    if (!/^[a-f0-9]{40,64}$/.test(token)) return json({ ok: false, error: 'not_found' }, 404);
    const row = await env.DB.prepare(`SELECT * FROM rc_contracts WHERE token = ?`).bind(token).first();
    if (!row || row.status === 'cancelled') return json({ ok: false, error: 'not_found' }, 404);
    const c = rowToContract(row);
    const action = parts[1] || '';
    const ip = request.headers.get('cf-connecting-ip') || '';

    if (!action && m === 'GET') {
      if (!c.opened_at && c.status !== 'draft') {
        await env.DB.prepare(`UPDATE rc_contracts SET opened_at = datetime('now') WHERE id = ?`).bind(c.id).run();
        await addEvent(env, c.id, 'Az ügyfél megnyitotta a linket. IP: ' + ip);
      }
      return json(await state(env, c));
    }
    if (action === 'pdf' && m === 'GET') {
      let pdf; let name;
      if (row.snapshot) { pdf = await signedPdf(env, row); name = `${c.number}-alairt.pdf`; }
      else if (['approved', 'review', 'sent', 'changes'].includes(c.status)) { pdf = contractPdf(draftSnapshot(c), {}); name = `${c.number}-tervezet.pdf`; }
      if (!pdf) return json({ ok: false, error: 'not_found' }, 404);
      return new Response(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${name}"`, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    }

    if (m !== 'POST') return json({ ok: false, error: 'method' }, 405);

    // ---------- okmány feltöltése (nyers törzs) ----------
    if (action === 'fajl') {
      if (!EDITABLE.has(c.status)) return json({ ok: false, error: 'locked' }, 409);
      if (!(await rateOk(env, 'rcf:' + c.id, 120, 3600))) return json({ ok: false, error: 'too_many' }, 429);
      const kind = String(request.headers.get('x-kind') || '');
      let person = parseInt(request.headers.get('x-person') || '0', 10) || 0; if (person !== CO) person = Math.max(0, Math.min(3, person));
      if (!KIND_HU[kind] || kind === 'signature') return json({ ok: false, error: 'bad_kind' }, 400);
      const buf = new Uint8Array(await request.arrayBuffer());
      if (!buf.length) return json({ ok: false, error: 'empty' }, 400);
      if (buf.length > MAX_FILE) return json({ ok: false, error: 'too_big', max: MAX_FILE }, 413);
      const mime = sniffMime(buf);
      if (!mime) return json({ ok: false, error: 'bad_type' }, 415);
      let name = ''; try { name = decodeURIComponent(request.headers.get('x-name') || ''); } catch (e) { }
      name = name.replace(/[^\p{L}\p{N} ._()-]/gu, '').slice(0, 120);
      const sha = await sha256bytes(buf);
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM rc_files WHERE contract_id = ? AND kind = ? AND person = ?`).bind(c.id, kind, person),
        env.DB.prepare(`INSERT INTO rc_files (contract_id, kind, person, mime, size, name, sha, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(c.id, kind, person, mime, buf.length, name, sha, bytesToB64(buf))
      ]);
      return json({ ok: true, files: await listFiles(env, c.id) });
    }

    const body = await readJson(request);
    if (body === null) return json({ ok: false, error: 'bad_json' }, 400);

    if (action === 'fajl-torles') {
      if (!EDITABLE.has(c.status)) return json({ ok: false, error: 'locked' }, 409);
      await env.DB.prepare(`DELETE FROM rc_files WHERE id = ? AND contract_id = ? AND kind != 'signature'`).bind(Number(body.id) || 0, c.id).run();
      return json({ ok: true, files: await listFiles(env, c.id) });
    }

    if (action === 'adatok') {
      if (!EDITABLE.has(c.status)) return json({ ok: false, error: 'locked' }, 409);
      const ctype = ['magan', 'ev', 'ceg'].includes(body.ctype) ? body.ctype : c.ctype;
      const cust = normCust(body.cust, ctype);
      await env.DB.prepare(`UPDATE rc_contracts SET ctype = ?, cust = ?, updated_at = datetime('now') WHERE id = ?`).bind(ctype, JSON.stringify(cust), c.id).run();
      // a már nem szükséges vezetők fájljai törlődnek
      await env.DB.prepare(`DELETE FROM rc_files WHERE contract_id = ? AND person > ? AND person != ?`).bind(c.id, cust.drivers.length, CO).run();
      if (!cust.co) await env.DB.prepare(`DELETE FROM rc_files WHERE contract_id = ? AND person = ?`).bind(c.id, CO).run();
      c.ctype = ctype; c.cust = cust;
      return json(await state(env, c));
    }

    if (action === 'bekuldes') {
      if (!EDITABLE.has(c.status)) return json({ ok: false, error: 'locked' }, 409);
      const files = await listFiles(env, c.id);
      const mf = missingFields(c.ctype, c.cust); const md = missingDocs(c.ctype, c.cust, files);
      if (mf.length || md.length) return json({ ok: false, error: 'incomplete', missing_fields: mf, missing_docs: md }, 422);
      await env.DB.prepare(`UPDATE rc_contracts SET status = 'review', docs_at = datetime('now'), review_note = '', updated_at = datetime('now') WHERE id = ?`).bind(c.id).run();
      await addEvent(env, c.id, `Az ügyfél beküldte az adatait és ${files.length} okmányt. IP: ${ip}`);
      await sendMailX(env, notifyTo(env), `Okmányok ellenőrzésre: ${c.number} – ${c.cust.company_name || c.cust.name || c.name}`,
        `<p>A(z) <b>${esc(c.number)}</b> szerződés ügyfele beküldte az adatait és az okmányait (${files.length} fájl).</p><p>Kérjük, ellenőrizd és hagyd jóvá, vagy kérj javítást.</p>${btn(SITE + '/belso/szerzodesek/#' + c.id, 'Ellenőrzés')}`);
      c.status = 'review';
      return json(await state(env, c));
    }

    if (action === 'elfogad') {
      if (c.status !== 'approved') return json({ ok: false, error: 'locked' }, 409);
      const ids = sections(c).map((s) => s.id);
      if (!ids.includes(body.section)) return json({ ok: false, error: 'bad_section' }, 400);
      const acc = { ...(c.accepted || {}) };
      if (body.value === false) delete acc[body.section]; else acc[body.section] = new Date().toISOString();
      await env.DB.prepare(`UPDATE rc_contracts SET accepted = ? WHERE id = ?`).bind(JSON.stringify(acc), c.id).run();
      return json({ ok: true, accepted: acc });
    }

    if (action === 'kod') {
      if (c.status !== 'approved') return json({ ok: false, error: 'locked' }, 409);
      const ids = sections(c).map((s) => s.id);
      if (ids.some((id) => !c.accepted[id])) return json({ ok: false, error: 'not_all_accepted' }, 422);
      if (!(await rateOk(env, 'rck:' + c.id, 6, 3600))) return json({ ok: false, error: 'too_many' }, 429);
      const withCo = hasCo(c);
      if (withCo && (!c.cust.co.email || c.cust.co.email === c.email)) return json({ ok: false, error: 'co_email' }, 422);
      const { code, code2 } = await issueSignCode(env, c.id, withCo);
      const mailCode = (to, name, cd) => sendMailX(env, to, `Aláírási kód: ${cd}`,
        `<p>Kedves ${esc(name)}!</p><p>A(z) <b>${esc(c.number)}</b> bérleti szerződés aláírásához add meg ezt a kódot:</p><p style="font:bold 34px/1 Courier New,monospace;letter-spacing:6px;margin:18px 0">${cd}</p><p style="color:#5a6b82">A kód 15 percig érvényes. Ha nem te kérted, hagyd figyelmen kívül ezt az e-mailt.<br>Your signing code for rental agreement ${esc(c.number)} (valid for 15 minutes).</p>`);
      const sent = await mailCode(c.email, c.cust.name || c.name, code);
      if (!sent) return json({ ok: false, error: 'mail_not_configured' }, 501);
      if (withCo) await mailCode(c.cust.co.email, c.cust.co.name, code2);
      await addEvent(env, c.id, 'Aláírási kód elküldve: ' + c.email + (withCo ? ' és ' + c.cust.co.email : ''));
      return json({ ok: true, email: c.email, co_email: withCo ? c.cust.co.email : '' });
    }

    if (action === 'alairas') {
      if (c.status !== 'approved') return json({ ok: false, error: 'locked' }, 409);
      const ids = sections(c).map((s) => s.id);
      if (ids.some((id) => !c.accepted[id])) return json({ ok: false, error: 'not_all_accepted' }, 422);
      const name = String(body.name || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      if (name.length < 3) return json({ ok: false, error: 'bad_name' }, 400);
      const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.sig || ''));
      if (!mm || mm[1].length > 400000) return json({ ok: false, error: 'bad_signature' }, 400);
      const sigBytes = b64ToBytes(mm[1]);
      if (sniffMime(sigBytes) !== 'image/jpeg') return json({ ok: false, error: 'bad_signature' }, 400);
      const withCo = hasCo(c); let coSig = null; let coName = '';
      if (withCo) {
        coName = String(body.co_name || '').replace(/\s+/g, ' ').trim().slice(0, 120);
        if (coName.length < 3) return json({ ok: false, error: 'bad_co_name' }, 400);
        const m2 = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.co_sig || ''));
        if (!m2 || m2[1].length > 400000) return json({ ok: false, error: 'bad_co_signature' }, 400);
        coSig = { b64: m2[1], bytes: b64ToBytes(m2[1]) };
        if (sniffMime(coSig.bytes) !== 'image/jpeg') return json({ ok: false, error: 'bad_co_signature' }, 400);
      }
      const chk = await checkSignCode(env, row, body.code, body.code2);
      if (!chk.ok) return json({ ok: false, error: chk.error, left: chk.left }, chk.error === 'too_many' ? 429 : 400);
      const at = new Date().toISOString(); const ua = (request.headers.get('user-agent') || '').slice(0, 300);
      const sigSha = await sha256bytes(sigBytes);
      await env.DB.prepare(`INSERT INTO rc_files (contract_id, kind, person, mime, size, name, sha, data) VALUES (?, 'signature', 0, 'image/jpeg', ?, 'alairas.jpg', ?, ?)`).bind(c.id, sigBytes.length, sigSha, mm[1]).run();
      let co = null;
      if (withCo) {
        const coSha = await sha256bytes(coSig.bytes);
        await env.DB.prepare(`INSERT INTO rc_files (contract_id, kind, person, mime, size, name, sha, data) VALUES (?, 'signature', ?, 'image/jpeg', ?, 'alairas-berlotars.jpg', ?, ?)`).bind(c.id, CO, coSig.bytes.length, coSha, coSig.b64).run();
        co = { name: coName, email: c.cust.co.email, sig_sha: coSha };
      }
      const fresh = await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(c.id).first();
      const { json: snap, hash } = await buildSnapshot(env, fresh, { name, ip, ua, at, sig_sha: sigSha, co });
      await env.DB.prepare(`UPDATE rc_contracts SET status = 'signed', signed_at = datetime('now'), sign_name = ?, co_sign_name = ?, sign_ip = ?, sign_ua = ?, snapshot = ?, snapshot_hash = ?, updated_at = datetime('now') WHERE id = ? AND status = 'approved'`)
        .bind(name, coName || null, ip, ua, snap, hash, c.id).run();
      await addEvent(env, c.id, `Aláírva: ${name} (${c.email}, kóddal igazolva)${co ? ` és ${coName} (${co.email}, kóddal igazolva)` : ''}. IP: ${ip}. SHA-256: ${hash}`);
      const signedRow = await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(c.id).first();
      try { await sendSignedMails(env, signedRow); } catch (e) { await addEvent(env, c.id, 'Az aláírt PDF e-mail most nem ment ki – a napi futás újrapróbálja: ' + e.message); }
      return json(await state(env, rowToContract(signedRow)));
    }

    if (action === 'fizetes') {
      const terms = normTerms(c.terms, c.ctype); const mode = stripeMode(env);
      let ch; let kind;
      if (body.charge_id) {
        ch = await env.DB.prepare(`SELECT * FROM rc_charges WHERE id = ? AND contract_id = ? AND status IN ('retry','failed','pending_checkout','scheduled')`).bind(Number(body.charge_id), c.id).first();
        if (!ch) return json({ ok: false, error: 'not_found' }, 404);
        if (ch.status === 'scheduled' && ch.due_date > today()) return json({ ok: false, error: 'not_due' }, 409);
        kind = ch.kind === 'first' ? 'first' : 'charge';
      } else {
        if (c.status !== 'signed' || terms.billing !== 'card') return json({ ok: false, error: 'locked' }, 409);
        await env.DB.prepare(`INSERT OR IGNORE INTO rc_charges (contract_id, kind, period, title, amount, currency, due_date, status) VALUES (?, 'first', 1, ?, ?, ?, ?, 'scheduled')`)
          .bind(c.id, terms.deposit_upfront ? 'Első havi bérleti díj + kaució' : 'Első havi bérleti díj', firstAmount(terms), terms.currency, today()).run();
        ch = await env.DB.prepare(`SELECT * FROM rc_charges WHERE contract_id = ? AND kind = 'first'`).bind(c.id).first();
        if (ch.status === 'paid') return json(await state(env, c));
        kind = 'first';
      }
      if (mode === 'none') {
        if (!c.test) return json({ ok: false, error: 'stripe_not_configured' }, 501);
        await env.DB.prepare(`UPDATE rc_charges SET status = 'paid', paid_at = datetime('now'), note = 'TESZT: szimulált fizetés' WHERE id = ?`).bind(ch.id).run();
        await addEvent(env, c.id, `TESZT: szimulált kártyás fizetés – ${ch.title} – ${money(ch.amount, ch.currency)}`);
        if (kind === 'first') {
          await env.DB.prepare(`UPDATE rc_contracts SET status = 'active', paid_at = datetime('now'), card_label = 'TESZT •••• 4242' WHERE id = ?`).bind(c.id).run();
          await addEvent(env, c.id, 'Első fizetés teljesítve (TESZT) – a szerződés aktív.');
          await mailFirstPaid(env, c, ch);
        }
        const fresh = rowToContract(await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(c.id).first());
        return json({ ...(await state(env, fresh)), simulated: true });
      }
      await ensureStripeCustomer(env, c);
      const items = [];
      if (kind === 'first') {
        items.push({ price_data: { currency: terms.currency.toLowerCase(), unit_amount: minor(terms.monthly, terms.currency), product_data: { name: `Első havi bérleti díj – ${terms.car || c.number}` } }, quantity: 1 });
        if (terms.deposit_upfront && terms.deposit > 0) items.push({ price_data: { currency: terms.currency.toLowerCase(), unit_amount: minor(terms.deposit, terms.currency), product_data: { name: 'Kaució (a bérlet végén visszajár)' } }, quantity: 1 });
      } else items.push({ price_data: { currency: ch.currency.toLowerCase(), unit_amount: minor(ch.amount, ch.currency), product_data: { name: ch.title } }, quantity: 1 });
      const meta = { contract_id: c.id, contract: c.number, charge_id: ch.id, kind };
      const s = await stripe(env, 'POST', 'checkout/sessions', {
        mode: 'payment', customer: c.stripe_customer, locale: 'hu', payment_method_types: { 0: 'card' },
        line_items: Object.fromEntries(items.map((it, i) => [i, it])),
        payment_intent_data: { setup_future_usage: 'off_session', description: `${c.number} – ${ch.title}`, metadata: meta },
        metadata: meta, client_reference_id: String(c.id),
        success_url: `${SITE}/szerzodes/?t=${c.token}&sid={CHECKOUT_SESSION_ID}`, cancel_url: `${SITE}/szerzodes/?t=${c.token}&megszakitva=1`
      });
      await env.DB.prepare(`UPDATE rc_charges SET status = 'pending_checkout', session = ? WHERE id = ?`).bind(s.id, ch.id).run();
      await addEvent(env, c.id, `Kártyás fizetés indítva: ${ch.title} – ${money(ch.amount, ch.currency)}`);
      return json({ ok: true, url: s.url });
    }

    if (action === 'ellenorzes') {
      if (stripeMode(env) === 'none' || !/^cs_[A-Za-z0-9_]+$/.test(String(body.sid || ''))) return json({ ok: false, error: 'bad_session' }, 400);
      const r = await verifyCheckout(env, c, body.sid);
      const fresh = rowToContract(await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(c.id).first());
      return json({ ...(await state(env, fresh)), verify: r });
    }

    if (action === 'kartya') {
      if (!['signed', 'active'].includes(c.status)) return json({ ok: false, error: 'locked' }, 409);
      if (stripeMode(env) === 'none') return json({ ok: false, error: 'stripe_not_configured' }, 501);
      await ensureStripeCustomer(env, c);
      const meta = { contract_id: c.id, contract: c.number, kind: 'setup' };
      const s = await stripe(env, 'POST', 'checkout/sessions', {
        mode: 'setup', customer: c.stripe_customer, locale: 'hu', payment_method_types: { 0: 'card' }, metadata: meta,
        setup_intent_data: { metadata: meta, description: `${c.number} – kártyacsere` },
        success_url: `${SITE}/szerzodes/?t=${c.token}&sid={CHECKOUT_SESSION_ID}`, cancel_url: `${SITE}/szerzodes/?t=${c.token}&megszakitva=1`
      });
      return json({ ok: true, url: s.url });
    }

    return json({ ok: false, error: 'not_found' }, 404);
  } catch (e) {
    return json({ ok: false, error: 'server_error', detail: String(e && e.message || e).slice(0, 200) }, 500);
  }
}

async function state(env, c) {
  const files = (await listFiles(env, c.id)).filter((f) => f.kind !== 'signature');
  const terms = normTerms(c.terms, c.ctype);
  const persons = personsOf(c.ctype, c.cust).map((p) => ({ person: p, kinds: requiredKinds(c.ctype, c.cust, p) }));
  const showSections = ['approved', 'signed', 'active', 'closed'].includes(c.status);
  const charges = (await env.DB.prepare(`SELECT id, kind, period, title, amount, currency, due_date, status, paid_at, attempts FROM rc_charges WHERE contract_id = ? AND status != 'cancelled' ORDER BY due_date, id`).bind(c.id).all()).results || [];
  return {
    ok: true,
    contract: {
      number: c.number, status: c.status, status_hu: STATUS_HU[c.status] || c.status, ctype: c.ctype, email: c.email, name: c.name, company: c.company,
      phone: c.phone, test: !!c.test, terms, cust: c.cust, review_note: c.review_note || '', accepted: c.accepted || {}, signed_at: c.signed_at,
      sign_name: c.sign_name, co_sign_name: c.co_sign_name, has_co: hasCo(c), card_label: c.card_label || '', handover_date: c.handover_date, end_date: c.end_date, paid_at: c.paid_at,
      snapshot_hash: c.snapshot_hash || '', first_amount: firstAmount(terms)
    },
    files, persons, kinds: KIND_HU,
    missing_fields: EDITABLE.has(c.status) ? missingFields(c.ctype, c.cust) : [],
    missing_docs: EDITABLE.has(c.status) ? missingDocs(c.ctype, c.cust, files) : [],
    sections: showSections ? sections(c) : null,
    charges, stripe: stripeMode(env), can_simulate: stripeMode(env) === 'none' && !!c.test, today: today()
  };
}

async function readJson(request) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  const t = await request.text();
  if (t.length > 600000) return null;
  try { const j = JSON.parse(t || '{}'); return j && typeof j === 'object' ? j : null; } catch (e) { return null; }
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
