import type { Env, Fuel, Listing, Requirements } from "./types";
import { mockGetById, mockSearch } from "./mock";
import { sourceName } from "./am";

export interface ListingSource {
  name: string;
  search(req: Requirements): Promise<Listing[]>;
  getById(idOrUrl: string): Promise<Listing | null>;
}

export function getSource(env: Env): ListingSource {
  switch (sourceName(env)) {
    case "searchapi":
      return searchApiSource(env);
    case "apify":
      return apifySource(env);
    case "manual":
      return { name: "manual", search: async () => [], getById: async () => null };
    default:
      return { name: "mock", search: async () => mockSearch(), getById: async (id) => mockGetById(id) };
  }
}

/** Extract the mobile.de ad id from a listing URL or a bare id. */
export function adIdFrom(input: string): string | null {
  const s = input.trim();
  const m = s.match(/[?&]id=(\d{6,})/) || s.match(/\/(\d{6,})\.html/) || s.match(/^(\d{6,})$/) || s.match(/(\d{4})$/);
  return m ? m[1] : null;
}

const MAKE_IDS: Record<string, number> = {
  "audi": 1900, "bmw": 3500, "mercedes-benz": 17200, "porsche": 20100, "volkswagen": 25200, "volvo": 25100,
  "land rover": 14800, "tesla": 135, "skoda": 22900, "mini": 17500, "lexus": 15200, "toyota": 24100, "cupra": 3,
};

export const FUEL_CODE: Record<Fuel, string> = {
  electric: "ELECTRICITY", petrol: "PETROL", diesel: "DIESEL", hybrid: "HYBRID", phev: "HYBRID_PLUGIN",
};
/** mobile.de vehicle categories (c=) for our body types */
export const BODY_CODE: Record<string, string[]> = {
  estate: ["EstateCar"], suv: ["OffRoad"], sedan: ["Limousine"], hatchback: ["Limousine", "SmallCar"], coupe: ["SportsCar"], convertible: ["Cabrio"], van: ["Van"], pickup: ["OffRoad"],
};
/** full make / model ID list (same as the /auto-rendeles/ form's comparison links) */
import MOBILE_IDS from "./mobile-ids.json";
export { MOBILE_IDS };
const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function mobileIds(make?: string, model?: string): { make?: string; model?: string } {
  if (!make) return {};
  const mk = Object.keys(MOBILE_IDS.makes).find((k) => norm(k) === norm(make));
  const makeId = mk ? (MOBILE_IDS.makes as Record<string, string>)[mk] : MAKE_IDS[make.toLowerCase()] ? String(MAKE_IDS[make.toLowerCase()]) : undefined;
  if (!makeId) return {};
  const models = (mk && (MOBILE_IDS.models as Record<string, Record<string, string>>)[mk]) || {};
  const md = model ? Object.keys(models).find((k) => norm(k) === norm(model)) : undefined;
  return { make: makeId, model: md ? models[md] : undefined };
}

/** mobile.de feature codes (fe=) for must-have equipment; Panorama, HUD and Standheizung checked in a live search 2026-10. Tow bar is its own parameter (tct). */
export const FEATURE_CODE: Record<string, string> = {
  "Panorama-Dach": "PANORAMIC_GLASS_ROOF",
  "Head-Up Display": "HEAD_UP_DISPLAY",
  "Standheizung": "AUXILIARY_HEATING",
  "Navigationssystem": "NAVIGATION_SYSTEM",
  "Sitzheizung": "ELECTRIC_HEATED_SEATS",
  "Schiebedach": "SUNROOF",
  "Allradantrieb": "FOUR_WHEEL_DRIVE",
};

/**
 * Prefilled mobile.de search for a request (button "mobile.de keresés" and the extension helper).
 * Format checked against a live search 2026-10: ms=<makeId>;;;<model>, c=EstateCar, ft, fr, ml, p, fe, dam=false.
 */
