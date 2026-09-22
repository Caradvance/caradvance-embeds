// Megosztott bérlési adatforrás — a lista (UjAutoBerles.astro) és a
// modellenkénti bérlési aloldalak (/uj-auto-berlese/<slug>) is ezt használják.
// Adatforrás: "új autó bérlés" sheet (44 modell). Ne adj hozzá a listán kívüli modellt.

export const HUF = 368; // 1 € = 368 Ft (a listával azonos árfolyam)

export const BRANDS = [
  { id:'bmw',      name:'BMW',      logo:'/bmw/bmw-logo.webp?v=2',   heroLogo:'/bmw-hero-logo.png',      vid:'/caradvance-hero-x5.mp4',          dot:'#0166B1' },
  { id:'mini',     name:'MINI',     logo:'/mini-hero-logo.webp?v=3', heroLogo:'/mini-hero-logo.webp?v=3', vid:'/mini-JCW-family-video-wide.mp4', dot:'#1B1B1B' },
  { id:'mercedes', name:'Mercedes', logo:'/mb-star.webp?v=1',        heroLogo:'/mb-star.webp?v=1',       vid:'/mercedes-hero.mp4',               dot:'#00A3E0' },
  { id:'audi',     name:'Audi',     logo:'/audi/audi-logo.webp?v=4', heroLogo:'/audi/audi-logo.webp?v=4', vid:'/audi-hero.mp4',                  dot:'#BB0A30' },
];

