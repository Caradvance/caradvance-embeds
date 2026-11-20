// hu-auto.mjs — eladó/eladott autók adatlapja (HU, /auto/<autó>/): az eddigi oldalak prémium stílusában
// · galéria lekerekítve, finom árnyékkal; bélyegképek pirulás kiemeléssel
// · ár-panel üvegkártyán, kiemelt ár, piros „Ajánlatkérés” gomb; panelek és tartalmi kártyák üvegen (sötétben sötét kártya piros fénnyel)
// · áttekintő ikonok piros körben, felszereltség pipás sorokban, „Miért tőlünk” pipák pirosan
// · elkelt autónál finom figyelmeztető kártya; hasonló autók kártyái emelkedő hoverrel
// Tartalomhoz, képekhez, SEO-hoz nem nyúl. Idempotens, csak a magyar oldalak.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';

const P = 'html.ca-au body ';
const D = 'html.ca-au.ca-dark body ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.14),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';
const CHK = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E")';
const W = '.wrap ';

const CSS = '<style id="ca-au-css">'
  + P + W + '.crumb{font-size:13.5px!important;opacity:.75}'
  + P + W + '.crumb a{color:inherit!important}'
  // galéria
  + P + W + '.gallery .stage{border-radius:28px!important;overflow:hidden;box-shadow:0 30px 70px rgba(18,19,23,.18)!important}'
  + P + W + '.gallery .nav-btn{width:46px!important;height:46px!important;border-radius:50%!important;background:rgba(255,255,255,.75)!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.9)!important;color:#121317!important;font-size:22px!important;box-shadow:0 10px 24px rgba(0,0,0,.18)!important;transition:transform .25s,background .25s,color .25s}'
  + P + W + '.gallery .nav-btn:hover{background:' + RED + '!important;color:#fff!important;transform:scale(1.06)}'
  + P + W + '.gallery .counter{background:rgba(18,19,23,.6)!important;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-radius:999px!important;font-weight:700}'
  + P + W + '.thumbs img{border-radius:14px!important;transition:transform .25s,opacity .25s;opacity:.72}'
  + P + W + '.thumbs img:hover{opacity:1;transform:translateY(-2px)}'
  + P + W + '.thumbs img.active{opacity:1;outline:2px solid ' + RED + '!important;outline-offset:2px;border-color:transparent!important}'
  // kártyák, panelek
  + P + W + '.layout .card,' + P + W + '.panel{border-radius:26px!important;' + HL + '}'
  + D + W + '.layout .card,' + D + W + '.panel{' + HD + 'color:#fff!important}'
  + P + W + '.sec-h{font-size:22px!important;letter-spacing:-.02em}'
  // ár-panel
  + P + W + '.side>.panel:first-child{border:1.5px solid rgba(226,0,26,.3)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.05),0 30px 70px rgba(226,0,26,.10)!important}'
  + D + W + '.side>.panel:first-child{border:1.5px solid rgba(255,60,80,.45)!important;box-shadow:0 0 0 4px rgba(226,0,26,.1),0 30px 70px rgba(0,0,0,.5)!important}'
  + P + W + '.ptitle{letter-spacing:-.025em!important;line-height:1.15!important}'
  + P + W + '.side .cond{border-radius:999px!important;padding:5px 12px!important}'
  + P + W + '.side .plabel{margin-top:14px;color:' + RED + '!important;font-weight:800!important;letter-spacing:.1em}'
  + P + W + '.side .price{font-size:clamp(30px,2.6vw,38px)!important;font-weight:900!important;letter-spacing:-.035em!important;font-variant-numeric:tabular-nums}'
  + P + W + '.side .peur{font-weight:700!important}'
  + P + W + '.side .btn{border-radius:999px!important;height:52px;display:flex!important;align-items:center;justify-content:center}'
  + P + W + '.side .btn-primary{background:' + RED + '!important;border-color:' + RED + '!important;color:#fff!important;box-shadow:0 14px 30px rgba(226,0,26,.3)!important}'
  + P + W + '.side .btn-soft{background:transparent!important;border:1px solid ' + LN + '!important;color:inherit!important}'
  + D + W + '.side .btn-soft{border-color:rgba(255,255,255,.16)!important;color:#fff!important}'
  + P + W + '.side .btn-soft:hover{border-color:' + RED + '!important;color:' + RED + '!important}'
  + D + W + '.panel :is(h4,p,.pname,.prole,b,div,li){color:inherit}'
  + P + W + '.why .wc{border-radius:50%!important;background:' + CHK + ' center/11px no-repeat,' + RED + '!important;color:transparent!important;box-shadow:0 5px 12px rgba(226,0,26,.25)}'
  + P + W + '.tmem img{border-radius:50%!important}'
  // áttekintés ikonok
  + P + W + '.iconrow .dot{background:rgba(226,0,26,.09)!important;color:' + RED + '!important;border-radius:50%!important}'
  + D + W + '.iconrow .dot{background:rgba(226,0,26,.18)!important;color:#FF4258!important}'
  + P + W + '.iconrow .v{font-weight:800!important}'
  // műszaki adatok tábla
  + P + W + '.layout .card table td{border-color:' + LN + '!important;background:none!important}'
  + D + W + '.layout .card table td{border-color:rgba(255,255,255,.08)!important;color:#fff!important}'
  + D + W + '.layout .card table td.k{color:rgba(255,255,255,.6)!important}'
  + P + W + '.layout .card table td.v{font-weight:700}'
  // felszereltség
  + P + W + '.dfeat>div{background:none!important;border-color:' + LN + '!important}'
  + D + W + '.dfeat>div{border-color:rgba(255,255,255,.08)!important;color:#fff!important}'
  + P + W + '.showmore{border-radius:999px!important;border:1px solid ' + LN + '!important;background:transparent!important;color:inherit!important;font-weight:700!important;padding:10px 20px!important;transition:border-color .2s,color .2s}'
  + D + W + '.showmore{border-color:rgba(255,255,255,.16)!important;color:#fff!important}'
  + P + W + '.showmore:hover{border-color:' + RED + '!important;color:' + RED + '!important}'
  + P + W + '.cath{color:' + RED + '!important;letter-spacing:.06em}'
  // elkelt figyelmeztetés
  + P + W + '.soldnote{border-radius:20px!important;padding:16px 20px!important;' + HL + 'border:1.5px solid rgba(226,0,26,.3)!important;color:inherit!important}'
  + D + W + '.soldnote{' + HD + 'color:#fff!important;border:1.5px solid rgba(255,60,80,.4)!important}'
  + P + W + '.soldnote a{color:' + RED + '!important;font-weight:800}'
  // hasonló autók
  + P + W + '.rel-h{font-size:clamp(26px,3vw,36px)!important;letter-spacing:-.03em!important}'
  + P + W + '.rel-grid{gap:18px!important}'
  + P + W + '.rel-grid>.card{border-radius:26px!important;overflow:hidden;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + W + '.rel-grid>.card{' + HD + 'color:#fff!important}'
  + P + W + '.rel-grid>.card:hover{transform:translateY(-4px)}'
  + P + W + '.rel-grid>.card .media img{transition:transform .5s cubic-bezier(.2,.8,.2,1)}'
  + P + W + '.rel-grid>.card:hover .media img{transform:scale(1.04)}'
  + P + W + '.rel-grid>.card .price{color:' + RED + '!important;font-weight:900!important}'
  + D + W + '.rel-grid>.card .price{color:#FF4258!important}'
  + P + W + '.rel-grid>.card .cbtn{border-radius:999px!important}'
  + '</style>';

const JS = '<script id="ca-au-js">' + String.raw`(function(){
var d=document.documentElement;if(d.classList.contains("ca-au")||!document.querySelector(".wrap .layout .gallery"))return;d.classList.add("ca-au");
})();</script>`;

export function apply(h) {
  if (h.indexOf('id="ca-au-css"') > -1 || h.indexOf('class="layout"') < 0 || h.indexOf('class="gallery"') < 0 || !/<html[^>]*lang="hu"/.test(h)) return null;
  h = h.replace('</head>', () => CSS + '</head>');
  return h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  let n = 0; const dir = path.join(DIST, 'auto');
  if (fs.existsSync(dir)) for (const s of fs.readdirSync(dir)) {
    const f = path.join(dir, s, 'index.html'); if (!fs.existsSync(f)) continue;
    const o = apply(fs.readFileSync(f, 'utf8')); if (o) { fs.writeFileSync(f, o); n++; }
  }
  console.log('[hu-auto] autó-adatlapok: ' + n);
}
