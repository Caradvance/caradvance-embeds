// Caradvance Sourcing – service worker: opens the side panel, relays parsed listings and talks to the Ajánlatmotor API.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// TESZT build: preset to the test site; the belső login in this Chrome is enough (token optional).
const DEFAULT_BASE = "https://ajanlatmotor-teszt.caradvance-astro.pages.dev";

async function settings() {
  const { settings: s } = await chrome.storage.local.get("settings");
  return { base: DEFAULT_BASE, token: "", ...(s || {}) };
}

async function api(path, opts = {}) {
  const s = await settings();
  const base = s.base.replace(/\/$/, "");
  try {
    const r = await fetch(base + "/api/ajanlatmotor/ext" + path, {
      ...opts,
      credentials: "include",
      headers: { ...(s.token ? { Authorization: "Bearer " + s.token } : {}), "Content-Type": "application/json" },
    });
    let body = null;
    try { body = await r.json(); } catch (e) { /* empty */ }
    return { status: r.status, ok: r.ok, body, base };
  } catch (e) {
    return { status: 0, ok: false, body: { error: String(e && e.message || e) }, base };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "parsed" && sender.tab) {
    chrome.storage.session.set({ current: { ...msg.payload, tabId: sender.tab.id, at: Date.now() } }).then(() => {
      // called synchronously from a click in the page, so the user-gesture requirement is met
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === "tray") {
    chrome.storage.session.set({ tray: msg.items });
    sendResponse({ ok: true });
  }
  if (msg.type === "open-panel" && sender.tab) {
    chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
  }
  // in-page panel on a mobile.de listing: open requests + send
  if (msg.type === "ext-requests") {
    Promise.all([api("/requests"), chrome.storage.local.get("lastReq")]).then(([r, { lastReq }]) => sendResponse({ ...r, lastReq }));
    return true;
  }
  if (msg.type === "ext-push") {
    chrome.storage.local.set({ lastReq: String(msg.body.request_id) });
    api("/listings", { method: "POST", body: JSON.stringify(msg.body) }).then(sendResponse);
    return true;
  }
});
