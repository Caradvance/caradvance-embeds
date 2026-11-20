// hu-calc.mjs — Honosítás kalkulátor + Átírás kalkulátor (HU) — a többi oldallal egységes, prémium nézet
// · teljes képernyős, olvasható fejléc, Görgess alul középen (a régi „kompakt” felülírás kikapcsolva)
// · kalkulátor: üvegkártya, lekerekített mezők, pirulás kapcsolók; eredménykártya világosban világos (piros kerettel),
//   sötétben sötét; a végösszeg animáltan pörög; a táblában kiemelve az a sáv, ahová az autód esik
// · táblák kártyában, mobilon finom görgetés-jelzéssel; 4 lépés a főoldali kártyastílusban; „Jó tudni” kártya;
//   rövidebb GYIK (4 + mind); záró kártya világosban világos. Mobilon a tooltipek nem lógnak ki.
// · SEO: márkanév a címben, BreadcrumbList. A számítási logikához nem nyúl. Idempotens, csak a magyar oldalak.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const SITE = 'https://www.caradvance.hu';
const PAGES = {
  'honositas-kalkulator': { title: 'Honosítás kalkulátor 2026 — regisztrációs adó és költség | CarAdvance', name: 'Honosítás kalkulátor' },
  'atiras-kalkulator': { title: 'Átírás kalkulátor 2026 — gépjármű átírási illeték és költség | CarAdvance', name: 'Átírás kalkulátor' },
};

const P = 'html.ca-calc body ';
const D = 'html.ca-calc.ca-dark body ';
const K = P + '#ca-kalk ';
const KD = D + '#ca-kalk ';
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.10)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.12),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.4),inset -1px -1px 1px rgba(255,255,255,.14),inset 0 0 0 1px rgba(255,255,255,.06),0 30px 70px rgba(0,0,0,.5)!important;';
const LN = 'rgba(18,19,23,.08)';
const RED = '#E2001A';

