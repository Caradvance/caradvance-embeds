// hu-konfig.mjs — Audi / Mercedes / MINI konfigurátor (HU): prémium, letisztult nézet, az eddigi oldalak stílusában
// · teljes képernyős, olvasható fejléc, Görgess alul középen
// · „Így rakd össze” lépései számozott üvegkártyákon, „Mely extrák érik meg?” pipás kártyán
// · árlista: a táblázat a helyén marad (SEO), soronként kattintható üvegkártya; szűrő pirulák karosszéria/hajtás szerint
// · bérelhető modellek kivágott autóképpel, kiemelt havidíjjal; GYIK 4 + mind; kapcsolódó linkek pirulákon
// Tartalom és SEO változatlan. Idempotens, csak a magyar oldalak.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const PAGES = ['audi-konfigurator', 'mercedes-konfigurator', 'mini-konfigurator'];
const cutList = () => { for (const d of [path.join(DIST, 'berles-cut'), path.join('public', 'berles-cut')]) if (fs.existsSync(d)) return fs.readdirSync(d).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)); return []; };

const P = 'html.ca-kf body section.ol ';
const D = 'html.ca-kf.ca-dark body section.ol ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.14),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';
const CHK = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E")';

const CSS = '<style id="ca-kf-css">'
  // ---- fejléc
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.5) saturate(1.05)}'
  + P + 'section.hero .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.12))!important}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .inner{display:flex;flex-direction:column;align-items:center}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase;cursor:pointer;display:flex}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{width:18px;height:18px;animation:caKBob 1.8s ease-in-out infinite}'
  + '@keyframes caKBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}}'
  + P + '.section{background:transparent!important}'
  // ---- bevezető
  + P + '.ol-text{max-width:1100px!important}'
  + P + '.ol-text>h2,' + P + '.sec-title{font-size:clamp(28px,3.2vw,42px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.1!important}'
  + P + '.ol-text>h2{margin:56px 0 18px!important}' + P + '.ol-text>h2:first-of-type{margin-top:14px!important}'
  + D + '.ol-text>h2,' + D + '.sec-title{color:#fff!important}'
  + P + '.ol-text>p{font-size:17px!important;line-height:1.7!important;max-width:860px;opacity:.85}'
  + P + '.ol-text>p a,' + P + '.ol-text li a{color:' + RED + '!important;font-weight:700}'
  + D + '.ol-text>p,' + D + '.ol-text li{color:rgba(255,255,255,.82)!important}'
  // lépések kártyán
  + P + '.ol-text>ol{list-style:none!important;padding:0!important;margin:0!important;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;counter-reset:kf}'
  + P + '.ol-text>ol>li{counter-increment:kf;position:relative;margin:0!important;padding:66px 22px 22px!important;border-radius:24px;font-size:14.5px!important;line-height:1.6!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.ol-text>ol>li{' + HD + '}'
  + P + '.ol-text>ol>li:hover{transform:translateY(-3px)}'
  + P + '.ol-text>ol>li::before{content:counter(kf);position:absolute;left:22px;top:20px;width:34px;height:34px;border-radius:50%;background:' + RED + ';color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(226,0,26,.32)}'
  + P + '.ol-text>ol>li>strong:first-child{display:block;font-size:17.5px;font-weight:800;letter-spacing:-.01em;margin-bottom:6px;color:inherit}'
  + D + '.ol-text>ol>li>strong:first-child{color:#fff}'
  // extrák
  + P + '.ol-text>ul{list-style:none!important;padding:26px 28px!important;margin:0!important;border-radius:26px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 30px;' + HL + '}'
  + D + '.ol-text>ul{' + HD + '}'
  + P + '.ol-text>ul>li{position:relative;margin:0!important;padding-left:34px!important;font-size:15.5px!important;line-height:1.55!important}'
  + P + '.ol-text>ul>li::before{content:"";position:absolute;left:0;top:1px;width:22px;height:22px;border-radius:50%;background:' + CHK + ' center/12px no-repeat,' + RED + ';box-shadow:0 5px 12px rgba(226,0,26,.28)}'
  + '@media(max-width:900px){' + P + '.ol-text>ol{grid-template-columns:1fr 1fr}}'
  + '@media(max-width:600px){' + P + '.ol-text>ol,' + P + '.ol-text>ul{grid-template-columns:1fr}' + P + '.ol-text>ul{padding:20px!important}' + P + '.ol-text>ol>li{padding:20px 18px 18px 66px!important}' + P + '.ol-text>ol>li::before{left:18px;top:18px}}'
  // ---- árlista: sorok kártyán
  + P + '#arlista .sec-intro{max-width:640px;margin-left:auto;margin-right:auto;opacity:.75}'
  + P + '#arlista .ol-text{max-width:1060px!important}'
  + P + '.ca-flt{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:6px 0 22px}'
  + P + '.ca-flt button{display:inline-flex;align-items:center;gap:6px;height:42px;padding:0 18px;border-radius:999px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;color:inherit;transition:all .2s;' + HL + '}'
  + D + '.ca-flt button{' + HD + 'color:#fff}'
  + P + '.ca-flt button small{font-size:12px;opacity:.5;font-weight:700}'
  + P + '.ca-flt button.on{background:#121317!important;border-color:#121317!important;color:#fff!important;box-shadow:0 10px 24px rgba(18,19,23,.22)!important}'
  + D + '.ca-flt button.on{background:#fff!important;border-color:#fff!important;color:#121317!important}'
  + P + '.ol-tw{overflow:visible!important;border:0!important;background:none!important;border-radius:0!important}'
  + P + '.ol-table{display:block!important;border:0!important;font-size:15px!important}'
  + P + '.ol-table thead{display:block}'
  + P + '.ol-table tbody{display:flex;flex-direction:column;gap:10px}'
  + P + '.ol-table tr{display:grid!important;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,.9fr) minmax(0,1fr) 40px;align-items:center;column-gap:12px}'
  + P + '.ol-table thead tr{padding:0 22px 8px}'
  + P + '.ol-table thead tr::after{content:""}'
  + P + '.ol-table th{background:none!important;border:0!important;padding:0!important;font-size:11.5px!important;font-weight:800!important;letter-spacing:.08em;text-transform:uppercase;color:inherit!important;opacity:.5}'
  + P + '.ol-table tbody tr{padding:14px 18px 14px 22px;border-radius:20px;cursor:pointer;transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s;' + HL + '}'
  + D + '.ol-table tbody tr{' + HD + '}'
  + P + '.ol-table tbody tr:hover{transform:translateY(-2px)}'
  + P + '.ol-table tbody tr.ca-h{display:none!important}'
  + P + '.ol-table td{border:0!important;padding:0!important;background:none!important;color:inherit!important;vertical-align:middle!important;min-width:0}'
  + D + '.ol-table td{color:#fff!important}'
  + P + '.ol-table td:first-child a{color:inherit!important;text-decoration:none!important;font-weight:800;font-size:16.5px;letter-spacing:-.01em}'
  + P + '.ol-table tbody tr:hover td:first-child a{color:' + RED + '!important}'
  + P + '.ol-table td:nth-child(2),' + P + '.ol-table td:nth-child(3){font-size:13.5px;opacity:.7}'
  + P + '.ol-table td:nth-child(4){font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}'
  + P + '.ol-table td:nth-child(5){font-weight:800;color:' + RED + '!important;font-variant-numeric:tabular-nums;white-space:nowrap}'
  + D + '.ol-table td:nth-child(5){color:#FF4258!important}'
  + P + '.ol-table .ca-ar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(18,19,23,.06);transition:background .25s,color .25s}'
  + D + '.ol-table .ca-ar{background:rgba(255,255,255,.08)}'
  + P + '.ol-table tbody tr:hover .ca-ar{background:' + RED + ';color:#fff}'
  + P + '.ol-table .ca-ar svg{width:15px;height:15px}'
  + P + '.ol-table .ca-el{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;background:rgba(22,163,74,.12);color:#15803D;font-size:12px;font-weight:800;opacity:1}'
  + D + '.ol-table .ca-el{background:rgba(74,222,128,.14);color:#4ADE80}'
  + P + '.ol-table:not(.ca-all) tbody tr.ca-x{display:none!important}'
  + P + '.ca-lmore{display:flex!important;margin:18px auto 0!important;width:max-content}'
  + P + '.ol-table.ca-all~.ca-lmore svg,' + P + '.ol-tw:has(.ca-all)+.ca-lmore svg{transform:rotate(180deg)}'
  + P + '.ca-empty{text-align:center;opacity:.6;padding:20px;display:none}'
  + P + '.ol-note{text-align:center;max-width:760px;margin:18px auto 0!important;font-size:13px!important;opacity:.7;color:inherit!important}'
  + '@media(max-width:760px){'
  + P + '.ol-table thead{display:none}'
  + P + '.ol-table tr{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"n p" "m f";row-gap:4px}'
  + P + '.ol-table tbody tr{padding:14px 16px}'
  + P + '.ol-table td:nth-child(1){grid-area:n}' + P + '.ol-table td:nth-child(5){grid-area:p;text-align:right}'
  + P + '.ol-table td:nth-child(2){grid-area:m}' + P + '.ol-table td:nth-child(4){grid-area:f;text-align:right;font-size:13px;opacity:.6;font-weight:700}'
  + P + '.ol-table td:nth-child(3){display:none}' + P + '.ol-table td:last-child{display:none}'
  + P + '.ol-table td:first-child a{font-size:15.5px}'
  + P + '.ca-flt{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;margin:6px -20px 18px;padding:4px 20px 10px;scrollbar-width:none}' + P + '.ca-flt::-webkit-scrollbar{display:none}' + P + '.ca-flt button{flex:none}}'
  // ---- bérelhető modellek
  + P + '.ol-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important;max-width:1200px!important}'
  + P + '.ol-card{position:relative;display:flex!important;flex-direction:column;border-radius:26px!important;overflow:hidden;text-decoration:none!important;color:inherit!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.ol-card{' + HD + 'color:#fff!important}'
  + P + '.ol-card:hover{transform:translateY(-4px)}'
  + P + '.ol-card .ca-stage{position:relative;height:160px;display:flex;align-items:flex-end;justify-content:center;padding:16px 14px 4px;background:radial-gradient(60% 50% at 50% 85%,rgba(18,19,23,.12),transparent 70%)}'
  + D + '.ol-card .ca-stage{background:radial-gradient(60% 50% at 50% 85%,rgba(226,0,26,.25),transparent 70%)}'
  + P + '.ol-card img{width:100%!important;height:100%!important;object-fit:contain!important;border-radius:0!important;background:none!important;aspect-ratio:auto!important;filter:drop-shadow(0 14px 16px rgba(0,0,0,.22));transition:transform .5s cubic-bezier(.2,.8,.2,1)}'
  + P + '.ol-card img.ca-full{object-fit:cover!important;border-radius:16px!important;filter:none}'
  + P + '.ol-card:hover img{transform:scale(1.04)}'
  + P + '.ol-card>div{padding:6px 20px 20px!important;background:none!important;display:flex;flex-direction:column;gap:4px}'
  + P + '.ol-card>div b{font-size:17px!important;font-weight:800!important;letter-spacing:-.02em;color:inherit!important;padding-right:40px}'
  + P + '.ol-card .ca-pr{display:flex;align-items:baseline;gap:6px;margin-top:4px;flex-wrap:wrap}'
  + P + '.ol-card .ca-pr strong{font-size:22px;font-weight:900;letter-spacing:-.03em;color:' + RED + '}'
  + D + '.ol-card .ca-pr strong{color:#FF4258}'
  + P + '.ol-card .ca-pr small{font-size:12.5px;opacity:.6}'
  + P + '.ol-card .ca-go{position:absolute;right:16px;bottom:18px;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(18,19,23,.06);transition:background .25s,color .25s}'
  + D + '.ol-card .ca-go{background:rgba(255,255,255,.08)}'
  + P + '.ol-card:hover .ca-go{background:' + RED + ';color:#fff}'
  + P + '.ol-card .ca-go svg{width:15px;height:15px}'
  + '@media(max-width:980px){' + P + '.ol-grid{grid-template-columns:1fr 1fr!important}}'
  + '@media(max-width:520px){' + P + '.ol-grid{gap:10px!important}' + P + '.ol-card .ca-stage{height:110px;padding:12px 8px 2px}' + P + '.ol-card>div{padding:4px 14px 16px!important}' + P + '.ol-card>div b{font-size:14.5px!important;padding-right:0}' + P + '.ol-card .ca-pr strong{font-size:17px}' + P + '.ol-card .ca-go{display:none}}'
  // ---- GYIK + linkek
  + P + '.ol-faq{max-width:900px!important;display:flex!important;flex-direction:column;gap:12px}'
  + P + '.ol-faq details{border-radius:20px!important;overflow:hidden;padding:0!important;' + HL + '}'
  + D + '.ol-faq details{' + HD + '}'
  + P + '.ol-faq summary{padding:20px 22px!important;font-weight:700!important;font-size:16px!important;display:flex!important;align-items:center;justify-content:space-between;gap:14px;color:inherit!important;background:none!important}'
  + D + '.ol-faq summary{color:#fff!important}'
  + P + '.ol-faq .pl{flex:0 0 30px!important;width:30px!important;min-width:0!important;height:30px!important;border-radius:50%!important;background:' + RED + '!important;color:#fff!important;font-size:18px!important;transition:transform .3s}'
  + P + '.ol-faq details>p{padding:0 22px 20px!important;margin:0!important;opacity:.78;line-height:1.6;color:inherit!important}'
  + D + '.ol-faq details>p{color:rgba(255,255,255,.8)!important}'
  + P + '.ol-faq.ca-cut details.ca-x{display:none!important}'
  + P + '.ca-more{align-self:center;margin-top:4px;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}'
  + D + '.ca-more{border-color:rgba(255,255,255,.16);color:#fff}'
  + P + '.ca-more svg{width:16px;height:16px;transition:transform .3s}'
  + P + '.ol-faq:not(.ca-cut) .ca-more svg{transform:rotate(180deg)}'
  + P + '.ol-rl{display:flex!important;flex-wrap:wrap;justify-content:center;gap:10px!important;max-width:900px!important;margin-top:26px!important}'
  + P + '.ol-rl a{display:inline-flex!important;align-items:center;height:42px;padding:0 18px!important;border-radius:999px!important;font-size:14px!important;font-weight:700!important;text-decoration:none!important;color:inherit!important;' + HL + '}'
  + D + '.ol-rl a{' + HD + 'color:#fff!important}'
  + P + '.ol-rl a:hover{color:' + RED + '!important}'
  + '</style>';

