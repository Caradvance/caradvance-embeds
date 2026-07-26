// Shared data + helpers for the consignment (bizományos) pages.
window.BIZ = (function () {
  var RATE = 362; // EUR->HUF fallback; updated live from frankfurter
  var PROJECTS = {
    sos:          { key:'sos',          name:'SOS Gyermekfalu Magyarország',        cat:'Gyerekek & családok',      logo:'https://www.caradvance.hu/sos-badge.png', blue:true, project:'Egy gyermekház téli felújítása',            raised:640000,  goal:2500000, url:'https://www.sos.hu' },
    elelmiszerbank:{ key:'elelmiszerbank',name:'Magyar Élelmiszerbank Egyesület',    cat:'Élelmiszer & rászorulók',  logo:'https://caradvance.hu/magyar-elelmiszerbank-egyesulet.webp', project:'50 000 adag étel a téli hónapokra',   raised:980000,  goal:1500000, url:'https://www.elelmiszerbank.hu' },
    bator:        { key:'bator',        name:'Bátor Tábor Alapítvány',              cat:'Beteg gyerekek',           logo:'https://caradvance.hu/bator-tabor.webp', project:'5 gyermek nyári tábori részvétele',            raised:1120000, goal:1750000, url:'https://www.batortabor.hu' },
    maltai:       { key:'maltai',       name:'Magyar Máltai Szeretetszolgálat',     cat:'Humanitárius',             logo:'https://caradvance.hu/magyar-maltai-szeretetszolgalat.webp', project:'Téli krízisellátás hajléktalan embereknek', raised:720000, goal:2000000, url:'https://www.maltai.hu' },
    rex:          { key:'rex',          name:'Rex Kutyaotthon Alapítvány',          cat:'Állatvédelem',             logo:'https://caradvance.hu/rex-kutyaotthon-alapitvany.webp', project:'Kennelek felújítása és téli felkészítés',   raised:430000,  goal:1200000, url:'https://www.rexalapitvany.hu' },
    heimpal:      { key:'heimpal',      name:'Heim Pál Gyermekgyógyászati Intézet', cat:'Gyermekgyógyászat',        logo:'https://caradvance.hu/heim-pal-orszagos-gyermekgyogyaszati-intezet.webp', project:'Új gyermekgyógyászati műszer beszerzése', raised:1340000, goal:3000000, url:'https://heimpalkorhaz.hu' },
    patent:       { key:'patent',       name:'PATENT Egyesület',                    cat:'Jogvédelem',               logo:'https://caradvance.hu/patent-egyesulet.webp', project:'Ingyenes jogsegély-szolgálat egy évig',      raised:560000,  goal:1500000, url:'https://patent.org.hu' }
  };
  var ORDER = ['sos','elelmiszerbank','bator','maltai','rex','heimpal','patent'];

  // fallback cars (used if the "bizomanyos" sheet tab is empty/unavailable)
  var CARS = [
    { modell:'BMW 330e M Sport',                marka:'BMW',           karosszeria:'Limuzin', km:'62 000 km',  teljesitmeny:'292 LE', valto:'Automata', uzemanyag:'Plug-in hibrid', evjarat:'03/2021', hajtas:'Hátsókerékhajtás',      eur:32000, seller:'sos',           img:'https://loremflickr.com/900/600/bmw,car/all?lock=31' },
    { modell:'Audi Q5 40 TDI quattro',          marka:'Audi',          karosszeria:'SUV',     km:'78 000 km',  teljesitmeny:'204 LE', valto:'Automata', uzemanyag:'Dízel',          evjarat:'06/2020', hajtas:'Összkerékhajtás',      eur:34000, seller:'elelmiszerbank', img:'https://loremflickr.com/900/600/audi,suv/all?lock=32' },
    { modell:'Mercedes-Benz C 220 d',           marka:'Mercedes-Benz', karosszeria:'Kombi',   km:'95 000 km',  teljesitmeny:'194 LE', valto:'Automata', uzemanyag:'Dízel',          evjarat:'01/2020', hajtas:'Hátsókerékhajtás',      eur:28000, seller:'bator',         img:'https://loremflickr.com/900/600/mercedes,car/all?lock=33' },
    { modell:'Volkswagen Passat 2.0 TDI Elegance', marka:'Volkswagen', karosszeria:'Kombi',   km:'110 000 km', teljesitmeny:'190 LE', valto:'Automata', uzemanyag:'Dízel',          evjarat:'09/2019', hajtas:'Elsőkerékhajtás',       eur:24000, seller:'maltai',        img:'https://loremflickr.com/900/600/volkswagen,car/all?lock=34' },
    { modell:'BMW X3 xDrive20d',                marka:'BMW',           karosszeria:'SUV',     km:'84 000 km',  teljesitmeny:'190 LE', valto:'Automata', uzemanyag:'Dízel',          evjarat:'05/2020', hajtas:'Összkerékhajtás',      eur:39000, seller:'rex',           img:'https://loremflickr.com/900/600/bmw,suv/all?lock=35' },
    { modell:'Volvo XC60 B4',                   marka:'Volvo',         karosszeria:'SUV',     km:'67 000 km',  teljesitmeny:'197 LE', valto:'Automata', uzemanyag:'Dízel',          evjarat:'11/2021', hajtas:'Összkerékhajtás',      eur:42000, seller:'heimpal',       img:'https://loremflickr.com/900/600/volvo,car/all?lock=36' },
    { modell:'Škoda Superb 2.0 TDI L&K',        marka:'Škoda',         karosszeria:'Kombi',   km:'120 000 km', teljesitmeny:'190 LE', valto:'Automata', uzemanyag:'Dízel',          evjarat:'02/2019', hajtas:'Összkerékhajtás',      eur:22000, seller:'patent',        img:'https://loremflickr.com/900/600/skoda,car/all?lock=37' },
    { modell:'Audi A6 45 TFSI',                 marka:'Audi',          karosszeria:'Limuzin', km:'58 000 km',  teljesitmeny:'245 LE', valto:'Automata', uzemanyag:'Benzin',         evjarat:'07/2021', hajtas:'Összkerékhajtás',      eur:44000, seller:'sos',           img:'https://loremflickr.com/900/600/audi,car/all?lock=38' },
    { modell:'BMW 520d Touring',                marka:'BMW',           karosszeria:'Kombi',   km:'99 000 km',  teljesitmeny:'190 LE', valto:'Automata', uzemanyag:'Dízel',          evjarat:'04/2020', hajtas:'Hátsókerékhajtás',      eur:30000, seller:'elelmiszerbank', img:'https://loremflickr.com/900/600/bmw,estate/all?lock=39' },
    { modell:'Tesla Model 3 Long Range',        marka:'Tesla',         karosszeria:'Limuzin', km:'71 000 km',  teljesitmeny:'440 LE', valto:'Automata', uzemanyag:'Elektromos',     evjarat:'10/2021', hajtas:'Összkerékhajtás',      eur:36000, seller:'bator',         img:'https://loremflickr.com/900/600/tesla,car/all?lock=40' }
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
