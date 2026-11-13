// Build lépés: „prémium” finomságok a magyar főoldalon (CSAK dist/index.html). Idempotens.
//  1) megjelenési animációk görgetéskor (a meglévő .reveal-re építve, lépcsőzetesen) + felpörgő számok a statisztikákon
//  2) fényes kártyák: a kurzort követő piros fényfolt; csillanás a gombokon
//  3) „Így dolgozunk” idővonal: görgetésre kirajzolódó piros fényvonal, a lépésszámok sorban kigyulladnak
//  4) bizalmi sáv a fejlécben a gombok alatt
// A „kevesebb mozgás” rendszerbeállításnál az animációk kimaradnak.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');
// megjelenési animáció stílusa: 'mask' | 'tilt' | 'words'
const REVEAL = 'tilt';

const TRUST = '<div class="ca-trust" data-dm-skip>'
  + '<span><em class="ca-stars">★★★★★</em><b>5,0</b> Google-értékelés</span><i></i>'
  + '<span><b>5000+</b> eladott prémium autó</span><i></i>'
  + '<span><b>1 év</b> szavatosság minden autóra</span><i></i>'
  + '<span><b>2003</b> óta a piacon</span></div>';

const CSS = '<style id="ca-dark-extras-css">'
  // 1) megjelenés görgetéskor — három stílus (html[data-ca-rv]): mask = alulról „kinyíló” maszk,
  //    tilt = 3D felbillenés, words = címek szavanként + kártyák sima felcsúszással. Lépcsőzetes késleltetés: --rd
  + 'html[data-ca-rv] .cah .reveal,html[data-ca-rv] .ca-rv{transition-delay:var(--rd,0s)!important}'
  // (maszk, nem clip-path: a teljesen levágott elemet a böngésző „nem láthatónak” veszi, és el sem indulna a megjelenés)
  + 'html[data-ca-rv=mask] .cah .reveal,html[data-ca-rv=mask] .ca-rv{opacity:0;transform:translateY(26px);-webkit-mask-image:linear-gradient(#000,#000);mask-image:linear-gradient(#000,#000);-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:0 100%;mask-position:0 100%;-webkit-mask-size:100% 0%;mask-size:100% 0%;transition:-webkit-mask-size 1s cubic-bezier(.7,0,.2,1),mask-size 1s cubic-bezier(.7,0,.2,1),transform 1s cubic-bezier(.2,.7,.2,1),opacity .3s}'
  + 'html[data-ca-rv=mask] .cah .reveal.in,html[data-ca-rv=mask] .ca-rv.in{opacity:1;transform:none;-webkit-mask-size:100% 100%;mask-size:100% 100%}'
  + 'html[data-ca-rv=tilt] .cah .reveal,html[data-ca-rv=tilt] .ca-rv{opacity:0;transform:perspective(1000px) rotateX(16deg) translateY(46px);transform-origin:50% 100%;transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform 1.05s cubic-bezier(.16,.84,.3,1)}'
  + 'html[data-ca-rv=tilt] .cah .reveal.in,html[data-ca-rv=tilt] .ca-rv.in{opacity:1;transform:none}'
  + 'html[data-ca-rv=words] .cah .reveal,html[data-ca-rv=words] .ca-rv{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}'
  + 'html[data-ca-rv=words] .cah .reveal.in,html[data-ca-rv=words] .ca-rv.in{opacity:1;transform:none}'
  + 'html[data-ca-rv=words] .cah .reveal.ca-words{opacity:1;transform:none}'
  + '.ca-words .ca-w{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.08em;margin-bottom:-.08em}'
  + '.ca-words .ca-w>span{display:inline-block;transform:translateY(110%);transition:transform .85s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--wi,0)*70ms)}'
  + '.ca-words.in .ca-w>span{transform:none}'
  // 2) fényes kártyák
  + '.ca-spot{position:relative;isolation:isolate}'
  + '.ca-spot::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;opacity:0;transition:opacity .35s;'
  + 'background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(226,0,26,.17),transparent 46%)}'
  + '.ca-spot:hover::after{opacity:1}'
  + '.ca-spot{transition:border-color .35s,box-shadow .35s,transform .35s}'
  + '.ca-spot:hover{border-color:rgba(255,70,90,.35)!important;box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 0 1px rgba(226,0,26,.12)!important;transform:translateY(-3px)}'
  // csillanás a gombokon
  + '.ca-shine{position:relative;overflow:hidden;isolation:isolate}'
  + '.ca-shine::after{content:"";position:absolute;top:-20%;bottom:-20%;left:-60%;width:40%;pointer-events:none;transform:skewX(-20deg) translateX(0);'
  + 'background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);transition:transform .8s cubic-bezier(.2,.7,.2,1)}'
  + '.ca-shine:hover::after{transform:skewX(-20deg) translateX(420%)}'
  // 3) idővonal
  + '#miert .ca-tl{position:relative;height:12px;margin:34px 0 -16px}'
  + '#miert .ca-tl-track{position:absolute;left:var(--x0,0);right:var(--x1,0);top:5px;height:2px;border-radius:2px;background:rgba(255,255,255,.1)}'
  + '#miert .ca-tl-fill{position:absolute;left:var(--x0,0);top:5px;height:2px;width:var(--w,0px);border-radius:2px;transition:width .7s cubic-bezier(.2,.7,.2,1);'
  + 'background:linear-gradient(90deg,rgba(226,0,26,.4),#ff2a40);box-shadow:0 0 14px 2px rgba(226,0,26,.6)}'
  + '#miert .ca-tl-dot{position:absolute;top:0;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#2B313C;border:2px solid #0D0F13;transition:background .4s,box-shadow .4s}'
  + '#miert .ca-tl-dot.on{background:#ff2a40;box-shadow:0 0 0 4px rgba(226,0,26,.18),0 0 16px rgba(226,0,26,.8)}'
  + '#miert .ic-num{background-color:#F1F3F6!important;color:#0D0F13!important;transition:background-color .45s,color .45s,box-shadow .45s,transform .45s}'
  + '#miert .card.ca-on .ic-num{background-color:#e2001a!important;color:#fff!important;box-shadow:0 0 0 6px rgba(226,0,26,.14),0 8px 26px rgba(226,0,26,.55);transform:scale(1.06)}'
  + '#miert .card.ca-on{border-color:rgba(255,70,90,.28)!important}'
  + '@media(max-width:960px){#miert .ca-tl{display:none}}'
  // 4) bizalmi sáv
  + 'section.hero .ca-trust{display:inline-flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:10px 16px;margin:26px auto 0;padding:10px 20px;border-radius:999px;'
  + 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:rgba(255,255,255,.78);font-size:13.5px;font-weight:500;line-height:1.3;position:relative;z-index:2}'
  + 'section.hero .ca-trust b{color:#fff;font-weight:800;margin-right:4px}'
  + 'section.hero .ca-trust .ca-stars{font-style:normal;color:#FFC83D;letter-spacing:1px;margin-right:6px;font-size:12px}'
  + 'section.hero .ca-trust i{width:4px;height:4px;border-radius:50%;background:#e2001a;box-shadow:0 0 8px rgba(226,0,26,.9)}'
  + 'section.hero:has(.ca-trust){min-height:590px}'
  + '@media(max-width:640px){section.hero .ca-trust{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;border-radius:18px;padding:12px 14px;font-size:12px;text-align:left;margin-top:22px}'
  + 'section.hero .ca-trust i{display:none}section.hero .ca-trust b{display:block}section.hero .ca-trust .ca-stars{display:block;margin:0 0 1px}}'
  + '@media(prefers-reduced-motion:reduce){html[data-ca-rv] .cah .reveal,html[data-ca-rv] .ca-rv{opacity:1!important;transform:none!important;-webkit-mask:none!important;mask:none!important;transition:none!important}.ca-words .ca-w>span{transform:none!important;transition:none!important}.ca-shine::after,.ca-spot::after{display:none}.ca-spot:hover{transform:none}#miert .ca-tl-fill{transition:none}}'
  + '</style>';

