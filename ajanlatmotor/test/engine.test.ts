import { describe, expect, it } from "vitest";
import { computeCosts, monthsSince, ageMultiplier, regado } from "../../caradvance-astro/lib/ajanlatmotor/costs";
import { DEFAULT_RATES, unverifiedPaths, setVerified } from "../../caradvance-astro/lib/ajanlatmotor/rates";
import { canTransition } from "../../caradvance-astro/lib/ajanlatmotor/status";
import { heuristicExtract, isCarRequest } from "../../caradvance-astro/lib/ajanlatmotor/extract";
import { hardFilter, pickTop3, scoreListing, type Scored } from "../../caradvance-astro/lib/ajanlatmotor/score";
import { MOCK_LISTINGS } from "../../caradvance-astro/lib/ajanlatmotor/mock";
import { normalizeListing, ListingValidationError, buildSearchUrl, adIdFrom } from "../../caradvance-astro/lib/ajanlatmotor/sources";
import { templateSections } from "../../caradvance-astro/lib/ajanlatmotor/describe";
import { DEMO_EMAIL } from "../../caradvance-astro/lib/ajanlatmotor/demo";
import type { Listing } from "../../caradvance-astro/lib/ajanlatmotor/types";

const fx = { rate: 395, date: "2026-10-26", fallback: false };

describe("NAV registration tax", () => {
  it("matches the xlsx's own reference case: 90 kW, class 9–11, 2021.07 → 2024.11 = 465 300 Ft", () => {
    expect(monthsSince("2021-07", "2024-11")).toBe(41);
    expect(ageMultiplier(41, DEFAULT_RATES.regado.age_multipliers)).toBe(0.55);
    const l = { ...MOCK_LISTINGS[0], power_kw: 90, fuel: "petrol", first_registration: "2021-07" } as Listing;
    expect(regado(l, DEFAULT_RATES, 4, "2024-11").amount).toBe(465300);
  });
  it("electric cars (5E) are exempt", () => {
    expect(regado(MOCK_LISTINGS[0], DEFAULT_RATES, 0, "2026-11").amount).toBe(0);
  });
});

describe("cost calculator", () => {
  const req = heuristicExtract(DEMO_EMAIL.text, DEMO_EMAIL.from, DEMO_EMAIL.name);
  const base = { req, rates: DEFAULT_RATES, rateVersion: 1, fx, distanceKm: 690, distanceFallback: false, registrationMonth: "2026-11" };

  it("never exposes the margin as its own customer line and the lines sum to the total", () => {
    const c = computeCosts({ ...base, listing: MOCK_LISTINGS[0] });
    expect(c.customer_lines.some((x) => /árrés|margin/i.test(x.label))).toBe(false);
    expect(c.customer_lines.reduce((a, b) => a + b.amount_huf, 0)).toBe(c.customer_total_huf);
    expect(c.customer_total_huf % 10000).toBe(0);
    expect(c.margin_huf).toBeGreaterThanOrEqual(DEFAULT_RATES.margin.min_huf);
  });
  it("flags every unverified placeholder", () => {
    const c = computeCosts({ ...base, listing: MOCK_LISTINGS[0] });
    expect(c.unverified).toEqual(expect.arrayContaining(["logistics", "eredetiseg", "muszaki", "illetek", "ugyintezes", "margin"]));
    expect(c.unverified).not.toContain("vehicle");
    expect(c.unverified).not.toContain("regado");
  });
  it("an admin override counts as confirmed", () => {
    const c = computeCosts({ ...base, listing: MOCK_LISTINGS[0], overrides: { lines: { logistics: 300000 } } });
    expect(c.lines.find((x) => x.key === "logistics")!.amount_huf).toBe(300000);
    expect(c.unverified).not.toContain("logistics");
  });
  it("company buyer with MwSt. ausweisbar uses the net price", () => {
    const c = computeCosts({ ...base, req: { ...req, vehicle: { ...req.vehicle, vat_deductible_needed: true } }, listing: MOCK_LISTINGS[0] });
    expect(c.price_basis).toBe("net");
    expect(c.vehicle_eur).toBe(MOCK_LISTINGS[0].price_net_eur);
  });
  it("warns on the ≤6 months / ≤6000 km new-vehicle VAT rule", () => {
    const c = computeCosts({ ...base, listing: { ...MOCK_LISTINGS[0], km: 4000 } });
    expect(c.warnings.join(" ")).toMatch(/Új közlekedési eszköz/);
  });
  it("confirming all rates clears the publish gate", () => {
    let r = DEFAULT_RATES;
    for (const p of unverifiedPaths(r)) r = setVerified(r, p, true);
    expect(unverifiedPaths(r)).toEqual([]);
    const c = computeCosts({ ...base, rates: r, listing: MOCK_LISTINGS[0] });
    expect(c.unverified).toEqual([]);
  });
});

describe("status machine", () => {
  it("allows the main path and blocks shortcuts", () => {
    expect(canTransition("NEW", "SEARCHING")).toBe(true);
    expect(canTransition("NEEDS_REVIEW", "READY")).toBe(true);
    expect(canTransition("READY", "PUBLISHED")).toBe(true);
    expect(canTransition("PUBLISHED", "CHOSEN")).toBe(true);
    expect(canTransition("NEW", "PUBLISHED")).toBe(false);
    expect(canTransition("CLOSED", "NEEDS_REVIEW")).toBe(false);
  });
});

