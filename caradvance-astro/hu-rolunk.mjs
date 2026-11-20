// hu-rolunk.mjs — Rólunk oldalak (HU): Miért a CarAdvance?, Referenciák, Minőségbiztosítás, Átláthatóság
// Csak dizájn: a tartalom, a szöveg, a linkek és a SEO (cím, leírás, strukturált adatok) változatlan.
// · olvasható fejléc, élénk piros kiemelés, Görgess; · kártyák a főoldali üveg-stílusban (világos) / sötét kártyák (sötét mód)
// · számozott lépések és ikonok piros jelvényen; összehasonlító tábla kártyában, CarAdvance-oszlop kiemelve
// · tartalomjegyzék/chipek pirulákon; GYIK egységes kártyákon, rövidítve (4 + mind); záró kártyák világosban világosak
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const PAGES = ['miert-mi', 'referenciak', 'minosegbiztositas', 'atlathatosag'];

const P = 'html.ca-rol body main ';
const D = 'html.ca-rol.ca-dark body main ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.12),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LCTA = 'color:#121317!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.12),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.8),rgba(255,255,255,.5)),rgba(255,255,255,.6)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.06),0 30px 70px rgba(226,0,26,.12)!important;';
const DCTA = 'color:#fff!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.35),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(0,0,0,.4)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';
const BADGE = 'color:#fff!important;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#B80015)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 8px 18px rgba(226,0,26,.28)!important;border:0!important;';

const CARDS = ['.mm-stat', '.mm-check', '.zz-media', '.tq-card', '.tq-co-card', '.tq-flow-c', '.tq-col', '.tq-fact', '.tq-doc', '.ref-rev', '.ref-google', '.ref .media', '.ref-track>article', '.ref-track>a', '.ref-track>div'];
const C = (s) => CARDS.map((c) => s + c).join(',');

