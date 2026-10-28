#!/usr/bin/env node
/**
 * caradvance.pl — lengyel oldal A SZLOVÁK OLDAL SZERKEZETÉBEN (2026-10)
 *
 * A kész szlovák oldalakból (dist/sk/**, a skcz-local és skcz-langs után) elkészíti:
 *   dist/pl/<lengyel útvonal>/index.html            — lengyel (fő nyelv)
 *   dist/pl/en/… , dist/pl/de/…                      — angol és német (lengyel piacra lokalizálva)
 * A domain: https://www.caradvance.pl (a functions/_middleware.js a dist/pl-ből szolgálja ki).
 *
 * Fordítás: a szlovák szövegegységekhez a pl-site-data.json kézi fordításai (pl + a piacfüggő egységek
 * en/de változata); ahol nincs, ott a szlovák oldal angol/német fordítása (skcz-langs szótára).
 * Lokalizálás: magyar központi csapat (Csadi Ferenc — lengyel piac, Tóth Károly, Bajzáth Balázs),
 * +36 30 233 6060, info@caradvance.hu, BH Group Zrt. mint közvetítő, € árak + tájékoztató PLN-összeg,
 * lengyel akcyza- és PCC-kalkulátor. Élesítésig (PL.live=false) minden oldal noindex, a robots.txt tilt.
 * Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize, visit, finishLd, maskNums, unmaskNums } from './i18n-core.mjs';
import { maskModels, unmaskModels, neutralL, maskModels2, normNums, phraseFix } from './skcz-langs-mask.mjs';
import { SKL } from './skcz-langs-data.mjs';
import { plCalcPage, CALC_PAGES } from './pl-calc.mjs';

const PL = JSON.parse(fs.readFileSync('pl-site-config.json', 'utf8'));
const DIST = 'dist';
const SK = path.join(DIST, 'sk');
const OUT = path.join(DIST, 'pl');
const SITE = PL.site;                         // https://www.caradvance.pl
const LANGS = ['pl', 'en', 'de'];
const OG = { pl: 'pl_PL', en: 'en_GB', de: 'de_DE' };
const HL = { pl: 'pl', en: 'en-PL', de: 'de-PL' };
const SW = [['pl', 'Polski', 'pl'], ['en', 'English', 'gb'], ['de', 'Deutsch', 'de']];
const SKIP_TOP = /^(en|de|hu|_np)$/;
const MIN_COVER = 0.97;

const sig = (s) => [...String(s).matchAll(/\{\d+\}|<\/?[gx]\d+\/?>|⟨M\d+⟩/g)].map((m) => m[0]).sort().join('|');

/* ---------- szótárak ---------- */
function dicts() {
  const sk = JSON.parse(fs.readFileSync('src/i18n/dict/sk.json', 'utf8'));
  const src = { en: JSON.parse(fs.readFileSync('src/i18n/dict/en.json', 'utf8')), de: JSON.parse(fs.readFileSync('src/i18n/dict/de.json', 'utf8')) };
  const D = { pl: new Map(), en: new Map(), de: new Map() };
  const HUS = { en: /Hungar|Budapest|\bHUF\b|\bFt\b|forint/i, de: /Ungarn|ungarisch|Budapest|\bHUF\b|\bFt\b|Forint/i };
  const SRC_HU = /Maďar|maďar|Hungar|Budapešť|Budapest|\bHUF\b|\bFt\b|forint|Magyar/;
  for (const [hu, v] of Object.entries(sk)) {
    if (!v) continue;
    for (const l of ['en', 'de']) if (src[l][hu] && !D[l].has(v)) { if (SRC_HU.test(v) || !HUS[l].test(src[l][hu])) D[l].set(v, src[l][hu]); }
  }
  for (const [k, arr] of Object.entries(SKL)) { if (arr[0] && sig(arr[0]) === sig(k)) D.en.set(k, arr[0]); if (arr[1] && sig(arr[1]) === sig(k)) D.de.set(k, arr[1]); }
  const PLD = JSON.parse(fs.readFileSync('pl-site-data.json', 'utf8'));
  let bad = 0;
  for (const [k, [p, e, d]] of Object.entries(PLD)) {
    if (p && sig(p) === sig(k)) D.pl.set(k, p); else if (p) bad++;
    if (e && sig(e) === sig(k)) D.en.set(k, e);
    if (d && sig(d) === sig(k)) D.de.set(k, d);
  }
  return { D, bad };
}

