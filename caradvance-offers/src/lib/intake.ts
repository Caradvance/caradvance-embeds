import PostalMime from "postal-mime";
import type { Env } from "../types";
import { extractRequirements, isCarRequest } from "./ai/extract";
import { processRequest } from "./engine";
import { logEvent, newId, nowIso } from "./util";

export interface InboundLead {
  source: "email" | "manual";
  messageId?: string;
  fromEmail?: string;
  fromName?: string;
  subject?: string;
  text: string;
  actor?: string;
}

/** Idempotent: the same Message-ID never creates a second request. */
export async function createRequest(env: Env, lead: InboundLead): Promise<{ id: string; duplicate: boolean }> {
  if (lead.messageId) {
    const dup = await env.DB.prepare("SELECT id FROM requests WHERE message_id = ?").bind(lead.messageId).first<{ id: string }>();
    if (dup) return { id: dup.id, duplicate: true };
  }
  const id = newId("req");
  const now = nowIso();
  const car = isCarRequest(`${lead.subject || ""}\n${lead.text}`);
  const { req, engine } = car
    ? await extractRequirements(env, `${lead.subject ? "Tárgy: " + lead.subject + "\n" : ""}${lead.text}`, lead.fromEmail, lead.fromName)
    : { req: null, engine: "none" };
  try {
    await env.DB.prepare(`INSERT INTO requests (id, created_at, updated_at, status, source, message_id, from_email, subject, body_text,
      requirements_json, extraction_meta_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id, now, now, car ? "NEW" : "REJECTED", lead.source, lead.messageId ?? null, lead.fromEmail ?? null, lead.subject ?? null,
        lead.text.slice(0, 50000), req ? JSON.stringify(req) : null,
        JSON.stringify({ engine, classified_as: car ? "car_request" : "other" }))
      .run();
  } catch (e: any) {
    // race on message_id UNIQUE → treat as duplicate
    if (lead.messageId && String(e?.message || e).includes("UNIQUE")) {
      const dup = await env.DB.prepare("SELECT id FROM requests WHERE message_id = ?").bind(lead.messageId).first<{ id: string }>();
      if (dup) return { id: dup.id, duplicate: true };
    }
    throw e;
  }
  await logEvent(env, id, lead.actor || "intake", "created", { source: lead.source, engine, car });
  if (car) await processRequest(env, id, lead.actor || "system");
  return { id, duplicate: false };
}

/** Cloudflare Email Worker entry: mail forwarded from info@ (Gmail filter) to intake@in.caradvance.hu. */
export async function handleEmail(message: ForwardableEmailMessage, env: Env) {
  const raw = await new Response(message.raw).arrayBuffer();
  const mail = await PostalMime.parse(raw);
  const text = mail.text || stripHtml(mail.html || "");
  // Gmail auto-forward keeps the original From header; reply-to wins if present
  const from = mail.replyTo?.[0] || mail.from;
  await env.DB.prepare("INSERT INTO email_log (direction, to_addr, subject, body, status, at) VALUES ('in', ?, ?, ?, 'logged', ?)")
    .bind(message.to, mail.subject || "", text.slice(0, 2000), nowIso()).run();
  await createRequest(env, {
    source: "email",
    messageId: mail.messageId || message.headers.get("message-id") || undefined,
    fromEmail: (from as any)?.address,
    fromName: (from as any)?.name,
    subject: mail.subject,
    text,
  });
}

export function stripHtml(html: string) {
  return html
    .replace(/<img[^>]*>/gi, "") // tracking pixels
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n").trim();
}