const CSS = '<style id="ca-rol-css">'
  // ---- fejléc
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.5) saturate(1.05)}'
  + P + 'section.hero .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.12))!important}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caRBob 1.8s ease-in-out infinite}'
  + '@keyframes caRBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + P + '.tq-chips>*{border-radius:999px!important;background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.22)!important;color:#fff!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}'
  + P + '.section,' + P + '.tq-sec{background:transparent!important}'
  + P + '.sec-title{font-size:clamp(28px,3.2vw,42px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.1!important}'
  + D + '.sec-title{color:#fff!important}' + D + '.sec-intro{color:rgba(255,255,255,.7)!important}'
  + P + '.eyebrow{display:inline-flex!important;align-items:center;height:28px;padding:0 12px!important;border-radius:999px!important;background:rgba(226,0,26,.08)!important;color:' + RED + '!important;font-size:11.5px!important;font-weight:800!important;letter-spacing:.12em!important}'
  + D + '.eyebrow{background:rgba(226,0,26,.18)!important;color:#FF6B7B!important}'
  // ---- kártyák
  + C(P) + '{border-radius:24px!important;' + HL + '}'
  + C(D) + '{' + HD + 'color:#fff!important}'
  + P + '.zz-media{overflow:hidden;padding:0!important}'
  + P + '.zz-media img{border-radius:inherit}'
  + P + ':is(.mm-stat,.tq-card,.tq-doc,.tq-fact,.ref-rev){transition:transform .35s cubic-bezier(.2,.8,.2,1)!important}'
  + P + ':is(.mm-stat,.tq-card,.tq-doc,.tq-fact):hover{transform:translateY(-3px)}'
  + P + '.mm-stat-n{color:' + RED + '!important;font-weight:900!important;letter-spacing:-.03em}'
  + D + '.mm-stat-n{color:#FF4258!important}'
  + P + ':is(.mm-stat-i,.mm-check-ic,.zz-ico,.tq-ico,.mm-ico){border-radius:13px!important;' + BADGE + '}'
  + P + ':is(.mm-stat-i,.mm-check-ic,.zz-ico,.tq-ico,.mm-ico) svg{stroke:#fff!important;color:#fff!important}'
  + P + ':is(.zz-num,.tq-card-n){border-radius:11px!important;' + BADGE + '}'
  + P + '.tq-steps>li::before,' + P + '.tq-steps .n,' + P + '.tq-steps>li>span:first-child{border-radius:11px!important;' + BADGE + '}'
  + P + '.zz-head h3,' + P + '.tq-card-h h3,' + P + '.tq-co-head h3{font-weight:800!important;letter-spacing:-.02em}'
  + D + ':is(.zz-text,.tq-card,.tq-co-card,.tq-flow-c,.tq-col,.tq-fact,.tq-doc,.mm-check,.mm-stat) :is(h3,b,strong,dt){color:#fff!important}'
  + D + ':is(.zz-text,.tq-card,.tq-co-card,.tq-flow-c,.tq-col,.tq-fact,.tq-doc,.mm-check,.mm-stat) :is(p,li,dd,span:not([class*=ico]):not([class*=-n])){color:rgba(255,255,255,.75)!important}'
  + P + ':is(.zz-link,.tq-lnk){color:' + RED + '!important;font-weight:800!important}'
  + D + ':is(.zz-link,.tq-lnk){color:#FF6B7B!important}'
  + P + '.tq-flow-c.hl{border:1.5px solid rgba(226,0,26,.5)!important;box-shadow:0 0 0 4px rgba(226,0,26,.07),0 24px 60px rgba(226,0,26,.14)!important}'
  + P + '.tq-flow-arrow{color:' + RED + '!important}'
  + P + '.tq-yes{background:linear-gradient(180deg,rgba(22,163,74,.09),rgba(22,163,74,.03))!important;border:0!important;box-shadow:none!important}'
  + P + '.tq-no{background:linear-gradient(180deg,rgba(226,0,26,.08),rgba(226,0,26,.02))!important;border:0!important;box-shadow:none!important}'
  + D + '.tq-yes{background:linear-gradient(180deg,rgba(34,197,94,.14),rgba(34,197,94,.04))!important}'
  + D + '.tq-no{background:linear-gradient(180deg,rgba(226,0,26,.16),rgba(226,0,26,.04))!important}'
  + P + '.tq-callout{border-radius:20px!important;' + LCTA + '}'
  + D + '.tq-callout{' + DCTA + '}'
  + P + '.tq-callout *{color:inherit!important}'
  // ---- összehasonlító tábla
  + P + '.mm-cmp-wrap{border-radius:26px!important;overflow:auto!important;padding:6px!important;' + HL + '}'
  + D + '.mm-cmp-wrap{' + HD + '}'
  + P + '.mm-cmp{border-collapse:separate!important;border-spacing:0!important;background:none!important;width:100%}'
  + P + '.mm-cmp :is(th,td){border:0!important;border-bottom:1px solid ' + LN + '!important;background:none!important;padding:13px 16px!important;color:inherit!important}'
  + D + '.mm-cmp :is(th,td){border-bottom-color:rgba(255,255,255,.08)!important;color:#fff!important}'
  + P + '.mm-cmp tr:last-child>*{border-bottom:0!important}'
  + P + '.mm-cmp thead th{font-size:12px!important;font-weight:800!important;letter-spacing:.06em;text-transform:uppercase;opacity:.6}'
  + P + '.mm-cmp :is(th,td):nth-child(2){background:rgba(226,0,26,.06)!important;font-weight:700}'
  + D + '.mm-cmp :is(th,td):nth-child(2){background:rgba(226,0,26,.14)!important}'
  + P + '.mm-cmp thead th:nth-child(2){opacity:1;color:#fff!important;background:' + RED + '!important;border-radius:14px 14px 0 0}'
  // ---- tartalomjegyzék, morzsamenü
  + P + '.tq-toc{border-radius:999px!important;' + HL + '}'
  + D + '.tq-toc{' + HD + '}'
  + P + '.tq-toc a{border-radius:999px!important;color:inherit!important;background:transparent!important;border:1px solid ' + LN + '!important;font-weight:700!important}'
  + D + '.tq-toc a{border-color:rgba(255,255,255,.14)!important;color:#fff!important}'
  + P + '.tq-toc a:hover{background:' + RED + '!important;border-color:' + RED + '!important;color:#fff!important}'
  // ---- Referenciák: vélemények, autók, nyilak
  + P + '.ref-rev-stars,' + P + '.ref-stars{color:#F5B301!important}'
  + P + '.ref-g-link{color:' + RED + '!important;font-weight:800!important}'
  + D + '.ref-rev :is(.ref-rev-text,.ref-rev-id span){color:rgba(255,255,255,.75)!important}' + D + '.ref-rev .ref-rev-id b{color:#fff!important}'
  + P + '.ref-nav{border-radius:50%!important;' + HL + '}'
  + D + '.ref-nav{' + HD + 'color:#fff!important}'
  + P + '.ref-more{border-radius:999px!important}'
  + P + '.price{color:' + RED + '!important;font-weight:900!important}' + D + '.price{color:#FF4258!important}'
  + P + '.cbtn{border-radius:12px!important}'
  // ---- GYIK
  + P + 'details{border-radius:20px!important;overflow:hidden;' + HL + '}'
  + D + 'details{' + HD + '}'
  + P + 'details>summary{padding:20px 22px!important;font-weight:700!important;font-size:16px!important;color:inherit!important;background:none!important}'
  + D + 'details>summary{color:#fff!important}'
  + P + 'details>:not(summary){color:inherit!important}'
  + D + 'details>:not(summary){color:rgba(255,255,255,.8)!important}'
  + P + '.ca-cut>details.ca-x{display:none!important}'
  + P + '.ca-more{align-self:center;margin:6px auto 0;display:flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}'
  + D + '.ca-more{border-color:rgba(255,255,255,.16);color:#fff}'
  + P + '.ca-more svg{width:16px;height:16px;transition:transform .3s}'
  + P + ':not(.ca-cut)>.ca-more svg{transform:rotate(180deg)}'
  // ---- záró kártyák: világosban világos
  + P + ':is(.el-cta,.tq-cta,.ref-cta){border-radius:30px!important;' + LCTA + '}'
  + D + ':is(.el-cta,.tq-cta,.ref-cta){' + DCTA + '}'
  + P + ':is(.el-cta,.tq-cta,.ref-cta) :is(h2,h3,p,b,strong,a:not([class*=btn]):not(.tq-cta-b)){color:inherit!important}'
  + P + ':is(.el-cta,.tq-cta,.ref-cta) p{opacity:.75}'
  + P + ':is(.el-cta,.tq-cta,.ref-cta) :is(.btn-white,.btn-light,.tq-cta-b:not(.red):not(.primary)){background:transparent!important;border:1px solid ' + LN + '!important;color:inherit!important}'
  + D + ':is(.el-cta,.tq-cta,.ref-cta) :is(.btn-white,.btn-light,.tq-cta-b:not(.red):not(.primary)){border-color:rgba(255,255,255,.2)!important}'
  + P + '.el-cta :is(.btn-white,.btn-light){background:' + RED + '!important;border:0!important;color:#fff!important;box-shadow:0 12px 26px rgba(226,0,26,.35)!important}'
  + '</style>';

