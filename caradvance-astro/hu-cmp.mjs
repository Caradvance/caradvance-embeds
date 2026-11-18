// hu-cmp.mjs — Autó összehasonlítás (HU, /auto-osszehasonlitas/) letisztult, prémium megjelenés
// 1 hero · 2 autóválasztó kártyák kereshető listával · 3 nézet- és igazítás-váltó pirulákkal
// 4 „ki nyer” sávok + összesítő · 5 letisztult autókártyák · 6 családi autók: képes, lapozható sor (és a lassulás megszüntetése)
// 7 ragadós sáv a két autóval · 8 mobil. Csak a magyar oldal, idempotens. Az eredeti oldal logikáját (#s1/#s2, render) használja.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'auto-osszehasonlitas', 'index.html');

const R = 'body .cmp ';
const D = 'html.ca-dark ';
const RD = D + R;
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:rgba(255,255,255,.8)!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CARDD = 'background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;';

const CSS = '<style id="ca-cmp-css">'
  // ---- teljesítmény: a sok elmosott üvegdoboz okozta a lassulást
  + R + '.ca-gl,' + R + '.fi,' + R + '.step,' + R + 'details{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + R + '.fi{transition:transform .2s,box-shadow .2s,border-color .2s!important}'
  // ---- 1) hero
  + R + 'header.cmp-hero{background:transparent!important;background-image:none!important;padding:118px 20px 26px!important;text-align:center;position:relative}'
  + 'html body .cmp header.cmp-hero.cmp-hero,html.ca-dark body .cmp header.cmp-hero.cmp-hero{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border:0!important}' + R + 'header.cmp-hero>.ca-hfade{display:none!important}' + R + 'header.cmp-hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(50% 70% at 50% 0%,rgba(226,0,26,.10),transparent 70%)}'
  + RD + 'header.cmp-hero::before{background:radial-gradient(50% 70% at 50% 0%,rgba(226,0,26,.22),transparent 70%)}'
  + R + '.cmp-hero-in{max-width:780px!important;margin:0 auto!important;position:relative}'
  + R + '.cmp-hero h1{color:#121317!important;font-size:46px!important;line-height:1.08!important;letter-spacing:-.03em!important;margin:10px 0 14px!important}'
  + RD + '.cmp-hero h1{color:#fff!important}'
  + R + '.cmp-hero h1 em{font-style:normal;color:#E2001A}'
  + R + '.cmp-lead{color:rgba(18,19,23,.62)!important;font-size:17px!important;max-width:600px;margin:0 auto!important}'
  + RD + '.cmp-lead{color:rgba(255,255,255,.66)!important}'
  + R + '.cmp-kicker{display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(226,0,26,.08);color:#E2001A!important;font-size:11.5px!important;font-weight:800;letter-spacing:.12em;text-transform:uppercase}'
  + RD + '.cmp-kicker{background:rgba(226,0,26,.16)}'
  + '@media(max-width:640px){' + R + 'header.cmp-hero{padding:96px 16px 14px!important}' + R + '.cmp-hero h1{font-size:31px!important}' + R + '.cmp-lead{font-size:15px!important}}'
  // ---- 2) választók
  + R + '.cpick{display:grid!important;grid-template-columns:1fr auto 1fr!important;align-items:center!important;gap:14px!important;max-width:980px;margin:6px auto 18px!important;position:relative!important;z-index:45!important}'
  + R + '.cpick .pk{display:none!important}'
  + R + '.ca-pk{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:12px 16px 12px 12px;border-radius:22px;cursor:pointer;text-align:left;font:inherit;color:inherit;width:100%;' + CARD + 'transition:box-shadow .2s,transform .2s,border-color .2s}'
  + RD + '.ca-pk{' + CARDD + '}'
  + R + '.ca-pk:hover{transform:translateY(-1px);box-shadow:0 14px 34px rgba(18,19,23,.10)!important}'
  + R + '.ca-pk.k1{border-color:rgba(226,0,26,.28)!important}' + R + '.ca-pk.k2{border-color:rgba(27,42,74,.25)!important}'
  + RD + '.ca-pk.k2{border-color:rgba(120,150,220,.3)!important}'
  + R + '.ca-pk .im{width:128px;height:64px;display:flex;align-items:flex-end;justify-content:center}'
  + R + '.ca-pk .im img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 8px 6px rgba(18,19,23,.18))}'
  + RD + '.ca-pk .im img{filter:drop-shadow(0 8px 8px rgba(0,0,0,.6))}'
  + R + '.ca-pk .tx{min-width:0;text-align:left}' + R + '.ca-pk .lb{justify-content:flex-start}'
  + R + '.ca-pk .lb{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(18,19,23,.5);margin-bottom:3px}' + RD + '.ca-pk .lb{color:rgba(255,255,255,.5)}'
  + R + '.ca-pk .nm{display:block;font-size:19px;font-weight:800;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + R + '.ca-pk .pr{display:block;font-size:13px;opacity:.62;margin-top:2px}'
  + R + '.ca-pk .ch{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(18,19,23,.05);font-size:14px}'
  + RD + '.ca-pk .ch{background:rgba(255,255,255,.08)}'
  + R + '.ca-n{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;color:#fff;font-size:11.5px;font-weight:800;letter-spacing:0;opacity:1}'
  + R + '.ca-n.n1{background:#E2001A}' + R + '.ca-n.n2{background:#1B2A4A}' + RD + '.ca-n.n2{background:#4C6BB0}'
  + R + '#swap.cbtn{width:48px!important;height:48px!important;min-width:48px;padding:0!important;border-radius:50%!important;font-size:0!important;display:flex!important;align-items:center;justify-content:center;background:#121317!important;color:#fff!important;border:0!important;box-shadow:0 8px 20px rgba(18,19,23,.22)!important;transition:transform .35s cubic-bezier(.3,.7,.2,1)!important}'
  + R + '#swap.cbtn::after{content:"⇄";font-size:20px;line-height:1}'
  + R + '#swap.cbtn:hover{transform:rotate(180deg)}'
  + RD + '#swap.cbtn{background:#fff!important;color:#121317!important}'
  + R + '#swap2,' + R + '.cviews .vsep{display:none!important}'
  // lenyíló, kereshető lista
  + R + '.ca-pop{position:absolute;z-index:60;top:calc(100% + 8px);left:0;right:0;min-width:300px;max-height:420px;display:flex;flex-direction:column;border-radius:20px;background:#fff;border:1px solid ' + LN + ';box-shadow:0 24px 60px rgba(18,19,23,.18);overflow:hidden;cursor:default}'
  + 'html body .cmp .cpick .ca-pop.ca-pop{background:#fff!important;background-color:#fff!important;opacity:1!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' + 'html.ca-dark body .cmp .cpick .ca-pop.ca-pop{background:#1C1D22!important;background-color:#1C1D22!important}' + RD + '.ca-pop{background:#1C1D22;border-color:rgba(255,255,255,.1);box-shadow:0 24px 60px rgba(0,0,0,.6)}'
  + R + '.ca-pop input{margin:10px;padding:12px 14px;border-radius:12px;border:1px solid ' + LN + ';background:rgba(18,19,23,.04);font:inherit;font-size:15px;color:inherit;outline:none}'
  + RD + '.ca-pop input{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}'
  + R + '.ca-pop .ls{overflow:auto;padding:0 6px 8px;overscroll-behavior:contain}'
  + R + '.ca-pop .gh{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.5;padding:10px 10px 4px}'
  + R + '.ca-pop .op{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:0;border-radius:12px;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}'
  + R + '.ca-pop .op:hover,' + R + '.ca-pop .op.hl{background:rgba(18,19,23,.05)}' + RD + '.ca-pop .op:hover,' + RD + '.ca-pop .op.hl{background:rgba(255,255,255,.07)}'
  + R + '.ca-pop .op.on{background:rgba(226,0,26,.08)}'
  + R + '.ca-pop .op img{width:62px;height:28px;object-fit:contain}'
  + R + '.ca-pop .op b{font-size:14.5px;font-weight:700;flex:1}'
  + R + '.ca-pop .op span{font-size:12.5px;opacity:.55;white-space:nowrap}'
  + R + '.ca-pop .em{padding:18px;text-align:center;opacity:.6}'
  + '@media(max-width:760px){' + R + '.cpick{grid-template-columns:1fr!important;gap:8px!important}' + R + '#swap.cbtn{justify-self:center;width:42px!important;height:42px!important;min-width:42px;transform:rotate(90deg)}' + R + '#swap.cbtn:hover{transform:rotate(270deg)}' + R + '.ca-pk .im{width:96px;height:48px}' + R + '.ca-pk .nm{font-size:17px}}'
  // ---- 3) nézetek + igazítás: pirulás váltók
  + R + '.cviews{display:flex!important;justify-content:center!important;gap:0!important;width:fit-content;margin:0 auto 14px!important;padding:5px!important;border-radius:999px;background:rgba(18,19,23,.06);flex-wrap:nowrap!important}'
  + RD + '.cviews{background:rgba(255,255,255,.08)}'
  + R + '.cviews .cbtn{height:40px!important;padding:0 20px!important;border-radius:999px!important;border:0!important;background:transparent!important;box-shadow:none!important;color:inherit!important;font-size:14.5px!important;font-weight:700!important;opacity:.7}'
  + R + '.cviews .cbtn.on{opacity:1;background:#fff!important;color:#121317!important;box-shadow:0 2px 8px rgba(18,19,23,.12)!important}'
  + RD + '.cviews .cbtn.on{background:rgba(255,255,255,.16)!important;color:#fff!important;box-shadow:none!important}'
  + R + '.cstage{border-radius:26px!important;' + CARD + 'background:linear-gradient(180deg,#fff,#F3F4F7)!important}'
  + RD + '.cstage{' + CARDD + 'background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))!important}'
  + R + '.cstage .hlab .v,' + R + '.cstage .band .v{font-variant-numeric:tabular-nums}'
  + R + '.cstage .hlab{z-index:4}'
  + R + '.cstage .hlab .hrow{background:rgba(255,255,255,.86);border-radius:9px;padding:2px 6px 2px 2px}'
  + RD + '.cstage .hlab .hrow{background:rgba(22,23,28,.8)}'
  + R + '#align{display:flex!important;justify-content:center!important;align-items:center;flex-wrap:wrap!important;gap:4px!important;width:fit-content;max-width:100%;margin:14px auto 6px!important;padding:5px!important;border-radius:999px;background:rgba(18,19,23,.05);border:0!important;box-shadow:none!important}'
  + RD + '#align{background:rgba(255,255,255,.06)}'
  + R + '#align::before{content:"Igazítás:";font-size:12px;font-weight:700;opacity:.55;padding:0 8px 0 10px}'
  + R + '#align button{display:inline-flex!important;flex-direction:row!important;align-items:center!important;height:34px!important;padding:0 14px!important;border-radius:999px!important;border:0!important;background:transparent!important;box-shadow:none!important;color:inherit!important;opacity:.7;width:auto!important;min-width:0!important}'
  + R + '#align button svg{display:none!important}'
  + 'html body .cmp #align button span{display:inline!important}' + R + '#align button span{font-size:13px!important;font-weight:700!important;margin:0!important;color:inherit!important;opacity:1!important}'
  + R + '#align button.on{opacity:1;background:#121317!important;color:#fff!important}'
  + RD + '#align button.on{background:rgba(255,255,255,.16)!important}'
  + R + '#align.off{display:none!important}'
  + R + '.cnote{text-align:center;opacity:.6}'
  // ---- 4) ki nyer: összesítő + sávok
  + R + '.ca-score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;max-width:760px;margin:26px auto 14px;padding:16px 22px;border-radius:22px;' + CARD + '}'
  + RD + '.ca-score{' + CARDD + '}'
  + R + '.ca-score .sd{display:flex;align-items:center;gap:10px;min-width:0}' + R + '.ca-score .sd.r{justify-content:flex-end;text-align:right}'
  + R + '.ca-score .sd b{font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + R + '.ca-score .sc{font-size:34px;font-weight:900;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap}'
  + R + '.ca-score .sc i{font-style:normal;opacity:.3;margin:0 10px}'
  + R + '.ca-score .sc .a{color:#E2001A}' + R + '.ca-score .sc .b{color:#1B2A4A}' + RD + '.ca-score .sc .b{color:#7E9BE0}'
  + R + '.ca-score .cap{grid-column:1/-1;text-align:center;font-size:12.5px;opacity:.55;margin-top:-6px}'
  + R + '#tbl{width:100%;border-collapse:separate!important;border-spacing:0;border-radius:22px;overflow:hidden;' + CARD + '}'
  + RD + '#tbl{' + CARDD + '}'
  + R + '#tbl td,' + R + '#tbl th{border:0!important;border-bottom:1px solid ' + LN + '!important;padding:13px 18px!important;background:transparent!important}'
  + RD + '#tbl td,' + RD + '#tbl th{border-bottom-color:rgba(255,255,255,.06)!important}'
  + R + '#tbl tr:last-child td{border-bottom:0!important}'
  + R + '#tbl td.v{font-weight:700;font-variant-numeric:tabular-nums;width:36%}'
  + R + '#tbl td.v .w{display:none!important}'
  + R + '.ca-bar{display:block;height:6px;border-radius:6px;background:rgba(18,19,23,.06);margin-top:7px;overflow:hidden}'
  + RD + '.ca-bar{background:rgba(255,255,255,.07)}'
  + R + '.ca-bar i{display:block;height:100%;border-radius:6px;background:#E2001A;opacity:.35;transition:width .5s cubic-bezier(.3,.7,.2,1)}'
  + R + 'td.v.c2 .ca-bar i{background:#1B2A4A}' + RD + 'td.v.c2 .ca-bar i{background:#7E9BE0}'
  + R + 'td.v.win .ca-bar i{opacity:1}'
  + R + 'td.v.win{color:#0a8a4a!important}' + RD + 'td.v.win{color:#3ddc8a!important}'
  
  // ---- 5) autókártyák
  + R + '#cards{gap:18px!important}'
  + R + '.ccard{border-radius:24px!important;padding:22px 22px 22px!important;' + CARD + '}'
  + RD + '.ccard{' + CARDD + '}'
  + R + '.ccard .ca-cim{height:112px;display:flex;align-items:flex-end;justify-content:center;margin:-4px 0 12px}'
  + R + '.ccard .ca-cim img{max-height:100%;max-width:88%;object-fit:contain;filter:drop-shadow(0 12px 10px rgba(18,19,23,.18))}'
  + RD + '.ccard .ca-cim img{filter:drop-shadow(0 12px 10px rgba(0,0,0,.6))}'
  + R + '.ccard h3{font-size:21px!important;letter-spacing:-.02em}'
  + R + '.ccard .cbadges{gap:6px!important}'
  + R + '.ccard .bd{border-radius:999px!important;font-weight:700!important;font-size:12px!important;padding:5px 10px!important;text-decoration:none!important}'
  + R + '.ccard .bd:not(.no):not(.i){background:rgba(10,138,74,.1)!important;color:#0a7a42!important}'
  + RD + '.ccard .bd:not(.no):not(.i){background:rgba(61,220,138,.12)!important;color:#3ddc8a!important}'
  + R + '.ccard .bd:not(.no):not(.i)::before{content:"✓ "}'
  + R + '.ccard .bd.no{background:rgba(18,19,23,.04)!important;color:rgba(18,19,23,.42)!important;text-decoration:none!important}'
  + RD + '.ccard .bd.no{background:rgba(255,255,255,.04)!important;color:rgba(255,255,255,.38)!important}'
  + R + '.ccard .bd.no::before{content:"✕ ";font-size:10px}'
  + R + '.ccard .trunk{display:none!important}' + R + '.ccard .csmall b{white-space:nowrap}' + R + '.ctw{overflow-x:auto!important;-webkit-overflow-scrolling:touch}'
  + R + '.ccard .csmall{display:flex!important;align-items:center;gap:10px;margin-top:14px!important;padding:12px 14px;border-radius:14px;background:rgba(18,19,23,.035);font-size:13px!important}'
  + RD + '.ccard .csmall{background:rgba(255,255,255,.04)}'
  + R + '.ccard .csmall::before{content:"";flex:0 0 22px;height:22px;background:currentColor;opacity:.75;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Crect x=%275%27 y=%277%27 width=%2714%27 height=%2713%27 rx=%272.5%27/%3E%3Cpath d=%27M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5M15 11v5%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Crect x=%275%27 y=%277%27 width=%2714%27 height=%2713%27 rx=%272.5%27/%3E%3Cpath d=%27M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5M15 11v5%27/%3E%3C/svg%3E") center/contain no-repeat}'
  + R + '.ccard .ccta{display:flex!important;align-items:center;justify-content:center;height:48px;border-radius:14px!important;background:#121317!important;color:#fff!important;font-weight:700!important;border:0!important;box-shadow:none!important;transition:background .2s}'
  + R + '.ccard .ccta:hover{background:#E2001A!important}'
  + RD + '.ccard .ccta{background:#fff!important;color:#121317!important}' + RD + '.ccard .ccta:hover{background:#E2001A!important;color:#fff!important}'
  // kalkulátor / garázs dobozai: letisztult kártyák, elmosás nélkül
  + R + '.step,' + R + '#fuel,' + R + '.ctw,' + R + '.cfaq details{border-radius:18px!important;' + CARD + '}'
  + RD + '.step,' + RD + '#fuel,' + RD + '.ctw,' + RD + '.cfaq details{' + CARDD + '}'
  // ---- 6) családi autók
  + R + '#flt{gap:6px!important;flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;padding:4px 2px!important;justify-content:flex-start!important}'
  + R + '#flt::-webkit-scrollbar{display:none}'
  + R + '#flt .cbtn{flex:0 0 auto;height:40px!important;padding:0 16px!important;border-radius:999px!important;border:1px solid ' + LN + '!important;background:transparent!important;box-shadow:none!important;color:inherit!important;font-weight:700!important;font-size:14px!important}'
  + RD + '#flt .cbtn{border-color:rgba(255,255,255,.12)!important}'
  + R + '#flt .cbtn.on{background:#121317!important;color:#fff!important;border-color:#121317!important}'
  + RD + '#flt .cbtn.on{background:#fff!important;color:#121317!important;border-color:#fff!important}'
  + R + '.ca-flw{position:relative;margin-top:14px}'
  + R + '#fl{display:grid!important;grid-auto-flow:column!important;grid-template-columns:none!important;grid-template-rows:none!important;grid-auto-columns:calc((100% - 48px)/4)!important;gap:16px!important;overflow-x:auto!important;scroll-snap-type:x mandatory;scrollbar-width:none;padding:6px 14px 22px!important;margin:0 -14px!important;scroll-padding:0 14px}'
  + R + '#fl::-webkit-scrollbar{display:none}'
  + R + '#fl .fi{scroll-snap-align:start;display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:2px!important;padding:12px 16px 16px!important;border-radius:20px!important;cursor:pointer;' + CARD + 'content-visibility:auto;contain-intrinsic-size:auto 200px}'
  + RD + '#fl .fi{' + CARDD + '}'
  + R + '#fl .fi:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(18,19,23,.10)!important}'
  + R + '#fl .fi .im{align-self:stretch;height:96px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:10px}'
  + R + '#fl .fi .im img{max-width:92%;max-height:100%;object-fit:contain;filter:drop-shadow(0 10px 8px rgba(18,19,23,.16))}'
  + RD + '#fl .fi .im img{filter:drop-shadow(0 10px 9px rgba(0,0,0,.55))}'
  + R + '#fl .fi b{font-size:16px!important;font-weight:800!important;letter-spacing:-.01em}'
  + R + '#fl .fi span{font-size:12.5px!important;opacity:.6}'
  + R + '#fl .fi .ad{margin-top:10px;font-size:12.5px!important;font-weight:700;color:#E2001A;opacity:1!important}'
  + R + '.ca-flnav{position:absolute;top:-58px;right:0;display:flex;gap:6px}'
  + R + '.ca-flnav button{width:38px;height:38px;border-radius:50%;border:1px solid ' + LN + ';background:#fff;color:#121317;font-size:19px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}'
  + RD + '.ca-flnav button{background:rgba(255,255,255,.06);color:#fff;border-color:rgba(255,255,255,.12)}'
  + R + '.ca-flnav button:disabled{opacity:.35;cursor:default}'
  + R + '.ca-flct{font-size:13px;opacity:.55;margin-top:2px}'
  + '@media(max-width:1000px){' + R + '#fl{grid-auto-columns:calc((100% - 32px)/3)!important}}'
  + '@media(max-width:700px){' + R + '#fl{grid-auto-columns:72%!important;gap:12px!important}' + R + '.ca-flnav{display:none}}'
  // ---- 7) ragadós sáv
  + '.ca-cbar{position:fixed;z-index:40;top:92px;left:50%;transform:translate(-50%,-14px);opacity:0;pointer-events:none;display:flex;align-items:center;gap:6px;padding:6px;border-radius:999px;background:rgba(255,255,255,.95);border:1px solid ' + LN + ';box-shadow:0 12px 32px rgba(18,19,23,.14);transition:opacity .25s,transform .3s cubic-bezier(.3,.7,.2,1);max-width:calc(100vw - 24px)}'
  + D + '.ca-cbar{background:rgba(24,25,30,.95);border-color:rgba(255,255,255,.1);box-shadow:0 12px 32px rgba(0,0,0,.5)}'
  + '.ca-cbar.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}'
  + '.ca-cbar button{display:flex;align-items:center;gap:8px;height:44px;padding:0 14px 0 6px;border-radius:999px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;min-width:0}'
  + '.ca-cbar button:hover{background:rgba(18,19,23,.05)}' + D + '.ca-cbar button:hover{background:rgba(255,255,255,.07)}'
  + '.ca-cbar img{width:58px;height:26px;object-fit:contain}'
  + '.ca-cbar b{font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}'
  + '.ca-cbar .vs{font-size:12px;font-weight:800;opacity:.4;padding:0 2px}'
  + '.ca-cbar .sw{width:40px;height:40px;padding:0;justify-content:center;background:#121317!important;color:#fff;font-size:17px;flex:0 0 40px}'
  + D + '.ca-cbar .sw{background:#fff!important;color:#121317}'
  + '.ca-cbar .ca-n{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:5px;color:#fff;font-size:11px;font-weight:800;flex:0 0 18px}'
  + '.ca-cbar .ca-n.n1{background:#E2001A}.ca-cbar .ca-n.n2{background:#1B2A4A}' + D + '.ca-cbar .ca-n.n2{background:#4C6BB0}'
  + '@media(max-width:640px){.ca-cbar{top:88px}.ca-cbar img{display:none}.ca-cbar b{max-width:105px;font-size:13px}.ca-cbar button{padding:0 10px 0 8px}}'
  // ---- 8) mobil: táblázat ne lógjon ki
  + '@media(max-width:700px){' + R + '#tbl{table-layout:fixed}' + R + '#tbl td,' + R + '#tbl th{padding:11px 10px!important;font-size:13px!important;word-break:break-word}' + R + '#tbl tr>*:first-child{width:34%}' + R + '#tbl th{font-size:11.5px!important}'
  + R + '.ca-score{gap:8px;padding:14px}' + R + '.ca-score .sc{font-size:26px}' + R + '.ca-score .sd b{font-size:13.5px}' + R + '.cviews .cbtn{padding:0 14px!important;font-size:13.5px!important}' + R + '#align::before{display:none}' + R + '#align{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;justify-content:flex-start!important;border-radius:999px;max-width:calc(100% - 8px)}' + R + '#align button{flex:0 0 auto;padding:0 12px!important}' + R + '.ctw table{min-width:520px}}'
  + '</style>';

