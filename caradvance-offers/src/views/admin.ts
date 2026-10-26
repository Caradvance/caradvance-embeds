import { esc } from "../lib/util";
import { fmtEur, fmtHuf } from "../lib/costs";
import { STATUS_LABEL, type Status } from "../lib/status";
import type { CarView, CandidateRow, RequestRow } from "../lib/engine";
import type { Listing, Requirements } from "../types";
import { equipHu } from "../lib/ai/describe";
import { sectionLabel } from "./offer";
import { unverifiedPaths, type RateConfig } from "../lib/rates";

const CSS = `
:root{--navy:#0B0B0D;--red:#E2001A;--bg:#F4F7FB;--line:#E3E9F2;--muted:#5d6672;--ok:#0f7b3f;--warn:#fff3b0;--warnline:#e6c200}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--navy);font:14px/1.5 "Plus Jakarta Sans",system-ui,sans-serif}
a{color:inherit}header{background:var(--navy);color:#fff}header .w{display:flex;gap:24px;align-items:center;height:56px}
header nav a{color:rgba(255,255,255,.75);text-decoration:none;font-weight:700;margin-right:16px}header nav a:hover{color:#fff}
header .env{margin-left:auto;background:#ffd84d;color:#111;font-weight:800;font-size:12px;padding:3px 10px;border-radius:999px}
.w{max-width:1440px;margin:0 auto;padding:0 20px}
h1{font-size:24px;margin:24px 0 4px;letter-spacing:-.01em}h2{font-size:16px;margin:0 0 12px}h3{font-size:15px;margin:0 0 8px}
.muted{color:var(--muted)}.small{font-size:12.5px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:16px}
.grid{display:grid;grid-template-columns:minmax(320px,.8fr) 2.2fr;gap:20px;align-items:start}
.slots{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:1200px){.grid{grid-template-columns:1fr}.slots{grid-template-columns:1fr}}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.chip{display:inline-block;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700;background:#eef2f8}
.chip.NEEDS_REVIEW,.chip.NO_MATCH{background:#ffe9b0}.chip.READY{background:#d7f5e3}.chip.PUBLISHED,.chip.VIEWED{background:#dbe8ff}
.chip.CHOSEN{background:var(--navy);color:#fff}.chip.REJECTED,.chip.EXPIRED,.chip.CLOSED{background:#e7e9ee;color:#777}
.btn{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
.btn:hover{border-color:var(--navy)}.btn.red{background:var(--red);border-color:var(--red);color:#fff}.btn.dark{background:var(--navy);border-color:var(--navy);color:#fff}
.btn[disabled]{opacity:.45;cursor:not-allowed}
input,select,textarea{font:inherit;border:1.5px solid var(--line);border-radius:10px;padding:7px 10px;background:#fff;width:100%}
textarea{font-family:ui-monospace,Menlo,monospace;font-size:12.5px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.flag{background:var(--warn);border:1px solid var(--warnline);border-radius:10px;padding:8px 12px;margin:6px 0;font-size:13px}
.unv input{background:var(--warn);border-color:var(--warnline)}
tr.unv td{background:#fffbe2}
.ok{color:var(--ok);font-weight:700}
.thumb{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;background:#eef2f8}
.slot-empty{border:2px dashed var(--line);border-radius:14px;padding:24px;text-align:center;color:var(--muted)}
.pre{white-space:pre-wrap;font-size:13px;background:#f7f9fc;border-radius:10px;padding:12px;max-height:320px;overflow:auto}
.total{font-size:20px;font-weight:800}.kv{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:13px}
.kv dt{color:var(--muted)}.kv dd{margin:0;font-weight:600}
.msg{background:#e6f7ee;border:1px solid #9fd8b7;border-radius:10px;padding:10px 14px;margin-top:16px;font-weight:600}
.msg.err{background:#fde8ea;border-color:#f3a5ae}
details summary{cursor:pointer;font-weight:700}
.lockbar{display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:10px}
table.costs{table-layout:fixed}table.costs td{padding:6px 6px}table.costs input{padding:5px 6px;font-size:12.5px}
.kv dd{overflow-wrap:anywhere}
`;

