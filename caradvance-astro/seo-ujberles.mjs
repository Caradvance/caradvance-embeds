#!/usr/bin/env node
/**
 * Az "Új autó bérlése" (/uj-auto-berlese/) rész megszűnt (2026-10).
 * Build legvégén fut: minden dist-fájlból
 *   - kiveszi a menüpontot (asztali lenyíló + márka-flyout, mobil menü, lábléc),
 *   - a maradék hivatkozásokat átírja: modell → /berelheto-auto/<cél>-berles/, főoldal → /autoink/#berelheto
 *     (idegen nyelven a /<nyelv>/… megfelelőre; hreflang/canonical linkben hash nélkül),
 *   - törli a /uj-auto-berlese/ kimeneteket (HU, nyelvi tükrök, _np) és a sitemap-sorokat,
 *   - a keresőindexből kiveszi a régi oldalakat,
 *   - a _routes.json-ba felveszi a régi címeket, hogy a functions/_middleware.js 301-gyel irányítson.
 * A cél-térkép: src/data/ujRedirects.json (a 14 saját oldalas modell a /berelheto-auto/ alatt készül).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'dist';
const UJ = JSON.parse(fs.readFileSync('src/data/ujRedirects.json', 'utf8'));
const MAP = UJ.map;
const LANGS = ['en', 'de', 'fr', 'uk', 'zh', 'sk', 'cs'];
const LANDING = { en: '/en/car-rental-budapest/', de: '/de/auto-mieten-budapest/', fr: '/fr/location-voiture-budapest/', uk: '/uk/orenda-avto-budapesht/', zh: '/zh/budapest-car-rental/' };

function target(lang, slug, inLinkTag) {
  const pre = lang ? '/' + lang : '';
  if (slug) {
    const t = MAP[slug];
    if (t) return pre + '/berelheto-auto/' + t + '-berles/';
  }
  if (lang) return LANDING[lang] || pre + '/autoink/';
  return inLinkTag ? '/autoink/' : '/autoink/#berelheto';
}

const URL_RE = /(https?:\/\/(?:www\.)?caradvance\.(?:hu|sk|cz))?(?:\/(en|de|fr|uk|zh|sk|cs))?\/uj-auto-berlese(?:\/([a-z0-9-]+))?\/?(\?brand=[a-z]+)?(?=["'\s<)#,\\]|$)/g;

function rewriteUrls(s, inLinkTag) {
  return s.replace(URL_RE, (m, host, lang, slug, q) => (host || '') + target(lang, slug, inLinkTag) + (q && lang && !slug && LANDING[lang] ? q : ''));
}

const stats = { files: 0, nav: 0, links: 0, removedDirs: 0, sitemap: 0, search: 0 };

function processHtml(h) {
  const before = h;
  // asztali menü: "Új autó bérlése" + márka-flyout
  h = h.replace(/<div class="ddi-sub"><a class="ddi ddi-parent" href="[^"]*uj-auto-berlese[^"]*">[\s\S]*?<\/a><div class="flyout">(?:\s*<a\b[^>]*>[\s\S]*?<\/a>)*\s*<\/div><\/div>/g, () => { stats.nav++; return ''; });
  // mobil menü: a menüpont + márka-alpontok
  h = h.replace(/<a href="[^"]*\/uj-auto-berlese\/?">[^<]*<\/a>(?:<a class="m-subitem" href="[^"]*uj-auto-berlese[^"]*">[\s\S]*?<\/a>)+/g, () => { stats.nav++; return ''; });
  // asztali menüpont flyout nélkül
  h = h.replace(/<a class="ddi" href="[^"]*\/uj-auto-berlese\/?">[^<]*<\/a>/g, () => { stats.nav++; return ''; });
  // lábléc / linklisták (egymás utáni linkek között)
  h = h.replace(/(?<=<\/a>)\s*<a href="[^"]*\/uj-auto-berlese\/?">[^<]*<\/a>(?=\s*<a )/g, () => { stats.nav++; return ''; });
  // link-tagek (canonical / hreflang / og): hash nélkül
  h = h.replace(/<link\b[^>]*uj-auto-berlese[^>]*>|<meta\b[^>]*uj-auto-berlese[^>]*>/g, (tag) => rewriteUrls(tag, true));
  // minden más hivatkozás
  h = rewriteUrls(h, false);
  if (h !== before) stats.links++;
  return h;
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'uj-auto-berlese') { fs.rmSync(p, { recursive: true, force: true }); stats.removedDirs++; continue; }
      walk(p);
      continue;
    }
    if (!/\.(html|json|xml|js)$/.test(e.name)) continue;
    let s = fs.readFileSync(p, 'utf8');
    if (!s.includes('uj-auto-berlese')) continue;
    const o = s;
    if (e.name.endsWith('.xml')) {
      s = s.replace(/<url>(?:(?!<\/url>)[\s\S])*?uj-auto-berlese(?:(?!<\/url>)[\s\S])*?<\/url>\s*/g, () => { stats.sitemap++; return ''; });
      s = rewriteUrls(s, true);
    } else if (e.name === 'kereses-index.json') {
      try {
        const d = JSON.parse(s);
        const n0 = d.items.length;
        d.items = d.items.filter((it) => !/\/uj-auto-berlese(\/|$)/.test(it.u || ''));
        stats.search += n0 - d.items.length;
        s = rewriteUrls(JSON.stringify(d), false);
      } catch { s = rewriteUrls(s, false); }
    } else if (e.name === '_routes.json') {
      continue;
    } else if (e.name.endsWith('.html')) {
      s = processHtml(s);
    } else {
      s = rewriteUrls(s, false);
    }
    if (s !== o) { fs.writeFileSync(p, s); stats.files++; }
  }
}
walk(ROOT);

// _routes.json: a régi címekre fusson a middleware (301 átirányítás)
const rp = path.join(ROOT, '_routes.json');
if (fs.existsSync(rp)) {
  const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
  const want = ['/uj-auto-berlese', '/uj-auto-berlese/*', ...LANGS.flatMap((l) => ['/' + l + '/uj-auto-berlese', '/' + l + '/uj-auto-berlese/*'])];
  r.include = r.include.filter((x) => !/uj-auto-berlese/.test(x));
  const covered = (w) => r.include.some((x) => x === w || (x.endsWith('/*') && (w + '/').startsWith(x.slice(0, -1))));
  for (const w of want) if (!covered(w)) r.include.push(w);
  if (r.include.length > 100) throw new Error('_routes.json: túl sok szabály (' + r.include.length + ')');
  fs.writeFileSync(rp, JSON.stringify(r, null, 2));
}
console.log('[ujberles] ' + JSON.stringify(stats));
