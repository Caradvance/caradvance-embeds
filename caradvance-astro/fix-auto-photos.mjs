// Build lépés (a build lánc végén fut). Két, egymástól független, biztonságos javítás
// a KÉSZ dist/-en. Bármelyik hiba esetén csak logol; a build sosem áll le.
//
// A) Kezdőlap (dist/index.html): az eladó/bizományos kártyák ára BRUTTÓ helyett NETTÓ.
//    Csak a <span class="price">…Ft</span> + <span class="peur">…€</span> párokat írja át
//    (nettó = bruttó / 1,19), semmi mást nem érint. (A bérlés €/hó ára nem illik a mintára,
//    így érintetlen marad.)
// B) /auto/<slug>/ galériákból az idegen/hibás fotók levágása (CAG + thumbs + számláló).
import fs from 'node:fs';

// ---- A) kezdőlap: nettó árak -------------------------------------------------
try {
  const hp = 'dist/index.html';
  if (fs.existsSync(hp)) {
    let h = fs.readFileSync(hp, 'utf8');
    const RATE = 364; // build-idejű árfolyam (mint a részletes oldalakon build-kor)
    const fmt = (n) => n.toLocaleString('hu-HU');
    let cnt = 0;
    h = h.replace(/<span class="price">([^<]*?)Ft<\/span>\s*<span class="peur">([^<]*?)€<\/span>/g, (m, ftTxt, eurTxt) => {
      const grossEur = Number(String(eurTxt).replace(/[^\d]/g, ''));
      if (!grossEur) return m;
      const netEur = Math.round(grossEur / 1.19);
      const netFt = Math.ceil(netEur * RATE / 10000) * 10000;
      cnt++;
      return `<span class="price">${fmt(netFt)} Ft</span><span class="peur">${fmt(netEur)} €</span>`;
    });
    if (cnt > 0) { fs.writeFileSync(hp, h); console.log('fix-auto: kezdolap ' + cnt + ' ar nettora javitva'); }
    else { console.log('fix-auto: kezdolap - nincs atirando ar (mar netto vagy nincs kartya)'); }
  } else {
    console.log('fix-auto: nincs dist/index.html - kezdolap kihagyva');
  }
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
