// hu-fin.mjs — Finanszírozás – lízing (HU, /finanszirozas-lizing/) letisztult megjelenés
// 1 fejléc · 2 kalkulátor feljebb · 3 partnerkártyák (márkaszínű csík marad: Euro Leasing kék, Merkantil zöld)
// 4 konstrukció-összehasonlító táblázat (+ eredeti kártyák „Bővebben”) · 5 ikonos előnyök · 6 dokumentumok váltóval
// 7 4 lépés idővonalon · 8 GYIK 2 oszlop, 6 + összes · 9 egységes sötét mód. A kalkulátor logikájához nem nyúl. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'finanszirozas-lizing', 'index.html');

const P = 'html.ca-fin body section.fl ';
const D = 'html.ca-fin.ca-dark body section.fl ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:rgba(255,255,255,.86)!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';

const CSS = '<style id="ca-fin-css">'
  // ---- egységes kártyák (sötétben se legyen pirosas árnyalat)
  + D + '.ca-gl:not(.lk):not(.lk *){' + CARDD + '}'
  + D + '.ca-gl::after{display:none!important}'
  // ---- 1) fejléc
  + P + 'section.hero video.ca-lv{filter:brightness(.55) saturate(.9)}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.35)}'
  + P + 'section.hero h1 .accent{color:#fff!important;-webkit-text-fill-color:#fff!important;background:none!important;position:relative;display:inline-block}'
  + P + 'section.hero h1 .accent::after{content:"";position:absolute;left:4%;right:4%;bottom:.02em;height:.12em;border-radius:.1em;background:#E2001A}'
  + P + 'section.hero .sub{max-width:620px!important;margin-left:auto!important;margin-right:auto!important}'
  + P + '.ca-fst{display:flex;justify-content:center;margin:16px auto 22px}'
  + P + '.ca-fst span{display:flex;flex-direction:column;align-items:center;padding:0 22px;color:rgba(255,255,255,.78);font-size:12.5px;font-weight:600;text-shadow:0 1px 10px rgba(0,0,0,.4)}'
  + P + '.ca-fst span+span{border-left:1px solid rgba(255,255,255,.28)}'
  + P + '.ca-fst b{color:#fff;font-size:21px;font-weight:800;letter-spacing:-.02em;line-height:1.2;margin-bottom:2px}'
  + P + 'section.hero .scrolldown{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:16px!important;transform:translateX(-50%)!important;margin:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:4px!important;z-index:3!important;color:rgba(18,19,23,.62)!important;background:none!important;border:0!important}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + '@media(max-width:640px){' + P + '.ca-fst span{padding:0 9px;font-size:10.5px}' + P + '.ca-fst b{font-size:15px}' + P + 'section.hero .scrolldown{display:none!important}'
  + P + 'section.hero .cta-row{flex-wrap:nowrap!important;gap:8px!important;justify-content:center}' + P + 'section.hero .cta-row .btn{padding:12px 15px!important;font-size:14px!important;white-space:nowrap}}'
  // ---- 2) kalkulátor
  + P + '#kalkulator{padding-top:36px!important}'
  // ---- 3) partnerek (a márkaszínű csík marad)
  + P + '.fl-pcard{border-radius:22px!important;' + CARD + 'overflow:hidden;position:relative;transition:transform .2s,box-shadow .2s!important}'
  + D + '.fl-pcard{' + CARDD + '}'
  + P + '.fl-pcard::before{width:5px!important;background:var(--pa)!important;display:block!important}'
  + D + '.fl-pcard::before{background:var(--pa)!important;filter:brightness(1.6)}'
  + P + '.fl-pcard:hover{transform:translateY(-3px);box-shadow:0 16px 36px rgba(18,19,23,.12)!important}'
  + P + '.fl-pcard .fl-pd{display:none!important}'
  + P + '.fl-pcard .fl-plist{margin-top:14px!important}'
  + P + '.fl-pcard .fl-plink{color:var(--pa)!important;font-weight:700!important}'
  + D + '.fl-pcard .fl-plink{color:#fff!important}'
  + D + '.fl-pcard .fl-plogo{background:#fff!important;border-radius:12px!important;padding:8px 12px!important;display:inline-flex!important;width:auto!important}'
  // ---- 4) konstrukció-táblázat
  + P + '.ca-ftw{border-radius:24px;overflow:hidden;' + CARD + '}'
  + D + '.ca-ftw{' + CARDD + '}'
  + P + '.ca-ft{width:100%;border-collapse:collapse;font-size:14.5px}'
  + P + '.ca-ft th,' + P + '.ca-ft td{padding:15px 18px;text-align:left;border-bottom:1px solid ' + LN + ';vertical-align:top}'
  + D + '.ca-ft th,' + D + '.ca-ft td{border-bottom-color:rgba(255,255,255,.07)}'
  + P + '.ca-ft tr:last-child td{border-bottom:0}'
  + P + '.ca-ft thead th{font-size:16px;font-weight:800;letter-spacing:-.01em;background:rgba(18,19,23,.03)}'
  + D + '.ca-ft thead th{background:rgba(255,255,255,.04)}'
  + P + '.ca-ft thead th span{display:block;font-size:12px;font-weight:600;opacity:.55;margin-top:3px;letter-spacing:0}'
  + P + '.ca-ft tbody th{font-size:12.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.55;width:20%}'
  + P + '.ca-ft td{font-weight:600;line-height:1.45}'
  + P + '.ca-ft td.y::before{content:"✓ ";color:#0a8a4a}' + D + '.ca-ft td.y::before{color:#3ddc8a}'
  + P + '.ca-ft td.n{opacity:.55}'
  + P + '.ca-fmw{text-align:center;margin:18px 0 0}'
  + P + '.ca-fmb{display:inline-flex;align-items:center;gap:6px;background:none;border:1px solid rgba(18,19,23,.14);border-radius:999px;padding:10px 18px;font-family:inherit;font-weight:600;font-size:13.5px;line-height:1;color:inherit;cursor:pointer}'
  + D + '.ca-fmb{border-color:rgba(255,255,255,.18)}'
  + P + '.ca-fmb i{font-style:normal;transition:transform .3s}' + P + '.ca-fmb.open i{transform:rotate(180deg)}'
  + P + '.fl-types.ca-hid,' + P + '.fl-note.ca-hid{display:none!important}'
  + P + '.fl-types{margin-top:18px!important}'
  + '@media(max-width:760px){' + P + '.ca-ftw{overflow-x:auto}' + P + '.ca-ft{min-width:640px;font-size:13.5px}' + P + '.ca-ft th,' + P + '.ca-ft td{padding:12px 12px}}'
  // ---- 5) előnyök
  + P + '.fl-benefits{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:0!important;border-radius:24px;overflow:hidden;' + CARD + '}'
  + D + '.fl-benefits{' + CARDD + '}'
  + P + '.fl-b{background:none!important;border:0!important;box-shadow:none!important;border-radius:0!important;padding:26px 22px!important;text-align:center!important;display:block!important;border-right:1px solid ' + LN + '!important;border-bottom:1px solid ' + LN + '!important;transition:background .25s}'
  + D + '.fl-b{border-color:rgba(255,255,255,.07)!important}'
  + P + '.fl-b:nth-child(3n){border-right:0!important}' + P + '.fl-b:nth-child(n+4){border-bottom:0!important}'
  + P + '.fl-b .fl-check{display:none!important}'
  + P + '.fl-b i.ca-fi{width:48px;height:48px;margin:0 auto 14px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.08);color:#E2001A;transition:all .25s}'
  + D + '.fl-b i.ca-fi{background:rgba(226,0,26,.14);box-shadow:0 0 26px rgba(226,0,26,.28)}'
  + P + '.fl-b:hover i.ca-fi{background:#E2001A;color:#fff;transform:translateY(-2px)}'
  + P + '.fl-b i.ca-fi svg{width:23px;height:23px}'
  + P + '.fl-b b.ca-fbh{display:block;font-size:19px;font-weight:800;letter-spacing:-.02em;margin-bottom:5px}'
  + D + '.fl-b p,' + D + '.fl-step p,' + D + '.fl-step h3,' + D + '.fl-b b.ca-fbh{color:#fff!important;-webkit-text-fill-color:#fff!important}' + P + '.fl-b p{font-size:13.5px!important;opacity:.62;line-height:1.45!important;margin:0!important}'
  + '@media(max-width:760px){' + P + '.fl-benefits{grid-template-columns:1fr 1fr!important}' + P + '.fl-b{border-right:1px solid ' + LN + '!important;border-bottom:1px solid ' + LN + '!important;padding:18px 12px!important}' + P + '.fl-b:nth-child(2n){border-right:0!important}' + P + '.fl-b:nth-child(n+5){border-bottom:0!important}' + D + '.fl-b{border-color:rgba(255,255,255,.07)!important}' + P + '.fl-b b.ca-fbh{font-size:16px}' + P + '.fl-b p{font-size:12px!important}}'
  // ---- 6) dokumentumok váltóval
  + P + '.ca-fdt{display:flex;justify-content:center;margin:0 auto 18px}'
  + P + '.ca-fdt div{display:inline-flex;padding:4px;border-radius:14px;background:rgba(18,19,23,.06);flex-wrap:wrap;justify-content:center}' + D + '.ca-fdt div{background:rgba(255,255,255,.08)}'
  + P + '.ca-fdt button{height:42px;padding:0 18px;border:0;border-radius:11px;background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14px;line-height:1;cursor:pointer;opacity:.65;transition:all .2s}'
  + P + '.ca-fdt button.on{opacity:1;background:#fff;color:#121317;box-shadow:0 2px 8px rgba(18,19,23,.12)}' + D + '.ca-fdt button.on{background:rgba(255,255,255,.16);color:#fff;box-shadow:none}'
  + P + '.fl-docs.ca-tabs{display:block!important;max-width:620px;margin-left:auto!important;margin-right:auto!important}'
  + P + '.fl-docs.ca-tabs .fl-doc{display:none!important;border-radius:22px!important;padding:24px 26px!important}'
  + P + '.fl-docs.ca-tabs .fl-doc.on{display:block!important}'
  + P + '.fl-docs.ca-tabs .fl-doc h3{display:none!important}'
  + '@media(max-width:560px){' + P + '.ca-fdt button{padding:0 12px;font-size:12.5px;height:38px}}'
  // ---- 7) lépések idővonalon
  + P + '.fl-steps{position:relative;gap:16px!important}'
  + P + '.fl-steps::before{content:"";position:absolute;left:12%;right:12%;top:24px;height:2px;background:linear-gradient(90deg,rgba(226,0,26,0),rgba(226,0,26,.55) 12%,rgba(226,0,26,.55) 88%,rgba(226,0,26,0));z-index:0}'
  + P + '.fl-step{background:none!important;border:0!important;box-shadow:none!important;text-align:center!important;padding:0 6px!important;position:relative;z-index:1}'
  + P + '.fl-step .fl-sn{width:48px!important;height:48px!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;margin:0 auto 16px!important;background:#E2001A!important;color:#fff!important;font-size:18px!important;font-weight:800!important;box-shadow:0 0 0 7px #F5F5F7,0 10px 22px rgba(226,0,26,.3)!important}'
  + D + '.fl-step .fl-sn{box-shadow:0 0 0 7px #121318,0 0 26px rgba(226,0,26,.45)!important}'
  + P + '.fl-step h3{font-size:16.5px!important;margin:0 0 6px!important}'
  + P + '.fl-step p{font-size:13.5px!important;opacity:.66;line-height:1.5!important}'
  + '@media(max-width:860px){' + P + '.fl-steps{display:flex!important;flex-direction:column!important;gap:0!important;padding-left:4px}' + P + '.fl-steps::before{left:27px;right:auto;width:2px;height:auto;top:20px;bottom:40px;background:rgba(226,0,26,.45)}'
  + P + '.fl-step{display:grid!important;grid-template-columns:48px 1fr;column-gap:16px;text-align:left!important;padding:0 0 22px!important}' + P + '.fl-step .fl-sn{grid-row:1/3;margin:0!important}' + P + '.fl-step h3{margin-top:12px!important}}'
  // ---- lezáró sáv
  + P + '.fl-cta{border-radius:26px!important;background:radial-gradient(70% 120% at 100% 0%,rgba(226,0,26,.38),transparent 60%),linear-gradient(135deg,#17181d,#0e0f12)!important;box-shadow:0 20px 50px rgba(18,19,23,.18)!important}'
  + P + '.fl-cta .btn{background:#E2001A!important;color:#fff!important;border:0!important;box-shadow:0 10px 24px rgba(226,0,26,.35)!important}'
  // ---- 8) GYIK
  + P + '.fl-faq{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px!important;align-items:start}'
  + P + '.fl-faq details{margin:0!important;border-radius:16px!important}'
  + P + '.fl-faq:not(.ca-all) details:nth-of-type(n+7){display:none!important}'
  + P + '.fl-faq .ca-fmb{grid-column:1/-1;justify-self:center;margin-top:8px}'
  + '@media(max-width:900px){' + P + '.fl-faq{grid-template-columns:1fr}}'
  + '</style>';

const IC = {
  cost: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  down: '<path d="M12 4v14M6 12l6 6 6-6"/>',
  chart: '<path d="M4 19h16M7 16V9M12 16V5M17 16v-4"/>',
  lower: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  car: '<path d="M5 17h14M6 17l1.5-5h9L18 17M8 12l1.2-3.2A2 2 0 0 1 11 7.5h2a2 2 0 0 1 1.8 1.3L16 12"/><circle cx="8" cy="17.5" r="1.6"/><circle cx="16" cy="17.5" r="1.6"/>',
  shield: '<path d="M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
};

function js() {
  return '<script id="ca-fin-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var R=$("section.fl");if(!R||R.__f)return;R.__f=1;H.classList.add("ca-fin");var IC=' + JSON.stringify(IC) + ';'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  + 'function ic(k){return \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\'+IC[k]+"</svg>"}'
  + 'function mb(lbl,on){var b=el("button","ca-fmb",lbl+" <i>⌄</i>");b.type="button";b.addEventListener("click",function(){var o=on();b.classList.toggle("open",o);b.firstChild.nodeValue=(o?"Kevesebb":lbl)+" "});return b}'
  // 1) fejléc
  + 'var sb=$("section.hero .sub",R);if(sb){sb.textContent="Lízing magánszemélyeknek és cégeknek, új és használt autóra — számold ki a havi részletet egy perc alatt.";sb.parentNode.insertBefore(el("div","ca-fst","<span><b>Forint vagy euró</b>alapú finanszírozás</span><span><b>Nyílt- és zártvégű</b>pénzügyi lízing</span><span><b>Magánszemély</b>és cég is</span>"),sb.nextSibling)}'
  // 2) kalkulátor feljebb
  + 'var k=$("#kalkulator",R),hero=$("section.hero",R);if(k&&hero)hero.parentNode.insertBefore(k,hero.nextSibling);'
  + '$$(\'a[href="#kalkulator"]\',R).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();scrollTo({top:k.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})})});'
  + 'var sd=$("section.hero .scrolldown",R);if(sd)sd.addEventListener("click",function(e){e.preventDefault();e.stopImmediatePropagation();scrollTo({top:k.getBoundingClientRect().top+scrollY-90,behavior:"smooth"})},true);'
  // 4) konstrukció-táblázat
  + 'var ty=$(".fl-types",R);if(ty){var rows=[["Kinek ajánlott","Aki alacsonyabb havi részletet szeretne — cégeknek is ideális","Aki a futamidő végén biztosan tulajdonos akar lenni","Igazolt euró bevételű vállalkozásoknak"],["Havi részlet","y:Alacsonyabb (maradványértékkel)","A teljes finanszírozott összegre szól","y:Kedvezőbb kamatszint"],["A futamidő végén","Te döntöd el: megveszed, harmadik felet jelölsz ki, vagy visszaadod","y:Automatikusan a tiéd az autó","Nyílt- vagy zártvégű szerint"],["Maradványérték","y:Van","n:Nincs","Választható"],["Deviza","Forint vagy euró","Forint vagy euró","Euró"],["Áfa (cégnek)","y:A lízingdíj tőkerészének áfája — jogszabályi feltételekkel — visszaigényelhető","n:—","n:A konstrukciótól függ"]];'
  + 'function cell(v){var c="";if(/^[yn]:/.test(v)){c=v[0];v=v.slice(2)}return \'<td class="\'+c+\'">\'+v+"</td>"}'
  + 'var w=el("div","ca-ftw",\'<table class="ca-ft"><thead><tr><th></th><th>Nyíltvégű lízing<span>maradványértékkel</span></th><th>Zártvégű lízing<span>automatikus tulajdonszerzés</span></th><th>Euró finanszírozás<span>igazolt EUR bevétellel</span></th></tr></thead><tbody>\'+rows.map(function(r){return "<tr><th>"+r[0]+"</th>"+cell(r[1])+cell(r[2])+cell(r[3])+"</tr>"}).join("")+"</tbody></table>");'
  + 'var ww=document.createElement("div");ww.className="wrap ca-ftwrap";ww.appendChild(w);ty.parentNode.insertBefore(ww,ty);var note=$(".fl-note",R);ty.classList.add("ca-hid");if(note)note.classList.add("ca-hid");var mw=el("div","ca-fmw wrap");mw.appendChild(mb("Részletes leírás",function(){var o=ty.classList.toggle("ca-hid");if(note)note.classList.toggle("ca-hid",o);return !o}));ty.parentNode.insertBefore(mw,ty)}'
  // 5) előnyök
  + 'var BT=[["cost","Költségként elszámolható"],["down","Kevesebb kamat"],["chart","Értékcsökkenés"],["lower","Alacsonyabb részlet"],["car","Új és használt autóra"],["shield","Rugalmas biztosítás"]];'
  + '$$(".fl-benefits .fl-b",R).forEach(function(b,i){var t=BT[i];if(!t||b.querySelector(".ca-fi"))return;var p=b.querySelector("p");var h=el("b","ca-fbh",t[1]);var x=el("i","ca-fi",ic(t[0]));b.insertBefore(h,p);b.insertBefore(x,h)});'
  // 6) dokumentumok
  + 'var dc=$(".fl-docs",R);if(dc){var ds=$$(".fl-doc",dc);if(ds.length){dc.classList.add("ca-tabs");var tb=el("div","ca-fdt","<div></div>");ds.forEach(function(d,i){var b=document.createElement("button");b.type="button";b.textContent=(d.querySelector("h3")||{}).textContent||"";b.addEventListener("click",function(){ds.forEach(function(x,j){x.classList.toggle("on",j===i)});$$("button",tb).forEach(function(x,j){x.classList.toggle("on",j===i)})});tb.firstChild.appendChild(b)});dc.parentNode.insertBefore(tb,dc);tb.firstChild.firstChild.click()}}'
  // 8) GYIK
  + 'var fq=$(".fl-faq",R);if(fq){var n=$$("details",fq).length;if(n>6)fq.appendChild(mb("Összes kérdés ("+n+")",function(){return fq.classList.toggle("ca-all")}))}'
  // sötét mód: dark-mode.js inline színei ne írják felül az új elemeket
  + 'setTimeout(function(){$$(".ca-ft,.ca-ft *,.ca-fdt button,.ca-fmb,.fl-b,.fl-step .fl-sn",R).forEach(function(x){["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})},400);'
  + '})();</script>';
}

export function apply(h) {
  if (h.indexOf('id="ca-fin-css"') > -1) return h;
  if (h.indexOf('class="fl-types') < 0 && h.indexOf('fl-types') < 0) return h;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => js() + '</body>');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-fin] nincs', FILE); process.exit(0); }
  const h = fs.readFileSync(FILE, 'utf8');
  const o = apply(h);
  if (o === h) console.log('[hu-fin] már alkalmazva');
  else { fs.writeFileSync(FILE, o); console.log('[hu-fin] finanszírozás – lízing: letisztult nézet'); }
}
