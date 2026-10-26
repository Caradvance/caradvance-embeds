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

  async function onListing() {
    label.textContent = "Küldés az ajánlatba";
    btn.onclick = async () => {
      const cfg = await config();
      const html = document.documentElement.outerHTML;
      const parsed = P.parseListing(html, location.href, cfg);
      parsed.page_snapshot_hash = await sha256(html.slice(0, 200000));
      chrome.runtime.sendMessage({ type: "parsed", payload: parsed });
      label.textContent = "Megnyitva az oldalsávban";
      setTimeout(() => (label.textContent = "Küldés az ajánlatba"), 2500);
    };
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
