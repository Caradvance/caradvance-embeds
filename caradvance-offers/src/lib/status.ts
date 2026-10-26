import type { Env } from "../types";
import { logEvent, nowIso } from "./util";

export const STATUSES = [
  "NEW", "SEARCHING", "NEEDS_REVIEW", "READY", "PUBLISHED", "VIEWED", "CHOSEN", "CLOSED",
  "REJECTED", "EXPIRED", "NO_MATCH",
] as const;
export type Status = (typeof STATUSES)[number];

const T: Record<Status, Status[]> = {
  NEW: ["SEARCHING", "NEEDS_REVIEW", "REJECTED"],
  SEARCHING: ["NEEDS_REVIEW", "NO_MATCH", "REJECTED"],
  NEEDS_REVIEW: ["SEARCHING", "READY", "REJECTED", "NO_MATCH"],
  NO_MATCH: ["SEARCHING", "NEEDS_REVIEW", "REJECTED"],
  READY: ["NEEDS_REVIEW", "SEARCHING", "PUBLISHED", "REJECTED"],
  PUBLISHED: ["VIEWED", "CHOSEN", "NEEDS_REVIEW", "EXPIRED", "CLOSED"],
  VIEWED: ["CHOSEN", "NEEDS_REVIEW", "EXPIRED", "CLOSED"],
  CHOSEN: ["CLOSED", "NEEDS_REVIEW"],
  EXPIRED: ["NEEDS_REVIEW", "CLOSED"],
  REJECTED: ["NEEDS_REVIEW"],
  CLOSED: [],
};

export const STATUS_LABEL: Record<Status, string> = {
  NEW: "Új", SEARCHING: "Keresés", NEEDS_REVIEW: "Átnézendő", READY: "Kész", PUBLISHED: "Kiküldve",
  VIEWED: "Megnyitva", CHOSEN: "Választott", CLOSED: "Lezárva", REJECTED: "Elutasítva",
  EXPIRED: "Lejárt", NO_MATCH: "Nincs találat",
};

export function canTransition(from: Status, to: Status) {
  return from === to || T[from].includes(to);
}

export async function transition(env: Env, requestId: string, to: Status, actor: string, data?: unknown) {
  const row = await env.DB.prepare("SELECT status FROM requests WHERE id = ?").bind(requestId).first<{ status: Status }>();
  if (!row) throw new Error("request not found");
  if (row.status === to) return;
  if (!canTransition(row.status, to)) throw new Error(`Invalid status transition ${row.status} → ${to}`);
  await env.DB.prepare("UPDATE requests SET status = ?, updated_at = ? WHERE id = ?").bind(to, nowIso(), requestId).run();
  await logEvent(env, requestId, actor, "status", data, row.status, to);
}
