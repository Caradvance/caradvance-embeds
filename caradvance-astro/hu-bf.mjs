// hu-bf.mjs — Beszerzési folyamat (HU, /beszerzesi-folyamat/): SEO + tartalmi egységesítés + letisztult megjelenés
// SEO (build időben, a HTML-ben): a cím/h1 a „menete / 12 lépés” kifejezésre (az /auto-rendeles/ marad a fő
// „autóbehozatal Németországból” oldal, nincs kannibalizáció), márkanév, og/twitter, BreadcrumbList, belső linkek,
// a /auto-rendeles/ GYIK-jével közös 3 kérdés kikerül a FAQPage-jelölésből (látható marad), halott „#” link ki.
// Tartalom (tulajdonosi döntés 2026-11-19): időtartam 5–14 nap, 1 éves jótállás — a látható szövegben és a jelölésekben is.
// Megjelenés: fejléc, a 12 lépés 4 fejezetben (ragadós szakasz-navigáció, fejezetenként rögzített fejléc, letisztult sorok), egységes kártyák,
// záró kártya piros gombbal, SEO-szöveg Bővebben, GYIK két oszlop, sötét mód átmenetek. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'beszerzesi-folyamat', 'index.html');
const SITE = 'https://www.caradvance.hu';
const TITLE = 'Az autóbehozatal menete Németországból — 12 lépésben | CarAdvance';
const DESC = 'Az autóbehozatal menete Németországból 12 lépésben: keresés, leinformálás, helyszíni bevizsgálás, szállítás, honosítás és kulcsrakész átadás — jellemzően 5–14 nap alatt.';
const DUP_FAQ = ['Milyen költségekkel kell számolnom?', 'Mennyi előleget kell fizetni?', 'Kapok garanciát a behozott autóra?'];

function seo(h, log) {
  const n0 = h.length;
  // tartalmi egységesítés (látható szöveg + JSON-LD)
  h = h.split('10–21 nap').join('5–14 nap');
  h = h.split('használtautó-garanciát vállalunk').join('1 éves jótállást adunk');
  h = h.split('Casco és használtautó-garancia').join('Casco és 1 éves jótállás');
  h = h.replace(/<h3([^>]*)>Biztosítás és garancia<\/h3>/, '<h3$1>Biztosítás és jótállás</h3>');
  h = h.split('"name":"Biztosítás és garancia"').join('"name":"Biztosítás és jótállás"');
  // cím, leírás, megosztás
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + TITLE + '</title>');
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, '$1' + DESC + '$2');
  h = h.replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, '$1' + TITLE + '$2');
  h = h.replace(/(<meta (?:property|name)="(?:og|twitter):description" content=")[^"]*(")/g, '$1' + DESC + '$2');
  // h1: a „menete” kifejezés
  h = h.replace(/(<h1[^>]*>)Hogyan működik az autóbehozatal Németországból\? —/, '$1Az autóbehozatal menete Németországból —');
  // FAQPage: a közös kérdések csak az /auto-rendeles/-en legyenek jelölve
  h = h.replace(/<script type="application\/ld\+json">(\{[^<]*?"@type":"FAQPage"[^<]*?\})<\/script>/, (a, j) => {
    try { const o = JSON.parse(j); const b = o.mainEntity.length; o.mainEntity = o.mainEntity.filter(q => DUP_FAQ.indexOf(q.name) < 0); log.faq = b + '→' + o.mainEntity.length; return '<script type="application/ld+json">' + JSON.stringify(o) + '</script>'; } catch (e) { return a; }
  });
  // halott „Szerződésminta” link (href="#") ki
  h = h.replace(/<a class="pf-cta"[^>]*href="#"[^>]*>Szerződésminta megtekintése →<\/a>/, () => { log.dead = 1; return ''; });
  // belső linkek
  const L = [
    ['Honosítás és vizsgáztatás', /(honosítás)( —)/, '/honositas-kalkulator/'],
    ['Biztosítás és jótállás', /(1 éves jótállás)/, '/minosegbiztositas/'],
  ];
  for (const [h3, re, url] of L) {
    const i = h.indexOf('>' + h3 + '</h3>');
    if (i < 0) { log.miss.push(h3); continue; }
    const j = h.indexOf('</p>', i);
    const seg = h.slice(i, j);
    const nseg = seg.replace(re, (m0, a1, a2) => '<a class="ca-qlink" href="' + url + '">' + a1 + '</a>' + (a2 || ''));
    if (nseg !== seg) { h = h.slice(0, i) + nseg + h.slice(j); log.links++; } else log.miss.push(h3);
  }
  const FL = [
    ['Mennyi ideig tart a teljes folyamat?', 'Az igényed jelzése után', '/auto-rendeles/#rendeles'],
    ['Milyen költségekkel kell számolnom?', 'regisztrációs adó', '/honositas-kalkulator/'],
    ['Milyen költségekkel kell számolnom?', 'vagyonszerzési illeték', '/atiras-kalkulator/'],
    ['Mennyi előleget kell fizetni?', 'végleges, egyedi ajánlatban', '/auto-rendeles/#rendeles'],
    ['Kapok garanciát a behozott autóra?', '1 éves jótállást', '/minosegbiztositas/'],
  ];
  for (const [q, phrase, url] of FL) {
    const mm = new RegExp('<summary[^>]*>' + q.replace(/[?.*+()]/g, '\\$&')).exec(h); const i = mm ? mm.index : -1; if (i < 0) { log.miss.push(q); continue; }
    const s = h.indexOf('</summary>', i), e = h.indexOf('</details>', s);
    const seg = h.slice(s, e), k = seg.indexOf(phrase);
    if (k < 0) { log.miss.push(q + ' → ' + phrase); continue; }
    h = h.slice(0, s) + seg.slice(0, k) + '<a class="ca-qlink" href="' + url + '">' + phrase + '</a>' + seg.slice(k + phrase.length) + h.slice(e); log.links++;
  }
  // morzsamenü
  h = h.replace('</head>', () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Autóbehozatal Németországból', item: SITE + '/auto-rendeles/' },
    { '@type': 'ListItem', position: 3, name: 'Az autóbehozatal menete', item: SITE + '/beszerzesi-folyamat/' },
  ] }) + '</script></head>');
  return h;
}

