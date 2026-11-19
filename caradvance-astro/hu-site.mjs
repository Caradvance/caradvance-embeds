// Build lépés: a magyar (lang="hu") ALOLDALAK a főoldal stílusában — a főoldal (index.html) és a belső oldalak kivételével.
//  - téma a készülék szerint (világos / sötét / automatikus), mint a főoldalon; sötétben a dark-mode.js színez
//  - a főoldal háttere (#F6F6F3 / #0D0F13) és halk színes fények az oldal mögött
//  - a kártyák „liquid glass” üvegkártyák lesznek (világosban és sötétben is), a teljes szélességű sávok átlátszók
//  - a hero sáv teljes szélességű, lekerekítés nélkül, és lágyan olvad az oldal hátterébe
// A tartalom, a szövegek és a funkciók nem változnak. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SKIP = /^(index\.html$|admin\/|belso\/|fiok\/|szerzodes\/|alairas\/|adatok\/|ajanlat\/|icons\/|teszt-mega-menu\/|_ttest)/;

const BG_L = '#F5F5F7', BG_D = '#0D0F13';
const HERO = 'section.hero,.cd-hero,.egl-land-hero,.egl-mhero,.kaphero,.bp-hero,.lg-hero';
const cutList = () => { for (const d of [path.join(DIST, 'berles-cut'), path.join('public', 'berles-cut')]) if (fs.existsSync(d)) return fs.readdirSync(d).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)); return []; };
const BC = cutList();

const DECIDE = '<script id="ca-site-theme">(function(){var mq=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null,t=mq&&mq.matches?"dark":"light",q=null;'
  + 'try{localStorage.removeItem("ca-tema");q=location.search.match(/[?&]tema=(sotet|feher)/);if(q)t=q[1]==="sotet"?"dark":"light"}catch(e){}'
  + 'var d=document.documentElement;d.classList.add("ca-site");if(t==="dark"){window.__CA_FORCE_DARK=1;d.classList.add("ca-dark")}else d.classList.add("ca-light");window.__caTheme=t;'
  + 'try{var y=sessionStorage.getItem("ca-theme-y");if(y){sessionStorage.removeItem("ca-theme-y");addEventListener("load",function(){setTimeout(function(){scrollTo(0,+y)},60)})}}catch(e){}'
  + 'if(mq&&!q){var f=function(e){if((e.matches?"dark":"light")!==t){try{sessionStorage.setItem("ca-theme-y",String(scrollY))}catch(x){}location.reload()}};mq.addEventListener?mq.addEventListener("change",f):mq.addListener&&mq.addListener(f)}})();</script>';

const GL_L = 'background:linear-gradient(125deg,rgba(255,255,255,.72) 0%,rgba(255,255,255,.34) 34%,rgba(255,255,255,.2) 55%,rgba(255,255,255,.4) 100%)!important;background-color:transparent!important;border:1.5px solid rgba(255,255,255,.9)!important;'
  + 'box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 22px 54px rgba(18,19,23,.10)!important;'
  + '-webkit-backdrop-filter:blur(24px) saturate(200%);backdrop-filter:blur(24px) saturate(200%)';
const GL_D = 'background:linear-gradient(180deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,.04) 18%,rgba(255,255,255,0) 42%),radial-gradient(130% 90% at 0% 0%,rgba(255,255,255,.10),transparent 50%),rgba(255,255,255,.05)!important;background-color:transparent!important;'
  + 'border:1px solid rgba(255,255,255,.09)!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.28),inset -1px -1px 1px rgba(255,255,255,.08),0 26px 60px rgba(0,0,0,.5),0 4px 14px rgba(0,0,0,.3)!important;'
  + '-webkit-backdrop-filter:blur(14px) saturate(180%);backdrop-filter:blur(14px) saturate(180%)';

