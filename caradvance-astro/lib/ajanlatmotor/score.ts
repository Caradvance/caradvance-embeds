import type { CostResult, Listing, Requirements } from "./types";

export interface Scored {
  listing: Listing;
  costs: CostResult;
  distanceKm: number;
  distanceMethod: string;
  score: number;
  detail: Record<string, number>;
  rejected: string[]; // hard-filter reasons (empty = eligible)
  rationale: string;
  positioning?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function hardFilter(l: Listing, req: Requirements, costs: CostResult): string[] {
  const v = req.vehicle;
  const r: string[] = [];
  if (v.makes.length && !v.makes.some((m) => norm(l.make).includes(norm(m)) || norm(m).includes(norm(l.make)))) r.push("márka");
  if (v.models.length && !v.models.some((m) => { const hay = ` ${norm(`${l.model} ${l.variant || ""} ${l.title || ""}`)} `; return norm(m).split(" ").every((t) => hay.includes(` ${t} `)); })) r.push("modell");
  if (v.fuel.length && !v.fuel.includes(l.fuel)) r.push("üzemanyag");
  if (v.gearbox && v.gearbox !== l.gearbox) r.push("váltó");
  const year = Number(l.first_registration.slice(0, 4));
  if (v.year_min && year < v.year_min) r.push("évjárat");
  if (v.year_max && year > v.year_max) r.push("évjárat");
  if (v.km_max && l.km > v.km_max) r.push("km");
  if (v.power_kw_min && l.power_kw < v.power_kw_min) r.push("teljesítmény");
  if (v.drivetrain && l.drivetrain && v.drivetrain !== l.drivetrain) r.push("hajtás");
  const missingMust = v.must_have_equipment.filter((e) => !l.equipment.includes(e));
  if (missingMust.length) r.push("kötelező felszereltség: " + missingMust.join(", "));
  const budget = v.budget_huf_max ?? (v.budget_eur_max ? v.budget_eur_max * costs.fx.rate : undefined);
  if (budget) {
    const compare = v.budget_is_total_delivered === false ? costs.vehicle_eur * costs.fx.rate : costs.customer_total_huf;
    if (compare > budget * 1.03) r.push("keret");
  }
  if (l.accident_free === false) r.push("sérült előélet");
  if (v.colors_excluded.some((c) => (l.color || "").toLowerCase().includes(c.toLowerCase()))) r.push("kizárt szín");
  return r;
}

export function scoreListing(l: Listing, req: Requirements, costs: CostResult, distanceKm: number, weights: Record<string, number>, pool: { minTotal: number; maxTotal: number }) {
  const v = req.vehicle;
  const d: Record<string, number> = {};
  // price: cheaper delivered total within the pool scores higher; mobile.de price rating adds a little
  const span = Math.max(1, pool.maxTotal - pool.minTotal);
  const rating = { very_good: 1, good: 0.8, fair: 0.55, increased: 0.3, high: 0.1 }[l.price_rating || ""] ?? 0.5;
  d.price = (1 - (costs.customer_total_huf - pool.minTotal) / span) * 0.75 + rating * 0.25;
  const nice = v.nice_to_have_equipment;
  const niceCov = nice.length ? nice.filter((e) => l.equipment.includes(e)).length / nice.length : 0.5;
  d.equipment = Math.min(1, niceCov * 0.6 + Math.min(1, l.equipment.length / 35) * 0.4);
  const ageMonths = (Date.now() - Date.parse(l.first_registration + "-01")) / (1000 * 60 * 60 * 24 * 30.4);
  d.km_age = Math.max(0, 1 - l.km / 120000) * 0.6 + Math.max(0, 1 - ageMonths / 72) * 0.4;
  d.condition = (l.accident_free ? 0.5 : 0) + (l.service_book ? 0.25 : 0) + ((l.previous_owners ?? 2) <= 1 ? 0.25 : 0.1);
  d.seller = (l.seller.type === "dealer" ? 0.6 : 0.2) + (l.seller.rating ? Math.min(1, l.seller.rating / 5) * 0.4 : 0.1);
  d.distance = Math.max(0, 1 - distanceKm / 1500);
  d.images = Math.min(1, l.images.length / 15);
  const total = Object.entries(weights).reduce((a, [k, w]) => a + (d[k] ?? 0) * w, 0);
  const max = Object.values(weights).reduce((a, b) => a + b, 0);
  return { score: Math.round((total / max) * 1000) / 10, detail: d };
}

const sameish = (a: Listing, b: Listing) =>
  norm(a.model) === norm(b.model) && norm(a.variant || "") === norm(b.variant || "") &&
  a.first_registration.slice(0, 4) === b.first_registration.slice(0, 4) &&
  Math.abs(a.price_gross_eur - b.price_gross_eur) / a.price_gross_eur < 0.04;

/** Pick 3 with a diversity rule, then label best value / best equipped / newest. */
export function pickTop3(eligible: Scored[]): { top: Scored[]; runners: Scored[] } {
  const sorted = [...eligible].sort((a, b) => b.score - a.score);
  const top: Scored[] = [];
  const skipped: Scored[] = [];
  for (const s of sorted) {
    if (top.length >= 3) { skipped.push(s); continue; }
    if (top.some((t) => sameish(t.listing, s.listing))) { skipped.push(s); continue; }
    top.push(s);
  }
  // backfill if diversity left gaps
  while (top.length < 3 && skipped.length) top.push(skipped.shift()!);
  assignPositioning(top);
  return { top, runners: skipped.sort((a, b) => b.score - a.score) };
}

export function assignPositioning(top: Scored[]) {
  const labels: [string, (s: Scored) => number][] = [
    ["A legjobb ár-érték", (s) => -s.costs.customer_total_huf],
    ["A legjobban felszerelt", (s) => s.listing.equipment.length],
    ["A legfrissebb", (s) => Date.parse(s.listing.first_registration + "-01") - s.listing.km],
  ];
  const free = new Set(top);
  for (const [label, key] of labels) {
    const best = [...free].sort((a, b) => key(b) - key(a))[0];
    if (best) { best.positioning = label; free.delete(best); }
  }
}

export function rationaleFor(s: Scored, req: Requirements): string {
  const l = s.listing;
  const parts = [
    `${l.first_registration.replace("-", ".")}, ${l.km.toLocaleString("hu-HU")} km`,
    `${Math.round(s.distanceKm)} km Budapesttől`,
  ];
  const nice = req.vehicle.nice_to_have_equipment.filter((e) => l.equipment.includes(e));
  if (nice.length) parts.push(`plusz: ${nice.join(", ")}`);
  if (l.price_rating === "very_good" || l.price_rating === "good") parts.push("mobile.de szerint jó ár");
  if (l.seller.type === "private") parts.push("magáneladó");
  return parts.join(" · ");
}
