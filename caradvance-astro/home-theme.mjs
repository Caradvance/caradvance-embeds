// Build lépés (a home-dark.mjs ÉS a home-light.mjs után fut): a magyar főoldalon választható a sötét és a fehér téma.
// A két témaváltó szkriptet egyetlen döntő szkriptre cseréli: a téma a készülék beállítását követi
// (prefers-color-scheme; automatikus módban nappal fehér, este sötét). Ha a készülék közben vált, az oldal
// átvált és ugyanott marad. Teszteléshez: ?tema=feher / ?tema=sotet. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');
const DEFAULT = 'light';

try {
  if (!fs.existsSync(FILE)) console.log('[home-theme] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-theme"') > -1) console.log('[home-theme] már alkalmazva');
    else {
      const dm = h.match(/<script src="(\/dark-mode\.js\?v=[^"]+)" defer><\/script>/);
      const dmSrc = dm ? dm[1] : '/dark-mode.js';
      if (dm) h = h.replace(dm[0], '');
      h = h.replace(/<script id="ca-home-dark">[\s\S]*?<\/script>/, '');
      h = h.replace(/<script id="ca-home-light">[\s\S]*?<\/script>/, '');
      const decide = '<script id="ca-theme">(function(){var mq=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null,t=mq&&mq.matches?"dark":"light";'
        + 'var q=null;try{var qa=location.search.match(/[?&]tema=(sotet|feher|auto)/);if(qa&&qa[1]==="auto")localStorage.removeItem("ca-tema");else if(qa)localStorage.setItem("ca-tema",qa[1]);var v=localStorage.getItem("ca-tema");if(v){q=[0,v];t=v==="sotet"?"dark":"light"}}catch(e){}'
        + 'var d=document.documentElement;if(t==="dark"){window.__CA_FORCE_DARK=1;d.classList.add("ca-dark");document.addEventListener("DOMContentLoaded",function(){try{document.querySelectorAll(\'.stats img[src*="brand-bmw"]\').forEach(function(i){i.dataset.dm="keep"})}catch(e){}var s=document.createElement("script");s.src="' + dmSrc + '";document.head.appendChild(s)})}else d.classList.add("ca-light");'
        + 'window.__caTheme=t;try{var y=sessionStorage.getItem("ca-theme-y");if(y){sessionStorage.removeItem("ca-theme-y");addEventListener("load",function(){setTimeout(function(){scrollTo(0,+y)},60)})}}catch(e){}'
        // ha a készülék közben vált (pl. automatikus mód este), az oldal átvált, és ugyanott marad
        + 'if(mq&&!q){var f=function(e){if((e.matches?"dark":"light")!==t){try{sessionStorage.setItem("ca-theme-y",String(scrollY))}catch(x){}location.reload()}};mq.addEventListener?mq.addEventListener("change",f):mq.addListener&&mq.addListener(f)}})();</script>';
      h = h.replace(/<head([^>]*)>/i, (m) => m + decide);
      const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
      const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/></svg>';
      const sw = '<style id="ca-theme-css">'
        + '.ca-tsw{position:relative;flex:0 0 auto;width:26px;height:46px;padding:0;margin:0 6px 0 2px;border-radius:999px;cursor:pointer;align-self:center;'
        + 'background:linear-gradient(180deg,#ececE9,#dcdcd8);border:1px solid rgba(18,19,23,.14);box-shadow:inset 0 1px 3px rgba(18,19,23,.18);transition:background .3s,border-color .3s}'
        + '.ca-tsw i{position:absolute;left:2px;top:2px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
        + 'background:radial-gradient(circle at 35% 30%,#3a3c42,#0d0e11);box-shadow:0 2px 5px rgba(0,0,0,.35);transition:top .3s cubic-bezier(.2,.8,.2,1),background .3s}'
        + '.ca-tsw svg{width:12px;height:12px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round}.ca-tsw .mo{display:none}.ca-tsw .mo svg{fill:#121317;stroke:none}'
        + 'html.ca-dark .ca-tsw{background:linear-gradient(180deg,#0a0b0e,#1c1d22);border-color:rgba(255,255,255,.2);box-shadow:inset 0 1px 3px rgba(0,0,0,.6)}'
        + 'html.ca-dark .ca-tsw i{top:22px;background:radial-gradient(circle at 35% 30%,#fff,#d9d9d6)}html.ca-dark .ca-tsw .su{display:none}html.ca-dark .ca-tsw .mo{display:flex}'
        + '.ca-tsw.go i{top:22px}html.ca-dark .ca-tsw.go i{top:2px}'
        + '.ca-tsw:focus-visible{outline:2px solid #E2001A;outline-offset:2px}'
        + '@media(max-width:820px){.ca-tsw{width:22px;height:40px;margin:0 2px}.ca-tsw i{width:16px;height:16px}html.ca-dark .ca-tsw i,.ca-tsw.go i{top:20px}html.ca-dark .ca-tsw.go i{top:2px}.ca-tsw svg{width:10px;height:10px}}'
        + '</style>';
      const swJs = '<script id="ca-theme-js">(function(){function put(){var r=document.querySelector(".ca-nav .navright");if(!r)return setTimeout(put,200);if(r.querySelector(".ca-tsw"))return;'
        + 'var b=document.createElement("button");b.type="button";b.className="ca-tsw";b.setAttribute("data-dm-skip","");var dk=window.__caTheme==="dark";b.setAttribute("aria-label",dk?"Váltás világos módra":"Váltás sötét módra");b.title=dk?"Világos mód":"Sötét mód";'
        + 'b.innerHTML=\'<i><span class="su">' + SUN + '</span><span class="mo">' + MOON + '</span></i>\';'
        + 'b.onclick=function(){var t=dk?"light":"dark";b.classList.add("go");try{localStorage.setItem("ca-theme",t);sessionStorage.setItem("ca-theme-y",String(scrollY))}catch(e){}'
        + 'setTimeout(function(){var u=new URL(location.href);u.searchParams.delete("tema");location.replace(u.toString())},280)};r.insertBefore(b,r.firstChild)}'
        + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",put);else put()})();</script>';
      fs.writeFileSync(FILE, h);
      console.log('[home-theme] a téma a készülék beállítását követi (világos/sötét/automatikus)');
    }
  }
} catch (e) { console.log('[home-theme] hiba:', e.message); }
