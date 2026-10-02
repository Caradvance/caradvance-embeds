/*! CarAdvance — ár nélküli nézet védőhálója (csak a külföldi /_np/ változatban töltődik be).
 *  Ha egy szkript utólag árat írna ki (pl. élő árfolyam, modal, kártya), azt "Ár kérésre"-re cseréli. */
(function () {
  'use strict';
  window.CA_NP = 1;
  var L = 'Ár kérésre';
  var NUM = '(?:\\d{1,3}(?:[ \\u00a0\\u202f.,]\\d{3})+|\\d+)(?:,\\d{1,2})?';
  var CUR = '(?:€|EUR\\b|Ft\\b|HUF\\b)';
  var CORE = new RegExp('(?:[−–-]\\s?)?' + NUM + '\\s?(?:[–-]\\s?' + NUM + '\\s?)?' + CUR + '|€\\s?' + NUM, 'g');
  var NAN = /NaN\s?(?:€|Ft)/g;
  var RATE = /1\s?€\s?[≈=]\s?\d[\d \u00a0]*\s?Ft|1\s?€(?=\s?[≈=])|[≈=]\s?\d{3}(?:[.,]\d+)?\s?Ft/g;
  var SUFFIX = new RegExp(L + '(?:\\s?\\/\\s?(?:hó|hónap|km))?(?:\\s?[-‑–]?\\s?(?:tól|től|ig))?(?:\\s?\\/\\s?(?:hó|hónap))?', 'g');
  var PAREN = new RegExp('\\s?\\(\\s?' + L + '\\s?\\)', 'g');
  var DOUBLE = new RegExp(L + '(?:\\s?[·|,\\/]\\s?' + L + ')+', 'g');
  var TEST = /€|Ft\b|EUR\b|HUF\b|NaN/;

  function fix(s) {
    var keep = [];
    s = s.replace(RATE, function (m) { keep.push(m); return '⁣' + (keep.length - 1) + '⁣'; });
    s = s.replace(NAN, L).replace(CORE, L).replace(SUFFIX, L).replace(PAREN, '').replace(DOUBLE, L);
    return s.replace(/⁣(\d+)⁣/g, function (_, i) { return keep[+i]; });
  }
  function walk(n) {
    if (!n) return;
    if (n.nodeType === 3) {
      var v = n.nodeValue;
      if (TEST.test(v)) { var f = fix(v); if (f !== v) n.nodeValue = f; }
      return;
    }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    if (n.hasAttribute && n.hasAttribute('title') && TEST.test(n.getAttribute('title'))) n.setAttribute('title', fix(n.getAttribute('title')));
    for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  function run() {
    walk(document.body);
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') walk(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
})();
