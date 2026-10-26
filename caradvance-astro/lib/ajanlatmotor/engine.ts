/**
 * Ajánlatmotor pipeline on a belső deal: search → evaluate (distance + costs) → score → slots 1–3.
 * One am_requests row per deal; candidates in am_candidates.
 */
import type { CostResult, Env, Listing, Requirements, Section } from "./types";
import { computeCosts, type Overrides } from "./costs";
import { distanceToDepot, getFx } from "./geo";
import { loadRates, type RateConfig } from "./rates";
import { hardFilter, pickTop3, rationaleFor, scoreListing, assignPositioning, type Scored } from "./score";
import { getSource } from "./sources";
import { transition } from "./status";
import { clarifyDraft } from "./extract";
import { cacheGet, cachePut, ensureAm, logEvent, newId, nowIso } from "./am";
import { notifyStaff } from "./notify";

export interface RequestRow {
  deal_id: number; status: string; source: string; message_id: string | null; from_email: string | null; subject: string | null;
  body_text: string | null; requirements_json: string | null; meta_json: string | null; clarify_draft: string | null;
  search_note: string | null; created_at: string; updated_at: string;
}
export interface CandidateRow {
  id: string; deal_id: number; slot: number | null; pool: string; ad_id: string; source: string; listing_json: string;
  score: number | null; score_detail_json: string | null; rationale: string | null; positioning: string | null; locked: number;
  distance_km: number | null; distance_method: string | null; overrides_json: string | null; descriptions_json: string | null;
  added_by: string | null; created_at: string;
}
export interface DealRow {
  id: number; line: string; stage: string; ch: string | null; name: string | null; phone: string | null; email: string | null;
  car: string | null; price: number | null; note: string | null; when_text: string | null; assigned_to: number | null; created_at: string;
}

export const getRequest = (env: Env, dealId: number) =>
  env.DB.prepare("SELECT * FROM am_requests WHERE deal_id = ?").bind(dealId).first<RequestRow>();
export const getDeal = (env: Env, dealId: number) =>
  env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(dealId).first<DealRow>();
export const getCandidates = async (env: Env, dealId: number) =>
  (await env.DB.prepare("SELECT * FROM am_candidates WHERE deal_id = ? ORDER BY slot IS NULL, slot, score DESC").bind(dealId).all<CandidateRow>()).results;

/** Geocode by zip/city when the source gave no coordinates (Nominatim, cached). */
async function ensureCoords(env: Env, l: Listing): Promise<Listing> {
  if (l.seller.lat != null && l.seller.lon != null) return l;
  const q = [l.seller.zip, l.seller.city, l.seller.country || "DE"].filter(Boolean).join(" ");
  if (!q.trim()) return l;
  const key = `geo:${q.toLowerCase()}`;
  let c = await cacheGet<{ lat: number; lon: number }>(env, key);
  if (!c) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
        headers: { "User-Agent": "Caradvance Ajanlatmotor (info@caradvance.hu)" },
      });
      const j: any[] = r.ok ? await r.json() : [];
      if (j[0]) {
        c = { lat: Number(j[0].lat), lon: Number(j[0].lon) };
        await cachePut(env, key, c);
      }
    } catch { /* leave unknown */ }
  }
  return c ? { ...l, seller: { ...l.seller, lat: c.lat, lon: c.lon } } : l;
}

export interface Ctx { rates: RateConfig; rateVersion: number; fx: { rate: number; date: string; fallback: boolean } }

