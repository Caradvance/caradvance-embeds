/**
 * CarAdvance — ügyfélfiók közös segédei (D1: env.DB).
 * Csak meglévő ügyfeleknek: a fiókot munkatárs hozza létre a /belso felületen (Ügyfélfiókok).
 * A táblákat az első kéréskor maga hozza létre, külön migráció nem kell.
 * A CRM tábláit (deals, offer_tokens, users) csak olvassa.
 */

let READY = false;

export async function ensureTables(env) {
  if (READY || !env.DB) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT DEFAULT '', phone TEXT DEFAULT '', company TEXT DEFAULT '', lang TEXT DEFAULT 'hu', marketing INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), last_login TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_codes (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, link_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER DEFAULT 0, lang TEXT DEFAULT 'hu')`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, win INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_deal_info (deal_id INTEGER PRIMARY KEY, eta TEXT DEFAULT '', note TEXT DEFAULT '', updated_at TEXT DEFAULT (datetime('now')), updated_by INTEGER)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, deal_id INTEGER, number TEXT DEFAULT '', title TEXT DEFAULT '', amount REAL NOT NULL DEFAULT 0, currency TEXT DEFAULT 'HUF', due_date TEXT DEFAULT '', paid_at TEXT, created_at TEXT DEFAULT (datetime('now')), created_by INTEGER)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_cust_invoices_user ON cust_invoices (user_id)`)
  ]);
  // Oszlopok a meghívásos működéshez (ha a tábla korábbról már létezik)
  for (const col of [`active INTEGER DEFAULT 0`, `invited_at TEXT`, `created_by INTEGER`]) {
    try { await env.DB.prepare(`ALTER TABLE cust_users ADD COLUMN ${col}`).run(); } catch (e) { /* már létezik */ }
  }
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
export function normEmail(e) {
  const s = String(e || '').trim().toLowerCase();
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/.test(s) ? s : '';
}

/** Fiók-oldal címe nyelvenként (a seo-fiok.mjs ugyanezeket generálja). */
export const ACCOUNT_PATH = { hu: '/fiok/', en: '/en/account/', de: '/de/konto/', fr: '/fr/compte/', uk: '/uk/kabinet/', zh: '/zh/account/', sk: '/sk/ucet/', cs: '/cs/ucet/' };
export const LANGS = Object.keys(ACCOUNT_PATH);

/** Belépő kód + egykattintásos link létrehozása (a kód hash-elve tárolódik). */
export async function issueCode(env, email, lang, validSec) {
  const code = randomCode();
  const link = randomHex(24);
  const exp = Math.floor(Date.now() / 1000) + validSec;
  await env.DB.prepare(`INSERT INTO cust_codes (email, code_hash, link_hash, expires_at, attempts, lang) VALUES (?, ?, ?, ?, 0, ?)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, link_hash = excluded.link_hash, expires_at = excluded.expires_at, attempts = 0, lang = excluded.lang`)
    .bind(email, await sha256hex(email + '|' + code), await sha256hex('l|' + link), exp, lang).run();
  return { code, link };
}

export function emailShell(inner, footer) {
  return `<div style="background:#f4f7fb;padding:24px 12px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#141519">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf1">
    <div style="background:#0b0b0d;padding:18px 24px"><img src="https://www.caradvance.hu/caradvance-logo-email.png" alt="CarAdvance" width="180" height="60" style="width:180px;height:60px;display:block;border:0"></div>
    <div style="padding:26px 24px 22px">${inner}</div>
    <div style="padding:14px 24px;background:#f4f7fb;color:#6b7280;font-size:12px;line-height:1.55"><b style="color:#141519">Caradvance GmbH</b> · Bgm-Graf-Ring 21 · D-82538 Geretsried${footer ? '<br>' + footer : ''}</div>
  </div></div>`;
}

export async function sendMail(env, to, subject, html, text) {
  if (!env.RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.CUSTOMER_EMAIL_FROM || env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>', to: [to], reply_to: env.CUSTOMER_REPLY_TO || 'info@caradvance.hu', subject, html, text })
  });
  return r.ok;
}

