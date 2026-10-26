import type { Listing } from "./types";

// Fictional test listings. Sellers, ad IDs, prices and images are invented for the
// TEST environment only and must never be shown to a real customer.

const base = (id: string, p: Partial<Listing>): Listing => ({
  ad_id: id,
  url: `mock://${id}`,
  make: "BMW",
  model: "i5 Touring",
  title: "",
  price_gross_eur: 0,
  price_net_eur: null,
  vat_reclaimable: true,
  first_registration: "2024-06",
  km: 20000,
  power_kw: 250,
  fuel: "electric",
  gearbox: "automatic",
  drivetrain: "rwd",
  body: "estate",
  color: "",
  equipment: [],
  accident_free: true,
  previous_owners: 1,
  service_book: true,
  seller: { type: "dealer", name: "", city: "", country: "DE" },
  images: Array.from({ length: 6 }, (_, i) => `/api/ajanlatmotor/mock-img/${id}/${i}.svg`),
  fetched_at: new Date().toISOString(),
  ...p,
});

const COMMON = [
  "LED-Scheinwerfer", "Navigationssystem", "Apple CarPlay", "Android Auto", "Volldigitales Kombiinstrument",
  "Sitzheizung", "Elektr. Heckklappe", "Leichtmetallfelgen", "Spurhalteassistent", "Notbremsassistent",
  "Verkehrszeichenerkennung", "Schlüssellose Zentralverriegelung (Keyless)", "Induktionsladen für Smartphones",
];

