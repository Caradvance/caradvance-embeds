/**
 * i18n-runtime.mjs — a JavaScripttel (kliens-oldalon) kirajzolt szövegek fordítása (2026-10)
 *
 * A tükör-oldalakon a statikus HTML már le van fordítva; a JS által utólag beírt szövegek
 * (autó-kártyák, szűrők, modális ablakok, űrlap-üzenetek, <option>-ök, chat) viszont magyarul
 * jönnének. Ez a lépés nyelvenként egy kis /i18n/rt-<nyelv>.js fájlt ír a dist-be: szótár +
 * MutationObserver, amely a megjelenő magyar szöveget a nyelvre cseréli. Csak a MEGJELENÍTÉST
 * változtatja (a JS-logika, értékek, szűrők nem sérülnek: <option value> megmarad).
 */
import fs from 'node:fs';
import path from 'node:path';

const PAT = {
  en: [[' — új autó Németországból$', '$1 — new car from Germany'], [' bérlés$', '$1 rental'], [' - adatlap$', '$1 – details']],
  de: [[' — új autó Németországból$', '$1 — Neuwagen aus Deutschland'], [' bérlés$', '$1 mieten'], [' - adatlap$', '$1 – Details']],
  fr: [[' — új autó Németországból$', '$1 — voiture neuve d’Allemagne'], [' bérlés$', 'Location $1'], [' - adatlap$', '$1 – fiche']],
  uk: [[' — új autó Németországból$', '$1 — нове авто з Німеччини'], [' bérlés$', 'Оренда $1'], [' - adatlap$', '$1 – деталі']],
  zh: [[' — új autó Németországból$', '$1 — 德国新车'], [' bérlés$', '$1 租赁'], [' - adatlap$', '$1 – 详情']],
};

const EXTRA = {
  'Kézi': { en: 'Manual', de: 'Schaltgetriebe', fr: 'Manuelle', uk: 'Механіка', zh: '手动挡' },
  'Manuális': { en: 'Manual', de: 'Schaltgetriebe', fr: 'Manuelle', uk: 'Механіка', zh: '手动挡' },
  'Hibrid': { en: 'Hybrid', de: 'Hybrid', fr: 'Hybride', uk: 'Гібрид', zh: '混合动力' },
  'Plug-in hibrid': { en: 'Plug-in hybrid', de: 'Plug-in-Hybrid', fr: 'Hybride rechargeable', uk: 'Плагін-гібрид', zh: '插电式混合动力' },
  'Elektromos': { en: 'Electric', de: 'Elektro', fr: 'Électrique', uk: 'Електро', zh: '纯电动' },
};

