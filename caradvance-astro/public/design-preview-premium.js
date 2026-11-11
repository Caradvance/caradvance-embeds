(function () {
  'use strict';
  const nav = document.getElementById('mainNav');
  const burger = document.getElementById('burger');
  const shade = document.getElementById('menuShade');
  const menus = Array.from(nav.querySelectorAll('details'));
  const desktop = window.matchMedia('(min-width:961px)');
  const hover = window.matchMedia('(hover:hover) and (pointer:fine)');
  let hoverTimer;
  function syncNavigation() {
    menus.forEach(menu => menu.querySelector('summary').setAttribute('aria-expanded', String(menu.open)));
    shade.hidden = !(menus.some(menu => menu.open) || nav.classList.contains('open'));
  }
  function closeMenus() { clearTimeout(hoverTimer); menus.forEach(menu => { menu.open = false; }); syncNavigation(); }
  function closeNavigation() { closeMenus(); nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); syncNavigation(); }
  function openMenu(menu) { clearTimeout(hoverTimer); menus.forEach(other => { other.open = other === menu; }); syncNavigation(); }
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    if (!open) closeNavigation();
    else { nav.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); syncNavigation(); }
  });
  menus.forEach((menu, index) => {
    const trigger = menu.querySelector('summary');
    menu.addEventListener('toggle', () => {
      if (menu.open) menus.forEach(other => { if (other !== menu) other.open = false; });
      syncNavigation();
    });
    menu.addEventListener('pointerenter', () => {
      if (!desktop.matches || !hover.matches) return;
      clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openMenu(menu), 160);
    });
    menu.addEventListener('pointerleave', () => {
      if (!desktop.matches || !hover.matches) return;
      clearTimeout(hoverTimer); hoverTimer = setTimeout(() => { if (!menu.contains(document.activeElement)) closeMenus(); }, 280);
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); openMenu(menu); menu.querySelector('.mm-group a').focus(); }
      if (desktop.matches && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); const next = menus[(index + (event.key === 'ArrowRight' ? 1 : menus.length - 1)) % menus.length];
        if (menu.open) openMenu(next); next.querySelector('summary').focus();
      }
    });
    menu.querySelector('[data-close-menu]').addEventListener('click', () => { closeMenus(); trigger.focus(); });
  });
  document.addEventListener('click', event => { if (!event.target.closest('.hdr')) closeNavigation(); });
  document.addEventListener('focusin', event => { if (!event.target.closest('.hdr')) closeMenus(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = menus.find(menu => menu.open);
    if (open) { closeMenus(); open.querySelector('summary').focus(); }
    else if (nav.classList.contains('open')) { closeNavigation(); burger.focus(); }
  });
  desktop.addEventListener('change', closeNavigation);
  syncNavigation();
  let mode = 'b2c';
  let model = 'X5';
  let cars = [];
  let loaded = false;
  const models = ['X5', 'X6', 'X3'];
  const price = document.getElementById('rentalPrice');
  const terms = document.getElementById('rentalTerms');
  const cta = document.getElementById('rentalCta');
  const image = document.getElementById('rentalImage');
  const money = value => value.toLocaleString('hu-HU', { maximumFractionDigits: 2 }) + ' €';
  const matching = () => cars.filter(car => new RegExp('\\b' + model + '\\b', 'i').test(car.modell));
  function renderOffer() {
    const matches = matching();
    const car = matches.length ? matches.reduce((a, b) => a.rent.price < b.rent.price ? a : b) : null;
    const gross = mode === 'b2c';
    const factor = gross ? 1.27 : 1;
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    document.querySelectorAll('[data-model]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.model === model)));
    document.getElementById('modeDescription').textContent = gross ? 'Magánszemélyként a bruttó bérleti díjakat mutatjuk.' : 'Céges ügyfélként a nettó bérleti díjakat mutatjuk; az áfa külön fizetendő.';
    document.getElementById('rentalName').textContent = 'BMW ' + model;
    document.getElementById('rentalIndex').textContent = '0' + (models.indexOf(model) + 1) + ' / 03';
    image.src = '/berles/bmw-' + model.toLowerCase() + '.webp';
    image.alt = 'BMW ' + model + ' – prémium autóbérlés';
    cta.href = '/autoink/#berelheto';
    cta.textContent = 'Bérelhető autóink ↗';
    if (car) {
      price.textContent = money(car.rent.price * factor) + ' / hó-tól · ' + (gross ? 'bruttó' : 'nettó');
      terms.textContent = '2000 km/hó · Kaució: ' + money(car.rent.kaution) + '. Tájékoztató díj; a pontos feltételeket egyedi ajánlat tartalmazza.';
      cta.href = '/auto/' + window.RENT.slugify(car.modell) + '/?rent=1&client=' + mode;
      cta.textContent = 'BMW ' + model + ' · részletek ↗';
    } else if (loaded) {
      price.textContent = 'BMW ' + model + ' · kérj személyre szabott ajánlatot';
      terms.textContent = 'Az aktuális elérhetőségről, havidíjról és kaucióról kollégáink adnak tájékoztatást.';
      cta.href = '/kapcsolat/?modell=' + encodeURIComponent('BMW ' + model) + '&client=' + mode;
      cta.textContent = 'Ajánlatot kérek ↗';
    }
  }
  document.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => { model = button.dataset.model; renderOffer(); }));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode; renderOffer();
    window.dispatchEvent(new CustomEvent('dp-rental-mode', { detail: mode }));
  }));
  window.addEventListener('dp-client-change', event => { mode = event.detail; renderOffer(); });
  renderOffer();
  const timeout = setTimeout(() => { loaded = true; renderOffer(); }, 10000);
  if (window.RENT) window.RENT.loadCars(result => {
    clearTimeout(timeout); cars = (result || []).filter(car => car.rent && car.rent.price > 0); loaded = true; renderOffer();
  });
  else { clearTimeout(timeout); loaded = true; renderOffer(); }
})();
