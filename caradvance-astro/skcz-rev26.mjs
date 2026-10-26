/**
 * CarAdvance — caradvance.sk / caradvance.cz: Mr. JOB SK ellenőrzés, 2026-10-26
 *   SK: „Kontrola po úpravách” (10 pont) · CZ: „Návrh úprav webu” (22 pont)
 * A skcz-legal.mjs hívja: ALL = egész oldalra (scriptek + attribútumok is), TEXT = a látható szövegre,
 * attribútumokra és a JSON-LD-re (a LEGAL RULES mögé fűzve), LANGFIX = a skcz-langs.mjs en/de/hu változataira.
 */
import fs from 'node:fs';

let HUF = 368, CZK = 24.47;
try { const fx = JSON.parse(fs.readFileSync('src/i18n/intl-map.json', 'utf8')).fx || {}; HUF = +fx.HUF || HUF; CZK = +fx.CZK || CZK; } catch (e) {}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* szóköz-toleráns minta (szóköz / &nbsp; / nbsp) */
const T = (s, f = 'g') => new RegExp(esc(s).replace(/ /g, '(?:\\s|&nbsp;|\\u00a0)+'), f);
/* idézett JS / attribútum-érték: 'X' vagy "X" */
const Q = (a, b) => [new RegExp('([\'"])' + esc(a) + '\\1', 'g'), '$1' + b + '$1'];

/* ---------- Autó-összehasonlító: helyi üzemanyag- és áramárak (CZ 13 + ugyanaz SK-n) ---------- */
function fuel(l) {
  const cs = l === 'cs';
  const K = cs ? HUF / CZK : HUF;              // 1 Kč / 1 € = K Ft (a számolás belül Ft-ban fut, a kiírás helyi pénznemben)
  const S = cs ? 'Kč' : '€';
  const P = cs ? { b: 45.16, d: 47.74, e: [6, 10, 15] } : { b: 1.885, d: 1.952, e: [0.2, 0.35, 0.55] };
  const src = cs ? 'Orientační průměrná cena paliva v ČR (ČSÚ, říjen 2026); cenu můžete upravit' : 'Orientačná priemerná cena palív na Slovensku (ŠÚ SR, október 2026); cenu môžete upraviť';
  const lab = cs ? ['Doma', 'Kombinovaně'] : ['Doma', 'Kombinovane'];
  const h = (x) => Math.round(x * K * 100) / 100;
  const dec = cs ? 2 : 3;
  const fmt = (x) => String(+x.toFixed(dec)).replace('.', ',');
  const LP = `(x=>String(+(x/${K}).toFixed(${dec})).replace('.',','))`;
  return [
    [/let pe=115;\s*const fuelPrice=\{b:605,d:681,src:'NAV hivatalos üzemanyagár, 2026\. október – havonta automatikusan frissül'\};/,
      `let pe=${h(P.e[1])}; const fuelPrice={b:${h(P.b)},d:${h(P.d)},src:'${src}'};`],
    ["const pb=+$('#pb').value||fuelPrice.b,pd=+$('#pd').value||fuelPrice.d;$('#fb').textContent=F(pb)+' Ft/l';$('#fd').textContent=F(pd)+' Ft/l';$('#fe').textContent=F(pe)+' Ft/kWh';",
      `const pb=(+String($('#pb').value).replace(',','.'))*${K}||fuelPrice.b,pd=(+String($('#pd').value).replace(',','.'))*${K}||fuelPrice.d;$('#fb').textContent=${LP}(pb)+' ${S}/l';$('#fd').textContent=${LP}(pd)+' ${S}/l';$('#fe').textContent=${LP}(pe)+' ${S}/kWh';`],
    ["if(location.protocol.startsWith('http'))fetch('/api/uzemanyagar')", "if(false)fetch('/api/uzemanyagar')"],
    ['id="pb" value="605"', `id="pb" value="${P.b}" step="0.01"`],
    ['id="pd" value="681"', `id="pd" value="${P.d}" step="0.01"`],
    ['<button data-p="40">Otthon</button><button class="on" data-p="115">Vegyesen</button><button data-p="190">',
      `<button data-p="${h(P.e[0])}">${lab[0]}</button><button class="on" data-p="${h(P.e[1])}">${lab[1]}</button><button data-p="${h(P.e[2])}">`],
    [/(<b id="fb">)[^<]*(<\/b>)/, `$1${fmt(P.b)} ${S}/l$2`],
    [/(<b id="fd">)[^<]*(<\/b>)/, `$1${fmt(P.d)} ${S}/l$2`],
    [/(<b id="fe">)[^<]*(<\/b>)/, `$1${fmt(P.e[1])} ${S}/kWh$2`],
    [/(<span class="fsrc" id="fsrc">)[^<]*/, `$1${src}`]
  ];
}

