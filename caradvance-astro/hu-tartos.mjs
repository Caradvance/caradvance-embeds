// hu-tartos.mjs — „Mi a tartós bérlet?” (HU, /tartos-berlet/) letisztult, Apple-szerű megjelenés
// 1 hero · 2 ragadós alnav · 3 ikonos előnypanel · 4 „Mi a tartós bérlet?” röviden + Bővebben
// 5 benne van / nincs · 6 idővonal · 7 Cég | Magán váltó · 8 elektromos kártyák · 9 kivágott márkaautók
// 10 kiemelt Caradvance oszlop · 11 GYIK: 6 + Összes · 12 letisztult lezárás. Csak a magyar oldal, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'tartos-berlet', 'index.html');
const CUTDIR = path.join('public', 'berles-cut');

const P = 'body section.tb ';
const D = 'html.ca-dark ';
const LN = 'rgba(18,19,23,.08)', LND = 'rgba(255,255,255,.08)';
const CSS = '<style id="ca-tb-css">'
  // ---- 1) hero
  + P + 'section.hero video.ca-lv{filter:brightness(.6) saturate(1.05)}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.45),0 1px 3px rgba(0,0,0,.3)}'
  + P + 'section.hero .sub{max-width:640px!important;margin-left:auto!important;margin-right:auto!important;font-size:18px!important}'
  + P + '.tb-chips{display:flex!important;justify-content:center!important;gap:0!important;margin:22px auto 26px!important;flex-wrap:nowrap!important}'
  + P + '.tb-chips span{background:none!important;border:0!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;padding:0 26px!important;border-radius:0!important;border-top:0!important;border-right:0!important;border-bottom:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;color:rgba(255,255,255,.78)!important;font-size:12.5px!important;font-weight:600!important;letter-spacing:.02em;text-shadow:0 1px 10px rgba(0,0,0,.4)}'
  + P + '.tb-chips span+span{border-left:1px solid rgba(255,255,255,.28)!important}'
  + P + '.tb-chips span b{display:block;color:#fff!important;font-size:26px!important;line-height:1.1;font-weight:800;letter-spacing:-.02em;margin-bottom:3px}'
  + P + '.tb-chips span.ca-hide{display:none!important}'
  + '@media(max-width:640px){' + P + '.tb-chips span{padding:0 12px!important;font-size:11px!important}' + P + '.tb-chips span b{font-size:19px!important}' + P + 'section.hero .sub{font-size:15.5px!important}}'
  // ---- 2) ragadós alnav
  + P + '.tb-crumb{display:flex!important;justify-content:center!important;font-size:12.5px!important;opacity:.6;margin-top:6px!important;margin-bottom:10px!important}'
  + P + 'nav.tb-toc.tb-toc{position:sticky!important;top:92px;z-index:30;display:flex!important;flex-wrap:nowrap!important;justify-content:flex-start!important;gap:2px!important;width:-moz-fit-content!important;width:fit-content!important;max-width:calc(100% - 32px)!important;margin:0 auto 10px!important;padding:5px!important;overflow-x:auto;scrollbar-width:none;border-radius:999px!important;background:rgba(255,255,255,.72)!important;border:1px solid rgba(18,19,23,.07)!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 6px 18px rgba(18,19,23,.05)!important;-webkit-backdrop-filter:blur(20px) saturate(1.6)!important;backdrop-filter:blur(20px) saturate(1.6)!important;transition:padding .25s,box-shadow .25s,background .25s}'
  + D + P + 'nav.tb-toc.tb-toc{background:rgba(28,29,34,.72)!important;border-color:rgba(255,255,255,.08)!important;box-shadow:0 8px 24px rgba(0,0,0,.35)!important}'
  + 'html:root ' + P + 'nav.tb-toc.ca-stuck{padding:4px!important;background:rgba(255,255,255,.95)!important;box-shadow:0 10px 30px rgba(18,19,23,.12)!important}'
  + 'html:root.ca-dark ' + P + 'nav.tb-toc.ca-stuck{background:rgba(22,23,28,.95)!important;box-shadow:0 12px 32px rgba(0,0,0,.5)!important}'
  + P + '.tb-toc::-webkit-scrollbar{display:none}'
  + P + '.tb-toc .ca-tpill{position:absolute;left:0;top:5px;bottom:5px;width:0;border-radius:999px;background:#121317;z-index:0;opacity:0;transition:transform .38s cubic-bezier(.3,.7,.2,1),width .38s cubic-bezier(.3,.7,.2,1),opacity .2s,top .25s,bottom .25s;pointer-events:none}'
  + P + 'nav.tb-toc.ca-stuck .ca-tpill{top:4px;bottom:4px}' + 'html:root ' + P + 'nav.tb-toc.tb-toc .ca-tpill.ca-hov{background:rgba(18,19,23,.08)!important;background-color:rgba(18,19,23,.08)!important;box-shadow:none}' + 'html:root.ca-dark ' + P + 'nav.tb-toc.tb-toc .ca-tpill.ca-hov{background:rgba(255,255,255,.09)!important;background-color:rgba(255,255,255,.09)!important;box-shadow:none}' + 'html:root ' + P + 'nav.tb-toc.ca-hovering a.on{color:#121317!important;-webkit-text-fill-color:#121317!important}' + 'html:root.ca-dark ' + P + 'nav.tb-toc.ca-hovering a.on{color:#fff!important;-webkit-text-fill-color:#fff!important}' + 'html:root ' + P + 'nav.tb-toc.ca-hovering a:hover{opacity:1}'
  + 'html:root.ca-dark ' + P + 'nav.tb-toc.tb-toc .ca-tpill{background:rgba(255,255,255,.16)!important;background-color:rgba(255,255,255,.16)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}'
  + 'html:root ' + P + 'nav.tb-toc.tb-toc a{position:relative;z-index:1;flex:0 0 auto!important;background:transparent!important;border:0!important;box-shadow:none!important;color:#121317!important;-webkit-text-fill-color:currentColor!important;opacity:.66;font-size:13px!important;font-weight:600!important;letter-spacing:-.005em;padding:8px 14px!important;border-radius:999px!important;white-space:nowrap;transition:opacity .2s,color .3s}'
  + 'html:root.ca-dark ' + P + 'nav.tb-toc.tb-toc a{color:#fff!important}'
  + P + '.tb-toc a::after,' + P + '.tb-toc a::before{display:none!important;content:none!important}'
  + 'html:root ' + P + 'nav.tb-toc.tb-toc a:hover{opacity:1}'
  + 'html:root ' + P + 'nav.tb-toc.tb-toc a.on{opacity:1;color:#fff!important}'
  + 'html:root.ca-dark ' + P + 'nav.tb-toc.tb-toc a.on{color:#fff!important}'
  + 'html:root ' + P + 'nav.tb-toc.tb-toc:not(.ca-pill) a.on{background:#121317!important}' + 'html:root.ca-dark ' + P + 'nav.tb-toc.tb-toc:not(.ca-pill) a.on{background:rgba(255,255,255,.16)!important}'
  + '@media(max-width:760px){' + P + 'nav.tb-toc.tb-toc{top:90px;max-width:calc(100% - 24px)!important;-webkit-mask:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent);mask:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent)}}'
  // ---- 3) előnyök (ugyanaz az ikonos panel, mint a Bérelhető autóinknál)
  + (P + '.rb-wrap{margin:6px 0 26px}'
  + P + '.rb-grid{gap:0!important;border-radius:22px;overflow:hidden;background:rgba(255,255,255,.62);border:1px solid rgba(18,19,23,.07);box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 28px rgba(18,19,23,.05);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}'
  + D + P + '.rb-grid{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.08);box-shadow:none}'
  + P + '.rb-card{background:none!important;border:0!important;box-shadow:none!important;border-radius:0!important;padding:20px 22px!important;min-height:0!important;text-align:center!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + P + '.rb-card:not(:nth-child(4n)){border-right:1px solid rgba(18,19,23,.07)!important}'
  + P + '.rb-card:nth-child(-n+4){border-bottom:1px solid rgba(18,19,23,.07)!important}'
  + D + P + '.rb-card:not(:nth-child(4n)){border-right-color:rgba(255,255,255,.07)!important}'
  + D + P + '.rb-card:nth-child(-n+4){border-bottom-color:rgba(255,255,255,.07)!important}'
  + P + '.rb-v{display:none!important}'
  + P + '.rb-h{font-size:17px!important;line-height:1.25!important;margin:0 0 5px!important;text-align:center!important;letter-spacing:-.01em}'
  + P + '.rb-p{font-size:13.5px!important;line-height:1.45!important;margin:0!important;text-align:center!important;opacity:.78}'
  + '@media(max-width:1100px){' + P + '.rb-card{border-right:0!important;border-bottom:0!important}' + P + '.rb-card:nth-child(odd){border-right:1px solid rgba(18,19,23,.07)!important}' + P + '.rb-card:nth-child(-n+6){border-bottom:1px solid rgba(18,19,23,.07)!important}'
  + D + P + '.rb-card:nth-child(odd){border-right-color:rgba(255,255,255,.07)!important}' + D + P + '.rb-card:nth-child(-n+6){border-bottom-color:rgba(255,255,255,.07)!important}}'
  + '@media(max-width:560px){' + P + '.rb-grid{display:grid!important;grid-template-columns:1fr 1fr!important;overflow:hidden!important;padding:0!important}' + P + '.rb-card{padding:14px 14px!important;flex:none!important;width:auto!important}' + P + '.rb-h{font-size:15px!important}' + P + '.rb-p{display:none!important}' + P + '.rb-card{padding:13px 10px!important}}'
  + P + '.rb-card{position:relative;transition:background .25s,transform .25s!important}'
  + P + '.rb-card.ca-rbx{padding:24px 20px 22px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;grid-row:auto!important;grid-template-rows:none!important}' + P + '.rb-grid{grid-template-rows:none!important;grid-auto-rows:auto!important}'
  + P + '.ca-rbi{width:46px;height:46px;margin:0 auto 14px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.08);color:#E2001A;transition:background .25s,color .25s,transform .25s,box-shadow .25s}'
  + D + P + '.ca-rbi{background:rgba(226,0,26,.14);box-shadow:0 0 26px rgba(226,0,26,.28)}'
  + P + '.ca-rbi svg{width:23px;height:23px}'
  + P + '.ca-rbk{display:block;font-size:24px;line-height:1.1;font-weight:800;letter-spacing:-.025em;margin:0 0 6px;text-align:center}'
  + P + '.rb-card.ca-rbx .rb-h,' + P + '.rb-card.ca-rbx .rb-p{position:static!important;inset:auto!important;transform:none!important}' + P + '.rb-card.ca-rbx .rb-h,' + P + '.rb-card.ca-rbx .rb-p{width:auto!important;max-width:100%;align-self:center!important;justify-content:center!important;text-align:center!important}'+ P + '.rb-card.ca-rbx .rb-h{font-size:14.5px!important;margin:0 0 4px!important;opacity:.95}'
  + P + '.rb-card.ca-rbx .rb-p{font-size:12.8px!important;opacity:.62}'
  + P + '.rb-card.ca-rbx:hover{background:rgba(255,255,255,.75)!important}'
  + D + P + '.rb-card.ca-rbx:hover{background:rgba(255,255,255,.04)!important}'
  + P + '.rb-card.ca-rbx:hover .ca-rbi{background:#E2001A;color:#fff;transform:translateY(-2px) scale(1.04);box-shadow:0 10px 22px rgba(226,0,26,.32)}'
  + P + '.ca-rbanim .rb-card.ca-rbx{opacity:0;transform:translateY(14px)}'
  + P + '.ca-rbanim.ca-in .rb-card.ca-rbx{opacity:1;transform:none;transition:opacity .6s ease var(--d),transform .6s cubic-bezier(.2,.7,.2,1) var(--d),background .25s!important}'
  + '@media(prefers-reduced-motion:reduce){' + P + '.ca-rbanim .rb-card.ca-rbx{opacity:1!important;transform:none!important}}'
  + '@media(max-width:560px){' + P + '.rb-card.ca-rbx{padding:16px 10px!important}' + P + '.ca-rbi{width:38px;height:38px;margin-bottom:9px;border-radius:12px}' + P + '.ca-rbi svg{width:20px;height:20px}' + P + '.ca-rbk{font-size:18px;margin-bottom:3px}' + P + '.rb-card.ca-rbx .rb-h{font-size:12.5px!important}}')
  // ---- 4) „Mi a tartós bérlet?”
  + P + '.tb-introbox{text-align:center!important;padding:44px 48px 36px!important}'
  + P + '.ca-tbbig{font-size:30px;line-height:1.2;font-weight:800;letter-spacing:-.025em;margin:6px auto 26px;max-width:760px}'
  + P + '.ca-tbbig em{font-style:normal;color:#E2001A}'
  + P + '.ca-tbkp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0 auto 22px;max-width:860px}'
  + P + '.ca-tbkp div{padding:18px 16px;border-radius:18px;background:rgba(18,19,23,.035);text-align:center}'
  + D + P + '.ca-tbkp div{background:rgba(255,255,255,.04)}'
  + P + '.ca-tbkp b{display:block;font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:3px}'
  + P + '.ca-tbkp span{font-size:13px;opacity:.65}'
  + P + '.ca-more{overflow:hidden;max-height:0;transition:max-height .45s ease;text-align:left}'
  + P + '.ca-more.open{max-height:3000px}'
  + P + '.ca-morebtn{display:inline-flex;align-items:center;gap:6px;margin:6px auto 0;background:none;border:1px solid rgba(18,19,23,.14);border-radius:999px;padding:9px 18px;font:600 13.5px/1 inherit;color:inherit;cursor:pointer}'
  + D + P + '.ca-morebtn{border-color:rgba(255,255,255,.18)}'
  + P + '.ca-morebtn i{font-style:normal;transition:transform .3s}' + P + '.ca-morebtn.open i{transform:rotate(180deg)}'
  + P + '.ca-morewrap{text-align:center}'
  + '@media(max-width:700px){' + P + '.tb-introbox{padding:30px 18px 26px!important}' + P + '.ca-tbbig{font-size:23px}' + P + '.ca-tbkp{grid-template-columns:1fr;gap:8px}' + P + '.ca-tbkp div{padding:12px}}'
  // ---- 5) benne van / nincs benne
  + P + '.tb-col{padding:28px 28px 22px!important;border-radius:22px!important}'
  + P + '.tb-col h3{font-size:20px!important;letter-spacing:-.015em;margin-bottom:16px!important;display:flex;align-items:center;gap:10px}'
  + P + '.tb-col h3::before{content:"";width:28px;height:28px;border-radius:50%;flex:0 0 auto;background:#0a8a4a url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 12.5l4 4 8-9%27/%3E%3C/svg%3E") center/16px no-repeat}'
  + P + '.tb-no h3::before{background:#8b8f98 url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M7 7l10 10M17 7L7 17%27/%3E%3C/svg%3E") center/14px no-repeat}'
  + P + '.tb-col ul{gap:0!important}'
  + P + '.tb-col li{display:grid!important;grid-template-columns:22px 1fr;column-gap:12px;padding:12px 0!important;border-top:1px solid ' + LN + '!important;margin:0!important;align-items:start}'
  + D + P + '.tb-col li{border-top-color:' + LND + '!important}'
  + P + '.tb-col li .tb-fee-icon{display:none!important}'
  + P + '.tb-col li::before{content:"";grid-row:1/3;width:20px;height:20px;margin-top:1px;border-radius:50%;background:rgba(10,138,74,.12) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%230a8a4a%27 stroke-width=%273.2%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 12.5l4 4 8-9%27/%3E%3C/svg%3E") center/12px no-repeat}'
  + P + '.tb-no li::before{background:rgba(139,143,152,.16) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238b8f98%27 stroke-width=%273.2%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M7 7l10 10M17 7L7 17%27/%3E%3C/svg%3E") center/11px no-repeat}'
  + P + '.tb-col li b{grid-column:2;font-size:15px!important;margin:0!important}'
  + P + '.tb-col li span{grid-column:2;font-size:13px!important;opacity:.62;margin-top:2px!important;display:block}'
  // ---- 6) idővonal
  + P + '.tb-steps{position:relative;gap:18px!important}'
  + P + '.tb-steps::before{content:"";position:absolute;left:10%;right:10%;top:24px;height:2px;background:linear-gradient(90deg,rgba(226,0,26,.0),rgba(226,0,26,.55) 12%,rgba(226,0,26,.55) 88%,rgba(226,0,26,0));z-index:0}'
  + P + '.tb-step{background:none!important;border:0!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;text-align:center!important;padding:0 6px!important;position:relative;z-index:1}'
  + P + '.tb-step .tb-n{width:48px!important;height:48px!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;margin:0 auto 16px!important;background:#E2001A!important;color:#fff!important;font-size:18px!important;font-weight:800!important;box-shadow:0 0 0 7px #F5F5F7,0 10px 22px rgba(226,0,26,.3)!important}'
  + D + P + '.tb-step .tb-n{box-shadow:0 0 0 7px #121318,0 0 26px rgba(226,0,26,.45)!important}'
  + P + '#menete .tb-more{margin-top:30px!important}' + P + '.tb-step h3{font-size:16.5px!important;margin:0 0 6px!important;letter-spacing:-.01em}'
  + P + '.tb-step p{font-size:13.5px!important;opacity:.68;line-height:1.5!important}'
  + '@media(max-width:860px){' + P + '.tb-steps{display:flex!important;flex-direction:column!important;gap:0!important;padding-left:4px}' + P + '.tb-steps::before{left:27px;right:auto;width:2px;height:auto;top:20px;bottom:40px;background:rgba(226,0,26,.45)}'
  + P + '.tb-step{display:grid!important;grid-template-columns:48px 1fr;column-gap:16px;text-align:left!important;padding:0 0 22px!important}' + P + '.tb-step .tb-n{grid-row:1/3;margin:0!important}' + P + '.tb-step h3{margin-top:12px!important}}'
  // ---- 7) Cég | Magán váltó
  + P + '.ca-cmtog{display:flex;justify-content:center;margin:34px auto 6px}'
  + P + '.ca-cmtog div{display:inline-flex;padding:4px;border-radius:14px;background:rgba(18,19,23,.06)}' + D + P + '.ca-cmtog div{background:rgba(255,255,255,.08)}'
  + P + '.ca-cmtog button{height:42px;padding:0 22px;border:0;border-radius:11px;background:transparent;color:inherit;font:700 14.5px/1 inherit;cursor:pointer;opacity:.65;transition:all .2s}'
  + P + '.ca-cmtog button.on{opacity:1;background:#fff;color:#121317;box-shadow:0 2px 8px rgba(18,19,23,.12)}' + D + P + '.ca-cmtog button.on{background:rgba(255,255,255,.16);color:#fff;box-shadow:none}'
  + P + '#cegeknek.ca-off,' + P + '#maganszemelyeknek.ca-off{display:none!important}'
  + P + '#cegeknek,' + P + '#maganszemelyeknek{padding-top:28px!important}'
  + P + '.tb-split-t .ca-more{margin-top:4px}'
  + P + '.tb-split-t .ca-morewrap{text-align:left}'
  + P + '.tb-pt{border-radius:18px!important}'
  // ---- 8) elektromos kártyák
  + P + '.tb-evs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px!important;margin:18px 0 14px!important}'
  + P + '.tb-evs a{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:2px!important;padding:14px 18px 18px!important;border-radius:20px!important;background:rgba(255,255,255,.7)!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 8px 20px rgba(18,19,23,.05)!important;text-decoration:none!important;color:inherit!important;transition:transform .2s,box-shadow .2s}'
  + D + P + '.tb-evs a{background:rgba(255,255,255,.04)!important;border-color:' + LND + '!important;box-shadow:none!important}'
  + P + '.tb-evs a:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(18,19,23,.10)!important}'
  + P + '.tb-evs a img{width:100%;height:130px;object-fit:contain;margin:0 0 8px;filter:drop-shadow(0 10px 9px rgba(18,19,23,.16))}'
  + D + P + '.tb-evs a img{filter:drop-shadow(0 12px 10px rgba(0,0,0,.5))}'
  + P + '.tb-evs a span{font-size:16px!important;font-weight:700!important;color:inherit!important}'
  + P + '.tb-evs a b{font-size:14px!important;color:#E2001A!important;font-weight:700!important}'
  + P + '.tb-evs a i{font-style:normal;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#0a8a4a;margin-bottom:2px}'
  + D + P + '.tb-evs a i{color:#3ddc8a}'
  + '@media(max-width:760px){' + P + '.tb-evs{grid-template-columns:1fr!important}}'
  // ---- 9) márkák: kivágott autó
  + P + '.tb-bph{background:transparent!important;border:0!important;box-shadow:none!important}'
  + P + '.tb-bph.ca-cutb{background:radial-gradient(60% 50% at 50% 80%,rgba(18,19,23,.06),transparent 70%)!important}'
  + D + P + '.tb-bph.ca-cutb{background:radial-gradient(60% 50% at 50% 80%,rgba(255,255,255,.06),transparent 70%)!important}'
  + P + '.tb-bph.ca-cutb img{object-fit:contain!important;padding:10px 12px 4px;box-sizing:border-box;filter:drop-shadow(0 10px 8px rgba(18,19,23,.16));mix-blend-mode:normal!important;background:transparent!important}'
  + D + P + '.tb-bph.ca-cutb img{filter:drop-shadow(0 12px 10px rgba(0,0,0,.5))}'
  + P + '.tb-brands>a{border-radius:20px!important;transition:transform .2s,box-shadow .2s}' + P + '.tb-brands>a:hover{transform:translateY(-3px)}'
  // ---- 10) összevető táblázat: Caradvance oszlop kiemelve
  + P + '.tb-cmp{border-collapse:separate!important;border-spacing:0}'
  + P + '.tb-cmp th:last-child,' + P + '.tb-cmp td.hl{background:rgba(226,0,26,.06)!important;border-left:2px solid #E2001A!important;border-right:2px solid #E2001A!important;font-weight:700!important;color:inherit!important}'
  + D + P + '.tb-cmp th:last-child,' + D + P + '.tb-cmp td.hl{background:rgba(226,0,26,.12)!important}'
  + P + '.tb-cmp th:last-child{border-top:2px solid #E2001A!important;border-radius:14px 14px 0 0;position:relative;padding-top:22px!important}'
  + P + '.tb-cmp tbody tr:last-child td.hl{border-bottom:2px solid #E2001A!important;border-radius:0 0 14px 14px}'
  + P + '.tb-cmp th:last-child .ca-rec{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#E2001A;color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:999px;white-space:nowrap}'
  + P + '.tb-cmp td.hl::before{content:"✓ ";color:#0a8a4a}' + D + P + '.tb-cmp td.hl::before{color:#3ddc8a}'
  + '@media(min-width:861px){' + P + '#lizing .tb-tw{overflow:visible!important;padding-top:14px!important}}' + '@media(max-width:860px){' + P + '#lizing .tb-tw{overflow-x:auto!important;padding-top:16px!important}' + P + '.tb-cmp th:last-child,' + P + '.tb-cmp td.hl{min-width:150px}}'
  // ---- 11) GYIK
  + P + '.tb-faq{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px!important;align-items:start}'
  + P + '.tb-faq details{margin:0!important;border-radius:16px!important}'
  + P + '.tb-faq:not(.ca-all) details:nth-of-type(n+7){display:none!important}'
  + P + '.ca-faqbtn{grid-column:1/-1;justify-self:center;margin-top:8px}'
  + '@media(max-width:900px){' + P + '.tb-faq{grid-template-columns:1fr}}'
  // ---- 12) lezárás
  + P + '.tb-rl{gap:8px!important}'
  + P + '.tb-rl a{background:transparent!important;border:1px solid rgba(18,19,23,.12)!important;box-shadow:none!important;border-radius:999px!important;padding:9px 15px!important;font-weight:600!important;color:inherit!important;transition:background .2s,border-color .2s}'
  + D + P + '.tb-rl a{border-color:rgba(255,255,255,.16)!important}'
  + P + '.tb-rl a:hover{border-color:#E2001A!important;color:#E2001A!important}'
  + P + '.tb-cta{border-radius:26px!important;background:radial-gradient(70% 120% at 100% 0%,rgba(226,0,26,.38),transparent 60%),linear-gradient(135deg,#17181d,#0e0f12)!important;box-shadow:0 20px 50px rgba(18,19,23,.18)!important;padding:34px 38px!important;overflow:hidden}'
  + P + '.tb-cta h2{font-size:30px!important;letter-spacing:-.02em}'
  + P + '.tb-cta .btn{background:#E2001A!important;color:#fff!important;border:0!important;box-shadow:0 10px 24px rgba(226,0,26,.35)!important}'
  + '</style>';

