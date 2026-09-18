#!/usr/bin/env node
/**
 * seo-kalkulator.mjs  —  v2  (2026-09-18)
 *
 * Legenerálja a  /honositas-kalkulator/  oldalt a dist/ mappába, egy meglévő
 * oldal fejlécét és láblécét sablonként használva, majd felveszi a sitemap.xml-be.
 *
 * v2: a kalkulátor kártya vizuálisan a  /finanszirozas-lizing/  lízingkalkulátor
 * (".lk") dizájnját követi — fehér, lekerekített kártya, piros "KALKULÁTOR"
 * kiemelés, bal oldali űrlap, jobb oldali sötét eredménypanel, piros CTA.
 * A NAV regisztrációs adó számítási logika VÁLTOZATLAN.
 *
 * Adatforrás: NAV "Személygépjármű Regadó kalkulátor 20260101.xlsx" — a tábla
 * változatlanul, kézzel átemelve. A motor a NAV saját példáján ellenőrizve:
 * 90 kW / "9-11" osztály / 2021.07 → 2024.11  =  465 300 Ft.
 *
 * A build-láncba a seo-cars.mjs UTÁN kerül. Hibára exit 0 — a buildet sosem állítja meg.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST     = 'dist';
const SABLON   = path.join(DIST, 'beszerzesi-folyamat', 'index.html');
const KIMENET  = path.join(DIST, 'honositas-kalkulator', 'index.html');
const SITEMAP  = path.join(DIST, 'sitemap.xml');
const BAZIS    = 'https://www.caradvance.hu';
const URL_PATH = '/honositas-kalkulator/';

const CIM  = 'Honosítás kalkulátor 2026 — regisztrációs adó számítás | CarAdvance';
const LEIR = 'Számold ki a külföldről behozott autó regisztrációs adóját a NAV 2026-os hivatalos táblájával. Teljesítmény, környezetvédelmi osztály és életkor alapján, azonnal.';

// A hero az Import (beszerzési folyamat) oldal heroját tükrözi. A .hero, .scrim,
// .inner, .partners, .sub, .cta-row, .btn, .scrolldown osztályokat az örökölt
// globális CSS stílusozza — itt csak a markup és a honosításra szabott szöveg kell.
const HERO = `<section class="hero">
  <video autoplay muted loop playsinline poster="/caradvance-hero-beszerzesi-poster.jpg">
    <source src="/caradvance-hero-beszerzesi.mp4" type="video/mp4">
  </video>
  <div class="scrim"></div>
  <div class="inner">
    <div class="partners">
      <img src="/mobile-de.webp" alt="mobile.de" loading="lazy">
      <img src="/autoscout24.webp" alt="AutoScout24" loading="lazy">
    </div>
    <h1>Honosítás kalkulátor 2026 —<br><span class="accent">regisztrációs adó másodpercek alatt</span></h1>
    <p class="sub sub-wide">Számold ki a külföldről behozott autó regisztrációs adóját a NAV
    hivatalos táblájával, majd bízd ránk a teljes honosítást — eredetiségvizsgálat, műszaki,
    forgalomba helyezés és a teljes papírmunka. Te csak átveszed a magyar forgalmival.</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="#kalkulator">Adó kiszámítása</a>
      <a class="btn btn-white" href="/kapcsolat">Kérek segítséget</a>
    </div>
  </div>
  <button class="scrolldown" type="button" onclick="document.getElementById('kalkulator').scrollIntoView({behavior:'smooth'})">Görgess
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
  </button>
</section>`;

const STILUS = `#ca-kalk{
  --red:#E2001A; --navy:#1a1d23; --ink:#141519; --muted:#5A6B82; --line:#E6EAF1; --good:#1D9E75;
  color:var(--ink);max-width:1080px;margin:0 auto;padding:28px 20px 72px;
  display:flex;flex-direction:column;gap:34px;font-family:inherit;
}
#ca-kalk *{box-sizing:border-box}
#ca-kalk p{margin:0}

/* ---- kalkulátor kártya (.lk, a lízingkalkulátorral azonos) ---- */
#ca-kalk .lk{background:#fff;border:1px solid var(--line);border-radius:22px;padding:26px 28px;box-shadow:0 12px 34px rgba(8,8,10,.06)}
#ca-kalk .lk-head{margin-bottom:18px}
#ca-kalk .lk-eyebrow{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--red)}
#ca-kalk .lk-head .lk-title{font-size:clamp(20px,2.6vw,26px);font-weight:800;letter-spacing:-.02em;color:var(--ink);margin:6px 0 2px;line-height:1.15;text-wrap:balance}
#ca-kalk .lk-lead{color:var(--muted);font-size:14.5px;margin:4px 0 0;max-width:70ch}

