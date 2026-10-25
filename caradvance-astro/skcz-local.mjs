/**
 * CarAdvance — caradvance.sk / caradvance.cz helyi tartalom (a build legutolsó lépése)
 *
 * A szlovák és cseh oldal a magyar oldal tükre (i18n-mirror.mjs). Ott NINCS bizományos értékesítés és
 * jótékonysági program (Mr. JOB SK kérése, 2026-10-23), ezért ez a lépés a dist/sk és dist/cs alatt:
 *   1. törli a bizományos / jótékonysági oldalakat és a bizományos blogcikket,
 *      a régi címeket a _slugs.json-ban a főoldalra irányítja (a middleware 301-et ad);
 *   2. kiveszi a menüpontot (asztali + mobil), a lábléc linkjeit, a főoldali blokkokat, a GYIK-elemeket,
 *      a Rólunk oldal pontjait, a blog csempéjét, az ÁSZF-fejezetet és az adatkezelési célt;
 *   3. javítja a szlogent, a meta leírásokat és a JSON-LD adatokat;
 *   4. kiveszi a hasznaltauto.hu linkeket, a láblécbe linket tesz a többi CarAdvance oldalra;
 *   5. a keresőindexből (kereses-index*.json) kiveszi a törölt oldalakat.
 * A magyar (és en/de/fr/uk/zh) oldalakhoz nem nyúl.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';

const CFG = {
  sk: {
    seg: ['komisny-predaj', 'blog/komisionalny-predaj-auta'],
    hu: ['/bizomanyos/', '/bizomanyos-auto/', '/eladom/', '/jotekonysag/', '/ertekesitesi-folyamat/', '/gyakori-kerdesek/', '/blog/bizomanyos-auto-ertekesites/'],
    kw: /komision[áa]ln|komision[áa]rsk|komisn[ýyé]|charit/i,
    other: [['https://www.caradvance.hu/', 'CarAdvance Maďarsko', 'hu'], ['https://www.caradvance.cz/', 'CarAdvance Česko', 'cs']],
    otherH: 'CarAdvance v regióne',
    colRe: /<div><h4>(?:Predaj a naša spoločnosť|Naša spoločnosť)<\/h4>/,
    colH: 'Naša spoločnosť',
    rep: [
      [' — a vaše auto predáme komisionálne.', '.'],
      [', dovoz a komisionálny predaj', ' a dovoz'],
      [', financovanie a komisionálny predaj prémiových áut', ' a financovanie prémiových áut'],
      [', lízing auta a komisionálny predaj', ' a lízing auta'],
      [', lízing a komisionálny predaj', ' a lízing'],
      [', lízingu a komisionálnom predaji', ' a lízingu'],
      [', financovanie a komisionálny predaj na jednom mieste', ' a financovanie na jednom mieste'],
      ['Nákup, objednávka, financovanie, komisionálny predaj — na jednom mieste', 'Nákup, objednávka, financovanie — na jednom mieste'],
      [/, ako aj <strong[^>]*>komisionálny predaj áut<\/strong>: odstupňovanú províziu platíte až po úspešnom predaji\./g, '.'],
      [/ a vaše súčasné auto za vás predáme <strong[^>]*>komisionálnym predajom<\/strong>/g, ''],
      ['Prenájom, nákup, dovoz, financovanie a komisionálny predaj na jednom mieste.', 'Prenájom, nákup, dovoz a financovanie na jednom mieste.'],
      ['Prenájom, nákup, dovoz z Nemecka alebo komisionálny predaj', 'Prenájom, nákup alebo dovoz z Nemecka'],
      [', predajom prémiových ojazdených áut, dovozom áut a komisionálnym predajom', ', predajom prémiových ojazdených áut a dovozom áut'],
      [', dovoz z Nemecka, financovanie/lízing a komisionálny predaj', ', dovoz z Nemecka a financovanie/lízing'],
      ['prenajaté, predané, komisionálne a z Nemecka dovezené', 'prenajaté, predané a z Nemecka dovezené'],
      ['prenajaté, predané, komisionálne a dovezené', 'prenajaté, predané a dovezené'],
      [/;<\/li>\s*<li>komisionálny predaj áut zákazníkov\.<\/li>/g, '.</li>'],
      ['kúpnych, nájomných a komisionárskych zmlúv', 'kúpnych a nájomných zmlúv'],
      [' (prenájom, kúpa, komisia)', ' (prenájom, kúpa)'],
      [/, (<a [^>]*>[^<]*<\/a>) alebo <a href="[^"]*komisionalny-predaj-auta\/">[^<]*<\/a>/g, ' alebo $1']
    ]
  },
  cs: {
    seg: ['komisni-prodej', 'blog/komisni-prodej-auta'],
    hu: ['/bizomanyos/', '/bizomanyos-auto/', '/eladom/', '/jotekonysag/', '/ertekesitesi-folyamat/', '/gyakori-kerdesek/', '/blog/bizomanyos-auto-ertekesites/'],
    kw: /komisn[íiě]|komisionářsk|charit/i,
    other: [['https://www.caradvance.hu/', 'CarAdvance Maďarsko', 'hu'], ['https://www.caradvance.sk/', 'CarAdvance Slovensko', 'sk']],
    otherH: 'CarAdvance v regionu',
    colRe: /<div><h4>(?:Prodej a naše společnost|Naše společnost)<\/h4>/,
    colH: 'Naše společnost',
    rep: [
      [' — a váš vůz prodáme v komisi.', '.'],
      [', dovoz a komisní prodej', ' a dovoz'],
      [', financování a komisní prodej prémiových vozů', ' a financování prémiových vozů'],
      [', leasing aut a komisní prodej', ' a leasing aut'],
      [', leasing a komisní prodej', ' a leasing'],
      [', leasingu a komisním prodeji', ' a leasingu'],
      [', financování a komisní prodej na jednom místě', ' a financování na jednom místě'],
      ['Nákup, objednávka, financování, komisní prodej — na jednom místě', 'Nákup, objednávka, financování — na jednom místě'],
      ['prodejem prémiových ojetých vozů, dovozem aut a komisním prodejem', 'prodejem prémiových ojetých vozů a dovozem aut'],
      ['pronajaté, prodané, komisně prodávané a z Německa dovezené', 'pronajaté, prodané a z Německa dovezené'],
      ['pronajaté, prodané, komisně prodávané a dovezené', 'pronajaté, prodané a dovezené'],
      [/;<\/li>\s*<li>komisní prodej vozů zákazníků\.<\/li>/g, '.</li>'],
      ['kupních, nájemních a komisních smluv', 'kupních a nájemních smluv'],
      [/ i <strong[^>]*>komisní prodej vozu<\/strong>: pásmovou provizi platíte až po úspěšném prodeji\./g, '.'],
      [/ a váš stávající vůz za vás prodáme <strong[^>]*>v komisním prodeji<\/strong>/g, ''],
      [' (pronájem, koupě, komise)', ' (pronájem, koupě)'],
      [/, (<a [^>]*>[^<]*<\/a>), nebo <a href="[^"]*komisni-prodej-auta\/">[^<]*<\/a>/g, ' nebo $1'],
      ['Pronájem, nákup, dovoz z Německa nebo komisní prodej', 'Pronájem, nákup nebo dovoz z Německa'],
      ['Pronájem, nákup, dovoz, financování a komisní prodej na jednom místě.', 'Pronájem, nákup, dovoz a financování na jednom místě.'],
      [', dovoz z Německa, financování/leasing a komisní prodej', ', dovoz z Německa a financování/leasing']
    ]
  }
};

/* ---------- HTML-segédek ---------- */
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
/** Az s[i]-n kezdődő nyitótag elemének vége (a záró tag utáni index). */
function elEnd(s, i) {
  const m = /^<([a-z][a-z0-9-]*)\b[^>]*?(\/?)>/i.exec(s.slice(i, i + 4000));
  if (!m) return -1;
  const tag = m[1].toLowerCase();
  if (VOID.test(tag) || m[2] === '/') return i + m[0].length;
  const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
  re.lastIndex = i + m[0].length;
  let depth = 1, x;
  while ((x = re.exec(s))) {
    if (x[1]) { if (--depth === 0) return x.index + x[0].length; }
    else if (!/\/>$/.test(x[0])) depth++;
  }
  return -1;
}
/** Minden olyan elem törlése, amelynek nyitótagja illeszkedik az openRe-re és (ha van) a pred igaz rá. */
function drop(s, openRe, pred) {
  const re = new RegExp(openRe.source, openRe.flags.includes('g') ? openRe.flags : openRe.flags + 'g');
  let out = s, pos = 0, n = 0, m;
  for (;;) {
    re.lastIndex = pos;
    m = re.exec(out);
    if (!m) break;
    const end = elEnd(out, m.index);
    if (end < 0) { pos = m.index + 1; continue; }
    const el = out.slice(m.index, end);
    if (!pred || pred(el)) { out = out.slice(0, m.index) + out.slice(end); pos = m.index; n++; }
    else pos = m.index + m[0].length;
  }
  return [out, n];
}
const strip = (h) => h.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');

