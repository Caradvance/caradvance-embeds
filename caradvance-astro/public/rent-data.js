// Shared data + helpers for the rental (bérelhető) pages.
// Rental cars = the active for-sale cars from the caradvance-autok sheet whose model
// matches a GREEN-marked model in the CarAdvance GmbH price list. Each gets a monthly
// rental price (2000 km/month tier) and a Kaution (deposit), both net EUR.
window.RENT = (function () {
  var RATE = 362; // EUR->HUF fallback; updated live from frankfurter
  var SHEET_CSV = 'https://docs.google.com/spreadsheets/d/1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y/gviz/tq?tqx=out:csv';

  function slugify(m){return String(m||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function ftOf(eur){ return Math.round(eur*RATE); }
  function fmtFt(v){ return Math.round(v).toLocaleString('hu-HU')+' Ft'; }
  function setRate(r){ RATE=r; }
  function getRate(){ return RATE; }

  // Green price list (EUR net): monthly price at 2000 km/month + Kaution (deposit).
  // Returns {cat, price, kaution} for a rentable model, or null.
  function rentInfo(modell, marka, kar){
    var s=(modell||'').toLowerCase(), br=(marka||'').toLowerCase(); kar=(kar||'').toLowerCase();
    var isTour = /touring|kombi/.test(kar) || /touring/.test(s);
    if(br.indexOf('bmw')<0 && br.indexOf('mini')<0) return null;
    if(br.indexOf('mini')>=0){ if(/jcw|john cooper/.test(s)) return {cat:'Mini JCW',price:1198.4,kaution:3000}; return null; }
    // BMW
    if(/\bx7\b/.test(s)) return null;                                   // X7 not offered
    if(/\bx1\b|\bx2\b|\bx4\b/.test(s)) return null;                      // X1/X2/X4 not offered
    if(/\bx3\b/.test(s)) return {cat:'X3',price:1398.6,kaution:5000};
    if(/\bx5\b/.test(s)){ if(/x5\s*m\b/.test(s)||/x5\s*m\s*comp/.test(s)) return null; return {cat:'X5',price:1762.6,kaution:7500}; }
    if(/\bx6\b/.test(s)){ if(/x6\s*m\s*comp/.test(s)||/x6\s*m\b(?!\s*60|60)/.test(s)) return null; return {cat:'X6',price:1818.6,kaution:7500}; }
    if(/\bm5\b|i5\s*m60/.test(s)) return {cat:'M5',price:1998.75,kaution:10000};
    if(/\bm3\b/.test(s)) return isTour?{cat:'M3 Touring',price:1888.65,kaution:7500}:{cat:'M3 Lim',price:1888.65,kaution:7500};
    if(/\bm2\b/.test(s)) return {cat:'M2 Coupé',price:1402.2,kaution:5000};
    if(/\bm4\b/.test(s)) return null;                                   // M4 not green
    if(/\b5\s?er\b|\b5\d\d\b|\bi5\b/.test(s)) return isTour?{cat:'5er Touring',price:1598.4,kaution:7500}:{cat:'5er Limuzin',price:1598.4,kaution:7500};
    if(/\b3\s?er\b|\b3\d\d\b/.test(s)) return isTour?{cat:'3er Touring',price:1348.5,kaution:5000}:{cat:'3er Limuzin',price:1348.5,kaution:5000};
    if(/\b4\s?er\b|\b4\d\d\b/.test(s)){ if(/cabrio|convertible/.test(s)) return null; return {cat:'4er Coupé',price:1498.5,kaution:5000}; }
    return null;
  }

  function parseCSV(t){var rows=[],row=[],cur='',q=false,i=0,c;for(;i<t.length;i++){c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){cur+='"';i++;}else q=false;}else cur+=c;}else{if(c=='"')q=true;else if(c==','){row.push(cur);cur='';}else if(c=='\n'){row.push(cur);rows.push(row);row=[];cur='';}else if(c=='\r'){}else cur+=c;}}if(cur!==''||row.length){row.push(cur);rows.push(row);}return rows;}

  // load the sheet, keep only active + rentable cars, attach rent info; then cb(cars)
  function loadCars(cb){
    fetch(SHEET_CSV,{cache:'no-store'}).then(function(r){return r.text();}).then(function(t){
      var rows=parseCSV(t); if(!rows.length){ cb([]); return; }
      var head=rows[0].map(function(h){return String(h).trim().toLowerCase();});
      var ix={}; head.forEach(function(h,i){ix[h]=i;});
      function g(row,n){var j=ix[n];return j==null?'':String(row[j]||'').trim();}
      var out=[];
      for(var r=1;r<rows.length;r++){ var row=rows[r]; if(!row||!row.length)continue;
        var modell=g(row,'modell'); if(!modell)continue;
        if((g(row,'aktiv')||'').toLowerCase()==='nem')continue;
        var ri=rentInfo(modell, g(row,'marka'), g(row,'karosszeria'));
        if(!ri) continue;
        out.push({
          modell:modell, marka:g(row,'marka'), karosszeria:g(row,'karosszeria'),
          km:g(row,'km'), teljesitmeny:g(row,'teljesitmeny'), valto:g(row,'valto'),
          uzemanyag:g(row,'uzemanyag'), evjarat:g(row,'evjarat'), hajtas:g(row,'hajtas'),
          img:g(row,'kep_url'), kiemelt:(g(row,'kiemelt')||'').toLowerCase()==='igen',
          rent:ri
        });
      }
      cb(out);
    }).catch(function(){ cb([]); });
  }
  function loadRate(cb){
    fetch('https://api.frankfurter.app/latest?from=EUR&to=HUF',{cache:'no-store'})
      .then(function(r){return r.json();}).then(function(d){ if(d&&d.rates&&d.rates.HUF) setRate(d.rates.HUF); if(cb)cb(); })
      .catch(function(){ if(cb)cb(); });
  }

  return { slugify:slugify, ftOf:ftOf, fmtFt:fmtFt, setRate:setRate, getRate:getRate, rentInfo:rentInfo, loadCars:loadCars, loadRate:loadRate };
})();
