/* CarAdvance — ügyfélfiók oldal (/fiok/ és nyelvi változatai). Csak meglévő, meghívott ügyfeleknek.
   Szövegek: fiok-i18n.js */
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
  var OFFICE_PHONE = '+36 30 233 6060';
  var S = { email: '', data: null, tab: 'ov', cool: 0, timer: null };

  function t(k, v) { var s = I[k] != null ? I[k] : k; if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]); return s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function api(path, body) {
    var o = { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: {} };
    if (body) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
    return fetch('/api/fiok/' + path, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }
  function errText(j) { var k = 'err_' + (j && j.error); return I[k] ? I[k] : I.err_generic; }
  function parseDay(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function daysTo(s) { var d = parseDay(s); return d ? Math.round((d - today()) / 86400000) : null; }
  function fmtDay(s) { var d = parseDay(s); if (!d) return ''; try { return d.toLocaleDateString(LOCALE, { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return s; } }
  function fmtDate(s) { if (!s) return ''; var d = new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z')); if (isNaN(d)) return ''; try { return d.toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return d.toISOString().slice(0, 10); } }
  function money(a, cur) {
    cur = cur || 'HUF';
    try { return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: cur, maximumFractionDigits: cur === 'HUF' ? 0 : 2, minimumFractionDigits: 0 }).format(a); }
    catch (e) { return Math.round(a) + ' ' + cur; }
  }
  function sums(list) { var s = {}; list.forEach(function (x) { s[x.currency || 'HUF'] = (s[x.currency || 'HUF'] || 0) + Number(x.amount || 0); }); return Object.keys(s).map(function (c) { return money(s[c], c); }).join(' + ') || money(0, 'HUF'); }
  function hero(h, s) { if (H1) H1.textContent = h; if (SUB) SUB.textContent = s; }
  var ICON = {
    mail: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    key: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="8" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    gift: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="8" width="18" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 13v7h14v-7M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zm0 0s1.5-4.5 4-3.5S15 8 12 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    msg: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M6.5 3.5l3 3-2 2.5a12 12 0 006 6l2.5-2 3 3-2 3.5C10 19 5 14 3 6.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  /* ------------------ kijelentkezett nézet ------------------ */
  function viewLogin(msg, isNoAcct) {
    hero(t('h1Out'), t('subOut'));
    var priv = t('privacy').replace('{a}', '<a href="' + esc(LINKS.privacy || '/adatkezeles/') + '">').replace('{/a}', '</a>');
    root.innerHTML =
      '<div class="ac-grid">' +
      '<div class="ac-card ac-login">' +
        '<div class="ac-ic">' + ICON.mail + '</div>' +
        '<form class="ac-form" id="ac-f1" novalidate>' +
          '<label class="ac-l" for="ac-email">' + esc(t('emailL')) + '</label>' +
          '<input class="ac-in" id="ac-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required placeholder="' + esc(t('emailPh')) + '" value="' + esc(S.email) + '">' +
          '<div class="ac-err' + (isNoAcct ? ' ac-warn' : '') + '" id="ac-err1" role="alert">' + (msg ? esc(msg) : '') + '</div>' +
          '<button class="ac-btn ac-btn-red ac-wide" type="submit">' + esc(t('send')) + '</button>' +
        '</form>' +
        '<p class="ac-muted">' + esc(t('noPass')) + '</p>' +
        '<p class="ac-small">' + priv + '</p>' +
      '</div>' +
      '<div class="ac-card ac-ben"><h2>' + esc(t('benefitsT')) + '</h2><ul>' +
        ['b1', 'b2', 'b3', 'b4'].map(function (k) { return '<li><span>' + ICON.check + '</span>' + esc(t(k)) + '</li>'; }).join('') +
      '</ul><p class="ac-invite">' + esc(t('inviteOnly')) + '</p></div></div>';
    D.getElementById('ac-f1').addEventListener('submit', function (e) { e.preventDefault(); sendCode(D.getElementById('ac-email').value); });
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
      else if (D.getElementById('ac-f1')) { viewLogin(errText(j), j.error === 'no_account'); }
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
    tick(); clearInterval(S.timer); S.timer = setInterval(tick, 1000);
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
      if (!j.ok) { ls('ca_acct_prof', null); viewLogin(); return; }
      S.data = j;
      ls('ca_acct_prof', { name: j.user.name, email: j.user.email, phone: j.user.phone, company: j.user.company });
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
  function isClosed(x) { return x.stages.length ? x.idx === x.stages.length - 1 : /Lezárva|Átadva|Eladva/.test(x.stage); }
  function invState(x) {
    if (x.paid_at) return { cls: 'paid', txt: t('st_paid', { d: fmtDay(x.paid_at) }) };
    var n = daysTo(x.due_date);
    if (n === null) return { cls: 'due', txt: t('st_noDue') };
    if (n < 0) return { cls: 'over', txt: t('st_overdue', { n: -n }) };
    if (n === 0) return { cls: 'over', txt: t('st_dueToday') };
    return { cls: n <= 7 ? 'soon' : 'due', txt: t('st_dueIn', { n: n }) };
  }
  function viewApp() {
    var d = S.data, u = d.user;
    var fn = firstName(u);
    hero(fn ? t('h1In', { n: fn }) : t('h1Anon'), t('subIn'));
    var open = (d.invoices || []).filter(function (x) { return !x.paid_at; });
    var overdue = open.filter(function (x) { var n = daysTo(x.due_date); return n !== null && n < 0; });
    var tabs = [['ov', t('tabOv')], ['inv', t('tabInv'), open.length, overdue.length], ['prof', t('tabProf')]];
    root.innerHTML =
      '<div class="ac-bar">' +
        '<div class="ac-who"><span class="ac-av">' + esc((u.name || u.email).charAt(0).toUpperCase()) + '</span><div><b>' + esc(u.name || u.email) + '</b><small>' + esc(u.name ? u.email : t('since', { d: fmtDate(u.created_at) })) + '</small></div></div>' +
        '<nav class="ac-tabs" role="tablist">' + tabs.map(function (x) { return '<button type="button" role="tab" data-tab="' + x[0] + '" aria-selected="' + (S.tab === x[0]) + '"' + (S.tab === x[0] ? ' class="on"' : '') + '>' + esc(x[1]) + (x[2] ? '<i>' + x[2] + '</i>' : '') + (x[3] ? '<em></em>' : '') + '</button>'; }).join('') + '</nav>' +
        '<button type="button" class="ac-out" id="ac-out">' + esc(t('logout')) + '</button>' +
      '</div><div id="ac-pane"></div>';
    var tb = root.querySelectorAll('.ac-tabs button');
    for (var i = 0; i < tb.length; i++) tb[i].onclick = function () { S.tab = this.getAttribute('data-tab'); try { history.replaceState(null, '', '#' + S.tab); } catch (e) {} viewApp(); };
    D.getElementById('ac-out').onclick = function () { api('kilepes', {}).then(function () { ls('ca_acct_prof', null); location.href = location.pathname; }); };
    var pane = D.getElementById('ac-pane');
    if (S.tab === 'inv') pane.innerHTML = paneInv();
    else if (S.tab === 'prof') { pane.innerHTML = paneProf(); bindProf(); }
    else pane.innerHTML = paneOv();
    root.querySelectorAll('.ac-steps').forEach(function (ol) { var c = ol.querySelector('.cur,.cur-end'); if (c && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = c.offsetLeft - ol.clientWidth / 2 + c.clientWidth / 2; });
    var g = root.querySelectorAll('[data-go]');
    for (var k = 0; k < g.length; k++) g[k].onclick = function () { S.tab = this.getAttribute('data-go'); viewApp(); W.scrollTo({ top: root.getBoundingClientRect().top + W.scrollY - 90, behavior: 'smooth' }); };
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
    var lineLbl = I['line_' + x.line] || x.line;
    var etaHtml = '';
    if (x.eta && !isClosed(x)) {
      var n = daysTo(x.eta);
      etaHtml = '<div class="ac-eta">' + ICON.cal + '<span>' + esc(t('eta')) + ': <b>' + esc(fmtDay(x.eta)) + '</b>' + (n !== null && n >= 0 ? ' <em>(' + esc(n === 0 ? t('etaToday') : t('etaIn', { n: n })) + ')</em>' : '') + '</span></div>';
    }
    return '<div class="ac-deal' + (isClosed(x) ? ' closed' : '') + '">' +
      '<div class="ac-dh"><span class="ac-pill">' + esc(lineLbl) + '</span><b>' + esc(x.car || '') + '</b><span class="ac-stage">' + esc(label) + '</span></div>' +
      etaHtml +
      (st.length ? '<ol class="ac-steps" aria-label="' + esc(idx > -1 ? t('step', { i: idx + 1, n: st.length }) : '') + '">' + st.map(function (s, i) {
        var cls = i < idx ? 'done' : (i === idx ? (i === st.length - 1 ? 'done cur-end' : 'cur') : '');
        return '<li class="' + cls + '"><span class="dot">' + (i < idx || (i === idx && i === st.length - 1) ? ICON.check : (i + 1)) + '</span><span class="lb">' + esc((I.stages && I.stages[s]) || s) + '</span></li>';
      }).join('') + '</ol>' : '') +
      (x.note ? '<div class="ac-note2">' + ICON.msg + '<div><small>' + esc(t('noteT')) + '</small><p>' + esc(x.note) + '</p></div></div>' : '') +
    '</div>';
  }
  function contactHtml() {
    var c = null;
    (S.data.deals || []).some(function (x) { if (x.contact && x.contact.name) { c = x.contact; return true; } return false; });
    var name = c ? c.name : 'Tóth Károly', mail = (c && c.email) || 'info@caradvance.hu';
    var img = c ? '<span class="ac-pav">' + esc(name.charAt(0).toUpperCase()) + '</span>' : '<img src="/toth-karoly.webp" alt="" width="56" height="56" loading="lazy">';
    return '<div class="ac-card ac-contact"><h2>' + esc(t('contactT')) + '</h2><div class="ac-person">' + img + '<div><b>' + esc(name) + '</b>' + (c ? '' : '<small>' + esc(t('contactRole')) + '</small>') + '</div></div>' +
      '<a class="ac-btn ac-btn-ghost ac-wide" href="tel:' + (c ? OFFICE_PHONE : '+36302146989').replace(/[^\d+]/g, '') + '">' + ICON.phone + ' ' + esc(c ? OFFICE_PHONE : '+36 30 214 6989') + '</a>' +
      '<a class="ac-btn ac-btn-ghost ac-wide" href="mailto:' + esc(mail) + '">' + esc(mail) + '</a></div>';
  }
  function paneOv() {
    var d = S.data;
    var deals = d.deals || [];
    var active = deals.filter(function (x) { return !isClosed(x); });
    var closed = deals.filter(isClosed);
    var etas = active.map(function (x) { return x.eta; }).filter(function (e) { var n = daysTo(e); return n !== null && n >= 0; }).sort();
    var open = (d.invoices || []).filter(function (x) { return !x.paid_at; });
    var overdue = open.filter(function (x) { var n = daysTo(x.due_date); return n !== null && n < 0; });
    var stats = [
      ['', t('stCases'), String(active.length), ''],
      ['', t('stEta'), etas[0] ? fmtDay(etas[0]) : '—', ''],
      ['inv', t('stOpen'), open.length ? sums(open) : '—', ''],
      ['inv', t('stOverdue'), overdue.length ? sums(overdue) : '—', overdue.length ? 'bad' : '']
    ];
    return offersHtml() +
      '<div class="ac-stats">' + stats.map(function (s) { return '<' + (s[0] ? 'button type="button" data-go="' + s[0] + '"' : 'div') + ' class="ac-stat ' + s[3] + '"><b>' + esc(s[2]) + '</b><span>' + esc(s[1]) + '</span></' + (s[0] ? 'button' : 'div') + '>'; }).join('') + '</div>' +
      '<div class="ac-cols">' +
        '<div class="ac-card"><h2>' + esc(t('casesT')) + '</h2>' + (deals.length ? active.concat(closed).map(dealHtml).join('') : '<p class="ac-muted">' + esc(t('noCases')) + '</p>') + '</div>' +
        '<div class="ac-side">' + (open.length ? '<div class="ac-card"><h2>' + esc(t('invT')) + '</h2>' + open.slice(0, 3).map(invRow).join('') + '<button type="button" class="ac-link" data-go="inv">' + esc(t('tabInv')) + ' →</button></div>' : '') + contactHtml() + '</div>' +
      '</div>';
  }
  function invRow(x) {
    var s = invState(x);
    return '<div class="ac-inv ' + s.cls + '"><div class="ac-inv-l"><b>' + esc(x.title || x.number || '—') + '</b><small>' + esc([x.number && x.title ? t('invNo') + ': ' + x.number : '', x.due_date ? t('invDue') + ': ' + fmtDay(x.due_date) : ''].filter(Boolean).join(' · ')) + '</small></div>' +
      '<div class="ac-inv-r"><b>' + esc(money(Number(x.amount || 0), x.currency)) + '</b><span class="ac-chip ' + s.cls + '">' + esc(s.txt) + '</span></div></div>';
  }
  function paneInv() {
    var inv = S.data.invoices || [];
    var open = inv.filter(function (x) { return !x.paid_at; }), paid = inv.filter(function (x) { return x.paid_at; });
    return '<div class="ac-card"><div class="ac-invhead"><h2>' + esc(t('invT')) + '</h2>' + (open.length ? '<div class="ac-total"><small>' + esc(t('invTotal')) + '</small><b>' + esc(sums(open)) + '</b></div>' : '') + '</div>' +
      (open.length ? open.map(invRow).join('') : '<p class="ac-muted">' + esc(t('noInv')) + '</p>') +
      '<p class="ac-small">' + esc(t('invHelp')) + '</p></div>' +
      (paid.length ? '<div class="ac-card"><h2>' + esc(t('invPaidT')) + '</h2>' + paid.map(invRow).join('') + '</div>' : '');
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
        '<div class="ac-row"><button class="ac-btn ac-btn-red" type="submit">' + esc(t('save')) + '</button><span class="ac-ok" id="pf-ok" role="status"></span></div>' +
      '</form></div>' + contactHtml() + '</div>';
  }
  function bindProf() {
    D.getElementById('ac-pf').addEventListener('submit', function (e) {
      e.preventDefault();
      var b = { name: D.getElementById('pf-n').value, phone: D.getElementById('pf-p').value, company: D.getElementById('pf-c').value, lang: D.getElementById('pf-l').value };
      var ok = D.getElementById('pf-ok'); ok.textContent = '…';
      api('profil', b).then(function (j) {
        if (!j.ok) { ok.textContent = errText(j); return; }
        S.data.user = j.user; ls('ca_acct_prof', { name: j.user.name, email: j.user.email, phone: j.user.phone, company: j.user.company });
        paintNav(j.user); var fn = firstName(j.user); hero(fn ? t('h1In', { n: fn }) : t('h1Anon'), t('subIn'));
        var w = root.querySelector('.ac-who b'); if (w) w.textContent = j.user.name || j.user.email;
        ok.textContent = t('saved');
      });
    });
  }

  /* ------------------ indulás ------------------ */
  var h = (location.hash || '').slice(1); if (/^(ov|inv|prof)$/.test(h)) S.tab = h;
  var tok = new URLSearchParams(location.search).get('t');
  if (tok) {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    hero(t('h1Anon'), t('linkLogin'));
    root.innerHTML = '<div class="ac-loading">' + esc(t('linkLogin')) + '</div>';
    api('belepes', { t: tok }).then(function (j) { if (j.ok) load(); else viewLogin(errText(j), j.error === 'no_account'); }).catch(function () { viewLogin(t('err_generic')); });
  } else if (/(?:^|; )ca_cust_n=/.test(D.cookie)) {
    load();
  } else {
    viewLogin();
  }
})();