export const MOCK_LISTINGS: Listing[] = [
  base("1001", {
    variant: "eDrive40 M Sportpaket", title: "BMW i5 Touring eDrive40 M Sportpaket",
    price_gross_eur: 56900, price_net_eur: 47815, first_registration: "2024-09", km: 18400,
    color: "Brooklyngrau Metallic", battery_kwh: 81.2, range_km: 560, price_rating: "good",
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar", "Head-Up Display", "Sportpaket",
      "Sportsitze", "Abstandstempomat", "Ambiente-Beleuchtung", "Soundsystem", "Beheizbares Lenkrad"],
    seller: { type: "dealer", name: "Autohaus Isartal (TESZT)", city: "München", zip: "80331", country: "DE", lat: 48.137, lon: 11.575, rating: 4.7 },
  }),
  base("1002", {
    variant: "eDrive40", title: "BMW i5 Touring eDrive40",
    price_gross_eur: 52400, price_net_eur: 44034, first_registration: "2024-11", km: 26100,
    color: "Mineralweiß Metallic", battery_kwh: 81.2, range_km: 560, price_rating: "very_good",
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar", "Abstandstempomat"],
    seller: { type: "dealer", name: "Donau Automobile Regensburg (TESZT)", city: "Regensburg", zip: "93047", country: "DE", lat: 49.013, lon: 12.101, rating: 4.5 },
  }),
  base("1003", {
    variant: "xDrive40 M Sportpaket Pro", title: "BMW i5 Touring xDrive40 M Sportpaket Pro",
    price_gross_eur: 61900, price_net_eur: 52017, first_registration: "2025-03", km: 9800,
    power_kw: 290, drivetrain: "awd", color: "Frozen Pure Grey", battery_kwh: 81.2, range_km: 510, price_rating: "fair",
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar", "Head-Up Display", "Sportpaket",
      "Sportsitze", "Abstandstempomat", "Ambiente-Beleuchtung", "Soundsystem", "Sitzbelüftung",
      "Elektr. Sitzeinstellung mit Memory-Funktion", "Totwinkel-Assistent", "Allradantrieb", "Luftfederung", "Standheizung"],
    seller: { type: "dealer", name: "Premium Cars Passau (TESZT)", city: "Passau", zip: "94032", country: "DE", lat: 48.574, lon: 13.431, rating: 4.8 },
  }),
  base("1004", {
    variant: "M60 xDrive", title: "BMW i5 Touring M60 xDrive",
    price_gross_eur: 79900, price_net_eur: 67143, first_registration: "2024-10", km: 15200,
    power_kw: 442, drivetrain: "awd", color: "Saphirschwarz Metallic", battery_kwh: 81.2, range_km: 450, price_rating: "fair",
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar", "Head-Up Display", "Sportpaket",
      "Sportsitze", "Abstandstempomat", "Soundsystem", "Massagesitze", "Allradantrieb", "Luftfederung"],
    seller: { type: "dealer", name: "Autohaus am Main (TESZT)", city: "Frankfurt am Main", zip: "60311", country: "DE", lat: 50.11, lon: 8.682, rating: 4.6 },
  }),
  base("1005", {
    variant: "eDrive40", title: "BMW i5 Touring eDrive40",
    price_gross_eur: 49900, price_net_eur: null, vat_reclaimable: false, first_registration: "2024-07", km: 41800,
    color: "Carbonschwarz Metallic", battery_kwh: 81.2, range_km: 560, price_rating: "good", previous_owners: 1,
    equipment: [...COMMON, "Abstandstempomat"],
    seller: { type: "private", name: "Magánszemély (TESZT)", city: "Leipzig", zip: "04109", country: "DE", lat: 51.339, lon: 12.373, rating: null },
  }),
  base("1006", {
    variant: "eDrive40 M Sportpaket", title: "BMW i5 Touring eDrive40 M Sportpaket",
    price_gross_eur: 58500, price_net_eur: 49160, first_registration: "2025-01", km: 12900,
    color: "Mineralweiß Metallic", battery_kwh: 81.2, range_km: 560, price_rating: "fair",
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar", "Head-Up Display", "Sportpaket",
      "Sportsitze", "Abstandstempomat", "Ambiente-Beleuchtung", "Beheizbares Lenkrad"],
    seller: { type: "dealer", name: "Autohaus Lech (TESZT)", city: "Augsburg", zip: "86150", country: "DE", lat: 48.37, lon: 10.898, rating: 4.4 },
  }),
  base("1007", {
    variant: "eDrive40", title: "BMW i5 Touring eDrive40", accident_free: false,
    price_gross_eur: 46900, price_net_eur: 39412, first_registration: "2024-05", km: 33500,
    color: "Brooklyngrau Metallic", battery_kwh: 81.2, range_km: 560, price_rating: "very_good",
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar"],
    seller: { type: "dealer", name: "Autohandel Nord (TESZT)", city: "Hamburg", zip: "20095", country: "DE", lat: 53.551, lon: 9.993, rating: 3.9 },
  }),
  base("2001", {
    make: "Mercedes-Benz", model: "E 300 e T-Modell", variant: "AMG Line", title: "Mercedes-Benz E 300 e T-Modell AMG Line",
    price_gross_eur: 59900, price_net_eur: 50336, first_registration: "2024-08", km: 21000, power_kw: 230,
    fuel: "phev", drivetrain: "rwd", color: "Obsidianschwarz Metallic", euro_norm: "Euro 6e", co2_g_km: 15, battery_kwh: 25.4,
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar", "Head-Up Display", "Abstandstempomat"],
    seller: { type: "dealer", name: "Stern Automobile Stuttgart (TESZT)", city: "Stuttgart", zip: "70173", country: "DE", lat: 48.775, lon: 9.182, rating: 4.6 },
  }),
  base("3001", {
    make: "Audi", model: "A6 Avant e-tron", variant: "performance", title: "Audi A6 Avant e-tron performance",
    price_gross_eur: 64900, price_net_eur: 54538, first_registration: "2025-02", km: 8700, power_kw: 270,
    color: "Daytonagrau Perleffekt", battery_kwh: 94.9,
    equipment: [...COMMON, "Panorama-Dach", "Anhängerkupplung schwenkbar", "Head-Up Display", "Abstandstempomat", "Soundsystem"],
    seller: { type: "dealer", name: "Audi Partner Nürnberg (TESZT)", city: "Nürnberg", zip: "90402", country: "DE", lat: 49.452, lon: 11.077, rating: 4.5 },
  }),
];

const PALETTE: Record<string, string> = {
  brooklyn: "#5b6470", mineral: "#e9ecef", frozen: "#8a9099", saphir: "#111418", carbon: "#1b1e22",
  obsidian: "#15171a", daytona: "#6c727a",
};

function paint(color = "") {
  const k = Object.keys(PALETTE).find((p) => color.toLowerCase().includes(p));
  return k ? PALETTE[k] : "#4a5058";
}

