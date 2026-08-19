/* ── Kill the "Hamarosan indul / Belépési kód" preview gate (site is public) ── */
(function () {
  "use strict";
  try {
    var s = document.createElement("style");
    s.textContent = "#ca-gate{display:none!important}html,body{overflow:visible!important}";
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
  function killGate() {
    var g = document.getElementById("ca-gate"); if (g) g.remove();
    try { document.documentElement.style.overflow = ""; if (document.body) document.body.style.overflow = ""; } catch (e) {}
  }
  killGate();
  document.addEventListener("DOMContentLoaded", killGate);
  [0, 150, 500, 1200].forEach(function (ms) { setTimeout(killGate, ms); });
})();

/* ── Safety net: if the page's scroll-reveal script is missing/broken, force sections visible ── */
(function () {
  "use strict";
  function rescue() {
    try {
      var reveals = document.querySelectorAll(".reveal");
      if (!reveals.length) return;                 // page doesn't use reveal
      if (document.querySelector(".reveal.in")) return; // reveal script is working — leave animation alone
      var s = document.createElement("style");
      s.textContent = ".reveal{opacity:1!important;transform:none!important}";
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }
  function go() { setTimeout(rescue, 2500); setTimeout(rescue, 5000); }
  if (document.readyState !== "loading") go(); else document.addEventListener("DOMContentLoaded", go);
})();

(function () {
  "use strict";
  if (window.__caChatLoaded) return; window.__caChatLoaded = true;

  var API = "https://caradvance-chatbot.flat-fire-7e25.workers.dev/api/chat";
  var WA = "36302336060";                 // +36 30 233 6060
  var SESSION = null;                      // Phase 2: bejelentkezett ügyfél tokenje
  var LOGO = "/caradvance-logo.webp";      // tedd a public mappába

  var css = `
  .cac,.cac *{box-sizing:border-box}
  .cac{--a:#d10a17;--a2:#ef2530;--ink:#131316;--mut:#63636a;--sf:#fff;--sf2:#f6f6f7;--ln:#e6e6e9;--ln2:#d7d7db;--usr:#151519;--bot:#f0f0f2;--wa:#1faf52;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  @media (prefers-color-scheme:dark){.cac{--a:#ff2b38;--a2:#ff5560;--ink:#f0f0f2;--mut:#9aa0a8;--sf:#161619;--sf2:#1d1d21;--ln:#262629;--ln2:#34343a;--usr:#d10a17;--bot:#202024;--wa:#25d366}}
  .cac-launch{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:9px;cursor:pointer;border:none;background:var(--a);color:#fff;padding:13px 18px;border-radius:999px;font-size:14.5px;font-weight:650;box-shadow:0 20px 45px -18px rgba(120,10,10,.5);transition:transform .18s,opacity .2s}
  .cac-launch .cac-lt{white-space:nowrap}
  .cac-launch:hover{transform:translateY(-2px)}
  .cac-launch.hid{opacity:0;transform:scale(.8) translateY(10px);pointer-events:none}
  @media (max-width:560px){.cac-launch{right:14px;bottom:14px;padding:0;width:54px;height:54px;justify-content:center;gap:0;border-radius:50%}.cac-launch .cac-lt{display:none}}
  .cac-w{position:fixed;right:22px;bottom:18px;z-index:2147483000;width:416px;max-width:calc(100vw - 28px);height:min(680px,calc(100vh - 28px));background:var(--sf);border:1px solid var(--ln);border-radius:18px;box-shadow:0 30px 70px -20px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden;color:var(--ink);transform-origin:bottom right;transition:transform .22s cubic-bezier(.2,.9,.3,1.2),opacity .18s}
  .cac-w.cl{opacity:0;transform:scale(.9) translateY(14px);pointer-events:none}
  .cac-hd{flex:none;display:flex;align-items:center;justify-content:space-between;padding:12px 12px 12px 15px;background:linear-gradient(160deg,color-mix(in srgb,var(--a) 15%,var(--sf)),var(--sf));border-bottom:1px solid var(--ln)}
  .cac-br{display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-width:0}
  .cac-lg{height:26px;width:auto;max-width:190px;object-fit:contain;display:block}
  .cac-lgt{font-weight:800;font-size:18px;letter-spacing:-.4px}.cac-lgt span{color:var(--a)}
  .cac-st{margin:0;font-size:11.5px;color:var(--mut);display:flex;align-items:center;gap:6px}.cac-st b{color:var(--a)}
  .cac-dot{width:7px;height:7px;border-radius:50%;background:#34c759}
  .cac-x{border:none;background:transparent;color:var(--mut);cursor:pointer;width:32px;height:32px;border-radius:8px;font-size:18px}
  .cac-x:hover{background:var(--sf2);color:var(--ink)}
  .cac-th{flex:1 1 auto;min-height:0;overflow-y:auto;padding:16px}
  .cac-ms{display:flex;flex-direction:column;gap:12px}
  .cac-r{display:flex;gap:8px;max-width:100%}
  .cac-r.b{align-self:flex-start;max-width:90%}.cac-r.m{align-self:flex-end;max-width:86%;flex-direction:row-reverse}
  .cac-av{width:26px;height:26px;border-radius:8px;flex:none;align-self:flex-end;background:linear-gradient(150deg,var(--a2),var(--a));color:#fff;display:grid;place-items:center;font-size:10px;font-weight:800}
  .cac-bb{padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere}
  .cac-r.b .cac-bb{background:var(--bot);color:var(--ink);border-bottom-left-radius:5px}
  .cac-r.m .cac-bb{background:var(--usr);color:#f5f5f6;border-bottom-right-radius:5px}
  .cac-tp{display:inline-flex;gap:4px;padding:4px 2px}.cac-tp span{width:7px;height:7px;border-radius:50%;background:var(--mut);animation:cacb 1.2s infinite}
  .cac-tp span:nth-child(2){animation-delay:.15s}.cac-tp span:nth-child(3){animation-delay:.3s}
  @keyframes cacb{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
  .cac-ch{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.cac-ch:empty{margin:0}
  .cac-c{font-size:12.5px;font-weight:550;border:1px solid var(--ln2);background:var(--sf);color:var(--ink);padding:7px 12px;border-radius:999px;cursor:pointer}
  .cac-c:hover{border-color:var(--a);background:color-mix(in srgb,var(--a) 8%,var(--sf))}
  .cac-hf{margin-top:12px;padding:12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--wa) 40%,var(--ln));background:color-mix(in srgb,var(--wa) 8%,var(--sf));display:none;gap:10px;align-items:center}
  .cac-hf.on{display:flex}.cac-hf .t{flex:1;font-size:12.5px;color:var(--mut)}.cac-hf .t b{color:var(--ink);display:block;font-size:13px}
  .cac-wa{display:inline-flex;align-items:center;gap:8px;text-decoration:none;background:var(--wa);color:#fff;font-weight:700;font-size:13px;padding:9px 14px;border-radius:10px;white-space:nowrap}
  .cac-cp{flex:none;padding:9px 12px 10px;border-top:1px solid var(--ln);background:var(--sf)}
  .cac-hm{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:650;border:1px solid color-mix(in srgb,var(--wa) 45%,var(--ln));background:transparent;color:var(--wa);padding:6px 12px;border-radius:999px;cursor:pointer;margin-bottom:8px}
  .cac-iw{display:flex;align-items:flex-end;gap:8px;background:var(--sf2);border:1px solid var(--ln2);border-radius:14px;padding:6px 6px 6px 14px}
  .cac-iw:focus-within{border-color:var(--a)}
  .cac-iw textarea{flex:1;border:none;background:transparent;resize:none;outline:none;font-family:inherit;font-size:14px;color:var(--ink);max-height:96px;padding:6px 0;line-height:1.4}
  .cac-sd{width:36px;height:36px;border-radius:10px;flex:none;border:none;cursor:pointer;background:var(--a);color:#fff;display:grid;place-items:center}
  .cac-sd:disabled{opacity:.4;cursor:default}
  @media (prefers-reduced-motion:reduce){.cac-w,.cac-launch,.cac-tp span{transition:none!important;animation:none!important}}`;

  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var wrap = document.createElement("div"); wrap.className = "cac"; document.body.appendChild(wrap);
  var waMsg = "Szia CarAdvance! A weboldali chatből írok, szeretnék egy munkatárssal beszélni.";
  var waHref = "https://wa.me/" + WA + "?text=" + encodeURIComponent(waMsg);
  var carSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var waSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.1 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.55 15.2L2 22l4.94-1.3A10 10 0 1 0 12 2z"/></svg>';

  wrap.innerHTML =
    '<button class="cac-launch" id="cacL" aria-label="Kérdése van? Segítek">' + carSvg + '<span class="cac-lt">Segítek</span></button>' +
    '<section class="cac-w cl" id="cacW" role="dialog" aria-label="CarAdvance asszisztens">' +
      '<header class="cac-hd"><div class="cac-br">' +
        '<img class="cac-lg" src="' + LOGO + '" alt="CarAdvance" onerror="this.outerHTML=\'<div class=&quot;cac-lgt&quot;>Car<span>Advance</span></div>\'">' +
        '<p class="cac-st"><span class="cac-dot"></span> <b>AI asszisztens</b> · online</p>' +
      '</div><button class="cac-x" id="cacX" aria-label="Bezárás">✕</button></header>' +
      '<div class="cac-th" id="cacTh"><div class="cac-ms" id="cacMs"></div><div class="cac-ch" id="cacCh"></div>' +
        '<div class="cac-hf" id="cacHf"><div class="t"><b>Beszélnél egy munkatárssal?</b>Hétköznap 9–17h között WhatsAppon.</div>' +
        '<a class="cac-wa" id="cacWa" target="_blank" rel="noopener">' + waSvg + ' WhatsApp</a></div>' +
      '</div>' +
      '<div class="cac-cp"><button class="cac-hm" id="cacHm">' + waSvg + ' Beszélnék egy emberrel</button>' +
        '<div class="cac-iw"><textarea id="cacIn" rows="1" placeholder="Írd ide a kérdésed…"></textarea>' +
        '<button class="cac-sd" id="cacSd" aria-label="Küldés" disabled><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg></button></div>' +
      '</div>' +
    '</section>';

  var $ = function (id) { return document.getElementById(id); };
  var L = $("cacL"), W = $("cacW"), X = $("cacX"), Th = $("cacTh"), Ms = $("cacMs"),
      In = $("cacIn"), Sd = $("cacSd"), Ch = $("cacCh"), Hf = $("cacHf"), Wa = $("cacWa"), Hm = $("cacHm");
  Wa.href = waHref;

  var history = [], busy = false, greeted = false;
  function down() { Th.scrollTop = Th.scrollHeight; }
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>"); }
  function row(who, html) {
    var d = document.createElement("div"); d.className = "cac-r " + who;
    d.innerHTML = (who === "b" ? '<div class="cac-av">CA</div>' : "") + '<div class="cac-bb">' + html + "</div>";
    Ms.appendChild(d); down(); return d;
  }
  function typing() {
    var d = document.createElement("div"); d.className = "cac-r b";
    d.innerHTML = '<div class="cac-av">CA</div><div class="cac-bb"><div class="cac-tp"><span></span><span></span><span></span></div></div>';
    Ms.appendChild(d); down(); return d;
  }
  var CHIPS = ["Hogyan működik az import?", "Milyen árakkal számoljak?", "Van garancia?", "Mik az elérhetőségeitek?"];
  function chips() {
    Ch.innerHTML = "";
    CHIPS.forEach(function (q) { var b = document.createElement("button"); b.className = "cac-c"; b.textContent = q; b.onclick = function () { send(q); }; Ch.appendChild(b); });
    down();
  }
  function send(t) {
    if (busy || !t.trim()) return; busy = true; Hf.classList.remove("on"); Ch.innerHTML = "";
    row("m", fmt(t)); history.push({ role: "user", content: t }); In.value = ""; size(); Sd.disabled = true;
    var tp = typing();
    fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history, session: SESSION }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { tp.remove(); var rep = (d && d.reply) || "Elnézést, most nem tudok válaszolni."; row("b", fmt(rep)); history.push({ role: "assistant", content: rep }); chips(); })
      .catch(function () { tp.remove(); row("b", "Elnézést, technikai hiba történt. Írj nekünk WhatsAppon: <strong>+36 30 233 6060</strong>."); Hf.classList.add("on"); })
      .finally(function () { busy = false; In.focus(); });
  }
  function open() {
    W.classList.remove("cl"); L.classList.add("hid");
    if (!greeted) { greeted = true; setTimeout(function () { row("b", "Üdvözöllek a <strong>CarAdvance</strong>-nál! 👋 Prémium autók Németországból — bérlés, vásárlás és import. Miben segíthetek?"); chips(); }, 250); }
    setTimeout(function () { In.focus(); }, 400);
  }
  function size() { In.style.height = "auto"; In.style.height = Math.min(In.scrollHeight, 96) + "px"; }
  In.addEventListener("input", function () { size(); Sd.disabled = !In.value.trim(); });
  In.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (In.value.trim()) send(In.value); } });
  Sd.onclick = function () { if (In.value.trim()) send(In.value); };
  Hm.onclick = function () { row("m", "Szeretnék egy emberrel beszélni"); Ch.innerHTML = ""; row("b", "Természetesen! 🙌 Egy munkatársunk WhatsAppon azonnal segít (hétköznap 9–17h). Kattints a gombra:"); Hf.classList.add("on"); };
  L.onclick = open; X.onclick = function () { W.classList.add("cl"); L.classList.remove("hid"); };
})();

