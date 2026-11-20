// hu-bfo.mjs — Bérlési folyamat (HU, /berlesi-folyamat/): prémium, letisztult nézet
// · fejléc: olvasható cím (élénk piros kiemelés), teljes képernyő, Görgess alul középen
// · gyors tények (10 lépés · min. 6 hónap · kaució · magánszemély vagy cég)
// · a 10 lépés VÍZSZINTES, görgetésre haladó kártyasorként (asztalon a szakasz rögzül, a kártyák oldalra gördülnek;
//   mobilon ujjal lapozható) — 3 szakasz-sáv (Ajánlat · Papírok és kaució · Az autód), számláló, előre/vissza
// · a lábjegyzetek a megfelelő lépésnél, „Jó tudni” lenyitóként; a 6 hónap vizuálisan (havi sáv)
// · szerződés-kártyák ikonokkal, záró kártya, GYIK kártyák; sötét módban puha átmenetek
// · SEO: márkanév a címben, BreadcrumbList; halott „#” dokumentum-linkek nem kattinthatók (címke marad)
// Idempotens. Csak a magyar oldal.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'berlesi-folyamat', 'index.html');
const SITE = 'https://www.caradvance.hu';
const TITLE = 'A tartós bérlet folyamata — 10 lépés, 6 hónaptól | CarAdvance';

function seo(h, log) {
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + TITLE + '</title>');
  h = h.replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, '$1' + TITLE + '$2');
  // halott dokumentum-linkek (href="…#") → nem kattintható címke
  h = h.replace(/<a class="pf-lnk" href="https:\/\/www\.caradvance\.hu\/(?:berlesi|beszerzesi)-folyamat\/#"([^>]*)>([^<]*?) →<\/a>/g, (m, a, t) => { log.dead++; return '<span class="pf-lnk ca-doc"' + a + '>' + t + '</span>'; });
  if (h.indexOf('"BreadcrumbList"') < 0) h = h.replace('</head>', () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Tartós bérlet', item: SITE + '/tartos-berlet/' },
    { '@type': 'ListItem', position: 3, name: 'A bérlés folyamata', item: SITE + '/berlesi-folyamat/' },
  ] }) + '</script></head>');
  return h;
}

