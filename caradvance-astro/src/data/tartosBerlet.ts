// Tartós bérlet céloldalak (2026-10) — /tartos-berlet/ és aloldalai.
// A modellek, havidíjak, kauciók build-időben a src/data/rental.ts-ből jönnek (ugyanaz, mint a kártyák).
// Itt csak az oldalankénti szöveg, kulcsszó és szűrő van.
import { listRentals, getRental, type RentalData } from './rental';

export interface TbVariant {
  key: string;
  path: string;            // pl. '/tartos-berlet/bmw'
  title: string;           // <title> — {min} helyére a legalacsonyabb havidíj kerül
  description: string;     // meta — {min}, {n}
  eyebrow: string;
  h1a: string; h1b: string;
  sub: string;             // hero alcím — {min}, {n}, {dep}
  filter: (r: RentalData) => boolean;
  intro: string[];         // bevezető bekezdések (HTML engedett)
  points?: [string, string][];  // kiemelt előnyök (cím, szöveg)
  extra?: { h: string; p: string[] }[];
  faqs: [string, string][];
  related: string[];       // más variáns kulcsok
}

export function allRentals(): RentalData[] {
  const out: RentalData[] = [];
  for (const x of listRentals()) { const r = getRental(x.brand, x.model); if (r && r.huf > 0) out.push(r); }
  return out.sort((a, b) => a.huf - b.huf);
}

export const fmt = (n: number) => Math.round(n).toLocaleString('hu-HU').replace(/ /g, ' ');

const BASE_POINTS: [string, string][] = [
  ['Nincs önerő', 'Csak egy visszajáró kauciót kérünk — a vételár töredékét. A tőkéd a vállalkozásodban vagy a megtakarításaidban dolgozik tovább.'],
  ['Minden benne van', 'Szerviz, gépjárműadó, kötelező biztosítás és casco, nyári-téli gumiszett: egy fix havidíj, váratlan számlák nélkül.'],
  ['Rövid kötöttség', 'Már 6 hónapos futamidőtől — nem 3–4 évre kötöd el magad, mint egy operatív lízingnél. Utána akár új modellre válthatsz.'],
  ['Új, prémium autók', 'Új és szinte új BMW, Mercedes, Audi, MINI, Volkswagen és elektromos modellek, német rendszámmal, bőséges futáskerettel.'],
  ['Nincs értékvesztés', 'A bérlet végén egyszerűen visszaadod az autót — nem kell eladnod, nem téged terhel, ha esik a használt autók ára.'],
  ['Gyors ügyintézés', 'Online ajánlatkérés, magyar nyelvű kapcsolattartás, gyors átadás. Cégeknek és magánszemélyeknek egyaránt.'],
];

const isBrand = (b: string) => (r: RentalData) => r.brand.toLowerCase().startsWith(b);

