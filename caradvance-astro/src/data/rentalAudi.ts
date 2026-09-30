// Audi bérlési tartalom — sajtófotók: Audi MediaCenter (audi.com/en/photos), 1200×900 webp.
// Számok (ár, km, futamidő, kaució, darabszám) NEM itt vannak: azok a napi Choice-szinkronból jönnek.
import type { RentalContent } from './rentalPage';

const P = (m: string, k: string) => `/berles-press/${m}-${k}.webp`;
const G = (m: string, name: string, items: [string, string][]) => items.map(([k, alt]) => ({ img: P(m, k), alt: `${name} ${alt}` }));
const ED = (m: string, name: string, d: { h3: string; text: string; bullets: string[] }, i: { h3: string; text: string; bullets: string[] }, dAlt: string, iAlt: string) => ({
  design: { ...d, img: P(m, 'design'), alt: `${name} ${dAlt}` },
  interior: iAlt ? { ...i, img: P(m, 'interior'), alt: `${name} ${iAlt}` } : { ...i }, // üres iAlt = nincs belső sajtófotó
});
const MMI = 'Audi MMI panoráma kijelző: virtuális műszerfal és nagy MMI érintőkijelző';

export const AUDI: Record<string, RentalContent> = {
  // ---------------- A6 Avant ----------------
  'Audi A6 Avant': {
    mainImg: P('audi-a6-avant', 'main'), mainAlt: 'Audi A6 Avant bérlés — az új A6 Avant tartós bérletben',
    body: 'Kombi',
    overviewH2: 'Audi A6 Avant tartós bérlet — a prémium üzleti kombi havidíjjal',
    guideIntro: 'Az új <strong>Audi A6 Avant</strong> (C9) a prémium kombik egyik mércéje: közel 5 méteres, elegáns karosszéria, nagy csomagtér, kifinomult utazókomfort és <strong>quattro összkerékhajtás</strong>. <strong>Tartós bérletben</strong> ideális céges és családi autó — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük, a továbbeladás gondja pedig nem a tiéd.',
    guideBlocks: [
      { h3: 'TDI quattro vagy e-hybrid quattro?', html: 'A <strong>TDI quattro</strong> 204 lóerős, MHEV plus technikájú dízel: nagy nyomaték, alacsony fogyasztás, hosszú autópályás utakra ideális. Az <strong>e-hybrid quattro</strong> plug-in hibrid: a 2.0 TFSI benzinmotort villanymotor segíti, így a napi ingázás nagy része tisztán elektromosan megtehető, ha otthon vagy a munkahelyen tölteni tudsz.' },
      { h3: 'Kinek ajánljuk az Audi A6 Avant bérlését?', html: 'Cégvezetőknek és sokat utazó üzletembereknek, akik reprezentatív, mégis praktikus autót keresnek, valamint családoknak, akiknek fontos a nagy csomagtér és a hosszú utakon is pihentető kényelem. A quattro összkerékhajtás télen és utánfutóval is magabiztos.' },
    ],
    ...ED('audi-a6-avant', 'Audi A6 Avant',
      { h3: 'Elegáns Avant-sziluett', text: 'Az új A6 Avant lapos, széles Singleframe hűtőmaszkot, keskeny LED fényszórókat és a hátsó részen végigfutó fénysávot kapott. A lejtős D-oszlop és a hosszú tetővonal az Avantokra jellemző sportos eleganciát adja.', bullets: ['Digitális OLED hátsó lámpák (felszereltségtől függően)', 'Matrix LED fényszórók (felszereltségtől függően)', 'Elektromos csomagtérajtó, tetősínek'] },
      { h3: 'Digitális utastér, prémium kényelem', text: 'Az utasteret az ívelt MMI panoráma kijelző uralja; opcióként az utas elé is kerülhet kijelző. A hangszigetelés, az ülések és a futómű a hosszú üzleti utakon is pihentetővé teszik az autózást.', bullets: [MMI, 'Háromzónás automata klíma, ülésfűtés', 'Vezeték nélküli Apple CarPlay / Android Auto'] },
      'hátsó háromnegyedes nézet', 'belső tér — MMI panoráma kijelző'),
    specs: {
      'TDI quattro S tronic': { label: 'A6 Avant TDI quattro', fuel: 'Dízel (MHEV plus)', power: '204 LE (150 kW)', torque: '400 Nm', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Sokat autózóknak, hosszú utakra', note: 'takarékos MHEV plus dízel, quattro', img: P('audi-a6-avant', 'g2') },
      'e-Hybrid quattro S tronic': { label: 'A6 Avant e-hybrid quattro', fuel: 'Plug-in hibrid', power: '2.0 TFSI (252 LE) + villanymotor', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Töltési lehetőséggel, városba és ingázásra', note: 'plug-in hibrid, tisztán elektromos ingázás', img: P('audi-a6-avant', 'g6') },
    },
    gallery: G('audi-a6-avant', 'Audi A6 Avant', [['g1', 'naplementében, hegyi úton'], ['g2', 'menet közben, elölnézet'], ['g3', 'hátulról, sziklák között'], ['g4', 'kanyargós úton'], ['g5', 'szerpentinen'], ['g6', 'oldalnézet'], ['g7', 'modern épület előtt'], ['g8', 'vezetőtér'], ['g9', 'hátsó ülések']]),
    faqExtra: [
      { q: 'Van plug-in hibrid Audi A6 Avant bérelhető?', a: 'Igen, az A6 Avant e-hybrid quattro tölthető plug-in hibrid: a napi rövidebb utakat tisztán elektromosan teheted meg, hosszú úton pedig a benzinmotor gondoskodik a hatótávról.' },
      { q: 'Összkerékhajtású a bérelhető Audi A6 Avant?', a: 'Igen, a bérelhető TDI és e-hybrid változat is quattro összkerékhajtású — télen, esőben és utánfutóval is biztonságos.' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- Q5 Sportback ----------------
  'Audi Q5 Sportback': {
    mainImg: P('audi-q5-sportback', 'main'), mainAlt: 'Audi Q5 Sportback bérlés — az új Q5 Sportback tartós bérletben',
    overviewH2: 'Audi Q5 Sportback tartós bérlet — sportos SUV Coupé havidíjjal',
    guideIntro: 'Az új <strong>Audi Q5 Sportback</strong> a népszerű Q5 lecsapott tetővonalú, sportosabb testvére: SUV-kényelem, magas üléspozíció és coupé-szerű elegancia, minden bérelhető változatban <strong>quattro összkerékhajtással</strong>. <strong>Tartós bérletben</strong> négyféle hajtás közül választhatsz — dízel, benzines vagy kétféle plug-in hibrid —, egyetlen havi díjjal, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Melyik Q5 Sportback-et válaszd?', html: 'A <strong>TDI quattro</strong> (204 LE) a sokat autózóknak, a <strong>TFSI quattro</strong> (204 LE) benzines a vegyes használatra ideális. Az <strong>e-hybrid quattro</strong> plug-in hibrid két teljesítményszinttel (220 kW / 299 LE és 270 kW / 367 LE) érhető el — ha tölteni tudsz, a napi ingázás nagy része tisztán elektromosan megtehető.' },
      { h3: 'Audi Q5 Sportback vagy Q5 SUV?', html: 'Technikában és felszereltségben azonosak, a különbség a karosszéria: a <strong>Sportback</strong> lejtős tetővonala sportosabb, elegánsabb megjelenést ad, a hátsó fejtér és a csomagtér alig kisebb. Ha a stílus fontos, a Sportback a jobb választás.' },
    ],
    ...ED('audi-q5-sportback', 'Audi Q5 Sportback',
      { h3: 'Coupé-sziluett, SUV-magabiztosság', text: 'A harmadik generációs Q5 Sportback markáns Singleframe hűtőmaszkkal, keskeny LED fényszórókkal és digitális OLED hátsó lámpákkal érkezik. A lejtős tetővonal és az erős vállvonal dinamikus, prémium megjelenést ad.', bullets: ['Digitális OLED hátsó lámpák (felszereltségtől függően)', 'Matrix LED fényszórók (felszereltségtől függően)', '19–21" könnyűfém keréktárcsák'] },
      { h3: 'Digitális vezetőtér', text: 'Az MMI panoráma kijelző, az opcionális utas-kijelző és a prémium anyagok modern, rendezett utasteret adnak. Hátul felnőttek is kényelmesen utaznak.', bullets: [MMI, 'Ülésfűtés, háromzónás klíma (felszereltségtől függően)', 'Vezeték nélküli okostelefon-integráció'] },
      'hátsó háromnegyedes nézet, hegyi úton', ''),
    specs: {
      'TDI quattro S tronic': { label: 'Q5 Sportback TDI quattro', fuel: 'Dízel (MHEV plus)', power: '204 LE (150 kW)', torque: '400 Nm', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Sokat autózóknak', note: 'takarékos MHEV plus dízel', img: P('audi-q5-sportback', 'g2') },
      'TFSI quattro S tronic': { label: 'Q5 Sportback TFSI quattro', fuel: 'Benzin (MHEV plus)', power: '204 LE (150 kW)', torque: '340 Nm', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Vegyes használatra', note: 'MHEV plus benzines', img: P('audi-q5-sportback', 'g1') },
      'e-Hybrid quattro S tronic': { label: 'Q5 Sportback e-hybrid quattro 220 kW', fuel: 'Plug-in hibrid', power: '299 LE (220 kW) rendszer', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Töltési lehetőséggel', note: 'plug-in hibrid, elektromos ingázás', img: P('audi-q5-sportback', 'g3') },
      'e-Hybrid quattro 270 kW S tronic': { label: 'Q5 Sportback e-hybrid quattro 270 kW', fuel: 'Plug-in hibrid', power: '367 LE (270 kW) rendszer', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Erős és tölthető', note: 'a legerősebb plug-in hibrid Q5', img: P('audi-q5-sportback', 'g5') },
    },
    gallery: G('audi-q5-sportback', 'Audi Q5 Sportback', [['g1', 'szerpentinen, hátulról'], ['g2', 'kanyarban, elölnézet'], ['g3', 'pálmafák között'], ['g4', 'téli úton'], ['g5', 'hátulról, esti fényben'], ['g6', 'LED fényszórókkal'], ['g7', 'havas hegyek között']]),
    faqExtra: [
      { q: 'Minden Audi Q5 Sportback összkerékhajtású?', a: 'Igen, a bérelhető Q5 Sportback változatok mind quattro összkerékhajtásúak — a dízel, a benzines és a plug-in hibrid is.' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- A5 Avant ----------------
  'Audi A5 Avant': {
    mainImg: P('audi-a5-avant', 'main'), mainAlt: 'Audi A5 Avant e-hybrid bérlés — plug-in hibrid kombi tartós bérletben',
    body: 'Kombi',
    overviewH2: 'Audi A5 Avant tartós bérlet — plug-in hibrid prémium kombi havidíjjal',
    guideIntro: 'Az új <strong>Audi A5 Avant</strong> az A4 Avant utódja: sportos, elegáns középkategóriás prémium kombi. A bérelhető <strong>A5 Avant e-hybrid quattro</strong> plug-in hibrid, így a napi ingázás nagy része tisztán elektromosan megtehető, hosszú úton pedig a benzinmotor és a quattro összkerékhajtás gondoskodik a teljesítményről. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Miért jó választás a plug-in hibrid A5 Avant?', html: 'Ha otthon vagy a munkahelyen tölteni tudsz, a városi és elővárosi utak jelentős részét elektromosan, csendesen és alacsony költséggel teheted meg. Hosszú úton nincs hatótáv-szorongás: a 2.0 TFSI motor és a villanymotor együtt dolgozik, quattro összkerékhajtással.' },
      { h3: 'Audi A5 Avant — utód az A4 Avant helyén', html: 'Az Audi új elnevezési rendszerében a belsőégésű és hibrid középkategória neve A5 lett: az <strong>A5 Avant</strong> tehát az A4 Avant utódja, nagyobb, modernebb és digitálisabb elődjénél.' },
    ],
    ...ED('audi-a5-avant', 'Audi A5 Avant',
      { h3: 'Sportos kombi-arányok', text: 'Az A5 Avant lapos, széles hűtőmaszkkal, keskeny LED fényszórókkal és dinamikus, lejtős tetővonallal érkezik. A hátsó részen végigfutó fénysáv és a digitális OLED lámpák egyedi fénygrafikát adnak.', bullets: ['Digitális OLED hátsó lámpák (felszereltségtől függően)', 'Matrix LED fényszórók (felszereltségtől függően)', 'Elektromos csomagtérajtó'] },
      { h3: 'MMI panoráma kijelző', text: 'A vezető előtt ívelt MMI panoráma kijelző, opcionálisan az utas előtt is kijelző; a sportos kormány és a prémium anyagok vezetőközpontú utasteret adnak.', bullets: [MMI, 'Sportülések, ülésfűtés (felszereltségtől függően)', 'Vezeték nélküli Apple CarPlay / Android Auto'] },
      'hátsó háromnegyedes nézet', 'vezetőtér'),
    specs: {
      'e-Hybrid quattro S tronic': { label: 'A5 Avant e-hybrid quattro', fuel: 'Plug-in hibrid', power: '2.0 TFSI + villanymotor', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Tölthető prémium kombi', note: 'plug-in hibrid, belépő kivitel', img: P('audi-a5-avant', 'g1') },
      'e-hybrid quattro S tronic': { label: 'A5 Avant e-hybrid quattro', fuel: 'Plug-in hibrid', power: '2.0 TFSI + villanymotor', drive: 'quattro összkerék / 7 fok. S tronic', rec: 'Bővebb kivitel', note: 'plug-in hibrid, bővebb kivitel', img: P('audi-a5-avant', 'g2') },
    },
    gallery: G('audi-a5-avant', 'Audi A5 Avant', [['g1', 'menet közben, erdei úton'], ['g2', 'elölnézet'], ['g3', 'hátulról'], ['g4', 'oldalnézet'], ['g5', 'elölnézet, városban'], ['g6', 'töltés közben'], ['g7', 'műszerfal'], ['g8', 'csomagtartó']]),
    faqExtra: [
      { q: 'Tölthető az Audi A5 Avant e-hybrid?', a: 'Igen, az A5 Avant e-hybrid quattro konnektoros (plug-in) hibrid: otthoni fali töltőn vagy nyilvános AC töltőn tölthető, a rövidebb napi utakat tisztán elektromosan teheted meg.' },
      { q: 'Mi a különbség az Audi A4 Avant és az A5 Avant között?', a: 'Az A5 Avant az A4 Avant utódja az Audi új modellnevezési rendszerében: nagyobb, modernebb és digitálisabb, plug-in hibrid hajtással is elérhető.' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- Q4 Sportback e-tron ----------------
  'Audi Q4 Sportback e-tron': {
    mainImg: P('audi-q4-sportback-e-tron', 'main'), mainAlt: 'Audi Q4 Sportback e-tron bérlés — elektromos SUV Coupé tartós bérletben',
    overviewH2: 'Audi Q4 Sportback e-tron tartós bérlet — elektromos SUV Coupé havidíjjal',
    guideIntro: 'Az <strong>Audi Q4 Sportback e-tron</strong> a márka legnépszerűbb elektromos modelljének coupé-változata: tágas utastér, praktikus csomagtér és nulla helyi kibocsátás. <strong>Elektromos autó tartós bérletben</strong> a legkisebb kockázattal: nem kell az akkumulátor élettartama és a használtautó-érték miatt aggódnod — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Miért érdemes elektromos autót bérelni?', html: 'Az elektromos autók technikája gyorsan fejlődik, a használt értékük nehezen kiszámítható. <strong>Tartós bérletben</strong> ez a kockázat nem téged terhel: a futamidő végén egyszerűen visszaadod az autót, vagy újabbra cseréled. Közben élvezed az alacsony üzemeltetési költséget és a zöld rendszám előnyeit (pl. ingyenes parkolás sok városban).' },
      { h3: 'Q4 Sportback e-tron vagy performance?', html: 'Az alapváltozat (204 LE) a mindennapokra bőven elegendő teljesítményt ad, a <strong>performance</strong> 286 lóerős (210 kW) hátsókerék-hajtású változat pedig nagyobb akkumulátorral és erősebb gyorsulással érkezik — hosszabb utakra ez az ideális választás.' },
    ],
    ...ED('audi-q4-sportback-e-tron', 'Audi Q4 Sportback e-tron',
      { h3: 'Coupé-vonalak, elektromos karakter', text: 'A Q4 Sportback e-tron lejtős tetővonala, a zárt, elektromos autókra jellemző hűtőmaszk és a keskeny LED fényszórók dinamikus, modern megjelenést adnak. A hátsó spoiler az aerodinamikát is javítja.', bullets: ['Zárt Singleframe maszk, LED fényszórók', 'Hátsó spoiler, jó légellenállás', '19–21" könnyűfém keréktárcsák'] },
      { h3: 'Tágas, digitális utastér', text: 'A lapos padló miatt hátul is bőséges a lábtér. A frissített Q4 digitális műszerfallal, nagy középső érintőkijelzővel és opcionális kiterjesztett valóság head-up kijelzővel érkezik.', bullets: ['Audi virtual cockpit, nagy MMI érintőkijelző', 'Augmented reality head-up kijelző (felszereltségtől függően)', 'Előklimatizálás applikációból'] },
      'hátsó háromnegyedes nézet', 'belső tér — műszerfal és középkonzol'),
    specs: {
      '—': { label: 'Q4 Sportback e-tron', fuel: 'Elektromos', power: '204 LE (150 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'Városba és ingázásra', note: 'elektromos, a mindennapokra', img: P('audi-q4-sportback-e-tron', 'g1') },
      'performance': { label: 'Q4 Sportback e-tron performance', fuel: 'Elektromos', power: '286 LE (210 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'Hosszabb utakra, nagyobb hatótáv', note: 'nagyobb akkumulátor, erősebb motor', img: P('audi-q4-sportback-e-tron', 'g4') },
    },
    gallery: G('audi-q4-sportback-e-tron', 'Audi Q4 Sportback e-tron', [['g1', 'hegyi úton'], ['g2', 'hátsó háromnegyedes nézet'], ['g3', 'kanyarban'], ['g4', 'zöld színben, elölnézet'], ['g5', 'felülnézet'], ['g6', 'modern ház előtt'], ['g7', 'menet közben'], ['g8', 'naplementében']]),
    faqExtra: [
      { q: 'Megéri elektromos Audit tartós bérletben használni?', a: 'Igen: a havidíj előre kiszámítható, az akkumulátor és a használt érték kockázata nem téged terhel, az üzemeltetés (töltés, szerviz) pedig általában olcsóbb, mint egy belsőégésű autónál.' },
    ],
    schema: { drive: 'RWD' },
  },

  // ---------------- SQ5 Sportback ----------------
  'Audi SQ5 Sportback': {
    mainImg: P('audi-sq5-sportback', 'main'), mainAlt: 'Audi SQ5 Sportback bérlés — 367 lóerős sportos SUV Coupé tartós bérletben',
    overviewH2: 'Audi SQ5 Sportback tartós bérlet — 367 LE, V6, quattro',
    guideIntro: 'Az új <strong>Audi SQ5 Sportback</strong> a Q5 család sportos csúcsmodellje: 3.0 TFSI V6 benzinmotor, <strong>367 LE (270 kW)</strong>, 550 Nm, quattro összkerékhajtás és 0–100 km/h 4,5 másodperc. <strong>Tartós bérletben</strong> úgy vezetheted, hogy a jelentős vételár és értékvesztés nem téged terhel — egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk az SQ5 Sportback-et?', html: 'Azoknak, akik egy praktikus, ötajtós SUV-ban is sportautós teljesítményt szeretnének: a V6 motor hangja, a sportfutómű és a quattro hajtás minden körülmény között élvezetes, mégis kényelmes napi autót ad.' },
    ],
    ...ED('audi-sq5-sportback', 'Audi SQ5 Sportback',
      { h3: 'S-modell dizájn', text: 'Az SQ5 Sportback egyedi S lökhárítókat, alumínium hatású tükörházat, négy kipufogóvéget és nagyobb keréktárcsákat kap. A lejtős tetővonal és a széles kerékívek erőt és eleganciát sugároznak.', bullets: ['S lökhárítók, négy kipufogóvég', 'Alumínium hatású tükörházak', '20–21" keréktárcsák (felszereltségtől függően)'] },
      { h3: 'Sportos, digitális utastér', text: 'S sportülések, S kormány, MMI panoráma kijelző és prémium anyagok. A sportos karakter mellett hosszú úton is kényelmes.', bullets: ['S sportülések, S bőrkormány', MMI, 'Bang & Olufsen hangrendszer (felszereltségtől függően)'] },
      'hátsó háromnegyedes nézet', 'vezetőtér'),
    specs: {
      'TFSI quattro S tronic': { label: 'SQ5 Sportback TFSI quattro', fuel: 'Benzin (V6, MHEV plus)', power: '367 LE (270 kW)', torque: '550 Nm', drive: 'quattro összkerék / 7 fok. S tronic', accel: '4,5 mp', vmax: '250 km/h', rec: 'Sportos csúcsmodell', note: '3.0 TFSI V6, quattro', img: P('audi-sq5-sportback', 'g1') },
      'TFSI S tronic': { label: 'SQ5 Sportback TFSI quattro', fuel: 'Benzin (V6, MHEV plus)', power: '367 LE (270 kW)', torque: '550 Nm', drive: 'quattro összkerék / 7 fok. S tronic', accel: '4,5 mp', vmax: '250 km/h', rec: 'Sportos csúcsmodell', note: '3.0 TFSI V6, quattro', img: P('audi-sq5-sportback', 'g3') },
    },
    gallery: G('audi-sq5-sportback', 'Audi SQ5 Sportback', [['g1', 'piros színben, szerpentinen'], ['g2', 'hátulról, kanyarban'], ['g3', 'elölnézet, terepen'], ['g4', 'patakon át'], ['g5', 'havas tájban'], ['g6', 'téli úton, naplementében'], ['g7', 'havas hegyek között']]),
    faqExtra: [
      { q: 'Mennyi az Audi SQ5 Sportback teljesítménye?', a: 'Az SQ5 Sportback 3.0 TFSI V6 motorja 367 lóerős (270 kW) és 550 Nm nyomatékú; 0–100 km/h 4,5 mp, végsebesség 250 km/h (elektronikusan korlátozva).' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- A3 Sportback ----------------
  'Audi A3 Sportback': {
    mainImg: P('audi-a3-sportback', 'main'), mainAlt: 'Audi A3 Sportback e-hybrid bérlés — plug-in hibrid kompakt tartós bérletben',
    overviewH2: 'Audi A3 Sportback e-hybrid tartós bérlet — prémium kompakt, tölthető hibrid',
    guideIntro: 'Az <strong>Audi A3 Sportback e-hybrid</strong> a prémium kompakt kategória egyik legsokoldalúbb modellje: 1.5 TFSI benzinmotor (150 LE) és villanymotor, <strong>204 LE rendszerteljesítmény</strong> és akár 140 km tisztán elektromos hatótáv (WLTP). <strong>Tartós bérletben</strong> a városi ingázás szinte teljesen elektromos lehet — egyetlen havi díjjal, szerviz, adó és gumik benne.',
    guideBlocks: [
      { h3: 'Kinek ideális az A3 Sportback e-hybrid?', html: 'Ha naponta 30–80 km-t autózol és tölteni tudsz otthon vagy a munkahelyen, a hétköznapokon szinte csak áramot használsz, hétvégén pedig benzinnel is gond nélkül elmész a Balatonra. Kompakt mérete miatt városban könnyen parkolható.' },
      { h3: 'Audi A3 Sportback vagy nagyobb Audi?', html: 'Az A3 Sportback a legkedvezőbb belépő a prémium Audi világba: kompakt méret, prémium minőség, alacsony fogyasztás. Ha nagyobb csomagtér kell, érdemes a <a href="/berelheto-auto/audi-q3-sportback-berles">Q3 Sportback</a> vagy az <a href="/berelheto-auto/audi-a5-avant-berles">A5 Avant</a> bérlését is megnézni.' },
    ],
    ...ED('audi-a3-sportback', 'Audi A3 Sportback',
      { h3: 'Sportos kompakt forma', text: 'A frissített A3 Sportback szélesebb, markánsabb Singleframe maszkkal, választható LED nappali menetfény-grafikával és sportos hátsó diffúzorral érkezik.', bullets: ['LED fényszórók választható fénygrafikával', 'Sportos lökhárítók, hátsó diffúzor', 'Ötajtós, praktikus karosszéria'] },
      { h3: 'Digitális, vezetőközpontú utastér', text: 'Audi virtual cockpit, MMI érintőkijelző és a vezető felé fordított középkonzol. A frissített modell új anyagokat és hangulatvilágítást kapott.', bullets: ['Audi virtual cockpit, MMI érintőkijelző', 'Hangulatvilágítás, sportülések (felszereltségtől függően)', 'Vezeték nélküli okostelefon-integráció'] },
      'hátsó háromnegyedes nézet', 'műszerfal és MMI kijelző'),
    specs: {
      'e-hybrid S tronic': { label: 'A3 Sportback e-hybrid', fuel: 'Plug-in hibrid', power: '204 LE (150 kW) rendszer', torque: '350 Nm', drive: 'Elsőkerék / 6 fok. S tronic', rec: 'Ingázásra, töltési lehetőséggel', note: '1.5 TFSI + villanymotor, akár 140 km elektromosan', img: P('audi-a3-sportback', 'g1') },
    },
    gallery: G('audi-a3-sportback', 'Audi A3 Sportback', [['g1', 'fehér színben'], ['g2', 'menet közben'], ['g3', 'piros színben, oldalnézet'], ['g4', 'elölnézet'], ['g5', 'hátulról'], ['g6', 'menet közben, piros'], ['g7', 'csomagtartó']]),
    faqExtra: [
      { q: 'Mekkora az Audi A3 Sportback e-hybrid elektromos hatótávja?', a: 'Az A3 Sportback e-hybrid tisztán elektromosan akár kb. 140 km-t tud megtenni (WLTP), így a napi ingázás nagy része benzin nélkül megoldható.' },
    ],
    schema: { drive: 'FWD' },
  },

  // ---------------- A6 Avant e-tron ----------------
  'Audi A6 Avant e-tron': {
    mainImg: P('audi-a6-avant-e-tron', 'main'), mainAlt: 'Audi A6 Avant e-tron bérlés — elektromos prémium kombi tartós bérletben',
    body: 'Kombi',
    overviewH2: 'Audi A6 Avant e-tron tartós bérlet — elektromos kombi, 700 km feletti hatótáv',
    guideIntro: 'Az <strong>Audi A6 Avant e-tron</strong> az Audi elektromos prémium kombija, a Porschéval közösen fejlesztett PPE platformra épül: nagy, 100 kWh-s akkumulátor, 270 kW-os villámtöltés és kategóriájában kiemelkedő, <strong>700 km feletti hatótáv</strong> (WLTP). <strong>Tartós bérletben</strong> az elektromos autó értékvesztésének kockázata nem téged terhel — egyetlen havi díjat fizetsz.',
    guideBlocks: [
      { h3: '270 kW performance vagy 315 kW quattro?', html: 'A <strong>performance</strong> hátsókerék-hajtású, 367 LE (270 kW) és a leghosszabb hatótávot kínálja. A <strong>quattro</strong> két villanymotorral, 428 LE-vel (315 kW) és összkerékhajtással érkezik — télen és sportosabb vezetéshez ideális.' },
      { h3: 'Gyorstöltés 270 kW-tal', html: 'A 800 voltos rendszernek köszönhetően megfelelő DC töltőn kb. 10 perc alatt több mint 300 km hatótáv tölthető vissza, 10-ről 80%-ra pedig kb. 21 perc alatt tölt.' },
    ],
    ...ED('audi-a6-avant-e-tron', 'Audi A6 Avant e-tron',
      { h3: 'Aerodinamikus elektromos Avant', text: 'Az A6 Avant e-tron alacsony, elnyújtott sziluettje, osztott fényszórói és zárt hűtőmaszkja nemcsak modern, hanem kiemelkedően aerodinamikus is — ez is hozzájárul a nagy hatótávhoz.', bullets: ['Osztott Matrix LED fényszórók (felszereltségtől függően)', 'Digitális OLED hátsó lámpák, világító Audi-karikák', 'Virtuális külső tükrök (felszereltségtől függően)'] },
      { h3: 'MMI panoráma kijelző, prémium utastér', text: 'Az ívelt MMI panoráma kijelző, az opcionális utas-kijelző és a kiváló hangszigetelés csendes, prémium utazást ad. A csomagtér mellett elöl is van kisebb tárolóhely.', bullets: [MMI, 'Augmented reality head-up kijelző (felszereltségtől függően)', 'Hőszivattyú, előklimatizálás'] },
      'hátsó háromnegyedes nézet', 'belső tér'),
    specs: {
      '270 kW performance': { label: 'A6 Avant e-tron performance', fuel: 'Elektromos', power: '367 LE (270 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'A leghosszabb hatótáv', note: 'hátsókerék-hajtás, 700 km feletti hatótáv', img: P('audi-a6-avant-e-tron', 'g2') },
      '315 kW quattro': { label: 'A6 Avant e-tron quattro', fuel: 'Elektromos', power: '428 LE (315 kW)', drive: 'quattro összkerék / 1 fok. automata', rec: 'Összkerékhajtás, erősebb', note: 'két villanymotor, összkerékhajtás', img: P('audi-a6-avant-e-tron', 'g6') },
    },
    gallery: G('audi-a6-avant-e-tron', 'Audi A6 Avant e-tron', [['g1', 'hegyi úton'], ['g2', 'menet közben, elölnézet'], ['g3', 'hátulról, naplementében'], ['g4', 'elölnézet, pálmafák között'], ['g5', 'hátsó nézet'], ['g6', 'erdei úton'], ['g7', 'hátulról, menet közben'], ['g8', 'oldalnézet, vulkán előtt']]),
    faqExtra: [
      { q: 'Mekkora az Audi A6 Avant e-tron hatótávja?', a: 'A 270 kW performance változat WLTP szerint 700 km feletti hatótávot kínál; a valós hatótáv a vezetési stílustól, a sebességtől és az időjárástól függ.' },
      { q: 'Milyen gyorsan tölt az Audi A6 Avant e-tron?', a: 'Egyenáramú gyorstöltőn akár 270 kW-tal tölt: 10–80% kb. 21 perc alatt.' },
    ],
  },

  // ---------------- Q4 e-tron ----------------
  'Audi Q4 e-tron': {
    mainImg: P('audi-q4-e-tron', 'main'), mainAlt: 'Audi Q4 e-tron bérlés — elektromos prémium SUV tartós bérletben',
    overviewH2: 'Audi Q4 e-tron tartós bérlet — elektromos prémium SUV havidíjjal',
    guideIntro: 'Az <strong>Audi Q4 e-tron</strong> a márka legkeresettebb elektromos SUV-ja: kompakt külső méretek, meglepően tágas utastér és hosszú utakra is elegendő hatótáv. A bérelhető <strong>Q4 e-tron performance</strong> 286 LE-s (210 kW) hátsókerék-hajtású változat nagy akkumulátorral. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, az elektromos autó értékvesztése nem téged terhel.',
    guideBlocks: [
      { h3: 'Miért a Q4 e-tron performance?', html: 'A performance a Q4 család legjobb kompromisszuma: erős, 286 lóerős motor, nagy akkumulátor és hátsókerék-hajtás, amely kis fordulókört és dinamikus vezetést ad. Városban és autópályán is kiváló.' },
      { h3: 'Elektromos autó tartós bérlet — mire figyelj?', html: 'Érdemes otthoni fali töltőt (wallbox) telepíteni: így éjszaka, olcsón töltesz, és reggel mindig teli akkumulátorral indulsz. Hosszabb utakon a gyorstöltők hálózata ma már egész Európában sűrű.' },
    ],
    ...ED('audi-q4-e-tron', 'Audi Q4 e-tron',
      { h3: 'Modern elektromos SUV', text: 'Zárt Singleframe maszk, keskeny LED fényszórók, rövid túlnyúlások és hosszú tengelytáv — a Q4 e-tron kívül kompakt, belül tágas.', bullets: ['LED / Matrix LED fényszórók (felszereltségtől függően)', 'Rövid túlnyúlások, hosszú tengelytáv', '19–21" könnyűfém keréktárcsák'] },
      { h3: 'Tágas, digitális utastér', text: 'A lapos padló miatt hátul is bőséges a lábtér; a frissített Q4 új, nagyobb kijelzőket és modernebb kezelőfelületet kapott.', bullets: ['Audi virtual cockpit, nagy MMI érintőkijelző', 'Augmented reality head-up kijelző (felszereltségtől függően)', 'Előklimatizálás applikációból'] },
      'hátsó háromnegyedes nézet', 'belső tér'),
    specs: {
      'performance': { label: 'Q4 e-tron performance', fuel: 'Elektromos', power: '286 LE (210 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'Nagy hatótáv, erős motor', note: 'nagy akkumulátor, hátsókerék-hajtás', img: P('audi-q4-e-tron', 'g1') },
    },
    gallery: G('audi-q4-e-tron', 'Audi Q4 e-tron', [['g1', 'hegyi úton'], ['g2', 'elölnézet'], ['g3', 'menet közben'], ['g4', 'kanyarban'], ['g5', 'tengerparti úton'], ['g6', 'szerpentinen, hátulról'], ['g7', 'erdei úton'], ['g8', 'műszerfal'], ['g9', 'tó mellett']]),
    faqExtra: [
      { q: 'Otthon is tölthető az Audi Q4 e-tron?', a: 'Igen, fali töltőről (wallbox) egy éjszaka alatt feltölthető; úton DC gyorstöltőn gyorsan tölt.' },
    ],
    schema: { drive: 'RWD' },
  },

  // ---------------- Q6 e-tron ----------------
  'Audi Q6 e-tron': {
    mainImg: P('audi-q6-e-tron', 'main'), mainAlt: 'Audi Q6 e-tron quattro bérlés — elektromos prémium SUV tartós bérletben',
    overviewH2: 'Audi Q6 e-tron tartós bérlet — 800 voltos elektromos SUV quattro hajtással',
    guideIntro: 'Az <strong>Audi Q6 e-tron</strong> az Audi új generációs elektromos SUV-ja a PPE platformon: 800 voltos rendszer, 100 kWh-s akkumulátor, <strong>270 kW-os villámtöltés</strong> és 600 km feletti hatótáv (WLTP). A bérelhető <strong>Q6 e-tron quattro</strong> két villanymotorral és összkerékhajtással érkezik. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Miért a Q6 e-tron quattro?', html: 'Két villanymotor, összkerékhajtás és akár 428 LE (boost) teljesítmény: a Q6 e-tron quattro télen, utánfutóval és hosszú utakon is magabiztos. A nagy akkumulátor és a gyors töltés miatt a hosszú utazás is kényelmes.' },
      { h3: 'Q6 e-tron vagy Q4 e-tron?', html: 'A <strong>Q6 e-tron</strong> nagyobb, prémiumabb és gyorsabban tölt (800 V, 270 kW), a <a href="/berelheto-auto/audi-q4-e-tron-berles">Q4 e-tron</a> kompaktabb és kedvezőbb havidíjú. Ha gyakran utazol hosszan, a Q6 a jobb választás.' },
    ],
    ...ED('audi-q6-e-tron', 'Audi Q6 e-tron',
      { h3: 'Új generációs Audi SUV-dizájn', text: 'Osztott fényszórók, zárt Singleframe maszk, izmos kerékívek és digitális OLED hátsó lámpák — a Q6 e-tron az Audi új dizájnnyelvét hozza.', bullets: ['Osztott Matrix LED fényszórók, választható fénygrafika', 'Digitális OLED hátsó lámpák', '20–21" könnyűfém keréktárcsák'] },
      { h3: 'MMI panoráma kijelző, tágas utastér', text: 'Az ívelt MMI panoráma kijelző, az opcionális utas-kijelző és a lapos padlójú, tágas utastér prémium utazást ad. Elöl is van kisebb csomagtér (frunk).', bullets: [MMI, 'Augmented reality head-up kijelző (felszereltségtől függően)', 'Bang & Olufsen hangrendszer (felszereltségtől függően)'] },
      'hátsó háromnegyedes nézet', 'belső tér'),
    specs: {
      'quattro': { label: 'Q6 e-tron quattro', fuel: 'Elektromos', power: 'akár 428 LE (boost)', drive: 'quattro összkerék / 1 fok. automata', rec: 'Összkerékhajtás, hosszú utakra', note: 'két villanymotor, 800 V, 270 kW töltés', img: P('audi-q6-e-tron', 'g5') },
    },
    gallery: G('audi-q6-e-tron', 'Audi Q6 e-tron', [['g1', 'modern épület előtt'], ['g2', 'udvaron'], ['g3', 'fák között'], ['g4', 'elölnézet'], ['g5', 'kanyarban'], ['g6', 'menet közben, hátulról'], ['g7', 'műszerfal'], ['g8', 'két Q6 e-tron naplementében']]),
    faqExtra: [
      { q: 'Milyen gyorsan tölt az Audi Q6 e-tron?', a: 'A 800 voltos rendszernek köszönhetően DC gyorstöltőn akár 270 kW-tal tölt, így rövid megállóval is több száz km hatótáv tölthető vissza.' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- S5 Limousine ----------------
  'Audi S5 Limousine': {
    mainImg: P('audi-s5-limuzin', 'main'), mainAlt: 'Audi S5 limuzin bérlés — 367 lóerős sportlimuzin tartós bérletben',
    body: 'Limuzin',
    overviewH2: 'Audi S5 limuzin tartós bérlet — 367 LE, V6, quattro',
    guideIntro: 'Az új <strong>Audi S5</strong> limuzin (praktikus, csomagtérajtós karosszériával) az A5 család sportos csúcsa: 3.0 TFSI V6, <strong>367 LE (270 kW)</strong>, 550 Nm, quattro összkerékhajtás és 0–100 km/h 4,5 másodperc. <strong>Tartós bérletben</strong> úgy vezetheted, hogy nem kötsz le benne nagy összeget — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Audi S5 — sportautó a mindennapokra', html: 'Az S5 a teljesítményt a praktikummal ötvözi: négy ajtó, nagy csomagtérajtó, kényelmes hátsó ülések — és egy V6 motor, amely bármikor sportautós gyorsulást ad. A quattro hajtás esőben és télen is biztonságos.' },
      { h3: 'Audi S5 limuzin vagy S5 Avant?', html: 'Technikában azonosak. A <strong>limuzin</strong> sportosabb, coupé-szerű megjelenésű, az <a href="/berelheto-auto/audi-s5-avant-berles">S5 Avant</a> kombi nagyobb csomagteret és családbarátabb praktikumot kínál.' },
    ],
    ...ED('audi-s5-limuzin', 'Audi S5 limuzin',
      { h3: 'S-modell megjelenés', text: 'Egyedi S lökhárítók, négy kipufogóvég, alumínium hatású tükörházak és nagy keréktárcsák — az S5 első ránézésre is sportos, mégis elegáns.', bullets: ['S lökhárítók, négy kipufogóvég', 'Digitális OLED hátsó lámpák (felszereltségtől függően)', '19–20" keréktárcsák (felszereltségtől függően)'] },
      { h3: 'Sportos, digitális vezetőtér', text: 'S sportülések, S kormány és MMI panoráma kijelző; az utastér vezetőközpontú, mégis tágas és kényelmes hosszú úton is.', bullets: ['S sportülések, S bőrkormány', MMI, 'Bang & Olufsen hangrendszer (felszereltségtől függően)'] },
      'hátsó háromnegyedes nézet', 'vezetőtér'),
    specs: {
      'TFSI quattro S tronic': { label: 'S5 limuzin TFSI quattro', fuel: 'Benzin (V6, MHEV plus)', power: '367 LE (270 kW)', torque: '550 Nm', drive: 'quattro összkerék / 7 fok. S tronic', accel: '4,5 mp', vmax: '250 km/h', rec: 'Sportos, mégis praktikus', note: '3.0 TFSI V6, quattro', img: P('audi-s5-limuzin', 'g2') },
    },
    gallery: G('audi-s5-limuzin', 'Audi S5 limuzin', [['g1', 'menet közben'], ['g2', 'kanyarban, elölnézet'], ['g3', 'oldalnézet, tengerparton'], ['g4', 'hátulról'], ['g5', 'modern épület előtt'], ['g6', 'oldalnézet, épület előtt'], ['g7', 'esti fényben'], ['g8', 'elölnézet']]),
    faqExtra: [
      { q: 'Mennyi az Audi S5 teljesítménye?', a: 'Az új Audi S5 3.0 TFSI V6 motorja 367 lóerős (270 kW), 550 Nm nyomatékú; 0–100 km/h 4,5 mp, végsebesség 250 km/h (korlátozva).' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- A6 Sportback e-tron ----------------
  'Audi A6 Sportback e-tron': {
    mainImg: P('audi-a6-sportback-e-tron', 'main'), mainAlt: 'Audi A6 Sportback e-tron bérlés — elektromos prémium Sportback tartós bérletben',
    body: 'Sportback',
    overviewH2: 'Audi A6 Sportback e-tron tartós bérlet — elektromos Sportback, kiemelkedő hatótáv',
    guideIntro: 'Az <strong>Audi A6 Sportback e-tron</strong> az Audi egyik leghatékonyabb elektromos autója: rendkívül aerodinamikus karosszéria, 100 kWh-s akkumulátor és <strong>akár kb. 750 km hatótáv</strong> (WLTP). A bérelhető 270 kW performance változat hátsókerék-hajtású, 367 LE-s. <strong>Tartós bérletben</strong> az elektromos autó értékvesztése nem téged terhel — egyetlen havi díjat fizetsz.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk az A6 Sportback e-tront?', html: 'Sokat utazó üzletembereknek, akik elektromos autóval is hosszú távokat szeretnének megtenni kevés töltési megállóval, és akiknek fontos a reprezentatív, elegáns megjelenés.' },
      { h3: 'Gyorstöltés 270 kW-tal', html: 'A 800 voltos technikának köszönhetően DC gyorstöltőn kb. 10 perc alatt több mint 300 km hatótáv tölthető vissza; 10–80% kb. 21 perc.' },
    ],
    ...ED('audi-a6-sportback-e-tron', 'Audi A6 Sportback e-tron',
      { h3: 'A legáramvonalasabb Audi', text: 'Lejtős tetővonal, alacsony orr, osztott fényszórók és a hátul végigfutó fénysáv: a Sportback e-tron légellenállása kiemelkedően alacsony, ami a nagy hatótáv egyik titka.', bullets: ['Osztott Matrix LED fényszórók (felszereltségtől függően)', 'Digitális OLED hátsó lámpák, világító Audi-karikák', 'Virtuális külső tükrök (felszereltségtől függően)'] },
      { h3: 'Csendes, prémium utastér', text: 'Az MMI panoráma kijelző, a kiváló hangszigetelés és a lapos padló csendes, tágas, prémium utazást ad — hosszú úton is.', bullets: [MMI, 'Augmented reality head-up kijelző (felszereltségtől függően)', 'Hőszivattyú, előklimatizálás'] },
      'hátulról, havas hegyek előtt', 'utastér, kilátással a tájra'),
    specs: {
      '270 kW performance': { label: 'A6 Sportback e-tron performance', fuel: 'Elektromos', power: '367 LE (270 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'Maximális hatótáv', note: 'akár kb. 750 km hatótáv (WLTP)', img: P('audi-a6-sportback-e-tron', 'g3') },
    },
    gallery: G('audi-a6-sportback-e-tron', 'Audi A6 Sportback e-tron', [['g1', 'fjord mellett'], ['g2', 'töltés közben'], ['g3', 'kikötőben'], ['g4', 'alagútban'], ['g5', 'hegyi úton'], ['g6', 'hátsó lámpa, víz mellett']]),
    faqExtra: [
      { q: 'Mekkora az Audi A6 Sportback e-tron hatótávja?', a: 'WLTP szerint akár kb. 750 km; a valós hatótáv a sebességtől, a hőmérséklettől és a vezetési stílustól függ.' },
    ],
    schema: { drive: 'RWD' },
  },

  // ---------------- Q3 Sportback ----------------
  'Audi Q3 Sportback': {
    mainImg: P('audi-q3-sportback', 'main'), mainAlt: 'Audi Q3 Sportback bérlés — az új Q3 Sportback tartós bérletben',
    overviewH2: 'Audi Q3 Sportback tartós bérlet — kompakt prémium SUV Coupé havidíjjal',
    guideIntro: 'Az új, harmadik generációs <strong>Audi Q3 Sportback</strong> a kompakt prémium SUV-k stílusos választása: coupé-szerű tetővonal, magas üléspozíció, modern digitális utastér. A bérelhető <strong>TDI S tronic</strong> 150 lóerős dízel, alacsony fogyasztással. <strong>Tartós bérletben</strong> a legkedvezőbb havidíjú Audi SUV — egyetlen díjjal, szerviz, adó és gumik benne.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a Q3 Sportback-et?', html: 'Azoknak, akik városban is kezelhető méretű, mégis prémium és stílusos SUV-t keresnek, és sokat autóznak: a TDI dízel hosszú utakon is takarékos. Céges autónak és második családi autónak egyaránt ideális.' },
      { h3: 'Q3 Sportback vagy Q5 Sportback?', html: 'A <strong>Q3 Sportback</strong> kompaktabb és kedvezőbb havidíjú, a <a href="/berelheto-auto/audi-q5-sportback-berles">Q5 Sportback</a> nagyobb, quattro összkerékhajtású és plug-in hibridként is elérhető.' },
    ],
    ...ED('audi-q3-sportback', 'Audi Q3 Sportback',
      { h3: 'Új generáció, új arc', text: 'Az új Q3 Sportback osztott fényszórókat, nagyobb, lapos Singleframe maszkot és lejtős, coupé-szerű tetővonalat kapott. A hátsó részen végigfutó fénysáv és a világító Audi-karikák modern megjelenést adnak.', bullets: ['Osztott LED fényszórók (felszereltségtől függően)', 'Coupé-szerű tetővonal', 'Világító Audi-karikák hátul'] },
      { h3: 'Digitális vezetőtér', text: 'Nagy, ívelt kijelzőegység, kormányoszlopra szerelt váltókar és rendezett, modern középkonzol sok tárolóhellyel.', bullets: ['Ívelt digitális kijelzőegység', 'Kormányoszlopon lévő váltókar', 'Vezeték nélküli okostelefon-integráció'] },
      'hátulról, modern ház előtt', 'vezetőtér'),
    specs: {
      'TDI S tronic': { label: 'Q3 Sportback TDI', fuel: 'Dízel', power: '150 LE (110 kW)', drive: 'Elsőkerék / 7 fok. S tronic', rec: 'Takarékos, sokat autózóknak', note: 'takarékos dízel', img: P('audi-q3-sportback', 'g1') },
    },
    gallery: G('audi-q3-sportback', 'Audi Q3 Sportback', [['g1', 'elölnézet, modern épületben'], ['g2', 'hegyek között'], ['g3', 'műszerfal']]),
    faqExtra: [],
    schema: { drive: 'FWD' },
  },

  // ---------------- Q6 Sportback ----------------
  'Audi Q6 Sportback': {
    mainImg: P('audi-q6-sportback', 'main'), mainAlt: 'Audi Q6 Sportback e-tron bérlés — elektromos SUV Coupé tartós bérletben',
    overviewH2: 'Audi Q6 Sportback e-tron tartós bérlet — elektromos SUV Coupé havidíjjal',
    guideIntro: 'Az <strong>Audi Q6 Sportback e-tron</strong> a Q6 e-tron lejtős tetővonalú, áramvonalasabb változata: 800 voltos PPE platform, villámtöltés és a jobb aerodinamika miatt kiváló hatótáv. A bérelhető <strong>e-tron performance</strong> 306 lóerős (225 kW), hátsókerék-hajtású. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, az akkumulátor és az értékvesztés kockázata nem téged terhel.',
    guideBlocks: [
      { h3: 'Q6 Sportback vagy Q6 e-tron SUV?', html: 'Technikában közeli rokonok. A <strong>Sportback</strong> coupé-szerű tetővonala sportosabb megjelenést és jobb aerodinamikát ad, a <a href="/berelheto-auto/audi-q6-e-tron-berles">Q6 e-tron SUV</a> valamivel nagyobb fejteret és csomagteret kínál.' },
    ],
    ...ED('audi-q6-sportback', 'Audi Q6 Sportback e-tron',
      { h3: 'Sportos, áramvonalas sziluett', text: 'Lejtős tetővonal, osztott fényszórók és digitális OLED hátsó lámpák — a Q6 Sportback e-tron az Audi elektromos dizájnjának egyik legszebb példája.', bullets: ['Osztott Matrix LED fényszórók (felszereltségtől függően)', 'Digitális OLED hátsó lámpák', 'Coupé-szerű tetővonal, jobb aerodinamika'] },
      { h3: 'MMI panoráma kijelző', text: 'Ívelt MMI panoráma kijelző, opcionális utas-kijelző, lapos padló és tágas utastér — elöl kisebb csomagtérrel (frunk).', bullets: [MMI, 'Augmented reality head-up kijelző (felszereltségtől függően)', 'Hőszivattyú, előklimatizálás'] },
      'hátsó háromnegyedes nézet', 'belső tér'),
    specs: {
      'e-tron performance': { label: 'Q6 Sportback e-tron performance', fuel: 'Elektromos', power: '306 LE (225 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'Hatékony, nagy hatótáv', note: '800 V, hátsókerék-hajtás', img: P('audi-q6-sportback', 'g1') },
    },
    gallery: G('audi-q6-sportback', 'Audi Q6 Sportback e-tron', [['g1', 'kék színben, tengerparti úton'], ['g2', 'töltőállomásnál'], ['g3', 'oldalnézet'], ['g4', 'elölnézet'], ['g5', 'menet közben, hátulról'], ['g6', 'városi háttérrel'], ['g7', 'tengerparton'], ['g8', 'vezetőtér']]),
    faqExtra: [],
    schema: { drive: 'RWD' },
  },

  // ---------------- S5 Avant ----------------
  'Audi S5 Avant': {
    mainImg: P('audi-s5-avant', 'main'), mainAlt: 'Audi S5 Avant bérlés — 367 lóerős sportkombi tartós bérletben',
    body: 'Kombi',
    overviewH2: 'Audi S5 Avant tartós bérlet — 367 LE-s sportkombi quattro hajtással',
    guideIntro: 'Az új <strong>Audi S5 Avant</strong> a sportkombik klasszikusa: 3.0 TFSI V6, <strong>367 LE (270 kW)</strong>, 550 Nm, quattro összkerékhajtás — és egy családi kombi csomagtere. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk az S5 Avant-ot?', html: 'Azoknak, akik egyetlen autóban szeretnék a sportautó teljesítményét és a kombi praktikumát: a hétköznapi családi használatra és a hosszú, gyors autópályás utakra egyaránt ideális.' },
      { h3: 'S5 Avant vagy S5 limuzin?', html: 'Technikában azonosak; az Avant nagyobb, jobban kihasználható csomagteret ad, a <a href="/berelheto-auto/audi-s5-limuzin-berles">S5 limuzin</a> sportosabb sziluettet.' },
    ],
    ...ED('audi-s5-avant', 'Audi S5 Avant',
      { h3: 'Sportos Avant-forma', text: 'S lökhárítók, négy kipufogóvég, alumínium hatású tükörházak és nagy keréktárcsák teszik egyedivé; a lejtős D-oszlop és a hosszú tetővonal elegáns kombiarányokat ad.', bullets: ['S lökhárítók, négy kipufogóvég', 'Digitális OLED hátsó lámpák (felszereltségtől függően)', 'Elektromos csomagtérajtó, tetősínek'] },
      { h3: 'Sportos, prémium utastér', text: 'S sportülések (opcionálisan bordó bőrrel), S kormány és MMI panoráma kijelző — sportos, mégis kényelmes utastér a hosszú utakhoz is.', bullets: ['S sportülések, S bőrkormány', MMI, 'Bang & Olufsen hangrendszer (felszereltségtől függően)'] },
      'hátsó háromnegyedes nézet', 'vezetőtér, bordó bőrülésekkel'),
    specs: {
      'TFSI quattro S tronic': { label: 'S5 Avant TFSI quattro', fuel: 'Benzin (V6, MHEV plus)', power: '367 LE (270 kW)', torque: '550 Nm', drive: 'quattro összkerék / 7 fok. S tronic', vmax: '250 km/h', rec: 'Sportkombi a családnak', note: '3.0 TFSI V6, quattro', img: P('audi-s5-avant', 'g2') },
    },
    gallery: G('audi-s5-avant', 'Audi S5 Avant', [['g1', 'hátulról, menet közben'], ['g2', 'elölnézet, erdei úton'], ['g3', 'kanyarban'], ['g4', 'oldalnézet'], ['g5', 'elölnézet, naplementében'], ['g6', 'havas úton'], ['g7', 'S5 modellcsalád']]),
    faqExtra: [
      { q: 'Mennyi az Audi S5 Avant teljesítménye?', a: 'Az S5 Avant 3.0 TFSI V6 motorja 367 lóerős (270 kW), 550 Nm nyomatékú, quattro összkerékhajtással.' },
    ],
    schema: { drive: 'AWD' },
  },
};
