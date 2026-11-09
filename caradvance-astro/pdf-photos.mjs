// Build lépés (a skcz-fix1110.mjs után): JPEG fotók az ajánlat-PDF-ekhez és az ajánlat-e-mailekhez — Marc, 2026-11-09.
// A bérelhető autók képei WebP-k; a PDF (DCTDecode) csak JPEG-et tud beágyazni, és az Outlook asztali változata sem
// jeleníti meg a WebP-t. Ez a lépés minden bérelhető autóhoz (dist/abo-fleet.json) elkészíti a fő- és galériaképek
// JPEG-másolatát (dist/pdf-img/<autó>-<n>.jpg, max. 1400 px, fehér háttér), és a listát az abo-fleet.json „pdf” mezőjébe írja.
// A CRM ebből rakja a képeket a bérleti ajánlat PDF-be és az e-mailbe.
// A sharp az Astro része; ha mégsem érhető el, a lépés kihagyja a konverziót (logol), a build nem áll le. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const OUT = path.join(DIST, 'pdf-img');
const MAX = 5; // autónként ennyi kép: fő, design, belső, galéria…

let sharp = null;
try { sharp = (await import('sharp')).default; } catch (e) { console.log('[pdf-photos] a sharp nem érhető el — kihagyva:', e && e.message); }

function rank(p) {
  const k = (p.match(/-([a-z0-9]+)\.(?:webp|jpe?g|png)$/) || [])[1] || '';
  if (k === 'main') return 0; if (k === 'design') return 1; if (k === 'interior') return 2;
  const g = k.match(/^g(\d+)$/); return g ? 10 + Number(g[1]) : 50;
}
const local = (u) => { try { const p = new URL(u, 'https://www.caradvance.hu').pathname; return path.join(DIST, decodeURIComponent(p)); } catch (e) { return ''; } };

async function toJpeg(src, dst) {
  if (fs.existsSync(dst)) return true;
  if (!src || !fs.existsSync(src)) return false;
  try {
    await sharp(src).rotate().resize({ width: 1400, height: 1050, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 82, progressive: false, chromaSubsampling: '4:2:0' }).toFile(dst);
    return true;
  } catch (e) { console.log('[pdf-photos] hiba:', src, e && e.message); return false; }
}

if (sharp) {
  try {
    const fleetFiles = [path.join(DIST, 'abo-fleet.json')].filter((f) => fs.existsSync(f));
    if (!fleetFiles.length) console.log('[pdf-photos] nincs dist/abo-fleet.json — kihagyva');
    fs.mkdirSync(OUT, { recursive: true });
    let nCar = 0, nImg = 0;
    const done = new Map(); // autókulcs → JPEG-lista
    for (const ff of fleetFiles) {
      const j = JSON.parse(fs.readFileSync(ff, 'utf8'));
      for (const c of j.cars || []) {
        const id = String(c.key || '').replace(/^abo-/, '').replace(/[^a-z0-9-]/gi, '').toLowerCase();
        if (!id) continue;
        if (!done.has(id)) {
          // a bérlési oldal sajtófotói (/berles-press/<modell>-main|design|interior|gN.webp), a kártyakép tartaléknak
          const srcs = [];
          const page = c.url ? path.join(local(c.url), 'index.html') : '';
          if (page && fs.existsSync(page)) {
            const h = fs.readFileSync(page, 'utf8');
            const main = (h.match(/\/berles-press\/([a-z0-9-]+)-main\.(?:webp|jpe?g|png)/) || [])[1];
            const all = [...new Set([...h.matchAll(/\/berles-press\/[a-z0-9-]+\.(?:webp|jpe?g|png)/g)].map((m) => m[0]))]
              .filter((p) => !main || p.startsWith('/berles-press/' + main + '-'));
            all.sort((a, b) => rank(a) - rank(b));
            srcs.push(...all);
          }
          if (c.image) srcs.push(c.image);
          const list = [];
          for (const s of [...new Set(srcs)]) {
            if (list.length >= MAX) break;
            const n = list.length; const name = `${id}-${n}.jpg`;
            if (await toJpeg(local(s), path.join(OUT, name))) { list.push('/pdf-img/' + name); nImg++; }
          }
          done.set(id, list); if (list.length) nCar++;
        }
        const list = done.get(id);
        if (list && list.length) c.pdf = list; else delete c.pdf;
      }
      fs.writeFileSync(ff, JSON.stringify(j));
    }
    console.log('[pdf-photos] ' + nCar + ' autó · ' + nImg + ' JPEG (dist/pdf-img)');
  } catch (e) { console.log('[pdf-photos] hiba:', e && e.stack || e); }
}
