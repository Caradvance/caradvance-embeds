#!/usr/bin/env node
/**
 * Megosztási (WhatsApp / Facebook / Google) címek, leírások és képek — minden oldalon, minden nyelven (Marc, 2026-11-03)
 *
 * A build végén fut (a km-note.mjs után), a kész dist oldalakon:
 *  1) Gyűjtőoldal (/autoink/ és a nyelvi/piaci megfelelői: /auta/, /vozy/, /samochody/, /fahrzeuge/, /vehicules/,
 *     /veicoli/, /vehiculos/): a cím és a leírás eladó ÉS bérelhető autókról szól (az oldal #berelheto füle a bérlés),
 *     a legalacsonyabb bérleti havidíjjal — nem „Autos zum Kauf / Cars for sale”. A magyar /autoink/-ot a seo-fix.mjs írja.
 *  2) Autó-adatlapok (/auto/…) a .sk / .cz / .pl nyelvi változatain (en, de, hu): a szlovák/cseh forrásból maradt
 *     „Na predaj … Cena bez DPH …” cím és leírás az oldal nyelvén (For sale … Price excl. VAT … / Zu verkaufen … ).
 *  3) Általános megosztási kép (og:image): piac + nyelv szerinti kép (/l10n/og/og-<piac>-<nyelv>.jpg) a helyes nyelvű
 *     szöveggel, logóval és domainnel (korábban pl. a .pl, .ch, .eu oldalakon a szlovák kép jelent meg).
 *  4) .cz en/de: „BMW řady 3” → „BMW 3 Series” / „BMW 3er” a címekben/leírásokban.
 * Csak a <title> és a description / og:* / twitter:* metaadatok változnak. Többszöri futtatásra ugyanazt adja. Hibára exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const IMG_HOST = 'https://www.caradvance.hu';
const FX_CHF = (() => { try { return +JSON.parse(fs.readFileSync('ch-site-config.json', 'utf8')).fxCHF || 0.9247; } catch (e) { return 0.9247; } })();

// piac → [gyökérmappa a dist-ben, alapnyelv, további nyelvi mappák]
const MARKETS = { hu: ['', 'hu', ['en', 'de', 'fr', 'uk', 'zh']], sk: ['sk', 'sk', ['en', 'de', 'hu']], cz: ['cs', 'cs', ['en', 'de']],
  pl: ['pl', 'pl', ['en', 'de']], ch: ['ch', 'de', ['fr', 'it', 'en']], eu: ['eu', null, ['de', 'fr', 'it', 'es']] };
const HUBS = new Set(['autoink', 'auta', 'vozy', 'samochody', 'fahrzeuge', 'vehicules', 'veicoli', 'vehiculos']);

// ---- 3) megosztási képek (public/l10n/og/) ----
const OGIMG = { hu: ['fr', 'uk', 'zh'], sk: ['en', 'de', 'hu'], cz: ['en', 'de'], pl: ['pl', 'en', 'de'], ch: ['de', 'fr', 'it', 'en'], eu: ['de', 'fr', 'it', 'es'] };
const ALT = {
  en: 'CarAdvance – premium cars from Germany: long-term rental, cars for sale, new car orders',
  de: 'CarAdvance – Premium-Autos: Langzeitmiete, Autos zum Kauf, Neuwagen-Bestellung',
  hu: 'CarAdvance – prémium autók Németországból: tartós bérlet, eladó autók, új autó rendelés',
  fr: 'CarAdvance – voitures premium d’Allemagne : location longue durée, vente, voitures neuves',
  it: 'CarAdvance – auto premium dalla Germania: noleggio a lungo termine, vendita, auto nuove',
  es: 'CarAdvance – coches premium de Alemania: renting a largo plazo, venta, coches nuevos',
  uk: 'CarAdvance – преміум-авто з Німеччини: довгострокова оренда, продаж, нові авто',
  zh: 'CarAdvance – 德国高端汽车：长期租赁、车辆销售、新车订购',
  pl: 'CarAdvance – samochody premium z Niemiec: wynajem długoterminowy, sprzedaż, nowe auta',
};
const GENERIC_OG = /^https?:\/\/(?:www\.)?caradvance\.hu\/(?:l10n\/[a-z-]+\/)?og-caradvance(?:-[a-z]{2})?\.jpg$/;

// ---- 1) gyűjtőoldal szövegei; {p} = legalacsonyabb havidíj ----
const fmtEur = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
const fmtChf = (n) => 'CHF ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
const LEAD = {
  en: 'Rent or buy premium cars from Germany: BMW, Mercedes-Benz, Audi, MINI and more.',
  de: 'Premium-Autos mieten oder kaufen: BMW, Mercedes-Benz, Audi, MINI und weitere Marken.',
  fr: 'Louez ou achetez une voiture premium : BMW, Mercedes-Benz, Audi, MINI et d’autres marques.',
  it: 'Noleggio o acquisto di auto premium: BMW, Mercedes-Benz, Audi, MINI e altri marchi.',
  es: 'Alquila o compra un coche premium: BMW, Mercedes-Benz, Audi, MINI y otras marcas.',
  uk: 'Оренда або купівля преміум-авто з Німеччини: BMW, Mercedes-Benz, Audi, MINI та інші марки.',
  zh: '租赁或购买来自德国的高端汽车：BMW、Mercedes-Benz、Audi、MINI 等品牌。',
  sk: 'Prenájom alebo kúpa prémiového auta z Nemecka: BMW, Mercedes-Benz, Audi, MINI a ďalšie značky.',
  cs: 'Pronájem nebo koupě prémiového vozu z Německa: BMW, Mercedes-Benz, Audi, MINI a další značky.',
  pl: 'Wynajem lub zakup samochodu premium z Niemiec: BMW, Mercedes-Benz, Audi, MINI i inne marki.',
  hu: 'Eladó és bérelhető prémium autók Németországból: BMW, Mercedes-Benz, Audi, MINI és más márkák.',
};
const RENT = { // [ár, ÁFA-megjegyzés] → mondat; np: ár nélküli változat
  en: (p, v) => `Long-term rental from ${p}/month (${v}), with a transparent deposit.`,
  de: (p, v) => `Langzeitmiete ab ${p}/Monat (${v}), mit transparenter Kaution.`,
  fr: (p, v) => `Location longue durée dès ${p}/mois ${v}, avec une caution transparente.`,
  it: (p, v) => `Noleggio a lungo termine da ${p}/mese ${v}, con deposito trasparente.`,
  es: (p, v) => `Renting a largo plazo desde ${p}/mes ${v}, con fianza transparente.`,
  uk: (p, v) => `Довгострокова оренда від ${p}/міс. ${v}, з прозорою заставою.`,
  zh: (p, v) => `长期租赁每月 ${p} 起（${v}），押金透明。`,
  sk: (p, v) => `Dlhodobý prenájom od ${p}/mes. ${v}, s transparentnou kauciou.`,
  cs: (p, v) => `Dlouhodobý pronájem od ${p}/měs. ${v}, s transparentní kaucí.`,
  pl: (p, v) => `Wynajem długoterminowy od ${p}/mies. ${v}, z przejrzystą kaucją.`,
  hu: (p, v) => `Tartós bérlet ${p}/hó-tól (${v}), átlátható kaucióval.`,
};
const RENT_NP = {
  en: 'Long-term rental from 6 months, with a transparent deposit.', de: 'Langzeitmiete ab 6 Monaten, mit transparenter Kaution.',
  fr: 'Location longue durée dès 6 mois, avec une caution transparente.', uk: 'Довгострокова оренда від 6 місяців, з прозорою заставою.',
  zh: '6 个月起长期租赁，押金透明。', hu: 'Tartós bérlet 6 hónaptól, átlátható kaucióval.',
};
const VAT = { en: 'excl. VAT', de: 'zzgl. MwSt.', fr: 'HT', it: 'IVA esclusa', es: 'sin IVA', uk: 'без ПДВ', zh: '不含增值税', sk: 'bez DPH', cs: 'bez DPH', pl: 'netto', hu: 'nettó' };
const VAT_CH = { de: 'ohne MWST', fr: 'HT', it: 'IVA esclusa', en: 'excl. VAT' };
const HUB_T = {
  en: 'Premium cars to rent or buy – long-term rental | CarAdvance',
  de: 'Premium-Autos mieten oder kaufen – Langzeitmiete | CarAdvance',
  fr: 'Voitures premium à louer ou à acheter | CarAdvance',
  it: 'Auto premium a noleggio o in vendita | CarAdvance',
  es: 'Coches premium en renting o venta | CarAdvance',
  uk: 'Преміум-авто в оренду та на продаж | CarAdvance',
  zh: '高端汽车租赁与销售 – 长期租赁 | CarAdvance',
  sk: 'Prémiové autá na prenájom a predaj | CarAdvance',
  cs: 'Prémiové vozy k pronájmu i na prodej | CarAdvance',
  pl: 'Samochody premium na wynajem i sprzedaż | CarAdvance',
  hu: 'Eladó és bérelhető prémium autók – tartós bérlet | CarAdvance',
};

// ---- 2) autó-adatlapok: szlovák/cseh/lengyel forrás → oldal nyelve ----
const SALE_PRE = /^(?:Na predaj|Na prodej|Na sprzedaż):?\s+/;
const SALE_SUF = /\s+(?:na predaj|na prodej|na sprzedaż)(?=$|[,·|])/;
const SOLD_PRE = /^(?:Predané|Prodáno|Sprzedane|Sprzedany):\s*/;
const CAR = {
  en: { sale: (n) => `${n} for sale`, saleD: (n) => `For sale: ${n}`, sold: (n) => `Sold: ${n}`, hp: 'hp',
    net: (p) => `Price excl. VAT ${p}.`, price: (p) => `Price ${p}.`, verified: 'Verified import from Germany by CarAdvance.',
    history: 'Imported from Germany with a verified history by CarAdvance.', similar: 'Looking for something similar? See our current stock.',
    fuel: { diesel: 'diesel', benzin: 'petrol', hybrid: 'hybrid', elektro: 'electric', plugin: 'plug-in hybrid' }, gear: { auto: 'automatic', man: 'manual' } },
  de: { sale: (n) => `Zu verkaufen: ${n}`, saleD: (n) => `Zu verkaufen: ${n}`, sold: (n) => `Verkauft: ${n}`, hp: 'PS',
    net: (p) => `Preis ohne MwSt. ${p}.`, price: (p) => `Preis ${p}.`, verified: 'Geprüfter Import aus Deutschland von CarAdvance.',
    history: 'Import aus Deutschland mit geprüfter Vorgeschichte von CarAdvance.', similar: 'Suchen Sie etwas Ähnliches? Sehen Sie sich unser aktuelles Angebot an.',
    fuel: { diesel: 'Diesel', benzin: 'Benzin', hybrid: 'Hybrid', elektro: 'Elektro', plugin: 'Plug-in-Hybrid' }, gear: { auto: 'Automatik', man: 'Schaltgetriebe' } },
  hu: { sale: (n) => `Eladó ${n}`, saleD: (n) => `Eladó: ${n}`, sold: (n) => `Eladva: ${n}`, hp: 'LE',
    net: (p) => `Nettó ár (áfa nélkül): ${p}.`, price: (p) => `Ár: ${p}.`, verified: 'Ellenőrzött import Németországból a CarAdvance-től.',
    history: 'Németországi import ellenőrzött előélettel a CarAdvance-től.', similar: 'Valami hasonlót keresel? Nézd meg aktuális kínálatunkat.',
    fuel: { diesel: 'dízel', benzin: 'benzin', hybrid: 'hibrid', elektro: 'elektromos', plugin: 'plug-in hibrid' }, gear: { auto: 'automata', man: 'manuális' } },
};
const FUEL_SRC = [[/^(?:plug-in hybrid|plug-in hybridný|plug-in hybridní|hybryda plug-in)$/i, 'plugin'], [/^(?:diesel|nafta|dízel)$/i, 'diesel'],
  [/^(?:benzín|benzyna|benzin)$/i, 'benzin'], [/^(?:hybrid|hybridný|hybridní|hybryda)$/i, 'hybrid'], [/^(?:elektro|elektrický|elektrický pohon|elektryczny|elektromos)$/i, 'elektro']];
