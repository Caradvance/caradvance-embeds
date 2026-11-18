// hu-autoink.mjs — Bérelhető autóink (HU, /autoink/#berelheto) letisztult megjelenés
// 1) hero: márkasor ki, rövidebb szöveg, helyes morzsamenü
// 2) előnyök: 8 nagy kártya helyett egy vékony, letisztult sáv
// 3) ragadós üveg szűrősáv: márka-chipek + „Szűrők” + egyetlen Cég/Magán váltó
// 4) autókártyák: kivágott autó, kevesebb címke, nagy ár, Részletek + összehasonlító ikon
// 5) márkánként egy oldalra lapozható sor + „Összes …” link
// Csak a magyar /autoink/ oldalt érinti, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'autoink', 'index.html');
const CUTDIR = path.join('public', 'berles-cut');

const P = '#panel-berelheto ';
const D = 'html.ca-dark ';
const CSS = '<style id="ca-ai-css">'
  // ---- 1) hero
  + '[data-hero="berelheto"] .brand-strip{display:none!important}'
  + 'html.ca-ai [data-hero="berelheto"].on{padding-top:96px}'
  + 'html.ca-ai [data-hero="berelheto"] .sub{max-width:620px;margin-left:auto;margin-right:auto}'
  + 'html.ca-ai section.hero video.video-bg{filter:brightness(.7) saturate(1.05)}' + 'html.ca-ai [data-hero="berelheto"] :is(.hh,.sub){text-shadow:0 2px 22px rgba(0,0,0,.5),0 1px 3px rgba(0,0,0,.35)}' + '@media(max-width:640px){html.ca-ai [data-hero="berelheto"].on{padding-top:64px}}'
  // ---- 2) előnyök
  + P + '.rb-wrap{margin:6px 0 26px}'
  + P + '.rb-grid{gap:0!important;border-radius:22px;overflow:hidden;background:rgba(255,255,255,.62);border:1px solid rgba(18,19,23,.07);box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 28px rgba(18,19,23,.05);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}'
  + D + P + '.rb-grid{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.08);box-shadow:none}'
  + P + '.rb-card{background:none!important;border:0!important;box-shadow:none!important;border-radius:0!important;padding:20px 22px!important;min-height:0!important;text-align:center!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + P + '.rb-card:not(:nth-child(4n)){border-right:1px solid rgba(18,19,23,.07)!important}'
  + P + '.rb-card:nth-child(-n+4){border-bottom:1px solid rgba(18,19,23,.07)!important}'
  + D + P + '.rb-card:not(:nth-child(4n)){border-right-color:rgba(255,255,255,.07)!important}'
  + D + P + '.rb-card:nth-child(-n+4){border-bottom-color:rgba(255,255,255,.07)!important}'
  + P + '.rb-v{display:none!important}'
  + P + '.rb-h{font-size:17px!important;line-height:1.25!important;margin:0 0 5px!important;text-align:center!important;letter-spacing:-.01em}'
  + P + '.rb-p{font-size:13.5px!important;line-height:1.45!important;margin:0!important;text-align:center!important;opacity:.78}'
  + '@media(max-width:1100px){' + P + '.rb-card{border-right:0!important;border-bottom:0!important}' + P + '.rb-card:nth-child(odd){border-right:1px solid rgba(18,19,23,.07)!important}' + P + '.rb-card:nth-child(-n+6){border-bottom:1px solid rgba(18,19,23,.07)!important}'
  + D + P + '.rb-card:nth-child(odd){border-right-color:rgba(255,255,255,.07)!important}' + D + P + '.rb-card:nth-child(-n+6){border-bottom-color:rgba(255,255,255,.07)!important}}'
  + '@media(max-width:560px){' + P + '.rb-grid{display:grid!important;grid-template-columns:1fr 1fr!important;overflow:hidden!important;padding:0!important}' + P + '.rb-card{padding:14px 14px!important;flex:none!important;width:auto!important}' + P + '.rb-h{font-size:15px!important}' + P + '.rb-p{display:none!important}' + P + '.rb-card{padding:13px 10px!important}}'
  // ---- 2b) előnyök felturbózva: ikon + kiemelt érték + mozgás
  + P + '.rb-card{position:relative;transition:background .25s,transform .25s!important}'
  + P + '.rb-card.ca-rbx{padding:24px 20px 22px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;grid-row:auto!important;grid-template-rows:none!important}' + P + '.rb-grid{grid-template-rows:none!important;grid-auto-rows:auto!important}'
  + P + '.ca-rbi{width:46px;height:46px;margin:0 auto 14px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.08);color:#E2001A;transition:background .25s,color .25s,transform .25s,box-shadow .25s}'
  + D + P + '.ca-rbi{background:rgba(226,0,26,.14);box-shadow:0 0 26px rgba(226,0,26,.28)}'
  + P + '.ca-rbi svg{width:23px;height:23px}'
  + P + '.ca-rbk{display:block;font-size:24px;line-height:1.1;font-weight:800;letter-spacing:-.025em;margin:0 0 6px;text-align:center}'
  + P + '.rb-card.ca-rbx .rb-h,' + P + '.rb-card.ca-rbx .rb-p{position:static!important;inset:auto!important;transform:none!important}' + P + '.rb-card.ca-rbx .rb-h,' + P + '.rb-card.ca-rbx .rb-p{width:auto!important;max-width:100%;align-self:center!important;justify-content:center!important;text-align:center!important}'+ P + '.rb-card.ca-rbx .rb-h{font-size:14.5px!important;margin:0 0 4px!important;opacity:.95}'
  + P + '.rb-card.ca-rbx .rb-p{font-size:12.8px!important;opacity:.62}'
  + P + '.rb-card.ca-rbx:hover{background:rgba(255,255,255,.75)!important}'
  + D + P + '.rb-card.ca-rbx:hover{background:rgba(255,255,255,.04)!important}'
  + P + '.rb-card.ca-rbx:hover .ca-rbi{background:#E2001A;color:#fff;transform:translateY(-2px) scale(1.04);box-shadow:0 10px 22px rgba(226,0,26,.32)}'
  + P + '.ca-rbanim .rb-card.ca-rbx{opacity:0;transform:translateY(14px)}'
  + P + '.ca-rbanim.ca-in .rb-card.ca-rbx{opacity:1;transform:none;transition:opacity .6s ease var(--d),transform .6s cubic-bezier(.2,.7,.2,1) var(--d),background .25s!important}'
  + '@media(prefers-reduced-motion:reduce){' + P + '.ca-rbanim .rb-card.ca-rbx{opacity:1!important;transform:none!important}}'
  + '@media(max-width:560px){' + P + '.rb-card.ca-rbx{padding:16px 10px!important}' + P + '.ca-rbi{width:38px;height:38px;margin-bottom:9px;border-radius:12px}' + P + '.ca-rbi svg{width:20px;height:20px}' + P + '.ca-rbk{font-size:18px;margin-bottom:3px}' + P + '.rb-card.ca-rbx .rb-h{font-size:12.5px!important}}'
  // ---- 3) szűrősáv
  + P + '.ca-fbar{position:sticky;top:92px;z-index:30;display:flex;align-items:center;gap:10px;margin:0 0 22px;padding:8px;border-radius:20px;background:rgba(255,255,255,.93);border:1px solid rgba(18,19,23,.07);box-shadow:0 8px 26px rgba(18,19,23,.07);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4)}'
  + D + P + '.ca-fbar{background:rgba(22,23,28,.92);border-color:rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.35)}'
  + P + '.ca-fchips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;flex:1 1 auto;min-width:0;-webkit-mask:linear-gradient(90deg,#000 92%,transparent);mask:linear-gradient(90deg,#000 92%,transparent);padding-right:24px}'
  + P + '.ca-fchips::-webkit-scrollbar{display:none}'
  + P + '.ca-chip{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:40px;min-width:40px;padding:0 14px;border-radius:13px;border:1px solid transparent;background:transparent;color:inherit;font:600 13.5px/1 inherit;cursor:pointer;transition:background .18s,border-color .18s}'
  + P + '.ca-chip img{height:22px;width:auto;max-width:52px;object-fit:contain;display:block}'
  + P + '.ca-chip img[src*="mercedes"]{height:28px}' + 'html:not(.ca-dark) ' + P + '.ca-chip img{filter:brightness(0);opacity:.82}'
  + P + '.ca-chip:hover{background:rgba(18,19,23,.05)}' + D + P + '.ca-chip:hover{background:rgba(255,255,255,.06)}'
  + P + '.ca-chip.on{background:#fff;border-color:rgba(18,19,23,.10);box-shadow:0 2px 8px rgba(18,19,23,.08)}'
  + D + P + '.ca-chip.on{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.14);box-shadow:none}'
  + P + '.ca-fbtn{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 15px;border-radius:13px;border:1px solid rgba(18,19,23,.10);background:#fff;color:#121317;font:600 13.5px/1 inherit;cursor:pointer}'
  + D + P + '.ca-fbtn{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#fff}'
  + P + '.ca-fbtn i{font-style:normal;display:none;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#E2001A;color:#fff;font-size:11px;line-height:18px;text-align:center}'
  + P + '.ca-fbtn.has i{display:inline-block}'
  + P + '.ca-bts{flex:0 0 auto;display:inline-flex;padding:3px;border-radius:13px;background:rgba(18,19,23,.06)}'
  + D + P + '.ca-bts{background:rgba(255,255,255,.08)}'
  + P + '.ca-bts button{height:34px;padding:0 13px;border:0;border-radius:10px;background:transparent;color:inherit;font:600 13px/1 inherit;cursor:pointer;opacity:.7}'
  + P + '.ca-bts button.on{background:#fff;opacity:1;box-shadow:0 1px 4px rgba(18,19,23,.12);color:#121317}'
  + D + P + '.ca-bts button.on{background:rgba(255,255,255,.16);color:#fff;box-shadow:none}'
  + P + '.ca-fmore{position:absolute;right:8px;top:calc(100% + 8px);width:min(560px,calc(100vw - 32px));padding:14px;border-radius:18px;background:rgba(255,255,255,.96);border:1px solid rgba(18,19,23,.08);box-shadow:0 18px 50px rgba(18,19,23,.16);display:none}'
  + D + P + '.ca-fmore{background:rgba(26,27,32,.97);border-color:rgba(255,255,255,.1);box-shadow:0 18px 50px rgba(0,0,0,.5)}'
  + P + '.ca-fbar.open .ca-fmore{display:block}'
  + P + '.ca-fmore .sub-filters{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:0!important}'
  + P + '.ca-fmore #sf-brand{display:none!important}'
  + P + '.ca-fmore .ca-freset{margin-top:10px;background:none;border:0;color:#E2001A;font:600 13px/1 inherit;cursor:pointer;padding:6px 2px}'
  + '@media(max-width:760px){' + P + '.ca-fbar{flex-wrap:wrap;top:84px;border-radius:18px}' + P + '.ca-fchips{flex:1 1 100%;order:1}' + P + '.ca-fbtn{order:2}' + P + '.ca-bts{order:3;margin-left:auto}' + P + '.ca-fmore{left:8px;right:8px;width:auto}' + P + '.ca-fmore .sub-filters{grid-template-columns:1fr!important}}'
  // ---- 4) kártyák
  + P + '.sub-card{border-radius:22px!important;transition:transform .2s,box-shadow .2s!important}'
  + P + '.sub-media{background:transparent!important;border:0!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;height:200px!important}'
  + P + '.sub-media .ca-tr,' + P + '.sub-slide{background:transparent!important}'
  + P + '.sub-slide0.ca-cutsl{background:radial-gradient(60% 50% at 50% 78%,rgba(18,19,23,.06),transparent 70%)!important}'
  + D + P + '.sub-slide0.ca-cutsl{background:radial-gradient(60% 50% at 50% 78%,rgba(255,255,255,.06),transparent 70%)!important}'
  + P + '.sub-slide0.ca-cutsl img{object-fit:contain!important;padding:16px 22px 14px!important;box-sizing:border-box!important;transform:none!important;object-position:50% 50%!important;filter:drop-shadow(0 12px 10px rgba(18,19,23,.16))!important;mix-blend-mode:normal!important;background:transparent!important}'
  + D + P + '.sub-slide0.ca-cutsl img{filter:drop-shadow(0 14px 12px rgba(0,0,0,.55))!important}'
  + P + '.sub-gdots i{opacity:.35}' + P + '.sub-gdots i.on{opacity:1}'
  + P + '.sub-body{padding-top:6px!important}'
  + P + '.sub-brand2{display:none!important}'
  + P + '.sub-meta{justify-content:flex-start!important;min-height:0!important;margin-bottom:2px!important}'
  + P + '.sub-year{font-size:12px!important;opacity:.6}'
  + P + '.sub-title{font-size:21px!important;letter-spacing:-.015em!important;margin:2px 0 3px!important}'
  + P + '.sub-specs{font-size:13px!important;opacity:.7}'
  + P + '.ca-tags{gap:6px!important;margin:12px 0 0!important;justify-content:flex-start!important;flex-wrap:wrap}'
  + P + '.ca-tags .ca-fuels{margin-left:0!important;gap:6px!important}'
  + P + '.sub-avail,' + P + '.sub-fuel{background:transparent!important;color:inherit!important;border:1px solid rgba(18,19,23,.14)!important;font-weight:600!important;font-size:11.5px!important;padding:4px 9px!important;border-radius:999px!important;opacity:.85}'
  + D + P + '.sub-avail,' + D + P + '.sub-fuel{border-color:rgba(255,255,255,.18)!important}'
  + P + '.sub-avail:not(.pre){color:#0a8a4a!important;border-color:rgba(10,138,74,.35)!important;opacity:1}'
  + D + P + '.sub-avail:not(.pre){color:#3ddc8a!important;border-color:rgba(61,220,138,.35)!important}'
  + P + '.ca-pbox{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:16px 0 0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + P + '.ca-ptop{display:none!important}'
  + P + '.ca-pv{font-size:26px!important;letter-spacing:-.02em!important}'
  + P + '.ca-pe{font-size:12.5px!important;opacity:.6;margin-top:2px!important}'
  + P + '.sub-dep{display:none!important}'
  + P + '.sub-rent{display:none!important}'
  + P + '.sub-actions{padding-top:4px!important}'
  + P + '.sub-actions .ca-row{display:flex!important;gap:8px!important}'
  + P + '.sub-actions .sub-det{flex:1 1 auto!important;height:46px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:14px!important;background:#121317!important;color:#fff!important;border:0!important;font-weight:700!important}'
  + P + '.sub-actions .sub-det:hover{background:#E2001A!important}'
  + D + P + '.sub-actions .sub-det{background:#fff!important;color:#121317!important}'
  + D + P + '.sub-actions .sub-det:hover{background:#E2001A!important;color:#fff!important}'
  + P + '.sub-actions .ca-cmp{flex:0 0 46px!important;width:46px!important;height:46px!important;padding:0!important;font-size:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:14px!important;background:transparent!important;border:1px solid rgba(18,19,23,.14)!important;color:inherit!important}'
  + D + P + '.sub-actions .ca-cmp{border-color:rgba(255,255,255,.18)!important}'
  + P + '.sub-actions .ca-cmp b{font-size:18px!important;margin:0!important}'
  // ---- 5) márkasorok
  + P + '#sub-list.ca-rows .sub-grid{display:grid!important;grid-auto-flow:column!important;grid-template-columns:none!important;grid-auto-columns:calc((100% - 44px)/3)!important;overflow-x:auto!important;scroll-snap-type:x mandatory;scrollbar-width:none;gap:22px!important;padding:10px 14px 30px!important;margin:-6px -14px -12px!important;scroll-padding:0 14px}'
  + P + '#sub-list.ca-rows .sub-grid::-webkit-scrollbar{display:none}' + P + '#sub-list:not(.ca-rows) .sub-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}' + '@media(max-width:920px){' + P + '#sub-list:not(.ca-rows) .sub-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}' + '@media(max-width:600px){' + P + '#sub-list:not(.ca-rows) .sub-grid{grid-template-columns:minmax(0,1fr)!important}}' + P + '.sub-card{min-width:0!important}' + P + '.sub-grid{background:transparent!important;border:0!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + P + '#sub-list.ca-rows .sub-card{scroll-snap-align:start}'
  + P + '#sub-list.ca-rows .sub-card:hover{transform:none!important}' + P + '#sub-list.ca-rows .sub-card{box-shadow:0 1px 2px rgba(18,19,23,.04),0 8px 18px rgba(18,19,23,.06)!important}' + D + P + '#sub-list.ca-rows .sub-card{box-shadow:none!important}'
  + '@media(max-width:920px){' + P + '#sub-list.ca-rows .sub-grid{grid-auto-columns:calc((100% - 22px)/2)!important}}'
  + '@media(max-width:600px){' + P + '#sub-list.ca-rows .sub-grid{grid-auto-columns:84%!important;gap:12px!important}}'
  + P + '.sub-brand-h{gap:12px!important;margin-top:18px!important}'
  + P + '.ca-bnav{display:inline-flex;align-items:center;gap:6px;margin-left:4px}'
  + P + '.ca-bnav button{width:34px;height:34px;border-radius:50%;border:1px solid rgba(18,19,23,.12);background:transparent;color:inherit;font-size:17px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}'
  + D + P + '.ca-bnav button{border-color:rgba(255,255,255,.16)}'
  + P + '.ca-bnav button:disabled{opacity:.3;cursor:default}'
  + P + '.ca-ball{background:none;border:0;color:#E2001A;font:700 13.5px/1 inherit;cursor:pointer;white-space:nowrap;padding:6px 2px}'
  + P + '#sub-list:not(.ca-rows) .ca-bnav,' + P + '#sub-list:not(.ca-rows) .ca-ball{display:none}'
  + '@media(max-width:600px){' + P + '.ca-bnav button{display:none}' + P + '.sub-brand-h .ct{display:none}}'
  + '</style>';

