/** caradvance.sk → en/de/hu: modellnevek helyőrzője (⟨M1⟩ …), hogy egy fordítás minden modellre jó legyen.
 *  Csak a márka + modellkód/latin modellnév kerül a helyőrzőbe — szlovák szó (Limuzína, trieda, radu) nem. */
const B = '(?:BMW|Audi|Mercedes-Benz|Mercedes-AMG|Mercedes|MINI|Mini|Volkswagen|VW|CUPRA|Cupra|SEAT|Seat|Hyundai|Kia|Volvo|MAN|Porsche)';
const TOK = '(?:[A-Za-z]*\\{\\d+\\}[A-Za-z0-9\\-]*|[A-Z0-9](?:[A-Za-z0-9\\-]|\\.(?=[A-Za-z0-9]))*é?|e-tron|e-HYBRID|e-Hybrid|xDrive|quattro)(?![\\p{L}\\p{N}])';
export const MODEL_RE = new RegExp('(?<![\\p{L}])' + B + '(?: ' + TOK + ')*(?![\\p{L}])', 'gu');
export function maskModels(k) { const ms = []; const km = k.replace(MODEL_RE, (m) => { ms.push(m); return '⟨M' + ms.length + '⟩'; }); return { km, ms }; }
export function unmaskModels(s, ms) { return s.replace(/⟨M(\d+)⟩/g, (m, i) => (ms[+i - 1] !== undefined ? ms[+i - 1] : m)); }
/* nyelvsemleges-e a szegmens (a szlovák/cseh szöveghez): csak márka-, modell-, technikai és tulajdonnevek maradnak benne.
 *  (Az i18n-templates neutral() a magyar ékezetekre néz — szlovák/cseh szövegre nem jó.) */
const IDW = new Set(('CarAdvance Caradvance GmbH Facebook TikTok YouTube Instagram LinkedIn Reddit Google Cloudflare mobile.de AutoScout kW Nm km kWh cm mm ccm ' +
  'Coupé Gran Tourer Touring Cabrio Sportback Avant Shooting Brake Hybrid hybrid Plug-in plug-in mild-hybrid Mild-Hybrid quattro xDrive sDrive Steptronic tronic tiptronic S-tronic MATIC 4MATIC G-TRONIC SPEEDSHIFT DSG DCT G-DCT MCT ' +
  'TFSI TDI TSI eTSI T-GDI e-tron e-hybrid e-Hybrid T-Modell allroad allstreet Active iDrive MMI MBUX Matrix MULTIBEAM IQ.LIGHT Bang Olufsen John Works Countryman Cooper Iconic Glow Superscreen Panamericana ' +
  'English Deutsch Magyar Slovenčina Čeština Ctrl Menu Performance performance Sport Line virtual cockpit Virtual Cockpit Digital Track Pace Interaction Bar Green British Racing Ocean Wave Professional Drive High OLED LED Boost Diesel ' +
  'Inc. St. San Francisco Bgm-Graf-Ring Geretsried Amtsgericht München Mr. Job s.r.o. IČ IČO DIČ USt-IdNr. Bratislava Senec Wolfsburg Ingolstadt Stuttgart Zuffenhausen Neckarsulm Mladá Boleslav Praha Brno Košice Ultra Pro Max Plus Edition Exclusive Premium Elegance Advantage Luxury M Sport Pack Package Competition Turbo GTS Executive Monospace Icon Prestige Style Lounge Comfort').split(/\s+/));
export function neutralL(k) {
  const s = maskModels(k).km.replace(/<\/?[gx]\d+\/?>/g, ' ').replace(/\{\d+\}|⟨M\d+⟩/g, ' ').replace(/\S+@\S+|https?:\S+|www\.\S+|\b[\w-]+\.(?:sk|cz|hu|de|com)\b/g, ' ');
  const w = s.match(/\p{L}[\p{L}\p{N}'’.\-]*/gu) || [];
  return w.every((x) => IDW.has(x) || IDW.has(x.replace(/[.,]$/, '')) || /^[A-Z0-9][A-Z0-9.\-]*$/.test(x) || /\d/.test(x));
}

/* 2. szint: a modellnévhez tartozó szlovák/cseh szavak is a helyőrzőbe kerülnek (rad 3, trieda C, třídy E, Limuzína),
 *  így a „Prenájom BMW rad 3 Limuzína …” ugyanarra a fordításra fut, mint a „Prenájom BMW X3 …”.
 *  A kimenetben ezeket a szavakat a cél nyelvre a phraseFix() alakítja (3 Series / 3er / 3-es, C-Class, Saloon …). */
const SER = '(?:rad|radu|rade|Rad|řada|řady|řadě|Řada|Řady|trieda|triedy|triede|triedu|Trieda|Triedy|třída|třídy|třídě|třídu|Třída|Třídy)';
const TOK2 = '(?:' + TOK + '|' + SER + ' (?:\\{\\d+\\}|[A-Z]{1,3})(?![\\p{L}\\p{N}])|[Ll]imuzín[auy])';
export const MODEL_RE2 = new RegExp('(?<![\\p{L}])' + B + '(?: ' + TOK2 + ')*(?![\\p{L}])', 'gu');
export function maskModels2(k) { const ms = []; const km = k.replace(MODEL_RE2, (m) => { ms.push(m); return '⟨M' + ms.length + '⟩'; }); return { km, ms }; }
/* a {N} helyőrzők sorszámozása a megjelenés sorrendjében 1..n — így a számozásban eltérő, egyébként azonos mondatok is egyeznek */
export function normNums(k) { const map = []; const seen = new Map(); const kn = k.replace(/\{(\d+)\}/g, (m, i) => { if (!seen.has(i)) { seen.set(i, seen.size + 1); map.push(i); } return '{' + seen.get(i) + '}'; }); return { kn, map, seen }; }
export function phraseFix(s, l) {
  const SERW = { en: (n) => n + ' Series', de: (n) => n + 'er', hu: (n) => n + '-es' };
  const LIM = { en: 'Saloon', de: 'Limousine', hu: 'Limuzin' };
  return s.replace(/(?<![\p{L}])(?:rad|radu|rade|Rad|řada|řady|řadě|Řada|Řady) (\d+)(?![\p{L}\p{N}])/gu, (m, n) => SERW[l](n))
    .replace(/(?<![\p{L}])[Ll]imuzín[auy](?![\p{L}])/gu, LIM[l]);
}
