/**
 * Publishing a premium three-car offer and handling the customer's answer.
 * The offer IS a belső crm_offers row (same 40-hex token, items, response fields), so the
 * ügyfél adatlap lists it and /ajanlat/valasz/ works too; am_offers keeps the premium snapshot.
 */
import type { Env, Requirements } from "./types";
import { pickSectionImages } from "./photos";
import { getDeal, getRequest, publishBlockers, slotViews, type CarView } from "./engine";
import { transition } from "./status";
import { ensureAm, getSetting, logEvent, nowIso, putImage, randomHex, validDays, isTest, type Staff } from "./am";
import { groupEquipment, equipHu } from "./describe";
import { mockImageSvg } from "./mock";
import { notifyStaff } from "./notify";
import type { PublicCar, PublicOffer } from "./offer-view";
import { ensureCrm, getCard, saveCard, sendCrmMail } from "../crm.js";

export const DEFAULT_CONTACT = {
  name: "Vadnai Zsombor",
  title: "Értékesítési vezető",
  phone: "+36 30 233 6060",
  whatsapp: "https://wa.me/36302336060",
  email: "info@caradvance.hu",
};

const FUEL_HU: Record<string, string> = { electric: "Elektromos", phev: "Plug-in hibrid", hybrid: "Hibrid", diesel: "Dízel", petrol: "Benzin" };
const BODY_HU: Record<string, string> = { estate: "Kombi", suv: "SUV", sedan: "Limuzin", coupe: "Kupé", convertible: "Kabrió", van: "Egyterű", hatchback: "Ferdehátú" };
export const TOKEN_RE = /^[a-f0-9]{40}$/;

export function firstName(name: string | undefined, lang: string) {
  if (!name) return "";
  const p = name.trim().split(/\s+/);
  return lang === "hu" ? p[p.length - 1] : p[0]; // Hungarian order: family name first
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
    cid: cv.candidate.id, slot: cv.candidate.slot!, positioning: cv.candidate.positioning, title: l.title, make: l.make, model: l.model,
    variant: l.variant, first_registration: l.first_registration, km: l.km, power_kw: l.power_kw, fuel: l.fuel, gearbox: l.gearbox,
    drivetrain: l.drivetrain, color: l.color, battery_kwh: l.battery_kwh, range_km: l.range_km, previous_owners: l.previous_owners,
    accident_free: l.accident_free, service_book: l.service_book, equipment_count: l.equipment.length, equipment: groupEquipment(l.equipment),
    key_equipment: wanted.filter((e) => l.equipment.includes(e)).map((e) => equipHu(e).hu), city: l.seller.city, country: l.seller.country,
    distance_km: cv.distanceKm, images, sections: pickSectionImages(cv.sections || [], l.images, (l as any).photo_tags), customer_lines: cv.costs.customer_lines,
    total_huf: cv.costs.customer_total_huf, total_eur: cv.costs.customer_total_eur,
  };
}

export async function buildPublicOffer(env: Env, cars: CarView[], req: Requirements, offerNo: string, validUntil: Date, imageMap?: Map<string, string[]>): Promise<PublicOffer> {
  const contact = await getSetting(env, "contact", DEFAULT_CONTACT);
  const lang = req.customer.language || "hu";
  const fx = cars[0]?.costs.fx || { rate: 0, date: "" };
  return {
    offer_no: offerNo,
    language: lang,
    customer_name: req.customer.name || "",
    first_name: firstName(req.customer.name, lang),
    chips: chipsFor(req),
    contact,
    valid_until: validUntil.toLocaleDateString(lang === "de" ? "de-DE" : "hu-HU", { timeZone: "Europe/Budapest", year: "numeric", month: "long", day: "numeric" }),
    fx: { rate: fx.rate, date: fx.date },
    wanted_equipment: [...req.vehicle.must_have_equipment, ...req.vehicle.nice_to_have_equipment].map((e) => equipHu(e).hu),
    cars: [...cars].sort((a, b) => a.candidate.slot! - b.candidate.slot!).map((cv) => toPublicCar(cv, req, imageMap?.get(cv.candidate.id) || cv.listing.images)),
  };
}

