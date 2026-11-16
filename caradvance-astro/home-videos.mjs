// Build lépés: két bemutatófilm a magyar főoldalon (dist/index.html).
//  1) „AI autókereső” — a Kínálat (#autoink) után: szöveg + gomb (megnyitja a „Segítek” chatet) és egy némán,
//     ismétlődve futó, üveges „képernyő” a filmmel.
//  2) „Autórendelés” — az „Így dolgozunk” (#miert) elején: nagy, mozi-szerű keret, benne némán futó előzetes,
//     rajta lejátszás gomb; kattintásra teljes képernyős lejátszó indul hanggal (a teljes, 69 mp-es film).
// A videók csak akkor töltődnek be, amikor a látogató odagörget; csökkentett mozgásnál nem indulnak maguktól.
// Fájlok: /video/ai-kereso.mp4, /video/rendeles-teaser.mp4, /video/rendeles.mp4 (+ .webp poszterek). Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');

const GLASS = 'background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.03) 40%,rgba(255,255,255,.02)),rgba(20,22,27,.6);border:1px solid rgba(255,255,255,.14);'
  + 'box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.22),0 40px 100px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%)';

const CSS = '<style id="ca-video-css">'
  + '.cav-sec{position:relative;padding:96px 0 40px}'
  + '.cav-sec .wrap{position:relative}'
  // AI kereső: szöveg balra, „képernyő” jobbra
  + '.cav-ai{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.25fr);gap:56px;align-items:center}'
  + '.cav-eb{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#ff3b4e}'
  + '.cav-eb i{width:7px;height:7px;border-radius:50%;background:#ff3b4e;box-shadow:0 0 12px #ff3b4e;animation:cav-pulse 1.8s ease-in-out infinite}'
  + '@keyframes cav-pulse{50%{opacity:.35}}'
  + '.cav-h{margin:14px 0 16px;font-size:clamp(32px,3.6vw,52px);line-height:1.04;letter-spacing:-.035em;font-weight:800;color:#fff}'
  + '.cav-h em{font-style:normal;background:linear-gradient(90deg,#ff3b4e,#ff8a5c);-webkit-background-clip:text;background-clip:text;color:transparent}'
  + '.cav-p{font-size:17px;line-height:1.6;color:rgba(255,255,255,.66);margin:0 0 26px;max-width:460px}'
  + '.cav-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 30px}'
  + '.cav-chip{font-size:13.5px;font-weight:600;color:rgba(255,255,255,.85);padding:9px 14px;border-radius:999px;cursor:pointer;' + 'background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.16);transition:background .2s,transform .2s}'
  + '.cav-chip:hover{background:rgba(255,255,255,.18);transform:translateY(-2px)}'
  + '.cav-btn{display:inline-flex;align-items:center;gap:10px;height:54px;padding:0 26px;border-radius:14px;border:0;cursor:pointer;font:inherit;font-size:16px;font-weight:700;color:#fff;background:#E2001A;box-shadow:0 14px 34px rgba(226,0,26,.45);transition:transform .2s,box-shadow .2s;text-decoration:none}'
  + '.cav-btn:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(226,0,26,.55)}'
  + '.cav-screen{position:relative;border-radius:26px;padding:10px;' + GLASS + '}'
  + '.cav-screen::before{content:"";position:absolute;inset:-60px -40px;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 55% 50% at 50% 55%,rgba(226,0,26,.28),transparent 70%)}'
  + '.cav-screen video,.cav-film video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:18px;background:#F4F4F2}'
  // Autórendelés: mozi-keret
  + '.cav-film-wrap{margin:0 0 56px}'
  + '.cav-film{position:relative;border-radius:30px;padding:12px;cursor:pointer;' + GLASS + ';transition:transform .5s cubic-bezier(.2,.8,.2,1)}'
  + '.cav-film:hover{transform:translateY(-4px)}'
  + '.cav-film::before{content:"";position:absolute;inset:-70px -50px;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 50% 45% at 50% 60%,rgba(226,0,26,.25),transparent 72%)}'
  + '.cav-film .cav-ov{position:absolute;inset:12px;border-radius:20px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:28px 30px;'
  + 'background:linear-gradient(180deg,rgba(10,11,14,0) 45%,rgba(10,11,14,.78) 100%);pointer-events:none}'
  + '.cav-film .cav-ovt b{display:block;font-size:clamp(20px,2.2vw,30px);font-weight:800;letter-spacing:-.02em;color:#fff;line-height:1.15}'
  + '.cav-film .cav-ovt span{display:block;margin-top:6px;font-size:15px;color:rgba(255,255,255,.75)}'
  + '.cav-play{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:92px;height:92px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
  + 'background:#E2001A;box-shadow:0 0 0 12px rgba(226,0,26,.18),0 20px 50px rgba(226,0,26,.55);transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s}'
  + '.cav-play svg{width:30px;height:30px;margin-left:5px;fill:#fff}'
  + '.cav-play::after{content:"";position:absolute;inset:-12px;border-radius:50%;border:2px solid rgba(255,80,95,.6);animation:cav-ring 2.2s ease-out infinite}'
  + '@keyframes cav-ring{from{transform:scale(.85);opacity:1}to{transform:scale(1.5);opacity:0}}'
  + '.cav-film:hover .cav-play{transform:translate(-50%,-50%) scale(1.08);box-shadow:0 0 0 16px rgba(226,0,26,.22),0 24px 60px rgba(226,0,26,.65)}'
  + '.cav-len{font-size:13px;font-weight:700;color:#fff;padding:8px 13px;border-radius:999px;white-space:nowrap;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}'
  // teljes képernyős lejátszó
  + '.cav-lb{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:4vh 4vw;background:rgba(6,7,9,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'
  + '.cav-lb.on{display:flex;animation:cav-in .3s ease}@keyframes cav-in{from{opacity:0}to{opacity:1}}'
  + '.cav-lb video{width:min(1400px,100%);max-height:88vh;aspect-ratio:16/9;border-radius:18px;background:#000;box-shadow:0 40px 120px rgba(0,0,0,.7)}'
  + '.cav-lb .cav-x{position:absolute;right:20px;top:18px;width:48px;height:48px;border-radius:50%;cursor:pointer;color:#fff;font-size:18px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08)}'
  + '.cav-lb .cav-cta{position:absolute;left:50%;bottom:3vh;transform:translateX(-50%);display:none}.cav-lb.end .cav-cta{display:inline-flex}'
  + '@media(max-width:900px){.cav-sec{padding:64px 0 24px}.cav-ai{grid-template-columns:1fr;gap:32px}.cav-screen{order:-1}.cav-film .cav-ov{padding:16px 18px}.cav-film .cav-ovt span{display:none}.cav-play{width:58px;height:58px;top:38%}.cav-film .cav-ovt b{font-size:15px}.cav-play svg{width:22px;height:22px}.cav-len{display:none}}'
  + '@media(prefers-reduced-motion:reduce){.cav-play::after,.cav-eb i{animation:none}}'
  + '</style>';

