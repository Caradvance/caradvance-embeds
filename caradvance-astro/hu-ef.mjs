// hu-ef.mjs — Értékesítési folyamat (HU, /ertekesitesi-folyamat/) letisztult, élőbb megjelenés
// 1 fejléc: logó nem lóg a menübe, piros kiemelés, kapszulák · 2 bevezető középre, nagy számkártyák
// 3 „sticky” történet: bal oldalt rögzített panel gördülő nagy számmal, címmel és 3 szakasz-sávval,
//   jobb oldalt a lépések; az aktuális lépés kiélesedik, a többi halvány · 4 egységes jogi/díj kártyák, táblázat
// 5 15% + 15% = 30% a Jótékonyság oldallal egyezően · 6 GYIK két oszlopban · 7 záró kártya piros gombbal
// 8 sötét mód: nincs éles sávhatár. Csak a magyar oldal, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'ertekesitesi-folyamat', 'index.html');

const P = 'html.ca-ef body ';
const D = 'html.ca-ef.ca-dark body ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:#fff!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;';
const STORY = String.raw`var PH=[["Előkészítés",0,3],["Értékesítés",3,7],["Lezárás",7,9]];
function phOf(i){for(var k=0;k<3;k++)if(i>=PH[k][1]&&i<PH[k][2])return k;return 2}
var wrap=tl.parentNode,sty=el("div","ca-sty"),pan=el("aside","ca-pan"),lst=el("div","ca-lst");
pan.innerHTML='<div class="ca-pk"><span></span></div><div class="ca-big"><div class="ca-nr"><span class="ca-d">01</span></div><span class="ca-of">/ 09</span></div><div class="ca-pt"><span></span></div><div class="ca-ptag"><span></span></div><div class="ca-pg">'+PH.map(function(x){return '<div class="ca-seg" style="flex:'+(x[2]-x[1])+'"><i><b></b></i><small>'+x[0]+'</small></div>'}).join("")+'</div>';
var mb=el("div","ca-mbar",'<div class="ca-mt"><b class="ca-mn">1</b><span>/ 9</span><em class="ca-mp">Előkészítés</em></div><i><b></b></i>');
tl.parentNode.insertBefore(sty,tl);sty.appendChild(pan);sty.appendChild(lst);lst.appendChild(mb);lst.appendChild(tl);tl.classList.add("ca-story");
var nr=pan.querySelector(".ca-nr"),pk=pan.querySelector(".ca-pk span"),pt=pan.querySelector(".ca-pt span"),ptag=pan.querySelector(".ca-ptag span"),segs=[].slice.call(pan.querySelectorAll(".ca-seg")),mn=mb.querySelector(".ca-mn"),mp=mb.querySelector(".ca-mp"),mf=mb.querySelector("i b");
var T=steps.map(function(s){var h=s.querySelector("h3"),g=s.querySelector(".tl-tag");return [h?h.textContent.trim():"",g?g.textContent.trim():""]});
function two(n){return (n<10?"0":"")+n}
var act=-1,cc=0,tc=0,raf=0;
function swap(box,txt,dir){var o=box.firstChild;if(o&&o.textContent===txt)return;var n=document.createElement("span");n.textContent=txt;n.className="in "+(dir>0?"up":"dn");box.appendChild(n);if(o){o.className="out "+(dir>0?"up":"dn");setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o)},700)}requestAnimationFrame(function(){requestAnimationFrame(function(){n.className="on"})})}
function setAct(i){if(i===act)return;var dir=i>act?1:-1;act=i;steps.forEach(function(s,j){s.classList.toggle("ca-on",j===i);s.classList.toggle("ca-past",j<i)});
var k=phOf(i);swap(nr,two(i+1),dir);swap(pt,T[i][0],dir);swap(ptag,T[i][1],dir);swap(pk,"0"+(k+1)+" · "+PH[k][0],dir);segs.forEach(function(sg,j){sg.classList.toggle("on",j===k)});mn.textContent=i+1;mp.textContent=PH[k][0]}
function measure(){var y=innerHeight*.5,C=steps.map(function(s){var r=s.getBoundingClientRect();return r.top+r.height/2});var i=0,best=1e9;C.forEach(function(c,j){var d=Math.abs(c-y);if(d<best){best=d;i=j}});
var t;if(y<=C[0])t=-.5+Math.max(0,1-(C[0]-y)/(innerHeight*.5))*.5;else if(y>=C[8])t=8+Math.min(1,(y-C[8])/(innerHeight*.5))*.5;else{for(var j=0;j<8;j++)if(y>=C[j]&&y<C[j+1]){t=j+(y-C[j])/(C[j+1]-C[j]);break}}
tc=t;setAct(i);if(!raf)raf=requestAnimationFrame(anim)}
function anim(){raf=0;cc+=(tc-cc)*.12;if(Math.abs(tc-cc)<.002)cc=tc;segs.forEach(function(sg,k){var a=PH[k][1],b=PH[k][2],f=Math.max(0,Math.min(1,(cc+.5-a)/(b-a)));sg.querySelector("b").style.transform="scaleX("+f+")"});mf.style.transform="scaleX("+Math.max(0,Math.min(1,(cc+.5)/9))+")";if(cc!==tc)raf=requestAnimationFrame(anim)}
addEventListener("scroll",measure,{passive:true});addEventListener("resize",measure);measure();setTimeout(measure,500);`;

