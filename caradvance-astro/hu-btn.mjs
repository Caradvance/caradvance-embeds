// hu-btn.mjs — prémium hover-animáció MINDEN gombon (magyar főoldal + magyar aloldalak)
// · egérrel ráállva: rugós kiemelkedés, a gomb színéből vett lágy fény alatta, a kurzort követő fényfolt,
//   belépéskor egy finom fényvillanás végigfut a gombon, enyhe „mágneses” követés
// · ikonok: a vezető ikon kicsit „megbillen” (telefon csörög), a záró nyíl előre csúszik
// · kattintáskor rugós „benyomódás”; körvonalas gombok halványan kitöltődnek
// · csak egérrel (hover:hover), a „csökkentett mozgás” beállítást tiszteletben tartja; a meglévő transform-okat nem írja felül
//   (a CSS „translate/scale” külön tulajdonságait használja). Gombot nem kell előre megjelölni: az első ráálláskor ismeri fel.
// Idempotens. Csak magyar (lang="hu") oldalak.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const SKIP = /^(admin\/|belso\/|fiok\/|szerzodes\/|alairas\/|adatok\/|ajanlat\/|icons\/|teszt-mega-menu\/|_ttest)/;

const CSS = '<style id="ca-btn-css">'
  + '@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){'
  + '.cbx-b{transition:translate .45s cubic-bezier(.34,1.56,.64,1),scale .3s cubic-bezier(.34,1.56,.64,1),box-shadow .4s ease,filter .3s ease,background-color .3s ease!important;will-change:translate}'
  + '.cbx-b.cbx-h{translate:var(--cmx,0px) calc(var(--cmy,0px) - 2px)}'
  + '.cbx-b.cbx-h:active{scale:.96;transition-duration:.12s!important}'
  + '.cbx-b.cbx-f.cbx-h{box-shadow:0 14px 30px -10px var(--cagl,rgba(0,0,0,.35)),0 4px 10px -4px var(--cagl,rgba(0,0,0,.2))!important;filter:saturate(1.08) brightness(1.04)}'
  + '.cbx-b.cbx-o.cbx-h{box-shadow:inset 0 0 0 999px var(--caof,rgba(127,127,127,.08)),0 10px 24px -12px rgba(0,0,0,.25)!important}'
  + '.cbx-sh{position:absolute!important;inset:0!important;border-radius:inherit!important;overflow:hidden!important;pointer-events:none!important;z-index:1!important;margin:0!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important;display:block!important}'
  + '.cbx-sh::before{content:"";position:absolute;inset:0;background:radial-gradient(120px circle at var(--chx,50%) var(--chy,50%),rgba(255,255,255,var(--cha,.22)),transparent 70%);opacity:0;transition:opacity .35s ease}'
  + '.cbx-sh::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,var(--chs,.38)),transparent);transform:skewX(-18deg);opacity:0}'
  + '.cbx-b.cbx-o>.cbx-sh{mix-blend-mode:soft-light}' + '.cbx-b.cbx-o>.cbx-sh::before{--cha:.6}' + '.cbx-h>.cbx-sh::before{opacity:1}'
  + '.cbx-h>.cbx-sh::after{animation:caShine .85s cubic-bezier(.4,0,.2,1)}'
  + '@keyframes caShine{0%{left:-60%;opacity:1}100%{left:130%;opacity:1}}'
  + '.cbx-b .cbx-li{transform-origin:50% 60%}'
  + '.cbx-h .cbx-li{animation:caWig .6s cubic-bezier(.36,.07,.19,.97)}'
  + '.cbx-h .cbx-li.cbx-ph{animation:caRing .7s ease}'
  + '@keyframes caWig{0%,100%{transform:none}30%{transform:rotate(-12deg) scale(1.12)}60%{transform:rotate(8deg) scale(1.08)}80%{transform:rotate(-3deg)}}'
  + '@keyframes caRing{0%,100%{transform:none}15%,45%{transform:rotate(-14deg)}30%,60%{transform:rotate(14deg)}75%{transform:rotate(-6deg)}}'
  + '.cbx-b .cbx-tr{display:inline-block;transition:transform .45s cubic-bezier(.34,1.56,.64,1)}'
  + '.cbx-h .cbx-tr{transform:translateX(4px)}'
  + '}'
  + '</style>';

