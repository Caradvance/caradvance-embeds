/*! CarAdvance — mérés: GA4 + Google Ads + Meta Pixel + eseménykötés
 *  Betöltési sorrend:  ca-consent.js  →  ca-track.js
 *  Hibakeresés:  ?ca_debug=1  (vagy CA_CFG.DEBUG = true)
 */
(function () {
  'use strict';
  var CFG = window.CA_CFG || {};
  var DEBUG = !!CFG.DEBUG || /[?&]ca_debug=1/.test(location.search);
  function log() { if (DEBUG && window.console) console.log.apply(console, ['[ca]'].concat([].slice.call(arguments))); }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  /* ---------- 1. Kampányadatok eltárolása (90 nap) ---------- */
  var ATTR_KEY = 'ca_attr_v1', ATTR_DAYS = 90;
  var CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid'];
  var UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  function cookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }
  function loadAttr() {
    try {
      var v = JSON.parse(localStorage.getItem(ATTR_KEY) || 'null');
      if (v && v.ts && (Date.now() - v.ts) / 86400000 <= ATTR_DAYS) return v;
    } catch (e) {}
    return null;
  }
  function saveAttr(a) { try { localStorage.setItem(ATTR_KEY, JSON.stringify(a)); } catch (e) {} }

  var attr = loadAttr() || {};
  var fresh = false;
  CLICK_IDS.concat(UTMS).forEach(function (k) {
    var v = qs(k);
    if (v) { attr[k] = v; fresh = true; }
  });
  if (fresh || !attr.ts) {
    if (fresh) {
      attr.ts = Date.now();
      attr.landing = location.pathname;
      attr.referrer = document.referrer || '';
    } else {
      attr.ts = attr.ts || Date.now();
    }
    saveAttr(attr);
  }
  window.CA_ATTR = attr;

  /* ---------- 2. Címkék betöltése ---------- */
  function inject(src) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    document.head.appendChild(s);
  }

  var gAdsIds = [];
  if (CFG.GA4_ID && CFG.GA4_ID.indexOf('X') === -1) gAdsIds.push(CFG.GA4_ID);
  if (CFG.ADS_ID && CFG.ADS_ID.indexOf('X') === -1) gAdsIds.push(CFG.ADS_ID);

  if (gAdsIds.length) {
    inject('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gAdsIds[0]));
    gtag('js', new Date());
    gAdsIds.forEach(function (id) {
      gtag('config', id, id.indexOf('AW-') === 0 ? { allow_enhanced_conversions: true } : {});
    });
    log('google címkék:', gAdsIds.join(', '));
  } else {
    log('nincs kitöltött Google azonosító — a ca-config.json-t még ki kell tölteni');
  }

  if (CFG.GTM_ID && CFG.GTM_ID.indexOf('X') === -1) {
    inject('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(CFG.GTM_ID));
  }

  /* Meta Pixel — csak hirdetési hozzájárulás után töltjük be */
  var metaReady = false;
  function loadMeta() {
    if (metaReady) return;
    if (!CFG.META_PIXEL_ID || CFG.META_PIXEL_ID.indexOf('X') !== -1) { log('nincs Meta pixel azonosító'); return; }
    metaReady = true;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CFG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
    log('meta pixel betöltve');
  }
  function consentState() { return window.CA_CONSENT_STATE || (window.CAConsent && window.CAConsent.get()) || null; }
  (function () {
    var st = consentState();
    if (st && st.marketing) loadMeta();
    document.addEventListener('ca:consent', function (e) {
      if (e.detail && e.detail.state && e.detail.state.marketing) loadMeta();
    });
  })();

  /* ---------- 3. Eseményküldés ---------- */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function track(name, params, meta) {
    params = params || {};
    params.ca_page = location.pathname;
    gtag('event', name, params);
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (meta && window.fbq) window.fbq(meta.track ? 'track' : 'trackCustom', meta.name, meta.params || {}, meta.opts || {});
    log('esemény:', name, params, meta ? '+meta:' + meta.name : '');
  }
  window.caTrack = track;

  function adsConversion(label, extra) {
    if (!CFG.ADS_ID || CFG.ADS_ID.indexOf('X') !== -1 || !label) return;
    gtag('event', 'conversion', Object.assign({ send_to: CFG.ADS_ID + '/' + label }, extra || {}));
    log('ads konverzió:', label);
  }



  /* ---------- 7. Turnstile (Cloudflare captcha) ---------- */
  var tsWidget = null, tsLoading = false;

  function tsToken() {
    try {
      if (window.turnstile && tsWidget !== null) return window.turnstile.getResponse(tsWidget) || '';
    } catch (e) {}
    var f = document.querySelector('[name="cf-turnstile-response"]');
    return f ? f.value || '' : '';
  }
  window.caTurnstileToken = tsToken;

  function tsRender() {
    if (tsWidget !== null || !window.turnstile || !CFG.TURNSTILE_SITEKEY) return;
    var host = document.getElementById('ca-turnstile');
    if (!host) return;
    try {
      tsWidget = window.turnstile.render(host, {
        sitekey: CFG.TURNSTILE_SITEKEY,
        appearance: 'interaction-only',   /* csak akkor látszik, ha tényleg kihívás kell */
        'refresh-expired': 'auto',
        retry: 'auto',
        language: 'hu',
        'error-callback': function () { log('turnstile hiba'); return true; }
      });
      log('turnstile kirenderelve');
    } catch (e) { log('turnstile render hiba', e); }
  }

  function tsInit() {
    if (!CFG.TURNSTILE_SITEKEY || tsLoading) return;
    var f = document.getElementById('buyForm');
    if (!f) return;
    tsLoading = true;

    if (!document.getElementById('ca-turnstile')) {
      var host = document.createElement('div');
      host.id = 'ca-turnstile';
      host.style.margin = '12px 0';
      var last = f.querySelector('.kw-panel[data-step="5"]') || f;
      last.appendChild(host);
    }
    if (window.turnstile) return tsRender();

    window.caTurnstileReady = tsRender;
    var sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=caTurnstileReady';
    sc.async = true; sc.defer = true;
    document.head.appendChild(sc);
  }

  /* ---------- 6. Köszönő ablak ---------- */
  var MODAL_CSS = '' +
  '.cath{position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;' +
  'background:rgba(8,8,10,.72);padding:20px;font:15px/1.55 Poppins,system-ui,-apple-system,Segoe UI,Arial,sans-serif}' +
  '.cath-c{background:#fff;color:#15151B;max-width:460px;width:100%;border-radius:16px;padding:28px 26px 22px;' +
  'box-shadow:0 24px 60px rgba(0,0,0,.35);text-align:center;position:relative}' +
  '.cath-i{width:56px;height:56px;border-radius:50%;background:#E2001A;margin:0 auto 16px;display:flex;' +
  'align-items:center;justify-content:center;color:#fff;font-size:28px;line-height:1}' +
  '.cath-c h3{margin:0 0 10px;font-size:21px;line-height:1.3;color:#111}' +
  '.cath-c p{margin:0 0 8px;color:#4A4A55}' +
  '.cath-n{font-size:13px;color:#777783;margin-top:14px}' +
  '.cath-b{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px}' +
  '.cath-b a,.cath-b button{font:inherit;font-weight:600;border-radius:10px;padding:11px 20px;cursor:pointer;' +
  'border:1px solid #DDD;background:#fff;color:#15151B;text-decoration:none;display:inline-block}' +
  '.cath-b .pri{background:#E2001A;border-color:#E2001A;color:#fff}' +
  '.cath-x{position:absolute;top:10px;right:12px;border:0;background:transparent;font-size:22px;line-height:1;' +
  'color:#9A9AA5;cursor:pointer;padding:4px 8px}' +
  '@media(max-width:480px){.cath-b a,.cath-b button{flex:1 1 100%}}';

  var modal = null;
  function closeModal() {
    if (!modal) return;
    modal.parentNode.removeChild(modal); modal = null;
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') closeModal(); }

  function showModal(kind) {
    closeModal();
    if (!document.getElementById('cath-css')) {
      var st = document.createElement('style'); st.id = 'cath-css'; st.textContent = MODAL_CSS;
      document.head.appendChild(st);
    }
    var okKind = kind !== 'error';
    var title = okKind ? (CFG.THANKS_TITLE || 'Köszönjük az érdeklődésed!')
                       : (CFG.ERROR_TITLE || 'A küldés nem sikerült');
    var text = okKind ? (CFG.THANKS_TEXT || 'Megkaptuk a kérésed, és hamarosan jelentkezünk.')
                      : (CFG.ERROR_TEXT || 'Kérjük, hívj minket, vagy írj a sales@caradvance.hu címre.');
    var note = okKind ? (CFG.THANKS_NOTE || '') : '';
    var phone = CFG.PHONE || '';
    var tel = 'tel:' + phone.replace(/[^\d+]/g, '');
    var wa = CFG.WHATSAPP || '';

    modal = document.createElement('div');
    modal.className = 'cath';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', title);
    modal.innerHTML =
      '<div class="cath-c">' +
        '<button type="button" class="cath-x" data-cath="close" aria-label="Bezárás">&times;</button>' +
        '<div class="cath-i" aria-hidden="true">' + (okKind ? '&#10003;' : '!') + '</div>' +
        '<h3></h3><p></p>' +
        (note ? '<p class="cath-n"></p>' : '') +
        '<div class="cath-b">' +
          (phone ? '<a href="' + tel + '" data-cath="call">' + phone + '</a>' : '') +
          (okKind ? '' : (wa ? '<a href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a>' : '')) +
          '<button type="button" class="pri" data-cath="close">Rendben</button>' +
        '</div>' +
      '</div>';
    modal.querySelector('h3').textContent = title;
    modal.querySelector('p').textContent = text;
    if (note) modal.querySelector('.cath-n').textContent = note;

    modal.addEventListener('click', function (e) {
      if (e.target === modal) return closeModal();
      var b = e.target.closest ? e.target.closest('[data-cath]') : null;
      if (b && b.getAttribute('data-cath') === 'close') closeModal();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(modal);
    var pri = modal.querySelector('.pri'); if (pri) pri.focus();
    track(okKind ? 'thanks_shown' : 'lead_error_shown', {});
  }
  window.caShowThanks = showModal;

  /* Az oldal saját alert()-jét elnyeljük a beküldés utáni pár másodpercben, hogy
     ne jelenjen meg a rendszerablak a saját visszajelzésünk mellett. */
  var submitTs = 0;
  var _alert = window.alert;
  window.alert = function (msg) {
    var m = String(msg == null ? '' : msg);
    var recent = Date.now() - submitTs < 8000;
    if (recent && /Köszönjük/i.test(m)) { showModal('ok'); return; }
    if (recent && /sikertelen/i.test(m)) { showModal('error'); return; }
    return _alert.apply(window, arguments);
  };

  /* ---------- 4. Az űrlap ---------- */
  var form = document.getElementById('buyForm');
  var lastEventId = null;

  function normPhone(p) {
    var d = String(p || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('06') === 0) d = '36' + d.slice(2);
    if (d.length === 9 && /^(20|30|31|50|70)/.test(d)) d = '36' + d;
    if (d.length === 8 && d.indexOf('1') === 0) d = '36' + d;
    return d;
  }
  function fieldVal(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
  function userData() {
    var email = (fieldVal('b-email') || fieldVal('b-cemail')).toLowerCase();
    var phone = normPhone(fieldVal('b-phone') || fieldVal('b-cphone'));
    var d = {};
    if (email) d.email = email;
    if (phone) d.phone_number = '+' + phone;
    return d;
  }

  function ensureEventId() {
    if (!lastEventId) { lastEventId = uuid(); window.CA_EVENT_ID = lastEventId; }
    return lastEventId;
  }

  function leadPayloadExtras() {
    return {
      event_id: ensureEventId(),
      turnstile_token: tsToken(),
      ca_attr: window.CA_ATTR || {},
      fbp: cookie('_fbp'),
      fbc: cookie('_fbc') || (window.CA_ATTR && window.CA_ATTR.fbclid ? 'fb.1.' + Date.now() + '.' + window.CA_ATTR.fbclid : ''),
      page: location.href,
      user_agent: navigator.userAgent
    };
  }
  window.caLeadExtras = leadPayloadExtras;

  function fireLead(source) {
    var eid = ensureEventId();
    var ud = userData();
    if (Object.keys(ud).length) gtag('set', 'user_data', ud);
    track('generate_lead', { method: source || 'urlap', currency: 'HUF', value: 1 });
    adsConversion(CFG.ADS_LEAD_LABEL, { currency: 'HUF', value: 1 });
    if (window.fbq) window.fbq('track', 'Lead', { content_name: 'auto-rendeles' }, { eventID: eid });
    lastEventId = null; /* a következő beküldés új azonosítót kap */
  }
  window.caFireLead = fireLead;

  if (form) {
    var started = false;
    var onFirstTouch = function () {
      if (started) return; started = true;
      track('form_start', { form_id: 'buyForm' }, { track: false, name: 'FormStart' });
      tsInit(); /* a captcha csak valódi kitöltésnél töltődik be — friss marad a token */
    };
    form.addEventListener('input', onFirstTouch, true);
    form.addEventListener('change', onFirstTouch, true);

    var nextBtn = document.getElementById('kwNext');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        setTimeout(function () {
          var cur = form.querySelector('.kw-panel:not([hidden])');
          var step = cur ? parseInt(cur.getAttribute('data-step'), 10) : 0;
          if (step > 1) {
            track('form_step', { form_id: 'buyForm', step: step });
            if (step >= 3 && window.fbq) window.fbq('trackCustom', 'FormStep3');
          }
        }, 60);
      });
    }

    /* Az azonosítót a submit pillanatában készítjük, hogy a szerveroldali
       Meta-esemény ugyanezzel dedupálhasson. */
    form.addEventListener('submit', function () {
      /* Az oldal saját kezelője előbb fut és már elindíthatta a küldést, ezért itt
         csak akkor gyártunk azonosítót, ha még nincs — így a pixel és a szerveroldali
         Meta-esemény ugyanazt az event_id-t használja (nincs dupla számolás). */
      ensureEventId();
      submitTs = Date.now();
      track('form_submit_attempt', { form_id: 'buyForm' });
      /* Ha nincs beállított szerver-végpont, az oldal saját kódja mailto-ra esik
         vissza — ilyenkor itt kell konverziót jelenteni. */
      setTimeout(function () {
        if (!window.CA_LEAD_SENT) { fireLead('mailto'); showModal('ok'); }
      }, 1500);
    }, false);

    /* Ha a szerver-végpont válaszol, azt tekintjük valódi leadnek. */
    var _fetch = window.fetch;
    if (typeof _fetch === 'function') {
      window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var isLead = CFG.LEAD_ENDPOINT && url.indexOf(CFG.LEAD_ENDPOINT) !== -1;
        if (isLead && init && init.body) {
          try {
            var body = JSON.parse(init.body);
            Object.assign(body, leadPayloadExtras());
            init.body = JSON.stringify(body);
          } catch (e) { log('a lead-törzs nem JSON, kiegészítés kihagyva'); }
        }
        var p = _fetch.apply(this, arguments);
        if (isLead) {
          p.then(function (r) {
            if (r && r.ok) { window.CA_LEAD_SENT = true; fireLead('urlap'); showModal('ok'); }
            else { log('a lead-végpont hibát adott:', r && r.status); showModal('error'); }
            return r;
          }).catch(function () { log('a lead-küldés elbukott'); showModal('error'); });
        }
        return p;
      };
    }
  }

  /* ---------- 5. Kapcsolatfelvételi kattintások ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('tel:') === 0) {
      track('contact_call', { method: 'telefon', link: h }, { track: true, name: 'Contact', params: { method: 'phone' } });
      adsConversion(CFG.ADS_CALL_LABEL);
    } else if (/wa\.me|whatsapp/i.test(h)) {
      track('contact_whatsapp', { method: 'whatsapp' }, { track: true, name: 'Contact', params: { method: 'whatsapp' } });
    } else if (h.indexOf('mailto:') === 0) {
      track('contact_email', { method: 'email' }, { track: true, name: 'Contact', params: { method: 'email' } });
    }
  }, true);

  var chat = document.getElementById('cacL');
  if (chat) chat.addEventListener('click', function () { track('chat_open', {}); });
  var human = document.getElementById('cacHm');
  if (human) human.addEventListener('click', function () { track('chat_human', {}); });

  log('ca-track betöltve', { attr: window.CA_ATTR, form: !!form });
})();