export async function loadCtx(env: Env): Promise<Ctx> {
  await ensureAm(env);
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

const insertSql = `INSERT INTO am_candidates (id, deal_id, slot, pool, ad_id, source, listing_json, score, score_detail_json, rationale,
  positioning, locked, distance_km, distance_method, overrides_json, descriptions_json, added_by, created_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?,NULL,NULL,?,?)`;

/** Full pipeline for one deal: search → evaluate → score → top 3 + runner-ups. */
export async function processRequest(env: Env, dealId: number, actor = "system", origin?: string) {
  const row = await getRequest(env, dealId);
  if (!row?.requirements_json) return;
  const req: Requirements = JSON.parse(row.requirements_json);
  const deal = await getDeal(env, dealId);
  const who = req.customer.name || deal?.name || row.from_email || `#${dealId}`;
  const link = `${origin || "https://www.caradvance.hu"}/belso/ajanlatmotor/igeny/${dealId}`;

  if (req.missing_critical_fields.length) {
    await env.DB.prepare("UPDATE am_requests SET clarify_draft = ?, search_note = ?, updated_at = ? WHERE deal_id = ?")
      .bind(clarifyDraft(req), "Hiányzó adatok miatt nem kerestünk: " + req.missing_critical_fields.join(", "), nowIso(), dealId).run();
    await transition(env, dealId, "NEEDS_REVIEW", actor, { reason: "missing_fields" });
    await notifyStaff(env, `Pontosítás kell: ${who}`, `<p>Hiányzó adatok: ${req.missing_critical_fields.join(", ")}</p><p><a href="${link}">Megnyitás az Ajánlatmotorban</a></p>`);
    return;
  }

  await transition(env, dealId, "SEARCHING", actor);
  const ctx = await loadCtx(env);
  const source = getSource(env);
  let found: Listing[] = [];
  try {
    found = await source.search(req);
  } catch (e: any) {
    await logEvent(env, dealId, actor, "search_error", { message: String(e?.message || e), source: source.name });
  }

  // drop previous auto-found, unlocked candidates; manual / extension ones stay
  await env.DB.prepare("DELETE FROM am_candidates WHERE deal_id = ? AND locked = 0 AND source NOT IN ('manual','extension')").bind(dealId).run();
  const keep = await getCandidates(env, dealId);
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

  const taken = new Set(keep.filter((c) => c.slot).map((c) => c.slot));
  const { top, runners } = pickTop3(eligible);
  const freeSlots = [1, 2, 3].filter((n) => !taken.has(n));
  const ins = env.DB.prepare(insertSql);
  const stmts: D1PreparedStatement[] = [];
  const put = (s: Scored, slot: number | null, poolName: string) =>
    stmts.push(ins.bind(newId("cand"), dealId, slot, poolName, s.listing.ad_id, source.name, JSON.stringify(s.listing), s.score,
      JSON.stringify({ ...s.detail, rejected: s.rejected }), s.rejected.length ? "Kiesett: " + s.rejected.join(", ") : s.rationale,
      s.positioning ?? null, s.distanceKm, s.distanceMethod, actor, nowIso()));
  top.slice(0, freeSlots.length).forEach((s, i) => put(s, freeSlots[i], "top"));
  top.slice(freeSlots.length).forEach((s) => put(s, null, "runner"));
  runners.slice(0, 8).forEach((s) => put(s, null, "runner"));
  evaluated.filter((s) => s.rejected.length).slice(0, 12).forEach((s) => put(s, null, "rejected"));
  if (stmts.length) await env.DB.batch(stmts);

  const filled = (await getCandidates(env, dealId)).filter((c) => c.slot).length;
  const note = filled >= 3
    ? `${found.length} hirdetésből ${eligible.length} felelt meg, a legjobb 3 kiválasztva (forrás: ${source.name}).`
    : suggestRelax(evaluated, filled, source.name);
  await env.DB.prepare("UPDATE am_requests SET search_note = ?, updated_at = ? WHERE deal_id = ?").bind(note, nowIso(), dealId).run();
  await transition(env, dealId, filled ? "NEEDS_REVIEW" : "NO_MATCH", actor, { found: found.length, eligible: eligible.length, source: source.name });
  await notifyStaff(env, `${filled ? "Ajánlat átnézésre vár" : "Nincs találat"}: ${who}`, `<p>${note}</p><p><a href="${link}">Megnyitás az Ajánlatmotorban</a></p>`);
}

function suggestRelax(evaluated: Scored[], filled: number, source: string) {
  const counts: Record<string, number> = {};
  for (const s of evaluated) for (const r of s.rejected) counts[r.split(":")[0]] = (counts[r.split(":")[0]] || 0) + 1;
  const worst = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => `${k} (${n} autó esett ki emiatt)`);
  return `Csak ${filled} autó felelt meg (forrás: ${source}). Lazítási javaslat: ${worst.join(", ") || "bővebb keresés"}.`;
}

