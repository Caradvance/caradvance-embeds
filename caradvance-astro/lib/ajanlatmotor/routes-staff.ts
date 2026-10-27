/**
 * Staff UI: www.caradvance.hu/belso/ajanlatmotor/*  (server-rendered, belső login = ca_session).
 * Admin sees every request; other staff only deals assigned to them (same rule as belső).
 */
import { Hono } from "hono";
import { withCarPhotos } from "./photos";
import type { Env, Lang, Requirements, Section } from "./types";
import {
  baseUrl, canSeeDeal, ensureAm, getSetting, isAdmin, isTest, logEvent, newId, nowIso, randomHex, sessionUser, setSetting, sha256Hex, type Staff,
  cachePut, cacheGet, cacheDel,
} from "./am";
import { addListing, getCandidates, getDeal, getRequest, moveToSlot, processRequest, publishBlockers, slotViews, type RequestRow } from "./engine";
import { createRequest, startForDeal } from "./intake";
import { describe } from "./describe";
import { getSource } from "./sources";
import { buildPublicOffer, DEFAULT_CONTACT, publishOffer } from "./offers";
import { loadRates, saveRates, setVerified, unverifiedPaths, type RateConfig } from "./rates";
import { transition } from "./status";
import { adminLayout, extensionPage, inboxPage, newLeadPage, requestPage, settingsPage, startPage, type InboxRow } from "./admin-view";
import { renderOffer } from "./offer-view";
import { DEMO_EMAIL } from "./demo";
import { ensureCrm, getCard } from "../crm.js";

type H = { Bindings: Env; Variables: { user: Staff } };
const B = "/belso/ajanlatmotor";
export const staff = new Hono<H>({ strict: false }).basePath(B);

staff.use("*", async (c, next) => {
  await ensureAm(c.env);
  const user = await sessionUser(c.env, c.req.raw);
  if (!user) {
    if (c.req.method === "GET") return c.redirect(`/belso/?next=${encodeURIComponent(new URL(c.req.url).pathname)}`, 302);
    return c.text("Nincs bejelentkezve.", 401);
  }
  if (c.req.method === "POST") {
    const origin = c.req.header("Origin") || c.req.header("Referer") || "";
    try { if (origin && new URL(origin).host !== new URL(c.req.url).host) return c.text("Bad origin", 403); } catch { return c.text("Bad origin", 403); }
  }
  c.set("user", user);
  await next();
  c.header("Cache-Control", "private, no-store");
  c.header("X-Robots-Tag", "noindex, nofollow");
});

const page = (c: any, title: string, body: string, active?: string) =>
  c.html(adminLayout(title, body, { test: isTest(c.env), msg: c.req.query("msg"), err: c.req.query("err"), user: c.get("user"), active }));
const back = (c: any, path: string, msg?: string, err?: string) =>
  c.redirect(`${path}${msg ? `?msg=${encodeURIComponent(msg)}` : err ? `?err=${encodeURIComponent(err)}` : ""}`, 303);
const reqPath = (id: number) => `${B}/igeny/${id}`;

async function guardDeal(c: any, id: number) {
  if (!Number.isInteger(id) || id <= 0) return c.text("Hibás azonosító", 400);
  if (!(await canSeeDeal(c.env, c.get("user"), id))) return c.text("Nincs jogosultság ehhez az ügyfélhez.", 403);
  return null;
}
async function guardCand(c: any, cid: string) {
  const cand = await c.env.DB.prepare("SELECT deal_id FROM am_candidates WHERE id = ?").bind(cid).first() as { deal_id: number } | null;
  if (!cand) return { err: c.notFound() };
  const g = await guardDeal(c, cand.deal_id);
  return g ? { err: g } : { dealId: cand.deal_id };
}

/* ---------------- list ---------------- */
staff.get("/", async (c) => {
  const u = c.get("user");
  const sql = `SELECT r.*, d.name AS deal_name, d.email AS deal_email, us.name AS assigned_name, cc.status AS card_status
    FROM am_requests r JOIN deals d ON d.id = r.deal_id LEFT JOIN users us ON us.id = d.assigned_to LEFT JOIN crm_cards cc ON cc.deal_id = r.deal_id
    ${isAdmin(u) ? "" : "WHERE d.assigned_to = ?"} ORDER BY r.created_at DESC LIMIT 300`;
  await ensureCrm(c.env);
  const st = c.env.DB.prepare(sql);
  const rows = (isAdmin(u) ? await st.all<InboxRow>() : await st.bind(u.id).all<InboxRow>()).results;
  return page(c, "Igények", inboxPage(rows, isTest(c.env)), "igenyek");
});

