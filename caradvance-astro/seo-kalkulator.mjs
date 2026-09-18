#!/usr/bin/env node
/**
 * seo-kalkulator.mjs  —  v1  (2026-09-17)
 *
 * Legenerálja a  /honositas-kalkulator/  oldalt a dist/ mappába, egy meglévő
 * oldal fejlécét és láblécét sablonként használva, majd felveszi a sitemap.xml-be.
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

const STILUS = `#ca-kalk{
  --ink:#14171c; --ink-2:#474e59; --ink-3:#79818d;
  --ground:#f6f6f4; --panel:#fff; --panel-2:#fbfbfa;
  --line:#e3e3df; --line-2:#cbcbc5;
  --accent:#c8102e; --accent-soft:#fdeef0;
  --good:#1c6b4a; --good-soft:#e6f2ec;
  --warn:#8a6512; --warn-soft:#faf1da;
  --mono-bg:#f1f1ee; --field:#fff;
}

#ca-kalk *{box-sizing:border-box}

#ca-kalk{font-family:inherit;color:var(--ink);max-width:960px;margin:0 auto;padding-block:36px 72px;padding-left:20px;padding-right:20px;display:flex;flex-direction:column;gap:34px}
#ca-kalk h1, #ca-kalk h2, #ca-kalk h3{font-family:Archivo,system-ui,sans-serif;margin:0;text-wrap:balance}
#ca-kalk h1{font-size:30px;font-weight:700;letter-spacing:-.02em}
#ca-kalk h2{font-size:20px;font-weight:600;letter-spacing:-.01em}
#ca-kalk h3{font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
#ca-kalk p{margin:0}.lede{color:var(--ink-2);max-width:66ch}
#ca-kalk .eyebrow{font-family:Archivo,sans-serif;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-3)}
#ca-kalk header{display:flex;flex-direction:column;gap:9px;padding-bottom:22px;border-bottom:2px solid var(--ink)}
#ca-kalk .sec{display:flex;flex-direction:column;gap:14px}
#ca-kalk code{font-family:"JetBrains Mono",monospace;font-size:12.5px;background:var(--mono-bg);padding:1px 5px;border-radius:4px;border:1px solid var(--line)}

/* calculator */
#ca-kalk .calc{display:grid;grid-template-columns:1fr 340px;gap:18px;align-items:start}
@media(max-width:800px){.calc{grid-template-columns:1fr}}
#ca-kalk .form{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:17px}
#ca-kalk .fld{display:flex;flex-direction:column;gap:6px}
#ca-kalk .fld > label{font-family:Archivo,sans-serif;font-size:12.5px;font-weight:600;color:var(--ink)}
#ca-kalk .fld .hint{font-size:12.5px;color:var(--ink-3)}
#ca-kalk select, #ca-kalk input[type=number]{width:100%;font:inherit;font-size:15px;padding:9px 11px;border:1px solid var(--line-2);
  border-radius:8px;background:var(--field);color:var(--ink)}
#ca-kalk select:focus-visible, #ca-kalk input:focus-visible, #ca-kalk button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
#ca-kalk .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#ca-kalk .row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
#ca-kalk .seg{display:flex;border:1px solid var(--line-2);border-radius:8px;overflow:hidden}
#ca-kalk .seg button{flex:1;font:inherit;font-size:14px;padding:8px 6px;background:var(--field);color:var(--ink-2);border:0;cursor:pointer}
#ca-kalk .seg button + button{border-left:1px solid var(--line-2)}
#ca-kalk .seg button[aria-pressed=true]{background:var(--accent);color:#fff;font-weight:600}

#ca-kalk .result{background:var(--panel);border:1.5px solid var(--accent);border-radius:12px;overflow:hidden;position:sticky;top:12px}
#ca-kalk .result .top{background:var(--accent-soft);padding:17px 20px;border-bottom:1px solid var(--accent);display:flex;flex-direction:column;gap:2px}
#ca-kalk .result .top .k{font-family:Archivo,sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
#ca-kalk .result .top .v{font-family:"JetBrains Mono",monospace;font-size:30px;font-weight:700;color:var(--accent);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
#ca-kalk .result .body{padding:6px 20px 18px}
#ca-kalk .result dl{margin:0;display:flex;flex-direction:column}
#ca-kalk .result .line{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}
#ca-kalk .result .line:last-child{border-bottom:0}
#ca-kalk .result .line dt{color:var(--ink-2)}
#ca-kalk .result .line dd{margin:0;font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;white-space:nowrap}
#ca-kalk .result .line.strong dt, #ca-kalk .result .line.strong dd{font-weight:700;color:var(--ink)}
#ca-kalk .badge{display:inline-block;font-family:Archivo,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.05em;
  padding:2px 8px;border-radius:999px;background:var(--good-soft);color:var(--good);border:1px solid var(--good);margin-top:6px}

#ca-kalk .scroll{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--panel)}
#ca-kalk table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:560px}
#ca-kalk th, #ca-kalk td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line)}
#ca-kalk tbody tr:last-child td{border-bottom:0}
#ca-kalk th{font-family:Archivo,sans-serif;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);font-weight:600;background:var(--panel-2)}
#ca-kalk td.n{text-align:right;font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;white-space:nowrap}

