/* CarAdvance Admin — felület nyelve (HU / SK / CZ), 2026-11-09.
 * caradvance.sk → szlovák, caradvance.cz → cseh, máshol magyar; a fejlécben váltható (a választás a böngészőben megmarad).
 * A magyar felület szövegeit futás közben, szótárból cseréli (/admin/i18n-sk.json, /admin/i18n-cs.json) — az adatokat
 * (ügyfélnevek, megjegyzések, beírt értékek) nem fordítja. A magyar felületen semmit nem csinál. */
(function () {
  'use strict';
  var KEY = 'ca_admin_lang', H = location.hostname;
  var def = /caradvance\.sk$/.test(H) ? 'sk' : /caradvance\.cz$/.test(H) ? 'cs' : 'hu';
  var lang = def;
  try { var s = localStorage.getItem(KEY); if (s === 'hu' || s === 'sk' || s === 'cs') lang = s; } catch (e) {}
  var NAMES = { hu: 'Magyar', sk: 'Slovenčina', cs: 'Čeština' };
  var FLAG = { hu: 'HU', sk: 'SK', cs: 'CZ' };

  /* ---- nyelvváltó (jobb alsó sarok, minden admin oldalon) ---- */
  function switcher() {
    if (document.getElementById('ca-langsw')) return;
    var w = document.createElement('div'); w.id = 'ca-langsw'; w.setAttribute('data-noi18n', '1');
    w.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:99999;display:flex;gap:4px;background:#fff;border:1px solid #e3e7ee;border-radius:999px;padding:4px;box-shadow:0 6px 20px rgba(15,23,42,.12);font:600 12px/1 Inter,Arial,sans-serif';
    ['hu', 'sk', 'cs'].forEach(function (l) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = FLAG[l]; b.title = NAMES[l];
      b.style.cssText = 'border:0;border-radius:999px;padding:7px 10px;cursor:pointer;' + (l === lang ? 'background:#e2001a;color:#fff' : 'background:transparent;color:#334155');
      b.onclick = function () { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); };
      w.appendChild(b);
    });
    document.body.appendChild(w);
  }
  if (document.body) switcher(); else document.addEventListener('DOMContentLoaded', switcher);
  if (lang === 'hu') return;

  document.documentElement.lang = lang;
  var st = document.createElement('style'); st.id = 'ca-i18n-wait'; st.textContent = 'body{visibility:hidden!important}';
  (document.head || document.documentElement).appendChild(st);
  var unhide = function () { var x = document.getElementById('ca-i18n-wait'); if (x) x.remove(); };
  setTimeout(unhide, 1800);

  var D = null, T = {}, RE = null, TOK = null, TRE = null;
  var HU_CH = /[áéíóöőúüű]/i;
  var EDGE = /^([\s\d.,:;·•\-–—→←↗↘▸▾▴›»«()[\]"„“”'+%€$#|/*!?…]*)([\s\S]*?)([\s\d.,:;·•\-–—→←↗↘▸▾▴›»«()[\]"„“”'+%€$#|/*!?…]*)$/;
  var NUM = /\d+(?:[.,  ]\d+)*/g;
  function prep(d) {
    if (d.__tokens) { TOK = d.__tokens; delete d.__tokens; var tk = Object.keys(TOK).map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }); TRE = new RegExp('(?<![A-Za-zÀ-ž])(' + tk.join('|') + ')(?![A-Za-zÀ-ž])', 'g'); }
    var keys = Object.keys(d);
    keys.forEach(function (k) {
      if (/\d/.test(k)) { var v = d[k], kn = k.match(NUM) || [], vn = v.match(NUM) || []; if (kn.length && kn.length === vn.length) T[k.replace(NUM, '#')] = { v: v.replace(NUM, '#'), n: kn.length }; }
    });
    var ph = keys.filter(function (k) { return k.length >= 5 && /[A-Za-zÀ-ž]/.test(k) && HU_CH.test(k) && k.indexOf('\n') < 0; })
      .sort(function (a, b) { return b.length - a.length; }).slice(0, 2500)
      .map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    try { RE = ph.length ? new RegExp('(?<![A-Za-zÀ-ž])(' + ph.join('|') + ')(?![A-Za-zÀ-ž])', 'g') : null; } catch (e) { RE = null; }
  }
  function look(s) {
    if (!s) return null;
    if (D[s] != null) return D[s];
    var m = EDGE.exec(s); if (m && m[2] && m[2] !== s && D[m[2]] != null) return m[1] + D[m[2]] + m[3];
    if (/\d/.test(s)) {
      var nums = s.match(NUM) || [], t = T[s.replace(NUM, '#')];
      if (t && t.n === nums.length) { var i = 0; return t.v.replace(/#/g, function () { return nums[i++]; }); }
      if (m && m[2] && /\d/.test(m[2])) { var n2 = m[2].match(NUM) || [], t2 = T[m[2].replace(NUM, '#')]; if (t2 && t2.n === n2.length) { var j = 0; return m[1] + t2.v.replace(/#/g, function () { return n2[j++]; }) + m[3]; } }
    }
    return null;
  }
  function tr(raw) {
    if (!raw || !/[A-Za-zÀ-ž]/.test(raw)) return raw;
    var lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0], s = raw.trim().replace(/\s+/g, ' ');
    var r = look(s);
    if (r == null && RE && HU_CH.test(s) && s.length <= 400) { var x = s.replace(RE, function (p) { return D[p] != null ? D[p] : p; }); if (x !== s) r = x; }
    // rövid szavak (üzemanyag, váltó, „hó”, „LE”) csak tagolt sorokban: „2026 · 0 km · Benzin · 150 LE · Automata · 6 hó”
    if (TRE && /·|:|\(/.test(r == null ? s : r)) { var y = (r == null ? s : r).replace(TRE, function (p) { return TOK[p] != null ? TOK[p] : p; }); if (y !== (r == null ? s : r)) r = y; }
    return r == null ? raw : lead + r + tail;
  }
  window.caT = function (s) { return D ? tr(String(s)) : s; };

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  function skipEl(el) {
    for (var e = el; e && e !== document.body; e = e.parentNode) {
      if (e.nodeType !== 1) continue;
      if (SKIP[e.nodeName] || e.isContentEditable || (e.hasAttribute && (e.hasAttribute('data-noi18n') || e.hasAttribute('contenteditable')))) return true;
    }
    return false;
  }
  var ATTR = ['placeholder', 'title', 'aria-label', 'data-tip', 'alt'];
  function doEl(el) {
    for (var i = 0; i < ATTR.length; i++) { var a = el.getAttribute && el.getAttribute(ATTR[i]); if (a) { var t = tr(a); if (t !== a) el.setAttribute(ATTR[i], t); } }
    if (el.nodeName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type) && el.value) { var v = tr(el.value); if (v !== el.value) el.value = v; }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skipEl(root.parentNode)) { var t = tr(root.nodeValue); if (t !== root.nodeValue) root.nodeValue = t; } return; }
    if (root.nodeType !== 1 || skipEl(root)) return;
    doEl(root);
    var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) { if (n.nodeType === 1) return SKIP[n.nodeName] || (n.hasAttribute('data-noi18n')) || n.isContentEditable ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; return NodeFilter.FILTER_ACCEPT; }
    });
    var n; while ((n = it.nextNode())) {
      if (n.nodeType === 1) doEl(n);
      else { var v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    }
  }
  function title() { var t = tr(document.title); if (t !== document.title) document.title = t; }

  // felugró üzenetek (alert / confirm / prompt) soronként
  var lines = function (m) { return String(m == null ? '' : m).split('\n').map(tr).join('\n'); };
  var _a = window.alert, _c = window.confirm, _p = window.prompt;
  window.alert = function (m) { return _a.call(window, D ? lines(m) : m); };
  window.confirm = function (m) { return _c.call(window, D ? lines(m) : m); };
  window.prompt = function (m, d) { return _p.call(window, D ? lines(m) : m, d); };

  function start(d) {
    D = d; prep(d);
    var go = function () {
      walk(document.body); title(); unhide();
      var busy = false, q = [];
      new MutationObserver(function (ms) {
        if (busy) return;
        busy = true;
        try {
          ms.forEach(function (m) {
            if (m.type === 'childList') m.addedNodes.forEach(function (nd) { walk(nd); });
            else if (m.type === 'characterData') walk(m.target);
            else if (m.type === 'attributes' && m.target.nodeType === 1) doEl(m.target);
          });
          title();
        } finally { busy = false; }
      }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
      new MutationObserver(title).observe(document.querySelector('title') || document.head, { childList: true, subtree: true, characterData: true });
    };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  }
  fetch('/admin/i18n-' + lang + '.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(start).catch(function () { unhide(); });
})();
