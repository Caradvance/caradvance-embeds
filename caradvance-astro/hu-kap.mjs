// hu-kap.mjs — Kapcsolat (HU, /kapcsolat/): prémium, letisztult megjelenés + személyes időpontfoglalás
// · fejléc: nagy logó helyett kiemelt cím, gyors műveletek (Hívj, WhatsApp, E-mail, Időpontot foglalok), Görgess alul
// · „Az iroda” kártya: élő nyitva/zárva jelzés, cím + útvonaltervezés, osztályok egységes sorokban
// · időpontfoglaló: naptár (H–P, munkaszüneti napok nélkül, 45 napra előre) → idősáv (9–16 óra) → adatok → visszaigazolás
//   a meglévő /api/lead végpontra küld (Típus: „Személyes időpontfoglalás”) → belső e-mail + Notion + visszaigazoló e-mail;
//   a visszaigazoló képernyőről naptárfájl (.ics) tölthető le
// · csapat: egy rácsban, a főoldali kártyastílusban · sötét módban puha átmenetek. Csak a magyar oldal, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'kapcsolat', 'index.html');

const P = 'html.ca-kap body .kap ';
const D = 'html.ca-kap.ca-dark body .kap ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.12)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.16),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.45),inset -1px -1px 1px rgba(255,255,255,.16),inset 0 0 0 1px rgba(255,255,255,.06),inset 0 10px 30px rgba(255,255,255,.05),0 30px 70px rgba(0,0,0,.55),0 4px 14px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const CSS = '<style id="ca-kap-css">'
  // ---- fejléc
  + P + '.kaphero{min-height:100vh!important;min-height:100svh!important;position:relative!important}'
  + P + '.kaphero-logo{display:none!important}'
  + P + '.kaphero-ov{position:absolute!important;inset:0!important;width:auto!important;height:auto!important;z-index:1!important}' + P + '.kaphero-inner{position:relative;z-index:2}' + P + '.kaphero-ov{background:linear-gradient(180deg,rgba(8,8,10,.55),rgba(8,8,10,.45) 40%,rgba(8,8,10,.7))!important}'
  + D + '.kaphero{background:transparent!important}'
  + P + '.kaphero-h1{font-size:clamp(44px,6vw,80px)!important;letter-spacing:-.035em!important;line-height:1!important;margin:0 0 14px!important;text-shadow:0 2px 24px rgba(0,0,0,.5)}'
  + P + '.kaphero-h1::after{content:"";display:block;width:56px;height:4px;border-radius:4px;background:' + RED + ';margin:22px auto 0;box-shadow:0 4px 18px rgba(226,0,26,.6)}'
  + P + '.kaphero-sub{max-width:620px!important;text-shadow:0 1px 10px rgba(0,0,0,.5)}'
  + P + '.kaphero-cta{display:flex!important;flex-wrap:wrap;justify-content:center;gap:10px!important}'
  + P + '.kaphero-cta .kaphero-btn{display:inline-flex!important;align-items:center;gap:8px;height:50px;padding:0 22px!important;border-radius:999px!important;font-weight:700!important;font-size:15px!important}'
  + P + '.kaphero-cta .kaphero-btn svg{width:17px;height:17px;flex:0 0 auto}'
  + P + '.kaphero-cta .kaphero-btn.ghost{background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.3)!important;color:#fff!important}'
  + P + '.kaphero-cta .kaphero-btn.red{background:' + RED + '!important;color:#fff!important;box-shadow:0 10px 28px rgba(226,0,26,.4)!important}'
  + P + '.kaphero-scroll{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:28px!important;margin:0!important;color:rgba(255,255,255,.8)!important}'
  + P + '.ca-sm{display:none}' + '@media(max-width:640px){' + P + '.ca-lg{display:none}' + P + '.ca-sm{display:inline}' + P + '.kaphero-cta .kaphero-btn{white-space:nowrap}' + P + '.kaphero-scroll{display:none!important}' + P + '.kaphero-ov{background:linear-gradient(180deg,rgba(8,8,10,.6),rgba(8,8,10,.72) 50%,rgba(8,8,10,.8))!important}' + P + '.kaphero-cta .kaphero-btn{flex:1 1 calc(50% - 10px);justify-content:center;padding:0 12px!important;font-size:14px!important;height:46px}}'
  // ---- iroda + foglaló rács
  + P + '.ca-kgrid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:24px;max-width:1200px;margin:56px auto 0;padding:0 24px;box-sizing:border-box;align-items:stretch}'
  + 'html.ca-kap body #kap-office{display:none!important}'
  + P + '.ca-card{border-radius:30px;' + HL + '}'
  + D + '.ca-card{' + HD + 'color:#fff}'
  + P + '.ca-off{padding:30px;display:flex;flex-direction:column}' + P + '.ca-ph{flex:1 1 auto;min-height:170px;margin-top:22px;border-radius:20px;overflow:hidden;position:relative}' + P + '.ca-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' + '@media(max-width:980px){' + P + '.ca-ph{flex:none;height:220px}}'
  + P + '.ca-ey{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:' + RED + '}'
  + P + '.ca-off h2,' + P + '.ca-bk h2{font-size:clamp(26px,2.4vw,32px);font-weight:800;letter-spacing:-.025em;line-height:1.1;margin:8px 0 16px}'
  + P + '.ca-open{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 14px;border-radius:999px;font-size:13px;font-weight:700;background:rgba(22,163,74,.1);color:#15803D}'
  + P + '.ca-open i{width:8px;height:8px;border-radius:50%;background:#16A34A;box-shadow:0 0 0 0 rgba(22,163,74,.5);animation:caKPulse 2s infinite}'
  + P + '.ca-open.off{background:rgba(18,19,23,.06);color:inherit}' + P + '.ca-open.off i{background:#9CA3AF;animation:none}'
  + D + '.ca-open{background:rgba(34,197,94,.14);color:#4ADE80}' + D + '.ca-open.off{background:rgba(255,255,255,.08);color:rgba(255,255,255,.8)}'
  + '@keyframes caKPulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.45)}70%{box-shadow:0 0 0 8px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}'
  + P + '.ca-addr{display:flex;gap:14px;align-items:flex-start;margin:20px 0 6px}'
  + P + '.ca-addr .ic{flex:0 0 44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#B80015);box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 10px 22px rgba(226,0,26,.3)}'
  + P + '.ca-addr b{display:block;font-size:17px;font-weight:800}'
  + P + '.ca-addr span{font-size:14px;opacity:.65}'
  + P + '.ca-route{display:inline-flex;align-items:center;gap:6px;margin:12px 0 0 58px;font-weight:700;font-size:14px;color:' + RED + ';text-decoration:none}'
  + D + '.ca-route{color:#FF6B78}'
  + P + '.ca-hours{display:grid;grid-template-columns:auto 1fr;gap:6px 18px;margin:22px 0 4px;padding:16px 18px;border-radius:18px;background:rgba(18,19,23,.035);font-size:14px}'
  + D + '.ca-hours{background:rgba(255,255,255,.05)}'
  + P + '.ca-hours dt{opacity:.6}' + P + '.ca-hours dd{margin:0;font-weight:700;text-align:right}' + P + '.ca-hours .today{color:' + RED + '}' + D + '.ca-hours .today{color:#FF6B78}'
  + P + '.ca-quick{display:flex;flex-direction:column;gap:10px;margin-top:20px;padding-top:20px;border-top:1px solid ' + LN + '}'
  + D + '.ca-quick{border-top-color:rgba(255,255,255,.08)}'
  + P + '.ca-quick a{display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none;font-weight:700;font-size:15px}'
  + P + '.ca-quick a svg{width:18px;height:18px;color:' + RED + '}'
  + P + '.ca-quick a:hover{color:' + RED + '}'
  + P + '.ca-depsrow{max-width:1200px;margin:24px auto 0;padding:0 24px;box-sizing:border-box}'
  + P + '.ca-dh{margin:40px 0 18px;text-align:center}' + P + '.ca-dh h2{font-size:clamp(24px,2.4vw,30px);font-weight:800;letter-spacing:-.025em;margin:8px 0 0}'
  + D + '.ca-dh h2{color:#fff}'
  + P + '.ca-deps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}'
  + P + '.ca-dep{padding:20px 20px 18px;border-radius:24px!important;display:flex;flex-direction:column;gap:12px}'
  + P + '.ca-dep>b{font-size:15.5px;font-weight:800;letter-spacing:-.01em}'
  + P + '.ca-dep .ln{display:flex;flex-direction:column;gap:9px;font-size:14px}'
  + P + '.ca-dep .ln a{color:inherit;text-decoration:none;opacity:.8;display:flex;align-items:center;gap:9px;transition:opacity .2s,color .2s}'
  + P + '.ca-dep .ln a:hover{opacity:1;color:' + RED + '}'
  + P + '.ca-dep .ln a svg{width:16px;height:16px;flex:0 0 16px;color:' + RED + '}'
  + P + '.ca-dep .ln a.wa svg{color:#16A34A}'
  + '@media(max-width:1000px){' + P + '.ca-deps{grid-template-columns:1fr 1fr}}'
  + '@media(max-width:560px){' + P + '.ca-deps{grid-template-columns:1fr}' + P + '.ca-depsrow{padding:0 14px}}'
  // ---- foglaló
  + P + '.ca-bk{padding:30px;position:relative;overflow:hidden}'
  + P + '.ca-bk .lead{margin:0 0 20px;opacity:.66;font-size:15px;line-height:1.55;max-width:560px}'
  + P + '.ca-steps{display:flex;gap:8px;margin:0 0 22px}'
  + P + '.ca-steps span{flex:1;display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;opacity:.45;transition:opacity .3s}'
  + P + '.ca-steps span i{flex:0 0 24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;font-weight:800;background:rgba(18,19,23,.07);transition:all .3s}'
  + D + '.ca-steps span i{background:rgba(255,255,255,.1)}'
  + P + '.ca-steps span.on{opacity:1}' + P + '.ca-steps span.on i{background:' + RED + ';color:#fff}'
  + P + '.ca-steps span.done{opacity:.8}' + P + '.ca-steps span.done i{background:rgba(226,0,26,.14);color:' + RED + '}'
  + P + '.ca-pane{display:none}' + P + '.ca-pane.on{display:block;animation:caKIn .45s cubic-bezier(.2,.8,.2,1)}'
  + '@keyframes caKIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'
  + P + '.ca-cal-h{display:flex;align-items:center;justify-content:space-between;margin:0 0 12px}'
  + P + '.ca-cal-h b{font-size:17px;font-weight:800;text-transform:capitalize}'
  + P + '.ca-cal-h button{width:38px;height:38px;border-radius:50%;border:1px solid ' + LN + ';background:transparent;color:inherit;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center}'
  + D + '.ca-cal-h button{border-color:rgba(255,255,255,.14)}'
  + P + '.ca-cal-h button:disabled{opacity:.25;cursor:default}'
  + P + '.ca-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}'
  + P + '.ca-cal .wd{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-align:center;opacity:.45;padding:4px 0 6px}'
  + P + '.ca-cal button{aspect-ratio:1/1;max-height:52px;border-radius:14px;border:1px solid transparent;background:rgba(18,19,23,.035);color:inherit;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;position:relative}'
  + D + '.ca-cal button{background:rgba(255,255,255,.05)}'
  + P + '.ca-cal button:hover:not(:disabled){border-color:' + RED + '}'
  + P + '.ca-cal button:disabled{background:transparent;opacity:.25;cursor:default;font-weight:500}'
  + P + '.ca-cal button.td::after{content:"";position:absolute;left:50%;bottom:7px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:' + RED + '}'
  + P + '.ca-cal button.sel{background:' + RED + '!important;color:#fff;box-shadow:0 10px 22px rgba(226,0,26,.3)}'
  + P + '.ca-cal button.sel::after{background:#fff}'
  + P + '.ca-slots-t{font-size:15px;font-weight:800;margin:4px 0 12px}'
  + P + '.ca-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}'
  + P + '.ca-slots button{height:48px;border-radius:14px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;font-variant-numeric:tabular-nums}'
  + D + '.ca-slots button{border-color:rgba(255,255,255,.14)}'
  + P + '.ca-slots button:hover:not(:disabled){border-color:' + RED + ';color:' + RED + '}'
  + P + '.ca-slots button:disabled{opacity:.3;cursor:default;text-decoration:line-through}'
  + P + '.ca-slots button.sel{background:' + RED + ';border-color:' + RED + ';color:#fff}'
  + P + '.ca-sum{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;background:rgba(226,0,26,.06);margin:0 0 18px;font-size:14.5px}'
  + D + '.ca-sum{background:rgba(226,0,26,.14)}'
  + P + '.ca-sum svg{flex:0 0 22px;color:' + RED + '}' + P + '.ca-sum b{font-weight:800}'
  + P + '.ca-sum button{margin-left:auto;border:0;background:none;color:' + RED + ';font-family:inherit;font-weight:700;font-size:13.5px;cursor:pointer;white-space:nowrap}'
  + P + '.ca-topics{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}'
  + P + '.ca-topics button{height:38px;padding:0 15px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .2s}'
  + D + '.ca-topics button{border-color:rgba(255,255,255,.14)}'
  + P + '.ca-topics button.sel{background:#121317;border-color:#121317;color:#fff}' + D + '.ca-topics button.sel{background:#fff;border-color:#fff;color:#121317}'
  + P + '.ca-f{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
  + P + '.ca-f label{display:flex;flex-direction:column;gap:6px;font-size:12.5px;font-weight:700;opacity:.9}'
  + P + '.ca-f label.w{grid-column:1/-1}'
  + P + '.ca-f input,' + P + '.ca-f textarea{height:48px;border-radius:14px;border:1px solid ' + LN + ';background:rgba(255,255,255,.7);color:inherit;font-family:inherit;font-size:15px;padding:0 14px;outline:none;transition:border-color .2s,box-shadow .2s}'
  + P + '.ca-f textarea{height:84px;padding:12px 14px;resize:vertical}'
  + D + '.ca-f input,' + D + '.ca-f textarea{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);color:#fff}'
  + P + '.ca-f input:focus,' + P + '.ca-f textarea:focus{border-color:' + RED + ';box-shadow:0 0 0 4px rgba(226,0,26,.12)}'
  + P + '.ca-f input:not(:focus):not(.bad),' + P + '.ca-f textarea:not(:focus){border-color:' + LN + '!important}' + D + '.ca-f input:not(:focus):not(.bad),' + D + '.ca-f textarea:not(:focus){border-color:rgba(255,255,255,.12)!important}' + P + '.ca-f .bad{border-color:' + RED + '!important}'
  + P + '.ca-f label.ca-ok{flex-direction:row!important}' + P + '.ca-ok{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.45;opacity:.8;margin:14px 0 0;cursor:pointer}'
  + P + '.ca-ok input{margin-top:2px;accent-color:' + RED + ';width:16px;height:16px;flex:0 0 auto}'
  + P + '.ca-ok a{color:inherit}'
  + P + '.ca-hp{position:absolute!important;left:-9999px!important;opacity:0!important;height:0!important}'
  + P + '.ca-send{width:100%;height:54px;margin-top:18px;border:0;border-radius:16px;background:' + RED + ';color:#fff;font-family:inherit;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 14px 30px rgba(226,0,26,.32);transition:transform .2s,box-shadow .2s;display:flex;align-items:center;justify-content:center;gap:10px}'
  + P + '.ca-send:hover{transform:translateY(-1px)}' + P + '.ca-send:disabled{opacity:.6;cursor:default;transform:none}'
  + P + '.ca-err{margin:12px 0 0;font-size:13.5px;color:' + RED + ';font-weight:600}'
  + P + '.ca-done{text-align:center;padding:16px 6px 6px}'
  + P + '.ca-done .chk{width:76px;height:76px;margin:0 auto 18px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#22C55E,#16A34A);color:#fff;box-shadow:0 16px 36px rgba(22,163,74,.35)}'
  + P + '.ca-done .chk path{stroke-dasharray:30;stroke-dashoffset:30;animation:caKChk .6s .2s ease forwards}'
  + '@keyframes caKChk{to{stroke-dashoffset:0}}'
  + P + '.ca-done h3{font-size:24px;font-weight:800;margin:0 0 8px}'
  + P + '.ca-done p{opacity:.7;margin:0 auto 18px;max-width:440px;line-height:1.55}'
  + P + '.ca-done .when{display:inline-block;padding:10px 18px;border-radius:14px;background:rgba(226,0,26,.08);font-weight:800;margin-bottom:18px}'
  + D + '.ca-done .when{background:rgba(226,0,26,.16)}'
  + P + '.ca-done .bt{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}'
  + P + '.ca-done .bt a,' + P + '.ca-done .bt button{display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 18px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer;text-decoration:none}'
  + D + '.ca-done .bt a,' + D + '.ca-done .bt button{border-color:rgba(255,255,255,.18)}'
  + '@media(max-width:980px){' + P + '.ca-kgrid{grid-template-columns:1fr;margin-top:36px}' + P + '.ca-bk{order:-1}}'
  + '@media(max-width:560px){' + P + '.ca-kgrid{padding:0 14px}' + P + '.ca-off,' + P + '.ca-bk{padding:22px 18px}' + P + '.ca-card{border-radius:24px}' + P + '.ca-f{grid-template-columns:1fr}' + P + '.ca-slots{grid-template-columns:repeat(3,1fr)}' + P + '.ca-steps span b{display:none}' + P + '.ca-cal{gap:4px}' + P + '.ca-cal button{border-radius:11px;font-size:14px}' + P + '.ca-route{margin-left:0}}'
  // ---- csapat
  + P + '.kap-sec-title{font-size:clamp(28px,3vw,40px)!important;font-weight:800!important;letter-spacing:-.025em;margin-top:80px!important;text-align:center}'
  + D + '.kap-sec-title{color:#fff!important}'
  + P + '.kap-sec-sub{text-align:center;opacity:.65}'
  + P + '.kap-team-scroll{overflow:visible!important;max-width:1200px;margin:0 auto!important;padding:0 24px!important;box-sizing:border-box;-webkit-mask:none!important;mask:none!important}'
  + P + '.kap-team-scroll+.kap-team-scroll{display:none!important}'
  + P + '#kap-team{display:flex!important;flex-wrap:wrap;justify-content:center;gap:18px!important;transform:none!important;width:auto!important;overflow:visible!important;padding:8px 0 30px!important}'
  + P + '#kap-team>.kap-card{width:auto!important;min-width:0!important;flex:0 0 calc(25% - 13.5px)!important;max-width:none!important;height:auto!important;border-radius:26px!important;overflow:hidden;' + HL + '}'
  + D + '#kap-team>.kap-card{' + HD + '}'
  + P + '#kap-team>.kap-card .kap-photo{background:#F1F2F4}'
  + D + '#kap-team>.kap-card .kap-photo{background:rgba(255,255,255,.04)}'
  + D + '#kap-team>.kap-card .nm{color:#fff!important}' + D + '#kap-team>.kap-card .bio{color:rgba(255,255,255,.68)!important}'
  + P + '.kap-team-scroll>button,' + P + '.kap-team-scroll [class*=arrow],' + P + '.kap-team-scroll [class*=Arrow]{display:none!important}'
  + '@media(max-width:1100px){' + P + '#kap-team>.kap-card{flex-basis:calc(33.33% - 12px)!important}}'
  + '@media(max-width:760px){' + P + '.kap-team-scroll{overflow-x:auto!important;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0 14px!important}' + P + '#kap-team{flex-wrap:nowrap!important;justify-content:flex-start!important;gap:12px!important;width:max-content!important}' + P + '#kap-team>.kap-card{flex:0 0 78vw!important;width:78vw!important;scroll-snap-align:center}}'
  + '@media(prefers-reduced-motion:reduce){' + P + '.ca-pane.on{animation:none}' + P + '.ca-open i{animation:none}}'
  + '</style>';

