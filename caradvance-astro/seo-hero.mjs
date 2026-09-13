// Build lepes: a hero-k egységesítése MINDEN oldalon.
//
// MIERT
// A kezdőlap, az autoink és a többi, megosztott ".hero" osztályt használó oldal
// hero-ja azonos, DE a ".inner" felső margója (64px) túl sok üres teret hagy a hero
// tetején. Ezt egységesen 24px-re csökkentjük az összes dist HTML-ben, így a hero-k
// felső térköze és pozíciója pontosan ugyanaz lesz. Idempotens; hiba esetén exit 0.
import fs from 'node:fs';

const FROM = '.inner{position:relative;z-index:2;max-width:1120px;margin:64px auto 0}';
const TO   = '.inner{position:relative;z-index:2;max-width:1120px;margin:24px auto 0}';

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

try {
  let done = 0;
  for (const f of walk('dist')) {
    let h = fs.readFileSync(f, 'utf8');
    if (h.includes(FROM)) { h = h.split(FROM).join(TO); fs.writeFileSync(f, h); done++; }
  }
  console.log('seo-hero: hero felső térköz egységesítve ' + done + ' oldalon');
} catch (e) {
  console.log('seo-hero: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
}

// Egyedi lista szűrők (Keresés + Minden modell/karosszéria/üzemanyag) igazítása
// az autoink szűrők stílusához: 46px magasság, 12/14px padding, 14px betű, finom árnyék.
try {
  const EF = 'dist/egyedi-auto-rendeles/index.html';
  const MARK = 'cd-egl-filter-align';
  if (fs.existsSync(EF)) {
    let h = fs.readFileSync(EF, 'utf8');
    if (!h.includes(MARK) && h.includes('</head>')) {
      const css = '<style id="' + MARK + '">' +
        '.egl-filters .egl-search,.egl-filters select{height:46px!important;padding:12px 14px!important;font-size:14px!important;border:1px solid #e2e5ea!important;border-radius:12px!important;box-shadow:0 1px 2px rgba(8,8,10,.05)!important;}' +
        '.egl-filters select{padding:12px 40px 12px 14px!important;}' +
        '</style>';
      h = h.replace('</head>', css + '</head>');
      fs.writeFileSync(EF, h);
      console.log('seo-hero: egyedi szűrők igazítva az autoink stílushoz');
    } else { console.log('seo-hero: egyedi szűrők - nincs teendő'); }
  }
} catch (e) {
  console.log('seo-hero: egyedi szűrő FIGYELEM - ' + (e && e.message));
}
process.exit(0);
