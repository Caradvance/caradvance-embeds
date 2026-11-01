#!/usr/bin/env node
/**
 * caradvance.ch — svájci oldal A SZLOVÁK OLDAL SZERKEZETÉBEN (2026-10), négy nyelven
 *
 * A kész szlovák oldalakból (dist/sk/**, a skcz-local, skcz-langs és pl-site után) elkészíti:
 *   dist/ch/<német útvonal>/index.html          — német (fő nyelv)
 *   dist/ch/fr/… , dist/ch/it/… , dist/ch/en/… — francia, olasz, angol (svájci piacra lokalizálva)
 * A domain: https://www.caradvance.ch (a functions/_middleware.js a dist/ch-ból szolgálja ki).
 *
 * Fordítás: a szlovák szövegegységekhez
 *   de / en — a szlovák oldal német / angol fordítása (src/i18n/dict + skcz-langs-data.mjs),
 *   fr      — a magyar oldal francia szótára (src/i18n/dict/fr.json) a szlovák → magyar páron át,
 *   ch-site-data.json — kézi fordítások [de, fr, it, en] (olasz: minden egység; fr: ami a szótárból hiányzik;
 *                       de/en: a svájci piachoz átírt egységek).
 * Ahol fr/it fordítás nincs, ott az angol szöveg megy ki (a lefedettségbe nem számít bele).
 * Lokalizálás (ch-site-config.json): CHF árak (+ tájékoztató € összeg), svájci behozatal (4 % autóadó,
 * 8,1 % MWST, MFK), bérlés külföldi lakóhelyű ügyfeleknek, kapcsolattartók, jogi oldalak.
 * Élesítésig (CH.live=false) minden oldal noindex, a robots.txt tilt. Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize, visit, finishLd, maskNums, unmaskNums } from './i18n-core.mjs';
import { maskModels, unmaskModels, neutralL, maskModels2, normNums, phraseFix } from './skcz-langs-mask.mjs';
import { SKL } from './skcz-langs-data.mjs';
import { chCalcPage, CALC_PAGES } from './ch-calc.mjs';

const PL = JSON.parse(fs.readFileSync('ch-site-config.json', 'utf8'));
const BASE = 'de';
const DIST = 'dist';
const SK = path.join(DIST, 'sk');
const OUT = path.join(DIST, 'ch');
const SITE = PL.site;                         // https://www.caradvance.ch
const LANGS = ['de', 'fr', 'it', 'en'];
const OG = { de: 'de_CH', fr: 'fr_CH', it: 'it_CH', en: 'en_GB' };
const HL = { de: 'de-CH', fr: 'fr-CH', it: 'it-CH', en: 'en-CH' };
const SW = [['de', 'Deutsch', 'de'], ['fr', 'Français', 'fr'], ['it', 'Italiano', 'it'], ['en', 'English', 'gb']];
const SKIP_TOP = /^(en|de|hu|_np)$/;
const MIN_COVER = 0.97;

const sig = (s) => [...String(s).matchAll(/\{\d+\}|<\/?[gx]\d+\/?>|⟨M\d+⟩/g)].map((m) => m[0]).sort().join('|');
/* a svájci kézi fordításban elmaradhat egy-egy szlovák adatot hordozó helyőrző (pl. a pozsonyi cím) — a többi maradjon */
const toks = (s) => [...String(s).matchAll(/\{\d+\}|<\/?[gx]\d+\/?>|⟨M\d+⟩/g)].map((m) => m[0]);
function subOk(t, k) { const c = new Map(); for (const x of toks(k)) c.set(x, (c.get(x) || 0) + 1); for (const x of toks(t)) { const n = c.get(x) || 0; if (!n) return false; c.set(x, n - 1); } return true; }
const CHX = new Set();