/** Meghívó e-mail szövegei (a munkatárs küldi a /belso felületről). */
export const INVITE = {
  hu: { subj: 'Elkészült a CarAdvance ügyfélfiókod', title: 'Elkészült az ügyfélfiókod', lead: 'Kollégánk létrehozta a CarAdvance ügyfélfiókodat. Itt bármikor megnézheted, hol tart az autód, mikor érkezik, és mi a fizetendő.', btn: 'Belépés a fiókomba', how: 'Később is be tudsz lépni: a caradvance.hu oldalon kattints a profil ikonra, add meg ezt az e-mail címet ({e}), és küldünk egy egyszeri kódot. Jelszó nem kell.', valid: 'A gomb {d} napig érvényes.' },
  en: { subj: 'Your CarAdvance customer account is ready', title: 'Your customer account is ready', lead: 'Our team has created your CarAdvance customer account. Here you can check at any time where your car is, when it arrives and what is due.', btn: 'Sign in to my account', how: 'You can sign in any time later: click the profile icon on caradvance.hu, enter this e-mail address ({e}) and we will send you a one-time code. No password needed.', valid: 'The button is valid for {d} days.' },
  de: { subj: 'Ihr CarAdvance-Kundenkonto ist bereit', title: 'Ihr Kundenkonto ist bereit', lead: 'Unser Team hat Ihr CarAdvance-Kundenkonto eingerichtet. Dort sehen Sie jederzeit, wo Ihr Auto ist, wann es ankommt und was fällig ist.', btn: 'Zu meinem Konto', how: 'Sie können sich jederzeit anmelden: Klicken Sie auf caradvance.hu auf das Profilsymbol, geben Sie diese E-Mail-Adresse ein ({e}) und Sie erhalten einen Einmalcode. Kein Passwort nötig.', valid: 'Der Button ist {d} Tage gültig.' },
  fr: { subj: 'Votre compte client CarAdvance est prêt', title: 'Votre compte client est prêt', lead: 'Notre équipe a créé votre compte client CarAdvance. Vous y voyez à tout moment où en est votre voiture, quand elle arrive et ce qui est à payer.', btn: 'Accéder à mon compte', how: 'Vous pourrez vous connecter à tout moment : cliquez sur l’icône profil sur caradvance.hu, saisissez cette adresse ({e}) et nous vous enverrons un code à usage unique. Aucun mot de passe.', valid: 'Le bouton est valable {d} jours.' },
  uk: { subj: 'Ваш кабінет клієнта CarAdvance готовий', title: 'Ваш кабінет клієнта готовий', lead: 'Наш менеджер створив ваш кабінет клієнта CarAdvance. Тут ви будь-коли побачите, де ваше авто, коли воно прибуде та що потрібно сплатити.', btn: 'Увійти до кабінету', how: 'Увійти можна будь-коли: натисніть іконку профілю на caradvance.hu, введіть цю e-mail адресу ({e}) – ми надішлемо одноразовий код. Пароль не потрібен.', valid: 'Кнопка дійсна {d} днів.' },
  zh: { subj: '您的 CarAdvance 客户账户已开通', title: '您的客户账户已开通', lead: '我们的顾问已为您开通 CarAdvance 客户账户。您可随时查看车辆进度、预计到达时间以及应付款项。', btn: '进入我的账户', how: '以后也可随时登录：在 caradvance.hu 点击个人图标，输入此邮箱（{e}），我们会发送一次性验证码。无需密码。', valid: '按钮在 {d} 天内有效。' },
  sk: { subj: 'Váš zákaznícky účet CarAdvance je pripravený', title: 'Váš zákaznícky účet je pripravený', lead: 'Náš tím vám vytvoril zákaznícky účet CarAdvance. Kedykoľvek v ňom uvidíte, kde je vaše auto, kedy príde a čo je splatné.', btn: 'Prihlásiť sa do účtu', how: 'Prihlásiť sa môžete kedykoľvek: na caradvance.hu kliknite na ikonu profilu, zadajte tento e-mail ({e}) a pošleme vám jednorazový kód. Bez hesla.', valid: 'Tlačidlo platí {d} dní.' },
  cs: { subj: 'Váš zákaznický účet CarAdvance je připraven', title: 'Váš zákaznický účet je připraven', lead: 'Náš tým vám založil zákaznický účet CarAdvance. Kdykoli v něm uvidíte, kde je vaše auto, kdy dorazí a co je splatné.', btn: 'Přihlásit se k účtu', how: 'Přihlásit se můžete kdykoli: na caradvance.hu klikněte na ikonu profilu, zadejte tento e-mail ({e}) a pošleme vám jednorázový kód. Bez hesla.', valid: 'Tlačítko platí {d} dní.' }
};
