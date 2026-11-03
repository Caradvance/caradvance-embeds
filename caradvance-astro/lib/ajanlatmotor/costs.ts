import type { CostLine, CostResult, Listing, Requirements } from "./types";
import type { RateConfig } from "./rates";

export interface Overrides {
  lines?: Record<string, number>;
  logistics_mode?: "trailer" | "driver";
  env_group?: number; // 0 = exempt (5E/5Z), 1..5 = NAV column
}

export interface CostInput {
  listing: Listing;
  req: Requirements;
  rates: RateConfig;
  rateVersion: number;
  fx: { rate: number; date: string; fallback: boolean };
  distanceKm: number;
  distanceFallback: boolean;
  overrides?: Overrides;
  registrationMonth?: string; // expected Hungarian registration YYYY-MM; default next month
}

export function monthsSince(firstReg: string, regMonth: string): number {
  const [fy, fm] = firstReg.split("-").map(Number);
  const [ry, rm] = regMonth.split("-").map(Number);
  return ry * 12 + rm - (fy * 12 + fm) + 1;
}

export function ageMultiplier(months: number, table: [number, number][]): number {
  let m = 1;
  for (const [th, mult] of table) if (months >= th) m = mult;
  return m;
}

/**
 * Default NAV column for a listing — the honosítás kalkulátor (caradvance.hu/honositas-kalkulator) classes:
 * 0 = 5E/5Z electric, 1 = better than 14 and first registered after 2020-12-31 (or hybrid), 2 = better than 14, 3 = 12–14, 4 = 9–11, 5 = 8 or worse.
 * Euro 6 ≈ class 15 (better than 14), Euro 4–5 ≈ 12–14, Euro 3 ≈ 9–11. Without the Euro norm the first registration date decides (flagged).
 */
export function defaultEnvGroup(l: Listing): { group: number; certain: boolean } {
  if (l.fuel === "electric") return { group: 0, certain: true };
  if (l.fuel === "hybrid" || l.fuel === "phev") return { group: 1, certain: true };
  const after2020 = String(l.first_registration || "") >= "2021-01";
  const e = (l.euro_norm || "").toLowerCase().replace(/\s/g, "");
  const m = e.match(/euro?(\d)/) || e.match(/^(\d)/);
  const n = m ? Number(m[1]) : 0;
  if (n >= 6) return { group: after2020 ? 1 : 2, certain: true };
  if (n === 5 || n === 4) return { group: 3, certain: true };
  if (n === 3) return { group: 4, certain: true };
  if (n && n < 3) return { group: 5, certain: true };
  const fr = String(l.first_registration || "");
  if (after2020) return { group: 1, certain: false };
  if (fr >= "2015-09") return { group: 2, certain: false };
  if (fr >= "2006-01") return { group: 3, certain: false };
  if (fr >= "2001-01") return { group: 4, certain: false };
  return { group: 5, certain: false };
}

/* ---------- Honosítás kalkulátor (caradvance.hu/honositas-kalkulator) — ugyanazok a táblák és szabályok ---------- */
export const HK = {
  kw_upper: [80, 100, 120, 140, 180, 250, 99999],
  regado: [
    [47000, 70500, 282000, 564000, 1128000], [70500, 105750, 423000, 846000, 1692000], [94000, 141000, 564000, 1128000, 2256000],
    [141000, 211500, 846000, 1692000, 3384000], [188000, 282000, 1128000, 2256000, 4512000], [282000, 423000, 1692000, 3384000, 6768000],
    [423000, 634500, 2538000, 5076000, 10152000],
  ],
  age: [[0, 1.0], [1, 0.97], [3, 0.92], [5, 0.87], [7, 0.82], [13, 0.77], [19, 0.72], [25, 0.67], [31, 0.62], [37, 0.55], [49, 0.47], [61, 0.41], [73, 0.35],
    [85, 0.3], [97, 0.26], [109, 0.22], [121, 0.19], [133, 0.16], [145, 0.14], [157, 0.12], [169, 0.1]] as [number, number][],
  // vagyonszerzési illeték, Ft/kW: sorok = kW-sáv (≤40, ≤80, ≤120, 120 felett), oszlopok = kor (0–3 év, 4–8 év, 8 év felett)
  il_kw: [40, 80, 120, 99999],
  il: [[550, 450, 300], [750, 550, 450], [850, 750, 550], [950, 850, 750]],
  okmany: 12000,
};
/** Eredetiségvizsgálat díja a hengerűrtartalom szerint (elektromos: 22 950 Ft). */
export function eredetisegFee(l: Listing): { fee: number; known: boolean; cc: number | null } {
  if (l.fuel === "electric") return { fee: 22950, known: true, cc: null };
  let cc = Number((l as any).cc) || 0; let known = cc > 0;
  if (!cc) { const m = `${l.title || ""} ${l.variant || ""}`.match(/\b([1-6])[.,]([0-9])\s?(?:l\b|tfsi|tsi|tdi|d\b|i\b|v6|v8|crdi|hdi|dci)/i); if (m) cc = Number(m[1]) * 1000 + Number(m[2]) * 100 - 5; }
  const fee = !cc ? 24975 : cc <= 1400 ? 22950 : cc <= 2000 ? 24975 : 27000;
  return { fee, known, cc: cc || null };
}