/* ---------- szótárak ---------- */
function dicts() {
  const sk = JSON.parse(fs.readFileSync('src/i18n/dict/sk.json', 'utf8'));
  const src = { en: JSON.parse(fs.readFileSync('src/i18n/dict/en.json', 'utf8')), de: JSON.parse(fs.readFileSync('src/i18n/dict/de.json', 'utf8')), fr: JSON.parse(fs.readFileSync('src/i18n/dict/fr.json', 'utf8')) };
  const D = { de: new Map(), fr: new Map(), it: new Map(), en: new Map() };
  const HUS = { en: /Hungar|Budapest|\bHUF\b|\bFt\b|forint/i, de: /Ungarn|ungarisch|Budapest|\bHUF\b|\bFt\b|Forint/i, fr: /Hongr|Budapest|\bHUF\b|\bFt\b|forint/i };
  const SRC_HU = /Maďar|maďar|Hungar|Budapešť|Budapest|\bHUF\b|\bFt\b|forint|Magyar/;
  for (const [hu, v] of Object.entries(sk)) {
    if (!v) continue;
    for (const l of ['en', 'de', 'fr']) if (src[l][hu] && !D[l].has(v)) { if (SRC_HU.test(v) || !HUS[l].test(src[l][hu])) D[l].set(v, src[l][hu]); }
  }
  for (const [k, arr] of Object.entries(SKL)) { if (arr[0] && sig(arr[0]) === sig(k)) D.en.set(k, arr[0]); if (arr[1] && sig(arr[1]) === sig(k)) D.de.set(k, arr[1]); }
  let CHD = {};
  try { CHD = JSON.parse(fs.readFileSync('ch-site-data.json', 'utf8')); } catch (e) {}
  let bad = 0;
  for (const [k, arr] of Object.entries(CHD)) {
    LANGS.forEach((l, i) => { const t = arr[i]; if (!t) return; if (sig(t) === sig(k)) D[l].set(k, t); else if (subOk(t, k)) { D[l].set(k, t); CHX.add(t); } else bad++; });
  }
  return { D, bad };
}

function pfix(s, l) {
  if (l === 'de' || l === 'en') return phraseFix(s, l);
  const SER = { fr: (n) => 'Série ' + n, it: (n) => 'Serie ' + n }, CLS = { fr: 'Classe $1', it: 'Classe $1' }, LIM = { fr: 'Berline', it: 'Berlina' };
  return s.replace(/(?<![\p{L}])(?:rad|radu|rade|Rad) (\d+)(?![\p{L}\p{N}])/gu, (m, n) => SER[l](n))
    .replace(/(?<![\p{L}])(?:trieda|triedy|triede|triedu|Trieda|Triedy) ([A-Z]{1,3}|\{\d+\})(?![\p{L}\p{N}])/gu, CLS[l])
    .replace(/(?<![\p{L}])[Ll]imuzín[auy](?![\p{L}])/gu, LIM[l]);
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
  if (t != null && (sig(t) === sig(k) || CHX.has(t))) return t;
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
/* franciánál / olasznál, ha nincs fordítás: az angol változat (jobb, mint a szlovák szöveg); a lefedettségbe nem számít bele */
function lookup(D, l, k, st) {
  const t = look1(D, l, k);
  if (t != null) return t;
  if (st) st.miss++;
  return l === 'fr' || l === 'it' ? (look1(D, 'en', k) ?? look1(D, 'de', k)) : l === 'de' ? look1(D, 'en', k) : look1(D, 'de', k);
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

/* ---------- CHF-árak (+ tájékoztató € összeg) ---------- */
/* „1 199 €/Monat” → „CHF 1’109/Monat (≈ 1 199 €)”; a már átváltott szöveget nem bántja */
function CHFADD(s, R) {
  if (!R || !/€/.test(s) || /CHF/.test(s)) return s;
  return s.replace(/(\d{1,3}(?:(?:[ \u00a0\u202f.]|&nbsp;)\d{3})+|\d{2,})(?:,\d{1,2})?(?:[ \u00a0\u202f]|&nbsp;)?€((?:[ \u00a0]?\/[ \u00a0]?(?:Monat|Mon\.|mois|mese|month|mo\.|mes\.|mies\.))?)(?![ \u00a0\u202f]*\(≈)/g, function (m, a, u) {
    var e = +String(a).replace(/[^\d]/g, ''); if (e < 20) return m;
    var c = e * R; c = c >= 10000 ? Math.round(c / 10) * 10 : Math.round(c);
    return 'CHF ' + String(c).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2019') + u + ' (≈ ' + m.slice(0, m.length - u.length) + ')';
  });
}
const chfJson = (s, R) => s.replace(/"([^"\\]*€[^"\\]*)"/g, (m, t) => '"' + CHFADD(t, R) + '"');
function chfHtml(h, R) {
  const bi = h.search(/<body\b/i); if (bi < 0) return h;
  const head = h.slice(0, bi);
  const body = h.slice(bi).split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<option\b[\s\S]*?<\/option>)/i)
    .map((part, i) => (i % 2 ? part : part.replace(/(<[^<>]*>)([^<>]*€[^<>]*)</g, (m, tag, t) => tag + (/class="[^"]*\bca-pv\b/.test(tag) ? t : CHFADD(t, R)) + '<'))).join('');
  // meta description / og:description: CHF az euró helyett (rövid)
  return head.replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description|og:title|twitter:title)" content=")([^"]*)(")/g, (m, a, t, c) => a + CHFADD(t, R).replace(/ \(≈ [^)]*\)/g, '') + c)
    .replace(/(<title>)([^<]*)(<\/title>)/, (m, a, t, c) => a + CHFADD(t, R).replace(/ \(≈ [^)]*\)/g, '') + c) + body;
}


