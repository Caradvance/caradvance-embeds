import type { Lang, Section } from "./types";
import { esc } from "./am";

export interface PublicCar {
  cid: string;
  slot: number;
  positioning: string | null;
  title: string;
  make: string;
  model: string;
  variant?: string;
  first_registration: string;
  km: number;
  power_kw: number;
  fuel: string;
  gearbox: string;
  drivetrain?: string | null;
  color?: string | null;
  battery_kwh?: number | null;
  range_km?: number | null;
  previous_owners?: number | null;
  accident_free?: boolean | null;
  service_book?: boolean | null;
  equipment_count: number;
  equipment: Record<string, string[]>;
  key_equipment: string[]; // HU labels of the customer's must/nice items present
  city: string;
  country: string;
  distance_km: number;
  images: string[];
  sections: Section[];
  customer_lines: { label: string; amount_huf: number }[];
  total_huf: number;
  total_eur: number;
}

export interface PublicOffer {
  offer_no: string;
  language: Lang;
  customer_name: string;
  first_name: string;
  chips: string[];
  contact: { name: string; title: string; phone: string; whatsapp: string; email: string };
  valid_until: string;
  fx: { rate: number; date: string };
  wanted_equipment: string[]; // HU labels, for comparison ticks
  cars: PublicCar[];
}

export interface OfferState {
  token: string;
  test: boolean;
  preview: boolean;
  nonce: string;
  chosenCid?: string | null;
  done?: "chosen" | "none" | null;
  expired?: boolean;
}

const I18N = {
  hu: {
    eyebrow: "Személyre szabott ajánlat",
    hello: (n: string) => `Szia ${n}, itt a három autó, amit neked választottunk.`,
    intro: "Mindhárom autót egyenként átnéztük. Az árak Budapesten, forgalomba helyezve értendők, minden díjjal együtt.",
    valid: "Érvényes", contactTitle: "Kérdésed van? Írj vagy hívj.", details: "Részletek", choose: "Ezt választom",
    totalLabel: "Teljes ár Budapesten, forgalomba helyezve", compare: "Összehasonlítás", prices: "Árak",
    gallery: "Galéria", equipment: "Felszereltség", location: (c: string, km: number) => `Az autó jelenleg itt áll: ${c}, Németország, ${km} km-re Budapesttől.`,
    rows: { year: "Első forgalomba helyezés", km: "Futásteljesítmény", power: "Teljesítmény", fuel: "Hajtás típusa", range: "Hatótáv (WLTP, hirdetés szerint)",
      battery: "Akkumulátor", gearbox: "Váltó", drive: "Hajtás", color: "Szín", owners: "Korábbi tulajdonosok", accident: "Balesetmentes",
      equipCount: "Felszereltségi tételek", total: "Teljes ár" },
    yes: "Igen", no: "Nem", none: "Egyik sem az igazi?", noneBody: "Írd meg, mi hiányzik, és keresünk tovább.",
    send: "Küldés", cancel: "Mégse", name: "Név", phone: "Telefon", message: "Üzenet (nem kötelező)", callback: "Mikor hívhatunk?",
    cb: ["Bármikor", "Délelőtt", "Délután", "Este"],
    consent: "Tudomásul veszem, hogy az autó csak a foglaló befizetése és az eladó visszaigazolása után számít lefoglaltnak.",
    chooseTitle: (t: string) => `${t}`, chooseLead: "Visszahívunk, és együtt végigmegyünk a következő lépéseken.",
    thanks: (t: string) => `Köszönjük, rögzítettük a választásodat: ${t}.`,
    next: ["1 munkanapon belül hívunk.", "Az eladónál ellenőrizzük az autó elérhetőségét és állapotát.", "Foglaló és szerződés, utána indul a szállítás.", "Honosítás és forgalomba helyezés, átadás Budapesten."],
    noneThanks: "Köszönjük a visszajelzést. Hamarosan új ajánlattal jelentkezünk.",
    chosenBadge: "A választásod", fx: (r: string, d: string) => `≈ árak, 1 € = ${r} Ft (${d}). Az árfolyam minden reggel 8:00-kor frissül.`,
    disclaimer: "A hirdetések harmadik fél eladóktól származnak. Az autó elérhetősége és ára a foglaláskor válik véglegessé. Az árak tájékoztató jellegűek.",
    expired: "Az ajánlat lejárt, kérj frisset.", expiredBody: "Az autópiac gyorsan mozog, ezért ajánlataink 7 napig érvényesek. Szívesen frissítjük.",
    fuel: { electric: "Elektromos", phev: "Plug-in hibrid", hybrid: "Hibrid", diesel: "Dízel", petrol: "Benzin" } as Record<string, string>,
    gear: { automatic: "Automata", manual: "Manuális" } as Record<string, string>,
    drive: { awd: "Összkerék", rwd: "Hátsókerék", fwd: "Elsőkerék" } as Record<string, string>,
    owners: (n: number) => `${n}`, required: "Kötelező mező",
  },
  de: {
    eyebrow: "Ihr persönliches Angebot",
    hello: (n: string) => `Hallo ${n}, hier sind die drei Fahrzeuge, die wir für Sie ausgewählt haben.`,
    intro: "Wir haben jedes Fahrzeug einzeln geprüft. Die Preise verstehen sich zugelassen in Budapest, inklusive aller Gebühren.",
    valid: "Gültig bis", contactTitle: "Fragen? Schreiben oder rufen Sie uns an.", details: "Details", choose: "Dieses Fahrzeug wählen",
    totalLabel: "Gesamtpreis in Budapest, zugelassen", compare: "Vergleich", prices: "Preise",
    gallery: "Galerie", equipment: "Ausstattung", location: (c: string, km: number) => `Standort: ${c}, Deutschland, ${km} km von Budapest entfernt.`,
    rows: { year: "Erstzulassung", km: "Kilometerstand", power: "Leistung", fuel: "Antriebsart", range: "Reichweite (WLTP, laut Inserat)",
      battery: "Batterie", gearbox: "Getriebe", drive: "Antrieb", color: "Farbe", owners: "Vorbesitzer", accident: "Unfallfrei",
      equipCount: "Ausstattungsmerkmale", total: "Gesamtpreis" },
    yes: "Ja", no: "Nein", none: "Keines passt?", noneBody: "Sagen Sie uns, was fehlt, und wir suchen weiter.",
    send: "Senden", cancel: "Abbrechen", name: "Name", phone: "Telefon", message: "Nachricht (optional)", callback: "Wann dürfen wir anrufen?",
    cb: ["Jederzeit", "Vormittags", "Nachmittags", "Abends"],
    consent: "Mir ist bekannt, dass das Fahrzeug erst nach Anzahlung und Bestätigung durch den Verkäufer reserviert ist.",
    chooseTitle: (t: string) => `${t}`, chooseLead: "Wir rufen Sie zurück und besprechen die nächsten Schritte.",
    thanks: (t: string) => `Vielen Dank, Ihre Wahl ist gespeichert: ${t}.`,
    next: ["Wir melden uns innerhalb eines Werktags.", "Wir prüfen Verfügbarkeit und Zustand beim Verkäufer.", "Anzahlung und Vertrag, danach startet der Transport.", "Zulassung in Ungarn, Übergabe in Budapest."],
    noneThanks: "Danke für Ihr Feedback. Wir melden uns bald mit einem neuen Angebot.",
    chosenBadge: "Ihre Wahl", fx: (r: string, d: string) => `≈ Preise, 1 € = ${r} Ft (${d}). Der Kurs wird jeden Morgen um 8:00 Uhr aktualisiert.`,
    disclaimer: "Die Inserate stammen von Drittverkäufern. Verfügbarkeit und Preis werden mit der Reservierung verbindlich. Alle Preise sind Richtwerte.",
    expired: "Dieses Angebot ist abgelaufen.", expiredBody: "Der Markt bewegt sich schnell, daher gelten unsere Angebote 7 Tage. Wir aktualisieren es gern.",
    fuel: { electric: "Elektro", phev: "Plug-in-Hybrid", hybrid: "Hybrid", diesel: "Diesel", petrol: "Benzin" } as Record<string, string>,
    gear: { automatic: "Automatik", manual: "Schaltgetriebe" } as Record<string, string>,
    drive: { awd: "Allrad", rwd: "Heckantrieb", fwd: "Frontantrieb" } as Record<string, string>,
    owners: (n: number) => `${n}`, required: "Pflichtfeld",
  },
};
I18N["en" as "hu"] = I18N.hu; // English/SK/CZ/PL UI strings: TODO, Hungarian until translated

