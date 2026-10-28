// Build lépés (a cz-phone.mjs után fut): caradvance.cz — Mr. JOB SK „Návrh úprav webu” (2026-10-26) maradék pontjai
// a kész cseh oldalakon (dist/cs: cseh + /en/ + /de/ változat), ahol a korábbi lépések szabályai nem találtak:
//  3  lízing-kalkulátor említések (blogok, bérlési / új autós oldalak, GYIK, címek) → partner lízingcég ajánlata
//     + a magyar finanszírozó partnerek (Euroleasing, Merkantil) logói a /dovoz/ oldalról
//  2  „1 év kellékszavatosság” maradékok: használt autó 1 év, új autó 2 év (cs / en / de)
// 17  autó-adatlap leírása: „Cena bez DPH, se zárukou” → a választott változat szerinti ár, kellékszavatossággal
// 22  behozatali idő: egységesen 5–14 nap (raktári autó); gyári rendelésnél a gyártástól függ
//  +  magyar maradványok: képek alt-szövegei, köszönő / hiba-üzenet (CA_CFG), „Vászontető”, Balaton (en/de),
//     az /alairas/ (magyar e-aláírás) oldal: noindex + kikerül a cseh sitemapből
// Hiba esetén csak logol, a buildet nem állítja meg.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const ROOT = path.join(DIST, 'cs');

/* ---------- közös segédek ---------- */
const INL = '(?:<\\/?(?:a|strong|b|em|i|span)\\b[^>]*>)';
const CH = '(?:[^<>.!?"\\n]|' + INL + ')';
/** mondat-szintű csere: a kulcsszót tartalmazó teljes mondatot (inline tagekkel együtt) cseréli, ha ok(mondat) igaz */
function sentences(h, key, ok, std) {
  const re = new RegExp('((?:^|[>.!?"]|\\n)\\s*)(' + CH + '*?(?:' + key + ')' + CH + '*[.!?]?)', 'gi');
  return h.replace(re, (m, a, s) => (ok(s.replace(/<[^>]+>/g, '')) ? a + std : m));
}
const R = (h, list) => { for (const [a, b] of list) h = typeof a === 'string' ? h.split(a).join(b) : h.replace(a, b); return h; };

/* ---------- 3: lízing-kalkulátor ---------- */
const STD = {
  cs: 'Orientační splátku vám na požádání připraví přímo partnerská leasingová společnost.',
  en: 'An indicative instalment can be prepared for you on request directly by our partner leasing company.',
  de: 'Eine unverbindliche Monatsrate erstellt Ihnen auf Anfrage direkt unsere Partner-Leasinggesellschaft.'
};
const LEASE_FIX = {
  cs: [
    ['Leasing a financování aut – leasingová kalkulačka', 'Leasing a financování aut'],
    [/(·\s*<a [^>]*>)leasingová kalkulačka(<\/a>)/g, '$1financování – leasing$2'],
    [/(<h[1-6][^>]*>)Spočítejte si měsíční splátku v leasingové kalkulačce(<\/h[1-6]>)/g, '$1Orientační splátka na vyžádání$2'],
    [/Je k dispozici leasingová kalkulačka\?/g, 'Jak zjistím orientační splátku?'],
    [/je k dispozici leasingová kalkulačka\??/g, 'jak zjistím orientační splátku?']
  ],
  en: [
    ['Car leasing and financing – leasing calculator', 'Car leasing and financing'],
    [/(·\s*<a [^>]*>)leasing calculator(<\/a>)/g, '$1financing – leasing$2'],
    [/(<h[1-6][^>]*>)Calculate your monthly instalment with the leasing calculator(<\/h[1-6]>)/g, '$1Indicative instalment on request$2'],
    [/Is there a leasing calculator\?/g, 'How can I find out the indicative instalment?'],
    [/is there a leasing calculator\??/g, 'how can i find out the indicative instalment?']
  ],
  de: [
    ['Autoleasing und Finanzierung – Leasingrechner', 'Autoleasing und Finanzierung'],
    [/(·\s*<a [^>]*>)Leasingrechner(<\/a>)/g, '$1Finanzierung – Leasing$2'],
    [/(<h[1-6][^>]*>)Berechnen Sie Ihre Monatsrate mit dem Leasingrechner(<\/h[1-6]>)/g, '$1Unverbindliche Monatsrate auf Anfrage$2'],
    [/Gibt es einen Leasingrechner\?/g, 'Wie erfahre ich die voraussichtliche Monatsrate?'],
    [/gibt es einen leasingrechner\??/g, 'wie erfahre ich die voraussichtliche monatsrate?']
  ]
};
const LEASE_KEY = { cs: 'kalkulač[^\\s<.,]*', en: 'calculator', de: '[Rr]echner' };
const LEASE_OK = {
  cs: (s) => /leasing|financ|splát/i.test(s) && !/poplat|přepis|registrac|pronájmu|pronájem auta/i.test(s),
  en: (s) => /leasing|financ|instalment/i.test(s) && !/\bfee|registration|transfer|rental cost|long-term rental/i.test(s),
  de: (s) => /Leasing|Finanz|Rate/.test(s) && !/Gebühr|Zulassung|Umschreib|Mietkosten|Langzeitmiete/.test(s)
};
function lease(h, L) {
  h = R(h, LEASE_FIX[L]);
  h = sentences(h, LEASE_KEY[L], LEASE_OK[L], STD[L]);
  // magyar finanszírozó partnerek logói (a cseh piacon nincsenek)
  h = h.replace(/<img src="\/(?:euroleasing|merkantil-bank)\.png"[^>]*>/g, '');
  return h;
}

