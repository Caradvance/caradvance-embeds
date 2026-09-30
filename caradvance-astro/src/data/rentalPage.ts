// Bérlési Részletek-oldal összeállítása (CarDetail "berles" módhoz).
// Minden szám a Choice-adatból jön (rental.ts → getRental), a modellre szabott szöveg,
// műszaki adat és sajtófotó a rentalContent.ts-ből. Ha egy modellhez még nincs saját
// tartalom, jól olvasható, kulcsszavas alapszöveg készül ugyanabból az adatból.
import type { RentalData } from './rental';
import { fmtNum } from './rental';

export interface TrimSpec { fuel?: string; power?: string; torque?: string; drive?: string; accel?: string; vmax?: string; cons?: string; boot?: string; rec?: string; note?: string; img?: string; }
export interface RentalContent {
  title?: string; description?: string; h1?: string; heroSub?: string;
  heroVideo?: string; heroPoster?: string; mainImg?: string; mainAlt?: string;
  body?: string; chips?: string[];
  overviewH2?: string; overviewLead?: string;
  highlights?: { icon: string; title: string; text: string }[];
  design?: { h3: string; text: string; bullets: string[]; img: string; alt: string };
  interior?: { h3: string; text: string; bullets: string[]; img: string; alt: string };
  guideIntro?: string; guideBlocks?: { h3: string; html: string }[];
  drive?: string; boot?: string;
  specs?: Record<string, TrimSpec>;
  gallery?: { img: string; alt: string }[];
  faqExtra?: { q: string; a: string }[];
  egyediSlug?: string;
  schema?: Record<string, any>;
}