const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>';

const AI = '<section class="cav-sec" id="ai-autokereso" data-dm-skip><div class="wrap"><div class="cav-ai">'
  + '<div><span class="cav-eb reveal"><i></i>CarAdvance AI</span>'
  + '<h2 class="cav-h reveal">Mondd el, mit szeretnél. <em>Mi megtaláljuk.</em></h2>'
  + '<p class="cav-p reveal">Nem kell szűrőkkel bajlódnod: írd le a saját szavaiddal, milyen autót keresel, és az asszisztensünk másodpercek alatt kiválasztja a hozzád illőket a kínálatunkból.</p>'
  + '<div class="cav-chips reveal"><span class="cav-chip" data-q="Családi autót keresek, ami tágas és prémium">„Tágas családi autó”</span><span class="cav-chip" data-q="Sportos autót keresek 25 millió forintig">„Sportos, 25 millióig”</span><span class="cav-chip" data-q="Elektromos vagy hibrid autót bérelnék">„Hibrid bérlésre”</span></div>'
  + '<button type="button" class="cav-btn reveal" data-cav-chat>Kipróbálom az AI keresőt →</button></div>'
  + '<div class="cav-screen reveal"><video muted loop playsinline preload="none" poster="/video/ai-kereso.webp" data-cav-src="/video/ai-kereso.mp4" aria-label="Bemutató: az AI autókereső működés közben"></video></div>'
  + '</div></div></section>';

