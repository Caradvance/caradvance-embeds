#!/usr/bin/env node
/**
 * CarAdvance — egységes lábléc + jogi linkek + GDPR-hozzájárulás minden oldalon.
 *
 * Futtatás a build végén:  node seo-legal.mjs [dist]
 *  1. Minden HTML-ben a régi <footer class="footer">…</footer> blokk(ok)at lecseréli
 *     az egységes CarAdvance láblécre (jogi információk oszloppal, cégadatokkal).
 *     Ahol nincs lábléc, a </body> elé teszi be.
 *  2. A régi /adatkezeles (perjel nélküli) hivatkozásokat /adatkezeles/-re javítja.
 *  3. Az "Elfogadom az adatkezelési tájékoztatót" jelölőnégyzet-szöveget kiegészíti az ÁSZF-fel.
 * Idempotens: többszöri futtatás ugyanazt az eredményt adja.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.argv[2] || 'dist';
const YEAR = new Date().getFullYear();
const SKIP = [/^belso\//, /^ajanlat\//, /^api\//];

const COLS = [
  ['Autóbérlés', [
    ['Bérelhető autóink', '/berelheto/'],
    ['Új autó bérlése', '/uj-auto-berlese/'],
    ['A bérlés előnyei', '/berles-elonyei/'],
    ['Bérlési folyamat', '/berlesi-folyamat/'],
    ['Feltételek és kaució', '/berlesi-feltetelek/'],
    ['Bérlés – gyakori kérdések', '/berles-gyakori-kerdesek/'],
  ]],
  ['Vásárlás és import', [
    ['Megvásárolható autóink', '/autoink/'],
    ['Egyedi autó rendelés', '/egyedi-auto-rendeles/'],
    ['Autó rendelés Németországból', '/auto-rendeles/'],
    ['Honosítás kalkulátor', '/honositas-kalkulator/'],
    ['Finanszírozás – lízing', '/finanszirozas-lizing/'],
  ]],
  ['Eladás és cégünk', [
    ['Eladom az autómat', '/eladom/'],
    ['Bizományos autóink', '/bizomanyos/'],
    ['Jótékonyság', '/jotekonysag/'],
    ['Miért mi?', '/miert-mi/'],
    ['Referenciák', '/referenciak/'],
    ['Blog', '/blog/'],
  ]],
];

const LEGAL = [
  ['Adatkezelési tájékoztató', '/adatkezeles/'],
  ['ÁSZF', '/aszf/'],
  ['Impresszum', '/impresszum/'],
];

const CSS = `<style id="cafoot-css">
.cafoot{background:#0B0B0D;color:#cfd4de;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;padding:56px 24px 28px;margin:0}
.cafoot *{box-sizing:border-box}
.cafoot-in{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr;gap:32px}
.cafoot-brand img{height:68px;width:auto;max-width:100%;display:block;margin:0 0 18px}
.cafoot-brand p{margin:0 0 12px;font-size:14px;line-height:1.6;max-width:34ch;color:#aab1bf}
.cafoot h4{color:#fff;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin:4px 0 14px;font-weight:800}
.cafoot a,.cafoot button.cafoot-link{display:block;color:#cfd4de;text-decoration:none;font-size:14px;line-height:1.4;padding:5px 0;background:none;border:0;font-family:inherit;cursor:pointer;text-align:left}
.cafoot a:hover,.cafoot button.cafoot-link:hover{color:#fff}
.cafoot .cafoot-ct a{padding:3px 0;color:#fff;font-weight:700}
.cafoot-soc{display:grid;grid-template-columns:repeat(4,44px);gap:12px;margin-top:18px}
.cafoot-soc a{width:44px;height:44px;border-radius:11px;display:block;padding:0;overflow:hidden;transition:transform .15s,box-shadow .15s}
.cafoot-soc a:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.45)}
.cafoot-soc svg{width:100%;height:100%;display:block}
.cafoot-legal a{font-weight:600}
.cafoot-copy{max-width:1200px;margin:36px auto 0;padding-top:18px;border-top:1px solid rgba(255,255,255,.1);font-size:12.5px;color:#8a91a0;display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:space-between}
.cafoot-copy span{white-space:nowrap}
@media(max-width:1000px){.cafoot-in{grid-template-columns:1fr 1fr 1fr}.cafoot-brand{grid-column:1/-1}}
@media(max-width:620px){.cafoot-brand img{height:60px}.cafoot-soc{grid-template-columns:repeat(8,minmax(0,44px));gap:8px}.cafoot-soc a{width:auto;height:auto;aspect-ratio:1/1}.cafoot{padding:44px 20px 24px}.cafoot-in{grid-template-columns:1fr 1fr;gap:26px 18px}.cafoot-copy{display:block}.cafoot-copy span{display:block;white-space:normal;margin-bottom:4px}}
</style>`;

// IDEIGLENES: TikTok / LinkedIn / Reddit egyelőre keresőoldalra mutat — a saját profil URL-jére cserélendő.
// Színes közösségi ikonok (40×40, lekerekített négyzet). URL nélkül a gomb nem jelenik meg.
const SOCIAL = [
  ['Google értékelések', 'https://www.google.com/maps/search/?api=1&query=Caradvance%20GmbH%20Autovermietung', '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#fff"/><g transform="translate(10 10) scale(.5833)"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></g></svg>'],
  ['Facebook', 'https://www.facebook.com/share/19BfQsJxSk/', '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="cfFb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18ACFE"/><stop offset="1" stop-color="#0163E0"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#cfFb)"/><path fill="#fff" d="M26.6 40V26.4h4.6l.7-5.4h-5.3v-3.4c0-1.6.4-2.6 2.7-2.6H32v-4.8c-.5-.1-2.2-.2-4.1-.2-4.1 0-6.9 2.5-6.9 7.1V21h-4.6v5.4H21V40h5.6z"/></svg>'],
  ['Instagram', 'https://www.instagram.com/caradvance_hungary', '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="cfIg" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect width="48" height="48" rx="12" fill="url(#cfIg)"/><rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="24" cy="24" r="6.2" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="31.6" cy="16.4" r="2" fill="#fff"/></svg>'],
  ['TikTok', 'https://www.tiktok.com/search?q=caradvance', '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#000"/><g transform="translate(1.2 0)"><path fill="#25F4EE" d="M29.6 9.5c.6 3.6 2.9 6.2 6.5 6.6v5.1c-2.4 0-4.6-.7-6.5-2v9.6c0 5.3-4.3 9.6-9.6 9.6s-9.6-4.3-9.6-9.6 4.3-9.6 9.6-9.6c.5 0 1 0 1.5.1v5.3c-.5-.2-1-.2-1.5-.2-2.4 0-4.4 2-4.4 4.4s2 4.4 4.4 4.4 4.4-2 4.4-4.4V9.5h5.2z" transform="translate(-1.4 -1.2)"/><path fill="#FE2C55" d="M29.6 9.5c.6 3.6 2.9 6.2 6.5 6.6v5.1c-2.4 0-4.6-.7-6.5-2v9.6c0 5.3-4.3 9.6-9.6 9.6s-9.6-4.3-9.6-9.6 4.3-9.6 9.6-9.6c.5 0 1 0 1.5.1v5.3c-.5-.2-1-.2-1.5-.2-2.4 0-4.4 2-4.4 4.4s2 4.4 4.4 4.4 4.4-2 4.4-4.4V9.5h5.2z" transform="translate(1 1)"/><path fill="#fff" d="M29.6 9.5c.6 3.6 2.9 6.2 6.5 6.6v5.1c-2.4 0-4.6-.7-6.5-2v9.6c0 5.3-4.3 9.6-9.6 9.6s-9.6-4.3-9.6-9.6 4.3-9.6 9.6-9.6c.5 0 1 0 1.5.1v5.3c-.5-.2-1-.2-1.5-.2-2.4 0-4.4 2-4.4 4.4s2 4.4 4.4 4.4 4.4-2 4.4-4.4V9.5h5.2z"/></g></svg>'],
  ['YouTube', 'https://www.youtube.com/channel/UCbmogjjIDqVwFtFoA-h3jjw', '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#FF0033"/><path fill="#fff" d="M19.5 15.5v17l14-8.5z"/></svg>'],
  ['Használtautó.hu', 'https://www.hasznaltauto.hu/partner/bh_group_zrt-20676', '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#FE3200"/><path fill="#fff" d="M17.2 11h5.4l-2.2 9.6c1.5-1.4 3.4-2.1 5.4-2.1 3.9 0 5.6 2.5 4.8 6.3L28.4 36h-5.4l2.1-9.9c.4-1.9-.3-2.9-2-2.9-1.9 0-3.5 1.3-4 3.6L17 36h-5.4z"/><circle cx="35" cy="33.4" r="3.2" fill="#fff"/></svg>'],
  ['LinkedIn', 'https://www.linkedin.com/search/results/companies/?keywords=caradvance', '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#0A66C2"/><rect x="12" y="19" width="5.4" height="17" fill="#fff"/><circle cx="14.7" cy="13.6" r="3.2" fill="#fff"/><path fill="#fff" d="M21.6 19h5.2v2.4c.8-1.4 2.6-2.8 5.3-2.8 5.4 0 6.4 3.5 6.4 8.1V36h-5.4v-8.1c0-2-.1-4.4-2.7-4.4-2.7 0-3.1 2.1-3.1 4.3V36h-5.4V19z"/></svg>'],
  ['Reddit', 'https://www.reddit.com/search/?q=caradvance', '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#FF4500"/><ellipse cx="24" cy="28" rx="12.5" ry="8.6" fill="#fff"/><circle cx="35.2" cy="22.2" r="3.1" fill="#fff"/><circle cx="12.8" cy="22.2" r="3.1" fill="#fff"/><circle cx="31.8" cy="11.8" r="2.4" fill="#fff"/><path d="M24 19.6l2.2-8.4 5.6 1.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19.4" cy="27" r="2.1" fill="#FF4500"/><circle cx="28.6" cy="27" r="2.1" fill="#FF4500"/><path d="M19.2 31.6c2.8 2 6.8 2 9.6 0" fill="none" stroke="#FF4500" stroke-width="1.6" stroke-linecap="round"/></svg>'],
];
const SOC = SOCIAL.filter(([, u]) => u).map(([t, u, svg]) => `<a href="${u}" target="_blank" rel="noopener" aria-label="${t}" title="${t}">${svg}</a>`).join('');

const col = ([h, links]) => `<div><h4>${h}</h4>${links.map(([t, u]) => `<a href="${u}">${t}</a>`).join('')}</div>`;

const FOOTER = `<footer class="cafoot" data-cafoot="1">
<div class="cafoot-in">
  <div class="cafoot-brand">
    <a href="/" aria-label="CarAdvance főoldal"><img src="/caradvance-logo-white.webp" alt="CarAdvance" width="403" height="133" loading="lazy"></a>
    <p>Prémium autók Németországból — bérlés, vásárlás, egyedi rendelés, import és bizományos értékesítés.</p>
    <div class="cafoot-ct"><a href="tel:+36302336060">+36 30 233 6060</a><a href="mailto:info@caradvance.hu">info@caradvance.hu</a><a href="/kapcsolat/" style="font-weight:600;color:#cfd4de">Kapcsolat →</a></div>
    <div class="cafoot-soc">${SOC}</div>
  </div>
  ${COLS.map(col).join('\n  ')}
  <div class="cafoot-legal"><h4>Jogi információk</h4>${LEGAL.map(([t, u]) => `<a href="${u}">${t}</a>`).join('')}<button type="button" class="cafoot-link" onclick="if(window.CAConsent){window.CAConsent.open()}else{location.href='/adatkezeles/#cookie'}">Süti-beállítások</button></div>
</div>
<div class="cafoot-copy"><span>© ${YEAR} Caradvance GmbH · Bgm-Graf-Ring 21, 82538 Geretsried · Amtsgericht München HRB 151009 · USt-IdNr. DE232664616</span><span>Magyarországi képviselet: BH Group Zrt. · Cg. 09-10-000660 · Adószám: 32488447-2-09</span></div>
</footer>`;

// ---- Idegen nyelvű lábléc (külföldiek Magyarországon) — a <html lang> alapján választjuk ----
import { readFileSync } from 'node:fs';
let IMAP = { pages: {} };
try { IMAP = JSON.parse(readFileSync('src/i18n/intl-map.json', 'utf8')); } catch {}
const ip = (k, l) => (IMAP.pages[k] && IMAP.pages[k][l]) || '/';
const FT = {
  en: { tag: 'Premium cars from Germany for people living in Hungary — long-term rental, import and registration, in English.', contact: 'Contact', home: 'CarAdvance home',
        s: 'Services', rental: 'Long-term car rental', imp: 'Car import from Germany', reg: 'Registration tax calculator',
        c: 'Cars', avail: 'Available cars (HU)', newc: 'New car configurator (HU)', hu: 'Magyar oldal',
        co: 'Company', blog: 'Blog (HU)', legal: 'Legal (in Hungarian)', priv: 'Privacy notice', terms: 'Terms & conditions', imp2: 'Imprint', cookie: 'Cookie settings', rep: 'Hungarian representative' },
  de: { tag: 'Premium-Autos aus Deutschland für Menschen in Ungarn — Langzeitmiete, Import und Zulassung, auf Deutsch.', contact: 'Kontakt', home: 'CarAdvance Startseite',
        s: 'Leistungen', rental: 'Auto-Langzeitmiete', imp: 'Autoimport aus Deutschland', reg: 'Registrierungssteuer-Rechner',
        c: 'Autos', avail: 'Verfügbare Autos (HU)', newc: 'Neuwagen-Konfigurator (HU)', hu: 'Magyar oldal',
        co: 'Unternehmen', blog: 'Blog (HU)', legal: 'Rechtliches (auf Ungarisch)', priv: 'Datenschutz', terms: 'AGB', imp2: 'Impressum', cookie: 'Cookie-Einstellungen', rep: 'Vertretung in Ungarn' },
  fr: { tag: 'Voitures premium d’Allemagne pour les résidents en Hongrie — location longue durée, import et immatriculation.', contact: 'Contact', home: 'Accueil CarAdvance',
        s: 'Services', rental: 'Location longue durée', imp: 'Import de voiture d’Allemagne', reg: 'Calculateur de taxe d’immatriculation',
        c: 'Voitures', avail: 'Voitures disponibles (HU)', newc: 'Configurateur voiture neuve (HU)', hu: 'Magyar oldal',
        co: 'Société', blog: 'Blog (HU)', legal: 'Mentions légales (en hongrois)', priv: 'Confidentialité', terms: 'CGV', imp2: 'Mentions légales', cookie: 'Paramètres des cookies', rep: 'Représentant en Hongrie' },
  uk: { tag: 'Преміальні авто з Німеччини для бізнесу в Угорщині — довгострокова оренда, імпорт і реєстрація для компаній та їхніх керівників.', contact: 'Контакти', home: 'Головна CarAdvance',
        s: 'Послуги', rental: 'Довгострокова оренда авто', imp: 'Авто з Німеччини', reg: 'Калькулятор реєстраційного податку',
        c: 'Авто', avail: 'Доступні авто (HU)', newc: 'Конфігуратор нових авто (HU)', hu: 'Magyar oldal',
        co: 'Компанія', blog: 'Блог (HU)', legal: 'Правова інформація (угорською)', priv: 'Політика конфіденційності', terms: 'Умови', imp2: 'Вихідні дані', cookie: 'Налаштування cookie', rep: 'Представник в Угорщині' },
  zh: { tag: '为在匈牙利经营的企业与管理层提供来自德国的高端座驾：公司长期租车、德国进口与匈牙利上牌。', contact: '联系我们', home: 'CarAdvance 首页',
        s: '服务', rental: '长期租车', imp: '德国汽车进口', reg: '登记税计算器',
        c: '汽车', avail: '现有车辆（匈牙利语）', newc: '新车配置（匈牙利语）', hu: 'Magyar oldal',
        co: '公司', blog: '博客（匈牙利语）', legal: '法律信息（匈牙利语）', priv: '隐私政策', terms: '条款', imp2: '公司信息', cookie: 'Cookie 设置', rep: '匈牙利代表' },
};
function footerFor(l) {
  const t = FT[l]; if (!t) return FOOTER;
  const cols = [
    [t.s, [[t.rental, ip('rental', l)], [t.imp, ip('import', l)], [t.reg, ip('regtax', l)]]],
    [t.c, [[t.avail, '/autoink/'], [t.newc, '/egyedi-auto-rendeles/'], [t.hu, '/']]],
    [t.co, [[t.contact, ip('contact', l)], [t.blog, '/blog/']]],
  ];
  return `<footer class="cafoot" data-cafoot="1" lang="${l === 'zh' ? 'zh-Hans' : l}">
<div class="cafoot-in">
  <div class="cafoot-brand">
    <a href="${ip('home', l)}" aria-label="${t.home}"><img src="/caradvance-logo-white.webp" alt="CarAdvance" width="403" height="133" loading="lazy"></a>
    <p>${t.tag}</p>
    <div class="cafoot-ct"><a href="tel:+36302336060">+36 30 233 6060</a><a href="mailto:info@caradvance.hu">info@caradvance.hu</a><a href="${ip('contact', l)}" style="font-weight:600;color:#cfd4de">${t.contact} →</a></div>
    <div class="cafoot-soc">${SOC}</div>
  </div>
  ${cols.map(col).join('\n  ')}
  <div class="cafoot-legal"><h4>${t.legal}</h4><a href="/adatkezeles/">${t.priv}</a><a href="/aszf/">${t.terms}</a><a href="/impresszum/">${t.imp2}</a><button type="button" class="cafoot-link" onclick="if(window.CAConsent){window.CAConsent.open()}else{location.href='/adatkezeles/#cookie'}">${t.cookie}</button></div>
</div>
<div class="cafoot-copy"><span>© ${YEAR} Caradvance GmbH · Bgm-Graf-Ring 21, 82538 Geretsried · Amtsgericht München HRB 151009 · USt-IdNr. DE232664616</span><span>${t.rep}: BH Group Zrt. · Cg. 09-10-000660 · 32488447-2-09</span></div>
</footer>`;
}

const CONSENT_OLD = /Elfogadom az <a href="\/adatkezeles\/?"([^>]*)>adatkezelési tájékoztatót<\/a>\./g;
const CONSENT_NEW = 'Elolvastam és elfogadom az <a href="/aszf/"$1>ÁSZF</a>-et és az <a href="/adatkezeles/"$1>adatkezelési tájékoztatót</a>.';

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith('.html')) yield p;
  }
}

let n = 0, replaced = 0, inserted = 0, skipped = 0;
for await (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (SKIP.some((r) => r.test(rel))) { skipped++; continue; }
  let h = await readFile(file, 'utf8');
  const orig = h;
  if (/http-equiv=["']?refresh/i.test(h) || !/<\/body>/i.test(h)) { skipped++; continue; }

  // 1. lábléc (nyelv a <html lang> alapján)
  const HL = ((h.match(/<html[^>]*\slang="([a-z]{2})/i) || [])[1] || 'hu').toLowerCase();
  const FOOT_L = HL === 'hu' ? FOOTER : footerFor(HL);
  h = h.replace(/<style id="cafoot-css">[\s\S]*?<\/style>/g, '');
  h = h.replace(/<footer class="cafoot"[\s\S]*?<\/footer>/g, '<!--cafoot-->');
  let had = false;
  h = h.replace(/<footer class="footer"[\s\S]*?<\/footer>/g, () => { had = true; return '<!--cafoot-->'; });
  if (h.includes('<!--cafoot-->')) {
    let first = true;
    h = h.replace(/<!--cafoot-->/g, () => { if (first) { first = false; return CSS + FOOT_L; } return ''; });
    if (had) replaced++; else replaced++;
  } else {
    h = h.replace(/<\/body>/i, CSS + FOOT_L + '</body>');
    inserted++;
  }

  // 2–3. jogi hivatkozások
  h = h.replace(/href="\/adatkezeles"/g, 'href="/adatkezeles/"');
  h = h.replace(CONSENT_OLD, CONSENT_NEW);
  // régi menük: a "Feltételek" pont eddig sehova (#) mutatott
  h = h.replace(/href="#"([^>]*)>Feltételek<\/a>/g, 'href="/berlesi-feltetelek/"$1>Feltételek és kaució</a>');

  if (h !== orig) { await writeFile(file, h); n++; }
}
console.log(`[seo-legal] ${n} fájl frissítve · lábléc csere: ${replaced} · beszúrás: ${inserted} · kihagyva: ${skipped}`);