const L = 'html.ca-site.ca-light ', D = 'html.ca-site.ca-dark ';
const CSS = '<style id="ca-site-css">'
  // sötétben a lábléc se éles vonallal kezdődjön, hanem puhán fakuljon be
  + 'html.ca-dark body footer.cafoot{border-top-color:transparent!important;box-shadow:none!important;background:linear-gradient(180deg,rgba(11,11,13,0) 0,#0B0B0D 140px)!important;background-color:transparent!important}'
  // Görgess mindig a képernyő alján, mint a főoldalon: a Görgess-gombos fejléc kitölti a képernyőt (asztali/tablet)
  + '@media(min-width:641px){html:root body :is(section,div).ca-hero:has(.scrolldown,.bizhero-scroll,.egl-mhero-scroll){min-height:100vh!important;min-height:100svh!important;height:auto!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:center!important}'
  + 'html:root body :is(section,div).ca-hero :is(.scrolldown,.bizhero-scroll,.egl-mhero-scroll){position:absolute!important;top:auto!important;bottom:28px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;margin:0!important}}'
  // háttér és fények
  + L + '{background:' + BG_L + '!important}' + L + 'body{background:transparent!important}'
  + D + '{background:' + BG_D + '!important}' + D + 'body{background:transparent!important;background-color:transparent!important}'
  + L + '#ca-orbs{display:none!important}'
  + '#ca-orbs{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}'
  + '#ca-orbs i{position:absolute;border-radius:50%;filter:blur(90px)}'
  + L + '#ca-orbs i:nth-child(1){left:-12%;top:8%;width:46vw;height:46vw;background:rgba(170,180,200,.22)}'
  + L + '#ca-orbs i:nth-child(2){right:-10%;top:30%;width:40vw;height:40vw;background:rgba(160,180,225,.18)}'
  + L + '#ca-orbs i:nth-child(3){left:24%;bottom:-18%;width:44vw;height:44vw;background:rgba(205,210,220,.22)}'
  + D + '#ca-orbs i:nth-child(1){left:-14%;top:12%;width:44vw;height:44vw;background:rgba(226,0,26,.16)}'
  + D + '#ca-orbs i:nth-child(2){right:-12%;top:40%;width:38vw;height:38vw;background:rgba(226,0,26,.10)}'
  + D + '#ca-orbs i:nth-child(3){left:30%;bottom:-20%;width:40vw;height:40vw;background:rgba(120,140,255,.06)}'
  // átlátszó sávok és üvegkártyák
  + 'html.ca-site body .ca-tr{background-color:transparent!important;background-image:none!important}'
  + L + 'body .ca-gl{' + GL_L + '}'
  + D + 'body .ca-gl{' + GL_D + '}'
  + L + 'body .ca-gl2{background:rgba(255,255,255,.55)!important;background-color:rgba(255,255,255,.55)!important;border-color:rgba(18,19,23,.07)!important;box-shadow:none!important}'
  + D + 'body .ca-gl2{background:rgba(255,255,255,.04)!important;background-color:rgba(255,255,255,.04)!important;border-color:rgba(255,255,255,.08)!important;box-shadow:none!important}'
  + 'html.ca-site body .ca-gl:is(a,button):hover,html.ca-site body a .ca-gl:hover{transform:translateY(-2px);transition:transform .25s ease,box-shadow .25s ease}'
  // hero: teljes szélesség, lekerekítés nélkül, lágy átmenet az oldal hátterébe
  + 'html.ca-site body{overflow-x:clip}html.ca-site body .ca-hero{width:100vw!important;max-width:none!important;margin-left:calc(50% - 50vw)!important;margin-right:0!important;border-radius:0!important}'
  + 'html.ca-site body .kaphero.ca-hero{padding-top:calc(var(--navh,80px) + 10px)!important}'
  + 'html.ca-site body .ca-cut{background:transparent!important;object-fit:contain!important;filter:drop-shadow(0 18px 18px rgba(0,0,0,.28))}'
  + 'html.ca-site body .ca-hero>.ca-hfade{position:absolute;left:0;right:0;bottom:-1px;height:200px;pointer-events:none;z-index:1}'
  + L + 'body .ca-hero>.ca-hfade{background:linear-gradient(180deg,rgba(245,245,247,0) 0%,rgba(245,245,247,.55) 55%,rgba(245,245,247,.9) 82%,' + BG_L + ' 100%)}'
  + D + 'body .ca-hero>.ca-hfade{background:linear-gradient(180deg,rgba(13,15,19,0) 0%,rgba(13,15,19,.55) 50%,rgba(13,15,19,.9) 80%,' + BG_D + ' 100%)}'
  // sötétben a hero ne tömör színbe fusson ki (éles határ a ragyogó háttér előtt): a videó alja átlátszóba fakul
  + D + 'body section.ca-hero{background:transparent!important;background-image:none!important}'
  + D + 'body .ca-hero>.ca-hfade{display:none!important}'
  + D + 'body .ca-hero>:is(video,img,picture){-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 55%,rgba(0,0,0,.55) 78%,transparent 100%);mask-image:linear-gradient(180deg,#000 0%,#000 55%,rgba(0,0,0,.55) 78%,transparent 100%)}'
  + 'html.ca-site body .ca-hero>:not(.ca-hfade):not(video):not(img):not(picture){position:relative;z-index:2}'
  + '@media(prefers-reduced-motion:reduce){html.ca-site body .ca-gl{transition:none!important;transform:none!important}}'
  + '</style>';

