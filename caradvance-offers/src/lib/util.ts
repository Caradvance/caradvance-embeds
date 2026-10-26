import type { Env } from "../types";

export const nowIso = () => new Date().toISOString();

export function newId(prefix: string) {
  const b = crypto.getRandomValues(new Uint8Array(9));
  return prefix + "_" + [...b].map((x) => x.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

/** 32 random bytes, base64url: the offer link secret. */
export function newToken(bytes = 32) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function logEvent(env: Env, requestId: string | null, actor: string, type: string, data?: unknown, from?: string, to?: string) {
  await env.DB.prepare("INSERT INTO events (request_id, actor, type, from_status, to_status, data_json, at) VALUES (?,?,?,?,?,?,?)")
    .bind(requestId, actor, type, from ?? null, to ?? null, data ? JSON.stringify(data) : null, nowIso())
    .run();
}

export async function getSetting<T>(env: Env, key: string, fallback: T): Promise<T> {
  const r = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first<{ value: string }>();
  return r ? (JSON.parse(r.value) as T) : fallback;
}

export async function setSetting(env: Env, key: string, value: unknown) {
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, JSON.stringify(value)).run();
}

/** Simple fixed-window rate limit in KV. Returns true when the call is allowed. */
export async function rateLimit(env: Env, key: string, limit: number, windowSec: number) {
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const k = `rl:${key}:${bucket}`;
  const n = Number((await env.KV.get(k)) || 0);
  if (n >= limit) return false;
  await env.KV.put(k, String(n + 1), { expirationTtl: Math.max(60, windowSec * 2) });
  return true;
}

export const isTest = (env: Env) => env.ENVIRONMENT !== "production";

/** Budapest local hour, DST-correct. */
export function budapestHour(d = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Budapest", hour: "2-digit", hour12: false }).format(d));
}
