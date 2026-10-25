/**
 * CarAdvance — caradvance.sk / caradvance.cz: 3. fázis (Mr. JOB SK javaslata, C és G pontok)
 * Maradék magyar szövegek, szlovák/cseh kapcsolattartók, forint-összegek, formátumok.
 * A skcz-legal.mjs használja (a 2. fázis szabályai után fut).
 */
import fs from 'node:fs';

let HUF = 368, CZK = 24.47;
try { const fx = JSON.parse(fs.readFileSync('src/i18n/intl-map.json', 'utf8')).fx; HUF = +fx.HUF || HUF; CZK = +fx.CZK || CZK; } catch (e) {}
const nb = (s) => String(s).replace(/\s/g, ' ');
const eurOfHuf = (huf) => Math.round(huf / HUF / 10) * 10;
const fmtEur = (huf) => nb(eurOfHuf(huf).toLocaleString('sk-SK')) + ' €';
const fmtCzk = (huf) => nb((Math.round(huf / HUF * CZK / 100) * 100).toLocaleString('cs-CZ')) + ' Kč';
const r = (s, f = 'g') => new RegExp(s, f);

/* forint-összegek (G6): „410–460 tisíc … forintov” → € / Kč */
function forint(fmt, tisic, word) {
  return [r('[^.<>"]*(?:forintov|forintů)(?=[\\s.,;<"]|$)[^.<>"]*'), (seg) => seg
    .replace(r('(\\d{2,3})\\s?–\\s?(\\d{2,3})\\s' + tisic), (m, a, b) => fmt(a * 1000).replace(/ (€|Kč)$/, '') + '–' + fmt(b * 1000))
    .replace(r('(\\d{2,3})\\s' + tisic), (m, a) => fmt(a * 1000))
    .replace(r('\\s(?:forintov|forintů)(?=[\\s.,;<"]|$)'), '')];
}
/* „10,8 M €” (milliós forintösszeg hibás átváltása) → pontos € / Kč */
const millions = (l) => [r('(\\d+(?:,\\d+)?)\\s?M\\s?(?:€|Kč|Ft)(-tól)?'), (m, n) => (l === 'cs' ? fmtCzk : fmtEur)(parseFloat(n.replace(',', '.')) * 1e6)];

/* bérlési verziólista (C8): „— takarékos dízel, 1249 €/hó-tól;” */
const VW = {
  sk: [['mild-hybrid benzines', 'mild-hybridný benzínový'], ['négyhengeres', 'štvorvalcový'], ['hathengeres', 'šesťvalcový'], ['takarékos', 'úsporný'], ['erős', 'výkonný'], ['benzines', 'benzínový'], ['dízel', 'diesel'], ['plug-in hibrid', 'plug-in hybrid'], ['felszereltség:', 'výbava:']],
  cs: [['mild-hybrid benzines', 'mild-hybridní benzínový'], ['négyhengeres', 'čtyřválcový'], ['hathengeres', 'šestiválcový'], ['takarékos', 'úsporný'], ['erős', 'výkonný'], ['benzines', 'benzínový'], ['dízel', 'naftový'], ['plug-in hibrid', 'plug-in hybrid'], ['felszereltség:', 'výbava:']]
};
const versions = (l) => [r('(—\\s)([^<—]*?),\\s([\\d\\u00a0 .]+)\\s?(€|Kč)/hó-tól([;.])'), (m, d, txt, n, cur, end) => {
  let t = txt.replace(r('(\\d+)\\skm feletti elektromos hatótáv'), l === 'sk' ? 'elektrický dojazd viac ako $1 km' : 'elektrický dojezd přes $1 km');
  for (const [a, b] of VW[l]) t = t.split(a).join(b);
  return d + t + ', od ' + n.trim() + ' ' + cur + (l === 'sk' ? '/mes.' : '/měs.') + end;
}];
const MON = {
  sk: { 'január': 'január', 'február': 'február', 'március': 'marec', 'április': 'apríl', 'május': 'máj', 'június': 'jún', 'július': 'júl', 'augusztus': 'august', 'szeptember': 'september', 'október': 'október', 'november': 'november', 'december': 'december' },
  cs: { 'január': 'leden', 'február': 'únor', 'március': 'březen', 'április': 'duben', 'május': 'květen', 'június': 'červen', 'július': 'červenec', 'augusztus': 'srpen', 'szeptember': 'září', 'október': 'říjen', 'november': 'listopad', 'december': 'prosinec' }
};
const avail = (l) => [r('(\\d+) db azonnal elérhető; további autók — ([^<]*?)\\. Vadonatúj, 0 km-es autók\\.'), (m, n, rest) => {
  const list = rest.replace(r('(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december): (\\d+) db'), (x, mo, k) => MON[l][mo] + ': ' + k + ' ks');
  return l === 'sk' ? n + ' ks dostupné ihneď; ďalšie autá — ' + list + '. Úplne nové autá s 0 km.' : n + ' ks k dispozici ihned; další vozy — ' + list + '. Zcela nové vozy s 0 km.';
}];