#ca-kalk .lk-grid{display:grid;grid-template-columns:1fr 380px;gap:26px;align-items:start}
@media(max-width:820px){#ca-kalk .lk-grid{grid-template-columns:1fr;gap:20px}}

#ca-kalk .lk-field{margin-bottom:16px}
#ca-kalk .lk-field>label{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:14px;color:var(--ink);margin-bottom:8px}
#ca-kalk .lk-lbl{display:inline-flex;align-items:center;gap:6px}
#ca-kalk .lk-in{width:100%;min-width:0;border:1px solid var(--line);border-radius:12px;padding:13px 14px;font-size:17px;font-weight:800;color:var(--ink);font-family:inherit;background:#fbfcfe}
#ca-kalk .lk-in:focus{outline:none;border-color:var(--navy)}
#ca-kalk select.lk-sel{font-size:15px;font-weight:700;appearance:menulist;cursor:pointer}
#ca-kalk .lk-gy2{display:flex;gap:10px}
#ca-kalk .lk-gy2 .lk-in{flex:1 1 0;min-width:0}

#ca-kalk .lk-seg{display:flex;gap:8px;flex-wrap:wrap}
#ca-kalk .lk-segbtn{flex:1 1 0;min-width:92px;border:1px solid var(--line);background:#fbfcfe;font-family:inherit;font-weight:700;font-size:13px;color:var(--ink);padding:10px 8px;border-radius:12px;cursor:pointer;transition:.15s}
#ca-kalk .lk-segbtn[aria-pressed=true]{background:var(--navy);color:#fff;border-color:var(--navy)}
#ca-kalk .lk-seg-unit{flex:0 0 auto}
#ca-kalk .lk-seg-unit .lk-segbtn{flex:0 0 auto;min-width:52px;padding:10px 14px}
#ca-kalk .lk-hint{color:var(--muted);font-size:12.5px;line-height:1.5;margin-top:7px}

/* info-buborék */
#ca-kalk .lk-tip{position:relative;display:inline-flex;align-items:center;line-height:0}
#ca-kalk .lk-i{width:16px;height:16px;border-radius:50%;border:0;background:#c9d3e2;color:#fff;font:italic 700 11px/16px Georgia,serif;text-align:center;cursor:pointer;padding:0;flex:0 0 auto}
#ca-kalk .lk-i:hover{background:var(--navy)}
#ca-kalk .lk-tiptext{position:absolute;top:calc(100% + 9px);left:-4px;z-index:50;width:240px;max-width:72vw;background:#0f1622;color:#fff;font-size:12.5px;font-weight:600;line-height:1.5;padding:10px 12px;border-radius:10px;box-shadow:0 12px 32px rgba(8,12,20,.32);opacity:0;visibility:hidden;transform:translateY(-4px);transition:.14s;pointer-events:none}
#ca-kalk .lk-tip:hover .lk-tiptext,#ca-kalk .lk-tip.open .lk-tiptext{opacity:1;visibility:visible;transform:none}
#ca-kalk .lk-tiptext::before{content:"";position:absolute;bottom:100%;left:9px;border:6px solid transparent;border-bottom-color:#0f1622}

/* sötét eredménypanel */
#ca-kalk .lk-result{background:linear-gradient(#0f1622,#0b0b0d);color:#fff;border-radius:18px;padding:24px 22px;position:sticky;top:90px}
#ca-kalk .lk-monthly{text-align:center;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.12)}
#ca-kalk .lk-mlabel{color:#9aa7b8;font-size:13px;font-weight:600}
#ca-kalk .lk-mval{margin:6px 0 2px}
#ca-kalk .lk-mnum{font-size:clamp(28px,4.6vw,38px);font-weight:800;letter-spacing:-.02em;color:#fff;font-variant-numeric:tabular-nums}
#ca-kalk .lk-badge{display:inline-block;margin-top:8px;font-size:11px;font-weight:800;letter-spacing:.04em;padding:3px 10px;border-radius:999px;background:rgba(29,158,117,.16);color:#8fe3b8}
#ca-kalk .lk-rows{margin:16px 0 14px;display:flex;flex-direction:column}
#ca-kalk .lk-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:13.5px}
#ca-kalk .lk-row span{color:#c4cddb}
#ca-kalk .lk-row b{color:#fff;font-weight:800;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
#ca-kalk .lk-total{border-bottom:0;border-top:1px solid rgba(255,255,255,.18);margin-top:4px;padding-top:12px;font-size:14.5px}
#ca-kalk .lk-cta{display:block;text-align:center;background:var(--red);color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:14px;border-radius:12px;transition:.15s;margin-top:2px}
#ca-kalk .lk-cta:hover{filter:brightness(1.08)}
#ca-kalk .lk-disc{color:#8b98a9;font-size:11.5px;line-height:1.55;margin:14px 0 0}
#ca-kalk .lk-disc b{color:#c4cddb}

/* ---- kiegészítő szekciók (tábla, GYIK, CTA) ---- */
#ca-kalk .sec{display:flex;flex-direction:column;gap:14px}
#ca-kalk h2{font-size:22px;font-weight:800;letter-spacing:-.01em;margin:0;color:var(--ink);text-wrap:balance}
#ca-kalk .lede{color:var(--muted);font-size:14.5px;max-width:74ch;margin:0}
#ca-kalk .lede b{color:var(--ink)}
#ca-kalk .scroll{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:#fff}
#ca-kalk table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:560px}
#ca-kalk th,#ca-kalk td{text-align:left;padding:9px 13px;border-bottom:1px solid var(--line)}
#ca-kalk tbody tr:last-child td{border-bottom:0}
#ca-kalk th{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:800;background:#fbfcfe}
#ca-kalk td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
#ca-kalk .faq{display:flex;flex-direction:column;gap:10px}
#ca-kalk .faq details{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px}
#ca-kalk .faq summary{font-weight:800;font-size:15px;cursor:pointer;color:var(--ink)}
#ca-kalk .faq p{margin-top:9px;color:var(--muted);font-size:14.5px}
#ca-kalk .faq b{color:var(--ink)}
#ca-kalk .cta{background:linear-gradient(#0f1622,#0b0b0d);color:#fff;border-radius:18px;padding:22px 24px;display:flex;flex-direction:column;gap:9px}
#ca-kalk .cta .t{font-weight:800;font-size:18px}
#ca-kalk .cta p{color:#c4cddb;font-size:14.5px}
#ca-kalk .cta b{color:#fff}
#ca-kalk .foot{color:var(--muted);font-size:12.5px;line-height:1.55}
@media(prefers-reduced-motion:reduce){#ca-kalk *{animation:none!important;transition:none!important}}`;

const TORZS = `<div class="lk" id="kalkulator">
  <div class="lk-head">
    <span class="lk-eyebrow">Kalkulátor</span>
    <h2 class="lk-title">Regisztrációs adó kalkulátor</h2>
    <p class="lk-lead">Állítsd be a teljesítményt, a környezetvédelmi osztályt és az autó korát —
    azonnal megmutatjuk a fizetendő regisztrációs adót a NAV 2026.01.01-től hatályos táblája
    alapján. Minden módosításkor újraszámol.</p>
  </div>

  <div class="lk-grid">
    <div class="lk-inputs">
      <div class="lk-field">
        <label><span class="lk-lbl">Környezetvédelmi osztály
          <span class="lk-tip"><button type="button" class="lk-i" aria-label="Információ">i</button>
          <span class="lk-tiptext">A forgalmi engedély V.9. rovatában találod. Az 5E és 5Z (elektromos / nulla emissziós) autók adómentesek.</span></span>
        </span></label>
        <select id="osztaly" class="lk-in lk-sel"></select>
        <span class="lk-hint">A forgalmi engedély V.9. rovatában találod.</span>
      </div>

      <div class="lk-field">
        <label><span class="lk-lbl">Motorteljesítmény
          <span class="lk-tip"><button type="button" class="lk-i" aria-label="Információ">i</button>
          <span class="lk-tiptext">A motor névleges teljesítménye. kW-ban és lóerőben is megadhatod — a kalkulátor automatikusan átváltja.</span></span>
        </span></label>
        <div class="lk-gy2">
          <input type="number" id="teljesitmeny" class="lk-in" value="150" min="1" max="2000" step="1" inputmode="numeric">
          <div class="lk-seg lk-seg-unit" role="group" aria-label="Mértékegység">
            <button type="button" class="lk-segbtn" id="egysegKw" aria-pressed="true">kW</button>
            <button type="button" class="lk-segbtn" id="egysegLe" aria-pressed="false">LE</button>
          </div>
        </div>
        <span class="lk-hint" id="atvaltas">&nbsp;</span>
      </div>

      <div class="lk-field">
        <label><span class="lk-lbl">Milyen autóról van szó?</span></label>
        <div class="lk-seg" role="group" aria-label="Új vagy használt">
          <button type="button" class="lk-segbtn" id="hasznaltGomb" aria-pressed="true">Külföldi, használt</button>
          <button type="button" class="lk-segbtn" id="ujGomb" aria-pressed="false">Magyarországon új</button>
        </div>
        <span class="lk-hint">Új autónál nincs korkedvezmény: a teljes alapadót kell fizetni.</span>
      </div>

      <div class="lk-field" id="korBlokk" hidden>
        <label><span class="lk-lbl">Első forgalomba helyezés (külföldön)</span></label>
        <div class="lk-gy2">
          <select id="elsoEv" class="lk-in lk-sel" aria-label="Első forgalomba helyezés éve"></select>
          <select id="elsoHo" class="lk-in lk-sel" aria-label="Első forgalomba helyezés hónapja"></select>
        </div>
      </div>

      <div class="lk-field" id="regBlokk" hidden>
        <label><span class="lk-lbl">A regisztrációs eljárás kezdete
          <span class="lk-tip"><button type="button" class="lk-i" aria-label="Információ">i</button>
          <span class="lk-tiptext">Amikor a NAV-nál elindul az eljárás — jellemzően a behozatal hónapja.</span></span>
        </span></label>
        <div class="lk-gy2">
          <select id="regEv" class="lk-in lk-sel" aria-label="Regisztrációs eljárás éve"></select>
          <select id="regHo" class="lk-in lk-sel" aria-label="Regisztrációs eljárás hónapja"></select>
        </div>
      </div>
    </div>

    <div class="lk-result">
      <div class="lk-monthly">
        <span class="lk-mlabel">Fizetendő regisztrációs adó</span>
        <div class="lk-mval"><span class="lk-mnum" id="fizetendo">—</span></div>
        <span id="mentesBadge" hidden><span class="lk-badge">Adómentes</span></span>
      </div>
      <div class="lk-rows">
        <div class="lk-row"><span>Teljesítménysáv</span><b id="oSav">—</b></div>
        <div class="lk-row"><span>Alap regisztrációs adó</span><b id="oAlap">—</b></div>
        <div class="lk-row" id="lineKor"><span>Eltelt hónapok</span><b id="oHonap">—</b></div>
        <div class="lk-row" id="lineSzorzo"><span>Korkedvezmény szorzója</span><b id="oSzorzo">—</b></div>
        <div class="lk-row" id="lineCsokk"><span>Adócsökkenés</span><b id="oCsokk">—</b></div>
        <div class="lk-row lk-total"><span>Fizetendő</span><b id="oFiz">—</b></div>
      </div>
      <a class="lk-cta" href="/kapcsolat">Kérek segítséget a honosításban →</a>
      <p class="lk-disc"><b>A kalkulátor tájékoztató jellegű.</b> A fizetendő adót minden esetben
      a NAV állapítja meg az eljárás során. Adótábla forrása: NAV, 2026.01.01.</p>
    </div>
  </div>
</div>

<section class="sec">
  <h2>A hivatalos adótábla</h2>
  <p class="lede">Alap regisztrációs adó forintban, a NAV 2026.01.01-től hatályos táblája szerint.
  A fizetendő adó ebből a korkedvezmény szorzójával csökken.</p>
  <div class="scroll">
    <table>
      <thead><tr>
        <th>Teljesítmény</th>
        <th class="n">14-nél jobb + 2020 utáni, vagy hibrid</th>
        <th class="n">14-nél jobb</th><th class="n">12–14</th><th class="n">9–11</th><th class="n">8 vagy rosszabb</th>
      </tr></thead>
      <tbody id="tablaBody"></tbody>
    </table>
  </div>
  <p class="lede">Az 5E (tisztán elektromos) és 5Z (nulla emissziós) környezetkímélő autók,
  valamint a muzeális jellegű gépjárművek <b>adómentesek</b>.</p>
</section>

<section class="sec">
  <h2>Korkedvezmény — mennyivel csökken az adó</h2>
  <div class="scroll">
    <table>
      <thead><tr><th>Eltelt hónapok</th><th class="n">Csökkenés</th><th class="n">Szorzó</th></tr></thead>
      <tbody id="szorzoBody"></tbody>
    </table>
  </div>
</section>

<section class="sec">
  <h2>Gyakori kérdések</h2>
  <div class="faq">
    <details><summary>Mennyi a regisztrációs adó egy 2019-es, 150 kW-os dízelre?</summary>
      <p>A környezetvédelmi osztálytól függ. Egy 141–180 kW-os, „12–14" osztályú autó alapadója
      1 128 000 Ft. Ha 2019 júniusában helyezték először forgalomba, és most indul az eljárás,
      88 hónap telt el — a szorzó 0,30, a fizetendő adó <b>338 400 Ft</b>. A pontos összeget
      mindig a fenti kalkulátor adja meg, mert egyetlen hónap is számít.</p></details>
    <details><summary>Elektromos autó után kell regisztrációs adót fizetni?</summary>
      <p>Nem. Az 5E (tisztán elektromos) és 5Z (egyéb nulla emissziós) környezetvédelmi
      osztályú személyautók adómentesek, függetlenül a teljesítménytől és a kortól.</p></details>
    <details><summary>Hogyan számítja a NAV az eltelt hónapokat?</summary>
      <p>Az első külföldi forgalomba helyezés hónapját megelőző hónap végétől a regisztrációs
      eljárás hónapját követő hónap elejéig. Gyakorlatilag: a két dátum közötti teljes hónapok
      száma plusz egy. Ez a kalkulátorban automatikusan történik.</p></details>
    <details><summary>Mi kerül még pénzbe a regisztrációs adón kívül?</summary>
      <p>Eredetiségvizsgálat, honosítási műszaki vizsga, forgalomba helyezés és okmányok,
      rendszám, vagyonszerzési illeték, valamint a szállítás. Használt, EU-s kereskedőtől
      különbözeti adózással vásárolt autónál magyar áfa jellemzően nem merül fel; hat hónapnál
      fiatalabb vagy 6 000 km-nél kevesebbet futott autó viszont új járműnek minősül, és utána
      itthon kell áfát fizetni.</p></details>
    <details><summary>Hibrid autónál melyik oszlop érvényes?</summary>
      <p>A hibrid autók a legkedvezőbb, első oszlopba tartoznak — ugyanoda, ahová a 2020.12.31.
      után először forgalomba helyezett, „14-nél jobb" osztályú autók.</p></details>
  </div>
</section>

<section class="sec">
  <div class="cta">
    <div class="t">Ennyibe kerül, ha egyedül csinálod</div>
    <p>A CarAdvance-nél a keresés, az alku, a szállítás és a teljes honosítási
    ügyintézés egy csomagban van — az autót a nevedre írt magyar forgalmival adjuk át.
    23 éve hozunk prémium autókat Németországból.</p>
    <p><b>+36 30 233 6060</b> · info@caradvance.hu</p>
  </div>
  <p class="foot">A kalkulátor tájékoztató jellegű. A fizetendő adót
  minden esetben a NAV állapítja meg az eljárás során. Adótábla forrása: NAV, 2026.01.01.</p>
</section>

`;

const SZKRIPT = `
const KW_SAVOK=[{max:80,cimke:'0–80 kW'},{max:100,cimke:'81–100 kW'},{max:120,cimke:'101–120 kW'},
 {max:140,cimke:'121–140 kW'},{max:180,cimke:'141–180 kW'},{max:250,cimke:'181–250 kW'},
 {max:Infinity,cimke:'250 kW felett'}];
const ALAPADO=[[47000,70500,282000,564000,1128000],[70500,105750,423000,846000,1692000],
 [94000,141000,564000,1128000,2256000],[141000,211500,846000,1692000,3384000],
 [188000,282000,1128000,2256000,4512000],[282000,423000,1692000,3384000,6768000],
 [423000,634500,2538000,5076000,10152000]];
const OSZTALYOK=[
 {kod:1,cimke:'14-nél jobb, és 2020.12.31. után helyezték forgalomba — vagy hibrid'},
 {kod:2,cimke:'14-nél jobb'},{kod:3,cimke:'12–14'},{kod:4,cimke:'9–11'},
 {kod:5,cimke:'8, vagy annál rosszabb'},
 {kod:0,cimke:'5E / 5Z — elektromos vagy nulla emissziós (adómentes)'}];
const SZORZOK=[[0,1.00],[1,0.97],[3,0.92],[5,0.87],[7,0.82],[13,0.77],[19,0.72],[25,0.67],
 [31,0.62],[37,0.55],[49,0.47],[61,0.41],[73,0.35],[85,0.30],[97,0.26],[109,0.22],
 [121,0.19],[133,0.16],[145,0.14],[157,0.12],[169,0.10]];
const HONAPNEV=['január','február','március','április','május','június','július',
 'augusztus','szeptember','október','november','december'];
const LE_KW=0.7355;
const ft=n=>new Intl.NumberFormat('hu-HU').format(Math.round(n))+' Ft';
const $=id=>document.getElementById(id);

let egysegKw=true, ujAuto=false;

function kwSav(kw){for(let i=0;i<KW_SAVOK.length;i++) if(kw<=KW_SAVOK[i].max) return i; return 6;}
function honapok(eE,eH,rE,rH){return (rE*12+rH)-(eE*12+eH)+1;}
function szorzo(h){let s=1;for(const[k,v]of SZORZOK) if(h>=k) s=v; return s;}

function init(){
  $('osztaly').innerHTML=OSZTALYOK.map(o=>\`<option value="\${o.kod}">\${o.cimke}</option>\`).join('');
  $('osztaly').value='3';
  const most=new Date(), evNow=most.getFullYear();
  const evOpt=(a,b)=>{let s='';for(let y=b;y>=a;y--)s+=\`<option value="\${y}">\${y}</option>\`;return s;};
  const hoOpt=HONAPNEV.map((n,i)=>\`<option value="\${i+1}">\${n}</option>\`).join('');
  $('elsoEv').innerHTML=evOpt(evNow-35,evNow); $('elsoHo').innerHTML=hoOpt;
  $('regEv').innerHTML=evOpt(evNow-5,evNow+1); $('regHo').innerHTML=hoOpt;
  $('elsoEv').value=String(evNow-5); $('elsoHo').value='6';
  $('regEv').value=String(evNow); $('regHo').value=String(most.getMonth()+1);

  $('tablaBody').innerHTML=KW_SAVOK.map((s,i)=>
    \`<tr><td>\${s.cimke}</td>\`+ALAPADO[i].map(v=>\`<td class="n">\${new Intl.NumberFormat('hu-HU').format(v)}</td>\`).join('')+'</tr>').join('');
  $('szorzoBody').innerHTML=SZORZOK.map(([k,v],i)=>{
    const kov=SZORZOK[i+1];
    const tart=kov?(k===kov[0]-1?\`\${k}. hónap\`:\`\${k}–\${kov[0]-1}. hónap\`):\`\${k}. hónaptól\`;
    return \`<tr><td>\${tart}</td><td class="n">\${Math.round((1-v)*100)}%</td><td class="n">\${v.toFixed(2)}</td></tr>\`;
  }).join('');

  $('egysegKw').onclick=()=>{egysegKw=true;szinkronEgyseg();};
  $('egysegLe').onclick=()=>{egysegKw=false;szinkronEgyseg();};
  $('ujGomb').onclick=()=>{ujAuto=true;szinkronUj();};
  $('hasznaltGomb').onclick=()=>{ujAuto=false;szinkronUj();};
  ['osztaly','teljesitmeny','elsoEv','elsoHo','regEv','regHo'].forEach(id=>{
    $(id).addEventListener('input',szamol); $(id).addEventListener('change',szamol);});

  /* info-buborékok érintésre (mobil) */
  document.querySelectorAll('#ca-kalk .lk-i').forEach(function(b){
    b.addEventListener('click',function(e){e.stopPropagation();
      var t=b.closest('.lk-tip');
      document.querySelectorAll('#ca-kalk .lk-tip.open').forEach(function(x){if(x!==t)x.classList.remove('open');});
      t.classList.toggle('open');});
  });
  document.addEventListener('click',function(){
    document.querySelectorAll('#ca-kalk .lk-tip.open').forEach(function(x){x.classList.remove('open');});});

  szinkronEgyseg(); szinkronUj();
}
function szinkronEgyseg(){
  $('egysegKw').setAttribute('aria-pressed',String(egysegKw));
  $('egysegLe').setAttribute('aria-pressed',String(!egysegKw));
  szamol();
}
function szinkronUj(){
  $('ujGomb').setAttribute('aria-pressed',String(ujAuto));
  $('hasznaltGomb').setAttribute('aria-pressed',String(!ujAuto));
  $('korBlokk').hidden=ujAuto; $('regBlokk').hidden=ujAuto;
  szamol();
}
function szamol(){
  const nyers=parseFloat($('teljesitmeny').value)||0;
  const kw=egysegKw?nyers:nyers*LE_KW;
  $('atvaltas').textContent = nyers>0
    ? (egysegKw ? \`\${Math.round(nyers/LE_KW)} lóerő\` : \`\${Math.round(kw)} kW\`)
    : ' ';
  const kod=parseInt($('osztaly').value,10);
  const i=kwSav(kw);
  $('oSav').textContent=KW_SAVOK[i].cimke;
  $('mentesBadge').hidden = kod!==0;

  if(kod===0){
    $('fizetendo').textContent='0 Ft';
    ['oAlap','oHonap','oSzorzo','oCsokk','oFiz'].forEach(x=>$(x).textContent='—');
    $('oAlap').textContent='0 Ft'; $('oFiz').textContent='0 Ft';
    return;
  }
  const alap=ALAPADO[i][kod-1];
  $('oAlap').textContent=ft(alap);
  let sz=1,h=0,fiz=alap;
  if(!ujAuto){
    h=honapok(+$('elsoEv').value,+$('elsoHo').value,+$('regEv').value,+$('regHo').value);
    if(h<0) h=0;
    sz=szorzo(h); fiz=Math.round(alap*sz);
  }
  ['lineKor','lineSzorzo','lineCsokk'].forEach(x=>$(x).hidden=ujAuto);
  $('oHonap').textContent=h+' hónap';
  $('oSzorzo').textContent=sz.toFixed(2);
  $('oCsokk').textContent='− '+ft(alap-fiz);
  $('oFiz').textContent=ft(fiz);
  $('fizetendo').textContent=ft(fiz);
}
init();
`;

const JSONLD = `<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@graph":[
    {
      "@type":"WebApplication",
      "name":"Honosítás kalkulátor",
      "url":"${BAZIS}${URL_PATH}",
      "applicationCategory":"FinanceApplication",
      "operatingSystem":"All",
      "inLanguage":"hu",
      "description":${JSON.stringify(LEIR)},
      "offers":{"@type":"Offer","price":"0","priceCurrency":"HUF"},
      "publisher":{"@type":"Organization","name":"CarAdvance","url":"${BAZIS}/"}
    },
    {
      "@type":"FAQPage",
      "mainEntity":[
      {"@type":"Question","name":"Mennyi a regisztrációs adó egy 2019-es, 150 kW-os dízelre?","acceptedAnswer":{"@type":"Answer","text":"A környezetvédelmi osztálytól függ. Egy 141–180 kW-os, „12–14” osztályú autó alapadója 1 128 000 Ft. Ha 2019 júniusában helyezték először forgalomba, és most indul az eljárás, 88 hónap telt el — a szorzó 0,30, a fizetendő adó 338 400 Ft."}},
      {"@type":"Question","name":"Elektromos autó után kell regisztrációs adót fizetni?","acceptedAnswer":{"@type":"Answer","text":"Nem. Az 5E (tisztán elektromos) és 5Z (egyéb nulla emissziós) környezetvédelmi osztályú személyautók adómentesek, függetlenül a teljesítménytől és a kortól."}},
      {"@type":"Question","name":"Hogyan számítja a NAV az eltelt hónapokat?","acceptedAnswer":{"@type":"Answer","text":"Az első külföldi forgalomba helyezés hónapját megelőző hónap végétől a regisztrációs eljárás hónapját követő hónap elejéig. Gyakorlatilag a két dátum közötti teljes hónapok száma plusz egy."}},
      {"@type":"Question","name":"Mi kerül még pénzbe a regisztrációs adón kívül?","acceptedAnswer":{"@type":"Answer","text":"Eredetiségvizsgálat, honosítási műszaki vizsga, forgalomba helyezés és okmányok, rendszám, vagyonszerzési illeték, valamint a szállítás. Használt, EU-s kereskedőtől különbözeti adózással vásárolt autónál magyar áfa jellemzően nem merül fel; hat hónapnál fiatalabb vagy 6 000 km-nél kevesebbet futott autó viszont új járműnek minősül, és utána itthon kell áfát fizetni."}},
      {"@type":"Question","name":"Hibrid autónál melyik oszlop érvényes?","acceptedAnswer":{"@type":"Answer","text":"A hibrid autók a legkedvezőbb, első oszlopba tartoznak — ugyanoda, ahová a 2020.12.31. után először forgalomba helyezett, „14-nél jobb” osztályú autók."}}
      ]
    }
  ]
}<\/script>`;

function cserelVagyBeszur(fej, minta, ujTag) {
  return minta.test(fej) ? fej.replace(minta, ujTag) : fej.replace('</head>', ujTag + '\n</head>');
}

async function fut() {
  if (!existsSync(SABLON)) { console.log('[kalkulator] KIHAGYVA — nincs sablon:', SABLON); return; }

  const sablon = await readFile(SABLON, 'utf8');
  const fejVege = sablon.indexOf('</head>');
  if (fejVege === -1) { console.log('[kalkulator] KIHAGYVA — nincs </head> a sablonban'); return; }

  const mainNyit = sablon.indexOf('<main>');
  const mainZar  = sablon.indexOf('</main>');
  if (mainNyit === -1 || mainZar === -1) { console.log('[kalkulator] KIHAGYVA — nincs <main> a sablonban'); return; }

  let fej    = sablon.slice(0, fejVege + 7);
  const elo  = sablon.slice(fejVege + 7, mainNyit + 6);   // <body> ... <main>
  const uto  = sablon.slice(mainZar);                      // </main> ... </html>

  // ---- fej átírása -------------------------------------------------------
  const csere = [
    ['title',       /<title>[\s\S]*?<\/title>/,                                    `<title>${CIM}</title>`],
    ['description', /<meta name="description"[^>]*>/,                              `<meta name="description" content="${LEIR}">`],
    ['canonical',   /<link rel="canonical"[^>]*>/,                                 `<link rel="canonical" href="${BAZIS}${URL_PATH}">`],
    ['og:title',    /<meta property="og:title"[^>]*>/,                             `<meta property="og:title" content="${CIM}">`],
    ['og:description', /<meta property="og:description"[^>]*>/,                     `<meta property="og:description" content="${LEIR}">`],
    ['og:url',      /<meta property="og:url"[^>]*>/,                               `<meta property="og:url" content="${BAZIS}${URL_PATH}">`],
  ];
  for (const [nev, minta, ujTag] of csere) {
    const elotte = fej;
    fej = cserelVagyBeszur(fej, minta, ujTag);
    console.log(`[kalkulator] fej/${nev}: ${elotte === fej ? 'VÁLTOZATLAN' : (minta.test(elotte) ? 'cserélve' : 'beszúrva')}`);
  }

  // a sablonból örökölt hreflang és ld+json nem ide való
  const hreflangDb = (fej.match(/<link rel="alternate" hreflang[^>]*>/g) || []).length;
  fej = fej.replace(/<link rel="alternate" hreflang[^>]*>/g, '');
  const ldDb = (fej.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).length;
  fej = fej.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  console.log(`[kalkulator] fej: ${hreflangDb} hreflang és ${ldDb} ld+json eltávolítva a sablonból`);

  fej = fej.replace('</head>', `<style>${STILUS}</style>\n${JSONLD}\n</head>`);

  // ---- oldal összerakása -------------------------------------------------
  const oldal = fej + elo + `\n${HERO}\n<div id="ca-kalk">\n${TORZS}\n</div>\n<script>${SZKRIPT}<\/script>\n` + uto;

  await mkdir(path.dirname(KIMENET), { recursive: true });
  await writeFile(KIMENET, oldal, 'utf8');
  console.log(`[kalkulator] KIÍRVA: ${KIMENET} (${(oldal.length/1024).toFixed(1)} kB)`);

  // ---- sitemap -----------------------------------------------------------
  if (existsSync(SITEMAP)) {
    let sm = await readFile(SITEMAP, 'utf8');
    const teljes = BAZIS + URL_PATH;
    if (sm.includes(teljes)) {
      console.log('[kalkulator] sitemap: MÁR BENNE VAN');
    } else {
      sm = sm.replace('</urlset>', `  <url><loc>${teljes}</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>\n</urlset>`);
      await writeFile(SITEMAP, sm, 'utf8');
      console.log('[kalkulator] sitemap: HOZZÁADVA');
    }
  } else {
    console.log('[kalkulator] sitemap: NINCS ILYEN FÁJL — kihagyva');
  }
}

fut().catch(e => { console.error('[kalkulator] HIBA (a build folytatódik):', e.message); });
