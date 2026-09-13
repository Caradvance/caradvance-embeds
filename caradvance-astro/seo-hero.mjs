// Build lepes: a hero-k egységesítése minden oldalon (mobil + desktop).
//
// MIERT
// A kezdőlap hero-ja a referencia, de túl sok a felső üres tér (a .hero .inner
// margin-top:64px miatt). Ezt csökkentjük, és ugyanezt az értéket visszük a többi
// hero-ra is, hogy a méret/pozíció egységes legyen. A kész dist/-en dolgozik,
// pontos szöveg-horgonyokra, idempotens, hiba esetén exit 0.
import fs from 'node:fs';

const TOP = '24px';   // egységes felső térköz a hero tartalom felett

// [fájl, keresett, csere] hármasok — mind idempotens
const EDITS = [
  // Kezdőlap (public/index.html -> dist/index.html)
  ['dist/index.html',
    '.inner{position:relative;z-index:2;max-width:1120px;margin:64px auto 0}',
    '.inner{position:relative;z-index:2;max-width:1120px;margin:' + TOP + ' auto 0}'],
];

let done = 0, skip = 0;
for (const [file, from, to] of EDITS) {
  try {
    if (!fs.existsSync(file)) { console.log('seo-hero: nincs ' + file + ' - kihagyva'); skip++; continue; }
    let h = fs.readFileSync(file, 'utf8');
    if (h.includes(to)) { skip++; continue; }         // már frissítve
    if (h.includes(from)) { h = h.replace(from, to); fs.writeFileSync(file, h); done++; }
    else { console.log('seo-hero: horgony nem található (' + file + ')'); skip++; }
  } catch (e) {
    console.log('seo-hero: FIGYELEM - ' + (e && e.message));
  }
}
console.log('seo-hero: kész (' + done + ' módosítva, ' + skip + ' kihagyva)');
process.exit(0);