/* =========================================================================
   CarAdvance brand submenu injector — BMW / MINI / Mercedes
   Adds the brand sub-menu under "Egyedi autó rendelés" on every baked page
   (homepage, car pages, section pages). Astro-built pages already include
   the submenu, so we skip when a .ddi-sub is already present. Also repairs
   the dead "#" link that some mobile menus use for that item.
   ========================================================================= */
(function () {
  "use strict";
  if (window.__caNavBrands) return; window.__caNavBrands = true;

  var BRANDS = [
    { t: "BMW",      href: "/egyedi-auto-rendeles?brand=bmw",      logo: "/bmw/bmw-logo.webp?v=2" },
    { t: "MINI",     href: "/egyedi-auto-rendeles?brand=mini",     logo: "/mini-logo.webp?v=3" },
    { t: "Mercedes", href: "/egyedi-auto-rendeles?brand=mercedes", logo: "/mb-star.webp?v=1" }
  ];
  var LABEL = "Egyedi autó rendelés";
  var DEST = "/egyedi-auto-rendeles";

  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  function txt(el) { return (el.textContent || "").replace(/\s+/g, " ").trim(); }

  function injectCss() {
    if (document.getElementById("caNavBrandsCss")) return;
    var s = document.createElement("style"); s.id = "caNavBrandsCss";
    s.textContent =
      ".ca-navwrap .dd-inner .ddi-sub{position:relative;}" +
      ".ca-navwrap .ddi-parent{display:flex;align-items:center;justify-content:space-between;gap:12px;}" +
      ".ca-navwrap .ddi-parent .subchev{opacity:.55;font-size:1.15em;line-height:1;transform:translateY(-1px);}" +
      ".ca-navwrap .ddi-sub>.flyout{position:absolute;top:-6px;left:100%;min-width:186px;background:#fff;border:1px solid #e8e8ea;border-radius:12px;box-shadow:0 14px 34px rgba(0,0,0,.14);padding:6px;display:none;z-index:1000;}" +
      ".ca-navwrap .ddi-sub:hover>.flyout,.ca-navwrap .ddi-sub.open>.flyout{display:block;}" +
      ".ca-navwrap .ddi-brand{display:flex;align-items:center;gap:11px;white-space:nowrap;}" +
      ".ca-navwrap .ddi-brand .brandlogo{width:22px;height:22px;object-fit:contain;flex:0 0 22px;}" +
      ".ca-navwrap .m-sub .m-subitem{display:flex;align-items:center;gap:10px;padding-left:30px;opacity:.85;font-size:.95em;}" +
      ".ca-navwrap .m-sub .m-subitem .brandlogo{width:20px;height:20px;object-fit:contain;flex:0 0 20px;}";
    document.head.appendChild(s);
  }

  function brandAnchor(cls, b, sz) {
    var a = document.createElement("a");
    a.className = cls; a.href = b.href;
    a.innerHTML = '<img class="brandlogo" src="' + b.logo + '" alt="' + b.t + '" width="' + sz + '" height="' + sz + '" loading="lazy"/><span>' + b.t + "</span>";
    return a;
  }

  /* caMenuSync: keep the baked-page nav menus in step with Nav.astro */
  function applyMenu(container, isMobile, removeList, setHref, addList) {
    if (!container) return;
    removeList.forEach(function (rt) { [].slice.call(container.querySelectorAll("a")).forEach(function (a) { if (txt(a) === rt) a.remove(); }); });
    Object.keys(setHref).forEach(function (t2) { [].slice.call(container.querySelectorAll("a")).forEach(function (a) { if (txt(a) === t2) a.setAttribute("href", setHref[t2]); }); });
    addList.forEach(function (item) { var has = [].slice.call(container.querySelectorAll("a")).some(function (a) { return txt(a) === item.t; }); if (!has) { var a = document.createElement("a"); if (!isMobile) a.className = "ddi"; a.href = item.href; a.textContent = item.t; container.appendChild(a); } });
  }
  function syncNavMenu(wrap, label, removeList, setHref, addList) {
    var nis = wrap.querySelectorAll(".navitem");
    for (var i = 0; i < nis.length; i++) { var nl = nis[i].querySelector(".navlink"); if (nl && txt(nl).indexOf(label) === 0) { applyMenu(nis[i].querySelector(".dropdown .dd-inner"), false, removeList, setHref, addList); break; } }
    var accs = wrap.querySelectorAll(".mobilepanel .m-acc");
    for (var k = 0; k < accs.length; k++) { var b = accs[k].querySelector(".m-accbtn"); if (b && txt(b).indexOf(label) === 0) { applyMenu(accs[k].querySelector(".m-sub"), true, removeList, setHref, addList); break; } }
  }

  function run() {
    var wrap = document.querySelector(".ca-navwrap");
    if (!wrap) return;
    if (wrap.querySelector(".ddi-sub")) return; // Astro pages already have it
    injectCss();

    // ---- desktop dropdown ----
    var ddis = wrap.querySelectorAll(".dropdown .dd-inner a");
    for (var i = 0; i < ddis.length; i++) {
      var a = ddis[i];
      if (txt(a) === LABEL) {
        var sub = document.createElement("div"); sub.className = "ddi-sub";
        var parent = document.createElement("a"); parent.className = "ddi ddi-parent";
        parent.href = DEST; parent.innerHTML = LABEL + '<span class="subchev">›</span>';
        var fly = document.createElement("div"); fly.className = "flyout";
        BRANDS.forEach(function (b) { fly.appendChild(brandAnchor("ddi ddi-brand", b, 22)); });
        sub.appendChild(parent); sub.appendChild(fly);
        a.parentNode.replaceChild(sub, a);
        parent.addEventListener("click", function (e) {
          var noHover = window.matchMedia && window.matchMedia("(hover: none)").matches;
          if (noHover && !sub.classList.contains("open")) { e.preventDefault(); e.stopPropagation(); sub.classList.add("open"); }
        });
        break;
      }
    }

    // ---- mobile accordion ----
    var msubs = wrap.querySelectorAll(".mobilepanel .m-sub a");
    for (var j = 0; j < msubs.length; j++) {
      var ma = msubs[j];
      if (txt(ma) === LABEL) {
        ma.setAttribute("href", DEST); // repair dead "#" link
        var after = ma.nextSibling;
        BRANDS.forEach(function (b) { ma.parentNode.insertBefore(brandAnchor("m-subitem", b, 20), after); });
        break;
      }
    }

    // ---- caMenuSync: mirror the Nav.astro menu changes onto baked pages ----
    syncNavMenu(wrap, "Prémium autóbérlés",
      ["Rövid távú bérlés", "Hosszú távú bérlés", "Flotta kezelés", "Feltételek"],
      {},
      [{ t: "Bérlési folyamat", href: "/berlesi-folyamat" }, { t: "Előnyök", href: "/berles-elonyei" }, { t: "Gyakori kérdések", href: "/gyakori-kerdesek" }]);
    syncNavMenu(wrap, "Megvásárolható autóink",
      [],
      { "Előnyök": "/vasarlas-elonyei", "Finanszírozás – lízing": "/finanszirozas-lizing" },
      [{ t: "Gyakori kérdések", href: "/gyakori-kerdesek" }]);
    syncNavMenu(wrap, "Rólunk", [], { "Media": "/media" }, []);
  }

  ready(run);
})();

