#!/usr/bin/env node
/**
 * seo-video.mjs  —  v1  (2026-09-20)
 *
 * Megbízható hero-videó autoplay az EGÉSZ oldalon.
 *
 * A hero videók helyesen be vannak állítva (autoplay + muted + playsinline),
 * de a böngészők néha halasztják/blokkolják a némított autoplay-t (nem fókuszált
 * fül betöltéskor, energiatakarékos mód, megszakított play-ígéret) — és nincs
 * JS-fallback, ami újrapróbálná. Emiatt a poszter-kép ott ragad.
 *
 * Ez a lépés minden legenerált oldalba, amelyben van <video>, beszúr egy kis
 * szkriptet, ami: betöltéskor elindítja a videó(ka)t, újrapróbál a load-eseményekre,
 * a fül láthatóvá válásakor, az első felhasználói interakcióra, és pár késleltetett
 * próbával. Így a hero videó "mindig" elindul.
 *
 * A build-lánc VÉGÉN fut. Hibára exit 0 — a buildet sosem állítja meg.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const MARKER = 'ca-hero-video-fix';

const SCRIPT =
`<script id="${MARKER}">(function(){` +
`function k(v){if(!v)return;try{v.muted=true;v.setAttribute('muted','');var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}` +
`function init(){var vids=[].slice.call(document.querySelectorAll('.hero video, video.video-bg, .egl-mhero video'));if(!vids.length)return;` +
`vids.forEach(function(v){k(v);['loadeddata','canplay','canplaythrough'].forEach(function(ev){v.addEventListener(ev,function(){k(v);});});});` +
`document.addEventListener('visibilitychange',function(){if(!document.hidden)vids.forEach(k);});` +
`var once=function(){vids.forEach(k);['pointerdown','touchstart','scroll','keydown'].forEach(function(ev){document.removeEventListener(ev,once);});};` +
`['pointerdown','touchstart','scroll','keydown'].forEach(function(ev){document.addEventListener(ev,once,{passive:true});});` +
`setTimeout(function(){vids.forEach(k);},400);setTimeout(function(){vids.forEach(k);},1500);}` +
`if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);})();</script>`;

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
  let injected = 0, skipped = 0, noVideo = 0;
  for (const f of files) {
    let html;
    try { html = await readFile(f, 'utf8'); } catch { continue; }
    if (!/<video/i.test(html)) { noVideo++; continue; }        // csak videós oldalak
    if (html.includes(MARKER)) { skipped++; continue; }        // már megvan
    const idx = html.lastIndexOf('</body>');
    if (idx === -1) { skipped++; continue; }
    const updated = html.slice(0, idx) + SCRIPT + '\n' + html.slice(idx);
    try { await writeFile(f, updated, 'utf8'); injected++; }
    catch { skipped++; }
  }
  console.log(`[video] hero autoplay szkript beszúrva: ${injected} oldal | kihagyva: ${skipped} | nincs videó: ${noVideo}`);
}

fut().catch(e => { console.error('[video] HIBA (a build folytatódik):', e.message); });
