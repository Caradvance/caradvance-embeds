#!/usr/bin/env node
/**
 * caradvance.eu — Németország, Franciaország, Olaszország, Spanyolország (2026-11)
 *
 * A kész szlovák oldalakból (dist/sk/**) elkészíti:
 *   dist/eu/de/<német út>/ · dist/eu/fr/<francia út>/ · dist/eu/it/<olasz út>/ · dist/eu/es/<spanyol út>/
 *   dist/eu/index.html — nyelvválasztó (x-default); a middleware az Accept-Language alapján továbbirányít.
 * Nyelv = ország: de → Németország, fr → Franciaország, it → Olaszország, es → Spanyolország (hreflang de-DE …).
 * Szolgáltatások: tartós bérlés, készletautók, új autó rendelés — import és autókeresés NINCS (exclude).
 *
 * Fordítás: eu-site-data.json [de, fr, it, es] (EU-lokalizált + spanyol) > a svájci (ch-site-data, nem svájci
 * tartalmú) és a szlovák oldal német/angol/francia szótára. A német svájci helyesírását (ss) ß-re javítja.
 * Árak euróban; autó-adatlapon országonkénti ÁFA-blokk. Élesítésig (live=false) minden oldal noindex.
 * Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize, visit, finishLd, maskNums, unmaskNums } from './i18n-core.mjs';
import { maskModels, unmaskModels, neutralL, maskModels2, normNums, phraseFix } from './skcz-langs-mask.mjs';
import { SKL } from './skcz-langs-data.mjs';

const EU = JSON.parse(fs.readFileSync('eu-site-config.json', 'utf8'));
const DIST = 'dist';
const SK = path.join(DIST, 'sk');
const OUT = path.join(DIST, 'eu');
const SITE = EU.site;                           // https://www.caradvance.eu
const LANGS = ['de', 'fr', 'it', 'es'];
const OG = { de: 'de_DE', fr: 'fr_FR', it: 'it_IT', es: 'es_ES' };
const HL = { de: 'de-DE', fr: 'fr-FR', it: 'it-IT', es: 'es-ES' };
const SW = [['de', 'Deutsch', 'de'], ['fr', 'Français', 'fr'], ['it', 'Italiano', 'it'], ['es', 'Español', 'es']];
const VAT = EU.vat;                              // { de: 19, fr: 20, it: 22, es: 21 }
const SKIP_TOP = /^(en|de|hu|_np)$/;
const MIN_COVER = 0.97;
const SWISS = /Schweiz|schweizer|Suisse|suisse|Svizzera|svizzer|Switzerland|Swiss|CHF|MWST|MFK|Kanton|canton|Zoll|douane|dogana|Einfuhr|importation|Red Pro|Grenzgänger|frontali|Freiburg|Fribourg|Friborgo|\bUID\b|\bIDE\b|\bIDI\b|Strassenverkehrsamt|Automobilsteuer|EDÖB|PFPDT|IPRG|Lugano|revDSG|nLPD|FMG|Fahrzeugausweis|Kontrollschild|Prüfbericht|\bOccasion|Verzollung|dédouan|sdoganament|\bfranchi\b/;

const toks = (s) => [...String(s).matchAll(/\{\d+\}|<\/?[gx]\d+\/?>|⟨M\d+⟩/g)].map((m) => m[0]);
const sig = (s) => toks(s).sort().join('|');
function subOk(t, k) { const c = new Map(); for (const x of toks(k)) c.set(x, (c.get(x) || 0) + 1); for (const x of toks(t)) { const n = c.get(x) || 0; if (!n) return false; c.set(x, n - 1); } return true; }
const EUX = new Set();

/* ---------- ß a svájci (ss) német szövegekben ---------- */
function sharpS(baseVals) {
  const has = new Set(), ssw = new Set();
  for (const v of baseVals) for (const w of String(v).match(/[\p{L}]+/gu) || []) { if (w.includes('ß')) has.add(w); else if (w.includes('ss')) ssw.add(w); }
  const M = new Map();
  for (const w of has) { const s = w.replace(/ß/g, 'ss'); if (!ssw.has(s)) M.set(s, w); }
  const fixWord = (w) => M.get(w) || (/^(gross|grosse[nmrs]?|Grösse[n]?|Strasse[n]?|ausser|ausserdem|heisst|schliesslich|regelmässig|gemäss|Massnahme[n]?|Fuss|weiss|Spass|draussen|äusserst)$/i.test(w) ? w.replace(/ss/g, 'ß') : w);
  return (s) => String(s).replace(/[\p{L}]+/gu, (w) => (w.includes('ss') ? fixWord(w) : w));
}

