/**
 * Customer page: www.caradvance.hu/ajanlat/auto/<token>/   (no login; the 40-hex crm_offers token is the key)
 */
import { Hono } from "hono";
import type { Env } from "./types";
import { baseUrl, getImage, isTest, logEvent, randomHex, rateLimit } from "./am";
import { chooseCar, loadOffer, markViewed, noneFits, TOKEN_RE } from "./offers";
import { renderExpiredShell, renderOffer, type PublicOffer } from "./offer-view";
import { cspHeaders } from "./routes-staff";

type H = { Bindings: Env };
export const pub = new Hono<H>().basePath("/ajanlat/auto");

const ip = (c: any) => c.req.header("CF-Connecting-IP") || "local";
const sameOrigin = (c: any) => {
  const origin = c.req.header("Origin") || c.req.header("Referer") || "";
  try { return !origin || new URL(origin).host === new URL(c.req.url).host; } catch { return false; }
};

pub.get("/:token/", async (c) => {
  const token = c.req.param("token");
  if (!TOKEN_RE.test(token)) return c.text("Nem található", 404, { "X-Robots-Tag": "noindex" });
  if (!(await rateLimit(c.env, `o:${ip(c)}`, 120, 60))) return c.text("Túl sok kérés", 429);
  const o = await loadOffer(c.env, token);
  if (!o) return c.text("Ez az ajánlat nem található.", 404, { "X-Robots-Tag": "noindex" });
  const snap = JSON.parse(o.snapshot_json) as { public: PublicOffer };
  const chosen = o.action === "elfogad" && o.choice != null ? snap.public.cars[o.choice]?.cid : null;
  const expired = Date.parse(o.expires_at) < Date.now() && !o.responded_at;
  if (!expired) await markViewed(c.env, o, baseUrl(c.env, c.req.raw));
  await logEvent(c.env, o.deal_id, "customer", "offer_view", { expired });
  const nonce = randomHex(12);
  const done = c.req.query("done");
  return c.html(renderOffer(snap.public, {
    token, test: isTest(c.env), preview: false, nonce, chosenCid: chosen,
    done: done === "chosen" || done === "none" ? done : o.action === "elfogad" ? "chosen" : o.action === "modosit" ? "none" : null, expired,
  }), 200, cspHeaders(nonce));
});
pub.get("/:token", (c) => c.redirect(`/ajanlat/auto/${c.req.param("token")}/`, 301));

pub.post("/:token/choose", async (c) => {
  if (!sameOrigin(c)) return c.text("Bad origin", 403);
  if (!(await rateLimit(c.env, `choose:${ip(c)}`, 10, 600))) return c.text("Túl sok kérés", 429);
  const o = await loadOffer(c.env, c.req.param("token"));
  if (!o) return c.text("Nem található", 404);
  if (Date.parse(o.expires_at) < Date.now() && !o.responded_at) return c.html(renderExpiredShell(o.language as any, isTest(c.env)), 410);
  const f = await c.req.parseBody();
  const name = String(f.name || "").trim().slice(0, 120);
  const phone = String(f.phone || "").trim().slice(0, 40);
  if (f.consent !== "1" || !phone || !name) return c.text("Hiányzó adatok", 400);
  try {
    await chooseCar(c.env, o, { cid: String(f.cid), name, phone, callback: String(f.callback || "").slice(0, 40), message: String(f.message || "").slice(0, 2000), ip: ip(c) }, baseUrl(c.env, c.req.raw));
  } catch (e: any) {
    return c.text(e.message, 400);
  }
  return c.redirect(`/ajanlat/auto/${o.token}/?done=chosen#kesz`, 303);
});

pub.post("/:token/none", async (c) => {
  if (!sameOrigin(c)) return c.text("Bad origin", 403);
  if (!(await rateLimit(c.env, `none:${ip(c)}`, 10, 600))) return c.text("Túl sok kérés", 429);
  const o = await loadOffer(c.env, c.req.param("token"));
  if (!o) return c.text("Nem található", 404);
  const f = await c.req.parseBody();
  const message = String(f.message || "").trim();
  if (!message) return c.text("Kérjük, írja le röviden, mit keresünk inkább.", 400);
  await noneFits(c.env, o, message, ip(c), baseUrl(c.env, c.req.raw));
  return c.redirect(`/ajanlat/auto/${o.token}/?done=none`, 303);
});

pub.post("/:token/ev", async (c) => {
  if (!(await rateLimit(c.env, `ev:${ip(c)}`, 60, 60))) return c.body(null, 204);
  const o = await loadOffer(c.env, c.req.param("token"));
  if (!o) return c.body(null, 204);
  try {
    const b = await c.req.json<{ type: string; data?: unknown }>();
    if (["car_viewed", "scroll", "gallery_open", "choose_open"].includes(b.type)) await logEvent(c.env, o.deal_id, "customer", `offer_${b.type}`, b.data);
  } catch { /* ignore */ }
  return c.body(null, 204);
});

pub.get("/:token/kep/:slot/:i", async (c) => {
  const token = c.req.param("token");
  if (!TOKEN_RE.test(token)) return c.notFound();
  const img = await getImage(c.env, `${token}/${Number(c.req.param("slot"))}/${Number(c.req.param("i"))}`);
  if (!img) return c.notFound();
  return new Response(img.bytes, { headers: { "Content-Type": img.mime, "Cache-Control": "private, max-age=86400", "X-Robots-Tag": "noindex" } });
});
