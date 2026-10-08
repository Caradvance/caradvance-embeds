/* CarAdvance — ügyfélfiók ikon a menüben + űrlap-előtöltés belépett ügyfélnek.
   A seo-fiok.mjs húzza be minden oldalba. Hálózati kérést nem indít. */
(function () {
  'use strict';
  var W = window, D = document;
  var LANG = (D.documentElement.getAttribute('lang') || 'hu').slice(0, 2).toLowerCase();
  var PATH = { hu: '/fiok/', en: '/en/account/', de: '/de/konto/', fr: '/fr/compte/', uk: '/uk/kabinet/', zh: '/zh/account/', sk: '/sk/ucet/', cs: '/cs/ucet/' };
  var host = location.hostname.replace(/^www\./, '');
  if (host === 'caradvance.sk') { LANG = 'sk'; PATH.sk = '/ucet/'; }
  if (host === 'caradvance.cz') { LANG = 'cs'; PATH.cs = '/ucet/'; }
  if (!PATH[LANG]) LANG = 'en';
  var T = {
    hu: ['Fiókom', 'Belépés'],
    en: ['My account', 'Sign in'],
    de: ['Mein Konto', 'Anmelden'],
    fr: ['Mon compte', 'Connexion'],
    uk: ['Мій кабінет', 'Увійти'],
    zh: ['我的账户', '登录'],
    sk: ['Môj účet', 'Prihlásiť'],
    cs: ['Můj účet', 'Přihlásit']
  }[LANG];

  function ck(n) { var m = D.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  var INI = ck('ca_cust_n');
  var IN = !!INI;
  if (!IN) ls('ca_acct_prof', null);

  /* ---- menü ikon ---- */
  function paintIcon() {
    var bs = D.querySelectorAll('a.ca-pbtn');
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      b.setAttribute('href', PATH[LANG]);
      b.setAttribute('aria-label', IN ? T[0] : T[1] + ' · ' + T[0]);
      b.setAttribute('title', IN ? T[0] : T[1]);
      if (IN) {
        b.classList.add('in');
        var s = b.querySelector('.ca-pini');
        if (!s) { s = D.createElement('span'); s.className = 'ca-pini'; b.appendChild(s); }
        s.textContent = INI.slice(0, 1);
      }
    }
  }

  /* ---- űrlap-előtöltés: csak üres mezőbe, csak belépett ügyfélnek ---- */
  function prefill(form) {
    var p = ls('ca_acct_prof');
    if (!p || form.__caPre) return;
    form.__caPre = 1;
    var parts = String(p.name || '').trim().split(/\s+/);
    var els = form.querySelectorAll('input');
    for (var i = 0; i < els.length; i++) {
      var e = els[i];
      if (e.value || e.type === 'hidden' || e.type === 'checkbox' || e.type === 'radio' || e.readOnly || e.disabled) continue;
      var k = ((e.name || '') + ' ' + (e.id || '') + ' ' + (e.getAttribute('autocomplete') || '') + ' ' + (e.placeholder || '')).toLowerCase();
      var v = '';
      if (e.type === 'email' || /e-?mail/.test(k)) v = p.email;
      else if (e.type === 'tel' || /telefon|phone|\btel\b/.test(k)) v = p.phone;
      else if (/cégn|company|firma|organization/.test(k)) v = p.company;
      else if (/vezetékn|family-name|last|nachname/.test(k)) v = parts[0] || '';
      else if (/keresztn|given-name|first|vorname/.test(k)) v = parts.slice(1).join(' ');
      else if (/(^|\s)(név|nev|name|kapcsolattart)/.test(k) && !/user|brand|márka|modell/.test(k)) v = p.name;
      if (v) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  }
  if (IN) D.addEventListener('focusin', function (ev) { var f = ev.target && ev.target.form; if (f) prefill(f); });

  function boot() { paintIcon(); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