#ca-kalk .note{padding:14px 16px;border-radius:9px;background:var(--warn-soft);
  border:1px solid color-mix(in srgb,var(--warn) 32%,transparent);font-size:14.5px;color:var(--ink)}
#ca-kalk .note b{font-family:Archivo,sans-serif;color:var(--warn)}
#ca-kalk .note.todo{background:var(--accent-soft);border-color:color-mix(in srgb,var(--accent) 32%,transparent)}
#ca-kalk .note.todo b{color:var(--accent)}
#ca-kalk .faq{display:flex;flex-direction:column;gap:10px}
#ca-kalk .faq details{background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:13px 16px}
#ca-kalk .faq summary{font-family:Archivo,sans-serif;font-weight:600;font-size:15px;cursor:pointer}
#ca-kalk .faq p{margin-top:9px;color:var(--ink-2);font-size:14.5px}
#ca-kalk .cta{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;padding:18px 20px;display:flex;flex-direction:column;gap:9px}
#ca-kalk .cta .t{font-family:Archivo,sans-serif;font-weight:700;font-size:17px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

const TORZS = `<div class="ca-kalk-fej">
  <h1>Honosítás kalkulátor 2026 — regisztrációs adó számítás</h1>
  <p class="lede">Számold ki, mennyi regisztrációs adót kell fizetned egy külföldről behozott
  személyautó után. A számítás a NAV 2026.01.01-től hatályos adótáblájával dolgozik.</p>
</div>




<section class="sec">
  <div class="calc">
    <div class="form">
      <div class="fld">
        <label for="osztaly">Környezetvédelmi osztály</label>
        <select id="osztaly"></select>
        <span class="hint">A forgalmi engedély V.9. rovatában találod.</span>
      </div>

      <div class="fld">
        <label for="teljesitmeny">Motorteljesítmény</label>
        <div class="row2">
          <input type="number" id="teljesitmeny" value="150" min="1" max="2000" step="1" inputmode="numeric">
          <div class="seg" role="group" aria-label="Mértékegység">
            <button type="button" id="egysegKw" aria-pressed="true">kW</button>
            <button type="button" id="egysegLe" aria-pressed="false">LE</button>
          </div>
        </div>
        <span class="hint" id="atvaltas">&nbsp;</span>
      </div>

      <div class="fld">
        <label>Milyen autóról van szó?</label>
        <div class="seg" role="group" aria-label="Új vagy használt">
          <button type="button" id="hasznaltGomb" aria-pressed="true">Külföldi, használt</button>
          <button type="button" id="ujGomb" aria-pressed="false">Magyarországon új</button>
        </div>
        <span class="hint">Új autónál nincs korkedvezmény: a teljes alapadót kell fizetni.</span>
      </div>

      <div class="fld" id="korBlokk" hidden>
        <label>Első forgalomba helyezés (külföldön)</label>
        <div class="row2">
          <select id="elsoEv" aria-label="Első forgalomba helyezés éve"></select>
          <select id="elsoHo" aria-label="Első forgalomba helyezés hónapja"></select>
        </div>
      </div>

      <div class="fld" id="regBlokk" hidden>
        <label>A regisztrációs eljárás kezdete</label>
        <div class="row2">
          <select id="regEv" aria-label="Regisztrációs eljárás éve"></select>
          <select id="regHo" aria-label="Regisztrációs eljárás hónapja"></select>
        </div>
        <span class="hint">Amikor a NAV-nál elindul az eljárás — jellemzően a behozatal hónapja.</span>
      </div>
    </div>

    <div class="result">
      <div class="top">
        <span class="k">Fizetendő regisztrációs adó</span>
        <span class="v" id="fizetendo">—</span>
        <span id="mentesBadge" hidden><span class="badge">Adómentes</span></span>
      </div>
      <div class="body">
        <dl>
          <div class="line"><dt>Teljesítménysáv</dt><dd id="oSav">—</dd></div>
          <div class="line"><dt>Alap regisztrációs adó</dt><dd id="oAlap">—</dd></div>
          <div class="line" id="lineKor"><dt>Eltelt hónapok</dt><dd id="oHonap">—</dd></div>
          <div class="line" id="lineSzorzo"><dt>Korkedvezmény szorzója</dt><dd id="oSzorzo">—</dd></div>
          <div class="line" id="lineCsokk"><dt>Adócsökkenés</dt><dd id="oCsokk">—</dd></div>
          <div class="line strong"><dt>Fizetendő</dt><dd id="oFiz">—</dd></div>
        </dl>
      </div>
    </div>
  </div>
</section>



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
    <p class="lede">A CarAdvance-nél a keresés, az alku, a szállítás és a teljes honosítási
    ügyintézés egy csomagban van — az autót a nevedre írt magyar forgalmival adjuk át.
    23 éve hozunk prémium autókat Németországból.</p>
    <p class="lede"><b>+36 30 233 6060</b> · info@caradvance.hu</p>
  </div>
  <p class="lede" style="font-size:13.5px">A kalkulátor tájékoztató jellegű. A fizetendő adót
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
    : ' ';
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
  const oldal = fej + elo + `\n<div id="ca-kalk">\n${TORZS}\n</div>\n<script>${SZKRIPT}<\/script>\n` + uto;

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