const JS = (CUT) => '<script id="ca-kf-js">(function(){var CUT=' + JSON.stringify(CUT) + ';' + String.raw`
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var root=$("section.ol");if(!root||root.__k||!$("#arlista",root))return;root.__k=1;document.documentElement.classList.add("ca-kf");
var ARR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
function sk(e){e.setAttribute("data-dm-skip","1");return e}
// --- Görgess
var sd=$("section.hero .scrolldown",root);if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$("section.hero",root).nextElementSibling;if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})}
// --- lépések: a „—” elválasztó elhagyása a kártyákon
$$(".ol-text>ol>li",root).forEach(function(li){var n=li.querySelector("strong");if(n&&n.nextSibling&&n.nextSibling.nodeType===3)n.nextSibling.nodeValue=n.nextSibling.nodeValue.replace(/^\s*—\s*/,"")});
// --- árlista: kattintható sorok + szűrők
var tb=$(".ol-table",root);if(tb){var rows=$$("tbody tr",tb);
$$("thead tr",tb).forEach(function(r){r.appendChild(document.createElement("th"))});
rows.forEach(function(r){var a=r.querySelector("td a");var td=document.createElement("td");td.innerHTML='<span class="ca-ar">'+ARR+'</span>';r.appendChild(td);
var f=r.children[2];if(f&&/^Elektromos$/i.test(f.textContent.trim()))f.innerHTML='<span class="ca-el">Elektromos</span>';
if(a)r.addEventListener("click",function(e){if(e.target.closest("a"))return;location.href=a.href})});
var body=function(r){return (r.children[1]||{}).textContent.trim()},fuel=function(r){return (r.children[2]||{}).textContent},cnt={},order=[];
rows.forEach(function(r){var b=body(r);if(!b)return;if(!cnt[b]){cnt[b]=0;order.push(b)}cnt[b]++});
var el=rows.filter(function(r){return /Elektromos/i.test(fuel(r))}).length;
var F=[["Mind",rows.length,function(){return true}]];order.sort(function(a,b){return cnt[b]-cnt[a]}).forEach(function(b){if(cnt[b]>0)F.push([b,cnt[b],function(r){return body(r)===b}])});
if(el>0&&el<rows.length)F.push(["Elektromos",el,function(r){return /Elektromos/i.test(fuel(r))}]);
if(F.length>2){var bar=sk(document.createElement("div"));bar.className="ca-flt";bar.innerHTML=F.map(function(f,i){return '<button type="button"'+(i?'':' class="on"')+' data-i="'+i+'">'+f[0]+' <small>'+f[1]+'</small></button>'}).join("");
var tw=tb.closest(".ol-tw");tw.parentNode.insertBefore(bar,tw);
bar.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;$$("button",bar).forEach(function(x){x.classList.toggle("on",x===b)});var i=+b.getAttribute("data-i"),fn=F[i][2];tb.classList.toggle("ca-all",i>0||open);rows.forEach(function(r,k){var on=fn(r);r.classList.toggle("ca-h",!on);if(on&&r.animate)r.animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:260,delay:Math.min(k,12)*18,easing:"ease-out",fill:"backwards"})});if(mb)mb.style.display=i>0?"none":""})}
// rövidebb lista: az első 12 modell látszik, gombbal az összes
var open=false,mb=null;if(rows.length>14){rows.forEach(function(r,k){if(k>=12)r.classList.add("ca-x")});mb=sk(document.createElement("button"));mb.type="button";mb.className="ca-more ca-lmore";var ml=function(){mb.innerHTML=(open?"Kevesebb modell":"Mind a "+rows.length+" modell")+DN};ml();mb.addEventListener("click",function(){open=!open;tb.classList.toggle("ca-all",open);ml();if(!open)tb.scrollIntoView({behavior:"smooth",block:"start"})});var tw2=tb.closest(".ol-tw");tw2.parentNode.insertBefore(mb,tw2.nextSibling)}}
// --- bérelhető modellek
$$(".ol-card",root).forEach(function(a){var im=a.querySelector("img"),dv=a.querySelector("div");if(!im||a.querySelector(".ca-stage"))return;var st=sk(document.createElement("div"));st.className="ca-stage";a.insertBefore(st,im);st.appendChild(im);
var m=(im.getAttribute("src")||"").match(/\/berles\/([^\/?#]+)\.webp/);if(m&&CUT.indexOf(m[1])>-1)im.src="/berles-cut/"+m[1]+".webp";else im.classList.add("ca-full");
var sp=dv&&dv.querySelector("span");if(sp){var pm=sp.textContent.match(/([\d\s ]+)\s*Ft\/hó\s*(nettó-tól)?/);if(pm)sp.outerHTML='<div class="ca-pr"><strong>'+pm[1].trim()+' Ft</strong><small>/hó '+(pm[2]||"")+'</small></div>'}
a.insertAdjacentHTML("beforeend",'<span class="ca-go">'+ARR+'</span>')});
// --- GYIK: az első 4 látszik
var fq=$(".ol-faq",root);if(fq){var ds=$$(":scope>details",fq);if(ds.length>5){ds.forEach(function(d,k){if(k>=4)d.classList.add("ca-x")});fq.classList.add("ca-cut");var mo=sk(document.createElement("button"));mo.className="ca-more";mo.type="button";var lbl=function(){mo.innerHTML=(fq.classList.contains("ca-cut")?"Mind a "+ds.length+" kérdés":"Kevesebb kérdés")+DN};lbl();mo.addEventListener("click",function(){fq.classList.toggle("ca-cut");lbl()});fq.appendChild(mo)}}
$$(".ol-rl a",root).forEach(function(a){a.textContent=a.textContent.replace(/\s*→\s*$/,"")});
// sötét mód inline-színek takarítása
function cln(){$$(".ol-text,.ol-text *,.ol-grid,.ol-grid *,.ol-faq,.ol-faq *,.ol-rl,.ol-rl *,.sec-title,.sec-intro,.ca-flt,.ca-flt *",root).forEach(function(x){if(x.tagName==="IMG")return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

const SCROLL = '<button class="scrolldown" aria-label="Görgess lejjebb">Görgess<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>';

export function apply(h, CUT) {
  if (h.indexOf('id="ca-kf-css"') > -1 || h.indexOf('id="arlista"') < 0 || !/<section class="ol"[ >]/.test(h) || h.indexOf('ol-calc') > -1) return null;
  CUT = CUT || cutList();
  h = h.replace(/(<section class="hero"[^>]*>[\s\S]*?<div class="cta-row"[^>]*>[\s\S]*?<\/div>\s*<\/div>)(\s*<\/section>)/, (m, a, b) => (a.indexOf('scrolldown') > -1 ? m : a + SCROLL + b));
  h = h.replace('</head>', () => CSS + '</head>');
  return h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS(CUT) + '</body>');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const CUT = cutList(); let n = 0;
  for (const s of PAGES) {
    const f = path.join(DIST, s, 'index.html'); if (!fs.existsSync(f)) continue;
    const o = apply(fs.readFileSync(f, 'utf8'), CUT); if (o) { fs.writeFileSync(f, o); n++; }
  }
  console.log('[hu-konfig] konfigurátor oldalak: ' + n);
}
