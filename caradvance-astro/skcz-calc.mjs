/**
 * caradvance.sk — szlovák illetékkalkulátorok (a magyar honosítás- és átírás-kalkulátor helyett).
 *
 * Szlovákiában a forgalomba helyezés (behozott autó) és az átírás (tulajdonosváltás) díja ugyanaz a tétel:
 * zákon č. 145/1995 Z. z. o správnych poplatkoch, sadzobník, položka 65 a) — „Zápis držiteľa motorového vozidla
 * … do evidencie vozidiel“: RP = Pkw × EKV, najmenej 33 €; elektromobil (písm. c) 33 €.
 * (Forrás: slov-lex.sk, a 2026. 9. 1-től és a 2026. 12. 1-től hatályos szöveg azonos.)
 *
 * A build a dist/sk/dovoz/kalkulacka-poplatkov/ és /kalkulacka-prepisu/ oldal <main> részét teljesen lecseréli,
 * a fejléc / lábléc / stílusok maradnak. A címet, a meta leírást és a JSON-LD-t is szlovákra cseréli.
 */
import fs from 'node:fs';
import path from 'node:path';

const PKW = [[80, 33], [90, 60], [100, 90], [110, 120], [125, 200], [140, 300], [155, 500], [170, 700], [210, 900], [null, 1000]];
const SRC = 'https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1995/145/';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function bandRows() {
  let prev = 0; const out = [];
  for (const [max, fee] of PKW) {
    const label = max === null ? `nad ${prev} kW` : (prev === 0 ? `do ${max} kW vrátane` : `nad ${prev} do ${max} kW vrátane`);
    out.push(`<tr><td>${label}</td><td class="n">${fee.toLocaleString('sk-SK')} €</td></tr>`);
    prev = max;
  }
  return out.join('');
}

const EKV_ROWS = [
  ['Vozidlo staršie ako 40 rokov od prvej evidencie (akékoľvek palivo)', '0,10'],
  ['Plug-in hybrid (PHEV) alebo vodík (H2)', '0,20'],
  ['Euro 6d a novšie (prvá evidencia od 1. 9. 2020)', '0,40'],
  ['Euro 6a, 6b, 6c (1. 9. 2016 – 31. 8. 2020)', '0,45'],
  ['Euro 5 / EEV (1. 1. 2012 – 31. 8. 2016)', '0,50'],
  ['Euro 4 (1. 1. 2007 – 31. 12. 2011)', '0,60'],
  ['Euro 3 (1. 1. 2002 – 31. 12. 2006)', '0,70'],
  ['Euro 2 (1. 1. 1997 – 31. 12. 2001)', '0,80'],
  ['Euro 1 (do 31. 12. 1996)', '1,00']
];

const FAQ = (kind) => [
  [kind === 'prepis' ? 'Koľko stojí prepis auta v roku 2026?' : 'Koľko stojí prihlásenie dovezeného auta v roku 2026?',
    'Správny poplatok sa vypočíta ako sadzba podľa výkonu motora (33 € až 1 000 €) vynásobená ekologickým koeficientom vozidla (0,10 až 1,00), najmenej však 33 €. Napríklad diesel so 140 kW a normou Euro 6d: 300 € × 0,40 = 120 €. Kalkulačka vyššie ho vypočíta za vás.'],
  [kind === 'prepis' ? 'Je poplatok za prepis rovnaký ako pri prihlásení dovezeného auta?' : 'Platí sa pri dovoze aj poplatok za prepis?',
    'Na Slovensku ide o jeden a ten istý poplatok: zápis držiteľa vozidla do evidencie vozidiel (zákon č. 145/1995 Z. z., sadzobník, položka 65). Platí sa pri prvom prihlásení dovezeného auta aj pri každom prepise na nového držiteľa — nič navyše sa nepripočítava.'],
  ['Koľko stojí prihlásenie alebo prepis elektromobilu?',
    'Pri vozidle, ktorého jediným zdrojom energie je elektrina, je poplatok pevne 33 € bez ohľadu na výkon. Plug-in hybrid platí sadzbu podľa výkonu × 0,20.'],
  ['Ako sa určí ekologický koeficient?',
    'Podľa druhu paliva (položka 18 osvedčenia o evidencii časť II) a emisnej normy Euro: od 0,40 pri Euro 6d až po 1,00 pri Euro 1. Plug-in hybridy a vodíkové autá majú 0,20, vozidlá staršie ako 40 rokov 0,10. Ak sa emisná norma nedá určiť, rozhoduje dátum prvej evidencie.'],
  ['Kto je od poplatku oslobodený alebo platí menej?',
    'Oslobodený je zápis držiteľa pri dedení, na základe úradného príkazu alebo rozhodnutia súdu a pri zániku bezpodielového spoluvlastníctva manželov, a ak bol na kúpu auta poskytnutý príspevok pre osobu s ťažkým zdravotným postihnutím. Držiteľ preukazu ŤZP / ŤZP-S platí polovicu; rodina s nárokom na prídavok aspoň na štyri deti platí pri aute M1 s najmenej šiestimi miestami a výkonom do 110 kW polovicu, najviac však 33 €.'],
  ['Platí sa pri dovoze ojazdeného auta slovenská DPH?',
    'Pri ojazdenom aute kúpenom od predajcu z EÚ s osobitnou úpravou (zdanenie prirážky) slovenská DPH spravidla nevzniká. Auto mladšie ako šesť mesiacov alebo s nájazdom do 6 000 km sa však považuje za nový dopravný prostriedok a DPH sa z neho platí na Slovensku.']
];