/* ---------- autó-adatlap: svájci árblokk (a szlovák 23 %-os bruttó helyett) ---------- */
const VATL = {
  de: { deliv: 'Preis bei Lieferung in die Schweiz', net: 'ohne deutsche MWST', imp: 'Bei der Einfuhr kommen 4 % Automobilsteuer und 8,1 % Einfuhr-MWST hinzu – Gesamtpreis inkl. Einfuhrabgaben ca.', pick: 'bei Abholung in Deutschland, inkl. 19 % deutscher MWST (wird nach Ausfuhrnachweis erstattet)', co: 'für MWST-pflichtige Firmen: die Einfuhr-MWST ist als Vorsteuer abziehbar', newl: 'Neuwagen' },
  fr: { deliv: 'Prix avec livraison en Suisse', net: 'sans TVA allemande', imp: 'À l’importation s’ajoutent 4 % d’impôt sur les véhicules automobiles et 8,1 % de TVA à l’importation – prix total avec taxes d’importation env.', pick: 'en cas de retrait en Allemagne, TVA allemande de 19 % incluse (remboursée sur preuve d’exportation)', co: 'entreprises assujetties à la TVA : la TVA à l’importation est déductible', newl: 'Voiture neuve' },
  it: { deliv: 'Prezzo con consegna in Svizzera', net: 'senza IVA tedesca', imp: 'All’importazione si aggiungono il 4 % di imposta sugli autoveicoli e l’8,1 % di IVA all’importazione – prezzo totale con tributi d’importazione ca.', pick: 'con ritiro in Germania, IVA tedesca del 19 % inclusa (rimborsata con la prova d’esportazione)', co: 'aziende assoggettate all’IVA: l’IVA all’importazione è deducibile', newl: 'Auto nuova' },
  en: { deliv: 'Price with delivery to Switzerland', net: 'without German VAT', imp: 'On import, 4 % automobile tax and 8.1 % import VAT are added – total incl. import charges approx.', pick: 'with pick-up in Germany, incl. 19 % German VAT (refunded after proof of export)', co: 'VAT-registered companies: the import VAT is deductible as input tax', newl: 'New car' }
};
function chVat(h, l, R) {
  const L = VATL[l] || VATL.de;
  const fe = (e) => String(Math.round(e)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const fc = (e) => { let c = e * R; c = c >= 10000 ? Math.round(c / 10) * 10 : Math.round(c); return 'CHF ' + String(c).replace(/\B(?=(\d{3})+(?!\d))/g, '’'); };
  const both = (e) => fc(e) + ' (≈ ' + fe(e) + ' €)';
  const vs = 'style="margin-top:8px;font-size:14px;line-height:1.45"';
  // autólista-kártyák (statikus): nettó ár CHF-ben, a szlovák 23 %-os bruttó helyett
  const LBC = { de: 'ohne MWST · zzgl. Einfuhrabgaben', fr: 'hors TVA · plus taxes d’importation', it: 'IVA esclusa · più tributi d’importazione', en: 'excl. VAT · plus import charges' };
  h = h.replace(/<div class="pricerow" data-eur="(\d+)"([^>]*)>[\s\S]*?<\/div>/g, (m, eur, rest) => (+eur ? `<div class="pricerow" data-eur="${eur}"${rest}><span class="price">${both(+eur)}</span><span class="peur">${LBC[l] || LBC.de}</span></div>` : m));
  return h.replace(/<div class="ca-vat( ca-new)?" data-eur="(\d+)"([^>]*)>[\s\S]*?(?=<div class="taxnote">)/g, (m, nw, eur, rest) => {
    const n = +eur; if (!n) return m;
    const tot = n * 1.04 * 1.081;
    return `<div class="ca-vat${nw || ''}" data-eur="${eur}"${rest}><div class="plabel">${nw ? L.newl + ' · ' : ''}${L.deliv}</div><div class="price ca-pv">${both(n)}</div><div class="peur" style="font-size:14px">${L.net}</div>` +
      `<div class="ca-vatv" style="margin-top:12px;font-size:14px;line-height:1.45">${L.imp} <b>${both(tot)}</b>.</div>` +
      (nw ? '' : `<div class="ca-vatv" ${vs}><b>${both(n * 1.19)}</b> ${L.pick}</div>`) +
      `<div class="ca-vatv" ${vs}>${L.co}.</div></div>`;
  });
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
  return h;
}

/* ---------- nyelvváltó ---------- */
function switcher(h, cur, plPath) {
  const href = (c) => '/ch' + (c === BASE ? '' : '/' + c) + plPath;
  const opts = (cls) => SW.map(([c, name, flag]) => `<a hreflang="${HL[c]}" class="${cls}" href="${href(c)}"${c === cur ? ' aria-current="true"' : ''}><span class="lf" style="background-image:url(https://flagcdn.com/w80/${flag}.png)"></span><span>${name}</span></a>`).join('');
  for (const cls of ['langopt', 'm-langopt']) {
    const re = new RegExp(`(?:<a hreflang="[^"]+" class="${cls}"[^>]*>[\\s\\S]*?<\\/a>)+`, 'g');
    let done = false;
    h = h.replace(re, () => { if (done) return ''; done = true; return opts(cls); });
  }
  const flag = SW.find((x) => x[0] === cur)[2];
  return h.replace(/(class="navflag" style="background-image:url\(https:\/\/flagcdn\.com\/w80\/)[a-z]+(\.png\))/g, `$1${flag}$2`);
}

const DUMP = process.env.CH_DUMP ? new Map() : null;
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
    if (DUMP) { const d = DUMP.get(k) || { p: rel, n: 0 }; d[l] = t; if (l === 'de') d.n++; DUMP.set(k, d); }
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
  const look0 = (txt) => { const { k, nums } = maskNums(txt.trim().replace(/\s+/g, ' ')); if (!k) return null; const t = look1(D, l, k) ?? (l === 'fr' || l === 'it' ? (look1(D, 'en', k) ?? look1(D, 'de', k)) : l === 'de' ? look1(D, 'en', k) : look1(D, 'de', k)); return t == null || t === k ? null : unmaskNums(t, nums); };
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
  const EXC = new RegExp(PL.exclude || '^$');
  const list = pages(SK).filter((rel) => !/^icons\//.test(rel) && !EXC.test(rel));
  const map = new Map(list.map((rel) => [rel, slugOf(rel)]));       // szlovák rel → lengyel rel
  const skAbs = (p) => { const q = p.replace(/^\//, ''); const b = q.split(/[?#]/)[0]; const n = b === '' ? '' : (b.endsWith('/') ? b : b + '/'); return map.has(n) ? '/' + map.get(n) + q.slice(b.length) : null; };
  const miss = new Map();
  const stat = Object.fromEntries(LANGS.map((l) => [l, [0, 0]]));
  const okp = Object.fromEntries(LANGS.map((l) => [l, new Set()]));
  const R = +PL.fxCHF || 0.93;
  let written = 0;
  fs.rmSync(OUT, { recursive: true, force: true });

  for (const rel of list) {
    let src = fs.readFileSync(path.join(SK, rel, 'index.html'), 'utf8');

    if (/http-equiv=["']?refresh/i.test(src)) continue;
    const plRel = map.get(rel); const plPath = '/' + plRel;
    const calc = CALC_PAGES[rel];
    for (const l of LANGS) {
      let { h, cover } = translate(src, l, D, rel, miss);
      stat[l][0] += cover; stat[l][1] += 1;
      const pre = l === BASE ? '' : '/' + l;
      const url = SITE + pre + plPath;
      h = h.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${l}"`);
      h = h.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${url}">`);
      h = h.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${url}">`);
      h = h.replace(/<meta property="og:locale" content="[^"]*">/i, `<meta property="og:locale" content="${OG[l]}">`);
      h = h.replace(/[ \t]*<meta property="og:locale:alternate"[^>]*>\s*\n?/g, '');
      // hreflang: csak a lengyel klaszter (pl, en-PL, de-PL)
      h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*\n?/g, '');
      const alts = LANGS.map((x) => `<link rel="alternate" hreflang="${HL[x]}" href="${SITE}${x === BASE ? '' : '/' + x}${plPath}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE}${plPath}">`;
      h = h.replace(/(<link rel="canonical" href="[^"]*">)/i, `$1\n${alts}`);
      // belső linkek: /sk/(en|de|hu)?/… → /ch/(fr|it|en)?/<német út>
      h = h.replace(/(\s(?:href|action)=")\/sk(?:\/(en|de|hu))?(\/[^"]*)?"/g, (m, a, lg, q) => {
        const p2 = skAbs(q || '/');
        if (!p2) { const qq = (q || '/').replace(/^\//, '').split(/[?#]/)[0]; if (qq && EXC.test(qq.endsWith('/') ? qq : qq + '/')) return `${a}#ca-x"`; return /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(q || '') ? m : `${a}/ch${pre}/"`; }
        return `${a}/ch${pre}${p2}"`;
      });
      // abszolút caradvance.sk címek (JSON-LD, meta) → caradvance.ch
      h = h.replace(/https:\/\/www\.caradvance\.sk(\/(?:en|de|hu)(?=\/))?(\/[^"\\\s<]*)?/g, (m, lg, q) => { const p2 = skAbs(q || '/'); return p2 ? SITE + pre + p2 : m; });
      // futásidejű fordító, keresőindex
      h = h.split('/i18n/rt-sk.js').join(`/i18n/rt-ch-${l}.js`);
      h = h.replace(/data-idx="\/sk\/kereses-index\.json" data-lang="sk"/g, `data-idx="/ch${pre}/kereses-index.json" data-lang="${l}"`);
      h = switcher(h, l, plPath);
      h = localize(h, l);
      for (const [a, b] of (PL.jsfix || {})[l] || []) h = h.split(a).join(b);
      // a szlovák oldal szkriptjei a 'sk' ágat használják — ennek a szövegeit fordítottuk le; a hónapnév-listák a svájci nyelvek neveit is ismerjék
      h = h.replace(/(<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>)([\s\S]*?)(<\/script>)/gi, (all, a, js, b) => a + js.split('document.documentElement.lang').join("(/^(de|fr|it|en)$/.test(document.documentElement.lang)&&/caradvance\\.ch$|\\/ch\\//.test(location.hostname+location.pathname)?'sk':document.documentElement.lang)").replace(/var MON=\[[^\]]*\]/, 'var MON=' + PL.monRe) + b);
      if (calc) h = chCalcPage(h, calc, l, { kontakt: '/ch' + pre + '/kontakt/' }, url, R, { phone: PL.phone, email: PL.email });
      // a svájci oldalról kihagyott oldalakra mutató linkek: menüpont (class-szal) törölve, szövegközi link feloldva
      h = h.replace(/<a\b([^>]*)\shref="#ca-x"([^>]*)>([\s\S]*?)<\/a>/g, (m, x, y, t, off, all) => (/\bclass=/.test(x + y) || (all[off - 1] === '>' && all[off + m.length] === '<') ? '' : t));
      h = chfHtml(h, R);
      h = chVat(h, l, R);
      if (l === 'de') h = h.replace(/ß/g, 'ss');
      h = h.replace(/[^.<>"]*CO₂[^.<>"]*/g, (m) => m.replace(/6(?:[\s\u00a0’'.]|&nbsp;)?000(?=(?:\s|&nbsp;|\u00a0)?km)/g, '5000'));
      // robots: élesítésig noindex
      h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, '');
      const noidx = !PL.live || cover < MIN_COVER;
      if (noidx) h = h.replace(/<\/head>/i, '<meta name="robots" content="noindex,nofollow">\n</head>');
      else okp[l].add(plPath);
      const f = path.join(OUT, l === BASE ? '' : l, plRel, 'index.html');
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, h); written++;
    }
  }

  // _slugs.json: régi magyar és szlovák címek → német cím (a middleware 301-et ad)
  const slugs = {};
  try { const sks = JSON.parse(fs.readFileSync(path.join(SK, '_slugs.json'), 'utf8')); for (const [hu, s] of Object.entries(sks)) { const p2 = skAbs(s); if (p2 && hu !== p2) slugs[hu] = p2; } } catch (e) {}
  const plSet = new Set(map.values());
  for (const [rel, p] of map) if (rel !== p && !plSet.has(rel)) slugs['/' + rel] = '/' + p;
  for (const k of Object.keys(slugs)) if (plSet.has(k.replace(/^\//, '')) || slugs[k] === k) delete slugs[k];
  fs.writeFileSync(path.join(OUT, '_slugs.json'), JSON.stringify(slugs));

  // robots.txt + sitemap.xml
  const now = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), PL.live ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  const urls = LANGS.flatMap((l) => [...okp[l]].sort().map((p) => `  <url><loc>${SITE}${l === BASE ? '' : '/' + l}${p}</loc><lastmod>${now}</lastmod></url>`));
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

  // keresőindex
  const idxf = path.join(SK, 'kereses-index.json');
  if (fs.existsSync(idxf)) {
    const base = JSON.parse(fs.readFileSync(idxf, 'utf8'));
    const NUM = /\d+(?:[.,   ]\d+)*/g;
    const trs = (l, s) => { if (!s) return s; const nums = []; const k = String(s).replace(/\s+/g, ' ').trim().replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; }); const t = lookup(D, l, k); return t == null ? s : t.replace(/\{(\d+)\}/g, (m, i) => (nums[+i - 1] !== undefined ? nums[+i - 1] : m)); };
    for (const l of LANGS) {
      const d = JSON.parse(JSON.stringify(base)); d.lang = l;
      const pre = l === BASE ? '' : '/' + l;
      d.items = d.items.filter((x) => !/^\/sk\//.test(String(x.u || '')) || skAbs(String(x.u).slice(3))).map((x) => {
        for (const k of ['t', 'd', 'h']) if (x[k]) x[k] = localize(trs(l, x[k]), l);
        if (x.x) x.x = String(x.x).split(' · ').map((s) => trs(l, s)).join(' · ');
        const u = String(x.u || '');
        if (u.startsWith('/sk/')) {
          const p2 = skAbs(u.slice(3)); const c = CALC_PAGES[u.slice(4).split(/[?#]/)[0]]; x.u = '/ch' + pre + p2;
          // cím, leírás, H1, alcímek a kész lengyel / angol / német oldalból
          try {
            const f = path.join(OUT, l === BASE ? '' : l, p2.split(/[?#]/)[0], 'index.html');
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
      d.chf = R;   // a kereső CHF-árakhoz (kereses.js)
      fs.mkdirSync(path.join(OUT, l === BASE ? '' : l), { recursive: true });
      fs.writeFileSync(path.join(OUT, l === BASE ? '' : l, 'kereses-index.json'), chfJson(localize(JSON.stringify(d), l), R));
      fs.writeFileSync(path.join(DIST, 'kereses-index-ch-' + l + '.json'), chfJson(localize(JSON.stringify(d), l), R));   // a kereses.js a .ch domainen ezt tölti be
    }
  }

  // futásidejű fordító: rt-ch-de.js, rt-ch-fr.js, rt-ch-it.js, rt-ch-en.js (a szlovák oldal német / angol sablonjából)
  const part = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); return i < 0 || j < 0 ? null : [i, j]; };
  const rd = (f) => (fs.existsSync(path.join(DIST, 'i18n', f)) ? fs.readFileSync(path.join(DIST, 'i18n', f), 'utf8') : null);
  const rtSk = rd('rt-sk.js');
  let rtn = 0;
  if (rtSk) {
    let CHR = { fr: { M: {}, G: {} }, it: { M: {}, G: {} } };
    try { CHR = Object.assign(CHR, JSON.parse(fs.readFileSync('ch-site-rt.json', 'utf8'))); } catch (e) {}
    const MG = (b) => { const a = part(b, 'var M=', ';var G='), g = part(b, 'var G=', ';var GN='); try { return { M: JSON.parse(b.slice(a[0] + 6, a[1])), G: JSON.parse(b.slice(g[0] + 6, g[1])) }; } catch (e) { return { M: {}, G: {} }; } };
    const rtFr = rd('rt-fr.js'); const FR = rtFr ? MG(rtFr) : { M: {}, G: {} };
    const slR = part(rtSk, 'var SL=', 'var M=');
    for (const l of LANGS) {
      let b = rd(l === 'de' ? 'rt-sk-de.js' : 'rt-sk-en.js'); if (!b) continue;
      const pre = l === BASE ? '' : '/' + l;
      const sl = rtSk.slice(slR[0], slR[1]).replace(/"\/sk(\/[^"]*)"/g, (m, q) => { const p2 = skAbs(q); return p2 ? `"/ch${pre}${p2}"` : m; });
      const s2 = part(b, 'var SL=', 'var M='); if (s2) b = b.slice(0, s2[0]) + sl + b.slice(s2[1]);
      const mR = part(b, 'var M=', ';var G='), gR = part(b, 'var G=', ';var GN=');
      if (mR && gR) {
        const T = MG(b); const X = l === 'fr' ? FR : l === 'it' ? CHR.it : null; const Y = l === 'fr' ? CHR.fr : null;
        const M = {}, G = {};
        for (const k of Object.keys(T.M)) { const v = (Y && Y.M[k]) ?? (X && X.M[k]) ?? T.M[k]; if (v != null) M[k] = localize(v, l); }
        for (const k of Object.keys(T.G)) { const v = (Y && Y.G[k]) ?? (X && X.G[k]) ?? T.G[k]; if (v != null) G[k] = localize(v, l); }
        b = b.slice(0, mR[0]) + 'var M=' + JSON.stringify(M) + ';var G=' + JSON.stringify(G) + b.slice(gR[1]);
        b = b.replace(/var GN=\d+/, 'var GN=' + Object.keys(G).length);
      }
      b = b.replace(/var LG="[a-z]+"/, `var LG="${l}"`);
      const extra = `var CHFR=${R};var CHFADD=${CHFADD.toString()};` +
        `try{var CC2=window.CA_CFG;if(CC2){CC2.PHONE=${JSON.stringify(PL.phone)};CC2.WHATSAPP='https://wa.me/${PL.wa}';}}catch(e){}`;
      b = b.replace(/CUR=function\(s\)\{return CONV\(s,FX\)\};/, 'CUR=function(s){return CHFADD(CONV(s,FX),CHFR)};')
        .replace(/if\(\/\(\^\|\\\\?\.\)caradvance\\\\?\.\(sk\|cz\)\$\/\.test\(location\.hostname\)\)DOMSTRIP=\/\^\\\\?\/\(sk\|cs\)\\\\?\/\/;/, '')
        .replace('var UNITS=', `${extra}if(/(^|\\.)caradvance\\.ch$/.test(location.hostname))DOMSTRIP=/^\\/ch\\//;var UNITS=`)
        .replace('var UNITS={', 'var UNITS={it:{m:"/mese",p:"da"},')
        .replace(/^\/\* CarAdvance i18n runtime \([^)]*\) \*\//, `/* CarAdvance i18n runtime (caradvance.ch, ${l}) */`);
      fs.writeFileSync(path.join(DIST, 'i18n', `rt-ch-${l}.js`), b); rtn++;
    }
  }

  // _routes.json: a svájci útvonalak is a middleware-en menjenek
  try {
    const rp = path.join(DIST, '_routes.json'); const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    // a /ch/ előnézet a caradvance.hu-n statikus (noindex + canonical), nem kell rá szabály
    const tops = new Set(LANGS.filter((x) => x !== BASE).map((x) => '/' + x + '/*')); for (const p of map.values()) { const t = p.split('/')[0]; if (t) tops.add('/' + t + '/*'); }
    for (const x of tops) if (!r.include.includes(x) && !r.include.includes('/' + x.split('/')[1] + '/*')) r.include.push(x);
    // 2 helyet meghagyunk az am-routes.mjs-nek (/belso/ajanlatmotor/*, /ajanlat/auto/*), különben a build megállna
    const res = ['/belso/ajanlatmotor/*', '/ajanlat/auto/*'].filter((w) => !r.include.includes(w) && !r.include.includes('/' + w.split('/')[1] + '/*')).length;
    // ha nem fér bele a 100 szabályba: a teszt- és ikonoldalak szabálya elhagyható (ezeken a middleware-nek nincs dolga)
    for (const x of ['/teszt-mega-menu/*', '/icons/*']) if (r.include.length + (r.exclude || []).length + res > 100 && r.include.includes(x)) r.include.splice(r.include.indexOf(x), 1);
    if (r.include.length + (r.exclude || []).length + res <= 100) { fs.writeFileSync(rp, JSON.stringify(r, null, 2)); console.log('[ch-site] _routes.json: ' + (r.include.length + (r.exclude || []).length) + ' szabály (+' + res + ' am-routes)'); }
    else console.log('[ch-site] _routes.json: több mint 100 szabály, nem írtam át');
  } catch (e) {}

  // a hiányzó szlovák egységek (fr / it / de / en szerint), angol referenciával — a következő fordításhoz
  try {
    const all = [...miss].map(([k, m]) => ({ k, p: m.p, l: [...m.l], n: m.n, en: (m.raw && look1(D, 'en', m.raw)) || null, de: (m.raw && look1(D, 'de', m.raw)) || null, raw: m.raw !== k ? m.raw : undefined }));
    fs.writeFileSync(path.join(DIST, '_ch-missing.json'), JSON.stringify(all));
  } catch (e) {}
  if (DUMP) fs.writeFileSync(process.env.CH_DUMP, JSON.stringify([...DUMP].map(([k, d]) => Object.assign({ k }, d))));
  const pct = (l) => (100 * stat[l][0] / Math.max(1, stat[l][1])).toFixed(1) + '%';
  return `[ch-site] ${written} oldal (${LANGS.map((l) => l + ' ' + pct(l)).join(' | ')}), hiányzó egység ${miss.size}, hibás fordítás ${bad}, runtime ${rtn}, ${PL.live ? 'ÉLES' : 'noindex'}`;
}

try { console.log(run()); } catch (e) { console.log('[ch-site] hiba: ' + (e && e.stack || e)); }