const CSS = '<style id="ca-calc-css">'
  // ---- fejléc: teljes képernyő + Görgess
  + P + 'main>section.hero.hero-calc{min-height:100vh!important;min-height:100svh!important}'
  + P + 'main>section.hero.hero-calc .scrolldown{display:flex!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase;cursor:pointer}'
  + D + 'main>section.hero.hero-calc .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'main>section.hero.hero-calc .scrolldown svg{animation:caCBob 1.8s ease-in-out infinite}'
  + '@keyframes caCBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'main>section.hero.hero-calc .scrolldown{display:none!important}}'
  + D + 'main>section.hero.hero-calc{background:transparent!important;background-image:none!important}'
  + P + 'main>section.hero.hero-calc video{filter:brightness(.5) saturate(1.05)}'
  + P + 'main>section.hero.hero-calc .scrim{background:radial-gradient(80% 70% at 50% 45%,rgba(8,8,10,.55),rgba(8,8,10,.25) 70%,rgba(8,8,10,.12))!important}'
  + P + 'main>section.hero.hero-calc :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'main>section.hero.hero-calc h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'main>section.hero.hero-calc .sub{max-width:760px!important;margin-left:auto!important;margin-right:auto!important}'
  // ---- kalkulátor kártya
  + K + '.lk{max-width:1180px!important;border-radius:32px!important;padding:38px!important;' + HL + '}'
  + KD + '.lk{' + HD + 'color:#fff}'
  + K + '.lk-eyebrow{display:inline-flex!important;align-items:center;height:28px;padding:0 12px;border-radius:999px;background:rgba(226,0,26,.08)!important;color:' + RED + '!important;font-size:11.5px!important;font-weight:800!important;letter-spacing:.12em!important}'
  + K + '.lk-title{font-size:clamp(26px,2.8vw,36px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.12!important;margin:12px 0 10px!important}'
  + KD + '.lk-title{color:#fff!important}'
  + K + '.lk-lead{max-width:760px;font-size:15.5px!important;line-height:1.6!important;opacity:.75}'
  + KD + '.lk-lead{color:rgba(255,255,255,.75)!important}'
  + K + '.lk-grid{gap:28px!important;margin-top:26px!important;align-items:start}'
  + K + '.lk-lbl,' + K + '.lk-field>label{font-size:13.5px!important;font-weight:800!important}'
  + KD + '.lk-lbl,' + KD + '.lk-field>label{color:#fff!important}'
  + K + '.lk-in{height:52px!important;border-radius:16px!important;border:1px solid ' + LN + '!important;background:rgba(255,255,255,.75)!important;font-size:15.5px!important;font-weight:600!important;box-shadow:none!important;transition:border-color .2s,box-shadow .2s!important}'
  + KD + '.lk-in{background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.12)!important;color:#fff!important}'
  + KD + '.lk-in option{background:#1B1C21;color:#fff}'
  + K + '.lk-in:focus{border-color:' + RED + '!important;box-shadow:0 0 0 4px rgba(226,0,26,.12)!important;outline:none}'
  + K + '.lk-seg{gap:8px!important;background:none!important;padding:0!important;border:0!important}'
  + K + '.lk-segbtn{height:46px!important;border-radius:14px!important;border:1px solid ' + LN + '!important;background:transparent!important;font-weight:700!important;color:inherit!important;transition:all .2s!important}'
  + KD + '.lk-segbtn{border-color:rgba(255,255,255,.14)!important;color:#fff!important}'
  + K + '.lk-segbtn[aria-pressed="true"]{background:#121317!important;border-color:#121317!important;color:#fff!important;box-shadow:0 8px 18px rgba(18,19,23,.18)!important}'
  + KD + '.lk-segbtn[aria-pressed="true"]{background:#fff!important;border-color:#fff!important;color:#121317!important}'
  + K + '.lk-gy2 .lk-seg-unit .lk-segbtn{height:52px!important;min-width:56px}'
  + K + '.lk-hint{font-size:12.5px!important;opacity:.6}'
  + K + '.lk-i{background:rgba(18,19,23,.08)!important;color:inherit!important}'
  + KD + '.lk-i{background:rgba(255,255,255,.14)!important;color:#fff!important}'
  + K + '.lk-tiptext{border-radius:14px!important}'
  + K + '.lk-check{display:flex!important;gap:12px;align-items:flex-start;padding:14px 16px!important;border-radius:16px!important;border:1px solid ' + LN + '!important;background:rgba(255,255,255,.5)!important;cursor:pointer}'
  + KD + '.lk-check{background:rgba(255,255,255,.04)!important;border-color:rgba(255,255,255,.12)!important;color:#fff!important}'
  + K + '.lk-check input{accent-color:' + RED + ';width:18px;height:18px;margin-top:2px;flex:none}'
  // eredménykártya
  + K + '.lk-result{position:sticky;top:calc(var(--navh,80px) + 20px);border-radius:28px!important;padding:28px 26px!important;color:#121317!important;background:radial-gradient(70% 60% at 100% 0%,rgba(226,0,26,.12),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.8),rgba(255,255,255,.5)),rgba(255,255,255,.65)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.06),0 30px 70px rgba(226,0,26,.12)!important}'
  + KD + '.lk-result{color:#fff!important;background:radial-gradient(70% 60% at 100% 0%,rgba(226,0,26,.38),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(0,0,0,.4)!important}'
  + K + '.lk-monthly{text-align:left!important;padding:0 0 18px!important;border-bottom:1px solid ' + LN + '!important;background:none!important}'
  + KD + '.lk-monthly{border-bottom-color:rgba(255,255,255,.1)!important}'
  + K + '.lk-mlabel{display:block;font-size:12px!important;font-weight:800!important;letter-spacing:.12em;text-transform:uppercase;color:' + RED + '!important;opacity:1!important}'
  + KD + '.lk-mlabel{color:#FF5468!important}'
  + K + '.lk-mval{margin:10px 0 6px!important;justify-content:flex-start!important}'
  + K + '.lk-mval .lk-mnum{position:absolute!important;opacity:0!important;pointer-events:none;width:1px;overflow:hidden}'
  + K + '.ca-mn{font-size:clamp(40px,4.4vw,56px);font-weight:900;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;color:inherit}'
  + K + '.lk-badge{background:rgba(22,163,74,.12)!important;color:#15803D!important;border-radius:999px!important;font-weight:800!important}'
  + KD + '.lk-badge{background:rgba(34,197,94,.16)!important;color:#4ADE80!important}'
  + K + '.lk-rows{margin-top:6px!important}'
  + K + '.lk-row{padding:11px 0!important;border-top:1px solid ' + LN + '!important;border-bottom:0!important;font-size:14.5px!important;color:inherit!important}'
  + KD + '.lk-row{border-top-color:rgba(255,255,255,.08)!important}'
  + K + '.lk-row:first-child{border-top:0!important}'
  + K + '.lk-row>span{opacity:.68;color:inherit!important}'
  + K + '.lk-row>b{color:inherit!important;font-variant-numeric:tabular-nums}'
  + K + '.lk-row.lk-total{margin-top:8px!important;padding:16px 18px!important;border-radius:16px!important;border:0!important;background:rgba(226,0,26,.07)!important}'
  + KD + '.lk-row.lk-total{background:rgba(226,0,26,.16)!important}'
  + K + '.lk-row.lk-total>span{opacity:1;font-weight:800}'
  + K + '.lk-row.lk-total>b{font-size:20px!important;font-weight:900!important;color:' + RED + '!important}'
  + KD + '.lk-row.lk-total>b{color:#FF5468!important}'
  + K + '.lk-cta{display:flex!important;align-items:center;justify-content:center;height:54px!important;border-radius:999px!important;background:' + RED + '!important;color:#fff!important;font-weight:800!important;text-decoration:none!important;box-shadow:0 14px 30px rgba(226,0,26,.36)!important;margin-top:18px!important;border:0!important}'
  + K + '.lk-disc{font-size:12.5px!important;line-height:1.5!important;opacity:.6;color:inherit!important;margin-top:14px!important}'
  + K + '.lk-disc b{color:inherit!important}'
  + '@media(max-width:900px){' + K + '.lk-result{position:relative;top:auto}}'
  + '@media(max-width:560px){' + K + '.lk{padding:22px 16px!important;border-radius:26px!important}' + K + '.lk-result{padding:22px 18px!important;border-radius:22px!important}}'
  + '@media(max-width:640px){body .lk-field label{position:relative!important}body .lk-field .lk-tip{position:static!important}body .lk-field .lk-tiptext{left:0!important;right:0!important;top:calc(1.5em + 8px)!important;width:auto!important;max-width:none!important}body .lk-field .lk-tiptext::before{display:none!important}}'
  // ---- táblák
  + K + 'section.sec>h2,' + K + '.ca-sectitle,' + K + '.ca-jt h2{font-size:clamp(26px,3vw,38px)!important;font-weight:800!important;letter-spacing:-.03em!important;line-height:1.12!important}'
  + KD + 'section.sec>h2,' + KD + '.ca-sectitle,' + KD + '.ca-jt h2{color:#fff!important}'
  + K + 'section.sec .lede{font-size:15.5px!important;line-height:1.6!important;opacity:.72}'
  + KD + 'section.sec .lede{color:rgba(255,255,255,.75)!important}'
  + K + '.scroll{position:relative;border-radius:24px!important;overflow:auto!important;padding:6px!important;' + HL + '}'
  + KD + '.scroll{' + HD + '}'
  + K + '.scroll table{border-collapse:separate!important;border-spacing:0!important;width:100%;background:none!important}'
  + K + '.scroll thead th{background:none!important;color:inherit!important;opacity:.55;font-size:11.5px!important;font-weight:800!important;letter-spacing:.06em;text-transform:uppercase;padding:14px 14px 10px!important;border:0!important;border-bottom:1px solid ' + LN + '!important;white-space:normal;vertical-align:bottom}'
  + KD + '.scroll thead th{color:#fff!important;border-bottom-color:rgba(255,255,255,.1)!important}'
  + K + '.scroll tbody td{padding:12px 14px!important;border:0!important;border-bottom:1px solid ' + LN + '!important;background:none!important;font-size:14.5px!important;color:inherit!important;font-variant-numeric:tabular-nums;transition:background .3s}'
  + KD + '.scroll tbody td{border-bottom-color:rgba(255,255,255,.06)!important;color:#fff!important}'
  + K + '.scroll tbody tr:last-child td{border-bottom:0!important}'
  + K + '.scroll tbody td:first-child{font-weight:700}'
  + K + '.scroll tbody tr:hover td{background:rgba(18,19,23,.03)!important}'
  + KD + '.scroll tbody tr:hover td{background:rgba(255,255,255,.04)!important}'
  + K + '.scroll tbody tr.ca-me td{background:rgba(226,0,26,.08)!important;font-weight:800}'
  + KD + '.scroll tbody tr.ca-me td{background:rgba(226,0,26,.2)!important}'
  + K + '.scroll tbody tr.ca-me td:first-child{color:' + RED + '!important;box-shadow:inset 3px 0 0 ' + RED + '}'
  + KD + '.scroll tbody tr.ca-me td:first-child{color:#FF6B7B!important}'
  + K + '.ca-me-t{display:inline-flex;margin-left:8px;height:20px;padding:0 8px;border-radius:999px;background:' + RED + ';color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;align-items:center;vertical-align:middle}'
  + K + '.ca-scr-h{display:none;font-size:12px;opacity:.5;margin:8px 4px 0;text-align:right}'
  + '@media(max-width:760px){' + K + '.ca-scr-h{display:block}' + K + '.scroll tbody td,' + K + '.scroll thead th{padding:10px 12px!important;font-size:13.5px!important}}'
  // ---- 4 lépés
  + K + '.ca-eyebrow,' + K + '.ca-eyebrow2{display:inline-flex!important;align-items:center;height:28px;padding:0 12px;border-radius:999px;background:rgba(226,0,26,.08)!important;color:' + RED + '!important;font-size:11.5px!important;font-weight:800!important;letter-spacing:.12em!important}'
  + K + '.ca-secintro{opacity:.72}' + KD + '.ca-secintro{color:rgba(255,255,255,.75)!important}'
  + K + '.ca-steps{gap:16px!important;counter-reset:none}'
  + K + '.ca-step{border-radius:26px!important;padding:26px 22px 22px!important;transition:transform .35s cubic-bezier(.2,.8,.2,1);' + HL + '}'
  + KD + '.ca-step{' + HD + 'color:#fff}'
  + K + '.ca-step:hover{transform:translateY(-4px)}'
  + K + '.ca-sn{width:44px!important;height:44px!important;border-radius:14px!important;display:flex!important;align-items:center;justify-content:center;font-size:17px!important;font-weight:900!important;color:#fff!important;background:linear-gradient(180deg,#FF2A40,' + RED + ' 60%,#B80015)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 10px 22px rgba(226,0,26,.28)!important;margin-bottom:16px!important}'
  + K + '.ca-step h3{font-size:18px!important;font-weight:800!important;letter-spacing:-.015em;color:inherit!important}'
  + K + '.ca-step p{font-size:14.5px!important;line-height:1.55!important;opacity:.72;color:inherit!important}'
  // ---- jó tudni
  + K + '.ca-jt{border-radius:30px!important;padding:36px 40px!important;' + HL + '}'
  + KD + '.ca-jt{' + HD + 'color:#fff}'
  + K + '.ca-jt p{font-size:16px!important;line-height:1.7!important;opacity:.82;color:inherit!important}'
  + K + '.ca-jt a{color:' + RED + '!important;font-weight:700}' + KD + '.ca-jt a{color:#FF6B7B!important}'
  + K + '.ca-jt .kw{color:' + RED + '!important;font-weight:700;background:none!important}' + KD + '.ca-jt .kw{color:#FF6B7B!important}'
  + '@media(max-width:560px){' + K + '.ca-jt{padding:24px 18px!important;border-radius:24px!important}}'
  // ---- GYIK
  + K + '.faq{display:flex!important;flex-direction:column;gap:12px}'
  + K + '.faq details{border-radius:20px!important;overflow:hidden;margin:0!important;' + HL + '}'
  + KD + '.faq details{' + HD + '}'
  + K + '.faq summary{padding:20px 22px!important;font-weight:700!important;font-size:16px!important;display:flex!important;align-items:center;justify-content:space-between;gap:14px;color:inherit!important;background:none!important}'
  + KD + '.faq summary{color:#fff!important}'
  + K + '.faq details>p,' + K + '.faq details>div{padding:0 22px 20px!important;margin:0!important;opacity:.78;line-height:1.6;color:inherit!important}'
  + KD + '.faq details>p,' + KD + '.faq details>div{color:rgba(255,255,255,.8)!important}'
  + K + '.faq.ca-cut details.ca-x{display:none!important}'
  + K + '.ca-more{align-self:center;margin-top:4px;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid ' + LN + ';background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer}'
  + KD + '.ca-more{border-color:rgba(255,255,255,.16);color:#fff}'
  + K + '.ca-more svg{width:16px;height:16px;transition:transform .3s}'
  + K + '.faq:not(.ca-cut) .ca-more svg{transform:rotate(180deg)}'
  // ---- záró kártya: világosban világos
  + K + '.cta{position:relative;overflow:hidden;border-radius:30px!important;padding:34px 38px!important;color:#121317!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.12),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.8),rgba(255,255,255,.5)),rgba(255,255,255,.6)!important;border:1.5px solid rgba(226,0,26,.35)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.06),0 30px 70px rgba(226,0,26,.12)!important}'
  + KD + '.cta{color:#fff!important;background:radial-gradient(60% 120% at 100% 0%,rgba(226,0,26,.35),transparent 60%),linear-gradient(160deg,#1A1B20,#0E0F12)!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.3),0 30px 70px rgba(0,0,0,.4)!important}'
  + K + '.cta .t{font-size:clamp(22px,2.4vw,30px)!important;font-weight:800!important;letter-spacing:-.025em;color:inherit!important;margin-bottom:10px}'
  + K + '.cta p{color:inherit!important;opacity:.8;font-size:15.5px!important;line-height:1.6!important}'
  + K + '.cta a{color:' + RED + '!important;font-weight:700}' + KD + '.cta a{color:#FF6B7B!important}'
  + K + '.cta .ca-cb{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}'
  + K + '.cta .ca-cb a{display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 22px;border-radius:999px;font-weight:800;text-decoration:none!important;font-size:15px}'
  + K + '.cta .ca-cb a.r{background:' + RED + ';color:#fff!important;box-shadow:0 12px 26px rgba(226,0,26,.35)}'
  + K + '.cta .ca-cb a.g{border:1px solid ' + LN + ';color:inherit!important}'
  + KD + '.cta .ca-cb a.g{border-color:rgba(255,255,255,.18)}'
  + K + '.cta .ca-cb svg{width:17px;height:17px}'
  + K + '.foot{opacity:.55;font-size:12.5px!important}'
  + KD + '.foot{color:rgba(255,255,255,.6)!important}'
  + '@media(max-width:560px){' + K + '.cta{padding:24px 18px!important;border-radius:24px!important}' + K + '.cta .ca-cb a{flex:1 1 100%;justify-content:center}}'
  + '</style>';