function calcHtml(kind, links) {
  const isP = kind === 'prepis';
  const h2 = isP ? 'Kalkulačka poplatku za prepis vozidla' : 'Kalkulačka poplatku za prihlásenie dovezeného auta';
  const lead = isP
    ? 'Zadajte výkon motora, palivo a emisnú normu — okamžite uvidíte správny poplatok, ktorý nový držiteľ zaplatí na dopravnom inšpektoráte pri prepise.'
    : 'Zadajte výkon motora, palivo a emisnú normu — okamžite uvidíte správny poplatok za zápis auta dovezeného zo zahraničia do slovenskej evidencie vozidiel.';
  const yearOpts = [];
  const nowY = new Date().getFullYear();
  for (let y = nowY; y >= 1960; y--) yearOpts.push(`<option value="${y}"${y === nowY - 3 ? ' selected' : ''}>${y}</option>`);
  const mons = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];
  const monOpts = mons.map((m, i) => `<option value="${i + 1}"${i === 0 ? ' selected' : ''}>${m}</option>`).join('');
  return `
<div class="lk" id="kalkulator">
<div class="lk-head">
<span class="lk-eyebrow">Kalkulačka 2026</span>
<h2 class="lk-title">${h2}</h2>
<p class="lk-lead">${lead}</p>
</div>
<div class="lk-grid">
<div class="lk-inputs">
<div class="lk-field">
<label for="skc-kw"><span class="lk-lbl">Výkon motora</span></label>
<div class="lk-gy2">
<input type="number" id="skc-kw" class="lk-in" value="140" min="1" max="2000" step="1" inputmode="numeric">
<div class="lk-seg lk-seg-unit" role="group" aria-label="Jednotka">
<button type="button" class="lk-segbtn" id="skc-ukw" aria-pressed="true">kW</button>
<button type="button" class="lk-segbtn" id="skc-uk" aria-pressed="false">k</button>
</div>
</div>
<span class="lk-hint" id="skc-conv">Výkon nájdete v osvedčení o evidencii (P.2).</span>
</div>
<div class="lk-field">
<label for="skc-fuel"><span class="lk-lbl">Palivo / pohon</span></label>
<select id="skc-fuel" class="lk-in lk-sel">
<option value="ice" selected>Benzín, nafta, LPG, CNG alebo hybrid bez nabíjania (HEV)</option>
<option value="phev">Plug-in hybrid (PHEV)</option>
<option value="h2">Vodík (H2)</option>
<option value="ev">Elektromobil (len elektrina)</option>
</select>
<span class="lk-hint">Druh paliva je v osvedčení o evidencii časť II, položka 18.</span>
</div>
<div class="lk-field" id="skc-normf">
<label for="skc-norm"><span class="lk-lbl">Emisná norma Euro</span></label>
<select id="skc-norm" class="lk-in lk-sel">
<option value="0.40" selected>Euro 6d alebo novšia</option>
<option value="0.45">Euro 6a, 6b, 6c</option>
<option value="0.50">Euro 5 / EEV</option>
<option value="0.60">Euro 4</option>
<option value="0.70">Euro 3</option>
<option value="0.80">Euro 2</option>
<option value="1.00">Euro 1</option>
<option value="date">Neviem — určiť podľa dátumu prvej evidencie</option>
</select>
<span class="lk-hint">Emisnú normu nájdete v COC liste alebo v technickom preukaze.</span>
</div>
<div class="lk-field">
<label><span class="lk-lbl">Prvá evidencia vozidla</span></label>
<div class="lk-gy2">
<select id="skc-y" class="lk-in lk-sel" aria-label="Rok prvej evidencie">${yearOpts.join('')}</select>
<select id="skc-m" class="lk-in lk-sel" aria-label="Mesiac prvej evidencie">${monOpts}</select>
</div>
<span class="lk-hint">Rozhoduje pri vozidlách starších ako 40 rokov a ak emisnú normu nepoznáte.</span>
</div>
</div>
<div class="lk-result">
<div class="lk-monthly">
<span class="lk-mlabel">${isP ? 'Poplatok za prepis' : 'Poplatok za prihlásenie'}</span>
<div class="lk-mval"><span class="lk-mnum" id="skc-total">—</span></div>
</div>
<div class="lk-rows">
<div class="lk-row"><span>Výkon</span><b id="skc-o-kw">—</b></div>
<div class="lk-row"><span>Výkonové pásmo</span><b id="skc-o-band">—</b></div>
<div class="lk-row"><span>Sadzba podľa výkonu (Pkw)</span><b id="skc-o-pkw">—</b></div>
<div class="lk-row"><span>Ekologický koeficient (EKV)</span><b id="skc-o-ekv">—</b></div>
<div class="lk-row"><span>Výpočet</span><b id="skc-o-calc">—</b></div>
<div class="lk-row lk-total"><span>Správny poplatok</span><b id="skc-o-fee">—</b></div>
</div>
<a class="lk-cta" href="${links.kontakt}">${isP ? 'Prepis za vás vybavíme →' : 'Prihlásenie za vás vybavíme →'}</a>
<p class="lk-disc"><b>Kalkulačka má informatívny charakter.</b> Výšku poplatku vždy určí dopravný inšpektorát. Nezahŕňa kontrolu originality, technickú a emisnú kontrolu, tabuľky s EČV ani povinné zmluvné poistenie. Zdroj: <a href="${SRC}" target="_blank" rel="noopener">zákon č. 145/1995 Z. z., sadzobník, položka 65</a>.</p>
</div>
</div>
</div>`;
}