const GEAR_SRC = [[/^(?:automat|automatická|automatický|automatyczna|automatická převodovka)$/i, 'auto'], [/^(?:manuál|manuálna|manuální|manualna|manuálny)$/i, 'man']];
const SENT = [ // forrásmondat → kulcs (ár: $1)
  [/^Cena bez DPH (.+)\.$/, 'net'], [/^Cena netto (.+)\.$/, 'net'], [/^Cena (.+)\.$/, 'price'],
  [/^(?:Preverený|Prověřený|Sprawdzony) dovoz z (?:Nemecka|Německa) od CarAdvance\.$/, 'verified'], [/^Sprawdzony import z Niemiec od CarAdvance\.$/, 'verified'],
  [/^Dovoz z (?:Nemecka|Německa) s (?:overenou históriou|ověřenou historií) od CarAdvance\.$/, 'history'], [/^Import z Niemiec ze sprawdzoną historią od CarAdvance\.$/, 'history'],
  [/^(?:Hľadáte niečo podobné\? Pozrite si našu aktuálnu ponuku|Hledáte něco podobného\? Podívejte se na naši aktuální nabídku|Szukasz czegoś podobnego\? Zobacz naszą aktualną ofertę)\.$/, 'similar'],
];
const FOREIGN = /\b(?:na predaj|na prodej|na sprzedaż|predané|prodáno|cena bez dph|cena netto|preverený|prověřený|dovoz z|hľadáte|hledáte)\b|[ľťďňěřů]/i;
const NAME_FIX = { en: [[/Panoráma/g, 'Panorama']], de: [[/Panoráma/g, 'Panorama']], hu: [] };

