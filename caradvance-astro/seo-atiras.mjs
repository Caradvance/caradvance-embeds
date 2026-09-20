#!/usr/bin/env node
/**
 * seo-atiras.mjs  —  v1  (2026-09-20)
 *
 * Legenerálja a  /atiras-kalkulator/  oldalt a dist/ mappába, a honosítás
 * kalkulátorral azonos ".lk" dizájnban (import hero + kártyás kalkulátor +
 * sötét eredménypanel + táblázat + GYIK).
 *
 * Gépjármű átírási költség = visszterhes vagyonszerzési illeték (kW × életkor)
 * + eredetiségvizsgálat + okmánydíjak (forgalmi engedély + törzskönyv).
 *
 * Adatforrás (2026, hivatalos):
 *  - NAV: "Gépjármű visszterhes vagyonszerzési illeték 2026. évre valorizált mértéke"
 *    (0–40 / 41–80 / 81–120 / 120+ kW × 0–3 / 4–8 / 8+ év).
 *  - Okmánydíjak: forgalmi engedély 6 000 Ft, törzskönyv 6 000 Ft.
 *  - Eredetiségvizsgálat személygépkocsira: 24 975 Ft (kategóriától függően eltérhet).
 *  - Adómentes: tisztán elektromos / nulla emissziós jármű, valamint egyenes ági
 *    rokon és házastárs közötti átírás (a vagyonszerzési illeték alól).
 *
 * A build-láncba a seo-kalkulator.mjs mellé kerül. Hibára exit 0 — a buildet sosem állítja meg.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST     = 'dist';
const SABLON   = path.join(DIST, 'beszerzesi-folyamat', 'index.html');
const KIMENET  = path.join(DIST, 'atiras-kalkulator', 'index.html');
const SITEMAP  = path.join(DIST, 'sitemap.xml');
const BAZIS    = 'https://www.caradvance.hu';
const URL_PATH = '/atiras-kalkulator/';

const CIM  = 'Átírás kalkulátor 2026 — gépjármű átírási illeték és költség | CarAdvance';
const LEIR = 'Számold ki a használt autó átírásának teljes költségét 2026-ban: vagyonszerzési illeték a NAV kW- és életkor-táblája alapján, plusz eredetiségvizsgálat és okmánydíjak. Azonnal, pontosan.';

const STILUS = `#ca-kalk{
  --red:#E2001A; --navy:#1a1d23; --ink:#141519; --muted:#5A6B82; --line:#E6EAF1; --good:#1D9E75;
  color:var(--ink);max-width:1080px;margin:0 auto;padding:28px 20px 72px;
  display:flex;flex-direction:column;gap:34px;font-family:inherit;
}
#ca-kalk *{box-sizing:border-box}
#ca-kalk p{margin:0}

/* ---- kalkulátor kártya (.lk) ---- */
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
#ca-kalk .lk-check{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#fbfcfe;cursor:pointer}
#ca-kalk .lk-check input{margin-top:2px;width:18px;height:18px;accent-color:var(--red);flex:0 0 auto}
#ca-kalk .lk-check span{font-size:13.5px;color:var(--ink);font-weight:600;line-height:1.45}
#ca-kalk .lk-check small{display:block;color:var(--muted);font-weight:500;font-size:12.5px;margin-top:2px}

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

/* ---- kiegészítő szekciók ---- */
#ca-kalk .sec{display:flex;flex-direction:column;gap:14px}
#ca-kalk h2{font-size:22px;font-weight:800;letter-spacing:-.01em;margin:0;color:var(--ink);text-wrap:balance}
#ca-kalk .lede{color:var(--muted);font-size:14.5px;max-width:74ch;margin:0}
#ca-kalk .lede b{color:var(--ink)}
#ca-kalk .scroll{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:#fff}
#ca-kalk table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:520px}
#ca-kalk th,#ca-kalk td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line)}
#ca-kalk tbody tr:last-child td{border-bottom:0}
#ca-kalk th{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#fff;font-weight:800;background:var(--navy);border-bottom:0}
#ca-kalk th.n{text-align:center}
#ca-kalk td.n{text-align:center;font-variant-numeric:tabular-nums;white-space:nowrap}
#ca-kalk tbody tr:nth-child(even) td{background:#fbfcfe}
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

