#!/usr/bin/env node
/**
 * Bérlési modelloldalak árjegyzete a km-keret szerinti árazáshoz (km-pricing.mjs) — minden oldalon, minden nyelven
 *
 * A megjelenített havidíj a 2 000 km/hó keret ára; 3 000 km +250 €, 4 000 km +500 € havonta (nettó).
 * Az ár alatti jegyzet („… 2 000–4 000 km/hó futáskerettel (autótól függően) …”) a build végén, a lefordított
 * oldalakon íródik át (így a fordítási kulcsok nem változnak). Csak a <p class="cd-note" data-km="…"> jegyzet
 * változik; ha egy modellnél csak 2 000 km választható (data-km="2000"), a felárak nem jelennek meg.
 * Ár nélküli (_np) változat: felár-összeg nélkül. caradvance.ch: CHF-ben (≈ €). Hibára exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const FX_CHF = (() => { try { return +JSON.parse(fs.readFileSync('ch-site-config.json', 'utf8')).fxCHF || 0.9247; } catch (e) { return 0.9247; } })();
const chf = (e) => 'CHF ' + String(Math.round(e * FX_CHF)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');

// nyelv → [a „2 000–4 000 km/…” + „(autótól függően)” minta, csere: tiers(a3, a4) / only2000 / np]
const N = '2(?:\\s|&nbsp;|\\u00a0)?000[–-]4(?:\\s|&nbsp;|\\u00a0)?000';
const SP = ' ';
const R = [
  // magyar
  [new RegExp(N + ' km/hó futáskerettel \\(autótól függően\\)'), (a, b) => `2${SP}000 km/hó futáskerettel (3${SP}000 km: +${a}, 4${SP}000 km: +${b} havonta)`, `2${SP}000 km/hó futáskerettel`, `2${SP}000 km/hó futáskerettel (3${SP}000 vagy 4${SP}000 km is választható)`],
  // angol
  [new RegExp('(?:a mileage allowance of|a limit of) ' + N + ' km/month \\(depending on the car\\)'), (a, b) => `a limit of 2${SP}000 km/month (3${SP}000 km: +${a}, 4${SP}000 km: +${b} per month)`, `a limit of 2${SP}000 km/month`, `a limit of 2${SP}000 km/month (3${SP}000 or 4${SP}000 km also available)`],
  // német
  [new RegExp('mit ' + N + ' km/Monat Laufleistung \\(je nach Auto\\)'), (a, b) => `mit 2${SP}000 km/Monat Laufleistung (3${SP}000 km: +${a}, 4${SP}000 km: +${b} pro Monat)`, `mit 2${SP}000 km/Monat Laufleistung`, `mit 2${SP}000 km/Monat Laufleistung (3${SP}000 oder 4${SP}000 km wählbar)`],
  [new RegExp('mit einem Limit von ' + N + ' km/Monat \\(je nach Auto\\)'), (a, b) => `mit einem Limit von 2${SP}000 km/Monat (3${SP}000 km: +${a}, 4${SP}000 km: +${b} pro Monat)`, `mit einem Limit von 2${SP}000 km/Monat`, `mit einem Limit von 2${SP}000 km/Monat (3${SP}000 oder 4${SP}000 km wählbar)`],
  // francia
  [new RegExp('(?:avec|avec une limite de|avec un forfait de) ' + N + ' km/mois(?: inclus)? \\(selon la voiture\\)'), (a, b) => `avec un forfait de 2${SP}000 km/mois (3${SP}000 km : +${a}, 4${SP}000 km : +${b} par mois)`, `avec un forfait de 2${SP}000 km/mois`, `avec un forfait de 2${SP}000 km/mois (3${SP}000 ou 4${SP}000 km au choix)`],
  // ukrán
  [new RegExp('з лімітом пробігу ' + N + ' км/міс\\. \\(залежно від авто\\)'), (a, b) => `з лімітом пробігу 2${SP}000 км/міс. (3${SP}000 км: +${a}, 4${SP}000 км: +${b} на місяць)`, `з лімітом пробігу 2${SP}000 км/міс.`, `з лімітом пробігу 2${SP}000 км/міс. (також 3${SP}000 або 4${SP}000 км)`],
  // kínai
  [new RegExp('视车型每月里程额度 ' + N + ' km'), (a, b) => `每月里程额度 2${SP}000 km（3${SP}000 km：+${a}，4${SP}000 km：+${b}/月）`, `每月里程额度 2${SP}000 km`, `每月里程额度 2${SP}000 km（亦可选 3${SP}000 或 4${SP}000 km）`],
  // szlovák
  [new RegExp('s limitom ' + N + ' km/mesiac \\(podľa auta\\)'), (a, b) => `s limitom 2${SP}000 km/mesiac (3${SP}000 km: +${a}, 4${SP}000 km: +${b} mesačne)`, `s limitom 2${SP}000 km/mesiac`, `s limitom 2${SP}000 km/mesiac (na výber aj 3${SP}000 alebo 4${SP}000 km)`],
  // cseh
  [new RegExp('s limitem ' + N + ' km/měs\\. \\(podle auta\\)'), (a, b) => `s limitem 2${SP}000 km/měs. (3${SP}000 km: +${a}, 4${SP}000 km: +${b} měsíčně)`, `s limitem 2${SP}000 km/měs.`, `s limitem 2${SP}000 km/měs. (na výběr i 3${SP}000 nebo 4${SP}000 km)`],
  // lengyel
  [new RegExp('z limitem ' + N + ' km/mies\\. \\(w zależności od samochodu\\)'), (a, b) => `z limitem 2${SP}000 km/mies. (3${SP}000 km: +${a}, 4${SP}000 km: +${b} miesięcznie)`, `z limitem 2${SP}000 km/mies.`, `z limitem 2${SP}000 km/mies. (do wyboru także 3${SP}000 lub 4${SP}000 km)`],
  // olasz
  [new RegExp('con un limite di ' + N + ' km/mese \\(a seconda dell’auto\\)'), (a, b) => `con un limite di 2${SP}000 km/mese (3${SP}000 km: +${a}, 4${SP}000 km: +${b} al mese)`, `con un limite di 2${SP}000 km/mese`, `con un limite di 2${SP}000 km/mese (anche 3${SP}000 o 4${SP}000 km)`],
  // spanyol
  [new RegExp('con un límite de ' + N + ' km/mes \\(según el coche\\)'), (a, b) => `con un límite de 2${SP}000 km/mes (3${SP}000 km: +${a}, 4${SP}000 km: +${b} al mes)`, `con un límite de 2${SP}000 km/mes`, `con un límite de 2${SP}000 km/mes (también 3${SP}000 o 4${SP}000 km)`]
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else if (e.name === 'index.html') yield p;
  }
}
function run() {
  if (!fs.existsSync(DIST)) return 'nincs dist';
  let files = 0, notes = 0, miss = 0;
  for (const f of walk(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    if (h.indexOf('class="cd-note" data-km=') < 0) continue;
    const rel = path.relative(DIST, f).split(path.sep);
    const np = rel[0] === '_np', ch = rel[0] === 'ch';
    let hit = false;
    const out = h.replace(/(<p class="cd-note" data-km=")([^"]*)("[^>]*>)([\s\S]*?)(<\/p>)/g, (m, a, km, b, body, c) => {
      const tiers = /3000/.test(km);
      for (const [re, fT, f2, fN] of R) {
        if (!re.test(body)) continue;
        const rep = !tiers ? f2 : np ? fN : (ch ? fT(chf(250), chf(500)) : fT(`250${SP}€`, `500${SP}€`));
        notes++; hit = true;
        return a + km + b + body.replace(re, rep) + c;
      }
      miss++;
      return m;
    });
    if (hit) { fs.writeFileSync(f, out); files++; }
  }
  return `[km-note] ${files} oldal, ${notes} árjegyzet átírva (2 000 km + 3 000 / 4 000 km felár)${miss ? ', ' + miss + ' ismeretlen nyelvű jegyzet' : ''}`;
}
try { console.log(run()); } catch (e) { console.log('[km-note] hiba: ' + (e && e.stack || e)); }
