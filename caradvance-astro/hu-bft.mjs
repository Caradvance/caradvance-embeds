// hu-bft.mjs — Feltételek és kaució (HU, /berlesi-feltetelek/): letisztult, jól olvasható szerződés-összefoglaló
// · kompakt fejléc a 4 kulcsszámmal (kaució, visszajár, minimum, díjban benne), puha átmenettel az oldalba
// · okos tartalomjegyzék: asztalon ragadós kártya, kiemeli az aktuális fejezetet, olvasási csíkkal;
//   mobilon ragadós „Tartalom” sáv az aktuális fejezet nevével, lenyíló listával
// · fejezetek letisztult kártyákon, számozott fejezetcímek; a táblák kártyasorokként, kiemelt összegekkel
// · „Benne van / Nincs benne” két kártyán zöld pipákkal és piros x-ekkel; a kaució útja számozott idővonalként
// · SEO: márkanév a címben és a megosztásban, BreadcrumbList. A szöveg nem változik. Idempotens, csak a magyar oldal.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'berlesi-feltetelek', 'index.html');
const SITE = 'https://www.caradvance.hu';
const TITLE = 'Tartós bérlet feltételei és kaució — így működik | CarAdvance';

function seo(h) {
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + TITLE + '</title>');
  h = h.replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, '$1' + TITLE + '$2');
  if (h.indexOf('"BreadcrumbList"') < 0) h = h.replace('</head>', () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Tartós bérlet', item: SITE + '/tartos-berlet/' },
    { '@type': 'ListItem', position: 3, name: 'Feltételek és kaució', item: SITE + '/berlesi-feltetelek/' },
  ] }) + '</script></head>');
  return h;
}

