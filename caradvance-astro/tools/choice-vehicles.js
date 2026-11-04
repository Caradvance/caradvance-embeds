/* CarAdvance – Choice fleetshop: every single car per version (Marc, 2026-11-04)
 *
 * Why: /v1/mobilityOffer/grouped returns ONE sample car per offer group (with VehiclesCount). Colours, terms and prices of the
 * other cars are missing (e.g. BMW X3 40d xDrive: 21 cars in 4 colours and 5 / 6 months, but only 1 sample in the list).
 * The fleetshop's own detail page loads them from /v1/mobilityOffers?CarDescription=…&CarLabel=…&CarModel=…
 *
 * How (runs in the fleetshop tab, after the grouped list was captured; no tokens are read or stored):
 * when the page itself sends its next "grouped" request (we trigger it by changing the sort order), that request is redirected
 * to the mobilityOffers URL of one version; the page still receives the last real grouped answer, so its UI does not change.
 * One version per sort toggle (~1 s). Run CADV_VEH.step() repeatedly (each call ≤ ~30 s) until done === total.
 *
 *   paste this file once, then:  await CADV_VEH.init(items)   // items = Items of the captured grouped list
 *                                 await CADV_VEH.step()        // repeat until {left:0}
 *   result: window.__VEH = { 'CarLabel|CarModell|CarModellspec': [[colour, months, km, price, count], …] }
 *   pass it to the builder: CADV_SYNC({…, vehicles: window.__VEH})
 * Consistency: the builder only uses a version if its car count equals the grouped VehiclesCount sum.
 */
var CADV_VEH = (function () {
  var API = 'https://api.prod.nrp.kms.berlin/v1/mobilityOffers';
  function leaf(t) { return [].filter.call(document.querySelectorAll('body *'), function (e) { return e.children.length === 0 && e.textContent.trim() === t; }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function hook() {
    if (window.__vehHooked) return; window.__vehHooked = true;
    var P = XMLHttpRequest.prototype, oo = P.open, os = P.send, RT = Object.getOwnPropertyDescriptor(P, 'responseText').get;
    P.open = function (m, u) {
      var a = [].slice.call(arguments); this.__vrw = false;
      if (window.__vehRW && /mobilityOffer\/grouped/.test(String(u))) {
        a[0] = 'GET'; a[1] = window.__vehRW; window.__vehRW = null; this.__vrw = true;
        var good = function () { return window.__vehGOOD || '{"Items":[]}'; };
        Object.defineProperty(this, 'responseText', { configurable: true, get: good });
        Object.defineProperty(this, 'response', { configurable: true, get: good });
      }
      this.__vu = String(a[1]); return oo.apply(this, a);
    };
    P.send = function () {
      var x = this;
      x.addEventListener('readystatechange', function () {
        if (x.readyState !== 4) return; var t = RT.call(x);
        if (/mobilityOffer\/grouped/.test(x.__vu) && !x.__vrw) window.__vehGOOD = t;
        if (x.__vrw) window.__vehRES = t;
      });
      return os.apply(this, arguments);
    };
  }
  async function toggle() {
    var cur = leaf('Verfügbarkeit aufsteigend')[0], target = 'Preis aufsteigend';
    if (!cur) { cur = leaf('Preis aufsteigend')[0]; target = 'Verfügbarkeit aufsteigend'; }
    if (!cur) return false; cur.click(); await sleep(600); var o = leaf(target).slice(-1)[0]; if (o) o.click(); return true;
  }
  async function fetchOne(k) {
    var p = k.split('|');
    var url = API + '?CarDescription=' + encodeURIComponent(p[2]) + '&CarLabel=' + encodeURIComponent(p[0]) + '&CarModel=' + encodeURIComponent(p[1]) +
      '&Station=&AvailableFrom=&DeliveryBeginLocation=&DeliveryEndLocation=&ROType=&ShopSubdomain=&Language=de-de';
    window.__vehRES = null; window.__vehRW = url;
    if (!(await toggle())) { window.__vehRW = null; return 'NOSORT'; }
    for (var i = 0; i < 60 && window.__vehRES == null; i++) await sleep(150);
    window.__vehRW = null; return window.__vehRES;
  }
  return {
    init: async function (items) {
      hook(); window.__VEH = window.__VEH || {};
      var ks = {}; (items || []).forEach(function (it) { var ro = it.RentalObject || {}; ks[[ro.CarLabel, ro.CarModell, ro.CarModellspec].join('|')] = 1; });
      window.__vehKeys = Object.keys(ks);
      if (!window.__vehGOOD) { await toggle(); for (var i = 0; i < 60 && !window.__vehGOOD; i++) await sleep(200); }
      return { total: window.__vehKeys.length, haveGrouped: !!window.__vehGOOD };
    },
    step: async function () {
      var t0 = Date.now(), done = 0, fail = [];
      for (var i = 0; i < window.__vehKeys.length; i++) {
        var k = window.__vehKeys[i]; if (window.__VEH[k]) continue; if (Date.now() - t0 > 28000) break;
        var t = await fetchOne(k); if (t === 'NOSORT') { fail.push('NOSORT (reload the page and run init again)'); break; }
        try {
          var agg = {}; JSON.parse(t).Items.forEach(function (v) { var kk = [v.Color, v.SubscriptionPeriodMonths, v.KMPackage, v.Price].join('|'); agg[kk] = (agg[kk] || 0) + 1; });
          window.__VEH[k] = Object.keys(agg).map(function (kk) { var q = kk.split('|'); return [q[0], +q[1], +q[2], +q[3], agg[kk]]; }); done++;
        } catch (e) { fail.push(k); }
        await sleep(150);
      }
      var have = Object.keys(window.__VEH).length;
      return { done: done, have: have, total: window.__vehKeys.length, left: window.__vehKeys.length - have, fail: fail.slice(0, 5) };
    }
  };
})();