const BRAND: Record<string, { key: string; logo: string; invert?: boolean; video?: string }> = {
  BMW: { key: 'bmw', logo: '/bmw-hero-logo.png', video: '/caradvance-hero-x5.mp4' },
  MINI: { key: 'mini', logo: '/mini-hero-logo.webp?v=3', video: '/mini-JCW-family-video-wide.mp4' },
  'Mercedes-Benz': { key: 'mercedes', logo: '/mb-star.webp?v=1', video: '/mercedes-hero.mp4' },
  Audi: { key: 'audi', logo: '/audi/audi-logo.webp?v=4', video: '/audi-hero.mp4' },
  VW: { key: 'vw', logo: '/bl-vw.webp', invert: true },
  CUPRA: { key: 'cupra', logo: '/bl-cupra.webp', invert: true },
  Hyundai: { key: 'hyundai', logo: '/bl-hyundai.webp', invert: true },
  Kia: { key: 'kia', logo: '/bl-kia.webp', invert: true },
  MAN: { key: 'man', logo: '/bl-man.webp', invert: true },
  Seat: { key: 'seat', logo: '/bl-seat.webp', invert: true },
  Volvo: { key: 'volvo', logo: '/bl-volvo.webp', invert: true },
};
const BODY_FIX: Record<string, string> = {
  'BMW 1er': 'Kompakt', 'VW Golf': 'Kompakt', 'VW Polo': 'Kisautó', 'Audi A3 Sportback': 'Kompakt',
  'Audi A6 Avant e-tron': 'Kombi', 'Audi A6 Sportback e-tron': 'Sportback', 'Audi Q4 Sportback e-tron': 'SUV Coupé',
  'Audi Q5 Sportback': 'SUV Coupé', 'Audi SQ5 Sportback': 'SUV Coupé', 'Audi Q6 Sportback': 'SUV Coupé', 'Audi Q3 Sportback': 'SUV Coupé',
  'BMW X2': 'SUV Coupé', 'BMW X6': 'SUV Coupé', 'Mercedes-Benz GLC Coupé': 'SUV Coupé', 'BMW 4er Gran Coupe': 'Gran Coupé',
};
const FUEL_HU: Record<string, string> = { Benzin: 'benzin', 'Dízel': 'dízel', PHEV: 'plug-in hibrid', Hibrid: 'hibrid', Elektromos: 'elektromos', 'Elektro': 'elektromos' };
export const fuelHu = (f: string) => String(f).split(' / ').map((x) => FUEL_HU[x] || x.toLowerCase()).join(' / ');
const FUEL_CAP: Record<string, string> = { Benzin: 'Benzin', 'Dízel': 'Dízel', PHEV: 'Plug-in hibrid', Hibrid: 'Hibrid', Elektromos: 'Elektromos' };
const fuelCap = (f: string) => String(f).split(' / ').map((x) => FUEL_CAP[x] || x).join(' / ');
export const az = (s: string) => (/^[AEIOUÁÉÍÓÖŐÚÜŰ]/i.test(String(s).trim()) ? 'az' : 'a');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lc = (s: string) => String(s).split(' ').map((w) => (/^[A-ZÁÉÍÓÖŐÚÜŰ]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ');

export function buildRentalModel(r: RentalData, c: RentalContent = {}) {
  const br = BRAND[r.brand] || { key: r.brand.toLowerCase(), logo: '/bl-' + r.brand.toLowerCase() + '.webp', invert: true };
  const name = r.name;
  const A = az(name);
  const huf = fmtNum(r.huf) + ' Ft';
  const eur = r.eur;
  const km = r.km.length ? r.km[0] : 0;
  const kmNum = km ? fmtNum(km) : '';
  const months = r.months.length ? r.months[0] : 0;
  const dep = r.dep;
  const depMax = r.trims.length ? Math.max(...r.trims.map((t) => t.dep)) : dep;
  const body = c.body || BODY_FIX[r.key] || (r.cat || '').replace(' / Terepjáró', '') || 'Prémium autó';
  const gear = r.gears.includes('Automata') ? 'Automata' : (r.gears[0] || 'Automata');
  const fuelsTxt = r.fuels.map(fuelHu).join(', ');
  const laterTxt = r.later.map((l) => l.d.replace(/^\d{4}\.\s*/, '') + ': ' + l.c + ' db').join(', ');
  const trimShort = r.trims.map((t) => t.name).join(', ');
  const kmTxt = km ? `${kmNum} km/hó futáskerettel` : 'egyedi futáskerettel';
  const moTxt = months ? `${months} hónapos futamidővel` : 'rugalmas futamidővel';
  const psTxt = r.psMin && r.psMax ? (r.psMin === r.psMax ? `${r.psMin} LE` : `${r.psMin}–${r.psMax} LE`) : '';

  // változatok (bérelhető kivitelek) + műszaki adatok
  const specs = c.specs || {};
  const photo = c.mainImg || r.photo;
  const variants = (r.trims.length ? r.trims : [{ name: r.model, eur, huf: r.huf, dep, depHuf: r.depHuf, fuel: r.fuels.join(' / ') }]).map((t, i) => {
    const s: TrimSpec = specs[t.name] || {};
    return {
      key: 'v' + i, label: (r.trims.length ? name + ' ' + t.name : name),
      fuel: s.fuel || fuelCap(t.fuel), power: s.power || '', torque: s.torque || '', drive: s.drive || c.drive || gear,
      accel: s.accel || '', vmax: s.vmax || '', cons: s.cons || '', boot: s.boot || c.boot || '', rec: s.rec || '',
      img: s.img || photo, alt: name + ' ' + t.name + ' bérlés', rentTxt: t.eur + ' €/hó-tól', note: s.note || fuelHu(t.fuel), t,
    };
  });

  const title = c.title || `${name} bérlés — tartós bérlet ${eur} €/hó-tól | CarAdvance`;
  const descBase = `${name} bérlés és tartós bérlet ${huf}/hó-tól${km ? `, ${kmNum} km/hó futáskerettel` : ''}${months ? `, ${months} hónapra` : ''}, kaució ${fmtNum(dep)} €-tól. Vadonatúj, 0 km-es ${lc(body)}`;
  const descLong = descBase + (trimShort ? ` — ${trimShort}.` : '.');
  const description = c.description || (descLong.length <= 175 ? descLong : descBase + ', azonnal vagy hamarosan elérhető.');

  const highlights = c.highlights || [
    { icon: '€', title: `${huf}/hó-tól`, text: `Átlátható havi bérleti díj ${kmTxt} és ${moTxt} — ugyanaz az ár, mint a bérelhető autóink között.` },
    { icon: '⛽', title: r.fuels.length > 1 ? 'Több hajtás közül' : cap(fuelHu(r.fuels[0] || 'benzin')) + ' hajtás', text: variants.length > 1 ? 'Bérelhető: ' + variants.map((v) => v.t.name + ' (' + fuelHu(v.t.fuel) + ')').join(', ') + '.' : `${cap(fuelsTxt || 'benzin')} hajtás${psTxt ? ', ' + psTxt : ''}, ${gear.toLowerCase()} váltóval.` },
    { icon: '◈', title: r.count ? `${r.count} db ${name}` : `Bérelhető ${name}`, text: `${r.now ? r.now + ' db azonnal elérhető' : 'Hamarosan elérhető'}${laterTxt ? '; további autók — ' + laterTxt : ''}. Vadonatúj, 0 km-es autók.` },
    { icon: '✓', title: 'Szerviz, adó, gumi a díjban', text: `A szervizt, az adót és a nyári-téli gumiszettet mi álljuk — egyszeri, visszajáró kaució ${fmtNum(dep)} €-tól.` },
  ];

  const guideBlocks = [
    { html: c.guideIntro || `${cap(A)} <strong>${name}</strong> ${lc(body)} kategóriájában népszerű választás. <strong>Tartós bérletben</strong> úgy vezetheted, hogy nem kötsz le benne nagy összeget: egyetlen <strong>havi díjat</strong> fizetsz, a szervizt, az adót és a gumikat mi intézzük. Ez a <a href="/berles-elonyei">hosszú távú autóbérlés</a> lényege: kiszámítható költség, új autó, továbbeladási gond nélkül.` },
    { h3: `Melyik ${name} bérelhető?`, html: variants.length > 1 ? `Jelenleg ${variants.length} változat közül választhatsz: ` + variants.map((v) => `<strong>${v.t.name}</strong> — ${v.note}, ${v.t.eur} €/hó-tól`).join('; ') + '.' : `Jelenleg a(z) <strong>${variants[0].t.name}</strong> kivitel bérelhető (${fuelHu(variants[0].t.fuel)}), ${eur} €/hó-tól.` },
    ...(c.guideBlocks || []),
    { h3: `Mennyibe kerül ${A} ${name} bérlése?`, html: `${cap(A)} <strong>${name} bérlés</strong> havidíja ${huf} (${eur} €) -tól indul ${kmTxt} és ${moTxt}. Az egyszeri, visszatérítendő <strong>kaució</strong> ${fmtNum(dep)} €-tól indul${depMax > dep ? `, az erősebb változatoknál ${fmtNum(depMax)} €` : ''}. A pontos díj a változattól, a színtől és a felszereltségi csomagtól függ — a <a href="/autoink#berelheto">bérelhető autóink</a> között minden modell havidíját és elérhetőségét látod.` },
    { h3: 'Tartós bérlet, lízing vagy vásárlás?', html: `Ha nem szeretnél tulajdonolni, a <strong>tartós autóbérlés</strong> a legrugalmasabb: nincs önerő, nincs maradványérték-kockázat, és akár félévente új modellre válthatsz. Cégként a bérleti díj elszámolható költség — hasonlóan az <strong>operatív lízinghez</strong>, de hosszú kötöttség nélkül. Ha mégis a sajátod lenne, nézd meg a <a href="/finanszirozas-lizing">lízing</a> és az <a href="${c.egyediSlug ? '/egyedi-auto-rendeles/' + c.egyediSlug : '/egyedi-auto-rendeles'}">egyedi rendelés</a> lehetőségeit.${r.related.length ? ` Más modellt keresel? Nézd meg a bérelhető <a href="${r.related[0].href}">${r.related[0].name}</a>${r.related[1] ? ` és <a href="${r.related[1].href}">${r.related[1].name}</a>` : ''} modelleket is.` : ''}` },
  ];

  const faq = [
    { q: `Mennyibe kerül ${A} ${name} bérlése?`, a: `${cap(A)} ${name} havi bérleti díja ${huf} (${eur} €) -tól indul ${kmTxt} és ${moTxt}.${variants.length > 1 ? ' Változatonként: ' + variants.map((v) => v.t.name + ' ' + v.t.eur + ' €/hó-tól').join(', ') + '.' : ''} Pontos, személyre szabott ajánlatért keress minket.` },
    ...(km && months ? [{ q: `Mekkora a futáskeret ${A} ${name} tartós bérletnél?`, a: `Havonta ${kmNum} km — a ${months} hónapos futamidő alatt összesen ${fmtNum(km * months)} km fér bele a havidíjba. Ez bőven elég a napi ingázáshoz és a hosszabb utakhoz is.` }] : []),
    { q: 'Mit tartalmaz a havi bérleti díj?', a: `A havidíj a vadonatúj ${name} használatát tartalmazza a megadott futáskerettel; a szervizt, az adót és a nyári-téli gumiszettet mi álljuk. A pontos feltételeket az ajánlatban előre, írásban rögzítjük.` },
    { q: 'Mennyi a kaució és visszajár-e?', a: `A kaució egyszeri, visszatérítendő letét: ${fmtNum(dep)} €-tól${depMax > dep ? `, változattól függően legfeljebb ${fmtNum(depMax)} €` : ''}. A bérlet végén — káresemény és rendkívüli kopás nélkül — teljes egészében visszajár.` },
    { q: 'Mennyi a bérlési időtartam?', a: `A tartós bérlet futamideje ${months ? months + ' hónap' : 'egyedileg egyeztetett'}. Utána meghosszabbíthatod, vagy új modellre válthatsz — akár félévente új autóval.` },
    { q: `Mikor vehetem át a bérelt autót?`, a: `${r.now ? r.now + ` db ${name} azonnal elérhető` : 'Jelenleg nincs azonnal elérhető darab'}${laterTxt ? '; további autók: ' + laterTxt : ''}. Vadonatúj, 0 km-es autót adunk át.` },
    ...(c.faqExtra || []),
    { q: `Magánszemélyként és cégként is bérelhető ${A} ${name}?`, a: `Igen, ${A} ${name} tartós bérlet magánszemélyeknek és cégeknek is elérhető. Cégként a bérleti díj a könyvelésben elszámolható költség.` },
  ];

  const chips = c.chips || [body, ...(r.fuels.length ? [r.fuels.map(fuelCap).join(' · ')] : []), gear, ...(km ? [`${kmNum} km/hó`] : [])];

  return {
    slug: r.slug, name, brand: r.brand === 'VW' ? 'Volkswagen' : r.brand, brandKey: br.key,
    h1: c.h1 || `${name} bérlés`,
    title, description,
    heroSub: c.heroSub || `Vadonatúj ${name} tartós bérletben ${huf}/hó-tól — ${kmTxt}, ${moTxt} és egyszeri, visszajáró kaucióval. ${cap(fuelsTxt || 'benzin')} hajtás, ${gear.toLowerCase()} váltó.`,
    heroVideo: c.heroVideo !== undefined ? c.heroVideo : (br.video || ''),
    heroPoster: c.heroPoster || '',
    brandLogo: br.logo, brandLogoInvert: !!br.invert,
    mainImg: photo, mainAlt: c.mainAlt || `${name} bérlés — vadonatúj ${lc(body)} tartós bérletben`, mainContain: !c.mainImg,
    chips, yearChip: 'Vadonatúj · 0 km',
    bodyType: body,
    overviewH2: c.overviewH2 || `${name} tartós bérlet — vadonatúj ${lc(body)} havidíjjal`,
    overviewLead: c.overviewLead || `${cap(A)} <strong>${name} bérlés</strong> a legegyszerűbb út egy vadonatúj autóhoz: <strong>tartós bérletben</strong> ${huf}/hó-tól vezetheted, ${kmTxt} és ${moTxt}. ${r.count ? `Jelenleg ${r.count} db ${name} közül választhatsz${r.now ? ` (${r.now} db azonnal elérhető)` : ''}` : 'Több változat közül választhatsz'}${trimShort && variants.length > 1 ? `, ${trimShort} kivitelben` : ''}. Egyszeri, visszajáró <strong>kaució</strong> ${fmtNum(dep)} €-tól; a szervizt, az adót és a nyári-téli gumit mi álljuk. Nem kell tulajdonolnod: a bérlet végén egyszerűen visszaadod, vagy új modellre váltasz.`,
    highlights,
    design: c.design ? { ...c.design, text: c.design.text + (r.colors.length ? ` Bérelhető színek: ${r.colors.join(', ')}.` : '') } : null,
    interior: c.interior || null,
    prose: { h2: `${name} bérlés — így működik a tartós bérlet`, blocks: guideBlocks },
    variants, gallery: c.gallery || [],
    faq,
    related: r.related.map((x) => ({ name: x.name, href: x.href, img: x.img, sub: fmtNum(x.huf) + ' Ft/hó-tól' })),
    saleSlug: c.egyediSlug || '',
    rentEur: eur, kaucioEur: dep,
    orderKey: '', orderFuels: r.fuels.join(','), netEur: eur, modelCode: '',
    schema: {
      modelName: name, modelDate: '2026', bodyTypeEn: body, doors: 5, transmission: gear === 'Automata' ? 'Automatic' : 'Manual',
      drive: '', fuelType: r.fuels.join(', '), engineFuel: r.fuels.join(', '), powerKw: r.psMax ? Math.round(r.psMax * 0.7355) : undefined,
      ...(c.schema || {}),
    },
  };
}
