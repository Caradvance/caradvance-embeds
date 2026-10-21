// CarAdvance ügyfélkedvezmény (Kaufnachlass, "caradvance website B2C price.xlsx", 2026. 10.)
// %-ban, a német nettó listaárból. A kulcs a modell neve pontosan úgy, ahogy az /egyedi-auto-rendeles
// listában (EgyediLista.astro) és a modelloldalakon (carModels.ts / egyediCars.ts) szerepel.
// Szabály: ha a táblázat csak a modellt adja meg (pl. "BMW 2er", "Audi A6", "Audi Q5"), a modell minden
// karosszériája megkapja; ha karosszériát is (pl. "BMW 4er Coupe / Cabrio", "Audi A6 Avant etron"), csak az.
// Ami nincs a táblázatban (pl. 4-es Gran Coupé, i- és iX-modellek, XM, Z4, RS-modellek, A8, Q9, e-tron GT,
// CLA), az kedvezmény nélkül, listaáron marad.
export const DISCOUNTS: Record<string, number> = {
  // BMW
  'BMW 1-es': 22,
  'BMW 2-es Active Tourer': 19, 'BMW 2-es Coupé': 19, 'BMW 2-es Gran Coupé': 19, 'BMW M2': 14,
  'BMW 3-as': 25, 'BMW 3-as Touring': 25, 'BMW M3': 16, 'BMW M3 Touring': 15,
  'BMW 4-es Coupé': 21, 'BMW 4-es Cabrio': 21, 'BMW M4': 17, 'BMW M4 Cabrio': 17,
  'BMW 5-ös': 21, 'BMW 5-ös Touring': 21, 'BMW M5': 14, 'BMW M5 Touring': 14,
  'BMW 7-es': 30, 'BMW 7-es 750e': 30, 'BMW 7-es M760e': 30,
  'BMW X1': 20, 'BMW X2': 19, 'BMW X3': 19, 'BMW X5': 20, 'BMW X5 M': 18,
  'BMW X6': 20, 'BMW X6 M': 18, 'BMW X6 M Competition': 18, 'BMW X7': 20,
  // MINI
  'MINI Cooper': 17, 'MINI Cooper 5 ajtós': 17, 'MINI Cooper Cabrio': 17, 'MINI Countryman': 17,
  'MINI John Cooper Works': 17, 'MINI John Cooper Works Cabrio': 17, 'MINI John Cooper Works Countryman ALL4': 17,
  // Mercedes-Benz (AMG is)
  'Mercedes-Benz A-osztály': 18, 'Mercedes-AMG A-osztály': 18, 'Mercedes-Benz B-osztály': 18,
  'Mercedes-Benz C-osztály': 18, 'Mercedes-Benz C-osztály T-Modell': 18, 'Mercedes-AMG C-osztály': 18, 'Mercedes-AMG C-osztály T-Modell': 18,
  'Mercedes-Benz CLE Coupé': 18, 'Mercedes-Benz CLE Cabrio': 18, 'Mercedes-AMG CLE Coupé': 18, 'Mercedes-AMG CLE Cabrio': 18,
  'Mercedes-Benz E-osztály': 18, 'Mercedes-Benz E-osztály T-Modell': 18, 'Mercedes-AMG E-osztály': 18, 'Mercedes-AMG E-osztály T-Modell': 18,
  'Mercedes-Benz GLA': 18, 'Mercedes-AMG GLA': 18, 'Mercedes-Benz GLB': 18, 'Mercedes-AMG GLB': 18,
  'Mercedes-Benz GLC': 18, 'Mercedes-AMG GLC': 18, 'Mercedes-Benz GLC Coupé': 18, 'Mercedes-AMG GLC Coupé': 18,
  'Mercedes-Benz GLE': 18, 'Mercedes-AMG GLE': 18, 'Mercedes-Benz GLE Coupé': 18, 'Mercedes-AMG GLE Coupé': 18,
  'Mercedes-Benz S-osztály': 18,
  // Audi
  'Audi A3 Limousine': 23, 'Audi A3 Sportback': 23, 'Audi A3 allstreet': 23,
  'Audi A5 Limousine': 25, 'Audi A5 Avant': 25,
  'Audi A6 Limousine': 23, 'Audi A6 Avant': 23, 'Audi A6 allroad': 23, 'Audi A6 Avant e-tron': 10,
  'Audi Q3': 21, 'Audi Q3 Sportback': 21, 'Audi Q5': 21, 'Audi Q5 Sportback': 21,
  'Audi Q6 e-tron': 10, 'Audi Q6 Sportback e-tron': 10, 'Audi Q7': 21, 'Audi Q8': 24,
};

/** kedvezmény %-ban (0, ha nincs) */
export const discountPct = (name: string): number => DISCOUNTS[String(name || '').trim()] || 0;

/** kedvezményes nettó € a nettó listaárból */
export const discountedNet = (listNet: number, pct: number): number => (pct ? Math.round(listNet * (1 - pct / 100)) : listNet);

/**
 * Kézzel írt modelloldal (carModels.ts) átállítása a kedvezményes árra: netEur → kedvezményes,
 * listEur → eredeti nettó listaár, disc → %. A címben és a leírásban csak a számok változnak
 * (a szöveg szerkezete ugyanaz marad, így a fordítások továbbra is illeszkednek).
 */
export function applyDiscount(m: any, fx = 364) {
  const p = discountPct(m && m.name);
  if (!p || !m.netEur || m.listEur) return m;
  const list = m.netEur, net = discountedNet(list, p);
  const mft = (n: number) => (n * fx / 1e6).toFixed(1).replace('.', ',');
  const sp = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  m.listEur = list; m.disc = p; m.netEur = net;
  if (m.title) m.title = m.title.replace(/nettó [\d,]+ M Ft-tól/, 'nettó ' + mft(net) + ' M Ft-tól');
  if (m.description) m.description = m.description.replace(/nettó [\d\s  .]+ €-tól \(kb\. [\d,]+ M Ft\)/, 'nettó ' + sp(net) + ' €-tól (kb. ' + mft(net) + ' M Ft)');
  return m;
}
