import type { Context, Next } from "hono";
import type { Env } from "../types";
import { sha256Hex } from "./util";

type C = Context<{ Bindings: Env; Variables: { user: string } }>;

let jwksCache: { at: number; keys: any[] } | null = null;

function b64urlToBytes(s: string) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** Verify a Cloudflare Access JWT (RS256) against the team's JWKS. */
export async function verifyAccessJwt(token: string, teamDomain: string, aud: string): Promise<string | null> {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  if (!jwksCache || Date.now() - jwksCache.at > 3600_000) {
    const r = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
    jwksCache = { at: Date.now(), keys: ((await r.json()) as any).keys };
  }
  const jwk = jwksCache.keys.find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud) || payload.exp * 1000 < Date.now()) return null;
  const email = String(payload.email || "");
  return email.endsWith("@caradvance.hu") ? email : null;
}

/**
 * Admin guard. Production: Cloudflare Access JWT verified server-side.
 * Test: HTTP Basic with ADMIN_PASSWORD, or open on localhost when no password is set.
 */
export async function adminAuth(c: C, next: Next) {
  const env = c.env;
  if (env.ACCESS_AUD && env.ACCESS_TEAM_DOMAIN) {
    const jwt = c.req.header("Cf-Access-Jwt-Assertion") || "";
    const user = jwt ? await verifyAccessJwt(jwt, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD) : null;
    if (!user) return c.text("Unauthorized (Cloudflare Access)", 401);
    c.set("user", user);
  } else if (env.ADMIN_PASSWORD || env.ADMIN_PASSWORD_SHA256) {
    const h = c.req.header("Authorization") || "";
    let u = "", p = "";
    try { [u, p] = h.startsWith("Basic ") ? new TextDecoder().decode(Uint8Array.from(atob(h.slice(6)), (x) => x.charCodeAt(0))).split(":") : ["", ""]; } catch { /* bad header */ }
    const ok = env.ADMIN_PASSWORD ? p === env.ADMIN_PASSWORD : (await sha256Hex(p)) === env.ADMIN_PASSWORD_SHA256;
    if (!ok) return c.text("Unauthorized", 401, { "WWW-Authenticate": 'Basic realm="Caradvance admin (teszt)", charset="UTF-8"' });
    c.set("user", u || "admin");
  } else {
    const host = new URL(c.req.url).hostname;
    if (env.ENVIRONMENT === "production" || !["localhost", "127.0.0.1"].includes(host))
      return c.text("Admin disabled: set ADMIN_PASSWORD or Cloudflare Access", 403);
    c.set("user", "local-admin");
  }
  // CSRF: state-changing admin requests must come from our own origin
  if (c.req.method === "POST") {
    const origin = c.req.header("Origin") || c.req.header("Referer") || "";
    try {
      if (origin && new URL(origin).host !== new URL(c.req.url).host) return c.text("Bad origin", 403);
    } catch { return c.text("Bad origin", 403); }
  }
  await next();
}

/** Extension API guard: per-user bearer token, stored hashed. */
export async function extAuth(c: C, next: Next) {
  const h = c.req.header("Authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (token.length < 20) return c.json({ error: "missing token" }, 401);
  const hash = await sha256Hex(token + (c.env.TOKEN_PEPPER || "test-pepper"));
  const row = await c.env.DB.prepare("SELECT id, user FROM ext_tokens WHERE token_hash = ? AND revoked_at IS NULL").bind(hash).first<{ id: string; user: string }>();
  if (!row) return c.json({ error: "invalid token" }, 401);
  await c.env.DB.prepare("UPDATE ext_tokens SET last_used_at = ? WHERE id = ?").bind(new Date().toISOString(), row.id).run();
  c.set("user", "ext:" + row.user);
  await next();
}

export const hashExtToken = (env: Env, token: string) => sha256Hex(token + (env.TOKEN_PEPPER || "test-pepper"));
