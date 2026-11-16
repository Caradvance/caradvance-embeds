// Build lépés (a home-dark.mjs ÉS a home-light.mjs után fut): a magyar főoldalon választható a sötét és a fehér téma.
// A két külön témaváltó szkriptet egyetlen döntő szkriptre cseréli (localStorage „ca-theme”: "dark" | "light",
// alapból fehér), és egy kis lebegő kapcsolót tesz az oldal bal alsó sarkába. Váltáskor az oldal újratölt,
// és ugyanott marad, ahol a látogató volt. Idempotens.
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
      const decide = '<script id="ca-theme">(function(){var t="' + DEFAULT + '";try{var q=location.search.match(/[?&]tema=(sotet|feher)/);if(q){t=q[1]==="sotet"?"dark":"light";localStorage.setItem("ca-theme",t)}else t=localStorage.getItem("ca-theme")||t}catch(e){}'
        + 'var d=document.documentElement;if(t==="dark"){window.__CA_FORCE_DARK=1;d.classList.add("ca-dark");document.addEventListener("DOMContentLoaded",function(){var s=document.createElement("script");s.src="' + dmSrc + '";document.head.appendChild(s)})}else d.classList.add("ca-light");'
        + 'window.__caTheme=t;try{var y=sessionStorage.getItem("ca-theme-y");if(y){sessionStorage.removeItem("ca-theme-y");addEventListener("load",function(){setTimeout(function(){scrollTo(0,+y)},60)})}}catch(e){}})();</script>';
      h = h.replace(/<head([^>]*)>/i, (m) => m + decide);
      const sw = '<style id="ca-theme-css">.ca-tsw{position:fixed;left:18px;bottom:18px;z-index:2147482000;display:inline-flex;gap:2px;padding:4px;border-radius:999px;font:600 13px/1 inherit;'
        + 'background:rgba(20,21,26,.72);border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 30px rgba(0,0,0,.25)}'
        + '.ca-tsw button{border:0;cursor:pointer;font:inherit;padding:9px 14px;border-radius:999px;color:rgba(255,255,255,.75);background:transparent}'
        + '.ca-tsw button.on{background:#fff;color:#121317}'
        + 'html.ca-light .ca-tsw{background:rgba(255,255,255,.75);border-color:rgba(18,19,23,.1)}html.ca-light .ca-tsw button{color:#5E616A}html.ca-light .ca-tsw button.on{background:#121317;color:#fff}'
        + '@media(max-width:600px){.ca-tsw{left:12px;bottom:12px}.ca-tsw button{padding:8px 11px}}</style>';
      const swJs = '<script id="ca-theme-js">(function(){var b=document.createElement("div");b.className="ca-tsw";b.setAttribute("data-dm-skip","");b.setAttribute("role","group");b.setAttribute("aria-label","Téma");'
        + 'b.innerHTML=\'<button type="button" data-t="light">☀ Fehér</button><button type="button" data-t="dark">☾ Sötét</button>\';'
        + '[].forEach.call(b.children,function(x){x.classList.toggle("on",x.getAttribute("data-t")===window.__caTheme);x.onclick=function(){var t=x.getAttribute("data-t");if(t===window.__caTheme)return;try{localStorage.setItem("ca-theme",t);sessionStorage.setItem("ca-theme-y",String(scrollY))}catch(e){}'
        + 'var u=new URL(location.href);u.searchParams.delete("tema");location.replace(u.toString())}});document.body.appendChild(b)})();</script>';
      h = h.replace('</head>', sw + '</head>').replace(/<\/body>/i, swJs + '</body>');
      fs.writeFileSync(FILE, h);
      console.log('[home-theme] téma-kapcsoló (alapból: ' + DEFAULT + ')');
    }
  }
} catch (e) { console.log('[home-theme] hiba:', e.message); }
