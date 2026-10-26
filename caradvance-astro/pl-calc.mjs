/**
 * caradvance.pl — polskie kalkulatory (zamiast słowackich kalkulatorów opłaty rejestracyjnej).
 *
 *  1) /import/kalkulator-akcyzy/ — akcyza od samochodu osobowego sprowadzonego z Niemiec
 *     (ustawa o podatku akcyzowym: 3,1 % do 2000 cm³, 18,6 % powyżej; hybrydy 1,55 % / 9,3 %;
 *      hybrydy plug-in do 2000 cm³ zwolnione do 31.12.2029; elektryczne i wodorowe 0 %).
 *  2) /import/kalkulator-pcc/ — podatek PCC 2 % przy zakupie używanego auta od osoby prywatnej w Polsce.
 * Strona zachowuje nagłówek, stopkę i style; wymieniana jest zawartość <main>, tytuł, opisy i JSON-LD.
 */
import fs from 'node:fs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const YEAR = new Date().getFullYear();

const FAQ_A = [
  [`Ile wynosi akcyza za samochód sprowadzony z Niemiec w ${YEAR} roku?`,
    'Podstawowe stawki to 3,1 % wartości samochodu przy pojemności silnika do 2000 cm³ i 18,6 % powyżej 2000 cm³. Hybrydy mają stawki obniżone: 1,55 % do 2000 cm³ i 9,3 % w przedziale 2000–3500 cm³. Samochody elektryczne i wodorowe są zwolnione z akcyzy, a hybrydy plug-in z silnikiem do 2000 cm³ — do 31 grudnia 2029 r.'],
  ['Od jakiej kwoty liczy się akcyzę?',
    'Podstawą opodatkowania jest kwota należna z tytułu nabycia samochodu (cena zakupu) — nie niższa niż jego wartość rynkowa. Kwotę w euro przelicza się na złote według średniego kursu NBP z ostatniego dnia roboczego przed powstaniem obowiązku podatkowego.'],
  ['Kto i gdzie płaci akcyzę?',
    'Akcyzę płaci osoba lub firma, która sprowadza samochód do Polski. Deklarację AKC-U/S składa się w urzędzie skarbowym (także elektronicznie), a potwierdzenie zapłaty jest potrzebne do rejestracji pojazdu w wydziale komunikacji.'],
  ['Czy przy imporcie płaci się też VAT?',
    'Przy samochodzie używanym kupionym od niemieckiego dealera w systemie marży polskiego VAT zwykle się nie płaci. Samochód nowy w rozumieniu przepisów o VAT (do 6 miesięcy od pierwszej rejestracji lub do 6000 km przebiegu) podlega w Polsce VAT 23 % (WNT). Przygotujemy dla Ciebie dokładne wyliczenie dla konkretnego auta.'],
  ['Jakie inne koszty trzeba doliczyć?',
    'Do akcyzy dochodzą: badanie techniczne w Polsce (ok. 150 zł), opłata rejestracyjna w wydziale komunikacji wraz z tablicami i dowodem rejestracyjnym (ok. 160 zł), ewentualne tłumaczenie dokumentów przez tłumacza przysięgłego, ubezpieczenie OC oraz transport z Niemiec.']
];

const FAQ_P = [
  ['Kiedy trzeba zapłacić podatek PCC od zakupu samochodu?',
    'Podatek od czynności cywilnoprawnych (PCC) płaci kupujący, gdy kupuje samochód używany od osoby prywatnej na podstawie umowy kupna-sprzedaży. Deklarację PCC-3 składa się i podatek wpłaca w ciągu 14 dni od zawarcia umowy.'],
  ['Ile wynosi PCC od samochodu?',
    'Stawka wynosi 2 % wartości rynkowej samochodu. Jeżeli wartość rynkowa nie przekracza 1000 zł, podatku się nie płaci. Kwotę zaokrągla się do pełnych złotych.'],
  ['Czy przy zakupie na fakturę też płaci się PCC?',
    'Nie. Zakup od firmy, która wystawia fakturę VAT lub fakturę w systemie marży — także od Caradvance GmbH — nie podlega podatkowi PCC.'],
  ['Czy PCC dotyczy też aut sprowadzanych z Niemiec?',
    'Przy imporcie samochodu z Niemiec płaci się akcyzę, a nie PCC (o ile umowa nie została zawarta w Polsce z osobą prywatną). Akcyzę obliczysz w naszym kalkulatorze akcyzy.']
];

