/**
 * Weboldali űrlapok → belső CRM (ügyfél + adatlap), mezőről mezőre, szövegértelmezés nélkül.
 *  - /auto-rendeles/ (import autókeresés, KeresoForm): Import ügyfél + Ajánlatmotor-igény a pontos keresési adatokkal
 *  - /autoink/#berelheto és a /berelheto-auto/… oldalak bérlési űrlapja: Bérlés ügyfél, a választott autóval az adatlapon
 * Hívja: functions/api/lead.js (a Notion / e-mail kézbesítés mellett, háttérben).
 */
import type { Env, Requirements, Fuel } from "./types";
import { heuristicExtract } from "./extract";
import { processRequest } from "./engine";
import { ensureAm, logEvent, nowIso } from "./am";
import { ensureCrm, saveCard, addEvent, aboFleet } from "../crm.js";

type Form = Record<string, unknown>;
const s = (v: unknown, max = 300) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const g = (d: Form, ...keys: string[]) => { for (const k of keys) { const v = s(d[k], 2000); if (v) return v; } return ""; };
const any = (v: string) => !!v && !/^(mindegy|any|egal|egyéb|-)$/i.test(v);

export function webLeadKind(d: Form): "import" | "berles" | null {
  const t = g(d, "Típus", "type", "form").toLowerCase();
  if (/bérl|berl|abo|rent|miet/.test(t)) return "berles";
  if (!t && g(d, "Márka")) return "import"; // KeresoForm (/auto-rendeles/)
  return null;
}

function nums(v: string) { return (v.match(/\d[\d\s.]*/g) || []).map((x) => parseInt(x.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n)); }
/** "2020 – 2023", "? – 2023", "2020 – ?" */
function range(v: string): [number | undefined, number | undefined] {
  if (!v) return [undefined, undefined];
  const [a, b] = v.split(/[–-]/).map((x) => nums(x)[0]);
  return [a || undefined, b || undefined];
}

const FUEL: Record<string, Fuel> = { benzin: "petrol", "dízel": "diesel", dizel: "diesel", hibrid: "hybrid", "plug-in hibrid": "phev", elektromos: "electric" };
const BODY: Record<string, string> = { "ferdehátú": "hatchback", sedan: "sedan", limuzin: "sedan", kombi: "estate", "coupé": "coupe", coupe: "coupe", "kabrió": "convertible", suv: "suv", "terepjáró": "suv", "egyterű": "van", pickup: "pickup" };