/* ---------- Bérlési kártyák: egy összeg („2 000 km / mesiac: 1 200 €”) — SK 5 ---------- */
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const rentCards = [/(<div class="rp"><span>[^<:]*?km[^<:]*?)(<\/span><b>)(\d+) €\s*<span style="color:var\(--muted\);font-weight:700">≈[^<]*<\/span>(<\/b>)/g,
  (m, a, b, n, c) => a + ':' + b + grp(n) + ' €' + c];

/* ---------- Űrlapok rejtett értékei (SK 10 / CZ 9): az oldal saját scriptjei is ezt a tokent használják ---------- */
const forms = (l) => {
  const sk = l === 'sk';
  const PRIV = sk ? 'Súkromná osoba' : 'Soukromá osoba', CO = sk ? 'Firma s IČ DPH' : 'Firma', OWN = sk ? 'Vlastné financovanie' : 'Vlastní financování';
  const VATCO = sk ? 'Firma s IČ DPH — bez DPH (dodanie v rámci EÚ)' : 'Firma s DIČ — bez DPH (dodání v rámci EU)';
  const A = sk ? {
    'Kérlek add meg a cégnevet és egy elérhetőséget (e-mail vagy telefon).': 'Zadajte, prosím, názov firmy a kontakt (e-mail alebo telefón).',
    'Kérlek add meg a neved és egy elérhetőséget (e-mail vagy telefon).': 'Zadajte, prosím, svoje meno a kontakt (e-mail alebo telefón).',
    'Kérlek fogadd el az ÁSZF-et és az adatkezelési tájékoztatót.': 'Prosím, potvrďte súhlas s VOP a so zásadami ochrany osobných údajov.',
    'Kérlek, válaszd ki legalább a márkát.': 'Vyberte, prosím, aspoň značku.',
    'Köszönjük! A keresésed megérkezett — hamarosan jelentkezünk személyre szabott ajánlattal.': 'Ďakujeme! Váš dopyt sme prijali — čoskoro sa vám ozveme s ponukou na mieru.',
    'Küldés sikertelen — kérjük írj a info@caradvance.sk címre.': 'Odoslanie sa nepodarilo — napíšte nám, prosím, na info@caradvance.sk.',
    'Nettó, németországi céges vásárláshoz kérjük add meg a közösségi (EU) adószámot.': 'Pri nákupe bez DPH pre firmu zadajte, prosím, IČ DPH (EÚ).'
  } : {
    'Kérlek add meg a cégnevet és egy elérhetőséget (e-mail vagy telefon).': 'Zadejte prosím název firmy a kontakt (e-mail nebo telefon).',
    'Kérlek add meg a neved és egy elérhetőséget (e-mail vagy telefon).': 'Zadejte prosím své jméno a kontakt (e-mail nebo telefon).',
    'Kérlek fogadd el az ÁSZF-et és az adatkezelési tájékoztatót.': 'Potvrďte prosím souhlas s VOP a se zásadami ochrany osobních údajů.',
    'Kérlek, válaszd ki legalább a márkát.': 'Vyberte prosím alespoň značku.',
    'Köszönjük! A keresésed megérkezett — hamarosan jelentkezünk személyre szabott ajánlattal.': 'Děkujeme! Vaši poptávku jsme přijali — brzy se vám ozveme s nabídkou na míru.',
    'Küldés sikertelen — kérjük írj a info@caradvance.cz címre.': 'Odeslání se nezdařilo — napište nám prosím na info@caradvance.cz.',
    'Nettó, németországi céges vásárláshoz kérjük add meg a közösségi (EU) adószámot.': 'Pro nákup bez DPH pro firmu zadejte prosím DIČ (EU).'
  };
  return [
    ["radioVal('vat')==='Cég — nettó, Németországból'", "radioVal('vat')==='" + VATCO + "'"],
    Q('Magánszemély', PRIV), Q('Cég', CO), Q('Saját finanszírozás', OWN),
    ...Object.entries(A).map(([a, b]) => ["alert('" + a + "')", "alert('" + b + "')"])
  ];
};