const P = 'html.ca-bfo body section.pf ';
const D = 'html.ca-bfo.ca-dark body section.pf ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.12)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.16),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.45),inset -1px -1px 1px rgba(255,255,255,.16),inset 0 0 0 1px rgba(255,255,255,.06),inset 0 10px 30px rgba(255,255,255,.05),0 30px 70px rgba(0,0,0,.55),0 4px 14px rgba(0,0,0,.35)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const CSS = '<style id="ca-bfo-css">'
  // ---- fejléc
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.55) saturate(1.05)}'
  + P + 'section.hero .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.1))!important}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .inner{display:flex;flex-direction:column;align-items:center}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caOBob 1.8s ease-in-out infinite}'
  + '@keyframes caOBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}}'
  // ---- gyors tények
  + P + '.ca-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;max-width:1100px;margin:8px auto 0;padding:0 24px;box-sizing:border-box}'
  + P + '.ca-fact{border-radius:24px;padding:20px 20px 18px;display:flex;gap:14px;align-items:center;' + HL + '}'
  + D + '.ca-fact{' + HD + 'color:#fff}'
  + P + '.ca-fact i{flex:0 0 46px;height:46px;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#B80015);box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 10px 22px rgba(226,0,26,.28)}'
  + P + '.ca-fact i svg{width:22px;height:22px}'
  + P + '.ca-fact b{display:block;font-size:19px;font-weight:800;letter-spacing:-.02em;line-height:1.15}'
  + P + '.ca-fact span{display:block;font-size:13px;opacity:.62;margin-top:2px}'
  + '@media(max-width:980px){' + P + '.ca-facts{grid-template-columns:1fr 1fr}}'
  + '@media(max-width:560px){' + P + '.ca-facts{padding:0 14px;gap:10px}' + P + '.ca-fact{padding:14px;gap:10px;border-radius:20px}' + P + '.ca-fact i{flex-basis:38px;height:38px;border-radius:12px}' + P + '.ca-fact i svg{width:18px;height:18px}' + P + '.ca-fact b{font-size:15.5px}' + P + '.ca-fact span{font-size:12px}}'
  // ---- vízszintes út
  + P + '.pf-wrap{max-width:none!important;padding:0!important;margin:0!important}'
  + P + '.pf-steps{display:none!important}'
  + P + '.ca-hz{position:relative;margin-top:10px}'
  + P + '.ca-hz-s{position:sticky;top:0;height:100vh;height:100svh;display:flex;flex-direction:column;justify-content:center;overflow:hidden;padding-top:72px;box-sizing:border-box}'
  + P + '.ca-hz-top{display:flex;align-items:center;gap:18px;max-width:1200px;width:100%;margin:0 auto 22px;padding:0 24px;box-sizing:border-box}'
  + P + '.ca-ph{flex:1;display:flex;gap:8px;min-width:0}'
  + P + '.ca-ph button{flex:var(--w) 1 0;min-width:0;border:0;background:none;padding:0;color:inherit;font-family:inherit;text-align:left;cursor:pointer}'
  + P + '.ca-ph button span{display:block;font-size:12.5px;font-weight:800;letter-spacing:.04em;margin-bottom:8px;opacity:.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .3s,color .3s}'
  + P + '.ca-ph button.on span{opacity:1;color:' + RED + '}' + D + '.ca-ph button.on span{color:#FF5468}'
  + P + '.ca-ph button i{display:block;height:4px;border-radius:4px;background:rgba(18,19,23,.1);overflow:hidden}'
  + D + '.ca-ph button i{background:rgba(255,255,255,.12)}'
  + P + '.ca-ph button i em{display:block;height:100%;width:100%;border-radius:4px;background:linear-gradient(90deg,#FF2A40,' + RED + ');transform-origin:0 50%;transform:scaleX(0);box-shadow:0 0 12px rgba(226,0,26,.5)}'
  + P + '.ca-cnt{font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:.02em;white-space:nowrap}'
  + P + '.ca-cnt b{color:' + RED + ';font-size:22px}' + D + '.ca-cnt b{color:#FF5468}'
  + P + '.ca-ar{display:flex;gap:8px}'
  + P + '.ca-ar button{width:44px;height:44px;border-radius:50%;border:1px solid ' + LN + ';background:transparent;color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s}'
  + D + '.ca-ar button{border-color:rgba(255,255,255,.16)}'
  + P + '.ca-ar button:hover:not(:disabled){background:' + RED + ';border-color:' + RED + ';color:#fff}'
  + P + '.ca-ar button:disabled{opacity:.3;cursor:default}'
  + P + '.ca-ar svg{width:18px;height:18px}'
  + P + '.ca-hz-t{display:flex;gap:22px;align-items:stretch;will-change:transform;padding:14px max(24px,calc((100vw - 1200px)/2 + 24px)) 40px;box-sizing:border-box;width:max-content}'
  + P + '.ca-st{position:relative;flex:0 0 min(440px,78vw);border-radius:30px;padding:28px 28px 24px;box-sizing:border-box;display:flex;flex-direction:column;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .5s;' + HL + '}'
  + D + '.ca-st{' + HD + 'color:#fff}'
  + P + '.ca-hz.ca-pin .ca-st{opacity:.55;transform:scale(.965)}'
  + P + '.ca-hz.ca-pin .ca-st.on{opacity:1;transform:none}'
  + P + '.ca-st-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}'
  + P + '.ca-st-n{font-size:74px;font-weight:900;line-height:.85;letter-spacing:-.05em;color:transparent;-webkit-text-stroke:1.6px ' + RED + ';font-variant-numeric:tabular-nums;transition:color .5s,-webkit-text-stroke-color .5s}'
  + P + '.ca-st.on .ca-st-n{color:' + RED + ';text-shadow:0 10px 30px rgba(226,0,26,.25)}'
  + D + '.ca-st-n{-webkit-text-stroke-color:#FF4258}' + D + '.ca-st.on .ca-st-n{color:#FF2A40}'
  + P + '.ca-st-tag{flex:none;height:28px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:rgba(226,0,26,.08);color:' + RED + '}'
  + D + '.ca-st-tag{background:rgba(226,0,26,.18);color:#FF6B7B}'
  + P + '.ca-st .pf-b{display:flex;flex-direction:column;flex:1;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}'
  + P + '.ca-st .pf-b h3{font-size:23px!important;font-weight:800!important;letter-spacing:-.02em;line-height:1.2;margin:0 0 10px!important;color:inherit!important}'
  + P + '.ca-st .pf-b>p{font-size:15px!important;line-height:1.6!important;opacity:.74;margin:0 0 14px!important;color:inherit!important}'
  + P + '.ca-st .pf-b>p a{color:' + RED + '!important;font-weight:700}' + D + '.ca-st .pf-b>p a{color:#FF6B7B!important}'
  + P + '.ca-st .pf-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto!important;padding-top:8px}'
  + P + '.ca-st .pf-lnk{display:inline-flex!important;align-items:center;gap:6px;height:38px;padding:0 15px!important;border-radius:999px!important;font-size:13.5px!important;font-weight:700!important;text-decoration:none!important;background:' + RED + '!important;color:#fff!important;border:0!important;box-shadow:0 8px 20px rgba(226,0,26,.25)!important}'
  + P + '.ca-st .pf-lnk.ca-doc{background:transparent!important;color:inherit!important;border:1px solid ' + LN + '!important;box-shadow:none!important;opacity:.8;cursor:default}'
  + D + '.ca-st .pf-lnk.ca-doc{border-color:rgba(255,255,255,.16)!important}'
  + P + '.ca-st .pf-lnk.ca-doc svg{width:15px;height:15px;opacity:.7}'
  + P + '.ca-st .dep-table{margin:0 0 14px!important;border-radius:18px!important;overflow:hidden;background:rgba(226,0,26,.06)!important;border:0!important}'
  + D + '.ca-st .dep-table{background:rgba(226,0,26,.14)!important}'
  + P + '.ca-st .dep-row{display:block!important;padding:14px 16px!important;background:none!important;border:0!important}'
  + P + '.ca-st .dep-amount{font-size:26px!important;font-weight:900!important;letter-spacing:-.03em;color:' + RED + '!important;background:none!important;padding:0!important;margin:0 0 4px!important;width:auto!important;text-align:left!important}'
  + D + '.ca-st .dep-amount{color:#FF4258!important}'
  + P + '.ca-st .dep-cars{font-size:13px!important;opacity:.72;color:inherit!important;background:none!important;padding:0!important}'
  + P + '.ca-jt{margin:0 0 14px;border-radius:16px;background:rgba(18,19,23,.035)}'
  + D + '.ca-jt{background:rgba(255,255,255,.05)}'
  + P + '.ca-jt summary{list-style:none;display:flex!important;align-items:center;gap:8px;padding:11px 14px!important;font-size:13px!important;font-weight:800!important;cursor:pointer;color:inherit!important;background:none!important;border:0!important;box-shadow:none!important}'
  + P + '.ca-jt summary::-webkit-details-marker{display:none}'
  + 'html.ca-bfo body section.pf .ca-jt>summary::after{flex:0 0 22px!important;width:22px!important;height:22px!important;margin-left:auto!important;background-size:10px 2px,2px 10px,auto!important}'
  + P + '.ca-jt summary svg{width:16px;height:16px;color:' + RED + '}'
  + P + '.ca-jt p{font-size:13px!important;line-height:1.55!important;opacity:.72;margin:0!important;padding:0 14px 12px!important;color:inherit!important}'
  + P + '.ca-jt p+p{padding-top:2px!important}'
  + P + '.ca-st.ca-last{background:radial-gradient(120% 80% at 100% 0%,rgba(255,255,255,.22),transparent 55%),linear-gradient(160deg,#FF2A40,' + RED + ' 55%,#A50013)!important;border:0!important;color:#fff!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.45),0 30px 60px rgba(226,0,26,.35)!important}'
  + P + '.ca-st.ca-last .ca-st-n{color:#fff!important;-webkit-text-stroke:0;text-shadow:none}'
  + P + '.ca-st.ca-last .ca-st-tag{background:rgba(255,255,255,.18);color:#fff}'
  + P + '.ca-st.ca-last .pf-b>p{opacity:.92}'
  + P + '.ca-key{width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;margin:0 0 18px;animation:caOKey 3.2s ease-in-out infinite}'
  + P + '.ca-key svg{width:32px;height:32px}'
  + '@keyframes caOKey{0%,100%{transform:rotate(0)}8%{transform:rotate(-14deg)}16%{transform:rotate(10deg)}24%{transform:rotate(0)}}'
  + P + '.ca-st.ca-last .ca-go{margin-top:auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;border-radius:999px;background:#fff;color:' + RED + ';font-weight:800;text-decoration:none;font-size:15px;box-shadow:0 12px 26px rgba(0,0,0,.18)}'
  + P + '.ca-hint{text-align:center;font-size:12.5px;opacity:.5;margin-top:-18px;letter-spacing:.04em}'
  // mobil / csökkentett mozgás: ujjal lapozható sor
  + P + '.ca-hz:not(.ca-pin) .ca-hz-s{position:static;height:auto;padding-top:0;overflow:visible}'
  + P + '.ca-hz:not(.ca-pin) .ca-hz-v{overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}'
  + P + '.ca-hz:not(.ca-pin) .ca-hz-v::-webkit-scrollbar{display:none}'
  + P + '.ca-hz:not(.ca-pin) .ca-st{scroll-snap-align:center}'
  + P + '.ca-hz:not(.ca-pin) .ca-hint{margin-top:-24px}'
  + '@media(max-width:899px){' + P + '.ca-hz-top{flex-wrap:wrap;gap:12px 14px;padding:0 16px}' + P + '.ca-ph{flex-basis:100%;order:3}' + P + '.ca-hz-t{padding:10px 16px 36px;gap:12px}' + P + '.ca-st{flex-basis:84vw;padding:22px 20px 20px;border-radius:26px}' + P + '.ca-st-n{font-size:58px}' + P + '.ca-st .pf-b h3{font-size:20px!important}' + P + '.ca-ar{margin-left:auto}' + P + '.ca-ph button span{font-size:11px}}'
  // ---- 6 hónap
  + P + '.bl-term{display:block!important;max-width:1100px;margin:0 auto!important;border-radius:32px;padding:34px!important;box-sizing:border-box;' + HL + '}'
  + D + '.bl-term{' + HD + 'color:#fff}'
  + P + '.bl-term-box{display:none!important}'
  + P + '.bl-term-card{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}'
  + P + '.ca-six{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px 34px;align-items:center}'
  + P + '.ca-six-n{grid-row:span 2;font-size:150px;font-weight:900;letter-spacing:-.06em;line-height:.8;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#9E0012);-webkit-background-clip:text;background-clip:text;color:transparent;padding-right:6px}'
  + P + '.ca-six-n small{display:block;font-size:15px;letter-spacing:.12em;text-transform:uppercase;-webkit-text-fill-color:currentColor;color:inherit;opacity:.6;margin-top:16px;font-weight:800;text-align:center}'
  + P + '.bl-term-card h3{font-size:clamp(24px,2.4vw,30px)!important;font-weight:800!important;letter-spacing:-.025em;margin:0 0 8px!important;color:inherit!important}'
  + P + '.bl-term-card p{opacity:.72;margin:0!important;line-height:1.6;color:inherit!important}'
  + P + '.ca-tl{position:relative;margin-top:26px;padding:30px 0 4px}'
  + P + '.ca-tl-r{position:relative;display:grid;grid-template-columns:repeat(6,minmax(0,1fr)) minmax(0,1.7fr);align-items:center}'
  + P + '.ca-tl-tr{grid-column:1/7;position:relative;height:10px;border-radius:10px;background:rgba(18,19,23,.08);overflow:visible}'
  + D + '.ca-tl-tr{background:rgba(255,255,255,.1)}'
  + P + '.ca-tl-f{position:absolute;inset:0;border-radius:10px;background:linear-gradient(90deg,#FF5468,#E2001A 55%,#B80015);transform-origin:0 50%;transform:scaleX(0);box-shadow:0 0 18px rgba(226,0,26,.45)}'
  + P + '.ca-tl-dot{position:absolute;top:50%;left:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#fff;box-shadow:0 0 0 5px rgba(226,0,26,.9),0 6px 18px rgba(226,0,26,.5);z-index:2}'
  + P + '.ca-tl-t{position:absolute;top:50%;width:2px;height:16px;margin-top:-8px;background:rgba(18,19,23,.22);border-radius:2px;z-index:1}'
  + D + '.ca-tl-t{background:rgba(255,255,255,.25)}'
  + P + '.ca-tl-t.on{background:#fff}'
  + P + '.ca-tl-x{grid-column:7;height:0;border-top:3px dashed rgba(18,19,23,.2);margin-left:6px}'
  + D + '.ca-tl-x{border-top-color:rgba(255,255,255,.25)}'
  + P + '.ca-tl-x.on{border-top-color:' + RED + '}'
  + P + '.ca-tl-l{display:grid;grid-template-columns:repeat(6,minmax(0,1fr)) minmax(0,1.7fr);margin-top:14px}'
  + P + '.ca-tl-l span{text-align:center;font-size:12.5px;font-weight:800;opacity:.4;transition:opacity .3s,color .3s;white-space:nowrap}'
  + P + '.ca-tl-l span.on{opacity:1;color:' + RED + '}' + D + '.ca-tl-l span.on{color:#FF5468}'
  + P + '.ca-tl-l span.x{text-align:left;padding-left:10px;white-space:normal;font-weight:700;line-height:1.3}'
  + P + '.ca-tl-l span.x.on{color:inherit;opacity:.9}'
  + P + '.ca-tl-a{position:absolute;top:0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.55;white-space:nowrap}'
  + P + '.ca-tl-a.s{left:0}' + P + '.ca-tl-a.e{left:calc(6/7.7*100%);transform:translateX(-50%);transition:opacity .3s,color .3s}'
  + P + '.ca-tl-a.e.on{opacity:1;color:' + RED + '}' + D + '.ca-tl-a.e.on{color:#FF5468}'
  + P + '.ca-six-f{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px;align-items:start}'
  + P + '.ca-six-f>div{display:flex;gap:12px;align-items:flex-start;padding:16px;border-radius:18px;background:rgba(18,19,23,.035);font-size:13.5px;line-height:1.5}'
  + D + '.ca-six-f>div{background:rgba(255,255,255,.05)}'
  + P + '.ca-six-f svg{flex:0 0 22px;width:22px;height:22px;color:' + RED + '}'
  + P + '.ca-six-f .ca-jt svg{flex-basis:16px;width:16px;height:16px}'
  + P + '.ca-six-f .ca-jt{margin:10px 0 0;background:rgba(18,19,23,.04)}'
  + P + '.ca-six-f>div>span{flex:1;min-width:0}' + P + '.ca-six-f b{display:block;font-size:15px;margin-bottom:2px}'
  + P + '.bl-notes{display:none!important}'
  + '@media(max-width:760px){' + P + '.bl-term{padding:24px 18px!important;border-radius:26px}' + P + '.ca-six{grid-template-columns:1fr;text-align:left}' + P + '.ca-six-n{grid-row:auto;font-size:96px;display:flex;align-items:flex-end;gap:12px}' + P + '.ca-six-n small{margin:0 0 10px;text-align:left}' + P + '.ca-tl-r,' + P + '.ca-tl-l{grid-template-columns:repeat(6,minmax(0,1fr))}' + P + '.ca-tl-x{display:none}' + P + '.ca-tl-l span.x{grid-column:1/-1;text-align:left;padding:10px 0 0}' + P + '.ca-tl-a.e{left:auto;right:0;transform:none}' + P + '.ca-tl-l span{font-size:11.5px}' + P + '.ca-six-f{grid-template-columns:1fr}}'
  // ---- szerződés-kártyák
  + P + '.bf-box{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;max-width:1100px;margin:0 auto}'
  + P + '.bf-head{display:flex!important;align-items:flex-end!important;justify-content:space-between;gap:20px;margin-bottom:22px!important}'
  + P + '.bf-head .btn{border-radius:999px!important;flex:none}'
  + D + '.bf-head :is(h2,.sec-title){color:#fff!important;-webkit-text-fill-color:#fff!important}' + D + '.bf-head .bf-lead{color:rgba(255,255,255,.7)!important}' + D + 'section .sec-title{color:#fff!important;-webkit-text-fill-color:#fff!important}'
  + P + '.bf-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important}'
  + P + '.bf-card{position:relative;display:flex!important;flex-direction:column;gap:8px;padding:24px 22px 20px 22px!important;border-radius:24px!important;text-decoration:none!important;color:inherit!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + D + '.bf-card{' + HD + 'color:#fff!important}'
  + P + '.bf-card:hover{transform:translateY(-3px)}'
  + P + '.bf-card .ca-ic{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.08);color:' + RED + ';margin-bottom:6px}'
  + D + '.bf-card .ca-ic{background:rgba(226,0,26,.18);color:#FF5468}'
  + P + '.bf-card .ca-ic svg{width:22px;height:22px}'
  + P + '.bf-card b{font-size:17px!important;font-weight:800!important;color:inherit!important}'
  + P + '.bf-card span{font-size:14px!important;line-height:1.55!important;opacity:.7;color:inherit!important}'
  + P + '.bf-card em{margin-top:auto;padding-top:6px;font-style:normal;font-weight:700;font-size:13.5px;color:' + RED + '!important}'
  + D + '.bf-card em{color:#FF6B7B!important}'
  + '@media(max-width:900px){' + P + '.bf-grid{grid-template-columns:1fr 1fr!important}' + P + '.bf-head{flex-direction:column;align-items:flex-start!important}}'
  + '@media(max-width:560px){' + P + '.bf-grid{grid-template-columns:1fr!important}}'
  // ---- záró kártya
  + P + 'div.pf-cta{position:relative;overflow:hidden;max-width:1100px;margin:0 auto;border-radius:32px!important;padding:46px 40px!important;display:flex!important;flex-direction:column;align-items:center;text-align:center;gap:20px;color:#fff!important;' + HD + '}'
  + P + 'div.pf-cta h2{font-size:clamp(26px,3vw,38px)!important;font-weight:800!important;letter-spacing:-.03em;color:#fff!important;margin:0 0 8px!important}'
  + P + 'div.pf-cta p{color:rgba(255,255,255,.72)!important;margin:0!important}'
  + P + 'div.pf-cta .btn{border-radius:999px!important;height:52px;padding:0 26px!important;display:inline-flex;align-items:center;background:' + RED + '!important;color:#fff!important;border:0!important;box-shadow:0 14px 30px rgba(226,0,26,.38)!important;font-weight:800!important}'
  + P + 'div.pf-cta::before{content:"";position:absolute;inset:auto -10% -60% -10%;height:120%;background:radial-gradient(50% 50% at 50% 50%,rgba(226,0,26,.35),transparent 70%);background-color:transparent!important;pointer-events:none}'
  + P + 'div.pf-cta>*{position:relative}'
  // ---- GYIK
  + P + '.pf-faq{max-width:900px!important;display:flex!important;flex-direction:column;gap:12px}'
  + P + '.pf-faq details{border-radius:20px!important;overflow:hidden;' + HL + '}'
  + D + '.pf-faq details{' + HD + '}'
  + P + '.pf-faq summary{padding:20px 22px!important;font-weight:700!important;font-size:16px!important;display:flex!important;align-items:center;justify-content:space-between;gap:14px;color:inherit!important;background:none!important}'
  + D + '.pf-faq summary{color:#fff!important}'
  + P + '.pf-faq details>p{padding:0 22px 20px!important;margin:0!important;opacity:.74;line-height:1.6;color:inherit!important}'
  + D + '.pf-faq details>p{color:rgba(255,255,255,.8)!important}'
  + P + '.section{background:transparent!important}'
  + '@media(prefers-reduced-motion:reduce){' + P + '.ca-key{animation:none}' + P + '.ca-st{transition:none}}'
  + '</style>';

const IC = {
  steps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M4 12h16M4 18h7"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 11h6M16 15h6M17 7h5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 20 3M16 7l3 3M14 9l2 2"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 14l4-5"/></svg>',
  bill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h11M10 8l4 4-4 4"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  umb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v6a2 2 0 0 0 4 0"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
};

const JS = '<script id="ca-bfo-js">(function(){var IC=' + JSON.stringify(IC) + ';' + String.raw`
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var root=$("section.pf");if(!root||root.__o)return;root.__o=1;var H=document.documentElement;H.classList.add("ca-bfo");
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}
// --- lábjegyzetek összegyűjtése
var NOTE={};$$(".bl-notes p",root).forEach(function(p){var s=p.querySelector("sup");if(!s)return;var n=+s.textContent.trim();var c=p.cloneNode(true);var x=c.querySelector("sup");if(x)x.remove();NOTE[n]=c.innerHTML.trim()});
// --- Görgess
var sd=$("section.hero .scrolldown",root);if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$(".ca-facts",root)||$(".pf-wrap",root);if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-110,behavior:"smooth"})})}
// --- gyors tények
var wrapSec=$(".pf-wrap",root);var introSec=wrapSec&&wrapSec.parentNode;
var facts=el("div","ca-facts",[[IC.steps,"10 lépés","a kulcsrakész átadásig"],[IC.cal,"min. 6 hónap","bérlési idő, utána havonta"],[IC.shield,"2 000–10 000 €","kaució, modelltől függően"],[IC.user,"Magánszemély vagy cég","mindkettőre szabott papírok"]].map(function(f){return '<div class="ca-fact"><i>'+f[0]+'</i><div><b>'+f[1]+'</b><span>'+f[2]+'</span></div></div>'}).join(""));
var hero=$("section.hero",root);if(hero&&hero.nextSibling)hero.parentNode.insertBefore(facts,hero.nextSibling);
// --- vízszintes út
var steps=$$(".pf-steps>.pf-step",root);if(!steps.length)return;
var PH=[["Ajánlat",0,3],["Papírok és kaució",3,6],["Az autód",6,10]];var FN={0:[1,2,3],3:[5],5:[6],6:[7],7:[8]};
var hz=el("div","ca-hz"),stc=el("div","ca-hz-s"),top=el("div","ca-hz-top"),vw=el("div","ca-hz-v"),tr=el("div","ca-hz-t");
top.innerHTML='<div class="ca-ph">'+PH.map(function(p,k){return '<button type="button" data-k="'+k+'" style="--w:'+(p[2]-p[1])+'"><span>'+(k+1)+'. '+p[0]+'</span><i><em></em></i></button>'}).join("")+'</div><div class="ca-cnt"><b>01</b> / 10</div><div class="ca-ar"><button type="button" class="pv" aria-label="Előző lépés">'+IC.prev+'</button><button type="button" class="nx" aria-label="Következő lépés">'+IC.next+'</button></div>';
var cards=steps.map(function(s,i){var c=el("article","ca-st");c.setAttribute("data-i",i);var ph=PH.filter(function(p){return i>=p[1]&&i<p[2]})[0];var b=s.querySelector(".pf-b");
$$("sup",b).forEach(function(x){x.remove()});
var last=i===steps.length-1;c.innerHTML='<div class="ca-st-h">'+(last?'<span class="ca-key">'+IC.key+'</span>':'<span class="ca-st-n">'+(i<9?"0":"")+(i+1)+'</span>')+'<span class="ca-st-tag">'+(last?"Kész":ph[0])+'</span></div>';
c.appendChild(b);
var fn=(FN[i]||[]).filter(function(n){return NOTE[n]});if(fn.length){var d=el("details","ca-jt",'<summary>'+IC.info+'Jó tudni</summary>'+fn.map(function(n){return "<p>"+NOTE[n]+"</p>"}).join(""));var bt=b.querySelector(".pf-btns");b.insertBefore(d,bt||null)}
$$(".pf-lnk.ca-doc",b).forEach(function(x){x.insertAdjacentHTML("afterbegin",IC.doc)});
if(last){c.classList.add("ca-last");var g=el("a","ca-go","Bérelhető autóink →");g.href="/autoink/#berelheto";b.appendChild(g)}
tr.appendChild(c);return c});
vw.appendChild(tr);stc.appendChild(top);stc.appendChild(vw);hz.appendChild(stc);var hint=el("p","ca-hint","Görgess tovább — a lépések oldalra haladnak");stc.appendChild(hint);
var ps=$(".pf-steps",root);ps.parentNode.insertBefore(hz,ps);ps.remove();
var bts=$$(".ca-ph button",top),ems=bts.map(function(b){return b.querySelector("em")}),cnt=$(".ca-cnt b",top),pv=$(".pv",top),nx=$(".nx",top);
var RM=matchMedia("(prefers-reduced-motion: reduce)").matches,pin=false,dist=0,act=-1,cur=0;
function mode(){var p=!RM&&innerWidth>=900&&innerHeight>=600;if(p!==pin){pin=p;hz.classList.toggle("ca-pin",p);hint.textContent=p?"Görgess tovább — a lépések oldalra haladnak":"Lapozz oldalra a lépésekért"}
if(pin){tr.style.transform="";dist=Math.max(0,tr.scrollWidth-innerWidth);hz.style.height=(dist+innerHeight)+"px"}else{hz.style.height="";tr.style.transform=""}upd()}
function prog(){if(pin){var r=hz.getBoundingClientRect();return dist?Math.max(0,Math.min(1,-r.top/dist)):0}var m=vw.scrollWidth-vw.clientWidth;return m>0?vw.scrollLeft/m:0}
function setAct(i){if(i===act)return;act=i;cards.forEach(function(c,k){c.classList.toggle("on",k===i)});cnt.textContent=(i<9?"0":"")+(i+1);pv.disabled=i<=0;nx.disabled=i>=cards.length-1;bts.forEach(function(b,k){b.classList.toggle("on",i>=PH[k][1]&&i<PH[k][2])})}
function upd(){var p=prog();cur=p;if(pin)tr.style.transform="translate3d("+(-p*dist).toFixed(1)+"px,0,0)";
var cx=innerWidth/2,best=1e9,bi=0;cards.forEach(function(c,k){var b=c.getBoundingClientRect(),d=Math.abs(b.left+b.width/2-cx);if(d<best){best=d;bi=k}});setAct(bi);
var f=p*(cards.length-1);PH.forEach(function(ph,k){var a=ph[1],z=ph[2]-1,v=f<=a-1?0:f>=z?1:(f-(a-1))/(z-(a-1));if(k===0)v=Math.max(0,Math.min(1,(f+1)/(z+1)));ems[k].style.transform="scaleX("+Math.max(0,Math.min(1,v)).toFixed(3)+")"})}
function go(i){i=Math.max(0,Math.min(cards.length-1,i));var c=cards[i];if(pin){var off=c.offsetLeft+c.offsetWidth/2-innerWidth/2;var p=Math.max(0,Math.min(1,off/dist));scrollTo({top:hz.getBoundingClientRect().top+scrollY+p*dist,behavior:"smooth"})}else vw.scrollTo({left:c.offsetLeft-(vw.clientWidth-c.offsetWidth)/2,behavior:"smooth"})}
pv.addEventListener("click",function(){go(act-1)});nx.addEventListener("click",function(){go(act+1)});
bts.forEach(function(b,k){b.addEventListener("click",function(){go(PH[k][1])})});
var rq=0;function q(){if(!rq){rq=1;requestAnimationFrame(function(){rq=0;upd()})}}
addEventListener("scroll",q,{passive:true});vw.addEventListener("scroll",q,{passive:true});addEventListener("resize",function(){mode()});
$$("details",tr).forEach(function(d){d.addEventListener("toggle",function(){if(pin)mode()})});
mode();setTimeout(mode,600);addEventListener("load",mode);
// --- 6 hónap
var bt=$(".bl-term",root);if(bt){var card=$(".bl-term-card",bt);var six=el("div","ca-six");six.appendChild(el("div","ca-six-n",'6<small>hónap minimum</small>'));six.appendChild(card);
var tl=el("div","ca-tl",'<span class="ca-tl-a s">Átadás</span><span class="ca-tl-a e">Lejár a minimum</span><div class="ca-tl-r"><div class="ca-tl-tr"><i class="ca-tl-f"></i>'+[1,2,3,4,5].map(function(m){return '<i class="ca-tl-t" style="left:'+(m/6*100).toFixed(3)+'%"></i>'}).join("")+'<i class="ca-tl-dot"></i></div><div class="ca-tl-x"></div></div><div class="ca-tl-l">'+[1,2,3,4,5,6].map(function(m){return '<span>'+m+'. hó</span>'}).join("")+'<span class="x">utána havonta hosszabbodik</span></div>');card.appendChild(tl);
six.appendChild(el("div","ca-six-f",'<div>'+IC.gauge+'<span><b>2 000–4 000 km / hó</b>futáskeret, autótól függően'+(NOTE[4]?'<details class="ca-jt"><summary>'+IC.info+'Jó tudni</summary><p>'+NOTE[4]+'</p></details>':'')+'</span></div><div>'+IC.bill+'<span><b>Számla minden hónap 1-jén</b>a havi díjat előre kell megfizetni</span></div><div>'+IC.door+'<span><b>Utána 30 napos felmondás</b>a bérleti hónap végére mondható fel</span></div>'));
bt.innerHTML="";bt.appendChild(six);
var tf=tl.querySelector(".ca-tl-f"),td=tl.querySelector(".ca-tl-dot"),tt=[].slice.call(tl.querySelectorAll(".ca-tl-t")),tls=[].slice.call(tl.querySelectorAll(".ca-tl-l span")),tx=tl.querySelector(".ca-tl-x"),te=tl.querySelector(".ca-tl-a.e"),trq=0;
function tlu(){trq=0;var r=tl.getBoundingClientRect(),vh=innerHeight,p=RM?1:Math.max(0,Math.min(1,(vh*.88-r.top)/(vh*.5)));tf.style.transform="scaleX("+p.toFixed(4)+")";td.style.left=(p*100).toFixed(2)+"%";var m=p*6;tt.forEach(function(t,k){t.classList.toggle("on",m>=k+1)});tls.forEach(function(s,k){s.classList.toggle("on",k<6?m>k+.15:p>=.999)});tx.classList.toggle("on",p>=.999);te.classList.toggle("on",p>=.999)}
addEventListener("scroll",function(){if(!trq){trq=1;requestAnimationFrame(tlu)}},{passive:true});addEventListener("resize",tlu);tlu()}
// --- szerződés-kártyák ikonjai
var BI={kaucio:IC.shield,kezdet:IC.cal,tartalom:IC.check,km:IC.gauge,biztositas:IC.umb,visszaadas:IC.back};
$$(".bf-card",root).forEach(function(a){var k=(a.getAttribute("href")||"").split("#")[1];if(BI[k]&&!a.querySelector(".ca-ic"))a.insertAdjacentHTML("afterbegin",'<span class="ca-ic">'+BI[k]+'</span>')});
// --- sötét mód inline-színek takarítása
function cln(){$$(".ca-facts,.ca-facts *,.ca-hz,.ca-hz *,.bl-term,.bl-term *,.bf-box,.bf-box *,div.pf-cta,div.pf-cta *,.pf-faq,.pf-faq *",root).forEach(function(x){if(x.tagName==="IMG"||(x.getAttribute("style")||"").indexOf("url(")>-1)return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

export function apply(h) {
  if (h.indexOf('id="ca-bfo-css"') > -1 || h.indexOf('class="pf-steps"') < 0) return null;
  const log = { dead: 0 };
  h = seo(h, log);
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return { h, log };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-bfo] nincs', FILE); process.exit(0); }
  const r = apply(fs.readFileSync(FILE, 'utf8'));
  if (!r) console.log('[hu-bfo] már alkalmazva');
  else { fs.writeFileSync(FILE, r.h); console.log('[hu-bfo] bérlési folyamat: letisztult nézet', JSON.stringify(r.log)); }
}
