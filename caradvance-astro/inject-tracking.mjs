#!/usr/bin/env node
/**
 * CarAdvance — mérőkód beillesztése a kész buildbe.
 *
 * Használat:   node inject-tracking.mjs dist [további könyvtárak...]
 *
 * Minden .html fájl <head> szakaszának a végére beteszi a konfigurációt és a két
 * szkriptet. Idempotens: a már megjelölt fájlokat kihagyja, tehát újrafuttatható.
 * Ha a ca-config.json hiányzik vagy hibás, a build NEM áll meg — figyelmeztet és
 * kihagyja a beillesztést, hogy egy elgépelés soha ne vigye le az oldalt.
 *
 * 2026-10: a két szkript URL-je verziót kap (?v=<tartalom-hash>), így módosítás után a
 * böngészők azonnal az új változatot töltik be (a statikus fájlok 4 órán át gyorsítótárazódnak).
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const START = '<!-- ca-tracking:start -->';
const END = '<!-- ca-tracking:end -->';
const CONFIG_FILE = process.env.CA_CONFIG || 'ca-config.json';

const dirs = process.argv.slice(2).filter(Boolean);
if (!dirs.length) dirs.push('dist');

let config;
try {
  if (!existsSync(CONFIG_FILE)) throw new Error(CONFIG_FILE + ' nem található');
  config = JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
} catch (e) {
  console.warn('[ca] FIGYELEM: a mérőkód beillesztése kimarad — ' + e.message);
  process.exit(0);
}

const missing = ['GA4_ID', 'ADS_ID', 'META_PIXEL_ID']
  .filter((k) => !config[k] || String(config[k]).includes('X'));
if (missing.length) {
  console.warn('[ca] FIGYELEM: még kitöltetlen azonosító: ' + missing.join(', ') +
    ' — a kód bekerül, de ezek a rendszerek nem mérnek, amíg ki nem töltöd.');
}

// verzió a fájl tartalmából (ha nem található, verzió nélkül marad)
function ver(file) {
  for (const d of [dirs[0] || 'dist', 'public']) {
    try { return '?v=' + createHash('sha1').update(readFileSync(path.join(d, file))).digest('hex').slice(0, 10); } catch { /* következő */ }
  }
  return '';
}

