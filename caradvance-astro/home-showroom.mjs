// Build lépés (a home-carousel.mjs után): a magyar főoldal „Autóink” blokkja „showroom” dizájnnal.
//  · sötét, reflektorfényes színpad; az oldalsó kártyák elsötétülnek, a középső alatt tükröződés
//  · szekciófejléc: cím + alcím + „Összes … (N) →”; egy közös Cég / Magán kapcsoló a kártyánkénti helyett
//  · a körhintában legfeljebb 8 kiemelt autó (előbb az azonnal elérhetők, márkánként max. 2), pöttyös lapozó
//  · kártya: az egész kártya a részletekhez visz, egy fő gomb (Ajánlatot kérek), összehasonlítás ikonként
// CSAK a dist/index.html-t (magyar főoldal) módosítja. Hiba esetén logol, a buildet nem állítja meg. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');
const MAX = 8;

const CSS = '<style id="ca-show-css">'
  // színpad
  // a hero és a színpad egyetlen összefüggő sötét felület: nincs rés, a videó alja átúszik a színpadba
  + 'section.hero:has(+#autoink){margin-bottom:0!important;border-bottom-left-radius:0!important;border-bottom-right-radius:0!important}'
  + 'section.hero:has(+#autoink)::after{content:"";position:absolute;left:0;right:0;bottom:0;height:160px;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(23,24,29,0) 0%,rgba(23,24,29,.85) 70%,#17181d 100%)}'
  + 'section.hero:has(+#autoink) .scrolldown{z-index:2}'
  + '#autoink.ca-show{max-width:none!important;width:auto!important;box-sizing:border-box;margin:0 16px 0!important;padding:34px max(22px,calc((100% - 1240px)/2)) 34px!important;border-radius:0 0 32px 32px;position:relative;overflow:hidden;color:#fff;'
  + 'background:radial-gradient(ellipse 46% 40% at 50% 52%,rgba(255,255,255,.10),transparent 72%),radial-gradient(ellipse 38% 22% at 50% 96%,rgba(226,0,26,.22),transparent 72%),linear-gradient(180deg,#17181d 0%,#0f1013 40%,#0a0a0d 70%,#060608 100%)}'
  + '#autoink.ca-show::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(255,255,255,.018) 0 1px,transparent 1px 120px);-webkit-mask-image:linear-gradient(180deg,#000,transparent 60%);mask-image:linear-gradient(180deg,#000,transparent 60%)}'
  // fejléc
  + '#autoink .ca-sh{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin:0 0 22px;position:relative;z-index:6}'
  + '#autoink .ca-sh-eb{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#ff3b4e;margin-bottom:8px}'
  + '#autoink .ca-sh h2{margin:0;font-size:clamp(28px,3.4vw,44px);line-height:1.05;letter-spacing:-.02em;color:#fff}'
  + '#autoink .ca-sh p{margin:10px 0 0;max-width:520px;color:rgba(255,255,255,.62);font-size:15.5px;line-height:1.5}'
  + '#autoink .ca-sh-r{display:flex;align-items:center;gap:12px;flex-wrap:wrap}'
  + '#autoink .ca-bt{display:inline-flex;padding:4px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}'
  + '#autoink .ca-bt button{border:0;background:transparent;color:rgba(255,255,255,.72);font:inherit;font-weight:700;font-size:13.5px;padding:9px 16px;border-radius:999px;cursor:pointer;transition:.15s}'
  + '#autoink .ca-bt button.on{background:#fff;color:#0b0b0d}#autoink .ca-bt small{display:block;font-size:10.5px;font-weight:600;opacity:.6;margin-top:1px}'
  + '#autoink .ca-all{display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 20px;border-radius:999px;background:#e2001a;color:#fff!important;font-weight:800;font-size:14.5px;text-decoration:none!important;white-space:nowrap;box-shadow:0 10px 30px rgba(226,0,26,.35);transition:.15s}'
  + '#autoink .ca-all:hover{background:#ff1f38;transform:translateY(-1px)}'
  + '#autoink.ca-show .autok-more{display:none!important}'
  // fülek + márkák sötét alapon
  + '#autoink.ca-show .autok-head{position:relative;z-index:6}'
  + '#autoink.ca-show .autok-tabs{background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.1)!important;box-shadow:none!important}'
  + '#autoink.ca-show .autok-tab{color:rgba(255,255,255,.7)!important;background:transparent!important}'
  + '#autoink.ca-show .autok-tab.on{background:#fff!important;color:#0b0b0d!important}'
  + '#autoink.ca-show .cf-br{background:rgba(255,255,255,.96)!important;border-color:transparent!important;box-shadow:0 6px 18px rgba(0,0,0,.35)!important;color:#141519!important}'
  + '#autoink.ca-show .cf-br .cf-d{display:block!important}#autoink.ca-show .cf-br .cf-l{display:none!important}'
  + '#autoink.ca-show .cf-br:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.45),0 0 0 2px rgba(255,255,255,.5)!important}'
  + '#autoink.ca-show .cf-br.on{background:#e2001a!important;color:#fff!important;box-shadow:0 8px 24px rgba(226,0,26,.45)!important}'
  + '#autoink.ca-show .cf-br.on .cf-d{display:none!important}#autoink.ca-show .cf-br.on .cf-l{display:block!important}'
  // körhinta: oldalsó kártyák a sötétben, középen tükröződés
  + '#autoink.ca-show .cw.cf3d{-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 12%,#000 88%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 12%,#000 88%,transparent 100%)}'
  + '#autoink.ca-show .cw.cf3d .cw-item{transition:transform .6s cubic-bezier(.22,.61,.36,1),opacity .45s,filter .45s!important}'
  + '#autoink.ca-show .cw.cf3d .cw-item.cf-side{filter:brightness(.5) saturate(.7)}#autoink.ca-show .cw.cf3d .cw-item.cf-side:hover{filter:brightness(.7) saturate(.85)}'
  + '#autoink.ca-show .cw.cf3d .cw-item.cw-c{-webkit-box-reflect:below 10px linear-gradient(transparent 82%,rgba(255,255,255,.16))}'
  + '#autoink.ca-show .cw.cf3d .cw-item.cw-c>.sub-card,#autoink.ca-show .cw.cf3d .cw-item.cw-c>.card{box-shadow:0 0 0 1px rgba(255,255,255,.5),0 30px 80px rgba(0,0,0,.55),0 0 90px rgba(226,0,26,.22)!important}'
  + '#autoink.ca-show .cw.cf3d .cw-item>.sub-card,#autoink.ca-show .cw.cf3d .cw-item>.card{border-color:transparent!important}'
  // kártya: egész kártya kattintható, egy fő gomb, nagy ár
  + '#autoink.ca-show .cw-track{color:#141519}'
  + '#autoink.ca-show .sub-card{cursor:pointer}'
  + '#autoink.ca-show .sub-media{position:relative}'
  + '#autoink.ca-show .ca-pbox .ca-seg{display:none!important}'
  + '#autoink.ca-show .ca-pbox .ca-pv{font-size:30px!important;letter-spacing:-.02em}'
  + '#autoink.ca-show .ca-pbox .ca-pe,#autoink.ca-show .ca-pbox .sub-dep{font-size:12px!important;opacity:.75}'
  + '#autoink.ca-show .sub-actions .ca-row{display:none!important}'
  + '#autoink.ca-show .sub-actions .sub-btn{width:100%}'
  + '#autoink.ca-show .sub-media .ca-cmp{position:absolute!important;top:10px;right:10px;z-index:3;width:38px;height:38px;padding:0!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;font-size:0!important;background:rgba(255,255,255,.94)!important;color:#141519!important;border:1px solid rgba(0,0,0,.08)!important;box-shadow:0 4px 14px rgba(0,0,0,.14);text-decoration:none!important}'
  + '#autoink.ca-show .sub-media .ca-cmp b{font-size:17px!important;line-height:1;margin:0!important}'
  + '#autoink.ca-show .sub-media .ca-cmp:hover{background:#141519!important;color:#fff!important}'
  // lapozó: nyilak + pöttyök
  + '#autoink.ca-show .cf-btn{background:rgba(255,255,255,.08)!important;color:#fff!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:none!important}'
  + '#autoink.ca-show .cf-btn:hover{background:#fff!important;color:#0b0b0d!important}'
  + '#autoink.ca-show .cf-cnt{display:none!important}'
  + '#autoink .ca-dots{display:flex;align-items:center;gap:8px;padding:0 10px}'
  + '#autoink .ca-dots button{width:8px;height:8px;padding:0;border:0;border-radius:99px;background:rgba(255,255,255,.3);cursor:pointer;transition:width .3s,background .3s}'
  + '#autoink .ca-dots button.on{width:26px;background:#e2001a}'
  + '#autoink.ca-show .cf-none{color:rgba(255,255,255,.7)}'
  + '@media(max-width:860px){#autoink.ca-show{padding:22px 16px 22px!important}#autoink .ca-sh{align-items:flex-start;gap:14px;margin-bottom:16px}#autoink .ca-sh-r{width:100%;flex-wrap:nowrap;gap:8px}'
  + '#autoink .ca-sh p{display:none}#autoink .ca-sh h2{font-size:28px}#autoink .ca-bt small{display:none}#autoink .ca-bt button{padding:8px 12px;font-size:13px}'
  + '#autoink .ca-all{height:40px;padding:0 14px;font-size:13px;flex:1 1 auto;justify-content:center;min-width:0;overflow:hidden;text-overflow:ellipsis}}'
  + '@media(prefers-reduced-motion:reduce){#autoink.ca-show .cw.cf3d .cw-item{transition:none!important}}'
  + '</style>';

