const $ = (id) => document.getElementById(id);
chrome.storage.local.get("settings").then(({ settings }) => {
  $("base").value = settings?.base || "https://ajanlatmotor-teszt.caradvance-astro.pages.dev";
  $("token").value = settings?.token || "";
});
$("save").addEventListener("click", async () => {
  const base = $("base").value.trim().replace(/\/$/, "");
  const token = $("token").value.trim();
  const out = $("out");
  out.hidden = false;
  try {
    const r = await fetch(base + "/api/ajanlatmotor/ext/requests", { credentials: "include", headers: token ? { Authorization: "Bearer " + token } : {} });
    if (!r.ok) throw new Error(r.status === 401 ? (token ? "érvénytelen token" : "nem vagy belépve a belső felületre ebben a Chrome-ban") : "HTTP " + r.status);
    const j = await r.json();
    await chrome.storage.local.set({ settings: { base, token } });
    await chrome.storage.local.remove("parserConfig");
    out.className = "result";
    out.textContent = `Rendben. Bejelentkezve: ${j.user.replace(/^ext:/, "")}, ${j.requests.length} nyitott igény.`;
  } catch (e) {
    out.className = "result err";
    out.textContent = "Nem sikerült: " + e.message;
  }
});
