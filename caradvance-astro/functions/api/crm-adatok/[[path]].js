// CarAdvance CRM — ügyfél-adatbekérő (nyilvános, bejelentkezés nélkül; oldal: /adatok/#<token>)
// Az ügyfél megadja személyes (ill. céges) adatait, és feltölti a személyi igazolvány és a lakcímkártya másolatát.
// Beküldéskor: az adatok az ügyfél adatlapjára kerülnek, a fájlok a feltöltött fájlok közé, a checklist
// „Igazolvány másolatok” feladata kipipálódik, és a munkatársak értesítést kapnak.
// Biztonság: 256 bites egyszeri token (csak SHA-256 lenyomata tárolva, az URL #-részében utazik), 14 nap, egyszer küldhető be;
// csak JPEG / PNG / WEBP / PDF (tartalom alapján ellenőrizve), fájlonként max. 8 MB, max. 8 fájl; IP-alapú rate limit.
import {
  ensureCrm, json, parseJ, clean, addEvent, sendCrmMail, notifyTo, esc, sha256hex, b64ToBytes, putFile, getCard, saveCard, rateOk, autoTick, SITE
} from '../../../lib/crm.js';

const TOKEN_RE = /^[a-f0-9]{64}$/;
const SEC = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff' };
const J = (o, s) => json(o, s || 200, SEC);
const now = () => Math.floor(Date.now() / 1000);
const FILE_MAX = 8 * 1024 * 1024;
const P_FIELDS = ['name', 'address', 'phone', 'email', 'birth_place', 'birth_date', 'mother_name', 'id_number', 'address_card', 'licence', 'tax', 'bank', 'residence'];
const P_REQ = ['name', 'address', 'phone', 'email', 'birth_place', 'birth_date', 'mother_name', 'id_number', 'address_card'];
const C_FIELDS = ['name', 'address', 'reg', 'tax'];

async function load(env, t) {
  if (!TOKEN_RE.test(String(t || ''))) return { err: J({ ok: false, error: 'bad_link' }, 400) };
  const r = await env.DB.prepare(`SELECT * FROM crm_datareq WHERE token_hash = ?`).bind(await sha256hex('crmdata|' + t)).first();
  if (!r) return { err: J({ ok: false, error: 'not_found' }, 404) };
  if (r.status === 'pending' && r.expires_at < now()) r.status = 'expired';
  return { r };
}
function target(data, role) { return role === 'buyer' ? (data.buyer = data.buyer || {}) : data; }

async function view(env, r) {
  if (r.status !== 'pending') return J({ ok: true, status: r.status });
  if (!r.opened_at) {
    await env.DB.prepare(`UPDATE crm_datareq SET opened_at = datetime('now') WHERE id = ?`).bind(r.id).run();
    await addEvent(env, r.deal_id, 'datareq', `Az ügyfél megnyitotta az adatbekérő oldalt (#${r.id})`, 'Ügyfél');
  }
  const card = await getCard(env, r.deal_id); const T = target(card.data || {}, r.role); const p = T.person || {}; const c = T.company || {};
  // csak az alapadatok előtöltése (a meglévő okmányadatokat nem adjuk vissza)
  return J({ ok: true, status: 'pending', message: r.message || '', kind: T.kind === 'ceg' ? 'ceg' : 'magan',
    prefill: { name: p.name || r.name || '', email: p.email || r.email || '', phone: p.phone || '', address: p.address || '', company: { name: c.name || '', address: c.address || '', reg: c.reg || '', tax: c.tax || '' } } });
}

function sniff(u) { // tartalom alapján
  if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return ['image/jpeg', 'jpg'];
  if (u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47) return ['image/png', 'png'];
  if (u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46) return ['application/pdf', 'pdf'];
  if (u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46 && u[8] === 0x57 && u[9] === 0x45 && u[10] === 0x42 && u[11] === 0x50) return ['image/webp', 'webp'];
  return null;
}
const CAT = { id: 'Szemelyi_igazolvany', addr: 'Lakcimkartya', company: 'Cegkivonat' };

