// Build lépés (a pl-site.mjs után, a ver-assets.mjs előtt fut).
// Az eladó autók fotói eddig közvetlenül a mobile.de (img.classistatic.de) és a hasznaltauto.hu
// (img.hasznaltautocdn.com) szerveréről töltődtek be — ha egy hirdetés megszűnik, a kép a mi
// oldalunkról is eltűnne. Ez a lépés minden buildnél letölti ezeket a képeket a saját
// dist/auto-foto/ mappánkba, és a dist összes HTML/JS/JSON fájljában a saját címre írja át őket.
//  - <img src>, galéria-tömbök, inline scriptek: relatív /auto-foto/… cím (minden domainen működik,
//    a middleware a fájlokat domaintől függetlenül szolgálja ki)
//  - og:image / twitter:image és JSON-LD: abszolút cím az adott domainnel (hu / sk / cz / pl)
// Biztonság: ha egy kép nem tölthető le (hiba, időtúllépés, nem kép), az eredeti cím marad;
// a build sosem áll le. Időkorlát: összesen 9 perc.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIST = 'dist';
const SUB = 'auto-foto';
const OUT = path.join(DIST, SUB);
const HOSTS = 'img\\.(?:classistatic\\.de|hasznaltautocdn\\.com)';
const RE_PLAIN = new RegExp('https://' + HOSTS + '/[^"\'\\s)<>&\\\\]+', 'g');
const RE_ESC = new RegExp('https:\\\\/\\\\/' + HOSTS + '\\\\/(?:[^"\'\\s)<>&\\\\]|\\\\/)+', 'g');
const SITE = { sk: 'https://www.caradvance.sk', cs: 'https://www.caradvance.cz', pl: 'https://www.caradvance.pl' };
const DEADLINE = Date.now() + 9 * 60 * 1000;
const CONC = 16;

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (p !== OUT) walk(p, out); }
    else if (/\.(html|js|json|xml)$/i.test(e.name)) out.push(p);
  }
  return out;
}
const norm = (u) => u.replace(/\\\//g, '/');
function siteOf(file) {
  const rel = path.relative(DIST, file).split(path.sep);
  return SITE[rel[0]] || (rel[0] === '_np' && SITE[rel[1]]) || 'https://www.caradvance.hu';
}

async function get(u) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 25000);
  try {
    const r = await fetch(u, { signal: ac.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CaradvanceBuild/1.0)', Accept: 'image/webp,image/jpeg,image/*;q=0.8' } });
    if (!r.ok) return null;
    const ct = String(r.headers.get('content-type') || '');
    if (!/^image\//i.test(ct)) return null;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 1500) return null;
    const ext = /webp/i.test(ct) ? '.webp' : /png/i.test(ct) ? '.png' : /avif/i.test(ct) ? '.avif' : '.jpg';
    return { b, ext };
  } catch (e) { return null; } finally { clearTimeout(t); }
}

try {
  if (!fs.existsSync(DIST)) { console.log('mirror-car-photos: nincs dist/ - kihagyva'); process.exit(0); }
  const files = walk(DIST, []);
  const urls = new Set();
  const hit = [];
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    if (s.indexOf('img.classistatic.de') < 0 && s.indexOf('img.hasznaltautocdn.com') < 0) continue;
    hit.push(f);
    for (const m of s.match(RE_PLAIN) || []) urls.add(m);
    for (const m of s.match(RE_ESC) || []) urls.add(norm(m));
  }
  fs.mkdirSync(OUT, { recursive: true });
  const map = new Map();
  const list = [...urls];
  let fail = 0, late = 0, bytes = 0;
  async function worker() {
    while (list.length) {
      const u = list.shift();
      if (Date.now() > DEADLINE) { late++; continue; }
      const r = await get(u);
      if (!r) { fail++; continue; }
      const name = crypto.createHash('sha1').update(u).digest('hex').slice(0, 20) + r.ext;
      fs.writeFileSync(path.join(OUT, name), r.b);
      bytes += r.b.length;
      map.set(u, '/' + SUB + '/' + name);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  let changed = 0;
  for (const f of hit) {
    const s = fs.readFileSync(f, 'utf8');
    const site = siteOf(f);
    let n = s.replace(RE_PLAIN, (m) => map.get(m) || m)
      .replace(RE_ESC, (m) => { const l = map.get(norm(m)); return l ? l.replace(/\//g, '\\/') : m; });
    if (n === s) continue;
    // megosztási képek és JSON-LD: abszolút cím kell
    n = n.replace(/(<meta\b[^>]*\bcontent=")(\/auto-foto\/[^"]+")/g, '$1' + site + '$2')
      .replace(/(<script[^>]*application\/ld\+json[^>]*>)([\s\S]*?)(<\/script>)/g, (all, a, body, c) =>
        a + body.replace(/"(\\?\/auto-foto\\?\/)/g, (x, p1) => '"' + (p1.indexOf('\\') >= 0 ? site.replace(/\//g, '\\/') : site) + p1) + c);
    fs.writeFileSync(f, n);
    changed++;
  }
  console.log('mirror-car-photos: ' + urls.size + ' külső autófotó, ' + map.size + ' letöltve (' + Math.round(bytes / 1048576) + ' MB), '
    + fail + ' hiba, ' + late + ' időkorlát miatt kihagyva; ' + changed + ' fájl átírva');
} catch (e) {
  console.log('mirror-car-photos: kihagyva — ' + (e && e.message));
}