function js(cuts) {
  return '<script id="ca-tb-js">(function(){var CUTS=' + JSON.stringify(cuts) + ';var R=document.querySelector("section.tb");if(!R)return;'
  + 'function $(s,r){return (r||R).querySelector(s)}function $$(s,r){return [].slice.call((r||R).querySelectorAll(s))}'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  // 1) hero
  + 'function hero(){var s=$("section.hero .sub");if(s&&!s.__t){s.__t=1;s.textContent="Egy fix havidíj — casco, szerviz, adó és gumi benne. Önerő nélkül, cégeknek és magánszemélyeknek."}'
  + '$$(".tb-chips span").forEach(function(x){if(/kauci/i.test(x.textContent))x.classList.add("ca-hide")})}'
  // 2) alnav
  + 'function toc(){var t=$(".tb-toc");if(!t||t.__t)return;t.__t=1;var L=$$("a",t),S=L.map(function(a){var h=(a.getAttribute("href")||"").replace(/^.*#/,"");return document.getElementById(h)});'
  + 'function upd(){var y=innerHeight*.32,on=-1;S.forEach(function(s,i){if(!s||s.classList.contains("ca-off"))return;var r=s.getBoundingClientRect();if(r.top<y&&r.bottom>60)on=i});'
  + 'if(on<0){var mg=document.getElementById("maganszemelyeknek");if(mg&&!mg.classList.contains("ca-off")){var r=mg.getBoundingClientRect();if(r.top<y&&r.bottom>60)on=L.findIndex(function(a){return /cegeknek/.test(a.getAttribute("href"))})}}'
  + 'L.forEach(function(a,i){var o=i===on;if(a.classList.contains("on")!==o){a.classList.toggle("on",o);if(o&&t.scrollWidth>t.clientWidth)t.scrollTo({left:a.offsetLeft-40,behavior:"smooth"})}});pill(on>=0?L[on]:null);t.classList.toggle("ca-stuck",t.getBoundingClientRect().top<=94&&scrollY>200)}'
  + 'var pl=document.createElement("span");pl.className="ca-tpill";pl.setAttribute("data-dm-skip","1");t.insertBefore(pl,t.firstChild);t.classList.add("ca-pill");if(matchMedia("(hover:hover) and (pointer:fine)").matches){L.forEach(function(a){a.addEventListener("mouseenter",function(){hv=a;place(a,a!==cur)});a.addEventListener("click",function(){hv=null;cur=a;L.forEach(function(x){x.classList.toggle("on",x===a)});place(a,false)})});t.addEventListener("mouseleave",function(){hv=null;place(cur,false)})}'
  + 'var hv=null,cur=null;function pill(a){cur=a;if(hv)return;place(a,false)}function place(a,h){pl.classList.toggle("ca-hov",!!h);t.classList.toggle("ca-hovering",!!h);var dk=document.documentElement.classList.contains("ca-dark");L.forEach(function(x){if(x===a&&!h){x.style.setProperty("color","#fff","important");x.style.setProperty("-webkit-text-fill-color","#fff","important")}else{x.style.removeProperty("color");x.style.removeProperty("-webkit-text-fill-color")}});if(!a){pl.style.opacity="0";return}pl.style.width=a.offsetWidth+"px";pl.style.transform="translateX("+a.offsetLeft+"px)";pl.style.opacity="1"}addEventListener("resize",function(){upd()});'
  + 'addEventListener("scroll",function(){requestAnimationFrame(upd)},{passive:true});upd();'
  + 'L.forEach(function(a){a.addEventListener("click",function(e){var h=(a.getAttribute("href")||"").replace(/^.*#/,"");if(h==="maganszemelyeknek"||h==="cegeknek"){if(window.__caCM)window.__caCM(h==="cegeknek"?"c":"m")}var s=document.getElementById(h==="maganszemelyeknek"?"maganszemelyeknek":h);if(s){e.preventDefault();scrollTo({top:s.getBoundingClientRect().top+scrollY-150,behavior:"smooth"});history.replaceState(null,"","#"+h)}})})}'
  // 3) előnyök
  + ('var IC={new:\'<path d="M5 17h14M6 17l1.5-5h9L18 17M8 12l1.2-3.2A2 2 0 0 1 11 7.5h2a2 2 0 0 1 1.8 1.3L16 12"/><circle cx="8" cy="17.5" r="1.6"/><circle cx="16" cy="17.5" r="1.6"/><path d="M19 3v4M17 5h4"/>\',back:\'<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>\',shield:\'<path d="M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>\',tire:\'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3"/>\',plate:\'<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M5.5 7v10"/><path d="M9 12h9"/>\',wrench:\'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.4-.4-2.4z"/>\',cal:\'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 14.5l2 2 4-4"/>\',zero:\'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.3 2.3 4.7-5"/>\'};'
  + 'var RB=[[/0 km/i,"new","Vadonatúj","0 km, gyári garanciával."],[/kauci/i,"back","2 500 €-tól","A bérlés végén visszajár."],[/casco/i,"shield","Benne a díjban","Nyugodtan vezethetsz."],[/gumi/i,"tire","2 garnitúra","Szezonális cserével együtt."],[/rendsz/i,"plate","München","Caradvance GmbH, német rendszám."],[/szerviz/i,"wrench","0 Ft extra","Szerviz és adó a havidíjban."],[/futamid/i,"cal","6 hónaptól","2–4 ezer km/hó, utána modellváltás."],[/önerő|onero/i,"zero","0 Ft","Nincs értékvesztés, eladási gond."]];'
  + 'function rb(){var g=document.querySelector("section.tb .rb-grid");if(!g||g.__rb)return;g.__rb=1;var i=0;'
  + '[].forEach.call(g.querySelectorAll(".rb-card"),function(c){var h=c.querySelector(".rb-h");if(!h)return;var t=h.textContent,m=null;RB.forEach(function(r){if(!m&&r[0].test(t))m=r});if(!m)return;'
  + 'c.classList.add("ca-rbx");c.style.setProperty("--d",(i++*70)+"ms");var ic=document.createElement("span");ic.className="ca-rbi";ic.innerHTML=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">\'+IC[m[1]]+"</svg>";'
  + 'var k=document.createElement("b");k.className="ca-rbk";var pp0=c.querySelector(".rb-p"),mm=m[1]==="back"&&pp0&&(pp0.textContent||"").match(/(\\d[\\d\\s\\u00a0]*)\\s?€/);k.textContent=mm?mm[1].replace(/\\s+/g," ").trim()+" €-tól":m[2];c.insertBefore(k,c.firstChild);c.insertBefore(ic,k);ic.setAttribute("data-dm-skip","1");k.setAttribute("data-dm-skip","1");var pp=c.querySelector(".rb-p");if(pp)pp.textContent=m[3]});'
  + 'if(!("IntersectionObserver" in window))return;g.classList.add("ca-rbanim");var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){g.classList.add("ca-in");io.disconnect()}})},{threshold:.15});io.observe(g)}')
  // 4) „Mi a tartós bérlet?” + Bővebben
  + 'function more(box,keep,label){if(!box||box.__m)return;box.__m=1;var ch=[].slice.call(box.children).slice(keep);if(!ch.length)return;var m=el("div","ca-more");ch.forEach(function(c){m.appendChild(c)});var w=el("div","ca-morewrap"),b=el("button","ca-morebtn",(label||"Bővebben")+" <i>⌄</i>");b.type="button";w.appendChild(b);box.appendChild(w);box.appendChild(m);'
  + 'b.addEventListener("click",function(){var o=m.classList.toggle("open");b.classList.toggle("open",o);b.firstChild.nodeValue=o?"Kevesebb ":(label||"Bővebben")+" "})}'
  + 'function miez(){var b=$("#mi-ez .tb-introbox");if(!b||b.__k)return;b.__k=1;var h=$("h2",b);'
  + 'var big=el("p","ca-tbbig","Új autó fix havidíjért — <em>vásárlás, hitel és önerő nélkül.</em>");var kp=el("div","ca-tbkp","<div><b>6 hónaptól</b><span>Rövid, rugalmas futamidő</span></div><div><b>Minden benne</b><span>Casco, szerviz, adó, gumi</span></div><div><b>Visszaadod</b><span>Nincs eladás, nincs értékvesztés</span></div>");'
  + 'if(h){h.parentNode.insertBefore(big,h.nextSibling);big.parentNode.insertBefore(kp,big.nextSibling)}var idx=[].indexOf.call(b.children,kp)+1;more(b,idx)}'
  // 7) Cég | Magán
  + 'function cm(){var c=document.getElementById("cegeknek"),m=document.getElementById("maganszemelyeknek");if(!c||!m||c.__c)return;c.__c=1;'
  + 'var t=el("div","ca-cmtog","<div role=\'tablist\'><button type=\'button\' data-k=\'c\'>Cégeknek</button><button type=\'button\' data-k=\'m\'>Magánszemélyeknek</button></div>");c.parentNode.insertBefore(t,c);'
  + 'function set(k){c.classList.toggle("ca-off",k!=="c");m.classList.toggle("ca-off",k!=="m");$$("button",t).forEach(function(x){x.classList.toggle("on",x.dataset.k===k);x.setAttribute("aria-selected",x.dataset.k===k)})}'
  + 'window.__caCM=set;t.addEventListener("click",function(e){var x=e.target.closest("button");if(x)set(x.dataset.k)});set(/maganszemelyeknek/.test(location.hash)?"m":"c");'
  + 'var evx=$("#elektromos .tb-text");if(evx&&!evx.__m){var eps=$$(":scope>p",evx);if(eps.length>1){var evs=$(".tb-evs",evx);if(evs&&eps[0])evx.insertBefore(evs,eps[0].nextSibling);more(evx,[].indexOf.call(evx.children,evs)+1)}}'
  + '[c,m].forEach(function(s){var tx=$(".tb-split-t",s);if(tx){var ps=$$("p",tx);if(ps.length>1){var i=[].indexOf.call(tx.children,ps[0])+1;more(tx,i)}}})}'
  // 8) elektromos
  + 'function ev(){$$(".tb-evs a").forEach(function(a){if(a.__e)return;a.__e=1;var m=(a.getAttribute("href")||"").match(/berelheto-auto\\/([^\\/]+)-berles/);var k=m&&m[1];if(k&&CUTS.indexOf(k)>-1){var im=document.createElement("img");im.src="/berles-cut/"+k+".webp";im.alt="";im.loading="lazy";a.insertBefore(im,a.firstChild)}var i=document.createElement("i");i.textContent="Elektromos";a.insertBefore(i,a.querySelector("span"))})}'
  // 9) márkák
  + 'function brands(){$$(".tb-bcar").forEach(function(im){if(im.__b)return;im.__b=1;var m=(im.getAttribute("src")||"").match(/\\/berles\\/([^\\/?#]+)\\.webp/);if(m&&CUTS.indexOf(m[1])>-1){im.src="/berles-cut/"+m[1]+".webp";var p=im.closest(".tb-bph");if(p)p.classList.add("ca-cutb")}})}'
  // 10) táblázat
  + 'function cmp(){var th=$(".tb-cmp thead th:last-child");if(th&&!th.querySelector(".ca-rec")){var s=el("span","ca-rec","Ajánlott");th.appendChild(s)}}'
  // 11) GYIK
  + 'function faq(){var f=$(".tb-faq");if(!f||f.__f)return;f.__f=1;var n=$$("details",f).length;if(n<=6)return;var b=el("button","ca-morebtn ca-faqbtn","Összes kérdés ("+n+") <i>⌄</i>");b.type="button";f.appendChild(b);b.addEventListener("click",function(){var o=f.classList.toggle("ca-all");b.classList.toggle("open",o);b.firstChild.nodeValue=o?"Kevesebb kérdés ":"Összes kérdés ("+n+") "})}'
  + 'function go(){try{hero()}catch(e){}try{toc()}catch(e){}try{rb()}catch(e){}try{miez()}catch(e){}try{cm()}catch(e){}try{ev()}catch(e){}try{brands()}catch(e){}try{cmp()}catch(e){}try{faq()}catch(e){}}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()'
  + '})();</script>';
}

export function apply(h, cuts) {
  if (h.indexOf('id="ca-tb-css"') > -1) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => js(cuts) + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-tartos] nincs', FILE); process.exit(0); }
  const cuts = fs.existsSync(CUTDIR) ? fs.readdirSync(CUTDIR).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : [];
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h, cuts);
  if (o === h) console.log('[hu-tartos] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-tartos] tartós bérlet oldal: letisztult nézet'); }
}