/** Copy every image into am_images so the customer page never hot-links mobile.de. */
async function copyImages(env: Env, token: string, cv: CarView): Promise<string[]> {
  const out: string[] = [];
  for (const [i, src] of cv.listing.images.slice(0, 15).entries()) {
    const key = `${token}/${cv.candidate.slot}/${i}`;
    try {
      if (src.startsWith("/mock-img/") || src.includes("/ajanlatmotor/mock-img/")) {
        const m = src.match(/mock-img\/(\d+)\/(\d+)/);
        const svg = m ? mockImageSvg(m[1], Number(m[2])) : null;
        if (!svg) throw new Error("mock image missing");
        await putImage(env, key, new TextEncoder().encode(svg).buffer as ArrayBuffer, "image/svg+xml");
      } else {
        const r = await fetch(src, { headers: { "User-Agent": "Caradvance Ajanlatmotor" } });
        if (!r.ok) throw new Error(`image ${r.status}`);
        const buf = await r.arrayBuffer();
        if (buf.byteLength > 1_500_000) throw new Error("image too large");
        await putImage(env, key, buf, r.headers.get("content-type") || "image/jpeg");
      }
      out.push(`/ajanlat/auto/${token}/kep/${cv.candidate.slot}/${i}`);
    } catch (e) {
      console.error("image copy failed", src, e);
      out.push(src); // keep positions aligned with the section photo indexes
    }
  }
  return out.length ? out : cv.listing.images;
}

