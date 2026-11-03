import { esc } from "./am";
import { fmtEur, fmtHuf } from "./costs";
import { STATUS_LABEL, type Status } from "./status";
import type { CarView, CandidateRow, RequestRow, DealRow } from "./engine";
import type { Listing, Requirements } from "./types";
import { equipHu } from "./describe";
import { sectionLabel } from "./offer-view";
import { unverifiedPaths, type RateConfig } from "./rates";
import { MOBILE_IDS, FUEL_CODE, BODY_CODE, FEATURE_CODE, AS24, as24Slug, portalOf } from "./sources";

const CSS = `
:root{--navy:#161922;--red:#E2001A;--bg:#F6F7FB;--line:#ECEEF2;--muted:#6b7280;--ok:#128a63;--warn:#fff3b0;--warnline:#e6c200}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--navy);font:14px/1.5 "Plus Jakarta Sans",system-ui,sans-serif}
a{color:inherit}header{background:#0b0b0d;color:#fff;position:sticky;top:0;z-index:20}header .w{display:flex;gap:18px;align-items:center;min-height:58px;flex-wrap:wrap}
header img{height:26px;width:auto;display:block}header nav{display:flex;gap:4px;flex-wrap:wrap}
header nav a{color:rgba(255,255,255,.72);text-decoration:none;font-weight:700;padding:7px 11px;border-radius:9px}header nav a:hover,header nav a.on{color:#fff;background:rgba(255,255,255,.1)}
header .me{color:rgba(255,255,255,.6);font-size:12.5px}header .back{color:rgba(255,255,255,.72);font-weight:700;text-decoration:none;font-size:13px}
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

export interface LayoutOpts { test: boolean; msg?: string | null; err?: string | null; user: { name: string; role: string }; active?: string }

export function adminLayout(title: string, body: string, opts: LayoutOpts) {
  const B = "/belso/ajanlatmotor";
  const nav: [string, string, string][] = [["igenyek", `${B}/`, "Igények"], ["uj", `${B}/uj`, "Új igény"], ["bovitmeny", `${B}/bovitmeny`, "Chrome bővítmény"]];
  if (opts.user.role === "admin") nav.splice(2, 0, ["dijak", `${B}/dijak`, "Díjak és beállítások"]);
  return `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)} · Ajánlatmotor · CarAdvance</title>
<link rel="icon" href="https://www.caradvance.hu/favicon.ico?v=2">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap&subset=latin-ext" rel="stylesheet">
<style>${CSS}</style></head><body>
${opts.test ? `<div style="background:#ffd84d;color:#111;font-weight:800;font-size:12.5px;text-align:center;padding:5px">TESZT KÖRNYEZET · külön teszt-adatbázis, kitalált hirdetések, nem éles díjak</div>` : ""}
<header><div class="w"><a href="/belso/"><img src="/caradvance-logo-white.webp" alt="CarAdvance"></a><strong>Ajánlatmotor</strong>
<nav>${nav.map(([k, h, t]) => `<a href="${h}" class="${opts.active === k ? "on" : ""}">${t}</a>`).join("")}</nav>
<span style="flex:1"></span><span class="me">${esc(opts.user.name)}</span><a class="back" href="/belso/">← Belső felület</a></div></header>
<main class="w">${opts.msg ? `<div class="msg">${esc(opts.msg)}</div>` : ""}${opts.err ? `<div class="msg err">${esc(opts.err)}</div>` : ""}${body}</main></body></html>`;
}

const ago = (iso: string) => {
  const h = (Date.now() - Date.parse(iso)) / 36e5;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} perce` : h < 48 ? `${Math.round(h)} órája` : `${Math.round(h / 24)} napja`;
};

export type InboxRow = RequestRow & { deal_name: string | null; deal_email: string | null; assigned_name: string | null; card_status: string | null };

export function inboxPage(rows: InboxRow[], test: boolean) {
  return `<h1>Ajánlatmotor · igények</h1><p class="muted">Import-érdeklődések, amelyekhez a motor a mobile.de-ről és az AutoScout24-ről a három legjobb autót keresi. Válaszidő-cél: 24 óra; a piros időpontú igényeknél még nincs kiküldött ajánlat.</p>
  ${test ? `<form method="post" action="/belso/ajanlatmotor/teszt/demo" class="row" style="margin:12px 0"><button class="btn dark">Demó e-mail szimulálása (BMW i5 Touring)</button>
  <span class="muted small">Teszt: egy valósághű ügyfél-e-mailt visz végig a teljes folyamaton (ügyfél + adatlap + top 3).</span></form>` : ""}
  <div class="card" style="padding:0;overflow-x:auto"><table><thead><tr><th>Állapot</th><th>Ügyfél</th><th>Igény</th><th>Adatlap státusz</th><th>Felelős</th><th>Érkezett</th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => {
    const req: Requirements | null = r.requirements_json ? JSON.parse(r.requirements_json) : null;
    const late = ["NEW", "SEARCHING", "NEEDS_REVIEW", "NO_MATCH", "READY"].includes(r.status) && Date.now() - Date.parse(r.created_at) > 864e5;
    return `<tr><td><span class="chip ${r.status}">${STATUS_LABEL[r.status as Status] || r.status}</span></td>
    <td><a href="/belso/ajanlatmotor/igeny/${r.deal_id}"><strong>${esc(r.deal_name || req?.customer.name || r.from_email || "ismeretlen")}</strong></a><div class="muted small">${esc(r.deal_email || r.from_email || "")} · <a href="/belso/ugyfel/?id=${r.deal_id}">adatlap</a></div></td>
    <td>${esc(req?.raw_summary?.slice(0, 140) || r.subject || "")}</td><td class="small">${esc(r.card_status || "")}</td><td class="small">${esc(r.assigned_name || "—")}</td>
    <td style="${late ? "color:var(--red);font-weight:700" : ""}">${ago(r.created_at)}</td></tr>`;
  }).join("") : `<tr><td colspan="6" class="muted" style="padding:24px">Még nincs igény. E-mailből automatikusan érkeznek, vagy az „Új igény” menüben rögzíthetsz egyet.</td></tr>`}
  </tbody></table></div>`;
}