// caradvance.cz / .sk / .pl: a beküldés utáni köszönő / hiba-üzenet a piac nyelvén, a helyi telefonszámmal
// (dist/cs, dist/sk, dist/pl és ezek /en/, /de/, /hu/ változata; a magyar oldalak változatlanok)
const MKT = {
  cs: { mail: 'info@caradvance.cz', PHONE: '+420 604 313 136', WHATSAPP: 'https://wa.me/421915410555', priv: '/ochrana-osobnich-udaju/#cookie' },
  sk: { mail: 'info@caradvance.sk', PHONE: '+421 915 410 555', WHATSAPP: 'https://wa.me/421915410555' },
  pl: { mail: 'info@caradvance.hu', PHONE: '+36 30 233 6060', WHATSAPP: 'https://wa.me/36302336060' }
};
const MSG = {
  cs: (m) => ({ THANKS_TITLE: 'Děkujeme za váš zájem!', THANKS_TEXT: 'Vaši poptávku jsme přijali a brzy se vám ozveme s nabídkou na míru.', THANKS_NOTE: 'Pokud spěcháte, klidně nám zavolejte.',
    ERROR_TITLE: 'Odeslání se nezdařilo', ERROR_TEXT: 'Vaši poptávku se bohužel nepodařilo přijmout. Zavolejte nám prosím nebo napište na ' + m + ' — vyřídíme to během pár minut.' }),
  sk: (m) => ({ THANKS_TITLE: 'Ďakujeme za váš záujem!', THANKS_TEXT: 'Váš dopyt sme prijali a čoskoro sa vám ozveme s ponukou na mieru.', THANKS_NOTE: 'Ak sa ponáhľate, pokojne nám zavolajte.',
    ERROR_TITLE: 'Odoslanie sa nepodarilo', ERROR_TEXT: 'Váš dopyt sa, žiaľ, nepodarilo prijať. Zavolajte nám, prosím, alebo napíšte na ' + m + ' — vybavíme to za pár minút.' }),
  pl: (m) => ({ THANKS_TITLE: 'Dziękujemy za zainteresowanie!', THANKS_TEXT: 'Otrzymaliśmy Twoje zapytanie i wkrótce odezwiemy się z indywidualną ofertą.', THANKS_NOTE: 'Jeśli sprawa jest pilna, zadzwoń do nas.',
    ERROR_TITLE: 'Nie udało się wysłać', ERROR_TEXT: 'Niestety nie udało się przyjąć Twojego zapytania. Zadzwoń do nas lub napisz na ' + m + ' — załatwimy to w kilka minut.' }),
  en: (m) => ({ THANKS_TITLE: 'Thank you for your interest!', THANKS_TEXT: 'We have received your request and will get back to you shortly with a tailored offer.', THANKS_NOTE: 'If it is urgent, feel free to call us.',
    ERROR_TITLE: 'Sending failed', ERROR_TEXT: 'Unfortunately, we could not receive your request. Please call us or write to ' + m + ' — we will sort it out in a few minutes.' }),
  de: (m) => ({ THANKS_TITLE: 'Vielen Dank für Ihr Interesse!', THANKS_TEXT: 'Wir haben Ihre Anfrage erhalten und melden uns in Kürze mit einem individuellen Angebot.', THANKS_NOTE: 'Wenn es eilt, rufen Sie uns gerne an.',
    ERROR_TITLE: 'Senden fehlgeschlagen', ERROR_TEXT: 'Leider konnten wir Ihre Anfrage nicht empfangen. Bitte rufen Sie uns an oder schreiben Sie an ' + m + ' — wir erledigen das in wenigen Minuten.' }),
  hu: (m) => ({ ERROR_TEXT: 'Sajnos nem tudtuk fogadni a kérésed. Kérjük, hívj minket, vagy írj a ' + m + ' címre — pár perc alatt elintézzük.' })
};
function cfgFor(dir, file) {
  const seg = path.relative(dir, file).split(path.sep);
  const mk = MKT[seg[0]];
  if (!mk || seg.length < 2) return config;
  const sub = ['en', 'de', 'hu'].includes(seg[1]) ? seg[1] : seg[0];
  const o = Object.assign({}, config, MSG[sub](mk.mail), { PHONE: mk.PHONE, WHATSAPP: mk.WHATSAPP });
  if (mk.priv) o.COOKIE_POLICY_URL = (sub === 'en' || sub === 'de' ? '/' + sub : '') + mk.priv;
  return o;
}
const blockFor = (cfg) => [
  START,
  '<script>window.CA_CFG=' + JSON.stringify(cfg) + ';</script>',
  '<script src="/ca-consent.js' + ver('ca-consent.js') + '" defer></script>',
  '<script src="/ca-track.js' + ver('ca-track.js') + '" defer></script>',
  END
].join('\n');
const block = blockFor(config);

async function* walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { yield* walk(p); continue; }
    if (e.isFile() && /\.html?$/i.test(e.name)) yield p;
  }
}

let touched = 0, skipped = 0, noHead = 0;

for (const dir of dirs) {
  if (!existsSync(dir)) { console.warn('[ca] nincs ilyen könyvtár: ' + dir); continue; }
  const s = await stat(dir);
  if (!s.isDirectory()) { console.warn('[ca] nem könyvtár: ' + dir); continue; }

  for await (const file of walk(dir)) {
    const html = await readFile(file, 'utf8');

    if (html.includes(START)) { skipped++; continue; }
    const idx = html.toLowerCase().lastIndexOf('</head>');
    if (idx === -1) { noHead++; continue; }

    const c = cfgFor(dir, file);
    const out = html.slice(0, idx) + (c === config ? block : blockFor(c)) + '\n' + html.slice(idx);
    await writeFile(file, out, 'utf8');
    touched++;
  }
}

console.log(`[ca] mérőkód beillesztve: ${touched} oldal` +
  (skipped ? `, kihagyva (már benne volt): ${skipped}` : '') +
  (noHead ? `, </head> nélkül: ${noHead}` : ''));