export function buildSearchUrl(req: Requirements, maxVehicleEur?: number): string {
  const p = new URLSearchParams({ dam: "false", isSearchRequest: "true", s: "Car", vc: "Car", sb: "p", od: "up", ref: "srp" });
  const v = req.vehicle;
  const model = (v.models[0] || "").replace(/\b(touring|avant|kombi|sportback|limousine|limuzin)\b/gi, "").trim();
  const ids = mobileIds(v.makes[0], v.models[0]) ;
  const idm = ids.model ? ids : mobileIds(v.makes[0], model);
  if (idm.make && idm.model) p.set("ms", `${idm.make};${idm.model};;`);
  else if (ids.make) p.set("ms", `${ids.make};;;${model}`);
  else if (v.makes[0] || v.models[0]) p.set("q", [v.makes[0], v.models[0]].filter(Boolean).join(" "));
  const cats = [...new Set((v.body_types || []).flatMap((b) => BODY_CODE[b] || []))];
  for (const c of cats) p.append("c", c);
  for (const f of [...new Set((v.fuel || []).map((f) => FUEL_CODE[f]).filter(Boolean))]) p.append("ft", f);
  if (v.year_min || v.year_max) p.set("fr", `${v.year_min || ""}:${v.year_max || ""}`);
  if (v.km_min || v.km_max) p.set("ml", `${v.km_min || ""}:${v.km_max || ""}`);
  if (maxVehicleEur && maxVehicleEur > 1000) p.set("p", `:${Math.round(maxVehicleEur / 1000) * 1000}`);
  if (v.gearbox === "automatic") p.set("tr", "AUTOMATIC_GEAR");
  else if (v.gearbox === "manual") p.set("tr", "MANUAL_GEAR");
  if (v.drivetrain === "awd" && !(v.must_have_equipment || []).some((e) => /^allrad/i.test(e))) p.append("fe", "FOUR_WHEEL_DRIVE");

  if ((req.vehicle.must_have_equipment || []).some((e) => /^anhängerkupplung/i.test(e))) p.set("tct", "TRAILER_COUPLING_FIX"); // fixed, detachable or swivelling
  for (const e of req.vehicle.must_have_equipment || []) {
    const code = Object.entries(FEATURE_CODE).find(([k]) => e.toLowerCase().startsWith(k.toLowerCase()))?.[1];
    if (code) p.append("fe", code);
  }
  return `https://suchen.mobile.de/fahrzeuge/search.html?${p.toString()}`;
}

// ---------------------------------------------------------------------------
// Official mobile.de Search API (dealer credentials). Field mapping is tolerant
// and must be verified against the API documentation once credentials exist.
// ---------------------------------------------------------------------------
function searchApiSource(env: Env): ListingSource {
  const auth = "Basic " + btoa(`${env.MOBILE_DE_API_USERNAME}:${env.MOBILE_DE_API_PASSWORD}`);
  const headers = { Authorization: auth, Accept: "application/vnd.de.mobile.api+json" };
  return {
    name: "searchapi",
    async search(req) {
      const p = new URLSearchParams({ "classification": "refdata/classes/Car", "page.size": "60" });
      if (req.vehicle.makes[0]) p.set("make", req.vehicle.makes[0]);
      if (req.vehicle.year_min) p.set("firstRegistrationDate.min", `${req.vehicle.year_min}-01`);
      if (req.vehicle.km_max) p.set("mileage.max", String(req.vehicle.km_max));
      const r = await fetch(`https://services.mobile.de/search-api/search?${p}`, { headers });
      if (!r.ok) throw new Error(`mobile.de Search API ${r.status}`);
      const j: any = await r.json();
      return (j.ads || j.items || []).map(mapApiAd).filter(Boolean) as Listing[];
    },
    async getById(idOrUrl) {
      const id = adIdFrom(idOrUrl);
      if (!id) return null;
      const r = await fetch(`https://services.mobile.de/search-api/ad/${id}`, { headers });
      return r.ok ? mapApiAd(await r.json()) : null;
    },
  };
}