export function newLeadPage() {
  return `<h1>Új igény kézzel</h1><p class="muted">Telefonos, WhatsApp-os vagy személyes megkereséshez. Ugyanazon a folyamaton megy végig, mint az e-mail.</p>
  <form method="post" action="/belso/ajanlatmotor/uj" class="card" style="max-width:760px">
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

/** Melyik képek jelenjenek meg az ajánlatban és melyik legyen a borítókép (az eredeti hirdetés összes képe közül). */
function imagePicker(cid: string, l: any, published: boolean) {
  const all: string[] = Array.isArray(l.all_images) && l.all_images.length ? l.all_images : l.images || [];
  if (all.length < 2) return "";
  const shown = new Set<string>(l.images || []); const cover = (l.images || [])[0];
  return `<details class="imgpick" style="flex-basis:100%;margin:4px 0"><summary class="small" style="cursor:pointer;font-weight:700">Képek kiválasztása (${shown.size} / ${all.length}) — borítókép</summary>
  <form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/images" style="margin:8px 0 0">
   <div class="muted small" style="margin-bottom:6px">Pipáld be, mely képek jelenjenek meg az ajánlatban; a ★ a borítókép.</div>
   <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px">${all.map((u, i) => `<div style="border:1px solid var(--line,#e3e7ee);border-radius:8px;padding:4px;background:#fff">
    <img src="${esc(u)}" alt="" loading="lazy" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;display:block">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-top:3px"><label style="display:flex;gap:4px;align-items:center;margin:0"><input type="checkbox" name="keep" value="${i}" ${shown.has(u) ? "checked" : ""}> ${i + 1}.</label>
    <label title="Borítókép" style="display:flex;gap:3px;align-items:center;margin:0"><input type="radio" name="cover" value="${i}" ${u === cover ? "checked" : ""}>★</label></div></div>`).join("")}</div>
   <div class="row" style="margin-top:8px;gap:8px"><button class="btn" style="padding:5px 12px;font-size:12px" ${published ? "disabled" : ""}>Képek mentése</button>
    <button class="btn" style="padding:5px 12px;font-size:12px" name="all" value="1" ${published ? "disabled" : ""}>Összes kép vissza</button></div>
  </form></details>`;
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
  <img class="thumb" src="${esc(l.images[0] || "")}" alt="" style="margin:10px 0 4px">
  ${mock ? "" : `<div class="row" style="gap:6px;margin:0 0 8px;align-items:center">
   ${l.images.length > 1 ? `<form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/cover" style="margin:0"><button class="btn" style="padding:4px 10px;font-size:12px" type="submit">Másik borítókép ↻</button></form>` : ""}
   <form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/delete" style="margin:0;display:inline" onsubmit="return confirm('Biztosan törlöd ezt az autót az ajánlatmotor listájából?')"><button class="btn" style="padding:4px 10px;font-size:12px;color:#b8000f" title="Autó törlése a listából">🗑 Törlés</button></form>
   <form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/photos" style="margin:0"><button class="btn" style="padding:4px 10px;font-size:12px" type="submit">Fotók szűrése</button></form>
   ${imagePicker(cid, l, published)}
   <span class="muted small">${l.images.length} kép · ${(l as any).photos_checked ? `<span class="ok">✓ csak autófotó</span>${(l as any).photos_removed ? ` (${(l as any).photos_removed} kiszűrve)` : ""}` : `<span style="color:var(--red)">fotók nincsenek ellenőrizve</span>`}</span></div>`}
  <h3>${esc(l.title)}</h3>
  <div class="muted small">${mock ? "TESZTHIRDETÉS (mock)" : `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(portalOf(l.url).name || "Eredeti")} hirdetés ↗</a>`} · ${esc(l.seller.name)} · ${esc(l.seller.city)} · <strong>${Math.round(cv.distanceKm)} km</strong> Budapesttől (${cv.distanceMethod === "ors" ? "útvonal" : "becslés"})</div>
  <dl class="kv" style="margin:10px 0"><dt>Első forg.</dt><dd>${l.first_registration}</dd><dt>Km</dt><dd>${l.km.toLocaleString("hu-HU")}</dd>
   <dt>Teljesítmény</dt><dd>${l.power_kw} kW</dd><dt>Ár</dt><dd>${fmtEur(l.price_gross_eur)} bruttó${l.price_net_eur ? ` · ${fmtEur(l.price_net_eur)} nettó` : ""} ${l.vat_reclaimable ? "(ÁFA visszaigényelhető)" : ""}</dd>
   <dt>Felszereltség</dt><dd>${l.equipment.length} tétel</dd></dl>
  <div class="small">${esc(c.rationale || "")}</div>
  ${cv.costs.warnings.map((w) => `<div class="flag">${esc(w)}</div>`).join("")}
  <form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/overrides" style="margin-top:10px">${costTable(cv)}
   <div class="lockbar"><div><div class="muted small">Ügyfél végösszeg</div><div class="total">≈ ${fmtHuf(cv.costs.customer_total_huf)}</div>
   <div class="muted small">≈ ${fmtEur(cv.costs.customer_total_eur)} · 1 € = ${cv.costs.fx.rate.toFixed(2)} Ft (${esc(cv.costs.fx.date)})</div></div>
   <button class="btn" ${published ? "disabled" : ""}>Díjak mentése</button></div></form>
  <details style="margin-top:10px"><summary>Ügyfélnek látható bontás</summary><table class="small">${cv.costs.customer_lines.map((x) => `<tr><td>${esc(x.label)}</td><td style="text-align:right">${fmtHuf(x.amount_huf)}</td></tr>`).join("")}</table></details>
  <details style="margin-top:10px" ${sections ? "" : "open"}><summary>Leírás (${sections ? "kész" : "hiányzik"})</summary>
   ${sections ? `<form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/sections">${sections.map((s, i) => `<label class="small"><strong>${esc(sectionLabel(s.key, "hu"))}</strong> · kép #${s.image_index + 1}</label>
     <input name="h_${i}" value="${esc(s.headline)}"><textarea name="b_${i}" rows="4" style="font-family:inherit;font-size:13px;margin:4px 0 10px">${esc(s.body)}</textarea>
     <input type="hidden" name="k_${i}" value="${esc(s.key)}"><input type="hidden" name="i_${i}" value="${s.image_index}">`).join("")}
     <div class="row"><button class="btn" ${published ? "disabled" : ""}>Leírás mentése</button></div></form>` : ""}
   <form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/describe" style="margin-top:8px"><button class="btn" ${published ? "disabled" : ""}>${sections ? "Újragenerálás" : "Leírás generálása"}</button></form>
  </details>
  <form method="post" action="/belso/ajanlatmotor/jelolt/${cid}/lock" class="lockbar"><span>${c.locked ? `<span class="ok">✓ Zárolva</span>` : `<span class="muted">Nincs zárolva</span>`}</span>
   <button class="btn ${c.locked ? "" : "dark"}" name="locked" value="${c.locked ? 0 : 1}" ${published ? "disabled" : ""}>${c.locked ? "Feloldás" : "Zárolás"}</button></form>
  </div>`;
}

export function requestPage(o: {
  row: RequestRow; deal: DealRow; cardStatus: string; req: Requirements | null; cars: CarView[]; runners: CandidateRow[]; rejected: CandidateRow[];
  blockers: string[]; offers: { token: string; offer_no: string; published_at: string; expires_at: string; first_viewed_at: string | null; responded_at: string | null; action: string | null; choice: number | null; sent_to: string | null; sent: number }[];
  events: { actor: string; type: string; from_status: string | null; to_status: string | null; at: string; data_json: string | null }[];
  baseUrl: string; extraction: any; hasEmail: boolean; searchUrl?: string | null; searchMaxEur?: number;
}) {
  const { row, req } = o;
  const published = ["PUBLISHED", "VIEWED", "CHOSEN", "CLOSED"].includes(row.status);
  const bySlot = new Map(o.cars.map((c) => [c.candidate.slot, c]));
  const slotHtml = [1, 2, 3].map((n) => {
    const cv = bySlot.get(n);
    if (cv) return slotCard(cv, published);
    return `<div class="slot-empty"><strong>${n}. hely üres</strong><p>Válassz a tartalékok közül, vagy küldj be egy autót a Chrome bővítménnyel (mobile.de vagy AutoScout24).</p></div>`;
  }).join("");
  const runnerRow = (c: CandidateRow, rejected = false) => {
    const l: Listing = JSON.parse(c.listing_json);
    return `<tr><td><strong>${esc(l.title)}</strong><div class="muted small">${esc(l.seller.city)} · ${l.first_registration} · ${l.km.toLocaleString("hu-HU")} km · ${fmtEur(l.price_gross_eur)}</div></td>
    <td>${c.score ?? "–"}</td><td class="small">${esc(c.rationale || "")}</td>
    <td>${published ? "" : `<form method="post" action="/belso/ajanlatmotor/jelolt/${c.id}/slot" class="row">${[1, 2, 3].map((n) => `<button class="btn" name="slot" value="${n}">→ ${n}</button>`).join("")}</form>`}<form method="post" action="/belso/ajanlatmotor/jelolt/${c.id}/delete" style="margin:0;display:inline" onsubmit="return confirm('Biztosan törlöd ezt az autót az ajánlatmotor listájából?')"><button class="btn" style="padding:4px 10px;font-size:12px;color:#b8000f" title="Autó törlése a listából">🗑 Törlés</button></form></td></tr>`;
  };
  const ready = !o.blockers.length;
  const flags = [...(req?.flags || []), ...(req?.missing_critical_fields.length ? ["Hiányzó adatok: " + req.missing_critical_fields.join(", ")] : [])];

  const d = o.deal;
  const B = `/belso/ajanlatmotor/igeny/${row.deal_id}`;
  const answer = (of: (typeof o.offers)[number]) => of.action === "elfogad" ? `<b>választott: ${of.choice != null ? of.choice + 1 : "?"}. autó</b>` : of.action === "modosit" ? "<b>egyik sem tetszett</b>" : of.first_viewed_at ? "megnyitotta" : "még nem nyitotta meg";
  return `<div class="row" style="justify-content:space-between;align-items:flex-end">
  <div><h1>${esc(d.name || req?.customer.name || row.from_email || "Ismeretlen ügyfél")} <span class="chip ${row.status}">${STATUS_LABEL[row.status as Status] || row.status}</span></h1>
  <div class="muted">${esc(d.email || row.from_email || "")}${d.phone ? " · " + esc(d.phone) : ""} · adatlap: <b>${esc(o.cardStatus)}</b> · <a href="/belso/ugyfel/?id=${row.deal_id}" target="_blank">Ügyfél adatlap ↗</a> · forrás: ${esc(row.source)} · ${new Date(row.created_at).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })} · kinyerés: ${esc(o.extraction?.engine || "–")}</div></div>
  <div class="row">
   ${o.searchUrl && !published ? `<a class="btn red" href="#mdSearch" title="A keresési adatok ellenőrzése / módosítása, majd a mobile.de vagy AutoScout24 keresés megnyitása.">mobile.de / AutoScout24 keresés ↓</a>` : ""}
   <form method="post" action="${B}/search"><button class="btn" ${published ? "disabled" : ""}>Keresés újrafuttatása</button></form>
   ${o.cars.length ? `<form method="post" action="${B}/describe" title="Ahol még nincs leírás, ott elkészíti, majd mindhárom autót zárolja"><input type="hidden" name="missing" value="1"><input type="hidden" name="lock" value="1"><button class="btn dark" ${published ? "disabled" : ""}>Mindhárom: leírás + zárolás</button></form>` : ""}
   <form method="post" action="${B}/describe"><button class="btn" ${published ? "disabled" : ""}>Mindhárom leírás (újra)generálása</button></form>
   ${o.cars.length ? (() => { const all = o.cars.every((cv: any) => cv.candidate.locked); return `<form method="post" action="${B}/lock"><input type="hidden" name="locked" value="${all ? 0 : 1}"><button class="btn" ${published ? "disabled" : ""}>${all ? "Mindhárom feloldása" : "Mindhárom zárolása"}</button></form>`; })() : ""}
   <a class="btn dark" href="${B}/preview" target="_blank" title="Pontosan ez az oldal nyílik meg az ügyfélnek az e-mailből">Ajánlat megtekintése ↗</a>
   ${!published && o.cars.length ? `<a class="btn red" href="#kikuldes">Ajánlat kiküldése ↓</a>` : ""}
  </div></div>
  ${req && !published ? searchEditor(req, row.deal_id, o.searchMaxEur) : ""}
  ${o.blockers.length && !published ? `<div class="flag"><strong>Kiküldés előtt nézd át:</strong> ${o.blockers.map(esc).join(" · ")}</div>` : ""}
  ${!published && o.cars.length ? `<form method="post" action="${B}/publish" class="card" id="kikuldes" style="margin-top:14px">
    <h2 style="margin:0 0 4px">Ajánlat kiküldése</h2>
    <div class="small muted" style="margin-bottom:10px">${o.cars.length} autó (${o.cars.map((c) => c.candidate.slot + ".").join(", ")} hely) · az ügyfél e-mailben megkapja az autókat képpel, árral, sorszámmal és „Ezt választom” gombbal; a választott autó az ügyfél adatlapjára (Autók) kerül, az ajánlat és az autó sorszámával.</div>
    <div class="row" style="align-items:flex-start">
    <div style="flex:1;min-width:280px"><label class="small"><b>Kísérő üzenet az ügyfélnek</b> (nem kötelező)</label><textarea name="message" rows="3" style="font-family:inherit;font-size:13.5px"></textarea></div>
    <div style="display:grid;gap:8px;min-width:280px">
     <label class="row small"><input type="checkbox" name="send" value="1" style="width:auto" ${o.hasEmail ? "checked" : "disabled"}> küldés e-mailben ${o.hasEmail ? "az ügyfél címére" : "(nincs e-mail cím — a linket kézzel küldd)"}</label>
     ${o.blockers.filter((b) => !/hely még üres/.test(b)).length ? `<label class="row small" style="color:#a2660b"><input type="checkbox" name="force" value="1" style="width:auto" required> átnéztem a fenti figyelmeztetéseket, így is kiküldöm</label>` : ""}
     <div class="row"><a class="btn" href="${B}/preview" target="_blank">Megtekintés ↗</a><button class="btn red">Ajánlat kiküldése</button></div>
    </div></div></form>` : ""}
  ${o.offers.map((of) => `<div class="msg">${esc(of.offer_no || "")} · ügyfél-link: <a href="${esc(o.baseUrl)}/ajanlat/auto/${esc(of.token)}/" target="_blank">${esc(o.baseUrl)}/ajanlat/auto/${esc(of.token)}/</a>
    · ${of.sent ? "e-mail: " + esc(of.sent_to || "") : "nincs e-mailben elküldve, a linket kézzel küldd"} · lejár: ${new Date(of.expires_at).toLocaleDateString("hu-HU")} · ${answer(of)}</div>`).join("")}
  <div class="grid" style="margin-top:18px">
  <div>
   <div class="card"><h2>Eredeti megkeresés</h2><div class="small muted">${esc(row.subject || "")}</div><div class="pre">${esc(row.body_text || "")}</div></div>
   ${flags.map((f) => `<div class="flag">${esc(f)}</div>`).join("")}
   ${row.search_note ? `<div class="card small"><strong>Keresés:</strong> ${esc(row.search_note)}</div>` : ""}
   ${row.clarify_draft ? `<div class="card"><h2>Pontosító válasz (tervezet)</h2><div class="pre">${esc(row.clarify_draft)}</div></div>` : ""}
   <div class="card"><h2>Kinyert igény</h2><p class="small muted">Szerkeszthető. Mentés után a keresés újra lefut (zárolt autók maradnak).</p>
    <form method="post" action="/belso/ajanlatmotor/igeny/${row.deal_id}/requirements"><textarea name="json" rows="22">${esc(JSON.stringify(req, null, 2))}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn dark" ${published ? "disabled" : ""}>Mentés és keresés</button></div></form></div>
   <div class="card"><h2>Napló</h2><table class="small">${o.events.map((e) => `<tr><td class="muted">${new Date(e.at).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}</td><td>${esc(e.actor)}</td><td>${esc(e.type)}${e.to_status ? ` ${esc(e.from_status || "")} → <strong>${esc(e.to_status)}</strong>` : ""}</td></tr>`).join("")}</table></div>
  </div>
  <div>
   <div class="slots">${slotHtml}</div>
   ${published ? "" : `<div class="card"><h2>Autó hozzáadása mobile.de linkkel</h2>
   <form method="post" action="/belso/ajanlatmotor/igeny/${row.deal_id}/add" class="row"><input name="url" placeholder="https://suchen.mobile.de/fahrzeuge/details.html?id=… (tesztben: 1001…3001)" style="flex:1;min-width:280px">
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
  <form method="post" action="/belso/ajanlatmotor/dijak" class="card"><h2>Ellenőrzendő tételek</h2><table><tbody>
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
  <form method="post" action="/belso/ajanlatmotor/dijak/kapcsolat" class="card"><h2>Kapcsolattartó az ajánlatokon</h2>
  <div class="row">${["name", "title", "phone", "whatsapp", "email"].map((k) => `<label style="flex:1;min-width:180px" class="small">${k}<input name="${k}" value="${esc(o.contact[k] || "")}"></label>`).join("")}</div>
  <div class="row" style="margin-top:10px"><button class="btn">Mentés</button></div></form>
  <div class="card"><h2>Verziók</h2><table class="small">${o.history.map((h) => `<tr><td>v${h.version}</td><td>${esc(h.author)}</td><td>${esc(h.note || "")}</td><td class="muted">${new Date(h.created_at).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}</td></tr>`).join("")}</table></div>`;
}

