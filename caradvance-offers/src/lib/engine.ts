import type { CostResult, Env, Listing, Requirements, Section } from "../types";
import { computeCosts, type Overrides } from "./costs";
import { distanceToDepot, getFx } from "./geo";
import { loadRates, type RateConfig } from "./rates";
import { hardFilter, pickTop3, rationaleFor, scoreListing, assignPositioning, type Scored } from "./score";
import { getSource } from "./sources";
import { transition } from "./status";
import { clarifyDraft } from "./ai/extract";
import { notifyAdmin } from "./notify";
import { logEvent, newId, nowIso } from "./util";

export interface RequestRow {
  id: string; status: string; source: string; from_email: string | null; subject: string | null; body_text: string | null;
  requirements_json: string | null; extraction_meta_json: string | null; clarify_draft: string | null; search_note: string | null;
  created_at: string; updated_at: string;
}
export interface CandidateRow {
  id: string; request_id: string; slot: number | null; pool: string; ad_id: string; source: string; listing_json: string;
  score: number | null; score_detail_json: string | null; rationale: string | null; positioning: string | null; locked: number;
  distance_km: number | null; distance_method: string | null; overrides_json: string | null; descriptions_json: string | null;
  added_by: string | null; created_at: string;
}

export const getRequest = (env: Env, id: string) => env.DB.prepare("SELECT * FROM requests WHERE id = ?").bind(id).first<RequestRow>();
export const getCandidates = async (env: Env, requestId: string) =>
  (await env.DB.prepare("SELECT * FROM candidates WHERE request_id = ? ORDER BY slot IS NULL, slot, score DESC").bind(requestId).all<CandidateRow>()).results;

/** Geocode by zip/city when the source gave no coordinates (Nominatim, cached). */
async function ensureCoords(env: Env, l: Listing): Promise<Listing> {
  if (l.seller.lat != null && l.seller.lon != null) return l;
  const q = [l.seller.zip, l.seller.city, l.seller.country || "DE"].filter(Boolean).join(" ");
  if (!q.trim()) return l;
  const key = `geo:${q.toLowerCase()}`;
  let c = (await env.KV.get(key, "json")) as { lat: number; lon: number } | null;
  if (!c) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
        headers: { "User-Agent": "Caradvance Offer Engine (info@caradvance.hu)" },
      });
      const j: any[] = r.ok ? await r.json() : [];
      if (j[0]) {
        c = { lat: Number(j[0].lat), lon: Number(j[0].lon) };
        await env.KV.put(key, JSON.stringify(c));
      }
    } catch { /* leave unknown */ }
  }
  return c ? { ...l, seller: { ...l.seller, lat: c.lat, lon: c.lon } } : l;
}

export interface Ctx { rates: RateConfig; rateVersion: number; fx: { rate: number; date: string; fallback: boolean } }

export async function loadCtx(env: Env): Promise<Ctx> {
  const { version, rates } = await loadRates(env.DB);
  const fx = await getFx(env, rates);
  return { rates, rateVersion: version, fx };
}

export async function evaluate(env: Env, ctx: Ctx, req: Requirements, listing: Listing, overrides?: Overrides) {
  const l = await ensureCoords(env, listing);
  const dist = await distanceToDepot(env, l);
  const costs = computeCosts({ listing: l, req, rates: ctx.rates, rateVersion: ctx.rateVersion, fx: ctx.fx, distanceKm: dist.km, distanceFallback: dist.fallback, overrides });
  return { listing: l, dist, costs };
}