export function formRequirements(d: Form): Requirements {
  const make = g(d, "Márka"), model = g(d, "Modell"), code = g(d, "Típusjel");
  const notes = g(d, "Megjegyzés");
  // a felszereltség (és összkerék, teljesítmény) a szabad szöveges megjegyzésből
  const h = heuristicExtract(notes || " ");
  const [yMin, yMax] = range(g(d, "Évjárat"));
  const [kMin, kMax] = range(g(d, "Futásteljesítmény"));
  const budget = g(d, "Költségkeret (max)");
  const bn = nums(budget)[0] || 0;
  const eur = /€|eur/i.test(budget);
  const fuel = g(d, "Üzemanyag").toLowerCase(), body = g(d, "Karosszéria").toLowerCase(), gear = g(d, "Váltó").toLowerCase();
  const company = g(d, "Cégnév");
  const vat = g(d, "Vásárlás módja (ÁFA)");
  const ext = g(d, "Külső szín"), int = g(d, "Belső szín");
  const missing: string[] = [];
  if (!any(make) && !any(body)) missing.push("márka/modell vagy karosszéria");
  if (!bn) missing.push("keret");
  const summary = [make, any(model) && !/^egyéb/i.test(model) ? model : "", code, yMin || yMax ? `${yMin || "?"}–${yMax || "?"}` : "", kMax ? `max. ${kMax.toLocaleString("hu-HU")} km` : "", any(fuel) ? fuel : "", any(gear) ? gear : "", budget ? "keret: " + budget : ""].filter(Boolean).join(", ");
  return {
    customer: { name: g(d, "Név", "Kapcsolattartó") || undefined, email: g(d, "E-mail").toLowerCase() || undefined, phone: g(d, "Telefon") || undefined, language: "hu", company: company || undefined },
    vehicle: {
      makes: any(make) ? [make] : [],
      models: any(model) && !/^egyéb/i.test(model) ? [model] : code ? [code] : [],
      body_types: BODY[body] ? [BODY[body]] : [],
      fuel: FUEL[fuel] ? [FUEL[fuel]] : [],
      gearbox: /automat/.test(gear) ? "automatic" : /manu|kézi/.test(gear) ? "manual" : undefined,
      year_min: yMin, year_max: yMax, km_min: kMin, km_max: kMax,
      power_kw_min: h.vehicle.power_kw_min,
      budget_huf_max: bn && !eur ? bn : undefined, budget_eur_max: bn && eur ? bn : undefined, budget_is_total_delivered: true,
      must_have_equipment: h.vehicle.must_have_equipment, nice_to_have_equipment: h.vehicle.nice_to_have_equipment,
      colors_preferred: [ext].filter(any), colors_excluded: [],
      drivetrain: h.vehicle.drivetrain,
      vat_deductible_needed: /cég|nettó/i.test(vat) || !!company || undefined,
    } as Requirements["vehicle"],
    urgency: [g(d, "Mikorra kell"), g(d, "Meddig keressünk")].filter(Boolean).join(" · ") || undefined,
    notes: [notes, any(int) ? "Belső szín: " + int : "", g(d, "Ár rugalmassága") ? "Ár rugalmassága: " + g(d, "Ár rugalmassága") : "", g(d, "Fizetés") ? "Fizetés: " + g(d, "Fizetés") : "",
      g(d, "Finanszírozás konstrukció") ? `Finanszírozás: ${g(d, "Finanszírozás konstrukció")} ${g(d, "Futamidő (hó)")} hó, önerő ${g(d, "Önerő")}, havi ${g(d, "Havi keret")}` : ""].filter(Boolean).join("\n") || undefined,
    raw_summary: ("Weboldali autórendelés: " + summary).slice(0, 280),
    confidence: 1,
    missing_critical_fields: missing,
    flags: ["Weboldali űrlapból (/auto-rendeles/) — a keresési adatok pontosak, nem értelmezettek."],
  };
}

function formText(d: Form) {
  return Object.entries(d).filter(([k, v]) => !/^(_|turnstile|ca_attr|fbp|fbc|user_agent|event_id|mkt_consent|website|url_field)/.test(k) && s(v)).map(([k, v]) => `${k}: ${s(v, 1000)}`).join("\n");
}

async function recentDup(env: Env, line: string, email: string, phone: string) {
  if (!email && !phone) return null;
  return env.DB.prepare(`SELECT id FROM deals WHERE line = ? AND ((? <> '' AND lower(email) = ?) OR (? <> '' AND phone = ?)) AND created_at > datetime('now', '-15 minutes') ORDER BY id DESC LIMIT 1`)
    .bind(line, email, email, phone, phone).first<{ id: number }>();
}

