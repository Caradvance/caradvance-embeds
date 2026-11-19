// hu-biz.mjs — Bizományos autóink (HU, /bizomanyos/) letisztult megjelenés
// 1 fejléc: logó nem lóg a menübe, piros kiemelés, sötétebb videó, számok, Görgess középen
// 2 ragadós szűrősáv: kereső, Készleten/Eladva, Szűrők panel kapszulákkal (a lenyílók helyett)
// 3 kártyák: középre igazított rács, egysoros Részletek + Érdeklődöm, jótékonyság egy tömör, nyitható sorban
// 4 záró rész: „Így működik a bizomány” 3 lépés + CTA · 5 egységes sötét mód, puha átmenetek.
// Csak a magyar /bizomanyos/ oldal, idempotens. A képekhez nem nyúl.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'bizomanyos', 'index.html');

const P = 'html.ca-biz body ';
const D = 'html.ca-biz.ca-dark body ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:#fff!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';

const CSS = '<style id="ca-biz-css">'
  + P + '.ca-gl,' + P + '.ca-gl2{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  // ---- 1) fejléc
  + P + 'section.bizhero .bizhero-logo{display:none!important}'
  + D + 'section.bizhero{background:transparent!important;background-image:none!important}'
  + P + 'section.bizhero video{filter:brightness(.6) saturate(1.05)}'
  + P + 'section.bizhero :is(.bizhero-title,.bizhero-sub){text-shadow:0 2px 24px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.35)}'
  + P + 'section.bizhero .bizhero-title .ca-acc{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + '.ca-bstats{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:22px auto 0}'
  + P + '.ca-bstats span{display:inline-flex;align-items:baseline;gap:7px;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:#fff;font-size:13.5px;font-weight:600;line-height:1}'
  + P + '.ca-bstats b{font-size:17px;font-weight:800}'
  + P + 'section.bizhero .bizhero-scroll{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:28px!important;transform:translateX(-50%)!important;margin:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:4px!important;z-index:3!important;animation:none!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;font-size:11px!important;letter-spacing:.14em}'
  + D + 'section.bizhero .bizhero-scroll{color:rgba(255,255,255,.7)!important}'
  + P + 'section.bizhero .bizhero-scroll svg{animation:caBBob 1.8s ease-in-out infinite}'
  + '@keyframes caBBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.bizhero .bizhero-scroll{display:none!important}' + P + 'section.bizhero .bizhero-cta{flex-wrap:nowrap!important;gap:8px!important}' + P + 'section.bizhero .bizhero-cta a{padding:13px 16px!important;font-size:14px!important;white-space:nowrap}' + P + '.ca-bstats span{padding:8px 12px;font-size:12.5px}}'
  // ---- bevezető
  + P + '#bizk .autok-head{display:none!important}'
  + P + '#bizk .biz-lead{max-width:760px!important;margin:6px auto 26px!important;text-align:center}'
  + P + '#bizk .crumb{justify-content:flex-start}'
  // ---- 2) szűrősáv
  + P + '#bizk .biz-filters,' + P + '#bizk>.biz-toggle{display:none!important}'
  + P + '.ca-bbar{position:sticky;top:84px;z-index:30;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px;margin:0 0 14px;border-radius:20px;' + CARD + '}'
  + D + '.ca-bbar{background:rgba(24,25,30,.96)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 10px 30px rgba(0,0,0,.35)!important}'
  + P + '.ca-bbar .ca-bq{flex:1 1 220px;min-width:0;height:44px;border:1px solid ' + LN + ';border-radius:999px;padding:0 16px 0 40px;font-family:inherit;font-size:14.5px;background:#F5F5F7 url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27%3E%3Ccircle cx=%277%27 cy=%277%27 r=%275.5%27/%3E%3Cpath d=%27m11 11 4 4%27/%3E%3C/svg%3E") 15px 50%/16px no-repeat;color:inherit;outline:none}'
  + D + '.ca-bbar .ca-bq{background-color:rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.1)!important;color:#fff!important}'
  + P + '.ca-bbar .ca-bq:focus{border-color:#E2001A}'
  + P + '.ca-bbar .biz-toggle{display:inline-flex!important;margin:0!important;padding:4px!important;background:#F5F5F7!important;border:0!important}'
  + D + '.ca-bbar .biz-toggle{background:rgba(255,255,255,.06)!important}'
  + P + '.ca-bbar .biz-tg{padding:9px 16px!important;font-size:13.5px!important}'
  + D + '.ca-bbar .biz-tg{color:rgba(255,255,255,.75)!important}'
  + D + '.ca-bbar .biz-tg.active{background:#fff!important;color:#0b0b0d!important}'
  + P + '.ca-bfb{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;border:1px solid ' + LN + ';background:#fff;color:inherit;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}'
  + D + '.ca-bfb{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff}'
  + P + '.ca-bfb.on{border-color:#121317}' + D + '.ca-bfb.on{border-color:#fff}'
  + P + '.ca-bfb i{font-style:normal;min-width:20px;height:20px;border-radius:10px;background:#E2001A;color:#fff;font-size:11.5px;display:none;align-items:center;justify-content:center;padding:0 6px}'
  + P + '.ca-bfb i.n{display:inline-flex}'
  + P + '.ca-bpnl{flex:1 1 100%;display:none;padding:8px 6px 4px;border-top:1px solid ' + LN + ';margin-top:2px}'
  + D + '.ca-bpnl{border-top-color:rgba(255,255,255,.08)}'
  + P + '.ca-bbar.open .ca-bpnl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;animation:caBIn .25s ease}'
  + '@keyframes caBIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}'
  + P + '.ca-bgrp b{display:block;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin:0 0 8px}'
  + P + '.ca-bgrp div{display:flex;flex-wrap:wrap;gap:6px}'
  + P + '.ca-bpill{height:36px;padding:0 14px;border-radius:999px;border:1px solid ' + LN + ';background:#fff;color:inherit;font-family:inherit;font-weight:600;font-size:13.5px;cursor:pointer;transition:all .15s}'
  + D + '.ca-bpill{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1);color:#fff}'
  + P + '.ca-bpill:hover{border-color:rgba(18,19,23,.3)}'
  + P + '.ca-bpill.on{background:#121317;border-color:#121317;color:#fff}'
  + D + '.ca-bpill.on{background:#fff;border-color:#fff;color:#121317}'
  + P + '.ca-breset{grid-column:1/-1;justify-self:start;background:none;border:0;padding:4px 2px;font-family:inherit;font-weight:600;font-size:13px;color:#E2001A;cursor:pointer}'
  + '@media(max-width:760px){' + P + '.ca-bbar{top:76px;border-radius:18px}' + P + '.ca-bbar .ca-bq{flex-basis:100%}' + P + '.ca-bbar.open .ca-bpnl{grid-template-columns:1fr}}'
  + P + '#bizk .cat-count{margin:4px 0 16px!important}'
  // ---- 3) kártyák
  + P + '#bizk :is(#bizgrid,#bizsold).grid{grid-template-columns:repeat(auto-fit,minmax(290px,360px))!important;justify-content:center!important;gap:22px!important}'
  + P + '#bizk .bizcard{border-radius:24px!important;overflow:hidden;' + CARD + '}'
  + D + '#bizk .bizcard{' + CARDD + '}'
  + P + '#bizk .bizcard .media{background:#F5F5F7}'
  + D + '#bizk .bizcard .media{background:rgba(255,255,255,.04)}'
  + P + '#bizk .bizcard .body{padding:16px 18px 6px!important}'
  + P + '#bizk .bizcard .title{min-height:46px!important;font-size:17px!important;letter-spacing:-.01em}'
  + P + '#bizk .bizcard .specs{opacity:.65}'
  + P + '#bizk .bizcard .pricerow{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap}'
  + P + '#bizk .bizcard .ca-cinfo{width:17px!important;height:17px!important;border-radius:50%!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:10.5px!important;font-weight:800!important;font-style:italic;background:rgba(18,19,23,.08)!important;color:rgba(18,19,23,.6)!important;-webkit-text-fill-color:rgba(18,19,23,.6)!important;position:relative}'
  + D + '#bizk .bizcard .ca-cinfo{background:rgba(255,255,255,.14)!important;color:rgba(255,255,255,.85)!important;-webkit-text-fill-color:rgba(255,255,255,.85)!important}'
  + P + '#bizk .bizcard .ca-cinfo .ca-ctip{font-style:normal;font-weight:500;-webkit-text-fill-color:currentColor}'
  + P + '.ca-bact{display:flex;gap:8px;margin:14px 0 4px}'
  + P + '.ca-bact>*{flex:1 1 0;display:inline-flex!important;align-items:center;justify-content:center;height:44px!important;margin:0!important;padding:0 10px!important;border-radius:999px!important;font-family:inherit;font-weight:700!important;font-size:14px!important;text-decoration:none!important;cursor:pointer;box-shadow:none!important;width:auto!important}'
  + P + '.ca-bact .ca-reszlet{background:transparent!important;border:1px solid rgba(18,19,23,.16)!important;color:#121317!important;-webkit-text-fill-color:#121317!important}'
  + D + '.ca-bact .ca-reszlet{border-color:rgba(255,255,255,.2)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}'
  + P + '.ca-bact .ca-inq{background:#E2001A!important;border:1px solid #E2001A!important;color:#fff!important;-webkit-text-fill-color:#fff!important}'
  + P + '.ca-bact .ca-inq:hover{background:#c40017!important}'
  + 'html:root.ca-biz body #bizk .ca-bact button.ca-inq,html:root.ca-biz.ca-dark body #bizk .ca-bact button.ca-inq{background:#E2001A!important;background-image:none!important;border-color:#E2001A!important;color:#fff!important;-webkit-text-fill-color:#fff!important}'
  + 'html:root.ca-biz body #bizk .ca-bact button.ca-inq:hover{background:#c40017!important}'
  + 'html:root.ca-biz body #bizk .ca-bact a.ca-reszlet:hover{background:rgba(18,19,23,.05)!important}' + 'html:root.ca-biz.ca-dark body #bizk .ca-bact a.ca-reszlet:hover{background:rgba(255,255,255,.08)!important}'
  // jótékonyság sor
  + P + '#bizk .biz-donate{padding:4px 18px 18px!important;gap:8px!important}'
  + P + '#bizk .biz-donate>:not(.ca-bsum){display:none!important}'
  + P + '#bizk .biz-donate.open>.biz-inner{display:flex!important;animation:caBIn .25s ease}'
  + P + '#bizk .biz-donate.open>.biz-inner.biz-choose{display:block!important}'
  + P + '.ca-bsum{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;border-radius:16px;border:0;background:rgba(226,0,26,.07);color:inherit;font-family:inherit;text-align:left;cursor:pointer}'
  + D + '.ca-bsum{background:rgba(226,0,26,.14)}'
  + P + '.ca-bsum .h{flex:0 0 30px;height:30px;border-radius:50%;background:#E2001A;color:#fff;display:flex;align-items:center;justify-content:center}'
  + P + '.ca-bsum .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;line-height:1.2}'
  + P + '.ca-bsum .t b{font-size:15px;font-weight:800;color:#E2001A}'
  + D + '.ca-bsum .t b{color:#FF4D5E}'
  + P + '.ca-bsum .t small{font-size:12px;opacity:.62;font-weight:600}'
  + P + '.ca-bsum .c{opacity:.5;transition:transform .25s;font-size:14px}'
  + P + '.biz-donate.open .ca-bsum .c{transform:rotate(180deg)}'
  + D + '#bizk .biz-inner{background:rgba(255,255,255,.04)!important;border-color:rgba(255,255,255,.08)!important}'
  + P + '#bizk .rate-note{text-align:center;max-width:720px;margin:26px auto 0!important;opacity:.6}'
  + P + '#bizk .biz-soldempty{padding:40px 20px!important}'
  // ---- 4) záró rész
  + P + '.ca-bhow{padding:88px 20px 40px;text-align:center}'
  + P + '.ca-bhow .ey{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#E2001A;background:rgba(226,0,26,.08);padding:6px 12px;border-radius:999px}'
  + P + '.ca-bhow h2{font-size:clamp(26px,3.4vw,38px);font-weight:800;letter-spacing:-.02em;margin:12px 0 8px}'
  + P + '.ca-bhow>p{max-width:600px;margin:0 auto;opacity:.65;font-size:15.5px;line-height:1.6}'
  + P + '.ca-bsteps{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1040px;margin:44px auto 0}'
  + P + '.ca-bsteps::before{content:"";position:absolute;left:16%;right:16%;top:24px;height:2px;background:linear-gradient(90deg,rgba(226,0,26,0),rgba(226,0,26,.55) 12%,rgba(226,0,26,.55) 88%,rgba(226,0,26,0))}'
  + P + '.ca-bsteps>div{position:relative;padding:0 10px}'
  + P + '.ca-bsteps .n{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;background:#E2001A;color:#fff;font-size:18px;font-weight:800;box-shadow:0 0 0 7px #F5F5F7,0 10px 22px rgba(226,0,26,.3)}'
  + D + '.ca-bsteps .n{box-shadow:0 0 0 7px #121318,0 0 26px rgba(226,0,26,.45)}'
  + P + '.ca-bsteps h3{font-size:17px;margin:0 0 6px}'
  + P + '.ca-bsteps p{font-size:14px;opacity:.66;line-height:1.55;margin:0}'
  + '@media(max-width:760px){' + P + '.ca-bsteps{display:flex;flex-direction:column;gap:0;text-align:left;max-width:520px}' + P + '.ca-bsteps::before{left:24px;right:auto;width:2px;height:auto;top:20px;bottom:40px;background:rgba(226,0,26,.45)}' + P + '.ca-bsteps>div{display:grid;grid-template-columns:48px 1fr;column-gap:16px;padding:0 0 22px}' + P + '.ca-bsteps .n{grid-row:1/3;margin:0}' + P + '.ca-bsteps h3{margin-top:12px}}'
  + P + '.ca-bcta{position:relative;overflow:hidden;max-width:1240px;margin:40px auto 70px;border-radius:32px;background:#121317;color:#fff;text-align:center;padding:64px 24px}'
  + P + '.ca-bcta::before{content:"";position:absolute;inset:auto -10% -60% -10%;height:120%;background:radial-gradient(50% 50% at 50% 50%,rgba(226,0,26,.28),transparent 70%)!important;background-color:transparent!important;pointer-events:none}'
  + P + '.ca-bcta>*{position:relative}'
  + P + '.ca-bcta h2{font-size:clamp(26px,3.4vw,40px);font-weight:800;letter-spacing:-.02em;margin:0 0 10px;color:#fff}'
  + P + '.ca-bcta p{max-width:560px;margin:0 auto 26px;color:rgba(255,255,255,.75);font-size:15.5px;line-height:1.6}'
  + P + '.ca-bcta .r{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}'
  + P + '.ca-bcta a{display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 26px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none}'
  + P + '.ca-bcta a.a1{background:#E2001A;color:#fff;box-shadow:0 10px 30px rgba(226,0,26,.35)}'
  + P + '.ca-bcta a.a2{border:1px solid rgba(255,255,255,.25);color:#fff}'
  + D + '.ca-bcta{background:transparent!important;max-width:none;margin:0 0 30px;border-radius:0}'
  + D + '.ca-bcta::before{inset:10% 15%;height:auto;background:radial-gradient(50% 50% at 50% 55%,rgba(226,0,26,.16),transparent 72%)!important}'
  + '@media(max-width:1280px){' + P + '.ca-bcta{margin-left:16px;margin-right:16px}' + D + '.ca-bcta{margin-left:0;margin-right:0}}'
  + '</style>';

