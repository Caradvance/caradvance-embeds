// Caradvance Sourcing – side panel
const $ = (id) => document.getElementById(id);
const P = self.CaradvanceParser;
const CRIT = ["price_gross_eur", "km", "first_registration", "power_kw"];
let settings = null;
// TESZT build: works out of the box against the test site; the belső login in this Chrome is enough (token optional).
const DEFAULT_BASE = "https://ajanlatmotor-teszt.caradvance-astro.pages.dev";
let current = null;

async function api(path, opts = {}) {
  const r = await fetch(settings.base.replace(/\/$/, "") + "/api/ajanlatmotor/ext" + path, {
    ...opts,
    credentials: "include", // belső session cookie (ca_session) when no token is set
    headers: { ...(settings.token ? { Authorization: "Bearer " + settings.token } : {}), "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await r.json(); } catch (e) { /* empty */ }
  return { status: r.status, ok: r.ok, body };
}

async function parserConfig() {
  const { parserConfig: pc } = await chrome.storage.local.get("parserConfig");
  if (pc && Date.now() - pc.at < 3600_000) return pc.cfg;
  try {
    const r = await fetch(settings.base.replace(/\/$/, "") + "/api/ajanlatmotor/parser-config");
    if (r.ok) {
      const cfg = await r.json();
      await chrome.storage.local.set({ parserConfig: { at: Date.now(), cfg } });
      return cfg;
    }
  } catch (e) { /* offline: bundled default */ }
  return P.DEFAULT_CONFIG;
}

async function loadRequests() {
  const sel = $("req");
  const r = await api("/requests");
  if (!r.ok) {
    sel.innerHTML = `<option value="">${r.status === 401 ? (settings.token ? "Érvénytelen token" : "Nincs belépve") : "A szerver nem érhető el"}</option>`;
    if (r.status === 401 && !settings.token) {
      const login = settings.base.replace(/\/$/, "") + "/belso/?next=" + encodeURIComponent("/belso/ajanlatmotor/");
      $("reqHint").innerHTML = `Lépj be a belső felületre ebben a Chrome-ban, utána nyisd újra ezt a panelt: <a href="${login}" target="_blank">Belépés ↗</a>`;
    }
    return;
  }
  const { lastReq } = await chrome.storage.local.get("lastReq");
  sel.innerHTML = r.body.requests.length
    ? r.body.requests.map((q) => `<option value="${q.id}" ${q.id === lastReq ? "selected" : ""}>${esc(q.customer || "?")} · ${esc(q.summary.slice(0, 60))}</option>`).join("")
    : `<option value="">Nincs nyitott igény</option>`;
  $("reqHint").textContent = `Bejelentkezve: ${r.body.user.replace(/^ext:/, "")}`;
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function renderListing() {
  if (!current) { $("listingBox").hidden = true; $("emptyBox").hidden = false; return; }
  $("emptyBox").hidden = true;
  $("listingBox").hidden = false;
  const l = current.listing;
  $("lTitle").textContent = l.title || [l.make, l.model, l.variant].filter(Boolean).join(" ") || "Ismeretlen autó";
  $("lLayers").textContent = current.layers.length ? current.layers.join(" + ") : "nincs adat";
  $("lImg").src = (l.images || [])[0] || "";
  for (const k of CRIT) $("f_" + k).value = l[k] ?? "";
  $("f_zip").value = l.seller?.zip ?? "";
  $("f_city").value = l.seller?.city ?? "";
  $("lMeta").textContent = [l.fuel, l.gearbox, l.color, (l.equipment || []).length ? `${l.equipment.length} felszereltségi tétel` : null,
    (l.images || []).length ? `${l.images.length} kép` : null].filter(Boolean).join(" · ");
  $("result").hidden = true;
  validate();
}

function validate() {
  let ok = true;
  for (const k of CRIT) {
    const el = $("f_" + k);
    const bad = !String(el.value).trim() || (k === "first_registration" && !/^\d{4}-\d{2}$/.test(el.value.trim()));
    el.classList.toggle("miss", bad);
    if (bad) ok = false;
  }
  const loc = !!($("f_city").value.trim() || (current?.listing.seller?.lat && current?.listing.seller?.lon));
  $("f_city").classList.toggle("miss", !loc);
  if (!loc) ok = false;
  $("send").disabled = !ok || !$("req").value;
  return ok;
}

function collect() {
  const l = structuredClone(current.listing);
  for (const k of CRIT) l[k] = $("f_" + k).value.trim();
  l.seller = { ...(l.seller || {}), zip: $("f_zip").value.trim() || l.seller?.zip, city: $("f_city").value.trim() };
  return l;
}

function showResult(r) {
  const box = $("result");
  box.hidden = false;
  box.className = "result" + (r.ok ? "" : " err");
  if (r.status === 409) { box.innerHTML = `Ez az autó már szerepel ennél az igénynél. <a href="${esc(r.body.admin_url)}" target="_blank">Megnyitás az adminban</a>`; return; }
  if (!r.ok) {
    box.innerHTML = r.body?.fields ? `Hiányos adatok: ${r.body.fields.join(", ")}` : `Hiba: ${esc(r.body?.error || r.status)}`;
    return;
  }
  const b = r.body;
  box.innerHTML = `Elküldve.<strong>≈ ${Number(b.customer_total_huf).toLocaleString("hu-HU")} Ft</strong>
    ${b.distance_km} km Budapesttől · pont: ${b.score}
    ${b.not_matching?.length ? `<br>Figyelem, nem felel meg: ${esc(b.not_matching.join(", "))}` : ""}
    ${b.warnings?.length ? `<br>${esc(b.warnings[0])}` : ""}
    <br><a href="${esc(b.admin_url)}" target="_blank">Igény megnyitása az adminban →</a>`;
}

async function send() {
  if (!validate()) return;
  $("send").disabled = true;
  const slot = document.querySelector("input[name=slot]:checked").value;
  const r = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      request_id: $("req").value, slot: slot === "runner" ? "runner" : Number(slot), listing: collect(), source_url: current.listing.url,
      parser_version: current.parser_version, parser_layers: current.layers, page_snapshot_hash: current.page_snapshot_hash,
    }),
  });
  showResult(r);
  $("send").disabled = false;
}