const HERO = `<section class="hero">
  <video autoplay muted loop playsinline poster="/caradvance-hero-beszerzesi-poster.jpg">
    <source src="/caradvance-hero-beszerzesi.mp4" type="video/mp4">
  </video>
  <div class="scrim"></div>
  <div class="inner">
    <h1>Átírás kalkulátor 2026 —<br><span class="accent">a teljes átírási költség egy perc alatt</span></h1>
    <p class="sub sub-wide">Számold ki a használt autó átírásának teljes költségét: vagyonszerzési
    illeték a NAV kW- és életkor-táblája alapján, plusz eredetiségvizsgálat és okmánydíjak.
    Behozott autónál a teljes ügyintézést mi vállaljuk.</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="#kalkulator">Költség kiszámítása</a>
      <a class="btn btn-white" href="/kapcsolat">Kérek segítséget</a>
    </div>
  </div>
  <button class="scrolldown" type="button" onclick="document.getElementById('kalkulator').scrollIntoView({behavior:'smooth'})">Görgess
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
  </button>
</section>`;

const TORZS = `<div class="lk" id="kalkulator">
  <div class="lk-head">
    <span class="lk-eyebrow">Kalkulátor</span>
    <h2 class="lk-title">Gépjármű átírási költség kalkulátor</h2>
    <p class="lk-lead">Add meg a motor teljesítményét és az autó korát — azonnal megmutatjuk a
    fizetendő vagyonszerzési illetéket és az átírás teljes költségét a 2026-os hivatalos díjakkal.</p>
  </div>

  <div class="lk-grid">
    <div class="lk-inputs">
      <div class="lk-field">
        <label><span class="lk-lbl">Motorteljesítmény
          <span class="lk-tip"><button type="button" class="lk-i" aria-label="Információ">i</button>
          <span class="lk-tiptext">A motor névleges teljesítménye. kW-ban és lóerőben is megadhatod — a kalkulátor átváltja.</span></span>
        </span></label>
        <div class="lk-gy2">
          <input type="number" id="teljesitmeny" class="lk-in" value="110" min="1" max="2000" step="1" inputmode="numeric">
          <div class="lk-seg lk-seg-unit" role="group" aria-label="Mértékegység">
            <button type="button" class="lk-segbtn" id="egysegKw" aria-pressed="true">kW</button>
            <button type="button" class="lk-segbtn" id="egysegLe" aria-pressed="false">LE</button>
          </div>
        </div>
        <span class="lk-hint" id="atvaltas">&nbsp;</span>
      </div>

      <div class="lk-field">
        <label><span class="lk-lbl">Gyártási év
          <span class="lk-tip"><button type="button" class="lk-i" aria-label="Információ">i</button>
          <span class="lk-tiptext">Az illeték a gyártási évtől számított életkortól függ: 0–3 év, 4–8 év, vagy 8 év felett.</span></span>
        </span></label>
        <select id="gyartasiEv" class="lk-in lk-sel"></select>
        <span class="lk-hint" id="korHint">&nbsp;</span>
      </div>

      <div class="lk-field">
        <label><span class="lk-lbl">Adómentes átírás?</span></label>
        <label class="lk-check">
          <input type="checkbox" id="mentes">
          <span>Elektromos / nulla emissziós autó, vagy egyenes ági rokon / házastárs közötti átírás
          <small>Ezekben az esetekben a vagyonszerzési illeték 0 Ft — csak a vizsgálat és az okmányok díja marad.</small></span>
        </label>
      </div>
    </div>

    <div class="lk-result">
      <div class="lk-monthly">
        <span class="lk-mlabel">Az átírás teljes költsége</span>
        <div class="lk-mval"><span class="lk-mnum" id="osszeg">—</span></div>
        <span id="mentesBadge" hidden><span class="lk-badge">Illetékmentes</span></span>
      </div>
      <div class="lk-rows">
        <div class="lk-row"><span>Teljesítménysáv · kor</span><b id="oSav">—</b></div>
        <div class="lk-row"><span>Illeték mértéke</span><b id="oKulcs">—</b></div>
        <div class="lk-row"><span>Vagyonszerzési illeték</span><b id="oIlletek">—</b></div>
        <div class="lk-row"><span>Eredetiségvizsgálat</span><b id="oEredet">—</b></div>
        <div class="lk-row"><span>Okmánydíjak (forgalmi + törzskönyv)</span><b id="oOkmany">—</b></div>
        <div class="lk-row lk-total"><span>Fizetendő összesen</span><b id="oOssz">—</b></div>
      </div>
      <a class="lk-cta" href="/kapcsolat">Kérek segítséget az átírásban →</a>
      <p class="lk-disc"><b>A kalkulátor tájékoztató jellegű.</b> A pontos összeget a kormányablak,
      illetve a NAV állapítja meg. Díjak forrása: NAV, 2026 · okmánydíjak és eredetiségvizsgálat 2026.</p>
    </div>
  </div>
</div>

<section class="sec">
  <h2>A hivatalos illetéktábla</h2>
  <p class="lede">Visszterhes vagyonszerzési illeték forintban, a NAV 2026-ra valorizált táblája szerint.
  Az illeték a motor kW-ban kifejezett teljesítménye szorozva a lenti Ft/kW értékkel.</p>
  <div class="scroll">
    <table>
      <thead><tr>
        <th>Teljesítmény</th>
        <th class="n">0–3 év</th><th class="n">4–8 év</th><th class="n">8 év felett</th>
      </tr></thead>
      <tbody id="tablaBody"></tbody>
    </table>
  </div>
  <p class="lede">Ezen felül fizetendő az <b>eredetiségvizsgálat</b> (személygépkocsira 24 975 Ft,
  kategóriától függően eltérhet) és az <b>okmánydíjak</b>: forgalmi engedély 6 000 Ft, törzskönyv 6 000 Ft.
  A rendszám átíráskor a járművön marad, így általában nincs új rendszámtábla-díj.</p>
</section>

<section class="sec">
  <h2>Hogyan zajlik a gépjármű átírás 2026-ban?</h2>
  <p class="lede">A használt autó tulajdonjogának átírása néhány jól követhető lépésből áll. A vevőnek
  a birtokbavételtől — az adásvételi szerződés keltétől — számított <b>15 napon belül</b> kell
  kezdeményeznie az átírást a kormányablakban; a határidő elmulasztása bírságot vonhat maga után.
  Az eladó ezzel párhuzamosan <b>8 napon belül</b> bejelenti az adásvételt, így mentesül a jármű
  utáni későbbi kötelezettségek alól.</p>
  <div class="scroll">
    <table>
      <thead><tr><th>Lépés</th><th>Mi történik?</th></tr></thead>
      <tbody>
        <tr><td>1. Adásvételi szerződés</td><td>Két, teljes bizonyító erejű magánokiratba foglalt példány, az eladó és a vevő adataival, a jármű azonosítóival és a vételárral.</td></tr>
        <tr><td>2. Eredetiségvizsgálat</td><td>A vevő nevére, vizsgálóállomáson — az átírás előfeltétele. Díja személygépkocsira 24 975 Ft (kategóriától függően eltérhet).</td></tr>
        <tr><td>3. Kötelező biztosítás</td><td>A vevő a tulajdonszerzés napjától köteles kötelező gépjármű-felelősségbiztosítást (KGFB) kötni.</td></tr>
        <tr><td>4. Átírás a kormányablakban</td><td>A vagyonszerzési illeték és az okmánydíjak megfizetése után kiállítják az új forgalmi engedélyt és a törzskönyvet a vevő nevére.</td></tr>
      </tbody>
    </table>
  </div>
  <p class="lede">Az átíráshoz általában szükséges: az <b>adásvételi szerződés</b>, az eladó és a vevő
  <b>személyazonosító okmányai és lakcímkártyája</b>, az érvényes <b>eredetiségvizsgálati határozat</b>,
  az érvényes <b>műszaki vizsga</b> (forgalmi engedély), valamint a <b>kötelező biztosítás</b> megléte.
  Ha nem személyesen jársz el, <b>meghatalmazás</b> is kell. Az ügyet bármelyik kormányablakban
  vagy okmányirodában elintézheted.</p>
  <p class="lede">Külföldről — például Németországból — behozott autónál az átírást megelőzi a
  <b>honosítás</b>: a regisztrációs adó megfizetése, a honosítási műszaki vizsga és a forgalomba
  helyezés. A várható regisztrációs adót a <a href="/honositas-kalkulator/">honosítás kalkulátorral</a>
  tudod kiszámolni, a teljes ügyintézést pedig a CarAdvance kulcsrakészen elvégzi helyetted.</p>
</section>

<section class="sec">
  <h2>Gyakori kérdések</h2>
  <div class="faq">
    <details><summary>Mennyi egy 110 kW-os, 8 évnél idősebb autó átírása?</summary>
      <p>A 81–120 kW-os sávban, 8 év felett az illeték 550 Ft/kW, azaz 110 × 550 = <b>60 500 Ft</b>.
      Ehhez jön az eredetiségvizsgálat (24 975 Ft) és az okmánydíjak (12 000 Ft), így a teljes
      költség kb. <b>97 475 Ft</b>. A pontos összeget mindig a fenti kalkulátor adja meg.</p></details>
    <details><summary>Kell illetéket fizetni elektromos autó átírásakor?</summary>
      <p>Nem. A tisztán elektromos és a nulla emissziós (5E/5Z) járművek vagyonszerzési illeték alól
      mentesek — csak az eredetiségvizsgálat és az okmányok díját kell megfizetni.</p></details>
    <details><summary>Rokon közötti átírásnál is kell illetéket fizetni?</summary>
      <p>Egyenes ági rokonok (szülő–gyermek) és házastársak közötti átírás illetékmentes. Az
      eredetiségvizsgálat és az okmánydíjak ilyenkor is felmerülnek.</p></details>
    <details><summary>Hogyan számolja a NAV az autó életkorát?</summary>
      <p>A jármű gyártási évétől eltelt évek száma alapján: 0–3 év, 4–8 év, illetve 8 év felett.
      Minél idősebb az autó, annál alacsonyabb a fajlagos (Ft/kW) illeték.</p></details>
    <details><summary>Mi történik, ha Németországból hozott autót íratok át?</summary>
      <p>Behozott autónál előbb honosítás (regisztrációs adó, műszaki, forgalomba helyezés) történik,
      majd a jármű a nevedre kerül. A CarAdvance a kereséstől a kész magyar forgalmiig mindent intéz —
      a regisztrációs adót a <a href="/honositas-kalkulator/">honosítás kalkulátorral</a> tudod megbecsülni.</p></details>
  </div>
</section>

<section class="sec">
  <div class="cta">
    <div class="t">Bízd ránk a teljes ügyintézést</div>
    <p>A CarAdvance-nél a keresés, az alku, a szállítás, a honosítás és az átírás egy csomagban van —
    az autót a nevedre írt magyar forgalmival adjuk át. 23 éve hozunk prémium autókat Németországból.</p>
    <p><b>+36 30 233 6060</b> · info@caradvance.hu</p>
  </div>
  <p class="foot">A kalkulátor tájékoztató jellegű. A fizetendő összeget minden esetben az eljáró
  hatóság (kormányablak / NAV) állapítja meg. Díjak forrása: NAV 2026, valamint a 2026-os okmány- és
  eredetiségvizsgálati díjak.</p>
</section>

`;

