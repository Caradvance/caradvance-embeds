/**
 * CarAdvance — ügyfélfiók közös segédei (D1: env.DB).
 * A táblákat az első kéréskor maga hozza létre (CREATE TABLE IF NOT EXISTS), külön migráció nem kell.
 * A munkatársi CRM (/belso) tábláit (deals, offer_tokens) csak olvassa.
 */

let READY = false;

export async function ensureTables(env) {
  if (READY || !env.DB) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT DEFAULT '', phone TEXT DEFAULT '', company TEXT DEFAULT '', lang TEXT DEFAULT 'hu', marketing INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), last_login TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_codes (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, link_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER DEFAULT 0, lang TEXT DEFAULT 'hu')`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_favs (user_id INTEGER NOT NULL, url TEXT NOT NULL, title TEXT DEFAULT '', img TEXT DEFAULT '', price TEXT DEFAULT '', created_at INTEGER NOT NULL, PRIMARY KEY (user_id, url))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, kind TEXT DEFAULT '', car TEXT DEFAULT '', summary TEXT DEFAULT '{}', page TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_cust_requests_email ON cust_requests (email)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, win INTEGER NOT NULL)`)
  ]);
  READY = true;
}

/** Egyszerű ablakos számláló. true = belefér, false = túl sok. */
export async function rateOk(env, key, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`SELECT n, win FROM cust_rate WHERE k = ?`).bind(key).first();
  if (!row || now - row.win > windowSec) {
    await env.DB.prepare(`INSERT INTO cust_rate (k, n, win) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = 1, win = excluded.win`).bind(key, now).run();
    return true;
  }
  if (row.n >= max) return false;
  await env.DB.prepare(`UPDATE cust_rate SET n = n + 1 WHERE k = ?`).bind(key).run();
  return true;
}

/** A beküldött űrlapot az ügyfél e-mail címéhez köti, hogy a fiókjában lássa. Hibát nem dob. */
export async function saveRequest(env, { email, kind, car, record, page }) {
  try {
    if (!env.DB || !email) return { status: 'skipped' };
    await ensureTables(env);
    const skip = /^(event_id|beerkezett|forras_oldal|Ország \(IP alapján\)|gclid|gbraid|wbraid|fbclid|utm_.*|belepo_oldal|hivatkozo|consent|Adatkezelés|mkt_consent|turnstile_token|website|url_field|Csatolmány)$/;
    const summary = {};
    let size = 0;
    for (const [k, v] of Object.entries(record || {})) {
      if (skip.test(k) || v == null || v === '' || typeof v === 'object') continue;
      const s = String(v).slice(0, 600);
      size += k.length + s.length;
      if (size > 6000) break;
      summary[k] = s;
    }
    await env.DB.prepare(`INSERT INTO cust_requests (email, kind, car, summary, page) VALUES (?, ?, ?, ?, ?)`)
      .bind(String(email).trim().toLowerCase(), String(kind || ''), String(car || '').slice(0, 200), JSON.stringify(summary), String(page || '').slice(0, 300)).run();
    return { status: 'saved' };
  } catch (e) {
    return { status: 'error' };
  }
}

/** A CRM folyamat-lépései (megegyezik a /belso felület STAGES listájával). */
export const STAGES = {
  'Eladás': ['Új', 'Egyeztetés', 'Ajánlat', 'Folyamatban', 'Lezárva – sikeres'],
  'Import': ['Érdeklődés', 'Igény pontosítva', 'Autó keresése', 'Kiválasztva', 'Megrendelve', 'Szállítás', 'Vám / forgalomba', 'Átadva'],
  'Bérlés': ['Új', 'Egyeztetés', 'Ajánlat', 'Aktív bérlés', 'Lezárva'],
  'Bizományos': ['Új', 'Árazás', 'Bizományba véve', 'Hirdetve', 'Eladva']
};

export async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function randomHex(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function randomCode() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1000000).padStart(6, '0');
}

/** Fiók-oldal címe nyelvenként (a seo-fiok.mjs ugyanezeket generálja). */
export const ACCOUNT_PATH = { hu: '/fiok/', en: '/en/account/', de: '/de/konto/', fr: '/fr/compte/', uk: '/uk/kabinet/', zh: '/zh/account/', sk: '/sk/ucet/', cs: '/cs/ucet/' };