/* ---------- szótárak ---------- */
function dicts() {
  const sk = JSON.parse(fs.readFileSync('src/i18n/dict/sk.json', 'utf8'));
  const src = { en: JSON.parse(fs.readFileSync('src/i18n/dict/en.json', 'utf8')), de: JSON.parse(fs.readFileSync('src/i18n/dict/de.json', 'utf8')), fr: JSON.parse(fs.readFileSync('src/i18n/dict/fr.json', 'utf8')) };
  const D = { de: new Map(), fr: new Map(), it: new Map(), es: new Map(), en: new Map() };
  const HUS = { en: /Hungar|Budapest|\bHUF\b|\bFt\b|forint/i, de: /Ungarn|ungarisch|Budapest|\bHUF\b|\bFt\b|Forint/i, fr: /Hongr|Budapest|\bHUF\b|\bFt\b|forint/i };
  const SRC_HU = /Maďar|maďar|Hungar|Budapešť|Budapest|\bHUF\b|\bFt\b|forint|Magyar/;
  for (const [hu, v] of Object.entries(sk)) {
    if (!v) continue;
    for (const l of ['en', 'de', 'fr']) if (src[l][hu] && !D[l].has(v)) { if (SRC_HU.test(v) || !HUS[l].test(src[l][hu])) D[l].set(v, src[l][hu]); }
  }
  for (const [k, arr] of Object.entries(SKL)) { if (arr[0] && sig(arr[0]) === sig(k)) D.en.set(k, arr[0]); if (arr[1] && sig(arr[1]) === sig(k)) D.de.set(k, arr[1]); }
  const ss = sharpS(D.de.values());
  // svájci kézi fordítások: csak ha nem svájci tartalmú (de: csak ha a szlovák alapból hiányzik)
  let CHD = {};
  try { CHD = JSON.parse(fs.readFileSync('ch-site-data.json', 'utf8')); } catch (e) {}
  const CL = ['de', 'fr', 'it', 'en'];
  for (const [k, arr] of Object.entries(CHD)) {
    CL.forEach((l, i) => {
      let t = arr[i]; if (!t || SWISS.test(t) || sig(t) !== sig(k)) return;
      if (l === 'de') { if (D.de.has(k)) return; t = ss(t); }
      if (l === 'en' && D.en.has(k)) return;
      D[l].set(k, t);
    });
  }
  // EU-adatok: [de, fr, it, es] — mindent felülírnak
  let EUD = {};
  try { EUD = JSON.parse(fs.readFileSync('eu-site-data.json', 'utf8')); } catch (e) {}
  let bad = 0;
  const put = (l, k, t) => { if (sig(t) === sig(k)) D[l].set(k, t); else if (subOk(t, k)) { D[l].set(k, t); EUX.add(t); } else bad++; };
  for (const [k, arr] of Object.entries(EUD)) {
    LANGS.forEach((l, i) => {
      const t = arr[i]; if (!t) return;
      put(l, k, t);
      // modellnév-maszk: ugyanaz a mondat más modellel is (⟨M1⟩ …)
      const { km, ms } = maskModels(k);
      if (km !== k && !D[l].has(km)) {
        let tm = t, ok = true;
        ms.forEach((m, j) => { const p = tm.indexOf(m); if (p < 0) ok = false; else tm = tm.slice(0, p) + '⟨M' + (j + 1) + '⟩' + tm.slice(p + m.length); });
        if (ok && sig(tm) === sig(km)) D[l].set(km, tm);
      }
    });
  }
  return { D, bad };
}