/* =========================================================================
   Landing-page "stats" cards — mobile layout fix
   On phones the two columns were unequal and overflowed the screen because
   one heading ("5,0 ★ értékelés") was set to white-space:nowrap, forcing its
   column wider than its sibling. Lock the two columns to equal halves and let
   the headings wrap. Harmless on pages without a .stats grid.
   ========================================================================= */
(function () {
  "use strict";
  if (document.getElementById("caStatsFix")) return;
  var s = document.createElement("style"); s.id = "caStatsFix";
  s.textContent =
    "@media (max-width:700px){" +
      ".stats-in{grid-template-columns:repeat(2,minmax(0,1fr))!important;}" +
      ".stat{min-width:0;}" +
      ".stat .n{white-space:normal!important;overflow-wrap:anywhere;}" +
    "}";
  (document.head || document.documentElement).appendChild(s);
})();

/* =========================================================================
   COMING SOON gate — full-site holding page
   The public sees a "Hamarosan" screen (with the hero video). You and your
   team keep full access:
     • Unlock a device once:  https://www.caradvance.hu/?belepes=caradvance-belso
       (this remembers you on that browser; browse normally afterwards)
     • Preview the holding page yourself:  https://www.caradvance.hu/?belepes=0
   SITE LAUNCHED — this gate is disabled (returns immediately below).
   ========================================================================= */