export async function publishOffer(env: Env, dealId: number, user: Staff, origin: string, opts: { message?: string; send?: boolean }) {
  await ensureAm(env);
  await ensureCrm(env);
  const row = await getRequest(env, dealId);
  const deal = await getDeal(env, dealId);
  if (!row || !deal) throw new Error("Az igény nem található.");
  const { req, cars } = await slotViews(env, dealId);
  const blockers = publishBlockers(cars);
  if (blockers.length) throw new Error("Nem tehető közzé: " + blockers.join(" · "));

  const token = randomHex(20); // same format as belső crm_offers tokens
  const expires = new Date(Date.now() + validDays(env) * 864e5);
  const d = new Date();
  const offerNo = `CA-${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(dealId).padStart(4, "0")}`;

  const imageMap = new Map<string, string[]>();
  for (const cv of cars) imageMap.set(cv.candidate.id, await copyImages(env, token, cv));
  const pub = await buildPublicOffer(env, cars, req, offerNo, expires, imageMap);
  const link = `${origin}/ajanlat/auto/${token}/`;

  // crm_offers items in the belső format (adatlap list, /ajanlat/valasz/ page, contract defaults)
  const items = pub.cars.map((c) => ({
    key: c.cid, title: c.title, brand: c.make, year: c.first_registration.slice(0, 4), km: `${c.km.toLocaleString("hu-HU")} km`,
    fuel: FUEL_HU[c.fuel] || c.fuel, power: `${c.power_kw} kW`, gearbox: c.gearbox === "automatic" ? "Automata" : "Manuális",
    image: c.images[0] ? new URL(c.images[0], origin).toString() : "", url: link, note: c.positioning || "",
    price: c.total_huf, currency: "HUF", period: "", deposit: 0,
  }));
  const card = await getCard(env, dealId);
  const to = String(card?.data?.person?.email || deal.email || "").trim();
  const clientName = pub.customer_name || deal.name || "";
  const message = String(opts.message || "").slice(0, 2000);

  let sent = 0;
  let sentTo = "";
  let mailError = "";
  if (opts.send && to) {
    const fwd = env.CRM_TEST_FORWARD === "off" ? null : (env.CRM_TEST_FORWARD as string) || "marc.nemethy@bhgeu.com";
    const r = await sendCrmMail(env, fwd || to, `${fwd ? "[TESZT — " + to + "] " : ""}Személyre szabott ajánlatunk — 3 autó`,
      offerMailHtml(clientName, link, message, pub));
    sent = r.ok ? 1 : 0;
    sentTo = fwd || to;
    if (!r.ok) mailError = r.error || "küldési hiba";
  }

  const snapshot = {
    public: pub,
    internal: cars.map((cv) => ({ cid: cv.candidate.id, ad_id: cv.listing.ad_id, listing: cv.listing, costs: cv.costs, overrides: cv.overrides })),
  };
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO crm_offers (token, deal_id, line, client_name, items, message, sent_to, sent, created_by) VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(token, dealId, "Import", clientName, JSON.stringify(items), message, sentTo, sent, user.id),
    env.DB.prepare(`INSERT INTO am_offers (token, deal_id, language, offer_no, published_at, expires_at, snapshot_json, rate_version, created_by)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(token, dealId, pub.language, offerNo, nowIso(), expires.toISOString(), JSON.stringify(snapshot), cars[0].costs.rate_version, user.id),
  ]);
  if (row.status === "NEEDS_REVIEW") await transition(env, dealId, "READY", user.name);
  await transition(env, dealId, "PUBLISHED", user.name, { token: token.slice(0, 8) });
  await saveCard(env, dealId, { status: "Ajánlat kiküldve" }, user.id);
  await logEvent(env, dealId, user.name, "offer_published", { offerNo, sent: !!sent, sentTo, mailError });
  return { token, link, offerNo, sent: !!sent, sentTo, mailError, test: isTest(env) };
}

function offerMailHtml(name: string, link: string, message: string, pub: PublicOffer) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const first = firstName(name, pub.language);
  return `<p>Szia${first ? " " + esc(first) : ""},</p>
<p>összeállítottuk a három autót, amelyek a legjobban illenek ahhoz, amit kértél. Mindegyiknél látod a teljes árat Budapesten, forgalomba helyezve.</p>
${message ? `<p style="background:#f4f7fb;border-radius:10px;padding:12px 14px;white-space:pre-line">${esc(message)}</p>` : ""}
<p style="margin:22px 0"><a href="${esc(link)}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:999px;display:inline-block">Az ajánlat megnyitása</a></p>
<p style="color:#6b7280;font-size:13px">Az ajánlat ${esc(pub.valid_until)}-ig érvényes. Ha a gomb nem működik: ${esc(link)}</p>`;
}

/* ---------------- customer side ---------------- */
export interface OfferRecord {
  token: string; deal_id: number; language: string; offer_no: string; published_at: string; expires_at: string;
  snapshot_json: string; first_viewed_at: string | null;
  responded_at: string | null; action: string | null; choice: number | null;
}

export async function loadOffer(env: Env, token: string): Promise<OfferRecord | null> {
  if (!TOKEN_RE.test(token)) return null;
  await ensureAm(env);
  return env.DB.prepare(`SELECT a.token, a.deal_id, a.language, a.offer_no, a.published_at, a.expires_at, a.snapshot_json, a.first_viewed_at,
      o.responded_at, o.action, o.choice FROM am_offers a JOIN crm_offers o ON o.token = a.token WHERE a.token = ?`).bind(token).first<OfferRecord>();
}

export async function markViewed(env: Env, o: OfferRecord, origin: string) {
  if (o.first_viewed_at) return;
  await env.DB.prepare("UPDATE am_offers SET first_viewed_at = ? WHERE token = ? AND first_viewed_at IS NULL").bind(nowIso(), o.token).run();
  try { await transition(env, o.deal_id, "VIEWED", "customer"); } catch { /* already further */ }
  const pub = (JSON.parse(o.snapshot_json) as { public: PublicOffer }).public;
  await notifyStaff(env, `Megnyitotta az ajánlatot: ${pub.customer_name}`,
    `<p>${pub.offer_no}</p><p><a href="${origin}/belso/ajanlatmotor/igeny/${o.deal_id}">Megnyitás az Ajánlatmotorban</a></p>`, o.deal_id);
}

/** Customer picks a car: same fields and status as the belső /ajanlat/valasz/ flow ("Ajánlat elfogadva"). */
export async function chooseCar(env: Env, o: OfferRecord, choice: { cid: string; name: string; phone: string; callback: string; message: string; ip: string }, origin: string) {
  const pub = (JSON.parse(o.snapshot_json) as { public: PublicOffer }).public;
  const idx = pub.cars.findIndex((c) => c.cid === choice.cid);
  if (idx < 0) throw new Error("Ismeretlen autó.");
  const car = pub.cars[idx];
  const msg = [`Telefon: ${choice.phone}`, choice.callback ? `Visszahívás: ${choice.callback}` : "", choice.message ? `Üzenet: ${choice.message}` : ""].filter(Boolean).join("\n");
  const upd = await env.DB.prepare(`UPDATE crm_offers SET responded_at = datetime('now'), action = 'elfogad', choice = ?, client_msg = ?, client_ip = ?
      WHERE token = ? AND responded_at IS NULL`).bind(idx, msg.slice(0, 2000), choice.ip.slice(0, 60), o.token).run();
  if (!upd.meta?.changes) return { already: true, car };
  await ensureCrm(env);
  const card = await getCard(env, o.deal_id);
  const data = card.data || {};
  const v = { ...(data.vehicle || {}) };
  const fill: Record<string, string> = {
    brand: car.make, model: [car.model, car.variant].filter(Boolean).join(" "), year: car.first_registration.slice(0, 4),
    fuel: FUEL_HU[car.fuel] || car.fuel, km: String(car.km), engine: `${car.power_kw} kW`, color: car.color || "",
  };
  for (const [k, val] of Object.entries(fill)) if (!v[k] && val) v[k] = String(val).slice(0, 200);
  const person = { ...(data.person || {}) };
  if (!person.phone && choice.phone) person.phone = choice.phone.slice(0, 200);
  await saveCard(env, o.deal_id, { status: "Ajánlat elfogadva", data: { ...data, vehicle: v, person } }, null);
  await env.DB.prepare("UPDATE am_candidates SET pool = 'declined' WHERE deal_id = ? AND slot IS NOT NULL AND id != ?").bind(o.deal_id, car.cid).run();
  try { await transition(env, o.deal_id, "CHOSEN", "customer", { cid: car.cid }); } catch { /* ignore */ }
  await logEvent(env, o.deal_id, "customer", "chosen", { cid: car.cid, slot: car.slot });
  await notifyStaff(env, `VÁLASZTOTT: ${choice.name} – ${car.title}`,
    `<p><b>${choice.name}</b> a(z) <b>${car.title}</b> autót választotta (${car.slot}. hely).</p>
     <p>Végösszeg: ≈ ${car.total_huf.toLocaleString("hu-HU")} Ft<br>${msg.replace(/\n/g, "<br>")}</p>
     <p><a href="${origin}/belso/ugyfel/?id=${o.deal_id}">Ügyfél adatlap</a> · <a href="${origin}/belso/ajanlatmotor/igeny/${o.deal_id}">Ajánlatmotor</a></p>`, o.deal_id);
  return { already: false, car };
}

/** "Egyik sem az igazi" → belső "Ajánlat módosítva", request back to review. */
export async function noneFits(env: Env, o: OfferRecord, message: string, ip: string, origin: string) {
  const upd = await env.DB.prepare(`UPDATE crm_offers SET responded_at = datetime('now'), action = 'modosit', choice = NULL, client_msg = ?, client_ip = ?
      WHERE token = ? AND responded_at IS NULL`).bind(message.slice(0, 2000), ip.slice(0, 60), o.token).run();
  if (!upd.meta?.changes) return { already: true };
  await ensureCrm(env);
  await saveCard(env, o.deal_id, { status: "Ajánlat módosítva" }, null);
  try { await transition(env, o.deal_id, "NEEDS_REVIEW", "customer", { none_fit: true }); } catch { /* ignore */ }
  await logEvent(env, o.deal_id, "customer", "none_fit", { message: message.slice(0, 500) });
  await notifyStaff(env, "Egyik autó sem tetszett", `<p>${message.replace(/</g, "&lt;")}</p><p><a href="${origin}/belso/ajanlatmotor/igeny/${o.deal_id}">Megnyitás az Ajánlatmotorban</a></p>`, o.deal_id);
  return { already: false };
}
