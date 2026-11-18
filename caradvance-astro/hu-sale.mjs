// hu-sale.mjs — Eladó autóink (HU, /autoink/ „Eladó autók” fül) letisztult nézet
// 1 fejléc · 2 ragadós üveg szűrősáv (keresés, márka-chipek, Szűrők, Rendezés) · 3 letisztult kártyák
// 4 kiemelt autók elöl (a sorrend nem változik, csak jelölés) · 5 „Továbbiak betöltése” · 6 egységes sötét mód.
// A fotókhoz NEM nyúl (méret, vágás, szín marad). Csak a magyar /autoink/ oldal, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'autoink', 'index.html');

const H = 'html.ca-sl ';
const P = 'html.ca-sl body ';
const D = 'html.ca-sl.ca-dark body ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:rgba(255,255,255,.86)!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';

const CSS = '<style id="ca-sl-css">'
  // ---- 1) fejléc
  + P + '[data-hero="eladas"] .brand-logo{display:none!important}'
  + P + 'section.hero video.video-bg{filter:brightness(.6) saturate(1.05)}'
  + P + '[data-hero="eladas"] :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.5),0 1px 3px rgba(0,0,0,.35)}'
  + P + '[data-hero="eladas"] .sub{max-width:600px;margin-left:auto;margin-right:auto}'
  + P + '[data-hero="eladas"].on{padding-top:92px}'
  + P + '.ca-slst{display:flex;justify-content:center;margin:18px auto 24px}'
  + P + '.ca-slst span{display:flex;flex-direction:column;align-items:center;padding:0 24px;color:rgba(255,255,255,.78);font-size:12.5px;font-weight:600;text-shadow:0 1px 10px rgba(0,0,0,.4)}'
  + P + '.ca-slst span+span{border-left:1px solid rgba(255,255,255,.28)}'
  + P + '.ca-slst b{color:#fff;font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-bottom:2px}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}' + P + '[data-hero="eladas"].on{padding-top:64px}' + P + '.ca-slst span{padding:0 11px;font-size:11px}' + P + '.ca-slst b{font-size:18px}'
  + P + '[data-hero="eladas"] .cta-row{flex-wrap:nowrap!important;gap:8px!important;justify-content:center}' + P + '[data-hero="eladas"] .cta-row .btn{padding:12px 16px!important;font-size:14px!important;white-space:nowrap}}'
  // ---- 2) fülek + szűrősáv
  + P + '#autok.autok-head{display:flex;justify-content:center;margin:0 0 14px!important}'
  + P + '.autok-tabs{' + CARD + 'border-radius:999px!important}'
  + D + '.autok-tabs{' + CARDD + 'border-radius:999px!important}'
  + P + '.autok-tab.on{background:#121317!important;color:#fff!important}' + D + '.autok-tab.on{background:#fff!important;color:#121317!important}'
  + P + '.filters.ca-slf{display:none!important}'
  + P + '.ca-sbar{position:sticky;top:92px;z-index:30;display:flex;align-items:center;gap:8px;margin:0 0 14px;padding:8px;border-radius:20px;background:rgba(255,255,255,.95);border:1px solid ' + LN + ';box-shadow:0 8px 26px rgba(18,19,23,.07)}'
  + 'html.ca-sl body .wrap .ca-sbar.ca-sbar{background:rgba(255,255,255,.97)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' + 'html.ca-sl.ca-dark body .wrap .ca-sbar.ca-sbar{background:rgba(24,25,30,.97)!important}' + D + '.ca-sbar{background:rgba(22,23,28,.94);border-color:rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.35)}'
  + P + '.ca-sbar .sq{flex:0 1 240px;min-width:150px;position:relative}'
  + P + '.ca-sbar .sq input{width:100%;height:42px;box-sizing:border-box;padding:0 14px 0 38px;border-radius:13px;border:1px solid ' + LN + ';background:rgba(18,19,23,.035);font:inherit;font-size:14px;color:inherit;outline:none}'
  + D + '.ca-sbar .sq input{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}'
  + P + '.ca-sbar .sq svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);width:16px;height:16px;opacity:.5;pointer-events:none}'
  + P + '.ca-sbar .chips{display:flex;gap:4px;flex:1 1 auto;min-width:0;overflow-x:auto;scrollbar-width:none;-webkit-mask:linear-gradient(90deg,#000 90%,transparent);mask:linear-gradient(90deg,#000 90%,transparent);padding-right:22px}'
  + P + '.ca-sbar .chips::-webkit-scrollbar{display:none}'
  + P + '.ca-sbar .chip{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;height:42px;min-width:42px;padding:0 13px;border-radius:13px;border:1px solid transparent;background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:13.5px;line-height:1;cursor:pointer;white-space:nowrap}'
  + P + '.ca-sbar .chip img{height:21px;width:auto;max-width:50px;object-fit:contain}'
  + 'html.ca-sl:not(.ca-dark) body .ca-sbar .chip img{filter:brightness(0);opacity:.82}' + D + '.ca-sbar .chip img{filter:brightness(0) invert(1);opacity:.85}'
  + P + '.ca-sbar .chip:hover{background:rgba(18,19,23,.05)}' + D + '.ca-sbar .chip:hover{background:rgba(255,255,255,.06)}'
  + P + '.ca-sbar .chip.on{background:#fff;border-color:rgba(18,19,23,.12);box-shadow:0 2px 8px rgba(18,19,23,.08)}'
  + D + '.ca-sbar .chip.on{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.14);box-shadow:none}'
  + P + '.ca-sbar .fb{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 14px;border-radius:13px;border:1px solid rgba(18,19,23,.1);background:#fff;color:#121317;font-family:inherit;font-weight:700;font-size:13.5px;line-height:1;cursor:pointer;white-space:nowrap}'
  + D + '.ca-sbar .fb{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#fff}'
  + P + '.ca-sbar .fb i{font-style:normal;display:none;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#E2001A;color:#fff;font-size:11px;line-height:18px;text-align:center}'
  + P + '.ca-sbar .fb.has i{display:inline-block}'
  + P + '.ca-sbar .pnl{position:absolute;right:8px;top:calc(100% + 8px);width:min(420px,calc(100vw - 32px));padding:16px;border-radius:18px;background:#fff;border:1px solid ' + LN + ';box-shadow:0 18px 50px rgba(18,19,23,.16);display:none;z-index:2}'
  + 'html.ca-sl body .wrap .ca-sbar .pnl.pnl{background:#fff!important;background-color:#fff!important;opacity:1!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;z-index:5}' + 'html.ca-sl.ca-dark body .wrap .ca-sbar .pnl.pnl{background:#1C1D22!important;background-color:#1C1D22!important}' + 'html.ca-sl body .wrap .ca-sbar .pnl select{display:none!important}' + P + '.ca-sbar .pills{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}' + P + '.ca-sbar .pill{height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(18,19,23,.12);background:transparent;color:#121317;font-family:inherit;font-weight:600;font-size:13.5px;line-height:1;cursor:pointer;transition:background .15s,border-color .15s,color .15s}' + P + '.ca-sbar .pill:hover{border-color:rgba(18,19,23,.3)}' + P + '.ca-sbar .pill.on{background:#121317;border-color:#121317;color:#fff}' + D + '.ca-sbar .pill{border-color:rgba(255,255,255,.14);color:#fff}' + D + '.ca-sbar .pill:hover{border-color:rgba(255,255,255,.35)}' + D + '.ca-sbar .pill.on{background:#fff;border-color:#fff;color:#121317}' + 'html.ca-sl body .wrap .ca-sbar .pnl.pnl{padding:20px 20px 16px!important;width:min(460px,calc(100vw - 32px))!important;transform-origin:top right;animation:caPnl .18s ease-out}' + '@keyframes caPnl{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}' + P + '.ca-sbar .pnl .rs{margin-top:2px}'
  + 'html.ca-sl body .wrap .ca-sbar .pnl select{background:#F5F5F7!important;color:#121317!important;border:1px solid rgba(18,19,23,.1)!important;-webkit-text-fill-color:#121317!important}' + 'html.ca-sl.ca-dark body .wrap .ca-sbar .pnl select{background:#26272D!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:rgba(255,255,255,.12)!important}' + 'html.ca-sl body .wrap .ca-sbar .pnl label{opacity:1!important;color:rgba(18,19,23,.55)!important}' + 'html.ca-sl.ca-dark body .wrap .ca-sbar .pnl label{color:rgba(255,255,255,.55)!important}' + 'html.ca-sl section.hero .scrolldown{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:34px!important;transform:translateX(-50%)!important;margin:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:4px!important;z-index:3!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase;cursor:pointer;text-shadow:none!important}' + 'html.ca-sl.ca-dark section.hero .scrolldown{color:rgba(255,255,255,.7)!important}' + 'html.ca-sl section.hero .scrolldown svg{width:20px;height:20px;animation:caBob2 1.8s ease-in-out infinite}' + '@keyframes caBob2{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}' + '@media(prefers-reduced-motion:reduce){html.ca-sl section.hero .scrolldown svg{animation:none}}'
  + D + '.ca-sbar .pnl{background:#1C1D22;border-color:rgba(255,255,255,.1);box-shadow:0 18px 50px rgba(0,0,0,.5)}'
  + P + '.ca-sbar.open .pnl{display:block}'
  + P + '.ca-sbar .pnl label{display:block;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin:2px 0 6px}'
  + P + '.ca-sbar .pnl select{width:100%;height:44px;margin-bottom:12px;padding:0 12px;border-radius:12px;border:1px solid ' + LN + ';background:rgba(18,19,23,.035);font:inherit;color:inherit}'
  + D + '.ca-sbar .pnl select{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}'
  + P + '.ca-sbar .pnl .rs{background:none;border:0;color:#E2001A;font-family:inherit;font-weight:700;font-size:13px;line-height:1;cursor:pointer;padding:6px 2px}'
  + P + '#count{font-size:13px!important;opacity:.6;margin:0 0 12px!important}'
  + '@media(max-width:820px){' + P + '.ca-sbar{flex-wrap:wrap;top:84px}' + P + '.ca-sbar .sq{flex:1 1 auto}' + P + '.ca-sbar .chips{order:3;flex:1 1 100%}' + P + '.ca-sbar .pnl{left:8px;right:8px;width:auto}}'
  // ---- 3) kártyák (a fotó érintetlen)
  + P + '#grid{gap:22px!important}'
  + P + '#grid>.card{border-radius:22px!important;overflow:hidden;' + CARD + 'transition:transform .2s,box-shadow .2s!important}'
  + D + '#grid>.card{' + CARDD + '}'
  + D + '#grid>.card::before,' + D + '#grid>.card::after{display:none!important}'
  + P + '#grid>.card:hover{transform:translateY(-3px);box-shadow:0 16px 36px rgba(18,19,23,.12)!important}'
  + P + '#grid>.card .body{padding:16px 18px 18px!important;display:flex;flex-direction:column}'
  + P + '#grid>.card .meta{display:none!important}'
  + P + '#grid>.card .title{font-size:17px!important;line-height:1.3!important;letter-spacing:-.01em;margin:0 0 8px!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.6em}'
  + P + '#grid>.card .specs{display:none!important}'
  + P + '.ca-sp{display:flex;flex-wrap:nowrap;gap:5px;margin:0 0 14px;overflow:hidden;-webkit-mask:linear-gradient(90deg,#000 92%,transparent);mask:linear-gradient(90deg,#000 92%,transparent)}'
  + P + '.ca-sp span{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;white-space:nowrap;height:26px;padding:0 8px;border-radius:999px;background:rgba(18,19,23,.045);font-size:12px;font-weight:600;opacity:.85}'
  + D + '.ca-sp span{background:rgba(255,255,255,.06)}'
  + P + '.ca-sp svg{width:13px;height:13px;opacity:.6}'
  + P + '#grid>.card .pricerow{display:flex!important;align-items:baseline!important;gap:8px!important;flex-wrap:wrap;margin:auto 0 14px!important}'
  + P + '#grid>.card .price{font-size:24px!important;font-weight:800!important;letter-spacing:-.02em}'
  + P + '#grid>.card .peur{font-size:13px!important;opacity:.55}'
  + P + '#grid>.card .ca-cinfo{display:none!important}'
  + P + '.ca-net{font-size:11.5px;font-weight:700;opacity:.5;letter-spacing:.02em}'
  + P + '.ca-act{display:flex;gap:8px}'
  + P + '#grid>.card .cbtn{flex:1 1 auto;display:flex!important;align-items:center;justify-content:center;height:46px!important;margin:0!important;border-radius:14px!important;background:#121317!important;color:#fff!important;border:0!important;font-weight:700!important;box-shadow:none!important;transition:background .2s}'
  + P + '#grid>.card:hover .cbtn{background:#E2001A!important}'
  + D + '#grid>.card .cbtn{background:#fff!important;color:#121317!important}' + D + '#grid>.card:hover .cbtn{background:#E2001A!important;color:#fff!important}'
  + P + '#grid>.card .ca-inq{flex:0 0 46px!important;width:46px!important;height:46px!important;padding:0!important;margin:0!important;border-radius:14px!important;font-size:0!important;background:transparent!important;border:1px solid rgba(18,19,23,.14)!important;color:inherit!important;display:flex!important;align-items:center;justify-content:center;box-shadow:none!important}'
  + D + '#grid>.card .ca-inq{border-color:rgba(255,255,255,.18)!important}'
  + P + '#grid>.card .ca-inq::before{content:"";width:19px;height:19px;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z%27/%3E%3C/svg%3E") center/contain no-repeat}'
  + P + '#grid>.card .ca-inq:hover{border-color:#E2001A!important;color:#E2001A!important}'
  + P + '#grid>.card .feat{border-radius:999px!important;font-weight:800!important;letter-spacing:.02em}'
  // ---- 5) lapozás
  + P + '#grid>.card.ca-pg{display:none!important}'
  + P + '.ca-more{display:flex;justify-content:center;margin:26px 0 8px}'
  + P + '.ca-more button{height:50px;padding:0 26px;border-radius:999px;border:1px solid rgba(18,19,23,.14);background:#fff;color:#121317;font-family:inherit;font-weight:700;font-size:15px;line-height:1;cursor:pointer;box-shadow:0 6px 18px rgba(18,19,23,.06)}'
  + D + '.ca-more button{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);color:#fff;box-shadow:none}'
  + P + '.ca-more button:hover{border-color:#E2001A}'
  + P + '.ca-more[hidden]{display:none}'
  + '@media(max-width:600px){' + P + '#grid>.card .title{font-size:16px!important}' + P + '#grid>.card .price{font-size:22px!important}}'
  + '</style>';

