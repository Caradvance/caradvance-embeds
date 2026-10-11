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

let files = 0, changed = 0, vids = 0, fonts = 0, css = 0;
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name === 'belso' || e.name === 'api') continue; walk(p); }
    else if (e.name.endsWith('.html')) { files++; try { fix(p); } catch (err) { /* egy oldal hibája ne állítsa meg */ } }
  }
}

function fix(p) {
  let h = fs.readFileSync(p, 'utf8');
  const o = h;
  if (h.includes('id="ca-perf"')) return;

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
  console.log(`[perf] ${files} oldal, módosítva ${changed} · font ${fonts} · css ${css} · videó ${vids}`);
} catch (e) { console.log('[perf] hiba: ' + (e && e.message)); }
process.exit(0);
