// Build lépés (a pdf-photos.mjs után): főoldal „Autóink” — 3D körhinta (coverflow), Marc, 2026-11-10.
// Minta: seorapid.co.uk csapat-karusszel — középen kiemelt kártya, két oldalt kisebb, enyhén elforgatott kártyák,
// a széleken elhalványítva, alul ‹ › nyilak; húzással / billentyűvel is lapozható.
//  · balra: a cím alatt a Bérelhető / Eladó / Bizományos fülek; jobbra: márkaválasztó logók (a /autoink/ bérelhető márkái)
//  · a régi „cw-grid-fix” (3 kártyás rács, max. 3 autó) felülírva; fülenként több autó (6 → 30), hogy a márkaszűrőnek legyen mit mutatnia
//  · minden olyan oldalon, ahol a főoldali blokk szerepel (hu, en, de, fr, uk, zh …) — a szövegek a lap nyelvén
// Hiba esetén logol, a buildet nem állítja meg. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/^(admin|auto-foto|pdf-img|i18n)$/.test(e.name)) walk(p, out); } else if (e.name === 'index.html') out.push(p); }
  return out;
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const ALIAS = { vw: 'volkswagen', mercedesbenz: 'mercedes' };
const bkey = (s) => { const n = norm(s); return ALIAS[n] || n; };
// logó-fájl és megjelenített név márkakulcsonként (a -dark változat a sötét logó világos háttérre)
const LOGO = { bmw: ['bmw', 'BMW'], mercedes: ['mercedes', 'Mercedes-Benz'], audi: ['audi', 'Audi'], mini: ['mini', 'MINI'], volkswagen: ['vw', 'Volkswagen'], cupra: ['cupra', 'CUPRA'], hyundai: ['hyundai', 'Hyundai'], man: ['man', 'MAN'], kia: ['kia', 'Kia'], seat: ['seat', 'SEAT'], volvo: ['volvo', 'Volvo'] };
const TX = {
  hu: { all: 'Összes', none: 'Ebben a kategóriában most nincs ilyen márkájú autó.', prev: 'Előző', next: 'Következő', brands: 'Márkák' },
  en: { all: 'All', none: 'No cars of this brand in this category right now.', prev: 'Previous', next: 'Next', brands: 'Brands' },
  de: { all: 'Alle', none: 'In dieser Kategorie gibt es derzeit kein Fahrzeug dieser Marke.', prev: 'Zurück', next: 'Weiter', brands: 'Marken' },
  fr: { all: 'Toutes', none: 'Aucune voiture de cette marque dans cette catégorie pour le moment.', prev: 'Précédent', next: 'Suivant', brands: 'Marques' },
  uk: { all: 'Усі', none: 'Наразі в цій категорії немає авто цієї марки.', prev: 'Назад', next: 'Далі', brands: 'Марки' },
  zh: { all: '全部', none: '该类别目前没有此品牌的车辆。', prev: '上一个', next: '下一个', brands: '品牌' },
  sk: { all: 'Všetky', none: 'V tejto kategórii momentálne nie je auto tejto značky.', prev: 'Predchádzajúce', next: 'Ďalšie', brands: 'Značky' },
  cs: { all: 'Všechny', none: 'V této kategorii momentálně není vůz této značky.', prev: 'Předchozí', next: 'Další', brands: 'Značky' },
  pl: { all: 'Wszystkie', none: 'W tej kategorii nie ma obecnie aut tej marki.', prev: 'Poprzedni', next: 'Następny', brands: 'Marki' },
  it: { all: 'Tutti', none: 'Al momento non ci sono auto di questo marchio in questa categoria.', prev: 'Precedente', next: 'Successivo', brands: 'Marchi' },
  es: { all: 'Todas', none: 'Ahora mismo no hay coches de esta marca en esta categoría.', prev: 'Anterior', next: 'Siguiente', brands: 'Marcas' }
};
const escH = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = '<style id="ca-cf3d-css">'
  // fejléc: balra cím + fülek, jobbra márkák
  + '#autoink .autok-head{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;flex-wrap:wrap}'
  + '#autoink .ah-l{display:flex;flex-direction:column;gap:14px;min-width:0}#autoink .ah-l .autok-tabs{align-self:flex-start;margin:0}'
  + '#autoink .ah-r{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;align-items:center;flex:1 1 420px}'
  + '#autoink .cf-br{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:44px;min-width:44px;padding:0 11px;border-radius:999px;border:1px solid rgba(127,127,127,.25);background:#fff;cursor:pointer;font:inherit;font-weight:700;font-size:13.5px;color:#141519;transition:.15s;box-shadow:0 2px 8px rgba(8,8,10,.05)}'
  + '#autoink .cf-br img{height:24px;width:auto;max-width:56px;display:block}#autoink .cf-br .cf-l{display:none}'
  // egyforma logó-gombok: azonos doboz, a logó a dobozba illesztve (kerek logók magasságra, széles logók szélességre)
  + '#autoink .cf-br[data-b]:not([data-b=""]){width:68px;min-width:68px;height:44px;padding:0;flex:0 0 68px}'
  + '#autoink .cf-br[data-b]:not([data-b=""]) img{width:46px;height:26px;max-width:none;object-fit:contain}'
  + '#autoink .cf-br[data-b="mercedes"] img{transform:scale(1.3)}#autoink .cf-br[data-b="volkswagen"] img,#autoink .cf-br[data-b="bmw"] img{transform:scale(1.08)}'
  + '#autoink .cf-br[data-b=""]{height:44px;padding:0 16px}'
  + '#autoink .cf-br:hover{border-color:#141519;transform:translateY(-1px)}#autoink .cf-br.on{background:#141519;border-color:#141519;color:#fff}'
  + '#autoink .cf-br.on .cf-d{display:none}#autoink .cf-br.on .cf-l{display:block}'
  + 'html.ca-dark #autoink .cf-br{background:#1b1c21;color:#fff;border-color:rgba(255,255,255,.18)}html.ca-dark #autoink .cf-br .cf-d{display:none}html.ca-dark #autoink .cf-br .cf-l{display:block}'
  + 'html.ca-dark #autoink .cf-br.on{background:#fff;color:#141519}html.ca-dark #autoink .cf-br.on .cf-l{display:none}html.ca-dark #autoink .cf-br.on .cf-d{display:block}'
  + '@media(max-width:860px){#autoink .autok-head{align-items:flex-start}#autoink .ah-r{justify-content:flex-start;max-width:none;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;width:100%}#autoink .ah-r::-webkit-scrollbar{display:none}#autoink .cf-br{flex:0 0 auto}}'
  // 3D körhinta — a régi rács-felülírás (cw-grid-fix) kioltása nagyobb specificitással
  + '#autoink .cw.cf3d{max-width:none!important;height:auto!important;min-height:0!important;margin:18px -4vw 0!important;padding:26px 0 0!important;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%)}'
  + '#autoink .cw.cf3d .cw-track{display:block!important;position:relative!important;transform:none!important;overflow:visible!important;perspective:1700px;perspective-origin:50% 40%;transform-style:preserve-3d;gap:0!important;padding:0!important;touch-action:pan-y}'
  + '#autoink .cw.cf3d .cw-item,#autoink .cw.cf3d .cw-item:nth-child(n+4){display:flex!important;position:absolute!important;top:0!important;left:50%!important;width:min(360px,80vw)!important;flex:none!important;margin:0!important;transform-origin:50% 50%;transition:transform .6s cubic-bezier(.22,.61,.36,1),opacity .45s,filter .45s!important;will-change:transform,opacity;backface-visibility:hidden}'
  + '#autoink .cw.cf3d .cw-item.cf-off{visibility:hidden}'
  + '#autoink .cw.cf3d .cw-item>.card{border-radius:20px;transition:box-shadow .45s}'
  + '#autoink .cw.cf3d .cw-item.cw-c>.card{box-shadow:0 26px 60px rgba(226,0,26,.16),0 0 0 2px rgba(226,0,26,.38)!important}'
  + '#autoink .cw.cf3d .cw-item.cf-side{filter:saturate(.92)}#autoink .cw.cf3d .cw-item.cf-side .card{cursor:pointer}'
  + '#autoink .cw.cf3d .cw-arrow{display:none!important}'
  + '#autoink .cw.cf3d .cw-track{cursor:grab}#autoink .cw.cf3d.cf-drag .cw-track{cursor:grabbing;user-select:none;-webkit-user-select:none}#autoink .cw.cf3d.cf-drag .cw-item{transition-duration:.35s!important}#autoink .cw.cf3d.cf-drag a,#autoink .cw.cf3d.cf-drag button{pointer-events:none}'
  + '#autoink .cw.cf3d .cw-track img{-webkit-user-drag:none;user-select:none}'
  // tartós bérlet kártyák (a /autoink/ #berelheto kártyái) a körhintában
  + '#autoink .cw.cf3d .cw-item.cw-tb>.sub-card{width:100%;border-radius:20px;transition:box-shadow .45s}#autoink .cw.cf3d .cw-item.cw-tb>.sub-card:hover{transform:none}'
  + '#autoink .cw.cf3d .cw-item.cw-tb.cw-c>.sub-card{box-shadow:0 26px 60px rgba(226,0,26,.16),0 0 0 2px rgba(226,0,26,.38)!important}'
  + '#autoink .cw.cf3d .cw-item.cw-tb.cf-side .sub-card{cursor:pointer}#autoink .ca-tbsrc{display:none!important}'
  + '#autoink .cf-ctl{display:flex;justify-content:center;gap:14px;margin:6px 0 4px;position:relative;z-index:5}'
  + '#autoink .cf-btn{width:52px;height:52px;border-radius:50%;border:1px solid rgba(127,127,127,.22);background:#fff;color:#141519;font-size:26px;line-height:1;cursor:pointer;box-shadow:0 10px 26px rgba(8,8,10,.14);display:flex;align-items:center;justify-content:center;transition:.15s}'
  + '#autoink .cf-btn:hover{background:#141519;color:#fff}html.ca-dark #autoink .cf-btn{background:#1b1c21;color:#fff;border-color:rgba(255,255,255,.18)}'
  + '#autoink .cf-cnt{align-self:center;font-weight:700;font-size:13px;opacity:.6;min-width:52px;text-align:center}'
  + '#autoink .cf-none{display:none;text-align:center;padding:40px 16px;font-weight:600;opacity:.75}#autoink .cf-none.on{display:block}'
  + '@media(max-width:640px){#autoink .cw.cf3d{margin:14px -6vw 0!important;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}#autoink .cf-btn{width:46px;height:46px}}'
  + '@media(prefers-reduced-motion:reduce){#autoink .cw.cf3d .cw-item{transition:none!important}}'
  + '</style>';

