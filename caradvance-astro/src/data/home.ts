// ── Home (landing) page content ──────────────────────────────────
// Hungarian baseline. Add per-locale overrides in byLocale, or wire to the Sheet.
import type { Locale } from '../i18n/utils';

const BASE = 'https://caradvance.hu';

export interface HomeContent {
  stats: { num: string; unit: string; label: string }[];
  services: {
    eyebrow: string; title: string;
    items: { img: string; kicker: string; title: string; lead: string; points: string[] }[];
  };
  charity: { eyebrow: string; title: string; text: string; cta: string; logos: string[] };
  process: { eyebrow: string; title: string; steps: { title: string; text: string }[] };
  about: { eyebrow: string; title: string; paras: string[] };
  values: { eyebrow: string; title: string; items: { title: string; text: string }[] };
  reviews: { eyebrow: string; title: string; rating: string; items: { name: string; when: string; text: string }[] };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  closing: { title: string; text: string; cta: string };
}

const hu: HomeContent = {
  stats: [
    { num: '5000', unit: '+', label: 'eladott prémium autó' },
    { num: '23', unit: 'év', label: 'tapasztalat — a Caradvance GmbH 2003 óta' },
    { num: '5,0', unit: '★', label: 'Google-értékelés' },
    { num: '1', unit: 'év', label: 'szavatosság minden importált autóra' },
  ],
  services: {
    eyebrow: 'Szolgáltatásaink',
    title: 'Amivel foglalkozunk',
    items: [
      { img: `${BASE}/piros-bmw-x6-m-premium-autoberles.webp`, kicker: 'Prémium autóbérlés', title: 'Prémium autóbérlés',
        lead: 'Miért vásárolnál, ha bérelhetsz? Élvezd a prémium autózás minden előnyét vásárlás nélkül — rugalmas, hosszú távú bérléssel, már fél évtől.',
        points: ['Válogatott prémium modellek', 'Rugalmas futamidő — minimum 6 hónaptól', 'Átadás-átvétel egyeztetett helyszínen'] },
      { img: `${BASE}/bmw-m3-touring-premium-auto-eladas.webp`, kicker: 'Prémium autó eladás', title: 'Prémium autó eladás',
        lead: 'Miért kockáztatnál, ha biztosra is mehetsz? Kínálatunkban gondosan válogatott, bevizsgált prémium autók — egyenesen Németországból.',
        points: ['Leinformált, bevizsgált prémium modellek', 'Autóink többsége érvényes gyári garanciával', 'Finanszírozási lehetőség igény szerint'] },
      { img: `${BASE}/autoszallitas-autoimport-nemetorszagbol.webp`, kicker: 'Autóimport', title: 'Autóimport Németországból',
        lead: 'Miért érnéd be a hazai kínálattal? A teljes német piac kínálata — pontosan a Te igényeid szerint, kulcsrakészen.',
        points: ['Leinformálás és helyszíni bevizsgálás', 'Szállítás és teljes körű honosítás', '1 év szavatosság minden autóra'] },
      { img: `${BASE}/toyota-rav4-hybrid-hasznaltauto-eladas.webp`, kicker: 'Használtautó-eladás', title: 'Eladjuk az autódat',
        lead: 'Miért vesződnél az eladással? Teljes körűen kezeljük helyetted — Te csak átveszed a vételárat, mi pedig még jót is teszünk közben.',
        points: ['Profi fotók és videók minden autóhoz', 'Hirdetés a legnagyobb platformokon', 'A jutalék egy része jótékony célra megy'] },
    ],
  },
  charity: {
    eyebrow: 'Jótékonyság',
    title: 'Minden eladott autóval jót teszünk',
    text: 'Hisszük, hogy a sikernek akkor van igazi értéke, ha másokkal is megosztjuk. Ezért a használtautó-eladások jutalékának jelentős részét magyar nonprofit szervezeteknek ajánljuk fel — és minden autó videójában megmutatjuk, hova kerül a támogatás.',
    cta: 'Add el az autód — tegyünk jót együtt',
    logos: [
      `${BASE}/sos-gyermekfalvak-magyarorszag.webp`, `${BASE}/magyar-elelmiszerbank-egyesulet.webp`,
      `${BASE}/bator-tabor.webp`, `${BASE}/magyar-maltai-szeretetszolgalat.webp`,
      `${BASE}/rex-kutyaotthon-alapitvany.webp`, `${BASE}/heim-pal-orszagos-gyermekgyogyaszati-intezet.webp`,
      `${BASE}/patent-egyesulet.webp`,
    ],
  },
  process: {
    eyebrow: 'Miért a Caradvance?',
    title: 'Így dolgozunk',
    steps: [
      { title: 'Meghallgatunk', text: 'Először megértjük, mire van szükséged — csak utána javaslunk autót vagy megoldást.' },
      { title: 'Ellenőrzünk', text: 'A kinézett autót leinformáljuk, és a helyszínen alaposan megnézzük, hogy minden rendben van-e vele, mielőtt véglegesítenéd a vásárlást.' },
      { title: 'Kulcsrakészen intézzük', text: 'Szállítás, honosítás, papírmunka — mindent mi kezelünk, Neked csak át kell venned.' },
      { title: 'Kiállunk érte', text: 'Legyen szó importált vagy hazai használt autóról, minden esetben 1 év szavatosságot vállalunk — mert biztosak vagyunk a munkánkban.' },
      { title: 'Melletted maradunk', text: 'Az átadás után sem szakad meg a kapcsolatunk — kérdéseiddel és garanciális ügyeiddel is bizalommal fordulhatsz hozzánk.' },
      { title: 'Visszaadunk', text: 'A használtautó-eladások jutalékának egy részével magyar jótékonysági szervezeteket támogatunk.' },
    ],
  },
  about: {
    eyebrow: 'Történetünk',
    title: 'Kik vagyunk?',
    paras: [
      'A Caradvance a müncheni Caradvance GmbH márkája — Magyarországon a BH Group Zrt. képviseli, Caradvance Hungary néven.',
      'A Caradvance GmbH 2003 óta a német autópiac megbízható szereplője: Sauerlachban, München mellett működő kereskedésük több mint két évtizede foglalkozik prémium használt autókkal — a mobile.de-n 5 csillagos értékeléssel.',
      'A BH Group Zrt. kizárólag a Caradvance GmbH hivatalos magyarországi képviselete. Te egy több mint két évtizedes múltú német kereskedéssel szerződsz, mi pedig végigkísérünk itthonról: leinformált, bevizsgált autók, kulcsrakész átadás, 1 év szavatossággal.',
    ],
  },
  values: {
    eyebrow: 'Értékeink',
    title: 'Amiben hiszünk',
    items: [
      { title: 'Átláthatóság', text: 'Minden autót leinformálunk és bevizsgálunk. Nincs apró betű, nincs rejtett költség — azt kapod, amit ígérünk.' },
      { title: 'Biztonság', text: 'Importált autóinkra 1 év szavatosságot vállalunk, mert kiállunk azért, amit átadunk.' },
      { title: 'Személyes figyelem', text: 'Nem eladunk, hanem segítünk. Végigkísérünk a teljes folyamaton — az első kérdéstől az átadásig.' },
      { title: 'Társadalmi felelősség', text: 'A használtautó-eladások jutalékának jelentős részét magyar jótékonysági szervezeteknek ajánljuk fel.' },
    ],
  },
  reviews: {
    eyebrow: 'Vélemények',
    title: 'Amit ügyfeleink mondanak rólunk',
    rating: '5,0 a Google-n',
    items: [
      { name: 'Alexandru Ion', when: '2 éve', text: 'Kiváló munka. Délelőtt 11-re érkeztem, és 14 órára, a fizetés után már vittem is az autót. Az ár stimmelt, az autó minden adata pontos volt. Köszönöm!' },
      { name: 'Bad Martin', when: '2 éve', text: 'Nagyon kedves és hozzáértő munkatársak. Itt fel is veszik a telefont — és pontosan azt kapod, amit ígérnek.' },
      { name: 'Dennis', when: '3 éve', text: 'Szuper kedves személyzet, korrekt, gördülékeny ügyintézés — összességében nagyon elégedett vagyok.' },
    ],
  },
  faq: {
    eyebrow: 'Jó tudni',
    title: 'Gyakori kérdések',
    items: [
      { q: 'Mennyibe kerül a prémium autóbérlés a Caradvance-nál?', a: 'A legkedvezőbb havidíj 912 €/hó nettó-tól indul (Mini Cooper), prémium BMW-ink 937 €/hó nettó-tól érhetők el; a konkrét ár a modelltől, a bérlés időtartamától és a havi km-kerettől függ.' },
      { q: 'Hogyan működik az autóimport Németországból?', a: 'Elmondod, milyen autót keresel, mi pedig a teljes német piacról ajánlunk: az autót leinformáljuk, a helyszínen bevizsgáljuk, majd intézzük a szállítást, a honosítást és a teljes papírmunkát. Az importált autókra 1 év szavatosságot vállalunk.' },
      { q: 'Milyen garanciát kapok a megvásárolt autóra?', a: 'Minden importált és eladó autónkra 1 év szavatosságot vállalunk. Minden jármű előélete ismert és dokumentált, az átadás előtt helyszíni bevizsgáláson esik át.' },
      { q: 'Hogyan tudom eladni az autómat a Caradvance-szal?', a: 'Bizományos értékesítésben teljes körűen kezeljük az eladást: profi fotókat és videót készítünk, a legnagyobb platformokon hirdetünk, és mi tárgyalunk a vevőkkel — te csak átveszed a vételárat. A jutalék egy részét magyar jótékonysági szervezeteknek ajánljuk fel.' },
      { q: 'Hol találom a Caradvance irodáját és mikor vagytok elérhetők?', a: 'Irodánk címe: 2083 Solymár, Ibolya utca 12. — Budapesttől 15 percre. Munkaidő: hétfőtől péntekig 9:00–17:00. Telefon: +36 30 233 6060, e-mail: info@caradvance.hu.' },
    ],
  },
  closing: {
    title: 'Beszéljünk az autódról',
    text: 'Akár bérelnél, vásárolnál, importálnál, vagy eladnád a jelenlegi autód — írj nekünk, és személyre szabott ajánlattal jelentkezünk.',
    cta: 'Kapcsolat',
  },
};

const byLocale: Partial<Record<Locale, HomeContent>> = { hu };
export function homeContent(lang: Locale): HomeContent {
  return byLocale[lang] ?? hu;
}
