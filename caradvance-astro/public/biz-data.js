// Shared data + helpers for the consignment (bizományos) pages.
window.BIZ = (function () {
  var RATE = 362; // EUR->HUF fallback; updated live from frankfurter
  var PROJECTS = {
    sos:          { key:'sos',          name:'SOS Gyermekfalu Magyarország',        cat:'Gyerekek & családok',      logo:'/sos-badge.png', blue:true, project:'Egy gyermekház téli felújítása',            raised:640000,  goal:2500000, url:'https://www.sos.hu' },
    elelmiszerbank:{ key:'elelmiszerbank',name:'Magyar Élelmiszerbank Egyesület',    cat:'Élelmiszer & rászorulók',  logo:'/magyar-elelmiszerbank-egyesulet.webp', project:'50 000 adag étel a téli hónapokra',   raised:980000,  goal:1500000, url:'https://www.elelmiszerbank.hu' },
    bator:        { key:'bator',        name:'Bátor Tábor Alapítvány',              cat:'Beteg gyerekek',           logo:'/bator-tabor.webp', project:'5 gyermek nyári tábori részvétele',            raised:1120000, goal:1750000, url:'https://www.batortabor.hu' },
    maltai:       { key:'maltai',       name:'Magyar Máltai Szeretetszolgálat',     cat:'Humanitárius',             logo:'/magyar-maltai-szeretetszolgalat.webp', project:'Téli krízisellátás hajléktalan embereknek', raised:720000, goal:2000000, url:'https://www.maltai.hu' },
    rex:          { key:'rex',          name:'Rex Kutyaotthon Alapítvány',          cat:'Állatvédelem',             logo:'/rex-kutyaotthon-alapitvany.webp', project:'Kennelek felújítása és téli felkészítés',   raised:430000,  goal:1200000, url:'https://www.rexalapitvany.hu' },
    heimpal:      { key:'heimpal',      name:'Heim Pál Gyermekgyógyászati Intézet', cat:'Gyermekgyógyászat',        logo:'/heim-pal-orszagos-gyermekgyogyaszati-intezet.webp', project:'Új gyermekgyógyászati műszer beszerzése', raised:1340000, goal:3000000, url:'https://heimpalkorhaz.hu' },
    patent:       { key:'patent',       name:'PATENT Egyesület',                    cat:'Jogvédelem',               logo:'/patent-egyesulet.webp', project:'Ingyenes jogsegély-szolgálat egy évig',      raised:560000,  goal:1500000, url:'https://patent.org.hu' }
  };
  var ORDER = ['sos','elelmiszerbank','bator','maltai','rex','heimpal','patent'];

  // fallback cars (used if the "bizomanyos" sheet tab is empty/unavailable)
  var CARS = [
    { modell:'BMW X5 xDrive30d M Sport Pro Panoráma 22 M LM Head-Up ÁFÁS', marka:'BMW', karosszeria:'Városi terepjáró (SUV)', km:'15 800 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Dízel', evjarat:'05/2025', hajtas:'', eur:70035, seller:'sos', img:'https://img.hasznaltautocdn.com/2048x1536/23351824/29222239.jpg' },
    { modell:'BMW X2 xDrive20d M Sport Pro "20" H&K', marka:'BMW', karosszeria:'SUV', km:'17.900 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Dízel', evjarat:'11/2025', hajtas:'', eur:43277, seller:'elelmiszerbank', img:'https://img.classistatic.de/api/v1/mo-prod/images/0e/0ec9c853-8245-4d9f-8cbd-b8220e7db89e?rule=mo-1600' },
    { modell:'Porsche 911 Carrera GTS APPROVED*3*JAHRE/ VOLL LEDER', marka:'Porsche', karosszeria:'Sportautó', km:'19.000 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Benzin', evjarat:'12/2023', hajtas:'', eur:136134, seller:'bator', img:'https://img.classistatic.de/api/v1/mo-prod/images/75/7544b234-738e-482f-842a-32ba0b12a195?rule=mo-1600' },
    { modell:'Volkswagen Golf GTI Clubsport S /ABT 370PS/19"/1of400', marka:'Volkswagen', karosszeria:'Kompakt', km:'56.800 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Benzin', evjarat:'01/2017', hajtas:'', eur:29327, seller:'maltai', img:'https://img.classistatic.de/api/v1/mo-prod/images/c9/c9522e7b-5ef0-4773-b188-6e724f236e2f?rule=mo-1600' },
    { modell:'BMW X2 xDrive20d/M-Pro/Black-Beige/Pano/HUD/Full', marka:'BMW', karosszeria:'SUV', km:'17.900 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Dízel', evjarat:'01/2026', hajtas:'', eur:45294, seller:'rex', img:'https://img.classistatic.de/api/v1/mo-prod/images/9c/9c7aec49-8f2c-4af9-b4d1-8313f93ebfb4?rule=mo-1600' },
    { modell:'BMW X7 M50d M Sport Pro "22" B&W', marka:'BMW', karosszeria:'SUV', km:'139.923 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Dízel', evjarat:'07/2019', hajtas:'', eur:50411, seller:'heimpal', img:'https://img.classistatic.de/api/v1/mo-prod/images/fe/fe568239-3d44-4bab-a0c2-beae573c0e0e?rule=mo-1600' },
    { modell:'Audi RS 3 Limousine/Individual/Schalensitz/Pano/Sport', marka:'Audi', karosszeria:'Limuzin', km:'17.450 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Benzin', evjarat:'08/2025', hajtas:'', eur:51672, seller:'patent', img:'https://img.classistatic.de/api/v1/mo-prod/images/d6/d67e4019-6fc5-4b64-94b2-b1bd63a85106?rule=mo-1600' },
    { modell:'Audi S5 Avant/Pano/20\'/Bang&Olufsen/AHK/Matrix', marka:'Audi', karosszeria:'Kombi', km:'19.800 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Benzin', evjarat:'12/2025', hajtas:'', eur:52092, seller:'sos', img:'https://img.classistatic.de/api/v1/mo-prod/images/30/307b0180-83e0-4cd7-b23d-e8bf5ada40e4?rule=mo-1600' },
    { modell:'BMW i5 M60 xDrive i5M60 xDrive', marka:'BMW', karosszeria:'Limuzin', km:'33.500 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Elektromos', evjarat:'12/2023', hajtas:'', eur:58739, seller:'elelmiszerbank', img:'https://img.classistatic.de/api/v1/mo-prod/images/26/267aa3a4-1289-4b4a-a108-e016c222cfcf?rule=mo-1600' },
    { modell:'BMW X5 xDrive30d/Standheiz./H&K/AHK/Iconic/Soft-Clos', marka:'BMW', karosszeria:'SUV', km:'12.980 km', teljesitmeny:'', valto:'Automata', uzemanyag:'Dízel', evjarat:'11/2025', hajtas:'', eur:58815, seller:'bator', img:'https://img.classistatic.de/api/v1/mo-prod/images/b7/b736da3f-ee8b-4199-b0ba-308a39952e20?rule=mo-1600' }
  ];

  function slugify(m){return String(m||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function commPct(eur){ if(eur<=15000)return .05; if(eur<=35000)return .045; if(eur<=60000)return .04; if(eur<=100000)return .035; if(eur<=150000)return .03; if(eur<=200000)return .025; return .02; }
  function commissionEur(eur){ return eur*commPct(eur); }
  function totalDonationEur(eur){ return commissionEur(eur)*0.30; } // full 30%
  function sideEur(eur){ return commissionEur(eur)*0.15; }          // one 15% side
  function ftOf(eur){ return Math.round(eur*RATE); }
  function fmtFt(v){ return Math.round(v).toLocaleString('hu-HU')+' Ft'; }

  function setRate(r){ RATE=r; }
  function getRate(){ return RATE; }

  // build cars from a gviz CSV rows array (header + data); returns [] if unusable
  function fromRows(rows){
    if(!rows||!rows.length) return [];
    var head=rows[0].map(function(h){return String(h).trim().toLowerCase();});
    var idx={}; head.forEach(function(h,i){idx[h]=i;});
    // only accept a real 'bizomanyos' tab (has a seller column); otherwise gviz may
    // have returned the default 'autok' tab for a non-existent sheet name -> use fallback.
    if(idx['modell']==null || (idx['seller_ngo']==null && idx['seller']==null)) return [];
    var out=[];
    for(var r=1;r<rows.length;r++){var row=rows[r]; if(!row||!row.length)continue;
      var g=function(n){var j=idx[n];return j==null?'':String(row[j]||'').trim();};
      if(g('aktiv') && g('aktiv').toLowerCase()==='nem') continue;
      var modell=g('modell'); if(!modell) continue;
      var eur=parseFloat((g('vetel_eur')||g('eur')||'').replace(/[^\d.]/g,''))||0;
      out.push({modell:modell,marka:g('marka'),karosszeria:g('karosszeria'),km:g('km'),teljesitmeny:g('teljesitmeny'),valto:g('valto'),uzemanyag:g('uzemanyag'),evjarat:g('evjarat'),hajtas:g('hajtas'),eur:eur,seller:(g('seller_ngo')||g('seller')||'sos').toLowerCase(),img:g('kep_url')||''});
    }
    return out;
  }

  var SHEET_CSV='https://docs.google.com/spreadsheets/d/1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y/gviz/tq?tqx=out:csv&sheet=bizomanyos';
  function parseCSV(t){var rows=[],row=[],cur='',q=false,i=0,c;for(;i<t.length;i++){c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){cur+='"';i++;}else q=false;}else cur+=c;}else{if(c=='"')q=true;else if(c==','){row.push(cur);cur='';}else if(c=='\n'){row.push(cur);rows.push(row);row=[];cur='';}else if(c=='\r'){}else cur+=c;}}if(cur!==''||row.length){row.push(cur);rows.push(row);}return rows;}

  // load cars: try the sheet tab, else fallback; then run cb(cars)
  function loadCars(cb){
    fetch(SHEET_CSV,{cache:'no-store'}).then(function(r){return r.text();}).then(function(t){
      var rows=parseCSV(t); var cars=fromRows(rows);
      cb(cars.length?cars:CARS);
    }).catch(function(){ cb(CARS); });
  }
  function loadRate(cb){
    fetch('https://api.frankfurter.app/latest?from=EUR&to=HUF',{cache:'no-store'})
      .then(function(r){return r.json();}).then(function(d){if(d&&d.rates&&d.rates.HUF)setRate(d.rates.HUF); if(cb)cb();})
      .catch(function(){ if(cb)cb(); });
  }

  return { PROJECTS:PROJECTS, ORDER:ORDER, CARS:CARS, slugify:slugify, commissionEur:commissionEur, totalDonationEur:totalDonationEur, sideEur:sideEur, ftOf:ftOf, fmtFt:fmtFt, setRate:setRate, getRate:getRate, loadCars:loadCars, loadRate:loadRate };
})();
