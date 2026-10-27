/**
 * CarAdvance — belső PÉNZÜGY modul (dinamikus eredménykimutatás / P&L)
 *
 * Adatforrás: banki kivonat-exportok (XLS, a böngészőben feldolgozva), kézi tételek,
 * bizonylatok (feltöltés vagy NAV Online Számla lekérdezés). Minden tétel kap:
 *   - kategóriát (fin_cats: árbevétel / közvetlen / működési / adó-pénzügyi / nem eredményhatású),
 *   - üzletág-felosztást (split: [{l: line_id, p: százalék}] — pl. CarAdvance 100%, vagy Közös),
 *   - ÁFA-kulcsot (levonható / fizetendő; nettósításhoz), bizonylat-igényt.
 * A besorolást szabályok végzik (fin_rules, regex a partner/közlemény/típus/IBAN szövegén),
 * kézi módosítás után a tételt a szabályok már nem írják felül (manual = 1).
 *
 * Táblák: fin_accounts, fin_lines, fin_cats, fin_rules, fin_tx, fin_docs, fin_files, fin_fx, fin_settings
 * A repó nyilvános: ide semmilyen pénzügyi adat vagy titok nem kerülhet — minden adat a D1-ben,
 * a NAV hozzáférés Cloudflare titkos környezeti változókban (NAV_LOGIN, NAV_PASSWORD, NAV_SIGN_KEY, NAV_TAX_NUMBER).
 */

/* ============================== segédek ============================== */
export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...extra } });
}
export function parseJ(s, d) { try { const v = JSON.parse(s || ''); return v == null ? d : v; } catch (e) { return d; } }
export function nowIso() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
export function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 300); }
export function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
export function addDays(d, n) { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
export function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
/** Ékezet, aposztróf (a bank „AUTO'MOSO'” írásmódja) eltávolítása, nagybetű — a szabályok ezen futnak. */
export function norm(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ŁłØøß]/g, (c) => ({ 'Ł': 'L', 'ł': 'l', 'Ø': 'O', 'ø': 'o', 'ß': 'ss' }[c]))
    .replace(/['`´’]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}
function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
/** Excel dátum-sorszám (1900-as rendszer) vagy ISO / „2026.10.22.” → ISO nap. */
export function toIsoDate(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number' || /^\d{5}(\.\d+)?$/.test(String(v))) {
    const n = Math.floor(Number(v));
    return new Date(Date.UTC(1899, 11, 30) + n * 864e5).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = /^(\d{4})[.\-\/ ]+(\d{1,2})[.\-\/ ]+(\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = /^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}
/** „-52.594,00” / „1 234,5” / szám → szám */
export function toNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v == null ? '' : v).replace(/\s| /g, '');
  if (!s) return NaN;
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  return Number(s);
}
async function sha256Hex(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
/** Kártyaszám maszkolása: 4021150015098957 → 4021…8957 (teljes PAN nem kerül az adatbázisba). */
export function maskPan(s) { return String(s || '').replace(/\b(\d{4})\d{6,9}(\d{4})\b/g, '$1…$2'); }

/* ============================== táblák + alapadatok ============================== */
let READY = false;
export async function ensureFin(env) {
  if (READY || !env.DB) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', ext_id TEXT UNIQUE, currency TEXT NOT NULL DEFAULT 'HUF', kind TEXT NOT NULL DEFAULT 'bank', entity TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE, name TEXT NOT NULL, color TEXT DEFAULT '#5A6B82', shared INTEGER DEFAULT 0, sort INTEGER DEFAULT 100, active INTEGER DEFAULT 1)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_cats (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE, name TEXT NOT NULL, kind TEXT NOT NULL, grp TEXT DEFAULT '', doc_mode TEXT DEFAULT 'invoice', vat INTEGER DEFAULT 0, sort INTEGER DEFAULT 100, active INTEGER DEFAULT 1)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, prio INTEGER DEFAULT 100, name TEXT DEFAULT '', pattern TEXT NOT NULL, dir TEXT DEFAULT 'any', cat_id INTEGER, split TEXT, vat INTEGER, doc_mode TEXT, active INTEGER DEFAULT 1, hits INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_tx (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT UNIQUE, account_id INTEGER, src TEXT DEFAULT 'bank', bdate TEXT NOT NULL, vdate TEXT DEFAULT '', ttype TEXT DEFAULT '', bank_ref TEXT DEFAULT '',
      amount REAL NOT NULL, currency TEXT NOT NULL DEFAULT 'HUF', fx REAL, amount_huf REAL, partner TEXT DEFAULT '', iban TEXT DEFAULT '', memo TEXT DEFAULT '',
      cat_id INTEGER, split TEXT, vat INTEGER, doc_mode TEXT, doc_id INTEGER, match_kind TEXT, rule_id INTEGER, manual INTEGER DEFAULT 0, note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT, updated_by TEXT)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_fin_tx_date ON fin_tx (bdate)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_fin_tx_doc ON fin_tx (doc_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_fin_tx_ref ON fin_tx (account_id, bank_ref)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_docs (id INTEGER PRIMARY KEY AUTOINCREMENT, dir TEXT DEFAULT 'in', kind TEXT DEFAULT 'szamla', source TEXT DEFAULT 'upload', nav_key TEXT UNIQUE, op TEXT DEFAULT '',
      number TEXT DEFAULT '', partner TEXT DEFAULT '', partner_tax TEXT DEFAULT '', issue_date TEXT DEFAULT '', perf_date TEXT DEFAULT '', pay_date TEXT DEFAULT '', pay_method TEXT DEFAULT '',
      currency TEXT DEFAULT 'HUF', net REAL, vat REAL, gross REAL, net_huf REAL, vat_huf REAL, gross_huf REAL,
      file_name TEXT DEFAULT '', file_mime TEXT DEFAULT '', file_size INTEGER DEFAULT 0, note TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), created_by TEXT)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_fin_docs_date ON fin_docs (issue_date)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_files (doc_id INTEGER NOT NULL, part INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (doc_id, part))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_fx (cur TEXT NOT NULL, date TEXT NOT NULL, rate REAL NOT NULL, PRIMARY KEY (cur, date))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS fin_settings (k TEXT PRIMARY KEY, v TEXT)`)
  ]);
  const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM fin_lines`).first();
  if (!n || !n.n) await seed(env);
  READY = true;
}

