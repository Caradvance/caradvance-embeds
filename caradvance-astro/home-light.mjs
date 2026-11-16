// Build lépés: a magyar főoldal FEHÉR, letisztult változata (a home-dark.mjs helyett fut).
// Az oldal világos alapon jelenik meg (a készülék sötét módjától függetlenül), a korábbi sötét dizájnelemeket
// (Kínálat színpad, AI-kereső, film, Rólunk, szolgáltatás-képek, CTA) fehér, letisztult stílusra igazítja.
// A hero (videó) és a lábléc sötét marad — keretet adnak az oldalnak. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');

// színek
const BG = '#F6F6F3', CARD = '#FFFFFF', INK = '#121317', MUTED = '#5E616A', LINE = 'rgba(18,19,23,.09)', RED = '#E2001A';
const SH = '0 1px 2px rgba(18,19,23,.04),0 12px 32px rgba(18,19,23,.06)';
const CARDCSS = 'background:linear-gradient(180deg,rgba(255,255,255,.92) 0%,rgba(255,255,255,.72) 55%,rgba(255,255,255,.62) 100%)!important;border:1px solid rgba(255,255,255,.9)!important;'
  + 'box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(18,19,23,.05),0 1px 2px rgba(18,19,23,.04),0 18px 44px rgba(18,19,23,.08)!important;-webkit-backdrop-filter:blur(18px) saturate(170%)!important;backdrop-filter:blur(18px) saturate(170%)!important';
const BTN2 = 'background:#fff!important;color:' + INK + '!important;border:1px solid rgba(18,19,23,.16)!important;box-shadow:none!important';
const L = 'html.ca-light ';
const A = L + '#autoink ';           // Kínálat
const S = L + '#autoink #ca-stg ';   // színpad