export function regado(l: Listing, _rates: RateConfig, envGroup: number, regMonth: string) {
  if (envGroup === 0) return { amount: 0, base: 0, months: 0, mult: 0 };
  const band = HK.kw_upper.findIndex((u) => l.power_kw <= u);
  const base = HK.regado[band][envGroup - 1];
  const months = Math.max(0, monthsSince(l.first_registration, regMonth));
  const mult = ageMultiplier(months, HK.age);
  return { amount: Math.round(base * mult), base, months, mult };
}

/** Vagyonszerzési illeték — a kalkulátor szerint: kW × Ft/kW (kW-sáv és kor szerint); 5E/5Z mentes. */
export function illetek(l: Listing, _rates: RateConfig, regMonth: string, envGroup?: number) {
  if (envGroup === 0 || l.fuel === "electric") return { amount: 0, rate: 0 };
  const ageYears = Math.max(0, Number(regMonth.slice(0, 4)) - Number(l.first_registration.slice(0, 4)));
  const row = HK.il_kw.findIndex((u) => l.power_kw <= u);
  const col = ageYears <= 3 ? 0 : ageYears <= 8 ? 1 : 2;
  const rate = HK.il[row][col];
  return { amount: Math.round(l.power_kw) * rate, rate };
}

export function logisticsEur(rates: RateConfig, km: number, mode: "trailer" | "driver") {
  const L = rates.logistics;
  if (mode === "driver") return Math.round(km * L.driver_eur_per_km + L.driver_fixed_eur + L.export_plates_eur);
  const band = L.trailer_bands_eur.find(([max]) => km <= max) || L.trailer_bands_eur[L.trailer_bands_eur.length - 1];
  return band[1];
}

function nextMonth(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 2; // +1 for 1-based, +1 for next month
  return m > 12 ? `${y + 1}-01` : `${y}-${String(m).padStart(2, "0")}`;
}

