// hu-sell.mjs — Eladom az autómat (HU, /eladom/) letisztult megjelenés
// 1 fejléc (+3 szám, Görgess középen) · 2 háromlépéses űrlap (ugyanazok a mezők, ugyanaz a beküldés)
// 3 ismétlődő „Miért velünk” kártyák elrejtve · 4 üres helykitöltők (galéria, videó-dobozok) elrejtve, Kövess minket sáv
// 5 díjtáblázat kártyán · 6 7 lépés idővonalon · 7 GYIK 2 oszlop 6+összes, SEO Bővebben · 8 egységes sötét mód
// + jótékonysági kártyák végtelen, megállás nélküli jobbra úszása. Csak a magyar /eladom/ oldal, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'eladom', 'index.html');

const P = 'html.ca-sell body ';
const D = 'html.ca-sell.ca-dark body ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:rgba(255,255,255,.86)!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CHEV = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23767a85%27 stroke-width=%272.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E")';

const CSS = '<style id="ca-sell-css">'
  // ---- egységes kártyák, elmosás nélkül
  + P + '.ca-gl{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + D + '.ca-gl:not(.ch-card){' + CARDD + '}'
  + D + '.ca-gl::after{display:none!important}'
  // ---- 1) fejléc
  + D + 'section.hero.ca-hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video.ca-lv{filter:brightness(.58) saturate(1.05)}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.35)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .sub{max-width:620px!important;margin-left:auto!important;margin-right:auto!important}'
  + P + '.ca-sst{display:flex;justify-content:center;margin:16px auto 22px}'
  + P + '.ca-sst span{display:flex;flex-direction:column;align-items:center;padding:0 22px;color:rgba(255,255,255,.78);font-size:12.5px;font-weight:600;text-shadow:0 1px 10px rgba(0,0,0,.4)}'
  + P + '.ca-sst span+span{border-left:1px solid rgba(255,255,255,.28)}'
  + P + '.ca-sst b{color:#fff;font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.2;margin-bottom:2px}'
  + P + 'section.hero .scrolldown{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:16px!important;transform:translateX(-50%)!important;margin:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:4px!important;z-index:3!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caSBob 1.8s ease-in-out infinite}'
  + '@keyframes caSBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + P + 'section.section:has(>.wrap>.stats){display:none!important}'
  + '@media(max-width:640px){' + P + '.ca-sst span{padding:0 10px;font-size:10.5px}' + P + '.ca-sst b{font-size:16px}' + P + 'section.hero .scrolldown{display:none!important}'
  + P + 'section.hero .cta-row{flex-wrap:nowrap!important;gap:8px!important;justify-content:center}' + P + 'section.hero .cta-row .btn{padding:12px 15px!important;font-size:14px!important;white-space:nowrap}}'
  // ---- 2) űrlap lépésekben
  + P + '#sellForm.sf{max-width:900px;margin:0 auto;border-radius:26px!important;padding:30px 34px 30px!important;' + CARD + '}'
  + D + '#sellForm.sf{' + CARDD + '}'
  + P + '.ca-sfp{display:flex;align-items:center;gap:0;margin:0 0 26px;counter-reset:s}'
  + P + '.ca-sfp button{flex:1 1 0;display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;font-family:inherit;color:inherit;cursor:pointer;text-align:left;min-width:0}'
  + P + '.ca-sfp button+button{margin-left:14px}'
  + P + '.ca-sfp i{flex:0 0 34px;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:14px;background:rgba(18,19,23,.06);color:rgba(18,19,23,.55);transition:all .25s}'
  + D + '.ca-sfp i{background:rgba(255,255,255,.08);color:rgba(255,255,255,.6)}'
  + P + '.ca-sfp b{font-size:14px;font-weight:700;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + P + '.ca-sfp span{flex:1 1 auto;height:2px;border-radius:2px;background:rgba(18,19,23,.08);margin-left:6px}'
  + D + '.ca-sfp span{background:rgba(255,255,255,.08)}'
  + P + '.ca-sfp button.on i,' + P + '.ca-sfp button.done i{background:#E2001A;color:#fff}'
  + P + '.ca-sfp button.on b{opacity:1}'
  + P + '.ca-sfp button.done span{background:#E2001A}'
  + P + '.ca-sfs{display:none}' + P + '.ca-sfs.on{display:block;animation:caSfIn .35s ease}'
  + '@keyframes caSfIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'
  + P + '.ca-sfn{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px;padding-top:20px;border-top:1px solid ' + LN + '}'
  + D + '.ca-sfn{border-top-color:rgba(255,255,255,.08)}'
  + P + '.sf-submit-row .bk{background:none!important;border:0!important;font-family:inherit;font-weight:700;font-size:14.5px;color:inherit;opacity:.65;cursor:pointer;padding:10px 8px 10px 0;box-shadow:none!important}' + P + '.ca-sfn .bk{background:none;border:0;font-family:inherit;font-weight:700;font-size:14.5px;color:inherit;opacity:.65;cursor:pointer;padding:10px 4px}'
  + P + '.ca-sfn .nx{margin-left:auto;display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 26px;border-radius:999px;border:0;background:#121317;color:#fff;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;transition:background .2s}'
  + P + '.ca-sfn .nx:hover{background:#E2001A}'
  + D + '.ca-sfn .nx{background:#fff;color:#121317}' + D + '.ca-sfn .nx:hover{background:#E2001A;color:#fff}'
  + P + '#sellForm :is(input:not([type=checkbox]):not([type=file]),select,textarea){border-radius:13px!important;border:1px solid rgba(18,19,23,.12)!important;background-color:#F5F5F7!important;color:#121317!important;-webkit-text-fill-color:#121317!important;min-height:48px;box-shadow:none!important}'
  + D + '#sellForm :is(input:not([type=checkbox]):not([type=file]),select,textarea){background-color:rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.12)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}'
  + P + '#sellForm select{-webkit-appearance:none!important;appearance:none!important;background-image:' + CHEV + '!important;background-repeat:no-repeat!important;background-position:right 14px center!important;background-size:16px!important;padding-right:40px!important}'
  + D + '#sellForm select option{background:#1C1D22;color:#fff}'
  + P + '#sellForm :is(input,select,textarea):focus{outline:none!important;border-color:#E2001A!important;box-shadow:0 0 0 3px rgba(226,0,26,.12)!important}'
  + P + '#sellPhotos{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none}'
  + P + '.ca-up{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:16px;border-radius:16px;border:1.5px dashed rgba(18,19,23,.18);background:rgba(18,19,23,.02);cursor:pointer;transition:border-color .2s,background .2s}'
  + D + '.ca-up{border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.03)}'
  + P + '.ca-up:hover{border-color:#E2001A;background:rgba(226,0,26,.03)}'
  + P + '.ca-up i{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.08);color:#E2001A}'
  + P + '.ca-up b{display:block;font-size:14.5px}' + P + '.ca-up span{font-size:12.5px;opacity:.6}'
  + '@media(max-width:640px){' + P + '#sellForm.sf{padding:22px 16px!important;border-radius:20px!important}' + P + '.ca-sfp b{display:none}' + P + '.ca-sfp button+button{margin-left:8px}}'
  // ---- 3–4) ismétlődő és üres részek
  + P + 'section#miert{display:none!important}'
  + P + 'section#galeria.ca-empty{display:none!important}'
  + P + 'section.videos.ca-empty{display:none!important}'
  + P + '.ca-follow{display:flex;justify-content:flex-start;gap:10px;flex-wrap:wrap;margin-top:18px}'
  + P + '.ca-follow a{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(18,19,23,.12);font-weight:700;font-size:14px;color:inherit;text-decoration:none;transition:border-color .2s}'
  + D + '.ca-follow a{border-color:rgba(255,255,255,.16)}'
  + P + '.ca-follow a:hover{border-color:#E2001A}'
  + P + '.ca-follow img{width:20px;height:20px;border-radius:6px}'
  // ---- 5) díjtáblázat
  + P + '.fee-wrap{border-radius:24px!important;' + CARD + '}'
  + D + '.fee-wrap{' + CARDD + '}'
  + '@media(max-width:640px){' + P + '.fee-wrap{padding:20px 14px!important}' + P + '.fee-table :is(th,td){padding:10px 6px!important;font-size:12.5px!important}' + P + '.fee-table{width:100%!important;table-layout:fixed}}' + P + '.howwe-card{border-radius:22px!important;' + CARD + '}'
  + D + '.howwe-card{' + CARDD + '}'
  + P + '.ctable{border-radius:24px!important;overflow:hidden;' + CARD + '}'
  + D + '.ctable{' + CARDD + '}'
  // ---- jótékonyság: végtelen jobbra úszás
  + P + '.charity-wrap{position:relative;overflow:hidden!important;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);margin-left:-20px;margin-right:-20px}'
  + P + '.charity-wrap .ch-arrow{display:none!important}'
  + P + '#charityScroll.ca-mq{overflow:visible!important;scroll-snap-type:none!important;width:max-content!important;max-width:none!important;padding:6px 0 14px!important;will-change:transform;animation:caMq var(--dur,60s) linear infinite}'
  + '@keyframes caMq{from{transform:translate3d(calc(-1 * var(--w)),0,0)}to{transform:translate3d(0,0,0)}}'
  + P + '#charityScroll.ca-mq .ch-card{flex:0 0 332px!important;' + CARD + '}'
  + D + '#charityScroll.ca-mq .ch-card{' + CARDD + '}'
  + '@media(max-width:640px){' + P + '#charityScroll.ca-mq .ch-card{flex-basis:280px!important}}'
  // ---- 6) 7 lépés idővonalon
  + P + '.step-grid{display:block!important;max-width:760px;margin:0 auto;position:relative}'
  + P + '.step-grid::before{content:"";position:absolute;left:23px;top:30px;bottom:60px;width:2px;background:rgba(226,0,26,.45)}'
  + P + '.step-grid .step{display:grid!important;grid-template-columns:48px 1fr;column-gap:20px;background:none!important;border:0!important;box-shadow:none!important;padding:0 0 26px!important;position:relative}'
  + P + '.step-grid .step .n{width:48px!important;height:48px!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;background:#E2001A!important;color:#fff!important;font-size:18px!important;font-weight:800!important;box-shadow:0 0 0 7px #F5F5F7,0 10px 22px rgba(226,0,26,.3)!important;position:relative;z-index:1;margin:0!important}'
  + D + '.step-grid .step .n{box-shadow:0 0 0 7px #121318,0 0 26px rgba(226,0,26,.45)!important}'
  + P + '.step-grid .step h4{font-size:18px!important;margin:10px 0 6px!important;letter-spacing:-.01em}'
  + P + '.step-grid .step p{font-size:14.5px!important;opacity:.68;line-height:1.55!important;margin:0!important}'
  + P + '.step-grid .step.full h4{color:#E2001A}'
  // ---- 7) GYIK + SEO
  + P + '.faq-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px!important;align-items:start}'
  + P + '.faq-list details{margin:0!important;border-radius:16px!important}'
  + P + '.faq-list:not(.ca-all) details:nth-of-type(n+7){display:none!important}'
  + P + '.ca-smb{display:inline-flex;align-items:center;gap:6px;background:none;border:1px solid rgba(18,19,23,.14);border-radius:999px;padding:10px 18px;font-family:inherit;font-weight:600;font-size:13.5px;line-height:1;color:inherit;cursor:pointer}'
  + D + '.ca-smb{border-color:rgba(255,255,255,.18)}'
  + P + '.ca-smb i{font-style:normal;transition:transform .3s}' + P + '.ca-smb.open i{transform:rotate(180deg)}'
  + P + '.faq-list .ca-smb{grid-column:1/-1;justify-self:center;margin-top:8px}'
  + P + '.seo-wrap .ca-more{overflow:hidden;max-height:0;transition:max-height .45s ease}' + P + '.seo-wrap .ca-more.open{max-height:3000px}'
  + '@media(max-width:900px){' + P + '.faq-list{grid-template-columns:1fr}}'
  + '</style>';

