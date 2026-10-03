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

const ENGINE = `
var NUM=/\\d+(?:[.,\\u00a0\\u202f ]\\d+)*/g,SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,CODE:1,PRE:1,NOSCRIPT:1};
function tr(s){var k=s.replace(/\\s+/g,' ').trim();if(!k||!/[A-Za-z\\u00c0-\\u017f]/.test(k))return null;var r=M[k];
if(r==null){var n=[],mk=k.replace(NUM,function(m){n.push(m);return '{'+n.length+'}'});if(n.length&&M[mk]!=null)r=M[mk].replace(/\\{(\\d+)\\}/g,function(_,i){return n[i-1]||''});}
if(r==null&&k.indexOf(' · ')>0){var ch=0,ps=k.split(' · ').map(function(p){var x=tr(p);if(x!=null){ch=1;return x.trim()}return p});if(ch)r=ps.join(' · ');}
if(r==null)for(var i=0;i<P.length;i++){var re=new RegExp('^(.*)'+P[i][0]);var m=k.match(re);if(m){var x=tr(m[1]);r=P[i][1].replace('$1',x!=null?x.trim():m[1]);break;}}
if(r==null||r===k)return null;var a=s.match(/^\\s*/)[0],b=s.match(/\\s*$/)[0];return a+r+b;}
function txt(n){if(n.parentNode&&SKIP[n.parentNode.nodeName])return;var o=n.nodeValue,t=tr(o);if(t!=null&&t!==o){var p=n.parentNode;if(p&&p.nodeName==='OPTION'&&!p.hasAttribute('value'))p.setAttribute('value',o.trim());n.nodeValue=t;}}
var AT=['placeholder','title','aria-label','alt'];
function el(e){for(var i=0;i<AT.length;i++){var v=e.getAttribute&&e.getAttribute(AT[i]);if(v){var t=tr(v);if(t!=null)e.setAttribute(AT[i],t)}}
if(e.nodeName==='INPUT'&&/^(submit|button)$/i.test(e.type)&&e.value){var t2=tr(e.value);if(t2!=null)e.value=t2}}
function walk(root){if(root.nodeType===3)return txt(root);if(root.nodeType!==1||SKIP[root.nodeName])return;el(root);
var w=document.createTreeWalker(root,5,null),n;while((n=w.nextNode())){if(n.nodeType===3)txt(n);else if(SKIP[n.nodeName])continue;else el(n)}}
function run(){walk(document.body);var t=tr(document.title);if(t)document.title=t;
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==='characterData')txt(m.target);else if(m.type==='attributes')el(m.target);else for(var j=0;j<m.addedNodes.length;j++)walk(m.addedNodes[j])}})
.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:AT});
var _a=window.alert;window.alert=function(s){var t=tr(String(s));return _a.call(window,t!=null?t:s)};
var _c=window.confirm;window.confirm=function(s){var t=tr(String(s));return _c.call(window,t!=null?t:s)};}
if(document.body)run();else document.addEventListener('DOMContentLoaded',run);`;

export function writeRuntime(DIST, langs) {
  const out = {};
  let keys = [];
  try { keys = JSON.parse(fs.readFileSync('src/i18n/dict/rt-keys.json', 'utf8')); } catch {}
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
    const js = `/* CarAdvance i18n runtime (${l}) */(function(){var M=${JSON.stringify(M)};var P=${JSON.stringify(PAT[l] || [])};${ENGINE}})();`;
    fs.mkdirSync(path.join(DIST, 'i18n'), { recursive: true });
    fs.writeFileSync(path.join(DIST, 'i18n', `rt-${l}.js`), js);
    out[l] = Object.keys(M).length;
  }
  return out;
}