function specs(lang, s) {
  const C = CAR[lang];
  return s.split(/,\s+/).map((t) => {
    const x = t.trim();
    let m = x.match(/^(\d[\d\s .]*)\s?(?:k|KM|LE|PS|hp)$/); if (m) return `${m[1].trim()} ${C.hp}`;
    for (const [re, k] of FUEL_SRC) if (re.test(x)) return C.fuel[k];
    for (const [re, k] of GEAR_SRC) if (re.test(x)) return C.gear[k];
    return x;
  }).join(', ');
}
function carTitle(lang, t) {
  const C = CAR[lang];
  const suf = (t.match(/\s\|\s*CarAdvance$/) || [''])[0]; let b = suf ? t.slice(0, -suf.length) : t;
  const parts = b.split(/\s·\s/); let head = parts[0]; const rest = parts.slice(1).length ? ' · ' + parts.slice(1).join(' · ') : '';
  const fix = (n) => NAME_FIX[lang].reduce((a, [re, r]) => a.replace(re, r), n.replace(/\s+$/, ''));
  if (SOLD_PRE.test(head)) return C.sold(fix(head.replace(SOLD_PRE, ''))) + rest + suf;
  if (SALE_PRE.test(head)) return C.sale(fix(head.replace(SALE_PRE, ''))) + rest + suf;
  if (SALE_SUF.test(head)) return C.sale(fix(head.replace(SALE_SUF, ''))) + rest + suf;
  return null;
}
function carDesc(lang, d) {
  const C = CAR[lang]; const fix = (n) => NAME_FIX[lang].reduce((a, [re, r]) => a.replace(re, r), n);
  let kind = null, body = d;
  if (SOLD_PRE.test(body)) { kind = 'sold'; body = body.replace(SOLD_PRE, ''); }
  else if (SALE_PRE.test(body)) { kind = 'sale'; body = body.replace(SALE_PRE, ''); }
  else { const m = body.match(/^(.+?)\s+(?:na predaj|na prodej|na sprzedaż),\s*/); if (m) { kind = 'sale'; body = m[1] + ', ' + body.slice(m[0].length); } }
  if (!kind) return null;
  // név + adatok az első „. ” mondathatárig (a név tartalmazhat pontot/vesszőt: az adatok az évszámnál kezdődnek)
  const m = body.match(/^(.+?),\s*((?:19|20)\d\d\b.*?)\.(?:\s+|$)([\s\S]*)$/) || body.match(/^(.+?),\s*(\d[\d\s .,]*\s?km\b.*?)\.(?:\s+|$)([\s\S]*)$/);
  if (!m) return null;
  const name = fix(m[1].trim());
  let out = (kind === 'sold' ? C.sold(name) : C.saleD(name)) + ', ' + specs(lang, m[2]) + '.';
  const sents = (m[3] || '').match(/[^.?!]+(?:\?[^.?!]*)?[.?!]+/g) || [];
  for (const raw of sents) {
    const s = raw.trim(); if (!s) continue;
    let done = false;
    for (const [re, k] of SENT) {
      const x = s.match(re); if (!x) continue;
      out += ' ' + (typeof C[k] === 'function' ? C[k](x[1]) : C[k]); done = true; break;
    }
    if (!done && !FOREIGN.test(s)) out += ' ' + s;   // ismeretlen, de nem idegen nyelvű mondat marad; idegen nyelvű elmarad
  }
  return out;
}