function mapApiAd(a: any): Listing | null {
  if (!a) return null;
  const fuelMap: Record<string, Fuel> = { ELECTRICITY: "electric", PETROL: "petrol", DIESEL: "diesel", HYBRID: "hybrid", HYBRID_DIESEL: "hybrid" };
  const fr = String(a.firstRegistration || a.firstRegistrationDate || "");
  return normalizeListing({
    ad_id: String(a.mobileAdId || a.id),
    url: a.detailPageUrl || `https://suchen.mobile.de/fahrzeuge/details.html?id=${a.mobileAdId || a.id}`,
    make: a.make?.localized || a.make, model: a.model?.localized || a.model, variant: a.modelDescription,
    price_gross_eur: Number(a.price?.consumerPriceGross?.amount ?? a.price?.consumerPriceGross ?? a.price?.gross),
    price_net_eur: Number(a.price?.consumerPriceNet?.amount ?? a.price?.consumerPriceNet ?? 0) || null,
    vat_reclaimable: !!(a.price?.vatRate || a.vatReclaimable),
    first_registration: fr.length === 6 ? `${fr.slice(0, 4)}-${fr.slice(4)}` : fr.slice(0, 7),
    km: Number(a.mileage), power_kw: Number(a.power), fuel: fuelMap[a.fuel] || "petrol",
    gearbox: String(a.gearbox || "").includes("AUTOMATIC") ? "automatic" : "manual",
    color: a.exteriorColor?.localized || a.exteriorColor, equipment: (a.features || []).map((f: any) => f.localized || f),
    accident_free: a.damageUnrepaired === false ? true : a.accidentDamaged === false ? true : null,
    seller: {
      type: a.seller?.type === "FSBO" ? "private" : "dealer", name: a.seller?.companyName || "",
      city: a.seller?.address?.city || "", zip: a.seller?.address?.zipcode, country: a.seller?.address?.countryCode || "DE",
      lat: a.seller?.coordinates?.latitude ?? null, lon: a.seller?.coordinates?.longitude ?? null,
    },
    images: (a.images || []).map((i: any) => i.uri ? `https://${String(i.uri).replace(/^https?:\/\//, "")}?rule=mo-1600` : i.url || i),
    description_de: a.description,
  });
}

// ---------------------------------------------------------------------------
// Apify fallback (run-sync, dataset items). Mapping tolerant of common actor outputs.
// ---------------------------------------------------------------------------
function apifySource(env: Env): ListingSource {
  const run = async (input: unknown) => {
    const r = await fetch(`https://api.apify.com/v2/acts/${env.APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${env.APIFY_TOKEN}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    });
    if (!r.ok) throw new Error(`Apify ${r.status}`);
    return (await r.json()) as any[];
  };
  return {
    name: "apify",
    async search(req) {
      const items = await run({ startUrls: [{ url: buildSearchUrl(req) }], maxItems: 60, scrapeDetails: true });
      return items.map(mapLooseItem).filter(Boolean) as Listing[];
    },
    async getById(idOrUrl) {
      const id = adIdFrom(idOrUrl);
      if (!id) return null;
      const items = await run({ startUrls: [{ url: `https://suchen.mobile.de/fahrzeuge/details.html?id=${id}` }], maxItems: 1, scrapeDetails: true });
      return items[0] ? mapLooseItem(items[0]) : null;
    },
  };
}

