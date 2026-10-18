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
