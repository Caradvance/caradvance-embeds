/**
 * CarAdvance — online bérleti szerződés, MUNKATÁRSI API (Cloudflare Pages Function, D1: env.DB)
 * Belépés: a /belso felület munkamenete (ca_session süti). Felület: /belso/szerzodesek/
 *
 *   GET  me | list | c/:id | c/:id/pdf | fajl/:fid
 *   POST uj                      — új szerződés {ctype, email, name, phone, company, deal_id, test, terms}
 *   POST c/:id                   — adatok / feltételek módosítása (aláírás előtt)
 *   POST c/:id/kuldes            — link e-mailben az ügyfélnek
 *   POST c/:id/jovahagy          — okmányok rendben → aláírható
 *   POST c/:id/javitas {note}    — javítást kérünk
 *   POST c/:id/elso-fizetve      — átutalásos első fizetés megérkezett → aktív
 *   POST c/:id/atadas {date}     — átadás napja (ettől indulnak a havi terhelések)
 *   POST c/:id/vege {date}       — a bérlet utolsó napja utáni nap (megszűnés); üres = nincs
 *   POST c/:id/extra {title, amount, due_date} — további terhelés (km-túllépés, bírság, kár…)
 *   POST c/:id/terheles {charge_id, action: most|fizetve|torol}
 *   POST c/:id/kaucio {amount, method: stripe|atutalas}
 *   POST c/:id/lezaras | c/:id/visszavonas
 *   POST futtatas                — esedékes terhelések futtatása most
 */
