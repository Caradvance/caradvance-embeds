/** Remote parser config for the Chrome extension (kept in sync with extension/parser.js DEFAULT_CONFIG by a test). */
export const PARSER_CONFIG = {
  version: 1,
  listing_url: ["/auto-inserat/", "/fahrzeuge/details.html"],
  search_url: ["/fahrzeuge/search.html", "/auto/"],
  search_card_selectors: ["[data-testid^='result-listing']", "article[class*='result']", "a[href*='details.html?id=']"],
  state_markers: ["firstRegistration", "mileage", "make"],
  dom_patterns: {
    km: "(?:Kilometerstand|Mileage)\\s*([\\d.]+)\\s*km",
    first_registration: "(?:Erstzulassung|First registration)\\s*(\\d{2}/\\d{4})",
    power_kw: "(?:Leistung|Power)\\s*(\\d+)\\s*kW",
    price: "(\\d{1,3}(?:\\.\\d{3})+)\\s*€",
    fuel: "(?:Kraftstoffart|Fuel)\\s*([A-Za-zäöüÄÖÜ\\- ]+?)\\s{2,}",
    gearbox: "(?:Getriebe|Transmission)\\s*(Automatik|Schaltgetriebe|Automatic|Manual)",
    color: "(?:Farbe \\(Hersteller\\)|Manufacturer colour)\\s*(.+?)\\s{2,}",
    zip_city: "\\b(\\d{5})\\s+([A-ZÄÖÜ][\\wäöüß\\-]+(?: [\\wäöüß\\-]+){0,3}?)(?=\\s{2}|$)",
  },
  equipment_heading: ["Ausstattung", "Features"],
  critical_fields: ["price_gross_eur", "km", "first_registration", "power_kw", "seller_location"],
};
