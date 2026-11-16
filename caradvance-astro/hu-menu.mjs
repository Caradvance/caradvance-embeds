// Build lépés: prémium, letisztult asztali mega menü — CSAK a magyar (lang="hu") oldalakon.
// A közös mega-menu.js nem változik: a lenyíló panel tartalmát a magyar oldalakon saját szerkezet váltja.
// Minden menü:
//   - bal oldalt a 3 legfontosabb pont üvegcsempén (ikon + egysoros leírás)
//   - középen a tudnivalók és a gyors elérés (márkák, kalkulátorok, jótékonyság, közösségi oldalak)
//   - jobbra egy „színpad” mini eszközzel (bérlés: márkánkénti autó + havidíj-csúszka; vásárlás: Új/Használt;
//     bizományos: „Mennyit ér az autóm?”; import: honosítás gyorsan; rólunk: iroda + Google-értékelés)
//   - alul élő bizalmi sáv (nyitvatartás szerinti állapot, 5,0 Google, telefon) és a legutóbb megnézett autók
// Plusz: menüváltáskor a panel átúszik az új méretre, nyitott menünél az oldal elhomályosul.
// A /eladom/ és a /honositas-kalkulator/ oldalon a menüből érkező adatok (URL-paraméterek) előre kitöltődnek.
// A panelt a dark-mode.js nem színezi (data-dm-skip), világos és sötét témában is saját színeket kap. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SKIP = /(^|\/)(belso|admin|ajanlat|alairas|adatok|partner|_ttest|teszt-mega-menu|api)(\/|$)/;
const list = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : []);
const BC = list(path.join(DIST, 'berles-cut'));
const EC = list(path.join(DIST, 'elado-cut'));

