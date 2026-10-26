import type { CostLine, CostResult, Listing, Requirements } from "../types";
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

/** Default NAV column for a listing. Only electric and hybrid are certain; the rest is flagged. */
export function defaultEnvGroup(l: Listing): { group: number; certain: boolean } {
  if (l.fuel === "electric") return { group: 0, certain: true };
  if (l.fuel === "hybrid" || l.fuel === "phev") return { group: 1, certain: true };
  const e = (l.euro_norm || "").toLowerCase();
  if (e.includes("6")) return { group: 2, certain: false };
  if (e.includes("5")) return { group: 3, certain: false };
  if (e.includes("4")) return { group: 4, certain: false };
  return { group: 5, certain: false };
}

export function regado(l: Listing, rates: RateConfig, envGroup: number, regMonth: string) {
  if (envGroup === 0 && rates.regado.electric_exempt) return { amount: 0, base: 0, months: 0, mult: 0 };
  const band = rates.regado.kw_upper.findIndex((u) => Math.round(l.power_kw) <= u);
  const base = rates.regado.table[band][envGroup - 1];
  const months = monthsSince(l.first_registration, regMonth);
  const mult = ageMultiplier(months, rates.regado.age_multipliers);
  return { amount: Math.round(base * mult), base, months, mult };
}

export function illetek(l: Listing, rates: RateConfig, regMonth: string) {
  const r = rates.illetek;
  if (l.fuel === "electric" && r.electric_exempt.v) return 0;
  const ageYears = Number(regMonth.slice(0, 4)) - Number(l.first_registration.slice(0, 4));
  const row = r.age_upper_years.findIndex((u) => ageYears <= u);
  const col = r.kw_upper.findIndex((u) => Math.round(l.power_kw) <= u);
  return Math.round(l.power_kw) * r.huf_per_kw[row][col];
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
    `Regisztrációs adó (alap ${fmtHuf(rg.base)} × ${rg.mult}, ${rg.months} hó)`, rg.amount, "homologation",
    rates.regado.verified && (overrides.env_group !== undefined || envDefault.certain),
    overrides.env_group !== undefined || envDefault.certain ? undefined : "környezetvédelmi osztály feltételezett");
  add("eredetiseg", "Eredetiségvizsgálat", rates.fees.eredetiseg.v, "homologation", rates.fees.eredetiseg.verified, rates.fees.eredetiseg.note);
  add("muszaki", "Honosítási műszaki vizsga", rates.fees.muszaki.v, "homologation", rates.fees.muszaki.verified, rates.fees.muszaki.note);
  add("forgalomba", "Forgalomba helyezés és okmányok", rates.fees.forgalomba.v, "homologation", rates.fees.forgalomba.verified, rates.fees.forgalomba.note);
  add("rendszam", "Rendszámtábla", rates.fees.rendszam.v, "homologation", rates.fees.rendszam.verified, rates.fees.rendszam.note);
  add("illetek", "Vagyonszerzési illeték (átírás)", illetek(l, rates, regMonth), "homologation",
    rates.illetek.verified && (l.fuel !== "electric" || rates.illetek.electric_exempt.verified), rates.illetek.note);
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