function pfix(s, l) {
  if (l !== 'pl') return phraseFix(s, l);
  return s.replace(/(?<![\p{L}])(?:rad|radu|rade|Rad) (\d+)(?![\p{L}\p{N}])/gu, 'Serii $1').replace(/(?<![\p{L}])(?:trieda|triedy|triede|triedu|Trieda|Triedy) ([A-Z]{1,3}|\{\d+\})(?![\p{L}\p{N}])/gu, 'Klasa $1')
    .replace(/(?<![\p{L}])[Ll]imuzín[auy](?![\p{L}])/gu, 'Limuzyna');
}
const D2C = new Map();
function d2(D, l) {
  const key = D[l]; if (D2C.has(key)) return D2C.get(key);
  const M = new Map();
  for (const [k, t] of D[l]) {
    if (!/[{⟨]/.test(k)) continue;
    const n = normNums(k); if (M.has(n.kn)) continue;
    M.set(n.kn, t.replace(/\{(\d+)\}/g, (m, i) => (n.seen.has(i) ? '{' + n.seen.get(i) + '}' : m)));
  }
  D2C.set(key, M); return M;
}
function look1(D, l, k) {
  let t = D[l].get(k);
  if (t != null && sig(t) === sig(k)) return t;
  const { km, ms } = maskModels(k);
  if (km !== k) { t = D[l].get(km); if (t != null && sig(t) === sig(km)) return unmaskModels(t, ms); }
  if (neutralL(k)) return k;
  for (const mm of [maskModels(k), maskModels2(k)]) {
    const n = normNums(mm.km); const t2 = d2(D, l).get(n.kn);
    if (t2 == null) continue;
    const back = t2.replace(/\{(\d+)\}/g, (m, j) => (n.map[+j - 1] !== undefined ? '{' + n.map[+j - 1] + '}' : m));
    if (sig(back) !== sig(mm.km)) continue;
    return pfix(unmaskModels(back, mm.ms), l);
  }
  return null;
}
/* lengyelnél, ha nincs fordítás: az angol változat (jobb, mint a szlovák szöveg); a lefedettségbe nem számít bele */
function lookup(D, l, k, st) {
  const t = look1(D, l, k);
  if (t != null) return t;
  if (st) st.miss++;
  return l === 'pl' ? look1(D, 'en', k) : null;
}

/* ---------- útvonalak ---------- */
const SEG = PL.slugSeg;            // szlovák útvonal-szegmens → lengyel
const WORD = PL.slugWord;          // modell-slugokban: trieda → klasa …
const WORDS = Object.keys(WORD).sort((a, b) => b.length - a.length);
function slugOf(rel) {             // 'prenajom/bmw-3-limuzina/' → 'wynajem/bmw-3-limuzyna/'
  if (!rel) return '';
  return rel.split('/').filter(Boolean).map((s) => SEG[s] || WORDS.reduce((x, w) => x.replace(new RegExp('(^|-)' + w + '(?=-|$)', 'g'), '$1' + WORD[w]), s)).join('/') + '/';
}

function pages(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!(rel === '' && SKIP_TOP.test(e.name))) out.push(...pages(path.join(dir, e.name), rel + e.name + '/')); }
    else if (e.name === 'index.html') out.push(rel);
  }
  return out;
}