const CALC_JS = `<script id="skc-js">(function(){
var P=${JSON.stringify(PKW.map(([m, f]) => [m === null ? 1e9 : m, f]))};
function $(i){return document.getElementById(i)}
var unit='kW';
function fmt(x){var r=Math.round(x*100)/100;var s=(r%1?r.toFixed(2):String(r)).replace('.',',');return s.replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u00a0')+'\\u00a0€'}
function kw(){var v=parseFloat(String($('skc-kw').value).replace(',','.'))||0;return unit==='k'?v*0.73549875:v}
function band(k){var prev=0;for(var i=0;i<P.length;i++){if(k<=P[i][0])return{from:prev,to:P[i][0],fee:P[i][1]};prev=P[i][0]}}
function byDate(y,m){var d=y*100+m;if(d<=199612)return[1,'Euro 1 (prvá evidencia do 1996)'];if(d<=200112)return[0.8,'Euro 2 (1997–2001)'];if(d<=200612)return[0.7,'Euro 3 (2002–2006)'];if(d<=201112)return[0.6,'Euro 4 (2007–2011)'];if(d<=201608)return[0.5,'Euro 5 (2012 – 8/2016)'];if(d<=202008)return[0.45,'Euro 6a–c (9/2016 – 8/2020)'];return[0.4,'Euro 6d (od 9/2020)']}
function calc(){
 var k=kw(),fuel=$('skc-fuel').value,y=+$('skc-y').value,m=+$('skc-m').value,ns=$('skc-norm').value;
 $('skc-normf').style.display=(fuel==='ice')?'':'none';
 $('skc-conv').textContent=unit==='k'?('≈ '+(Math.round(k*10)/10).toString().replace('.',',')+' kW'):('≈ '+Math.round(k/0.73549875)+' k');
 var b=band(k),now=new Date(),old=(new Date(y+40,m-1,1)<now),e,why,fee,calc;
 if(fuel==='ev'){fee=33;e=null;why='elektromobil — pevný poplatok';calc='33 € (písm. c)'}
 else{
  if(old){e=0.1;why='vozidlo staršie ako 40 rokov'}
  else if(fuel==='phev'||fuel==='h2'){e=0.2;why=fuel==='phev'?'plug-in hybrid':'vodík'}
  else if(ns==='date'){var r=byDate(y,m);e=r[0];why=r[1]}
  else{e=+ns;why=$('skc-norm').options[$('skc-norm').selectedIndex].text}
  var raw=b.fee*e;fee=Math.max(33,raw);calc=fmt(b.fee)+' × '+String(e).replace('.',',')+' = '+fmt(raw)+(raw<33?' → minimum 33 €':'');
 }
 $('skc-o-kw').textContent=(Math.round(k*10)/10).toString().replace('.',',')+' kW';
 $('skc-o-band').textContent=b.from?('nad '+b.from+(b.to<1e9?' do '+b.to+' kW':' kW')):('do '+b.to+' kW');
 $('skc-o-pkw').textContent=fuel==='ev'?'—':fmt(b.fee);
 $('skc-o-ekv').textContent=e===null?'—':(String(e).replace('.',',')+' ('+why+')');
 $('skc-o-calc').textContent=calc;
 $('skc-o-fee').textContent=fmt(fee);$('skc-total').textContent=fmt(fee);
}
function setUnit(u){if(u===unit)return;var k=kw();unit=u;$('skc-kw').value=u==='k'?Math.round(k/0.73549875):Math.round(k);$('skc-ukw').setAttribute('aria-pressed',u==='kW');$('skc-uk').setAttribute('aria-pressed',u==='k');calc()}
$('skc-ukw').addEventListener('click',function(){setUnit('kW')});$('skc-uk').addEventListener('click',function(){setUnit('k')});
['skc-kw','skc-fuel','skc-norm','skc-y','skc-m'].forEach(function(i){$(i).addEventListener('input',calc);$(i).addEventListener('change',calc)});
calc();
})();</script>`;

