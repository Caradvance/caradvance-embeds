import { Hono } from "hono";
import type { Env, Requirements } from "../types";
import { extAuth } from "../lib/auth";
import { addListing, getRequest } from "../lib/engine";
import { buildSearchUrl, ListingValidationError, normalizeListing } from "../lib/sources";
import { isTest, logEvent, rateLimit } from "../lib/util";

type H = { Bindings: Env; Variables: { user: string } };
export const ext = new Hono<H>();

// CORS: only the Caradvance extension origin (any extension origin in test when EXTENSION_ID is empty)
ext.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "";
  const allowed = c.env.EXTENSION_ID ? origin === `chrome-extension://${c.env.EXTENSION_ID}` : origin.startsWith("chrome-extension://") || (isTest(c.env) && !origin);
  if (c.req.method === "OPTIONS") {
    return c.body(null, allowed ? 204 : 403, allowed ? {
      "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "600",
    } : {});
  }
  if (origin && !allowed) return c.json({ error: "origin not allowed" }, 403);
  await next();
  if (origin) c.res.headers.set("Access-Control-Allow-Origin", origin);
  c.res.headers.set("Vary", "Origin");
});

/** Remote parser config: lets us fix extraction when mobile.de changes markup, without republishing. */
export const PARSER_CONFIG = {
  version: 1,
  listing_url: ["/auto-inserat/", "/fahrzeuge/details.html"],
  search_url: ["/fahrzeuge/search.html", "/auto/"],
  search_card_selectors: ["[data-testid^='result-listing']", "article[class*='result']", "a[href*='details.html?id=']"],
  state_markers: ["firstRegistration", "mileage", "make"],
  dom_patterns: {
    km: "(?:Kilometerstand|Mileage)\\s*([\\d.]+)\\s*km",
    first_registration: "(?:Erstzulassung|First registration)\\s*(\\d{2}/\\d{4})",
    power_kw: "(?:Leistung|Power)\\s*(\\d+)\\s*kW",
    price: "(\\d{1,3}(?:\\.\\d{3})+)\\s*€",
    fuel: "(?:Kraftstoffart|Fuel)\\s*([A-Za-zäöüÄÖÜ\\- ]+?)\\s{2,}",
    gearbox: "(?:Getriebe|Transmission)\\s*(Automatik|Schaltgetriebe|Automatic|Manual)",
    color: "(?:Farbe \\(Hersteller\\)|Manufacturer colour)\\s*(.+?)\\s{2,}",
    zip_city: "\\b(\\d{5})\\s+([A-ZÄÖÜ][\\wäöüß\\-]+(?: [\\wäöüß\\-]+){0,3}?)(?=\\s{2}|$)",
  },
  equipment_heading: ["Ausstattung", "Features"],
  critical_fields: ["price_gross_eur", "km", "first_registration", "power_kw", "seller_location"],
};

ext.get("/parser-config", (c) => c.json(PARSER_CONFIG, 200, { "Cache-Control": "max-age=3600" }));

ext.use("/requests*", extAuth);
ext.use("/listings*", extAuth);

ext.get("/requests", async (c) => {
  const statuses = (c.req.query("status") || "NEW,SEARCHING,NEEDS_REVIEW,NO_MATCH,READY").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);
  const rows = (await c.env.DB.prepare(`SELECT id, status, created_at, from_email, requirements_json FROM requests WHERE status IN (${statuses.map(() => "?").join(",")}) ORDER BY created_at DESC LIMIT 50`)
    .bind(...statuses).all<any>()).results;
  return c.json({
    user: c.get("user"),
    requests: rows.map((r) => {
      const req: Requirements | null = r.requirements_json ? JSON.parse(r.requirements_json) : null;
      return { id: r.id, status: r.status, created_at: r.created_at, customer: req?.customer.name || r.from_email, summary: req?.raw_summary?.slice(0, 120) || "" };
    }),
  });
});

ext.get("/requests/:id/search-url", async (c) => {
  const row = await getRequest(c.env, c.req.param("id"));
  if (!row?.requirements_json) return c.json({ error: "not found" }, 404);
  const req: Requirements = JSON.parse(row.requirements_json);
  // rough vehicle-price ceiling: budget minus ~2.5M HUF import costs, converted at the stored rate
  const fx = ((await c.env.KV.get("fx:EURHUF", "json")) as any)?.rate || 395;
  const ceiling = req.vehicle.budget_huf_max ? (req.vehicle.budget_huf_max - 2_500_000) / fx : req.vehicle.budget_eur_max;
  return c.json({ url: buildSearchUrl(req, ceiling) });
});

ext.post("/listings", async (c) => {
  if (!(await rateLimit(c.env, `ext:${c.get("user")}`, 60, 60))) return c.json({ error: "rate limited" }, 429);
  const b = await c.req.json<{ request_id: string; slot: number | "runner"; listing: any; source_url: string; parser_version: number; parser_layers?: string[]; page_snapshot_hash?: string }>();
  const row = await getRequest(c.env, b.request_id);
  if (!row) return c.json({ error: "request not found" }, 404);
  const missing = ["price_gross_eur", "km", "first_registration", "power_kw"].filter((k) => b.listing?.[k] == null || b.listing?.[k] === "");
  if (missing.length >= 2) await logEvent(c.env, b.request_id, c.get("user"), "parser_miss", { missing, url: b.source_url, parser_version: b.parser_version, layers: b.parser_layers });
  let listing;
  try {
    listing = normalizeListing({ ...b.listing, url: b.source_url || b.listing?.url }, { allowLocalImages: isTest(c.env) });
  } catch (e) {
    if (e instanceof ListingValidationError) return c.json({ error: "validation", fields: e.problems }, 422);
    throw e;
  }
  const target = b.slot === "runner" ? "runner" : Number(b.slot);
  if (target !== "runner" && ![1, 2, 3].includes(target)) return c.json({ error: "bad slot" }, 400);
  try {
    const r = await addListing(c.env, b.request_id, listing, target as any, "extension", c.get("user"));
    await logEvent(c.env, b.request_id, c.get("user"), "ext_push", { ad_id: listing.ad_id, parser_version: b.parser_version, hash: b.page_snapshot_hash });
    if (r.duplicate) return c.json({ duplicate: true, admin_url: `${c.env.PUBLIC_BASE_URL}/admin/r/${b.request_id}` }, 409);
    return c.json({
      ok: true, candidate_id: r.candidateId, score: r.score, distance_km: Math.round(r.distanceKm!), customer_total_huf: r.costs!.customer_total_huf,
      warnings: r.costs!.warnings, not_matching: r.rejected, admin_url: `${c.env.PUBLIC_BASE_URL}/admin/r/${b.request_id}`,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});