/* ---------- 2: kellékszavatosság ---------- */
const ODP = {
  cs: [
    ['s odpovědností za vady 1 rok.', 's odpovědností za vady (u ojetých vozů 1 rok, u nových 2 roky).'],
    ['odpovědností za vady 1 rok, transparentní cenou', 'odpovědností za vady (ojeté vozy 1 rok, nové 2 roky), transparentní cenou'],
    [/>1 rok((?:<\/[^>]+>|<[^>]+>|\s)*)odpovědnost za vady u každého vozu/g, '>1–2 roky$1odpovědnost za vady (ojeté vozy 1 rok, nové 2 roky)'],
    ['1 rok na každý vůz', '1 rok u ojetých, 2 roky u nových vozů']
  ],
  en: [
    [/(?<!A used car comes )with a 1-year liability for defects\./g, 'with liability for defects (1 year for used cars, 2 years for new cars).'],
    ['with vetted cars, a 1-year liability for defects, a transparent price', 'with vetted cars, liability for defects (1 year for used cars, 2 years for new cars), a transparent price'],
    [/>1 year((?:<\/[^>]+>|<[^>]+>|\s)*)liability for defects on every car/g, '>1–2 years$1liability for defects (used cars 1 year, new cars 2 years)'],
    ['1 year on every car', '1 year for used, 2 years for new cars']
  ],
  de: [
    ['kommt mit 1 Jahr Mängelhaftung.', 'kommt mit Mängelhaftung (Gebrauchtwagen 1 Jahr, Neuwagen 2 Jahre).'],
    ['mit geprüften Autos, 1 Jahr Mängelhaftung, transparentem Preis', 'mit geprüften Autos, Mängelhaftung (Gebrauchtwagen 1 Jahr, Neuwagen 2 Jahre), transparentem Preis'],
    [/>1 Jahr((?:<\/[^>]+>|<[^>]+>|\s)*)Mängelhaftung bei jedem Auto/g, '>1–2 Jahre$1Mängelhaftung (Gebrauchtwagen 1 Jahr, Neuwagen 2 Jahre)'],
    ['1 Jahr auf jedes Auto', '1 Jahr bei Gebraucht-, 2 Jahre bei Neuwagen']
  ]
};
/* a Minőségbiztosítás oldal jelvénye (vásárlásra és bérlésre is vonatkozik) */
const ODP_QA = {
  cs: [[/1letá odpovědnost za vady(?!⁴)/g, 'Odpovědnost za vady (ojeté 1 rok, nové 2 roky)']],
  en: [[/1-year liability for defects(?!⁴)/g, 'Liability for defects (used 1 year, new 2 years)']],
  de: [[/1 Jahr Mängelhaftung(?!⁴)/g, 'Mängelhaftung (gebraucht 1 Jahr, neu 2 Jahre)']]
};

/* ---------- 17: autó-adatlap leírása ---------- */
const DESC = {
  cs: [[/Cena bez DPH,? se zárukou, dovoz CarAdvance\./g, 'Cena podle zvolené varianty níže, s odpovědností za vady, dovoz CarAdvance.']],
  en: [[/Net price \(excl\. VAT\),? with warranty, CarAdvance import\./g, 'Price according to the option selected below, with liability for defects, imported by CarAdvance.']],
  de: [[/Nettopreis \(ohne MwSt\.\),? mit Garantie, CarAdvance-Import\./g, 'Preis je nach unten gewählter Variante, mit Mängelhaftung, Import durch CarAdvance.']]
};

