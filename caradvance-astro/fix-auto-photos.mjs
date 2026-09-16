// Build lépés (a build lánc végén fut):
//   1) A friss, NETTÓ árazású kezdőlap kihelyezése (.gen/index.html -> dist/index.html).
//      A prebuild.mjs a generate.mjs-sel legenerálja a friss kezdőlapot a .gen mappába
//      (nettó árak, data-eur/data-net, élő árfolyam), de a deploy eddig csak a friss
//      /autoink/ és /auto/ oldalakat vitte ki — a kezdőlap egy régi, BRUTTÓ árú
//      commitolt verzió maradt. Itt a friss kezdőlapot tesszük a helyére.
//   2) Idegen/hibás fotók levágása egyes /auto/<slug>/ galériákból (CAG + thumbs).
//
// Idempotens; bármely hiba esetén csak logol és exit 0 (a build nem áll le).
import fs from 'node:fs';

try {
  // 1) friss (nettó) kezdőlap kihelyezése
  if (fs.existsSync('.gen/index.html') && fs.existsSync('dist')) {
    fs.copyFileSync('.gen/index.html', 'dist/index.html');
    console.log('fix-auto: friss (netto) kezdolap kihelyezve (.gen/index.html -> dist/index.html)');
  } else {
    console.log('fix-auto: nincs .gen/index.html vagy dist/ - kezdolap kihagyva');
  }
} catch (e) {
  console.log('fix-auto: FIGYELEM (kezdolap) - ' + (e && e.message));
}

// 2) idegen fotók levágása — slug -> megtartandó (valódi) fotók száma
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

    // nagy kép tömb (CAG) csonkítása
    h = h.replace(/(var\s+CAG\s*=\s*\[)([\s\S]*?)(\]\s*;)/, (m, a, body, c) => {
      const urls = body.match(/"[^"]*"|'[^']*'/g) || [];
      if (urls.length <= keep) return m;
      return a + urls.slice(0, keep).join(',') + c;
    });

    // bélyegkép-sor (<div id="thumbs">) <img> tagjainak csonkítása
    h = h.replace(/(<div[^>]*id="thumbs"[^>]*>)([\s\S]*?)(<\/div>)/, (m, a, body, c) => {
      const imgs = body.match(/<img[^>]*>/g) || [];
      if (imgs.length <= keep) return m;
      return a + imgs.slice(0, keep).join('') + c;
    });

    if (h !== before) { fs.writeFileSync(file, h); changed++; console.log('fix-auto: ' + slug + ' -> max ' + keep + ' foto (CAG + thumbs)'); }
    else { console.log('fix-auto: ' + slug + ' - nincs teendo'); }
  }
  console.log('fix-auto: kesz (' + changed + ' auto-oldal modositva)');
} catch (e) {
  console.log('fix-auto: FIGYELEM (fotok) - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