function pfix(s, l) {
  if (l === 'de') return phraseFix(s, l);
  const SER = { fr: (n) => 'Série ' + n, it: (n) => 'Serie ' + n, es: (n) => 'Serie ' + n }, CLS = { fr: 'Classe $1', it: 'Classe $1', es: 'Clase $1' }, LIM = { fr: 'Berline', it: 'Berlina', es: 'Berlina' };
  if (!SER[l]) return s;
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
  if (t != null && (sig(t) === sig(k) || EUX.has(t))) return t;
  const { km, ms } = maskModels(k);
  if (km !== k) { t = D[l].get(km); if (t != null && sig(t) === sig(km)) return pfix(unmaskModels(t, ms), l); }
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
/* tartalék, ha nincs fordítás: es → angol, fr/it → angol/német, de → angol (a lefedettségbe nem számít) */
const fb = (D, l, k) => (l === 'de' ? look1(D, 'en', k) : (look1(D, 'en', k) ?? look1(D, 'de', k)));
function lookup(D, l, k, st) {
  const t = look1(D, l, k);
  if (t != null) return t;
  if (st) st.miss++;
  return fb(D, l, k);
}

/* ---------- útvonalak (nyelvenként saját slug) ---------- */
function slugOf(rel, l) {
  if (!rel) return '';
  const SEG = EU.slugSeg[l], WORD = EU.slugWord[l]; const WORDS = Object.keys(WORD).sort((a, b) => b.length - a.length);
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

/* ---------- autó-adatlap és lista: országonkénti ÁFA (a szlovák 23 %-os blokk helyett) ---------- */
const VL = {
  de: { lab: 'Preis inkl. 19 % MwSt.', net: 'Nettopreis', netc: 'für Unternehmen (MwSt. ausweisbar)', del: 'Lieferung deutschlandweit oder Abholung bei München.', newl: 'Neuwagen', card: 'inkl. 19 % MwSt.' },
  fr: { lab: 'Prix TTC, TVA française 20 % incluse (livraison en France)', net: 'Prix HT', netc: 'entreprises avec un n° de TVA intracommunautaire valide : livraison intracommunautaire exonérée', pick: 'en cas de retrait en Allemagne (TVA allemande 19 %)', newx: 'Voiture neuve : facturée HT, la TVA française de 20 % est payée en France lors de l’immatriculation.', newl: 'Voiture neuve', card: 'TVA 20 % incluse' },
  it: { lab: 'Prezzo con IVA italiana 22 % (consegna in Italia)', net: 'Prezzo IVA esclusa', netc: 'aziende con partita IVA UE valida: cessione intracomunitaria non imponibile', pick: 'con ritiro in Germania (IVA tedesca 19 %)', newx: 'Auto nuova: fatturata senza IVA, l’IVA italiana del 22 % si versa in Italia all’immatricolazione.', newl: 'Auto nuova', card: 'IVA 22 % inclusa' },
  es: { lab: 'Precio con IVA español 21 % (entrega en España)', net: 'Precio sin IVA', netc: 'empresas con NIF-IVA intracomunitario válido: entrega intracomunitaria exenta', pick: 'con recogida en Alemania (IVA alemán 19 %)', newx: 'Coche nuevo: se factura sin IVA; el IVA español del 21 % se paga en España al matricularlo.', newl: 'Coche nuevo', card: 'IVA 21 % incluido' }
};
const fe = (e) => String(Math.round(e)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
function euVat(h, l) {
  const L = VL[l], r = 1 + VAT[l] / 100, vs = 'style="margin-top:8px;font-size:14px;line-height:1.45"';
  // autó-adatlap: a régi (szlovák) árat a meta-leírásokban és a JSON-LD-ben az ország bruttó árára cseréljük
  { const de0 = (h.match(/<div class="ca-vat(?: ca-new)?" data-eur="(\d+)"/) || [])[1]; const old = (h.match(/"price":(\d+)/) || [])[1];
    if (de0 && old && +de0) {
      const g = Math.round(+de0 * r), o = String(old), gs = String(g).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      h = h.split('"price":' + o).join('"price":' + g);
      const ore = new RegExp(o.replace(/\B(?=(\d{3})+(?!\d))/g, '[ \\u00a0\\u202f.]?'), 'g');
      h = h.replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")([^"]*)(")/g, (m, a2, t, c) => a2 + t.replace(ore, gs) + c);
    } }
  h = h.replace(/<div class="pricerow" data-eur="(\d+)"([^>]*)>[\s\S]*?<\/div>/g, (m, eur, rest) => (+eur ? `<div class="pricerow" data-eur="${eur}"${rest}><span class="price">${fe(+eur * r)}</span><span class="peur">${L.card}</span></div>` : m));
  return h.replace(/<div class="ca-vat( ca-new)?" data-eur="(\d+)"([^>]*)>[\s\S]*?(?=<div class="taxnote">)/g, (m, nw, eur, rest) => {
    const n = +eur; if (!n) return m;
    let b = `<div class="ca-vat${nw || ''}" data-eur="${eur}"${rest}><div class="plabel">${nw ? L.newl + ' · ' : ''}${L.lab}</div><div class="price ca-pv">${fe(n * r)}</div>`;
    b += `<div class="ca-vatv" ${vs}><b>${fe(n)}</b> ${L.net} — ${L.netc}.</div>`;
    if (l === 'de') b += `<div class="ca-vatv" ${vs}>${L.del}</div>`;
    else if (nw) b += `<div class="ca-vatv" ${vs}>${L.newx}</div>`;
    else b += `<div class="ca-vatv" ${vs}><b>${fe(n * 1.19)}</b> ${L.pick}.</div>`;
    return b + '</div>';
  });
}
/* a „taxnote” (hívjon minket) és a mailto-tárgy */
const SUBJ = { de: 'Angebotsanfrage', fr: 'Demande d’offre', it: 'Richiesta di offerta', es: 'Solicitud de oferta' };
function mailSubj(h, l) {
  return h.replace(/(mailto:[^"?']+\?subject=)([^"&']*)/g, (m, a, s) => { // a ' kizárva: JS-kódban ('…?subject='+x) nem nyúlunk hozzá
    if (!s) return m;
    let d; try { d = decodeURIComponent(s); } catch (e) { return m; }
    d = d.replace(/^(Žiadosť o ponuku|Dopyt|Ponuka)\s*:?/i, SUBJ[l] + ':');
    return a + encodeURIComponent(d);
  });
}

/* ---------- kapcsolat, cégadatok, csapat ---------- */
function localize(h, l) {
  for (const [a, b] of EU.replace) h = h.split(a).join(b);
  for (const [re, b] of EU.replaceRe) h = h.replace(new RegExp(re, 'g'), b);
  for (const [re, b] of EU.fix || []) h = h.replace(new RegExp(re, 'g'), typeof b === 'string' ? b : b[l]);
  for (const t of EU.team) {
    h = h.split(t.from).join(t.img);
    const flags = (cls, w) => t.flags.map((c) => `<span class="${cls}" style="background-image:url(https://flagcdn.com/${w}/${c}.png)"></span>`).join('');
    h = h.replace(new RegExp(`(<img src="${t.img.replace(/[.?]/g, '\\$&')}"[\\s\\S]{0,400}?<span class="kap-flags">)([\\s\\S]*?)(</span></div>)`, 'g'), (m, a, f, c) => a + flags('kap-rflag', 'w40') + c);
    h = h.replace(new RegExp(`(<img src="${t.img.replace(/[.?]/g, '\\$&')}"[\\s\\S]{0,600}?<div class="tc-flags"[^>]*>)([\\s\\S]*?)(</div>)`, 'g'), (m, a, f, c) => a + t.flags.map((cc) => `<span class="tc-flag" style="background-image:url(https://flagcdn.com/w80/${cc}.png)"></span>`).join('') + c);
  }
  return h;
}

/* ---------- nyelvváltó (nyelvenként a saját slug) ---------- */
function switcher(h, cur, P) {
  const opts = (cls) => SW.map(([c, name, flag]) => `<a hreflang="${HL[c]}" class="${cls}" href="/eu/${c}${P[c]}"${c === cur ? ' aria-current="true"' : ''}><span class="lf" style="background-image:url(https://flagcdn.com/w80/${flag}.png)"></span><span>${name}</span></a>`).join('');
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
  h = h.split(/(<script\b[\s\S]*?<\/script>)/i).map((part, pi) => (pi % 2 ? part : part.replace(/(<option\b[^>]*>)([^<]*\p{L}[^<]*)(<\/option>)/gu, (m, a, txt, b) => {
    const t = tr(txt); if (t == null) return m;
    return a + txt.match(/^\s*/)[0] + t + txt.match(/\s*$/)[0] + b;
  }))).join('');
  const look0 = (txt) => { const { k, nums } = maskNums(txt.trim().replace(/\s+/g, ' ')); if (!k) return null; const t = look1(D, l, k) ?? fb(D, l, k); return t == null || t === k ? null : unmaskNums(t, nums); };
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
  // attribútumok (űrlap-értékek): a szkriptben lefordított szövegekkel egyezzenek
  const deAttr = (v) => v.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  const enAttr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  h = h.split(/(<script\b[\s\S]*?<\/script>)/i).map((part, pi) => (pi % 2 ? part : part.replace(/(\s(?:data-buyer|data-val|value|placeholder|title|alt|aria-label)=")([^"]*\p{L}[^"]*)(")/gu, (m, a, v, c) => {
    if (!/\s/.test(v.trim()) && !/[áäčďéíĺľňóôŕšťúýž]/i.test(v)) return m;
    const t = look0(deAttr(v)); return t == null ? m : a + enAttr(t) + c;
  }))).join('');
  // rádiógomb értéke = a látható felirata
  h = h.replace(/(<input type="radio"[^>]*?value=")[^"]*("[^>]*>)(<span id="\w+Label"[^>]*>)([^<]*)(<\/span>)/g, (m, a, b2, s1, t, s2) => a + t.replace(/"/g, '&quot;') + b2 + s1 + t + s2);
  // GYIK-kereső: data-text a lefordított kérdésből és válaszból
  h = h.replace(/(<details\b[^>]*\sdata-text=")[^"]*("[^>]*>)([\s\S]*?)(<\/details>)/g, (m, a, b2, inner, c) => {
    const t = inner.replace(/<span class="pl"[^>]*>\+<\/span>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().replace(/"/g, '&quot;');
    return a + t + b2 + inner + c;
  });
  return { h, cover: tot ? (tot - st.miss) / tot : 1 };
}

/* ---------- nyelvválasztó főoldal (x-default) ---------- */
function rootPage(P0) {
  const T = {
    de: ['Deutschland', 'Langzeitmiete, Premium-Gebrauchtwagen und Neuwagen nach Wunsch'],
    fr: ['France', 'Location longue durée, voitures premium d’occasion et voitures neuves sur mesure'],
    it: ['Italia', 'Noleggio a lungo termine, auto premium usate e auto nuove su misura'],
    es: ['España', 'Renting, coches premium de ocasión y coches nuevos a medida']
  };
  const alts = LANGS.map((x) => `<link rel="alternate" hreflang="${HL[x]}" href="${SITE}/${x}/">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE}/">`;
  const cards = LANGS.map((x) => `<a class="c" href="/${x}/" hreflang="${HL[x]}" lang="${x}"><span class="f" style="background-image:url(https://flagcdn.com/w80/${x}.png)"></span><b>${T[x][0]}</b><small>${T[x][1]}</small></a>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CarAdvance — Deutschland · France · Italia · España</title>
<meta name="description" content="CarAdvance (Caradvance GmbH, Geretsried): Langzeitmiete · location longue durée · noleggio a lungo termine · renting — premium cars from Germany.">
<link rel="canonical" href="${SITE}/">
${alts}
${EU.live ? '' : '<meta name="robots" content="noindex,nofollow">'}
<link rel="icon" href="/favicon.ico">
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#0B0B0D;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}main{padding:32px 20px;max-width:880px;width:100%;text-align:center}img{width:220px;height:auto;margin-bottom:26px}h1{font-size:24px;margin:0 0 26px;font-weight:700}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}.c{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 16px;border:1px solid #2a2b31;border-radius:14px;background:#141418;color:#fff;text-decoration:none;transition:border-color .2s}.c:hover{border-color:#e30613}.f{width:44px;height:30px;border-radius:4px;background-size:cover;background-position:center}.c b{font-size:18px}.c small{color:#b9bcc4;font-size:13px;line-height:1.45}p{color:#8d9099;font-size:13px;margin-top:26px}</style></head>
<body><main><img src="/caradvance-logo-white-eu-de.webp" alt="CarAdvance" width="220" height="73"><h1>CarAdvance — Premium cars · Caradvance GmbH</h1><div class="g">${cards}</div>
<p>Caradvance GmbH · Bgm.-Graf-Ring 21 · 82538 Geretsried · ${EU.phone} · ${EU.email}</p></main></body></html>`;
}

function run() {
  if (!fs.existsSync(SK)) return 'nincs dist/sk';
  const { D, bad } = dicts();
  const EXC = new RegExp(EU.exclude || '^$');
  const list = pages(SK).filter((rel) => !/^icons\//.test(rel) && !EXC.test(rel));
  const map = Object.fromEntries(LANGS.map((l) => [l, new Map(list.map((rel) => [rel, slugOf(rel, l)]))]));
  const skAbs = (p, l) => { const q = p.replace(/^\//, ''); const b = q.split(/[?#]/)[0]; const n = b === '' ? '' : (b.endsWith('/') ? b : b + '/'); return map[l].has(n) ? '/' + map[l].get(n) + q.slice(b.length) : null; };
  const miss = new Map();
  const stat = Object.fromEntries(LANGS.map((l) => [l, [0, 0]]));
  const okp = Object.fromEntries(LANGS.map((l) => [l, new Set()]));
  let written = 0;
  fs.rmSync(OUT, { recursive: true, force: true });

  for (const rel of list) {
    const src = fs.readFileSync(path.join(SK, rel, 'index.html'), 'utf8');
    if (/http-equiv=["']?refresh/i.test(src)) continue;
    const P = Object.fromEntries(LANGS.map((l) => ['' + l, '/' + map[l].get(rel)]));
    for (const l of LANGS) {
      let { h, cover } = translate(src, l, D, rel, miss);
      stat[l][0] += cover; stat[l][1] += 1;
      const url = SITE + '/' + l + P[l];
      h = h.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${l}"`);
      h = h.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${url}">`);
      h = h.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${url}">`);
      h = h.replace(/<meta property="og:locale" content="[^"]*">/i, `<meta property="og:locale" content="${OG[l]}">`);
      h = h.replace(/[ \t]*<meta property="og:locale:alternate"[^>]*>\s*\n?/g, '');
      h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*\n?/g, '');
      const alts = LANGS.map((x) => `<link rel="alternate" hreflang="${HL[x]}" href="${SITE}/${x}${P[x]}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE}/">`;
      h = h.replace(/(<link rel="canonical" href="[^"]*">)/i, `$1\n${alts}`);
      // belső linkek: /sk/(en|de|hu)?/… → /eu/<l>/<saját slug>
      h = h.replace(/(\s(?:href|action)=")\/sk(?:\/(en|de|hu))?(\/[^"]*)?"/g, (m, a, lg, q) => {
        const p2 = skAbs(q || '/', l);
        if (!p2) { const qq = (q || '/').replace(/^\//, '').split(/[?#]/)[0]; if (qq && EXC.test(qq.endsWith('/') ? qq : qq + '/')) return `${a}#ca-x"`; return /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(q || '') ? m : `${a}/eu/${l}/"`; }
        return `${a}/eu/${l}${p2}"`;
      });
      // relatív magyar visszalinkek (pl. "../../autoink/") → autólista
      h = h.replace(/href="(?:\.\.\/)+autoink\/"/g, `href="/eu/${l}/${EU.slugSeg[l].auta}/"`);
      // autó-adatlap relatív linkjei ("../auto/…", "../../auto/…") → a nyelv saját útvonala (fr: voiture, es: coche)
      h = h.replace(/(href="|['"])(?:\.\.\/)+auto\//g, (m, q) => `${q}/eu/${l}/${EU.slugSeg[l].auto}/`);
      h = h.replace(/https:\/\/www\.caradvance\.sk(\/(?:en|de|hu)(?=\/))?(\/[^"\\\s<]*)?/g, (m, lg, q) => { const p2 = skAbs(q || '/', l); return p2 ? SITE + '/' + l + p2 : m; });
      h = h.split('/i18n/rt-sk.js').join(`/i18n/rt-eu-${l}.js`);
      h = h.replace(/data-idx="\/sk\/kereses-index\.json" data-lang="sk"/g, `data-idx="/eu/${l}/kereses-index.json" data-lang="${l}"`);
      h = switcher(h, l, P);
      h = localize(h, l);
      h = h.replace(/(<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>)([\s\S]*?)(<\/script>)/gi, (all, a, js, b) => a + js.split('document.documentElement.lang').join("(/^(de|fr|it|es)$/.test(document.documentElement.lang)&&/caradvance\\.eu$|\\/eu\\//.test(location.hostname+location.pathname)?'sk':document.documentElement.lang)").replace(/var MON=\[[^\]]*\]/, 'var MON=' + EU.monRe) + b);
      h = h.replace(/<a\b([^>]*)\shref="#ca-x"([^>]*)>([\s\S]*?)<\/a>/g, (m, x, y, t, off, all) => (/\bclass=/.test(x + y) || (all[off - 1] === '>' && all[off + m.length] === '<') ? '' : t));
      h = euVat(h, l);
      // a menüből kimarad az import főpont (a linkjei már kiestek, csak egy üres lenyíló maradna)
      h = h.replace(/<li class="navitem"><button class="navlink" type="button">[^<]*<span class="chev">⌄<\/span><\/button><div class="dropdown"><div class="dd-inner">\s*<div class="ddi-sub"><div class="flyout"><\/div><\/div>(?:<a class="ddi" href="[^"]*"[^>]*>[^<]*<\/a>\s*)?<\/div><\/div><\/li>/g, '');
      h = h.replace(/<div id="ca-acct" data-lang="sk" data-links="[^"]*">/g, `<div id="ca-acct" data-lang="${l}" data-links="${JSON.stringify({ privacy: '/eu/' + l + '/' + EU.slugSeg[l]['ochrana-osobnych-udajov'] + '/', contact: '/eu/' + l + '/' + EU.slugSeg[l].kontakt + '/' }).replace(/"/g, '&quot;')}">`);
      h = h.replace(/<div class="tq-co-card">(?:(?!<div class="tq-co-card">)[\s\S])*?<h3>Mr\. Job SK s\.r\.o\.<\/h3>[\s\S]*?<\/p>\s*<\/div>/g, '');
      h = h.replace(/<dt>(?:IČ DPH|IČ\u00a0DPH)<\/dt>/g, '<dt>' + { de: 'USt-IdNr.', fr: 'N° de TVA', it: 'Partita IVA', es: 'NIF-IVA' }[l] + '</dt>');
      h = mailSubj(h, l);
      h = h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, '');
      const noidx = !EU.live || cover < MIN_COVER;
      if (noidx) h = h.replace(/<\/head>/i, '<meta name="robots" content="noindex,nofollow">\n</head>');
      else okp[l].add(P[l]);
      const f = path.join(OUT, l, map[l].get(rel), 'index.html');
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, h); written++;
    }
  }
  fs.writeFileSync(path.join(OUT, 'index.html'), rootPage());

  // _slugs.json: régi magyar / szlovák címek → német cím (a middleware 301-et ad)
  const slugs = {};
  try { const sks = JSON.parse(fs.readFileSync(path.join(SK, '_slugs.json'), 'utf8')); for (const [hu, s] of Object.entries(sks)) { const p2 = skAbs(s, 'de'); if (p2) slugs[hu] = '/de' + p2; } } catch (e) {}
  for (const [rel, p] of map.de) if (rel) slugs['/' + rel] = '/de/' + p;
  for (const k of Object.keys(slugs)) if (/^\/(de|fr|it|es)\//.test(k) || slugs[k] === k) delete slugs[k];
  fs.writeFileSync(path.join(OUT, '_slugs.json'), JSON.stringify(slugs));

  // robots.txt + sitemap.xml (xhtml:link alternatívákkal)
  const now = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), EU.live ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  const urls = [];
  for (const rel of list) for (const l of LANGS) {
    const p = '/' + map[l].get(rel); if (!okp[l].has(p)) continue;
    const alt = LANGS.map((x) => `<xhtml:link rel="alternate" hreflang="${HL[x]}" href="${SITE}/${x}/${map[x].get(rel)}"/>`).join('');
    urls.push(`  <url><loc>${SITE}/${l}${p}</loc><lastmod>${now}</lastmod>${alt}</url>`);
  }
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);

  // keresőindex nyelvenként
  const idxf = path.join(SK, 'kereses-index.json');
  if (fs.existsSync(idxf)) {
    const base = JSON.parse(fs.readFileSync(idxf, 'utf8'));
    const NUM = /\d+(?:[.,   ]\d+)*/g;
    const trs = (l, s) => { if (!s) return s; const nums = []; const k = String(s).replace(/\s+/g, ' ').trim().replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; }); const t = lookup(D, l, k); return t == null ? s : t.replace(/\{(\d+)\}/g, (m, i) => (nums[+i - 1] !== undefined ? nums[+i - 1] : m)); };
    for (const l of LANGS) {
      const d = JSON.parse(JSON.stringify(base)); d.lang = l;
      d.items = d.items.filter((x) => { const u = String(x.u || ''); return !/^\/sk\//.test(u) || skAbs(u.slice(3), l); }).map((x) => {
        for (const k of ['t', 'd', 'h']) if (x[k]) x[k] = localize(trs(l, x[k]), l);
        if (x.x) x.x = String(x.x).split(' · ').map((s) => trs(l, s)).join(' · ');
        const u = String(x.u || '');
        if (u.startsWith('/sk/')) {
          const p2 = skAbs(u.slice(3), l); x.u = '/eu/' + l + p2;
          try {
            const ph = fs.readFileSync(path.join(OUT, l, p2.split(/[?#]/)[0], 'index.html'), 'utf8');
            const dec = (v) => String(v || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
            const tt = (ph.match(/<title>([\s\S]*?)<\/title>/) || [])[1]; if (tt) x.t = dec(tt).replace(/\s*[|—–-]\s*CarAdvance\s*$/i, '');
            const dd = (ph.match(/<meta name="description" content="([^"]*)"/) || [])[1]; if (dd) x.d = dec(dd).slice(0, 160);
            const pe = (ph.match(/<div class="ca-vat(?: ca-new)?" data-eur="(\d+)"/) || [])[1]; if (pe && +pe && x.ep) { x.ep = Math.round(+pe * (1 + VAT[l] / 100)); if (x.p) x.p = Math.round(x.ep * (d.eur || 390)); }
            const h1 = (ph.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1]; if (h1) x.h = dec(h1);
            if (x.x) { const hs = [...ph.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) => dec(m[1])).filter(Boolean); if (hs.length) x.x = hs.slice(0, 14).join(' · ').slice(0, 400); }
          } catch (e) {}
        }
        return x;
      });
      const js = localize(JSON.stringify(d), l);
      fs.mkdirSync(path.join(OUT, l), { recursive: true });
      fs.writeFileSync(path.join(OUT, l, 'kereses-index.json'), js);
      fs.writeFileSync(path.join(DIST, 'kereses-index-eu-' + l + '.json'), js);
    }
  }

  // futásidejű fordító: rt-eu-de.js … rt-eu-es.js
  const part = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); return i < 0 || j < 0 ? null : [i, j]; };
  const rd = (f) => (fs.existsSync(path.join(DIST, 'i18n', f)) ? fs.readFileSync(path.join(DIST, 'i18n', f), 'utf8') : null);
  const rtSk = rd('rt-sk.js');
  let rtn = 0;
  if (rtSk) {
    let CHR = { it: { M: {}, G: {} } }; try { CHR = Object.assign(CHR, JSON.parse(fs.readFileSync('ch-site-rt.json', 'utf8'))); } catch (e) {}
    let EUR = { es: { M: {}, G: {} }, it: { M: {}, G: {} } }; try { EUR = Object.assign(EUR, JSON.parse(fs.readFileSync('eu-site-rt.json', 'utf8'))); } catch (e) {}
    const MG = (b) => { const a = part(b, 'var M=', ';var G='), g = part(b, 'var G=', ';var GN='); try { return { M: JSON.parse(b.slice(a[0] + 6, a[1])), G: JSON.parse(b.slice(g[0] + 6, g[1])) }; } catch (e) { return { M: {}, G: {} }; } };
    const rtFr = rd('rt-fr.js'); const FR = rtFr ? MG(rtFr) : { M: {}, G: {} };
    const slR = part(rtSk, 'var SL=', 'var M=');
    const okv = (v) => v != null && !SWISS.test(v);
    for (const l of LANGS) {
      let b = rd(l === 'de' ? 'rt-sk-de.js' : 'rt-sk-en.js'); if (!b) continue;
      const sl = rtSk.slice(slR[0], slR[1]).replace(/"\/sk(\/[^"]*)"/g, (m, q) => { const p2 = skAbs(q, l); return p2 ? `"/eu/${l}${p2}"` : /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(q) ? m : `"/eu/${l}/"`; });
      const s2 = part(b, 'var SL=', 'var M='); if (s2) b = b.slice(0, s2[0]) + sl + b.slice(s2[1]);
      const mR = part(b, 'var M=', ';var G='), gR = part(b, 'var G=', ';var GN=');
      if (mR && gR) {
        const T = MG(b); const M = {}, G = {};
        const pick = (g, k) => {
          const E = EUR[l] && EUR[l][g] && EUR[l][g][k];
          if (okv(E)) return E;
          if (l === 'fr') return okv(FR[g][k]) ? FR[g][k] : T[g][k];
          if (l === 'it') { const c = CHR.it[g][k]; return okv(c) ? c : T[g][k]; }
          return T[g][k];
        };
        for (const k of Object.keys(T.M)) { const v = pick('M', k); if (v != null) M[k] = localize(v, l); }
        for (const k of Object.keys(T.G)) { const v = pick('G', k); if (v != null) G[k] = localize(v, l); }
        b = b.slice(0, mR[0]) + 'var M=' + JSON.stringify(M) + ';var G=' + JSON.stringify(G) + b.slice(gR[1]);
        b = b.replace(/var GN=\d+/, 'var GN=' + Object.keys(G).length);
      }
      b = b.replace(/var LG="[a-z]+"/, `var LG="${l}"`);
      const extra = `try{var CC2=window.CA_CFG;if(CC2){CC2.PHONE=${JSON.stringify(EU.phone)};CC2.WHATSAPP='https://wa.me/${EU.wa}';}}catch(e){}`;
      b = b.replace(/if\(\/\(\^\|\\\\?\.\)caradvance\\\\?\.\(sk\|cz\)\$\/\.test\(location\.hostname\)\)DOMSTRIP=\/\^\\\\?\/\(sk\|cs\)\\\\?\/\/;/, '')
        .replace('var UNITS=', `${extra}if(/(^|\\.)caradvance\\.eu$/.test(location.hostname))DOMSTRIP=/^\\/eu\\//;var UNITS=`)
        .replace('var UNITS={', 'var UNITS={it:{m:"/mese",p:"da"},es:{m:"/mes",p:"desde"},')
        .replace(/^\/\* CarAdvance i18n runtime \([^)]*\) \*\//, `/* CarAdvance i18n runtime (caradvance.eu, ${l}) */`);
      fs.writeFileSync(path.join(DIST, 'i18n', `rt-eu-${l}.js`), b); rtn++;
    }
  }

  // _routes.json: /es/* kell; hely a 100-as korláton belül (összevonás: /berles*, /vasarlas*)
  try {
    const rp = path.join(DIST, '_routes.json'); const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    const res = ['/belso/ajanlatmotor/*', '/ajanlat/auto/*'].filter((w) => !r.include.includes(w)).length;
    const want = LANGS.map((x) => '/' + x + '/*').filter((x) => !r.include.includes(x));
    const MERGE = [['/berles*', ['/berles-elonyei/*', '/berles-gyakori-kerdesek/*', '/berlesi-folyamat/*', '/berlesi-feltetelek/*']], ['/vasarlas*', ['/vasarlas-elonyei/*', '/vasarlas-gyakori-kerdesek/*']]];
    for (const [to, from] of MERGE) {
      if (r.include.length + (r.exclude || []).length + res + want.length <= 100) break;
      if (from.filter((x) => r.include.includes(x)).length < 2) continue;
      r.include = r.include.filter((x) => !from.includes(x)); r.include.push(to);
    }
    r.include.push(...want);
    if (r.include.length + (r.exclude || []).length + res <= 100) { fs.writeFileSync(rp, JSON.stringify(r, null, 2)); console.log('[eu-site] _routes.json: ' + (r.include.length + (r.exclude || []).length) + ' szabály (+' + res + ' am-routes)'); }
    else console.log('[eu-site] _routes.json: több mint 100 szabály, nem írtam át');
  } catch (e) {}

  try {
    const all = [...miss].map(([k, m]) => ({ k, p: m.p, l: [...m.l], n: m.n, en: (m.raw && look1(D, 'en', m.raw)) || null, de: (m.raw && look1(D, 'de', m.raw)) || null, raw: m.raw !== k ? m.raw : undefined }));
    fs.writeFileSync(path.join(DIST, '_eu-missing.json'), JSON.stringify(all));
    // darabolva is (≤ 45 000 karakter / fájl), hogy egyszerűen letölthető legyen: _eu-missing-1.json …
    const parts = []; let cur = [], sz = 0;
    for (const x of all) { const t = JSON.stringify(x).length; if (cur.length && sz + t > 45000) { parts.push(cur); cur = []; sz = 0; } cur.push(x); sz += t; }
    if (cur.length) parts.push(cur);
    for (const f of fs.readdirSync(DIST)) if (/^_eu-missing-\d+\.json$/.test(f)) fs.rmSync(path.join(DIST, f));
    parts.forEach((p, i) => fs.writeFileSync(path.join(DIST, '_eu-missing-' + (i + 1) + '.json'), JSON.stringify(p)));
    fs.writeFileSync(path.join(DIST, '_eu-missing-n.json'), JSON.stringify({ n: all.length, parts: parts.length }));
  } catch (e) {}
  const pct = (l) => (100 * stat[l][0] / Math.max(1, stat[l][1])).toFixed(1) + '%';
  return `[eu-site] ${written} oldal (${LANGS.map((l) => l + ' ' + pct(l)).join(' | ')}), hiányzó egység ${miss.size}, hibás fordítás ${bad}, runtime ${rtn}, ${EU.live ? 'ÉLES' : 'noindex'}`;
}

try { console.log(run()); } catch (e) { console.log('[eu-site] hiba: ' + (e && e.stack || e)); }