function js(cuts) {
  return '<script id="ca-ai-js">(function(){'
  + 'var CUTS=' + JSON.stringify(cuts) + ';var H=document.documentElement;'
  + 'function onP(){var p=document.getElementById("panel-berelheto");return p&&p.classList.contains("on")}'
  + 'function slug(t){t=String(t||"").toLowerCase();if(/mercedes/.test(t))return"mercedes";if(/volkswagen|^vw/.test(t))return"vw";return t.replace(/[^a-z]/g,"")}'
  + 'function logo(t){return"/bl-"+slug(t)+(H.classList.contains("ca-dark")?"-dark":"")+".webp"}'
  // 1) morzsamenü + szöveg
  + 'function hero(){if(!onP()){H.classList.remove("ca-ai");return}H.classList.add("ca-ai");'
  + 'var c=document.querySelector(".wrap>.crumb");if(c&&!c.__ai){c.__ai=1;c.__old=c.innerHTML}if(c)c.innerHTML=\'<a href="/">Főoldal</a> / <a href="/tartos-berlet/">Tartós bérlet</a> / <b>Bérelhető autóink</b>\';'
  + 'var s=document.querySelector(\'[data-hero="berelheto"] .sub\');if(s&&!s.__ai){s.__ai=1;s.textContent="Új, 0 km-es prémium autók fix havidíjjal — casco, szerviz és gumi benne."}}'
  // 3) szűrősáv
  + 'var bar,chips,fbtn,bts;function bsel(){return document.getElementById("sf-brand")}'
  + 'function build(){var p=document.getElementById("panel-berelheto"),f=p&&p.querySelector(".sub-filters"),b=bsel();if(!f||!b||p.querySelector(".ca-fbar"))return;'
  + 'bar=document.createElement("div");bar.className="ca-fbar";chips=document.createElement("div");chips.className="ca-fchips";'
  + 'fbtn=document.createElement("button");fbtn.type="button";fbtn.className="ca-fbtn";fbtn.innerHTML=\'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Szűrők<i></i>\';'
  + 'bts=document.createElement("div");bts.className="ca-bts";bts.innerHTML=\'<button type="button" data-m="c">Cég</button><button type="button" data-m="p">Magán</button>\';'
  + 'var more=document.createElement("div");more.className="ca-fmore";f.parentNode.insertBefore(bar,f);more.appendChild(f);var rs=document.createElement("button");rs.type="button";rs.className="ca-freset";rs.textContent="Szűrők törlése";more.appendChild(rs);'
  + 'bar.appendChild(chips);bar.appendChild(fbtn);bar.appendChild(bts);bar.appendChild(more);'
  + 'var all=document.createElement("button");all.type="button";all.className="ca-chip";all.dataset.v="";all.textContent="Összes";chips.appendChild(all);'
  + '[].forEach.call(b.options,function(o){if(!o.value)return;var c=document.createElement("button");c.type="button";c.className="ca-chip";c.dataset.v=o.value;c.title=o.textContent;c.setAttribute("aria-label",o.textContent);c.innerHTML=\'<img alt="" src="\'+logo(o.textContent)+\'">\';chips.appendChild(c)});'
  + 'chips.addEventListener("click",function(e){var c=e.target.closest(".ca-chip");if(!c)return;setBrand(c.dataset.v)});'
  + 'fbtn.addEventListener("click",function(e){e.stopPropagation();bar.classList.toggle("open")});'
  + 'more.addEventListener("click",function(e){e.stopPropagation()});document.addEventListener("click",function(){bar&&bar.classList.remove("open")});'
  + 'rs.addEventListener("click",function(){[].forEach.call(f.querySelectorAll("select"),function(s){if(s.id==="sf-brand"||s.id==="sf-sort")return;if(s.value){s.value="";s.dispatchEvent(new Event("change"))}});sync()});'
  + 'f.addEventListener("change",sync);'
  + 'bts.addEventListener("click",function(e){var x=e.target.closest("button");if(!x)return;if(window.caSetBT)window.caSetBT(x.dataset.m);sync()});'
  + 'sync()}'
  + 'function setBrand(v){var b=bsel();if(!b)return;b.value=v;b.dispatchEvent(new Event("change"));sync();if(v&&bar){var y=bar.getBoundingClientRect().top+scrollY-110;if(scrollY>y)scrollTo({top:y,behavior:"smooth"})}}'
  + 'function sync(){var b=bsel();if(chips)[].forEach.call(chips.children,function(c){c.classList.toggle("on",c.dataset.v===(b?b.value:""))});'
  + 'if(fbtn){var n=0;[].forEach.call(document.querySelectorAll("#panel-berelheto .sub-filters select"),function(s){if(s.id!=="sf-brand"&&s.id!=="sf-sort"&&s.value)n++});fbtn.classList.toggle("has",n>0);fbtn.querySelector("i").textContent=n||""}'
  + 'var m="c";try{m=localStorage.getItem("ca_bt")==="p"?"p":"c"}catch(e){}if(window.__caBT)m=window.__caBT;if(bts)[].forEach.call(bts.children,function(x){x.classList.toggle("on",x.dataset.m===m)});'
  + 'var L=document.getElementById("sub-list");if(L)L.classList.toggle("ca-rows",!(b&&b.value))}'
  // 4) kártyák + 5) sorok
  + 'function deco(){var L=document.getElementById("sub-list");if(!L)return;'
  + '[].forEach.call(L.querySelectorAll(".sub-photo:not([data-ai])"),function(im){im.setAttribute("data-ai","1");var m=(im.getAttribute("src")||"").match(/\\/berles\\/([^\\/?#]+)\\.webp/);if(m&&CUTS.indexOf(m[1])>-1){im.src="/berles-cut/"+m[1]+".webp";var s=im.closest(".sub-slide");if(s)s.classList.add("ca-cutsl")}});'
  + '[].forEach.call(L.querySelectorAll(".sub-det:not([data-dm-skip]),.ca-cmp:not([data-dm-skip])"),function(a){a.setAttribute("data-dm-skip","1");["background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){a.style.removeProperty(k)})});'
  + '[].forEach.call(L.querySelectorAll(".ca-cmp:not([title])"),function(a){a.title="Összehasonlítás";a.setAttribute("aria-label","Összehasonlítás")});'
  + '[].forEach.call(L.querySelectorAll(".sub-brand-h"),function(h){if(h.querySelector(".ca-ball"))return;var g=h.nextElementSibling;if(!g||!g.classList.contains("sub-grid"))return;var t=(h.querySelector("h3")||{}).textContent||"";'
  + 'var nav=document.createElement("span");nav.className="ca-bnav";nav.innerHTML=\'<button type="button" aria-label="Előző">‹</button><button type="button" aria-label="Következő">›</button>\';'
  + 'var a=document.createElement("button");a.type="button";a.className="ca-ball";a.textContent="Összes "+t+" →";'
  + 'var ct=h.querySelector(".ct");(ct&&ct.nextSibling?h.insertBefore(a,ct.nextSibling):h.appendChild(a));h.insertBefore(nav,a.nextSibling);'
  + 'a.addEventListener("click",function(){var b=bsel();if(!b)return;var v="";[].forEach.call(b.options,function(o){if(o.value&&(o.textContent===t||o.value===t))v=o.value});if(v)setBrand(v)});'
  + 'function st(){var B=nav.children;B[0].disabled=g.scrollLeft<4;B[1].disabled=g.scrollLeft+g.clientWidth>=g.scrollWidth-4}'
  + 'nav.children[0].addEventListener("click",function(){g.scrollBy({left:-g.clientWidth,behavior:"smooth"})});nav.children[1].addEventListener("click",function(){g.scrollBy({left:g.clientWidth,behavior:"smooth"})});g.addEventListener("scroll",st,{passive:true});setTimeout(st,60)});'
  + 'sync()}'
  // 2b) előnyök
  + 'var IC={new:\'<path d="M5 17h14M6 17l1.5-5h9L18 17M8 12l1.2-3.2A2 2 0 0 1 11 7.5h2a2 2 0 0 1 1.8 1.3L16 12"/><circle cx="8" cy="17.5" r="1.6"/><circle cx="16" cy="17.5" r="1.6"/><path d="M19 3v4M17 5h4"/>\',back:\'<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>\',shield:\'<path d="M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>\',tire:\'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3"/>\',plate:\'<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M5.5 7v10"/><path d="M9 12h9"/>\',wrench:\'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.4-.4-2.4z"/>\',cal:\'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 14.5l2 2 4-4"/>\',zero:\'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.3 2.3 4.7-5"/>\'};'
  + 'var RB=[[/0 km/i,"new","Vadonatúj","0 km, gyári garanciával."],[/kauci/i,"back","2 500 €-tól","A bérlés végén visszajár."],[/casco/i,"shield","Benne a díjban","Nyugodtan vezethetsz."],[/gumi/i,"tire","2 garnitúra","Szezonális cserével együtt."],[/rendsz/i,"plate","München","Caradvance GmbH, német rendszám."],[/szerviz/i,"wrench","0 Ft extra","Szerviz és adó a havidíjban."],[/futamid/i,"cal","6 hónaptól","2–4 ezer km/hó, utána modellváltás."],[/önerő|onero/i,"zero","0 Ft","Nincs értékvesztés, eladási gond."]];'
  + 'function rb(){var g=document.querySelector("#panel-berelheto .rb-grid");if(!g||g.__rb)return;g.__rb=1;var i=0;'
  + '[].forEach.call(g.querySelectorAll(".rb-card"),function(c){var h=c.querySelector(".rb-h");if(!h)return;var t=h.textContent,m=null;RB.forEach(function(r){if(!m&&r[0].test(t))m=r});if(!m)return;'
  + 'c.classList.add("ca-rbx");c.style.setProperty("--d",(i++*70)+"ms");var ic=document.createElement("span");ic.className="ca-rbi";ic.innerHTML=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">\'+IC[m[1]]+"</svg>";'
  + 'var k=document.createElement("b");k.className="ca-rbk";k.textContent=m[2];c.insertBefore(k,c.firstChild);c.insertBefore(ic,k);ic.setAttribute("data-dm-skip","1");k.setAttribute("data-dm-skip","1");var pp=c.querySelector(".rb-p");if(pp)pp.textContent=m[3]});'
  + 'if(!("IntersectionObserver" in window))return;g.classList.add("ca-rbanim");var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){g.classList.add("ca-in");io.disconnect()}})},{threshold:.15});io.observe(g)}'
  + 'var t=0;function all(){hero();rb();build();deco()}'
  + 'function go(){all();var L=document.getElementById("sub-list");if(L)new MutationObserver(function(){clearTimeout(t);t=setTimeout(deco,30)}).observe(L,{childList:true});'
  + 'var p=document.getElementById("panel-berelheto");if(p)new MutationObserver(hero).observe(p,{attributes:true,attributeFilter:["class"]});window.addEventListener("hashchange",function(){setTimeout(all,50)})}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(go,0)});else setTimeout(go,0)'
  + '})();</script>';
}

export function apply(h, cuts) {
  if (h.indexOf('id="ca-ai-css"') > -1) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => js(cuts) + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-autoink] nincs', FILE); process.exit(0); }
  const cuts = fs.existsSync(CUTDIR) ? fs.readdirSync(CUTDIR).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : [];
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h, cuts);
  if (o === h) console.log('[hu-autoink] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-autoink] bérelhető autóink: letisztult nézet'); }
}