/* ---- alap üzletágak ---- */
const SEED_LINES = [
  ['CA', 'CarAdvance', '#E2001A', 0, 10],
  ['CUKOR', 'Cukorkereskedelem', '#B45309', 0, 20],
  ['EGYEB', 'Egyéb üzlet', '#2554B8', 0, 30],
  ['KOZOS', 'Közös (felosztandó)', '#64748B', 1, 80],
  ['MAGAN', 'Magán / nem üzleti', '#8A5A72', 0, 90]
];
/* ---- alap kategóriák: [code, name, kind, grp, doc_mode, ÁFA%] ----
 * kind: rev = árbevétel, cogs = közvetlen költség, opex = működési, below = adó/pénzügyi, excl = nem eredményhatású
 * ÁFA% = a bruttó összegben lévő, LEVONHATÓ (költség) / FIZETENDŐ (bevétel) áfa kulcsa. 0 = a bruttó a költség
 * (pl. személyautó üzemanyag, külföldi fordított adózású szolgáltatás, magánszemély bérbeadó). Tételenként felülírható. */
const SEED_CATS = [
  ['REV_AUTO', 'Autóértékesítés', 'rev', 'Árbevétel', 'invoice', 0],
  ['REV_BERLES', 'Autóbérlés bevétel', 'rev', 'Árbevétel', 'invoice', 27],
  ['REV_JUTALEK', 'Jutalék, bizományi díj', 'rev', 'Árbevétel', 'invoice', 27],
  ['REV_ARU', 'Áruértékesítés (kereskedelem)', 'rev', 'Árbevétel', 'invoice', 0],
  ['REV_EGYEB', 'Egyéb bevétel', 'rev', 'Árbevétel', 'invoice', 27],
  ['COGS_AUTO', 'Autóbeszerzés', 'cogs', 'Közvetlen költségek', 'invoice', 0],
  ['COGS_ARU', 'Árubeszerzés', 'cogs', 'Közvetlen költségek', 'invoice', 0],
  ['COGS_LOG', 'Szállítás, logisztika, vám', 'cogs', 'Közvetlen költségek', 'invoice', 27],
  ['COGS_ELOK', 'Autó előkészítés, javítás', 'cogs', 'Közvetlen költségek', 'invoice', 27],
  ['PERS_BER', 'Bérek (nettó)', 'opex', 'Személyi jellegű', 'none', 0],
  ['PERS_JAR', 'Bérjárulékok, SZJA, TB, szocho', 'opex', 'Személyi jellegű', 'none', 0],
  ['PERS_MEGB', 'Megbízási, alvállalkozói díjak', 'opex', 'Személyi jellegű', 'invoice', 0],
  ['OFF_BERLET', 'Irodabérlet', 'opex', 'Iroda és működés', 'none', 0],
  ['OFF_REZSI', 'Rezsi, közüzem, telefon', 'opex', 'Iroda és működés', 'invoice', 27],
  ['OFF_KONYV', 'Könyvelés, jog, tanácsadás', 'opex', 'Iroda és működés', 'invoice', 27],
  ['OFF_TAGDIJ', 'Tagdíjak, kamara', 'opex', 'Iroda és működés', 'none', 0],
  ['OFF_BANK', 'Bankköltség', 'opex', 'Iroda és működés', 'none', 0],
  ['OFF_EGYEB', 'Egyéb működési költség', 'opex', 'Iroda és működés', 'invoice', 27],
  ['VEH_UZEM', 'Üzemanyag', 'opex', 'Jármű és utazás', 'invoice', 0],
  ['VEH_UTDIJ', 'Útdíj, matrica, parkolás', 'opex', 'Jármű és utazás', 'invoice', 0],
  ['VEH_BERLES', 'Autóbérlés, lízing (használt autók)', 'opex', 'Jármű és utazás', 'invoice', 0],
  ['VEH_SZERVIZ', 'Jármű szerviz, mosás', 'opex', 'Jármű és utazás', 'invoice', 0],
  ['TRAVEL', 'Utazás, szállás', 'opex', 'Jármű és utazás', 'invoice', 0],
  ['MKT_ADS', 'Online hirdetés (Google, Meta)', 'opex', 'Marketing', 'invoice', 0],
  ['MKT_PORTAL', 'Hirdetési portálok', 'opex', 'Marketing', 'invoice', 27],
  ['MKT_TART', 'SEO, tartalomgyártás, AI eszközök', 'opex', 'Marketing', 'invoice', 0],
  ['IT_SW', 'Szoftver, előfizetések', 'opex', 'IT', 'invoice', 0],
  ['IT_HOST', 'Tárhely, domain', 'opex', 'IT', 'invoice', 27],
  ['FIN_KAMAT_BE', 'Kamatbevétel', 'below', 'Pénzügyi tételek és adók', 'none', 0],
  ['FIN_KAMAT_KI', 'Kamatráfordítás', 'below', 'Pénzügyi tételek és adók', 'none', 0],
  ['TAX_TAO', 'Társasági adó (TAO)', 'below', 'Pénzügyi tételek és adók', 'none', 0],
  ['TAX_HIPA', 'Helyi iparűzési adó', 'below', 'Pénzügyi tételek és adók', 'none', 0],
  ['TAX_EGYEB', 'Egyéb adók, illetékek', 'below', 'Pénzügyi tételek és adók', 'none', 0],
  ['EX_AFA', 'ÁFA befizetés / visszatérülés', 'excl', 'Nem eredményhatású', 'none', 0],
  ['EX_ATVEZ', 'Belső átvezetés (saját számlák, cégek)', 'excl', 'Nem eredményhatású', 'none', 0],
  ['EX_HITEL', 'Hitel, kölcsön (felvétel, törlesztés)', 'excl', 'Nem eredményhatású', 'none', 0],
  ['EX_TULAJ', 'Tulajdonosi befizetés, kivét', 'excl', 'Nem eredményhatású', 'none', 0],
  ['EX_ELOLEG', 'Előleg (még nem bevétel/költség)', 'excl', 'Nem eredményhatású', 'invoice', 0]
];
/* ---- alap szabályok: [prio, név, regex (a normalizált „TÍPUS | PARTNER | KÖZLEMÉNY | IBAN” szövegen), irány, kategória, üzletág-kód(ok), doc_mode] ---- */
const SEED_RULES = [
  [10, 'Átvezetés a BH Group-tól', '\\bBH GROUP ZRT', 'any', 'EX_ATVEZ', null],
  [11, 'BH Capital kölcsön', 'BH CAPITAL', 'any', 'EX_HITEL', null],
  [12, 'Saját készpénz / valuta befizetés', '^(VALUTABEFIZETES|KESZPENZBEFIZETES|KESZPENZ BEFIZETES)', 'in', 'EX_TULAJ', null],
  [20, 'NAV – ÁFA', '\\| NAV \\|.*(01076868|\\bAFA\\b)', 'out', 'EX_AFA', null],
  [21, 'NAV – TAO előleg', '\\| NAV \\|.*(01076019|\\bTAO\\b)', 'out', 'TAX_TAO', 'KOZOS'],
  [22, 'NAV – bérjárulékok (SZJA, TB, szocho)', '\\| NAV \\|.*(06055950|06055819|06055912|SZEMELYI JOV|TB JARUL|SZOCIALIS HOZZ|SZOCHO|JARULEK|SZJA)', 'out', 'PERS_JAR', 'CA'],
  [23, 'NAV – helyi iparűzési adó', '\\|.*(IPARUZESI|\\bHIPA\\b)', 'out', 'TAX_HIPA', 'KOZOS'],
  [29, 'NAV – egyéb (ellenőrizendő)', '\\| NAV \\|', 'out', 'TAX_EGYEB', 'KOZOS'],
  [30, 'Bank – díjak, jutalékok', '^(DIJ, JUTALEK|PENZTARI JUTALEK|SZAMLAVEZETESI)|FORGALMI JUTALEK|ZARLATI DIJ', 'out', 'OFF_BANK', 'KOZOS'],
  [31, 'Bank – kamat jóváírás', '^KAMAT\\b', 'in', 'FIN_KAMAT_BE', 'KOZOS'],
  [32, 'Bank – kamat terhelés', '^KAMAT\\b', 'out', 'FIN_KAMAT_KI', 'KOZOS'],
  [40, 'Irodabérlet – Mátrai Tibor', 'MATRAI TIBOR', 'out', 'OFF_BERLET', 'CA'],
  [41, 'Vadnai Zsombor – megbízási díj', 'VADNAI ZSOMBOR', 'out', 'PERS_MEGB', 'CA'],
  [50, 'Matrica / útdíj (vintrica, e-matrica, HU-GO)', 'VINTRICA|E-MATRICA|NEMZETI UTDIJ|HU-GO|ASFINAG|AUTOBAHN|MAUT|PARKOL', 'out', 'VEH_UTDIJ', 'CA'],
  [51, 'Üzemanyag', '\\b(SHELL|MOL|OMV|BP|JET|ARAL|ORLEN|LUKOIL|ESSO|AGIP|ENI|TOTAL)\\b|TANKSTELLE', 'out', 'VEH_UZEM', 'CA'],
  [52, 'Autómosó, szerviz', 'AUTOMOSO|AUTOMOSAS|WASCH|CAR ?WASH|GUMI|SZERVIZ', 'out', 'VEH_SZERVIZ', 'CA'],
  [53, 'Távolsági busz (autóátvételek)', '\\bFLIX', 'out', 'TRAVEL', 'CA'],
  [54, 'Utazás, szállás (üzletág ellenőrizendő)', 'BOOKING\\.COM|HOTEL|DFDS|\\bUBER\\b|RYANAIR|WIZZ|AIRBNB|LUFTHANSA|\\bMAV\\b|\\bDB\\b BAHN', 'out', 'TRAVEL', null],
  [60, 'Hirdetési portálok', 'HASZNALTAUTO|MOBILE\\.DE|AUTOSCOUT|HEYCAR|JOFOGAS', 'out', 'MKT_PORTAL', 'CA'],
  [61, 'Google Ads / Meta hirdetés', 'GOOGLE ?\\*?ADS|GOOGLE ADWORDS|FACEBK|META PLATFORMS|FACEBOOK|TIKTOK ADS', 'out', 'MKT_ADS', 'CA'],
  [62, 'SEO / tartalom eszközök (Ahrefs, Higgsfield, HeyGen…)', 'AHREFS|HIGGSFIELD|HEYGEN|CANVA|CLOUDINARY', 'out', 'MKT_TART', 'CA'],
  [63, 'Google Workspace – caradvance.hu', 'GOOGLE WORKSPACE CARAD', 'out', 'IT_SW', 'CA'],
  [64, 'Szoftver-előfizetések (közös)', 'ANTHROPIC|OPENAI|APPLE\\.COM|GOOGLE WORKSPACE|GOOGLE ?\\*?CLOUD|MICROSOFT|NOTION|CLOUDFLARE|GITHUB|ADOBE|ZOOM', 'out', 'IT_SW', 'KOZOS'],
  [65, 'Tárhely, domain (Rackhost)', 'RACKHOST|NETHELY|DOTROLL|GODADDY', 'out', 'IT_HOST', 'KOZOS'],
  [70, 'Kereskedelmi kamara tagdíj', 'IPARKAMAR', 'out', 'OFF_TAGDIJ', 'KOZOS'],
  [80, 'Cukor beszerzés (Krajowa Grupa Spożywcza)', 'KRAJOWA GRUPA SPOZYWCZA|SUDZUCKER|SUEDZUCKER|NORDZUCKER|PFEIFER', 'out', 'COGS_ARU', 'CUKOR'],
  [81, 'Designyourdrink – vevői befizetés', 'DESIGNYOURDRINK', 'in', 'REV_ARU', 'CUKOR'],
  [90, 'Caradvance GmbH (kategória ellenőrizendő)', 'CARADVANCE GMBH', 'any', null, 'CA']
];

