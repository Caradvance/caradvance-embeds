import { Hono } from "hono";
import type { Env } from "../types";
import { renderExpiredShell, renderOffer, type PublicOffer } from "../views/offer";
import { cspHeaders } from "./admin";
import { getImage, recordOfferEvent } from "../lib/offers";
import { notifyAdmin, pushToNotion } from "../lib/notify";
import { transition } from "../lib/status";
import { isTest, logEvent, newToken, nowIso, rateLimit } from "../lib/util";
import { mockImageSvg } from "../lib/sources/mock";
import { getRequest } from "../lib/engine";

type H = { Bindings: Env };
export const pub = new Hono<H>();

interface OfferRow {
  id: string; request_id: string; token: string; language: string; status: string; published_at: string; expires_at: string;
  snapshot_json: string; first_viewed_at: string | null; chosen_candidate_id: string | null;
}

const ip = (c: any) => c.req.header("CF-Connecting-IP") || "local";

async function loadOffer(c: any): Promise<OfferRow | null> {
  const token = c.req.param("token");
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  return c.env.DB.prepare("SELECT * FROM offers WHERE token = ?").bind(token).first();
}

pub.get("/o/:token", async (c) => {
  if (!(await rateLimit(c.env, `o:${ip(c)}`, 120, 60))) return c.text("Túl sok kérés", 429);
  const o = await loadOffer(c);
  if (!o) return c.text("Nem található", 404, { "X-Robots-Tag": "noindex" });
  const snap = JSON.parse(o.snapshot_json) as { public: PublicOffer };
  const expired = Date.parse(o.expires_at) < Date.now() && !o.chosen_candidate_id;
  if (expired && o.status !== "EXPIRED") {
    await c.env.DB.prepare("UPDATE offers SET status = 'EXPIRED' WHERE id = ?").bind(o.id).run();
    try { await transition(c.env, o.request_id, "EXPIRED", "system"); } catch { /* already moved on */ }
  }
  if (!o.first_viewed_at && !expired) {
    await c.env.DB.prepare("UPDATE offers SET first_viewed_at = ?, status = CASE WHEN status = 'PUBLISHED' THEN 'VIEWED' ELSE status END WHERE id = ?").bind(nowIso(), o.id).run();
    try { await transition(c.env, o.request_id, "VIEWED", "customer"); } catch { /* ignore */ }
    const req = await getRequest(c.env, o.request_id);
    await notifyAdmin(c.env, `Megnyitotta az ajánlatot: ${snap.public.customer_name}`, `${snap.public.offer_no}\n${c.env.PUBLIC_BASE_URL}/admin/r/${req?.id}`);
  }
  await recordOfferEvent(c.env, o.id, "view", { expired });
  const nonce = newToken(12);
  const done = c.req.query("done");
  return c.html(renderOffer(snap.public, {
    token: o.token, test: isTest(c.env), preview: false, nonce, chosenCid: o.chosen_candidate_id,
    done: done === "chosen" || done === "none" ? done : null, expired,
  }), 200, cspHeaders(nonce));
});

const sameOrigin = (c: any) => {
  const origin = c.req.header("Origin") || c.req.header("Referer") || "";
  try { return !origin || new URL(origin).host === new URL(c.req.url).host; } catch { return false; }
};