export function extensionPage(tokens: { id: string; user_name: string; label: string | null; created_at: string; last_used_at: string | null; revoked_at: string | null }[], newToken: string | null, baseUrl: string, isAdminUser: boolean) {
  return `<h1>Chrome bővítmény (Caradvance Sourcing)</h1>
  <p class="muted">A bővítménnyel egy kattintással küldhetsz autót egy mobile.de vagy AutoScout24 hirdetésről az ügyfél ajánlatába. Ha ebben a Chrome-ban be vagy lépve a belső felületre, a bővítmény token nélkül működik, és azt látja, amit te. Token csak más böngészőhöz kell.${isAdminUser ? " Adminként mindenki tokenjét látod." : ""}</p>
  ${newToken ? `<div class="msg">Új token (most másold ki, többet nem látszik):<br><code style="font-size:15px;user-select:all">${esc(newToken)}</code><br>Szerver címe a bővítményben: <code style="user-select:all">${esc(baseUrl)}</code></div>` : ""}
  <form method="post" action="/belso/ajanlatmotor/bovitmeny" class="card row"><input name="label" placeholder="Melyik gép? (pl. irodai laptop)" style="max-width:320px"><button class="btn red">Saját token létrehozása</button></form>
  <div class="card" style="padding:0"><table><thead><tr><th>Felhasználó</th><th>Megjegyzés</th><th>Létrehozva</th><th>Utoljára használva</th><th></th></tr></thead><tbody>
  ${tokens.map((t) => `<tr><td>${esc(t.user_name)}</td><td>${esc(t.label || "")}</td><td>${new Date(t.created_at).toLocaleString("hu-HU")}</td><td>${t.last_used_at ? new Date(t.last_used_at).toLocaleString("hu-HU") : "–"}</td>
  <td>${t.revoked_at ? `<span class="muted">visszavonva</span>` : `<form method="post" action="/belso/ajanlatmotor/bovitmeny/${t.id}/visszavon"><button class="btn">Visszavonás</button></form>`}</td></tr>`).join("") || `<tr><td colspan="5" class="muted" style="padding:20px">Még nincs token.</td></tr>`}
  </tbody></table></div>
  <div class="card"><h2>Telepítés</h2><ol><li>Töltsd le a bővítményt: <a href="/belso/ajanlatmotor-bovitmeny.zip">ajanlatmotor-bovitmeny.zip</a>, és csomagold ki.</li>
  <li>Chrome → <code>chrome://extensions</code> → Fejlesztői mód be → „Kicsomagolt bővítmény betöltése” → a kicsomagolt mappa.</li>
  <li>Maradj belépve a belső felületre ugyanebben a Chrome-ban (token nem kell).</li><li>Nyiss meg egy mobile.de vagy AutoScout24 hirdetést → „Küldés az ajánlatba”.</li></ol></div>`;
}

