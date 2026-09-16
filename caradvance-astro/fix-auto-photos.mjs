// Build lépés: idegen/hibás fotók levágása egyes /auto/<slug>/ galériákból.
//
// MIÉRT
// Néhány mobile.de hirdetés fotósora a valódi képek UTÁN tartalmaz egy CarAdvance
// logó-diát, majd más bemutatótermi autók (pl. BMW X, Audi) képeit. A galéria két
// helyről épül: a nagy kép a `var CAG=[...]` tömbből lépdel, a bélyegkép-sor pedig a
// <div id="thumbs"> statikus <img> tagjaiből. Mindkettőt a valódi fotók számára vágjuk,
// így a nagy kép, a bélyegképek és a számláló (1 / N) is egységesen N-re vált.
//
// Idempotens; hiba esetén csak logol és exit 0 (a build megy tovább).
import fs from 'node:fs';

// slug -> megtartandó (valódi) fotók száma
const CAP = {
  'mercedes-benz-s-450-e': 33, // 1–33 valódi Mercedes; 34. logó; 35–44 idegen (BMW/Audi)
};

try {
  let changed = 0;
  for (const [slug, keep] of Object.entries(CAP)) {
    const file = `dist/auto/${slug}/index.html`;
    if (!fs.existsSync(file)) { console.log('fix-auto-photos: nincs ' + file + ' - kihagyva'); continue; }
    let h = fs.readFileSync(file, 'utf8');
    const before = h;

    // 1) nagy kép tömb (CAG) csonkítása
    h = h.replace(/(var\s+CAG\s*=\s*\[)([\s\S]*?)(\]\s*;)/, (m, a, body, c) => {
      const urls = body.match(/"[^"]*"|'[^']*'/g) || [];
      if (urls.length <= keep) return m;
      return a + urls.slice(0, keep).join(',') + c;
    });

    // 2) bélyegkép-sor (<div id="thumbs">) <img> tagjainak csonkítása
    h = h.replace(/(<div[^>]*id="thumbs"[^>]*>)([\s\S]*?)(<\/div>)/, (m, a, body, c) => {
      const imgs = body.match(/<img[^>]*>/g) || [];
      if (imgs.length <= keep) return m;
      return a + imgs.slice(0, keep).join('') + c;
    });

    if (h !== before) { fs.writeFileSync(file, h); changed++; console.log('fix-auto-photos: ' + slug + ' -> max ' + keep + ' foto (CAG + thumbs)'); }
    else { console.log('fix-auto-photos: ' + slug + ' - nincs teendo'); }
  }
  console.log('fix-auto-photos: kesz (' + changed + ' oldal modositva)');
} catch (e) {
  console.log('fix-auto-photos: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