async function renderTray() {
  const { tray = [] } = await chrome.storage.session.get("tray");
  $("trayBox").hidden = !tray.length;
  $("trayCount").textContent = `${tray.length} / 10`;
  $("tray").innerHTML = tray.map((t) => `<li data-id="${t.ad_id}">${esc(t.title || t.ad_id)}<span>vár</span></li>`).join("");
}

async function sendTray() {
  const { tray = [] } = await chrome.storage.session.get("tray");
  if (!$("req").value) { alert("Előbb válassz ügyféligényt."); return; }
  $("sendTray").disabled = true;
  const cfg = await parserConfig();
  for (const t of tray.slice(0, 10)) {
    const li = document.querySelector(`#tray li[data-id="${t.ad_id}"] span`);
    li.textContent = "megnyitás…";
    try {
      const html = await (await fetch(t.url, { credentials: "include" })).text();
      const parsed = P.parseListing(html, t.url, cfg);
      if (parsed.missing.length) { li.textContent = "hiányos: " + parsed.missing.join(", ") + " (nyisd meg kézzel)"; continue; }
      const r = await api("/listings", { method: "POST", body: JSON.stringify({ request_id: $("req").value, slot: "runner", listing: parsed.listing, source_url: t.url, parser_version: parsed.parser_version, parser_layers: parsed.layers }) });
      li.textContent = r.ok ? `kész · ≈ ${Number(r.body.customer_total_huf).toLocaleString("hu-HU")} Ft` : r.status === 409 ? "már szerepel" : "hiba: " + (r.body?.error || r.status);
    } catch (e) {
      li.textContent = "hiba: " + e.message;
    }
    await new Promise((res) => setTimeout(res, 1500 + Math.random() * 1000));
  }
  $("sendTray").disabled = false;
}

async function openSearch() {
  if (!$("req").value) return;
  const r = await api(`/requests/${$("req").value}/search-url`);
  if (r.ok) chrome.tabs.create({ url: r.body.url });
}

// Unpacked installs don't pick up new background/content code until reloaded; the panel is served from disk, so it does it.
const BUILD = "0.4.2";
if (chrome.runtime.getManifest().version !== BUILD) chrome.runtime.reload();

async function init() {
  settings = { base: DEFAULT_BASE, token: "", ...((await chrome.storage.local.get("settings")).settings || {}) };
  if (!settings.base) { $("setup").hidden = false; $("reqBox").hidden = true; return; }
  $("setup").hidden = true; $("reqBox").hidden = false;
  $("env").hidden = !/localhost|127\.0\.0\.1|pages\.dev/.test(settings.base);
  await parserConfig();
  await loadRequests();
  current = (await chrome.storage.session.get("current")).current || null;
  renderListing();
  renderTray();
}

$("req").addEventListener("change", () => { chrome.storage.local.set({ lastReq: $("req").value }); validate(); });
$("send").addEventListener("click", send);
$("sendTray").addEventListener("click", sendTray);
$("openSearch").addEventListener("click", openSearch);
document.querySelectorAll("#listingBox input").forEach((i) => i.addEventListener("input", validate));
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === "session" && ch.current) { current = ch.current.newValue; renderListing(); }
  if (area === "session" && ch.tray) renderTray();
  if (area === "local" && ch.settings) init();
});
init();