const SZKRIPT = `
const KW_SAVOK=[{max:40,cimke:'0–40 kW'},{max:80,cimke:'41–80 kW'},{max:120,cimke:'81–120 kW'},{max:Infinity,cimke:'120 kW felett'}];
const ILLETEK=[[550,450,300],[750,550,450],[850,750,550],[950,850,750]];
const KOR_CIMKE=['0–3 év','4–8 év','8 év felett'];
const EREDETISEG=24975;
const FORGALMI=6000, TORZSKONYV=6000;
const OKMANY=FORGALMI+TORZSKONYV;
const LE_KW=0.7355;
const ft=n=>new Intl.NumberFormat('hu-HU').format(Math.round(n))+' Ft';
const $=id=>document.getElementById(id);

let egysegKw=true;

function kwSav(kw){for(let i=0;i<KW_SAVOK.length;i++) if(kw<=KW_SAVOK[i].max) return i; return 3;}
function korOszlop(kor){ if(kor<=3) return 0; if(kor<=8) return 1; return 2; }

function init(){
  const most=new Date(), evNow=most.getFullYear();
  let s='';
  for(let y=evNow;y>=evNow-40;y--) s+=\`<option value="\${y}">\${y}</option>\`;
  $('gyartasiEv').innerHTML=s;
  $('gyartasiEv').value=String(evNow-8);

  $('tablaBody').innerHTML=KW_SAVOK.map((sv,i)=>
    \`<tr><td>\${sv.cimke}</td>\`+ILLETEK[i].map(v=>\`<td class="n">\${new Intl.NumberFormat('hu-HU').format(v)} Ft/kW</td>\`).join('')+'</tr>').join('');

  $('egysegKw').onclick=()=>{egysegKw=true;szinkronEgyseg();};
  $('egysegLe').onclick=()=>{egysegKw=false;szinkronEgyseg();};
  ['teljesitmeny','gyartasiEv','mentes'].forEach(id=>{
    $(id).addEventListener('input',szamol); $(id).addEventListener('change',szamol);});

  document.querySelectorAll('#ca-kalk .lk-i').forEach(function(b){
    b.addEventListener('click',function(e){e.stopPropagation();
      var t=b.closest('.lk-tip');
      document.querySelectorAll('#ca-kalk .lk-tip.open').forEach(function(x){if(x!==t)x.classList.remove('open');});
      t.classList.toggle('open');});
  });
  document.addEventListener('click',function(){
    document.querySelectorAll('#ca-kalk .lk-tip.open').forEach(function(x){x.classList.remove('open');});});

  szinkronEgyseg();
}
function szinkronEgyseg(){
  $('egysegKw').setAttribute('aria-pressed',String(egysegKw));
  $('egysegLe').setAttribute('aria-pressed',String(!egysegKw));
  szamol();
}
function szamol(){
  const nyers=parseFloat($('teljesitmeny').value)||0;
  const kw=egysegKw?nyers:nyers*LE_KW;
  $('atvaltas').textContent = nyers>0
    ? (egysegKw ? \`\${Math.round(nyers/LE_KW)} lóerő\` : \`\${Math.round(kw)} kW\`)
    : ' ';
  const evNow=new Date().getFullYear();
  const kor=Math.max(0, evNow-parseInt($('gyartasiEv').value,10));
  const oszlop=korOszlop(kor);
  const i=kwSav(kw);
  const mentes=$('mentes').checked;

  $('korHint').textContent = kor+' éves — '+KOR_CIMKE[oszlop];
  $('oSav').textContent = KW_SAVOK[i].cimke+' · '+KOR_CIMKE[oszlop];

  const kulcs=ILLETEK[i][oszlop];
  const illetek = mentes ? 0 : Math.round(kw)*kulcs;
  $('oKulcs').textContent = kulcs+' Ft/kW';
  $('oIlletek').textContent = ft(illetek);
  $('oEredet').textContent = ft(EREDETISEG);
  $('oOkmany').textContent = ft(OKMANY);
  const ossz = illetek + EREDETISEG + OKMANY;
  $('oOssz').textContent = ft(ossz);
  $('osszeg').textContent = ft(ossz);
  $('mentesBadge').hidden = !mentes;
}
init();
`;