// a kliensoldali körhinta (window.__caCF) — a lap régi coverflow(root) függvénye ezt hívja
const CLIENT = function () {
  var L = (document.documentElement.lang || 'hu').slice(0, 2).toLowerCase(); var T = window.__CA_CF_T[L] || window.__CA_CF_T.en;
  var AL = { vw: 'volkswagen', mercedesbenz: 'mercedes', amg: 'mercedes', mercedesamg: 'mercedes', maybach: 'mercedes', alpina: 'bmw' };
  function nq(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''); }
  function brandOf(it) {
    var t = it.querySelector('.sub-title,.title'); var w = String(t ? t.textContent : '').trim().split(/[\s-]+/);
    var a = nq(w[0]), b = nq(w[0] + (w[1] || ''));
    return AL[b] || AL[a] || a;
  }
  window.__caCFBrand = window.__caCFBrand || '';
  window.__caCF = function (root) {
    var track = root.querySelector('.cw-track'); if (!track) return null;
    if (root.__cf && root.__cf.reset) { root.__cf.reset(); return root.__cf; }
    var all = [].slice.call(track.children); if (!all.length) return null;
    root.classList.add('cf3d');
    var items = all.slice(), active = 0, swiped = false;
    var none = root.parentNode.querySelector('.cf-none');
    if (!none) { none = document.createElement('div'); none.className = 'cf-none'; none.textContent = T.none; root.parentNode.insertBefore(none, root.nextSibling); }
    var ctl = root.querySelector('.cf-ctl');
    if (!ctl) {
      ctl = document.createElement('div'); ctl.className = 'cf-ctl';
      ctl.innerHTML = '<button type="button" class="cf-btn cf-p" aria-label="' + T.prev + '">&#8249;</button><span class="cf-cnt" aria-live="polite"></span><button type="button" class="cf-btn cf-n" aria-label="' + T.next + '">&#8250;</button>';
      root.appendChild(ctl);
    }
    var cnt = ctl.querySelector('.cf-cnt');
    function imp(el, k, v) { el.style.setProperty(k, v, 'important'); }
    function layout() {
      var n = items.length, W = root.clientWidth || window.innerWidth;
      all.forEach(function (it) { if (items.indexOf(it) < 0) { it.classList.add('cf-off'); it.classList.remove('cw-c', 'cf-side'); imp(it, 'opacity', '0'); it.style.pointerEvents = 'none'; } });
      var maxVis = W < 640 ? 1 : (W < 1100 ? 2 : 3);
      var step = W < 640 ? 90 : 102; // a szomszéd kártya eltolása a kártyaszélesség %-ában
      items.forEach(function (it, i) {
        var raw = i - active; if (n > 2) { if (raw > n / 2) raw -= n; if (raw < -n / 2) raw += n; }
        var ar = Math.abs(raw), s = raw < 0 ? -1 : 1, c = Math.min(ar, 3);
        var x = raw === 0 ? 0 : s * (step * Math.min(ar, 1) + (ar > 1 ? (ar - 1) * (step - 6) : 0));
        var sc = 1 - c * 0.07, rot = raw === 0 ? 0 : -s * (6 + (c - 1) * 3), z = -c * 70, y = c * 10;
        it.classList.toggle('cf-off', ar > maxVis);
        imp(it, 'transform', 'translateX(calc(-50% + ' + x + '%)) translateY(' + y + 'px) translateZ(' + z + 'px) rotateY(' + rot + 'deg) scale(' + sc + ')');
        imp(it, 'opacity', ar > maxVis ? '0' : (ar === maxVis && maxVis > 1 ? '0.55' : '1'));
        it.style.zIndex = String(100 - ar); it.style.pointerEvents = ar > maxVis ? 'none' : 'auto';
        it.classList.toggle('cw-c', ar === 0); it.classList.toggle('cf-side', ar > 0);
        it.setAttribute('aria-hidden', ar === 0 ? 'false' : 'true');
      });
      var h = 0; items.forEach(function (it) { h = Math.max(h, it.offsetHeight); });
      imp(track, 'height', (h ? h + 40 : 480) + 'px');
      none.classList.toggle('on', !n); root.style.display = n ? '' : 'none';
      cnt.textContent = n ? (active + 1) + ' / ' + n : '';
      ctl.style.visibility = n > 1 ? 'visible' : 'hidden';
    }
    function go(d) { if (!items.length) return; active = (active + d + items.length) % items.length; layout(); }
    function filter(b) {
      items = all.filter(function (it) { return !b || brandOf(it) === b; });
      all.forEach(function (it) { if (items.indexOf(it) > -1) it.classList.remove('cf-off'); });
      active = 0; layout();
    }
    ctl.querySelector('.cf-p').onclick = function () { go(-1); };
    ctl.querySelector('.cf-n').onclick = function () { go(1); };
    track.addEventListener('click', function (e) {
      if (swiped) { swiped = false; e.preventDefault(); e.stopPropagation(); return; }
      var it = e.target.closest('.cw-item'); if (!it) return; var idx = items.indexOf(it);
      if (idx > -1 && idx !== active) { e.preventDefault(); e.stopPropagation(); active = idx; layout(); }
    }, true);
    // húzás egérrel / ujjal: a mozdulat közben lapoz (kb. kártyánként ~110 px), a végén a kattintást elnyeli
    var sx = null, sy = null, lx = 0, drag = false, pid = null;
    function skip(t) { return t.closest && t.closest('.sub-gbtn,.sub-gdots,.sub-gdot,input,select,textarea,.ca-seg button'); }
    track.addEventListener('pointerdown', function (e) { if (e.button > 0 || skip(e.target)) return; sx = e.clientX; sy = e.clientY; lx = sx; drag = false; pid = e.pointerId; });
    track.addEventListener('pointermove', function (e) {
      if (sx == null || e.pointerId !== pid) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!drag) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { drag = true; root.classList.add('cf-drag'); try { track.setPointerCapture(pid); } catch (er) {} } else if (Math.abs(dy) > 14) { sx = null; return; } else return; }
      e.preventDefault();
      var st = (root.clientWidth || 800) < 640 ? 80 : 140;
      while (e.clientX - lx <= -st) { lx -= st; swiped = true; go(1); }
      while (e.clientX - lx >= st) { lx += st; swiped = true; go(-1); }
    });
    function endDrag(e) {
      if (sx == null) return; var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!swiped && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(dx < 0 ? 1 : -1); }
      if (drag) swiped = true;
      sx = null; drag = false; root.classList.remove('cf-drag'); try { track.releasePointerCapture(pid); } catch (er) {}
      setTimeout(function () { swiped = false; }, 400);
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', function () { sx = null; drag = false; root.classList.remove('cf-drag'); });
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // vízszintes görgetés (touchpad kétujjas húzás, Shift + egérgörgő)
    var wacc = 0, wlock = 0;
    root.addEventListener('wheel', function (e) {
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!d) return; e.preventDefault();
      var now = Date.now(); if (now < wlock) return;
      wacc += d; if (Math.abs(wacc) >= 40) { go(wacc > 0 ? 1 : -1); wacc = 0; wlock = now + 380; }
    }, { passive: false });
    root.tabIndex = -1; root.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
    function watchImgs() { [].forEach.call(track.querySelectorAll('img'), function (im) { if (!im.complete) im.addEventListener('load', layout, { once: true }); }); }
    function reset() {
      all = [].slice.call(track.children); active = 0;
      if (window.__caCFBrand) filter(window.__caCFBrand); else { items = all.slice(); all.forEach(function (it) { it.classList.remove('cf-off'); }); layout(); }
      watchImgs(); setTimeout(layout, 450); setTimeout(layout, 1500);
    }
    var api = { layout: layout, filter: filter, reset: reset }; root.__cf = api;
    if (window.__caCFBrand) filter(window.__caCFBrand); else layout();
    window.addEventListener('resize', layout); setTimeout(layout, 450); setTimeout(layout, 1500); window.addEventListener('load', layout);
    watchImgs();
    return api;
  };
  // márkaválasztó
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#autoink .cf-br'); if (!b) return;
    var k = b.getAttribute('data-b') || ''; window.__caCFBrand = k;
    [].forEach.call(document.querySelectorAll('#autoink .cf-br'), function (x) { var on = (x.getAttribute('data-b') || '') === k; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    [].forEach.call(document.querySelectorAll('#autoink .cw'), function (r) { if (r.__cf) r.__cf.filter(k); });
  });
  // fülváltáskor újramérés (a rejtett panelen 0 a szélesség/magasság)
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.autok-tab'); if (!t) return;
    if (t.getAttribute('data-tab') === 'berelheto' && window.__caTBrun) window.__caTBrun();
    setTimeout(function () { [].forEach.call(document.querySelectorAll('#autoink .cw'), function (r) { if (r.__cf) r.__cf.layout(); }); }, 60);
  });
};

