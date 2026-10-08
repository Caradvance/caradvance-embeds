/* /belso bejelentkezés: „Belépés e-mail kóddal” (jelszó nélkül) — /api/belso-kod/* */
(function () {
  'use strict';
  var D = document;
  var btn = D.getElementById('lg-btn'), emailEl = D.getElementById('lg-email'), pwEl = D.getElementById('lg-pw'), err = D.getElementById('lg-err');
  if (!btn || !emailEl || !pwEl || D.getElementById('lg-codebox')) return;
  var pwWrap = pwEl.parentElement, pwLabel = pwWrap.previousElementSibling;
  var st = 'margin-top:10px;width:100%;padding:10px;border-radius:9px;border:1px solid #2a2c33;background:transparent;color:#cfd4de;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit';
  var link = D.createElement('button'); link.type = 'button'; link.id = 'lg-codelink'; link.textContent = 'Belépés e-mail kóddal (jelszó nélkül)'; link.setAttribute('style', st);
  var box = D.createElement('div'); box.id = 'lg-codebox'; box.style.display = 'none';
  box.innerHTML = '<label style="display:block;font-size:11px;color:#8b93a7;margin:2px 0 5px">E-mailben kapott 6 jegyű kód</label>' +
    '<input id="lg-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" style="width:100%;padding:11px;border-radius:9px;border:1px solid #2a2c33;background:#0f1013;color:#fff;outline:none;font-size:22px;letter-spacing:.4em;text-align:center">' +
    '<button type="button" id="lg-codebtn" style="width:100%;margin-top:14px;padding:11px;border:0;border-radius:9px;background:#E2001A;color:#fff;font-weight:800;font-size:15px;cursor:pointer">Kód küldése</button>' +
    '<button type="button" id="lg-back" style="' + st + '">← Vissza a jelszavas belépéshez</button>';
  btn.insertAdjacentElement('afterend', link);
  link.insertAdjacentElement('afterend', box);
  var codeEl = box.querySelector('#lg-code'), cbtn = box.querySelector('#lg-codebtn'), sent = false;
  codeEl.parentElement.querySelector('label').style.display = 'none'; codeEl.style.display = 'none';
  function mode(code) {
    box.style.display = code ? '' : 'none'; link.style.display = code ? 'none' : '';
    btn.style.display = code ? 'none' : ''; pwWrap.style.display = code ? 'none' : ''; if (pwLabel) pwLabel.style.display = code ? 'none' : '';
    err.textContent = '';
  }
  function post(path, b) {
    return fetch('/api/belso-kod/' + path, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._ok = r.ok; return j; }); });
  }
  link.onclick = function () { mode(true); emailEl.focus(); };
  box.querySelector('#lg-back').onclick = function () { mode(false); sent = false; codeEl.value = ''; codeEl.style.display = 'none'; codeEl.parentElement.querySelector('label').style.display = 'none'; cbtn.textContent = 'Kód küldése'; };
  cbtn.onclick = function () {
    var email = emailEl.value.trim();
    if (!email) { err.textContent = 'Add meg a munkahelyi e-mail címed.'; return; }
    cbtn.disabled = true;
    if (!sent) {
      cbtn.textContent = 'Küldés…';
      post('kod', { email: email }).then(function (j) {
        cbtn.disabled = false;
        if (!j._ok) { cbtn.textContent = 'Kód küldése'; err.textContent = j.error || 'Hiba történt.'; return; }
        sent = true; cbtn.textContent = 'Belépés';
        codeEl.style.display = ''; codeEl.parentElement.querySelector('label').style.display = '';
        err.style.color = '#9fe3b8'; err.textContent = 'Ha ez a cím szerepel a Felhasználók között, elküldtük a kódot.'; codeEl.focus();
      });
      return;
    }
    err.style.color = '';
    post('belepes', { email: email, code: codeEl.value }).then(function (j) {
      cbtn.disabled = false;
      if (!j._ok) { err.textContent = j.error || 'Hibás kód.'; return; }
      mode(false); window.CA_hideLogin && window.CA_hideLogin(); window.CA_boot && window.CA_boot();
    });
  };
  codeEl.addEventListener('input', function () { codeEl.value = codeEl.value.replace(/\D/g, '').slice(0, 6); if (codeEl.value.length === 6) cbtn.click(); });
})();

