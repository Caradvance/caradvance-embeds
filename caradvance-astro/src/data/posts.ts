// ─────────────────────────────────────────────────────────────
//  CarAdvance blog — központi cikk- és kategórianyilvántartás
//  Új cikk hozzáadása: (1) írd meg a src/pages/blog/<slug>.astro oldalt,
//  (2) vedd fel ide a POSTS tömbbe ugyanazzal a slug-gal. A blog főoldal
//  és a kapcsolódó cikkek innen épülnek fel automatikusan.
// ─────────────────────────────────────────────────────────────
export const SITE = 'https://www.caradvance.hu';

export type CatKey = 'berles' | 'import' | 'finanszirozas' | 'bizomanyos' | 'markak' | 'hirek';

export type Category = {
  key: CatKey;
  label: string;
  blurb: string;
  service: string;   // a kapcsolódó szolgáltatás oldala
};

export const CATEGORIES: Category[] = [
  { key: 'berles',        label: 'Autóbérlés',                blurb: 'Prémium bérlés, hosszú távú és céges konstrukciók, tippek és útmutatók.',            service: '/berelheto' },
  { key: 'import',        label: 'Import & vásárlás',         blurb: 'Autóbehozatal Németországból, költségek, adók, és a biztonságos vásárlás menete.',   service: '/auto-rendeles' },
  { key: 'finanszirozas', label: 'Finanszírozás & lízing',    blurb: 'Autó lízing magánszemélynek és cégnek, kalkulátor, THM és feltételek egyszerűen.',    service: '/finanszirozas-lizing' },
  { key: 'bizomanyos',    label: 'Bizományos értékesítés',    blurb: 'Hogyan add el az autódat gyorsan, jó áron, kockázat nélkül — bizományban.',           service: '/bizomanyos' },
  { key: 'markak',        label: 'Márkák',                    blurb: 'BMW, Mercedes, MINI, Porsche és Audi — modellek, összehasonlítások, vásárlói guide-ok.', service: '/egyedi-auto-rendeles' },
  { key: 'hirek',         label: 'Hírek & referenciák',       blurb: 'Vásárlói történetek, friss beszerzések és a CarAdvance mögötti kulisszatitkok.',      service: '/media' },
];

export type Post = {
  slug: string;          // /blog/<slug>
  cat: CatKey;
  title: string;         // kártya- és listacím
  excerpt: string;       // rövid összefoglaló a kártyán
  dateISO: string;       // YYYY-MM-DD
  readingMin: number;    // olvasási idő (perc)
  image: string;         // borítókép URL
  keywords: string;      // fő kulcsszavak (SEO)
};

export const POSTS: Post[] = [
  {
    slug: 'mercedes-behozatal-nemetorszagbol',
    cat: 'markak',
    title: 'Mercedes behozatal Németországból — E-osztály, Vito, Sprinter vásárlás',
    excerpt: 'A Mercedes a német piac egyik legjobban dokumentált márkája. Megnézzük, melyik modell kinek való, és hogyan hozz be biztonságosan E-osztályt, Vitót vagy Sprintert.',
    dateISO: '2026-08-23',
    readingMin: 7,
    image: '/caradvance-hero-beszerzesi-poster.jpg',
    keywords: 'eladó mercedes, mercedes vito eladó, mercedes sprinter eladó, mercedes e 220 cdi, mercedes behozatal',
  },
  {
    slug: 'bmw-x5-vasarlas-behozatal',
    cat: 'markak',
    title: 'BMW X5 vásárlás és behozatal Németországból — árak, felszereltség, folyamat',
    excerpt: 'Mennyibe kerül egy BMW X5 Németországból behozva, melyik motor és felszereltség éri meg, és mire figyelj vásárláskor? Végigvesszük a teljes folyamatot.',
    dateISO: '2026-08-23',
    readingMin: 7,
    image: '/caradvance-hero-x5-poster.jpg',
    keywords: 'bmw x5, bmw x5 eladó, bmw x5 ár, bmw x5 behozatal, használt bmw x5',
  },
  {
    slug: 'elektromos-auto-lizing-tamogatas',
    cat: 'finanszirozas',
    title: 'Elektromos autó lízing és állami támogatás 2026 — árak, feltételek, tudnivalók',
    excerpt: 'Mennyibe kerül egy elektromos autó lízingje, milyen támogatások érhetők el, és megéri-e a váltás? Végigvesszük a költségeket és a döntési szempontokat.',
    dateISO: '2026-08-23',
    readingMin: 8,
    image: '/finanszirozas-hero-poster.jpg',
    keywords: 'elektromos autó, elektromos autó lízing, elektromos autó támogatás magánszemélyeknek, elektromos autó árak, használt elektromos autó',
  },
  {
    slug: 'auto-lizing-maganszemelykent',
    cat: 'finanszirozas',
    title: 'Autó lízing magánszemélyként 2026 — feltételek, kalkulátor, 0% önerő',
    excerpt: 'Mennyibe kerül az autó lízing havonta, ki igényelheti, mi kell hozzá, és hogyan működik a 0% önerős konstrukció? Végigvesszük lépésről lépésre.',
    dateISO: '2026-08-22',
    readingMin: 8,
    image: '/finanszirozas-hero-poster.jpg',
    keywords: 'autó lízing, autólízing, lízing kalkulátor, autó lízing magánszemély, használt autó lízing',
  },
  {
    slug: 'hasznalt-premium-auto-ellenorzo-lista',
    cat: 'import',
    title: 'Használt prémium autó vásárlás — 10 pontos ellenőrző lista',
    excerpt: 'Mielőtt használt prémium autót vennél, fuss végig ezen a 10 ponton. Ezekkel kiszűröd a rejtett hibákat és a rossz vásárlásokat.',
    dateISO: '2026-08-23',
    readingMin: 6,
    image: '/caradvance-hero-beszerzesi-poster.jpg',
    keywords: 'használt autó vásárlás, használt prémium autó, autó ellenőrzés vásárlás előtt, használt autó ellenőrző lista',
  },
  {
    slug: 'auto-behozatal-nemetorszagbol',
    cat: 'import',
    title: 'Autó behozatal Németországból — teljes útmutató a költségekhez és a folyamathoz',
    excerpt: 'Regisztrációs adó, áfa, honosítás, szállítás: mennyibe kerül valójában egy németországi autó behozatala, és hogyan kerüld el a buktatókat?',
    dateISO: '2026-08-22',
    readingMin: 9,
    image: '/caradvance-hero-x5-poster.jpg',
    keywords: 'autó behozatal németország, autó import németországból, használt autó import, autó vásárlás németországból',
  },
  {
    slug: 'hosszu-tavu-autoberles',
    cat: 'berles',
    title: 'Hosszú távú (tartós) autóbérlés — kinek éri meg és mennyibe kerül?',
    excerpt: 'A tartós bérlet egyetlen havi díjba csomagol mindent a szervizről a biztosításig. Megnézzük, mikor jobb választás, mint a vásárlás vagy a lízing.',
    dateISO: '2026-08-22',
    readingMin: 7,
    image: '/caradvance-hero-beszerzesi-poster.jpg',
    keywords: 'hosszú távú autóbérlés, tartós autóbérlés, tartós bérlet, prémium autóbérlés',
  },
];

export const catOf = (key: CatKey): Category => CATEGORIES.find((c) => c.key === key)!;
export const postBySlug = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug);
export const huDate = (iso: string): string =>
  new Date(iso + 'T00:00:00').toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
