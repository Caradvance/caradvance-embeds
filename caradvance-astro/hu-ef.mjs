// hu-ef.mjs — Értékesítési folyamat (HU, /ertekesitesi-folyamat/) letisztult, élőbb megjelenés
// 1 fejléc: logó nem lóg a menübe, piros kiemelés, kapszulák · 2 bevezető középre, nagy számkártyák
// 3 „görgetésre haladó út”: a 9 lépés cikk-cakkban egy középső úton, 3 szakaszban; görgetéskor piros vonal
//   töltődik, egy kis autó halad rajta, az aktuális lépés kiemelkedik · 4 egységes jogi/díj kártyák, táblázat
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
const CAR = '<i></i>';

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
  // ---- 3) görgetésre haladó út
  + P + '#lepesek .tl{max-width:1080px!important;margin:44px auto 0!important;position:relative}'
  + P + '#lepesek .tl::before{display:none!important}'
  + P + '.ca-rt,.ca-rf{position:absolute;left:50%;top:0;width:4px;margin-left:-2px;border-radius:4px;z-index:0}'
  + P + '.ca-rt{bottom:0;background:repeating-linear-gradient(180deg,rgba(18,19,23,.14) 0 10px,transparent 10px 18px)}'
  + D + '.ca-rt{background:repeating-linear-gradient(180deg,rgba(255,255,255,.14) 0 10px,transparent 10px 18px)}'
  + P + '.ca-rf{height:0;background:linear-gradient(180deg,rgba(226,0,26,.25),#E2001A 120px);box-shadow:0 0 18px rgba(226,0,26,.35)}'
  + P + '.ca-car{position:absolute;left:50%;top:0;z-index:4;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#fff;border:4px solid #E2001A;box-sizing:border-box;box-shadow:0 0 0 6px rgba(226,0,26,.14),0 0 26px 4px rgba(226,0,26,.55);pointer-events:none;transition:opacity .4s}'
  + P + '.ca-car i{position:absolute;inset:-12px;border-radius:50%;border:1px solid rgba(226,0,26,.45);animation:caEPulse 2.4s cubic-bezier(.2,.7,.2,1) infinite}'
  + '@keyframes caEPulse{0%{transform:scale(.4);opacity:.9}100%{transform:scale(1.6);opacity:0}}'
  + '@media(prefers-reduced-motion:reduce){' + P + '.ca-car i{animation:none;opacity:0}}'
  + P + '#lepesek .tl.ca-road{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:110px}'
  + P + '#lepesek .tl.ca-road .tl-step{display:block!important;padding:0 0 22px!important;position:relative;z-index:1}'
  + P + '#lepesek .tl-step .tl-num{position:absolute!important;top:20px;width:48px!important;height:48px!important;font-size:18px!important;transition:background-color .6s ease,border-color .6s ease,box-shadow .6s ease,color .6s ease;background:#fff!important;color:rgba(18,19,23,.45)!important;-webkit-text-fill-color:rgba(18,19,23,.45)!important;border:2px solid rgba(18,19,23,.12);box-shadow:0 0 0 6px #F5F5F7!important;z-index:3}'
  + D + '#lepesek .tl-step .tl-num{background:#1a1b20!important;color:rgba(255,255,255,.5)!important;-webkit-text-fill-color:rgba(255,255,255,.5)!important;border-color:rgba(255,255,255,.14);box-shadow:0 0 0 6px #111216!important}'
  + P + '#lepesek .tl-step.ca-L .tl-num{right:-79px}' + P + '#lepesek .tl-step.ca-R .tl-num{left:-79px}'
  + P + '#lepesek .tl-step.ca-done .tl-num{background:#E2001A!important;border-color:#E2001A;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:0 0 0 6px #F5F5F7,0 8px 20px rgba(226,0,26,.35)!important}'
  + D + '#lepesek .tl-step.ca-done .tl-num{box-shadow:0 0 0 6px #111216,0 0 22px rgba(226,0,26,.45)!important}'
  + P + '#lepesek .tl-body{border-radius:22px!important;padding:22px 24px!important;transition:transform .8s cubic-bezier(.2,.7,.2,1),box-shadow .8s ease,opacity .8s ease,border-color .8s ease;' + CARD + '}'
  + D + '#lepesek .tl-body{' + CARDD + '}'
  + P + '#lepesek .tl-step:not(.ca-done) .tl-body{opacity:.78}'
  + P + '#lepesek .tl-step.ca-on .tl-body{opacity:1;transform:translateY(-2px);border-color:rgba(226,0,26,.35)!important;box-shadow:0 18px 44px rgba(226,0,26,.14),0 2px 6px rgba(18,19,23,.05)!important}'
  + D + '#lepesek .tl-step.ca-on .tl-body{border-color:rgba(255,77,94,.45)!important;box-shadow:0 0 0 1px rgba(255,77,94,.2),0 18px 44px rgba(0,0,0,.4)!important}'
  + P + '#lepesek .tl-step.ca-L .tl-body::after,' + P + '#lepesek .tl-step.ca-R .tl-body::after{content:"";position:absolute;top:43px;width:30px;height:2px;background:rgba(18,19,23,.12)}'
  + P + '#lepesek .tl-step.ca-L .tl-body::after{right:-30px}' + P + '#lepesek .tl-step.ca-R .tl-body::after{left:-30px}'
  + P + '#lepesek .tl-step.ca-done .tl-body::after{background:rgba(226,0,26,.5)}'
  + P + '#lepesek .tl-body h3{font-size:18px!important}'
  + D + '#lepesek .tl-body h3{color:#fff!important}'
  + D + '#lepesek .tl-body p{color:rgba(255,255,255,.72)!important}'
  + P + '#lepesek .tl-tag{background:rgba(226,0,26,.07)!important;color:#B30015!important;-webkit-text-fill-color:#B30015!important}'
  + D + '#lepesek .tl-tag{background:rgba(226,0,26,.16)!important;color:#FF7A87!important;-webkit-text-fill-color:#FF7A87!important}'
  + P + '.ca-ph{grid-column:1/-1;justify-self:center;position:relative;z-index:2;margin:6px 0 26px;display:inline-flex;align-items:center;gap:10px;padding:9px 18px;border-radius:999px;font-size:12.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;' + CARD + '}'
  + D + '.ca-ph{background:#1a1b20!important;border:1px solid rgba(255,255,255,.1)!important;box-shadow:none!important;color:#fff}'
  + P + '.ca-ph i{font-style:normal;color:#E2001A;font-weight:800}'
  + P + '.ca-ph small{font-size:12px;font-weight:700;letter-spacing:0;text-transform:none;opacity:.55}'
  + '@media(max-width:860px){' + P + '#lepesek .tl.ca-road{display:block!important}' + P + '.ca-rt,.ca-rf{left:24px}' + P + '.ca-car{left:24px}'
  + P + '#lepesek .tl.ca-road .tl-step{padding:0 0 18px 64px!important}' + P + '#lepesek .tl-step.ca-L .tl-num,' + P + '#lepesek .tl-step.ca-R .tl-num{left:0;right:auto;top:16px}'
  + P + '#lepesek .tl-step .tl-body::after{display:none!important}' + P + '.ca-ph{display:flex;width:max-content;margin:4px 0 20px 0}' + P + '#lepesek .tl-step.ca-on .tl-body{transform:none}}'
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
  // 3) út
  + 'var steps=$$(".tl-step",tl);if(steps.length===9){'
  + 'var PH=[[0,"Előkészítés","1–3. lépés"],[3,"Értékesítés","4–7. lépés"],[7,"Lezárás","8–9. lépés"]];var row=1;'
  + 'PH.forEach(function(ph,k){var a=ph[0],b=k<2?PH[k+1][0]:9;var p=el("div","ca-ph","<i>"+(k+1)+"</i>"+ph[1]+" <small>· "+ph[2]+"</small>");tl.insertBefore(p,steps[a]);p.style.gridRow=row+" / span 1";row++;'
  + 'for(var i=a;i<b;i++){var j=i-a,s=steps[i];s.classList.add(j%2?"ca-R":"ca-L");s.style.gridColumn=j%2?"2":"1";s.style.gridRow=(row+j)+" / span 2"}row+=(b-a)+1});'
  + 'tl.classList.add("ca-road");var rt=el("div","ca-rt"),rf=el("div","ca-rf"),car=el("div","ca-car",' + JSON.stringify(CAR) + ');tl.insertBefore(rt,tl.firstChild);tl.insertBefore(rf,rt.nextSibling);tl.appendChild(car);'
  + 'var tk=0;function upd(){tk=0;var r=tl.getBoundingClientRect(),vh=innerHeight,y=vh*.58,h=r.height;var f=Math.max(0,Math.min(h,y-r.top));rf.style.height=f+"px";car.style.top=f+"px";car.style.opacity=f<=0||f>=h?"0":"1";var last=-1;'
  + 'steps.forEach(function(s,i){var n=s.querySelector(".tl-num");var nr=n.getBoundingClientRect();var d=nr.top+nr.height/2<=y;s.classList.toggle("ca-done",d);if(d)last=i});steps.forEach(function(s,i){s.classList.toggle("ca-on",i===last)})}'
  + 'function q(){if(!tk){tk=1;requestAnimationFrame(upd)}}addEventListener("scroll",q,{passive:true});addEventListener("resize",q);upd();setTimeout(upd,600)}'
  // sötét mód inline színeinek takarítása
  + 'function cln(){$$(".tl-num,.tl-body,.tl-body *,.ca-ph,.ca-ph *,.fl-hl,.fl-hl *,.split3 .sp,.split3 .sp *,.fee-table td,.fee-table td *,.ca-estats *,#kapcsolat .btn,#kapcsolat .sec-title,#kapcsolat .sec-lead,.legal-card,.fin-card,.faq-item,.fee-wrap").forEach(function(x){["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}'
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