function mainHtml(kind, hero, links) {
  const isP = kind === 'prepis';
  const faq = FAQ(kind);
  const h1 = isP ? 'Poplatok za prepis auta 2026 —<br><span class="accent">kalkulačka podľa výkonu a emisií</span>'
    : 'Poplatok za prihlásenie auta 2026 —<br><span class="accent">dovoz z Nemecka, kalkulačka</span>';
  const sub = isP
    ? 'Na Slovensku sa pri prepise platí správny poplatok za zápis nového držiteľa do evidencie vozidiel. Závisí od výkonu motora a ekologického koeficientu — vypočítajte si ho a prepis nám pokojne zverte celý.'
    : 'Pri prvom prihlásení auta dovezeného zo zahraničia sa na Slovensku platí správny poplatok za zápis držiteľa do evidencie vozidiel. Vypočítajte si ho podľa aktuálneho sadzobníka — dovoz aj prihlásenie za vás vybavíme na kľúč.';
  let heroHtml = hero
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${h1}</h1>`)
    .replace(/(<p class="sub[^"]*">)[\s\S]*?(<\/p>)/, `$1${sub}$2`)
    .replace(/(<a class="btn btn-primary" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1#kalkulator$2Vypočítať poplatok$3`)
    .replace(/(<a class="btn btn-white" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1${links.kontakt}$2Potrebujem pomoc$3`);
  const other = isP ? links.dovozCalc : links.prepisCalc;
  const steps = isP
    ? [['Kontrola originality', 'Pri prepise ojazdeného auta sa vykonáva na stanici kontroly originality; potvrdenie predložíte na dopravnom inšpektoráte.'],
      ['Povinné zmluvné poistenie', 'Nový držiteľ uzavrie PZP ešte pred zápisom do evidencie.'],
      ['Zápis na dopravnom inšpektoráte', 'Pôvodný a nový držiteľ (alebo splnomocnená osoba) požiadajú o zmenu držiteľa; zaplatí sa poplatok podľa kalkulačky.'],
      ['Nové osvedčenie o evidencii', 'Na nového držiteľa sa vystaví osvedčenie o evidencii; tabuľky s EČV môžu zostať.']]
    : [['Kontrola originality', 'Overenie identifikátorov vozidla (VIN, štítky) a dokladov na stanici kontroly originality.'],
      ['Technická a emisná kontrola', 'Ak ju dopravný inšpektorát vyžaduje — najmä pri vozidle bez platnej kontroly z krajiny pôvodu.'],
      ['Povinné zmluvné poistenie', 'PZP uzavriete pred prihlásením — bez neho vozidlo do evidencie nezapíšu.'],
      ['Prihlásenie na dopravnom inšpektoráte', 'Zaplatí sa poplatok podľa kalkulačky, vydá sa osvedčenie o evidencii a tabuľky s EČV.']];
  return `<main>
${heroHtml}
<div id="ca-kalk">
${calcHtml(kind, links)}

<section class="sec">
<h2>Sadzba podľa výkonu motora (Pkw)</h2>
<p class="lede">Tabuľka č. 1 k položke 65 sadzobníka správnych poplatkov — platí pre osobné autá (M1), motocykle (L) a ľahké úžitkové vozidlá (N1).</p>
<div class="scroll"><table><thead><tr><th>Výkon motora</th><th class="n">Sadzba</th></tr></thead><tbody>${bandRows()}</tbody></table></div>
</section>

<section class="sec">
<h2>Ekologický koeficient vozidla (EKV)</h2>
<p class="lede">Poplatok = sadzba × koeficient, najmenej 33 €. Elektromobil platí pevných 33 €.</p>
<div class="scroll"><table><thead><tr><th>Vozidlo</th><th class="n">EKV</th></tr></thead><tbody>${EKV_ROWS.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join('')}</tbody></table></div>
<p class="lede">Dátum prvej evidencie sa použije len vtedy, ak sa emisná norma Euro nedá určiť.</p>
</section>

<section class="ca-proc">
<span class="ca-eyebrow">${isP ? 'Priebeh prepisu' : 'Priebeh prihlásenia'}</span>
<h2 class="ca-sectitle">${isP ? 'Štyri kroky k prepisu auta' : 'Štyri kroky k prihláseniu dovezeného auta'}</h2>
<div class="ca-steps">
${steps.map(([t, p], i) => `<div class="ca-step"><div class="ca-sn">${i + 1}</div><h3>${t}</h3><p>${p}</p></div>`).join('\n')}
</div>
</section>

<section class="sec">
<h2>Časté otázky</h2>
<div class="faq">
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary>\n<p>${esc(a)}</p></details>`).join('\n')}
</div>
</section>

<section class="sec">
<div class="cta">
<div class="t">${isP ? 'Prepis za vás vybavíme' : 'Dovoz a prihlásenie na kľúč'}</div>
<p>${isP ? 'Kontrolu originality, papiere aj návštevu dopravného inšpektorátu zariadime za vás.' : 'Auto nájdeme, preveríme, dovezieme z Nemecka a odovzdáme so slovenským osvedčením o evidencii na vaše meno.'}</p>
<p>${isP ? 'Dovážate auto zo zahraničia? Pozrite si' : 'Prepisujete auto už evidované na Slovensku? Pozrite si'} <a href="${other}" style="color:#fff;text-decoration:underline">${isP ? 'kalkulačku poplatku za prihlásenie' : 'kalkulačku poplatku za prepis'}</a>.</p>
<p><b>+421 915 410 555</b> · info@caradvance.sk</p>
</div>
<p class="foot">Kalkulačka má informatívny charakter. Zdroj: zákon č. 145/1995 Z. z. o správnych poplatkoch, sadzobník, položka 65 (znenie účinné od 1. 9. 2026).</p>
</section>
</div>
${CALC_JS}
</main>`;
}

function ldJson(kind, url) {
  const isP = kind === 'prepis';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: isP ? 'Kalkulačka poplatku za prepis vozidla' : 'Kalkulačka poplatku za prihlásenie vozidla', url, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'sk', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } },
      { '@type': 'FAQPage', mainEntity: FAQ(kind).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  }).replace(/<\//g, '<\\/');
}