/* ---------- 22: behozatali idő ---------- */
const TIME = {
  cs: [
    [/Ze skladu obvykle za několik týdnů, u tovární objednávky podle konfigurace\./g, 'Vůz skladem dovezeme obvykle za 5–14 dní, u tovární objednávky záleží na konfiguraci a výrobě.'],
    [/Závisí na zvolené konfiguraci, obvykle jde o několik týdnů\./g, 'Vůz skladem dovezeme obvykle za 5–14 dní; u vozu vyráběného na objednávku záleží na konfiguraci a výrobě.'],
    [/Záleží na zvoleném modelu a zajištění vozu, obvykle jde o několik týdnů\./g, 'U vozu skladem obvykle 5–14 dní; u vozu vyráběného na objednávku záleží na modelu a výrobě.'],
    [/Závisí na vybraném voze a tempu registrace[,;] (?:obvykle lze vůz zaregistrovat|zpravidla jej lze uvést do provozu) během několika týdnů\./g, 'Dovoz obvykle trvá 5–14 dní, registraci vyřídíme hned poté.']
  ],
  en: [
    [/From stock, typically a few weeks[;,] for a factory order, it depends on the configuration\./g, 'A car in stock is usually imported within 5–14 days; for a factory order, it depends on the configuration and production.'],
    [/It depends on the chosen configuration, but typically a few weeks\./g, 'A car in stock is usually imported within 5–14 days; for a car built to order, it depends on the configuration and production.'],
    [/It depends on the chosen model and sourcing, typically a few weeks\./g, 'For a car in stock usually 5–14 days; for a car built to order, it depends on the model and production.'],
    [/It depends on the chosen car and the (?:pace of registration|registration schedule)[;,] typically,? it can be on the road within a few weeks\./g, 'The import usually takes 5–14 days; we take care of the registration right after.']
  ],
  de: [
    [/Ab Lager in der Regel einige Wochen, bei Werksbestellung je nach Konfiguration\./g, 'Ein Fahrzeug ab Lager importieren wir in der Regel innerhalb von 5–14 Tagen, bei einer Werksbestellung hängt es von Konfiguration und Produktion ab.'],
    [/Das hängt von der gewählten Konfiguration ab, in der Regel einige Wochen\./g, 'Ein Fahrzeug ab Lager importieren wir in der Regel innerhalb von 5–14 Tagen; bei einer Werksbestellung hängt es von Konfiguration und Produktion ab.'],
    [/Das hängt vom gewählten Modell und von der Beschaffung ab, in der Regel einige Wochen\./g, 'Ab Lager in der Regel 5–14 Tage; bei einer Werksbestellung hängt es von Modell und Produktion ab.'],
    [/Das hängt vom gewählten (?:Fahrzeug|Auto) und vom Zeitplan der Zulassung ab[,;] in der Regel kann es innerhalb weniger Wochen zugelassen werden\./g, 'Der Import dauert in der Regel 5–14 Tage; die Zulassung erledigen wir direkt im Anschluss.']
  ]
};