/* =====================================================================  SK  */
const SK = {
  ALL: [...forms('sk'), ...fuel('sk'),
    // SK 8: „O nás” — a még üres menüpontok elrejtése
    [/<a(?: class="ddi")? href="#">(?:Caradvance Nemecko|Caradvance Slovensko|Naši partneri)<\/a>/g, ''],
    // főoldal: üres (#) gombok → valódi oldalak
    ['<a class="btn btn-outline" href="#">Dlhodobý prenájom</a>', '<a class="btn btn-outline" href="/sk/prenajom/">Dlhodobý prenájom</a>'],
    ['<a class="btn btn-outline" href="#">Podrobnosti</a>', '<a class="btn btn-outline" href="/sk/predaj/vyhody/">Podrobnosti</a>'],
    ['<a class="btn btn-outline" href="#">Financovanie</a>', '<a class="btn btn-outline" href="/sk/predaj/financovanie-lizing/">Financovanie</a>'],
    ['<a class="btn" href="#">Zistite viac →</a>', '<a class="btn" href="/sk/dovoz/">Zistite viac →</a>']],
  TEXT: [
    // SK 2 (és CZ 4): „Výhodnejšia cena” → a választható változatok
    [/(<b>)?Výhodnejšia cena(<\/b>)?\s*—\s*s nemeckou DPH, lacnejšie ako pri slovenskej DPH 23\s?%\./g, '$1Výhodná cena$2 — vyberiete si variant, ktorý vám najviac vyhovuje: s doručením až k vám alebo s osobným prevzatím v Nemecku.'],
    // SK 4: „Mesačný poplatok bez DPH od” + „od 1199 €/mes.” → „…bez DPH od 1 199 €/mes.”
    [/(>Mesačný poplatok bez DPH) od(<\/span>)/g, '$1$2'],
    [/(id="svRent"[^>]*>od )(\d{1,3})(\d{3}) €/g, '$1$2 $3 €'],
    // SK 5: bérlési kártyák — egy összeg
    rentCards,
    // SK 6: blog — Euro Leasing kalkulátor
    [/<a href="\/sk\/predaj\/financovanie-lizing\/#kalkulator">Lízingová kalkulačka CarAdvance<\/a> je kalibrovaná podľa reálnej tabuľky úrokov a RPMN spoločnosti Euro Leasing[^.]*\./g, 'Orientačnú splátku vám na požiadanie pripraví partnerská lízingová spoločnosť.'],
    // SK 9: „Kalkulačka lízingu” / „Lízingová kalkulačka →”
    ['>Kalkulačka lízingu<', '>Financovanie lízingom<'],
    ['>Lízingová kalkulačka →<', '>Financovanie lízingom →<'],
    [/>Lízingová kalkulačka(\s*→)?</g, (m, a) => '>Financovanie lízingom' + (a || '') + '<'],
    // „Új” jelvény (14 napon belül felvett autó) ≠ „Nové” (új autó az áfa szerint)
    ['z-index:3">Nové</span>', 'z-index:3">Novinka</span>'],
    ['<span class="cond">Bérbeadva</span>', '<span class="cond">Prenajaté</span>'],
    // automatikus leírás (mint CZ 17)
    [/(\d[\d\s. ]*?)(?:\s?km)? futott,/g, 'najazdené $1 km,'],
    [/Cena bez DPH so zárukou, dovoz CarAdvance\./g, 'Cena podľa zvoleného variantu nižšie, so zodpovednosťou za vady, dovoz CarAdvance.'],
    [/(<b>)Záruka 1 r\.(<\/b>)\s*—\s*poskytujeme ju na každé predané auto\./g, '$1Zodpovednosť za vady$2 — pri ojazdených autách 1 rok (podľa kúpnej zmluvy), pri nových 2 roky.'],
    [/(Na predaj [^"<]*?)\. Cena ((?:\d|&nbsp;|\s|\u00a0)+€)\./g, '$1. Cena bez DPH $2.'],
    // Operatívny lízing: maradék magyar
    ['>a lízingcégé, a végén visszaadod<', '>lízingovej spoločnosti, na konci ho vrátite<'],
    ['>a bérbeadóé, a végén visszaadod<', '>prenajímateľa, na konci ho vrátite<'],
    ['>Futáskeret<', '>Limit kilometrov<'],
    ['>Mikor melyiket válaszd?<', '>Kedy zvoliť ktorú možnosť?<'],
    // Transparentnosť: fizetési lépések + Mr. Job SK (preprava = GmbH)
    ['<h3>Így fizetsz</h3>', '<h3>Takto platíte:</h3>'],
    ['<h3>70% egyenleg</h3>', '<h3>70 % doplatok</h3>'],
    ['<h3>30% záloha</h3>', '<h3>30 % záloha</h3>'],
    ['komunikuje s vami po slovensky, anglicky alebo nemecky, vybavuje administratívu, prepravu a pomáha s registráciou vozidla. Nevystupuje', 'komunikuje s vami po slovensky, anglicky alebo nemecky a pomáha s administratívou a s registráciou vozidla. Prepravu vozidla zabezpečuje Caradvance GmbH. Nevystupuje'],
    // Zabezpečenie kvality
    [T('14× väčší ako maďarský'), '14× väčší ako slovenský'],
    // FAQ: lízing (mint CZ 3)
    ['Obe možnosti sú riešiteľné. Konštrukciu — dobu splácania, vlastný vklad, mesačnú splátku — prispôsobíme vašim potrebám a možnostiam, s transparentnými podmienkami.', 'Áno. Podmienky financovania – dobu splácania, vlastný vklad aj výšku splátky – stanoví partnerská lízingová spoločnosť podľa svojej ponuky a posúdenia bonity. S vaším súhlasom jej odovzdáme vaše kontaktné údaje.'],
    ['Áno, pomocou kalkulačky na stránke Financovanie – lízing si môžete predbežne odhadnúť očakávanú mesačnú splátku skôr, než sa rozhodnete.', 'Orientačnú splátku vám na požiadanie pripraví partnerská lízingová spoločnosť.'],
    [T('5–14 dní'), '10–21 dní']
  ],
  LANG: {
    en: [['the import, customs, registration', 'the import, registration'], ["than Hungary's", 'than the Slovak one'],
      ['handles the paperwork and transport and helps with vehicle registration.', 'helps with the paperwork and vehicle registration. Transport is arranged by Caradvance GmbH.']],
    de: [['Import, Zoll, Zulassung', 'Import, Zulassung'], ['als der ungarische', 'als der slowakische'],
      ['erledigt Formalitäten und Transport und hilft bei der Fahrzeugzulassung.', 'hilft bei den Formalitäten und der Zulassung. Den Transport übernimmt die Caradvance GmbH.']],
    hu: [['a behozatalt, a vámot, a forgalomba helyezést', 'a behozatalt, a forgalomba helyezést']]
  }
};

/* =====================================================================  CZ  */
const ODP = 'Odpovědnost za vady — u ojetých vozů 1 rok (podle kupní smlouvy), u nových vozů 2 roky.';
const CS = {
  ALL: [...forms('cs'), ...fuel('cs'),
    // CZ 10
    [/<a(?: class="ddi")? href="#">(?:Caradvance Německo|Caradvance Česko|Naši partneři)<\/a>/g, ''],
    ['<a class="btn btn-outline" href="#">Dlouhodobý pronájem</a>', '<a class="btn btn-outline" href="/cs/pronajem/">Dlouhodobý pronájem</a>'],
    ['<a class="btn btn-outline" href="#">Podrobnosti</a>', '<a class="btn btn-outline" href="/cs/prodej/vyhody/">Podrobnosti</a>'],
    ['<a class="btn btn-outline" href="#">Financování</a>', '<a class="btn btn-outline" href="/cs/prodej/financovani-leasing/">Financování</a>'],
    ['<a class="btn" href="#">Zjistit více →</a>', '<a class="btn" href="/cs/dovoz/">Zjistit více →</a>']],
  TEXT: [
    // CZ 1: vůz na míru — lhůta
    ['soukromá osoba ji přizná a zaplatí na svém finančním úřadě, firma', 'soukromá osoba ji přizná a zaplatí na svém finančním úřadě do 10 dnů od pořízení vozu, firma'],
    // CZ 2: odpovědnost za vady
    [/(<b>)1letá odpovědnost za vady(<\/b>)\s*—\s*poskytujeme ji na každý prodaný vůz\./g, '$1Odpovědnost za vady$2 — u ojetých vozů 1 rok (podle kupní smlouvy), u nových vozů 2 roky.'],
    ['<li>1letá odpovědnost za vady na každý vůz</li>', '<li>Odpovědnost za vady: ojeté vozy 1 rok, nové 2 roky</li>'],
    ['Na naše dovezené i tuzemské vozy platí 1letá odpovědnost za vady — protože si naší práce jsme jisti.', 'Odpovědnost za vady — u ojetých vozů 1 rok (podle kupní smlouvy), u nových vozů 2 roky. Protože si naší práce jsme jisti.'],
    ['Na dovezená vozidla platí 1letá odpovědnost za vady, protože si stojíme za tím, co předáváme.', 'U ojetých vozů odpovídáme za vady 1 rok (podle kupní smlouvy), u nových 2 roky — protože si stojíme za tím, co předáváme.'],
    ['Na dovezené vozy platí odpovědnost za vady 1 rok.', ODP],
    ['— na dovezené vozy platí 1letá odpovědnost za vady.', '— odpovědnost za vady u ojetých vozů 1 rok, u nových 2 roky.'],
    ['Ano — na dovezený ojetý vůz platí 1letá odpovědnost za vady.', 'Ano — u ojetých vozů odpovídáme za vady 1 rok od převzetí (podle kupní smlouvy), u nových vozů 2 roky; u nových navíc platí záruka výrobce.'],
    ['U ojetých vozů odpovídáme za vady 1 rok od převzetí vozu. Historie', 'U ojetých vozů odpovídáme za vady 1 rok od převzetí – tuto dobu sjednáváme v kupní smlouvě; u nových vozů 2 roky od převzetí a navíc platí záruka výrobce. Historie'],
    ['U ojetých vozů odpovídáme za vady 1 rok od převzetí vozu, na základě písemné smlouvy.', 'U ojetých vozů odpovídáme za vady 1 rok od převzetí – tuto dobu sjednáváme v kupní smlouvě. U nových vozů odpovídáme za vady 2 roky od převzetí a navíc platí záruka výrobce.'],
    ['U ojetých vozů odpovídáme za vady 1 rok od převzetí vozu; na nové vozy platí záruka výrobce.', 'U ojetých vozů odpovídáme za vady 1 rok od převzetí – tuto dobu sjednáváme v kupní smlouvě. U nových vozů odpovídáme za vady 2 roky od převzetí a navíc platí záruka výrobce.'],
    ['u nás platí odpovědnost za vady 1 rok.', 'u nás platí odpovědnost za vady 1 rok u ojetých vozů (podle kupní smlouvy) a 2 roky u nových.'],
    ['na každý vůz platí odpovědnost za vady 1 rok.', 'odpovědnost za vady činí u ojetých vozů 1 rok (podle kupní smlouvy), u nových 2 roky.'],
    [/Na dovezené i tuzemské vozy platí <strong>odpovědnost za vady 1 rok<\/strong>\./, 'Odpovědnost za vady — <strong>u ojetých vozů 1 rok</strong> (podle kupní smlouvy), <strong>u nových vozů 2 roky</strong>.'],
    ['Odpovědnost za vady 1 rok — za každý vůz ručíme', 'Odpovědnost za vady — za každý vůz ručíme'],
    ['hodnocení na Googlu 5,0★, Odpovědnost za vady 1 rok,', 'hodnocení na Googlu 5,0★, odpovědnost za vady (ojeté vozy 1 rok, nové 2 roky),'],
    ['fotoprotokol při předání a 1 rok odpovědnosti za vady —', 'fotoprotokol při předání a odpovědnost za vady (ojeté vozy 1 rok, nové 2 roky) —'],
    ['Na každé auto platí 1letá odpovědnost za vady.', ODP],
    ['Na každé prodané auto platí 1letá odpovědnost za vady.', ODP],
    ['— a na každé auto platí 1letá odpovědnost za vady.', '— a odpovědnost za vady: u ojetých vozů 1 rok, u nových 2 roky.'],
    ['Kontroly a 1letá odpovědnost za vady', 'Kontroly a odpovědnost za vady'],
    ['zdokumentovaná historie a 1 rok záruky na dovezené vozy.', 'zdokumentovaná historie, u nových vozů 2 roky odpovědnosti za vady a záruka výrobce.'],
    // VOP čl. 10
    [/Na <strong>ojetá vozidla<\/strong> — u kupujícího spotřebitele — poskytuje Poskytovatel odpovědnost za vady po dobu 1 rok\./, 'U ojetých vozidel prodávaných spotřebiteli je doba pro uplatnění práv z vad v kupní smlouvě zkrácena na 1 rok od převzetí (§ 2168 občanského zákoníku); u nových vozidel činí 2 roky od převzetí (§ 2165 odst. 1).'],
    [/Na <strong>nová vozidla<\/strong> se vztahuje záruka výrobce, resp\.\s*záruka poskytnutá ve smlouvě\./g, 'Vedle zákonné odpovědnosti za vady se na nová vozidla vztahuje i záruka výrobce.'],
    ['Vadu oznamte bez zbytečného odkladu po jejím zjištění.', 'Vadu nám prosím oznamte co nejdříve po jejím zjištění.'],
    // CZ 3: leasing
    ['Řešení existuje pro obojí. Konstrukci — dobu splácení, vlastní vklad, měsíční splátku — přizpůsobíme vašim potřebám a možnostem, s transparentními podmínkami.', 'Ano. Podmínky financování – dobu splácení, vlastní vklad i výši splátky – stanoví partnerská leasingová společnost podle své nabídky a posouzení bonity. S vaším souhlasem jí předáme vaše kontaktní údaje.'],
    ['Ano, pomocí kalkulačky na stránce Financování – leasing si můžete před rozhodnutím předběžně odhadnout očekávanou měsíční splátku.', 'Orientační splátku vám na požádání připraví přímo partnerská leasingová společnost.'],
    [/<a href="\/cs\/prodej\/financovani-leasing\/#kalkulator">Leasingová kalkulačka CarAdvance<\/a> je kalibrována na skutečné tabulky úroků a RPSN společnosti Euro Leasing[^.]*\./g, 'Orientační splátku vám na požádání připraví přímo partnerská leasingová společnost.'],
    [/Odhad pro konkrétní vůz si můžete prohlédnout v <a href="\/cs\/prodej\/financovani-leasing\/#kalkulator">leasingové kalkulačce<\/a> — v forintech nebo v eurech\./g, 'Orientační splátku vám na požádání připraví přímo partnerská leasingová společnost.'],
    [/>Leasingová kalkulačka(\s*→)?</g, (m, a) => '>Financování – leasing' + (a || '') + '<'],
    // CZ 4
    [/(<b>)?Výhodnější cena(<\/b>)?\s*—\s*s německou DPH, levněji než při české sazbě DPH 21\s?%\./g, '$1Výhodná cena$2 — vyberete si variantu, která vám nejvíce vyhovuje: s doručením až k vám, nebo s osobním převzetím v Německu.'],
    // CZ 6: Transparentnost
    ['komunikuje s vámi česky, slovensky, anglicky nebo německy, vyřizuje administrativu, přepravu a pomáhá s registrací vozidla. Nevystupuje', 'komunikuje s vámi česky, slovensky, anglicky nebo německy a pomáhá s administrativou a s registrací vozidla. Přepravu vozidla zajišťuje Caradvance GmbH. Nevystupuje'],
    // CZ 7
    ['Nákup, objednávka, financování, komise — na jednom místě', 'Nákup, objednávka a financování — na jednom místě'],
    // CZ 8
    [/(>Měsíční splátka bez DPH) od(<\/span>)/g, '$1$2'],
    [/(id="svRent"[^>]*>od )(\d{1,3})(\d{3}) €/g, '$1$2 $3 €'],
    // CZ 11
    ['<h3>Így fizetsz</h3>', '<h3>Takto platíte:</h3>'],
    ['<h3>30% záloha</h3>', '<h3>30 % záloha</h3>'],
    ['<h3>70% egyenleg</h3>', '<h3>70 % doplatek</h3>'],
    // CZ 12
    ['>a lízingcégé, a végén visszaadod<', '>leasingové společnosti, na konci ho vrátíte<'],
    ['>a bérbeadóé, a végén visszaadod<', '>pronajímatele, na konci ho vrátíte<'],
    ['>Futáskeret<', '>Limit kilometrů<'],
    ['>Mikor melyiket válaszd?<', '>Kdy zvolit kterou možnost?<'],
    [/(nový vůz od 20 610 Kč\/měs\.)(?! bez DPH)/g, '$1 bez DPH (pro firmy)'],
    // CZ 14
    [/Nejvýhodnější měsíční poplatek začíná od 912 €\/měsíc bez DPH \(Mini Cooper\), naše prémiová BMW jsou dostupná od 937 €\/měsíc bez DPH;/g, 'Nejvýhodnější měsíční poplatek začíná od 20 610 Kč bez DPH (Volkswagen Polo), MINI Cooper od 23 940 Kč a BMW od 24 600 Kč měsíčně bez DPH;'],
    // CZ 15
    [T('14× větší než maďarský'), '14× větší než český'],
    // CZ 16
    ['Pomůžeme vám česky, anglicky, německy i francouzsky,', 'Pomůžeme vám česky, slovensky, anglicky nebo německy,'],
    // CZ 17
    [/(\d[\d\s. ]*?)(?:\s?km)? futott,/g, 'najeto $1 km,'],
    [/Cena bez DPH se zárukou, dovoz CarAdvance\./g, 'Cena podle zvolené varianty níže, s odpovědností za vady, dovoz CarAdvance.'],
    [/(Na prodej [^"<]*?)\. Cena ((?:\d|&nbsp;|\s|\u00a0)+Kč)\./g, '$1. Cena bez DPH $2.'],
    // CZ 19
    ['Značku EL dostanou vozidla M1 a N1 s emisemi do 50 g CO₂/km.', 'Značku EL lze přidělit vozidlu na elektřinu nebo vodík; u kombinovaného pohonu (např. plug-in hybrid) jen při emisích CO₂ nejvýše 50 g/km.'],
    // CZ 20
    ['Na služby Mr. Job SK s.r.o. a používání Webu se vztahuje právo Slovenské republiky.', 'Na služby Mr. Job SK s.r.o. a používání Webu se vztahuje právo Slovenské republiky; spotřebitel tím není zbaven ochrany, kterou mu poskytují kogentní ustanovení práva státu jeho obvyklého bydliště (čl. 6 nařízení „Řím I“).'],
    // CZ 21 (cookies; a dozorový úřad és a Místo külön, lásd PRIV)
    ['zákon o ochraně údajů v digitálních službách (TDDDG) — pokud jde o cookies;', 'zákon o ochraně údajů v digitálních službách (TDDDG) — pokud jde o cookies; v Česku § 89 odst. 3 zákona č. 127/2005 Sb.;'],
    ['péče o zákazníky (z pověření společnosti Caradvance GmbH)</td><td>Česko</td>', 'péče o zákazníky (z pověření společnosti Caradvance GmbH)</td><td>Slovensko</td>'],
    [/(<dt>Německo \(dozorový úřad společnosti Caradvance GmbH\)<\/dt><dd>[\s\S]*?<\/dd>)(\s*<\/dl>)/, '$1<dt>Slovensko (dozorový úřad společnosti Mr. Job SK s.r.o.)</dt><dd>Úrad na ochranu osobných údajov Slovenskej republiky — Hraničná 12, 820 07 Bratislava; <a href="https://dataprotection.gov.sk/" target="_blank" rel="noopener">dataprotection.gov.sk</a></dd>$2'],
    // CZ 22: doba dovozu sjednocená
    [T('za 5–14 dnů'), 'obvykle za 10–21 dní'],
    [T('obvykle 5–14 dnů'), 'obvykle 10–21 dní'],
    [T('5–14 dnů'), '10–21 dní'],
    // jelvények
    ['z-index:3">Nový</span>', 'z-index:3">Novinka</span>'],
    ['<span class="cond">Bérbeadva</span>', '<span class="cond">Pronajato</span>']
  ],
  LANG: {
    en: [['the import, customs, registration', 'the import, registration'], ["than Hungary's", 'than the Czech one'],
      ['handles the paperwork and transport and helps with vehicle registration.', 'helps with the paperwork and vehicle registration. Transport is arranged by Caradvance GmbH.']],
    de: [['Import, Zoll, Zulassung', 'Import, Zulassung'], ['als der ungarische', 'als der tschechische'],
      ['erledigt Formalitäten und Transport und hilft bei der Fahrzeugzulassung.', 'hilft bei den Formalitäten und der Zulassung. Den Transport übernimmt die Caradvance GmbH.']]
  }
};

export const REV = { sk: SK, cs: CS };

/** a skcz-langs.mjs hívja a kész en/de/hu oldalra (ML = piac nyelve: sk / cs) */
export function langFix(h, ml, l) {
  const R = REV[ml] && REV[ml].LANG[l]; if (!R) return h;
  for (const [a, b] of R) h = typeof a === 'string' ? h.split(a).join(b) : h.replace(a, b);
  return h;
}
