// BMW — egyedi rendelés (eladás) oldalak tartalma. Kulcs = az oldal slugja (egyediCars.ts).
// A saját .astro oldallal rendelkező modellek (1-es, 2-es AT/GC/Coupé, X3, X5, X6 dízel, XM, M4, iX3) nincsenek itt.
// Motoradatok: gyári (bmw.de / PressClub) értékek, kerekítve; a végleges adat a konfigurációtól függ.
import type { SaleFacts } from './salePage';

const XD = 'xDrive összkerék / 8 fok. Steptronic';
const RWD = 'Hátsókerék / 8 fok. Steptronic';
const EV = (d: string) => d + ' / 1 fok. automata';

export const SALE_BMW: Record<string, SaleFacts> = {
  'bmw-ix': {
    code: 'I20', tagline: 'A BMW elektromos zászlóshajó SUV-ja — akár 700 km hatótáv, xDrive, luxus utastér, Németországból.',
    lead: 'A <strong>BMW iX</strong> a márka technológiai csúcs-SUV-ja: teljesen elektromos, két villanymotoros <strong>xDrive</strong> hajtás, akár 700 km feletti WLTP hatótáv és egy nappalira emlékeztető, prémium utastér.',
    about: 'A frissített <strong>BMW iX</strong> (2025) nagyobb akkumulátort, erősebb motorokat és nagyobb hatótávot kapott. Aki új, prémium elektromos SUV-t keres, annak az iX az egyik legjobb választás: csendes, gyors, tágas és kiemelkedően kényelmes. A német piacról pontosan azt a konfigurációt rendeljük meg, amit szeretnél — <strong>xDrive45</strong>, <strong>xDrive60</strong> vagy a sportos <strong>M70 xDrive</strong>.',
    choose: 'Az <strong>xDrive45</strong> (408 LE) a legkedvezőbb belépő, bőven elegendő teljesítménnyel. Az <strong>xDrive60</strong> (544 LE) a legnagyobb hatótávot kínálja — hosszú utakra ez az ideális. Az <strong>M70 xDrive</strong> (659 LE) az M Performance csúcsváltozat, 3,8 mp-es gyorsulással.',
    engines: [
      ['BMW iX xDrive45', 'Elektromos', '408 LE (300 kW)', '700 Nm', EV('xDrive összkerék'), '5,1 mp', '200 km/h'],
      ['BMW iX xDrive60', 'Elektromos', '544 LE (400 kW)', '765 Nm', EV('xDrive összkerék'), '4,6 mp', '250 km/h'],
      ['BMW iX M70 xDrive', 'Elektromos', '659 LE (485 kW)', '1015 Nm', EV('xDrive összkerék'), '3,8 mp', '250 km/h'],
    ],
    boot: '500–1750 liter', drive: 'AWD',
    design: ['Futurisztikus elektromos SUV', 'Nagy, zárt veserács integrált érzékelőkkel, keskeny fényszórók, keret nélküli ajtóablakok és süllyesztett kilincsek — az iX kívül is a jövőt mutatja.', ['Iconic Glow veserács-keret (felszereltségtől függően)', 'Keret nélküli ajtóablakok', '21–23" keréktárcsák']],
    interior: ['Lounge-hangulatú utastér', 'BMW Curved Display, hatszögletű kormány, kristály kezelőszervek (opció) és lapos padló — hátul is kiemelkedő a lábtér.', ['BMW Curved Display (14,9" + 12,3")', 'Panoráma üvegtető elektrokróm árnyékolással (opció)', 'Bowers & Wilkins hangrendszer (opció)']],
    faq: [['Mekkora a BMW iX hatótávja?', 'A frissített iX xDrive60 WLTP szerint akár 700 km feletti hatótávot kínál, az xDrive45 kb. 600 km-t; a valós érték a vezetési stílustól és az időjárástól függ.']],
    rel: ['bmw-i7', 'ix3-elektromos', 'bmw-ix2', 'bmw-i5'],
  },

  'bmw-ix5': {
    soon: true, tagline: 'Az új BMW iX5 — a következő generációs X5 elektromos változata. Előjegyzés Németországból.',
    lead: 'A <strong>BMW iX5</strong> a következő generációs X5 teljesen elektromos változata, a BMW új, nagy hatékonyságú elektromos technikájával.',
    about: 'Az <strong>iX5</strong> az X5 családot viszi az elektromos korszakba: a jól ismert, tágas nagy SUV-karosszéria, xDrive összkerékhajtás és a BMW legújabb akkumulátor- és kijelzőtechnikája. A pontos műszaki adatokat és árakat a hivatalos bemutató után közöljük — <strong>előjegyzést már most felveszünk</strong>, így az elsők között juthatsz hozzá Németországból.',
    engines: [['BMW iX5 (várható)', 'Elektromos', 'hamarosan', '', EV('xDrive összkerék'), '', '']],
    drive: 'AWD',
    design: ['Az X5 karakter, elektromos jövő', 'Nagy SUV-arányok, új formanyelv és aerodinamikailag optimalizált részletek jellemzik az elektromos X5-öt.', ['Új generációs fénygrafika', 'Aerodinamikus keréktárcsák', 'Tágas, családbarát karosszéria']],
    interior: ['Új generációs digitális utastér', 'A BMW legújabb kijelző- és kezelőrendszere, prémium anyagok és tágas, ötüléses utastér.', ['Új generációs BMW iDrive', 'Nagy csomagtér', 'Prémium, fenntartható anyagok']],
    faq: [['Mikor rendelhető a BMW iX5?', 'Az iX5 bevezetése a következő X5 generációval várható. Előjegyzést már most felveszünk — amint a német rendelési rendszer megnyílik, jelentkezünk a pontos árral és konfigurációval.']],
    rel: ['x5-dizel', 'bmw-ix', 'bmw-x7', 'xm-hibrid'],
  },

  'bmw-ix2': {
    code: 'U10', tagline: 'Elektromos SUV Coupé kompakt méretben — iX2 eDrive20 vagy xDrive30, Németországból.',
    lead: 'A <strong>BMW iX2</strong> az X2 teljesen elektromos változata: lecsapott tetővonal, sportos karakter és akár 470 km körüli WLTP hatótáv.',
    about: 'Az <strong>iX2</strong> a városi és elővárosi használatra ideális prémium elektromos SUV Coupé: kompakt külső méret, 525 literes csomagtér, magas üléspozíció és a BMW Curved Display. A német piacról a teljes felszereltségi kínálatból rendelhetsz, akár <strong>M Sport</strong> csomaggal.',
    choose: 'Az <strong>eDrive20</strong> (204 LE) elsőkerék-hajtású, a legnagyobb hatótávval — mindennapokra ideális. Az <strong>xDrive30</strong> (313 LE) két villanymotorral és összkerékhajtással sportos, 5,6 mp-es gyorsulású.',
    engines: [
      ['BMW iX2 eDrive20', 'Elektromos', '204 LE (150 kW)', '250 Nm', EV('Elsőkerék'), '8,6 mp', '170 km/h'],
      ['BMW iX2 xDrive30', 'Elektromos', '313 LE (230 kW)', '494 Nm', EV('xDrive összkerék'), '5,6 mp', '180 km/h'],
    ],
    boot: '525–1400 liter',
    design: ['Coupé-sziluett, elektromos erő', 'Lecsapott tetővonal, Iconic Glow veserács-keret (opció) és zárt, aerodinamikus részletek — az iX2 feltűnő és modern.', ['Lecsapott, coupé-szerű tetővonal', 'Iconic Glow veserács-keret (opció)', '19–21" keréktárcsák']],
    interior: ['BMW Curved Display, lebegő konzol', 'Digitális műszerfal és 10,7"-os érintőkijelző, lebegő könyöktámasz és sportülések.', ['BMW Curved Display, iDrive 9', 'Vezeték nélküli okostelefon-integráció', 'Előklimatizálás applikációból']],
    rel: ['bmw-x2', 'bmw-ix1', 'ix3-elektromos', 'bmw-i4'],
  },

  'bmw-ix1': {
    code: 'U11', tagline: 'A BMW legkedvezőbb elektromos SUV-ja — iX1 eDrive20 vagy xDrive30, Németországból, új autóként.',
    lead: 'A <strong>BMW iX1</strong> az X1 teljesen elektromos változata: kompakt prémium SUV, 490 literes csomagtérrel és akár 470 km körüli WLTP hatótávval.',
    about: 'Az <strong>iX1</strong> a legkönnyebb belépő a BMW elektromos világába: ugyanaz a tágas, praktikus karosszéria, mint az X1-nél, csendes és takarékos elektromos hajtással. Céges autóként a zöld rendszám előnyeivel, magánszemélyként akár <strong>19% német áfával</strong> rendelheted.',
    choose: 'Az <strong>eDrive20</strong> (204 LE) elsőkerék-hajtású, kedvezőbb áron, városra és ingázásra ideális. Az <strong>xDrive30</strong> (313 LE) két villanymotorral és összkerékhajtással erősebb és télen is magabiztos.',
    engines: [
      ['BMW iX1 eDrive20', 'Elektromos', '204 LE (150 kW)', '250 Nm', EV('Elsőkerék'), '8,6 mp', '170 km/h'],
      ['BMW iX1 xDrive30', 'Elektromos', '313 LE (230 kW)', '494 Nm', EV('xDrive összkerék'), '5,6 mp', '180 km/h'],
    ],
    boot: '490–1495 liter',
    design: ['Magabiztos kompakt SUV', 'Függőleges veserács, keskeny LED fényszórók és kék elektromos díszítés — az iX1 X1-es formájában is egyedi.', ['Adaptív LED fényszórók', 'Kék BMW i díszítőelemek', '18–20" keréktárcsák']],
    interior: ['Tágas, digitális utastér', 'BMW Curved Display, lebegő könyöktámasz és 40:20:40 arányban dönthető hátsó ülés.', ['BMW Curved Display, iDrive 9', 'Hőszivattyú, előklimatizálás', 'Vezeték nélküli Apple CarPlay / Android Auto']],
    press: 'bmw-x1', mainKey: 'main', rent: 'bmw-x1',
    rel: ['bmw-x1', 'bmw-ix2', 'ix3-elektromos', 'bmw-i4'],
  },

  'bmw-i7': {
    code: 'G70', tagline: 'Az elektromos luxuslimuzin — BMW i7 Németországból, egyedi konfigurációval.',
    lead: 'A <strong>BMW i7</strong> a 7-es sorozat teljesen elektromos változata: luxuslimuzin kategóriájának egyik legcsendesebb, legkomfortosabb autója, akár 600 km feletti hatótávval.',
    about: 'Az <strong>i7</strong> a hátsó ülésen utazók autója is: a 31,3"-os <strong>BMW Theatre Screen</strong> (opció), a masszázsülések és a légrugós futómű egy mozgó első osztályú kabint teremt. A német kínálatból egyedi színekkel, <strong>BMW Individual</strong> kárpitokkal és a teljes extralistából rendelheted.',
    choose: 'Az <strong>eDrive50</strong> (455 LE) hátsókerék-hajtású és a leghatékonyabb, az <strong>xDrive60</strong> (544 LE) összkerékhajtással a legkiegyensúlyozottabb, az <strong>M70 xDrive</strong> (660 LE) pedig a márka egyik legerősebb elektromos modellje.',
    engines: [
      ['BMW i7 eDrive50', 'Elektromos', '455 LE (335 kW)', '650 Nm', EV('Hátsókerék'), '5,5 mp', '205 km/h'],
      ['BMW i7 xDrive60', 'Elektromos', '544 LE (400 kW)', '745 Nm', EV('xDrive összkerék'), '4,7 mp', '240 km/h'],
      ['BMW i7 M70 xDrive', 'Elektromos', '660 LE (485 kW)', '1015 Nm', EV('xDrive összkerék'), '3,7 mp', '250 km/h'],
    ],
    boot: '500 liter', drive: 'AWD',
    design: ['Tekintélyt parancsoló luxuslimuzin', 'Monumentális, világítható veserács, osztott fényszórók és kétszínű fényezés lehetősége (BMW Individual).', ['Iconic Glow veserács', 'Kétszínű BMW Individual fényezés (opció)', 'Automatikus ajtók (opció)']],
    interior: ['Első osztály a hátsó ülésen', 'BMW Theatre Screen, Executive Lounge ülések, BMW Interaction Bar és Bowers & Wilkins Diamond hangrendszer (opciók).', ['31,3" BMW Theatre Screen (opció)', 'Executive Lounge hátsó ülések (opció)', 'Légrugós futómű, aktív zajcsökkentés']],
    rel: ['bmw-7-es', 'bmw-ix', 'bmw-i5', 'xm-hibrid'],
  },

  'bmw-i5': {
    code: 'G60', tagline: 'Elektromos üzleti limuzin — BMW i5 eDrive40, xDrive40 vagy M60, Németországból.',
    lead: 'A <strong>BMW i5</strong> az új 5-ös limuzin teljesen elektromos változata: üzleti kényelem, BMW Curved Display és akár 580 km körüli WLTP hatótáv.',
    about: 'Az <strong>i5</strong> a felső-középkategória egyik legjobb elektromos limuzinja: csendes, tágas, és a klasszikus 5-ös vezetési élményt hozza. Céges autóként a zöld rendszám előnyeivel, magánszemélyként akár <strong>19% német áfával</strong> rendelheted.',
    choose: 'Az <strong>eDrive40</strong> (340 LE) a leghosszabb hatótávú, hátsókerék-hajtású változat, az <strong>xDrive40</strong> (394 LE) összkerékhajtású, az <strong>M60 xDrive</strong> (601 LE) pedig az M Performance csúcsmodell.',
    engines: [
      ['BMW i5 eDrive40', 'Elektromos', '340 LE (250 kW)', '430 Nm', EV('Hátsókerék'), '6,0 mp', '193 km/h'],
      ['BMW i5 xDrive40', 'Elektromos', '394 LE (290 kW)', '595 Nm', EV('xDrive összkerék'), '5,4 mp', '215 km/h'],
      ['BMW i5 M60 xDrive', 'Elektromos', '601 LE (442 kW)', '795 Nm', EV('xDrive összkerék'), '3,8 mp', '230 km/h'],
    ],
    boot: '490 liter',
    design: ['Elegáns, elektromos 5-ös', 'Iconic Glow veserács-keret, keskeny fényszórók, aerodinamikus keréktárcsák és a BMW i kék részletei.', ['Iconic Glow veserács-keret (opció)', 'Adaptív LED fényszórók', '19–21" keréktárcsák']],
    interior: ['BMW Curved Display, üzleti kényelem', 'Nagy ívelt kijelző, BMW Interaction Bar, kiváló hangszigetelés és tágas hátsó lábtér.', ['BMW Curved Display, Interaction Bar', 'Komfortülések, masszázsfunkció (opció)', 'Vezeték nélküli okostelefon-integráció']],
    press: 'bmw-5-os-limuzin', rent: 'bmw-5-os-limuzin',
    rel: ['bmw-5-os', 'bmw-i5-touring', 'bmw-i4', 'bmw-i7'],
  },

  'bmw-i5-touring': {
    code: 'G61', tagline: 'Elektromos prémium kombi — BMW i5 Touring, nagy csomagtér, xDrive, Németországból.',
    lead: 'A <strong>BMW i5 Touring</strong> a BMW első elektromos 5-ös kombija: 570 literes csomagtér, csendes elektromos hajtás és akár 560 km körüli WLTP hatótáv.',
    about: 'Az <strong>i5 Touring</strong> családoknak és sokat utazó céges felhasználóknak szól: prémium kombi, amely elektromosan is hosszú utakra alkalmas. A német kínálatból vonóhoroggal, panorámatetővel és a teljes asszisztenscsomaggal is rendelhető.',
    choose: 'Az <strong>eDrive40</strong> a leghatékonyabb, az <strong>xDrive40</strong> összkerékhajtású, az <strong>M60 xDrive</strong> a legsportosabb elektromos kombi a kínálatban.',
    engines: [
      ['BMW i5 Touring eDrive40', 'Elektromos', '340 LE (250 kW)', '430 Nm', EV('Hátsókerék'), '6,1 mp', '193 km/h'],
      ['BMW i5 Touring xDrive40', 'Elektromos', '394 LE (290 kW)', '595 Nm', EV('xDrive összkerék'), '5,5 mp', '215 km/h'],
      ['BMW i5 Touring M60 xDrive', 'Elektromos', '601 LE (442 kW)', '795 Nm', EV('xDrive összkerék'), '3,9 mp', '230 km/h'],
    ],
    boot: '570–1700 liter',
    design: ['Elegáns elektromos kombi', 'Hosszú tetővonal, nagy csomagtérajtó és az új 5-ös arca — elektromos részletekkel.', ['Elektromos csomagtérajtó', 'Tetősínek, vonóhorog (opció)', '19–21" keréktárcsák']],
    interior: ['Tágas, digitális kombi-utastér', 'BMW Curved Display, 40:20:40 arányban dönthető hátsó ülés és 570–1700 literes csomagtér.', ['BMW Curved Display', 'Panorámatető (opció)', 'Hőszivattyú, előklimatizálás']],
    press: 'bmw-5-os-touring', rent: 'bmw-5-os-touring',
    rel: ['bmw-5-os-touring', 'bmw-i5', 'bmw-m5-touring', 'bmw-3-as-touring'],
  },

  'bmw-i4': {
    code: 'G26', tagline: 'Az elektromos Gran Coupé — BMW i4 eDrive35, eDrive40 vagy M50, Németországból.',
    lead: 'A <strong>BMW i4</strong> a 4-es Gran Coupé teljesen elektromos változata: négyajtós sportkupé-forma, nagy csomagtérajtó és akár 590 km körüli WLTP hatótáv.',
    about: 'Az <strong>i4</strong> Magyarországon is az egyik legkeresettebb prémium elektromos autó: sportos vezetési élmény, praktikus, 470 literes csomagtér és kiváló hatékonyság. Céges autónak a zöld rendszám miatt különösen kedvező, magánszemélyként akár <strong>19% német áfával</strong> rendelheted.',
    choose: 'Az <strong>eDrive35</strong> (286 LE) a legkedvezőbb belépő, az <strong>eDrive40</strong> (340 LE) a legnagyobb hatótávot kínálja, az <strong>M50 xDrive</strong> (601 LE-ig) pedig az első elektromos BMW M Performance modell.',
    engines: [
      ['BMW i4 eDrive35', 'Elektromos', '286 LE (210 kW)', '400 Nm', EV('Hátsókerék'), '6,1 mp', '190 km/h'],
      ['BMW i4 eDrive40', 'Elektromos', '340 LE (250 kW)', '430 Nm', EV('Hátsókerék'), '5,6 mp', '190 km/h'],
      ['BMW i4 M50 xDrive', 'Elektromos', '601 LE (442 kW)', '795 Nm', EV('xDrive összkerék'), '3,7 mp', '225 km/h'],
    ],
    boot: '470–1290 liter',
    design: ['Sportos négyajtós kupé', 'Hosszú motorháztető, lecsapott tetővonal, keret nélküli ajtóablakok és aerodinamikus keréktárcsák.', ['Keret nélküli ajtóablakok', 'Adaptív LED fényszórók', 'M Sport csomag (opció)']],
    interior: ['BMW Curved Display, sportos vezetőtér', 'Ívelt kijelző, sportülések és nagy csomagtérajtó — a hátsó ülésen is kényelmes.', ['BMW Curved Display, iDrive 8.5', 'Sportülések, M bőrkormány', 'Vezeték nélküli okostelefon-integráció']],
    press: 'bmw-4-es-gran-coupe', rent: 'bmw-4-es-gran-coupe',
    faq: [['Mekkora a BMW i4 hatótávja?', 'Az i4 eDrive40 WLTP szerint akár kb. 590 km-t tud megtenni egy töltéssel, az eDrive35 kb. 480 km-t; a valós érték a vezetési stílustól és az időjárástól függ.']],
    rel: ['bmw-4-es-gran-coupe', 'bmw-i5', 'bmw-ix1', 'bmw-3-as'],
  },

  'bmw-i3': {
    soon: true, tagline: 'Az új BMW i3 — a Neue Klasse elektromos szedánja. Előjegyzés Németországból.',
    lead: 'Az új <strong>BMW i3</strong> a BMW Neue Klasse generációjának elektromos szedánja — a 3-as sorozat elektromos utódja, új akkumulátor- és kijelzőtechnikával.',
    about: 'Az új <strong>i3</strong> a BMW jövőjét hozza a középkategóriába: a Neue Klasse új formanyelve, a BMW Panoramic iDrive kijelzőrendszer, gyorsabb töltés és nagyobb hatótáv. A pontos adatokat és az árat a hivatalos bevezetéskor közöljük — <strong>előjegyzést már most felveszünk</strong>.',
    engines: [['BMW i3 (Neue Klasse, várható)', 'Elektromos', 'hamarosan', '', EV('Hátsókerék / xDrive'), '', '']],
    design: ['Neue Klasse formanyelv', 'Letisztult felületek, új értelmezésű veserács és fénygrafika — a BMW elektromos jövője.', ['Új generációs fénygrafika', 'Aerodinamikus karosszéria', 'Hatékony, új akkumulátortechnika']],
    interior: ['BMW Panoramic iDrive', 'A szélvédő alatt végigfutó kijelzősáv, új kormány és letisztult, digitális utastér.', ['BMW Panoramic iDrive', 'Új generációs operációs rendszer', 'Fenntartható anyagok']],
    faq: [['Mikor rendelhető az új BMW i3?', 'Az új, Neue Klasse alapú i3 bevezetése folyamatban van. Előjegyzést már most felveszünk — amint a német rendelés megnyílik, jelentkezünk a pontos árral.']],
    rel: ['bmw-3-as', 'bmw-i4', 'ix3-elektromos', 'bmw-i5'],
  },

  'bmw-x7': {
    code: 'G07', tagline: 'A BMW legnagyobb SUV-ja — hét ülés, xDrive, benzin és dízel, Németországból.',
    lead: 'A <strong>BMW X7</strong> a márka legnagyobb, hétüléses luxus-SUV-ja: három üléssor, légrugós futómű és hathengeres vagy V8-as motorok.',
    about: 'Az <strong>X7</strong> nagycsaládoknak és azoknak szól, akik egy luxuslimuzin kényelmét egy tágas SUV-ban keresik. A frissített modell osztott fényszórókat, világító veserácsot és BMW Curved Displayt kapott. A német kínálatból hat- vagy hétüléses kivitelben, a teljes extralistával rendelhető.',
    choose: 'Az <strong>xDrive40d</strong> (352 LE, 720 Nm) a legtakarékosabb és vontatásra is ideális, az <strong>xDrive40i</strong> (381 LE) kulturált hathengeres benzines, az <strong>M60i xDrive</strong> (530 LE) V8-as csúcsmodell.',
    engines: [
      ['BMW X7 xDrive40d', 'Dízel (mild-hybrid)', '352 LE (259 kW)', '720 Nm', XD, '5,9 mp', '250 km/h'],
      ['BMW X7 xDrive40i', 'Benzin (mild-hybrid)', '381 LE (280 kW)', '540 Nm', XD, '5,8 mp', '250 km/h'],
      ['BMW X7 M60i xDrive', 'Benzin V8 (mild-hybrid)', '530 LE (390 kW)', '750 Nm', XD, '4,7 mp', '250 km/h'],
    ],
    boot: '326–2120 liter', drive: 'AWD', doors: 5,
    design: ['Monumentális luxus-SUV', 'Osztott fényszórók, nagy, világítható veserács és elegáns krómrészletek — az X7 mindenhol tekintélyt sugároz.', ['Osztott LED fényszórók', 'Iconic Glow veserács', '21–23" keréktárcsák']],
    interior: ['Hét ülés, első osztályú kényelem', 'BMW Curved Display, hangulatvilágítás, panorámatető és elektromosan állítható harmadik üléssor.', ['BMW Curved Display', 'Sky Lounge panorámatető (opció)', 'Négyzónás klíma, légrugós futómű']],
    faq: [['Hány személyes a BMW X7?', 'Az X7 alapból hétüléses, opcionálisan hatüléses (két különálló középső üléssel) kivitelben is rendelhető.']],
    rel: ['x5-dizel', 'xm-hibrid', 'bmw-ix5', 'bmw-7-es'],
  },

  'bmw-x2': {
    code: 'U10', tagline: 'Sportos SUV Coupé — BMW X2 benzin, dízel vagy M35i, Németországból.',
    lead: 'Az új <strong>BMW X2</strong> az X1 technikájára épülő, lecsapott tetővonalú SUV Coupé: feltűnő megjelenés, 560 literes csomagtér és magas üléspozíció.',
    about: 'Az <strong>X2</strong> második generációja hosszabb, laposabb és sportosabb lett. Aki egy városban is kezelhető, mégis karakteres prémium SUV-t keres, annak az X2 ideális. A német kínálatból <strong>sDrive20i</strong>, <strong>sDrive18d</strong> vagy a 300 lóerős <strong>M35i xDrive</strong> is rendelhető.',
    choose: 'Az <strong>sDrive18d</strong> (150 LE) a takarékos dízel, az <strong>sDrive20i</strong> (170 LE) mild-hybrid benzines, az <strong>M35i xDrive</strong> (300 LE) az M Performance csúcsváltozat.',
    engines: [
      ['BMW X2 sDrive20i', 'Benzin (mild-hybrid)', '170 LE (125 kW)', '240 Nm', 'Elsőkerék / 7 fok. Steptronic', '8,3 mp', '220 km/h'],
      ['BMW X2 sDrive18d', 'Dízel', '150 LE (110 kW)', '360 Nm', 'Elsőkerék / 7 fok. Steptronic', '8,9 mp', '211 km/h'],
      ['BMW X2 M35i xDrive', 'Benzin', '300 LE (221 kW)', '400 Nm', 'xDrive összkerék / 7 fok. Steptronic', '5,4 mp', '250 km/h'],
    ],
    boot: '560–1470 liter', press: 'bmw-x2', rent: 'bmw-x2',
    design: ['Coupé-sziluett, SUV-magabiztosság', 'Lecsapott tetővonal, Iconic Glow veserács-keret (opció) és az M35i négy kipufogóvége.', ['Lecsapott tetővonal', 'Iconic Glow veserács-keret (opció)', '19–21" keréktárcsák']],
    interior: ['Digitális vezetőtér', 'BMW Curved Display, lebegő középkonzol és sportülések — kényelmes hátsó ülésekkel.', ['BMW Curved Display, iDrive 9', 'Sportülések, M bőrkormány', 'Vezeték nélküli okostelefon-integráció']],
    rel: ['bmw-ix2', 'bmw-x1', 'x3-benzin', '2ergc-benzin'],
  },

  'bmw-x1': {
    code: 'U11', tagline: 'A legnépszerűbb kompakt prémium SUV — BMW X1 benzin, dízel vagy M35i, Németországból.',
    lead: 'A <strong>BMW X1</strong> a márka belépő SUV-ja és Magyarország egyik legkeresettebb prémium modellje: tágas utastér, 540 literes csomagtér és városban is kezelhető méretek.',
    about: 'A harmadik generációs <strong>X1</strong> szögletesebb, erőteljesebb és digitálisabb lett: BMW Curved Display, lebegő könyöktámasz és 40:20:40 arányban dönthető hátsó ülés. A német kínálatból pontosan azt a kivitelt rendeljük meg, amit szeretnél — <strong>sDrive18i</strong>, <strong>sDrive20i</strong>, <strong>sDrive18d</strong> vagy <strong>M35i xDrive</strong>.',
    choose: 'Az <strong>sDrive18i</strong> (136 LE) a takarékos városi választás, az <strong>sDrive20i</strong> (170 LE) mild-hybrid, az <strong>sDrive18d</strong> (150 LE) a sokat autózóknak, az <strong>M35i xDrive</strong> (300 LE) a sportos csúcsmodell. Elektromosan? Nézd meg a <a href="/egyedi-auto-rendeles/bmw-ix1">BMW iX1</a>-et.',
    engines: [
      ['BMW X1 sDrive18i', 'Benzin', '136 LE (100 kW)', '230 Nm', 'Elsőkerék / 7 fok. Steptronic', '9,2 mp', '208 km/h'],
      ['BMW X1 sDrive20i', 'Benzin (mild-hybrid)', '170 LE (125 kW)', '240 Nm', 'Elsőkerék / 7 fok. Steptronic', '8,3 mp', '216 km/h'],
      ['BMW X1 sDrive18d', 'Dízel', '150 LE (110 kW)', '360 Nm', 'Elsőkerék / 7 fok. Steptronic', '8,9 mp', '210 km/h'],
      ['BMW X1 M35i xDrive', 'Benzin', '300 LE (221 kW)', '400 Nm', 'xDrive összkerék / 7 fok. Steptronic', '5,4 mp', '250 km/h'],
    ],
    boot: '540–1600 liter', press: 'bmw-x1', rent: 'bmw-x1',
    design: ['Magabiztos SUV-forma, kompakt méretek', 'Függőleges veserács, keskeny LED fényszórók, markáns kerékívek és egyenes tetővonal.', ['Adaptív LED fényszórók', 'M Sport kivitel, 18–20" keréktárcsák', 'Elektromos csomagtérajtó']],
    interior: ['BMW Curved Display, tágas utastér', 'Digitális műszerfal és érintőkijelző, lebegő könyöktámasz és bőséges hátsó hely.', ['BMW Curved Display, iDrive 9', 'Vezeték nélküli Apple CarPlay / Android Auto', 'Háromzónás klíma (opció)']],
    faq: [['Mekkora a BMW X1 csomagtartója?', 'A BMW X1 csomagtere 540 literes, a hátsó ülések döntésével akár 1600 literre bővíthető.']],
    rel: ['bmw-ix1', 'bmw-x2', 'x3-benzin', '2eratb-benzin'],
  },

  'bmw-7-es': {
    code: 'G70', tagline: 'Luxuslimuzin Németországból — BMW 740, 740d, 750e és M760e, egyedi konfigurációval.',
    lead: 'A <strong>BMW 7-es</strong> a márka zászlóshajó luxuslimuzinja: monumentális megjelenés, kiemelkedő kényelem és a legmodernebb technika, benzin, dízel és plug-in hibrid hajtással.',
    about: 'A <strong>7-es</strong> (G70) egyszerre sofőrös limuzin és vezetői autó: légrugós futómű, integrált hátsó kerék kormányzás, BMW Theatre Screen és Executive Lounge ülések (opció). A német kínálatból <strong>BMW Individual</strong> fényezéssel és kárpitokkal is rendelhető.',
    choose: 'A <strong>740d xDrive</strong> dízel a sokat utazók választása, a <strong>740</strong> hathengeres benzines, a <strong>750e xDrive</strong> plug-in hibrid tisztán elektromos városi hatótávval, az <strong>M760e xDrive</strong> a csúcsváltozat. Teljesen elektromosan? Nézd meg a <a href="/egyedi-auto-rendeles/bmw-i7">BMW i7</a>-et.',
    engines: [
      ['BMW 740d xDrive', 'Dízel (mild-hybrid)', '300 LE (221 kW)', '670 Nm', XD, '5,8 mp', '250 km/h'],
      ['BMW 740', 'Benzin (mild-hybrid)', '380 LE (280 kW)', '540 Nm', RWD, '5,4 mp', '250 km/h'],
      ['BMW 750e xDrive', 'Plug-in hibrid', '489 LE (360 kW)', '700 Nm', XD, '4,8 mp', '250 km/h'],
      ['BMW M760e xDrive', 'Plug-in hibrid', '571 LE (420 kW)', '800 Nm', XD, '4,3 mp', '250 km/h'],
    ],
    boot: '525 liter',
    design: ['Tekintélyt parancsoló forma', 'Iconic Glow veserács, osztott fényszórók és kétszínű BMW Individual fényezés lehetősége.', ['Iconic Glow veserács', 'Osztott LED fényszórók', '20–21" keréktárcsák']],
    interior: ['Luxus minden ülésen', 'BMW Curved Display, BMW Interaction Bar, 31,3"-os Theatre Screen és masszázsülések (opciók).', ['BMW Theatre Screen (opció)', 'Executive Lounge (opció)', 'Bowers & Wilkins Diamond hangrendszer (opció)']],
    rel: ['bmw-i7', 'bmw-5-os', 'bmw-x7', 'xm-hibrid'],
  },

  'bmw-5-os': {
    code: 'G60', tagline: 'Az üzleti limuzin etalonja — új BMW 5-ös benzin, dízel és plug-in hibrid, Németországból.',
    lead: 'Az új <strong>BMW 5-ös</strong> (G60) a felső-középkategóriás üzleti limuzinok egyik legjobbja: tágas, csendes, technológiailag élvonalbeli és vezetni is élmény.',
    about: 'Az új <strong>5-ös</strong> hosszabb és tágasabb lett elődjénél, BMW Curved Displayt és a legújabb asszisztenseket kapta. Céges és magánvásárlóknak egyaránt ideális — a német kínálatból a teljes motor- és extralistából rendelhetsz, magánszemélyként akár <strong>19% német áfával</strong>.',
    choose: 'Az <strong>520d</strong> takarékos dízel a sokat autózóknak, az <strong>520i</strong> mild-hybrid benzines, az <strong>530e</strong> plug-in hibrid kb. 100 km elektromos hatótávval, az <strong>550e xDrive</strong> pedig 489 LE-s csúcs-hibrid. Elektromosan? Nézd meg a <a href="/egyedi-auto-rendeles/bmw-i5">BMW i5</a>-öt.',
    engines: [
      ['BMW 520i', 'Benzin (mild-hybrid)', '208 LE (153 kW)', '330 Nm', RWD, '7,5 mp', '230 km/h'],
      ['BMW 520d', 'Dízel (mild-hybrid)', '197 LE (145 kW)', '400 Nm', RWD, '7,3 mp', '233 km/h'],
      ['BMW 530e', 'Plug-in hibrid', '299 LE (220 kW)', '450 Nm', RWD, '6,3 mp', '230 km/h'],
      ['BMW 550e xDrive', 'Plug-in hibrid', '489 LE (360 kW)', '700 Nm', XD, '4,3 mp', '250 km/h'],
    ],
    boot: '520 liter', press: 'bmw-5-os-limuzin', rent: 'bmw-5-os-limuzin',
    design: ['Nagyobb, elegánsabb, modernebb', 'Tiszta felületek, választhatóan világító veserács-keret, keskeny fényszórók és elegáns oldalvonal.', ['Iconic Glow veserács-keret (opció)', 'Adaptív LED fényszórók', 'M Sport kivitel, 19–21" keréktárcsák']],
    interior: ['BMW Curved Display, üzleti kényelem', 'Ívelt kijelző, Interaction Bar és kategóriájában kiemelkedő hátsó lábtér.', ['BMW Curved Display, Interaction Bar', 'Komfortülések (opció)', 'Vezeték nélküli okostelefon-integráció']],
    rel: ['bmw-5-os-touring', 'bmw-i5', 'bmw-m5', 'bmw-3-as'],
  },

  'bmw-5-os-touring': {
    code: 'G61', tagline: 'Prémium kombi Németországból — új BMW 5-ös Touring benzin, dízel és plug-in hibrid.',
    lead: 'Az új <strong>BMW 5-ös Touring</strong> (G61) az 5-ös limuzin minden erényét nagy, praktikus csomagtérrel egészíti ki: 570 liter, döntött ülésekkel 1700 liter.',
    about: 'A <strong>5-ös Touring</strong> családoknak és sokat utazó céges felhasználóknak ideális: tágas, csendes, és a BMW vezetési élményét hozza. A német kínálatból vonóhoroggal, panorámatetővel és a teljes asszisztenscsomaggal is rendelhető.',
    choose: 'Az <strong>520d</strong> a takarékos flotta-kedvenc, az <strong>520i</strong> mild-hybrid benzines, az <strong>530e</strong> és <strong>550e xDrive</strong> plug-in hibridek tisztán elektromos hatótávval. Elektromosan? Nézd meg a <a href="/egyedi-auto-rendeles/bmw-i5-touring">BMW i5 Touring</a>-ot.',
    engines: [
      ['BMW 520i Touring', 'Benzin (mild-hybrid)', '208 LE (153 kW)', '330 Nm', RWD, '7,7 mp', '227 km/h'],
      ['BMW 520d Touring', 'Dízel (mild-hybrid)', '197 LE (145 kW)', '400 Nm', RWD, '7,4 mp', '227 km/h'],
      ['BMW 530e Touring', 'Plug-in hibrid', '299 LE (220 kW)', '450 Nm', RWD, '6,4 mp', '230 km/h'],
      ['BMW 550e xDrive Touring', 'Plug-in hibrid', '489 LE (360 kW)', '700 Nm', XD, '4,3 mp', '250 km/h'],
    ],
    boot: '570–1700 liter', press: 'bmw-5-os-touring', rent: 'bmw-5-os-touring',
    design: ['Elegáns kombi-arányok', 'Hosszú tetővonal, lejtős D-oszlop és az új 5-ös arca.', ['Elektromos csomagtérajtó', 'Adaptív LED fényszórók', 'M Sport kivitel, 19–21" keréktárcsák']],
    interior: ['Tágas, digitális utastér', 'BMW Curved Display, kiváló ülések és 40:20:40 arányban dönthető hátsó ülés.', ['BMW Curved Display, Interaction Bar', '570–1700 literes csomagtér', 'Panorámatető (opció)']],
    rel: ['bmw-5-os', 'bmw-i5-touring', 'bmw-m5-touring', 'bmw-3-as-touring'],
  },

  'bmw-m5': {
    code: 'G90', tagline: 'Az új BMW M5 — 727 LE-s V8 plug-in hibrid szuperlimuzin, Németországból.',
    lead: 'Az új <strong>BMW M5</strong> (G90) minden idők legerősebb M5-öse: 4,4 literes biturbó V8 és villanymotor, <strong>727 LE</strong> rendszerteljesítmény, 1000 Nm és M xDrive összkerékhajtás.',
    about: 'Az <strong>M5</strong> a mindennapokra is alkalmas szuperautó: négy ajtó, tágas utastér és egy M hajtáslánc, amely 3,5 mp alatt gyorsít 100 km/h-ra. Plug-in hibridként városban tisztán elektromosan is halad. A német kínálatból <strong>M Driver\'s Package</strong>-dzsel (305 km/h), karbon csomagokkal és BMW Individual fényezéssel rendelhető.',
    engines: [['BMW M5', 'Plug-in hibrid (V8)', '727 LE (535 kW)', '1000 Nm', 'M xDrive összkerék / 8 fok. M Steptronic', '3,5 mp', '250 km/h (305 km/h opció)']],
    boot: '466 liter', drive: 'AWD',
    design: ['Szélesített M karosszéria', 'Kiszélesített sárvédők, M lökhárítók, négy kipufogóvég és M könnyűfém keréktárcsák (20"/21").', ['M szélesített karosszéria', 'M karbon tető (opció)', 'M Compound fékek, M Carbon kerámia (opció)']],
    interior: ['M vezetőtér', 'M sportülések (opcionálisan M Carbon kagylóülések), M kormány M1/M2 gombokkal és BMW Curved Display M nézetekkel.', ['M Carbon kagylóülések (opció)', 'M Drive Professional', 'Bowers & Wilkins hangrendszer (opció)']],
    rel: ['bmw-m5-touring', 'bmw-5-os', 'bmw-m3', 'xm-hibrid'],
  },

  'bmw-m5-touring': {
    code: 'G99', tagline: 'Az új BMW M5 Touring — 727 LE-s szuperkombi, Németországból.',
    lead: 'Az új <strong>BMW M5 Touring</strong> (G99) visszatérése legenda: 727 LE-s V8 plug-in hibrid hajtás, M xDrive és egy családi kombi praktikuma.',
    about: 'Az <strong>M5 Touring</strong> ritka, keresett modell — a német kínálatból egyedi konfigurációval, gyári garanciával rendeljük meg neked. 500–1630 literes csomagtér, 3,6 mp-es gyorsulás és hétköznapi komfort egyben.',
    engines: [['BMW M5 Touring', 'Plug-in hibrid (V8)', '727 LE (535 kW)', '1000 Nm', 'M xDrive összkerék / 8 fok. M Steptronic', '3,6 mp', '250 km/h (305 km/h opció)']],
    boot: '500–1630 liter', drive: 'AWD',
    design: ['Szuperkombi M-stílusban', 'Szélesített M karosszéria, M lökhárítók, tetősínek és négy kipufogóvég.', ['M szélesített karosszéria', 'Tetősínek, elektromos csomagtérajtó', '20"/21" M keréktárcsák']],
    interior: ['M vezetőtér, kombi praktikum', 'M sportülések, M kormány és 40:20:40 arányban dönthető hátsó ülés.', ['M sportülések / M Carbon kagylóülések (opció)', 'BMW Curved Display M nézetekkel', 'Panorámatető (opció)']],
    rel: ['bmw-m5', 'bmw-5-os-touring', 'bmw-m3-touring', 'bmw-i5-touring'],
  },

  'bmw-4-es-coupe': {
    code: 'G22', tagline: 'Sportos kupé Németországból — BMW 420i, 420d és M440i xDrive.',
    lead: 'A <strong>BMW 4-es Coupé</strong> a klasszikus BMW sportkupé: hátsókerék-hajtás, hosszú motorháztető, keret nélküli ajtóablakok és négy ülés.',
    about: 'A frissített <strong>4-es Coupé</strong> élesebb fényszórókat, új hátsó lámpákat és BMW Curved Displayt kapott. Hétköznapi használatra is kényelmes, mégis igazi vezetői autó. A német kínálatból <strong>M Sport</strong> és <strong>M Sport Pro</strong> csomaggal is rendelhető.',
    choose: 'A <strong>420i</strong> (184 LE) kulturált benzines, a <strong>420d</strong> (190 LE) takarékos dízel, az <strong>M440i xDrive</strong> (374 LE) hathengeres M Performance modell. A csúcs a <a href="/egyedi-auto-rendeles/m4-benzin">BMW M4</a>.',
    engines: [
      ['BMW 420i Coupé', 'Benzin (mild-hybrid)', '184 LE (135 kW)', '300 Nm', RWD, '7,5 mp', '240 km/h'],
      ['BMW 420d Coupé', 'Dízel (mild-hybrid)', '190 LE (140 kW)', '400 Nm', RWD, '7,1 mp', '240 km/h'],
      ['BMW M440i xDrive Coupé', 'Benzin (mild-hybrid)', '374 LE (275 kW)', '500 Nm', XD, '4,5 mp', '250 km/h'],
    ],
    boot: '440 liter', press: 'bmw-4-es-coupe', rent: 'bmw-4-es-coupe', doors: 2,
    design: ['Klasszikus sportkupé', 'Hosszú motorháztető, lapos tetővonal, keret nélküli ajtóablakok és széles hátsó rész.', ['Adaptív LED / Laser fényszórók (opció)', 'M Sport csomag', '18–20" keréktárcsák']],
    interior: ['Vezetőközpontú utastér', 'Sportülések, M bőrkormány, BMW Curved Display és négy teljes értékű ülés.', ['BMW Curved Display', 'Sportülések, M bőrkormány', 'Harman Kardon hangrendszer (opció)']],
    rel: ['bmw-4-es-cabrio', 'bmw-4-es-gran-coupe', 'm4-benzin', '2ercb-benzin'],
  },

  'bmw-4-es-gran-coupe': {
    code: 'G26', tagline: 'Négyajtós sportkupé Németországból — BMW 420i, 420d és M440i xDrive Gran Coupé.',
    lead: 'A <strong>BMW 4-es Gran Coupé</strong> a kupé eleganciáját ötvözi a négyajtós praktikummal: lecsapott tetővonal, nagy csomagtérajtó és 470 literes csomagtér.',
    about: 'A <strong>4-es Gran Coupé</strong> ideális, ha a sportos formát nem akarod a mindennapi praktikumra cserélni: öt ajtó, kényelmes hátsó ülések és egy igazi BMW vezetési élmény. Elektromosan is elérhető — ez a <a href="/egyedi-auto-rendeles/bmw-i4">BMW i4</a>.',
    choose: 'A <strong>420i</strong> (184 LE) kulturált benzines, a <strong>420d</strong> (190 LE) takarékos dízel, az <strong>M440i xDrive</strong> (374 LE) hathengeres, összkerékhajtású csúcsváltozat.',
    engines: [
      ['BMW 420i Gran Coupé', 'Benzin (mild-hybrid)', '184 LE (135 kW)', '300 Nm', RWD, '7,9 mp', '235 km/h'],
      ['BMW 420d Gran Coupé', 'Dízel (mild-hybrid)', '190 LE (140 kW)', '400 Nm', RWD, '7,4 mp', '235 km/h'],
      ['BMW M440i xDrive Gran Coupé', 'Benzin (mild-hybrid)', '374 LE (275 kW)', '500 Nm', XD, '4,7 mp', '250 km/h'],
    ],
    boot: '470–1290 liter', press: 'bmw-4-es-gran-coupe', rent: 'bmw-4-es-gran-coupe',
    design: ['Négyajtós kupé-sziluett', 'Keret nélküli ajtóablakok, lecsapott tető és nagy csomagtérajtó.', ['Keret nélküli ajtóablakok', 'Adaptív LED fényszórók', 'M Sport kivitel']],
    interior: ['Sportos, praktikus utastér', 'Sportülések, digitális műszerfal és kényelmes hátsó ülés.', ['BMW Curved Display', 'Sportülések, M bőrkormány', 'Vezeték nélküli okostelefon-integráció']],
    rel: ['bmw-i4', 'bmw-4-es-coupe', 'bmw-3-as', '2ergc-benzin'],
  },

  'bmw-4-es-cabrio': {
    code: 'G23', tagline: 'Négyüléses kabrió Németországból — BMW 420i, 420d és M440i xDrive Cabrio.',
    lead: 'A <strong>BMW 4-es Cabrio</strong> négyüléses, vászontetős kabrió: 18 másodperc alatt nyíló tető, kényelmes ülések és igazi BMW vezetési élmény.',
    about: 'A <strong>4-es Cabrio</strong> egész évben használható: a szigetelt vászontető zárt állapotban is csendes, a nyakfűtés (opció) hűvös napokon is kellemessé teszi a nyitott autózást. A német kínálatból egyedi tetőszínnel és felszereltséggel rendelhető.',
    choose: 'A <strong>420i</strong> a kulturált nyitott cirkálás, a <strong>420d</strong> a takarékos, az <strong>M440i xDrive</strong> a hathengeres, összkerékhajtású változat. A csúcs a <a href="/egyedi-auto-rendeles/bmw-m4-cabrio">BMW M4 Cabrio</a>.',
    engines: [
      ['BMW 420i Cabrio', 'Benzin (mild-hybrid)', '184 LE (135 kW)', '300 Nm', RWD, '8,2 mp', '240 km/h'],
      ['BMW 420d Cabrio', 'Dízel (mild-hybrid)', '190 LE (140 kW)', '400 Nm', RWD, '7,6 mp', '240 km/h'],
      ['BMW M440i xDrive Cabrio', 'Benzin (mild-hybrid)', '374 LE (275 kW)', '500 Nm', XD, '4,9 mp', '250 km/h'],
    ],
    boot: '300–385 liter', press: 'bmw-4-es-cabrio', rent: 'bmw-4-es-cabrio', doors: 2,
    design: ['Elegáns vászontetős kabrió', 'Könnyű, szigetelt vászontető, 18 mp alatt nyílik, menet közben 50 km/h-ig.', ['Elektromos vászontető', 'Nyakfűtés (opció)', 'M Sport kivitel']],
    interior: ['Négy ülés, nyitott ég', 'Sportülések, BMW Curved Display és szélterelő a kényelmes nyitott autózáshoz.', ['Nyakfűtés, ülésfűtés (opció)', 'BMW Curved Display', 'Harman Kardon hangrendszer (opció)']],
    faq: [['Menet közben is nyitható a BMW 4-es Cabrio teteje?', 'Igen, a vászontető kb. 18 másodperc alatt nyílik vagy zárul, akár 50 km/h sebességig menet közben is.']],
    rel: ['bmw-m4-cabrio', 'bmw-4-es-coupe', 'mini-cooper-cabrio', 'bmw-4-es-gran-coupe'],
  },

  'bmw-m4-cabrio': {
    code: 'G83', tagline: 'BMW M4 Competition Cabrio M xDrive — 530 LE nyitott tetővel, Németországból.',
    lead: 'A <strong>BMW M4 Cabrio</strong> az M4 Competition teljesítményét nyitott tetővel kínálja: 3,0 literes, 530 LE-s hathengeres M motor és M xDrive összkerékhajtás.',
    about: 'Az <strong>M4 Competition Cabrio M xDrive</strong> négyüléses sportautó, amely a vászontetőnek köszönhetően egész évben élvezhető. 3,7 mp-es gyorsulás, M Driver\'s Package-dzsel akár 280 km/h — a német kínálatból egyedi fényezéssel és karbon csomagokkal rendelhető.',
    engines: [['BMW M4 Competition Cabrio M xDrive', 'Benzin', '530 LE (390 kW)', '650 Nm', 'M xDrive összkerék / 8 fok. M Steptronic', '3,7 mp', '250 km/h (280 km/h opció)']],
    boot: '300–385 liter', drive: 'AWD', doors: 2,
    design: ['M szélesített karosszéria, nyitott tető', 'Függőleges M veserács, M lökhárítók, négy kipufogóvég és vászontető.', ['M karosszéria-elemek', 'M Carbon csomagok (opció)', '19"/20" M keréktárcsák']],
    interior: ['M vezetőtér', 'M sportülések, M kormány M1/M2 gombokkal és nyakfűtés (opció).', ['M sportülések / M Carbon kagylóülések (opció)', 'M Drive Professional', 'Harman Kardon hangrendszer']],
    rel: ['m4-benzin', 'bmw-4-es-cabrio', 'bmw-m3', 'bmw-m2'],
  },

  'bmw-3-as': {
    code: 'G20', tagline: 'A sportlimuzin etalonja — BMW 320i, 320d, 330e és M340i, Németországból.',
    lead: 'A <strong>BMW 3-as</strong> évtizedek óta a sportos középkategóriás limuzin mércéje: hátsókerék-hajtás, pontos kormányzás és kiváló egyensúly.',
    about: 'A frissített <strong>3-as</strong> BMW Curved Displayt, új fényszórókat és hatékony mild-hybrid motorokat kapott. Céges autónak és családi limuzinnak egyaránt népszerű — a német kínálatból pontosan azt a kivitelt rendeljük meg, amit szeretnél, magánszemélyként akár <strong>19% német áfával</strong>.',
    choose: 'A <strong>320d</strong> (190 LE) a takarékos kedvenc, a <strong>320i</strong> (184 LE) kulturált benzines, a <strong>330e</strong> plug-in hibrid (292 LE), az <strong>M340i xDrive</strong> (374 LE) hathengeres M Performance. A csúcs a <a href="/egyedi-auto-rendeles/bmw-m3">BMW M3</a>.',
    engines: [
      ['BMW 320i', 'Benzin (mild-hybrid)', '184 LE (135 kW)', '300 Nm', RWD, '7,4 mp', '235 km/h'],
      ['BMW 320d', 'Dízel (mild-hybrid)', '190 LE (140 kW)', '400 Nm', RWD, '6,9 mp', '240 km/h'],
      ['BMW 330e', 'Plug-in hibrid', '292 LE (215 kW)', '420 Nm', RWD, '5,8 mp', '230 km/h'],
      ['BMW M340i xDrive', 'Benzin (mild-hybrid)', '374 LE (275 kW)', '500 Nm', XD, '4,4 mp', '250 km/h'],
    ],
    boot: '480 liter', press: 'bmw-3-as-limuzin', rent: 'bmw-3-as-limuzin',
    design: ['Sportos, időtálló limuzin', 'Keskeny LED fényszórók, markáns veserács és sportos M Sport lökhárítók.', ['Adaptív LED fényszórók', 'M Sport csomag', '17–19" keréktárcsák']],
    interior: ['BMW Curved Display, vezetőközpontú utastér', 'Ívelt kijelző, sportülések és kiváló ergonómia.', ['BMW Curved Display', 'Sportülések, M bőrkormány', 'Vezeték nélküli okostelefon-integráció']],
    rel: ['bmw-3-as-touring', 'bmw-m3', 'bmw-5-os', 'bmw-4-es-gran-coupe'],
  },

  'bmw-3-as-touring': {
    code: 'G21', tagline: 'Sportos prémium kombi — BMW 3-as Touring 320i, 320d, 330e és M340i, Németországból.',
    lead: 'A <strong>BMW 3-as Touring</strong> a sportlimuzin vezetési élményét 500 literes, praktikus csomagtérrel egészíti ki.',
    about: 'A <strong>3-as Touring</strong> a legkedveltebb prémium kombik egyike: külön nyitható hátsó ablak, 40:20:40 arányban dönthető ülés és kiváló menettulajdonságok. Céges autónak és családi kombinak egyaránt ideális.',
    choose: 'A <strong>320d Touring</strong> a takarékos flotta-kedvenc, a <strong>320i</strong> benzines, a <strong>330e</strong> plug-in hibrid, az <strong>M340i xDrive</strong> hathengeres. A csúcs a <a href="/egyedi-auto-rendeles/bmw-m3-touring">BMW M3 Touring</a>.',
    engines: [
      ['BMW 320i Touring', 'Benzin (mild-hybrid)', '184 LE (135 kW)', '300 Nm', RWD, '7,6 mp', '233 km/h'],
      ['BMW 320d Touring', 'Dízel (mild-hybrid)', '190 LE (140 kW)', '400 Nm', RWD, '7,1 mp', '235 km/h'],
      ['BMW 330e Touring', 'Plug-in hibrid', '292 LE (215 kW)', '420 Nm', RWD, '6,0 mp', '230 km/h'],
      ['BMW M340i xDrive Touring', 'Benzin (mild-hybrid)', '374 LE (275 kW)', '500 Nm', XD, '4,5 mp', '250 km/h'],
    ],
    boot: '500–1510 liter',
    design: ['Dinamikus kombi-arányok', 'Hosszú tetővonal, külön nyitható hátsó ablak és sportos M Sport részletek.', ['Külön nyitható hátsó ablak', 'Tetősínek, vonóhorog (opció)', 'M Sport csomag']],
    interior: ['Tágas, digitális kombi', 'BMW Curved Display, sportülések és 500–1510 literes csomagtér.', ['BMW Curved Display', '40:20:40 dönthető hátsó ülés', 'Panorámatető (opció)']],
    rel: ['bmw-3-as', 'bmw-m3-touring', 'bmw-5-os-touring', 'bmw-i5-touring'],
  },

  'bmw-m3': {
    code: 'G80', tagline: 'BMW M3 Competition M xDrive — 530 LE-s sportlimuzin, Németországból.',
    lead: 'A <strong>BMW M3</strong> a sportlimuzinok legendája: 3,0 literes, 530 LE-s hathengeres M motor, M xDrive összkerékhajtás (kikapcsolható 2WD mód) és négy ajtó.',
    about: 'A frissített <strong>M3 Competition</strong> 3,5 mp alatt gyorsul 100 km/h-ra, mégis hétköznapi autóként is használható. A német kínálatból <strong>M Driver\'s Package</strong>-dzsel (290 km/h), M Carbon kagylóülésekkel és karbon-kerámia fékekkel is rendelhető.',
    engines: [['BMW M3 Competition M xDrive', 'Benzin', '530 LE (390 kW)', '650 Nm', 'M xDrive összkerék / 8 fok. M Steptronic', '3,5 mp', '250 km/h (290 km/h opció)']],
    boot: '480 liter', drive: 'AWD',
    design: ['M szélesített karosszéria', 'Függőleges M veserács, kiszélesített sárvédők, négy kipufogóvég és karbon tető.', ['M Carbon tető', 'M Carbon exterior csomag (opció)', '19"/20" M keréktárcsák']],
    interior: ['M vezetőtér', 'M sportülések vagy M Carbon kagylóülések, M kormány és BMW Curved Display M nézetekkel.', ['M Carbon kagylóülések (opció)', 'M Drive Professional', 'Harman Kardon hangrendszer']],
    rel: ['bmw-m3-touring', 'm4-benzin', 'bmw-3-as', 'bmw-m5'],
  },

  'bmw-m3-touring': {
    code: 'G81', tagline: 'Az első BMW M3 Touring — 530 LE-s sportkombi, Németországból.',
    lead: 'A <strong>BMW M3 Touring</strong> az első gyári M3 kombi: 530 LE, M xDrive összkerékhajtás és 500–1510 literes csomagtér.',
    about: 'Az <strong>M3 Competition Touring M xDrive</strong> a világ egyik legkeresettebb sportkombija: 3,6 mp-es gyorsulás és családi praktikum egyben. A német kínálatból egyedi konfigurációval, gyári garanciával rendeljük meg.',
    engines: [['BMW M3 Competition Touring M xDrive', 'Benzin', '530 LE (390 kW)', '650 Nm', 'M xDrive összkerék / 8 fok. M Steptronic', '3,6 mp', '250 km/h (280 km/h opció)']],
    boot: '500–1510 liter', drive: 'AWD',
    design: ['Sportkombi M-stílusban', 'Szélesített M karosszéria, M lökhárítók, tetősínek és négy kipufogóvég.', ['M karosszéria-elemek', 'Tetősínek', '19"/20" M keréktárcsák']],
    interior: ['M vezetőtér, kombi praktikum', 'M sportülések, M kormány és 40:20:40 dönthető hátsó ülés.', ['M Carbon kagylóülések (opció)', 'BMW Curved Display M nézetekkel', 'Panorámatető (opció)']],
    rel: ['bmw-m3', 'bmw-3-as-touring', 'bmw-m5-touring', 'm4-benzin'],
  },

  'bmw-m2': {
    code: 'G87', tagline: 'BMW M2 — kompakt M kupé 480 LE-vel, hátsókerék-hajtással, Németországból.',
    lead: 'A <strong>BMW M2</strong> a legtisztább M élmény: kompakt kupé, 3,0 literes, 480 LE-s hathengeres motor, hátsókerék-hajtás és választható manuális váltó.',
    about: 'A frissített <strong>M2</strong> még erősebb lett, és továbbra is kapható 6 fokozatú manuális váltóval — ez ritkaság a mai sportautók között. A német kínálatból M Race Track csomaggal, karbon tetővel és M Carbon kagylóülésekkel is rendelhető.',
    engines: [
      ['BMW M2 automata', 'Benzin', '480 LE (353 kW)', '600 Nm', 'Hátsókerék / 8 fok. M Steptronic', '4,0 mp', '250 km/h (285 km/h opció)'],
      ['BMW M2 manuális', 'Benzin', '480 LE (353 kW)', '550 Nm', 'Hátsókerék / 6 fok. manuális', '4,2 mp', '250 km/h (285 km/h opció)'],
    ],
    boot: '390 liter', drive: 'RWD', doors: 2,
    design: ['Izmos, kompakt M kupé', 'Szögletes, szélesített karosszéria, négy kipufogóvég és M könnyűfém keréktárcsák (19"/20").', ['M Carbon tető (opció)', 'M lökhárítók, diffúzor', 'M Compound fékek']],
    interior: ['Vezetőközpontú M utastér', 'BMW Curved Display M nézetekkel, M sportülések és M kormány.', ['M Carbon kagylóülések (opció)', 'M Drive Professional', 'Harman Kardon hangrendszer (opció)']],
    faq: [['Kapható manuális váltóval a BMW M2?', 'Igen, az M2 a 8 fokozatú M Steptronic automata mellett 6 fokozatú manuális váltóval is rendelhető.']],
    rel: ['m4-benzin', 'bmw-m3', '2ercb-benzin', 'bmw-m4-cabrio'],
  },

  'bmw-x6-m-competition': {
    code: 'F96', tagline: 'BMW X6 M Competition — 625 LE-s V8 SUV Coupé, Németországból.',
    lead: 'A <strong>BMW X6 M Competition</strong> a sportos SUV Coupék csúcsa: 4,4 literes, 625 LE-s biturbó V8, M xDrive összkerékhajtás és 3,8 mp-es gyorsulás.',
    about: 'Az <strong>X6 M Competition</strong> egyedülálló kombináció: SUV-kényelem, coupé-forma és versenyautós teljesítmény. A német kínálatból M Driver\'s Package-dzsel (290 km/h), M Carbon csomagokkal és BMW Individual fényezéssel rendelhető.',
    engines: [['BMW X6 M Competition', 'Benzin V8 (mild-hybrid)', '625 LE (460 kW)', '750 Nm', 'M xDrive összkerék / 8 fok. M Steptronic', '3,8 mp', '250 km/h (290 km/h opció)']],
    boot: '580–1530 liter', drive: 'AWD',
    design: ['M SUV Coupé', 'Világító veserács, M lökhárítók, négy kipufogóvég és 21"/22" M keréktárcsák.', ['Iconic Glow veserács', 'M karbon csomag (opció)', '21"/22" M keréktárcsák']],
    interior: ['M luxus utastér', 'M sportülések, M kormány, BMW Curved Display és Bowers & Wilkins hangrendszer (opció).', ['M multifunkciós ülések', 'BMW Curved Display M nézetekkel', 'Bowers & Wilkins hangrendszer (opció)']],
    rel: ['x6-dizel', 'xm-hibrid', 'bmw-x7', 'x5-dizel'],
  },
};
