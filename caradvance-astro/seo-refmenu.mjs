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
export function fixCalcMenu(h) {
  h = h.replace(GARBAGE, '}}');
  // régi fejléc: halott "#" linkek az Import menüben
  h = h.split('<a class="ddi" href="#">Autó rendelés</a><a class="ddi" href="#">Beszerzési folyamat</a><a class="ddi" href="#">Előnyök</a>')
       .join('<a class="ddi" href="/auto-rendeles">Autó rendelés</a>' + D_BESZ + '<a class="ddi" href="/elonyok">Előnyök</a><a class="ddi" href="/egyedul-vagy-velunk">Egyedül vagy velünk?</a>');
  h = h.split('<a href="#">Autó rendelés</a><a href="#">Beszerzési folyamat</a><a href="#">Előnyök</a>')
       .join('<a href="/auto-rendeles">Autó rendelés</a>' + M_BESZ + '<a href="/elonyok">Előnyök</a><a href="/egyedul-vagy-velunk">Egyedül vagy velünk?</a>');
  const fix = (h, besz, hon, ati) => {
    let out = '', i = 0, j;
    while ((j = h.indexOf(besz, i)) !== -1) {
      const end = j + besz.length;
      out += h.slice(i, end);
      const rest = h.slice(end, end + 400);
      if (rest.startsWith('<div class="ddi-sub">') || rest.startsWith('<a href="/honositas-kalkulator/">Kalkulátorok')) { /* Astro lenyíló — marad */ }
      else if (rest.startsWith(hon)) { if (!rest.slice(hon.length).startsWith(ati)) { out += hon + ati; i = end + hon.length; continue; } }
      else out += hon + ati;
      i = end;
    }
    return out + h.slice(i);
  };
  h = fix(h, D_BESZ, D_HON, D_ATI);
  h = fix(h, M_BESZ, M_HON, M_ATI);
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
