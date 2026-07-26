// Injects a "rental offer" panel into the right-hand column of a /auto/<slug>/ car
// page, IF the car is opened from the Bérelhető értékesítés flow (links carry ?rent=1)
// and the car's model is in the rental fleet.
(function () {
  if (location.search.indexOf('rent=1') < 0) return;
  var m = location.pathname.match(/\/auto\/([^\/]+)\/?$/);
  if (!m) return;
  var slug = m[1];

  function start() {
    var R = window.RENT; if (!R) return;
    R.loadRate(function () {
      R.loadCars(function (cars) {
        var car = null;
        for (var i = 0; i < cars.length; i++) { if (R.slugify(cars[i].modell) === slug) { car = cars[i]; break; } }
        if (!car) return; // not a rental car
        build(R, car);
      });
    });
  }

  function css() {
    if (document.getElementById('rw-css')) return;
    var s = document.createElement('style'); s.id = 'rw-css';
    s.textContent = '.rw-panel{border:1px solid #E6EAF1;border-radius:16px;padding:18px 18px 16px;background:linear-gradient(180deg,#F7F9FC,#fff)}.rw-panel .rw-tag{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:3px 10px;border-radius:999px;background:rgba(11,11,13,.06);color:#0B0B0D;margin-bottom:10px}.rw-panel .rw-h{font-size:13px;font-weight:700;color:#5A6B82;margin:0 0 2px}.rw-panel .rw-price{font-size:30px;font-weight:800;color:#0B0B0D;line-height:1.05}.rw-panel .rw-price span{font-size:15px;font-weight:700;color:#5A6B82}.rw-panel .rw-eur{font-size:13px;color:#5A6B82;font-weight:600;margin:4px 0 12px}.rw-panel .rw-kaucio{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #E6EAF1;border-radius:11px;padding:10px 12px;font-size:13px;font-weight:700;color:#5A6B82;margin-bottom:12px}.rw-panel .rw-kaucio b{color:#0B0B0D;font-weight:800;font-size:15px}.rw-panel .rw-kaucio span{color:#5A6B82;font-weight:600}.rw-panel .rw-cta{display:block;text-align:center;background:#E2001A;color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:13px 16px;border-radius:999px;transition:filter .15s}.rw-panel .rw-cta:hover{filter:brightness(.94)}.rw-panel .rw-note{font-size:11.5px;color:#5A6B82;line-height:1.5;margin-top:10px}';
    document.head.appendChild(s);
  }

  function build(R, car) {
    var side = document.querySelector('aside.side') || document.querySelector('.side');
    if (!side) return;
    css();
    var ft = R.ftOf(car.rent.price), kft = R.ftOf(car.rent.kaution);
    var subj = encodeURIComponent('Bérlési ajánlatkérés – ' + car.modell);
    var el = document.createElement('div'); el.className = 'panel rw-panel';
    el.innerHTML =
      '<span class="rw-tag">Bérlési ajánlat · ' + car.rent.cat + '</span>'
      + '<div class="rw-h">Havi bérleti díj (2000 km/hó, nettó)</div>'
      + '<div class="rw-price">' + R.fmtFt(ft) + '<span> /hó</span></div>'
      + '<div class="rw-eur">' + car.rent.price.toLocaleString('hu-HU') + ' € / hó</div>'
      + '<div class="rw-kaucio">Kaució <span>' + car.rent.kaution.toLocaleString('hu-HU') + ' €</span> <b>' + R.fmtFt(kft) + '</b></div>'
      + '<a class="rw-cta" href="mailto:info@caradvance.hu?subject=' + subj + '">Bérlési ajánlatkérés</a>'
      + '<div class="rw-note">A díj 2000 km/hó futásra vonatkozik, nettó ár. A kaució bérlésnél és bérlés-vételnél is fizetendő. Forint összegek élő árfolyammal, tájékoztató jelleggel.</div>';
    // insert as the FIRST panel — rental price on top of the sidebar
    if (side.firstElementChild) side.insertBefore(el, side.firstElementChild);
    else side.appendChild(el);
  }

  if (window.RENT) start();
  else { var s = document.createElement('script'); s.src = '/rent-data.js'; s.onload = start; s.onerror = function () {}; document.head.appendChild(s); }
})();
