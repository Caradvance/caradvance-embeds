/**
 * New Ajánlatmotor requests: from email (intake Worker), from a pasted note (staff UI),
 * or for an existing belső deal (adatlap → "Ajánlatmotor indítása").
 * Every request is a belső deal (line Import) with an adatlap card in "Ajánlatra vár".
 */
import type { Env, Requirements } from "./types";
import { extractRequirements, heuristicExtract, isCarRequest } from "./extract";
import { processRequest, getDeal } from "./engine";
import { ensureAm, logEvent, nowIso } from "./am";
import { ensureCrm, getCard, saveCard } from "../crm.js";

export interface InboundLead {
  source: "email" | "manual" | "deal";
  messageId?: string;
  fromEmail?: string;
  fromName?: string;
  subject?: string;
  text: string;
  actor?: string;
  actorId?: number | null;
  assignedTo?: number | null;
  origin?: string;
}

const clean = (v: unknown, max = 300) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function carLabel(req: Requirements) {
  return [req.vehicle.makes[0], req.vehicle.models[0]].filter(Boolean).join(" ") || req.vehicle.body_types[0] || "";
}

async function insertRequest(env: Env, dealId: number, lead: InboundLead, req: Requirements | null, engine: string, status: string) {
  const now = nowIso();
  await env.DB.prepare(`INSERT INTO am_requests (deal_id, status, source, message_id, from_email, subject, body_text, requirements_json,
      meta_json, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(dealId, status, lead.source, lead.messageId ?? null, lead.fromEmail ?? null, lead.subject ?? null, lead.text.slice(0, 50000),
      req ? JSON.stringify(req) : null, JSON.stringify({ engine }), now, now).run();
}

/** Idempotent on Message-ID. Creates the deal + adatlap card + request, then runs the search. */
export async function createRequest(env: Env, lead: InboundLead): Promise<{ dealId: number; duplicate: boolean; isCar: boolean }> {
  await ensureAm(env);
  await ensureCrm(env);
  if (lead.messageId) {
    const dup = await env.DB.prepare("SELECT deal_id FROM am_requests WHERE message_id = ?").bind(lead.messageId).first<{ deal_id: number }>();
    if (dup) return { dealId: dup.deal_id, duplicate: true, isCar: true };
  }
  const full = `${lead.subject ? "Tárgy: " + lead.subject + "\n" : ""}${lead.text}`;
  const car = lead.source !== "email" || isCarRequest(full);
  // non-car mail from the intake address is not turned into a deal; it is only logged
  if (!car) {
    await logEvent(env, null, lead.actor || "intake", "email_ignored", { from: lead.fromEmail, subject: lead.subject, preview: lead.text.slice(0, 400) });
    return { dealId: 0, duplicate: false, isCar: false };
  }
  const { req, engine } = await extractRequirements(env, full, lead.fromEmail, lead.fromName);
  const name = clean(req.customer.name || lead.fromName || lead.fromEmail || "Ismeretlen érdeklődő", 160);
  const budget = req.vehicle.budget_huf_max || 0;
  const ch = lead.source === "email" ? "E-mail" : "Kézi";
  const res = await env.DB.prepare(`INSERT INTO deals (line, stage, ch, name, phone, email, car, price, note, when_text, assigned_to)
      VALUES ('Import', 'Érdeklődés', ?, ?, ?, ?, ?, ?, ?, 'most', ?)`)
    .bind(ch, name, clean(req.customer.phone, 60), clean(req.customer.email || lead.fromEmail, 160), clean(carLabel(req), 160), budget,
      `Ajánlatmotor: ${req.raw_summary}`.slice(0, 2000), lead.assignedTo ?? null).run();
  const dealId = Number(res.meta.last_row_id);
  await saveCard(env, dealId, {
    status: "Ajánlatra vár",
    data: {
      kind: req.customer.company ? "ceg" : "magan",
      person: { name, address: "", phone: clean(req.customer.phone, 200), email: clean(req.customer.email || lead.fromEmail, 200), tax: "" },
      company: { name: clean(req.customer.company, 200), address: "", tax: "", reg: "" },
      contact_differs: false, contact: { name: "", phone: "", email: "", role: "" },
      vehicle: { brand: clean(req.vehicle.makes[0], 200), model: clean(req.vehicle.models[0], 200), year: "", vin: "", color: "", engine: "", fuel: "", km: "", hybrid: false },
      notes: "",
    },
  }, lead.actorId ?? null);
  await insertRequest(env, dealId, lead, req, engine, "NEW");
  await logEvent(env, dealId, lead.actor || "intake", "created", { source: lead.source, engine });
  await processRequest(env, dealId, lead.actor || "system", lead.origin);
  return { dealId, duplicate: false, isCar: true };
}

/** Start the Ajánlatmotor for a deal that already exists in belső (e.g. a phone enquiry). */
export async function startForDeal(env: Env, dealId: number, text: string, actor: string, origin?: string) {
  await ensureAm(env);
  await ensureCrm(env);
  const deal = await getDeal(env, dealId);
  if (!deal) throw new Error("Az ügyfél nem található.");
  const existing = await env.DB.prepare("SELECT deal_id FROM am_requests WHERE deal_id = ?").bind(dealId).first();
  if (existing) return { dealId, created: false };
  const card = await getCard(env, dealId);
  const base = [text, deal.car ? `Autó: ${deal.car}` : "", deal.price ? `Keret: ${deal.price} Ft` : "", deal.note || ""].filter(Boolean).join("\n");
  const { req, engine } = await extractRequirements(env, base, deal.email || undefined, deal.name || undefined);
  // the deal's own contact data win over anything extracted from free text
  req.customer.name = deal.name || req.customer.name;
  req.customer.email = deal.email || card?.data?.person?.email || req.customer.email;
  req.customer.phone = deal.phone || card?.data?.person?.phone || req.customer.phone;
  await insertRequest(env, dealId, { source: "deal", text: base }, req, engine, "NEW");
  await logEvent(env, dealId, actor, "created", { source: "deal", engine });
  if (card?.status === "Kapcsolatfelvételre vár") await saveCard(env, dealId, { status: "Ajánlatra vár" }, null);
  await processRequest(env, dealId, actor, origin);
  return { dealId, created: true };
}

export { heuristicExtract };