const UNITS_JS = 'var UNITS={en:{m:"/month",p:"from"},de:{m:"/Monat",p:"ab"},fr:{m:"/mois",p:"dès"},uk:{m:"/міс.",p:"від"},zh:{m:"/月",f:"起"},sk:{m:"/mes.",p:"od"},cs:{m:"/měs.",p:"od"}};';
const ENGINE = `
var U=UNITS[LG]||UNITS.en;function UN(x){x=x.replace(/\\/hó(?![a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ])/g,U.m);var re=/((?:≈\\s*)?\\d[\\d\\s.,\\u00a0\\u202f]*\\s?(?:Ft|€|EUR|km|LE|kW|PS|hp)?(?:\\s?\\([^)]*\\))?(?:\\/\\S+?)?)\\s?-t[óő]l(?![a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ])/g;return U.p?x.replace(re,function(_,a){var m=a.match(/^(≈\\s*)?(.*)$/);return (m[1]||'')+U.p+' '+m[2]}):x.replace(re,function(_,a){return a+U.f})}function NEU(x){return !/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(x)&&!/(^|\\s)(és|vagy|hó|db)(\\s|$)/.test(x)}
var DEEP=0,NUM=/\\d+(?:[.,\\u00a0\\u202f ]\\d+)*/g,SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,CODE:1,PRE:1,NOSCRIPT:1};
function tr(s){var k=s.replace(/\\s+/g,' ').trim();if(!k||!/[A-Za-z\\u00c0-\\u017f]/.test(k))return null;var r=M[k];
if(r==null){var n=[],mk=k.replace(NUM,function(m){n.push(m);return '{'+n.length+'}'});if(n.length&&M[mk]!=null)r=M[mk].replace(/\\{(\\d+)\\}/g,function(_,i){return n[i-1]||''});}
if(r==null&&k.indexOf(' · ')>0){var ch=0,bad=0,ps=k.split(' · ').map(function(p){var x=tr(p);if(x!=null){ch=1;return x.trim()}if(!NEU(p))bad=1;return p});if(ch)r=ps.join(' · ');}
if(r==null&&!DEEP&&/[.!?] +\\S/.test(k)){var ss=k.split(/(?<=[.!?]) +/);if(ss.length>1&&ss.length<12){DEEP=1;var oo=[],i=0,ok=1;while(i<ss.length){var got=null,j;for(j=ss.length;j>i;j--){if(j-i===ss.length)continue;var y=tr(ss.slice(i,j).join(' '));if(y!=null){got=y.trim();break;}}if(got==null){ok=0;break;}oo.push(got);i=j;}DEEP=0;if(ok)r=oo.join(LG==='zh'?'':' ');}}
if(r==null){var nm=k.match(/^(\\d+[.)]\\s*)(.+)$/);if(nm&&!/^\\d/.test(nm[2])){var nx=tr(nm[2]);if(nx!=null)r=nm[1]+nx.trim();}}
if(r==null){var cm=k.match(/^([^:]{2,40}):\\s+(.+)$/);if(cm){var cl=tr(cm[1]);if(cl!=null){var cv=tr(cm[2]);if(cv==null&&NEU(UN(cm[2])))cv=UN(cm[2]);if(cv!=null)r=cl.trim()+(LG==='zh'?'：':': ')+cv.trim();}}}
if(r==null&&/\\/hó|-tól|-től/.test(k)){var uu=UN(k);if(uu!==k&&NEU(uu))r=uu;}
if(r==null){var sm=k.match(/^(.+?)(\\s*[:*]+(?:\\s*[:*]+)*)$/);if(sm){var sx=tr(sm[1]);if(sx!=null)r=sx.trim()+(LG==='zh'?sm[2].replace(':','：'):sm[2]);}}
if(r==null)for(var i=0;i<P.length;i++){var re=new RegExp('^(.*)'+P[i][0]);var m=k.match(re);if(m){var x=tr(m[1]);r=P[i][1].replace('$1',x!=null?x.trim():m[1]);break;}}
if(r==null||r===k)return null;var a=s.match(/^\\s*/)[0],b=s.match(/\\s*$/)[0];return a+r+b;}
function txt(n){if(n.parentNode&&SKIP[n.parentNode.nodeName])return;var o=n.nodeValue,t=tr(o);if(CUR){var cb=t!=null?t:o,cc=CUR(cb);if(cc!==cb)t=cc;}if(t!=null&&t!==o){var p=n.parentNode;if(p&&p.nodeName==='OPTION'&&!p.hasAttribute('value'))p.setAttribute('value',o.trim());n.nodeValue=t;}}
var IL={A:1,B:1,STRONG:1,EM:1,I:1,U:1,SPAN:1,SMALL:1,MARK:1,SUP:1,SUB:1,ABBR:1,BR:1,WBR:1},VD={BR:1,WBR:1,IMG:1};
function ukey(e){var tags=[],out='',ok=1,hasEl=0,hasTx=0;(function w(ns){for(var i=0;i<ns.length&&ok;i++){var c=ns[i];if(c.nodeType===3){out+=c.nodeValue;if(/\\S/.test(c.nodeValue))hasTx=1;}else if(c.nodeType===1){if(!IL[c.nodeName]){ok=0;return;}hasEl=1;var j=tags.length;tags.push(c);if(VD[c.nodeName])out+='<x'+j+'/>';else{out+='<g'+j+'>';w(c.childNodes);out+='</g'+j+'>';}}}})(e.childNodes);
if(!ok||!hasEl||!hasTx)return null;return {k:out.replace(/\\s+/g,' ').trim(),tags:tags};}
function inl(e){if(!GN||e.__ig||!e.firstChild||!e.firstChild.nextSibling)return;var u=ukey(e);if(!u)return;var t=G[u.k],nums=[];
if(t==null){var mk=u.k.split(/(<\\/?[gx]\\d+\\/?>)/).map(function(x,i){return i%2?x:x.replace(NUM,function(m){nums.push(m);return '{'+nums.length+'}'})}).join('');t=G[mk];if(t!=null)t=t.replace(/\\{(\\d+)\\}/g,function(_,i){return nums[i-1]||''});}
if(t==null)return;e.__ig=1;var used={},root=document.createDocumentFragment(),st=[root],re=/<(\\/?)([gx])(\\d+)(\\/?)>|([^<]+)/g,m;
while((m=re.exec(t))){var top=st[st.length-1];if(m[5]!==undefined){top.appendChild(document.createTextNode(m[5]));continue;}var o=u.tags[+m[3]];if(!o)continue;if(m[1]){if(st.length>1)st.pop();continue;}var n=used[m[3]]?o.cloneNode(false):o;used[m[3]]=1;if(n===o&&m[2]==='g')while(n.firstChild)n.removeChild(n.firstChild);top.appendChild(n);if(m[2]==='g'&&!m[4])st.push(n);}
while(e.firstChild)e.removeChild(e.firstChild);e.appendChild(root);}
var AT=['placeholder','title','aria-label','alt'];
function lk(e){if(e.nodeName!=='A'||e.hasAttribute('hreflang')||/langopt/.test(e.className))return;var h=e.getAttribute('href');if(!h)return;var m=h.match(/^(?:https?:\\/\\/(?:www\\.)?caradvance\\.hu)?(\\/[^?#]*)([?#].*)?$/);if(!m)return;var p=m[1];if(/^\\/(en|de|fr|uk|zh|sk|cs|_np|api|i18n)\\//.test(p)||/\\.[a-z0-9]{2,5}$/i.test(p))return;var n=p.slice(-1)==='/'?p:p+'/';if(n==='/berelheto/'){e.setAttribute('href',(SL['/autoink/']||'/'+LG+'/autoink/')+'#berelheto');return;}if(!PG[n])return;if(typeof PG[n]==='string')n=PG[n];var t=SL[n]||('/'+LG+n);if(DOMSTRIP)t=t.replace(DOMSTRIP,'/');e.setAttribute('href',t+(m[2]||''));}
function el(e){inl(e);lk(e);if(U.p&&e.classList&&e.classList.contains('tol')&&!e.__mv&&e.parentNode&&/sub-price|egl-price/.test(e.parentNode.className)&&!/\\d/.test(e.textContent)){e.__mv=1;e.parentNode.insertBefore(e,e.parentNode.firstChild);}for(var i=0;i<AT.length;i++){var v=e.getAttribute&&e.getAttribute(AT[i]);if(v){var t=tr(v);if(t!=null)e.setAttribute(AT[i],t)}}
if(e.nodeName==='INPUT'&&/^(submit|button)$/i.test(e.type)&&e.value){var t2=tr(e.value);if(t2!=null)e.value=t2}}
function walk(root){if(root.nodeType===3)return txt(root);if(root.nodeType!==1||SKIP[root.nodeName])return;el(root);
var w=document.createTreeWalker(root,5,null),n;while((n=w.nextNode())){if(n.nodeType===3)txt(n);else if(SKIP[n.nodeName])continue;else el(n)}}
function run(){if(U.p){var st=document.createElement('style');st.id='ca-i18n-css';st.textContent='.sub-price{flex-wrap:nowrap!important;gap:4px!important;white-space:nowrap;min-width:0}.sub-price b{font-size:18px!important;letter-spacing:-.015em}.sub-price .mo{margin-left:-2px!important;font-size:12px!important}.sub-price .eur{font-size:12.5px!important}.sub-price .tol{font-size:12px!important}.sub-price .sub-info{flex:0 0 auto}.egl-price{flex-wrap:nowrap!important;white-space:nowrap}@media(max-width:380px){.sub-price b{font-size:16px!important}.sub-price .eur,.sub-price .mo,.sub-price .tol{font-size:11.5px!important}}';(document.head||document.body).appendChild(st);}walk(document.body);var t=tr(document.title);if(t)document.title=t;
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==='characterData')txt(m.target);else if(m.type==='attributes')el(m.target);else for(var j=0;j<m.addedNodes.length;j++)walk(m.addedNodes[j])}})
.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:AT.concat(['href'])});
var _a=window.alert;window.alert=function(s){var t=tr(String(s));return _a.call(window,t!=null?t:s)};
var _c=window.confirm;window.confirm=function(s){var t=tr(String(s));return _c.call(window,t!=null?t:s)};}
document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a.langopt,a.m-langopt');if(a&&location.hash){var h=a.getAttribute('href')||'';if(h.indexOf('#')<0)a.setAttribute('href',h+location.hash);}},true);if(document.body)run();else document.addEventListener('DOMContentLoaded',run);`;

