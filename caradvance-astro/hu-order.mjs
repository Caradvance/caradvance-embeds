// hu-order.mjs — Egyedi autó rendelés (HU, /egyedi-auto-rendeles/ márkaválasztó nézet) letisztult megjelenés
// 1 fejléc · 2 nagy márkakártyák kivágott autóval · 3 ikonos előnypanel · 4 folyamat idővonalon
// 5 áfa-számpélda · 6 SEO-szöveg „Bővebben” mögött, GYIK két oszlopban.
// Csak a márkaválasztó (landing) nézetet érinti, a ?brand= konfigurátort nem. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'egyedi-auto-rendeles', 'index.html');

// gondosan ellenőrzött, tiszta kivágások (kerék, lökhárító, árnyék rendben)
const CARS = {
  bmw: { src: '/berles-cut/bmw-x1.webp', model: 'pl. X1, X3, X5, i4', sub: 'M Sport, xDrive, elektromos i-modellek' },
  mini: { src: '/mini-jcw-premium-auto-eladas-cut.webp?v=2', model: 'pl. Cooper, Countryman, JCW', sub: 'Egyedi színek, John Cooper Works' },
  mercedes: { src: '/berles-cut/mercedes-benz-glc.webp', model: 'pl. C, E, GLC, AMG', sub: 'AMG Line, 4MATIC, EQ elektromos' },
  audi: { src: '/berles-cut/audi-q5-sportback.webp', model: 'pl. A6, Q5, Q6 e-tron, RS', sub: 'S line, quattro, e-tron' },
};

const H = 'html.ca-ord ';
const P = 'html.ca-ord body ';
const D = 'html.ca-ord.ca-dark body ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:rgba(255,255,255,.86)!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';

