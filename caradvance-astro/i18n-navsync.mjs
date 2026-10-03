/**
 * i18n-navsync.mjs — egységes főmenü minden oldalon (2026-10)
 * A régi, statikusan "sütött" oldalak (főoldal, /autoink/, /auto/…, /bizomanyos/ …) régi menüt
 * tartalmaznak, amit eddig a caradvance-chat.js a böngészőben cserélt le magyar feliratok alapján —
 * a lefordított oldalakon ez nem működött. Most build közben minden oldal a Nav.astro menüjét kapja
 * (a /kapcsolat/ oldalról véve), így a magyar és a lefordított oldalak menüje azonos.
 */
import fs from 'node:fs';
import path from 'node:path';

function navBlock(h) {
  const i = h.indexOf('<div class="ca-navwrap"');
  if (i < 0) return null;
  const re = /<div\b|<\/div>/g; re.lastIndex = i; let depth = 0, m;
  while ((m = re.exec(h))) { depth += m[0] === '</div>' ? -1 : 1; if (depth === 0) return [i, m.index + 6]; }
  return null;
}

export function navSync(DIST, rels) {
  const src = ['kapcsolat/index.html', 'miert-mi/index.html'].map((r) => path.join(DIST, r)).find((f) => fs.existsSync(f));
  if (!src) return 0;
  const ch = fs.readFileSync(src, 'utf8'); const cb = navBlock(ch);
  if (!cb) return 0;
  const canon = ch.slice(cb[0], cb[1]);
  if (!canon.includes('ddi-sub')) return 0;
  let n = 0;
  for (const rel of rels) {
    const f = path.join(DIST, rel); const h = fs.readFileSync(f, 'utf8'); const b = navBlock(h);
    if (!b) continue;
    const cur = h.slice(b[0], b[1]);
    if (cur === canon) continue;
    fs.writeFileSync(f, h.slice(0, b[0]) + canon + h.slice(b[1])); n++;
  }
  return n;
}