const CSS = '<style id="ca-ef-css">'
  // ---- közös: sávok háttere átlátszó (sötétben se legyen éles határ)
  + P + '.cah>section.block{background:transparent!important;background-color:transparent!important}'
  + P + '.cah>section.block .sec-title{text-align:center!important;margin-left:auto!important;margin-right:auto!important}'
  + P + '.cah>section.block .eyebrow{display:table!important;margin-left:auto!important;margin-right:auto!important}'
  + P + '.cah>section.block .sec-lead{text-align:center!important;max-width:720px!important;margin-left:auto!important;margin-right:auto!important}'
  // ---- 1) fejléc
  + P + 'section.hero .brand-logo{display:none!important}'
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.58) saturate(1.05)}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.35)}'
  + P + 'section.hero h1 .ca-acc{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .sub{max-width:640px!important;margin-left:auto!important;margin-right:auto!important}'
  + P + '.ca-estats{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:22px auto 0}'
  + P + '.ca-estats span{display:inline-flex;align-items:baseline;gap:7px;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:#fff;font-size:13.5px;font-weight:600;line-height:1}'
  + P + '.ca-estats b{font-size:17px;font-weight:800}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caEBob 1.8s ease-in-out infinite}'
  + '@keyframes caEBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}' + P + 'section.hero .cta-row{flex-wrap:nowrap!important;gap:8px!important;justify-content:center}' + P + 'section.hero .cta-row .btn{padding:12px 15px!important;font-size:14px!important;white-space:nowrap}' + P + '.ca-estats span{padding:8px 12px;font-size:12.5px}}'
  // ---- 2) bevezető számkártyák
  + P + '.fl-highlights{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;margin-top:34px!important}'
  + P + '.fl-hl{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;padding:22px!important;border-radius:22px!important;' + CARD + '}'
  + D + '.fl-hl{' + CARDD + '}'
  + P + '.fl-hl .fl-n{background:none!important;color:#E2001A!important;-webkit-text-fill-color:#E2001A!important;font-size:38px!important;font-weight:800!important;letter-spacing:-.03em;height:auto!important;padding:0!important;min-width:0!important;line-height:1!important;box-shadow:none!important}'
  + P + '.fl-hl h4{font-size:15.5px!important}'
  + D + '.fl-hl h4{color:#fff!important}'
  + '@media(max-width:900px){' + P + '.fl-highlights{grid-template-columns:repeat(2,minmax(0,1fr))!important}}'
  // ---- 3) lépések: Apple-szerű „sticky” történet — bal oldalt rögzített panel (gördülő nagy szám, cím, szakasz-sávok), jobb oldalt a lépések
  + P + '#lepesek .tl::before{display:none!important}'
  + P + '.ca-sty{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:80px;max-width:1160px;margin:56px auto 0;align-items:start}'
  + P + '.ca-pan{position:sticky;top:calc(50vh - 200px);height:400px;display:flex;flex-direction:column;justify-content:center}'
  + P + '.ca-pk,' + P + '.ca-pt,' + P + '.ca-ptag{position:relative;overflow:hidden}'
  + P + '.ca-pan :is(.ca-pk,.ca-nr,.ca-pt,.ca-ptag) span{display:block;transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s cubic-bezier(.2,.8,.2,1),filter .7s ease}'
  + P + '.ca-pan :is(.ca-pk,.ca-nr,.ca-pt,.ca-ptag) span.in.up{transform:translateY(60%);opacity:0;filter:blur(6px)}'
  + P + '.ca-pan :is(.ca-pk,.ca-nr,.ca-pt,.ca-ptag) span.in.dn{transform:translateY(-60%);opacity:0;filter:blur(6px)}'
  + P + '.ca-pan :is(.ca-pk,.ca-nr,.ca-pt,.ca-ptag) span.out{position:absolute;left:0;top:0;right:0}'
  + P + '.ca-pan :is(.ca-pk,.ca-nr,.ca-pt,.ca-ptag) span.out.up{transform:translateY(-60%);opacity:0;filter:blur(6px)}'
  + P + '.ca-pan :is(.ca-pk,.ca-nr,.ca-pt,.ca-ptag) span.out.dn{transform:translateY(60%);opacity:0;filter:blur(6px)}'
  + P + '.ca-pk{font-size:12.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#E2001A;min-height:18px}'
  + P + '.ca-big{display:flex;align-items:flex-end;gap:10px;margin:10px 0 6px}'
  + P + '.ca-nr{position:relative;overflow:hidden;font-size:clamp(110px,11vw,164px);font-weight:800;letter-spacing:-.06em;line-height:.86;padding:4px .16em 8px 0}'
  + P + '.ca-nr span{padding-right:.12em;margin-right:-.06em;background:linear-gradient(180deg,#FF3B4E 0%,#E2001A 55%,#9E0012 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}'
  + P + '.ca-of{font-size:22px;font-weight:700;opacity:.35;padding-bottom:16px;letter-spacing:-.01em}'
  + P + '.ca-pt{font-size:clamp(22px,2.2vw,30px);font-weight:800;letter-spacing:-.02em;line-height:1.15;min-height:2.3em}'
  + P + '.ca-ptag{margin-top:10px;font-size:13px;font-weight:700;opacity:.55;min-height:18px}'
  + P + '.ca-pg{display:flex;gap:10px;margin-top:30px}'
  + P + '.ca-seg i{display:block;height:4px;border-radius:4px;background:rgba(18,19,23,.1);overflow:hidden}'
  + D + '.ca-seg i{background:rgba(255,255,255,.12)}'
  + P + '.ca-seg b{display:block;height:100%;background:#E2001A;transform:scaleX(0);transform-origin:left;border-radius:4px}'
  + P + '.ca-seg small{display:block;margin-top:9px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.4;transition:opacity .5s}'
  + P + '.ca-seg.on small{opacity:1}'
  + P + '#lepesek .tl.ca-story{max-width:none!important;margin:0!important;padding:0 0 12vh!important;display:block!important;position:relative}'
  + P + '#lepesek .tl.ca-story .tl-step{display:block!important;padding:0!important;margin:0 0 11vh!important;transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1),filter .7s ease;opacity:.28;transform:scale(.965);transform-origin:left center;filter:saturate(.4)}'
  + P + '#lepesek .tl.ca-story .tl-step:last-child{margin-bottom:0!important}'
  + P + '#lepesek .tl.ca-story .tl-step.ca-on{opacity:1;transform:none;filter:none}'
  + P + '#lepesek .tl.ca-story .tl-num{position:static!important;width:auto!important;height:auto!important;display:inline-flex!important;background:none!important;box-shadow:none!important;border:0!important;color:#E2001A!important;-webkit-text-fill-color:#E2001A!important;font-size:13px!important;font-weight:800!important;letter-spacing:.12em;margin:0 0 12px!important;padding:0!important}'
  + P + '#lepesek .tl.ca-story .tl-num::before{content:"LÉPÉS ";white-space:pre}'
  + P + '#lepesek .tl.ca-story .tl-body{border-radius:26px!important;padding:30px 32px!important;' + CARD + '}'
  + D + '#lepesek .tl.ca-story .tl-body{' + CARDD + '}'
  + P + '#lepesek .tl.ca-story .tl-step.ca-on .tl-body{box-shadow:0 1px 2px rgba(18,19,23,.04),0 30px 60px rgba(18,19,23,.10)!important}'
  + D + '#lepesek .tl.ca-story .tl-step.ca-on .tl-body{border-color:rgba(255,255,255,.14)!important;box-shadow:0 30px 60px rgba(0,0,0,.45)!important}'
  + P + '#lepesek .tl.ca-story .tl-body h3{font-size:22px!important;letter-spacing:-.015em}'
  + P + '#lepesek .tl.ca-story .tl-body p{font-size:15.5px!important;line-height:1.65!important}'
  + D + '#lepesek .tl-body h3{color:#fff!important}'
  + D + '#lepesek .tl-body p{color:rgba(255,255,255,.72)!important}'
  + P + '#lepesek .tl-tag{background:rgba(226,0,26,.07)!important;color:#B30015!important;-webkit-text-fill-color:#B30015!important}'
  + D + '#lepesek .tl-tag{background:rgba(226,0,26,.16)!important;color:#FF7A87!important;-webkit-text-fill-color:#FF7A87!important}'
  + P + '.ca-mbar{display:none}'
  + '@media(max-width:999px){' + P + '.ca-sty{display:block;margin-top:34px}' + P + '.ca-pan{display:none}'
  + P + '.ca-mbar{display:block;position:sticky;top:78px;z-index:20;margin:0 0 22px;padding:12px 16px 10px;border-radius:18px;background:rgba(255,255,255,.94);border:1px solid ' + LN + ';box-shadow:0 10px 30px rgba(18,19,23,.08)}'
  + D + '.ca-mbar{background:rgba(26,27,32,.96);border-color:rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.4)}'
  + P + '.ca-mt{display:flex;align-items:baseline;gap:6px;font-size:13px;font-weight:700}' + P + '.ca-mt b{font-size:18px;color:#E2001A}' + P + '.ca-mt span{opacity:.45}' + P + '.ca-mt em{font-style:normal;margin-left:auto;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.6}'
  + P + '.ca-mbar i{display:block;height:3px;border-radius:3px;margin-top:9px;background:rgba(18,19,23,.08);overflow:hidden}' + D + '.ca-mbar i{background:rgba(255,255,255,.1)}'
  + P + '.ca-mbar i b{display:block;height:100%;background:#E2001A;transform:scaleX(0);transform-origin:left}'
  + P + '#lepesek .tl.ca-story{padding-bottom:0!important}' + P + '#lepesek .tl.ca-story .tl-step{margin:0 0 16px!important;opacity:.5;transform:none;filter:none}' + P + '#lepesek .tl.ca-story .tl-step.ca-on{opacity:1}'
  + P + '#lepesek .tl.ca-story .tl-body{padding:22px!important}' + P + '#lepesek .tl.ca-story .tl-body h3{font-size:19px!important}}'
  + '@media(prefers-reduced-motion:reduce){' + P + '.ca-pan span,' + P + '#lepesek .tl.ca-story .tl-step{transition:none!important;filter:none!important}}'
  // ---- 4) jogi + díjak
  + P + '.legal-grid,' + P + '.fin-grid{gap:14px!important}'
  + P + '.legal-card,' + P + '.fin-card{border-radius:20px!important;padding:22px!important;' + CARD + '}'
  + D + '.legal-card,' + D + '.fin-card{' + CARDD + '}'
  + D + ':is(.legal-card,.fin-card) h4{color:#fff!important}'
  + P + '.legal-note{border-radius:20px!important;' + CARD + '}'
  + D + '.legal-note{' + CARDD + '}'
  + P + '.fee-wrap{border-radius:24px!important;overflow:hidden;' + CARD + 'max-width:860px;margin-left:auto!important;margin-right:auto!important}'
  + D + '.fee-wrap{' + CARDD + '}'
  + P + '.fee-table{background:transparent!important;width:100%}'
  + P + '.fee-table thead th{background:transparent!important}'
  + P + '.fee-table tbody tr{transition:background .2s}' + P + '.fee-table tbody tr:hover{background:rgba(226,0,26,.04)}'
  + P + '.fee-table td:nth-child(2) b{display:inline-block;min-width:58px;text-align:center;padding:5px 10px;border-radius:999px;background:rgba(226,0,26,.08);color:#E2001A}'
  + D + '.fee-table :is(th,td){border-bottom-color:rgba(255,255,255,.07)!important}'
  + D + '.fee-table td{color:rgba(255,255,255,.85)!important}'
  + D + '.fee-table td:nth-child(2) b{background:rgba(226,0,26,.18);color:#FF6B78}'
  + P + '.fee-foot{padding:0 18px 16px!important}'
  // ---- 5) 15 + 15 = 30
  + P + '.split3 .sp{' + CARD + 'color:#121317!important;border-radius:22px!important;text-align:center}'
  + D + '.split3 .sp{' + CARDD + 'color:#fff!important}'
  + P + '.split3 .sp .sp-top{font-size:12px!important;opacity:.6}'
  + P + '.split3 .sp-seller .sp-pct{color:#E2001A!important}' + P + '.split3 .sp-buyer .sp-pct{color:#1F3A7A!important}'
  + D + '.split3 .sp-buyer .sp-pct{color:#7FA2FF!important}'
  + P + '.split3 .sp-total{background:#121317!important;color:#fff!important;border-color:#121317!important}'
  + D + '.split3 .sp-total{background:#fff!important;color:#121317!important}'
  + P + '.split3 .sp .sp-txt{opacity:.72!important}'
  + P + '#jotekonysag .chip.cta{background:transparent!important;border:1px solid rgba(226,0,26,.4)!important;color:#E2001A!important}'
  + '@media(max-width:860px){' + P + '.split3 .sp-op{transform:none!important;align-self:center!important;line-height:1}}'
  // ---- 6) GYIK két oszlop
  + '@media(min-width:861px){' + P + '.faq-list{display:grid!important;grid-template-columns:1fr 1fr;gap:12px!important;align-items:start}}'
  + P + '.faq-item{border-radius:18px!important;' + CARD + '}'
  + D + '.faq-item{' + CARDD + '}'
  + D + '.faq-item summary{color:#fff!important}'
  // ---- 7) záró kártya
  + P + '#kapcsolat{padding-bottom:70px!important}'
  + P + '#kapcsolat>.wrap{position:relative;overflow:hidden;max-width:1240px;width:auto!important;box-sizing:border-box!important;border-radius:32px;background:#121317;color:#fff;padding:64px 24px!important}'
  + P + '#kapcsolat>.wrap::before{content:"";position:absolute;inset:auto -10% -60% -10%;height:120%;background:radial-gradient(50% 50% at 50% 50%,rgba(226,0,26,.28),transparent 70%)!important;background-color:transparent!important;pointer-events:none}'
  + P + '#kapcsolat>.wrap>*{position:relative}'
  + P + '#kapcsolat .sec-title{color:#fff!important;-webkit-text-fill-color:#fff!important}'
  + P + '#kapcsolat .sec-lead{color:rgba(255,255,255,.75)!important}'
  + P + '#kapcsolat .btn-primary{background:#E2001A!important;border-color:#E2001A!important;color:#fff!important;box-shadow:0 10px 30px rgba(226,0,26,.35)!important}'
  + P + '#kapcsolat .btn-white{background:transparent!important;border:1px solid rgba(255,255,255,.25)!important;color:#fff!important}'
  + D + '#kapcsolat>.wrap{background:transparent!important;max-width:none;border-radius:0}'
  + D + '#kapcsolat>.wrap::before{inset:10% 15%;height:auto;background:radial-gradient(50% 50% at 50% 55%,rgba(226,0,26,.16),transparent 72%)!important}'
  + '@media(max-width:1280px){' + P + '#kapcsolat>.wrap{margin-left:16px!important;margin-right:16px!important}' + D + '#kapcsolat>.wrap{margin-left:auto!important;margin-right:auto!important}}'
  + '</style>';

