export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  IMAGES?: R2Bucket; // optional: without R2 (test account) images go to KV
  NOTIFY?: { send(msg: unknown): Promise<void> };
  ENVIRONMENT: string;
  MOBILE_DE_SOURCE: string;
  PUBLIC_BASE_URL: string;
  ADMIN_NOTIFY_TO: string;
  NOTIFY_FROM: string;
  AI_MODEL: string;
  DEPOT_LAT: string;
  DEPOT_LON: string;
  DEPOT_LABEL: string;
  OFFER_VALID_DAYS: string;
  EXTENSION_ID: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  // secrets
  ADMIN_PASSWORD?: string;
  ADMIN_PASSWORD_SHA256?: string; // test: hash in wrangler.toml vars, so no secret has to be entered anywhere
  ANTHROPIC_API_KEY?: string;
  MOBILE_DE_API_USERNAME?: string;
  MOBILE_DE_API_PASSWORD?: string;
  APIFY_TOKEN?: string;
  APIFY_ACTOR_ID?: string;
  ORS_API_KEY?: string;
  NOTION_TOKEN?: string;
  TOKEN_PEPPER?: string;
}

export type Fuel = "petrol" | "diesel" | "hybrid" | "phev" | "electric";
export type Lang = "hu" | "de" | "sk" | "cs" | "pl" | "en";

export interface Seller {
  type: "dealer" | "private";
  name: string;
  rating?: number | null;
  phone?: string | null;
  zip?: string | null;
  city: string;
  country: string;
  lat?: number | null;
  lon?: number | null;
}

export interface Listing {
  ad_id: string;
  url: string;
  make: string;
  model: string;
  variant?: string;
  title: string;
  price_gross_eur: number;
  price_net_eur?: number | null;
  vat_reclaimable: boolean;
  price_rating?: "very_good" | "good" | "fair" | "increased" | "high" | null;
  first_registration: string; // YYYY-MM
  km: number;
  power_kw: number;
  fuel: Fuel;
  gearbox: "automatic" | "manual";
  drivetrain?: "awd" | "rwd" | "fwd" | null;
  body?: string | null;
  color?: string | null;
  co2_g_km?: number | null;
  euro_norm?: string | null;
  battery_kwh?: number | null;
  range_km?: number | null;
  equipment: string[]; // mobile.de canonical German names
  accident_free?: boolean | null;
  previous_owners?: number | null;
  service_book?: boolean | null;
  seller: Seller;
  images: string[];
  description_de?: string;
  fetched_at: string;
}

export interface Requirements {
  customer: { name?: string; email?: string; phone?: string; language: Lang; company?: string };
  vehicle: {
    makes: string[];
    models: string[];
    body_types: string[];
    fuel: Fuel[];
    gearbox?: "automatic" | "manual";
    year_min?: number;
    year_max?: number;
    km_max?: number;
    power_kw_min?: number;
    budget_huf_max?: number;
    budget_eur_max?: number;
    budget_is_total_delivered?: boolean;
    must_have_equipment: string[];
    nice_to_have_equipment: string[];
    colors_preferred: string[];
    colors_excluded: string[];
    drivetrain?: "awd" | "rwd" | "fwd";
    vat_deductible_needed?: boolean;
  };
  urgency?: string;
  notes?: string;
  raw_summary: string;
  confidence: number;
  missing_critical_fields: string[];
  flags: string[];
}

export interface Section {
  key: string;
  headline: string;
  body: string;
  image_index: number;
}

export interface CostLine {
  key: string;
  label: string;
  amount_huf: number;
  source: "auto" | "override";
  verified: boolean;
  group: "vehicle" | "logistics" | "homologation" | "service" | "margin";
  note?: string;
}

export interface CostResult {
  fx: { rate: number; date: string; fallback: boolean };
  price_basis: "gross" | "net";
  vehicle_eur: number;
  lines: CostLine[];
  internal_cost_huf: number;
  margin_huf: number;
  customer_total_huf: number;
  customer_total_eur: number;
  customer_lines: { label: string; amount_huf: number }[];
  warnings: string[];
  unverified: string[];
  rate_version: number;
}