const ICON = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.6-.1 1.3z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
  pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
};

// Magyar munkaszüneti napok 2026–2027 (a foglalóban nem választhatók)
const HOLIDAYS = ['2026-01-01','2026-01-02','2026-03-15','2026-04-03','2026-04-06','2026-05-01','2026-05-25','2026-08-20','2026-08-21','2026-10-23','2026-11-01','2026-12-24','2026-12-25','2026-12-26',
  '2027-01-01','2027-03-15','2027-03-26','2027-03-29','2027-05-01','2027-05-17','2027-08-20','2027-10-23','2027-11-01','2027-12-24','2027-12-25','2027-12-26'];

const JS = String.raw`<script id="ca-kap-js">(function(){var H=document.documentElement;
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var root=$(".kap");if(!root||root.__k)return;root.__k=1;H.classList.add("ca-kap");
var IC=` + JSON.stringify(ICON) + `,HOL=` + JSON.stringify(HOLIDAYS) + String.raw`;
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var MON=["január","február","március","április","május","június","július","augusztus","szeptember","október","november","december"],DAY=["vasárnap","hétfő","kedd","szerda","csütörtök","péntek","szombat"];
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function hu(d){return d.getFullYear()+". "+MON[d.getMonth()]+" "+d.getDate()+". ("+DAY[d.getDay()]+")"}
// --- fejléc
var h1=$(".kaphero-h1",root);
var cta=$(".kaphero-cta",root);if(cta){var ph=cta.querySelector("a.red"),wa=cta.querySelector("a.white");if(ph){ph.innerHTML=IC.phone+"Hívj minket"}if(wa){wa.className="kaphero-btn ghost";wa.innerHTML=IC.wa+"WhatsApp"}
var ml=el("a","kaphero-btn ghost",IC.mail+"Írj nekünk");ml.href="mailto:info@caradvance.hu";cta.appendChild(ml);
var bk=el("a","kaphero-btn ghost",IC.cal+"<span class=ca-lg>Időpontot foglalok</span><span class=ca-sm>Időpontfoglalás</span>");bk.href="#idopont";cta.appendChild(bk)}
var sb=$(".kaphero-sub",root);if(sb)sb.textContent="Kérdésed van, autót keresel vagy eladnál? Hívj, írj, vagy foglalj időpontot, és gyere be hozzánk Solymárra egy kávéra.";
var sc=$(".kaphero-scroll",root);if(sc){sc.removeAttribute("onclick");sc.addEventListener("click",function(e){e.preventDefault();var t=$(".ca-kgrid",root);if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-100,behavior:"smooth"})})}
// --- rács: iroda + foglaló
var off=$(".kap-office",root);var grid=el("div","ca-kgrid");off.parentNode.insertBefore(grid,off.nextSibling);
var o=el("div","ca-card ca-off");
function depsH(src){return $$(".kap-cat",src).map(function(c){var t=(c.querySelector(".kap-cat-t")||{}).textContent||"";var a=$$("a",c);var r='<div class="ca-dep ca-card"><b>'+esc(t)+'</b><div class="ln">';a.forEach(function(x){var k=x.classList.contains("wa")?"wa":(/^mailto:/.test(x.getAttribute("href")||"")?"mail":"phone");r+='<a class="'+k+'" href="'+esc(x.getAttribute("href"))+'"'+(k==="wa"?' target="_blank" rel="noopener"':"")+'>'+IC[k]+esc(x.textContent.trim())+'</a>'});return r+"</div></div>"}).join("")}
var ADR="2083 Solymár, Ibolya utca 18.";
o.innerHTML='<span class="ca-ey">Az iroda</span><h2>Gyere be hozzánk</h2><span class="ca-open off" id="ca-open"><i></i><span>…</span></span>'
+'<div class="ca-addr"><span class="ic">'+IC.pin+'</span><div><b>'+ADR+'</b><span>Budapesttől 20 percre, ingyenes parkolással</span></div></div>'
+'<a class="ca-route" href="https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent("CarAdvance, "+ADR)+'" target="_blank" rel="noopener">Útvonaltervezés →</a>'
+'<dl class="ca-hours"><dt data-d="1-5">Hétfő – Péntek</dt><dd data-d="1-5">9:00 – 17:00</dd><dt data-d="6-0">Szombat – Vasárnap</dt><dd data-d="6-0">Előzetes egyeztetéssel</dd></dl>'
+'<div class="ca-quick" style="order:0"><a href="tel:+36302336060">'+IC.phone+'+36 30 233 6060</a><a href="mailto:info@caradvance.hu">'+IC.mail+'info@caradvance.hu</a></div><div class="ca-ph"><img src="/caradvance-iroda.webp" alt="A CarAdvance iroda Solymáron" loading="lazy"></div>';
grid.appendChild(o);var dr=el("div","ca-depsrow",'<div class="ca-dh"><span class="ca-ey">Osztályok</span><h2>Írj közvetlenül a megfelelő kollégának</h2></div><div class="ca-deps"></div>');grid.parentNode.insertBefore(dr,grid.nextSibling);
(function fill(n){var sr=$(".kap-off2",root);if(sr&&sr.querySelector(".kap-cat")){$(".ca-deps",dr).innerHTML=depsH(sr);cln&&setTimeout(cln,50);return}if(n<40)setTimeout(function(){fill(n+1)},150)})(0);
(function(){var n=new Date(),d=n.getDay(),m=n.getHours()*60+n.getMinutes(),wk=d>=1&&d<=5&&HOL.indexOf(ymd(n))<0,op=wk&&m>=540&&m<1020,e=$("#ca-open");e.classList.toggle("off",!op);
var nx="";if(!op){var t=new Date(n);for(var i=0;i<10;i++){if(i>0||m>=1020)t.setDate(t.getDate()+(i===0?1:1));var dd=t.getDay();if(dd>=1&&dd<=5&&HOL.indexOf(ymd(t))<0&&!(i===0&&m>=1020&&ymd(t)===ymd(n)))break;if(i===0&&m<540&&wk)break}nx=ymd(t)===ymd(n)?"ma 9:00-kor":(function(){var x=new Date(n);x.setDate(x.getDate()+1);return ymd(t)===ymd(x)?"holnap 9:00-kor":DAY[t.getDay()]+" 9:00-kor"})()}
e.querySelector("span").textContent=op?"Most nyitva · ma 17:00-ig":"Most zárva · nyitunk "+nx;
$$(".ca-hours [data-d]",o).forEach(function(x){var r=x.getAttribute("data-d");if((r==="1-5"&&d>=1&&d<=5)||(r==="6-0"&&(d===6||d===0)))x.classList.add("today")})})();
// --- foglaló
var b=el("div","ca-card ca-bk");b.id="idopont";
var TOP=["Autóvásárlás, megtekintés","Tartós bérlet","Autóeladás (bizomány)","Autóimport","Egyéb"];
b.innerHTML='<span class="ca-ey">Személyes időpont</span><h2>Foglalj időpontot az irodánkba</h2><p class="lead">Válassz egy napot és időpontot — kollégánk visszaigazolja, és egy kávé mellett mindent átbeszélünk.</p>'
+'<div class="ca-steps"><span class="on" data-s="0"><i>1</i><b>Nap</b></span><span data-s="1"><i>2</i><b>Időpont</b></span><span data-s="2"><i>3</i><b>Adatok</b></span></div>'
+'<div class="ca-pane on" data-p="0"><div class="ca-cal-h"><button type="button" class="pv" aria-label="Előző hónap">‹</button><b class="mt"></b><button type="button" class="nx" aria-label="Következő hónap">›</button></div><div class="ca-cal" role="grid"></div></div>'
+'<div class="ca-pane" data-p="1"><div class="ca-sum s1"></div><div class="ca-slots-t">Válassz időpontot</div><div class="ca-slots"></div></div>'
+'<div class="ca-pane" data-p="2"><div class="ca-sum s2"></div><div class="ca-slots-t">Miben segíthetünk?</div><div class="ca-topics">'+TOP.map(function(t,i){return '<button type="button"'+(i===0?' class="sel"':"")+'>'+t+'</button>'}).join("")+'</div>'
+'<form class="ca-f" novalidate><label>Név<input name="n" autocomplete="name" required></label><label>Telefon<input name="p" type="tel" autocomplete="tel" required></label><label class="w">E-mail<input name="e" type="email" autocomplete="email" required></label><label class="w"><span>Megjegyzés <i style="opacity:.5;font-weight:500;font-style:normal">(nem kötelező)</i></span><textarea name="m" placeholder="Pl. melyik autó érdekel, hányan jöttök…"></textarea></label><input class="ca-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">'
+'<label class="ca-ok w"><input type="checkbox" name="ok"><span>Elfogadom az <a href="/adatkezelesi-tajekoztato/" target="_blank">adatkezelési tájékoztatót</a>.</span></label>'
+'<button class="ca-send w" type="submit">'+IC.cal.replace("<svg",'<svg width="18" height="18"')+'Időpont kérése</button><div class="ca-err w" hidden></div></form></div>'
+'<div class="ca-pane" data-p="3"></div>';
grid.appendChild(b);
var st=0,cur=new Date(),sel=null,slot=null,topic=TOP[0];cur.setDate(1);
var today=new Date();today.setHours(0,0,0,0);var maxD=new Date(today);maxD.setDate(maxD.getDate()+45);
function okDay(d){var w=d.getDay();return w>=1&&w<=5&&d>today&&d<=maxD&&HOL.indexOf(ymd(d))<0}
function go(i){st=i;$$(".ca-pane",b).forEach(function(p){p.classList.toggle("on",+p.getAttribute("data-p")===i)});$$(".ca-steps span",b).forEach(function(s){var k=+s.getAttribute("data-s");s.classList.toggle("on",k===i||(i===3&&k===2));s.classList.toggle("done",k<i)});if(i>0&&b.getBoundingClientRect().top<70)scrollTo({top:b.getBoundingClientRect().top+scrollY-100,behavior:"smooth"})}
function cal(){var g=$(".ca-cal",b),y=cur.getFullYear(),m=cur.getMonth();$(".mt",b).textContent=y+". "+MON[m];g.innerHTML=["H","K","Sze","Cs","P","Szo","V"].map(function(x){return '<span class="wd">'+x+'</span>'}).join("");
var f=new Date(y,m,1),lead=(f.getDay()+6)%7;for(var i=0;i<lead;i++)g.appendChild(el("span"));var n=new Date(y,m+1,0).getDate();
for(var dd=1;dd<=n;dd++){var d=new Date(y,m,dd),bt=document.createElement("button");bt.type="button";bt.textContent=dd;bt.disabled=!okDay(d);if(ymd(d)===ymd(new Date()))bt.classList.add("td");if(sel&&ymd(d)===ymd(sel))bt.classList.add("sel");bt.setAttribute("aria-label",hu(d));(function(d){bt.addEventListener("click",function(){sel=d;slot=null;cal();slots();go(1)})})(d);g.appendChild(bt)}
$(".pv",b).disabled=y===today.getFullYear()&&m===today.getMonth();var lm=new Date(maxD.getFullYear(),maxD.getMonth(),1);$(".nx",b).disabled=new Date(y,m,1)>=lm}
$(".pv",b).addEventListener("click",function(){cur.setMonth(cur.getMonth()-1);cal()});$(".nx",b).addEventListener("click",function(){cur.setMonth(cur.getMonth()+1);cal()});
function sum(box,full){box.innerHTML=IC.cal.replace("<svg",'<svg width="22" height="22"')+'<span><b>'+hu(sel)+'</b>'+(full&&slot?' · <b>'+slot+'</b>':"")+'</span><button type="button">Módosítás</button>';box.querySelector("button").onclick=function(){go(full?1:0)}}
function slots(){sum($(".s1",b),false);var g=$(".ca-slots",b);g.innerHTML="";["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"].forEach(function(t){var bt=document.createElement("button");bt.type="button";bt.textContent=t;if(slot===t)bt.classList.add("sel");bt.addEventListener("click",function(){slot=t;$$(".ca-slots button",b).forEach(function(x){x.classList.toggle("sel",x===bt)});sum($(".s2",b),true);setTimeout(function(){go(2);var f=$(".ca-f input[name=n]",b);if(f&&innerWidth>760)f.focus({preventScroll:true})},180)});g.appendChild(bt)})}
$$(".ca-topics button",b).forEach(function(x){x.addEventListener("click",function(){topic=x.textContent;$$(".ca-topics button",b).forEach(function(y){y.classList.toggle("sel",y===x)})})});
var form=$(".ca-f",b),err=$(".ca-err",b);
form.addEventListener("submit",function(e){e.preventDefault();err.hidden=true;var F=form.elements,bad=[];["n","p","e"].forEach(function(k){var v=String(F[k].value||"").trim(),ok=v&&(k!=="e"||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))&&(k!=="p"||v.replace(/\D/g,"").length>=8);F[k].classList.toggle("bad",!ok);if(!ok)bad.push(k)});
if(bad.length){err.textContent="Kérlek, add meg a neved, a telefonszámod és egy érvényes e-mail-címet.";err.hidden=false;F[bad[0]].focus();return}
if(!F.ok.checked){err.textContent="Kérlek, fogadd el az adatkezelési tájékoztatót.";err.hidden=false;return}
var when=hu(sel)+" "+slot,data={"Típus":"Személyes időpontfoglalás","Időpont":when,"Téma":topic,"Név":F.n.value.trim(),"Telefon":F.p.value.trim(),"E-mail":F.e.value.trim().toLowerCase(),"Megjegyzés":F.m.value.trim(),"Helyszín":ADR,"Adatkezelés":"Adatkezelési tájékoztató elfogadva ("+new Date().toISOString()+")","website":F.website.value};
try{if(window.caLeadExtras){var x=window.caLeadExtras();for(var k in x)data[k]=x[k]}else data.page=location.href}catch(_){data.page=location.href}
var btn=$(".ca-send",b);btn.disabled=true;btn.lastChild.nodeValue="Küldés…";
fetch("/api/lead",{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)}).then(function(r){return r.json().catch(function(){return{ok:r.ok}})}).then(function(j){if(!j||!j.ok)throw 0;done(when,data)}).catch(function(){btn.disabled=false;btn.lastChild.nodeValue="Időpont kérése";err.innerHTML='Nem sikerült elküldeni. Kérlek, próbáld újra, vagy hívj minket: <a href="tel:+36302336060">+36 30 233 6060</a>.';err.hidden=false})});
function ics(){var s=new Date(sel),p=slot.split(":");s.setHours(+p[0],+p[1],0,0);var e=new Date(s.getTime()+3600000);function f(d){return d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0")+"T"+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+"00"}
return "data:text/calendar;charset=utf-8,"+encodeURIComponent(["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CarAdvance//HU","BEGIN:VEVENT","UID:"+Date.now()+"@caradvance.hu","DTSTAMP:"+f(new Date())+"Z","DTSTART;TZID=Europe/Budapest:"+f(s),"DTEND;TZID=Europe/Budapest:"+f(e),"SUMMARY:Személyes találkozó — CarAdvance","LOCATION:"+ADR,"DESCRIPTION:"+topic+" (visszaigazolásra vár)","END:VEVENT","END:VCALENDAR"].join("\r\n"))}
function done(when,data){var p=$('.ca-pane[data-p="3"]',b);p.innerHTML='<div class="ca-done"><div class="chk"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3>Köszönjük, megkaptuk!</h3><div class="when">'+esc(when)+'</div><p>Kollégánk hamarosan visszaigazolja az időpontot e-mailben vagy telefonon. A részleteket elküldtük a(z) <b>'+esc(data["E-mail"])+'</b> címre is.</p><div class="bt"><a download="caradvance-idopont.ics" href="'+ics()+'">'+IC.cal.replace("<svg",'<svg width="16" height="16"')+'Hozzáadás a naptárhoz</a><a href="https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent("CarAdvance, "+ADR)+'" target="_blank" rel="noopener">Útvonaltervezés</a></div></div>';go(3);
try{if(window.gtag)gtag("event","generate_lead",{form:"idopontfoglalas"})}catch(_){}}
cal();
if(location.hash==="#idopont")setTimeout(function(){scrollTo({top:b.getBoundingClientRect().top+scrollY-100})},300);
// --- csapat egy rácsban
var t1=$("#kap-team",root),t2=$("#kap-team2",root);function merge(){if(t1){t1.setAttribute("data-split","1");if(t2)while(t2.firstChild)t1.appendChild(t2.firstChild)}}merge();[300,800,1600,3000,5000].forEach(function(t){setTimeout(merge,t)});
function cln(){$$(".ca-kgrid,.ca-kgrid *,.ca-depsrow,.ca-depsrow *,#kap-team>.kap-card,#kap-team>.kap-card *,.kap-sec-title,.kap-sec-sub").forEach(function(x){if(x.tagName==="IMG"||(x.getAttribute("style")||"").indexOf("url(")>-1)return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[200,700,1600,3200].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

export function apply(h) {
  if (h.indexOf('id="ca-kap-css"') > -1 || h.indexOf('class="kaphero') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-kap] nincs', FILE); process.exit(0); }
  const src = fs.readFileSync(FILE, 'utf8');
  const o = apply(src);
  if (o === src) console.log('[hu-kap] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-kap] kapcsolat: prémium nézet + időpontfoglaló'); }
}
