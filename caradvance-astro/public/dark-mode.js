/* CarAdvance — automatikus sötét mód (a készülék beállítását követi). Teszt: csak caradvance.hu /en/ oldalak. */
(function () {
  var d = document.documentElement;
  var host = location.hostname.replace(/^www\./, '');
  if (host !== 'caradvance.hu' || !/^\/en(\/|$)/.test(location.pathname)) return;
  if (!window.matchMedia) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  var CSS = [
    'html.ca-dark{color-scheme:dark;--ink:#E8EBF0;--muted:#A3ADBC;--line:#2B313C;--bg:#0D0F13;--soft:#1A1E26}',
    'html.ca-dark,html.ca-dark body{background-color:#0D0F13!important;color:#E8EBF0}',
    'html.ca-dark .dm-s{background-color:#161A21!important}',
    'html.ca-dark .dm-s2{background-color:#1C2129!important}',
    'html.ca-dark .dm-g{background-image:none!important;background-color:#161A21!important}',
    'html.ca-dark .dm-t{color:#E8EBF0!important}',
    'html.ca-dark .dm-t2{color:#A3ADBC!important}',
    'html.ca-dark .dm-b{border-color:#2B313C!important}',
    'html.ca-dark input:not([type=checkbox]):not([type=radio]):not([type=range]),html.ca-dark select,html.ca-dark textarea{background-color:#12151B!important;color:#E8EBF0!important;border-color:#343B47!important}',
    'html.ca-dark select:disabled{color:#7D8796!important}',
    'html.ca-dark ::placeholder{color:#7D8796!important;opacity:1}',
    'html.ca-dark option,html.ca-dark optgroup{background-color:#12151B;color:#E8EBF0}',
    'html.ca-dark .dm-chip{background-color:#F2F4F7!important;border-radius:10px;padding:4px 8px;box-sizing:content-box}',
    'html.ca-dark hr{border-color:#2B313C}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'ca-dark-css';
  style.textContent = CSS;
  (document.head || d).appendChild(style);

  function rgba(c) {
    var m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function lum(c) { return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255; }
  function sat(c) { return Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b); }
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, LINK: 1, META: 1, TEMPLATE: 1, BR: 1, IMG: 1, VIDEO: 1, SOURCE: 1, PICTURE: 1, IFRAME: 1, CANVAS: 1 };

  // a legközelebbi nem átlátszó háttér sötét-e (átalakítás után)
  function darkBehind(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n === document.body || n === d) return true;
      var cl = n.classList;
      if (cl.contains('dm-s') || cl.contains('dm-s2') || cl.contains('dm-g')) return true;
      var cs = getComputedStyle(n);
      var bg = rgba(cs.backgroundColor);
      if (bg && bg.a > 0.35) return lum(bg) < 0.45;
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && n !== el) return true; // fotó / sötét átmenet
    }
    return true;
  }

  function fixImg(img) {
    var s = img.getAttribute('src') || '';
    if (img.dataset.dm) return;
    if (/\/caradvance-logo\.webp/.test(s)) { img.dataset.dm = s; img.setAttribute('src', s.replace('caradvance-logo.webp', 'caradvance-logo-white.webp')); return; }
    if (/\/bl-[a-z0-9-]+-dark\.webp/.test(s)) { img.dataset.dm = s; img.setAttribute('src', s.replace('-dark.webp', '.webp')); return; }
    if (/brand-[a-z-]+\.png|euroleasing|merkantil|bmw-hero-logo|mini-logo|mb-star|audi-logo/.test(s) && darkBehind(img.parentElement || img)) { img.classList.add('dm-chip'); img.dataset.dm = 'chip'; }
  }
  function unfixImgs() {
    document.querySelectorAll('img[data-dm]').forEach(function (img) {
      var o = img.dataset.dm;
      if (o === 'chip') img.classList.remove('dm-chip'); else img.setAttribute('src', o);
      delete img.dataset.dm;
    });
  }

  function scan(root) {
    if (!d.classList.contains('ca-dark')) return;
    var els = (root || document.body).querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (SKIP[el.tagName]) { if (el.tagName === 'IMG') fixImg(el); continue; }
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      var cs = getComputedStyle(el);
      var bg = rgba(cs.backgroundColor);
      if (bg && bg.a > 0.35 && sat(bg) < 40 && lum(bg) > 0.82) el.classList.add(lum(bg) > 0.95 ? 'dm-s' : 'dm-s2');
      var bi = cs.backgroundImage;
      if (bi && bi.indexOf('gradient') >= 0 && bi.indexOf('url(') < 0) {
        var cols = bi.match(/rgba?\([^)]+\)/g) || [];
        if (cols.length && cols.every(function (c) { var x = rgba(c); return x && (x.a < 0.2 || (lum(x) > 0.82 && sat(x) < 40)); })) el.classList.add('dm-g');
      }
      var bc = rgba(cs.borderTopColor);
      if (bc && parseFloat(cs.borderTopWidth) > 0 && lum(bc) > 0.78 && sat(bc) < 40) el.classList.add('dm-b');
      var c = rgba(cs.color);
      if (c && c.a > 0.3 && sat(c) < 45) {
        var L = lum(c);
        if (L < 0.5 && darkBehind(el)) el.classList.add(L < 0.3 ? 'dm-t' : 'dm-t2');
      }
    }
  }

  var pending = null;
  var obs = new MutationObserver(function (muts) {
    if (!d.classList.contains('ca-dark')) return;
    muts.forEach(function (m) { m.addedNodes && m.addedNodes.forEach(function (n) { if (n.nodeType === 1) (pending || (pending = [])).push(n); }); });
    if (pending && !scan._raf) scan._raf = requestAnimationFrame(function () {
      scan._raf = 0; var list = pending; pending = null;
      list.forEach(function (n) { if (n.isConnected) { if (n.tagName === 'IMG') fixImg(n); else { scan(n.parentElement || n); } } });
    });
  });

  function clearAll() {
    ['dm-s', 'dm-s2', 'dm-g', 'dm-t', 'dm-t2', 'dm-b'].forEach(function (k) {
      document.querySelectorAll('.' + k).forEach(function (e) { e.classList.remove(k); });
    });
    unfixImgs();
  }
  function apply() {
    if (mq.matches) {
      d.classList.add('ca-dark');
      if (document.body) { scan(); obs.observe(document.body, { childList: true, subtree: true }); setTimeout(function () { scan(); }, 1200); }
    } else {
      obs.disconnect(); d.classList.remove('ca-dark'); clearAll();
    }
  }
  if (mq.matches) d.classList.add('ca-dark');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.addEventListener('load', function () { if (mq.matches) scan(); });
  if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
})();
