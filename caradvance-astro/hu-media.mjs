// hu-media.mjs — Média (HU, /media/): a többi oldallal egységes, prémium nézet
// · olvasható fejléc + Görgess; Google-értékelés sáv és vélemény-kártyák üvegkártyán; platform-kártyák márkaszínű
//   felső csíkkal (a márkaszínek maradnak); fülek pirulákon; világos záró kártya. SEO (értékelések, Organization) változatlan.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'media', 'index.html');

const P = 'html.ca-md body section.md ';
const D = 'html.ca-md.ca-dark body section.md ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.12),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const CSS = '<style id="ca-md-css">'
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.5) saturate(1.05)}'
  + P + 'section.hero .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.12))!important}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75)!important}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + '.section{background:transparent!important}'
  + P + '.sec-title{font-size:clamp(28px,3.2vw,42px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.1!important}'
  + D + '.sec-title{color:#fff!important}' + D + '.sec-intro{color:rgba(255,255,255,.7)!important}'
  // Google sáv + vélemények
  + P + '.md-google{border-radius:22px!important;padding:16px 20px!important;' + HL + '}'
  + D + '.md-google{' + HD + 'color:#fff!important}'
  + P + '.md-g-txt b{font-size:20px!important;font-weight:900!important}'
  + P + '.md-stars,' + P + '.md-rev-stars{color:#F5B301!important}'
  + P + '.md-g-link{color:' + RED + '!important;font-weight:800!important}'
  + P + '.md-reviews{gap:14px!important;padding-bottom:14px!important}'
  + P + '.md-rev{border-radius:22px!important;padding:20px!important;' + HL + '}'
  + D + '.md-rev{' + HD + 'color:#fff!important}'
  + D + '.md-rev-text,' + D + '.md-rev-id span{color:rgba(255,255,255,.75)!important}' + D + '.md-rev-id b{color:#fff!important}'
  // platform-kártyák
  + P + '.md-cards{gap:16px!important}'
  + P + '.md-card{position:relative;overflow:hidden;border-radius:26px!important;padding:28px 18px 22px!important;transition:transform .35s cubic-bezier(.2,.8,.2,1)!important;' + HL + '}'
  + D + '.md-card{' + HD + 'color:#fff!important}'
  + P + '.md-card::before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:var(--c)!important;background-color:var(--c)!important}'
  + P + 'a.md-card:hover{transform:translateY(-4px)}'
  + P + '.md-ico-img{width:52px!important;height:52px!important;border-radius:16px!important;box-shadow:0 10px 22px rgba(18,19,23,.14)}'
  + P + '.md-name{font-weight:800!important;font-size:18px!important}'
  + D + '.md-name{color:#fff!important}' + D + '.md-handle,' + D + '.md-stat{color:rgba(255,255,255,.65)!important}'
  + P + '.md-stat{font-weight:800!important}'
  + P + '.md-follow{display:inline-flex!important;align-items:center;justify-content:center;height:40px;padding:0 16px!important;border-radius:999px!important;margin-top:10px!important;background:var(--c)!important;color:#fff!important;font-weight:800!important;font-size:13.5px!important}'
  + P + '.md-card-soon .md-follow{background:rgba(18,19,23,.06)!important;color:inherit!important}'
  + D + '.md-card-soon .md-follow{background:rgba(255,255,255,.08)!important}'
  // fülek
  + P + '.md-tabs{gap:8px!important;background:none!important;border:0!important;padding:0!important}'
  + P + '.md-tab{height:44px!important;border-radius:999px!important;border:1px solid ' + LN + '!important;background:transparent!important;font-weight:700!important;color:inherit!important;padding:0 16px!important}'
  + D + '.md-tab{border-color:rgba(255,255,255,.14)!important;color:#fff!important}'
  + P + '.md-tab.is-on{background:#121317!important;border-color:#121317!important;color:#fff!important}'
  + D + '.md-tab.is-on{background:#fff!important;border-color:#fff!important;color:#121317!important}'
  // záró kártya: világosban világos
  + P + '.md-cta{border-radius:30px!important;padding:32px 38px!important;color:#121317!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.12),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.8),rgba(255,255,255,.5)),rgba(255,255,255,.6)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.06),0 30px 70px rgba(226,0,26,.12)!important}'
  + D + '.md-cta{color:#fff!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.35),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(0,0,0,.4)!important}'
  + P + '.md-cta :is(h2,p){color:inherit!important}' + P + '.md-cta p{opacity:.75}'
  + P + '.md-cta .btn{background:' + RED + '!important;color:#fff!important;border:0!important;box-shadow:0 12px 26px rgba(226,0,26,.35)!important}'
  + P + '.md-reviews.ca-mq,' + P + '.md-igfeed.ca-mq{scroll-snap-type:none!important;scrollbar-width:none!important;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}'
  + P + '.ca-mq::-webkit-scrollbar{display:none}'
  + P + '.ca-mq>*{scroll-snap-align:none!important}'
  + P + '.md-rev-hint{display:none!important}'
  + '@media(max-width:560px){' + P + '.md-cta{padding:24px 18px!important;border-radius:24px!important}}'
  + '</style>';