/** Új ügyfél a CRM-ben a weboldali űrlapból. Idempotens az event_id-re (am_requests.message_id = web:<event_id>) és 15 percen belüli ismétlésre. */
export async function webLeadToCrm(env: Env, d: Form, ctx: { eventId: string; page: string; origin?: string }): Promise<{ dealId: number; line: string } | null> {
  const kind = webLeadKind(d);
  if (!kind || !env.DB) return null;
  await ensureCrm(env);
  const name = s(g(d, "Név", "Kapcsolattartó") || [g(d, "Vezetéknév"), g(d, "Keresztnév")].join(" ") || "Webes érdeklődő", 160);
  const email = s(g(d, "E-mail", "email"), 160).toLowerCase();
  const phone = s(g(d, "Telefon", "phone"), 60);
  const company = s(g(d, "Cégnév"), 200);
  const line = kind === "import" ? "Import" : "Bérlés";
  if (await recentDup(env, line, email, phone)) return null;
  const text = formText(d);

  if (kind === "import") {
    await ensureAm(env);
    const msgId = "web:" + ctx.eventId;
    if (await env.DB.prepare("SELECT deal_id FROM am_requests WHERE message_id = ?").bind(msgId).first()) return null;
    const req = formRequirements(d);
    const car = [req.vehicle.makes[0], req.vehicle.models[0]].filter(Boolean).join(" ");
    const res = await env.DB.prepare(`INSERT INTO deals (line, stage, ch, name, phone, email, car, price, note, when_text, assigned_to)
        VALUES ('Import', 'Érdeklődés', 'Weboldal', ?, ?, ?, ?, ?, ?, ?, NULL)`)
      .bind(name, phone, email, s(car, 160), req.vehicle.budget_huf_max || Math.round((req.vehicle.budget_eur_max || 0) * 400), s("Weboldal (/auto-rendeles/): " + req.raw_summary, 2000), s(g(d, "Mikorra kell"), 80) || "most").run();
    const dealId = Number(res.meta.last_row_id);
    await saveCard(env, dealId, {
      status: req.missing_critical_fields.length ? "Kapcsolatfelvételre vár" : "Ajánlatra vár",
      address: s(g(d, "Város", "Székhely"), 300),
      data: {
        kind: company ? "ceg" : "magan",
        person: { name, address: s(g(d, "Város"), 300), phone, email, tax: "" },
        company: { name: company, address: s(g(d, "Székhely"), 300), tax: s(g(d, "Adószám"), 60), reg: "" },
        contact_differs: false, contact: { name: "", phone: "", email: "", role: "" },
        vehicle: { brand: req.vehicle.makes[0] || "", model: req.vehicle.models[0] || "" },
        request: text.slice(0, 4000), notes: "",
      },
    }, null, "Weboldal");
    const now = nowIso();
    await env.DB.prepare(`INSERT INTO am_requests (deal_id, status, source, message_id, from_email, subject, body_text, requirements_json, meta_json, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(dealId, "NEW", "manual", msgId, email || null, "Weboldali autórendelés", text.slice(0, 50000), JSON.stringify(req), JSON.stringify({ engine: "webform", page: ctx.page }), now, now).run();
    await logEvent(env, dealId, "weboldal", "created", { source: "webform", page: ctx.page });
    await addEvent(env, dealId, "create", `Weboldali autórendelés (/auto-rendeles/): ${req.raw_summary.replace(/^Weboldali autórendelés: /, "")}`, "Weboldal");
    await processRequest(env, dealId, "weboldal", ctx.origin);
    return { dealId, line };
  }

  // Bérlés: a kiválasztott autó az adatlap „Autók” fülére kerül
  const car = s(g(d, "Autó", "car"), 160);
  const priceTxt = g(d, "Becsült havidíj");
  // pl. "≈ 510 000 Ft/hó-tól 1367 €/hó-tól · bruttó" → az euró összeg (a bérleti díjak euróban vannak), különben a forint
  const amt = (txt: string, unit: RegExp) => { const m = txt.match(new RegExp("(\\d[\\d\\s.\u00a0\u202f]*)(?:[–-]\\s*\\d[\\d\\s.\u00a0\u202f]*)?\\s*" + unit.source, "i")); return m ? parseInt(m[1].replace(/\D/g, ""), 10) || 0 : 0; };
  const pe = amt(priceTxt, /(€|eur)/), ph = amt(priceTxt, /(ft|huf)/);
  const price = pe || ph || nums(priceTxt)[0] || 0;
  const cur = pe ? "EUR" : "HUF";
  const parts = car.split(" ");
  const brand = /^(Mercedes-Benz|Land Rover|Range Rover|Alfa Romeo|Aston Martin)/i.test(car) ? car.match(/^(\S+ \S+)/)![1] : parts[0] || "";
  let img = s(g(d, "Kép"), 500);
  if (img && img.startsWith("/")) img = (ctx.origin || "https://www.caradvance.hu") + img;
  if (img && !/^https:\/\//.test(img)) img = "";
  const months = nums(g(d, "Futamidő"))[0] || 0;
  // kívánt kezdés (pl. "2026-11-12" vagy "2026. 11. 12.") → a bérlet kezdete; a futamidőből a vége
  const dm = g(d, "Elérhetőség", "Kezdés").match(/(20\d\d)[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
  const start = dm ? `${dm[1]}-${dm[2].padStart(2, "0")}-${dm[3].padStart(2, "0")}` : "";
  const addMonths = (iso: string, n: number) => { const [y, m, dd] = iso.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1 + n, dd)); return t.toISOString().slice(0, 10); };
  // a weboldali flotta-kártya (abo-fleet.json) adatai: kulcs, fotó, modell-oldal — így az ajánlatkészítő is felismeri
  const nk = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\bvw\b/g, "volkswagen").replace(/[^a-z0-9]+/g, " ").trim();
  let fl: any = null;
  try { fl = (await aboFleet()).find((x: any) => nk(x.title) === nk(car)) || null; } catch { fl = null; }
  if (fl && !img) img = fl.image || "";
  const vehicle = {
    id: "v1", source: "web", key: fl ? fl.key : "", title: car, brand, model: car.slice(brand.length).trim(), year: "", vin: "", plate: "", ad_id: "", config_code: "",
    color: s(g(d, "Szín"), 80), engine: "", fuel: s(g(d, "Üzemanyag"), 60), km: s(g(d, "Km-keret"), 60), condition: "", body: "", gearbox: "", hybrid: /hibrid|hybrid|phev/i.test(g(d, "Üzemanyag")),
    price, currency: cur, period: "hó", deposit: cur === "EUR" ? amt(g(d, "Kaució"), /(€|eur)/) || amt(g(d, "Kaució"), /(ft|huf)/) : amt(g(d, "Kaució"), /(ft|huf)/) || amt(g(d, "Kaució"), /(€|eur)/), image: img, url: fl && fl.url ? fl.url : /^https:\/\//.test(ctx.page) ? s(ctx.page, 500) : "",
    rent_start: start, rent_end: start && months ? addMonths(start, months) : "", reminders: [], months,
  };
  const res = await env.DB.prepare(`INSERT INTO deals (line, stage, ch, name, phone, email, car, price, note, when_text, assigned_to)
      VALUES ('Bérlés', 'Érdeklődés', 'Weboldal', ?, ?, ?, ?, ?, ?, ?, NULL)`)
    .bind(name, phone, email, car, cur === "HUF" ? price : Math.round(price * 400), s([priceTxt && "Becsült havidíj: " + priceTxt, g(d, "Futamidő") && "Futamidő: " + g(d, "Futamidő"), g(d, "Km-keret") && "Km-keret: " + g(d, "Km-keret"), g(d, "Megjegyzés")].filter(Boolean).join(" · "), 2000), s(g(d, "Elérhetőség"), 80) || "most").run();
  const dealId = Number(res.meta.last_row_id);
  // az autó még nem kerül az adatlap „Autók” fülére: előbb ajánlat megy ki — az ajánlatkészítő ezzel az autóval nyílik meg
  // (ha az ügyfél az ajánlatban elfogadja, a meglévő folyamat teszi át az Autók fülre)
  const pickNote = [g(d, "Futamidő") && "Futamidő: " + g(d, "Futamidő"), g(d, "Km-keret") && "Km-keret: " + g(d, "Km-keret"), g(d, "Szín") && "Szín: " + g(d, "Szín"),
    g(d, "Felszereltség") && "Kivitel: " + g(d, "Felszereltség"), start && "Kezdés: " + start].filter(Boolean).join(" · ");
  const webPick = car ? { key: vehicle.key || "web-" + dealId, src: "inv", title: car, brand, year: "2026", km: "0 km", fuel: vehicle.fuel, power: "", gearbox: "", color: vehicle.color,
    image: img, url: vehicle.url, price, currency: cur, period: "hó", deposit: vehicle.deposit, note: s(pickNote, 400), months, rent_start: start, rent_end: vehicle.rent_end, at: nowIso() } : null;
  await saveCard(env, dealId, {
    status: car ? "Ajánlatra vár" : "Kapcsolatfelvételre vár",
    data: {
      kind: company || /cég/i.test(g(d, "Vásárló")) ? "ceg" : "magan",
      person: { name, address: "", phone, email, tax: "" },
      company: { name: company, address: "", tax: s(g(d, "Adószám"), 60), reg: "" },
      contact_differs: false, contact: { name: "", phone: "", email: "", role: "" },
      vehicles: [], web_pick: webPick, request: text.slice(0, 4000), notes: "",
    },
  }, null, "Weboldal");
  await addEvent(env, dealId, "create", `Weboldali bérlési igény: ${car}${priceTxt ? " — " + priceTxt : ""}${g(d, "Futamidő") ? " · " + g(d, "Futamidő") : ""}`, "Weboldal");
  return { dealId, line };
}