const JS = '<script id="ca-calc-js">' + String.raw`(function(){
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var root=$("#ca-kalk");if(!root||root.__c)return;root.__c=1;var H=document.documentElement;H.classList.add("ca-calc");
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}
var DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
// Görgess
var sd=$("main>section.hero.hero-calc .scrolldown");if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$("#kalkulator");if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-100,behavior:"smooth"})})}
// animált végösszeg (tükör: az eredeti számot a kalkulátor szkriptje írja)
var src=$(".lk-mnum",root);if(src){var mn=el("span","ca-mn","—");src.parentNode.insertBefore(mn,src);var shown=null,raf=0;
function num(t){var d=String(t).replace(/[^\d]/g,"");return d?+d:null}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g," ")+" Ft"}
function upd(){var to=num(src.textContent);if(to===null){mn.textContent=src.textContent;shown=null;return}if(shown===null||matchMedia("(prefers-reduced-motion: reduce)").matches){shown=to;mn.textContent=fmt(to);return}
var from=shown,t0=performance.now(),D=550;shown=to;cancelAnimationFrame(raf);(function f(n){var x=Math.min(1,(n-t0)/D),e=1-Math.pow(1-x,3);mn.textContent=fmt(from+(to-from)*e);if(x<1)raf=requestAnimationFrame(f)})(t0)}
new MutationObserver(upd).observe(src,{childList:true,characterData:true,subtree:true});upd()}
// a táblában kiemelve az a sáv, ahová az autód esik
function norm(s){return String(s||"").replace(/\s+/g," ").replace(/[‒–—]/g,"-").trim().toLowerCase()}
var bands=$$(".lk-rows .lk-row b",root);
function mark(){var vals=bands.map(function(b){return norm(b.textContent)});
$$("section.sec .scroll tbody",root).forEach(function(tb){$$("tr",tb).forEach(function(tr){var c=tr.querySelector("td");if(!c)return;var k=norm(c.textContent.replace(/Te autód/i,""));var hit=k&&k.length>1&&vals.some(function(v){return v===k||v.indexOf(k+" ")===0||v.indexOf(k+" ·")===0});
if(hit!==tr.classList.contains("ca-me")){tr.classList.toggle("ca-me",hit);var t=c.querySelector(".ca-me-t");if(hit&&!t)c.insertAdjacentHTML("beforeend",'<span class="ca-me-t">Te autód</span>');if(!hit&&t)t.remove()}})})}
var mq=0;new MutationObserver(function(){if(!mq){mq=1;requestAnimationFrame(function(){mq=0;mark()})}}).observe($(".lk-rows",root)||root,{childList:true,characterData:true,subtree:true});setTimeout(mark,300);setTimeout(mark,1200);
// mobil: görgetés-jelzés a tábláknál
$$("section.sec .scroll",root).forEach(function(s){if(!s.nextElementSibling||!s.nextElementSibling.classList.contains("ca-scr-h"))s.insertAdjacentHTML("afterend",'<p class="ca-scr-h">Húzd oldalra a teljes táblához →</p>')});
// GYIK: első 4
var fq=$(".faq",root);if(fq){var ds=$$(":scope>details",fq);if(ds.length>5){ds.forEach(function(d,k){if(k>=4)d.classList.add("ca-x")});fq.classList.add("ca-cut");var mo=el("button","ca-more");mo.type="button";var lbl=function(){mo.innerHTML=(fq.classList.contains("ca-cut")?"Mind a "+ds.length+" kérdés":"Kevesebb kérdés")+DN};lbl();mo.addEventListener("click",function(){fq.classList.toggle("ca-cut");lbl()});fq.appendChild(mo)}}
// záró kártya: gombok a sima szöveges elérhetőség helyett
var cta=$(".cta",root);if(cta&&!cta.querySelector(".ca-cb")){var ps=$$("p",cta),last=ps[ps.length-1];if(last&&/233 6060/.test(last.textContent)){last.remove();cta.insertAdjacentHTML("beforeend",'<div class="ca-cb"><a class="r" href="tel:+36302336060"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>Hívj minket</a><a class="g" href="mailto:info@caradvance.hu">info@caradvance.hu</a><a class="g" href="/auto-rendeles/#rendeles">Autót rendelek →</a></div>')}}
cta&&$$("a[style]",cta).forEach(function(a){a.removeAttribute("style")});
// sötét mód inline-színek takarítása
function cln(){$$(".lk,.lk *,section.sec,section.sec *,.ca-proc,.ca-proc *,.ca-jt,.ca-jt *",root).forEach(function(x){if(x.tagName==="IMG")return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}
[150,600,1500,3000].forEach(function(t){setTimeout(cln,t)});
})();</script>`;