/** Full pipeline for one request: search → evaluate → score → top 3 + runner-ups. */
export async function processRequest(env: Env, requestId: string, actor = "system") {
  const row = await getRequest(env, requestId);
  if (!row?.requirements_json) return;
  const req: Requirements = JSON.parse(row.requirements_json);

  if (req.missing_critical_fields.length) {
    await env.DB.prepare("UPDATE requests SET clarify_draft = ?, search_note = ?, updated_at = ? WHERE id = ?")
      .bind(clarifyDraft(req), "Hiányzó adatok miatt nem kerestünk: " + req.missing_critical_fields.join(", "), nowIso(), requestId).run();
    await transition(env, requestId, "NEEDS_REVIEW", actor, { reason: "missing_fields" });
    await notifyAdmin(env, `Pontosítás kell: ${req.customer.name || row.from_email}`, `${env.PUBLIC_BASE_URL}/admin/r/${requestId}`);
    return;
  }

  await transition(env, requestId, "SEARCHING", actor);
  const ctx = await loadCtx(env);
  const source = getSource(env);
  let found: Listing[] = [];
  try {
    found = await source.search(req);
  } catch (e: any) {
    await logEvent(env, requestId, actor, "search_error", { message: String(e?.message || e) });
  }

  // drop previous auto-found, unlocked, non-manual candidates
  await env.DB.prepare("DELETE FROM candidates WHERE request_id = ? AND locked = 0 AND source NOT IN ('manual','extension')").bind(requestId).run();
  const keep = await getCandidates(env, requestId);
  const keepIds = new Set(keep.map((c) => c.ad_id));

  const evaluated: Scored[] = [];
  for (const l0 of found) {
    if (keepIds.has(l0.ad_id)) continue;
    const { listing, dist, costs } = await evaluate(env, ctx, req, l0);
    evaluated.push({ listing, costs, distanceKm: dist.km, distanceMethod: dist.method, score: 0, detail: {}, rejected: hardFilter(listing, req, costs), rationale: "" });
  }
  const eligible = evaluated.filter((s) => !s.rejected.length);
  const totals = eligible.map((s) => s.costs.customer_total_huf);
  const pool = { minTotal: Math.min(...totals, Infinity), maxTotal: Math.max(...totals, 0) };
  for (const s of eligible) {
    const { score, detail } = scoreListing(s.listing, req, s.costs, s.distanceKm, ctx.rates.scoring, pool);
    s.score = score; s.detail = detail; s.rationale = rationaleFor(s, req);
  }

  const lockedSlots = new Set(keep.filter((c) => c.slot).map((c) => c.slot));
  const { top, runners } = pickTop3(eligible);
  const freeSlots = [1, 2, 3].filter((n) => !lockedSlots.has(n));
  const insert = env.DB.prepare(`INSERT INTO candidates (id, request_id, slot, pool, ad_id, source, listing_json, score, score_detail_json, rationale,
    positioning, locked, distance_km, distance_method, overrides_json, descriptions_json, added_by, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?,NULL,NULL,?,?)`);
  const stmts: D1PreparedStatement[] = [];
  const put = (s: Scored, slot: number | null, poolName: string) =>
    stmts.push(insert.bind(newId("cand"), requestId, slot, poolName, s.listing.ad_id, source.name, JSON.stringify(s.listing), s.score,
      JSON.stringify({ ...s.detail, rejected: s.rejected }), s.rejected.length ? "Kiesett: " + s.rejected.join(", ") : s.rationale,
      s.positioning ?? null, s.distanceKm, s.distanceMethod, actor, nowIso()));
  top.slice(0, freeSlots.length).forEach((s, i) => put(s, freeSlots[i], "top"));
  top.slice(freeSlots.length).forEach((s) => put(s, null, "runner"));
  runners.slice(0, 8).forEach((s) => put(s, null, "runner"));
  evaluated.filter((s) => s.rejected.length).slice(0, 12).forEach((s) => put(s, null, "rejected"));
  if (stmts.length) await env.DB.batch(stmts);

  const filled = (await getCandidates(env, requestId)).filter((c) => c.slot).length;
  const note = filled >= 3
    ? `${found.length} hirdetésből ${eligible.length} felelt meg, a legjobb 3 kiválasztva.`
    : suggestRelax(evaluated, req, filled);
  await env.DB.prepare("UPDATE requests SET search_note = ?, updated_at = ? WHERE id = ?").bind(note, nowIso(), requestId).run();
  await transition(env, requestId, filled ? "NEEDS_REVIEW" : "NO_MATCH", actor, { found: found.length, eligible: eligible.length, source: source.name });
  await notifyAdmin(env, `${filled ? "Ajánlat átnézésre vár" : "Nincs találat"}: ${req.customer.name || row.from_email}`,
    `${note}\n\n${env.PUBLIC_BASE_URL}/admin/r/${requestId}`);
}

