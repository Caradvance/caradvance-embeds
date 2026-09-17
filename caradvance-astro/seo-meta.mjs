// Build lepes: meta leiras + cim a ket leiras-nelkuli oldalra.
//
// MIERT
// A 121 indexelt oldalbol ket lapon NINCS meta leiras: /egyedi-auto-rendeles/ es
// /uj-auto-berlese/ (content=""). Az /egyedi-auto-rendeles/ magatol az elso Google
// oldalra jott a "bmw konfigurator" (800 kereses/ho, KD 9) kifejezesre, de leiras
// nelkul a Google generalja a toredeket -> 51 megjelenes / 0 kattintas.
//
// MIT TESZ (a kesz dist/-en dolgozik)
//   1. <title> atirasa (a "bmw konfigurator" kulcsszo elore)
//   2. az ures <meta name="description"> feltoltese
//   3. og:title + og:description beszurasa (eddig egyik oldalon sem volt)
// Idempotens; barmi hiba eseten csak logol es exit 0 - a buildet nem allitja meg.
// A horgonyok szerkezetiek (title / meta tagek), nem Astro build-hash osztalynevek.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

const PAGES = {
  'egyedi-auto-rendeles': {
    title:   'BMW konfigurátor – egyedi autó rendelés | CarAdvance',
    desc:    'BMW konfigurátor: állítsd össze az új autód, mi behozzuk Németországból — gyári felszereltség, kedvező ár, kulcsrakész átadás. BMW, MINI, Mercedes, Audi.',
    ogTitle: 'BMW konfigurátor – egyedi autó rendelés Németországból',
  },
  'uj-auto-berlese': {
    title:   'Új autó bérlése – tartós bérlet prémium autókra | CarAdvance',
    desc:    'Vadonatúj prémium autó tartós bérletre, fix havidíjjal — BMW, MINI, Mercedes, Audi. Szerviz, adó és gumi az árban, alacsony kaució, akár félévente új modell.',
    ogTitle: 'Új autó bérlése – tartós bérlet prémium autókra',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

try {
  if (!fs.existsSync(DIST)) { console.log('seo-meta: nincs dist/ - kihagyva'); process.exit(0); }

  let changed = 0, warn = 0;
  for (const [slug, cfg] of Object.entries(PAGES)) {
    const file = path.join(DIST, slug, 'index.html');
    if (!fs.existsSync(file)) { console.log('seo-meta: FIGYELEM - nincs ' + file); warn++; continue; }
    let h = fs.readFileSync(file, 'utf8');
    const before = h;
    const log = [];

    // 1. title (a kulcsszo elore)
    const newTitle = '<title>' + esc(cfg.title) + '</title>';
    if (/<title>[\s\S]*?<\/title>/.test(h)) {
      h = h.replace(/<title>[\s\S]*?<\/title>/, newTitle);
      log.push('title');
    } else { log.push('FIGYELEM: nincs <title>'); warn++; }

    // 2. meta description (az ures/meglevo content csereje; ha hianyzik, a title utan beszurjuk)
    const descTag = '<meta name="description" content="' + esc(cfg.desc) + '">';
    if (/<meta name="description"[^>]*>/.test(h)) {
      h = h.replace(/<meta name="description"[^>]*>/, descTag);
      log.push('desc');
    } else {
      h = h.replace(newTitle, newTitle + '\n' + descTag);
      log.push('desc(beszurva)');
    }

    // 3. og:title + og:description - csak ha meg nincs (idempotens)
    if (!/<meta property="og:title"/.test(h)) {
      const og = '<meta property="og:title" content="' + esc(cfg.ogTitle) + '">\n'
               + '<meta property="og:description" content="' + esc(cfg.desc) + '">';
      h = h.replace(descTag, descTag + '\n' + og);
      log.push('og');
    } else { log.push('og(mar van)'); }

    if (h !== before) { fs.writeFileSync(file, h); changed++; }
    console.log('seo-meta: /' + slug + '/ - ' + log.join(', '));
  }

  // 4. Modell-aloldalak: og:image / twitter kartya (megoszthato borito).
  //    A Base.astro nem ad og:image-et, ezert itt szurjuk be a kesz dist/-be.
  const MODELS = {
    'egyedi-auto-rendeles/1erb-benzin': 'https://www.caradvance.hu/bmw/bmw-1es-og.jpg',
    'egyedi-auto-rendeles/2eratb-benzin': 'https://www.caradvance.hu/bmw/bmw-2es-active-tourer-og.jpg',
    'egyedi-auto-rendeles/2ergc-benzin': 'https://www.caradvance.hu/bmw/bmw-2es-gran-coupe-og.jpg',
    'egyedi-auto-rendeles/2ercb-benzin': 'https://www.caradvance.hu/bmw/bmw-2es-coupe-og.jpg',
    'egyedi-auto-rendeles/ix3-elektromos': 'https://www.caradvance.hu/bmw/bmw-ix3-og.jpg',
    'egyedi-auto-rendeles/x5-dizel': 'https://www.caradvance.hu/bmw/bmw-x5-og.jpg',
  };
  for (const [rel, img] of Object.entries(MODELS)) {
    const file = path.join(DIST, rel, 'index.html');
    if (!fs.existsSync(file)) { console.log('seo-meta(og): FIGYELEM - nincs ' + file); warn++; continue; }
    let h = fs.readFileSync(file, 'utf8'); const before = h;
    const t = (h.match(/<title>([\s\S]*?)<\/title>/) || [,''])[1];
    const d = (h.match(/<meta name="description" content="([^"]*)"/) || [,''])[1];
    const url = 'https://www.caradvance.hu/' + rel;
    if (!/property="og:image"/.test(h)) {
      const tags = [
        '<meta property="og:type" content="website">',
        '<meta property="og:url" content="' + url + '">',
        '<meta property="og:title" content="' + t + '">',
        '<meta property="og:description" content="' + d + '">',
        '<meta property="og:image" content="' + img + '">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="' + t + '">',
        '<meta name="twitter:description" content="' + d + '">',
        '<meta name="twitter:image" content="' + img + '">',
      ].join('\n');
      h = h.replace('</head>', tags + '\n</head>');
    }
    if (h !== before) { fs.writeFileSync(file, h); changed++; console.log('seo-meta(og): ' + rel + ' - og:image beszurva'); }
    else { console.log('seo-meta(og): ' + rel + ' - mar van'); }
  }

  console.log('seo-meta: kesz (' + changed + ' fajl modositva, ' + warn + ' figyelmeztetes)');
} catch (e) {
  console.log('seo-meta: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