/* ---------- PLN-tájékoztató ---------- */
function PLNADD(s, R) {
  if (!R || !/€/.test(s) || /zł/.test(s)) return s;
  return s.replace(/(\d{1,3}(?:[   .]\d{3})+|\d{2,})(?:,\d{1,2})?[   ]?€((?:[   ]?\/[   ]?(?:mies\.|mo\.|month|Monat|Mon\.))?)(?![   ]*\(≈)/g, function (m, a) {
    var e = +String(a).replace(/[^\d]/g, ''); if (e < 50) return m;
    var z = Math.round(e * R / 10) * 10;
    return m + ' (≈ ' + String(z).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' zł)';
  });
}
function plnHtml(h, R) {
  const bi = h.search(/<body\b/i); if (bi < 0) return h;
  const head = h.slice(0, bi);
  const body = h.slice(bi).split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<option\b[\s\S]*?<\/option>|<title\b[\s\S]*?<\/title>)/i)
    .map((part, i) => (i % 2 ? part : part.replace(/(<[^<>]*>)([^<>]*€[^<>]*)</g, (m, tag, t) => tag + (/class="[^"]*\bca-pv\b/.test(tag) ? t : PLNADD(t, R)) + '<'))).join('');
  return head + body;
}

/* ---------- kapcsolat, cégadatok, csapat ---------- */
function localize(h, l) {
  for (const [a, b] of PL.replace) h = h.split(a).join(b);
  for (const [re, b] of PL.replaceRe) h = h.replace(new RegExp(re, 'g'), b);
  for (const [re, b] of PL.fix || []) h = h.replace(new RegExp(re, 'g'), typeof b === 'string' ? b : b[l]);
  // lengyel kereskedelmi képviselő (Mr.JOB POLAND Sp. z o.o.) — végső csere: a fordítások a korábbi képviselő adatait is tartalmazhatják
  for (const [re, b] of PL.coFix || []) h = h.replace(new RegExp(re, 'g'), typeof b === 'string' ? b : b[l]);
  // csapat-kártyák: kép, zászlók
  for (const t of PL.team) {
    const img = t.from;
    h = h.split(img).join(t.img);
    const flags = (cls, w) => t.flags.map((c) => `<span class="${cls}" style="background-image:url(https://flagcdn.com/${w}/${c}.png)"></span>`).join('');
    h = h.replace(new RegExp(`(<img src="${t.img.replace(/[.?]/g, '\\$&')}"[\\s\\S]{0,400}?<span class="kap-flags">)([\\s\\S]*?)(</span></div>)`, 'g'), (m, a, f, c) => a + flags('kap-rflag', 'w40') + c);
    h = h.replace(new RegExp(`(<img src="${t.img.replace(/[.?]/g, '\\$&')}"[\\s\\S]{0,600}?<div class="tc-flags"[^>]*>)([\\s\\S]*?)(</div>)`, 'g'), (m, a, f, c) => a + t.flags.map((cc) => `<span class="tc-flag" style="background-image:url(https://flagcdn.com/w80/${cc}.png)"></span>`).join('') + c);
  }
  // lábléc: a régió többi oldala (Magyarország, Szlovákia, Csehország)
  const SKN = { pl: 'CarAdvance Słowacja', en: 'CarAdvance Slovakia', de: 'CarAdvance Slowakei' };
  if (!/hreflang="sk">CarAdvance/.test(h)) h = h.replace(/(<a href="https:\/\/www\.caradvance\.cz\/" hreflang="cs">[^<]*<\/a>)/, `$1<a href="https://www.caradvance.sk/" hreflang="sk">${SKN[l]}</a>`);
  return h;
}