/* ---------- JSON-LD ---------- */
function fixLd(obj, C, rmUrl) {
  const bad = (o) => {
    if (!o || typeof o !== 'object') return false;
    const t = o['@type'];
    const txt = JSON.stringify(o);
    if (t === 'Question' || t === 'HowToStep' || t === 'ListItem') return C.kw.test(String(o.name || '')) || C.kw.test(JSON.stringify(o.acceptedAnswer || ''));
    if (t === 'Offer') return C.kw.test(txt) || /bizomanyos|eladom|jotekonysag/.test(txt);
    if (t === 'BlogPosting') return /bizomanyos-auto-ertekesites/.test(String(o.url || '')) || rmUrl(String(o.url || '')) || C.kw.test(String(o.articleSection || ''));
    if (t === 'NGO') return true;
    return false;
  };
  const walk = (v) => {
    if (Array.isArray(v)) {
      const a = v.filter((x) => !bad(x)).map(walk).filter((x) => !(typeof x === 'string' && /hasznaltauto\.hu/.test(x)));
      if (a.length && a.every((x) => x && typeof x === 'object' && x['@type'] === 'ListItem' && 'position' in x)) a.forEach((x, i) => { x.position = i + 1; });
      return a;
    }
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = walk(v[k]); return v; }
    if (typeof v === 'string') return rep(v, C);
    return v;
  };
  return walk(obj);
}
function rep(s, C) {
  for (const [a, b] of C.rep) s = typeof a === 'string' ? s.split(a).join(b) : s.replace(a, b);
  return s;
}

