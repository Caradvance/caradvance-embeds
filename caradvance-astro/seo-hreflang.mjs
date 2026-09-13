// Build lepes: hreflang klaszter a magyar fooldalra (dist/index.html).
//
// MIERT
// A fooldalt (/) a generate.mjs allitja elo (fix-home.mjs frissiti), NEM az Astro
// Base layout -> ezert a fooldalrol HIANYZIK a Hreflang komponens kimenete. Kovetkezmeny:
// az /en/ (es a tobbi nyelv) a gyokerre mutat hreflang-gal, de a gyoker NEM mutat vissza
// -> a klaszter nem kolcsonos -> a magyar "caradvance" keresesre a Google az angol
// oldalt hozza be. Ez a lepes a fooldalra beteszi UGYANAZT a klasztert, amit minden
// mas oldal (Base -> Hreflang.astro) is kiad, igy a hu<->en reciprok lesz.
//
// A hrefek a meglevo klasztert tukrozik pontosan: nem-www caradvance.hu, ugyanaz a
// nyelvlista es ugyanaz az x-default (hu), mint a tobbi oldalon.
// Idempotens; barmi hiba eseten csak logol es exit 0 - a buildet nem allitja meg.
import fs from 'node:fs';

const DIST = 'dist';
const SITE = 'https://caradvance.hu';
const LOCS = [
  ['hu', '/'], ['en', '/en'], ['de', '/de'], ['fr', '/fr'],
  ['sk', '/sk'], ['cs', '/cs'], ['pl', '/pl'], ['uk', '/uk'], ['zh', '/zh'],
];

const block =
  LOCS.map(([l, p]) => '<link rel="alternate" hreflang="' + l + '" href="' + SITE + p + '">').join('\n')
  + '\n<link rel="alternate" hreflang="x-default" href="' + SITE + '/">';

const file = DIST + '/index.html';

try {
  if (!fs.existsSync(file)) { console.log('seo-hreflang: nincs ' + file + ' - kihagyva'); process.exit(0); }
  let h = fs.readFileSync(file, 'utf8');

  if (/rel="alternate"\s+hreflang=/.test(h)) {
    console.log('seo-hreflang: a fooldalon mar van hreflang - kihagyva (idempotens)');
    process.exit(0);
  }
  if (!h.includes('</head>')) {
    console.log('seo-hreflang: FIGYELEM - nincs </head> a fooldalon (kihagyva)');
    process.exit(0);
  }

  h = h.replace('</head>', block + '\n</head>');
  fs.writeFileSync(file, h);
  console.log('seo-hreflang: fooldal hreflang klaszter beszurva (' + (LOCS.length + 1) + ' link)');
} catch (e) {
  console.log('seo-hreflang: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
