import { Hono } from "hono";
import type { Env, Lang, Requirements, Section } from "../types";
import { adminAuth, hashExtToken } from "../lib/auth";
import { addListing, getCandidates, getRequest, moveToSlot, processRequest, publishBlockers, refreshPositioning, slotViews, type RequestRow } from "../lib/engine";
import { createRequest } from "../lib/intake";
import { describe } from "../lib/ai/describe";
import { getSource, ListingValidationError } from "../lib/sources";
import { buildPublicOffer, DEFAULT_CONTACT, publishOffer } from "../lib/offers";
import { loadRates, saveRates, setVerified, unverifiedPaths, type RateConfig } from "../lib/rates";
import { transition } from "../lib/status";
import { getSetting, isTest, logEvent, newId, newToken, nowIso, setSetting } from "../lib/util";
import { adminLayout, extensionPage, inboxPage, newLeadPage, requestPage, settingsPage } from "../views/admin";
import { renderOffer } from "../views/offer";

type H = { Bindings: Env; Variables: { user: string } };
export const admin = new Hono<H>();
admin.use("*", adminAuth);

const page = (c: any, title: string, body: string) =>
  c.html(adminLayout(title, body, { test: isTest(c.env), msg: c.req.query("msg"), err: c.req.query("err") }));
const back = (c: any, path: string, msg?: string, err?: string) =>
  c.redirect(`${path}${msg ? `?msg=${encodeURIComponent(msg)}` : err ? `?err=${encodeURIComponent(err)}` : ""}`, 303);

admin.get("/", async (c) => {
  const rows = (await c.env.DB.prepare("SELECT * FROM requests ORDER BY created_at DESC LIMIT 200").all<RequestRow>()).results;
  return page(c, "Igények", inboxPage(rows, isTest(c.env)));
});

admin.get("/new", (c) => page(c, "Új igény", newLeadPage()));
admin.post("/new", async (c) => {
  const f = await c.req.parseBody();
  const { id } = await createRequest(c.env, { source: "manual", fromEmail: String(f.email || "") || undefined, fromName: String(f.name || "") || undefined, text: String(f.text || ""), actor: c.get("user") });
  return back(c, `/admin/r/${id}`, "Igény rögzítve, keresés lefutott.");
});

admin.get("/r/:id", async (c) => {
  const id = c.req.param("id");
  const row = await getRequest(c.env, id);
  if (!row) return c.notFound();
  const req: Requirements | null = row.requirements_json ? JSON.parse(row.requirements_json) : null;
  const all = await getCandidates(c.env, id);
  const { cars } = req ? await slotViews(c.env, id) : { cars: [] };
  const offers = (await c.env.DB.prepare("SELECT token, status, published_at, expires_at, first_viewed_at, chosen_candidate_id FROM offers WHERE request_id = ? ORDER BY published_at DESC").bind(id).all<any>()).results;
  const events = (await c.env.DB.prepare("SELECT actor, type, from_status, to_status, at, data_json FROM events WHERE request_id = ? ORDER BY id DESC LIMIT 60").bind(id).all<any>()).results;
  return page(c, req?.customer.name || "Igény", requestPage({
    row, req, cars, runners: all.filter((x) => !x.slot && x.pool === "runner"), rejected: all.filter((x) => x.pool === "rejected"),
    blockers: publishBlockers(cars), offers, events, baseUrl: c.env.PUBLIC_BASE_URL, extraction: row.extraction_meta_json ? JSON.parse(row.extraction_meta_json) : null,
  }));
});