const JS = '<script id="ca-site-js">(function(){var BC=' + JSON.stringify(BC) + ';'
  + 'var HERO=' + JSON.stringify(HERO) + ',EX=".ca-navwrap,.mm-panel,.mobilepanel,footer,.cafoot,.cac,.cacb,[role=dialog],dialog,table,form .ca-gl,input,select,textarea,video,img,svg,picture,canvas,iframe";'
  // az oldal eredeti (világos) színei alapján döntünk, még mielőtt a dark-mode.js átszínez
  + 'function rgb(s){var m=String(s).match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?/);return m?[+m[1],+m[2],+m[3],m[4]==null?1:+m[4]]:null}'
  + 'function light(c){return c&&c[3]>.6&&c[0]>=228&&c[1]>=228&&c[2]>=228}'
  + 'function run(){var root=document.body,W=document.documentElement.clientWidth,heroes=[].slice.call(document.querySelectorAll(HERO));'
  + 'if(!heroes.length){var mm=document.querySelector("main")||document.body;[].some.call(mm.querySelectorAll("section,div"),function(e){if(e.closest(".ca-navwrap,.cac,.cacb"))return false;var r=e.getBoundingClientRect(),c=getComputedStyle(e);if(r.top+scrollY>230)return true;if(r.height>300&&r.width>W*.6&&parseFloat(c.borderTopLeftRadius)>=14&&(e.querySelector("video")||/url\\(|gradient/.test(c.backgroundImage))){heroes=[e];return true}return false})}'
  + 'heroes.forEach(function(h){if(h.closest(".ca-navwrap")||h.classList.contains("ca-hero"))return;var r=h.getBoundingClientRect();if(r.top+scrollY>230||r.height<160)return;var c=getComputedStyle(h),top=r.top+scrollY;h.classList.add("ca-hero");if(top>0){h.style.setProperty("margin-top",(parseFloat(c.marginTop)-top)+"px","important");h.style.setProperty("padding-top",(parseFloat(c.paddingTop)+top)+"px","important")}if(getComputedStyle(h).position==="static")h.style.position="relative";if(!h.querySelector(":scope>.ca-hfade")){var f=document.createElement("i");f.className="ca-hfade";f.setAttribute("aria-hidden","true");h.appendChild(f)}});'
  + 'var all=root.querySelectorAll("main *,body>section,body>section *,body>div.wrap,body>div.wrap *,body>.cd,body>.cd *,body>.kap,body>.kap *");'
  + 'for(var i=0;i<all.length;i++){var e=all[i];if(e.closest(EX)||e.closest(".ca-hero"))continue;var c=getComputedStyle(e);if(c.position==="fixed")continue;var bg=rgb(c.backgroundColor);if(!light(bg)&&!/(^| )dm-(s|s2|g)( |$)/.test(e.className))continue;if(e.classList.contains("ca-gl")||e.classList.contains("ca-gl2")||e.classList.contains("ca-tr"))continue;'
  + 'if(c.backgroundImage&&/url\\(/.test(c.backgroundImage))continue;var r=e.getBoundingClientRect();if(r.width<60||r.height<36)continue;'
  + 'var rad=parseFloat(c.borderTopLeftRadius)||0;'
  + 'if(r.width>=W*.94||rad<6){e.classList.add("ca-tr");continue}'
  + 'if(/^(A|BUTTON|LABEL|SPAN|LI)$/.test(e.tagName)&&r.height<70){continue}'
  + 'e.classList.add(e.parentElement&&e.parentElement.closest(".ca-gl")?"ca-gl2":"ca-gl")}'
  + '[].forEach.call(document.querySelectorAll(".cd-photo img,.cd-hero-car img,.cd-intro img,.cd-stage img"),function(im){var m=(im.getAttribute("src")||"").match(/\\/berles(?:-press)?\\/([^\\/?#]+)\\.webp/),k=m&&m[1];while(k&&BC.indexOf(k)<0&&k.indexOf("-")>0)k=k.replace(/-[^-]*$/,"");if(m&&BC.indexOf(k)>-1&&!im.__cut){im.__cut=1;im.src="/berles-cut/"+k+".webp";im.classList.add("ca-cut");var pb=im.parentElement;if(pb)pb.classList.add("ca-tr")}});'
  + 'if(!document.getElementById("ca-orbs")){var o=document.createElement("div");o.id="ca-orbs";o.setAttribute("aria-hidden","true");o.innerHTML="<i></i><i></i><i></i>";document.body.insertBefore(o,document.body.firstChild)}'
  + 'if(window.__caTheme==="dark"&&!window.__caDM){var s=document.createElement("script");s.src="/dark-mode.js";document.head.appendChild(s)}}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();'
  // később betöltődő tartalom (pl. autólisták) — újraosztályozás
  + 'var t=0;addEventListener("load",function(){setTimeout(run,300);new MutationObserver(function(){clearTimeout(t);t=setTimeout(run,250)}).observe(document.body,{childList:true,subtree:true})});'
  + '})();</script>';

export function apply(h) {
  if (!/<html[^>]*\slang="hu"/.test(h) || h.indexOf('id="ca-site-theme"') > -1 || h.indexOf('id="ca-theme"') > -1) return null;
  h = h.replace(/<head([^>]*)>/i, (m) => m + DECIDE);
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace('</body>', () => JS + '</body>');
  return h;
}

function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out); else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('hu-site.mjs')) {
  try {
    if (!fs.existsSync(DIST)) console.log('[hu-site] nincs dist — kihagyva');
    else {
      let n = 0;
      for (const f of walk(DIST, [])) {
        const rel = path.relative(DIST, f).split(path.sep).join('/');
        if (SKIP.test(rel)) continue;
        const h = apply(fs.readFileSync(f, 'utf8'));
        if (h) { fs.writeFileSync(f, h); n++; }
      }
      console.log('[hu-site] magyar aloldalak a főoldal stílusában: ' + n + ' oldal');
    }
  } catch (e) { console.log('[hu-site] hiba:', e.message); }
}