const P = 'html.ca-bft body .lg ';
const D = 'html.ca-bft.ca-dark body .lg ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:linear-gradient(#24252A 0%,#1A1B20 48%,#15161A 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.32),inset -1px -1px 1px rgba(255,255,255,.1),inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const CSS = '<style id="ca-bft-css">'
  // ---- kompakt fejléc
  + P + '.lg-hero{position:relative;overflow:hidden;background:radial-gradient(60% 90% at 85% 0%,rgba(226,0,26,.32),transparent 60%),radial-gradient(50% 80% at 0% 100%,rgba(226,0,26,.14),transparent 65%),linear-gradient(160deg,#121317,#1D1F25)!important;padding:calc(var(--navh,80px) + 56px) 24px 120px!important;text-align:center}'
  + P + '.lg-hero::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:120px;background:linear-gradient(180deg,rgba(245,245,247,0),#F5F5F7);background-color:transparent!important;pointer-events:none}'
  + D + '.lg-hero::after{background:linear-gradient(180deg,rgba(13,15,19,0),#0D0F13)!important;background-color:transparent!important}'
  + P + '.lg-hero-in{position:relative;z-index:1;max-width:980px;margin:0 auto}'
  + P + '.lg-kicker{display:inline-flex;align-items:center;height:30px;padding:0 14px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);color:#fff!important;font-size:12px!important;font-weight:800!important;letter-spacing:.12em!important;text-transform:uppercase}'
  + P + '.lg-hero h1{font-size:clamp(34px,4.6vw,58px)!important;font-weight:800!important;letter-spacing:-.035em!important;line-height:1.05!important;margin:18px 0 14px!important;color:#fff!important}'
  + P + '.lg-hero h1 .ca-acc{color:#FF2A40;-webkit-text-fill-color:#FF2A40}'
  + P + '.lg-lead{max-width:640px;margin:0 auto!important;color:rgba(255,255,255,.74)!important;font-size:17px!important;line-height:1.6!important}'
  + P + '.lg-upd{margin:10px 0 0!important;color:rgba(255,255,255,.45)!important;font-size:13px!important}'
  + P + '.lg-hero .bf-sum{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:34px auto 0!important;max-width:980px;background:none!important;border:0!important;padding:0!important;box-shadow:none!important}'
  + P + '.lg-hero .bf-sum>div{text-align:left;padding:18px 18px 16px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04))!important;border:1px solid rgba(255,255,255,.12)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.18)!important;display:flex;flex-direction:column;gap:6px}'
  + P + '.lg-hero .bf-sum b{color:#FF5468!important;font-size:12px!important;font-weight:800!important;letter-spacing:.1em;text-transform:uppercase}'
  + P + '.lg-hero .bf-sum span{color:#fff!important;font-size:15px!important;font-weight:600!important;line-height:1.4}'
  + P + '.lg-hero .bf-sum span em{display:block;font-style:normal;font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:2px}'
  + '@media(max-width:900px){' + P + '.lg-hero .bf-sum{grid-template-columns:1fr 1fr}}'
  + '@media(max-width:560px){' + P + '.lg-hero{padding:calc(var(--navh,80px) + 30px) 16px 90px!important}' + P + '.lg-hero .bf-sum{gap:8px;margin-top:24px!important}' + P + '.lg-hero .bf-sum>div{padding:14px;border-radius:16px}' + P + '.lg-hero .bf-sum span{font-size:13px!important}' + P + '.lg-hero .bf-sum span em{font-size:18px}' + P + '.lg-lead{font-size:15.5px!important}}'
  // ---- elrendezés
  + P + '.lg-body{max-width:1180px!important;grid-template-columns:290px minmax(0,1fr)!important;gap:36px!important;padding:0 24px 80px!important;margin-top:-50px!important;position:relative;z-index:2;background:transparent!important}'
  + '@media(max-width:900px){' + P + '.lg-body{grid-template-columns:1fr!important;padding:0 14px 60px!important;margin-top:-40px!important;gap:0!important}}'
  // ---- okos tartalomjegyzék (asztal)
  + P + '.lg-toc{top:calc(var(--navh,80px) + 22px)!important;border-radius:24px!important;padding:20px 14px 14px!important;max-height:calc(100vh - var(--navh,80px) - 44px);overflow:auto;scrollbar-width:none;' + HL + '}'
  + P + '.lg-toc::-webkit-scrollbar{display:none}'
  + D + '.lg-toc{' + HD + 'color:#fff}'
  + P + '.lg-toc-t{display:flex;align-items:center;justify-content:space-between;padding:0 8px;font-size:12px!important;font-weight:800!important;letter-spacing:.12em;text-transform:uppercase;color:inherit!important;opacity:.6}'
  + P + '.ca-rd{display:block;height:4px;border-radius:4px;background:rgba(18,19,23,.08);margin:12px 8px 10px;overflow:hidden}'
  + D + '.ca-rd{background:rgba(255,255,255,.1)}'
  + P + '.ca-rd i{display:block;height:100%;width:100%;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#FF2A40,' + RED + ');border-radius:4px}'
  + P + '.ca-pct{font-variant-numeric:tabular-nums;letter-spacing:0;color:' + RED + ';opacity:1}'
  + P + '.lg-toc ol{list-style:none!important;margin:0!important;padding:0!important;counter-reset:t}'
  + P + '.lg-toc li{margin:0!important;padding:0!important;counter-increment:t}'
  + P + '.lg-toc li a{position:relative;display:flex!important;gap:10px;align-items:baseline;padding:8px 10px 8px 12px!important;border-radius:12px;font-size:13.5px!important;line-height:1.35;color:inherit!important;opacity:.62;text-decoration:none!important;transition:opacity .2s,background .2s,color .2s}'
  + P + '.lg-toc li a::before{content:counter(t);flex:0 0 18px;font-size:11.5px;font-weight:800;opacity:.7;font-variant-numeric:tabular-nums}'
  + P + '.lg-toc li a:hover{opacity:1;background:rgba(18,19,23,.04)}'
  + D + '.lg-toc li a:hover{background:rgba(255,255,255,.06)}'
  + P + '.lg-toc li a.on{opacity:1;font-weight:800;color:' + RED + '!important;background:rgba(226,0,26,.07)}'
  + D + '.lg-toc li a.on{color:#FF5468!important;background:rgba(226,0,26,.16)}'
  + P + '.lg-toc li a.on::after{content:"";position:absolute;left:0;top:9px;bottom:9px;width:3px;border-radius:3px;background:' + RED + ';background-color:' + RED + '!important}'
  + P + '.lg-toc li a.done{opacity:.85}'
  // ---- mobil tartalom-sáv
  + P + '.ca-mt{display:none}'
  + '@media(max-width:900px){' + P + '.lg-toc{display:none!important}'
  + P + '.ca-mt{display:block;position:sticky;top:calc(var(--navh,72px) + 8px);z-index:30;margin:0 0 14px}'
  + P + '.ca-mt-b{position:relative;width:100%;display:flex;align-items:center;gap:10px;height:52px;padding:0 16px;border-radius:18px;border:0;font-family:inherit;color:inherit;cursor:pointer;text-align:left;' + HL + '-webkit-backdrop-filter:blur(20px) saturate(180%)!important;backdrop-filter:blur(20px) saturate(180%)!important;background-color:rgba(255,255,255,.82)!important}'
  + D + '.ca-mt-b{' + HD + 'color:#fff;background-color:rgba(24,25,30,.92)!important}'
  + P + '.ca-mt-b small{flex:none;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.55}'
  + P + '.ca-mt-b span{flex:1;min-width:0;font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + P + '.ca-mt-b svg{flex:none;width:18px;height:18px;transition:transform .3s}'
  + P + '.ca-mt.op .ca-mt-b svg{transform:rotate(180deg)}'
  + P + '.ca-mt-b i{position:absolute;left:16px;right:16px;bottom:6px;height:3px;border-radius:3px;background:rgba(18,19,23,.08);overflow:hidden}'
  + P + '.ca-mt-b i em{display:block;height:100%;transform-origin:0 50%;transform:scaleX(0);background:' + RED + '}'
  + P + '.ca-mt-l{display:none;margin-top:8px;border-radius:20px;padding:8px;max-height:60vh;overflow:auto;' + HL + 'background-color:rgba(255,255,255,.96)!important}'
  + D + '.ca-mt-l{' + HD + 'color:#fff}'
  + P + '.ca-mt.op .ca-mt-l{display:block;animation:caTIn .25s ease}'
  + '@keyframes caTIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}'
  + P + '.ca-mt-l a{display:flex;gap:10px;padding:11px 12px;border-radius:12px;font-size:14.5px;color:inherit;text-decoration:none;opacity:.75}'
  + P + '.ca-mt-l a b{flex:0 0 22px;font-size:12px;opacity:.6}'
  + P + '.ca-mt-l a.on{opacity:1;color:' + RED + ';background:rgba(226,0,26,.07);font-weight:700}'
  + '}'
  // ---- fejezetek
  + P + '.lg-doc{background:transparent!important;padding:0!important;border:0!important;box-shadow:none!important;max-width:none!important;display:flex;flex-direction:column;gap:18px}'
  + P + '.ca-sec{border-radius:28px;padding:34px 38px;scroll-margin-top:calc(var(--navh,80px) + 24px);' + HL + '}'
  + D + '.ca-sec{' + HD + 'color:#fff}'
  + P + '.ca-sec>h2{display:flex;align-items:center;gap:14px;font-size:clamp(23px,2.2vw,29px)!important;font-weight:800!important;letter-spacing:-.025em!important;line-height:1.2!important;margin:0 0 18px!important;padding:0!important;border:0!important;color:inherit!important;scroll-margin-top:calc(var(--navh,80px) + 30px)}'
  + D + '.ca-sec>h2{color:#fff!important}'
  + P + '.ca-no{flex:none;width:40px;height:40px;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#fff;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#B80015);box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 8px 18px rgba(226,0,26,.28)}'
  + P + '.ca-sec p,' + P + '.ca-sec li{font-size:16px!important;line-height:1.7!important;color:inherit!important}'
  + P + '.ca-sec p{margin:0 0 14px!important;opacity:.86}'
  + P + '.ca-sec strong{font-weight:800;color:inherit}'
  + P + '.ca-sec a:not(.lg-btn){color:' + RED + '!important;font-weight:700}' + D + '.ca-sec a:not(.lg-btn){color:#FF6B7B!important}'
  + P + '.ca-sec>ul,' + P + '.ca-sec>ol:not(.bf-steps){list-style:none!important;margin:0!important;padding:0!important;display:flex;flex-direction:column;gap:10px}'
  + P + '.ca-sec>ul>li,' + P + '.ca-sec>ol:not(.bf-steps)>li{position:relative;padding:0 0 0 30px!important;margin:0!important;opacity:.88}'
  + P + '.ca-sec>ul>li::before{content:"";position:absolute;left:6px;top:.72em;width:8px;height:8px;border-radius:50%;background:' + RED + ';background-color:' + RED + '!important;box-shadow:0 0 0 4px rgba(226,0,26,.12)}'
  + P + '.ca-sec>ol:not(.bf-steps){counter-reset:o}' + P + '.ca-sec>ol:not(.bf-steps)>li{counter-increment:o}'
  + P + '.ca-sec>ol:not(.bf-steps)>li::before{content:counter(o);position:absolute;left:0;top:.2em;width:22px;height:22px;border-radius:50%;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;color:#fff;background:' + RED + ';background-color:' + RED + '!important}'
  // dobozok
  + P + '.ca-sec .lg-box{position:relative;border-radius:18px!important;padding:16px 18px 16px 52px!important;margin:0 0 16px!important;background:rgba(18,19,23,.04)!important;border:0!important;box-shadow:none!important}'
  + D + '.ca-sec .lg-box{background:rgba(255,255,255,.05)!important}'
  + P + '.ca-sec .lg-box p{margin:0!important;font-size:15px!important;opacity:.85}'
  + P + '.ca-sec .lg-box::before{content:"i";position:absolute;left:18px;top:17px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;font-style:italic;font-family:Georgia,serif;color:#fff;background:#121317;background-color:#121317!important}'
  + D + '.ca-sec .lg-box::before{background-color:#fff!important;color:#121317}'
  + P + '.ca-sec .lg-box.warn{background:rgba(226,0,26,.07)!important}' + D + '.ca-sec .lg-box.warn{background:rgba(226,0,26,.15)!important}'
  + P + '.ca-sec .lg-box.warn::before{content:"!";font-style:normal;font-family:inherit;background-color:' + RED + '!important;color:#fff}'
  + P + '.ca-sec .lg-box.ex{padding:22px 24px!important;background:linear-gradient(135deg,rgba(226,0,26,.06),rgba(226,0,26,.02))!important;border:1px dashed rgba(226,0,26,.35)!important}'
  + D + '.ca-sec .lg-box.ex{background:linear-gradient(135deg,rgba(226,0,26,.16),rgba(226,0,26,.05))!important}'
  + P + '.ca-sec .lg-box.ex::before{display:none}'
  + P + '.ca-sec .lg-box.ex p{font-size:15.5px!important}'
  + P + '.ca-sec .lg-box.ex p+p{margin-top:10px!important}'
  // kaució útja
  + P + '.bf-steps{list-style:none!important;margin:6px 0 18px!important;padding:0!important;counter-reset:s;display:flex;flex-direction:column;gap:8px}'
  + P + '.bf-steps::before,' + P + '.bf-steps li::after{content:none!important;display:none!important}'
  + P + '.bf-steps li{position:relative;counter-increment:s;padding:16px 18px 16px 66px!important;margin:0!important;display:block!important;border-radius:18px;background:rgba(18,19,23,.035)!important;border:0!important;box-shadow:none!important;transition:background .25s}'
  + D + '.bf-steps li{background:rgba(255,255,255,.05)!important}'
  + P + '.bf-steps li:hover{background:rgba(226,0,26,.05)!important}'
  + P + '.bf-steps li::before{content:counter(s)!important;position:absolute;left:18px;top:16px;width:34px;height:34px;border-radius:11px!important;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#B80015)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.4),0 6px 14px rgba(226,0,26,.25)!important}'
  + P + '.bf-steps li b{display:block;font-size:16.5px;font-weight:800;margin:5px 0 3px;color:inherit!important}'
  + P + '.bf-steps li span{display:block;font-size:15px;line-height:1.6;opacity:.78;color:inherit!important}'
  // táblák → kártyasorok
  + P + '.lg-tw{overflow:visible!important;border:0!important;background:none!important;margin:0 0 14px!important;box-shadow:none!important}'
  + P + '.lg-tw table{width:100%;border-collapse:separate!important;border-spacing:0 8px!important;background:none!important;border:0!important}'
  + P + '.lg-tw thead th{font-size:11.5px!important;font-weight:800!important;letter-spacing:.1em;text-transform:uppercase;opacity:.5;padding:0 18px 2px!important;background:none!important;border:0!important;text-align:left;color:inherit!important}'
  + P + '.lg-tw tbody td{padding:15px 18px!important;font-size:15px!important;line-height:1.5;border:0!important;background:rgba(18,19,23,.035)!important;color:inherit!important;vertical-align:middle}'
  + D + '.lg-tw tbody td{background:rgba(255,255,255,.05)!important}'
  + P + '.lg-tw tbody td:first-child{border-radius:16px 0 0 16px!important;width:52%}'
  + P + '.lg-tw tbody td:last-child{border-radius:0 16px 16px 0!important;font-weight:700;color:' + RED + '!important}'
  + D + '.lg-tw tbody td:last-child{color:#FF6B7B!important}'
  + P + '.lg-tw tbody tr{transition:transform .25s}'
  + P + '.lg-tw tbody tr:hover{transform:translateX(3px)}'
  + P + '.lg-tw.ca-big tbody td:last-child{color:inherit!important;font-weight:500!important;opacity:.75}' + P + '.ca-big td:first-child strong{font-size:28px;font-weight:900;letter-spacing:-.03em;color:' + RED + '}'
  + '@media(max-width:640px){' + P + '.lg-tw table{display:block!important;min-width:0!important;width:100%!important}' + P + '.lg-tw tbody{display:block!important}' + P + '.lg-tw thead{display:none}' + P + '.lg-tw tbody tr{display:block;margin:0 0 8px;border-radius:16px;overflow:hidden}' + P + '.lg-tw tbody td{display:block;width:auto!important;border-radius:0!important;padding:12px 16px!important}' + P + '.lg-tw tbody td:first-child{padding-bottom:2px!important}' + P + '.lg-tw tbody td:last-child{padding-top:4px!important;font-size:14.5px!important}}'
  // benne van / nincs benne
  + P + '.bf-two{display:grid!important;grid-template-columns:1fr 1fr;gap:14px!important;margin:4px 0 16px!important}'
  + P + '.bf-yes,' + P + '.bf-no{border-radius:22px!important;padding:22px 22px 18px!important;border:0!important;box-shadow:none!important}'
  + P + '.bf-yes{background:linear-gradient(180deg,rgba(22,163,74,.09),rgba(22,163,74,.03))!important}'
  + P + '.bf-no{background:linear-gradient(180deg,rgba(226,0,26,.08),rgba(226,0,26,.02))!important}'
  + D + '.bf-yes{background:linear-gradient(180deg,rgba(34,197,94,.14),rgba(34,197,94,.04))!important}'
  + D + '.bf-no{background:linear-gradient(180deg,rgba(226,0,26,.16),rgba(226,0,26,.04))!important}'
  + P + '.bf-yes h3,' + P + '.bf-no h3{display:flex;align-items:center;gap:10px;font-size:17px!important;font-weight:800!important;margin:0 0 14px!important;color:inherit!important}'
  + P + '.bf-yes h3::before,' + P + '.bf-no h3::before{content:"";flex:0 0 30px;height:30px;border-radius:50%;background-repeat:no-repeat;background-position:center;background-size:16px}'
  + P + '.bf-yes h3::before{background-color:#16A34A!important;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273.2%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E")}'
  + P + '.bf-no h3::before{background-color:' + RED + '!important;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273.2%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M7 7l10 10M17 7L7 17%27/%3E%3C/svg%3E")}'
  + P + '.bf-yes ul,' + P + '.bf-no ul{list-style:none!important;margin:0!important;padding:0!important;display:flex;flex-direction:column;gap:10px}'
  + P + '.bf-yes li,' + P + '.bf-no li{position:relative;padding:0 0 0 28px!important;margin:0!important;font-size:15px!important;line-height:1.55!important;opacity:.88;color:inherit!important}'
  + P + '.bf-yes li::before,' + P + '.bf-no li::before{content:"";position:absolute;left:2px;top:.25em;width:17px;height:17px;background-repeat:no-repeat;background-size:17px;background-color:transparent!important}'
  + P + '.bf-yes li::before{background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2316A34A%27 stroke-width=%273%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E")}'
  + P + '.bf-no li::before{background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23E2001A%27 stroke-width=%273%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M7 7l10 10M17 7L7 17%27/%3E%3C/svg%3E")}'
  + '@media(max-width:700px){' + P + '.bf-two{grid-template-columns:1fr}}'
  // GYIK
  + P + '.bf-faq{display:flex!important;flex-direction:column;gap:10px}'
  + P + '.bf-faq details{border-radius:18px!important;overflow:hidden;background:rgba(18,19,23,.035)!important;border:0!important;box-shadow:none!important;margin:0!important}'
  + D + '.bf-faq details{background:rgba(255,255,255,.05)!important}'
  + P + '.bf-faq summary{padding:17px 20px!important;font-weight:700!important;font-size:15.5px!important;display:flex!important;align-items:center;justify-content:space-between;gap:14px;color:inherit!important;background:none!important;cursor:pointer}'
  + P + '.bf-faq details>p{padding:0 20px 18px!important;margin:0!important;font-size:15px!important}'
  + P + '.bf-faq.ca-cut details.ca-x{display:none!important}'
  + P + '.ca-more{align-self:center;margin-top:6px;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}'
  + D + '.ca-more{border-color:rgba(255,255,255,.16)}'
  + P + '.ca-more svg{width:16px;height:16px;transition:transform .3s}'
  + P + '.bf-faq:not(.ca-cut) .ca-more svg{transform:rotate(180deg)}'
  // záró
  + P + '.ca-end{border-radius:28px;padding:30px 34px;display:flex;align-items:center;gap:24px;color:#fff;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.35),transparent 60%),linear-gradient(160deg,#17181C,#0F1013)!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(18,19,23,.28)!important}'
  + P + '.ca-end .lg-box{background:none!important;border:0!important;padding:0!important;margin:0!important;box-shadow:none!important;flex:1;display:flex;align-items:center;gap:24px}'
  + P + '.ca-end .lg-box>p:first-child{flex:1;color:rgba(255,255,255,.8)!important;font-size:15px!important;line-height:1.6!important;margin:0!important}'
  + P + '.ca-end .lg-box a:not(.lg-btn){color:#fff!important;font-weight:700}'
  + P + '.ca-end .lg-box>p:last-child{margin:0!important;flex:none}'
  + P + '.ca-end .lg-btn{display:inline-flex!important;align-items:center;height:52px;padding:0 24px!important;border-radius:999px!important;background:' + RED + '!important;color:#fff!important;font-weight:800!important;text-decoration:none!important;box-shadow:0 14px 30px rgba(226,0,26,.38)!important;border:0!important}'
  + '@media(max-width:760px){' + P + '.ca-sec{padding:24px 18px;border-radius:24px}' + P + '.ca-no{width:34px;height:34px;border-radius:11px;font-size:13.5px}' + P + '.ca-sec>h2{gap:12px}' + P + '.ca-sec p,' + P + '.ca-sec li{font-size:15.5px!important}' + P + '.ca-end{padding:24px 20px;border-radius:24px}' + P + '.ca-end .lg-box{flex-direction:column;align-items:flex-start;gap:16px}}'
  + '</style>';