import { ensureTables, randomHex, normEmail } from '../../../lib/fiok.js';
import {
  ensureRc, rowToContract, normTerms, normCust, listFiles, missingDocs, missingFields, warnings, STATUS_HU, CTYPE_HU, KIND_HU, addEvent,
  contractNumber, linkFor, sendMailX, btn, hi, esc, money, firstAmount, huDate, today, addDays, isDate, stripeMode, stripe, minor,
  chargeNow, runDue, signedPdf, contractPdf, draftSnapshot, b64ToBytes, clean, cleanMulti, sections, TPL_VERSION, mailFirstPaid
} from '../../../lib/szerzodes.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const parts = Array.isArray(params.path) ? params.path : String(params.path || '').split('/').filter(Boolean);
  const m = request.method;
  try {
    if (!env.DB) return json({ error: 'Nincs adatbázis.' }, 500);
    await ensureTables(env); await ensureRc(env);
    const me = await staffUser(request, env);
    if (!me) return json({ error: 'Nincs bejelentkezve.' }, 401);
    if (m === 'POST' && !(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'Hibás kérés.' }, 415);
    const body = m === 'POST' ? await readJson(request) : {};
    if (body === null) return json({ error: 'Hibás adatok.' }, 400);
    const who = me.name || me.email;

    if (parts[0] === 'me' && m === 'GET') {
      return json({ ok: true, user: { id: me.id, name: me.name, email: me.email, role: me.role }, stripe: stripeMode(env), cron: !!env.CRON_TOKEN, mail: !!env.RESEND_API_KEY, notify: env.CONTRACT_NOTIFY_TO || 'info@caradvance.hu', version: TPL_VERSION });
    }
    if (parts[0] === 'list' && m === 'GET') {
      const r = await env.DB.prepare(`SELECT c.id, c.number, c.status, c.ctype, c.email, c.name, c.company, c.terms, c.test, c.created_at, c.updated_at, c.handover_date,
        (SELECT MIN(due_date) FROM rc_charges h WHERE h.contract_id = c.id AND h.status IN ('scheduled','retry')) AS next_due,
        (SELECT COUNT(*) FROM rc_charges h WHERE h.contract_id = c.id AND h.status IN ('retry','failed')) AS problems
        FROM rc_contracts c ORDER BY c.id DESC LIMIT 500`).all();
      return json({ ok: true, items: (r.results || []).map((x) => { const t = JSON.parse(x.terms || '{}'); delete x.terms; return { ...x, car: t.car || '', monthly: t.monthly, currency: t.currency || 'EUR', status_hu: STATUS_HU[x.status] || x.status, ctype_hu: CTYPE_HU[x.ctype] || x.ctype }; }) });
    }
    if (parts[0] === 'futtatas' && m === 'POST') return json(await runDue(env));
    if (parts[0] === 'fajl' && m === 'GET') {
      const f = await env.DB.prepare(`SELECT mime, data, name, kind FROM rc_files WHERE id = ?`).bind(Number(parts[1]) || 0).first();
      if (!f) return json({ error: 'Nem található.' }, 404);
      return new Response(b64ToBytes(f.data), { headers: { 'Content-Type': f.mime, 'Content-Disposition': `inline; filename="${encodeURIComponent(f.name || f.kind)}"`, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (parts[0] === 'uj' && m === 'POST') {
      const email = normEmail(body.email);
      if (!email) return json({ error: 'Hibás e-mail cím.' }, 400);
      const ctype = ['magan', 'ev', 'ceg'].includes(body.ctype) ? body.ctype : 'magan';
      const terms = normTerms(body.terms, ctype);
      const token = randomHex(24);
      const cust = normCust({ name: body.name, phone: body.phone, company_name: body.company }, ctype);
      const r = await env.DB.prepare(`INSERT INTO rc_contracts (token, status, test, ctype, email, name, phone, company, deal_id, terms, cust, created_by) VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(token, body.test === false ? 0 : 1, ctype, email, clean(body.name, 120), clean(body.phone, 40), clean(body.company, 160), Number(body.deal_id) || null, JSON.stringify(terms), JSON.stringify(cust), me.id).run();
      const id = r.meta.last_row_id;
      await env.DB.prepare(`UPDATE rc_contracts SET number = ? WHERE id = ?`).bind(contractNumber(id), id).run();
      await addEvent(env, id, `Létrehozta: ${who}${body.test === false ? '' : ' (TESZT)'}`, who);
      if (body.send) await sendLink(env, id, who);
      return json({ ok: true, id });
    }

    if (parts[0] !== 'c') return json({ error: 'Nem található.' }, 404);
    const id = Number(parts[1]) || 0;
    const row = await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(id).first();
    if (!row) return json({ error: 'Nem található.' }, 404);
    const c = rowToContract(row);
    const act = parts[2] || '';

    if (!act && m === 'GET') return json(await detail(env, c));
    if (act === 'pdf' && m === 'GET') {
      const pdf = row.snapshot ? await signedPdf(env, row) : contractPdf(draftSnapshot(c), {});
      return new Response(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${c.number}${row.snapshot ? '-alairt' : '-tervezet'}.pdf"`, 'Cache-Control': 'private, no-store' } });
    }
    if (m !== 'POST') return json({ error: 'Hibás kérés.' }, 405);

    if (!act) {
      if (!['draft', 'sent', 'changes', 'review', 'approved'].includes(c.status)) return json({ error: 'Aláírás után a szerződés nem módosítható.' }, 409);
      const ctype = ['magan', 'ev', 'ceg'].includes(body.ctype) ? body.ctype : c.ctype;
      const email = body.email != null ? normEmail(body.email) : c.email;
      if (!email) return json({ error: 'Hibás e-mail cím.' }, 400);
      const terms = normTerms({ ...c.terms, ...(body.terms || {}) }, ctype);
      const resetAcc = c.status === 'approved' && JSON.stringify(terms) !== JSON.stringify(normTerms(c.terms, c.ctype));
      await env.DB.prepare(`UPDATE rc_contracts SET ctype = ?, email = ?, name = ?, phone = ?, company = ?, deal_id = ?, test = ?, terms = ?, accepted = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(ctype, email, clean(body.name != null ? body.name : c.name, 120), clean(body.phone != null ? body.phone : c.phone, 40), clean(body.company != null ? body.company : c.company, 160),
          body.deal_id !== undefined ? (Number(body.deal_id) || null) : c.deal_id, body.test === undefined ? c.test : (body.test ? 1 : 0), JSON.stringify(terms), resetAcc ? '{}' : JSON.stringify(c.accepted), id).run();
      await addEvent(env, id, `Módosította: ${who}${resetAcc ? ' (a feltételek változtak – az ügyfél elfogadásai törölve)' : ''}`, who);
      return json(await detail(env, rowToContract(await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(id).first())));
    }
    if (act === 'kuldes') {
      if (!['draft', 'sent', 'changes', 'review', 'approved', 'signed'].includes(c.status)) return json({ error: 'Ebben az állapotban nem küldhető.' }, 409);
      const t = normTerms(c.terms, c.ctype);
      if (!t.car || !(t.monthly > 0)) return json({ error: 'Előbb add meg az autót és a havi díjat.' }, 400);
      const ok = await sendLink(env, id, who);
      if (!ok) return json({ error: 'Az e-mail nem ment ki (RESEND_API_KEY?).' }, 502);
    }
    else if (act === 'jovahagy') {
      if (c.status !== 'review') return json({ error: 'Csak beküldött okmányok hagyhatók jóvá.' }, 409);
      await env.DB.prepare(`UPDATE rc_contracts SET status = 'approved', approved_at = datetime('now'), approved_by = ?, review_note = '', accepted = '{}' WHERE id = ?`).bind(who, id).run();
      await addEvent(env, id, `Okmányok jóváhagyva: ${who}`, who);
      await sendMailX(env, c.email, `Okmányaid rendben – aláírhatod a szerződést (${c.number})`,
        `${hi(c)}<p>Ellenőriztük az adataidat és az okmányaidat, minden rendben van.</p><p>Most olvasd el a bérleti szerződést, fogadd el a fejezeteit, és írd alá. Az aláírás után következik a kártyás fizetés.</p>${btn(linkFor(c), 'Szerződés aláírása')}`);
    }
    else if (act === 'javitas') {
      if (!['review', 'approved'].includes(c.status)) return json({ error: 'Ebben az állapotban nem kérhető javítás.' }, 409);
      const note = cleanMulti(body.note, 1000);
      if (!note) return json({ error: 'Írd le, mit kell javítani.' }, 400);
      await env.DB.prepare(`UPDATE rc_contracts SET status = 'changes', review_note = ?, accepted = '{}' WHERE id = ?`).bind(note, id).run();
      await addEvent(env, id, `Javítás kérve (${who}): ${note}`, who);
      await sendMailX(env, c.email, `Kérjük, javítsd az adataidat – ${c.number}`,
        `${hi(c)}<p>Átnéztük a beküldött adatokat és okmányokat. A következőt kérjük javítani vagy pótolni:</p><p style="background:#fef3c7;border-radius:10px;padding:12px 14px">${esc(note).replace(/\n/g, '<br>')}</p>${btn(linkFor(c), 'Adatok javítása')}`);
    }
    else if (act === 'elso-fizetve') {
      if (c.status !== 'signed') return json({ error: 'Csak aláírt, fizetésre váró szerződésnél.' }, 409);
      const t = normTerms(c.terms, c.ctype);
      await env.DB.prepare(`INSERT OR IGNORE INTO rc_charges (contract_id, kind, period, title, amount, currency, due_date, status) VALUES (?, 'first', 1, ?, ?, ?, ?, 'scheduled')`)
        .bind(id, t.deposit_upfront ? 'Első havi bérleti díj + kaució' : 'Első havi bérleti díj', firstAmount(t), t.currency, today()).run();
      const ch = await env.DB.prepare(`SELECT * FROM rc_charges WHERE contract_id = ? AND kind = 'first'`).bind(id).first();
      await env.DB.prepare(`UPDATE rc_charges SET status = 'paid', paid_at = datetime('now'), note = ? WHERE id = ?`).bind('Kézzel rögzítve: ' + who, ch.id).run();
      await env.DB.prepare(`UPDATE rc_contracts SET status = 'active', paid_at = datetime('now') WHERE id = ?`).bind(id).run();
      await addEvent(env, id, `Első fizetés rögzítve (átutalás): ${who}`, who);
      await mailFirstPaid(env, c, ch);
    }
    else if (act === 'atadas') {
      if (!['signed', 'active'].includes(c.status)) return json({ error: 'Csak aláírt szerződésnél.' }, 409);
      if (!isDate(body.date)) return json({ error: 'Hibás dátum.' }, 400);
      const paidRent = await env.DB.prepare(`SELECT COUNT(*) AS n FROM rc_charges WHERE contract_id = ? AND kind = 'rent' AND status = 'paid'`).bind(id).first();
      if (c.handover_date && paidRent.n) return json({ error: 'Már volt havi terhelés – az átadás napja nem módosítható.' }, 409);
      await env.DB.prepare(`DELETE FROM rc_charges WHERE contract_id = ? AND kind = 'rent' AND status = 'scheduled'`).bind(id).run();
      await env.DB.prepare(`UPDATE rc_contracts SET handover_date = ? WHERE id = ?`).bind(body.date, id).run();
      await addEvent(env, id, `Átadás napja: ${huDate(body.date)} (${who})`, who);
    }
    else if (act === 'vege') {
      if (body.date && !isDate(body.date)) return json({ error: 'Hibás dátum.' }, 400);
      await env.DB.prepare(`UPDATE rc_contracts SET end_date = ? WHERE id = ?`).bind(body.date || null, id).run();
      if (body.date) await env.DB.prepare(`UPDATE rc_charges SET status = 'cancelled', note = 'A szerződés megszűnése miatt' WHERE contract_id = ? AND kind = 'rent' AND status = 'scheduled' AND due_date >= ?`).bind(id, body.date).run();
      await addEvent(env, id, body.date ? `Megszűnés napja: ${huDate(body.date)} (${who})` : `Megszűnés napja törölve (${who})`, who);
    }
    else if (act === 'extra') {
      if (!['active', 'closed'].includes(c.status)) return json({ error: 'Csak aktív (vagy lezárt) szerződésnél.' }, 409);
      const t = normTerms(c.terms, c.ctype);
      const title = clean(body.title, 160); const amount = Number(String(body.amount).replace(',', '.'));
      if (!title || !(amount > 0)) return json({ error: 'Add meg a megnevezést és az összeget.' }, 400);
      const due = isDate(body.due_date) && body.due_date >= addDays(today(), 3) ? body.due_date : addDays(today(), 3);
      await env.DB.prepare(`INSERT INTO rc_charges (contract_id, kind, period, title, amount, currency, due_date, status, notice_at) VALUES (?, 'extra', 0, ?, ?, ?, ?, 'scheduled', datetime('now'))`).bind(id, title, amount, t.currency, due).run();
      await addEvent(env, id, `További terhelés felvéve: ${title} – ${money(amount, t.currency)}, esedékes: ${huDate(due)} (${who})`, who);
      await sendMailX(env, c.email, `Értesítés terhelésről – ${title}`,
        `${hi(c)}<p>A bérleti szerződésed (${esc(c.number)}) alapján az alábbi tételt számoljuk el:</p><p style="font-size:18px"><b>${esc(money(amount, t.currency))}</b><br><span style="color:#5a6b82">${esc(title)}</span></p><p>${t.billing === 'card' ? `Az összeget <b>${esc(huDate(due))}</b> napján terheljük a mentett kártyádról.` : 'A számlát külön küldjük.'} Ha kérdésed van, válaszolj erre az e-mailre.</p>${btn(linkFor(c), 'Szerződésem')}`);
    }
    else if (act === 'terheles') {
      const ch = await env.DB.prepare(`SELECT * FROM rc_charges WHERE id = ? AND contract_id = ?`).bind(Number(body.charge_id) || 0, id).first();
      if (!ch) return json({ error: 'Nem található.' }, 404);
      if (body.action === 'most') {
        const r = await chargeNow(env, c, ch);
        if (!r.ok) return json({ error: 'A terhelés nem sikerült: ' + r.error, detail: await detail(env, c) }, 402);
      } else if (body.action === 'fizetve') {
        await env.DB.prepare(`UPDATE rc_charges SET status = 'paid', paid_at = datetime('now'), note = ? WHERE id = ?`).bind('Kézzel rögzítve: ' + who, ch.id).run();
        await addEvent(env, id, `Fizetettnek jelölve: ${ch.title} (${who})`, who);
      } else if (body.action === 'torol') {
        if (ch.status === 'paid') return json({ error: 'Fizetett tétel nem törölhető.' }, 409);
        await env.DB.prepare(`UPDATE rc_charges SET status = 'cancelled', note = ? WHERE id = ?`).bind('Törölte: ' + who, ch.id).run();
        await addEvent(env, id, `Terhelés törölve: ${ch.title} (${who})`, who);
      } else return json({ error: 'Hibás művelet.' }, 400);
    }
    else if (act === 'kaucio') {
      const t = normTerms(c.terms, c.ctype);
      const amount = Number(String(body.amount).replace(',', '.'));
      if (!(amount >= 0)) return json({ error: 'Hibás összeg.' }, 400);
      if (body.method === 'stripe') {
        if (!c.first_pi || stripeMode(env) === 'none') return json({ error: 'Kártyás visszatérítés nem lehetséges (nincs Stripe-fizetés). Utald át, és válaszd az „átutalással” lehetőséget.' }, 409);
        if (amount > 0) {
          try { await stripe(env, 'POST', 'refunds', { payment_intent: c.first_pi, amount: minor(amount, t.currency), metadata: { contract: c.number, reason: 'kaucio' } }, 'ca-dep-' + id + '-' + minor(amount, t.currency)); }
          catch (e) { return json({ error: 'A Stripe visszatérítés nem sikerült: ' + e.message + ' – utald át, és válaszd az „átutalással” lehetőséget.' }, 402); }
        }
      }
      await env.DB.prepare(`UPDATE rc_contracts SET deposit_refunded_at = datetime('now'), deposit_refund = ?, deposit_refund_method = ? WHERE id = ?`).bind(amount, body.method === 'stripe' ? 'kártyára' : 'átutalással', id).run();
      await addEvent(env, id, `Kaució visszafizetve: ${money(amount, t.currency)} ${body.method === 'stripe' ? 'kártyára' : 'átutalással'} (${who})`, who);
      await sendMailX(env, c.email, `Kaució visszafizetése – ${c.number}`,
        `${hi(c)}<p>A kaució elszámolása megtörtént. Visszafizetett összeg: <b>${esc(money(amount, t.currency))}</b> (${body.method === 'stripe' ? 'a kártyádra, a bankodtól függően 5–10 munkanap alatt jelenik meg' : 'átutalással'}).</p>${amount < t.deposit ? `<p>A levont tételekről (${esc(money(t.deposit - amount, t.currency))}) külön tájékoztatunk.</p>` : ''}<p>Köszönjük, hogy a CarAdvance-t választottad!</p>`);
    }
    else if (act === 'lezaras') {
      await env.DB.prepare(`UPDATE rc_contracts SET status = 'closed', closed_at = datetime('now') WHERE id = ?`).bind(id).run();
      await env.DB.prepare(`UPDATE rc_charges SET status = 'cancelled', note = 'Lezárás' WHERE contract_id = ? AND status = 'scheduled' AND kind = 'rent'`).bind(id).run();
      await addEvent(env, id, `Lezárva (${who}). Az okmánymásolatok 30 nap múlva automatikusan törlődnek.`, who);
    }
    else if (act === 'visszavonas') {
      if (['active', 'closed'].includes(c.status)) return json({ error: 'Aktív szerződést lezárni kell, nem visszavonni.' }, 409);
      await env.DB.prepare(`UPDATE rc_contracts SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?`).bind(id).run();
      await addEvent(env, id, `Visszavonva (${who}). A link nem működik tovább; az okmányok 30 nap múlva törlődnek.`, who);
    }
    else return json({ error: 'Nem található.' }, 404);

    return json(await detail(env, rowToContract(await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(id).first())));
  } catch (e) {
    return json({ error: 'Szerverhiba: ' + String(e && e.message || e).slice(0, 200) }, 500);
  }
}

async function sendLink(env, id, who) {
  const c = rowToContract(await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(id).first());
  const t = normTerms(c.terms, c.ctype);
  const ok = await sendMailX(env, c.email, `Bérleti szerződésed – ${t.car || c.number}${c.test ? ' (TESZT)' : ''}`,
    `${hi(c)}<p>Elkészítettük a bérleti szerződésedet: <b>${esc(t.car)}</b>, havi <b>${esc(money(t.monthly, t.currency))}</b>.</p>
     <p>Az online szerződéskötés lépései:</p>
     <ol style="padding-left:20px;margin:0 0 6px"><li>Adataid és okmányaid feltöltése (személyi igazolvány vagy útlevél, jogosítvány${c.ctype === 'ceg' ? ', cégiratok' : ''})</li><li>Kollégánk ellenőrzi őket</li><li>A szerződés elolvasása, elfogadása és aláírása</li><li>Első fizetés bankkártyával</li></ol>
     ${btn(linkFor(c), 'Szerződés megnyitása')}<p style="color:#5a6b82;font-size:13px">Ez a link személyes, ne továbbítsd.</p>`);
  if (!ok) return false;
  await env.DB.prepare(`UPDATE rc_contracts SET status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END, sent_at = datetime('now') WHERE id = ?`).bind(id).run();
  await addEvent(env, id, `Link elküldve: ${c.email} (${who})`, who);
  return true;
}

async function detail(env, c) {
  const files = await listFiles(env, c.id);
  const charges = (await env.DB.prepare(`SELECT * FROM rc_charges WHERE contract_id = ? ORDER BY due_date, id`).bind(c.id).all()).results || [];
  const { token, code_hash, code_exp, snapshot, ...rest } = c;
  return {
    ok: true, contract: { ...rest, terms: normTerms(c.terms, c.ctype), status_hu: STATUS_HU[c.status] || c.status, link: linkFor(c), first_amount: firstAmount(normTerms(c.terms, c.ctype)) },
    files, kinds: KIND_HU, charges, warnings: warnings(c),
    missing_fields: missingFields(c.ctype, c.cust), missing_docs: missingDocs(c.ctype, c.cust, files.filter((f) => f.kind !== 'signature')),
    section_titles: sections(c).map((s) => ({ id: s.id, title: s.title })), stripe: stripeMode(env)
  };
}

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
  if (t.length > 100000) return null;
  try { const j = JSON.parse(t || '{}'); return j && typeof j === 'object' ? j : null; } catch (e) { return null; }
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