/* ---------- magyar maradványok ---------- */
const MISC = {
  cs: [['>Vászontető<', '>Plátěná střecha<']],
  en: [['drive to Lake Balaton on petrol', 'drive to the mountains on petrol'], ['>Vászontető<', '>Soft top<']],
  de: [['bis an den Balaton', 'bis in die Berge'], ['>Vászontető<', '>Stoffverdeck<']]
};
/* képek alt / title szövegei (galériák): magyar képleírások */
const ALT = {
  cs: [['BMW 4-es ', 'BMW řady 4 '], ['BMW 5-ös ', 'BMW řady 5 '], ['5 ajtós', '5 dveřová'], ['hátulról, városi háttérrel', 'zezadu, ve městě'], ['hátulról, menet közben', 'zezadu, za jízdy'],
    ['hátulról', 'zezadu'], ['garázs előtt', 'před garáží'], ['sportülések', 'sportovní sedadla'], ['nyitott csomagtartó', 'otevřený zavazadlový prostor'], ['nyitott csomagtér', 'otevřený zavazadlový prostor'],
    ['felülnézet', 'pohled shora'], ['töltés közben', 'při nabíjení'], ['menet közben', 'za jízdy'], ['műszerfal', 'palubní deska'], ['töltőoszlopnál', 'u nabíjecí stanice'], ['töltőcsatlakozó', 'nabíjecí konektor'],
    ['tető és hátsó ajtók', 'střecha a zadní dveře'], ['panorámatető', 'panoramatická střecha'], ['városban', 've městě']],
  en: [['BMW 4-es ', 'BMW 4 Series '], ['BMW 5-ös ', 'BMW 5 Series '], ['5 ajtós', '5-door'], ['hátulról, városi háttérrel', 'rear view, city background'], ['hátulról, menet közben', 'rear view, on the road'],
    ['hátulról', 'rear view'], ['garázs előtt', 'in front of a garage'], ['sportülések', 'sport seats'], ['nyitott csomagtartó', 'open boot'], ['nyitott csomagtér', 'open boot'],
    ['felülnézet', 'top view'], ['töltés közben', 'charging'], ['menet közben', 'on the road'], ['műszerfal', 'dashboard'], ['töltőoszlopnál', 'at a charging station'], ['töltőcsatlakozó', 'charging port'],
    ['tető és hátsó ajtók', 'roof and rear doors'], ['panorámatető', 'panoramic roof'], ['városban', 'in the city']],
  de: [['BMW 4-es ', 'BMW 4er '], ['BMW 5-ös ', 'BMW 5er '], ['5 ajtós', '5-Türer'], ['hátulról, városi háttérrel', 'Heckansicht, Stadtkulisse'], ['hátulról, menet közben', 'Heckansicht, in Fahrt'],
    ['hátulról', 'Heckansicht'], ['garázs előtt', 'vor der Garage'], ['sportülések', 'Sportsitze'], ['nyitott csomagtartó', 'geöffneter Kofferraum'], ['nyitott csomagtér', 'geöffneter Kofferraum'],
    ['felülnézet', 'Draufsicht'], ['töltés közben', 'beim Laden'], ['menet közben', 'in Fahrt'], ['műszerfal', 'Armaturenbrett'], ['töltőoszlopnál', 'an der Ladesäule'], ['töltőcsatlakozó', 'Ladeanschluss'],
    ['tető és hátsó ajtók', 'Dach und hintere Türen'], ['panorámatető', 'Panoramadach'], ['városban', 'in der Stadt']]
};
const RENT_ALT = {
  cs: [[/^(.+) bérlés — vadonatúj prémium autó tartós bérletben$/, 'Pronájem $1 — zcela nové prémiové auto v dlouhodobém pronájmu'], [/^(.+) bérlés$/, 'Pronájem $1']],
  en: [[/^(.+) bérlés — vadonatúj prémium autó tartós bérletben$/, '$1 rental — a brand-new premium car on long-term rental'], [/^(.+) bérlés$/, '$1 rental']],
  de: [[/^(.+) bérlés — vadonatúj prémium autó tartós bérletben$/, '$1 mieten — ein brandneues Premium-Auto in der Langzeitmiete'], [/^(.+) bérlés$/, '$1 mieten']]
};
function altText(v, L) {
  if (!/[őűáéíóöú]|\b(?:4-es|5-ös|ajtós)\b/.test(v)) return v;
  for (const [a, b] of RENT_ALT[L]) if (a.test(v)) { v = v.replace(a, b); break; }
  return R(v, ALT[L]);
}
function alts(h, L) {
  h = h.replace(/\b(alt|title|aria-label)="([^"]*)"/g, (m, a, v) => a + '="' + altText(v, L) + '"');
  return h.replace(/"alt":"([^"\\]*)"/g, (m, v) => '"alt":"' + altText(v, L) + '"');
}

