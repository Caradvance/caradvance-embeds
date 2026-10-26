/**
 * CarAdvance — online bérleti szerződés (közös segédek, D1: env.DB).
 *
 * Folyamat: munkatárs létrehozza (/belso/szerzodesek/) → ügyfél linket kap (/szerzodes/?t=…)
 *   → adatok + okmányok feltöltése → munkatárs ellenőrzi/jóváhagyja → ügyfél elolvassa, fejezetenként
 *   elfogadja, aláírja (rajzolt aláírás + név + e-mailes kód) → kártyás fizetés (Stripe Checkout:
 *   1. havi díj + kaució, kártya mentése) → havi automatikus terhelés (napi ütemezett futás).
 *
 * Környezeti változók (Cloudflare Pages → Settings → Variables and Secrets):
 *   STRIPE_SECRET_KEY   — sk_test_… (teszt) vagy sk_live_… (éles)            (TITKOS) — nélküle csak TESZT-szerződés fizethető (szimulált)
 *   CRON_TOKEN          — a napi futtatás (GitHub Actions) kulcsa                (TITKOS)
 *   CONTRACT_NOTIFY_TO  — munkatársi értesítések címe (alapértelmezés: info@caradvance.hu)
 *   RESEND_API_KEY, CUSTOMER_EMAIL_FROM, CUSTOMER_REPLY_TO — a meglévő ügyfélfiókos e-mail beállítások
 *
 * A fájlok (okmányfotók, aláírás) base64 szövegként a D1-ben vannak (rc_files), mert R2 nincs.
 * Egy fájl legfeljebb 1,4 MB (a böngésző a fotókat előtte tömöríti és vízjelezi).
 */
import { sha256hex, randomHex, randomCode, emailShell } from './fiok.js';
import { FONTS } from './szerzodes-font.js';
import { buildSections, LESSOR } from './szerzodes-tpl.js';
export { LESSOR };

export const TPL_VERSION = 'HU-2026-10-v1';
export const SITE = 'https://www.caradvance.hu';
export const MAX_FILE = 1400 * 1024;

