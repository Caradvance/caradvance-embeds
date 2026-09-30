// MINI — egyedi rendelés (eladás) oldalak tartalma. Kulcs = oldal slug (egyediCars.ts).
import type { SaleFacts } from './salePage';

const DCT = 'Elsőkerék / 7 fok. duplakuplungos';

export const SALE_MINI: Record<string, SaleFacts> = {
  'mini-cooper': {
    code: 'J01', tagline: 'Az ikonikus MINI Cooper 3 ajtós — Cooper C, Cooper S vagy JCW, új autóként Németországból.',
    lead: 'Az új <strong>MINI Cooper</strong> (J01) a legendás brit kisautó legújabb generációja: gokartszerű vezetési élmény, kerek OLED kijelző és prémium, textilborítású utastér.',
    about: 'Az új <strong>MINI Cooper</strong> letisztultabb lett, de megtartotta a klasszikus arányokat és karaktert. A német kínálatból pontosan azt a színt, tetőszínt, csíkokat és felszereltségi csomagot rendeljük meg, amit szeretnél — a MINI-nél a személyre szabás a lényeg. Magánszemélyként akár <strong>19% német áfával</strong> vásárolhatsz.',
    choose: 'A <strong>Cooper C</strong> (156 LE) a takarékos, városi választás, a <strong>Cooper S</strong> (204 LE) a legnépszerűbb, sportos kivitel, a <strong>John Cooper Works</strong> (231 LE) pedig a legsportosabb MINI — erről a <a href="/egyedi-auto-rendeles/mini-john-cooper-works">MINI JCW</a> oldalon olvashatsz.',
    engines: [
      ['MINI Cooper C', 'Benzin', '156 LE (115 kW)', '230 Nm', DCT, '7,7 mp', '225 km/h'],
      ['MINI Cooper S', 'Benzin', '204 LE (150 kW)', '300 Nm', DCT, '6,6 mp', '242 km/h'],
    ],
    boot: '210–725 liter', press: 'mini-cooper', rent: 'mini-cooper', noInterior: true, doors: 3,
    design: ['Ikonikus forma, letisztult részletek', 'Kerek fényszórók választható fénymintával, rövid túlnyúlások, lebegő, kontrasztszínű tető és háromszögletű hátsó lámpák.', ['Kerek LED fényszórók fénymintákkal', 'Kontrasztszínű tető és tükörház', '16–18" keréktárcsák']],
    interior: ['Kerek OLED kijelző, textil műszerfal', 'A 24 cm-es kerek OLED érintőképernyő, a klasszikus kapcsolósor és a MINI Experience Modes egyedi hangulatot ad.', ['24 cm-es kerek OLED kijelző', 'MINI Experience Modes', 'Head-up kijelző (opció)']],
    rel: ['mini-cooper-5-ajtos', 'mini-john-cooper-works', 'mini-cooper-cabrio', 'mini-countryman'],
  },
  'mini-cooper-5-ajtos': {
    code: 'F65', tagline: 'MINI Cooper 5 ajtós — több hely, ugyanaz a gokart-érzés. Új autóként Németországból.',
    lead: 'A <strong>MINI Cooper 5 ajtós</strong> hosszabb tengelytávval és két hátsó ajtóval ad több helyet — a MINI vezetési élményéből semmit sem veszít.',
    about: 'Az <strong>5 ajtós Cooper</strong> ideális, ha rendszeresen utaznak hátul is: könnyebb beszállás, nagyobb lábtér és 275 literes csomagtér. Új generációs OLED kijelző, prémium anyagok és a teljes MINI személyre szabási kínálat — Németországból, kulcsrakész behozatallal.',
    choose: 'A <strong>Cooper C</strong> (156 LE) a takarékos, a <strong>Cooper S</strong> (204 LE) a dinamikus választás — mindkettő 7 fokozatú duplakuplungos váltóval.',
    engines: [
      ['MINI Cooper C 5 ajtós', 'Benzin', '156 LE (115 kW)', '230 Nm', DCT, '8,0 mp', '225 km/h'],
      ['MINI Cooper S 5 ajtós', 'Benzin', '204 LE (150 kW)', '300 Nm', DCT, '6,8 mp', '242 km/h'],
    ],
    boot: '275–925 liter', press: 'mini-cooper', noInterior: true,
    design: ['Klasszikus MINI, öt ajtóval', 'A jellegzetes MINI-arcot és a lebegő tetőt hosszabb tengelytáv és két hátsó ajtó egészíti ki.', ['Kerek LED fényszórók', 'Kontrasztszínű tető', 'Hosszabb tengelytáv, két hátsó ajtó']],
    interior: ['Tágasabb utastér', 'Kerek OLED kijelző, textilborítású műszerfal és kényelmesebb hátsó üléssor.', ['24 cm-es kerek OLED kijelző', 'Nagyobb hátsó lábtér', '275 literes csomagtér']],
    rel: ['mini-cooper', 'mini-countryman', 'mini-john-cooper-works', '1erb-benzin'],
  },
  'mini-cooper-cabrio': {
    code: 'F67', tagline: 'MINI Cooper Cabrio — négyüléses kabrió 18 mp alatt nyíló tetővel, Németországból.',
    lead: 'Az új <strong>MINI Cooper Cabrio</strong> az egyik legkedveltebb négyüléses kabrió: elektromos vászontető, napfénytető-funkció és MINI gokart-érzés.',
    about: 'A <strong>Cooper Cabrio</strong> tetője 18 másodperc alatt nyílik, 30 km/h-ig menet közben is. A német kínálatból egyedi tetőszínnel (akár Union Jack mintával), a kívánt motorral és felszereltséggel rendeljük meg — magánszemélyként akár 19% német áfával.',
    choose: 'A <strong>Cooper C Cabrio</strong> (163 LE) a nyugodt nyitott cirkálásra, a <strong>Cooper S Cabrio</strong> (204 LE) a sportos, a <a href="/egyedi-auto-rendeles/mini-john-cooper-works-cabrio">JCW Cabrio</a> (231 LE) a legdinamikusabb nyitott MINI.',
    engines: [
      ['MINI Cooper C Cabrio', 'Benzin', '163 LE (120 kW)', '250 Nm', DCT, '8,4 mp', '222 km/h'],
      ['MINI Cooper S Cabrio', 'Benzin', '204 LE (150 kW)', '300 Nm', DCT, '7,1 mp', '237 km/h'],
    ],
    boot: '160–215 liter', press: 'mini-cooper-cabrio', rent: 'mini-cooper-cabrio', noInterior: true, doors: 2,
    design: ['Négy ülés, nyitott ég', 'Elektromos vászontető, borulásvédelem és a MINI klasszikus arányai.', ['Elektromos vászontető, 18 mp', 'Napfénytető-funkció', 'Választható tetőszínek']],
    interior: ['Prémium utastér nyitott tetővel', 'Kerek OLED kijelző és kabrióra hangolt klíma.', ['24 cm-es kerek OLED kijelző', 'Ülés- és kormányfűtés (opció)', 'MINI Experience Modes']],
    rel: ['mini-john-cooper-works-cabrio', 'mini-cooper', 'bmw-4-es-cabrio', 'mini-countryman'],
  },
  'mini-countryman': {
    code: 'U25', tagline: 'A legnagyobb MINI — Countryman C, D, S ALL4, Németországból, új autóként.',
    lead: 'Az új <strong>MINI Countryman</strong> (U25) a márka eddigi legnagyobb modellje: 4,4 méteres kompakt SUV, 460 literes csomagtérrel és ALL4 összkerékhajtással.',
    about: 'A <strong>Countryman</strong> a MINI karakterét családbarát térrel ötvözi: magas üléspozíció, csúsztatható hátsó üléssor és prémium, digitális utastér. Benzines, dízel és összkerékhajtású változatban is rendelhető Németországból.',
    choose: 'A <strong>Countryman C</strong> (170 LE) a takarékos belépő, a <strong>Countryman D</strong> dízel a sokat autózóknak, a <strong>Countryman S ALL4</strong> összkerékhajtással, a csúcs pedig a <a href="/egyedi-auto-rendeles/mini-john-cooper-works-countryman">JCW Countryman</a>.',
    engines: [
      ['MINI Countryman C', 'Benzin', '170 LE (125 kW)', '280 Nm', DCT, '8,3 mp', '212 km/h'],
      ['MINI Countryman D', 'Dízel', '163 LE (120 kW)', '360 Nm', DCT, '8,6 mp', '210 km/h'],
      ['MINI Countryman S ALL4', 'Benzin', '', '', 'ALL4 összkerék / 7 fok. duplakuplungos', '', ''],
    ],
    boot: '460–1450 liter', press: 'mini-countryman', rent: 'mini-countryman', noInterior: true,
    design: ['Robusztus SUV, MINI karakter', 'Nyolcszögletű hűtőrács, egyedi LED fénygrafika és kontrasztszínű tető.', ['Egyedi LED fénygrafikák', 'Tetősínek', 'Elektromos csomagtérajtó (opció)']],
    interior: ['Tágas utastér, kerek OLED kijelző', 'Magas üléspozíció, 13 cm-t csúsztatható hátsó üléssor.', ['24 cm-es kerek OLED kijelző', 'Csúsztatható hátsó üléssor', 'Head-up kijelző (opció)']],
    rel: ['mini-john-cooper-works-countryman', 'bmw-x1', 'mini-cooper-5-ajtos', 'bmw-ix1'],
  },
  'mini-john-cooper-works': {
    code: 'J01', tagline: 'MINI John Cooper Works — 231 LE, sportfutómű, JCW dizájn, Németországból.',
    lead: 'A <strong>MINI John Cooper Works</strong> a legsportosabb MINI: 231 LE-s kétliteres turbómotor, sportfutómű, erősebb fékek és egyedi JCW dizájn.',
    about: 'A <strong>JCW</strong> a MINI motorsport-örökségének utcai változata: 6,1 mp-es gyorsulás, közvetlen kormányzás és jellegzetes hang. A német kínálatból JCW Trim csomaggal, egyedi fényezéssel és a teljes felszereltségi listából rendeljük meg.',
    engines: [['MINI John Cooper Works', 'Benzin', '231 LE (170 kW)', '380 Nm', DCT, '6,1 mp', '250 km/h']],
    boot: '210–725 liter', press: 'mini-cooper', mainKey: 'g1', noInterior: true, doors: 3,
    design: ['JCW sportdizájn', 'Nagyobb légbeömlők, JCW lökhárítók, hátsó spoiler, piros részletek és 18"-os JCW keréktárcsák.', ['JCW aerodinamikai csomag', 'JCW sportfékek', '18" JCW keréktárcsák']],
    interior: ['JCW sportutastér', 'JCW sportülések, JCW kormány és kerek OLED kijelző JCW nézetekkel.', ['JCW sportülések', 'Go-Kart mód', 'Harman Kardon hangrendszer (opció)']],
    rel: ['mini-cooper', 'mini-john-cooper-works-cabrio', 'mini-john-cooper-works-countryman', 'bmw-m2'],
  },
  'mini-john-cooper-works-cabrio': {
    code: 'F67', tagline: 'MINI John Cooper Works Cabrio — 231 LE nyitott tetővel, Németországból.',
    lead: 'A <strong>MINI John Cooper Works Cabrio</strong> a legsportosabb nyitott MINI: 231 LE, sportfutómű és elektromos vászontető.',
    about: 'A <strong>JCW Cabrio</strong> a sportos vezetési élményt és a nyitott autózás örömét egyesíti. 6,4 mp-es gyorsulás, JCW dizájn és négy ülés — Németországból, egyedi konfigurációval.',
    engines: [['MINI John Cooper Works Cabrio', 'Benzin', '231 LE (170 kW)', '380 Nm', DCT, '6,4 mp', '250 km/h']],
    boot: '160–215 liter', press: 'mini-cooper-cabrio', noInterior: true, doors: 2,
    design: ['Sportos nyitott MINI', 'JCW lökhárítók, piros részletek, vászontető és 18"-os JCW keréktárcsák.', ['JCW aerodinamikai csomag', 'Elektromos vászontető', 'JCW sportfékek']],
    interior: ['JCW utastér nyitott tetővel', 'JCW sportülések, JCW kormány és kerek OLED kijelző.', ['JCW sportülések', 'Ülésfűtés (opció)', 'MINI Experience Modes']],
    rel: ['mini-cooper-cabrio', 'mini-john-cooper-works', 'bmw-m4-cabrio', 'bmw-4-es-cabrio'],
  },
  'mini-john-cooper-works-countryman': {
    code: 'U25', tagline: 'MINI John Cooper Works Countryman ALL4 — 300 LE-s sportos SUV, Németországból.',
    lead: 'A <strong>MINI John Cooper Works Countryman ALL4</strong> a legerősebb MINI: 300 LE, ALL4 összkerékhajtás és egy tágas, családbarát SUV-karosszéria.',
    about: 'A <strong>JCW Countryman</strong> egyszerre sportautó és családi SUV: 5,4 mp-es gyorsulás, JCW sportfutómű és 460 literes csomagtér. Németországból, egyedi fényezéssel és teljes felszereltséggel rendelhető.',
    engines: [['MINI JCW Countryman ALL4', 'Benzin', '300 LE (221 kW)', '400 Nm', 'ALL4 összkerék / 7 fok. duplakuplungos', '5,4 mp', '250 km/h']],
    boot: '460–1450 liter', press: 'mini-countryman', mainKey: 'g1', noInterior: true, drive: 'AWD',
    design: ['JCW SUV', 'JCW lökhárítók, piros részletek, négy kipufogóvég-hatás és 19–20"-os JCW keréktárcsák.', ['JCW aerodinamikai csomag', 'JCW sportfékek', 'ALL4 összkerékhajtás']],
    interior: ['JCW sportutastér', 'JCW sportülések, JCW kormány és kerek OLED kijelző.', ['JCW sportülések', 'Csúsztatható hátsó üléssor', 'Harman Kardon hangrendszer (opció)']],
    rel: ['mini-countryman', 'mini-john-cooper-works', 'bmw-x1', 'bmw-x2'],
  },
};
