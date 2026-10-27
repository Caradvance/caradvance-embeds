/**
 * Chrome extension API: www.caradvance.hu/api/ajanlatmotor/*
 * Auth: per-user bearer token (am_ext_tokens → belső users), same deal visibility as the belső UI.
 */
import { Hono } from "hono";
import type { Env, Requirements } from "./types";
import { baseUrl, cacheGet, canSeeDeal, ensureAm, isAdmin, isTest, logEvent, nowIso, rateLimit, sessionUser, type Staff } from "./am";
import { addListing, getRequest } from "./engine";
import { buildSearchUrl, ListingValidationError, normalizeListing } from "./sources";
import { mockImageSvg } from "./mock";
import { PARSER_CONFIG } from "./parser-config";
import { hashExtToken } from "./routes-staff";

type H = { Bindings: Env; Variables: { user: Staff } };
export const ext = new Hono<H>({ strict: false }).basePath("/api/ajanlatmotor");

// CORS: only the Caradvance extension origin (any extension origin while AM_EXTENSION_ID is not set)
ext.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "";
  const id = c.env.AM_EXTENSION_ID as string | undefined;
  const sameOrigin = !!origin && origin === new URL(c.req.url).origin;
  const allowed = sameOrigin || (id ? origin === `chrome-extension://${id}` : origin.startsWith("chrome-extension://") || !origin);
  if (c.req.method === "OPTIONS") {
    return c.body(null, allowed ? 204 : 403, allowed ? {
      "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "600",
    } : {});
  }
  if (origin && !allowed) return c.json({ error: "origin not allowed" }, 403);
  await ensureAm(c.env);
  await next();
  if (origin && !sameOrigin) { c.res.headers.set("Access-Control-Allow-Origin", origin); c.res.headers.set("Access-Control-Allow-Credentials", "true"); }
  c.res.headers.set("Vary", "Origin");
  c.res.headers.set("Cache-Control", "no-store");
});

ext.get("/parser-config", (c) => c.json(PARSER_CONFIG, 200, { "Cache-Control": "max-age=3600" }));