const CSS = `<style id="ca-mm-hu">
html[lang="hu"] .ca-navwrap .mm-panel{--am-bg:rgba(255,255,255,.97);--am-ink:#1D1D1F;--am-mut:#86868B;--am-sub:#3A3A3F;--am-line:rgba(0,0,0,.08);--am-tile:linear-gradient(160deg,rgba(0,0,0,.035),rgba(0,0,0,.012));--am-hov:rgba(0,0,0,.045);--am-stage:radial-gradient(120% 90% at 50% 112%,rgba(226,0,26,.22),rgba(226,0,26,0) 58%),linear-gradient(180deg,#F7F7F5,#ECECE8);--am-ic:linear-gradient(145deg,#4A4D55,#24262B);--am-logo:brightness(0);--am-in:#fff}
html.ca-dark[lang="hu"] .ca-navwrap .mm-panel{--am-bg:rgba(20,21,24,.97);--am-ink:#F5F5F7;--am-mut:#8E8E93;--am-sub:#D1D1D6;--am-line:rgba(255,255,255,.09);--am-tile:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));--am-hov:rgba(255,255,255,.06);--am-stage:radial-gradient(120% 90% at 50% 112%,rgba(226,0,26,.42),rgba(226,0,26,0) 58%),radial-gradient(90% 70% at 50% 0%,rgba(255,255,255,.09),rgba(255,255,255,0) 60%),linear-gradient(180deg,#1C1D22,#0E0F12);--am-ic:linear-gradient(145deg,#3A3D45,#1B1C21);--am-logo:brightness(0) invert(1);--am-in:rgba(255,255,255,.06)}
html[lang="hu"] .ca-navwrap .mm-panel.ca-am-on{background:var(--am-bg)!important;color:var(--am-ink)!important;border:1px solid var(--am-line)!important;border-radius:24px!important;box-shadow:0 30px 80px rgba(0,0,0,.18)!important;-webkit-backdrop-filter:saturate(180%) blur(22px);backdrop-filter:saturate(180%) blur(22px);overflow:hidden}
html.ca-dark[lang="hu"] .ca-navwrap .mm-panel.ca-am-on{box-shadow:0 34px 90px rgba(0,0,0,.65)!important}
html[lang="hu"] .ca-navwrap .mm-panel.ca-am-on>:not(.ca-am){display:none!important}
html[lang="hu"] .ca-navwrap .mm-panel.ca-am-morph{transition:height .3s cubic-bezier(.3,.7,.2,1),opacity .16s ease,transform .16s ease!important}
#ca-am-dim{position:fixed;inset:0;background:rgba(10,10,12,.28);-webkit-backdrop-filter:blur(7px) saturate(120%);backdrop-filter:blur(7px) saturate(120%);opacity:0;visibility:hidden;transition:opacity .25s ease,visibility .25s;pointer-events:none}
#ca-am-dim.on{opacity:1;visibility:visible}
html.ca-dark #ca-am-dim{background:rgba(0,0,0,.45)}
.ca-am{color:var(--am-ink);-webkit-font-smoothing:antialiased;animation:caAmIn .3s cubic-bezier(.2,.7,.2,1) both}
.ca-am.am-swap{animation:caAmSw .28s ease both}
@keyframes caAmIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes caAmSw{from{opacity:0}to{opacity:1}}
.ca-am a{color:inherit;text-decoration:none}
.ca-am .am-grid{display:grid;grid-template-columns:380px minmax(0,1fr) 470px;gap:0 34px;padding:26px 28px 24px}
.ca-am .am-h{font-size:12px;font-weight:500;color:var(--am-mut);margin:0 0 12px}
.ca-am .am-tiles{display:flex;flex-direction:column;gap:10px}
.ca-am .am-t{position:relative;display:flex;gap:14px;align-items:center;padding:14px 40px 14px 14px;border-radius:18px;background:var(--am-tile);border:1px solid var(--am-line);overflow:hidden;transition:border-color .2s,box-shadow .2s,transform .2s}
.ca-am .am-t:before{content:"";position:absolute;right:-60px;top:-90px;width:220px;height:220px;background:radial-gradient(circle,rgba(226,0,26,.32),transparent 65%);opacity:0;transition:opacity .25s}
.ca-am .am-t:hover,.ca-am .am-t:focus-visible,.ca-am .am-tiles:not(:hover) .am-t.am-main{border-color:rgba(226,0,26,.5);box-shadow:0 0 0 1px rgba(226,0,26,.18),0 14px 34px rgba(226,0,26,.14);outline:none}
.ca-am .am-t:hover:before,.ca-am .am-tiles:not(:hover) .am-t.am-main:before{opacity:1}
.ca-am .am-t:hover{transform:translateX(2px)}
.ca-am .am-ic{position:relative;flex:none;width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:var(--am-ic);box-shadow:inset 0 1px 0 rgba(255,255,255,.2);transition:background .25s,box-shadow .25s}
.ca-am .am-t:hover .am-ic,.ca-am .am-tiles:not(:hover) .am-t.am-main .am-ic{background:linear-gradient(145deg,#FF3B4E,#B3001A);box-shadow:0 8px 18px rgba(226,0,26,.35),inset 0 1px 0 rgba(255,255,255,.35)}
.ca-am .am-ic svg{width:21px;height:21px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ca-am .am-t b{position:relative;display:flex;align-items:center;gap:8px;font-size:16.5px;font-weight:700;letter-spacing:-.01em;line-height:1.25}
.ca-am .am-t b i{font-style:normal;font-size:11px;font-weight:700;color:#fff;background:#E2001A;border-radius:999px;padding:2px 7px;letter-spacing:0}
.ca-am .am-t span{position:relative;display:block;font-size:12.5px;color:var(--am-mut);margin-top:2px;line-height:1.35}
.ca-am .am-t em{position:absolute;right:16px;top:50%;transform:translateY(-50%);font-style:normal;color:var(--am-mut);transition:transform .2s,color .2s}
.ca-am .am-t:hover em{color:#E2001A;transform:translate(3px,-50%)}
.ca-am .am-mid{display:flex;flex-direction:column;gap:22px;min-width:0;padding-top:2px}
.ca-am .am-links{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px}
.ca-am .am-links a{font-size:14px;font-weight:600;color:var(--am-sub);transition:color .15s}
.ca-am .am-links a:after{content:" ›";color:var(--am-mut)}
.ca-am .am-links a:hover{color:#E2001A}
.ca-am .am-chips{display:flex;flex-wrap:wrap;gap:7px}
.ca-am .am-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:11px;border:1px solid var(--am-line);font-size:13px;font-weight:600;color:var(--am-sub);transition:background .15s,border-color .15s,color .15s}
.ca-am .am-chip:hover,.ca-am .am-chip.on{background:var(--am-hov);border-color:rgba(226,0,26,.45);color:var(--am-ink)}
.ca-am .am-chip img{width:22px;height:16px;object-fit:contain;filter:var(--am-logo);opacity:.85}
.ca-am .am-chip svg{width:16px;height:16px;flex:none}
.ca-am .am-ngos{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center}
.ca-am .am-ngos img{height:30px;max-width:92px;object-fit:contain;filter:grayscale(1);mix-blend-mode:multiply;opacity:.6;transition:opacity .2s,filter .2s}
html.ca-dark .ca-am .am-ngos img{filter:grayscale(1) invert(1);mix-blend-mode:screen}
.ca-am .am-ngos a:hover img{opacity:1}
.ca-am .am-stage{position:relative;border-radius:22px;overflow:hidden;background:var(--am-stage);border:1px solid var(--am-line);min-height:292px;padding:18px 20px;display:flex;flex-direction:column}
.ca-am .am-st-top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ca-am .am-br{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.14em;font-size:12px;text-transform:uppercase}
.ca-am .am-br img{height:22px;width:auto;max-width:44px;object-fit:contain;filter:var(--am-logo)}
.ca-am .am-md{font-size:24px;font-weight:700;letter-spacing:-.02em;margin-top:4px;line-height:1.15}
.ca-am .am-pr{text-align:right;font-size:11.5px;color:var(--am-mut);white-space:nowrap}
.ca-am .am-pr b{display:block;font-size:21px;color:var(--am-ink);letter-spacing:-.01em}
.ca-am .am-car{position:absolute;left:50%;bottom:78px;transform:translateX(-50%);width:74%;max-height:150px;object-fit:contain;filter:drop-shadow(0 16px 16px rgba(0,0,0,.45));transition:opacity .25s,transform .35s cubic-bezier(.2,.7,.2,1)}
.ca-am .am-car.out{opacity:0;transform:translateX(-46%)}
.ca-am .am-st-bot{position:relative;z-index:2;margin-top:auto}
.ca-am .am-avail{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--am-mut);margin-top:6px}
.ca-am .am-avail:before{content:"";width:7px;height:7px;border-radius:50%;background:none;box-shadow:inset 0 0 0 4px #30D158}
.ca-am .am-slide{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--am-in);border:1px solid var(--am-line);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.ca-am .am-slide label{font-size:12px;color:var(--am-mut);white-space:nowrap}
.ca-am .am-slide label b{display:block;font-size:15px;color:var(--am-ink)}
.ca-am input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:4px;background:linear-gradient(90deg,#E2001A var(--p,50%),var(--am-line) var(--p,50%));outline:none}
.ca-am input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35),0 0 0 3px #E2001A;cursor:pointer}
.ca-am input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid #E2001A}
.ca-am .am-go{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:13px;font-weight:700;background:#E2001A;color:#fff!important;padding:9px 14px;border-radius:999px;transition:background .15s,transform .15s;border:0;cursor:pointer;font-family:inherit}
.ca-am .am-go:hover{background:#B80015;transform:translateY(-1px)}
.ca-am .am-go.wh{background:var(--am-ink);color:var(--am-bg)!important}
.ca-am .am-seg{display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:var(--am-hov)}
.ca-am .am-seg button{border:0;background:transparent;font:inherit;font-size:12.5px;font-weight:700;color:var(--am-mut);padding:6px 14px;border-radius:999px;cursor:pointer}
.ca-am .am-seg button.on{background:var(--am-ink);color:var(--am-bg)}
.ca-am .am-form{display:grid;grid-template-columns:1.3fr .8fr .9fr;gap:8px;margin-top:14px}
.ca-am .am-form select,.ca-am .am-form input{width:100%;box-sizing:border-box;height:42px;border-radius:12px;border:1px solid var(--am-line)!important;background:var(--am-in)!important;color:var(--am-ink)!important;font:inherit;font-size:13.5px;padding:0 12px;outline:none}
.ca-am .am-form select:focus,.ca-am .am-form input:focus{border-color:rgba(226,0,26,.6)!important}
.ca-am .am-form .am-go{grid-column:1/-1;justify-content:center;height:44px;font-size:14px}
.ca-am .am-st-h{font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.2}
.ca-am .am-st-p{font-size:13px;color:var(--am-mut);margin-top:5px;line-height:1.45}
.ca-am .am-bg{position:absolute;right:-6%;bottom:0;width:70%;opacity:.95;pointer-events:none;filter:drop-shadow(0 16px 16px rgba(0,0,0,.35))}
.ca-am .am-photo{position:absolute;inset:0;background:center/cover no-repeat}
.ca-am .am-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,12,.92) 0%,rgba(10,10,12,.7) 45%,rgba(10,10,12,.15) 100%)}
.ca-am .am-on-photo{color:#F5F5F7}.ca-am .am-on-photo .am-st-p{color:#C7C7CC}
.ca-am .am-stars{display:inline-flex;gap:2px;color:#F5B301}.ca-am .am-stars svg{width:15px;height:15px;fill:currentColor}
.ca-am .am-badge{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#fff;background:rgba(226,0,26,.9);border-radius:999px;padding:5px 11px}
.ca-am .am-bar{display:flex;align-items:center;gap:18px;padding:12px 28px;border-top:1px solid var(--am-line);font-size:12.5px;color:var(--am-mut);background:var(--am-hov)}
.ca-am .am-bar b{color:var(--am-ink);font-weight:600}
.ca-am .am-live{display:inline-flex;align-items:center;gap:8px}
.ca-am .am-live i{width:8px;height:8px;border-radius:50%;background:#30D158;box-shadow:0 0 0 4px rgba(48,209,88,.16);animation:caAmPulse 2s ease-in-out infinite}
.ca-am .am-live.off i{background:#FF9F0A;box-shadow:0 0 0 4px rgba(255,159,10,.16);animation:none}
@keyframes caAmPulse{50%{box-shadow:0 0 0 7px rgba(48,209,88,.05)}}
.ca-am .am-rec{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden}
.ca-am .am-rec a{white-space:nowrap;padding:4px 10px;border-radius:999px;border:1px solid var(--am-line);color:var(--am-sub);font-weight:600}
.ca-am .am-rec a:hover{color:#E2001A;border-color:rgba(226,0,26,.45)}
.ca-am .am-bar .am-sp{margin-left:auto}
.ca-am .am-bar a.am-ph{color:var(--am-ink);font-weight:600}
html body .ca-am *::before,html body .ca-am *::after,html.ca-dark[lang] body .ca-am .am-t::before,html.ca-dark[lang] body .ca-am .am-photo::after,html.ca-dark[lang] body .ca-navwrap .mm-panel .ca-am .am-t::before,html.ca-dark[lang] body .ca-navwrap .mm-panel .ca-am .am-photo::after{background-color:transparent!important}
.ca-am [data-st=sale] .am-car{left:auto;right:-4%;transform:none;width:58%!important;bottom:56px;max-height:150px}.ca-am [data-st=sale] .am-car.out{transform:translateX(16px)}
.ca-am [data-st=sale] .am-st-p{max-width:52%}
.mobilepanel .am-m a::after,.mobilepanel .am-m a::before{content:none!important;display:none!important}
.mobilepanel .m-sub:has(.am-m){grid-template-columns:minmax(0,1fr)!important}
.mobilepanel .am-m{min-width:0;max-width:100%;--m-ink:#1D1D1F;--m-mut:#86868B;--m-line:rgba(0,0,0,.08);--m-tile:linear-gradient(160deg,rgba(0,0,0,.035),rgba(0,0,0,.012));--m-ic:linear-gradient(145deg,#4A4D55,#24262B);--m-logo:brightness(0);color:var(--m-ink);padding:4px 2px 12px;text-align:left}
html.ca-dark .mobilepanel .am-m{--m-ink:#F5F5F7;--m-mut:#8E8E93;--m-line:rgba(255,255,255,.1);--m-tile:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));--m-ic:linear-gradient(145deg,#3A3D45,#1B1C21);--m-logo:brightness(0) invert(1)}
.mobilepanel .m-sub .am-m a,.mobilepanel .am-mbar a{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mobilepanel .m-sub .am-m a.am-mt{display:flex;align-items:center;gap:12px;padding:11px 12px;margin:0 0 8px;border-radius:16px;background:var(--m-tile);border:1px solid var(--m-line);color:var(--m-ink);width:100%}
.mobilepanel .m-sub .am-m a.am-mt.am-main{border-color:rgba(226,0,26,.45);box-shadow:0 10px 24px rgba(226,0,26,.12)}
.mobilepanel .am-m .am-ic{flex:none;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--m-ic)}
.mobilepanel .am-m .am-main .am-ic{background:linear-gradient(145deg,#FF3B4E,#B3001A);box-shadow:0 6px 14px rgba(226,0,26,.3)}
.mobilepanel .am-m .am-ic svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.mobilepanel .am-m .am-mx{display:block;min-width:0;flex:1}
.mobilepanel .am-m .am-mx b{display:block;font-size:16px;font-weight:700;letter-spacing:-.01em;line-height:1.25}
.mobilepanel .am-m .am-mx small{display:block;font-size:12.5px;color:var(--m-mut);margin-top:2px;line-height:1.3}
.mobilepanel .am-m em{font-style:normal;color:var(--m-mut);font-size:20px;line-height:1}
.mobilepanel .am-m .am-mh{font-size:12px;font-weight:500;color:var(--m-mut);margin:16px 4px 4px;text-transform:none;letter-spacing:0}
.mobilepanel .m-sub .am-m .am-ml a{display:flex;justify-content:space-between;align-items:center;width:100%;padding:12px 4px;border-bottom:1px solid var(--m-line);font-size:15px;font-weight:600;color:var(--m-ink)}
.mobilepanel .m-sub .am-m .am-ml a:last-child{border-bottom:0}
.mobilepanel .am-m .am-mcs{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mobilepanel .am-m .am-mcs::-webkit-scrollbar{display:none}
.mobilepanel .m-sub .am-m a.am-mc{flex:none;display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:12px;border:1px solid var(--m-line);font-size:13.5px;font-weight:600;color:var(--m-ink);white-space:nowrap}
.mobilepanel .am-m .am-mc img{width:22px;height:16px;object-fit:contain;filter:var(--m-logo);opacity:.85}
.mobilepanel .am-mbar{display:flex;flex-direction:column;gap:8px;padding:14px 12px;margin:8px 0;border-radius:16px;border:1px solid var(--m-line);font-size:13px;color:var(--m-mut)}
.mobilepanel .am-mbar b{color:var(--m-ink);font-weight:600}
.mobilepanel .am-mbar .am-live{display:inline-flex;align-items:center;gap:8px}
.mobilepanel .am-mbar .am-live i{width:8px;height:8px;border-radius:50%;background:#30D158;box-shadow:0 0 0 4px rgba(48,209,88,.16)}
.mobilepanel .am-mbar .am-live.off i{background:#FF9F0A;box-shadow:0 0 0 4px rgba(255,159,10,.16)}
.mobilepanel .am-mbar .am-mrow{display:flex;align-items:center;gap:8px}
.mobilepanel .am-mbar .am-stars{display:inline-flex;gap:2px;color:#F5B301}.mobilepanel .am-mbar .am-stars svg{width:14px;height:14px;fill:currentColor}
.mobilepanel .am-mbar a{margin-left:auto;color:var(--m-ink);font-weight:700}
@media(max-width:1250px){.ca-am .am-grid{grid-template-columns:330px minmax(0,1fr) 400px;gap:0 24px}}
</style>`;

