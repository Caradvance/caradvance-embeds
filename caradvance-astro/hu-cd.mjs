// hu-cd.mjs — autó-adatlapok (HU): /berelheto-auto/<modell>/ és /egyedi-auto-rendeles/<modell>/ — az eddigi oldalak stílusában
// · teljes képernyős, olvasható fejléc, a Görgess alul középen (mobilon rejtve)
// · ár-doboz, ikonos előnykártyák, szolgáltatás- és kapcsolódó kártyák üvegkártyán (sötét módban sötét kártya piros fénnyel)
// · útmutató kártyán, változatválasztó pirulákon, műszaki adatok és összehasonlító tábla letisztult kártyán (világos fejléc)
// · galéria lekerekítve, finom nagyítással; GYIK kártyákon (4 + mind); záró ajánlatkérő kártya világos módban világos
// A tartalomhoz, a képekhez és a SEO-hoz nem nyúl. Idempotens, csak a magyar oldalak.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const DIRS = ['berelheto-auto', 'egyedi-auto-rendeles'];

const P = 'html.ca-cd body ';
const D = 'html.ca-cd.ca-dark body ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.14),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';
const CHK = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E")';

const CSS = '<style id="ca-cd-css">'
  // ---- fejléc
  + '@media(min-width:641px){' + P + '.cd-hero{min-height:100vh!important;min-height:100svh!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:center!important}}'
  + P + '.cd-hero .cd-ov{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.62),rgba(8,8,10,.34) 70%,rgba(8,8,10,.16))!important}'
  + P + '.cd-hero :is(h1,.cd-sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + '.cd-hero .cd-scroll{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:30px!important;transform:translateX(-50%)!important;margin:0!important;z-index:6;display:flex!important;flex-direction:column!important;align-items:center!important;gap:4px!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;font-size:11px!important;font-weight:700!important;letter-spacing:.14em!important;text-transform:uppercase;cursor:pointer}'
  + D + '.cd-hero .cd-scroll{color:rgba(255,255,255,.7)!important}'
  + P + '.cd-hero .cd-scroll svg{width:18px;height:18px;animation:caCdBob 1.8s ease-in-out infinite}'
  + '@keyframes caCdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + '.cd-hero .cd-scroll{display:none!important}}'
  // ---- bevezető, ár-doboz
  + P + '.cd-chip{border-radius:999px!important;' + HL + 'font-weight:700!important}'
  + D + '.cd-chip:not(.cd-chip-year){' + HD + 'color:#fff!important}'
  + P + '.cd-chip.cd-chip-year{background:' + RED + '!important;border-color:' + RED + '!important;color:#fff!important;box-shadow:0 8px 18px rgba(226,0,26,.3)!important}'
  + P + ':is(.ca-pbox,.cd-price){border-radius:26px!important;' + HL + '}'
  + D + ':is(.ca-pbox,.cd-price){' + HD + 'color:#fff!important}'
  + P + '.cd-photo{border-radius:30px!important;overflow:hidden;' + HL + '}'
  + D + '.cd-photo{' + HD + '}'
  + P + '.cd-trust i{background:' + RED + '!important}'
  // ---- ragadós almenü
  + P + '.cd-nav{background:rgba(255,255,255,.72)!important;-webkit-backdrop-filter:saturate(1.6) blur(18px)!important;backdrop-filter:saturate(1.6) blur(18px)!important;border-bottom:1px solid ' + LN + '!important}'
  + D + '.cd-nav{background:rgba(18,19,23,.72)!important;border-bottom-color:rgba(255,255,255,.08)!important}'
  + P + '.cd-nav-links a{border-radius:999px;padding:7px 12px!important;transition:background .2s,color .2s}'
  + P + '.cd-nav-links a:hover,' + P + '.cd-nav-links a.ca-on{background:rgba(226,0,26,.08);color:' + RED + '!important}'
  // ---- címek
  + P + '.cd-sec :is(.cd-h2,h2){letter-spacing:-.03em!important}'
  + P + '.cd-soft{background:transparent!important}'
  // ---- előnykártyák
  + P + '.cd-hl{gap:16px!important}'
  + P + '.cd-hl .cd-c{border-radius:24px!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.cd-hl .cd-c{' + HD + 'color:#fff!important}'
  + '@media(max-width:640px){' + P + '.cd-hl[style]{grid-template-columns:1fr!important}}'
  + P + '.cd-hl .cd-c:hover{transform:translateY(-3px)}'
  + P + '.cd-hl .cd-i{width:44px!important;height:44px!important;border-radius:50%!important;background:' + RED + '!important;color:#fff!important;box-shadow:0 8px 18px rgba(226,0,26,.3)!important;display:flex!important;align-items:center;justify-content:center;font-size:18px!important;font-weight:800!important;filter:none!important}'
  + D + '.cd-hl .cd-c :is(h3,p,b){color:inherit!important}' + D + '.cd-hl .cd-c p{opacity:.78}'
  // ---- dizájn / belső tér: lekerekített kép, pipás lista
  + P + '.cd-edi img{border-radius:28px!important;box-shadow:0 30px 70px rgba(18,19,23,.16)!important}'
  + P + '.cd-edi ul{list-style:none!important;padding:0!important}'
  + P + '.cd-edi ul li{position:relative;padding-left:30px!important;margin:8px 0!important}'
  + P + '.cd-edi ul li::before{content:"";position:absolute;left:0;top:2px;width:20px;height:20px;border-radius:50%;background:' + CHK + ' center/11px no-repeat,' + RED + '}'
  // ---- útmutató kártyán
  + P + '.cd-prose{border-radius:30px;padding:clamp(24px,4vw,48px)!important;max-width:1000px!important;' + HL + '}'
  + D + '.cd-prose{' + HD + 'color:#fff}'
  + P + '.cd-prose :is(h3,.cd-h3){position:relative;padding-left:16px!important;margin-top:28px!important}'
  + P + '.cd-prose :is(h3,.cd-h3)::before{content:"";position:absolute;left:0;top:.18em;bottom:.18em;width:4px;border-radius:4px;background:' + RED + '}'
  + D + '.cd-prose :is(p,li,h2,h3,h4,strong,b,em,.cd-h2,.cd-h3){color:#fff!important}' + D + '.cd-prose :is(p,li){color:rgba(255,255,255,.8)!important}'
  + P + '.cd-prose a{color:' + RED + '!important;font-weight:700}'
  // ---- változatok + műszaki adatok
  + P + '.cd-varsel button{border-radius:999px!important;font-weight:700!important;' + HL + 'color:inherit!important;transition:all .2s}'
  + D + '.cd-varsel button{' + HD + 'color:#fff!important}'
  + P + '.cd-varsel button.on{background:#121317!important;border-color:#121317!important;color:#fff!important;box-shadow:0 10px 24px rgba(18,19,23,.22)!important}'
  + D + '.cd-varsel button.on{background:#fff!important;border-color:#fff!important;color:#121317!important}'
  + P + '.cd-stage{border-radius:28px!important;overflow:hidden}'
  + P + '.cd-spec{border-radius:26px!important;' + HL + '}'
  + D + '.cd-spec{' + HD + 'color:#fff!important}'
  + P + '.cd-spec .r{border-color:' + LN + '!important}' + D + '.cd-spec .r{border-color:rgba(255,255,255,.08)!important}'
  + P + '.cd-spec .r:last-child .v{color:' + RED + '!important;font-weight:800!important}'
  + D + '.cd-spec .r .k{color:rgba(255,255,255,.6)!important}' + D + '.cd-spec .r .v{color:#fff!important}' + D + '.cd-spec .r:last-child .v{color:#FF4258!important}'
  // ---- összehasonlító tábla: világos fejléc, kártyán
  + P + '.cd-cmpwrap{border-radius:26px!important;overflow:auto!important;border:0!important;' + HL + '}'
  + D + '.cd-cmpwrap{' + HD + '}'
  + P + '.cd-cmp{border-collapse:separate!important;border-spacing:0!important;background:none!important}'
  + P + '.cd-cmp thead th{background:rgba(226,0,26,.06)!important;color:#121317!important;font-weight:800!important;border:0!important;border-bottom:2px solid rgba(226,0,26,.35)!important}'
  + P + '.cd-cmp thead th:first-child{color:rgba(18,19,23,.5)!important;font-size:12px!important;letter-spacing:.08em;text-transform:uppercase}'
  + D + '.cd-cmp thead th{background:rgba(226,0,26,.12)!important;color:#fff!important}' + D + '.cd-cmp thead th:first-child{color:rgba(255,255,255,.55)!important}'
  + P + '.cd-cmp tr{background:none!important}'
  + P + '.cd-cmp td{background:none!important;border:0!important;border-top:1px solid ' + LN + '!important}'
  + D + '.cd-cmp td{color:rgba(255,255,255,.85)!important;border-top-color:rgba(255,255,255,.08)!important}'
  + P + '.cd-cmp td:first-child{font-weight:700!important;opacity:.6}'
  + P + '.cd-cmp tbody tr:hover td{background:rgba(226,0,26,.035)!important}'
  // ---- szolgáltatások
  + P + '.cd-svc{gap:16px!important}'
  + P + '.cd-svc>a{border-radius:24px!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.cd-svc>a{' + HD + 'color:#fff!important}'
  + P + '.cd-svc>a:hover{transform:translateY(-3px)}'
  + P + '.cd-svc>a .go{color:' + RED + '!important;font-weight:800!important}'
  + D + '.cd-svc>a :is(h3,p,strong){color:inherit!important}' + D + '.cd-svc>a p{opacity:.78}' + D + '.cd-svc>a .go{color:#FF4258!important}'
  // ---- galéria
  + P + '.cd-gal{gap:14px!important}'
  + P + '.cd-gal img{border-radius:22px!important;transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .5s;cursor:zoom-in}'
  + P + '.cd-gal img:hover{transform:scale(1.02);box-shadow:0 24px 50px rgba(18,19,23,.18)}'
  // ---- GYIK
  + P + '.cd-faqwrap details{border-radius:20px!important;overflow:hidden;margin:0 0 12px!important;padding:0!important;' + HL + '}'
  + D + '.cd-faqwrap details{' + HD + '}'
  + P + '.cd-faqwrap summary{padding:20px 22px!important;font-weight:700!important;color:inherit!important;background:none!important}'
  + D + '.cd-faqwrap summary{color:#fff!important}'
  + P + '.cd-faqwrap details>p{padding:0 22px 20px!important;margin:0!important;opacity:.8}'
  + D + '.cd-faqwrap details>p{color:rgba(255,255,255,.8)!important}'
  + P + '.cd-faqwrap .cd-plus{flex:0 0 30px!important;width:30px!important;min-width:0!important;height:30px!important;border-radius:50%!important;background:' + RED + '!important;color:#fff!important}'
  + P + '.cd-faqwrap.ca-cut details.ca-x{display:none!important}'
  + P + '.ca-more{display:flex;margin:6px auto 0;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}'
  + D + '.ca-more{border-color:rgba(255,255,255,.16);color:#fff}'
  + P + '.ca-more svg{width:16px;height:16px;transition:transform .3s}'
  + P + '.cd-faqwrap:not(.ca-cut) .ca-more svg{transform:rotate(180deg)}'
  // ---- kapcsolódó modellek
  + P + '.cd-rel{gap:16px!important}'
  + P + '.cd-relc{border-radius:24px!important;overflow:hidden;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.cd-relc{' + HD + 'color:#fff!important}'
  + P + '.cd-relc:hover{transform:translateY(-4px)}'
  + P + '.cd-relc .cd-ph{background:radial-gradient(60% 50% at 50% 85%,rgba(18,19,23,.1),transparent 70%)!important}'
  + D + '.cd-relc .cd-ph{background:radial-gradient(60% 50% at 50% 85%,rgba(226,0,26,.22),transparent 70%)!important}'
  + P + '.cd-relc img{transition:transform .5s cubic-bezier(.2,.8,.2,1)}' + P + '.cd-relc:hover img{transform:scale(1.04)}'
  + P + '.cd-relc .n{font-weight:800!important;color:inherit!important}'
  + P + '.cd-relc .s{color:' + RED + '!important;font-weight:800!important}' + D + '.cd-relc .s{color:#FF4258!important}'
  // ---- záró ajánlatkérő kártya: világosban világos, sötétben sötét
  + P + '.cd-band{border-radius:30px!important;color:#121317!important;background:radial-gradient(70% 90% at 100% 0%,rgba(226,0,26,.10),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.8),rgba(255,255,255,.5)),rgba(255,255,255,.6)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.05),0 30px 70px rgba(226,0,26,.10)!important}'
  + P + '.cd-band :is(h2,p){color:#121317!important}' + P + '.cd-band p{opacity:.7}'
  + P + '.cd-band .cd-btn{background:' + RED + '!important;color:#fff!important;border-color:' + RED + '!important;box-shadow:0 12px 26px rgba(226,0,26,.3)!important}'
  + D + '.cd-band{color:#fff!important;' + HD + '}'
  + D + '.cd-band :is(h2,p){color:#fff!important}'
  + '</style>';