admin.post("/r/:id/requirements", async (c) => {
  const id = c.req.param("id");
  const f = await c.req.parseBody();
  let req: Requirements;
  try {
    req = JSON.parse(String(f.json));
    if (!req.vehicle || !req.customer) throw new Error("vehicle/customer hiányzik");
    req.missing_critical_fields = (req.vehicle.makes.length || req.vehicle.body_types.length) && (req.vehicle.budget_huf_max || req.vehicle.budget_eur_max)
      ? [] : req.missing_critical_fields;
  } catch (e: any) {
    return back(c, `/admin/r/${id}`, undefined, "Hibás JSON: " + e.message);
  }
  await c.env.DB.prepare("UPDATE requests SET requirements_json = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(req), nowIso(), id).run();
  await logEvent(c.env, id, c.get("user"), "requirements_edited");
  const row = await getRequest(c.env, id);
  if (row && ["REJECTED", "READY"].includes(row.status)) await transition(c.env, id, "NEEDS_REVIEW", c.get("user"));
  await processRequest(c.env, id, c.get("user"));
  return back(c, `/admin/r/${id}`, "Mentve, keresés újrafuttatva.");
});

admin.post("/r/:id/search", async (c) => {
  const id = c.req.param("id");
  const row = await getRequest(c.env, id);
  if (row?.status === "READY") await transition(c.env, id, "NEEDS_REVIEW", c.get("user"));
  await processRequest(c.env, id, c.get("user"));
  return back(c, `/admin/r/${id}`, "Keresés újrafuttatva (zárolt és kézzel hozzáadott autók maradtak).");
});

admin.post("/r/:id/add", async (c) => {
  const id = c.req.param("id");
  const f = await c.req.parseBody();
  const target = f.target === "runner" ? "runner" : Number(f.target);
  const listing = await getSource(c.env).getById(String(f.url || ""));
  if (!listing) return back(c, `/admin/r/${id}`, undefined, "A hirdetés nem található (tesztben: 1001–1007, 2001, 3001).");
  try {
    const r = await addListing(c.env, id, listing, target as any, "manual", c.get("user"));
    if (r.duplicate) return back(c, `/admin/r/${id}`, undefined, "Ez a hirdetés már szerepel az igénynél.");
  } catch (e: any) {
    return back(c, `/admin/r/${id}`, undefined, e.message);
  }
  return back(c, `/admin/r/${id}`, "Autó hozzáadva.");
});

admin.post("/r/:id/describe", async (c) => {
  const id = c.req.param("id");
  const { req, cars } = await slotViews(c.env, id);
  for (const cv of cars) {
    const { sections, engine } = await describe(c.env, cv.listing, cv.distanceKm, req.customer.language as Lang);
    await c.env.DB.prepare("UPDATE candidates SET descriptions_json = ? WHERE id = ?").bind(JSON.stringify(sections), cv.candidate.id).run();
    await logEvent(c.env, id, c.get("user"), "described", { cid: cv.candidate.id, engine });
  }
  return back(c, `/admin/r/${id}`, `Leírások elkészültek (${c.env.ANTHROPIC_API_KEY ? c.env.AI_MODEL : "sablon, nincs API kulcs"}).`);
});

admin.post("/r/:id/publish", async (c) => {
  const id = c.req.param("id");
  try {
    const { token } = await publishOffer(c.env, id, c.get("user"));
    return back(c, `/admin/r/${id}`, `Közzétéve: ${c.env.PUBLIC_BASE_URL}/o/${token}`);
  } catch (e: any) {
    return back(c, `/admin/r/${id}`, undefined, e.message);
  }
});

admin.get("/r/:id/preview", async (c) => {
  const id = c.req.param("id");
  const { req, cars } = await slotViews(c.env, id);
  if (!cars.length) return c.text("Még nincs autó a helyeken.", 400);
  const pub = await buildPublicOffer(c.env, id, cars, req, "ELŐNÉZET", new Date(Date.now() + Number(c.env.OFFER_VALID_DAYS) * 864e5));
  for (const car of pub.cars) if (!car.sections.length) car.sections = [{ key: "design", headline: "Leírás még nincs generálva", body: "Az adminban: „Leírás generálása”.", image_index: 0 }];
  const nonce = newToken(12);
  return c.html(renderOffer(pub, { token: "preview", test: isTest(c.env), preview: true, nonce }), 200, cspHeaders(nonce));
});

admin.post("/c/:cid/overrides", async (c) => {
  const cid = c.req.param("cid");
  const f = await c.req.parseBody();
  const lines: Record<string, number> = {};
  for (const [k, v] of Object.entries(f)) if (k.startsWith("line_") && String(v).trim() !== "") lines[k.slice(5)] = Number(v);
  const ov: any = { lines };
  if (f.logistics_mode) ov.logistics_mode = String(f.logistics_mode);
  if (String(f.env_group ?? "") !== "") ov.env_group = Number(f.env_group);
  const cand = await c.env.DB.prepare("SELECT request_id, locked FROM candidates WHERE id = ?").bind(cid).first<{ request_id: string; locked: number }>();
  if (!cand) return c.notFound();
  await c.env.DB.prepare("UPDATE candidates SET overrides_json = ? WHERE id = ?").bind(JSON.stringify(ov), cid).run();
  await logEvent(c.env, cand.request_id, c.get("user"), "overrides", { cid, ov });
  return back(c, `/admin/r/${cand.request_id}`, "Díjak mentve.");
});

admin.post("/c/:cid/lock", async (c) => {
  const cid = c.req.param("cid");
  const f = await c.req.parseBody();
  const cand = await c.env.DB.prepare("SELECT request_id FROM candidates WHERE id = ?").bind(cid).first<{ request_id: string }>();
  if (!cand) return c.notFound();
  await c.env.DB.prepare("UPDATE candidates SET locked = ? WHERE id = ?").bind(Number(f.locked) ? 1 : 0, cid).run();
  await logEvent(c.env, cand.request_id, c.get("user"), Number(f.locked) ? "locked" : "unlocked", { cid });
  return back(c, `/admin/r/${cand.request_id}`);
});

admin.post("/c/:cid/slot", async (c) => {
  const cid = c.req.param("cid");
  const f = await c.req.parseBody();
  const cand = await c.env.DB.prepare("SELECT request_id FROM candidates WHERE id = ?").bind(cid).first<{ request_id: string }>();
  if (!cand) return c.notFound();
  try { await moveToSlot(c.env, cid, Number(f.slot), c.get("user")); } catch (e: any) { return back(c, `/admin/r/${cand.request_id}`, undefined, e.message); }
  return back(c, `/admin/r/${cand.request_id}`, `Áthelyezve a ${f.slot}. helyre.`);
});

admin.post("/c/:cid/describe", async (c) => {
  const cid = c.req.param("cid");
  const cand = await c.env.DB.prepare("SELECT request_id FROM candidates WHERE id = ?").bind(cid).first<{ request_id: string }>();
  if (!cand) return c.notFound();
  const { req, cars } = await slotViews(c.env, cand.request_id);
  const cv = cars.find((x) => x.candidate.id === cid);
  if (!cv) return back(c, `/admin/r/${cand.request_id}`, undefined, "Csak helyen lévő autóhoz készül leírás.");
  const { sections, engine } = await describe(c.env, cv.listing, cv.distanceKm, req.customer.language as Lang);
  await c.env.DB.prepare("UPDATE candidates SET descriptions_json = ? WHERE id = ?").bind(JSON.stringify(sections), cid).run();
  await logEvent(c.env, cand.request_id, c.get("user"), "described", { cid, engine });
  return back(c, `/admin/r/${cand.request_id}`, "Leírás kész.");
});

admin.post("/c/:cid/sections", async (c) => {
  const cid = c.req.param("cid");
  const f = await c.req.parseBody();
  const cand = await c.env.DB.prepare("SELECT request_id FROM candidates WHERE id = ?").bind(cid).first<{ request_id: string }>();
  if (!cand) return c.notFound();
  const sections: Section[] = [];
  for (let i = 0; f[`k_${i}`] !== undefined; i++)
    sections.push({ key: String(f[`k_${i}`]), headline: String(f[`h_${i}`] || "").trim(), body: String(f[`b_${i}`] || "").trim(), image_index: Number(f[`i_${i}`] || 0) });
  await c.env.DB.prepare("UPDATE candidates SET descriptions_json = ? WHERE id = ?").bind(JSON.stringify(sections), cid).run();
  await logEvent(c.env, cand.request_id, c.get("user"), "sections_edited", { cid });
  return back(c, `/admin/r/${cand.request_id}`, "Leírás mentve.");
});

// ---- settings -------------------------------------------------------------
admin.get("/settings", async (c) => {
  const { version, rates } = await loadRates(c.env.DB);
  const history = (await c.env.DB.prepare("SELECT version, author, note, created_at FROM rate_config ORDER BY version DESC LIMIT 30").all<any>()).results;
  const contact = await getSetting(c.env, "contact", DEFAULT_CONTACT);
  return page(c, "Beállítások", settingsPage({ version, rates, history, contact }));
});

const VERIFIABLE = ["regado", "illetek", "illetek.electric_exempt", "fees.eredetiseg", "fees.muszaki", "fees.forgalomba", "fees.rendszam", "logistics", "ugyintezes", "margin"];
const strip = (n: any) => JSON.stringify(n, (k, v) => (k === "verified" ? undefined : v));
const at = (o: any, p: string) => p.split(".").reduce((a, k) => a?.[k], o);

admin.post("/settings", async (c) => {
  const f = await c.req.parseBody({ all: true });
  const { rates: cur } = await loadRates(c.env.DB);
  let next: RateConfig;
  try { next = JSON.parse(String(f.json)); } catch (e: any) { return back(c, "/admin/settings", undefined, "Hibás JSON: " + e.message); }
  // a changed value loses its confirmation; confirmations only via the checkboxes
  for (const p of VERIFIABLE) {
    const node = at(next, p);
    if (node && typeof node === "object" && "verified" in node) node.verified = strip(at(cur, p)) === strip(node) ? at(cur, p).verified : false;
  }
  const confirms = ([] as unknown[]).concat(f.confirm ?? []).map((x) => String(x).trim()).filter((p) => VERIFIABLE.includes(p));
  for (const p of confirms) next = setVerified(next, p, true);
  const v = await saveRates(c.env.DB, next, c.get("user"), String(f.note || "").slice(0, 300) + (confirms.length ? ` [megerősítve: ${confirms.join(", ")}]` : ""));
  await logEvent(c.env, null, c.get("user"), "rates_saved", { version: v, confirms, still_unverified: unverifiedPaths(next) });
  return back(c, "/admin/settings", `Mentve: v${v}.`);
});

admin.post("/settings/contact", async (c) => {
  const f = await c.req.parseBody();
  await setSetting(c.env, "contact", { name: f.name, title: f.title, phone: f.phone, whatsapp: f.whatsapp, email: f.email });
  return back(c, "/admin/settings", "Kapcsolattartó mentve.");
});

admin.get("/settings/extension", async (c) => {
  const tokens = (await c.env.DB.prepare("SELECT id, user, created_at, last_used_at, revoked_at FROM ext_tokens ORDER BY created_at DESC").all<any>()).results;
  const fresh = c.req.query("t") ? await c.env.KV.get(`once:${c.req.query("t")}`) : null;
  if (fresh) await c.env.KV.delete(`once:${c.req.query("t")}`);
  return page(c, "Chrome bővítmény", extensionPage(tokens, fresh, c.env.PUBLIC_BASE_URL));
});

admin.post("/settings/extension", async (c) => {
  const f = await c.req.parseBody();
  const token = "cax_" + newToken(30);
  await c.env.DB.prepare("INSERT INTO ext_tokens (id, user, token_hash, created_at) VALUES (?,?,?,?)")
    .bind(newId("ext"), String(f.user || "ismeretlen").slice(0, 80), await hashExtToken(c.env, token), nowIso()).run();
  // show once: hand over via a short-lived KV entry, never via URL
  const once = newToken(12);
  await c.env.KV.put(`once:${once}`, token, { expirationTtl: 120 });
  return c.redirect(`/admin/settings/extension?t=${once}`, 303);
});

admin.post("/settings/extension/:id/revoke", async (c) => {
  await c.env.DB.prepare("UPDATE ext_tokens SET revoked_at = ? WHERE id = ?").bind(nowIso(), c.req.param("id")).run();
  return back(c, "/admin/settings/extension", "Token visszavonva.");
});

// ---- test helpers -----------------------------------------------------------
export const DEMO_EMAIL = {
  subject: "BMW i5 Touring import",
  from: "kiss.peter@example.com",
  name: "Kiss Péter",
  text: `Szia!

Egy BMW i5 Touring-ot keresnék Németországból. Elektromos, automata, max 2 éves, 50 ezer km alatt.
Panorámatető és vonóhorog mindenképp kell, head-up display jó lenne ha van.
Kb. 25 millió forint a keret, Budapesten forgalomba helyezve, mindennel együtt.
Magánszemélyként vásárolnék.

Üdvözlettel,
Kiss Péter
+36 30 123 4567`,
};

admin.post("/test/inbound", async (c) => {
  if (!isTest(c.env)) return c.notFound();
  const { id } = await createRequest(c.env, {
    source: "email", messageId: `<demo-${Date.now()}@example.com>`, fromEmail: DEMO_EMAIL.from, fromName: DEMO_EMAIL.name,
    subject: DEMO_EMAIL.subject, text: DEMO_EMAIL.text, actor: "test",
  });
  return back(c, `/admin/r/${id}`, "Demó e-mail feldolgozva.");
});

export function cspHeaders(nonce: string) {
  return {
    "Content-Security-Policy": [
      "default-src 'self'", `script-src 'nonce-${nonce}'`, "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com", "img-src 'self' data: https://www.caradvance.hu", "connect-src 'self'",
      "form-action 'self'", "frame-ancestors 'none'", "base-uri 'none'",
    ].join("; "),
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  };
}
