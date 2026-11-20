// hu-ol.mjs — Operatív lízing (HU, /operativ-lizing/): prémium, letisztult nézet
// · teljes képernyős, olvasható fejléc, Görgess alul középen
// · összehasonlítás három kártyán (Operatív lízing / Pénzügyi lízing / Tartós bérlet) — a tartós bérlet kiemelve,
//   soronként zöld pipa ott, ahol az adott forma előnyösebb (őszintén: a pénzügyi lízing is nyer, ahol jobb);
//   asztalon igazított sorok, mobilon ujjal lapozható kártyák
// · népszerű autók a főoldali stílusban, kivágott autóképpel, kiemelt havidíjjal
// · prémium kalkulátor: képes, kereshető modellválasztó, pirulás futamidő/bérlő, animált havidíj (a meglévő számítást használja)
// · rövidebb GYIK (4 + mind), kapcsolódó linkek pirulákon; SEO: teljes, márkás cím. Idempotens, csak a magyar oldal.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'operativ-lizing', 'index.html');
const TITLE = 'Operatív lízing 2026 — mi ez, mennyibe kerül? | CarAdvance';
const cutList = () => { for (const d of [path.join(DIST, 'berles-cut'), path.join('public', 'berles-cut')]) if (fs.existsSync(d)) return fs.readdirSync(d).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)); return []; };

function norm(n) {
  let s = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/^volkswagen /, 'vw ').replace(/(\d)-(es|as|os)\b/g, '$1er').replace(/limuzin/, 'limousine').replace(/-osztaly/, '-klasse');
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function cutFor(name, L) {
  const s = norm(name); if (L.includes(s)) return s;
  const tk = s.split('-'); let b = null, bl = 0;
  for (const f of L) { const ft = f.split('-'); if (ft.every((t) => tk.includes(t)) && ft.length > bl) { b = f; bl = ft.length; } }
  return bl >= 2 ? b : null;
}

const P = 'html.ca-ol body section.ol ';
const D = 'html.ca-ol.ca-dark body section.ol ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.14),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';
const CHK = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E")';

