// Build lepes: ELESITES - a "Hamarosan indul" kapu es a noindex eltavolitasa.
//
// MIERT KELL
// A generate.mjs-ben `CONSTRUCTION = true`, ezert MINDEN altala keszult oldal
// (fooldal, /autoink/, /auto/<slug>/, /gyakori-kerdesek/, /berelheto/ ...) a
// HTML-be sutve tartalmazza:
//   - <meta name="robots" content="noindex,nofollow">
//   - a #ca-gate "Hamarosan indul" kaput (div + style + script)
// A caradvance-chat.js ezt a latogatonak eltunteti, DE a Google a nyers HTML-t
// latja: noindex + <h1>Hamarosan indul</h1>. Ezert nulla az indexelt oldal.
//
// Ez a lepes a KESZ dist/ mappan dolgozik, a repoban levo forrasfajlokhoz nem
// nyul, es fuggetlen attol, hogy a generate.mjs-ben mi a CONSTRUCTION erteke.
//
// MIT TESZ
// 1. minden dist/**/index.html-bol kiszedi a kaput es a noindex,nofollow-t
// 2. a duplikalt nyelvi utvonalakra (cs,de,fr,pl,sk,uk,zh - magyar tartalom
//    idegen lang koddal) noindex,follow-t tesz, hogy ne duplikaljak a fooldalt
//    (/en/ marad indexelheto: az valodi angol forditas)
// 3. kiirja a sitemap.xml-t es a robots.txt-t
//
// BIZTONSAG
// Ha a dist/ hianyzik vagy barmi hibazik, csak logol es 0-val kilep - a buildet
// soha nem allitja meg.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = (process.env.SITE_BASE || 'https://www.caradvance.hu').replace(/\/+$/, '');
// Magyar tartalom idegen nyelvi kod alatt -> duplikatum, nem indexelheto.
const DUP_LANGS = ['cs', 'de', 'fr', 'pl', 'sk', 'uk', 'zh'];

// Nem nyilvanos / nem indexelheto utvonalak. A kapu eddig ezeket is takarta,
// elesites utan viszont a Google-nek sem a belso iranyitopult, sem az egyedi
// ugyfel-ajanlat nem valo. (A /berelheto/ atiranyit a /autoink/#berelheto-re,
// ezert duplikatum lenne a sitemapban.)
const PRIVATE_PATHS = ['/belso/', '/ajanlat/', '/berelheto/'];

const NOINDEX_DUP = '<meta name="robots" content="noindex,follow">';
const NOINDEX_PRIVATE = '<meta name="robots" content="noindex,nofollow">';

let nGate = 0, nNoindex = 0, nDup = 0;
const urls = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

function urlOf(file) {
  let rel = file.slice(DIST.length).replace(/\\/g, '/').replace(/\/index\.html$/, '/');
  if (!rel.startsWith('/')) rel = '/' + rel;
  return SITE + (rel === '/' ? '/' : rel);
}

function firstSeg(file) {
  const rel = file.slice(DIST.length).replace(/\\/g, '/').replace(/^\/+/, '');
  return rel.split('/')[0];
}

try {
  if (!fs.existsSync(DIST)) {
    console.log('golive: nincs dist/ - kihagyva');
    process.exit(0);
  }

  for (const file of walk(DIST)) {
    let h = fs.readFileSync(file, 'utf8');
    const before = h;

    // 1. a kapu betoltoje (localStorage ca_ok)
    h = h.replace(/<script>\(function\(\)\{try\{if\(localStorage\.getItem\('ca_ok'\)[\s\S]*?<\/script>/g, '');
    // 2. a kapu stilusa (ez tartalmazza a body{overflow:hidden}-t is!)
    h = h.replace(/<style>html:not\(\.ca-ok\)[\s\S]*?<\/style>/g, '');
    // 3. a kapu maga + a caGate() script (egy blokkban)
    h = h.replace(/<div id="ca-gate">[\s\S]*?<script>function caGate\(e\)[\s\S]*?<\/script>/g, '');
    if (h !== before) nGate++;

    // 4. noindex
    const relPath = urlOf(file).slice(SITE.length);
    const priv = PRIVATE_PATHS.includes(relPath);
    const dup = DUP_LANGS.includes(firstSeg(file)) || priv;
    h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, (m) => {
      if (/noindex\s*,\s*nofollow/i.test(m)) nNoindex++;
      return '';
    });
    if (dup) {
      h = h.replace(/<\/head>/i, (priv ? NOINDEX_PRIVATE : NOINDEX_DUP) + '\n</head>');
      nDup++;
    } else {
      urls.push(urlOf(file));
    }

    if (h !== before) fs.writeFileSync(file, h);
  }

  // 5. sitemap + robots
  const now = new Date().toISOString().slice(0, 10);
  urls.sort((a, b) => a.length - b.length || a.localeCompare(b));
  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + urls.map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join('\n')
      + '\n</urlset>\n'
  );
  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
  );

  console.log(`golive: kapu eltavolitva ${nGate} oldalrol, noindex,nofollow leveve ${nNoindex} oldalrol, `
    + `${nDup} noindexelve (nyelvi duplikatum + nem nyilvanos), sitemap ${urls.length} URL`);
} catch (e) {
  console.log('golive: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
