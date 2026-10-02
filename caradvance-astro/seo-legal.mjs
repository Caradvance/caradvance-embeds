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
.cafoot-brand img{height:44px;width:auto;display:block;margin:0 0 14px}
.cafoot-brand p{margin:0 0 12px;font-size:14px;line-height:1.6;max-width:34ch;color:#aab1bf}
.cafoot h4{color:#fff;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin:4px 0 14px;font-weight:800}
.cafoot a,.cafoot button.cafoot-link{display:block;color:#cfd4de;text-decoration:none;font-size:14px;line-height:1.4;padding:5px 0;background:none;border:0;font-family:inherit;cursor:pointer;text-align:left}
.cafoot a:hover,.cafoot button.cafoot-link:hover{color:#fff}
.cafoot .cafoot-ct a{padding:3px 0;color:#fff;font-weight:700}
.cafoot-soc{display:flex;gap:10px;margin-top:14px}
.cafoot-soc a{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;padding:0}
.cafoot-soc a:hover{border-color:#E2001A;background:#E2001A}
.cafoot-soc svg{width:16px;height:16px;fill:#fff}
.cafoot-legal a{font-weight:600}
.cafoot-copy{max-width:1200px;margin:36px auto 0;padding-top:18px;border-top:1px solid rgba(255,255,255,.1);font-size:12.5px;color:#8a91a0;display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:space-between}
.cafoot-copy span{white-space:nowrap}
@media(max-width:1000px){.cafoot-in{grid-template-columns:1fr 1fr 1fr}.cafoot-brand{grid-column:1/-1}}
@media(max-width:620px){.cafoot{padding:44px 20px 24px}.cafoot-in{grid-template-columns:1fr 1fr;gap:26px 18px}.cafoot-copy{display:block}.cafoot-copy span{display:block;white-space:normal;margin-bottom:4px}}
</style>`;

const IG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.1-9.4a1.1 1.1 0 1 0 0 2.3 1.1 1.1 0 0 0 0-2.3z"/></svg>';
const FB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.6c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V21h3.4z"/></svg>';

const col = ([h, links]) => `<div><h4>${h}</h4>${links.map(([t, u]) => `<a href="${u}">${t}</a>`).join('')}</div>`;

const FOOTER = `<footer class="cafoot" data-cafoot="1">
<div class="cafoot-in">
  <div class="cafoot-brand">
    <a href="/" aria-label="CarAdvance főoldal"><img src="/caradvance-logo-white.webp" alt="CarAdvance" width="403" height="133" loading="lazy"></a>
    <p>Prémium autók Németországból — bérlés, vásárlás, egyedi rendelés, import és bizományos értékesítés.</p>
    <div class="cafoot-ct"><a href="tel:+36302336060">+36 30 233 6060</a><a href="mailto:info@caradvance.hu">info@caradvance.hu</a><a href="/kapcsolat/" style="font-weight:600;color:#cfd4de">Kapcsolat →</a></div>
    <div class="cafoot-soc"><a href="https://www.facebook.com/share/19BfQsJxSk/" target="_blank" rel="noopener" aria-label="Facebook">${FB}</a><a href="https://www.instagram.com/caradvance_hungary" target="_blank" rel="noopener" aria-label="Instagram">${IG}</a></div>
  </div>
  ${COLS.map(col).join('\n  ')}
  <div class="cafoot-legal"><h4>Jogi információk</h4>${LEGAL.map(([t, u]) => `<a href="${u}">${t}</a>`).join('')}<button type="button" class="cafoot-link" onclick="if(window.CAConsent){window.CAConsent.open()}else{location.href='/adatkezeles/#cookie'}">Süti-beállítások</button></div>
</div>
<div class="cafoot-copy"><span>© ${YEAR} Caradvance GmbH · Bgm-Graf-Ring 21, 82538 Geretsried · Amtsgericht München HRB 151009 · USt-IdNr. DE232664616</span><span>Magyarországi képviselet: BH Group Zrt. · Cg. 09-10-000660 · Adószám: 32488447-2-09</span></div>
</footer>`;

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

  // 1. lábléc
  h = h.replace(/<style id="cafoot-css">[\s\S]*?<\/style>/g, '');
  h = h.replace(/<footer class="cafoot"[\s\S]*?<\/footer>/g, '<!--cafoot-->');
  let had = false;
  h = h.replace(/<footer class="footer"[\s\S]*?<\/footer>/g, () => { had = true; return '<!--cafoot-->'; });
  if (h.includes('<!--cafoot-->')) {
    let first = true;
    h = h.replace(/<!--cafoot-->/g, () => { if (first) { first = false; return CSS + FOOTER; } return ''; });
    if (had) replaced++; else replaced++;
  } else {
    h = h.replace(/<\/body>/i, CSS + FOOTER + '</body>');
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