const CLIENT = function () {
  var MAX = __MAX__;
  var TXT = {
    berelheto: { t: 'Bérelhető prémium autók', p: 'Új, prémium német autók tartós bérletre — havidíjban benne a szerviz, az adók és a biztosítás.', all: 'Összes bérelhető autó' },
    elado: { t: 'Megvásárolható autóink', p: 'Ellenőrzött előéletű prémium autók Németországból, azonnal elvihető állapotban.', all: 'Összes eladó autó' },
    bizomanyos: { t: 'Bizományos autóink', p: 'Ügyfeleink autói, amelyeket mi értékesítünk — átvizsgálva, korrekt áron.', all: 'Összes bizományos autó' }
  };
  var BN = { volkswagen: 'Volkswagen', bmw: 'BMW', mercedes: 'Mercedes-Benz', mini: 'MINI', audi: 'Audi', hyundai: 'Hyundai', man: 'MAN', cupra: 'CUPRA', kia: 'Kia', seat: 'SEAT', volvo: 'Volvo' };
  var AL = { vw: 'volkswagen', mercedesbenz: 'mercedes', amg: 'mercedes', mercedesamg: 'mercedes', maybach: 'mercedes', alpina: 'bmw' };
  function nq(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''); }
  function brandOf(it) { var t = it.querySelector('.sub-title,.title'); var w = String(t ? t.textContent : '').trim().split(/[\s-]+/); var a = nq(w[0]), b = nq(w[0] + (w[1] || '')); return AL[b] || AL[a] || a; }
  function sec() { return document.getElementById('autoink'); }
  function curTab() { var t = document.querySelector('#autoink .autok-tab.on'); return (t && t.getAttribute('data-tab')) || 'berelheto'; }

  // kiemelt autók: előbb az azonnal elérhetők; márkaszűrő nélkül márkánként max. 2
  function pick(list, brand) {
    var f = list.filter(function (it) { return !brand || brandOf(it) === brand; });
    var now = f.filter(function (it) { return it.querySelector('.sub-avail.now'); });
    var rest = f.filter(function (it) { return now.indexOf(it) < 0; });
    var ord = now.concat(rest), out = [], per = {};
    if (!brand) { ord.forEach(function (it) { var b = brandOf(it); if (out.length < MAX && (per[b] || 0) < 2) { out.push(it); per[b] = (per[b] || 0) + 1; } }); }
    ord.forEach(function (it) { if (out.length < MAX && out.indexOf(it) < 0) out.push(it); });
    return { shown: out, total: f.length };
  }
  function trim(root) {
    var track = root.querySelector('.cw-track'); if (!track) return;
    var kids = [].slice.call(track.children);
    if (!root.__caAll || kids.some(function (k) { return root.__caAll.indexOf(k) < 0; })) root.__caAll = kids;
    var r = pick(root.__caAll, window.__caCFBrand || ''); root.__caTotal = r.total;
    var same = kids.length === r.shown.length && kids.every(function (k, i) { return k === r.shown[i]; });
    if (!same) { var fr = document.createDocumentFragment(); r.shown.forEach(function (it) { fr.appendChild(it); }); track.innerHTML = ''; track.appendChild(fr); }
    decorate(root); head();
  }
  // kártyák: összehasonlítás ikon a képre, egész kártya kattintható
  function decorate(root) {
    [].forEach.call(root.querySelectorAll('.sub-card'), function (c) {
      if (c.__caDec) return; c.__caDec = 1;
      var cmp = c.querySelector('.sub-actions .ca-cmp'), m = c.querySelector('.sub-media');
      if (cmp && m) { cmp.title = 'Összehasonlítás'; cmp.setAttribute('aria-label', 'Összehasonlítás'); m.appendChild(cmp); }
    });
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('#autoink.ca-show .cw-item.cw-c .sub-card'); if (!c) return;
    if (e.target.closest('a,button,input,select,.sub-info,.sub-gbtn,.sub-gdots')) return;
    var d = c.querySelector('.sub-det'); if (d && d.href) location.href = d.href;
  });
  // fejléc: cím, alcím, közös Cég/Magán kapcsoló, „Összes … (N) →”
  function head() {
    var s = sec(); if (!s) return; var h = s.querySelector('.ca-sh');
    if (!h) {
      h = document.createElement('div'); h.className = 'ca-sh';
      h.innerHTML = '<div class="ca-sh-l"><span class="ca-sh-eb">Kínálat</span><h2></h2><p></p></div><div class="ca-sh-r">'
        + '<div class="ca-bt" role="group" aria-label="Ár megjelenítése"><button type="button" data-bt="c">Cég<small>nettó ár</small></button><button type="button" data-bt="p">Magán<small>bruttó ár</small></button></div>'
        + '<a class="ca-all" href="/autoink/#berelheto"></a></div>';
      s.insertBefore(h, s.firstChild);
      h.querySelector('.ca-bt').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (window.caSetBT) window.caSetBT(b.getAttribute('data-bt')); setTimeout(head, 30); });
    }
    var tab = curTab(), T = TXT[tab] || TXT.berelheto;
    h.querySelector('h2').textContent = T.t; h.querySelector('p').textContent = T.p;
    var bt = h.querySelector('.ca-bt'); bt.style.display = tab === 'berelheto' && window.caSetBT && !window.__CA_MKT ? '' : 'none';
    var mode = window.__caBT === 'p' ? 'p' : 'c'; [].forEach.call(bt.querySelectorAll('button'), function (x) { x.classList.toggle('on', x.getAttribute('data-bt') === mode); });
    var panel = document.getElementById('panel-' + tab), root = panel && panel.querySelector('.cw');
    var more = panel && panel.querySelector('.autok-more a'); var a = h.querySelector('.ca-all');
    if (more) a.href = more.getAttribute('href');
    var br = window.__caCFBrand || '', n = root && root.__caTotal;
    var short = window.innerWidth < 640;
    a.textContent = (short ? 'Összes' : br ? 'Összes ' + (BN[br] || br) : T.all) + (n ? ' (' + n + ')' : '') + ' →';
  }
  // pöttyös lapozó (a „1 / 8” számláló helyett)
  function dots(root) {
    var ctl = root.querySelector('.cf-ctl'), cnt = ctl && ctl.querySelector('.cf-cnt'); if (!cnt) return;
    var d = ctl.querySelector('.ca-dots'); if (!d) { d = document.createElement('div'); d.className = 'ca-dots'; cnt.parentNode.insertBefore(d, cnt); }
    var m = /(\d+)\s*\/\s*(\d+)/.exec(cnt.textContent || ''), a = m ? +m[1] : 0, n = m ? +m[2] : 0;
    if (d.childNodes.length !== n) { d.innerHTML = ''; for (var i = 1; i <= n; i++) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', i + '. autó'); b.setAttribute('data-i', i); d.appendChild(b); } }
    [].forEach.call(d.children, function (b, i) { b.classList.toggle('on', i + 1 === a); });
    if (!d.__caClick) { d.__caClick = 1; d.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var mm = /(\d+)\s*\/\s*(\d+)/.exec(cnt.textContent || ''); if (!mm) return;
      var cur = +mm[1], tot = +mm[2], to = +b.getAttribute('data-i'), fw = (to - cur + tot) % tot, bw = (cur - to + tot) % tot;
      var btn = ctl.querySelector(fw <= bw ? '.cf-n' : '.cf-p'), k = Math.min(fw, bw); while (k-- > 0) btn.click();
    }); }
    if (!cnt.__caObs) { cnt.__caObs = 1; try { new MutationObserver(function () { dots(root); }).observe(cnt, { childList: true, characterData: true, subtree: true }); } catch (e) {} }
  }
  // a körhinta-motor (home-carousel.mjs) beburkolása: előtte kiválogatjuk a kiemelt autókat
  var orig = window.__caCF;
  if (orig && !orig.__caShow) {
    window.__caCF = function (root) { try { trim(root); } catch (e) {} var api = orig(root); try { dots(root); head(); } catch (e) {} return api; };
    window.__caCF.__caShow = 1;
  }
  // márkaváltás: előbb újraválogatás (a motor saját kezelője utána fut)
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#autoink .cf-br'); if (!b) return;
    window.__caCFBrand = b.getAttribute('data-b') || '';
    [].forEach.call(document.querySelectorAll('#autoink .cw'), function (r) { if (r.__cf) { trim(r); r.__cf.reset(); dots(r); } });
    setTimeout(head, 0);
  }, true);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#autoink .autok-tab')) setTimeout(head, 80); });
  function init() {
    var s = sec(); if (!s) return; s.classList.add('ca-show');
    // csak akkor olvad össze a heróval, ha közvetlenül utána áll; a vízszintes margó a heróéval egyezik
    var hero = s.previousElementSibling;
    if (hero && hero.matches('section.hero')) {
      document.body.classList.add('ca-show-on');
      var m = getComputedStyle(hero); s.style.setProperty('margin-left', m.marginLeft, 'important'); s.style.setProperty('margin-right', m.marginRight, 'important');
      var r = parseFloat(m.borderTopLeftRadius) || 32; s.style.borderRadius = '0 0 ' + r + 'px ' + r + 'px';
    } else { s.style.setProperty('margin-top', '18px', 'important'); s.style.borderRadius = '28px'; }
    head();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
};

try {
  if (!fs.existsSync(FILE)) { console.log('[home-showroom] nincs dist/index.html'); }
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-show-css"') > -1) console.log('[home-showroom] már alkalmazva');
    else if (h.indexOf('id="ca-cf3d-js"') < 0 || h.indexOf('id="autoink"') < 0) console.log('[home-showroom] a főoldalon nincs 3D körhinta — kihagyva');
    else {
      const js = '<script id="ca-show-js">(' + CLIENT.toString().replace('__MAX__', String(MAX)) + ')();</script>';
      // a körhinta-motor (ca-cf3d-js) után, hogy be tudja burkolni a window.__caCF-et
      h = h.replace(/(<script id="ca-cf3d-js">[\s\S]*?<\/script>)/, '$1' + CSS + js);
      fs.writeFileSync(FILE, h);
      console.log('[home-showroom] showroom dizájn a magyar főoldalon (max. ' + MAX + ' kiemelt autó)');
    }
  }
} catch (e) { console.log('[home-showroom] hiba:', e.message); }