export function startPage(deal: DealRow) {
  return `<h1>Ajánlatmotor indítása · ${esc(deal.name || "ügyfél #" + deal.id)}</h1>
  <p class="muted">Ehhez az ügyfélhez még nincs Ajánlatmotor-igény. Írd le, mit keres (vagy másold be az e-mailt / a jegyzetet), és a motor kikeresi a három legjobb autót. Az ügyfél adatai az adatlapról jönnek.</p>
  <form method="post" action="/belso/ajanlatmotor/igeny/${deal.id}/inditas" class="card" style="max-width:760px">
  <label class="small"><b>Mit keres az ügyfél?</b></label>
  <textarea name="text" rows="8" required style="font-family:inherit;font-size:14px" placeholder="Pl. BMW i5 Touring, elektromos, max. 2 éves, 50 ezer km alatt, panorámatető és vonóhorog kell. Keret kb. 25 millió Ft Budapesten forgalomba helyezve.">${esc([deal.car, deal.note].filter(Boolean).join("\n"))}</textarea>
  <div class="row" style="margin-top:12px"><button class="btn red">Igény rögzítése és keresés</button><a class="btn" href="/belso/ugyfel/?id=${deal.id}">Vissza az adatlapra</a></div></form>`;
}

export function equipLabel(e: string) { return equipHu(e).hu; }


