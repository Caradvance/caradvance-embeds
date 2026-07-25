// ── Eladom (consignment) page content ──────────────────────────────
// Hungarian is the complete baseline. To translate the page, add a block
// for another locale below (same shape) and it will be used automatically;
// anything missing falls back to Hungarian. This is also the natural place
// to feed content from your Google Sheet later.

import type { Locale } from '../i18n/utils';

export interface EladomContent {
  stats: { num: string; unit: string; label: string }[];
  platformsLabel: string;
  charity: {
    eyebrow: string; title: string; intro: string;
    bigNum: string; bigUnit: string; bigLabel: string;
    cardTitle: string; cardText: string; cardCta: string;
    orgs: { tag: string; color: string; icon: string; logo: string; name: string; text: string; url: string; photo?: string }[];
    supports: string; orgLink: string; note: string; learnMore: string;
  };
  why: {
    eyebrow: string; title: string; intro: string;
    features: { icon: string; title: string; text: string }[];
  };
  photo: {
    eyebrow: string; title: string; intro: string;
    checks: { title: string; text: string }[];
    cta: string; videoTag: string; videoTitle: string; videoBy: string;
  };
  videos: {
    eyebrow: string; title: string; intro: string;
    items: { badge: string; caption: string }[];
    followIg: string; followTt: string;
  };
  gallery: { eyebrow: string; title: string; intro: string; items: string[] };
  compare: {
    eyebrow: string; title: string; intro: string;
    colAlone: string; colUs: string;
    rows: { aspect: string; alone: string; us: string }[];
  };
  steps: {
    eyebrow: string; title: string; intro: string;
    items: { title: string; text: string; highlight?: boolean }[];
  };
  closing: { title: string; text: string; cta: string };
  seo: { eyebrow: string; title: string; paras: string[] };
  faq: { eyebrow: string; title: string; intro: string; items: { q: string; a: string }[] };
}

const BASE = 'https://caradvance.hu';