const JS = '<script id="ca-ef-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var tl=$("#lepesek .tl"),hero=$("section.hero");if(!tl||!hero||tl.__r)return;tl.__r=1;H.classList.add("ca-ef");'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  // 1) fejléc
  + 'var h1=$("h1",hero);if(h1&&!h1.querySelector(".ca-acc")){var br=h1.querySelector("br");if(br){var t=br.nextSibling;if(t&&t.nodeType===3){var s=el("span","ca-acc");s.textContent=t.nodeValue;h1.replaceChild(s,t)}}}'
  + 'var cr=$(".cta-row",hero);if(cr&&!$(".ca-estats",hero)){var st=el("div","ca-estats","<span><b>9</b> lépés az eladásig</span><span><b>1</b> felelős kapcsolattartó</span><span><b>30%</b> jó ügyre</span>");cr.parentNode.insertBefore(st,cr.nextSibling)}'
  + 'var sd=$(".scrolldown",hero);if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$("#attekintes");if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-80,behavior:"smooth"})})}'
  // díjtáblázat: a százalék kapszulában
  + '$$(".fee-table td:nth-child(2)").forEach(function(td){if(!td.querySelector("b"))td.innerHTML="<b>"+td.textContent+"</b>"});'
  // 3) lépések történetként
  + 'var steps=$$(".tl-step",tl);if(steps.length===9){' + STORY + '}'
  // sötét mód inline színeinek takarítása
  + 'function cln(){$$(".tl-num,.tl-body,.tl-body *,.ca-pan,.ca-pan *,.ca-mbar,.ca-mbar *,.fl-hl,.fl-hl *,.split3 .sp,.split3 .sp *,.fee-table td,.fee-table td *,.ca-estats *,#kapcsolat .btn,#kapcsolat .sec-title,#kapcsolat .sec-lead,.legal-card,.fin-card,.faq-item,.fee-wrap").forEach(function(x){["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}'
  + '[200,600,1500,3000].forEach(function(t){setTimeout(cln,t)});'
  + '})();</script>';

export function apply(h) {
  if (h.indexOf('id="ca-ef-css"') > -1) return h;
  if (h.indexOf('id="lepesek"') < 0 || h.indexOf('class="tl') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-ef] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-ef] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-ef] értékesítési folyamat: görgetésre haladó út'); }
}
