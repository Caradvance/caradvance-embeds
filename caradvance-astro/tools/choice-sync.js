/* CarAdvance – Choice fleetshop -> Bérelhető sync builder
 * Pure function, runs in the browser (fleetshop tab) or Node.
 *   CADV_SYNC({items, file, feat, today, vehicles}) -> {file, feat, featChanged, report}
 * items: Items[] of the fleetshop /v1/mobilityOffer/grouped response
 * vehicles (optional, Marc 2026-11-04): { 'CarLabel|CarModell|CarModellspec': [[color, months, km, price, count], …] }
 *   = every single car of that version from /v1/mobilityOffers (tools/choice-vehicles.js). The grouped list holds only one
 *   sample car per offer group, so without this the form would miss colours / terms (e.g. BMW X3 40d: 21 cars, 4 colours).
 * file : current caradvance-astro/seo-abo.mjs text
 * feat : current caradvance-astro/public/abo-feat.json object
 * today: 'YYYY-MM-DD'
 */
var CADV_SYNC = (function () {
  'use strict';

  // ---------- dictionaries ----------
  var FUEL = { 'benzin': 'Benzin', 'diesel': 'Dízel', 'plug-in-hybrid': 'PHEV', 'elektro': 'Elektromos', 'elektrisch': 'Elektromos', 'hybrid': 'Hibrid', 'mild-hybrid': 'Mild-hibrid' };
  var GEAR = { 'automatik': 'Automata', 'schaltung': 'Manuális', 'schaltgetriebe': 'Manuális' };
  var CAT = { 'kombi': 'Kombi', 'geländewagen/pickup': 'SUV / Terepjáró', 'van/kleinbus': 'Egyterű', 'limousine': 'Limuzin', 'cabrio/roadster': 'Kabrió', 'sportwagen/coupé': 'Coupé', 'kompaktwagen': 'Kompakt', 'kleinwagen': 'Kisautó' };
  var HUM = { 1: 'január', 2: 'február', 3: 'március', 4: 'április', 5: 'május', 6: 'június', 7: 'július', 8: 'augusztus', 9: 'szeptember', 10: 'október', 11: 'november', 12: 'december' };
  var BRAND = { 'Mini': 'MINI', 'Volkswagen': 'VW', 'Mercedes': 'Mercedes-Benz', 'Cupra': 'CUPRA', 'SEAT': 'Seat' };
  // model renames / merges decided with Marc (key = brand + ' ' + model)
  var RENAME = { 'MINI Cooper 3-Türer': 'MINI Cooper' };
  // külön kártya a John Cooper Works kivitelnek (Marc, 2026-11-03): a Choice 'JCW' kivitelei saját modellként jelennek meg
  var SPLIT = {
    'MINI Cooper': { re: /^(?:JCW|John Cooper Works)\b/i, to: 'MINI John Cooper Works' },
    'MINI Cooper Cabrio': { re: /^(?:JCW|John Cooper Works)\b/i, to: 'MINI John Cooper Works Cabrio' }
  };
  // márka-áthelyezés: a Choice 'VW NFZ' (haszonjármű) címkéjű modellek közül ezek a Volkswagen személyautók közé kerülnek (Marc, 2026-10-25)
  var MOVE = { 'VW NFZ Multivan': 'VW', 'VW NFZ T7 Multivan': 'VW' };
  var MERGE = { 'Audi A5 Avant e-hybrid': 'Audi A5 Avant', 'Audi Q5 Sportback e-hybrid': 'Audi Q5 Sportback', 'Audi A6 Avant e-hybrid': 'Audi A6 Avant' };
  function fixTrim(t) { return String(t || '').replace(/\s+/g, ' ').trim().replace(/qutattro/g, 'quattro'); }

  var CM = {
    'Ascariblau Metallic': 'Ascarikék metál', 'Chronosgrau Metallic': 'Chronosszürke metál', 'Daytonagrau Perleffekt': 'Daytonaszürke gyöngyház', 'Kieselgrau': 'Kavicsszürke', 'Mythosschwarz Metallic': 'Mítoszfekete metál', 'Navarrablau Metallic': 'Navarrakék metál', 'Pfeilgrau Perleffekt': 'Nyílszürke gyöngyház', 'Taifungrau Metallic': 'Tájfunszürke metál', 'Tamboragrau Metallic': 'Tamboraszürke metál', 'Manhattangrau Metallic': 'Manhattan szürke metál',
    'Alpinweiss': 'Alpesi fehér', 'Black sapphire metallic': 'Zafírfekete metál', 'Brooklyn grau metallic': 'Brooklyn szürke metál', 'Dune grey metallic': 'Dűne szürke metál', 'Mineralweiss metallic': 'Ásványfehér metál', 'Night dusk blue': 'Alkonykék', 'Saphirschwarz metallic': 'Zafírfekete metál', 'Schwarz': 'Fekete', 'Skyscraper grau metallic': 'Skyscraper szürke metál', 'Sophistograu brillanteffekt metallic': 'Sophisto szürke briliáns metál', 'Spacesilber metallic': 'Űrezüst metál',
    'Glacial White Metallic': 'Gleccserfehér metál', 'Midnight Black Metallic': 'Éjfélfekete metál', 'Midnight Schwarz Metallic': 'Éjfélfekete metál',
    'Abyss Black': 'Mélységfekete', 'Abyss Black Pearl': 'Mélységfekete gyöngyház', 'Atlas White': 'Atlaszfehér', 'Creamy White': 'Krémfehér', 'Ecotronic Grey': 'Ecotronic szürke', 'Engine Red': 'Élénkpiros', 'Shadow Grey': 'Árnyékszürke',
    'Black Pearl': 'Gyöngyházfekete', 'Ascotgrau': 'Ascot szürke',
    'British racing green metallic': 'British Racing zöld metál', 'Chili red': 'Chili piros', 'Legend grey': 'Legend szürke', 'Melting silver': 'Melting ezüst', 'Midnight black': 'Éjfélfekete', 'Nanuq white': 'Nanuq fehér',
    'MANUFAKTUR alpingrau uni': 'MANUFAKTUR alpesi szürke uni', 'Schwarz uni': 'Fekete uni', 'graphitgrau metallic': 'Grafitszürke metál', 'kosmosschwarz metallic': 'Kozmoszfekete metál', 'nachtschwarz uni': 'Éjfekete uni', 'obsidianschwarz metallic': 'Obszidiánfekete metál', 'polarweiß uni': 'Poláris fehér uni', 'schwarz uni': 'Fekete uni',
    'Manhattan Grau Metallic': 'Manhattan szürke metál',
    'Aquamarinblau Metallic': 'Akvamarinkék metál', 'Ascotgrau / Schwarz': 'Ascot szürke / fekete', 'Cipressino-Grün Metallic': 'Cipressino zöld metál', 'Crystal Ice Blue Metallic': 'Kristályjégkék metál', 'Deep Black Perleffekt': 'Mélyfekete gyöngyház', 'Delfingrau Metallic': 'Delfinszürke metál', 'Diabasgrau Metallic': 'Diabázszürke metál', 'Grape Yellow': 'Szőlősárga', 'Grenadillschwarz Metallic': 'Grenadillfekete metál', 'Ivory Silver Metallic / Schwarz': 'Elefántcsontezüst metál / fekete', 'Kings Red Metallic': 'Királyvörös metál', 'Mondsteingrau': 'Holdkőszürke', 'Nightshade Blue Metallic': 'Éjkék metál', 'Oryxweiß Perlmutteffekt': 'Oryxfehér gyöngyház', 'Oyster Silver Metallic': 'Osztrigaezüst metál', 'Pure White': 'Tiszta fehér', 'Pure White Uni': 'Tiszta fehér uni', 'Pyritsilber Metallic': 'Piritezüst metál', 'Rauchgrau Metallic': 'Füstszürke metál', 'Rauchgrau Metallic / Schwarz': 'Füstszürke metál / fekete', 'Reflexsilber Metallic': 'Reflexezüst metál', 'Wolf Grey Metallic': 'Wolf szürke metál', 'Wolf Grey': 'Wolf szürke',
    'Onyx Black': 'Ónixfekete',
    // added 2026-09-30
    'Kings Red Metallic / Schwarz': 'Királyvörös metál / fekete', 'Frost Blau': 'Fagykék', 'Indigo sunset blue': 'Indigo Sunset kék', 'Blazing blue': 'Blazing kék', 'Clear Blue Metallic': 'Tiszta kék metál', 'Indiumgrau Metallic': 'Indiumszürke metál', 'Sparkling kupfergrau metallic': 'Csillogó rézszürke metál', 'Deep Black Perleffekt / Schwarz': 'Mélyfekete gyöngyház / fekete', 'Persimmon Red Metallic': 'Persimmon piros metál', 'Storm bay metallic': 'Storm Bay metál', 'White Silver Metallic': 'Fehérezüst metál', 'Scale Silver Metallic': 'Scale ezüst metál', 'Gletscherweiß Metallic': 'Gleccserfehér metál', 'Denim Blue': 'Farmerkék', 'Ultrablau Metallic': 'Ultrakék metál', 'Florettsilber Metallic': 'Floretezüst metál', 'Cyber Grey': 'Cyber szürke'
  };
  var CM_LC = {}; Object.keys(CM).forEach(function (k) { CM_LC[k.toLowerCase().replace(/\s+/g, ' ')] = CM[k]; });
  function colorHu(de, extra) {
    var k = String(de || '').replace(/\s+/g, ' ').trim();
    if (extra && extra[k]) return extra[k];
    return CM[k] || CM_LC[k.toLowerCase()] || null;
  }

  var HEX = [['alpinweiss', '#e9ebee'], ['polarweiß', '#e9ebee'], ['pure white', '#eef0f2'], ['oryxweiß', '#f1f2f3'], ['candy', '#eef0f2'], ['gletscherweiß', '#e9ebee'], ['mineralweiß', '#e9ebee'], ['bianco', '#eef0f2'], ['weiss', '#e9ebee'], ['weiß', '#e9ebee'], ['white', '#e9ebee'], ['we/', '#e9ebee'],
    ['black sapphire', '#15171b'], ['mythosschwarz', '#161616'], ['grenadillschwarz', '#121316'], ['deep black', '#111214'], ['obsidianschwarz', '#141518'], ['brillantschwarz', '#121316'], ['carbonschwarz', '#15171a'], ['cosmosschwarz', '#141518'], ['saphirschwarz', '#14161a'], ['schwarz', '#16181c'], ['black', '#16181c'], ['nero', '#16181c'], ['noir', '#16181c'],
    ['daytonagrau', '#41454b'], ['chronosgrau', '#6b6f74'], ['delfingrau', '#8a8f95'], ['brooklyn', '#585d64'], ['graphitgrau', '#3d4247'], ['graphite', '#3d4247'], ['legend grey', '#6e7378'], ['nardograu', '#8a8f94'], ['quarzit', '#6a6e75'], ['manhattan', '#6d7176'], ['sophistograu', '#565a60'], ['dune grey', '#8c8b86'], ['arktisgrau', '#8f9399'], ['magnetitgrau', '#4a4e54'], ['tellurgrau', '#4d5157'], ['kristallgrau', '#a7abb0'], ['meteorgrau', '#4a4e54'], ['griffin', '#5c6067'], ['mondsteingrau', '#8b9096'], ['mineralgrau', '#6f747a'], ['donington', '#3a3f44'], ['sonic', '#3b3f45'], ['frozen', '#8f9499'], ['grau', '#70757b'], ['grey', '#70757b'], ['gris', '#70757b'],
    ['tansanitblau', '#1f3350'], ['night dusk blue', '#25324a'], ['phytonicblau', '#2a3f5c'], ['portimao', '#274a8a'], ['marina bay', '#2f6fb0'], ['mediterranblau', '#25457f'], ['enzianblau', '#1c3f74'], ['tanzanit', '#1f3350'], ['atollblau', '#1f5f8c'], ['avusblau', '#1f3f86'], ['skyscraper', '#3a4a63'], ['imperialblau', '#243a63'], ['sonicblau', '#274a8a'], ['capriblau', '#1f5f8c'], ['blu', '#284a86'], ['blau', '#284a86'], ['blue', '#284a86'], ['bleu', '#284a86'],
    ['tamburello', '#8a1220'], ['aventurin', '#5a1420'], ['jupiterrot', '#a3141c'], ['imolarot', '#9a1620'], ['karminrot', '#8f1420'], ['rot', '#a3141c'], ['red', '#a3141c'], ['rosso', '#a3141c'], ['rouge', '#a3141c'],
    ['florettsilber', '#c6c9cd'], ['glaciersilber', '#c4c7cb'], ['silber', '#c6c9cd'], ['silver', '#c6c9cd'], ['argento', '#c6c9cd'], ['titansilber', '#b7bbc0'],
    ['taigabeige', '#b7ac96'], ['sakhirgold', '#b79a5e'], ['beige', '#c8bea7'], ['braun', '#5a4632'], ['brown', '#5a4632'], ['bronze', '#7d6a48'], ['kaschmirsilber', '#bfb9a8'],
    ['britishracing', '#1e3b2b'], ['goodwood', '#243b2c'], ['grün', '#26463a'], ['green', '#26463a'], ['grun', '#26463a'], ['verde', '#26463a']];
  function colorHex(name) { var s = String(name || '').toLowerCase(); if (!s) return '#7b8088'; for (var i = 0; i < HEX.length; i++) if (s.indexOf(HEX[i][0]) > -1) return HEX[i][1]; return '#7b8088'; }
  function isDark(h) { h = h.replace('#', ''); var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16); return (0.299 * r + 0.587 * g + 0.114 * b) < 140; }
  function deposit(bl) { if (typeof bl !== 'number' || !isFinite(bl)) return 3000; if (bl <= 45000) return 2000; if (bl <= 60000) return 2500; if (bl <= 80000) return 3000; if (bl <= 105000) return 5000; return 7500; }

  // ---------- helpers for the seo-abo.mjs container ----------
  function b64dec(s) { if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8'); return decodeURIComponent(escape(atob(s))); }
  function b64enc(s) { if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf8').toString('base64'); return btoa(unescape(encodeURIComponent(s))); }
  function jsStrLit(text, name) { var si = text.indexOf('const ' + name + ' = '); if (si < 0) throw new Error('no ' + name); si += ('const ' + name + ' = ').length; var k = si + 1; while (text[k] !== '"') { if (text[k] === '\\') k++; k++; } return { start: si, end: k + 1, value: JSON.parse(text.slice(si, k + 1)) }; }
  function jsonAt(s, from) { var st = s.indexOf('{', from), d = 0, e = st, inS = false; for (; e < s.length; e++) { var c = s[e]; if (inS) { if (c === '\\') { e++; continue; } if (c === '"') inS = false; continue; } if (c === '"') inS = true; else if (c === '{') d++; else if (c === '}') { d--; if (d === 0) break; } } return { start: st, end: e + 1, value: JSON.parse(s.slice(st, e + 1)) }; }

  function monthLabel(ymd, today) {
    if (!ymd) return { rank: 0, lab: 'Azonnal' };
    var d = String(ymd).slice(0, 10);
    if (d <= today) return { rank: 0, lab: 'Azonnal' };
    var y = +d.slice(0, 4), m = +d.slice(5, 7);
    return { rank: y * 100 + m, lab: y + '. ' + HUM[m] };
  }

  function norm(it, today, extraColors) {
    var ro = it.RentalObject || {};
    var brand = String(ro.CarLabel || '').trim(); brand = BRAND[brand] || brand;
    var model = String(ro.CarModell || '').replace(/\s+/g, ' ').trim();
    var key = brand + ' ' + model, trim = fixTrim(ro.CarModellspec), merged = false;
    if (RENAME[key]) key = RENAME[key];
    if (SPLIT[key] && SPLIT[key].re.test(trim)) key = SPLIT[key].to;
    if (MOVE[key]) { var mvModel = key.slice(brand.length + 1).replace(/^T7\s+/, ''); brand = MOVE[key]; key = brand + ' ' + mvModel; }
    if (MERGE[key]) { key = MERGE[key]; merged = true; if (!/hybrid/i.test(trim)) trim = fixTrim('e-Hybrid ' + trim); }
    var colDe = String(ro.Color || it.Color || '').replace(/\s+/g, ' ').trim() || '—';
    var fuelRaw = String(it.KindOfFuel || ro.KindOfFuel || ''), gearRaw = String(it.KindOfGear || ro.KindOfGear || '');
    var av = monthLabel(ro.DateRegistration, today);
    var eq = (ro.Equipment || []).map(function (x) { return String(x).trim(); }).filter(Boolean).join(' • ');
    return {
      rk: [ro.CarLabel, ro.CarModell, ro.CarModellspec].map(function (x) { return String(x == null ? '' : x); }).join('|'),
      key: key, brand: brand, model: key.slice(brand.length + 1), merged: merged,
      trim: trim || '—', colDe: colDe, colHu: colorHu(colDe, extraColors),
      fuel: FUEL[fuelRaw.toLowerCase()] || fuelRaw, gear: GEAR[gearRaw.toLowerCase()] || gearRaw,
      cat: CAT[String(ro.CarType || '').toLowerCase()] || null,
      ps: typeof ro.PowerHp === 'number' ? ro.PowerHp : null,
      net: typeof it.Price === 'number' ? it.Price : null,
      gross: typeof ro.PriceProducer1 === 'number' ? ro.PriceProducer1 : null,
      term: it.RuntimeMonths || null, km: it.MileagePerMonth || null,
      rank: av.rank, avail: av.lab, eq: eq,
      n: Math.max(1, Math.round(+it.VehiclesCount) || 1)
    };
  }

  function build(opts) {
    var items = opts.items, text = opts.file, featOld = opts.feat || {}, today = opts.today;
    var extraColors = opts.extraColors || {};
    if (!items || items.length < 50) throw new Error('too few items from fleetshop (' + (items && items.length) + ') – aborting');

    // current data
    var secLit = text.match(/const SEC_B64\s*=\s*"([^"]*)"/); if (!secLit) throw new Error('SEC_B64 not found');
    var sec = b64dec(secLit[1]);
    var subM = sec.match(/window\.SUB\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|\(function)/); if (!subM) throw new Error('SUB not found');
    var subOld = JSON.parse(subM[1]);
    var stripL = jsStrLit(text, 'STRIP'), strip = stripL.value;
    var cfgPos = strip.indexOf('window.__ABCFG='); if (cfgPos < 0) throw new Error('__ABCFG not found');
    var cfgJ = jsonAt(strip, cfgPos), cfgOld = cfgJ.value;
    var photoM = sec.match(/var PHOTO=(\{[^}]*\})/); var PHOTO = photoM ? JSON.parse(photoM[1]) : {};
    var photoAdded = [];
    if (photoM && opts.photos) {
      Object.keys(opts.photos).forEach(function (k) { if (k.charAt(0) !== '_' && PHOTO[k] !== opts.photos[k]) { PHOTO[k] = opts.photos[k]; photoAdded.push(k + ' → ' + opts.photos[k]); } });
      if (photoAdded.length) { var pj = 'var PHOTO=' + JSON.stringify(PHOTO); sec = sec.replace(photoM[0], function () { return pj; }); }
    }
    var oldByKey = {}; subOld.models.forEach(function (m) { oldByKey[m.brand + ' ' + m.model] = m; });

    // carry-forward term/km combos per (key|fuel|colorHu|trim)
    var combos = {};
    Object.keys(cfgOld).forEach(function (k) { var c = cfgOld[k]; (c.X || []).forEach(function (x) { var id = [k, c.F[x[0]], c.C[x[3]], fixTrim(c.TR[x[4]])].join('|'); (combos[id] = combos[id] || []).push([c.T[x[1]], c.K[x[2]]]); }); });

    var recs = items.map(function (it) { return norm(it, today, extraColors); });
    // ---------- felszereltségi csomagok (Choice „Ausstattungspaket”, Marc 2026-11-04) ----------
    // Egy kivitelen (trim) belül a különböző felszereltségű autók külön választható csomagok: „<kivitel> · 2. csomag”.
    // A sorszám a felszereltségi lista ábécérendje szerint stabil; egycsomagos kivitelnél nincs utótag.
    var PKG = {};
    var PMIN = {}; // csomagonként a legolcsóbb nettó ár: az 1. csomag a legolcsóbb
    recs.forEach(function (r) { var id = r.key + '|' + r.trim; PKG[id] = PKG[id] || []; if (r.eq && PKG[id].indexOf(r.eq) < 0) PKG[id].push(r.eq);
      if (r.eq && r.net != null) { var pk = id + '|' + r.eq; PMIN[pk] = PMIN[pk] == null ? r.net : Math.min(PMIN[pk], r.net); } });
    Object.keys(PKG).forEach(function (id) { PKG[id].sort(function (a, b) { var pa = PMIN[id + '|' + a], pb = PMIN[id + '|' + b]; pa = pa == null ? 1e9 : pa; pb = pb == null ? 1e9 : pb; return pa - pb || (a < b ? -1 : a > b ? 1 : 0); }); });
    recs.forEach(function (r) { r.trim0 = r.trim; var L = PKG[r.key + '|' + r.trim]; if (L && L.length > 1 && r.eq) { r.pkg = L.indexOf(r.eq) + 1; r.trim = r.trim + ' · ' + r.pkg + '. csomag'; } });
    // ---------- minden egyes autó (opts.vehicles): szín × futamidő × km × ár, darabszámmal ----------
    // Egy ajánlatcsoportú kivitel: a csoport helyett autónkénti sorok (pontos darabszám).
    // Több csomagos kivitel: a Choice nem adja meg, melyik autó melyik csomagba tartozik — a csomag a saját mintaautójával
    // és darabszámával marad, a kivitel többi színe / futamideje 0 darabos kiegészítő sorként kerül hozzá.
    var VEH = opts.vehicles || null, vstat = { keys: 0, exact: 0, multi: 0, skipped: [] };
    if (VEH) {
      // A Choice ajánlatcsoportjai (csomagok) jellemzően elérhetőség szerint is külön vannak: a „most elérhető” (AvailableFrom=0) autók
      // a „most” csoport(ok)hoz, a többi a későbbi csoport(ok)hoz tartozik. Ha egy elérhetőségi körben egy csoport van, a hozzárendelés pontos.
      var byRk = {}; recs.forEach(function (r) { (byRk[r.rk] = byRk[r.rk] || []).push(r); });
      var exp = [];
      var mk = function (r, cd0, v, n) { var o = {}; Object.keys(r).forEach(function (k) { o[k] = r[k]; }); var cd = String(cd0 || '').replace(/\s+/g, ' ').trim() || r.colDe; o.colDe = cd; o.colHu = colorHu(cd, extraColors); o.term = +v[1] || r.term; o.km = +v[2] || r.km; o.net = typeof v[3] === 'number' ? v[3] : r.net; o.n = n; o.exact = true; return o; };
      Object.keys(byRk).forEach(function (rk) {
        var L = byRk[rk], vs = VEH[rk];
        var tot = L.reduce(function (a, r) { return a + r.n; }, 0), vtot = (vs || []).reduce(function (a, v) { return a + (+v[4] || 0); }, 0);
        if (!vs || !vs.length || vtot !== tot) { if (vs) vstat.skipped.push(rk + ' (' + tot + '/' + vtot + ')'); L.forEach(function (r) { exp.push(r); }); return; }
        var hasNow = vs.some(function (v) { return v.length > 5; });
        var cats = hasNow ? [
          { g: L.filter(function (r) { return r.rank === 0; }), v: vs.map(function (v) { return [v[0], v[1], v[2], v[3], +v[5] || 0]; }) },
          { g: L.filter(function (r) { return r.rank !== 0; }), v: vs.map(function (v) { return [v[0], v[1], v[2], v[3], (+v[4] || 0) - (+v[5] || 0)]; }) }
        ] : [{ g: L, v: vs }];
        var ok = cats.every(function (c) { var gt = c.g.reduce(function (a, r) { return a + r.n; }, 0), vt = c.v.reduce(function (a, v) { return a + v[4]; }, 0); return gt === vt; });
        if (!ok) { cats = [{ g: L, v: vs }]; } // a „most” bontás nem egyezik a csoportok darabszámával → egy körben kezeljük
        vstat.keys++;
        cats.forEach(function (c) {
          var V = c.v.filter(function (v) { return v[4] > 0; }); if (!c.g.length) return;
          if (c.g.length === 1) { vstat.exact++; V.forEach(function (v) { exp.push(mk(c.g[0], v[0], v, v[4])); }); return; }
          vstat.multi++;
          c.g.forEach(function (r) { r.exact = true; exp.push(r); V.forEach(function (v) { exp.push(mk(r, v[0], v, 0)); }); });
        });
      });
      recs = exp;
    }
    var groups = {}, order = [];
    recs.forEach(function (r) { if (!groups[r.key]) { groups[r.key] = []; order.push(r.key); } groups[r.key].push(r); });

    var report = { today: today, items: items.length, added: [], removed: [], changed: [], missingPhoto: [], photoAdded: photoAdded, untranslatedColors: [], newFeat: [], totalCars: recs.reduce(function (a, r) { return a + r.n; }, 0) };
    var untrans = {};

    // ---------- SUB models ----------
    var models = order.map(function (key) {
      var v = groups[key], old = oldByKey[key];
      var cnt = {}, deOf = {}, variants = [], fuels = [], gears = [], ps = [], kms = {}, months = {}, now = 0, later = {}, minnet = null, cat = null;
      v.forEach(function (r) {
        var cn = r.colHu || r.colDe; if (!r.colHu && r.colDe !== '—') untrans[r.colDe] = 1;
        cnt[cn] = (cnt[cn] || 0) + r.n; if (!deOf[cn]) deOf[cn] = r.colDe;
        if (r.trim0 !== '—' && variants.indexOf(r.trim0) < 0) variants.push(r.trim0);
        if (r.fuel && fuels.indexOf(r.fuel) < 0) fuels.push(r.fuel);
        if (r.gear && gears.indexOf(r.gear) < 0) gears.push(r.gear);
        if (r.ps != null) ps.push(r.ps);
        if (r.net != null) minnet = minnet == null ? r.net : Math.min(minnet, r.net);
        if (r.rank === 0) now += r.n; else later[r.rank] = { d: r.avail, c: ((later[r.rank] || {}).c || 0) + r.n };
        if (!cat && r.cat) cat = r.cat;
        var id = [key, r.fuel, r.colHu || r.colDe, r.trim].join('|'), id0 = [key, r.fuel, r.colHu || r.colDe, r.trim0].join('|');
        (r.exact ? [] : (combos[id] || combos[id0] || [])).concat([[r.term, r.km]]).forEach(function (tk) { if (tk[0]) months[tk[0]] = 1; if (tk[1]) kms[tk[1]] = 1; });
      });
      var cols = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
      var ph = colorHex(deOf[cols[0]]);
      var m = {
        brand: v[0].brand, model: v[0].model, cat: cat || (old && old.cat) || '',
        count: v.reduce(function (a, r) { return a + r.n; }, 0), now: now,
        later: Object.keys(later).sort().map(function (k) { return { d: later[k].d, c: later[k].c }; }),
        ph: ph, pd: isDark(ph),
        colors: cols.map(function (c) { return { n: c, h: colorHex(deOf[c]) }; }),
        variants: variants.slice(0, 8),
        packages: (old && old.packages) || [],
        psMin: ps.length ? Math.min.apply(null, ps) : null, psMax: ps.length ? Math.max.apply(null, ps) : null,
        fuels: fuels, gears: gears,
        km: Object.keys(kms).map(Number).sort(function (a, b) { return a - b; }),
        months: Object.keys(months).map(Number).sort(function (a, b) { return a - b; }),
        net: minnet
      };
      if (!old) report.added.push(key + ' (' + m.count + ' autó, ' + minnet + ' €-tól)');
      else {
        var diffs = [];
        if (old.count !== m.count) diffs.push('db ' + old.count + '→' + m.count);
        if (old.now !== m.now) diffs.push('azonnal ' + old.now + '→' + m.now);
        if (old.net !== m.net) diffs.push('ár ' + old.net + '→' + m.net + ' €');
        if (diffs.length) report.changed.push(key + ': ' + diffs.join(', '));
      }
      if (!PHOTO[key]) report.missingPhoto.push(key);
      return m;
    });
    Object.keys(oldByKey).forEach(function (k) { if (!groups[k]) report.removed.push(k + ' (' + oldByKey[k].count + ' autó)'); });
    report.untranslatedColors = Object.keys(untrans);
    report.vehicles = VEH ? vstat : null;

    var bt = {}; models.forEach(function (m) { bt[m.brand] = (bt[m.brand] || 0) + m.count; });
    var brandOrder = Object.keys(bt).sort(function (a, b) { return bt[b] - bt[a] || a.localeCompare(b); });
    models.sort(function (a, b) { return (bt[b.brand] - bt[a.brand]) || a.brand.localeCompare(b.brand) || (b.count - a.count) || a.model.localeCompare(b.model); });
    var subNew = { rate_fallback: subOld.rate_fallback || 364, brand_order: brandOrder, brand_totals: bt, models: models };

    // ---------- __ABCFG ----------
    var cfgNew = {};
    order.forEach(function (key) {
      var c = { F: [], T: [], K: [], C: [], TR: [] }, D = {}, NC = {};
      function gi(a, x) { var i = a.indexOf(x); if (i > -1) return i; a.push(x); return a.length - 1; }
      // kivitelek sorrendje: az alapkivitel első előfordulása szerint, azon belül 1., 2., … csomag
      var t0 = [], tl = [];
      groups[key].forEach(function (r) { if (t0.indexOf(r.trim0 || r.trim) < 0) t0.push(r.trim0 || r.trim); if (!tl.some(function (x) { return x.t === r.trim; })) tl.push({ t: r.trim, g: t0.indexOf(r.trim0 || r.trim), p: r.pkg || 0 }); });
      tl.sort(function (a, b) { return a.g - b.g || a.p - b.p; }); c.TR = tl.map(function (x) { return x.t; });
      groups[key].forEach(function (r) {
        var fi = gi(c.F, r.fuel), ci = gi(c.C, r.colHu || r.colDe), tri = gi(c.TR, r.trim), dep = deposit(r.gross);
        if (r.n > 0) { var nk = tri + '|' + r.avail; NC[nk] = (NC[nk] || 0) + r.n; }
        var id = [key, r.fuel, r.colHu || r.colDe, r.trim].join('|'), id0 = [key, r.fuel, r.colHu || r.colDe, r.trim0].join('|');
        var tks = (r.exact ? [] : (combos[id] || combos[id0] || [])).concat([[r.term, r.km]]);
        tks.forEach(function (tk) {
          if (!tk[0] || !tk[1]) return;
          var ti = gi(c.T, tk[0]), ki = gi(c.K, tk[1]), ck = [fi, ti, ki, ci, tri].join(',') + '|' + r.rank; // elérhetőségenként külön sor: a későbbi hónapok is választhatók (Marc, 2026-11-04)
          var cur = D[ck];
          if (!cur || r.rank < cur.rank || (r.rank === cur.rank && r.net < cur.net)) D[ck] = { rank: r.rank, lab: r.avail, dep: dep, net: r.net };
        });
      });
      var labs = []; Object.keys(D).map(function (k) { return D[k]; }).sort(function (a, b) { return a.rank - b.rank; }).forEach(function (d) { if (labs.indexOf(d.lab) < 0) labs.push(d.lab); });
      c.A = labs;
      // darabszám kivitelenként és elérhetőségenként: [kivitel-index, elérhetőség-index, db] — az „Elérhetőség” lépés ezt mutatja (Marc, 2026-11-04)
      c.N = Object.keys(NC).map(function (nk) { var p = nk.indexOf('|'); return [+nk.slice(0, p), labs.indexOf(nk.slice(p + 1)), NC[nk]]; }).filter(function (x) { return x[1] > -1; });
      c.X = Object.keys(D).map(function (ck) { var d = D[ck]; return ck.split('|')[0].split(',').map(Number).concat([labs.indexOf(d.lab), d.dep, d.net]); });
      cfgNew[key] = c;
    });

    // ---------- equipment (abo-feat.json) ----------
    var featNew = {}, featChanged = false;
    Object.keys(featOld).forEach(function (k0) {
      var o = featOld[k0], k = RENAME[k0] || MERGE[k0] || k0, isM = !!MERGE[k0];
      if (k !== k0) featChanged = true;
      featNew[k] = featNew[k] || {};
      Object.keys(o).forEach(function (t) { var nt = fixTrim(t); if (isM && !/hybrid/i.test(nt)) nt = fixTrim('e-Hybrid ' + nt); if (nt !== t) featChanged = true; if (!featNew[k][nt]) featNew[k][nt] = o[t]; });
    });
    // a különválasztott kivitelek (SPLIT) magyar felszereltségi szövegei átkerülnek az új modellhez
    Object.keys(SPLIT).forEach(function (src) {
      var sp = SPLIT[src], o = featNew[src] || {};
      Object.keys(o).forEach(function (t) { if (!sp.re.test(t)) return; featNew[sp.to] = featNew[sp.to] || {}; if (!featNew[sp.to][t]) { featNew[sp.to][t] = o[t]; featChanged = true; } });
    });
    // Csomagonként (kivitel · N. csomag) saját felszereltség. A '__de|<címke>' kulcs a német forrásszöveg rövid ujjlenyomatát (hossz:FNV-1a) őrzi: ha a csomag
    // tartalma nem változott, a magyar fordítás marad; átszámozásnál a fordítás átkerül; új / megváltozott tartalom → newFeat (fordítandó).
    var fp = function (t) { var x = 0x811c9dc5; for (var i = 0; i < t.length; i++) { x ^= t.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return t.length.toString(36) + ':' + x.toString(36); };
    recs.forEach(function (r) {
      if (!r.eq) return;
      var F = featNew[r.key] = featNew[r.key] || {}, deK = '__de|' + r.trim, h = fp(r.eq);
      if (F[deK] === h && F[r.trim]) return;
      if (F[r.trim] && !F[deK] && !r.pkg) { F[deK] = h; featChanged = true; return; }
      var reuse = null;
      Object.keys(F).forEach(function (k) { if (k.indexOf('__de|') === 0 && F[k] === h && F[k.slice(5)] && F[k.slice(5)] !== r.eq) reuse = F[k.slice(5)]; });
      F[r.trim] = reuse || r.eq; F[deK] = h; featChanged = true;
      if (!reuse && !report.newFeat.some(function (x) { return x.model === r.key && x.trim === r.trim; })) report.newFeat.push({ model: r.key, trim: r.trim });
    });

    // ---------- write back ----------
    var subJson = JSON.stringify(subNew);
    var secNew = sec.replace(subM[1], function () { return subJson; });
    var stripNew = strip.slice(0, cfgJ.start) + JSON.stringify(cfgNew) + strip.slice(cfgJ.end);
    var secB64 = b64enc(secNew);
    var out = text.replace(secLit[1], function () { return secB64; });
    var sl = jsStrLit(out, 'STRIP');
    out = out.slice(0, sl.start) + JSON.stringify(stripNew) + out.slice(sl.end);
    out = out.replace(/const SUB_TOTAL = \d+;/, 'const SUB_TOTAL = ' + report.totalCars + ';');
    report.modelsBefore = subOld.models.length; report.modelsAfter = models.length;
    report.carsBefore = subOld.models.reduce(function (a, m) { return a + m.count; }, 0);
    report.fileChanged = out !== text;
    return { file: out, feat: featNew, featChanged: featChanged, report: report };
  }
  build.norm = norm;
  return build;
})();
if (typeof module !== 'undefined') module.exports = CADV_SYNC;
