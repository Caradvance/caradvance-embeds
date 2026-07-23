#!/usr/bin/env node
/*
 * CarAdvance static site generator (SEO-native).
 * Reads the Google Sheet (gviz CSV) -> writes real, pre-rendered HTML:
 *   /index.html                     (home: hero + stats + featured)
 *   /autoink/index.html             (catalog: every active car in HTML)
 *   /auto/<slug>/index.html         (one real page per car + schema.org Vehicle)
 *   /sitemap.xml, /robots.txt
 *
 * Design tokens + card style match the approved live design.
 * All content is baked into the HTML (no iframes, no client-fetch for content) => strong SEO.
 * A small client script only refreshes the EUR->HUF rate; prices already render server-side.
 *
 * Usage:
 *   node generate.mjs                 # fetch live sheet, write to ./build
 *   node generate.mjs --csv file.csv  # use a local CSV (offline test)
 *   OUT=dist node generate.mjs        # change output dir
 */
import { promises as fs } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------- config
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y/gviz/tq?tqx=out:csv";
// Absolute base used for <link rel=canonical>, OG tags and sitemap.
// After you point caradvance.hu at GitHub Pages, change this to "https://caradvance.hu".
const SITE_BASE = (process.env.SITE_BASE || "https://caradvance.hu").replace(/\/$/, "");
const OUT = process.env.OUT || "build";
const BRAND = "CarAdvance";
const CONTACT_EMAIL = "info@caradvance.hu";
const DEFAULT_RATE = 402; // EUR->HUF fallback if live rate can't be fetched at build time

// --------------------------------------------------------------- helpers
const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const attr = (s) => esc(s);
const slugify = (m) =>
  String(m).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const nEur = (v) => Number(String(v == null ? "" : v).replace(/[^\d.]/g, "")) || 0;
const fmtHUF = (v) => v.toLocaleString("hu-HU") + " Ft";
const fmtEUR = (v) => v.toLocaleString("hu-HU") + " €";