/** Generated placeholder photography for mock listings (clearly labelled TESZTKÉP). */
export function mockImageSvg(adId: string, idx: number): string | null {
  const l = MOCK_LISTINGS.find((x) => x.ad_id === adId);
  if (!l) return null;
  const body = paint(l.color || "");
  const light = body === "#e9ecef";
  const scenes = [
    { sky: ["#c9d3dc", "#eef1f4"], ground: "#9aa3ab", label: "Külső – 3/4 elölről" },
    { sky: ["#1d232b", "#3b4652"], ground: "#232a31", label: "Oldalnézet" },
    { sky: ["#e8e1d6", "#f7f4ef"], ground: "#cbbfae", label: "Hátsó 3/4" },
    { sky: ["#0d0f12", "#22262c"], ground: "#0d0f12", label: "Belső tér" },
    { sky: ["#b8c4cf", "#dfe5ea"], ground: "#808a93", label: "Részlet" },
    { sky: ["#2b2f35", "#565d66"], ground: "#1e2226", label: "Csomagtér" },
  ];
  const s = scenes[idx % scenes.length];
  const flip = idx === 2 ? `transform="translate(1600,0) scale(-1,1)"` : "";
  const interior = idx === 3;
  const car = interior
    ? `<g opacity=".92"><path d="M260 620 Q800 470 1340 620 L1340 900 L260 900Z" fill="#1a1d21"/>
       <rect x="520" y="430" width="560" height="150" rx="22" fill="#0a0c0e" stroke="#2f343a" stroke-width="4"/>
       <rect x="545" y="452" width="250" height="106" rx="12" fill="#1f3b57"/><rect x="805" y="452" width="250" height="106" rx="12" fill="#26313c"/>
       <circle cx="800" cy="760" r="120" fill="none" stroke="#3b4148" stroke-width="26"/><circle cx="800" cy="760" r="34" fill="#2a2f35"/>
       <path d="M300 700 Q420 640 520 690 L520 900 L300 900Z" fill="${light ? "#d9d2c5" : "#4a3a30"}"/>
       <path d="M1300 700 Q1180 640 1080 690 L1080 900 L1300 900Z" fill="${light ? "#d9d2c5" : "#4a3a30"}"/></g>`
    : `<g ${flip}><ellipse cx="800" cy="735" rx="560" ry="34" fill="#000" opacity=".28"/>
       <path d="M250 690 Q262 610 360 590 L560 560 Q650 470 780 455 L1030 452 Q1140 456 1240 540 L1330 568 Q1392 590 1398 650 L1402 700 Q1400 725 1370 728 L1300 730 A92 92 0 0 0 1116 730 L520 730 A92 92 0 0 0 336 730 L278 728 Q248 722 250 690Z" fill="${body}"/>
       <path d="M600 560 Q670 488 780 476 L1010 474 Q1100 478 1180 540Z" fill="${light ? "#2a3038" : "#9fb2c2"}" opacity=".85"/>
       <path d="M300 640 L1380 640" stroke="${light ? "#c5cbd1" : "#ffffff"}" stroke-opacity=".18" stroke-width="3"/>
       <circle cx="428" cy="730" r="80" fill="#141619"/><circle cx="428" cy="730" r="48" fill="#5d646c"/>
       <circle cx="1208" cy="730" r="80" fill="#141619"/><circle cx="1208" cy="730" r="48" fill="#5d646c"/>
       <path d="M1336 600 L1394 612 L1392 632 L1340 628Z" fill="#f2f5f8"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.sky[0]}"/><stop offset="1" stop-color="${s.sky[1]}"/></linearGradient></defs>
  <rect width="1600" height="900" fill="url(#g)"/><rect y="760" width="1600" height="140" fill="${s.ground}"/>
  ${car}
  <g font-family="Helvetica, Arial, sans-serif" fill="${idx === 1 || idx === 3 || idx === 5 ? "#ffffff" : "#0b0b0d"}" opacity=".55">
    <text x="240" y="96" font-size="30" font-weight="700" letter-spacing="4">TESZTKÉP</text>
    <text x="240" y="134" font-size="24">${l.title} · ${s.label}</text></g></svg>`;
}

export function mockSearch(): Listing[] {
  return MOCK_LISTINGS.map((l) => ({ ...l, fetched_at: new Date().toISOString() }));
}

export function mockGetById(idOrUrl: string): Listing | null {
  const id = idOrUrl.match(/(\d{4})/)?.[1];
  const l = MOCK_LISTINGS.find((x) => x.ad_id === id);
  return l ? { ...l, fetched_at: new Date().toISOString() } : null;
}