function suggestRelax(evaluated: Scored[], req: Requirements, filled: number) {
  const counts: Record<string, number> = {};
  for (const s of evaluated) for (const r of s.rejected) counts[r.split(":")[0]] = (counts[r.split(":")[0]] || 0) + 1;
  const worst = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => `${k} (${n} autó esett ki emiatt)`);
  return `Csak ${filled} autó felelt meg. Lazítási javaslat: ${worst.join(", ") || "bővebb keresés"}.`;
}

/** Add a listing (manual link or Chrome extension) to a request: into a slot or the runner pool. */
export async function addListing(env: Env, requestId: string, listing: Listing, target: number | "runner", source: string, actor: string) {
  const row = await getRequest(env, requestId);
  if (!row?.requirements_json) throw new Error("request not found");
  const req: Requirements = JSON.parse(row.requirements_json);
  const existing = await env.DB.prepare("SELECT id FROM candidates WHERE request_id = ? AND ad_id = ?").bind(requestId, listing.ad_id).first();
  if (existing) return { duplicate: true as const, candidateId: (existing as any).id as string };

  const ctx = await loadCtx(env);
  const { listing: l, dist, costs } = await evaluate(env, ctx, req, listing);
  const rejected = hardFilter(l, req, costs);
  const all = (await getCandidates(env, requestId)).filter((c) => c.slot);
  // a single added car has no pool to compare against: neutral price position
  const { score, detail } = scoreListing(l, req, costs, dist.km, ctx.rates.scoring,
    { minTotal: costs.customer_total_huf * 0.5, maxTotal: costs.customer_total_huf * 1.5 });
  const s: Scored = { listing: l, costs, distanceKm: dist.km, distanceMethod: dist.method, score, detail, rejected, rationale: "" };
  const rationale = (rejected.length ? "Figyelem, nem felel meg: " + rejected.join(", ") + " · " : "") + rationaleFor(s, req);

  if (typeof target === "number") {
    // previous car in that slot moves to the runner pool (unless locked)
    const prev = all.find((c) => c.slot === target);
    if (prev?.locked) throw new Error(`Az ${target}. hely zárolva van`);
    if (prev) await env.DB.prepare("UPDATE candidates SET slot = NULL, pool = 'runner' WHERE id = ?").bind(prev.id).run();
  }
  const id = newId("cand");
  await env.DB.prepare(`INSERT INTO candidates (id, request_id, slot, pool, ad_id, source, listing_json, score, score_detail_json, rationale,
    positioning, locked, distance_km, distance_method, overrides_json, descriptions_json, added_by, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,NULL,0,?,?,NULL,NULL,?,?)`)
    .bind(id, requestId, typeof target === "number" ? target : null, typeof target === "number" ? "top" : "runner", l.ad_id, source,
      JSON.stringify(l), score, JSON.stringify({ ...detail, rejected }), rationale, dist.km, dist.method, actor, nowIso()).run();
  await refreshPositioning(env, requestId);
  await logEvent(env, requestId, actor, "listing_added", { ad_id: l.ad_id, source, target });
  if (["NO_MATCH", "SEARCHING", "NEW"].includes(row.status)) await transition(env, requestId, "NEEDS_REVIEW", actor);
  if (row.status === "READY") await transition(env, requestId, "NEEDS_REVIEW", actor, { reason: "slot_changed" });
  return { duplicate: false as const, candidateId: id, costs, distanceKm: dist.km, score, rejected };
}

