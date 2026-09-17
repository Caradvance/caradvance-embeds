// Egyedi autó modell-adatok — a CarDetail.astro sablon ebből épít fel egy teljes
// modell-aloldalt (/egyedi-auto-rendeles/<slug>). Új modell = új bejegyzés ide +
// a képek feltöltése a public/bmw (ill. /mini, /mercedes, /audi) mappába.
//
// A megosztott részek (fejléc-videó logika, rendelő-modal, lightbox, CSS, GYIK-doboz
// stílus) a komponensben vannak; itt csak a modellre jellemző tartalom van.

export interface Variant {
  key: string;      // '118'  (data-var / kapcsoló)
  label: string;    // 'BMW 118'
  fuel: string;     // 'Benzin'
  power: string;    // '156 LE (115 kW)'
  torque: string;   // '230 Nm'
  drive: string;    // 'Első / 7 fok. DKG'
  accel: string;    // '9,0 mp'
  vmax: string;     // '215 km/h'
  cons: string;     // '~5,7 l/100 km'
  boot: string;     // '380 liter'
  rec: string;      // 'Kiegyensúlyozott belépő'  (összehasonlító táblához)
  img: string;      // '/bmw/bmw-118-elolnezet.webp'
  alt: string;
}
export interface Faq { q: string; a: string; }               // a: tartalmazhat HTML-t
export interface Img { img: string; alt: string; }
export interface Related { name: string; href: string; }
export interface Block { h3?: string; html: string; }

export interface CarModel {
  slug: string;            // '1erb-benzin'  (útvonal + fájlnevek)
  brand: string;           // 'BMW'
  brandKey: string;        // 'bmw'
  brandLogo: string;       // '/bmw-hero-logo.png'
  name: string;            // 'BMW 1-es'
  modelCode?: string;      // 'F70'
  title: string;
  description: string;
  netEur: number;          // nettó EUR (induló ár)
  orderKey: string;        // '1erb'  (a lista ?order= kulcsa)
  orderFuels: string;      // 'Benzin,Dízel'
  heroSub: string;
  heroVideo: string;
  heroPoster: string;
  mainImg: string;
  mainAlt: string;
  chips: string[];
  yearChip: string;        // '2026 · Németország'
  bodyType: string;        // '5 ajtós kompakt'
  overviewH2: string;
  overviewLead: string;    // HTML
  highlights: { icon: string; title: string; text: string }[];
  design: { h3: string; text: string; bullets: string[]; img: string; alt: string };
  interior: { h3: string; text: string; bullets: string[]; img: string; alt: string };
  prose: { h2: string; blocks: Block[] };
  variants: Variant[];
  gallery: Img[];
  faq: Faq[];
  related: Related[];
  // Car schema kiegészítők (a base változat pontos adatai):
  schema: {
    modelName: string; modelDate: string; bodyTypeEn: string; doors: number;
    transmission: string; drive: string; fuelType: string; engineFuel: string;
    powerKw: number; torqueNm: number; vmaxKmh: number; accelSec: number;
    cargoL: number; consL: number;
  };
}

