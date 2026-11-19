// hu-jot.mjs — Jótékonyság (HU, /jotekonysag/) letisztult megjelenés
// 1 fejléc (élénk piros kiemelés, Görgess középen) · 2 „Miért csináljuk” röviden + Bővebben
// 3 3 lépés összekötött idővonalon · 4 egységes 15% + 15% = 30% kártyák
// 5 projektek: végtelen, megállás nélküli jobbra úszás (0 Ft-os haladásjelző helyett csak a cél)
// 6 szervezetek: logós fülek, egyszerre egy részletes kártya · 7 SEO-szöveg Bővebben · 8 egységes sötét mód.
// Csak a magyar /jotekonysag/ oldal, idempotens. A szervezetek márkaszínei maradnak.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'jotekonysag', 'index.html');

const P = 'html.ca-jot body ';
const D = 'html.ca-jot.ca-dark body ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:rgba(255,255,255,.86)!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';

const CSS = '<style id="ca-jot-css">'
  + P + '.ca-gl{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + D + '.ca-gl{' + CARDD + '}'
  + D + '.ca-gl::after{display:none!important}'
  // ---- 1) fejléc
  + D + 'section.hero.ca-hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video.ca-lv{filter:brightness(.55) saturate(1.05)}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.35)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .sub{max-width:620px!important;margin-left:auto!important;margin-right:auto!important}'
  + P + 'section.hero .hero-ngos{gap:8px!important;margin-bottom:18px!important}'
  + P + 'section.hero .hn-chip{background:rgba(255,255,255,.94)!important;border:0!important;box-shadow:0 4px 14px rgba(0,0,0,.18)!important}'
  + P + 'section.hero .scrolldown{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:28px!important;transform:translateX(-50%)!important;margin:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:4px!important;z-index:3!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caJBob 1.8s ease-in-out infinite}'
  + '@keyframes caJBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}' + P + 'section.hero .cta-row{flex-wrap:nowrap!important;gap:8px!important;justify-content:center}' + P + 'section.hero .cta-row .btn{padding:12px 15px!important;font-size:14px!important;white-space:nowrap}}'
  // ---- közös „Bővebben”
  + P + '.ca-jmore{overflow:hidden;max-height:0;transition:max-height .45s ease}' + P + '.ca-jmore.open{max-height:3000px}'
  + P + '.ca-jmb{display:inline-flex;align-items:center;gap:6px;margin-top:6px;background:none;border:1px solid rgba(18,19,23,.14);border-radius:999px;padding:10px 18px;font-family:inherit;font-weight:600;font-size:13.5px;line-height:1;color:inherit;cursor:pointer}'
  + D + '.ca-jmb{border-color:rgba(255,255,255,.18)}'
  + P + '.ca-jmb i{font-style:normal;transition:transform .3s}' + P + '.ca-jmb.open i{transform:rotate(180deg)}'
  // ---- 3) lépések idővonalon
  + P + '.jot-steps{position:relative;gap:18px!important}'
  + P + '.jot-steps::before{content:"";position:absolute;left:16%;right:16%;top:24px;height:2px;background:linear-gradient(90deg,rgba(226,0,26,0),rgba(226,0,26,.55) 12%,rgba(226,0,26,.55) 88%,rgba(226,0,26,0));z-index:0}'
  + P + '.jot-step{background:none!important;border:0!important;box-shadow:none!important;text-align:center!important;padding:0 10px!important;position:relative;z-index:1}'
  + P + '.jot-step .jot-num{width:48px!important;height:48px!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;margin:0 auto 16px!important;background:#E2001A!important;color:#fff!important;font-size:18px!important;font-weight:800!important;box-shadow:0 0 0 7px #F5F5F7,0 10px 22px rgba(226,0,26,.3)!important}'
  + D + '.jot-step .jot-num{box-shadow:0 0 0 7px #121318,0 0 26px rgba(226,0,26,.45)!important}'
  + P + '.jot-step h3{font-size:17px!important;margin:0 0 6px!important}'
  + P + '.jot-step p{font-size:14px!important;opacity:.68;line-height:1.55!important}'
  + '@media(max-width:860px){' + P + '.jot-steps{display:flex!important;flex-direction:column!important;gap:0!important;padding-left:4px}' + P + '.jot-steps::before{left:27px;right:auto;width:2px;height:auto;top:20px;bottom:40px;background:rgba(226,0,26,.45)}'
  + P + '.jot-step{display:grid!important;grid-template-columns:48px 1fr;column-gap:16px;text-align:left!important;padding:0 0 22px!important}' + P + '.jot-step .jot-num{grid-row:1/3;margin:0!important}' + P + '.jot-step h3{margin-top:12px!important}}'
  // ---- 4) 15 + 15 = 30
  + P + '.sg-card:not(.sg-total){' + CARD + '}'
  + D + '.sg-card:not(.sg-total){' + CARDD + '}'
  // ---- 5) projektek: végtelen jobbra úszás
  + P + '.ca-pjw{position:relative;overflow:hidden;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);margin:0;max-width:100%}'
  + P + '.pj-grid.ca-mq{display:flex!important;flex-wrap:nowrap!important;gap:20px!important;width:max-content!important;max-width:none!important;padding:6px 0 16px!important;margin:0!important;will-change:transform;animation:caJMq var(--dur,60s) linear infinite}'
  + '@keyframes caJMq{from{transform:translate3d(calc(-1 * var(--w)),0,0)}to{transform:translate3d(0,0,0)}}'
  + P + '.pj-grid.ca-mq .pj-card{flex:0 0 320px!important;width:320px!important;border-radius:22px!important;' + CARD + '}'
  + D + '.pj-grid.ca-mq .pj-card{' + CARDD + '}'
  + P + '.pj-grid.ca-mq .pj-card{display:flex!important;flex-direction:column!important}'
  + P + '.pj-grid.ca-mq .pj-body{flex:1 1 auto!important;display:flex!important;flex-direction:column!important}'
  + P + '.pj-grid.ca-mq .pj-nums{margin-top:auto!important}'
  + P + '.pj-grid.ca-mq .pj-card.ca-zero .pj-nums{padding-top:14px}'
  + P + '.pj-card.ca-zero :is(.pj-bar,.pj-pct,.pj-nums strong){display:none!important}'
  + P + '.pj-card.ca-zero .pj-nums span{font-size:13px!important;font-weight:700;opacity:.7}'
  + '@media(max-width:640px){' + P + '.pj-grid.ca-mq .pj-card{flex-basis:270px!important;width:270px!important}}'
  // ---- 6) szervezetek fülekkel
  + P + '.ca-otabs{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:0 auto 22px;max-width:1240px}'
  + P + '.ca-otabs button{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 14px 0 6px;border-radius:999px;border:1px solid ' + LN + ';background:rgba(255,255,255,.86);color:inherit;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap}'
  + D + '.ca-otabs button{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1)}'
  + P + '.ca-otabs button img{width:34px;height:34px;object-fit:contain;border-radius:10px;background:#fff;padding:3px;box-sizing:border-box}'
  + P + '.ca-otabs button:hover{border-color:rgba(18,19,23,.25)}'
  + P + '.ca-otabs button.on{background:#121317;color:#fff;border-color:#121317}'
  + D + '.ca-otabs button.on{background:#fff;color:#121317;border-color:#fff}'
  + P + '.jot-orglist.ca-tabs .ol-item{display:none!important}'
  + P + '.jot-orglist.ca-tabs .ol-item.on{display:grid!important;animation:caJIn .35s ease}'
  + '@keyframes caJIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'
  + P + '.jot-orglist .ol-item{border-radius:26px!important;' + CARD + '}'
  + D + '.jot-orglist .ol-item{' + CARDD + '}'
  + '@media(max-width:640px){' + P + '.ca-otabs{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none;padding:2px 2px 6px}' + P + '.ca-otabs::-webkit-scrollbar{display:none}' + P + '.ca-otabs button{flex:0 0 auto}' + P + '.jot-orglist.ca-tabs .ol-item.on{display:block!important}}'
  + D + '.ol-impact{background:color-mix(in srgb,var(--c) 16%,transparent)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}'
  // ---- záró CTA: világosban lekerekített kártya, sötétben átmenetes (nincs kemény él)
  + P + 'section.jot-cta{max-width:1240px;margin:40px auto 70px!important;border-radius:32px;background:#121317!important;position:relative;overflow:hidden}'
  + P + 'section.jot-cta::before{content:"";position:absolute;inset:auto -10% -60% -10%;height:120%;background:radial-gradient(50% 50% at 50% 50%,rgba(226,0,26,.28),transparent 70%)!important;background-color:transparent!important;pointer-events:none}'
  + P + 'section.jot-cta>*{position:relative}'
  + D + 'section.jot-cta{background:transparent!important;max-width:none;margin:0!important;border-radius:0}'
  + D + 'section.jot-cta::before{inset:10% 15%;height:auto;background:radial-gradient(50% 50% at 50% 55%,rgba(226,0,26,.16),transparent 72%)!important;background-color:transparent!important}'
  + '@media(max-width:1280px){' + P + 'section.jot-cta{margin-left:16px!important;margin-right:16px!important}' + D + 'section.jot-cta{margin:0!important}}'
  + '@media(max-width:820px){' + P + '.splitg .sg-op{transform:none!important;justify-self:center!important;line-height:1!important;height:auto!important;font-size:26px!important;margin:-2px 0!important}}'
  // ---- új sorrend: miért → így működik (3 lépés + 15+15) → szervezetek → projektek → BH → CTA → SEO
  + P + '#miert .jot-why{display:block!important;max-width:820px!important;margin:0 auto!important;text-align:center}'
  + P + '#miert .jot-why>aside.jot-stat{display:none!important}'
  + P + '#miert .jot-why .ca-jmore p{text-align:left}'
  + P + 'section.ca-gone{display:none!important}'
  + P + '.ca-split{margin-top:64px;text-align:center}'
  + P + '.ca-split .eyebrow{display:inline-block}'
  + P + '.ca-split h3{font-size:clamp(22px,2.6vw,30px)!important;font-weight:800!important;letter-spacing:-.02em;margin:8px 0 10px!important}'
  + P + '.ca-split>p{max-width:640px;margin:0 auto!important;opacity:.7;font-size:15px;line-height:1.6}'
  + P + '.ca-split .splitg{margin-top:26px!important}'
  + P + 'section.ca-seo-end{padding-top:40px!important}'
  + '</style>';