export async function moveToSlot(env: Env, candidateId: string, slot: number, actor: string) {
  const c = await env.DB.prepare("SELECT * FROM candidates WHERE id = ?").bind(candidateId).first<CandidateRow>();
  if (!c) throw new Error("candidate not found");
  const prev = await env.DB.prepare("SELECT * FROM candidates WHERE request_id = ? AND slot = ?").bind(c.request_id, slot).first<CandidateRow>();
  if (prev?.locked) throw new Error(`Az ${slot}. hely zárolva van`);
  const stmts: D1PreparedStatement[] = [];
  if (prev) stmts.push(env.DB.prepare("UPDATE candidates SET slot = NULL, pool = 'runner' WHERE id = ?").bind(prev.id));
  stmts.push(env.DB.prepare("UPDATE candidates SET slot = ?, pool = 'top' WHERE id = ?").bind(slot, candidateId));
  await env.DB.batch(stmts);
  await refreshPositioning(env, c.request_id);
  await logEvent(env, c.request_id, actor, "slot_change", { candidateId, slot, replaced: prev?.id });
  const row = await getRequest(env, c.request_id);
  if (row?.status === "READY") await transition(env, c.request_id, "NEEDS_REVIEW", actor, { reason: "slot_changed" });
}

export async function refreshPositioning(env: Env, requestId: string) {
  const row = await getRequest(env, requestId);
  if (!row?.requirements_json) return;
  const req: Requirements = JSON.parse(row.requirements_json);
  const ctx = await loadCtx(env);
  const slotted = (await getCandidates(env, requestId)).filter((c) => c.slot);
  const scored: (Scored & { id: string })[] = [];
  for (const c of slotted) {
    const { costs, dist, listing } = await evaluate(env, ctx, req, JSON.parse(c.listing_json), c.overrides_json ? JSON.parse(c.overrides_json) : undefined);
    scored.push({ id: c.id, listing, costs, distanceKm: dist.km, distanceMethod: dist.method, score: c.score || 0, detail: {}, rejected: [], rationale: "" });
  }
  assignPositioning(scored);
  await env.DB.batch(scored.map((s) => env.DB.prepare("UPDATE candidates SET positioning = ? WHERE id = ?").bind(s.positioning ?? null, s.id)));
}

export interface CarView {
  candidate: CandidateRow;
  listing: Listing;
  costs: CostResult;
  distanceKm: number;
  distanceMethod: string;
  sections: Section[] | null;
  overrides: Overrides;
}

export async function slotViews(env: Env, requestId: string): Promise<{ req: Requirements; ctx: Ctx; cars: CarView[] }> {
  const row = await getRequest(env, requestId);
  const req: Requirements = JSON.parse(row!.requirements_json!);
  const ctx = await loadCtx(env);
  const cars: CarView[] = [];
  for (const c of (await getCandidates(env, requestId)).filter((x) => x.slot)) {
    const overrides = c.overrides_json ? JSON.parse(c.overrides_json) : {};
    const { listing, costs, dist } = await evaluate(env, ctx, req, JSON.parse(c.listing_json), overrides);
    cars.push({ candidate: c, listing, costs, distanceKm: dist.km, distanceMethod: dist.method, overrides,
      sections: c.descriptions_json ? JSON.parse(c.descriptions_json) : null });
  }
  return { req, ctx, cars };
}

/** Why an offer cannot be approved yet (empty = ready). */
export function publishBlockers(cars: CarView[]): string[] {
  const out: string[] = [];
  if (cars.length < 3) out.push(`${3 - cars.length} hely még üres`);
  for (const c of cars) {
    const n = `${c.candidate.slot}. autó`;
    if (!c.candidate.locked) out.push(`${n}: nincs zárolva`);
    if (!c.sections) out.push(`${n}: nincs leírás`);
    if (c.costs.unverified.length) out.push(`${n}: megerősítetlen díjak (${c.costs.unverified.join(", ")})`);
  }
  return out;
}