describe("requirement extraction (heuristic, no API key)", () => {
  const r = heuristicExtract(DEMO_EMAIL.text, DEMO_EMAIL.from, DEMO_EMAIL.name);
  it("reads the demo email", () => {
    expect(r.customer.language).toBe("hu");
    expect(r.customer.name).toBe("Kiss Péter");
    expect(r.customer.phone).toMatch(/\+36 30 123 4567/);
    expect(r.vehicle.makes).toEqual(["BMW"]);
    expect(r.vehicle.models[0]).toMatch(/i5 Touring/);
    expect(r.vehicle.fuel).toEqual(["electric"]);
    expect(r.vehicle.gearbox).toBe("automatic");
    expect(r.vehicle.km_max).toBe(50000);
    expect(r.vehicle.budget_huf_max).toBe(25_000_000);
    expect(r.vehicle.must_have_equipment).toEqual(expect.arrayContaining(["Panorama-Dach", "Anhängerkupplung schwenkbar"]));
    expect(r.vehicle.nice_to_have_equipment).toContain("Head-Up Display");
    expect(r.missing_critical_fields).toEqual([]);
  });
  it("flags missing budget", () => {
    expect(heuristicExtract("Szia, egy jó kombit keresnék.").missing_critical_fields).toContain("keret");
  });
  it("classifies non-car mail", () => {
    expect(isCarRequest("Számla a múlt havi irodaszerről")).toBe(false);
    expect(isCarRequest("Audi A6 érdekelne")).toBe(true);
  });
});

describe("scoring and top 3", () => {
  const req = heuristicExtract(DEMO_EMAIL.text, DEMO_EMAIL.from, DEMO_EMAIL.name);
  const scored: Scored[] = MOCK_LISTINGS.map((l) => {
    const costs = computeCosts({ listing: l, req, rates: DEFAULT_RATES, rateVersion: 1, fx, distanceKm: 700, distanceFallback: false, registrationMonth: "2026-11" });
    return { listing: l, costs, distanceKm: 700, distanceMethod: "estimate", score: 0, detail: {}, rejected: hardFilter(l, req, costs), rationale: "" };
  });
  const eligible = scored.filter((s) => !s.rejected.length);
  for (const s of eligible) s.score = scoreListing(s.listing, req, s.costs, 700, DEFAULT_RATES.scoring, { minTotal: 0, maxTotal: 40e6 }).score;

  it("applies hard filters", () => {
    const byId = Object.fromEntries(scored.map((s) => [s.listing.ad_id, s.rejected]));
    expect(byId["2001"]).toContain("márka");          // Mercedes
    expect(byId["1005"].join()).toMatch(/kötelező/);    // no panorama/tow bar
    expect(byId["1007"]).toContain("sérült előélet");
    expect(byId["1004"]).toContain("keret");            // M60 over budget
  });
  it("picks three distinct cars with positioning labels", () => {
    const { top } = pickTop3(eligible);
    expect(top).toHaveLength(3);
    expect(new Set(top.map((t) => t.positioning)).size).toBe(3);
    expect(new Set(top.map((t) => t.listing.ad_id)).size).toBe(3);
  });
});

describe("listing normalisation (extension input)", () => {
  it("rejects missing critical fields", () => {
    expect(() => normalizeListing({ make: "BMW", model: "i5", price_gross_eur: 50 })).toThrow(ListingValidationError);
  });
  it("parses German formats and filters foreign image hosts", () => {
    const l = normalizeListing({
      ad_id: "123456789", make: "BMW", model: "i5 Touring", price_gross_eur: "56.900 €", km: "18.400 km", power_kw: "250",
      first_registration: "09/2024", fuel: "Elektro", gearbox: "Automatik", seller: { city: "München" },
      images: ["https://img.classistatic.de/api/v1/mo-prod/images/aa/x.jpg", "https://evil.example.com/y.jpg"],
    });
    expect(l.price_gross_eur).toBe(56900);
    expect(l.km).toBe(18400);
    expect(l.first_registration).toBe("2024-09");
    expect(l.fuel).toBe("electric");
    expect(l.images).toHaveLength(1);
  });
  it("extracts ad ids and builds a search url", () => {
    expect(adIdFrom("https://suchen.mobile.de/fahrzeuge/details.html?id=412345678&lang=de")).toBe("412345678");
    const req = heuristicExtract(DEMO_EMAIL.text);
    const u = new URL(buildSearchUrl(req, 55000));
    expect(u.searchParams.get("ms")).toBe("3500;;;i5"); // model goes into the 4th field, "Touring" via body type
    expect(u.searchParams.get("c")).toBe("EstateCar");
    expect(u.searchParams.get("ft")).toBe("ELECTRICITY");
    expect(u.searchParams.get("p")).toBe(":55000");
    expect(u.searchParams.getAll("fe")).toContain("PANORAMIC_GLASS_ROOF");
    expect(u.searchParams.get("tct")).toBe("TRAILER_COUPLING_FIX");
  });
});

describe("template descriptions", () => {
  it("only states facts from the listing", () => {
    const s = templateSections(MOCK_LISTINGS[0], 690);
    expect(s).toHaveLength(5);
    const all = s.map((x) => x.body).join(" ");
    expect(all).toContain("250 kW");
    expect(all).toContain("München");
    expect(all).not.toMatch(/garancia|jótállás|!/);
  });
});

describe("company buyers", () => {
  it("detects company and VAT need in Hungarian", () => {
    const r = heuristicExtract("Audi A6 Avant e-tron kellene, 28 millió Ft. Cégként vásárolnánk (Nagy és Társa Kft.), ÁFA-s számla kell.");
    expect(r.customer.company).toBe("Nagy és Társa Kft.");
    expect(r.vehicle.vat_deductible_needed).toBe(true);
  });
});