const P = 'html.ca-bf body section.pf ';
const D = 'html.ca-bf.ca-dark body section.pf ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.12)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.2),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.45),inset -1px -1px 1px rgba(255,255,255,.16),inset 0 0 0 1px rgba(255,255,255,.06),inset 0 10px 30px rgba(255,255,255,.05),0 30px 70px rgba(0,0,0,.55),0 4px 14px rgba(0,0,0,.35)!important;';
const CARD = HL, CARDD = HD;
const LN = 'rgba(18,19,23,.08)';

const JOURNEY = String.raw`var N=steps.length,PH=[["Keresés","Megtaláljuk a megfelelő autót",0,3,'<path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3"/>'],["Ellenőrzés & ajánlat","Leinformáljuk, és tételes ajánlatot adunk",3,6,'<path d="M9 12l2 2 4-4"/><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>'],["Vásárlás & szállítás","Megvesszük és biztonságban hazahozzuk",6,9,'<path d="M2 16V7h11v9M13 10h4l3 3v3h-7"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'],["Honosítás & átadás","Itthon minden papírt elintézünk",9,12,'<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/>']];
var wrap=tl.parentNode,box=el("div","ca-ch-wrap"),nav=el("nav","ca-ch-nav");nav.setAttribute("aria-label","A folyamat szakaszai");
nav.innerHTML='<div class="ca-ch-navi">'+PH.map(function(x,k){return '<button type="button" data-k="'+k+'"><b>0'+(k+1)+'</b><span>'+x[0]+'</span></button>'}).join("")+'</div><i class="ca-ch-bar"><em></em></i>';
wrap.insertBefore(box,tl);box.appendChild(nav);
var chs=PH.map(function(x,k){var c=el("section","ca-ch");c.setAttribute("data-k",k);c.innerHTML='<header class="ca-ch-h"><div class="ca-ch-hi"><svg class="ca-ch-no" viewBox="0 0 260 130" aria-hidden="true"><text x="0" y="112">0'+(k+1)+'</text></svg><span class="ca-ch-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+x[4]+'</svg></span><h3 class="ca-ch-t">'+x[0]+'</h3><p class="ca-ch-s">'+x[1]+'</p><span class="ca-ch-r">'+(x[2]+1)+'–'+x[3]+'. lépés</span></div></header><ol class="ca-ch-l"></ol>';var ol=c.querySelector("ol");for(var i=x[2];i<x[3];i++){var s=steps[i],li=document.createElement("li");li.className="ca-row";li.setAttribute("data-dm-skip","1");var n=el("span","ca-row-n",(i<9?"0":"")+(i+1));li.appendChild(n);li.appendChild(s);ol.appendChild(li)}box.appendChild(c);return c});
tl.parentNode.removeChild(tl);
var btns=[].slice.call(nav.querySelectorAll("button")),bar=nav.querySelector(".ca-ch-bar em");
btns.forEach(function(b,k){b.addEventListener("click",function(){var t=chs[k].getBoundingClientRect().top+scrollY-150;scrollTo({top:t,behavior:"smooth"})})});
function upd(){var y=innerHeight*.42,a=0;chs.forEach(function(c,k){if(c.getBoundingClientRect().top<=y)a=k});btns.forEach(function(b,k){b.classList.toggle("on",k===a);b.classList.toggle("done",k<a)});
var f=box.getBoundingClientRect(),pr=Math.max(0,Math.min(1,(y-f.top)/Math.max(1,f.height-innerHeight*.3)));bar.style.transform="scaleX("+pr+")";
var nb=nav.querySelector(".ca-ch-navi");var ab=btns[a];if(ab&&innerWidth<760&&nb.__a!==a){nb.__a=a;nb.scrollTo({left:ab.offsetLeft-16,behavior:"smooth"})}}
var nos=chs.map(function(c){return c.querySelector(".ca-ch-no text")}),rows=[].slice.call(box.querySelectorAll(".ca-row")),RM=matchMedia("(prefers-reduced-motion: reduce)").matches,ft=0;function fx(){ft=0;var vh=innerHeight;chs.forEach(function(c,k){var r=c.getBoundingClientRect(),p=RM?1:Math.max(0,Math.min(1,(vh*.9-r.top)/(vh*.55)));var t=nos[k];t.style.strokeDashoffset=String(420*(1-p));t.style.fillOpacity=String(Math.max(0,(p-.72)/.28))});var cy=vh*.5,best=1e9,ai=-1;rows.forEach(function(r,i){var b=r.getBoundingClientRect();if(b.bottom<0||b.top>vh)return;var d=Math.abs(b.top+b.height/2-cy);if(d<best){best=d;ai=i}});rows.forEach(function(r,i){r.classList.toggle("ca-f",i===ai)});box.classList.toggle("ca-foc",ai>-1&&!RM)}function q(){upd();if(!ft){ft=1;requestAnimationFrame(fx)}}addEventListener("scroll",q,{passive:true});addEventListener("resize",q);upd();fx();
if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("ca-in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -10% 0px"});[].slice.call(box.querySelectorAll(".ca-row,.ca-ch-h")).forEach(function(r){io.observe(r)})}else [].slice.call(box.querySelectorAll(".ca-row,.ca-ch-h")).forEach(function(r){r.classList.add("ca-in")});`;

