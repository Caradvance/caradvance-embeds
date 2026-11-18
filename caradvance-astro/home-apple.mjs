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
  // Kínálat: a szekció ne legyen külön (melegebb) téglalap; a bérlési kártya árnyéka és a gomb piros ragyogása halkabb
  + 'html.ca-light body #autoink.ca-show,html.ca-light body #autoink.ca-show.ca-stg-on{background:transparent!important;background-color:transparent!important;background-image:none!important}'
  + 'html.ca-light body #autoink #ca-stg .stg-card.card.on,html.ca-light body #autoink #ca-stg .stg-card{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.78))!important;box-shadow:inset 0 1px 0 #fff,0 1px 2px rgba(0,0,0,.04),0 12px 32px rgba(0,0,0,.06)!important}'
  + 'html.ca-light body #autoink #ca-stg :is(.ca-inq,.sub-btn,.btn-red,.btn-primary,.stg-ar.stg-n){box-shadow:none!important}'
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
