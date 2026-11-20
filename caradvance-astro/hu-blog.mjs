// hu-blog.mjs — CarAdvance Magazin (HU): /blog/ + minden /blog/<cikk>/ — a többi oldallal egységes, prémium nézet
// · KÉPEK: minden borítókép 16:9 arányban jelenik meg (a borítók 16:9-esek), így nem vágódik le az autó;
//   cikk-fejléc asztalon közel teljes 16:9, telefonon a kép teljes egészében felül, a cím alatta (nem rajta)
// · /blog/: olvasható fejléc + Görgess, téma-csempék üvegkártyán, kiemelt cikk és 3 oszlopos rács, világos záró kártya
// · cikk: üveg „Röviden” doboz (világosban világos), táblák kártyában, GYIK kártyák, világos CTA, kapcsolódó cikkek 16:9 képpel
// · SEO változatlan (cím, leírás, strukturált adatok, linkek, szöveg). Idempotens, csak magyar oldalak.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';

const P = 'html.ca-blog body ';
const D = 'html.ca-blog.ca-dark body ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.12),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LIGHTCTA = 'color:#121317!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.12),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.8),rgba(255,255,255,.5)),rgba(255,255,255,.6)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.06),0 30px 70px rgba(226,0,26,.12)!important;';
const DARKCTA = 'color:#fff!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.35),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(0,0,0,.4)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const COMMON = ''
  + P + '.section{background:transparent!important}'
  + P + '.sec-title{font-size:clamp(28px,3.2vw,42px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.1!important}'
  + D + '.sec-title{color:#fff!important}';

// ---- /blog/ (lista)
const CSS_INDEX = '<style id="ca-blog-css">' + COMMON
  + D + 'section.bl section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.bl section.hero video{filter:brightness(.5) saturate(1.05)}'
  + P + 'section.bl section.hero .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.12))!important}'
  + P + 'section.bl section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.bl section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75)!important}'
  + P + 'section.bl section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.bl section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  // témák
  + P + '.bl-cats{gap:14px!important}'
  + P + '.bl-cat-tile{border-radius:24px!important;padding:22px 20px!important;transition:transform .35s cubic-bezier(.2,.8,.2,1)!important;' + HL + '}'
  + D + '.bl-cat-tile{' + HD + 'color:#fff!important}'
  + P + '.bl-cat-tile:hover{transform:translateY(-3px)}'
  + P + '.bl-cat-tile.is-on,' + P + '.bl-cat-tile[aria-pressed="true"]{border:1.5px solid rgba(226,0,26,.55)!important;box-shadow:0 0 0 4px rgba(226,0,26,.08),0 24px 60px rgba(226,0,26,.14)!important}'
  + P + '.bl-cat-ico{width:46px!important;height:46px!important;border-radius:15px!important;display:flex!important;align-items:center;justify-content:center;color:#fff!important;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#B80015)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 10px 22px rgba(226,0,26,.28)!important}'
  + P + '.bl-cat-ico svg{width:22px;height:22px;stroke:#fff!important}'
  + P + '.bl-cat-label{font-weight:800!important;font-size:16px!important}'
  + D + '.bl-cat-label{color:#fff!important}' + D + '.bl-cat-blurb{color:rgba(255,255,255,.65)!important}'
  // kiemelt cikk
  + P + '.bl-feat{border-radius:30px!important;overflow:hidden;align-items:stretch!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.bl-feat{' + HD + 'color:#fff!important}'
  + P + '.bl-feat:hover{transform:translateY(-3px)}'
  + P + '.bl-featimg{aspect-ratio:16/9!important;height:auto!important;min-height:0!important;align-self:center;border-radius:22px!important;margin:12px!important;background-size:cover!important;background-position:center!important}'
  + P + '.bl-feattitle{font-size:clamp(22px,2.2vw,30px)!important;font-weight:800!important;letter-spacing:-.025em;line-height:1.15!important}'
  + D + '.bl-feattitle{color:#fff!important}' + D + '.bl-featexc,' + D + '.bl-meta{color:rgba(255,255,255,.65)!important}'
  + P + '.bl-more{color:' + RED + '!important;font-weight:800!important}'
  // rács
  + P + '.bl-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:18px!important}'
  + P + '.bl-card{border-radius:24px!important;overflow:hidden;display:flex!important;flex-direction:column;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.bl-card{' + HD + 'color:#fff!important}'
  + P + '.bl-card:hover{transform:translateY(-4px)}'
  + P + '.bl-cardimg{display:block!important;aspect-ratio:16/9!important;height:auto!important;min-height:0!important;margin:8px 8px 0!important;border-radius:18px!important;background-size:cover!important;background-position:center!important;transition:transform .5s cubic-bezier(.2,.8,.2,1)}'
  + P + '.bl-cardbody{padding:16px 18px 20px!important}'
  + P + '.bl-cardtitle{font-size:17px!important;font-weight:800!important;line-height:1.3!important;letter-spacing:-.01em}'
  + D + '.bl-cardtitle{color:#fff!important}' + D + '.bl-cardexc{color:rgba(255,255,255,.65)!important}'
  + P + '.bl-cat{color:' + RED + '!important;font-weight:800!important}'
  + D + '.bl-cat{color:#FF6B7B!important}'
  + '@media(max-width:1000px){' + P + '.bl-grid{grid-template-columns:1fr 1fr!important}}'
  + '@media(max-width:640px){' + P + '.bl-grid{grid-template-columns:1fr!important;gap:12px!important}' + P + '.bl-featimg{margin:8px!important;border-radius:18px!important}}'
  // záró kártya
  + P + '.bl-news{border-radius:30px!important;padding:32px 38px!important;' + LIGHTCTA + '}'
  + D + '.bl-news{' + DARKCTA + '}'
  + P + '.bl-news h2{color:inherit!important;font-weight:800!important;letter-spacing:-.025em}'
  + P + '.bl-news p{color:inherit!important;opacity:.75}'
  + P + '.bl-news .btn-white{background:transparent!important;border:1px solid ' + LN + '!important;color:inherit!important}'
  + D + '.bl-news .btn-white{border-color:rgba(255,255,255,.2)!important}'
  + '@media(max-width:560px){' + P + '.bl-news{padding:24px 18px!important;border-radius:24px!important}}'
  + '</style>';

