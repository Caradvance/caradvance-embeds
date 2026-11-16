// Build lépés: letisztult asztali mega menü — CSAK a magyar (lang="hu") oldalakon.
// A mega-menu.js (minden nyelv közös) nem változik; ez a lépés a magyar oldalak <head>-jébe tesz egy felülíró
// stílust és egy kis szkriptet:
//  - egységes, nyugodt panel (világos és sötét témában is), kevesebb keret és piros
//  - a dark-mode.js nem színezi át a panelt (data-dm-skip), a panel saját sötét dizájnt kap
//  - autóképek háttér nélkül: bérelhető → /berles-cut/, eladó/bizományos → /elado-cut/, a többi fehér háttér
//    a böngészőben átlátszóvá válik; ha nincs tiszta kép, az autó nem jelenik meg a menüben
//  - legfeljebb 3 autó soronként, az eladott autó és az alsó infósáv elrejtve
// Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SKIP = /(^|\/)(belso|admin|ajanlat|alairas|adatok|partner|_ttest|teszt-mega-menu|api)(\/|$)/;
const list = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : []);
const BC = list(path.join(DIST, 'berles-cut'));
const EC = list(path.join(DIST, 'elado-cut'));

const P = 'html[lang="hu"] .ca-navwrap .mm-panel';
const CSS = '<style id="ca-mm-hu">'
  // színek
  + 'html[lang="hu"] .ca-navwrap .mm-panel{--mp-bg:rgba(255,255,255,.97);--mp-ink:#121317;--mp-mut:#6B7080;--mp-line:rgba(18,19,23,.08);--mp-hov:rgba(18,19,23,.045);--mp-soft:#F4F4F1;--mp-logo:brightness(0);--mp-ngo:grayscale(1) contrast(1.1);--mp-ngb:multiply}'
  + 'html.ca-dark[lang="hu"] .ca-navwrap .mm-panel{--mp-bg:rgba(18,20,25,.97);--mp-ink:#ECEEF2;--mp-mut:#8F97A6;--mp-line:rgba(255,255,255,.08);--mp-hov:rgba(255,255,255,.055);--mp-soft:rgba(255,255,255,.04);--mp-logo:brightness(0) invert(1);--mp-ngo:grayscale(1) invert(1) contrast(1.1);--mp-ngb:screen}'
  // panel
  + P + '{background:var(--mp-bg)!important;color:var(--mp-ink)!important;border:1px solid var(--mp-line)!important;border-radius:22px!important;box-shadow:0 24px 60px rgba(8,8,10,.18)!important;-webkit-backdrop-filter:blur(18px) saturate(140%);backdrop-filter:blur(18px) saturate(140%);overflow:hidden}'
  + 'html.ca-dark[lang="hu"] .ca-navwrap .mm-panel{box-shadow:0 28px 70px rgba(0,0,0,.55)!important}'
  + P + ' *{border-color:var(--mp-line)}'
  + P + ' .mm-foot{display:none!important}'
  + P + ' .mm-in.mm-split{grid-template-columns:250px minmax(0,1fr)!important}'
  // bal oszlop
  + P + ' .mm-left{background:transparent!important;border-right:1px solid var(--mp-line)!important;border-radius:0!important;padding:20px 12px 18px 16px!important}'
  + P + ' .mm-left>.mm-h{display:none!important}'
  + P + ' .mm-l{padding:9px 12px!important;border-radius:12px!important;gap:12px!important;color:var(--mp-ink)!important;background:transparent!important;box-shadow:none!important;align-items:flex-start}'
  + P + ' .mm-l:hover,' + P + ' .mm-l:focus-visible{background:var(--mp-hov)!important}'
  + P + ' .mm-l .mm-ic,' + P + ' .mm-l>svg{color:var(--mp-mut)!important;width:18px;height:18px;margin-top:2px}'
  + P + ' .mm-l b{font-size:14.5px!important;font-weight:650!important;color:var(--mp-ink)!important;line-height:1.3}'
  + P + ' .mm-l span{font-size:12.5px!important;color:var(--mp-mut)!important;line-height:1.35!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}'
  + P + ' .mm-l.mm-lf{background:var(--mp-hov)!important}'
  + P + ' .mm-l.mm-lf .mm-ic,' + P + ' .mm-l.mm-lf>svg,' + P + ' .mm-l:hover .mm-ic,' + P + ' .mm-l:hover>svg{color:#E2001A!important}'
  + P + ' .mm-lfb{display:none!important}'
  // jobb oldal
  + P + ' .mm-right{padding:20px 24px 22px!important;gap:18px!important}'
  + P + ' .mm-h,' + P + ' .mm-h a{font-size:11px!important;letter-spacing:.09em!important;font-weight:700!important;color:var(--mp-mut)!important}'
  + P + ' .mm-h{margin:0 0 8px!important}'
  + P + ' .mm-h a:hover{color:var(--mp-ink)!important}'
  + P + ' .mm-more,' + P + ' .mm-all{font-size:12.5px!important;font-weight:650!important;color:var(--mp-ink)!important;opacity:.75}'
  + P + ' .mm-more:hover,' + P + ' .mm-all:hover{opacity:1;color:#E2001A!important}'
  // márkák
  + P + ' .mm-brands{gap:2px 6px!important}'
  + P + ' .mm-b{font-size:14px!important;font-weight:600!important;padding:6px 10px!important;gap:10px!important;border-radius:10px!important;color:var(--mp-ink)!important;background:transparent!important}'
  + P + ' .mm-b:hover{background:var(--mp-hov)!important}'
  + P + ' .mm-b img{width:30px!important;height:22px!important;filter:var(--mp-logo)!important;opacity:.85}'
  + P + ' .mm-b img[src*="mercedes"]{transform:scale(1.3)!important}'
  + P + ' .mm-ballic{width:30px!important;height:22px!important;color:var(--mp-ink)!important}'
  + P + ' .mm-ballic svg{width:18px;height:18px}'
  // fülek (Új / Használt)
  + P + ' .mm-tabs{background:var(--mp-hov)!important}'
  + P + ' .mm-tab{color:var(--mp-mut)!important;font-size:12px!important}'
  + P + ' .mm-tab.on{background:var(--mp-ink)!important;color:var(--mp-bg)!important}'
  // autók: max. 3, keret és háttér nélkül
  + P + ' .mm-cars{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}'
  + P + ' .mm-cars>.mm-car:not(.mm-cta):nth-child(n+4),' + P + ' .mm-car.mm-sold,' + P + ' .mm-car.ca-mm-nocut,' + P + ' .mm-sk:nth-child(n+4){display:none!important}'
  + P + ' .mm-car{background:transparent!important;border:0!important;border-radius:16px!important;box-shadow:none!important;color:var(--mp-ink)!important;transform:none!important;transition:background .15s!important}'
  + P + ' .mm-car:hover,' + P + ' .mm-car:focus-visible{background:var(--mp-hov)!important}'
  + P + ' .mm-car .mm-ph,' + P + ' .mm-car.mm-new .mm-ph{aspect-ratio:16/8.5!important;background-color:transparent!important;background-size:contain!important;background-position:50% 70%!important;background-repeat:no-repeat!important;background-origin:content-box!important;padding:6% 7% 2%!important;margin:0!important;box-sizing:border-box;border-radius:0!important}'
  + P + ' .mm-car .mm-cb{padding:6px 12px 12px!important;background:transparent!important}'
  + P + ' .mm-car b{font-size:14.5px!important;font-weight:650!important;color:var(--mp-ink)!important}'
  + P + ' .mm-car .mm-sp{font-size:12px!important;color:var(--mp-mut)!important}'
  + P + ' .mm-car .mm-meta img,' + P + ' .mm-car .mm-tags,' + P + ' .mm-car .mm-ngo img,' + P + ' .mm-stamp,' + P + ' .mm-when{display:none!important}'
  + P + ' .mm-car .mm-meta{margin-bottom:2px!important;justify-content:flex-start!important}'
  + P + ' .mm-car .mm-meta span,' + P + ' .mm-car .mm-meta .mm-bt{font-size:11.5px!important;color:var(--mp-mut)!important}'
  + P + ' .mm-car .mm-pr{margin-top:6px!important}'
  + P + ' .mm-car .mm-pr strong{font-size:15px!important;color:var(--mp-ink)!important;font-weight:750}'
  + P + ' .mm-car .mm-pr em,' + P + ' .mm-car .mm-was{color:var(--mp-mut)!important}'
  + P + ' .mm-dsc{left:10px!important;top:8px!important;font-size:11px!important;padding:3px 8px!important;box-shadow:none!important}'
  + P + ' .mm-ngo{background:transparent!important;border:0!important;padding:0!important;margin-top:6px!important}'
  + P + ' .mm-ngo span{font-size:11.5px!important;font-weight:600!important;color:var(--mp-mut)!important;-webkit-line-clamp:1!important}'
  + P + ' .mm-ngo em{display:inline!important;font-size:11.5px!important;letter-spacing:0!important;text-transform:none!important;color:var(--mp-mut)!important;font-weight:600}'
  + P + ' .mm-ngo em:after{content:": "}'
  + P + ' .mm-car.mm-cta{background:var(--mp-soft)!important;color:var(--mp-ink)!important;align-items:flex-start!important;padding:18px!important}'
  + P + ' .mm-car.mm-cta *{color:var(--mp-ink)!important}'
  + P + ' .mm-car.mm-cta .mm-sp{color:var(--mp-mut)!important;white-space:normal!important}'
  + P + ' .mm-car.mm-cta svg{color:#E2001A!important}'
  + P + ' .mm-car.mm-cta .mm-btn,' + P + ' .mm-car.mm-cta .mm-btn *{color:#fff!important}'
  + P + ' .mm-sk{background:var(--mp-soft)!important;animation:none!important}'
  // jótékonysági logók: egyszínűek, csempe nélkül
  + P + ' .mm-ngos-w{margin-bottom:6px!important}'
  + P + ' .mm-ngos{gap:6px!important}'
  + P + ' .mm-ng{background:transparent!important;border:0!important;box-shadow:none!important;height:44px!important;padding:4px 8px!important;border-radius:10px!important}'
  + P + ' .mm-ng:hover{background:var(--mp-hov)!important}'
  + P + ' .mm-ng img{filter:var(--mp-ngo)!important;mix-blend-mode:var(--mp-ngb);opacity:.7;max-height:34px!important}'
  + P + ' .mm-ng:hover img{opacity:1}'
  // kalkulátorok, közösségi gombok
  + P + ' .mm-chip{background:transparent!important;border:1px solid var(--mp-line)!important;color:var(--mp-ink)!important;font-size:13.5px!important;font-weight:600!important;padding:8px 12px!important;border-radius:12px!important}'
  + P + ' .mm-chip:hover{background:var(--mp-hov)!important;color:var(--mp-ink)!important;border-color:var(--mp-line)!important}'
  + P + ' .mm-chip svg{color:var(--mp-mut)!important}'
  + P + ' .mm-schip svg{filter:grayscale(1);opacity:.8}'
  + P + ' .mm-schip:hover svg{filter:none;opacity:1}'
  + P + ' .mm-badge{background:transparent!important;border:1px solid var(--mp-line)!important;box-shadow:none!important;padding:8px 14px!important;border-radius:12px!important}'
  + P + ' .mm-badge strong{font-size:14.5px!important}'
  + P + ' .mm-badge em{color:var(--mp-mut)!important}'
  // kiemelt kártyák
  + P + ' .mm-frow{gap:12px!important}'
  + P + ' .mm-frow>*{min-height:190px!important}'
  + P + ' .mm-mini{background:var(--mp-soft)!important;border:0!important;border-radius:16px!important;padding:16px!important;box-shadow:none!important;transform:none!important;color:var(--mp-ink)!important}'
  + P + ' .mm-mini:hover{background:var(--mp-hov)!important}'
  + P + ' .mm-mini .mm-ic2{color:var(--mp-mut)!important}'
  + P + ' .mm-mini strong{font-size:24px!important;color:var(--mp-ink)!important;overflow-wrap:anywhere}' + P + ' .mm-mini strong.mm-long{font-size:17px!important;line-height:1.25!important}'
  + P + ' .mm-mini b{color:var(--mp-ink)!important;font-size:13.5px!important}'
  + P + ' .mm-mini div span{color:var(--mp-mut)!important}'
  + P + ' .mm-mini .mm-go{color:var(--mp-ink)!important;opacity:.75;font-size:12.5px!important}'
  + P + ' .mm-mini:hover .mm-go{color:#E2001A!important;opacity:1}'
  + P + ' .mm-single{border-radius:16px!important;min-height:190px!important}'
  + P + ' .mm-single .mm-ct{padding:16px 18px!important}'
  + P + ' .mm-single b{font-size:17px!important}'
  + P + ' .mm-single span{font-size:13px!important;margin:6px 0 12px!important}'
  + P + ' .mm-btn{padding:8px 14px!important;font-size:12.5px!important}'
  + '</style>';

