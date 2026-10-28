/**
 * CarAdvance CRM — ügyféllista + Ügyfél adatlap (közös segédek, D1: env.DB).
 *
 * Táblák (maguktól létrejönnek az első híváskor):
 *   crm_cards  — dealenként egy sor: státusz, cím, adatlap-adatok (személyes/cég, gépjármű),
 *                checklist, szerződés-piszkozat. A deals tábla sorait egészíti ki (deal_id = deals.id).
 *   crm_offers — kiküldött ajánlatok (egyedi, kitalálhatatlan tokennel), az ügyfél válaszával.
 *   crm_files  — az ügyfélhez feltöltött egyéb dokumentumok (base64 a D1-ben, max. 1,4 MB/fájl).
 *
 * Használja: functions/api/belso-crm/[[path]].js (munkatárs) és functions/api/crm-ajanlat/[[path]].js (ügyfél).
 */
import { Pdf, PW, ML, MR } from './szerzodes.js';
import { LESSOR } from './szerzodes-tpl.js';

export const SITE = 'https://www.caradvance.hu';

export const STATUSES = [
  'Kapcsolatfelvételre vár', 'Ajánlatra vár', 'Ajánlat kiküldve', 'Ajánlat elfogadva',
  'Ajánlat elutasítva', 'Ajánlat módosítva', 'Megvalósítás', 'Lezárva'
];
export const DEFAULT_STATUS = STATUSES[0];

export const CHECKLIST = [
  ['igazolvany', 'Igazolvány másolatok'], ['meghatalmazas', 'Meghatalmazások'], ['beszerzesi', 'Beszerzési szerződés'],
  ['ertekesitesi', 'Értékesítési szerződés'], ['tuv', 'TÜV papírok'], ['coc', 'COC papírok'], ['beszerzes_alatt', 'Beszerzés alatt'],
  ['szallitas_alatt', 'Szállítás alatt'], ['leszallitva', 'Leszállítva'], ['honositva', 'Honosítva'], ['atadva', 'Átadva']
];

/**
 * Üzletáganként eltérő checklist. Szakaszok (ütemek): { id, title, items:[[kulcs, felirat]] }.
 *  close: melyik pipa állítja a státuszt „Lezárva”-ra ('all' = minden feladat kész).
 *  Eladás: két ütem — előbb bérbe adjuk (bérlő), utána eladjuk (vevő, aki a bérlőtől eltérő személy/cég).
 */
export const CHECKLISTS = {
  'Bérlés': {
    close: 'atadva',
    phases: [{ id: 'berles', title: '', items: [
      ['igazolvany', 'Igazolvány / cégadat másolatok'], ['berleti', 'Bérleti szerződés'], ['beszerzes_alatt', 'Beszerzés alatt'],
      ['szallitas_alatt', 'Szállítás alatt'], ['leszallitva', 'Leszállítva'], ['atadva', 'Átadva']] }]
  },
  'Bizományos': {
    close: 'eladva',
    phases: [{ id: 'biz', title: '', items: [
      ['igazolvany', 'Igazolvány másolatok'], ['bizomanyi', 'Bizományi szerződés'], ['forgalmi', 'Forgalmi másolatok'],
      ['hirdetes', 'Hirdetés kirakva'], ['eladva', 'Eladva']] }]
  },
  'Eladás': {
    close: 'all',
    phases: [
      { id: 'e1', title: '1. ütem — Bérlés', items: [
        ['e1_berleti', 'Bérleti szerződés'], ['e1_igazolvany', 'Igazolvány / cégadat másolatok'], ['e1_beszerzes', 'Beszerzés'],
        ['e1_szallitas', 'Szállítás'], ['e1_leszallitva', 'Leszállítva'], ['e1_atadva', 'Átadva']] },
      { id: 'e2', title: '2. ütem — Eladás', items: [
        ['e2_adasveteli', 'Adásvételi szerződés'], ['e2_igazolvany', 'Igazolvány / cégadat másolatok'], ['e2_tuv', 'TÜV'],
        ['e2_coc', 'COC'], ['e2_honositva', 'Honosítva'], ['e2_meghatalmazas', 'Meghatalmazások']] }
    ]
  }
};
const DEFAULT_CHECKLIST = { close: 'atadva', phases: [{ id: 'main', title: '', items: CHECKLIST }] };
export function checklistFor(line) { return CHECKLISTS[line] || DEFAULT_CHECKLIST; }
export function checklistItems(line) { return checklistFor(line).phases.reduce((a, p) => a.concat(p.items), []); }
export function checklistProgress(line, cl) {
  const items = checklistItems(line); cl = cl || {};
  const done = items.filter(([k]) => cl[k] && cl[k].done).length;
  return { done, total: items.length, progress: items.length ? Math.round(done / items.length * 100) : 0 };
}

export const MAX_FILE = 1400 * 1024;