(function () {
  "use strict";
  return; // Coming-soon gate OFF — site is public. Remove this line to re-enable.
  var TOKEN = "caradvance-belso";   // access key — change it if you like
  var KEY = "ca_soon_ok";
  try {
    var p = new URLSearchParams(location.search);
    if (p.has("belepes")) {
      var v = p.get("belepes");
      if (v === "0" || v === "stop" || v === "exit") { try { localStorage.removeItem(KEY); } catch (e) {} }
      else if (v === TOKEN) { try { localStorage.setItem(KEY, "1"); } catch (e) {} }
      p.delete("belepes");
      var qs = p.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }
    var ok = false; try { ok = localStorage.getItem(KEY) === "1"; } catch (e) { ok = false; }
    if (ok) return;                 // whitelisted team member — no overlay
  } catch (e) { return; }           // on any error, never block the site
  if (document.getElementById("caSoon")) return;

  var css = document.createElement("style");
  css.textContent =
    "#caSoon{position:fixed;inset:0;z-index:2147483600;overflow:hidden;background:#0b0b0d;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;}" +
    "#caSoon video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}" +
    "#caSoon .ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,12,.55),rgba(10,10,12,.80));}" +
    "#caSoon .in{position:relative;z-index:2;max-width:640px;padding:32px 24px;color:#fff;}" +
    "#caSoon img{height:54px;width:auto;margin-bottom:26px;}" +
    "#caSoon h1{font-size:clamp(34px,6vw,60px);font-weight:800;letter-spacing:-.02em;margin:0 0 14px;}" +
    "#caSoon p{font-size:clamp(15px,2.4vw,19px);line-height:1.6;color:#d8d8dc;margin:0 auto 26px;max-width:520px;}" +
    "#caSoon .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}" +
    "#caSoon a{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:999px;}" +
    "#caSoon a.wa{background:#25d366;color:#fff;}" +
    "#caSoon a.tel{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.32);}";
  document.head.appendChild(css);

  var wrap = document.createElement("div");
  wrap.id = "caSoon";
  wrap.innerHTML =
    '<video autoplay loop muted playsinline poster="/caradvance-hero-x5-poster.jpg"><source src="/caradvance-hero-x5.mp4" type="video/mp4"></video>' +
    '<div class="ov"></div>' +
    '<div class="in">' +
      '<img src="/caradvance-logo-white.webp" alt="CarAdvance"/>' +
      '<h1>Hamarosan</h1>' +
      '<p>Új weboldalunk hamarosan elindul. Addig is keressen minket bizalommal — prémium autók Németországból: bérlés, vásárlás és import.</p>' +
      '<div class="btns">' +
        '<a class="wa" href="https://wa.me/36302336060" target="_blank" rel="noopener">WhatsApp</a>' +
        '<a class="tel" href="tel:+36302336060">+36 30 233 6060</a>' +
      '</div>' +
    '</div>';
  document.documentElement.style.overflow = "hidden";
  (document.body || document.documentElement).appendChild(wrap);
  var vid = wrap.querySelector("video"); if (vid && vid.play) { vid.play().catch(function () {}); }
})();