/* ---------- oldalankénti tisztítás ---------- */
function cleanHtml(h, l, C, rel) {
  const segAlt = C.seg.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const LINK = new RegExp('href="(?:https://www\\.caradvance\\.(?:sk|cz|hu))?(?:/' + l + ')?/(?:' + segAlt + ')/[^"]*"');
  const has = (el) => LINK.test(el);
  const kwEl = (el) => C.kw.test(strip(el));
  const st = {};
  { const parts0 = h.split(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)/); h = parts0.map((p, i) => (i % 2 ? p : rep(p, C))).join(''); }
  const D = (name, re, pred) => { const r = drop(h, re, pred); h = r[0]; if (r[1]) st[name] = (st[name] || 0) + r[1]; };

  // menü (asztali + mobil)
  D('nav', /<li class="navitem">/, has);
  D('m-acc', /<div class="m-acc">/, has);
  // főoldal
  D('svc', /<div class="card svc charity-accent[^"]*">/);
  if (st.svc) h = h.replace('</head>', '<style>@media(min-width:1100px){.cah .svc-grid{grid-template-columns:repeat(3,1fr)}}@media(min-width:961px) and (max-width:1099.98px){.cah .svc-grid>.svc:last-child:nth-child(odd){grid-column:1/-1}}</style></head>');
  D('charity-sec', /<section[^>]*id="jotekonysag-blokk"[^>]*>/);
  D('tab', /<button class="autok-tab"[^>]*data-tab="bizomanyos"[^>]*>/);
  D('panel', /<div class="autok-panel[^"]*" id="panel-bizomanyos"[^>]*>/);
  D('value', /<div class="card value[^"]*">/, kwEl);
  D('mailto', /<a\b[^>]*href="mailto:[^"]*"[^>]*>/, (el) => { try { return C.kw.test(decodeURIComponent(el.split('"mailto:')[1].split('"')[0])); } catch (e) { return false; } });
  D('btn-charity', /<a class="btn btn-outline" href="#jotekonysag">/);
  // GYIK-elemek (oldal + Rólunk)
  D('faq', /<details\b[^>]*>/, kwEl);
  // Rólunk: statisztika, cikk-cikk blokk
  D('stat', /<div class="mm-stat(?: [^"]*)?"[^>]*>/, kwEl);
  D('zz', /<div class="zz[" ][^>]*>/, (el) => /dobrý skutok|dobrý skutek|charit/i.test(strip(el)) && !/Nákup, objednávka/.test(el));
  // Referenciák: bizományos autók sora
  D('ref-biz', /<section class="section ref-carsec"[^>]*>/, (el) => /id="row-biz"/.test(el));
  // blog: csempe és kártya
  D('blog-cat', /<a\b[^>]*class="bl-cat[" ][^>]*>/, (el) => has(el) || kwEl(el) || /bizomanyos/.test(el));
  D('blog-card', /<a\b[^>]*class="bl-card"[^>]*>/, (el) => has(el) || /data-cat="bizomanyos"/.test(el));
  D('blog-catbtn', /<button\b[^>]*data-cat="bizomanyos"[^>]*>/);
  // szövegek: bekezdés / listaelem / táblázatsor, amely bizományról vagy jótékonyságról szól
  D('p', /<p\b[^>]*>/, (el) => kwEl(el) && !/cafoot|Európskej komisie|Evropské komise/.test(el) && strip(el).length < 1200);
  D('li', /<li\b[^>]*>/, (el) => kwEl(el) && !/<li\b[^>]*>[\s\S]*<li\b/.test(el.slice(3)));
  D('tr', /<tr\b[^>]*>/, kwEl);
  // ÁSZF: a bizományos fejezet (címtől a következő h2-ig)
  h = h.replace(/<h2 id="bizomany">[\s\S]*?(?=<h2\b)/, () => { st.aszf = 1; return ''; });
  if (st.aszf) h = h.replace(/(<h2 id="[a-z]+">)(\d+)\./g, (a, b, n) => b + (+n >= 10 ? +n - 1 : +n) + '.');
  // maradék linkek a törölt oldalakra: a gombok / menülinkek mennek, a szövegközi linkek szövege marad
  h = h.replace(new RegExp('<a\\b[^>]*' + LINK.source + '[^>]*>([\\s\\S]*?)</a>', 'g'), (a, inner) => {
    st.link = (st.link || 0) + 1;
    return /class="[^"]*(ddi|btn|chip|cta|card|b-red|zz-link|langopt)/.test(a) || /<h4>|^\s*[^<]{0,40}\s*$/.test(inner) && !/class=/.test(a) ? '' : inner;
  });
  // hasznaltauto.hu (lábléc ikon, platform-logó)
  D('hu-link', /<a\b[^>]*href="https:\/\/www\.hasznaltauto\.hu[^"]*"[^>]*>/);
  D('hu-plat', /<span class="plat plat-huhu">/);
  // szöveges cserék (meta, szlogen, leírások) — a JSON-LD-t külön kezeljük
  h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, a, js, b) => {
    try {
      const o = fixLd(JSON.parse(js), C, (u) => LINK.test('href="' + u + '"'));
      return a + JSON.stringify(o).replace(/<\//g, '<\\/') + b;
    } catch (e) { return all; }
  });
  // lábléc: linkek a többi CarAdvance oldalra (egyszer)
  // (a „Predaj a naša spoločnosť” oszlopba kerül, így a lábléc marad 4 oszlopos; a „Predaj” szó kimarad a címből)
  if (!/data-ca-other/.test(h)) {
    const cm = C.colRe.exec(h);
    if (cm) {
      const end = elEnd(h, cm.index);
      if (end > 0) {
        const col = h.slice(cm.index, end).replace(C.colRe, '<div><h4>' + C.colH + '</h4>');
        const add = '<h4 data-ca-other="" style="margin-top:26px">' + C.otherH + '</h4>' + C.other.map(([u, t, hl]) => '<a href="' + u + '" hreflang="' + hl + '">' + t + '</a>').join('');
        h = h.slice(0, cm.index) + col.replace(/<\/div>$/, add + '</div>') + h.slice(end);
        st.other = 1;
      }
    }
  }
  return [h, st];
}

