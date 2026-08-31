// Build lepes: a berlesi oldalak atpozicionalasa a "tartos berlet" kulcsszavakra.
//
// MIERT
// A termek amit arulunk: havidijas, hosszu tavu berlet 2 000/3 000 km kerettel,
// 1 790 EUR/ho-tol, kaucioval. Ezt magyarul NEM "autoberles"-nek hivjak (az napi
// kolcsonzesi szandek: repter, hetvege, olcso kisauto), hanem TARTOS BERLET-nek.
//
// Ahrefs (hu, 2026.08.31.), kereses/ho es nehezseg:
//   tartos berlet 400 (KD 29) . tartos berlet auto 400 . tartos berlet cegeknek 250
//   auto tartos berlet 200 . hosszutavu autoberles 200 . tartos berlet maganszemelyeknek 150
//   ceges autoberles 150 (a legdragabb kattintas: 0,90 USD) . operativ lizing 100 (KD 0)
//   sportauto berles 100 (KD 3) . luxusauto berles 50 (KD 2)
// Osszesen ~2 000 kereses/ho, nagyreszt 0-29 nehezseggel.
// A harom berlesi oldalon a "tartos berlet" kifejezes eddig NULLASZOR szerepelt.
//
// MIT TESZ
// Oldalankent pontos, teljes-string cserek a dist/-ben: title, meta description,
// H1 es a fo H2-k. A body szoveghez nem nyul.
//
// BIZTONSAG
// - csak a felsorolt harom oldalt erinti
// - minden szabaly TELJES, egyedi string csere (nem regex, nem szotoves csere:
//   a magyar toldalekolas miatt a vak csere mondatokat torne szet)
// - minden szabalyrol logol, hogy illeszkedett-e; ami nem illeszkedett, azt
//   kiirja FIGYELEM-mel (igy eszrevesszuk, ha a forras kozben megvaltozott)
// - idempotens: masodszorra mar nincs mit cserelni
// - barmi hiba eseten csak logol es exit 0 - a buildet nem allitja meg
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

const RULES = {
  // ---- Tartos berlet, altalanos + maganszemelyek -------------------------
  'berles-elonyei': [
    ['<title>A bérlés előnyei — prémium autóbérlés | CarAdvance</title>',
     '<title>Autó tartós bérlet magánszemélyeknek és cégeknek | CarAdvance</title>'],
    ['Prémium német autók kedvező bérleti feltételekkel és alacsony kaucióval — akár félévente új modell, szervizköltség és adók nélkül, nyári-téli gumival.',
     'Tartós bérlet prémium német autókra, fix havidíjjal: szerviz, adó, biztosítás és gumi az árban. Akár félévente új modell, alacsony kaucióval, 2 000 vagy 3 000 km havi kerettel.'],
    ['A bérlés előnyei —', 'A tartós bérlet előnyei —'],
    ['Miért érdemes tőlünk bérelni?', 'Miért éri meg a tartós bérlet?'],
    ['Prémium autóbérlés Magyarországon — miért éri meg?',
     'Tartós autóbérlet Magyarországon — kinek éri meg?'],
  ],

  // ---- Tartos berlet cegeknek + ceges autoberles -------------------------
  'berlesi-folyamat': [
    ['<title>A bérlési folyamat — prémium autóbérlés lépésről lépésre | CarAdvance</title>',
     '<title>Tartós bérlet cégeknek — a folyamat lépésről lépésre | CarAdvance</title>'],
    ['Hogyan bérelhetsz prémium német autót nálunk? Tíz lépés a kiválasztástól a kulcsrakész átadásig — ajánlat, előszerződés, kaució, beszerzés és szállítás, kauciótáblázattal.',
     'Céges autóbérlés és tartós bérlet lépésről lépésre: tíz lépés a kiválasztástól a kulcsrakész átadásig — ajánlat, előszerződés, kaució, beszerzés és szállítás, kauciótáblázattal.'],
    ['Hogyan működik a bérlés? —', 'Hogyan működik a tartós bérlet? —'],
    ['A bérlési folyamat, lépésről lépésre', 'A tartós bérlet folyamata, lépésről lépésre'],
    ['Gyakori kérdések a bérlésről', 'Gyakori kérdések a tartós bérletről'],
  ],

  // ---- Hosszutavu autoberles + operativ lizing ---------------------------
  'berles-gyakori-kerdesek': [
    ['<title>Gyakori kérdések — prémium autóbérlés | CarAdvance</title>',
     '<title>Tartós bérlet, hosszútávú autóbérlés — GYIK | CarAdvance</title>'],
    ['Gyakori kérdések a prémium autóbérlésről: kaució és feltételek, all-inclusive költségek (szerviz, adó, gumi), autóválasztás, céges bérlés és a bérlés folyamata.',
     'Gyakori kérdések a tartós bérletről és a hosszútávú autóbérlésről: kaució és feltételek, all-inclusive havidíj (szerviz, adó, gumi), km-keret, céges tartós bérlet és operatív lízing.'],
    ['a prémium autóbérlésről', 'a tartós bérletről és a hosszútávú autóbérlésről'],
  ],
};

try {
  if (!fs.existsSync(DIST)) { console.log('seo-copy: nincs dist/ - kihagyva'); process.exit(0); }

  let okAll = 0, missAll = 0;
  for (const [slug, rules] of Object.entries(RULES)) {
    const file = path.join(DIST, slug, 'index.html');
    if (!fs.existsSync(file)) { console.log('seo-copy: FIGYELEM - nincs ' + file); missAll += rules.length; continue; }
    let h = fs.readFileSync(file, 'utf8');
    const before = h;
    const miss = [];
    for (const [from, to] of rules) {
      if (h.includes(from)) { h = h.split(from).join(to); okAll++; }
      else if (h.includes(to)) { okAll++; }           // mar atirva (idempotens)
      else { miss.push(from.slice(0, 46)); missAll++; }
    }
    if (h !== before) fs.writeFileSync(file, h);
    console.log('seo-copy: /' + slug + '/ - ' + (rules.length - miss.length) + '/' + rules.length + ' szabaly rendben'
      + (miss.length ? ' | FIGYELEM, nem illeszkedett: ' + miss.join(' // ') : ''));
  }
  console.log('seo-copy: osszesen ' + okAll + ' rendben, ' + missAll + ' nem illeszkedett');
} catch (e) {
  console.log('seo-copy: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
