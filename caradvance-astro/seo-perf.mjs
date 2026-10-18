/**
 * seo-perf.mjs — mobil teljesítmény (PageSpeed / Core Web Vitals) — utolsó build lépés (2026-10)
 *
 * Semmit nem töröl (videó, kép marad), csak a BETÖLTÉS SORRENDJÉT javítja:
 *  1. Google Fonts CSS nem blokkolja a renderelést (preload + onload, noscript tartalék).
 *  2. A kis saját CSS-ek (kereses.css, fiok.css) beágyazva → nincs külön render-blokkoló kérés.
 *  3. Háttérvideók: preload="none", a videófájl csak az oldal betöltése UTÁN indul (a hero videó
 *     azonnal a load esemény után, a lejjebb lévők akkor, amikor a képernyőre érnek). A poszter
 *     azonnal látszik, így az LCP nem várja meg a több MB-os videót.
 *  4. Az első (hero) videó poszterét előtölti magas prioritással.
 * Hiba esetén exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const INLINE = {};
for (const f of ['kereses.css', 'fiok.css']) {
  const p = path.join(DIST, f);
  if (fs.existsSync(p)) INLINE[f] = fs.readFileSync(p, 'utf8').replace(/<\/style/gi, '<\\/style');
}

const LOADER = `<script id="ca-lazyvid">(function(){function go(v){if(v.__ld)return;v.__ld=1;var s=v.querySelectorAll('source[data-src]'),ch=0,own=0;for(var i=0;i<s.length;i++){if(s[i].getAttribute('src')){own=1;}else{s[i].setAttribute('src',s[i].getAttribute('data-src'));ch=1;}s[i].removeAttribute('data-src');}if(v.getAttribute('data-src')){if(!v.getAttribute('src')){v.setAttribute('src',v.getAttribute('data-src'));ch=1;}v.removeAttribute('data-src');}if(ch&&!own){try{v.load();}catch(e){}}try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}function run(){var vs=[].slice.call(document.querySelectorAll('video.ca-lv'));if(!vs.length)return;if(!('IntersectionObserver' in window)){vs.forEach(go);return;}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);go(e.target);}});},{rootMargin:'300px 0px'});vs.forEach(function(v){io.observe(v);});}function start(){setTimeout(run,150);}if(document.readyState==='complete')start();else window.addEventListener('load',start);})();</script>`;


// ---- Tartós bérlet oldalak: a kártyák „Ajánlatot kérek” gombja ugyanazt a bérlési ablakot nyitja,
// mint az /autoink kártyái és a modell-oldalak (a konfiguráció a seo-abo.mjs STRIP blokkjából jön).
try {
  const src = fs.readFileSync('seo-abo.mjs', 'utf8');
  const lit = (src.match(/const STRIP = ("(?:[^"\\]|\\.)*")/) || [])[1];
  if (lit) {
    const STRIP = JSON.parse(lit);
    const MODAL = '<style>.ab-modal{--red:#E2001A;--navy:#0B0B0D;--ink:#141519;--muted:#5A6B82;--line:#E6EAF1}</style>'
      + STRIP.replace(/<div class="brand-strip"[\s\S]*?<\/div><script>/, '<script>');
    const T = ['dist/tartos-berlet/index.html'];
    if (fs.existsSync('dist/tartos-berlet')) for (const sub of fs.readdirSync('dist/tartos-berlet')) T.push('dist/tartos-berlet/' + sub + '/index.html');
    let tn = 0;
    for (const f of T) {
      if (!fs.existsSync(f)) continue;
      let h = fs.readFileSync(f, 'utf8');
      if (h.indexOf('sub-rent') < 0 || h.indexOf('window.__ABCFG') > -1) continue;
      const bi = h.lastIndexOf('</body>'); if (bi < 0) continue;
      h = h.slice(0, bi) + MODAL + h.slice(bi); fs.writeFileSync(f, h); tn++;
    }
    console.log('[perf] tartós bérlet: bérlési ablak beszúrva ' + tn + ' oldalra');
  }
} catch (e) { console.log('[perf] tartós bérlet ablak hiba: ' + e.message); }


// ---- „Autóbérlés” → „Tartós bérlet” (2026-10): nálunk nincs napi bérlés, minden bérlet min. 6 hónapos.
// A főmenü felirata minden oldalon (a nem-Astro, kézi fejlécű oldalakon is), nyelvenként a szótár szerint,
// és az /autoink „Bérelhető” hero szövege.
const NAVREN = { '': ['Autóbérlés', 'Tartós bérlet'] };
try {
  for (const l of ['en', 'de', 'fr', 'uk', 'zh', 'sk', 'cs']) {
    const d = JSON.parse(fs.readFileSync('src/i18n/dict/' + l + '.json', 'utf8'));
    if (d['Autóbérlés'] && d['Tartós bérlet']) NAVREN[l] = [d['Autóbérlés'], d['Tartós bérlet']];
  }
} catch (e) {}
function renameRental(p, h) {
  const rel = p.split(path.sep).slice(1);
  const lang = (rel[0] === '_np' ? rel[1] : rel[0]) || '';
  const pair = NAVREN[lang] || NAVREN[''];
  const [from, to] = pair;
  let o = h;
  for (const cls of ['navlink', 'm-accbtn']) for (const f of [from, 'Tartós bérlet']) o = o.split('class="' + cls + '" type="button">' + f + '<').join('class="' + cls + '" type="button">' + to + '<');
  if (/[\\/]autoink[\\/]index\.html$/.test(p) && pair === NAVREN['']) {
    o = o.split('<div class="hh">Bérelhető autóink</div>').join('<div class="hh">Tartós bérlet</div>')
      .split('Bérautóink többsége 0 km-es, vadonatúj — mindig a legfrissebb modellek. Havidíjas előfizetéses bérlet (Auto-Abo) rövid futamidővel és rugalmas km-kerettel; a kaució a bérlés végén visszajár.')
      .join('Új, 0 km-es prémium autók tartós bérletben — minimum 6 hónapra, fix havidíjjal. Casco, szerviz, adó és nyári-téli gumi a díjban; a kaució a bérlet végén visszajár.')
      .replace(/>(\d+) bérelhető autó</g, '>$1 autó tartós bérletre<')
      .split('"name":"Bérelhető autóink – prémium autóbérlés és tartós bérlet"').join('"name":"Tartós bérlet – bérelhető prémium autóink (6 hónaptól)"');
  }
  return o;
}


// ---- 2026-10: a tartós bérlet aloldalai megszűntek → 301 (statikus szabályok a _redirects ELEJÉRE)
try {
  const R = 'dist/_redirects';
  const MAP = { cegeknek: '/tartos-berlet/#cegeknek', maganszemelyeknek: '/tartos-berlet/#maganszemelyeknek', 'elektromos-auto': '/tartos-berlet/#elektromos',
    bmw: '/autoink/?marka=bmw#berelheto', mercedes: '/autoink/?marka=mercedes#berelheto', audi: '/autoink/?marka=audi#berelheto',
    volkswagen: '/autoink/?marka=volkswagen#berelheto', mini: '/autoink/?marka=mini#berelheto' };
  const lines = [];
  for (const [k, to] of Object.entries(MAP)) {
    for (const pre of ['', '/en', '/de', '/fr', '/uk', '/zh', '/sk', '/cs']) {
      const dest = pre + to;
      lines.push(`${pre}/tartos-berlet/${k}/ ${dest} 301`, `${pre}/tartos-berlet/${k} ${dest} 301`);
    }
  }
  const old = fs.existsSync(R) ? fs.readFileSync(R, 'utf8') : '';
  if (!old.includes('/tartos-berlet/cegeknek/ ')) fs.writeFileSync(R, lines.join('\n') + '\n' + old);
  console.log('[perf] tartós bérlet aloldalak 301: ' + lines.length + ' szabály');
} catch (e) { console.log('[perf] _redirects hiba: ' + e.message); }

let files = 0, changed = 0, vids = 0, fonts = 0, css = 0;
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name === 'belso' || e.name === 'api') continue; walk(p); }
    else if (e.name.endsWith('.html')) { files++; try { fix(p); } catch (err) { /* egy oldal hibája ne állítsa meg */ } }
  }
}