export const P3 = {
  sk: {
    RULES: [
      [r('>\\s*/hó -tól\\s*<'), '>/mes. (od)<'],
      versions('sk'), avail('sk'), millions('sk'),
      [r('Új (.+?) ára: (?:nettó )?([^,<"]+?) bez DPH, Németországból|Új (.+?) ára: nettó ([^,<"]+?), Németországból'), (m, a, b, c, d) => 'Cena nového ' + (a || c) + ': od ' + String(b || d).replace(/-tól$/, '') + ' bez DPH, z Nemecka'],
      [r('Mennyibe kerül a (.+?) bérlése\\?'), 'Koľko stojí prenájom $1?'],
      ['C-osztály Limuzin', 'trieda C Limuzína'],
      [r('Jelenleg a (.+?), ([\\d\\u00a0\\u202f .]+?)\\s?(€|Kč)/hó-tól \\(nettó\\)\\.'), 'Aktuálne $1, od $2 $3/mes. (bez DPH).'],
      [r('(\\d[\\d\\u00a0\\u202f .]*?)\\s?(€|Kč)/hó-tól'), 'od $1 $2/mes.'],
      [r('(\\S+) konfigurátor magyarul – új \\1 német áron, árlistával'), 'Konfigurátor $1 po slovensky – nové $1 za nemecké ceny, s cenníkom'], [r('(\\S+) konfigurátor magyarul'), 'Konfigurátor $1 po slovensky'],
      [r('>\\s*Árlista\\s*<'), '>Cenník<'], [r('Jelenleg (\\d+) változat közül választhatsz:'), 'Aktuálne si môžete vybrať z $1 verzií:'],
      ['⛽ Benzin <b', '⛽ Benzín <b'], ['· Dízel <b', '· Diesel <b'], ['· Áram <b', '· Elektrina <b'],
      [r('Hol találom a (.+?) konfigurátort magyarul\\?'), 'Kde nájdem konfigurátor $1 po slovensky?'],
      [r('(€|Kč)/hó(?=[\\s<."\')—,;:]|$)'), '$1/mes.'],
      ['Benzin / Hibrid / Dízel', 'Benzín / Hybrid / Diesel'], [r('· Dízel(?=<|$)'), '· Diesel'],
      [r('autóink — prémium használt autók Németországból(?: na predaj)?'), 'Naše autá — prémiové ojazdené autá z Nemecka na predaj'],
      ['Mindkét gumiszett, a szezonális cserével együtt.', 'Obe sady pneumatík vrátane sezónnej výmeny.'],
      ['Német rendszám, forgalomba helyezés', 'Nemecké EČV, prihlásenie do premávky'],
      ['német rendszám', 'nemecké EČV'],
      ['egyterű', 'MPV'],
      [r('([^"<>]+?) bérlés — \\1 tartós bérletben'), 'Dlhodobý prenájom $1'],
      [' havas hegyek előtt', ' pred zasneženými horami'], [' panoráma tetőablak', ' — panoramatické strešné okno'], [' vezetőtér', ' — priestor vodiča'],
      [' belső tér, sportülések', ' — interiér, športové sedadlá'], [' belső tér, műszerfal', ' — interiér, palubná doska'], [' kormány és kijelző', ' — volant a displej'],
      [' — külső dizájn', ' — exteriér'], [' belső tér', ' — interiér'],
      ['Összes eladó autónk', 'Všetky naše autá na predaj'], ['>Eladó autók<', '>Autá na predaj<'],
      ['placeholder="Keresés (pl. X5, Porsche, dízel)…"', 'placeholder="Hľadať (napr. X5, Porsche, diesel)…"'],
      ['<h3>Előfizetéses bérlet Németországból</h3>', '<h3>Dlhodobý prenájom z Nemecka</h3>'],
      [r('<p>Prémium flottaautók rugalmas[\\s\\S]*?</p>'), '<p>Prémiové autá z flotily nášho nemeckého partnera Choice na dlhodobý prenájom (Auto-Abo). Ceny sú mesačné poplatky bez DPH. Presnú konfiguráciu a dostupnosť dohodneme — napíšte nám pri vybranom modeli.<span class="sub-rate" hidden></span></p>'],
      /* C10: kapcsolattartók */
      ['Náš riaditeľ importu, Tóth Károly, vás osobne sprevádza celým dovozom.', 'Náš kolega pre dovoz, Pavel Horemuž, vás osobne sprevádza celým dovozom.'],
      [r('Károly Tóth, riaditeľ importu:'), 'Pavel Horemuž, dovoz áut z Nemecka:'],
      [r('Tóth Károly, riaditeľ importu:'), 'Pavel Horemuž, dovoz áut z Nemecka:'],
      /* G5 */
      ['Určuje sa podľa výkonu, emisnej triedy a veku. Pri elektrickom (5E) aute 0 €.', 'Určuje sa podľa výkonu a emisnej triedy; pri elektromobile je pevne 33 €.'],
      [r('[Kk]ontrola originality \\(22 950–73 €\\)'), (m) => m.charAt(0) + 'ontrola originality (podľa cenníka stanice)'],
      /* G6 */
      forint(fmtEur, 'tisíc(?:och)?', 'x'),
      /* G11: formátumok */
      [r('(\\d[\\d\\u00a0 .]*)\\s?€ odi\\b'), 'od $1 €'], [r('\\bodod\\b'), 'od'],
      [r('(\\d{4})\\. (\\d{1,2})\\. (\\d{1,2})\\.'), (m, y, mo, d) => (+d) + '. ' + (+mo) + '. ' + y]
    ],
    JS: [
      ['<span>Tudomásul veszem, hogy a bérelt autók <b>német rendszámmal</b> (Caradvance GmbH, Németország) közlekednek. *</span>', '<span>Beriem na vedomie, že prenajaté autá jazdia s <b>nemeckým evidenčným číslom</b> (Caradvance GmbH, Nemecko). *</span>'],
      [r('(?:info|sales|media)@caradvance\\.hu|import@caradvance\\.de'), 'info@caradvance.sk'],
      ['Készpénz / önerőből', 'Hotovosť / vlastné zdroje'], ['Finanszírozás (hitel)', 'Financovanie (úver)'], ['Finanszírozással', 'S financovaním'], ['Egy összegben', 'Jednorazovo'],
      [r('\\+36 30 233 6060'), '+421 915 410 555'], [r('36302336060'), '421915410555'],
      [r('<a href="https://(?:magyarefk|kormanyhivatal)\\.hu"([^>]*)>(www\\.)?([a-z0-9.-]+\\.sk)</a>'), '<a href="https://www.$3"$1>$3</a>'],
      /* 4. fázis: online szerződéskötés, bármely ország lakosa bérelhet */
      ['<p>Zmluvy sa spravidla uzatvárajú osobne, v kancelárii alebo pri odovzdaní auta; v takom prípade právo na odstúpenie od zmlúv uzavretých na diaľku neexistuje.</p>', '<p>Zmluvy uzatvárame spravidla online — podpisujú sa elektronicky, návšteva kancelárie nie je potrebná. Takto uzavretá zmluva je zmluvou uzavretou na diaľku.</p>'],
      ['Predbežnú zmluvu podpíšete a pošlete nám ju späť.', 'Predbežnú zmluvu podpíšete online — elektronicky, bez tlače a bez návštevy kancelárie.'],
      ['Obe strany podpíšu konečnú zmluvu, ktorej súčasťou', 'Obe strany podpíšu online konečnú zmluvu, ktorej súčasťou'],
      ['<li>Podpis zmluvy je zároveň ', '<li>Prenajať si auto môžete s bydliskom alebo sídlom na Slovensku, v Česku, v Nemecku aj v inej krajine. Zmluvu podpisujete <strong>online</strong> — elektronicky, bez návštevy kancelárie.</li> <li>Podpis zmluvy je zároveň '],
      [r('(?:www\\.)?caradvance\\.hu/berlesi-feltetelek/?'), 'caradvance.sk/prenajom/podmienky-a-kaucia/'],
      [r('(\\d{4})\\. (januára|februára|marca|apríla|mája|júna|júla|augusta|septembra|októbra|novembra|decembra) (\\d{1,2})\\.'), '$3. $2 $1']
    ],
    IMPORT: { img: '/sk-team/pavel-horemuz.webp', name: 'Pavel Horemuž', role: 'Dovoz áut z Nemecka', alt: 'Pavel Horemuž — dovoz áut z Nemecka, CarAdvance', flags: [['sk', 'slovenčina'], ['cz', 'čeština']], bio: 'Pavel vás osobne sprevádza celým dovozom — od výberu auta až po odovzdanie kľúčov. Komunikuje s vami po slovensky a so spoločnosťou Caradvance GmbH dohodne všetky podrobnosti.', email: 'info@caradvance.sk' },
    CONTACT: {
      sub: 'Máte otázku alebo hľadáte auto? Zavolajte nám, napíšte nám alebo sa obráťte priamo na niekoho z nášho tímu.',
      teamTitle: 'Náš tím na Slovensku', teamSub: 'Každému z nás môžete zavolať alebo napísať aj na WhatsApp.',
      office: { name: 'Mr. Job SK s.r.o. — kontaktné miesto', role: 'Obchodný sprostredkovateľ spoločnosti Caradvance GmbH', bio: 'Prijímame vaše dopyty, poradíme vám po slovensky, česky aj anglicky a pomôžeme s administratívou. Zmluvy uzatvára a podpisuje výlučne Caradvance GmbH.', hours: 'Po–Pi 9:00–17:00', addr: 'Cesta na Senec 2/A, 821 04 Bratislava', email: 'info@caradvance.sk' },
      team: [
        { name: 'Veronika Diničová', role: 'Prenájom a predaj', flags: 'sk cz gb', img: '/sk-team/veronika-dinicova.webp', phone: '+421 918 700 722', bio: 'Poradí vám s výberom auta na prenájom aj na kúpu a pripraví vám ponuku na mieru.' },
        { name: 'Andreas Horemuž', role: 'Prenájom a predaj', flags: 'sk cz gb', img: '/sk-team/andreas-horemuz.webp', phone: '+421 917 222 122', bio: 'Vaša kontaktná osoba od prvej otázky až po odovzdanie auta — po slovensky, česky aj anglicky.' },
        { name: 'Pavel Horemuž', role: 'Dovoz áut z Nemecka', flags: 'sk cz', img: '/sk-team/pavel-horemuz.webp', phone: '+421 915 410 555', bio: 'Sprevádza vás celým dovozom auta z Nemecka — od výberu až po odovzdanie kľúčov.' }
      ]
    },
    NF: { lang: 'sk', title: 'Stránka sa nenašla — CarAdvance', code: '404 — stránka sa nenašla', h1: 'Túto stránku sme nenašli', p: 'Možno je v adrese preklep alebo stránka už nie je dostupná.', hintB: 'Hľadáte auto z neplatného odkazu?', hint: 'Ak už bolo predané, stiahli sme ho z ponuky. Podobné vám radi nájdeme na celom nemeckom trhu.', b1: ['/auta/', 'Naše autá'], b2: ['/', 'Hlavná stránka'], foot: 'Otázky? <a href="mailto:info@caradvance.sk">info@caradvance.sk</a> · <a href="tel:+421915410555">+421 915 410 555</a>' }
  },
  cs: {
    RULES: [
      [r('>\\s*/hó -tól\\s*<'), '>/měs. (od)<'],
      versions('cs'), avail('cs'), millions('cs'),
      [r('Új (.+?) ára: (?:nettó )?([^,<"]+?) bez DPH, Németországból|Új (.+?) ára: nettó ([^,<"]+?), Németországból'), (m, a, b, c, d) => 'Cena nového vozu ' + (a || c) + ': od ' + String(b || d).replace(/-tól$/, '') + ' bez DPH, z Německa'],
      [r('Mennyibe kerül a (.+?) bérlése\\?'), 'Kolik stojí pronájem $1?'],
      ['C-osztály Limuzin', 'třída C Limuzína'],
      [r('Jelenleg a (.+?), ([\\d\\u00a0\\u202f .]+?)\\s?(€|Kč)/hó-tól \\(nettó\\)\\.'), 'Aktuálně $1, od $2 $3/měs. (bez DPH).'],
      [r('Tartós autóbérlés árak 2026: valós nettó havidíjak BMW, Mercedes, Audi, MINI, VW és elektromos modellekre ([\\d\\u00a0\\u202f .]+?)\\s?(Kč|€)/hó-tól, havi 2 000–4 000 km futáskerettel'), 'Ceny dlouhodobého pronájmu aut 2026: skutečné měsíční splátky bez DPH pro BMW, Mercedes, Audi, MINI, VW a elektromobily od $1 $2/měs., s limitem 2 000–4 000 km měsíčně'],
      [r('(\\d[\\d\\u00a0\\u202f .]*?)\\s?(€|Kč)/hó-tól'), 'od $1 $2/měs.'],
      [r('(\\S+) konfigurátor magyarul – új \\1 német áron, árlistával'), 'Konfigurátor $1 česky – nové $1 za německé ceny, s ceníkem'], [r('(\\S+) konfigurátor magyarul'), 'Konfigurátor $1 česky'],
      [r('>\\s*Árlista\\s*<'), '>Ceník<'], [r('Jelenleg (\\d+) változat közül választhatsz:'), 'Aktuálně si můžete vybrat z $1 verzí:'],
      ['⛽ Benzin <b', '⛽ Benzín <b'], ['· Dízel <b', '· Nafta <b'], ['· Áram <b', '· Elektřina <b'],
      [r('Hol találom a (.+?) konfigurátort magyarul\\?'), 'Kde najdu konfigurátor $1 v češtině?'],
      [r('Nettó német induló árak \\(19% áfa nélkül\\), forintban kb\\. [\\d,.]+\\s?Kč/€ árfolyammal\\. Kattints a modellre a motorokért, felszereltségért és a részletes árért\\.'), 'Německé základní ceny bez DPH (bez 19 % německé DPH). Klikněte na model a zobrazí se motory, výbava a podrobná cena.'],
      [r('A jelenlegi listánkon a legolcsóbb (\\S+) modell nettó ([\\d.,]+) €-tól indul \\(kb\\. ([\\d\\u00a0\\u202f .]+?)\\s?Kč\\)\\. A pontos ár a motortól, a felszereltségtől és az aktuális kedvezményektől függ — lent a teljes modell-árlistát látod\\.'), 'V našem aktuálním seznamu začíná nejlevnější model $1 na $2 € bez DPH (cca $3 Kč). Přesná cena závisí na motoru, výbavě a aktuálních slevách — níže najdete kompletní ceník modelů.'],
      [r('Náš ředitel importu, Tóth Károly, vás dovozem osobně provede\\.'), 'Náš kolega pro dovoz, Pavel Horemuž, vás dovozem osobně provede.'],
      [r('(€|Kč)/hó(?=[\\s<."\')—,;:]|$)'), '$1/měs.'],
      ['Benzin / Hibrid / Dízel', 'Benzín / Hybrid / Nafta'], [r('· Dízel(?=<|$)'), '· Nafta'],
      [r('autóink — prémium használt autók Németországból(?: na prodej)?'), 'Naše vozy — prémiové ojeté vozy z Německa na prodej'],
      ['Mindkét gumiszett, a szezonális cserével együtt.', 'Obě sady pneumatik včetně sezónního přezouvání.'],
      ['Német rendszám, forgalomba helyezés', 'Německá SPZ, registrace'],
      ['német rendszám', 'německá SPZ'],
      ['egyterű', 'MPV'],
      [r('([^"<>]+?) bérlés — \\1 tartós bérletben'), 'Dlouhodobý pronájem $1'],
      [' havas hegyek előtt', ' před zasněženými horami'], [' panoráma tetőablak', ' — panoramatické střešní okno'], [' vezetőtér', ' — místo řidiče'],
      [' belső tér, sportülések', ' — interiér, sportovní sedadla'], [' belső tér, műszerfal', ' — interiér, palubní deska'], [' kormány és kijelző', ' — volant a displej'],
      [' — külső dizájn', ' — exteriér'], [' belső tér', ' — interiér'],
      ['Összes eladó autónk', 'Všechny naše vozy na prodej'], ['>Eladó autók<', '>Vozy na prodej<'],
      ['placeholder="Keresés (pl. X5, Porsche, dízel)…"', 'placeholder="Hledat (např. X5, Porsche, nafta)…"'],
      ['<h3>Előfizetéses bérlet Németországból</h3>', '<h3>Dlouhodobý pronájem z Německa</h3>'],
      [r('<p>Prémium flottaautók rugalmas[\\s\\S]*?</p>'), '<p>Prémiové vozy z flotily našeho německého partnera Choice v dlouhodobém pronájmu (Auto-Abo). Ceny jsou měsíční splátky bez DPH. Přesnou konfiguraci a dostupnost domluvíme — napište nám u vybraného modelu.<span class="sub-rate" hidden></span></p>'],
      [r('Náš ředitel (?:dovozu|importu), Tóth Károly, vás osobně provede celým dovozem\\.'), 'Náš kolega pro dovoz, Pavel Horemuž, vás osobně provede celým dovozem.'],
      [r('(?:Ředitel (?:importu|dovozu) Tóth Károly|Tóth Károly, ředitel (?:importu|dovozu)):'), 'Pavel Horemuž, dovoz vozů z Německa:'],
      [r('(?:[Ee]videnční kontrola) \\(22 950–1 800 Kč\\)'), (m) => m.charAt(0) + 'videnční kontrola (podle ceníku stanice)'],
      forint(fmtCzk, 'tisíc(?:ích)?', 'x'),
      [r('(\\d[\\d\\u00a0 .]*)\\s?(?:€|Kč) odi\\b'), (m) => 'od ' + m.replace(/\s?odi$/, '')], [r('\\bodod\\b'), 'od'],
      [r('(\\d{4})\\. (\\d{1,2})\\. (\\d{1,2})\\.'), (m, y, mo, d) => (+d) + '. ' + (+mo) + '. ' + y]
    ],
    JS: [
      ['<span>Tudomásul veszem, hogy a bérelt autók <b>német rendszámmal</b> (Caradvance GmbH, Németország) közlekednek. *</span>', '<span>Beru na vědomí, že pronajaté vozy jezdí s <b>německou registrační značkou</b> (Caradvance GmbH, Německo). *</span>'],
      [r('(?:info|sales|media)@caradvance\\.hu|import@caradvance\\.de'), 'info@caradvance.cz'],
      ['Készpénz / önerőből', 'Hotovost / vlastní zdroje'], ['Finanszírozás (hitel)', 'Financování (úvěr)'], ['Finanszírozással', 'S financováním'], ['Egy összegben', 'Jednorázově'],
      [r('\\+36 30 233 6060'), '+421 915 410 555'], [r('36302336060'), '421915410555'],
      [r('<a href="https://(?:magyarefk|kormanyhivatal)\\.hu"([^>]*)>(www\\.)?([a-z0-9.-]+\\.cz)</a>'), '<a href="https://www.$3"$1>$3</a>'],
      /* 4. fázis: online szerződéskötés, bármely ország lakosa bérelhet */
      ['<p>Smlouvy se zpravidla uzavírají osobně, v kanceláři nebo při předání vozu; v takovém případě právo na odstoupení platné pro smlouvy uzavírané na dálku neexistuje.</p>', '<p>Smlouvy uzavíráme zpravidla online — podepisují se elektronicky, návštěva kanceláře není nutná. Takto uzavřená smlouva je smlouvou uzavřenou na dálku.</p>'],
      ['Předběžnou smlouvu podepíšete a pošlete nám ji zpět.', 'Předběžnou smlouvu podepíšete online — elektronicky, bez tisku a bez návštěvy kanceláře.'],
      ['Obě strany podepíší závěrečnou smlouvu, jejíž součástí', 'Obě strany podepíší online závěrečnou smlouvu, jejíž součástí'],
      ['<li>Podpis smlouvy je zároveň ', '<li>Pronajmout si vůz můžete s bydlištěm nebo sídlem v Česku, na Slovensku, v Německu i v jiné zemi. Smlouvu podepisujete <strong>online</strong> — elektronicky, bez návštěvy kanceláře.</li> <li>Podpis smlouvy je zároveň '],
      [r('(?:www\\.)?caradvance\\.hu/berlesi-feltetelek/?'), 'caradvance.cz/pronajem/podminky-a-kauce/'],
      [r('(\\d{4})\\. (ledna|února|března|dubna|května|června|července|srpna|září|října|listopadu|prosince) (\\d{1,2})\\.'), '$3. $2 $1']
    ],
    IMPORT: { img: '/sk-team/pavel-horemuz.webp', name: 'Pavel Horemuž', role: 'Dovoz vozů z Německa', alt: 'Pavel Horemuž — dovoz vozů z Německa, CarAdvance', flags: [['sk', 'slovenština'], ['cz', 'čeština']], bio: 'Pavel vás osobně provede celým dovozem — od výběru vozu až po předání klíčů. Komunikuje s vámi česky i slovensky a se společností Caradvance GmbH domluví všechny podrobnosti.', email: 'info@caradvance.cz' },
    CONTACT: {
      sub: 'Máte dotaz nebo hledáte vůz? Zavolejte nám, napište nám nebo se obraťte přímo na někoho z našeho týmu.',
      teamTitle: 'Náš tým', teamSub: 'Každému z nás můžete zavolat nebo napsat i na WhatsApp.',
      office: { name: 'Mr. Job SK s.r.o. — kontaktní místo', role: 'Obchodní zprostředkovatel společnosti Caradvance GmbH', bio: 'Přijímáme vaše poptávky, poradíme vám česky, slovensky i anglicky a pomůžeme s administrativou. Smlouvy uzavírá a podepisuje výhradně Caradvance GmbH.', hours: 'Po–Pá 9:00–17:00', addr: 'Cesta na Senec 2/A, 821 04 Bratislava, Slovensko', email: 'info@caradvance.cz' },
      team: [
        { name: 'Veronika Diničová', role: 'Pronájem a prodej', flags: 'sk cz gb', img: '/sk-team/veronika-dinicova.webp', phone: '+421 918 700 722', bio: 'Poradí vám s výběrem vozu k pronájmu i ke koupi a připraví vám nabídku na míru.' },
        { name: 'Andreas Horemuž', role: 'Pronájem a prodej', flags: 'sk cz gb', img: '/sk-team/andreas-horemuz.webp', phone: '+421 917 222 122', bio: 'Vaše kontaktní osoba od prvního dotazu až po předání vozu — česky, slovensky i anglicky.' },
        { name: 'Pavel Horemuž', role: 'Dovoz vozů z Německa', flags: 'sk cz', img: '/sk-team/pavel-horemuz.webp', phone: '+421 915 410 555', bio: 'Provede vás celým dovozem vozu z Německa — od výběru až po předání klíčů.' }
      ]
    },
    NF: { lang: 'cs', title: 'Stránka nenalezena — CarAdvance', code: '404 — stránka nenalezena', h1: 'Tuto stránku jsme nenašli', p: 'Možná je v adrese překlep, nebo stránka již není dostupná.', hintB: 'Hledáte vůz ze starého odkazu?', hint: 'Pokud už byl prodán, stáhli jsme ho z nabídky. Podobný vám rádi najdeme na celém německém trhu.', b1: ['/vozy/', 'Naše vozy'], b2: ['/', 'Hlavní stránka'], foot: 'Dotazy? <a href="mailto:info@caradvance.cz">info@caradvance.cz</a> · <a href="tel:+421915410555">+421 915 410 555</a>' }
  }
};
