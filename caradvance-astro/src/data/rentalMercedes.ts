// Mercedes-Benz bérlési tartalom — sajtófotók: Mercedes-Benz Media (media.mercedes-benz.com), 1200×900 webp.
// Számok (ár, km, futamidő, kaució, darabszám) NEM itt vannak: azok a napi Choice-szinkronból jönnek.
import type { RentalContent, TrimSpec } from './rentalPage';

const P = (m: string, k: string) => `/berles-press/${m}-${k}.webp`;
const G = (m: string, name: string, items: [string, string][]) => items.map(([k, alt]) => ({ img: P(m, k), alt: `${name} ${alt}` }));
const D = (m: string, name: string, h3: string, text: string, bullets: string[], alt: string) => ({ h3, text, bullets, img: P(m, 'design'), alt: `${name} ${alt}` });
const I = (m: string | null, name: string, h3: string, text: string, bullets: string[], alt = 'belső tér') => (m ? { h3, text, bullets, img: P(m, 'interior'), alt: `${name} ${alt}` } : { h3, text, bullets });
const MBUX = 'MBUX multimédia-rendszer „Hey Mercedes” hangvezérléssel';

// GLC és GLC Coupé közös motorpalettája (X254 / C254)
const glcSpecs = (m: string): Record<string, TrimSpec> => ({
  '200 4MATIC': { label: '200 4MATIC', fuel: 'Benzin (mild-hybrid)', power: '204 LE (150 kW) + 23 LE EQ Boost', torque: '320 Nm', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'Vegyes használatra', note: 'négyhengeres benzines, 48 V mild-hybrid', img: P(m, 'g1') },
  '220d 4MATIC': { label: '220 d 4MATIC', fuel: 'Dízel (mild-hybrid)', power: '197 LE (145 kW) + 23 LE EQ Boost', torque: '440 Nm', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'Takarékos, sokat autózóknak', note: 'takarékos dízel', img: P(m, 'g2') },
  '300d 4MATIC': { label: '300 d 4MATIC', fuel: 'Dízel (mild-hybrid)', power: '269 LE (198 kW) + 23 LE EQ Boost', torque: '550 Nm', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'Erős dízel, vontatásra', note: 'erős négyhengeres dízel', img: P(m, 'g3') },
  '300 4MATIC': { label: '300 4MATIC', fuel: 'Benzin (mild-hybrid)', power: '258 LE (190 kW) + 23 LE EQ Boost', torque: '400 Nm', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'Dinamikus benzines', note: 'erős benzines', img: P(m, 'g4') },
  '450d 4MATIC': { label: '450 d 4MATIC', fuel: 'Dízel (6 henger, mild-hybrid)', power: '367 LE (270 kW) + 23 LE EQ Boost', torque: '750 Nm', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'A csúcs: hathengeres dízel', note: 'hathengeres dízel', img: P(m, 'g5') },
});

