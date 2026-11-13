// Build lépés: a magyar főoldal (dist/index.html) mindig sötét témával jelenik meg,
// a készülék beállításától függetlenül. A meglévő automatikus sötét módot (public/dark-mode.js)
// használja a window.__CA_FORCE_DARK jelzővel; a többi oldal továbbra is a készüléket követi.
// A sötét módhoz tartozó főoldali finomhangolások (DARK_CSS) is ide kerülnek. Idempotens.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const FILE = path.join('dist', 'index.html');
const DM = path.join('dist', 'dark-mode.js');

// főoldali finomhangolás sötét témában (a dark-mode.js automatikus átszínezése után)
const DARK_CSS = '<style id="ca-dark-home-css">'
  + 'html.ca-dark,html.ca-dark body{background-color:#0D0F13!important}'
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
