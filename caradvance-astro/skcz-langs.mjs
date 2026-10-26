#!/usr/bin/env node
/**
 * caradvance.sk — angol, német és magyar nyelvű változat A SZLOVÁK OLDALBÓL fordítva (2026-10)
 * caradvance.cz — angol és német nyelvű változat A CSEH OLDALBÓL fordítva (dist/cs/en|de, nyelvváltó: Čeština · English · Deutsch)
 *
 * A kész szlovák oldalakból (dist/sk/**) elkészíti a dist/sk/en|de|hu/** változatot — a domainen:
 *   https://www.caradvance.sk/en/…, /de/…, /hu/…  (a tartalom a szlovák piacé: Mr. Job SK, szlovák DPH, € árak).
 * Fordítás: a szlovák szövegegységekhez
 *   1) a src/i18n/dict/sk.json fordított párja (szlovák → magyar eredeti) → magyar eredeti / en.json / de.json,
 *   2) a csak szlovák (a 2–3. fázisban átírt vagy új) szövegekhez a skcz-langs-data.mjs kézi fordításai
 *      (a modellnevek ⟨M1⟩ helyőrzővel, így egy mondat minden modellre jó).
 * Minden oldalon: <html lang>, canonical, og:url, og:locale, hreflang (en-SK, de-SK, hu-SK — a teljes
 * klaszterben, a magyar és cseh oldalakon is), belső linkek, nyelvváltó (Slovenčina · English · Deutsch · Magyar),
 * futásidejű fordító (i18n/rt-sk-<nyelv>.js), keresőindex, sitemap. 97% alatti lefedettségnél noindex.
 * Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize, visit, finishLd, maskNums, unmaskNums } from './i18n-core.mjs';
import { neutral } from './i18n-templates.mjs';
import { maskModels, unmaskModels, neutralL, maskModels2, normNums, phraseFix } from './skcz-langs-mask.mjs';
import { SKL } from './skcz-langs-data.mjs';
import { CSL } from './skcz-langs-data-cs.mjs';

const DIST = 'dist';
/* piaconként: caradvance.sk → szlovák + angol, német, magyar; caradvance.cz → cseh + angol, német */
const MARKETS = {
  sk: { site: 'https://www.caradvance.sk', langs: ['en', 'de', 'hu'], cc: 'SK', data: SKL, idx: { en: 0, de: 1, hu: 2 },
    sw: [['sk', 'Slovenčina', 'sk'], ['en', 'English', 'gb'], ['de', 'Deutsch', 'de'], ['hu', 'Magyar', 'hu']] },
  cs: { site: 'https://www.caradvance.cz', langs: ['en', 'de'], cc: 'CZ', data: CSL, idx: { en: 0, de: 1 },
    sw: [['cs', 'Čeština', 'cz'], ['en', 'English', 'gb'], ['de', 'Deutsch', 'de']] },
};
const OG = { en: 'en_GB', de: 'de_DE', hu: 'hu_HU' };
const MIN_COVER = 0.97;
const SKIP_TOP = /^(en|de|hu|_np)$/;
let MK, SK, SITE, LANGS, HL, IDX, SW, ML;

const sig = (s) => [...String(s).matchAll(/\{\d+\}|<\/?[gx]\d+\/?>|⟨M\d+⟩/g)].map((m) => m[0]).sort().join('|');

