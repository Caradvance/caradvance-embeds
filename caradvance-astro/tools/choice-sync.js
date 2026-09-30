/* CarAdvance – Choice fleetshop -> Bérelhető sync builder
 * Pure function, runs in the browser (fleetshop tab) or Node.
 *   CADV_SYNC({items, file, feat, today}) -> {file, feat, featChanged, report}
 * items: Items[] of the fleetshop /v1/mobilityOffer/grouped response
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
  var MERGE = { 'Audi Q5 Sportback e-hybrid': 'Audi Q5 Sportback', 'Audi A6 Avant e-hybrid': 'Audi A6 Avant' };
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
    if (MERGE[key]) { key = MERGE[key]; merged = true; if (!/hybrid/i.test(trim)) trim = fixTrim('e-Hybrid ' + trim); }
    var colDe = String(ro.Color || it.Color || '').replace(/\s+/g, ' ').trim() || '—';
    var fuelRaw = String(it.KindOfFuel || ro.KindOfFuel || ''), gearRaw = String(it.KindOfGear || ro.KindOfGear || '');
    var av = monthLabel(ro.DateRegistration, today);
    var eq = (ro.Equipment || []).map(function (x) { return String(x).trim(); }).filter(Boolean).join(' • ');
    return {
      key: key, brand: brand, model: key.slice(brand.length + 1), merged: merged,
      trim: trim || '—', colDe: colDe, colHu: colorHu(colDe, extraColors),
      fuel: FUEL[fuelRaw.toLowerCase()] || fuelRaw, gear: GEAR[gearRaw.toLowerCase()] || gearRaw,
      cat: CAT[String(ro.CarType || '').toLowerCase()] || null,
      ps: typeof ro.PowerHp === 'number' ? ro.PowerHp : null,
      net: typeof it.Price === 'number' ? it.Price : null,
      gross: typeof ro.PriceProducer1 === 'number' ? ro.PriceProducer1 : null,
      term: it.RuntimeMonths || null, km: it.MileagePerMonth || null,
      rank: av.rank, avail: av.lab, eq: eq
    };
  }

  function build(opts) {
    var items = opts.items, text = opts.file, featOld = opts.feat || {}, today = opts.today;
    var extraColors = opts.extraColors || {};
    if (!items || items.length < 50) throw new Error('too few items from fleetshop (' + (items && items.length) + ') – aborting');

    // current data
    var secLit = text.match(/const SEC_B64\s*=\s*"([^"]*)"/); if (!secLit) throw new Error('SEC_B64 not found');
    var sec = b64dec(secLit[1]);
    var subM = sec.match(/window\.SUB\s*=\s*(\{[\s\S]*?\});\s*<\/script>/); if (!subM) throw new Error('SUB not found');
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
    var groups = {}, order = [];
    recs.forEach(function (r) { if (!groups[r.key]) { groups[r.key] = []; order.push(r.key); } groups[r.key].push(r); });

    var report = { today: today, items: items.length, added: [], removed: [], changed: [], missingPhoto: [], photoAdded: photoAdded, untranslatedColors: [], newFeat: [], totalCars: recs.length };
    var untrans = {};

    // ---------- SUB models ----------
    var models = order.map(function (key) {
      var v = groups[key], old = oldByKey[key];
      var cnt = {}, deOf = {}, variants = [], fuels = [], gears = [], ps = [], kms = {}, months = {}, now = 0, later = {}, minnet = null, cat = null;
      v.forEach(function (r) {
        var cn = r.colHu || r.colDe; if (!r.colHu && r.colDe !== '—') untrans[r.colDe] = 1;
        cnt[cn] = (cnt[cn] || 0) + 1; deOf[cn] = r.colDe;
        if (r.trim !== '—' && variants.indexOf(r.trim) < 0) variants.push(r.trim);
        if (r.fuel && fuels.indexOf(r.fuel) < 0) fuels.push(r.fuel);
        if (r.gear && gears.indexOf(r.gear) < 0) gears.push(r.gear);
        if (r.ps != null) ps.push(r.ps);
        if (r.net != null) minnet = minnet == null ? r.net : Math.min(minnet, r.net);
        if (r.rank === 0) now++; else later[r.rank] = { d: r.avail, c: ((later[r.rank] || {}).c || 0) + 1 };
        if (!cat && r.cat) cat = r.cat;
        var id = [key, r.fuel, r.colHu || r.colDe, r.trim].join('|');
        (combos[id] || [[r.term, r.km]]).concat([[r.term, r.km]]).forEach(function (tk) { if (tk[0]) months[tk[0]] = 1; if (tk[1]) kms[tk[1]] = 1; });
      });
      var cols = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
      var ph = colorHex(deOf[cols[0]]);
      var m = {
        brand: v[0].brand, model: v[0].model, cat: cat || (old && old.cat) || '',
        count: v.length, now: now,
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

    var bt = {}; models.forEach(function (m) { bt[m.brand] = (bt[m.brand] || 0) + m.count; });
    var brandOrder = Object.keys(bt).sort(function (a, b) { return bt[b] - bt[a] || a.localeCompare(b); });
    models.sort(function (a, b) { return (bt[b.brand] - bt[a.brand]) || a.brand.localeCompare(b.brand) || (b.count - a.count) || a.model.localeCompare(b.model); });
    var subNew = { rate_fallback: subOld.rate_fallback || 364, brand_order: brandOrder, brand_totals: bt, models: models };

    // ---------- __ABCFG ----------
    var cfgNew = {};
    order.forEach(function (key) {
      var c = { F: [], T: [], K: [], C: [], TR: [] }, D = {};
      function gi(a, x) { var i = a.indexOf(x); if (i > -1) return i; a.push(x); return a.length - 1; }
      groups[key].forEach(function (r) {
        var fi = gi(c.F, r.fuel), ci = gi(c.C, r.colHu || r.colDe), tri = gi(c.TR, r.trim), dep = deposit(r.gross);
        var id = [key, r.fuel, r.colHu || r.colDe, r.trim].join('|');
        var tks = (combos[id] || []).concat([[r.term, r.km]]);
        tks.forEach(function (tk) {
          if (!tk[0] || !tk[1]) return;
          var ti = gi(c.T, tk[0]), ki = gi(c.K, tk[1]), ck = [fi, ti, ki, ci, tri].join(',');
          var cur = D[ck];
          if (!cur || r.rank < cur.rank || (r.rank === cur.rank && r.net < cur.net)) D[ck] = { rank: r.rank, lab: r.avail, dep: dep, net: r.net };
        });
      });
      var labs = []; Object.keys(D).map(function (k) { return D[k]; }).sort(function (a, b) { return a.rank - b.rank; }).forEach(function (d) { if (labs.indexOf(d.lab) < 0) labs.push(d.lab); });
      c.A = labs;
      c.X = Object.keys(D).map(function (ck) { var d = D[ck]; return ck.split(',').map(Number).concat([labs.indexOf(d.lab), d.dep, d.net]); });
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
    recs.forEach(function (r) {
      if (!r.eq) return;
      featNew[r.key] = featNew[r.key] || {};
      if (!featNew[r.key][r.trim]) { featNew[r.key][r.trim] = r.eq; featChanged = true; report.newFeat.push({ model: r.key, trim: r.trim }); }
    });

    // ---------- write back ----------
    var subJson = JSON.stringify(subNew);
    var secNew = sec.replace(subM[1], function () { return subJson; });
    var stripNew = strip.slice(0, cfgJ.start) + JSON.stringify(cfgNew) + strip.slice(cfgJ.end);
    var secB64 = b64enc(secNew);
    var out = text.replace(secLit[1], function () { return secB64; });
    var sl = jsStrLit(out, 'STRIP');
    out = out.slice(0, sl.start) + JSON.stringify(stripNew) + out.slice(sl.end);
    out = out.replace(/const SUB_TOTAL = \d+;/, 'const SUB_TOTAL = ' + recs.length + ';');
    report.modelsBefore = subOld.models.length; report.modelsAfter = models.length;
    report.carsBefore = subOld.models.reduce(function (a, m) { return a + m.count; }, 0);
    report.fileChanged = out !== text;
    return { file: out, feat: featNew, featChanged: featChanged, report: report };
  }
  return build;
})();
if (typeof module !== 'undefined') module.exports = CADV_SYNC;
