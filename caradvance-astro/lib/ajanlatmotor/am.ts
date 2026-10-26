/**
 * Ajánlatmotor — shared runtime helpers on the belső D1 database (binding DB).
 *
 * Own tables (created on first use, like lib/crm.js does it):
 *   am_requests    one per deal: extracted requirements, engine status, search note
 *   am_candidates  mobile.de listings attached to a deal (slot 1–3 or runner-up / rejected)
 *   am_offers      premium offer snapshot, keyed by the crm_offers token it belongs to
 *   am_rates       versioned rate configuration (fees, logistics, margin)
 *   am_settings    small key/value settings (contact person on offers)
 *   am_ext_tokens  Chrome extension tokens, one or more per belső user (hashed)
 *   am_events      audit log
 *   am_cache       key/value cache with TTL (FX rate, distances, geocoding, rate limits)
 *   am_images      offer images copied at publish time (base64)
 *
 * It reuses the belső tables as they are: users / sessions (login), deals (one per customer
 * enquiry), crm_cards (adatlap status), crm_offers (the offer the customer answers).
 */
import type { Env } from "./types";

export const isTest = (env: Env) => env.AM_TEST_MODE === "1";
export const sourceName = (env: Env) => env.AM_SOURCE || (isTest(env) ? "mock" : "searchapi");
export const aiModel = (env: Env) => env.AM_AI_MODEL || "claude-sonnet-5-5";
export const validDays = (env: Env) => Number(env.AM_OFFER_VALID_DAYS || 7);
export const DEPOT = { lat: 47.4979, lon: 19.0402, label: "Budapest" };

/** Origin for absolute links (emails, extension). Request origin wins so previews link to themselves. */
export function baseUrl(env: Env, req?: Request) {
  if (req) return new URL(req.url).origin;
  return env.AM_PUBLIC_BASE || "https://www.caradvance.hu";
}

export const nowIso = () => new Date().toISOString();

let READY = false;
export async function ensureAm(env: Env) {
  if (READY) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_requests (
      deal_id INTEGER PRIMARY KEY, status TEXT NOT NULL, source TEXT NOT NULL, message_id TEXT UNIQUE,
      from_email TEXT, subject TEXT, body_text TEXT, requirements_json TEXT, meta_json TEXT, clarify_draft TEXT,
      search_note TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_candidates (
      id TEXT PRIMARY KEY, deal_id INTEGER NOT NULL, slot INTEGER, pool TEXT NOT NULL, ad_id TEXT NOT NULL, source TEXT NOT NULL,
      listing_json TEXT NOT NULL, score REAL, score_detail_json TEXT, rationale TEXT, positioning TEXT, locked INTEGER NOT NULL DEFAULT 0,
      distance_km REAL, distance_method TEXT, overrides_json TEXT, descriptions_json TEXT, added_by TEXT, created_at TEXT NOT NULL,
      UNIQUE(deal_id, ad_id))`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_am_candidates_deal ON am_candidates (deal_id)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_offers (
      token TEXT PRIMARY KEY, deal_id INTEGER NOT NULL, language TEXT NOT NULL, offer_no TEXT, published_at TEXT NOT NULL,
      expires_at TEXT NOT NULL, snapshot_json TEXT NOT NULL, rate_version INTEGER, first_viewed_at TEXT, created_by INTEGER)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_am_offers_deal ON am_offers (deal_id)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_rates (
      version INTEGER PRIMARY KEY AUTOINCREMENT, config_json TEXT NOT NULL, author TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_ext_tokens (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, label TEXT, token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL,
      last_used_at TEXT, revoked_at TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, deal_id INTEGER, actor TEXT NOT NULL, type TEXT NOT NULL, from_status TEXT,
      to_status TEXT, data_json TEXT, at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS ix_am_events_deal ON am_events (deal_id)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_cache (k TEXT PRIMARY KEY, v TEXT NOT NULL, exp INTEGER)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS am_images (
      key TEXT PRIMARY KEY, mime TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)`),
  ]);
  READY = true;
}

