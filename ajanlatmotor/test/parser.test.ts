import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { normalizeListing } from "../../caradvance-astro/lib/ajanlatmotor/sources";
import { PARSER_CONFIG } from "../../caradvance-astro/lib/ajanlatmotor/parser-config";

const require = createRequire(import.meta.url);
const P = require("../extension/parser.js");
const fx = (f: string) => readFileSync(new URL(`../extension/fixtures/${f}`, import.meta.url), "utf8");

describe("extension parser", () => {
  it("layer 1: JSON-LD", () => {
    const r = P.parseListing(fx("listing-jsonld.html"), "https://suchen.mobile.de/fahrzeuge/details.html?id=401234567", PARSER_CONFIG);
    expect(r.layers).toContain("jsonld");
    expect(r.missing).toEqual([]);
    const l = r.listing;
    expect(l).toMatchObject({ ad_id: "401234567", make: "BMW", model: "i5 Touring", price_gross_eur: 56900, km: 18400, first_registration: "2024-09", power_kw: 250 });
    expect(l.seller).toMatchObject({ city: "München", lat: 48.137 });
    expect(l.equipment).toContain("Panorama-Dach"); // from the DOM layer, merged
    expect(normalizeListing(l).fuel).toBe("electric");
  });

  it("layer 2: embedded state found by shape, without a known variable name", () => {
    const r = P.parseListing(fx("listing-state.html"), "https://suchen.mobile.de/fahrzeuge/details.html?id=412345678", PARSER_CONFIG);
    expect(r.layers).toContain("state");
    expect(r.missing).toEqual([]);
    expect(r.listing).toMatchObject({ price_gross_eur: 61900, price_net_eur: 52017, vat_reclaimable: true, km: 9800, first_registration: "2025-03", power_kw: 290, previous_owners: 1, accident_free: true });
    expect(r.listing.images[0]).toMatch(/^https:\/\/img\.classistatic\.de\/.+rule=mo-1600$/);
    expect(r.listing.seller).toMatchObject({ city: "Passau", lat: 48.574, type: "dealer" });
  });

  it("layer 3: DOM patterns only", () => {
    const r = P.parseListing(fx("listing-dom-only.html"), "https://suchen.mobile.de/fahrzeuge/details.html?id=433333333", PARSER_CONFIG);
    expect(r.layers).toEqual(["dom"]);
    expect(r.listing).toMatchObject({ make: "Audi", price_gross_eur: 64900, km: 8700, first_registration: "2025-02", power_kw: 270 });
    expect(r.listing.seller.city).toBe("Nürnberg");
    expect(r.listing.equipment).toEqual(["Head-Up Display", "Soundsystem"]);
    expect(() => normalizeListing(r.listing)).not.toThrow();
  });

  it("reports missing critical fields instead of guessing", () => {
    const r = P.parseListing("<html><body><h1>BMW X5</h1></body></html>", "https://suchen.mobile.de/fahrzeuge/details.html?id=499999999", PARSER_CONFIG);
    expect(r.missing).toEqual(expect.arrayContaining(["price_gross_eur", "km", "first_registration", "power_kw", "seller_location"]));
  });

  it("recognises listing vs search pages", () => {
    expect(P.isListingUrl("https://suchen.mobile.de/fahrzeuge/details.html?id=1")).toBe(true);
    expect(P.isSearchUrl("https://suchen.mobile.de/fahrzeuge/search.html?s=Car")).toBe(true);
    expect(P.isSearchUrl("https://suchen.mobile.de/fahrzeuge/details.html?id=1")).toBe(false);
  });

  it("bundled default config stays in sync with the Worker's remote config", () => {
    expect(P.DEFAULT_CONFIG).toEqual(PARSER_CONFIG);
  });

  it("layer 0: 2026 vehicle page (dt/dd, gallery slides, feature list), new car without first registration", () => {
    const img = (n: number) => `<div data-testid="image-${n}"><button><img src="https://img.classistatic.de/api/v1/mo-prod/images/a${n}/a${n}aaaaaa-1111-2222-3333-44444444444${n}?rule=mo-360.jpg"></button></div>`;
    const html = `<html><head><script type="application/ld+json">{"@type":"Car","name":"BMW i5 eDrive40 TOURING","brand":{"name":"BMW"},"model":"i5","image":"https://img.classistatic.de/api/v1/mo-prod/images/a1/x?rule=mo-1024.jpg","mileageFromOdometer":{"value":0},"offers":{"price":54880,"offeredBy":{"@type":"AutoDealer","name":"Autohaus Lell","address":{"addressLocality":"Schwandorf","postalCode":"92421","addressCountry":"DE"}}}}</script></head><body>
      ${img(1)}${img(2)}${img(3)}
      <span>54.880 €</span><span>46.118&nbsp;€ Netto, 19% MwSt.</span>
      <dl><dt>Fahrzeugzustand</dt><dd>Neufahrzeug</dd><dt>Kategorie</dt><dd>Kombi</dd><dt>Kilometerstand</dt><dd>0&nbsp;km</dd>
      <dt>Leistung</dt><dd>250 kW (340 PS)</dd><dt>Antriebsart</dt><dd>Elektromotor</dd><dt>Getriebe</dt><dd>Automatik</dd><dt>Farbe (Hersteller)</dt><dd>Alpinweiß</dd></dl>
      <div data-testid="vip-features-list"><ul><li>Panorama-Dach</li><li>Anhängerkupplung schwenkbar</li><li>Head-Up Display</li></ul></div></body></html>`;
    const r = P.parseListing(html, "https://suchen.mobile.de/fahrzeuge/details.html?id=458963235", PARSER_CONFIG);
    expect(r.layers[0]).toBe("vip");
    expect(r.missing).toEqual([]);
    const l = r.listing;
    expect(l.km).toBe(0);
    expect(l.condition).toBe("new");
    expect(l.first_registration).toMatch(/^\d{4}-\d{2}$/);
    expect(l.images).toHaveLength(3);
    expect(l.images[0]).toContain("rule=mo-1024.jpg");
    expect(l.equipment).toEqual(["Panorama-Dach", "Anhängerkupplung schwenkbar", "Head-Up Display"]);
    expect(l).toMatchObject({ power_kw: 250, price_gross_eur: 54880, price_net_eur: 46118, vat_reclaimable: true });
    expect(normalizeListing(l).fuel).toBe("electric");
  });
});