/* ---------------- new request (phone / WhatsApp / pasted mail) ---------------- */
staff.get("/uj", (c) => page(c, "Új igény", newLeadPage(), "uj"));
staff.post("/uj", async (c) => {
  const f = await c.req.parseBody();
  const u = c.get("user");
  const text = String(f.text || "").trim();
  if (!text) return back(c, `${B}/uj`, undefined, "Írd be, mit keres az ügyfél.");
  const r = await createRequest(c.env, {
    source: "manual", fromEmail: String(f.email || "") || undefined, fromName: String(f.name || "") || undefined, text,
    actor: u.name, actorId: u.id, assignedTo: isAdmin(u) ? null : u.id, origin: baseUrl(c.env, c.req.raw),
  });
  return back(c, reqPath(r.dealId), "Igény rögzítve: új ügyfél a belső felületen (Import), a keresés lefutott.");
});

/* ---------------- request detail ---------------- */
staff.get("/igeny/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const deal = await getDeal(c.env, id);
  if (!deal) return c.notFound();
  const row = await getRequest(c.env, id);
  if (!row) return page(c, "Ajánlatmotor indítása", startPage(deal), "igenyek");
  await ensureCrm(c.env);
  const card = await getCard(c.env, id);
  const req: Requirements | null = row.requirements_json ? JSON.parse(row.requirements_json) : null;
  const all = await getCandidates(c.env, id);
  const { cars } = req ? await slotViews(c.env, id) : { cars: [] as any[] };
  const offers = (await c.env.DB.prepare(`SELECT a.token, a.offer_no, a.published_at, a.expires_at, a.first_viewed_at, o.responded_at, o.action, o.choice, o.sent_to, o.sent
      FROM am_offers a JOIN crm_offers o ON o.token = a.token WHERE a.deal_id = ? ORDER BY a.published_at DESC`).bind(id).all<any>()).results;
  const events = (await c.env.DB.prepare("SELECT actor, type, from_status, to_status, at, data_json FROM am_events WHERE deal_id = ? ORDER BY id DESC LIMIT 60").bind(id).all<any>()).results;
  return page(c, deal.name || "Igény", requestPage({
    row, deal, cardStatus: card?.status || "", req, cars, runners: all.filter((x) => !x.slot && x.pool === "runner"), rejected: all.filter((x) => x.pool === "rejected"),
    blockers: publishBlockers(cars), offers, events, baseUrl: baseUrl(c.env, c.req.raw), extraction: row.meta_json ? JSON.parse(row.meta_json) : null,
    hasEmail: !!(card?.data?.person?.email || deal.email),
  }), "igenyek");
});

staff.post("/igeny/:id/inditas", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const f = await c.req.parseBody();
  await startForDeal(c.env, id, String(f.text || ""), c.get("user").name, baseUrl(c.env, c.req.raw));
  return back(c, reqPath(id), "Igény rögzítve, a keresés lefutott.");
});

staff.post("/igeny/:id/requirements", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const f = await c.req.parseBody();
  let req: Requirements;
  try {
    req = JSON.parse(String(f.json));
    if (!req.vehicle || !req.customer) throw new Error("vehicle/customer hiányzik");
    if ((req.vehicle.makes.length || req.vehicle.body_types.length) && (req.vehicle.budget_huf_max || req.vehicle.budget_eur_max)) req.missing_critical_fields = [];
  } catch (e: any) {
    return back(c, reqPath(id), undefined, "Hibás JSON: " + e.message);
  }
  await c.env.DB.prepare("UPDATE am_requests SET requirements_json = ?, updated_at = ? WHERE deal_id = ?").bind(JSON.stringify(req), nowIso(), id).run();
  await logEvent(c.env, id, c.get("user").name, "requirements_edited");
  const row = await getRequest(c.env, id);
  if (row && ["REJECTED", "READY", "EXPIRED"].includes(row.status)) await transition(c.env, id, "NEEDS_REVIEW", c.get("user").name);
  await processRequest(c.env, id, c.get("user").name, baseUrl(c.env, c.req.raw));
  return back(c, reqPath(id), "Mentve, keresés újrafuttatva.");
});

