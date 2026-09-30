// CUPRA, Hyundai, Kia, Volvo, Seat, MAN bérlési tartalom (SEO-szöveg + műszaki adatok).
// Fotó: ahol nincs sajtófotó-galéria, a kártya fotója (/berles/<slug>.webp) jelenik meg főképként.
// Számok (ár, km, futamidő, kaució, darabszám) NEM itt vannak: azok a napi Choice-szinkronból jönnek.
import type { RentalContent } from './rentalPage';

const EV_WHY = 'Az elektromos autók technikája gyorsan fejlődik, a használt értékük nehezen kiszámítható. <strong>Tartós bérletben</strong> ez a kockázat nem téged terhel: a futamidő végén egyszerűen visszaadod az autót. Közben élvezed az alacsony üzemeltetési költséget és a zöld rendszám előnyeit (pl. ingyenes parkolás sok városban).';

export const OTHERS: Record<string, RentalContent> = {
  // ================= CUPRA =================
  'CUPRA Born': {
    body: 'Kompakt',
    overviewH2: 'CUPRA Born tartós bérlet — sportos elektromos kompakt havidíjjal',
    guideIntro: 'Az új <strong>CUPRA Born</strong> a márka sportos elektromos kompaktja: 231 LE-s hátsókerék-hajtás, nagy, 79 kWh-s akkumulátor, feltűnő dizájn és sportos futómű. <strong>Elektromos autó tartós bérletben</strong>: egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük, az akkumulátor és az értékvesztés kockázata nem a tiéd.',
    guideBlocks: [
      { h3: 'Miért a CUPRA Born?', html: 'A Born a Golf-kategória méretét egy sportosabb, elektromos autóval ötvözi: 231 lóerő, hátsókerék-hajtás, kis fordulókör és a 79 kWh-s akkumulátorral 500 km feletti WLTP hatótáv. A frissített modell új orr-részt, jobb anyagokat és nagyobb kijelzőt kapott.' },
      { h3: 'Miért érdemes elektromos autót bérelni?', html: EV_WHY },
    ],
    design: { h3: 'Feltűnő, sportos elektromos kompakt', text: 'A CUPRA jellegzetes háromszög-motívumú LED fényszórói, a réz színű részletek és a sportos arányok teszik a Bornt azonnal felismerhetővé.', bullets: ['Matrix LED fényszórók (felszereltségtől függően)', 'Réz színű CUPRA dizájnelemek', 'Sportos, alacsony karosszéria'] },
    interior: { h3: 'Sportos, digitális utastér', text: 'Kagylóülések, digitális műszerfal, nagy központi érintőkijelző és fenntartható anyagok — a Born belül is a CUPRA sportos karakterét hozza.', bullets: ['Digitális műszerfal, nagy érintőkijelző', 'CUPRA kagylóülések (felszereltségtől függően)', 'Előklimatizálás applikációból'] },
    specs: { '79 kWh': { label: 'Born 79 kWh', fuel: 'Elektromos', power: '231 LE (170 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'Nagy hatótáv, sportos', note: '79 kWh akkumulátor, 500 km feletti WLTP hatótáv' } },
    faqExtra: [ { q: 'Mekkora a CUPRA Born hatótávja?', a: 'A 79 kWh-s akkumulátorral a WLTP szerinti hatótáv 500 km feletti; a valós érték a vezetési stílustól és az időjárástól függ.' } ],
    schema: { drive: 'RWD' },
  },
  'CUPRA Raval': {
    body: 'Kisautó',
    overviewH2: 'CUPRA Raval tartós bérlet — az új elektromos városi autó havidíjjal',
    guideIntro: 'Az új <strong>CUPRA Raval</strong> a márka elektromos kisautója: kompakt, városban ideális méretek, sportos CUPRA-dizájn és a bérelhető <strong>52 kWh Endurance</strong> változattal 211 LE teljesítmény. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a CUPRA Raval-t?', html: 'Városi autósoknak és második autónak a családba: a Raval kicsi, fürge és könnyen parkolható, az 52 kWh-s akkumulátor pedig a mindennapi ingázásra és hétvégi kirándulásra is bőven elég.' },
      { h3: 'Miért érdemes elektromos autót bérelni?', html: EV_WHY },
    ],
    design: { h3: 'Sportos kisautó CUPRA-stílusban', text: 'Háromszög-motívumú fényszórók, széles nyomtáv, feszes arányok — a Raval a CUPRA karakterét hozza a városi kisautó-kategóriába.', bullets: ['LED fényszórók háromszög-grafikával', 'Sportos lökhárítók', 'Kontrasztos CUPRA részletek'] },
    interior: { h3: 'Digitális, modern utastér', text: 'Nagy érintőkijelző, digitális műszerfal és sportos ülések kompakt, jól kihasznált térben.', bullets: ['Digitális műszerfal', 'Nagy központi érintőkijelző', 'Okostelefon-integráció'] },
    specs: { '52 kWh Endurance': { label: 'Raval 52 kWh Endurance', fuel: 'Elektromos', power: '211 LE (155 kW)', drive: 'Elsőkerék / 1 fok. automata', rec: 'Városba és ingázásra', note: '52 kWh akkumulátor' } },
    faqExtra: [],
    schema: { drive: 'FWD' },
  },
  'CUPRA Tavascan': {
    body: 'SUV Coupé',
    overviewH2: 'CUPRA Tavascan tartós bérlet — elektromos SUV Coupé havidíjjal',
    guideIntro: 'A <strong>CUPRA Tavascan</strong> a márka elektromos SUV Coupéja: markáns, sportos megjelenés, tágas utastér és látványos, lebegő középkonzol. A bérelhető <strong>58 kWh</strong> változat 190 LE-s, hátsókerék-hajtású. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, az akkumulátor és az értékvesztés kockázata nem a tiéd.',
    guideBlocks: [
      { h3: 'Miért a CUPRA Tavascan?', html: 'A Tavascan a SUV kényelmét a coupé sportosságával ötvözi: magas üléspozíció, nagy csomagtér és a CUPRA egyik legjellegzetesebb dizájnja. Az 58 kWh-s változat a mindennapokra és rövidebb utazásokra ideális, kedvezőbb havidíjjal.' },
      { h3: 'Miért érdemes elektromos autót bérelni?', html: EV_WHY },
    ],
    design: { h3: 'Markáns SUV Coupé', text: 'Háromszög alakú mátrix fényszórók, világító CUPRA-logó hátul, izmos kerékívek és lejtős tetővonal — a Tavascan az utcán is feltűnő.', bullets: ['Matrix LED fényszórók háromszög-grafikával', 'Világító CUPRA-logó hátul', 'Lejtős, coupé-szerű tetővonal'] },
    interior: { h3: 'Lebegő középkonzol, sportos ülések', text: 'A műszerfalon átívelő, gerincszerű középkonzol, a nagy érintőkijelző és a kagylóülések különleges, sportos hangulatot adnak.', bullets: ['Lebegő, gerincszerű középkonzol', '15" érintőkijelző (felszereltségtől függően)', 'CUPRA kagylóülések (felszereltségtől függően)'] },
    specs: { '58 kWh': { label: 'Tavascan 58 kWh', fuel: 'Elektromos', power: '190 LE (140 kW)', drive: 'Hátsókerék / 1 fok. automata', rec: 'Kedvezőbb havidíj, mindennapokra', note: '58 kWh akkumulátor' } },
    faqExtra: [],
    schema: { drive: 'RWD' },
  },

  // ================= Hyundai =================
  'Hyundai Tucson': {
    overviewH2: 'Hyundai Tucson tartós bérlet — népszerű családi SUV havidíjjal',
    guideIntro: 'A <strong>Hyundai Tucson</strong> Európa egyik legkelendőbb SUV-ja: merész dizájn, tágas utastér, gazdag felszereltség és hosszú garancia. <strong>Tartós bérletben</strong> 1.6 T-GDI benzines és plug-in hibrid változatok közül választhatsz, két- vagy összkerékhajtással — egyetlen havi díjjal, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Trend, N Line, N Line X vagy Prime?', html: 'A <strong>Trend</strong> jól felszerelt alapváltozat, az <strong>N Line</strong> és <strong>N Line X</strong> sportos külső és belső dizájnnal (összkerékhajtással), a <strong>Prime</strong> pedig a legkomfortosabb, prémium felszereltséggel érkezik.' },
      { h3: 'Kinek ajánljuk a Tucson bérlését?', html: 'Családoknak és céges felhasználóknak, akik tágas, jól felszerelt SUV-t keresnek kedvező havidíjjal. A frissített Tucson nagyobb kijelzőket, új kormányt és új vezetéstámogató rendszereket kapott.' },
    ],
    design: { h3: 'Parametrikus dizájn', text: 'A rejtett nappali menetfényekkel díszített „parametrikus” hűtőrács, az éles vonalak és az N Line kivitel sportos lökhárítói teszik a Tucsont egyedivé.', bullets: ['Parametrikus hűtőrács rejtett LED menetfénnyel', 'N Line sportos külső (kiviteltől függően)', '18–19" könnyűfém keréktárcsák'] },
    interior: { h3: 'Ívelt panorámakijelző', text: 'A frissített Tucsonban ívelt, két 12,3"-os kijelzőből álló panorámaegység, kormányoszlopra helyezett váltókar és tágas középkonzol fogad.', bullets: ['Ívelt 12,3"+12,3" panorámakijelző', 'Vezeték nélküli okostelefon-integráció', 'Ülésfűtés, kormányfűtés (felszereltségtől függően)'] },
    faqExtra: [ { q: 'Van összkerékhajtású Hyundai Tucson bérelhető?', a: 'Igen, az N Line és N Line X változatok 4WD összkerékhajtásúak; a Trend és a Prime kétkerék-hajtású.' } ],
  },
  'Hyundai IONIQ 6': {
    body: 'Limuzin',
    overviewH2: 'Hyundai IONIQ 6 tartós bérlet — áramvonalas elektromos limuzin havidíjjal',
    guideIntro: 'A <strong>Hyundai IONIQ 6</strong> az egyik leghatékonyabb elektromos limuzin: áramvonalas „streamliner” forma, 800 voltos rendszer, villámtöltés és a bérelhető <strong>84 kWh 4WD N Line</strong> változattal 325 LE összkerékhajtás. <strong>Elektromos autó tartós bérletben</strong>: egyetlen havi díjat fizetsz, az akkumulátor és az értékvesztés kockázata nem a tiéd.',
    guideBlocks: [
      { h3: 'Miért az IONIQ 6?', html: 'A kiemelkedően alacsony légellenállás és a 84 kWh-s akkumulátor nagy hatótávot ad, a 800 voltos technikával pedig megfelelő töltőn kb. 18 perc alatt tölt 10-ről 80%-ra. Az N Line kivitel sportos dizájnt és összkerékhajtást kínál.' },
      { h3: 'Miért érdemes elektromos autót bérelni?', html: EV_WHY },
    ],
    design: { h3: 'Streamliner-forma', text: 'Íves tetővonal, pixel-grafikás lámpák és kettős hátsó spoiler — az IONIQ 6 formája a hatékonyságot szolgálja.', bullets: ['Parametrikus pixel LED lámpák', 'N Line sportos külső', 'Kiváló aerodinamika'] },
    interior: { h3: 'Tágas, nappali-szerű utastér', text: 'Lapos padló, két 12,3"-os kijelző, relaxációs ülések és fenntartható anyagok.', bullets: ['12,3"+12,3" kijelzők', 'V2L – külső eszközök áramellátása', 'Hőszivattyú, előklimatizálás'] },
    specs: { '84 kWh 4WD N Line': { label: 'IONIQ 6 84 kWh 4WD N Line', fuel: 'Elektromos', power: '325 LE (239 kW)', drive: 'Összkerék (két villanymotor)', rec: 'Nagy hatótáv, összkerékhajtás', note: '800 V, villámtöltés' } },
    faqExtra: [ { q: 'Milyen gyorsan tölt a Hyundai IONIQ 6?', a: 'A 800 voltos rendszernek köszönhetően megfelelő DC töltőn kb. 18 perc alatt tölt 10-ről 80%-ra.' } ],
    schema: { drive: 'AWD' },
  },
  'Hyundai IONIQ 5 N': {
    overviewH2: 'Hyundai IONIQ 5 N tartós bérlet — 609 LE-s elektromos sportautó',
    guideIntro: 'A <strong>Hyundai IONIQ 5 N</strong> a világ egyik legizgalmasabb elektromos sportautója: akár <strong>609 LE</strong> (N Grin Boost), 740 Nm, összkerékhajtás, 0–100 km/h 3,5 másodperc, versenypályára hangolt futómű és virtuális váltó (N e-shift). <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Mitől különleges az IONIQ 5 N?', html: 'Az N e-shift virtuális sebességváltó és az N Active Sound+ hanggenerátor belsőégésű sportautós élményt ad, az N Drift Optimizer és a pályára optimalizált akkumulátor-hűtés pedig komoly vezetői autóvá teszi.' },
      { h3: 'Miért érdemes bérelni?', html: 'Egy ilyen különleges autó értékvesztése nehezen kiszámítható — <strong>tartós bérletben</strong> ez nem a te kockázatod, te csak vezeted.' },
    ],
    design: { h3: 'N-dizájn, széles nyomtáv', text: 'Szélesebb kerékívek, alacsonyabb hasmagasság, piros N-díszítés, nagy hátsó szárny és 21"-os keréktárcsák.', bullets: ['Szélesített karosszéria, N lökhárítók', 'Nagy hátsó szárny', '21" kovácsolt keréktárcsák'] },
    interior: { h3: 'Sportos N utastér', text: 'Mélyebben ülő N kagylóülések, N kormány gyorsgombokkal és pályaadatokat mutató kijelzők.', bullets: ['N kagylóülések', 'N kormány, N Grin Boost gomb', 'Pálya-telemetria a kijelzőn'] },
    specs: { '84 kWh 4WD': { label: 'IONIQ 5 N 84 kWh 4WD', fuel: 'Elektromos', power: 'akár 609 LE (448 kW, boost)', torque: '740 Nm', drive: 'Összkerék (két villanymotor)', accel: '3,5 mp', vmax: '260 km/h', rec: 'Elektromos sportautó', note: 'N e-shift, N Grin Boost' } },
    faqExtra: [ { q: 'Mennyi a Hyundai IONIQ 5 N teljesítménye?', a: 'Az IONIQ 5 N N Grin Boost funkcióval akár 609 lóerős (448 kW), 740 Nm nyomatékú; 0–100 km/h 3,5 mp.' } ],
    schema: { drive: 'AWD' },
  },
  'Hyundai IONIQ 6 N': {
    body: 'Limuzin',
    overviewH2: 'Hyundai IONIQ 6 N tartós bérlet — elektromos sportlimuzin 609 LE-vel',
    guideIntro: 'A <strong>Hyundai IONIQ 6 N</strong> az IONIQ 6 sportlimuzin-változata: akár <strong>609 LE</strong> (N Grin Boost), 740 Nm, összkerékhajtás, N e-shift virtuális váltó és versenypályára hangolt futómű. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a különleges sportautó értékvesztése nem a te kockázatod.',
    guideBlocks: [
      { h3: 'IONIQ 6 N vagy IONIQ 5 N?', html: 'Technikában rokonok. A <strong>6 N</strong> alacsonyabb, áramvonalasabb limuzin, a <a href="/berelheto-auto/hyundai-ioniq-5-n-berles">IONIQ 5 N</a> magasabb, crossover-karakterű.' },
    ],
    design: { h3: 'Streamliner, N-stílusban', text: 'Szélesített karosszéria, hattyúnyak-rögzítésű hátsó szárny, N lökhárítók és 20"-os kovácsolt keréktárcsák.', bullets: ['Hattyúnyak hátsó szárny', 'Szélesített nyomtáv', 'N díszítés, piros részletek'] },
    interior: { h3: 'N utastér', text: 'N kagylóülések, N kormány gyorsgombokkal és a pályavezetést támogató kijelzők.', bullets: ['N kagylóülések', 'N kormány, N Grin Boost gomb', 'N Active Sound+'] },
    specs: { '84 kWh 4WD': { label: 'IONIQ 6 N 84 kWh 4WD', fuel: 'Elektromos', power: 'akár 609 LE (448 kW, boost)', torque: '740 Nm', drive: 'Összkerék (két villanymotor)', rec: 'Elektromos sportlimuzin', note: 'N e-shift, N Grin Boost' } },
    faqExtra: [],
    schema: { drive: 'AWD' },
  },
  'Hyundai Staria': {
    body: 'Egyterű',
    overviewH2: 'Hyundai Staria tartós bérlet — prémium kisbusz havidíjjal',
    guideIntro: 'A <strong>Hyundai Staria</strong> futurisztikus megjelenésű prémium egyterű: hatalmas utastér, nagy üvegfelületek, tolóajtók és kényelmes ülések. A bérelhető <strong>1.6 T-GDI Signature</strong> hibrid hajtású, csúcsfelszereltségű. <strong>Tartós bérletben</strong> családoknak, sofőrszolgálatoknak és cégeknek is ideális — egyetlen havi díjjal.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a Staria bérlését?', html: 'Nagycsaládoknak, szállodáknak, transzfercégeknek és vállalatoknak, ahol fontos a sok hely és a reprezentatív megjelenés. A Signature felszereltség prémium ülésekkel és gazdag komfortfelszereltséggel érkezik.' },
    ],
    design: { h3: 'Űrhajó-dizájn', text: 'Az elöl végigfutó fénysáv, a nagy, alacsony ablakok és a tiszta felületek teszik a Stariát a kategória legfeltűnőbb modelljévé.', bullets: ['Végigfutó LED fénysáv elöl', 'Nagy üvegfelületek', 'Elektromos tolóajtók (felszereltségtől függően)'] },
    interior: { h3: 'Nappali-szerű utastér', text: 'Tágas, világos utastér, kényelmes ülések, sok tárolóhely és digitális műszerfal.', bullets: ['Digitális műszerfal, nagy érintőkijelző', 'Kényelmes, állítható ülések', 'Hátsó klíma (felszereltségtől függően)'] },
    specs: { '1.6 T-GDI 2WD Signature': { label: 'Staria 1.6 T-GDI Signature', fuel: 'Benzin (hibrid)', power: '224 LE rendszer', drive: 'Elsőkerék / automata', rec: 'Prémium kisbusz', note: 'hibrid, Signature felszereltség' } },
    faqExtra: [],
  },
  'Hyundai Santa Fe': {
    overviewH2: 'Hyundai Santa Fe tartós bérlet — nagy családi SUV plug-in hibriddel',
    guideIntro: 'Az új <strong>Hyundai Santa Fe</strong> szögletes, robusztus nagy SUV: tágas, akár hétüléses utastér, hatalmas csomagtér és a bérelhető <strong>1.6 T-GDI 4WD Blackline</strong> plug-in hibrid hajtás összkerékhajtással. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Miért a Santa Fe plug-in hibrid?', html: 'Ha tölteni tudsz, a napi rövidebb utak tisztán elektromosan megtehetők, hosszú úton pedig a benzinmotor és az összkerékhajtás gondoskodik a teljesítményről. A Blackline kivitel sötét, sportos dizájnelemekkel érkezik.' },
    ],
    design: { h3: 'Szögletes, terepjárós forma', text: 'Az „H” alakú lámpatestek, a nagy csomagtérajtó és a szögletes karosszéria robusztus, modern megjelenést adnak.', bullets: ['H-motívumú LED lámpák', 'Blackline sötét dizájnelemek', 'Nagy csomagtérajtó'] },
    interior: { h3: 'Tágas, prémium utastér', text: 'Ívelt panorámakijelző, sok tárolóhely, kényelmes ülések és akár harmadik üléssor.', bullets: ['Ívelt panorámakijelző', 'Akár 7 ülés (kiviteltől függően)', 'Kettős vezeték nélküli töltő'] },
    specs: { '1.6 T-GDI 4WD Blackline': { label: 'Santa Fe 1.6 T-GDI PHEV 4WD Blackline', fuel: 'Plug-in hibrid', power: '288 LE rendszer', drive: 'Összkerék / 6 fok. automata', rec: 'Családi SUV, töltési lehetőséggel', note: 'plug-in hibrid, összkerékhajtás' } },
    faqExtra: [],
    schema: { drive: 'AWD' },
  },

  // ================= Kia =================
  'Kia EV2': {
    body: 'Kis SUV',
    overviewH2: 'Kia EV2 tartós bérlet — az új elektromos kis SUV havidíjjal',
    guideIntro: 'Az új <strong>Kia EV2</strong> a márka elektromos belépőmodellje: kompakt kis SUV, magas üléspozíció, meglepően tágas utastér és a legkedvezőbb havidíjú elektromos autók egyike. A bérelhető <strong>Earth 42,2 kWh</strong> változat 147 LE-s. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, az akkumulátor és az értékvesztés kockázata nem a tiéd.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a Kia EV2-t?', html: 'Városi ingázóknak, második autónak és mindenkinek, aki kedvező havidíjjal szeretne elektromos autóra váltani. A 42,2 kWh-s akkumulátor a napi utakra bőven elegendő, a kompakt méret városban ideális.' },
      { h3: 'Miért érdemes elektromos autót bérelni?', html: EV_WHY },
    ],
    design: { h3: 'Robusztus kis SUV', text: 'A Kia „Opposites United” dizájnnyelve: függőleges fényszórók, szögletes kerékívek és magabiztos arányok kis méretben.', bullets: ['Függőleges LED fényszórók', 'Szögletes, robusztus forma', 'Tetősínek'] },
    interior: { h3: 'Okos, tágas utastér', text: 'Nagy kijelzők, csúsztatható hátsó ülések és sok tárolóhely a kompakt karosszériában.', bullets: ['Digitális műszerfal és érintőkijelző', 'Csúsztatható hátsó üléssor (kiviteltől függően)', 'Okostelefon-integráció'] },
    specs: { 'Earth 42,2 kWh': { label: 'EV2 Earth 42,2 kWh', fuel: 'Elektromos', power: '147 LE (108 kW)', drive: 'Elsőkerék / 1 fok. automata', rec: 'Városba, kedvező havidíj', note: '42,2 kWh akkumulátor' } },
    faqExtra: [],
    schema: { drive: 'FWD' },
  },
  'Kia EV4': {
    body: 'Kompakt',
    overviewH2: 'Kia EV4 tartós bérlet — elektromos kompakt nagy hatótávval',
    guideIntro: 'A <strong>Kia EV4</strong> a márka elektromos kompaktja: áramvonalas forma, tágas utastér és a bérelhető <strong>Earth 81,4 kWh</strong> változattal kiemelkedő, akár 600 km körüli WLTP hatótáv, 204 LE teljesítménnyel. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, az akkumulátor és az értékvesztés kockázata nem a tiéd.',
    guideBlocks: [
      { h3: 'Miért a Kia EV4?', html: 'A nagy, 81,4 kWh-s akkumulátor és a jó aerodinamika miatt az EV4 hosszú utakra is alkalmas elektromos kompakt, a Kia gazdag alapfelszereltségével.' },
      { h3: 'Miért érdemes elektromos autót bérelni?', html: EV_WHY },
    ],
    design: { h3: 'Merész, áramvonalas forma', text: 'Függőleges fényszórók, hosszú tetővonal és egyedi hátsó rész — az EV4 a Kia új elektromos dizájnnyelvét hozza.', bullets: ['Függőleges LED fényszórók', 'Áramvonalas karosszéria', 'Egyedi hátsó lámpák'] },
    interior: { h3: 'Panorámakijelző, tágas tér', text: 'Egybefüggő panorámakijelző, minimalista műszerfal és a lapos padló miatt tágas hátsó üléssor.', bullets: ['Panorámakijelző (12,3" + 5" + 12,3")', 'Vezeték nélküli okostelefon-integráció', 'Hőszivattyú, előklimatizálás'] },
    specs: { 'Earth 81,4 kWh': { label: 'EV4 Earth 81,4 kWh', fuel: 'Elektromos', power: '204 LE (150 kW)', drive: 'Elsőkerék / 1 fok. automata', rec: 'Nagy hatótáv', note: '81,4 kWh akkumulátor, kb. 600 km (WLTP)' } },
    faqExtra: [ { q: 'Mekkora a Kia EV4 hatótávja?', a: 'A 81,4 kWh-s akkumulátorral a WLTP szerinti hatótáv 600 km körüli; a valós érték a vezetési stílustól és az időjárástól függ.' } ],
    schema: { drive: 'FWD' },
  },

  // ================= Volvo =================
  'Volvo XC40': {
    overviewH2: 'Volvo XC40 tartós bérlet — prémium kompakt SUV havidíjjal',
    guideIntro: 'A <strong>Volvo XC40</strong> a skandináv prémium kompakt SUV: letisztult dizájn, kiváló biztonság, kényelmes ülések és praktikus utastér. A bérelhető <strong>B3 Black Edition Plus</strong> 163 LE-s mild-hybrid benzines, különleges fekete dizájncsomaggal. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Mi a Black Edition?', html: 'A Black Edition teljesen fekete külső részleteket — hűtőrács, logók, keréktárcsák, tükörházak — és sötét belső kárpitot kap, a Plus felszereltség pedig gazdag komfort- és biztonsági extrákat tartalmaz.' },
      { h3: 'Kinek ajánljuk az XC40 bérlését?', html: 'Városi családoknak és prémium kompakt SUV-t kereső céges felhasználóknak, akiknek fontos a biztonság, a kényelem és az egyedi, elegáns megjelenés.' },
    ],
    design: { h3: 'Skandináv, magabiztos forma', text: 'Thor-kalapács LED fényszórók, magasított váll-vonal és a Black Edition fekete részletei.', bullets: ['„Thor-kalapács” LED fényszórók', 'Black Edition fekete dizájnelemek', '19–20" fekete keréktárcsák'] },
    interior: { h3: 'Letisztult, praktikus utastér', text: 'Google-alapú infotainment, digitális műszerfal, kiváló ülések és rengeteg okos tárolóhely.', bullets: ['Google beépített infotainment', 'Digitális műszerfal', 'Harman Kardon hangrendszer (felszereltségtől függően)'] },
    specs: { 'B3 Black Edition Plus': { label: 'XC40 B3 Black Edition Plus', fuel: 'Benzin (mild-hybrid)', power: '163 LE (120 kW)', drive: 'Elsőkerék / 7 fok. automata', rec: 'Stílusos, városi SUV', note: 'mild-hybrid benzines, Black Edition' } },
    faqExtra: [],
    schema: { drive: 'FWD' },
  },
  'Volvo V60': {
    body: 'Kombi',
    overviewH2: 'Volvo V60 tartós bérlet — plug-in hibrid prémium kombi havidíjjal',
    guideIntro: 'A <strong>Volvo V60</strong> elegáns, biztonságos prémium kombi, a bérelhető <strong>T6 Recharge AWD Ultra Dark</strong> pedig plug-in hibrid, összkerékhajtással és csúcsfelszereltséggel. Ha tölteni tudsz, a napi ingázás tisztán elektromosan megtehető. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Miért a V60 T6 Recharge?', html: 'Benzinmotor és villanymotor együtt, összkerékhajtással: dinamikus, mégis takarékos kombi, amely rövid utakon tisztán elektromosan, hosszú utakon hatótáv-szorongás nélkül halad. Az Ultra Dark kivitel sötét dizájnelemekkel és gazdag felszereltséggel érkezik.' },
    ],
    design: { h3: 'Elegáns skandináv kombi', text: 'Hosszú, alacsony sziluett, Thor-kalapács LED fényszórók és az Ultra Dark sötét részletei.', bullets: ['„Thor-kalapács” LED fényszórók', 'Ultra Dark sötét dizájnelemek', 'Elektromos csomagtérajtó'] },
    interior: { h3: 'Prémium, nyugodt utastér', text: 'Kiváló ülések, Google-alapú infotainment, prémium anyagok és a Volvo jellegzetes, letisztult formavilága.', bullets: ['Google beépített infotainment', 'Bowers & Wilkins / Harman Kardon hangrendszer (felszereltségtől függően)', 'Panorámatető (felszereltségtől függően)'] },
    specs: { 'T6 Recharge AWD Ultra Dark': { label: 'V60 T6 Recharge AWD Ultra Dark', fuel: 'Plug-in hibrid', drive: 'Összkerék (AWD) / 8 fok. automata', rec: 'Tölthető prémium kombi', note: 'plug-in hibrid, összkerékhajtás' } },
    faqExtra: [],
    schema: { drive: 'AWD' },
  },

  // ================= Seat =================
  'Seat Leon Sportstourer': {
    body: 'Kombi',
    overviewH2: 'SEAT Leon Sportstourer tartós bérlet — plug-in hibrid kombi havidíjjal',
    guideIntro: 'A <strong>SEAT Leon Sportstourer</strong> a Leon praktikus kombiváltozata, a bérelhető <strong>1,5 e-HYBRID FR</strong> pedig plug-in hibrid, 204 LE rendszerteljesítménnyel és 100 km feletti elektromos hatótávval (WLTP). <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Miért a Leon Sportstourer e-HYBRID?', html: 'Ha otthon vagy a munkahelyen tölteni tudsz, a napi ingázás nagy része tisztán elektromosan megtehető, hosszú úton pedig a benzinmotor gondoskodik a hatótávról. Az FR kivitel sportos futóművel és dizájnnal érkezik.' },
    ],
    design: { h3: 'Sportos kombi', text: 'Az FR kivitel sportos lökhárítói, a végigfutó hátsó lámpasáv és a dinamikus tetővonal teszik a Leon Sportstourert elegáns, fiatalos kombivá.', bullets: ['FR sportos külső', 'Végigfutó hátsó LED lámpasáv', 'Full LED fényszórók'] },
    interior: { h3: 'Digitális utastér', text: 'Digitális műszerfal, nagy érintőkijelző, sportülések és nagy csomagtér.', bullets: ['Digital Cockpit', 'Nagy érintőkijelző, vezeték nélküli okostelefon-integráció', 'FR sportülések'] },
    specs: { '1,5 e-HYBRID FR': { label: 'Leon Sportstourer 1,5 e-HYBRID FR', fuel: 'Plug-in hibrid', power: '204 LE (150 kW) rendszer', drive: 'Elsőkerék / 6 fok. DSG', rec: 'Tölthető családi kombi', note: '100 km feletti elektromos hatótáv (WLTP)' } },
    faqExtra: [],
    schema: { drive: 'FWD' },
  },

  // ================= MAN =================
  'MAN TGE Kombi Basic': {
    body: 'Kisbusz',
    overviewH2: 'MAN TGE Kombi tartós bérlet — személyszállító kisbusz havidíjjal',
    guideIntro: 'A <strong>MAN TGE Kombi</strong> megbízható, tágas személyszállító kisbusz: 2,0 literes, 177 LE-s dízelmotor, automata váltó, elsőkerék- vagy összkerékhajtás (4X4). <strong>Tartós bérletben</strong> vállalkozásoknak, transzfercégeknek és egyesületeknek is ideális — egyetlen havi díjjal, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: '4X2F vagy 4X4?', html: 'A <strong>4X2F</strong> elsőkerék-hajtású, a mindennapi személyszállításra ideális; a <strong>4X4</strong> összkerékhajtású változat télen, rossz utakon és terepen is biztonságos.' },
      { h3: 'Kinek ajánljuk a MAN TGE Kombit?', html: 'Cégeknek, amelyek munkásokat, csapatokat vagy vendégeket szállítanak, sportegyesületeknek és nagycsaládoknak. A tartós bérlet kiszámítható költséget ad, és nem köt le tőkét.' },
    ],
    design: { h3: 'Robusztus, praktikus kisbusz', text: 'Nagy tolóajtó, magas tető, sok ablak és masszív felépítés — a TGE a hosszú távú, intenzív használatra készült.', bullets: ['Tolóajtó, nagy belső tér', 'Kiváló kilátás', 'Masszív, strapabíró felépítés'] },
    interior: { h3: 'Tágas személyszállító tér', text: 'Kényelmes ülések, sok hely a lábaknak és a csomagoknak, modern vezetőfülke vezetéstámogató rendszerekkel.', bullets: ['Többszemélyes üléssorok', 'Klíma, rádió/okostelefon-integráció', 'Vezetéstámogató rendszerek (felszereltségtől függően)'] },
    specs: {
      '3.180 4X2F SB': { label: 'TGE Kombi 3.180 4X2F', fuel: 'Dízel', power: '177 LE (130 kW)', drive: 'Elsőkerék / 8 fok. automata', rec: 'Mindennapi személyszállítás', note: '2,0 literes dízel, elsőkerék-hajtás' },
      '3.180 4X4 SB': { label: 'TGE Kombi 3.180 4X4', fuel: 'Dízel', power: '177 LE (130 kW)', drive: 'Összkerék (4X4) / 8 fok. automata', rec: 'Télre, rossz utakra', note: '2,0 literes dízel, összkerékhajtás' },
    },
    faqExtra: [],
  },
};

