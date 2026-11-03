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

/** Extract the ad id from a listing URL or a bare id (mobile.de: number; AutoScout24: UUID at the end of the URL). */
export function adIdFrom(input: string): string | null {
  const s = input.trim();
  const as = s.match(/autoscout24\.[a-z.]+\/[^?#]*?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (as) return as[1].toLowerCase();
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

/** keys the structured request owns (staff can edit them) — the customer's original values are not re-added */
const MOBILE_OWNED = new Set(["ms", "q", "fr", "ml", "p", "tr", "dam", "s", "vc", "isSearchRequest", "sb", "od", "ref", "pageNumber"]);
const MOBILE_MULTI = new Set(["c", "ft", "fe", "ecol", "icol", "it"]);
/** The website form's exact mobile.de filters (colours, upholstery, features, doors, seats, owners, emission class …) on top of the structured search. */
export function applyMobileExtra(p: URLSearchParams, extra?: string) {
  if (!extra) return;
  const ex = new URLSearchParams(extra);
  for (const [k, val] of ex) {
    if (!val) continue;
    if (k === "ms") { // a make our ID list does not know, or the same make / model with the customer's model description
      if (!p.has("ms")) { p.delete("q"); p.set("ms", val); }
      else { const b = String(p.get("ms")).split(";"), e = val.split(";"); if (b[0] === e[0] && (!b[1] || b[1] === e[1]) && e[3]) p.set("ms", val); }
      continue;
    }
    if (k === "tr") { if (!p.has("tr")) p.set("tr", val); continue; } // e.g. semi-automatic
    if (MOBILE_OWNED.has(k)) continue;
    if (MOBILE_MULTI.has(k)) { if (!p.getAll(k).includes(val)) p.append(k, val); }
    else if (!p.has(k)) p.set(k, val);
  }
}
/** Only the mobile.de filter part of a search URL (for Requirements.vehicle.mobile_extra). */
export function mobileExtraFrom(url?: string): string | undefined {
  try {
    const u = new URL(String(url || ""));
    if (!/(^|\.)mobile\.de$/i.test(u.hostname)) return undefined;
    const out = new URLSearchParams();
    for (const [k, v] of u.searchParams) if (v && !["p", "s", "vc", "isSearchRequest", "sb", "od", "ref", "pageNumber", "dam"].includes(k)) out.append(k, v.slice(0, 80));
    const s = out.toString(); return s ? s.slice(0, 1500) : undefined;
  } catch { return undefined; }
}

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
  if (v.drivetrain === "awd" && !/(^|&)dt=/.test(v.mobile_extra || "") && !(v.must_have_equipment || []).some((e) => /^allrad/i.test(e))) p.append("fe", "FOUR_WHEEL_DRIVE");

  if ((req.vehicle.must_have_equipment || []).some((e) => /^anhängerkupplung/i.test(e))) p.set("tct", "TRAILER_COUPLING_FIX"); // fixed, detachable or swivelling
  for (const e of req.vehicle.must_have_equipment || []) {
    const code = Object.entries(FEATURE_CODE).find(([k]) => e.toLowerCase().startsWith(k.toLowerCase()))?.[1];
    if (code) p.append("fe", code);
  }
  applyMobileExtra(p, v.mobile_extra);
  return `https://suchen.mobile.de/fahrzeuge/search.html?${p.toString()}`;
}

/** Listing portal of a URL (for labels: „mobile.de hirdetés”, „AutoScout24 hirdetés”). */
export function portalOf(url?: string): { key: "mobile" | "as24" | ""; name: string } {
  const u = String(url || "");
  if (/^https:\/\/([a-z0-9-]+\.)*autoscout24\.[a-z.]+\//i.test(u)) return { key: "as24", name: "AutoScout24" };
  if (/^https:\/\/([a-z0-9-]+\.)*mobile\.de\//i.test(u)) return { key: "mobile", name: "mobile.de" };
  return { key: "", name: "" };
}

/* AutoScout24 felszereltség-nevek → a mobile.de-s kanonikus nevek (equipment.json), hogy a fordítás és az igény-egyezés is működjön */
import EQUIP_JSON from "./equipment.json";
const AS24_EQ: Record<string, string> = {
  "Allrad": "Allradantrieb", "Alufelgen": "Leichtmetallfelgen", "Antiblockiersystem": "ABS", "DAB-Radio": "Radio DAB", "Elektrische Fensterheber": "Elektr. Fensterheber",
  "Elektrische Heckklappe": "Elektr. Heckklappe", "Elektrische Seitenspiegel": "Elektr. Seitenspiegel", "Elektrische Sitze": "Elektr. Sitzeinstellung",
  "Elektrische Sitzeinstellung, hinten": "Elektr. Sitzeinstellung, hinten", "Geschwindigkeits-begrenzungsanlage": "Geschwindigkeitsbegrenzer", "Getönte Scheiben": "Abgedunkelte Scheiben",
  "Innenspiegel automatisch abblendend": "Innenspiegel autom. abblendend", "Müdigkeitswarnsystem": "Müdigkeitswarner", "Reifendruckkontrollsystem": "Reifendruckkontrolle",
  "Schlüssellose Zentralverriegelung": "Schlüssellose Zentralverriegelung (Keyless)", "Start/Stop-Automatik": "Start/Stopp-Automatik", "Wegfahrsperre": "Elektr. Wegfahrsperre",
  "Zentralverriegelung mit Funkfernbedienung": "Zentralverriegelung", "Bi-Xenon Scheinwerfer": "Xenonscheinwerfer", "CD": "CD-Spieler", "Radio": "Tuner/Radio", "Taxi oder Mietwagen": "Taxi",
  "Voll-LED Scheinwerfer": "LED-Scheinwerfer",
};
const EQ_KEYS: Record<string, string> = Object.fromEntries(Object.keys((EQUIP_JSON as any).map || {}).map((k) => [k.toLowerCase().replace(/[^a-z0-9äöüß]/g, ""), k]));
export function as24Equip(e: string): string {
  if (AS24_EQ[e]) return AS24_EQ[e];
  const al = e.match(/^Alufelgen\s*(\(.*\))?$/i); if (al) return "Leichtmetallfelgen" + (al[1] ? " " + al[1] : "");
  return EQ_KEYS[e.toLowerCase().replace(/[^a-z0-9äöüß]/g, "")] || e;
}

/* ---------------- AutoScout24 keresés (a /lst/<márka>/<modell> útvonal és a szűrők — élő kereséssel ellenőrizve 2026-11) ---------------- */
export const AS24 = {
  fuel: { petrol: "B", diesel: "D", electric: "E", hybrid: "2,3", phev: "2,3" } as Record<Fuel, string>,
  body: { suv: "4", estate: "5", sedan: "6", hatchback: "1", coupe: "3", convertible: "2", van: "12", pickup: "4" } as Record<string, string>,
  eq: { "Anhängerkupplung": "20", "Panorama-Dach": "50", "Head-Up Display": "123", "Standheizung": "52", "Navigationssystem": "23", "Sitzheizung": "34", "Schiebedach": "4", "Allradantrieb": "11", "Luftfederung": "144", "Massagesitze": "145", "360° Kamera": "187", "Abstandstempomat": "133" } as Record<string, string>,
  countries: { D: "Németország", A: "Ausztria", "D,A": "Németország + Ausztria", "A,B,D,E,F,I,L,NL": "Európa (AS24 összes ország)" } as Record<string, string>,
};
/** a márka / modell az AutoScout24 útvonalában: „mercedes-benz/c-klasse”, „bmw/3er”, „bmw/x5”, „land-rover/range-rover-sport” */
export function as24Slug(make?: string, model?: string): string {
  const sl = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let mk = sl(make || "");
  if (mk === "vw") mk = "volkswagen";
  if (mk === "mercedes") mk = "mercedes-benz";
  if (!mk) return "";
  let md = String(model || "").replace(/\b(touring|avant|kombi|sportback|limousine|limuzin|sedan|gran coupe|coupe|cabrio|kabrio|t-modell)\b/gi, " ").replace(/\s+/g, " ").trim();
  md = md.replace(/^(\d)\s*-?\s*(as|es|ös|os|er|series)\b/i, "$1er").replace(/^([a-z]{1,3})\s*-?\s*(osztály|osztaly|klasse|class)\b/i, "$1-klasse");
  const t = md.split(" ");
  if (/^\d{3}[a-z]{1,2}$/i.test(t[0]) && /bmw/.test(mk)) t[0] = t[0].replace(/[a-z]+$/i, ""); // 320d → 320
  if (t.length > 1 && /^[\d.]+[a-z]{0,2}$/i.test(t[1]) && !/^(model|range|id\.?)$/i.test(t[0])) t.length = 1; // GLC 300 → glc
  md = sl(t.join(" "));
  return md ? `${mk}/${md}` : mk;
}
export function buildAs24SearchUrl(req: Requirements, maxVehicleEur?: number, countries = "D"): string {
  const v = req.vehicle;
  const p = new URLSearchParams({ atype: "C", cy: countries, damaged_listing: "exclude", desc: "0", sort: "price", powertype: "kw", ustate: "N,U" });
  const f = [...new Set((v.fuel || []).flatMap((x) => (AS24.fuel[x] || "").split(",")).filter(Boolean))];
  if (f.length) p.set("fuel", f.join(","));
  const b = [...new Set((v.body_types || []).map((x) => AS24.body[x]).filter(Boolean))];
  if (b.length) p.set("body", b.join(","));
  if (v.year_min) p.set("fregfrom", String(v.year_min));
  if (v.year_max) p.set("fregto", String(v.year_max));
  if (v.km_min) p.set("kmfrom", String(v.km_min));
  if (v.km_max) p.set("kmto", String(v.km_max));
  if (maxVehicleEur && maxVehicleEur > 1000) p.set("priceto", String(Math.round(maxVehicleEur / 1000) * 1000));
  if (v.gearbox === "automatic") p.set("gear", "A"); else if (v.gearbox === "manual") p.set("gear", "M");
  const eq = new Set<string>();
  for (const e of v.must_have_equipment || []) { const c = Object.entries(AS24.eq).find(([k]) => e.toLowerCase().startsWith(k.toLowerCase()))?.[1]; if (c) eq.add(c); }
  if (v.drivetrain === "awd") eq.add("11");
  if (eq.size) p.set("eq", [...eq].join(","));
  const path = as24Slug(v.makes[0], v.models[0]);
  return `https://www.autoscout24.de/lst${path ? "/" + path : ""}?${p.toString().replace(/%2C/g, ",")}`;
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
const ALLOWED_IMAGE_HOSTS = [/(^|\.)classistatic\.de$/, /(^|\.)mobile\.de$/, /(^|\.)autoscout24\.net$/];

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
    equipment: Array.isArray(x.equipment) ? [...new Set(x.equipment.map((e: any) => portalOf(String(x.url || "")).key === "as24" ? as24Equip(String(e).trim()) : String(e).trim()).filter(Boolean))] as string[] : [],
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