export const MERCEDES: Record<string, RentalContent> = {
  // ---------------- GLC Coupé ----------------
  'Mercedes-Benz GLC Coupé': {
    mainImg: P('mercedes-benz-glc-coupe', 'main'), mainAlt: 'Mercedes-Benz GLC Coupé bérlés — az új GLC Coupé tartós bérletben',
    overviewH2: 'Mercedes-Benz GLC Coupé tartós bérlet — sportos SUV Coupé havidíjjal',
    guideIntro: 'Az új <strong>Mercedes-Benz GLC Coupé</strong> (C254) a népszerű GLC lecsapott tetővonalú, sportosabb változata: elegáns coupé-sziluett, SUV-kényelem, <strong>4MATIC összkerékhajtás</strong> minden változatban és mild-hybrid technika. <strong>Mercedes tartós bérletben</strong> öt motor közül választhatsz — egyetlen havi díjat fizetsz, a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Melyik GLC Coupé-t válaszd?', html: 'A <strong>220 d</strong> a takarékos dízel a sokat autózóknak, a <strong>300 d</strong> erősebb és vontatásra is ideális, a <strong>200</strong> és a <strong>300</strong> benzines a vegyes használatra. A csúcs a hathengeres <strong>450 d</strong>, 750 Nm nyomatékkal. Mindegyik 48 voltos mild-hybrid (EQ Boost) és 4MATIC összkerékhajtású.' },
      { h3: 'GLC Coupé vagy GLC SUV?', html: 'Technikában azonosak. A <strong>Coupé</strong> sportosabb, elegánsabb, a <a href="/berelheto-auto/mercedes-benz-glc-berles">Mercedes-Benz GLC SUV</a> nagyobb fejteret és csomagteret kínál.' },
    ],
    design: D('mercedes-benz-glc-coupe', 'Mercedes-Benz GLC Coupé', 'Coupé-sziluett, SUV-magabiztosság', 'Lejtős tetővonal, gyémánt-mintás hűtőrács, keskeny DIGITAL LIGHT fényszórók (felszereltségtől függően) és az AMG Line sportos lökhárítói — a GLC Coupé feltűnő, mégis elegáns.', ['DIGITAL LIGHT fényszórók (felszereltségtől függően)', 'AMG Line külső csomag (felszereltségtől függően)', '19–20" könnyűfém keréktárcsák'], 'hátsó háromnegyedes nézet'),
    interior: I('mercedes-benz-glc-coupe', 'Mercedes-Benz GLC Coupé', 'Prémium, digitális utastér', 'A 12,3"-os digitális műszerfal és a 11,9"-os központi érintőkijelző, a turbinás szellőzők és a hangulatvilágítás modern, luxus hangulatot ad; a hátsó ülésekben felnőttek is kényelmesen utaznak.', [MBUX, '64 színű hangulatvilágítás', 'Ülésfűtés, kétzónás klíma (felszereltségtől függően)'], 'vezetőtér — MBUX kijelzők'),
    specs: glcSpecs('mercedes-benz-glc-coupe'),
    gallery: G('mercedes-benz-glc-coupe', 'Mercedes-Benz GLC Coupé', [['g1', 'menet közben, tengerparti úton'], ['g2', 'elölnézet'], ['g3', 'oldalnézet'], ['g4', 'kanyarban, felülnézet'], ['g5', 'elölnézet, szerpentinen'], ['g6', 'menet közben'], ['g7', 'országúton'], ['g8', 'kanyarban'], ['g9', 'műszerfal'], ['g10', 'hátsó ülések']]),
    faqExtra: [
      { q: 'Minden Mercedes GLC Coupé összkerékhajtású?', a: 'Igen, a bérelhető GLC Coupé változatok mind 4MATIC összkerékhajtásúak és 9G-TRONIC automata váltósak.' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- GLC ----------------
  'Mercedes-Benz GLC': {
    mainImg: P('mercedes-benz-glc', 'main'), mainAlt: 'Mercedes-Benz GLC bérlés — az új GLC tartós bérletben',
    overviewH2: 'Mercedes-Benz GLC tartós bérlet — a legnépszerűbb Mercedes SUV havidíjjal',
    guideIntro: 'A <strong>Mercedes-Benz GLC</strong> (X254) évek óta a márka legkeresettebb modellje: prémium kényelem, 620 literes csomagtér, <strong>4MATIC összkerékhajtás</strong> és mild-hybrid motorok. <strong>Mercedes tartós bérletben</strong> öt motor közül választhatsz, egyetlen havi díjjal — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Melyik GLC-t válaszd?', html: 'A <strong>220 d</strong> a legtakarékosabb, a <strong>300 d</strong> erős és vontatásra is kiváló (akár 2,5 tonna), a <strong>200</strong> és <strong>300</strong> benzines vegyes használatra, a <strong>450 d</strong> hathengeres dízel pedig a csúcs. Mind 4MATIC összkerékhajtású.' },
      { h3: 'Mercedes GLC méretek és csomagtér', html: 'Hossz 4716 mm, tengelytáv 2888 mm. A csomagtér 620 literes, a hátsó ülések döntésével 1680 literre bővíthető — kategóriájában az egyik legnagyobb.' },
      { h3: 'GLC vagy GLC Coupé?', html: 'A <a href="/berelheto-auto/mercedes-benz-glc-coupe-berles">GLC Coupé</a> sportosabb tetővonallal érkezik; a GLC SUV praktikusabb, nagyobb fejtérrel és csomagtérrel.' },
    ],
    design: D('mercedes-benz-glc', 'Mercedes-Benz GLC', 'Elegáns, magabiztos SUV', 'Az új GLC tiszta, sportos felületekkel, a fényszórókkal összekötött hűtőrács-dizájnnal és opcionális DIGITAL LIGHT fényszórókkal érkezik.', ['DIGITAL LIGHT fényszórók (felszereltségtől függően)', 'AMG Line vagy Avantgarde külső', '18–20" könnyűfém keréktárcsák'], 'hátsó háromnegyedes nézet'),
    interior: I('mercedes-benz-glc', 'Mercedes-Benz GLC', 'Luxus a középkategóriában', 'A lebegő 11,9"-os központi kijelző, a digitális műszerfal, a kiváló ülések és a „Transparent Bonnet” kamerafunkció (felszereltségtől függően) teszik a GLC-t kategóriája egyik legkomfortosabb SUV-jává.', [MBUX, 'Transparent Bonnet kamera (felszereltségtől függően)', 'Hangulatvilágítás, Burmester hangrendszer (felszereltségtől függően)'], 'vezetőtér'),
    boot: '620–1680 liter',
    specs: glcSpecs('mercedes-benz-glc'),
    gallery: G('mercedes-benz-glc', 'Mercedes-Benz GLC', [['g1', 'szerpentinen'], ['g2', 'erdei úton'], ['g3', 'kanyarban, hátulról'], ['g4', 'oldalnézet'], ['g5', 'modern ház előtt'], ['g6', 'fekete színben'], ['g7', 'menet közben'], ['g8', 'hegyi úton'], ['g9', 'csomagtartó'], ['g10', 'műszerfal']]),
    faqExtra: [
      { q: 'Mekkora a Mercedes GLC csomagtartója?', a: 'A GLC csomagtere 620 literes, a hátsó ülések döntésével 1680 literre bővíthető.' },
      { q: 'Mennyit vontathat a Mercedes GLC?', a: 'Kiviteltől függően akár 2,5 tonnát; a pontos értéket az ajánlatban megadjuk.' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- C-Klasse ----------------
  'Mercedes-Benz C-Klasse': {
    mainImg: P('mercedes-benz-c-osztaly', 'main'), mainAlt: 'Mercedes-Benz C-osztály bérlés — C-osztály limuzin tartós bérletben',
    body: 'Limuzin',
    overviewH2: 'Mercedes-Benz C-osztály tartós bérlet — a prémium középkategória havidíjjal',
    guideIntro: 'A <strong>Mercedes-Benz C-osztály</strong> (C-Klasse, W206) a „kis S-osztály”: elegáns limuzin, prémium utastér, kategóriájában kiemelkedő kényelem és modern MBUX digitális kezelés. A bérelhető <strong>C 180</strong> takarékos mild-hybrid benzines. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a C-osztály bérlését?', html: 'Cégvezetőknek, üzletkötőknek és mindenkinek, aki reprezentatív, mégis gazdaságos prémium limuzint keres. A C 180 mild-hybrid motorja városban és autópályán is takarékos, a 9G-TRONIC váltó kifinomult.' },
      { h3: 'C-osztály vagy E-osztály?', html: 'A C-osztály kompaktabb és kedvezőbb havidíjú, az <a href="/berelheto-auto/mercedes-benz-e-osztaly-limuzin-berles">E-osztály limuzin</a> nagyobb, tágasabb hátsó üléssorral és még több kényelemmel.' },
    ],
    design: D('mercedes-benz-c-osztaly', 'Mercedes-Benz C-osztály', 'A „kis S-osztály”', 'Hosszú motorháztető, hátratolt utastér, rövid túlnyúlások és sportos arányok — a C-osztály az S-osztály dizájnnyelvét hozza a középkategóriába.', ['LED High Performance / DIGITAL LIGHT fényszórók (felszereltségtől függően)', 'Avantgarde vagy AMG Line külső', '17–19" könnyűfém keréktárcsák'], 'hátsó háromnegyedes nézet'),
    interior: I(null, 'Mercedes-Benz C-osztály', 'S-osztály-szerű utastér', 'A vezető felé fordított, 11,9"-os álló központi kijelző, a 12,3"-os digitális műszerfal, a turbinás szellőzők és a prémium anyagok a nagyobb Mercedesek hangulatát idézik.', [MBUX, 'Vezető felé döntött központi kijelző', 'Hangulatvilágítás, ülésfűtés (felszereltségtől függően)']),
    specs: {
      '180': { label: 'C 180', fuel: 'Benzin (mild-hybrid)', power: '170 LE (125 kW) + 23 LE EQ Boost', drive: 'Hátsókerék / 9G-TRONIC', rec: 'Takarékos prémium limuzin', note: 'négyhengeres benzines, 48 V mild-hybrid', img: P('mercedes-benz-c-osztaly', 'g1') },
    },
    gallery: G('mercedes-benz-c-osztaly', 'Mercedes-Benz C-osztály', [['g1', 'folyóparton'], ['g2', 'naplementében'], ['g3', 'oldalnézet'], ['g4', 'menet közben'], ['g5', 'városban'], ['g6', 'modern épület előtt'], ['g7', 'töltés közben']]),
    faqExtra: [],
  },

  // ---------------- GLE ----------------
  'Mercedes-Benz GLE': {
    mainImg: P('mercedes-benz-gle', 'main'), mainAlt: 'Mercedes-Benz GLE bérlés — nagy luxus SUV tartós bérletben',
    overviewH2: 'Mercedes-Benz GLE tartós bérlet — a nagy luxus SUV havidíjjal',
    guideIntro: 'A <strong>Mercedes-Benz GLE</strong> a márka nagy luxus SUV-ja: hathengeres motorok, <strong>4MATIC összkerékhajtás</strong>, kiemelkedő kényelem és hatalmas utastér, opcionálisan hét üléssel. <strong>Tartós bérletben</strong> a jelentős vételár és értékvesztés nem téged terhel — egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: '350 d, 450 d vagy 450?', html: 'A <strong>350 d</strong> hathengeres dízel a kiegyensúlyozott választás, a <strong>450 d</strong> 367 lóerővel és hatalmas nyomatékkal a legerősebb dízel, a <strong>450</strong> hathengeres benzines 381 LE-vel. Mindhárom 4MATIC, mild-hybrid (EQ Boost) és 9G-TRONIC váltós; vontatásra is kiválóak (akár 3,5 tonna).' },
      { h3: 'Kinek ajánljuk a GLE bérlését?', html: 'Cégvezetőknek, nagycsaládoknak és azoknak, akik sokat utaznak hosszú távon: a GLE csendes, kényelmes és erős, a csomagtér pedig 630 liter feletti.' },
    ],
    design: D('mercedes-benz-gle', 'Mercedes-Benz GLE', 'Tekintélyt parancsoló SUV', 'Széles hűtőrács, izmos kerékívek, MULTIBEAM LED fényszórók és a frissített modell új lámpagrafikája — a GLE nagy, mégis elegáns.', ['MULTIBEAM LED fényszórók', 'AMG Line külső (felszereltségtől függően)', '20–22" könnyűfém keréktárcsák'], 'hátsó háromnegyedes nézet'),
    interior: I('mercedes-benz-gle', 'Mercedes-Benz GLE', 'Luxus utastér, akár 7 üléssel', 'Két 12,3"-os kijelzőből álló szélesvásznú műszerfal, MBUX, prémium bőrülések és hatalmas hátsó lábtér; opcionálisan harmadik üléssor.', [MBUX, 'Szélesvásznú MBUX kijelzők', 'Burmester hangrendszer, négyzónás klíma (felszereltségtől függően)'], 'vezetőtér'),
    specs: {
      '350d 4MATIC': { label: '350 d 4MATIC', fuel: 'Dízel (6 henger, mild-hybrid)', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'Kiegyensúlyozott, vontatásra', note: 'hathengeres dízel', img: P('mercedes-benz-gle', 'g1') },
      '450d 4MATIC': { label: '450 d 4MATIC', fuel: 'Dízel (6 henger, mild-hybrid)', power: '367 LE (270 kW) + EQ Boost', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'A legerősebb dízel', note: 'hathengeres dízel, nagy nyomaték', img: P('mercedes-benz-gle', 'g4') },
      '450 4MATIC': { label: '450 4MATIC', fuel: 'Benzin (6 henger, mild-hybrid)', power: '381 LE (280 kW) + EQ Boost', drive: '4MATIC összkerék / 9G-TRONIC', rec: 'Sima járású benzines', note: 'hathengeres benzines', img: P('mercedes-benz-gle', 'g5') },
    },
    gallery: G('mercedes-benz-gle', 'Mercedes-Benz GLE', [['g1', 'modern épület előtt'], ['g2', 'hátulról'], ['g3', 'városban'], ['g4', 'stadion előtt'], ['g5', 'hegyi úton'], ['g6', 'országúton'], ['g7', 'stúdiófotó'], ['g8', 'hátsó ülések'], ['g9', 'fényszóró']]),
    faqExtra: [
      { q: 'Hét üléses a Mercedes GLE?', a: 'A GLE opcionálisan harmadik üléssorral is rendelhető; a bérelhető autó ülésszámát az ajánlatban jelezzük.' },
    ],
    schema: { drive: 'AWD' },
  },

  // ---------------- CLA ----------------
  'Mercedes-Benz CLA': {
    mainImg: P('mercedes-benz-cla', 'main'), mainAlt: 'Mercedes-Benz CLA bérlés — az új CLA tartós bérletben',
    body: 'Coupé',
    overviewH2: 'Mercedes-Benz CLA tartós bérlet — az új CLA hibrid havidíjjal',
    guideIntro: 'Az új, harmadik generációs <strong>Mercedes-Benz CLA</strong> a márka legmodernebb kompakt modellje: négyajtós coupé-forma, MB.OS operációs rendszer, óriási kijelzők és hatékony hibrid hajtás. A bérelhető <strong>CLA 200</strong> 48 voltos hibrid benzines, 8G-DCT duplakuplungos váltóval. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Mi újság az új CLA-ban?', html: 'Az új CLA teljesen új alapokra épült: új MB.OS szoftver, MBUX Superscreen (opcionális utas-kijelzővel), világító csillagokkal díszített hűtőrács és kiemelkedően jó aerodinamika. A hibrid változat alacsony sebességen tisztán elektromosan is tud haladni.' },
      { h3: 'Kinek ajánljuk a CLA bérlését?', html: 'Azoknak, akik stílusos, feltűnő, mégis gazdaságos prémium autót keresnek városra és autópályára egyaránt — fiatal vállalkozóknak, üzletkötőknek, második autónak.' },
    ],
    design: D('mercedes-benz-cla', 'Mercedes-Benz CLA', 'Négyajtós coupé, világító csillagokkal', 'Lapos, feszes karosszéria, keret nélküli ajtóablakok, világító csillagmintás hűtőrács és hátul csillag alakú lámpatestek — az új CLA a Mercedes új dizájnkorszakát nyitja.', ['Világító csillagos hűtőrács (felszereltségtől függően)', 'Csillag alakú hátsó lámpák', 'Keret nélküli ajtóablakok'], 'hátsó háromnegyedes nézet'),
    interior: I('mercedes-benz-cla', 'Mercedes-Benz CLA', 'MBUX Superscreen', 'Az egybefüggő üvegfelület alatti digitális műszerfal, a központi és opcionális utas-kijelző, az MB.OS mesterséges intelligenciával támogatott asszisztense és a panoráma üvegtető különleges hangulatot ad.', ['MBUX Superscreen (felszereltségtől függően)', 'MB.OS, MI-alapú virtuális asszisztens', 'Panoráma üvegtető (felszereltségtől függően)'], 'vezetőtér'),
    specs: {
      '200': { label: 'CLA 200', fuel: 'Benzin (48 V hibrid)', power: 'akár 193 LE rendszer', drive: 'Elsőkerék / 8G-DCT', rec: 'Stílusos és takarékos', note: '1,5 literes hibrid benzines', img: P('mercedes-benz-cla', 'g3') },
    },
    gallery: G('mercedes-benz-cla', 'Mercedes-Benz CLA', [['g1', 'kék színben, felülnézet'], ['g2', 'hátulról'], ['g3', 'piros színben, elölnézet'], ['g4', 'hegyi úton'], ['g5', 'kék színben, menet közben'], ['g6', 'csillag alakú hátsó lámpák'], ['g7', 'fehér színben'], ['g8', 'fekete színben']]),
    faqExtra: [],
  },

  // ---------------- E-Klasse Limousine ----------------
  'Mercedes-Benz E-Klasse Limousine': {
    mainImg: P('mercedes-benz-e-osztaly-limuzin', 'main'), mainAlt: 'Mercedes-Benz E-osztály limuzin bérlés — tartós bérletben',
    body: 'Limuzin',
    overviewH2: 'Mercedes-Benz E-osztály limuzin tartós bérlet — az üzleti limuzin etalonja',
    guideIntro: 'Az új <strong>Mercedes-Benz E-osztály</strong> (E-Klasse, W214) az üzleti limuzinok etalonja: kifinomult futómű, csendes utastér, MBUX Superscreen és kategóriájában kiemelkedő hátsó hely. Benzines <strong>E 200</strong> és dízel <strong>E 200 d</strong> is bérelhető. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szervizt, az adót és a gumikat mi intézzük.',
    guideBlocks: [
      { h3: 'E 200 vagy E 200 d?', html: 'Az <strong>E 200</strong> négyhengeres mild-hybrid benzines, csendes és kifinomult; az <strong>E 200 d</strong> dízel a sokat autózóknak takarékosabb, hosszú autópályás utakon ideális.' },
      { h3: 'Miért az E-osztály céges autónak?', html: 'Reprezentatív megjelenés, kiváló kényelem hosszú úton, nagy csomagtér (540 liter) és gazdag vezetéstámogató felszereltség — az E-osztály évtizedek óta a vezetői autók első választása.' },
    ],
    design: D('mercedes-benz-e-osztaly-limuzin', 'Mercedes-Benz E-osztály', 'Elegáns üzleti limuzin', 'Az új E-osztály fekete panelbe integrált hűtőrácsot, csillag-motívumú hátsó lámpákat és letisztult, elegáns oldalvonalat kapott.', ['DIGITAL LIGHT fényszórók (felszereltségtől függően)', 'Csillag-motívumú hátsó lámpák', '18–20" könnyűfém keréktárcsák'], 'limuzin stúdiófotó'),
    interior: I('mercedes-benz-e-osztaly-limuzin', 'Mercedes-Benz E-osztály', 'MBUX Superscreen és hangulatvilágítás', 'Az opcionális MBUX Superscreen (utas-kijelzővel), a műszerfalon végigfutó fénysáv, a kiváló ülések és a hangszigetelés az S-osztály közelébe emelik az E-osztály kényelmét.', ['MBUX Superscreen (felszereltségtől függően)', 'Aktív hangulatvilágítás', 'Burmester 4D hangrendszer (felszereltségtől függően)'], 'vezetőtér — MBUX Superscreen'),
    boot: '540 liter',
    specs: {
      '200': { label: 'E 200', fuel: 'Benzin (mild-hybrid)', power: '204 LE (150 kW) + EQ Boost', drive: 'Hátsókerék / 9G-TRONIC', rec: 'Kifinomult, csendes', note: 'négyhengeres benzines, mild-hybrid', img: P('mercedes-benz-e-osztaly-limuzin', 'g2') },
      '200d': { label: 'E 200 d', fuel: 'Dízel', drive: 'Hátsókerék / 9G-TRONIC', rec: 'Takarékos, hosszú utakra', note: 'takarékos négyhengeres dízel', img: P('mercedes-benz-e-osztaly-limuzin', 'g3') },
    },
    gallery: G('mercedes-benz-e-osztaly-limuzin', 'Mercedes-Benz E-osztály', [['g1', 'városi úton'], ['g2', 'hegyek között'], ['g3', 'hegyi úton'], ['g4', 'modern épület előtt'], ['g5', 'műszerfal'], ['g6', 'hangulatvilágítás'], ['g7', 'utas-kijelző']]),
    faqExtra: [
      { q: 'Mekkora az E-osztály limuzin csomagtartója?', a: 'Az E-osztály limuzin csomagtere 540 literes (plug-in hibrideknél kisebb).' },
    ],
  },

  // ---------------- GLA ----------------
  'Mercedes-Benz GLA': {
    mainImg: P('mercedes-benz-gla', 'main'), mainAlt: 'Mercedes-Benz GLA bérlés — kompakt prémium SUV tartós bérletben',
    overviewH2: 'Mercedes-Benz GLA tartós bérlet — kompakt prémium SUV havidíjjal',
    guideIntro: 'A <strong>Mercedes-Benz GLA</strong> a márka belépő SUV-ja: kompakt méretek, magas üléspozíció, prémium utastér és MBUX. Benzines <strong>GLA 200</strong> és plug-in hibrid <strong>GLA 250 e</strong> is bérelhető. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz, a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'GLA 200 vagy GLA 250 e?', html: 'A <strong>GLA 200</strong> mild-hybrid benzines, a vegyes használatra ideális. A <strong>GLA 250 e</strong> plug-in hibrid: ha otthon vagy a munkahelyen tölteni tudsz, a napi ingázás nagy része tisztán elektromosan megtehető.' },
      { h3: 'GLA vagy GLB?', html: 'A GLA kompaktabb, sportosabb; a <a href="/berelheto-auto/mercedes-benz-glb-berles">Mercedes-Benz GLB</a> szögletesebb, tágasabb, akár hét üléssel.' },
    ],
    design: D('mercedes-benz-gla', 'Mercedes-Benz GLA', 'Kompakt, sportos SUV', 'Rövid túlnyúlások, markáns kerékívek, LED fényszórók és az AMG Line sportos részletei — a GLA városi méretű, mégis magabiztos.', ['LED High Performance fényszórók', 'AMG Line vagy Progressive külső', '18–20" könnyűfém keréktárcsák'], 'hátsó háromnegyedes nézet'),
    interior: I('mercedes-benz-gla', 'Mercedes-Benz GLA', 'MBUX szélesvásznú kijelzők', 'Két 10,25"-os kijelzőből álló szélesvásznú műszerfal, turbinás szellőzők, érintőpaneles kormány és magas üléspozíció.', [MBUX, 'Szélesvásznú kijelzőegység', 'Hangulatvilágítás (felszereltségtől függően)'], 'műszerfal'),
    specs: {
      '200': { label: 'GLA 200', fuel: 'Benzin (mild-hybrid)', drive: 'Elsőkerék / 7G-DCT', rec: 'Vegyes használatra', note: 'mild-hybrid benzines', img: P('mercedes-benz-gla', 'g1') },
      '250e mit EQ Technologie': { label: 'GLA 250 e', fuel: 'Plug-in hibrid', drive: 'Elsőkerék / 8G-DCT', rec: 'Töltési lehetőséggel', note: 'plug-in hibrid, elektromos ingázás', img: P('mercedes-benz-gla', 'g4') },
    },
    gallery: G('mercedes-benz-gla', 'Mercedes-Benz GLA', [['g1', 'hegyi terepen'], ['g2', 'sziklák között'], ['g3', 'fehér színben'], ['g4', 'városban'], ['g5', 'szerpentinen'], ['g6', 'menet közben'], ['g7', 'hátulról, terepen'], ['g8', 'hegyi úton'], ['g9', 'hátsó ülések']]),
    faqExtra: [],
  },

  // ---------------- GLB ----------------
  'Mercedes-Benz GLB': {
    mainImg: P('mercedes-benz-glb', 'main'), mainAlt: 'Mercedes-Benz GLB bérlés — az új GLB tartós bérletben',
    overviewH2: 'Mercedes-Benz GLB tartós bérlet — családi SUV akár 7 üléssel',
    guideIntro: 'Az új <strong>Mercedes-Benz GLB</strong> a márka legpraktikusabb kompakt SUV-ja: szögletes, tágas karosszéria, akár hét ülés, nagy csomagtér és a legújabb MB.OS digitális rendszer. A bérelhető <strong>GLB 200 4MATIC</strong> hibrid benzines, összkerékhajtással. <strong>Tartós bérletben</strong> egyetlen havi díjat fizetsz — a szerviz, az adó és a gumik benne vannak.',
    guideBlocks: [
      { h3: 'Kinek ajánljuk a GLB bérlését?', html: 'Családoknak, akiknek egy kompakt méretű, mégis tágas prémium SUV kell — opcionálisan harmadik üléssorral. A 4MATIC összkerékhajtás télen és rossz utakon is biztonságos.' },
      { h3: 'GLB vagy GLA?', html: 'A GLB magasabb, szögletesebb és jóval tágasabb, a <a href="/berelheto-auto/mercedes-benz-gla-berles">GLA</a> kompaktabb, sportosabb.' },
    ],
    design: D('mercedes-benz-glb', 'Mercedes-Benz GLB', 'Szögletes, robusztus SUV', 'Az új GLB egyenes, szögletes formát, világító csillagos hűtőrácsot (felszereltségtől függően) és erőteljes kerékíveket kapott — kis G-osztály-hangulat kompakt méretben.', ['Világító hűtőrács (felszereltségtől függően)', 'Egyenes tetővonal, nagy üvegfelületek', 'Tetősínek, 18–20" keréktárcsák'], 'hátulról'),
    interior: I('mercedes-benz-glb', 'Mercedes-Benz GLB', 'MBUX Superscreen, panoráma tető', 'Az új GLB MB.OS rendszerrel, nagy kijelzőkkel, opcionális panoráma üvegtetővel és akár hét üléssel érkezik; a második üléssor csúsztatható.', ['MBUX Superscreen (felszereltségtől függően)', 'Opcionális 7 ülés', 'Panoráma üvegtető (felszereltségtől függően)'], 'műszerfal'),
    specs: {
      '200 4MATIC': { label: 'GLB 200 4MATIC', fuel: 'Benzin (48 V hibrid)', power: 'akár 193 LE rendszer', drive: '4MATIC összkerék / 8G-DCT', rec: 'Családi SUV, összkerékhajtás', note: 'hibrid benzines, 4MATIC', img: P('mercedes-benz-glb', 'g1') },
    },
    gallery: G('mercedes-benz-glb', 'Mercedes-Benz GLB', [['g1', 'terepen'], ['g2', 'pálmafák között'], ['g3', 'tengerparton'], ['g4', 'fekete színben'], ['g5', 'dombos terepen'], ['g6', 'hegyi úton'], ['g7', 'oldalnézet'], ['g8', 'esti fényben'], ['g9', 'éjszaka, tengerparton'], ['g10', 'panoráma üvegtető']]),
    faqExtra: [
      { q: 'Hét üléses a Mercedes GLB?', a: 'Az új GLB opcionálisan hétüléses kivitelben is készül; a bérelhető autó ülésszámát az ajánlatban jelezzük.' },
    ],
    schema: { drive: 'AWD' },
  },
};
