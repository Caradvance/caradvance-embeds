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
import { ensureCrm, getCard, saveCard, sendCrmMail, vehiclesOf, itemToVehicle, offerFields, newVehicleId, addEvent } from "../crm.js";

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
    cid: cv.candidate.id, source_url: /^https:\/\/([a-z0-9-]+\.)*mobile\.de\//i.test(l.url || "") ? l.url : undefined, slot: cv.candidate.slot!, positioning: cv.candidate.positioning, title: l.title, make: l.make, model: l.model,
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

export async function publishOffer(env: Env, dealId: number, user: Staff, origin: string, opts: { message?: string; send?: boolean; force?: boolean }) {
  await ensureAm(env);
  await ensureCrm(env);
  const row = await getRequest(env, dealId);
  const deal = await getDeal(env, dealId);
  if (!row || !deal) throw new Error("Az igény nem található.");
  const { req, cars } = await slotViews(env, dealId);
  if (!cars.length) throw new Error("Nincs autó a helyeken — legalább egy autó kell az ajánlatba.");
  // a figyelmeztetések (pl. megerősítetlen díjak, ellenőrizetlen fotók) tudomásulvétellel kiküldhetők
  const blockers = publishBlockers(cars).filter((b) => !/hely még üres/.test(b));
  if (blockers.length && !opts.force) throw new Error("Kiküldés előtt nézd át: " + blockers.join(" · ") + " — vagy jelöld be, hogy így is kiküldöd.");

  const token = randomHex(20); // same format as belső crm_offers tokens
  const expires = new Date(Date.now() + validDays(env) * 864e5);
  const d = new Date();
  // ajánlat sorszáma (ügyfelenként a második ajánlattól /2, /3 …); az autók sorszáma: <ajánlatszám>-<hely>
  const prevN = ((await env.DB.prepare("SELECT COUNT(*) AS n FROM am_offers WHERE deal_id = ?").bind(dealId).first<{ n: number }>()) || { n: 0 }).n || 0;
  const offerNo = `CA-${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(dealId).padStart(4, "0")}${prevN ? "/" + (prevN + 1) : ""}`;

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
    offer_no: `${offerNo}-${c.slot}`, offer_date: nowIso().slice(0, 10), fx: c.total_eur ? Math.round(c.total_huf / c.total_eur * 100) / 100 : 0, slot: c.slot,
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
      offerMailHtml(clientName, link, message, pub, items));
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