// ── Autókártyák: „⇄ Összehasonlítás” gomb (hover-re a fotón; érintőképernyőn mindig látszik) ──
// A /berelheto-auto/<slug>-berles linkből a slug → /auto-osszehasonlitas/?a=<slug>&b=<hasonló méretű másik márka>.
const CMP = (() => {
  try {
    const t = fs.readFileSync('src/data/compareCars.ts', 'utf8');
    const cars = t.split('\n').filter((l) => /^\s*\{"slug"/.test(l)).map((l) => { try { const o = JSON.parse(l.trim().replace(/,$/, '')); return { s: o.slug, b: o.name.split(' ')[0], L: o.L, body: o.body, fuel: o.fuel }; } catch { return null; } }).filter(Boolean);
    const pair = {};
    const d = (x, c) => Math.abs(x.L - c.L) + (x.body === c.body ? 0 : 400) + (x.fuel === c.fuel ? 0 : 60);
    for (const c of cars) {
      const o = cars.filter((x) => x.b !== c.b).sort((x, y) => d(x, c) - d(y, c))[0];
      if (o) pair[c.s] = o.s;
    }
    return pair;
  } catch { return {}; }
})();
const CMP_LBL = { hu: 'Összehasonlítás', en: 'Compare', de: 'Vergleichen', fr: 'Comparer', uk: 'Порівняти', zh: '对比', sk: 'Porovnať', cs: 'Porovnat' };

// ── Autókártyák: rendezés (ár, elérhetőség, kaució, név), fotóra kattintás → Részletek, visszalépéskor ugyanoda görget ──
const SORT_T = {"hu": {"label": "Rendezés", "rec": "Rendezés: ajánlott", "pa": "Legolcsóbb elöl", "pd": "Legdrágább elöl", "av": "Leghamarabb elérhető", "dep": "Legkisebb kaució", "az": "Név szerint (A–Z)"}, "en": {"label": "Sort", "rec": "Sort: recommended", "pa": "Cheapest first", "pd": "Most expensive first", "av": "Available soonest", "dep": "Lowest deposit", "az": "Name (A–Z)"}, "de": {"label": "Sortierung", "rec": "Sortierung: empfohlen", "pa": "Günstigste zuerst", "pd": "Teuerste zuerst", "av": "Am schnellsten verfügbar", "dep": "Niedrigste Kaution", "az": "Name (A–Z)"}, "fr": {"label": "Tri", "rec": "Tri : recommandé", "pa": "Moins cher d’abord", "pd": "Plus cher d’abord", "av": "Disponible au plus tôt", "dep": "Caution la plus basse", "az": "Nom (A–Z)"}, "uk": {"label": "Сортування", "rec": "Сортування: рекомендовані", "pa": "Спочатку дешевші", "pd": "Спочатку дорожчі", "av": "Найшвидше доступні", "dep": "Найменша застава", "az": "Назва (А–Я)"}, "zh": {"label": "排序", "rec": "排序：推荐", "pa": "价格从低到高", "pd": "价格从高到低", "av": "最快可提车", "dep": "押金最低", "az": "名称 (A–Z)"}, "sk": {"label": "Zoradiť", "rec": "Zoradiť: odporúčané", "pa": "Najlacnejšie prvé", "pd": "Najdrahšie prvé", "av": "Najskôr dostupné", "dep": "Najnižšia kaucia", "az": "Názov (A–Z)"}, "cs": {"label": "Řadit", "rec": "Řadit: doporučené", "pa": "Nejlevnější první", "pd": "Nejdražší první", "av": "Nejdříve dostupné", "dep": "Nejnižší kauce", "az": "Název (A–Z)"}};
const SORT_JS = `(function(){
var T=__T__;
var KEY='ca-sort',RET='ca-ret';
function num(s){s=String(s||'');var o='';for(var i=0;i<s.length;i++){var ch=s.charCodeAt(i);if(ch>=48&&ch<=57)o+=s[i];}return o?+o:0;}
var MON=['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december','january','february','march','april','may','june','july','august','september','october','november','december','januar','februar','märz','april','mai','juni','juli','august','september','oktober','november','dezember'];
function availKey(c){var a=c.querySelector('.sub-avail');if(!a)return 9e9;if(a.classList.contains('now'))return 0-num(a.textContent)/1000;var t=a.textContent.toLowerCase(),y=0,m=13;var ds=t.split(/[^0-9]+/);for(var i=0;i<ds.length;i++){if(ds[i].length===4)y=+ds[i];}for(var j=0;j<MON.length;j++){if(t.indexOf(MON[j])>-1){m=j%12+1;break;}}return y?y*100+m:9e8;}
function price(c){var b=c.querySelector('.ca-pbox');return b?(+b.getAttribute('data-bteur')||9e9):9e9;}
function dep(c){var d=c.querySelector('.sub-dep');if(!d)return 9e9;var t=d.textContent,i=t.lastIndexOf('(');return i>-1?num(t.slice(i,t.indexOf('€',i))):9e9;}
function name(c){var h=c.querySelector('.sub-title');return h?h.textContent.trim().toLowerCase():'';}
function mode(){try{return sessionStorage.getItem(KEY)||'rec';}catch(e){return 'rec';}}
var busy=false;
function apply(){var host=document.getElementById('sub-list');if(!host||busy)return;var m=mode();
 if(m==='rec'){if(host.querySelector('.ca-flat')){busy=true;var f=document.getElementById('sf-fuel');if(f)f.dispatchEvent(new Event('change'));busy=false;}place();return;}
 if(!host.querySelector('.sub-brand-h:not(.ca-fh)')&&host.querySelector('.ca-flat')&&host.__m===m){place();return;}
 var cs=[].slice.call(host.querySelectorAll('.sub-card'));if(!cs.length)return;
 var k={pa:price,pd:function(c){return -price(c);},av:availKey,dep:dep}[m];
 cs.sort(function(a,b){if(m==='az')return name(a)<name(b)?-1:name(a)>name(b)?1:0;var x=k(a),y=k(b);return x-y||price(a)-price(b);});
 busy=true;var g=document.createElement('div');g.className='sub-grid ca-flat';for(var i=0;i<cs.length;i++)g.appendChild(cs[i]);var cnt=document.getElementById('sub-count');var fh=document.createElement('div');fh.className='sub-brand-h ca-fh';fh.innerHTML='<h3></h3><span class="ln"></span><span class="ct"></span>';fh.querySelector('h3').textContent=T[m]||'';fh.querySelector('.ct').textContent=cnt?cnt.textContent:'';host.innerHTML='';host.appendChild(fh);host.appendChild(g);host.__m=m;busy=false;place();}
var W=null;function place(){if(!W)return;var host=document.getElementById('sub-list');if(!host)return;var h=host.querySelector('.sub-brand-h');if(!h){if(W.parentNode!==host)host.insertBefore(W,host.firstChild);W.classList.add('ca-solo');return;}W.classList.remove('ca-solo');if(W.parentNode!==h)h.appendChild(W);var s=W.querySelector('select');W.classList.toggle('on',s.value!=='rec');W.title=T.label+': '+s.options[s.selectedIndex].text;}function ui(){if(W||!document.getElementById('sub-list'))return;var s=document.createElement('select');s.id='sf-sort';s.setAttribute('aria-label',T.label);var o=[['rec',T.rec],['pa',T.pa],['pd',T.pd],['av',T.av],['dep',T.dep],['az',T.az]];for(var i=0;i<o.length;i++){var op=document.createElement('option');op.value=o[i][0];op.textContent=o[i][1];s.appendChild(op);}s.value=mode();s.addEventListener('change',function(){try{sessionStorage.setItem(KEY,s.value);}catch(e){}var host=document.getElementById('sub-list');if(host)host.__m='';apply();place();});W=document.createElement('span');W.className='ca-sortbtn';W.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/></svg>';W.appendChild(s);place();}
function save(c){try{var r=c.getBoundingClientRect(),a=c.querySelector('a.sub-det');sessionStorage.setItem(RET,JSON.stringify({p:location.pathname+location.search,h:a?a.getAttribute('href'):'',o:Math.round(r.top),y:Math.round(window.scrollY),t:Date.now()}));}catch(e){}}
document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.sub-card');if(!c)return;
 if(e.target.closest('a.sub-det,a.ca-cmp')){save(c);return;}
 var md=e.target.closest('.sub-media');if(md&&!e.target.closest('button,a,.sub-gbtn,.sub-gdots,.sub-gdot')){var a=c.querySelector('a.sub-det');if(a){save(c);location.href=a.href;}}},true);
function restore(){var d;try{d=JSON.parse(sessionStorage.getItem(RET)||'null');}catch(e){}if(!d||d.p!==location.pathname+location.search||Date.now()-d.t>1800000)return;
 try{history.scrollRestoration='manual';}catch(e){}
 var tries=0;function go(){tries++;var a=d.h?document.querySelector('.sub-card a.sub-det[href="'+d.h+'"]'):null;var c=a&&a.closest('.sub-card');
  var done=false;if(c){var top=c.getBoundingClientRect().top+window.scrollY-d.o;window.scrollTo(0,Math.max(0,top));done=tries>=5;}else if(tries>8){window.scrollTo(0,d.y);done=true;}
  if(!done&&tries<10)setTimeout(go,250);else{try{sessionStorage.removeItem(RET);}catch(e){}}}
 setTimeout(go,150);}
var t2=0;new MutationObserver(function(){if(t2)return;t2=setTimeout(function(){t2=0;ui();apply();},120);}).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('.sub-filters'))setTimeout(apply,0);});document.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('.sub-filters'))setTimeout(apply,0);});
function start(){ui();apply();restore();}
if(document.readyState!=='loading')start();else document.addEventListener('DOMContentLoaded',start);
window.addEventListener('pageshow',function(ev){if(ev.persisted)restore();});
})();
`;
let cmpPages = 0;
function addCompare(p, h) {
  if (!Object.keys(CMP).length || h.includes('id="ca-cmp"')) return h;
  const rel = path.relative(DIST, p).split(path.sep).join('/');
  if (!/(^|\/)autoink\/index\.html$/.test(rel) && !/sub-det|sub-card/.test(h)) return h;
  const lang = ((h.match(/<html[^>]*\slang="([a-z]{2})/i) || [])[1] || 'hu').toLowerCase();
  const lbl = CMP_LBL[lang] || CMP_LBL.hu;
  cmpPages++;
  const js = `<style id="ca-cmp-css">.ca-tags{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;margin:10px 0 2px}.ca-tags .ca-fuels{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;margin-left:auto}.ca-tags .sub-avail,.ca-tags .sub-fuel{position:static!important;inset:auto!important;transform:none!important;margin:0!important;box-shadow:none!important;font-size:12px!important;line-height:1!important;padding:7px 10px!important;border-radius:8px!important;white-space:nowrap}.sub-actions .ca-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sub-actions .ca-row .sub-det{min-width:0}#panel-berelheto .sub-actions .ca-cmp,.sub-actions .ca-cmp{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;text-align:center;background:#eef2f8;color:var(--navy,#0b0b0d);font-weight:700;font-size:14px;padding:14px 8px;border-radius:12px;text-decoration:none;white-space:nowrap;transition:.15s}.sub-actions .ca-cmp b{font-size:16px;line-height:1;font-weight:700}#panel-berelheto .sub-card:hover .sub-actions .ca-cmp,#panel-berelheto .sub-actions .ca-cmp:hover,.sub-card:hover .sub-actions .ca-cmp,.sub-actions .ca-cmp:hover{background:var(--navy,#0b0b0d);color:#fff}@media(max-width:420px){#panel-berelheto .sub-actions .ca-cmp,.sub-actions .ca-cmp{font-size:13px;padding:13px 6px;gap:4px}.sub-actions .ca-row .sub-det{font-size:14px}}#panel-berelheto .sub-actions .ca-row .sub-det,#panel-berelheto .sub-actions .ca-row .ca-cmp,#panel-berelheto .sub-actions .sub-rent,.sub-actions .ca-row .sub-det,.sub-actions .ca-row .ca-cmp{height:48px;padding-top:0;padding-bottom:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;line-height:1.2}</style><script id="ca-cmp">(function(){var P=${JSON.stringify(CMP)},L=${JSON.stringify(lbl)};var seg=(location.pathname.split('/')[1]||'');var pre=/^(en|de|fr|uk|zh|sk|cs)$/.test(seg)?'/'+seg:'';function tags(){var cs=document.querySelectorAll('.sub-card');for(var i=0;i<cs.length;i++){var c=cs[i];if(c.__tags)continue;var sp=c.querySelector('.sub-specs');if(!sp)continue;c.__tags=1;var w=document.createElement('div');w.className='ca-tags';var av=c.querySelector('.sub-media .sub-avail'),fu=c.querySelectorAll('.sub-media .sub-fuels .sub-fuel');if(av)w.appendChild(av);var fg=document.createElement('div');fg.className='ca-fuels';for(var j=0;j<fu.length;j++){var f=fu[j],bg=(f.style.backgroundColor||'').split(' ').join('');if(bg==='rgb(0,153,126)')f.style.background='#7c3aed';else if(bg==='rgb(107,114,128)')f.style.background='#334155';fg.appendChild(f);}if(fg.children.length)w.appendChild(fg);var fw=c.querySelector('.sub-media .sub-fuels');if(fw&&!fw.children.length)fw.style.display='none';if(w.children.length)sp.parentNode.insertBefore(w,sp.nextSibling);}}function dec(){tags();var as=document.querySelectorAll('.sub-card a.sub-det');for(var i=0;i<as.length;i++){var a=as[i],c=a.closest('.sub-card');if(!c||c.__cmp)continue;c.__cmp=1;var m=(a.getAttribute('href')||'').match(/\\/berelheto-auto\\/([a-z0-9-]+?)-berles\\/?$/);if(!m||!P[m[1]])continue;var row=document.createElement('div');row.className='ca-row';a.parentNode.insertBefore(row,a);row.appendChild(a);var x=document.createElement('a');x.className='ca-cmp';x.href=pre+'/auto-osszehasonlitas/?a='+m[1]+'&b='+P[m[1]];x.innerHTML='<b>⇄</b>'+L;x.addEventListener('click',function(e){e.stopPropagation();});row.appendChild(x);}}var t=0;new MutationObserver(function(){if(t)return;t=setTimeout(function(){t=0;dec();},120);}).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState!=='loading')dec();else document.addEventListener('DOMContentLoaded',dec);})();</script>`;
  const sortJs = '<style id="ca-sort-css">.sub-card .sub-media img{cursor:pointer}.ca-sortbtn{position:relative;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;margin-left:10px;border:1px solid #e2e5ea;border-radius:10px;background:#fff;color:#141519;cursor:pointer;transition:.15s}.ca-sortbtn:hover{border-color:#141519}.ca-sortbtn.on{background:#0b0b0d;border-color:#0b0b0d;color:#fff}.ca-sortbtn select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px;border:0;appearance:none;-webkit-appearance:none}.ca-sortbtn.ca-solo{float:right;margin:0 0 8px 10px}.sub-brand-h.ca-fh h3{font-size:inherit}</style><script id="ca-sort">' + SORT_JS.replace('__T__', JSON.stringify(SORT_T[lang] || SORT_T.hu)) + '</script>';
  return h.replace(/<\/body>/i, js + sortJs + '</body>');
}


// Megosztási kép (LinkedIn/Facebook): az alap X5-poszter helyett márkás og-kép nyelvenként (2026-10)
const OG_OLD = 'https://www.caradvance.hu/caradvance-hero-x5-poster.jpg';
const OG_ALT = { hu: 'CarAdvance – prémium autók Németországból: új autó rendelés, import, tartós bérlet', de: 'CarAdvance – Premium-Autos aus Deutschland: Neuwagen-Bestellung, Import, Langzeitmiete', en: 'CarAdvance – premium cars from Germany: new car orders, import, long-term rental' };
function ogImg(p, h) {
  if (!h.includes(OG_OLD)) return h;
  const seg = path.relative(DIST, p).split(path.sep)[0];
  const lang = seg === 'de' ? 'de' : /^(en|fr|uk|zh|sk|cs)$/.test(seg) ? 'en' : 'hu';
  const img = 'https://www.caradvance.hu/og-caradvance' + (lang === 'hu' ? '' : '-' + lang) + '.jpg';
  let hit = false;
  h = h.replace(/<meta\s+(property="og:image(?::url|:secure_url)?"|name="twitter:image")\s+content="([^"]*)"\s*\/?>/g, (m, k, v) => {
    if (v !== OG_OLD) return m; hit = true; return '<meta ' + k + ' content="' + img + '">';
  });
  if (hit && !/property="og:image:width"/.test(h)) {
    h = h.replace(/<\/head>/i, '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="' + OG_ALT[lang] + '"></head>');
  }
  if (hit) ogn++;
  return h;
}
let ogn = 0;


// Bérlési űrlap: kívánt kezdő dátum (naptár, min. +10 nap / elérhetőség hónapja) + Choice link az admin e-mailbe (2026-10)
const AB_DATE_JS = `<script id="ca-abdate">(function(){
var seg=(location.pathname.split('/')[1]||'');var LG=/^(en|fr|uk|zh|sk|cs)$/.test(seg)?'en':(seg==='de'?'de':'hu');
var T={hu:{lbl:'7. Mikortól bérelnéd?',tip:'Az autót Németországból hozzuk: a megrendeléstől számítva legalább 10 nap kell, mire átveheted. Későbbi elérhetőségű autónál a legkorábbi dátum az elérhetőség hónapjának első napja.',note:'Legkorábbi átvétel: ',err:'Kérlek válaszd ki, mikortól szeretnéd bérelni az autót.',errMin:'A legkorábbi lehetséges kezdés: '},
en:{lbl:'7. When would you like the rental to start?',tip:'We bring the car from Germany: it takes at least 10 days from your order until handover. For cars available later, the earliest date is the first day of that month.',note:'Earliest handover: ',err:'Please choose when you would like the rental to start.',errMin:'The earliest possible start is '},
de:{lbl:'7. Ab wann möchten Sie mieten?',tip:'Wir bringen das Auto aus Deutschland: Ab Bestellung dauert es mindestens 10 Tage bis zur Übergabe. Bei später verfügbaren Autos ist der früheste Termin der erste Tag des jeweiligen Monats.',note:'Frühestmögliche Übergabe: ',err:'Bitte wählen Sie, ab wann Sie das Auto mieten möchten.',errMin:'Frühestmöglicher Beginn: '}}[LG];
var HUM=['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'];
var LEAD=10;
function p2(n){return (n<10?'0':'')+n;}
function iso(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());}
function huD(s){var a=s.split('-');return a[0]+'. '+HUM[+a[1]-1]+' '+(+a[2])+'.';}
function nice(s){if(LG==='hu')return huD(s);try{return new Date(s+'T12:00:00').toLocaleDateString(LG==='de'?'de-DE':'en-GB',{day:'numeric',month:'long',year:'numeric'});}catch(e){return s;}}
function minDate(m){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+LEAD);var av=m.querySelector('input[name="avail"]:checked');var v=av?av.value:'';var r=/(\\d{4})\\.\\s*([a-záéíóöőúüű]+)/i.exec(v||'');if(r){var mi=HUM.indexOf(r[2].toLowerCase());if(mi>-1){var f=new Date(+r[1],mi,1,12);if(f>d)d=f;}}return iso(d);}
var MAP=null,MAPL=0;function loadMap(){if(MAP||MAPL)return;MAPL=1;fetch('/abo-links.json').then(function(r){return r.json();}).then(function(j){MAP=j.m||{};}).catch(function(){MAPL=0;});}
function choiceLink(m){var f=m.querySelector('#abForm');if(!f)return '';var fd=new FormData(f);var car=(fd.get('car')||'').trim(),fu=fd.get('fuel')||'',co=fd.get('color')||'',tr=fd.get('ausstattung')||'';var M=MAP||{};var k=[[car,fu,co,tr],[car,'','',tr],[car,fu,co,''],[car,'','','']];for(var i=0;i<k.length;i++){var v=M[k[i].join('|')];if(v)return 'https://fleetshop.choice.de/offer-details/'+v;}return 'https://fleetshop.choice.de/abo';}
function sync(m){var inp=m.querySelector('#abStart');if(!inp)return;var mn=minDate(m);inp.min=mn;if(!inp.value||inp.value<mn)inp.value=mn;var n=m.querySelector('#abStartNote');if(n)n.textContent=T.note+nice(mn);}
function add(m){if(m.querySelector('#abDateBlock'))return;var anchor=m.querySelector('#abAusInfo')||m.querySelector('#abAus');if(!anchor)return;var b=document.createElement('div');b.className='ab-block';b.id='abDateBlock';b.innerHTML='<div class="ab-label">'+T.lbl+'<span class="ab-av-i" tabindex="0">i<span class="ab-av-tip">'+T.tip+'</span></span></div><input type="date" name="startdate" id="abStart" required style="width:100%;font-family:inherit;font-size:15px;color:var(--ink,#141519);background:#f7f9fc;border:1.5px solid var(--line,#E6EAF1);border-radius:10px;padding:11px 12px;outline:none;min-height:46px"><div id="abStartNote" style="margin-top:8px;font-size:12.5px;color:#0a6b3b;font-weight:600"></div>';anchor.parentNode.insertBefore(b,anchor.nextSibling);m.addEventListener('click',function(e){if(e.target.closest('.ab-opt'))setTimeout(function(){sync(m);},0);});var inp=b.querySelector('#abStart');inp.addEventListener('change',function(){var mn=inp.min;if(inp.value&&inp.value<mn)inp.value=mn;});sync(m);}
function patchExtras(){var o=window.caLeadExtras;if(o&&o.__ab)return;var w=function(){var r={};try{if(o)r=o.apply(this,arguments)||{};}catch(e){}try{var m=document.getElementById('abRent');if(m&&m.getAttribute('aria-hidden')==='false'){var inp=m.querySelector('#abStart');if(inp&&inp.value)r['Kívánt átvétel']=huD(inp.value);r['Choice link']=choiceLink(m);}}catch(e){}return r;};w.__ab=1;window.caLeadExtras=w;}
document.addEventListener('submit',function(e){var f=e.target;if(!f||f.id!=='abForm')return;var m=document.getElementById('abRent');var inp=m&&m.querySelector('#abStart');if(!inp)return;patchExtras();var mn=minDate(m);var bad=!inp.value?T.err:(inp.value<mn?T.errMin+nice(mn):'');if(bad){e.preventDefault();e.stopImmediatePropagation();var g=m.querySelector('#abMsg');if(g){g.className='ab-msg err';g.textContent=bad;}inp.focus();}},true);
function tick(){var m=document.getElementById('abRent');if(m&&m.getAttribute('aria-hidden')==='false'){loadMap();add(m);patchExtras();if(!m.__abo){m.__abo=1;}var inp=m.querySelector('#abStart');if(inp&&(!inp.value||inp.value<minDate(m)))sync(m);}}
try{new MutationObserver(function(){tick();}).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['aria-hidden']});}catch(e){}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.sub-rent,[data-abx]'))setTimeout(tick,50);},true);
})();</script>`;
let abd = 0;
function fix(p) {
  let h = fs.readFileSync(p, 'utf8');
  const o = h;
  if (h.includes('id="ca-perf"')) return;
  h = renameRental(p, h);
  h = addCompare(p, h);
  h = ogImg(p, h);
  if (h.includes('window.__ABCFG') && !h.includes('id="ca-abdate"')) { h = h.replace(/<\/body>(?![\s\S]*<\/body>)/i, AB_DATE_JS + '</body>'); abd++; }

  // 1) Google Fonts: nem blokkoló betöltés
  h = h.replace(/<link\s+href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"\s+rel="stylesheet"\s*\/?>/g, (m, href) => {
    fonts++;
    return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
  });
  h = h.replace(/<link\s+rel="stylesheet"\s+href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"\s*\/?>/g, (m, href) => {
    fonts++;
    return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
  });

  // 2) kis saját CSS-ek beágyazása
  h = h.replace(/<link\s+rel="stylesheet"\s+href="\/(kereses\.css|fiok\.css)(?:\?[^"]*)?"\s*\/?>/g, (m, f) => {
    if (!INLINE[f]) return m; css++;
    return `<style data-inl="${f}">${INLINE[f]}</style>`;
  });

  // 3) háttérvideók késleltetett betöltése (autoplay + muted videók)
  let first = null, n = 0;
  h = h.replace(/<video\b([^>]*)>([\s\S]*?)<\/video>/g, (m, attrs, inner) => {
    if (!/\bautoplay\b/.test(attrs) || !/\bmuted\b/.test(attrs)) return m;
    if (/\bca-lv\b/.test(attrs)) return m;
    n++;
    const poster = (attrs.match(/\bposter="([^"]+)"/) || [])[1];
    if (!first && poster) first = poster;
    let a = attrs.replace(/\bpreload="[^"]*"/, '').replace(/\s+$/, '') + ' preload="none"';
    a = /\bclass="/.test(a) ? a.replace(/\bclass="/, 'class="ca-lv ') : a + ' class="ca-lv"';
    a = a.replace(/\ssrc="([^"]+)"/, ' data-src="$1"');
    const inn = inner.replace(/<source\b([^>]*?)\ssrc="([^"]+)"/g, '<source$1 data-src="$2"');
    return `<video${a}>${inn}</video>`;
  });
  if (n) {
    vids += n;
    h = h.includes('</body>') ? h.replace(/<\/body>/i, LOADER + '</body>') : h + LOADER;
    if (first && !h.includes(`rel="preload" as="image" href="${first}"`)) {
      h = h.replace(/<head([^>]*)>/i, `<head$1><link rel="preload" as="image" href="${first}" fetchpriority="high">`);
    }
  }

  if (h !== o) {
    h = h.replace(/<\/head>/i, '<meta id="ca-perf" name="x-perf" content="1"></head>');
    fs.writeFileSync(p, h); changed++;
  }
}

