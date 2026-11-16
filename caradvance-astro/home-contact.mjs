// Build lépés: a magyar főoldal végére „Gyere be hozzánk” kapcsolat-szekció térképpel (a „Melyik autó érdekel?” után).
// Bal oldalt elérhetőségek üvegkártyákon + élő nyitvatartás, jobbra saját stílusú térkép (sötét/világos), piros
// jelölővel. Az élő Google-térkép csak kattintásra töltődik be (gyors, sütimentes betöltés).
// Térképadatok: © OpenStreetMap közreműködők. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');
const ADDR = 'Solymár, Ibolya utca 18.';
const Q = encodeURIComponent('CarAdvance, 2083 Solymár, Ibolya utca 18');
const EMBED = 'https://www.google.com/maps?q=' + Q + '&hl=hu&z=16&output=embed';
const DIR = 'https://www.google.com/maps/dir/?api=1&destination=' + Q;
const OPEN = 'https://www.google.com/maps/search/?api=1&query=' + Q;

const I = {
  tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="11"/><path d="M12 7v5l3 2"/>',
};
const sv = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>';

const HTML = '<section class="block" id="ca-contact" data-dm-skip><div class="wrap"><div class="cc-grid">'
  + '<div class="cc-left reveal"><span class="eyebrow">Kapcsolat</span><h2 class="sec-title">Gyere be hozzánk</h2>'
  + '<p class="cc-lead">Kérdésed van, autót keresel vagy eladnád a sajátodat? Hívj, írj, vagy ugorj be egy kávéra Solymáron.</p>'
  + '<div class="cc-cards">'
  + '<a class="cc-card" href="tel:+36302336060"><span class="cc-ic">' + sv('tel') + '</span><span><small>Telefon</small><b>+36 30 233 6060</b></span><em>→</em></a>'
  + '<a class="cc-card" href="mailto:info@caradvance.hu"><span class="cc-ic">' + sv('mail') + '</span><span><small>E-mail</small><b>info@caradvance.hu</b></span><em>→</em></a>'
  + '<a class="cc-card" href="' + DIR + '" target="_blank" rel="noopener"><span class="cc-ic">' + sv('pin') + '</span><span><small>Cím</small><b>' + ADDR + '</b></span><em>→</em></a>'
  + '<div class="cc-card cc-hours"><span class="cc-ic">' + sv('clock') + '</span><span><small>Nyitvatartás</small><b>Hétfőtől péntekig 9–17</b></span><span class="cc-live" id="cc-live"></span></div>'
  + '</div><div class="cc-btns"><a class="btn btn-red" href="/autot-keresek/">Ajánlatot kérek →</a><a class="cc-ghost" href="' + DIR + '" target="_blank" rel="noopener">Útvonaltervezés</a></div></div>'
  + '<div class="cc-map reveal" role="region" aria-label="Térkép: ' + ADDR + '"><div class="cc-mapimg"></div>'
  + '<svg class="cc-eu" viewBox="0 0 1180 1026" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image class="cc-eu-l" href="/terkep-europa-light.webp" width="1180" height="1026"/><image class="cc-eu-d" href="/terkep-europa-dark.webp" width="1180" height="1026"/><rect class="cc-eu-v" width="1180" height="1026"/><path class="cc-route-bg" d="M250.5 498.5 C274.3 499.8 350.6 516.5 393.4 506.2 C436.2 495.9 456.7 446.1 507.2 436.8 C557.7 427.5 645.8 436.3 696.5 450.4 C747.2 464.4 772.2 507.0 811.2 521.1 C850.2 535.2 910.5 532.9 930.4 535.3"/><path class="cc-route" d="M250.5 498.5 C274.3 499.8 350.6 516.5 393.4 506.2 C436.2 495.9 456.7 446.1 507.2 436.8 C557.7 427.5 645.8 436.3 696.5 450.4 C747.2 464.4 772.2 507.0 811.2 521.1 C850.2 535.2 910.5 532.9 930.4 535.3"/><g class="cc-city cc-c1"><circle cx="250.5" cy="498.5" r="11"/><text x="250.5" y="446.5" text-anchor="middle">Geretsried</text><text class="cc-sub" x="250.5" y="474.5" text-anchor="middle">Németország</text></g><g class="cc-city cc-c2"><circle cx="930.4" cy="535.3" r="11"/><text x="930.4" y="593.3" text-anchor="middle">Solymár</text><text class="cc-sub" x="930.4" y="621.3" text-anchor="middle">Magyarország</text></g><g class="cc-car"><circle r="22" class="cc-car-glow"/><circle r="11"/></g></svg>'
  + '<span class="cc-chip">Németországból Solymárra</span>'
  + '<div class="cc-pin"><i></i><span>CarAdvance</span></div>'
  + '<div class="cc-mtop"><a class="cc-mbtn" href="' + OPEN + '" target="_blank" rel="noopener">Megnyitás Google Térképen ↗</a></div>'
  + '<button type="button" class="cc-load">Interaktív térkép betöltése</button>'
  + '<span class="cc-attr">© OpenStreetMap</span></div>'
  + '</div></div></section>';