const JS = '<script id="ca-md-js">' + String.raw`(function(){var r=document.querySelector("section.md");if(!r||r.__m)return;r.__m=1;document.documentElement.classList.add("ca-md");
var sd=r.querySelector("section.hero .scrolldown");if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=r.querySelector("section.hero").nextElementSibling;if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})}
// záró kártya felismerése (sötét doboz a lap alján)
var c=[].slice.call(r.querySelectorAll("div")).filter(function(d){return /Ne maradj le/.test(d.textContent)&&d.querySelector("h2,h3")&&d.querySelector("a")&&d.children.length<5}).pop();if(c)c.classList.add("md-cta");
// folyamatosan jobbra haladó sávok (vélemények, Instagram-posztok) — végtelenített, egérrel/ujjal megállítható
var RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
function mq(box){if(!box||box.__mq||RM)return;var kids=[].slice.call(box.children).filter(function(k){return getComputedStyle(k).display!=="none"});if(kids.length<2)return;box.__mq=1;box.classList.add("ca-mq");
kids.forEach(function(k){var c=k.cloneNode(true);c.setAttribute("aria-hidden","true");c.setAttribute("data-ca-clone","1");box.appendChild(c)});
var first=kids[0],clone=box.children[kids.length],pos=-1,last=0,hold=0,vis=false,SPD=34;
function half(){return clone.offsetLeft-first.offsetLeft}
function step(t){var dt=last?Math.min(64,t-last):16;last=t;var h=half();if(h>0&&vis&&!hold&&box.offsetParent){if(pos<0)pos=box.scrollLeft||h;pos-=SPD*dt/1000;if(pos<=0)pos+=h;if(pos>=h*2)pos-=h;box.scrollLeft=pos}requestAnimationFrame(step)}
function stop(){hold=1}function go(){hold=0;pos=box.scrollLeft;var h=half();if(h>0){if(pos<=0)pos+=h;if(pos>=h)pos-=h}}
box.addEventListener("mouseenter",stop);box.addEventListener("mouseleave",go);
var tm=0;function touch(){stop();clearTimeout(tm);tm=setTimeout(go,2500)}
box.addEventListener("touchstart",touch,{passive:true});box.addEventListener("touchmove",touch,{passive:true});box.addEventListener("wheel",touch,{passive:true});
if("IntersectionObserver" in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(box);else vis=true;
setTimeout(function(){pos=half();box.scrollLeft=pos;requestAnimationFrame(step)},400)}
function igReady(cb){var f=r.querySelector(".md-igfeed");if(!f)return;var last=-1,same=0,t0=Date.now();(function poll(){var bq=f.querySelectorAll(":scope>blockquote").length,n=f.children.length,big=[].filter.call(f.children,function(x){return x.tagName==="IFRAME"&&x.getBoundingClientRect().height>100}).length;
if(n===last&&bq===0)same++;else same=0;last=n;if((same>=2&&big>0)||Date.now()-t0>14000){[].forEach.call(f.children,function(x){if(x.tagName!=="IFRAME"||x.getBoundingClientRect().height<100)x.style.display="none"});cb(f)}else setTimeout(poll,1000)})()}
function initMq(){mq(r.querySelector(".md-reviews"));igReady(function(f){if(f.offsetParent)mq(f);else{var t=setInterval(function(){if(f.offsetParent){clearInterval(t);mq(f)}},800)}})}
if(document.readyState==="complete")setTimeout(initMq,300);else addEventListener("load",function(){setTimeout(initMq,300)});
function cln(){[].forEach.call(r.querySelectorAll(".md-google *,.md-reviews *,.md-cta,.md-cta *,.md-tabs *"),function(x){var st=x.getAttribute("style")||"";if(x.tagName==="IMG"||/url\(|--c|md-avatar/.test(st+x.className))return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

export function apply(h) {
  if (h.indexOf('id="ca-md-css"') > -1 || !/<section class="md"[ >]/.test(h)) return null;
  h = h.replace('</head>', () => CSS + '</head>');
  return h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-media] nincs', FILE); process.exit(0); }
  const o = apply(fs.readFileSync(FILE, 'utf8'));
  if (!o) console.log('[hu-media] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-media] média: letisztult nézet'); }
}
