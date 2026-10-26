import type { Env } from "../types";
import { nowIso } from "./util";

/** Internal notification. Sends via the send_email binding when configured, always logs. */
export async function notifyAdmin(env: Env, subject: string, body: string) {
  let status = "logged";
  if (env.NOTIFY) {
    try {
      const { EmailMessage } = await import("cloudflare:email");
      const raw = [
        `From: Caradvance Ajánlatmotor <${env.NOTIFY_FROM}>`,
        `To: ${env.ADMIN_NOTIFY_TO}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        `Message-ID: <${crypto.randomUUID()}@in.caradvance.hu>`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        body,
      ].join("\r\n");
      await env.NOTIFY.send(new EmailMessage(env.NOTIFY_FROM, env.ADMIN_NOTIFY_TO, raw));
      status = "sent";
    } catch (e) {
      console.error("notify failed", e);
      status = "failed";
    }
  }
  await env.DB.prepare("INSERT INTO email_log (direction, to_addr, subject, body, status, at) VALUES ('out', ?, ?, ?, ?, ?)")
    .bind(env.ADMIN_NOTIFY_TO, subject, body, status, nowIso()).run();
}

/**
 * Notion CRM push (Ügyfelek + Autóbeszerzés). Property names are configurable in settings
 * because the databases' schemas were not inspected for this build; title-only by default.
 */
export async function pushToNotion(env: Env, data: { customer: string; email?: string; phone?: string; car: string; priceHuf: number; offerUrl: string }) {
  if (!env.NOTION_TOKEN) return { ok: false, reason: "NOTION_TOKEN nincs beállítva (teszt)" };
  const headers = { Authorization: `Bearer ${env.NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
  const deals = "8795f9c5-e064-4a84-9b97-8ecf7e375f9b";
  const r = await fetch("https://api.notion.com/v1/pages", {
    method: "POST", headers,
    body: JSON.stringify({
      parent: { database_id: deals },
      properties: { Name: { title: [{ text: { content: `${data.customer} – ${data.car}` } }] } },
      children: [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content:
        `Választott autó: ${data.car}\nVégösszeg: ${data.priceHuf.toLocaleString("hu-HU")} Ft\nTelefon: ${data.phone || "-"}\nE-mail: ${data.email || "-"}\nAjánlat: ${data.offerUrl}` } }] } }],
    }),
  });
  return { ok: r.ok, reason: r.ok ? "" : `Notion ${r.status}` };
}
