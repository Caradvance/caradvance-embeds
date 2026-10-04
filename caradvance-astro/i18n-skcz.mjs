/**
 * i18n-skcz.mjs — Szlovák (sk → caradvance.sk) és cseh (cs → caradvance.cz) változat (2026-10)
 *
 * A tükör (i18n-mirror.mjs) a sk/cs oldalakat ugyanúgy fordítja, mint a többi nyelvet; ez a modul
 * az országspecifikus utómunkát végzi:
 *   - Ft-összegek → EUR (sk) / CZK (cs), a src/i18n/intl-map.json "fx" árfolyamaival
 *     (a statikus HTML-ben build-időben, a JS által kirajzolt szövegben a runtime-ban);
 *   - a frankfurter.dev árfolyam-lekérést a sk/cs oldalon fix HUF-árfolyamra köti, így a
 *     visszaszámolt EUR-ár pontosan a forrás EUR-ár;
 *   - magyar telefonszámok → szlovák ügyfélszám, lábléc-képviselet → Mr. JOB SK s.r.o.;
 *   - jogi oldalak tájékoztató megjegyzése.
 */

export const CONTACT = {
  phone: '+421 915 410 555',
  tel: '+421915410555',
  wa: '421915410555',
  name: 'Mr. JOB SK s.r.o.',
  addr: 'Cesta na Senec 2/A, 821 04 Bratislava',
  ico: '52005445',
  dic: 'SK2120860148',
};

export const LBL = {
  sk: { rep: 'Zastúpenie na Slovensku', ico: 'IČO', dic: 'IČ DPH', note: 'Tento preklad má len informatívny charakter — právne záväzná je maďarská verzia.', name: 'Slovenčina', flag: 'sk' },
  cs: { rep: 'Zastoupení pro Česko a Slovensko', ico: 'IČO', dic: 'DIČ', note: 'Tento překlad má pouze informativní charakter — právně závazná je maďarská verze.', name: 'Čeština', flag: 'cz' },
};

/** Árfolyam-beállítás: 1 EUR = HUF Ft (a magyar oldal listája ezzel számol) ; 1 EUR = CZK Kč */
export function fxOf(M, l) {
  const fx = (M && M.fx) || {};
  const HUF = +fx.HUF || 368, CZK = +fx.CZK || 24.47;
  return l === 'cs' ? { HUF, T: CZK, S: 'Kč', R: 10, loc: 'cs-CZ', cur: 'CZK' } : { HUF, T: 1, S: '€', R: 1, loc: 'sk-SK', cur: 'EUR' };
}

/*
 * Önálló (ES5) átváltó függvény — build-időben (Node) és a böngészőben (runtime, toString-gel beágyazva)
 * ugyanez fut. F = { HUF, T, S, R, cur }.
 *   "500 000 Ft (1 349 €)"  → sk: "1 349 €"          cs: "33 010 Kč (1 349 €)"   (a forrás €-ár az irányadó)
 *   "660 000 Ft"            → sk: "1 793 €"          cs: "43 880 Kč"
 *   "15 mil. Ft"            → sk: "40 761 €"
 *   magában álló "Ft"       → "€" / "Kč"
 */
