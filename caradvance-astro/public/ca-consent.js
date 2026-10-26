/*! CarAdvance — hozzájárulás-kezelés + Google Consent Mode v2
 *  Ennek a fájlnak MINDIG a ca-track.js ELŐTT kell lefutnia.
 *  Nyilvános API:  window.CAConsent.open()  — újranyitja a beállításokat
 *                  window.CAConsent.get()   — { analytics:bool, marketing:bool } vagy null
 *  2026-10: a sáv az oldal nyelvén jelenik meg (hu, en, de, fr, uk, zh, sk, cs — a domain, az URL-előtag
 *  vagy a <html lang> alapján), és amíg látszik, a chat-gomb (.cac-launch) fölé kerül, nem takarja el a gombokat.
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

  // --- 3. Szövegek nyelvenként ---
  // [aria, cím, szöveg, link, beállítások, csak szükséges, elfogadom, szükséges, szükséges leírás,
  //  mérés, mérés leírás, hirdetés, hirdetés leírás, mentés]
  var T = {
    hu: ['Süti-beállítások', 'Sütiket használunk',
      'A működéshez szükségeseken túl mérési és hirdetési sütiket is használnánk, hogy lássuk, mi segít valóban a megfelelő autót megtalálni. Ezekhez a hozzájárulásodat kérjük.',
      'Adatvédelmi tájékoztató', 'Beállítások', 'Csak a szükségesek', 'Elfogadom',
      'Működéshez szükséges', '— mindig aktív. Az űrlap és a biztonság működéséhez kell.',
      'Mérés', '— hány látogató jön, melyik oldal működik. Google Analytics.',
      'Hirdetés', '— hirdetésmérés és -személyre szabás. Google Ads, Meta.', 'Mentés'],
    en: ['Cookie settings', 'We use cookies',
      'Besides the cookies the site needs to work, we would like to use analytics and advertising cookies to see what really helps you find the right car. For these we ask for your consent.',
      'Privacy policy', 'Settings', 'Necessary only', 'Accept',
      'Necessary', '— always on. Required for forms and security.',
      'Analytics', '— how many visitors come and which pages work. Google Analytics.',
      'Advertising', '— ad measurement and personalisation. Google Ads, Meta.', 'Save'],
    de: ['Cookie-Einstellungen', 'Wir verwenden Cookies',
      'Neben den für den Betrieb notwendigen Cookies möchten wir Analyse- und Werbe-Cookies verwenden, um zu sehen, was Ihnen wirklich hilft, das richtige Auto zu finden. Dafür bitten wir um Ihre Einwilligung.',
      'Datenschutzerklärung', 'Einstellungen', 'Nur notwendige', 'Akzeptieren',
      'Notwendig', '— immer aktiv. Für Formulare und Sicherheit erforderlich.',
      'Analyse', '— wie viele Besucher kommen und welche Seiten funktionieren. Google Analytics.',
      'Werbung', '— Messung und Personalisierung von Werbung. Google Ads, Meta.', 'Speichern'],
    fr: ['Paramètres des cookies', 'Nous utilisons des cookies',
      'En plus des cookies nécessaires au fonctionnement du site, nous aimerions utiliser des cookies de mesure d’audience et publicitaires pour voir ce qui vous aide vraiment à trouver la bonne voiture. Pour cela, nous vous demandons votre consentement.',
      'Politique de confidentialité', 'Paramètres', 'Nécessaires uniquement', 'Accepter',
      'Nécessaires', '— toujours actifs. Indispensables aux formulaires et à la sécurité.',
      'Mesure d’audience', '— combien de visiteurs viennent et quelles pages fonctionnent. Google Analytics.',
      'Publicité', '— mesure et personnalisation des annonces. Google Ads, Meta.', 'Enregistrer'],
    uk: ['Налаштування cookie', 'Ми використовуємо файли cookie',
      'Окрім файлів cookie, необхідних для роботи сайту, ми хотіли б використовувати аналітичні та рекламні cookie, щоб бачити, що справді допомагає вам знайти потрібне авто. Для цього просимо вашої згоди.',
      'Політика конфіденційності', 'Налаштування', 'Лише необхідні', 'Прийняти',
      'Необхідні', '— завжди активні. Потрібні для форм і безпеки.',
      'Аналітика', '— скільки відвідувачів приходить і які сторінки працюють. Google Analytics.',
      'Реклама', '— вимірювання та персоналізація реклами. Google Ads, Meta.', 'Зберегти'],
    zh: ['Cookie 设置', '我们使用 Cookie',
      '除网站运行所必需的 Cookie 外，我们还希望使用分析和广告 Cookie，以了解哪些内容真正帮助您找到合适的汽车。为此我们需要征得您的同意。',
      '隐私政策', '设置', '仅限必要', '接受',
      '必要', '— 始终启用。表单和安全所必需。',
      '分析', '— 访客数量以及页面效果。Google Analytics。',
      '广告', '— 广告效果衡量与个性化。Google Ads、Meta。', '保存'],
    sk: ['Nastavenia cookies', 'Používame cookies',
      'Okrem nevyhnutných cookies by sme radi používali aj analytické a reklamné cookies, aby sme videli, čo vám skutočne pomáha nájsť to správne auto. Na to potrebujeme váš súhlas.',
      'Zásady ochrany osobných údajov', 'Nastavenia', 'Len nevyhnutné', 'Súhlasím',
      'Nevyhnutné', '— vždy aktívne. Potrebné pre formuláre a bezpečnosť.',
      'Analytika', '— koľko návštevníkov prichádza a ktoré stránky fungujú. Google Analytics.',
      'Reklama', '— meranie a personalizácia reklamy. Google Ads, Meta.', 'Uložiť'],
    cs: ['Nastavení cookies', 'Používáme cookies',
      'Kromě nezbytných cookies bychom rádi používali i analytické a reklamní cookies, abychom viděli, co vám skutečně pomáhá najít ten správný vůz. K tomu potřebujeme váš souhlas.',
      'Zásady ochrany osobních údajů', 'Nastavení', 'Jen nezbytné', 'Souhlasím',
      'Nezbytné', '— vždy aktivní. Nutné pro formuláře a zabezpečení.',
      'Analytika', '— kolik návštěvníků přichází a které stránky fungují. Google Analytics.',
      'Reklama', '— měření a personalizace reklamy. Google Ads, Meta.', 'Uložit']
  };

  function lang() {
    var h = String(location.hostname || '');
    var hl = String(document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
    if (/(^|\.)caradvance\.sk$/.test(h)) return /^(en|de|hu)$/.test(hl) ? hl : 'sk';
    if (/(^|\.)caradvance\.cz$/.test(h)) return /^(en|de)$/.test(hl) ? hl : 'cs';
    var m = String(location.pathname || '').match(/^\/(?:_np\/)?(en|de|fr|uk|zh|sk|cs)(\/|$)/);
    if (m) return m[1];
    var l = String(document.documentElement.getAttribute('lang') || 'hu').slice(0, 2).toLowerCase();
    return T[l] ? l : 'hu';
  }

  function policyUrl(l) {
    var h = String(location.hostname || '');
    if (l === 'sk' && /caradvance\.sk$/.test(h)) return '/ochrana-osobnych-udajov/#cookie';
    if (l === 'cs' && /caradvance\.cz$/.test(h)) return '/ochrana-osobnich-udaju/#cookie';
    if (/caradvance\.sk$/.test(h)) return '/' + l + '/ochrana-osobnych-udajov/#cookie';
    if (/caradvance\.cz$/.test(h)) return '/' + l + '/ochrana-osobnich-udaju/#cookie';
    if (l === 'hu') return CFG.COOKIE_POLICY_URL || '/adatkezeles/#cookie';
    return '/' + l + '/adatkezeles/#cookie';
  }

  // --- 4. Banner ---
  var CSS = '' +
  '.cacb{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#111114;color:#E8E8EC;' +
  'font:14px/1.5 Poppins,system-ui,-apple-system,Segoe UI,Arial,sans-serif;border-top:1px solid #33333A;' +
  'box-shadow:0 -8px 30px rgba(0,0,0,.35);padding:16px 18px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}' +
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
  '@media(max-width:640px){.cacb-b{width:100%}.cacb button{flex:1 1 auto}}' +
  // amíg a sáv látszik, a chat-gomb fölötte van (nem takarja el az „Elfogadom” gombot)
  '.cac-launch{transition:bottom .2s ease}' +
  'html.cacb-on .cac-launch{bottom:calc(var(--cacb-h,0px) + 12px)!important}';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var box = null, ro = null;
  function measure() {
    if (!box) return;
    document.documentElement.style.setProperty('--cacb-h', box.offsetHeight + 'px');
  }
  function lift(on) {
    var r = document.documentElement;
    if (on) {
      r.classList.add('cacb-on'); measure();
      window.addEventListener('resize', measure);
      if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(box); }
    } else {
      r.classList.remove('cacb-on'); r.style.removeProperty('--cacb-h');
      window.removeEventListener('resize', measure);
      if (ro) { ro.disconnect(); ro = null; }
    }
  }

  function render(existing) {
    if (box) { box.parentNode.removeChild(box); box = null; }
    var style = document.getElementById('cacb-css');
    if (!style) {
      style = el('style', { id: 'cacb-css' }); style.textContent = CSS;
      document.head.appendChild(style);
    }
    var l = lang(), t = T[l] || T.hu;
    var pol = policyUrl(l);
    var st = existing || { analytics: true, marketing: true };

    box = el('div', { class: 'cacb', role: 'dialog', 'aria-live': 'polite', 'aria-label': t[0], lang: l === 'cs' ? 'cs' : l });
    box.innerHTML =
      '<div class="cacb-in">' +
        '<div class="cacb-t"><b>' + esc(t[1]) + '</b>' + esc(t[2]) + ' ' +
        '<a href="' + esc(pol) + '">' + esc(t[3]) + '</a></div>' +
        '<div class="cacb-b">' +
          '<button type="button" data-ca="settings">' + esc(t[4]) + '</button>' +
          '<button type="button" data-ca="reject">' + esc(t[5]) + '</button>' +
          '<button type="button" class="pri" data-ca="accept">' + esc(t[6]) + '</button>' +
        '</div>' +
        '<div class="cacb-o" data-ca="opts">' +
          '<div class="cacb-row"><input type="checkbox" checked disabled id="cacb-nec">' +
            '<label for="cacb-nec"><b>' + esc(t[7]) + '</b> <span>' + esc(t[8]) + '</span></label></div>' +
          '<div class="cacb-row"><input type="checkbox" id="cacb-an"' + (st.analytics ? ' checked' : '') + '>' +
            '<label for="cacb-an"><b>' + esc(t[9]) + '</b> <span>' + esc(t[10]) + '</span></label></div>' +
          '<div class="cacb-row"><input type="checkbox" id="cacb-mk"' + (st.marketing ? ' checked' : '') + '>' +
            '<label for="cacb-mk"><b>' + esc(t[11]) + '</b> <span>' + esc(t[12]) + '</span></label></div>' +
          '<div class="cacb-b" style="margin-top:10px">' +
            '<button type="button" class="pri" data-ca="save">' + esc(t[13]) + '</button></div>' +
        '</div>' +
      '</div>';

    box.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ca]') : null;
      if (!b) return;
      var a = b.getAttribute('data-ca');
      if (a === 'settings') { box.querySelector('[data-ca="opts"]').classList.toggle('on'); measure(); return; }
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
    lift(true);
  }

  function finish(state) {
    write(state); apply(state, true);
    lift(false);
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