const FILM = '<div class="cav-film-wrap reveal" data-dm-skip><div class="cav-film" role="button" tabindex="0" aria-label="Lejátszás: így rendelhetsz autót Németországból (1 perc)" data-cav-film>'
  + '<video muted loop playsinline preload="none" poster="/video/rendeles.webp" data-cav-src="/video/rendeles-teaser.mp4" aria-hidden="true"></video>'
  + '<div class="cav-ov"><div class="cav-ovt"><b>Autó Németországból, macera nélkül</b><span>Nézd meg 1 perc alatt, hogyan rendelhetsz nálunk — a kereséstől az átadásig.</span></div><span class="cav-len">▶ 1:11</span></div>'
  + '<span class="cav-play">' + PLAY + '</span></div></div>';

const JS = '<script id="ca-video-js">(function(){'
  + 'var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;'
  + 'var vs=[].slice.call(document.querySelectorAll("video[data-cav-src]"));'
  + 'function load(v){if(!v.src){v.src=v.getAttribute("data-cav-src")}}'
  + 'if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){load(v);if(!rm){var p=v.play();p&&p.catch&&p.catch(function(){})}}else if(!v.paused)v.pause()})},{rootMargin:"200px 0px",threshold:.25});vs.forEach(function(v){io.observe(v)})}'
  + 'else vs.forEach(load);'
  // AI chat megnyitása (a meglévő „Segítek” gomb)
  + 'function chat(q){var b=document.querySelector(".cac-launch");if(b)b.click();if(q)setTimeout(function(){var i=document.getElementById("cacIn");if(i){i.value=q;i.dispatchEvent(new Event("input",{bubbles:true}));i.focus()}},450)}'
  + 'document.addEventListener("click",function(e){var c=e.target.closest&&e.target.closest("[data-cav-chat],.cav-chip");if(c){chat(c.getAttribute("data-q")||"")}});'
  // teljes képernyős lejátszó
  + 'var lb;function film(){if(!lb){lb=document.createElement("div");lb.className="cav-lb";lb.setAttribute("role","dialog");lb.setAttribute("aria-label","Autórendelés bemutatófilm");'
  + 'lb.innerHTML=\'<button type="button" class="cav-x" aria-label="Bezárás">✕</button><video controls playsinline preload="metadata" poster="/video/rendeles.webp"></video><a class="cav-btn cav-cta" href="/egyedi-auto-rendeles/">Megkeresem az autómat →</a>\';document.body.appendChild(lb);'
  + 'var v=lb.querySelector("video");v.addEventListener("ended",function(){lb.classList.add("end")});v.addEventListener("play",function(){lb.classList.remove("end")});'
  + 'var close=function(){v.pause();lb.classList.remove("on","end");document.documentElement.style.overflow=""};lb.addEventListener("click",function(e){if(e.target===lb||e.target.closest(".cav-x"))close()});'
  + 'addEventListener("keydown",function(e){if(e.key==="Escape"&&lb.classList.contains("on"))close()})}'
  + 'var v=lb.querySelector("video");if(!v.src)v.src="/video/rendeles.mp4";lb.classList.add("on");document.documentElement.style.overflow="hidden";v.currentTime=0;var p=v.play();p&&p.catch&&p.catch(function(){})}'
  + 'document.addEventListener("click",function(e){if(e.target.closest&&e.target.closest("[data-cav-film]"))film()});'
  + 'document.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("[data-cav-film]")){e.preventDefault();film()}});'
  + '})();</script>';

try {
  if (!fs.existsSync(FILE)) console.log('[home-videos] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-video-js"') > -1) console.log('[home-videos] már alkalmazva');
    else {
      let n = 0;
      // 1) AI kereső a Kínálat után
      const a = h.indexOf('id="autoink"');
      if (a > -1) {
        const end = h.indexOf('</section>', a);
        if (end > -1) { h = h.slice(0, end + 10) + AI + h.slice(end + 10); n++; }
      }
      // 2) autórendelés film az „Így dolgozunk” címsor után, a lépések elé
      const m = h.indexOf('<section class="block" id="miert"');
      if (m > -1) {
        const t = h.indexOf('</h2>', m);
        if (t > -1) { h = h.slice(0, t + 5) + FILM + h.slice(t + 5); n++; }
      }
      h = h.replace('</head>', CSS + '</head>').replace(/<\/body>/i, JS + '</body>');
      fs.writeFileSync(FILE, h);
      console.log('[home-videos] ' + n + ' videóblokk a főoldalon');
    }
  }
} catch (e) { console.log('[home-videos] hiba:', e.message); }