function calcA(links) {
  return `
<div class="lk" id="kalkulator">
<div class="lk-head">
<span class="lk-eyebrow">Kalkulator ${YEAR}</span>
<h2 class="lk-title">Kalkulator akcyzy za samochód z Niemiec</h2>
<p class="lk-lead">Podaj cenę zakupu, pojemność silnika i rodzaj napędu — od razu zobaczysz stawkę i kwotę akcyzy w złotych.</p>
</div>
<div class="lk-grid">
<div class="lk-inputs">
<div class="lk-field">
<label for="pla-price"><span class="lk-lbl">Cena zakupu samochodu</span></label>
<div class="lk-gy2">
<input type="number" id="pla-price" class="lk-in" value="40000" min="0" step="100" inputmode="numeric">
<div class="lk-seg lk-seg-unit" role="group" aria-label="Waluta">
<button type="button" class="lk-segbtn" id="pla-ueur" aria-pressed="true">€</button>
<button type="button" class="lk-segbtn" id="pla-upln" aria-pressed="false">zł</button>
</div>
</div>
<span class="lk-hint" id="pla-conv">—</span>
</div>
<div class="lk-field">
<label for="pla-fx"><span class="lk-lbl">Kurs EUR/PLN</span></label>
<input type="number" id="pla-fx" class="lk-in" value="__FX__" min="1" max="10" step="0.0001" inputmode="decimal">
<span class="lk-hint">Średni kurs NBP z ostatniego dnia roboczego przed powstaniem obowiązku podatkowego.</span>
</div>
<div class="lk-field">
<label for="pla-fuel"><span class="lk-lbl">Rodzaj napędu</span></label>
<select id="pla-fuel" class="lk-in lk-sel">
<option value="ice" selected>Benzyna, diesel, LPG lub CNG</option>
<option value="hev">Hybryda (bez ładowania z gniazdka, HEV / MHEV)</option>
<option value="phev">Hybryda plug-in (PHEV)</option>
<option value="ev">Elektryczny (BEV)</option>
<option value="h2">Wodorowy</option>
</select>
</div>
<div class="lk-field" id="pla-ccf">
<label for="pla-cc"><span class="lk-lbl">Pojemność silnika</span></label>
<input type="number" id="pla-cc" class="lk-in" value="1998" min="0" max="9000" step="1" inputmode="numeric">
<span class="lk-hint">W cm³ — znajdziesz ją w niemieckim dowodzie rejestracyjnym (Zulassungsbescheinigung Teil I, pole P.1).</span>
</div>
</div>
<div class="lk-result">
<div class="lk-monthly">
<span class="lk-mlabel">Akcyza do zapłaty</span>
<div class="lk-mval"><span class="lk-mnum" id="pla-total">—</span></div>
</div>
<div class="lk-rows">
<div class="lk-row"><span>Podstawa opodatkowania</span><b id="pla-o-base">—</b></div>
<div class="lk-row"><span>Stawka akcyzy</span><b id="pla-o-rate">—</b></div>
<div class="lk-row"><span>Uzasadnienie</span><b id="pla-o-why">—</b></div>
<div class="lk-row lk-total"><span>Akcyza</span><b id="pla-o-tax">—</b></div>
<div class="lk-row"><span>Badanie techniczne + rejestracja (ok.)</span><b>ok. 310 zł</b></div>
</div>
<a class="lk-cta" href="${links.kontakt}">Import i rejestrację załatwimy za Ciebie →</a>
<p class="lk-disc"><b>Kalkulator ma charakter wyłącznie informacyjny.</b> Wysokość podatku ustala urząd skarbowy na podstawie deklaracji AKC-U/S. Wynik nie obejmuje VAT, transportu, tłumaczeń ani ubezpieczenia. Podstawa: ustawa z dnia 6 grudnia 2008 r. o podatku akcyzowym.</p>
</div>
</div>
</div>`;
}

