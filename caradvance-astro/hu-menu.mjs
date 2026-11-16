// Build lépés: Apple-letisztultságú asztali mega menü — CSAK a magyar (lang="hu") oldalakon.
// A közös mega-menu.js nem változik: a lenyíló panel tartalmát a magyar oldalakon egy saját, szöveges
// szerkezet váltja (képek és autók nélkül). Minden menü három oszlop:
//   1. a legfontosabb oldalak nagy, félkövér betűvel
//   2. tudnivalók kisebb betűvel
//   3. gyors elérés (márkák, kalkulátorok, közösségi oldalak)
// A márkák listája és a darabszámok a mega-menu.js saját (rejtett) adataiból jönnek, így mindig naprakészek.
// A panelt a dark-mode.js nem színezi (data-dm-skip); világos és sötét témában is saját színeket kap. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SKIP = /(^|\/)(belso|admin|ajanlat|alairas|adatok|partner|_ttest|teszt-mega-menu|api)(\/|$)/;

// [oszlopcím, [[felirat, link], ...]] — a 3. oszlopban a 'BRANDS' / 'NEWBRANDS' a mega menü márkáiból töltődik
const MENUS = [
  [ // Tartós bérlet
    ['Tartós bérlet', [['Bérelhető autóink', '/autoink/#berelheto', 'rent'], ['Mi a tartós bérlet?', '/tartos-berlet/'], ['Autók összehasonlítása', '/auto-osszehasonlitas/']]],
    ['Tudnivalók', [['Bérlési folyamat', '/berlesi-folyamat/'], ['Feltételek és kaució', '/berlesi-feltetelek/'], ['Előnyök', '/berles-elonyei/'], ['Gyakori kérdések', '/berles-gyakori-kerdesek/']]],
    ['Márkák', 'BRANDS'],
  ],
  [ // Megvásárolható autóink
    ['Vásárlás', [['Eladó autóink', '/autoink/', 'sale'], ['Egyedi autó rendelés', '/egyedi-auto-rendeles/'], ['Finanszírozás – lízing', '/finanszirozas-lizing/']]],
    ['Tudnivalók', [['Operatív lízing', '/operativ-lizing/'], ['Előnyök', '/vasarlas-elonyei/'], ['Gyakori kérdések', '/vasarlas-gyakori-kerdesek/']]],
    ['Új autó rendelése', 'NEWBRANDS'],
  ],
  [ // Bizományos értékesítés
    ['Eladás', [['Eladom az autómat', '/eladom/'], ['Bizományos autóink', '/bizomanyos/', 'biz']]],
    ['Tudnivalók', [['Értékesítési folyamat', '/ertekesitesi-folyamat/'], ['Gyakori kérdések', '/gyakori-kerdesek/']]],
    ['Jótékonyság', [['Minden eladás után adományozunk', '/jotekonysag/'], ['Akiket támogatunk', '/jotekonysag/']]],
  ],
  [ // Import
    ['Autóimport', [['Autó rendelés', '/auto-rendeles/'], ['Egyedül vagy velünk?', '/egyedul-vagy-velunk/']]],
    ['Tudnivalók', [['Beszerzési folyamat', '/beszerzesi-folyamat/'], ['Előnyök', '/elonyok/'], ['Referenciák', '/referenciak/']]],
    ['Kalkulátorok', [['Honosítás kalkulátor', '/honositas-kalkulator/'], ['Átírás kalkulátor', '/atiras-kalkulator/'], ['Lízing kalkulátor', '/finanszirozas-lizing/']]],
  ],
  [ // Rólunk
    ['CarAdvance', [['Miért mi?', '/miert-mi/'], ['Referenciák', '/referenciak/'], ['Kapcsolat', '/kapcsolat/']]],
    ['Bizalom', [['Átláthatóság', '/atlathatosag/'], ['Minőségbiztosítás', '/minosegbiztositas/'], ['Media', '/media/'], ['Blog', '/blog/']]],
    ['Kövess minket', [['Facebook', 'https://www.facebook.com/caradvancehungary/'], ['Instagram', 'https://www.instagram.com/caradvance_hungary/'], ['YouTube', 'https://www.youtube.com/channel/UCbmogjjIDqVwFtFoA-h3jjw'], ['TikTok', 'https://www.tiktok.com/search?q=caradvance'], ['LinkedIn', 'https://www.linkedin.com/search/results/companies/?keywords=caradvance']]],
  ],
];

