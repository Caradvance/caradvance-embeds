/**
 * seo-ahrefs.mjs — Ahrefs Web Analytics snippet minden HTML oldal <head> részébe (utolsó build lépés).
 * A data-key nyilvános (a böngészőben is látszik), nem titok.
 */
import fs from 'node:fs';
import path from 'node:path';

const TAG = '<script src="https://analytics.ahrefs.com/analytics.js" data-key="hc0fbnlxNtmpnGbelDApVQ" async></script>';
const DIST = 'dist';
let n = 0, skip = 0;
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name === 'belso' || e.name === '_ttest') continue; walk(f); }
    else if (e.name.endsWith('.html')) {
      let h = fs.readFileSync(f, 'utf8');
      if (h.includes('analytics.ahrefs.com/analytics.js')) { skip++; continue; }
      const i = h.search(/<\/head>/i);
      if (i < 0) { skip++; continue; }
      h = h.slice(0, i) + TAG + h.slice(i);
      fs.writeFileSync(f, h); n++;
    }
  }
}
if (fs.existsSync(DIST)) walk(DIST);
console.log('[ahrefs] snippet beillesztve: ' + n + ' oldal, kihagyva: ' + skip);
