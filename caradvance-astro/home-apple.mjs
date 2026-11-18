// Build lépés (a home-light.mjs és a home-contact.mjs után): a magyar főoldal VILÁGOS módja „Apple-letisztult” stílusban.
// Csak a HÁTTÉR változik: hűvös világosszürke (#F5F5F7), színes foltok nélkül. A kártyák és minden más
// változatlan (üvegkártyák, piros vonalak). A sötét mód nem változik. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');
const BG = '#F5F5F7', BGR = '245,245,247';
const L = 'html.ca-light body ';
const CSS = '<style id="ca-apple-css">'
  + 'html.ca-light,html.ca-light body{background:' + BG + '!important;background-image:none!important}'
  // színes foltok ki
  + L + ':is(#szolgaltatasok,#miert,#rolunk,#velemenyek,#ca-cta,.stats,#autoink,#ai-autokereso,#ca-contact,#gyik,.cav-sec){background:none!important;background-color:transparent!important}'
  // a videó alja lágyan olvad az új háttérbe
  + 'html.ca-light body section.hero:has(+#autoink)::after{background:linear-gradient(180deg,rgba(' + BGR + ',0) 0%,rgba(' + BGR + ',.18) 30%,rgba(' + BGR + ',.62) 62%,rgba(' + BGR + ',.92) 84%,' + BG + ' 100%)!important;background-color:transparent!important}'
  + '</style>';

try {
  if (!fs.existsSync(FILE)) console.log('[home-apple] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-apple-css"') > -1) console.log('[home-apple] már alkalmazva');
    else { h = h.replace('</head>', () => CSS + '</head>'); fs.writeFileSync(FILE, h); console.log('[home-apple] világos mód: Apple-letisztult stílus'); }
  }
} catch (e) { console.log('[home-apple] hiba:', e.message); }