const JS = '<script id="ca-jot-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var hero=$("section.jot-hero");if(!hero||hero.__j)return;hero.__j=1;H.classList.add("ca-jot");'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  + 'function more(box,keep){var ps=$$(":scope>p",box);if(ps.length<=keep)return;var m=el("div","ca-jmore");ps.slice(keep).forEach(function(p){m.appendChild(p)});var b=el("button","ca-jmb","Bővebben <i>⌄</i>");b.type="button";b.addEventListener("click",function(){var o=m.classList.toggle("open");b.classList.toggle("open",o);b.firstChild.nodeValue=o?"Kevesebb ":"Bővebben "});box.appendChild(b);box.appendChild(m)}'
  // 1) Görgess
  + 'var sd=$(".scrolldown",hero);if(sd)sd.addEventListener("click",function(e){e.preventDefault();e.stopImmediatePropagation();var t=$("#miert");if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})},true);'
  // 2) Miért csináljuk
  + 'var why=$(".jot-why>div");if(why)more(why,1);'
  // 5) projektek
  + 'var pg=$(".pj-grid");if(pg&&!pg.__m){pg.__m=1;var cards=$$(".pj-card",pg);cards.forEach(function(c){var b=c.querySelector(".pj-bar span");if(b&&/^0%?$/.test((b.style.width||"").trim()))c.classList.add("ca-zero")});'
  + 'var w=el("div","ca-pjw");pg.parentNode.insertBefore(w,pg);w.appendChild(pg);cards.forEach(function(c){var k=c.cloneNode(true);k.setAttribute("aria-hidden","true");$$("a,button",k).forEach(function(a){a.tabIndex=-1});pg.appendChild(k)});pg.classList.add("ca-mq");'
  + 'function sz(){var W=0;cards.forEach(function(c){W+=c.getBoundingClientRect().width+20});pg.style.setProperty("--w",W+"px");pg.style.setProperty("--dur",Math.max(30,W/45)+"s")}sz();addEventListener("resize",sz)}'
  // 6) szervezetek fülekkel
  + 'var ol=$(".jot-orglist");if(ol&&!ol.__t){ol.__t=1;var it=$$(".ol-item",ol);if(it.length>1){var tb=el("div","ca-otabs");tb.setAttribute("role","tablist");it.forEach(function(x,i){var lg=x.querySelector(".ol-logo img"),nm=(x.querySelector("h3")||{}).textContent||"";var b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.innerHTML=(lg?\'<img alt="" src="\'+lg.getAttribute("src")+\'">\':"")+"<span>"+nm.replace(/ (Magyarország|Egyesület|Alapítvány|Országos Gyermekgyógyászati Intézet|Gyermekgyógyászati Intézet|Szeretetszolgálat)$/,"")+"</span>";b.title=nm;b.addEventListener("click",function(){sel(i,true)});tb.appendChild(b)});ol.parentNode.insertBefore(tb,ol);ol.classList.add("ca-tabs");'
  + 'function sel(i,u){it.forEach(function(x,j){x.classList.toggle("on",j===i)});$$("button",tb).forEach(function(b,j){b.classList.toggle("on",j===i);b.setAttribute("aria-selected",j===i)});if(u&&it[i].id)history.replaceState(null,"","#"+it[i].id)}'
  + 'var h=location.hash.slice(1),s=it.findIndex(function(x){return x.id===h});sel(s>-1?s:0,false);'
  + 'addEventListener("hashchange",function(){var k=it.findIndex(function(x){return x.id===location.hash.slice(1)});if(k>-1){sel(k,false);tb.scrollIntoView({behavior:"smooth",block:"start"})}})}}'
  // új sorrend
  + 'var miert=$("#miert"),hog=$("#hogyan"),don=$("#dontes"),pj=$("#projektek"),sz=$("#szervezetek"),secs=$$("main section,section"),seo=null,bh=null,cta=$("section.jot-cta");'
  + 'secs.forEach(function(x){var t=(x.querySelector("h2")||{}).textContent||"";if(/Jótékonyság és autóeladás/.test(t))seo=x;if(/BH Group/.test(t))bh=x});'
  + 'if(hog&&don&&!don.__mv){don.__mv=1;var sg=don.querySelector(".splitg");if(sg){var w=el("div","wrap");hog.appendChild(w);var bx=el("div","ca-split");bx.id="dontes";don.removeAttribute("id");bx.innerHTML=\'<span class="eyebrow">Ketten döntötök</span><h3>A 30%-ról nem mi döntünk — hanem ti</h3><p>A felét (15%) te, az eladó irányítod, a másik felét az autó vevője. Egy autó, két jó döntés.</p>\';bx.appendChild(sg);w.appendChild(bx);don.classList.add("ca-gone")}}'
  + 'if(sz&&pj&&pj.compareDocumentPosition(sz)&4){pj.parentNode.insertBefore(sz,pj);sz.classList.remove("jot-alt");pj.classList.add("jot-alt")}'
  + 'if(bh&&pj)pj.parentNode.insertBefore(bh,pj.nextSibling);'
  + 'if(seo&&cta){cta.parentNode.insertBefore(seo,cta.nextSibling);seo.classList.add("ca-seo-end")}'
  // 7) SEO
  + '$$(".ol-goal-sum").forEach(function(x){var m=x.textContent.match(/^\\s*0 Ft\\s*\\/\\s*(.+)$/);if(m)x.textContent="Cél: "+m[1]});'
  + '$$("section").forEach(function(s){var h2=s.querySelector("h2");if(h2&&/Jótékonyság és autóeladás/.test(h2.textContent)){var box=h2.parentElement;more(box,1)}});'
  + 'setTimeout(function(){$$(".ca-otabs button,.ca-otabs span,.ca-jmb,.jot-num").forEach(function(x){["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})},400);'
  + '})();</script>';

export function apply(h) {
  if (h.indexOf('id="ca-jot-css"') > -1) return h;
  if (h.indexOf('jot-hero') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-jot] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-jot] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-jot] jótékonyság: letisztult nézet'); }
}
