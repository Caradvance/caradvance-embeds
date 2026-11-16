// Build lépés: „Színpad” — a magyar főoldal Kínálat része nagy, sötét autóbemutató.
// Nem görgetésre megy: a nyilakkal (vagy billentyűvel / ujjal húzva) lehet lapozni, az autók ilyenkor
// jobbról begördülnek a színpad közepére. Balra fent nagy márka- és modellnév, alatta az adatkártya
// (az eredeti kártya másolata, így a gombok működnek), fent a fülek és a márkaszűrők, alul nyilak + számláló.
// Mindhárom fülön működik (Bérelhető, Eladó, Bizományos): az autókat a meglévő körhinta adja, azt csak elrejtjük.
// Képek: bérautóknál kivágott fotó (/berles-cut/<név>.webp, nem nagyítjuk túl, hogy ne legyen pixeles);
// az eladó/bizományos autóknál a teljes valódi fotó, lágyan elhalványuló szélekkel.
// Csökkentett mozgás beállításnál nem kapcsol be (marad a körhinta). Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');

const G = 'background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05))!important;border:1px solid rgba(255,255,255,.2)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.3)!important;color:#fff!important';
const RED = 'background:#E2001A!important;color:#fff!important;border:0!important;box-shadow:0 10px 30px rgba(226,0,26,.45)!important';