const P = 'html[lang="hu"] .ca-navwrap .mm-panel';
const CSS = '<style id="ca-mm-hu">'
  + P + '{--am-bg:rgba(255,255,255,.97);--am-ink:#1D1D1F;--am-mut:#86868B;--am-sub:#424245;--am-line:rgba(0,0,0,.08)}'
  + 'html.ca-dark[lang="hu"] .ca-navwrap .mm-panel{--am-bg:rgba(22,22,24,.97);--am-ink:#F5F5F7;--am-mut:#86868B;--am-sub:#D2D2D7;--am-line:rgba(255,255,255,.1)}'
  + P + '.ca-am-on{background:var(--am-bg)!important;color:var(--am-ink)!important;border:1px solid var(--am-line)!important;border-radius:22px!important;box-shadow:0 30px 70px rgba(0,0,0,.16)!important;-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);overflow:hidden}'
  + 'html.ca-dark[lang="hu"] .ca-navwrap .mm-panel.ca-am-on{box-shadow:0 30px 80px rgba(0,0,0,.6)!important}'
  + P + '.ca-am-on>:not(.ca-am){display:none!important}'
  + '.ca-am{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) minmax(0,1.15fr);gap:0 56px;padding:38px 56px 44px;max-width:1080px;font-family:inherit;-webkit-font-smoothing:antialiased}'
  + '.ca-am .am-col{min-width:0;opacity:0;transform:translateY(-4px);animation:caAmIn .32s cubic-bezier(.2,.7,.2,1) forwards}'
  + '.ca-am .am-col:nth-child(2){animation-delay:.04s}.ca-am .am-col:nth-child(3){animation-delay:.08s}'
  + '@keyframes caAmIn{to{opacity:1;transform:none}}'
  + '.ca-am .am-h{font-size:12px;font-weight:500;letter-spacing:0;color:var(--am-mut);margin:0 0 14px}'
  + '.ca-am ul{list-style:none;margin:0;padding:0}'
  + '.ca-am a{color:var(--am-ink);text-decoration:none;transition:color .15s}'
  + '.ca-am a:hover,.ca-am a:focus-visible{color:#E2001A;outline:none}'
  + '.ca-am .am-big li{margin:0 0 10px}'
  + '.ca-am .am-big a{display:inline-flex;align-items:baseline;gap:10px;font-size:24px;font-weight:600;letter-spacing:-.015em;line-height:1.2}'
  + '.ca-am .am-big a small{font-size:13px;font-weight:500;letter-spacing:0;color:var(--am-mut)}'
  + '.ca-am .am-sm li{margin:0 0 9px}'
  + '.ca-am .am-sm a{font-size:14px;font-weight:600;color:var(--am-sub);line-height:1.35}'
  + '.ca-am .am-sm a:hover{color:#E2001A}'
  + '.ca-am .am-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px}'
  + '.ca-am .am-all a{color:var(--am-ink)}'
  + '</style>';