function patchFile(file, kind, links, url) {
  if (!fs.existsSync(file)) return false;
  let h = fs.readFileSync(file, 'utf8');
  const ms = h.indexOf('<main'), me = h.indexOf('</main>');
  if (ms < 0 || me < 0) return false;
  const main = h.slice(ms, me + 7);
  const hero = (main.match(/<section class="hero">[\s\S]*?<\/section>/) || [''])[0];
  h = h.slice(0, ms) + mainHtml(kind, hero, links) + h.slice(me + 7);
  const isP = kind === 'prepis';
  const title = isP ? 'Poplatok za prepis auta 2026 — kalkulačka | CarAdvance' : 'Poplatok za prihlásenie auta 2026 — kalkulačka pre dovoz | CarAdvance';
  const desc = isP
    ? 'Koľko stojí prepis auta na Slovensku v roku 2026? Kalkulačka správneho poplatku podľa výkonu motora a ekologického koeficientu (položka 65, zákon 145/1995 Z. z.).'
    : 'Koľko stojí prihlásenie auta dovezeného z Nemecka v roku 2026? Kalkulačka správneho poplatku podľa výkonu a emisnej normy Euro (položka 65, zákon 145/1995 Z. z.).';
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(desc) + b);
  h = h.replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(title) + b);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${ldJson(kind, url)}</script>`);
  fs.writeFileSync(file, h);
  return true;
}

/** dist/sk — a két kalkulátor-oldal cseréje. map: régi magyar cím → új szlovák cím (_slugs.json). */
export function runSk(base, map) {
  const loc = (hu, def) => map[hu] || def;
  const links = {
    kontakt: '/sk' + loc('/kapcsolat/', '/kontakt/'),
    dovozCalc: '/sk' + loc('/honositas-kalkulator/', '/dovoz/kalkulacka-poplatkov/'),
    prepisCalc: '/sk' + loc('/atiras-kalkulator/', '/dovoz/kalkulacka-prepisu/')
  };
  let n = 0;
  if (patchFile(path.join(base, loc('/honositas-kalkulator/', '/dovoz/kalkulacka-poplatkov/'), 'index.html'), 'dovoz', links, 'https://www.caradvance.sk' + loc('/honositas-kalkulator/', '/dovoz/kalkulacka-poplatkov/'))) n++;
  if (patchFile(path.join(base, loc('/atiras-kalkulator/', '/dovoz/kalkulacka-prepisu/'), 'index.html'), 'prepis', links, 'https://www.caradvance.sk' + loc('/atiras-kalkulator/', '/dovoz/kalkulacka-prepisu/'))) n++;
  return n;
}

// tesztekhez
export { mainHtml, CALC_JS, PKW };

/* ======================================================================================
 * caradvance.cz — cseh illetékkalkulátorok (a magyar honosítás- és átírás-kalkulátor helyett).
 *
 * Csehországban két állami tétel van:
 *  1) správní poplatek — zákon č. 634/2004 Sb., sazebník, položka 26 (zápis vozidla / změny vlastníka do registru):
 *     motorové vozidlo s nejméně čtyřmi koly 800 Kč, motocykl nad 50 cm³ 500 Kč, do 50 cm³ 300 Kč,
 *     přípojné vozidlo do 750 kg 500 Kč, nad 750 kg 700 Kč; nem kell fizetni, ha egyidejűleg EL rendszámot adnak ki.
 *  2) emisní poplatek — zákon č. 542/2020 Sb. (§ 113 an.), csak M1 és N1: EURO 0 10 000 Kč, EURO 1 5 000 Kč,
 *     EURO 2 3 000 Kč, EURO 3 és újabb 0 Kč; egy járműre csak egyszer (ha korábban már megfizették, nem kell).
 * (Forrás: olomouc.eu életszituáció-leírás, 2025. 7. 1-től; zakonyprolidi.cz.)
 * ====================================================================================== */
const CZ_SRC_634 = 'https://www.zakonyprolidi.cz/cs/2004-634';
const CZ_SRC_542 = 'https://www.zakonyprolidi.cz/cs/2020-542';
const CZ_TYPES = [
  ['m1', 'Osobní automobil (M1)', 800, true],
  ['n1', 'Lehký užitkový vůz (N1, do 3,5 t)', 800, true],
  ['moto', 'Motocykl nad 50 cm³', 500, false],
  ['moto50', 'Motocykl do 50 cm³ včetně', 300, false],
  ['trl', 'Přípojné vozidlo do 750 kg včetně', 500, false],
  ['trh', 'Přípojné vozidlo nad 750 kg', 700, false]
];
const CZ_EMIS = [['Euro 3 a novější', 0], ['Euro 2', 3000], ['Euro 1', 5000], ['Euro 0 nebo bez emisní normy', 10000]];

const CZ_FAQ = (kind) => [
  [kind === 'prepis' ? 'Kolik stojí přepis auta v roce 2026?' : 'Kolik stojí registrace dovezeného auta v roce 2026?',
    kind === 'prepis'
      ? 'Správní poplatek za zápis změny vlastníka osobního auta je 800 Kč (motocykl 300 nebo 500 Kč, přívěs 500 nebo 700 Kč). U aut s emisní normou Euro 2 a starší se k tomu připočítává emisní poplatek 3 000 až 10 000 Kč — pokud už za vozidlo nebyl zaplacen dříve. Auta s normou Euro 3 a novější emisní poplatek neplatí.'
      : 'Správní poplatek za zápis osobního auta do registru silničních vozidel je 800 Kč. Pokud se současně přiděluje registrační značka EL (elektromobil, vodík, plug-in hybrid do 50 g CO₂/km), poplatek se neplatí. U dovezeného auta s normou Euro 2 a starší se platí ještě emisní poplatek 3 000 až 10 000 Kč; Euro 3 a novější je bez emisního poplatku.'],
  ['Co je emisní poplatek (dříve „ekologická daň“)?',
    'Emisní poplatek podle zákona č. 542/2020 Sb. se platí u osobních aut (M1) a lehkých užitkových vozů (N1) při první registraci v ČR, při změně vlastníka nebo provozovatele. Výše: Euro 2 — 3 000 Kč, Euro 1 — 5 000 Kč, Euro 0 nebo bez normy — 10 000 Kč. Za jedno vozidlo se platí jen jednou: pokud už byl zaplacen (nebo dřívější ekopoplatek podle zákona o odpadech), znovu se neplatí. Osvobození upravuje § 115 zákona.'],
  ['Platí se poplatek za elektromobil?',
    'Pokud se elektromobilu (nebo vozu na vodík či plug-in hybridu do 50 g CO₂/km) při registraci současně přidělí registrační značka EL, správní poplatek se neplatí. Při přepisu vozidla, které už značku EL má, se platí běžných 800 Kč. Emisní poplatek se elektromobilů netýká.'],
  ['Kde najdu emisní normu vozidla?',
    'V osvědčení o registraci (technickém průkazu), v COC listu nebo v datech výrobce. Pokud normu neznáte, kalkulačka ji odhadne podle data první registrace — rozhodující je však údaj v dokladech vozidla.'],
  ['Co dalšího je potřeba zaplatit?',
    'Evidenční kontrolu ve stanici technické kontroly (cena podle ceníku stanice), u dovezeného vozu případně technickou prohlídku, povinné ručení (pojištění odpovědnosti) a při převozu vozidla případně převozní značky. Tyto položky kalkulačka nezahrnuje.'],
  ['Platí se při dovozu ojetého auta z Německa česká DPH?',
    'U ojetého auta koupeného od obchodníka z EU ve zvláštním režimu (zdanění přirážky) česká DPH zpravidla nevzniká. Auto mladší než šest měsíců nebo s nájezdem do 6 000 km se však považuje za nový dopravní prostředek a DPH se z něj platí v ČR.']
];

function czCalcHtml(kind, links) {
  const isP = kind === 'prepis';
  const yearOpts = [];
  const nowY = new Date().getFullYear();
  for (let y = nowY; y >= 1960; y--) yearOpts.push(`<option value="${y}"${y === nowY - 3 ? ' selected' : ''}>${y}</option>`);
  return `
