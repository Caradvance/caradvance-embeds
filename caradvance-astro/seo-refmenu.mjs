#!/usr/bin/env node
/**
 * seo-refmenu.mjs  —  v1  (2026-09-24)
 *
 * REFERENCIÁK MENÜPONT: minden oldalon a /referenciak oldalra mutasson.
 *
 * MIÉRT
 * A fejléc (és a mobil menü) "Referenciák" linkje sok oldalon még href="#" volt
 * — vagyis nem kattintható. Ez a hardkódolt (nem Astro) fejlécet használó
 * oldalakon fordult elő: a kezdőlap, az /auto/* autóoldalak, az /autoink,
 * /berelheto, /bizomanyos stb. passthrough HTML-ek. Az Astro Nav.astro már
 * helyes; ez a lépés a KÉSZ dist/ MINDEN oldalán egységesen javítja a linket,
 * a sablontól függetlenül.
 *
 * MIT TESZ (a dist összes .html oldalán)
 *   href="#">Referenciák   ->   href="/referenciak">Referenciák
 * (desktop .ddi és mobil <a> változat is; a felirat mindig "Referenciák").
 *
 * Idempotens (a már javított oldalakon nincs mit cserélni).
 * Hibára exit 0 — a buildet sosem állítja meg.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const FIND = 'href="#">Referenciák';
const REPL = 'href="/referenciak">Referenciák';

async function walk(dir, out) {
  let entries;
  try { entries = await readdir(dir); } catch { return; }
  for (const name of entries) {
    const p = path.join(dir, name);
    let s;
    try { s = await stat(p); } catch { continue; }
    if (s.isDirectory()) await walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
}

// ---------------------------------------------------------------------------
// KALKULÁTOROK AZ IMPORT MENÜBEN (v2, 2026-10-02)
// A nem-Astro (passthrough) oldalak fejlécéből — kezdőlap, /auto/*, /autoink,
// /bizomanyos stb. — hiányzott a Honosítás / Átírás kalkulátor menüpont. A
// kezdőlapon ráadásul egy hibás szerkesztés a menü-kódot a <style> blokkba
// tette (láthatatlan volt). Itt: a hibás CSS-darabot kivesszük, és a
// "Beszerzési folyamat" után beszúrjuk a két kalkulátort (desktop + mobil).
// Az Astro oldalak (Kalkulátorok lenyíló) érintetlenek.
const D_BESZ = '<a class="ddi" href="/beszerzesi-folyamat">Beszerzési folyamat</a>';
const D_HON = '<a class="ddi" href="/honositas-kalkulator/">Honosítás kalkulátor</a>';
const D_ATI = '<a class="ddi" href="/atiras-kalkulator/">Átírás kalkulátor</a>';
const M_BESZ = '<a href="/beszerzesi-folyamat">Beszerzési folyamat</a>';
const M_HON = '<a href="/honositas-kalkulator/">Honosítás kalkulátor</a>';
const M_ATI = '<a href="/atiras-kalkulator/">Átírás kalkulátor</a>';
const GARBAGE = /\}\}beszerzesi-folyamat">Beszerzési folyamat<\/a><div class="ddi-sub">[\s\S]*?<\/div><\/div>/g;
const KALK = [['Honosítás kalkulátor', '/honositas-kalkulator/'], ['Átírás kalkulátor', '/atiras-kalkulator/'], ['Lízing kalkulátor', '/finanszirozas-lizing/']];
// Saját osztálynevek (kalk-*), hogy a caradvance-chat.js márka-lenyíló szkriptje (".ddi-sub" esetén kilép) ne álljon le.
const KALK_D = '<div class="kalk-sub"><a class="ddi kalk-parent" href="/honositas-kalkulator/">Kalkulátorok<span class="subchev">›</span></a><div class="kalk-fly">'
  + KALK.map(([t, u]) => `<a class="ddi" href="${u}">${t}</a>`).join('') + '</div></div>';
const KALK_M = '<a href="/honositas-kalkulator/">Kalkulátorok</a>'
  + KALK.map(([t, u]) => `<a class="m-subitem" href="${u}"><span>${t}</span></a>`).join('');
const KALK_CSS = '<style id="kalkSubCss">.ca-navwrap .kalk-sub{position:relative}'
  + '.ca-navwrap .kalk-parent{display:flex;align-items:center;justify-content:space-between;gap:12px}'
  + '.ca-navwrap .kalk-parent .subchev{opacity:.55;font-size:1.15em;line-height:1;transform:translateY(-1px)}'
  + '.ca-navwrap .kalk-fly{position:absolute;top:-6px;left:100%;min-width:186px;background:#fff;border:1px solid #e8e8ea;border-radius:12px;box-shadow:0 14px 34px rgba(0,0,0,.14);padding:6px;display:none;z-index:1000}'
  + '.ca-navwrap .kalk-sub:hover>.kalk-fly,.ca-navwrap .kalk-sub.open>.kalk-fly{display:block}'
  + '.ca-navwrap .kalk-fly .ddi{white-space:nowrap}'
  + '.ca-navwrap .m-sub .m-subitem{display:flex;align-items:center;gap:10px;padding-left:30px;opacity:.85;font-size:.95em}</style>'
  + '<script>document.addEventListener("click",function(e){var p=e.target.closest&&e.target.closest(".kalk-parent");if(!p)return;var s=p.parentNode;'
  + 'if(window.matchMedia&&window.matchMedia("(hover: none)").matches&&!s.classList.contains("open")){e.preventDefault();s.classList.add("open");}});</script>';

export function fixCalcMenu(h) {
  h = h.replace(GARBAGE, '}}');
  // régi fejléc: halott "#" linkek az Import menüben
  h = h.split('<a class="ddi" href="#">Autó rendelés</a><a class="ddi" href="#">Beszerzési folyamat</a><a class="ddi" href="#">Előnyök</a>')
       .join('<a class="ddi" href="/auto-rendeles">Autó rendelés</a>' + D_BESZ + '<a class="ddi" href="/elonyok">Előnyök</a><a class="ddi" href="/egyedul-vagy-velunk">Egyedül vagy velünk?</a>');
  h = h.split('<a href="#">Autó rendelés</a><a href="#">Beszerzési folyamat</a><a href="#">Előnyök</a>')
       .join('<a href="/auto-rendeles">Autó rendelés</a>' + M_BESZ + '<a href="/elonyok">Előnyök</a><a href="/egyedul-vagy-velunk">Egyedül vagy velünk?</a>');
  const fix = (h, besz, keep, strip, block) => {
    let out = '', i = 0, j;
    while ((j = h.indexOf(besz, i)) !== -1) {
      let end = j + besz.length;
      out += h.slice(i, end);
      if (!keep.some((k) => h.startsWith(k, end))) {
        for (const st of strip) if (h.startsWith(st, end)) end += st.length;
        out += block;
      }
      i = end;
    }
    return out + h.slice(i);
  };
  h = fix(h, D_BESZ, ['<div class="ddi-sub">', '<div class="kalk-sub">'], [D_HON, D_ATI], KALK_D);
  h = fix(h, M_BESZ, ['<a href="/honositas-kalkulator/">Kalkulátorok'], [M_HON, M_ATI], KALK_M);
  if (h.includes('class="kalk-sub"') && !h.includes('id="kalkSubCss"')) h = h.replace('</head>', KALK_CSS + '</head>');
  return h;
}

try {
  let files = [];
  await walk(DIST, files);
  let changed = 0, hits = 0;
  for (const f of files) {
    let h;
    try { h = await readFile(f, 'utf8'); } catch { continue; }
    const orig = h;
    if (h.indexOf(FIND) !== -1) {
      hits += h.split(FIND).length - 1;
      h = h.split(FIND).join(REPL);
    }
    h = fixCalcMenu(h);
    if (h === orig) continue;
    await writeFile(f, h);
    changed++;
  }
  console.log('[refmenu] ' + changed + ' oldal frissítve · Referenciák link: ' + hits + ' · Import menü kalkulátorok pótolva');
} catch (e) {
  console.log('[refmenu] FIGYELEM - ' + (e && e.message) + ' (a build megy tovább)');
  process.exit(0);
}
