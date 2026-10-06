#!/usr/bin/env node
/**
 * CarAdvance — utolsó build-lépés: túl rövid meta description kiegészítése (Ahrefs: <110 karakter).
 * A build legvégén fut (a seo-noprice után), így semmi nem írja felül.
 * Nyelvenként egy rövid, igaz CTA-utótagot fűz hozzá (max. 160 karakterig). zh: nem (karakter-sűrű írás).
 */
import fs from 'node:fs';
import path from 'node:path';
const DIST = process.argv[2] || 'dist';
const SUF = {
  hu: [' Kérj ajánlatot: +36 30 233 6060.', ' Prémium autók Németországból – CarAdvance.'],
  en: [' Get a quote: +36 30 233 6060.', ' Premium cars from Germany – CarAdvance.'],
  de: [' Angebot anfordern: +36 30 233 6060.', ' Premium-Autos aus Deutschland – CarAdvance.'],
  fr: [' Demandez un devis : +36 30 233 6060.', ' Voitures premium d’Allemagne – CarAdvance.'],
  uk: [' Отримайте пропозицію: +36 30 233 6060.', ' Преміум-авто з Німеччини – CarAdvance.'],
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dec = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
function pad(d, l) {
  const suf = SUF[l]; if (!suf || d.length >= 110) return d;
  let o = d.trim(); if (!/[.!?…]$/.test(o)) o += '.';
  for (const x of suf) { if (o.length >= 110) break; if (o.length + x.length <= 160 && !o.includes(x.trim())) o += x; }
  return o;
}
function walk(dir, rel = '', out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (/^(_astro|i18n|api|cdn-cgi)$/.test(r)) continue; walk(path.join(dir, e.name), r, out); }
    else if (e.name.endsWith('.html')) out.push(r);
  }
  return out;
}
let n = 0, seen = 0; const ex = [];
for (const rel of walk(DIST)) {
  const f = path.join(DIST, rel);
  let h = fs.readFileSync(f, 'utf8');
  if (/http-equiv=["']?refresh/i.test(h)) continue;
  const l = (rel.replace(/^_np\//, '').match(/^(en|de|fr|uk|zh|sk|cs|pl)\//) || [, 'hu'])[1];
  const re = /(<meta\b[^>]*\b(?:name="description"|property="og:description"|name="twitter:description")[^>]*\bcontent=")([^"]*)(")/gi;
  let changed = false;
  h = h.replace(re, (m, a, v, c) => { seen++; const d = dec(v); const nd = pad(d, l); if (nd === d) return m; changed = true; if (ex.length < 3) ex.push(rel + ': ' + d.length + '→' + nd.length); return a + esc(nd) + c; });
  if (changed) { fs.writeFileSync(f, h); n++; }
}
console.log(`[seo-desc] ${n} oldal leírása kiegészítve (${seen} meta átnézve) ${JSON.stringify(ex)}`);