pub.post("/o/:token/choose", async (c) => {
  if (!sameOrigin(c)) return c.text("Bad origin", 403);
  if (!(await rateLimit(c.env, `choose:${ip(c)}`, 10, 600))) return c.text("Túl sok kérés", 429);
  const o = await loadOffer(c);
  if (!o) return c.text("Nem található", 404);
  if (Date.parse(o.expires_at) < Date.now()) return c.html(renderExpiredShell(o.language as any, isTest(c.env)), 410);
  const f = await c.req.parseBody();
  const snap = JSON.parse(o.snapshot_json) as { public: PublicOffer };
  const car = snap.public.cars.find((x) => x.cid === String(f.cid));
  if (!car || f.consent !== "1" || !String(f.phone || "").trim() || !String(f.name || "").trim()) return c.text("Hiányzó adatok", 400);
  if (o.chosen_candidate_id) return c.redirect(`/o/${o.token}?done=chosen#kesz`, 303);

  const choice = { cid: car.cid, name: String(f.name).slice(0, 120), phone: String(f.phone).slice(0, 40), callback: String(f.callback || "").slice(0, 40), message: String(f.message || "").slice(0, 2000) };
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE offers SET chosen_candidate_id = ?, chosen_at = ?, choice_json = ?, status = 'CHOSEN' WHERE id = ? AND chosen_candidate_id IS NULL")
      .bind(car.cid, nowIso(), JSON.stringify(choice), o.id),
    c.env.DB.prepare("UPDATE candidates SET pool = 'declined' WHERE request_id = ? AND slot IS NOT NULL AND id != ?").bind(o.request_id, car.cid),
  ]);
  try { await transition(c.env, o.request_id, "CHOSEN", "customer", { cid: car.cid }); } catch { /* ignore */ }
  await recordOfferEvent(c.env, o.id, "chosen", { cid: car.cid });
  const url = `${c.env.PUBLIC_BASE_URL}/o/${o.token}`;
  const notion = await pushToNotion(c.env, { customer: choice.name, phone: choice.phone, car: car.title, priceHuf: car.total_huf, offerUrl: url });
  await logEvent(c.env, o.request_id, "customer", "notion_push", notion);
  await notifyAdmin(c.env, `VÁLASZTOTT: ${choice.name} – ${car.title}`,
    `Autó: ${car.title} (${car.slot}. hely)\nVégösszeg: ≈ ${car.total_huf.toLocaleString("hu-HU")} Ft\nTelefon: ${choice.phone}\nVisszahívás: ${choice.callback}\nÜzenet: ${choice.message || "-"}\n\nAdmin: ${c.env.PUBLIC_BASE_URL}/admin/r/${o.request_id}\nNotion: ${notion.ok ? "rögzítve" : notion.reason}`);
  return c.redirect(`/o/${o.token}?done=chosen#kesz`, 303);
});

pub.post("/o/:token/none", async (c) => {
  if (!sameOrigin(c)) return c.text("Bad origin", 403);
  if (!(await rateLimit(c.env, `none:${ip(c)}`, 10, 600))) return c.text("Túl sok kérés", 429);
  const o = await loadOffer(c);
  if (!o) return c.text("Nem található", 404);
  const f = await c.req.parseBody();
  const message = String(f.message || "").slice(0, 3000);
  await c.env.DB.prepare("UPDATE offers SET status = 'NONE_FIT', choice_json = ? WHERE id = ?").bind(JSON.stringify({ none: true, message }), o.id).run();
  try { await transition(c.env, o.request_id, "NEEDS_REVIEW", "customer", { none_fit: true }); } catch { /* ignore */ }
  await recordOfferEvent(c.env, o.id, "none_fit", { message });
  await logEvent(c.env, o.request_id, "customer", "none_fit", { message });
  await notifyAdmin(c.env, "Egyik autó sem tetszett", `${message}\n\n${c.env.PUBLIC_BASE_URL}/admin/r/${o.request_id}`);
  return c.redirect(`/o/${o.token}?done=none`, 303);
});

pub.post("/o/:token/ev", async (c) => {
  if (!(await rateLimit(c.env, `ev:${ip(c)}`, 60, 60))) return c.body(null, 204);
  const o = await loadOffer(c);
  if (!o) return c.body(null, 204);
  try {
    const b = await c.req.json<{ type: string; data?: unknown }>();
    if (["car_viewed", "scroll", "gallery_open", "choose_open"].includes(b.type)) await recordOfferEvent(c.env, o.id, b.type, b.data);
  } catch { /* ignore */ }
  return c.body(null, 204);
});

pub.get("/img/*", async (c) => {
  const key = c.req.path.slice("/img/".length);
  if (!key.startsWith("offers/")) return c.notFound();
  const obj = await getImage(c.env, key);
  if (!obj) return c.notFound();
  return new Response(obj.body, { headers: { "Content-Type": obj.contentType, "Cache-Control": "private, max-age=86400", "X-Robots-Tag": "noindex" } });
});

pub.get("/mock-img/:ad/:file", (c) => {
  if (!isTest(c.env)) return c.notFound();
  const svg = mockImageSvg(c.req.param("ad"), Number(c.req.param("file").split(".")[0]));
  return svg ? c.body(svg, 200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" }) : c.notFound();
});

pub.get("/", (c) => c.html(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Caradvance Ajánlatmotor</title>
<body style="font-family:system-ui;background:#0B0B0D;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center">
<p style="letter-spacing:.2em;font-size:12px;color:#E2001A;font-weight:800">CARADVANCE AJÁNLATMOTOR${isTest(c.env) ? " · TESZT" : ""}</p>
<p><a style="color:#fff" href="/admin">Admin →</a></p></div></body>`));
