// Build lepes: az auto-aloldalak (49 db) SEO- es strukturalt-adat retege.
//
// MIERT A BUILDBEN ES NEM A SHEETBEN
// Az eladott autok lapja NEM tunik el, tehat a keszlet-korpusz folyamatosan no
// (ma 43 aktiv + 6 eladott). Kezzel megirt SEO-szoveg csak a mai 49-et fedne le;
// ez a lepes a mait is es minden ezutan erkezo/elkelo autot ugyanugy kezeli.
//
// MIT JAVIT (eles hibak 2026.09.01-en)
// 1. "163 LE, ." - a leirasban ures mezo utan lógó vesszo+pont
// 2. "17900" - kilometer mertekegyseg es ezres-elvalaszto nelkul (a leirasban is)
// 3. title: nem tartalmazza az "Eladó" szot, pedig a magyar keresesek igy indulnak
//    (bmw x5 eladó 250/ho, eladó bmw x6 150/ho, porsche 911 eladó 150/ho - mind KD 0)
// 4. JSON-LD: hianyzik a model, evjarat, valto, hajtas, karosszeria, motorteljesitmeny
//    - ezeket olvassak az AI-asszisztensek es a Google jarmu-ertelmezese
//
// HONNAN JON AZ ADAT
// A lapon mar ott van egy `Car` JSON-LD (nev, marka, uzemanyag, evjarat, km, ar) -
// ez a biztos forras. A "Muszaki adatok" cimke/ertek parokbol (Valto, Hajtas,
// Karosszeria, Teljesitmeny) egeszitjuk ki, ha az adott autonal léteznek.
//
// BIZTONSAG
// Csak a dist/auto/<slug>/index.html lapokat erinti. A horgonyok szerkezetiek
// (<title>, meta description, og:*, a `Car` ld+json blokk) - nem fuggenek
// Astro-hashtol vagy szovegtol. Hiba eseten logol es exit 0.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const BRAND_SUFFIX = ' | CarAdvance';
const TITLE_MAX = 65;
const DESC_MAX = 158;

const dec = (s) => String(s == null ? '' : s)
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const attr = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (s) => { const n = String(s == null ? '' : s).replace(/[^\d]/g, ''); return n ? parseInt(n, 10) : null; };
const huf = (n) => n == null ? null : n.toLocaleString('hu-HU').replace(/ /g, ' ');

// A magyar kereso az "Eladó <modell>" alakot hasznalja - ez all a title elejen.
// A MODELLNEV a legfontosabb: sose vagjuk meg. Ha nincs hely, eloszor a km,
// aztan az evjarat esik ki - egy csonkolt "M Sport P…" semmit nem er.
function buildTitle(f) {
  const lead = (f.sold ? 'Elkelt ' : 'Eladó ');
  const base = lead + f.name + BRAND_SUFFIX;
  const withYear = f.year ? lead + f.name + ' · ' + f.year + BRAND_SUFFIX : base;
  const withAll = (f.year && f.km != null)
    ? lead + f.name + ' · ' + f.year + ' · ' + huf(f.km) + ' km' + BRAND_SUFFIX
    : withYear;
  if (withAll.length <= TITLE_MAX) return withAll;
  if (withYear.length <= TITLE_MAX) return withYear;
  return base;
}

function buildDesc(f) {
  const facts = [];
  if (f.year) facts.push(f.year);
  if (f.km != null) facts.push(huf(f.km) + ' km');
  if (f.powerHp) facts.push(f.powerHp + ' LE');
  if (f.fuelHu) facts.push(f.fuelHu);
  if (f.transmission) facts.push(f.transmission);
  // A mondatokat egeszben tartjuk: inkabb elhagyunk egyet, mint hogy szo kozepen vagjunk.
  const head = (f.sold ? 'Elkelt: ' : 'Eladó ') + f.name + (facts.length ? ', ' + facts.join(', ') : '') + '.';
  const mid = f.sold
    ? ' Hasonlót keresel? Nézd meg az aktuális készletet.'
    : (f.priceHuf ? ' Ára ' + huf(f.priceHuf) + ' Ft.' : ' Ár kérésre.');
  const tail = ' Ellenőrzött előéletű német import a CarAdvance-től.';
  if ((head + mid + tail).length <= DESC_MAX) return head + mid + tail;
  if ((head + mid).length <= DESC_MAX) return head + mid;
  if (head.length <= DESC_MAX) return head;
  return head.slice(0, DESC_MAX - 1).replace(/[\s,;]+$/, '') + '…';
}

const FUEL_HU = { diesel: 'dízel', petrol: 'benzin', gasoline: 'benzin', electric: 'elektromos', hybrid: 'hibrid' };
const BODY_SCHEMA = { 'suv': 'SUV', 'terepjáró': 'SUV', 'kombi': 'Station wagon', 'limuzin': 'Sedan',
  'sedan': 'Sedan', 'kabrió': 'Convertible', 'coupé': 'Coupe', 'coupe': 'Coupe', 'ferdehátú': 'Hatchback' };
// A schema.org zart ertekkeszletet var; a magyar szoveg itt keveset er.
const DRIVE_SCHEMA = {
  'összkerék': 'https://schema.org/AllWheelDriveConfiguration',
  'összkerékhajtás': 'https://schema.org/AllWheelDriveConfiguration',
  '4x4': 'https://schema.org/FourWheelDriveConfiguration',
  'elsőkerék': 'https://schema.org/FrontWheelDriveConfiguration',
  'hátsókerék': 'https://schema.org/RearWheelDriveConfiguration' };