const JSONLD = `<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@graph":[
    {
      "@type":"WebApplication",
      "name":"Átírás kalkulátor",
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
      {"@type":"Question","name":"Mennyi egy 110 kW-os, 8 évnél idősebb autó átírása?","acceptedAnswer":{"@type":"Answer","text":"A 81–120 kW-os sávban, 8 év felett az illeték 550 Ft/kW, azaz 110 × 550 = 60 500 Ft. Ehhez jön az eredetiségvizsgálat (24 975 Ft) és az okmánydíjak (12 000 Ft), így a teljes költség kb. 97 475 Ft."}},
      {"@type":"Question","name":"Kell illetéket fizetni elektromos autó átírásakor?","acceptedAnswer":{"@type":"Answer","text":"Nem. A tisztán elektromos és a nulla emissziós (5E/5Z) járművek vagyonszerzési illeték alól mentesek — csak az eredetiségvizsgálat és az okmányok díját kell megfizetni."}},
      {"@type":"Question","name":"Rokon közötti átírásnál is kell illetéket fizetni?","acceptedAnswer":{"@type":"Answer","text":"Egyenes ági rokonok (szülő–gyermek) és házastársak közötti átírás illetékmentes. Az eredetiségvizsgálat és az okmánydíjak ilyenkor is felmerülnek."}},
      {"@type":"Question","name":"Hogyan számolja a NAV az autó életkorát?","acceptedAnswer":{"@type":"Answer","text":"A jármű gyártási évétől eltelt évek száma alapján: 0–3 év, 4–8 év, illetve 8 év felett. Minél idősebb az autó, annál alacsonyabb a fajlagos (Ft/kW) illeték."}},
      {"@type":"Question","name":"Mi történik, ha Németországból hozott autót íratok át?","acceptedAnswer":{"@type":"Answer","text":"Behozott autónál előbb honosítás (regisztrációs adó, műszaki, forgalomba helyezés) történik, majd a jármű a nevedre kerül. A CarAdvance a kereséstől a kész magyar forgalmiig mindent intéz."}}
      ]
    }
  ]
}<\/script>`;