const JS = '<script id="ca-mm-hu-js">(function(){'
  + 'var BC=' + JSON.stringify(BC) + ',EC=' + JSON.stringify(EC) + ';'
  // a panelt a dark-mode.js ne színezze; amit már átszínezett, azt visszaállítjuk
  + 'function clean(p){if(!p.hasAttribute("data-dm-skip"))p.setAttribute("data-dm-skip","");[p].concat([].slice.call(p.querySelectorAll("*"))).forEach(function(e){'
  + 'if(e.hasAttribute("data-dmc")){var o=e.getAttribute("data-dmc");e.style.removeProperty("color");e.style.removeProperty("-webkit-text-fill-color");if(o)e.style.setProperty("color",o);e.removeAttribute("data-dmc")}'
  + 'if(e.hasAttribute("data-dmbg")){var b=e.getAttribute("data-dmbg");e.style.removeProperty("background-color");if(b)e.style.setProperty("background-color",b);e.removeAttribute("data-dmbg")}'
  + 'if(e.hasAttribute("data-dmbd")){e.style.removeProperty("border-color");e.removeAttribute("data-dmbd")}'
  + 'if(e.classList&&e.classList.length){[].slice.call(e.classList).forEach(function(c){if(/^dm-/.test(c))e.classList.remove(c)})}});'
  + '[].forEach.call(p.querySelectorAll(".mm-car .mm-ph"),fix)}'
  // autókép háttér nélkül
  + 'function fix(ph){if(ph.__ca)return;var m=(ph.style.backgroundImage||"").match(/url\\(["\']?(.*?)["\']?\\)$/);if(!m)return;ph.__ca=1;var u=m[1],car=ph.closest(".mm-car"),h=car?car.getAttribute("href")||"":"";'
  + 'var r=u.match(/\\/berles\\/([^\\/?#]+)\\.webp/);if(r&&BC.indexOf(r[1])>-1){ph.style.backgroundImage="url(\\"/berles-cut/"+r[1]+".webp\\")";return}'
  + 'var s=h.match(/\\/auto\\/([^\\/?#]+)/);if(s&&EC.indexOf(s[1])>-1){ph.style.backgroundImage="url(\\"/elado-cut/"+s[1]+".webp\\")";return}'
  + 'if(/^https?:/.test(u)&&u.indexOf(location.origin)!==0){if(car)car.classList.add("ca-mm-nocut");return}'
  + 'var im=new Image();im.onload=function(){try{var W=im.naturalWidth,H=im.naturalHeight,k=Math.min(1,900/W);W=Math.round(W*k);H=Math.round(H*k);var c=document.createElement("canvas");c.width=W;c.height=H;var x=c.getContext("2d");x.drawImage(im,0,0,W,H);var d=x.getImageData(0,0,W,H),a=d.data;'
  + 'function wh(i){var R=a[i],G=a[i+1],B=a[i+2];return a[i+3]>0&&Math.min(R,G,B)>198&&Math.max(R,G,B)-Math.min(R,G,B)<16}'
  + 'var cs=[0,W-1,(H-1)*W,H*W-1],n=0;cs.forEach(function(p){if(a[p*4+3]<10)n+=10;else if(wh(p*4))n++});if(n>=40||n<3)return;'
  + 'var v=new Uint8Array(W*H),q=[];for(var X=0;X<W;X++){q.push(X,(H-1)*W+X)}for(var Y=0;Y<H;Y++){q.push(Y*W,Y*W+W-1)}'
  + 'while(q.length){var p=q.pop();if(v[p])continue;if(!wh(p*4))continue;v[p]=1;var mn=Math.min(a[p*4],a[p*4+1],a[p*4+2]);if(mn>240)a[p*4+3]=0;else{a[p*4+3]=Math.round((240-mn)/42*120);a[p*4]=a[p*4+1]=a[p*4+2]=0}var px=p%W;if(px>0)q.push(p-1);if(px<W-1)q.push(p+1);if(p>=W)q.push(p-W);if(p<W*H-W)q.push(p+W)}'
  + 'for(var p2=0;p2<W*H;p2++){if(v[p2])continue;var px2=p2%W;if((px2>0&&v[p2-1])||(px2<W-1&&v[p2+1])||(p2>=W&&v[p2-W])||(p2<W*H-W&&v[p2+W])){var i2=p2*4;if(Math.min(a[i2],a[i2+1],a[i2+2])>190)a[i2+3]=110}}'
  + 'x.putImageData(d,0,0);ph.style.backgroundImage="url("+c.toDataURL("image/webp",.9)+")"}catch(e){}};im.src=u}'
  + 'function scan(){var p=document.querySelector(".ca-navwrap .mm-panel");if(p)clean(p)}'
  + 'function boot(){var w=document.querySelector(".ca-navwrap");if(!w)return;scan();var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(scan,30)}).observe(w,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]})}'
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
    console.log('[hu-menu] letisztult mega menü: ' + n + ' magyar oldal · kivágott képek: ' + BC.length + ' bérelhető, ' + EC.length + ' eladó');
  }
} catch (e) { console.log('[hu-menu] hiba:', e.message); }