const CSS = '<style id="ca-ord-css">'
  // ---- 1) fejléc
  + P + '.egl-land-hero video.ca-lv{filter:brightness(.55) saturate(1.05)}'
  + P + '.egl-land-brandrow{display:none!important}' + 'html.ca-ord.ca-dark body #eglLand .egl-land-hero.ca-hero{background:transparent!important;background-image:none!important}'
  + P + '.egl-mhero-inner :is(.egl-mhero-h1,.egl-mhero-sub){text-shadow:0 2px 24px rgba(0,0,0,.5),0 1px 3px rgba(0,0,0,.35)}'
  + P + '.egl-mhero-sub{max-width:600px;margin-left:auto!important;margin-right:auto!important}'
  + P + '.ca-ost{display:flex;justify-content:center;margin:18px auto 22px}'
  + P + '.ca-ost span{display:flex;flex-direction:column;align-items:center;padding:0 24px;color:rgba(255,255,255,.78);font-size:12.5px;font-weight:600;text-shadow:0 1px 10px rgba(0,0,0,.4)}'
  + P + '.ca-ost span+span{border-left:1px solid rgba(255,255,255,.28)}'
  + P + '.ca-ost b{color:#fff;font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-bottom:2px}'
  + P + '.egl-mhero-scroll{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:28px!important;transform:translateX(-50%)!important;z-index:3!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important}'
  + D + '.egl-mhero-scroll{color:rgba(255,255,255,.7)!important}'
  + '@media(max-width:640px){' + P + '.ca-ost span{padding:0 11px;font-size:11px}' + P + '.ca-ost b{font-size:18px}' + P + '.egl-mhero-scroll{display:none!important}}'
  // ---- 2) márkakártyák
  + P + '#eglBrands.egl-brands{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:18px!important;max-width:1180px;margin:10px auto 0!important;padding:0 20px!important;box-sizing:border-box}'
  + P + '#eglBrands .egl-brand-tile{position:relative;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;gap:0!important;min-height:0!important;height:auto!important;padding:18px 20px 20px!important;border-radius:24px!important;text-align:left!important;overflow:hidden;text-decoration:none!important;color:inherit!important;' + CARD + 'transition:transform .25s cubic-bezier(.3,.7,.2,1),box-shadow .25s!important}'
  + D + '#eglBrands .egl-brand-tile{' + CARDD + '}'
  + P + '#eglBrands .egl-brand-tile:hover{transform:translateY(-4px);box-shadow:0 20px 44px rgba(18,19,23,.14)!important}'
  + D + '#eglBrands .egl-brand-tile:hover{box-shadow:0 20px 44px rgba(0,0,0,.5)!important;border-color:rgba(255,255,255,.16)!important}'
  + P + '#eglBrands .egl-brand-tile>img:not(.ca-ocar){width:auto!important;height:34px!important;max-width:110px!important;object-fit:contain!important;margin:0 0 4px!important;filter:none!important}'
  + P + '#eglBrands .egl-brand-tile>img[alt="MINI"]{height:30px!important;margin:2px 0 6px!important}'
  + D + '#eglBrands .egl-brand-tile>img[alt="Mercedes"],' + D + '#eglBrands .egl-brand-tile>img[alt="Audi"]{filter:brightness(0) invert(1)!important;opacity:.9}'
  + P + '.ca-ocw{align-self:stretch;height:150px;display:flex;align-items:flex-end;justify-content:center;margin:6px -6px 10px;position:relative}'
  + P + '.ca-ocw::after{content:"";position:absolute;left:12%;right:12%;bottom:2px;height:16px;border-radius:50%;background:radial-gradient(closest-side,rgba(18,19,23,.16),transparent);z-index:0}'
  + D + '.ca-ocw::after{background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent)}'
  + P + '.ca-ocar{position:relative;z-index:1;max-width:100%!important;max-height:100%!important;width:auto!important;height:auto!important;object-fit:contain!important;transition:transform .45s cubic-bezier(.3,.7,.2,1)}'
  + P + '#eglBrands .egl-brand-tile:hover .ca-ocar{transform:translateX(4px) scale(1.03)}'
  + P + '#eglBrands .egl-brand-name{font-size:22px!important;font-weight:800!important;letter-spacing:-.02em;color:inherit!important;margin:0!important}'
  + P + '.ca-omod{font-size:13px;opacity:.6;margin:3px 0 14px}'
  + P + '#eglBrands .egl-brand-cta{display:inline-flex!important;align-items:center;justify-content:center;align-self:stretch;height:44px;margin-top:auto!important;border-radius:13px;background:#121317!important;color:#fff!important;font-size:14px!important;font-weight:700!important;transition:background .2s}'
  + P + '#eglBrands .egl-brand-tile:hover .egl-brand-cta{background:#E2001A!important}'
  + D + '#eglBrands .egl-brand-cta{background:#fff!important;color:#121317!important}' + D + '#eglBrands .egl-brand-tile:hover .egl-brand-cta{background:#E2001A!important;color:#fff!important}'
  + '@media(max-width:1000px){' + P + '#eglBrands.egl-brands{grid-template-columns:repeat(2,minmax(0,1fr))!important}}'
  + '@media(max-width:560px){' + P + '#eglBrands.egl-brands{gap:10px!important;padding:0 14px!important}' + P + '#eglBrands .egl-brand-tile{padding:14px 14px 14px!important;border-radius:20px!important}' + P + '.ca-ocw{height:96px;margin:4px -4px 8px}' + P + '#eglBrands .egl-brand-name{font-size:18px!important}' + P + '.ca-omod{font-size:12px;margin-bottom:10px}' + P + '#eglBrands .egl-brand-cta{height:40px;font-size:13px!important}' + P + '#eglBrands .egl-brand-tile>img:not(.ca-ocar){height:26px!important}}'
  // ---- közös szakasz
  + P + '.ca-osec{max-width:1180px;margin:64px auto 0;padding:0 20px;box-sizing:border-box}'
  + P + '.ca-oeye{display:block;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#E2001A;margin:0 0 8px;text-align:center}'
  + P + '.ca-oh{font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-.03em;margin:0 0 26px;text-align:center}'
  + '@media(max-width:640px){' + P + '.ca-osec{margin-top:48px;padding:0 14px}' + P + '.ca-oh{font-size:26px}}'
  // ---- 3) előnyök
  + P + '.ca-oben{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-radius:24px;overflow:hidden;' + CARD + '}'
  + D + '.ca-oben{' + CARDD + '}'
  + P + '.ca-oben>div{padding:26px 22px;text-align:center;border-right:1px solid ' + LN + ';border-bottom:1px solid ' + LN + ';transition:background .25s}'
  + D + '.ca-oben>div{border-color:rgba(255,255,255,.07)}'
  + P + '.ca-oben>div:nth-child(3n){border-right:0}' + P + '.ca-oben>div:nth-child(n+4){border-bottom:0}'
  + P + '.ca-oben>div:hover{background:rgba(255,255,255,.7)}' + D + '.ca-oben>div:hover{background:rgba(255,255,255,.03)}'
  + P + '.ca-oben i{width:48px;height:48px;margin:0 auto 14px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.08);color:#E2001A;transition:all .25s}'
  + D + '.ca-oben i{background:rgba(226,0,26,.14);box-shadow:0 0 26px rgba(226,0,26,.28)}'
  + P + '.ca-oben>div:hover i{background:#E2001A;color:#fff;transform:translateY(-2px)}'
  + P + '.ca-oben svg{width:23px;height:23px}'
  + P + '.ca-oben b{display:block;font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}'
  + P + '.ca-oben span{display:block;font-size:13.5px;opacity:.62;line-height:1.45}'
  + '@media(max-width:760px){' + P + '.ca-oben{grid-template-columns:1fr 1fr}' + P + '.ca-oben>div{border-right:1px solid ' + LN + '!important;border-bottom:1px solid ' + LN + '!important;padding:18px 12px}' + P + '.ca-oben>div:nth-child(2n){border-right:0!important}' + P + '.ca-oben>div:nth-child(n+5){border-bottom:0!important}' + D + '.ca-oben>div{border-color:rgba(255,255,255,.07)!important}' + P + '.ca-oben b{font-size:17px}' + P + '.ca-oben span{font-size:12px}' + P + '.ca-oben i{width:40px;height:40px;margin-bottom:10px}}'
  // ---- 4) folyamat
  + P + '.ca-ostp{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px;position:relative}'
  + P + '.ca-ostp::before{content:"";position:absolute;left:10%;right:10%;top:24px;height:2px;background:linear-gradient(90deg,rgba(226,0,26,0),rgba(226,0,26,.55) 12%,rgba(226,0,26,.55) 88%,rgba(226,0,26,0))}'
  + P + '.ca-ostp>div{position:relative;text-align:center;padding:0 6px}'
  + P + '.ca-ostp em{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;background:#E2001A;color:#fff;font-style:normal;font-size:18px;font-weight:800;box-shadow:0 0 0 7px #F5F5F7,0 10px 22px rgba(226,0,26,.3)}'
  + D + '.ca-ostp em{box-shadow:0 0 0 7px #121318,0 0 26px rgba(226,0,26,.45)}'
  + P + '.ca-ostp b{display:block;font-size:16.5px;font-weight:800;margin-bottom:6px;letter-spacing:-.01em}'
  + P + '.ca-ostp span{display:block;font-size:13.5px;opacity:.65;line-height:1.5}'
  + '@media(max-width:860px){' + P + '.ca-ostp{display:flex;flex-direction:column;gap:0;padding-left:4px}' + P + '.ca-ostp::before{left:27px;right:auto;width:2px;height:auto;top:20px;bottom:40px;background:rgba(226,0,26,.45)}'
  + P + '.ca-ostp>div{display:grid;grid-template-columns:48px 1fr;column-gap:16px;text-align:left;padding:0 0 22px}' + P + '.ca-ostp em{grid-row:1/3;margin:0}' + P + '.ca-ostp b{margin-top:12px}}'
  // ---- 5) áfa-számpélda
  + P + '.ca-osav{display:grid;grid-template-columns:1.1fr 1fr;gap:0;border-radius:26px;overflow:hidden;background:radial-gradient(70% 120% at 100% 0%,rgba(226,0,26,.38),transparent 60%),linear-gradient(135deg,#17181d,#0e0f12);color:#fff;box-shadow:0 20px 50px rgba(18,19,23,.18)}'
  + P + '.ca-osav .l{padding:36px 38px}'
  + P + '.ca-osav .l .ca-oeye{text-align:left}'
  + P + '.ca-osav h3{font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-.025em;margin:0 0 12px;color:#fff}'
  + P + '.ca-osav p{font-size:14.5px;line-height:1.6;color:rgba(255,255,255,.72);margin:0 0 20px}'
  + P + '.ca-osav .bt{display:flex;gap:10px;flex-wrap:wrap}'
  + P + '.ca-osav .bt a{display:inline-flex;align-items:center;height:46px;padding:0 20px;border-radius:999px;font-weight:700;font-size:14.5px;text-decoration:none}'
  + P + '.ca-osav .bt a.r{background:#E2001A;color:#fff;box-shadow:0 10px 24px rgba(226,0,26,.35)}'
  + P + '.ca-osav .bt a.w{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.16)}'
  + P + '.ca-osav .r2{padding:30px 34px;background:rgba(255,255,255,.04);border-left:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;justify-content:center;gap:14px}'
  + P + '.ca-osav .rw{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;color:rgba(255,255,255,.75)}'
  + P + '.ca-osav .rw b{font-size:20px;color:#fff;font-variant-numeric:tabular-nums;white-space:nowrap}'
  + P + '.ca-osav .bar{height:10px;border-radius:10px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:-6px}'
  + P + '.ca-osav .bar i{display:block;height:100%;border-radius:10px;background:rgba(255,255,255,.35)}'
  + P + '.ca-osav .bar.de i{background:#E2001A}'
  + P + '.ca-osav .sv{margin-top:6px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:baseline;justify-content:space-between;gap:12px}'
  + P + '.ca-osav .sv b{font-size:28px;font-weight:900;color:#3ddc8a;letter-spacing:-.02em;white-space:nowrap}'
  + P + '.ca-osav small{font-size:11.5px;color:rgba(255,255,255,.5);line-height:1.45}'
  + '@media(max-width:860px){' + P + '.ca-osav{grid-template-columns:1fr}' + P + '.ca-osav .l{padding:26px 22px}' + P + '.ca-osav .r2{padding:22px;border-left:0;border-top:1px solid rgba(255,255,255,.08)}' + P + '.ca-osav h3{font-size:24px}' + P + '.ca-osav .sv b{font-size:22px}}'
  // ---- 6) SEO + GYIK
  + P + '.egl-seo{max-width:860px!important;margin:64px auto 0!important;padding:0 20px!important;text-align:left}'
  + P + '.egl-seo .ca-more{overflow:hidden;max-height:0;transition:max-height .45s ease}'
  + P + '.egl-seo .ca-more.open{max-height:3000px}'
  + P + '.ca-omb{display:inline-flex;align-items:center;gap:6px;margin:4px 0 0;background:none;border:1px solid rgba(18,19,23,.14);border-radius:999px;padding:9px 18px;font-family:inherit;font-weight:600;font-size:13.5px;line-height:1;color:inherit;cursor:pointer}'
  + D + '.ca-omb{border-color:rgba(255,255,255,.18)}'
  + P + '.ca-omb i{font-style:normal;transition:transform .3s}' + P + '.ca-omb.open i{transform:rotate(180deg)}'
  + P + '.egl-faq2{max-width:1180px!important;margin:48px auto 0!important;padding:0 20px!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;align-items:start}'
  + P + '.egl-faq2>.egl-eyebrow,' + P + '.egl-faq2>h2{grid-column:1/-1;text-align:center}'
  + P + '.egl-faq2 details{margin:0!important;border-radius:16px!important;' + CARD + '}'
  + D + '.egl-faq2 details{' + CARDD + '}'
  + '@media(max-width:860px){' + P + '.egl-faq2{grid-template-columns:1fr}}'
  + '</style>';

