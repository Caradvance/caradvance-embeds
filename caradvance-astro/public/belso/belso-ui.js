/* CarAdvance — belső irányítópult: új megjelenés + új Áttekintés (irányítópult) oldal.
 * Betöltve a /belso/ (index), /belso/ugyfel/ és /belso/szerzodesek/ oldalakon. Az oldalak saját
 * logikáját nem írja át: a meglévő oldalsávot / felső sávot alakítja át, az Áttekintés nézetbe pedig
 * új irányítópultot rajzol a már betöltött adatokból (data, crmClients, clients) + a készletből. */
(function () {
  'use strict';
  if (window.__CAUI) return; window.__CAUI = true;
  var d = document, W = window;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var IC = {
    dash: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    car: '<path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-9v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="15" r=".8"/><circle cx="16.5" cy="15" r=".8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2A5 5 0 0 1 22 19"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 7.5H6.4"/>',
    euro: '<path d="M18 6.5A7 7 0 1 0 18 17.5"/><path d="M4 10.5h10M4 13.5h10"/>',
    ft: '<path d="M7 20V5h7M7 12h6"/><path d="M16 9v9a2 2 0 0 0 2 2h1M14.5 12H19"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    head: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19a3 3 0 0 1-3 3h-3"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    send: '<path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    x: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>'
  };
  var svg = function (n, cls) { return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (IC[n] || '') + '</svg>'; };
  var isIndex = !!d.getElementById('v-overview');
  var isLoginOnly = !d.querySelector('.side') && !isIndex;

  /* ---------------- dátum, pénz, ország ---------------- */
  function toDate(s) { if (!s) return null; var t = String(s); var dt = new Date(t.replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(t) || t.length <= 10 ? '' : 'Z')); return isNaN(dt) ? null : dt; }
  var MS_DAY = 86400000;
  function daysAgo(n) { var x = new Date(); x.setHours(0, 0, 0, 0); return new Date(x.getTime() - n * MS_DAY); }
  function fmtDay(dt) { return dt ? dt.getFullYear() + '. ' + String(dt.getMonth() + 1).padStart(2, '0') + '. ' + String(dt.getDate()).padStart(2, '0') + '.' : '—'; }
  function rel(dt) {
    if (!dt) return '';
    var m = Math.round((Date.now() - dt.getTime()) / 60000);
    if (m < 1) return 'most'; if (m < 60) return m + ' perce';
    var h = Math.round(m / 60); if (h < 24) return h + ' órája';
    var dd = Math.round(h / 24); if (dd === 1) return 'tegnap'; if (dd < 30) return dd + ' napja';
    return fmtDay(dt);
  }
  function ftFull(n) { return Math.round(n || 0).toLocaleString('hu-HU').replace(/ |,/g, ' ') + ' Ft'; }
  function ftShort(n) {
    n = Math.round(n || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' Mrd Ft';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace('.', ',') + ' M Ft';
    return ftFull(n);
  }
  var CTRY = [
    { k: 'HU', n: 'Magyarország', p: ['+36', '0036', '06'], t: '.hu', c: '#E2001A' },
    { k: 'DE', n: 'Németország', p: ['+49', '0049'], t: '.de', c: '#15171c' },
    { k: 'SK', n: 'Szlovákia', p: ['+421', '00421'], t: '.sk', c: '#8a5a72' },
    { k: 'AT', n: 'Ausztria', p: ['+43', '0043'], t: '.at', c: '#2554b8' },
    { k: 'CZ', n: 'Csehország', p: ['+420', '00420'], t: '.cz', c: '#d0703a' },
    { k: 'PL', n: 'Lengyelország', p: ['+48', '0048'], t: '.pl', c: '#4f8fb8' }
  ];
  function country(x) {
    var ph = String(x.phone || '').replace(/[\s()\-\/]/g, '');
    for (var i = 0; i < CTRY.length; i++) for (var j = 0; j < CTRY[i].p.length; j++) if (ph.indexOf(CTRY[i].p[j]) === 0 && (CTRY[i].p[j] !== '06' || ph.length >= 9)) return CTRY[i];
    var em = String(x.email || '').toLowerCase();
    for (var k = 0; k < CTRY.length; k++) if (em.slice(-CTRY[k].t.length) === CTRY[k].t) return CTRY[k];
    var pg = String(x.page || x.ch || '');
    if (/caradvance\.sk/.test(pg)) return CTRY[2]; if (/caradvance\.cz/.test(pg)) return CTRY[4]; if (/caradvance\.pl/.test(pg)) return CTRY[5];
    return null;
  }
  function flagUrl(c) { return 'https://flagcdn.com/w40/' + c.k.toLowerCase() + '.png'; }

  /* ---------------- adatok összefésülése ---------------- */
  var CLOSED = /Lezárva|Átadva|Eladva/;
  /* ---------------- valódi megkeresések: Notion „Ügyfelek” (/api/belso-notion) ---------------- */
  var NL = null, nlLoading = false, nlErr = '';
  function loadNotion(force) {
    if (nlLoading || (NL && !force)) return;
    nlLoading = true;
    fetch('/api/belso-notion', { credentials: 'same-origin' }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; }); })
      .then(function (j) { NL = j.leads || []; nlErr = ''; nlLoading = false; renderDash(); updateBell(); })
      .catch(function (e) { nlErr = e.message || String(e); nlLoading = false; if (!NL) renderDash(); });
  }
  function lineOf(tags) {
    var t = (tags || []).join(' ');
    return /Bérlés/.test(t) ? 'Bérlés' : /Bizomány/.test(t) ? 'Bizományos' : /Autóimport/.test(t) ? 'Import' : /Egyedi/.test(t) ? 'Egyedi rendelés' : /Használt/.test(t) ? 'Eladás' : (tags && tags[0]) || '';
  }
  function notionRows() {
    return NL.map(function (l) {
      var fuelOnly = /^(benzin|dízel|diesel|hibrid|elektromos|plug-in hibrid|mindegy)$/i.test(l.want || '');
      var line = lineOf(l.tags);
      return {
        id: l.id, url: l.url, name: l.name, company: '', phone: l.phone, email: l.email, line: line,
        car: l.carText ? l.carText : l.car ? l.car.label : (fuelOnly ? (line ? line + ' · ' + l.want.toLowerCase() : l.want) : l.want),
        img: l.img || '', src: l.source || '', price: Number(l.budget) || 0, fee: l.fee || '', status: l.status || 'Új érdeklődő',
        status_at: l.status && l.status !== 'Új érdeklődő' ? toDate(l.edited) : null, created: toDate(l.created), notion: true
      };
    });
  }
  function rows() {
    if (NL) return notionRows();
    var deals = Array.isArray(W.data) ? W.data : [];
    var crm = Array.isArray(W.crmClients) ? W.crmClients : [];
    var byId = {}; crm.forEach(function (c) { byId[c.id] = c; });
    var out = deals.map(function (x) {
      var c = byId[x.id] || {};
      return {
        id: x.id, line: x.line, stage: x.stage, ch: x.ch, name: c.name || x.name, company: c.company || '', phone: x.phone || c.phone, email: x.email || c.email,
        car: x.car || c.car, price: Number(x.price) || 0, status: c.status || '', status_at: toDate(c.status_at), created: toDate(c.created_at || x.created_at),
        progress: c.progress
      };
    });
    if (!out.length && crm.length) out = crm.map(function (c) { return { id: c.id, line: c.line, stage: '', ch: c.ch, name: c.name, company: c.company, phone: c.phone, email: c.email, car: c.car, price: 0, status: c.status, status_at: toDate(c.status_at), created: toDate(c.created_at) }; });
    return out;
  }
  function isWon(r) { return r.status === 'Lezárva' || r.status === 'Lezárt – sikeres' || (!r.status && CLOSED.test(r.stage || '')); }
  function isLost(r) { return r.status === 'Ajánlat elutasítva' || r.status === 'Lezárt – elveszett'; }
  var PILL = {
    'Kapcsolatfelvételre vár': ['p-new', 'Új'], 'Ajánlatra vár': ['p-cont', 'Ajánlatra vár'], 'Ajánlat kiküldve': ['p-offer', 'Ajánlat kiküldve'],
    'Ajánlat módosítva': ['p-neg', 'Módosítás kérve'], 'Ajánlat elfogadva': ['p-won', 'Elfogadva'], 'Ajánlat elutasítva': ['p-lost', 'Elutasítva'],
    'Megvalósítás': ['p-won', 'Megvalósítás'], 'Lezárva': ['p-won', 'Lezárva'],
    'Új érdeklődő': ['p-new', 'Új'], 'Kapcsolatfelvétel': ['p-cont', 'Kapcsolatfelvétel'], 'Igényfelmérés': ['p-cont', 'Igényfelmérés'], 'Autókeresés': ['p-cont', 'Autókeresés'],
    'Foglaló beérkezett': ['p-neg', 'Foglaló beérkezett'], 'Behozatal folyamatban': ['p-neg', 'Behozatal'], 'Bizomány – hirdetés alatt': ['p-cont', 'Hirdetés alatt'],
    'Átadás': ['p-won', 'Átadás'], 'Lezárt – sikeres': ['p-won', 'Sikeres'], 'Lezárt – elveszett': ['p-lost', 'Elveszett']
  };
  function pill(r) {
    var p = PILL[r.status];
    if (!p) { var st = r.stage || '—'; p = [CLOSED.test(st) ? 'p-won' : /Ajánlat/.test(st) ? 'p-offer' : /Új|Érdeklődés/.test(st) ? 'p-new' : 'p-cont', st]; }
    return '<span class="caui-pill ' + p[0] + '">' + esc(p[1]) + '</span>';
  }
  function trend(cur, prev) {
    if (!prev && !cur) return '<span class="caui-flat">—</span>';
    if (!prev) return '<span class="caui-up">' + svgInline('up') + ' új</span>';
    var pct = Math.round((cur - prev) / prev * 100);
    if (pct === 0) return '<span class="caui-flat">0%</span>';
    return '<span class="' + (pct > 0 ? 'caui-up' : 'caui-down') + '">' + svgInline(pct > 0 ? 'up' : 'down') + ' ' + Math.abs(pct) + '%</span>';
  }
  function svgInline(n) { return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px">' + IC[n] + '</svg>'; }

  /* ---------------- készlet (Google Sheet → /api/belso-crm/inventory) ---------------- */
  var INV = null, invLoading = false;
  function loadInventory() {
    if (INV || invLoading || !W.currentUser) return;
    invLoading = true;
    var lines = ['Eladás', 'Bérlés', 'Bizományos'];
    Promise.all(lines.map(function (l) {
      return fetch('/api/belso-crm/inventory?line=' + encodeURIComponent(l), { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : { items: [] }; }).then(function (j) { return j.items || []; }).catch(function () { return []; });
    })).then(function (res) { INV = { sale: res[0], rent: res[1], biz: res[2] }; invLoading = false; renderDash(); });
  }

  /* ---------------- oldalsáv ---------------- */
  var NAV_ORDER = [['sec', 'Főmenü'], 'overview', 'eladas', 'import', 'berles', 'bizomanyos', ['sec', 'Ügyfélkezelés'], 'teendok', 'ugyfelek', 'ugyfelfiokok', 'szerzodesek', ['sec', 'Adminisztráció'], 'penzugy', 'email', 'naptar', 'felhasznalok', 'integraciok'];
  var NAV_LABEL = { overview: 'Irányítópult', eladas: 'Eladás', import: 'Import', berles: 'Bérlés', bizomanyos: 'Bizományos', teendok: 'Teendők', ugyfelek: 'Ügyfelek', ugyfelfiokok: 'Ügyfélfiókok', szerzodesek: 'Szerződések', penzugy: 'Pénzügy', email: 'E-mail', naptar: 'Naptár', felhasznalok: 'Felhasználók', integraciok: 'Integrációk' };
  function decorateNav() {
    var nav = d.getElementById('nav'); if (!nav || nav.__caui === nav.innerHTML) return;
    var links = {}; [].forEach.call(nav.querySelectorAll('a[data-v]'), function (a) { links[a.dataset.v] = a; });
    if (links.overview) { var sp = links.overview.querySelector('span'); if (sp) sp.textContent = NAV_LABEL.overview; var ic0 = links.overview.querySelector('svg'); if (ic0) ic0.outerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC.home + '</svg>'; }
    var FILL = { email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>', felhasznalok: IC.users };
    Object.keys(FILL).forEach(function (k) {
      var s0 = links[k] && links[k].querySelector('svg');
      if (s0 && !s0.innerHTML.trim()) s0.outerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + FILL[k] + '</svg>';
    });
    if (!links.szerzodesek && isIndex) {
      var a = d.createElement('a'); a.href = '/belso/szerzodesek/'; a.dataset.ext = '1';
      a.innerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC.doc + '</svg> <span>Szerződések</span>';
      links.szerzodesek = a;
    }
    if (!links.penzugy && !(W.currentUser && W.currentUser.role && W.currentUser.role !== 'admin')) {
      var ap = d.createElement('a'); ap.href = '/belso/penzugy/'; ap.dataset.ext = '1'; ap.dataset.v = 'penzugy';
      if (/\/belso\/penzugy\//.test(location.pathname)) ap.className = 'active';
      ap.innerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC.ft + '</svg> <span>Pénzügy</span>';
      links.penzugy = ap;
    }
    var frag = d.createDocumentFragment(), pendingSec = null;
    NAV_ORDER.forEach(function (k) {
      if (Array.isArray(k)) { pendingSec = k[1]; return; }
      var a = links[k]; if (!a) return;
      if (pendingSec) { var s = d.createElement('div'); s.className = 'nav-sec'; s.textContent = pendingSec; frag.appendChild(s); pendingSec = null; }
      if (!a.querySelector('.chev') && k !== 'overview') a.insertAdjacentHTML('beforeend', '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + IC.chev + '</svg>');
      frag.appendChild(a); delete links[k];
    });
    Object.keys(links).forEach(function (k) { frag.appendChild(links[k]); });
    nav.innerHTML = ''; nav.appendChild(frag); nav.__caui = nav.innerHTML;
  }
  function decorateSide() {
    var side = $('.side'); if (!side || side.__caui) return; side.__caui = 1;
    var img = side.querySelector('.brand img');
    if (img) { img.src = '/caradvance-logo-white.webp'; img.style.height = '50px'; }
    var lbl = side.querySelector('.lbl'); if (lbl) lbl.style.display = 'none';
    var help = d.createElement('a'); help.className = 'caui-help'; help.href = 'mailto:info@caradvance.hu?subject=CarAdvance%20admin%20%E2%80%93%20seg%C3%ADts%C3%A9g';
    help.innerHTML = svg('head') + '<span><b>Segítségre van szükséged?</b>Írj a támogatásnak</span>';
    var foot = side.querySelector('.foot');
    if (foot) { foot.innerHTML = '<b>CarAdvance Admin</b>v2.0'; side.insertBefore(help, foot); } else side.appendChild(help);
    var sp = d.createElement('div'); sp.style.flex = '1'; side.insertBefore(sp, help);
  }
  function decorateTop() {
    var tb = $('.topbar'); if (!tb || tb.__caui) return; tb.__caui = 1;
    var btns = [].slice.call(tb.querySelectorAll(':scope > .icon-btn:not(.menu-btn)'));
    // bal oldali „Áttekintés” gomb + téma / üzenetek (hamarosan) gombok: elrejtve
    btns.forEach(function (b) { if (!/Értesítés/.test(b.title || '')) b.classList.add('caui-hide'); });
    var bell = btns.filter(function (b) { return /Értesítés/.test(b.title || ''); })[0];
    if (!bell) { bell = d.createElement('button'); bell.className = 'icon-btn'; var prof = tb.querySelector('.profile'); tb.insertBefore(bell, prof); }
    bell.classList.add('caui-bell'); bell.title = 'Értesítések';
    bell.innerHTML = svg('bell', 'i') + '<span class="cnt"></span>';
    bell.style.position = 'relative';
    var dd = d.createElement('div'); dd.className = 'caui-ndrop'; bell.parentNode.insertBefore(dd, bell.nextSibling);
    var wrap = d.createElement('div'); wrap.style.position = 'relative'; wrap.style.display = 'flex'; bell.parentNode.insertBefore(wrap, bell); wrap.appendChild(bell); wrap.appendChild(dd);
    bell.addEventListener('click', function (e) { e.stopPropagation(); renderNotes(); dd.classList.toggle('open'); });
    d.addEventListener('click', function () { dd.classList.remove('open'); });
    var flag = d.createElement('span'); flag.className = 'caui-flag'; flag.title = 'Magyar';
    wrap.parentNode.insertBefore(flag, wrap.nextSibling);
    var inp = tb.querySelector('.search input'); if (inp) inp.placeholder = 'Keresés — ügyfél, autó, telefonszám…';
  }
  function newOnes() { var since = Date.now() - MS_DAY; return rows().filter(function (r) { return r.created && r.created.getTime() >= since; }); }
  function renderNotes() {
    var dd = $('.caui-ndrop'); if (!dd) return;
    var list = rows().filter(function (r) { return r.created; }).sort(function (a, b) { return b.created - a.created; }).slice(0, 6);
    dd.innerHTML = '<div class="nh">Legutóbbi megkeresések</div>' + (list.length ? list.map(function (r) {
      return '<a href="' + (r.url ? esc(r.url) + '" target="_blank" rel="noopener' : '/belso/ugyfel/?id=' + r.id) + '">' + '<span style="color:var(--red);padding-top:2px">' + svgInline('car') + '</span><span><b>' + esc(r.company || r.name || 'Névtelen') + '</b><small>' + esc([r.car, r.line].filter(Boolean).join(' · ')) + ' · ' + esc(rel(r.created)) + '</small></span></a>';
    }).join('') : '<div class="empty">Nincs új megkeresés.</div>');
  }
  function updateBell() { var c = $('.caui-bell .cnt'); if (c) { var n = newOnes().length; c.textContent = n ? (n > 99 ? '99+' : n) : ''; } }

  /* ---------------- irányítópult ---------------- */
  var range = 30;
  function greet() { var h = new Date().getHours(); return h < 10 ? 'Jó reggelt' : h < 18 ? 'Szép napot' : 'Jó estét'; }
  function firstName() {
    var n = (W.currentUser && W.currentUser.name) || ($('#curUserLabel') || {}).textContent || '';
    n = String(n).trim(); if (!n || n === '…') return '';
    var p = n.split(/\s+/);
    // magyar névsorrend (Vezetéknév Keresztnév) — a keresztnév az utolsó tag; „Marc Némethy” formánál az első
    var HU_FAM = /^(Nagy|Kovács|Tóth|Szabó|Horváth|Varga|Kiss|Molnár|Németh|Farkas|Balogh|Papp|Takács|Juhász|Lakatos|Mészáros|Oláh|Simon|Rácz|Fekete|Szilágyi|Török|Fehér|Balázs|Gál|Kis|Szűcs|Kocsis|Orsós|Pintér|Fodor|Szalai|Sipos|Magyar|Lukács|Gulyás|Biró|Király|Katona|László|Jakab|Bogdán|Balog|Sándor|Boros|Fazekas|Kelemen|Antal|Bajzáth|Vadnai|Csadi|Pálinkás)$/;
    return p.length > 1 && HU_FAM.test(p[0]) ? p[p.length - 1] : p[0];
  }
  function inRange(r, from, to) { return r.created && r.created >= from && r.created < to; }
  function renderDash() {
    var sec = d.getElementById('v-overview'); if (!sec) return;
    var host = d.getElementById('cauiDash');
    if (!host) { host = d.createElement('div'); host.id = 'cauiDash'; host.className = 'caui-dash'; sec.insertBefore(host, sec.firstChild); sec.classList.add('caui-on'); }
    var R = rows(), now = new Date(), t0 = daysAgo(0), tomorrow = new Date(t0.getTime() + MS_DAY);
    var w1 = daysAgo(6), w0 = daysAgo(13);
    var newCur = R.filter(function (r) { return inRange(r, w1, tomorrow); }).length;
    var newPrev = R.filter(function (r) { return inRange(r, w0, w1); }).length;
    var offerSt = /^(Ajánlat kiküldve|Ajánlat módosítva|Foglaló beérkezett)$/;
    var offers = R.filter(function (r) { return offerSt.test(r.status) || (!r.status && r.stage === 'Ajánlat'); });
    var offCur = offers.filter(function (r) { return r.status_at && r.status_at >= w1; }).length;
    var offPrev = offers.filter(function (r) { return r.status_at && r.status_at >= w0 && r.status_at < w1; }).length;
    var cliCur, cliPrev;
    if (NL) {
      var first = {};
      R.slice().sort(function (a, b) { return (a.created || 0) - (b.created || 0); }).forEach(function (r) { var k = (r.email || r.phone || r.name || '').toLowerCase(); if (k && !first[k]) first[k] = r.created; });
      var fs = Object.keys(first).map(function (k) { return first[k]; });
      cliCur = fs.filter(function (x) { return x && x >= w1; }).length; cliPrev = fs.filter(function (x) { return x && x >= w0 && x < w1; }).length;
    } else {
      var cl = Array.isArray(W.clients) ? W.clients : [];
      var clDate = function (c) { return toDate(c.created_at || c.created || c.date); };
      cliCur = cl.filter(function (c) { var x = clDate(c); return x && x >= w1; }).length;
      cliPrev = cl.filter(function (c) { var x = clDate(c); return x && x >= w0 && x < w1; }).length;
    }
    var mStart = new Date(now.getFullYear(), now.getMonth(), 1), pmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var pmSame = new Date(pmStart.getTime() + (now - mStart));
    var wonAt = function (r) { return r.status_at || r.created; };
    var won = R.filter(isWon);
    var revCur = won.filter(function (r) { var x = wonAt(r); return x && x >= mStart; }).reduce(function (s, r) { return s + r.price; }, 0);
    var revPrev = won.filter(function (r) { var x = wonAt(r); return x && x >= pmStart && x < pmSame; }).reduce(function (s, r) { return s + r.price; }, 0);

    var sale = INV ? INV.sale : [], rent = INV ? INV.rent : [], biz = INV ? INV.biz : [];
    var saleAct = sale.filter(function (x) { return x.active !== false; }).length, saleInact = sale.length - saleAct;
    var invTotal = INV ? sale.length + rent.length + biz.length : null;
    var openCnt = R.filter(function (r) { return !isWon(r) && !isLost(r); }).length;
    var todayCnt = R.filter(function (r) { return inRange(r, t0, tomorrow); }).length;

    var html = ''
      + '<div class="caui-row1">'
      + '<div class="caui-hero"><div class="bg"></div><div class="car"></div><div class="tx"><h2>' + greet() + (firstName() ? ',<br>' + esc(firstName()) + '!' : '!') + '</h2><p>Íme, mi történik ma a CarAdvance-nél.</p>'
      + '<div class="chips"><span>' + todayCnt + ' új megkeresés ma</span><span>' + openCnt + ' nyitott ügy</span>' + (offers.length ? '<span>' + offers.length + ' ajánlat folyamatban</span>' : '') + '</div></div></div>'
      + '<div class="caui-qa">'
      + '<a class="primary" data-act="add">' + svg('plus') + 'Új megkeresés</a>'
      + '<a data-act="clients">' + svg('user') + 'Ügyfelek</a>'
      + '<a data-act="offer">' + svg('doc') + 'Ajánlat készítése</a>'
      + '<a data-act="contracts">' + svg('upload') + 'Szerződések</a>'
      + '</div>'
      + '<div class="caui-card caui-veh"><div class="ph"></div><div class="bd"><div class="t">Autók a készletben</div><div class="n"><b>' + (invTotal == null ? '…' : invTotal) + '</b>' + (INV ? '<span class="caui-flat">' + saleAct + ' eladó · ' + rent.length + ' bérautó</span>' : '') + '</div>'
      + '<a href="https://www.caradvance.hu/autoink/" target="_blank" rel="noopener">Összes autó megtekintése →</a></div></div>'
      + '</div>'
      + '<div class="caui-kpis">'
      + kpi('car', 'Új megkeresések', newCur, trend(newCur, newPrev), 'az előző 7 naphoz képest')
      + kpi('cart', 'Aktív ajánlatok', offers.length, trend(offCur, offPrev), offCur + ' kiküldve az elmúlt 7 napban')
      + kpi('users', 'Új ügyfelek', cliCur, trend(cliCur, cliPrev), 'az előző 7 naphoz képest')
      + kpi('ft', 'Bevétel (hónap)', ftShort(revCur), trend(revCur, revPrev), 'az előző hónap azonos időszakához')
      + '</div>'
      + '<div class="caui-row3">'
      + '<div class="caui-card caui-ch"><div class="hd"><h3>Megkeresések alakulása</h3><select id="cauiRange"><option value="7">Elmúlt 7 nap</option><option value="30">Elmúlt 30 nap</option><option value="90">Elmúlt 90 nap</option></select></div><div class="caui-line" id="cauiLine" style="position:relative"></div></div>'
      + '<div class="caui-card caui-ch"><div class="hd"><h3>Megkeresések országonként</h3></div>' + donutCountries(R) + '</div>'
      + '<div class="caui-card caui-ch"><div class="hd"><h3>Készlet állapota</h3></div>' + donutStock(saleAct, saleInact, rent.length, biz.length) + '</div>'
      + '</div>'
      + '<div class="caui-row4">'
      + '<div class="caui-card caui-tbl"><div class="hd"><h3>Legutóbbi megkeresések' + (NL ? ' <span class="caui-src">Notion</span>' : nlErr ? ' <span class="caui-src err" title="' + esc(nlErr) + '">Notion nem érhető el</span>' : '') + '</h3><a class="caui-va" data-act="clients">Összes →</a></div>' + latestTable(R) + '</div>'
      + '<div class="caui-card caui-act"><div class="hd"><h3>Legutóbbi események</h3><a class="caui-va" data-act="todo">Teendők →</a></div>' + activity(R) + '</div>'
      + '</div>';
    host.innerHTML = html;
    var sel = d.getElementById('cauiRange'); sel.value = String(range);
    sel.addEventListener('change', function () { range = +sel.value; drawLine(R); });
    drawLine(R);
    updateBell();
    loadInventory();
    if (W.currentUser) loadNotion();
  }
  function kpi(ic, label, val, tr, sub) {
    return '<div class="caui-card caui-kpi"><div class="ic">' + svg(ic) + '</div><div><div class="lb">' + esc(label) + '</div><div class="vl"><b>' + esc(val) + '</b>' + tr + '</div><div class="sb">' + esc(sub) + '</div></div></div>';
  }
  function ring(segs, big, sub) {
    var tot = segs.reduce(function (s, x) { return s + x.v; }, 0), r = 56, C = 2 * Math.PI * r, off = 0;
    var arcs = tot ? segs.filter(function (x) { return x.v; }).map(function (x) {
      var len = x.v / tot * C, gap = segs.filter(function (y) { return y.v; }).length > 1 ? Math.min(2.2, len * .25) : 0;
      var s = '<circle cx="75" cy="75" r="' + r + '" fill="none" stroke="' + x.c + '" stroke-width="22" stroke-dasharray="' + Math.max(0, len - gap).toFixed(2) + ' ' + (C - Math.max(0, len - gap)).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
      off += len; return s;
    }).join('') : '<circle cx="75" cy="75" r="' + r + '" fill="none" stroke="#eef0f4" stroke-width="22"/>';
    var lg = segs.map(function (x) { return '<div><i style="background:' + x.c + '"></i><span>' + esc(x.l) + '</span><em>' + (tot ? Math.round(x.v / tot * 100) : 0) + '%</em></div>'; }).join('');
    return '<div class="caui-don"><div class="ring"><svg viewBox="0 0 150 150">' + arcs + '</svg><div class="c"><b>' + big + '</b><span>' + esc(sub) + '</span></div></div><div class="lg">' + lg + '</div></div>';
  }
  function donutCountries(R) {
    var cnt = {}, other = 0;
    R.forEach(function (r) { var c = country(r); if (c) cnt[c.k] = (cnt[c.k] || 0) + 1; else other++; });
    var segs = CTRY.map(function (c) { return { l: c.n, v: cnt[c.k] || 0, c: c.c }; }).filter(function (s) { return s.v; }).sort(function (a, b) { return b.v - a.v; });
    if (other || !segs.length) segs.push({ l: 'Egyéb / ismeretlen', v: other, c: '#b8bdc7' });
    return ring(segs, R.length, 'Összesen');
  }
  function donutStock(act, inact, rent, biz) {
    if (!INV) return '<div class="caui-empty">Készlet betöltése…</div>';
    return ring([{ l: 'Eladó (aktív)', v: act, c: '#10b981' }, { l: 'Bérautó', v: rent, c: '#15171c' }, { l: 'Bizományos', v: biz, c: '#E2001A' }, { l: 'Eladó (inaktív)', v: inact, c: '#a3a9b3' }], act + inact + rent + biz, 'Összesen');
  }
  function drawLine(R) {
    var el = d.getElementById('cauiLine'); if (!el) return;
    var n = range, start = daysAgo(n - 1), counts = [];
    for (var i = 0; i < n; i++) counts.push(0);
    R.forEach(function (r) { if (!r.created) return; var k = Math.floor((r.created - start) / MS_DAY); if (k >= 0 && k < n) counts[k]++; });
    var W0 = 520, H0 = 190, pl = 30, pr = 10, pt = 10, pb = 26, w = W0 - pl - pr, h = H0 - pt - pb;
    var max = Math.max(4, Math.max.apply(null, counts)); var step = Math.ceil(max / 4); max = step * 4;
    var X = function (i) { return pl + (n === 1 ? w / 2 : i * w / (n - 1)); }, Y = function (v) { return pt + h - v / max * h; };
    var pts = counts.map(function (v, i) { return [X(i), Y(v)]; });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = path + ' L' + X(n - 1).toFixed(1) + ' ' + (pt + h) + ' L' + pl + ' ' + (pt + h) + ' Z';
    var grid = '', i2;
    for (i2 = 0; i2 <= 4; i2++) { var yv = step * i2, yy = Y(yv); grid += '<line x1="' + pl + '" x2="' + (W0 - pr) + '" y1="' + yy + '" y2="' + yy + '" stroke="#eef0f4"/><text x="' + (pl - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10.5" fill="#8a919d">' + yv + '</text>'; }
    var lbl = '', every = n <= 7 ? 1 : n <= 30 ? 5 : 15;
    for (i2 = 0; i2 < n; i2 += every) { var dt = new Date(start.getTime() + i2 * MS_DAY); lbl += '<text x="' + X(i2) + '" y="' + (H0 - 6) + '" text-anchor="middle" font-size="10.5" fill="#8a919d">' + (dt.getMonth() + 1) + '.' + dt.getDate() + '.</text>'; }
    var dots = n <= 31 ? pts.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (n <= 7 ? 3.5 : 2.4) + '" fill="#fff" stroke="#E2001A" stroke-width="1.8" data-i="' + i + '"/>'; }).join('') : '';
    el.innerHTML = '<svg viewBox="0 0 ' + W0 + ' ' + H0 + '"><defs><linearGradient id="cauiG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#E2001A" stop-opacity=".22"/><stop offset="1" stop-color="#E2001A" stop-opacity="0"/></linearGradient></defs>'
      + grid + '<path d="' + area + '" fill="url(#cauiG)"/><path d="' + path + '" fill="none" stroke="#E2001A" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' + dots + lbl
      + '<rect x="' + pl + '" y="' + pt + '" width="' + w + '" height="' + h + '" fill="transparent" id="cauiHit"/></svg><div class="tip" id="cauiTip"></div>';
    var hit = d.getElementById('cauiHit'), tip = d.getElementById('cauiTip'), svgEl = el.querySelector('svg');
    hit.addEventListener('mousemove', function (e) {
      var b = svgEl.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * W0, i = Math.round((x - pl) / (w / Math.max(1, n - 1)));
      i = Math.max(0, Math.min(n - 1, i)); var dt = new Date(start.getTime() + i * MS_DAY);
      tip.style.display = 'block'; tip.style.left = (pts[i][0] / W0 * b.width) + 'px'; tip.style.top = (pts[i][1] / H0 * b.height) + 'px';
      tip.textContent = (dt.getMonth() + 1) + '. ' + dt.getDate() + '. — ' + counts[i] + ' megkeresés';
    });
    hit.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
  }
  function latestTable(R) {
    var list = R.slice().sort(function (a, b) { return (b.created || 0) - (a.created || 0) || b.id - a.id; }).slice(0, 6);
    if (!list.length) return '<div class="caui-empty">Még nincs megkeresés.</div>';
    return '<table><thead><tr><th>Dátum</th><th>Ügyfél</th><th>Autó</th><th>Ország</th><th>Státusz</th><th>Érték</th></tr></thead><tbody>' + list.map(function (r) {
      var c = country(r);
      return '<tr data-id="' + r.id + '"' + (r.url ? ' data-url="' + esc(r.url) + '"' : '') + '><td>' + esc(fmtDay(r.created)) + '</td><td><b style="font-weight:600">' + esc(r.company || r.name || 'Névtelen') + '</b>' + (r.src === 'E-mail' ? ' <span class="caui-src mail" title="E-mailből felvett megkeresés">E-mail</span>' : '') + '</td>'
        + '<td><div class="car">' + (r.img ? '<i class="ph" style="background-image:url(\'' + esc(r.img) + '\')"></i>' : '<i>' + svg('car') + '</i>') + '<span title="' + esc(r.car || '') + '">' + esc(r.car || '—') + '</span></div></td>'
        + '<td>' + (c ? '<span class="fl" title="' + esc(c.n) + '" style="background-image:url(' + flagUrl(c) + ')"></span>' : '<span style="color:var(--faint)">—</span>') + '</td>'
        + '<td>' + pill(r) + '</td><td class="val">' + (r.price ? esc(ftFull(r.price)) : r.fee ? esc(r.fee) : '<span style="color:var(--faint);font-weight:500">—</span>') + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function activity(R) {
    var ev = [];
    R.forEach(function (r) {
      var who = r.company || r.name || 'Névtelen', c = country(r);
      if (r.created) ev.push({ t: r.created, id: r.id, url: r.url, ic: 'car', cl: 'r', h: 'Új megkeresés érkezett', s: [who, r.car, c && c.n].filter(Boolean).join(' · ') });
      if (r.status_at && r.status && r.status !== 'Kapcsolatfelvételre vár' && r.status !== 'Új érdeklődő') {
        var m = { 'Ajánlat kiküldve': ['send', 'b', 'Ajánlat elküldve'], 'Ajánlat elfogadva': ['check', 'g', 'Ajánlat elfogadva'], 'Ajánlat elutasítva': ['x', 'o', 'Ajánlat elutasítva'], 'Ajánlat módosítva': ['swap', 'v', 'Módosítást kértek'], 'Megvalósítás': ['gear', 'v', 'Megvalósítás indult'], 'Lezárva': ['check', 'g', 'Ügylet lezárva'], 'Ajánlatra vár': ['doc', 'b', 'Ajánlatra vár'],
          'Kapcsolatfelvétel': ['user', 'b', 'Kapcsolatfelvétel'], 'Igényfelmérés': ['doc', 'b', 'Igényfelmérés'], 'Autókeresés': ['search', 'v', 'Autókeresés indult'], 'Foglaló beérkezett': ['check', 'g', 'Foglaló beérkezett'], 'Behozatal folyamatban': ['upload', 'v', 'Behozatal folyamatban'], 'Bizomány – hirdetés alatt': ['swap', 'o', 'Hirdetés alatt'], 'Átadás': ['car', 'g', 'Átadás'], 'Lezárt – sikeres': ['check', 'g', 'Ügylet sikeresen lezárva'], 'Lezárt – elveszett': ['x', 'o', 'Ügylet elveszett'] }[r.status] || ['doc', 'b', r.status];
        ev.push({ t: r.status_at, id: r.id, url: r.url, ic: m[0], cl: m[1], h: m[2], s: who + (r.car ? ' · ' + r.car : '') });
      }
    });
    ev.sort(function (a, b) { return b.t - a.t; });
    ev = ev.slice(0, 6);
    if (!ev.length) return '<div class="caui-empty">Még nincs esemény.</div>';
    return '<ul>' + ev.map(function (e) { return '<li data-id="' + e.id + '"' + (e.url ? ' data-url="' + esc(e.url) + '"' : '') + '><span class="ai ' + e.cl + '">' + svg(e.ic) + '</span><span class="tx"><b>' + esc(e.h) + '</b><span>' + esc(e.s) + '</span></span><span class="tm">' + esc(rel(e.t)) + '</span></li>'; }).join('') + '</ul>';
  }
  function onDashClick(e) {
    var a = e.target.closest('[data-act]');
    if (a) {
      e.preventDefault(); var act = a.getAttribute('data-act');
      if (act === 'add' && typeof W.openAdd === 'function') W.openAdd();
      else if (act === 'clients' && typeof W.go === 'function') W.go('ugyfelek');
      else if (act === 'todo' && typeof W.go === 'function') W.go('teendok');
      else if (act === 'offer' && typeof W.go === 'function') W.go('eladas');
      else if (act === 'contracts') location.href = '/belso/szerzodesek/';
      return;
    }
    var row = e.target.closest('tr[data-id],li[data-id]');
    if (row) { var u = row.getAttribute('data-url'); if (u) window.open(u, '_blank', 'noopener'); else location.href = '/belso/ugyfel/?id=' + row.getAttribute('data-id'); }
  }

  /* ---------------- beépülés a meglévő index-oldalba ---------------- */
  function hookIndex() {
    d.body.classList.add('caui');
    decorateSide(); decorateTop(); decorateNav();
    var wrap = function (name, after) {
      var f = W[name]; if (typeof f !== 'function' || f.__caui) return;
      var g = function () { var r = f.apply(this, arguments); try { after(r); } catch (e) { console.error('[caui]', e); } return r; };
      g.__caui = 1; W[name] = g;
    };
    wrap('renderAll', function () { decorateNav(); renderDash(); });
    wrap('renderNav', function () { decorateNav(); });
    wrap('loadCrm', function (p) { if (p && p.then) p.then(function () { renderDash(); }); });
    wrap('go', function () { var a = d.querySelector('.nav a[data-v="overview"].active'); if (a) renderDash(); });
    d.getElementById('v-overview').addEventListener('click', onDashClick);
    var nav = d.getElementById('nav');
    if (nav) nav.addEventListener('click', function (e) { var a = e.target.closest('a[data-ext]'); if (a) { e.stopPropagation(); } }, true);
    var h = (location.hash || '').slice(1);
    if (h && d.getElementById('v-' + h) && typeof W.go === 'function') setTimeout(function () { W.go(h); }, 0);
    renderDash();
    setInterval(function () { if (d.visibilityState === 'visible' && d.querySelector('#v-overview.active')) renderDash(); }, 60000);
  }

  /* ---------------- aloldalak: ugyanaz az oldalsáv + felső sáv ---------------- */
  function hookSub() {
    var body = d.body; body.classList.add('caui', 'caui-sub');
    var kids = [].slice.call(body.childNodes).filter(function (n) { return !(n.tagName === 'SCRIPT'); });
    var wrapEl = d.createElement('div'); wrapEl.className = 'caui-subwrap';
    kids.forEach(function (n) { wrapEl.appendChild(n); });
    var side = d.createElement('aside'); side.className = 'side';
    var cur = /szerzodesek/.test(location.pathname) ? 'szerzodesek' : /penzugy/.test(location.pathname) ? 'penzugy' : 'ugyfelek';
    var items = [['overview', 'home', '/belso/'], ['eladas', null, '/belso/#eladas'], ['import', null, '/belso/#import'], ['berles', null, '/belso/#berles'], ['bizomanyos', null, '/belso/#bizomanyos'], ['teendok', null, '/belso/#teendok'], ['ugyfelek', 'users', '/belso/#ugyfelek'], ['ugyfelfiokok', 'user', '/belso/#ugyfelfiokok'], ['szerzodesek', 'doc', '/belso/szerzodesek/']];
    var navIc = { eladas: 'cart', import: 'upload', berles: 'car', bizomanyos: 'swap', teendok: 'check' };
    side.innerHTML = '<div class="brand"><a href="/belso/"><img src="/caradvance-logo-white.webp" alt="CarAdvance" style="height:50px;width:auto"></a></div>'
      + '<nav class="nav" id="nav">' + items.map(function (it) {
        return '<a data-v="' + it[0] + '" href="' + it[2] + '"' + (it[0] === cur ? ' class="active"' : '') + '><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC[it[1] || navIc[it[0]] || 'dash'] + '</svg> <span>' + NAV_LABEL[it[0]] + '</span></a>';
      }).join('') + '</nav><div style="flex:1"></div><div class="foot">CarAdvance CRM</div>';
    var main = d.createElement('div'); main.className = 'main';
    main.innerHTML = '<div class="topbar"><button class="icon-btn menu-btn" type="button" aria-label="Menü">' + svg('menu', 'i') + '</button>'
      + '<form class="search" action="/belso/" method="get" onsubmit="location.href=\'/belso/#ugyfelek\';return false"><span class="sbtn">' + svg('search', 'i') + '</span><input type="search" placeholder="Keresés — ügyfél, autó, telefonszám…"></form>'
      + '<div class="tb-spacer"></div><button class="icon-btn" title="Értesítések" type="button">' + svg('bell', 'i') + '</button>'
      + '<div class="profile" id="profileToggle"><span class="avatar-circle" id="avatarCircle">–</span><div class="pinfo"><b id="curUserLabel">…</b><span id="curUserRole"></span></div></div></div>';
    main.appendChild(wrapEl);
    var scrim = d.createElement('div'); scrim.className = 'nav-scrim';
    body.insertBefore(main, body.firstChild); body.insertBefore(side, main); body.insertBefore(scrim, side);
    decorateSide(); decorateTop(); decorateNav();
    main.querySelector('.menu-btn').addEventListener('click', function () { body.classList.toggle('nav-open'); });
    scrim.addEventListener('click', function () { body.classList.remove('nav-open'); });
    fetch('/api/belso/me', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.user) return; W.currentUser = W.currentUser || j.user;
      d.getElementById('curUserLabel').textContent = j.user.name || '';
      d.getElementById('curUserRole').textContent = j.user.role === 'admin' ? 'Adminisztrátor' : 'Sales manager';
      d.getElementById('avatarCircle').textContent = String(j.user.name || '?').trim().charAt(0).toUpperCase();
      loadNotion();
    }).catch(function () {});
  }

  function init() {
    if (isIndex) hookIndex();
    else if (!isLoginOnly || /\/belso\/(ugyfel|szerzodesek|penzugy)\//.test(location.pathname)) hookSub();
    var role = $('#curUserRole'); if (role && /^Admin$/.test(role.textContent)) role.textContent = 'Adminisztrátor';
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
  W.CAUI = { renderDash: renderDash };
})();