/* ============================== táblák ============================== */
let READY = false;
export async function ensureCrm(env) {
  if (READY || !env.DB) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS crm_cards (
      deal_id INTEGER PRIMARY KEY, status TEXT NOT NULL DEFAULT 'Kapcsolatfelvételre vár', address TEXT DEFAULT '',
      data TEXT DEFAULT '{}', checklist TEXT DEFAULT '{}', contract TEXT DEFAULT '{}',
      status_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), updated_by INTEGER)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS crm_offers (
      token TEXT PRIMARY KEY, deal_id INTEGER NOT NULL, line TEXT DEFAULT '', client_name TEXT DEFAULT '', items TEXT NOT NULL DEFAULT '[]',
      message TEXT DEFAULT '', sent_to TEXT DEFAULT '', sent INTEGER DEFAULT 0, created_by INTEGER, created_at TEXT DEFAULT (datetime('now')),
      responded_at TEXT, action TEXT, choice INTEGER, client_msg TEXT DEFAULT '', client_ip TEXT DEFAULT '')`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_crm_offers_deal ON crm_offers (deal_id)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS crm_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT, deal_id INTEGER NOT NULL, name TEXT DEFAULT '', mime TEXT DEFAULT 'application/octet-stream',
      size INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, created_by INTEGER, created_at TEXT DEFAULT (datetime('now')))`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_crm_files_deal ON crm_files (deal_id)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS crm_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, deal_id INTEGER NOT NULL, at TEXT DEFAULT (datetime('now')),
      actor TEXT DEFAULT '', kind TEXT DEFAULT '', text TEXT DEFAULT '')`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_crm_events_deal ON crm_events (deal_id, id)`)
  ]);
  READY = true;
}