function dicts() {
  const sk = JSON.parse(fs.readFileSync(`src/i18n/dict/${ML}.json`, 'utf8'));
  const src = { en: JSON.parse(fs.readFileSync('src/i18n/dict/en.json', 'utf8')), de: JSON.parse(fs.readFileSync('src/i18n/dict/de.json', 'utf8')) };
  const D = { en: new Map(), de: new Map(), hu: new Map() };
  // a fordított szótár csak akkor jó, ha a szlovák/cseh szöveg nem lett a piachoz igazítva (pl. „na Slovensku” ↔ eredeti „Magyarországon”)
  const HUS = { en: /Hungar|Budapest|\bHUF\b|\bFt\b|forint/i, de: /Ungarn|ungarisch|Budapest|\bHUF\b|\bFt\b|Forint/i, hu: /Magyarorsz|magyar |magyarországi|Budapest|\bHUF\b|\bFt\b|forint|\bNAV\b|\bMÁV\b|\bKft\b/i };
  const SRC_HU = /Maďar|maďar|Hungar|Budapešť|Budapest|\bHUF\b|\bFt\b|forint|Magyar/;
  let rej = 0;
  for (const [hu, v] of Object.entries(sk)) {
    if (!v || D.hu.has(v)) continue;
    const huOk = SRC_HU.test(v) || !HUS.hu.test(hu);
    if (huOk) D.hu.set(v, hu); else rej++;
    for (const l of ['en', 'de']) if (src[l][hu]) { if (SRC_HU.test(v) || !HUS[l].test(src[l][hu])) D[l].set(v, src[l][hu]); else rej++; }
  }
  let bad = 0;
  for (const [k, arr] of Object.entries(MK.data)) {
    LANGS.forEach((l) => { const t = arr[IDX[l]]; if (!t) return; if (sig(t) !== sig(k)) { bad++; return; } D[l].set(k, t); });
  }
  return { D, bad, rej };
}