function mapLooseItem(x: any): Listing | null {
  try {
    return normalizeListing(x);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Normalisation + validation (used for every source, and server-side for the extension)
// ---------------------------------------------------------------------------
const ALLOWED_IMAGE_HOSTS = [/(^|\.)classistatic\.de$/, /(^|\.)mobile\.de$/];

export class ListingValidationError extends Error {
  constructor(public problems: string[]) { super(problems.join("; ")); }
}

export function normalizeListing(x: any, opts: { allowLocalImages?: boolean } = {}): Listing {
  const problems: string[] = [];
  const num = (v: any) => (v === null || v === undefined || v === "" ? NaN : Number(String(v).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".")));
  const price = num(x.price_gross_eur ?? x.price);
  const km = num(x.km ?? x.mileage);
  const kw = num(x.power_kw ?? x.powerKw);
  let fr = String(x.first_registration ?? x.firstRegistration ?? "").trim();
  const mm = fr.match(/^(\d{1,2})\/(\d{4})$/);
  if (mm) fr = `${mm[2]}-${mm[1].padStart(2, "0")}`;
  const thisYear = new Date().getUTCFullYear();

  if (!(price >= 1000 && price <= 2_000_000)) problems.push("price_gross_eur");
  if (!(km >= 0 && km <= 600_000)) problems.push("km");
  if (!(kw >= 20 && kw <= 1200)) problems.push("power_kw");
  if (!/^\d{4}-\d{2}$/.test(fr) || Number(fr.slice(0, 4)) < 1990 || Number(fr.slice(0, 4)) > thisYear + 1) problems.push("first_registration");
  const seller = x.seller || {};
  if (!seller.city && !(seller.lat && seller.lon)) problems.push("seller_location");
  if (!x.make || !x.model) problems.push("make_model");
  if (problems.length) throw new ListingValidationError(problems);

  const fuelIn = String(x.fuel || "").toLowerCase();
  const fuel: Fuel = /elek|electr/.test(fuelIn) ? "electric" : /plug|phev/.test(fuelIn) ? "phev" : /hybr/.test(fuelIn) ? "hybrid"
    : /dies/.test(fuelIn) ? "diesel" : "petrol";
  const images = (Array.isArray(x.images) ? x.images : []).map(String).filter((u: string) => {
    if (opts.allowLocalImages && u.startsWith("/")) return true;
    try { const h = new URL(u).hostname; return ALLOWED_IMAGE_HOSTS.some((re) => re.test(h)); } catch { return false; }
  }).slice(0, 40);

  return {
    ad_id: String(x.ad_id ?? x.id),
    url: String(x.url || ""),
    make: String(x.make).trim(),
    model: String(x.model).trim(),
    variant: x.variant ? String(x.variant).trim() : undefined,
    title: String(x.title || `${x.make} ${x.model} ${x.variant || ""}`).trim(),
    price_gross_eur: Math.round(price),
    price_net_eur: Number.isFinite(num(x.price_net_eur)) ? Math.round(num(x.price_net_eur)) : null,
    vat_reclaimable: !!x.vat_reclaimable,
    price_rating: x.price_rating ?? null,
    first_registration: fr,
    km: Math.round(km),
    power_kw: Math.round(kw),
    fuel,
    gearbox: /man|schalt/i.test(String(x.gearbox || "")) ? "manual" : "automatic",
    drivetrain: x.drivetrain ?? null,
    body: x.body ?? null,
    color: x.color ?? null,
    co2_g_km: Number.isFinite(num(x.co2_g_km)) ? num(x.co2_g_km) : null,
    euro_norm: x.euro_norm ?? null,
    battery_kwh: Number.isFinite(num(x.battery_kwh)) ? num(x.battery_kwh) : null,
    range_km: Number.isFinite(num(x.range_km)) ? num(x.range_km) : null,
    equipment: Array.isArray(x.equipment) ? [...new Set(x.equipment.map((e: any) => String(e).trim()).filter(Boolean))] as string[] : [],
    accident_free: x.accident_free ?? null,
    previous_owners: Number.isFinite(num(x.previous_owners)) ? num(x.previous_owners) : null,
    service_book: x.service_book ?? null,
    seller: {
      type: seller.type === "private" ? "private" : "dealer",
      name: String(seller.name || ""),
      rating: seller.rating ?? null,
      phone: seller.phone ?? null,
      zip: seller.zip ?? null,
      city: String(seller.city || ""),
      country: String(seller.country || "DE"),
      lat: seller.lat != null ? Number(seller.lat) : null,
      lon: seller.lon != null ? Number(seller.lon) : null,
    },
    images,
    description_de: x.description_de ? String(x.description_de).slice(0, 20000) : undefined,
    fetched_at: new Date().toISOString(),
  };
}
