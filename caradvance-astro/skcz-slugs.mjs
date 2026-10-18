/**
 * CarAdvance — szlovák / cseh URL-ek a saját domaineken (caradvance.sk / caradvance.cz)
 *
 * A dist/sk és dist/cs oldalai eddig a magyar könyvtárneveket használták (/autoink/, /kapcsolat/ …).
 * Ez a lépés (a seo-perf.mjs hívja, a build végén):
 *   1. minden szlovák/cseh oldalnak saját, beszédes címet ad (/auta/, /prenajom/bmw-x3/, /kontakt/ …),
 *      és a fájlokat ennek megfelelően áthelyezi a dist/sk, dist/cs alatt;
 *   2. a csak magyar vonatkozású (le nem fordított) blogcikkeket kiveszi a szlovák/cseh oldalról;
 *   3. az összes HTML/JSON-ban átírja a /sk/… /cs/… linkeket (abszolút linkeknél rögtön a saját domainre);
 *   4. a futásidejű fordító (i18n/rt-sk.js, rt-cs.js) SL táblájába beírja az új címeket, így a
 *      JavaScriptből generált linkek is szlovák/cseh címet kapnak;
 *   5. kiírja a dist/sk/_slugs.json és dist/cs/_slugs.json térképet (régi magyar cím → új cím) —
 *      a middleware ebből ad 301-et a régi címekről.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = { sk: 'https://www.caradvance.sk', cs: 'https://www.caradvance.cz' };

// Felső szintű könyvtárak: magyar → szlovák / cseh (a menü szerkezetét követi)
const TOP = {
  sk: {
    'autoink': 'auta',
    'tartos-berlet': 'prenajom',
    'berelheto-auto': 'prenajom',
    'berlesi-folyamat': 'prenajom/proces',
    'berlesi-feltetelek': 'prenajom/podmienky-a-kaucia',
    'berles-elonyei': 'prenajom/vyhody',
    'berles-gyakori-kerdesek': 'prenajom/caste-otazky',
    'auto-osszehasonlitas': 'prenajom/porovnanie-aut',
    'egyedi-auto-rendeles': 'predaj/auto-na-mieru',
    'finanszirozas-lizing': 'predaj/financovanie-lizing',
    'operativ-lizing': 'predaj/operativny-lizing',
    'vasarlas-elonyei': 'predaj/vyhody',
    'vasarlas-gyakori-kerdesek': 'predaj/caste-otazky',
    'bizomanyos': 'komisny-predaj',
    'bizomanyos-auto': 'komisny-predaj/auto',
    'eladom': 'komisny-predaj/predat-auto',
    'jotekonysag': 'komisny-predaj/charita',
    'ertekesitesi-folyamat': 'komisny-predaj/proces',
    'gyakori-kerdesek': 'komisny-predaj/caste-otazky',
    'auto-rendeles': 'dovoz',
    'beszerzesi-folyamat': 'dovoz/proces',
    'honositas-kalkulator': 'dovoz/kalkulacka-poplatkov',
    'atiras-kalkulator': 'dovoz/kalkulacka-prepisu',
    'elonyok': 'dovoz/vyhody',
    'egyedul-vagy-velunk': 'dovoz/sami-alebo-s-nami',
    'miert-mi': 'o-nas',
    'referenciak': 'o-nas/referencie',
    'atlathatosag': 'o-nas/transparentnost',
    'minosegbiztositas': 'o-nas/zabezpecenie-kvality',
    'media': 'o-nas/media',
    'kapcsolat': 'kontakt',
    'autot-keresek': 'hladam-auto',
    'adatkezeles': 'ochrana-osobnych-udajov',
    'aszf': 'obchodne-podmienky',
    'impresszum': 'impressum',
    'audi-konfigurator': 'konfigurator/audi',
    'mercedes-konfigurator': 'konfigurator/mercedes',
    'mini-konfigurator': 'konfigurator/mini',
    'blog': 'blog',
    'auto': 'auto',
    'ucet': 'ucet'
  },
  cs: {
    'autoink': 'vozy',
    'tartos-berlet': 'pronajem',
    'berelheto-auto': 'pronajem',
    'berlesi-folyamat': 'pronajem/proces',
    'berlesi-feltetelek': 'pronajem/podminky-a-kauce',
    'berles-elonyei': 'pronajem/vyhody',
    'berles-gyakori-kerdesek': 'pronajem/caste-dotazy',
    'auto-osszehasonlitas': 'pronajem/srovnani-vozu',
    'egyedi-auto-rendeles': 'prodej/vuz-na-miru',
    'finanszirozas-lizing': 'prodej/financovani-leasing',
    'operativ-lizing': 'prodej/operativni-leasing',
    'vasarlas-elonyei': 'prodej/vyhody',
    'vasarlas-gyakori-kerdesek': 'prodej/caste-dotazy',
    'bizomanyos': 'komisni-prodej',
    'bizomanyos-auto': 'komisni-prodej/vuz',
    'eladom': 'komisni-prodej/prodat-vuz',
    'jotekonysag': 'komisni-prodej/charita',
    'ertekesitesi-folyamat': 'komisni-prodej/proces',
    'gyakori-kerdesek': 'komisni-prodej/caste-dotazy',
    'auto-rendeles': 'dovoz',
    'beszerzesi-folyamat': 'dovoz/proces',
    'honositas-kalkulator': 'dovoz/kalkulacka-poplatku',
    'atiras-kalkulator': 'dovoz/kalkulacka-prepisu',
    'elonyok': 'dovoz/vyhody',
    'egyedul-vagy-velunk': 'dovoz/sami-nebo-s-nami',
    'miert-mi': 'o-nas',
    'referenciak': 'o-nas/reference',
    'atlathatosag': 'o-nas/transparentnost',
    'minosegbiztositas': 'o-nas/zajisteni-kvality',
    'media': 'o-nas/media',
    'kapcsolat': 'kontakt',
    'autot-keresek': 'hledam-vuz',
    'adatkezeles': 'ochrana-osobnich-udaju',
    'aszf': 'obchodni-podminky',
    'impresszum': 'impressum',
    'audi-konfigurator': 'konfigurator/audi',
    'mercedes-konfigurator': 'konfigurator/mercedes',
    'mini-konfigurator': 'konfigurator/mini',
    'blog': 'blog',
    'auto': 'auto',
    'ucet': 'ucet'
  }
};

// Al-címek szavai (modellnevek, konfigurátor-kódok): magyar szó → szlovák / cseh
const TOKENS = {
  sk: { osztaly: 'trieda', limuzin: 'limuzina', ajtos: 'dverova', berles: '', dizel: 'diesel', elektromos: 'elektricke', hibrid: 'hybrid', benzin: 'benzin' },
  cs: { osztaly: 'trida', limuzin: 'limuzina', ajtos: 'dverova', berles: '', dizel: 'diesel', elektromos: 'elektricky', hibrid: 'hybrid', benzin: 'benzin' }
};
function subSlug(s, l) {
  const T = TOKENS[l];
  const out = s.replace(/(\d)-(as|es|os|ös)(?=-|$)/g, '$1')         // bmw-3-as → bmw-3
    .split('-').map((w) => (Object.prototype.hasOwnProperty.call(T, w) ? T[w] : w)).filter(Boolean).join('-');
  return out || s;
}

const HU_TEXT = /[őűŐŰ]|(^|[\s(„"])(és|hogy|vagy|egy|nem|az|így|mennyi|mikor|menete|ára|díja|autó)(?=[\s,.!?:;)"—–-]|$)/i;
function slugify(t) {
  let s = String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length > 70) { s = s.slice(0, 70); s = s.slice(0, s.lastIndexOf('-') > 30 ? s.lastIndexOf('-') : 70); }
  return s;
}
function readH1(file) {
  try {
    const h = fs.readFileSync(file, 'utf8');
    const m = h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!m) return '';
    return m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;|&#160;/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  } catch (e) { return ''; }
}

function listPages(base) {
  const res = [];
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name), rel + e.name + '/');
      else if (e.name === 'index.html') res.push(rel);
    }
  })(base, '/');
  return res; // pl. ['/', '/autoink/', '/auto/bmw-x5/']
}

function buildMap(l, base) {
  const map = {}; const used = new Set(); const excluded = []; const unknown = [];
  const pages = listPages(base);
  for (const hu of pages) {
    if (hu === '/') { map[hu] = '/'; used.add('/'); continue; }
    const segs = hu.split('/').filter(Boolean);
    const top = TOP[l][segs[0]];
    let loc;
    if (top === undefined) { unknown.push(hu); loc = '/' + segs.map((s) => subSlug(s, l)).join('/') + '/'; }
    else if (segs.length === 1) loc = '/' + top + '/';
    else if (segs[0] === 'blog') {
      const h1 = readH1(path.join(base, hu, 'index.html'));
      if (!h1 || HU_TEXT.test(h1)) { excluded.push(hu); map[hu] = '/blog/'; continue; }
      const main = h1.split(/\s[—–|]\s|[?:]\s/)[0].trim();          // a cím fő része („Dovoz auta z Nemecka — …” → „Dovoz auta z Nemecka”)
      loc = '/blog/' + slugify(main.length >= 15 ? main : h1) + '/';
    } else if (segs[0] === 'auto') loc = hu;                        // autók adatlapja: márka/modell, nem magyar
    else loc = '/' + top + '/' + segs.slice(1).map((s) => subSlug(s, l)).join('/') + '/';
    let fin = loc, i = 2;
    while (used.has(fin)) fin = loc.replace(/\/$/, '') + '-' + (i++) + '/';
    used.add(fin); map[hu] = fin;
  }
  return { map, excluded, unknown };
}

function moveTree(base, map) {
  const tmp = base + '.__new';
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  // nem-oldal fájlok a gyökérben (robots.txt, sitemap.xml …)
  for (const e of fs.readdirSync(base, { withFileTypes: true })) if (e.isFile()) fs.copyFileSync(path.join(base, e.name), path.join(tmp, e.name));
  for (const [hu, loc] of Object.entries(map)) {
    if (hu !== '/' && loc === '/blog/' && hu.startsWith('/blog/')) continue; // kizárt blogcikk
    const src = path.join(base, hu);
    const dst = path.join(tmp, loc);
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) if (e.isFile()) fs.copyFileSync(path.join(src, e.name), path.join(dst, e.name));
  }
  fs.rmSync(base, { recursive: true, force: true });
  fs.renameSync(tmp, base);
}

export function run(DIST = 'dist') {
  const MAPS = {}; const stats = [];
  for (const l of ['sk', 'cs']) {
    const base = path.join(DIST, l);
    if (!fs.existsSync(path.join(base, 'index.html'))) continue;
    const { map, excluded, unknown } = buildMap(l, base);
    moveTree(base, map);
    fs.writeFileSync(path.join(base, '_slugs.json'), JSON.stringify(map));
    MAPS[l] = { map, excluded };
    stats.push(`${l}: ${Object.keys(map).length} cím, kizárt blog: ${excluded.length}${unknown.length ? ', ismeretlen: ' + unknown.join(' ') : ''}`);
  }
  if (!Object.keys(MAPS).length) return '[skcz] nincs sk/cs oldal';

  // Linkek átírása minden HTML/JSON fájlban
  const RE = /(?<=["'(=\s,])(https:\/\/(?:www\.)?caradvance\.hu)?\/(sk|cs)(\/[^"'\s?#<>)\\]*)/g;
  const conv = (whole, abs, l, p) => {
    const M = MAPS[l]; if (!M) return whole;
    let q = p; if (!q.endsWith('/') && !/\.[a-z0-9]{1,5}$/i.test(q)) q += '/';
    const loc = M.map[q]; if (!loc) return whole;
    return abs ? SITE[l] + loc : '/' + l + loc;
  };
  const exclRe = {};
  for (const l of Object.keys(MAPS)) if (MAPS[l].excluded.length) {
    exclRe[l] = new RegExp('<a\\b[^>]*href="(?:https://(?:www\\.)?caradvance\\.hu)?/' + l + '(?:' + MAPS[l].excluded.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')"[^>]*>([\\s\\S]*?)</a>', 'g');
  }
  let files = 0, changed = 0;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(html|json)$/.test(e.name) || e.name === '_slugs.json') continue;
      let s = fs.readFileSync(p, 'utf8');
      if (!/\/(sk|cs)\//.test(s)) continue;
      files++;
      const o = s;
      // kizárt (csak magyar) blogcikkek: kártya törlése, szövegközi link kibontása
      for (const l of Object.keys(exclRe)) s = s.replace(exclRe[l], (a, inner) => (/class="[^"]*card/.test(a) ? '' : inner));
      s = s.replace(RE, conv);
      if (s !== o) { fs.writeFileSync(p, s); changed++; }
    }
  })(DIST);

  // Futásidejű fordító: SL tábla (magyar cím → /sk/új cím)
  let rtn = 0;
  for (const l of Object.keys(MAPS)) {
    for (const d of [path.join(DIST, 'i18n'), path.join(DIST, '_np', 'i18n')]) {
      const f = path.join(d, 'rt-' + l + '.js');
      if (!fs.existsSync(f)) continue;
      let s = fs.readFileSync(f, 'utf8');
      const SL = {};
      for (const [hu, loc] of Object.entries(MAPS[l].map)) SL[hu] = '/' + l + loc;
      const n = s.replace('var SL={};', 'var SL=' + JSON.stringify(SL) + ';');
      if (n !== s) { fs.writeFileSync(f, n); rtn++; }
    }
  }
  return `[skcz] ${stats.join(' | ')} · linkek: ${changed}/${files} fájl · rt SL: ${rtn}`;
}