const JS = '<script id="ca-rol-js">' + String.raw`(function(){var H=document.documentElement;if(H.__rl)return;H.__rl=1;H.classList.add("ca-rol");
var DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
var sd=document.querySelector("main section.hero .scrolldown");if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var h=document.querySelector("main section.hero"),t=h&&h.nextElementSibling;while(t&&t.offsetHeight<40)t=t.nextElementSibling;if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})}
// GYIK: első 4 látszik
var groups=[];[].forEach.call(document.querySelectorAll("main details"),function(d){var p=d.parentNode;if(groups.indexOf(p)<0)groups.push(p)});
groups.forEach(function(box){var ds=[].filter.call(box.children,function(x){return x.tagName==="DETAILS"});if(ds.length<=5)return;ds.forEach(function(d,k){if(k>=4)d.classList.add("ca-x")});box.classList.add("ca-cut");var mo=document.createElement("button");mo.type="button";mo.className="ca-more";mo.setAttribute("data-dm-skip","1");var lbl=function(){mo.innerHTML=(box.classList.contains("ca-cut")?"Mind a "+ds.length+" kérdés":"Kevesebb kérdés")+DN};lbl();mo.addEventListener("click",function(){box.classList.toggle("ca-cut");lbl()});box.appendChild(mo);
if(location.hash){var t=document.getElementById(location.hash.slice(1));if(t&&box.contains(t))box.classList.remove("ca-cut")}});

})();</script>`;

export function apply(h) {
  if (!/<html[^>]*\slang="hu"/.test(h) || h.indexOf('id="ca-rol-css"') > -1) return null;
  h = h.replace('</head>', () => CSS + '</head>');
  return h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  for (const slug of PAGES) {
    const f = path.join(DIST, slug, 'index.html');
    if (!fs.existsSync(f)) { console.log('[hu-rolunk] nincs', f); continue; }
    const o = apply(fs.readFileSync(f, 'utf8'));
    if (o) { fs.writeFileSync(f, o); console.log('[hu-rolunk]', slug); }
  }
}
