import type { Env, Requirements } from "../types";
import { getRequest, publishBlockers, slotViews, type CarView } from "./engine";
import { transition } from "./status";
import { getSetting, logEvent, newId, newToken, nowIso } from "./util";
import { groupEquipment, equipHu } from "./ai/describe";
import { mockImageSvg } from "./sources/mock";
import type { PublicCar, PublicOffer } from "../views/offer";

export const DEFAULT_CONTACT = {
  name: "Vadnai Zsombor",
  title: "Értékesítési vezető",
  phone: "+36 30 233 6060",
  whatsapp: "https://wa.me/36302336060",
  email: "info@caradvance.hu",
};

const FUEL_HU: Record<string, string> = { electric: "Elektromos", phev: "Plug-in hibrid", hybrid: "Hibrid", diesel: "Dízel", petrol: "Benzin" };
const BODY_HU: Record<string, string> = { estate: "Kombi", suv: "SUV", sedan: "Limuzin", coupe: "Kupé", convertible: "Kabrió", van: "Egyterű", hatchback: "Ferdehátú" };

export function firstName(name: string | undefined, lang: string) {
  if (!name) return lang === "de" ? "" : "";
  const p = name.trim().split(/\s+/);
  // Hungarian order: family name first
  return lang === "hu" ? p[p.length - 1] : p[0];
}

export function chipsFor(req: Requirements): string[] {
  const v = req.vehicle;
  const c: string[] = [];
  if (v.makes.length || v.models.length) c.push([v.makes[0], v.models[0]].filter(Boolean).join(" "));
  v.fuel.forEach((f) => c.push(FUEL_HU[f] || f));
  v.body_types.forEach((b) => c.push(BODY_HU[b] || b));
  if (v.gearbox === "automatic") c.push("Automata");
  if (v.year_min) c.push(`${v.year_min}-től`);
  if (v.km_max) c.push(`max. ${v.km_max.toLocaleString("hu-HU")} km`);
  if (v.budget_huf_max) c.push(`Keret ≈ ${(v.budget_huf_max / 1e6).toLocaleString("hu-HU")} M Ft`);
  else if (v.budget_eur_max) c.push(`Keret ≈ ${v.budget_eur_max.toLocaleString("de-DE")} €`);
  v.must_have_equipment.forEach((e) => c.push(equipHu(e).hu));
  return c.filter(Boolean);
}

export function toPublicCar(cv: CarView, req: Requirements, images: string[]): PublicCar {
  const l = cv.listing;
  const wanted = [...req.vehicle.must_have_equipment, ...req.vehicle.nice_to_have_equipment];
  return {
    cid: cv.candidate.id,
    slot: cv.candidate.slot!,
    positioning: cv.candidate.positioning,
    title: l.title,
    make: l.make,
    model: l.model,
    variant: l.variant,
    first_registration: l.first_registration,
    km: l.km,
    power_kw: l.power_kw,
    fuel: l.fuel,
    gearbox: l.gearbox,
    drivetrain: l.drivetrain,
    color: l.color,
    battery_kwh: l.battery_kwh,
    range_km: l.range_km,
    previous_owners: l.previous_owners,
    accident_free: l.accident_free,
    service_book: l.service_book,
    equipment_count: l.equipment.length,
    equipment: groupEquipment(l.equipment),
    key_equipment: wanted.filter((e) => l.equipment.includes(e)).map((e) => equipHu(e).hu),
    city: l.seller.city,
    country: l.seller.country,
    distance_km: cv.distanceKm,
    images,
    sections: cv.sections || [],
    customer_lines: cv.costs.customer_lines,
    total_huf: cv.costs.customer_total_huf,
    total_eur: cv.costs.customer_total_eur,
  };
}

export async function buildPublicOffer(env: Env, requestId: string, cars: CarView[], req: Requirements, offerNo: string, validUntil: Date, imageMap?: Map<string, string[]>): Promise<PublicOffer> {
  const contact = await getSetting(env, "contact", DEFAULT_CONTACT);
  const lang = req.customer.language || "hu";
  const fx = cars[0]?.costs.fx || { rate: 0, date: "" };
  return {
    offer_no: offerNo,
    language: lang,
    customer_name: req.customer.name || "",
    first_name: firstName(req.customer.name, lang) || (lang === "de" ? "" : ""),
    chips: chipsFor(req),
    contact,
    valid_until: validUntil.toLocaleDateString(lang === "de" ? "de-DE" : "hu-HU", { timeZone: "Europe/Budapest", year: "numeric", month: "long", day: "numeric" }),
    fx: { rate: fx.rate, date: fx.date },
    wanted_equipment: [...req.vehicle.must_have_equipment, ...req.vehicle.nice_to_have_equipment].map((e) => equipHu(e).hu),
    cars: cars.sort((a, b) => a.candidate.slot! - b.candidate.slot!).map((cv) => toPublicCar(cv, req, imageMap?.get(cv.candidate.id) || cv.listing.images)),
  };
}