async function submit(env, r, b, ip) {
  if (r.status !== 'pending') return J({ ok: false, error: 'locked' }, 409);
  const kind = b.kind === 'ceg' ? 'ceg' : 'magan';
  const P = {}; for (const k of P_FIELDS) P[k] = clean((b.person || {})[k], k === 'address' || k === 'residence' ? 300 : 160);
  if (P.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(P.birth_date)) return J({ ok: false, error: 'bad_date' }, 400);
  P.email = P.email.toLowerCase();
  const miss = P_REQ.filter((k) => !P[k]);
  const C = {}; for (const k of C_FIELDS) C[k] = clean((b.company || {})[k], k === 'address' ? 300 : 160);
  if (kind === 'ceg') for (const k of C_FIELDS) if (!C[k]) miss.push('company.' + k);
  if (b.consent !== true) miss.push('consent');
  if (miss.length) return J({ ok: false, error: 'missing', fields: miss }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(P.email)) return J({ ok: false, error: 'bad_email', fields: ['email'] }, 400);
  // fájlok
  const files = (Array.isArray(b.files) ? b.files : []).slice(0, 9);
  if (files.length > 8) return J({ ok: false, error: 'too_many_files' }, 400);
  const parsed = [];
  for (const f of files) {
    const cat = CAT[f && f.cat] ? f.cat : null; if (!cat) return J({ ok: false, error: 'bad_file' }, 400);
    const b64 = String((f && f.data) || '').replace(/^data:[^,]+,/, '');
    if (!/^[A-Za-z0-9+/=]+$/.test(b64) || b64.length * 3 / 4 > FILE_MAX) return J({ ok: false, error: 'file_too_big' }, 400);
    const head = b64ToBytes(b64.slice(0, 64)); const t = sniff(head); if (!t) return J({ ok: false, error: 'bad_type' }, 400);
    parsed.push({ cat, b64, mime: t[0], ext: t[1] });
  }
  if (!parsed.some((f) => f.cat === 'id') || !parsed.some((f) => f.cat === 'addr')) return J({ ok: false, error: 'files_missing' }, 400);
  // lefoglalás (egyszeri beküldés)
  const claim = await env.DB.prepare(`UPDATE crm_datareq SET status = 'saving' WHERE id = ? AND status = 'pending'`).bind(r.id).run();
  if (!claim.meta || !claim.meta.changes) return J({ ok: false, error: 'locked' }, 409);
  try {
    const card = await getCard(env, r.deal_id); const data = card.data || {}; const T = target(data, r.role);
    T.kind = kind; T.person = { ...(T.person || {}) }; for (const k of P_FIELDS) if (P[k]) T.person[k] = P[k];
    if (kind === 'ceg') { T.company = { ...(T.company || {}) }; for (const k of C_FIELDS) T.company[k] = C[k]; }
    const fl = { status: undefined, data };
    if (r.role === 'client') fl.address = kind === 'ceg' ? (C.address || P.address) : P.address;
    delete fl.status;
    await saveCard(env, r.deal_id, fl, null, 'Ügyfél');
    const who = (P.name || r.name || 'ugyfel').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40);
    const n = {}; const saved = [];
    for (const f of parsed) {
      n[f.cat] = (n[f.cat] || 0) + 1;
      const name = `${CAT[f.cat]}_${who}_${n[f.cat]}.${f.ext}`;
      const x = await putFile(env, r.deal_id, name, f.mime, f.b64, null);
      saved.push({ id: x.id, name, cat: f.cat });
    }
    await env.DB.prepare(`UPDATE crm_datareq SET status = 'done', submitted_at = datetime('now'), ip = ?, files = ? WHERE id = ?`).bind(ip, JSON.stringify(saved), r.id).run();
    await addEvent(env, r.deal_id, 'datareq', `Az ügyfél kitöltötte az adatait és feltöltött ${saved.length} okmánymásolatot (#${r.id}, IP: ${ip}): ${saved.map((s) => s.name).join(', ')}`, 'Ügyfél');
    const deal = await env.DB.prepare(`SELECT line FROM deals WHERE id = ?`).bind(r.deal_id).first();
    const key = r.role === 'buyer' ? 'e2_igazolvany' : (deal && deal.line === 'Eladás' ? 'e1_igazolvany' : 'igazolvany');
    try { await autoTick(env, r.deal_id, [key], 'az ügyfél beküldte az adatait és az okmánymásolatokat'); } catch (e) { console.error('autotick', e); }
    try {
      await sendCrmMail(env, notifyTo(env), `Ügyféladatok beérkeztek: ${P.name}`,
        `<p><b>${esc(P.name)}</b> kitöltötte az adatbekérő űrlapot és feltöltött ${saved.length} okmánymásolatot:</p><ul>${saved.map((s) => `<li>${esc(s.name)}</li>`).join('')}</ul><p>Az adatok és a fájlok az ügyfél adatlapján vannak; az „Igazolvány másolatok” feladat kipipálva.</p><p><a href="${SITE}/belso/ugyfel/?id=${r.deal_id}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px;display:inline-block">Ügyfél adatlap megnyitása</a></p>`);
    } catch (e) { /* nem kritikus */ }
    return J({ ok: true });
  } catch (e) {
    console.error('crm-adatok submit', e && e.stack || e);
    await env.DB.prepare(`UPDATE crm_datareq SET status = 'pending' WHERE id = ? AND status = 'saving'`).bind(r.id).run();
    return J({ ok: false, error: 'server' }, 500);
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const path = new URL(request.url).pathname.replace(/^\/api\/crm-adatok/, '') || '/';
  if (request.method !== 'POST') return J({ ok: false, error: 'method' }, 405);
  try {
    await ensureCrm(env);
    const ip = clean(request.headers.get('CF-Connecting-IP') || '', 60);
    if (!(await rateOk(env, 'dip:' + ip, 60, 600))) return J({ ok: false, error: 'rate' }, 429);
    const b = await request.json().catch(() => ({}));
    const { r, err } = await load(env, b.t); if (err) return err;
    if (path === '/view') return await view(env, r);
    if (path === '/submit') return await submit(env, r, b, ip);
    return J({ ok: false, error: 'not_found' }, 404);
  } catch (e) {
    console.error('crm-adatok', e && e.stack || e);
    return J({ ok: false, error: 'server' }, 500);
  }
}