// tartós bérlet a „Bérelhető” fülön: a lap nyelvi/piaci /autoink/ (auta, vozy …) oldalának kártyái és képei.
// A kártyákat ugyanazok a szkriptek rajzolják, mint a /autoink/#berelheto oldalon (adatok, ár, galéria, ajánlatkérő ablak),
// egy rejtett tárolóba (#sub-list); innen kerülnek át a körhintába. A szkriptek lustán futnak (a blokk közelében / a fülre kattintva).
const TB_CLIENT = function () {
  window.__caTB = 1;
  var AL = { vw: 'volkswagen', mercedesbenz: 'mercedes' };
  function bk(s) { var w = String(s || '').trim().split(/[\s-]+/); var nq = function (x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''); }; var a = nq(w[0]), b = nq(w[0] + (w[1] || '')); return AL[b] || AL[a] || a; }
  function root() { return document.getElementById('cw-berelheto'); }
  function sync() {
    var src = document.getElementById('sub-list'), r = root(); if (!src || !r) return false;
    var cards = [].slice.call(src.querySelectorAll('.sub-card')); if (!cards.length) return !!r.querySelector('.cw-tb');
    var g = {}, ord = [];
    cards.forEach(function (c) { var t = c.querySelector('.sub-title'); var k = bk(t ? t.textContent : ''); if (!g[k]) { g[k] = []; ord.push(k); } g[k].push(c); });
    var out = [], more = true; for (var i = 0; more; i++) { more = false; ord.forEach(function (k) { if (g[k][i]) { out.push(g[k][i]); more = true; } }); }
    var track = r.querySelector('.cw-track'), fr = document.createDocumentFragment();
    out.forEach(function (c) { var w = document.createElement('div'); w.className = 'cw-item cw-tb'; w.appendChild(c); fr.appendChild(w); });
    track.innerHTML = ''; track.appendChild(fr);
    if (window.__caCF) window.__caCF(r);
    return true;
  }
  function fallback() { var r = root(); if (!r || r.querySelector('.cw-tb') || !window.__caTBfb) return; r.querySelector('.cw-track').innerHTML = window.__caTBfb; if (window.__caCF) window.__caCF(r); }
  var ran = false;
  function run() {
    if (ran) return; ran = true;
    var tp = document.getElementById('ca-tb-tpl'), src = document.getElementById('sub-list'); if (!tp || !src) { fallback(); return; }
    var tm = null; try { new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(sync, 260); }).observe(src, { childList: true }); } catch (e) {}
    var oD = document.addEventListener, oW = window.addEventListener;
    function shim(orig, isWin) { return function (t, f, o) { if (t === 'DOMContentLoaded' || (isWin && t === 'load' && document.readyState === 'complete')) { setTimeout(function () { try { (typeof f === 'function' ? f : f.handleEvent).call(isWin ? window : document, new Event(t)); } catch (e) {} }, 0); return; } return orig.call(this, t, f, o); }; }
    document.addEventListener = shim(oD, false); window.addEventListener = shim(oW, true);
    var pend = 0, done = false;
    function unshim() { if (done) return; done = true; try { delete document.addEventListener; delete window.addEventListener; } catch (e) {} if (document.addEventListener !== oD) document.addEventListener = oD; if (window.addEventListener !== oW) window.addEventListener = oW; }
    try {
      [].forEach.call(tp.content.querySelectorAll('link,style,script'), function (n) {
        var tg = n.tagName.toLowerCase(), el = document.createElement(tg);
        if (tg === 'link') { el.rel = 'stylesheet'; el.href = n.getAttribute('href'); document.head.appendChild(el); return; }
        if (n.id) el.id = n.id;
        if (tg === 'script' && n.getAttribute('src')) { pend++; el.async = false; el.onload = el.onerror = function () { if (--pend <= 0) setTimeout(unshim, 50); }; el.src = n.getAttribute('src'); document.body.appendChild(el); return; }
        el.textContent = n.textContent; (tg === 'style' ? document.head : document.body).appendChild(el);
      });
    } catch (e) {}
    if (!pend) unshim(); else setTimeout(unshim, 8000);
    setTimeout(function () { if (!sync()) setTimeout(function () { if (!sync()) fallback(); }, 6000); }, 600);
  }
  window.__caTBrun = run;
  function arm() {
    var a = document.getElementById('autoink'); if (!a) return;
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); run(); } }, { rootMargin: '900px 0px' }); io.observe(a); }
    else run();
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 2500); };
    window.addEventListener('load', function () { idle(function () { run(); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
};
const TB_KEEP = /sub-|\.ca-p|\.ca-seg|\.ca-tags|\.ca-fuels|\.ca-row|\.ca-cmp|\.ab-|#ab[A-Z]|\.ca-na|\.ca-sort/;
function filterCss(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, ''); let out = '', i = 0;
  while (i < css.length) {
    const ob = css.indexOf('{', i); if (ob < 0) break; const sel = css.slice(i, ob).trim();
    let d = 1, j = ob + 1; while (j < css.length && d) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
    const body = css.slice(ob + 1, j - 1);
    if (/^@(media|supports)/.test(sel)) { const inner = filterCss(body); if (inner) out += sel + '{' + inner + '}'; }
    else if (/^@(-webkit-)?keyframes/.test(sel)) out += sel + '{' + body + '}';
    else if (!sel.startsWith('@') && TB_KEEP.test(sel)) out += sel + '{' + body + '}';
    i = j;
  }
  return out;
}
const HUBS = ['autoink', 'auta', 'vozy', 'samochody', 'fahrzeuge', 'vehicules', 'veicoli', 'vehiculos'];
// csak a kártyákhoz kellő szkriptek: ajánlatkérő ablak + konfig (__ABCFG), adatok (SUB), kártyarajzoló, galéria, összehasonlítás, kezdődátum
function tbScript(id, body) {
  if (id === 'ca-cmp' || id === 'ca-abdate') return true;
  if (/window\.__ABCFG\s*=|window\.SUB\s*=|__subGal/.test(body)) return !/video-bg/.test(body);
  return /getElementById\(['"]sub-list['"]\)/.test(body) && /sf-model/.test(body) && /sub-count/.test(body) && !/video-bg/.test(body);
}
// a tartós bérlet beépítése egy főoldalba (ha van ugyanabban a könyvtárban bérelhető-hub)
function addTartos(f, h) {
  const dir = path.dirname(f); let hub = '', hh = '';
  for (const s of HUBS) { const p = path.join(dir, s, 'index.html'); if (fs.existsSync(p)) { const x = fs.readFileSync(p, 'utf8'); if (x.indexOf('id="sub-list"') > -1 && /window\.SUB\s*=/.test(x)) { hub = s; hh = x; break; } } }
  if (!hub) return [h, ''];
  if (!/function build\(id,html\)\{/.test(h) || h.indexOf('id="panel-berelheto"') < 0) return [h, ''];
  let css = '', js = '';
  const re = /<(script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/g; let m;
  while ((m = re.exec(hh))) {
    const tag = m[1], attrs = m[2] || '', body = m[3]; const id = (attrs.match(/\sid="([^"]+)"/) || [])[1] || '';
    if (id && h.indexOf('id="' + id + '"') > -1) continue;
    if (tag === 'style') { if (/sub-|ca-pbox|ab-modal|ab-card|ca-cmp|ca-tags/.test(body)) { const c = filterCss(body); if (c) css += '<style' + (id ? ' id="' + id + '"' : '') + '>' + c + '</style>'; } continue; }
    if (/\ssrc=/.test(attrs) || (/\stype=/.test(attrs) && !/type="(text\/javascript|module)"/.test(attrs))) continue;
    if (tbScript(id, body)) js += '<script' + (id ? ' id="' + id + '"' : '') + '>' + body + '</script>';
  }
  if (!js || js.indexOf('sub-list') < 0) return [h, ''];
  // a hub saját CSS/JS fájljai, amelyek a főoldalon nincsenek (pl. /ca-bt.css + /ca-bt.js: Cég/Magán ár-kapcsoló)
  let ext = '';
  for (const lm of hh.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)) { const href = (lm[0].match(/\bhref="(\/[^"]+)"/) || [])[1]; if (href && !href.startsWith('//') && h.indexOf(href.split('?')[0]) < 0) ext += '<link rel="stylesheet" href="' + href + '">'; }
  for (const sm of hh.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"[^>]*>\s*<\/script>/g)) { const src = sm[1]; if (!src.startsWith('//') && h.indexOf(src.split('?')[0]) < 0) ext += '<script src="' + src + '"></script>'; }
  css = ext.replace(/<script[\s\S]*?<\/script>/g, '') + css; js += (ext.match(/<script[\s\S]*?<\/script>/g) || []).join('');
  // a hub rejtett célelemei (szűrő-selectek #sf-*, #sub-count, #sub-list) a főoldali bérelhető panelbe
  const li = hh.indexOf('<div id="sub-list"></div>'); const fi = li > -1 ? hh.lastIndexOf('<div class="sub-filters', li) : -1;
  if (li < 0 || fi < 0 || li - fi > 20000) return [h, ''];
  let seg = hh.slice(fi, li + '<div id="sub-list"></div>'.length);
  const extra = [...new Set([...hh.matchAll(/\sid="(sub-[a-z0-9-]+)"/g)].map((x) => x[1]))].filter((x) => seg.indexOf('id="' + x + '"') < 0 && h.indexOf('id="' + x + '"') < 0);
  const mount = '<div class="ca-tbsrc" aria-hidden="true">' + seg + extra.map((x) => '<span id="' + x + '" hidden></span>').join('') + '<span class="sub-rate" hidden></span></div>';
  h = h.replace('<div class="autok-panel" id="panel-berelheto">', '<div class="autok-panel" id="panel-berelheto">' + mount);
  h = h.replace(/function build\(id,html\)\{/, "function build(id,html){if(id==='cw-berelheto'&&window.__caTB){window.__caTBfb=html;return;}");
  // „Összes bérelhető autónk” → a tartós bérlet kínálat
  const rel = '/' + path.relative(DIST, path.join(dir, hub)).split(path.sep).join('/') + '/#berelheto';
  h = h.replace(/(<div class="autok-panel" id="panel-berelheto">[\s\S]*?<div class="autok-more"><a\b[^>]*?href=")[^"]*(")/, '$1' + rel + '$2');
  const tpl = '<template id="ca-tb-tpl">' + css + js + '</template><script id="ca-tb-js">(' + TB_CLIENT.toString() + ')();</script>';
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/i, tpl + '</body>').replace('</head>', '<script>window.__caTB=1;</script></head>');
  return [h, hub];
}

try {
  // bérelhető márkák (a /autoink/ oldal brand_totals adatából), sorrendben
  let BR = [];
  try {
    const h = fs.readFileSync(path.join(DIST, 'autoink', 'index.html'), 'utf8');
    const ord = (h.match(/"brand_order"\s*:\s*(\[[^\]]*\])/) || [])[1]; const tot = (h.match(/"brand_totals"\s*:\s*(\{[^}]*\})/) || [])[1];
    const T0 = tot ? JSON.parse(tot) : {}; const O = ord ? JSON.parse(ord) : Object.keys(T0);
    BR = O.filter((b) => +T0[b] > 0).map(bkey).filter((k, i, a) => LOGO[k] && a.indexOf(k) === i);
  } catch (e) { console.log('[home-carousel] márkák:', e.message); }
  if (!BR.length) BR = ['volkswagen', 'bmw', 'mercedes', 'mini', 'audi', 'hyundai', 'man', 'cupra'];
  let n = 0, miss = 0, tb = 0; const tbHubs = {}, tbMiss = [];
  for (const f of walk(DIST, [])) {
    let h = fs.readFileSync(f, 'utf8');
    if (h.indexOf('id="cw-elado"') < 0 || h.indexOf('function coverflow(root){') < 0 || h.indexOf('id="ca-cf3d-css"') > -1) continue;
    const lg = ((h.match(/<html[^>]*\slang="([a-zA-Z-]+)"/) || [])[1] || 'hu').slice(0, 2).toLowerCase(); const T = TX[lg] || TX.en;
    // 1) régi coverflow → az új (3D) körhinta
    const i0 = h.indexOf('function coverflow(root){'); const end = 'return {layout:layout};}'; const i1 = h.indexOf(end, i0);
    if (i1 < 0) { miss++; continue; }
    h = h.slice(0, i0) + 'function coverflow(root){return window.__caCF?window.__caCF(root):null;}' + h.slice(i1 + end.length);
    // 2) fülenként több autó
    h = h.replace('var n=db||6;', 'var n=db||30;').replace('if(!flags) return cars.slice(0,6);', 'if(!flags) return cars.slice(0,30);').replace('return k.concat(r).slice(0,6); }', 'return k.concat(r).slice(0,30); }');
    // 3) fejléc: balra cím + fülek, jobbra márkák
    const chips = '<button type="button" class="cf-br on" data-b="" aria-pressed="true">' + escH(T.all) + '</button>'
      + BR.map((k) => { const [file, name] = LOGO[k]; return '<button type="button" class="cf-br" data-b="' + k + '" aria-pressed="false" title="' + escH(name) + '"><img class="cf-d" src="/bl-' + file + '-dark.webp" alt="' + escH(name) + '" width="48" height="24" loading="lazy"><img class="cf-l" src="/bl-' + file + '.webp" alt="" width="48" height="24" loading="lazy"></button>'; }).join('');
    h = h.replace(/<div class="autok-head">\s*<div>([\s\S]*?)<\/div>\s*(<div class="autok-tabs"[^>]*>[\s\S]*?<\/div>)\s*<\/div>/, (m, left, tabs) => '<div class="autok-head"><div class="ah-l"><div>' + left + '</div>' + tabs + '</div><div class="ah-r" role="group" aria-label="' + escH(T.brands) + '">' + chips + '</div></div>');
    // 4) CSS + kliens
    h = h.replace('</head>', CSS + '<script id="ca-cf3d-js">window.__CA_CF_T=' + JSON.stringify(TX) + ';(' + CLIENT.toString() + ')();</script></head>');
    // 5) Bérelhető fül = tartós bérlet (a /autoink/ #berelheto kártyái)
    try { const [h2, hub] = addTartos(f, h); if (hub) { h = h2; tb++; tbHubs[hub] = (tbHubs[hub] || 0) + 1; } else tbMiss.push(path.relative(DIST, f)); } catch (e) { console.log('[home-carousel] tartós bérlet hiba:', f, e.message); }
    fs.writeFileSync(f, h); n++;
  }
  console.log('[home-carousel] 3D körhinta + márkaválasztó: ' + n + ' oldal' + (miss ? ' · kimaradt: ' + miss : '') + ' · márkák: ' + BR.join(','));
  console.log('[home-carousel] tartós bérlet a Bérelhető fülön: ' + tb + ' oldal ' + JSON.stringify(tbHubs) + (tbMiss.length ? ' · nincs hub: ' + tbMiss.join(', ') : ''));
} catch (e) { console.log('[home-carousel] hiba:', e && e.stack || e); }
