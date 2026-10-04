// Modellre szabott bérlési tartalom (SEO-szöveg, műszaki adatok változatonként, sajtófotók).
// Kulcs: a Choice-modell kulcsa (márka + modell, pl. 'BMW X1', 'VW Tiguan', 'Audi A6 Avant').
// Minden mező opcionális — ami hiányzik, azt a rentalPage.ts az élő Choice-adatból pótolja.
// A számokat (ár, km, futamidő, kaució, darabszám) SOHA ne írd ide kézzel: azok a napi szinkronból jönnek.
// Sajtófotók: /berles-press/<modell>-<kulcs>.webp (gyártói sajtóoldalakról, 1200×900).
import type { RentalContent } from './rentalPage';
import { carModels } from './carModels';
import { MINI } from './rentalMini';
import { AUDI } from './rentalAudi';
import { VW } from './rentalVW';
import { MERCEDES } from './rentalMercedes';
import { OTHERS } from './rentalOthers';

const P = (m: string, k: string) => `/berles-press/${m}-${k}.webp`;
const G = (m: string, name: string, items: [string, string][]) => items.map(([k, alt]) => ({ img: P(m, k), alt: `${name} ${alt}` }));
const fromEgyedi = (key: string) => (carModels as any)[key] || {};
const dq = (s: string) => String(s || '').replace(/&quot;/g, '"');

// ---------- BMW ----------
const x5 = fromEgyedi('x5-dizel');
const x6 = fromEgyedi('x6-dizel');
const b1 = fromEgyedi('1erb-benzin');
const b2at = fromEgyedi('2eratb-benzin');