const CSS = '<style id="ca-contact-css">'
  + '#ca-contact{--cc-ink:#121317;--cc-mut:#5E616A;--cc-line:rgba(18,19,23,.09);--cc-card:linear-gradient(160deg,rgba(255,255,255,.85),rgba(255,255,255,.55));--cc-ic:linear-gradient(145deg,#4A4D55,#24262B);--cc-map:url(/terkep-solymar-light.webp);padding-top:30px!important;padding-bottom:70px!important}'
  + 'html.ca-dark #ca-contact{--cc-ink:#F2F3F5;--cc-mut:#9AA0AC;--cc-line:rgba(255,255,255,.09);--cc-card:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));--cc-ic:linear-gradient(145deg,#3A3D45,#1B1C21);--cc-map:url(/terkep-solymar-dark.webp)}'
  + '#ca-contact .cc-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:40px;align-items:stretch}'
  + '#ca-contact .cc-left{display:flex;flex-direction:column;color:var(--cc-ink)}'
  + '#ca-contact .sec-title{margin:6px 0 10px;color:var(--cc-ink)!important}'
  + '#ca-contact .cc-lead{color:var(--cc-mut)!important;font-size:16px;line-height:1.55;margin:0 0 22px;max-width:46ch}'
  + '#ca-contact .cc-cards{display:grid;grid-template-columns:1fr;gap:8px}'
  + '#ca-contact .cc-card{position:relative;display:flex;align-items:center;gap:13px;padding:10px 40px 10px 10px;border-radius:16px;background:var(--cc-card);border:1px solid var(--cc-line);color:var(--cc-ink)!important;text-decoration:none;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);transition:border-color .2s,box-shadow .2s,transform .2s;min-width:0}'
  + '#ca-contact a.cc-card:hover{border-color:rgba(226,0,26,.5);box-shadow:0 12px 30px rgba(226,0,26,.12);transform:translateY(-2px)}'
  + '#ca-contact .cc-ic{flex:none;width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:var(--cc-ic);box-shadow:inset 0 1px 0 rgba(255,255,255,.2);transition:background .2s}'
  + '#ca-contact a.cc-card:hover .cc-ic{background:linear-gradient(145deg,#FF3B4E,#B3001A)}'
  + '#ca-contact .cc-ic svg{width:20px;height:20px;display:block;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
  + '#ca-contact .cc-card small{display:block;font-size:12px;color:var(--cc-mut);font-weight:500}'
  + '#ca-contact .cc-card b{display:block;font-size:15px;font-weight:700;color:var(--cc-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + '#ca-contact .cc-card>span:nth-child(2){min-width:0}'
  + '#ca-contact .cc-card em{position:absolute;right:14px;font-style:normal;color:var(--cc-mut);transition:transform .2s,color .2s}'
  + '#ca-contact a.cc-card:hover em{color:#E2001A;transform:translateX(3px)}'
  + '#ca-contact .cc-hours{padding-right:14px}'
  + '#ca-contact .cc-live{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--cc-mut);margin-left:auto}'
  + '#ca-contact .cc-live i{width:8px;height:8px;border-radius:50%;background:none;box-shadow:inset 0 0 0 4px #30D158,0 0 0 4px rgba(48,209,88,.16)}'
  + '#ca-contact .cc-live.off i{box-shadow:inset 0 0 0 4px #FF9F0A,0 0 0 4px rgba(255,159,10,.16)}'
  + '#ca-contact .cc-btns{display:flex;gap:10px;align-items:center;margin-top:22px;flex-wrap:wrap}'
  + '#ca-contact .cc-ghost{display:inline-flex;align-items:center;height:48px;padding:0 20px;border-radius:999px;border:1px solid var(--cc-line);color:var(--cc-ink)!important;font-weight:700;font-size:15px;text-decoration:none;transition:border-color .2s}'
  + '#ca-contact .cc-ghost:hover{border-color:rgba(226,0,26,.5)}'
  + '#ca-contact .cc-map{position:relative;min-height:460px;border-radius:26px;overflow:hidden;border:1px solid var(--cc-line);box-shadow:0 30px 70px rgba(0,0,0,.18);background:#1a1c21}'
  + '#ca-contact .cc-mapimg{position:absolute;inset:0;background:var(--cc-map) center/cover no-repeat;transform:scale(1.02);transition:transform 6s ease}'
  + '#ca-contact .cc-map:hover .cc-mapimg{transform:scale(1.06)}'
  + '#ca-contact .cc-map:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 55% at 50% 50%,rgba(226,0,26,.14),transparent 70%)}'
  + '#ca-contact .cc-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}'
  + '#ca-contact .cc-pin i{position:relative;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(145deg,#FF3B4E,#B3001A);box-shadow:0 8px 20px rgba(226,0,26,.5);order:2}'
  + '#ca-contact .cc-pin i:after{content:"";position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff}'
  + '#ca-contact .cc-pin i:before{content:"";position:absolute;left:-14px;top:-14px;right:-14px;bottom:-14px;border-radius:50%;border:2px solid rgba(226,0,26,.55);animation:ccPulse 2.2s ease-out infinite}'
  + '@keyframes ccPulse{from{opacity:1;transform:scale(.5)}to{opacity:0;transform:scale(1.5)}}'
  + '#ca-contact .cc-pin span{order:1;font-size:13px;font-weight:800;color:#121317;background:#fff;padding:6px 12px;border-radius:999px;box-shadow:0 8px 20px rgba(0,0,0,.25)}'
  + '#ca-contact .cc-mtop{position:absolute;right:14px;top:14px;z-index:3}'
  + '#ca-contact .cc-mbtn,#ca-contact .cc-load{display:inline-flex;align-items:center;height:38px;padding:0 14px;border-radius:999px;background:rgba(255,255,255,.92);color:#121317!important;font:inherit;font-size:13px;font-weight:700;text-decoration:none;border:0;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.2);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'
  + '#ca-contact .cc-load{position:absolute;right:14px;bottom:24px;z-index:3;background:rgba(18,19,23,.82);color:#fff!important}'
  + '#ca-contact .cc-load:hover{background:#E2001A}'
  + '#ca-contact .cc-photo{position:absolute;left:14px;bottom:14px;z-index:3;width:190px;margin:0;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 14px 34px rgba(0,0,0,.35);transform:rotate(-2deg);transition:transform .3s}'
  + '#ca-contact .cc-photo:hover{transform:rotate(0) scale(1.04)}'
  + '#ca-contact .cc-photo img{display:block;width:100%;height:118px;object-fit:cover}'
  + '#ca-contact .cc-photo figcaption{font-size:12px;font-weight:700;color:#121317;padding:7px 10px}'
  + '#ca-contact .cc-attr{position:absolute;right:10px;bottom:6px;z-index:2;font-size:10px;color:rgba(255,255,255,.55)}'
  + 'html.ca-light #ca-contact .cc-attr{color:rgba(18,19,23,.45)}'
  + '#ca-contact .cc-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:4}'
  + '#ca-contact .cc-map.on .cc-load,#ca-contact .cc-map.on .cc-pin,#ca-contact .cc-map.on .cc-photo{display:none}'
  + '@media(max-width:900px){#ca-contact .cc-grid{grid-template-columns:1fr;gap:24px}#ca-contact .cc-cards{grid-template-columns:1fr}#ca-contact .cc-map{min-height:360px}#ca-contact .cc-photo{width:140px}#ca-contact .cc-photo img{height:86px}#ca-contact .cc-load{bottom:22px;top:auto;right:auto;left:50%;transform:translateX(-50%);white-space:nowrap}#ca-contact .cc-hours{flex-wrap:wrap}#ca-contact .cc-hours .cc-live{margin-left:55px;width:100%}#ca-contact .cc-card b{white-space:normal}#ca-contact .cc-btns{flex-wrap:nowrap}#ca-contact .cc-btns .btn,#ca-contact .cc-ghost{flex:1;justify-content:center;padding:0 12px;white-space:nowrap}}'
  // ---- mozgás: Németországból Solymárra, majd ráközelítés és a jelölő leérkezése ----
  + '#ca-contact .cc-eu{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:none;transform-origin:79% 52%;transition:transform 1.4s cubic-bezier(.6,0,.2,1),opacity 1s ease .25s}'
  + '#ca-contact .cc-map.cc-js:not(.cc-skip) .cc-eu{display:block}'
  + '#ca-contact .cc-eu-d{display:none}html.ca-dark #ca-contact .cc-eu-d{display:inline}html.ca-dark #ca-contact .cc-eu-l{display:none}'
  + '#ca-contact .cc-eu-v{fill:url(#none);fill:rgba(246,246,243,.35)}html.ca-dark #ca-contact .cc-eu-v{fill:rgba(13,15,19,.35)}'
  + '#ca-contact .cc-route-bg{fill:none;stroke:rgba(226,0,26,.22);stroke-width:10;stroke-linecap:round;stroke-dasharray:2 16}'
  + '#ca-contact .cc-route{fill:none;stroke:#E2001A;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 10px rgba(226,0,26,.8))}'
  + '#ca-contact .cc-city circle{fill:#fff;stroke:#E2001A;stroke-width:6}'
  + '#ca-contact .cc-city text{font:800 42px/1 inherit;font-family:inherit;fill:#121317;paint-order:stroke;stroke:rgba(255,255,255,.9);stroke-width:8px}'
  + 'html.ca-dark #ca-contact .cc-city text{fill:#F5F5F7;stroke:rgba(10,10,12,.85)}'
  + '#ca-contact .cc-city .cc-sub{font-size:27px;font-weight:600;fill:#6B7080}html.ca-dark #ca-contact .cc-city .cc-sub{fill:#9AA0AC}'
  + '#ca-contact .cc-city{opacity:0;transition:opacity .5s ease}#ca-contact .cc-map.cc-play .cc-c1{opacity:1}#ca-contact .cc-map.cc-arrive .cc-c2{opacity:1}'
  + '#ca-contact .cc-car{opacity:0}#ca-contact .cc-car circle{fill:#E2001A}#ca-contact .cc-car .cc-car-glow{fill:rgba(226,0,26,.25)}'
  + '#ca-contact .cc-chip{position:absolute;left:16px;top:16px;z-index:3;display:none;height:36px;align-items:center;padding:0 14px;border-radius:999px;background:rgba(18,19,23,.82);color:#fff;font-size:13px;font-weight:700;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;transform:translateY(-6px);transition:opacity .4s,transform .4s}'
  + '#ca-contact .cc-map.cc-js:not(.cc-skip) .cc-chip{display:inline-flex}#ca-contact .cc-map.cc-play .cc-chip{opacity:1;transform:none}#ca-contact .cc-map.cc-zoom .cc-chip{opacity:0}'
  + '#ca-contact .cc-map.cc-zoom .cc-eu{transform:scale(5.5);opacity:0}'
  + '#ca-contact .cc-map.cc-js .cc-mapimg{opacity:0;transform:scale(1.3)!important;transition:opacity .9s ease .35s,transform 1.4s cubic-bezier(.6,0,.2,1)!important}'
  + '#ca-contact .cc-map.cc-js.cc-zoom .cc-mapimg,#ca-contact .cc-map.cc-js.cc-skip .cc-mapimg{opacity:1;transform:scale(1.02)!important}'
  + '#ca-contact .cc-map.cc-js:not(.cc-done) .cc-pin,#ca-contact .cc-map.cc-js:not(.cc-done) .cc-load,#ca-contact .cc-map.cc-js:not(.cc-done) .cc-mtop{opacity:0}'
  + '#ca-contact .cc-load,#ca-contact .cc-mtop{transition:opacity .5s ease .5s}'
  + '#ca-contact .cc-map.cc-done:not(.cc-skip) .cc-pin i{animation:ccDrop .7s cubic-bezier(.3,1.6,.5,1) both}'
  + '@keyframes ccDrop{0%{transform:translateY(-70px) rotate(-45deg);opacity:0}60%{opacity:1}100%{transform:rotate(-45deg);opacity:1}}'
  + '#ca-contact .cc-map.cc-done:not(.cc-skip) .cc-pin span{animation:ccPop .45s cubic-bezier(.3,1.6,.5,1) .45s both}'
  + '@keyframes ccPop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}'
  // kártyák lépcsőzetes beúszása + ikon-mikromozgások
  + '#ca-contact.cc-pre .cc-card{opacity:0;transform:translateX(-14px)}'
  + '#ca-contact .cc-card{transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.2,1),border-color .2s,box-shadow .2s}'
  + '#ca-contact .cc-card:nth-child(2){transition-delay:.08s,.08s,0s,0s}#ca-contact .cc-card:nth-child(3){transition-delay:.16s,.16s,0s,0s}#ca-contact .cc-card:nth-child(4){transition-delay:.24s,.24s,0s,0s}'
  + '#ca-contact a.cc-card:hover{transition-delay:0s!important}'
  + '#ca-contact .cc-card:hover .cc-ic svg{animation:ccWig .5s ease}'
  + '#ca-contact .cc-card[href^="mailto"]:hover .cc-ic svg{animation:ccPulseIc .5s ease}'
  + '#ca-contact .cc-card[target]:hover .cc-ic svg{animation:ccHop .55s ease}'
  + '#ca-contact .cc-hours:hover .cc-ic svg{animation:ccSpin .8s ease}'
  + '@keyframes ccWig{20%{transform:rotate(-14deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(4deg)}}'
  + '@keyframes ccPulseIc{50%{transform:scale(1.18)}}'
  + '@keyframes ccHop{40%{transform:translateY(-5px)}70%{transform:translateY(1px)}}'
  + '@keyframes ccSpin{to{transform:rotate(360deg)}}'
  + '@media(prefers-reduced-motion:reduce){#ca-contact .cc-card,#ca-contact .cc-card *{animation:none!important;transition:none!important}}'
  + '</style>';