const TRANS_SCHEMA = { 'automata': 'AutomaticTransmission', 'manuális': 'ManualTransmission' };

function modelOf(name, brand) {
  let n = name.replace(new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
  const m = n.match(/^(X[1-7]|iX[13]?|i[3-8]|Q[1-8]|A[1-8]|G\s?\d{2,3}|\d{3}|[A-Za-z0-9]+)/);
  return m ? m[1].trim() : null;
}

// A "Muszaki adatok" cimke/ertek parok a lap szovegebol.
function specPairs(html) {
  const txt = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
  const lines = txt.split('\n').map((s) => s.trim()).filter((s) => s && s.length < 60);
  const want = ['Váltó', 'Hajtás', 'Karosszéria', 'Teljesítmény', 'Kilométer', 'Évjárat', 'Üzemanyag'];
  const out = {};
  for (let i = 0; i < lines.length - 1; i++) {
    if (want.includes(lines[i]) && !out[lines[i]]) {
      const v = lines[i + 1];
      if (v && !want.includes(v)) out[lines[i]] = v;
    }
  }
  return out;
}

function enrich(car, f) {
  const c = { ...car };
  if (f.model) c.model = f.model;
  if (f.year) c.vehicleModelDate = String(f.year);
  if (f.transmission) c.vehicleTransmission = TRANS_SCHEMA[f.transmission.toLowerCase()] || f.transmission;
  if (f.drive) c.driveWheelConfiguration = DRIVE_SCHEMA[f.drive.toLowerCase()] || f.drive;
  if (f.bodySchema) c.bodyType = f.bodySchema;
  if (f.powerHp) {
    c.vehicleEngine = { '@type': 'EngineSpecification',
      enginePower: { '@type': 'QuantitativeValue', value: f.powerHp, unitCode: 'BHP' } };
  }
  c.description = f.desc;
  if (c.offers && typeof c.offers === 'object') {
    const o = { ...c.offers };
    if (o.price && !o.priceValidUntil && !f.sold) {
      const d = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
      o.priceValidUntil = d;
    }
    c.offers = o;
  }
  return c;
}

let nOk = 0, nSkip = 0, nSold = 0;
const report = [];

try {
  const dir = path.join(DIST, 'auto');
  if (!fs.existsSync(dir)) { console.log('seo-cars: nincs dist/auto - kihagyva'); process.exit(0); }

  for (const slug of fs.readdirSync(dir)) {
    const file = path.join(dir, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    let h = fs.readFileSync(file, 'utf8');

    // a Car JSON-LD blokk megkeresese
    const ldRe = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g;
    let m, carRaw = null, carObj = null, carFull = null;
    while ((m = ldRe.exec(h))) {
      try { const o = JSON.parse(m[1]); if (o && o['@type'] === 'Car') { carRaw = m[1]; carObj = o; carFull = m[0]; break; } } catch (e) {}
    }
    if (!carObj) { nSkip++; report.push(slug + ' (nincs Car JSON-LD)'); continue; }

    const sp = specPairs(h);
    const brand = (carObj.brand && carObj.brand.name) || '';
    const name = dec(carObj.name);
    const f = {
      name, brand,
      model: modelOf(name, brand),
      year: carObj.productionDate ? String(carObj.productionDate).slice(0, 4) : (sp['Évjárat'] || '').slice(-4) || null,
      km: (carObj.mileageFromOdometer && carObj.mileageFromOdometer.value) != null
        ? Number(carObj.mileageFromOdometer.value) : num(sp['Kilométer']),
      powerHp: num(sp['Teljesítmény']),
      fuelHu: FUEL_HU[String(carObj.fuelType || '').toLowerCase()] || (sp['Üzemanyag'] ? sp['Üzemanyag'].toLowerCase() : null),
      transmission: sp['Váltó'] || null,
      drive: sp['Hajtás'] || null,
      bodySchema: sp['Karosszéria'] ? (BODY_SCHEMA[sp['Karosszéria'].toLowerCase()] || sp['Karosszéria']) : null,
      priceHuf: carObj.offers && carObj.offers.price ? Number(carObj.offers.price) : null,
      sold: /SoldOut/i.test(JSON.stringify(carObj.offers || {})),
    };
    if (f.sold) nSold++;

    const title = buildTitle(f);
    f.desc = buildDesc(f);

    h = h.replace(/<title>[\s\S]*?<\/title>/, '<title>' + attr(title) + '</title>');
    h = h.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, '$1' + attr(f.desc) + '$2');
    h = h.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, '$1' + attr(title) + '$2');
    h = h.replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, '$1' + attr(f.desc) + '$2');

    const enriched = enrich(carObj, f);
    h = h.replace(carFull, carFull.replace(carRaw, '\n' + JSON.stringify(enriched, null, 0) + '\n'));

    fs.writeFileSync(file, h);
    nOk++;
  }

  console.log('seo-cars: ' + nOk + ' auto-aloldal frissitve (ebbol ' + nSold + ' eladott)'
    + (nSkip ? ' | FIGYELEM, kihagyva ' + nSkip + ': ' + report.slice(0, 5).join(', ') : ''));
} catch (e) {
  console.log('seo-cars: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
