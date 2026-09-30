// Egyedi rendelés (eladás) Részletek-oldal összeállítása — /egyedi-auto-rendeles/<slug>
// Bemenet: a lista kártyája (egyediCars.ts: név, karosszéria, üzemanyag, ár) + modellre szabott
// tartalom (saleBMW.ts, saleMINI.ts, saleMercedes.ts, saleAudi.ts). Kimenet: a CarDetail.astro
// "sale" módjának modellje (ugyanaz a felépítés, mint a kézzel írt carModels.ts oldalaké).
// Kulcsszavak: "<modell> ár", "új <modell> eladó", "<modell> Németországból", "autó behozatal
// Németországból", "<modell> lízing / tartós bérlet" — cím, leírás, H2/H3 és GYIK is ezekre épül.
import type { EgyediCar } from './egyediCars';
import { EGYEDI_CARS } from './egyediCars';
import { CONTENT as RENT_CONTENT } from './rentalContent';

export type Eng = [string, string, string, string, string, string, string, string?]; // label, fuel, power, torque, drive, accel, vmax, cons
export interface SaleFacts {
  code?: string;                 // generációs kód, pl. 'G60'
  tagline: string;               // hero alcím
  lead: string;                  // 1–2 mondat a modellről (HTML)
  about: string;                 // "miért jó választás" bekezdés (HTML)
  choose?: string;               // melyik kivitelt válaszd (HTML)
  extra?: { h3: string; html: string }[];
  engines: Eng[];
  boot?: string;
  hl?: [string, string, string][]; // saját kiemelések (ikon, cím, szöveg) — különben generált
  design: [string, string, string[]];
  interior: [string, string, string[]];
  press?: string;                // /berles-press/<press>-<kulcs>.webp (main, design, interior, g1…)
  mainKey?: string;              // melyik sajtófotó legyen a főkép (alap: main)
  noInterior?: boolean;          // nincs belső sajtófotó
  gal?: [string, string][];      // [kulcs, alt]
  faq?: [string, string][];
  rel?: string[];                // kapcsolódó slugok
  rent?: string;                 // bérlési oldal slug (…/berelheto-auto/<rent>-berles)
  chips?: string[];
  bodyType?: string;
  drive?: string;                // 'AWD' | 'RWD' | 'FWD'
  doors?: number;
  year?: string;
  soon?: boolean;                // hamarosan érkező modell — ár kérésre
}

const FX = 364;
const BRAND: Record<string, { name: string; key: string; logo: string; video: string; invert?: boolean; site: string }> = {
  BMW: { name: 'BMW', key: 'bmw', logo: '/bmw-hero-logo.png', video: '/caradvance-hero-x5.mp4', site: 'BMW' },
  MINI: { name: 'MINI', key: 'mini', logo: '/mini-hero-logo.webp?v=3', video: '/mini-JCW-family-video-wide.mp4', site: 'MINI' },
  MB: { name: 'Mercedes-Benz', key: 'mercedes', logo: '/mb-star.webp?v=1', video: '/mercedes-hero.mp4', site: 'Mercedes' },
  AUDI: { name: 'Audi', key: 'audi', logo: '/audi/audi-logo.webp?v=4', video: '/audi-hero.mp4', site: 'Audi' },
};
const FUEL_EN: Record<string, string> = { Benzin: 'Gasoline', 'Dízel': 'Diesel', Hibrid: 'Plug-in hybrid', Elektromos: 'Electric' };
const nf = (n: number) => new Intl.NumberFormat('hu-HU').format(n);
const ef = (n: number) => new Intl.NumberFormat('de-DE').format(n);
const az = (s: string) => (/^[AEIOUÁÉÍÓÖŐÚÜŰ]/i.test(String(s).trim()) ? 'az' : 'a');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (s: string | undefined, re: RegExp) => { const m = String(s || '').match(re); return m ? parseFloat(m[1].replace(',', '.')) : 0; };
const lcFuel = (f: string) => ({ Benzin: 'benzines', 'Dízel': 'dízel', Hibrid: 'plug-in hibrid', Elektromos: 'elektromos' } as Record<string, string>)[f] || f.toLowerCase();