const JS = '<script id="ca-contact-js">(function(){var s=document.getElementById("ca-contact");if(!s)return;'
  + 'var d;try{d=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Budapest"}))}catch(e){d=new Date()}var wd=d.getDay(),h=d.getHours()+d.getMinutes()/60,open=wd>=1&&wd<=5&&h>=9&&h<17;'
  + 'var nx=(wd===5&&h>=17)||wd===6||wd===0?"Hétfőn 9-től":(h<9?"Ma 9-től":"Holnap 9-től");var l=document.getElementById("cc-live");if(l){l.className="cc-live"+(open?"":" off");l.innerHTML="<i></i>"+(open?"Most nyitva":nx)}'
  + 'var m=s.querySelector(".cc-map"),b=s.querySelector(".cc-load");if(b)b.addEventListener("click",function(){var f=document.createElement("iframe");f.src=' + JSON.stringify(EMBED) + ';f.title="CarAdvance – ' + ADDR + '";f.loading="lazy";f.referrerPolicy="no-referrer-when-downgrade";m.appendChild(f);m.classList.add("on")});'

  // mozgás: egyszer fut le, amikor a térkép láthatóvá válik; „mozgás csökkentése” esetén a kész állapot látszik
  + 'var red=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;m.classList.add("cc-js");'
  + 'function fin(){m.classList.add("cc-zoom","cc-done","cc-skip");s.classList.remove("cc-pre")}'
  + 'if(red||!("IntersectionObserver" in window)){fin()}else{s.classList.add("cc-pre");'
  + 'var cards=s.querySelector(".cc-cards"),io2=new IntersectionObserver(function(es){if(es[0].isIntersecting){s.classList.remove("cc-pre");io2.disconnect()}},{threshold:.25});io2.observe(cards);'
  + 'var svg=m.querySelector(".cc-eu"),rt=m.querySelector(".cc-route"),car=m.querySelector(".cc-car"),L=rt.getTotalLength();rt.style.strokeDasharray=L;rt.style.strokeDashoffset=L;'
  + 'function org(){try{var r=m.getBoundingClientRect(),q=svg.createSVGPoint();q.x=930.4;q.y=535.3;var c=q.matrixTransform(svg.getScreenCTM());svg.style.transformOrigin=(c.x-r.left)+"px "+(c.y-r.top)+"px"}catch(e){}}'
  + 'function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}'
  + 'function play(){m.classList.add("cc-play");org();var t0=0,D=2300;setTimeout(function(){car.style.opacity=1;requestAnimationFrame(function st(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/D),e=ease(k),pt=rt.getPointAtLength(L*e);rt.style.strokeDashoffset=L*(1-e);car.setAttribute("transform","translate("+pt.x+" "+pt.y+")");if(k<1)requestAnimationFrame(st);else{m.classList.add("cc-arrive");car.style.transition="opacity .4s";car.style.opacity=0;setTimeout(function(){org();m.classList.add("cc-zoom");setTimeout(function(){m.classList.add("cc-done")},1150)},650)}})},350)}'
  + 'var io=new IntersectionObserver(function(es){if(es[0].isIntersecting&&es[0].intersectionRatio>=.45){io.disconnect();play()}},{threshold:[0,.45,.8]});io.observe(m)}'
  + '})();</script>';

try {
  if (!fs.existsSync(FILE)) console.log('[home-contact] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-contact"') > -1) console.log('[home-contact] már alkalmazva');
    else {
      const i = h.indexOf('id="ca-cta"');
      const j = i > -1 ? h.indexOf('</section>', i) : -1;
      if (j < 0) console.log('[home-contact] nincs #ca-cta — kihagyva');
      else {
        h = h.slice(0, j + 10) + HTML + h.slice(j + 10);
        h = h.replace('</head>', () => CSS + '</head>');
        h = h.replace('</body>', () => JS + '</body>');
        fs.writeFileSync(FILE, h);
        console.log('[home-contact] kapcsolat-szekció térképpel beillesztve');
      }
    }
  }
} catch (e) { console.log('[home-contact] hiba:', e.message); }