export function offerMailHtml(name: string, link: string, message: string, pub: PublicOffer, items?: { offer_no?: string; image?: string }[]) {
  const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const first = firstName(name, pub.language);
  const n = pub.cars.length;
  // autónként: kép, sorszám, adatok, végösszeg és „Ezt választom” (az ajánlat oldalán nyitja meg a választást)
  const cars = pub.cars.map((c, i) => {
    const img = (items && items[i] && items[i].image) || "";
    const no = (items && items[i] && items[i].offer_no) || `${pub.offer_no}-${c.slot}`;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6eaf1;border-radius:14px;margin:0 0 14px;border-collapse:separate;overflow:hidden"><tr>
  ${img ? `<td width="190" style="width:190px;padding:0;vertical-align:top"><img src="${esc(img)}" width="190" alt="" style="display:block;width:190px;height:auto;border-radius:14px 0 0 14px"></td>` : ""}
  <td style="padding:12px 14px;vertical-align:top;font:14px/1.5 Arial,Helvetica,sans-serif;color:#141519">
   <div style="font-size:11px;font-weight:bold;letter-spacing:.06em;color:#e2001a;text-transform:uppercase">${i + 1}. autó${c.positioning ? " · " + esc(c.positioning) : ""}</div>
   <div style="font-size:16px;font-weight:bold;margin:2px 0 4px">${esc(c.title)}</div>
   <div style="color:#5a6b82;font-size:13px">${esc(c.first_registration.slice(0, 7).replace("-", "."))} · ${c.km.toLocaleString("hu-HU")} km · ${c.power_kw} kW</div>
   <div style="font-size:17px;font-weight:bold;margin:8px 0 2px">≈ ${c.total_huf.toLocaleString("hu-HU")} Ft</div>
   <div style="color:#5a6b82;font-size:12px">Budapesten, forgalomba helyezve · azonosító: <b>${esc(no)}</b></div>
   <div style="margin-top:10px"><a href="${esc(link)}#valaszt-${esc(c.cid)}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;font-size:13px;padding:9px 16px;border-radius:999px;display:inline-block">Ezt választom</a>
    <a href="${esc(link)}#auto-${c.slot}" style="color:#141519;font-size:13px;margin-left:10px">Részletek</a></div>
  </td></tr></table>`;
  }).join("");
  return `<p>Szia${first ? " " + esc(first) : ""},</p>
<p>összeállítottuk ${n === 1 ? "az autót, amely" : n === 2 ? "a két autót, amelyek" : "a három autót, amelyek"} a legjobban ${n === 1 ? "illik" : "illenek"} ahhoz, amit kértél. Mindegyiknél látod a teljes árat Budapesten, forgalomba helyezve.</p>
<p style="color:#5a6b82;font-size:13px">Ajánlat száma: <b style="color:#141519">${esc(pub.offer_no)}</b></p>
${message ? `<p style="background:#f4f7fb;border-radius:10px;padding:12px 14px;white-space:pre-line">${esc(message)}</p>` : ""}
${cars}
<p style="margin:18px 0"><a href="${esc(link)}" style="background:#141519;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">A teljes ajánlat megnyitása</a></p>
<p style="color:#6b7280;font-size:13px">Az „Ezt választom” gombbal az ajánlat oldalán megerősítheted a választásodat. Az ajánlat ${esc(pub.valid_until)}-ig érvényes. Ha a gomb nem működik: ${esc(link)}</p>`;
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
  // a választott autó az adatlap „Autók” részébe kerül — ajánlat- és autó-sorszámmal, dátummal, árfolyammal
  const row = await env.DB.prepare("SELECT items FROM crm_offers WHERE token = ?").bind(o.token).first<{ items: string }>();
  const items: any[] = row ? JSON.parse(row.items || "[]") : [];
  const it: any = { ...(items[idx] || {}), title: car.title, brand: car.make, year: car.first_registration.slice(0, 4), fuel: FUEL_HU[car.fuel] || car.fuel,
    km: `${car.km.toLocaleString("hu-HU")} km`, power: `${car.power_kw} kW`, color: car.color || "", price: car.total_huf, currency: "HUF", period: "",
    offer_no: (items[idx] && items[idx].offer_no) || `${o.offer_no}-${car.slot}`, offer_date: (items[idx] && items[idx].offer_date) || String(o.published_at || nowIso()).slice(0, 10),
    fx: (items[idx] && items[idx].fx) || (car.total_eur ? Math.round(car.total_huf / car.total_eur * 100) / 100 : 0), ad_id: (items[idx] && items[idx].ad_id) || "" };
  const list = vehiclesOf(data).slice();
  const same = list.findIndex((v: any) => (it.key && v.key === it.key) || (v.title && v.title === it.title));
  const emptyIdx = list.findIndex((v: any) => !v.title && !v.brand && !v.model && !v.vin);
  if (same >= 0) list[same] = { ...list[same], price: it.price, currency: "HUF", ...offerFields(it) };
  else if (emptyIdx >= 0) list[emptyIdx] = { ...itemToVehicle(it, list[emptyIdx].id, "offer"), vin: list[emptyIdx].vin || "" };
  else list.push(itemToVehicle(it, newVehicleId(list), "offer"));
  const person = { ...(data.person || {}) };
  if (!person.phone && choice.phone) person.phone = choice.phone.slice(0, 200);
  await saveCard(env, o.deal_id, { status: "Ajánlat elfogadva", data: { ...data, vehicles: list, vehicle: list[0], person } }, null, "Ügyfél", "választott az ajánlatból");
  try { await addEvent(env, o.deal_id, "client", `Ügyfél választott az ajánlatból (${o.offer_no}): ${it.offer_no} · ${car.title} — ≈ ${car.total_huf.toLocaleString("hu-HU")} Ft`, "Ügyfél"); } catch { /* ignore */ }
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