// ---- HTML segédek ----
const unesc = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (m, e) => {
  const k = e.toLowerCase(); if (k === 'amp') return '&'; if (k === 'quot') return '"'; if (k === 'apos') return "'"; if (k === 'lt') return '<'; if (k === 'gt') return '>'; if (k === 'nbsp') return ' ';
  return String.fromCodePoint(k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
});
const escA = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const metaRe = (key) => new RegExp(`<meta\\b[^>]*\\b(?:name|property)="${key.replace(/:/g, '\\:')}"[^>]*>`, 'gi');
function getMeta(h, key) { const m = h.match(metaRe(key)); if (!m) return null; const c = m[0].match(/\bcontent="([^"]*)"/i); return c ? unesc(c[1]) : null; }
function setMeta(h, key, val) { return h.replace(metaRe(key), (tag) => /\bcontent="/i.test(tag) ? tag.replace(/\bcontent="[^"]*"/i, `content="${escA(val)}"`) : tag); }
function getTitle(h) { const m = h.match(/<title>([\s\S]*?)<\/title>/i); return m ? unesc(m[1]) : null; }
function setTitle(h, val) { return h.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escT(val)}</title>`); }
const TITLE_KEYS = ['og:title', 'twitter:title'], DESC_KEYS = ['description', 'og:description', 'twitter:description'];
function setTitles(h, t) { h = setTitle(h, t); for (const k of TITLE_KEYS) h = setMeta(h, k, t.replace(/\s\|\s*CarAdvance$/, '')); return h; }
function setDescs(h, d) { for (const k of DESC_KEYS) h = setMeta(h, k, d); return h; }

function* walk(dir, rel = '') {
  let es; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of es) {
    if (e.isDirectory()) { if (!/^(?:_astro|auto-foto|media|icons|i18n|l10n|berles-press)$/.test(e.name)) yield* walk(path.join(dir, e.name), rel + e.name + '/'); }
    else if (e.name === 'index.html') yield rel;
  }
}
function locate(rel) {
  let p = rel.split('/').filter(Boolean), np = false, mk = 'hu';
  if (p[0] === '_np') { np = true; p = p.slice(1); }
  else for (const [k, [root]] of Object.entries(MARKETS)) if (root && p[0] === root) { mk = k; p = p.slice(1); break; }
  const [, def, langs] = MARKETS[mk]; let lang = def;
  if (p[0] && langs.includes(p[0])) { lang = p[0]; p = p.slice(1); }
  return { mk, lang, np, sub: p };
}

function minRentEur() {
  let min = Infinity;
  for (const dir of ['en/berelheto-auto', 'berelheto-auto']) {
    let ds = []; try { ds = fs.readdirSync(path.join(DIST, dir)); } catch (e) { continue; }
    for (const d of ds) {
      let h = ''; try { h = fs.readFileSync(path.join(DIST, dir, d, 'index.html'), 'utf8'); } catch (e) { continue; }
      const t = unesc(getTitle(h) || '') + ' ' + unesc(getMeta(h, 'description') || '');
      const m = t.match(/(\d[\d\s ]*)\s?€\s?\/\s?(?:month|hó)/); if (m) { const n = +m[1].replace(/\D/g, ''); if (n > 200 && n < min) min = n; }
    }
    if (min < Infinity) break;
  }
  return min < Infinity ? min : 0;
}

function run() {
  if (!fs.existsSync(DIST)) return 'nincs dist';
  const minE = minRentEur();
  const have = new Set(); for (const [mk, ls] of Object.entries(OGIMG)) for (const l of ls) if (fs.existsSync(path.join(DIST, 'l10n', 'og', `og-${mk}-${l}.jpg`))) have.add(mk + '-' + l);
  const st = { hub: 0, carT: 0, carD: 0, img: 0, cz: 0, long: [] };
  for (const rel of walk(DIST)) {
    const { mk, lang, np, sub } = locate(rel);
    if (!lang) continue;
    const f = path.join(DIST, rel, 'index.html');
    let h = fs.readFileSync(f, 'utf8'); const h0 = h;

    // 1) gyűjtőoldal
    if (sub.length === 1 && HUBS.has(sub[0]) && !(mk === 'hu' && lang === 'hu') && HUB_T[lang]) {
      const vat = mk === 'ch' ? (VAT_CH[lang] || VAT[lang]) : VAT[lang];
      const p = mk === 'ch' ? fmtChf(Math.round(minE * FX_CHF)) : fmtEur(minE);
      const rent = (np || !minE) ? (RENT_NP[lang] || RENT[lang](p, vat)) : RENT[lang](p, vat);
      const d = LEAD[lang] + (lang === "zh" ? "" : " ") + rent;
      h = setDescs(setTitles(h, HUB_T[lang]), d); st.hub++;
      if (d.length > 165) st.long.push(rel + ' ' + d.length);
    }

    // 2) autó-adatlap (.sk / .cz / .pl nyelvi változatai)
    if (['sk', 'cz', 'pl'].includes(mk) && CAR[lang] && sub[0] === 'auto' && sub.length === 2) {
      const t = getTitle(h);
      if (t && FOREIGN.test(t)) { const nt = carTitle(lang, t); if (nt) { h = setTitles(h, nt); st.carT++; } }
      const d = getMeta(h, 'description');
      if (d && FOREIGN.test(d)) { const nd = carDesc(lang, d); if (nd) { h = setDescs(h, nd); st.carD++; } }
    }

    // 4) cseh modellnév („BMW řady 3”) az angol/német oldalakon
    if (mk === 'cz' && (lang === 'en' || lang === 'de')) {
      const rp = (s) => s.replace(/BMW řady (\d)/g, (m, n) => lang === 'en' ? `BMW ${n} Series` : `BMW ${n}er`);
      const t = getTitle(h); if (t && /řady \d/.test(t)) { h = setTitles(h, rp(t)); st.cz++; }
      const d = getMeta(h, 'description'); if (d && /řady \d/.test(d)) { h = setDescs(h, rp(d)); st.cz++; }
    }

    // 3) általános megosztási kép → piac + nyelv szerinti kép
    const key = mk + '-' + lang;
    const og = getMeta(h, 'og:image');
    if (og && GENERIC_OG.test(og) && have.has(key)) {
      const url = `${IMG_HOST}/l10n/og/og-${key}.jpg`;
      h = setMeta(setMeta(h, 'og:image', url), 'twitter:image', url);
      if (ALT[lang]) h = setMeta(h, 'og:image:alt', ALT[lang]);
      st.img++;
    }
    if (h !== h0) fs.writeFileSync(f, h);
  }
  return `[share-meta] gyűjtőoldal: ${st.hub}, autó-cím: ${st.carT}, autó-leírás: ${st.carD}, megosztási kép: ${st.img}, cz modellnév: ${st.cz}, legkisebb bérleti díj: ${minE} €` + (st.long.length ? `; hosszú leírás: ${st.long.join(', ')}` : '');
}
try { console.log(run()); } catch (e) { console.log('[share-meta] hiba: ' + (e && e.stack || e)); }