export const CONTENT: Record<string, RentalContent> = {
  'BMW X1': {
    mainImg: P('bmw-x1', 'main'), mainAlt: 'BMW X1 bérlés — vadonatúj kompakt prémium SUV tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4',
    overviewH2: 'BMW X1 tartós bérlet — a legkeresettebb kompakt prémium SUV havidíjjal',
    guideIntro: 'A <strong>BMW X1</strong> a márka belépő SUV-ja, és Magyarországon is az egyik legnépszerűbb prémium modell: magas üléspozíció, tágas utastér és 540 literes csomagtartó egy városban is könnyen kezelhető, 4,5 méteres karosszériában. <strong>Tartós bérletben</strong> nem kell önerőt letenned és nem kell a továbbeladással foglalkoznod — egyetlen <strong>havi díjat</strong> fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a BMW X1 bérlését?', html: 'Az X1 ideális választás, ha egy prémium SUV kényelmét szeretnéd városi méretekkel: családoknak, akik a hétvégi utakra is tágas csomagteret keresnek, és cégeknek, akik reprezentatív, mégis gazdaságos flottaautót szeretnének. A <strong>sDrive18d</strong> dízel a sokat autózóknak, az <strong>sDrive20i</strong> mild-hybrid benzines a vegyes használatra, az <strong>M35i xDrive</strong> pedig a sportos vezetést kedvelőknek szól.' },
      { h3: 'BMW X1 méretek és csomagtér', html: 'Hossz 4500 mm, szélesség 1845 mm, magasság 1642 mm, tengelytáv 2692 mm. A csomagtartó 540 literes, a hátsó ülések döntésével akár 1600 literre bővíthető — a babakocsi, a sporteszközök és a nyaralós bőröndök is kényelmesen elférnek.' },
    ],
    design: { h3: 'Magabiztos SUV-forma, kompakt méretek', text: 'A harmadik generációs X1 szögletesebb, erőteljesebb megjelenést kapott: függőleges veserács, keskeny LED-fényszórók, markáns kerékívek és egyenes tetővonal. Az M Sport kivitel sportosabb lökhárítókat és nagyobb keréktárcsákat ad.', bullets: ['Adaptív LED fényszórók, markáns veserács', '18–20" könnyűfém keréktárcsák, M Sport kivitel', 'Elektromos csomagtérajtó, tetősínek'], img: P('bmw-x1', 'design'), alt: 'BMW X1 hátulról, menet közben' },
    interior: { h3: 'BMW Curved Display, tágas utastér', text: 'Az X1 utasterét a 10,25"-os digitális műszerfalból és a 10,7"-os érintőképernyőből álló BMW Curved Display uralja, a lebegő könyöktámasz alatt praktikus tárolóhellyel. Elöl és hátul is bőséges a hely, a hátsó üléssor 40:20:40 arányban dönthető.', bullets: ['BMW Curved Display, iDrive 9', 'Vezeték nélküli Apple CarPlay / Android Auto', 'Ülésfűtés, háromzónás klíma (felszereltségtől függően)'], img: P('bmw-x1', 'interior'), alt: 'BMW X1 belső tér — BMW Curved Display és M kormány' },
    boot: '540–1600 liter',
    specs: {
      'sDrive18i': { fuel: 'Benzin', power: '136 LE (100 kW)', torque: '230 Nm', drive: 'Elsőkerék / 7 fok. Steptronic', accel: '9,2 mp', vmax: '208 km/h', rec: 'Takarékos, városi használatra', note: 'háromhengeres benzines, városba ideális', img: P('bmw-x1', 'g4') },
      'sDrive18d': { fuel: 'Dízel', power: '150 LE (110 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. Steptronic', accel: '8,9 mp', vmax: '210 km/h', rec: 'Sokat autózóknak, hosszú utakra', note: 'takarékos dízel a sokat autózóknak', img: P('bmw-x1', 'g2') },
      'sDrive20i': { fuel: 'Benzin (mild-hybrid)', power: '170 LE (125 kW)', torque: '240 Nm', drive: 'Elsőkerék / 7 fok. Steptronic', accel: '8,3 mp', vmax: '216 km/h', rec: 'Kiegyensúlyozott, vegyes használatra', note: 'mild-hybrid benzines, kiegyensúlyozott választás', img: P('bmw-x1', 'g1') },
      'M35i xDrive': { fuel: 'Benzin', power: '300 LE (221 kW)', torque: '400 Nm', drive: 'xDrive összkerék / 7 fok. Steptronic', accel: '5,4 mp', vmax: '250 km/h', rec: 'Sportos vezetéshez', note: 'az M Performance csúcsmodell, összkerékhajtással', img: P('bmw-x1', 'v1') },
    },
    gallery: G('bmw-x1', 'BMW X1', [['g1', 'szürke színben, hegyi úton'], ['g2', 'Utah narancs színben'], ['g3', 'naplementében, elölnézet'], ['g4', 'menet közben, elölnézet'], ['g5', 'hátulról'], ['g6', 'veserács és LED fényszóró'], ['g8', 'hátsó ülések'], ['g9', 'M sportkormány']]),
    faqExtra: [
      { q: 'Mekkora a BMW X1 csomagtartója?', a: 'A BMW X1 csomagtartója 540 literes, a hátsó ülések döntésével akár 1600 literre bővíthető.' },
      { q: 'Van összkerékhajtású BMW X1 bérelhető?', a: 'Igen, az M35i xDrive összkerékhajtású; az sDrive változatok elsőkerék-hajtásúak, ami a városi és országúti használathoz takarékosabb.' },
    ],
    schema: { drive: 'FWD / AWD', doors: 5 },
  },

  'BMW X2': {
    mainImg: P('bmw-x2', 'main'), mainAlt: 'BMW X2 bérlés — sportos SUV Coupé tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4',
    overviewH2: 'BMW X2 tartós bérlet — sportos SUV Coupé havidíjjal',
    guideIntro: 'Az új <strong>BMW X2</strong> az X1 technikájára épülő, lecsapott tetővonalú <strong>SUV Coupé</strong>: feltűnő, sportos megjelenés, ugyanakkor 560 literes csomagtartó és kényelmes, magas üléspozíció. <strong>Tartós bérletben</strong> úgy vezetheted, hogy nem kötöd le a pénzed egy autóban — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'BMW X2 vagy BMW X1?', html: 'Műszakilag a két modell közeli rokon, a különbség a karakterben van: az <strong>X2</strong> alacsonyabb, coupé-szerű tetővonallal és sportosabb arányokkal érkezik, az <strong>X1</strong> szögletesebb és valamivel térbarátabb. Ha a megjelenés és a vezetési élmény a fontosabb, az X2 a jobb választás — a csomagtartója így is 560 literes.' },
      { h3: 'BMW X2 méretek és csomagtér', html: 'Hossz 4554 mm, szélesség 1845 mm, magasság 1590 mm, tengelytáv 2692 mm. A csomagtér 560 liter, a hátsó ülések döntésével 1470 literig bővíthető.' },
    ],
    design: { h3: 'Coupé-sziluett, SUV-magabiztosság', text: 'Az X2 második generációja hosszabb és laposabb lett: lecsapott tetővonal, négy kipufogóvéggel (M35i), keskeny hátsó lámpák és a BMW Iconic Glow világító veserács-keret teszik egyedivé.', bullets: ['Lecsapott, coupé-szerű tetővonal', 'Iconic Glow veserács-keret (felszereltségtől függően)', '19–21" könnyűfém keréktárcsák'], img: P('bmw-x2', 'design'), alt: 'BMW X2 hátsó nézet, X2 felirat' },
    interior: { h3: 'Digitális vezetőtér, prémium anyagok', text: 'A BMW Curved Display, a lebegő középkonzol és a sportülések vezetőközpontú utasteret adnak. A hátsó ülések kényelmesen két felnőttnek is elegendő helyet kínálnak, a csomagtér pedig a mindennapokra és a hosszabb utakra is bőven elég.', bullets: ['BMW Curved Display, iDrive 9', 'Sportülések, M bőrkormány', 'Vezeték nélküli okostelefon-integráció'], img: P('bmw-x2', 'interior'), alt: 'BMW X2 belső tér — BMW Curved Display' },
    boot: '560–1470 liter',
    specs: {
      'sDrive18d': { fuel: 'Dízel', power: '150 LE (110 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. Steptronic', vmax: '211 km/h', rec: 'Takarékos dízel', note: 'takarékos dízel a sokat autózóknak', img: P('bmw-x2', 'g2') },
      'sDrive20i': { fuel: 'Benzin (mild-hybrid)', power: '170 LE (125 kW)', torque: '240 Nm', drive: 'Elsőkerék / 7 fok. Steptronic', vmax: '220 km/h', rec: 'Kiegyensúlyozott benzines', note: 'mild-hybrid benzines, kiegyensúlyozott választás', img: P('bmw-x2', 'g1') },
      'sDrive20d': { fuel: 'Dízel (mild-hybrid)', power: '163 LE (120 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. Steptronic', rec: 'Erősebb dízel', note: 'erősebb mild-hybrid dízel', img: P('bmw-x2', 'g3') },
      'M35i xDrive': { fuel: 'Benzin', power: '300 LE (221 kW)', torque: '400 Nm', drive: 'xDrive összkerék / 7 fok. Steptronic', accel: '5,4 mp', vmax: '250 km/h', rec: 'Sportos csúcsmodell', note: 'az M Performance csúcsmodell, összkerékhajtással', img: P('bmw-x2', 'v1') },
    },
    gallery: G('bmw-x2', 'BMW X2', [['g1', 'zöld színben, elölnézet'], ['g2', 'tengerparton'], ['g3', 'menet közben'], ['g4', 'hátsó háromnegyedes nézet'], ['g5', 'LED fényszóró'], ['g6', 'csomagtartó'], ['g7', 'BMW Curved Display'], ['g8', 'hátsó ülések']]),
    faqExtra: [
      { q: 'Mekkora a BMW X2 csomagtartója?', a: 'A BMW X2 csomagtartója 560 literes, a hátsó ülések döntésével 1470 literre bővíthető.' },
    ],
  },

  'BMW X5': {
    mainImg: P('bmw-x5', 'g5'), mainAlt: 'BMW X5 bérlés — nagy prémium SUV tartós bérletben',
    heroVideo: '', heroPoster: P('bmw-x5', 'hero'), // a régi (G05) X5 bérelhető — sajtófotók: BMW PressClub, X5 M Competition „On location dynamic” (08/23)
    overviewH2: 'BMW X5 tartós bérlet — a nagy prémium SUV havidíjjal',
    guideIntro: 'A <strong>BMW X5</strong> a nagy prémium SUV-k mércéje: tágas, kifinomult, hosszú utakon is kivételesen kényelmes, ugyanakkor meglepően dinamikus. <strong>Tartós bérletben</strong> úgy vezetheted, hogy a jelentős vételár és az értékvesztés kockázata nem téged terhel — egyetlen <strong>havi díjat</strong> fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Miért a BMW X5 xDrive30d?', html: 'A hathengeres <strong>xDrive30d</strong> dízel az X5 legkedveltebb változata: nagy nyomatékú, takarékos, és utánfutóval is magabiztos (akár 3,5 tonna vontatható tömeg). Az xDrive összkerékhajtás télen és rossz útviszonyok között is biztonságot ad — ideális céges és családi autónak egyaránt.' },
      { h3: 'BMW X5 méretek és csomagtér', html: 'Hossz 4935 mm, szélesség 2004 mm, magasság 1765 mm, tengelytáv 2975 mm. A csomagtartó 650 literes, a hátsó ülések döntésével akár 1870 literre bővíthető.' },
    ],
    design: x5.design ? { ...x5.design, img: P('bmw-x5', 'g6'), alt: 'BMW X5 oldalról — markáns SUV-forma, M Sport kivitel', bullets: ['Opcionálisan világító BMW Iconic Glow veserács', 'Adaptív LED / Matrix fényszórók', '20–22" könnyűfém keréktárcsák, M Sport csomag'], text: 'Az X5 markáns, mégis elegáns: nagy, választhatóan világító veserács, keskeny fényszóró-grafika és tiszta oldalfelületek. Az M Sport kivitel sportosabb lökhárítókkal és nagyobb keréktárcsákkal érkezik.' } : undefined,
    interior: x5.interior ? { ...x5.interior, img: undefined, alt: undefined, h3: 'BMW Curved Display, tágas prémium utastér', text: 'Az X5 utastere a hosszú utakra készült: BMW Curved Display, kiváló hangszigetelés, kényelmes ülések és hatalmas csomagtér. A bőséges hátsó lábtér és a széles ajtónyílás a családi használatot is kényelmessé teszi.', bullets: ['BMW Curved Display, iDrive', 'Prémium ülések, négyzónás klíma (felszereltségtől függően)', 'Vezeték nélküli Apple CarPlay / Android Auto'] } : undefined,
    boot: '650–1870 liter',
    specs: { 'xDrive30d': { fuel: 'Dízel (mild-hybrid, 6 henger)', power: '298 LE (219 kW)', torque: '670 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', accel: '6,1 mp', vmax: '230 km/h', rec: 'Nagy nyomaték, takarékos hosszú utakra', note: 'hathengeres dízel, xDrive összkerékhajtással', img: '/berles/bmw-x5.webp' } },
    gallery: G('bmw-x5', 'BMW X5', [['g1', 'elölről, menet közben'], ['g2', 'oldalnézet, dinamikus'], ['g3', 'vidéki úton'], ['g4', 'naplementében'], ['g5', 'első háromnegyed nézet'], ['g6', 'oldalról'], ['g7', 'hátsó háromnegyed nézet, menet közben'], ['g8', 'országúton, alkonyatkor'], ['g9', 'hátulról'], ['g10', 'hátsó háromnegyed nézet']]),
    egyediSlug: 'x5-dizel',
    faqExtra: [
      { q: 'Mekkora a BMW X5 csomagtartója?', a: 'A BMW X5 csomagtartója 650 literes, a hátsó ülések döntésével akár 1870 literre bővíthető.' },
      { q: 'Húzhatok utánfutót a bérelt BMW X5-tel?', a: 'Az X5 xDrive30d akár 3500 kg vontatására alkalmas, ha az autó vonóhoroggal szerelt. A konkrét autó felszereltségét az ajánlatban jelezzük.' },
    ],
  },

  'BMW X6': {
    mainImg: x6.mainImg, mainAlt: 'BMW X6 bérlés — sportos SUV Coupé tartós bérletben',
    heroVideo: x6.heroVideo || '/caradvance-hero-x5.mp4', heroPoster: x6.heroPoster,
    overviewH2: 'BMW X6 tartós bérlet — az ikonikus SUV Coupé havidíjjal',
    guideIntro: 'A <strong>BMW X6</strong> az SUV Coupé kategória megalkotója: az X5 technikája, sportosabb, lecsapott tetővonallal és feltűnő megjelenéssel. <strong>Tartós bérletben</strong> úgy vezetheted, hogy nem kell a magas vételárral és az értékvesztéssel foglalkoznod — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'BMW X6 xDrive30d M Sport', html: 'A bérelhető <strong>X6 xDrive30d M Sport</strong> a hathengeres dízelt és az M Sport csomag sportos külsejét és futóművét párosítja: nagy nyomaték, takarékos üzem és összkerékhajtás — a coupé-sziluett mellé.' },
      { h3: 'BMW X6 vagy BMW X5?', html: 'Az <strong>X5</strong> a praktikusabb, nagyobb csomagterű és magasabb belterű választás, az <strong>X6</strong> pedig a sportosabb, dinamikusabb megjelenésű. Mindkettő bérelhető nálunk — a kártyákon a pillanatnyi elérhetőséget is látod.' },
    ],
    design: x6.design ? { ...x6.design, text: 'Az X6 hosszú motorháztetővel, lecsapott tetővonallal és izmos hátsó résszel sportosabb, mint az X5. A választhatóan világító veserács és a keskeny fényszóró-grafika markáns arcot ad; az M Sport csomag még hangsúlyosabbá teszi a karaktert.', bullets: (x6.design.bullets || []).map(dq) } : undefined,
    interior: x6.interior ? { ...x6.interior, text: dq(x6.interior.text), bullets: (x6.interior.bullets || []).map(dq) } : undefined,
    boot: '580–1530 liter',
    specs: { 'xDrive30d M Sport': { fuel: 'Dízel (mild-hybrid, 6 henger)', power: '298 LE (219 kW)', torque: '670 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', accel: '6,0 mp', vmax: '230 km/h', rec: 'Sportos, mégis takarékos', note: 'hathengeres dízel M Sport csomaggal', img: (x6.gallery && x6.gallery[1] && x6.gallery[1].img) || x6.mainImg } },
    gallery: (x6.gallery || []).slice(0, 8),
    egyediSlug: 'x6-dizel',
    faqExtra: [ { q: 'Mekkora a BMW X6 csomagtartója?', a: 'A BMW X6 csomagtartója 580 literes, a hátsó ülések döntésével 1530 literre bővíthető.' } ],
  },

  'BMW 1er': {
    mainImg: b1.mainImg, mainAlt: 'BMW 1-es bérlés — kompakt prémium autó tartós bérletben',
    heroVideo: b1.heroVideo, heroPoster: b1.heroPoster, body: 'Kompakt',
    overviewH2: 'BMW 1-es tartós bérlet — prémium kompakt havidíjjal',
    guideIntro: 'A <strong>BMW 1-es</strong> (1 Series) a márka belépő modellje: kompakt méretek, prémium minőség és sportos vezetési élmény. Városban könnyen parkolható, autópályán stabil és csendes. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'BMW 120 vagy 120d?', html: 'A <strong>120</strong> mild-hybrid benzines (170 LE) a vegyes, városi és országúti használatra ideális, a <strong>120d</strong> dízel (163 LE, 360 Nm) pedig a sokat autózóknak: hosszú utakon kiemelkedően takarékos.' },
    ],
    design: b1.design ? { ...b1.design, text: 'A BMW 1-es önmagáért beszél: markáns veserács, letisztult vonalvezetés és minőségi anyaghasználat. Az M Sport csomaggal a kompakt még sportosabb karaktert kap.', bullets: (b1.design.bullets || []).map(dq) } : undefined,
    interior: b1.interior ? { ...b1.interior, bullets: (b1.interior.bullets || []).map(dq) } : undefined,
    specs: {
      '120': { fuel: 'Benzin (mild-hybrid)', power: '170 LE (125 kW)', torque: '240 Nm', drive: 'Elsőkerék / 7 fok. DKG', accel: '8,3 mp', vmax: '216 km/h', boot: '300 liter', rec: 'Sportos, dinamikus', note: 'mild-hybrid benzines', img: '/bmw/bmw-120-elolnezet.webp' },
      '120d': { fuel: 'Dízel (mild-hybrid)', power: '163 LE (120 kW)', torque: '360 Nm', drive: 'Elsőkerék / 7 fok. DKG', accel: '8,6 mp', vmax: '225 km/h', boot: '300 liter', rec: 'Sokat autózóknak, takarékos', note: 'takarékos dízel', img: '/bmw/bmw-120d-elolnezet.webp' },
    },
    gallery: (b1.gallery || []).slice(0, 8),
    egyediSlug: '1erb-benzin',
  },

  'BMW 2er Active Tourer': {
    mainImg: b2at.mainImg, mainAlt: 'BMW 2-es Active Tourer bérlés — tágas prémium egyterű tartós bérletben',
    heroVideo: b2at.heroVideo, heroPoster: b2at.heroPoster, body: 'Egyterű',
    overviewH2: 'BMW 2-es Active Tourer tartós bérlet — a családbarát prémium egyterű',
    guideIntro: 'A <strong>BMW 2-es Active Tourer</strong> a prémium kompakt egyterű: magas üléspozíció, eltolható hátsó üléssor és 470 literes csomagtér, BMW minőségben. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük — a családi autózás így kiszámítható és gondtalan.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a 2-es Active Tourert?', html: 'Kisgyermekes családoknak, akik könnyű be- és kiszállást, gyerekülésbarát hátsó üléseket és nagy csomagteret keresnek, és mindazoknak, akik egy kompakt autó méreteiben szeretnének egyterű praktikumot. A <strong>218i</strong> takarékos háromhengeres benzinmotorral és 7 fokozatú duplakuplungos váltóval érkezik.' },
    ],
    design: b2at.design ? { ...b2at.design, text: 'A 2-es Active Tourer magabiztos, modern megjelenésű: markáns veserács, letisztult vonalvezetés és minőségi anyaghasználat — praktikus egyterű formában.', bullets: (b2at.design.bullets || []).map(dq) } : undefined,
    interior: b2at.interior ? { ...b2at.interior, bullets: (b2at.interior.bullets || []).map(dq) } : undefined,
    boot: '470–1455 liter',
    specs: { '218i': { fuel: 'Benzin', power: '136 LE (100 kW)', torque: '230 Nm', drive: 'Elsőkerék / 7 fok. DKG', accel: '9,5 mp', vmax: '208 km/h', rec: 'Takarékos családi autó', note: 'takarékos háromhengeres benzines', img: '/bmw/bmw-218i-active-tourer-elolnezet.webp' } },
    gallery: (b2at.gallery || []).slice(0, 8),
    egyediSlug: '2eratb-benzin',
    faqExtra: [ { q: 'Mekkora a BMW 2-es Active Tourer csomagtartója?', a: 'A csomagtér 470 literes, az eltolható és dönthető hátsó ülésekkel akár 1455 literre bővíthető.' } ],
  },

  'BMW 3er Limousine': {
    mainImg: P('bmw-3-as-limuzin', 'main'), mainAlt: 'BMW 3-as limuzin bérlés — a sportos középkategóriás limuzin tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4',
    overviewH2: 'BMW 3-as limuzin tartós bérlet — a sportlimuzin havidíjjal',
    guideIntro: 'A <strong>BMW 3-as</strong> (3 Series) évtizedek óta a sportos középkategóriás limuzinok mércéje: kiegyensúlyozott hátsókerék-hajtás, precíz kormányzás és prémium utastér. <strong>Tartós bérletben</strong> úgy vezetheted, hogy nem kötsz le benne nagy összeget — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: '318i vagy 320i?', html: 'A <strong>318i</strong> kiegyensúlyozott, takarékos választás a mindennapokra, a <strong>320i</strong> pedig erősebb, dinamikusabb négyhengeres benzinmotorral érkezik. Mindkettő hátsókerék-hajtású, 8 fokozatú Steptronic automatával — pontosan azzal a vezetési élménnyel, amiért a 3-ast szeretik.' },
      { h3: 'BMW 3-as limuzin méretek és csomagtér', html: 'Hossz kb. 4713 mm, szélesség 1827 mm, magasság 1440 mm, tengelytáv 2851 mm. A csomagtartó 480 literes.' },
    ],
    design: { h3: 'Sportos arányok, letisztult elegancia', text: 'A 3-as limuzin hosszú motorháztetője, rövid túlnyúlásai és a hátsókerék-hajtás arányai sportos karaktert adnak. A frissített modell keskenyebb fényszórókat, átrajzolt lökhárítókat és modernebb hátsó lámpákat kapott.', bullets: ['Adaptív LED fényszórók', 'M Sport kivitel, 18–19" keréktárcsák', 'Hátsókerék-hajtás, kiegyensúlyozott súlyelosztás'], img: P('bmw-3-as-limuzin', 'design'), alt: 'BMW 3-as limuzin, oldalnézet' },
    interior: { h3: 'BMW Curved Display, vezetőközpontú utastér', text: 'A 3-as utastere a vezetőt helyezi a középpontba: ívelt BMW Curved Display, sportülések, minőségi anyagok és letisztult kezelőfelület. A hátsó üléseken is kényelmes a hely, a csomagtér pedig a hosszabb utakra is elegendő.', bullets: ['BMW Curved Display, iDrive', 'Sportülések, M bőrkormány', 'Vezeték nélküli Apple CarPlay / Android Auto'], img: P('bmw-3-as-limuzin', 'interior'), alt: 'BMW 3-as belső tér — BMW Curved Display' },
    boot: '480 liter', drive: 'Hátsókerék / 8 fok. Steptronic',
    specs: {
      '318i': { fuel: 'Benzin', power: '156 LE (115 kW)', torque: '250 Nm', accel: '8,4 mp', vmax: '223 km/h', rec: 'Takarékos, kiegyensúlyozott', note: 'takarékos négyhengeres benzines', img: P('bmw-3-as-limuzin', 'g1') },
      '320i': { fuel: 'Benzin', power: '184 LE (135 kW)', torque: '300 Nm', accel: '7,4 mp', vmax: '235 km/h', rec: 'Dinamikusabb benzines', note: 'erősebb, dinamikus benzines', img: P('bmw-3-as-limuzin', 'v1') },
    },
    gallery: G('bmw-3-as-limuzin', 'BMW 3-as limuzin', [['g1', 'menet közben, elölnézet'], ['g2', 'hegyi úton'], ['g3', 'naplementében'], ['g4', 'oldalnézet'], ['g5', 'elölnézet háromnegyedből'], ['g6', 'keréktárcsa és féknyereg'], ['g7', 'vezetőtér'], ['g8', 'középkonzol']]),
    faqExtra: [ { q: 'Mekkora a BMW 3-as limuzin csomagtartója?', a: 'A BMW 3-as limuzin csomagtartója 480 literes.' } ],
  },

  'BMW 4er Coupe': {
    mainImg: P('bmw-4-es-coupe', 'main'), mainAlt: 'BMW 4-es Coupé bérlés — sportos kupé tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4',
    overviewH2: 'BMW 4-es Coupé tartós bérlet — sportos kupé havidíjjal',
    guideIntro: 'A <strong>BMW 4-es Coupé</strong> a klasszikus, kétajtós sportkupé: alacsony, széles sziluett, a jellegzetes függőleges veserács és hátsókerék-hajtás. <strong>Tartós bérletben</strong> úgy élvezheted a kupé-életérzést, hogy nem kell a vételárral és a továbbeladással foglalkoznod.',
    guideBlocks: [ { h3: 'BMW 420i Coupé', html: 'A bérelhető <strong>420i</strong> négyhengeres benzinmotorral és 8 fokozatú Steptronic automatával érkezik: kulturált, mégis dinamikus — a mindennapi használatra és a hétvégi kanyargós utakra egyaránt.' } ],
    design: { h3: 'Alacsony sziluett, markáns arc', text: 'A 4-es Coupé széles nyomtávja, lecsapott tetővonala és a nagy, függőleges veserács azonnal felismerhetővé teszi. A frissített modell keskenyebb fényszórókat és átrajzolt hátsó lámpákat kapott.', bullets: ['Függőleges BMW veserács', 'Adaptív LED fényszórók', 'M Sport kivitel, 18–19" keréktárcsák'], img: P('bmw-4-es-coupe', 'design'), alt: 'BMW 4-es Coupé és Cabrio' },
    interior: { h3: 'Sportos, digitális utastér', text: 'A BMW Curved Display, a sportülések és a vezetőre fordított kezelőfelület teszik teljessé a kupé-élményt. Elöl bőséges a hely, hátul alkalmi utasoknak kényelmes, a csomagtér 440 literes.', bullets: ['BMW Curved Display', 'Sportülések, M bőrkormány', 'Vezeték nélküli okostelefon-integráció'], img: P('bmw-4-es-coupe', 'interior'), alt: 'BMW 4-es Coupé belső tér' },
    boot: '440 liter', drive: 'Hátsókerék / 8 fok. Steptronic',
    specs: { '420i': { fuel: 'Benzin', power: '184 LE (135 kW)', torque: '300 Nm', accel: '7,5 mp', vmax: '240 km/h', rec: 'Kulturált, dinamikus kupé', note: 'négyhengeres benzines', img: P('bmw-4-es-coupe', 'g1') } },
    gallery: G('bmw-4-es-coupe', 'BMW 4-es Coupé', [['g1', 'piros színben, Alpokban'], ['g2', 'stúdiófotó'], ['g3', 'fehér színben, pályán'], ['g4', 'kék színben, hegyi úton'], ['g5', 'elölnézet, hegyek között'], ['g6', 'hátsó háromnegyedes nézet'], ['g7', 'oldalnézet'], ['g8', 'LED fényszóró'], ['g9', 'hátulról, hegyek előtt'], ['g10', 'kék színben, mezőn']]),
  },

  'BMW 4er Cabrio': {
    mainImg: P('bmw-4-es-cabrio', 'main'), mainAlt: 'BMW 4-es Cabrio bérlés — négyüléses kabrió tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4', body: 'Kabrió',
    overviewH2: 'BMW 4-es Cabrio tartós bérlet — nyitott autózás havidíjjal',
    guideIntro: 'A <strong>BMW 4-es Cabrio</strong> négyüléses, textiltetős kabrió: nyitott tetővel igazi élmény, zárt tetővel csendes, kényelmes négyévszakos autó. <strong>Tartós bérletben</strong> akár csak a tavaszi–nyári szezonra is a tiéd lehet — egyetlen havi díjjal, szerviz, adó és gumik nélküli gondokkal.',
    guideBlocks: [
      { h3: '420i vagy M440i xDrive?', html: 'A <strong>420i</strong> kulturált négyhengeres benzines a nyugodt nyitott autózáshoz, az <strong>M440i xDrive</strong> pedig 374 lóerős hathengeres M Performance modell összkerékhajtással — a sportos kabrióélmény csúcsa.' },
      { h3: 'Mennyi idő alatt nyílik a tető?', html: 'A textiltető kb. 18 másodperc alatt nyílik vagy zárul, 50 km/h sebességig menet közben is. Zárt tetővel a hangszigetelés és a kényelem a kupéhoz közelít.' },
    ],
    design: { h3: 'Elegáns kabrió-sziluett', text: 'A 4-es Cabrio hosszú motorháztetővel, alacsony derékvonallal és textiltetővel elegáns, időtlen formát kapott. A frissített modell keskeny fényszórókkal és új hátsó lámpákkal érkezik.', bullets: ['Elektromos textiltető, menet közben is nyitható', 'Adaptív LED fényszórók', 'M Sport kivitel, 18–19" keréktárcsák'], img: P('bmw-4-es-cabrio', 'design'), alt: 'BMW 4-es Cabrio, hátsó nézet' },
    interior: { h3: 'Négy ülés, prémium kényelem', text: 'A BMW Curved Display, a prémium bőrülések és a légterelő teszik kényelmessé a nyitott autózást; nyakfűtés (Air Collar) felszereltségtől függően. Négy felnőtt is elfér, a csomagtér zárt tetővel 385 literes.', bullets: ['BMW Curved Display', 'Prémium bőrülések, ülésfűtés', 'Szélterelő, nyakfűtés (felszereltségtől függően)'], img: P('bmw-4-es-cabrio', 'interior'), alt: 'BMW 4-es Cabrio belső tér — BMW Curved Display' },
    boot: '385 liter',
    specs: {
      '420i': { fuel: 'Benzin', power: '184 LE (135 kW)', torque: '300 Nm', drive: 'Hátsókerék / 8 fok. Steptronic', accel: '8,2 mp', vmax: '236 km/h', rec: 'Kulturált nyitott autózás', note: 'négyhengeres benzines', img: P('bmw-4-es-cabrio', 'g1') },
      'M440i xDrive': { fuel: 'Benzin (mild-hybrid, 6 henger)', power: '374 LE (275 kW)', torque: '500 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', accel: '4,9 mp', vmax: '250 km/h', rec: 'Sportos csúcsmodell', note: '374 lóerős hathengeres M Performance', img: P('bmw-4-es-cabrio', 'v1') },
    },
    gallery: G('bmw-4-es-cabrio', 'BMW 4-es Cabrio', [['g1', 'nyitott tetővel, naplementében'], ['g2', 'menet közben'], ['g3', 'tengerparti úton'], ['g4', 'keréktárcsa'], ['g5', 'elölnézet'], ['g6', 'bőrülések'], ['g7', 'utastér felülről']]),
    faqExtra: [ { q: 'Bérelhető a BMW 4-es Cabrio csak nyárra?', a: 'A tartós bérlet futamideje a Choice-kínálattól függ (a kártyán látod), így akár a tavaszi–nyári szezonra is bérelheted a kabriót.' } ],
  },

  'BMW 4er Gran Coupe': {
    mainImg: P('bmw-4-es-gran-coupe', 'main'), mainAlt: 'BMW 4-es Gran Coupé bérlés — négyajtós sportkupé tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4', body: 'Gran Coupé',
    design: { h3: 'Négyajtós kupé-sziluett', text: 'Hosszú motorháztető, lecsapott tetővonal, keret nélküli ajtóablakok és nagy csomagtérajtó — a 4-es Gran Coupé a kupé eleganciáját a mindennapi praktikummal ötvözi.', bullets: ['Keret nélküli ajtóablakok', 'Adaptív LED fényszórók (felszereltségtől függően)', 'M Sport kivitel, 18–19" keréktárcsák'], img: P('bmw-4-es-gran-coupe', 'design'), alt: 'BMW 4-es Gran Coupé hátsó háromnegyedes nézet' },
    interior: { h3: 'Sportos, vezetőközpontú utastér', text: 'Sportülések, M bőrkormány, digitális műszerfal és a vezető felé fordított középkonzol — hátul pedig négyajtós kényelem, a lecsapott tető ellenére is.', bullets: ['BMW Live Cockpit / Curved Display (évjárattól függően)', 'Sportülések, M bőrkormány', 'Vezeték nélküli Apple CarPlay / Android Auto'], img: P('bmw-4-es-gran-coupe', 'interior'), alt: 'BMW 4-es Gran Coupé vezetőtér' },
    gallery: G('bmw-4-es-gran-coupe', 'BMW 4-es Gran Coupé', [['g1', 'piros színben, stúdiófotó'], ['g2', 'oldalnézet, stúdió'], ['g3', 'műszerfal']]),
    overviewH2: 'BMW 4-es Gran Coupé tartós bérlet — négyajtós sportkupé havidíjjal',
    guideIntro: 'A <strong>BMW 4-es Gran Coupé</strong> a kupé eleganciáját ötvözi a négyajtós praktikummal: lecsapott tetővonal, nagy csomagtérajtó és 470 literes csomagtér. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [ { h3: 'BMW 430d xDrive Gran Coupé', html: 'A bérelhető <strong>430d xDrive</strong> hathengeres dízelmotorral (286 LE, 650 Nm) és összkerékhajtással érkezik: erős, nyugodt és hosszú utakon kiemelkedően takarékos — igazi gran turismo.' } ],
    boot: '470–1290 liter',
    specs: { '430d xDrive': { fuel: 'Dízel (6 henger)', power: '286 LE (210 kW)', torque: '650 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', accel: '5,3 mp', vmax: '250 km/h', rec: 'Erős, takarékos gran turismo', note: 'hathengeres dízel, összkerékhajtással', img: P('bmw-4-es-gran-coupe', 'g1') } },
  },

  'BMW 5er Limousine': {
    mainImg: P('bmw-5-os-limuzin', 'main'), mainAlt: 'BMW 5-ös limuzin bérlés — üzleti prémium limuzin tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4',
    overviewH2: 'BMW 5-ös limuzin tartós bérlet — az üzleti limuzin havidíjjal',
    guideIntro: 'Az új <strong>BMW 5-ös</strong> (5 Series, G60) a felső-középkategóriás üzleti limuzinok egyik legjobbja: tágas, csendes, technológiailag élvonalbeli és vezetési élményben is kiemelkedő. <strong>Tartós bérletben</strong> cégeknek és magánszemélyeknek egyaránt ideális — egyetlen havi díj, szerviz, adó és gumik a díjban.',
    guideBlocks: [
      { h3: '520d xDrive, 540d xDrive vagy 530e?', html: 'Az <strong>520d xDrive</strong> takarékos négyhengeres dízel összkerékhajtással, az <strong>540d xDrive</strong> a hathengeres, nagy nyomatékú csúcsdízel, az <strong>530e</strong> pedig tölthető plug-in hibrid, kb. 100 km tisztán elektromos hatótávval — városban akár üzemanyag nélkül.' },
      { h3: 'BMW 5-ös limuzin méretek és csomagtér', html: 'Hossz 5060 mm, szélesség 1900 mm, magasság 1515 mm, tengelytáv 2995 mm. A csomagtér 520 literes (530e: 400 liter).' },
    ],
    design: { h3: 'Nagyobb, elegánsabb, modernebb', text: 'Az új 5-ös hosszabb és szélesebb elődjénél: tiszta felületek, választhatóan világító veserács-keret, keskeny fényszórók és egyenes, elegáns oldalvonal.', bullets: ['Iconic Glow veserács-keret (felszereltségtől függően)', 'Adaptív LED fényszórók', 'M Sport kivitel, 19–21" keréktárcsák'], img: P('bmw-5-os-limuzin', 'design'), alt: 'BMW 5-ös limuzin, oldalnézet' },
    interior: { h3: 'BMW Curved Display, üzleti kényelem', text: 'A 12,3"-os műszerfal és a 14,9"-os központi kijelző alkotta BMW Curved Display, az Interaction Bar és a kiváló hangszigetelés a hosszú üzleti utakon is pihentetővé teszi az autózást. A hátsó lábtér kategóriájában kiemelkedő.', bullets: ['BMW Curved Display, Interaction Bar', 'Komfortülések, négyzónás klíma (felszereltségtől függően)', 'Vezeték nélküli Apple CarPlay / Android Auto'], img: P('bmw-5-os-limuzin', 'interior'), alt: 'BMW 5-ös belső tér — BMW Curved Display' },
    specs: {
      '520d xDrive': { fuel: 'Dízel (mild-hybrid)', power: '197 LE (145 kW)', torque: '400 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', accel: '7,1 mp', vmax: '233 km/h', boot: '520 liter', rec: 'Takarékos üzleti autó', note: 'takarékos dízel, összkerékhajtással', img: P('bmw-5-os-limuzin', 'g2') },
      '540d xDrive': { fuel: 'Dízel (mild-hybrid, 6 henger)', power: '303 LE (223 kW)', torque: '670 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', accel: '5,4 mp', vmax: '250 km/h', boot: '520 liter', rec: 'Erős, hosszú utakra', note: 'hathengeres csúcsdízel', img: P('bmw-5-os-limuzin', 'g3') },
      '530e': { fuel: 'Plug-in hibrid', power: '299 LE (220 kW)', torque: '450 Nm', drive: 'Hátsókerék / 8 fok. Steptronic', accel: '6,3 mp', vmax: '230 km/h', boot: '400 liter', rec: 'Városba, töltési lehetőséggel', note: 'plug-in hibrid, kb. 100 km elektromos hatótáv', img: P('bmw-5-os-limuzin', 'g1') },
    },
    gallery: G('bmw-5-os-limuzin', 'BMW 5-ös limuzin', [['g1', 'hegyek között'], ['g2', 'piros színben, stúdiófotó'], ['g3', 'hátsó háromnegyedes nézet'], ['g4', 'veserács, közeli nézet'], ['g5', 'elölnézet'], ['g6', 'naplementében'], ['g7', 'menet közben']]),
    faqExtra: [ { q: 'Van plug-in hibrid BMW 5-ös bérelhető?', a: 'Igen, a BMW 530e tölthető plug-in hibrid, kb. 100 km tisztán elektromos hatótávval — ideális, ha otthon vagy a munkahelyen tölteni tudsz.' } ],
  },

  'BMW 5er Touring': {
    mainImg: P('bmw-5-os-touring', 'main'), mainAlt: 'BMW 5-ös Touring bérlés — prémium kombi tartós bérletben',
    heroVideo: '/caradvance-hero-x5.mp4', body: 'Kombi',
    overviewH2: 'BMW 5-ös Touring tartós bérlet — a prémium kombi havidíjjal',
    guideIntro: 'Az új <strong>BMW 5-ös Touring</strong> (G61) az 5-ös limuzin minden erényét nagy, praktikus csomagtérrel egészíti ki: 570 liter, döntött ülésekkel akár 1700 liter. <strong>Tartós bérletben</strong> családoknak és sokat utazó céges felhasználóknak egyaránt ideális — egyetlen havi díjjal, szerviz, adó és gumik nélküli gondokkal.',
    guideBlocks: [
      { h3: '520d, 520d xDrive vagy 550e xDrive?', html: 'Az <strong>520d</strong> és az <strong>520d xDrive</strong> takarékos dízelek (hátsó-, illetve összkerékhajtással), az <strong>550e xDrive</strong> pedig 489 lóerős plug-in hibrid — hathengeres benzinmotorral és elektromos hajtással, tisztán elektromos hatótávval is.' },
    ],
    design: { h3: 'Elegáns kombi-arányok', text: 'A Touring hosszú tetővonala, a lejtős D-oszlop és a tiszta oldalfelületek elegáns, dinamikus kombit formálnak — ugyanazzal az arccal, mint az új 5-ös limuzin.', bullets: ['Elektromos csomagtérajtó, nagy rakodónyílás', 'Adaptív LED fényszórók', 'M Sport kivitel, 19–21" keréktárcsák'], img: P('bmw-5-os-touring', 'design'), alt: 'BMW 5-ös Touring, hátsó nézet' },
    interior: { h3: 'Tágas, digitális utastér', text: 'A BMW Curved Display, a kiváló ülések és a nagy, jól kihasználható csomagtér teszik a Touringot ideális családi és utazóautóvá. A hátsó üléstámla 40:20:40 arányban dönthető.', bullets: ['BMW Curved Display, Interaction Bar', '570–1700 literes csomagtér', 'Vezeték nélküli Apple CarPlay / Android Auto'], img: P('bmw-5-os-touring', 'interior'), alt: 'BMW 5-ös Touring belső tér' },
    specs: {
      '520d': { fuel: 'Dízel (mild-hybrid)', power: '197 LE (145 kW)', torque: '400 Nm', drive: 'Hátsókerék / 8 fok. Steptronic', vmax: '227 km/h', boot: '570–1700 liter', rec: 'Takarékos családi kombi', note: 'takarékos dízel', img: P('bmw-5-os-touring', 'g1') },
      '520d xDrive': { fuel: 'Dízel (mild-hybrid)', power: '197 LE (145 kW)', torque: '400 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', boot: '570–1700 liter', rec: 'Összkerékhajtású dízel', note: 'takarékos dízel, összkerékhajtással', img: P('bmw-5-os-touring', 'g3') },
      '550e xDrive': { fuel: 'Plug-in hibrid (6 henger)', power: '489 LE (360 kW)', torque: '700 Nm', drive: 'xDrive összkerék / 8 fok. Steptronic', accel: '4,3 mp', vmax: '250 km/h', boot: '500–1630 liter', rec: 'Erős és tölthető', note: '489 lóerős plug-in hibrid', img: P('bmw-5-os-touring', 'g2') },
    },
    gallery: G('bmw-5-os-touring', 'BMW 5-ös Touring', [['g1', 'menet közben'], ['g2', 'piros színben'], ['g3', 'veserács és fényszóró'], ['g4', 'oldalnézet'], ['g5', 'téli úton'], ['g6', 'csomagtartó használat közben'], ['g7', 'vezetőtér']]),
    faqExtra: [ { q: 'Mekkora a BMW 5-ös Touring csomagtartója?', a: 'A csomagtér 570 literes, a hátsó ülések döntésével akár 1700 literre bővíthető (550e: 500–1630 liter).' } ],
  },
  // ---------- további márkák: src/data/rental<Márka>.ts ----------
  ...MINI,
  ...AUDI,
  ...VW,
  ...MERCEDES,
  ...OTHERS,
};