staff.post("/igeny/:id/search", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const row = await getRequest(c.env, id);
  if (row && ["READY", "EXPIRED"].includes(row.status)) await transition(c.env, id, "NEEDS_REVIEW", c.get("user").name);
  await processRequest(c.env, id, c.get("user").name, baseUrl(c.env, c.req.raw));
  return back(c, reqPath(id), "Keresés újrafuttatva (zárolt és kézzel hozzáadott autók maradtak).");
});

staff.post("/igeny/:id/add", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const f = await c.req.parseBody();
  const target = f.target === "runner" ? "runner" : Number(f.target);
  let listing;
  try { listing = await getSource(c.env).getById(String(f.url || "")); } catch (e: any) { return back(c, reqPath(id), undefined, e.message); }
  if (!listing) return back(c, reqPath(id), undefined, isTest(c.env)
    ? (/mobile\.de/i.test(String(f.url || ""))
      ? "Tesztben a szerver nem kérdezi le a mobile.de-t (mock forrás). Valódi hirdetést a Chrome bővítménnyel küldjön be („Küldés az ajánlatba”), vagy próbáljon tesztazonosítót: 1001–1007, 2001, 3001."
      : "A hirdetés nem található (tesztben: 1001–1007, 2001, 3001).")
    : "A hirdetés nem található.");
  try {
    const r = await addListing(c.env, id, listing, target as any, "manual", c.get("user").name);
    if (r.duplicate) return back(c, reqPath(id), undefined, "Ez a hirdetés már szerepel az igénynél.");
  } catch (e: any) {
    return back(c, reqPath(id), undefined, e.message);
  }
  return back(c, reqPath(id), "Autó hozzáadva.");
});

staff.post("/igeny/:id/describe", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const { req, cars } = await slotViews(c.env, id);
  for (const cv of cars) {
    const { sections, engine } = await describe(c.env, cv.listing, cv.distanceKm, req.customer.language as Lang);
    await c.env.DB.prepare("UPDATE am_candidates SET descriptions_json = ? WHERE id = ?").bind(JSON.stringify(sections), cv.candidate.id).run();
    await logEvent(c.env, id, c.get("user").name, "described", { cid: cv.candidate.id, engine });
  }
  return back(c, reqPath(id), `Leírások elkészültek (${c.env.ANTHROPIC_API_KEY ? "Claude" : "sablon, nincs Claude API kulcs"}).`);
});

staff.post("/igeny/:id/publish", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const f = await c.req.parseBody();
  try {
    const r = await publishOffer(c.env, id, c.get("user"), baseUrl(c.env, c.req.raw), { message: String(f.message || ""), send: f.send === "1" });
    const mail = r.sent ? `E-mail elküldve: ${r.sentTo}.` : r.mailError ? `Az e-mail nem ment ki (${r.mailError}); a linket kézzel küldd.` : "E-mail nem ment, a linket kézzel küldd.";
    return back(c, reqPath(id), `Közzétéve: ${r.offerNo}. ${mail} Az adatlap státusza: Ajánlat kiküldve.`);
  } catch (e: any) {
    return back(c, reqPath(id), undefined, e.message);
  }
});

staff.get("/igeny/:id/preview", async (c) => {
  const id = Number(c.req.param("id"));
  const g = await guardDeal(c, id); if (g) return g;
  const { req, cars } = await slotViews(c.env, id);
  if (!cars.length) return c.text("Még nincs autó a helyeken.", 400);
  const pub = await buildPublicOffer(c.env, cars, req, "ELŐNÉZET", new Date(Date.now() + 7 * 864e5));
  for (const car of pub.cars) if (!car.sections.length) car.sections = [{ key: "design", headline: "Leírás még nincs generálva", body: "Az Ajánlatmotorban: „Mindhárom leírás generálása”.", image_index: 0 }];
  const nonce = randomHex(12);
  return c.html(renderOffer(pub, { token: "elonezet", test: isTest(c.env), preview: true, nonce }), 200, cspHeaders(nonce));
});