const JS = '<script id="ca-cd-js">' + String.raw`(function(){
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
if(!$(".cd-hero")||document.documentElement.classList.contains("ca-cd"))return;document.documentElement.classList.add("ca-cd");
var DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
// Görgess: a fejléc utáni részhez
var sd=$(".cd-hero .cd-scroll");if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$(".cd-hero").nextElementSibling;while(t&&t.tagName==="SCRIPT")t=t.nextElementSibling;if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})}
// GYIK: az első 4 látszik
var fq=$(".cd-faqwrap");if(fq){var ds=$$(":scope>details",fq);if(ds.length>5){ds.forEach(function(d,k){if(k>=4)d.classList.add("ca-x")});fq.classList.add("ca-cut");var mo=document.createElement("button");mo.type="button";mo.className="ca-more";mo.setAttribute("data-dm-skip","1");var lbl=function(){mo.innerHTML=(fq.classList.contains("ca-cut")?"Mind a "+ds.length+" kérdés":"Kevesebb kérdés")+DN};lbl();mo.addEventListener("click",function(){fq.classList.toggle("ca-cut");lbl()});ds[ds.length-1].after(mo)}}
// almenü: az aktuális fejezet kiemelése
var ls=$$(".cd-nav-links a");if(ls.length&&"IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){ls.forEach(function(a){a.classList.toggle("ca-on",a.getAttribute("href")==="#"+e.target.id)})}})},{rootMargin:"-45% 0px -50% 0px"});ls.forEach(function(a){var t=document.getElementById((a.getAttribute("href")||"").slice(1));if(t)io.observe(t)})}
// sötét mód inline-színek takarítása a kártyákon
function cln(){$$(".cd-hl,.cd-hl *,.cd-svc,.cd-svc *,.cd-faqwrap details,.cd-faqwrap details *,.cd-rel,.cd-rel *,.cd-band,.cd-band *,.cd-spec,.cd-spec *,.cd-cmp,.cd-cmp *,.cd-prose,.cd-prose *").forEach(function(x){if(x.tagName==="IMG")return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

export function apply(h) {
  if (h.indexOf('id="ca-cd-css"') > -1 || !/<section class="cd-hero"[ >]/.test(h) || !/<html[^>]*lang="hu"/.test(h)) return null;
  h = h.replace('</head>', () => CSS + '</head>');
  return h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  let n = 0;
  for (const d of DIRS) {
    const dir = path.join(DIST, d); if (!fs.existsSync(dir)) continue;
    for (const s of fs.readdirSync(dir)) {
      const f = path.join(dir, s, 'index.html'); if (!fs.existsSync(f)) continue;
      const o = apply(fs.readFileSync(f, 'utf8')); if (o) { fs.writeFileSync(f, o); n++; }
    }
  }
  console.log('[hu-cd] autó-adatlapok: ' + n);
}