const CSS = '<style id="ca-stage-css">'
  + '#autoink.ca-show.ca-stg-on{overflow:clip!important}'
  + '#autoink.ca-show::before{display:none!important}'
  // hero gombok: három egyforma gomb (Autót keresek · Autó import · Add el az autód)
  + 'section.hero .cta-row{display:flex!important;flex-wrap:wrap;justify-content:center;gap:12px!important}section.hero .cta-row .btn{min-width:190px;justify-content:center;text-align:center}'
  + '@media(max-width:600px){section.hero .cta-row{flex-direction:column;align-items:stretch;width:100%;max-width:320px;margin-left:auto;margin-right:auto}section.hero .cta-row .btn{min-width:0;width:100%}}'
  // okos menüsor: lefelé görgetve elrejtőzik, felfelé görgetve azonnal visszajön
  + 'html .ca-navwrap{transition:transform .38s cubic-bezier(.2,.8,.2,1)!important;will-change:transform}html .ca-navwrap.ca-nav-hide{transform:translateY(calc(-100% - 24px))!important}'
  // a hero a teljes képernyőt kitölti — a Kínálat csak lefelé görgetve jelenik meg
  + 'section.hero:has(+#autoink){margin:0!important;margin-top:calc(0px - var(--navh,0px))!important;border-radius:0!important;width:100%!important;min-height:100vh!important;min-height:100svh!important;display:flex!important;flex-direction:column!important;justify-content:center!important;box-sizing:border-box}'
  + 'section.hero:has(+#autoink) .scrolldown{position:absolute!important;left:50%;bottom:28px;transform:translateX(-50%)}'
  // a fejléc jobb oldala (Cég/Magán + „Összes … autó”) a színpadon már megvan → fent elrejtve, kisebb üres rés
  + '#autoink.ca-stg-on .ca-sh .ca-sh-r{display:none!important}#autoink.ca-stg-on .ca-sh{margin-bottom:0!important;padding-bottom:0!important}'
  + '#autoink.ca-stg-on .autok-panel.on .autok-more{margin:8px 0 10px!important}'
  + '#autoink.ca-stg-on .autok-panel .cw.cf3d{display:none!important}'
  + '#autoink.ca-stg-on .autok-panel.on .autok-more{display:flex!important;justify-content:center;margin:30px 0 10px!important}'
  + '#ca-stg{position:relative;height:clamp(780px,92vh,900px);margin-top:4px}'
  + '#ca-stg .stg-pin{position:absolute;inset:0;overflow:hidden}'
  // fülváltás közben minden tartalom egy pillanatra elhalványul (nem csúsznak egymásra a feliratok)
  + '#ca-stg :is(.stg-cars,.stg-bgl,.stg-side,.stg-nav){transition:opacity .22s}'
  + '#ca-stg.swap :is(.stg-cars,.stg-bgl,.stg-side,.stg-nav){opacity:0!important;pointer-events:none}'
  // fent: fülek + márkák (az eredeti elemek)
  + '#ca-stg .stg-top{position:absolute;left:0;right:0;top:24px;z-index:5}'
  + '#ca-stg .stg-top .autok-head{margin:0!important}'
  + 'html #autoink.ca-show #ca-stg .cf-br.on,html #autoink.ca-show #ca-stg .cf-br.on:hover{background:#E2001A!important;border-color:#E2001A!important;box-shadow:0 6px 16px rgba(226,0,26,.35),inset 0 1px 0 rgba(255,255,255,.3)!important}'
  + '#ca-stg .stg-top{left:2px!important}'
  + '@media(min-width:821px){html #autoink #ca-stg .stg-top .autok-head{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;height:auto!important;min-height:0!important;gap:16px!important}html #autoink #ca-stg .stg-top .autok-head>*{margin:0!important;height:auto!important}html #autoink #ca-stg .stg-top .ah-r{overflow:visible!important;padding:0!important;flex:0 0 auto!important;height:auto!important;max-height:60px!important;align-items:center!important;align-content:flex-start!important;flex-wrap:nowrap!important}html #autoink #ca-stg .stg-top .ah-r{justify-content:flex-start!important}#ca-stg .stg-cars{top:27%!important}#ca-stg .stg-side{top:var(--stg-sidetop,230px);bottom:auto!important;justify-content:flex-start}html #autoink.ca-show #ca-stg .stg-top .cf-br{height:40px!important;min-width:0!important;padding:0 14px!important}html #autoink.ca-show #ca-stg .stg-top .cf-br img{max-height:22px!important}html #autoink.ca-show #ca-stg .stg-top .cf-br.on{font-size:13.5px!important}#ca-stg .stg-bgl .stg-car{padding-top:max(170px,20%)!important}}'
  + 'html #autoink #ca-stg .autok-tabs{padding:5px!important;gap:4px!important;border-radius:999px!important;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04))!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.25),0 14px 34px rgba(0,0,0,.45)!important}'
  + 'html #autoink #ca-stg .autok-tab{font-size:16px!important;font-weight:800!important;letter-spacing:.01em;padding:12px 26px!important;border-radius:999px!important;color:rgba(255,255,255,.72)!important;background:transparent!important;transition:color .25s,background .25s,box-shadow .25s!important}'
  + 'html #autoink #ca-stg .autok-tab:hover{color:#fff!important;background:rgba(255,255,255,.08)!important}'
  + 'html #autoink #ca-stg .autok-tab.on{color:#fff!important;background:#E2001A!important;box-shadow:0 6px 16px rgba(226,0,26,.35),inset 0 1px 0 rgba(255,255,255,.3)!important}'
  + '@media(max-width:820px){html #autoink #ca-stg .autok-tabs{display:flex!important;width:100%}html #autoink #ca-stg .autok-tab{flex:1;font-size:15px!important;padding:11px 6px!important}}'
  // háttér: fénykúp, piros padlófény
  + '#ca-stg .stg-light{position:absolute;left:30%;right:-5%;top:0;height:80%;pointer-events:none;background:radial-gradient(ellipse 50% 60% at 50% 35%,rgba(255,255,255,.08),transparent 70%)}'
  + '#ca-stg .stg-floor{position:absolute;left:30%;right:-2%;bottom:14%;height:22%;pointer-events:none;background:radial-gradient(ellipse 50% 45% at 50% 60%,rgba(226,0,26,.42),transparent 72%)}'
  + '#ca-stg .stg-floor::after{content:"";position:absolute;left:8%;right:8%;top:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,60,75,.85),transparent);box-shadow:0 0 18px rgba(226,0,26,.7)}'
  // autók (kivágott bérautók)
  + '#ca-stg .stg-cars{position:absolute;left:33%;right:1%;top:27%;bottom:20%}'
  + '#ca-stg .stg-car{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;opacity:0;will-change:transform,opacity;'
  + 'transition:transform .95s cubic-bezier(.7,0,.2,1),opacity .95s cubic-bezier(.7,0,.2,1)}'
  
  + '#ca-stg .stg-cars .stg-car img{display:block;width:auto;height:auto;max-width:min(94%,640px);max-height:100%;object-fit:contain;'
  + 'filter:drop-shadow(0 28px 22px rgba(0,0,0,.75));-webkit-box-reflect:below 2px linear-gradient(transparent 78%,rgba(255,255,255,.13))}'
  + '#ca-stg .stg-car.stg-nocut img{max-height:90%;border-radius:22px;-webkit-box-reflect:none;filter:drop-shadow(0 24px 40px rgba(0,0,0,.6))}'
  // valódi fotók (eladó/bizományos): teljes kép, lágyan elhalványuló szélekkel, a kártya mellett
  + '#ca-stg .stg-bgl{position:absolute;inset:0;z-index:0;overflow:hidden}'
  + '#ca-stg .stg-bgl .stg-car{inset:0;align-items:center;padding:max(170px,20%) 1% 11% 31%;box-sizing:border-box}'
  + '#ca-stg .stg-bgl .stg-car img{display:block;position:relative;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;'
  + '-webkit-mask-image:linear-gradient(90deg,transparent,#000 13%,#000 87%,transparent),linear-gradient(180deg,transparent,#000 11%,#000 89%,transparent);-webkit-mask-composite:source-in;'
  + 'mask-image:linear-gradient(90deg,transparent,#000 13%,#000 87%,transparent),linear-gradient(180deg,transparent,#000 11%,#000 89%,transparent);mask-composite:intersect}'
  + '#ca-stg.ph-mode :is(.stg-floor,.stg-light){display:none}'
  // bal oldal: nagy márka + modellnév, Cég/Magán, adatkártya
  + '#ca-stg .stg-side{position:absolute;left:0;bottom:7%;width:min(380px,30%);display:flex;flex-direction:column;gap:12px;z-index:3}'
  + '#ca-stg .stg-side .ca-bt{align-self:flex-start;margin:0!important}'
  + '#ca-stg .stg-title{display:flex;flex-direction:column;gap:8px;margin-bottom:8px}'
  + '#ca-stg .stg-brand{display:inline-flex;align-items:center;gap:12px;font-size:clamp(20px,1.8vw,26px);font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#fff}'
    + '#ca-stg .stg-brand img{height:36px;width:auto;max-width:64px;object-fit:contain;filter:brightness(0) invert(1);opacity:.95}#ca-stg .stg-brand img[src*="-color"]{filter:none}'
  + '#ca-stg .stg-model{font-size:clamp(44px,4.8vw,78px);font-weight:800;line-height:.98;letter-spacing:-.035em;color:#fff;text-wrap:balance}'
  + '#ca-stg .stg-title.lg .stg-model{font-size:clamp(34px,3.4vw,54px)}'
  + '#ca-stg .stg-spec{font-size:15px;color:rgba(255,255,255,.6)}'
  + '#ca-stg .stg-title>span{transition:opacity .3s,transform .45s cubic-bezier(.2,.8,.2,1)}#ca-stg .stg-title.sw>span{opacity:0;transform:translateY(14px)}'
  + '#ca-stg .stg-title.sw .stg-model{transition-delay:.04s}#ca-stg .stg-title.sw .stg-spec{transition-delay:.08s}'
  + '#ca-stg .stg-info{position:relative}'
  + '#ca-stg .stg-card{display:none!important;margin:0!important}'
  + '#ca-stg .stg-card.on{display:block!important;animation:stg-in .5s cubic-bezier(.2,.8,.2,1)}'
  + '@keyframes stg-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}'
  + '#ca-stg .stg-card :is(.sub-media,.media,.biz-choose,.biz-total,.sub-title,.sub-specs,.title,.specs){display:none!important}'
  + '#ca-stg .stg-card::after{display:none!important}'
  + '#ca-stg .stg-card .sub-btn{' + RED + '}'
  + 'html #autoink #ca-stg .stg-card .sub-actions{display:flex!important;flex-direction:column;gap:10px}'
  + 'html #autoink #ca-stg .stg-card .sub-actions .ca-row{display:flex!important;gap:10px;align-items:stretch}'
  + 'html #autoink #ca-stg .stg-card .ca-row .ca-row{flex:1;width:100%}'
  + 'html #autoink #ca-stg .stg-card .ca-row a{flex:1;display:inline-flex!important;align-items:center;justify-content:center;gap:6px;padding:0 14px;min-height:44px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;' + G + '}'
  // eladó/bizományos kártya a sötét színpadon
  + '#ca-stg .stg-card.card.on{border-radius:22px;overflow:hidden;color:#fff;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.03) 30%,rgba(255,255,255,.02)),#15171c!important;'
  + 'border:1px solid rgba(255,255,255,.14)!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.22),0 24px 60px rgba(0,0,0,.5)!important}'
  + '#ca-stg .stg-card.card a,#ca-stg .stg-card.card a *{text-decoration:none!important}'
  + '#ca-stg .stg-card.card :is(.ca-reszlet,.cbtn){' + G + '}'
  + '#ca-stg .stg-card.card .ca-inq{' + RED + '}'
  + '#ca-stg .stg-card.card .price{color:#fff!important}#ca-stg .stg-card.card :is(.peur,.meta){color:rgba(255,255,255,.6)!important}'
  // alul: nyilak, szakaszos jelző, számláló
  + '#ca-stg .stg-nav{position:absolute;left:33%;right:1%;bottom:5%;display:flex;align-items:center;justify-content:center;gap:18px;color:#fff;font-weight:700;font-variant-numeric:tabular-nums;z-index:4}'
  + '#ca-stg .stg-ar{flex:0 0 auto;width:52px;height:52px;border-radius:50%;cursor:pointer;color:#fff;font-size:20px;line-height:1;border:1px solid rgba(255,255,255,.22);'
  + 'background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.04));-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 1px 1px 1px rgba(255,255,255,.35),0 10px 26px rgba(0,0,0,.4);transition:background .2s,transform .2s,opacity .2s}'
  + '#ca-stg .stg-ar:hover{background:rgba(255,255,255,.24);transform:scale(1.06)}#ca-stg .stg-ar:disabled{opacity:.3;cursor:default;transform:none}'
  + '#ca-stg .stg-ar.stg-n{background:#E2001A;border-color:#E2001A;box-shadow:0 10px 30px rgba(226,0,26,.5)}#ca-stg .stg-ar.stg-n:hover{background:#ff1a33}#ca-stg .stg-ar.stg-n:disabled{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);box-shadow:none}'
  + '#ca-stg .stg-dots{display:flex;align-items:center;gap:6px}'
  + '#ca-stg .stg-dot{width:22px;height:3px;border-radius:3px;border:0;padding:0;cursor:pointer;background:rgba(255,255,255,.32);transition:width .4s cubic-bezier(.2,.8,.2,1),background .3s}'
  + '#ca-stg .stg-dot:hover{background:rgba(255,255,255,.5)}#ca-stg .stg-dot.on{width:46px;background:#E2001A;box-shadow:0 0 10px rgba(226,0,26,.8)}'
  + '#ca-stg .stg-cnt{font-size:14px;letter-spacing:.06em;color:rgba(255,255,255,.6);min-width:58px;text-align:center}#ca-stg .stg-cnt b{font-size:20px;color:#fff}'
  // telefon
  + '@media(max-width:820px){#ca-stg{height:auto;min-height:0}#ca-stg .stg-pin{position:relative;inset:auto;padding:86px 14px 24px;display:flex;flex-direction:column}#ca-stg .stg-top{order:1}#ca-stg .stg-bgl,#ca-stg .stg-cars{order:2}#ca-stg .stg-nav{order:3}#ca-stg .stg-side{order:4}#ca-stg :is(.stg-floor,.stg-light){display:none}#ca-stg .stg-top .autok-head>*{margin:0!important;min-height:0!important;height:auto!important}#ca-stg .stg-top .autok-head{height:auto!important;min-height:0!important}'
  + '#ca-stg .stg-top{position:relative;top:auto;left:auto;right:auto;margin:0 0 14px}#ca-stg .stg-top .autok-head{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important}html #autoink #ca-stg .stg-top .ah-r{display:flex!important;flex-direction:row!important;align-items:center!important;align-content:flex-start!important;height:auto!important;max-height:56px;flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;gap:8px;justify-content:flex-start!important;padding:4px 2px}#ca-stg .stg-top .ah-r::-webkit-scrollbar{display:none}#ca-stg .stg-top .ah-r .cf-br{flex:0 0 auto}'
  + '#ca-stg .stg-cars,#ca-stg .stg-bgl{position:relative;left:auto;right:auto;top:auto;bottom:auto;height:46vw;min-height:200px}'
  + '#ca-stg .stg-bgl .stg-car{padding:0 2%}#ca-stg .stg-floor{left:-10%;right:-10%;top:120px;bottom:auto;height:46vw}#ca-stg .stg-light{left:0}'
  + '#ca-stg .stg-nav{position:relative;left:auto;right:auto;bottom:auto;margin:14px 0 18px;gap:12px}#ca-stg .stg-ar{width:44px;height:44px}#ca-stg .stg-dots{display:none}#ca-stg .stg-cnt{white-space:nowrap;min-width:90px}'
  + '#ca-stg :is(.stg-cars,.stg-bgl):empty{display:none}#ca-stg .stg-side{position:relative;left:auto;bottom:auto;width:auto}#ca-stg .stg-model{font-size:clamp(40px,12vw,58px)}}'
  + '#ca-stg .stg-clk{cursor:zoom-in}#ca-stg .stg-cars .stg-clk.on:hover img{transform:scale(1.03);transition:transform .4s}'
  + '#ca-stg:not(.gal-mode) .stg-hintpic{display:none}#ca-stg .stg-hintpic{position:absolute;right:1%;top:var(--stg-hinttop,34px);z-index:3;font-size:12.5px;font-weight:700;letter-spacing:.04em;color:rgba(255,255,255,.75);padding:8px 14px;border-radius:999px;pointer-events:none;'
  + 'background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'
  + '.stg-lb{position:fixed;inset:0;z-index:2147483000;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:3vh 3vw;background:rgba(8,9,12,.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}'
  + '.stg-lb.on{display:flex;animation:stg-lbin .3s ease}@keyframes stg-lbin{from{opacity:0}to{opacity:1}}'
  + '.stg-lb .lb-st{position:relative;width:min(1200px,94vw);height:min(70vh,calc(94vw*.66));display:flex;align-items:center;justify-content:center}'
  + '.stg-lb .lb-st img{max-width:100%;max-height:100%;object-fit:contain;border-radius:14px;transition:opacity .25s}.stg-lb .lb-st img.ld{opacity:.35}'
  + '.stg-lb .lb-a{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;cursor:pointer;color:#fff;font-size:20px;border:1px solid rgba(255,255,255,.25);background:rgba(20,21,26,.6);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'
  + '.stg-lb .lb-p{left:-6px}.stg-lb .lb-n{right:-6px;background:#E2001A;border-color:#E2001A}'
  + '.stg-lb .lb-c{position:absolute;right:14px;bottom:12px;color:#fff;font-weight:700;font-size:13px;padding:6px 12px;border-radius:999px;background:rgba(11,11,13,.7)}'
  + '.stg-lb .lb-x{position:absolute;right:18px;top:16px;width:46px;height:46px;border-radius:50%;cursor:pointer;color:#fff;font-size:18px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08)}'
  + '.stg-lb .lb-th{display:flex;gap:8px;max-width:min(1200px,94vw);overflow-x:auto;scrollbar-width:none;padding:4px}.stg-lb .lb-th::-webkit-scrollbar{display:none}'
  + '.stg-lb .lb-th img{flex:0 0 auto;width:92px;height:62px;object-fit:cover;border-radius:10px;cursor:pointer;opacity:.5;border:2px solid transparent;transition:opacity .2s}.stg-lb .lb-th img.on{opacity:1;border-color:#E2001A}'
  + '.stg-lb .lb-go{color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:12px;background:#E2001A;box-shadow:0 10px 30px rgba(226,0,26,.45)}'
  + '@media(max-width:820px){.stg-lb .lb-a{width:42px;height:42px}.stg-lb .lb-th img{width:64px;height:44px}#ca-stg .stg-hintpic{display:none}}'
  + '</style>';