/* ---------------- candidates ---------------- */
staff.post("/jelolt/:cid/overrides", async (c) => {
  const cid = c.req.param("cid");
  const gc = await guardCand(c, cid); if (gc.err) return gc.err;
  const f = await c.req.parseBody();
  const lines: Record<string, number> = {};
  for (const [k, v] of Object.entries(f)) if (k.startsWith("line_") && String(v).trim() !== "") lines[k.slice(5)] = Number(v);
  const ov: any = { lines };
  if (f.logistics_mode) ov.logistics_mode = String(f.logistics_mode);
  if (String(f.env_group ?? "") !== "") ov.env_group = Number(f.env_group);
  await c.env.DB.prepare("UPDATE am_candidates SET overrides_json = ? WHERE id = ?").bind(JSON.stringify(ov), cid).run();
  await logEvent(c.env, gc.dealId!, c.get("user").name, "overrides", { cid, ov });
  return back(c, reqPath(gc.dealId!), "Díjak mentve.");
});

/** Re-run the car-photo check (removes dealer logos, banners, team photos). */
staff.post("/jelolt/:cid/photos", async (c) => {
  const cid = c.req.param("cid");
  const gc = await guardCand(c, cid); if (gc.err) return gc.err;
  const row = await c.env.DB.prepare("SELECT listing_json FROM am_candidates WHERE id = ?").bind(cid).first<{ listing_json: string }>();
  const before = JSON.parse(row!.listing_json);
  const l = await withCarPhotos(c.env, { ...before, photos_checked: false });
  await c.env.DB.prepare("UPDATE am_candidates SET listing_json = ? WHERE id = ?").bind(JSON.stringify(l), cid).run();
  await logEvent(c.env, gc.dealId!, c.get("user").name, "photos_checked", { cid, kept: l.images.length, removed: l.photos_removed, checked: l.photos_checked });
  if (!c.env.AI) return back(c, reqPath(gc.dealId!), undefined, "A fotószűrő nincs bekötve (Workers AI „AI” binding hiányzik).");
  return back(c, reqPath(gc.dealId!), l.photos_checked
    ? `Fotók ellenőrizve: ${l.images.length} autófotó maradt, ${l.photos_removed} nem autós kép kiszűrve.`
    : undefined, l.photos_checked ? undefined : "A fotók egy részét nem sikerült ellenőrizni, próbálja újra.");
});

/** Next photo becomes the cover (dealer banners are often the first mobile.de image). */
staff.post("/jelolt/:cid/cover", async (c) => {
  const cid = c.req.param("cid");
  const gc = await guardCand(c, cid); if (gc.err) return gc.err;
  const row = await c.env.DB.prepare("SELECT listing_json FROM am_candidates WHERE id = ?").bind(cid).first<{ listing_json: string }>();
  const l = JSON.parse(row!.listing_json);
  if (Array.isArray(l.images) && l.images.length > 1) l.images.push(l.images.shift());
  await c.env.DB.prepare("UPDATE am_candidates SET listing_json = ? WHERE id = ?").bind(JSON.stringify(l), cid).run();
  await logEvent(c.env, gc.dealId!, c.get("user").name, "cover_rotated", { cid });
  return back(c, reqPath(gc.dealId!), "Borítókép cserélve.");
});

staff.post("/jelolt/:cid/lock", async (c) => {
  const cid = c.req.param("cid");
  const gc = await guardCand(c, cid); if (gc.err) return gc.err;
  const f = await c.req.parseBody();
  await c.env.DB.prepare("UPDATE am_candidates SET locked = ? WHERE id = ?").bind(Number(f.locked) ? 1 : 0, cid).run();
  await logEvent(c.env, gc.dealId!, c.get("user").name, Number(f.locked) ? "locked" : "unlocked", { cid });
  return back(c, reqPath(gc.dealId!));
});

staff.post("/jelolt/:cid/slot", async (c) => {
  const cid = c.req.param("cid");
  const gc = await guardCand(c, cid); if (gc.err) return gc.err;
  const f = await c.req.parseBody();
  try { await moveToSlot(c.env, cid, Number(f.slot), c.get("user").name); } catch (e: any) { return back(c, reqPath(gc.dealId!), undefined, e.message); }
  return back(c, reqPath(gc.dealId!), `Áthelyezve a ${f.slot}. helyre.`);
});

