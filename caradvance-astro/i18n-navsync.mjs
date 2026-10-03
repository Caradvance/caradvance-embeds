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

// a Nav.astro menü almenüinek stílusa (a régi sütött oldalakon nincs betöltve)
const CSS = `<style id="ca-navsync-css">.ca-navwrap .dd-inner .ddi-sub{position:relative}.ca-navwrap .ddi-parent{display:flex;align-items:center;justify-content:space-between;gap:12px}.ca-navwrap .ddi-parent .subchev{opacity:.55;font-size:1.15em;line-height:1;transform:translateY(-1px)}.ca-navwrap .ddi-sub>.flyout{position:absolute;top:-6px;left:100%;min-width:170px;background:#fff;border:1px solid #e8e8ea;border-radius:12px;box-shadow:0 14px 34px rgba(0,0,0,.14);padding:6px;display:none;z-index:70}.ca-navwrap .ddi-sub:hover>.flyout,.ca-navwrap .ddi-sub.open>.flyout{display:block}.ca-navwrap .ddi-sub>.flyout .ddi{white-space:nowrap}.ca-navwrap .ddi-brand{display:flex;align-items:center;gap:11px}.ca-navwrap .ddi-brand .brandlogo{width:22px;height:22px;object-fit:contain;flex:0 0 22px}.ca-navwrap .m-sub .m-subitem{display:flex;align-items:center;gap:10px;padding-left:30px;opacity:.85;font-size:.95em}.ca-navwrap .m-sub .m-subitem .brandlogo{width:20px;height:20px;object-fit:contain;flex:0 0 20px}</style><script id="ca-langhash">document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a.langopt,a.m-langopt');if(a&&location.hash){var h=a.getAttribute('href')||'';if(h.indexOf('#')<0)a.setAttribute('href',h+location.hash);}},true);</script>`;

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
    if (cur === canon && h.includes('id="ca-navsync-css"')) continue;
    let out = h.slice(0, b[0]) + canon + h.slice(b[1]);
    if (!out.includes('id="ca-navsync-css"')) out = out.replace(/<\/head>/i, CSS + '\n</head>');
    fs.writeFileSync(f, out); n++;
  }
  return n;
}
