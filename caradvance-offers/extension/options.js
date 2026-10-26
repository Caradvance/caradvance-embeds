const $ = (id) => document.getElementById(id);
chrome.storage.local.get("settings").then(({ settings }) => {
  if (settings) { $("base").value = settings.base; $("token").value = settings.token; }
});
$("save").addEventListener("click", async () => {
  const base = $("base").value.trim().replace(/\/$/, "");
  const token = $("token").value.trim();
  const out = $("out");
  out.hidden = false;
  try {
    const r = await fetch(base + "/api/ext/requests", { headers: { Authorization: "Bearer " + token } });
    if (!r.ok) throw new Error(r.status === 401 ? "érvénytelen token" : "HTTP " + r.status);
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