/** Add a listing (manual link or Chrome extension) to a deal: into a slot or the runner pool. */
export async function addListing(env: Env, dealId: number, listing: Listing, target: number | "runner", source: string, actor: string) {
  const row = await getRequest(env, dealId);
  if (!row?.requirements_json) throw new Error("Ehhez az ügyfélhez még nincs Ajánlatmotor-igény.");
  const req: Requirements = JSON.parse(row.requirements_json);
  const existing = await env.DB.prepare("SELECT id FROM am_candidates WHERE deal_id = ? AND ad_id = ?").bind(dealId, listing.ad_id).first<{ id: string }>();
  if (existing) return { duplicate: true as const, candidateId: existing.id };

  const ctx = await loadCtx(env);
  const { listing: l, dist, costs } = await evaluate(env, ctx, req, listing);
  const rejected = hardFilter(l, req, costs);
  // a single added car has no pool to compare against: neutral price position
  const { score, detail } = scoreListing(l, req, costs, dist.km, ctx.rates.scoring,
    { minTotal: costs.customer_total_huf * 0.5, maxTotal: costs.customer_total_huf * 1.5 });
  const s: Scored = { listing: l, costs, distanceKm: dist.km, distanceMethod: dist.method, score, detail, rejected, rationale: "" };
  const rationale = (rejected.length ? "Figyelem, nem felel meg: " + rejected.join(", ") + " · " : "") + rationaleFor(s, req);

  if (typeof target === "number") {
    const prev = await env.DB.prepare("SELECT id, locked FROM am_candidates WHERE deal_id = ? AND slot = ?").bind(dealId, target).first<{ id: string; locked: number }>();
    if (prev?.locked) throw new Error(`A ${target}. hely zárolva van`);
    if (prev) await env.DB.prepare("UPDATE am_candidates SET slot = NULL, pool = 'runner' WHERE id = ?").bind(prev.id).run();
  }
  const id = newId("cand");
  await env.DB.prepare(insertSql)
    .bind(id, dealId, typeof target === "number" ? target : null, typeof target === "number" ? "top" : "runner", l.ad_id, source,
      JSON.stringify(l), score, JSON.stringify({ ...detail, rejected }), rationale, null, dist.km, dist.method, actor, nowIso()).run();
  await refreshPositioning(env, dealId);
  await logEvent(env, dealId, actor, "listing_added", { ad_id: l.ad_id, source, target });
  if (["NO_MATCH", "SEARCHING", "NEW"].includes(row.status)) await transition(env, dealId, "NEEDS_REVIEW", actor);
  if (row.status === "READY") await transition(env, dealId, "NEEDS_REVIEW", actor, { reason: "slot_changed" });
  return { duplicate: false as const, candidateId: id, costs, distanceKm: dist.km, score, rejected };
}

export async function moveToSlot(env: Env, candidateId: string, slot: number, actor: string) {
  const c = await env.DB.prepare("SELECT * FROM am_candidates WHERE id = ?").bind(candidateId).first<CandidateRow>();
  if (!c) throw new Error("candidate not found");
  const prev = await env.DB.prepare("SELECT * FROM am_candidates WHERE deal_id = ? AND slot = ?").bind(c.deal_id, slot).first<CandidateRow>();
  if (prev?.locked) throw new Error(`A ${slot}. hely zárolva van`);
  const stmts: D1PreparedStatement[] = [];
  if (prev) stmts.push(env.DB.prepare("UPDATE am_candidates SET slot = NULL, pool = 'runner' WHERE id = ?").bind(prev.id));
  stmts.push(env.DB.prepare("UPDATE am_candidates SET slot = ?, pool = 'top' WHERE id = ?").bind(slot, candidateId));
  await env.DB.batch(stmts);
  await refreshPositioning(env, c.deal_id);
  await logEvent(env, c.deal_id, actor, "slot_change", { candidateId, slot, replaced: prev?.id });
  const row = await getRequest(env, c.deal_id);
  if (row?.status === "READY") await transition(env, c.deal_id, "NEEDS_REVIEW", actor, { reason: "slot_changed" });
}

export async function refreshPositioning(env: Env, dealId: number) {
  const row = await getRequest(env, dealId);
  if (!row?.requirements_json) return;
  const req: Requirements = JSON.parse(row.requirements_json);
  const ctx = await loadCtx(env);
  const slotted = (await getCandidates(env, dealId)).filter((c) => c.slot);
  const scored: (Scored & { id: string })[] = [];
  for (const c of slotted) {
    const { costs, dist, listing } = await evaluate(env, ctx, req, JSON.parse(c.listing_json), c.overrides_json ? JSON.parse(c.overrides_json) : undefined);
    scored.push({ id: c.id, listing, costs, distanceKm: dist.km, distanceMethod: dist.method, score: c.score || 0, detail: {}, rejected: [], rationale: "" });
  }
  assignPositioning(scored);
  if (scored.length) await env.DB.batch(scored.map((s) => env.DB.prepare("UPDATE am_candidates SET positioning = ? WHERE id = ?").bind(s.positioning ?? null, s.id)));
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

export async function slotViews(env: Env, dealId: number): Promise<{ req: Requirements; ctx: Ctx; cars: CarView[] }> {
  const row = await getRequest(env, dealId);
  const req: Requirements = JSON.parse(row!.requirements_json!);
  const ctx = await loadCtx(env);
  const cars: CarView[] = [];
  for (const c of (await getCandidates(env, dealId)).filter((x) => x.slot)) {
    const overrides = c.overrides_json ? JSON.parse(c.overrides_json) : {};
    const { listing, costs, dist } = await evaluate(env, ctx, req, JSON.parse(c.listing_json), overrides);
    cars.push({ candidate: c, listing, costs, distanceKm: dist.km, distanceMethod: dist.method, overrides,
      sections: c.descriptions_json ? JSON.parse(c.descriptions_json) : null });
  }
  return { req, ctx, cars };
}

/** Why an offer cannot be published yet (empty = ready). */
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