const JS = '<script id="ca-mm-hu-js">(function(){'
  + 'var M=' + JSON.stringify(MENUS) + ';'
  + 'function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}'
  + 'function li(t,h,x){var ext=/^https?:/.test(h);return "<li><a href=\\""+esc(h)+"\\""+(ext?" target=\\"_blank\\" rel=\\"noopener\\"":"")+">"+esc(t)+(x?" <small>"+esc(x)+"</small>":"")+"</a></li>"}'
  // a mega menü saját (rejtett) adatai: márkák és darabszámok
  + 'function brands(p){var o=[];[].forEach.call(p.querySelectorAll(".mm-brands .mm-b"),function(a){var t=(a.textContent||"").trim();if(t&&!a.classList.contains("mm-ball"))o.push([t,a.getAttribute("href")])});return o}'
  + 'function count(p,re){var n="";[].forEach.call(p.querySelectorAll(".mm-more"),function(a){var t=a.textContent||"";if(re.test(t)){var m=t.match(/\\((\\d+)\\)/);if(m)n=m[1]}});return n}'
  + 'var cache={};'
  + 'function build(p,i){var C=M[i];if(!C)return null;var bs=brands(p);if(bs.length)cache["b"+i]=bs;bs=cache["b"+i]||[];'
  + 'var cn={rent:count(p,/bérelhető/i),sale:count(p,/eladó/i),biz:count(p,/bizományos/i)};["rent","sale","biz"].forEach(function(k){if(cn[k])cache[k]=cn[k];else cn[k]=cache[k]||""});'
  + 'var h="";C.forEach(function(col,k){var L=col[1],big=k===0,cls=big?"am-big":"am-sm";'
  + 'if(L==="BRANDS"||L==="NEWBRANDS"){h+="<div class=\\"am-col\\"><p class=\\"am-h\\">"+esc(col[0])+"</p><ul class=\\"am-sm"+(bs.length>6?" am-two":"")+"\\">"+bs.map(function(b){return li(b[0],b[1])}).join("")+"</ul></div>";return}'
  + 'h+="<div class=\\"am-col\\"><p class=\\"am-h\\">"+esc(col[0])+"</p><ul class=\\""+cls+"\\">"+L.map(function(x){return li(x[0],x[1],big&&x[2]&&cn[x[2]]?cn[x[2]]+" autó":"")}).join("")+"</ul></div>"});'
  + 'var d=document.createElement("div");d.className="ca-am";d.setAttribute("data-i",i);d.innerHTML=h;return d}'
  // a dark-mode.js ne színezze a panelt
  + 'function clean(p){if(!p.hasAttribute("data-dm-skip"))p.setAttribute("data-dm-skip","");[p].forEach(function(e){if(e.hasAttribute("data-dmbg")){var b=e.getAttribute("data-dmbg");e.style.removeProperty("background-color");if(b)e.style.setProperty("background-color",b);e.removeAttribute("data-dmbg")}[].slice.call(e.classList).forEach(function(c){if(/^dm-/.test(c))e.classList.remove(c)})})}'
  + 'function sync(){var p=document.querySelector(".ca-navwrap .mm-panel");if(!p)return;clean(p);var its=[].slice.call(document.querySelectorAll(".ca-nav .menu .navitem")),act=document.querySelector(".ca-nav .menu .navitem.mm-act"),i=its.indexOf(act);if(i<0)return;'
  + 'var sg=i+"|"+brands(p).length+"|"+count(p,/bérelhető/i)+count(p,/eladó/i)+count(p,/bizományos/i),cur=p.querySelector(":scope>.ca-am");if(cur&&cur.__sg===sg)return;if(cur&&+cur.getAttribute("data-i")===i&&cur.__sg&&sg.split("|")[1]==="0")return;var d=build(p,i);if(!d)return;d.__sg=sg;if(cur){cur.remove();if(+cur.getAttribute("data-i")===i)[].forEach.call(d.querySelectorAll(".am-col"),function(c){c.style.animation="none";c.style.opacity=1;c.style.transform="none"})}p.appendChild(d);p.classList.add("ca-am-on")}'
  + 'function boot(){var w=document.querySelector(".ca-navwrap");if(!w)return;sync();var t=0;new MutationObserver(function(ms){for(var k=0;k<ms.length;k++){var tg=ms[k].target;if(tg.closest&&tg.closest(".ca-am"))continue;clearTimeout(t);t=setTimeout(sync,10);return}}).observe(w,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]})}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot()'
  + '})();</script>';

function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out); else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}

try {
  if (!fs.existsSync(DIST)) console.log('[hu-menu] nincs dist — kihagyva');
  else {
    let n = 0;
    for (const f of walk(DIST, [])) {
      const rel = path.relative(DIST, f).split(path.sep).join('/');
      if (SKIP.test(rel)) continue;
      let h = fs.readFileSync(f, 'utf8');
      if (!/<html[^>]*\slang="hu"/.test(h) || h.indexOf('class="ca-navwrap"') < 0 || h.indexOf('id="ca-mm-hu"') > -1) continue;
      h = h.replace('</head>', CSS + JS + '</head>');
      fs.writeFileSync(f, h); n++;
    }
    console.log('[hu-menu] Apple-letisztultságú mega menü: ' + n + ' magyar oldal');
  }
} catch (e) { console.log('[hu-menu] hiba:', e.message); }
