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
let cmpPages = 0;
function addCompare(p, h) {
  if (!Object.keys(CMP).length || h.includes('id="ca-cmp"')) return h;
  const rel = path.relative(DIST, p).split(path.sep).join('/');
  if (!/(^|\/)autoink\/index\.html$/.test(rel) && !/sub-det|sub-card/.test(h)) return h;
  const lang = ((h.match(/<html[^>]*\slang="([a-z]{2})/i) || [])[1] || 'hu').toLowerCase();
  const lbl = CMP_LBL[lang] || CMP_LBL.hu;
  cmpPages++;
  const js = `<style id="ca-cmp-css">.ca-tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:10px 0 2px}.ca-tags .sub-avail,.ca-tags .sub-fuel{position:static!important;inset:auto!important;transform:none!important;margin:0!important;box-shadow:none!important;font-size:12px!important;line-height:1!important;padding:6px 10px!important;border-radius:999px!important;white-space:nowrap}.sub-actions .ca-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sub-actions .ca-row .sub-det{min-width:0}#panel-berelheto .sub-actions .ca-cmp,.sub-actions .ca-cmp{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;text-align:center;background:#eef2f8;color:var(--navy,#0b0b0d);font-weight:700;font-size:14px;padding:14px 8px;border-radius:12px;text-decoration:none;white-space:nowrap;transition:.15s}.sub-actions .ca-cmp b{font-size:16px;line-height:1;font-weight:700}#panel-berelheto .sub-card:hover .sub-actions .ca-cmp,#panel-berelheto .sub-actions .ca-cmp:hover,.sub-card:hover .sub-actions .ca-cmp,.sub-actions .ca-cmp:hover{background:var(--navy,#0b0b0d);color:#fff}@media(max-width:420px){#panel-berelheto .sub-actions .ca-cmp,.sub-actions .ca-cmp{font-size:13px;padding:13px 6px;gap:4px}.sub-actions .ca-row .sub-det{font-size:14px}}#panel-berelheto .sub-actions .ca-row .sub-det,#panel-berelheto .sub-actions .ca-row .ca-cmp,#panel-berelheto .sub-actions .sub-rent,.sub-actions .ca-row .sub-det,.sub-actions .ca-row .ca-cmp{height:48px;padding-top:0;padding-bottom:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;line-height:1.2}</style><script id="ca-cmp">(function(){var P=${JSON.stringify(CMP)},L=${JSON.stringify(lbl)};var seg=(location.pathname.split('/')[1]||'');var pre=/^(en|de|fr|uk|zh|sk|cs)$/.test(seg)?'/'+seg:'';function tags(){var cs=document.querySelectorAll('.sub-card');for(var i=0;i<cs.length;i++){var c=cs[i];if(c.__tags)continue;var sp=c.querySelector('.sub-specs');if(!sp)continue;c.__tags=1;var w=document.createElement('div');w.className='ca-tags';var av=c.querySelector('.sub-media .sub-avail'),fu=c.querySelectorAll('.sub-media .sub-fuels .sub-fuel');if(av)w.appendChild(av);for(var j=0;j<fu.length;j++)w.appendChild(fu[j]);var fw=c.querySelector('.sub-media .sub-fuels');if(fw&&!fw.children.length)fw.style.display='none';if(w.children.length)sp.parentNode.insertBefore(w,sp.nextSibling);}}function dec(){tags();var as=document.querySelectorAll('.sub-card a.sub-det');for(var i=0;i<as.length;i++){var a=as[i],c=a.closest('.sub-card');if(!c||c.__cmp)continue;c.__cmp=1;var m=(a.getAttribute('href')||'').match(/\\/berelheto-auto\\/([a-z0-9-]+?)-berles\\/?$/);if(!m||!P[m[1]])continue;var row=document.createElement('div');row.className='ca-row';a.parentNode.insertBefore(row,a);row.appendChild(a);var x=document.createElement('a');x.className='ca-cmp';x.href=pre+'/auto-osszehasonlitas/?a='+m[1]+'&b='+P[m[1]];x.innerHTML='<b>⇄</b>'+L;x.addEventListener('click',function(e){e.stopPropagation();});row.appendChild(x);}}var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(dec,120);}).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState!=='loading')dec();else document.addEventListener('DOMContentLoaded',dec);})();</script>`;
  return h.replace(/<\/body>/i, js + '</body>');
}

function fix(p) {
  let h = fs.readFileSync(p, 'utf8');
  const o = h;
  if (h.includes('id="ca-perf"')) return;
  h = renameRental(p, h);
  h = addCompare(p, h);

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
  console.log(`[perf] ${files} oldal, módosítva ${changed} · font ${fonts} · css ${css} · videó ${vids}`);
} catch (e) { console.log('[perf] hiba: ' + (e && e.message)); }
process.exit(0);