export const t = (lang: Lang) => (I18N as any)[lang] || I18N.hu;

const huf = (n: number) => new Intl.NumberFormat("hu-HU").format(Math.round(n)).replace(/\s/g, " ") + " Ft";
const eur = (n: number) => new Intl.NumberFormat("de-DE").format(Math.round(n)) + " €";
const ym = (s: string) => s.replace("-", ".");
const ps = (kw: number) => Math.round(kw * 1.35962);

const CSS = `
:root{--navy:#0B0B0D;--red:#E2001A;--bg:#F4F7FB;--card:#fff;--line:#E3E9F2;--ink:#0B0B0D;--muted:#5d6672;--soft:#eef2f8;
--r:18px;--max:1240px;--pad:clamp(16px,4vw,40px)}
*{box-sizing:border-box}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}a{color:inherit}
.wrap{max-width:var(--max);margin:0 auto;padding:0 var(--pad)}
.testbar{background:#ffd84d;color:#111;font-size:13px;font-weight:700;text-align:center;padding:6px 12px;letter-spacing:.02em}
.top{background:#fff;border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:68px;gap:16px}
.logo{height:30px;width:auto}
.top small{color:var(--muted);font-size:13px;font-weight:600;letter-spacing:.02em;text-align:right}
.hero{background:var(--navy);color:#fff;position:relative;overflow:hidden}
.hero:after{content:"";position:absolute;right:-12%;top:-30%;width:60%;height:160%;background:radial-gradient(closest-side,rgba(226,0,26,.22),transparent 70%);pointer-events:none}
.hero .wrap{display:grid;grid-template-columns:1.35fr .9fr;gap:clamp(24px,5vw,72px);padding-top:clamp(48px,8vw,104px);padding-bottom:clamp(48px,7vw,96px);position:relative;z-index:1}
.eyebrow{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.62)}
.eyebrow b{color:var(--red);font-weight:800}
.hero h1{font-size:clamp(32px,5.2vw,64px);line-height:1.04;letter-spacing:-.025em;font-weight:800;margin:18px 0 20px;max-width:16ch}
.hero p.lead{font-size:clamp(16px,1.6vw,19px);color:rgba(255,255,255,.74);max-width:52ch;margin:0 0 28px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.chips li{border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;color:rgba(255,255,255,.88)}
.contact{align-self:end;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:var(--r);padding:26px;backdrop-filter:blur(6px)}
.contact .who{display:flex;gap:14px;align-items:center;margin-bottom:18px}
.avatar{width:52px;height:52px;border-radius:50%;background:#fff;color:var(--navy);display:grid;place-items:center;font-weight:800;font-size:18px;flex:none}
.contact strong{display:block;font-size:17px}.contact span{color:rgba(255,255,255,.62);font-size:14px}
.contact .btns{display:flex;flex-wrap:wrap;gap:10px}
.contact .valid{margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.12);font-size:13.5px;color:rgba(255,255,255,.62);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.contact .valid a{color:rgba(255,255,255,.85);text-decoration:none}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;padding:13px 22px;font:inherit;font-weight:700;font-size:15px;text-decoration:none;border:1.5px solid transparent;cursor:pointer;transition:transform .2s,background .2s,border-color .2s;min-height:48px}
.btn:active{transform:scale(.98)}
.btn-red{background:var(--red);color:#fff}.btn-red:hover{background:#c50017}
.btn-line{border-color:var(--line);background:#fff;color:var(--ink)}.btn-line:hover{border-color:var(--ink)}
.btn-ghost{border-color:rgba(255,255,255,.28);color:#fff;background:transparent}.btn-ghost:hover{border-color:#fff}
.btn svg{width:18px;height:18px}
.overview{padding:clamp(40px,6vw,80px) 0 clamp(24px,4vw,40px)}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .3s,transform .3s}
.card:hover{box-shadow:0 24px 48px -28px rgba(11,11,13,.35);transform:translateY(-2px)}
.card .ph{aspect-ratio:16/10;background:var(--soft);overflow:hidden}.card .ph img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
.card:hover .ph img{transform:scale(1.03)}
.card .bd{padding:22px 22px 24px;display:flex;flex-direction:column;gap:14px;flex:1}
.pos{font-size:11.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.card h2{font-size:22px;line-height:1.2;margin:0;letter-spacing:-.01em}
.card h2 span{display:block;font-size:15px;font-weight:600;color:var(--muted);margin-top:4px;letter-spacing:0}
.specs{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;margin:0;font-size:14px}
.specs dt{color:var(--muted);font-size:12px;font-weight:600}.specs dd{margin:0;font-weight:700}
.price{margin-top:auto;padding-top:16px;border-top:1px solid var(--line)}
.price .big{display:block;font-size:26px;font-weight:800;letter-spacing:-.02em;white-space:nowrap}.price .eur{display:block;color:var(--muted);font-weight:600;font-size:14px}
.price small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.card .acts{display:grid;grid-template-columns:1fr 1.25fr;gap:10px}
.chosen-tag{display:none;background:var(--navy);color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;align-self:flex-start}
body.has-choice .card[data-chosen] .chosen-tag{display:inline-block}
body.has-choice .card:not([data-chosen]){opacity:.55}
body.has-choice .choose-btn{display:none}
.subnav{position:sticky;top:0;z-index:20;background:rgba(244,247,251,.86);backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line)}
.subnav .wrap{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;height:56px;align-items:center}
.subnav .wrap::-webkit-scrollbar{display:none}
.subnav a{white-space:nowrap;text-decoration:none;font-size:14px;font-weight:700;color:var(--muted);padding:8px 14px;border-radius:999px;transition:background .2s,color .2s}
.subnav a.on,.subnav a:hover{color:var(--ink);background:#fff;box-shadow:inset 0 0 0 1px var(--line)}
.subnav a b{color:var(--red);margin-right:6px}
.car{padding:clamp(40px,6vw,88px) 0 0}
.car-hero{position:relative;border-radius:calc(var(--r) + 6px);overflow:hidden;background:var(--navy);aspect-ratio:21/9;min-height:360px}
.car-hero img{width:100%;height:100%;object-fit:cover;opacity:.92}
.car-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,13,0) 35%,rgba(11,11,13,.82) 100%)}
.car-hero .cap{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:clamp(20px,4vw,48px);color:#fff;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
.car-hero .num{font-size:13px;font-weight:800;letter-spacing:.16em;color:rgba(255,255,255,.7)}
.car-hero .num b{color:var(--red)}
.car-hero h2{font-size:clamp(30px,5vw,64px);line-height:1.02;letter-spacing:-.025em;margin:10px 0 8px;font-weight:800}
.car-hero p{margin:0;color:rgba(255,255,255,.78);font-weight:600}
.car-hero .cta{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.car-hero .cta .big{font-size:clamp(22px,2.6vw,30px);font-weight:800;letter-spacing:-.02em}
.car-hero .cta small{color:rgba(255,255,255,.66);font-size:12.5px}
.story{display:grid;gap:clamp(36px,6vw,96px);padding:clamp(40px,6vw,96px) 0}
.chapter{display:grid;grid-template-columns:1.25fr 1fr;gap:clamp(24px,5vw,72px);align-items:center}
.chapter:nth-child(even){grid-template-columns:1fr 1.25fr}.chapter:nth-child(even) .media{order:2}
.chapter .media{border-radius:var(--r);overflow:hidden;aspect-ratio:4/3;background:var(--soft)}
.chapter .media img{width:100%;height:100%;object-fit:cover}
.chapter .k{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
.chapter .k b{color:var(--red);margin-right:8px}
.chapter h3{font-size:clamp(24px,3vw,38px);line-height:1.12;letter-spacing:-.02em;margin:0 0 16px;font-weight:800}
.chapter p{margin:0;color:#2b313a;font-size:clamp(16px,1.3vw,18px);max-width:48ch}
.panel{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:clamp(20px,3vw,36px);margin-bottom:20px}
.panel h4{margin:0 0 18px;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.gal{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.gal button{padding:0;border:0;background:var(--soft);border-radius:12px;overflow:hidden;cursor:zoom-in;aspect-ratio:4/3}
.gal button img{width:100%;height:100%;object-fit:cover;transition:transform .4s}.gal button:hover img{transform:scale(1.05)}
.equip{columns:3 240px;column-gap:32px}
.equip section{break-inside:avoid;margin-bottom:22px}
.equip h5{margin:0 0 8px;font-size:14px;font-weight:800}
.equip ul{margin:0;padding:0;list-style:none;font-size:14.5px;color:#2b313a}
.equip li{padding:5px 0 5px 20px;position:relative;border-bottom:1px solid #f0f3f8}
.equip li:before{content:"";position:absolute;left:2px;top:13px;width:8px;height:8px;border-radius:2px;background:var(--red);transform:rotate(45deg) scale(.7)}
.loc{display:flex;gap:12px;align-items:center;font-weight:600;color:#2b313a}
.loc svg{flex:none;width:22px;height:22px;color:var(--red)}
.block{padding:clamp(48px,7vw,104px) 0 0}
.block>.wrap>h2{font-size:clamp(28px,4vw,48px);letter-spacing:-.025em;margin:0 0 28px;font-weight:800;line-height:1.05}
.tbl{overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:var(--r)}
table{border-collapse:collapse;width:100%;min-width:720px;font-size:15px}
th,td{text-align:left;padding:14px 18px;border-bottom:1px solid var(--line);vertical-align:top}
thead th{font-size:15px;position:sticky;top:0;background:#fff}
thead th small{display:block;color:var(--red);font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800}
tbody th{color:var(--muted);font-weight:600;font-size:13.5px;width:24%;position:sticky;left:0;background:#fff}
td.best{font-weight:800}td.best:after{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--red);margin-left:8px;vertical-align:middle}
tr.total td{font-size:18px;font-weight:800}
.tick{color:var(--ink);font-weight:800}.cross{color:#b3bac4}
.prices{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.pcard{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:26px;display:flex;flex-direction:column;gap:14px}
.pcard h3{margin:0;font-size:18px;line-height:1.25}.pcard h3 small{display:block;color:var(--red);font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;margin-bottom:6px}
.pcard dl{margin:0;display:grid;gap:10px;font-size:14.5px}
.pcard dl div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed var(--line);padding-bottom:10px}
.pcard dt{color:#2b313a}.pcard dd{margin:0;font-weight:700;white-space:nowrap}
.pcard .tot{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-top:4px}
.pcard .tot strong{font-size:24px;letter-spacing:-.02em;white-space:nowrap}.pcard .tot span{font-size:12.5px;color:var(--muted);max-width:14ch}
.fxnote{color:var(--muted);font-size:13px;margin:18px 0 0}
.none{margin-top:28px;display:flex;justify-content:center}
.none button{background:none;border:0;font:inherit;font-weight:700;color:var(--muted);text-decoration:underline;text-underline-offset:4px;cursor:pointer;padding:12px}
.done{background:var(--navy);color:#fff}
.done .wrap{padding-top:40px;padding-bottom:40px}
.done h2{margin:0 0 18px;font-size:clamp(22px,3vw,32px);letter-spacing:-.02em}
.done ol{margin:0;padding-left:20px;color:rgba(255,255,255,.8);display:grid;gap:6px}
footer{margin-top:clamp(64px,8vw,120px);background:var(--navy);color:rgba(255,255,255,.66);font-size:13.5px}
footer .wrap{padding-top:48px;padding-bottom:48px;display:grid;grid-template-columns:1.2fr 1fr;gap:32px}
footer strong{color:#fff}footer p{margin:0 0 10px}
dialog{border:0;border-radius:22px;padding:0;max-width:min(560px,calc(100vw - 24px));width:100%;box-shadow:0 40px 80px -30px rgba(0,0,0,.5)}
dialog::backdrop{background:rgba(11,11,13,.6);backdrop-filter:blur(4px)}
.sheet{padding:28px}.sheet h3{margin:0 0 6px;font-size:22px;letter-spacing:-.01em}.sheet p{margin:0 0 20px;color:var(--muted)}
.sheet label{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}
.sheet input,.sheet textarea,.sheet select{width:100%;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid var(--line);border-radius:12px;background:#fff}
.sheet input:focus,.sheet textarea:focus,.sheet select:focus{outline:0;border-color:var(--ink)}
.sheet .chk{display:flex;gap:10px;align-items:flex-start;font-weight:500;font-size:14px;color:#2b313a;margin-top:18px}
.sheet .chk input{width:20px;height:20px;flex:none;margin-top:2px;accent-color:var(--red)}
.sheet .row{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap}
.lb{max-width:min(1200px,96vw);background:#000}
.lb img{width:100%;max-height:82vh;object-fit:contain}
.lb .bar{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;color:#fff;font-size:14px}
.lb button{background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;width:44px;height:44px;font-size:20px;cursor:pointer}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}html{scroll-behavior:auto}}
@media (max-width:980px){
 .hero .wrap{grid-template-columns:1fr}.contact{align-self:stretch}
 .cards{grid-template-columns:repeat(3,minmax(82%,1fr));overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;margin:0 calc(var(--pad) * -1);padding-left:var(--pad);padding-right:var(--pad);scrollbar-width:none}
 .cards::-webkit-scrollbar{display:none}.card{scroll-snap-align:center}
 .chapter,.chapter:nth-child(even){grid-template-columns:1fr}.chapter:nth-child(even) .media{order:0}
 .prices{grid-template-columns:1fr}
 .gal{grid-template-columns:repeat(3,1fr)}
 footer .wrap{grid-template-columns:1fr}
 .car-hero{aspect-ratio:auto;min-height:0}.car-hero img{aspect-ratio:4/3;opacity:1}.car-hero:after{display:none}
 .car-hero .cap{position:static;background:var(--navy);padding:22px 20px 24px}.car-hero .cta{align-items:flex-start}
}
@media (max-width:420px){.card .acts{grid-template-columns:1fr}.top small{display:none}}
`;