export function adminLayout(title: string, body: string, opts: { test: boolean; msg?: string | null; err?: string | null }) {
  return `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)} · Ajánlatmotor</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap&subset=latin-ext" rel="stylesheet">
<style>${CSS}</style></head><body>
<header><div class="w"><strong>Caradvance Ajánlatmotor</strong>
<nav><a href="/admin">Beérkezett igények</a><a href="/admin/new">Új igény</a><a href="/admin/settings">Díjak és beállítások</a><a href="/admin/settings/extension">Chrome bővítmény</a></nav>
${opts.test ? `<span class="env">TESZT</span>` : ""}</div></header>
<main class="w">${opts.msg ? `<div class="msg">${esc(opts.msg)}</div>` : ""}${opts.err ? `<div class="msg err">${esc(opts.err)}</div>` : ""}${body}</main></body></html>`;
}

const ago = (iso: string) => {
  const h = (Date.now() - Date.parse(iso)) / 36e5;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} perce` : h < 48 ? `${Math.round(h)} órája` : `${Math.round(h / 24)} napja`;
};

export function inboxPage(rows: (RequestRow & { name?: string })[], test: boolean) {
  const body = `<h1>Beérkezett igények</h1><p class="muted">Válaszidő-cél: 24 óra. A pirossal jelölt igények ennél régebbiek és még nincs kiküldött ajánlat.</p>
  ${test ? `<form method="post" action="/admin/test/inbound" class="row" style="margin:12px 0"><button class="btn dark">Demó e-mail szimulálása (BMW i5 Touring)</button>
  <span class="muted small">Teszt: egy valósághű ügyfél-e-mailt küld át a teljes folyamaton.</span></form>` : ""}
  <div class="card" style="padding:0"><table><thead><tr><th>Állapot</th><th>Ügyfél</th><th>Igény</th><th>Forrás</th><th>Érkezett</th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => {
    const req: Requirements | null = r.requirements_json ? JSON.parse(r.requirements_json) : null;
    const late = ["NEW", "SEARCHING", "NEEDS_REVIEW", "NO_MATCH", "READY"].includes(r.status) && Date.now() - Date.parse(r.created_at) > 864e5;
    return `<tr><td><span class="chip ${r.status}">${STATUS_LABEL[r.status as Status] || r.status}</span></td>
    <td><a href="/admin/r/${r.id}"><strong>${esc(req?.customer.name || r.from_email || "ismeretlen")}</strong></a><div class="muted small">${esc(r.from_email || "")}</div></td>
    <td>${esc(req?.raw_summary?.slice(0, 140) || r.subject || "")}</td><td>${esc(r.source)}</td>
    <td style="${late ? "color:var(--red);font-weight:700" : ""}">${ago(r.created_at)}</td></tr>`;
  }).join("") : `<tr><td colspan="5" class="muted" style="padding:24px">Még nincs igény.</td></tr>`}
  </tbody></table></div>`;
  return body;
}

export function newLeadPage() {
  return `<h1>Új igény kézzel</h1><p class="muted">Telefonos, WhatsApp-os vagy személyes megkereséshez. Ugyanazon a folyamaton megy végig, mint az e-mail.</p>
  <form method="post" action="/admin/new" class="card" style="max-width:760px">
  <label>Ügyfél neve</label><input name="name"><br><br>
  <label>E-mail</label><input name="email" type="email"><br><br>
  <label>Megkeresés szövege / jegyzet</label><textarea name="text" rows="10" required style="font-family:inherit;font-size:14px"></textarea><br><br>
  <button class="btn red">Igény rögzítése és keresés</button></form>`;
}

function costTable(cv: CarView) {
  const c = cv.costs;
  const ov = cv.overrides.lines || {};
  return `<table class="small costs"><colgroup><col><col style="width:92px"><col style="width:104px"></colgroup><tbody>
  ${c.lines.map((l) => `<tr class="${l.verified ? "" : "unv"}"><td>${esc(l.label)}${!l.verified ? `<div class="small" style="color:#8a6d00">ELLENŐRIZNI 2026${l.note ? " · " + esc(l.note.replace(/^TESZT ÉRTÉK – ELLENŐRIZNI 2026:?\s*/, "")) : ""}</div>` : ""}${l.source === "override" ? ` <span class="chip">kézi</span>` : ""}</td>
  <td class="${l.verified ? "" : "unv"}"><input type="number" name="line_${l.key}" value="${ov[l.key] ?? ""}" placeholder="${l.amount_huf}" step="1000"></td>
  <td style="text-align:right;font-weight:700;white-space:nowrap">${fmtHuf(l.amount_huf)}</td></tr>`).join("")}
  <tr><td>Belső költség</td><td></td><td style="text-align:right">${fmtHuf(c.internal_cost_huf)}</td></tr>
  <tr><td><strong>Árrés (kerekítéssel)</strong></td><td></td><td style="text-align:right;font-weight:800">${fmtHuf(c.margin_huf)}</td></tr>
  </tbody></table>
  <div class="row" style="margin-top:8px">
   <label class="small">Logisztika <select name="logistics_mode"><option value="">alapértelmezett</option>
     <option value="trailer" ${cv.overrides.logistics_mode === "trailer" ? "selected" : ""}>tréler</option>
     <option value="driver" ${cv.overrides.logistics_mode === "driver" ? "selected" : ""}>sofőr + ideiglenes rendszám</option></select></label>
   <label class="small">Környezetvédelmi oszt. (NAV oszlop) <select name="env_group"><option value="">automatikus</option>
     ${[[0, "5E/5Z mentes"], [1, "1: 14 felett + 2020 után / hibrid"], [2, "2: 14 felett"], [3, "3: 12–14"], [4, "4: 9–11"], [5, "5: 8 vagy rosszabb"]]
       .map(([v, t]) => `<option value="${v}" ${cv.overrides.env_group === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
  </div>`;
}

function slotCard(cv: CarView, published: boolean) {
  const l = cv.listing;
  const c = cv.candidate;
  const cid = c.id;
  const sections = cv.sections;
  const mock = l.url.startsWith("mock://");
  return `<div class="card">
  <div class="row" style="justify-content:space-between"><h2 style="margin:0">${c.slot}. autó ${c.positioning ? `<span class="chip">${esc(c.positioning)}</span>` : ""}</h2>
   <span class="muted small">pont: <strong>${c.score ?? "–"}</strong> · forrás: ${esc(c.source)}</span></div>
  <img class="thumb" src="${esc(l.images[0] || "")}" alt="" style="margin:10px 0">
  <h3>${esc(l.title)}</h3>
  <div class="muted small">${mock ? "TESZTHIRDETÉS (mock)" : `<a href="${esc(l.url)}" target="_blank" rel="noopener">mobile.de hirdetés ↗</a>`} · ${esc(l.seller.name)} · ${esc(l.seller.city)} · <strong>${Math.round(cv.distanceKm)} km</strong> Budapesttől (${cv.distanceMethod === "ors" ? "útvonal" : "becslés"})</div>
  <dl class="kv" style="margin:10px 0"><dt>Első forg.</dt><dd>${l.first_registration}</dd><dt>Km</dt><dd>${l.km.toLocaleString("hu-HU")}</dd>
   <dt>Teljesítmény</dt><dd>${l.power_kw} kW</dd><dt>Ár</dt><dd>${fmtEur(l.price_gross_eur)} bruttó${l.price_net_eur ? ` · ${fmtEur(l.price_net_eur)} nettó` : ""} ${l.vat_reclaimable ? "(ÁFA visszaigényelhető)" : ""}</dd>
   <dt>Felszereltség</dt><dd>${l.equipment.length} tétel</dd></dl>
  <div class="small">${esc(c.rationale || "")}</div>
  ${cv.costs.warnings.map((w) => `<div class="flag">${esc(w)}</div>`).join("")}
  <form method="post" action="/admin/c/${cid}/overrides" style="margin-top:10px">${costTable(cv)}
   <div class="lockbar"><div><div class="muted small">Ügyfél végösszeg</div><div class="total">≈ ${fmtHuf(cv.costs.customer_total_huf)}</div>
   <div class="muted small">≈ ${fmtEur(cv.costs.customer_total_eur)} · 1 € = ${cv.costs.fx.rate.toFixed(2)} Ft (${esc(cv.costs.fx.date)})</div></div>
   <button class="btn" ${published ? "disabled" : ""}>Díjak mentése</button></div></form>
  <details style="margin-top:10px"><summary>Ügyfélnek látható bontás</summary><table class="small">${cv.costs.customer_lines.map((x) => `<tr><td>${esc(x.label)}</td><td style="text-align:right">${fmtHuf(x.amount_huf)}</td></tr>`).join("")}</table></details>
  <details style="margin-top:10px" ${sections ? "" : "open"}><summary>Leírás (${sections ? "kész" : "hiányzik"})</summary>
   ${sections ? `<form method="post" action="/admin/c/${cid}/sections">${sections.map((s, i) => `<label class="small"><strong>${esc(sectionLabel(s.key, "hu"))}</strong> · kép #${s.image_index + 1}</label>
     <input name="h_${i}" value="${esc(s.headline)}"><textarea name="b_${i}" rows="4" style="font-family:inherit;font-size:13px;margin:4px 0 10px">${esc(s.body)}</textarea>
     <input type="hidden" name="k_${i}" value="${esc(s.key)}"><input type="hidden" name="i_${i}" value="${s.image_index}">`).join("")}
     <div class="row"><button class="btn" ${published ? "disabled" : ""}>Leírás mentése</button></div></form>` : ""}
   <form method="post" action="/admin/c/${cid}/describe" style="margin-top:8px"><button class="btn" ${published ? "disabled" : ""}>${sections ? "Újragenerálás" : "Leírás generálása"}</button></form>
  </details>
  <form method="post" action="/admin/c/${cid}/lock" class="lockbar"><span>${c.locked ? `<span class="ok">✓ Zárolva</span>` : `<span class="muted">Nincs zárolva</span>`}</span>
   <button class="btn ${c.locked ? "" : "dark"}" name="locked" value="${c.locked ? 0 : 1}" ${published ? "disabled" : ""}>${c.locked ? "Feloldás" : "Zárolás"}</button></form>
  </div>`;
}

export function requestPage(o: {
  row: RequestRow; req: Requirements | null; cars: CarView[]; runners: CandidateRow[]; rejected: CandidateRow[];
  blockers: string[]; offers: { token: string; status: string; published_at: string; expires_at: string; first_viewed_at: string | null; chosen_candidate_id: string | null }[];
  events: { actor: string; type: string; from_status: string | null; to_status: string | null; at: string; data_json: string | null }[];
  baseUrl: string; extraction: any;
}) {
  const { row, req } = o;
  const published = ["PUBLISHED", "VIEWED", "CHOSEN", "CLOSED"].includes(row.status);
  const bySlot = new Map(o.cars.map((c) => [c.candidate.slot, c]));
  const slotHtml = [1, 2, 3].map((n) => {
    const cv = bySlot.get(n);
    if (cv) return slotCard(cv, published);
    return `<div class="slot-empty"><strong>${n}. hely üres</strong><p>Válassz a tartalékok közül, vagy adj hozzá mobile.de linket.</p></div>`;
  }).join("");
  const runnerRow = (c: CandidateRow, rejected = false) => {
    const l: Listing = JSON.parse(c.listing_json);
    return `<tr><td><strong>${esc(l.title)}</strong><div class="muted small">${esc(l.seller.city)} · ${l.first_registration} · ${l.km.toLocaleString("hu-HU")} km · ${fmtEur(l.price_gross_eur)}</div></td>
    <td>${c.score ?? "–"}</td><td class="small">${esc(c.rationale || "")}</td>
    <td>${published ? "" : `<form method="post" action="/admin/c/${c.id}/slot" class="row">${[1, 2, 3].map((n) => `<button class="btn" name="slot" value="${n}">→ ${n}</button>`).join("")}</form>`}${rejected ? "" : ""}</td></tr>`;
  };
  const ready = !o.blockers.length;
  const flags = [...(req?.flags || []), ...(req?.missing_critical_fields.length ? ["Hiányzó adatok: " + req.missing_critical_fields.join(", ")] : [])];

  return `<div class="row" style="justify-content:space-between;align-items:flex-end">
  <div><h1>${esc(req?.customer.name || row.from_email || "Ismeretlen ügyfél")} <span class="chip ${row.status}">${STATUS_LABEL[row.status as Status] || row.status}</span></h1>
  <div class="muted">${esc(row.from_email || "")} · ${esc(row.source)} · ${new Date(row.created_at).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })} · kinyerés: ${esc(o.extraction?.engine || "–")}</div></div>
  <div class="row">
   <form method="post" action="/admin/r/${row.id}/search"><button class="btn" ${published ? "disabled" : ""}>Keresés újrafuttatása</button></form>
   <form method="post" action="/admin/r/${row.id}/describe"><button class="btn" ${published ? "disabled" : ""}>Mindhárom leírás generálása</button></form>
   <a class="btn" href="/admin/r/${row.id}/preview" target="_blank">Előnézet ↗</a>
   <form method="post" action="/admin/r/${row.id}/publish"><button class="btn red" ${ready && !published ? "" : "disabled"}>Ajánlat közzététele</button></form>
  </div></div>
  ${o.blockers.length && !published ? `<div class="flag"><strong>Közzététel előtt:</strong> ${o.blockers.map(esc).join(" · ")}</div>` : ""}
  ${o.offers.map((of) => `<div class="msg">Ügyfél-link: <a href="${esc(o.baseUrl)}/o/${esc(of.token)}" target="_blank">${esc(o.baseUrl)}/o/${esc(of.token)}</a> · ${esc(of.status)} · lejár: ${new Date(of.expires_at).toLocaleDateString("hu-HU")}${of.first_viewed_at ? " · megnyitva: " + new Date(of.first_viewed_at).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" }) : ""}</div>`).join("")}
  <div class="grid" style="margin-top:18px">
  <div>
   <div class="card"><h2>Eredeti megkeresés</h2><div class="small muted">${esc(row.subject || "")}</div><div class="pre">${esc(row.body_text || "")}</div></div>
   ${flags.map((f) => `<div class="flag">${esc(f)}</div>`).join("")}
   ${row.search_note ? `<div class="card small"><strong>Keresés:</strong> ${esc(row.search_note)}</div>` : ""}
   ${row.clarify_draft ? `<div class="card"><h2>Pontosító válasz (tervezet)</h2><div class="pre">${esc(row.clarify_draft)}</div></div>` : ""}
   <div class="card"><h2>Kinyert igény</h2><p class="small muted">Szerkeszthető. Mentés után a keresés újra lefut (zárolt autók maradnak).</p>
    <form method="post" action="/admin/r/${row.id}/requirements"><textarea name="json" rows="22">${esc(JSON.stringify(req, null, 2))}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn dark" ${published ? "disabled" : ""}>Mentés és keresés</button></div></form></div>
   <div class="card"><h2>Napló</h2><table class="small">${o.events.map((e) => `<tr><td class="muted">${new Date(e.at).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}</td><td>${esc(e.actor)}</td><td>${esc(e.type)}${e.to_status ? ` ${esc(e.from_status || "")} → <strong>${esc(e.to_status)}</strong>` : ""}</td></tr>`).join("")}</table></div>
  </div>
  <div>
   <div class="slots">${slotHtml}</div>
   ${published ? "" : `<div class="card"><h2>Autó hozzáadása mobile.de linkkel</h2>
   <form method="post" action="/admin/r/${row.id}/add" class="row"><input name="url" placeholder="https://suchen.mobile.de/fahrzeuge/details.html?id=… (tesztben: 1001…3001)" style="flex:1;min-width:280px">
   <select name="target" style="width:auto"><option value="runner">Tartalék</option><option value="1">1. hely</option><option value="2">2. hely</option><option value="3">3. hely</option></select>
   <button class="btn dark">Hozzáadás</button></form><p class="small muted">A Chrome bővítmény ugyanide küldi az autókat, egy kattintással a mobile.de oldaláról.</p></div>`}
   <div class="card"><h2>Tartalékok (${o.runners.length})</h2><table><thead><tr><th>Autó</th><th>Pont</th><th>Indoklás</th><th></th></tr></thead><tbody>
   ${o.runners.map((c) => runnerRow(c)).join("") || `<tr><td colspan="4" class="muted">Nincs tartalék.</td></tr>`}</tbody></table></div>
   <details class="card"><summary>Kiesett hirdetések (${o.rejected.length})</summary><table><tbody>${o.rejected.map((c) => runnerRow(c, true)).join("")}</tbody></table></details>
  </div></div>`;
}

export function settingsPage(o: { version: number; rates: RateConfig; history: { version: number; author: string; note: string | null; created_at: string }[]; contact: any }) {
  const r = o.rates;
  const unv = new Set(unverifiedPaths(r));
  const item = (path: string, label: string, value: string, note?: string) => `<tr class="${unv.has(path) ? "unv" : ""}">
   <td><strong>${esc(label)}</strong>${note ? `<div class="small muted">${esc(note)}</div>` : ""}</td><td>${value}</td>
   <td>${unv.has(path) ? `<label class="row small"><input type="checkbox" name="confirm" value="${path}" style="width:auto"> megerősítem</label>` : `<span class="ok">✓ megerősítve</span>`}</td></tr>`;
  return `<h1>Díjak és beállítások</h1><p class="muted">Aktuális verzió: v${o.version}. Minden mentés új verziót hoz létre; a kiküldött ajánlatok a saját verziójukat tartják meg.
  Sárga = ELLENŐRIZNI 2026. Megerősítetlen díjjal nem lehet ajánlatot közzétenni.</p>
  <form method="post" action="/admin/settings" class="card"><h2>Ellenőrzendő tételek</h2><table><tbody>
  ${item("regado", "Regisztrációs adó tábla", "NAV 2026.01.01 tábla, 7 kW-sáv × 5 osztály, korkedvezménnyel", r.regado.source)}
  ${item("illetek", "Vagyonszerzési illeték (Ft/kW)", r.illetek.huf_per_kw.map((x) => x.join(" / ")).join(" · "), r.illetek.note)}
  ${item("illetek.electric_exempt", "Elektromos autó illetékmentes", r.illetek.electric_exempt.v ? "igen" : "nem", r.illetek.electric_exempt.note)}
  ${Object.entries(r.fees).map(([k, f]) => item(`fees.${k}`, { eredetiseg: "Eredetiségvizsgálat", muszaki: "Műszaki vizsga", forgalomba: "Forgalomba helyezés + okmányok", rendszam: "Rendszám" }[k] || k, fmtHuf(f.v), f.note)).join("")}
  ${item("logistics", "Logisztika", `tréler: ${r.logistics.trailer_bands_eur.map(([k, e]) => `≤${k >= 99999 ? "∞" : k} km: ${e} €`).join(", ")} · sofőr: ${r.logistics.driver_eur_per_km} €/km + ${r.logistics.driver_fixed_eur} € + rendszám ${r.logistics.export_plates_eur} €`, r.logistics.note)}
  ${item("ugyintezes", "Ügyintézési díj", fmtHuf(r.ugyintezes.v), r.ugyintezes.note)}
  ${item("margin", "Árrés", `${(r.margin.pct * 100).toFixed(1)}%, min. ${fmtHuf(r.margin.min_huf)}`, r.margin.note)}
  </tbody></table>
  <h2 style="margin-top:20px">Teljes konfiguráció (JSON)</h2><p class="small muted">Itt írhatod át a számokat. Ha egy értéket módosítasz, az megerősítetlen marad, amíg fent nem pipálod.</p>
  <textarea name="json" rows="24">${esc(JSON.stringify(r, null, 2))}</textarea>
  <div class="row" style="margin-top:10px"><input name="note" placeholder="Mi változott? (kötelező)" required style="max-width:420px"><button class="btn red">Mentés új verzióként</button></div></form>
  <form method="post" action="/admin/settings/contact" class="card"><h2>Kapcsolattartó az ajánlatokon</h2>
  <div class="row">${["name", "title", "phone", "whatsapp", "email"].map((k) => `<label style="flex:1;min-width:180px" class="small">${k}<input name="${k}" value="${esc(o.contact[k] || "")}"></label>`).join("")}</div>
  <div class="row" style="margin-top:10px"><button class="btn">Mentés</button></div></form>
  <div class="card"><h2>Verziók</h2><table class="small">${o.history.map((h) => `<tr><td>v${h.version}</td><td>${esc(h.author)}</td><td>${esc(h.note || "")}</td><td class="muted">${new Date(h.created_at).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}</td></tr>`).join("")}</table></div>`;
}

export function extensionPage(tokens: { id: string; user: string; created_at: string; last_used_at: string | null; revoked_at: string | null }[], newToken?: string | null, baseUrl?: string) {
  return `<h1>Chrome bővítmény (Caradvance Sourcing)</h1>
  <p class="muted">Minden felhasználó saját tokent kap. A token csak egyszer látszik; a bővítmény beállításaiba kell bemásolni a szerver címével együtt.</p>
  ${newToken ? `<div class="msg">Új token (most másold ki, többet nem látszik):<br><code style="font-size:15px;user-select:all">${esc(newToken)}</code><br>Szerver címe: <code>${esc(baseUrl || "")}</code></div>` : ""}
  <form method="post" action="/admin/settings/extension" class="card row"><input name="user" placeholder="Felhasználó (pl. Tóth Károly)" required style="max-width:320px"><button class="btn red">Token létrehozása</button></form>
  <div class="card" style="padding:0"><table><thead><tr><th>Felhasználó</th><th>Létrehozva</th><th>Utoljára használva</th><th></th></tr></thead><tbody>
  ${tokens.map((t) => `<tr><td>${esc(t.user)}</td><td>${new Date(t.created_at).toLocaleString("hu-HU")}</td><td>${t.last_used_at ? new Date(t.last_used_at).toLocaleString("hu-HU") : "–"}</td>
  <td>${t.revoked_at ? `<span class="muted">visszavonva</span>` : `<form method="post" action="/admin/settings/extension/${t.id}/revoke"><button class="btn">Visszavonás</button></form>`}</td></tr>`).join("") || `<tr><td colspan="4" class="muted" style="padding:20px">Még nincs token.</td></tr>`}
  </tbody></table></div>
  <div class="card"><h2>Telepítés (teszt)</h2><ol><li>Chrome → <code>chrome://extensions</code> → Fejlesztői mód be.</li><li>„Kicsomagolt bővítmény betöltése” → a repo <code>extension/</code> mappája.</li>
  <li>Bővítmény beállításai: szerver címe + token.</li><li>Nyiss meg egy mobile.de hirdetést → „Küldés az ajánlatba”.</li></ol></div>`;
}

export function equipLabel(e: string) { return equipHu(e).hu; }