ext.get("/mock-img/:ad/:file", (c) => {
  if (!isTest(c.env)) return c.notFound();
  const svg = mockImageSvg(c.req.param("ad"), Number(c.req.param("file").split(".")[0]));
  return svg ? c.body(svg, 200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" }) : c.notFound();
});

ext.use("/ext/*", async (c, next) => {
  const h = c.req.header("Authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  // Without a token the belső session (ca_session) is used: from the site itself, or from the Caradvance extension
  // (its origin passed the check above). Foreign web origins were rejected above, so a POST can't be forged
  // cross-site; a GET without Origin only returns data to the logged-in user's own browser.
  if (!token) {
    const origin = c.req.header("Origin") || "";
    const site = c.req.header("Sec-Fetch-Site") || "";
    const self = new URL(c.req.url).origin;
    const fromSite = origin === self && (site === "same-origin" || site === "");
    const fromExtension = origin.startsWith("chrome-extension://");
    const plainGet = !origin && c.req.method === "GET";
    if (fromSite || fromExtension || plainGet) {
      const su = await sessionUser(c.env, c.req.raw);
      if (su) { c.set("user", su); return next(); }
    }
    return c.json({ error: "missing token" }, 401);
  }
  if (token.length < 20) return c.json({ error: "missing token" }, 401);
  const row = await c.env.DB.prepare(`SELECT t.id, u.id AS uid, u.email, u.name, u.role FROM am_ext_tokens t JOIN users u ON u.id = t.user_id
      WHERE t.token_hash = ? AND t.revoked_at IS NULL`).bind(await hashExtToken(token)).first<{ id: string; uid: number; email: string; name: string; role: string }>();
  if (!row) return c.json({ error: "invalid token" }, 401);
  await c.env.DB.prepare("UPDATE am_ext_tokens SET last_used_at = ? WHERE id = ?").bind(nowIso(), row.id).run();
  c.set("user", { id: row.uid, email: row.email, name: row.name, role: row.role });
  await next();
});

ext.get("/ext/requests", async (c) => {
  const u = c.get("user");
  const statuses = ["NEW", "SEARCHING", "NEEDS_REVIEW", "NO_MATCH", "READY"];
  const sql = `SELECT r.deal_id, r.status, r.created_at, r.requirements_json, d.name, d.email FROM am_requests r JOIN deals d ON d.id = r.deal_id
    WHERE r.status IN (${statuses.map(() => "?").join(",")}) ${isAdmin(u) ? "" : "AND d.assigned_to = ?"} ORDER BY r.created_at DESC LIMIT 50`;
  const st = c.env.DB.prepare(sql);
  const rows = (isAdmin(u) ? await st.bind(...statuses).all<any>() : await st.bind(...statuses, u.id).all<any>()).results;
  return c.json({
    user: u.name,
    requests: rows.map((r) => {
      const req: Requirements | null = r.requirements_json ? JSON.parse(r.requirements_json) : null;
      return { id: r.deal_id, status: r.status, created_at: r.created_at, customer: r.name || req?.customer.name || r.email, summary: req?.raw_summary?.slice(0, 120) || "" };
    }),
  });
});

ext.get("/ext/requests/:id/search-url", async (c) => {
  const id = Number(c.req.param("id"));
  if (!(await canSeeDeal(c.env, c.get("user"), id))) return c.json({ error: "forbidden" }, 403);
  const row = await getRequest(c.env, id);
  if (!row?.requirements_json) return c.json({ error: "not found" }, 404);
  const req: Requirements = JSON.parse(row.requirements_json);
  // rough vehicle-price ceiling: budget minus ~2.5M HUF import costs, at the cached rate
  const fx = (await cacheGet<{ rate: number }>(c.env, "fx:EURHUF"))?.rate || 395;
  const ceiling = req.vehicle.budget_huf_max ? (req.vehicle.budget_huf_max - 2_500_000) / fx : req.vehicle.budget_eur_max;
  return c.json({ url: buildSearchUrl(req, ceiling) });
});

ext.post("/ext/listings", async (c) => {
  const u = c.get("user");
  if (!(await rateLimit(c.env, `ext:${u.id}`, 60, 60))) return c.json({ error: "rate limited" }, 429);
  const b = await c.req.json<{ request_id: number | string; slot: number | "runner"; listing: any; source_url: string; parser_version: number; parser_layers?: string[]; page_snapshot_hash?: string }>();
  const dealId = Number(b.request_id);
  if (!(await canSeeDeal(c.env, u, dealId))) return c.json({ error: "forbidden" }, 403);
  const row = await getRequest(c.env, dealId);
  if (!row) return c.json({ error: "request not found" }, 404);
  const missing = ["price_gross_eur", "km", "first_registration", "power_kw"].filter((k) => b.listing?.[k] == null || b.listing?.[k] === "");
  if (missing.length >= 2) await logEvent(c.env, dealId, `ext:${u.name}`, "parser_miss", { missing, url: b.source_url, parser_version: b.parser_version, layers: b.parser_layers });
  let listing;
  try {
    listing = normalizeListing({ ...b.listing, url: b.source_url || b.listing?.url }, { allowLocalImages: isTest(c.env) });
  } catch (e) {
    if (e instanceof ListingValidationError) return c.json({ error: "validation", fields: e.problems }, 422);
    throw e;
  }
  const target = b.slot === "runner" ? "runner" : Number(b.slot);
  if (target !== "runner" && ![1, 2, 3].includes(target)) return c.json({ error: "bad slot" }, 400);
  const adminUrl = `${baseUrl(c.env, c.req.raw)}/belso/ajanlatmotor/igeny/${dealId}`;
  try {
    const r = await addListing(c.env, dealId, listing, target as any, "extension", `ext:${u.name}`);
    await logEvent(c.env, dealId, `ext:${u.name}`, "ext_push", { ad_id: listing.ad_id, parser_version: b.parser_version, hash: b.page_snapshot_hash });
    if (r.duplicate) return c.json({ duplicate: true, admin_url: adminUrl }, 409);
    return c.json({
      ok: true, candidate_id: r.candidateId, score: r.score, distance_km: Math.round(r.distanceKm!), customer_total_huf: r.costs!.customer_total_huf,
      warnings: r.costs!.warnings, not_matching: r.rejected, admin_url: adminUrl,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});
