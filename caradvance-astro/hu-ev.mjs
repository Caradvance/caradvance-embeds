// hu-ev.mjs — Egyedül vagy velünk? (HU, /egyedul-vagy-velunk/) — a többi oldallal egységes, prémium nézet
// · olvasható, teljes képernyős fejléc, partnerlogók üvegpirulán, Görgess alul középen
// · összevetés két kártyaoszlopban: „Ha egyedül vágsz bele” (szürke, piros x) vs „A CarAdvance-szel” (piros keret, zöld pipa),
//   a sorok egy szintben; görgetéskor soronként beúsznak; mobilon soronként párosított kártyák
// · kulcsszámok kártyákon (felpörgő számok), lábjegyzetek lenyitható „Lábjegyzetek” dobozban
// · záró kártya világosban világos; „Jó tudni” kártya; rövidebb GYIK (4 + mind)
// · a tulajdonos döntése szerint az átfutás 5–14 nap (a régi 10–21 nap helyett). SEO: márkás cím, BreadcrumbList.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'egyedul-vagy-velunk', 'index.html');
const SITE = 'https://www.caradvance.hu';
const TITLE = 'Egyedül vagy velünk? — autóimport Németországból | CarAdvance';

const P = 'html.ca-ev body section.ev ';
const D = 'html.ca-ev.ca-dark body section.ev ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.12),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const CSS = '<style id="ca-ev-css">'
  // ---- fejléc
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.5) saturate(1.05)}'
  + P + 'section.hero .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.12))!important}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .partners{display:inline-flex!important;gap:14px!important;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);margin:0 auto 22px!important}'
  + P + 'section.hero .partners img{height:26px!important;border-radius:6px!important}'
  + P + 'section.hero .inner{display:flex;flex-direction:column;align-items:center}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caEBob 1.8s ease-in-out infinite}'
  + '@keyframes caEBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + P + '.section{background:transparent!important}'
  + P + '.sec-title,' + P + '.ev-seo-h{font-size:clamp(28px,3.2vw,42px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.1!important}'
  + D + '.sec-title,' + D + '.ev-seo-h{color:#fff!important}'
  // ---- összevetés
  + P + '.ev-wrap{max-width:1140px!important}'
  + P + '.ev-table{position:relative;display:grid!important;grid-template-columns:minmax(0,.9fr) minmax(0,1fr) minmax(0,1fr);column-gap:16px;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important;overflow:visible!important}'
  + P + '.ev-table::before,' + P + '.ev-table::after{content:"";position:absolute;top:0;bottom:0;border-radius:28px;z-index:0;pointer-events:none;background-color:transparent!important}'
  + P + '.ev-table::before{left:calc((100% - 32px) * .9 / 2.9 + 16px);width:calc((100% - 32px) / 2.9);' + HL + '}'
  + D + '.ev-table::before{' + HD + '}'
  + P + '.ev-table::after{right:0;width:calc((100% - 32px) / 2.9);background:linear-gradient(180deg,rgba(226,0,26,.06),rgba(226,0,26,.01)),rgba(255,255,255,.72)!important;border:1.5px solid rgba(226,0,26,.5)!important;box-shadow:0 0 0 4px rgba(226,0,26,.07),0 30px 70px rgba(226,0,26,.15)!important}'
  + D + '.ev-table::after{background:radial-gradient(80% 40% at 50% 0%,rgba(226,0,26,.25),transparent 70%),linear-gradient(#2A2B30,#16171B)!important;border:1.5px solid rgba(255,60,80,.55)!important;box-shadow:0 0 0 4px rgba(226,0,26,.12),0 30px 70px rgba(0,0,0,.5)!important}'
  + P + '.ev-row{display:contents!important}'
  + P + '.ev-row>*{position:relative;z-index:1;background:none!important;border:0!important;border-top:1px solid ' + LN + '!important;padding:16px 20px!important;box-shadow:none!important;display:flex!important;align-items:center;gap:12px;min-height:0!important;transition:opacity .5s,transform .5s cubic-bezier(.2,.8,.2,1)}'
  + D + '.ev-row>*{border-top-color:rgba(255,255,255,.08)!important}'
  + P + '.ev-row>.ev-aspect{padding-left:4px!important;font-weight:800!important;font-size:15px!important;color:inherit!important}'
  + D + '.ev-row>.ev-aspect{color:#fff!important}'
  + P + '.ev-num{flex:0 0 32px;height:32px;border-radius:10px;display:inline-flex!important;align-items:center;justify-content:center;font-size:12px!important;font-weight:900!important;color:' + RED + '!important;background:rgba(226,0,26,.08)!important;margin:0!important}'
  + D + '.ev-num{background:rgba(226,0,26,.18)!important;color:#FF6B7B!important}'
  + P + '.ev-row.ev-head>*{border-top:0!important;padding-top:26px!important;padding-bottom:18px!important;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:8px}'
  + P + '.ev-head .ev-aspect{font-size:12px!important;letter-spacing:.12em;text-transform:uppercase;opacity:.5}'
  + P + '.ev-tag{font-size:19px!important;font-weight:800!important;letter-spacing:-.02em;color:inherit!important;background:none!important;padding:0!important;text-transform:none!important}'
  + D + '.ev-tag{color:#fff!important}'
  + P + '.ev-head .ev-with{flex-direction:column-reverse!important}'
  + P + '.ev-badge{display:inline-flex!important;align-items:center;height:26px;padding:0 12px!important;border-radius:999px!important;background:' + RED + '!important;color:#fff!important;font-size:11px!important;font-weight:800!important;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 6px 16px rgba(226,0,26,.35);margin:0!important}'
  + P + '.ev-cell{font-size:14.5px!important;line-height:1.5!important;color:inherit!important}'
  + P + '.ev-cell.ev-alone{opacity:.72}'
  + D + '.ev-cell{color:#fff!important}'
  + P + '.ev-cell.ev-with{font-weight:700}'
  + P + '.ev-ic{flex:0 0 22px!important;width:22px!important;height:22px!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;margin:0!important}'
  + P + '.ev-ic svg{width:12px!important;height:12px!important}'
  + P + '.ev-ic.ev-x{background:rgba(226,0,26,.1)!important;color:' + RED + '!important}'
  + P + '.ev-ic.ev-c{background:#16A34A!important;color:#fff!important;box-shadow:0 4px 10px rgba(22,163,74,.3)}'
  + P + '.ev-row:last-child>*{padding-bottom:24px!important}'
  + P + '.ev-table.ca-rv .ev-row:not(.ev-head)>*{opacity:0;transform:translateY(14px)}'
  + P + '.ev-table.ca-rv .ev-row.in>*{opacity:1;transform:none}'
  + P + '.ev-table.ca-rv .ev-row.in>.ev-alone{transition-delay:.08s}' + P + '.ev-table.ca-rv .ev-row.in>.ev-with{transition-delay:.16s}'
  + P + '.ev-table.ca-rv .ev-row.in>.ev-alone{opacity:.72}'
  + '@media(max-width:860px){'
  + P + '.ev-table{display:flex!important;flex-direction:column;gap:12px}'
  + P + '.ev-table::before,' + P + '.ev-table::after{display:none}'
  + P + '.ev-row{display:grid!important;grid-template-columns:1fr;border-radius:22px;padding:6px 0;' + HL + '}'
  + D + '.ev-row{' + HD + '}'
  + P + '.ev-row.ev-head{display:none!important}'
  + P + '.ev-row>*{border-top:0!important;padding:10px 18px!important}'
  + P + '.ev-row>.ev-aspect{padding:14px 18px 6px!important;font-size:16px!important}'
  + P + '.ev-cell.ev-with{margin:4px 10px 10px;border-radius:14px;background:rgba(226,0,26,.06)!important;padding:12px 12px!important}'
  + D + '.ev-cell.ev-with{background:rgba(226,0,26,.14)!important}'
  + P + '.ev-cell.ev-alone::before{content:"Egyedül";flex:none;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.6;order:-1;width:100%;margin-bottom:-6px}'
  + P + '.ev-cell.ev-with::before{content:"CarAdvance";flex:none;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:' + RED + ';order:-1;width:100%;margin-bottom:-6px}'
  + P + '.ev-cell{flex-wrap:wrap}' + P + '.ev-cell>span:last-child{flex:1;min-width:0}'
  + P + '.ev-table.ca-rv .ev-row:not(.ev-head)>*{opacity:1!important;transform:none!important}' + P + '.ev-table.ca-rv .ev-row>.ev-alone{opacity:.72!important}'
  + '}'
  // ---- kulcsszámok
  + P + '.ev-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px!important;max-width:1140px!important;margin-top:28px!important}'
  + P + '.ev-stat{border-radius:24px!important;padding:22px 18px!important;text-align:center;' + HL + '}'
  + D + '.ev-stat{' + HD + 'color:#fff}'
  + P + '.ev-stat b{display:block;font-size:clamp(28px,3vw,38px)!important;font-weight:900!important;letter-spacing:-.03em;color:' + RED + '!important;font-variant-numeric:tabular-nums;line-height:1.1}'
  + D + '.ev-stat b{color:#FF4258!important}'
  + P + '.ev-stat span{display:block;font-size:13.5px!important;opacity:.65;margin-top:6px;color:inherit!important}'
  + '@media(max-width:760px){' + P + '.ev-stats{grid-template-columns:1fr 1fr;gap:10px!important}' + P + '.ev-stat{padding:16px 12px!important;border-radius:20px!important}}'
  + P + '.ev-note{display:none!important}'
  + P + '.ca-fn{max-width:1140px;margin:16px auto 0;padding:0 24px;box-sizing:border-box}'
  + P + '.ca-fn details{border-radius:18px;background:rgba(18,19,23,.035)}'
  + D + '.ca-fn details{background:rgba(255,255,255,.05);color:#fff}'
  + P + '.ca-fn summary{list-style:none;cursor:pointer;padding:13px 18px!important;font-size:13px!important;font-weight:800!important;display:flex!important;align-items:center;justify-content:space-between;gap:10px;opacity:.75;color:inherit!important;background:none!important}'
  + P + '.ca-fn summary::-webkit-details-marker{display:none}'
  + P + '.ca-fn p{margin:0!important;padding:0 18px 14px!important;font-size:12.5px!important;line-height:1.6!important;opacity:.7;color:inherit!important}'
  + '@media(max-width:560px){' + P + '.ca-fn{padding:0 16px}}'
  // ---- záró kártya (világosban világos)
  + P + '.ev-cta{position:relative;overflow:hidden;border-radius:30px!important;padding:34px 40px!important;color:#121317!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.12),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.8),rgba(255,255,255,.5)),rgba(255,255,255,.6)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.06),0 30px 70px rgba(226,0,26,.12)!important}'
  + D + '.ev-cta{color:#fff!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.35),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(0,0,0,.4)!important}'
  + P + '.ev-cta h2{font-size:clamp(24px,2.6vw,32px)!important;font-weight:800!important;letter-spacing:-.025em;color:inherit!important}'
  + P + '.ev-cta p{color:inherit!important;opacity:.75}'
  + P + '.ev-cta .btn{height:52px;padding:0 26px!important;border-radius:999px!important;background:' + RED + '!important;color:#fff!important;border:0!important;font-weight:800!important;box-shadow:0 14px 30px rgba(226,0,26,.36)!important;display:inline-flex!important;align-items:center}'
  + '@media(max-width:560px){' + P + '.ev-cta{padding:24px 18px!important;border-radius:24px!important}}'
  // ---- jó tudni
  + P + '.ev-seo{max-width:1000px!important;border-radius:30px;padding:36px 40px!important;' + HL + '}'
  + D + '.ev-seo{' + HD + 'color:#fff}'
  + P + '.ev-seo p{font-size:16px!important;line-height:1.7!important;opacity:.82;color:inherit!important}'
  + P + '.ev-seo .kw,' + P + '.ev-seo a{color:' + RED + '!important;font-weight:700;background:none!important}'
  + D + '.ev-seo .kw,' + D + '.ev-seo a{color:#FF6B7B!important}'
  + '@media(max-width:560px){' + P + '.ev-seo{padding:24px 18px!important;border-radius:24px}}'
  // ---- GYIK
  + P + '.faq,' + P + '.ev-faq{display:flex!important;flex-direction:column;gap:12px}'
  + P + 'details.ca-q{border-radius:20px!important;overflow:hidden;margin:0!important;' + HL + '}'
  + D + 'details.ca-q{' + HD + '}'
  + P + 'details.ca-q summary{padding:20px 22px!important;font-weight:700!important;font-size:16px!important;display:flex!important;align-items:center;justify-content:space-between;gap:14px;color:inherit!important;background:none!important}'
  + D + 'details.ca-q summary{color:#fff!important}'
  + P + 'details.ca-q>p,' + P + 'details.ca-q>div{padding:0 22px 20px!important;margin:0!important;opacity:.78;line-height:1.6;color:inherit!important}'
  + D + 'details.ca-q>p,' + D + 'details.ca-q>div{color:rgba(255,255,255,.8)!important}'
  + P + '.ca-cut>details.ca-x{display:none!important}'
  + P + '.ca-more{align-self:center;margin-top:4px;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}'
  + D + '.ca-more{border-color:rgba(255,255,255,.16);color:#fff}'
  + P + '.ca-more svg{width:16px;height:16px;transition:transform .3s}'
  + P + ':not(.ca-cut)>.ca-more svg{transform:rotate(180deg)}'
  + '@media(prefers-reduced-motion:reduce){' + P + '.ev-table.ca-rv .ev-row>*{opacity:1!important;transform:none!important;transition:none}}'
  + '</style>';

