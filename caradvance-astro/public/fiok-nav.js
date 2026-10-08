/* CarAdvance — fiók ikon a menüben, "Mentés" szív az autóoldalakon, űrlap-előtöltés belépett ügyfélnek.
   A seo-fiok.mjs húzza be minden oldalba. Hálózati kérés csak kattintáskor történik. */
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
    hu: ['Fiókom', 'Belépés', 'Mentés', 'Mentve', 'Jelentkezz be, és elmentjük ezt az autót a fiókodba.', 'Belépés'],
    en: ['My account', 'Sign in', 'Save', 'Saved', 'Sign in and we will save this car to your account.', 'Sign in'],
    de: ['Mein Konto', 'Anmelden', 'Merken', 'Gemerkt', 'Melden Sie sich an, wir merken uns dieses Auto in Ihrem Konto.', 'Anmelden'],
    fr: ['Mon compte', 'Connexion', 'Enregistrer', 'Enregistré', 'Connectez-vous et nous enregistrons cette voiture dans votre compte.', 'Connexion'],
    uk: ['Мій кабінет', 'Увійти', 'Зберегти', 'Збережено', 'Увійдіть, і ми збережемо це авто у вашому кабінеті.', 'Увійти'],
    zh: ['我的账户', '登录', '收藏', '已收藏', '登录后即可将此车收藏到您的账户。', '登录'],
    sk: ['Môj účet', 'Prihlásiť', 'Uložiť', 'Uložené', 'Prihláste sa a toto auto uložíme do vášho účtu.', 'Prihlásiť'],
    cs: ['Můj účet', 'Přihlásit', 'Uložit', 'Uloženo', 'Přihlaste se a toto auto uložíme do vašeho účtu.', 'Přihlásit']
  }[LANG];

  function ck(n) { var m = D.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  var INI = ck('ca_cust_n');
  var IN = !!INI;
  if (!IN) { ls('ca_acct_prof', null); ls('ca_favs', null); }

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

  /* ---- mentés szív ---- */
  var HEART = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 20.3s-7.6-4.6-9.3-9.2C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.5 3.3 4.3 6.6-1.7 4.6-9.3 9.2-9.3 9.2z" fill="currentColor"/></svg>';
  function curPath() { return location.pathname.replace(/^\/(sk|cs)\//, '/'); }
  function favs() { return ls('ca_favs') || []; }
  function paintFav(b, on) {
    b.classList.toggle('on', !!on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.innerHTML = HEART + '<span>' + (on ? T[3] : T[2]) + '</span>';
  }
  function favData(b) {
    return { url: location.pathname, title: b.getAttribute('data-t') || (D.querySelector('h1') || {}).textContent || D.title, img: b.getAttribute('data-img') || '' };
  }
  function tip(b) {
    var old = D.querySelector('.ca-favtip'); if (old) old.remove();
    var d = D.createElement('div'); d.className = 'ca-favtip'; d.setAttribute('role', 'dialog');
    d.innerHTML = '<p></p><a class="ca-favgo"></a><button type="button" class="ca-favx" aria-label="×">×</button>';
    d.querySelector('p').textContent = T[4];
    var a = d.querySelector('a'); a.textContent = T[5]; a.href = PATH[LANG] + '?ment=1';
    d.querySelector('button').onclick = function () { d.remove(); };
    b.insertAdjacentElement('afterend', d);
    a.focus();
  }
  function initFav() {
    var bs = D.querySelectorAll('[data-ca-fav]');
    if (!bs.length) return;
    var saved = favs().indexOf(curPath()) > -1 || favs().indexOf(location.pathname) > -1;
    for (var i = 0; i < bs.length; i++) (function (b) {
      b.hidden = false;
      paintFav(b, IN && saved);
      b.addEventListener('click', function () {
        var data = favData(b);
        if (!IN) { ls('ca_fav_pending', data); tip(b); return; }
        var on = !b.classList.contains('on');
        paintFav(b, on);
        fetch('/api/fiok/kedvenc', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(on ? data : { url: data.url, remove: true }) })
          .then(function (r) { if (r.status === 401) { IN = false; ls('ca_fav_pending', data); paintFav(b, false); tip(b); return; } if (!r.ok) throw 0;
            var f = favs().filter(function (u) { return u !== data.url; }); if (on) f.push(data.url); ls('ca_favs', f); })
          .catch(function () { paintFav(b, !on); });
      });
    })(bs[i]);
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

  function boot() { paintIcon(); initFav(); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
