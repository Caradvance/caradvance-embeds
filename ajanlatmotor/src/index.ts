/**
 * Ajánlatmotor — email intake Worker.
 *
 * Gmail (info@caradvance.hu) forwards car enquiries to intake@in.caradvance.hu (Cloudflare Email Routing).
 * This Worker parses the mail and creates a belső deal + adatlap card + Ajánlatmotor request in the
 * same D1 database the website's belső uses, then runs the mobile.de search (lib/ajanlatmotor).
 *
 * Daily at 08:00 Budapest it refreshes the EUR/HUF rate and expires old offers.
 */
import PostalMime from "postal-mime";
import type { Env } from "../../caradvance-astro/lib/ajanlatmotor/types";
import { createRequest } from "../../caradvance-astro/lib/ajanlatmotor/intake";
import { refreshFx } from "../../caradvance-astro/lib/ajanlatmotor/geo";
import { budapestHour, ensureAm, logEvent, nowIso } from "../../caradvance-astro/lib/ajanlatmotor/am";

export function stripHtml(html: string) {
  return html
    .replace(/<img[^>]*>/gi, "") // tracking pixels
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n").trim();
}

/** Gmail's forwarding confirmation mail must reach a human; it is logged with its full text. */
function isForwardingConfirmation(subject: string, from: string) {
  return /forwarding-noreply@google\.com/i.test(from) || /(továbbítás megerősítése|forwarding confirmation)/i.test(subject);
}

export default {
  async fetch() {
    return new Response("Ajánlatmotor e-mail intake Worker. Nincs nyilvános felülete.", { status: 404 });
  },

  async email(message: ForwardableEmailMessage, env: Env) {
    try {
      await ensureAm(env);
      const raw = await new Response(message.raw).arrayBuffer();
      const mail = await PostalMime.parse(raw);
      const text = mail.text || stripHtml(mail.html || "");
      const from = (mail.replyTo?.[0] || mail.from) as { address?: string; name?: string } | undefined;
      const subject = mail.subject || "";
      if (isForwardingConfirmation(subject, from?.address || "")) {
        await logEvent(env, null, "intake", "gmail_forwarding_confirmation", { subject, text: text.slice(0, 3000) });
        return;
      }
      const r = await createRequest(env, {
        source: "email",
        messageId: mail.messageId || message.headers.get("message-id") || undefined,
        fromEmail: from?.address,
        fromName: from?.name,
        subject,
        text,
        actor: "e-mail",
        origin: (env.AM_PUBLIC_BASE as string) || undefined,
      });
      await logEvent(env, r.dealId || null, "intake", "email_in", { to: message.to, subject, dealId: r.dealId, duplicate: r.duplicate, car: r.isCar, at: nowIso() });
    } catch (e: any) {
      console.error("email intake failed", e);
      try { await logEvent(env, null, "intake", "email_error", { message: String(e?.message || e), to: message.to }); } catch { /* nothing left to do */ }
    }
  },

  async scheduled(event: ScheduledController, env: Env) {
    if (budapestHour(new Date(event.scheduledTime)) !== 8) return; // two UTC crons, DST-safe 08:00
    await ensureAm(env);
    await refreshFx(env);
    const expired = await env.DB.prepare(`UPDATE am_requests SET status = 'EXPIRED', updated_at = ?
        WHERE status IN ('PUBLISHED','VIEWED') AND deal_id IN (
          SELECT a.deal_id FROM am_offers a JOIN crm_offers o ON o.token = a.token
          WHERE a.expires_at < ? AND o.responded_at IS NULL) RETURNING deal_id`).bind(nowIso(), nowIso()).all<{ deal_id: number }>();
    for (const r of expired.results) await logEvent(env, r.deal_id, "cron", "status", null, "PUBLISHED", "EXPIRED");
    await logEvent(env, null, "cron", "daily", { expired: expired.results.length });
  },
};