export const VARIANTS: TbVariant[] = [
  {
    key: 'main', path: '/tartos-berlet',
    title: 'Tartós bérlet 2026 — új autó {min} Ft/hó-tól, 6 hónaptól | CarAdvance',
    description: 'Autó tartós bérlet önerő nélkül: {n} új prémium modell {min} Ft/hó-tól (nettó), szervizzel, adóval, casco-val és gumikkal. Már 6 hónaptól, cégeknek és magánszemélyeknek.',
    eyebrow: 'Tartós autóbérlés',
    h1a: 'Tartós bérlet', h1b: 'új autó egy fix havidíjért',
    sub: '{n} bérelhető új prémium autó {min} Ft/hó-tól (nettó) — szerviz, adó, biztosítás és gumi a díjban, önerő nélkül, már 6 hónapos futamidőtől.',
    filter: () => true,
    intro: [
      'A <strong>tartós bérlet</strong> (más néven <strong>tartós autóbérlés</strong> vagy hosszú távú autóbérlés) azt jelenti, hogy egy új autót hónapokra vagy évekre bérelsz, egy előre rögzített havidíjért. Nem kell megvenned, nem kell lízingszerződést kötnöd, és nem kell önerőt fizetned: a havidíj fedezi az autó használatát, a szervizt, az adót, a biztosítást és a gumikat.',
      'Nálunk az <strong>autó tartós bérlet</strong> különösen rugalmas: a futamidő már 6 hónaptól indul, a futáskeret havi 4000 km körül van, és a bérlet végén egyszerűen visszaadod az autót. Az alábbi listában minden jelenleg bérelhető modellünk szerepel, valós, naponta frissülő havidíjakkal.',
    ],
    extra: [
      { h: 'Hogyan működik a tartós bérlet?', p: [
        '<strong>1. Kiválasztod az autót</strong> — a lenti listából vagy a <a href="/autoink/#berelheto">bérelhető autóink</a> oldalon, változattal, színnel, futáskerettel.',
        '<strong>2. Ajánlatot kérsz</strong> — online, pár perc alatt. Visszahívunk, egyeztetjük a futamidőt és az átadás időpontját.',
        '<strong>3. Szerződés és kaució</strong> — a szerződést a Caradvance GmbH-val kötöd, a kaució a bérlet végén visszajár.',
        '<strong>4. Átveszed és vezetsz</strong> — a havidíjon kívül csak az üzemanyag vagy a töltés a tiéd. A részleteket a <a href="/berlesi-folyamat/">bérlési folyamat</a> és a <a href="/berlesi-feltetelek/">feltételek és kaució</a> oldal írja le.',
      ] },
      { h: 'Tartós bérlet vagy lízing?', p: [
        'Az <a href="/operativ-lizing/">operatív lízing</a> és a <a href="/finanszirozas-lizing/">pénzügyi lízing</a> jellemzően 3–5 éves kötöttség, gyakran önerővel és maradványérték-kockázattal. A tartós bérlet rövidebb és egyszerűbb: nincs önerő, nincs értékvesztés, és a díjban minden költség benne van. Ha az autót a végén a sajátodnak szeretnéd, a lízing a jobb út — ha a rugalmasság és a kiszámíthatóság a fontos, a tartós bérlet.',
      ] },
    ],
    faqs: [
      ['Mennyibe kerül a tartós bérlet?', 'Nálunk a nettó havidíj {min} Ft/hó-tól indul; a prémium SUV-ok jellemzően 410–460 ezer, a nagy SUV-ok 660 ezer forintnál kezdődnek. A pontos díj a modelltől, a változattól, a futamidőtől és a futáskerettől függ — a lenti lista valós, naponta frissülő díjakat mutat.'],
      ['Mit tartalmaz a havidíj?', 'A szervizt és karbantartást, a gépjárműadót, a kötelező gépjármű-felelősségbiztosítást és a cascót, valamint a nyári és téli gumiszettet. Az üzemanyag vagy a töltés a bérlőt terheli.'],
      ['Kell önerő a tartós bérlethez?', 'Nem. Csak egy egyszeri, visszajáró kauciót kérünk, modelltől függően {depmin}–{depmax} € között. Káresemény nélkül a bérlet végén teljes egészében visszajár.'],
      ['Mennyi a minimális futamidő?', 'A legtöbb modellnél 6 hónap, egyes modelleknél már 4–5 hónap. Ez jóval rövidebb kötöttség, mint az operatív lízing szokásos 3–4 éve.'],
      ['Magánszemélyként is bérelhetek tartósan?', 'Igen. Magánszemélyként a nettó havidíj a 19% német áfával növelt összeg — a bérelhető autók kártyáján a Cég / Magán kapcsolóval mindkettőt látod. Részletek: <a href="/tartos-berlet/maganszemelyeknek/">tartós bérlet magánszemélyeknek</a>.'],
      ['Cégként elszámolható a tartós bérlet díja?', 'A bérleti díj a vállalkozás költségei között elszámolható; az áfa és a cégautóadó kezeléséről egyeztess a könyvelőddel. Részletek: <a href="/tartos-berlet/cegeknek/">tartós bérlet cégeknek</a>.'],
      ['Mi történik a bérlet végén?', 'Visszaadod az autót, és ha nincs kár vagy túlfutás, a kaució visszajár. Nem kell eladnod, nem téged terhel az értékvesztés — és ha szeretnéd, azonnal új modellre válthatsz.'],
    ],
    related: ['cegeknek', 'maganszemelyeknek', 'elektromos', 'bmw', 'mercedes', 'audi'],
  },
  {
    key: 'cegeknek', path: '/tartos-berlet/cegeknek',
    title: 'Tartós bérlet cégeknek — céges autó {min} Ft/hó-tól | CarAdvance',
    description: 'Céges autó tartós bérletben: {n} új prémium modell {min} Ft/hó-tól (nettó), szervizzel, adóval, casco-val. Önerő nélkül, 6 hónaptól — a lízing rugalmas alternatívája.',
    eyebrow: 'Céges autóbérlés',
    h1a: 'Tartós bérlet cégeknek', h1b: 'céges autó önerő nélkül',
    sub: 'Céges autó vagy kis flotta egy fix, nettó havidíjért — {min} Ft/hó-tól, szervizzel, adóval, biztosítással, már 6 hónapos futamidőtől.',
    filter: () => true,
    intro: [
      'A <strong>tartós bérlet cégeknek</strong> a céges autó beszerzésének legrugalmasabb módja: nincs önerő, nincs lekötött tőke, nincs értékvesztési kockázat, és nem kell 3–4 évre elköteleződnöd, mint egy <a href="/operativ-lizing/">operatív lízingnél</a>. A nettó havidíj előre tervezhető, és minden üzemeltetési költséget tartalmaz.',
      'Az <strong>autóbérlés cégeknek</strong> nálunk egy autótól a kisebb flottáig működik: a kollégák választhatnak a modellek közül, mi pedig intézzük a szervizt, a gumicserét és a biztosítást — ez gyakorlatilag kiszervezett <strong>flottakezelés</strong>, külön díj nélkül.',
    ],
    points: [
      ['Nettó havidíj, tervezhető költség', 'A céges autó költsége egyetlen fix tétel. Nincs váratlan szervizszámla, gumicsere- vagy biztosítási díj.'],
      ['Nincs lekötött tőke', 'A céges autó lízing helyett a pénzed a működésben marad — csak egy visszajáró kaució kell.'],
      ['Rugalmas futamidő', 'Projekthez, új kollégához, szezonhoz: már 6 hónaptól, utána hosszabbíthatsz vagy válthatsz.'],
      ['Flottakezelés a díjban', 'Szerviz, gumi, biztosítás és kárügyintézés egy kézben — neked csak a sofőrt kell megadnod.'],
      ['Prémium márkák', 'BMW, Mercedes, Audi, Volkswagen, MINI és elektromos modellek — reprezentatív, új autók.'],
      ['Magyar kapcsolattartás', 'Egyetlen kapcsolattartó, magyar nyelven, gyors ajánlattal és átadással.'],
    ],
    extra: [
      { h: 'Céges autó: lízing, tartós bérlet vagy vásárlás?', p: [
        'A <strong>céges autó lízing</strong> (pénzügyi vagy <a href="/operativ-lizing/">operatív lízing</a>) általában 36–60 hónapra köt, önerővel vagy maradványértékkel. A vásárlás tőkét köt le és értékvesztéssel jár. A tartós bérlet ezzel szemben rövid távra is működik, és a havidíjban benne van minden üzemeltetési költség — ezért egyre több kis- és középvállalkozás választja.',
        'Az adózási szempontokat (áfa-levonás, cégautóadó, költségként való elszámolás) mindig egyeztesd a könyvelőddel; részletes összevetés: <a href="/blog/ceges-auto-operativ-lizing-tartos-berlet">céges autó: operatív lízing vagy tartós bérlet</a>.',
      ] },
    ],
    faqs: [
      ['Elszámolható a tartós bérlet díja a cégben?', 'A bérleti díj a vállalkozás költségei között elszámolható. Az áfa levonhatóságáról és a cégautóadóról a könyvelőd tud pontos választ adni a cég helyzete alapján.'],
      ['Mennyibe kerül egy céges autó tartós bérletben?', 'A nettó havidíj {min} Ft/hó-tól indul; egy prémium középkategóriás SUV (BMW X1, Mercedes GLB, Audi Q3) 410–420 ezer, egy üzleti limuzin vagy kombi 420–550 ezer forint körül van havonta.'],
      ['Több autót is bérelhetünk?', 'Igen, egy autótól a kisebb flottáig. Több autónál egyedi ajánlatot adunk, és a modellek akár eltérhetnek kollégánként.'],
      ['Ki vezetheti az autót?', 'A szerződésben megnevezett sofőrök. A pontos feltételeket az ajánlatban rögzítjük.'],
      ['Mennyi a kaució céges bérletnél?', 'Modelltől függően {depmin}–{depmax} € egyszeri, visszajáró kaució — önerő nincs.'],
    ],
    related: ['main', 'maganszemelyeknek', 'elektromos', 'bmw', 'mercedes'],
  },
  {
    key: 'maganszemelyeknek', path: '/tartos-berlet/maganszemelyeknek',
    title: 'Tartós bérlet magánszemélyeknek — új autó önerő nélkül | CarAdvance',
    description: 'Autó tartós bérlet magánszemélyeknek: új BMW, Mercedes, Audi, MINI havidíjjal, önerő és hitel nélkül, 6 hónaptól. Szerviz, adó, biztosítás és gumi a díjban.',
    eyebrow: 'Magánszemélyeknek',
    h1a: 'Tartós bérlet magánszemélyeknek', h1b: 'új autó hitel és önerő nélkül',
    sub: 'Vezess új prémium autót havidíjért — hitel, önerő és értékvesztés nélkül, már 6 hónapos futamidőtől. Szerviz, adó, biztosítás és gumi a díjban.',
    filter: () => true,
    intro: [
      'A <strong>tartós bérlet magánszemélyeknek</strong> azoknak ideális, akik új autóval szeretnének járni, de nem akarnak hitelt felvenni, önerőt fizetni vagy az autó eladásával és értékvesztésével foglalkozni. Egy fix havidíjat fizetsz, és ebben benne van a szerviz, az adó, a biztosítás és a nyári-téli gumi is.',
      'Magánszemélyként a havidíj a nettó díj 19%-os német áfával növelt összege — a <a href="/autoink/#berelheto">bérelhető autóink</a> kártyáján a <em>Magán</em> gombbal pontosan látod. A <strong>lízing magánszemélyeknek</strong> sokszor hosszú kötöttséget és önerőt jelent; a tartós bérletnél csak egy visszajáró kaució kell.',
    ],
    points: [
      ['Hitel és önerő nélkül', 'Nincs hitelbírálat-szerű önerő, nincs vételár — csak egy visszajáró kaució.'],
      ['Mindig új autó', 'Fél év vagy egy év után válthatsz másik, újabb modellre.'],
      ['Nincs eladási gond', 'Nem kell hirdetni, alkudni, vevőt keresni — visszaadod és kész.'],
      ['Kiszámítható költség', 'Szerviz, gumi, adó, biztosítás a díjban: csak tankolnod vagy töltened kell.'],
    ],
    faqs: [
      ['Mennyi a havidíj magánszemélyként?', 'A nettó havidíj plusz 19% német áfa. Például egy {min} Ft-os nettó díj magánszemélyként kb. {minp} Ft/hó. A pontos összeget minden autó kártyáján látod a Magán gombbal.'],
      ['Kell jövedelemigazolás vagy hitelbírálat?', 'Nem hitelt nyújtunk, hanem bérbe adunk. A szerződéshez szükséges dokumentumokat és a kauciót az ajánlatban pontosan megadjuk.'],
      ['Mi a különbség a lízinghez képest?', 'Lízingnél az autó a futamidő végén jellemzően a tiéd lesz, cserébe önerőt és hosszabb kötöttséget vállalsz. Tartós bérletnél nincs önerő és értékvesztés, a díjban minden költség benne van, és rövidebb a kötöttség.'],
      ['Elvihetem az autót külföldre?', 'Igen, az autó német rendszámos; a külföldi használat feltételeit a szerződés rögzíti.'],
    ],
    related: ['main', 'cegeknek', 'elektromos', 'mini', 'volkswagen'],
  },
  {
    key: 'elektromos', path: '/tartos-berlet/elektromos-auto',
    title: 'Elektromos autó tartós bérlet — {min} Ft/hó-tól | CarAdvance',
    description: 'Elektromos autó tartós bérletben: {n} új villanyautó (Audi e-tron, VW ID.7, Kia, CUPRA, Hyundai) {min} Ft/hó-tól, szervizzel, biztosítással, 6 hónaptól.',
    eyebrow: 'Elektromos autók',
    h1a: 'Elektromos autó tartós bérlet', h1b: 'villanyautó kockázat nélkül',
    sub: '{n} új elektromos modell {min} Ft/hó-tól (nettó) — akkumulátor-, értékvesztés- és technológiai kockázat nélkül, már 6 hónaptól.',
    filter: (r) => r.fuels.some((f) => /elektromos/i.test(f)),
    intro: [
      'Az <strong>elektromos autó tartós bérlet</strong> a legkisebb kockázatú módja annak, hogy villanyautóra válts: nem kell aggódnod az akkumulátor öregedése, a gyorsan fejlődő technológia vagy a használt elektromos autók árának esése miatt — a bérlet végén egyszerűen visszaadod az autót.',
      'A havidíjban benne van a szerviz, az adó, a biztosítás és a gumi; neked csak a töltés költsége marad, ami otthoni töltéssel jellemzően töredéke a benzinnek. Az elektromos autók finanszírozási lehetőségeiről a <a href="/blog/elektromos-auto-lizing-tamogatas">elektromos autó lízing és támogatás</a> cikkben írtunk.',
    ],
    faqs: [
      ['Melyik a legolcsóbb bérelhető elektromos autó?', 'Jelenleg a {cheapest}, {min} Ft/hó-tól (nettó).'],
      ['Mi a helyzet az akkumulátorral?', 'Tartós bérletnél az akkumulátor állapota és értéke nem a te kockázatod — a bérlet végén visszaadod az autót.'],
      ['Benne van a töltés a havidíjban?', 'Nem, a töltés (vagy üzemanyag) a bérlőt terheli. A szerviz, az adó, a biztosítás és a gumi a díjban van.'],
    ],
    related: ['main', 'cegeknek', 'audi', 'volkswagen'],
  },
  ...([
    ['bmw', 'BMW', 'bmw', 'BMW tartós bérlet: X1, X2, X3, X5, X6, 1-es, 3-as, 4-es, 5-ös'],
    ['mercedes', 'Mercedes-Benz', 'mercedes', 'Mercedes tartós bérlet: GLA, GLB, GLC, GLE, C- és E-osztály, CLA'],
    ['audi', 'Audi', 'audi', 'Audi tartós bérlet: A3, A5, A6, Q3, Q4 e-tron, Q5, Q6, S5, SQ5'],
    ['volkswagen', 'Volkswagen', 'vw', 'Volkswagen tartós bérlet: Polo, Golf, T-Roc, Tiguan, Tayron, Passat, ID.7'],
    ['mini', 'MINI', 'mini', 'MINI tartós bérlet: Cooper, Cabrio, Countryman'],
  ] as const).map(([key, name, b, lead]) => ({
    key, path: `/tartos-berlet/${key}`,
    title: `${name} tartós bérlet — {n} modell {min} Ft/hó-tól | CarAdvance`,
    description: `${name} tartós bérlet önerő nélkül: {n} új ${name} modell {min} Ft/hó-tól (nettó), szervizzel, adóval, biztosítással és gumikkal, már 6 hónaptól.`,
    eyebrow: `${name} tartós bérlet`,
    h1a: `${name} tartós bérlet`, h1b: `{n} modell, {min} Ft/hó-tól`,
    sub: `Új ${name} egy fix nettó havidíjért — szerviz, adó, biztosítás és gumi a díjban, önerő nélkül, már 6 hónapos futamidőtől.`,
    filter: isBrand(b),
    intro: [
      `A <strong>${name} tartós bérlet</strong> az új ${name} vezetésének legegyszerűbb módja: nem kell megvenned vagy lízingelned az autót, csak egy fix havidíjat fizetsz, amelyben a szerviz, a gépjárműadó, a biztosítás és a nyári-téli gumi is benne van. ${lead}.`,
      `Az alábbi lista a jelenleg bérelhető ${name} modelljeinket mutatja, naponta frissülő havidíjakkal. Minden modellnél megnézheted a változatokat, színeket, futáskeretet és az elérhetőséget, és pár perc alatt ajánlatot kérhetsz.`,
    ],
    faqs: [
      [`Mennyibe kerül egy ${name} tartós bérlete?`, `A legkedvezőbb ${name} modell, a {cheapest} nettó havidíja {min} Ft/hó-tól indul; a legdrágább bérelhető ${name} modell {max} Ft/hó körül van. A díjak 6 hónapos futamidőre és havi kb. 4000 km futáskeretre vonatkoznak.`],
      [`Mit tartalmaz a ${name} havidíja?`, 'A szervizt, a gépjárműadót, a kötelező biztosítást és a cascót, valamint a nyári-téli gumiszettet. Az üzemanyag vagy a töltés a bérlőt terheli.'],
      ['Mennyi a kaució?', `A ${name} modelleknél {depmin}–{depmax} € egyszeri, visszajáró kaució — önerő nincs.`],
      ['Magánszemélyként is bérelhetek?', 'Igen. Magánszemélyként a nettó díj a 19% német áfával növelt összeg; cégként a nettó díj érvényes.'],
    ] as [string, string][],
    related: ['main', 'cegeknek', ...(['bmw', 'mercedes', 'audi', 'volkswagen', 'mini'].filter((k) => k !== key).slice(0, 3))],
  } as TbVariant)),
];

export const VARIANT_LABEL: Record<string, string> = {
  main: 'Tartós bérlet — összes autó', cegeknek: 'Tartós bérlet cégeknek', maganszemelyeknek: 'Tartós bérlet magánszemélyeknek',
  elektromos: 'Elektromos autó tartós bérlet', bmw: 'BMW tartós bérlet', mercedes: 'Mercedes tartós bérlet', audi: 'Audi tartós bérlet',
  volkswagen: 'Volkswagen tartós bérlet', mini: 'MINI tartós bérlet',
};

export function getVariant(key: string): TbVariant { return VARIANTS.find((v) => v.key === key)!; }

// <title> és meta leírás kitöltése ({min}, {n})
export function metaOf(key: string): { title: string; description: string } {
  const v = getVariant(key);
  const cars = allRentals().filter(v.filter);
  const min = cars.length ? cars[0].huf : 0;
  const f = (s: string) => s.replace(/\{min\}/g, fmt(min)).replace(/\{n\}/g, String(cars.length));
  return { title: f(v.title), description: f(v.description) };
}