// ---------- Sajtó-/gyári fotók hozzárendelése (/berles-press/<modell>-<kulcs>.webp) ----------
// Források: hyundai.news (Hyundai Europe Newsroom), kia.com/hu, volvocars.com/hu, cupraofficial.hu, seat.hu
const PH = (m: string, k: string) => `/berles-press/${m}-${k}.webp`;
function withPhotos(key: string, m: string, name: string, interior: boolean, gal: [string, string][]) {
  const c = OTHERS[key];
  if (!c) return;
  c.mainImg = PH(m, 'main');
  c.mainAlt = `${name} bérlés — ${name} tartós bérletben`;
  if (c.design) c.design = { ...c.design, img: PH(m, 'design'), alt: `${name} — külső dizájn` };
  if (interior && c.interior) c.interior = { ...c.interior, img: PH(m, 'interior'), alt: `${name} belső tér` };
  c.gallery = gal.map(([k, alt]) => ({ img: PH(m, k), alt: `${name} ${alt}` }));
}
withPhotos('CUPRA Born', 'cupra-born', 'CUPRA Born', true, [['g1', 'elölnézet, LED fényszórók'], ['g2', 'stúdiófotó'], ['g3', 'töltés közben, garázsban'], ['g4', 'hátulról, menet közben'], ['g5', 'digitális műszerfal']]);
withPhotos('CUPRA Raval', 'cupra-raval', 'CUPRA Raval', true, [['g1', 'elölnézet, háromszög fényszórók'], ['g2', 'városi utcán'], ['g3', 'töltés közben'], ['g4', 'hátulról'], ['g5', 'kormány és kijelző']]);
withPhotos('CUPRA Tavascan', 'cupra-tavascan', 'CUPRA Tavascan', true, [['g1', 'naplementében'], ['g2', 'világító hátsó logó']]);
withPhotos('Hyundai Tucson', 'hyundai-tucson', 'Hyundai Tucson', true, [['g1', 'oldalnézet'], ['g2', 'oldalnézet, modern épület előtt'], ['g3', 'menet közben'], ['g4', 'elölnézet'], ['g5', 'hátulról'], ['g6', 'városban'], ['g7', 'hátulról, menet közben'], ['g8', 'országúton'], ['g9', 'fehér színben'], ['g10', 'első ülések']]);
withPhotos('Hyundai IONIQ 6', 'hyundai-ioniq-6', 'Hyundai IONIQ 6', true, [['g1', 'N Line, piros színben'], ['g2', 'elölnézet'], ['g3', 'városban'], ['g4', 'menet közben'], ['g5', 'országúton'], ['g6', 'hátulról'], ['g7', 'hátulról, menet közben'], ['g8', 'keréktárcsa'], ['g9', 'vezetőtér']]);
withPhotos('Hyundai IONIQ 5 N', 'hyundai-ioniq-5-n', 'Hyundai IONIQ 5 N', false, [['g1', 'kilátóponton'], ['g2', 'szerpentinen'], ['g3', 'kanyarban'], ['g4', 'hegyi úton'], ['g5', 'modern épület előtt'], ['g6', 'menet közben'], ['g7', 'naplementében'], ['g8', 'hátulról, kanyarban'], ['g9', 'N keréktárcsa, piros féknyereg']]);
withPhotos('Hyundai IONIQ 6 N', 'hyundai-ioniq-6-n', 'Hyundai IONIQ 6 N', true, [['g1', 'hegyi úton'], ['g2', 'versenypályán'], ['g3', 'elölnézet'], ['g4', 'pályán, menet közben'], ['g5', 'box előtt'], ['g6', 'elölnézet, N lökhárító'], ['g7', 'drift közben'], ['g8', 'N keréktárcsa'], ['g9', 'hátsó szárny'], ['g10', 'N kagylóülés']]);
withPhotos('Hyundai Staria', 'hyundai-staria', 'Hyundai Staria', true, [['g1', 'szabadban'], ['g2', 'hátsó ülések'], ['g3', 'utastér'], ['g4', 'műszerfal'], ['g5', 'kempingezés közben']]);
withPhotos('Hyundai Santa Fe', 'hyundai-santa-fe', 'Hyundai Santa Fe', true, [['g1', 'elölnézet, H fénygrafika'], ['g2', 'erdei úton'], ['g3', 'kanyarban'], ['g4', 'oldalnézet'], ['g5', 'hátulról, menet közben'], ['g6', 'hátulról'], ['g7', 'LED fénygrafika'], ['g8', 'hátsó lámpák']]);
withPhotos('Kia EV2', 'kia-ev2', 'Kia EV2', true, [['g1', 'elölnézet'], ['g2', 'naplementében'], ['g3', 'fehér színben'], ['g4', 'hátsó háromnegyedes nézet'], ['g5', 'városban'], ['g6', 'tengerparton'], ['g7', 'hátsó ülések'], ['g8', 'csomagtartó'], ['g9', 'stúdiófotó']]);
withPhotos('Kia EV4', 'kia-ev4', 'Kia EV4', true, [['g1', 'oldalnézet'], ['g2', 'városban'], ['g3', 'utcán'], ['g4', 'töltés közben'], ['g5', 'garázsban'], ['g6', 'kormány és kijelző'], ['g7', 'LED fényszóró'], ['g8', 'keréktárcsa'], ['g9', 'stúdiófotó']]);
withPhotos('Volvo XC40', 'volvo-xc40', 'Volvo XC40', true, [['g1', 'oldalnézet'], ['g2', 'oldalnézet, stúdió'], ['g3', 'elölnézet, keréktárcsa'], ['g4', 'nyitott ajtókkal'], ['g5', 'csomagtartó'], ['g6', 'elölnézet']]);
withPhotos('Volvo V60', 'volvo-v60', 'Volvo V60', true, [['g1', 'oldalnézet'], ['g2', 'elölnézet'], ['g3', 'hűtőrács'], ['g4', 'Thor-kalapács LED fényszóró'], ['g5', 'csomagtartó'], ['g6', 'első ülések'], ['g7', 'panorámatető'], ['g8', 'keréktárcsa']]);
withPhotos('Seat Leon Sportstourer', 'seat-leon-sportstourer', 'SEAT Leon Sportstourer', true, [['g1', 'felülnézet'], ['g2', 'hátulról'], ['g3', 'töltés közben'], ['g4', 'töltőcsatlakozó'], ['g5', 'utánfutóval'], ['g6', 'műszerfal'], ['g7', 'csomagtartó']]);