staff.post("/jelolt/:cid/describe", async (c) => {
  const cid = c.req.param("cid");
  const gc = await guardCand(c, cid); if (gc.err) return gc.err;
  const { req, cars } = await slotViews(c.env, gc.dealId!);
  const cv = cars.find((x) => x.candidate.id === cid);
  if (!cv) return back(c, reqPath(gc.dealId!), undefined, "Csak helyen lévő autóhoz készül leírás.");
  const { sections, engine } = await describe(c.env, cv.listing, cv.distanceKm, req.customer.language as Lang);
  await c.env.DB.prepare("UPDATE am_candidates SET descriptions_json = ? WHERE id = ?").bind(JSON.stringify(sections), cid).run();
  await logEvent(c.env, gc.dealId!, c.get("user").name, "described", { cid, engine });
  return back(c, reqPath(gc.dealId!), "Leírás kész.");
});

staff.post("/jelolt/:cid/sections", async (c) => {
  const cid = c.req.param("cid");
  const gc = await guardCand(c, cid); if (gc.err) return gc.err;
  const f = await c.req.parseBody();
  const sections: Section[] = [];
  for (let i = 0; f[`k_${i}`] !== undefined; i++)
    sections.push({ key: String(f[`k_${i}`]), headline: String(f[`h_${i}`] || "").trim(), body: String(f[`b_${i}`] || "").trim(), image_index: Number(f[`i_${i}`] || 0) });
  await c.env.DB.prepare("UPDATE am_candidates SET descriptions_json = ? WHERE id = ?").bind(JSON.stringify(sections), cid).run();
  await logEvent(c.env, gc.dealId!, c.get("user").name, "sections_edited", { cid });
  return back(c, reqPath(gc.dealId!), "Leírás mentve.");
});

/* ---------------- rates (admin) ---------------- */
const VERIFIABLE = ["regado", "illetek", "illetek.electric_exempt", "fees.eredetiseg", "fees.muszaki", "fees.forgalomba", "fees.rendszam", "logistics", "ugyintezes", "margin"];
const strip = (n: any) => JSON.stringify(n, (k, v) => (k === "verified" ? undefined : v));
const at = (o: any, p: string) => p.split(".").reduce((a, k) => a?.[k], o);

staff.get("/dijak", async (c) => {
  if (!isAdmin(c.get("user"))) return c.text("Csak admin jogosultsággal.", 403);
  const { version, rates } = await loadRates(c.env.DB);
  const history = (await c.env.DB.prepare("SELECT version, author, note, created_at FROM am_rates ORDER BY version DESC LIMIT 30").all<any>()).results;
  const contact = await getSetting(c.env, "contact", DEFAULT_CONTACT);
  return page(c, "Díjak", settingsPage({ version, rates, history, contact }), "dijak");
});

staff.post("/dijak", async (c) => {
  if (!isAdmin(c.get("user"))) return c.text("Csak admin jogosultsággal.", 403);
  const f = await c.req.parseBody({ all: true });
  const { rates: cur } = await loadRates(c.env.DB);
  let next: RateConfig;
  try { next = JSON.parse(String(f.json)); } catch (e: any) { return back(c, `${B}/dijak`, undefined, "Hibás JSON: " + e.message); }
  // a changed value loses its confirmation; confirmations only via the checkboxes
  for (const p of VERIFIABLE) {
    const node = at(next, p);
    if (node && typeof node === "object" && "verified" in node) node.verified = strip(at(cur, p)) === strip(node) ? at(cur, p).verified : false;
  }
  const confirms = ([] as unknown[]).concat(f.confirm ?? []).map((x) => String(x).trim()).filter((p) => VERIFIABLE.includes(p));
  for (const p of confirms) next = setVerified(next, p, true);
  const u = c.get("user");
  const v = await saveRates(c.env.DB, next, u.name, String(f.note || "").slice(0, 300) + (confirms.length ? ` [megerősítve: ${confirms.join(", ")}]` : ""));
  await logEvent(c.env, null, u.name, "rates_saved", { version: v, confirms, still_unverified: unverifiedPaths(next) });
  return back(c, `${B}/dijak`, `Mentve: v${v}.`);
});

