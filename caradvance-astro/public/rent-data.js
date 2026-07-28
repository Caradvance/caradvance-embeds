// Shared data + helpers for the rental (bérelhető) pages.
// Rental cars = the active for-sale cars from the caradvance-autok sheet whose model
// matches a GREEN-marked model in the CarAdvance GmbH price list. Each gets a monthly
// rental price (2000 km/month tier) and a Kaution (deposit), both net EUR.
window.RENT = (function () {
  var RATE = 362; // EUR->HUF fallback; updated live from frankfurter
  var SHEET_CSV = 'https://docs.google.com/spreadsheets/d/1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y/gviz/tq?tqx=out:csv';

  function slugify(m){return String(m||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  var MAIN_PICK = {"bmw-x7-m50d-m-sport-pro-22-b-w": "fe568239", "bmw-x2-xdrive20d-m-sport-pro-20-h-k": "0ec9c853", "bmw-x6-m60i-xdrive-full-option-carbon-m-sitze": "b71ffd45", "bmw-i5-m60-xdrive-i5m60-xdrive": "c2e8e425", "bmw-x5-xdrive30d": "905fe271", "bmw-x6-xdrive30d-m-sport-pro": "c6b0483d", "bmw-x5-xdrive30d-m-sport-pro-luft-22": "7cc9ba26", "porsche-911-carrera-4-gts-approved-3-jahre-voll-leder": "44ce52eb", "bmw-m4-comp-cabrio-20-carbon-driv-assist-prof-h-k": "2182e56e", "bmw-x7-xdrive40d-m-sport-pro-23-luft-h-k": "64574841", "bmw-x5-xdrive40d-m-sport-pro-full-option": "a3dc7592", "bmw-x6-xdrive30d-m-sport-pro-individual-22": "921b1d29", "bmw-x6-xdrive30d-m-sport-pro-luft-22": "a05d3035", "bmw-x5-xdrive30d-m-sport-pro-22-luft": "db6ae02a", "bmw-x5-xdrive30d-m-sport-pro-22": "c32a177b", "bmw-x5-m-competition-21-22": "4783b10e", "porsche-911-carrera-gts-approved-3-jahre-voll-leder": "7544b234", "bmw-x6-xdrive30d-m-sport-pro-22-individual": "87861b10", "bmw-x7-xdrive40d-m-sport-pro-22": "2ad119b8", "porsche-panamera-gts-standheizung-allradlenkung-ptv-pano": "c25bffa2", "bmw-x7-40d-british-racing-green-brown-b-w-full": "252375f1"};
  var MAIN_INJECT={"ferrari-328-gts-zahnriemen-service-neu-historie":"9a7fad94-3c9f-4d64-81f2-3dd9d9109786","lamborghini-urus-s-nero-matt-black-23-b-o-garan":"09bbdebc-1b4b-4f83-8d5c-ecdc13cb7cbc","bmw-x6-xdrive30d-porsche-blue-bower-wilkins-full":"22d3d91c-05ac-4081-9a7b-6bbedfdb5874","bmw-x6-xdrive40d-sepang-bronze-1of-b-w-full-full":"26cd4eee-d836-4fcc-be25-b8728f9cb40b","bmw-i5-m60-xdrive-i5m60-xdrive":"267aa3a4-1289-4b4a-a108-e016c222cfcf","audi-s5-avant-pano-20-bang-olufsen-ahk-matrix":"307b0180-83e0-4cd7-b23d-e8bf5ada40e4","porsche-911-carrera-gts-approved-3-jahre-voll-leder":"7544b234-738e-482f-842a-32ba0b12a195","porsche-992-targa-4s-480hp-no-hybrid-pacha-uvp-220k":"21517196-1dbe-4130-873d-60971294348b","porsche-taycan-cross-turismo-4-pano-21-hud-bose-hud":"dc34f994-de88-4643-97c2-a84d4af82a6e","audi-rs-3-limousine-individual-schalensitz-pano-sport":"d67e4019-6fc5-4b64-94b2-b1bd63a85106","porsche-992-2-gt3-6-gang-clubsport-schalensitz-lift-voll":"d8d599a5-1c4d-4a27-a776-abe79f328946","porsche-panamera-gts-standheizung-allradlenkung-ptv-pano":"c25bffa2-9097-4bc2-8296-f47fa38dab19","porsche-cayenne-3-0-coupe-black-edition-2026-prod-full":"e425e500-550f-4cc7-b946-6312e5377b63","bmw-x6-xdrive30d-22-massage-clarity-stnd-heiz-full":"fffc8da2-3c37-48ea-bcce-b671162f1ad5","mercedes-benz-g-63-amg-made-to-measure-mint-white-23-brabus-tv":"e9ed8ff7-b04b-4f5d-8221-22ac2ddaffab"};
  function injectUrl(id){return "https://img.classistatic.de/api/v1/mo-prod/images/"+id.slice(0,2)+"/"+id+"?rule=mo-1600";}
  function sideImg(modell, kep, galeria){
    var slug=slugify(modell);
    if(MAIN_INJECT[slug]) return injectUrl(MAIN_INJECT[slug]);
    var list=String(galeria||'').split(',').map(function(x){return x.trim();}).filter(Boolean);
    var all=[], main=(kep||'').trim()||list[0]||'';
    if(main) all.push(main);
    for(var i=0;i<list.length;i++){ if(list[i] && all.indexOf(list[i])<0) all.push(list[i]); }
    var pick=MAIN_PICK[slug];
    if(pick){ var idx=-1; for(var j=0;j<all.length;j++){ if(all[j].indexOf(pick)>=0){idx=j;break;} } if(idx>0){ all.unshift(all.splice(idx,1)[0]); } }
    else if(all.length>1 && /classistatic|mo-prod/.test(all[0])){ all.unshift(all.splice(1,1)[0]); }
    return all[0]||'';
  }
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
        // only CarAdvance's own fleet is rentable — exclude WeGa/partner cars
        var _forras=(g(row,'forras')||'').toLowerCase(), _sajat=(g(row,'sajat')||'').toLowerCase();
        if(_forras && _forras!=='caradvance' && _sajat!=='igen') continue;
        out.push({
          modell:modell, marka:g(row,'marka'), karosszeria:g(row,'karosszeria'),
          km:g(row,'km'), teljesitmeny:g(row,'teljesitmeny'), valto:g(row,'valto'),
          uzemanyag:g(row,'uzemanyag'), evjarat:g(row,'evjarat'), hajtas:g(row,'hajtas'),
          img:sideImg(modell,g(row,'kep_url'),g(row,'galeria')), hozzaadva:g(row,'hozzaadva'), kiemelt:(g(row,'kiemelt')||'').toLowerCase()==='igen',
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