export function slugify(s) {
  return String(s).toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o')
    .replace(/ö|ő/g, 'o').replace(/ú/g, 'u').replace(/ü|ű/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// b: márka id · fam: modellcsalád · m: név · k: kaució (€) · p2: havidíj 2000 km/hó (€) · p3: havidíj 3000 km/hó (€) · img: kártyakép
const RAW = [
  // BMW
  { b:'bmw', fam:'2-es', m:'BMW M2 Coupe', k:5000, p2:1450, p3:1600, img:'/bmw/m2.webp' },
  { b:'bmw', fam:'3-as', m:'BMW 3-as Limuzin', k:5000, p2:1400, p3:1500, img:'/bmw/3er.webp' },
  { b:'bmw', fam:'3-as', m:'BMW 3-as Touring', k:5000, p2:1400, p3:1500, img:'/bmw/3ert.webp' },
  { b:'bmw', fam:'3-as', m:'BMW M3 Limuzin', k:7500, p2:1950, p3:2150, img:'/bmw/m3.webp' },
  { b:'bmw', fam:'3-as', m:'BMW M3 Touring', k:7500, p2:1950, p3:2150, img:'/bmw/m3t.webp' },
  { b:'bmw', fam:'4-es', m:'BMW 4-es Coupé', k:5000, p2:1550, p3:1790, img:'/bmw/4erc.webp' },
  { b:'bmw', fam:'4-es', m:'BMW M4 Coupé', k:7500, p2:2000, p3:2150, img:'/bmw/m4b.webp' },
  { b:'bmw', fam:'5-ös', m:'BMW 5-ös Limuzin', k:7500, p2:1600, p3:1900, img:'/bmw/5erb.webp' },
  { b:'bmw', fam:'5-ös', m:'BMW 5-ös Touring', k:7500, p2:1600, p3:1900, img:'/bmw/5ertb.webp' },
  { b:'bmw', fam:'5-ös', m:'BMW M5 Limuzin', k:10000, p2:2100, p3:2300, img:'/bmw/m5.webp' },
  { b:'bmw', fam:'5-ös', m:'BMW M5 Touring', k:10000, p2:2100, p3:2300, img:'/bmw/m5t.webp' },
  { b:'bmw', fam:'X1', m:'BMW X1', k:3000, p2:1180, p3:1380, img:'/bmw/x1b.webp' },
  { b:'bmw', fam:'X3', m:'BMW X3', k:5000, p2:1550, p3:1660, img:'/bmw/x3mw.webp' },
  { b:'bmw', fam:'X5', m:'BMW X5', k:7500, p2:1790, p3:2020, img:'/bmw/x5.webp' },
  { b:'bmw', fam:'X6', m:'BMW X6', k:7500, p2:1840, p3:2120, img:'/bmw/x6b.webp' },

  // MINI
  { b:'mini', fam:'MINI', m:'MINI Cooper 3 ajtós', k:3000, p2:1050, p3:1250, img:'/cooper-s.webp' },
  { b:'mini', fam:'MINI', m:'MINI Cooper 5 ajtós', k:3000, p2:1050, p3:1250, img:'/cooper.webp' },
  { b:'mini', fam:'MINI', m:'MINI Cooper Cabrio', k:3000, p2:1050, p3:1250, img:'/cooper-cabrio.webp' },
  { b:'mini', fam:'MINI', m:'MINI Countryman', k:3000, p2:1050, p3:1250, img:'/countryman.webp' },
  { b:'mini', fam:'MINI', m:'MINI John Cooper Works', k:3000, p2:1100, p3:1350, img:'/jcw-hatch.webp' },

  // Mercedes
  { b:'mercedes', fam:'A-osztály', m:'Mercedes A-osztály', k:3000, p2:1030, p3:1220, img:'/mb-a.webp' },
  { b:'mercedes', fam:'B-osztály', m:'Mercedes B-osztály', k:3000, p2:1100, p3:1350, img:'/mb-b.webp' },
  { b:'mercedes', fam:'C-osztály', m:'Mercedes C-osztály Limuzin', k:5000, p2:1200, p3:1430, img:'/mb-c.webp' },
  { b:'mercedes', fam:'C-osztály', m:'Mercedes-AMG C-osztály Limuzin', k:7500, p2:1680, p3:2010, img:'/mb-amg-c.webp' },
  { b:'mercedes', fam:'C-osztály', m:'Mercedes C-osztály T-modell', k:5000, p2:1200, p3:1430, img:'/mb-ct.webp' },
  { b:'mercedes', fam:'C-osztály', m:'Mercedes-AMG C-osztály T-modell', k:7500, p2:1680, p3:2010, img:'/mb-amg-ct.webp' },
  { b:'mercedes', fam:'E-osztály', m:'Mercedes E-osztály Limuzin', k:7500, p2:1450, p3:1760, img:'/mb-e.webp' },
  { b:'mercedes', fam:'E-osztály', m:'Mercedes-AMG E-osztály Limuzin', k:10000, p2:1900, p3:2300, img:'/mb-amg-e.webp' },
  { b:'mercedes', fam:'E-osztály', m:'Mercedes E-osztály T-modell', k:7500, p2:1450, p3:1760, img:'/mb-et.webp' },
  { b:'mercedes', fam:'E-osztály', m:'Mercedes-AMG E-osztály T-modell', k:10000, p2:2100, p3:2500, img:'/mb-amg-et.webp' },
  { b:'mercedes', fam:'S-osztály', m:'Mercedes S-osztály', k:10000, p2:2400, p3:2650, img:'/mb-s.webp' },
  { b:'mercedes', fam:'CLE', m:'Mercedes CLE Cabrio', k:5000, p2:1300, p3:1400, img:'/mb-cle-cabrio.webp' },
  { b:'mercedes', fam:'CLE', m:'Mercedes CLE Coupé', k:5000, p2:1300, p3:1550, img:'/mb-cle-coupe.webp' },
  { b:'mercedes', fam:'CLE', m:'Mercedes-AMG CLE Coupé', k:7500, p2:1720, p3:2040, img:'/mb-amg-cle-coupe.webp' },
  { b:'mercedes', fam:'GLA', m:'Mercedes GLA', k:5000, p2:1300, p3:1500, img:'/mb-gla.webp' },
  { b:'mercedes', fam:'GLB', m:'Mercedes GLB', k:5000, p2:1300, p3:1550, img:'/mb-glb.webp' },
  { b:'mercedes', fam:'GLC', m:'Mercedes GLC', k:5000, p2:1450, p3:1760, img:'/mb-glc.webp' },
  { b:'mercedes', fam:'GLC', m:'Mercedes GLC Coupé', k:5000, p2:1650, p3:1900, img:'/mb-glc-coupe.webp' },
  { b:'mercedes', fam:'GLE', m:'Mercedes GLE', k:7500, p2:1720, p3:2040, img:'/mb-gle.webp' },
  { b:'mercedes', fam:'GLE', m:'Mercedes GLE Coupé', k:7500, p2:1720, p3:2040, img:'/mb-gle-coupe.webp' },

  // Audi
  { b:'audi', fam:'A3', m:'Audi A3', k:3000, p2:1150, p3:1350, img:'/audi/a3lim.webp' },
  { b:'audi', fam:'A6', m:'Audi A6', k:7500, p2:1720, p3:2040, img:'/audi/a6lim.webp' },
  { b:'audi', fam:'Q5', m:'Audi Q5', k:5000, p2:1720, p3:2040, img:'/audi/q5.webp' },
  { b:'audi', fam:'Q7', m:'Audi Q7', k:7500, p2:2100, p3:2500, img:'/audi/q7.webp' },
];

export const MODELS = RAW.map((m) => ({ ...m, slug: slugify(m.m) }));

export const brandOf = (id) => BRANDS.find((b) => b.id === id) || BRANDS[0];
export const bySlug = (slug) => MODELS.find((m) => m.slug === slug) || null;

// Karosszéria a modellnévből (szűréshez + chiphez).
export const bodyOf = (car) => {
  const n = car.m;
  if (/Cabrio|Kabrió/.test(n)) return 'Kabrió';
  if (/Touring|T-modell/.test(n)) return 'Kombi';
  if (/Countryman/.test(n)) return 'SUV';
  if (car.b === 'mini') return 'Ferdehátú';
  if (/GLC Coupé|GLE Coupé/.test(n)) return 'SUV Coupé';
  if (/Coupé|Coupe/.test(n)) return 'Coupé';
  if (/\bX1\b|\bX3\b|\bX5\b|\bX6\b|\bQ5\b|\bQ7\b|GLA|GLB|GLC|GLE/.test(n)) return 'SUV';
  return 'Limuzin';
};

// Ezeknél a modelleknél van részletes (megvásárolható) egyedi aloldal is — átlinkeljük.
export const EGYEDI = {
  'BMW M4 Coupé':'m4-benzin', 'BMW X3':'x3-benzin', 'BMW X5':'x5-dizel', 'BMW X6':'x6-dizel',
  'Audi A3':'a3lim-benzin', 'Audi A6':'a6lim-benzin', 'Audi Q5':'q5-benzin', 'Audi Q7':'q7-benzin',
};

// Ft-formázás (ezres szóközzel)
export const g = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const gh = (eur) => g(eur * HUF);