/** R2 when bound, otherwise KV (values up to 25 MB; fine for test volumes). */
export async function putImage(env: Env, key: string, body: ArrayBuffer, contentType: string) {
  if (env.IMAGES) await env.IMAGES.put(key, body, { httpMetadata: { contentType } });
  else await env.KV.put(`img:${key}`, body, { metadata: { contentType } });
}

export async function getImage(env: Env, key: string): Promise<{ body: ReadableStream | ArrayBuffer; contentType: string } | null> {
  if (env.IMAGES) {
    const o = await env.IMAGES.get(key);
    return o ? { body: o.body, contentType: o.httpMetadata?.contentType || "image/jpeg" } : null;
  }
  const v = await env.KV.getWithMetadata<{ contentType: string }>(`img:${key}`, "arrayBuffer");
  return v.value ? { body: v.value, contentType: v.metadata?.contentType || "image/jpeg" } : null;
}

/** Copy every image of the offer into R2 so the customer page never hot-links mobile.de. */
async function copyImages(env: Env, offerId: string, cv: CarView): Promise<string[]> {
  const out: string[] = [];
  for (const [i, src] of cv.listing.images.entries()) {
    const key = `offers/${offerId}/${cv.candidate.id}/${i}`;
    try {
      if (src.startsWith("/mock-img/")) {
        const [, , ad, file] = src.split("/");
        const svg = mockImageSvg(ad, Number(file.split(".")[0]));
        if (!svg) throw new Error("mock image missing");
        await putImage(env, key, new TextEncoder().encode(svg).buffer as ArrayBuffer, "image/svg+xml");
      } else {
        const r = await fetch(src, { headers: { "User-Agent": "Caradvance Offer Engine" } });
        if (!r.ok) throw new Error(`image ${r.status}`);
        await putImage(env, key, await r.arrayBuffer(), r.headers.get("content-type") || "image/jpeg");
      }
      out.push(`/img/${key}`);
    } catch (e) {
      console.error("image copy failed", src, e);
    }
  }
  return out.length ? out : cv.listing.images;
}

export async function publishOffer(env: Env, requestId: string, actor: string) {
  const row = await getRequest(env, requestId);
  if (!row) throw new Error("request not found");
  const { req, cars } = await slotViews(env, requestId);
  const blockers = publishBlockers(cars);
  if (blockers.length) throw new Error("Nem tehető közzé: " + blockers.join(" · "));

  const offerId = newId("off");
  const token = newToken(32);
  const days = Number(env.OFFER_VALID_DAYS || 7);
  const expires = new Date(Date.now() + days * 864e5);
  const d = new Date();
  const offerNo = `CA-${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}-${offerId.slice(4, 8).toUpperCase()}`;

  const imageMap = new Map<string, string[]>();
  for (const cv of cars) imageMap.set(cv.candidate.id, await copyImages(env, offerId, cv));
  const pub = await buildPublicOffer(env, requestId, cars, req, offerNo, expires, imageMap);

  // public part is what the page renders; internal part keeps the full costing for audit
  const snapshot = {
    public: pub,
    internal: cars.map((cv) => ({ cid: cv.candidate.id, ad_id: cv.listing.ad_id, listing: cv.listing, costs: cv.costs, overrides: cv.overrides })),
  };
  await env.DB.prepare(`INSERT INTO offers (id, request_id, token, language, status, published_at, expires_at, snapshot_json, rate_version)
    VALUES (?,?,?,?, 'PUBLISHED', ?, ?, ?, ?)`)
    .bind(offerId, requestId, token, pub.language, nowIso(), expires.toISOString(), JSON.stringify(snapshot), cars[0].costs.rate_version).run();
  if (row.status === "NEEDS_REVIEW") await transition(env, requestId, "READY", actor);
  await transition(env, requestId, "PUBLISHED", actor, { offerId });
  await logEvent(env, requestId, actor, "offer_published", { offerId, offerNo, expires: expires.toISOString() });
  return { offerId, token, offerNo };
}

export async function recordOfferEvent(env: Env, offerId: string, type: string, data?: unknown) {
  await env.DB.prepare("INSERT INTO offer_events (offer_id, type, data_json, at) VALUES (?,?,?,?)")
    .bind(offerId, type, data ? JSON.stringify(data).slice(0, 2000) : null, nowIso()).run();
}
