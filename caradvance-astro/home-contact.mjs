// Build lépés: a magyar főoldal végére „Gyere be hozzánk” kapcsolat-szekció térképpel (a „Melyik autó érdekel?” után).
// Bal oldalt elérhetőségek üvegkártyákon + élő nyitvatartás, jobbra saját stílusú térkép (sötét/világos), piros
// jelölővel. Az élő Google-térkép csak kattintásra töltődik be (gyors, sütimentes betöltés).
// Mozgás: a kártyák beúsznak, a jelölő leérkezik. Térképadatok: © OpenStreetMap közreműködők. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');
const ADDR = 'Solymár, Ibolya utca 18.';
const Q = encodeURIComponent('CarAdvance, 2083 Solymár, Ibolya utca 18');
const LL = '47.583480,18.941276'; // a solymári iroda pontos helye
const EMBED = 'https://www.google.com/maps?q=' + LL + '&hl=hu&z=17&output=embed';
const DIR = 'https://www.google.com/maps/dir/?api=1&destination=' + LL;
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
  // ---- mozgás: a jelölő leérkezése, amikor a térkép láthatóvá válik ----
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

  // mozgás: a jelölő egyszer érkezik le, amikor a térkép láthatóvá válik; „mozgás csökkentése” esetén azonnal kész
  + 'var red=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;m.classList.add("cc-js");'
  + 'if(red||!("IntersectionObserver" in window)){m.classList.add("cc-done","cc-skip")}else{s.classList.add("cc-pre");'
  + 'var cards=s.querySelector(".cc-cards"),io2=new IntersectionObserver(function(es){if(es[0].isIntersecting){s.classList.remove("cc-pre");io2.disconnect()}},{threshold:.25});io2.observe(cards);'
  + 'var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();setTimeout(function(){m.classList.add("cc-done")},250)}},{threshold:.5});io.observe(m)}'
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
