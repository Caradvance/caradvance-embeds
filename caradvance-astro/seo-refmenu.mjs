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

try {
  let files = [];
  await walk(DIST, files);
  let changed = 0, hits = 0;
  for (const f of files) {
    let h;
    try { h = await readFile(f, 'utf8'); } catch { continue; }
    if (h.indexOf(FIND) === -1) continue;
    const n = h.split(FIND).length - 1;
    h = h.split(FIND).join(REPL);
    await writeFile(f, h);
    changed++; hits += n;
  }
  console.log('[refmenu] Referenciák link javítva: ' + changed + ' oldal, ' + hits + ' előfordulás');
} catch (e) {
  console.log('[refmenu] FIGYELEM - ' + (e && e.message) + ' (a build megy tovább)');
  process.exit(0);
}