try {
  if (fs.existsSync(DIST)) walk(DIST);
  console.log(`[perf] összehasonlítás gomb az autókártyákon: ${cmpPages} oldal, ${Object.keys(CMP).length} modell`);
  console.log(`[perf] bérlési dátum + Choice link: ${abd} oldal`);
  console.log(`[perf] megosztási kép (og:image) cserélve: ${ogn} oldal`);
  console.log(`[perf] ${files} oldal, módosítva ${changed} · font ${fonts} · css ${css} · videó ${vids}`);
} catch (e) { console.log('[perf] hiba: ' + (e && e.message)); }

// ---------- caradvance.sk / caradvance.cz: szlovák / cseh URL-ek (skcz-slugs.mjs) ----------
try { const SK = await import('./skcz-slugs.mjs'); console.log(SK.run(DIST)); } catch (e) { console.log('[skcz] hiba: ' + (e && e.message)); }

// ---------- caradvance.sk / caradvance.cz: a middleware minden szlovák/cseh oldalon fusson ----------
// A _routes.json (seo-noprice.mjs) csak a magyar áras könyvtárakat tartalmazza. A saját domainen
// (www.caradvance.sk/aszf/ stb.) e nélkül a magyar oldal menne ki. Ezért felvesszük a dist/sk és dist/cs
// összes könyvtárát, a /sk/* és /cs/* útvonalat, valamint a robots.txt-t és a sitemap.xml-t.
// A "/x" pontos szabály fölösleges, ha "/x/*" is van (a middleware perjel nélküli címen úgyis továbbad).
try {
  const RP = path.join(DIST, '_routes.json');
  if (fs.existsSync(RP)) {
    const R = JSON.parse(fs.readFileSync(RP, 'utf8'));
    const before = (R.include || []).length;
    const inc = new Set(R.include || []);
    for (const x of [...inc]) if (!x.includes('*') && x !== '/' && inc.has(x + '/*')) inc.delete(x);
    for (const l of ['sk', 'cs']) {
      const d = path.join(DIST, l);
      if (!fs.existsSync(d)) continue;
      inc.add('/' + l + '/*');
      for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) inc.add('/' + e.name + '/*');
    }
    inc.add('/robots.txt'); inc.add('/sitemap.xml');
    // régi magyar címek a saját domainen → a middleware 301-gyel átirányít (csak ha belefér a 100 szabályba)
    const old = new Set();
    for (const l of ['sk', 'cs']) {
      try { for (const hu of Object.keys(JSON.parse(fs.readFileSync(path.join(DIST, l, '_slugs.json'), 'utf8')))) { const s = hu.split('/')[1]; if (s) old.add('/' + s + '/*'); } } catch (e) { /* nincs térkép */ }
    }
    for (const r of old) { if (inc.size + (R.exclude || []).length >= 100) break; inc.add(r); }
    // A Cloudflare nem enged átfedő szabályt (pl. "/sk/x/*" és "/sk/*"): a tágabb alá eső szűkebbet töröljük.
    const wild = [...inc].filter((w) => w.endsWith('/*'));
    for (const r of [...inc]) if (wild.some((w) => w !== r && r.startsWith(w.slice(0, -1)))) inc.delete(r);
    const arr = [...inc];
    if (arr.length + (R.exclude || []).length <= 100) {
      R.include = arr;
      fs.writeFileSync(RP, JSON.stringify(R, null, 2));
      console.log(`[perf] _routes.json: ${before} → ${arr.length} szabály (sk/cs saját domain)`);
    } else {
      console.log(`[perf] _routes.json: túl sok szabály (${arr.length}) — változatlanul hagyva`);
    }
  }
} catch (e) { console.log('[perf] _routes hiba: ' + (e && e.message)); }

