// Build lépés (a pl-site.mjs után fut): caradvance.cz — hivatalos cseh telefonszám.
// A cseh oldalak a szlovák képviselő adataiból készülnek (+421 915 410 555); a cseh piacon a
// hivatalos szám: +420 604 313 136. Csak a dist/cs (+ _np/cs), a 404-cs, a cseh keresőindex és a
// cseh runtime-fordító fájljait módosítja. A WhatsApp-linkek (wa.me/…) változatlanok maradnak.
// Hiba esetén csak logol, a buildet nem állítja meg.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const CZ = { plain: '+420604313136', spaced: '+420 604 313 136' };
const ROOTS = [path.join(DIST, 'cs'), path.join(DIST, '_np', 'cs')];
const FILES = [path.join(DIST, '404-cs.html'), path.join(DIST, 'kereses-index-cs.json')];

function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js|json|xml|txt)$/i.test(e.name)) out.push(p);
  }
  return out;
}

try {
  const files = [];
  for (const r of ROOTS) walk(r, files);
  for (const f of FILES) if (fs.existsSync(f)) files.push(f);
  const rt = path.join(DIST, 'i18n');
  if (fs.existsSync(rt)) for (const n of fs.readdirSync(rt)) if (/^rt-cs(-[a-z]{2})?\.js$/.test(n)) files.push(path.join(rt, n));
  let changed = 0, hits = 0;
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    if (s.indexOf('421') < 0) continue;
    let n = s
      .replace(/tel:\+?421915410555/g, () => { hits++; return 'tel:' + CZ.plain; })
      .replace(/(["'])\+421915410555\1/g, (m, q) => { hits++; return q + CZ.plain + q; })
      .replace(/\+421(?:[\s ]|&nbsp;)?915(?:[\s ]|&nbsp;)?410(?:[\s ]|&nbsp;)?555/g, () => { hits++; return CZ.spaced; });
    if (n !== s) { fs.writeFileSync(f, n); changed++; }
  }
  console.log('cz-phone: ' + hits + ' telefonszám → ' + CZ.spaced + ' (' + changed + ' fájl)');
} catch (e) {
  console.log('cz-phone: kihagyva — ' + (e && e.message));
}