/* ── "Érdeklődöm" button + inquiry modal on catalog cards (autoink / berelheto / bizomanyos / home) ── */
(function () {
  if (window.__caInqLoaded) return; window.__caInqLoaded = true;
  var INQ_API = "https://caradvance-chatbot.flat-fire-7e25.workers.dev/api/inquiry";
  var SALES_EMAIL = "info@caradvance.hu";
  function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  function injectCss(){
    if(document.getElementById("caInqCss")) return;
    var s=document.createElement("style"); s.id="caInqCss";
    s.textContent=[
      ".ca-enh .cbtn,.ca-inq,.ca-reszlet{display:block;width:100%;box-sizing:border-box;text-align:center;background:#eef2f8;color:#0F1B2D;font-weight:700;font-size:15px;line-height:1.3;padding:14px;border:0;border-radius:12px;font-family:inherit;text-decoration:none;transition:.15s;}",
      ".ca-inq{cursor:pointer;margin-top:8px;}",
      ".ca-reszlet{margin-top:14px;}",
      "@media(hover:hover){.ca-enh:hover .ca-inq{background:#E2001A;color:#fff;}.ca-enh:hover .cbtn,.ca-enh:hover .ca-reszlet{background:#0F1B2D;color:#fff;}}",
      ".ca-enh{overflow:visible;pointer-events:auto!important;}",
      ".ca-enh .media{border-radius:16px 16px 0 0;overflow:hidden;}",
      ".ca-cinfo{position:relative;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#c9d2e0;color:#fff;font-size:11px;font-weight:700;font-style:italic;cursor:help;margin-left:6px;flex:0 0 auto;vertical-align:middle;}",
      ".ca-cinfo .ca-ctip{position:absolute;bottom:150%;right:0;left:auto;width:230px;white-space:normal;background:#0F1B2D;color:#fff;font-size:12px;font-weight:500;font-style:normal;line-height:1.5;padding:11px 13px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;visibility:hidden;transition:opacity .15s;z-index:40;text-align:left;}",
      ".ca-cinfo:hover .ca-ctip,.ca-cinfo:focus .ca-ctip{opacity:1;visibility:visible;}",
      ".cain-modal[aria-hidden='true']{display:none;}",
      ".cain-modal{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:flex-start;justify-content:center;padding:16px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;}",
      ".cain-back{position:absolute;inset:0;background:rgba(8,12,20,.55);}",
      ".cain-card{position:relative;z-index:1;background:#fff;border-radius:22px;width:min(520px,100%);max-height:calc(100dvh - 32px);overflow:auto;box-shadow:0 30px 80px rgba(8,12,20,.4);padding:22px 22px 24px;margin-top:8px;}",
      ".cain-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;border-radius:10px;background:#eef1f6;color:#141519;font-size:16px;cursor:pointer;}",
      ".cain-head{display:flex;gap:14px;align-items:center;margin-bottom:14px;padding-right:30px;}",
      ".cain-head img{width:150px;height:92px;object-fit:contain;flex:0 0 auto;}",
      ".cain-eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#E2001A;}",
      ".cain-head h3{font-size:20px;font-weight:800;color:#0F1B2D;margin:4px 0 4px;line-height:1.15;}",
      ".cain-sub{font-size:13.5px;color:#5A6B82;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}",
      ".cain-sub .ca-cinfo .ca-ctip{bottom:auto;top:150%;right:0;left:auto;max-width:min(260px,72vw);width:260px;}",
      "@media(max-width:560px){.cain-head{flex-direction:column;align-items:flex-start;padding-right:0;}}",
      ".cain-form{display:flex;flex-direction:column;gap:12px;}",
      ".cain-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}",
      "@media(max-width:460px){.cain-grid{grid-template-columns:1fr;}}",
      ".cain-form input,.cain-form textarea{width:100%;font:inherit;font-size:14.5px;color:#141519;background:#f7f9fc;border:1.5px solid #E6EAF1;border-radius:10px;padding:11px 12px;outline:none;box-sizing:border-box;}",
      ".cain-form input:focus,.cain-form textarea:focus{border-color:#E2001A;background:#fff;}",
      ".cain-consent{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#141519;line-height:1.4;cursor:pointer;}",
      ".cain-consent input{width:18px;height:18px;accent-color:#E2001A;flex:0 0 auto;margin-top:1px;}",
      ".cain-consent a{color:#E2001A;font-weight:700;}",
      ".cain-toggle{display:flex;gap:6px;background:#eef1f6;border-radius:12px;padding:5px;}",
      ".cain-tgl{flex:1;border:0;background:transparent;font-family:inherit;font-weight:700;font-size:14px;color:#5A6B82;padding:11px;border-radius:9px;cursor:pointer;}",
      ".cain-tgl.active{background:#E2001A;color:#fff;}",
      ".cain-block{border:1px solid #E6EAF1;border-radius:14px;padding:14px 14px 12px;}",
      ".cain-flabel{font-size:14.5px;font-weight:800;color:#141519;margin-bottom:8px;}",
      ".cain-sublabel{font-size:13px;font-weight:800;color:#141519;margin:14px 0 2px;}",
      ".cain-radio{display:flex;align-items:center;gap:10px;padding:9px 0;font-size:14px;color:#141519;cursor:pointer;border-top:1px solid #E6EAF1;}",
      ".cain-radio:first-of-type{border-top:0;}",
      ".cain-radio input{width:18px;height:18px;accent-color:#E2001A;flex:0 0 auto;}",
      ".cain-subblock{margin-top:8px;padding-top:6px;border-top:1px dashed #E6EAF1;}",
      ".cain-msg{display:none;font-size:14px;font-weight:600;border-radius:10px;padding:10px 12px;}",
      ".cain-msg.err{display:block;background:#fdeaec;color:#b3121f;}",
      ".cain-msg.ok{display:block;background:#e8f7ee;color:#177a3d;}",
      ".cain-submit{background:#E2001A;color:#fff;border:0;border-radius:12px;padding:14px;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;}",
      ".cain-note{font-size:12.5px;color:#5A6B82;text-align:center;margin:0;}"
    ].join("");
    document.head.appendChild(s);
  }

  var modal, mImg, mTitle, mSub, mCar, mForm, mMsg;
  function showMsg(k,t){ if(mMsg){ mMsg.className="cain-msg "+k; mMsg.textContent=t; } }
  function buildModal(){
    if(modal) return;
    modal=document.createElement("div"); modal.className="cain-modal"; modal.setAttribute("aria-hidden","true");
    modal.innerHTML=
      '<div class="cain-back" data-close></div>'+
      '<div class="cain-card" role="dialog" aria-modal="true">'+
        '<button class="cain-x" type="button" data-close aria-label="Bezárás">&#10005;</button>'+
        '<div class="cain-head"><img alt=""/><div><div class="cain-eyebrow">Érdeklődés</div><h3></h3><div class="cain-sub"></div></div></div>'+
        '<form class="cain-form" novalidate>'+
          '<input type="hidden" name="car"/>'+
          '<input type="hidden" name="buyer" value="Magánszemély"/>'+
          '<div class="cain-toggle"><button type="button" class="cain-tgl active" data-buyer="Magánszemély">Magánszemélyként</button><button type="button" class="cain-tgl" data-buyer="Cég">Cégként</button></div>'+
          '<div class="cain-block">'+
            '<div class="cain-flabel">Hogyan szeretnéd megvásárolni?</div>'+
            '<label class="cain-radio"><input type="radio" name="mode" class="cain-mode1" value="19% német áfával, Németországból (Caradvance GmbH)"/><span class="cain-mode1lbl">19% német áfával, Németországból (Caradvance GmbH)</span></label>'+
            '<label class="cain-radio"><input type="radio" name="mode" value="27% magyar áfával, BH Group Zrt."/><span>27% magyar áfával, a BH Group Zrt.-n keresztül</span></label>'+
            '<div class="cain-sublabel">Fizetés módja</div>'+
            '<label class="cain-radio"><input type="radio" name="payment" value="Egy összegben"/><span>Egy összegben</span></label>'+
            '<label class="cain-radio"><input type="radio" name="payment" value="Finanszírozással"/><span>Finanszírozással</span></label>'+
            '<div class="cain-subblock cain-fin" style="display:none">'+
              '<div class="cain-sublabel">Finanszírozás módja</div>'+
              '<label class="cain-radio"><input type="radio" name="financing" value="Segítséget kérek (Euro Leasing / Mercantil Bank)"/><span>Kérek segítséget — Euro Leasing vagy Mercantil Bank</span></label>'+
              '<label class="cain-radio"><input type="radio" name="financing" value="Saját finanszírozás"/><span>Saját finanszírozásom van</span></label>'+
            '</div>'+
          '</div>'+
          '<div class="cain-grid cain-company" style="display:none"><input type="text" name="company" placeholder="Cégnév *"/><input type="text" name="taxid" placeholder="Adószám"/></div>'+
          '<div class="cain-grid"><input type="text" name="lastname" placeholder="Vezetéknév *"/><input type="text" name="firstname" placeholder="Keresztnév *"/></div>'+
          '<div class="cain-grid"><input type="tel" name="phone" placeholder="Telefonszám"/><input type="email" name="email" placeholder="E-mail *"/></div>'+
          '<textarea name="message" rows="3" placeholder="Megjegyzés, kérdés…"></textarea>'+
          '<label class="cain-consent"><input type="checkbox" name="consent"/><span>Elfogadom az <a href="/adatkezeles" target="_blank" rel="noopener">adatkezelési tájékoztatót</a>. *</span></label>'+
          '<div class="cain-msg"></div>'+
          '<button type="submit" class="cain-submit">Érdeklődés elküldése</button>'+
          '<p class="cain-note">Felvesszük veled a kapcsolatot a megadott elérhetőségen.</p>'+
        '</form>'+
      '</div>';
    (document.body||document.documentElement).appendChild(modal);
    mImg=modal.querySelector(".cain-head img"); mTitle=modal.querySelector(".cain-head h3"); mSub=modal.querySelector(".cain-sub");
    mForm=modal.querySelector("form"); mCar=modal.querySelector('input[name=car]'); mMsg=modal.querySelector(".cain-msg");
    modal.addEventListener("click", function(e){ if(e.target && e.target.hasAttribute && e.target.hasAttribute("data-close")) closeModal(); });
    document.addEventListener("keydown", function(e){ if(e.key==="Escape" && modal.getAttribute("aria-hidden")==="false") closeModal(); });
    [].forEach.call(modal.querySelectorAll(".cain-tgl"), function(t){ t.addEventListener("click", function(){ setBuyer(t.getAttribute("data-buyer")); }); });
    mForm.addEventListener("change", function(e){ if(e.target && e.target.name==="payment"){ var f=modal.querySelector(".cain-fin"); if(f) f.style.display=(e.target.value==="Finanszírozással")?"":"none"; } });
    mForm.addEventListener("submit", onSubmit);
  }
  function setBuyer(v){
    if(!mForm) return;
    var be=mForm.querySelector('input[name=buyer]'); if(be) be.value=v;
    [].forEach.call(modal.querySelectorAll(".cain-tgl"), function(t){ t.classList.toggle("active", t.getAttribute("data-buyer")===v); });
    var isCo=(v==="Cég");
    var comp=modal.querySelector(".cain-company"); if(comp) comp.style.display=isCo?"":"none";
    var m1=modal.querySelector(".cain-mode1"), m1l=modal.querySelector(".cain-mode1lbl");
    if(m1&&m1l){ var txt=isCo?"Nettó EUR-ban, Németországból (Caradvance GmbH)":"19% német áfával, Németországból (Caradvance GmbH)"; m1.value=txt; m1l.textContent=txt; }
  }
  function openModal(d){
    buildModal(); mForm.reset();
    setBuyer("Magánszemély");
    var fin=modal.querySelector(".cain-fin"); if(fin) fin.style.display="none";
    if(mImg){ mImg.src=d.img||""; mImg.alt=d.name||""; }
    mTitle.textContent=d.name||"";
    mSub.innerHTML="";
    var pspan=document.createElement("span"); pspan.textContent=d.price||""; mSub.appendChild(pspan);
    if(d.price){
      var inf=document.createElement("span"); inf.className="ca-cinfo"; inf.setAttribute("tabindex","0"); inf.textContent="i";
      var tip=document.createElement("span"); tip.className="ca-ctip"; tip.textContent=infoText(d.kind); inf.appendChild(tip);
      mSub.appendChild(inf);
    }
    mCar.value=d.name||"";
    showMsg("","");
    modal.setAttribute("aria-hidden","false"); document.documentElement.style.overflow="hidden";
  }
  function closeModal(){ modal.setAttribute("aria-hidden","true"); document.documentElement.style.overflow=""; }
  function onSubmit(e){
    e.preventDefault();
    var fd=new FormData(mForm);
    var last=(fd.get("lastname")||"").trim(), first=(fd.get("firstname")||"").trim(), email=(fd.get("email")||"").trim();
    var buyer=fd.get("buyer"), company=(fd.get("company")||"").trim(), mode=fd.get("mode"), payment=fd.get("payment");
    if(!mode){ showMsg("err","Kérlek válaszd ki, hogyan szeretnéd megvásárolni az autót."); return; }
    if(!payment){ showMsg("err","Kérlek válaszd ki a fizetés módját."); return; }
    if(payment==="Finanszírozással" && !fd.get("financing")){ showMsg("err","Kérlek válaszd ki a finanszírozás módját."); return; }
    if(buyer==="Cég" && !company){ showMsg("err","Kérlek add meg a cég nevét."); return; }
    if(!last||!first||!email){ showMsg("err","Kérlek add meg a vezeték- és keresztneved, valamint az e-mail címed."); return; }
    if(!fd.get("consent")){ showMsg("err","Kérlek fogadd el az adatkezelési tájékoztatót."); return; }
    var btn=mForm.querySelector(".cain-submit"); btn.disabled=true; btn.textContent="Küldés…";
    fd.append("kind","Érdeklődés (készletautó)");
    fetch(INQ_API,{method:"POST",body:fd}).then(function(r){ if(!r.ok) throw 0; }).then(function(){
      showMsg("ok","Köszönjük! Megkaptuk az érdeklődésed — hamarosan keresünk.");
      mForm.reset(); setBuyer("Magánszemély"); btn.disabled=false; btn.textContent="Érdeklődés elküldése";
    }).catch(function(){
      var body="Autó: "+(fd.get("car")||"")+"\nVásárló típusa: "+(buyer||"")+"\nVásárlás módja: "+(mode||"")+"\nFizetés: "+(payment||"")+"\nFinanszírozás: "+(fd.get("financing")||"")+"\nNév: "+last+" "+first+"\nE-mail: "+email+"\nTelefon: "+(fd.get("phone")||"")+"\nCég: "+company+"\nAdószám: "+(fd.get("taxid")||"")+"\nMegjegyzés: "+(fd.get("message")||"");
      window.location.href="mailto:"+SALES_EMAIL+"?subject="+encodeURIComponent("Érdeklődés – "+(fd.get("car")||""))+"&body="+encodeURIComponent(body);
      showMsg("ok","Megnyitottuk az e-mail vázlatot az érdeklődéshez.");
      btn.disabled=false; btn.textContent="Érdeklődés elküldése";
    });
  }

  function priceOf(card){
    var prow=card.querySelector(".pricerow")||card.querySelector(".rentrow");
    if(!prow) return "";
    var parts=[].slice.call(prow.children).filter(function(c){return !(c.classList&&c.classList.contains("ca-cinfo"));}).map(function(c){return (c.textContent||"").replace(/\s+/g," ").trim();}).filter(Boolean);
    return parts.length?parts.join(" · "):(prow.textContent||"").replace(/\s+/g," ").trim();
  }
  function cardKind(card){ return card.classList.contains("bizcard") ? "biz" : (card.querySelector(".rentrow") ? "rent" : "sale"); }
  function cardHref(card){ if(card.tagName==="A") return card.getAttribute("href")||""; var l=card.querySelector('a[href*="/auto/"]'); return l?(l.getAttribute("href")||""):""; }
  function cardData(card){
    var t=card.querySelector(".title"), img=card.querySelector(".media img");
    return { name:t?t.textContent.replace(/\s+/g," ").trim():"", img:img?img.getAttribute("src"):"", price:priceOf(card), kind:cardKind(card) };
  }
  function infoText(kind){
    var fx="";
    try{ var m=(document.body.textContent||"").match(/1\s*€\s*=\s*([\d\s.,]+)\s*Ft/); if(m) fx=m[1].replace(/\s+/g," ").trim(); }catch(e){}
    if(kind==="biz") return "A feltüntetett ár forintban értendő, áfás ár, mivel az eladó magyarországi. Az euró ár csak tájékoztató jellegű, élő árfolyammal.";
    var t="A feltüntetett árak nettó árak (áfa nélkül). A forint árak élő árfolyammal számolódnak, óránként frissülnek"+(fx?(" (1 € = "+fx+" Ft)"):"")+".";
    if(kind==="rent") t+=" A bérleti díj havi 2 000 km futáskeretre vonatkozik.";
    return t;
  }
  function enhance(card){
    var body=card.querySelector(".body"); if(!body) return;
    var prow=card.querySelector(".pricerow")||card.querySelector(".rentrow");
    if(!prow) return;                       // not a car card
    card.classList.add("ca-enh");
    if(body.querySelector(".ca-inq")) return;
    var kind=cardKind(card);
    if(!prow.querySelector(".ca-cinfo")){
      var info=document.createElement("span"); info.className="ca-cinfo"; info.setAttribute("tabindex","0"); info.textContent="i";
      var tip=document.createElement("span"); tip.className="ca-ctip"; tip.textContent=infoText(kind); info.appendChild(tip);
      info.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); });
      prow.appendChild(info);
    }
    if(!card.querySelector(".cbtn")){
      var href=cardHref(card);
      var r=href?document.createElement("a"):document.createElement("span");
      r.className="ca-reszlet"; r.textContent="Részletek"; if(href) r.setAttribute("href",href);
      body.appendChild(r);
    }
    var inq=document.createElement("button"); inq.type="button"; inq.className="ca-inq"; inq.textContent="Érdeklődöm";
    inq.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); openModal(cardData(card)); });
    body.appendChild(inq);
  }
  function scan(){ [].slice.call(document.querySelectorAll(".card")).forEach(enhance); }

  ready(function(){
    injectCss(); scan();
    var t=0;
    var mo=new MutationObserver(function(){ clearTimeout(t); t=setTimeout(scan, 120); });
    mo.observe(document.body||document.documentElement, {childList:true, subtree:true});
    window.addEventListener("load", scan);
    [400,1000,2000,3500,6000].forEach(function(ms){ setTimeout(scan, ms); });
  });
})();