<div class="lk" id="kalkulator">
<div class="lk-head">
<span class="lk-eyebrow">Kalkulačka 2026</span>
<h2 class="lk-title">${isP ? 'Kalkulačka poplatků za přepis vozidla' : 'Kalkulačka poplatků za registraci dovezeného auta'}</h2>
<p class="lk-lead">${isP ? 'Vyberte druh vozidla, pohon a emisní normu — okamžitě uvidíte správní a emisní poplatek, který nový vlastník zaplatí na registru vozidel při přepisu.' : 'Vyberte druh vozidla, pohon a emisní normu — okamžitě uvidíte správní a emisní poplatek za zápis auta dovezeného ze zahraničí do českého registru vozidel.'}</p>
</div>
<div class="lk-grid">
<div class="lk-inputs">
<div class="lk-field">
<label for="czc-type"><span class="lk-lbl">Druh vozidla</span></label>
<select id="czc-type" class="lk-in lk-sel">${CZ_TYPES.map(([v, t], i) => `<option value="${v}"${i === 0 ? ' selected' : ''}>${t}</option>`).join('')}</select>
<span class="lk-hint">Kategorie vozidla je v osvědčení o registraci (kolonka J) nebo v COC listu.</span>
</div>
<div class="lk-field" id="czc-fuelf">
<label for="czc-fuel"><span class="lk-lbl">Pohon</span></label>
<select id="czc-fuel" class="lk-in lk-sel">
<option value="ice" selected>Benzín, nafta, LPG, CNG nebo hybrid bez nabíjení</option>
<option value="phev">Plug-in hybrid</option>
<option value="ev">Elektromobil nebo vodík</option>
</select>
</div>
<div class="lk-field" id="czc-elf" style="display:none">
<label class="lk-check" style="display:flex;gap:.6em;align-items:flex-start;cursor:pointer"><input type="checkbox" id="czc-el" checked style="margin-top:.25em"> <span><span class="lk-lbl">${isP ? 'Současně žádám o přidělení značky EL' : 'Žádám o registrační značku EL'}</span><br><span class="lk-hint">Značku EL dostanou vozidla M1 a N1 s emisemi do 50 g CO₂/km. Při jejím přidělení se správní poplatek neplatí.${isP ? ' Pokud už vůz značku EL má, poplatek se platí.' : ''}</span></span></label>
</div>
<div class="lk-field" id="czc-normf">
<label for="czc-norm"><span class="lk-lbl">Emisní norma Euro</span></label>
<select id="czc-norm" class="lk-in lk-sel">
<option value="0" selected>Euro 3 a novější</option>
<option value="3000">Euro 2</option>
<option value="5000">Euro 1</option>
<option value="10000">Euro 0 nebo bez emisní normy</option>
<option value="date">Nevím — odhadnout podle data první registrace</option>
</select>
<span class="lk-hint">Emisní normu najdete v osvědčení o registraci nebo v COC listu.</span>
</div>
<div class="lk-field" id="czc-yf" style="display:none">
<label for="czc-y"><span class="lk-lbl">Rok první registrace</span></label>
<select id="czc-y" class="lk-in lk-sel">${yearOpts.join('')}</select>
</div>
${isP ? `<div class="lk-field" id="czc-paidf">
<label class="lk-check" style="display:flex;gap:.6em;align-items:flex-start;cursor:pointer"><input type="checkbox" id="czc-paid" style="margin-top:.25em"> <span><span class="lk-lbl">Emisní poplatek už byl za vozidlo v ČR zaplacen</span><br><span class="lk-hint">Za jedno vozidlo se platí jen jednou (platí i dřívější ekopoplatek podle zákona o odpadech). Údaj zjistíte na registru vozidel.</span></span></label>
</div>` : ''}
</div>
<div class="lk-result">
<div class="lk-monthly">
<span class="lk-mlabel">${isP ? 'Poplatky za přepis celkem' : 'Poplatky za registraci celkem'}</span>
<div class="lk-mval"><span class="lk-mnum" id="czc-total">—</span></div>
</div>
<div class="lk-rows">
<div class="lk-row"><span>Druh vozidla</span><b id="czc-o-type">—</b></div>
<div class="lk-row"><span>Správní poplatek (položka 26)</span><b id="czc-o-adm">—</b></div>
<div class="lk-row"><span>Emisní norma</span><b id="czc-o-norm">—</b></div>
<div class="lk-row"><span>Emisní poplatek</span><b id="czc-o-emis">—</b></div>
<div class="lk-row lk-total"><span>Celkem státu</span><b id="czc-o-fee">—</b></div>
</div>
<a class="lk-cta" href="${links.kontakt}">${isP ? 'Přepis vyřídíme za vás →' : 'Registraci vyřídíme za vás →'}</a>
<p class="lk-disc"><b>Kalkulačka má informativní charakter.</b> Výši poplatků vždy určí registr vozidel. Nezahrnuje evidenční kontrolu a technickou prohlídku, povinné ručení ani převozní značky. Zdroj: <a href="${CZ_SRC_634}" target="_blank" rel="noopener">zákon č. 634/2004 Sb., položka 26</a> a <a href="${CZ_SRC_542}" target="_blank" rel="noopener">zákon č. 542/2020 Sb.</a></p>
</div>
</div>
</div>`;
}

const CZ_CALC_JS = (isP) => `<script id="czc-js">(function(){
var T=${JSON.stringify(Object.fromEntries(CZ_TYPES.map(([v, t, f, e]) => [v, [t, f, e]])))},P=${isP ? 1 : 0};
function $(i){return document.getElementById(i)}
function fmt(x){return String(Math.round(x)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u00a0')+'\\u00a0Kč'}
function byYear(y){if(y<=1992)return[10000,'Euro 0 (odhad: první registrace do 1992)'];if(y<=1996)return[5000,'Euro 1 (odhad: 1993–1996)'];if(y<=2000)return[3000,'Euro 2 (odhad: 1997–2000)'];return[0,'Euro 3 a novější (odhad: od 2001)']}
function calc(){
 var t=$('czc-type').value,ty=T[t],m=ty[2],fuel=$('czc-fuel').value,ns=$('czc-norm').value;
 $('czc-fuelf').style.display=m?'':'none';
 var elOk=m&&(fuel==='ev'||fuel==='phev');
 $('czc-elf').style.display=elOk?'':'none';
 var ice=!(m&&fuel==='ev');
 $('czc-normf').style.display=(m&&ice)?'':'none';
 $('czc-yf').style.display=(m&&ice&&ns==='date')?'':'none';
 var adm=ty[1];if(elOk&&$('czc-el').checked)adm=0;
 var emis=0,nl='—';
 if(m&&ice){var r;if(ns==='date')r=byYear(+$('czc-y').value);else r=[+ns,$('czc-norm').options[$('czc-norm').selectedIndex].text];emis=r[0];nl=r[1]}
 else if(m){nl='elektromobil — netýká se'}
 else{nl='netýká se (jen M1 a N1)'}
 var paid=P&&$('czc-paid')&&$('czc-paid').checked;
 if(P&&$('czc-paidf'))$('czc-paidf').style.display=(m&&ice)?'':'none';
 if(paid&&emis)emis=0,nl+=' — již zaplaceno';
 $('czc-o-type').textContent=ty[0];
 $('czc-o-adm').textContent=adm?fmt(adm):(elOk?'0\\u00a0Kč (značka EL)':'0\\u00a0Kč');
 $('czc-o-norm').textContent=nl;
 $('czc-o-emis').textContent=fmt(emis);
 $('czc-o-fee').textContent=fmt(adm+emis);$('czc-total').textContent=fmt(adm+emis);
}
['czc-type','czc-fuel','czc-norm','czc-y','czc-el','czc-paid'].forEach(function(i){var e=$(i);if(!e)return;e.addEventListener('input',calc);e.addEventListener('change',calc)});
calc();
})();</script>`;

function czMainHtml(kind, hero, links) {
  const isP = kind === 'prepis';
  const faq = CZ_FAQ(kind);
  const h1 = isP ? 'Poplatek za přepis auta 2026 —<br><span class="accent">kalkulačka správního a emisního poplatku</span>'
    : 'Poplatek za registraci auta 2026 —<br><span class="accent">dovoz z Německa, kalkulačka</span>';
  const sub = isP
    ? 'Při přepisu se v Česku platí správní poplatek za zápis nového vlastníka do registru vozidel a u starších aut i emisní poplatek. Spočítejte si je — a přepis nám klidně svěřte celý.'
    : 'Při první registraci auta dovezeného ze zahraničí se v Česku platí správní poplatek a u aut s normou Euro 2 a starší i emisní poplatek. Spočítejte si je podle aktuálních předpisů — dovoz i registraci vyřídíme na klíč.';
  const heroHtml = hero
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${h1}</h1>`)
    .replace(/(<p class="sub[^"]*">)[\s\S]*?(<\/p>)/, `$1${sub}$2`)
    .replace(/(<a class="btn btn-primary" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1#kalkulator$2Spočítat poplatek$3`)
    .replace(/(<a class="btn btn-white" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1${links.kontakt}$2Chci pomoc$3`);
  const other = isP ? links.dovozCalc : links.prepisCalc;
  const steps = isP
    ? [['Evidenční kontrola', 'Provádí ji stanice technické kontroly; protokol se nepředkládá, úřad si ho dohledá v systému. Platí i platná technická prohlídka s evidenční kontrolou.'],
      ['Povinné ručení', 'Nový vlastník sjedná pojištění odpovědnosti ještě před zápisem do registru.'],
      ['Zápis na registru vozidel', 'Prodávající a kupující (nebo zmocněnec) požádají o zápis změny vlastníka na kterémkoli obecním úřadě obce s rozšířenou působností; zaplatí se poplatky podle kalkulačky.'],
      ['Nové osvědčení o registraci', 'Úřad vydá nové osvědčení o registraci vozidla; registrační značky zůstávají.']]
    : [['Evidenční kontrola', 'Ověření identifikátorů vozidla (VIN, štítky) a dokladů ve stanici technické kontroly.'],
      ['Technická prohlídka', 'Pokud ji registr vyžaduje — zejména u vozidla bez platné prohlídky ze země původu.'],
      ['Povinné ručení', 'Pojištění odpovědnosti sjednáte před registrací — bez něj vozidlo do registru nezapíšou.'],
      ['Registrace na registru vozidel', 'Zaplatí se poplatky podle kalkulačky, vydá se osvědčení o registraci a registrační značky.']];
  return `<main>
${heroHtml}
<div id="ca-kalk">
${czCalcHtml(kind, links)}

<section class="sec">
<h2>Správní poplatek za zápis do registru (položka 26)</h2>
<p class="lede">Sazebník zákona č. 634/2004 Sb. o správních poplatcích — platí pro zápis vozidla do registru i pro zápis změny vlastníka nebo provozovatele.</p>
<div class="scroll"><table><thead><tr><th>Vozidlo</th><th class="n">Poplatek</th></tr></thead><tbody>
<tr><td>Motorové vozidlo s nejméně čtyřmi koly (osobní auto, užitkový vůz)</td><td class="n">800 Kč</td></tr>
<tr><td>Motocykl nad 50 cm³</td><td class="n">500 Kč</td></tr>
<tr><td>Motocykl do 50 cm³ včetně</td><td class="n">300 Kč</td></tr>
<tr><td>Přípojné vozidlo nad 750 kg</td><td class="n">700 Kč</td></tr>
<tr><td>Přípojné vozidlo do 750 kg včetně</td><td class="n">500 Kč</td></tr>
<tr><td>Současně přidělovaná registrační značka EL</td><td class="n">0 Kč</td></tr>
</tbody></table></div>
</section>

<section class="sec">
<h2>Emisní poplatek (M1 a N1)</h2>
<p class="lede">Zákon č. 542/2020 Sb. o výrobcích s ukončenou životností — platí se jen jednou za život vozidla v ČR.</p>
<div class="scroll"><table><thead><tr><th>Emisní norma</th><th class="n">Poplatek</th></tr></thead><tbody>${CZ_EMIS.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b ? b.toLocaleString('cs-CZ').replace(/\s/g, '&nbsp;') + ' Kč' : '0 Kč'}</td></tr>`).join('')}</tbody></table></div>
</section>

<section class="ca-proc">
<span class="ca-eyebrow">${isP ? 'Průběh přepisu' : 'Průběh registrace'}</span>
<h2 class="ca-sectitle">${isP ? 'Čtyři kroky k přepisu auta' : 'Čtyři kroky k registraci dovezeného auta'}</h2>
<div class="ca-steps">
${steps.map(([t, p], i) => `<div class="ca-step"><div class="ca-sn">${i + 1}</div><h3>${t}</h3><p>${p}</p></div>`).join('\n')}
</div>
</section>

<section class="sec">
<h2>Časté otázky</h2>
<div class="faq">
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary>\n<p>${esc(a)}</p></details>`).join('\n')}
</div>
</section>

<section class="sec">
<div class="cta">
<div class="t">${isP ? 'Přepis vyřídíme za vás' : 'Dovoz a registrace na klíč'}</div>
<p>${isP ? 'Evidenční kontrolu, doklady i návštěvu registru vozidel zařídíme za vás.' : 'Auto najdeme, prověříme, dovezeme z Německa a předáme s českým osvědčením o registraci na vaše jméno.'}</p>
<p>${isP ? 'Dovážíte auto ze zahraničí? Podívejte se na' : 'Přepisujete auto už registrované v ČR? Podívejte se na'} <a href="${other}" style="color:#fff;text-decoration:underline">${isP ? 'kalkulačku poplatků za registraci' : 'kalkulačku poplatků za přepis'}</a>.</p>
<p><b>+421 915 410 555</b> · info@caradvance.cz</p>
</div>
<p class="foot">Kalkulačka má informativní charakter. Zdroj: zákon č. 634/2004 Sb. o správních poplatcích, položka 26; zákon č. 542/2020 Sb., emisní poplatek (stav 2026).</p>
</section>
</div>
${CZ_CALC_JS(isP)}
</main>`;
}

function czLd(kind, url) {
  const isP = kind === 'prepis';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: isP ? 'Kalkulačka poplatků za přepis vozidla' : 'Kalkulačka poplatků za registraci vozidla', url, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'cs', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CZK' } },
      { '@type': 'FAQPage', mainEntity: CZ_FAQ(kind).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  }).replace(/<\//g, '<\\/');
}

function czPatch(file, kind, links, url) {
  if (!fs.existsSync(file)) return false;
  let h = fs.readFileSync(file, 'utf8');
  const ms = h.indexOf('<main'), me = h.indexOf('</main>');
  if (ms < 0 || me < 0) return false;
  const main = h.slice(ms, me + 7);
  const hero = (main.match(/<section class="hero">[\s\S]*?<\/section>/) || [''])[0];
  h = h.slice(0, ms) + czMainHtml(kind, hero, links) + h.slice(me + 7);
  const isP = kind === 'prepis';
  const title = isP ? 'Poplatek za přepis auta 2026 — kalkulačka | CarAdvance' : 'Poplatek za registraci auta 2026 — kalkulačka pro dovoz | CarAdvance';
  const desc = isP
    ? 'Kolik stojí přepis auta v roce 2026? Kalkulačka správního poplatku (800 Kč, položka 26 zákona 634/2004 Sb.) a emisního poplatku podle normy Euro (zákon 542/2020 Sb.).'
    : 'Kolik stojí registrace auta dovezeného z Německa v roce 2026? Kalkulačka správního poplatku, značky EL a emisního poplatku podle normy Euro (zákon 634/2004 Sb., 542/2020 Sb.).';
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(desc) + b);
  h = h.replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(title) + b);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${czLd(kind, url)}</script>`);
  fs.writeFileSync(file, h);
  return true;
}

/** dist/cs — a két kalkulátor-oldal cseréje. map: régi magyar cím → új cseh cím (_slugs.json). */
export function runCs(base, map) {
  const loc = (hu, def) => map[hu] || def;
  const links = {
    kontakt: '/cs' + loc('/kapcsolat/', '/kontakt/'),
    dovozCalc: '/cs' + loc('/honositas-kalkulator/', '/dovoz/kalkulacka-poplatku/'),
    prepisCalc: '/cs' + loc('/atiras-kalkulator/', '/dovoz/kalkulacka-prepisu/')
  };
  let n = 0;
  if (czPatch(path.join(base, loc('/honositas-kalkulator/', '/dovoz/kalkulacka-poplatku/'), 'index.html'), 'dovoz', links, 'https://www.caradvance.cz' + loc('/honositas-kalkulator/', '/dovoz/kalkulacka-poplatku/'))) n++;
  if (czPatch(path.join(base, loc('/atiras-kalkulator/', '/dovoz/kalkulacka-prepisu/'), 'index.html'), 'prepis', links, 'https://www.caradvance.cz' + loc('/atiras-kalkulator/', '/dovoz/kalkulacka-prepisu/'))) n++;
  return n;
}