const CLIENT = function () {
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  var MODE = window.__CA_RV || '__MODE__';
  document.documentElement.setAttribute('data-ca-rv', MODE);
  ready(function () {
    // címek szavanként (csak a „words” stílusban)
    if (MODE === 'words' && !RM) [].forEach.call(document.querySelectorAll('.cah .sec-title'), function (h) {
      var wi = 0; h.classList.add('ca-words');
      (function walk(n) {
        [].slice.call(n.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var parts = c.nodeValue.split(/(\s+)/), fr = document.createDocumentFragment();
            parts.forEach(function (t) { if (!t) return; if (/^\s+$/.test(t)) { fr.appendChild(document.createTextNode(t)); return; }
              var w = document.createElement('span'); w.className = 'ca-w'; var i = document.createElement('span'); i.textContent = t; i.style.setProperty('--wi', wi++); w.appendChild(i); fr.appendChild(w); });
            c.parentNode.replaceChild(fr, c);
          } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
        });
      })(h);
    });
    // 1) lépcsőzetes késleltetés a rácsokban + a statisztikák is beúsznak
    ['.svc-grid', '.values-grid', '.rev-grid', '.stats-in'].forEach(function (sel) {
      [].forEach.call(document.querySelectorAll('.cah ' + sel + ', ' + sel), function (g) {
        [].forEach.call(g.children, function (c, i) { c.style.setProperty('--rd', (i * 0.09).toFixed(2) + 's'); });
      });
    });
    var stats = [].slice.call(document.querySelectorAll('.stats .stat'));
    stats.forEach(function (s) { s.classList.add('ca-rv'); });
    // felpörgő számok
    function countUp(el) {
      var tn = null; [].some.call(el.childNodes, function (n) { if (n.nodeType === 3 && /\d/.test(n.nodeValue)) { tn = n; return true; } });
      if (!tn || tn.__ca) return; tn.__ca = 1;
      var raw = tn.nodeValue, m = /(\d+(?:[.,]\d+)?)/.exec(raw); if (!m) return;
      var dec = (m[1].split(/[.,]/)[1] || '').length, sep = m[1].indexOf(',') > -1 ? ',' : '.', target = parseFloat(m[1].replace(',', '.'));
      if (RM) return;
      var t0 = null, D = 1600;
      function fmt(v) { var s = v.toFixed(dec); return sep === ',' ? s.replace('.', ',') : s; }
      function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); tn.nodeValue = raw.replace(m[1], fmt(target * e)); if (k < 1) requestAnimationFrame(step); }
      tn.nodeValue = raw.replace(m[1], fmt(0)); requestAnimationFrame(step);
    }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('in'); var n = e.target.querySelector('.n'); if (n) countUp(n); io.unobserve(e.target); });
    }, { threshold: 0.2 }) : null;
    stats.forEach(function (s) { if (io) io.observe(s); else s.classList.add('in'); });

    // 2) fényes kártyák (az Autóink showroom kivételével) + csillanó gombok
    var cards = [].slice.call(document.querySelectorAll('.cah .card, .stats .stat'));
    cards.forEach(function (c) { if (!c.closest('#autoink')) c.classList.add('ca-spot'); });
    if (!RM) document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.ca-spot'); if (!c) return;
      var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
    [].forEach.call(document.querySelectorAll('.btn, #autoink .ca-all, #autoink .sub-btn'), function (b) { b.classList.add('ca-shine'); });

    // 3) „Így dolgozunk” idővonal
    var sec = document.getElementById('miert'), grid = sec && sec.querySelector('.values-grid');
    if (grid) {
      var steps = [].slice.call(grid.children);
      var tl = document.createElement('div'); tl.className = 'ca-tl'; tl.setAttribute('data-dm-skip', '');
      tl.innerHTML = '<div class="ca-tl-track"></div><div class="ca-tl-fill"></div>' + steps.map(function () { return '<span class="ca-tl-dot"></span>'; }).join('');
      grid.parentNode.insertBefore(tl, grid);
      var dots = [].slice.call(tl.querySelectorAll('.ca-tl-dot')), xs = [];
      function place() {
        var tr = tl.getBoundingClientRect();
        xs = steps.map(function (s) { var b = s.querySelector('.ic-num') || s, r = b.getBoundingClientRect(); return r.left + r.width / 2 - tr.left; });
        dots.forEach(function (d, i) { d.style.left = xs[i] + 'px'; });
        tl.style.setProperty('--x0', xs[0] + 'px'); tl.style.setProperty('--x1', (tr.width - xs[xs.length - 1]) + 'px');
        upd();
      }
      function upd() {
        var lim = innerHeight * 0.72, last = -1;
        steps.forEach(function (s, i) { var on = s.getBoundingClientRect().top < lim; s.classList.toggle('ca-on', on); if (dots[i]) dots[i].classList.toggle('on', on); if (on) last = i; });
        tl.style.setProperty('--w', last < 0 ? '0px' : (xs[last] - xs[0]) + 'px');
      }
      var raf = 0; function onS() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; upd(); }); }
      addEventListener('scroll', onS, { passive: true }); addEventListener('resize', function () { place(); }); place();
      setTimeout(place, 800);
    }
  });
};

