#!/usr/bin/env node
/**
 * seo-faq.mjs  —  v1  (2026-09-18)
 *
 * Egységes GYIK / FAQ megjelenés az EGÉSZ oldalon.
 *
 * Az oldalon minden <details> elem egy FAQ-akkordion (ellenőrizve: 138 oldalból
 * 69-en van <details>, mindegyik FAQ-blokk, egyik sem a fejlécben). Ezért egyetlen,
 * globális stíluslap — amit ez a lépés minden legenerált oldal <head>-jébe beszúr —
 * biztonságosan egységesíti az összes eltérő FAQ-változatot (ad-faq, bp-faq,
 * cd-faqwrap, faq-list, el-faq, pf-faq, gyik-wrap, mm-faqwrap, imp-faq, uab-faq2,
 * faq-search, ev-faq, egl-faq2, fl-faq, faq) a "finanszírozás / GYIK" kártyás
 * stílusra: fehér, lekerekített kártya, félkövér kérdés, piros kör + ikon, amely
 * nyitáskor ×-re fordul.
 *
 * A build-lánc VÉGÉN fut (a seo-canonical.mjs után). Hibára exit 0 — a buildet sosem
 * állítja meg. A stílus !important-tal íródik, hogy felülírja az oldalankénti CSS-t.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const MARKER = 'id="ca-faq-unify"';

const CSS = `
/* ===== CarAdvance — egységes GYIK / FAQ (seo-faq.mjs) ===== */
details{background:#fff!important;border:1px solid #E6EAF1!important;border-radius:14px!important;
  margin:0 0 10px!important;padding:0!important;box-shadow:none!important;overflow:hidden;}
details+details{margin-top:0!important;}
details>summary{list-style:none!important;cursor:pointer;display:flex!important;align-items:center;
  justify-content:space-between;gap:16px;padding:16px 18px!important;margin:0!important;
  font-family:inherit!important;font-weight:800!important;font-size:16px!important;line-height:1.4!important;
  color:#141519!important;background:transparent!important;border:0!important;}
details>summary::-webkit-details-marker{display:none!important;}
details>summary::marker{content:""!important;font-size:0!important;}
/* meglévő, oldalankénti ikon-elemek elrejtése (nehogy dupla ikon legyen).
   A kérdés szövege minden változatban közvetlen szöveg-csomópont (nincs elembe
   csomagolva), ezért a summary MINDEN elem-gyereke ikon/dekoráció -> elrejtjük. */
details>summary>*{display:none!important;}
/* egységes piros + ikon, ami nyitáskor ×-re fordul */
details>summary::after{content:"+"!important;flex:0 0 auto;width:26px;height:26px;
  line-height:26px!important;text-align:center;border-radius:50%;background:#E2001A!important;
  color:#fff!important;font-family:system-ui,Arial,sans-serif!important;font-weight:700!important;
  font-size:18px!important;font-style:normal!important;transition:transform .2s ease;
  transform:rotate(0);display:inline-block;}
details[open]>summary::after{transform:rotate(45deg);}
/* válasz-törzs */
details>*:not(summary){margin:0!important;padding:2px 18px 16px!important;
  color:#5A6B82!important;font-size:14.5px!important;line-height:1.6!important;}
details>*:not(summary) b,details>*:not(summary) strong{color:#141519!important;}
details>*:not(summary) a{color:#E2001A!important;}
`.trim();

const STYLE_TAG = `<style ${MARKER}>${CSS}</style>`;

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e);
    let s;
    try { s = await stat(full); } catch { continue; }
    if (s.isDirectory()) out.push(...await walk(full));
    else if (e.endsWith('.html')) out.push(full);
  }
  return out;
}

async function fut() {
  const files = await walk(DIST);
  let injected = 0, skipped = 0, noFaq = 0;
  for (const f of files) {
    let html;
    try { html = await readFile(f, 'utf8'); } catch { continue; }
    if (!/<details/i.test(html)) { noFaq++; continue; }          // csak FAQ-os oldalak
    if (html.includes(MARKER)) { skipped++; continue; }          // már megvan
    const idx = html.indexOf('</head>');
    if (idx === -1) { skipped++; continue; }
    const updated = html.slice(0, idx) + STYLE_TAG + '\n' + html.slice(idx);
    try { await writeFile(f, updated, 'utf8'); injected++; }
    catch { skipped++; }
  }
  console.log(`[faq] egységes GYIK stílus beszúrva: ${injected} oldal | kihagyva: ${skipped} | nincs FAQ: ${noFaq}`);
}

fut().catch(e => { console.error('[faq] HIBA (a build folytatódik):', e.message); });
