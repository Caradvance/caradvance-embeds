// Build-time regeneralas: /autoink/ es /auto/<slug>/ a Google Sheetbol.
//
// MIERT KELL EZ
// A napi keszlet-pipeline (Apps Script) a Google Sheetbe ir, a weboldal viszont
// statikus build. A Cloudflare deploy hook eddig ugyanazt a commitot epitette
// ujra, ezert a Sheet valtozasai (uj autok, eladott autok) nem jutottak ki:
// a fix-pages.mjs a repoban COMMITOLT, kesz HTML-t masolta be. Azt a HTML-t a
// repo gyokereben levo generate.mjs allitja elo (az OLVASSA a Sheetet), de a
// build eddig nem futtatta - valaki kezzel futtatta es commitolta.
//
// MIT TESZ
// 1. lemasolja a ../generate.mjs-t (.gen-src/) - az eredetit nem bantja
// 2. rafuttatja a patch-generate.mjs-t (Sheet-oszlopok, eladva-ful,
//    berleti arak, bizomanyos, Sheet-SEO/JSON-LD)
// 3. lefuttatja a masolatot: OUT=.gen -> friss /autoink/ es /auto/
//
// BIZTONSAG
// Barmelyik lepes hibaja eseten a build NEM all le: torli a .gen-t, es a
// fix-pages.mjs a repoban levo utolso jo /autoink/ es /auto/ oldalakat masolja
// be. Rosszabb esetben az oldal annyit lat, mint eddig - regresszio nincs.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const OUTDIR = '.gen';
const SRCDIR = '.gen-src';

function bukas(miert) {
  console.log('prebuild: FIGYELEM - ' + miert);
  console.log('prebuild: a repoban levo utolso jo /autoink/ es /auto/ marad ervenyben');
  fs.rmSync(OUTDIR, { recursive: true, force: true });
  fs.rmSync(SRCDIR, { recursive: true, force: true });
  process.exit(0); // szandekosan 0: a build menjen tovabb
}

fs.rmSync(OUTDIR, { recursive: true, force: true });
fs.rmSync(SRCDIR, { recursive: true, force: true });

if (!fs.existsSync('../generate.mjs')) bukas('nincs ../generate.mjs');
if (!fs.existsSync('patch-generate.mjs')) bukas('nincs patch-generate.mjs');

fs.mkdirSync(SRCDIR, { recursive: true });
fs.copyFileSync('../generate.mjs', SRCDIR + '/generate.mjs');

const patch = spawnSync(process.execPath, ['patch-generate.mjs', SRCDIR + '/generate.mjs'], { stdio: 'inherit' });
if (patch.status !== 0) bukas('a patch-generate.mjs nem futott le (status=' + patch.status + ')');

const gen = spawnSync(process.execPath, [SRCDIR + '/generate.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, OUT: OUTDIR, SITE_BASE: process.env.SITE_BASE || 'https://www.caradvance.hu' },
});
if (gen.status !== 0) bukas('a generate.mjs hibaval allt le (status=' + gen.status + ') - Sheet elerhetetlen?');

const ok = fs.existsSync(OUTDIR + '/autoink/index.html')
  && fs.existsSync(OUTDIR + '/auto')
  && fs.readdirSync(OUTDIR + '/auto').filter((d) => d !== 'index.html').length >= 10;
if (!ok) bukas('a generalas hianyos kimenetet adott (kevesebb mint 10 auto-aloldal)');

fs.rmSync(SRCDIR, { recursive: true, force: true });
console.log('prebuild: friss /autoink/ es /auto/ a Google Sheetbol ('
  + fs.readdirSync(OUTDIR + '/auto').filter((d) => d !== 'index.html').length + ' auto-aloldal)');