async function seed(env) {
  const st = [];
  for (const [code, name, color, shared, sort] of SEED_LINES) st.push(env.DB.prepare(`INSERT OR IGNORE INTO fin_lines (code,name,color,shared,sort) VALUES (?,?,?,?,?)`).bind(code, name, color, shared, sort));
  SEED_CATS.forEach(([code, name, kind, grp, doc, vat], i) => st.push(env.DB.prepare(`INSERT OR IGNORE INTO fin_cats (code,name,kind,grp,doc_mode,vat,sort) VALUES (?,?,?,?,?,?,?)`).bind(code, name, kind, grp, doc, vat, (i + 1) * 10)));
  st.push(env.DB.prepare(`INSERT OR IGNORE INTO fin_accounts (name, ext_id, currency, kind) VALUES ('Házipénztár / kézi tételek', 'CASH', 'HUF', 'cash')`));
  await env.DB.batch(st);
  const lines = (await env.DB.prepare(`SELECT id, code FROM fin_lines`).all()).results;
  const cats = (await env.DB.prepare(`SELECT id, code FROM fin_cats`).all()).results;
  const L = Object.fromEntries(lines.map((r) => [r.code, r.id]));
  const C = Object.fromEntries(cats.map((r) => [r.code, r.id]));
  const rs = SEED_RULES.map(([prio, name, pat, dir, cat, line]) => env.DB.prepare(`INSERT INTO fin_rules (prio,name,pattern,dir,cat_id,split) VALUES (?,?,?,?,?,?)`)
    .bind(prio, name, pat, dir, cat ? C[cat] : null, line ? JSON.stringify([{ l: L[line], p: 100 }]) : null));
  rs.push(env.DB.prepare(`INSERT OR REPLACE INTO fin_settings (k, v) VALUES ('alloc', ?)`).bind(JSON.stringify({ mode: 'fixed', key: { [L.CA]: 100 } })));
  await env.DB.batch(rs);
}