const ICON = {
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`,
  wa: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z"/><path d="M9 10c0 3 2 5 5 5l1-1.5-2-1-1 .8c-1-.4-1.8-1.2-2.3-2.3l.8-1-1-2z"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
};

function bestIdx(values: (number | null | undefined)[], mode: "min" | "max"): number {
  const v = values.map((x) => (x == null ? null : x));
  const nums = v.filter((x): x is number => x != null);
  if (nums.length < 2 || nums.every((n) => n === nums[0])) return -1;
  const target = mode === "min" ? Math.min(...nums) : Math.max(...nums);
  return v.indexOf(target);
}

export function renderOffer(o: PublicOffer, s: OfferState): string {
  const L = t(o.language);
  const initials = o.contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  const chosen = s.chosenCid ? o.cars.find((c) => c.cid === s.chosenCid) : null;
  const base = `/ajanlat/auto/${encodeURIComponent(s.token)}`;
  const carTitle = (c: PublicCar) => `${c.make} ${c.model}`;

  const card = (c: PublicCar) => `
  <article class="card reveal" ${chosen?.cid === c.cid ? "data-chosen" : ""} data-car="${c.slot}">
    <div class="ph"><img src="${esc(c.images[0])}" alt="${esc(c.title)}" width="800" height="500" ${c.slot > 1 ? 'loading="lazy"' : 'fetchpriority="high"'}></div>
    <div class="bd">
      <span class="chosen-tag">${L.chosenBadge}</span>
      ${c.positioning ? `<div class="pos">${esc(c.positioning)}</div>` : ""}
      <h2>${esc(carTitle(c))}<span>${esc(c.variant || "")}</span></h2>
      <dl class="specs">
        <div><dt>${L.rows.year}</dt><dd>${ym(c.first_registration)}</dd></div>
        <div><dt>${L.rows.km}</dt><dd>${c.km.toLocaleString("hu-HU")} km</dd></div>
        <div><dt>${L.rows.power}</dt><dd>${c.power_kw} kW / ${ps(c.power_kw)} LE</dd></div>
        <div><dt>${c.range_km ? L.rows.range.split(" (")[0] : L.rows.fuel}</dt><dd>${c.range_km ? c.range_km + " km" : L.fuel[c.fuel] || c.fuel}</dd></div>
      </dl>
      <div class="price"><span class="big">≈ ${huf(c.total_huf)}</span><span class="eur">≈ ${eur(c.total_eur)}</span><small>${L.totalLabel}</small></div>
      <div class="acts">
        <a class="btn btn-line" href="#auto-${c.slot}">${L.details}</a>
        ${s.expired ? "" : `<button class="btn btn-red choose-btn" data-choose="${c.cid}" data-title="${esc(c.title)}">${L.choose}</button>`}
      </div>
    </div>
  </article>`;

  const chapter = (c: PublicCar, sec: Section, i: number) => `
  <div class="chapter reveal">
    <div class="media"><img src="${esc(c.images[sec.image_index] || c.images[0])}" alt="${esc(c.title)} – ${esc(sec.headline)}" loading="lazy" width="1200" height="900"></div>
    <div>
      ${sec.headline && !sec.headline.startsWith(sectionLabel(sec.key, o.language))
        ? `<div class="k"><b>${String(i + 1).padStart(2, "0")}</b>${esc(sectionLabel(sec.key, o.language))}</div><h3>${esc(sec.headline)}</h3>`
        : `<div class="k"><b>${String(i + 1).padStart(2, "0")}</b></div><h3>${esc(sec.headline || sectionLabel(sec.key, o.language))}</h3>`}
      <p>${esc(sec.body)}</p>
    </div>
  </div>`;

  const carSection = (c: PublicCar) => `
  <section class="car" id="auto-${c.slot}" data-track="car_viewed" data-car="${c.slot}">
    <div class="wrap">
      <div class="car-hero reveal">
        <img src="${esc(c.images[0])}" alt="${esc(c.title)}" loading="lazy" width="1600" height="900">
        <div class="cap">
          <div>
            <div class="num"><b>0${c.slot}</b> / 0${o.cars.length}${c.positioning ? " · " + esc(c.positioning).toUpperCase() : ""}</div>
            <h2>${esc(carTitle(c))}</h2>
            <p>${esc(c.variant || "")}${c.variant ? " · " : ""}${ym(c.first_registration)} · ${c.km.toLocaleString("hu-HU")} km · ${c.power_kw} kW</p>
          </div>
          <div class="cta">
            <span class="big">≈ ${huf(c.total_huf)}</span><small>${L.totalLabel}</small>
            ${s.expired ? "" : `<button class="btn btn-red choose-btn" data-choose="${c.cid}" data-title="${esc(c.title)}">${L.choose}</button>`}
          </div>
        </div>
      </div>
      <div class="story">${c.sections.map((sec, i) => chapter(c, sec, i)).join("")}</div>
      <div class="panel reveal"><h4>${L.gallery}</h4>
        <div class="gal">${c.images.map((u, i) => `<button type="button" data-lb="${c.slot}" data-i="${i}" aria-label="${L.gallery} ${i + 1}"><img src="${esc(u)}" alt="" loading="lazy" width="400" height="300"></button>`).join("")}</div>
      </div>
      <div class="panel reveal"><h4>${L.equipment} · ${c.equipment_count}</h4>
        <div class="equip">${Object.entries(c.equipment).map(([cat, items]) => `<section><h5>${esc(cat)}</h5><ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>`).join("")}</div>
      </div>
      <div class="panel reveal"><div class="loc">${ICON.pin}<span>${esc(L.location(c.city, Math.round(c.distance_km)))}</span></div></div>
    </div>
  </section>`;

  // comparison rows
  const cars = o.cars;
  const row = (label: string, vals: string[], best = -1, cls = "") =>
    `<tr class="${cls}"><th scope="row">${label}</th>${vals.map((v, i) => `<td class="${i === best ? "best" : ""}">${v}</td>`).join("")}</tr>`;
  const cmp = [
    row(L.rows.total, cars.map((c) => `≈ ${huf(c.total_huf)}`), bestIdx(cars.map((c) => c.total_huf), "min"), "total"),
    row(L.rows.year, cars.map((c) => ym(c.first_registration)), bestIdx(cars.map((c) => Date.parse(c.first_registration + "-01")), "max")),
    row(L.rows.km, cars.map((c) => `${c.km.toLocaleString("hu-HU")} km`), bestIdx(cars.map((c) => c.km), "min")),
    row(L.rows.power, cars.map((c) => `${c.power_kw} kW / ${ps(c.power_kw)} LE`), bestIdx(cars.map((c) => c.power_kw), "max")),
    row(L.rows.fuel, cars.map((c) => L.fuel[c.fuel] || c.fuel)),
    cars.some((c) => c.range_km) ? row(L.rows.range, cars.map((c) => (c.range_km ? `${c.range_km} km` : "–")), bestIdx(cars.map((c) => c.range_km), "max")) : "",
    cars.some((c) => c.battery_kwh) ? row(L.rows.battery, cars.map((c) => (c.battery_kwh ? `${String(c.battery_kwh).replace(".", ",")} kWh` : "–"))) : "",
    row(L.rows.gearbox, cars.map((c) => L.gear[c.gearbox] || c.gearbox)),
    row(L.rows.drive, cars.map((c) => (c.drivetrain ? L.drive[c.drivetrain] : "–"))),
    row(L.rows.color, cars.map((c) => esc(c.color || "–"))),
    row(L.rows.owners, cars.map((c) => (c.previous_owners != null ? String(c.previous_owners) : "–")), bestIdx(cars.map((c) => c.previous_owners), "min")),
    row(L.rows.accident, cars.map((c) => (c.accident_free ? L.yes : c.accident_free === false ? L.no : "–"))),
    row(L.rows.equipCount, cars.map((c) => String(c.equipment_count)), bestIdx(cars.map((c) => c.equipment_count), "max")),
    ...o.wanted_equipment.map((w) => row(esc(w), cars.map((c) => (c.key_equipment.includes(w) ? `<span class="tick">✓</span>` : `<span class="cross">–</span>`)))),
  ].join("");

  const priceCard = (c: PublicCar) => `
  <div class="pcard reveal">
    <h3><small>0${c.slot}${c.positioning ? " · " + esc(c.positioning) : ""}</small>${esc(c.title)}</h3>
    <dl>${c.customer_lines.map((x) => `<div><dt>${esc(x.label)}</dt><dd>≈ ${huf(x.amount_huf)}</dd></div>`).join("")}</dl>
    <div class="tot"><span>${L.totalLabel}</span><strong>≈ ${huf(c.total_huf)}</strong></div>
    ${s.expired ? "" : `<button class="btn btn-red choose-btn" data-choose="${c.cid}" data-title="${esc(c.title)}">${L.choose}</button>`}
  </div>`;

  const doneBlock = s.done === "chosen" && chosen
    ? `<section class="done" id="kesz"><div class="wrap"><h2>${esc(L.thanks(chosen.title))}</h2><ol>${L.next.map((n: string) => `<li>${n}</li>`).join("")}</ol></div></section>`
    : s.done === "none" ? `<section class="done"><div class="wrap"><h2>${L.noneThanks}</h2></div></section>` : "";

  const expiredBlock = s.expired
    ? `<section class="done"><div class="wrap"><h2>${L.expired}</h2><p style="color:rgba(255,255,255,.75);margin:0 0 18px">${L.expiredBody}</p>
       <a class="btn btn-red" href="tel:${esc(o.contact.phone.replace(/\s/g, ""))}">${ICON.phone}${esc(o.contact.phone)}</a></div></section>`
    : "";

  return `<!doctype html><html lang="${o.language}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">
<title>${esc(L.eyebrow)} · Caradvance</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap&subset=latin-ext" rel="stylesheet">
<style>${CSS}</style></head>
<body class="${chosen ? "has-choice" : ""}">
${s.test || s.preview ? `<div class="testbar">${s.test ? "TESZT KÖRNYEZET" : "ELŐNÉZET"}${s.test && s.preview ? " · ELŐNÉZET" : ""} · ${s.test ? "nem valós ajánlat" : "csak a munkatársak látják"}</div>` : ""}
<header class="top"><div class="wrap">
  <a href="https://www.caradvance.hu/" aria-label="Caradvance"><img class="logo" src="https://www.caradvance.hu/caradvance-logo.webp" alt="Caradvance" width="91" height="30"></a>
  <small>${L.eyebrow} · ${esc(o.offer_no)}</small>
</div></header>
${doneBlock}${expiredBlock}
<section class="hero"><div class="wrap">
  <div>
    <div class="eyebrow"><b>●</b> ${L.eyebrow} · ${esc(o.offer_no)}</div>
    <h1>${esc(L.hello(o.first_name))}</h1>
    <p class="lead">${L.intro}</p>
    <ul class="chips">${o.chips.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
  </div>
  <aside class="contact">
    <div class="who"><div class="avatar">${esc(initials)}</div><div><strong>${esc(o.contact.name)}</strong><span>${esc(o.contact.title)}</span></div></div>
    <div class="btns">
      <a class="btn btn-red" href="tel:${esc(o.contact.phone.replace(/\s/g, ""))}">${ICON.phone}${esc(o.contact.phone)}</a>
      <a class="btn btn-ghost" href="${esc(o.contact.whatsapp)}" rel="noopener">${ICON.wa}WhatsApp</a>
    </div>
    <div class="valid"><span>${L.valid}: <strong style="color:#fff">${esc(o.valid_until)}</strong></span><a href="mailto:${esc(o.contact.email)}">${esc(o.contact.email)}</a></div>
  </aside>
</div></section>
<section class="overview"><div class="wrap"><div class="cards">${cars.map(card).join("")}</div></div></section>
<nav class="subnav" aria-label="Navigáció"><div class="wrap">
  ${cars.map((c) => `<a href="#auto-${c.slot}" data-nav="auto-${c.slot}"><b>0${c.slot}</b>${esc(carTitle(c))}${c.variant ? " " + esc(c.variant.split(" ")[0]) : ""}</a>`).join("")}
  <a href="#osszehasonlitas" data-nav="osszehasonlitas">${L.compare}</a><a href="#arak" data-nav="arak">${L.prices}</a>
</div></nav>
${cars.map(carSection).join("")}
<section class="block" id="osszehasonlitas"><div class="wrap">
  <h2 class="reveal">${L.compare}</h2>
  <div class="tbl reveal"><table><thead><tr><th></th>${cars.map((c) => `<th><small>0${c.slot}${c.positioning ? " · " + esc(c.positioning) : ""}</small>${esc(c.title)}</th>`).join("")}</tr></thead><tbody>${cmp}</tbody></table></div>
</div></section>
<section class="block" id="arak"><div class="wrap">
  <h2 class="reveal">${L.prices}</h2>
  <div class="prices">${cars.map(priceCard).join("")}</div>
  <p class="fxnote">${esc(L.fx(o.fx.rate.toFixed(2).replace(".", ","), o.fx.date))}</p>
  ${chosen || s.expired ? "" : `<div class="none"><button type="button" id="noneBtn">${L.none}</button></div>`}
</div></section>
<footer><div class="wrap">
  <div><p><strong>BH Group Zrt.</strong> · Caradvance Magyarország</p>
  <p>4143 Vekerd, Petőfi utca 23. · Cégjegyzékszám: 09-10-000660 · Adószám: 32488447-2-09</p>
  <p>${esc(o.contact.email)} · ${esc(o.contact.phone)}</p></div>
  <div><p>${L.disclaimer}</p><p>${esc(L.fx(o.fx.rate.toFixed(2).replace(".", ","), o.fx.date))}</p></div>
</div></footer>

<dialog id="chooseDlg"><form class="sheet" method="post" action="${base}/choose">
  <h3 id="chooseTitle"></h3><p>${L.chooseLead}</p>
  <input type="hidden" name="cid" id="chooseCid">
  <label for="f-name">${L.name}</label><input id="f-name" name="name" required autocomplete="name" value="${esc(o.customer_name)}">
  <label for="f-phone">${L.phone}</label><input id="f-phone" name="phone" required autocomplete="tel" inputmode="tel">
  <label for="f-cb">${L.callback}</label><select id="f-cb" name="callback">${L.cb.map((x: string) => `<option>${x}</option>`).join("")}</select>
  <label for="f-msg">${L.message}</label><textarea id="f-msg" name="message" rows="3"></textarea>
  <label class="chk"><input type="checkbox" name="consent" value="1" required><span>${L.consent}</span></label>
  <div class="row"><button type="button" class="btn btn-line" data-close>${L.cancel}</button><button class="btn btn-red">${L.choose}</button></div>
</form></dialog>
<dialog id="noneDlg"><form class="sheet" method="post" action="${base}/none">
  <h3>${L.none}</h3><p>${L.noneBody}</p>
  <label for="n-msg">${L.message.split(" (")[0]}</label><textarea id="n-msg" name="message" rows="4" required></textarea>
  <div class="row"><button type="button" class="btn btn-line" data-close>${L.cancel}</button><button class="btn btn-red">${L.send}</button></div>
</form></dialog>
<dialog id="lb" class="lb"><img id="lbImg" alt=""><div class="bar"><button type="button" id="lbPrev" aria-label="Előző">‹</button><span id="lbCount"></span><button type="button" id="lbNext" aria-label="Következő">›</button><button type="button" data-close aria-label="Bezárás">×</button></div></dialog>

<script nonce="${s.nonce}">
(()=>{const G=${JSON.stringify(Object.fromEntries(cars.map((c) => [c.slot, c.images])))};const P=${s.preview ? "true" : "false"};
const beacon=(type,data)=>{if(P)return;try{navigator.sendBeacon("${base}/ev",new Blob([JSON.stringify({type,data})],{type:"application/json"}))}catch(e){}};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -8% 0px"});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
const seen=new Set();const nav=[...document.querySelectorAll("[data-nav]")];
const so=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const id=e.target.id;nav.forEach(a=>a.classList.toggle("on",a.dataset.nav===id));
 if(e.target.dataset.track&&!seen.has(id)){seen.add(id);beacon("car_viewed",{car:e.target.dataset.car})}}),{rootMargin:"-45% 0px -50% 0px"});
document.querySelectorAll("section[id]").forEach(s=>so.observe(s));
let depth=0;addEventListener("scroll",()=>{const d=(scrollY+innerHeight)/document.body.scrollHeight;for(const m of[.5,.9])if(d>=m&&depth<m){depth=m;beacon("scroll",{depth:m})}},{passive:true});
const dlg=document.getElementById("chooseDlg");
document.querySelectorAll("[data-choose]").forEach(b=>b.addEventListener("click",()=>{document.getElementById("chooseCid").value=b.dataset.choose;document.getElementById("chooseTitle").textContent=b.dataset.title;beacon("choose_open",{cid:b.dataset.choose});dlg.showModal()}));
const nb=document.getElementById("noneBtn");if(nb)nb.addEventListener("click",()=>document.getElementById("noneDlg").showModal());
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close()}));
const lb=document.getElementById("lb"),img=document.getElementById("lbImg"),cnt=document.getElementById("lbCount");let cur=[],ix=0;
const show=()=>{img.src=cur[ix];cnt.textContent=(ix+1)+" / "+cur.length};
document.querySelectorAll("[data-lb]").forEach(b=>b.addEventListener("click",()=>{cur=G[b.dataset.lb];ix=+b.dataset.i;show();lb.showModal();beacon("gallery_open",{car:b.dataset.lb})}));
document.getElementById("lbPrev").onclick=()=>{ix=(ix-1+cur.length)%cur.length;show()};document.getElementById("lbNext").onclick=()=>{ix=(ix+1)%cur.length;show()};
lb.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")document.getElementById("lbPrev").click();if(e.key==="ArrowRight")document.getElementById("lbNext").click()});
if(P){document.querySelectorAll("form").forEach(f=>f.addEventListener("submit",e=>{e.preventDefault();alert("Előnézet: a küldés ki van kapcsolva.")}))}
})();
</script></body></html>`;
}

export function sectionLabel(key: string, lang: Lang): string {
  const hu: Record<string, string> = { design: "Design", interior: "Belső tér", performance: "Teljesítmény", technology: "Technológia", condition: "Állapot és előélet" };
  const de: Record<string, string> = { design: "Design", interior: "Innenraum", performance: "Leistung", technology: "Technologie", condition: "Zustand und Historie" };
  return (lang === "de" ? de : hu)[key] || key;
}

export function renderExpiredShell(lang: Lang, test: boolean) {
  const L = t(lang);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Caradvance</title><style>${CSS}</style></head><body>
${test ? `<div class="testbar">TESZT KÖRNYEZET</div>` : ""}
<section class="done" style="min-height:100vh;display:grid;place-items:center"><div class="wrap"><h2>${L.expired}</h2>
<p style="color:rgba(255,255,255,.75)">${L.expiredBody}</p><a class="btn btn-red" href="tel:+36302336060">+36 30 233 6060</a></div></section></body></html>`;
}