const IC = {
  pct: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  vat: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  shield: '<path d="M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
  ft: '<circle cx="12" cy="12" r="9"/><path d="M9.5 8H15M9.5 8v8M9.5 12h4"/>',
};

function js() {
  return '<script id="ca-ord-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var land=$("#eglLand");if(!land||/[?&]brand=/.test(location.search))return;H.classList.add("ca-ord");'
  + 'var C=' + JSON.stringify(CARS) + ',IC=' + JSON.stringify(IC) + ';'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  + 'function ic(k){return \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\'+IC[k]+"</svg>"}'
  // 1) fejléc
  + 'var sb=$(".egl-mhero-sub",land);if(sb&&!sb.__o){sb.__o=1;sb.textContent="Új BMW, MINI, Mercedes vagy Audi pontosan úgy, ahogy megálmodtad — német áron, kulcsrakész behozatallal.";var st=el("div","ca-ost","<span><b>akár −25%</b>a hazai árhoz képest</span><span><b>19% áfa</b>27% helyett</span><span><b>Gyári</b>garancia</span>");sb.parentNode.insertBefore(st,sb.nextSibling)}'
  + 'var eb=$(".egl-mhero-btn.white",land);if(eb){eb.addEventListener("click",function(e){var t=$(".ca-oben");if(t){e.preventDefault();scrollTo({top:t.getBoundingClientRect().top+scrollY-140,behavior:"smooth"})}})}'
  // 2) márkakártyák
  + '$$("#eglBrands .egl-brand-tile").forEach(function(a){if(a.__o)return;a.__o=1;var m=(a.getAttribute("href")||"").match(/brand=([a-z]+)/),k=m&&m[1],c=C[k];if(!c)return;'
  + 'var w=el("div","ca-ocw",\'<img class="ca-ocar" alt="" loading="lazy" decoding="async" src="\'+c.src+\'">\');var nm=$(".egl-brand-name",a);a.insertBefore(w,nm);var md=el("span","ca-omod",c.model);nm.parentNode.insertBefore(md,nm.nextSibling);var ct=$(".egl-brand-cta",a);if(ct){ct.textContent="Konfiguráld →";[ct,a,nm].forEach(function(x){x.setAttribute("data-dm-skip","1");["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)})})}});'
  // 3-5) új szakaszok a márkák után
  + 'var br=$("#eglBrands");if(br&&!$(".ca-oben")){'
  + 'var s1=el("section","ca-osec",\'<span class="ca-oeye">Miért rendelj velünk</span><h2 class="ca-oh">Új autó német áron, gond nélkül</h2><div class="ca-oben">\'+[["pct","akár −25%","Kedvezőbb ár, mint a hazai márkakereskedésben."],["vat","19% áfa","Magánszemélyként német áfával vásárolsz."],["shield","Gyári garancia","Teljes gyártói garancia, mintha itthon vennéd."],["eye","Helyszíni bevizsgálás","Átvétel előtt mi magunk ellenőrizzük."],["key","Kulcsrakész","Szállítás, honosítás, forgalomba helyezés."],["ft","Fix forintár","Előre kiszámítható, átlátható költségek."]].map(function(x){return "<div><i>"+ic(x[0])+"</i><b>"+x[1]+"</b><span>"+x[2]+"</span></div>"}).join("")+"</div>");'
  + 'var s2=el("section","ca-osec",\'<span class="ca-oeye">Így működik</span><h2 class="ca-oh">Öt lépés a megálmodott autóig</h2><div class="ca-ostp">\'+[["Konfigurálod","Válaszd ki a márkát és állítsd össze az autót."],["Elküldöd","A kész specifikációt egy kattintással elküldöd."],["Ajánlatot adunk","Forintban fix, minden költséget tartalmazó ár."],["Megrendeljük","Lefoglaljuk vagy legyártatjuk Németországban."],["Hazahozzuk","Honosítva, forgalomba helyezve adjuk át."]].map(function(x,i){return "<div><em>"+(i+1)+"</em><b>"+x[0]+"</b><span>"+x[1]+"</span></div>"}).join("")+"</div>");'
  + 'var s3=el("section","ca-osec",\'<div class="ca-osav"><div class="l"><span class="ca-oeye">Számpélda</span><h3>Mennyit spórolhatsz csak az áfán?</h3><p>Magánszemélyként a München melletti Caradvance GmbH-tól 19%-os német áfával vásárolhatsz a hazai 27% helyett. Azonos nettó árnál ez önmagában 8 százalékpont különbség.</p><div class="bt"><a class="r" href="#eglBrands">Válassz márkát</a><a class="w" href="/finanszirozas-lizing/">Finanszírozás – lízing</a></div></div><div class="r2"><div class="rw"><span>Hazai vásárlás, 27% áfa</span><b>38 100 000 Ft</b></div><div class="bar"><i style="width:100%"></i></div><div class="rw"><span>Német vásárlás, 19% áfa</span><b>35 700 000 Ft</b></div><div class="bar de"><i style="width:93.7%"></i></div><div class="sv"><span>Különbség csak az áfán</span><b>2 400 000 Ft</b></div><small>Számpélda egy 30 000 000 Ft nettó árú autóval. A tényleges ár a modelltől, a felszereltségtől és a piaci ajánlatoktól függ — pontos ajánlatot a konfiguráció alapján adunk.</small></div></div>\');'
  + 's3.querySelector(\'a[href="#eglBrands"]\').addEventListener("click",function(e){e.preventDefault();br.scrollIntoView({behavior:"smooth",block:"center"})});'
  + 'br.parentNode.insertBefore(s1,br.nextSibling);s1.parentNode.insertBefore(s2,s1.nextSibling);s2.parentNode.insertBefore(s3,s2.nextSibling)}'
  // 6) SEO Bővebben
  + 'var seo=$(".egl-seo",land);if(seo&&!seo.__o){seo.__o=1;var ps=$$(":scope>p",seo);if(ps.length>1){var m=el("div","ca-more");ps.slice(1).forEach(function(p){m.appendChild(p)});var b=el("button","ca-omb","Bővebben <i>⌄</i>");b.type="button";seo.appendChild(b);seo.appendChild(m);b.addEventListener("click",function(){var o=m.classList.toggle("open");b.classList.toggle("open",o);b.firstChild.nodeValue=o?"Kevesebb ":"Bővebben "})}}'
  + '})();</script>';
}

export function apply(h) {
  if (h.indexOf('id="ca-ord-css"') > -1) return h;
  if (h.indexOf('id="eglLand"') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => js() + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-order] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-order] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-order] egyedi autó rendelés: letisztult nézet'); }
}
