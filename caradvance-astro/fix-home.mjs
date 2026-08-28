// fix-home.mjs — a FOOLDAL (dist/index.html) kiemelt-logikajanak javitasa.
//
// MIERT
// A fooldal "Autoink" es "Berelheto" blokkjai kliens-oldalon, a Google Sheetbol
// (gviz) tolodnek fel. Harom hiba volt bennuk (2026.08.28.):
//
//  1. keyDate(): ha egy sorban ures a `hozzaadva`, az evjarat EVET adta vissza
//     ("2025"), amit 8 jegyu datummal ("20260828") hasonlitott ossze
//     szoveg-osszehasonlitassal -> a rendezes veletlenszeru volt. Most minden
//     kulcs 8 jegyu: datum -> 20260828, csak evjarat -> 20250101, semmi -> 0.
//  2. A 3 kartyas berlet-blokk (a "Berelheto autoink" szekcio) EGYALTALAN nem
//     rendezett: `cars.slice(0,3)` = Sheet-sorrend. Most ugyanaz a "legujabb
//     elore" logika, mint a nagy karusszelnal.
//  3. Ha a gviz-keres egyszer hibazott (halozat, Google cache), a szekcio
//     URESEN maradt, ujraprobalkozas nelkul. Most 4 masodpercenkent ujraprobal,
//     max 6-szor.
//
// A `pick()` sorrendje: eloszor a kezzel kiemelt (`kiemelt` oszlop) autok,
// azok kozott is a legujabb elol; utana a tobbi, legujabb elol. Ha egyetlen
// auto sincs kiemeltnek jelolve (ez a mostani allapot), akkor egyszeruen
// a legujabb autok jonnek - pontosan ahogy Marc kerte.
//
// A build UTAN fut (astro build ujraepiti a dist-et), es CSAK a dist/index.html-t
// irja - a repoban levo public/index.html-hez nem nyul.
// Ha valamelyik horgony nem talalhato, csak kiirja es tovabbmegy: a build
// soha nem all le emiatt.
import fs from 'node:fs';

const F = 'dist/index.html';
if (!fs.existsSync(F)) {
  console.log('fix-home: nincs ' + F + ' - kimarad');
  process.exit(0);
}

let h = fs.readFileSync(F, 'utf8');
let ok = 0;
let hiba = 0;

function rep(re, to, nev) {
  const elotte = h;
  h = h.replace(re, to);
  if (h === elotte) { console.log('fix-home: KIMARAD (horgony nincs meg) - ' + nev); hiba++; return false; }
  console.log('fix-home: ok - ' + nev);
  ok++;
  return true;
}

// 1. datumkulcs: mindig 8 jegy
rep(
  /function keyDate\(c\)\{[\s\S]{0,260}?return m\?m\[1\]:'0';\}/,
  "function keyDate(c){var s=String(c.hozzaadva||'').replace(/[^0-9]/g,'').slice(0,8);"
  + "if(s.length===8)return s;"
  + "var m=String(c.evjarat||'').match(/(\\d{4})/);return m?m[1]+'0101':'00000000';}",
  'keyDate (8 jegyu datumkulcs)'
);

// 2. pick(): kiemelt elore, azon belul es utana legujabb elore; a darabszam
//    parameterezheto (a berlet-blokk 3-at ker)
rep(
  /function pick\(cars,flags\)\{[\s\S]{0,320}?\n/,
  "function pick(cars,flags,db){var n=db||6;"
  + "var s=function(a){return a.slice().sort(newest);};"
  + "var k=s(cars.filter(function(c){return c.kiemelt;}));"
  + "var r=s(cars.filter(function(c){return !c.kiemelt;}));"
  + "return k.concat(r).slice(0,n);}\n",
  'pick() (legujabb elore, parameterezheto darabszam)'
);

// 3. a 3 kartyas berlet-blokk ugyanezt a sorrendet hasznalja.
//    Sajat keyDate/newest kell neki: ez egy MAS, korabbi <script> blokkban van,
//    ahol a fenti fuggvenyek nem lathatoak.
rep(
  /var pick=cars\.filter\(function\(c\)\{return c\.kiemelt;\}\);\s*\n?\s*pick=\(pick\.length>=3\?pick:cars\)\.slice\(0,3\);/,
  "var kd=function(c){var s=String(c.hozzaadva||'').replace(/[^0-9]/g,'').slice(0,8);"
  + "if(s.length===8)return s;var m=String(c.evjarat||'').match(/(\\d{4})/);return m?m[1]+'0101':'00000000';};"
  + "var nw=function(a,b){return kd(b).localeCompare(kd(a));};"
  + "var so=function(a){return a.slice().sort(nw);};"
  + "var pick=so(cars.filter(function(c){return c.kiemelt;}))"
  + ".concat(so(cars.filter(function(c){return !c.kiemelt;}))).slice(0,3);",
  'berlet-blokk (3 kartya) legujabb elore'
);

// 4. ujraprobalkozas, ha a gviz-keres nem hozott adatot (ures szekcio)
rep(
  /\n(\s*)loadAllData\(\);\n\s*setInterval\(loadAllData,3600000\);/,
  "\n$1loadAllData();\n"
  + "$1(function(){var p=0;var iv=setInterval(function(){p++;"
  + "var t=function(id){var e=document.querySelector('#'+id+' .cw-track');return e&&e.children.length>0;};"
  + "if((t('cw-elado')&&t('cw-berelheto'))||p>6){clearInterval(iv);return;}"
  + "loadAllData();},4000);})();\n"
  + "$1setInterval(loadAllData,3600000);",
  'ures szekcio - ujraprobalkozas'
);

fs.writeFileSync(F, h);
console.log('fix-home: kesz (' + ok + ' javitas, ' + hiba + ' kimaradt)');
