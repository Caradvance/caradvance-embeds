// MINI bérlési tartalom (Cooper, Cooper Cabrio, Countryman) — sajtófotók: press.bmwgroup.com (MINI).
// Számok (ár, km, futamidő, kaució) NEM itt vannak: azok a napi Choice-szinkronból jönnek.
import type { RentalContent } from './rentalPage';

const P = (m: string, k: string) => `/berles-press/${m}-${k}.webp`;
const G = (m: string, name: string, items: [string, string][]) => items.map(([k, alt]) => ({ img: P(m, k), alt: `${name} ${alt}` }));

export const MINI: Record<string, RentalContent> = {
  'MINI Cooper': {
    mainImg: P('mini-cooper', 'main'), mainAlt: 'MINI Cooper bérlés — az új MINI Cooper S tartós bérletben',
    body: 'Kisautó',
    overviewH2: 'MINI Cooper tartós bérlet — az ikonikus prémium kisautó havidíjjal',
    guideIntro: 'Az új <strong>MINI Cooper</strong> (J01) a legendás brit kisautó legújabb generációja: gokartszerű vezetési élmény, prémium belső tér és a városban verhetetlen méretek. <strong>Tartós bérletben</strong> önerő és értékvesztés nélkül vezetheted a <strong>MINI Cooper S</strong>-t vagy a 231 lóerős <strong>John Cooper Works</strong>-öt — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'MINI Cooper S vagy John Cooper Works?', html: 'A <strong>Cooper S</strong> 204 lóerős, kétliteres turbómotorja a mindennapokban is fürge és takarékos — ez a legnépszerűbb MINI. A <strong>John Cooper Works (JCW)</strong> 231 lóerővel, sportfutóművel, erősebb fékekkel és egyedi JCW dizájnnal a legsportosabb MINI: 0–100 km/h 6,1 másodperc alatt.' },
      { h3: 'Kinek ajánljuk a MINI Cooper bérlését?', html: 'Városi autósoknak, akik prémium minőséget és karaktert keresnek kis méretben: könnyű parkolni, fürge a forgalomban, mégis kényelmes autópályán is. Második autónak a családba, és reprezentatív céges autónak egyaránt népszerű.' },
      { h3: 'MINI Cooper méretek és csomagtér', html: 'A háromajtós MINI Cooper hossza 3876 mm, szélessége 1744 mm, magassága 1432 mm, tengelytávja 2495 mm. A csomagtér 210 literes, a hátsó ülések döntésével 725 literre bővíthető.' },
    ],
    design: { h3: 'Ikonikus forma, letisztult részletek', text: 'Az új MINI Cooper megtartotta a klasszikus arányokat — kerek fényszórók, rövid túlnyúlások, lebegő tető —, de letisztultabb, modernebb lett: kevesebb krómdísz, választható LED fénygrafikák és a háromszögletű hátsó lámpák.', bullets: ['Kerek LED fényszórók választható fénymintával', 'Kontrasztszínű tető és tükörház', '17–18" könnyűfém keréktárcsák (felszereltségtől függően)'], img: P('mini-cooper', 'design'), alt: 'MINI Cooper hátulról, háromszögletű LED hátsó lámpák' },
    interior: { h3: 'Kerek OLED kijelző, textil műszerfal', text: 'A műszerfal közepén a 24 cm-es kerek OLED érintőképernyő minden funkciót egy helyen kezel, alatta a klasszikus MINI kapcsolósor az indítóval és a menetkapcsolóval. A műszerfalat újrahasznosított textil borítja, a MINI Experience Modes pedig a fényeket, hangokat és a kijelző megjelenését is megváltoztatja.', bullets: ['24 cm-es kerek OLED kijelző, MINI Operating System 9', 'MINI Experience Modes', 'Head-up kijelző, vezeték nélküli okostelefon-integráció (felszereltségtől függően)'] },
    boot: '210–725 liter',
    specs: {
      'S': { label: 'Cooper S', fuel: 'Benzin', power: '204 LE (150 kW)', torque: '300 Nm', drive: 'Elsőkerék / 7 fok. duplakuplungos', accel: '6,6 mp', vmax: '242 km/h', boot: '210–725 liter', rec: 'A legnépszerűbb, sportos és takarékos', note: 'kétliteres turbó, fürge és takarékos', img: P('mini-cooper', 'g3') },
      'JCW': { label: 'John Cooper Works', fuel: 'Benzin', power: '231 LE (170 kW)', torque: '380 Nm', drive: 'Elsőkerék / 7 fok. duplakuplungos', accel: '6,1 mp', vmax: '250 km/h', boot: '210–725 liter', rec: 'A legsportosabb MINI', note: 'sportfutómű, JCW fékek és dizájn', img: P('mini-cooper', 'g1') },
    },
    gallery: G('mini-cooper', 'MINI Cooper', [['g1', 'British Racing Green színben, városban'], ['g2', 'mediterrán utcán'], ['g3', 'kék színben, menet közben'], ['g4', 'Ocean Wave Green színben'], ['g5', 'elölnézet, stúdiófotó'], ['g6', 'hegyi úton'], ['v1', 'elölnézet, kerek LED fényszórók']]),
    faqExtra: [
      { q: 'Mennyi a MINI Cooper S teljesítménye?', a: 'A MINI Cooper S kétliteres turbómotorja 204 lóerős (150 kW) és 300 Nm nyomatékú, 0–100 km/h 6,6 mp. A John Cooper Works 231 lóerős, 0–100 km/h 6,1 mp.' },
      { q: 'Mekkora a MINI Cooper csomagtartója?', a: 'A háromajtós MINI Cooper csomagtere 210 literes, a hátsó ülések döntésével 725 literre bővíthető.' },
    ],
    schema: { doors: 3, drive: 'FWD' },
  },

  'MINI Cooper Cabrio': {
    mainImg: P('mini-cooper-cabrio', 'main'), mainAlt: 'MINI Cooper Cabrio bérlés — kabrió tartós bérletben',
    body: 'Kabrió',
    overviewH2: 'MINI Cooper Cabrio tartós bérlet — nyitott tetős élmény havidíjjal',
    guideIntro: 'Az új <strong>MINI Cooper Cabrio</strong> az egyik legkedveltebb négyüléses kabrió: 18 másodperc alatt nyíló vászontető, négy ülés és a MINI gokartszerű vezetési élménye. <strong>Cabrio bérlés</strong> tartós bérletben: nem kell önerőt letenned, nem kell a téli tárolással és a továbbeladással foglalkoznod — egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Cooper C, Cooper S vagy JCW Cabrio?', html: 'A <strong>Cooper C Cabrio</strong> 163 lóerős háromhengeres turbómotorja takarékos és bőven elég a nyugodt, nyitott tetős cirkáláshoz. A <strong>Cooper S Cabrio</strong> 204 lóerejével már kifejezetten sportos, a <strong>John Cooper Works Cabrio</strong> pedig 231 lóerővel és sportfutóművel a legdinamikusabb nyitott MINI.' },
      { h3: 'Hogyan működik a MINI Cabrio teteje?', html: 'Az elektromos vászontető 18 másodperc alatt nyílik vagy zárul, akár 30 km/h sebességig menet közben is. Részlegesen is nyitható, napfénytetőként — így esősebb napokon is élvezheted a friss levegőt.' },
      { h3: 'MINI Cooper Cabrio méretek és csomagtér', html: 'Hossz 3879 mm, szélesség 1744 mm, tengelytáv 2495 mm. A csomagtér nyitott tetővel 160, zárt tetővel 215 liter, a hátsó ülések dönthetők.' },
    ],
    design: { h3: 'Négy ülés, nyitott ég', text: 'A Cabrio megőrzi a MINI klasszikus arányait, a vászontető pedig zárt állapotban is elegáns, tiszta tetővonalat ad. Kerek LED fényszórók, háromszögletű hátsó lámpák és választható tetőszínek teszik egyedivé.', bullets: ['Elektromos vászontető, 18 mp alatt nyílik', 'Napfénytető-funkció, menet közben 30 km/h-ig', 'Borulásvédelmi rendszer, négy ülés'], img: P('mini-cooper-cabrio', 'design'), alt: 'MINI Cooper Cabrio nyitott tetővel, menet közben' },
    interior: { h3: 'Prémium utastér nyitott tetővel', text: 'A kerek OLED kijelző, a textilborítású műszerfal és a klasszikus kapcsolósor a Cabrióban is megvan; a kabrióhoz tervezett klíma- és hangrendszer nyitott tetővel is kellemes utazást biztosít.', bullets: ['24 cm-es kerek OLED kijelző', 'Ülésfűtés, kormányfűtés (felszereltségtől függően)', 'MINI Experience Modes'] },
    boot: '160–215 liter',
    specs: {
      'C': { label: 'Cooper C Cabrio', fuel: 'Benzin', power: '163 LE (120 kW)', torque: '250 Nm', drive: 'Elsőkerék / 7 fok. duplakuplungos', accel: '8,4 mp', vmax: '222 km/h', rec: 'Takarékos nyitott tetős cirkálás', note: 'háromhengeres turbó, takarékos', img: P('mini-cooper-cabrio', 'g2') },
      'S': { label: 'Cooper S Cabrio', fuel: 'Benzin', power: '204 LE (150 kW)', torque: '300 Nm', drive: 'Elsőkerék / 7 fok. duplakuplungos', accel: '7,1 mp', vmax: '237 km/h', rec: 'Sportos kabrió', note: 'kétliteres turbó, sportos', img: P('mini-cooper-cabrio', 'design') },
      'JCW': { label: 'John Cooper Works Cabrio', fuel: 'Benzin', power: '231 LE (170 kW)', torque: '380 Nm', drive: 'Elsőkerék / 7 fok. duplakuplungos', accel: '6,4 mp', vmax: '250 km/h', rec: 'A legsportosabb nyitott MINI', note: 'sportfutómű, JCW dizájn', img: P('mini-cooper-cabrio', 'g1') },
    },
    gallery: G('mini-cooper-cabrio', 'MINI Cooper Cabrio', [['g1', 'zöld és szürke színben'], ['g2', 'tengerparti úton'], ['design', 'pálmafák között, nyitott tetővel']]),
    faqExtra: [
      { q: 'Menet közben is nyitható a MINI Cabrio teteje?', a: 'Igen, az elektromos vászontető 30 km/h sebességig menet közben is nyitható és zárható, a művelet kb. 18 másodperc.' },
      { q: 'Érdemes kabriót tartós bérletben használni?', a: 'Igen: a tartós bérlet havidíjában benne van a szerviz, az adó és a téli-nyári gumi, így egész évben gond nélkül használhatod — a vászontető zárt állapotban télen is jól szigetel.' },
    ],
    schema: { doors: 2, drive: 'FWD' },
  },

  'MINI Countryman': {
    mainImg: P('mini-countryman', 'main'), mainAlt: 'MINI Countryman bérlés — az új MINI Countryman S ALL4 tartós bérletben',
    body: 'Kompakt SUV',
    overviewH2: 'MINI Countryman tartós bérlet — a legnagyobb MINI havidíjjal',
    guideIntro: 'Az új <strong>MINI Countryman</strong> (U25) a márka eddigi legnagyobb modellje: 4,4 méteres kompakt SUV, 460 literes csomagtartóval, magas üléspozícióval és <strong>ALL4 összkerékhajtással</strong>. <strong>Tartós bérletben</strong> családi autónak és céges autónak is ideális — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Miért a MINI Countryman S ALL4?', html: 'A <strong>Countryman S ALL4</strong> turbómotorja és az ALL4 összkerékhajtás télen, rossz útviszonyok között és utánfutóval is magabiztos. A MINI karakterét tágas, családbarát térrel ötvözi — ez a legsokoldalúbb MINI.' },
      { h3: 'MINI Countryman méretek és csomagtér', html: 'Hossz 4433 mm, szélesség 1843 mm, magasság 1656 mm, tengelytáv 2692 mm. A csomagtér 460 literes, a hátsó ülések döntésével 1450 literre bővíthető; a hátsó üléssor hosszirányban is állítható.' },
      { h3: 'MINI Countryman vagy BMW X1?', html: 'A két modell közös alapokra épül. A <strong>Countryman</strong> játékosabb, egyedibb dizájnt és a MINI jellegzetes kerek kijelzőjét kínálja, a <strong>BMW X1</strong> klasszikusabb prémium SUV. Méretben és csomagtérben közel azonosak — a választás ízlés kérdése.' },
    ],
    design: { h3: 'Robusztus SUV, MINI karakter', text: 'Az új Countryman szögletesebb és magabiztosabb lett: függőleges, nyolcszögletű hűtőrács, egyedi LED fénygrafika, széles vállak és egyenes tetővonal. Az új Countryman kint és bent is a legnagyobb MINI.', bullets: ['Nyolcszögletű hűtőrács, egyedi LED fénygrafikák', 'Kontrasztszínű tető, tetősínek', 'Elektromos csomagtérajtó (felszereltségtől függően)'], img: P('mini-countryman', 'design'), alt: 'MINI Countryman menet közben, sivatagi úton' },
    interior: { h3: 'Tágas utastér, kerek OLED kijelző', text: 'A 24 cm-es kerek OLED kijelző, a textilborítású műszerfal és a magas üléspozíció kényelmes, modern utasteret ad. Hátul felnőttek is kényelmesen utaznak, a hátsó üléssor 13 cm-t csúsztatható és 40:20:40 arányban dönthető.', bullets: ['24 cm-es kerek OLED kijelző', 'Csúsztatható hátsó üléssor, 40:20:40 döntés', 'Head-up kijelző, vezeték nélküli okostelefon-integráció (felszereltségtől függően)'] },
    boot: '460–1450 liter',
    specs: {
      'S All4': { label: 'Countryman S ALL4', fuel: 'Benzin', power: '204 LE (150 kW)', drive: 'ALL4 összkerék / 7 fok. duplakuplungos', boot: '460–1450 liter', rec: 'Összkerékhajtású családi SUV', note: 'turbómotor, ALL4 összkerékhajtás', img: P('mini-countryman', 'g4') },
    },
    gallery: G('mini-countryman', 'MINI Countryman', [['g1', 'piros színben, havas hegyek előtt'], ['g2', 'városban'], ['g3', 'téli tájban'], ['g4', 'pálmafák között'], ['design', 'kanyargós úton']]),
    faqExtra: [
      { q: 'Mekkora a MINI Countryman csomagtartója?', a: 'Az új MINI Countryman csomagtere 460 literes, a hátsó ülések döntésével 1450 literre bővíthető.' },
      { q: 'Összkerékhajtású a bérelhető MINI Countryman?', a: 'Igen, a Countryman S ALL4 összkerékhajtású — télen és rossz útviszonyok között is biztonságos.' },
    ],
    schema: { doors: 5, drive: 'AWD' },
  },
};
