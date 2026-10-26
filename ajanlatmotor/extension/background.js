// Caradvance Sourcing – service worker: opens the side panel and relays parsed listings.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

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
});