export const saleHref = (slug: string) => '/egyedi-auto-rendeles/' + slug;

export function buildSaleModel(car: EgyediCar, f: SaleFacts) {
  const b = BRAND[car.brand];
  const name = car.name;
  const A = az(name);
  const net = car.from && !f.soon ? Math.round(car.from / 1.19) : 0;
  const huf = net ? nf(Math.round(net * FX)) + ' Ft' : '';
  const vatSave = net ? Math.round((net * 0.08 * FX) / 10000) * 10000 : 0;
  const P = (k: string) => (f.press ? `/berles-press/${f.press}-${k}.webp` : '');
  const mainImg = f.press ? P(f.mainKey || 'main') : car.img.split('?')[0];
  const fuels = car.fuels.length ? car.fuels : [car.fuel];
  const fuelTxt = fuels.map(lcFuel).join(', ').replace(/, ([^,]*)$/, ' és $1');
  const e0 = f.engines[0];
  const powers = f.engines.map((e) => num(e[2], /(\d+)\s*LE/)).filter(Boolean);
  const pMin = powers.length ? Math.min(...powers) : 0, pMax = powers.length ? Math.max(...powers) : 0;
  const pTxt = pMin ? (pMin === pMax ? `${pMin} LE` : `${pMin}–${pMax} LE`) : '';
  const engList = f.engines.map((e) => e[0].replace(new RegExp('^' + b.name + '\\s*|^' + b.site + '\\s*'), '')).join(', ');
  const priceTxt = net ? `${huf} (${ef(net)} € nettó)-tól` : 'egyedi ajánlat alapján';
  const rentHref = f.rent ? `/berelheto-auto/${f.rent}-berles` : `/uj-auto-berlese?brand=${b.key}`;

  const tBase = `Új ${name} eladó — ${net ? 'ár ' + ef(net) + ' €-tól' : 'ár kérésre'}`;
  const title = tBase.length <= 44 ? `${tBase}, Németországból | CarAdvance` : tBase.length <= 60 ? `${tBase} | CarAdvance` : tBase;
  const description = `Új ${name} egyedi rendelése Németországból${net ? ', ' + huf + '-tól (nettó)' : ''}. ${cap(fuelTxt)}${pTxt ? ', ' + pTxt : ''}. Kulcsrakész behozatal, akár 19% német áfa, lízing és tartós bérlet.`;

  const highlights = f.hl ? f.hl.map(([icon, t, x]) => ({ icon, title: t, text: x })) : [
    { icon: '◈', title: pTxt ? pTxt : 'Erős hajtás', text: `${cap(fuelTxt)} hajtás${f.engines.length > 1 ? ', ' + f.engines.length + ' motorváltozat' : ''} — ${e0 ? e0[0] + ': ' + e0[2] : ''}.` },
    { icon: '▦', title: f.design[0], text: f.design[2][0] || f.design[1] },
    { icon: '✦', title: f.interior[0], text: f.interior[2][0] || f.interior[1] },
    { icon: '€', title: 'Kedvező német ár', text: vatSave ? `Magánszemélyként akár 19% német áfával — egy új ${name}-nál kb. ${nf(vatSave)} Ft megtakarítás a 27%-hoz képest.` : 'Magánszemélyként akár 19% német áfával a hazai 27% helyett.' },
  ];

  const overviewLead = `${f.lead} A CarAdvance-nél pontosan azt ${A === 'az' ? 'az' : 'a'} <strong>${name}</strong> modellt rendeljük meg neked, amit szeretnél — új autóként, gyári garanciával, a kívánt motorral, színnel és felszereltséggel, <a href="/beszerzesi-folyamat">Németországból, kulcsrakész behozatallal</a>. ${f.rent ? `Nem szeretnél venni? ${cap(A)} ${name} <a href="${rentHref}">tartós bérletben</a> is elérhető, egyetlen havi díjjal.` : `Nem szeretnél venni? Hasonló ${b.name} modelleket <a href="${rentHref}">tartós bérletben</a> is kínálunk.`}`;

  const blocks: { h3?: string; html: string }[] = [
    { html: f.about },
    { h3: `Mennyibe kerül egy új ${name}? — ${name} ár`, html: net
      ? `${cap(A)} <strong>${name} ára</strong> Németországban nettó <strong>${ef(net)} €-tól</strong> indul (kb. ${huf}, élő árfolyammal). A végleges ár a motortól, a felszereltségi csomagoktól és az aktuális gyári kedvezményektől függ — mi a teljes német kínálatból keressük meg a legjobb ajánlatot. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett, ami egy új ${name}-nál kb. <strong>${nf(vatSave)} Ft</strong> megtakarítás.`
      : `${cap(A)} <strong>${name}</strong> egyedi ajánlat alapján rendelhető: a pontos árat a kiválasztott motor, felszereltség és a gyári elérhetőség alapján adjuk meg. Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár <strong>19%-os német áfával</strong> vásárolhatsz a hazai 27% helyett.` },
  ];
  if (f.choose) blocks.push({ h3: `Melyik ${name} változatot válaszd?`, html: f.choose });
  for (const x of f.extra || []) blocks.push(x);
  blocks.push({ h3: `Új ${name} Németországból — hogyan zajlik a rendelés?`, html: `Elmondod, milyen ${name}-t szeretnél (motor, szín, csomagok), mi pedig ajánlatot kérünk a német márkakereskedésektől, és a legjobb feltételekkel lefoglaljuk. A gyári rendeléstől a szállításon, a <a href="/honositas-kalkulator">honosításon</a> és a forgalomba helyezésen át mindent intézünk — te a kulcsot veszed át. A folyamat lépéseit a <a href="/beszerzesi-folyamat">beszerzési folyamat</a> oldalon mutatjuk be.` });
  blocks.push({ h3: 'Megvásárolod, lízingeled vagy béreled?', html: `Ahogy neked a legjobb: ${A} ${name} elérhető <a href="/finanszirozas-lizing">finanszírozással és lízinggel</a> is, kiszámítható havidíjjal. Ha nem szeretnél tulajdonolni, ${f.rent ? `a modell <a href="${rentHref}">tartós bérletben</a> is a tiéd lehet — egyetlen havi díjjal, szervizzel és gumikkal együtt` : `<a href="${rentHref}">tartós bérletben</a> is kínálunk hasonló modelleket`}.` });

  // galéria: saját lista, különben a bérlési oldal azonos sajtófotóinak galériája (ugyanazok a képek + alt szövegek)
  const rentGal = f.press ? (Object.values(RENT_CONTENT).find((c: any) => c && c.mainImg === P('main') && c.gallery && c.gallery.length) as any) : null;
  const gal = f.gal ? f.gal.map(([k, alt]) => ({ img: P(k), alt: `${name} ${alt}` })) : (rentGal ? rentGal.gallery.map((g: any) => ({ img: g.img, alt: g.alt.replace(/ bérlés\b/, '') })) : []);
  const galImgs = gal.map((g) => g.img);
  const variants = f.engines.map((e, i) => ({
    key: 'v' + i, label: e[0], fuel: e[1], power: e[2], torque: e[3], drive: e[4], accel: e[5], vmax: e[6], cons: e[7] || '', boot: f.boot || '',
    rec: '', img: galImgs[i] || mainImg, alt: `${e[0]} — új autó Németországból`,
  }));

  const faq = [
    { q: `Mennyibe kerül egy új ${name}?`, a: net ? `${cap(A)} ${name} német nettó listaára ${ef(net)} €-tól (kb. ${huf}) indul; a végleges ár a motortól és a felszereltségtől függ. Magánszemélyként akár 19% német áfával rendelheted — pontos ajánlatért keress minket.` : `${cap(A)} ${name} egyedi ajánlat alapján rendelhető; a pontos árat a kiválasztott konfiguráció alapján adjuk meg. Magánszemélyként akár 19% német áfával vásárolhatsz.` },
    { q: `Milyen motorokkal rendelhető ${A} ${name}?`, a: `${cap(A)} ${name} ${fuelTxt} hajtással érhető el${pTxt ? ', ' + pTxt + ' teljesítménnyel' : ''}. Jellemző változatok: ${engList}. Segítünk kiválasztani a hozzád illő kivitelt.` },
    { q: 'Mennyivel olcsóbb a német áfás vásárlás?', a: `Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19% német áfával vásárolhatsz a hazai 27% helyett${vatSave ? `; egy új ${name}-nál ez kb. ${nf(vatSave)} Ft megtakarítás` : ''}.` },
    { q: `Érvényes a gyári garancia a Németországból hozott ${name}-ra?`, a: 'Igen. Új autóként a gyári garancia az Európai Unió teljes területén — így Magyarországon is — érvényes, a szervizelés bármelyik hazai márkaszervizben elvégezhető.' },
    { q: 'Mennyi idő a behozatal?', a: 'Készletről jellemzően néhány hét, gyári rendelésnél a konfigurációtól függ. A beszerzés, szállítás, honosítás és forgalomba helyezés minden lépését mi intézzük.' },
    { q: `Lízingelhető vagy bérelhető ${A} ${name}?`, a: f.rent ? `Igen — ${A} ${name} lízinggel és finanszírozással is megvásárolható, illetve <a href="${rentHref}">tartós bérletben</a> is elérhető egyetlen havi díjjal, szervizzel és gumikkal együtt.` : `Igen — ${A} ${name} lízinggel és finanszírozással is megvásárolható, kiszámítható havidíjjal. Tartós bérletben hasonló modelleket kínálunk.` },
    ...(f.faq || []).map(([q, a]) => ({ q, a })),
  ];

  const relSlugs = (f.rel || []).length ? f.rel! : EGYEDI_CARS.filter((c) => c.brand === car.brand && c.slug !== car.slug && c.body === car.body).slice(0, 4).map((c) => c.slug);
  const related = relSlugs.map((s) => EGYEDI_CARS.find((c) => c.slug === s)).filter(Boolean).slice(0, 4).map((c: any) => ({
    name: c.name, href: saleHref(c.slug), img: c.img.split('?')[0], sub: c.from ? nf(Math.round((Math.round(c.from / 1.19)) * FX)) + ' Ft-tól' : 'Ár kérésre',
  }));

  const kw = num(e0 && e0[2], /\((\d+)\s*kW/);
  return {
    slug: car.slug, brand: b.name, brandKey: b.key, brandLogo: b.logo, brandLogoInvert: !!b.invert,
    name, modelCode: f.code || '', title, description, netEur: net,
    orderKey: car.key, orderFuels: fuels.join(','),
    heroSub: f.tagline, heroVideo: b.video, heroPoster: '', mainImg, mainAlt: `Új ${name} — egyedi rendelés Németországból`,
    mainContain: !f.press,
    chips: f.chips || [car.body, ...fuels, 'Automata'].slice(0, 4), yearChip: f.year || '2026 · Németország', bodyType: f.bodyType || car.body,
    overviewH2: `Új ${name} Németországból — ár és egyedi rendelés`, overviewLead, highlights,
    design: { h3: f.design[0], text: f.design[1], bullets: f.design[2], img: f.press ? P('design') : '', alt: `${name} külső dizájn` },
    interior: { h3: f.interior[0], text: f.interior[1], bullets: f.interior[2], img: f.press && !f.noInterior ? P('interior') : '', alt: `${name} belső tér` },
    prose: { h2: `Új ${name} vásárlás Németországból — amit érdemes tudni`, blocks },
    variants, gallery: gal, faq, related,
    schema: {
      modelName: name, modelDate: '2026', bodyTypeEn: car.body, doors: f.doors || 5, transmission: 'Automatic',
      drive: f.drive || '', fuelType: FUEL_EN[car.fuel] || car.fuel, engineFuel: FUEL_EN[car.fuel] || car.fuel,
      powerKw: kw, torqueNm: num(e0 && e0[3], /(\d+)\s*Nm/), vmaxKmh: num(e0 && e0[6], /(\d+)\s*km/), accelSec: num(e0 && e0[5], /([\d,]+)\s*mp/),
      cargoL: num(f.boot, /(\d+)/), consL: 0,
    },
  };
}