try {
  if (!fs.existsSync(FILE)) console.log('[home-extras] nincs dist/index.html');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-dark-extras-css"') > -1) console.log('[home-extras] már alkalmazva');
    else {
      // 4) bizalmi sáv: a hero gombsora után (statikus HTML, nincs elrendezés-ugrás)
      const cta = /(<div class="cta-row">[\s\S]*?<\/div>)/;
      if (cta.test(h)) h = h.replace(cta, '$1' + TRUST); else console.log('[home-extras] FIGYELEM: nincs .cta-row a heróban');
      // az idővonal lépésszámait a sötét mód automatikus átszínezése kihagyja (saját stílus)
      h = h.replace(/(<section[^>]*id="miert"[\s\S]*?<\/section>)/, (sec) => sec.replace(/class="ic ic-num([^"]*)"/g, 'class="ic ic-num$1" data-dm-skip'));
      const js = '<script id="ca-extras-js">(' + CLIENT.toString().replace('__MODE__', REVEAL) + ')();</script>';
      // a caradvance-chat.js „biztonsági hálója” 2,5 mp után minden .reveal-t láthatóvá kényszerít, ha addig egy sem
      // jelent meg — a főoldalon az animált részek lejjebb vannak, így a beúszás sosem látszana. Ez a rejtett jelző
      // mutatja neki, hogy a beúszás-kezelő működik.
      const okMark = '<i class="reveal in" hidden aria-hidden="true" data-ca-rv-ok></i>';
      h = h.replace('</head>', CSS + '</head>').replace(/<\/body>(?![\s\S]*<\/body>)/, okMark + js + '</body>');
      fs.writeFileSync(FILE, h);
      console.log('[home-extras] animációk, fényes kártyák, idővonal, bizalmi sáv a magyar főoldalon');
    }
  }
} catch (e) { console.log('[home-extras] hiba:', e.message); }