const JS_A = `<script id="pla-js">(function(){
function $(i){return document.getElementById(i)}
var cur='eur';
function zl(x){return String(Math.round(x)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u00a0')+'\\u00a0zł'}
function eur(x){return String(Math.round(x)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u00a0')+'\\u00a0€'}
function num(i){return parseFloat(String($(i).value).replace(',','.'))||0}
function rate(f,cc){
 if(f==='ev')return[0,'samochód elektryczny — zwolnienie'];
 if(f==='h2')return[0,'samochód wodorowy — zwolnienie'];
 if(f==='phev'&&cc<=2000)return[0,'hybryda plug-in do 2000 cm³ — zwolnienie do 31.12.2029'];
 if((f==='hev')&&cc<=2000)return[1.55,'hybryda do 2000 cm³'];
 if((f==='hev'||f==='phev')&&cc<=3500)return[9.3,'hybryda 2000–3500 cm³'];
 if(f==='hev'||f==='phev')return[18.6,'hybryda powyżej 3500 cm³'];
 return cc<=2000?[3.1,'silnik do 2000 cm³']:[18.6,'silnik powyżej 2000 cm³'];
}
function calc(){
 var fx=num('pla-fx')||4.3,p=num('pla-price'),f=$('pla-fuel').value,cc=num('pla-cc');
 $('pla-ccf').style.display=(f==='ev'||f==='h2')?'none':'';
 var base=cur==='eur'?p*fx:p;
 $('pla-conv').textContent=cur==='eur'?('≈ '+zl(base)):('≈ '+eur(p/fx));
 var r=rate(f,cc),tax=Math.round(base*r[0]/100);
 $('pla-o-base').textContent=zl(base);
 $('pla-o-rate').textContent=String(r[0]).replace('.',',')+' %';
 $('pla-o-why').textContent=r[1];
 $('pla-o-tax').textContent=zl(tax);$('pla-total').textContent=zl(tax);
}
function setCur(c){if(c===cur)return;var fx=num('pla-fx')||4.3,p=num('pla-price');cur=c;$('pla-price').value=c==='eur'?Math.round(p/fx):Math.round(p*fx);$('pla-ueur').setAttribute('aria-pressed',c==='eur');$('pla-upln').setAttribute('aria-pressed',c==='pln');calc()}
$('pla-ueur').addEventListener('click',function(){setCur('eur')});$('pla-upln').addEventListener('click',function(){setCur('pln')});
['pla-price','pla-fx','pla-fuel','pla-cc'].forEach(function(i){$(i).addEventListener('input',calc);$(i).addEventListener('change',calc)});
calc();
})();</script>`;

function calcP(links) {
  return `
<div class="lk" id="kalkulator">
<div class="lk-head">
<span class="lk-eyebrow">Kalkulator ${YEAR}</span>
<h2 class="lk-title">Kalkulator podatku PCC od zakupu samochodu</h2>
<p class="lk-lead">Podaj wartość rynkową samochodu — od razu zobaczysz kwotę podatku od czynności cywilnoprawnych (2 %).</p>
</div>
<div class="lk-grid">
<div class="lk-inputs">
<div class="lk-field">
<label for="plp-val"><span class="lk-lbl">Wartość rynkowa samochodu (zł)</span></label>
<input type="number" id="plp-val" class="lk-in" value="120000" min="0" step="100" inputmode="numeric">
<span class="lk-hint">Wartość rynkowa to średnia cena takiego samego modelu (rocznik, przebieg, stan) na rynku.</span>
</div>
<div class="lk-field">
<label for="plp-seller"><span class="lk-lbl">Od kogo kupujesz?</span></label>
<select id="plp-seller" class="lk-in lk-sel">
<option value="priv" selected>Od osoby prywatnej (umowa kupna-sprzedaży w Polsce)</option>
<option value="firm">Od firmy na fakturę (VAT lub marża) — np. od Caradvance GmbH</option>
</select>
</div>
</div>
<div class="lk-result">
<div class="lk-monthly">
<span class="lk-mlabel">Podatek PCC</span>
<div class="lk-mval"><span class="lk-mnum" id="plp-total">—</span></div>
</div>
<div class="lk-rows">
<div class="lk-row"><span>Wartość rynkowa</span><b id="plp-o-val">—</b></div>
<div class="lk-row"><span>Stawka</span><b id="plp-o-rate">—</b></div>
<div class="lk-row"><span>Uwagi</span><b id="plp-o-why">—</b></div>
<div class="lk-row lk-total"><span>PCC do zapłaty</span><b id="plp-o-tax">—</b></div>
</div>
<a class="lk-cta" href="${links.kontakt}">Zapytaj nas o samochód →</a>
<p class="lk-disc"><b>Kalkulator ma charakter wyłącznie informacyjny.</b> Deklarację PCC-3 składa się w urzędzie skarbowym w ciągu 14 dni od zawarcia umowy. Podstawa: ustawa z dnia 9 września 2000 r. o podatku od czynności cywilnoprawnych.</p>
</div>
</div>
</div>`;
}

