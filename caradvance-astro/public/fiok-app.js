/* CarAdvance — ügyfélfiók oldal (/fiok/ és nyelvi változatai). Szövegek: fiok-i18n.js */
(function () {
  'use strict';
  var D = document, W = window;
  var root = D.getElementById('ca-acct');
  if (!root) return;
  var LANG = root.getAttribute('data-lang') || 'hu';
  var I = (W.CA_ACCT_I18N || {})[LANG] || (W.CA_ACCT_I18N || {}).hu;
  var LINKS = {}; try { LINKS = JSON.parse(root.getAttribute('data-links') || '{}'); } catch (e) {}
  var H1 = D.getElementById('acct-h1'), SUB = D.getElementById('acct-sub');
  var LOCALE = { hu: 'hu-HU', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', uk: 'uk-UA', zh: 'zh-CN', sk: 'sk-SK', cs: 'cs-CZ' }[LANG] || 'hu-HU';
  var LANG_NAMES = [['hu', 'Magyar'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['uk', 'Українська'], ['zh', '中文'], ['sk', 'Slovenčina'], ['cs', 'Čeština']];
  var S = { email: '', data: null, tab: 'ov', cool: 0, timer: null, note: '' };

  function t(k, v) { var s = I[k] != null ? I[k] : k; if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]); return s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function api(path, body) {
    var o = { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: {} };
    if (body) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
    return fetch('/api/fiok/' + path, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }
  function errText(j) { var k = 'err_' + (j && j.error); return I[k] ? I[k] : I.err_generic; }
  function fmtDate(s) { if (!s) return ''; var d = new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z')); if (isNaN(d)) return ''; try { return d.toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return d.toISOString().slice(0, 10); } }
  function hero(h, s) { if (H1) H1.textContent = h; if (SUB) SUB.textContent = s; }
  var ICON = {
    mail: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.3s-7.6-4.6-9.3-9.2C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.5 3.3 4.3 6.6-1.7 4.6-9.3 9.2-9.3 9.2z" fill="currentColor"/></svg>',
    car: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 16h14M4.5 16l1.6-5.2A2.5 2.5 0 018.5 9h7a2.5 2.5 0 012.4 1.8L19.5 16v2.5a1 1 0 01-1 1h-1a1 1 0 01-1-1V18H7.5v.5a1 1 0 01-1 1h-1a1 1 0 01-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="14.5" r="1" fill="currentColor"/><circle cx="16" cy="14.5" r="1" fill="currentColor"/></svg>',
    key: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="8" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    tag: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    gift: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="8" width="18" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 13v7h14v-7M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zm0 0s1.5-4.5 4-3.5S15 8 12 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  /* ------------------ kijelentkezett nézet ------------------ */
  function viewLogin(msg) {
    hero(t('h1Out'), t('subOut'));
    var priv = t('privacy').replace('{a}', '<a href="' + esc(LINKS.privacy || '/adatkezeles/') + '">').replace('{/a}', '</a>');
    root.innerHTML =
      '<div class="ac-grid">' +
      '<div class="ac-card ac-login">' +
        '<div class="ac-ic">' + ICON.mail + '</div>' +
        '<form class="ac-form" id="ac-f1" novalidate>' +
          '<label class="ac-l" for="ac-email">' + esc(t('emailL')) + '</label>' +
          '<input class="ac-in" id="ac-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required placeholder="' + esc(t('emailPh')) + '" value="' + esc(S.email) + '">' +
          '<div class="ac-err" id="ac-err1" role="alert">' + (msg ? esc(msg) : '') + '</div>' +
          '<button class="ac-btn ac-btn-red ac-wide" type="submit">' + esc(t('send')) + '</button>' +
        '</form>' +
        '<p class="ac-muted">' + esc(t('noPass')) + '</p>' +
        '<p class="ac-small">' + priv + '</p>' +
      '</div>' +
      '<div class="ac-card ac-ben"><h2>' + esc(t('benefitsT')) + '</h2><ul>' +
        ['b1', 'b2', 'b3', 'b4'].map(function (k) { return '<li><span>' + ICON.check + '</span>' + esc(t(k)) + '</li>'; }).join('') +
      '</ul></div></div>';
    var f = D.getElementById('ac-f1');
    f.addEventListener('submit', function (e) { e.preventDefault(); sendCode(D.getElementById('ac-email').value); });
    if (!msg) setTimeout(function () { var i = D.getElementById('ac-email'); if (i && W.innerWidth > 720) i.focus(); }, 60);
  }
  function sendCode(email) {
    email = String(email || '').trim();
    var err = D.getElementById('ac-err1') || D.getElementById('ac-err2');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { if (err) err.textContent = t('err_bad_email'); return; }
    S.email = email;
    var btn = root.querySelector('button[type=submit]'), rs = D.getElementById('ac-resend');
    if (btn) { btn.disabled = true; btn.textContent = t('sending'); }
    if (rs) rs.disabled = true;
    api('kod', { email: email, lang: LANG }).then(function (j) {
      if (j.ok) { S.cool = 30; viewCode(); }
      else if (D.getElementById('ac-f1')) { viewLogin(errText(j)); }
      else { var e2 = D.getElementById('ac-err2'); if (e2) e2.textContent = errText(j); if (rs) rs.disabled = false; }
    }).catch(function () { viewLogin(t('err_generic')); });
  }
  function viewCode(msg) {
    root.innerHTML =
      '<div class="ac-grid ac-one"><div class="ac-card ac-login">' +
        '<div class="ac-ic">' + ICON.key + '</div>' +
        '<h2 class="ac-h2">' + esc(t('codeT')) + '</h2>' +
        '<p class="ac-muted">' + t('codeSent', { e: '<b>' + esc(S.email) + '</b>' }) + '</p>' +
        '<form class="ac-form" id="ac-f2" novalidate>' +
          '<input class="ac-in ac-code" id="ac-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="7" aria-label="' + esc(t('codeT')) + '" placeholder="••••••">' +
          '<div class="ac-err" id="ac-err2" role="alert">' + (msg ? esc(msg) : '') + '</div>' +
          '<button class="ac-btn ac-btn-red ac-wide" type="submit">' + esc(t('verify')) + '</button>' +
        '</form>' +
        '<div class="ac-row"><button type="button" class="ac-link" id="ac-resend"></button><button type="button" class="ac-link" id="ac-other">' + esc(t('otherEmail')) + '</button></div>' +
        '<p class="ac-small">' + esc(t('codeHint')) + '</p>' +
      '</div></div>';
    var c = D.getElementById('ac-code');
    c.addEventListener('input', function () { var v = c.value.replace(/\D/g, '').slice(0, 6); if (c.value !== v) c.value = v; if (v.length === 6) verifyCode(v); });
    D.getElementById('ac-f2').addEventListener('submit', function (e) { e.preventDefault(); verifyCode(c.value.replace(/\D/g, '')); });
    D.getElementById('ac-other').onclick = function () { clearInterval(S.timer); viewLogin(); };
    D.getElementById('ac-resend').onclick = function () { sendCode(S.email); };
    tick();
    clearInterval(S.timer); S.timer = setInterval(tick, 1000);
    setTimeout(function () { c.focus(); }, 60);
  }
  function tick() {
    var b = D.getElementById('ac-resend'); if (!b) { clearInterval(S.timer); return; }
    if (S.cool > 0) { b.disabled = true; b.textContent = t('resendIn', { s: S.cool }); S.cool--; }
    else { b.disabled = false; b.textContent = t('resend'); }
  }
  var busy = false;
  function verifyCode(code) {
    if (busy) return;
    var err = D.getElementById('ac-err2');
    if (code.length !== 6) { if (err) err.textContent = t('err_wrong_code'); return; }
    busy = true;
    var btn = root.querySelector('#ac-f2 button'); if (btn) { btn.disabled = true; btn.textContent = '…'; }
    api('belepes', { email: S.email, code: code }).then(function (j) {
      busy = false;
      if (j.ok) { clearInterval(S.timer); load(); return; }
      if (btn) { btn.disabled = false; btn.textContent = t('verify'); }
      var c = D.getElementById('ac-code'); if (c) { c.value = ''; c.focus(); }
      if (err) err.textContent = errText(j);
    }).catch(function () { busy = false; if (err) err.textContent = t('err_generic'); if (btn) { btn.disabled = false; btn.textContent = t('verify'); } });
  }

  /* ------------------ belépett nézet ------------------ */
  function load() {
    root.innerHTML = '<div class="ac-loading">' + esc(t('loading')) + '</div>';
    return api('me').then(function (j) {
      if (!j.ok) { ls('ca_acct_prof', null); ls('ca_favs', null); viewLogin(); return; }
      S.data = j;
      ls('ca_acct_prof', { name: j.user.name, email: j.user.email, phone: j.user.phone, company: j.user.company });
      ls('ca_favs', (j.favs || []).map(function (f) { return f.url; }));
      var pend = ls('ca_fav_pending');
      if (pend && pend.url) {
        ls('ca_fav_pending', null);
        return api('kedvenc', pend).then(function (r) { if (r.ok) { S.tab = 'fav'; S.note = t('savedPending'); } return load(); });
      }
      paintNav(j.user);
      viewApp();
    }).catch(function () { root.innerHTML = '<div class="ac-card ac-msg">' + esc(t('err_generic')) + '</div>'; });
  }
  function paintNav(u) {
    var ini = String(u.name || u.email || '?').trim().charAt(0).toUpperCase();
    var bs = D.querySelectorAll('a.ca-pbtn');
    for (var i = 0; i < bs.length; i++) { var b = bs[i]; b.classList.add('in'); var s = b.querySelector('.ca-pini'); if (!s) { s = D.createElement('span'); s.className = 'ca-pini'; b.appendChild(s); } s.textContent = ini; }
  }
  function firstName(u) {
    var n = String(u.name || '').trim(); if (!n) return '';
    var p = n.split(/\s+/);
    if (LANG === 'hu' && p.length > 1) return p.slice(1).join(' ');
    if (LANG === 'zh') return n;
    return p[0];
  }
  function viewApp() {
    var d = S.data, u = d.user;
    var fn = firstName(u);
    hero(fn ? t('h1In', { n: fn }) : t('h1Anon'), t('subIn'));
    var openOffers = (d.offers || []).filter(function (o) { return !o.responded; }).length;
    var tabs = [['ov', t('tabOv')], ['req', t('tabReq'), (d.deals || []).length + (d.requests || []).length], ['fav', t('tabFav'), (d.favs || []).length], ['prof', t('tabProf')]];
    root.innerHTML =
      '<div class="ac-bar">' +
        '<div class="ac-who"><span class="ac-av">' + esc((u.name || u.email).charAt(0).toUpperCase()) + '</span><div><b>' + esc(u.name || u.email) + '</b><small>' + esc(u.name ? u.email : t('since', { d: fmtDate(u.created_at) })) + '</small></div></div>' +
        '<nav class="ac-tabs" role="tablist">' + tabs.map(function (x) { return '<button type="button" role="tab" data-tab="' + x[0] + '" aria-selected="' + (S.tab === x[0]) + '"' + (S.tab === x[0] ? ' class="on"' : '') + '>' + esc(x[1]) + (x[2] ? '<i>' + x[2] + '</i>' : '') + (x[0] === 'req' && openOffers ? '<em></em>' : '') + '</button>'; }).join('') + '</nav>' +
        '<button type="button" class="ac-out" id="ac-out">' + esc(t('logout')) + '</button>' +
      '</div>' +
      (S.note ? '<div class="ac-note" role="status">' + ICON.check + ' ' + esc(S.note) + '</div>' : '') +
      '<div id="ac-pane"></div>';
    S.note = '';
    var tb = root.querySelectorAll('.ac-tabs button');
    for (var i = 0; i < tb.length; i++) tb[i].onclick = function () { S.tab = this.getAttribute('data-tab'); try { history.replaceState(null, '', '#' + S.tab); } catch (e) {} viewApp(); };
    D.getElementById('ac-out').onclick = function () { api('kilepes', {}).then(function () { ls('ca_acct_prof', null); ls('ca_favs', null); location.href = location.pathname; }); };
    var pane = D.getElementById('ac-pane');
    if (S.tab === 'req') pane.innerHTML = paneReq();
    else if (S.tab === 'fav') pane.innerHTML = paneFav();
    else if (S.tab === 'prof') { pane.innerHTML = paneProf(); bindProf(); }
    else pane.innerHTML = paneOv();
    bindCommon();
  }
  function offersHtml() {
    var o = S.data.offers || []; if (!o.length) return '';
    return '<div class="ac-offers">' + o.map(function (x) {
      return '<a class="ac-offer' + (x.responded ? ' done' : '') + '" href="/ajanlat/?t=' + encodeURIComponent(x.token) + '">' +
        '<span class="ac-ic sm">' + ICON.gift + '</span><span class="ac-otx"><b>' + esc(x.responded ? t('offerSeen') : t('offerNew')) + '</b><small>' + esc([x.car, x.count ? t('offerCars', { n: x.count }) : '', fmtDate(x.created_at)].filter(Boolean).join(' · ')) + '</small></span>' +
        '<span class="ac-btn ' + (x.responded ? 'ac-btn-ghost' : 'ac-btn-red') + '">' + esc(x.responded ? t('offerDone') : t('offerCta')) + '</span></a>';
    }).join('') + '</div>';
  }
  function dealHtml(x) {
    var st = x.stages || [], idx = x.idx;
    var label = (I.stages && I.stages[x.stage]) || x.stage;
    return '<div class="ac-deal">' +
      '<div class="ac-dh"><span class="ac-pill">' + esc(t('line_' + x.line) !== 'line_' + x.line ? t('line_' + x.line) : x.line) + '</span><b>' + esc(x.car || '') + '</b><span class="ac-stage">' + esc(label) + '</span></div>' +
      (st.length ? '<ol class="ac-steps" aria-label="' + esc(idx > -1 ? t('step', { i: idx + 1, n: st.length }) : '') + '">' + st.map(function (s, i) {
        var cls = i < idx ? 'done' : (i === idx ? 'cur' : '');
        return '<li class="' + cls + '"><span class="dot">' + (i < idx ? ICON.check : (i + 1)) + '</span><span class="lb">' + esc((I.stages && I.stages[s]) || s) + '</span></li>';
      }).join('') + '</ol>' : '') +
    '</div>';
  }
  function reqHtml(r) {
    var f = r.fields || {}, keys = Object.keys(f).filter(function (k) { return !/^(Típus|type|form|Nyelv|E-mail)$/.test(k); }).slice(0, 14);
    return '<details class="ac-req"><summary><span class="ac-pill lt">' + esc(t('kind_' + r.kind) !== 'kind_' + r.kind ? t('kind_' + r.kind) : (r.kind || '')) + '</span><b>' + esc(r.car || '') + '</b><time>' + esc(fmtDate(r.created_at)) + '</time><span class="ac-more">' + esc(t('details')) + '</span></summary>' +
      (keys.length ? '<dl>' + keys.map(function (k) { return '<dt>' + esc(k) + '</dt><dd>' + esc(f[k]) + '</dd>'; }).join('') + '</dl>' : '') + '</details>';
  }
  function paneOv() {
    var d = S.data;
    var stats = [['req', t('stCases'), (d.deals || []).length], ['req', t('stOffers'), (d.offers || []).length], ['fav', t('stFavs'), (d.favs || []).length], ['req', t('stReqs'), (d.requests || []).length]];
    var active = (d.deals || []).slice(0, 2);
    var q = [['rent', 'q_rent', ICON.key], ['order', 'q_order', ICON.car], ['import', 'q_import', ICON.search], ['sell', 'q_sell', ICON.tag]];
    return offersHtml() +
      '<div class="ac-stats">' + stats.map(function (s) { return '<button type="button" class="ac-stat" data-go="' + s[0] + '"><b>' + s[2] + '</b><span>' + esc(s[1]) + '</span></button>'; }).join('') + '</div>' +
      '<div class="ac-cols">' +
        '<div class="ac-card"><h2>' + esc(t('casesT')) + '</h2>' + (active.length ? active.map(dealHtml).join('') : '<p class="ac-muted">' + esc(t('noCases')) + '</p>') +
          ((d.requests || []).length && !active.length ? '<h3 class="ac-h3">' + esc(t('reqT')) + '</h3>' + d.requests.slice(0, 3).map(reqHtml).join('') : '') + '</div>' +
        '<div class="ac-side">' +
          '<div class="ac-card"><h2>' + esc(t('quickT')) + '</h2><div class="ac-quick">' + q.map(function (x) { return LINKS[x[0]] ? '<a href="' + esc(LINKS[x[0]]) + '"><span class="ac-ic sm">' + x[2] + '</span>' + esc(t(x[1])) + '</a>' : ''; }).join('') + '</div></div>' +
          '<div class="ac-card ac-contact"><h2>' + esc(t('contactT')) + '</h2><div class="ac-person"><img src="/toth-karoly.webp" alt="" width="56" height="56" loading="lazy"><div><b>Tóth Károly</b><small>' + esc(t('contactRole')) + '</small></div></div>' +
            '<a class="ac-btn ac-btn-ghost ac-wide" href="tel:+36302146989">+36 30 214 6989</a><a class="ac-btn ac-btn-ghost ac-wide" href="mailto:info@caradvance.hu">info@caradvance.hu</a></div>' +
        '</div>' +
      '</div>';
  }
  function paneReq() {
    var d = S.data;
    var deals = d.deals || [], reqs = d.requests || [];
    return offersHtml() +
      '<div class="ac-card"><h2>' + esc(t('casesT')) + '</h2>' + (deals.length ? deals.map(dealHtml).join('') : '<p class="ac-muted">' + esc(t('noCases')) + '</p>') + '</div>' +
      '<div class="ac-card"><h2>' + esc(t('reqT')) + '</h2>' + (reqs.length ? reqs.map(reqHtml).join('') : '<p class="ac-muted">' + esc(t('noReqs')) + '</p>') + '</div>';
  }
  function paneFav() {
    var f = S.data.favs || [];
    if (!f.length) return '<div class="ac-card ac-empty"><span class="ac-ic">' + ICON.heart + '</span><p>' + esc(t('noFavs')) + '</p>' + (LINKS.browse ? '<a class="ac-btn ac-btn-red" href="' + esc(LINKS.browse) + '">' + esc(t('browse')) + '</a>' : '') + '</div>';
    return '<div class="ac-card"><h2>' + esc(t('favT')) + '</h2><div class="ac-favs">' + f.map(function (x) {
      return '<div class="ac-fav"><a href="' + esc(x.url) + '"><span class="ac-fimg">' + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : ICON.car) + '</span><b>' + esc(x.title || x.url) + '</b>' + (x.price ? '<small>' + esc(x.price) + '</small>' : '') + '</a>' +
        '<button type="button" class="ac-frm" data-rm="' + esc(x.url) + '" aria-label="' + esc(t('remove')) + '" title="' + esc(t('remove')) + '">×</button></div>';
    }).join('') + '</div></div>';
  }
  function paneProf() {
    var u = S.data.user;
    return '<div class="ac-cols ac-cols-eq"><div class="ac-card"><h2>' + esc(t('profT')) + '</h2><p class="ac-muted">' + esc(t('profSub')) + '</p>' +
      '<form class="ac-form ac-prof" id="ac-pf">' +
        '<label class="ac-l" for="pf-n">' + esc(t('name')) + '</label><input class="ac-in" id="pf-n" name="name" autocomplete="name" value="' + esc(u.name) + '">' +
        '<label class="ac-l" for="pf-p">' + esc(t('phone')) + '</label><input class="ac-in" id="pf-p" name="phone" type="tel" autocomplete="tel" value="' + esc(u.phone) + '">' +
        '<label class="ac-l" for="pf-c">' + esc(t('company')) + '</label><input class="ac-in" id="pf-c" name="company" autocomplete="organization" value="' + esc(u.company) + '">' +
        '<label class="ac-l" for="pf-e">' + esc(t('email')) + '</label><input class="ac-in" id="pf-e" value="' + esc(u.email) + '" disabled>' +
        '<label class="ac-l" for="pf-l">' + esc(t('langL')) + '</label><select class="ac-in" id="pf-l" name="lang">' + LANG_NAMES.map(function (l) { return '<option value="' + l[0] + '"' + (u.lang === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select>' +
        '<label class="ac-chk"><input type="checkbox" id="pf-m"' + (u.marketing ? ' checked' : '') + '><span>' + esc(t('mkt')) + '</span></label>' +
        '<div class="ac-row"><button class="ac-btn ac-btn-red" type="submit">' + esc(t('save')) + '</button><span class="ac-ok" id="pf-ok" role="status"></span></div>' +
      '</form></div>' +
      '<div class="ac-card ac-danger"><h2>' + esc(t('delT')) + '</h2><p class="ac-muted">' + esc(t('delSub')) + '</p><button type="button" class="ac-btn ac-btn-ghost" id="ac-del">' + esc(t('delBtn')) + '</button></div></div>';
  }
  function bindProf() {
    D.getElementById('ac-pf').addEventListener('submit', function (e) {
      e.preventDefault();
      var b = { name: D.getElementById('pf-n').value, phone: D.getElementById('pf-p').value, company: D.getElementById('pf-c').value, lang: D.getElementById('pf-l').value, marketing: D.getElementById('pf-m').checked };
      var ok = D.getElementById('pf-ok'); ok.textContent = '…';
      api('profil', b).then(function (j) {
        if (!j.ok) { ok.textContent = errText(j); return; }
        S.data.user = j.user; ls('ca_acct_prof', { name: j.user.name, email: j.user.email, phone: j.user.phone, company: j.user.company });
        paintNav(j.user); var fn = firstName(j.user); hero(fn ? t('h1In', { n: fn }) : t('h1Anon'), t('subIn'));
        var w = root.querySelector('.ac-who b'); if (w) w.textContent = j.user.name || j.user.email;
        ok.textContent = t('saved');
      });
    });
    D.getElementById('ac-del').onclick = function () {
      if (!W.confirm(t('delConfirm'))) return;
      api('torles', { confirm: true }).then(function (j) {
        if (!j.ok) return;
        ls('ca_acct_prof', null); ls('ca_favs', null);
        S.data = null; S.email = ''; viewLogin(); var e = D.getElementById('ac-err1'); if (e) { e.className = 'ac-ok'; e.textContent = t('deleted'); }
        var bs = D.querySelectorAll('a.ca-pbtn'); for (var i = 0; i < bs.length; i++) bs[i].classList.remove('in');
      });
    };
  }
  function bindCommon() {
    var g = root.querySelectorAll('[data-go]');
    for (var i = 0; i < g.length; i++) g[i].onclick = function () { S.tab = this.getAttribute('data-go'); viewApp(); W.scrollTo({ top: root.getBoundingClientRect().top + W.scrollY - 90, behavior: 'smooth' }); };
    var r = root.querySelectorAll('[data-rm]');
    for (var j = 0; j < r.length; j++) r[j].onclick = function () {
      var url = this.getAttribute('data-rm');
      api('kedvenc', { url: url, remove: true }).then(function (x) {
        if (!x.ok) return;
        S.data.favs = S.data.favs.filter(function (f) { return f.url !== url; });
        ls('ca_favs', S.data.favs.map(function (f) { return f.url; }));
        viewApp();
      });
    };
  }

  /* ------------------ indulás ------------------ */
  var h = (location.hash || '').slice(1); if (/^(ov|req|fav|prof)$/.test(h)) S.tab = h;
  var qs = new URLSearchParams(location.search);
  var tok = qs.get('t');
  if (tok) {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    hero(t('h1Anon'), t('linkLogin'));
    root.innerHTML = '<div class="ac-loading">' + esc(t('linkLogin')) + '</div>';
    api('belepes', { t: tok }).then(function (j) { if (j.ok) load(); else viewLogin(errText(j)); }).catch(function () { viewLogin(t('err_generic')); });
  } else if (/(?:^|; )ca_cust_n=/.test(D.cookie)) {
    load();
  } else {
    viewLogin();
  }
})();