export const carModels: Record<string, CarModel> = {
  '1erb-benzin': {
    slug: '1erb-benzin',
    brand: 'BMW', brandKey: 'bmw', brandLogo: '/bmw-hero-logo.png',
    name: 'BMW 1-es', modelCode: 'F70',
    title: 'BMW 1-es (F70) — új autó Németországból, egyedi rendelés | CarAdvance',
    description: 'Új BMW 1-es (118, 120, 120d) egyedi rendelése Németországból — kulcsrakész behozatal, akár 19% német áfával. Ár, felszereltség, tartós bérlet egy helyen.',
    netEur: 28782,
    orderKey: '1erb', orderFuels: 'Benzin,Dízel',
    heroSub: 'Prémium kompakt Németországból — sportos vezetés, digitális belső tér, új autóként, egyedi konfigurációval.',
    heroVideo: '/bmw/1erb-hero.mp4',
    heroPoster: '/bmw/1erb-hero-poster.jpg',
    mainImg: '/bmw/bmw-1es-m-sport-elolnezet.webp',
    mainAlt: 'BMW 1-es M Sport – új autó Németországból, egyedi rendelés',
    chips: ['Kompakt', 'Benzin', 'Dízel', 'Automata'],
    yearChip: '2026 · Németország',
    bodyType: '5 ajtós kompakt',
    overviewH2: 'Új BMW 1-es Németországból, egyedi rendelésre',
    overviewLead: 'A <strong>BMW 1-es</strong> (BMW 1 Series) a márka belépő prémium kompaktja: feszes futómű, letisztult, digitális utastér és a jól ismert BMW vezetési élmény. A CarAdvance-nél pontosan azt a <strong>BMW 118</strong>, <strong>BMW 120</strong> vagy <strong>BMW 120d</strong> kivitelt rendeljük meg neked, amit szeretnél — új autóként, gyári felszereltséggel, <a href="/beszerzesi-folyamat">Németországból, kulcsrakész behozatallal</a>. Nem szeretnél venni? A 1-es <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető.',
    highlights: [
      { icon: '◈', title: 'Sportos vezetés', text: 'Feszes futómű és pontos kormányzás — a kompakt kategória vezetési etalonja.' },
      { icon: '▦', title: 'Digitális utastér', text: 'BMW Curved Display és a legújabb iDrive — modern, letisztult vezérlés.' },
      { icon: '🛡', title: 'Biztonság', text: 'Fejlett vezetéstámogató rendszerek és a BMW ismert felépítési minősége.' },
      { icon: '€', title: 'Kedvező német ár', text: 'Magánszemélyként akár 19% német áfával — több százezer forint megtakarítás.' },
    ],
    design: {
      h3: 'Karakteres megjelenés, prémium részletek',
      text: 'A BMW 1-es önmagáért beszél: markáns veserács, letisztult vonalvezetés és minőségi anyaghasználat. Az M Sport csomaggal a kompakt sportos karaktert kap — pontosan úgy konfigurálva, ahogy te szeretnéd.',
      bullets: ['M Sport és Sport Line kivitel', 'LED / adaptív fényszórók', '17–19&quot; könnyűfém keréktárcsák'],
      img: '/bmw/bmw-1es-m-sport-kulso.webp', alt: 'BMW 1-es M Sport külső – markáns veserács, LED fényszórók',
    },
    interior: {
      h3: 'Digitális, tágas, kényelmes',
      text: 'A BMW Curved Display, a hangulatvilágítás és a minőségi kárpitok prémium környezetet teremtenek. A megnövelt utastér és csomagtér a kompakt méret ellenére is praktikus a mindennapokra.',
      bullets: ['BMW Curved Display + iDrive', 'Ülésfűtés, kétzónás klíma', 'Vezeték nélküli Apple CarPlay / Android Auto'],
      img: '/bmw/bmw-1es-belso-ter-curved-display.webp', alt: 'BMW 1-es belső tér – BMW Curved Display és iDrive',
    },
    prose: {
      h2: 'Új BMW 1-es Németországból — miért éri meg?',
      blocks: [
        { html: 'A <strong>BMW 1-es</strong> a márka belépő prémium kompaktja, mégis igazi BMW: precíz futómű, kiváló anyagminőség és a legújabb digitális utastér. Ha új autót szeretnél, a német piac kínálata nagyságrendekkel szélesebb a hazainál — így pontosan azt a motorizációt, színt és felszereltséget találjuk meg neked, amit elképzeltél. A CarAdvance 2003 óta hozza be a prémium autókat Németországból, <a href="/beszerzesi-folyamat">kulcsrakészen, teljes ügyintézéssel</a>.' },
        { h3: 'Mennyibe kerül egy új BMW 1-es?', html: 'A <strong>BMW 1-es ára</strong> a választott kiviteltől függ: a benzines <strong>BMW 118</strong> a kiegyensúlyozott belépő, a <strong>BMW 120</strong> a dinamikusabb mild-hybrid, a <strong>BMW 120d</strong> pedig a takarékos dízel a sokat autózóknak. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett — ez önmagában több százezer forintos megtakarítás.' },
        { h3: 'Melyik BMW 1-es kivitelt válaszd?', html: 'A <strong>118</strong> (156 LE) a mindennapokra ideális, kedvező fenntartással; a <strong>120</strong> (170 LE) sportosabb élményt és 48V-os mild-hybrid rendszert kínál; a <strong>120d</strong> (163 LE, 360 Nm) hosszú távon a legtakarékosabb, bőséges nyomatékkal. Mindegyikhez 7 fokozatú DKG váltó és első kerék hajtás jár.' },
        { h3: 'Megvásárolod, lízingeled vagy béreled?', html: 'Ahogy neked a legjobb: az egyedi rendelés mellett a 1-es elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha pedig nem szeretnél tulajdonolni, a modell <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet. Alig használt darabot keresel? Mutatjuk, mire figyelj a <a href="/blog/nemet-hasznaltauto-vasarlas">német használtautó vásárlásakor</a>.' },
      ],
    },
    variants: [
      { key: '118', label: 'BMW 118', fuel: 'Benzin', power: '156 LE (115 kW)', torque: '230 Nm', drive: 'Első / 7 fok. DKG', accel: '9,0 mp', vmax: '215 km/h', cons: '~5,7 l/100 km', boot: '380 liter', rec: 'Kiegyensúlyozott belépő', img: '/bmw/bmw-118-elolnezet.webp', alt: 'BMW 118 – kompakt prémium, elölnézet' },
      { key: '120', label: 'BMW 120', fuel: 'Benzin (mild-hybrid)', power: '170 LE (125 kW)', torque: '240 Nm', drive: 'Első / 7 fok. DKG', accel: '8,3 mp', vmax: '216 km/h', cons: '~5,8 l/100 km', boot: '300 liter', rec: 'Sportosabb, dinamikus', img: '/bmw/bmw-120-elolnezet.webp', alt: 'BMW 120 M Sport – elölnézet' },
      { key: '120d', label: 'BMW 120d (dízel)', fuel: 'Dízel (mild-hybrid)', power: '163 LE (120 kW)', torque: '360 Nm', drive: 'Első / 7 fok. DKG', accel: '8,6 mp', vmax: '225 km/h', cons: '~4,5 l/100 km', boot: '300 liter', rec: 'Sokat autózóknak, takarékos', img: '/bmw/bmw-120d-elolnezet.webp', alt: 'BMW 120d dízel – elölnézet' },
    ],
    gallery: [
      { img: '/bmw/bmw-1es-menet-kozben.webp', alt: 'BMW 1-es menet közben, hegyi úton' },
      { img: '/bmw/bmw-1es-hegyi-uton.webp', alt: 'BMW 1-es dinamikus vezetés hegyi környezetben' },
      { img: '/bmw/bmw-1es-oldalnezet.webp', alt: 'BMW 1-es M Sport oldalnézet' },
      { img: '/bmw/bmw-1es-m-felni-feknyereg.webp', alt: 'BMW 1-es M könnyűfém keréktárcsa, piros féknyereg' },
      { img: '/bmw/bmw-1es-muszerfal.webp', alt: 'BMW 1-es utastér – BMW Curved Display' },
      { img: '/bmw/bmw-1es-sport-ulesek.webp', alt: 'BMW 1-es sport ülések' },
    ],
    faq: [
      { q: 'Mennyibe kerül egy új BMW 1-es Németországból?', a: 'A BMW 118 nettó listaára a feltüntetett ártól indul, a felszereltségtől függően. Magánszemélyként akár 19% német áfával rendelheted a müncheni Caradvance GmbH-n keresztül.' },
      { q: 'Melyik BMW 1-es kivitelt válasszam — 118, 120 vagy 120d?', a: 'A <strong>BMW 118</strong> (156 LE) a kiegyensúlyozott benzines belépő, a <strong>120</strong> (170 LE) a sportosabb, mild-hybrid választás, a <strong>120d</strong> (163 LE, 360 Nm) pedig a takarékos dízel a sokat autózóknak. Segítünk kiválasztani a hozzád illő motorizációt és felszereltséget.' },
      { q: 'Mennyi egy BMW 1-es fogyasztása?', a: 'WLTP szerint a BMW 118 kb. 5,7 l/100 km, a 120 kb. 5,8 l/100 km, a dízel 120d pedig kb. 4,5 l/100 km átlagfogyasztással üzemel — a konkrét érték a felszereltségtől és a vezetési stílustól függ.' },
      { q: 'Mekkora a BMW 1-es csomagtartója?', a: 'A BMW 1-es csomagtartója 380 liter, a hátsó ülések ledöntésével 1200 literig bővíthető. A mild-hybrid változatoknál az akkumulátor miatt 300 liter az alapérték.' },
      { q: 'Mennyivel olcsóbb a német áfás vásárlás?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett. A 8 százalékpontnyi különbség egy új BMW 1-esnél több százezer forintos megtakarítást jelenthet.' },
      { q: 'Lehet a BMW 1-est lízingelni vagy finanszírozni?', a: 'Igen — a BMW 1-es elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha nem szeretnél tulajdonolni, <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet, szervizzel és biztosítással együtt.' },
      { q: 'Bérelhető is a BMW 1-es?', a: 'Igen — a 1-es <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető, egyetlen, kiszámítható havi díjjal, amiben a szerviz és a biztosítás is benne lehet.' },
      { q: 'Mennyi idő a behozatal?', a: 'A kiválasztott konfigurációtól függ, jellemzően néhány hét. A <a href="/beszerzesi-folyamat">beszerzési folyamat</a> minden lépését mi intézzük, a honosítással és forgalomba helyezéssel együtt.' },
    ],
    related: [
      { name: 'BMW 2-es Gran Coupé', href: '/egyedi-auto-rendeles/2ergc-benzin' },
      { name: 'BMW 2-es Active Tourer', href: '/egyedi-auto-rendeles/2eratb-benzin' },
      { name: 'BMW X1', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW X2', href: '/egyedi-auto-rendeles?brand=bmw' },
    ],
    schema: {
      modelName: '1 Series', modelDate: '2024', bodyTypeEn: 'Hatchback', doors: 5,
      transmission: '7 fokozatú DKG automata', drive: 'FrontWheelDriveConfiguration',
      fuelType: 'Benzin, Dízel', engineFuel: 'Benzin', powerKw: 115, torqueNm: 230,
      vmaxKmh: 215, accelSec: 9.0, cargoL: 380, consL: 5.7,
    },
  },

  '2eratb-benzin': {
    slug: '2eratb-benzin',
    brand: 'BMW', brandKey: 'bmw', brandLogo: '/bmw-hero-logo.png',
    name: 'BMW 2-es Active Tourer', modelCode: 'U06',
    title: 'BMW 2-es Active Tourer — új autó Németországból | CarAdvance',
    description: 'Új BMW 2-es Active Tourer (218i, 223i, 220d) egyedi rendelése Németországból — tágas prémium egyterű, kulcsrakész behozatal, akár 19% német áfával.',
    netEur: 30882,
    orderKey: '2eratb', orderFuels: 'Benzin,Hibrid,Dízel',
    heroSub: 'Tágas prémium egyterű Németországból — rugalmas utastér, magasabb beülő, digitális belső tér, új autóként, egyedi konfigurációval.',
    heroVideo: '/bmw/2erat-hero.mp4',
    heroPoster: '/bmw/2erat-hero-poster.jpg',
    mainImg: '/bmw/bmw-2es-active-tourer-m-sport-elolnezet.webp',
    mainAlt: 'BMW 2-es Active Tourer M Sport – új autó Németországból, egyedi rendelés',
    chips: ['Egyterű', 'Benzin', 'Dízel', 'Automata'],
    yearChip: '2026 · Németország',
    bodyType: '5 ajtós egyterű (MPV)',
    overviewH2: 'Új BMW 2-es Active Tourer Németországból, egyedi rendelésre',
    overviewLead: 'A <strong>BMW 2-es Active Tourer</strong> a márka prémium egyterűje: meglepően tágas, rugalmasan variálható utastér, magasabb, kényelmes beülő és a legújabb digitális BMW-élmény — mindez kompakt méretben. A CarAdvance-nél pontosan azt a <strong>BMW 218i</strong>, <strong>BMW 223i</strong> vagy <strong>BMW 220d</strong> kivitelt rendeljük meg neked, amit szeretnél — új autóként, gyári felszereltséggel, <a href="/beszerzesi-folyamat">Németországból, kulcsrakész behozatallal</a>. Nem szeretnél venni? Az Active Tourer <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető.',
    highlights: [
      { icon: '▦', title: 'Tágas, variálható', text: 'Eltolható hátsó ülések és nagy csomagtér — a család és a hobbi is elfér.' },
      { icon: '◈', title: 'Digitális utastér', text: 'BMW Curved Display és a legújabb iDrive — modern, letisztult vezérlés.' },
      { icon: '🪑', title: 'Kényelmes beülő', text: 'Magasabb üléspozíció, jó kilátás és bőséges tér minden utasnak.' },
      { icon: '€', title: 'Kedvező német ár', text: 'Magánszemélyként akár 19% német áfával — több százezer forint megtakarítás.' },
    ],
    design: {
      h3: 'Karakteres megjelenés, prémium részletek',
      text: 'A 2-es Active Tourer magabiztos, modern megjelenésű: markáns veserács, letisztult vonalvezetés és minőségi anyaghasználat. Az M Sport csomaggal sportosabb karaktert kap — pontosan úgy konfigurálva, ahogy te szeretnéd.',
      bullets: ['M Sport és Luxury Line kivitel', 'LED / adaptív fényszórók', '17–19&quot; könnyűfém keréktárcsák'],
      img: '/bmw/bmw-2es-active-tourer-kulso.webp', alt: 'BMW 2-es Active Tourer M Sport külső – markáns veserács, LED fényszórók',
    },
    interior: {
      h3: 'Tágas, digitális, rugalmas',
      text: 'A BMW Curved Display, a hangulatvilágítás és a minőségi kárpitok prémium környezetet teremtenek. Az eltolható hátsó üléssor és a nagy csomagtér a mindennapokban is kivételesen praktikussá teszi.',
      bullets: ['BMW Curved Display + iDrive', 'Eltolható hátsó ülések, 470–1455 l csomagtér', 'Vezeték nélküli Apple CarPlay / Android Auto'],
      img: '/bmw/bmw-2es-active-tourer-belso-ter.webp', alt: 'BMW 2-es Active Tourer belső tér – BMW Curved Display és iDrive',
    },
    prose: {
      h2: 'Új BMW 2-es Active Tourer Németországból — miért éri meg?',
      blocks: [
        { html: 'A <strong>BMW 2-es Active Tourer</strong> a prémium egyterűk közül is kiemelkedik: a kompakt külső méret mögött meglepően tágas, rugalmasan variálható utastér rejlik, magasabb beülővel és a legújabb digitális BMW-élménnyel. Ha új autót szeretnél, a német piac kínálata nagyságrendekkel szélesebb a hazainál — így pontosan azt a motorizációt, színt és felszereltséget találjuk meg neked, amit elképzeltél. A CarAdvance 2003 óta hozza be a prémium autókat Németországból, <a href="/beszerzesi-folyamat">kulcsrakészen, teljes ügyintézéssel</a>.' },
        { h3: 'Mennyibe kerül egy új BMW 2-es Active Tourer?', html: 'Az <strong>ár</strong> a választott kiviteltől függ: a benzines <strong>BMW 218i</strong> a kiegyensúlyozott belépő, a <strong>BMW 223i</strong> a legdinamikusabb benzines, a <strong>BMW 220d</strong> pedig a takarékos dízel a sokat autózóknak — plug-in hibrid (225e, 230e) is elérhető. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett.' },
        { h3: 'Melyik BMW 2-es Active Tourer kivitelt válaszd?', html: 'A <strong>218i</strong> (136 LE) a mindennapokra ideális, kedvező fenntartással; a <strong>223i</strong> (218 LE) a legdinamikusabb, 48V-os mild-hybrid rendszerrel; a <strong>220d</strong> (150 LE, 360 Nm) hosszú távon a legtakarékosabb. Mindegyikhez 7 fokozatú DKG váltó és első kerék hajtás jár.' },
        { h3: 'Megvásárolod, lízingeled vagy béreled?', html: 'Ahogy neked a legjobb: az egyedi rendelés mellett az Active Tourer elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha pedig nem szeretnél tulajdonolni, a modell <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet. Szűkebb kompaktot keresel? Nézd meg a <a href="/egyedi-auto-rendeles/1erb-benzin">BMW 1-est</a> is.' },
      ],
    },
    variants: [
      { key: '218i', label: 'BMW 218i', fuel: 'Benzin', power: '136 LE (100 kW)', torque: '230 Nm', drive: 'Első / 7 fok. DKG', accel: '9,5 mp', vmax: '208 km/h', cons: '~5,9 l/100 km', boot: '470 liter', rec: 'Kiegyensúlyozott belépő', img: '/bmw/bmw-218i-active-tourer-elolnezet.webp', alt: 'BMW 218i Active Tourer – elölnézet' },
      { key: '223i', label: 'BMW 223i', fuel: 'Benzin (mild-hybrid)', power: '218 LE (160 kW)', torque: '360 Nm', drive: 'Első / 7 fok. DKG', accel: '7,0 mp', vmax: '240 km/h', cons: '~6,3 l/100 km', boot: '470 liter', rec: 'Legdinamikusabb benzines', img: '/bmw/bmw-223i-active-tourer-elolnezet.webp', alt: 'BMW 223i Active Tourer – elölnézet' },
      { key: '220d', label: 'BMW 220d (dízel)', fuel: 'Dízel', power: '150 LE (110 kW)', torque: '360 Nm', drive: 'Első / 7 fok. DKG', accel: '8,5 mp', vmax: '213 km/h', cons: '~4,8 l/100 km', boot: '470 liter', rec: 'Takarékos, hosszú távra', img: '/bmw/bmw-220d-active-tourer-elolnezet.webp', alt: 'BMW 220d Active Tourer dízel – elölnézet' },
    ],
    gallery: [
      { img: '/bmw/bmw-2es-active-tourer-hatso-nezet.webp', alt: 'BMW 2-es Active Tourer hátsó nézet, menet közben' },
      { img: '/bmw/bmw-2es-active-tourer-oldalnezet.webp', alt: 'BMW 2-es Active Tourer oldalnézet' },
      { img: '/bmw/bmw-2es-active-tourer-veserac.webp', alt: 'BMW 2-es Active Tourer veserács és LED fényszóró közelről' },
      { img: '/bmw/bmw-2es-active-tourer-felni.webp', alt: 'BMW 2-es Active Tourer könnyűfém keréktárcsa' },
      { img: '/bmw/bmw-2es-active-tourer-muszerfal.webp', alt: 'BMW 2-es Active Tourer utastér – BMW Curved Display' },
      { img: '/bmw/bmw-2es-active-tourer-ulesek.webp', alt: 'BMW 2-es Active Tourer ülések' },
      { img: '/bmw/bmw-2es-active-tourer-kek-menet-kozben.webp', alt: 'BMW 2-es Active Tourer kék színben, menet közben hegyi úton' },
      { img: '/bmw/bmw-2es-active-tourer-kek-topart.webp', alt: 'BMW 2-es Active Tourer kék színben, tópartnál' },
      { img: '/bmw/bmw-2es-active-tourer-kek-hatso.webp', alt: 'BMW 2-es Active Tourer kék színben, hátsó nézet' },
    ],
    faq: [
      { q: 'Mennyibe kerül egy új BMW 2-es Active Tourer Németországból?', a: 'A BMW 218i Active Tourer nettó listaára a feltüntetett ártól indul, a felszereltségtől függően. Magánszemélyként akár 19% német áfával rendelheted a müncheni Caradvance GmbH-n keresztül.' },
      { q: 'Melyik kivitelt válasszam — 218i, 223i vagy 220d?', a: 'A <strong>218i</strong> (136 LE) a kiegyensúlyozott benzines belépő, a <strong>223i</strong> (218 LE) a legdinamikusabb, mild-hybrid rendszerrel, a <strong>220d</strong> (150 LE, 360 Nm) pedig a takarékos dízel a sokat autózóknak. Plug-in hibrid (225e, 230e) is rendelhető.' },
      { q: 'Mekkora a BMW 2-es Active Tourer csomagtartója?', a: 'A csomagtartó 470 liter, az eltolható hátsó üléssorral és a támlák ledöntésével akár 1455 literig bővíthető — így igazán családbarát. A plug-in hibrid változatnál az akkumulátor miatt kisebb az alapérték.' },
      { q: 'Mennyi a BMW 2-es Active Tourer fogyasztása?', a: 'WLTP szerint a 218i kb. 5,9 l/100 km, a 223i kb. 6,3 l/100 km, a dízel 220d pedig kb. 4,8 l/100 km átlagfogyasztással üzemel — a plug-in hibrid tölthető akkuval jóval kevesebbet is fogyaszthat.' },
      { q: 'Mennyivel olcsóbb a német áfás vásárlás?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett. A 8 százalékpontnyi különbség egy új BMW 2-es Active Tourernél több százezer forintos megtakarítást jelenthet.' },
      { q: 'Lehet lízingelni vagy finanszírozni?', a: 'Igen — a BMW 2-es Active Tourer elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha nem szeretnél tulajdonolni, <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet, szervizzel és biztosítással együtt.' },
      { q: 'Bérelhető is a 2-es Active Tourer?', a: 'Igen — az Active Tourer <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető, egyetlen, kiszámítható havi díjjal, amiben a szerviz és a biztosítás is benne lehet.' },
      { q: 'Mennyi idő a behozatal?', a: 'A kiválasztott konfigurációtól függ, jellemzően néhány hét. A <a href="/beszerzesi-folyamat">beszerzési folyamat</a> minden lépését mi intézzük, a honosítással és forgalomba helyezéssel együtt.' },
    ],
    related: [
      { name: 'BMW 1-es', href: '/egyedi-auto-rendeles/1erb-benzin' },
      { name: 'BMW 2-es Gran Coupé', href: '/egyedi-auto-rendeles/2ergc-benzin' },
      { name: 'BMW X1', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW X2', href: '/egyedi-auto-rendeles?brand=bmw' },
    ],
    schema: {
      modelName: '2 Series Active Tourer', modelDate: '2022', bodyTypeEn: 'MPV', doors: 5,
      transmission: '7 fokozatú DKG automata', drive: 'FrontWheelDriveConfiguration',
      fuelType: 'Benzin, Dízel, Hibrid', engineFuel: 'Benzin', powerKw: 100, torqueNm: 230,
      vmaxKmh: 208, accelSec: 9.5, cargoL: 470, consL: 5.9,
    },
  },

  '2ergc-benzin': {
    slug: '2ergc-benzin',
    brand: 'BMW', brandKey: 'bmw', brandLogo: '/bmw-hero-logo.png',
    name: 'BMW 2-es Gran Coupé', modelCode: 'F74',
    title: 'BMW 2-es Gran Coupé (F74) — új autó Németországból, egyedi rendelés | CarAdvance',
    description: 'Új BMW 2-es Gran Coupé (220 Gran Coupé, M235 xDrive) egyedi rendelése Németországból — sportos négyajtós coupé, kulcsrakész behozatal, akár 19% német áfával. Ár, felszereltség, tartós bérlet.',
    netEur: 31723,
    orderKey: '2ergc', orderFuels: 'Benzin',
    heroSub: 'Sportos négyajtós coupé Németországból — keret nélküli oldalablakok, M Performance csúcs, digitális belső tér, új autóként, egyedi konfigurációval.',
    heroVideo: '/bmw/2ergc-hero.mp4',
    heroPoster: '/bmw/2ergc-hero-poster.webp',
    mainImg: '/bmw/bmw-2es-gran-coupe-m235-elolnezet.webp',
    mainAlt: 'BMW M235 xDrive Gran Coupé – új autó Németországból, egyedi rendelés',
    chips: ['Gran Coupé', 'Benzin', 'M Performance', 'Automata'],
    yearChip: '2026 · Németország',
    bodyType: '4 ajtós Gran Coupé',
    overviewH2: 'Új BMW 2-es Gran Coupé Németországból, egyedi rendelésre',
    overviewLead: 'A <strong>BMW 2-es Gran Coupé</strong> (BMW 2 Series Gran Coupé) a márka sportos, négyajtós coupéja: nyújtott sziluett, keret nélküli oldalablakok, feszes futómű és a legújabb digitális BMW-élmény. A CarAdvance-nél pontosan azt a <strong>BMW 220 Gran Coupé</strong> vagy a csúcsot jelentő <strong>BMW M235 xDrive</strong> kivitelt rendeljük meg neked, amit szeretnél — új autóként, gyári felszereltséggel, <a href="/beszerzesi-folyamat">Németországból, kulcsrakész behozatallal</a>. Nem szeretnél venni? A 2-es Gran Coupé <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető.',
    highlights: [
      { icon: '◈', title: 'Sportos coupé karakter', text: 'Nyújtott tetővonal, keret nélküli ablakok és feszes futómű — dinamika minden méterben.' },
      { icon: '⚡', title: 'M Performance csúcs', text: 'Az M235 xDrive 300 LE-vel, összkerékhajtással és 4,9 mp-es gyorsulással.' },
      { icon: '▦', title: 'Digitális utastér', text: 'BMW Curved Display és a legújabb iDrive — modern, letisztult vezérlés.' },
      { icon: '€', title: 'Kedvező német ár', text: 'Magánszemélyként akár 19% német áfával — több százezer forint megtakarítás.' },
    ],
    design: {
      h3: 'Extrovertált, sportos megjelenés',
      text: 'A 2-es Gran Coupé magabiztos és dinamikus: keret nélküli oldalablakok, ikonikus BMW veserács (az M235-ön világító Iconic Glow kerettel) és letisztult, a hátsó rész felé lejtő tetővonal. Az M235 xDrive négy végkifúvóval, M hátsó légterelővel és 19" M könnyűfém keréktárcsákkal még sportosabb.',
      bullets: ['M Sport és M235 xDrive kivitel', 'Iconic Glow világító veserács (M235)', '18–19&quot; könnyűfém keréktárcsák'],
      img: '/bmw/bmw-2es-gran-coupe-kulso.webp', alt: 'BMW 2-es Gran Coupé külső – keret nélküli ablakok, sportos sziluett',
    },
    interior: {
      h3: 'Vezetőorientált, digitális belső',
      text: 'A BMW Curved Display, a hangulatvilágítás és a minőségi kárpitok prémium, sportos környezetet teremtenek. Az M235-ben M sportülések, M bőrkormány és piros 12 órás jelzés fokozzák a dinamikus élményt, a 430 literes csomagtartó pedig a mindennapokban is praktikus.',
      bullets: ['BMW Curved Display + iDrive', 'M sportülések, M bőrkormány (M235)', 'Vezeték nélküli Apple CarPlay / Android Auto'],
      img: '/bmw/bmw-2es-gran-coupe-belso-ter.webp', alt: 'BMW 2-es Gran Coupé belső tér – BMW Curved Display és iDrive',
    },
    prose: {
      h2: 'Új BMW 2-es Gran Coupé Németországból — miért éri meg?',
      blocks: [
        { html: 'A <strong>BMW 2-es Gran Coupé</strong> a márka sportos négyajtós coupéja: a nyújtott, kupészerű sziluett és a keret nélküli oldalablakok mögött feszes futómű és a legújabb digitális BMW-élmény rejlik. Ha új autót szeretnél, a német piac kínálata nagyságrendekkel szélesebb a hazainál — így pontosan azt a motorizációt, színt és felszereltséget találjuk meg neked, amit elképzeltél. A CarAdvance 2003 óta hozza be a prémium autókat Németországból, <a href="/beszerzesi-folyamat">kulcsrakészen, teljes ügyintézéssel</a>.' },
        { h3: 'Mennyibe kerül egy új BMW 2-es Gran Coupé?', html: 'A <strong>BMW 2-es Gran Coupé ára</strong> a választott kiviteltől függ: a benzines <strong>BMW 220 Gran Coupé</strong> a kiegyensúlyozott, dinamikus belépő 48V-os mild-hybrid rendszerrel, a <strong>BMW M235 xDrive</strong> pedig a 300 lóerős M Performance csúcsmodell összkerékhajtással. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett — ez önmagában több százezer forintos megtakarítás.' },
        { h3: 'Melyik BMW 2-es Gran Coupé kivitelt válaszd?', html: 'A <strong>220 Gran Coupé</strong> (170 LE) a mindennapokra ideális, kedvező fenntartással és sportos karakterrel; a <strong>M235 xDrive</strong> (300 LE, 400 Nm) a csúcs: 4,9 mp alatt gyorsul 100-ra, xDrive összkerékhajtással, adaptív M futóművel és M sportfékekkel. Mindkettőhöz 7 fokozatú automata váltó jár.' },
        { h3: 'Megvásárolod, lízingeled vagy béreled?', html: 'Ahogy neked a legjobb: az egyedi rendelés mellett a 2-es Gran Coupé elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha pedig nem szeretnél tulajdonolni, a modell <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet. Praktikusabb formát keresel? Nézd meg a <a href="/egyedi-auto-rendeles/2eratb-benzin">2-es Active Tourert</a> vagy a <a href="/egyedi-auto-rendeles/1erb-benzin">1-est</a> is.' },
      ],
    },
    variants: [
      { key: '220gc', label: 'BMW 220 Gran Coupé', fuel: 'Benzin (mild-hybrid)', power: '170 LE (125 kW)', torque: '280 Nm', drive: 'Első / 7 fok. DKG', accel: '7,9 mp', vmax: '230 km/h', cons: '~5,7 l/100 km', boot: '430 liter', rec: 'Kiegyensúlyozott, sportos belépő', img: '/bmw/bmw-220-gran-coupe-elolnezet.webp', alt: 'BMW 220 Gran Coupé – elölnézet' },
      { key: 'm235', label: 'BMW M235 xDrive', fuel: 'Benzin', power: '300 LE (221 kW)', torque: '400 Nm', drive: 'xDrive összkerék / 7 fok. DKG', accel: '4,9 mp', vmax: '250 km/h', cons: '~8,0 l/100 km', boot: '430 liter', rec: 'M Performance csúcsmodell', img: '/bmw/bmw-m235-gran-coupe-elolnezet.webp', alt: 'BMW M235 xDrive Gran Coupé – elölnézet' },
    ],
    gallery: [
      { img: '/bmw/bmw-2es-gran-coupe-oldalnezet.webp', alt: 'BMW 2-es Gran Coupé oldalnézet, sportos sziluett' },
      { img: '/bmw/bmw-2es-gran-coupe-hatso-nezet.webp', alt: 'BMW 2-es Gran Coupé hátsó nézet' },
      { img: '/bmw/bmw-2es-gran-coupe-veserac-iconic-glow.webp', alt: 'BMW 2-es Gran Coupé Iconic Glow világító veserács' },
      { img: '/bmw/bmw-2es-gran-coupe-felni.webp', alt: 'BMW 2-es Gran Coupé M könnyűfém keréktárcsa' },
      { img: '/bmw/bmw-2es-gran-coupe-muszerfal.webp', alt: 'BMW 2-es Gran Coupé utastér – BMW Curved Display' },
      { img: '/bmw/bmw-m235-negy-vegkifuvo.webp', alt: 'BMW M235 xDrive négy végkifúvós M kipufogó' },
      { img: '/bmw/bmw-2es-gran-coupe-m-sportulesek.webp', alt: 'BMW 2-es Gran Coupé M sportülések' },
    ],
    faq: [
      { q: 'Mennyibe kerül egy új BMW 2-es Gran Coupé Németországból?', a: 'A BMW 220 Gran Coupé nettó listaára a feltüntetett ártól indul, a felszereltségtől függően; az M235 xDrive a csúcsmodell. Magánszemélyként akár 19% német áfával rendelheted a müncheni Caradvance GmbH-n keresztül.' },
      { q: 'Melyik kivitelt válasszam — 220 Gran Coupé vagy M235 xDrive?', a: 'A <strong>220 Gran Coupé</strong> (170 LE) a kiegyensúlyozott, sportos belépő 48V-os mild-hybrid rendszerrel, első kerék hajtással. Az <strong>M235 xDrive</strong> (300 LE, 400 Nm) az M Performance csúcs: 4,9 mp-es gyorsulás, xDrive összkerékhajtás, adaptív M futómű. Segítünk kiválasztani a hozzád illő kivitelt.' },
      { q: 'Milyen gyors a BMW M235 xDrive Gran Coupé?', a: 'Az M235 xDrive 300 LE-t (221 kW) és 400 Nm nyomatékot ad le, 0-ról 100 km/h-ra 4,9 másodperc alatt gyorsul, végsebessége 250 km/h. Az összkerékhajtás és az adaptív M futómű minden körülmények között magabiztos.' },
      { q: 'Mekkora a BMW 2-es Gran Coupé csomagtartója?', a: 'A csomagtartó 430 liter, a hátsó ülések ledöntésével tovább bővíthető — a sportos coupé forma mellett is praktikus a mindennapokra.' },
      { q: 'Mennyi a BMW 2-es Gran Coupé fogyasztása?', a: 'WLTP szerint a 220 Gran Coupé kb. 5,6–5,8 l/100 km, a teljesítményorientált M235 xDrive kb. 8,0 l/100 km átlagfogyasztással üzemel — a konkrét érték a felszereltségtől és a vezetési stílustól függ.' },
      { q: 'Mennyivel olcsóbb a német áfás vásárlás?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett. A 8 százalékpontnyi különbség egy új BMW 2-es Gran Coupénál több százezer forintos megtakarítást jelenthet.' },
      { q: 'Lehet a BMW 2-es Gran Coupét lízingelni vagy finanszírozni?', a: 'Igen — a BMW 2-es Gran Coupé elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha nem szeretnél tulajdonolni, <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet, szervizzel és biztosítással együtt.' },
      { q: 'Bérelhető is a 2-es Gran Coupé?', a: 'Igen — a 2-es Gran Coupé <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető, egyetlen, kiszámítható havi díjjal, amiben a szerviz és a biztosítás is benne lehet.' },
      { q: 'Mennyi idő a behozatal?', a: 'A kiválasztott konfigurációtól függ, jellemzően néhány hét. A <a href="/beszerzesi-folyamat">beszerzési folyamat</a> minden lépését mi intézzük, a honosítással és forgalomba helyezéssel együtt.' },
    ],
    related: [
      { name: 'BMW 1-es', href: '/egyedi-auto-rendeles/1erb-benzin' },
      { name: 'BMW 2-es Active Tourer', href: '/egyedi-auto-rendeles/2eratb-benzin' },
      { name: 'BMW 4-es Gran Coupé', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW M2', href: '/egyedi-auto-rendeles?brand=bmw' },
    ],
    schema: {
      modelName: '2 Series Gran Coupé', modelDate: '2025', bodyTypeEn: 'Coupe', doors: 4,
      transmission: '7 fokozatú DKG automata', drive: 'FrontWheelDriveConfiguration',
      fuelType: 'Benzin', engineFuel: 'Benzin', powerKw: 125, torqueNm: 280,
      vmaxKmh: 230, accelSec: 7.9, cargoL: 430, consL: 5.7,
    },
  },

  '2ercb-benzin': {
    slug: '2ercb-benzin',
    brand: 'BMW', brandKey: 'bmw', brandLogo: '/bmw-hero-logo.png',
    name: 'BMW 2-es Coupé', modelCode: 'G42',
    title: 'BMW 2-es Coupé (G42) — új autó Németországból, egyedi rendelés | CarAdvance',
    description: 'Új BMW 2-es Coupé (220i, M240i xDrive) egyedi rendelése Németországból — hátsókerék-hajtású sportkupé, kulcsrakész behozatal, akár 19% német áfával. Ár, felszereltség, tartós bérlet.',
    netEur: 38908,
    orderKey: '2ercb', orderFuels: 'Benzin,Dízel',
    heroSub: 'Hátsókerék-hajtású sportkupé Németországból — klasszikus coupé arányok, M Performance hathengeres csúcs, digitális belső tér, új autóként, egyedi konfigurációval.',
    heroVideo: '/bmw/2ercb-hero.mp4',
    heroPoster: '/bmw/2ercb-hero-poster.webp',
    mainImg: '/bmw/bmw-2es-coupe-m240i-elolnezet.webp',
    mainAlt: 'BMW M240i xDrive Coupé – új autó Németországból, egyedi rendelés',
    chips: ['Coupé', 'Benzin', 'Hátsókerék-hajtás', 'Automata'],
    yearChip: '2026 · Németország',
    bodyType: '2 ajtós Coupé',
    overviewH2: 'Új BMW 2-es Coupé Németországból, egyedi rendelésre',
    overviewLead: 'A <strong>BMW 2-es Coupé</strong> (BMW 2 Series Coupé) a márka klasszikus, hátsókerék-hajtású sportkupéja: hosszú motorháztető, feszes arányok, precíz futómű és a legújabb digitális BMW-élmény. A CarAdvance-nél pontosan azt a <strong>BMW 220i</strong> vagy a hathengeres csúcsot jelentő <strong>BMW M240i xDrive</strong> kivitelt rendeljük meg neked, amit szeretnél — új autóként, gyári felszereltséggel, <a href="/beszerzesi-folyamat">Németországból, kulcsrakész behozatallal</a>. Nem szeretnél venni? A 2-es Coupé <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető.',
    highlights: [
      { icon: '◈', title: 'Hátsókerék-hajtás', text: 'Klasszikus BMW sportkupé-recept: hátsókerék-hajtás, tökéletes súlyelosztás, precíz kormányzás.' },
      { icon: '⚡', title: 'M Performance csúcs', text: 'Az M240i xDrive 374 LE-s hathengeressel, összkerékhajtással és 4,3 mp-es gyorsulással.' },
      { icon: '▦', title: 'Digitális utastér', text: 'BMW Curved Display és a legújabb iDrive — vezetőorientált, letisztult vezérlés.' },
      { icon: '€', title: 'Kedvező német ár', text: 'Magánszemélyként akár 19% német áfával — több százezer forint megtakarítás.' },
    ],
    design: {
      h3: 'Klasszikus coupé arányok, sportos karakter',
      text: 'A 2-es Coupé a hagyományos sportkupé formát viszi tovább: hosszú motorháztető, hátrahúzott utastér, széles nyomtáv és izmos hátsó sárvédők. Az M Sport és az M240i kivitel M-specifikus veserácsot, légterelőket és könnyűfém keréktárcsákat kap — pontosan úgy konfigurálva, ahogy te szeretnéd.',
      bullets: ['M Sport és M240i xDrive kivitel', 'Adaptív LED fényszórók', '18–19&quot; M könnyűfém keréktárcsák'],
      img: '/bmw/bmw-2es-coupe-kulso.webp', alt: 'BMW 2-es Coupé külső – klasszikus sportkupé arányok, oldalnézet',
    },
    interior: {
      h3: 'Vezetőorientált, digitális belső',
      text: 'A BMW Curved Display, a hangulatvilágítás és a minőségi kárpitok sportos, prémium környezetet teremtenek. Az M240i-ben M sportülések, M bőrkormány és piros kontrasztvarrás fokozzák a vezetői élményt.',
      bullets: ['BMW Curved Display + iDrive', 'M sportülések, M bőrkormány (M240i)', 'Vezeték nélküli Apple CarPlay / Android Auto'],
      img: '/bmw/bmw-2es-coupe-belso-ter.webp', alt: 'BMW 2-es Coupé belső tér – BMW Curved Display és iDrive',
    },
    prose: {
      h2: 'Új BMW 2-es Coupé Németországból — miért éri meg?',
      blocks: [
        { html: 'A <strong>BMW 2-es Coupé</strong> az egyik utolsó igazi, kompakt hátsókerék-hajtású sportkupé: a hosszú motorháztető és a feszes arányok mögött precíz futómű és a legújabb digitális BMW-élmény rejlik. Ha új autót szeretnél, a német piac kínálata nagyságrendekkel szélesebb a hazainál — így pontosan azt a motorizációt, színt és felszereltséget találjuk meg neked, amit elképzeltél. A CarAdvance 2003 óta hozza be a prémium autókat Németországból, <a href="/beszerzesi-folyamat">kulcsrakészen, teljes ügyintézéssel</a>.' },
        { h3: 'Mennyibe kerül egy új BMW 2-es Coupé?', html: 'A <strong>BMW 2-es Coupé ára</strong> a választott kiviteltől függ: a benzines <strong>BMW 220i</strong> a kiegyensúlyozott, hátsókerék-hajtású belépő, a <strong>BMW M240i xDrive</strong> pedig a 374 lóerős, hathengeres M Performance csúcsmodell összkerékhajtással. Igény szerint <strong>220d</strong> dízel és <strong>230i</strong> is rendelhető. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett.' },
        { h3: 'Melyik BMW 2-es Coupé kivitelt válaszd?', html: 'A <strong>220i</strong> (184 LE) a mindennapokra ideális, kedvező fenntartással és tiszta hátsókerék-hajtású élménnyel; az <strong>M240i xDrive</strong> (374 LE, 500 Nm) a csúcs: 4,3 mp alatt gyorsul 100-ra, sorhathengeres motorral, xDrive összkerékhajtással és M sportfékekkel. Mindkettőhöz 8 fokozatú Steptronic automata váltó jár.' },
        { h3: 'Megvásárolod, lízingeled vagy béreled?', html: 'Ahogy neked a legjobb: az egyedi rendelés mellett a 2-es Coupé elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha pedig nem szeretnél tulajdonolni, a modell <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet. Négyajtós, praktikusabb formát keresel? Nézd meg a <a href="/egyedi-auto-rendeles/2ergc-benzin">2-es Gran Coupét</a> is.' },
      ],
    },
    variants: [
      { key: '220i', label: 'BMW 220i', fuel: 'Benzin', power: '184 LE (135 kW)', torque: '300 Nm', drive: 'Hátsókerék / 8 fok. automata', accel: '7,5 mp', vmax: '236 km/h', cons: '~6,6 l/100 km', boot: '390 liter', rec: 'Kiegyensúlyozott, hátsókerekes belépő', img: '/bmw/bmw-220i-coupe-elolnezet.webp', alt: 'BMW 220i Coupé – elölnézet' },
      { key: 'm240i', label: 'BMW M240i xDrive', fuel: 'Benzin (sorhathengeres)', power: '374 LE (275 kW)', torque: '500 Nm', drive: 'xDrive összkerék / 8 fok. automata', accel: '4,3 mp', vmax: '250 km/h', cons: '~8,0 l/100 km', boot: '390 liter', rec: 'M Performance csúcs, hathengeres', img: '/bmw/bmw-m240i-coupe-elolnezet.webp', alt: 'BMW M240i xDrive Coupé – elölnézet' },
    ],
    gallery: [
      { img: '/bmw/bmw-2es-coupe-oldalnezet.webp', alt: 'BMW 2-es Coupé oldalnézet, sportkupé sziluett' },
      { img: '/bmw/bmw-2es-coupe-hatso-nezet.webp', alt: 'BMW 2-es Coupé hátsó nézet' },
      { img: '/bmw/bmw-2es-coupe-veserac.webp', alt: 'BMW 2-es Coupé veserács és LED fényszóró közelről' },
      { img: '/bmw/bmw-2es-coupe-felni.webp', alt: 'BMW 2-es Coupé M könnyűfém keréktárcsa' },
      { img: '/bmw/bmw-2es-coupe-muszerfal.webp', alt: 'BMW 2-es Coupé utastér – BMW Curved Display' },
      { img: '/bmw/bmw-2es-coupe-m-sportulesek.webp', alt: 'BMW 2-es Coupé M sportülések' },
    ],
    faq: [
      { q: 'Mennyibe kerül egy új BMW 2-es Coupé Németországból?', a: 'A BMW 220i Coupé nettó listaára a feltüntetett ártól indul, a felszereltségtől függően; az M240i xDrive a hathengeres csúcsmodell. Magánszemélyként akár 19% német áfával rendelheted a müncheni Caradvance GmbH-n keresztül.' },
      { q: 'Melyik kivitelt válasszam — 220i vagy M240i xDrive?', a: 'A <strong>220i</strong> (184 LE) a kiegyensúlyozott, hátsókerék-hajtású benzines belépő; az <strong>M240i xDrive</strong> (374 LE, 500 Nm) az M Performance csúcs sorhathengeres motorral, xDrive összkerékhajtással, 4,3 mp-es gyorsulással. Igény szerint 220d dízel és 230i is rendelhető.' },
      { q: 'Hátsókerék-hajtású a BMW 2-es Coupé?', a: 'Igen — a 220i, 230i és 220d hátsókerék-hajtású, ami a klasszikus BMW sportos vezetési élményt adja. Az M240i xDrive kizárólag összkerékhajtással (xDrive) érhető el a 374 LE biztonságos átviteléhez.' },
      { q: 'Milyen gyors a BMW M240i xDrive Coupé?', a: 'Az M240i xDrive 374 LE-t (275 kW) és 500 Nm nyomatékot ad le a 3,0 literes sorhathengeres motorból, 0-ról 100 km/h-ra 4,3 másodperc alatt gyorsul, végsebessége 250 km/h.' },
      { q: 'Mennyivel olcsóbb a német áfás vásárlás?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett. A 8 százalékpontnyi különbség egy új BMW 2-es Coupénál több százezer forintos megtakarítást jelenthet.' },
      { q: 'Lehet a BMW 2-es Coupét lízingelni vagy finanszírozni?', a: 'Igen — a BMW 2-es Coupé elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha nem szeretnél tulajdonolni, <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet, szervizzel és biztosítással együtt.' },
      { q: 'Bérelhető is a 2-es Coupé?', a: 'Igen — a 2-es Coupé <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető, egyetlen, kiszámítható havi díjjal, amiben a szerviz és a biztosítás is benne lehet.' },
      { q: 'Mennyi idő a behozatal?', a: 'A kiválasztott konfigurációtól függ, jellemzően néhány hét. A <a href="/beszerzesi-folyamat">beszerzési folyamat</a> minden lépését mi intézzük, a honosítással és forgalomba helyezéssel együtt.' },
    ],
    related: [
      { name: 'BMW 2-es Gran Coupé', href: '/egyedi-auto-rendeles/2ergc-benzin' },
      { name: 'BMW 1-es', href: '/egyedi-auto-rendeles/1erb-benzin' },
      { name: 'BMW M2', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW 4-es Coupé', href: '/egyedi-auto-rendeles?brand=bmw' },
    ],
    schema: {
      modelName: '2 Series Coupé', modelDate: '2021', bodyTypeEn: 'Coupe', doors: 2,
      transmission: '8 fokozatú Steptronic automata', drive: 'RearWheelDriveConfiguration',
      fuelType: 'Benzin, Dízel', engineFuel: 'Benzin', powerKw: 135, torqueNm: 300,
      vmaxKmh: 236, accelSec: 7.5, cargoL: 390, consL: 6.6,
    },
  },

  'ix3-elektromos': {
    slug: 'ix3-elektromos',
    brand: 'BMW', brandKey: 'bmw', brandLogo: '/bmw-hero-logo.png',
    name: 'BMW iX3', modelCode: 'NA5',
    title: 'BMW iX3 (Neue Klasse) — új elektromos SUV Németországból | CarAdvance',
    description: 'Új BMW iX3 50 xDrive (Neue Klasse) egyedi rendelése Németországból — akár 805 km hatótáv, 469 LE, xDrive, kulcsrakész behozatal, akár 19% német áfával. Ár, felszereltség, tartós bérlet.',
    netEur: 53277,
    orderKey: 'ix3', orderFuels: 'Elektromos',
    heroSub: 'Az új Neue Klasse elektromos SUV Németországból — akár 805 km hatótáv, Panoramic iDrive, xDrive, új autóként, egyedi konfigurációval.',
    heroVideo: '/bmw/ix3-hero.mp4',
    heroPoster: '/bmw/bmw-ix3-ezust-eleje.webp',
    mainImg: '/bmw/bmw-ix3-ezust-eleje.webp',
    mainAlt: 'BMW iX3 50 xDrive Space Silver – új elektromos SUV Németországból, egyedi rendelés',
    chips: ['Elektromos SUV', 'xDrive', 'Nagy hatótáv', 'Automata'],
    yearChip: '2026 · Németország',
    bodyType: 'Elektromos SUV',
    overviewH2: 'Új BMW iX3 Németországból, egyedi rendelésre',
    overviewLead: 'A <strong>BMW iX3</strong> a márka új <strong>Neue Klasse</strong> generációjának első modellje: tisztán elektromos prémium SUV, akár <strong>805 km hatótávval</strong>, teljesen új Panoramic iDrive kezelőfelülettel és 800V-os gyorstöltéssel. A CarAdvance-nél az <strong>iX3 50 xDrive</strong> kivitelt rendeljük meg neked, amit szeretnél — új autóként, gyári felszereltséggel, <a href="/beszerzesi-folyamat">Németországból, kulcsrakész behozatallal</a>. Nem szeretnél venni? Az iX3 <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető.',
    highlights: [
      { icon: '⚡', title: 'Akár 805 km hatótáv', text: 'A Neue Klasse 6. generációs akkumulátorával akár 805 km (WLTP) egyetlen töltéssel.' },
      { icon: '◈', title: 'xDrive, 469 LE', text: 'Összkerékhajtás, 4,9 mp 0–100 km/h — sportos és biztonságos minden körülmények közt.' },
      { icon: '▦', title: 'Panoramic iDrive', text: 'Teljesen új, a szélvédő teljes szélességében megjelenő kijelző és a legújabb operációs rendszer.' },
      { icon: '€', title: 'Kedvező német ár', text: 'Magánszemélyként akár 19% német áfával — több százezer forint megtakarítás.' },
    ],
    design: {
      h3: 'Neue Klasse formanyelv, tiszta vonalak',
      text: 'Az iX3 a BMW új, letisztult Neue Klasse dizájnját viszi tovább: modern, minimalista felületek, világító veserács (Iconic Glow) és aerodinamikus, mégis karakteres SUV forma. Pontosan úgy konfigurálva, ahogy te szeretnéd.',
      bullets: ['Neue Klasse dizájn, Iconic Glow veserács', 'Adaptív LED fényszórók', '20–21&quot; aerodinamikus könnyűfém keréktárcsák'],
      img: '/bmw/bmw-ix3-ezust-oldal.webp', alt: 'BMW iX3 külső – Neue Klasse formanyelv, oldalnézet',
    },
    interior: {
      h3: 'Panoramic iDrive, tágas elektromos utastér',
      text: 'A szélvédő teljes szélességében futó Panoramic Vision kijelző, a központi érintőképernyő és a hangulatvilágítás teljesen új, digitális élményt adnak. A lapos padló miatt az utastér és a csomagtér is kivételesen tágas.',
      bullets: ['BMW Panoramic iDrive + Panoramic Vision', 'Fenntartható anyaghasználat, hangulatvilágítás', 'Vezeték nélküli Apple CarPlay / Android Auto'],
      img: '/bmw/bmw-ix3-belso-ter.webp', alt: 'BMW iX3 belső tér – Panoramic iDrive kijelző',
    },
    prose: {
      h2: 'Új BMW iX3 Németországból — miért éri meg?',
      blocks: [
        { html: 'A <strong>BMW iX3</strong> a Neue Klasse új korszakának zászlóshajója: tisztán elektromos prémium SUV, amely a nagy hatótávot, a gyors töltést és a legújabb digitális BMW-élményt egyesíti. Ha új autót szeretnél, a német piac kínálata nagyságrendekkel szélesebb a hazainál — így pontosan azt a felszereltséget, színt és konfigurációt találjuk meg neked, amit elképzeltél. A CarAdvance 2003 óta hozza be a prémium autókat Németországból, <a href="/beszerzesi-folyamat">kulcsrakészen, teljes ügyintézéssel</a>.' },
        { h3: 'Mennyibe kerül egy új BMW iX3?', html: 'A <strong>BMW iX3 ára</strong> a felszereltségtől függ: az induló <strong>iX3 50 xDrive</strong> 469 LE-s, összkerékhajtású, akár 805 km hatótávú csúcsmodell. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett — ez önmagában több százezer forintos megtakarítás.' },
        { h3: 'Mekkora az iX3 hatótávja és milyen gyorsan tölt?', html: 'Az <strong>iX3 50 xDrive</strong> WLTP szerint akár <strong>805 km</strong> hatótávra képes egyetlen töltéssel. A 6. generációs, 800V-os rendszernek köszönhetően a gyorstöltőn néhány perc alatt több száz kilométernyi töltést vesz fel, így a hosszú utak sem jelentenek gondot.' },
        { h3: 'Megvásárolod, lízingeled vagy béreled?', html: 'Ahogy neked a legjobb: az egyedi rendelés mellett az iX3 elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha pedig nem szeretnél tulajdonolni, a modell <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet. Kisebb elektromos BMW-t keresel? Nézd meg hamarosan az <a href="/egyedi-auto-rendeles?brand=bmw">iX1 és iX2</a> modelleket is.' },
      ],
    },
    variants: [
      { key: 'ix3-50', label: 'BMW iX3 50 xDrive', fuel: 'Elektromos', power: '469 LE (345 kW)', torque: '645 Nm', drive: 'xDrive összkerék / 1 fok.', accel: '4,9 mp', vmax: '210 km/h', cons: '~18,5 kWh/100 km', boot: '520 liter', rec: 'Neue Klasse csúcs-EV, akár 805 km hatótáv', img: '/bmw/bmw-ix3-ezust-eleje.webp', alt: 'BMW iX3 50 xDrive – elölnézet' },
    ],
    gallery: [
      { img: '/bmw/bmw-ix3-ezust-part.webp', alt: 'BMW iX3 Space Silver, tengerparti úton menet közben' },
      { img: '/bmw/bmw-ix3-ezust-hegy.webp', alt: 'BMW iX3 Space Silver, hegyi úton menet közben' },
      { img: '/bmw/bmw-ix3-ezust-naplemente.webp', alt: 'BMW iX3 Space Silver, naplementében' },
      { img: '/bmw/bmw-ix3-ezust-oldal.webp', alt: 'BMW iX3 Space Silver, oldalnézet' },
      { img: '/bmw/bmw-ix3-ezust-hatso.webp', alt: 'BMW iX3 Space Silver, hátsó háromnegyedes nézet' },
      { img: '/bmw/bmw-ix3-ezust-hatso2.webp', alt: 'BMW iX3 Space Silver, hátsó nézet menet közben' },
      { img: '/bmw/bmw-ix3-ezust-hatso-static.webp', alt: 'BMW iX3 Space Silver, hátsó nézet' },
      { img: '/bmw/bmw-ix3-ezust-felni.webp', alt: 'BMW iX3 aerodinamikus könnyűfém keréktárcsa' },
      { img: '/bmw/bmw-ix3-veserac-iconic-glow.webp', alt: 'BMW iX3 Iconic Glow világító veserács' },
      { img: '/bmw/bmw-ix3-muszerfal.webp', alt: 'BMW iX3 utastér – Panoramic iDrive' },
      { img: '/bmw/bmw-ix3-ulesek.webp', alt: 'BMW iX3 ülések, prémium utastér' },
      { img: '/bmw/bmw-ix3-csomagter.webp', alt: 'BMW iX3 csomagtér' },
      { img: '/bmw/bmw-ix3-toltes.webp', alt: 'BMW iX3 töltés – 800V gyorstöltés' },
    ],
    faq: [
      { q: 'Mennyibe kerül egy új BMW iX3 Németországból?', a: 'Az iX3 50 xDrive nettó listaára a feltüntetett ártól indul, a felszereltségtől függően. Magánszemélyként akár 19% német áfával rendelheted a müncheni Caradvance GmbH-n keresztül.' },
      { q: 'Mekkora a BMW iX3 hatótávja?', a: 'Az iX3 50 xDrive WLTP szerint akár 805 km hatótávra képes egyetlen töltéssel, a Neue Klasse 6. generációs nagy energiasűrűségű akkumulátorának köszönhetően. A valós hatótáv a vezetési stílustól, hőmérséklettől és felszereltségtől függ.' },
      { q: 'Milyen gyorsan tölthető a BMW iX3?', a: 'A 800V-os rendszernek köszönhetően az iX3 gyorstöltőn néhány perc alatt több száz kilométernyi töltést vesz fel. Otthoni fali töltővel (wallbox) egy éjszaka alatt teljesen feltölthető.' },
      { q: 'Milyen erős és gyors az iX3 50 xDrive?', a: 'Az iX3 50 xDrive 469 LE-t (345 kW) és 645 Nm nyomatékot ad le, xDrive összkerékhajtással, 0-ról 100 km/h-ra 4,9 másodperc alatt gyorsul, végsebessége 210 km/h.' },
      { q: 'Mennyivel olcsóbb a német áfás vásárlás?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett. A 8 százalékpontnyi különbség egy új BMW iX3-nál több százezer forintos megtakarítást jelenthet.' },
      { q: 'Lehet a BMW iX3-at lízingelni vagy finanszírozni?', a: 'Igen — a BMW iX3 elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha nem szeretnél tulajdonolni, <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet, szervizzel és biztosítással együtt.' },
      { q: 'Bérelhető is a BMW iX3?', a: 'Igen — az iX3 <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető, egyetlen, kiszámítható havi díjjal, amiben a szerviz és a biztosítás is benne lehet.' },
      { q: 'Mennyi idő a behozatal?', a: 'A kiválasztott konfigurációtól függ, jellemzően néhány hét. A <a href="/beszerzesi-folyamat">beszerzési folyamat</a> minden lépését mi intézzük, a honosítással és forgalomba helyezéssel együtt.' },
    ],
    related: [
      { name: 'BMW iX1 (elektromos)', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW iX2 (elektromos)', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW X3', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW i4 (elektromos)', href: '/egyedi-auto-rendeles?brand=bmw' },
    ],
    schema: {
      modelName: 'iX3', modelDate: '2025', bodyTypeEn: 'SUV', doors: 5,
      transmission: '1 fokozatú automata (elektromos)', drive: 'AllWheelDriveConfiguration',
      fuelType: 'Elektromos', engineFuel: 'Elektromos', powerKw: 345, torqueNm: 645,
      vmaxKmh: 210, accelSec: 4.9, cargoL: 520, consL: 0,
    },
  },

  'x5-dizel': {
    slug: 'x5-dizel',
    brand: 'BMW', brandKey: 'bmw', brandLogo: '/bmw-hero-logo.png',
    name: 'BMW X5', modelCode: 'G65',
    title: 'BMW X5 (2026, új generáció) — prémium SUV Németországból | CarAdvance',
    description: 'Új BMW X5 (G65) egyedi rendelése Németországból — dízel, benzin mild-hybrid és plug-in hibrid, xDrive, Panoramic Vision. Kulcsrakész behozatal, akár 19% német áfával. Ár, felszereltség, tartós bérlet.',
    netEur: 80462,
    orderKey: 'x5', orderFuels: 'Benzin,Dízel,Plug-in hibrid',
    heroSub: 'Az új, G65 generációs X5 Németországból — xDrive összkerékhajtás, mild-hybrid és plug-in hibrid hajtás, Panoramic Vision, új autóként, egyedi konfigurációval.',
    heroVideo: '/caradvance-hero-x5.mp4',
    heroPoster: '/bmw/bmw-x5-studio-eleje.webp',
    mainImg: '/bmw/bmw-x5-studio-eleje.webp',
    mainAlt: 'BMW X5 – új generációs prémium SUV Németországból, egyedi rendelés',
    chips: ['Prémium SUV', 'xDrive', 'Mild-hybrid', 'Automata'],
    yearChip: '2026 · Németország',
    bodyType: 'Prémium SUV',
    overviewH2: 'Új BMW X5 Németországból, egyedi rendelésre',
    overviewLead: 'A <strong>BMW X5</strong> a márka ikonikus nagy prémium SUV-ja, most a teljesen új <strong>G65</strong> generációban: modernebb formavilág, digitális <strong>Panoramic Vision</strong> utastér és széles hajtáslánc-kínálat — <strong>dízel (40d), benzin mild-hybrid (xDrive40)</strong> és <strong>plug-in hibrid (50e, M60e)</strong>. A CarAdvance-nél pontosan azt az X5-öt rendeljük meg neked, amelyiket szeretnéd — új autóként, gyári felszereltséggel, <a href="/beszerzesi-folyamat">Németországból, kulcsrakész behozatallal</a>. Nem szeretnél venni? Az X5 <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető.',
    highlights: [
      { icon: '◈', title: 'xDrive, akár 400 LE', text: 'Az xDrive40 benzin mild-hybrid 400 LE-vel és 8 fokozatú automatával — összkerékhajtás minden körülményre.' },
      { icon: '⛽', title: 'Dízel, benzin vagy PHEV', text: 'Válaszd a takarékos 40d dízelt, a benzines mild-hybridet vagy a plug-in hibrid 50e / M60e kivitelt.' },
      { icon: '▦', title: 'Panoramic Vision', text: 'A szélvédő teljes szélességében megjelenő kijelző, Free-Cut központi képernyő és utasoldali kijelző.' },
      { icon: '€', title: 'Kedvező német ár', text: 'Magánszemélyként akár 19% német áfával — egy X5-nél ez több millió forint megtakarítást jelenthet.' },
    ],
    design: {
      h3: 'Nagyobb jelenlét, letisztult felületek',
      text: 'Az új X5 markánsabb, mégis elegánsabb: karakteresen megrajzolt, választhatóan világító veserács, keskenyebb fényszóró-grafika és tiszta oldalfelületek. Pontosan úgy konfigurálva, ahogy te szeretnéd — színben, keréktárcsában és felszereltségben.',
      bullets: ['Új, opcionálisan világító veserács (Iconic Glow)', 'Adaptív LED / Matrix fényszórók', '20–23&quot; könnyűfém keréktárcsák, M Sport csomagok'],
      img: '/bmw/bmw-x5-studio-oldal.webp', alt: 'BMW X5 külső – oldalnézet, új G65 formanyelv',
    },
    interior: {
      h3: 'Panoramic Vision, tágas prémium utastér',
      text: 'A szélvédő teljes szélességében futó Panoramic Vision kijelző, a Free-Cut kialakítású központi érintőképernyő és az utasoldali kijelző teljesen új, digitális élményt adnak. Az X5 utastere és 620 literes csomagtartója a hosszú utakon és a mindennapokban is kivételesen tágas.',
      bullets: ['BMW Panoramic Vision + Free-Cut központi kijelző', 'Utasoldali kijelző, prémium anyaghasználat', 'Vezeték nélküli Apple CarPlay / Android Auto'],
      img: '/bmw/bmw-x5-studio-belso.webp', alt: 'BMW X5 belső tér – Panoramic Vision kijelző',
    },
    prose: {
      h2: 'Új BMW X5 Németországból — miért éri meg?',
      blocks: [
        { html: 'A <strong>BMW X5</strong> évtizedek óta a nagy prémium SUV mércéje: tágas, sokoldalú, mégis sportos vezetési élményt kínál. Ha új autót szeretnél, a német piac kínálata nagyságrendekkel szélesebb a hazainál — így pontosan azt a hajtásláncot, felszereltséget, színt és konfigurációt találjuk meg neked, amit elképzeltél. A CarAdvance 2003 óta hozza be a prémium autókat Németországból, <a href="/beszerzesi-folyamat">kulcsrakészen, teljes ügyintézéssel</a>.' },
        { h3: 'Melyik X5 hajtáslánc való nekem?', html: 'A <strong>40d dízel</strong> a nagy futásteljesítményű, hosszú utakat járó tulajdonosok kedvence — kiváló nyomaték és fogyasztás. A benzines <strong>xDrive40 mild-hybrid</strong> kulturált, csendes és erős (400 LE). Aki tölteni is szeretne, a <strong>50e plug-in hibrid</strong> jelentős tisztán elektromos hatótávot ad, a csúcs <strong>M60e</strong> pedig M Performance teljesítményt. Segítünk kiválasztani a hozzád illő kivitelt.' },
        { h3: 'Mennyibe kerül egy új BMW X5?', html: 'A <strong>BMW X5 ára</strong> a hajtáslánctól és a felszereltségtől függ. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett — egy ekkora autónál ez több millió forintos megtakarítást is jelenthet. Pontos, személyre szabott árajánlatért keress minket.' },
        { h3: 'Megvásárolod, lízingeled vagy béreled?', html: 'Ahogy neked a legjobb: az egyedi rendelés mellett az X5 elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha pedig nem szeretnél tulajdonolni, a modell <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet. Nagyobb vagy kupé-formájú testvért keresel? Nézd meg a <a href="/egyedi-auto-rendeles?brand=bmw">BMW X6, X7 és iX</a> modelleket is.' },
      ],
    },
    variants: [
      { key: 'x5-40', label: 'BMW X5 xDrive40', fuel: 'Benzin (mild-hybrid)', power: '400 LE (294 kW)', torque: '580 Nm', drive: 'xDrive összkerék / 8 fok. aut.', accel: '5,3 mp', vmax: '250 km/h', cons: '~8,5 l/100 km', boot: '620 liter', rec: 'Kulturált, erős benzines belépő', img: '/bmw/bmw-x5-studio-elol34.webp', alt: 'BMW X5 xDrive40 – elölnézet' },
    ],
    gallery: [
      { img: '/bmw/bmw-x5-studio-elol34.webp', alt: 'BMW X5 stúdiófotó – elölnézet háromnegyedből' },
      { img: '/bmw/bmw-x5-studio-oldal.webp', alt: 'BMW X5 stúdiófotó – oldalnézet' },
      { img: '/bmw/bmw-x5-studio-elol2.webp', alt: 'BMW X5 stúdiófotó – elölnézet' },
      { img: '/bmw/bmw-x5-studio-hatso34.webp', alt: 'BMW X5 stúdiófotó – hátsó háromnegyedes nézet' },
      { img: '/bmw/bmw-x5-studio-hatso.webp', alt: 'BMW X5 stúdiófotó – hátsó nézet' },
      { img: '/bmw/bmw-x5-studio-belso.webp', alt: 'BMW X5 utastér – Panoramic Vision műszerfal' },
      { img: '/bmw/bmw-x5-studio-cockpit.webp', alt: 'BMW X5 vezetőtér – kormány és kijelzők' },
      { img: '/bmw/bmw-x5-studio-ulesek.webp', alt: 'BMW X5 prémium bőr ülések, világos utastér' },
      { img: '/bmw/bmw-x5-studio-konzol.webp', alt: 'BMW X5 középkonzol, prémium kialakítás' },
      { img: '/bmw/bmw-x5-studio-veserac.webp', alt: 'BMW X5 világító veserács (Iconic Glow), közeli nézet' },
      { img: '/bmw/bmw-x5-studio-fenyszoro.webp', alt: 'BMW X5 fényszóró, közeli nézet' },
      { img: '/bmw/bmw-x5-studio-felni.webp', alt: 'BMW X5 könnyűfém keréktárcsa, közeli nézet' },
      { img: '/bmw/bmw-x5-coast.webp', alt: 'BMW X5 tengerparti úton, menet közben' },
      { img: '/bmw/bmw-x5-side.webp', alt: 'BMW X5 hegyi úton, oldalnézet' },
      { img: '/bmw/bmw-x5-feher-eleje.webp', alt: 'BMW X5 M60e fehér színben, elölnézet' },
      { img: '/bmw/bmw-x5-feher-part.webp', alt: 'BMW X5 M60e fehér színben, tengerparti úton' },
    ],
    faq: [
      { q: 'Mennyibe kerül egy új BMW X5 Németországból?', a: 'A BMW X5 nettó listaára a hajtáslánctól és a felszereltségtől függ, a feltüntetett ártól indul. Magánszemélyként akár 19% német áfával rendelheted a müncheni Caradvance GmbH-n keresztül — pontos árajánlatért keress minket.' },
      { q: 'Milyen hajtásláncok érhetők el az új X5-höz?', a: 'Az új G65 X5 elérhető 40d dízel, xDrive40 benzin mild-hybrid, valamint 50e és M60e plug-in hibrid kivitelben. Mindegyik xDrive összkerékhajtással és 8 fokozatú automata váltóval érkezik. Segítünk kiválasztani a hozzád legjobban illő változatot.' },
      { q: 'Milyen erős és gyors az X5 xDrive40?', a: 'A benzines xDrive40 mild-hybrid 400 LE-t (294 kW) és 580 Nm nyomatékot ad le, xDrive összkerékhajtással, 0-ról 100 km/h-ra 5,3 másodperc alatt gyorsul, végsebessége 250 km/h.' },
      { q: 'Mekkora az X5 csomagtartója?', a: 'Az új BMW X5 csomagtartója kb. 620 liter, amely a hátsó ülések lehajtásával jelentősen bővíthető — ideális családi és hosszú távú használatra egyaránt.' },
      { q: 'Mennyivel olcsóbb a német áfás vásárlás?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett. A 8 százalékpontnyi különbség egy új BMW X5-nél több millió forintos megtakarítást is jelenthet.' },
      { q: 'Lehet a BMW X5-öt lízingelni vagy finanszírozni?', a: 'Igen — a BMW X5 elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha nem szeretnél tulajdonolni, <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is a tiéd lehet, szervizzel és biztosítással együtt.' },
      { q: 'Bérelhető is a BMW X5?', a: 'Igen — az X5 <a href="/uj-auto-berlese?brand=bmw">tartós bérletben</a> is elérhető, egyetlen, kiszámítható havi díjjal, amiben a szerviz és a biztosítás is benne lehet.' },
      { q: 'Mennyi idő a behozatal?', a: 'A kiválasztott konfigurációtól függ, jellemzően néhány hét. A <a href="/beszerzesi-folyamat">beszerzési folyamat</a> minden lépését mi intézzük, a honosítással és forgalomba helyezéssel együtt.' },
    ],
    related: [
      { name: 'BMW X6', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW X7', href: '/egyedi-auto-rendeles?brand=bmw' },
      { name: 'BMW iX3', href: '/egyedi-auto-rendeles/ix3-elektromos' },
      { name: 'BMW X3', href: '/egyedi-auto-rendeles?brand=bmw' },
    ],
    schema: {
      modelName: 'X5 xDrive40', modelDate: '2026', bodyTypeEn: 'SUV', doors: 5,
      transmission: '8 fokozatú automata (Steptronic)', drive: 'AllWheelDriveConfiguration',
      fuelType: 'Benzin (mild-hybrid)', engineFuel: 'Benzin', powerKw: 294, torqueNm: 580,
      vmaxKmh: 250, accelSec: 5.3, cargoL: 620, consL: 8.5,
    },
  },
};