function driveImg(u) {
  u = String(u || "").trim();
  if (!u) return "";
  let m = u.match(/\/d\/([-\w]{20,})/) || u.match(/[?&]id=([-\w]{20,})/);
  if (m) return "https://lh3.googleusercontent.com/d/" + m[1] + "=w1600";
  if (/^[-\w]{25,}$/.test(u)) return "https://lh3.googleusercontent.com/d/" + u + "=w1600";
  return u;
}
function galleryOf(c) {
  const list = String(c.galeria || "")
    .split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).map(driveImg);
  const main = driveImg(c.kep_url) || list[0] || "";
  const all = [];
  if (main) all.push(main);
  for (const g of list) if (g && !all.includes(g)) all.push(g);
  return all;
}
// Equipment: "#Category | item | item | #Category2 | item ..."
function equipmentOf(c) {
  const parts = String(c.felszereltseg || "").split("|").map((s) => s.trim()).filter(Boolean);
  const cats = [];
  let cur = null;
  for (const p of parts) {
    if (p.startsWith("#")) { cur = { title: p.replace(/^#/, "").trim(), items: [] }; cats.push(cur); }
    else { if (!cur) { cur = { title: "Felszereltség", items: [] }; cats.push(cur); } cur.items.push(p); }
  }
  return cats.filter((c) => c.items.length);
}
function priceOf(c, rate) {
  const eur = nEur(c.vetel_eur);
  const hufUp = (e) => Math.ceil((Number(e) || 0) * rate / 10000) * 10000;
  const main = hufUp(eur);
  const netto = nEur(c.vetel_eur_netto) || eur / 1.19;
  const huGross = hufUp(netto * 1.27);
  const save = huGross - main;
  return { eur, main, huGross, save };
}
const isActive = (c) => (c.aktiv || "igen").toLowerCase() !== "nem";
const isOwn = (c) => (c.sajat || "").toLowerCase() === "igen";
const specStr = (c) => [c.km, c.valto, c.uzemanyag].filter(Boolean).join(" · ");

// CSV parser (quoted fields, embedded newlines)
function parseCSV(t) {
  const rows = []; let i = 0, f = "", row = [], q = false;
  while (i < t.length) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else { if (ch === '"') q = true; else if (ch === ",") { row.push(f); f = ""; }
      else if (ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (ch === "\r") {} else f += ch; }
    i++;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.some((x) => x && x.trim())).map((r) => {
    const o = {}; head.forEach((h, i) => (o[h] = (r[i] || "").trim())); return o;
  });
}

async function getRate() {
  const apis = [
    ["https://api.frankfurter.app/latest?from=EUR&to=HUF", (d) => d?.rates?.HUF],
    ["https://open.er-api.com/v6/latest/EUR", (d) => d?.rates?.HUF],
  ];
  for (const [url, pick] of apis) {
    try {
      const ctl = AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined;
      const r = await fetch(url, ctl ? { signal: ctl } : {});
      if (!r.ok) continue;
      const v = pick(await r.json());
      if (v && v > 0) return Math.round(v);
    } catch (_) {}
  }
  return DEFAULT_RATE;
}

// --------------------------------------------------------------- shared UI
const FONT =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">';

const BASE_CSS = `
:root{--font:'Plus Jakarta Sans',system-ui,sans-serif;--navy:#0B0B0D;--red:#E2001A;--ink:#141519;--muted:#5A6B82;--line:#E6EAF1;--bg:#F4F7FB;--soft:#EEF1F6;--radius:16px;--navh:80px}
*{box-sizing:border-box}html,body{margin:0;width:100%;max-width:100vw;overflow-x:clip}
body{font-family:var(--font);background:var(--bg);color:var(--ink);line-height:1.5}
a{color:inherit}
img{max-width:100%}
.wrap{width:100%;max-width:1160px;margin:0 auto;padding:28px 16px}
.btn{display:inline-block;text-align:center;font-weight:700;padding:13px 22px;border-radius:999px;text-decoration:none;cursor:pointer;transition:background .15s,color .15s}
.btn-primary{background:var(--navy);color:#fff}.btn-primary:hover{background:#000}
.btn-red{background:var(--red);color:#fff}.btn-red:hover{filter:brightness(.94)}
.btn-soft{background:var(--soft);color:var(--ink)}.btn-soft:hover{background:var(--navy);color:#fff}
/* header/nav */
.ca-navwrap{position:sticky;top:0;z-index:1000;display:flex;justify-content:center;padding:20px 14px 0}
.ca-nav{position:relative;width:100%;max-width:1240px;display:flex;align-items:center;gap:14px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 10px 8px 20px;box-shadow:0 14px 40px rgba(8,8,10,.20)}
.ca-nav .brand{display:flex;align-items:center;flex-shrink:0;text-decoration:none}.ca-nav .brand img{height:30px;width:auto;display:block}
.ca-nav .menu{list-style:none;display:flex;align-items:center;gap:6px;margin:0;padding:0;flex:1;justify-content:center}
.navitem{position:relative}
.navlink{border:0;background:transparent;font:inherit;font-weight:700;font-size:15px;color:var(--ink);padding:12px 15px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:color .15s;text-decoration:none}
.navlink .chev{font-size:13px;color:var(--muted);transition:transform .15s}
.navitem:hover .navlink{color:var(--red)}.navitem:hover .navlink .chev{transform:rotate(180deg);color:var(--red)}
.dropdown{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(4px);min-width:236px;padding-top:12px;opacity:0;visibility:hidden;transition:opacity .16s,transform .16s;z-index:1001}
.navitem:hover .dropdown{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
.dd-inner{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 50px rgba(8,8,10,.18);padding:8px;display:flex;flex-direction:column}
.ddi{display:block;padding:10px 14px;border-radius:10px;text-decoration:none;color:var(--ink);font-weight:600;font-size:14px;white-space:nowrap;transition:.12s}
.ddi:hover{background:#F4F7FB;color:var(--red)}
.navright{display:flex;align-items:center;gap:12px;flex-shrink:0}
.kapcsolat{display:inline-flex;align-items:center;gap:8px;background:var(--navy);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:999px;white-space:nowrap;transition:transform .15s,box-shadow .15s,background .15s;box-shadow:0 6px 18px rgba(11,11,13,.22)}
.kapcsolat::after{content:"→";font-size:15px;transition:transform .15s}
.kapcsolat:hover{background:var(--red);box-shadow:0 8px 22px rgba(226,0,26,.4);transform:translateY(-1px)}.kapcsolat:hover::after{transform:translateX(3px)}
.navflag{width:30px;height:30px;border-radius:50%;flex:0 0 auto;background-size:cover;background-position:center;box-shadow:0 0 0 1px rgba(11,11,13,.12),0 2px 6px rgba(0,0,0,.15)}
.burger{display:none;flex-direction:column;justify-content:center;gap:4px;width:44px;height:44px;border:1px solid var(--line);background:#F4F7FB;border-radius:12px;cursor:pointer;padding:0}
.burger span{display:block;width:20px;height:2px;background:var(--ink);margin:0 auto;border-radius:2px;transition:.2s}
.ca-navwrap.open .burger span:nth-child(1){transform:translateY(6px) rotate(45deg)}
.ca-navwrap.open .burger span:nth-child(2){opacity:0}
.ca-navwrap.open .burger span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
.mobilepanel{display:none;position:absolute;top:calc(100% + 8px);left:14px;right:14px;background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 24px 60px rgba(8,8,10,.24);padding:10px;max-height:76vh;overflow:auto;z-index:1001}
.ca-navwrap.open .mobilepanel{display:block}
.m-acc{border-bottom:1px solid var(--line)}
.m-accbtn{width:100%;display:flex;justify-content:space-between;align-items:center;background:none;border:0;font:inherit;font-weight:700;font-size:16px;color:var(--ink);padding:15px 12px;cursor:pointer}
.m-plus{font-size:20px;color:var(--muted);font-weight:400}.m-acc.open .m-plus{transform:rotate(45deg)}
.m-sub{display:none;flex-direction:column;padding:0 12px 10px}.m-acc.open .m-sub{display:flex}
.m-sub a{padding:9px 8px;text-decoration:none;color:var(--muted);font-weight:600;font-size:14.5px}.m-sub a:hover{color:var(--red)}
.m-kapcsolat{display:block;text-align:center;background:var(--navy);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:15px;border-radius:999px;margin:12px 6px 6px}
@media(max-width:1024px){.ca-nav .menu{display:none}.kapcsolat{display:none}.navflag{display:none}.burger{display:flex}.ca-nav{gap:10px;padding:8px 10px}.navright{margin-left:auto}}
/* footer */
.footer{background:var(--navy);color:#cfd6e2;margin-top:56px}
.footer-in{max-width:1160px;margin:0 auto;padding:40px 20px 28px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px}
@media(max-width:760px){.footer-in{grid-template-columns:1fr}}
.footer h4{color:#fff;font-size:15px;margin:0 0 12px}
.footer a{color:#cfd6e2;text-decoration:none;display:block;margin:7px 0;font-size:14px}
.footer a:hover{color:#fff}
.footer .brand{height:40px;width:auto;display:block;margin-bottom:4px}
.footer .copy{border-top:1px solid rgba(255,255,255,.12);text-align:center;padding:16px;font-size:12.5px;color:#8b95a7}
`;

function navHtml(rel) {
  const cat = rel + "autoink/";
  const items = [
    ["Prémium autóbérlés", [["Bérelhető autóink", "#"], ["Rövid távú bérlés", "#"], ["Hosszú távú bérlés", "#"], ["Flotta kezelés", "#"], ["Feltételek", "#"]]],
    ["Megvásárolható autóink", [["Autóink", cat], ["Új autóink – egyedi rendelés", "#"], ["Finanszírozás – lízing", "#"], ["Előnyök", "#"]]],
    ["Bizományos értékesítés", [["Autóink", cat], ["Eladom az autómat", "#"], ["Jótékonyság", "#"], ["Értékesítési folyamat", "#"], ["Gyakori kérdések", "#"]]],
    ["Import", [["Autó rendelés", "#"], ["Beszerzési folyamat", "#"], ["Előnyök", "#"], ["Referenciák", "#"]]],
    ["Rólunk", [["Miért mi?", "#"], ["Caradvance Garancia", "#"], ["Caradvance Hungary", "#"], ["Referenciák", "#"], ["Partnereink", "#"], ["Media", "#"], ["Blog", "#"]]],
  ];
  const desktop = items.map(([label, subs]) =>
    `<li class="navitem"><button class="navlink" type="button">${esc(label)}<span class="chev">⌄</span></button><div class="dropdown"><div class="dd-inner">${subs.map(([t, h]) => `<a class="ddi" href="${attr(h)}">${esc(t)}</a>`).join("")}</div></div></li>`).join("");
  const mobile = items.map(([label, subs]) =>
    `<div class="m-acc"><button class="m-accbtn" type="button">${esc(label)}<span class="m-plus">+</span></button><div class="m-sub">${subs.map(([t, h]) => `<a href="${attr(h)}">${esc(t)}</a>`).join("")}</div></div>`).join("");
  return `<div class="ca-navwrap"><nav class="ca-nav" aria-label="Főmenü">
  <a class="brand" href="${rel}"><img src="${rel}caradvance-logo.webp" alt="CarAdvance — the automotive people" width="403" height="133"></a>
  <ul class="menu">${desktop}</ul>
  <div class="navright">
    <a class="kapcsolat" href="mailto:${CONTACT_EMAIL}">Kapcsolat</a>
    <span class="navflag" role="img" aria-label="Magyar" style="background-image:url(https://flagcdn.com/w80/hu.png)"></span>
    <button class="burger" type="button" aria-label="Menü"><span></span><span></span><span></span></button>
  </div>
</nav>
<div class="mobilepanel">${mobile}<a class="m-kapcsolat" href="mailto:${CONTACT_EMAIL}">Kapcsolat</a></div>
</div>`;
}
function footerHtml(rel) {
  return `<footer class="footer"><div class="footer-in">
  <div><img class="brand" src="${rel}caradvance-logo-white.webp" alt="CarAdvance" width="403" height="133">
    <p style="margin:12px 0 0;max-width:34ch;font-size:14px">Prémium autók Németországból — bérlés, megvásárolható autók, import és bizományos értékesítés.</p></div>
  <div><h4>Menü</h4>
    <a href="${rel}autoink/">Megvásárolható autóink</a>
    <a href="${rel}#berles">Prémium autóbérlés</a>
    <a href="${rel}#bizomany">Bizományos értékesítés</a>
    <a href="${rel}#import">Import</a></div>
  <div><h4>Kapcsolat</h4>
    <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    <a href="${rel}#rolunk">Rólunk</a></div>
</div><div class="copy">© ${new Date().getFullYear()} ${BRAND} · BH Group</div></footer>`;
}

// EUR->HUF live refresh (content already server-rendered; this only fine-tunes prices)
const FX_SCRIPT = `<script>
(function(){var R=${DEFAULT_RATE};
function up(e){var eur=+e.getAttribute('data-eur')||0,net=+e.getAttribute('data-net')||0;
 var main=Math.ceil(eur*R/10000)*10000, gross=Math.ceil((net||eur/1.19)*1.27*R/10000)*10000, save=gross-main;
 var f=function(v){return v.toLocaleString('hu-HU')+' Ft'};
 var mE=e.querySelector('[data-main]'); if(mE)mE.textContent=f(main);
 var cE=e.querySelector('[data-cross]'); if(cE&&save>0)cE.textContent=f(gross);
 var sE=e.querySelector('[data-save]'); if(sE&&save>0)sE.textContent='−'+f(save);}
function all(){document.querySelectorAll('[data-eur]').forEach(up);}
fetch('https://api.frankfurter.app/latest?from=EUR&to=HUF',{cache:'no-store'})
 .then(function(r){return r.json()}).then(function(d){if(d&&d.rates&&d.rates.HUF){R=Math.round(d.rates.HUF);all();var rv=document.getElementById('ratev');if(rv)rv.textContent=R;}}).catch(function(){});
})();
</script>`;

const NAV_SCRIPT = `<script>
(function(){var w=document.querySelector('.ca-navwrap');if(!w)return;
var b=w.querySelector('.burger');if(b)b.addEventListener('click',function(){w.classList.toggle('open');});
w.querySelectorAll('.m-accbtn').forEach(function(x){x.addEventListener('click',function(){x.parentElement.classList.toggle('open');});});})();
</script>`;

function page({ title, desc, canonical, rel, css, body, head = "", bodyClass = "" }) {
  return `<!doctype html><html lang="hu"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${attr(canonical)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${attr(canonical)}"><meta property="og:locale" content="hu_HU">
<meta name="twitter:card" content="summary_large_image">
${FONT}
<style>${BASE_CSS}${css || ""}</style>
${head}
</head><body class="${bodyClass}">
${navHtml(rel)}
${body}
${footerHtml(rel)}
${NAV_SCRIPT}
${FX_SCRIPT}
</body></html>`;
}

// --------------------------------------------------------------- car card
function cardCss() {
  return `
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
@media(max-width:920px){.grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;position:relative;text-decoration:none;color:inherit;transition:transform .18s,box-shadow .18s}
.card:hover{transform:translateY(-3px);box-shadow:0 16px 36px rgba(8,8,10,.12);border-color:#d6deea}
.media{aspect-ratio:16/10;background:linear-gradient(135deg,#1A1B1F,#26272C);position:relative;overflow:hidden}
.media img{width:100%;height:100%;object-fit:cover;display:block}
.media .ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#7a828f;font-size:12px}
.own{position:absolute;top:12px;left:12px;background:#fff;border-radius:999px;padding:6px 11px;font-size:11px;font-weight:800;color:var(--navy);box-shadow:0 4px 12px rgba(8,8,10,.25)}
.body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1}
.meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.cond{background:var(--soft);color:var(--muted);font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px}
.year{color:var(--muted);font-size:13px;font-weight:700}
.title{font-size:17px;font-weight:800;letter-spacing:-.01em;margin:0 0 6px}
.specs{color:var(--muted);font-size:13px;font-weight:600;margin-bottom:14px}
.pricerow{display:flex;align-items:baseline;gap:10px;margin-top:auto;flex-wrap:wrap}
.pcross{width:100%;color:var(--muted);font-size:14px;font-weight:700;text-decoration:line-through}
.price{font-size:23px;font-weight:800}.peur{color:var(--muted);font-size:14px;font-weight:700}
.psave{background:#E7F8EE;color:#1DA851;font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px}
.cbtn{margin-top:14px;display:block;text-align:center;background:var(--soft);color:var(--ink);font-weight:700;padding:12px;border-radius:999px}
.card:hover .cbtn{background:var(--navy);color:#fff}
.feat{position:absolute;top:12px;right:12px;background:var(--red);color:#fff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;z-index:2}
.autok-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:8px 0 22px}
.autok-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:5px}
.autok-tab{border:0;background:transparent;font:inherit;font-weight:700;font-size:14px;color:var(--ink);padding:10px 20px;border-radius:999px;cursor:pointer;transition:.2s}
.autok-tab.on{background:var(--navy);color:#fff}
.autok-tab:not(.on):hover{background:#F0F3F8}
.autok-panel{display:none}.autok-panel.on{display:block}
.autok-more{text-align:center;margin-top:24px}
.rate-note{margin-top:16px;font-size:12.5px;color:var(--muted);text-align:center}
`;
}
function carCard(c, rate, rel) {
  const g = galleryOf(c);
  const p = priceOf(c, rate);
  const href = `${rel}auto/${slugify(c.modell)}/`;
  const img = g[0]
    ? `<img src="${attr(g[0])}" alt="${attr((c.modell || "").trim())}" loading="lazy" referrerpolicy="no-referrer"><span class="ph" style="display:none">fotó hamarosan</span>`
    : `<span class="ph">fotó hamarosan</span>`;
  const cross = p.save > 0 ? `<span class="pcross" data-cross>${fmtHUF(p.huGross)}</span>` : "";
  const save = p.save > 0 ? `<span class="psave" data-save>−${fmtHUF(p.save)}</span>` : "";
  return `<a class="card" href="${attr(href)}" data-marka="${attr(c.marka || "")}" data-kar="${attr(c.karosszeria || "")}" data-uz="${attr(c.uzemanyag || "")}"><div class="media">${img}${isOwn(c) ? '<span class="own">CarAdvance saját</span>' : ""}</div>
  <div class="body"><div class="meta"><span class="cond">Használt</span><span class="year">${esc(c.evjarat || "")}</span></div>
  <h3 class="title">${esc((c.modell || "").trim())}</h3>
  <div class="specs">${esc(specStr(c))}</div>
  <div class="pricerow" data-eur="${p.eur}" data-net="${nEur(c.vetel_eur_netto)}">${cross}<span class="price" data-main>${fmtHUF(p.main)}</span><span class="peur">${fmtEUR(p.eur)}</span>${save}</div>
  <span class="cbtn">Részletek</span></div></a>`;
}

// Featured card with "Kiemelt" badge; mode "sale" (default) or "rent"
function featCard(c, rate, mode) {
  const g = galleryOf(c);
  const href = `auto/${slugify(c.modell)}/`;
  const img = g[0]
    ? `<img src="${attr(g[0])}" alt="${attr((c.modell || "").trim())}" loading="lazy" referrerpolicy="no-referrer"><span class="ph" style="display:none">fotó hamarosan</span>`
    : `<span class="ph">fotó hamarosan</span>`;
  const spec = [c.km, c.teljesitmeny, c.valto, c.uzemanyag].filter(Boolean).join(" · ");
  let priceRow, cond;
  if (mode === "rent") {
    const eur = nEur(c.berlet_eur);
    const hufMo = Math.ceil((eur * rate) / 1000) * 1000;
    cond = "Bérelhető";
    priceRow = `<div class="pricerow"><span class="price">${eur.toLocaleString("hu-HU")} €/hó</span><span class="peur">≈ ${fmtHUF(hufMo)}/hó</span></div>`;
  } else {
    const p = priceOf(c, rate);
    cond = "Használt";
    const cross = p.save > 0 ? `<span class="pcross" data-cross>${fmtHUF(p.huGross)}</span>` : "";
    const save = p.save > 0 ? `<span class="psave" data-save>−${fmtHUF(p.save)}</span>` : "";
    priceRow = `<div class="pricerow" data-eur="${p.eur}" data-net="${nEur(c.vetel_eur_netto)}">${cross}<span class="price" data-main>${fmtHUF(p.main)}</span><span class="peur">${fmtEUR(p.eur)}</span>${save}</div>`;
  }
  return `<a class="card" href="${attr(href)}"><div class="media">${img}<span class="feat">Kiemelt</span></div>
  <div class="body"><div class="meta"><span class="cond">${cond}</span><span class="year">${esc(c.evjarat || "")}</span></div>
  <h3 class="title">${esc((c.modell || "").trim())}</h3>
  <div class="specs">${esc(spec)}</div>
  ${priceRow}
  <span class="cbtn">Részletek</span></div></a>`;
}

// --------------------------------------------------------------- HOME
const YT_SVG = '<svg viewBox="0 0 28 20" width="24" aria-label="YouTube"><rect width="28" height="20" rx="5" fill="#FF0000"/><path d="M11 6l7 4-7 4z" fill="#fff"/></svg>';

const CONTENT_CSS = `
.cah{--navy-2:#1A1B1F;--navy-3:#26272C;--red-dark:#B80015;--card:#fff;--cr:22px;--shadow:0 14px 40px rgba(8,8,10,.10)}
.cah .wrap{max-width:1120px;margin:0 auto;padding:0 24px}
.cah .block{padding:56px 0}
.cah .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--red)}
.cah .eyebrow::before{content:"";width:26px;height:3px;background:var(--red);border-radius:2px}
.cah h2.sec-title{font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-.02em;color:var(--navy);margin:14px 0 12px}
.cah .card{background:var(--card);border:1px solid var(--line);border-radius:var(--cr);box-shadow:var(--shadow)}
.cah .reveal{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
.cah .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.cah .reveal{opacity:1;transform:none;transition:none}}
.cah .chip{display:inline-flex;align-items:center;gap:8px;background:#fff;color:var(--navy);font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;text-decoration:none;transition:transform .18s,box-shadow .18s}
.cah .chip:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.25)}
.cah .chip.cta{background:var(--red);color:#fff;box-shadow:0 12px 28px rgba(226,0,26,.38)}
.cah .chip.cta:hover{background:var(--red-dark)}
.cah .svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:38px}
.cah .svc{padding:34px 30px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.cah .svc-media{margin:-34px -30px 24px;height:185px;background:linear-gradient(135deg,var(--navy),var(--navy-3));display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:calc(var(--cr) - 1px) calc(var(--cr) - 1px) 0 0}
.cah .svc-media img{width:100%;height:100%;object-fit:cover;display:block}
.cah .svc .tag{align-self:flex-start;font-size:12.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--red);background:rgba(226,0,26,.09);padding:6px 12px;border-radius:999px;margin-bottom:16px}
.cah .svc h3{font-size:23px;font-weight:800;color:var(--navy);letter-spacing:-.01em;margin-bottom:10px}
.cah .svc p{color:var(--muted);font-size:15.5px;margin-bottom:18px}
.cah .svc ul{list-style:none;margin:0 0 24px;padding:0}
.cah .svc ul li{position:relative;padding-left:28px;font-size:14.5px;color:var(--ink);font-weight:600;margin-bottom:9px}
.cah .svc ul li::before{content:"";position:absolute;left:0;top:4px;width:17px;height:17px;border-radius:50%;background:var(--red);-webkit-mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>') center/100% no-repeat;mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>') center/100% no-repeat}
.cah .svc .btn{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:8px;background:var(--navy);color:#fff;font-weight:700;font-size:14.5px;padding:12px 22px;border-radius:999px;text-decoration:none;transition:background .18s,transform .18s}
.cah .svc .btn:hover{background:var(--navy-3);transform:translateY(-2px)}
.cah .svc .btn-row{margin-top:auto;display:flex;flex-wrap:wrap;gap:8px}
.cah .svc .btn-row .btn{margin-top:0;font-size:12.5px;padding:10px 13px;white-space:nowrap}
.cah .svc .btn-outline{background:#fff;color:var(--navy);border:2px solid var(--navy)}
.cah .svc .btn-outline:hover{background:var(--navy);color:#fff}
.cah .svc.charity-accent{border-top:4px solid var(--red)}
.cah .platforms{margin:2px 0 24px}
.cah .plat-lbl{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.cah .plat-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cah .plat{display:inline-flex;align-items:center;border-radius:10px;padding:8px 14px;border:1px solid var(--line);background:#fff}
.cah .plat-img{height:22px;width:auto;display:block}
.cah .plat-mobile{background:#340050;border-color:#340050;padding:6px 12px}.cah .plat-img-mb{height:24px}
.cah .plat-as24{background:#F4F200;border-color:#F4F200;padding:6px 12px}.cah .plat-img-as{height:26px}
.cah .plat-huhu{background:#1A1A1A;border-color:#1A1A1A;padding:6px 12px}.cah .plat-img-hu{height:22px}
.cah .plat-heycar{background:#072962;border-color:#072962;padding:6px 12px}.cah .plat-img-hc{height:26px}
.cah .soc{width:34px;height:34px;border-radius:9px;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(8,8,10,.12)}
.cah .soc img{width:100%;height:100%;object-fit:cover;display:block}
.cah .soc-yt{background:#fff;border:1px solid var(--line)}
.cah .charity{background:linear-gradient(160deg,var(--navy),var(--navy-2));color:#fff;border:none;padding:44px 40px;display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center;position:relative;overflow:hidden;margin-top:8px}
.cah .charity::before{content:"♥";position:absolute;right:-30px;bottom:-70px;font-size:280px;color:rgba(226,0,26,.14);line-height:1}
.cah .charity h3{font-size:clamp(22px,3vw,28px);font-weight:800;letter-spacing:-.01em;margin:12px 0 12px}
.cah .charity p{color:rgba(255,255,255,.84);font-size:15.5px}
.cah .charity .eyebrow{color:#fff}
.cah .charity-btn{margin-top:22px;position:relative}
.cah .charity-btn-mobile{display:none}
.cah .org-list{display:flex;flex-wrap:wrap;gap:10px;position:relative}
.cah .org-logo{background:#fff;border-radius:14px;padding:10px 14px;min-height:74px;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.22)}
.cah .org-logo img{height:54px;max-width:150px;width:auto;object-fit:contain;display:block}
.cah .org-sos{background:#009DE0}
.cah .why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:38px}
.cah .why{padding:26px 24px;display:flex;gap:16px;align-items:flex-start}
.cah .why .n{flex:0 0 auto;width:42px;height:42px;border-radius:12px;background:var(--navy);color:#fff;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center}
.cah .why h3{font-size:16px;font-weight:800;color:var(--navy);margin-bottom:5px}
.cah .why p{font-size:14px;color:var(--muted)}
.cah .why-special{background:linear-gradient(140deg,var(--red),var(--red-dark));border:none;position:relative;overflow:hidden;box-shadow:0 18px 44px rgba(226,0,26,.35)}
.cah .why-special::after{content:"♥";position:absolute;right:-14px;bottom:-34px;font-size:110px;color:rgba(255,255,255,.14);line-height:1}
.cah .why-special .n{background:#fff;color:var(--red);font-size:19px}
.cah .why-special h3{color:#fff}.cah .why-special p{color:rgba(255,255,255,.88)}
@media(max-width:960px){.cah .svc-grid{grid-template-columns:1fr}.cah .charity{grid-template-columns:1fr;padding:34px 26px}.cah .why-grid{grid-template-columns:1fr;max-width:560px;margin-left:auto;margin-right:auto}.cah .charity-btn:not(.charity-btn-mobile){display:none}.cah .charity-btn-mobile{display:inline-flex}}
`;

function svcCard({ img, alt, tag, title, lead, items, extra, accent }) {
  return `<div class="card svc${accent ? " charity-accent" : ""} reveal">
  <div class="svc-media"><img src="${attr(img)}" alt="${attr(alt)}" loading="lazy"></div>
  <span class="tag">${esc(tag)}</span><h3>${esc(title)}</h3>
  <p>${lead}</p>
  <ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
  ${extra}
</div>`;
}

function contentSections(rel) {
  const cat = rel + "autoink/";
  const svc = [
    svcCard({ img: rel + "piros-bmw-x6-m-premium-autoberles.webp", alt: "Piros BMW X6 M — prémium autóbérlés", tag: "Prémium autóbérlés", title: "Prémium autóbérlés",
      lead: "<strong>Miért vásárolnál, ha bérelhetsz?</strong> Élvezd a prémium autózás minden előnyét vásárlás nélkül — rugalmas, hosszú távú bérléssel, már fél évtől.",
      items: ["Válogatott prémium modellek", "Rugalmas futamidő — minimum 6 hónaptól", "Átadás-átvétel egyeztetett helyszínen"],
      extra: `<div class="btn-row"><a class="btn" href="${cat}">Autólista →</a><a class="btn btn-outline" href="#">Rövidtávú bérlés</a><a class="btn btn-outline" href="#">Hosszú távú bérlés</a></div>` }),
    svcCard({ img: rel + "bmw-m3-touring-premium-auto-eladas.webp", alt: "BMW M3 Touring — prémium autó eladás", tag: "Prémium autó eladás", title: "Prémium autó eladás",
      lead: "<strong>Miért kockáztatnál, ha biztosra is mehetsz?</strong> Kínálatunkban gondosan válogatott, bevizsgált prémium autók — egyenesen Németországból.",
      items: ["Leinformált, bevizsgált prémium modellek", "Autóink többsége érvényes gyári garanciával", "Finanszírozási lehetőség igény szerint"],
      extra: `<div class="btn-row"><a class="btn" href="${cat}">Autólista →</a><a class="btn btn-outline" href="#">Részletek</a><a class="btn btn-outline" href="#">Finanszírozás</a></div>` }),
    svcCard({ img: rel + "autoszallitas-autoimport-nemetorszagbol.webp", alt: "Autószállítás — autóimport Németországból", tag: "Autóimport", title: "Autóimport Németországból",
      lead: "<strong>Miért érnéd be a hazai kínálattal?</strong> A teljes német piac kínálata — pontosan a Te igényeid szerint, kulcsrakészen.",
      items: ["Leinformálás és helyszíni bevizsgálás", "Szállítás és teljes körű honosítás", "1 év szavatosság minden autóra"],
      extra: `<div class="platforms"><span class="plat-lbl">A teljes kínálat innen:</span><div class="plat-row"><span class="plat plat-mobile"><img class="plat-img plat-img-mb" src="${rel}mobile-de.webp" alt="mobile.de" loading="lazy"></span><span class="plat plat-as24"><img class="plat-img plat-img-as" src="${rel}autoscout24.webp" alt="AutoScout24" loading="lazy"></span><span class="plat plat-heycar"><img class="plat-img plat-img-hc" src="${rel}heycar.webp" alt="heycar" loading="lazy"></span></div></div><a class="btn" href="#">Tudj meg többet →</a>` }),
    svcCard({ img: rel + "toyota-rav4-hybrid-hasznaltauto-eladas.webp", alt: "Toyota RAV4 Hybrid — használtautó-eladás", tag: "Használtautó-eladás", title: "Eladjuk az autódat", accent: true,
      lead: "<strong>Miért vesződnél az eladással?</strong> Teljes körűen kezeljük helyetted — Te csak átveszed a vételárat, mi pedig még jót is teszünk közben.",
      items: ["Profi fotók és videók minden autóhoz", "Hirdetés a legnagyobb platformokon", "A jutalék egy része jótékony célra megy"],
      extra: `<div class="platforms"><span class="plat-lbl">Itt hirdetjük az autódat:</span><div class="plat-row"><span class="plat plat-huhu"><img class="plat-img plat-img-hu" src="${rel}hasznaltauto-hu.webp" alt="Használtautó.hu" loading="lazy"></span><span class="plat plat-mobile"><img class="plat-img plat-img-mb" src="${rel}mobile-de.webp" alt="mobile.de" loading="lazy"></span></div><span class="plat-lbl" style="margin-top:14px">Itt mutatjuk meg videón:</span><div class="plat-row"><span class="soc"><img src="${rel}instagram.webp" alt="Instagram" loading="lazy"></span><span class="soc"><img src="${rel}facebook.webp" alt="Facebook" loading="lazy"></span><span class="soc"><img src="${rel}tiktok.webp" alt="TikTok" loading="lazy"></span><span class="soc soc-yt">${YT_SVG}</span></div></div><div class="btn-row"><a class="btn" href="#">Tudj meg többet →</a><a class="btn btn-outline" href="#jotekonysag">Jótékonysági program</a></div>` }),
  ].join("");

  const orgs = [
    ["sos-gyermekfalvak-magyarorszag.webp", "SOS Gyermekfalvak Magyarország", " org-sos"],
    ["magyar-elelmiszerbank-egyesulet.webp", "Magyar Élelmiszerbank Egyesület", ""],
    ["bator-tabor.webp", "Bátor Tábor", ""],
    ["magyar-maltai-szeretetszolgalat.webp", "Magyar Máltai Szeretetszolgálat", ""],
    ["rex-kutyaotthon-alapitvany.webp", "Rex Kutyaotthon Alapítvány", ""],
    ["heim-pal-orszagos-gyermekgyogyaszati-intezet.webp", "Heim Pál Országos Gyermekgyógyászati Intézet", ""],
    ["patent-egyesulet.webp", "PATENT Egyesület", ""],
  ].map(([f, a, cls]) => `<span class="org-logo${cls}"><img src="${rel}${f}" alt="${attr(a)}" loading="lazy"></span>`).join("");

  const steps = [
    ["1", "Meghallgatunk", "Először megértjük, mire van szükséged — csak utána javaslunk autót vagy megoldást."],
    ["2", "Ellenőrzünk", "A kinézett autót leinformáljuk, és a helyszínen alaposan megnézzük, hogy minden rendben van-e vele, mielőtt véglegesítenéd a vásárlást."],
    ["3", "Kulcsrakészen intézzük", "Szállítás, honosítás, papírmunka — mindent mi kezelünk, Neked csak át kell venned."],
    ["4", "Kiállunk érte", "Legyen szó importált vagy hazai használt autóról, minden esetben 1 év szavatosságot vállalunk — mert biztosak vagyunk a munkánkban."],
    ["5", "Melletted maradunk", "Az átadás után sem szakad meg a kapcsolatunk — kérdéseiddel és garanciális ügyeiddel is bizalommal fordulhatsz hozzánk."],
  ].map(([n, t, p]) => `<div class="card why reveal"><div class="n">${n}</div><div><h3>${esc(t)}</h3><p>${esc(p)}</p></div></div>`).join("");

  return `<div class="cah">
<section class="block" id="szolgaltatasok"><div class="wrap">
  <span class="eyebrow reveal">Szolgáltatásaink</span>
  <h2 class="sec-title reveal">Amivel foglalkozunk</h2>
  <div class="svc-grid">${svc}</div>
</div></section>
<section class="block" id="jotekonysag-blokk" style="padding-top:0"><div class="wrap">
  <div class="card charity reveal" id="jotekonysag">
    <div>
      <span class="eyebrow">Jótékonyság</span>
      <h3>Minden eladott autóval jót teszünk</h3>
      <p>Hisszük, hogy a sikernek akkor van igazi értéke, ha másokkal is megosztjuk. Ezért a használtautó-eladások jutalékának jelentős részét magyar nonprofit szervezeteknek ajánljuk fel — és minden autó videójában megmutatjuk, hova kerül a támogatás.</p>
      <a class="chip cta charity-btn" href="#">Add el az autód — tegyünk jót együtt</a>
    </div>
    <div class="org-list">${orgs}</div>
    <a class="chip cta charity-btn charity-btn-mobile" href="#">Add el az autód — tegyünk jót együtt</a>
  </div>
</div></section>
<section class="block" id="miert" style="padding-top:0"><div class="wrap">
  <span class="eyebrow reveal">Miért a Caradvance?</span>
  <h2 class="sec-title reveal">Így dolgozunk</h2>
  <div class="why-grid">${steps}<div class="card why why-special reveal"><div class="n">♥</div><div><h3>Visszaadunk</h3><p>A használtautó-eladások jutalékának egy részével magyar jótékonysági szervezeteket támogatunk.</p></div></div></div>
</div></section>
</div>
<script>(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});document.querySelectorAll('.cah .reveal').forEach(function(el){io.observe(el)});})();</script>`;
}

function renderHome(cars, rate) {
  const active = cars.filter(isActive);
  const pickFeat = (list) => list.filter(isOwn).concat(list.filter((c) => !isOwn(c))).slice(0, 3);
  const saleFeat = pickFeat(active.filter((c) => nEur(c.vetel_eur) > 0));
  const rentFeat = pickFeat(active.filter((c) => nEur(c.berlet_eur) > 0));
  const css = `
.hero{position:relative;overflow:hidden;color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:600px;padding:96px 24px;border-radius:32px;margin:16px;margin-top:calc(16px - var(--navh));background:linear-gradient(180deg,#17181C,#0B0B0D 62%,#060607)}
@media(max-width:640px){.hero{margin:8px;margin-top:calc(8px - var(--navh));border-radius:22px;padding:84px 18px 72px;min-height:480px}}
.hero .video-bg{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover}
.hero .overlay{position:absolute;inset:0;z-index:1;background:radial-gradient(1100px 460px at 50% -10%,rgba(226,0,26,.18),transparent 60%),linear-gradient(180deg,rgba(8,8,10,.42),rgba(8,8,10,.48) 45%,rgba(8,8,10,.7))}
.hero .inner{position:relative;z-index:2;max-width:1120px;margin:0 auto}
.hero .brand-logo{height:64px;width:auto;display:block;margin:0 auto 26px;filter:drop-shadow(0 4px 18px rgba(0,0,0,.5))}
@media(max-width:640px){.hero .brand-logo{height:48px;margin-bottom:20px}}
.hero h1{font-size:clamp(32px,5vw,56px);line-height:1.08;font-weight:800;letter-spacing:-.025em;margin:0 0 16px;white-space:nowrap;text-shadow:0 2px 24px rgba(0,0,0,.35)}
@media(max-width:900px){.hero h1{white-space:normal;font-size:clamp(28px,7vw,40px)}}
.hero .sub{font-size:clamp(16px,1.7vw,19px);line-height:1.5;color:#E7EAF0;max-width:600px;margin:0 auto 32px;text-shadow:0 1px 12px rgba(0,0,0,.4)}
.hero .cta-row{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;align-items:center}
.hero .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:16px;padding:15px 32px;border-radius:999px;text-decoration:none;cursor:pointer;border:0;transition:background .15s}
.hero .btn-primary{background:var(--red);color:#fff;box-shadow:0 10px 30px rgba(226,0,26,.4)}
.hero .btn-primary:hover{background:#B80015}
.hero .btn-white{background:#fff;color:var(--navy)}.hero .btn-white:hover{background:#ECEEF2}
.hero .scrolldown{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:3;display:flex;flex-direction:column;align-items:center;gap:4px;color:rgba(255,255,255,.82);background:none;border:0;cursor:pointer;font:inherit;letter-spacing:.05em;font-size:11px;text-transform:uppercase;animation:caScrollBob 1.9s ease-in-out infinite}
.hero .scrolldown:hover{color:#fff}.hero .scrolldown svg{width:26px;height:26px}
@keyframes caScrollBob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,8px)}}
.stats{max-width:1160px;margin:28px auto 0;position:relative;z-index:3;padding:0 20px}
.stats-in{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
@media(max-width:700px){.stats-in{grid-template-columns:1fr 1fr}}
.stat{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 14px 40px rgba(8,8,10,.08);text-align:center;padding:26px 22px}
.stat .n{font-size:clamp(26px,3.2vw,34px);font-weight:800;letter-spacing:-.02em;color:var(--navy)}.stat .n b{color:var(--red)}
.stat .l{color:var(--muted);font-size:13.5px;font-weight:600;margin-top:6px;line-height:1.4}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:8px 0 22px;flex-wrap:wrap}
.sec-head h2{font-size:28px;font-weight:800;letter-spacing:-.02em;margin:6px 0 0}
.feyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--red)}
.feyebrow::before{content:"";width:26px;height:3px;background:var(--red);border-radius:2px}
.sec-head p{color:var(--muted);margin:6px 0 0;font-size:15px}
` + cardCss() + CONTENT_CSS;

  const stats = [
    ["5000<b>+</b>", "eladott prémium autó"],
    ["23 <b>év</b>", "Tapasztalat — a Caradvance GmbH 2003 óta"],
    ["5,0<b>★</b>", "Google-értékelés"],
    ["1 <b>év</b>", "szavatosság minden importált autóra"],
  ];
  const body = `
<section class="hero">
  <video class="video-bg" autoplay muted loop playsinline preload="auto" poster="caradvance-hero-x5-poster.jpg"><source src="caradvance-hero-x5.mp4" type="video/mp4"></video>
  <div class="overlay"></div>
  <div class="inner">
    <img class="brand-logo" src="caradvance-logo-white.webp" alt="CarAdvance — the automotive people" width="403" height="133">
    <h1>Prémium autók Németországból</h1>
    <p class="sub">Prémium autóbérlés és eladás, autóimport Németországból — a te autódat pedig bizományban eladjuk.</p>
    <div class="cta-row"><a class="btn btn-primary" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Ajánlatkérés")}">Kérj ajánlatot</a><a class="btn btn-white" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Autó eladása – bizomány")}">Add el az autód</a></div>
  </div>
  <button class="scrolldown" aria-label="Görgess lejjebb" onclick="window.scrollBy({top:Math.round(innerHeight*0.9),behavior:'smooth'})">Görgess<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
</section>
<div class="stats"><div class="stats-in">${stats.map(([n, l]) => `<div class="stat"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`).join("")}</div></div>
<section class="wrap" id="autoink">
  <div class="autok-head"><div><span class="feyebrow">Kínálat</span><h2>Autóink</h2></div>
    <div class="autok-tabs" role="tablist">
      <button class="autok-tab" data-tab="berelheto" type="button">Bérelhető autók</button>
      <button class="autok-tab on" data-tab="elado" type="button">Eladó autók</button>
    </div>
  </div>
  <div class="autok-panel on" id="panel-elado">
    <div class="grid">${saleFeat.map((c) => featCard(c, rate, "sale")).join("")}</div>
    <div class="autok-more"><a class="btn btn-soft" href="autoink/">Összes eladó autónk →</a></div>
  </div>
  <div class="autok-panel" id="panel-berelheto">
    ${rentFeat.length
      ? `<div class="grid">${rentFeat.map((c) => featCard(c, rate, "rent")).join("")}</div><div class="autok-more"><a class="btn btn-soft" href="autoink/">Összes bérelhető autónk →</a></div>`
      : `<div style="text-align:center;padding:52px 24px;background:#fff;border:1px solid var(--line);border-radius:18px"><p style="color:var(--muted);font-size:16.5px;max-width:460px;margin:0 auto 20px">Bérelhető prémium autóink hamarosan itt is elérhetők lesznek. Addig is szívesen adunk személyre szabott bérlési ajánlatot.</p><a class="btn btn-red" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Autóbérlés érdeklődés")}">Kérj bérlési ajánlatot</a></div>`}
  </div>
  <div class="rate-note">A forint árak élő árfolyammal számolódnak, óránként frissülnek (1 € = <span id="ratev">${rate}</span> Ft).</div>
</section>
${contentSections("")}
<script>document.querySelectorAll('.autok-tab').forEach(function(t){t.addEventListener('click',function(){document.querySelectorAll('.autok-tab').forEach(function(x){x.classList.remove('on')});t.classList.add('on');document.querySelectorAll('.autok-panel').forEach(function(p){p.classList.remove('on')});var el=document.getElementById('panel-'+t.dataset.tab);if(el)el.classList.add('on');});});</script>`;

  const ld = {
    "@context": "https://schema.org", "@type": "AutoDealer", name: BRAND,
    url: SITE_BASE + "/", email: CONTACT_EMAIL, areaServed: "HU",
    description: "Prémium autók Németországból — bérlés, eladás, import és bizományos értékesítés.",
  };
  return page({
    title: "CarAdvance — Prémium autók Németországból | Bérlés, eladás, import",
    desc: "Prémium autók Németországból: megvásárolható autók, prémium autóbérlés, import és bizományos értékesítés. Átlátható árak, garancia.",
    canonical: SITE_BASE + "/", rel: "", css, body,
    head: `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
  });
}

// --------------------------------------------------------------- CATALOG
function renderCatalog(cars, rate) {
  const active = cars.filter(isActive);
  const css = `
.crumb{font-size:14px;color:var(--muted);font-weight:600;margin-bottom:14px}.crumb a{text-decoration:none}.crumb a:hover{color:var(--red)}.crumb b{color:var(--ink)}
.chead h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0 0 4px}
.chead p{color:var(--muted);margin:0 0 22px;font-size:15px}
.filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px}
.filters input,.filters select{padding:11px 14px;border:1px solid var(--line);border-radius:10px;font-family:inherit;font-size:14px;background:#fff;color:var(--ink)}
.filters input{min-width:220px}
.count{color:var(--muted);font-size:13px;font-weight:600;margin-bottom:14px}
.empty{grid-column:1/-1;color:var(--muted);padding:40px;text-align:center}
` + cardCss();
  const brands = [...new Set(active.map((c) => c.marka).filter(Boolean))].sort();
  const bodies = [...new Set(active.map((c) => c.karosszeria).filter(Boolean))].sort();
  const fuels = [...new Set(active.map((c) => c.uzemanyag).filter(Boolean))].sort();
  const body = `
<div class="wrap">
  <div class="crumb"><a href="../">Főoldal</a> / <b>Megvásárolható autóink</b></div>
  <div class="chead"><h1>Megvásárolható autóink</h1><p>Prémium autók Németországból, magyar áfás árral és garanciával.</p></div>
  <div class="filters">
    <input id="q" placeholder="Keresés (pl. X5, Porsche)…">
    <select id="marka"><option value="">Minden márka</option>${brands.map((b) => `<option>${esc(b)}</option>`).join("")}</select>
    <select id="kar"><option value="">Minden karosszéria</option>${bodies.map((b) => `<option>${esc(b)}</option>`).join("")}</select>
    <select id="uz"><option value="">Minden üzemanyag</option>${fuels.map((b) => `<option>${esc(b)}</option>`).join("")}</select>
  </div>
  <div class="count" id="count">${active.length} autó</div>
  <div class="grid" id="grid">${active.map((c) => carCard(c, rate, "../")).join("")}</div>
</div>
<script>
(function(){var g=document.getElementById('grid'),cards=[].slice.call(g.children);
var meta=cards.map(function(el){return{el:el,t:(el.querySelector('.title').textContent||'').toLowerCase(),
 m:(el.getAttribute('data-marka')||''),k:(el.getAttribute('data-kar')||''),u:(el.getAttribute('data-uz')||'')}});
function f(){var q=(document.getElementById('q').value||'').toLowerCase(),m=document.getElementById('marka').value,k=document.getElementById('kar').value,u=document.getElementById('uz').value,n=0;
 meta.forEach(function(o){var ok=(!q||o.t.indexOf(q)>=0)&&(!m||o.m===m)&&(!k||o.k===k)&&(!u||o.u===u);o.el.style.display=ok?'':'none';if(ok)n++;});
 document.getElementById('count').textContent=n+' autó';}
['q','marka','kar','uz'].forEach(function(id){var e=document.getElementById(id);e.addEventListener('input',f);e.addEventListener('change',f);});})();
</script>`;
  return page({
    title: "Megvásárolható autóink — CarAdvance",
    desc: `Böngéssz ${active.length} prémium autó között Németországból — BMW, Porsche és más márkák, magyar áfás árral és garanciával.`,
    canonical: SITE_BASE + "/autoink/", rel: "../", css, body,
  });
}

// --------------------------------------------------------------- DETAIL
function renderDetail(c, cars, rate) {
  const g = galleryOf(c);
  const p = priceOf(c, rate);
  const slug = slugify(c.modell);
  const title = (c.modell || "").trim();
  const eq = equipmentOf(c);
  const related = cars.filter((x) => isActive(x) && x.marka === c.marka && slugify(x.modell) !== slug).slice(0, 3);
  const descText =
    `A(z) ${title} ${c.evjarat ? c.evjarat + " évjáratú, " : ""}${c.km ? c.km + " futott, " : ""}` +
    `${c.uzemanyag ? c.uzemanyag.toLowerCase() + " üzemű " : ""}${c.karosszeria || "prémium autó"}. ` +
    `${c.teljesitmeny ? c.teljesitmeny + ", " : ""}${c.valto || ""}${c.hajtas ? ", " + c.hajtas : ""}. ` +
    `Magyar áfás ár garanciával, ${BRAND} import.`;

  const css = `
.crumb{font-size:14px;color:var(--muted);font-weight:600;margin-bottom:18px}.crumb a{text-decoration:none}.crumb a:hover{color:var(--red)}.crumb b{color:var(--ink)}
.layout{display:grid;gap:28px;align-items:start;grid-template-columns:minmax(0,1fr) minmax(0,360px)}
@media(max-width:1024px){.layout{grid-template-columns:1fr}}
.gallery{min-width:0}
.stage{position:relative;width:100%;aspect-ratio:16/10;border-radius:18px;overflow:hidden;background:linear-gradient(135deg,#1A1B1F,#26272C)}
.stage img{width:100%;height:100%;object-fit:cover;display:block}
.counter{position:absolute;bottom:14px;right:14px;background:rgba(11,11,13,.75);color:#fff;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px}
.nav-btn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.6);border:0;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.7}
.nav-btn:hover{opacity:1;background:#fff}.nav-btn.prev{left:12px}.nav-btn.next{right:12px}
.thumbs{display:flex;gap:10px;margin-top:12px;overflow-x:auto;padding-bottom:6px}
.thumbs img{height:72px;width:108px;flex:0 0 auto;object-fit:cover;border-radius:10px;cursor:pointer;opacity:.6;border:2px solid transparent}
.thumbs img.active{opacity:1;border-color:var(--red)}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;margin-top:22px}
.card:first-of-type{margin-top:0}
.sec-h{font-size:21px;font-weight:800;margin:0 0 14px}
.iconrow{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:560px){.iconrow{grid-template-columns:1fr 1fr}}
.ic .k{font-size:12px;color:var(--muted);font-weight:700}.ic .v{font-size:15px;font-weight:800}
.desc{color:#33404f;line-height:1.65;font-size:15px}
table{width:100%;border-collapse:collapse}td{padding:11px 4px;border-bottom:1px solid var(--line);font-size:14.5px}td.k{color:var(--muted);font-weight:600;width:45%}td.v{font-weight:700}
.cateq{columns:2;column-gap:32px}@media(max-width:560px){.cateq{columns:1}}
.cateq .cath{font-weight:800;font-size:14px;margin:12px 0 6px;break-inside:avoid}.cateq .cath:first-child{margin-top:0}
.cateq .catit{padding:3px 0;color:#33404f;font-size:14px;break-inside:avoid}.cateq .catit::before{content:"•";color:var(--muted);margin-right:8px}
.side{display:flex;flex-direction:column;gap:18px}
@media(min-width:1025px){.side{position:sticky;top:84px}}
.panel{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px}
.badge{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.cond{background:var(--soft);color:var(--muted);font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px}
.own{display:inline-block;background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:5px 11px;font-size:11px;font-weight:800;color:var(--navy);margin-bottom:10px}
.year{font-weight:800;color:var(--muted)}
.ptitle{font-size:23px;font-weight:800;letter-spacing:-.02em;margin:6px 0 10px;line-height:1.15}
.pcross{color:var(--muted);font-size:17px;font-weight:700;text-decoration:line-through}
.price{font-size:38px;font-weight:800;letter-spacing:-.02em;line-height:1.05}
.peur{color:var(--muted);font-weight:700;font-size:18px;margin-top:6px}
.psave{display:inline-block;background:#E7F8EE;color:#1DA851;font-size:13px;font-weight:800;padding:6px 13px;border-radius:999px;margin-top:10px}
.taxnote{color:var(--muted);font-size:12.5px;font-weight:600;margin-top:8px}
.rel-h{margin:44px 0 18px;font-size:24px;font-weight:800}
.rel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}@media(max-width:900px){.rel-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.rel-grid{grid-template-columns:1fr}}
` + cardCss();

  const specs = [
    ["Évjárat", c.evjarat], ["Kilométer", c.km], ["Teljesítmény", c.teljesitmeny],
    ["Üzemanyag", c.uzemanyag], ["Váltó", c.valto], ["Hajtás", c.hajtas],
    ["Márka", c.marka], ["Karosszéria", c.karosszeria],
  ].filter(([, v]) => v);

  const stage = g.length
    ? `<div class="stage"><img id="stg" src="${attr(g[0])}" alt="${attr(title)}" referrerpolicy="no-referrer">
       ${g.length > 1 ? '<button class="nav-btn prev" onclick="ca_step(-1)" aria-label="Előző">‹</button><button class="nav-btn next" onclick="ca_step(1)" aria-label="Következő">›</button>' : ""}
       <span class="counter"><span id="cidx">1</span> / ${g.length}</span></div>
       ${g.length > 1 ? `<div class="thumbs" id="thumbs">${g.map((u, i) => `<img src="${attr(u)}" alt="${attr(title + " – " + (i + 1))}" referrerpolicy="no-referrer" onclick="ca_go(${i})" class="${i === 0 ? "active" : ""}">`).join("")}</div>` : ""}`
    : `<div class="stage"><span class="counter">fotó hamarosan</span></div>`;

  const cross = p.save > 0 ? `<div class="pcross" data-cross>${fmtHUF(p.huGross)}</div>` : "";
  const save = p.save > 0 ? `<div class="psave" data-save>−${fmtHUF(p.save)}</div>` : "";

  const body = `
<div class="wrap">
  <div class="crumb"><a href="../../">Főoldal</a> / <a href="../../autoink/">Autóink</a> / <b>${esc(title)}</b></div>
  <div class="layout">
    <div class="gallery">${stage}
      <div class="card"><h2 class="sec-h">Áttekintés</h2>
        <div class="iconrow">${specs.slice(0, 6).map(([k, v]) => `<div class="ic"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("")}</div>
        <p class="desc" style="margin-top:18px">${esc(descText)}</p>
      </div>
      <div class="card"><h2 class="sec-h">Műszaki adatok</h2>
        <table><tbody>${specs.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join("")}</tbody></table></div>
      ${eq.length ? `<div class="card"><h2 class="sec-h">Felszereltség</h2><div class="cateq">${eq.map((cat) => `<div class="cath">${esc(cat.title)}</div>${cat.items.map((it) => `<div class="catit">${esc(it)}</div>`).join("")}`).join("")}</div></div>` : ""}
    </div>
    <aside class="side">
      <div class="panel">
        ${isOwn(c) ? '<div class="own">CarAdvance saját autó</div>' : ""}
        <div class="badge"><span class="cond">Használt</span><span class="year">${esc(c.evjarat || "")}</span></div>
        <div class="ptitle">${esc(title)}</div>
        <div data-eur="${p.eur}" data-net="${nEur(c.vetel_eur_netto)}">
          ${cross}
          <div class="price" data-main>${fmtHUF(p.main)}</div>
          <div class="peur">${fmtEUR(p.eur)}</div>
          ${save}
        </div>
        <div class="taxnote">Magyar áfás ár. Árfolyam: 1 € ≈ ${rate} Ft.</div>
        <a class="btn btn-primary" style="width:100%;margin-top:16px" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Ajánlatkérés: " + title)}">Ajánlatkérés</a>
        <a class="btn btn-soft" style="width:100%;margin-top:10px" href="../../autoink/">Vissza a listához</a>
      </div>
    </aside>
  </div>
  ${related.length ? `<h2 class="rel-h">Hasonló autók</h2><div class="rel-grid">${related.map((r) => carCard(r, rate, "../../")).join("")}</div>` : ""}
</div>
${g.length > 1 ? `<script>
var CAG=${JSON.stringify(g)},CI=0;
function ca_go(i){CI=(i+CAG.length)%CAG.length;document.getElementById('stg').src=CAG[CI];document.getElementById('cidx').textContent=CI+1;
 var t=document.getElementById('thumbs');if(t){[].forEach.call(t.children,function(im,j){im.className=j===CI?'active':'';});}}
function ca_step(d){ca_go(CI+d);}
</script>` : ""}`;

  const ld = {
    "@context": "https://schema.org", "@type": "Car", name: title,
    brand: { "@type": "Brand", name: c.marka || "" },
    ...(g[0] ? { image: g[0] } : {}),
    description: descText,
    ...(c.uzemanyag ? { fuelType: c.uzemanyag } : {}),
    ...(c.valto ? { vehicleTransmission: c.valto } : {}),
    ...(c.km ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: nEur(c.km), unitCode: "KMT" } } : {}),
    ...(c.evjarat ? { vehicleModelDate: c.evjarat } : {}),
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer", price: p.main, priceCurrency: "HUF",
      availability: "https://schema.org/InStock", url: SITE_BASE + "/auto/" + slug + "/",
    },
  };
  const bc = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Főoldal", item: SITE_BASE + "/" },
      { "@type": "ListItem", position: 2, name: "Autóink", item: SITE_BASE + "/autoink/" },
      { "@type": "ListItem", position: 3, name: title, item: SITE_BASE + "/auto/" + slug + "/" },
    ],
  };
  return page({
    title: `${title} (${c.evjarat || ""}) — ${BRAND}`,
    desc: `${title} eladó — ${specStr(c)}. ${fmtHUF(p.main)} (${fmtEUR(p.eur)}). Magyar áfás ár, garancia, ${BRAND} import.`,
    canonical: SITE_BASE + "/auto/" + slug + "/", rel: "../../", css, body,
    head: `<meta property="og:type" content="product">${g[0] ? `<meta property="og:image" content="${attr(g[0])}">` : ""}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(bc)}</script>`,
  });
}

// --------------------------------------------------------------- write
async function main() {
  const args = process.argv.slice(2);
  const csvArg = args.includes("--csv") ? args[args.indexOf("--csv") + 1] : null;
  let csv;
  if (csvArg) { csv = await fs.readFile(csvArg, "utf8"); console.log("Using local CSV:", csvArg); }
  else { console.log("Fetching sheet…"); csv = await (await fetch(SHEET_CSV_URL, { cache: "no-store" })).text(); }
  const cars = parseCSV(csv);
  const rate = await getRate();
  console.log(`Parsed ${cars.length} rows, ${cars.filter(isActive).length} active. Rate=${rate}`);

  const outDir = path.resolve(OUT);
  await fs.mkdir(outDir, { recursive: true });

  const write = async (rel, html) => {
    const fp = path.join(outDir, rel);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, html);
  };

  await write("index.html", renderHome(cars, rate));
  await write("autoink/index.html", renderCatalog(cars, rate));

  const active = cars.filter(isActive);
  const urls = [SITE_BASE + "/", SITE_BASE + "/autoink/"];
  const seen = new Set();
  for (const c of active) {
    const slug = slugify(c.modell);
    if (!slug || seen.has(slug)) continue; // first active wins on dupes
    seen.add(slug);
    await write(`auto/${slug}/index.html`, renderDetail(c, cars, rate));
    urls.push(SITE_BASE + "/auto/" + slug + "/");
  }

  const now = new Date().toISOString().slice(0, 10);
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  await write("sitemap.xml", sitemap);
  await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_BASE}/sitemap.xml\n`);

  console.log(`Done. ${seen.size} car pages + home + catalog + sitemap (${urls.length} urls) -> ${outDir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