/* ---------- nyelvváltó ---------- */
function switcher(h, cur, plPath) {
  const href = (c) => '/pl' + (c === 'pl' ? '' : '/' + c) + plPath;
  const opts = (cls) => SW.map(([c, name, flag]) => `<a hreflang="${HL[c]}" class="${cls}" href="${href(c)}"${c === cur ? ' aria-current="true"' : ''}><span class="lf" style="background-image:url(https://flagcdn.com/w80/${flag}.png)"></span><span>${name}</span></a>`).join('');
  for (const cls of ['langopt', 'm-langopt']) {
    const re = new RegExp(`(?:<a hreflang="[^"]+" class="${cls}"[^>]*>[\\s\\S]*?<\\/a>)+`, 'g');
    let done = false;
    h = h.replace(re, () => { if (done) return ''; done = true; return opts(cls); });
  }
  const flag = SW.find((x) => x[0] === cur)[2];
  return h.replace(/(class="navflag" style="background-image:url\(https:\/\/flagcdn\.com\/w80\/)[a-z]+(\.png\))/g, `$1${flag}$2`);
}

/* ---------- egy oldal fordítása ---------- */
function translate(src, l, D, rel, miss) {
  const doc = parse(src);
  const st = { miss: 0 }; let tot = 0;
  const note = (k) => { const { km } = maskModels(k); const m = miss.get(km) || { n: 0, l: new Set(), p: rel, raw: k }; m.n++; m.l.add(l); miss.set(km, m); };
  visit(doc, (kind, k, apply) => {
    tot++;
    if (/English<\/g\d+>[\s\S]*Deutsch<\/g\d+>/.test(k)) return;
    const m0 = st.miss; const t = lookup(D, l, k, st);
    if (st.miss > m0) note(k);
    if (t != null && t !== k) { try { apply(t); } catch (e) {} }
  });
  finishLd(doc);
  let h = serialize(doc);
  const tr = (txt) => { const { k, nums } = maskNums(txt.trim().replace(/\s+/g, ' ')); if (!k) return null; const m0 = st.miss; const t = lookup(D, l, k, st); if (st.miss > m0) note(k); return t == null ? null : unmaskNums(t, nums); };
  // <option>
  h = h.split(/(<script\b[\s\S]*?<\/script>)/i).map((part, pi) => (pi % 2 ? part : part.replace(/(<option\b[^>]*>)([^<]*\p{L}[^<]*)(<\/option>)/gu, (m, a, txt, b) => {
    const t = tr(txt); if (t == null) return m;
    return a + txt.match(/^\s*/)[0] + t + txt.match(/\s*$/)[0] + b;
  }))).join('');
  // beágyazott szkriptek: HTML-sablonok és szöveg-literálok (csak ha van fordítás)
  const look0 = (txt) => { const { k, nums } = maskNums(txt.trim().replace(/\s+/g, ' ')); if (!k) return null; const t = look1(D, l, k) ?? (l === 'pl' ? look1(D, 'en', k) : null); return t == null || t === k ? null : unmaskNums(t, nums); };
  h = h.replace(/(<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>)([\s\S]*?)(<\/script>)/gi, (all, a, js, b) => a + js.replace(/>([^<>\n'"`\\{}]*\p{L}[^<>\n'"`\\{}]*)</gu, (mm, txt) => {
    if (!/ /.test(txt.trim())) return mm;
    const t = look0(txt); if (t == null) return mm;
    return '>' + txt.match(/^\s*/)[0] + t.replace(/'/g, '’').replace(/"([^"]*)"/g, '„$1”').replace(/"/g, '”') + txt.match(/\s*$/)[0] + '<';
  }) + b);
  h = h.replace(/(<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>)([\s\S]*?)(<\/script>)/gi, (all, a, js, b) => a + js.replace(/(['"])((?:(?!\1)[^\\\n]|\\.){3,300}?)\1/g, (m, q, str) => {
    if (/<[a-z\/]/i.test(str) && !/[{}]|\\u/.test(str)) {
      return q + str.replace(/>([^<>]*\p{L}[^<>]*)</gu, (mm, txt) => { const t = look0(txt); return t == null ? mm : '>' + txt.match(/^\s*/)[0] + t.split(q).join('\\' + q) + txt.match(/\s*$/)[0] + '<'; }) + q;
    }
    if (!/\p{L}{2,}/u.test(str) || /[{}<>]|\\u|^[\w.$#/-]+$/.test(str)) return m;
    const t = look0(str); if (t == null) return m;
    return q + (str.match(/^\s*/)[0] + t + str.match(/\s*$/)[0]).replace(/\\/g, '\\\\').split(q).join('\\' + q) + q;
  }) + b);
  return { h, cover: tot ? (tot - st.miss) / tot : 1 };
}

function run() {
  if (!fs.existsSync(SK)) return 'nincs dist/sk';
  const { D, bad } = dicts();
  const list = pages(SK).filter((rel) => !/^icons\//.test(rel));
  const map = new Map(list.map((rel) => [rel, slugOf(rel)]));       // szlovák rel → lengyel rel
  const skAbs = (p) => { const q = p.replace(/^\//, ''); const b = q.split(/[?#]/)[0]; const n = b === '' ? '' : (b.endsWith('/') ? b : b + '/'); return map.has(n) ? '/' + map.get(n) + q.slice(b.length) : null; };
  const miss = new Map();
  const stat = { pl: [0, 0], en: [0, 0], de: [0, 0] };
  const okp = { pl: new Set(), en: new Set(), de: new Set() };
  const R = +PL.fxPLN || 4.3;
  let written = 0;
  fs.rmSync(OUT, { recursive: true, force: true });

  for (const rel of list) {
    const src = fs.readFileSync(path.join(SK, rel, 'index.html'), 'utf8');
    if (/http-equiv=["']?refresh/i.test(src)) continue;
    const plRel = map.get(rel); const plPath = '/' + plRel;
    const calc = CALC_PAGES[rel];
    for (const l of LANGS) {
      if (calc && l !== 'pl') continue;
      let { h, cover } = translate(src, l, D, rel, miss);
      stat[l][0] += cover; stat[l][1] += 1;
      const pre = l === 'pl' ? '' : '/' + l;
      const url = SITE + pre + plPath;
      h = h.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${l}"`);
      h = h.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${url}">`);
      h = h.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${url}">`);
      h = h.replace(/<meta property="og:locale" content="[^"]*">/i, `<meta property="og:locale" content="${OG[l]}">`);
      h = h.replace(/[ \t]*<meta property="og:locale:alternate"[^>]*>\s*\n?/g, '');
      // hreflang: csak a lengyel klaszter (pl, en-PL, de-PL)
      h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*\n?/g, '');
      const alts = (calc ? ['pl'] : LANGS).map((x) => `<link rel="alternate" hreflang="${HL[x]}" href="${SITE}${x === 'pl' ? '' : '/' + x}${plPath}">`).join('\n');
      h = h.replace(/(<link rel="canonical" href="[^"]*">)/i, `$1\n${alts}`);
      // belső linkek: /sk/(en|de|hu)?/… → /pl/(en|de)?/<lengyel út>
      h = h.replace(/(\s(?:href|action)=")\/sk(?:\/(en|de|hu))?(\/[^"]*)?"/g, (m, a, lg, q) => {
        const p2 = skAbs(q || '/');
        if (!p2) return /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(q || '') ? m : `${a}/pl${pre}/"`;
        const target = (calc || CALC_PAGES[(q || '/').replace(/^\//, '').split(/[?#]/)[0]]) ? '' : pre;
        return `${a}/pl${target}${p2}"`;
      });
      // abszolút caradvance.sk címek (JSON-LD, meta) → caradvance.pl
      h = h.replace(/https:\/\/www\.caradvance\.sk(\/(?:en|de|hu)(?=\/))?(\/[^"\\\s<]*)?/g, (m, lg, q) => { const p2 = skAbs(q || '/'); return p2 ? SITE + pre + p2 : m; });
      // futásidejű fordító, keresőindex
      h = h.split('/i18n/rt-sk.js').join(l === 'pl' ? '/i18n/rt-pl.js' : `/i18n/rt-pl-${l}.js`);
      h = h.replace(/data-idx="\/sk\/kereses-index\.json" data-lang="sk"/g, `data-idx="/pl${pre}/kereses-index.json" data-lang="${l}"`);
      h = switcher(h, l, plPath);
      h = localize(h, l);
      for (const [a, b] of (PL.jsfix || {})[l] || []) h = h.split(a).join(b);
      // a szlovák oldal szkriptjei a 'sk' ágat használják — ez most a lengyel szöveg; a hónapnév-listák a lengyel neveket is ismerjék
      h = h.replace(/(<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>)([\s\S]*?)(<\/script>)/gi, (all, a, js, b) => a + (l === 'pl' ? js.split('document.documentElement.lang').join("(document.documentElement.lang==='pl'?'sk':document.documentElement.lang)") : js).replace(/var MON=\[[^\]]*\]/, 'var MON=' + PL.monRe) + b);
      if (calc) h = plCalcPage(h, calc, { kontakt: '/pl/kontakt/', akcyza: '/pl/' + map.get('dovoz/kalkulacka-poplatkov/'), pcc: '/pl/' + map.get('dovoz/kalkulacka-prepisu/') }, url, R);
      h = plnHtml(h, R);
      // robots: élesítésig noindex
      h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, '');
      const noidx = !PL.live || cover < MIN_COVER;
      if (noidx) h = h.replace(/<\/head>/i, '<meta name="robots" content="noindex,nofollow">\n</head>');
      else okp[l].add(plPath);
      const f = path.join(OUT, l === 'pl' ? '' : l, plRel, 'index.html');
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, h); written++;
    }
  }

  // _slugs.json: régi magyar és szlovák címek → lengyel cím (a middleware 301-et ad)
  const slugs = {};
  try { const sks = JSON.parse(fs.readFileSync(path.join(SK, '_slugs.json'), 'utf8')); for (const [hu, s] of Object.entries(sks)) { const p2 = skAbs(s); if (p2 && hu !== p2) slugs[hu] = p2; } } catch (e) {}
  const plSet = new Set(map.values());
  for (const [rel, p] of map) if (rel !== p && !plSet.has(rel)) slugs['/' + rel] = '/' + p;
  for (const k of Object.keys(slugs)) if (plSet.has(k.replace(/^\//, '')) || slugs[k] === k) delete slugs[k];
  fs.writeFileSync(path.join(OUT, '_slugs.json'), JSON.stringify(slugs));

  // robots.txt + sitemap.xml
  const now = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), PL.live ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  const urls = LANGS.flatMap((l) => [...okp[l]].sort().map((p) => `  <url><loc>${SITE}${l === 'pl' ? '' : '/' + l}${p}</loc><lastmod>${now}</lastmod></url>`));
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

  // keresőindex
  const idxf = path.join(SK, 'kereses-index.json');
  if (fs.existsSync(idxf)) {
    const base = JSON.parse(fs.readFileSync(idxf, 'utf8'));
    const NUM = /\d+(?:[.,   ]\d+)*/g;
    const trs = (l, s) => { if (!s) return s; const nums = []; const k = String(s).replace(/\s+/g, ' ').trim().replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; }); const t = lookup(D, l, k); return t == null ? s : t.replace(/\{(\d+)\}/g, (m, i) => (nums[+i - 1] !== undefined ? nums[+i - 1] : m)); };
    for (const l of LANGS) {
      const d = JSON.parse(JSON.stringify(base)); d.lang = l;
      const pre = l === 'pl' ? '' : '/' + l;
      d.items = d.items.filter((x) => !/^\/sk\//.test(String(x.u || '')) || skAbs(String(x.u).slice(3))).map((x) => {
        for (const k of ['t', 'd', 'h']) if (x[k]) x[k] = localize(trs(l, x[k]), l);
        if (x.x) x.x = String(x.x).split(' · ').map((s) => trs(l, s)).join(' · ');
        const u = String(x.u || '');
        if (u.startsWith('/sk/')) {
          const p2 = skAbs(u.slice(3)); const c = CALC_PAGES[u.slice(4).split(/[?#]/)[0]]; x.u = '/pl' + (c ? '' : pre) + p2;
          // cím, leírás, H1, alcímek a kész lengyel / angol / német oldalból
          try {
            const f = path.join(OUT, c || l === 'pl' ? '' : l, p2.split(/[?#]/)[0], 'index.html');
            const ph = fs.readFileSync(f, 'utf8');
            const dec = (v) => String(v || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
            const tt = (ph.match(/<title>([\s\S]*?)<\/title>/) || [])[1]; if (tt) x.t = dec(tt).replace(/\s*[|—–-]\s*CarAdvance\s*$/i, '');
            const dd = (ph.match(/<meta name="description" content="([^"]*)"/) || [])[1]; if (dd) x.d = dec(dd).slice(0, 160);
            const h1 = (ph.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1]; if (h1) x.h = dec(h1);
            if (x.x) { const hs = [...ph.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) => dec(m[1])).filter(Boolean); if (hs.length) x.x = hs.slice(0, 14).join(' · ').slice(0, 400); }
          } catch (e) {}
        }
        return x;
      });
      fs.mkdirSync(path.join(OUT, l === 'pl' ? '' : l), { recursive: true });
      fs.writeFileSync(path.join(OUT, l === 'pl' ? '' : l, 'kereses-index.json'), localize(JSON.stringify(d), l));
      fs.writeFileSync(path.join(DIST, 'kereses-index-pl' + (l === 'pl' ? '' : '-' + l) + '.json'), localize(JSON.stringify(d), l));   // a kereses.js a .pl domainen ezt tölti be
    }
  }

  // futásidejű fordító: rt-pl.js (+ rt-pl-en.js, rt-pl-de.js)
  const part = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); return i < 0 || j < 0 ? null : [i, j]; };
  const rd = (f) => (fs.existsSync(path.join(DIST, 'i18n', f)) ? fs.readFileSync(path.join(DIST, 'i18n', f), 'utf8') : null);
  const rtSk = rd('rt-sk.js');
  let rtn = 0;
  if (rtSk) {
    const PLR = JSON.parse(fs.readFileSync('pl-site-rt.json', 'utf8'));
    const slR = part(rtSk, 'var SL=', 'var M=');
    const sl = rtSk.slice(slR[0], slR[1]).replace(/"\/sk(\/[^"]*)"/g, (m, q) => { const p2 = skAbs(q); return p2 ? `"/pl${p2}"` : m; });
    const extra = `var PLNR=${R};var PLNADD=${PLNADD.toString()};` +
      `try{var CC2=window.CA_CFG;if(CC2){CC2.PHONE=${JSON.stringify(PL.phone)};CC2.WHATSAPP='https://wa.me/${PL.wa}';}}catch(e){}`;
    const fixCur = (b) => b.replace(/CUR=function\(s\)\{return CONV\(s,FX\)\};/, 'CUR=function(s){var o=CONV(s,FX);return o!==s?PLNADD(o,PLNR):o};')
      .replace(/if\(\/\(\^\|\\\\?\.\)caradvance\\\\?\.\(sk\|cz\)\$\/\.test\(location\.hostname\)\)DOMSTRIP=\/\^\\\\?\/\(sk\|cs\)\\\\?\/\/;/, '')
      .replace('var UNITS=', `${extra}if(/(^|\\.)caradvance\\.pl$/.test(location.hostname))DOMSTRIP=/^\\/pl\\//;var UNITS=`);
    // lengyel
    {
      const mR = part(rtSk, 'var M=', ';var G='), gR = part(rtSk, 'var G=', ';var GN=');
      const Msk = JSON.parse(rtSk.slice(mR[0] + 6, mR[1])), Gsk = JSON.parse(rtSk.slice(gR[0] + 6, gR[1]));
      const rtEn = rd('rt-en.js'); let Men = {}, Gen = {};
      if (rtEn) { const a = part(rtEn, 'var M=', ';var G='), b2 = part(rtEn, 'var G=', ';var GN='); try { Men = JSON.parse(rtEn.slice(a[0] + 6, a[1])); Gen = JSON.parse(rtEn.slice(b2[0] + 6, b2[1])); } catch (e) {} }
      const M = {}, G = {};
      for (const k of Object.keys(Msk)) { const v = PLR.M[k] ?? Men[k]; if (v != null) M[k] = localize(v, 'pl'); }
      for (const k of Object.keys(Gsk)) { const v = PLR.G[k] ?? Gen[k]; if (v != null) G[k] = localize(v, 'pl'); }
      let b = rtSk.slice(0, mR[0]) + 'var M=' + JSON.stringify(M) + ';var G=' + JSON.stringify(G) + rtSk.slice(gR[1]);
      b = b.replace('var LG="sk"', 'var LG="pl"').replace(/var GN=\d+/, 'var GN=' + Object.keys(G).length);
      const s2 = part(b, 'var SL=', 'var M='); b = b.slice(0, s2[0]) + sl + b.slice(s2[1]);
      b = fixCur(b).replace(/^\/\* CarAdvance i18n runtime \([^)]*\) \*\//, '/* CarAdvance i18n runtime (caradvance.pl, pl) */');
      fs.writeFileSync(path.join(DIST, 'i18n', 'rt-pl.js'), b); rtn++;
    }
    for (const l of ['en', 'de']) {
      let b = rd(`rt-sk-${l}.js`); if (!b) continue;
      const sl2 = rtSk.slice(slR[0], slR[1]).replace(/"\/sk(\/[^"]*)"/g, (m, q) => { const p2 = skAbs(q); return p2 ? `"/pl/${l}${p2}"` : m; });
      const s2 = part(b, 'var SL=', 'var M='); if (s2) b = b.slice(0, s2[0]) + sl2 + b.slice(s2[1]);
      const mR = part(b, 'var M=', ';var G=');
      if (mR) { try { const M = JSON.parse(b.slice(mR[0] + 6, mR[1])); for (const k of Object.keys(M)) M[k] = localize(M[k], l); b = b.slice(0, mR[0]) + 'var M=' + JSON.stringify(M) + b.slice(mR[1]); } catch (e) {} }
      b = fixCur(b).replace(/^\/\* CarAdvance i18n runtime \([^)]*\) \*\//, `/* CarAdvance i18n runtime (caradvance.pl, ${l}) */`);
      fs.writeFileSync(path.join(DIST, 'i18n', `rt-pl-${l}.js`), b); rtn++;
    }
  }

  // _routes.json: a lengyel útvonalak is a middleware-en menjenek
  try {
    const rp = path.join(DIST, '_routes.json'); const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    const tops = new Set(['/pl/*']); for (const p of map.values()) { const t = p.split('/')[0]; if (t) tops.add('/' + t + '/*'); }
    for (const x of tops) if (!r.include.includes(x) && !r.include.includes('/' + x.split('/')[1] + '/*')) r.include.push(x);
    if (r.include.length + (r.exclude || []).length <= 100) fs.writeFileSync(rp, JSON.stringify(r, null, 2));
    else console.log('[pl-site] _routes.json: több mint 100 szabály, nem írtam át');
  } catch (e) {}

  // a hiányzó szlovák egységek darabokban (kb. 20 000 karakter), angol referenciával — a következő fordításhoz (https://www.caradvance.hu/_pl-missing/N.json)
  try {
    const dir = path.join(DIST, '_pl-missing'); fs.mkdirSync(dir, { recursive: true });
    const all = [...miss].filter(([k, m]) => m.l.has('pl') && !/^dovoz\/kalkulacka-/.test(m.p)).map(([k, m]) => ({ k, p: m.p, en: (m.raw && look1(D, 'en', m.raw)) || null, raw: m.raw !== k ? m.raw : undefined }));
    let cur = [], size = 0, n = 0; const flush = () => { if (!cur.length) return; n++; fs.writeFileSync(path.join(dir, n + '.json'), JSON.stringify(cur)); cur = []; size = 0; };
    for (const x of all) { cur.push(x); size += JSON.stringify(x).length; if (size > 20000) flush(); }
    flush(); fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ chunks: n, segments: all.length, built: new Date().toISOString() }));
  } catch (e) {}
  try { fs.writeFileSync(path.join(DIST, '_pl-missing.json'), JSON.stringify([...miss].sort((a, b) => b[1].n - a[1].n).map(([k, m]) => ({ k, n: m.n, l: [...m.l], p: m.p })))); } catch (e) {}
  const pct = (l) => (100 * stat[l][0] / Math.max(1, stat[l][1])).toFixed(1) + '%';
  return `[pl-site] ${written} oldal (${LANGS.map((l) => l + ' ' + pct(l)).join(' | ')}), hiányzó egység ${miss.size}, hibás fordítás ${bad}, runtime ${rtn}, ${PL.live ? 'ÉLES' : 'noindex'}`;
}

try { console.log(run()); } catch (e) { console.log('[pl-site] hiba: ' + (e && e.stack || e)); }