const JS = '<script id="ca-sl-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'function on(){var p=$("#panel-eladas");var v=!!(p&&p.classList.contains("on"));H.classList.toggle("ca-sl",v);return v}'
  + 'function slug(t){t=String(t||"").toLowerCase();if(/mercedes/.test(t))return"mercedes";if(/volkswagen|^vw/.test(t))return"vw";return t.replace(/[^a-z]/g,"")}'
  + 'var LG={audi:1,bmw:1,mercedes:1,vw:1,cupra:1,hyundai:1,kia:1,man:1,mini:1,seat:1,volvo:1};'
  + 'var g=$("#grid"),f=$(".filters"),PG=12,lim=PG;'
  // 1) fejléc
  + 'function hero(){var h=$(\'[data-hero="eladas"]\');if(!h||h.__s)return;h.__s=1;var sb=h.querySelector(".sub");if(sb)sb.textContent="Ellenőrzött prémium autók Németországból — bevizsgálva, garanciával, teljes ügyintézéssel.";var n=g?g.children.length:0;var st=document.createElement("div");st.className="ca-slst";st.innerHTML="<span><b>"+n+"</b>autó készleten</span><span><b>Garancia</b>minden autóra</span><span><b>Teljes</b>ügyintézés</span>";if(sb)sb.parentNode.insertBefore(st,sb.nextSibling)}'
  // 2) szűrősáv
  + 'var bar,chips,fb;function build(){if(!f||!g||f.__s)return;f.__s=1;f.classList.add("ca-slf");var q=$("#q"),mk=$("#marka"),kr=$("#kar"),uz=$("#uz");'
  + 'bar=document.createElement("div");bar.className="ca-sbar";bar.setAttribute("data-dm-skip","1");'
  + 'bar.innerHTML=\'<div class="sq"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" placeholder="Keresés (pl. X5, Porsche)…" aria-label="Keresés"></div><div class="chips"></div><button type="button" class="fb"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Szűrők<i></i></button><div class="pnl"><label>Karosszéria</label><select data-k="kar"></select><label>Üzemanyag</label><select data-k="uz"></select><label>Rendezés</label><select data-k="sort"><option value="">Ajánlott</option><option value="pa">Ár szerint növekvő</option><option value="pd">Ár szerint csökkenő</option><option value="yn">Legújabb évjárat</option><option value="km">Legkevesebb km</option></select><button type="button" class="rs">Szűrők törlése</button></div>\';'
  + 'var ah=$("#autok");if(ah&&ah.parentNode===f.parentNode)ah.parentNode.insertBefore(bar,ah.nextSibling);else f.parentNode.insertBefore(bar,f);chips=bar.querySelector(".chips");fb=bar.querySelector(".fb");var si=bar.querySelector(".sq input");'
  + 'si.value=q.value;si.addEventListener("input",function(){q.value=si.value;q.dispatchEvent(new Event("input",{bubbles:true}))});'
  + 'var sk=bar.querySelector(\'select[data-k="kar"]\'),su=bar.querySelector(\'select[data-k="uz"]\'),ss=bar.querySelector(\'select[data-k="sort"]\');sk.innerHTML=kr.innerHTML;su.innerHTML=uz.innerHTML;'
  + '[sk,su,ss].forEach(function(sel){var w=document.createElement("div");w.className="pills";[].forEach.call(sel.options,function(o){if(sel===su&&o.value==="Diesel")return;var b=document.createElement("button");b.type="button";b.className="pill";b.dataset.v=o.value;b.textContent=o.value?o.textContent:(sel===ss?"Ajánlott":"Mind");w.appendChild(b)});sel.parentNode.insertBefore(w,sel.nextSibling);w.addEventListener("click",function(e){var b=e.target.closest(".pill");if(!b)return;sel.value=b.dataset.v;sel.dispatchEvent(new Event("change",{bubbles:true}));sync()})});'
  + '[[sk,kr],[su,uz]].forEach(function(p){p[0].addEventListener("change",function(){p[1].value=p[0].value;p[1].dispatchEvent(new Event("change",{bubbles:true}));sync()})});'
  + 'ss.addEventListener("change",function(){sortBy(ss.value)});'
  + 'var all=document.createElement("button");all.type="button";all.className="chip";all.dataset.v="";all.textContent="Összes";chips.appendChild(all);'
  + '[].forEach.call(mk.options,function(o){if(!o.value)return;var c=document.createElement("button");c.type="button";c.className="chip";c.dataset.v=o.value;c.title=o.textContent;var s=slug(o.textContent);c.innerHTML=LG[s]?\'<img alt="\'+o.textContent+\'" src="/bl-\'+s+\'.webp">\':o.textContent;chips.appendChild(c)});'
  + 'chips.addEventListener("click",function(e){var c=e.target.closest(".chip");if(!c)return;mk.value=c.dataset.v;mk.dispatchEvent(new Event("change",{bubbles:true}));sync()});'
  + 'fb.addEventListener("click",function(e){e.stopPropagation();bar.classList.toggle("open")});bar.querySelector(".pnl").setAttribute("data-dm-skip","1");bar.querySelector(".pnl").addEventListener("click",function(e){e.stopPropagation()});document.addEventListener("click",function(){bar.classList.remove("open")});'
  + 'bar.querySelector(".rs").addEventListener("click",function(){sk.value=su.value=ss.value="";[kr,uz].forEach(function(s){s.value="";s.dispatchEvent(new Event("change",{bubbles:true}))});sortBy("");sync()});'
  + '[q,mk,kr,uz].forEach(function(e){e.addEventListener("input",later);e.addEventListener("change",later)});sync()}'
  + 'function sync(){var mk=$("#marka");if(chips)$$(".chip",chips).forEach(function(c){c.classList.toggle("on",c.dataset.v===(mk?mk.value:""))});var n=0;["kar","uz"].forEach(function(id){var s=$("#"+id);if(s&&s.value)n++});var ss=bar&&bar.querySelector(\'select[data-k="sort"]\');if(ss&&ss.value)n++;if(bar)$$(".pnl select",bar).forEach(function(sel){var w=sel.nextElementSibling;if(w&&w.classList.contains("pills"))$$(".pill",w).forEach(function(x){x.classList.toggle("on",x.dataset.v===sel.value)})});if(fb){fb.classList.toggle("has",n>0);fb.querySelector("i").textContent=n||""}}'
  // rendezés
  + 'var orig=null;function key(c,k){if(k==="pa"||k==="pd"){var r=c.querySelector(".pricerow");return r?+(r.getAttribute("data-eur")||0):0}if(k==="yn"){var y=(c.querySelector(".year")||{}).textContent||"",m=y.match(/(\\d{2})\\/(\\d{4})/);return m?(+m[2])*12+(+m[1]):0}if(k==="km"){var s=(c.querySelector(".specs")||{}).textContent||"",m2=s.replace(/\\s/g,"").match(/(\\d+)km/);return m2?+m2[1]:1e9}return 0}'
  + 'function sortBy(k){if(!g)return;var cs=[].slice.call(g.children);if(!orig)orig=cs.slice();var L=k?cs.slice().sort(function(a,b){var x=key(a,k),y=key(b,k);return k==="pd"||k==="yn"?y-x:x-y}):orig.slice();L.forEach(function(c){g.appendChild(c)});lim=PG;page();sync()}'
  // 3) kártyák
  + 'var IC={cal:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>\',km:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/></svg>\',gb:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/></svg>\',fu:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M4 20h12M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/></svg>\'};'
  + 'function cards(){if(!g)return;$$(".card",g).forEach(function(c){if(c.__s)return;c.__s=1;var b=c.querySelector(".body");if(!b)return;var y=(c.querySelector(".year")||{}).textContent||"",sp=(c.querySelector(".specs")||{}).textContent||"",parts=sp.split("·").map(function(x){return x.trim()}).filter(Boolean),out="";'
  + 'if(y)out+="<span>"+IC.cal+y+"</span>";parts.forEach(function(p){if(/^\\d[\\d\\s\u00a0]*$/.test(p))p=p+" km";var k=/km/.test(p)?"km":/automat|manu|kézi|váltó/i.test(p)?"gb":"fu";if(k==="km")p=p.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g,"$1 ");out+="<span>"+IC[k]+p+"</span>"});'
  + 'var d=document.createElement("div");d.className="ca-sp";d.innerHTML=out;var t=c.querySelector(".title");if(t)t.parentNode.insertBefore(d,t.nextSibling);'
  + 'var pr=c.querySelector(".pricerow");if(pr&&!pr.querySelector(".ca-net")){var n=document.createElement("span");n.className="ca-net";n.textContent="nettó";pr.appendChild(n)}'
  + 'var cb=c.querySelector(".cbtn"),iq=c.querySelector(".ca-inq");[cb,iq].forEach(function(x){if(!x)return;x.setAttribute("data-dm-skip","1");["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)})});if(cb){var a=document.createElement("div");a.className="ca-act";cb.parentNode.insertBefore(a,cb);a.appendChild(cb);if(iq){iq.title="Érdeklődöm";iq.setAttribute("aria-label","Érdeklődöm");a.appendChild(iq)}}})}'
  // 5) lapozás
  + 'function sd(){var x=$("section.hero .scrolldown");if(!x||x.__s)return;x.__s=1;x.addEventListener("click",function(e){if(!H.classList.contains("ca-sl"))return;e.preventDefault();e.stopImmediatePropagation();var t=$("#autok");if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-110,behavior:"smooth"})},true)}'
  + 'var mb=null;function page(){if(!g)return;var v=$$(".card",g).filter(function(c){return c.style.display!=="none"});$$(".card",g).forEach(function(c){c.classList.remove("ca-pg")});v.forEach(function(c,i){if(i>=lim)c.classList.add("ca-pg")});'
  + 'if(!mb){mb=document.createElement("div");mb.className="ca-more";mb.innerHTML=\'<button type="button"></button>\';g.parentNode.insertBefore(mb,g.nextSibling);mb.firstChild.addEventListener("click",function(){lim+=PG;page()})}'
  + 'var rest=v.length-lim;mb.hidden=rest<=0;if(rest>0)mb.firstChild.textContent="Továbbiak betöltése ("+rest+")"}'
  + 'function dz(){var u=$("#uz");if(!u||u.value!=="Dízel"||!g)return;var q=($("#q").value||"").toLowerCase(),m=$("#marka").value,k=$("#kar").value,n=0;$$(".card",g).forEach(function(c){var uz=c.getAttribute("data-uz")||"";if(uz!=="Diesel"&&uz!=="Dízel")return;var t=((c.querySelector(".title")||{}).textContent||"").toLowerCase();var ok=(!q||t.indexOf(q)>=0)&&(!m||c.getAttribute("data-marka")===m)&&(!k||c.getAttribute("data-kar")===k);c.style.display=ok?"":"none"});$$(".card",g).forEach(function(c){if(c.style.display!=="none")n++});var ct=$("#count");if(ct)ct.textContent=n+" autó"}'
  + 'var t=0;function later(){clearTimeout(t);t=setTimeout(function(){dz();lim=PG;page();sync()},10)}'
  + 'function all(){if(!on())return;sd();hero();build();cards();page()}'
  + 'function go(){all();var p=$("#panel-eladas");if(p)new MutationObserver(all).observe(p,{attributes:true,attributeFilter:["class"]});addEventListener("hashchange",function(){setTimeout(all,50)});if(g)new MutationObserver(function(){setTimeout(cards,0)}).observe(g,{childList:true})}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(go,0)});else setTimeout(go,0)'
  + '})();</script>';

export function apply(h) {
  if (h.indexOf('id="ca-sl-css"') > -1) return h;
  if (h.indexOf('id="panel-eladas"') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-sale] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-sale] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-sale] eladó autóink: letisztult nézet'); }
}
