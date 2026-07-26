// Injects a compact "supported cause" (seller 15% + buyer 15%) widget into the
// right-hand column of a /auto/<slug>/ car page, IF the car is in the bizományos list.
(function () {
  var m = location.pathname.match(/\/auto\/([^\/]+)\/?$/);
  if (!m) return;
  var slug = m[1];

  function start() {
    var B = window.BIZ; if (!B) return;
    B.loadRate(function () {
      B.loadCars(function (cars) {
        var car = null;
        for (var i = 0; i < cars.length; i++) { if (B.slugify(cars[i].modell) === slug) { car = cars[i]; break; } }
        if (!car) return; // not a consignment example car
        build(B, car);
      });
    });
  }

  function css() {
    if (document.getElementById('bw-css')) return;
    var s = document.createElement('style'); s.id = 'bw-css';
    s.textContent = '.bw-panel .bw-h{font-size:16px;font-weight:800;color:#0B0B0D;margin:0 0 4px}.bw-panel .bw-sub{font-size:12.5px;color:#5A6B82;margin:0 0 14px;line-height:1.5}.bw-sec{border-top:1px solid #E6EAF1;padding-top:13px;margin-top:13px}.bw-sec.first{border-top:0;padding-top:0;margin-top:0}.bw-tag{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:999px;margin-bottom:9px}.bw-tag.seller{background:rgba(226,0,26,.1);color:#E2001A}.bw-tag.buyer{background:rgba(30,60,114,.1);color:#1e3c72}.bw-org{display:flex;align-items:center;gap:9px;margin-bottom:2px}.bw-lg{width:38px;height:32px;flex:0 0 auto;border-radius:7px;background:#fff;border:1px solid #E6EAF1;display:flex;align-items:center;justify-content:center;overflow:hidden}.bw-lg.blue{background:#009DE0;border-color:#009DE0}.bw-lg img{max-width:30px;max-height:24px;object-fit:contain}.bw-nm{font-size:13.5px;font-weight:800;color:#0B0B0D;line-height:1.2}.bw-proj{font-size:12.5px;color:#3D4756;font-weight:600;margin:8px 0}.bw-track{position:relative;height:12px;border-radius:999px;background:#EDEFF3;overflow:hidden;margin:6px 0}.bw-fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#1DA851,#17b95a);border-radius:999px;transition:width .4s}.bw-add{position:absolute;top:0;bottom:0;transition:left .4s,width .4s}.bw-add.red{background:repeating-linear-gradient(45deg,#E2001A,#E2001A 6px,#ff3355 6px,#ff3355 12px)}.bw-add.blue{background:repeating-linear-gradient(45deg,#1e3c72,#1e3c72 6px,#3b62b5 6px,#3b62b5 12px)}.bw-nums{display:flex;justify-content:space-between;font-size:12px;margin-top:2px}.bw-nums b{color:#0B0B0D;font-weight:800}.bw-nums span{color:#5A6B82}.bw-contrib{margin-top:8px;font-size:12.5px;font-weight:700;background:#F4F7FB;border-radius:9px;padding:8px 10px;line-height:1.4}.bw-contrib.red{color:#E2001A}.bw-contrib.blue{color:#1e3c72}.bw-select{width:100%;padding:9px 10px;border:1px solid #E6EAF1;border-radius:9px;font:inherit;font-size:13px;margin-bottom:2px;background:#fff;color:#141519}.bw-link{display:inline-block;margin-top:9px;font-size:12.5px;font-weight:700;text-decoration:none}';
    document.head.appendChild(s);
  }

  function bar(B, p, addFt, color) {
    var base = Math.min(100, p.raised / p.goal * 100);
    var add = Math.min(100 - base, addFt / p.goal * 100);
    return '<div class="bw-track"><div class="bw-fill" style="width:' + base.toFixed(2) + '%"></div>'
      + '<div class="bw-add ' + color + '" style="left:' + base.toFixed(2) + '%;width:' + add.toFixed(2) + '%"></div></div>';
  }

  function build(B, car) {
    var side = document.querySelector('aside.side') || document.querySelector('.side');
    if (!side) return;
    css();
    var sp = B.PROJECTS[car.seller] || B.PROJECTS.sos;
    var sideFt = B.ftOf(B.sideEur(car.eur));
    function fmt(v) { return B.fmtFt(v); }
    var opts = B.ORDER.map(function (k) { return '<option value="' + k + '">' + B.PROJECTS[k].name + '</option>'; }).join('');
    var el = document.createElement('div'); el.className = 'panel bw-panel';
    el.innerHTML =
      '<div class="bw-h">Egy autó, két jó ügy ♥</div>'
      + '<div class="bw-sub">A jutalékunk 30%-a jótékony célra megy — 15% az eladó, 15% a vevő döntése.</div>'
      + '<div class="bw-sec first"><div class="bw-tag seller">Eladó · 15%</div>'
        + '<div class="bw-org"><span class="bw-lg' + (sp.blue ? ' blue' : '') + '"><img src="' + sp.logo + '" alt=""></span><span class="bw-nm">' + sp.name + '</span></div>'
        + '<div class="bw-proj">' + sp.project + '</div>'
        + bar(B, sp, sideFt, 'red')
        + '<div class="bw-nums"><b>' + fmt(sp.raised) + '</b><span>cél: ' + fmt(sp.goal) + '</span></div>'
        + '<div class="bw-contrib red">Ez az eladás <b>+' + fmt(sideFt) + '</b>-tal járult hozzá.</div></div>'
      + '<div class="bw-sec"><div class="bw-tag buyer">A vevő döntése · 15%</div>'
        + '<select class="bw-select" id="bwsel">' + opts + '</select>'
        + '<div id="bwbuyer"></div></div>';
    side.appendChild(el);

    var sel = el.querySelector('#bwsel'), view = el.querySelector('#bwbuyer');
    function showBuyer(k) {
      var p = B.PROJECTS[k];
      var np = Math.round(Math.min(100, (p.raised + sideFt) / p.goal * 100));
      view.innerHTML = '<div class="bw-org" style="margin-top:6px"><span class="bw-lg' + (p.blue ? ' blue' : '') + '"><img src="' + p.logo + '" alt=""></span><span class="bw-nm">' + p.name + '</span></div>'
        + '<div class="bw-proj">' + p.project + '</div>'
        + bar(B, p, sideFt, 'blue')
        + '<div class="bw-nums"><b>' + fmt(p.raised) + '</b><span>cél: ' + fmt(p.goal) + '</span></div>'
        + '<div class="bw-contrib blue">A te 15%-od <b>+' + fmt(sideFt) + '</b> — a cél <b>' + np + '%</b>-ra nőne.</div>'
        + '<a class="bw-link" href="' + p.url + '" target="_blank" rel="noopener" style="color:#1e3c72">A szervezet oldala →</a>';
    }
    sel.addEventListener('change', function () { showBuyer(sel.value); });
    var def = B.ORDER.filter(function (k) { return k !== car.seller; })[0] || B.ORDER[0];
    sel.value = def; showBuyer(def);
  }

  if (window.BIZ) start();
  else { var s = document.createElement('script'); s.src = '/biz-data.js'; s.onload = start; s.onerror = function () {}; document.head.appendChild(s); }
})();