const JS = '<script id="ca-biz-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var hero=$("section.bizhero"),bk=$("#bizk");if(!hero||!bk||hero.__b)return;hero.__b=1;H.classList.add("ca-biz");'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  // 1) fejléc
  + 'var t=$(".bizhero-title",hero);if(t&&!t.querySelector(".ca-acc"))t.innerHTML="Bizományos <span class=\\"ca-acc\\">autóink</span>";'
  + 'var st=el("div","ca-bstats","<span><b class=\\"ca-bn\\">–</b> autó készleten</span><span><b>30%</b> jótékony célra</span><span><b>7</b> szervezet</span>");var hc=$(".bizhero-cta",hero);if(hc)hc.parentNode.insertBefore(st,hc.nextSibling);'
  + 'var sc=$(".bizhero-scroll",hero);if(sc){sc.removeAttribute("onclick");sc.addEventListener("click",function(e){e.preventDefault();scrollTo({top:bk.getBoundingClientRect().top+scrollY-80,behavior:"smooth"})})}'
  // 2) szűrősáv
  + 'var q=$("#bq"),tg=$(".biz-toggle",bk),fl=$(".biz-filters",bk);var bar=el("div","ca-bbar");'
  + 'var bq=document.createElement("input");bq.type="search";bq.className="ca-bq";bq.placeholder=q?q.placeholder:"Keresés…";bq.autocomplete="off";bq.setAttribute("data-dm-skip","1");'
  + 'bq.addEventListener("input",function(){if(q){q.value=bq.value;q.dispatchEvent(new Event("input",{bubbles:true}))}});bar.appendChild(bq);'
  + 'if(tg)bar.appendChild(tg);'
  + 'var fb=el("button","ca-bfb","<svg width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"><path d=\\"M4 6h16M7 12h10M10 18h4\\"/></svg>Szűrők<i></i>");fb.type="button";bar.appendChild(fb);'
  + 'var pn=el("div","ca-bpnl");bar.appendChild(pn);if(fl)fl.parentNode.insertBefore(bar,fl);'
  + 'fb.addEventListener("click",function(){var o=bar.classList.toggle("open");fb.classList.toggle("on",o);if(o)build()});'
  + 'var G=[["bf-marka","Márka"],["bf-kar","Karosszéria"],["bf-uz","Üzemanyag"]];'
  + 'function cnt(){var n=0;G.forEach(function(g){var s=document.getElementById(g[0]);if(s&&s.value)n++});var i=fb.querySelector("i");i.textContent=n;i.classList.toggle("n",n>0)}'
  + 'function build(){pn.innerHTML="";G.forEach(function(g){var s=document.getElementById(g[0]);if(!s)return;var w=el("div","ca-bgrp","<b>"+g[1]+"</b><div></div>"),d=w.querySelector("div");[].slice.call(s.options).forEach(function(o){var b=el("button","ca-bpill"+(s.value===o.value?" on":""),o.value?o.textContent:"Összes");b.type="button";b.addEventListener("click",function(){s.value=o.value;s.dispatchEvent(new Event("change",{bubbles:true}));build();cnt()});d.appendChild(b)});pn.appendChild(w)});'
  + 'var r=el("button","ca-breset","Szűrők törlése");r.type="button";r.addEventListener("click",function(){G.forEach(function(g){var s=document.getElementById(g[0]);if(s&&s.value){s.value="";s.dispatchEvent(new Event("change",{bubbles:true}))}});bq.value="";if(q){q.value="";q.dispatchEvent(new Event("input",{bubbles:true}))}build();cnt()});pn.appendChild(r)}'
  // 3) kártyák
  + 'function card(c){var b=c.querySelector(".body"),rz=c.querySelector(".ca-reszlet"),iq=c.querySelector(".ca-inq");if(b&&rz&&iq&&!c.querySelector(".ca-bact")){var a=el("div","ca-bact");b.appendChild(a);a.appendChild(rz);a.appendChild(iq)}'
  + 'var dn=c.querySelector(".biz-donate");if(dn&&!dn.querySelector(".ca-bsum")){var tot=dn.querySelector(".biz-total b"),s=el("button","ca-bsum","<span class=\\"h\\"><svg width=\\"15\\" height=\\"15\\" viewBox=\\"0 0 24 24\\" fill=\\"currentColor\\"><path d=\\"M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z\\"/></svg></span><span class=\\"t\\"><b>"+(tot?tot.textContent:"")+" jótékony célra</b><small>a jutalék 30%-a · 15% eladó + 15% vevő</small></span><span class=\\"c\\">⌄</span>");s.type="button";s.setAttribute("aria-expanded","false");s.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var o=dn.classList.toggle("open");s.setAttribute("aria-expanded",o)});dn.insertBefore(s,dn.firstChild)}}'
  + 'function scan(){$$("#bizk .bizcard").forEach(card);var g=$("#bizgrid"),n=g?$$(".bizcard",g).length:0,x=$(".ca-bn",hero);if(x&&n)x.textContent=n;cnt();if(window.__cbcln)window.__cbcln()}'
  + 'scan();["#bizgrid","#bizsold"].forEach(function(s){var g=$(s);if(g)new MutationObserver(scan).observe(g,{childList:true})});setTimeout(scan,700);setTimeout(scan,1500);setTimeout(scan,3000);'
  // 4) záró rész
  + 'if(!$(".ca-bhow")){var hw=el("section","ca-bhow","<span class=\\"ey\\">Így működik a bizomány</span><h2>Add el nálunk az autód — egy jó ügyért</h2><p>Mi intézzük az értékesítést, te pedig egy jótékony szervezetet is támogatsz vele.</p><div class=\\"ca-bsteps\\"><div><span class=\\"n\\">1</span><h3>Küldd el az adatokat</h3><p>Pár adat az autódról, és reális árajánlattal jelentkezünk.</p></div><div><span class=\\"n\\">2</span><h3>Mi intézzük az eladást</h3><p>Profin, gyorsan — a többit ránk bízhatod.</p></div><div><span class=\\"n\\">3</span><h3>Eladás és jó ügy</h3><p>A jutalékunk 30%-a jótékony célra megy: a felét te, a felét a vevő irányítja.</p></div></div>");'
  + 'var ct=el("section","ca-bcta","<h2>Add el az autód — tegyünk jót együtt</h2><p>Küldd el pár adatát, és jelentkezünk egy reális árajánlattal. A többit mi intézzük.</p><div class=\\"r\\"><a class=\\"a1\\" href=\\"/eladom/\\">Eladnám az autóm →</a><a class=\\"a2\\" href=\\"/jotekonysag/\\">A jótékonysági programról</a></div>");'
  + 'bk.parentNode.insertBefore(hw,bk.nextSibling);hw.parentNode.insertBefore(ct,hw.nextSibling)}'
  + 'window.__cbcln=cln;function cln(){$$(".ca-bbar,.ca-bbar *,.ca-bsum,.ca-bsum *,.ca-bact,.ca-bact>*,.ca-bhow *,.ca-bcta *,.ca-bstats *").forEach(function(x){["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1");x.classList.remove("dm-s2","dm-t")})}[300,600,1200,2500,4500].forEach(function(t){setTimeout(cln,t)});H.addEventListener("click",function(){setTimeout(cln,30)});'
  + '})();</script>';

export function apply(h) {
  if (h.indexOf('id="ca-biz-css"') > -1) return h;
  if (h.indexOf('class="bizhero') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-biz] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-biz] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-biz] bizományos autóink: letisztult nézet'); }
}