// ikonok (vonalas, 24x24)
const IC = {
  car: '<path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4h-2"/><path d="M3 17v-4h18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  cmp: '<path d="M7 4v16M17 4v16M3 8h8M13 16h8"/>',
  tag: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
  garage: '<path d="M3 21V9l9-6 9 6v12"/><path d="M7 21v-8h10v8M7 17h10"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l4 4v2h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  scale: '<path d="M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c.5-3.5 3.5-5.5 7-5.5s6.5 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.6 2.6 4 5.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
};

// menük: csempék [cím, link, leírás, ikon, számláló], tudnivalók, gyors elérés, színpad
const MENUS = [
  { tiles: [['Bérelhető autóink', '/autoink/#berelheto', 'Új autók havidíjjal, azonnal elvihetők', 'car', 'rent'], ['Mi a tartós bérlet?', '/tartos-berlet/', 'Szerviz, adó, biztosítás egy havi díjban', 'info'], ['Autók összehasonlítása', '/auto-osszehasonlitas/', 'Akár 3 modell egymás mellett', 'cmp']],
    info: ['Tudnivalók', [['Bérlési folyamat', '/berlesi-folyamat/'], ['Feltételek és kaució', '/berlesi-feltetelek/'], ['Előnyök', '/berles-elonyei/'], ['Gyakori kérdések', '/berles-gyakori-kerdesek/']]],
    quick: ['Márkák', 'BRANDS'], stage: 'rent' },
  { tiles: [['Eladó autóink', '/autoink/', 'Ellenőrzött autók Németországból', 'tag', 'sale'], ['Egyedi autó rendelés', '/egyedi-auto-rendeles/', 'Új autó német áron, akár −25%', 'spark'], ['Finanszírozás – lízing', '/finanszirozas-lizing/', 'Havi részlet egy perc alatt', 'coin']],
    info: ['Tudnivalók', [['Operatív lízing', '/operativ-lizing/'], ['Előnyök', '/vasarlas-elonyei/'], ['Gyakori kérdések', '/vasarlas-gyakori-kerdesek/']]],
    quick: ['Új autó márkák szerint', 'BRANDS'], stage: 'sale' },
  { tiles: [['Eladom az autómat', '/eladom/', 'Ingyenes értékbecslés, mi intézünk mindent', 'key'], ['Bizományos autóink', '/bizomanyos/', 'Eladó autók ügyfeleinktől', 'garage', 'biz'], ['Jótékonyság', '/jotekonysag/', 'Minden eladás után adományozunk', 'heart']],
    info: ['Tudnivalók', [['Értékesítési folyamat', '/ertekesitesi-folyamat/'], ['Gyakori kérdések', '/gyakori-kerdesek/']]],
    quick: ['Akiket támogatunk', 'NGOS'], stage: 'sell' },
  { tiles: [['Autó rendelés', '/auto-rendeles/', 'Megkeressük, ellenőrizzük, hazahozzuk', 'truck'], ['Egyedül vagy velünk?', '/egyedul-vagy-velunk/', 'Költségek és kockázatok összevetve', 'scale'], ['Referenciák', '/referenciak/', '5000+ eladott prémium autó', 'users']],
    info: ['Tudnivalók', [['Beszerzési folyamat', '/beszerzesi-folyamat/'], ['Előnyök', '/elonyok/']]],
    quick: ['Kalkulátorok', [['Honosítás kalkulátor', '/honositas-kalkulator/'], ['Átírás kalkulátor', '/atiras-kalkulator/'], ['Lízing kalkulátor', '/finanszirozas-lizing/']]], stage: 'import' },
  { tiles: [['Miért mi?', '/miert-mi/', 'Német háttér, magyar ügyintézés', 'star'], ['Referenciák', '/referenciak/', 'Ügyfeleink történetei', 'users'], ['Kapcsolat', '/kapcsolat/', 'Solymár · Geretsried', 'pin']],
    info: ['Bizalom', [['Átláthatóság', '/atlathatosag/'], ['Minőségbiztosítás', '/minosegbiztositas/'], ['Media', '/media/'], ['Blog', '/blog/']]],
    quick: ['Kövess minket', 'SOCIAL'], stage: 'about' },
];