/** g-kulcsok (inline elemes egységek), amelyek szövege a kliens-oldali JS-ben szerepel → a runtime is lefordítja */
function jsUnitKeys(DIST, langs) {
  const seen = new Set(); let corpus = '';
  const skipDir = new Set([...langs, '_np', 'i18n', 'api']);
  const walk = (d, top) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      if (top && skipDir.has(f.name)) continue;
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p, false);
      else if (/\.js$/.test(f.name)) { const c = fs.readFileSync(p, 'utf8'); if (!seen.has(c)) { seen.add(c); corpus += c + '\n'; } }
      else if (/\.html$/.test(f.name)) {
        const h = fs.readFileSync(p, 'utf8'); const re = /<script(?![^>]*\b(?:src=|type="application\/(?:ld\+)?json))[^>]*>([\s\S]*?)<\/script>/gi; let m;
        while ((m = re.exec(h))) { const c = m[1]; if (c.length > 40 && !seen.has(c)) { seen.add(c); corpus += c + '\n'; } }
      }
    }
  };
  try { walk(DIST, true); } catch (e) { console.log('[i18n-runtime] corpus: ' + e.message); }
  let main = {}; try { main = JSON.parse(fs.readFileSync('src/i18n/dict/en.json', 'utf8')); } catch {}
  const out = [];
  for (const k of Object.keys(main)) {
    if (!/<g\d/.test(k)) continue;
    const pieces = k.split(/<\/?[gx]\d+\/?>|\{\d+\}/).map((x) => x.trim()).filter((x) => x.length >= 4 && /[a-záéíóöőúüű]/i.test(x));
    if (pieces.length && pieces.every((x) => corpus.includes(x))) out.push(k);
  }
  console.log('[i18n-runtime] JS inline units: ' + out.length);
  return out;
}