function seo(h, slug) {
  const c = PAGES[slug];
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + c.title + '</title>');
  h = h.replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, '$1' + c.title + '$2');
  if (h.indexOf('"BreadcrumbList"') < 0) h = h.replace('</head>', () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Autó rendelés', item: SITE + '/auto-rendeles/' },
    { '@type': 'ListItem', position: 3, name: c.name, item: SITE + '/' + slug + '/' },
  ] }) + '</script></head>');
  return h;
}

export function apply(h, slug) {
  if (!PAGES[slug] || h.indexOf('id="ca-calc-css"') > -1 || h.indexOf('id="ca-kalk"') < 0) return null;
  h = seo(h, slug);
  // a régi „kompakt fejléc, Görgess nélkül” felülírás kikapcsolása
  h = h.replace('<style>.hero.hero-calc{min-height:0!important}.hero.hero-calc .scrolldown{display:none!important}</style>', '');
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  for (const slug of Object.keys(PAGES)) {
    const f = path.join(DIST, slug, 'index.html');
    if (!fs.existsSync(f)) { console.log('[hu-calc] nincs', f); continue; }
    const o = apply(fs.readFileSync(f, 'utf8'), slug);
    if (!o) console.log('[hu-calc] már alkalmazva', slug);
    else { fs.writeFileSync(f, o); console.log('[hu-calc]', slug, ': letisztult nézet'); }
  }
}
