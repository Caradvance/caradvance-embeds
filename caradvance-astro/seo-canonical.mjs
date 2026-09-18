#!/usr/bin/env node
/**
 * seo-canonical.mjs  —  v1  (2026-09-17)
 *
 * MIÉRT: az oldal minden lapján a canonical ma  https://caradvance.hu/valami
 * alakú — www NÉLKÜL és záró perjel NÉLKÜL —, miközben a sitemap 133 címe mind
 * https://www.caradvance.hu/valami/ alakú, és a Search Console is a www-s
 * tulajdont méri. Minden oldalon azt mondjuk a Google-nek, hogy "az igazi cím
 * egy másik". Ez a jelek hígulását okozza.
 *
 * MIT CSINÁL: minden dist/**\/index.html fájlban a canonicalt (és az og:url-t,
 * valamint a hreflang címeket) a fájl saját útvonalából számolt, kanonikus
 * https://www.caradvance.hu/utvonal/ alakra írja át.
 *
 * A build-láncban a golive.mjs UTÁN, a seo-copy.mjs ELŐTT fusson.
 * Hibára exit 0 — a buildet sosem állítja meg. Többszöri futásra idempotens.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST  = 'dist';
const BAZIS = 'https://www.caradvance.hu';

/** dist/auto-rendeles/index.html  →  /auto-rendeles/      (a gyökér → /) */
function utvonalbol(fajl) {
  const rel = path.relative(DIST, path.dirname(fajl)).split(path.sep).filter(Boolean);
  return rel.length ? '/' + rel.join('/') + '/' : '/';
}

async function osszesHtml(dir, gyujto = []) {
  for (const bejegyzes of await readdir(dir, { withFileTypes: true })) {
    const teljes = path.join(dir, bejegyzes.name);
    if (bejegyzes.isDirectory()) await osszesHtml(teljes, gyujto);
    else if (bejegyzes.name.endsWith('.html')) gyujto.push(teljes);
  }
  return gyujto;
}

/** bármilyen caradvance.hu címet a kanonikus www + záró perjel alakra hoz */
function kanonikus(nyers) {
  try {
    const u = new URL(nyers, BAZIS);
    if (!/(^|\.)caradvance\.hu$/i.test(u.hostname)) return null;   // idegen domain: nem nyúlunk hozzá
    let p = u.pathname;
    const fajlnev = /\/[^/]+\.[a-z0-9]{2,5}$/i.test(p);            // .xml, .png, .pdf … marad
    if (!fajlnev && !p.endsWith('/')) p += '/';
    return BAZIS + p + u.search + u.hash;
  } catch { return null; }
}

async function fut() {
  if (!existsSync(DIST)) { console.log('[canonical] KIHAGYVA — nincs dist/ mappa'); return; }

  const fajlok = await osszesHtml(DIST);
  let erintett = 0, canonDb = 0, ogDb = 0, hrefDb = 0, hianyzoDb = 0;

  for (const fajl of fajlok) {
    const eredeti = await readFile(fajl, 'utf8');
    let h = eredeti;
    const helyes = BAZIS + utvonalbol(fajl);

    // 1. canonical
    if (/<link rel="canonical"[^>]*>/i.test(h)) {
      h = h.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${helyes}">`);
      canonDb++;
    } else if (h.includes('</head>')) {
      h = h.replace('</head>', `<link rel="canonical" href="${helyes}">\n</head>`);
      hianyzoDb++;
    }

    // 2. og:url — ugyanarra a címre kell mutatnia
    if (/<meta property="og:url"[^>]*>/i.test(h)) {
      h = h.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${helyes}">`);
      ogDb++;
    }

    // 3. hreflang címek: www + záró perjel, a nyelvi útvonal megtartásával
    h = h.replace(/(<link rel="alternate"[^>]*href=")([^"]+)("[^>]*>)/gi, (egesz, elo, cim, uto) => {
      const j = kanonikus(cim);
      if (!j || j === cim) return egesz;
      hrefDb++;
      return elo + j + uto;
    });

    if (h !== eredeti) { await writeFile(fajl, h, 'utf8'); erintett++; }
  }

  console.log(`[canonical] ${fajlok.length} HTML fájl átnézve, ${erintett} módosítva`);
  console.log(`[canonical]   canonical átírva : ${canonDb}`);
  console.log(`[canonical]   canonical pótolva: ${hianyzoDb}`);
  console.log(`[canonical]   og:url átírva    : ${ogDb}`);
  console.log(`[canonical]   hreflang átírva  : ${hrefDb}`);

  // ---- ellenőrzés: maradt-e www nélküli canonical? -------------------------
  let maradek = 0;
  for (const fajl of fajlok) {
    const h = await readFile(fajl, 'utf8');
    const m = h.match(/<link rel="canonical" href="([^"]+)"/i);
    if (m && !m[1].startsWith(BAZIS + '/')) { maradek++; if (maradek <= 5) console.log('[canonical]   MARADT:', fajl, '→', m[1]); }
  }
  console.log(maradek ? `[canonical] FIGYELEM: ${maradek} fájlban maradt rossz canonical` : '[canonical] ELLENŐRZÉS OK — minden canonical www-s és záró perjeles');
}

fut().catch(e => { console.error('[canonical] HIBA (a build folytatódik):', e.message); });