const CLIENT = function (CFG) {
  var M = CFG.menus, IC = CFG.ic, BC = CFG.bc, EC = CFG.ec;
  var path = location.pathname;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ic(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  // ---- legutóbb megnézett autók (a böngésző jegyzi meg) ----
  (function rec() {
    var m = path.match(/^\/(auto|berelheto-auto)\/([^\/]+)\/?$/); if (!m) return;
    function save() {
      var h = document.querySelector('h1'); var t = h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; if (!t) return;
      t = t.split(/[\/|–—]/)[0].trim().slice(0, 34);
      var L = (store('ca_recent') || []).filter(function (x) { return x && x.u !== path; });
      L.unshift({ u: path + location.search, t: t }); store('ca_recent', L.slice(0, 6));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(save, 400); }); else setTimeout(save, 400);
  })();

  // ---- a menüből érkező adatok előre kitöltése ----
  (function prefill() {
    var q = new URLSearchParams(location.search); if (!q.has('am')) return;
    function setSel(id, val) { var s = document.getElementById(id); if (!s || !val) return false; var o = [].filter.call(s.options || [], function (x) { return (x.value || x.textContent).trim().toLowerCase() === String(val).toLowerCase() || x.textContent.trim().toLowerCase() === String(val).toLowerCase(); })[0]; if (!o) return false; s.value = o.value; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); return true; }
    function setIn(id, val) { var s = document.getElementById(id); if (!s || !val) return; s.value = val; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); }
    var tries = 0;
    (function go() {
      tries++;
      if (/^\/eladom\/?$/.test(path)) { var a = setSel('f-make', q.get('marka')); setSel('f-year', q.get('ev')); setIn('f-km', q.get('km')); if (!a && tries < 20) return setTimeout(go, 300); }
      if (/^\/honositas-kalkulator\/?$/.test(path)) { var le = document.getElementById('egysegLe'); if (le && q.get('le') && le.getAttribute('aria-pressed') !== 'true') le.click(); setIn('teljesitmeny', q.get('le')); var b = setSel('elsoEv', q.get('ev')); if (!b && tries < 20) return setTimeout(go, 300); }
    })();
  })();

  // ---- adatok: bérelhető modellek (az /autoink/ oldal window.SUB adataiból) ----
  var RENT = null, RATE = 364, rentP = null;
  function jsonAt(t, i) { var d = 0, q = false, e = false; for (var j = i; j < t.length; j++) { var ch = t[j]; if (q) { if (e) e = false; else if (ch === '\\') e = true; else if (ch === '"') q = false; continue; } if (ch === '"') q = true; else if (ch === '{' || ch === '[') d++; else if (ch === '}' || ch === ']') { d--; if (!d) return t.slice(i, j + 1); } } return '{}'; }
  function rhref(b, mo) { var D = { '1': '1-es', '2': '2-es', '3': '3-as', '4': '4-es', '5': '5-ös', '6': '6-os', '7': '7-es', '8': '8-as' }; var n = (b === 'VW' ? 'Volkswagen' : b) + ' ' + String(mo).replace(/\b(\d)er\b/g, function (_, d) { return D[d] || d; }).replace(/\bLimousine\b/g, 'Limuzin').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, '$1-osztály'); return '/berelheto-auto/' + n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-berles/'; }
  function dname(mo) { var D = { '1': '1-es', '2': '2-es', '3': '3-as', '4': '4-es', '5': '5-ös', '6': '6-os', '7': '7-es', '8': '8-as' }; return String(mo).replace(/\b(\d)er\b/g, function (_, d) { return D[d] || d; }).replace(/\bLimousine\b/g, 'Limuzin').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, '$1-osztály'); }
  function loadRent() {
    if (rentP) return rentP;
    var rp = fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=HUF').then(function (r) { return r.json(); }).then(function (j) { if (j && j.rates && j.rates.HUF) RATE = j.rates.HUF; }).catch(function () {});
    rentP = Promise.all([fetch('/autoink/', { credentials: 'same-origin' }).then(function (r) { return r.text(); }), rp]).then(function (res) {
      var t = res[0], i = t.search(/window\.SUB\s*=/); if (i < 0) return;
      var S = JSON.parse(jsonAt(t, t.indexOf('{', i))); var pm = /var PHOTO\s*=\s*(\{[^;]*?\});/.exec(t); var PH = pm ? JSON.parse(pm[1]) : {};
      if (!RATE) RATE = S.rate_fallback || 364;
      RENT = (S.models || []).filter(function (m) { return m.net; }).map(function (m) {
        var img = PH[m.brand + ' ' + m.model] || '', k = (img.match(/\/berles\/([^\/?#]+)\.webp/) || [])[1];
        return { b: m.brand === 'VW' ? 'Volkswagen' : m.brand, bk: bkey(m.brand), m: dname(m.model), ft: Math.ceil((m.net + 750) * RATE / 10000) * 10000, n: m.count || 0, now: m.now || 0, cut: k && BC.indexOf(k) > -1 ? '/berles-cut/' + k + '.webp' : '', href: rhref(m.brand, m.model) };
      });
    }).catch(function () {});
    return rentP;
  }
  function bkey(b) { b = String(b || '').toLowerCase(); return { vw: 'volkswagen', 'mercedes-benz': 'mercedes' }[b] || b; }

  // ---- a mega menü saját (rejtett) adatai ----
  function brands(p) { var o = []; [].forEach.call(p.querySelectorAll('.mm-brands .mm-b'), function (a) { var t = (a.textContent || '').trim(), im = a.querySelector('img'); if (t && !a.classList.contains('mm-ball')) o.push({ t: t, h: a.getAttribute('href'), img: im ? im.getAttribute('src') : '', k: bkey(t) }); }); return o; }
  function count(p, re) { var n = ''; [].forEach.call(p.querySelectorAll('.mm-more'), function (a) { var t = a.textContent || ''; if (re.test(t)) { var m = t.match(/\((\d+)\)/); if (m) n = m[1]; } }); return n; }
  function ngos(p) { var o = [], seen = {}; [].forEach.call(p.querySelectorAll('.mm-ngos .mm-ng'), function (a) { var im = a.querySelector('img'); if (im && !seen[im.src]) { seen[im.src] = 1; o.push({ src: im.getAttribute('src'), t: a.getAttribute('title') || im.alt || '' }); } }); return o; }
  function socials(p) { var o = []; [].forEach.call(p.querySelectorAll('.mm-schip'), function (a) { var s = a.querySelector('svg'); o.push({ t: (a.textContent || '').trim(), h: a.getAttribute('href'), svg: s ? s.outerHTML.replace(/mm(Fb|Ig)/g, 'am$1') : '' }); }); return o; }
  var cache = {};

  // ---- élő állapot (Budapest, H–P 9–17) ----
  function live() {
    var d; try { d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Budapest' })); } catch (e) { d = new Date(); }
    var wd = d.getDay(), h = d.getHours() + d.getMinutes() / 60, open = wd >= 1 && wd <= 5 && h >= 9 && h < 17;
    if (open) return '<span class="am-live"><i></i><span><b>Most elérhetők vagyunk</b> · válasz 1 órán belül</span></span>';
    var nx = (wd === 5 && h >= 17) || wd === 6 || wd === 0 ? 'hétfőn 9-től' : (h < 9 ? 'ma 9-től' : 'holnap 9-től');
    return '<span class="am-live off"><i></i><span>Üzenj nyugodtan, <b>' + nx + '</b> válaszolunk</span></span>';
  }
  var STARS = '<span class="am-stars">' + new Array(6).join('<svg viewBox="0 0 24 24"><path d="M12 2.6l2.83 6.07 6.64.73-4.95 4.5 1.36 6.55L12 17.1l-5.88 3.35 1.36-6.55-4.95-4.5 6.64-.73z"/></svg>') + '</span>';
  function bar() {
    var R = (store('ca_recent') || []).slice(0, 3), left = R.length ? '<span class="am-rec"><span>Legutóbb megnézett:</span>' + R.map(function (x) { return '<a href="' + esc(x.u) + '">' + esc(x.t) + '</a>'; }).join('') + '</span>' : live();
    return '<div class="am-bar">' + left + '<span class="am-sp"></span>' + (R.length ? live() : '') + '<span class="am-live" style="gap:6px">' + STARS + '<span><b>5,0</b> Google</span></span><a class="am-ph" href="tel:+36302336060">+36 30 233 6060</a></div>';
  }

  // ---- színpadok ----
  function stRent() {
    return '<div class="am-stage" data-st="rent"><div class="am-st-top"><div><div class="am-br"><img alt="" src=""><span></span></div><div class="am-md">&nbsp;</div><div class="am-avail" style="visibility:hidden"></div></div><div class="am-pr">havidíj<b>&nbsp;</b>-tól · nettó</div></div>'
      + '<img class="am-car out" alt="">'
      + '<div class="am-st-bot"><div class="am-slide"><label>Havi keret<b class="am-bud">450 000 Ft</b></label><input type="range" min="250000" max="1000000" step="10000" value="450000" aria-label="Havi keret"><a class="am-go am-fit" href="/autoink/#berelheto">0 autó →</a></div></div></div>';
  }
  function stSale(cn) {
    return '<div class="am-stage" data-st="sale"><div class="am-st-top"><div><div class="am-seg"><button type="button" class="on" data-v="new">Új autók</button><button type="button" data-v="used">Használt autók</button></div>'
      + '<div class="am-md am-sh" style="margin-top:12px">Új autó német áron</div><div class="am-st-p am-sp2">BMW, MINI, Mercedes, Audi – gyári garanciával</div></div><span class="am-badge am-sb">akár −25%</span></div>'
      + '<img class="am-car" alt="" src="/mini-jcw-premium-auto-eladas-cut.webp" style="width:62%">'
      + '<div class="am-st-bot" style="display:flex;justify-content:flex-end"><a class="am-go am-sl" href="/egyedi-auto-rendeles/">Konfigurálom →</a></div></div>';
  }
  function stSell() {
    var mk = ['Audi', 'BMW', 'Mercedes-Benz', 'MINI', 'Porsche', 'Volkswagen', 'Skoda', 'Toyota', 'Ford', 'Opel', 'Volvo', 'Egyéb'], y = new Date().getFullYear(), ys = '';
    for (var i = y; i >= y - 20; i--) ys += '<option>' + i + '</option>';
    return '<div class="am-stage" data-st="sell"><img class="am-bg" alt="" src="/elado-cut/jaguar-f-type-s-3-0-v6-s-c-automata.webp" style="opacity:.16;width:78%;right:-14%;bottom:-6%;filter:none">'
      + '<div style="position:relative;z-index:2"><div class="am-st-h">Mennyit ér az autód?</div><div class="am-st-p">Ingyenes értékbecslés 24 órán belül. Mi hirdetjük, bemutatjuk és intézzük a papírokat.</div>'
      + '<form class="am-form" action="/eladom/" method="get"><input type="hidden" name="am" value="1"><select name="marka" aria-label="Márka"><option value="">Márka</option>' + mk.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>'
      + '<select name="ev" aria-label="Évjárat"><option value="">Évjárat</option>' + ys + '</select><input name="km" type="number" min="0" step="1000" placeholder="Km" aria-label="Kilométer">'
      + '<button class="am-go" type="submit">Ingyenes értékbecslés →</button></form></div></div>';
  }
  function stImport() {
    var y = new Date().getFullYear(), ys = '';
    for (var i = y; i >= y - 15; i--) ys += '<option>' + i + '</option>';
    return '<div class="am-stage" data-st="import"><img class="am-bg" alt="" src="/autoszallitas-autoimport-nemetorszagbol-cut.webp" style="width:50%;right:-3%;bottom:auto;top:22px">'
      + '<div style="position:relative;z-index:2;max-width:48%"><span class="am-badge">Csak 30% előleg</span><div class="am-st-h" style="margin-top:10px">Autó Németországból, kulcsrakészen</div><div class="am-st-p">Szállítás, honosítás, forgalomba helyezés – mi intézzük.</div></div>'
      + '<div class="am-st-bot" style="position:relative;z-index:2"><div class="am-h" style="margin:0 0 8px">Honosítás gyorsan</div><form class="am-form" action="/honositas-kalkulator/" method="get" style="grid-template-columns:1fr 1fr auto;margin:0"><input type="hidden" name="am" value="1">'
      + '<input name="le" type="number" min="40" max="1200" placeholder="Teljesítmény (LE)" aria-label="Teljesítmény lóerőben"><select name="ev" aria-label="Első forgalomba helyezés éve"><option value="">Évjárat</option>' + ys + '</select><button class="am-go" type="submit" style="grid-column:auto;height:42px">Kiszámolom →</button></form></div></div>';
  }
  function stAbout() {
    return '<div class="am-stage am-on-photo" data-st="about" style="background:#111"><div class="am-photo" style="background-image:url(\'/caradvance-iroda.webp\')"></div>'
      + '<div style="position:relative;z-index:2;max-width:64%"><div class="am-st-h">Gyere be hozzánk</div><div class="am-st-p">Solymár, Ibolya utca 18.<br>Hétfőtől péntekig 9–17</div>'
      + '<div style="margin-top:18px;display:flex;align-items:center;gap:10px">' + STARS + '<span style="font-size:22px;font-weight:800">5,0</span></div><div class="am-st-p" style="margin-top:2px">Google-értékelés · elégedett ügyfeleink szerint</div></div>'
      + '<div class="am-st-bot" style="position:relative;z-index:2;display:flex;gap:8px"><a class="am-go" href="/kapcsolat/">Kapcsolat →</a><a class="am-go wh" href="/referenciak/" style="background:#fff;color:#111!important">Referenciák</a></div></div>';
  }

  // ---- panel felépítése ----
  function build(p, i) {
    var C = M[i]; if (!C) return null;
    var bs = brands(p); if (bs.length) cache['b' + i] = bs; bs = cache['b' + i] || [];
    var ng = ngos(p); if (ng.length) cache.ng = ng; ng = cache.ng || [];
    var so = socials(p); if (so.length) cache.so = so; so = cache.so || [];
    var cn = { rent: count(p, /bérelhető/i), sale: count(p, /eladó/i), biz: count(p, /bizományos/i) };
    ['rent', 'sale', 'biz'].forEach(function (k) { if (cn[k]) cache[k] = cn[k]; else cn[k] = cache[k] || ''; });
    var tiles = C.tiles.map(function (t, k) { var n = t[4] && cn[t[4]]; return '<a class="am-t' + (k === 0 ? ' am-main' : '') + '" href="' + esc(t[1]) + '"><span class="am-ic">' + ic(t[3]) + '</span><div><b>' + esc(t[0]) + (n ? ' <i>' + esc(n) + '</i>' : '') + '</b><span>' + esc(t[2]) + '</span></div><em>→</em></a>'; }).join('');
    var info = '<div><p class="am-h">' + esc(C.info[0]) + '</p><div class="am-links">' + C.info[1].map(function (x) { return '<a href="' + esc(x[1]) + '">' + esc(x[0]) + '</a>'; }).join('') + '</div></div>';
    var q = C.quick, qh = '';
    if (q[1] === 'BRANDS') qh = '<div class="am-chips">' + bs.map(function (b) { return '<a class="am-chip" data-bk="' + esc(b.k) + '" href="' + esc(b.h) + '">' + (b.img ? '<img alt="" src="' + esc(b.img) + '">' : '') + esc(b.t) + '</a>'; }).join('') + '</div>';
    else if (q[1] === 'NGOS') qh = '<div class="am-ngos">' + ng.map(function (n) { return '<a href="/jotekonysag/" title="' + esc(n.t) + '"><img alt="' + esc(n.t) + '" src="' + esc(n.src) + '"></a>'; }).join('') + '</div>';
    else if (q[1] === 'SOCIAL') qh = '<div class="am-chips">' + so.map(function (s) { return '<a class="am-chip" target="_blank" rel="noopener" href="' + esc(s.h) + '">' + s.svg + esc(s.t) + '</a>'; }).join('') + '</div>';
    else qh = '<div class="am-chips">' + q[1].map(function (x) { return '<a class="am-chip" href="' + esc(x[1]) + '">' + esc(x[0]) + '</a>'; }).join('') + '</div>';
    var stage = { rent: stRent, sale: stSale, sell: stSell, import: stImport, about: stAbout }[C.stage](cn);
    var d = document.createElement('div'); d.className = 'ca-am'; d.setAttribute('data-i', i);
    d.innerHTML = '<div class="am-grid"><div class="am-tiles">' + tiles + '</div><div class="am-mid">' + info + '<div><p class="am-h">' + esc(q[0]) + '</p>' + qh + '</div></div><div>' + stage + '</div></div>' + bar();
    wire(d, C.stage, cn);
    return d;
  }

  // ---- interakciók a színpadokon ----
  function wire(d, st, cn) {
    if (st === 'rent') {
      var S = d.querySelector('.am-stage'), car = S.querySelector('.am-car'), rng = S.querySelector('input[type=range]'), fit = S.querySelector('.am-fit'), bud = S.querySelector('.am-bud'), cur = '';
      function show(bk) {
        if (!RENT) return; var L = RENT.filter(function (m) { return m.cut && (!bk || m.bk === bk); }); if (!L.length) L = RENT.filter(function (m) { return m.cut; }); if (!L.length) return;
        var m = L.slice().sort(function (a, b) { return (b.now - a.now) || (b.n - a.n); })[0]; if (cur === m.href) return; cur = m.href;
        var bi = d.querySelector('.am-chip[data-bk="' + m.bk + '"] img'); var br = S.querySelector('.am-br');
        br.querySelector('img').src = bi ? bi.getAttribute('src') : ''; br.querySelector('img').style.display = bi ? '' : 'none'; br.querySelector('span').textContent = m.b;
        S.querySelector('.am-md').textContent = m.m; S.querySelector('.am-pr b').textContent = fmt(m.ft) + ' Ft';
        var av = S.querySelector('.am-avail'); av.textContent = m.now ? m.now + ' azonnal elérhető' : m.n + ' autó elérhető'; av.style.visibility = 'visible';
        car.classList.add('out'); var n = new Image(); n.onload = function () { car.src = m.cut; car.alt = m.b + ' ' + m.m; requestAnimationFrame(function () { car.classList.remove('out'); }); }; n.src = m.cut;
        S.onclick = function (e) { if (e.target.closest('.am-slide')) return; location.href = m.href; }; S.style.cursor = 'pointer';
      }
      function budget() {
        var v = +rng.value; bud.textContent = fmt(v) + ' Ft'; rng.style.setProperty('--p', ((v - rng.min) / (rng.max - rng.min) * 100) + '%');
        if (!RENT) return; var n = 0, mods = 0; RENT.forEach(function (m) { if (m.ft <= v) { n += m.n; mods++; } });
        fit.textContent = (n ? fmt(n) + ' autó' : 'Nincs autó') + ' →'; fit.title = mods + ' modell fér bele';
      }
      var sv = store('ca_am_bud'); if (sv) rng.value = sv;
      rng.addEventListener('input', function () { budget(); store('ca_am_bud', +rng.value); });
      [].forEach.call(d.querySelectorAll('.am-chip[data-bk]'), function (a) { a.addEventListener('mouseenter', function () { [].forEach.call(d.querySelectorAll('.am-chip.on'), function (x) { x.classList.remove('on'); }); a.classList.add('on'); show(a.getAttribute('data-bk')); }); });
      budget(); loadRent().then(function () { show(''); budget(); });
    }
    if (st === 'sale') {
      var S2 = d.querySelector('.am-stage'), car2 = S2.querySelector('.am-car');
      var V = { new: ['Új autó német áron', 'BMW, MINI, Mercedes, Audi – gyári garanciával', 'akár −25%', '/mini-jcw-premium-auto-eladas-cut.webp', '/egyedi-auto-rendeles/', 'Konfigurálom →'],
        used: ['Ellenőrzött használt autók', 'Dokumentált előélet, valós km, Németországból', (cn.sale ? cn.sale + ' autó' : 'Készleten'), '/bmw-m3-touring-premium-auto-eladas-cut.webp', '/autoink/', 'Megnézem →'] };
      [].forEach.call(S2.querySelectorAll('.am-seg button'), function (b) {
        b.addEventListener('click', function (e) { e.preventDefault(); var v = V[b.getAttribute('data-v')]; [].forEach.call(S2.querySelectorAll('.am-seg button'), function (x) { x.classList.toggle('on', x === b); });
          S2.querySelector('.am-sh').textContent = v[0]; S2.querySelector('.am-sp2').textContent = v[1]; S2.querySelector('.am-sb').textContent = v[2]; var go = S2.querySelector('.am-sl'); go.href = v[4]; go.textContent = v[5];
          car2.classList.add('out'); setTimeout(function () { car2.src = v[3]; car2.classList.remove('out'); }, 180); });
        b.addEventListener('mouseenter', function () { b.click(); });
      });
    }
  }

  // ---- dark-mode.js ne színezze a panelt ----
  function clean(p) {
    if (!p.hasAttribute('data-dm-skip')) p.setAttribute('data-dm-skip', '');
    if (p.hasAttribute('data-dmbg')) { var b = p.getAttribute('data-dmbg'); p.style.removeProperty('background-color'); if (b) p.style.setProperty('background-color', b); p.removeAttribute('data-dmbg'); }
    [].slice.call(p.classList).forEach(function (c) { if (/^dm-/.test(c)) p.classList.remove(c); });
  }

  // ---- elhomályosuló háttér ----
  var dim = null;
  function dimSet(on) {
    if (!dim) { dim = document.createElement('div'); dim.id = 'ca-am-dim'; document.body.appendChild(dim); var w = document.querySelector('.ca-navwrap'), z = w ? parseInt(getComputedStyle(w).zIndex, 10) : 0; dim.style.zIndex = String((z > 0 ? z : 1000) - 1); }
    dim.classList.toggle('on', !!on);
  }

  // ---- szinkron: a mega menü aktív pontja alapján ----
  function sync() {
    var p = document.querySelector('.ca-navwrap .mm-panel'); if (!p) return; clean(p);
    dimSet(p.classList.contains('open'));
    var its = [].slice.call(document.querySelectorAll('.ca-nav .menu .navitem')), act = document.querySelector('.ca-nav .menu .navitem.mm-act'), i = its.indexOf(act); if (i < 0) return;
    var sg = i + '|' + brands(p).length + '|' + count(p, /bérelhető/i) + count(p, /eladó/i) + count(p, /bizományos/i) + '|' + ngos(p).length + '|' + socials(p).length;
    var cur = p.querySelector(':scope>.ca-am'); if (cur && cur.__sg === sg) return;
    var same = cur && +cur.getAttribute('data-i') === i; if (same && cur.__lock) return;
    var d = build(p, i); if (!d) return; d.__sg = sg;
    var open = p.classList.contains('open') && cur && !same, h0 = open ? p.offsetHeight : 0;
    if (same) d.style.animation = 'none'; else if (cur) d.classList.add('am-swap');
    if (cur) cur.remove(); p.appendChild(d); p.classList.add('ca-am-on');
    if (same && cur.querySelector('input:focus,select:focus')) { d.remove(); p.appendChild(cur); return; }
    if (open) { // átúszás az új magasságra
      var h1 = p.offsetHeight; if (Math.abs(h1 - h0) > 2) { p.style.height = h0 + 'px'; void p.offsetHeight; p.classList.add('ca-am-morph'); p.style.height = h1 + 'px'; clearTimeout(p.__mt); p.__mt = setTimeout(function () { p.style.height = ''; p.classList.remove('ca-am-morph'); }, 330); }
    }
  }
  // ---- mobil menü: ugyanez a szerkezet a lenyíló harmonikákban ----
  function mobile() {
    var mp = document.querySelector('.mobilepanel'); if (!mp || mp.__am) return; var accs = [].slice.call(mp.querySelectorAll('.m-acc')); if (!accs.length) return; mp.__am = 1;
    accs.forEach(function (a, i) {
      var sub = a.querySelector('.m-sub'), C = M[i]; if (!sub || !C) return;
      var bs = [].map.call(sub.querySelectorAll('a.m-subitem'), function (x) { var im = x.querySelector('img'); return { t: (x.textContent || '').trim(), h: x.getAttribute('href'), img: im ? im.getAttribute('src') : '' }; });
      var h = C.tiles.map(function (t, k) { return '<a class="am-mt' + (k === 0 ? ' am-main' : '') + '" href="' + esc(t[1]) + '"><span class="am-ic">' + ic(t[3]) + '</span><span class="am-mx"><b>' + esc(t[0]) + '</b><small>' + esc(t[2]) + '</small></span><em>›</em></a>'; }).join('');
      h += '<p class="am-mh">' + esc(C.info[0]) + '</p><div class="am-ml">' + C.info[1].map(function (x) { return '<a href="' + esc(x[1]) + '">' + esc(x[0]) + '<em>›</em></a>'; }).join('') + '</div>';
      var q = C.quick, ch = '';
      if (q[1] === 'BRANDS') ch = bs.map(function (b) { return '<a class="am-mc" href="' + esc(b.h) + '">' + (b.img ? '<img alt="" src="' + esc(b.img) + '">' : '') + esc(b.t) + '</a>'; }).join('');
      else if (q[1] === 'SOCIAL') ch = CFG.soc.map(function (x) { return '<a class="am-mc" target="_blank" rel="noopener" href="' + esc(x[1]) + '">' + esc(x[0]) + '</a>'; }).join('');
      else if (q[1] === 'NGOS') ch = '<a class="am-mc" href="/jotekonysag/">Akiket támogatunk ›</a>';
      else ch = q[1].map(function (x) { return '<a class="am-mc" href="' + esc(x[1]) + '">' + esc(x[0]) + '</a>'; }).join('');
      if (ch) h += '<p class="am-mh">' + esc(q[0]) + '</p><div class="am-mcs">' + ch + '</div>';
      sub.innerHTML = '<div class="am-m" data-dm-skip>' + h + '</div>';
    });
    var k = mp.querySelector('.m-kapcsolat'), bx = document.createElement('div'); bx.className = 'am-m am-mbar'; bx.setAttribute('data-dm-skip', '');
    bx.innerHTML = live() + '<span class="am-mrow">' + STARS + '<span><b>5,0</b> Google</span><a href="tel:+36302336060">+36 30 233 6060</a></span>';
    if (k) mp.insertBefore(bx, k); else mp.appendChild(bx);
  }
  function boot() {
    var w = document.querySelector('.ca-navwrap'); if (!w) return; try { mobile(); } catch (e) {} sync(); var t = 0;
    new MutationObserver(function (ms) { for (var k = 0; k < ms.length; k++) { var tg = ms[k].target; if (tg.closest && tg.closest('.ca-am')) continue; clearTimeout(t); t = setTimeout(sync, 10); return; } })
      .observe(w, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    // a bérlési adatokat előre betöltjük, amikor az egér a menüsor fölé ér
    w.addEventListener('mouseenter', function () { loadRent(); }, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
};

const SOC = [['Facebook', 'https://www.facebook.com/caradvancehungary/'], ['Instagram', 'https://www.instagram.com/caradvance_hungary/'], ['YouTube', 'https://www.youtube.com/channel/UCbmogjjIDqVwFtFoA-h3jjw'], ['TikTok', 'https://www.tiktok.com/search?q=caradvance'], ['LinkedIn', 'https://www.linkedin.com/search/results/companies/?keywords=caradvance']];
const JS = '<script id="ca-mm-hu-js">(' + CLIENT.toString() + ')(' + JSON.stringify({ menus: MENUS, ic: IC, bc: BC, ec: EC, soc: SOC }) + ');</script>';

function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out); else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}

try {
  if (!fs.existsSync(DIST)) console.log('[hu-menu] nincs dist — kihagyva');
  else {
    let n = 0;
    for (const f of walk(DIST, [])) {
      const rel = path.relative(DIST, f).split(path.sep).join('/');
      if (SKIP.test(rel)) continue;
      let h = fs.readFileSync(f, 'utf8');
      if (!/<html[^>]*\slang="hu"/.test(h) || h.indexOf('class="ca-navwrap"') < 0 || h.indexOf('id="ca-mm-hu"') > -1) continue;
      h = h.replace('</head>', () => CSS + JS + '</head>');
      fs.writeFileSync(f, h); n++;
    }
    console.log('[hu-menu] prémium mega menü: ' + n + ' magyar oldal');
  }
} catch (e) { console.log('[hu-menu] hiba:', e.message); }