const JS = '<script id="ca-bft-js">' + String.raw`(function(){
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var root=$(".lg");if(!root||root.__t||!$(".lg-doc",root))return;root.__t=1;document.documentElement.classList.add("ca-bft");
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}
// --- fejléc: kiemelés + kulcsszámok a fejlécbe
var h1=$(".lg-hero h1",root);if(h1&&h1.textContent.indexOf("—")>-1&&!h1.querySelector(".ca-acc")){var t=h1.textContent.split("—");h1.innerHTML=t[0].trim()+' — <span class="ca-acc">'+t.slice(1).join("—").trim()+'</span>'}
var sum=$(".bf-sum",root),hin=$(".lg-hero-in",root);if(sum&&hin){$$("span",sum).forEach(function(s){var x=s.innerHTML,m=x.match(/^([^,]+?)(,| után| a visszaadás| napon)/);if(m&&m[1].length<22){}});
var sp=$$("span",sum);if(sp[0])sp[0].innerHTML=sp[0].innerHTML.replace(/^(2 000 – 10 000 €),?\s*/,"<em>$1</em>");if(sp[1])sp[1].innerHTML=sp[1].innerHTML.replace(/^(30 napon belül)\s*/,"<em>$1</em>");if(sp[2])sp[2].innerHTML=sp[2].innerHTML.replace(/^(6 hónap),?\s*/,"<em>$1</em>");
if(sp[3]&&!sp[3].querySelector("em"))sp[3].innerHTML="<em>Minden</em>"+sp[3].innerHTML;hin.appendChild(sum)}
// --- fejezetek kártyákba
var doc=$(".lg-doc",root),kids=[].slice.call(doc.childNodes),cur=null,secs=[];
kids.forEach(function(n){if(n.nodeType===1&&n.tagName==="H2"){cur=el("section","ca-sec");doc.insertBefore(cur,n);cur.appendChild(n);secs.push(cur);var m=n.textContent.match(/^\s*(\d+)\.\s*/);if(m){n.innerHTML=n.innerHTML.replace(/^\s*\d+\.\s*/,"");n.insertAdjacentHTML("afterbegin",'<span class="ca-no">'+m[1]+'</span>')}else if(n.id==="gyik"){n.insertAdjacentHTML("afterbegin",'<span class="ca-no">?</span>')}}else if(cur){cur.appendChild(n)}});
// záró doboz külön
var lastBox=secs.length?$$(":scope>.lg-box",secs[secs.length-1]).pop():null;if(lastBox&&lastBox.querySelector(".lg-btn")){var end=el("div","ca-end");end.appendChild(lastBox);lastBox.removeAttribute("style");doc.appendChild(end)}
// dobozok típusa
$$(".ca-sec .lg-box",root).forEach(function(b){var tx=b.textContent.trim();if(/^Fontos/.test(tx)||b.querySelector("strong")&&/^Fontos/.test(b.querySelector("strong").textContent))b.classList.add("warn");if(b.closest(".ca-sec")&&b.closest(".ca-sec").querySelector("h2#pelda"))b.classList.add("ex")});
var t2=$("#kaucio-osszeg",root);if(t2){var tw=t2.parentNode.querySelector(".lg-tw");if(tw)tw.classList.add("ca-big")}
// --- GYIK: az első 4 látszik, a többi gombra
var fq=$(".bf-faq",root);if(fq){var ds=$$(":scope>details",fq);if(ds.length>5){ds.forEach(function(d,k){if(k>=4)d.classList.add("ca-x")});fq.classList.add("ca-cut");var mo=el("button","ca-more");mo.type="button";var lbl=function(){mo.innerHTML=(fq.classList.contains("ca-cut")?"Mind a "+ds.length+" kérdés":"Kevesebb kérdés")+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'};lbl();mo.addEventListener("click",function(){fq.classList.toggle("ca-cut");lbl();if(fq.classList.contains("ca-cut")){var s=fq.closest(".ca-sec");if(s&&s.getBoundingClientRect().top<0)scrollTo({top:s.getBoundingClientRect().top+scrollY-120,behavior:"smooth"})}});fq.appendChild(mo);if(location.hash){var t=document.getElementById(location.hash.slice(1));if(t&&fq.contains(t))fq.classList.remove("ca-cut")}}}
// --- okos tartalomjegyzék
var toc=$(".lg-toc",root),links=$$(".lg-toc a",root),tt=$(".lg-toc-t",root);
if(tt&&!tt.querySelector(".ca-pct"))tt.insertAdjacentHTML("beforeend",'<span class="ca-pct">0%</span>');var pct=tt&&tt.querySelector(".ca-pct");
var rd=el("span","ca-rd","<i></i>");if(tt)tt.parentNode.insertBefore(rd,tt.nextSibling);var rdi=rd.querySelector("i");
var heads=links.map(function(a){return document.getElementById((a.getAttribute("href")||"").slice(1))});
// mobil sáv
var mt=el("div","ca-mt");mt.innerHTML='<button type="button" class="ca-mt-b" aria-expanded="false"><small>Tartalom</small><span>'+(links[0]?links[0].textContent:"")+'</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg><i><em></em></i></button><nav class="ca-mt-l" aria-label="Tartalom">'+links.map(function(a,k){return '<a href="'+a.getAttribute("href")+'"><b>'+(k+1)+'</b>'+a.textContent+'</a>'}).join("")+'</nav>';
doc.insertBefore(mt,doc.firstChild);var mb=$(".ca-mt-b",mt),ms=$(".ca-mt-b span",mt),me=$(".ca-mt-b em",mt),ml=$$(".ca-mt-l a",mt);
mb.addEventListener("click",function(){var o=mt.classList.toggle("op");mb.setAttribute("aria-expanded",o?"true":"false")});
function jump(e){var h=this.getAttribute("href");if(!h||h[0]!=="#")return;var t=document.getElementById(h.slice(1));if(!t)return;e.preventDefault();mt.classList.remove("op");var s=t.closest(".ca-sec")||t;var nav=document.querySelector(".ca-navwrap");var off=(nav?nav.getBoundingClientRect().bottom:80)+(innerWidth<=900?74:20);scrollTo({top:s.getBoundingClientRect().top+scrollY-off,behavior:"smooth"});history.replaceState(null,"",h)}
links.concat(ml).forEach(function(a){a.addEventListener("click",jump)});
var act=-1,rq=0;function upd(){rq=0;var nv=document.querySelector(".ca-navwrap"),y=Math.max(innerHeight*.3,(nv?nv.getBoundingClientRect().bottom:80)+(innerWidth<=900?110:60)),a=0;heads.forEach(function(h,k){if(h&&h.getBoundingClientRect().top<=y)a=k});
var r=doc.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight*.5-r.top)/Math.max(1,r.height-innerHeight*.5)));
if(rdi)rdi.style.transform="scaleX("+p.toFixed(3)+")";if(pct)pct.textContent=Math.round(p*100)+"%";me.style.transform="scaleX("+p.toFixed(3)+")";
if(a!==act){act=a;links.forEach(function(l,k){l.classList.toggle("on",k===a);l.classList.toggle("done",k<a)});ml.forEach(function(l,k){l.classList.toggle("on",k===a)});ms.textContent=(a+1)+". "+(links[a]?links[a].textContent:"");
if(toc&&links[a]&&innerWidth>900){var lr=links[a].getBoundingClientRect(),tr=toc.getBoundingClientRect();if(lr.top<tr.top+60||lr.bottom>tr.bottom-20)toc.scrollTo({top:links[a].offsetTop-tr.height/2,behavior:"smooth"})}}}
addEventListener("scroll",function(){if(!rq){rq=1;requestAnimationFrame(upd)}},{passive:true});addEventListener("resize",upd);upd();
document.addEventListener("click",function(e){if(!mt.contains(e.target))mt.classList.remove("op")});
// sötét mód inline-színek takarítása
function cln(){$$(".lg-hero *,.lg-toc,.lg-toc *,.ca-mt,.ca-mt *,.lg-doc,.lg-doc *",root).forEach(function(x){if(x.tagName==="IMG")return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

export function apply(h) {
  if (h.indexOf('id="ca-bft-css"') > -1 || h.indexOf('class="lg-doc"') < 0) return null;
  h = seo(h);
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-bft] nincs', FILE); process.exit(0); }
  const o = apply(fs.readFileSync(FILE, 'utf8'));
  if (!o) console.log('[hu-bft] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-bft] feltételek és kaució: letisztult nézet'); }
}

// a jogi oldalak (hu-legal.mjs) ugyanerre az elrendezésre épülnek
export { CSS as BFT_CSS, JS as BFT_JS };