// ---- /blog/<cikk>/
const CSS_POST = '<style id="ca-blog-css">' + COMMON
  // fejléc: a borító (16:9) teljes egészében, lekerekített képként; a cím alatta, jól olvashatóan
  + P + 'article.bp .bp-hero.ca-ed{background-image:none!important;background:transparent!important;min-height:0!important;height:auto!important;display:block!important;padding:calc(var(--navh,80px) + 24px) 24px 10px!important;overflow:visible!important}'
  + P + 'article.bp .bp-hero.ca-ed::before,' + P + 'article.bp .bp-hero.ca-ed::after{display:none!important}'
  + P + 'article.bp .bp-hero.ca-ed .bp-scrim{display:none!important}'
  + P + 'article.bp .ca-cover{display:block;width:min(1120px,100%,calc((100vh - 230px) * 16 / 9));margin:0 auto;aspect-ratio:16/9;border-radius:30px;overflow:hidden;box-shadow:0 30px 70px rgba(18,19,23,.18),0 4px 14px rgba(18,19,23,.08)}'
  + D + 'article.bp .ca-cover{box-shadow:0 30px 70px rgba(0,0,0,.55)}'
  + P + 'article.bp .ca-cover img{width:100%;height:100%;object-fit:cover;display:block}'
  + P + 'article.bp .bp-hero.ca-ed .bp-hwrap{position:relative;max-width:860px!important;margin:34px auto 0!important;padding:0!important;color:#121317!important;text-align:left}'
  + D + 'article.bp .bp-hero.ca-ed .bp-hwrap{color:#fff!important}'
  + P + 'article.bp .bp-hero.ca-ed h1{color:inherit!important;text-shadow:none!important;font-size:clamp(30px,4vw,52px)!important;font-weight:800!important;letter-spacing:-.035em!important;line-height:1.08!important;margin:14px 0 14px!important}'
  + P + 'article.bp .bp-hero.ca-ed .bp-lead{color:inherit!important;opacity:.72;text-shadow:none!important;font-size:18px!important;line-height:1.6!important}'
  + P + 'article.bp .bp-hero.ca-ed :is(.bp-crumb,.bp-crumb a,.bp-meta){color:inherit!important;opacity:.6;text-shadow:none!important}'
  + P + 'article.bp .bp-hero.ca-ed .bp-crumb a:hover{opacity:1;color:' + RED + '!important}'
  + P + 'article.bp .bp-chip{background:' + RED + '!important;color:#fff!important;border-radius:999px!important}'
  + '@media(max-width:760px){' + P + 'article.bp .bp-hero.ca-ed{padding:calc(var(--navh,72px) + 14px) 14px 4px!important}' + P + 'article.bp .ca-cover{border-radius:20px}' + P + 'article.bp .bp-hero.ca-ed .bp-hwrap{margin-top:22px!important;padding:0 4px!important}' + P + 'article.bp .bp-hero.ca-ed h1{font-size:clamp(26px,7vw,32px)!important}' + P + 'article.bp .bp-hero.ca-ed .bp-lead{font-size:16px!important}}'
  // tartalom
  + P + 'article.bp .bp-body{font-size:17px}'
  + P + 'article.bp .bp-body>p,' + P + 'article.bp .bp-body li{line-height:1.75!important}'
  + P + 'article.bp .bp-body h2{font-weight:800!important;letter-spacing:-.025em!important}'
  + D + 'article.bp .bp-body :is(h2,h3){color:#fff!important}'
  + P + 'article.bp .bp-tldr{border-radius:24px!important;padding:24px 26px!important;color:#121317!important;' + HL + 'border-left:0!important}'
  + P + 'article.bp .bp-tldr h3{display:inline-flex!important;align-items:center;height:28px;padding:0 12px;border-radius:999px;background:rgba(226,0,26,.08)!important;color:' + RED + '!important;font-size:12px!important;font-weight:800!important;letter-spacing:.12em;text-transform:uppercase;margin:0 0 12px!important}'
  + P + 'article.bp .bp-tldr p{color:inherit!important;opacity:.85}'
  + P + 'article.bp .bp-tldr a{color:' + RED + '!important}'
  + D + 'article.bp .bp-tldr{' + HD + 'color:#fff!important}'
  + D + 'article.bp .bp-tldr h3{background:rgba(226,0,26,.18)!important;color:#FF6B7B!important}' + D + 'article.bp .bp-tldr a{color:#FF6B7B!important}'
  + P + 'article.bp .bp-body table{border-collapse:separate!important;border-spacing:0!important;width:100%;border-radius:20px!important;overflow:hidden;' + HL + '}'
  + D + 'article.bp .bp-body table{' + HD + '}'
  + P + 'article.bp .bp-body table :is(th,td){border:0!important;border-bottom:1px solid ' + LN + '!important;background:none!important;padding:12px 16px!important;color:inherit!important}'
  + D + 'article.bp .bp-body table :is(th,td){border-bottom-color:rgba(255,255,255,.08)!important;color:#fff!important}'
  + P + 'article.bp .bp-body table tr:last-child>*{border-bottom:0!important}'
  + P + 'article.bp .bp-body table th{font-size:11.5px!important;font-weight:800!important;letter-spacing:.06em;text-transform:uppercase;opacity:.6}'
  + P + 'article.bp .bp-body table tr:last-child td{font-weight:700}'
  + '@media(max-width:640px){' + P + 'article.bp .bp-body table{display:block;overflow-x:auto}}'
  + P + 'article.bp details.bp-faq{border-radius:18px!important;overflow:hidden;margin:0 0 10px!important;' + HL + '}'
  + D + 'article.bp details.bp-faq{' + HD + '}'
  + P + 'article.bp details.bp-faq summary{padding:18px 20px!important;font-weight:700!important;display:flex!important;align-items:center;justify-content:space-between;gap:14px;color:inherit!important;background:none!important}'
  + D + 'article.bp details.bp-faq summary{color:#fff!important}'
  + P + 'article.bp details.bp-faq>:not(summary){padding:0 20px 18px!important;margin:0!important;opacity:.8}'
  + D + 'article.bp details.bp-faq>:not(summary){color:rgba(255,255,255,.8)!important}'
  // CTA világosban világos
  + P + 'article.bp .bp-ctacard{border-radius:30px!important;' + LIGHTCTA + '}'
  + D + 'article.bp .bp-ctacard{' + DARKCTA + '}'
  + P + 'article.bp .bp-ctacard :is(h2,p){color:inherit!important}'
  + P + 'article.bp .bp-ctacard p{opacity:.75}'
  + P + 'article.bp .bp-ctacard .btn-white,' + P + 'article.bp .bp-ctacard a:not(.btn-primary):not(.btn-red){background:transparent!important;border:1px solid ' + LN + '!important;color:inherit!important}'
  + D + 'article.bp .bp-ctacard .btn-white,' + D + 'article.bp .bp-ctacard a:not(.btn-primary):not(.btn-red){border-color:rgba(255,255,255,.2)!important}'
  // kapcsolódó cikkek: 16:9 kép
  + P + 'article.bp .bp-relcard{border-radius:24px!important;overflow:hidden;display:flex!important;flex-direction:column;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + 'article.bp .bp-relcard{' + HD + 'color:#fff!important}'
  + P + 'article.bp .bp-relcard:hover{transform:translateY(-4px)}'
  + P + 'article.bp .bp-relimg{display:block!important;aspect-ratio:16/9!important;height:auto!important;min-height:0!important;margin:8px 8px 0!important;border-radius:18px!important;background-size:cover!important;background-position:center!important}'
  + D + 'article.bp .bp-reltitle{color:#fff!important}'
  + P + 'article.bp .bp-relcat,' + P + 'article.bp .bp-relmore{color:' + RED + '!important;font-weight:800!important}'
  + '</style>';

const JS = '<script id="ca-blog-js">' + String.raw`(function(){var H=document.documentElement;if(H.__cb)return;H.__cb=1;H.classList.add("ca-blog");
var hh=document.querySelector("article.bp .bp-hero");if(hh&&!hh.querySelector(".ca-cover")){var m=(hh.getAttribute("style")||"").match(/url\(['"]?([^'")]+)/);if(m){var t=hh.querySelector("h1");var fig=document.createElement("figure");fig.className="ca-cover";fig.setAttribute("data-dm-skip","1");var im=document.createElement("img");im.src=m[1];im.alt=t?t.textContent.trim():"";im.decoding="async";im.setAttribute("fetchpriority","high");fig.appendChild(im);hh.insertBefore(fig,hh.firstChild);hh.classList.add("ca-ed")}}
var sd=document.querySelector("section.bl section.hero .scrolldown");if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=document.getElementById("temak");if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})}
function cln(){[].forEach.call(document.querySelectorAll(".bl-cats *,.bl-feat *,.bl-grid *,.bl-news,.bl-news *,.bp-body *,.bp-tldr,.bp-ctacard,.bp-ctacard *,.bp-relgrid *"),function(x){var st=x.getAttribute("style")||"";if(x.tagName==="IMG"||st.indexOf("url(")>-1)return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

export function apply(h) {
  if (!/<html[^>]*\slang="hu"/.test(h) || h.indexOf('id="ca-blog-css"') > -1) return null;
  let css = null;
  if (/<section class="bl"[ >]/.test(h)) css = CSS_INDEX;
  else if (/<article class="bp"[ >]/.test(h)) css = CSS_POST;
  if (!css) return null;
  h = h.replace('</head>', () => css + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const root = path.join(DIST, 'blog');
  if (!fs.existsSync(root)) { console.log('[hu-blog] nincs', root); process.exit(0); }
  let n = 0;
  const files = [path.join(root, 'index.html')].concat(fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(root, d.name, 'index.html')));
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const o = apply(fs.readFileSync(f, 'utf8'));
    if (o) { fs.writeFileSync(f, o); n++; }
  }
  console.log('[hu-blog] magazin: ' + n + ' oldal');
}