/* ---------------- szerkeszthető mobile.de keresés (az igény adataiból, kiküldés előtt módosítható) ---------------- */
const FUEL_HU: [string, string][] = [["petrol", "Benzin"], ["diesel", "Dízel"], ["hybrid", "Hibrid"], ["phev", "Plug-in hibrid"], ["electric", "Elektromos"]];
const BODY_HU: [string, string][] = [["suv", "SUV / terepjáró"], ["estate", "Kombi"], ["sedan", "Limuzin"], ["hatchback", "Ferdehátú"], ["coupe", "Coupé"], ["convertible", "Kabrió"], ["van", "Egyterű / van"], ["pickup", "Pickup"]];
const EQUIP_HU: [string, string][] = [["Anhängerkupplung", "Vonóhorog"], ["Panorama-Dach", "Panorámatető"], ["Head-Up Display", "Head-up display"], ["Standheizung", "Állófűtés"], ["Navigationssystem", "Navigáció"], ["Sitzheizung", "Ülésfűtés"], ["Schiebedach", "Napfénytető"], ["Allradantrieb", "Összkerékhajtás"]];
export function searchEditor(req: Requirements, dealId: number, maxEur?: number) {
  const v = req.vehicle;
  const ids = MOBILE_IDS as { makes: Record<string, string>; models: Record<string, Record<string, string>> };
  const norm = (x: string) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const make0 = v.makes[0] || "";
  const mk = Object.keys(ids.makes).find((k) => norm(k) === norm(make0)) || make0;
  const makes = Object.keys(ids.makes).sort((a, b) => a.localeCompare(b));
  if (mk && !ids.makes[mk]) makes.unshift(mk);
  const eqOn = (k: string) => (v.must_have_equipment || []).some((e) => e.toLowerCase().startsWith(k.toLowerCase()));
  const chk = (name: string, val: string, lbl: string, on: boolean) => `<label class="mds-c"><input type="checkbox" name="${name}" value="${esc(val)}"${on ? " checked" : ""}> ${esc(lbl)}</label>`;
  const inp = (name: string, lbl: string, val: unknown, ph = "") => `<label class="mds-f"><span>${lbl}</span><input name="${name}" value="${val == null ? "" : esc(String(val))}" placeholder="${esc(ph)}" inputmode="numeric"></label>`;
  const cfg = { ids, fuel: FUEL_CODE, body: BODY_CODE, feat: FEATURE_CODE, as24: AS24 };
  return `<style>
  .mds{margin-top:14px}.mds h2{margin:0 0 4px}.mds-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}
  @media(max-width:900px){.mds-g{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .mds-f{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:#5b6472}.mds-f input,.mds-f select{font:inherit;font-size:14px;font-weight:500;color:#161922;padding:9px 10px;border:1px solid #dfe3ea;border-radius:9px;background:#fff}
  .mds-row{display:flex;gap:6px 14px;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:13px}.mds-row>b{min-width:110px;font-size:12px;color:#5b6472}
  .mds-c{display:inline-flex;gap:6px;align-items:center;border:1px solid #e6e9ef;border-radius:999px;padding:5px 11px;cursor:pointer;background:#fff}.mds-c input{width:auto;margin:0;accent-color:#e2001a}
  .mds-url{font:12px ui-monospace,Menlo,monospace;color:#6b7280;word-break:break-all;margin-top:10px;background:#f6f7fb;border-radius:8px;padding:8px 10px}
  </style>
  <form class="card mds" id="mdSearch" method="post" action="/belso/ajanlatmotor/igeny/${dealId}/kereses">
   <h2>Keresés: mobile.de · AutoScout24</h2><div class="small muted">Az igényből kitöltve — módosítsd, ha kell, majd nyisd meg valamelyik portálon. A „Mentés” az igénybe is beírja a változtatásokat.</div>
   <div class="mds-g">
    <label class="mds-f"><span>Márka</span><select name="make" id="mdsMake"><option value="">— bármely —</option>${makes.map((m) => `<option${m === mk ? " selected" : ""}>${esc(m)}</option>`).join("")}</select></label>
    <label class="mds-f"><span>Modell</span><input name="model" id="mdsModel" list="mdsModels" value="${esc(v.models[0] || "")}" placeholder="pl. X5"><datalist id="mdsModels"></datalist></label>
    ${inp("price_max", "Max. ár (€, autó)", maxEur || "", "pl. 45000")}
    <label class="mds-f"><span>Váltó</span><select name="gearbox"><option value="">— mindegy —</option><option value="automatic"${v.gearbox === "automatic" ? " selected" : ""}>Automata</option><option value="manual"${v.gearbox === "manual" ? " selected" : ""}>Manuális</option></select></label>
    ${inp("year_min", "Évjárat -tól", v.year_min, "pl. 2020")}${inp("year_max", "Évjárat -ig", v.year_max, "")}
    ${inp("km_min", "Km -tól", v.km_min, "")}${inp("km_max", "Km -ig", v.km_max, "pl. 100000")}
   </div>
   <div class="mds-row"><b>Üzemanyag</b>${FUEL_HU.map(([k, l]) => chk("fuel", k, l, (v.fuel || []).includes(k as any))).join("")}</div>
   <div class="mds-row"><b>Karosszéria</b>${BODY_HU.map(([k, l]) => chk("body", k, l, (v.body_types || []).includes(k))).join("")}</div>
   <div class="mds-row"><b>Felszereltség</b>${EQUIP_HU.map(([k, l]) => chk("equip", k, l, eqOn(k) || (k === "Allradantrieb" && v.drivetrain === "awd"))).join("")}</div>
   <div class="mds-row"><b>AutoScout24 ország</b><select name="as24_cy" style="font:inherit;font-size:13px;padding:6px 10px;border:1px solid #dfe3ea;border-radius:9px">${Object.entries(AS24.countries).map(([k, l]) => `<option value="${esc(k)}">${esc(l)}</option>`).join("")}</select></div>
   <div class="mds-url" id="mdsUrl"></div><div class="mds-url" id="asUrl"></div>
   <div class="row" style="margin-top:10px"><a class="btn red" id="mdsGo" href="#" target="_blank" rel="noopener">Keresés a mobile.de-n ↗</a><a class="btn red" id="asGo" href="#" target="_blank" rel="noopener" style="background:#333">Keresés az AutoScout24-en ↗</a><button class="btn dark">Mentés az igénybe</button>
    <span class="small muted">A jó hirdetést a Chrome bővítménnyel küldd be („Küldés az ajánlatba”) — mindkét portálon működik.</span></div>
  </form>
  <script>(function(){
  var C=${JSON.stringify(cfg).replace(/</g, "\\u003c")};
  // a szerver-oldali build (keepNames) a függvény forrásába __name(...) hívást tesz — a böngészőben ez nincs definiálva
  var __name=function(f){return f;};
  var AS24SLUG=${as24Slug.toString()};
  var f=document.getElementById('mdSearch');if(!f)return;
  var nm=function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
  var all=function(n){return [].slice.call(f.querySelectorAll('[name="'+n+'"]:checked')).map(function(x){return x.value;});};
  var val=function(n){var e=f.elements[n];return e?String(e.value||'').trim():'';};
  var dig=function(n){return val(n).replace(/\\D/g,'');};
  function models(){var mk=val('make'),m=C.ids.models[mk]||{};document.getElementById('mdsModels').innerHTML=Object.keys(m).map(function(k){return '<option value="'+k.replace(/"/g,'&quot;')+'">';}).join('');}
  function build(){
    var p=new URLSearchParams({dam:'false',isSearchRequest:'true',s:'Car',vc:'Car',sb:'p',od:'up',ref:'srp'});
    var mk=val('make'),md=val('model'),mid=C.ids.makes[mk];
    if(mid){var mm=C.ids.models[mk]||{},key=Object.keys(mm).filter(function(k){return nm(k)===nm(md);})[0]||Object.keys(mm).filter(function(k){return nm(k)===nm(md.replace(/\\b(touring|avant|kombi|sportback|limousine|limuzin)\\b/gi,''));})[0];
      if(key)p.set('ms',mid+';'+mm[key]+';;');else p.set('ms',mid+';;;'+md.replace(/\\b(touring|avant|kombi|sportback|limousine|limuzin)\\b/gi,'').trim());}
    else if(mk||md)p.set('q',(mk+' '+md).trim());
    var cs=[];all('body').forEach(function(b){(C.body[b]||[]).forEach(function(c){if(cs.indexOf(c)<0)cs.push(c);});});cs.forEach(function(c){p.append('c',c);});
    var fs=[];all('fuel').forEach(function(x){var c=C.fuel[x];if(c&&fs.indexOf(c)<0)fs.push(c);});fs.forEach(function(c){p.append('ft',c);});
    if(dig('year_min')||dig('year_max'))p.set('fr',dig('year_min')+':'+dig('year_max'));
    if(dig('km_min')||dig('km_max'))p.set('ml',dig('km_min')+':'+dig('km_max'));
    var pm=+dig('price_max');if(pm>1000)p.set('p',':'+Math.round(pm/1000)*1000);
    var gb=val('gearbox');if(gb==='automatic')p.set('tr','AUTOMATIC_GEAR');else if(gb==='manual')p.set('tr','MANUAL_GEAR');
    var eq=all('equip');if(eq.indexOf('Anhängerkupplung')>=0)p.set('tct','TRAILER_COUPLING_FIX');
    eq.forEach(function(e){var c=C.feat[e];if(c)p.append('fe',c);});
    var u='https://suchen.mobile.de/fahrzeuge/search.html?'+p.toString();
    document.getElementById('mdsGo').href=u;document.getElementById('mdsUrl').textContent=u;
    // AutoScout24: /lst/<márka>/<modell>?…
    var A=C.as24,q=new URLSearchParams({atype:'C',cy:val('as24_cy')||'D',damaged_listing:'exclude',desc:'0',sort:'price',powertype:'kw',ustate:'N,U'});
    var af=[];all('fuel').forEach(function(x){String(A.fuel[x]||'').split(',').forEach(function(c){if(c&&af.indexOf(c)<0)af.push(c);});});if(af.length)q.set('fuel',af.join(','));
    var ab=[];all('body').forEach(function(x){var c=A.body[x];if(c&&ab.indexOf(c)<0)ab.push(c);});if(ab.length)q.set('body',ab.join(','));
    if(dig('year_min'))q.set('fregfrom',dig('year_min'));if(dig('year_max'))q.set('fregto',dig('year_max'));
    if(dig('km_min'))q.set('kmfrom',dig('km_min'));if(dig('km_max'))q.set('kmto',dig('km_max'));
    if(pm>1000)q.set('priceto',String(Math.round(pm/1000)*1000));
    if(gb==='automatic')q.set('gear','A');else if(gb==='manual')q.set('gear','M');
    var ae=[];eq.forEach(function(e){var c=A.eq[e];if(c&&ae.indexOf(c)<0)ae.push(c);});if(ae.length)q.set('eq',ae.join(','));
    var path=AS24SLUG(mk,md),au='https://www.autoscout24.de/lst'+(path?'/'+path:'')+'?'+q.toString().replace(/%2C/g,',');
    document.getElementById('asGo').href=au;document.getElementById('asUrl').textContent=au;
  }
  f.addEventListener('input',build);f.addEventListener('change',function(e){if(e.target&&e.target.name==='make'){f.elements.model.value='';models();}build();});
  models();build();
  })();</script>`;
}