/* ---------- futtatás ---------- */
export function run(dist = DIST) {
  const out = [];
  for (const l of Object.keys(CFG)) {
    const C = CFG[l];
    for (const base of [path.join(dist, l), path.join(dist, '_np', l)]) {
      if (!fs.existsSync(base)) continue;
      // 1. oldalak törlése
      let del = 0;
      for (const sg of C.seg) { const d = path.join(base, sg); if (fs.existsSync(d)) { fs.rmSync(d, { recursive: true, force: true }); del++; } }
      // 2. _slugs.json: régi magyar és a törölt szlovák/cseh címek → főoldal
      const sf = path.join(base, '_slugs.json');
      if (fs.existsSync(sf)) {
        const m = JSON.parse(fs.readFileSync(sf, 'utf8'));
        for (const k of Object.keys(m)) if (C.seg.some((sg) => m[k].startsWith('/' + sg + '/'))) m[k] = '/';
        for (const k of C.hu) m[k] = '/';
        const SUB = { sk: ['auto/', 'predat-auto/', 'charita/', 'proces/', 'caste-otazky/'], cs: ['vuz/', 'prodat-vuz/', 'charita/', 'proces/', 'caste-dotazy/'] }[l];
        m['/' + C.seg[0] + '/'] = '/';
        for (const x of SUB) m['/' + C.seg[0] + '/' + x] = '/';
        m['/' + C.seg[1] + '/'] = '/blog/';
        m['/blog/bizomanyos-auto-ertekesites/'] = '/blog/';
        fs.writeFileSync(sf, JSON.stringify(m));
      }
      // 3. HTML-ek
      let files = 0; const tot = {};
      (function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) { walk(p); continue; }
          if (!/\.html$/.test(e.name)) continue;
          const s = fs.readFileSync(p, 'utf8');
          const [n, st] = cleanHtml(s, l, C, path.relative(base, p));
          if (n !== s) { fs.writeFileSync(p, n); files++; for (const k in st) tot[k] = (tot[k] || 0) + st[k]; }
        }
      })(base);
      out.push(`${path.relative(dist, base)}: törölt mappa ${del}, módosított HTML ${files} ${JSON.stringify(tot)}`);
    }
    // 4. keresőindex
    for (const f of [path.join(dist, 'kereses-index-' + l + '.json'), path.join(dist, l, 'kereses-index.json'), path.join(dist, '_np', l, 'kereses-index.json')]) {
      if (!fs.existsSync(f)) continue;
      try {
        const d = JSON.parse(fs.readFileSync(f, 'utf8'));
        const n0 = d.items.length;
        d.items = d.items.filter((x) => !C.seg.some((sg) => String(x.u || '').includes('/' + sg + '/')) && !C.kw.test(String(x.t || '')));
        d.items.forEach((x) => { for (const k of Object.keys(x)) if (typeof x[k] === 'string') x[k] = rep(x[k], C); });
        fs.writeFileSync(f, JSON.stringify(d));
        out.push(`${path.relative(dist, f)}: ${n0} → ${d.items.length}`);
      } catch (e) { out.push(f + ': hiba ' + e.message); }
    }
  }
  return '[skcz-local] ' + out.join(' | ');
}

if (import.meta.url === 'file://' + path.resolve(process.argv[1] || '')) {
  try { console.log(run(DIST)); } catch (e) { console.log('[skcz-local] hiba: ' + (e && e.stack)); }
}