export async function getSetting(env, k, d) { const r = await env.DB.prepare(`SELECT v FROM fin_settings WHERE k = ?`).bind(k).first(); return r ? parseJ(r.v, d) : d; }
export async function setSetting(env, k, v) { await env.DB.prepare(`INSERT OR REPLACE INTO fin_settings (k, v) VALUES (?, ?)`).bind(k, JSON.stringify(v)).run(); }

/* ============================== felosztás (split) ============================== */
export function normSplit(s, lineIds) {
  const arr = Array.isArray(s) ? s : parseJ(s, null);
  if (!Array.isArray(arr)) return null;
  const out = []; let sum = 0;
  for (const x of arr) {
    const l = Number(x && x.l), p = Number(x && x.p);
    if (!l || !(p > 0) || (lineIds && !lineIds.has(l))) continue;
    out.push({ l, p: Math.round(p * 100) / 100 }); sum += p;
  }
  if (!out.length) return null;
  if (Math.abs(sum - 100) > 0.01) out.forEach((x) => { x.p = Math.round(x.p / sum * 10000) / 100; });
  return out;
}

/* ============================== banki sorok feldolgozása ============================== */
/**
 * Egy kivonat-sor (oszlopnév → érték) → tranzakció. Raiffeisen „Könyvelt tételek” export:
 * Típus | Könyvelés dátuma | Értéknap | Azonosító | Összeg | (Adatok) | Közlemény/1..5
 *  - kártya: K1 = kártyaszám + dátum + terminál, K2 = kereskedő, K3/K4 = eredeti összeg/devizaárfolyam
 *  - átutalás: K1 = IBAN (forint) vagy „EUR 15.000,00” (deviza), K2 = partner, K3-K4 = közlemény
 *  - díj, kamat: partner = Bank
 */
export function parseBankRow(r) {
  const g = (k) => clean(r[k], 300);
  const ttype = g('Típus') || g('Tipus') || g('type');
  const k = [1, 2, 3, 4, 5].map((i) => g('Közlemény/' + i) || g('Kozlemeny/' + i) || g('k' + i));
  const bdate = toIsoDate(r['Könyvelés dátuma'] ?? r['Konyveles datuma'] ?? r.bdate);
  const vdate = toIsoDate(r['Értéknap'] ?? r['Erteknap'] ?? r.vdate) || bdate;
  const amount = toNum(r['Összeg'] ?? r['Osszeg'] ?? r.amount);
  const bank_ref = g('Azonosító') || g('Azonosito') || g('ref');
  let partner = '', iban = '', memo = [];
  const T = norm(ttype);
  if (/KARTYA/.test(T)) {
    partner = k[1];
    memo = [maskPan(k[0]).replace(/^\S+…\S+\s*/, ''), k[2], k[3], k[4]];
  } else if (/^(DIJ|PENZTARI JUTALEK|KAMAT|SZAMLAVEZET|JUTALEK)/.test(T)) {
    partner = 'Bank'; memo = k;
  } else {
    const looksAcc = (s) => /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s.replace(/\s|-/g, '')) || /^\d{8}(-?\d{8}){1,2}$/.test(s.replace(/\s/g, '')) || /^\d{16,24}$/.test(s);
    if (looksAcc(k[0])) { iban = k[0].replace(/\s/g, ''); memo = [k[2], k[3], k[4]]; } else memo = [k[0], k[2], k[3], k[4]];
    partner = k[1];
    if (!partner && /BEFIZETES/.test(T)) partner = k[0];
  }
  memo = memo.map((x) => clean(x, 200)).filter(Boolean).join(' · ');
  return { ttype, bdate, vdate, amount, bank_ref, partner: clean(partner, 160), iban: clean(iban, 40), memo: clean(memo, 400), raw: k.join('|') };
}

export function subjectOf(tx) { return norm(`${tx.ttype} | ${tx.partner} | ${tx.memo} | ${tx.iban || ''}`); }

/* ============================== szabálymotor ============================== */
export function compileRules(rules) {
  const out = [];
  for (const r of rules) {
    if (!r.active) continue;
    try { out.push({ ...r, re: new RegExp(r.pattern, 'i') }); } catch (e) { /* hibás regex: kihagyjuk */ }
  }
  out.sort((a, b) => (a.prio - b.prio) || (a.id - b.id));
  return out;
}
export function matchRule(compiled, tx) {
  const subj = subjectOf(tx);
  const dir = Number(tx.amount) >= 0 ? 'in' : 'out';
  for (const r of compiled) {
    if (r.dir && r.dir !== 'any' && r.dir !== dir) continue;
    if (r.re.test(subj)) return r;
  }
  return null;
}

/** Szabályok futtatása a nem kézzel besorolt tételekre (ids = csak ezekre; üres = mindre). */
export async function applyRules(env, ids) {
  const rules = compileRules((await env.DB.prepare(`SELECT * FROM fin_rules`).all()).results);
  let q = `SELECT id, account_id, ttype, partner, memo, iban, amount, bank_ref, cat_id, split, vat, doc_mode, rule_id FROM fin_tx WHERE manual = 0`;
  const rows = (await env.DB.prepare(q).all()).results.filter((t) => !ids || ids.has(t.id));
  const st = [], hits = {};
  let changed = 0;
  for (const t of rows) {
    const r = matchRule(rules, t);
    const cat = r ? r.cat_id : null, split = r ? r.split : null, vat = r ? r.vat : null, doc = r ? r.doc_mode : null, rid = r ? r.id : null;
    if (r) hits[r.id] = (hits[r.id] || 0) + 1;
    if (t.cat_id === cat && (t.split || null) === (split || null) && t.vat === vat && t.doc_mode === doc && t.rule_id === rid) continue;
    st.push(env.DB.prepare(`UPDATE fin_tx SET cat_id = ?, split = ?, vat = ?, doc_mode = ?, rule_id = ? WHERE id = ?`).bind(cat, split, vat, doc, rid, t.id));
    changed++;
  }
  for (let i = 0; i < st.length; i += 80) await env.DB.batch(st.slice(i, i + 80));
  // találatszám frissítése (teljes futásnál)
  if (!ids) {
    const hs = rules.map((r) => env.DB.prepare(`UPDATE fin_rules SET hits = ? WHERE id = ?`).bind(hits[r.id] || 0, r.id));
    for (let i = 0; i < hs.length; i += 80) await env.DB.batch(hs.slice(i, i + 80));
  }
  await inheritFeeSplits(env);
  return changed;
}