const JS = '<script id="ca-ev-js">' + String.raw`(function(){
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var root=$("section.ev");if(!root||root.__e)return;root.__e=1;document.documentElement.classList.add("ca-ev");
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}
var DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
var sd=$("section.hero .scrolldown",root);if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$("section.hero",root).nextElementSibling;if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})}
// összevetés: soronként beúszás
var tb=$(".ev-table",root),RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(tb&&!RM&&"IntersectionObserver" in window&&innerWidth>860){tb.classList.add("ca-rv");var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -12% 0px"});
$$(".ev-row:not(.ev-head)",tb).forEach(function(r){var c=r.querySelector(".ev-aspect");if(c){var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){r.classList.add("in");o.disconnect()}})},{rootMargin:"0px 0px -12% 0px"});o.observe(c)}})}
// kulcsszámok felpörgetése
var stats=$$(".ev-stat b",root);function spin(b){var m=b.textContent.trim().match(/^(\d+)(%?)$/);if(!m)return;var to=+m[1],rest=m[2],t0=performance.now(),D=900;(function f(n){var x=Math.min(1,(n-t0)/D),e=1-Math.pow(1-x,3);b.textContent=Math.round(to*e)+rest;if(x<1)requestAnimationFrame(f)})(t0)}
if(!RM&&"IntersectionObserver" in window){var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){stats.forEach(spin);so.disconnect()}})},{threshold:.5});var sb=$(".ev-stats",root);if(sb)so.observe(sb)}
// lábjegyzetek lenyitható dobozban
var nt=$(".ev-note",root);if(nt&&!$(".ca-fn",root)){var fn=el("div","ca-fn",'<details><summary>Lábjegyzetek (¹–⁵)'+DN+'</summary><p>'+nt.innerHTML+'</p></details>');nt.parentNode.insertBefore(fn,nt.nextSibling)}
// GYIK: első 4
var qs=$$("details",root).filter(function(d){return !d.closest(".ca-fn")});qs.forEach(function(d){d.classList.add("ca-q")});
var box=qs.length?qs[0].parentNode:null;if(box&&qs.length>5&&!box.classList.contains("ca-cut")){var ds=qs.filter(function(d){return d.parentNode===box});ds.forEach(function(d,k){if(k>=4)d.classList.add("ca-x")});box.classList.add("ca-cut");box.style.display="flex";box.style.flexDirection="column";box.style.gap="12px";var mo=el("button","ca-more");mo.type="button";var lbl=function(){mo.innerHTML=(box.classList.contains("ca-cut")?"Mind a "+ds.length+" kérdés":"Kevesebb kérdés")+DN};lbl();mo.addEventListener("click",function(){box.classList.toggle("ca-cut");lbl()});box.appendChild(mo)}
else if(box){box.style.display="flex";box.style.flexDirection="column";box.style.gap="12px"}
function cln(){$$(".ev-wrap,.ev-wrap *,.ev-stats,.ev-stats *,.ev-cta,.ev-cta *,.ev-seo,.ev-seo *,details,details *",root).forEach(function(x){if(x.tagName==="IMG")return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

export function apply(h) {
  if (h.indexOf('id="ca-ev-css"') > -1 || h.indexOf('class="ev-table"') < 0) return null;
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + TITLE + '</title>');
  h = h.replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, '$1' + TITLE + '$2');
  // a tulajdonos döntése: az átfutás 5–14 nap
  h = h.split('10–21 nap').join('5–14 nap');
  if (h.indexOf('"BreadcrumbList"') < 0) h = h.replace('</head>', () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Autó rendelés', item: SITE + '/auto-rendeles/' },
    { '@type': 'ListItem', position: 3, name: 'Egyedül vagy velünk?', item: SITE + '/egyedul-vagy-velunk/' },
  ] }) + '</script></head>');
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-ev] nincs', FILE); process.exit(0); }
  const o = apply(fs.readFileSync(FILE, 'utf8'));
  if (!o) console.log('[hu-ev] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-ev] egyedül vagy velünk: letisztult nézet'); }
}
