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
      [{ t: "Bérlési folyamat", href: "#" }, { t: "Előnyök", href: "/berles-elonyei" }, { t: "Gyakori kérdések", href: "/gyakori-kerdesek" }]);
    syncNavMenu(wrap, "Megvásárolható autóink",
      [],
      { "Előnyök": "/vasarlas-elonyei" },
      [{ t: "Gyakori kérdések", href: "/gyakori-kerdesek" }]);
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
   TO LAUNCH THE SITE: delete this whole block and re-upload the file.
   ========================================================================= */
(function () {
  "use strict";
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