export function CONV(s, F) {
  if (!s || !/Ft\b|HUF\b/.test(s)) return s;
  var NB = ' ', SEP = '[ \\u00a0\\u202f\\u2009.]{1,2}';
  var NUM = '(\\d{1,3}(?:' + SEP + '\\d{3})+|\\d+)(?:,\\d{1,2})?';
  var SP = '[ \\u00a0\\u202f\\u2009]{0,2}';
  function n(a) { return +String(a).replace(/[^\d]/g, ''); }
  function g(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function fromEur(e) { var x = e * F.T; x = Math.round(x / F.R) * F.R; return g(x) + NB + F.S; }
  function fromHuf(h) { return fromEur(h / F.HUF); }
  // 0) árfolyam-megjegyzés "(1 € = 368 Ft)"
  s = s.replace(/\s?\(\s?1\s?€\s?[=≈]\s?\d[\d\s., ]*\s?(?:Ft|HUF)\s?\)/g, F.S === '€' ? '' : ' (1 € = ' + String(F.T).replace('.', ',') + ' ' + F.S + ')');
  // 1) Ft + zárójeles / pontos €-ár → a €-ár az irányadó
  s = s.replace(new RegExp(NUM + SP + '(?:Ft|HUF)\\b(\\s*)\\(\\s*' + NUM + SP + '€\\s*\\)', 'g'), function (m, a, sp, b) {
    return F.S === '€' ? g(n(b)) + NB + '€' : fromEur(n(b)) + sp + '(' + g(n(b)) + NB + '€)';
  });
  s = s.replace(new RegExp(NUM + SP + '(?:Ft|HUF)\\b\\s*·\\s*' + NUM + SP + '€', 'g'), function (m, a, b) {
    return F.S === '€' ? g(n(b)) + NB + '€' : fromEur(n(b)) + ' · ' + g(n(b)) + NB + '€';
  });
  // 2) "15 mil. Ft", "1,5 millió Ft"
  s = s.replace(new RegExp('(\\d+(?:[.,]\\d+)?)' + SP + '(?:mil\\.|mil|millió)' + SP + '(?:Ft|HUF)\\b', 'g'), function (m, a) { return fromHuf(parseFloat(a.replace(',', '.')) * 1e6); });
  // 3) sima Ft-összeg
  s = s.replace(new RegExp(NUM + SP + '(?:Ft|HUF)\\b', 'g'), function (m, a) { return fromHuf(n(a)); });
  // 4) magában álló címke
  s = s.replace(/\bFt\b/g, F.S).replace(/\bHUF\b/g, F.cur);
  // 5) EUR esetén maradék kettőzés: "1 349 € (1 349 €)"
  if (F.S === '€') s = s.replace(/(\d[\d   ]*[\u00a0 ]?€)(\s*\/\s*[^\s()<]{1,10})?\s*\(\s*\d[\d   ]* ?€\s*\)/g, '$1$2');
  return s;
}

/** Szöveg-szintű átváltás (HTML-szegmensen: előbb az &nbsp; entitásokat valódi karakterré alakítjuk) */
export function convText(s, F) {
  if (!s || !/Ft\b|HUF\b/.test(s)) return s;
  s = s.replace(/&(?:nbsp|#160|#xa0);/gi, ' ').replace(/&(?:#8239|#x202f|#8201|thinsp);/gi, ' ').replace(/&(?:euro|#8364);/gi, '€');
  return CONV(s, F);
}

/** EUR esetén a "1 450 € (1 450 €)" / "1 450 € · 1 450 €" kettőzés eltüntetése (HTML-szinten is, tagek között) */
function dedupe(h, F) {
  if (F.S !== '€') return h;
  const A = '(\\d[\\d\\u00a0\\u202f ]*\\u00a0?€)';
  const T = '(?:\\s|<[^>]+>)*';
  h = h.replace(new RegExp(A + '(' + T + ')\\(' + T + '\\d[\\d\\u00a0\\u202f ]*\\u00a0?€' + T + '\\)', 'g'), '$1$2');
  h = h.replace(new RegExp(A + '(' + T + ')·' + T + '\\d[\\d\\u00a0\\u202f ]*\\u00a0?€', 'g'), '$1$2');
  return h;
}

/** JSON-LD: offers HUF → EUR/CZK, szövegek átváltása */
function convLd(json, F) {
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o = {};
      const isHuf = v.priceCurrency === 'HUF';
      for (const [k, x] of Object.entries(v)) {
        if (isHuf && /^(price|lowPrice|highPrice)$/.test(k) && x !== '' && !isNaN(+x)) { let y = (+x / F.HUF) * F.T; y = Math.round(y / F.R) * F.R; o[k] = typeof x === 'number' ? y : String(y); }
        else if (isHuf && k === 'priceCurrency') o[k] = F.cur;
        else o[k] = walk(x);
      }
      return o;
    }
    if (typeof v === 'string') return convText(v, F).replace(/ /g, ' ');
    return v;
  };
  return walk(json);
}

/** A fordítók a "magyarországi képviselő: BH Group Zrt." mondatokat SK/CZ-re lokalizálták — az SK/CZ képviselő a Mr. JOB SK s.r.o. */
const REP = {
  sk: [[/2083 Solymár,?\s*Ibolya utca \d+\.?/g, 'Cesta na Senec 2/A, 821 04 Bratislava.'], [/Ibolya utca \d+\.?/g, 'Cesta na Senec 2/A'], [/2083 Solymár/g, '821 04 Bratislava'],
    [/\s?[—–-]\s?(?:cca\s)?(?:\d+|niekoľko|pár) minút od Budapešti/g, ''], [/Bratislava\.,/g, 'Bratislava,'], [/Bratislava\.\./g, 'Bratislava.'], [/so sídlom v Solymári pri Budapešti/g, 'so sídlom v Bratislave'], [/v Solymári \(pri Budapešti\)/g, 'v Bratislave'],
    [/v Solymári pri Budapešti/g, 'v Bratislave'], [/v Solymári/g, 'v Bratislave'], [/· Solymár/g, '· Bratislava'],
    [/Naša kancelária v Maďarsku je kancelária/g, 'Naša kancelária je kancelária'], [/nemá v Maďarsku vlastnú kanceláriu/g, 'nemá na Slovensku vlastnú kanceláriu'],
    [/Caradvance Maďarsko/g, 'Caradvance Slovensko'], [/pod názvom Caradvance Hungary/g, 'pod názvom Caradvance Slovensko'], [/BH Group Zrt\./g, 'Mr. JOB SK s.r.o.']],
  cs: [[/2083 Solymár,?\s*Ibolya utca \d+\.?/g, 'Cesta na Senec 2/A, 821 04 Bratislava.'], [/Ibolya utca \d+\.?/g, 'Cesta na Senec 2/A'], [/2083 Solymár/g, '821 04 Bratislava'],
    [/(?:,\s?Maďarsko)?\s?[—–-]\s?(?:cca\s)?(?:\d+|několik|pár) minut od Budapešti/g, ''], [/Bratislava\.,/g, 'Bratislava,'], [/Bratislava\.\./g, 'Bratislava.'], [/se sídlem v Solymáru u Budapešti/g, 'se sídlem v Bratislavě'], [/v Solymáru u Budapešti/g, 'v Bratislavě'],
    [/v Solymáru/g, 'v Bratislavě'], [/· Solymár/g, '· Bratislava'],
    [/Naše kancelář v Maďarsku je kancelář/g, 'Naše kancelář je kancelář'], [/nemá v Maďarsku vlastní kancelář/g, 'nemá v Česku vlastní kancelář'],
    [/Caradvance Maďarsko/g, 'Caradvance Česko'], [/pod názvem Caradvance Hungary/g, 'pod názvem Caradvance Česko'], [/BH Group Zrt\./g, 'Mr. JOB SK s.r.o.']],
};
function localRep(h, l) {
  const parts = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  for (let i = 0; i < parts.length; i += 2) for (const [re, to] of REP[l]) parts[i] = parts[i].replace(re, to);
  // JSON-LD is (szervezet / helyi vállalkozás)
  for (let i = 1; i < parts.length; i += 2) if (/application\/ld\+json/i.test(parts[i].slice(0, 80))) for (const [re, to] of REP[l]) parts[i] = parts[i].replace(re, to);
  return parts.join('');
}

/** Telefonszámok, WhatsApp, lábléc-képviselet */
function contact(h, l) {
  const C = CONTACT, L = LBL[l];
  h = h.replace(/wa\.me\/36\d{8,9}/g, 'wa.me/' + C.wa);
  h = h.replace(/tel:\+?36[\d\s()-]{8,14}\d/g, 'tel:' + C.tel);
  h = h.replace(/\+36[\s ]?\(?\d{1,2}\)?[\s -]?\d{3}[\s -]?\d{2}[\s -]?\d{2}/g, C.phone);
  h = h.replace(/\+36\d{8,9}/g, C.tel);
  // lábléc: a magyarországi képviselet sora (a fordítás után) → szlovák képviselő
  h = h.replace(/(<div class="cafoot-copy">[\s\S]*?<\/span>\s*<span>)[^<]*BH Group Zrt\.[^<]*(<\/span>)/,
    `$1${L.rep}: ${C.name} · ${C.addr} · ${L.ico}: ${C.ico} · ${L.dic}: ${C.dic}$2`);
  return h;
}

/** <head>-be: frankfurter-lekérés → fix HUF árfolyam (a visszaszámolás így pontos) */
export function headFx(F) {
  return `<script>(function(){var f=window.fetch;if(!f||f.__ca)return;var H=${F.HUF};var w=function(u,o){var s=String(u&&u.url||u);if(/frankfurter\\./.test(s)){var b=JSON.stringify({amount:1,base:'EUR',date:'',rates:{HUF:H}});return Promise.resolve(new Response(b,{status:200,headers:{'Content-Type':'application/json'}}))}return f.apply(this,arguments)};w.__ca=1;window.fetch=w;window.__CA_FX=${JSON.stringify({ HUF: F.HUF, T: F.T, S: F.S, R: F.R, cur: F.cur })};})();</script>`;
}

/** Runtime (rt-sk.js / rt-cs.js) kiegészítés: CUR() a JS által kirajzolt Ft-szövegekhez + domain-link */
export function runtimeJs(F) {
  return `var FX=${JSON.stringify({ HUF: F.HUF, T: F.T, S: F.S, R: F.R, cur: F.cur })};var CONV=${CONV.toString()};` +
    `CUR=function(s){return CONV(s,FX)};` +
    `try{var CC=window.CA_CFG;if(CC){CC.PHONE=${JSON.stringify(CONTACT.phone)};CC.WHATSAPP='https://wa.me/${CONTACT.wa}';}}catch(e){}` +
    `if(/(^|\\.)caradvance\\.(sk|cz)$/.test(location.hostname))DOMSTRIP=/^\\/(sk|cs)\\//;`;
}

/** Teljes sk/cs utófeldolgozás egy lefordított oldalon */
export function skczPost(h, l, F, legal = false) {
  const parts = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  // árfolyam-megjegyzés: "(1 € = <span id="rtFx">368</span> Ft)" → cs: "(1 € = 24,47 Kč)", sk: elhagyva (az id-s span rejtve marad a JS miatt)
  const rateTxt = F.S === '€' ? '' : `1 € = ${String(F.T).replace('.', ',')} ${F.S}`;
  const RATE_SPAN = /(\s?\(\s?|\s?[—–-]\s?)1\s?€\s?[=≈]\s?<span id="(\w+)">[^<]*<\/span>\s?(?:Ft|HUF|Kč|€)(\s?\))?/g;
  const RATE_TXT = /\s?\(\s?1\s?€\s?[=≈]\s?\d[\d\s., ]*\s?(?:Ft|HUF)\s?\)/g;
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(RATE_SPAN, (m, pre, id, post) => (rateTxt ? (/\(/.test(pre) ? ` (${rateTxt})` : pre + rateTxt) : '') + `<span id="${id}" style="display:none"></span>`)
      .replace(RATE_TXT, () => (rateTxt ? ` (${rateTxt})` : ''));
  }
  for (let i = 0; i < parts.length; i++) {
    const s = parts[i];
    if (i % 2 === 0) { parts[i] = convText(s, F); continue; }
    if (/^<script[^>]*application\/ld\+json/i.test(s)) {
      const m = s.match(/^(<script[^>]*>)([\s\S]*?)(<\/script>)$/i);
      try { parts[i] = m[1] + JSON.stringify(convLd(JSON.parse(m[2]), F)) + m[3]; } catch { /* hagyjuk */ }
    }
  }
  h = parts.join('');
  h = dedupe(h, F).replace(/(€|Kč)[ \u00a0]+([.,;])/g, '$1$2').replace(/((?:mes|měs)\.)\./g, '$1');
  h = contact(h, l);
  if (!legal) h = localRep(h, l);
  h = h.replace(/<head([^>]*)>/i, `<head$1>\n${headFx(F)}`);
  return h;
}

/**
 * Nyelvváltó: a seo-langsoon a sk/cs sort törli. A sk/cs oldalakon (és élesítés után minden oldalon)
 * visszatesszük őket a menübe a zh sor után. href(code) adja a cél-URL-t.
 */
export function addSwitch(h, codes, href, cur) {
  const mk = (cls, code) => `<a hreflang="${code}" class="${cls}" href="${href(code)}"${code === cur ? ' aria-current="true"' : ''}><span class="lf" style="background-image:url(https://flagcdn.com/w80/${LBL[code].flag}.png)"></span><span>${LBL[code].name}</span></a>`;
  for (const cls of ['langopt', 'm-langopt']) {
    if (h.includes(`hreflang="${codes[0]}" class="${cls}"`)) continue;
    const re = new RegExp(`(<a hreflang="zh-Hans" class="${cls}"[^>]*>[\\s\\S]*?<\\/a>)`);
    h = h.replace(re, (m) => m + codes.map((c) => mk(cls, c)).join(''));
  }
  return h;
}