/* ── Homepage service-block buttons + MINI brand logo (client-side, no HTML edit) ── */
(function () {
  "use strict";
  if (window.__caHomeBlocks) return; window.__caHomeBlocks = true;
  function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  function txt(el){ return (el && el.textContent || "").replace(/\s+/g," ").trim(); }

  var SETS = [
    { match:/Prémium autóbérlés/, btns:[["Autóink","/berelheto","btn"],["Új autó","/beszerzesi-folyamat/#","btn btn-red"],["Folyamat","/berlesi-folyamat","btn btn-outline"],["Előnyök","/berles-elonyei","btn btn-outline"]] },
    { match:/Prémium autó eladás/, btns:[["Autóink","/autoink/","btn"],["Új autó","/egyedi-auto-rendeles","btn btn-red"],["Finanszírozás","/finanszirozas-lizing","btn btn-outline"],["Előnyök","/vasarlas-elonyei","btn btn-outline"]] },
    { match:/Autóimport/, btns:[["Autó rendelés","/auto-rendeles","btn"],["Folyamat","/beszerzesi-folyamat","btn btn-outline"],["Előnyök","/elonyok","btn btn-outline"],["Egyedül vagy velünk?","/egyedul-vagy-velunk","btn btn-outline"]] },
    { match:/Használtautó-eladás|Eladjuk az autódat/, btns:[["Autóink","/bizomanyos","btn"],["Eladom az autómat","/eladom","btn btn-red"],["Jótékonyság","/jotekonysag","btn btn-outline"],["Folyamat","/ertekesitesi-folyamat","btn btn-outline"]] }
  ];

  function injectHomeCss(){
    if(document.getElementById("caHomeCss")) return;
    var st=document.createElement("style"); st.id="caHomeCss";
    st.textContent=".ca-import .svc-media{background:#e8e4df!important}.ca-import .svc-media img{object-fit:contain!important}.ca-eladjuk.charity-accent{border-top:0!important}.stat-logos.ca-brandrow{justify-content:center}.stat-logos .ca-brk{flex-basis:100%;width:100%;height:0;margin:0}";
    (document.head||document.documentElement).appendChild(st);
  }

  function buildRow(btns){
    var row=document.createElement("div"); row.className="btn-row";
    btns.forEach(function(b){ var a=document.createElement("a"); a.className=b[2]; a.href=b[1]; a.textContent=b[0]; row.appendChild(a); });
    return row;
  }

  function apply(){
    injectHomeCss();
    // 1) Prémium márkák logo row: ensure MINI, then order to BMW·Mercedes / Audi·MINI / Porsche
    [].slice.call(document.querySelectorAll(".stat-logos")).forEach(function(row){
      var alts=[].slice.call(row.querySelectorAll("img")).map(function(i){ return i.getAttribute("alt"); });
      if(!(alts.indexOf("BMW")>-1 && alts.indexOf("Porsche")>-1)) return; // only the brand row
      if(alts.indexOf("MINI")===-1){
        var mini=document.createElement("img"); mini.src="/mini-logo.webp"; mini.alt="MINI"; mini.loading="lazy"; mini.setAttribute("style","height:28px;width:auto");
        row.appendChild(mini);
      }
      if(row.getAttribute("data-caorder")) return;
      row.setAttribute("data-caorder","1");
      row.classList.add("ca-brandrow");
      var byAlt=function(a){ return [].slice.call(row.querySelectorAll("img")).filter(function(i){ return i.getAttribute("alt")===a; })[0]; };
      var brk=function(){ var s=document.createElement("span"); s.className="ca-brk"; return s; };
      ["BMW","Mercedes-Benz","Porsche","Audi","MINI"].forEach(function(a,idx){
        var el=byAlt(a); if(!el) return;
        row.appendChild(el);                            // move into desired order
        if(idx===2) row.appendChild(brk());             // wrap after Porsche → row 2: Audi, MINI
      });
    });
    // 2) Rewrite the buttons of each service card, matched by its tag text
    [].slice.call(document.querySelectorAll(".svc-grid .card.svc, .card.svc")).forEach(function(card){
      if(card.getAttribute("data-cahome")) return;
      var label=txt(card.querySelector(".tag")) || txt(card.querySelector("h3"));
      var set=null;
      for(var i=0;i<SETS.length;i++){ if(SETS[i].match.test(label)){ set=SETS[i]; break; } }
      if(!set) return;
      card.setAttribute("data-cahome","1");
      // per-block tweaks
      if(/Autóimport/.test(label)){
        card.classList.add("ca-import");
        var hc=card.querySelector(".plat-heycar"); if(hc) hc.remove();
      }
      if(/Használtautó-eladás|Eladjuk az autódat/.test(label)){ card.classList.add("ca-eladjuk"); }
      // remove any existing button rows and any direct-child standalone .btn
      [].slice.call(card.querySelectorAll(".btn-row")).forEach(function(e){ e.remove(); });
      [].slice.call(card.children).forEach(function(ch){ if(ch.tagName==="A" && ch.classList.contains("btn")) ch.remove(); });
      card.appendChild(buildRow(set.btns));
    });
  }

  ready(apply);
  [300,900,2000,4000].forEach(function(ms){ setTimeout(apply, ms); });
})();
