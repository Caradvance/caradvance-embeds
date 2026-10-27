// Caradvance Sourcing – content script on mobile.de. Acts only on the open page and only on click.
(function () {
  const P = self.CaradvanceParser;
  if (!P || window.__caradvanceLoaded) return;
  window.__caradvanceLoaded = true;

  async function config() {
    const { parserConfig } = await chrome.storage.local.get("parserConfig");
    return parserConfig && Date.now() - parserConfig.at < 3600_000 ? parserConfig.cfg : P.DEFAULT_CONFIG;
  }

  async function sha256(s) {
    const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;z-index:2147483646;right:20px;bottom:20px";
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `<style>
    button{font:700 14px/1 system-ui,-apple-system,sans-serif;border:0;border-radius:999px;cursor:pointer;padding:14px 20px;
      background:#E2001A;color:#fff;box-shadow:0 12px 28px -10px rgba(0,0,0,.45);display:flex;gap:8px;align-items:center}
    button:hover{background:#c50017} .dot{width:8px;height:8px;border-radius:50%;background:#fff}
    .tray{background:#0B0B0D}
  </style><button id="b"><span class="dot"></span><span id="t"></span></button>`;
  const btn = shadow.getElementById("b");
  const label = shadow.getElementById("t");

  // In-page panel: pick the customer request and the slot, send. (The side panel still works for editing fields.)
  const panel = document.createElement("div");
  panel.id = "p";
  async function onListing() {
    label.textContent = "Küldés az ajánlatba";
    shadow.querySelector("style").textContent += `
      #p{position:absolute;right:0;bottom:58px;width:340px;background:#fff;color:#0B0B0D;border-radius:16px;padding:16px;
        box-shadow:0 24px 60px -18px rgba(0,0,0,.45);font:14px/1.4 system-ui,-apple-system,sans-serif;display:none}
      #p.open{display:block} #p h3{margin:0 0 10px;font-size:15px} #p select{width:100%;padding:8px;border-radius:10px;border:1px solid #ccc;font:inherit}
      #p .slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
      #p .slots button{padding:10px 0;justify-content:center;font-size:13px;box-shadow:none}
      #p .slots button.alt{background:#0B0B0D} #p .msg{margin-top:10px;font-size:13px} #p .err{color:#E2001A} #p a{color:#E2001A;font-weight:700}
      #p .muted{color:#666;font-size:12px;margin-top:6px}`;
    shadow.appendChild(panel);
    let parsed = null;
    const msg = (html) => { panel.querySelector(".msg").innerHTML = html; };
    btn.onclick = async () => {
      if (panel.classList.toggle("open") === false) return;
      panel.innerHTML = `<h3>Küldés az Ajánlatmotorba</h3><div class="msg">Igények betöltése…</div>`;
      const cfg = await config();
      const html = document.documentElement.outerHTML;
      parsed = P.parseListing(html, location.href, cfg);
      parsed.page_snapshot_hash = await sha256(html.slice(0, 200000));
      const r = await chrome.runtime.sendMessage({ type: "ext-requests" });
      if (!r.ok) {
        const login = r.base + "/belso/?next=" + encodeURIComponent("/belso/ajanlatmotor/");
        msg(r.status === 401 ? `<span class="err">Nincs belépve.</span> <a href="${login}" target="_blank">Belépés a belső felületre ↗</a>, utána kattints újra.` : `<span class="err">A szerver nem érhető el (${r.status}).</span>`);
        return;
      }
      const reqs = r.body.requests || [];
      if (!reqs.length) { msg("Nincs nyitott ügyféligény."); return; }
      const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
      const l = parsed.listing;
      panel.innerHTML = `<h3>Küldés az Ajánlatmotorba</h3>
        <select id="req">${reqs.map((q) => `<option value="${q.id}" ${String(q.id) === String(r.lastReq) ? "selected" : ""}>${esc(q.customer || "?")} · ${esc((q.summary || "").slice(0, 50))}</option>`).join("")}</select>
        <div class="slots"><button data-s="1">1. hely</button><button data-s="2">2. hely</button><button data-s="3">3. hely</button><button data-s="runner" class="alt">Tartalék</button></div>
        <div class="muted">${esc(l.title || [l.make, l.model].filter(Boolean).join(" "))} · ${l.price_gross_eur ? Number(l.price_gross_eur).toLocaleString("hu-HU") + " €" : "ár?"} · ${l.km != null ? Number(l.km).toLocaleString("hu-HU") + " km" : "km?"} · ${(l.images || []).length} kép${parsed.missing.length ? ` · <span class="err">hiányzik: ${esc(parsed.missing.join(", "))}</span>` : ""}</div>
        <div class="msg"></div><div class="muted">Bejelentkezve: ${esc(String(r.body.user || "").replace(/^ext:/, ""))} · v${chrome.runtime.getManifest().version}</div>`;
      panel.querySelectorAll(".slots button").forEach((b) => b.addEventListener("click", async (e) => {
        e.stopPropagation();
        panel.querySelectorAll(".slots button").forEach((x) => (x.disabled = true));
        msg("Küldés… (fotószűrés, költségszámítás)");
        const s = b.dataset.s;
        const res = await chrome.runtime.sendMessage({ type: "ext-push", body: {
          request_id: panel.querySelector("#req").value, slot: s === "runner" ? "runner" : Number(s), listing: parsed.listing,
          source_url: location.href.split("#")[0], parser_version: parsed.parser_version, parser_layers: parsed.layers, page_snapshot_hash: parsed.page_snapshot_hash } });
        panel.querySelectorAll(".slots button").forEach((x) => (x.disabled = false));
        if (res.ok) msg(`✓ Hozzáadva · ≈ ${Number(res.body.customer_total_huf).toLocaleString("hu-HU")} Ft Budapesten · ${res.body.distance_km} km${res.body.not_matching && res.body.not_matching.length ? `<br><span class="err">Nem felel meg: ${esc(res.body.not_matching.join(", "))}</span>` : ""}<br><a href="${res.body.admin_url}" target="_blank">Megnyitás az Ajánlatmotorban ↗</a>`);
        else if (res.status === 409) msg(`Ez az autó már szerepel az igénynél. <a href="${res.body.admin_url}" target="_blank">Megnyitás ↗</a>`);
        else if (res.status === 422) msg(`<span class="err">Hiányos adatok: ${esc((res.body.fields || []).join(", "))}.</span> Nyisd meg az oldalsávban és pótold.`);
        else msg(`<span class="err">Hiba: ${esc(res.body && res.body.error || res.status)}</span>`);
      }));
    };
    panel.addEventListener("click", (e) => e.stopPropagation());
    document.documentElement.appendChild(host);
  }

  async function onSearch() {
    const cfg = await config();
    const selected = new Map();
    const update = () => {
      label.textContent = selected.size ? `Kijelöltek (${selected.size}) → oldalsáv` : "Válassz autókat (+)";
      chrome.runtime.sendMessage({ type: "tray", items: [...selected.values()] });
    };
    btn.classList.add("tray");
    btn.onclick = () => chrome.runtime.sendMessage({ type: "open-panel" });
    const links = [...document.querySelectorAll("a[href*='details.html?id='], a[href*='/auto-inserat/']")];
    const seen = new Set();
    for (const a of links) {
      const id = P.adIdFromUrl(a.href);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const card = cfg.search_card_selectors.map((s) => a.closest(s)).find(Boolean) || a;
      if (getComputedStyle(card).position === "static") card.style.position = "relative";
      const box = document.createElement("label");
      box.style.cssText = "position:absolute;top:10px;right:10px;z-index:5;background:#0B0B0D;color:#fff;border-radius:999px;padding:6px 10px;font:700 13px system-ui;display:flex;gap:6px;align-items:center;cursor:pointer";
      box.innerHTML = `<input type="checkbox" style="accent-color:#E2001A;width:16px;height:16px;margin:0"> +`;
      const input = box.querySelector("input");
      box.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("change", () => {
        if (input.checked) {
          if (selected.size >= 10) { input.checked = false; alert("Egyszerre legfeljebb 10 autó küldhető."); return; }
          selected.set(id, { ad_id: id, url: a.href.split("#")[0], title: (card.innerText || "").split("\n").filter(Boolean).slice(0, 2).join(" · ").slice(0, 140) });
        } else selected.delete(id);
        update();
      });
      card.appendChild(box);
    }
    update();
    document.documentElement.appendChild(host);
  }

  (async () => {
    const cfg = await config();
    if (P.isListingUrl(location.href, cfg)) onListing();
    else if (P.isSearchUrl(location.href, cfg)) onSearch();
  })();
})();