const JS = String.raw`<script id="ca-btn-js">(function(){
if(!window.matchMedia||!matchMedia("(hover:hover) and (pointer:fine)").matches||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
var SEL="a,button,[role=button],input[type=submit],input[type=button],label.btn";
function rgba(c){var m=c&&c.match(/rgba?\(([^)]+)\)/);if(!m)return null;var p=m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
function lum(o){return(.299*o.r+.587*o.g+.114*o.b)/255}
function kind(el){
if(el.__cab!==undefined)return el.__cab;var k=0;
try{if(el.disabled||el.closest("details>summary,nav [role=menu],.cbx-sh"))return el.__cab=0;
var r=el.getBoundingClientRect(),cs=getComputedStyle(el);
if(r.height<24||r.height>84||r.width<24||r.width>520||cs.display==="inline"&&!/inline-(flex|block|grid)/.test(cs.display))return el.__cab=0;
var im=el.querySelector("img,picture,video");if(im&&im.getBoundingClientRect().height>40)return el.__cab=0;
var bg=rgba(cs.backgroundColor),gi=cs.backgroundImage,grad=gi&&gi!=="none"&&gi.indexOf("url(")<0&&/gradient/.test(gi),bw=parseFloat(cs.borderTopWidth)||0,bc=rgba(cs.borderTopColor);
var col=bg&&bg.a>.25?bg:(grad?rgba((gi.match(/rgba?\([^)]+\)/)||[])[0]):null);
if(col&&(bg&&bg.a>.25||grad)&&!(bg&&bg.a<.25&&grad&&col.a<.3))k=1;else if((bw>=1&&bc&&bc.a>.12)||(bg&&bg.a>.02))k=2;
if(!k)return el.__cab=0;
el.classList.add("cbx-b",k===1?"cbx-f":"cbx-o");
if(k===1){var L=lum(col);el.style.setProperty("--cagl","rgba("+Math.round(col.r)+","+Math.round(col.g)+","+Math.round(col.b)+","+(L>.85?.22:.45)+")");if(L>.7){el.style.setProperty("--cha",".55");el.style.setProperty("--chs",".7")}}
else{var tc=rgba(cs.color)||{r:127,g:127,b:127};el.style.setProperty("--caof","rgba("+tc.r+","+tc.g+","+tc.b+",.07)")}
if(cs.position==="static")el.style.position="relative";
var tl=rgba(cs.color);if(el.tagName!=="INPUT"&&(k===1||tl&&lum(tl)>.6)){var s=document.createElement("span");s.className="cbx-sh";s.setAttribute("aria-hidden","true");s.setAttribute("data-dm-skip","1");el.insertBefore(s,el.firstChild)}
// ikonok
var kids=[].filter.call(el.childNodes,function(n){return n.nodeType===1?!n.classList.contains("cbx-sh"):n.nodeType===3&&n.nodeValue.trim()});
var f=kids[0],l=kids[kids.length-1];
function isIc(n){return n&&n.nodeType===1&&(n.tagName==="svg"||n.tagName==="SVG"||n.tagName==="I"||/icon|ico\b|ic\b/i.test(n.getAttribute("class")||""))&&n.getBoundingClientRect().width<34}
if(kids.length>1&&isIc(f)){f.classList.add("cbx-li");if(/tel:/.test(el.getAttribute("href")||"")||/M22 16\.9|phone/i.test(f.outerHTML.slice(0,300)))f.classList.add("cbx-ph")}
if(kids.length>1&&isIc(l)&&l!==f)l.classList.add("cbx-tr");
else if(l&&l.nodeType===3&&/[→›»]\s*$/.test(l.nodeValue)){var t=l.nodeValue.replace(/\s*([→›»])\s*$/,"");var sp=document.createElement("span");sp.className="cbx-tr";sp.textContent=l.nodeValue.match(/([→›»])\s*$/)[1];l.nodeValue=t+" ";el.insertBefore(sp,l.nextSibling)}
else if(l&&l.nodeType===1&&!isIc(l)&&/^[→›»]$/.test((l.textContent||"").trim()))l.classList.add("cbx-tr");
return el.__cab=k}catch(e){return el.__cab=0}}
var cur=null,raf=0;
function leave(){if(!cur)return;cur.classList.remove("cbx-h");cur.style.removeProperty("--cmx");cur.style.removeProperty("--cmy");cur=null}
document.addEventListener("pointerover",function(e){if(e.pointerType&&e.pointerType!=="mouse")return;var el=e.target.closest&&e.target.closest(SEL);if(el===cur)return;leave();if(!el||!kind(el))return;cur=el;
var sh=el.querySelector(":scope>.cbx-sh");if(sh){sh.style.animation="none";void sh.offsetWidth;sh.style.animation=""}
el.classList.remove("cbx-h");void el.offsetWidth;el.classList.add("cbx-h")},{passive:true});
document.addEventListener("pointerout",function(e){if(!cur)return;var to=e.relatedTarget;if(to&&cur.contains(to))return;leave()},{passive:true});
document.addEventListener("pointermove",function(e){if(!cur||raf)return;var x=e.clientX,y=e.clientY;raf=requestAnimationFrame(function(){raf=0;if(!cur)return;var r=cur.getBoundingClientRect();if(!r.width)return;
var px=(x-r.left)/r.width,py=(y-r.top)/r.height;cur.style.setProperty("--chx",(px*100).toFixed(1)+"%");cur.style.setProperty("--chy",(py*100).toFixed(1)+"%");
var m=cur.classList.contains("cbx-f")?5:3;cur.style.setProperty("--cmx",((px-.5)*m).toFixed(2)+"px");cur.style.setProperty("--cmy",((py-.5)*m*.6).toFixed(2)+"px")})},{passive:true});
addEventListener("scroll",function(){if(cur&&!cur.matches(":hover"))leave()},{passive:true});
})();</script>`;

export function apply(h) {
  if (!/<html[^>]*\slang="hu"/.test(h) || h.indexOf('id="ca-btn-css"') > -1) return null;
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return h;
}

function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out); else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('hu-btn.mjs')) {
  try {
    if (!fs.existsSync(DIST)) console.log('[hu-btn] nincs dist — kihagyva');
    else {
      let n = 0;
      for (const f of walk(DIST, [])) {
        const rel = path.relative(DIST, f).split(path.sep).join('/');
        if (SKIP.test(rel)) continue;
        const h = apply(fs.readFileSync(f, 'utf8'));
        if (h) { fs.writeFileSync(f, h); n++; }
      }
      console.log('[hu-btn] gomb-animációk: ' + n + ' oldal');
    }
  } catch (e) { console.log('[hu-btn] hiba:', e.message); }
}