/* ============================== táblák ============================== */
let READY = false;
export async function ensureRc(env) {
  if (READY || !env.DB) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT DEFAULT '', token TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
      test INTEGER DEFAULT 1, ctype TEXT DEFAULT 'magan', email TEXT NOT NULL, name TEXT DEFAULT '', phone TEXT DEFAULT '', company TEXT DEFAULT '',
      deal_id INTEGER, terms TEXT DEFAULT '{}', cust TEXT DEFAULT '{}', accepted TEXT DEFAULT '{}', events TEXT DEFAULT '[]',
      review_note TEXT DEFAULT '', code_hash TEXT, co_code_hash TEXT, code_exp INTEGER, code_attempts INTEGER DEFAULT 0,
      snapshot TEXT, snapshot_hash TEXT, sign_name TEXT, co_sign_name TEXT, sign_ip TEXT, sign_ua TEXT,
      stripe_customer TEXT, stripe_pm TEXT, card_label TEXT, first_pi TEXT,
      handover_date TEXT, end_date TEXT, deposit_refund REAL, deposit_refund_method TEXT,
      created_by INTEGER, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      sent_at TEXT, opened_at TEXT, docs_at TEXT, approved_at TEXT, approved_by TEXT, signed_at TEXT, signed_mail_at TEXT, paid_at TEXT,
      deposit_refunded_at TEXT, closed_at TEXT, cancelled_at TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT, contract_id INTEGER NOT NULL, kind TEXT NOT NULL, person INTEGER DEFAULT 0,
      mime TEXT NOT NULL, size INTEGER NOT NULL, name TEXT DEFAULT '', sha TEXT DEFAULT '', data TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_rc_files_c ON rc_files (contract_id)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT, contract_id INTEGER NOT NULL, kind TEXT NOT NULL, period INTEGER DEFAULT 0, title TEXT DEFAULT '',
      amount REAL NOT NULL, currency TEXT NOT NULL, due_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled',
      attempts INTEGER DEFAULT 0, next_try TEXT, last_error TEXT, notice_at TEXT, pi TEXT, session TEXT, paid_at TEXT, note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')))`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_rc_charges_c ON rc_charges (contract_id)`),
    env.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS ux_rc_charges_rent ON rc_charges (contract_id, kind, period) WHERE kind IN ('first','rent')`)
  ]);
  READY = true;
}

/* ============================== alapok ============================== */
export const STATUS_HU = {
  draft: 'Piszkozat', sent: 'Elküldve – okmányokra vár', changes: 'Javítást kértünk', review: 'Okmányok ellenőrzése',
  approved: 'Jóváhagyva – aláírásra vár', signed: 'Aláírva – fizetésre vár', active: 'Aktív bérlés', closed: 'Lezárva', cancelled: 'Visszavonva'
};
export const CTYPE_HU = { magan: 'Magánszemély', ev: 'Egyéni vállalkozó', ceg: 'Cég' };

export function parseJ(s, d) { try { const v = JSON.parse(s || ''); return v == null ? d : v; } catch (e) { return d; } }
export function nowIso() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
export function today() { return new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10); } // magyar idő (közelítőleg)
export function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200); }
export function cleanMulti(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f\u007f<>]/g, ' ').trim().slice(0, max || 2000); }
export function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
export function addDays(d, n) { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
/** n hónappal később, a hónap végére igazítva (jan. 31. + 1 hó = febr. 28/29.) */
export function addMonths(d, n) {
  const [y, m, day] = d.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(day, last));
  return t.toISOString().slice(0, 10);
}
export function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
export function huDate(d) { if (!d) return '—'; const s = String(d).slice(0, 10); const [y, m, dd] = s.split('-'); return `${y}. ${m}. ${dd}.`; }
export function huDateTime(s) { if (!s) return '—'; const d = new Date(String(s).replace(' ', 'T') + (String(s).includes('Z') ? '' : 'Z')); return d.toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' }); }
export function money(v, cur) {
  const n = Number(v) || 0;
  const neg = n < 0; const a = Math.abs(n);
  const dec = cur === 'HUF' ? 0 : (Math.round(a * 100) % 100 ? 2 : 0);
  let s = a.toFixed(dec).replace('.', ',');
  const [i, f] = s.split(',');
  s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (f ? ',' + f : '');
  return (neg ? '−' : '') + s + (cur === 'HUF' ? ' Ft' : ' €');
}
export function minor(amount, cur) { return cur === 'HUF' ? Math.round(Number(amount)) * 100 : Math.round(Number(amount) * 100); }
export function contractNumber(id) { const t = new Date(Date.now() + 2 * 3600e3).toISOString(); return `CA-${t.slice(0, 4)}-${t.slice(5, 7)}${t.slice(8, 10)}-${String(id).padStart(3, '0')}`; }

export function rowToContract(r) {
  if (!r) return null;
  return { ...r, terms: parseJ(r.terms, {}), cust: parseJ(r.cust, {}), accepted: parseJ(r.accepted, {}), events: parseJ(r.events, []) };
}
export async function addEvent(env, id, text, by) {
  const r = await env.DB.prepare(`SELECT events FROM rc_contracts WHERE id = ?`).bind(id).first();
  const ev = parseJ(r && r.events, []);
  ev.push({ t: new Date().toISOString(), e: String(text).slice(0, 300), by: by || '' });
  await env.DB.prepare(`UPDATE rc_contracts SET events = ?, updated_at = datetime('now') WHERE id = ?`).bind(JSON.stringify(ev.slice(-300)), id).run();
}

/* ============================== feltételek (munkatárs tölti ki) ============================== */
export const TERM_DEFAULTS = {
  car: '', spec: '', fuel_power: '', first_reg: '', body: '', owner: 'Caradvance GmbH', plate: '', vin: '', handover_planned: '', handover_place: '', delivery_deadline: '', min_months: 6, currency: 'EUR', monthly: 0, vat: 'gross',
  deposit: 0, deposit_upfront: true, km_month: 2000, km_fee: 0.85, billing: 'card', notes: ''
};
export function normTerms(t, ctype) {
  const o = { ...TERM_DEFAULTS, ...(t || {}) };
  const num = (v, min, max) => { const n = Number(String(v).replace(',', '.').replace(/[^\d.\-]/g, '')); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
  return {
    car: clean(o.car, 160), spec: clean(o.spec, 200), fuel_power: clean(o.fuel_power, 120), first_reg: clean(o.first_reg, 40), body: clean(o.body, 120), owner: clean(o.owner, 120) || 'Caradvance GmbH',
    plate: clean(o.plate, 20).toUpperCase(), vin: clean(o.vin, 20).toUpperCase(),
    handover_planned: isDate(o.handover_planned) ? o.handover_planned : '', handover_place: clean(o.handover_place, 160), delivery_deadline: isDate(o.delivery_deadline) ? o.delivery_deadline : '',
    min_months: Math.round(num(o.min_months, 1, 60)), currency: o.currency === 'HUF' ? 'HUF' : 'EUR',
    monthly: num(o.monthly, 0, 1e9), vat: o.vat === 'net' ? 'net' : 'gross',
    deposit: num(o.deposit, 0, 1e9), deposit_upfront: o.deposit_upfront !== false && o.deposit_upfront !== 'false' && o.deposit_upfront !== 0,
    km_month: Math.round(num(o.km_month, 0, 100000)), km_fee: num(o.km_fee, 0, 1e6),
    billing: o.billing === 'transfer' ? 'transfer' : 'card', notes: cleanMulti(o.notes, 3000)
  };
}
export function firstAmount(t) { return (Number(t.monthly) || 0) + (t.deposit_upfront ? Number(t.deposit) || 0 : 0); }

/* ============================== kötelező okmányok ============================== */
export const KIND_HU = {
  id_front: 'Személyi igazolvány – elülső oldal', id_back: 'Személyi igazolvány – hátoldal', passport: 'Útlevél – fényképes oldal',
  licence_front: 'Jogosítvány – elülső oldal', licence_back: 'Jogosítvány – hátoldal', address_front: 'Lakcímkártya – elülső oldal (nem kötelező)',
  specimen: 'Aláírási címpéldány / aláírás-minta', poa: 'Meghatalmazás', extract: 'Cégkivonat (nem kötelező)', signature: 'Aláírás'
};
/** Mely okmányok kellenek személyenként. person 0 = bérlő / aláíró, 1..3 = további vezetők. */
export const CO = 9; // a Bérlőtárs (házastárs) személy-indexe
export function personsOf(ctype, cust) { const c = cust || {}; const ps = [0]; if (ctype !== 'ceg' && c.co && c.co.name !== undefined) ps.push(CO); (c.drivers || []).forEach((_, i) => ps.push(i + 1)); return ps; }
export function requiredKinds(ctype, cust, person) {
  const c = cust || {};
  const p = person === 0 ? c : person === CO ? (c.co || {}) : ((c.drivers || [])[person - 1] || {});
  const idk = p.id_type === 'passport' ? ['passport'] : ['id_front', 'id_back'];
  if (person > 0) return [...idk, 'licence_front', 'licence_back'];
  if (ctype === 'ceg') {
    const k = [...idk, 'specimen'];
    if (c.signer_is_director === false || c.signer_is_director === 'false') k.push('poa');
    if (c.signer_drives) k.push('licence_front', 'licence_back');
    return k;
  }
  return [...idk, 'licence_front', 'licence_back'];
}
export function missingDocs(ctype, cust, files) {
  const have = new Set(files.map((f) => f.kind + ':' + f.person));
  const miss = [];
  const persons = personsOf(ctype, cust);
  for (const p of persons) for (const k of requiredKinds(ctype, cust, p)) if (!have.has(k + ':' + p)) miss.push({ kind: k, person: p });
  return miss;
}
export function missingFields(ctype, c) {
  const need = ['name', 'birth_date', 'address', 'phone', 'id_number'];
  if (ctype !== 'ceg' || c.signer_drives) need.push('licence_number', 'licence_since');
  if (ctype === 'ev') need.push('ev_number', 'tax_number');
  if (ctype === 'ceg') need.push('company_name', 'reg_number', 'tax_number', 'seat', 'signer_role');
  const miss = need.filter((k) => !String(c[k] || '').trim());
  (c.drivers || []).forEach((d, i) => { for (const k of ['name', 'birth_date', 'id_number', 'licence_number', 'licence_since']) if (!String(d[k] || '').trim()) miss.push('drivers.' + i + '.' + k); });
  if (ctype !== 'ceg' && c.co) { for (const k of ['name', 'birth_date', 'address', 'id_number', 'licence_number', 'licence_since', 'email']) if (!String(c.co[k] || '').trim()) miss.push('co.' + k); }
  if (ctype === 'ceg' && !c.signer_drives && !(c.drivers || []).length) miss.push('drivers');
  return miss;
}
export function normCust(c, ctype) {
  c = c || {};
  const s = (v, n) => clean(v, n || 120);
  const d = (v) => (isDate(v) ? v : '');
  const o = {
    name: s(c.name), birth_date: d(c.birth_date), birth_place: s(c.birth_place, 80), mother_name: s(c.mother_name),
    address: s(c.address, 200), phone: s(c.phone, 40), id_type: c.id_type === 'passport' ? 'passport' : 'id', id_number: s(c.id_number, 30), address_card_number: s(c.address_card_number, 30),
    licence_number: s(c.licence_number, 30), licence_since: s(c.licence_since, 4).replace(/\D/g, ''), licence_expiry: d(c.licence_expiry),
    ev_number: s(c.ev_number, 30), tax_number: s(c.tax_number, 30), company_name: s(c.company_name, 160), reg_number: s(c.reg_number, 30),
    seat: s(c.seat, 200), signer_role: s(c.signer_role, 80), signer_is_director: !(c.signer_is_director === false || c.signer_is_director === 'false'),
    signer_drives: !!c.signer_drives && c.signer_drives !== 'false', billing_address: s(c.billing_address, 200)
  };
  if (ctype !== 'ceg') o.signer_drives = true;
  if (ctype !== 'ceg' && c.co && typeof c.co === 'object') {
    const x = c.co; const em = String(x.email || '').trim().toLowerCase();
    o.co = { name: s(x.name), birth_date: d(x.birth_date), birth_place: s(x.birth_place, 80), address: s(x.address, 200), id_type: x.id_type === 'passport' ? 'passport' : 'id', id_number: s(x.id_number, 30),
      address_card_number: s(x.address_card_number, 30), licence_number: s(x.licence_number, 30), licence_since: s(x.licence_since, 4).replace(/\D/g, ''), email: /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/.test(em) ? em : s(x.email, 120), phone: s(x.phone, 40) };
  }
  o.drivers = (Array.isArray(c.drivers) ? c.drivers : []).slice(0, 3).map((x) => ({
    name: s(x.name), birth_date: d(x.birth_date), id_type: x.id_type === 'passport' ? 'passport' : 'id', id_number: s(x.id_number, 30),
    licence_number: s(x.licence_number, 30), licence_since: s(x.licence_since, 4).replace(/\D/g, '')
  }));
  return o;
}
export function ageOn(birth, on) { if (!isDate(birth)) return null; const [y, m, d] = birth.split('-').map(Number); const [Y, M, D] = on.split('-').map(Number); return Y - y - ((M < m || (M === m && D < d)) ? 1 : 0); }
/** Figyelmeztetések a munkatársnak (25 év, 3 év jogosítvány, lejárt jogosítvány). */
export function warnings(contract) {
  const c = contract.cust || {}; const t = today(); const w = [];
  const chk = (who, p) => {
    const a = ageOn(p.birth_date, t); if (a != null && a < 25) w.push(`${who}: ${a} éves (a feltétel legalább 25 év).`);
    const ls = Number(p.licence_since); if (ls && Number(t.slice(0, 4)) - ls < 3) w.push(`${who}: jogosítvány ${ls} óta (a feltétel legalább 3 év).`);
    if (p.licence_expiry && p.licence_expiry < t) w.push(`${who}: a jogosítvány lejárt (${huDate(p.licence_expiry)}).`);
  };
  if (contract.ctype !== 'ceg' || c.signer_drives) chk(c.name || 'Bérlő', c);
  if (contract.ctype !== 'ceg' && c.co) chk((c.co.name || 'Bérlőtárs') + ' (bérlőtárs)', c.co);
  (c.drivers || []).forEach((d, i) => chk(d.name || `${i + 1}. vezető`, d));
  if (contract.ctype !== 'ceg' && c.co && c.co.email && c.co.email === contract.email) w.push('A bérlőtárs e-mail címe megegyezik a bérlőével – az aláírási kódhoz külön cím kell.');
  return w;
}

/* ============================== a szerződés szövege ============================== */
/** A szerződés elfogadandó egységei (magyar + angol). Ugyanezt látja az ügyfél, és ebből készül a PDF. */
export function sections(contract) { return buildSections(contract, normTerms(contract.terms, contract.ctype)); }
export function hasCo(c) { return c.ctype !== 'ceg' && !!(c.cust && c.cust.co && c.cust.co.name); }

/* ============================== aláírási kód ============================== */
export async function issueSignCode(env, id, withCo) {
  const code = randomCode(); const code2 = withCo ? randomCode() : null;
  await env.DB.prepare(`UPDATE rc_contracts SET code_hash = ?, co_code_hash = ?, code_exp = ?, code_attempts = 0 WHERE id = ?`)
    .bind(await sha256hex('rc|' + id + '|' + code), code2 ? await sha256hex('rc2|' + id + '|' + code2) : null, Math.floor(Date.now() / 1000) + 15 * 60, id).run();
  return { code, code2 };
}
export async function checkSignCode(env, row, code, code2) {
  if (!row.code_hash || !row.code_exp || row.code_exp < Date.now() / 1000) return { ok: false, error: 'code_expired' };
  if ((row.code_attempts || 0) >= 5) return { ok: false, error: 'too_many' };
  const ok1 = (await sha256hex('rc|' + row.id + '|' + String(code || '').replace(/\D/g, ''))) === row.code_hash;
  const ok2 = !row.co_code_hash || (await sha256hex('rc2|' + row.id + '|' + String(code2 || '').replace(/\D/g, ''))) === row.co_code_hash;
  if (!ok1 || !ok2) { await env.DB.prepare(`UPDATE rc_contracts SET code_attempts = code_attempts + 1 WHERE id = ?`).bind(row.id).run(); return { ok: false, error: !ok1 ? 'wrong_code' : 'wrong_code2', left: 4 - (row.code_attempts || 0) }; }
  await env.DB.prepare(`UPDATE rc_contracts SET code_hash = NULL, co_code_hash = NULL, code_exp = NULL WHERE id = ?`).bind(row.id).run();
  return { ok: true };
}

/* ============================== fájlok ============================== */
export function b64ToBytes(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
export function bytesToB64(u) { let s = ''; const CH = 0x8000; for (let i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); }
export async function sha256bytes(u) { const b = await crypto.subtle.digest('SHA-256', u); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
export function sniffMime(u) {
  if (u[0] === 0xff && u[1] === 0xd8) return 'image/jpeg';
  if (u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47) return 'image/png';
  if (u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46) return 'application/pdf';
  if (u[8] === 0x57 && u[9] === 0x45 && u[10] === 0x42 && u[11] === 0x50) return 'image/webp';
  return '';
}
export async function listFiles(env, cid) {
  const r = await env.DB.prepare(`SELECT id, kind, person, mime, size, name, sha, created_at FROM rc_files WHERE contract_id = ? ORDER BY person, kind`).bind(cid).all();
  return r.results || [];
}

/* ============================== snapshot + hash ============================== */
export async function buildSnapshot(env, row, extra) {
  const c = rowToContract(row);
  const files = (await listFiles(env, c.id)).filter((f) => f.kind !== 'signature').map((f) => ({ kind: f.kind, person: f.person, sha256: f.sha, size: f.size }));
  const snap = {
    v: TPL_VERSION, number: c.number, ctype: c.ctype, email: c.email, terms: normTerms(c.terms, c.ctype), cust: c.cust, co_name: hasCo(c) ? c.cust.co.name : '',
    sections: sections(c), accepted: c.accepted, files, approved_at: c.approved_at, approved_by: c.approved_by,
    signer: { name: extra.name, email: c.email, ip: extra.ip, ua: extra.ua, at: extra.at, code_verified: true, sig_sha256: extra.sig_sha },
    co_signer: extra.co ? { name: extra.co.name, email: extra.co.email, at: extra.at, code_verified: true, sig_sha256: extra.co.sig_sha } : null,
    test: !!c.test
  };
  const json = JSON.stringify(snap);
  return { json, hash: await sha256hex(json) };
}

/* ============================== PDF ============================== */
const HEX4 = Array.from({ length: 1024 }, (_, i) => i.toString(16).padStart(4, '0'));
const FONT_CACHE = {};
const ENC = {};
function encTable(f) { const T = []; for (const [cp, g] of Object.entries(FONTS[f].map)) T[Number(cp)] = { g: g[0], h: HEX4[g[0]], w: g[1] }; return T; }
const PW = 595.28, PH = 841.89, ML = 52, MR = 52, MT = 56, MB = 60;
function jpegSize(u) {
  let i = 2;
  while (i < u.length) {
    if (u[i] !== 0xff) { i++; continue; }
    const mk = u[i + 1]; const len = (u[i + 2] << 8) + u[i + 3];
    if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) return { h: (u[i + 5] << 8) + u[i + 6], w: (u[i + 7] << 8) + u[i + 8], comps: u[i + 9] };
    i += 2 + len;
  }
  return null;
}
class Pdf {
  constructor() { this.pages = []; this.used = { R: new Array(1024).fill(0), B: new Array(1024).fill(0) }; this.images = []; this.newPage(); }
  newPage() { this.cur = []; this.pages.push(this.cur); this.y = PH - MT; }
  enc(text, f) {
    const T = ENC[f] || (ENC[f] = encTable(f)); const used = this.used[f]; let hex = ''; let w = 0; const str = String(text);
    for (let i = 0; i < str.length; i++) {
      let cp = str.charCodeAt(i); if (cp === 0x2212) cp = 0x2013; else if (cp === 0xa0) cp = 0x20;
      let e = T[cp]; if (!e) { e = T[63]; cp = 63; }
      used[e.g] = cp; hex += e.h; w += e.w;
    }
    return { hex, w };
  }
  width(text, f, size) {
    const M = FONTS[f].map; let w = 0; const str = String(text);
    for (let i = 0; i < str.length; i++) { let cp = str.charCodeAt(i); if (cp === 0x2212) cp = 0x2013; else if (cp === 0xa0) cp = 0x20; const g = M[cp] || M[63]; w += g[1]; }
    return w * size / 1000;
  }
  draw(text, x, y, f, size, color) {
    const { hex } = this.enc(text, f);
    this.cur.push(`BT ${color || '0.08 0.08 0.1'} rg /F${f} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td <${hex}> Tj ET`);
  }
  ensure(h) { if (this.y - h < MB) this.newPage(); }
  wrap(text, f, size, maxW) {
    const words = String(text).split(/ +/); const lines = []; let line = ''; let lw = 0;
    const sp = this.width(' ', f, size);
    for (const wd of words) {
      const ww = this.width(wd, f, size);
      if (!line) {
        if (ww > maxW) { // túl hosszú szó: karakterenként törjük
          let part = ''; let pw = 0;
          for (const ch of wd) { const cw = this.width(ch, f, size); if (pw + cw > maxW && part) { lines.push(part); part = ch; pw = cw; } else { part += ch; pw += cw; } }
          line = part; lw = pw;
        } else { line = wd; lw = ww; }
      } else if (lw + sp + ww <= maxW) { line += ' ' + wd; lw += sp + ww; }
      else { lines.push(line); line = wd; lw = ww; }
    }
    if (line) lines.push(line);
    return lines;
  }
  para(text, o) {
    o = o || {}; const f = o.bold ? 'B' : 'R'; const size = o.size || 9.5; const lh = size * (o.lh || 1.42); const x = o.x || ML; const maxW = (o.w || (PW - MR - x));
    for (const ln of this.wrap(text, f, size, maxW - (o.indent || 0))) { this.ensure(lh); this.y -= lh; this.draw(ln, x + (o.indent || 0), this.y, f, size, o.color); }
    this.y -= (o.after == null ? 4 : o.after);
  }
  bullet(text, o) {
    o = o || {}; const size = o.size || 9.5; const lh = size * 1.42; const lines = this.wrap(text, 'R', size, PW - MR - ML - 14);
    lines.forEach((ln, i) => { this.ensure(lh); this.y -= lh; if (i === 0) this.draw('•', ML + 3, this.y, 'R', size); this.draw(ln, ML + 14, this.y, 'R', size); });
    this.y -= 1.5;
  }
  rule(color) { this.ensure(8); this.y -= 6; this.cur.push(`${color || '0.88 0.9 0.94'} RG 0.6 w ${ML} ${this.y.toFixed(2)} m ${PW - MR} ${this.y.toFixed(2)} l S`); this.y -= 6; }
  rect(x, y, w, h, color) { this.cur.push(`${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); }
  image(bytes, x, y, w, h) {
    const s = jpegSize(bytes); if (!s) return;
    const id = this.images.length; this.images.push({ bytes, w: s.w, h: s.h, comps: s.comps });
    this.cur.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im${id} Do Q`);
  }
  build(info) {
    const te = new TextEncoder(); const chunks = []; const offs = []; let pos = 0;
    const push = (x) => { const u = typeof x === 'string' ? te.encode(x) : x; chunks.push(u); pos += u.length; };
    const objs = []; const add = (body) => { objs.push(body); return objs.length; }; // body: string vagy {dict, stream}
    // Fontok
    const fontRef = {};
    for (const f of ['R', 'B']) {
      const F = FONTS[f]; const ttf = FONT_CACHE[f] || (FONT_CACHE[f] = b64ToBytes(F.b64));
      const ff = add({ dict: `/Length1 ${ttf.length}`, stream: ttf });
      const fd = add(`<< /Type /FontDescriptor /FontName /${F.name} /Flags 32 /FontBBox [${F.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${F.asc} /Descent ${F.desc} /CapHeight ${F.cap} /StemV ${f === 'B' ? 120 : 80} /FontFile2 ${ff} 0 R >>`);
      const ws = FONT_CACHE['w' + f] || (FONT_CACHE['w' + f] = Object.values(F.map).sort((a, b) => a[0] - b[0]).map((g) => `${g[0]} [${g[1]}]`).join(' '));
      const cid = add(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${F.name} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${fd} 0 R /W [${ws}] /CIDToGIDMap /Identity >>`);
      const used = []; this.used[f].forEach((u, g) => { if (u) used.push([g, u]); });
      let cm = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
      for (let i = 0; i < used.length; i += 100) {
        const part = used.slice(i, i + 100);
        cm += `${part.length} beginbfchar\n` + part.map(([g, u]) => `<${g.toString(16).padStart(4, '0')}> <${u.toString(16).padStart(4, '0')}>`).join('\n') + '\nendbfchar\n';
      }
      cm += 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
      const tu = add({ dict: '', stream: te.encode(cm) });
      fontRef[f] = add(`<< /Type /Font /Subtype /Type0 /BaseFont /${F.name} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${tu} 0 R >>`);
    }
    const imgRef = this.images.map((im) => add({ dict: `/Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /${im.comps === 1 ? 'DeviceGray' : 'DeviceRGB'} /BitsPerComponent 8 /Filter /DCTDecode`, stream: im.bytes }));
    const pagesId = objs.length + this.pages.length * 2 + 1; // a Pages objektum helye (lent)
    const pageIds = [];
    const total = this.pages.length;
    this.pages.forEach((ops, i) => {
      const foot = `BT 0.45 0.48 0.55 rg /FR 7.5 Tf ${ML} 30 Td <${this.enc(`${info.number} · ${info.hash ? 'SHA-256: ' + info.hash.slice(0, 16) + '…' : 'TERVEZET'} · ${i + 1}/${total}`, 'R').hex}> Tj ET`;
      const content = te.encode(ops.join('\n') + '\n' + foot);
      const cId = add({ dict: '', stream: content });
      const xo = imgRef.length ? `/XObject << ${imgRef.map((r, k) => `/Im${k} ${r} 0 R`).join(' ')} >>` : '';
      pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /FR ${fontRef.R} 0 R /FB ${fontRef.B} 0 R >> ${xo} >> /Contents ${cId} 0 R >>`));
    });
    const pid = add(`<< /Type /Pages /Kids [${pageIds.map((p) => p + ' 0 R').join(' ')}] /Count ${pageIds.length} >>`);
    if (pid !== pagesId) throw new Error('pdf pages id');
    const pdfStr = (s) => '<FEFF' + [...String(s)].map((ch) => ch.codePointAt(0).toString(16).padStart(4, '0')).join('').toUpperCase() + '>';
    const infoId = add(`<< /Title ${pdfStr(info.title)} /Author ${pdfStr('Caradvance GmbH')} /Producer (CarAdvance online szerzodes) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z) >>`);
    const catId = add(`<< /Type /Catalog /Pages ${pid} 0 R >>`);
    push('%PDF-1.7\n'); push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    objs.forEach((o, i) => {
      offs.push(pos);
      if (typeof o === 'string') push(`${i + 1} 0 obj\n${o}\nendobj\n`);
      else { push(`${i + 1} 0 obj\n<< ${o.dict} /Length ${o.stream.length} >>\nstream\n`); push(o.stream); push('\nendstream\nendobj\n'); }
    });
    const xref = pos;
    push(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
    push(`trailer\n<< /Size ${objs.length + 1} /Root ${catId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(pos); let p = 0; for (const c of chunks) { out.set(c, p); p += c.length; }
    return out;
  }
}
/** Kétnyelvű sor-pár: magyar bal, angol jobb hasáb, soronként együtt törve (oldaltörésnél is egy vonalban). */
Pdf.prototype.pair = function (hu, en, o) {
  o = o || {}; const size = o.size || 8.3; const lh = size * 1.36; const gap = 16; const colW = (PW - ML - MR - gap) / 2;
  const ind = o.bullet ? 9 : 0; const f = o.bold ? 'B' : 'R';
  const L = this.wrap(hu, f, size, colW - ind); const R = this.wrap(en, f, size, colW - ind);
  const n = Math.max(L.length, R.length);
  for (let i = 0; i < n; i++) {
    this.ensure(lh); this.y -= lh;
    if (o.bullet && i === 0) { this.draw('•', ML, this.y, 'R', size); this.draw('•', ML + colW + gap, this.y, 'R', size, '0.35 0.4 0.5'); }
    if (L[i]) this.draw(L[i], ML + ind, this.y, f, size, o.color);
    if (R[i]) this.draw(R[i], ML + colW + gap + ind, this.y, f, size, o.colorEn || '0.32 0.36 0.45');
  }
  this.y -= (o.after == null ? 3.2 : o.after);
};

/**
 * A szerződés PDF-je (kétnyelvű, két hasáb) a mentett snapshotból (aláírás után) vagy élő adatokból (tervezet).
 * meta: { sig: Uint8Array JPEG, coSig: Uint8Array JPEG, hash }
 */
export function contractPdf(snap, meta) {
  meta = meta || {};
  const p = new Pdf();
  const t = snap.terms; const cur = t.currency;
  const head = () => {
    p.rect(0, PH - 64, PW, 64, '0.043 0.043 0.051'); p.rect(0, PH - 67, PW, 3, '0.886 0 0.102');
    p.draw('CarAdvance', ML, PH - 38, 'B', 18, '1 1 1'); p.draw('Bérlés · Import · Eladás', ML, PH - 52, 'R', 8, '0.75 0.77 0.82');
    const tt = 'BÉRLETI SZERZŐDÉS · RENTAL AGREEMENT'; p.draw(tt, PW - MR - p.width(tt, 'B', 9.5), PH - 36, 'B', 9.5, '1 1 1');
    const nr = (snap.number || '') + (snap.test ? ' · TESZT / TEST' : ''); p.draw(nr, PW - MR - p.width(nr, 'R', 8.5), PH - 50, 'R', 8.5, snap.test ? '1 0.6 0.6' : '0.75 0.77 0.82');
    p.y = PH - 88;
  };
  head();
  const lesseeName = snap.ctype === 'ceg' ? (snap.cust.company_name || '') : (snap.cust.name || '');
  p.pair(`Bérbeadó: ${LESSOR.name} · Bérlő: ${lesseeName}${snap.co_name ? ' és ' + snap.co_name : ''}`, `Lessor: ${LESSOR.name} · Lessee: ${lesseeName}${snap.co_name ? ' and ' + snap.co_name : ''}`, { bold: true, size: 9, after: 2 });
  p.pair(`Tartós bérlet, min. ${t.min_months} hónap · ${t.car || ''}`, `Long-term rental, min. ${t.min_months} months · ${t.car || ''}`, { size: 8.5, color: '0.35 0.4 0.5', after: 8 });
  // összefoglaló
  const rows = [
    ['Havi bérleti díj / Monthly rent', money(t.monthly, cur) + (t.vat === 'net' ? ' (nettó / net)' : '')],
    ['Óvadék / Deposit', money(t.deposit, cur) + (t.deposit_upfront ? ' – az átadás előtt / before handover' : ' – csak káresemény esetén / only after a damage event')],
    ['Első fizetés / First payment', money(firstAmount(t), cur)],
    ['Km-keret / Mileage', `${Number(t.km_month).toLocaleString('hu-HU')} km/hó · túlfutás / excess ${money(t.km_fee, cur)}/km`],
    ['Minimális bérleti idő / Minimum term', `${t.min_months} hónap / months`],
    ['Tervezett átadás / Planned handover', huDate(t.handover_planned) + (t.handover_place ? ' · ' + t.handover_place : '')],
    ['Fizetés / Payment', t.billing === 'card' ? 'Bankkártya, automatikus havi terhelés / card, automatic monthly charge' : 'Átutalás / bank transfer']
  ];
  const boxH = rows.length * 14 + 12; p.ensure(boxH + 8);
  p.rect(ML, p.y - boxH, PW - ML - MR, boxH, '0.957 0.965 0.98');
  let yy = p.y - 16;
  for (const [k, v] of rows) { p.draw(k, ML + 10, yy, 'R', 8.3, '0.35 0.4 0.5'); p.draw(v, ML + 190, yy, 'B', 8.3); yy -= 14; }
  p.y -= boxH + 10;
  for (const g of snap.sections) {
    p.ensure(36); p.y -= 6;
    p.rect(ML, p.y - 17, PW - ML - MR, 17, '0.043 0.043 0.051');
    p.draw(g.title[0].toUpperCase() + '  /  ' + g.title[1].toUpperCase(), ML + 8, p.y - 12, 'B', 8.6, '1 1 1');
    p.y -= 22;
    for (const part of g.parts) {
      if (part.h) { p.ensure(24); p.pair(part.h[0], part.h[1], { bold: true, size: 8.8, after: 2, color: '0.886 0 0.102', colorEn: '0.886 0 0.102' }); }
      for (const it of part.items) {
        if (Array.isArray(it)) p.pair(it[0], it[1]);
        else { if (it.head) p.pair(it.head[0], it.head[1], { bold: true, after: 1 }); for (const li of it.list) p.pair(li[0], li[1], { bullet: true, after: 1.2 }); p.y -= 2; }
      }
    }
    if (snap.accepted && snap.accepted[g.id]) p.pair(`Elfogadva: ${g.accept[0]} (${huDateTime(snap.accepted[g.id])})`, `Accepted: ${g.accept[1]}`, { size: 7.4, color: '0.09 0.5 0.25', colorEn: '0.09 0.5 0.25', after: 5 });
  }
  // aláírások
  const co = snap.co_signer || (snap.co_name ? { name: snap.co_name } : null);
  p.ensure(co ? 250 : 150); p.y -= 8; p.rule();
  p.pair('ALÁÍRÁSOK', 'SIGNATURES', { bold: true, size: 10, after: 8 });
  const colW = (PW - ML - MR - 20) / 2; const x2 = ML + colW + 20;
  const block = (x, top, title, name, sub, sig, at) => {
    p.draw(title, x, top - 10, 'B', 8.8);
    if (sig) { const s = jpegSize(sig); if (s) { const h = 52; const w = Math.min(colW, s.w * h / s.h); p.image(sig, x, top - 70, w, h); } }
    p.cur.push(`0.6 0.62 0.7 RG 0.6 w ${x} ${(top - 74).toFixed(2)} m ${x + colW} ${(top - 74).toFixed(2)} l S`);
    p.draw(name || '', x, top - 86, 'B', 8.8);
    if (sub) p.draw(sub, x, top - 98, 'R', 7.8, '0.35 0.4 0.5');
    if (at) p.draw(at, x, top - 109, 'R', 7.8, '0.35 0.4 0.5');
  };
  let top = p.y;
  block(ML, top, 'Bérbeadó / Lessor', 'Caradvance GmbH', 'Bgm-Graf-Ring 21, 82538 Geretsried', null, snap.approved_at ? 'Jóváhagyva / approved: ' + huDateTime(snap.approved_at) + (snap.approved_by ? ' (' + snap.approved_by + ')' : '') : '');
  p.draw('Elektronikusan kiállítva / issued electronically', ML, top - 50, 'R', 7.8, '0.35 0.4 0.5');
  block(x2, top, 'Bérlő / Lessee', snap.signer ? snap.signer.name : lesseeName, snap.signer ? 'E-mail kóddal igazolva / verified by e-mail code' : '(aláírásra vár / awaiting signature)', meta.sig, snap.signer ? huDateTime(snap.signer.at) : '');
  p.y = top - 122;
  if (co) {
    p.ensure(125); top = p.y;
    block(x2, top, 'Bérlőtárs (házastárs) / Co-Lessee (spouse)', co.name, snap.co_signer ? 'E-mail kóddal igazolva / verified by e-mail code' : '(aláírásra vár / awaiting signature)', meta.coSig, snap.co_signer ? huDateTime(snap.co_signer.at) : '');
    p.y = top - 122;
  }
  // aláírási napló
  if (snap.signer) {
    p.newPage(); head();
    p.pair('Aláírási napló', 'Signature log', { bold: true, size: 12, after: 4 });
    p.pair('Ez az oldal igazolja, ki, mikor és hogyan írta alá a szerződést. Az ellenőrző összeg (SHA-256) a szerződés teljes, aláírt tartalmából készült: ha a szöveg bármilyen módon megváltozna, az összeg sem egyezne.', 'This page records who signed the agreement, when and how. The checksum (SHA-256) is computed from the complete signed content: any change to the text would change the checksum.', { size: 8, after: 8 });
    const L = [
      ['Szerződésszám / Agreement no.', snap.number], ['Sablon / Template', snap.v], ['SHA-256', meta.hash || ''],
      ['Bérlő / Lessee', `${snap.signer.name} · ${snap.email} (egyszeri kóddal igazolva / verified by one-time code)`],
      ...(snap.co_signer ? [['Bérlőtárs / Co-Lessee', `${snap.co_signer.name} · ${snap.co_signer.email} (egyszeri kóddal igazolva / verified by one-time code)`]] : []),
      ['Aláírás ideje / Signed at', huDateTime(snap.signer.at)], ['IP-cím / IP address', snap.signer.ip || '—'], ['Böngésző / Browser', snap.signer.ua || '—'],
      ['Aláíráskép / Signature image SHA-256', snap.signer.sig_sha256 + (snap.co_signer ? ' · ' + snap.co_signer.sig_sha256 : '')],
      ['Okmányok ellenőrizve / Documents checked', (snap.approved_by || '—') + ', ' + huDateTime(snap.approved_at)]
    ];
    for (const [k, v] of L) { p.para(k, { bold: true, size: 8, after: 0 }); p.para(String(v), { size: 8, after: 4 }); }
    p.para('Elfogadott egységek / Accepted sections', { bold: true, size: 9, after: 2 });
    for (const g of snap.sections) p.bullet(`${g.title[0]} – ${snap.accepted[g.id] ? huDateTime(snap.accepted[g.id]) : 'nem / no'}`, { size: 8 });
    p.para('Feltöltött okmányok / Uploaded documents (SHA-256)', { bold: true, size: 9, after: 2 });
    for (const f of snap.files) p.bullet(`${KIND_HU[f.kind] || f.kind}${f.person === 9 ? ' – bérlőtárs' : f.person ? ' – ' + f.person + '. további vezető' : ''}: ${f.sha256}`, { size: 7 });
  }
  return p.build({ title: 'Bérleti szerződés / Rental agreement ' + (snap.number || ''), number: snap.number || '', hash: meta.hash });
}

/** Tervezet-snapshot (aláírás előtt, előnézethez / munkatársnak). */
export function draftSnapshot(c) {
  return { v: TPL_VERSION, number: c.number, ctype: c.ctype, email: c.email, terms: normTerms(c.terms, c.ctype), cust: c.cust, co_name: hasCo(c) ? c.cust.co.name : '', sections: sections(c), accepted: c.accepted || {}, files: [], approved_at: c.approved_at, approved_by: c.approved_by, signer: null, co_signer: null, test: !!c.test };
}
export async function signedPdf(env, row) {
  if (!row.snapshot) return null;
  const snap = parseJ(row.snapshot, null); if (!snap) return null;
  const f = await env.DB.prepare(`SELECT data FROM rc_files WHERE contract_id = ? AND kind = 'signature' AND person = 0 ORDER BY id DESC LIMIT 1`).bind(row.id).first();
  const f2 = await env.DB.prepare(`SELECT data FROM rc_files WHERE contract_id = ? AND kind = 'signature' AND person = 9 ORDER BY id DESC LIMIT 1`).bind(row.id).first();
  return contractPdf(snap, { sig: f ? b64ToBytes(f.data) : null, coSig: f2 ? b64ToBytes(f2.data) : null, hash: row.snapshot_hash });
}

/* ============================== Stripe ============================== */
export function stripeMode(env) {
  const k = String(env.STRIPE_SECRET_KEY || '');
  if (!k) return 'none';
  return /^(sk|rk)_test_/.test(k) ? 'test' : 'live';
}
function formEncode(obj, prefix, out) {
  out = out || [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null || v === '') continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') formEncode(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  }
  return out;
}
export async function stripe(env, method, path, params, idem) {
  const body = params ? formEncode(params).join('&') : '';
  const url = 'https://api.stripe.com/v1/' + path + (method === 'GET' && body ? '?' + body : '');
  const h = { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' };
  if (idem) h['Idempotency-Key'] = idem;
  const r = await fetch(url, { method, headers: h, body: method === 'GET' ? undefined : body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error((j.error && j.error.message) || 'stripe ' + r.status); e.stripe = j.error || {}; e.status = r.status; throw e; }
  return j;
}
export async function ensureStripeCustomer(env, c) {
  if (c.stripe_customer) return c.stripe_customer;
  const cu = await stripe(env, 'POST', 'customers', { email: c.email, name: c.company || c.name, preferred_locales: { 0: 'hu' }, metadata: { contract: c.number, contract_id: c.id } }, 'ca-cust-' + c.id);
  await env.DB.prepare(`UPDATE rc_contracts SET stripe_customer = ? WHERE id = ?`).bind(cu.id, c.id).run();
  c.stripe_customer = cu.id;
  return cu.id;
}
export function cardLabel(pm) { const k = pm && pm.card; return k ? `${(k.brand || '').toUpperCase()} •••• ${k.last4} (${String(k.exp_month).padStart(2, '0')}/${String(k.exp_year).slice(-2)})` : ''; }

/* ============================== e-mailek ============================== */
export async function sendMailX(env, to, subject, inner, opts) {
  if (!env.RESEND_API_KEY) return false;
  const html = emailShell(inner, (opts && opts.footer) || 'Kérdés esetén válaszolj erre az e-mailre, vagy hívj: +36 30 214 6989.');
  const body = {
    from: env.CUSTOMER_EMAIL_FROM || env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>',
    to: (Array.isArray(to) ? to : String(to).split(',')).map((s) => s.trim()).filter(Boolean),
    reply_to: env.CUSTOMER_REPLY_TO || 'info@caradvance.hu', subject, html,
    text: inner.replace(/<br\s*\/?>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
  };
  if (opts && opts.attachments) body.attachments = opts.attachments;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.ok;
}
export function notifyTo(env) { return env.CONTRACT_NOTIFY_TO || 'info@caradvance.hu'; }
export function btn(href, label) { return `<p style="margin:22px 0"><a href="${esc(href)}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;display:inline-block">${esc(label)}</a></p>`; }
export function linkFor(c) { return `${SITE}/szerzodes/?t=${c.token}`; }
export function hi(c) { const n = (c.cust && c.cust.name) || c.name || ''; return `<p>Kedves ${esc(n || 'Ügyfelünk')}!</p>`; }

/* ============================== terhelések ============================== */
/** A havi díjak ütemezése: az átadás napjától havonta; a megszűnés napjánál időarányos. */
export function periodPlan(c, n) {
  const t = normTerms(c.terms, c.ctype);
  const start = addMonths(c.handover_date, n - 1); const next = addMonths(c.handover_date, n);
  if (c.end_date && start >= c.end_date) return null;
  let amount = Number(t.monthly) || 0; let title = `Bérleti díj – ${n}. hónap (${huDate(start)} – ${huDate(addDays(next, -1))})`;
  if (c.end_date && c.end_date < next) {
    const days = daysBetween(start, c.end_date); const all = daysBetween(start, next);
    amount = Math.round(amount * days / all * (t.currency === 'HUF' ? 1 : 100)) / (t.currency === 'HUF' ? 1 : 100);
    title = `Bérleti díj – ${n}. hónap, időarányos (${huDate(start)} – ${huDate(addDays(c.end_date, -1))})`;
  }
  return { start, amount, title, currency: t.currency };
}

const RETRY = [1, 3, 5]; // napok a lejárat után

/** Egy terhelés végrehajtása mentett kártyáról (vagy teszt-szerződésnél Stripe nélkül szimulálva). */
export async function chargeNow(env, c, ch) {
  const mode = stripeMode(env);
  if (ch.status === 'paid' || ch.status === 'cancelled') return { ok: true, skipped: true };
  if (mode === 'none') {
    if (!c.test) return { ok: false, error: 'Stripe nincs beállítva (STRIPE_SECRET_KEY).' };
    await env.DB.prepare(`UPDATE rc_charges SET status='paid', paid_at=datetime('now'), note='TESZT: szimulált terhelés', attempts=attempts+1 WHERE id=?`).bind(ch.id).run();
    await addEvent(env, c.id, `TESZT: szimulált terhelés – ${ch.title} – ${money(ch.amount, ch.currency)}`);
    await mailChargeOk(env, c, ch, 'TESZT');
    return { ok: true, simulated: true };
  }
  if (!c.stripe_customer || !c.stripe_pm) return { ok: false, error: 'Nincs mentett kártya.' };
  try {
    const pi = await stripe(env, 'POST', 'payment_intents', {
      amount: minor(ch.amount, ch.currency), currency: ch.currency.toLowerCase(), customer: c.stripe_customer, payment_method: c.stripe_pm,
      off_session: 'true', confirm: 'true', payment_method_types: { 0: 'card' }, description: `${c.number} – ${ch.title}`, statement_descriptor_suffix: 'BERLES',
      metadata: { contract: c.number, contract_id: c.id, charge_id: ch.id }
    }, `ca-ch-${ch.id}-${ch.attempts || 0}`);
    if (pi.status === 'succeeded') {
      await env.DB.prepare(`UPDATE rc_charges SET status='paid', paid_at=datetime('now'), pi=?, attempts=attempts+1, last_error=NULL WHERE id=?`).bind(pi.id, ch.id).run();
      await addEvent(env, c.id, `Sikeres terhelés: ${ch.title} – ${money(ch.amount, ch.currency)}`);
      await mailChargeOk(env, c, ch, '');
      return { ok: true };
    }
    throw Object.assign(new Error('Állapot: ' + pi.status), { stripe: { code: pi.status } });
  } catch (e) {
    const attempts = (ch.attempts || 0) + 1;
    const due = ch.due_date; const nextOff = RETRY[attempts - 1];
    const next = nextOff != null ? addDays(due, nextOff) : null;
    const st = next ? 'retry' : 'failed';
    const msg = (e.stripe && (e.stripe.decline_code || e.stripe.code)) ? `${e.message} (${e.stripe.decline_code || e.stripe.code})` : e.message;
    await env.DB.prepare(`UPDATE rc_charges SET status=?, attempts=?, next_try=?, last_error=?, pi=COALESCE(?, pi) WHERE id=?`)
      .bind(st, attempts, next, String(msg).slice(0, 300), (e.stripe && e.stripe.payment_intent && e.stripe.payment_intent.id) || null, ch.id).run();
    await addEvent(env, c.id, `Sikertelen terhelés (${attempts}. próba): ${ch.title} – ${msg}`);
    if (attempts === 1 || !next) await mailChargeFailed(env, c, ch, !next);
    if (!next) await sendMailX(env, notifyTo(env), `Sikertelen terhelés – ${c.number}`, `<p>A(z) <b>${esc(c.number)}</b> szerződés terhelése 4 próbálkozás után sem sikerült.</p><p>${esc(ch.title)} – <b>${esc(money(ch.amount, ch.currency))}</b><br>Hiba: ${esc(msg)}</p>${btn(SITE + '/belso/szerzodesek/#' + c.id, 'Megnyitás')}`);
    return { ok: false, error: msg };
  }
}
async function mailChargeOk(env, c, ch, tag) {
  await sendMailX(env, c.email, `${tag ? tag + ': ' : ''}Sikeres fizetés – ${ch.title}`,
    `${hi(c)}<p>Sikeresen terheltük a kártyádat:</p><p style="font-size:18px"><b>${esc(money(ch.amount, ch.currency))}</b><br><span style="color:#5a6b82">${esc(ch.title)}</span></p><p>A számlát külön küldjük. A fizetéseidet és a szerződésedet itt látod:</p>${btn(linkFor(c), 'Szerződésem')}`);
}
async function mailChargeFailed(env, c, ch, final) {
  await sendMailX(env, c.email, `Nem sikerült a terhelés – ${ch.title}`,
    `${hi(c)}<p>Sajnos nem sikerült terhelni a kártyádat:</p><p style="font-size:18px"><b>${esc(money(ch.amount, ch.currency))}</b><br><span style="color:#5a6b82">${esc(ch.title)}</span></p><p>${final ? 'Kérjük, fizesd ki most az alábbi gombbal, vagy cseréld le a kártyádat.' : 'Néhány nap múlva automatikusan újra megpróbáljuk. Ha a kártyád lejárt vagy lecserélted, add meg az újat, vagy fizesd ki most az alábbi gombbal.'}</p>${btn(linkFor(c), 'Fizetés / kártyacsere')}`);
}

/**
 * Napi futás: értesítők, havi díjak létrehozása és terhelése, újrapróbálkozás, okmánytörlés.
 * Ismételten futtatva sem terhel kétszer (egyedi index + állapotok + Stripe idempotencia).
 */
export async function runDue(env) {
  await ensureRc(env);
  const t0 = today(); const log = [];
  const act = (await env.DB.prepare(`SELECT * FROM rc_contracts WHERE status = 'active' AND handover_date IS NOT NULL AND handover_date != ''`).all()).results || [];
  for (const row of act) {
    const c = rowToContract(row); const terms = normTerms(c.terms, c.ctype);
    if (terms.billing !== 'card') continue;
    // havi díjak létrehozása a következő 3 napig
    for (let n = 2; n < 600; n++) {
      const pl = periodPlan(c, n); if (!pl) break;
      if (pl.start > addDays(t0, 3)) break;
      await env.DB.prepare(`INSERT OR IGNORE INTO rc_charges (contract_id, kind, period, title, amount, currency, due_date, status) VALUES (?, 'rent', ?, ?, ?, ?, ?, 'scheduled')`)
        .bind(c.id, n, pl.title, pl.amount, pl.currency, pl.start).run();
    }
    const chs = (await env.DB.prepare(`SELECT * FROM rc_charges WHERE contract_id = ? AND status IN ('scheduled','retry','pending_checkout')`).bind(c.id).all()).results || [];
    for (const ch of chs) {
      if (ch.status === 'pending_checkout' && ch.session && stripeMode(env) !== 'none') { // megszakított ügyfél-fizetés ellenőrzése
        try { await verifyCheckout(env, c, ch.session); } catch (e) { /* később */ }
        continue;
      }
      if (ch.status === 'scheduled' && !ch.notice_at && ch.due_date > t0 && ch.due_date <= addDays(t0, 3)) {
        await sendMailX(env, c.email, `Értesítés: közelgő terhelés – ${huDate(ch.due_date)}`,
          `${hi(c)}<p>Tájékoztatunk, hogy <b>${esc(huDate(ch.due_date))}</b> napján az alábbi összeget terheljük a mentett kártyádról${c.card_label ? ' (' + esc(c.card_label) + ')' : ''}:</p><p style="font-size:18px"><b>${esc(money(ch.amount, ch.currency))}</b><br><span style="color:#5a6b82">${esc(ch.title)}</span></p><p>Ha közben új kártyát kaptál, itt cserélheted le:</p>${btn(linkFor(c), 'Kártyacsere')}`);
        await env.DB.prepare(`UPDATE rc_charges SET notice_at = datetime('now') WHERE id = ?`).bind(ch.id).run();
        log.push(`${c.number}: értesítő – ${ch.title}`);
        continue;
      }
      const dueNow = ch.status === 'scheduled' ? ch.due_date <= t0 : (ch.next_try && ch.next_try <= t0);
      if (dueNow) { const r = await chargeNow(env, c, ch); log.push(`${c.number}: ${ch.title} → ${r.ok ? 'OK' : 'HIBA: ' + r.error}`); }
    }
  }
  // elmaradt "aláírva" e-mailek pótlása
  const unsent = (await env.DB.prepare(`SELECT * FROM rc_contracts WHERE snapshot IS NOT NULL AND signed_mail_at IS NULL AND status IN ('signed','active') LIMIT 5`).all()).results || [];
  for (const r of unsent) { try { if (await sendSignedMails(env, r)) log.push(`${r.number}: aláírt PDF e-mail pótolva`); } catch (e) { log.push(`${r.number}: PDF e-mail hiba: ${e.message}`); } }
  // okmányok törlése a lezárás után 30 nappal (az aláírás képe a szerződéssel együtt megmarad)
  const old = (await env.DB.prepare(`SELECT id FROM rc_contracts WHERE (closed_at IS NOT NULL AND closed_at < datetime('now','-30 days')) OR (cancelled_at IS NOT NULL AND cancelled_at < datetime('now','-30 days'))`).all()).results || [];
  for (const o of old) {
    const d = await env.DB.prepare(`DELETE FROM rc_files WHERE contract_id = ? AND kind != 'signature'`).bind(o.id).run();
    if (d.meta && d.meta.changes) { await addEvent(env, o.id, `Okmánymásolatok törölve (${d.meta.changes} fájl) – a lezárás után 30 nappal`); log.push(`#${o.id}: okmányok törölve`); }
  }
  return { ok: true, date: t0, log };
}

/** Stripe Checkout visszatérés / ellenőrzés (első fizetés, rendezetlen terhelés vagy kártyacsere). */
export async function verifyCheckout(env, c, sid) {
  const s = await stripe(env, 'GET', 'checkout/sessions/' + encodeURIComponent(sid), { expand: { 0: 'payment_intent.payment_method', 1: 'setup_intent.payment_method' } });
  if (String(s.metadata && s.metadata.contract_id) !== String(c.id)) throw new Error('session mismatch');
  const kind = s.metadata.kind;
  if (s.mode === 'setup') {
    if (s.status !== 'complete' || !s.setup_intent) return { ok: false, status: s.status };
    const pm = s.setup_intent.payment_method;
    await env.DB.prepare(`UPDATE rc_contracts SET stripe_pm = ?, card_label = ? WHERE id = ?`).bind(pm.id, cardLabel(pm), c.id).run();
    await addEvent(env, c.id, 'Kártya lecserélve: ' + cardLabel(pm));
    // nyitott, sikertelen terhelések újrapróbálása az új kártyával
    const open = (await env.DB.prepare(`SELECT * FROM rc_charges WHERE contract_id = ? AND status IN ('retry','failed') AND due_date <= ?`).bind(c.id, today()).all()).results || [];
    const fresh = rowToContract(await env.DB.prepare(`SELECT * FROM rc_contracts WHERE id = ?`).bind(c.id).first());
    for (const ch of open) await chargeNow(env, fresh, ch);
    return { ok: true, kind: 'setup' };
  }
  if (s.payment_status !== 'paid') return { ok: false, status: s.status };
  const pi = s.payment_intent; const pm = pi && pi.payment_method;
  const chId = Number(s.metadata.charge_id);
  const ch = await env.DB.prepare(`SELECT * FROM rc_charges WHERE id = ? AND contract_id = ?`).bind(chId, c.id).first();
  if (ch && ch.status !== 'paid') {
    await env.DB.prepare(`UPDATE rc_charges SET status='paid', paid_at=datetime('now'), pi=?, session=?, last_error=NULL WHERE id=?`).bind(pi.id, sid, ch.id).run();
    await addEvent(env, c.id, `Kártyás fizetés (Checkout): ${ch.title} – ${money(ch.amount, ch.currency)}`);
  }
  if (pm && pm.id) await env.DB.prepare(`UPDATE rc_contracts SET stripe_pm = ?, card_label = ?, stripe_customer = COALESCE(stripe_customer, ?) WHERE id = ?`).bind(pm.id, cardLabel(pm), s.customer || null, c.id).run();
  if (kind === 'first' && c.status === 'signed') {
    await env.DB.prepare(`UPDATE rc_contracts SET status='active', paid_at=datetime('now'), first_pi=? WHERE id=?`).bind(pi.id, c.id).run();
    await addEvent(env, c.id, 'Első fizetés teljesítve – a szerződés aktív.');
    await mailFirstPaid(env, c, ch);
  }
  return { ok: true, kind };
}
/** Az aláírt PDF kiküldése az ügyfélnek (és bérlőtársnak) + munkatársnak. Sikertelenség esetén a napi futás újrapróbálja. */
export async function sendSignedMails(env, row) {
  const c = rowToContract(row); if (!row.snapshot || row.signed_mail_at) return false;
  const pdf = await signedPdf(env, row);
  const att = [{ filename: `${c.number}-alairt-szerzodes.pdf`, content: bytesToB64(pdf) }];
  const t = normTerms(c.terms, c.ctype); const amt = esc(money(firstAmount(t), t.currency));
  const to = [c.email]; if (hasCo(c) && c.cust.co.email && c.cust.co.email !== c.email) to.push(c.cust.co.email);
  const ok = await sendMailX(env, to, `Aláírt bérleti szerződésed – ${c.number}`,
    `${hi(c)}<p>Köszönjük, a bérleti szerződést aláírtad. Az aláírt példányt csatoltuk ehhez az e-mailhez (PDF).</p>${t.billing === 'card'
      ? (c.status === 'signed' ? `<p>Utolsó lépés: az első fizetés (<b>${amt}</b>) bankkártyával.</p>${btn(linkFor(c), 'Tovább a fizetéshez')}` : btn(linkFor(c), 'Szerződésem'))
      : `<p>Az első fizetésről (<b>${amt}</b>) díjbekérőt küldünk, átutalással kell rendezni.</p>`}<p style="color:#5a6b82;font-size:13px">Thank you for signing the rental agreement. The signed copy is attached (PDF).</p>`, { attachments: att });
  await sendMailX(env, notifyTo(env), `Aláírva: ${c.number} – ${c.cust.company_name || c.cust.name || c.name}`,
    `<p>A(z) <b>${esc(c.number)}</b> szerződést az ügyfél aláírta (${esc(row.sign_name || '')}${row.co_sign_name ? ' és ' + esc(row.co_sign_name) : ''}). Az aláírt PDF csatolva.</p>${t.billing === 'card' ? '<p>Az ügyfél most fizet kártyával.</p>' : '<p><b>Átutalásos fizetés:</b> küldd ki a díjbekérőt, és a befizetés után jelöld fizetettnek az első fizetést.</p>'}${btn(SITE + '/belso/szerzodesek/#' + c.id, 'Megnyitás')}`, { attachments: att });
  if (ok) await env.DB.prepare(`UPDATE rc_contracts SET signed_mail_at = datetime('now') WHERE id = ?`).bind(c.id).run();
  return ok;
}
export async function mailFirstPaid(env, c, ch) {
  await sendMailX(env, c.email, `Fizetés megérkezett – ${c.number}`,
    `${hi(c)}<p>Megkaptuk az első fizetést, a szerződésed aktív.</p><p style="font-size:18px"><b>${esc(money(ch.amount, ch.currency))}</b><br><span style="color:#5a6b82">${esc(ch.title)}</span></p><p>Kollégánk hamarosan egyeztet veled az átadás pontos időpontjáról.</p>${btn(linkFor(c), 'Szerződésem')}`);
  await sendMailX(env, notifyTo(env), `Fizetve: ${c.number} – ${c.company || c.name}`, `<p>A(z) <b>${esc(c.number)}</b> szerződés első fizetése megérkezett (${esc(money(ch.amount, ch.currency))}). A szerződés aktív; az átadás után add meg az átadás napját, ettől indulnak a havi terhelések.</p>${btn(SITE + '/belso/szerzodesek/#' + c.id, 'Megnyitás')}`);
}
export { randomHex };
// A CRM (lib/crm.js) ugyanezzel a PDF-motorral (beágyazott magyar betűkészlet) készíti a szerződéstervezeteket.
export { Pdf, PW, PH, ML, MR, MB };