const JS = '<script id="ca-stage-js">(function(){'
  + 'if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;'
  + 'var stg_n="",S,stg,bgl,cars,infos,cnt,dots,pb,nb,tl,n=0,items=[],act=-1,sig="",busy=0;'
  + 'var SC=__SALECUTS__;function cut(src,href){var m=src&&src.match(/\\/berles\\/([^\\/?#]+)\\.webp/);if(m)return"/berles-cut/"+m[1]+".webp";var h=href&&href.match(/\\/auto\\/([^\\/?#]+)/);return h&&SC.indexOf(h[1])>-1?"/elado-cut/"+h[1]+".webp":null}'
  + 'function hrefOf(k){var a=k.matches&&k.matches("a[href]")?k:k.querySelector("a[href*=\\"/auto/\\"],a[href]");return a?a.getAttribute("href"):""}'
  + 'function big(src){return src.replace(/rule=mo-\\d+/,"rule=mo-1600")}'
  + 'function panel(){return S.querySelector(".autok-panel.on")||S.querySelector(".autok-panel")}'
  + 'function cardsOf(p){var c=p&&p.querySelector(".cw.cf3d");return c?[].slice.call(c.querySelectorAll(".cw-item")).map(function(it){return it.querySelector(".sub-card,.card")}).filter(Boolean):[]}'
  + 'function txt(k,s){var e=k.querySelector(s);return e?e.textContent.trim():""}'
  + 'function el(t,c){var e=document.createElement(t);if(c)e.className=c;return e}'
  + 'function shell(){stg=el("div");stg.id="ca-stg";'
  + 'stg.innerHTML=\'<div class="stg-pin"><div class="stg-bgl"></div><div class="stg-light"></div><div class="stg-floor"></div><div class="stg-top"></div><div class="stg-cars"></div><span class="stg-hintpic">Kattints az autóra a további képekért</span>'
  + '<div class="stg-nav"><button type="button" class="stg-ar stg-p" aria-label="Előző autó">←</button><div class="stg-dots"></div><span class="stg-cnt"></span><button type="button" class="stg-ar stg-n" aria-label="Következő autó">→</button></div>'
  + '<div class="stg-side"><div class="stg-title"><span class="stg-brand"></span><span class="stg-model"></span><span class="stg-spec"></span></div><div class="stg-info"></div></div></div>\';'
  + 'bgl=stg.querySelector(".stg-bgl");cars=stg.querySelector(".stg-cars");infos=stg.querySelector(".stg-info");cnt=stg.querySelector(".stg-cnt");dots=stg.querySelector(".stg-dots");tl=stg.querySelector(".stg-title");'
  + 'pb=stg.querySelector(".stg-p");nb=stg.querySelector(".stg-n");pb.onclick=function(){show(act-1)};nb.onclick=function(){show(act+1)};'
  // ujjal húzás (telefon) és billentyűk (ha a színpad látszik)
  + 'var x0=null;stg.addEventListener("pointerdown",function(e){if(e.pointerType!=="mouse")x0=e.clientX});stg.addEventListener("pointerup",function(e){if(x0==null)return;var d=e.clientX-x0;x0=null;if(Math.abs(d)>50)show(act+(d<0?1:-1))});'
  + 'addEventListener("keydown",function(e){if(!stg||/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||"")))return;var r=stg.getBoundingClientRect();if(r.bottom<innerHeight*.3||r.top>innerHeight*.7)return;if(e.key==="ArrowRight")show(act+1);else if(e.key==="ArrowLeft")show(act-1)});'
  // fülek + márkák fent; a Cég/Magán kapcsoló másolata a kártya fölött (az eredetivel együtt működik)
  + 'var hd=S.querySelector(".autok-head");if(hd)stg.querySelector(".stg-top").appendChild(hd);'
  + 'var bt=S.querySelector(".ca-sh .ca-bt");if(bt){var sd=stg.querySelector(".stg-side"),cp=bt.cloneNode(true);sd.insertBefore(cp,infos);'
  + 'var sync=function(){cp.innerHTML=bt.innerHTML};cp.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var v=b.getAttribute("data-bt"),o=v&&bt.querySelector("[data-bt=\\""+v+"\\"]");if(o)o.click();setTimeout(sync,60)});'
  + 'new MutationObserver(sync).observe(bt,{subtree:true,attributes:true,childList:true})}'
  + 'S.classList.add("ca-stg-on")}'
  + 'function place(p){if(!stg||!p||stg.parentNode===p)return;var c=p.querySelector(".cw.cf3d");if(c)p.insertBefore(stg,c.nextSibling);else p.insertBefore(stg,p.firstChild)}'
  // kép mérete: soha ne nagyítsuk a valódi felbontás fölé (ne legyen pixeles)
  + 'function cap(i,ph){i.addEventListener("load",function(){var w=i.naturalWidth,h=i.naturalHeight;if(!w)return;var k=ph?.8:i.src.indexOf("/elado-cut/")>-1?.6:.46;if(!ph&&!/-cut\\//.test(i.src))k=.75;i.style.maxWidth="min(100%,"+Math.round(w*k)+"px)";i.style.maxHeight="min(100%,"+Math.round(h*k)+"px)"})}'
  + 'var LB;function gal(hr,first,alt){if(!LB){LB=el("div","stg-lb");LB.innerHTML=\'<button type="button" class="lb-x" aria-label="Bezárás">✕</button><div class="lb-st"><img alt="" referrerpolicy="no-referrer"><button type="button" class="lb-a lb-p" aria-label="Előző kép">←</button><button type="button" class="lb-a lb-n" aria-label="Következő kép">→</button><span class="lb-c"></span></div><div class="lb-th"></div><a class="lb-go">Részletek és ajánlat →</a>\';document.body.appendChild(LB);'
  + 'LB.addEventListener("click",function(e){if(e.target===LB||e.target.closest(".lb-x"))LB.classList.remove("on")});addEventListener("keydown",function(e){if(!LB.classList.contains("on"))return;if(e.key==="Escape")LB.classList.remove("on");if(e.key==="ArrowRight")LB.go(1);if(e.key==="ArrowLeft")LB.go(-1);e.stopImmediatePropagation()},true);'
  + 'var lx=null;LB.addEventListener("pointerdown",function(e){lx=e.clientX});LB.addEventListener("pointerup",function(e){if(lx==null)return;var d=e.clientX-lx;lx=null;if(Math.abs(d)>50)LB.go(d<0?1:-1)});'
  + 'LB.querySelector(".lb-p").onclick=function(){LB.go(-1)};LB.querySelector(".lb-n").onclick=function(){LB.go(1)}}'
  + 'var im=LB.querySelector(".lb-st img"),th=LB.querySelector(".lb-th"),c=LB.querySelector(".lb-c"),L=[first],ix=0;LB.querySelector(".lb-go").href=hr;im.alt=alt||"";'
  + 'function draw(){th.innerHTML="";L.forEach(function(u,j){var t=new Image();t.referrerPolicy="no-referrer";t.loading="lazy";t.src=u;t.className=j===ix?"on":"";t.onclick=function(){set(j)};th.appendChild(t)})}'
  + 'function set(j){ix=(j+L.length)%L.length;im.classList.add("ld");var u=L[ix];var n=new Image();n.referrerPolicy="no-referrer";n.onload=n.onerror=function(){im.src=u;im.classList.remove("ld")};n.src=u;c.textContent=(ix+1)+" / "+L.length;[].forEach.call(th.children,function(t,k){t.className=k===ix?"on":""});var a=th.children[ix];a&&th.scrollTo({left:a.offsetLeft-th.clientWidth/2+a.clientWidth/2,behavior:"smooth"})}'
  + 'LB.go=function(d){set(ix+d)};draw();set(0);LB.classList.add("on");'
  + 'fetch(hr,{credentials:"same-origin"}).then(function(r){return r.text()}).then(function(h){var d=new DOMParser().parseFromString(h,"text/html"),u=[].map.call(d.querySelectorAll("#thumbs img,.thumbs img"),function(x){return x.getAttribute("src")||x.getAttribute("data-src")});'
  + 'if(!u.length)u=h.match(/https:\\/\\/(img\\.classistatic\\.de\\/api\\/v1\\/mo-prod\\/images\\/[0-9a-f]{2}\\/[0-9a-f-]{36}(\\?rule=mo-\\d+)?|img\\.hasznaltautocdn\\.com\\/2048x1536\\/\\d+\\/\\d+\\.jpg)/g)||[];'
  + 'u=u.filter(Boolean).map(function(x){return /classistatic/.test(x)?x.split("?")[0]+"?rule=mo-1600":x});var seen={},out=[];u.forEach(function(x){var k=x.split("?")[0];if(!seen[k]){seen[k]=1;out.push(x)}});'
  + 'if(out.length){var f0=first.split("?")[0];out.sort(function(a,b){return (b.split("?")[0]===f0)-(a.split("?")[0]===f0)});L=out;ix=0;draw();set(0)}}).catch(function(){})}'
  + 'function build(){var p=panel();place(p);var cs=cardsOf(p);if(!cs.length)return;'
  + 'var g=(p?p.id:"")+"#"+cs.map(function(k){return txt(k,".sub-title,.title")+txt(k,".ca-pv,.price")}).join("|");if(g===sig){stg&&stg.classList.remove("swap");return}var nmg=(p?p.id:"")+"#"+cs.map(function(k){return txt(k,".sub-title,.title")}).join("|"),keep=nmg===stg_n&&act>=0?act:0;stg_n=nmg;sig=g;'
  + 'if(!stg){shell();place(p)}cars.innerHTML="";bgl.innerHTML="";infos.innerHTML="";dots.innerHTML="";var anyPh=false,anyGal=false;'
  + 'items=cs.map(function(k,j){var im=k.querySelector(".sub-photo,.media img"),src=im?(im.getAttribute("src")||im.currentSrc||""):"",hr=hrefOf(k),u=cut(src,hr),ph=!u&&!/\\/berles\\//.test(src);'
  + 'var f=el("div","stg-car"+(u||ph?"":" stg-nocut")),i=new Image();i.alt=im?im.alt:"";i.decoding="async";i.referrerPolicy="no-referrer";cap(i,ph);i.src=u||(ph?big(src):src);'
  + 'i.onerror=function(){i.onerror=null;if(u)f.classList.add("stg-nocut");i.src=src};f.appendChild(i);(ph?bgl:cars).appendChild(f);if(ph)anyPh=true;var rent=/\\/berles\\//.test(src);if(!rent)anyGal=true;if(hr&&!rent){f.classList.add("stg-clk");f.title="További képek";f.onclick=function(){gal(hr,src,i.alt)}}'
  + 'var d=k.cloneNode(true);d.removeAttribute("style");d.classList.add("stg-card");infos.appendChild(d);'
  + 'var dt=el("button","stg-dot");dt.type="button";dt.setAttribute("aria-label",(j+1)+". autó");dt.onclick=function(){show(j)};dots.appendChild(dt);'
  + 'var nm=txt(k,".sub-title,.title").split("/")[0].trim(),bm=nm.match(/^(Mercedes-Benz|Land Rover|Range Rover|Alfa Romeo|Aston Martin|\\S+)\\s+(.*)$/)||[0,"",nm],mw=bm[2].split(/\\s+/);'
  + 'return{f:f,d:d,dt:dt,ph:ph,brand:bm[1],model:mw.slice(0,3).join(" "),spec:txt(k,".sub-specs,.specs")}});'
  + 'fit();stg.classList.toggle("ph-mode",anyPh);stg.classList.toggle("gal-mode",anyGal);n=items.length;act=-1;show(Math.min(keep,n-1),1);requestAnimationFrame(function(){stg.classList.remove("swap")})}'
  // pozíciók: középen / jobbra kint / balra kint
  + 'function pos(it,where,instant){var f=it.f,ph=it.ph,x=where===0?0:where*(ph?7:78),sc=where===0?(ph?1:1):(ph?1.03:.84);'
  + 'if(instant){f.style.transition="none";f.classList.remove("mv")}f.style.transform="translate3d("+x+"vw,0,0) scale("+sc+")";f.style.opacity=where===0?1:0;f.style.zIndex=where===0?2:1;'
  + 'if(instant){void f.offsetWidth;f.style.transition=""}}'
  + 'function show(j,instant){if(!n)return;j=Math.max(0,Math.min(n-1,j));if(j===act&&!instant)return;var dir=act<0?1:(j>act?1:-1),old=act>=0?items[act]:null,it=items[j];'
  + 'if(!instant){pos(it,dir,true);it.f.classList.remove("mv");void it.f.offsetWidth;it.f.classList.add("mv");if(old){old.f.classList.remove("mv");void old.f.offsetWidth;old.f.classList.add("mv");pos(old,-dir)}}'
  + 'items.forEach(function(x,k){if(k!==j&&(!old||x!==old))pos(x,k<j?-1:1,true)});pos(it,0,!!instant);act=j;'
  + 'items.forEach(function(x,k){x.d.classList.toggle("on",k===j);x.dt.classList.toggle("on",k===j);x.f.classList.toggle("on",k===j)});'
  + 'cnt.innerHTML="<b>"+String(j+1).padStart(2,"0")+"</b> / "+String(n).padStart(2,"0");pb.disabled=j===0;nb.disabled=j===n-1;'
  + 'var put=function(){var bk={"volkswagen":"vw","vw":"vw","bmw":"bmw","mini":"mini","mercedes-benz":"mercedes","mercedes":"mercedes","audi":"audi","hyundai":"hyundai","cupra":"cupra","kia":"kia","man":"man","seat":"seat","volvo":"volvo"}[(it.brand||"").toLowerCase()],be=tl.querySelector(".stg-brand");be.textContent="";if(bk){var li=new Image();li.alt="";li.src="/bl-"+bk+".webp";li.onerror=function(){li.remove()};be.appendChild(li)}be.appendChild(document.createTextNode(it.brand));tl.querySelector(".stg-model").textContent=it.model;tl.querySelector(".stg-spec").textContent=it.spec;tl.classList.toggle("lg",it.model.length>11)};'
  + 'clearTimeout(busy);if(instant){put();tl.classList.remove("sw")}else{tl.classList.add("sw");busy=setTimeout(function(){put();tl.classList.remove("sw")},300)}}'
  + 'function fit(){if(!stg||innerWidth<821)return;var t=stg.querySelector(".stg-top");if(!t)return;var b=t.getBoundingClientRect().bottom-stg.getBoundingClientRect().top;stg.style.setProperty("--stg-sidetop",Math.round(b+44)+"px");var tb=t.querySelector(".autok-tabs");if(tb){var r0=stg.getBoundingClientRect(),rt=tb.getBoundingClientRect();stg.style.setProperty("--stg-hinttop",Math.round(rt.top-r0.top+(rt.height-36)/2)+"px")}}addEventListener("resize",fit);setInterval(fit,1500);'
  + 'var to=0;function later(){clearTimeout(to);to=setTimeout(build,140)}'
  + 'function boot(){S=document.getElementById("autoink");if(!S||!S.querySelector(".cw.cf3d .cw-item"))return setTimeout(boot,300);build();'
  + 'new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){if(!stg||!stg.contains(ms[i].target)){later();return}}}).observe(S,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["hidden","class"]});'
  // fül- vagy márkaváltás: azonnal elhalványul a régi tartalom, és csak az új autókkal jelenik meg újra
  + 'S.addEventListener("click",function(e){var tb=e.target.closest&&e.target.closest(".autok-tab,.cf-br");if(!tb||!stg)return;stg.classList.add("swap");sig="";'
  + 'setTimeout(function(){place(panel())},0);setTimeout(build,260);setTimeout(build,700);setTimeout(function(){stg.classList.remove("swap")},2500)},true)}'
  + '(function(){var y0=scrollY,w=null;addEventListener("scroll",function(){w=w||document.querySelector(".ca-navwrap");if(!w)return;var y=scrollY,d=y-y0;if(Math.abs(d)<6)return;'
  + 'var mp=w.querySelector(".mobilepanel"),open=mp&&mp.getBoundingClientRect().height>40&&getComputedStyle(mp).visibility!=="hidden"&&getComputedStyle(mp).display!=="none";'
  + 'if(d>0&&y>140&&!open&&!w.matches(":hover"))w.classList.add("ca-nav-hide");else if(d<0)w.classList.remove("ca-nav-hide");y0=y},{passive:true})})();'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot()'
  + '})();</script>';

try {
  if (!fs.existsSync(FILE)) console.log('[home-stage] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-stage-js"') > -1) console.log('[home-stage] már alkalmazva');
    else if (h.indexOf('id="autoink"') < 0) console.log('[home-stage] nincs #autoink — kihagyva');
    else {
      const dir = path.join('dist', 'elado-cut');
      const cuts = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : [];
      h = h.replace('<a class="btn btn-white" href="mailto:info@caradvance.hu?subject=Aut%C3%B3%20elad%C3%A1sa%20%E2%80%93%20bizom%C3%A1ny">Add el az autód</a>',
        '<a class="btn btn-white ca-hb-imp" href="/auto-rendeles/">Autó import</a><a class="btn btn-white" href="mailto:info@caradvance.hu?subject=Aut%C3%B3%20elad%C3%A1sa%20%E2%80%93%20bizom%C3%A1ny">Add el az autód</a>');
      h = h.replace('</head>', CSS + '</head>').replace(/<\/body>/i, JS.replace('__SALECUTS__', JSON.stringify(cuts)) + '</body>');
      fs.writeFileSync(FILE, h);
      console.log('[home-stage] színpad a Kínálat részben');
    }
  }
} catch (e) { console.log('[home-stage] hiba:', e.message); }