const CSS = '<style id="ca-light-css">'
  // alap
  + L + ',' + L + 'body{background:' + BG + '!important;color:' + INK + '}'
  + L + '.cah .sec-title,' + L + 'h2.sec-title{color:' + INK + '}'
  // hero: a videó alja az oldal hátterébe olvad
  + L + 'section.hero:has(+#autoink)::after{display:none!important}'
  + L + 'section.hero:has(+#autoink){border-radius:0 0 28px 28px!important}'

  // ── Kínálat ─────────────────────────────────────────────────────────────
  + A + '{color:' + INK + '}'
  + L + '#autoink.ca-show{background:' + BG + '!important;border:0!important;box-shadow:none!important;padding-bottom:40px!important}'
  + L + '#autoink.ca-show::after,' + L + '#autoink.ca-show::before{display:none!important}'
  + A + '.ca-sh h2,' + A + '.ca-sh-eb{color:' + INK + '!important}' + A + '.ca-sh-eb{color:' + RED + '!important}'
  + A + '.ca-sh p{color:' + MUTED + '!important}'
  + S + '.stg-light{background:radial-gradient(ellipse 50% 60% at 50% 42%,#fff,rgba(255,255,255,0) 70%)!important}'
  + S + '.stg-floor{background:radial-gradient(ellipse 42% 26% at 50% 64%,rgba(18,19,23,.12),transparent 72%)!important}'
  + S + '.stg-floor::after{background:linear-gradient(90deg,transparent,rgba(18,19,23,.14),transparent)!important;box-shadow:none!important}'
  + S + '.stg-cars .stg-car img{filter:drop-shadow(0 22px 18px rgba(18,19,23,.22))!important;-webkit-box-reflect:below 2px linear-gradient(transparent 82%,rgba(255,255,255,.55))!important}'
  + S + '.stg-brand{color:' + INK + '!important}' + S + '.stg-brand img{filter:brightness(0)!important;opacity:.85}' + S + '.stg-brand img[src*="-color"]{filter:none!important;opacity:1}'
  + S + '.stg-model{color:' + INK + '!important}' + S + '.stg-spec{color:' + MUTED + '!important}'
  // fülek + márkák
  + S + '.autok-tabs{background:#fff!important;border:1px solid ' + LINE + '!important;box-shadow:' + SH + '!important}'
  + S + '.autok-tab{color:' + MUTED + '!important}' + S + '.autok-tab:hover{color:' + INK + '!important;background:rgba(18,19,23,.04)!important}'
  + S + '.autok-tab.on{color:#fff!important;background:' + RED + '!important;box-shadow:0 6px 16px rgba(226,0,26,.25)!important}'
  + L + '#autoink.ca-show #ca-stg .cf-br{background:#fff!important;border:1px solid ' + LINE + '!important;box-shadow:none!important;color:' + INK + '!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + L + '#autoink.ca-show #ca-stg .cf-br .cf-l{display:none!important}' + L + '#autoink.ca-show #ca-stg .cf-br .cf-d{display:block!important;opacity:.85}'
  + L + '#autoink.ca-show #ca-stg .cf-br:hover{border-color:rgba(18,19,23,.25)!important;background:#fff!important;transform:translateY(-1px)}'
  + L + '#autoink.ca-show #ca-stg .cf-br.on,' + L + '#autoink.ca-show #ca-stg .cf-br.on:hover{background:' + RED + '!important;border-color:' + RED + '!important;color:#fff!important;box-shadow:0 6px 16px rgba(226,0,26,.25)!important}'
  + L + '#autoink.ca-show #ca-stg .cf-br.on .cf-d{display:none!important}' + L + '#autoink.ca-show #ca-stg .cf-br.on .cf-l{display:block!important;opacity:1}'
  // Cég/Magán
  + A + '.ca-bt{background:#fff!important;border:1px solid ' + LINE + '!important;box-shadow:none!important}'
  + A + '.ca-bt button{color:' + MUTED + '!important;background:transparent!important}' + A + '.ca-bt button small{color:#9a9da4!important}'
  + A + '.ca-bt button.on{background:' + INK + '!important;color:#fff!important}' + A + '.ca-bt button.on small{color:rgba(255,255,255,.65)!important}'
  // adatkártya
  + S + '.stg-card,' + L + '#autoink #ca-stg .stg-card.card.on{' + CARDCSS + ';color:' + INK + '!important}'
  + S + '.stg-card :is(.ca-pv,.price,.sub-title,.title){color:' + INK + '!important}'
  + S + '.stg-card :is(.ca-pe,.sub-dep,.sub-year,.peur,.meta,.year,.cond){color:' + MUTED + '!important}'
  + L + '#autoink.ca-show .ca-pbox{background:' + BG + '!important;border:1px solid rgba(18,19,23,.06)!important;box-shadow:none!important}'
  + L + '#autoink.ca-show :is(.sub-fuel,.sub-avail){background-image:radial-gradient(circle at 12px 50%,transparent 3.6px,#fff 4.2px)!important;color:#3a3d44!important;border:1px solid ' + LINE + '!important;box-shadow:none!important}'
  + S + '.stg-card .ca-row a,' + S + '.stg-card :is(.ca-reszlet,.cbtn,.sub-det){' + BTN2 + '}'
  + S + '.stg-card :is(.ca-reszlet,.cbtn,.sub-det):hover,' + S + '.stg-card .ca-row a:hover{border-color:' + INK + '!important}'
  + L + '#autoink.ca-show .sub-mlogo2{filter:none!important;opacity:1}'
  + S + '.stg-card .ca-cinfo,' + S + '.stg-card .sub-info{filter:invert(.6)}'
  + S + '.stg-card .biz-donate{background:' + BG + '!important;border-color:' + LINE + '!important}'
  // lapozó
  + S + '.stg-ar{background:#fff!important;color:' + INK + '!important;border:1px solid rgba(18,19,23,.14)!important;box-shadow:' + SH + '!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + S + '.stg-ar:hover{border-color:' + INK + '!important}'
  + S + '.stg-ar.stg-n{background:' + RED + '!important;color:#fff!important;border-color:' + RED + '!important;box-shadow:0 8px 20px rgba(226,0,26,.3)!important}'
  + S + '.stg-ar.stg-n:disabled{background:#eee!important;color:#aaa!important;border-color:#e3e3e3!important;box-shadow:none!important}'
  + S + '.stg-dot{background:rgba(18,19,23,.14)!important}' + S + '.stg-dot.on{background:' + RED + '!important;box-shadow:none!important}'
  + S + '.stg-cnt{color:#9a9da4!important}' + S + '.stg-cnt b{color:' + INK + '!important}'
  + S + '.stg-hintpic{color:' + MUTED + '!important;background:#fff!important;border:1px solid ' + LINE + '!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + A + '.autok-panel .ca-note,' + A + '.autok-panel small,' + A + '.autok-panel .fine{color:#9a9da4!important}'

  // ── Videós részek (AI-kereső, autórendelés film) ──────────────────────────
  + L + '.cav-h{color:' + INK + '!important}' + L + '.cav-p{color:' + MUTED + '!important}'
  + L + '.cav-chip{background:#fff!important;border:1px solid ' + LINE + '!important;color:' + INK + '!important}' + L + '.cav-chip:hover{border-color:rgba(18,19,23,.3)!important}'
  + L + '.cav-screen,' + L + '.cav-film{' + CARDCSS + '}'
  + L + '.cav-screen::before,' + L + '.cav-film::before{display:none!important}'
  + L + '.cav-ul li{color:' + MUTED + '!important}' + L + '.cav-ul b{color:' + INK + '!important}'
  + L + '.cav-dur{border-left-color:rgba(255,255,255,.45)!important}'

  // ── Számok (statisztika) ────────────────────────────────────────────────
  + L + '.stats .stat{' + CARDCSS + '}'
  + L + '.stats .stat::before,' + L + '.stats .stat::after{display:none!important}'

  // ── Szolgáltatás-képek: világos stúdió ───────────────────────────────────
  + L + '.cah .svc-media.ca-stage{background:radial-gradient(ellipse 60% 60% at 50% 32%,#fff,#EFEFEB 80%)!important;border-bottom:1px solid ' + LINE + '!important}'
  + L + '.cah .svc-media.ca-stage::after{background:linear-gradient(90deg,transparent,rgba(18,19,23,.12),transparent)!important;box-shadow:none!important}'
  + L + '.cah .svc-media.ca-stage img{filter:drop-shadow(0 14px 12px rgba(18,19,23,.22))!important;-webkit-box-reflect:below -2px linear-gradient(transparent 78%,rgba(255,255,255,.5))!important}'
  + L + '.cah .svc{' + CARDCSS + '}'

  // ── Így dolgozunk ───────────────────────────────────────────────────────
  + L + '#miert .card.value{' + CARDCSS + '}'
  + L + '#miert .card.value::before{display:none!important}'
  + L + '#miert .ic-num{box-shadow:none!important}'
  + L + '#miert [class*="ca-tl"]::before,' + L + '#miert [class*="ca-tl"]::after{box-shadow:none!important}'
  + L + '#rolunk .ca-q,' + L + '#rolunk .ca-q *:not(em){color:' + INK + '!important;opacity:1!important}'

  // ── Rólunk ──────────────────────────────────────────────────────────────
  + L + '#rolunk .ca-qpanel{' + CARDCSS + '}'
  + L + '#rolunk .ca-qpanel::before,' + L + '#rolunk .ca-qpanel::after{display:none!important}'
  + L + '#rolunk .ca-q{color:' + INK + '!important}' + L + '#rolunk .ca-q::before{box-shadow:none!important}'
  + L + '#rolunk .ca-by{color:' + MUTED + '!important}' + L + '#rolunk .ca-by b{color:' + INK + '!important}'
  + L + '#rolunk .ca-qpanel p{color:' + MUTED + '!important}' + L + '#rolunk .ca-qpanel p b,' + L + '#rolunk .ca-qpanel p strong{color:' + INK + '!important}'
  + L + '#rolunk .ca-about-btn{' + BTN2 + '}' + L + '#rolunk .ca-about-btn:hover{border-color:' + INK + '!important}'
  + L + '#rolunk .ca-vrow>div{' + CARDCSS + '}' + L + '#rolunk .ca-vrow>div:hover{border-color:rgba(18,19,23,.18)!important}'
  + L + '#rolunk .ca-vrow b{color:' + INK + '!important}' + L + '#rolunk .ca-vrow span{color:' + MUTED + '!important}'
  + L + '#rolunk .ca-vrow svg{stroke:' + RED + '!important;background:rgba(226,0,26,.07)!important;box-shadow:none!important}'

  // ── GYIK, ajánlatkérés ──────────────────────────────────────────────────
  + L + '#gyik .ca-faq-btn,' + L + '#gyik button.ca-faq-all,' + L + '#gyik .faq-list+button{' + BTN2 + ';border-radius:999px!important}'
  + L + '#ca-cta .ca-tel{' + BTN2 + '}' + L + '#ca-cta .ca-tel svg{stroke:' + INK + '!important;color:' + INK + '!important}'
  + L + '#ca-cta .ca-tel:hover{border-color:' + INK + '!important}'
  // ── prémium elemek világos alapon ────────────────────────────────────────
  // háttér: lágy, halvány fényfoltok, hogy az üvegkártyák „üvegnek” látsszanak
  + L + 'body{background:radial-gradient(900px 600px at 85% 18%,rgba(226,0,26,.05),transparent 70%),radial-gradient(800px 700px at 8% 46%,rgba(18,19,23,.04),transparent 70%),radial-gradient(900px 700px at 90% 74%,rgba(226,0,26,.045),transparent 70%),' + BG + '!important;background-attachment:fixed!important}'
  // fénycsík a szekcióhatárokon (a sötét „A” változat világos párja)
  + ['#szolgaltatasok', '#rolunk', '#velemenyek', '#ca-cta'].map((x) => L + x + '{position:relative}' + L + x + '::after{content:"";position:absolute;left:10%;right:10%;top:0;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(226,0,26,.55) 50%,transparent);box-shadow:0 0 16px 1px rgba(226,0,26,.22)}').join('')
  // színpad: reflektorfény + halvány piros padlófény + vékony piros horizont
  + S + '.stg-light{background:radial-gradient(ellipse 46% 62% at 50% 38%,#fff,rgba(255,255,255,0) 72%)!important}'
  + S + '.stg-floor{background:radial-gradient(ellipse 44% 30% at 50% 62%,rgba(226,0,26,.12),rgba(18,19,23,.05) 45%,transparent 75%)!important}'
  + S + '.stg-floor::after{background:linear-gradient(90deg,transparent,rgba(226,0,26,.45),transparent)!important;box-shadow:0 0 14px rgba(226,0,26,.25)!important}'
  + S + '.autok-tabs,' + S + '.stg-ar:not(.stg-n),' + S + '.stg-hintpic{-webkit-backdrop-filter:blur(14px)!important;backdrop-filter:blur(14px)!important;background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.7))!important;border:1px solid #fff!important;box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(18,19,23,.06),0 10px 26px rgba(18,19,23,.08)!important}'
  + L + '#autoink.ca-show #ca-stg .cf-br:not(.on){background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.7))!important;border:1px solid #fff!important;box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(18,19,23,.06),0 6px 16px rgba(18,19,23,.06)!important}'
  // piros gombok: finom fényes él (mint a sötétben)
  + L + ':is(.stg-ar.stg-n,.autok-tab.on,.cf-br.on,.cav-btn,.sub-btn,.ca-inq,.btn-primary,.autok-more a){box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 22px rgba(226,0,26,.28)!important}'
  // hover-fény a kártyákon (rózsaszín reflektor a kurzor alatt)
  + L + '.ca-spot{position:relative;isolation:isolate}'
  + L + '.ca-spot::after{display:block!important;content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;opacity:0;transition:opacity .35s;background:radial-gradient(380px circle at var(--mx,50%) var(--my,50%),rgba(226,0,26,.09),transparent 50%)!important}'
  + L + '.ca-spot:hover::after{opacity:1}'
  + L + ':is(.cah .svc,#miert .card.value,#rolunk .ca-vrow>div,.stats .stat){transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s!important}'
  + L + ':is(.cah .svc,#miert .card.value,#rolunk .ca-vrow>div,.stats .stat):hover{transform:translateY(-4px);box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(18,19,23,.05),0 26px 60px rgba(18,19,23,.12)!important}'
  // Így dolgozunk: az idővonal feje világít, a számok piros üveggombok
  + L + '#miert .ca-tl-fill{box-shadow:0 0 10px rgba(226,0,26,.45)!important}'
  + L + '#miert .ic-num{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 18px rgba(226,0,26,.25)!important}'
  // Rólunk: idézet-panel halvány piros fénnyel a sarkában
  + L + '#rolunk .ca-qpanel{background:radial-gradient(ellipse 60% 90% at 0% 0%,rgba(226,0,26,.07),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.94),rgba(255,255,255,.74))!important}'
  + L + '#rolunk .ca-vrow svg{background:radial-gradient(circle at 35% 30%,rgba(255,80,95,.22),rgba(226,0,26,.08))!important;box-shadow:inset 0 0 0 1px rgba(226,0,26,.18)!important}'
  // videókeretek: üveg + halvány piros köd alattuk
  + L + '.cav-screen::before,' + L + '.cav-film::before{display:block!important;inset:-30px -20px!important;background:radial-gradient(ellipse 50% 45% at 50% 70%,rgba(226,0,26,.10),transparent 72%)!important}'
  // szolgáltatás-stúdió: halvány piros padlófény
  + L + '.cah .svc-media.ca-stage{background:radial-gradient(ellipse 55% 24% at 50% 86%,rgba(226,0,26,.10),transparent 75%),radial-gradient(ellipse 60% 60% at 50% 32%,#fff,#EFEFEB 80%)!important}'
  + L + '.cah .svc-media.ca-stage::after{background:linear-gradient(90deg,transparent,rgba(226,0,26,.4),transparent)!important;box-shadow:0 0 12px rgba(226,0,26,.2)!important}'
  + '@media(max-width:600px){html.ca-light #autoink .ca-sh h2{font-size:clamp(26px,7.4vw,34px)!important;white-space:normal!important;padding-right:56px}}'
  + '</style>';

try {
  if (!fs.existsSync(FILE)) console.log('[home-light] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-light-css"') > -1) console.log('[home-light] már alkalmazva');
    else {
      h = h.replace(/<head([^>]*)>/i, (m) => m + '<script id="ca-home-light">document.documentElement.classList.add("ca-light");</script>');
      h = h.replace('</head>', CSS + '</head>');
      fs.writeFileSync(FILE, h);
      console.log('[home-light] a magyar főoldal fehér, letisztult változatban');
    }
  }
} catch (e) { console.log('[home-light] hiba:', e.message); }
