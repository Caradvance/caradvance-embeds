// Volkswagen bérlési tartalom — sajtófotók: Volkswagen Newsroom (volkswagen-newsroom.com), 1200×900 webp.
// Számok (ár, km, futamidő, kaució, darabszám) NEM itt vannak: azok a napi Choice-szinkronból jönnek.
// A VW-nél sok, hasonló nevű Choice-kivitel van (pl. "1,5 eTSI OPF DSG R-Line") — ezeket a specMatch
// motor szerint egy-egy oszlopba vonja össze, a felszereltségi szintek (Life, Style, R-Line…) a megjegyzésbe kerülnek.
import type { RentalContent, TrimSpec } from './rentalPage';

const P = (m: string, k: string) => `/berles-press/${m}-${k}.webp`;
const G = (m: string, name: string, items: [string, string][]) => items.map(([k, alt]) => ({ img: P(m, k), alt: `${name} ${alt}` }));
const D = (m: string, name: string, h3: string, text: string, bullets: string[], alt: string) => ({ h3, text, bullets, img: P(m, 'design'), alt: `${name} ${alt}` });
const I = (h3: string, text: string, bullets: string[], m?: string, alt?: string) => (m ? { h3, text, bullets, img: P(m, 'interior'), alt } : { h3, text, bullets });
const S = (label: string, o: TrimSpec): TrimSpec => ({ label, ...o });

