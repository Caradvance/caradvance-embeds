import { Hono } from "hono";
import type { Env } from "./types";
import { admin } from "./routes/admin";
import { pub } from "./routes/public";
import { ext } from "./routes/ext";
import { handleEmail } from "./lib/intake";
import { refreshFx } from "./lib/geo";
import { budapestHour, logEvent, nowIso } from "./lib/util";
import { notifyAdmin } from "./lib/notify";

const app = new Hono<{ Bindings: Env; Variables: { user: string } }>();

app.onError((err, c) => {
  console.error(err);
  return c.text(`Hiba: ${err.message}`, 500);
});

app.route("/admin", admin);
app.route("/api/ext", ext);
app.route("/", pub);

export default {
  fetch: app.fetch,

  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    try {
      await handleEmail(message, env);
    } catch (e: any) {
      console.error("email intake failed", e);
      await logEvent(env, null, "intake", "email_error", { message: String(e?.message || e), to: message.to });
    }
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Two UTC crons; act only at 08:00 Budapest (DST-safe)
    if (budapestHour(new Date(event.scheduledTime)) !== 8) return;
    await refreshFx(env);
    // Expire published offers past their date
    const expired = await env.DB.prepare("UPDATE offers SET status = 'EXPIRED' WHERE status IN ('PUBLISHED','VIEWED') AND expires_at < ? RETURNING request_id").bind(nowIso()).all<{ request_id: string }>();
    for (const r of expired.results) {
      await env.DB.prepare("UPDATE requests SET status = 'EXPIRED', updated_at = ? WHERE id = ? AND status IN ('PUBLISHED','VIEWED')").bind(nowIso(), r.request_id).run();
      await logEvent(env, r.request_id, "cron", "status", null, "PUBLISHED", "EXPIRED");
    }
    // Listing re-check for open offers: needs a live source; in test (mock) this only reports.
    const open = await env.DB.prepare("SELECT COUNT(*) AS n FROM offers WHERE status IN ('PUBLISHED','VIEWED')").first<{ n: number }>();
    if (expired.results.length) await notifyAdmin(env, `${expired.results.length} ajánlat lejárt`, `${env.PUBLIC_BASE_URL}/admin`);
    await logEvent(env, null, "cron", "daily", { expired: expired.results.length, open: open?.n ?? 0 });
  },
};