/* ---------- köszönő / hiba üzenet a beküldés után (window.CA_CFG) ---------- */
const CFG = {
  cs: { THANKS_TITLE: 'Děkujeme za váš zájem!', THANKS_TEXT: 'Vaši poptávku jsme přijali a brzy se vám ozveme s nabídkou na míru.', THANKS_NOTE: 'Pokud spěcháte, klidně nám zavolejte.',
    ERROR_TITLE: 'Odeslání se nezdařilo', ERROR_TEXT: 'Vaši poptávku se bohužel nepodařilo přijmout. Zavolejte nám prosím nebo napište na info@caradvance.cz — vyřídíme to během pár minut.', COOKIE_POLICY_URL: '/ochrana-osobnich-udaju/#cookie' },
  en: { THANKS_TITLE: 'Thank you for your interest!', THANKS_TEXT: 'We have received your request and will get back to you shortly with a tailored offer.', THANKS_NOTE: 'If it is urgent, feel free to call us.',
    ERROR_TITLE: 'Sending failed', ERROR_TEXT: 'Unfortunately, we could not receive your request. Please call us or write to info@caradvance.cz — we will sort it out in a few minutes.', COOKIE_POLICY_URL: '/en/ochrana-osobnich-udaju/#cookie' },
  de: { THANKS_TITLE: 'Vielen Dank für Ihr Interesse!', THANKS_TEXT: 'Wir haben Ihre Anfrage erhalten und melden uns in Kürze mit einem individuellen Angebot.', THANKS_NOTE: 'Wenn es eilt, rufen Sie uns gerne an.',
    ERROR_TITLE: 'Senden fehlgeschlagen', ERROR_TEXT: 'Leider konnten wir Ihre Anfrage nicht empfangen. Bitte rufen Sie uns an oder schreiben Sie an info@caradvance.cz — wir erledigen das in wenigen Minuten.', COOKIE_POLICY_URL: '/de/ochrana-osobnich-udaju/#cookie' }
};
function cfg(h, L) {
  return h.replace(/(window\.CA_CFG\s*=\s*)(\{[^<]*?\})(\s*;?\s*<\/script>)/, (m, a, j, c) => {
    try { const o = JSON.parse(j); Object.assign(o, CFG[L], { PHONE: '+420 604 313 136', WHATSAPP: 'https://wa.me/421915410555' }); return a + JSON.stringify(o) + c; } catch (e) { return m; }
  });
}

/* ---------- /alairas/ (magyar e-aláírás): ne indexelődjön ---------- */
function alairas(h) {
  if (!/name="robots"/.test(h)) h = h.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
  return h;
}

/** egy kész HTML oldal javítása — L: 'cs' | 'en' | 'de', P: útvonal (pl. '/en/o-nas/') */
export function fix(h, L, P) {
  if (P === '/alairas/' || P === '/en/alairas/' || P === '/de/alairas/') return alairas(h);
  h = cfg(h, L);
  // a JS-kód érintetlen marad; a szöveg + a JSON-LD (GYIK) javul
  const parts = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  for (let i = 0; i < parts.length; i++) {
    let s = parts[i];
    const isScript = /^<(script|style)\b/i.test(s);
    if (isScript && !/^<script[^>]*application\/ld\+json/i.test(s)) {
      if (/^<script[^>]*application\/json/i.test(s) || /"alt":"/.test(s)) parts[i] = alts(s, L);
      continue;
    }
    s = lease(s, L);
    s = R(s, ODP[L]);
    if (/\/o-nas\/zajisteni-kvality\/$/.test(P)) s = R(s, ODP_QA[L]);
    s = R(s, DESC[L]);
    s = R(s, TIME[L]);
    s = R(s, MISC[L]);
    if (!isScript) s = alts(s, L);
    parts[i] = s;
  }
  return parts.join('');
}

/* ---------- futtatás ---------- */
function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
if (process.argv[1] && /cz-final\.mjs$/.test(process.argv[1])) {
  try {
    let n = 0, sm = 0;
    for (const f of walk(ROOT, [])) {
      const rel = path.relative(ROOT, f).split(path.sep).join('/');
      if (/\.html$/.test(f)) {
        const L = /^en\//.test(rel) ? 'en' : /^de\//.test(rel) ? 'de' : 'cs';
        const P = '/' + rel.replace(/index\.html$/, '');
        const s = fs.readFileSync(f, 'utf8');
        const t = fix(s, L, P);
        if (t !== s) { fs.writeFileSync(f, t); n++; }
      } else if (/sitemap[^/]*\.xml$/.test(f)) {
        const s = fs.readFileSync(f, 'utf8');
        const t = s.replace(/\s*<url>(?:(?!<\/url>)[\s\S])*?\/alairas\/(?:(?!<\/url>)[\s\S])*?<\/url>/g, '');
        if (t !== s) { fs.writeFileSync(f, t); sm++; }
      }
    }
    console.log('cz-final: ' + n + ' oldal javítva, ' + sm + ' sitemap');
  } catch (e) {
    console.log('cz-final: kihagyva — ' + (e && e.message));
  }
}