/* ---------------- cache (D1, replaces KV) ---------------- */
export async function cacheGet<T>(env: Env, k: string): Promise<T | null> {
  const r = await env.DB.prepare("SELECT v, exp FROM am_cache WHERE k = ?").bind(k).first<{ v: string; exp: number | null }>();
  if (!r) return null;
  if (r.exp && r.exp < Date.now()) return null;
  try { return JSON.parse(r.v) as T; } catch { return null; }
}
export async function cachePut(env: Env, k: string, v: unknown, ttlSec?: number) {
  await env.DB.prepare("INSERT INTO am_cache (k, v, exp) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, exp = excluded.exp")
    .bind(k, JSON.stringify(v), ttlSec ? Date.now() + ttlSec * 1000 : null).run();
}
export async function cacheDel(env: Env, k: string) {
  await env.DB.prepare("DELETE FROM am_cache WHERE k = ?").bind(k).run();
}

/** Fixed-window rate limit. Returns true when allowed. */
export async function rateLimit(env: Env, key: string, limit: number, windowSec: number) {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const r = await env.DB.prepare(
    "INSERT INTO am_cache (k, v, exp) VALUES (?, '1', ?) ON CONFLICT(k) DO UPDATE SET v = CAST(CAST(am_cache.v AS INTEGER) + 1 AS TEXT) RETURNING v")
    .bind(k, Date.now() + windowSec * 2000).first<{ v: string }>();
  return Number(r?.v || 1) <= limit;
}

/* ---------------- events, settings ---------------- */
export async function logEvent(env: Env, dealId: number | null, actor: string, type: string, data?: unknown, from?: string, to?: string) {
  await env.DB.prepare("INSERT INTO am_events (deal_id, actor, type, from_status, to_status, data_json, at) VALUES (?,?,?,?,?,?,?)")
    .bind(dealId, actor, type, from ?? null, to ?? null, data !== undefined ? JSON.stringify(data).slice(0, 4000) : null, nowIso()).run();
}
export async function getSetting<T>(env: Env, key: string, fallback: T): Promise<T> {
  const r = await env.DB.prepare("SELECT value FROM am_settings WHERE key = ?").bind(key).first<{ value: string }>();
  return r ? (JSON.parse(r.value) as T) : fallback;
}
export async function setSetting(env: Env, key: string, value: unknown) {
  await env.DB.prepare("INSERT INTO am_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, JSON.stringify(value)).run();
}

/* ---------------- images (D1 base64, replaces R2 in test) ---------------- */
export async function putImage(env: Env, key: string, bytes: ArrayBuffer, mime: string) {
  const u = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u.subarray(i, i + 0x8000)));
  await env.DB.prepare("INSERT INTO am_images (key, mime, data, created_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET mime = excluded.mime, data = excluded.data")
    .bind(key, mime, btoa(s), nowIso()).run();
}
export async function getImage(env: Env, key: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const r = await env.DB.prepare("SELECT mime, data FROM am_images WHERE key = ?").bind(key).first<{ mime: string; data: string }>();
  if (!r) return null;
  const bin = atob(r.data);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return { bytes: u, mime: r.mime };
}

/* ---------------- belső session + roles ---------------- */
export interface Staff { id: number; email: string; name: string; role: string }

function cookie(req: Request, name: string) {
  for (const p of (req.headers.get("Cookie") || "").split(";")) {
    const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i).trim() === name) return p.slice(i + 1).trim();
  }
  return "";
}

/** Same session as /api/belso (ca_session cookie, sessions + users tables). */
export async function sessionUser(env: Env, req: Request): Promise<Staff | null> {
  const token = cookie(req, "ca_session");
  if (!token) return null;
  const row = await env.DB.prepare("SELECT u.id, u.email, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?")
    .bind(token).first<{ id: number; email: string; name: string; role: string; expires_at: string }>();
  if (!row) return null;
  if (new Date(row.expires_at + "Z").getTime() < Date.now()) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export const isAdmin = (u: Staff) => u.role === "admin";

/** Admin sees every deal; others only the deals assigned to them (same rule as belső). */
export async function canSeeDeal(env: Env, u: Staff, dealId: number) {
  if (isAdmin(u)) return true;
  const d = await env.DB.prepare("SELECT assigned_to FROM deals WHERE id = ?").bind(dealId).first<{ assigned_to: number | null }>();
  return !!d && d.assigned_to === u.id;
}

export async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
export function randomHex(n: number) {
  const a = crypto.getRandomValues(new Uint8Array(n));
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function newId(prefix: string) {
  return `${prefix}_${randomHex(7)}`;
}
export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Budapest local hour, DST-correct. */
export function budapestHour(d = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Budapest", hour: "2-digit", hour12: false }).format(d));
}
