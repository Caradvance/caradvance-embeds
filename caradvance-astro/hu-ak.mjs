// hu-ak.mjs — Autót keresek (HU, /autot-keresek/): a kereső-kártya kicsit lejjebb, a Görgess jól látható helyen
// · asztalon a kártya kevésbé lóg fel a fejlécre, a Görgess a gombok és a kártya között, középen
// · mobilon (a többi oldalhoz hasonlóan) nincs Görgess, a kártya lejjebb kezdődik. A keresőhöz nem nyúl. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'autot-keresek', 'index.html');

const CSS = '<style id="ca-ak-css">'
  + 'html body main .ik{margin-top:-90px!important}'
  + 'html:root body main section.hero>button.scrolldown.scrolldown{display:flex!important;position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:112px!important;transform:translateX(-50%)!important;margin:0!important;z-index:6}'
  + '@media(max-width:640px){html body main .ik{margin-top:-40px!important}html:root body main section.hero>button.scrolldown.scrolldown{display:none!important}}'
  + '</style>';

export function apply(h) {
  if (h.indexOf('id="ca-ak-css"') > -1 || h.indexOf('class="ik"') < 0) return null;
  return h.replace('</head>', () => CSS + '</head>');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-ak] nincs', FILE); process.exit(0); }
  const o = apply(fs.readFileSync(FILE, 'utf8'));
  if (!o) console.log('[hu-ak] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-ak] autót keresek: kártya lejjebb, Görgess a helyén'); }
}