// ---------- i18n runtime (rt-*.js): végtelen ciklus javítása a saját domaineken ----------
// A link-javító lk() minden linkre setAttribute-ot hív, akkor is, ha az érték nem változik. A
// MutationObserver ezt új változásnak látja → újra lk() → … a caradvance.sk / .cz gyökerén (ahol a
// linkek nem /sk/-vel kezdődnek) az oldal lefagy: nem töltődnek be az autók, a menü nem működik.
// Javítás: csak akkor írjuk át a href-et, ha tényleg más lesz.
try {
  let rtFixed = 0, rtFiles = 0;
  const rtDirs = [path.join(DIST, 'i18n'), path.join(DIST, '_np', 'i18n')];
  for (const d of rtDirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (!/^rt-[a-z]+\.js$/.test(f)) continue;
      const p = path.join(d, f);
      let s = fs.readFileSync(p, 'utf8');
      const o = s;
      s = s.replace("e.setAttribute('href',t+(m[2]||''));}", "var nv=t+(m[2]||'');if(nv!==h)e.setAttribute('href',nv);}");
      s = s.replace("e.setAttribute('href',(SL['/autoink/']||'/'+LG+'/autoink/')+'#berelheto');return;",
        "var bv=(SL['/autoink/']||'/'+LG+'/autoink/')+'#berelheto';if(DOMSTRIP)bv=bv.replace(DOMSTRIP,'/');if(bv!==h)e.setAttribute('href',bv);return;");
      rtFiles++;
      if (s !== o) { fs.writeFileSync(p, s); rtFixed++; }
    }
  }
  console.log(`[perf] i18n runtime link-ciklus javítva: ${rtFixed}/${rtFiles} fájl`);
} catch (e) { console.log('[perf] rt hiba: ' + (e && e.message)); }
process.exit(0);