const CSS = '<style id="ca-ol-css">'
  // ---- fejléc
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.5) saturate(1.05)}'
  + P + 'section.hero .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.12))!important}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .inner{display:flex;flex-direction:column;align-items:center}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase;cursor:pointer;display:flex}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{width:18px;height:18px;animation:caLBob 1.8s ease-in-out infinite}'
  + '@keyframes caLBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}}'
  + P + '.section{background:transparent!important}'
  // ---- bevezető szöveg
  + P + '.ol-text{max-width:900px!important}'
  + P + '.ol-text>h2,' + P + '.sec-title{font-size:clamp(28px,3.2vw,42px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.1!important}'
  + D + '.ol-text>h2,' + D + '.sec-title{color:#fff!important}'
  + P + '.ol-text>p{font-size:16.5px!important;line-height:1.7!important;opacity:.82}'
  + P + '.ol-text>p a{color:' + RED + '!important;font-weight:700}'
  // ---- összehasonlítás kártyákon
  + P + '.ol-tw{display:none!important}'
  + P + '#osszehasonlitas .ol-text{max-width:1140px!important}' + P + '.ca-cv span{flex:1 1 0;min-width:0;overflow-wrap:anywhere}' + D + '.ca-cmp-n{color:rgba(255,255,255,.6)!important;opacity:1}'
  + P + '.ca-cmp{display:grid;grid-template-columns:200px repeat(3,minmax(0,1fr));grid-template-rows:auto repeat(8,auto);column-gap:14px;margin:26px 0 10px;position:relative}'
  + P + '.ca-cl{grid-column:1;display:flex;align-items:center;padding:14px 4px;font-size:13.5px;font-weight:800;opacity:.62;border-top:1px solid ' + LN + '}'
  + D + '.ca-cl{border-top-color:rgba(255,255,255,.08)}'
  + P + '.ca-cc{grid-row:1/span 9;display:grid;grid-template-rows:subgrid;border-radius:26px;padding:0 18px 10px;position:relative;' + HL + '}'
  + D + '.ca-cc{' + HD + 'color:#fff}'
  + P + '.ca-cc.tb{background:linear-gradient(180deg,rgba(226,0,26,.06),rgba(226,0,26,.01)),rgba(255,255,255,.7)!important;border:1.5px solid rgba(226,0,26,.55)!important;box-shadow:0 0 0 4px rgba(226,0,26,.08),0 30px 70px rgba(226,0,26,.16)!important;margin-top:-10px}'
  + D + '.ca-cc.tb{background:radial-gradient(80% 50% at 50% 0%,rgba(226,0,26,.25),transparent 70%),linear-gradient(#2A2B30,#16171B)!important;border:1.5px solid rgba(255,60,80,.6)!important;box-shadow:0 0 0 4px rgba(226,0,26,.14),0 30px 70px rgba(0,0,0,.5)!important}'
  + P + '.ca-ch{padding:22px 0 16px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}'
  + P + '.ca-ch b{font-size:19px;font-weight:800;letter-spacing:-.02em;line-height:1.2}'
  + P + '.ca-ch small{font-size:12.5px;opacity:.6}'
  + P + '.ca-badge{display:inline-flex;align-items:center;height:26px;padding:0 12px;border-radius:999px;background:' + RED + ';color:#fff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 6px 16px rgba(226,0,26,.35)}'
  + P + '.ca-cv{display:flex;align-items:center;gap:10px;padding:14px 0;font-size:14.5px;line-height:1.45;border-top:1px solid ' + LN + '}'
  + D + '.ca-cv{border-top-color:rgba(255,255,255,.08)}'
  + P + '.ca-cv em{display:none;font-style:normal}'
  + P + '.ca-cv i{flex:0 0 20px;height:20px;border-radius:50%;background:' + CHK + ' center/12px no-repeat,#16A34A;box-shadow:0 4px 10px rgba(22,163,74,.3)}'
  + P + '.ca-cv:not(.w) i{background:none;box-shadow:inset 0 0 0 1.5px rgba(18,19,23,.14)}'
  + D + '.ca-cv:not(.w) i{box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.18)}'
  + P + '.ca-cv.w{font-weight:700}'
  + P + '.ca-cmp-n{font-size:13px;opacity:.6;margin:6px 0 0!important}'
  + P + '.ca-cmp-k{display:none}'
  + '@media(max-width:980px){'
  + P + '.ca-cmp{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:22px -16px 6px;padding:14px 16px 20px}'
  + P + '.ca-cmp::-webkit-scrollbar{display:none}'
  + P + '.ca-cl{display:none}'
  + P + '.ca-cc{flex:0 0 min(84vw,380px);display:block;scroll-snap-align:center;transform:none!important}'
  + P + '.ca-cv{flex-wrap:wrap}' + P + '.ca-cv em{display:block;flex-basis:100%;order:-1;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.5;margin-bottom:-4px}'
  + P + '.ca-cmp-k{display:block;text-align:center;font-size:12.5px;opacity:.5;margin-top:-4px}}'
  // mikor melyiket
  + P + '.ol-text>ul{list-style:none!important;padding:0!important;margin:14px 0 0!important;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}'
  + P + '.ol-text>ul>li{margin:0!important;padding:20px!important;border-radius:22px;font-size:14.5px!important;line-height:1.55!important;' + HL + '}'
  + D + '.ol-text>ul>li{' + HD + 'color:#fff}'
  + P + '.ol-text>ul>li strong:first-child{display:block;font-size:17px;margin-bottom:6px}'
  + P + '.ol-text>ul>li:last-child{border:1.5px solid rgba(226,0,26,.5)!important}'
  + P + '.ol-text>ul>li a{color:' + RED + '!important;font-weight:700}'
  + '@media(max-width:860px){' + P + '.ol-text>ul{grid-template-columns:1fr}}'
  // ---- népszerű autók
  + P + '.ol-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:18px!important;max-width:1200px!important}'
  + P + '.ol-card{position:relative;display:flex!important;flex-direction:column;border-radius:26px!important;overflow:hidden;text-decoration:none!important;color:inherit!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.ol-card{' + HD + 'color:#fff!important}'
  + P + '.ol-card:hover{transform:translateY(-4px)}'
  + P + '.ol-card .ca-stage{position:relative;height:190px;display:flex;align-items:flex-end;justify-content:center;padding:18px 18px 6px;background:radial-gradient(60% 50% at 50% 85%,rgba(18,19,23,.12),transparent 70%)}'
  + D + '.ol-card .ca-stage{background:radial-gradient(60% 50% at 50% 85%,rgba(226,0,26,.25),transparent 70%)}'
  + P + '.ol-card img{width:100%!important;height:100%!important;object-fit:contain!important;border-radius:0!important;background:none!important;filter:drop-shadow(0 16px 18px rgba(0,0,0,.22));transition:transform .5s cubic-bezier(.2,.8,.2,1)}'
  + P + '.ol-card img.ca-full{object-fit:cover!important;border-radius:16px!important;filter:none}'
  + P + '.ol-card:hover img{transform:scale(1.04)}'
  + P + '.ol-card>div{padding:6px 22px 22px!important;background:none!important;display:flex;flex-direction:column;gap:4px}'
  + P + '.ol-card>div b{font-size:19px!important;font-weight:800!important;letter-spacing:-.02em;color:inherit!important}'
  + P + '.ol-card .ca-pr{display:flex;align-items:baseline;gap:6px;margin-top:6px}'
  + P + '.ol-card .ca-pr strong{font-size:26px;font-weight:900;letter-spacing:-.03em;color:' + RED + '}'
  + D + '.ol-card .ca-pr strong{color:#FF4258}'
  + P + '.ol-card .ca-pr small{font-size:13px;opacity:.6}'
  + P + '.ol-card .ca-mt2{font-size:13px;opacity:.6}'
  + P + '.ol-card .ca-go{position:absolute;right:18px;bottom:20px;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(18,19,23,.06);transition:background .25s,color .25s}'
  + D + '.ol-card .ca-go{background:rgba(255,255,255,.08)}'
  + P + '.ol-card:hover .ca-go{background:' + RED + ';color:#fff}'
  + P + '.ol-card .ca-go svg{width:16px;height:16px}'
  + '@media(max-width:980px){' + P + '.ol-grid{grid-template-columns:1fr 1fr!important}}'
  + '@media(max-width:560px){' + P + '.ol-grid{grid-template-columns:1fr!important;gap:12px!important}' + P + '.ol-card .ca-stage{height:170px}}'
  // ---- kalkulátor
  + P + '.ol-calc{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;max-width:1100px!important;align-items:stretch;background:none!important;border:0!important;box-shadow:none!important;padding:0!important}'
  + P + '.ol-calc>.ol-cf{display:none!important}'
  + P + '.ol-calc>.ol-cr,' + P + '.ol-calc>.ol-note,' + P + '.ol-calc>.btn{display:none!important}'
  + P + '.ca-cf{border-radius:28px;padding:26px;display:flex;flex-direction:column;gap:20px;' + HL + '}'
  + D + '.ca-cf{' + HD + 'color:#fff}'
  + P + '.ca-lb{display:block;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.55;margin-bottom:10px}'
  + P + '.ca-pick{position:relative}'
  + P + '.ca-pk{width:100%;display:flex;align-items:center;gap:14px;padding:10px 16px 10px 10px;border-radius:20px;border:1px solid ' + LN + ';background:rgba(255,255,255,.7);color:inherit;font-family:inherit;cursor:pointer;text-align:left;transition:border-color .2s}'
  + D + '.ca-pk{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12)}'
  + P + '.ca-pk:hover{border-color:' + RED + '}'
  + P + '.ca-pk .im{flex:0 0 96px;height:58px;display:flex;align-items:center;justify-content:center}'
  + P + '.ca-pk .im img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.2))}'
  + P + '.ca-pk .tx{flex:1;min-width:0}'
  + P + '.ca-pk .tx b{display:block;font-size:17px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + P + '.ca-pk .tx small{font-size:13px;opacity:.6}'
  + P + '.ca-pk>svg{flex:none;width:18px;height:18px;opacity:.6;transition:transform .3s}'
  + P + '.ca-pick.op .ca-pk>svg{transform:rotate(180deg)}'
  + P + '.ca-pl{display:none;position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:40;border-radius:22px;padding:10px;max-height:380px;overflow:auto;' + HL + 'background-color:rgba(255,255,255,.97)!important;-webkit-backdrop-filter:blur(20px)!important;backdrop-filter:blur(20px)!important}'
  + D + '.ca-pl{' + HD + 'color:#fff}'
  + P + '.ca-pick.op .ca-pl{display:block;animation:caLIn .2s ease}'
  + '@keyframes caLIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}'
  + P + '.ca-pl input{width:100%;box-sizing:border-box;height:44px;border-radius:14px;border:1px solid ' + LN + ';padding:0 14px;font-family:inherit;font-size:15px;margin-bottom:8px;background:rgba(18,19,23,.03);color:inherit;outline:none}'
  + D + '.ca-pl input{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.05)}'
  + P + '.ca-pl input:focus{border-color:' + RED + '}'
  + P + '.ca-pl button{width:100%;display:flex;align-items:center;gap:12px;padding:6px 10px;border:0;border-radius:14px;background:none;color:inherit;font-family:inherit;text-align:left;cursor:pointer}'
  + P + '.ca-pl button:hover,' + P + '.ca-pl button.sel{background:rgba(226,0,26,.07)}'
  + P + '.ca-pl button span{flex:0 0 64px;height:38px;display:flex;align-items:center;justify-content:center}'
  + P + '.ca-pl button img{max-width:100%;max-height:100%;object-fit:contain}'
  + P + '.ca-pl button b{flex:1;font-size:14.5px;font-weight:700}'
  + P + '.ca-pl button small{font-size:13px;font-weight:700;color:' + RED + ';white-space:nowrap}'
  + P + '.ca-seg{display:flex;flex-wrap:wrap;gap:8px}'
  + P + '.ca-seg button{flex:1 1 0;min-width:64px;height:46px;border-radius:14px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer;transition:all .2s}'
  + D + '.ca-seg button{border-color:rgba(255,255,255,.14)}'
  + P + '.ca-seg button.sel{background:#121317;border-color:#121317;color:#fff}' + D + '.ca-seg button.sel{background:#fff;border-color:#fff;color:#121317}'
  + P + '.ca-seg button small{display:block;font-size:11px;font-weight:600;opacity:.6}'
  + P + '.ca-res{position:relative;overflow:hidden;border-radius:28px;padding:30px 28px;color:#fff;display:flex;flex-direction:column;background:radial-gradient(70% 60% at 100% 0%,rgba(226,0,26,.38),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(18,19,23,.3)!important}'
  + P + '.ca-res small{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55)}'
  + P + '.ca-res .big{font-size:clamp(42px,4.6vw,60px);font-weight:900;letter-spacing:-.04em;line-height:1;margin:10px 0 2px;font-variant-numeric:tabular-nums}'
  + P + '.ca-res .big span{font-size:.36em;font-weight:700;letter-spacing:0;opacity:.6;margin-left:6px}'
  + P + '.ca-res .vat{font-size:13px;color:rgba(255,255,255,.55)}'
  + P + '.ca-res dl{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0 18px}'
  + P + '.ca-res dl div{padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}'
  + P + '.ca-res dt{font-size:12px;color:rgba(255,255,255,.55);margin-bottom:4px}'
  + P + '.ca-res dd{margin:0;font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}'
  + P + '.ca-res .inc{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:rgba(255,255,255,.7);margin-bottom:18px}'
  + P + '.ca-res .inc span::before{content:"✓ ";color:#4ADE80;font-weight:800}'
  + P + '.ca-res .note{font-size:12.5px;color:rgba(255,255,255,.45);margin:0 0 18px;line-height:1.5}'
  + P + '.ca-res .go{margin-top:auto;display:inline-flex;align-items:center;justify-content:center;height:54px;border-radius:999px;background:' + RED + ';color:#fff;font-weight:800;text-decoration:none;box-shadow:0 14px 30px rgba(226,0,26,.38)}'
  + P + '.ca-res{color:#121317;background:radial-gradient(70% 60% at 100% 0%,rgba(226,0,26,.12),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.75),rgba(255,255,255,.45)),rgba(255,255,255,.6)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.06),0 30px 70px rgba(226,0,26,.12)!important}'
  + P + '.ca-res small{color:' + RED + '}'
  + P + '.ca-res .big{color:#121317}' + P + '.ca-res .big span{color:#121317}'
  + P + '.ca-res .vat{color:rgba(18,19,23,.55)}'
  + P + '.ca-res dl div{background:rgba(18,19,23,.04);box-shadow:none}'
  + P + '.ca-res dt{color:rgba(18,19,23,.55)}'
  + P + '.ca-res .inc{color:rgba(18,19,23,.7)}' + P + '.ca-res .inc span::before{color:#16A34A}'
  + P + '.ca-res .note{color:rgba(18,19,23,.5)}'
  + D + '.ca-res{color:#fff;background:radial-gradient(70% 60% at 100% 0%,rgba(226,0,26,.38),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(0,0,0,.4)!important}'
  + D + '.ca-res small{color:rgba(255,255,255,.55)}' + D + '.ca-res .big,' + D + '.ca-res .big span{color:#fff}' + D + '.ca-res .vat,' + D + '.ca-res dt{color:rgba(255,255,255,.55)}'
  + D + '.ca-res dl div{background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}' + D + '.ca-res .inc{color:rgba(255,255,255,.7)}' + D + '.ca-res .inc span::before{color:#4ADE80}' + D + '.ca-res .note{color:rgba(255,255,255,.45)}'
  + P + '.ca-res dd{white-space:nowrap}' + '@media(max-width:560px){' + P + '.ca-res dd{font-size:15.5px}}'
  + '@media(max-width:900px){' + P + '.ol-calc{grid-template-columns:1fr}}'
  + '@media(max-width:560px){' + P + '.ca-cf,' + P + '.ca-res{padding:20px 16px;border-radius:24px}' + P + '.ca-pk .im{flex-basis:76px;height:48px}' + P + '.ca-seg button{min-width:54px;font-size:13.5px}}'
  // ---- GYIK + linkek
  + P + '.ol-faq{max-width:900px!important;display:flex!important;flex-direction:column;gap:12px}'
  + P + '.ol-faq details{border-radius:20px!important;overflow:hidden;' + HL + '}'
  + D + '.ol-faq details{' + HD + '}'
  + P + '.ol-faq summary{padding:20px 22px!important;font-weight:700!important;font-size:16px!important;display:flex!important;align-items:center;justify-content:space-between;gap:14px;color:inherit!important;background:none!important}'
  + D + '.ol-faq summary{color:#fff!important}'
  + P + '.ol-faq details>p{padding:0 22px 20px!important;margin:0!important;opacity:.78;line-height:1.6;color:inherit!important}'
  + D + '.ol-faq details>p{color:rgba(255,255,255,.8)!important}'
  + P + '.ol-faq.ca-cut details.ca-x{display:none!important}'
  + P + '.ca-more{align-self:center;margin-top:4px;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}'
  + D + '.ca-more{border-color:rgba(255,255,255,.16);color:#fff}'
  + P + '.ca-more svg{width:16px;height:16px;transition:transform .3s}'
  + P + '.ol-faq:not(.ca-cut) .ca-more svg{transform:rotate(180deg)}'
  + P + '.ol-rl{display:flex!important;flex-wrap:wrap;justify-content:center;gap:10px!important;max-width:900px!important;margin-top:26px!important}'
  + P + '.ol-rl a{display:inline-flex!important;align-items:center;height:42px;padding:0 18px!important;border-radius:999px!important;font-size:14px!important;font-weight:700!important;text-decoration:none!important;color:inherit!important;' + HL + '}'
  + D + '.ol-rl a{' + HD + 'color:#fff!important}'
  + P + '.ol-rl a:hover{color:' + RED + '!important}'
  + '</style>';

