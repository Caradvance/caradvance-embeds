/*! CarAdvance — hozzájárulás-kezelés + Google Consent Mode v2
 *  Ennek a fájlnak MINDIG a ca-track.js ELŐTT kell lefutnia.
 *  Nyilvános API:  window.CAConsent.open()  — újranyitja a beállításokat
 *                  window.CAConsent.get()   — { analytics:bool, marketing:bool } vagy null
 */
(function () {
  'use strict';
  var KEY = 'ca_consent_v1';
  var MONTHS = 6;
  var CFG = window.CA_CFG || {};

  // --- 1. Consent Mode v2 alapértelmezés: minden tiltva, amíg a felhasználó nem dönt ---
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  // --- 2. Mentett döntés beolvasása ---
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || !v.ts) return null;
      var ageDays = (Date.now() - v.ts) / 86400000;
      if (ageDays > MONTHS * 30.5) return null;
      return { analytics: !!v.analytics, marketing: !!v.marketing };
    } catch (e) { return null; }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        analytics: !!state.analytics, marketing: !!state.marketing, ts: Date.now()
      }));
    } catch (e) { /* privát mód: a döntés csak erre a munkamenetre él */ }
  }

  function apply(state, isFresh) {
    gtag('consent', 'update', {
      ad_storage: state.marketing ? 'granted' : 'denied',
      ad_user_data: state.marketing ? 'granted' : 'denied',
      ad_personalization: state.marketing ? 'granted' : 'denied',
      analytics_storage: state.analytics ? 'granted' : 'denied'
    });
    window.CA_CONSENT_STATE = state;
    try {
      document.dispatchEvent(new CustomEvent('ca:consent', { detail: { state: state, fresh: !!isFresh } }));
    } catch (e) {
      var ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('ca:consent', false, false, { state: state, fresh: !!isFresh });
      document.dispatchEvent(ev);
    }
  }

  // --- 3. Banner ---
  var CSS = '' +
  '.cacb{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#111114;color:#E8E8EC;' +
  'font:14px/1.5 Poppins,system-ui,-apple-system,Segoe UI,Arial,sans-serif;border-top:1px solid #33333A;' +
  'box-shadow:0 -8px 30px rgba(0,0,0,.35);padding:16px 18px}' +
  '.cacb-in{max-width:1120px;margin:0 auto;display:flex;gap:18px;align-items:center;flex-wrap:wrap}' +
  '.cacb-t{flex:1 1 380px;min-width:260px}' +
  '.cacb-t b{display:block;font-size:15px;margin-bottom:4px;color:#fff}' +
  '.cacb-t a{color:#FF4D5E;text-decoration:underline}' +
  '.cacb-b{display:flex;gap:8px;flex-wrap:wrap}' +
  '.cacb button{font:inherit;font-weight:600;border-radius:10px;padding:10px 16px;cursor:pointer;border:1px solid #3A3A42;' +
  'background:transparent;color:#E8E8EC}' +
  '.cacb button.pri{background:#E2001A;border-color:#E2001A;color:#fff}' +
  '.cacb button:hover{filter:brightness(1.1)}' +
  '.cacb-o{display:none;flex-basis:100%;border-top:1px solid #33333A;margin-top:12px;padding-top:12px}' +
  '.cacb-o.on{display:block}' +
  '.cacb-row{display:flex;gap:10px;align-items:flex-start;margin:8px 0}' +
  '.cacb-row input{margin-top:3px;accent-color:#E2001A}' +
  '.cacb-row span{color:#9A9AA5}.cacb-row b{color:#fff;font-weight:600}' +
  '@media(max-width:640px){.cacb-b{width:100%}.cacb button{flex:1 1 auto}}';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  var box = null;
  function render(existing) {
    if (box) { box.parentNode.removeChild(box); box = null; }
    var style = document.getElementById('cacb-css');
    if (!style) {
      style = el('style', { id: 'cacb-css' }); style.textContent = CSS;
      document.head.appendChild(style);
    }
    var pol = CFG.COOKIE_POLICY_URL || '/adatvedelem/';
    var st = existing || { analytics: true, marketing: true };

    box = el('div', { class: 'cacb', role: 'dialog', 'aria-live': 'polite', 'aria-label': 'Süti-beállítások' });
    box.innerHTML =
      '<div class="cacb-in">' +
        '<div class="cacb-t"><b>Sütiket használunk</b>' +
        'A működéshez szükségeseken túl mérési és hirdetési sütiket is használnánk, hogy lássuk, mi segít ' +
        'valóban a megfelelő autót megtalálni. Ezekhez a hozzájárulásodat kérjük. ' +
        '<a href="' + pol + '">Adatvédelmi tájékoztató</a></div>' +
        '<div class="cacb-b">' +
          '<button type="button" data-ca="settings">Beállítások</button>' +
          '<button type="button" data-ca="reject">Csak a szükségesek</button>' +
          '<button type="button" class="pri" data-ca="accept">Elfogadom</button>' +
        '</div>' +
        '<div class="cacb-o" data-ca="opts">' +
          '<div class="cacb-row"><input type="checkbox" checked disabled id="cacb-nec">' +
            '<label for="cacb-nec"><b>Működéshez szükséges</b> <span>— mindig aktív. Az űrlap és a biztonság működéséhez kell.</span></label></div>' +
          '<div class="cacb-row"><input type="checkbox" id="cacb-an"' + (st.analytics ? ' checked' : '') + '>' +
            '<label for="cacb-an"><b>Mérés</b> <span>— hány látogató jön, melyik oldal működik. Google Analytics.</span></label></div>' +
          '<div class="cacb-row"><input type="checkbox" id="cacb-mk"' + (st.marketing ? ' checked' : '') + '>' +
            '<label for="cacb-mk"><b>Hirdetés</b> <span>— hirdetésmérés és -személyre szabás. Google Ads, Meta.</span></label></div>' +
          '<div class="cacb-b" style="margin-top:10px">' +
            '<button type="button" class="pri" data-ca="save">Mentés</button></div>' +
        '</div>' +
      '</div>';

    box.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ca]') : null;
      if (!b) return;
      var a = b.getAttribute('data-ca');
      if (a === 'settings') { box.querySelector('[data-ca="opts"]').classList.toggle('on'); return; }
      if (a === 'accept') { finish({ analytics: true, marketing: true }); return; }
      if (a === 'reject') { finish({ analytics: false, marketing: false }); return; }
      if (a === 'save') {
        finish({
          analytics: box.querySelector('#cacb-an').checked,
          marketing: box.querySelector('#cacb-mk').checked
        });
      }
    });
    document.body.appendChild(box);
  }

  function finish(state) {
    write(state); apply(state, true);
    if (box) { box.parentNode.removeChild(box); box = null; }
  }

  window.CAConsent = {
    get: read,
    open: function () { render(read()); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }
  };

  function boot() {
    var saved = read();
    if (saved) { apply(saved, false); return; }
    render(null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
