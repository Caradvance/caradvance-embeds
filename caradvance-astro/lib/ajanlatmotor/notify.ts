import type { Env } from "./types";
import { notifyTo, sendCrmMail } from "../crm.js";
import { logEvent } from "./am";

/** Internal notification to the CRM inbox (Resend, same as the rest of belső). Never throws. */
export async function notifyStaff(env: Env, subject: string, html: string, dealId: number | null = null) {
  let status = "skipped (nincs RESEND_API_KEY)";
  if (env.RESEND_API_KEY) {
    try {
      const r = await sendCrmMail(env, notifyTo(env), `[Ajánlatmotor] ${subject}`, html);
      status = r.ok ? "sent" : `failed: ${r.error}`;
    } catch (e: any) {
      status = `failed: ${String(e?.message || e)}`;
    }
  }
  try { await logEvent(env, dealId, "system", "notify", { subject, status }); } catch { /* logging must not break the flow */ }
}