/** A banki díj-tételek (azonos bank-azonosítójú utalás mellett) öröklik az utalás üzletágát — pl. a cukor-utalás díja a cukorra megy. */
export async function inheritFeeSplits(env) {
  const bankCat = await env.DB.prepare(`SELECT id FROM fin_cats WHERE code = 'OFF_BANK'`).first();
  if (!bankCat) return;
  const fees = (await env.DB.prepare(`SELECT f.id, f.split, (SELECT p.split FROM fin_tx p WHERE p.account_id = f.account_id AND p.bank_ref = f.bank_ref AND p.id <> f.id
      AND (p.cat_id IS NULL OR p.cat_id <> ?) AND p.split IS NOT NULL ORDER BY ABS(p.amount) DESC LIMIT 1) AS psplit
    FROM fin_tx f WHERE f.manual = 0 AND f.cat_id = ? AND f.bank_ref <> ''`).bind(bankCat.id, bankCat.id).all()).results;
  const st = fees.filter((f) => f.psplit && f.psplit !== f.split).map((f) => env.DB.prepare(`UPDATE fin_tx SET split = ? WHERE id = ?`).bind(f.psplit, f.id));
  for (let i = 0; i < st.length; i += 80) await env.DB.batch(st.slice(i, i + 80));
}

/* ============================== árfolyamok (EKB, frankfurter.dev) ============================== */
export async function fxRates(env, cur, from, to) {
  if (cur === 'HUF') return {};
  const have = (await env.DB.prepare(`SELECT date, rate FROM fin_fx WHERE cur = ? AND date BETWEEN ? AND ?`).bind(cur, addDays(from, -7), to).all()).results;
  const map = Object.fromEntries(have.map((r) => [r.date, r.rate]));
  const has = (day) => Object.keys(map).some((d) => d <= day && d >= addDays(day, -5));
  const need = !has(from) || !has(to);
  if (need) {
    try {
      const url = `https://api.frankfurter.dev/v1/${addDays(from, -7)}..${to}?base=${encodeURIComponent(cur)}&symbols=HUF`;
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        const st = [];
        for (const [d, v] of Object.entries((j && j.rates) || {})) if (v && v.HUF) { map[d] = v.HUF; st.push(env.DB.prepare(`INSERT OR REPLACE INTO fin_fx (cur, date, rate) VALUES (?, ?, ?)`).bind(cur, d, v.HUF)); }
        for (let i = 0; i < st.length; i += 80) await env.DB.batch(st.slice(i, i + 80));
      }
    } catch (e) { /* hálózati hiba: a tétel árfolyam nélkül marad, később újrapróbálható */ }
  }
  return map;
}
export function rateOn(map, date) {
  if (map[date]) return map[date];
  const ds = Object.keys(map).filter((d) => d <= date).sort();
  return ds.length && daysBetween(ds[ds.length - 1], date) <= 7 ? map[ds[ds.length - 1]] : null;
}
/** A HUF-érték nélküli deviza-tételek forintosítása. */
export async function fillFx(env) {
  const rows = (await env.DB.prepare(`SELECT id, currency, bdate, amount, memo FROM fin_tx WHERE amount_huf IS NULL`).all()).results;
  const st = [];
  const byCur = {};
  rows.forEach((r) => { (byCur[r.currency] = byCur[r.currency] || []).push(r); });
  let missing = 0;
  for (const [cur, list] of Object.entries(byCur)) {
    if (cur === 'HUF') { list.forEach((r) => st.push(env.DB.prepare(`UPDATE fin_tx SET fx = 1, amount_huf = amount WHERE id = ?`).bind(r.id))); continue; }
    const ds = list.map((r) => r.bdate).sort();
    const map = await fxRates(env, cur, ds[0], ds[ds.length - 1]);
    for (const r of list) {
      // kártyás vásárlás forintban egy deviza-számláról: a pontos forintösszeg a közleményben van („10.269,00 HUF Vásárlás”)
      const hm = /([\d.]+,\d{2}) HUF V[áa]s[áa]rl[áa]s/.exec(r.memo || '');
      if (hm) { const h = toNum(hm[1]) * Math.sign(r.amount); if (h) { st.push(env.DB.prepare(`UPDATE fin_tx SET fx = ?, amount_huf = ? WHERE id = ?`).bind(r2(h / r.amount), h, r.id)); continue; } }
      const fx = rateOn(map, r.bdate);
      if (!fx) { missing++; continue; }
      st.push(env.DB.prepare(`UPDATE fin_tx SET fx = ?, amount_huf = ? WHERE id = ?`).bind(fx, r2(r.amount * fx), r.id));
    }
  }
  for (let i = 0; i < st.length; i += 80) await env.DB.batch(st.slice(i, i + 80));
  return missing;
}