const hu: EladomContent = {
  stats: [
    { num: '23', unit: ' év', label: 'Tapasztalat — a Caradvance GmbH 2003 óta' },
    { num: '2', unit: ' piactér', label: 'Használtautó.hu + mobile.de egyszerre' },
    { num: '4', unit: ' csatorna', label: 'A közösségi médiában is hirdetjük az autódat' },
    { num: '30', unit: '%', label: 'Jutalék jótékony célra' },
  ],
  platformsLabel: 'Hirdetési platformjaink',
  charity: {
    eyebrow: 'Egy jó ügyért',
    title: 'Az autód eladása másnak is segít',
    intro: 'Nálunk az eladás nem csak rólad szól. A jutalékunk egy jelentős részét magyar jótékony szervezeteknek ajánljuk fel — így minden értékesített autó mögött ott egy jó ügy is.',
    bigNum: '30', bigUnit: '%', bigLabel: 'Jutalék jótékony célra',
    cardTitle: 'Minden sikeres eladásból visszaadunk a közösségnek',
    cardText: 'Amikor ránk bízod az autód eladását, a jutalékunk egy meghatározott része egy magyar jótékony szervezethez kerül. A bemutatóvideóban azt is megmutatjuk, melyik ügyet támogatja épp a Te autód — átláthatóan, valódi hatással.',
    cardCta: 'Átlátható felajánlás minden eladás után',
    orgs: [
      { tag: 'Gyerekek & családok', color: 'linear-gradient(160deg,#2f6b4f,#1d4a37)', logo: `${BASE}/sos-gyermekfalvak-magyarorszag.webp`, icon: 'house', name: 'SOS Gyermekfalu Magyarország', text: 'Otthont, biztonságot és szerető családi környezetet ad olyan gyerekeknek, akik nem nevelkedhetnek a saját családjukban.', url: 'https://www.sos.hu', photo: 'https://images.unsplash.com/photo-1756982477606-f943be86ca36?auto=format&fit=crop&w=900&q=72' },
      { tag: 'Élelmiszer & rászorulók', color: 'linear-gradient(160deg,#d08a2c,#a5641a)', logo: `${BASE}/magyar-elelmiszerbank-egyesulet.webp`, icon: 'food', name: 'Magyar Élelmiszerbank Egyesület', text: 'Megmenti a még jó minőségű, feleslegessé vált élelmiszert, és eljuttatja a nélkülöző családokhoz országszerte.', url: 'https://www.elelmiszerbank.hu', photo: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=900&q=72' },
      { tag: 'Beteg gyerekek', color: 'linear-gradient(160deg,#2f5aa8,#1e3c72)', logo: `${BASE}/bator-tabor.webp`, icon: 'tent', name: 'Bátor Tábor Alapítvány', text: 'Ingyenes, élményterápiás táborokkal ad gondtalan napokat és erőt súlyos betegséggel küzdő gyerekeknek és családjaiknak.', url: 'https://www.batortabor.hu', photo: 'https://images.unsplash.com/photo-1638202951770-2240942c7d1c?auto=format&fit=crop&w=900&q=72' },
      { tag: 'Humanitárius', color: 'linear-gradient(160deg,#9c2b2b,#6f1d1d)', logo: `${BASE}/magyar-maltai-szeretetszolgalat.webp`, icon: 'cross', name: 'Magyar Máltai Szeretetszolgálat', text: 'Az ország egyik legnagyobb segélyszervezete: hajléktalan- és családsegítés, katasztrófahelyzeti támogatás.', url: 'https://www.maltai.hu', photo: 'https://images.unsplash.com/photo-1710092784814-4a6f158913b8?auto=format&fit=crop&w=900&q=72' },
      { tag: 'Állatvédelem', color: 'linear-gradient(160deg,#7a5a34,#4f3a20)', logo: `${BASE}/rex-kutyaotthon-alapitvany.webp`, icon: 'paw', name: 'Rex Kutyaotthon Alapítvány', text: 'Bajba jutott, kóbor és bántalmazott kutyák menedéke — ellátás, gyógyítás és új, szerető gazdik keresése.', url: 'https://www.rexalapitvany.hu', photo: 'https://images.unsplash.com/photo-1711376582747-22cd0839ffad?auto=format&fit=crop&w=900&q=72' },
      { tag: 'Gyermekgyógyászat', color: 'linear-gradient(160deg,#c24d6e,#8a2f49)', logo: `${BASE}/heim-pal-orszagos-gyermekgyogyaszati-intezet.webp`, icon: 'plus', name: 'Heim Pál Gyermekgyógyászati Intézet', text: 'Az ország vezető gyermekkórháza — a támogatás modernebb eszközöket és jobb gyógyulási esélyt jelent.', url: 'https://heimpalkorhaz.hu', photo: 'https://images.unsplash.com/photo-1708687045030-26702e62fc65?auto=format&fit=crop&w=900&q=72' },
      { tag: 'Jogvédelem', color: 'linear-gradient(160deg,#4b5563,#2c333d)', logo: `${BASE}/patent-egyesulet.webp`, icon: 'shield', name: 'PATENT Egyesület', text: 'Jogi és lelki segítséget nyújt bántalmazást átélt nőknek és gyerekeknek — a biztonságos újrakezdésért.', url: 'https://patent.org.hu', photo: 'https://images.unsplash.com/photo-1774042756537-bdff310d3ef4?auto=format&fit=crop&w=900&q=72' },
    ],
    supports: 'Az eladásod ezt támogatja',
    orgLink: 'A szervezetről',
    learnMore: 'Tudj meg többet a jótékonyságunkról',
    note: 'A felajánlás mértéke és a támogatott szervezetek a program aktuális feltételei szerint alakulnak; a feltüntetett szervezetek a program kedvezményezettjeit jelzik. A pontos részleteket és a támogatás összegét minden eladásnál egyedileg, átláthatóan rögzítjük.',
  },
  why: {
    eyebrow: 'Miért velünk add el?',
    title: 'Több érdeklődő, jobb ár, kevesebb fejfájás',
    intro: 'Egyedül eladni egy autót időigényes és tele van buktatóval. Mi a profi tartalomtól a teljes ügyintézésig mindent leveszünk a válladról — és közben jót is teszünk.',
    features: [
      { icon: 'video', title: 'Profi fotó és videó', text: 'Mozgóképes bemutatóvideó és igényes fotók minden autóról — pont az a minőség, ami eladja az autót.' },
      { icon: 'reach', title: 'Nagyobb elérés', text: 'A Használtautó.hu-n és saját csatornáinkon hirdetünk, így sokszorosát éred el az egyedi hirdetéseknek.' },
      { icon: 'price', title: 'Reális, jó ár', text: 'Friss piaci adatok alapján árazunk, és helyetted tárgyalunk — gyorsabb eladás, kevesebb alkudozás.' },
      { icon: 'doc', title: 'Teljes ügyintézés', text: 'Adásvételi szerződés, átírás, papírmunka — mindent átvállalunk, neked csak az autót kell átadnod.' },
      { icon: 'shield', title: 'Biztonságos folyamat', text: 'Ellenőrzött érdeklődők és biztonságos fizetés — nincs ismeretlen vevő a kapuban, nincs készpénzkockázat.' },
      { icon: 'heart', title: 'Egy jó ügyért', text: 'A jutalékunk egy jelentős részét magyar jótékony szervezeteknek ajánljuk fel — az eladásoddal te is segítesz.' },
    ],
  },
  photo: {
    eyebrow: 'Profi fotó és videó',
    title: 'Az autód a legjobb formáját mutatja',
    intro: 'Vadnai Zsombor profi fotókat és mozgóképes bemutatóvideót készít minden autóról — pont azt a minőséget, ami megállítja a görgetést és eladja az autót. A videóban azt is megmutatjuk, melyik jótékony szervezetet támogatja az eladás.',
    checks: [
      { title: 'Mozgóképes bemutatóvideó', text: 'Az autó kívül-belül, minden fontos részlettel — nem csak állóképek.' },
      { title: 'Igényes fotók', text: 'Jó fény, tiszta háttér, eladható kompozíció — a komoly vevők ezt keresik.' },
      { title: 'A jó ügy is látszik', text: 'A videóban bemutatjuk, melyik magyar szervezetet támogatja az eladásod.' },
    ],
    cta: 'Készítsünk videót az autódról',
    videoTag: 'Jótékony eladás',
    videoTitle: 'Bemutatóvideó',
    videoBy: 'Készíti: Vadnai Zsombor',
  },
  videos: {
    eyebrow: 'Videóink',
    title: 'Nézd meg a videóinkat Instagramon és TikTokon',
    intro: 'Profi bemutatóvideók az eladó autókról — és minden videóban megmutatjuk, melyik jótékony szervezetet támogatja az adott eladás.',
    items: [
      { badge: '📷', caption: 'BMW X5 M Sport — bemutató' },
      { badge: '🎵', caption: 'MINI JCW — 60 másodperc' },
      { badge: '📷', caption: 'Így készül a profi fotó' },
      { badge: '🎵', caption: 'Eladás egy jó ügyért' },
    ],
    followIg: 'Kövess minket Instagramon',
    followTt: 'Kövess minket TikTokon',
  },
  gallery: {
    eyebrow: 'Ilyen tartalmat készítünk',
    title: 'Néhány a profi fotóinkból',
    intro: 'Ízelítő abból a minőségből, amivel az autódat is bemutatjuk — ezek a komoly vevőket vonzzák be.',
    items: ['Volkswagen ID.3', 'BMW 3 Series Touring', 'BMW X5 M Sport', 'BMW X2 M Sport', 'Volkswagen Arteon', 'Volkswagen Arteon R-Line', 'MINI John Cooper Works', '+ a Te autód'],
  },
  compare: {
    eyebrow: 'Egyedül vagy velünk?',
    title: 'Miért ne add el egyedül?',
    intro: 'Egyedül hirdetni időigényes és kockázatos. Így néz ki a kettő egymás mellett — az első fotótól a kifizetésig.',
    colAlone: 'Ha egyedül adod el',
    colUs: 'A Caradvance-szel',
    rows: [
      { aspect: 'Fotó és videó', alone: 'Telefonos képek, gyenge fény, üres háttér', us: 'Profi fotó és mozgóképes videó minden autóról' },
      { aspect: 'Hirdetés elérése', alone: 'Egy-két oldal, kevés komoly érdeklődő', us: 'Használtautó.hu és saját csatornáink — sokszoros elérés' },
      { aspect: 'Árazás', alone: 'Találgatás, könnyű alulárazni vagy beragadni', us: 'Friss piaci adatok alapján reális, eladható ár' },
      { aspect: 'Érdeklődők kezelése', alone: 'Időrabló hívások, lemondott időpontok', us: 'Mi szűrjük és kezeljük az érdeklődőket helyetted' },
      { aspect: 'Alkudozás', alone: 'Egyedül, nyomás alatt, sokszor lejjebb adod', us: 'Helyetted tárgyalunk, a legjobb árért' },
      { aspect: 'Adásvétel és papírmunka', alone: 'Szerződés, átírás, adatlap — mind a Te dolgod', us: 'A teljes papírmunkát és ügyintézést átvállaljuk' },
      { aspect: 'Biztonság', alone: 'Ismeretlen vevők, készpénz, csaláskockázat', us: 'Ellenőrzött, biztonságos folyamat elejétől a végéig' },
      { aspect: 'Egy jó ügy', alone: 'Az eladásból csak Te jársz jól', us: 'A jutalékunk egy részét magyar jótékony szervezeteknek adjuk' },
      { aspect: 'Időráfordítás', alone: 'Hetekig tartó hirdetés és egyeztetés', us: 'Te csak átadod az autót — a többit mi intézzük' },
    ],
  },
  steps: {
    eyebrow: 'Hogyan működik?',
    title: 'Hét lépés az eladásig',
    intro: 'Jelezd, hogy eladnád az autód, és onnantól mi intézünk mindent — a fotózástól a kifizetésig és a felajánlásig.',
    items: [
      { title: 'Felmérés és árazás', text: 'Felmérjük az autód állapotát, és friss piaci adatok alapján reális, eladható árat határozunk meg — nincs alul- vagy túlárazás.' },
      { title: 'Profi fotó és videó', text: 'Vadnai Zsombor profi fotókat és mozgóképes bemutatóvideót készít az autóról, amin azt is megmutatjuk, melyik jótékony szervezetet támogatja az eladás.' },
      { title: 'Hirdetés és marketing', text: 'Az autót a Használtautó.hu-n és saját csatornáinkon is meghirdetjük — így sokkal több komoly érdeklődőt érünk el, mint egyedül.' },
      { title: 'Érdeklődők kezelése', text: 'Mi vesszük fel a telefont, szűrjük a megkereséseket és egyeztetjük az időpontokat — neked nem kell a hívásokkal bajlódnod.' },
      { title: 'Tárgyalás és értékesítés', text: 'Helyetted alkudunk és kötjük meg az adásvételt, a teljes papírmunkával és átírással együtt — biztonságosan.' },
      { title: 'Kifizetés Neked', text: 'Megkapod az autód vételárát — biztonságosan, átlátható elszámolással. Neked ennyi volt a dolgod: átadtad az autót, a többit elintéztük.' },
      { title: 'Felajánlás a jó ügynek ♥', text: 'A jutalékunk egy meghatározott részét továbbadjuk a Te eladásod által támogatott magyar jótékony szervezetnek — a bemutatóvideóban meg is mutatjuk, melyiknek.', highlight: true },
    ],
  },
  closing: {
    title: 'Add el az autód — tegyünk jót együtt',
    text: 'Küldd el pár adatát, és jelentkezünk egy reális árajánlattal. A többit mi intézzük — profin, gyorsan, egy jó ügyért.',
    cta: 'Eladnám az autóm',
  },
  seo: {
    eyebrow: 'Jó tudni',
    title: 'Autó eladása egyszerűen — bizományos értékesítéssel, országosan',
    paras: [
      'Ha az autód eladása a cél, a Caradvance bizományos autóértékesítése a legkényelmesebb út: profi fotó és videó, hirdetés a Használtautó.hu-n és a mobile.de-n, az érdeklődőkkel pedig mi tárgyalunk helyetted — te csak átveszed a vételárat. A használt autó eladása így gyors, biztonságos és átlátható, Budapesten, Solymáron és országos kiszolgálással.',
      'Sokakat foglalkoztat az autó eladás menete és a papírmunka. Nálunk a teljes ügyintézést átvállaljuk: adásvételi szerződés, az autó eladásának bejelentése (akár online, a kormányablaknál vagy ügyfélkapun keresztül), valamint az autó eladás utáni teendők — például a kötelező biztosítás felmondása és az autó átírása a vevő nevére — mind a mi dolgunk.',
      'Az autó eladása utáni adózásban is segítünk eligazodni: magánszemélyként, nem üzletszerű eladás esetén jellemzően nem keletkezik adófizetési kötelezettség, de a saját helyzetedről érdemes könyvelővel vagy a NAV tájékoztatójából megbizonyosodni. Akár magánszemélyként, akár céges autót adnál el, végigkísérünk a teljes folyamaton.',
      'A bizományos értékesítés mellett a gyors autófelvásárlás is szóba jöhet, ha azonnal pénzre van szükséged — tapasztalatunk szerint azonban a bizományos eladással érhető el a legjobb ár. Több mint 5000 eladott autó és 5,0-s Google-értékelés áll mögöttünk, és minden eladás jutalékának egy jelentős részét magyar jótékonysági szervezeteknek ajánljuk fel.',
    ],
  },
  faq: {
    eyebrow: 'GY.I.K.',
    title: 'Gyakori kérdések az autó eladásáról',
    intro: 'A leggyakoribb kérdések a használt autó eladásáról, a folyamatról, a bejelentésről és az ügyintézésről.',
    items: [
      { q: 'Hogyan zajlik az autó eladása bizományban?', a: 'Felmérjük és reális piaci áron beárazzuk az autót, profi fotót és mozgóképes videót készítünk, meghirdetjük a Használtautó.hu-n és a mobile.de-n, kezeljük az érdeklődőket és helyetted tárgyalunk. A sikeres eladás után átveszed a vételárat — a teljes papírmunkát, az adásvételi szerződést és az átírást mi intézzük.' },
      { q: 'Hogyan kell bejelenteni az autó eladását?', a: 'Az adásvételt a szerződés megkötésétől számított 15 napon belül be kell jelenteni. Ez megtehető személyesen a kormányablaknál, vagy online, ügyfélkapun keresztül. Bizományos értékesítés esetén az autó eladásának bejelentését is intézzük helyetted, így neked nem kell a hivatallal foglalkoznod.' },
      { q: 'Mik a teendők az autó eladása után?', a: 'Eladás után érdemes felmondani a kötelező biztosítást (és a casco-t), gondoskodni az autó átírásáról a vevő nevére, valamint leadni a forgalmi engedélyt és a törzskönyvet a vevőnek. A biztosítás felmondását az adásvételi szerződés igazolja. Nálunk ezeket az autó eladás utáni teendőket is átvállaljuk.' },
      { q: 'Kell adót fizetni az autó eladása után?', a: 'A személygépkocsi magánszemélyként, nem üzletszerű módon történő eladása a legtöbb esetben nem jár adófizetési kötelezettséggel — különösen, ha nem nyereséggel értékesíted. Az adózás a konkrét helyzettől függ, ezért a saját esetedről érdemes könyvelővel vagy a NAV tájékoztatójából tájékozódni. Minden összeget átláthatóan rögzítünk.' },
      { q: 'El lehet adni az autót törzskönyv nélkül?', a: 'Törzskönyv nélkül is eladható az autó, de a törzskönyv pótlását érdemes még az eladás előtt elintézni, mert a vevő és az átírás szempontjából fontos okmány. Ha hiányzik valamelyik dokumentum, segítünk a pótlásában is.' },
      { q: 'Mi a különbség a bizományos értékesítés és az autófelvásárlás között?', a: 'Az autófelvásárlásnál azonnal, de jellemzően alacsonyabb áron veszik meg az autót. A bizományos értékesítésnél mi adjuk el helyetted, valós piaci áron — ez néhány héttel több időt vehet igénybe, cserébe általában jóval magasabb végösszeget hoz. Mi a bizományos eladásra fókuszálunk, mert így jársz a legjobban.' },
      { q: 'Mennyi a jutalék, és mennyi idő alatt adjátok el az autót?', a: 'A jutalék az autó értékétől függ (a részletes sávokat feljebb, a díjtáblázatban találod), és tartalmazza a teljes szolgáltatást a fotózástól a hirdetésen át a teljes ügyintézésig. Az eladás átlagosan néhány hét, a kereslettől és az ártól függően. A jutalék egy jelentős részét magyar jótékony szervezeteknek ajánljuk fel.' },
      { q: 'Magánszemélyként és céges autót is el tudok adni nálatok?', a: 'Igen. Magánszemélyként és cégként is ránk bízhatod az autó eladását. A céges autó eladásának bejelentését, az áfás számlázást és a kapcsolódó ügyintézést is kezeljük — mindezt átláthatóan, szabályos szerződéssel.' },
    ],
  },
};

// Per-locale overrides go here (e.g. en: {...}). Missing locales use hu.
const byLocale: Partial<Record<Locale, EladomContent>> = { hu };

export function eladomContent(lang: Locale): EladomContent {
  return byLocale[lang] ?? hu;
}