/* magyar nyelvtan a helyőrzős mondatokban: névelő (a → az magánhangzós modellnév előtt) és a számok utáni rag hangrendje (3-as, 5-ös, 6-os) */
const SUF = { 1: 'es', 2: 'es', 3: 'as', 4: 'es', 5: 'ös', 6: 'os', 7: 'es', 8: 'as', 9: 'es' };
const TENS = { 1: 'es', 2: 'as', 3: 'as', 4: 'es', 5: 'es', 6: 'as', 7: 'es', 8: 'as', 9: 'es' };
function sufOf(n) { const d = n.replace(/\D/g, ''); if (!d) return null; const last = d.slice(-1); if (last !== '0') return SUF[last]; if (/000$/.test(d)) return 'es'; if (/00$/.test(d)) return 'as'; return TENS[d.slice(-2, -1)] || 'es'; }
function huPost(h) {
  return h.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/i).map((part, i) => (i % 2 ? part : part
    .replace(/(^|[\s>(„"])([Aa]) (Audi|IONIQ|Ioniq)\b/g, (m, p, a, b) => p + a + 'z ' + b)
    .replace(/(\d[\d   ]*)-(es|as|os|ös)(?![\p{L}])/gu, (m, n, s) => { const x = sufOf(n); return x ? n + '-' + x : m; }))).join('');
}

/* "Mercedes-Benz Trieda E" / "třídy C" (szlovák/cseh szó a modellnévben) → E-Class / E-Klasse / E-osztály */
const CLS = { en: '$2-Class', de: '$2-Klasse', hu: '$2-osztály' };
function classFix(h, l) {
  const re = /(?<![\p{L}])(?:[Tt]ried(?:a|y|e|u|ou)|[Tt]říd(?:a|y|ě|u|ou)) ([A-Z]{1,3})(?![\p{L}\p{N}])/gu;
  return h.split(/(<script\b(?![^>]*ld\+json)[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/i).map((part, i) => (i % 2 ? part : part.replace(re, CLS[l].replace('$2', '$1')))).join('');
}

function lookup(D, l, k) {
  let t = D[l].get(k);
  if (t != null && sig(t) === sig(k)) return t;
  const { km, ms } = maskModels(k);
  if (km !== k) { t = D[l].get(km); if (t != null && sig(t) === sig(km)) return unmaskModels(t, ms); }
  if (neutralL(k)) return k;
  // számozás-független és bővített modellmaszkos keresés
  for (const mm of [maskModels(k), maskModels2(k)]) {
    const n = normNums(mm.km); const D2 = d2(D, l); const t2 = D2.get(n.kn);
    if (t2 == null) continue;
    const back = t2.replace(/\{(\d+)\}/g, (m, j) => (n.map[+j - 1] !== undefined ? '{' + n.map[+j - 1] + '}' : m));
    if (sig(back) !== sig(mm.km)) continue;
    return phraseFix(unmaskModels(back, mm.ms), l);
  }
  return null;
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

function pages(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!(rel === '' && SKIP_TOP.test(e.name))) out.push(...pages(path.join(dir, e.name), rel + e.name + '/')); }
    else if (e.name === 'index.html') out.push(rel);
  }
  return out;
}

/* nyelvváltó: csak a szlovák oldal nyelvei */
function switcher(h, cur, p) {
  const href = (c) => '/' + ML + (c === ML ? '' : '/' + c) + p;
  const opts = (cls) => SW.map(([c, name, flag]) => `<a hreflang="${c === ML ? ML : HL[c]}" class="${cls}" href="${href(c)}"${c === cur ? ' aria-current="true"' : ''}><span class="lf" style="background-image:url(https://flagcdn.com/w80/${flag}.png)"></span><span>${name}</span></a>`).join('');
  for (const cls of ['langopt', 'm-langopt']) {
    const re = new RegExp(`(?:<a hreflang="[^"]+" class="${cls}"[^>]*>[\\s\\S]*?<\\/a>)+`, 'g');
    let done = false;
    h = h.replace(re, () => { if (done) return ''; done = true; return opts(cls); });
  }
  const flag = SW.find((x) => x[0] === cur)[2];
  h = h.replace(/(class="navflag" style="background-image:url\(https:\/\/flagcdn\.com\/w80\/)[a-z]+(\.png\))/g, `$1${flag}$2`);
  return h;
}

function run(ml) {
  ML = ml; MK = MARKETS[ml]; SK = path.join(DIST, ml); SITE = MK.site; LANGS = MK.langs; IDX = MK.idx; SW = MK.sw;
  HL = Object.fromEntries(LANGS.map((l) => [l, l + '-' + MK.cc]));
  if (!fs.existsSync(SK)) return 'nincs dist/' + ml;
  const { D, bad } = dicts();
  const list = pages(SK);
  const ok = Object.fromEntries(LANGS.map((l) => [l, new Set()]));
  const miss = new Map();
  const stat = Object.fromEntries(LANGS.map((l) => [l, [0, 0]]));
  const out = {};
  const pathOf = (rel) => '/' + rel;           // 'prenajom/bmw-x3/' → '/prenajom/bmw-x3/'
  const exists = new Set(list.map(pathOf));

  // 0) JSON-LD: a caradvance.hu oldal-URL-ek (url, @id) a saját domain megfelelő oldalára (a _slugs.json alapján)
  try {
    const slugs = JSON.parse(fs.readFileSync(path.join(SK, '_slugs.json'), 'utf8'));
    for (const rel of list) {
      const f = path.join(SK, rel, 'index.html'); const h0 = fs.readFileSync(f, 'utf8');
      const h1 = h0.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, a, js, b) => a + js.replace(/"(url|@id|item)":"https:\/\/www\.caradvance\.hu(\/[^"#?]*)?(#[^"]*)?"/g, (m, k, p0, hash) => {
        const p1 = p0 || '/';
        if (/\.[a-z0-9]{2,5}$/i.test(p1)) return m;
        const q = slugs[p1] || (exists.has(p1) ? p1 : (p1 === '/' ? '/' : null));
        return q ? `"${k}":"${SITE}${q}${hash || ''}"` : m;
      }) + b);
      if (h1 !== h0) fs.writeFileSync(f, h1);
    }
  } catch (e) {}

  // 1) fordítás
  for (const rel of list) {
    const src = fs.readFileSync(path.join(SK, rel, 'index.html'), 'utf8');
    if (/http-equiv=["']?refresh/i.test(src)) continue;
    for (const l of LANGS) {
      const doc = parse(src);
      let hit = 0, tot = 0;
      visit(doc, (kind, k, apply) => {
        tot++;
        const t = /English<\/g\d+>[\s\S]*Deutsch<\/g\d+>/.test(k) ? k : lookup(D, l, k); // a nyelvválasztó listát a switcher() cseréli
        if (t != null) { hit++; if (t !== k) { try { apply(t); } catch (e) {} } }
        else { const { km } = maskModels(k); const m = miss.get(km) || { n: 0, l: new Set(), p: rel }; m.n++; m.l.add(l); miss.set(km, m); }
      });
      finishLd(doc);
      const cover = tot ? hit / tot : 1;
      stat[l][0] += hit; stat[l][1] += tot;
      out[l + '|' + rel] = { h: serialize(doc), cover };
      if (cover >= MIN_COVER) ok[l].add(pathOf(rel));
    }
  }

  // 2) oldal-szintű csere és kiírás
  const siteRe = SITE.replace(/[.\/]/g, '\\$&');
  const ldUrl = (s, l) => s.replace(new RegExp(siteRe + '(\\/[^"\\\\\\s]*)', 'g'), (m, p) => {
    const q = p.split(/[?#]/)[0]; const n = q.endsWith('/') ? q : q + '/';
    return exists.has(n) ? SITE + '/' + l + p : m;
  });
  let written = 0;
  for (const rel of list) {
    const p = pathOf(rel);
    for (const l of LANGS) {
      const o = out[l + '|' + rel]; if (!o) continue;
      let h = o.h;
      h = h.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${l}"`);
      h = h.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${SITE}/${l}${p}">`);
      h = h.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${SITE}/${l}${p}">`);
      h = h.replace(/<meta property="og:locale" content="[^"]*">/i, `<meta property="og:locale" content="${OG[l]}">`);
      // belső linkek: /sk/… → /sk/<nyelv>/… (ha az oldal ezen a nyelven is megvan)
      h = h.replace(new RegExp('(\\s(?:href|action)=")\\/' + ML + '(\\/[^"]*)"', 'g'), (m, pre, q) => {
        const base = q.split(/[?#]/)[0]; const n = base.endsWith('/') ? base : base + '/';
        if (/\.[a-z0-9]{2,5}$/i.test(base) || !exists.has(n)) return m;
        return `${pre}/${ML}/${l}${q}"`;
      });
      // JSON-LD: az oldal(ak) címe a nyelvi változatra
      h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, a, js, b) => a + ldUrl(js, l) + b);
      // futásidejű fordító + keresőindex
      h = h.split(`/i18n/rt-${ML}.js`).join(`/i18n/rt-${ML}-${l}.js`);
      h = h.split(`data-idx="/${ML}/kereses-index.json" data-lang="${ML}"`).join(`data-idx="/${ML}/${l}/kereses-index.json" data-lang="${l}"`);
      h = switcher(h, l, p);
      // <option> szövegek (a select tartalmát a visit nem járja be)
      h = h.split(/(<script\b[\s\S]*?<\/script>)/i).map((part, pi) => (pi % 2 ? part : part.replace(/(<option\b[^>]*>)([^<]*\p{L}[^<]*)(<\/option>)/gu, (m, a, txt, b) => {
        const lead = txt.match(/^\s*/)[0], trail = txt.match(/\s*$/)[0];
        const { k, nums } = maskNums(txt.trim().replace(/\s+/g, ' '));
        const t = lookup(D, l, k);
        if (t == null) { const { km } = maskModels(k); const mm = miss.get(km) || { n: 0, l: new Set(), p: rel }; mm.n++; mm.l.add(l); miss.set(km, mm); return m; }
        return a + lead + unmaskNums(t, nums) + trail + b;
      }))).join('');
      // beágyazott szkriptek szöveg-literáljai (a P3 szabályok által szlovákra/csehre írt mondatok)
      // HTML-sablonok a szkriptekben (hosszú sztringek): a címkék közti szlovák/cseh szövegek; az idézőjelek tipográfiaiak, hogy a JS-sztring ne törjön
      h = h.replace(/(<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>)([\s\S]*?)(<\/script>)/gi, (all, a, js, b) => a + js.replace(/>([^<>\n'"`\\{}]*\p{L}[^<>\n'"`\\{}]*)</gu, (mm, txt) => {
        const lead = txt.match(/^\s*/)[0], trail = txt.match(/\s*$/)[0];
        const { k, nums } = maskNums(txt.trim().replace(/\s+/g, ' '));
        if (!k || !/ /.test(k)) return mm;
        const t = lookup(D, l, k);
        if (t == null || t === k) {
          if (t == null && /[äčďĺľňôŕšťžěřů]/i.test(k) && !/[őűöü]|ß/i.test(k) && (ML === 'cs' ? !/[ľĺŕôä]/.test(k) : !/[ěřů]/.test(k))) { const { km } = maskModels(k); const ms = miss.get(km) || { n: 0, l: new Set(), p: rel }; ms.n++; ms.l.add(l); miss.set(km, ms); }
          return mm;
        }
        return '>' + lead + unmaskNums(t, nums).replace(/'/g, '’').replace(/"([^"]*)"/g, '“$1”').replace(/"/g, '”') + trail + '<';
      }) + b);
      h = h.replace(/(<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>)([\s\S]*?)(<\/script>)/gi, (all, a, js, b) => a + js.replace(/(['"])((?:(?!\1)[^\\\n]|\\.){3,300}?)\1/g, (m, q, str) => {
        if (/<[a-z\/]/i.test(str) && !/[{}]|\\u/.test(str)) {
          // HTML-sablon a szkriptben: a címkék közti szövegek fordítása
          const o2 = str.replace(/>([^<>]*\p{L}[^<>]*)</gu, (mm, txt) => {
            const lead = txt.match(/^\s*/)[0], trail = txt.match(/\s*$/)[0];
            const { k, nums } = maskNums(txt.trim().replace(/\s+/g, ' '));
            const t = k ? lookup(D, l, k) : null;
            if (t == null || t === k) {
              if (t == null && / /.test(k) && /[äčďĺľňôŕšťžěřů]/i.test(k) && !/[őűöü]|ß/i.test(k)) { const { km } = maskModels(k); const ms = miss.get(km) || { n: 0, l: new Set(), p: rel }; ms.n++; ms.l.add(l); miss.set(km, ms); }
              return mm;
            }
            return '>' + lead + unmaskNums(t, nums).split(q).join('\\' + q) + trail + '<';
          });
          return q + o2 + q;
        }
        if (!/\p{L}{2,}/u.test(str) || /[{}<>]|\\u|^[\w.$#/-]+$/.test(str)) return m;
        const lead = str.match(/^\s*/)[0], trail = str.match(/\s*$/)[0];
        const { k, nums } = maskNums(str.trim().replace(/\s+/g, ' '));
        if (!k) return m;
        const t = lookup(D, l, k);
        if (t == null || t === k) {
          if (t == null && / /.test(k) && /[äčďĺľňôŕšťžěřů]/i.test(k) && !/[őűöü]|ß/i.test(k) && !/\b(?:Wir|Sie|und|der|die|das|Bitte)\b/.test(k) && (ML === 'cs' ? !/[ľĺŕôä]/.test(k) : !/[ěřů]/.test(k))) { const { km } = maskModels(k); const mm = miss.get(km) || { n: 0, l: new Set(), p: rel }; mm.n++; mm.l.add(l); miss.set(km, mm); }
          return m;
        }
        const out = (lead + unmaskNums(t, nums) + trail).replace(/\\/g, '\\\\').split(q).join('\\' + q);
        return q + out + q;
      }) + b);
      h = classFix(h, l);
      if (l === 'hu') h = huPost(h);
      h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, (m) => (/noindex/i.test(m) ? m : ''));
      if (o.cover < MIN_COVER && !/<meta\s+name=["']robots["'][^>]*noindex/i.test(h)) h = h.replace(/<\/head>/i, '<meta name="robots" content="noindex,follow">\n</head>');
      if (/<meta\s+name=["']robots["'][^>]*noindex/i.test(h)) ok[l].delete(p);
      const f = path.join(SK, l, rel, 'index.html');
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, h); written++;
    }
    // a szlovák oldal nyelvváltója
    const sf = path.join(SK, rel, 'index.html');
    const sh = fs.readFileSync(sf, 'utf8'); const nh = switcher(sh, ML, p);
    if (nh !== sh) fs.writeFileSync(sf, nh);
  }

  // 3) hreflang en-SK / de-SK / hu-SK a teljes klaszterben (minden oldalon, amelyiknek van szlovák párja)
  let hl = 0;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { walk(f); continue; }
      if (!e.name.endsWith('.html')) continue;
      const h = fs.readFileSync(f, 'utf8');
      const m = h.match(new RegExp(`<link rel="alternate" hreflang="${ML}" href="${siteRe}(\\/[^"]*)">`));
      if (!m) continue;
      const p = m[1];
      const clean = h.replace(new RegExp(`[ \\t]*<link rel="alternate" hreflang="(?:en|de|hu)-${MK.cc}" href="[^"]*">\\s*\\n?`, 'g'), '');
      const add = LANGS.filter((l) => ok[l].has(p)).map((l) => `\n<link rel="alternate" hreflang="${HL[l]}" href="${SITE}/${l}${p}">`).join('');
      const n = clean.replace(m[0], m[0] + add);
      if (n !== h) { fs.writeFileSync(f, n); hl++; }
    }
  })(DIST);

  // 4) sitemap
  const smf = path.join(SK, 'sitemap.xml');
  if (fs.existsSync(smf)) {
    const now = new Date().toISOString().slice(0, 10);
    let sm = fs.readFileSync(smf, 'utf8').replace(new RegExp(`\\s*<url><loc>${siteRe}\\/(?:en|de|hu)\\/[^<]*<\\/loc>(?:<lastmod>[^<]*<\\/lastmod>)?<\\/url>`, 'g'), '');
    const add = LANGS.flatMap((l) => [...ok[l]].sort().map((p) => `  <url><loc>${SITE}/${l}${p}</loc><lastmod>${now}</lastmod></url>`)).join('\n');
    sm = sm.replace('</urlset>', add + '\n</urlset>');
    fs.writeFileSync(smf, sm);
  }

  // 5) futásidejű fordító: rt-<nyelv>.js szótára + a szlovák oldal útvonalai és árátváltása
  const rtSk = fs.existsSync(path.join(DIST, 'i18n', `rt-${ML}.js`)) ? fs.readFileSync(path.join(DIST, 'i18n', `rt-${ML}.js`), 'utf8') : '';
  const part = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); return i < 0 || j < 0 ? null : [i, j]; };
  if (rtSk) {
    const slR = part(rtSk, 'var SL=', 'var M='), pgR = part(rtSk, 'var PG=', 'var SL='), exR = part(rtSk, 'var CUR=null,DOMSTRIP=null;', 'var UNITS=');
    for (const l of LANGS) {
      let base = l === 'hu' ? rtSk.replace(`var LG="${ML}"`, 'var LG="hu"') : (fs.existsSync(path.join(DIST, 'i18n', `rt-${l}.js`)) ? fs.readFileSync(path.join(DIST, 'i18n', `rt-${l}.js`), 'utf8') : null);
      if (!base || !slR || !pgR || !exR) continue;
      if (l === 'hu') {
        const mR = part(base, 'var M=', 'var GN='); if (mR) base = base.slice(0, mR[0]) + 'var M={};var G={};' + base.slice(mR[1]);
        const pR = part(base, 'var P=', 'var CUR=null'); if (pR) base = base.slice(0, pR[0]) + 'var P=[];' + base.slice(pR[1]);
        base = base.replace('var UNITS={', 'var UNITS={hu:{m:"/hó",f:"-tól"},');
      }
      const sl = rtSk.slice(slR[0], slR[1]).replace(new RegExp(`"\\/${ML}(\\/[^"]*)"`, 'g'), (m, q) => (exists.has(q.split(/[?#]/)[0]) ? `"/${ML}/${l}${q}"` : m));
      const b1 = part(base, 'var SL=', 'var M='); if (b1) base = base.slice(0, b1[0]) + sl + base.slice(b1[1]);
      const b2 = part(base, 'var PG=', 'var SL='); if (b2) base = base.slice(0, b2[0]) + rtSk.slice(pgR[0], pgR[1]) + base.slice(b2[1]);
      const b3 = part(base, 'var CUR=null,DOMSTRIP=null;', 'var UNITS='); if (b3) base = base.slice(0, b3[0]) + rtSk.slice(exR[0], exR[1]) + base.slice(b3[1]);
      fs.writeFileSync(path.join(DIST, 'i18n', `rt-${ML}-${l}.js`), base.replace(/^\/\* CarAdvance i18n runtime \([a-z]+\) \*\//, `/* CarAdvance i18n runtime (${SITE.replace('https://www.', '')}, ${l}) */`));
    }
  }

  // 6) keresőindex nyelvenként
  const idxf = path.join(SK, 'kereses-index.json');
  if (fs.existsSync(idxf)) {
    const base = JSON.parse(fs.readFileSync(idxf, 'utf8'));
    const NUM = /\d+(?:[.,   ]\d+)*/g;
    const trs = (l, s) => { if (!s) return s; const nums = []; const k = String(s).replace(/\s+/g, ' ').trim().replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; }); const t = lookup(D, l, k); return t == null ? s : t.replace(/\{(\d+)\}/g, (m, i) => (nums[+i - 1] !== undefined ? nums[+i - 1] : m)); };
    for (const l of LANGS) {
      const d = JSON.parse(JSON.stringify(base)); d.lang = l;
      const pre = '/' + ML + '/';
      d.items = d.items.filter((x) => ok[l].has(String(x.u || '').replace('/' + ML, '').split(/[?#]/)[0]) || !String(x.u || '').startsWith(pre)).map((x) => {
        for (const k of ['t', 'd', 'h']) if (x[k]) x[k] = trs(l, x[k]);
        if (x.x) x.x = String(x.x).split(' · ').map((s) => trs(l, s)).join(' · ');
        if (String(x.u || '').startsWith(pre)) x.u = pre + l + String(x.u).slice(pre.length - 1);
        return x;
      });
      fs.mkdirSync(path.join(SK, l), { recursive: true });
      fs.writeFileSync(path.join(SK, l, 'kereses-index.json'), JSON.stringify(d));
    }
  }

  // 7) _routes.json: a /hu/* is a middleware-en menjen (a .sk domainen a dist/sk/hu-ból szolgáljuk ki)
  try {
    const rp = path.join(DIST, '_routes.json'); const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    for (const x of ['/en/*', '/de/*', '/hu/*']) if (!r.include.includes(x)) r.include.push(x);
    if (r.include.length + (r.exclude || []).length <= 100) fs.writeFileSync(rp, JSON.stringify(r, null, 2));
  } catch (e) {}

  // hiányzó fordítások listája (a következő kézi fordításhoz)
  try { fs.writeFileSync(path.join(DIST, `_skl-missing-${ML}.json`), JSON.stringify([...miss].sort((a, b) => b[1].n - a[1].n).map(([k, m]) => ({ k, n: m.n, l: [...m.l], p: m.p })))); } catch (e) {}
  const pct = (l) => (100 * stat[l][0] / Math.max(1, stat[l][1])).toFixed(1) + '%';
  return `[skcz-langs ${ML}] ${written} oldal (${LANGS.map((l) => l + ' ' + pct(l) + ', indexelve ' + ok[l].size).join(' | ')}), hiányzó egység ${miss.size}, hibás kézi fordítás ${bad}, hreflang ${hl} fájlban`;
}

for (const ml of Object.keys(MARKETS)) { try { console.log(run(ml)); } catch (e) { console.log(`[skcz-langs ${ml}] hiba: ` + (e && e.stack || e)); } }
