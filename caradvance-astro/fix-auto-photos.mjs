// Build lépés (a build lánc végén fut). Két, egymástól független, biztonságos javítás
// a KÉSZ dist/-en. Bármelyik hiba esetén csak logol; a build sosem áll le.
//
// A) Kezdőlap: a kiemelt ELADÓ kártyák ára BRUTTÓ helyett NETTÓ.
//    A kártyákat kliensoldali script (saleCard) rajzolja a bruttó c.eur adatból, ezért
//    nem a statikus HTML-t, hanem magát az INLINE SCRIPTET írjuk át: a megjelenített €
//    és az abból számolt Ft is nettó lesz (c.eur / 1,19). A bérlés (rentCard) és a
//    bizományos donáció-számítás érintetlen marad.
// B) /auto/<slug>/ galériákból az idegen/hibás fotók levágása (CAG + thumbs + számláló).
import fs from 'node:fs';

// ---- A) kezdőlap: eladó kártyák nettó ára (inline saleCard script patch) ------
// A saleCard két helyen használ bruttót:
//   1) var huf=Math.ceil(c.eur*RATE/10000)*10000;              -> Ft a bruttóból
//   2) <span class="peur">'+Math.round(c.eur).toLocaleString(..)+' €'  -> kiírt €
// Mindkettőt nettóra váltjuk (osztás 1,19-cel). Literál csere, így idempotens:
// átírás után a régi minta már nem szerepel, újrafuttatva nem duplázódik.
const HP_PATCHES = [
  ['var huf=Math.ceil(c.eur*RATE/10000)*10000;',
   'var huf=Math.ceil(Math.round(c.eur/1.19)*RATE/10000)*10000;'],
  ['<span class="peur">\'+Math.round(c.eur).toLocaleString(\'hu-HU\')+\' €</span>',
   '<span class="peur">\'+Math.round(c.eur/1.19).toLocaleString(\'hu-HU\')+\' €</span>'],
];
try {
  const homes = ['dist/index.html', 'dist/en/index.html'];
  let touched = 0;
  for (const hp of homes) {
    if (!fs.existsSync(hp)) continue;
    let h = fs.readFileSync(hp, 'utf8');
    const before = h;
    let hits = 0;
    for (const [find, repl] of HP_PATCHES) {
      if (h.includes(find)) { h = h.split(find).join(repl); hits++; }
    }
    if (h !== before) { fs.writeFileSync(hp, h); touched++; console.log('fix-auto: ' + hp + ' elado kartyak nettora (' + hits + '/' + HP_PATCHES.length + ' minta)'); }
    else { console.log('fix-auto: ' + hp + ' - nincs atirando (mar netto vagy nincs saleCard)'); }
  }
  if (!touched) console.log('fix-auto: kezdolap - nem valtozott');
} catch (e) {
  console.log('fix-auto: FIGYELEM (kezdolap ar) - ' + (e && e.message));
}

// ---- B) idegen fotók levágása ------------------------------------------------
const CAP = {
  'mercedes-benz-s-450-e': 33, // 1–33 valódi Mercedes; 34. logó; 35–44 idegen (BMW/Audi)
};

try {
  let changed = 0;
  for (const [slug, keep] of Object.entries(CAP)) {
    const file = `dist/auto/${slug}/index.html`;
    if (!fs.existsSync(file)) { console.log('fix-auto: nincs ' + file + ' - kihagyva'); continue; }
    let h = fs.readFileSync(file, 'utf8');
    const before = h;

    h = h.replace(/(var\s+CAG\s*=\s*\[)([\s\S]*?)(\]\s*;)/, (m, a, body, c) => {
      const urls = body.match(/"[^"]*"|'[^']*'/g) || [];
      if (urls.length <= keep) return m;
      return a + urls.slice(0, keep).join(',') + c;
    });
    h = h.replace(/(<div[^>]*id="thumbs"[^>]*>)([\s\S]*?)(<\/div>)/, (m, a, body, c) => {
      const imgs = body.match(/<img[^>]*>/g) || [];
      if (imgs.length <= keep) return m;
      return a + imgs.slice(0, keep).join('') + c;
    });
    h = h.replace(/(<span id="cidx">[^<]*<\/span>\s*\/\s*)(\d+)/, (m, a, n) => (Number(n) > keep ? a + keep : m));

    if (h !== before) { fs.writeFileSync(file, h); changed++; console.log('fix-auto: ' + slug + ' -> max ' + keep + ' foto'); }
    else { console.log('fix-auto: ' + slug + ' - nincs teendo'); }
  }
  console.log('fix-auto: kesz (' + changed + ' auto-oldal modositva)');
} catch (e) {
  console.log('fix-auto: FIGYELEM (fotok) - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