const CSS = '<style id="ca-bf-css">'
  // fejléc
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.6) saturate(1.05)}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.35)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .partners{order:9;margin-top:22px!important;gap:10px!important}'
  + P + 'section.hero .partners img{height:26px!important}'
  + P + 'section.hero .inner{display:flex;flex-direction:column;align-items:center}'
  + P + 'section.hero .partners::before{content:"Az autókat innen szerezzük be:";color:rgba(255,255,255,.85);font-size:13px;font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.5)}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caFBob 1.8s ease-in-out infinite}'
  + '@keyframes caFBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}' + P + 'section.hero .partners::before{width:100%;text-align:center}}'
  // lépések: 4 fejezetes, szerkesztőségi elrendezés — ragadós szakasz-navigáció, fejezetenként rögzített fejléc, letisztult sorok
  + P + '.pf-wrap{max-width:1200px!important}'
  + P + '.ca-ch-wrap{position:relative;margin-top:28px}'
  + P + '.ca-ch-nav{position:sticky;top:84px;z-index:20;margin:0 auto 18px;max-width:960px;border-radius:20px;padding:6px;' + CARD + '}'
  + D + '.ca-ch-nav{background:rgba(24,25,30,.96)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 10px 30px rgba(0,0,0,.35)!important}'
  + P + '.ca-ch-navi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}'
  + P + '.ca-ch-nav button{display:flex;align-items:center;gap:10px;min-width:0;height:48px;padding:0 14px;border:0;border-radius:14px;background:transparent;color:inherit;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;opacity:.55;transition:opacity .3s,background .3s,color .3s;text-align:left}'
  + P + '.ca-ch-nav button span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + P + '.ca-ch-nav button b{font-size:12px;font-weight:800;letter-spacing:.06em;color:#E2001A;font-variant-numeric:tabular-nums}'
  + P + '.ca-ch-nav button.done{opacity:.8}'
  + P + '.ca-ch-nav button.on{opacity:1;background:#121317;color:#fff}'
  + D + '.ca-ch-nav button.on{background:#fff;color:#121317}'
  + P + '.ca-ch-nav button.on b{color:#FF4D5E}' + D + '.ca-ch-nav button.on b{color:#E2001A}'
  + P + '.ca-ch-bar{position:absolute;left:18px;right:18px;bottom:0;height:2px;overflow:hidden;border-radius:2px}'
  + P + '.ca-ch-bar em{display:block;height:100%;background:#E2001A;transform:scaleX(0);transform-origin:left;transition:transform .2s linear}'
  + P + '.ca-ch{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:56px;padding:56px 0;border-top:1px solid rgba(18,19,23,.08)}'
  + D + '.ca-ch{border-top-color:rgba(255,255,255,.08)}'
  + P + '.ca-ch:first-of-type{border-top:0}'
  + P + '.ca-ch-hi{position:sticky;top:180px}'
  + P + '.ca-ch-no{display:block;width:clamp(150px,15vw,210px);height:auto;overflow:visible;margin:0 0 18px -4px}'
  + P + '.ca-ch-no text{font-family:inherit;font-size:150px;font-weight:800;letter-spacing:-8px;fill:#E2001A;fill-opacity:0;stroke:#E2001A;stroke-width:1.6;stroke-dasharray:420;stroke-dashoffset:420;paint-order:stroke;transition:fill-opacity .25s linear}'
  + D + '.ca-ch-no text{fill:#FF2A40;stroke:#FF4D5E}'
  + P + '.ca-ch-wrap.ca-foc .ca-row.ca-in{opacity:.5}'
  + P + '.ca-ch-wrap.ca-foc .ca-row.ca-in.ca-f{opacity:1;transform:translateY(-3px);box-shadow:inset 3px 0 0 #E2001A,0 1px 2px rgba(18,19,23,.05),0 26px 56px rgba(18,19,23,.13)!important}'
  + D + '.ca-ch-wrap.ca-foc .ca-row.ca-in.ca-f{box-shadow:inset 3px 0 0 #E2001A,inset 1.5px 1.5px 1px rgba(255,255,255,.45),0 30px 70px rgba(0,0,0,.55)!important}'
  + P + '.ca-ch-wrap .ca-row.ca-in{transition:opacity .55s ease,transform .55s cubic-bezier(.2,.8,.2,1),box-shadow .55s ease}'
  + P + '.ca-ch-ic{display:inline-flex;width:44px;height:44px;border-radius:14px;align-items:center;justify-content:center;color:#fff;background:linear-gradient(180deg,#FF2A40,#E2001A 60%,#B80015);box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 10px 22px rgba(226,0,26,.3);margin-bottom:16px}'
  + P + '.ca-ch-ic svg{width:22px;height:22px}'
  + P + '.ca-ch-t{font-size:clamp(26px,2.6vw,34px)!important;font-weight:800!important;letter-spacing:-.025em;line-height:1.1;margin:0 0 8px!important}'
  + D + '.ca-ch-t{color:#fff!important}'
  + P + '.ca-ch-s{font-size:16px;line-height:1.5;opacity:.62;margin:0 0 14px;max-width:320px}'
  + P + '.ca-ch-r{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;background:rgba(226,0,26,.08);color:#B30015}'
  + D + '.ca-ch-r{background:rgba(226,0,26,.16);color:#FF7A87}'
  + P + '.ca-ch-l{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}'
  + P + '.ca-row{display:grid;grid-template-columns:56px minmax(0,1fr);gap:0;align-items:start;border-radius:24px;padding:26px 28px 26px 22px;transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .4s,opacity .6s;' + CARD + '}'
  + D + '.ca-row{' + CARDD + '}'
  + P + '.ca-row:hover{transform:translateY(-2px)}'
  + P + '.ca-row-n{font-size:15px;font-weight:800;color:#E2001A;letter-spacing:.04em;padding-top:4px;font-variant-numeric:tabular-nums}'
  + P + '.ca-row .pf-step{display:block!important;padding:0!important;margin:0!important;opacity:1!important;transform:none!important}'
  + P + '.ca-row .pf-step::before,' + P + '.ca-row .pf-step::after{display:none!important;content:none!important}'
  + P + '.ca-row .pf-n{display:none!important}'
  + P + '.ca-row .pf-b{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important}'
  + P + '.ca-row .pf-b h3{font-size:20px!important;font-weight:800!important;letter-spacing:-.015em;margin:0 0 8px!important}'
  + P + '.ca-row .pf-b p{font-size:15px!important;line-height:1.65!important;margin:0!important}'
  + D + '.ca-row .pf-b h3{color:#fff!important}' + D + '.ca-row .pf-b p{color:rgba(255,255,255,.72)!important}'
  + P + '.ca-row .pf-partners{margin-top:14px}' + P + '.ca-row a.pf-cta{display:inline-flex!important;margin-top:14px!important}'
  + P + '.ca-row a.ca-qlink{color:#E2001A;font-weight:600;text-decoration:underline;text-decoration-color:rgba(226,0,26,.3);text-underline-offset:3px}'
  + D + '.ca-row a.ca-qlink{color:#FF6B78}'
  + P + ':is(.ca-row,.ca-ch-h):not(.ca-in){opacity:0;transform:translateY(22px)}'
  + P + '.ca-ch-h{transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1)}'
  + P + '.ca-ch-l .ca-row:nth-child(2){transition-delay:.08s}' + P + '.ca-ch-l .ca-row:nth-child(3){transition-delay:.16s}'
  + '@media(max-width:900px){' + P + '.ca-ch{grid-template-columns:1fr;gap:22px;padding:40px 0}' + P + '.ca-ch-hi{position:static}' + P + '.ca-ch-no{width:110px;display:inline-block;margin:0 10px 10px -2px;vertical-align:bottom}' + P + '.ca-ch-ic{vertical-align:bottom;margin-bottom:6px}'
  + P + '.ca-ch-nav{top:76px;border-radius:16px;margin-left:-4px;margin-right:-4px}' + P + '.ca-ch-navi{display:flex;overflow-x:auto;scrollbar-width:none}' + P + '.ca-ch-navi::-webkit-scrollbar{display:none}' + P + '.ca-ch-nav button{flex:0 0 auto;height:42px;font-size:13px}'
  + P + '.ca-row{grid-template-columns:40px minmax(0,1fr);padding:20px 18px 20px 16px;border-radius:20px}' + P + '.ca-row .pf-b h3{font-size:18px!important}}'
  + '@media(prefers-reduced-motion:reduce){' + P + ':is(.ca-row,.ca-ch-h){opacity:1!important;transform:none!important;transition:none!important}}'
  // időtartam + lábjegyzetek
  + P + '.pf-time{flex-direction:row!important;align-items:stretch!important;max-width:880px;margin:40px auto 0!important;gap:16px!important}'
  + P + '.pf-time-n{width:220px!important;flex:0 0 220px!important;border-radius:24px!important;background:linear-gradient(180deg,#FF2A40,#E2001A 60%,#B80015)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 18px 40px rgba(226,0,26,.3)!important;font-size:30px!important}'
  + P + '.pf-time-b{border-radius:24px!important;padding:24px 26px!important;' + CARD + '}'
  + D + '.pf-time-b{' + CARDD + '}' + D + '.pf-time-b h3{color:#fff!important}' + D + '.pf-time-b p{color:rgba(255,255,255,.7)!important}'
  + P + '.pf-note{max-width:880px!important;font-size:12px!important;opacity:.75}'
  + '@media(max-width:700px){' + P + '.pf-time{flex-direction:column!important}' + P + '.pf-time-n{width:auto!important;flex:none!important}}'
  // záró kártya
  + P + 'div.pf-cta{position:relative;overflow:hidden;border-radius:32px!important;padding:52px 44px!important;background:#121317!important}'
  + P + 'div.pf-cta::before{content:"";position:absolute;inset:-60% -10% auto 40%;height:220%;background:radial-gradient(50% 50% at 50% 50%,rgba(226,0,26,.3),transparent 70%)!important;background-color:transparent!important;pointer-events:none}'
  + P + 'div.pf-cta>*{position:relative}'
  + P + 'div.pf-cta .btn{background:#E2001A!important;color:#fff!important;border:0!important;box-shadow:0 10px 30px rgba(226,0,26,.35)!important}'
  + D + 'div.pf-cta{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important}'
  // SEO-szöveg
  + P + '.pf-seo{text-align:center}' + P + '.pf-seo p{text-align:left}' + P + '.pf-seo .eyebrow{display:table;margin:0 auto}'
  + D + '.pf-seo-h{color:#fff!important}' + D + '.pf-seo p{color:rgba(255,255,255,.7)!important}' + D + '.pf-seo strong{color:#fff!important}'
  + P + '.ca-bmore{overflow:hidden;max-height:0;transition:max-height .5s ease}' + P + '.ca-bmore.open{max-height:2000px}'
  + P + '.ca-bmb{display:inline-flex;align-items:center;gap:6px;margin:4px auto 0;background:none;border:1px solid rgba(18,19,23,.14);border-radius:999px;padding:10px 18px;font-family:inherit;font-weight:600;font-size:13.5px;color:inherit;cursor:pointer}'
  + D + '.ca-bmb{border-color:rgba(255,255,255,.18);color:#fff}'
  + P + '.ca-bmb i{font-style:normal;transition:transform .3s}' + P + '.ca-bmb.open i{transform:rotate(180deg)}'
  // GYIK
  + P + '.pf-faq{max-width:1080px!important;display:grid!important;grid-template-columns:1fr 1fr;gap:12px!important;align-items:start}'
  + P + '.pf-faq details{border-radius:18px!important;' + CARD + '}'
  + D + '.pf-faq details{' + CARDD + '}' + D + '.pf-faq summary{color:#fff!important}' + D + '.pf-faq p{color:rgba(255,255,255,.72)!important}'
  + P + '.pf-faq a.ca-qlink{color:#E2001A;font-weight:600;text-decoration:underline;text-decoration-color:rgba(226,0,26,.3);text-underline-offset:3px}' + D + '.pf-faq a.ca-qlink{color:#FF6B78}'
  + '@media(max-width:860px){' + P + '.pf-faq{grid-template-columns:1fr}}'
  + D + ':is(.sec-title,.sec-intro){color:#fff}'
  + '</style>';

const JS = '<script id="ca-bf-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var root=$("section.pf"),tl=$(".pf-steps");if(!root||!tl||tl.__r)return;tl.__r=1;H.classList.add("ca-bf");'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  + 'var sd=$("section.hero .scrolldown",root);if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$(".pf-wrap",root);if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-140,behavior:"smooth"})})}'
  + 'var steps=$$(".pf-step",tl);if(steps.length===12){' + JOURNEY + '}'
  + 'var seo=$(".pf-seo",root);if(seo){var ps=$$(":scope>p",seo);if(ps.length>1){var m=el("div","ca-bmore");ps.slice(1).forEach(function(p){m.appendChild(p)});var b=el("button","ca-bmb","Bővebben <i>⌄</i>");b.type="button";b.addEventListener("click",function(){var o=m.classList.toggle("open");b.classList.toggle("open",o);b.firstChild.nodeValue=o?"Kevesebb ":"Bővebben "});seo.appendChild(b);seo.appendChild(m)}}'
  + 'function cln(){$$(".pf-b,.pf-b *,.pf-n,.ca-ch-nav,.ca-ch-nav *,.ca-ch-h,.ca-ch-h *,.ca-row,.ca-row-n,.pf-time-b,.pf-time-b *,.pf-faq,.pf-faq *,div.pf-cta,div.pf-cta *,.pf-seo,.pf-seo *",root).forEach(function(x){if(x.tagName==="IMG")return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}'
  + '[200,700,1600,3200].forEach(function(t){setTimeout(cln,t)});'
  + '})();</script>';

export function apply(h) {
  const log = { links: 0, miss: [], faq: '', dead: 0 };
  if (h.indexOf('id="ca-bf-css"') > -1 || h.indexOf('class="pf-steps') < 0) return { h, log };
  h = seo(h, log);
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return { h, log };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-bf] nincs', FILE); process.exit(0); }
  const src = fs.readFileSync(FILE, 'utf8');
  const { h, log } = apply(src);
  if (h === src) console.log('[hu-bf] már alkalmazva');
  else { fs.writeFileSync(FILE, h); console.log('[hu-bf] beszerzési folyamat:', JSON.stringify(log)); }
}