export const VW: Record<string, RentalContent> = {
  // ---------------- Tiguan ----------------
  'VW Tiguan': {
    mainImg: P('volkswagen-tiguan', 'main'), mainAlt: 'Volkswagen Tiguan bérlés — az új VW Tiguan tartós bérletben',
    overviewH2: 'Volkswagen Tiguan tartós bérlet — Magyarország egyik kedvenc SUV-ja havidíjjal',
    guideIntro: 'Az új, harmadik generációs <strong>Volkswagen Tiguan</strong> (VW Tiguan) a kompakt SUV-k egyik legnépszerűbb modellje: tágas utastér, 652 literes csomagtartó, modern digitális kezelés és hajtások széles választéka — mild-hybrid benzines, dízel, <strong>4MOTION összkerékhajtás</strong> és plug-in hibrid eHybrid. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz; a szervizt, az adót és a gumikat mi intézzük, a futamidő végén pedig egyszerűen visszaadod.',
    guideBlocks: [
      { h3: 'Melyik VW Tiguan-t válaszd?', html: 'Az <strong>1,5 eTSI</strong> mild-hybrid benzines a városi és vegyes használatra ideális, a <strong>2,0 TDI</strong> a sokat autózóknak, a <strong>2,0 TSI 4MOTION</strong> (204 LE) összkerékhajtással télen és utánfutóval is magabiztos. Az <strong>eHybrid</strong> plug-in hibrid a napi ingázást tisztán elektromosan teszi lehetővé, ha tölteni tudsz.' },
      { h3: 'VW Tiguan méretek és csomagtér', html: 'Az új Tiguan hossza kb. 4,54 m, a csomagtér 652 literes (a plug-in hibridnél az akkumulátor miatt kisebb), a hátsó ülések döntésével 1650 literig bővíthető — családi autónak és céges flottába is ideális.' },
      { h3: 'Tiguan vagy Tayron?', html: 'A <a href="/berelheto-auto/volkswagen-tayron-berles">Volkswagen Tayron</a> a Tiguan hosszabb, nagyobb testvére (akár 7 üléssel). Ha a csomagtér és a hátsó hely a legfontosabb, a Tayron; ha a kompaktabb méret és a kedvezőbb havidíj, a Tiguan a jobb választás.' },
    ],
    design: D('volkswagen-tiguan', 'Volkswagen Tiguan', 'Letisztult, magabiztos SUV-forma', 'Az új Tiguan simább, aerodinamikusabb karosszériát kapott: vékony LED fényszórók, világító fénysáv elöl és hátul, világító VW-logó (felszereltségtől függően) és erős vállvonal.', ['IQ.LIGHT LED Matrix fényszórók (felszereltségtől függően)', 'Világító fénysáv és logó elöl-hátul', '18–20" könnyűfém keréktárcsák'], 'hátulról, téli úton'),
    interior: I('Nagy kijelzők, egyszerű kezelés', 'Digitális műszerfal, akár 15"-os lebegő érintőkijelző, új hangerő- és vezetésiprofil-kapcsoló (Driving Experience Control), a váltókar a kormányoszlopra került — így több a hely a középkonzolon.', ['Digital Cockpit, 12,9–15" MIB4 érintőkijelző', 'Vezeték nélküli App-Connect, indukciós töltő', 'Masszázsfunkciós ülések (felszereltségtől függően)']),
    boot: '652–1650 liter',
    specMatch: [
      ['eHybrid', S('1,5 eHybrid DSG', { fuel: 'Plug-in hibrid', power: '204 LE (150 kW) rendszer', drive: 'Elsőkerék / 6 fok. DSG', rec: 'Töltési lehetőséggel, ingázásra', note: 'plug-in hibrid, 100 km feletti elektromos hatótáv', img: P('volkswagen-tiguan', 'g2') })],
      ['2,0 TDI.*4MOTION', S('2,0 TDI 4MOTION DSG', { fuel: 'Dízel', power: '193 LE (142 kW)', torque: '400 Nm', drive: '4MOTION összkerék / 7 fok. DSG', rec: 'Sokat autózóknak, vontatásra', note: 'erős dízel, összkerékhajtás', img: P('volkswagen-tiguan', 'g6') })],
      ['2,0 TDI', S('2,0 TDI DSG', { fuel: 'Dízel', power: '150 LE (110 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Takarékos dízel', note: 'takarékos dízel, hosszú utakra', img: P('volkswagen-tiguan', 'g4') })],
      ['2,0 TSI.*4MOTION', S('2,0 TSI 4MOTION DSG', { fuel: 'Benzin', power: '204 LE (150 kW)', torque: '320 Nm', drive: '4MOTION összkerék / 7 fok. DSG', rec: 'Összkerékhajtás, dinamikus', note: 'erős benzines, összkerékhajtás', img: P('volkswagen-tiguan', 'g3') })],
      ['eTSI', S('1,5 eTSI DSG', { fuel: 'Benzin (mild-hybrid)', power: '130–150 LE', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Városba és vegyes használatra', note: 'mild-hybrid benzines, takarékos', img: P('volkswagen-tiguan', 'g1') })],
    ],
    gallery: G('volkswagen-tiguan', 'Volkswagen Tiguan', [['g1', 'havas erdei úton'], ['g2', 'téli tesztúton'], ['g3', 'havas tájban'], ['g4', 'hóban, elölnézet'], ['g5', 'hátulról, jeges úton'], ['g6', 'havas pályán'], ['g7', 'havas tavon']]),
    faqExtra: [
      { q: 'Van összkerékhajtású VW Tiguan bérelhető?', a: 'Igen, a 2,0 TSI 4MOTION (204 LE) benzines és a 2,0 TDI 4MOTION dízel összkerékhajtású — télen és utánfutóval is biztonságos.' },
      { q: 'Mekkora a VW Tiguan csomagtartója?', a: 'Az új Tiguan csomagtere 652 literes, a hátsó ülések döntésével 1650 literre bővíthető (a plug-in hibridnél kisebb).' },
    ],
  },

  // ---------------- Tayron ----------------
  'VW Tayron': {
    mainImg: P('volkswagen-tayron', 'main'), mainAlt: 'Volkswagen Tayron bérlés — az új VW Tayron tartós bérletben',
    overviewH2: 'Volkswagen Tayron tartós bérlet — a nagy családi SUV havidíjjal',
    guideIntro: 'Az új <strong>Volkswagen Tayron</strong> (VW Tayron) a Tiguan Allspace utódja: 4,77 méteres, tágas családi SUV, kiemelkedően nagy csomagtérrel és választhatóan hét üléssel. Mild-hybrid benzines, dízel, <strong>4MOTION összkerékhajtás</strong> és plug-in hibrid eHybrid hajtással is bérelhető. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a VW Tayron bérlését?', html: 'Nagycsaládoknak és sokat utazóknak, akiknek a hely a legfontosabb: a Tayron csomagtere ötülésesként is hatalmas, a hátsó üléssor csúsztatható. Céges autóként is reprezentatív, a 2,0 TDI 4MOTION pedig akár 2,5 tonnás utánfutót is húzhat (kiviteltől függően).' },
      { h3: 'Melyik Tayron-t válaszd?', html: 'Az <strong>1,5 eTSI</strong> a takarékos benzines, a <strong>2,0 TDI</strong> a hosszú utakra ideális, a <strong>4MOTION</strong> változatok összkerékhajtásúak, az <strong>eHybrid</strong> plug-in hibrid pedig tisztán elektromos ingázást tesz lehetővé.' },
      { h3: 'Tayron vagy Tiguan?', html: 'A Tayron hosszabb és tágasabb, akár 7 üléses; a <a href="/berelheto-auto/volkswagen-tiguan-berles">Volkswagen Tiguan</a> kompaktabb és kedvezőbb havidíjú.' },
    ],
    design: D('volkswagen-tayron', 'Volkswagen Tayron', 'Elegáns nagy SUV', 'Széles, vízszintes hűtőrács, világító fénysáv és VW-logó, hosszú tengelytáv és elegáns oldalvonal — a Tayron prémium megjelenésű családi SUV.', ['IQ.LIGHT LED Matrix fényszórók (felszereltségtől függően)', 'Világító fénysáv és logó', '19–20" könnyűfém keréktárcsák'], 'hátulról'),
    interior: I('Tágas, digitális utastér', 'Digitális műszerfal, nagy lebegő érintőkijelző, a kormányoszlopra helyezett váltókar és rengeteg tárolóhely; a második üléssor csúsztatható, opcionálisan harmadik üléssor is kérhető.', ['Digital Cockpit, akár 15" MIB4 érintőkijelző', 'Csúsztatható második üléssor, opcionális 7 ülés', 'Háromzónás klíma, ülésfűtés (felszereltségtől függően)']),
    specMatch: [
      ['eHybrid', S('1,5 eHybrid DSG', { fuel: 'Plug-in hibrid', power: '204 LE (150 kW) rendszer', drive: 'Elsőkerék / 6 fok. DSG', rec: 'Töltési lehetőséggel', note: 'plug-in hibrid, elektromos ingázás', img: P('volkswagen-tayron', 'g2') })],
      ['2,0 TDI.*4MOTION', S('2,0 TDI 4MOTION DSG', { fuel: 'Dízel', power: '193 LE (142 kW)', torque: '400 Nm', drive: '4MOTION összkerék / 7 fok. DSG', rec: 'Vontatásra, hosszú utakra', note: 'erős dízel, összkerékhajtás', img: P('volkswagen-tayron', 'g3') })],
      ['2,0 TDI', S('2,0 TDI DSG', { fuel: 'Dízel', power: '150 LE (110 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Takarékos családi dízel', note: 'takarékos dízel', img: P('volkswagen-tayron', 'g1') })],
      ['2,0 TSI.*4MOTION', S('2,0 TSI 4MOTION DSG', { fuel: 'Benzin', power: '204 LE (150 kW)', torque: '320 Nm', drive: '4MOTION összkerék / 7 fok. DSG', rec: 'Összkerékhajtású benzines', note: 'erős benzines, összkerékhajtás', img: P('volkswagen-tayron', 'g4') })],
      ['eTSI', S('1,5 eTSI DSG', { fuel: 'Benzin (mild-hybrid)', power: '150 LE (110 kW)', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Takarékos, vegyes használatra', note: 'mild-hybrid benzines', img: P('volkswagen-tayron', 'g5') })],
    ],
    gallery: G('volkswagen-tayron', 'Volkswagen Tayron', [['g1', 'városi utcán'], ['g2', 'oldalnézet'], ['g3', 'gyümölcsös mellett'], ['g4', 'elölnézet'], ['g5', 'hátsó fénysáv és Tayron felirat'], ['g6', 'világító VW-logó']]),
    faqExtra: [
      { q: 'Hét üléses a Volkswagen Tayron?', a: 'A Tayron öt- és hétüléses kivitelben is készül; a konkrét bérelhető autó ülésszámát az ajánlatban jelezzük.' },
    ],
  },

  // ---------------- Golf ----------------
  'VW Golf': {
    mainImg: P('volkswagen-golf', 'main'), mainAlt: 'Volkswagen Golf bérlés — az új VW Golf tartós bérletben',
    body: 'Kompakt',
    overviewH2: 'Volkswagen Golf tartós bérlet — a kompakt kategória etalonja havidíjjal',
    guideIntro: 'A <strong>Volkswagen Golf</strong> (VW Golf) ötven éve a kompakt kategória mércéje: kiforrott technika, kényelmes futómű, praktikus méretek és alacsony fenntartási költség. A frissített Golf 8.5 nagyobb érintőkijelzővel, új infotainmenttel és mild-hybrid eTSI motorokkal érkezik. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Melyik VW Golf-ot válaszd?', html: 'Az <strong>1,5 TSI</strong> manuális váltós a legkedvezőbb havidíjú, az <strong>1,5 eTSI DSG</strong> mild-hybrid automata a legnépszerűbb, a <strong>2,0 TSI 4MOTION</strong> (204 LE) pedig összkerékhajtással és sportos teljesítménnyel érkezik.' },
      { h3: 'Kinek ajánljuk a Golf bérlését?', html: 'Mindenkinek, aki megbízható, jól felszerelt és kényelmes autót keres a mindennapokra: városban könnyen parkolható, autópályán csendes és stabil. Céges flottába és első családi autónak is kiváló.' },
    ],
    design: D('volkswagen-golf', 'Volkswagen Golf', 'Időtálló Golf-forma', 'A frissített Golf új lökhárítókat, vékonyabb LED fényszórókat és világító VW-logót kapott (felszereltségtől függően); a jellegzetes C-oszlop és a tiszta vonalak megmaradtak.', ['IQ.LIGHT LED Matrix fényszórók (felszereltségtől függően)', 'Világító VW-logó elöl', '16–18" könnyűfém keréktárcsák'], 'hátulról, országúton'),
    interior: I('Nagyobb kijelző, jobb kezelés', 'A Golf 8.5 12,9"-os érintőkijelzőt, megvilágított érintőcsúszkákat és visszatért, fizikai kormánygombokat kapott; a digitális műszerfal alapfelszereltség.', ['Digital Cockpit, 12,9" érintőkijelző', 'Vezeték nélküli App-Connect', 'ChatGPT-integrált hangvezérlés (felszereltségtől függően)']),
    boot: '381–1237 liter',
    specMatch: [
      ['2,0 TSI.*4MOTION', S('2,0 TSI 4MOTION DSG', { fuel: 'Benzin', power: '204 LE (150 kW)', drive: '4MOTION összkerék / 7 fok. DSG', rec: 'Sportos, összkerékhajtású', note: 'erős benzines, összkerékhajtás', img: P('volkswagen-golf', 'g2') })],
      ['eTSI', S('1,5 eTSI DSG', { fuel: 'Benzin (mild-hybrid)', power: '116–150 LE', drive: 'Elsőkerék / 7 fok. DSG', rec: 'A legnépszerűbb, automata', note: 'mild-hybrid, automata', img: P('volkswagen-golf', 'g1') })],
      ['1,5 TSI', S('1,5 TSI (manuális)', { fuel: 'Benzin', power: '116 LE (85 kW)', drive: 'Elsőkerék / 6 fok. manuális', rec: 'A legkedvezőbb havidíj', note: 'manuális váltó, takarékos', img: P('volkswagen-golf', 'g4') })],
    ],
    gallery: G('volkswagen-golf', 'Volkswagen Golf', [['g1', 'országúton'], ['g2', 'kanyarban'], ['g3', 'elölnézet'], ['g4', 'menet közben'], ['g5', 'fák között'], ['g6', 'hátulról'], ['g7', 'hátulról, egyenesben']]),
    faqExtra: [
      { q: 'Van automata váltós VW Golf bérelhető?', a: 'Igen, az 1,5 eTSI és a 2,0 TSI 4MOTION változat 7 fokozatú DSG automata váltóval érkezik; a legkedvezőbb 1,5 TSI manuális.' },
      { q: 'Mekkora a VW Golf csomagtartója?', a: 'A Golf csomagtere 381 literes, a hátsó ülések döntésével 1237 literre bővíthető.' },
    ],
  },

  // ---------------- Polo ----------------
  'VW Polo': {
    mainImg: P('volkswagen-polo', 'main'), mainAlt: 'Volkswagen Polo bérlés — VW Polo tartós bérletben',
    overviewH2: 'Volkswagen Polo tartós bérlet — a legkedvezőbb Volkswagen havidíjjal',
    guideIntro: 'A <strong>Volkswagen Polo</strong> (VW Polo) a kisautó-kategória egyik legkiforrottabb modellje: felnőtt autós kényelem kompakt méretben, alacsony fogyasztás és kiváló biztonsági felszereltség. <strong>Tartós bérletben</strong> ez a legkedvezőbb havidíjú Volkswagen — egyetlen díjjal, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a VW Polo bérlését?', html: 'Városi autósoknak, pályakezdőknek, második autónak a családba és céges flottába, ahol fontos az alacsony költség. A Polo városban fürge és könnyen parkolható, autópályán pedig meglepően kényelmes.' },
      { h3: 'Manuális vagy DSG?', html: 'Az <strong>1,0 TSI</strong> manuális a legkedvezőbb, a <strong>DSG</strong> automata váltós változatok kényelmesebbek városi dugóban. Felszereltségben a Life, az Energy, az R-Line és az Edition 50 kivitelek közül választhatsz.' },
    ],
    design: D('volkswagen-polo', 'Volkswagen Polo', 'Sportos kisautó', 'Keskeny LED fényszórók, a hűtőrácson átfutó fénycsík (felszereltségtől függően) és az R-Line kivitel sportos lökhárítói teszik a Polót felnőttes, dinamikus kisautóvá.', ['LED fényszórók, IQ.LIGHT (felszereltségtől függően)', 'R-Line sportos lökhárítók', '15–17" könnyűfém keréktárcsák'], 'hátulról'),
    interior: I('Digitális műszerfal alapáron', 'A Polo digitális műszerfallal, érintőkijelzős infotainmenttel és számos vezetéstámogató rendszerrel érkezik, amelyek korábban csak nagyobb autókban voltak elérhetők.', ['Digital Cockpit', 'App-Connect okostelefon-integráció', 'Travel Assist, Front Assist (felszereltségtől függően)']),
    boot: '351–1125 liter',
    specMatch: [
      ['DSG', S('1,0 TSI DSG', { fuel: 'Benzin', power: '95–116 LE', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Kényelmes automata', note: 'háromhengeres turbó, automata', img: P('volkswagen-polo', 'g4') })],
      ['1,0 TSI', S('1,0 TSI (manuális)', { fuel: 'Benzin', power: '80–95 LE', drive: 'Elsőkerék / manuális', rec: 'A legkedvezőbb havidíj', note: 'manuális váltó, takarékos', img: P('volkswagen-polo', 'g1') })],
    ],
    gallery: G('volkswagen-polo', 'Volkswagen Polo', [['g1', 'modern épület előtt'], ['g2', 'városban, katedrális előtt'], ['g3', 'óvárosban'], ['g4', 'kanyarban'], ['g5', 'hátulról, fák között'], ['g6', 'vidéki úton'], ['g7', 'naplementében'], ['g8', 'repülőtéren']]),
    faqExtra: [
      { q: 'Mennyibe kerül egy VW Polo tartós bérlete?', a: 'A Polo a legkedvezőbb havidíjú bérelhető Volkswagen; az aktuális havidíj a kivitel, a futáskeret és a futamidő függvényében a lap tetején látható, élő adatként.' },
    ],
  },

  // ---------------- T-Roc ----------------
  'VW T-Roc': {
    mainImg: P('volkswagen-t-roc', 'main'), mainAlt: 'Volkswagen T-Roc bérlés — az új VW T-Roc tartós bérletben',
    overviewH2: 'Volkswagen T-Roc tartós bérlet — az új T-Roc havidíjjal',
    guideIntro: 'Az új, második generációs <strong>Volkswagen T-Roc</strong> (VW T-Roc) Európa egyik legnépszerűbb kompakt SUV-ja: nagyobb, elegánsabb és modernebb elődjénél, mild-hybrid eTSI motorokkal és DSG automata váltóval. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Mi újság az új T-Rocban?', html: 'A második generáció hosszabb lett, tágasabb utasteret és nagyobb csomagteret kínál, az utastér pedig jóval prémiumabb anyagokat és nagy érintőkijelzőt kapott. Minden bérelhető változat automata váltós; a mild-hybrid <strong>eTSI</strong> motorok takarékosak és csendesek.' },
      { h3: 'Life, Style vagy R-Line?', html: 'A <strong>Life</strong> jól felszerelt alapváltozat, a <strong>Style</strong> elegánsabb, komfortosabb, az <strong>R-Line</strong> sportos külső és belső dizájnnal érkezik.' },
    ],
    design: D('volkswagen-t-roc', 'Volkswagen T-Roc', 'Erősebb, elegánsabb SUV', 'Az új T-Roc világító fénysávot és logót, keskeny LED fényszórókat és kupésabb tetővonalat kapott — sportos, mégis praktikus kompakt SUV.', ['Világító fénysáv és VW-logó (felszereltségtől függően)', 'IQ.LIGHT LED Matrix fényszórók (felszereltségtől függően)', '17–20" könnyűfém keréktárcsák'], 'hátulról'),
    interior: I('Prémiumabb utastér', 'Lebegő érintőkijelző, digitális műszerfal, kormányoszlopon lévő váltókar és puha tapintású anyagok — az új T-Roc utastere egy kategóriával feljebb lépett.', ['Digital Cockpit, lebegő érintőkijelző', 'Kormányoszlopon lévő DSG-választókar', 'Vezeték nélküli App-Connect'], 'volkswagen-t-roc', 'Volkswagen T-Roc vezetőtér'),
    specMatch: [
      ['eTSI', S('1,5 eTSI DSG', { fuel: 'Benzin (mild-hybrid)', power: '116–150 LE', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Takarékos, automata', note: 'mild-hybrid benzines', img: P('volkswagen-t-roc', 'g1') })],
      ['1,5 TSI', S('1,5 TSI DSG', { fuel: 'Benzin', power: '150 LE (110 kW)', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Erősebb benzines', note: 'turbó benzines, automata', img: P('volkswagen-t-roc', 'g4') })],
    ],
    gallery: G('volkswagen-t-roc', 'Volkswagen T-Roc', [['g1', 'fehér színben'], ['g2', 'hátsó fénysáv'], ['g3', 'kék színben, városban'], ['g4', 'oldalnézet'], ['g5', 'menet közben'], ['g6', 'felülnézet'], ['g7', 'kanyarban']]),
    faqExtra: [],
  },

  // ---------------- T-Cross ----------------
  'VW T-Cross': {
    mainImg: P('volkswagen-t-cross', 'main'), mainAlt: 'Volkswagen T-Cross bérlés — VW T-Cross tartós bérletben',
    overviewH2: 'Volkswagen T-Cross tartós bérlet — praktikus kis SUV havidíjjal',
    guideIntro: 'A <strong>Volkswagen T-Cross</strong> (VW T-Cross) a Polo alapjaira épülő kis SUV: magas üléspozíció, csúsztatható hátsó üléspad, nagy csomagtér kompakt külső méretekkel. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a T-Cross-t?', html: 'Városi családoknak és azoknak, akik a kisautó méretét egy SUV magasabb üléspozíciójával és praktikumával szeretnék: a hátsó üléspad 14 cm-t csúsztatható, így a csomagtér rugalmasan bővíthető.' },
      { h3: '1,0 TSI vagy 1,5 TSI?', html: 'Az <strong>1,0 TSI</strong> takarékos háromhengeres, városra ideális; az <strong>1,5 TSI</strong> (150 LE) erősebb, autópályán is könnyedén halad. Mindkettő DSG automata váltós.' },
    ],
    design: D('volkswagen-t-cross', 'Volkswagen T-Cross', 'Kompakt, magabiztos', 'A frissített T-Cross új lökhárítókat, IQ.LIGHT LED fényszórókat és a hátul végigfutó sötétített fénysávot kapott.', ['LED fényszórók, IQ.LIGHT (felszereltségtől függően)', 'Végigfutó hátsó fénysáv', '16–18" könnyűfém keréktárcsák'], 'hátulról, stúdiófotó'),
    interior: I('Praktikus utastér', 'Digitális műszerfal, lebegő érintőkijelző, puhább anyagok a műszerfalon és csúsztatható hátsó üléspad — a T-Cross kívül kicsi, belül meglepően tágas.', ['Digital Cockpit, lebegő érintőkijelző', 'Csúsztatható hátsó üléspad (14 cm)', 'App-Connect okostelefon-integráció']),
    specMatch: [
      ['1,5 TSI', S('1,5 TSI DSG', { fuel: 'Benzin', power: '150 LE (110 kW)', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Erősebb, autópályára is', note: 'négyhengeres turbó, automata', img: P('volkswagen-t-cross', 'g2') })],
      ['1,0 TSI', S('1,0 TSI DSG', { fuel: 'Benzin', power: '116 LE (85 kW)', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Takarékos, városba', note: 'háromhengeres turbó, automata', img: P('volkswagen-t-cross', 'g1') })],
    ],
    gallery: G('volkswagen-t-cross', 'Volkswagen T-Cross', [['g1', 'sárga színben, hegyi úton'], ['g2', 'hátulról'], ['g3', 'elölnézet'], ['g4', 'hátulról, kanyarban'], ['g5', 'pálmafák között'], ['g6', 'hátulról, pálmák között'], ['g7', 'oldalnézet, stúdió'], ['g8', 'hátsó háromnegyedes nézet']]),
    faqExtra: [],
  },

  // ---------------- Passat Variant ----------------
  'VW Passat Variant': {
    mainImg: P('volkswagen-passat-variant', 'main'), mainAlt: 'Volkswagen Passat Variant bérlés — az új VW Passat kombi tartós bérletben',
    body: 'Kombi',
    overviewH2: 'Volkswagen Passat Variant tartós bérlet — a legnépszerűbb flottakombi havidíjjal',
    guideIntro: 'Az új, kilencedik generációs <strong>Volkswagen Passat</strong> (VW Passat) már csak kombi (Variant) karosszériával készül: hosszabb, tágasabb, 690 literes csomagtérrel és prémium szintű utazókomforttal. Mild-hybrid benzines, dízel és plug-in hibrid eHybrid is bérelhető. <strong>Tartós bérletben</strong> ez az egyik legjobb céges autó — egyetlen havi díjjal.',
    guideBlocks: [
      { h3: 'Melyik Passat-ot válaszd?', html: 'A <strong>2,0 TDI</strong> a klasszikus flottaválasztás sokat autózóknak, az <strong>1,5 eTSI</strong> mild-hybrid benzines vegyes használatra, az <strong>1,5 eHybrid</strong> plug-in hibrid pedig 100 km feletti tisztán elektromos hatótávval ideális, ha tölteni tudsz.' },
      { h3: 'Miért jó céges autónak a Passat Variant?', html: 'Nagy csomagtér, kényelmes hátsó ülések, alacsony fogyasztás és Business felszereltség navigációval, vezetéstámogató rendszerekkel — a Passat hosszú üzleti utakra készült.' },
    ],
    design: D('volkswagen-passat-variant', 'Volkswagen Passat Variant', 'Hosszabb, elegánsabb kombi', 'Az új Passat Variant 4,92 m hosszú: áramvonalas orr, világító fénysáv, hosszú tetővonal és nagy csomagtérajtó.', ['IQ.LIGHT LED Matrix fényszórók (felszereltségtől függően)', 'Elektromos csomagtérajtó', '17–19" könnyűfém keréktárcsák'], 'hátulról, téli úton'),
    interior: I('Tágas, csendes utastér', 'A lebegő érintőkijelző, a digitális műszerfal, a kormányoszlopra helyezett váltókar és a kategóriájában kiemelkedő hátsó lábtér teszi a Passatot ideális utazóautóvá.', ['Digital Cockpit, akár 15" érintőkijelző', 'Ergo Active masszázsülések (felszereltségtől függően)', 'Travel Assist, IQ.DRIVE']),
    boot: '690–1920 liter',
    specMatch: [
      ['eHybrid', S('1,5 eHybrid DSG', { fuel: 'Plug-in hibrid', power: '204 LE (150 kW) rendszer', drive: 'Elsőkerék / 6 fok. DSG', rec: 'Töltési lehetőséggel', note: 'plug-in hibrid, 100 km feletti elektromos hatótáv', img: P('volkswagen-passat-variant', 'g3') })],
      ['TDI', S('2,0 TDI DSG', { fuel: 'Dízel', power: '150 LE (110 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Klasszikus flottaválasztás', note: 'takarékos dízel', img: P('volkswagen-passat-variant', 'g1') })],
      ['eTSI', S('1,5 eTSI DSG', { fuel: 'Benzin (mild-hybrid)', power: '150 LE (110 kW)', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Vegyes használatra', note: 'mild-hybrid benzines', img: P('volkswagen-passat-variant', 'g2') })],
    ],
    gallery: G('volkswagen-passat-variant', 'Volkswagen Passat Variant', [['g1', 'havas úton'], ['g2', 'hátulról, erdőben'], ['g3', 'jeges tavon'], ['g4', 'oldalnézet, hóban'], ['g5', 'hátulról'], ['g6', 'oldalnézet'], ['g7', 'elölnézet, havas erdőben']]),
    faqExtra: [
      { q: 'Mekkora a VW Passat Variant csomagtartója?', a: 'Az új Passat Variant csomagtere 690 literes, a hátsó ülések döntésével 1920 literre bővíthető (a plug-in hibridnél kisebb).' },
    ],
  },

  // ---------------- ID.7 Tourer ----------------
  'VW ID.7 Tourer': {
    mainImg: P('volkswagen-id-7-tourer', 'main'), mainAlt: 'Volkswagen ID.7 Tourer bérlés — elektromos kombi tartós bérletben',
    body: 'Kombi',
    overviewH2: 'Volkswagen ID.7 Tourer tartós bérlet — elektromos kombi nagy hatótávval',
    guideIntro: 'A <strong>Volkswagen ID.7 Tourer</strong> a VW elektromos kombija: 605 literes csomagtér, tágas utastér, 286 LE-s hátsókerék-hajtás és kategóriájában kiemelkedő hatótáv. <strong>Elektromos autó tartós bérletben</strong>: nem kell az akkumulátor és az értékvesztés miatt aggódnod — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Pro vagy Pro S?', html: 'Mindkettő 286 LE-s (210 kW), hátsókerék-hajtású. A <strong>Pro</strong> 77 kWh-s akkumulátorral, a <strong>Pro S</strong> nagyobb, 86 kWh-s akkumulátorral és még nagyobb hatótávval érkezik (WLTP szerint 680 km körül) — hosszú utakra ez az ideális.' },
      { h3: 'Elektromos céges autó', html: 'Az ID.7 Tourer zöld rendszámos, így céges autóként is kedvező, a töltés pedig otthon vagy a munkahelyen olcsóbb, mint a tankolás. A nagy csomagtér és a hátsó lábtér családi autónak is ideálissá teszi.' },
    ],
    design: D('volkswagen-id-7-tourer', 'Volkswagen ID.7 Tourer', 'Áramvonalas elektromos kombi', 'Az ID.7 Tourer alacsony légellenállású karosszériája, a világító fénysáv és a hosszú tetővonal elegáns, modern kombit formál — az aerodinamika a hatótávhoz is hozzájárul.', ['IQ.LIGHT LED Matrix fényszórók (felszereltségtől függően)', 'Világító fénysáv és logó', '19–21" keréktárcsák'], 'hátulról, tóparton'),
    interior: I('Tágas, digitális utastér', '15"-os érintőkijelző, augmented reality head-up kijelző, okosüvegtető és a lapos padló miatt kategóriájában kiemelkedő hátsó lábtér.', ['15" érintőkijelző, AR head-up kijelző (felszereltségtől függően)', 'Ergo Active masszázsülések (felszereltségtől függően)', 'Hőszivattyú, előklimatizálás applikációból']),
    boot: '605–1714 liter',
    specs: {
      'Pro': { label: 'ID.7 Tourer Pro', fuel: 'Elektromos', power: '286 LE (210 kW)', torque: '545 Nm', drive: 'Hátsókerék / 1 fok. automata', rec: 'Kiegyensúlyozott választás', note: '77 kWh akkumulátor', img: P('volkswagen-id-7-tourer', 'g1') },
      'Pro S': { label: 'ID.7 Tourer Pro S', fuel: 'Elektromos', power: '286 LE (210 kW)', torque: '545 Nm', drive: 'Hátsókerék / 1 fok. automata', rec: 'Maximális hatótáv', note: '86 kWh akkumulátor, kb. 680 km (WLTP)', img: P('volkswagen-id-7-tourer', 'g3') },
    },
    gallery: G('volkswagen-id-7-tourer', 'Volkswagen ID.7 Tourer', [['g1', 'naplementében'], ['g2', 'hátulról, menet közben'], ['g3', 'elölnézet, mezők között'], ['g4', 'elölnézet, fák között'], ['g5', 'elölnézet, tóparton'], ['g6', 'hátulról, tóparton'], ['g7', 'keréktárcsa és oldalvonal'], ['g8', 'tóparton']]),
    faqExtra: [
      { q: 'Mekkora a VW ID.7 Tourer hatótávja?', a: 'A Pro S változat WLTP szerint kb. 680 km-t tud megtenni egy töltéssel, a Pro kb. 600 km-t; a valós hatótáv a sebességtől és az időjárástól függ.' },
      { q: 'Mekkora az ID.7 Tourer csomagtartója?', a: 'A csomagtér 605 literes, a hátsó ülések döntésével 1714 literre bővíthető.' },
    ],
    schema: { drive: 'RWD' },
  },

  // ---------------- T-Roc Cabrio ----------------
  'VW T-Roc Cabrio': {
    mainImg: P('volkswagen-t-roc-cabrio', 'main'), mainAlt: 'Volkswagen T-Roc Cabrio bérlés — kabrió tartós bérletben',
    body: 'Kabrió',
    overviewH2: 'Volkswagen T-Roc Cabrio tartós bérlet — nyitott tetős SUV havidíjjal',
    guideIntro: 'A <strong>Volkswagen T-Roc Cabrio</strong> az egyetlen kompakt kabrió-SUV a piacon: négy ülés, elektromos vászontető, magas üléspozíció és a T-Roc praktikuma. <strong>Cabrio bérlés</strong> tartós bérletben: nem kell a téli tárolással és az eladással foglalkoznod — egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Miért érdemes kabriót bérelni?', html: 'Egy kabrió a legtöbb embernek második, „örömautó” — tartós bérletben nem kötöd le benne a pénzed, és nem kell attól tartanod, hogy eladáskor mennyit ér. A futamidő végén egyszerűen visszaadod.' },
      { h3: 'Hogyan működik a T-Roc Cabrio teteje?', html: 'Az elektromos vászontető kb. 9 másodperc alatt nyílik, és akár 30 km/h-s sebességig menet közben is működtethető.' },
    ],
    design: D('volkswagen-t-roc-cabrio', 'Volkswagen T-Roc Cabrio', 'SUV-kabrió egyedi formával', 'A T-Roc Cabrio a SUV magasabb üléspozícióját a kabrió szabadságával ötvözi: vászontető, négy ülés, LED fényszórók és az R-Line kivitel sportos részletei.', ['Elektromos vászontető, kb. 9 mp alatt nyílik', 'IQ.LIGHT LED fényszórók (felszereltségtől függően)', 'R-Line sportos lökhárítók, 17–19" keréktárcsák'], 'hátulról, tengerparti úton'),
    interior: I('Négy ülés, nyitott ég alatt', 'Digitális műszerfal, érintőkijelzős infotainment és kényelmes első ülések; a hátsó üléseken két felnőtt is elfér rövidebb utakon.', ['Digital Cockpit', 'Ülésfűtés, kormányfűtés (felszereltségtől függően)', 'App-Connect okostelefon-integráció']),
    specMatch: [
      ['1,5 TSI', S('1,5 TSI DSG', { fuel: 'Benzin', power: '150 LE (110 kW)', torque: '250 Nm', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Nyitott tetős cirkálás', note: 'turbó benzines, automata', img: P('volkswagen-t-roc-cabrio', 'g1') })],
    ],
    gallery: G('volkswagen-t-roc-cabrio', 'Volkswagen T-Roc Cabrio', [['g1', 'tengerparti úton'], ['g2', 'elölnézet'], ['g3', 'hátulról, kanyarban'], ['g4', 'oldalnézet, tenger előtt'], ['g5', 'naplementében'], ['g6', 'fehér házak előtt'], ['g7', 'modern épület előtt'], ['g8', 'menet közben']]),
    faqExtra: [
      { q: 'Menet közben is nyitható a T-Roc Cabrio teteje?', a: 'Igen, az elektromos vászontető kb. 30 km/h sebességig menet közben is nyitható és zárható.' },
    ],
    schema: { doors: 2 },
  },

  // ---------------- Touran ----------------
  'VW Touran': {
    mainImg: P('volkswagen-touran', 'main'), mainAlt: 'Volkswagen Touran bérlés — családi egyterű tartós bérletben',
    overviewH2: 'Volkswagen Touran tartós bérlet — családi egyterű havidíjjal',
    guideIntro: 'A <strong>Volkswagen Touran</strong> (VW Touran) a családi egyterűek klasszikusa: három különálló hátsó ülés, opcionálisan hét ülés, hatalmas csomagtér és rengeteg tárolóhely. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a Touran-t?', html: 'Nagycsaládoknak, akiknek három gyerekülés kell egy sorban, és azoknak, akik sokat szállítanak: a hátsó ülések egyenként dönthetők és csúsztathatók, a csomagtér ötülésesként is nagy.' },
      { h3: '1,5 TSI vagy 2,0 TDI?', html: 'Az <strong>1,5 TSI</strong> (150 LE) benzines manuális vagy DSG váltóval, a <strong>2,0 TDI</strong> (150 LE) dízel DSG-vel — a dízel a sokat autózó családoknak takarékosabb.' },
    ],
    design: D('volkswagen-touran', 'Volkswagen Touran', 'Praktikus egyterű forma', 'Letisztult, időtálló vonalak, nagy üvegfelületek és magas tető — a Touran kívül kompakt, belül meglepően tágas.', ['LED fényszórók (felszereltségtől függően)', 'Nagy üvegfelületek, jó kilátás', 'Tetősínek'], 'hátulról'),
    interior: I('Rugalmas, családbarát utastér', 'Három különálló, egyenként csúsztatható és dönthető hátsó ülés, opcionális harmadik üléssor, rengeteg tárolórekesz és digitális műszerfal.', ['Három különálló hátsó ülés, ISOFIX', 'Opcionális 7 ülés', 'App-Connect, digitális műszerfal (felszereltségtől függően)'], 'volkswagen-touran', 'Volkswagen Touran vezetőtér'),
    specMatch: [
      ['TDI', S('2,0 TDI DSG', { fuel: 'Dízel', power: '150 LE (110 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Sokat autózó családoknak', note: 'takarékos dízel, automata', img: P('volkswagen-touran', 'g2') })],
      ['DSG', S('1,5 TSI DSG', { fuel: 'Benzin', power: '150 LE (110 kW)', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Kényelmes automata', note: 'turbó benzines, automata', img: P('volkswagen-touran', 'g4') })],
      ['1,5 TSI', S('1,5 TSI (manuális)', { fuel: 'Benzin', power: '150 LE (110 kW)', drive: 'Elsőkerék / 6 fok. manuális', rec: 'Kedvezőbb havidíj', note: 'turbó benzines, manuális', img: P('volkswagen-touran', 'g1') })],
    ],
    gallery: G('volkswagen-touran', 'Volkswagen Touran', [['g1', 'kék színben, lakóház előtt'], ['g2', 'oldalnézet'], ['g3', 'esti fényben'], ['g4', 'modern épület előtt'], ['g5', 'hátulról'], ['g6', 'piros színben'], ['g7', 'piros színben, hátulról']]),
    faqExtra: [
      { q: 'Hét üléses a VW Touran?', a: 'A Touran öt- és hétüléses kivitelben is készül; a bérelhető autó ülésszámát az ajánlatban pontosan jelezzük.' },
    ],
  },

  // ---------------- Taigo ----------------
  'VW Taigo': {
    mainImg: P('volkswagen-taigo', 'main'), mainAlt: 'Volkswagen Taigo bérlés — VW Taigo tartós bérletben',
    body: 'SUV Coupé',
    overviewH2: 'Volkswagen Taigo tartós bérlet — kompakt SUV Coupé havidíjjal',
    guideIntro: 'A <strong>Volkswagen Taigo</strong> (VW Taigo) a VW kompakt SUV Coupéja: lejtős tetővonal, sportos megjelenés és magas üléspozíció a Polo technikáján. A bérelhető <strong>1,0 TSI DSG</strong> takarékos, automata váltós. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a Taigo-t?', html: 'Azoknak, akik egy városi méretű, stílusos SUV-t keresnek alacsony költséggel: a Taigo feltűnőbb, mint a T-Cross, a csomagtere pedig így is 440 literes.' },
      { h3: 'Taigo vagy T-Cross?', html: 'Közös technikán alapulnak. A <strong>Taigo</strong> kupésabb és sportosabb, a <a href="/berelheto-auto/volkswagen-t-cross-berles">T-Cross</a> magasabb tetejű, csúsztatható hátsó üléssel praktikusabb.' },
    ],
    design: D('volkswagen-taigo', 'Volkswagen Taigo', 'SUV Coupé-sziluett', 'Lejtős tetővonal, a hűtőrácson átfutó fénycsík (felszereltségtől függően), végigfutó hátsó lámpasáv és izmos kerékívek.', ['IQ.LIGHT LED Matrix fényszórók (felszereltségtől függően)', 'Végigfutó hátsó lámpasáv', '16–18" könnyűfém keréktárcsák'], 'hátulról, országúton'),
    interior: I('Digitális, modern utastér', 'Digitális műszerfal, érintőkijelző és érintőgombos klímavezérlés; a hátsó ülések a kupés tető ellenére is kényelmesek.', ['Digital Cockpit', 'Érintőkijelzős infotainment, App-Connect', 'Vezetéstámogató rendszerek (felszereltségtől függően)']),
    boot: '440–1222 liter',
    specMatch: [
      ['1,0 TSI', S('1,0 TSI DSG', { fuel: 'Benzin', power: '116 LE (85 kW)', torque: '200 Nm', drive: 'Elsőkerék / 7 fok. DSG', rec: 'Takarékos, automata', note: 'háromhengeres turbó, automata', img: P('volkswagen-taigo', 'g1') })],
    ],
    gallery: G('volkswagen-taigo', 'Volkswagen Taigo', [['g1', 'városban'], ['g2', 'modern épület előtt'], ['g3', 'oldalnézet'], ['g4', 'dombok között'], ['g5', 'hátulról, erdei úton'], ['g6', 'menet közben'], ['g7', 'földúton'], ['g8', 'családi ház előtt']]),
    faqExtra: [],
  },

  // ---------------- Touareg ----------------
  'VW Touareg': {
    mainImg: P('volkswagen-touareg', 'main'), mainAlt: 'Volkswagen Touareg Final Edition bérlés — V6 TDI tartós bérletben',
    overviewH2: 'Volkswagen Touareg Final Edition tartós bérlet — V6 TDI, 4MOTION',
    guideIntro: 'A <strong>Volkswagen Touareg</strong> (VW Touareg) a VW zászlóshajó SUV-ja, a bérelhető <strong>Final Edition</strong> pedig a modell búcsúváltozata: 3,0 V6 TDI, 231 LE, 500 Nm, 8 fokozatú Tiptronic és <strong>4MOTION összkerékhajtás</strong>, gazdag felszereltséggel. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a nagy SUV értékvesztése nem téged terhel.',
    guideBlocks: [
      { h3: 'Miért a Touareg V6 TDI?', html: 'A hathengeres dízel nagy nyomatéka hosszú autópályás utakon és utánfutóval (akár 3,5 tonna vontatható tömeg) is könnyed, az összkerékhajtás télen is magabiztos. A Touareg kényelme és hangszigetelése a prémium kategóriát idézi.' },
      { h3: 'Mi a Touareg Final Edition?', html: 'A Touareg gyártása befejeződik; a Final Edition a modell utolsó, különlegesen felszerelt kiadása, egyedi dizájnelemekkel — gyűjtőknek és a nagy V6 dízel SUV kedvelőinek is különleges.' },
    ],
    design: D('volkswagen-touareg', 'Volkswagen Touareg', 'Zászlóshajó-SUV megjelenés', 'Széles, krómozott hűtőrács, IQ.LIGHT HD Matrix fényszórók, világító fénysáv és a Final Edition egyedi részletei — a Touareg tekintélyt parancsoló, mégis elegáns.', ['IQ.LIGHT HD Matrix fényszórók (felszereltségtől függően)', 'Final Edition egyedi dizájnelemek', '20–21" könnyűfém keréktárcsák'], 'hátsó háromnegyedes nézet'),
    interior: I('Innovision Cockpit, prémium kényelem', 'A 12"-os digitális műszerfal és a 15"-os érintőkijelző egybefüggő üvegfelületet alkot; a bőrülések, a négyzónás klíma és a kiváló hangszigetelés hosszú úton is pihentető.', ['Innovision Cockpit (12" + 15")', 'Bőrkárpit, ülésfűtés (felszereltségtől függően)', 'Légrugós futómű (felszereltségtől függően)'], 'volkswagen-touareg', 'Volkswagen Touareg Innovision Cockpit'),
    specs: {
      '3,0 V6 TDI SCR 4MOTION Tiptronic FINAL EDITION': { label: 'Touareg 3,0 V6 TDI 4MOTION Final Edition', fuel: 'Dízel (V6)', power: '231 LE (170 kW)', torque: '500 Nm', drive: '4MOTION összkerék / 8 fok. Tiptronic', rec: 'Nagy SUV, vontatásra', note: 'hathengeres dízel, Final Edition', img: P('volkswagen-touareg', 'g1') },
    },
    gallery: G('volkswagen-touareg', 'Volkswagen Touareg', [['g1', 'hátulról, városban'], ['g2', 'műszerfal'], ['g3', 'középkonzol']]),
    faqExtra: [
      { q: 'Mennyi a VW Touareg V6 TDI teljesítménye?', a: 'A bérelhető Touareg 3,0 V6 TDI motorja 231 lóerős (170 kW) és 500 Nm nyomatékú, 8 fokozatú automata váltóval és 4MOTION összkerékhajtással.' },
    ],
    schema: { drive: 'AWD' },
  },
};