export function computeCosts(input: CostInput): CostResult {
  const { listing: l, req, rates, fx, overrides = {} } = input;
  const regMonth = input.registrationMonth || nextMonth();
  const ov = overrides.lines || {};
  const warnings: string[] = [];
  const unverified: string[] = [];

  const useNet = !!(l.vat_reclaimable && req.vehicle.vat_deductible_needed && l.price_net_eur);
  const vehicleEur = useNet ? (l.price_net_eur as number) : l.price_gross_eur;

  const months = monthsSince(l.first_registration, regMonth);
  if (months <= 6 || l.km <= 6000)
    warnings.push("Új közlekedési eszköznek minősülhet (≤6 hónap vagy ≤6 000 km): a magyarországi ÁFA-fizetést vizsgálni kell.");
  if (useNet) warnings.push("Nettó (MwSt. ausweisbar) árral számolva, céges vevő: a 27% magyar ÁFA külön kezelendő.");
  if (fx.fallback) warnings.push("Az élő EUR/HUF árfolyam nem volt elérhető, tartalék árfolyammal számolva.");
  if (input.distanceFallback) warnings.push("A távolság légvonal × 1,25 becslés (útvonaltervező nem elérhető).");

  const envDefault = defaultEnvGroup(l);
  const envGroup = overrides.env_group ?? envDefault.group;
  if (overrides.env_group === undefined && !envDefault.certain)
    warnings.push(`Környezetvédelmi osztály feltételezett (${l.euro_norm || "ismeretlen"} → ${envGroup}. oszlop): ellenőrizni.`);

  const mode = overrides.logistics_mode || rates.logistics.default_mode;
  const lines: CostLine[] = [];
  const add = (key: string, label: string, amount: number, group: CostLine["group"], verified: boolean, note?: string) => {
    const isOv = ov[key] !== undefined && ov[key] !== null && !Number.isNaN(ov[key]);
    const final = isOv ? Math.round(ov[key]) : Math.round(amount);
    // an admin override counts as a human-confirmed value
    const v = isOv ? true : verified;
    if (!v) unverified.push(key);
    lines.push({ key, label, amount_huf: final, source: isOv ? "override" : "auto", verified: v, group, note });
  };

  add("vehicle", `Vételár (${useNet ? "nettó" : "bruttó"}, ${fmtEur(vehicleEur)} × ${fx.rate.toFixed(2)})`,
    vehicleEur * fx.rate, "vehicle", true);
  const logEur = logisticsEur(rates, input.distanceKm, mode);
  add("logistics", `Logisztika (${mode === "trailer" ? "trélerrel" : "sofőrrel, ideiglenes rendszámmal"}, ${Math.round(input.distanceKm)} km, ${fmtEur(logEur)})`,
    logEur * fx.rate, "logistics", rates.logistics.verified, rates.logistics.note);
  const rg = regado(l, rates, envGroup, regMonth);
  add("regado", envGroup === 0 ? "Regisztrációs adó (környezetkímélő, mentes)" :
    `Regisztrációs adó (${envGroup}. oszlop, alap ${fmtHuf(rg.base)} × ${rg.mult}, ${rg.months} hó)`, rg.amount, "homologation",
    overrides.env_group !== undefined || envDefault.certain,
    overrides.env_group !== undefined || envDefault.certain ? undefined : "környezetvédelmi osztály feltételezett");
  // a többi honosítási tétel is a honosítás kalkulátor szerint (caradvance.hu/honositas-kalkulator)
  const il = illetek(l, rates, regMonth, envGroup);
  add("illetek", il.amount ? `Vagyonszerzési illeték (${Math.round(l.power_kw)} kW × ${il.rate} Ft/kW)` : "Vagyonszerzési illeték (mentes)", il.amount, "homologation", true);
  const ev = eredetisegFee(l);
  add("eredetiseg", `Eredetiségvizsgálat${ev.cc ? ` (${ev.known ? "" : "kb. "}${ev.cc.toLocaleString("hu-HU")} cm³)` : l.fuel === "electric" ? " (elektromos)" : ""}`, ev.fee, "homologation", true,
    ev.known || l.fuel === "electric" ? undefined : "hengerűrtartalom nem ismert — a kalkulátor alapértékével (1401–2000 cm³) számolva");
  add("okmany", "Okmányok (forgalmi engedély, törzskönyv)", HK.okmany, "homologation", true);
  add("ugyintezes", "Ügyintézési díj", rates.ugyintezes.v, "service", rates.ugyintezes.verified, rates.ugyintezes.note);

  const vehicleHuf = lines.find((x) => x.key === "vehicle")!.amount_huf;
  add("margin", `Caradvance árrés (${(rates.margin.pct * 100).toFixed(1)}%, min. ${fmtHuf(rates.margin.min_huf)})`,
    Math.max(vehicleHuf * rates.margin.pct, rates.margin.min_huf), "margin", rates.margin.verified, rates.margin.note);

  const sum = (g: CostLine["group"][]) => lines.filter((x) => g.includes(x.group)).reduce((a, b) => a + b.amount_huf, 0);
  const marginHuf = sum(["margin"]);
  const internal = sum(["vehicle", "logistics", "homologation", "service"]);
  const raw = internal + marginHuf;
  const total = Math.ceil(raw / 10000) * 10000;
  const rounding = total - raw;

  const regadoHuf = lines.find((x) => x.key === "regado")!.amount_huf;
  const customer_lines = [
    { label: "Az autó vételára Németországban", amount_huf: vehicleHuf },
    { label: "Szállítás Budapestig", amount_huf: sum(["logistics"]) },
  ];
  if (rates.customer_view.separate_regado) {
    customer_lines.push({ label: regadoHuf === 0 && envGroup === 0 ? "Regisztrációs adó (környezetkímélő autó, mentes)" : "Regisztrációs adó", amount_huf: regadoHuf });
    customer_lines.push({ label: "Honosítás, átírás és forgalomba helyezés", amount_huf: sum(["homologation"]) - regadoHuf });
  } else {
    customer_lines.push({ label: "Honosítás, átírás és forgalomba helyezés", amount_huf: sum(["homologation"]) });
  }
  // margin is bundled into the service line and never shown on its own
  // customer lines are shown rounded to 1 000 Ft; the service line absorbs the difference so the lines add up
  for (const x of customer_lines) x.amount_huf = Math.round(x.amount_huf / 1000) * 1000;
  const shown = customer_lines.reduce((a, b) => a + b.amount_huf, 0);
  customer_lines.push({ label: "Teljes körű ügyintézés és szolgáltatási díj", amount_huf: total - shown });

  return {
    fx,
    price_basis: useNet ? "net" : "gross",
    vehicle_eur: vehicleEur,
    lines,
    internal_cost_huf: internal,
    margin_huf: marginHuf + rounding,
    customer_total_huf: total,
    customer_total_eur: Math.round(total / fx.rate),
    customer_lines,
    warnings,
    unverified,
    rate_version: input.rateVersion,
  };
}

export const fmtHuf = (n: number) => new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " Ft";
export const fmtEur = (n: number) => new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(Math.round(n)) + " €";
