// hu-legal.mjs — jogi oldalak (HU): Adatkezelési tájékoztató, ÁSZF, Impresszum — ugyanabban a stílusban, mint a Feltételek és kaució oldal
// · kompakt, sötét fejléc puha átmenettel az oldalba, pirulás dokumentum-fülek
// · okos tartalomjegyzék (aktuális fejezet, olvasási csík, %), mobilon ragadós „Tartalom” sáv lenyíló listával
// · fejezetek külön üvegkártyán piros számjelvénnyel; táblák kártyasorokként; adatlisták (név–érték) letisztult sorokban
// A szöveg, a címek és a SEO nem változik (a hu-bft.mjs közös elrendezését használja, a Feltételek-specifikus részek nélkül). Idempotens.
import fs from 'node:fs';
import path from 'node:path';
import { BFT_CSS, BFT_JS } from './hu-bft.mjs';

const DIST = process.argv[2] || 'dist';
const PAGES = ['adatkezeles', 'aszf', 'impresszum'];
const P = 'html.ca-lgl body .lg ';
const D = 'html.ca-lgl.ca-dark body .lg ';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const EXTRA = ''
  // fülek a fejlécben
  + P + '.lg-tabs{justify-content:center;margin-top:22px!important;gap:8px!important}'
  + P + '.lg-tabs a{height:40px;display:inline-flex!important;align-items:center;padding:0 18px!important;border-radius:999px!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.16)!important;color:#fff!important;transition:background .2s,border-color .2s}'
  + P + '.lg-tabs a:hover{background:rgba(255,255,255,.16)!important}'
  + P + '.lg-tabs a.on{background:' + RED + '!important;border-color:' + RED + '!important;box-shadow:0 10px 24px rgba(226,0,26,.35)}'
  + P + '.lg-upd{margin-top:12px!important}'
  // tartalomjegyzék nélküli oldal (Impresszum)
  + P + '.lg-body:not(:has(.lg-toc)){grid-template-columns:minmax(0,1fr)!important;max-width:920px!important}'
  + P + '.lg-body:not(:has(.lg-toc)) .ca-mt{display:none!important}'
  + P + '.ca-sec>h2:not(:has(.ca-no))::before{content:"";flex:none;width:10px;height:10px;border-radius:50%;background:' + RED + ';background-color:' + RED + '!important;box-shadow:0 0 0 5px rgba(226,0,26,.14)}'
  // adatlisták (dl)
  + P + '.ca-sec dl{display:grid!important;grid-template-columns:minmax(160px,240px) minmax(0,1fr)!important;gap:0!important;margin:0 0 16px!important;border-radius:18px;overflow:hidden;background:rgba(18,19,23,.035)}'
  + D + '.ca-sec dl{background:rgba(255,255,255,.05)}'
  + P + '.ca-sec dt,' + P + '.ca-sec dd{padding:12px 18px!important;margin:0!important;border-top:1px solid ' + LN + ';font-size:15px!important;line-height:1.55}'
  + D + '.ca-sec dt,' + D + '.ca-sec dd{border-top-color:rgba(255,255,255,.07)}'
  + P + '.ca-sec dt:first-of-type,' + P + '.ca-sec dt:first-of-type+dd{border-top:0}'
  + P + '.ca-sec dt{font-weight:700!important;color:inherit!important;opacity:.6}'
  + P + '.ca-sec dd{font-weight:600}'
  + '@media(max-width:640px){' + P + '.ca-sec dl{grid-template-columns:1fr!important}' + P + '.ca-sec dd{border-top:0;padding-top:0!important}' + P + '.ca-sec dt{padding-bottom:4px!important}}'
  // többoszlopos táblák (adatkezelés): semleges cellák
  + P + '.lg-tw tbody td:last-child{color:inherit!important;font-weight:500!important}'
  + P + '.lg-tw tbody td:first-child{width:auto!important;font-weight:700}'
  + P + '.lg-tw{overflow-x:auto!important}'
  + P + '.lg-tw tbody td{vertical-align:top!important;font-size:14.5px!important}'
  // 3+ oszlopos táblák: soronként „adatkártya” (cím + címkézett mezők)
  + P + '.lg-tw.ca-rec{overflow:visible!important}'
  + P + '.lg-tw.ca-rec table{display:block!important;min-width:0!important;width:100%!important;border-spacing:0!important}'
  + P + '.lg-tw.ca-rec thead{display:none!important}'
  + P + '.lg-tw.ca-rec tbody{display:flex!important;flex-direction:column;gap:10px}'
  + P + '.lg-tw.ca-rec tbody tr{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 22px;padding:18px 20px;border-radius:18px;background:rgba(18,19,23,.035)}'
  + D + '.lg-tw.ca-rec tbody tr{background:rgba(255,255,255,.05)}'
  + P + '.lg-tw.ca-rec tbody tr:hover{transform:none}'
  + P + '.lg-tw.ca-rec tbody td{display:block!important;padding:0!important;background:none!important;border-radius:0!important;width:auto!important;font-size:14.5px!important;font-weight:500!important}'
  + P + '.lg-tw.ca-rec tbody td:first-child{grid-column:1/-1;font-size:16px!important;font-weight:800!important;padding-bottom:10px!important;border-bottom:1px solid ' + LN + '!important}'
  + D + '.lg-tw.ca-rec tbody td:first-child{border-bottom-color:rgba(255,255,255,.08)!important}'
  + P + '.lg-tw.ca-rec tbody td[data-l]::before{content:attr(data-l);display:block;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:' + RED + ';margin-bottom:3px}'
  + '@media(max-width:640px){' + P + '.lg-tw.ca-rec tbody tr{grid-template-columns:1fr;padding:16px}}'
  // gombok a szövegben (süti-beállítások)
  + P + '.lg-btn{border-radius:999px!important;box-shadow:0 8px 18px rgba(226,0,26,.25)}';

// 3+ oszlopos táblák címkézése (a táblázat a helyén marad, csak a megjelenés változik)
const REC = String.raw`$$(".lg-tw",root).forEach(function(w){var t=w.querySelector("table");if(!t)return;var hs=$$("thead th",t).map(function(x){return x.textContent.trim()});if(hs.length<3)return;w.classList.add("ca-rec");$$("tbody tr",t).forEach(function(r){$$("td",r).forEach(function(c,k){if(k>0&&hs[k])c.setAttribute("data-l",hs[k])})})});
`;

export function apply(h) {
  if (h.indexOf('id="ca-lgl-css"') > -1 || h.indexOf('class="lg-doc"') < 0 || h.indexOf('class="lg-tabs"') < 0) return null;
  const css = BFT_CSS.replace('</style>', EXTRA + '</style>').split('ca-bft').join('ca-lgl');
  let js = BFT_JS.split('ca-bft').join('ca-lgl')
    // a záró „sötét doboz” csak a Feltételek oldalé; itt a szövegben lévő gombos doboz a helyén marad
    .replace('if(lastBox&&lastBox.querySelector(".lg-btn"))', 'if(false)');
  if (js.indexOf('if(false)') < 0) throw new Error('[hu-legal] a hu-bft JS megváltozott');
  js = js.replace('})();</script>', () => REC + '})();</script>');
  h = h.replace('</head>', () => css + '</head>');
  return h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => js + '</body>');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  let n = 0;
  for (const s of PAGES) {
    const f = path.join(DIST, s, 'index.html'); if (!fs.existsSync(f)) continue;
    const o = apply(fs.readFileSync(f, 'utf8')); if (o) { fs.writeFileSync(f, o); n++; }
  }
  console.log('[hu-legal] jogi oldalak: ' + n);
}