export function writeRuntime(DIST, langs, pages = [], slugs = {}, redir = {}, extra = {}) {
  const PG = {}; for (const p of pages) PG[p] = 1;
  for (const [o, t] of Object.entries(redir)) if (PG[t] && !PG[o]) PG[o] = t; // régi slug → új oldal
  const out = {};
  let keys = [];
  try { keys = JSON.parse(fs.readFileSync('src/i18n/dict/rt-keys.json', 'utf8')); } catch {}
  const gkeys = jsUnitKeys(DIST, langs);
  for (const l of langs) {
    let main = {}, rt = {};
    try { main = JSON.parse(fs.readFileSync(`src/i18n/dict/${l}.json`, 'utf8')); } catch {}
    try { rt = JSON.parse(fs.readFileSync(`src/i18n/dict/rt-${l}.json`, 'utf8')); } catch {}
    const M = {};
    for (const k of keys) if (main[k] && !/<\/?[gx]\d/.test(k)) M[k] = main[k];
    // rövid címkék (szűrők, kártya-adatok a Sheetből) és számos minták — kis méretben
    for (const [k, v] of Object.entries(main)) if (v && !/<\/?[gx]\d|‹/.test(k) && (k.length <= 24 || (/\{\d+\}/.test(k) && k.length <= 40)) && v !== k) M[k] = v;
    for (const [k, t] of Object.entries(EXTRA)) if (t[l] && !M[k]) M[k] = t[l];
    for (const [k, v] of Object.entries(rt)) if (v && v !== k) M[k] = v;
    const G = {};
    for (const k of gkeys) if (main[k] && main[k] !== k) G[k] = main[k];
    const SL = {}; for (const [hu, g] of Object.entries(slugs)) if (g[l]) SL[hu] = g[l];
    const js = `/* CarAdvance i18n runtime (${l}) */(function(){var LG=${JSON.stringify(l)};var PG=${JSON.stringify(PG)};var SL=${JSON.stringify(SL)};var M=${JSON.stringify(M)};var G=${JSON.stringify(G)};var GN=${Object.keys(G).length};var P=${JSON.stringify(PAT[l] || [])};var CUR=null,DOMSTRIP=null;${extra[l] || ''}${UNITS_JS}${ENGINE}})();`;
    fs.mkdirSync(path.join(DIST, 'i18n'), { recursive: true });
    fs.writeFileSync(path.join(DIST, 'i18n', `rt-${l}.js`), js);
    out[l] = Object.keys(M).length;
  }
  return out;
}