const JS = '<script id="ca-sell-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var F=$("#sellForm");if(!F||F.__s)return;F.__s=1;H.classList.add("ca-sell");'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  + 'function mb(lbl,on){var b=el("button","ca-smb",lbl+" <i>⌄</i>");b.type="button";b.addEventListener("click",function(){var o=on();b.classList.toggle("open",o);b.firstChild.nodeValue=(o?"Kevesebb":lbl)+" "});return b}'
  + 'function go(t){if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-100,behavior:"smooth"})}'
  // 1) fejléc
  + 'var sb=$("section.hero .sub");if(sb){sb.textContent="Profi fotó és videó, nagy elérés, teljes ügyintézés — te csak átadod az autót, és minden eladásból egy magyar jótékony szervezetet is támogatunk.";sb.parentNode.insertBefore(el("div","ca-sst","<span><b>23 év</b>tapasztalat</span><span><b>2 piactér</b>Használtautó.hu + mobile.de</span><span><b>30%</b>jutalék jótékony célra</span>"),sb.nextSibling)}'
  + 'var sd=$("section.hero .scrolldown");if(sd)sd.addEventListener("click",function(e){e.preventDefault();e.stopImmediatePropagation();go($("#ertekbecsles"))},true);'
  // 2) űrlap 3 lépésben
  + 'var ch=[].slice.call(F.children),G=[[0,5],[5,9],[9,ch.length]],T=["Az autó","Ár és jó ügy","Elérhetőség"],S=[];'
  + 'var pr=el("div","ca-sfp");T.forEach(function(t,i){var b=el("button","",\'<i>\'+(i+1)+"</i><b>"+t+"</b>"+(i<2?"<span></span>":""));b.type="button";b.addEventListener("click",function(){if(i<cur||ok(cur))show(i)});pr.appendChild(b)});F.insertBefore(pr,F.firstChild);'
  + 'G.forEach(function(g,i){var w=el("div","ca-sfs");ch.slice(g[0],g[1]).forEach(function(c){w.appendChild(c)});var nv=el("div","ca-sfn");if(i>0){var bk=el("button","bk","← Vissza");bk.type="button";bk.onclick=function(){show(i-1)};nv.appendChild(bk)}if(i<2){var nx=el("button","nx","Tovább →");nx.type="button";nx.onclick=function(){if(ok(i))show(i+1)};nv.appendChild(nx)}if(i<2)w.appendChild(nv);else{var sr=w.querySelector(".sf-submit-row");var bk2=nv.firstChild;if(sr&&bk2){nv.removeChild(bk2);sr.insertBefore(bk2,sr.firstChild)}}F.appendChild(w);S.push(w)});'
  + 'var cur=0;function show(i){cur=i;S.forEach(function(s,j){s.classList.toggle("on",j===i)});$$("button",pr).forEach(function(b,j){b.classList.toggle("on",j===i);b.classList.toggle("done",j<i)});var r=F.getBoundingClientRect();if(r.top<70||r.top>innerHeight*.4)scrollTo({top:r.top+scrollY-110,behavior:"smooth"})}'
  + 'function ok(i){var bad=$$("input,select,textarea",S[i]).filter(function(x){return x.willValidate&&!x.checkValidity()});if(bad.length){bad[0].reportValidity();return false}return true}'
  + 'F.addEventListener("invalid",function(e){var s=S.findIndex(function(x){return x.contains(e.target)});if(s>-1&&s!==cur){cur=s;S.forEach(function(x,j){x.classList.toggle("on",j===s)});$$("button",pr).forEach(function(b,j){b.classList.toggle("on",j===s);b.classList.toggle("done",j<s)})}},true);'
  + 'S.forEach(function(s){s.classList.remove("on")});cur=0;S[0].classList.add("on");$$("button",pr)[0].classList.add("on");'
  // fotófeltöltő
  + 'var fi=$("#sellPhotos");if(fi){var up=el("label","ca-up",\'<i><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></svg></i><div><b>Fotók kiválasztása</b><span>Kattints ide — max. 12 kép</span></div>\');up.setAttribute("for","sellPhotos");fi.parentNode.insertBefore(up,fi.nextSibling);fi.addEventListener("change",function(){var n=fi.files?fi.files.length:0;up.querySelector("b").textContent=n?n+" fotó kiválasztva":"Fotók kiválasztása";up.querySelector("span").textContent=n?"Kattints a cseréhez":"Kattints ide — max. 12 kép"})}'
  // 3–4) üres részek, Kövess minket
  + 'var gal=$("#galeria");if(gal&&!gal.querySelector(".gal img"))gal.classList.add("ca-empty");'
  + 'var vs=$("section.videos");if(vs&&!vs.querySelector(".vthumb img,.vthumb video,.vthumb iframe")){vs.classList.add("ca-empty");var ig=$(\'footer a[href*="instagram"]\'),tt=$(\'footer a[href*="tiktok"]\');var fw=el("div","ca-follow");if(ig)fw.innerHTML+=\'<a href="\'+ig.href+\'" target="_blank" rel="noopener"><img alt="" src="https://www.caradvance.hu/instagram.webp">Instagram</a>\';if(tt)fw.innerHTML+=\'<a href="\'+tt.href+\'" target="_blank" rel="noopener"><img alt="" src="https://www.caradvance.hu/tiktok.webp">TikTok</a>\';var pbtn=$("#foto-video .btn");if(fw.children.length&&pbtn)pbtn.parentNode.insertBefore(fw,pbtn.nextSibling)}'
  // jótékonyság: végtelen jobbra
  + 'var cs=$("#charityScroll");if(cs&&!cs.__m){cs.__m=1;var cards=$$(".ch-card",cs);cards.forEach(function(c){var k=c.cloneNode(true);k.setAttribute("aria-hidden","true");$$("a,button",k).forEach(function(a){a.tabIndex=-1});cs.appendChild(k)});cs.classList.add("ca-mq");cs.scrollLeft=0;'
  + 'function sz(){var gap=parseFloat(getComputedStyle(cs).columnGap||getComputedStyle(cs).gap)||20;var w=0;cards.forEach(function(c){w+=c.getBoundingClientRect().width+gap});cs.style.setProperty("--w",w+"px");cs.style.setProperty("--dur",Math.max(30,w/45)+"s")}sz();addEventListener("resize",sz)}'
  // 7) GYIK + SEO
  + 'var fq=$(".faq-list");if(fq){var n=$$("details",fq).length;if(n>6)fq.appendChild(mb("Összes kérdés ("+n+")",function(){return fq.classList.toggle("ca-all")}))}'
  + 'var seo=$(".seo-wrap");if(seo){var ps=$$(":scope>p.seo-p",seo);if(ps.length>1){var m=el("div","ca-more");ps.slice(1).forEach(function(p){m.appendChild(p)});seo.appendChild(mb("Bővebben",function(){return m.classList.toggle("open")}));seo.appendChild(m)}}'
  // sötét mód: dark-mode.js inline színei ne írják felül az új elemeket
  + 'setTimeout(function(){$$(".ca-sfp *,.ca-sfn *,.ca-up,.ca-up *,.ca-smb,.ca-follow a,.step-grid .n",document).forEach(function(x){["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})},400);'
  + '})();</script>';

export function apply(h) {
  if (h.indexOf('id="ca-sell-css"') > -1) return h;
  if (h.indexOf('id="sellForm"') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-sell] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-sell] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-sell] eladom az autómat: letisztult nézet'); }
}
