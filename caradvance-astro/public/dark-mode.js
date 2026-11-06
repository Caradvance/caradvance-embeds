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
    'html.ca-dark ::placeholder{color:#7D8796;opacity:1}','html.ca-dark .caf-f:not(:focus-within) input::placeholder,html.ca-dark .caf-f:not(:focus-within) textarea::placeholder{color:transparent}',
    'html.ca-dark option,html.ca-dark optgroup{background-color:#12151B;color:#E8EBF0}',
    'html.ca-dark hr{border-color:#2B313C}',
    'html.ca-dark .cstage{background-color:#B4BAC2!important}','html.ca-dark .caf-aseg,html.ca-dark .caf-cseg,html.ca-dark .caf-aseg.dm-s,html.ca-dark .caf-cseg.dm-s{background-color:#0E1116!important}','html.ca-dark .caf-aseg>button.on,html.ca-dark .caf-cseg>button.on,html.ca-dark .caf-aseg>button.on.dm-s,html.ca-dark .caf-cseg>button.on.dm-s{background-color:#2B313C!important}','html.ca-dark .caf-reqp,html.ca-dark .caf-reqp.dm-s{background-color:#2C1A1F!important}',
    'html.ca-dark .dm-inv{background-color:#F1F3F6!important;color:#0D0F13!important}',
    'html.ca-dark .dm-nb{mix-blend-mode:normal!important}',
    'html.ca-dark .dm-wb{background-color:#fff!important;border-radius:12px}',
    'html.ca-dark .dm-sk{stroke:#E8EBF0!important}',
    'html.ca-dark .dm-fl{fill:#E8EBF0!important}',
    'html.ca-dark .dm-in{background-color:transparent!important;border-color:transparent!important;box-shadow:none!important}',
    'html.ca-dark .cs-in{background-image:linear-gradient(#12151B,#12151B),linear-gradient(120deg,#E2001A,#FF8A3D 50%,#7C5CFF)!important}',
    'html.ca-dark .cs-in input{background-color:transparent!important;border-color:transparent!important}',
    'html.ca-dark .dm-dot{background-color:rgba(255,255,255,.55)!important}',
    'html.ca-dark .burger span,html.ca-dark .burger i{background-color:#fff!important}',
    'html.ca-dark .dm-mono{filter:brightness(0) invert(1)!important}',
    'html.ca-dark .card.charity{background:linear-gradient(135deg,#2B1017 0%,#1B1E26 55%,#1B1E26 100%)!important;border:1px solid rgba(226,0,26,.35)!important;box-shadow:0 24px 60px rgba(0,0,0,.45)!important}',
    'html.ca-dark .card.charity .org-logo{background-color:#fff!important;border-color:#fff!important}',
    'html.ca-dark .card.charity .org-logo.org-sos{background-color:#009DE0!important}',
    'html.ca-dark [class*="dots"] > i,html.ca-dark [class*="dots"] > span,html.ca-dark [class*="dots"] > button{background-color:rgba(11,11,13,.3)!important}',
    'html.ca-dark .dm-dl > i,html.ca-dark .dm-dl > span,html.ca-dark .dm-dl > button{background-color:rgba(255,255,255,.5)!important}',
    'html.ca-dark [class*="dots"] > .on,html.ca-dark [class*="dots"] > .active,html.ca-dark [class*="dots"] > [aria-current="true"]{background-color:#E2001A!important}'
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
  // sötét háttéren olvashatóvá világosított színes szöveg (pl. piros kiemelés)
  function lighten(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s2 = 0, l = (mx + mn) / 2;
    if (mx !== mn) { var dd = mx - mn; s2 = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6; }
    l = Math.max(l, 0.66);
    return 'hsl(' + Math.round(h * 360) + ',' + Math.round(Math.min(1, s2 + 0.1) * 100) + '%,' + Math.round(l * 100) + '%)';
  }
  // fehér hátterű fotókeret (autófotó) — fehér marad, hogy a kép egybeolvadjon vele
  function isPhotoBox(el) {
    if (el === document.body) return false;
    var im = el.querySelector('img');
    if (!im) return false;
    var src = im.getAttribute('src') || '';
    if (/logo|brand-|bl-|badge|icon|flag/i.test(src)) return false;
    return (el.textContent || '').replace(/\s+/g, '').length <= 3;
  }
  // ha az oldal saját CSS-e !important-tal felülírja az osztályainkat, inline !important-tal érvényesítjük
  function enforce(el) {
    var cl = el.classList, cs2 = getComputedStyle(el), want = null;
    if (cl.contains('dm-s') || cl.contains('dm-s2')) { var b2 = rgba(cs2.backgroundColor); if (b2 && lum(b2) > 0.5) { if (!el.hasAttribute('data-dmbg')) el.setAttribute('data-dmbg', el.style.getPropertyValue('background-color') || ''); el.style.setProperty('background-color', cl.contains('dm-s') ? '#161A21' : '#1C2129', 'important'); } }
    if (cl.contains('dm-t') || cl.contains('dm-t2')) { var c2 = rgba(cs2.color); if (c2 && lum(c2) < 0.5) { if (!el.hasAttribute('data-dmc')) el.setAttribute('data-dmc', el.style.getPropertyValue('color') || ''); el.style.setProperty('color', cl.contains('dm-t') ? '#E8EBF0' : '#A3ADBC', 'important'); el.style.setProperty('-webkit-text-fill-color', 'currentColor', 'important'); } }
    if (cl.contains('dm-b')) { var d2 = rgba(cs2.borderTopColor); if (d2 && lum(d2) > 0.6 && sat(d2) < 40) el.style.setProperty('border-color', '#2B313C', 'important'); }
  }
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

  var WHITE = [
    [/\/(brand-bmw\.png|bmw-hero-logo\.png)/, '/bl-bmw.webp'],
    [/\/(brand-mercedes\.png|mb-star\.webp)/, '/bl-mercedes.webp'],
    [/\/audi(\/audi)?-logo\.webp/, '/bl-audi.webp'],
    [/\/(mini-logo\.webp|mini-hero-logo\.webp)/, '/bl-mini.webp'],
    [/\/hasznaltauto-hu-dark\.png/, '/hasznaltauto-hu.png'],
    [/\/mobile-de-mark\.png/, '/mobile-de.webp']
  ];
  function fixImg(img) {
    var s = img.getAttribute('src') || '';
    if (img.dataset.dm) return;
    var ics = getComputedStyle(img);
    if (ics.mixBlendMode === 'multiply' && img.parentElement && darkBehind(img.parentElement)) { img.classList.add('dm-nb'); var ip = img.parentElement; if (ip.offsetWidth * ip.offsetHeight <= img.offsetWidth * img.offsetHeight * 1.6) ip.classList.add('dm-wb'); else img.classList.add('dm-wb'); }
    var flt = ics.filter || '';
    if (/brightness\(0\)/.test(flt) && !/invert/.test(flt) && darkBehind(img.parentElement || img)) { img.classList.add('dm-mono'); img.dataset.dm = 'mono'; return; }
    if (/\/caradvance-logo\.webp/.test(s)) { img.dataset.dm = s; img.setAttribute('src', s.replace('caradvance-logo.webp', 'caradvance-logo-white.webp')); return; }
    if (/\/bl-[a-z0-9-]+-dark\.webp/.test(s)) { img.dataset.dm = s; img.setAttribute('src', s.replace('-dark.webp', '.webp')); return; }
    if (!darkBehind(img.parentElement || img)) return;
    for (var i = 0; i < WHITE.length; i++) {
      if (WHITE[i][0].test(s)) { img.dataset.dm = s; img.setAttribute('src', s.replace(/^(https?:\/\/[^/]+)?\/.*$/, function (all, origin) { return (origin || '') + WHITE[i][1]; })); return; }
    }
    if (/brand-porsche\.png|euroleasing|merkantil/.test(s)) { img.classList.add('dm-mono'); img.dataset.dm = 'mono'; }
  }
  function unfixImgs() {
    document.querySelectorAll('img[data-dm]').forEach(function (img) {
      var o = img.dataset.dm;
      if (o === 'mono') img.classList.remove('dm-mono'); else img.setAttribute('src', o);
      delete img.dataset.dm;
    });
  }

  function scan(root) {
    if (!d.classList.contains('ca-dark')) return;
    var els = root ? [root].concat([].slice.call(root.querySelectorAll('*'))) : document.body.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('.cstage')) continue;
      if (SKIP[el.tagName]) { if (el.tagName === 'IMG') fixImg(el); continue; }
      if (/dots/.test(typeof el.className === 'string' ? el.className : '')) { if (darkBehind(el)) el.classList.add('dm-dl'); else el.classList.remove('dm-dl'); }
      var inSvg = el instanceof SVGElement;
      if (inSvg) {
        var scs = getComputedStyle(el), host = el.ownerSVGElement || el;
        var sk = rgba(scs.stroke), fl = rgba(scs.fill);
        if (el.tagName.toLowerCase() === 'svg') { var sbg = rgba(scs.backgroundColor); if (sbg && sbg.a > 0.35 && sat(sbg) < 40 && lum(sbg) > 0.82 && darkBehind(el.parentElement || el)) el.classList.add('dm-s2'); var scol = rgba(scs.color); if (scol && sat(scol) < 45 && lum(scol) < 0.45 && darkBehind(el)) el.classList.add('dm-t'); }
        var dk = function (x) { return x && x.a > 0.3 && sat(x) < 45 && lum(x) < 0.3; };
        if ((dk(sk) || dk(fl)) && darkBehind(host.parentElement || host)) { if (dk(sk)) el.classList.add('dm-sk'); if (dk(fl)) el.classList.add('dm-fl'); }
        continue;
      }
      var cs = getComputedStyle(el);
      var bg = rgba(cs.backgroundColor);
      if (bg && bg.a > 0.35 && sat(bg) < 40 && lum(bg) > 0.82) {
        if (!isPhotoBox(el)) el.classList.add(lum(bg) > 0.95 ? 'dm-s' : 'dm-s2');
      } else if (bg && bg.a > 0.5 && sat(bg) < 40 && lum(bg) < 0.3 && el.offsetWidth > 0 && el.offsetWidth <= 14 && el.offsetHeight <= 14 && darkBehind(el.parentElement || el)) {
        el.classList.add('dm-dot');
      }
      if (bg && bg.a > 0.6 && sat(bg) < 40 && lum(bg) < 0.12 && el.offsetWidth > 16 && el.offsetWidth <= 90 && el.offsetHeight <= 90) { var tx = (el.textContent || '').trim(); if (tx.length >= 1 && tx.length <= 3 && darkBehind(el.parentElement || el)) el.classList.add('dm-inv'); }
      var bi = cs.backgroundImage;
      var solid = bi && bi.match(/linear-gradient\((rgb\(2[3-5]\d, 2[3-5]\d, 2[3-5]\d\)), \1\)/);
      if (solid && !el.hasAttribute('data-dmbi')) {
        el.setAttribute('data-dmbi', el.style.getPropertyValue('background-image') || '');
        el.style.setProperty('background-image', bi.replace(solid[0], 'linear-gradient(#12151B, #12151B)'), 'important');
        el.querySelectorAll('input,textarea').forEach(function (x) { x.classList.add('dm-in'); });
      }
      if (bi && bi.indexOf('gradient') >= 0 && bi.indexOf('url(') < 0) {
        var cols = bi.match(/rgba?\([^)]+\)/g) || [];
        if (cols.length && cols.every(function (c) { var x = rgba(c); return x && (x.a < 0.2 || (lum(x) > 0.82 && sat(x) < 40)); })) el.classList.add('dm-g');
      }
      var bc = rgba(cs.borderTopColor);
      if (bc && parseFloat(cs.borderTopWidth) > 0 && lum(bc) > 0.78 && sat(bc) < 40) el.classList.add('dm-b');
      enforce(el);
      var c = rgba(cs.color);
      if (c && c.a > 0.3 && sat(c) < 45) {
        var L = lum(c);
        if (L < 0.5 && darkBehind(el)) el.classList.add(L < 0.3 ? 'dm-t' : 'dm-t2');
      } else if (c && c.a > 0.3 && lum(c) < 0.42 && !el.hasAttribute('data-dmc') && darkBehind(el)) {
        el.setAttribute('data-dmc', el.style.getPropertyValue('color') || '');
        el.style.setProperty('color', lighten(c), 'important');
      }
      if (el.classList.contains('dm-t') || el.classList.contains('dm-t2')) enforce(el);
    }
  }

  // :hover / :focus / aktív állapotok világos háttereinek felülírása (ezeket a pásztázás nem látja)
  var probe = null;
  function resolve(v) {
    if (!v) return null;
    if (!probe) { probe = document.createElement('i'); probe.style.display = 'none'; document.body.appendChild(probe); }
    probe.style.color = ''; probe.style.color = v;
    return rgba(getComputedStyle(probe).color);
  }
  function splitSel(sel) { var out = [], depth = 0, cur = ''; for (var i = 0; i < sel.length; i++) { var ch = sel[i]; if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(function (x) { return x.trim(); }).filter(Boolean); }
  function pre(sel) { return /^html\b/.test(sel) ? sel.replace(/^html/, 'html.ca-dark') : (/^:root/.test(sel) ? sel.replace(/^:root/, 'html.ca-dark') : 'html.ca-dark ' + sel); }
  var STATE = /:hover|:focus|:active|:checked|\.active\b|\.open\b|\.is-|\.on\b|\.sel\b|\[aria-(selected|expanded|current|pressed)/;
  var sheetDone = false;
  function sheetPass() {
    if (sheetDone || !document.body) return; sheetDone = true;
    var rules = [];
    function walk(list) { for (var i = 0; i < list.length; i++) { var r = list[i]; if (r.cssRules && !r.selectorText) { try { walk(r.cssRules); } catch (e) {} } else if (r.selectorText && (STATE.test(r.selectorText) || /::?(before|after)/.test(r.selectorText))) rules.push(r); } }
    for (var i = 0; i < document.styleSheets.length; i++) { var sh = document.styleSheets[i]; if (sh.ownerNode && sh.ownerNode.id && sh.ownerNode.id.indexOf('ca-dark') === 0) continue; try { walk(sh.cssRules); } catch (e) {} }
    var out = [];
    rules.forEach(function (r) {
      if (/dots?\b/i.test(r.selectorText)) return;
      if (/::?(before|after)/.test(r.selectorText) && !STATE.test(r.selectorText.replace(/::?(before|after)/g, ''))) { var pb = resolve(r.style.getPropertyValue('background-color')); if (pb && pb.a > 0.35 && sat(pb) < 40 && lum(pb) > 0.82) out.push(splitSel(r.selectorText).map(pre).join(',') + '{background-color:#3A414D!important}'); return; }
      var st = r.style, decl = [];
      var bgv = st.getPropertyValue('background-color'), bgc = resolve(bgv);
      if (bgc && bgc.a > 0.35 && sat(bgc) < 40 && lum(bgc) > 0.82) decl.push('background-color:' + (lum(bgc) > 0.95 ? '#232833' : '#262C37') + '!important');
      var bim = st.getPropertyValue('background-image');
      if (bim && bim.indexOf('gradient') >= 0 && bim.indexOf('url(') < 0) { var cols = bim.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b/gi) || []; if (cols.length && cols.every(function (x) { var q = resolve(x); return q && (q.a < 0.2 || (lum(q) > 0.82 && sat(q) < 40)); })) decl.push('background-image:none!important;background-color:#232833!important'); }
      var cc = resolve(st.getPropertyValue('color'));
      if (cc && cc.a > 0.3 && lum(cc) < 0.42) decl.push('color:' + (sat(cc) < 45 ? '#F1F3F6' : lighten(cc)) + '!important');
      var bdc = resolve(st.getPropertyValue('border-top-color'));
      if (bdc && lum(bdc) > 0.78 && sat(bdc) < 40) decl.push('border-color:#3A414D!important');
      if (decl.length) out.push(splitSel(r.selectorText).map(pre).join(',') + '{' + decl.join(';') + '}');
    });
    var st2 = document.createElement('style'); st2.id = 'ca-dark-states'; st2.textContent = out.join('\n'); document.head.appendChild(st2);
  }

  var pending = null;
  var obs = new MutationObserver(function (muts) {
    if (!d.classList.contains('ca-dark')) return;
    muts.forEach(function (m) {
      if (m.type === 'attributes') {
        var t = m.target;
        if (m.attributeName === 'class') { var strip = function (v) { return (v || '').replace(/(^|\s)dm-\S+/g, ' ').replace(/\s+/g, ' ').trim(); }; if (strip(m.oldValue) === strip(t.getAttribute('class'))) return; }
        if (m.attributeName === 'style' && (t.hasAttribute('data-dmc') || t.hasAttribute('data-dmbi') || t.hasAttribute('data-dmbg') || /dm-/.test(t.getAttribute('class') || ''))) return;
        if (t.nodeType === 1 && !(t instanceof SVGElement)) (pending || (pending = [])).push(t);
        return;
      }
      m.addedNodes && m.addedNodes.forEach(function (n) { if (n.nodeType === 1) (pending || (pending = [])).push(n); });
    });
    if (pending && !scan._raf) scan._raf = requestAnimationFrame(function () {
      scan._raf = 0; var list = pending; pending = null;
      var seen = []; list.forEach(function (n) { if (!n.isConnected || seen.indexOf(n) >= 0) return; seen.push(n); if (n.tagName === 'IMG') fixImg(n); else scan(n); });
    });
  });

  function clearAll() {
    ['dm-s', 'dm-s2', 'dm-g', 'dm-t', 'dm-t2', 'dm-b', 'dm-dl', 'dm-dot', 'dm-sk', 'dm-fl', 'dm-in', 'dm-inv', 'dm-nb', 'dm-wb'].forEach(function (k) {
      document.querySelectorAll('.' + k).forEach(function (e) { e.classList.remove(k); });
    });
    unfixImgs();
    document.querySelectorAll('[data-dmc]').forEach(function (e) { var o = e.getAttribute('data-dmc'); e.style.removeProperty('color'); if (o) e.style.setProperty('color', o); e.removeAttribute('data-dmc'); });
    document.querySelectorAll('[data-dmbg]').forEach(function (e) { var o = e.getAttribute('data-dmbg'); e.style.removeProperty('background-color'); e.style.removeProperty('border-color'); if (o) e.style.setProperty('background-color', o); e.removeAttribute('data-dmbg'); });
    document.querySelectorAll('[data-dmbi]').forEach(function (e) { var o = e.getAttribute('data-dmbi'); e.style.removeProperty('background-image'); if (o) e.style.setProperty('background-image', o); e.removeAttribute('data-dmbi'); });
    var st2 = document.getElementById('ca-dark-states'); if (st2) st2.disabled = true;
  }
  function apply() {
    if (mq.matches) {
      d.classList.add('ca-dark');
      var st3 = document.getElementById('ca-dark-states'); if (st3) st3.disabled = false;
      if (document.body) { sheetPass(); scan(); obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'], attributeOldValue: true }); setTimeout(function () { scan(); }, 1200); }
    } else {
      obs.disconnect(); d.classList.remove('ca-dark'); clearAll();
    }
  }
  if (mq.matches) d.classList.add('ca-dark');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.addEventListener('load', function () { if (mq.matches) { sheetDone = false; var o = document.getElementById('ca-dark-states'); if (o) o.remove(); sheetPass(); scan(); } });
  if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
})();