const JS = (MAP) => '<script id="ca-ol-js">(function(){var CUT=' + JSON.stringify(MAP) + ';' + String.raw`
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var root=$("section.ol");if(!root||root.__l)return;root.__l=1;document.documentElement.classList.add("ca-ol");
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}
var ARR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
function hu(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g," ")}
// --- Görgess
var sd=$("section.hero .scrolldown",root);if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$("section.hero",root).nextElementSibling;if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})}
// --- összehasonlítás kártyákon
var tb=$(".ol-table",root);if(tb){var hs=$$("thead th",tb).slice(1).map(function(t){return t.textContent.trim()}),rows=$$("tbody tr",tb).map(function(r){var c=$$("td",r);return{l:c[0].textContent.trim(),v:c.slice(1).map(function(x){return x.innerHTML.trim()})}});
var W=[[1,2],[2],[2],[1],[2],[0,2],[1],[2]],SUB=["főleg cégeknek, hosszú távra","ha a végén a sajátod lenne","rugalmasan, 6 hónaptól"];
var cmp=el("div","ca-cmp");cmp.style.gridTemplateRows="auto repeat("+rows.length+",auto)";var ch='<div class="ca-cl" style="grid-row:1;border:0"></div>';rows.forEach(function(r,i){ch+='<div class="ca-cl" style="grid-row:'+(i+2)+'">'+r.l+'</div>'});
hs.forEach(function(h,k){var isT=k===2;var c='<div class="ca-cc'+(isT?' tb':'')+'" style="grid-column:'+(k+2)+';grid-row:1/span '+(rows.length+1)+'"><div class="ca-ch">'+(isT?'<span class="ca-badge">Rugalmasabb</span>':'')+'<b>'+h+'</b><small>'+SUB[k]+'</small></div>';rows.forEach(function(r,i){var w=(W[i]||[]).indexOf(k)>-1;c+='<div class="ca-cv'+(w?' w':'')+'"><em>'+r.l+'</em><i></i><span>'+r.v[k]+'</span></div>'});cmp.insertAdjacentHTML("beforeend",c+'</div>')});
cmp.insertAdjacentHTML("afterbegin",ch);var tw=tb.closest(".ol-tw");tw.parentNode.insertBefore(cmp,tw);cmp.insertAdjacentHTML("afterend",'<p class="ca-cmp-k">Lapozz oldalra a három formához</p>');
var nt=tw.nextElementSibling;if(nt&&nt.tagName==="P"&&/tájékoztató/.test(nt.textContent))nt.classList.add("ca-cmp-n");
if(innerWidth<=980)setTimeout(function(){var t=cmp.querySelector(".ca-cc.tb");if(t)cmp.scrollLeft=t.offsetLeft-(cmp.clientWidth-t.offsetWidth)/2},300)}
// --- népszerű autók
$$(".ol-card",root).forEach(function(a){var im=a.querySelector("img"),dv=a.querySelector("div");if(!im||a.querySelector(".ca-stage"))return;var st=el("div","ca-stage");a.insertBefore(st,im);st.appendChild(im);
var m=(im.getAttribute("src")||"").match(/\/berles\/([^\/?#]+)\.webp/);if(m&&CUT.all.indexOf(m[1])>-1)im.src="/berles-cut/"+m[1]+".webp";else im.classList.add("ca-full");
var sp=dv&&dv.querySelector("span");if(sp){var t=sp.textContent,pm=t.match(/([\d\s ]+)\s*Ft\/hó\s*(nettó-tól)?/),km=t.match(/kaució\s*([\d\s]+)\s*€/);if(pm){sp.outerHTML='<div class="ca-pr"><strong>'+pm[1].trim()+' Ft</strong><small>/hó '+(pm[2]||"")+'</small></div><span class="ca-mt2">'+(km?'Kaució '+hu(km[1].replace(/\s/g,""))+' € · szerviz, adó, biztosítás benne':'')+'</span>'}}
a.insertAdjacentHTML("beforeend",'<span class="ca-go">'+ARR+'</span>')});
// --- prémium kalkulátor
var calc=$(".ol-calc",root),sm=$("#olm"),st2=$("#olt"),sw=$("#olw");
if(calc&&sm&&st2&&sw){var data=[];try{data=JSON.parse(($("#oldata")||{}).textContent||"[]")}catch(_){}
var opts=$$("option",sm).map(function(o,i){var d=data[i]||{};return{i:i,n:d.n||o.textContent.split(" — ")[0],h:d.h||0,img:CUT.calc[i]?"/berles-cut/"+CUT.calc[i]+".webp":""}});
var cf=el("div","ca-cf");cf.innerHTML='<div><span class="ca-lb">Modell</span><div class="ca-pick"><button type="button" class="ca-pk" aria-haspopup="listbox"><span class="im"></span><span class="tx"><b></b><small></small></span>'+DN+'</button><div class="ca-pl" role="listbox"><input type="search" placeholder="Keresés: BMW, Audi, SUV…" aria-label="Modell keresése"><div class="ls"></div></div></div></div>'
+'<div><span class="ca-lb">Futamidő</span><div class="ca-seg sT">'+$$("option",st2).map(function(o){return '<button type="button" data-v="'+o.value+'">'+o.value+' hó</button>'}).join("")+'</div></div>'
+'<div><span class="ca-lb">Bérlő</span><div class="ca-seg sW">'+$$("option",sw).map(function(o){var t=o.textContent,m=t.match(/^(.*?)\s*\((.*)\)$/);return '<button type="button" data-v="'+o.value+'">'+(m?m[1]+'<small>'+m[2]+'</small>':t)+'</button>'}).join("")+'</div></div>';
var res=el("div","ca-res");var cta=$(".ol-calc>.btn",calc),note=$(".ol-calc>.ol-note",calc);
res.innerHTML='<small>Havidíj</small><div class="big"><b>—</b><span>/ hó</span></div><div class="vat"></div><dl><div><dt>Teljes díj</dt><dd class="r2">—</dd></div><div><dt>Visszajáró kaució</dt><dd class="r3">—</dd></div></dl><div class="inc"><span>Szerviz</span><span>Adó</span><span>Casco + kgfb</span><span>Nyári + téli gumi</span></div><p class="note">'+(note?note.textContent:"")+'</p><a class="go" href="'+(cta?cta.getAttribute("href"):"/kapcsolat/")+'">'+(cta?cta.textContent:"Ajánlatot kérek")+' →</a>';
calc.insertBefore(res,calc.firstChild);calc.insertBefore(cf,calc.firstChild);
var pk=$(".ca-pk",cf),pick=$(".ca-pick",cf),ls=$(".ls",cf),q=$("input",cf),big=$(".big b",res),vat=$(".vat",res),r2=$(".r2",res),r3=$(".r3",res);
function list(f){f=(f||"").toLowerCase();ls.innerHTML=opts.filter(function(o){return !f||o.n.toLowerCase().indexOf(f)>-1}).map(function(o){return '<button type="button" data-i="'+o.i+'"'+(+sm.value===o.i?' class="sel"':'')+'><span>'+(o.img?'<img src="'+o.img+'" alt="" loading="lazy">':'')+'</span><b>'+o.n+'</b><small>'+hu(o.h)+' Ft</small></button>'}).join("")||'<p style="padding:10px;opacity:.6;margin:0">Nincs találat</p>'}
pk.addEventListener("click",function(){var o=pick.classList.toggle("op");if(o){list("");q.value="";if(innerWidth>760)q.focus()}});
q.addEventListener("input",function(){list(q.value)});
ls.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;sm.value=b.getAttribute("data-i");sm.dispatchEvent(new Event("change"));pick.classList.remove("op");sync()});
document.addEventListener("click",function(e){if(!pick.contains(e.target))pick.classList.remove("op")});
$$(".sT button",cf).forEach(function(b){b.addEventListener("click",function(){st2.value=b.getAttribute("data-v");st2.dispatchEvent(new Event("change"));sync()})});
$$(".sW button",cf).forEach(function(b){b.addEventListener("click",function(){sw.value=b.getAttribute("data-v");sw.dispatchEvent(new Event("change"));sync()})});
var shown=0;function anim(to){var from=shown,t0=performance.now(),D=500;shown=to;(function f(n){var x=Math.min(1,(n-t0)/D),e=1-Math.pow(1-x,3);big.textContent=hu(Math.round((from+(to-from)*e)/1000)*1000)+" Ft";if(x<1)requestAnimationFrame(f)})(t0)}
function sync(){var o=opts[+sm.value]||opts[0];$(".im",pk).innerHTML=o.img?'<img src="'+o.img+'" alt="">':"";$(".tx b",pk).textContent=o.n;$(".tx small",pk).textContent="tól "+hu(o.h)+" Ft/hó nettó";
$$(".sT button",cf).forEach(function(b){b.classList.toggle("sel",b.getAttribute("data-v")===st2.value)});$$(".sW button",cf).forEach(function(b){b.classList.toggle("sel",b.getAttribute("data-v")===sw.value)});
var v=(($("#olr1")||{}).textContent||"").replace(/\D/g,"");if(v)anim(+v);vat.textContent=sw.value==="p"?"bruttó, 19% áfával":"nettó, áfa nélkül";r2.textContent=($("#olr2")||{}).textContent||"—";r3.textContent=($("#olr3")||{}).textContent||"—"}
sync()}
// --- GYIK: az első 4 látszik
var fq=$(".ol-faq",root);if(fq){var ds=$$(":scope>details",fq);if(ds.length>5){ds.forEach(function(d,k){if(k>=4)d.classList.add("ca-x")});fq.classList.add("ca-cut");var mo=el("button","ca-more");mo.type="button";var lbl=function(){mo.innerHTML=(fq.classList.contains("ca-cut")?"Mind a "+ds.length+" kérdés":"Kevesebb kérdés")+DN};lbl();mo.addEventListener("click",function(){fq.classList.toggle("ca-cut");lbl()});fq.appendChild(mo)}}
$$(".ol-text>ul>li",root).forEach(function(li){var n=li.querySelector("strong");if(n&&n.nextSibling&&n.nextSibling.nodeType===3)n.nextSibling.nodeValue=n.nextSibling.nodeValue.replace(/^\s*—\s*/,"")});
$$(".ol-rl a",root).forEach(function(a){a.textContent=a.textContent.replace(/\s*→\s*$/,"")});
// sötét mód inline-színek takarítása
function cln(){$$(".ol-text,.ol-text *,.ca-cmp,.ca-cmp *,.ol-grid,.ol-grid *,.ol-calc,.ol-calc *,.ol-faq,.ol-faq *,.ol-rl,.ol-rl *,.sec-title",root).forEach(function(x){if(x.tagName==="IMG")return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

const SCROLL = '<button class="scrolldown" aria-label="Görgess lejjebb">Görgess<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>';

export function apply(h) {
  if (h.indexOf('id="ca-ol-css"') > -1 || h.indexOf('ol-calc') < 0) return null;
  const L = cutList();
  let names = [];
  try { names = JSON.parse(h.match(/<script type="application\/json" id="oldata"[^>]*>([\s\S]*?)<\/script>/)[1]).map((d) => d.n); } catch (e) {}
  const MAP = { all: L, calc: names.map((n) => cutFor(n, L)) };
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + TITLE + '</title>');
  h = h.replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, '$1' + TITLE + '$2');
  // Görgess a fejléc aljára
  h = h.replace(/(<section class="hero"[^>]*>[\s\S]*?<div class="cta-row"[^>]*>[\s\S]*?<\/div>\s*<\/div>)(\s*<\/section>)/, (m, a, b) => (a.indexOf('scrolldown') > -1 ? m : a + SCROLL + b));
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS(MAP) + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-ol] nincs', FILE); process.exit(0); }
  const o = apply(fs.readFileSync(FILE, 'utf8'));
  if (!o) console.log('[hu-ol] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-ol] operatív lízing: letisztult nézet'); }
}