function js(cars) {
  return '<script id="ca-cmp-js">(function(){var C=' + JSON.stringify(cars) + ';var M={};C.forEach(function(c){M[c.s]=c});'
  + 'var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};'
  + 'var root=$(".cmp");if(!root)return;function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  + 'function ft(n){return n?Math.round(n).toLocaleString("hu-HU").replace(/,/g," ")+" Ft/hó":"Ár kérésre"}'
  + 'function img(c){return c&&c.i?\'<img alt="" loading="lazy" decoding="async" src="\'+c.i+\'">\':""}'
  // 1) hero
  + 'var hh=$("header.cmp-hero");if(hh){hh.setAttribute("data-dm-skip","1");["background","background-color","background-image"].forEach(function(k){hh.style.removeProperty(k)})}var h1=$(".cmp-hero h1");if(h1&&!h1.__x){h1.__x=1;h1.innerHTML="Melyik autó <em>a nagyobb?</em>"}var ld=$(".cmp-lead");if(ld)ld.textContent="Két bérelhető autó valós arányban: méret, csomagtartó, gyerekülések és havi költség — egy pillantással.";'
  // 2) választók
  + 'var S=[$("#s1"),$("#s2")],PK=[],pop=null;'
  + 'function card(i){var b=el("button","ca-pk k"+(i+1));b.type="button";b.innerHTML=\'<span class="im"></span><span class="tx"><span class="lb"><span class="ca-n n\'+(i+1)+\'">\'+(i+1)+\'</span>\'+(i?"Második autó":"Első autó")+\'</span><span class="nm"></span><span class="pr"></span></span><span class="ch">⌄</span>\';b.addEventListener("click",function(e){if(e.target.closest(".ca-pop"))return;e.stopPropagation();open(i)});return b}'
  + 'function upd(){S.forEach(function(s,i){var c=M[s.value],b=PK[i];if(!c||!b)return;b.querySelector(".im").innerHTML=img(c);b.querySelector(".nm").textContent=c.n;b.querySelector(".pr").textContent="Tartós bérlet "+ft(c.p)+"-tól"});bar()}'
  + 'function setCar(i,v){if(!S[i]||!M[v])return;S[i].value=v;S[i].dispatchEvent(new Event("change",{bubbles:true}));upd()}'
  + 'function close(){if(pop){pop.remove();pop=null}}'
  + 'function open(i){if(pop&&pop.__i===i){close();return}close();var p=el("div","ca-pop");p.__i=i;p.innerHTML=\'<input type="search" placeholder="Keress márkára vagy modellre…" aria-label="Autó keresése"><div class="ls" role="listbox"></div>\';PK[i].appendChild(p);pop=p;var inp=p.querySelector("input"),ls=p.querySelector(".ls"),hi=-1;'
  + 'function draw(){var q=inp.value.toLowerCase().trim(),out="",last="",n=0;C.forEach(function(c){if(q&&c.n.toLowerCase().indexOf(q)<0)return;var br=c.n.split(" ")[0];if(br!==last){out+=\'<div class="gh">\'+br+"</div>";last=br}out+=\'<button type="button" class="op\'+(S[i].value===c.s?" on":"")+\'" data-s="\'+c.s+\'">\'+img(c)+"<b>"+c.n+"</b><span>"+ft(c.p)+"</span></button>";n++});ls.innerHTML=out||\'<div class="em">Nincs találat</div>\';hi=-1;if(q)ls.scrollTop=0}'
  + 'draw();inp.addEventListener("input",draw);inp.addEventListener("keydown",function(e){var o=$$(".op",ls);if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();hi=Math.max(0,Math.min(o.length-1,hi+(e.key==="ArrowDown"?1:-1)));o.forEach(function(x,k){x.classList.toggle("hl",k===hi)});if(o[hi])o[hi].scrollIntoView({block:"nearest"})}else if(e.key==="Enter"){var t=o[hi>=0?hi:0];if(t){setCar(i,t.dataset.s);close()}}else if(e.key==="Escape")close()});'
  + 'ls.addEventListener("click",function(e){var o=e.target.closest(".op");if(!o)return;e.stopPropagation();setCar(i,o.dataset.s);close()});p.addEventListener("click",function(e){e.stopPropagation()});setTimeout(function(){inp.focus({preventScroll:true})},30);var on=ls.querySelector(".op.on");if(on)ls.scrollTop=on.offsetTop-90}'
  + 'document.addEventListener("click",close);'
  + 'var cp=$(".cpick");if(cp&&!cp.__x&&S[0]&&S[1]){cp.__x=1;var sw=$("#swap");PK=[card(0),card(1)];cp.insertBefore(PK[0],cp.firstChild);cp.appendChild(PK[1]);if(sw){sw.setAttribute("aria-label","Autók felcserélése");sw.title="Csere";sw.addEventListener("click",function(){setTimeout(upd,0)})}S.forEach(function(s){s.addEventListener("change",function(){setTimeout(upd,0)})});upd()}'
  // 4) ki nyer
  + 'function num(t){t=(t||"").replace(/\\u00a0/g," ");var m=t.match(/(\\d[\\d ]*(?:[.,]\\d+)?)/);if(!m)return NaN;return parseFloat(m[1].replace(/ /g,"").replace(",","."))}'
  + 'var sc=null;function tbl(){var T=$("#tbl");if(!T)return;var a=M[S[0].value],b=M[S[1].value],wa=0,wb=0;'
  + '$$("tr",T).forEach(function(tr){var v=$$("td.v",tr);if(v.length!==2||tr.__b)return;tr.__b=1;v[0].classList.add("c1");v[1].classList.add("c2");var x=num(v[0].textContent),y=num(v[1].textContent);'
  + 'if(isFinite(x)&&isFinite(y)&&x>0&&y>0&&!/Motor|Havidíj|Fordulókör/.test(tr.firstElementChild.textContent)){var mx=Math.max(x,y);v.forEach(function(td,k){var val=k?y:x,bb=el("span","ca-bar","<i></i>");td.appendChild(bb);var w=Math.max(8,Math.round(val/mx*100));requestAnimationFrame(function(){bb.firstChild.style.width=w+"%"})})}});'
  + 'wa=$$("td.v.win.c1",T).length;wb=$$("td.v.win.c2",T).length;'
  + 'if(!sc){sc=el("div","ca-score");T.parentNode.insertBefore(sc,T)}if(a&&b)sc.innerHTML=\'<div class="sd"><span class="ca-n n1">1</span><b>\'+a.n+\'</b></div><div class="sc"><span class="a">\'+wa+\'</span><i>:</i><span class="b">\'+wb+\'</span></div><div class="sd r"><b>\'+b.n+\'</b><span class="ca-n n2">2</span></div><div class="cap">Ennyi szempontban jobb az egyik vagy a másik autó — a részletek lent.</div>\'}'
  // 5) kártyák
  + 'function cards(){$$("#cards .ccard").forEach(function(cd,i){if(cd.__c)return;cd.__c=1;var c=M[S[i].value];if(c&&c.i){var w=el("div","ca-cim",img(c));cd.insertBefore(w,cd.firstChild)}var sm=cd.querySelector(".csmall");if(sm){var m=sm.textContent.match(/(\\d+)\\s*l.*?(\\d+)\\s*kabin/);if(m)sm.innerHTML="Csomagtartó <b>"+m[1]+" l</b> · kb. <b>"+m[2]+" kabinbőrönd</b>"}})}'
  // 6) családi autók
  + 'var fl=$("#fl");function fam(){if(!fl)return;$$(".fi",fl).forEach(function(f){if(f.__f)return;f.__f=1;var c=M[f.dataset.s];if(c&&c.i){var w=el("div","im",img(c));f.insertBefore(w,f.firstChild)}var a=el("span","ad","+ Összehasonlítom");f.appendChild(a)});flst();var n=$$(".fi",fl).length;if(ct)ct.textContent=n+" autó"}'
  + 'var nav=null,ct=null;if(fl&&!fl.__w){fl.__w=1;var wr=el("div","ca-flw");fl.parentNode.insertBefore(wr,fl);wr.appendChild(fl);nav=el("div","ca-flnav",\'<button type="button" aria-label="Előző">‹</button><button type="button" aria-label="Következő">›</button>\');wr.appendChild(nav);'
  + 'nav.children[0].onclick=function(){fl.scrollBy({left:-fl.clientWidth*.9,behavior:"smooth"})};nav.children[1].onclick=function(){fl.scrollBy({left:fl.clientWidth*.9,behavior:"smooth"})};fl.addEventListener("scroll",flst,{passive:true});ct=el("div","ca-flct");var lead=$(".fam .clead");if(lead)lead.parentNode.insertBefore(ct,lead.nextSibling);'
  + 'fl.addEventListener("click",function(){setTimeout(upd,0)},true)}'
  + 'function flst(){if(!nav)return;nav.children[0].disabled=fl.scrollLeft<4;nav.children[1].disabled=fl.scrollLeft+fl.clientWidth>=fl.scrollWidth-4}'
  + '$$("#flt .cbtn").forEach(function(b){b.addEventListener("click",function(){fl.scrollLeft=0;setTimeout(fam,0)})});'
  // 7) ragadós sáv
  + 'var cb=el("div","ca-cbar",\'<button type="button" class="p1"></button><span class="vs">VS</span><button type="button" class="p2"></button><button type="button" class="sw" aria-label="Csere">⇄</button>\');document.body.appendChild(cb);'
  + 'function bar(){if(!cb)return;[0,1].forEach(function(i){var c=M[S[i]&&S[i].value];if(c)cb.querySelector(".p"+(i+1)).innerHTML=\'<span class="ca-n n\'+(i+1)+\'">\'+(i+1)+"</span>"+img(c)+"<b>"+c.n+"</b>"})}'
  + '[0,1].forEach(function(i){cb.querySelector(".p"+(i+1)).addEventListener("click",function(e){e.stopPropagation();var t=$(".cpick");scrollTo({top:t.getBoundingClientRect().top+scrollY-150,behavior:"smooth"});setTimeout(function(){open(i)},450)})});'
  + 'cb.querySelector(".sw").addEventListener("click",function(){var s=$("#swap");if(s)s.click()});'
  + 'function vis(){var t=$(".cpick"),f=$(".cfaq");if(!t)return;var y=t.getBoundingClientRect().bottom,z=f?f.getBoundingClientRect().top:1e9;cb.classList.toggle("on",y<60&&z>innerHeight*.5)}addEventListener("scroll",function(){requestAnimationFrame(vis)},{passive:true});vis();bar();'
  // figyelők: az eredeti oldal minden választáskor újrarajzolja a táblát és a kártyákat
  + 'function all(){try{tbl()}catch(e){}try{cards()}catch(e){}try{fam()}catch(e){}}'
  + '["#tbl","#cards","#fl"].forEach(function(s){var n=$(s);if(n)new MutationObserver(function(){all()}).observe(n,{childList:true})});all()'
  + '})();</script>';
}

export function apply(h) {
  if (h.indexOf('id="ca-cmp-css"') > -1) return h;
  const m = h.match(/const CARS=(\[[\s\S]*?\]);const PHOTOS=(\{[\s\S]*?\});\s*\n/);
  let cars = [];
  if (m) {
    try {
      const C = new Function('return ' + m[1])();
      let P = {};
      try { P = JSON.parse(m[2]); } catch (e) { P = {}; }
      cars = C.map((c) => ({ s: c.slug, n: c.name, p: c.price || 0, i: P[c.slug] && P[c.slug].side ? P[c.slug].side.src : '' }));
    } catch (e) { cars = []; }
  }
  if (!cars.length) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => js(cars) + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-cmp] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-cmp] már alkalmazva vagy nincs adat');
  else { fs.writeFileSync(FILE, o); console.log('[hu-cmp] autó-összehasonlítás: letisztult nézet'); }
}