/* ============================== alapok ============================== */
export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });
}
export function parseJ(s, d) { try { const v = JSON.parse(s || ''); return v == null ? d : v; } catch (e) { return d; } }
export function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 300); }
export function cleanMulti(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').slice(0, max || 4000); }
export function randomHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map((b) => b.toString(16).padStart(2, '0')).join(''); }
export function nowIso() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
export function huToday() {
  const d = new Date(Date.now() + 3600e3); // közép-európai idő közelítőleg
  return `${d.getUTCFullYear()}. ${String(d.getUTCMonth() + 1).padStart(2, '0')}. ${String(d.getUTCDate()).padStart(2, '0')}.`;
}
export function fmtPrice(v, cur) {
  const n = Number(v) || 0;
  const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return cur === 'EUR' ? s + ' €' : s + ' Ft';
}
export function b64ToBytes(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
export function bytesToB64(u) { let s = ''; const CH = 0x8000; for (let i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); }
export async function sha256hex(u) { const b = await crypto.subtle.digest('SHA-256', typeof u === 'string' ? new TextEncoder().encode(u) : u); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }

/** A kártya (crm_cards) sora — ha még nincs, alapértelmezett értékekkel. */
/**
 * Kiinduló státusz azoknál az ügyfeleknél, akiknek még nincs CRM-kártyájuk: a régi kanban-fázisból
 * (deals.stage) képezzük, hogy a már folyamatban lévő ügyek ne „Kapcsolatfelvételre vár”-ként jelenjenek meg.
 */
const STAGE_TO_STATUS = {
  'Új': 'Kapcsolatfelvételre vár', 'Érdeklődés': 'Kapcsolatfelvételre vár',
  'Egyeztetés': 'Ajánlatra vár', 'Igény pontosítva': 'Ajánlatra vár', 'Autó keresése': 'Ajánlatra vár', 'Árazás': 'Ajánlatra vár',
  'Ajánlat': 'Ajánlat kiküldve', 'Kiválasztva': 'Ajánlat elfogadva',
  'Folyamatban': 'Megvalósítás', 'Megrendelve': 'Megvalósítás', 'Szállítás': 'Megvalósítás', 'Vám / forgalomba': 'Megvalósítás',
  'Aktív bérlés': 'Megvalósítás', 'Bizományba véve': 'Megvalósítás', 'Hirdetve': 'Megvalósítás',
  'Lezárva – sikeres': 'Lezárva', 'Lezárva': 'Lezárva', 'Átadva': 'Lezárva', 'Eladva': 'Lezárva'
};
export function statusFromDeal(d) {
  if (!d) return DEFAULT_STATUS;
  const st = STAGE_TO_STATUS[d.stage] || DEFAULT_STATUS;
  // az ügyfél már választott autót a (régi) import-ajánlatból → legalább „Ajánlat elfogadva”
  if (d.client_responded_at && STATUSES.indexOf(st) < STATUSES.indexOf('Ajánlat elfogadva')) return 'Ajánlat elfogadva';
  return st;
}
export async function getCard(env, dealId) {
  const r = await env.DB.prepare(`SELECT * FROM crm_cards WHERE deal_id = ?`).bind(dealId).first();
  if (!r) {
    const d = await env.DB.prepare(`SELECT stage, client_responded_at FROM deals WHERE id = ?`).bind(dealId).first();
    return { deal_id: dealId, status: statusFromDeal(d), address: '', data: {}, checklist: {}, contract: {}, status_at: null, updated_at: null, exists: false };
  }
  return { ...r, data: parseJ(r.data, {}), checklist: parseJ(r.checklist, {}), contract: parseJ(r.contract, {}), exists: true };
}
/** Részleges frissítés (upsert). fields: { status, address, data, checklist, contract } — az objektumokat egészben cseréli. */
/* ============================== történésnapló ============================== */
/**
 * Egy bejegyzés az ügyfél történésnaplójába. mergeMin > 0: ha ugyanaz a szereplő ugyanilyen típusú
 * bejegyzést írt az elmúlt mergeMin percben, azt frissíti (pl. az adatlap automatikus mentései ne töltsék tele a naplót).
 */
export async function addEvent(env, dealId, kind, text, actor, mergeMin) {
  try {
    if (mergeMin) {
      const last = await env.DB.prepare(`SELECT id, kind, actor, at FROM crm_events WHERE deal_id = ? AND kind = ? AND actor = ? ORDER BY id DESC LIMIT 1`).bind(dealId, kind, actor || '').first();
      if (last && Date.now() - new Date(String(last.at).replace(' ', 'T') + 'Z').getTime() < mergeMin * 60000) {
        await env.DB.prepare(`UPDATE crm_events SET at = datetime('now'), text = ? WHERE id = ?`).bind(String(text).slice(0, 1000), last.id).run();
        return;
      }
    }
    await env.DB.prepare(`INSERT INTO crm_events (deal_id, actor, kind, text) VALUES (?, ?, ?, ?)`).bind(dealId, actor || '', kind || '', String(text).slice(0, 1000)).run();
  } catch (e) { /* a napló hibája soha nem akadályozza a műveletet */ }
}
export async function listEvents(env, dealId) {
  return ((await env.DB.prepare(`SELECT id, at, actor, kind, text FROM crm_events WHERE deal_id = ? ORDER BY at DESC, id DESC LIMIT 500`).bind(dealId).all()).results || [])
    .map((e) => ({ ...e, kind: String(e.kind || '').split(':')[0] }));
}

/** actor: ki végezte (munkatárs neve / „Ügyfél”) — a státuszváltozás bekerül a naplóba. */
export async function saveCard(env, dealId, fields, userId, actor, reason) {
  const cur = await getCard(env, dealId);
  const next = {
    status: fields.status !== undefined ? fields.status : cur.status,
    address: fields.address !== undefined ? fields.address : cur.address,
    data: fields.data !== undefined ? fields.data : cur.data,
    checklist: fields.checklist !== undefined ? fields.checklist : cur.checklist,
    contract: fields.contract !== undefined ? fields.contract : cur.contract
  };
  const statusChanged = next.status !== cur.status || !cur.exists;
  await env.DB.prepare(`INSERT INTO crm_cards (deal_id, status, address, data, checklist, contract, status_at, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      ON CONFLICT(deal_id) DO UPDATE SET status = excluded.status, address = excluded.address, data = excluded.data,
        checklist = excluded.checklist, contract = excluded.contract,
        status_at = CASE WHEN crm_cards.status <> excluded.status THEN datetime('now') ELSE crm_cards.status_at END,
        updated_at = datetime('now'), updated_by = excluded.updated_by`)
    .bind(dealId, next.status, next.address || '', JSON.stringify(next.data || {}), JSON.stringify(next.checklist || {}), JSON.stringify(next.contract || {}), userId || null).run();
  if (next.status !== cur.status) await addEvent(env, dealId, 'status', `Státusz: ${cur.status} → ${next.status}${reason ? ' (' + reason + ')' : ''}`, actor);
  return { ...next, statusChanged };
}

/* ============================== készlet (Google-tábla) ============================== */
const SHEET = 'https://docs.google.com/spreadsheets/d/1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y/gviz/tq?tqx=out:csv';
export function parseCsv(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  return rows.filter((r) => r.some((x) => x !== '')).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}
const num = (v) => { const n = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const yes = (v) => /^(igen|yes|true|1|x)$/i.test(String(v || '').trim());

/**
 * Az üzletághoz tartozó autók a közös Google-táblából (ugyanaz, amiből a weboldal épül).
 *  Bérlés: havi bérleti díj (berlet_eur) · Eladás: vételár (vetel_huf, ha nincs: vetel_eur)
 *  Import: vételár EUR-ban · Bizományos: a "bizomanyos" lap.
 */
export async function inventory(line) {
  const src = line === 'Bizományos' ? SHEET + '&sheet=bizomanyos' : SHEET;
  const r = await fetch(src, { cf: { cacheTtl: 120, cacheEverything: true } });
  if (!r.ok) throw new Error('A készlet-tábla nem érhető el (' + r.status + ').');
  const rows = parseCsv(await r.text());
  const out = [];
  rows.forEach((x, i) => {
    if (!x.modell) return;
    if (yes(x.elkelt)) return;
    let price = 0, currency = 'EUR', period = '';
    if (line === 'Bérlés') { price = num(x.berlet_eur); period = 'hó'; if (!price) return; }
    else if (line === 'Eladás') { if (num(x.vetel_huf)) { price = num(x.vetel_huf); currency = 'HUF'; } else price = num(x.vetel_eur); if (!price) return; }
    else if (line === 'Import') { price = num(x.vetel_eur); if (!price) return; }
    else price = num(x.vetel_eur);
    out.push({
      key: (line === 'Bizományos' ? 'biz-' : 'inv-') + (x.slug || x.mobile_id || x.kulcs || i),
      title: x.modell, brand: x.marka || '', body: x.karosszeria || '', km: x.km || '', power: x.teljesitmeny || '',
      gearbox: x.valto || '', fuel: x.uzemanyag || '', year: x.evjarat || '', drive: x.hajtas || '',
      image: x.kep_url_manual || x.kep_url || '', active: line === 'Bizományos' ? !/^nem$/i.test(x.aktiv || '') : yes(x.aktiv),
      price, currency, period,
      deposit: line === 'Bérlés' ? num(x.kaucio_eur) : 0,
      url: x.slug ? `${SITE}/${line === 'Bérlés' ? 'berles' : 'auto'}/${x.slug}/` : ''
    });
  });
  return out;
}

/* ============================== ajánlat e-mail ============================== */
export function specLine(it) {
  return [it.year, it.km ? (String(it.km).match(/km/i) ? it.km : it.km + ' km') : '', it.fuel, it.power, it.gearbox].filter(Boolean).join(' · ');
}
export function priceLabel(it) { return fmtPrice(it.price, it.currency) + (it.period ? ' / ' + it.period : ''); }

export function offerEmailHtml({ clientName, items, message, link }) {
  const cards = items.map((it, i) => `
  <tr><td style="padding:0 0 14px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6eaf1;border-radius:12px;overflow:hidden">
      ${it.image ? `<tr><td><img src="${esc(it.image)}" alt="" width="472" style="display:block;width:100%;max-width:472px;height:auto;border:0"></td></tr>` : ''}
      <tr><td style="padding:14px 16px">
        <div style="font-size:16px;font-weight:bold;color:#141519">${esc(it.title)}</div>
        ${specLine(it) ? `<div style="font-size:13px;color:#6b7280;margin-top:3px">${esc(specLine(it))}</div>` : ''}
        ${it.note ? `<div style="font-size:13px;color:#374151;margin-top:6px">${esc(it.note)}</div>` : ''}
        <div style="font-size:18px;font-weight:bold;color:#e2001a;margin-top:10px">${esc(priceLabel(it))}</div>
        <div style="margin-top:12px"><a href="${esc(link)}&amp;v=${i}" style="background:#141519;color:#fff;text-decoration:none;font-weight:bold;font-size:13px;padding:10px 18px;border-radius:999px;display:inline-block">Ezt választom</a></div>
      </td></tr>
    </table>
  </td></tr>`).join('');
  return `<p>Kedves ${esc(clientName || 'Ügyfelünk')}!</p>
<p>Köszönjük megkeresését! Az Ön igényei alapján az alábbi ${items.length > 1 ? 'ajánlatokat' : 'ajánlatot'} állítottuk össze.${items.length > 1 ? ' Válassza ki, melyik autó érdekli – mindegyiknél látja, mennyibe kerül.' : ''}</p>
${message ? `<p style="background:#f4f7fb;border-radius:10px;padding:12px 14px;white-space:pre-line">${esc(message)}</p>` : ''}
<table width="100%" cellpadding="0" cellspacing="0">${cards}</table>
<p style="margin:18px 0 8px">A kiválasztott autóra vonatkozó ajánlatot egy kattintással elfogadhatja, vagy módosítást kérhet:</p>
<p style="margin:0 0 6px">
  <a href="${esc(link)}&amp;a=elfogad" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block;margin:0 6px 8px 0">Ajánlat elfogadása</a>
  <a href="${esc(link)}&amp;a=modosit" style="background:#fff;color:#141519;text-decoration:none;font-weight:bold;padding:11px 21px;border-radius:999px;display:inline-block;border:1px solid #c9ced8;margin:0 0 8px">Módosítást kérek</a>
</p>
<p style="color:#9aa2ad;font-size:12px">Ha a gombok nem működnek, nyissa meg ezt a linket: ${esc(link)}</p>`;
}

/* ============================== szerződéssablonok ============================== */
/**
 * A sablonok szövege szabadon szerkeszthető az adatlapon (és piszkozatként menthető).
 * {{valtozo}} helyére a változók értéke kerül. Sorok: "# " = cím, "## " = fejezetcím, üres sor = bekezdés.
 * FONTOS: ezek kiinduló tervezetek — élesítés előtt a cég jogászának jóvá kell hagynia / a saját mintára cserélni.
 */
export const VAR_LABELS = {
  szerzodes_szam: 'Szerződésszám', keltezes_hely: 'Keltezés helye', keltezes_datum: 'Keltezés dátuma',
  ceg_nev: 'CarAdvance fél neve', ceg_szekhely: 'CarAdvance székhely', ceg_cegjegyzek: 'CarAdvance cégjegyzék', ceg_adoszam: 'CarAdvance adószám', ceg_kepviselo: 'CarAdvance képviselő',
  ugyfel_nev: 'Ügyfél neve / cégnév', ugyfel_cim: 'Ügyfél címe / székhelye', ugyfel_adoszam: 'Ügyfél adószáma', ugyfel_cegjegyzekszam: 'Cégjegyzékszám', ugyfel_kepviselo: 'Kapcsolattartó / képviselő',
  ugyfel_telefon: 'Ügyfél telefon', ugyfel_email: 'Ügyfél e-mail',
  auto_megnevezes: 'Gépjármű megnevezése', auto_marka: 'Márka', auto_tipus: 'Típus', auto_evjarat: 'Évjárat', auto_alvazszam: 'Alvázszám', auto_szin: 'Szín',
  auto_motor: 'Motor', auto_uzemanyag: 'Üzemanyag', auto_km: 'Km-óra állás', auto_hibrid: 'Hibrid',
  ar: 'Vételár / díj', fizetesi_mod: 'Fizetési mód', atadas_datum: 'Átadás dátuma', atadas_hely: 'Átadás helye',
  havi_dij: 'Havi bérleti díj', kaucio: 'Kaució', futamido: 'Bérleti idő', km_keret: 'Km-keret',
  eloleg: 'Előleg', szallitasi_hatarido: 'Szállítási határidő', megbizasi_dij: 'Megbízási díj',
  min_eladasi_ar: 'Minimális eladási ár', jutalek: 'Bizományi díj (jutalék)', bizomany_idotartam: 'Bizomány időtartama'
};
export const LINE_VARS = {
  'Eladás': ['ar', 'fizetesi_mod', 'atadas_datum', 'atadas_hely'],
  'Import': ['ar', 'eloleg', 'megbizasi_dij', 'szallitasi_hatarido', 'atadas_hely', 'fizetesi_mod'],
  'Bérlés': ['havi_dij', 'kaucio', 'futamido', 'km_keret', 'atadas_datum', 'atadas_hely', 'fizetesi_mod'],
  'Bizományos': ['min_eladasi_ar', 'jutalek', 'bizomany_idotartam', 'atadas_datum', 'atadas_hely']
};
export const COMMON_VARS = ['szerzodes_szam', 'keltezes_hely', 'keltezes_datum', 'ceg_nev', 'ceg_szekhely', 'ceg_cegjegyzek', 'ceg_adoszam', 'ceg_kepviselo',
  'ugyfel_nev', 'ugyfel_cim', 'ugyfel_adoszam', 'ugyfel_cegjegyzekszam', 'ugyfel_kepviselo', 'ugyfel_telefon', 'ugyfel_email',
  'auto_megnevezes', 'auto_marka', 'auto_tipus', 'auto_evjarat', 'auto_alvazszam', 'auto_szin', 'auto_motor', 'auto_uzemanyag', 'auto_km', 'auto_hibrid'];

const PARTIES = (role1, role2) => `## 1. Szerződő felek
${role1}: {{ceg_nev}}
Székhely: {{ceg_szekhely}} · Cégjegyzék: {{ceg_cegjegyzek}} · Adószám: {{ceg_adoszam}}
Képviseli: {{ceg_kepviselo}}

${role2}: {{ugyfel_nev}}
Cím / székhely: {{ugyfel_cim}} · Adószám: {{ugyfel_adoszam}} · Cégjegyzékszám: {{ugyfel_cegjegyzekszam}}
Kapcsolattartó / képviselő: {{ugyfel_kepviselo}} · Telefon: {{ugyfel_telefon}} · E-mail: {{ugyfel_email}}`;

const VEHICLE = `## 2. A gépjármű adatai
Megnevezés: {{auto_megnevezes}}
Márka: {{auto_marka}} · Típus: {{auto_tipus}} · Évjárat: {{auto_evjarat}}
Alvázszám: {{auto_alvazszam}} · Szín: {{auto_szin}}
Motor: {{auto_motor}} · Üzemanyag: {{auto_uzemanyag}} · Hibrid: {{auto_hibrid}} · Km-óra állás: {{auto_km}}`;

const CLOSING = (r1, r2) => `## Záró rendelkezések
A jelen szerződésben nem szabályozott kérdésekben a Polgári Törvénykönyvről szóló 2013. évi V. törvény rendelkezései az irányadók. A felek a vitás kérdéseket elsősorban tárgyalás útján rendezik.

A szerződés módosítása kizárólag írásban érvényes. A felek a szerződést elolvasás és közös értelmezés után, mint akaratukkal mindenben egyezőt, jóváhagyólag írják alá.

Kelt: {{keltezes_hely}}, {{keltezes_datum}}

[aláírás] ${r1} | ${r2}`;

export const TEMPLATES = {
  'Eladás': `# GÉPJÁRMŰ ADÁSVÉTELI SZERZŐDÉS
Szerződésszám: {{szerzodes_szam}}

${PARTIES('Eladó', 'Vevő')}

${VEHICLE}

## 3. Vételár és fizetés
A gépjármű vételára: {{ar}}. Fizetési mód: {{fizetesi_mod}}.
A tulajdonjog a vételár teljes kiegyenlítésével száll át a Vevőre.

## 4. Átadás-átvétel
Az átadás tervezett időpontja: {{atadas_datum}}, helye: {{atadas_hely}}. Az átadáskor a felek átadás-átvételi jegyzőkönyvet vesznek fel, amely rögzíti a km-óra állását, a gépjármű állapotát, a tartozékokat és az átadott okmányokat.

## 5. Szavatosság, állapot
A Vevő a gépjárművet megtekintette, állapotát megismerte. Az Eladó szavatol azért, hogy a gépjármű per-, teher- és igénymentes. Az Eladó a gépjármű ismert hibáiról a Vevőt tájékoztatta.

## 6. Átírás, költségek
A tulajdonjog-változás bejegyzését a Vevő az átadástól számított 15 napon belül kezdeményezi; az átírás költségei a Vevőt terhelik, kivéve, ha a felek másként állapodnak meg.

${CLOSING('Eladó', 'Vevő')}`,

  'Import': `# MEGBÍZÁSI SZERZŐDÉS GÉPJÁRMŰ BESZERZÉSÉRE (IMPORT)
Szerződésszám: {{szerzodes_szam}}

${PARTIES('Megbízott', 'Megbízó')}

${VEHICLE}

## 3. A megbízás tárgya
A Megbízó megbízza a Megbízottat a fenti gépjármű külföldi beszerzésével, Magyarországra szállításával és – külön kérés esetén – forgalomba helyezésének (honosításának) ügyintézésével.

## 4. Ár, előleg, megbízási díj
A gépjármű teljes ára (beszerzés + szállítás): {{ar}}.
Előleg: {{eloleg}}, amely a szerződés aláírásakor esedékes. Megbízási díj: {{megbizasi_dij}}. A fennmaradó összeg az átadás előtt, {{fizetesi_mod}} útján fizetendő.

## 5. Határidők, átadás
Várható szállítási határidő: {{szallitasi_hatarido}}. Az átadás helye: {{atadas_hely}}. A Megbízott a beszerzés és a szállítás állapotáról a Megbízót folyamatosan tájékoztatja.

## 6. Okmányok
A Megbízott átadja a gépjármű forgalomba helyezéséhez szükséges okmányokat (COC, TÜV/műszaki, adásvételi szerződés, eredetiségvizsgálathoz szükséges iratok).

## 7. Elállás
Ha a gépjármű beszerzése a Megbízottnak fel nem róható okból meghiúsul, a Megbízott az előleget 8 napon belül visszafizeti. A Megbízó elállása esetén a Megbízott a már felmerült, igazolt költségeit az előlegből levonhatja.

${CLOSING('Megbízott', 'Megbízó')}`,

  'Bérlés': `# GÉPJÁRMŰ BÉRLETI SZERZŐDÉS
Szerződésszám: {{szerzodes_szam}}

${PARTIES('Bérbeadó', 'Bérlő')}

${VEHICLE}

## 3. Bérleti díj, kaució
Havi bérleti díj: {{havi_dij}}. Kaució: {{kaucio}}. Fizetési mód: {{fizetesi_mod}}.
A bérleti díj havonta előre esedékes.

## 4. Bérleti idő, km-keret
A bérleti idő: {{futamido}}. A havi km-keret: {{km_keret}}; a túlfutást a Bérbeadó a mindenkori díjszabás szerint számlázza.

## 5. Átadás és visszaadás
Az átadás tervezett időpontja: {{atadas_datum}}, helye: {{atadas_hely}}. A Bérlő a gépjárművet a bérlet végén rendeltetésszerű használatból eredő kopással, tisztán, tele tankkal (töltöttséggel) köteles visszaadni.

## 6. Használat, biztosítás
A gépjárművet csak a Bérlő, illetve az általa megnevezett, érvényes jogosítvánnyal rendelkező személyek vezethetik. A gépjármű kötelező és casco biztosítással rendelkezik; káresemény esetén az önrész a Bérlőt terheli.

${CLOSING('Bérbeadó', 'Bérlő')}`,

  'Bizományos': `# BIZOMÁNYI SZERZŐDÉS GÉPJÁRMŰ ÉRTÉKESÍTÉSÉRE
Szerződésszám: {{szerzodes_szam}}

${PARTIES('Bizományos', 'Megbízó (tulajdonos)')}

${VEHICLE}

## 3. A bizomány tárgya
A Megbízó megbízza a Bizományost, hogy a fenti gépjárművet saját nevében, a Megbízó javára értékesítse.

## 4. Eladási ár, bizományi díj
A minimális eladási ár: {{min_eladasi_ar}}. Ennél alacsonyabb áron a Bizományos csak a Megbízó írásbeli hozzájárulásával értékesíthet.
Bizományi díj: {{jutalek}}, amely az eladáskor, a vételárból kerül levonásra. A fennmaradó összeget a Bizományos a vételár beérkezésétől számított 5 munkanapon belül fizeti ki a Megbízónak.

## 5. Időtartam, a gépjármű átadása
A bizomány időtartama: {{bizomany_idotartam}}. A gépjármű és okmányainak átadása: {{atadas_datum}}, {{atadas_hely}}.

## 6. Felelősség
A Megbízó szavatol azért, hogy a gépjármű per-, teher- és igénymentes, és a közölt adatok (km-óra állás, előélet) a valóságnak megfelelnek. A Bizományos a nála lévő gépjárműért a bizomány ideje alatt felelős.

${CLOSING('Bizományos', 'Megbízó')}`
};

/** A változók alapértékei az adatlapból + a kiválasztott (elfogadott) autóból. */
export function defaultVars(deal, card, chosen, opts) {
  opts = opts || {};
  const all = card.data || {}; const v = all.vehicle || {};
  // party: kinek a nevére szól a szerződés — alapból az ügyfél (Eladásnál a bérlő), az adásvételinél a vevő
  const d = opts.party || all; const p = d.person || {}; const co = d.company || {};
  const useDeal = !opts.party; // a vevőnél nem töltjük az érdeklődő adataival
  const isCo = d.kind === 'ceg';
  const ch = chosen || null;
  const priceTxt = ch ? priceLabel(ch) : (deal.price ? fmtPrice(deal.price, 'HUF') : '');
  const contactSep = isCo && d.contact_differs && d.contact ? d.contact : null;
  const vars = {
    szerzodes_szam: `CA-${opts.code || ({ 'Eladás': 'ELA', 'Import': 'IMP', 'Bérlés': 'BER', 'Bizományos': 'BIZ' })[deal.line] || 'SZ'}-${new Date().getUTCFullYear()}-${String(deal.id).padStart(4, '0')}`,
    keltezes_hely: 'Solymár', keltezes_datum: huToday(),
    ceg_nev: LESSOR.name, ceg_szekhely: LESSOR.seat[0], ceg_cegjegyzek: LESSOR.reg, ceg_adoszam: LESSOR.vat, ceg_kepviselo: LESSOR.md,
    ugyfel_nev: isCo ? (co.name || (useDeal ? deal.name : '') || '') : (p.name || (useDeal ? deal.name : '') || ''),
    ugyfel_cim: isCo ? (co.address || '') : (p.address || (useDeal ? card.address : '') || ''),
    ugyfel_adoszam: isCo ? (co.tax || '') : (p.tax || ''),
    ugyfel_cegjegyzekszam: isCo ? (co.reg || '') : '—',
    ugyfel_kepviselo: contactSep ? [contactSep.name, contactSep.phone, contactSep.email].filter(Boolean).join(', ') : (isCo ? (p.name || (useDeal ? deal.name : '') || '') : '—'),
    ugyfel_telefon: (contactSep && contactSep.phone) || p.phone || (useDeal ? deal.phone : '') || '',
    ugyfel_email: (contactSep && contactSep.email) || p.email || (useDeal ? deal.email : '') || '',
    auto_megnevezes: ch ? ch.title : ([v.brand, v.model].filter(Boolean).join(' ') || deal.car || ''),
    // ha az ügyfél elfogadott egy ajánlott autót, annak adatai az elsődlegesek; az alvázszám/szín az adatlapról jön
    auto_marka: (ch && ch.brand) || v.brand || '',
    auto_tipus: ch ? (ch.brand && ch.title.indexOf(ch.brand) === 0 ? ch.title.slice(ch.brand.length).trim() : ch.title) : (v.model || ''),
    auto_evjarat: (ch && ch.year) || v.year || '',
    auto_alvazszam: v.vin || '', auto_szin: v.color || '', auto_motor: (ch && ch.power) || v.engine || '',
    auto_uzemanyag: (ch && ch.fuel) || v.fuel || '', auto_km: (ch && ch.km) || v.km || '', auto_hibrid: v.hybrid ? 'igen' : 'nem',
    ar: priceTxt, fizetesi_mod: 'banki átutalás', atadas_datum: '', atadas_hely: 'Solymár, Ibolya utca 18',
    havi_dij: ch && ch.period ? fmtPrice(ch.price, ch.currency) : priceTxt, kaucio: ch && ch.deposit ? fmtPrice(ch.deposit, ch.currency) : '',
    futamido: '12 hónap', km_keret: '1 500 km/hó',
    eloleg: '', szallitasi_hatarido: '', megbizasi_dij: '',
    min_eladasi_ar: priceTxt, jutalek: '', bizomany_idotartam: '90 nap'
  };
  return vars;
}
export function varsFor(line) { return COMMON_VARS.concat(LINE_VARS[line] || []); }
export function fillTemplate(text, vars) {
  return String(text || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (m, k) => {
    const v = vars && vars[k] != null ? String(vars[k]).trim() : '';
    return v || '…………………';
  });
}

/* ============================== PDF ============================== */
/** Egyszerű, egyhasábos szerződés-PDF a kitöltött szövegből (ugyanaz a betűkészlet, mint az online bérleti szerződésé). */
export function contractPdfFromText(filled, meta) {
  meta = meta || {};
  const p = new Pdf();
  const head = () => {
    p.rect(0, 841.89 - 58, PW, 58, '0.043 0.043 0.051'); p.rect(0, 841.89 - 61, PW, 3, '0.886 0 0.102');
    p.draw('CarAdvance', ML, 841.89 - 36, 'B', 17, '1 1 1');
    p.draw('Bérlés · Import · Eladás', ML, 841.89 - 49, 'R', 8, '0.75 0.77 0.82');
    const t = meta.number || ''; p.draw(t, PW - MR - p.width(t, 'R', 8.5), 841.89 - 36, 'R', 8.5, '0.85 0.86 0.9');
    p.y = 841.89 - 84;
  };
  head();
  const lines = String(filled || '').split('\n');
  let blank = false;
  for (const raw of lines) {
    const ln = raw.replace(/\t/g, '    ');
    if (!ln.trim()) { if (!blank) p.y -= 5; blank = true; continue; }
    blank = false;
    if (/^Kelt:/.test(ln)) p.ensure(110); // a keltezés maradjon együtt az aláírásokkal
    if (ln.startsWith('# ')) { p.ensure(30); p.y -= 4; p.para(ln.slice(2), { bold: true, size: 13.5, after: 6 }); continue; }
    if (ln.startsWith('## ')) { p.ensure(34); p.y -= 6; p.para(ln.slice(3), { bold: true, size: 10.5, after: 3, color: '0.886 0 0.102' }); continue; }
    const sg = ln.match(/^\[aláírás\]\s*(.*)$/i);
    if (sg) { // aláírási blokk: két vonal, alatta a felek megnevezése
      const parts = sg[1].split('|').map((x) => x.trim()); const colW = (PW - ML - MR - 40) / 2; const x2 = ML + colW + 40;
      p.ensure(70); p.y -= 40;
      p.cur.push(`0.5 0.52 0.6 RG 0.6 w ${ML} ${p.y.toFixed(2)} m ${(ML + colW).toFixed(2)} ${p.y.toFixed(2)} l S`);
      p.cur.push(`0.5 0.52 0.6 RG 0.6 w ${x2.toFixed(2)} ${p.y.toFixed(2)} m ${(PW - MR).toFixed(2)} ${p.y.toFixed(2)} l S`);
      p.y -= 13; p.draw(parts[0] || '', ML, p.y, 'B', 9); if (parts[1]) p.draw(parts[1], x2, p.y, 'B', 9);
      p.y -= 8; continue;
    }
    p.para(ln, { size: 9.6, after: 2 });
  }
  return p.build({ title: meta.title || 'Szerződés', number: meta.number || '', hash: meta.hash || '' });
}

/* ============================== e-mail (Resend) ============================== */
export function emailShell(inner) {
  return `<div style="background:#f4f7fb;padding:24px 12px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#141519">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf1">
    <div style="background:#0b0b0d;padding:18px 24px"><img src="${SITE}/caradvance-logo-email.png" alt="CarAdvance" width="180" height="60" style="width:180px;height:60px;display:block;border:0"></div>
    <div style="padding:26px 24px 22px">${inner}</div>
    <div style="padding:14px 24px;background:#f4f7fb;color:#6b7280;font-size:12px;line-height:1.55"><b style="color:#141519">CarAdvance</b> · ${esc(LESSOR.helper)} · ${esc(LESSOR.helperOffice)}<br>Kérdés esetén válaszoljon erre az e-mailre, vagy hívjon: +36 30 233 6060.</div>
  </div></div>`;
}
/** to: string vagy tömb. attachments: [{ filename, content(base64) }]. Visszatér: { ok, error } */
export async function sendCrmMail(env, to, subject, inner, attachments) {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'Az e-mail küldés nincs beállítva (hiányzó RESEND_API_KEY).' };
  const body = {
    from: env.CUSTOMER_EMAIL_FROM || env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>',
    to: (Array.isArray(to) ? to : String(to).split(',')).map((s) => s.trim()).filter(Boolean),
    reply_to: env.CUSTOMER_REPLY_TO || 'info@caradvance.hu', subject, html: emailShell(inner),
    text: inner.replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|tr|div)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim()
  };
  if (attachments && attachments.length) body.attachments = attachments;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.ok) return { ok: true };
  return { ok: false, error: 'E-mail küldési hiba: ' + (await r.text().catch(() => r.status)).slice(0, 300) };
}
export function notifyTo(env) { return env.CRM_NOTIFY_TO || env.CONTRACT_NOTIFY_TO || 'info@caradvance.hu'; }