const JS_P = `<script id="plp-js">(function(){
function $(i){return document.getElementById(i)}
function zl(x){return String(Math.round(x)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u00a0')+'\\u00a0zł'}
function calc(){
 var v=parseFloat(String($('plp-val').value).replace(',','.'))||0,s=$('plp-seller').value,t=0,r='2 %',w='zakup od osoby prywatnej';
 if(s==='firm'){r='—';w='zakup na fakturę — bez PCC'}else if(v<=1000){r='—';w='wartość do 1000 zł — zwolnienie'}else{t=Math.round(v*0.02)}
 $('plp-o-val').textContent=zl(v);$('plp-o-rate').textContent=r;$('plp-o-why').textContent=w;$('plp-o-tax').textContent=zl(t);$('plp-total').textContent=zl(t);
}
['plp-val','plp-seller'].forEach(function(i){$(i).addEventListener('input',calc);$(i).addEventListener('change',calc)});
calc();
})();</script>`;

function mainHtml(kind, hero, links, fx) {
  const isA = kind === 'akcyza';
  const faq = isA ? FAQ_A : FAQ_P;
  const h1 = isA ? `Akcyza za samochód z Niemiec ${YEAR} —<br><span class="accent">kalkulator online</span>`
    : `Podatek PCC od zakupu auta ${YEAR} —<br><span class="accent">kalkulator online</span>`;
  const sub = isA
    ? 'Przy imporcie samochodu osobowego z Niemiec płacisz w Polsce akcyzę — jej stawka zależy od pojemności silnika i rodzaju napędu. Oblicz ją w kilka sekund, a cały import z rejestracją powierz nam.'
    : 'Kupujesz używany samochód od osoby prywatnej? Zapłacisz 2 % podatku od czynności cywilnoprawnych. Sprawdź kwotę — a jeśli wolisz kupić auto na fakturę z Niemiec, zrobimy to za Ciebie.';
  const heroHtml = hero
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${h1}</h1>`)
    .replace(/(<p class="sub[^"]*">)[\s\S]*?(<\/p>)/, `$1${sub}$2`)
    .replace(/(<a class="btn btn-primary" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1#kalkulator$2${isA ? 'Oblicz akcyzę' : 'Oblicz PCC'}$3`)
    .replace(/(<a class="btn btn-white" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1${links.kontakt}$2Potrzebuję pomocy$3`);
  const rows = [['Silnik spalinowy do 2000 cm³', '3,1 %'], ['Silnik spalinowy powyżej 2000 cm³', '18,6 %'], ['Hybryda do 2000 cm³', '1,55 %'], ['Hybryda 2000–3500 cm³ (także plug-in)', '9,3 %'], ['Hybryda plug-in do 2000 cm³', '0 % (do 31.12.2029)'], ['Samochód elektryczny lub wodorowy', '0 %']];
  const steps = isA
    ? [['Zakup i dokumenty', 'Kupujemy samochód w Niemczech na fakturę i odbieramy niemieckie dokumenty (Zulassungsbescheinigung Teil I i II).'],
      ['Akcyza w urzędzie skarbowym', 'Deklaracja AKC-U/S i zapłata akcyzy według stawki z kalkulatora — potwierdzenie jest potrzebne do rejestracji.'],
      ['Badanie techniczne', 'Pierwsze badanie techniczne w Polsce na stacji kontroli pojazdów, wraz z weryfikacją numeru VIN.'],
      ['Rejestracja w wydziale komunikacji', 'Wniosek o rejestrację (w ciągu 30 dni od sprowadzenia), polskie tablice i dowód rejestracyjny.']]
    : [['Umowa kupna-sprzedaży', 'Spisz umowę z danymi sprzedającego, kupującego, samochodu (VIN) i ceną.'],
      ['Deklaracja PCC-3', 'W ciągu 14 dni złóż deklarację w urzędzie skarbowym (także online) i zapłać 2 % wartości rynkowej.'],
      ['Ubezpieczenie OC', 'Przejmujesz polisę OC sprzedającego lub od razu zawierasz własną.'],
      ['Rejestracja na siebie', 'W ciągu 30 dni złóż wniosek w wydziale komunikacji o rejestrację pojazdu na nowego właściciela.']];
  const other = isA ? links.pcc : links.akcyza;
  return `<main>
${heroHtml}
<div id="ca-kalk">
${(isA ? calcA(links) : calcP(links)).replace('__FX__', String(fx))}

${isA ? `<section class="sec">
<h2>Stawki akcyzy na samochody osobowe</h2>
<p class="lede">Stawka zależy od pojemności skokowej silnika i rodzaju napędu; podstawą jest wartość samochodu w złotych.</p>
<div class="scroll"><table><thead><tr><th>Samochód</th><th class="n">Stawka</th></tr></thead><tbody>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join('')}</tbody></table></div>
</section>` : ''}

<section class="ca-proc">
<span class="ca-eyebrow">${isA ? 'Przebieg importu' : 'Zakup od osoby prywatnej'}</span>
<h2 class="ca-sectitle">${isA ? 'Cztery kroki do rejestracji auta z Niemiec' : 'Cztery kroki po zakupie samochodu'}</h2>
<div class="ca-steps">
${steps.map(([t, p], i) => `<div class="ca-step"><div class="ca-sn">${i + 1}</div><h3>${t}</h3><p>${p}</p></div>`).join('\n')}
</div>
</section>

<section class="sec">
<h2>Najczęstsze pytania</h2>
<div class="faq">
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary>\n<p>${esc(a)}</p></details>`).join('\n')}
</div>
</section>

<section class="sec">
<div class="cta">
<div class="t">${isA ? 'Import i rejestracja pod klucz' : 'Samochód z Niemiec na fakturę'}</div>
<p>${isA ? 'Znajdziemy auto, sprawdzimy je, sprowadzimy z Niemiec i pomożemy przy akcyzie i rejestracji w Polsce.' : 'Kupując od Caradvance GmbH na fakturę, nie płacisz PCC — a samochód sprawdzamy przed zakupem.'}</p>
<p>${isA ? 'Kupujesz auto od osoby prywatnej w Polsce? Zobacz' : 'Sprowadzasz auto z Niemiec? Zobacz'} <a href="${other}" style="color:#fff;text-decoration:underline">${isA ? 'kalkulator PCC' : 'kalkulator akcyzy'}</a>.</p>
<p><b>+36 30 233 6060</b> · info@caradvance.hu</p>
</div>
<p class="foot">Kalkulator ma charakter informacyjny. ${isA ? 'Podstawa: ustawa o podatku akcyzowym (art. 105, art. 109a, art. 163a).' : 'Podstawa: ustawa o podatku od czynności cywilnoprawnych.'}</p>
</section>
</div>
${isA ? JS_A : JS_P}
</main>`;
}

function ld(kind, url) {
  const isA = kind === 'akcyza';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: isA ? 'Kalkulator akcyzy za samochód' : 'Kalkulator podatku PCC od zakupu samochodu', url, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'pl', offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' } },
      { '@type': 'FAQPage', mainEntity: (isA ? FAQ_A : FAQ_P).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  }).replace(/<\//g, '<\\/');
}

/** h: a lefordított PL oldal HTML-je; visszaadja a cserélt HTML-t (vagy változatlanul, ha nincs <main>). */
export function plCalcPage(h, kind, links, url, fx) {
  const ms = h.indexOf('<main'), me = h.indexOf('</main>');
  if (ms < 0 || me < 0) return h;
  const main = h.slice(ms, me + 7);
  const hero = (main.match(/<section class="hero">[\s\S]*?<\/section>/) || [''])[0];
  h = h.slice(0, ms) + mainHtml(kind, hero, links, fx) + h.slice(me + 7);
  const isA = kind === 'akcyza';
  const title = isA ? `Akcyza za samochód z Niemiec ${YEAR} — kalkulator | CarAdvance` : `Podatek PCC od zakupu samochodu ${YEAR} — kalkulator | CarAdvance`;
  const desc = isA
    ? `Ile wynosi akcyza za auto sprowadzone z Niemiec w ${YEAR} r.? Kalkulator akcyzy: 3,1 % lub 18,6 % wartości, hybrydy 1,55 % / 9,3 %, elektryczne 0 %.`
    : `Ile wynosi podatek PCC od zakupu używanego samochodu w ${YEAR} r.? Kalkulator: 2 % wartości rynkowej, deklaracja PCC-3 w ciągu 14 dni.`;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(desc) + b);
  h = h.replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(title) + b);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${ld(kind, url)}</script>`);
  return h;
}
export const CALC_PAGES = { 'dovoz/kalkulacka-poplatkov/': 'akcyza', 'dovoz/kalkulacka-prepisu/': 'pcc' };
