// Build lépés: a magyar főoldal (dist/index.html) mindig sötét témával jelenik meg,
// a készülék beállításától függetlenül. A meglévő automatikus sötét módot (public/dark-mode.js)
// használja a window.__CA_FORCE_DARK jelzővel; a többi oldal továbbra is a készüléket követi.
// A sötét módhoz tartozó főoldali finomhangolások (DARK_CSS) is ide kerülnek. Idempotens.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const FILE = path.join('dist', 'index.html');
const DM = path.join('dist', 'dark-mode.js');

// „Fénycsík” (jóváhagyott „A” változat): a fő szekcióhatárokon vékony, középen izzó piros fényvonal,
// ami a szélek felé elhalványul. A vonal a szekció szélességén belül marad (nincs vízszintes görgetősáv).
// (a home-tidy.mjs utáni sorrendhez: Szolgáltatások, Rólunk, Vélemények, Ajánlatkérés, lábléc)
const LINE_AT = [['#szolgaltatasok', 0], ['#rolunk', 0], ['#velemenyek', 0], ['#ca-cta', 0], ['footer.cafoot', 0]];
const GLOWS = LINE_AT.map(([sel, top]) => {
  const s = 'html.ca-dark ' + sel;
  return s + '{position:relative}'
    + s + '::after{content:"";position:absolute;left:6%;right:6%;top:' + top + 'px;height:1px;pointer-events:none;z-index:0;'
    + 'background:linear-gradient(90deg,transparent,rgba(255,40,60,.95) 50%,transparent);'
    + 'box-shadow:0 0 18px 2px rgba(226,0,26,.55),0 0 60px 8px rgba(226,0,26,.18)}';
}).join('');

// főoldali finomhangolás sötét témában (a dark-mode.js automatikus átszínezése után)
const DARK_CSS = '<style id="ca-dark-home-css">'
  + 'html.ca-dark,html.ca-dark body{background-color:#0D0F13!important}'
  // piros árnyalatok erőssége (jóváhagyott erősség)
  + 'html.ca-dark{--ca-red:.38}'
  // az Autóink színpad alja lágyan beleolvad az oldal hátterébe, piros ragyogással a két blokk között
  + 'html.ca-dark #autoink.ca-show{border-bottom-left-radius:0!important;border-bottom-right-radius:0!important;padding-bottom:64px!important;'
  + 'background:radial-gradient(ellipse 46% 36% at 50% 46%,rgba(255,255,255,.09),transparent 72%),radial-gradient(ellipse 55% 26% at 50% 82%,rgba(226,0,26,calc(var(--ca-red,.24)*1.1)),transparent 75%),linear-gradient(180deg,#17181d 0%,#121317 45%,#0f1014 75%,#0D0F13 100%)!important}'
  + 'html.ca-dark #autoink.ca-show::after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;pointer-events:none;background:linear-gradient(180deg,rgba(13,15,19,0),#0D0F13)}'
  // jótékonysági doboz: éles piros keret helyett finom, piros árnyalatú „üveg” kártya, ami beleolvad a háttérbe
  + 'html.ca-dark .cah .card.card.charity{border:1px solid rgba(255,90,100,calc(var(--ca-red,.24)*.6))!important;box-shadow:0 30px 90px rgba(226,0,26,calc(var(--ca-red,.24)*.5))!important;'
  + 'background:radial-gradient(ellipse 70% 90% at 0% 0%,rgba(226,0,26,calc(var(--ca-red,.24)*1.3)),transparent 62%),radial-gradient(ellipse 60% 70% at 100% 100%,rgba(226,0,26,calc(var(--ca-red,.24)*.7)),transparent 65%),linear-gradient(180deg,rgba(20,12,16,.85),rgba(14,15,19,.9))!important}'
  + GLOWS
  + '</style>';

try {
  if (!fs.existsSync(FILE) || !fs.existsSync(DM)) { console.log('[home-dark] nincs dist/index.html vagy dark-mode.js — kihagyva'); }
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-home-dark"') > -1) console.log('[home-dark] már alkalmazva');
    else {
      const v = crypto.createHash('sha1').update(fs.readFileSync(DM)).digest('hex').slice(0, 10);
      const head = '<script id="ca-home-dark">window.__CA_FORCE_DARK=1;document.documentElement.classList.add("ca-dark");</script>'
        + DARK_CSS + '<script src="/dark-mode.js?v=' + v + '" defer></script>';
      h = h.replace(/<head([^>]*)>/i, (m) => m + head);
      // az Autóink „showroom” blokknak saját sötét dizájnja van (fehér kártyák) — az automatikus átszínezés kihagyja
      h = h.replace('<section class="wrap" id="autoink">', '<section class="wrap" id="autoink" data-dm-skip>');
      fs.writeFileSync(FILE, h);
      console.log('[home-dark] a magyar főoldal sötét témával');
    }
  }
} catch (e) { console.log('[home-dark] hiba:', e.message); }