function cserelVagyBeszur(fej, minta, ujTag) {
  return minta.test(fej) ? fej.replace(minta, ujTag) : fej.replace('</head>', ujTag + '\n</head>');
}

async function fut() {
  if (!existsSync(SABLON)) { console.log('[atiras] KIHAGYVA — nincs sablon:', SABLON); return; }

  const sablon = await readFile(SABLON, 'utf8');
  const fejVege = sablon.indexOf('</head>');
  if (fejVege === -1) { console.log('[atiras] KIHAGYVA — nincs </head> a sablonban'); return; }

  const mainNyit = sablon.indexOf('<main>');
  const mainZar  = sablon.indexOf('</main>');
  if (mainNyit === -1 || mainZar === -1) { console.log('[atiras] KIHAGYVA — nincs <main> a sablonban'); return; }

  let fej    = sablon.slice(0, fejVege + 7);
  const elo  = sablon.slice(fejVege + 7, mainNyit + 6);
  const uto  = sablon.slice(mainZar);

  const csere = [
    ['title',          /<title>[\s\S]*?<\/title>/,                 `<title>${CIM}</title>`],
    ['description',    /<meta name="description"[^>]*>/,           `<meta name="description" content="${LEIR}">`],
    ['canonical',      /<link rel="canonical"[^>]*>/,              `<link rel="canonical" href="${BAZIS}${URL_PATH}">`],
    ['og:title',       /<meta property="og:title"[^>]*>/,          `<meta property="og:title" content="${CIM}">`],
    ['og:description', /<meta property="og:description"[^>]*>/,    `<meta property="og:description" content="${LEIR}">`],
    ['og:url',         /<meta property="og:url"[^>]*>/,            `<meta property="og:url" content="${BAZIS}${URL_PATH}">`],
  ];
  for (const [nev, minta, ujTag] of csere) {
    const elotte = fej;
    fej = cserelVagyBeszur(fej, minta, ujTag);
    console.log(`[atiras] fej/${nev}: ${elotte === fej ? 'VÁLTOZATLAN' : (minta.test(elotte) ? 'cserélve' : 'beszúrva')}`);
  }

  fej = fej.replace(/<link rel="alternate" hreflang[^>]*>/g, '');
  fej = fej.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  fej = fej.replace('</head>', `<style>${STILUS}</style>\n${JSONLD}\n</head>`);

  const oldal = fej + elo + `\n${HERO}\n<div id="ca-kalk">\n${TORZS}\n</div>\n<script>${SZKRIPT}<\/script>\n` + uto;

  await mkdir(path.dirname(KIMENET), { recursive: true });
  await writeFile(KIMENET, oldal, 'utf8');
  console.log(`[atiras] KIÍRVA: ${KIMENET} (${(oldal.length/1024).toFixed(1)} kB)`);

  if (existsSync(SITEMAP)) {
    let sm = await readFile(SITEMAP, 'utf8');
    const teljes = BAZIS + URL_PATH;
    if (sm.includes(teljes)) console.log('[atiras] sitemap: MÁR BENNE VAN');
    else {
      sm = sm.replace('</urlset>', `  <url><loc>${teljes}</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>\n</urlset>`);
      await writeFile(SITEMAP, sm, 'utf8');
      console.log('[atiras] sitemap: HOZZÁADVA');
    }
  } else console.log('[atiras] sitemap: NINCS ILYEN FÁJL — kihagyva');
}

fut().catch(e => { console.error('[atiras] HIBA (a build folytatódik):', e.message); });