staff.post("/dijak/kapcsolat", async (c) => {
  if (!isAdmin(c.get("user"))) return c.text("Csak admin jogosultsággal.", 403);
  const f = await c.req.parseBody();
  await setSetting(c.env, "contact", { name: f.name, title: f.title, phone: f.phone, whatsapp: f.whatsapp, email: f.email });
  return back(c, `${B}/dijak`, "Kapcsolattartó mentve.");
});

/* ---------------- Chrome extension tokens (per belső user) ---------------- */
export const hashExtToken = (t: string) => sha256Hex("am-ext|" + t);

staff.get("/bovitmeny", async (c) => {
  const u = c.get("user");
  const sql = `SELECT t.id, t.label, t.created_at, t.last_used_at, t.revoked_at, us.name AS user_name FROM am_ext_tokens t JOIN users us ON us.id = t.user_id
    ${isAdmin(u) ? "" : "WHERE t.user_id = ?"} ORDER BY t.created_at DESC`;
  const st = c.env.DB.prepare(sql);
  const tokens = (isAdmin(u) ? await st.all<any>() : await st.bind(u.id).all<any>()).results;
  const once = c.req.query("t");
  let fresh: string | null = null;
  if (once && /^[a-f0-9]{24}$/.test(once)) {
    const v = await cacheGet<{ token: string; user: number }>(c.env, `once:${once}`);
    if (v && v.user === u.id) fresh = v.token;
    await cacheDel(c.env, `once:${once}`);
  }
  return page(c, "Chrome bővítmény", extensionPage(tokens, fresh, baseUrl(c.env, c.req.raw), isAdmin(u)), "bovitmeny");
});

staff.post("/bovitmeny", async (c) => {
  const u = c.get("user");
  const f = await c.req.parseBody();
  const token = "cax_" + randomHex(24);
  await c.env.DB.prepare("INSERT INTO am_ext_tokens (id, user_id, label, token_hash, created_at) VALUES (?,?,?,?,?)")
    .bind(newId("ext"), u.id, String(f.label || "").slice(0, 80), await hashExtToken(token), nowIso()).run();
  // shown once: handed over through a 2-minute cache entry bound to this user, never through the URL
  const once = randomHex(12);
  await cachePut(c.env, `once:${once}`, { token, user: u.id }, 120);
  await logEvent(c.env, null, u.name, "ext_token_created");
  return c.redirect(`${B}/bovitmeny?t=${once}`, 303);
});

staff.post("/bovitmeny/:id/visszavon", async (c) => {
  const u = c.get("user");
  const id = c.req.param("id");
  const q = isAdmin(u) ? c.env.DB.prepare("UPDATE am_ext_tokens SET revoked_at = ? WHERE id = ?").bind(nowIso(), id)
    : c.env.DB.prepare("UPDATE am_ext_tokens SET revoked_at = ? WHERE id = ? AND user_id = ?").bind(nowIso(), id, u.id);
  await q.run();
  return back(c, `${B}/bovitmeny`, "Token visszavonva.");
});

/* ---------------- test helper ---------------- */

staff.post("/teszt/demo", async (c) => {
  if (!isTest(c.env)) return c.notFound();
  const u = c.get("user");
  const r = await createRequest(c.env, {
    source: "email", messageId: `<demo-${Date.now()}@example.com>`, fromEmail: DEMO_EMAIL.from, fromName: DEMO_EMAIL.name,
    subject: DEMO_EMAIL.subject, text: DEMO_EMAIL.text, actor: `teszt (${u.name})`, origin: baseUrl(c.env, c.req.raw),
  });
  return back(c, reqPath(r.dealId), "Demó e-mail feldolgozva: új Import ügyfél + adatlap (Ajánlatra vár) + top 3.");
});

export function cspHeaders(nonce: string) {
  return {
    "Content-Security-Policy": [
      "default-src 'self'", `script-src 'nonce-${nonce}'`, "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com", "img-src 'self' data: https://www.caradvance.hu https://img.classistatic.de", "connect-src 'self'",
      "form-action 'self'", "frame-ancestors 'none'", "base-uri 'none'",
    ].join("; "),
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  };
}
