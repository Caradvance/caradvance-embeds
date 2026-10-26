// Rate configuration. Stored versioned in D1 (am_rates); this is only the seed.
// Every value with verified:false is a TEST placeholder ("ELLENŐRIZNI 2026") and
// blocks publishing an offer that uses it until an admin confirms it in /admin/settings.

export interface Rated { v: number; verified: boolean; note?: string }

export interface RateConfig {
  regado: {
    verified: boolean;
    source: string;
    kw_upper: number[]; // upper bound of each kW band, last = Infinity (stored as 99999)
    // columns = környezetvédelmi osztály groups 1..5
    table: number[][];
    // [months_threshold, multiplier]
    age_multipliers: [number, number][];
    electric_exempt: boolean;
  };
  illetek: {
    verified: boolean;
    note: string;
    kw_upper: number[];
    // rows = age bands (0-3 y, 4-8 y, 8+ y), columns = kW bands; HUF per kW
    huf_per_kw: number[][];
    age_upper_years: number[];
    electric_exempt: Rated;
  };
  fees: {
    eredetiseg: Rated;
    muszaki: Rated;
    forgalomba: Rated;   // forgalomba helyezés + okmányok (forgalmi, törzskönyv)
    rendszam: Rated;
  };
  logistics: {
    verified: boolean;
    note: string;
    default_mode: "trailer" | "driver";
    trailer_bands_eur: [number, number][]; // [max_km, eur]
    driver_eur_per_km: number;
    driver_fixed_eur: number;
    export_plates_eur: number;
  };
  ugyintezes: Rated;
  margin: { pct: number; min_huf: number; verified: boolean; note?: string };
  fx_fallback: Rated;
  customer_view: {
    // which internal groups are shown as separate customer lines
    separate_regado: boolean;
  };
  scoring: Record<string, number>;
}

const T = "TESZT ÉRTÉK – ELLENŐRIZNI 2026";

export const DEFAULT_RATES: RateConfig = {
  regado: {
    verified: true,
    source: "NAV Személygépjármű Regadó kalkulátor 2026.01.01 (feltöltött xlsx, projekt: honositas-kalkulator-build-2026-09-17)",
    kw_upper: [80, 100, 120, 140, 180, 250, 99999],
    table: [
      [47000, 70500, 282000, 564000, 1128000],
      [70500, 105750, 423000, 846000, 1692000],
      [94000, 141000, 564000, 1128000, 2256000],
      [141000, 211500, 846000, 1692000, 3384000],
      [188000, 282000, 1128000, 2256000, 4512000],
      [282000, 423000, 1692000, 3384000, 6768000],
      [423000, 634500, 2538000, 5076000, 10152000],
    ],
    age_multipliers: [
      [0, 1.0], [1, 0.97], [3, 0.92], [5, 0.87], [7, 0.82], [13, 0.77], [19, 0.72], [25, 0.67],
      [31, 0.62], [37, 0.55], [49, 0.47], [61, 0.41], [73, 0.35], [85, 0.3], [97, 0.26],
      [109, 0.22], [121, 0.19], [133, 0.16], [145, 0.14], [157, 0.12], [169, 0.1],
    ],
    electric_exempt: true, // 5E / 5Z környezetkímélő: 0 Ft (NAV tábla)
  },
  illetek: {
    verified: false,
    note: `${T}: vagyonszerzési illeték kW × életkor sávok. A számok helyőrzők, a hatályos Itv. táblával egyeztetni.`,
    kw_upper: [40, 80, 120, 99999],
    age_upper_years: [3, 8, 999],
    huf_per_kw: [
      [550, 650, 750, 850],
      [450, 550, 650, 750],
      [300, 450, 550, 650],
    ],
    electric_exempt: { v: 1, verified: false, note: `${T}: elektromos (5E) autó illetékmentessége` },
  },
  fees: {
    eredetiseg: { v: 35000, verified: false, note: T },
    muszaki: { v: 45000, verified: false, note: T },
    forgalomba: { v: 40000, verified: false, note: `${T} (forgalmi, törzskönyv, ügyintézés)` },
    rendszam: { v: 15000, verified: false, note: T },
  },
  logistics: {
    verified: false,
    note: `${T}: Caradvance saját szállítási díjai`,
    default_mode: "trailer",
    trailer_bands_eur: [[400, 650], [700, 850], [1000, 1050], [1400, 1250], [99999, 1500]],
    driver_eur_per_km: 0.9,
    driver_fixed_eur: 250,
    export_plates_eur: 120,
  },
  ugyintezes: { v: 150000, verified: false, note: `${T}: ügyintézési díj alapérték` },
  margin: { pct: 0.03, min_huf: 390000, verified: false, note: `${T}: üzleti döntés, Marc erősítse meg` },
  fx_fallback: { v: 395, verified: false, note: "Csak akkor használjuk, ha az ECB/Frankfurter árfolyam nem érhető el" },
  customer_view: { separate_regado: true },
  scoring: {
    price: 30, equipment: 25, km_age: 15, condition: 10, seller: 8, distance: 7, images: 5,
  },
};

/** Paths of every unverified value, for the admin UI and the publish gate. */
export function unverifiedPaths(r: RateConfig): string[] {
  const out: string[] = [];
  if (!r.regado.verified) out.push("regado");
  if (!r.illetek.verified) out.push("illetek");
  if (!r.illetek.electric_exempt.verified) out.push("illetek.electric_exempt");
  for (const [k, f] of Object.entries(r.fees)) if (!f.verified) out.push(`fees.${k}`);
  if (!r.logistics.verified) out.push("logistics");
  if (!r.ugyintezes.verified) out.push("ugyintezes");
  if (!r.margin.verified) out.push("margin");
  return out;
}

export function setVerified(r: RateConfig, path: string, value: boolean): RateConfig {
  const c: any = structuredClone(r);
  const parts = path.split(".");
  let node = c;
  for (const p of parts) node = node?.[p];
  if (node && typeof node === "object" && "verified" in node) node.verified = value;
  return c;
}

export async function loadRates(db: D1Database): Promise<{ version: number; rates: RateConfig }> {
  const row = await db
    .prepare("SELECT version, config_json FROM am_rates ORDER BY version DESC LIMIT 1")
    .first<{ version: number; config_json: string }>();
  if (row) return { version: row.version, rates: JSON.parse(row.config_json) };
  const now = new Date().toISOString();
  const res = await db
    .prepare("INSERT INTO am_rates (config_json, author, note, created_at) VALUES (?, ?, ?, ?)")
    .bind(JSON.stringify(DEFAULT_RATES), "system", "seed", now)
    .run();
  return { version: Number(res.meta.last_row_id), rates: DEFAULT_RATES };
}

export async function saveRates(db: D1Database, rates: RateConfig, author: string, note: string) {
  const res = await db
    .prepare("INSERT INTO am_rates (config_json, author, note, created_at) VALUES (?, ?, ?, ?)")
    .bind(JSON.stringify(rates), author, note, new Date().toISOString())
    .run();
  return Number(res.meta.last_row_id);
}
