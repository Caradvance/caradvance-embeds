/* CarAdvance — mega menü (TESZT). Csak a /teszt-mega-menu/ oldal tölti be; az éles menüt nem érinti.
   Asztali nézetben (>= 1100 px) a fő menüpontok alá teljes szélességű panelt nyit; mobilon a régi menü marad. */
(function () {
  'use strict';
  var MIN_W = 1100;
  var ICON = {
    car: '<path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6M6 11h12"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
    compare: '<path d="M7 7h11l-3-3M17 17h-11l3 3"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7h3.5"/>',
    shield: '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1-8.5 15a12 12 0 0 1-8.5-15a12 12 0 0 0 8.5-3"/><path d="M9 12l2 2l4-4"/>',
    star: '<path d="M12 17.75l-6.17 3.24l1.18-6.87l-5-4.86l6.9-1l3.09-6.26l3.09 6.26l6.9 1l-5 4.86l1.18 6.87z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M12 17v.01M12 13.5a1.5 1.5 0 0 1 1-1.5a2.6 2.6 0 1 0-3-4"/>',
    store: '<path d="M3 21h18M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2-4h14l2 4M5 21v-10.15M19 21v-10.15"/>',
    sliders: '<path d="M4 6h8M16 6h4M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="14" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9a2 2 0 0 0-1.8-1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1-1.8-1M12 7v10"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 12v.01M3 13a20 20 0 0 0 18 0"/>',
    cash: '<rect x="7" y="9" width="14" height="10" rx="2"/><circle cx="14" cy="14" r="2"/><path d="M17 9v-2a2 2 0 0 0-2-2h-10a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>',
    garage: '<path d="M3 20v-11l9-5l9 5v11M13 13h4M13 16h4M8 20v-7h8v7"/>',
    heart: '<path d="M19.5 12.57l-7.5 7.43l-7.5-7.43a5 5 0 1 1 7.5-6.57a5 5 0 1 1 7.5 6.58"/>',
    timeline: '<path d="M4 16l6-7l5 5l5-6"/><circle cx="15" cy="14" r="1"/><circle cx="10" cy="9" r="1"/><circle cx="4" cy="16" r="1"/><circle cx="20" cy="8" r="1"/>',
    truck: '<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h-2v-11a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5"/>',
    list: '<path d="M3.5 5.5l1.5 1.5l2.5-2.5M3.5 11.5l1.5 1.5l2.5-2.5M3.5 17.5l1.5 1.5l2.5-2.5M11 6h9M11 12h9M11 18h9"/>',
    calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="7" width="8" height="3" rx="1"/><path d="M8 14v.01M12 14v.01M16 14v.01M8 17v.01M12 17v.01M16 17v.01"/>',
    scale: '<path d="M7 20h10M6 6l6-1l6 1M12 3v17M9 12l-3-6l-3 6a3 3 0 0 0 6 0M21 12l-3-6l-3 6a3 3 0 0 0 6 0"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85"/>',
    eye: '<circle cx="12" cy="12" r="2"/><path d="M22 12c-2.67 4.67-6 7-10 7s-7.33-2.33-10-7c2.67-4.67 6-7 10-7s7.33 2.33 10 7"/>',
    cert: '<circle cx="15" cy="15" r="3"/><path d="M13 17.5v4.5l2-1.5l2 1.5v-4.5M10 19h-5a2 2 0 0 1-2-2v-10c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-1 1.73M6 9h12M6 12h3M6 15h2"/>',
    news: '<path d="M16 6h3a1 1 0 0 1 1 1v11a2 2 0 0 1-4 0v-13a1 1 0 0 0-1-1h-10a1 1 0 0 0-1 1v12a3 3 0 0 0 3 3h11M8 8h4M8 12h4M8 16h4"/>',
    media: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3l-5 3z"/>',
    phone: '<path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5l5 2v4a2 2 0 0 1-2 2a16 16 0 0 1-15-15a2 2 0 0 1 2-2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    pin: '<circle cx="12" cy="11" r="3"/><path d="M17.66 16.66l-4.24 4.24a2 2 0 0 1-2.83 0l-4.25-4.24a8 8 0 1 1 11.32 0z"/>',
    arrow: '<path d="M5 12h14M13 18l6-6M13 6l6 6"/>'
  };
  function svg(n, s) { return '<svg class="mm-ic" width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || '') + '</svg>'; }
  var B = function (k, n, href) { return { k: k, n: n, href: href }; };
  var RENT_BRANDS = [B('bmw', 'BMW'), B('mercedes', 'Mercedes'), B('audi', 'Audi'), B('mini', 'MINI'), B('vw', 'Volkswagen'), B('cupra', 'CUPRA'), B('seat', 'SEAT'), B('hyundai', 'Hyundai'), B('kia', 'Kia'), B('volvo', 'Volvo'), B('man', 'MAN')]
    .map(function (b) { b.href = '/autoink/?marka=' + (b.k === 'vw' ? 'volkswagen' : b.k) + '#berelheto'; return b; });
  var BUY_BRANDS = [B('bmw', 'BMW'), B('mini', 'MINI'), B('mercedes', 'Mercedes'), B('audi', 'Audi')]
    .map(function (b) { b.href = '/egyedi-auto-rendeles/?brand=' + b.k; return b; });
  var P = [
    { brands: RENT_BRANDS, bt: 'Bérelhető autóink', bhref: '/autoink/#berelheto', bcols: 3,
      links: [['info', 'Mi a tartós bérlet?', '/tartos-berlet/', 'Minden benne van egy havi díjban'], ['compare', 'Autók összehasonlítása', '/auto-osszehasonlitas/', 'Akár 3 modell egymás mellett'], ['route', 'Bérlési folyamat', '/berlesi-folyamat/', 'Lépésről lépésre az átadásig'], ['shield', 'Feltételek és kaució', '/berlesi-feltetelek/', 'Önrész, km-keret, kaució'], ['star', 'Előnyök', '/berles-elonyei/', 'Miért éri meg bérelni?'], ['help', 'Gyakori kérdések', '/berles-gyakori-kerdesek/', 'Válaszok a gyakori kérdésekre']],
      f: { img: '/piros-bmw-x6-m-premium-autoberles.webp', t: 'Prémium autó, egy havi díjért', s: 'Szerviz, gumi, biztosítás és adó a díjban.', cta: 'Bérelhető autóink', href: '/autoink/#berelheto' } },
    { brands: BUY_BRANDS, bt: 'Egyedi autó rendelés', bhref: '/egyedi-auto-rendeles/', bcols: 2,
      links: [['store', 'Autóink', '/autoink/', 'Ellenőrzött autók Németországból'], ['coin', 'Finanszírozás – lízing', '/finanszirozas-lizing/', 'Havi részlet kiszámolása'], ['briefcase', 'Operatív lízing', '/operativ-lizing/', 'Cégeknek, nettó áron'], ['star', 'Előnyök', '/vasarlas-elonyei/', 'Miért vásárolj tőlünk?'], ['help', 'Gyakori kérdések', '/vasarlas-gyakori-kerdesek/', 'Áfa, garancia, átadás']],
      f: { img: '/bmw-m3-touring-premium-auto-eladas.webp', t: 'Konfiguráld, mi beszerezzük', s: 'BMW, MINI, Mercedes és Audi – gyári konfigurátorral.', cta: 'Egyedi rendelés', href: '/egyedi-auto-rendeles/' } },
    { links: [['cash', 'Eladom az autómat', '/eladom/', 'Ingyenes értékbecslés'], ['garage', 'Bizományos autóink', '/bizomanyos/', 'Eladó autók ügyfeleinktől'], ['timeline', 'Értékesítési folyamat', '/ertekesitesi-folyamat/', 'Mi intézünk mindent'], ['heart', 'Jótékonyság', '/jotekonysag/', 'Minden eladás után adományozunk'], ['help', 'Gyakori kérdések', '/gyakori-kerdesek/', 'Díjak, határidők, papírok']],
      f: { img: '/toyota-rav4-hybrid-hasznaltauto-eladas.webp', t: 'Mennyit ér az autód?', s: 'Hirdetjük, bemutatjuk, eladjuk – te csak átveszed a pénzt.', cta: 'Értékbecslést kérek', href: '/eladom/' } },
    { links: [['truck', 'Autó rendelés', '/auto-rendeles/', 'Megkeressük, ellenőrizzük, hazahozzuk'], ['list', 'Beszerzési folyamat', '/beszerzesi-folyamat/', 'Az ajánlattól a forgalomba helyezésig'], ['scale', 'Egyedül vagy velünk?', '/egyedul-vagy-velunk/', 'Költségek és kockázatok összevetve'], ['star', 'Előnyök', '/elonyok/', 'Miért Németországból?'], ['users', 'Referenciák', '/referenciak/', 'Ügyfeleink autói']],
      side: { t: 'Kalkulátorok', items: [['calc', 'Honosítás kalkulátor', '/honositas-kalkulator/'], ['calc', 'Átírás kalkulátor', '/atiras-kalkulator/'], ['calc', 'Lízing kalkulátor', '/finanszirozas-lizing/']] },
      f: { img: '/autoszallitas-autoimport-nemetorszagbol.webp', t: 'Autó Németországból, kulcsrakészen', s: 'Szállítás, honosítás, forgalomba helyezés – mi intézzük.', cta: 'Autót rendelek', href: '/auto-rendeles/' } },
    { links: [['users', 'Miért mi?', '/miert-mi/', 'Német háttér, magyar ügyintézés'], ['eye', 'Átláthatóság', '/atlathatosag/', 'Tételes, előre rögzített árak'], ['cert', 'Minőségbiztosítás', '/minosegbiztositas/', 'Ellenőrzött autók, garancia'], ['star', 'Referenciák', '/referenciak/', 'Ügyfeleink történetei'], ['media', 'Media', '/media/', 'Megjelenések'], ['news', 'Blog', '/blog/', 'Útmutatók, adók, árak']],
      f: { img: '/caradvance-iroda.webp', t: 'Gyere be hozzánk', s: 'Solymár, Ibolya utca 18. – hétfőtől péntekig 9–17.', cta: 'Kapcsolat', href: '/kapcsolat/' } }
  ];
  var CSS = '' +
    '.mm-on .ca-nav .menu .dropdown{display:none!important}' +
    '.mm-on .ca-nav .menu .navitem.mm-act>.navlink{color:#E2001A}' +
    '.mm-panel{position:absolute;left:50%;top:calc(100% + 10px);transform:translate(-50%,6px);width:min(1320px,calc(100vw - 28px));background:#fff;border-radius:26px;box-shadow:0 22px 60px rgba(8,8,10,.22);opacity:0;visibility:hidden;transition:opacity .16s ease,transform .16s ease,visibility 0s .16s;z-index:1001;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#14151A}' +
    '.mm-panel.open{opacity:1;visibility:visible;transform:translate(-50%,0);transition:opacity .16s ease,transform .16s ease}' +
    '.mm-in{display:grid;gap:28px;padding:28px 30px 20px}' +
    '.mm-h{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#7A8496;margin:0 0 10px;display:flex;align-items:center;gap:6px}' +
    '.mm-h a{color:inherit;text-decoration:none}.mm-h a:hover{color:#E2001A}' +
    '.mm-brands{display:grid;gap:2px 8px}' +
    '.mm-b{display:flex;align-items:center;gap:14px;padding:9px 12px;border-radius:14px;text-decoration:none;color:#14151A;font-weight:700;font-size:16px}' +
    '.mm-b:hover,.mm-b:focus-visible{background:#F4F5F7;outline:none}' +
    '.mm-b img{width:30px;height:30px;object-fit:contain;flex:none}' +
    '.mm-l{display:flex;gap:12px;padding:9px 10px;border-radius:14px;text-decoration:none;color:#14151A}' +
    '.mm-l:hover,.mm-l:focus-visible{background:#F4F5F7;outline:none}.mm-l:hover .mm-ic{color:#E2001A}' +
    '.mm-l .mm-ic{color:#5A6B82;flex:none;margin-top:1px;transition:color .12s}' +
    '.mm-l b{display:block;font-size:15px;font-weight:700;line-height:1.3}.mm-l span{display:block;font-size:13px;color:#5A6B82;line-height:1.4;margin-top:2px}' +
    '.mm-chip{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #E6EAF1;border-radius:14px;text-decoration:none;color:#14151A;font-weight:700;font-size:14px;margin-bottom:8px}' +
    '.mm-chip:hover{border-color:#E2001A;color:#E2001A}' +
    '.mm-card{display:block;border-radius:20px;overflow:hidden;background:#0B0B0D;color:#fff;text-decoration:none;position:relative;min-height:250px}' +
    '.mm-card img{width:100%;height:150px;object-fit:cover;display:block}' +
    '.mm-card .mm-ct{padding:14px 16px 16px}.mm-card b{display:block;font-size:17px;line-height:1.3}.mm-card span{display:block;font-size:13px;color:#C9CFDA;margin:4px 0 12px}' +
    '.mm-btn{display:inline-flex;align-items:center;gap:6px;background:#E2001A;color:#fff;border-radius:999px;padding:9px 16px;font-size:13px;font-weight:700}' +
    '.mm-card:hover .mm-btn{background:#B80015}' +
    '.mm-foot{display:flex;flex-wrap:wrap;gap:22px;padding:13px 30px;border-top:1px solid #E6EAF1;font-size:13px;color:#5A6B82}' +
    '.mm-foot span{display:inline-flex;align-items:center;gap:6px}.mm-foot a{color:inherit;text-decoration:none}.mm-foot a:hover{color:#E2001A}' +
    '.mm-all{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;color:#E2001A;text-decoration:none;margin:8px 0 0 12px}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function panelHtml(p) {
    var cols = [];
    if (p.brands) {
      cols.push('1.5fr');
    }
    cols.push(p.brands ? '1.25fr' : '1.6fr');
    if (p.side) cols.push('0.9fr');
    cols.push('1fr');
    var h = '<div class="mm-in" style="grid-template-columns:' + cols.map(function (c) { return 'minmax(0,' + c + ')'; }).join(' ') + '">';
    if (p.brands) {
      h += '<div><p class="mm-h"><a href="' + p.bhref + '">' + esc(p.bt) + ' ›</a></p><div class="mm-brands" style="grid-template-columns:repeat(' + p.bcols + ',minmax(0,1fr))">' +
        p.brands.map(function (b) { return '<a class="mm-b" href="' + b.href + '"><img src="/bl-' + b.k + '-dark.webp" alt="" width="30" height="30" loading="lazy">' + esc(b.n) + '</a>'; }).join('') + '</div></div>';
    }
    h += '<div><p class="mm-h">Oldalak</p>' + p.links.map(function (l) { return '<a class="mm-l" href="' + l[2] + '">' + svg(l[0]) + '<div><b>' + esc(l[1]) + '</b><span>' + esc(l[3]) + '</span></div></a>'; }).join('') + '</div>';
    if (p.side) h += '<div><p class="mm-h">' + esc(p.side.t) + '</p>' + p.side.items.map(function (s) { return '<a class="mm-chip" href="' + s[2] + '">' + svg(s[0], 18) + esc(s[1]) + '</a>'; }).join('') + '</div>';
    h += '<div><p class="mm-h">Kiemelt</p><a class="mm-card" href="' + p.f.href + '"><img src="' + p.f.img + '" alt="" loading="lazy"><div class="mm-ct"><b>' + esc(p.f.t) + '</b><span>' + esc(p.f.s) + '</span><span class="mm-btn">' + esc(p.f.cta) + ' ' + svg('arrow', 16) + '</span></div></a></div>';
    h += '</div><div class="mm-foot"><span>' + svg('star', 16) + '5,0 Google értékelés</span><span>' + svg('phone', 16) + '<a href="tel:+36302336060">+36 30 233 6060</a></span><span>' + svg('clock', 16) + 'Válasz 1 órán belül, munkaidőben</span><span>' + svg('pin', 16) + 'Geretsried (DE) · Solymár (HU)</span></div>';
    return h;
  }

  function init() {
    var wrap = document.querySelector('.ca-navwrap');
    var items = wrap ? [].slice.call(wrap.querySelectorAll('.ca-nav .menu > .navitem')) : [];
    if (!wrap || items.length < 5) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var panel = el('<div class="mm-panel" role="region" aria-label="Főmenü"></div>');
    wrap.appendChild(panel);
    var cur = -1, tOpen = 0, tClose = 0;
    function desktop() { return window.innerWidth >= MIN_W; }
    function sync() { wrap.classList.toggle('mm-on', desktop()); if (!desktop()) close(); }
    function open(i) {
      clearTimeout(tClose);
      if (cur !== i) { panel.innerHTML = panelHtml(P[i]); cur = i; }
      items.forEach(function (li, k) { li.classList.toggle('mm-act', k === i); li.classList.remove('open'); var b = li.querySelector('.navlink'); if (b) b.setAttribute('aria-expanded', k === i ? 'true' : 'false'); });
      panel.classList.add('open');
    }
    function close() {
      clearTimeout(tOpen); panel.classList.remove('open'); cur = cur;
      items.forEach(function (li) { li.classList.remove('mm-act'); var b = li.querySelector('.navlink'); if (b) b.setAttribute('aria-expanded', 'false'); });
    }
    function closeSoon() { clearTimeout(tClose); tClose = setTimeout(close, 220); }
    items.forEach(function (li, i) {
      var btn = li.querySelector('.navlink'); if (!btn) return;
      btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
      li.addEventListener('mouseenter', function () { if (!desktop()) return; clearTimeout(tOpen); clearTimeout(tClose); tOpen = setTimeout(function () { open(i); }, panel.classList.contains('open') ? 60 : 140); });
      li.addEventListener('mouseleave', function () { if (!desktop()) return; clearTimeout(tOpen); closeSoon(); });
      btn.addEventListener('click', function (e) { if (!desktop()) return; e.preventDefault(); e.stopImmediatePropagation(); if (panel.classList.contains('open') && cur === i) close(); else open(i); }, true);
      btn.addEventListener('keydown', function (e) { if (!desktop()) return; if (e.key === 'ArrowDown') { e.preventDefault(); open(i); var a = panel.querySelector('a'); if (a) a.focus(); } });
    });
    panel.addEventListener('mouseenter', function () { clearTimeout(tClose); });
    panel.addEventListener('mouseleave', closeSoon);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) { var b = items[cur] && items[cur].querySelector('.navlink'); close(); if (b) b.focus(); } });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    panel.addEventListener('focusout', function (e) { if (!panel.contains(e.relatedTarget) && !wrap.querySelector('.menu').contains(e.relatedTarget)) close(); });
    window.addEventListener('resize', sync); sync();
    // a képek előtöltése az első rámutatáskor, hogy a panel azonnal teljes legyen
    wrap.querySelector('.menu').addEventListener('mouseenter', function () { P.forEach(function (p) { var im = new Image(); im.src = p.f.img; }); }, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