/* ============================== import ============================== */
/** rows: oszlopnév → érték objektumok egy „Könyvelt tételek” blokkból. */
export async function importRows(env, account, rows, who) {
  const ext = clean(account.ext_id, 80);
  if (!ext) throw new Error('Hiányzó számlaazonosító.');
  let acc = await env.DB.prepare(`SELECT * FROM fin_accounts WHERE ext_id = ?`).bind(ext).first();
  if (!acc) {
    const cur = /^[A-Z]{3}$/.test(account.currency || '') ? account.currency : 'HUF';
    const res = await env.DB.prepare(`INSERT INTO fin_accounts (name, ext_id, currency, kind, entity) VALUES (?, ?, ?, 'bank', ?)`).bind(clean(account.name, 80) || ext, ext, cur, clean(account.entity, 80)).run();
    acc = await env.DB.prepare(`SELECT * FROM fin_accounts WHERE id = ?`).bind(res.meta.last_row_id).first();
  }
  const seen = {}, st = [], uids = [];
  let bad = 0;
  for (const raw of rows) {
    const t = parseBankRow(raw);
    if (!t.bdate || !isFinite(t.amount) || t.amount === 0) { bad++; continue; }
    const base = [acc.id, t.bdate, t.vdate, t.bank_ref, t.amount, t.ttype, t.raw].join('|');
    seen[base] = (seen[base] || 0) + 1;
    const uid = await sha256Hex(base + '#' + seen[base]);
    uids.push(uid);
    const huf = acc.currency === 'HUF' ? t.amount : null;
    st.push(env.DB.prepare(`INSERT OR IGNORE INTO fin_tx (uid, account_id, src, bdate, vdate, ttype, bank_ref, amount, currency, fx, amount_huf, partner, iban, memo, updated_by)
      VALUES (?, ?, 'bank', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(uid, acc.id, t.bdate, t.vdate, t.ttype, t.bank_ref, t.amount, acc.currency, acc.currency === 'HUF' ? 1 : null, huf, t.partner, t.iban, t.memo, who || ''));
  }
  let inserted = 0;
  for (let i = 0; i < st.length; i += 50) {
    const res = await env.DB.batch(st.slice(i, i + 50));
    res.forEach((r) => { inserted += (r && r.meta && r.meta.changes) || 0; });
  }
  // az újonnan beszúrt tételek azonosítói
  const newIds = new Set();
  for (let i = 0; i < uids.length; i += 90) {
    const chunk = uids.slice(i, i + 90);
    const rs = (await env.DB.prepare(`SELECT id FROM fin_tx WHERE uid IN (${chunk.map(() => '?').join(',')}) AND cat_id IS NULL AND rule_id IS NULL AND manual = 0`).bind(...chunk).all()).results;
    rs.forEach((r) => newIds.add(r.id));
  }
  const fxMissing = await fillFx(env);
  if (newIds.size) await applyRules(env, newIds);
  const matched = await autoMatch(env);
  return { account: acc, inserted, skipped: rows.length - inserted - bad, bad, fxMissing, matched };
}

/* ============================== nettósítás ============================== */
/** Tétel HUF értéke [nettó, bruttó]. Nettó: ha van párosított bizonylat nettó/bruttó aránnyal, azt használjuk, különben az ÁFA%-ot. */
export function txValues(tx, cat, doc) {
  const g = Number(tx.amount_huf);
  if (!isFinite(g) || tx.amount_huf == null) return null;
  const vat = tx.vat != null ? Number(tx.vat) : (cat ? Number(cat.vat) || 0 : 0);
  if (!(vat > 0)) return [g, g];
  if (doc && Number(doc.gross) && doc.net != null && Math.abs(Number(doc.gross)) > 0) {
    const ratio = Number(doc.net) / Number(doc.gross);
    if (ratio > 0.5 && ratio <= 1) return [r2(g * ratio), g];
  }
  return [r2(g / (1 + vat / 100)), g];
}

/* ============================== P&L ============================== */
export async function pnl(env, from, to) {
  const [lines, cats, alloc] = await Promise.all([
    env.DB.prepare(`SELECT * FROM fin_lines ORDER BY sort, id`).all().then((r) => r.results),
    env.DB.prepare(`SELECT * FROM fin_cats ORDER BY sort, id`).all().then((r) => r.results),
    getSetting(env, 'alloc', { mode: 'fixed', key: {} })
  ]);
  const txs = (await env.DB.prepare(`SELECT t.id, t.bdate, t.amount, t.amount_huf, t.cat_id, t.split, t.vat, d.net AS dnet, d.gross AS dgross
    FROM fin_tx t LEFT JOIN fin_docs d ON d.id = t.doc_id WHERE t.bdate BETWEEN ? AND ? ORDER BY t.bdate`).bind(from, to).all()).results;
  const C = Object.fromEntries(cats.map((c) => [c.id, c]));
  const lineIds = new Set(lines.map((l) => l.id));
  const cells = {}; // catKey → month → lineKey → [net, gross, n]
  let noFx = 0;
  for (const t of txs) {
    const cat = t.cat_id ? C[t.cat_id] : null;
    const v = txValues(t, cat, t.dgross != null ? { net: t.dnet, gross: t.dgross } : null);
    if (!v) { noFx++; continue; }
    const ck = cat ? String(cat.id) : 'UNCAT';
    const m = t.bdate.slice(0, 7);
    const sp = normSplit(t.split, lineIds) || [{ l: 'NA', p: 100 }];
    for (const s of sp) {
      const a = ((cells[ck] = cells[ck] || {})[m] = cells[ck][m] || {});
      const c = (a[s.l] = a[s.l] || [0, 0, 0]);
      c[0] = r2(c[0] + v[0] * s.p / 100); c[1] = r2(c[1] + v[1] * s.p / 100); c[2] += 1;
    }
  }
  const months = [];
  for (let d = from.slice(0, 7); d <= to.slice(0, 7);) {
    months.push(d);
    const [y, mm] = d.split('-').map(Number);
    d = mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, '0')}`;
  }
  return { from, to, months, lines, cats, alloc, cells, noFx, txCount: txs.length };
}

/* ============================== bizonylat-párosítás ============================== */
function tokens(s) { return new Set(norm(s).replace(/[^A-Z0-9 ]/g, ' ').split(' ').filter((w) => w.length >= 4 && !/^(KFT|ZRT|GMBH|BT|LTD|SRO|SPOLKA|S\.A|HUNGARY|MAGYARORSZAG|SZOLGALTATO|KERESKEDELMI)$/.test(w))); }
function numKey(s) { return norm(s).replace(/[^A-Z0-9]/g, ''); }
export function scoreMatch(tx, doc) {
  const txOut = Number(tx.amount) < 0;
  if ((doc.dir === 'in') !== txOut) return -1;
  if (doc.op && doc.op !== 'CREATE') return -1;
  const amt = Math.abs(Number(tx.amount));
  let amountOk = false;
  if (doc.currency === tx.currency && doc.gross != null) amountOk = Math.abs(Math.abs(Number(doc.gross)) - amt) <= (tx.currency === 'HUF' ? 1.5 : 0.011);
  else if (tx.currency === 'HUF' && doc.gross_huf != null) amountOk = Math.abs(Math.abs(Number(doc.gross_huf)) - amt) <= Math.max(2, amt * 0.025);
  if (!amountOk) return -1;
  const dd = doc.issue_date ? daysBetween(doc.issue_date, tx.bdate) : 0; // + = fizetés a kiállítás után
  if (dd < -20 || dd > 90) return -1;
  let s = 20 - Math.min(15, Math.abs(dd) / 3);
  const nk = numKey(doc.number);
  if (nk.length >= 4 && numKey(tx.memo + ' ' + tx.partner).includes(nk)) s += 100;
  const a = tokens(tx.partner), b = tokens(doc.partner);
  let common = false;
  for (const w of a) if (b.has(w)) { common = true; break; }
  if (common) s += 40; else if (a.size && b.size) s -= 10; // eltérő partnernév: csak javaslat, automatikus kötés nem
  return s;
}
/** Automatikus párosítás: csak egyértelmű találatnál köt (összeg + szám vagy összeg + partner, vagy egyetlen összeg-egyezés 10 napon belül). */
export async function autoMatch(env) {
  const txs = (await env.DB.prepare(`SELECT t.id, t.amount, t.currency, t.bdate, t.partner, t.memo, t.doc_mode, c.doc_mode AS cdoc, c.kind
    FROM fin_tx t LEFT JOIN fin_cats c ON c.id = t.cat_id WHERE t.doc_id IS NULL`).all()).results
    .filter((t) => (t.doc_mode || t.cdoc || 'invoice') !== 'none' && t.kind !== 'excl');
  if (!txs.length) return 0;
  const docs = (await env.DB.prepare(`SELECT d.* FROM fin_docs d WHERE NOT EXISTS (SELECT 1 FROM fin_tx t WHERE t.doc_id = d.id)`).all()).results;
  if (!docs.length) return 0;
  const used = new Set(), st = [];
  const cands = [];
  for (const t of txs) {
    const sc = docs.map((d) => ({ d, s: scoreMatch(t, d) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s);
    if (!sc.length) continue;
    const best = sc[0], second = sc[1];
    const strong = best.s >= 50 && (!second || second.s < best.s - 10);
    const lone = sc.length === 1 && best.s >= 17;
    if (strong || lone) cands.push({ t, d: best.d, s: best.s });
  }
  cands.sort((a, b) => b.s - a.s);
  for (const c of cands) {
    if (used.has(c.d.id) || used.has('t' + c.t.id)) continue;
    used.add(c.d.id); used.add('t' + c.t.id);
    st.push(env.DB.prepare(`UPDATE fin_tx SET doc_id = ?, match_kind = 'auto' WHERE id = ? AND doc_id IS NULL`).bind(c.d.id, c.t.id));
  }
  for (let i = 0; i < st.length; i += 80) await env.DB.batch(st.slice(i, i + 80));
  return st.length;
}
export async function suggestDocs(env, txId) {
  const t = await env.DB.prepare(`SELECT * FROM fin_tx WHERE id = ?`).bind(txId).first();
  if (!t) return [];
  const docs = (await env.DB.prepare(`SELECT d.*, (SELECT COUNT(*) FROM fin_tx x WHERE x.doc_id = d.id) AS used FROM fin_docs d WHERE d.issue_date BETWEEN ? AND ?`).bind(addDays(t.bdate, -120), addDays(t.bdate, 30)).all()).results;
  const amt = Math.abs(Number(t.amount));
  return docs.map((d) => ({ ...d, score: scoreMatch(t, d), diff: Math.abs(Math.abs(Number(d.currency === t.currency ? d.gross : d.gross_huf)) - amt) }))
    .sort((a, b) => (b.score - a.score) || (a.diff - b.diff)).slice(0, 12);
}

/* ============================== fájlok (darabolva, D1 sorlimit miatt) ============================== */
const PART = 1500000;
export async function saveFile(env, docId, b64) {
  const st = [env.DB.prepare(`DELETE FROM fin_files WHERE doc_id = ?`).bind(docId)];
  for (let i = 0, p = 0; i < b64.length; i += PART, p++) st.push(env.DB.prepare(`INSERT INTO fin_files (doc_id, part, data) VALUES (?, ?, ?)`).bind(docId, p, b64.slice(i, i + PART)));
  await env.DB.batch(st);
}
export async function loadFile(env, docId) {
  const rows = (await env.DB.prepare(`SELECT data FROM fin_files WHERE doc_id = ? ORDER BY part`).bind(docId).all()).results;
  if (!rows.length) return null;
  const b64 = rows.map((r) => r.data).join('');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ============================== NAV Online Számla (v3.0) — bejövő és kimenő számlák kivonata ============================== */
// SHA3-512 (Keccak, FIPS 202) — a Web Crypto nem ismeri, a NAV kérés-aláírás ezt kéri.
const RC = ['0x0000000000000001', '0x0000000000008082', '0x800000000000808a', '0x8000000080008000', '0x000000000000808b', '0x0000000080000001', '0x8000000080008081', '0x8000000000008009',
  '0x000000000000008a', '0x0000000000000088', '0x0000000080008009', '0x000000008000000a', '0x000000008000808b', '0x800000000000008b', '0x8000000000008089', '0x8000000000008003',
  '0x8000000000008002', '0x8000000000000080', '0x000000000000800a', '0x800000008000000a', '0x8000000080008081', '0x8000000000008080', '0x0000000080000001', '0x8000000080008008'].map(BigInt);
const ROT = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];
const M64 = (1n << 64n) - 1n;
const rotl = (x, n) => (n === 0 ? x : ((x << BigInt(n)) | (x >> BigInt(64 - n))) & M64);
function keccakF(A) {
  for (let r = 0; r < 24; r++) {
    const C = [0, 1, 2, 3, 4].map((x) => A[x] ^ A[x + 5] ^ A[x + 10] ^ A[x + 15] ^ A[x + 20]);
    for (let x = 0; x < 5; x++) { const D = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1); for (let y = 0; y < 25; y += 5) A[y + x] ^= D; }
    const B = new Array(25);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(A[x + 5 * y], ROT[x + 5 * y]);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) A[x + 5 * y] = B[x + 5 * y] ^ ((~B[(x + 1) % 5 + 5 * y] & M64) & B[(x + 2) % 5 + 5 * y]);
    A[0] ^= RC[r];
  }
}
export function sha3_512Hex(str) {
  const msg = new TextEncoder().encode(str), rate = 72;
  const padLen = rate - (msg.length % rate);
  const p = new Uint8Array(msg.length + padLen); p.set(msg); p[msg.length] ^= 0x06; p[p.length - 1] ^= 0x80;
  const A = new Array(25).fill(0n);
  for (let off = 0; off < p.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) { let v = 0n; for (let b = 7; b >= 0; b--) v = (v << 8n) | BigInt(p[off + i * 8 + b]); A[i] ^= v; }
    keccakF(A);
  }
  let hex = '';
  for (let i = 0; i < 8; i++) { let v = A[i]; for (let b = 0; b < 8; b++) { hex += Number(v & 0xffn).toString(16).padStart(2, '0'); v >>= 8n; } }
  return hex.toUpperCase();
}
async function sha512Hex(s) { const b = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(); }
const xe = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function navConfigured(env) { return !!(env.NAV_LOGIN && env.NAV_PASSWORD && env.NAV_SIGN_KEY && /^\d{8}$/.test(String(env.NAV_TAX_NUMBER || '').slice(0, 8))); }

export async function navDigestRequest(env, dir, from, to, page) {
  const tax = String(env.NAV_TAX_NUMBER).slice(0, 8);
  const now = new Date();
  const ts = now.toISOString();
  const sigTs = ts.slice(0, 19).replace(/[-:T]/g, '');
  const rid = ('CA' + Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 30).toUpperCase();
  const sig = sha3_512Hex(rid + sigTs + env.NAV_SIGN_KEY);
  const pw = await sha512Hex(env.NAV_PASSWORD);
  const swId = String(env.NAV_SOFTWARE_ID || ('HU' + tax + '-CAFIN01')).toUpperCase().replace(/[^0-9A-Z-]/g, '').padEnd(18, '0').slice(0, 18);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<QueryInvoiceDigestRequest xmlns="http://schemas.nav.gov.hu/OSA/3.0/api" xmlns:common="http://schemas.nav.gov.hu/NTCA/1.0/common">
<common:header><common:requestId>${rid}</common:requestId><common:timestamp>${ts}</common:timestamp><common:requestVersion>3.0</common:requestVersion><common:headerVersion>1.0</common:headerVersion></common:header>
<common:user><common:login>${xe(env.NAV_LOGIN)}</common:login><common:passwordHash cryptoType="SHA-512">${pw}</common:passwordHash><common:taxNumber>${tax}</common:taxNumber><common:requestSignature cryptoType="SHA3-512">${sig}</common:requestSignature></common:user>
<software><softwareId>${swId}</softwareId><softwareName>CarAdvance belso penzugy</softwareName><softwareOperation>ONLINE_SERVICE</softwareOperation><softwareMainVersion>1.0</softwareMainVersion><softwareDevName>CarAdvance</softwareDevName><softwareDevContact>info@caradvance.hu</softwareDevContact><softwareDevCountryCode>HU</softwareDevCountryCode><softwareDevTaxNumber>${tax}</softwareDevTaxNumber></software>
<page>${page}</page><invoiceDirection>${dir}</invoiceDirection>
<invoiceQueryParams><mandatoryQueryParams><invoiceIssueDate><dateFrom>${from}</dateFrom><dateTo>${to}</dateTo></invoiceIssueDate></mandatoryQueryParams></invoiceQueryParams>
</QueryInvoiceDigestRequest>`;
  return { xml, rid };
}
function tag(x, name) { const m = new RegExp(`<(?:[A-Za-z0-9_]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${name}>`).exec(x); return m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim() : ''; }
function tags(x, name) { const re = new RegExp(`<(?:[A-Za-z0-9_]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${name}>`, 'g'); const out = []; let m; while ((m = re.exec(x))) out.push(m[1]); return out; }
export function parseDigestResponse(x) {
  const func = tag(x, 'funcCode');
  if (func !== 'OK') {
    const code = tag(x, 'errorCode'), msg = tag(x, 'message');
    throw new Error('NAV: ' + (code || func || 'ismeretlen hiba') + (msg ? ' – ' + msg : ''));
  }
  const avail = Number(tag(x, 'availablePage')) || 1;
  const list = tags(x, 'invoiceDigest').map((d) => {
    const n = (k) => { const v = tag(d, k); return v === '' ? null : Number(v); };
    return {
      number: tag(d, 'invoiceNumber'), op: tag(d, 'invoiceOperation'), issue_date: tag(d, 'invoiceIssueDate'), perf_date: tag(d, 'invoiceDeliveryDate'),
      supplier_tax: tag(d, 'supplierTaxNumber'), supplier: tag(d, 'supplierName'), customer_tax: tag(d, 'customerTaxNumber'), customer: tag(d, 'customerName'),
      pay_method: tag(d, 'paymentMethod'), pay_date: tag(d, 'paymentDate'), currency: tag(d, 'currency') || 'HUF',
      net: n('invoiceNetAmount'), vat: n('invoiceVatAmount'), net_huf: n('invoiceNetAmountHUF'), vat_huf: n('invoiceVatAmountHUF')
    };
  });
  return { avail, list };
}
/** NAV szinkron: [from, to] időszak, 35 napos szeletekben, bejövő + kimenő irány. */
export async function navSync(env, from, to, who) {
  if (!navConfigured(env)) throw new Error('A NAV hozzáférés nincs beállítva (NAV_LOGIN, NAV_PASSWORD, NAV_SIGN_KEY, NAV_TAX_NUMBER).');
  const base = env.NAV_TEST === '1' ? 'https://api-test.onlineszamla.nav.gov.hu' : 'https://api.onlineszamla.nav.gov.hu';
  let fetched = 0, inserted = 0, calls = 0;
  for (let a = from; a <= to; a = addDays(a, 35)) {
    const b = addDays(a, 34) < to ? addDays(a, 34) : to;
    for (const dir of ['INBOUND', 'OUTBOUND']) {
      for (let page = 1, avail = 1; page <= avail && page <= 40; page++) {
        if (++calls > 40) throw new Error('Túl hosszú időszak egy lépésben — kérj rövidebbet (max. ~6 hónap).');
        const { xml } = await navDigestRequest(env, dir, a, b, page);
        const r = await fetch(base + '/invoiceService/v3/queryInvoiceDigest', { method: 'POST', headers: { 'Content-Type': 'application/xml', Accept: 'application/xml' }, body: xml });
        const txt = await r.text();
        const res = parseDigestResponse(txt);
        avail = res.avail;
        const st = [];
        for (const d of res.list) {
          fetched++;
          const inb = dir === 'INBOUND';
          const gross = d.net != null && d.vat != null ? r2(d.net + d.vat) : d.net;
          const grossHuf = d.net_huf != null ? r2(d.net_huf + (d.vat_huf || 0)) : null;
          const key = `${inb ? 'in' : 'out'}|${d.supplier_tax}|${d.number}|${d.op}`;
          st.push(env.DB.prepare(`INSERT INTO fin_docs (dir, kind, source, nav_key, op, number, partner, partner_tax, issue_date, perf_date, pay_date, pay_method, currency, net, vat, gross, net_huf, vat_huf, gross_huf, created_by)
            VALUES (?, 'szamla', 'nav', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(nav_key) DO UPDATE SET net = excluded.net, vat = excluded.vat, gross = excluded.gross, net_huf = excluded.net_huf, vat_huf = excluded.vat_huf, gross_huf = excluded.gross_huf, pay_date = excluded.pay_date`)
            .bind(inb ? 'in' : 'out', key, d.op, d.number, inb ? d.supplier : d.customer, inb ? d.supplier_tax : d.customer_tax, d.issue_date, d.perf_date, d.pay_date, d.pay_method, d.currency, d.net, d.vat, gross, d.net_huf, d.vat_huf, grossHuf, who || 'NAV'));
        }
        for (let i = 0; i < st.length; i += 50) { const rr = await env.DB.batch(st.slice(i, i + 50)); rr.forEach((x) => { inserted += (x && x.meta && x.meta.changes) || 0; }); }
      }
    }
  }
  await setSetting(env, 'nav_last', { at: nowIso(), from, to, fetched });
  const matched = await autoMatch(env);
  return { fetched, upserted: inserted, matched };
}