/* CarAdvance /belso — Ügyfélfiókok: meglévő ügyfeleknek fiók létrehozása, meghívó, várható érkezés, fizetendő tételek.
   API: /api/fiok-admin/* (ugyanaz a munkatársi bejelentkezés, mint a /belso többi részén). */
(function () {
  'use strict';
  var D = document;
  var root = D.getElementById('fa-root');
  if (!root) return;
  var S = { accounts: [], candidates: [], open: null, detail: null, loaded: false, msg: '' };
  var LANGS = [['hu', 'Magyar'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['uk', 'Українська'], ['zh', '中文'], ['sk', 'Slovenčina'], ['cs', 'Čeština']];
  var STAGE_CUST = { 'Új': 'Beérkezett', 'Érdeklődés': 'Beérkezett' };

  var css = D.createElement('style');
  css.textContent = [
    '.fa-grid{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:18px;align-items:start}',
    '.fa-pad{padding:16px 17px;display:grid;gap:10px}',
    '.fa-chk{display:flex;gap:8px;align-items:center;font-size:12.5px;color:#4a5261;cursor:pointer}',
    '.fa-msg{font-size:12.5px;font-weight:600;min-height:16px}.fa-msg.ok{color:#128a63}.fa-msg.err{color:#c0392b}',
    '.fa-cand{display:flex;align-items:center;gap:10px;padding:9px 6px;border-top:1px solid var(--line2);font-size:12.5px}',
    '.fa-cand:first-child{border-top:0}.fa-cand div{flex:1;min-width:0}.fa-cand b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fa-cand small{color:#8a93a2;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.fa-st{display:inline-block;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--line2);color:#5b6472;white-space:nowrap}',
    '.fa-st.on{background:#e3f5ec;color:#128a63}.fa-st.off{background:#fdecec;color:#c0392b}.fa-st.warn{background:#fff3dc;color:#a76a00}',
    '.fa-row{cursor:pointer}.fa-sub{display:block;color:#8a93a2;font-size:11.5px;margin-top:2px}',
    '.fa-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px}',
    '.fa-head h2{margin:0;font-size:20px}.fa-acts{display:flex;flex-wrap:wrap;gap:8px}',
    '.btn.ghost{background:#fff;border:1px solid var(--line);color:var(--ink)}.btn.ghost:hover{background:var(--line2)}',
    '.fa-deal{border:1px solid var(--line);border-radius:12px;padding:13px 14px;margin:10px 0}',
    '.fa-deal-h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;font-size:13px}',
    '.fa-deal textarea{min-height:64px;resize:vertical}',
    '.fa-inv td{vertical-align:middle;padding:10px 10px}.fa-inv td:first-child{padding-left:14px}.fa-inv .btn{margin-left:3px;padding:5px 8px;font-size:11.5px;border-radius:8px}.fa-inv th:last-child,.fa-inv td:last-child{text-align:right;padding-right:14px}',
    '.fa-amount{font-weight:800;white-space:nowrap}',
    '.fa-form3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}',
    '.fa-back{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#5b6472;cursor:pointer;margin-bottom:12px;background:none;border:0;padding:0;font-family:inherit}',
    '.fa-empty{padding:18px;color:#8a93a2;font-size:13px}',
    '@media(max-width:1000px){.fa-grid{grid-template-columns:1fr}.fa-form3{grid-template-columns:1fr 1fr}}'
  ].join('\n');
  D.head.appendChild(css);

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function api(path, body) {
    var o = { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'content-type': 'application/json' } };
    if (body) o.body = JSON.stringify(body);
    return fetch('/api/fiok-admin/' + path, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) { window.CA_showLogin && window.CA_showLogin(); throw { error: 'Jelentkezz be újra.' }; }
        if (!r.ok) throw { error: j.error || 'Hiba történt.' };
        return j;
      });
    });
  }
  function money(a, c) { c = c || 'HUF'; try { return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: c, maximumFractionDigits: c === 'HUF' ? 0 : 2 }).format(a); } catch (e) { return a + ' ' + c; } }
  function day(s) { return s ? String(s).slice(0, 10).replace(/-/g, '. ') + '.' : ''; }
  function daysTo(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!m) return null; var d = new Date(+m[1], +m[2] - 1, +m[3]), n = new Date(); n = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((d - n) / 86400000); }
  function lineTag(l) { var c = { 'Eladás': 'eladas', 'Import': 'import', 'Bérlés': 'berles', 'Bizományos': 'bizomanyos' }[l] || ''; return '<span class="tag ' + c + '">' + esc(l || '—') + '</span>'; }
  function flash(id, txt, ok) { var e = D.getElementById(id); if (e) { e.className = 'fa-msg ' + (ok ? 'ok' : 'err'); e.textContent = txt; } }

  function load(keepOpen) {
    return api('accounts').then(function (j) {
      S.accounts = j.accounts || []; S.candidates = j.candidates || []; S.loaded = true;
      if (keepOpen && S.open) return openAcc(S.open);
      S.open = null; renderList();
    }).catch(function (e) { root.innerHTML = '<div class="panel"><div class="fa-empty">' + esc(e.error || 'Hiba') + '</div></div>'; });
  }

  function renderList() {
    var acc = S.accounts;
    root.innerHTML =
      '<div class="ai-note" style="margin-bottom:18px"><div>Ügyfélfiókot <b>csak meglévő ügyfélnek</b> hozz létre. Belépni csak az tud, akinek itt aktív fiókja van. Az ügyfél azokat az ügyeket látja (Eladás / Import / Bérlés / Bizományos), amelyeknél <b>ugyanez az e-mail cím</b> szerepel – a lépést, a várható érkezést, az üzenetedet és a fizetendő tételeit. Belső megjegyzés és ár nem látszik.</div></div>' +
      '<div class="fa-grid">' +
        '<div>' +
          '<div class="panel" style="margin-bottom:18px"><div class="ph">Új ügyfélfiók</div><div class="fa-pad">' +
            '<div class="fld"><label>E-mail</label><input id="fa-email" list="fa-cands" placeholder="ugyfel@email.hu" autocomplete="off"></div>' +
            '<datalist id="fa-cands">' + S.candidates.map(function (c) { return '<option value="' + esc(c.email) + '">' + esc(c.name + (c.car ? ' · ' + c.car : '')) + '</option>'; }).join('') + '</datalist>' +
            '<div class="fld"><label>Név</label><input id="fa-name" placeholder="Teljes név"></div>' +
            '<div class="row2"><div class="fld"><label>Telefon</label><input id="fa-phone"></div><div class="fld"><label>Nyelv</label><select id="fa-lang">' + LANGS.map(function (l) { return '<option value="' + l[0] + '">' + l[1] + '</option>'; }).join('') + '</select></div></div>' +
            '<label class="fa-chk"><input type="checkbox" id="fa-inv" checked> Meghívó e-mail küldése most</label>' +
            '<div><button class="btn red sm" id="fa-create">Fiók létrehozása</button></div>' +
            '<div class="fa-msg" id="fa-cmsg">' + esc(S.msg) + '</div>' +
          '</div></div>' +
          '<div class="panel"><div class="ph">Ügyfelek a CRM-ből, fiók nélkül <span class="hint" style="margin-left:auto">' + S.candidates.length + '</span></div><div class="pb">' +
            (S.candidates.length ? S.candidates.slice(0, 12).map(function (c, i) {
              return '<div class="fa-cand"><div><b>' + esc(c.name || c.email) + '</b><small>' + esc([c.email, c.line, c.car].filter(Boolean).join(' · ')) + '</small></div><button class="btn ghost sm" data-cand="' + i + '">+ Fiók</button></div>';
            }).join('') : '<div class="fa-empty">Minden CRM-ügyfélnek van már fiókja.</div>') +
          '</div></div>' +
        '</div>' +
        '<div class="panel"><div class="ph">Ügyfélfiókok <span class="hint" style="margin-left:auto">' + acc.length + '</span></div>' +
          (acc.length ? '<table><thead><tr><th>Ügyfél</th><th>Állapot</th><th>Ügyek</th><th>Fizetendő</th></tr></thead><tbody>' + acc.map(function (a) {
            var st = !a.active ? '<span class="fa-st off">Felfüggesztve</span>' : a.last_login ? '<span class="fa-st on">Aktív</span>' : a.invited_at ? '<span class="fa-st warn">Meghívva</span>' : '<span class="fa-st">Nincs meghívva</span>';
            var sub = a.last_login ? 'Utolsó belépés: ' + day(a.last_login) : a.invited_at ? 'Meghívó: ' + day(a.invited_at) : '';
            return '<tr class="fa-row" data-open="' + a.id + '"><td><b>' + esc(a.name || a.email) + '</b><span class="fa-sub">' + esc(a.email) + '</span></td><td>' + st + '<span class="fa-sub">' + esc(sub) + '</span></td><td>' + (a.deal_count || 0) + '</td><td>' + (a.open_amount ? '<span class="fa-amount">' + money(a.open_amount) + '</span>' : '—') + (a.overdue ? ' <span class="fa-st off">' + a.overdue + ' lejárt</span>' : '') + '</td></tr>';
          }).join('') + '</tbody></table>' : '<div class="fa-empty">Még nincs ügyfélfiók. Hozd létre az elsőt bal oldalt.</div>') +
        '</div>' +
      '</div>';
    S.msg = '';
    var em = D.getElementById('fa-email');
    em.addEventListener('change', function () {
      var c = S.candidates.filter(function (x) { return x.email === em.value.trim().toLowerCase(); })[0];
      if (c) { if (!D.getElementById('fa-name').value) D.getElementById('fa-name').value = c.name; if (!D.getElementById('fa-phone').value) D.getElementById('fa-phone').value = c.phone; }
    });
    D.getElementById('fa-create').onclick = create;
    root.querySelectorAll('[data-cand]').forEach(function (b) {
      b.onclick = function () { var c = S.candidates[+b.getAttribute('data-cand')]; em.value = c.email; D.getElementById('fa-name').value = c.name; D.getElementById('fa-phone').value = c.phone; em.scrollIntoView({ behavior: 'smooth', block: 'center' }); D.getElementById('fa-name').focus(); };
    });
    root.querySelectorAll('[data-open]').forEach(function (r) { r.onclick = function () { openAcc(+r.getAttribute('data-open')); }; });
  }

  function create() {
    var b = { email: D.getElementById('fa-email').value, name: D.getElementById('fa-name').value, phone: D.getElementById('fa-phone').value, lang: D.getElementById('fa-lang').value, invite: D.getElementById('fa-inv').checked };
    var btn = D.getElementById('fa-create'); btn.disabled = true;
    api('accounts', b).then(function (j) {
      S.msg = 'Fiók létrehozva' + (j.invited ? (j.invited.ok ? ', meghívó elküldve: ' + j.invited.sent_to : ' – a meghívó NEM ment el: ' + j.invited.error) : '.');
      return load();
    }).catch(function (e) { btn.disabled = false; flash('fa-cmsg', e.error, false); });
  }

  function openAcc(id) {
    S.open = id;
    root.innerHTML = '<div class="panel"><div class="fa-empty">Betöltés…</div></div>';
    return api('accounts/' + id).then(function (j) { S.detail = j; renderDetail(); }).catch(function (e) { root.innerHTML = '<div class="panel"><div class="fa-empty">' + esc(e.error) + '</div></div>'; });
  }

  function renderDetail() {
    var a = S.detail.account, deals = S.detail.deals || [], inv = S.detail.invoices || [];
    var openSum = {}; inv.filter(function (x) { return !x.paid_at; }).forEach(function (x) { openSum[x.currency] = (openSum[x.currency] || 0) + x.amount; });
    root.innerHTML =
      '<button class="fa-back" id="fa-back">← Vissza az ügyfélfiókokhoz</button>' +
      '<div class="fa-head"><div><h2>' + esc(a.name || a.email) + '</h2><div class="hint">' + esc(a.email) + ' · ' + (a.active ? 'Aktív fiók' : 'Felfüggesztve') + (a.invited_at ? ' · meghívó: ' + day(a.invited_at) : '') + (a.last_login ? ' · utolsó belépés: ' + day(a.last_login) : ' · még nem lépett be') + '</div></div>' +
        '<div class="fa-acts">' + (a.active ? '<button class="btn red sm" id="fa-invite">' + (a.invited_at ? 'Meghívó újraküldése' : 'Meghívó küldése') + '</button>' : '') +
          '<button class="btn ghost sm" id="fa-toggle">' + (a.active ? 'Felfüggesztés' : 'Aktiválás') + '</button><button class="btn ghost sm" id="fa-del">Fiók törlése</button></div></div>' +
      '<div class="fa-msg" id="fa-dmsg" style="margin:-6px 0 12px">' + esc(S.msg) + '</div>' +
      '<div class="fa-grid">' +
        '<div class="panel"><div class="ph">Adatok</div><div class="fa-pad">' +
          '<div class="fld"><label>Név</label><input id="fd-name" value="' + esc(a.name) + '"></div>' +
          '<div class="fld"><label>Telefon</label><input id="fd-phone" value="' + esc(a.phone) + '"></div>' +
          '<div class="fld"><label>Cégnév</label><input id="fd-company" value="' + esc(a.company) + '"></div>' +
          '<div class="fld"><label>Nyelv (fiók + e-mailek)</label><select id="fd-lang">' + LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (a.lang === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></div>' +
          '<div><button class="btn dark sm" id="fd-save">Mentés</button></div><div class="fa-msg" id="fd-msg"></div>' +
        '</div></div>' +
        '<div>' +
          '<div class="panel" style="margin-bottom:18px"><div class="ph">Ügyek – amit az ügyfél lát <span class="hint" style="margin-left:auto">e-mail egyezés: ' + esc(a.email) + '</span></div><div class="fa-pad">' +
            (deals.length ? deals.map(function (d) {
              return '<div class="fa-deal" data-deal="' + d.id + '"><div class="fa-deal-h">' + lineTag(d.line) + '<b>' + esc(d.car || '—') + '</b><span class="fa-st">' + esc(STAGE_CUST[d.stage] || d.stage || '') + '</span><span class="hint" style="margin-left:auto">A lépést a ' + esc(d.line) + ' táblán állítod.</span></div>' +
                '<div class="row2"><div class="fld"><label>Várható érkezés / átadás</label><input type="date" class="fd-eta" value="' + esc(d.eta || '') + '"></div><div class="fld"><label>&nbsp;</label><div class="hint" style="padding-top:10px">' + (d.updated_at ? 'Utoljára frissítve: ' + day(d.updated_at) : 'Még nincs megadva.') + '</div></div></div>' +
                '<div class="fld"><label>Üzenet az ügyfélnek (látja a fiókjában)</label><textarea class="fd-note" placeholder="pl. Az autó átment a műszaki vizsgán, a szállítás jövő héten indul.">' + esc(d.note || '') + '</textarea></div>' +
                '<div style="margin-top:8px;display:flex;gap:10px;align-items:center"><button class="btn dark sm fd-dsave">Mentés</button><span class="fa-msg"></span></div></div>';
            }).join('') : '<div class="fa-empty" style="padding:4px 0">Ehhez az e-mail címhez nincs ügy a CRM-ben. Az ügy (Eladás / Import / Bérlés / Bizományos táblán) e-mail mezőjébe írd be: <b>' + esc(a.email) + '</b></div>') +
          '</div></div>' +
          '<div class="panel"><div class="ph">Fizetendő tételek <span class="hint" style="margin-left:auto">' + (Object.keys(openSum).length ? 'Nyitott: ' + Object.keys(openSum).map(function (c) { return money(openSum[c], c); }).join(' + ') : 'nincs nyitott tétel') + '</span></div>' +
            (inv.length ? '<table class="fa-inv"><thead><tr><th>Tétel</th><th>Összeg</th><th>Határidő</th><th>Állapot</th><th></th></tr></thead><tbody>' + inv.map(function (x) {
              var n = daysTo(x.due_date);
              var st = x.paid_at ? '<span class="fa-st on">Fizetve ' + day(x.paid_at) + '</span>' : (n !== null && n < 0) ? '<span class="fa-st off">Lejárt ' + (-n) + ' napja</span>' : n === 0 ? '<span class="fa-st off">Ma esedékes</span>' : '<span class="fa-st warn">Nyitott</span>';
              return '<tr><td><b>' + esc(x.title || '—') + '</b><span class="fa-sub">' + esc(x.number || '') + '</span></td><td class="fa-amount">' + money(x.amount, x.currency) + '</td><td>' + esc(day(x.due_date)) + '</td><td>' + st + '</td><td style="white-space:nowrap;text-align:right">' +
                '<button class="btn ghost sm" data-paid="' + x.id + '" title="' + (x.paid_at ? 'Visszaállítás nyitottra' : 'Megjelölés fizetettként') + '">' + (x.paid_at ? 'Nyitott' : '✓ Fizetve') + '</button><button class="btn ghost sm" data-edit="' + x.id + '">Szerk.</button><button class="btn ghost sm" data-idel="' + x.id + '" title="Törlés">×</button></td></tr>';
            }).join('') + '</tbody></table>' : '<div class="fa-empty">Még nincs tétel.</div>') +
            '<div class="fa-pad" style="border-top:1px solid var(--line2)"><b style="font-size:13px" id="fi-title">Új tétel</b><input type="hidden" id="fi-id">' +
              '<div class="fa-form3"><div class="fld"><label>Megnevezés</label><input id="fi-t" placeholder="pl. Foglaló, 1. bérleti díj, Regisztrációs adó"></div><div class="fld"><label>Számlaszám (nem kötelező)</label><input id="fi-n"></div>' +
              '<div class="fld"><label>Ügy (nem kötelező)</label><select id="fi-d"><option value="">—</option>' + deals.map(function (d) { return '<option value="' + d.id + '">' + esc(d.line + ' · ' + (d.car || '')) + '</option>'; }).join('') + '</select></div></div>' +
              '<div class="fa-form3"><div class="fld"><label>Összeg</label><input id="fi-a" inputmode="decimal" placeholder="350000"></div><div class="fld"><label>Pénznem</label><select id="fi-c"><option>HUF</option><option>EUR</option></select></div><div class="fld"><label>Fizetési határidő</label><input id="fi-due" type="date"></div></div>' +
              '<label class="fa-chk"><input type="checkbox" id="fi-p"> Már ki van fizetve</label>' +
              '<div style="display:flex;gap:8px;align-items:center"><button class="btn red sm" id="fi-save">Tétel hozzáadása</button><button class="btn ghost sm" id="fi-cancel" style="display:none">Mégse</button><span class="fa-msg" id="fi-msg"></span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    S.msg = '';
    D.getElementById('fa-back').onclick = function () { load(); };
    var inviteBtn = D.getElementById('fa-invite');
    if (inviteBtn) inviteBtn.onclick = function () { inviteBtn.disabled = true; api('accounts/' + a.id + '/invite', {}).then(function (j) { S.msg = 'Meghívó elküldve: ' + j.sent_to; openAcc(a.id); }).catch(function (e) { inviteBtn.disabled = false; flash('fa-dmsg', e.error, false); }); };
    D.getElementById('fa-toggle').onclick = function () { api('accounts/' + a.id, { active: !a.active }).then(function () { S.msg = a.active ? 'Fiók felfüggesztve – az ügyfél nem tud belépni.' : 'Fiók aktiválva.'; openAcc(a.id); }).catch(function (e) { flash('fa-dmsg', e.error, false); }); };
    D.getElementById('fa-del').onclick = function () { if (!confirm('Biztosan törlöd ' + a.email + ' ügyfélfiókját és a fizetendő tételeit? A CRM-ügyek megmaradnak.')) return; api('accounts/' + a.id + '/delete', {}).then(function () { S.msg = 'Fiók törölve: ' + a.email; load(); }).catch(function (e) { flash('fa-dmsg', e.error, false); }); };
    D.getElementById('fd-save').onclick = function () { api('accounts/' + a.id, { name: D.getElementById('fd-name').value, phone: D.getElementById('fd-phone').value, company: D.getElementById('fd-company').value, lang: D.getElementById('fd-lang').value }).then(function () { flash('fd-msg', 'Elmentve ✓', true); }).catch(function (e) { flash('fd-msg', e.error, false); }); };
    root.querySelectorAll('[data-deal]').forEach(function (box) {
      box.querySelector('.fd-dsave').onclick = function () {
        var m = box.querySelector('.fa-msg');
        api('deal-info', { deal_id: +box.getAttribute('data-deal'), eta: box.querySelector('.fd-eta').value, note: box.querySelector('.fd-note').value })
          .then(function () { m.className = 'fa-msg ok'; m.textContent = 'Elmentve – az ügyfél már látja ✓'; }).catch(function (e) { m.className = 'fa-msg err'; m.textContent = e.error; });
      };
    });
    function invBody(extra) {
      var o = { user_id: a.id, title: D.getElementById('fi-t').value, number: D.getElementById('fi-n').value, deal_id: D.getElementById('fi-d').value, amount: D.getElementById('fi-a').value, currency: D.getElementById('fi-c').value, due_date: D.getElementById('fi-due').value, paid: D.getElementById('fi-p').checked };
      for (var k in extra) o[k] = extra[k];
      return o;
    }
    D.getElementById('fi-save').onclick = function () {
      var id = D.getElementById('fi-id').value;
      api('invoices', invBody(id ? { id: +id } : {})).then(function () { S.msg = id ? 'Tétel módosítva.' : 'Tétel hozzáadva – az ügyfél már látja.'; openAcc(a.id); }).catch(function (e) { flash('fi-msg', e.error, false); });
    };
    D.getElementById('fi-cancel').onclick = function () { renderDetail(); };
    root.querySelectorAll('[data-paid]').forEach(function (b) {
      b.onclick = function () { var x = inv.filter(function (i) { return i.id === +b.getAttribute('data-paid'); })[0]; api('invoices', { id: x.id, user_id: a.id, title: x.title, number: x.number, deal_id: x.deal_id, amount: x.amount, currency: x.currency, due_date: x.due_date, paid: !x.paid_at }).then(function () { openAcc(a.id); }).catch(function (e) { flash('fa-dmsg', e.error, false); }); };
    });
    root.querySelectorAll('[data-idel]').forEach(function (b) {
      b.onclick = function () { if (!confirm('Törlöd ezt a tételt?')) return; api('invoices/' + b.getAttribute('data-idel') + '/delete', {}).then(function () { openAcc(a.id); }); };
    });
    root.querySelectorAll('[data-edit]').forEach(function (b) {
      b.onclick = function () {
        var x = inv.filter(function (i) { return i.id === +b.getAttribute('data-edit'); })[0];
        D.getElementById('fi-id').value = x.id; D.getElementById('fi-t').value = x.title || ''; D.getElementById('fi-n').value = x.number || ''; D.getElementById('fi-d').value = x.deal_id || '';
        D.getElementById('fi-a').value = x.amount; D.getElementById('fi-c').value = x.currency || 'HUF'; D.getElementById('fi-due').value = x.due_date || ''; D.getElementById('fi-p').checked = !!x.paid_at;
        D.getElementById('fi-title').textContent = 'Tétel szerkesztése'; D.getElementById('fi-save').textContent = 'Módosítás mentése'; D.getElementById('fi-cancel').style.display = '';
        D.getElementById('fi-t').scrollIntoView({ behavior: 'smooth', block: 'center' }); D.getElementById('fi-t').focus();
      };
    });
  }

  // Betöltés, amikor a munkatárs megnyitja az Ügyfélfiókok nézetet
  D.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[data-v="ugyfelfiokok"]'); if (a) load(); });
  if (D.getElementById('v-ugyfelfiokok') && D.getElementById('v-ugyfelfiokok').classList.contains('active')) load();
})();
