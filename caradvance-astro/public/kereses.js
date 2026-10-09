/* CarAdvance — okos kereső (menü: Rólunk és Kapcsolat között; Ctrl/Cmd+K vagy „/”).
 * Az index a build során készül (seo-search.mjs → /kereses-index.json, nyelvenként külön).
 * „Okos” rész: ékezet- és elírás-tűrés, szinonimák (HU/EN/DE…), márka-becenevek, és a természetes
 * nyelvű kérés értelmezése: ár (pl. „500 ezer alatt”, „10 millióig”), ülésszám („7 személyes”),
 * üzemanyag, karosszéria, bérlés / vásárlás / használt / új, km, teljesítmény, évjárat, 4x4, olcsó/drága. */
(function () {
  'use strict';
  if (window.__caSearch) return;
  window.__caSearch = 1;

  function boot() {
    var BTNS = document.querySelectorAll('[data-ca-search]');
    if (!BTNS.length) return;
    var B0 = BTNS[0];
    var LANG = B0.getAttribute('data-lang') || 'hu';
    var IDX = B0.getAttribute('data-idx') || '/kereses-index.json';
    // caradvance.sk / .cz saját domainen az oldalak előtag nélkül futnak
    var DOM = (location.hostname.match(/caradvance\.(sk|cz)$/) || [])[1];
    var DOM_PRE = '';
    if (DOM) { DOM_PRE = '/' + (DOM === 'cz' ? 'cs' : 'sk'); IDX = '/kereses-index-' + DOM_PRE.slice(1) + '.json'; }

    var T = {
      hu: { ph: 'Keress autót, márkát vagy bármit… pl. „7 személyes SUV 600 ezer alatt”', pop: 'Népszerű keresések', rec: 'Legutóbbi kereséseid', quick: 'Gyors linkek', none: 'Nincs találat', noneTx: 'Fogalmazd meg másképp, vagy kérj tőlünk személyre szabott ajánlatot — bármilyen autót felkutatunk.', relaxed: 'Pontos egyezés nincs — ezek állnak a legközelebb a kérésedhez:', did: 'Erre gondoltál:', more: 'Továbbiak', und: 'Így értettük:', load: 'Betöltés…', err: 'A kereső most nem érhető el. Próbáld újra később.', esc: 'bezárás', nav: 'navigálás', open: 'megnyitás', offer: 'Egyedi ajánlatot kérek', contact: 'Kapcsolat', call: 'Hívj minket', mail: 'Írj nekünk', ho: 'Ft/hó', netto: 'nettó', tol: '-tól', seats: 'ülés', km: 'km', le: 'LE', lit: 'l csomagtartó', awd: '4x4', res: 'találat',
        k: { berles: 'Bérelhető autók', keszlet: 'Eladó autók — készleten', rendeles: 'Új autó rendelésre', eszkoz: 'Kalkulátorok', blog: 'Cikkek', oldal: 'Oldalak', abo: 'Új autó bérlés' },
        chips: ['BMW X5 bérlés', '7 személyes autó', 'Elektromos autó bérlés', 'SUV 600 ezer Ft/hó alatt', 'Eladó autók 15 millió alatt', 'Audi kombi', 'Mercedes GLC', 'Honosítás kalkulátor'],
        links: [['Bérelhető autók', '/autoink/#berelheto'], ['Készleten lévő autók', '/autoink/'], ['Új autó rendelés', '/egyedi-auto-rendeles/'], ['Autót keresek', '/autot-keresek/'], ['Honosítás kalkulátor', '/honositas-kalkulator/'], ['Kapcsolat', '/kapcsolat/']],
        fac: { berles: 'bérlés', vasarlas: 'vásárlás', keszlet: 'használt / készleten', rendeles: 'új, rendelésre', ev: 'elektromos', hybrid: 'hibrid', diesel: 'dízel', petrol: 'benzines', suv: 'SUV', kombi: 'kombi', limo: 'limuzin', cabrio: 'kabrió', coupe: 'kupé', van: 'kisbusz / egyterű', hatch: 'kompakt', awd: '4x4', cheap: 'legolcsóbb elöl', lux: 'prémium elöl', family: 'családi', blog: 'cikkek', calc: 'kalkulátor' } },
      en: { ph: 'Search cars, brands or anything… e.g. “7-seat SUV under 600k”', pop: 'Popular searches', rec: 'Recent searches', quick: 'Quick links', none: 'No results', noneTx: 'Try different words or ask us for a tailored offer — we can source any car.', relaxed: 'No exact match — these are closest to your request:', did: 'Did you mean:', more: 'More', und: 'We understood:', load: 'Loading…', err: 'Search is not available right now. Please try again later.', esc: 'close', nav: 'navigate', open: 'open', offer: 'Request an offer', contact: 'Contact', call: 'Call us', mail: 'Email us', ho: 'HUF/mo', netto: 'net', tol: ' from', seats: 'seats', km: 'km', le: 'hp', lit: 'l boot', awd: 'AWD', res: 'results',
        k: { berles: 'Cars for rent', keszlet: 'Cars for sale — in stock', rendeles: 'New cars to order', eszkoz: 'Calculators', blog: 'Articles', oldal: 'Pages', abo: 'New car subscription' },
        chips: ['BMW X5', 'Mercedes GLC', '7 seats', 'Electric', 'SUV', 'Audi estate'],
        links: [],
        fac: { berles: 'rental', vasarlas: 'buy', keszlet: 'used / in stock', rendeles: 'new, to order', ev: 'electric', hybrid: 'hybrid', diesel: 'diesel', petrol: 'petrol', suv: 'SUV', kombi: 'estate', limo: 'sedan', cabrio: 'convertible', coupe: 'coupé', van: 'van / MPV', hatch: 'hatchback', awd: 'AWD', cheap: 'cheapest first', lux: 'premium first', family: 'family', blog: 'articles', calc: 'calculator' } },
      de: { ph: 'Autos, Marken oder Themen suchen… z. B. „SUV 7 Sitze“', pop: 'Beliebte Suchen', rec: 'Letzte Suchen', quick: 'Schnellzugriff', none: 'Keine Treffer', noneTx: 'Versuchen Sie andere Begriffe oder fordern Sie ein individuelles Angebot an.', relaxed: 'Kein exakter Treffer — diese kommen Ihrer Anfrage am nächsten:', did: 'Meinten Sie:', more: 'Mehr', und: 'Verstanden:', load: 'Wird geladen…', err: 'Die Suche ist gerade nicht verfügbar.', esc: 'schließen', nav: 'navigieren', open: 'öffnen', offer: 'Angebot anfordern', contact: 'Kontakt', call: 'Anrufen', mail: 'E-Mail', ho: 'HUF/Monat', netto: 'netto', tol: ' ab', seats: 'Sitze', km: 'km', le: 'PS', lit: 'l Kofferraum', awd: 'Allrad', res: 'Treffer',
        k: { berles: 'Mietwagen', keszlet: 'Fahrzeuge auf Lager', rendeles: 'Neuwagen auf Bestellung', eszkoz: 'Rechner', blog: 'Artikel', oldal: 'Seiten', abo: 'Neuwagen-Abo' },
        chips: ['BMW X5', 'Mercedes GLC', '7 Sitze', 'Elektro', 'SUV', 'Audi Kombi'], links: [],
        fac: { berles: 'Miete', vasarlas: 'Kauf', keszlet: 'gebraucht / Lager', rendeles: 'neu, Bestellung', ev: 'Elektro', hybrid: 'Hybrid', diesel: 'Diesel', petrol: 'Benzin', suv: 'SUV', kombi: 'Kombi', limo: 'Limousine', cabrio: 'Cabrio', coupe: 'Coupé', van: 'Van', hatch: 'Kompakt', awd: 'Allrad', cheap: 'günstigste zuerst', lux: 'Premium zuerst', family: 'Familie', blog: 'Artikel', calc: 'Rechner' } }
    };
    var L = T[LANG] || T.en;
    var PH = { fr: 'Rechercher une voiture, une marque…', uk: 'Пошук авто, марки…', zh: '搜索车型、品牌…', sk: 'Hľadať auto, značku…', cs: 'Hledat auto, značku…' };
    if (!T[LANG] && PH[LANG]) L = Object.assign({}, T.en, { ph: PH[LANG] });

    // ---------- szövegkezelés ----------
    function norm(s) {
      return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/ß/g, 'ss').replace(/[^a-z0-9Ѐ-ӿ一-鿿]+/g, ' ').trim();
    }
    function toks(s) { var n = norm(s); return n ? n.split(' ') : []; }
    var CJK = /[一-鿿]/;
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    var STOP = new Set(('a az egy es vagy de is meg mi mit milyen melyik hogy hol mennyi mennyibe kerul nekem engem keresek keres kereses szeretnek szeretnem kellene kell legyen lenne mutass mutasd van vannak valami olyan ami amely minel nagyon csak ' +
      'auto autot autok autoja autos jarmu kocsi kocsit ' +
      'the an and or for with to of in on at i im want need looking look show me some any please car cars vehicle vehicles ' +
      'der die das den dem ein eine einen und oder mit fur zum zur ich suche bitte fahrzeug fahrzeuge wagen ' +
      'le la les un une des et pour avec voiture ' +
      'sorozat series serie reihe modell model as os es er ft forint huf automata automatic automatik automatavaltos valto nagy nagyobb big large').split(' '));
    var ALIAS = { merci: 'mercedes', mercy: 'mercedes', mb: 'mercedes', benz: 'mercedes', mercedesbenz: 'mercedes', vw: 'volkswagen', volksvagen: 'volkswagen', folkswagen: 'volkswagen', bmv: 'bmw', beemer: 'bmw', bimmer: 'bmw', skodat: 'skoda', hyundaj: 'hyundai', hjundai: 'hyundai', vovlo: 'volvo', porsch: 'porsche', rangerover: 'range', landrover: 'land', '3er': '3', '5er': '5', '7er': '7', '1er': '1', '2er': '2', '4er': '4' };
    // fogalmak: kulcsszó → [csoport, érték]
    var CON = {};
    function con(group, val, words) { words.split(' ').forEach(function (w) { if (w) CON[w] = [group, val]; }); }
    con('kind', 'berles', 'berauto berautot berautok autoberles autoberlest autoberlo autokolcsonzes kolcsonzes kolcsonozni berles berlest berlesre berlese berelni berelnek berelek berelhet berelheto berelhetok berelhetot berel berlet berletre berleti berbe berbeadas tartos tartosberlet havidij havidijas havidijjal rent rental rentals renting lease leasing miete mieten mietwagen location louer orenda prenajom najom pronajem abo elofizetes subscription');
    con('kind', 'vasarlas', 'vasarlas vasarolni vasarol vasarolnek venni vennek vesz veszek megvesz megvenni megvasarol megvasarolhato elado eladok buy buying purchase kaufen kauf acheter achat koupit kupit kupa');
    con('kind', 'keszlet', 'hasznalt hasznaltauto hasznaltautot bizomanyos bizomanyban keszlet keszleten keszletrol raktaron azonnal azonnali used preowned gebraucht gebrauchtwagen occasion ojazdene ojete');
    con('kind', 'rendeles', 'rendeles rendelesre rendelni rendelek megrendel konfiguralas konfiguracio uj ujauto ujautot new neu neuwagen neuf order bestellen');
    con('fuel', 'ev', 'elektromos elektromost villany villanyauto villanyautot ev bev electric elektro elektroauto electrique elektricky elektromobil etron eq ioniq');
    con('fuel', 'hybrid', 'hibrid hibridet hybrid phev plugin tolthetohibrid');
    con('fuel', 'diesel', 'dizel dizeles diesel tdi gazolaj');
    con('fuel', 'petrol', 'benzin benzines petrol gasoline benziner tsi tfsi');
    con('body', 'suv', 'suv suvt terepjaro terepjarot szabadido crossover offroad gelandewagen');
    con('body', 'kombi', 'kombi kombit touring avant variant estate wagon sportstourer tmodell shootingbrake break');
    con('body', 'limo', 'limuzin limuzint sedan szedan limousine berline');
    con('body', 'cabrio', 'kabrio kabriot cabrio cabriolet roadster nyitott convertible');
    con('body', 'coupe', 'kupe coupe');
    con('body', 'van', 'kisbusz kisbuszt minibusz van mpv egyteru egyterut busz multivan minivan');
    con('body', 'hatch', 'kompakt ferdehatu hatchback kisauto varosi');
    con('awd', '1', '4x4 4wd awd osszkerek osszkerekhajtas quattro xdrive 4matic 4motion allrad allradantrieb');
    con('sort', 'cheap', 'olcso olcsot olcsobb legolcsobb kedvezo megfizetheto budget cheap cheapest affordable gunstig billig');
    con('sort', 'lux', 'luxus luxusauto premium exkluziv luxury');
    con('family', '1', 'csalad csaladi csaladnak csalados gyerek gyerekes gyerekulles family familie kids');
    con('kind', 'blog', 'blog cikk cikkek hir hirek utmutato tippek guide article ratgeber');
    con('kind', 'eszkoz', 'kalkulator kalkulatort szamolo szamitas szamold calculator rechner');
    con('trunk', '1', 'csomagtarto csomagtartos csomagtartoval csomagter boot trunk kofferraum rakter');
    con('contact', '1', 'telefon telefonszam hivj hivas elerhetoseg email cim nyitvatartas kapcsolat kapcsolatfelvetel contact phone kontakt telefonnummer');
    // több szavas kifejezések előre összevonva
    var PHRASE = [[/\bplug in\b/g, 'plugin'], [/\be tron\b/g, 'etron'], [/\bt modell\b/g, 'tmodell'], [/\bshooting brake\b/g, 'shootingbrake'], [/\b4 x 4\b/g, '4x4'], [/\ball wheel drive\b/g, 'awd'], [/\bhasznalt auto\b/g, 'hasznalt'], [/\buj auto\b/g, 'uj'], [/\btartos berlet\b/g, 'tartosberlet'], [/\bhavi dij\w*/g, 'havidij'], [/\btoltheto hibrid\b/g, 'tolthetohibrid'], [/\bland rover\b/g, 'landrover'], [/\brange rover\b/g, 'rangerover'], [/\bmercedes benz\b/g, 'mercedes'], [/\bpre owned\b/g, 'preowned']];

    // ---------- index ----------
    var DATA = null, ITEMS = [], VOCAB = null, NP = false, loading = null;
    function facets(it) {
      var f = norm(it.f || '') + ' ' + norm(it.n || it.t);
      var fs = {};
      if (/elektrom|electric|\bbev\b|\bev\d?\b|etron|\beq[a-z]\b|ioniq|\bid \d|\bix\d?\b|tavascan|\bi[457]\b/.test(f) && !/phev|hibrid|hybrid/.test(norm(it.f || ''))) fs.ev = 1;
      if (/phev|hibrid|hybrid|plug/.test(f)) fs.hybrid = 1;
      if (/dizel|diesel/.test(f)) fs.diesel = 1;
      if (/benzin|gasoline|petrol/.test(f)) fs.petrol = 1;
      var b = norm(it.bt || '') + ' ' + norm(it.n || it.h || '');
      var bs = {};
      if (/suv|terep|offroad|crossover|\bx[1-7]\b|\bq[2-8]\b|\bgl[abcesk]\b|tiguan|touareg|tayron|t roc|t cross|taigo|\bxc\d0|tucson|santa fe|sportage|kodiaq|karoq|countryman|cayenne|macan|range|discovery|defender|velar|evoque|\bg klasse|\bg osztaly|tavascan|formentor|ateca|terramar/.test(b)) bs.suv = 1;
      if (/kombi|estate|touring|avant|variant|wagon|sportstourer|t modell|shooting/.test(b)) bs.kombi = 1;
      if (/limuz|sedan|limousine/.test(b)) bs.limo = 1;
      if (/cabrio|kabri|roadster|convertible/.test(b)) bs.cabrio = 1;
      if (/coupe|kupe/.test(b)) bs.coupe = 1;
      if (/\bvan\b|mpv|egyteru|kisbusz|busz|staria|multivan|tge|transporter|caravelle|v osztaly|v klasse|vle|touran|active tourer|grand tourer/.test(b)) bs.van = 1;
      if (/hatch|kompakt|ferdehatu|\bpolo\b|\bgolf\b|\bmini\b|\ba1\b|\ba3\b|\b1 es\b|a osztaly/.test(b)) bs.hatch = 1;
      return { fs: fs, bs: bs };
    }
    function prep(d) {
      DATA = d; NP = !!d.np;
      ITEMS = (d.items || []).map(function (it, i) {
        var fx = facets(it);
        var url = it.u || '/';
        if (DOM_PRE && url.indexOf(DOM_PRE + '/') === 0) url = url.slice(DOM_PRE.length);
        return {
          o: it, i: i, url: url, fs: fx.fs, bs: fx.bs,
          F: [ // [tokenek, súly]
            [toks((it.b || '') + ' ' + (it.n || '')), 6],
            [toks(it.t), 5],
            [toks(it.h || ''), 4],
            [toks(url.replace(/[-/]/g, ' ')), 2.2],
            [toks(it.d || ''), 1.8],
            [toks(it.x || ''), 1.1]
          ],
          full: norm([it.b, it.n, it.t, it.h, it.d, it.x].join(' '))
        };
      });
      VOCAB = new Set();
      ITEMS.forEach(function (I) { I.F[0][0].concat(I.F[1][0], I.F[2][0]).forEach(function (w) { if (w.length > 2 && !/^\d+$/.test(w)) VOCAB.add(w); }); });
    }
    function load() {
      if (DATA) return Promise.resolve(DATA);
      if (loading) return loading;
      loading = fetch(IDX, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { prep(d); return d; })
        .catch(function (e) { loading = null; throw e; });
      return loading;
    }

    // ---------- elírás-tűrés ----------
    function dl(a, b, max) { // Damerau–Levenshtein, korai kilépéssel
      var la = a.length, lb = b.length;
      if (Math.abs(la - lb) > max) return max + 1;
      var d = [], i, j;
      for (i = 0; i <= la; i++) { d[i] = [i]; }
      for (j = 0; j <= lb; j++) d[0][j] = j;
      for (i = 1; i <= la; i++) {
        var rowMin = 99;
        for (j = 1; j <= lb; j++) {
          var c = a[i - 1] === b[j - 1] ? 0 : 1;
          var v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
          d[i][j] = v; if (v < rowMin) rowMin = v;
        }
        if (rowMin > max) return max + 1;
      }
      return d[la][lb];
    }
    function tokScore(q, w) {
      if (q === w) return 1;
      var num = /^\d/.test(q);
      if (w.length > q.length && w.indexOf(q) === 0 && (q.length >= 2 || num)) return num ? 0.7 : 0.85; // beírás közben
      if (num) return 0;
      if (q.length > w.length && w.length >= 4 && q.indexOf(w) === 0 && w.length / q.length >= 0.6) return 0.8; // ragozás: „bérlést” ~ „bérlés”
      if (q.length >= 4 && w.length >= 3) {
        var mx = q.length >= 8 ? 2 : 1;
        if (dl(q, w, mx) <= mx) return 0.62;
      }
      return 0;
    }
    function matchItem(I, q) {
      if (CJK.test(q)) return I.full.indexOf(q) >= 0 ? 3 : 0;
      var best = 0;
      for (var f = 0; f < I.F.length; f++) {
        var arr = I.F[f][0], wgt = I.F[f][1];
        if (best >= wgt) break; // a súlyok csökkenő sorrendben vannak
        for (var k = 0; k < arr.length; k++) {
          var s = tokScore(q, arr[k]);
          if (s) { s *= wgt; if (s > best) best = s; if (s === wgt) break; }
        }
      }
      return best;
    }
    function correct(q) {
      if (!VOCAB || VOCAB.has(q) || q.length < 4 || /\d/.test(q)) return null;
      var it = VOCAB.values(), v, best = null, bd = 9;
      while (!(v = it.next()).done) {
        var w = v.value;
        if (w.indexOf(q) === 0) return null; // beírás közben van — nincs javítás
        var mx = q.length >= 8 ? 2 : 1;
        var dd = dl(q, w, mx);
        if (dd <= mx && dd < bd) { bd = dd; best = w; }
      }
      return best;
    }

    // ---------- kérés értelmezése ----------
    var EUR = 390;
    function parse(raw) {
      var r0 = String(raw || '').replace(/(\d)[., \u00a0](?=\d{3}(?!\d))/g, '$1').replace(/(\d)[.,](\d)/g, '$1p$2');
      var q = ' ' + norm(r0) + ' ';
      PHRASE.forEach(function (p) { q = q.replace(p[0], p[1]); });
      q = q.replace(/(\d)\s+(?=\d{3}\b)/g, '$1'); // „500 000” → „500000”
      var t = q.trim().split(/\s+/).filter(Boolean);
      var P = { T: [], kinds: {}, fuel: {}, body: {}, used: {} };
      var MAXW = /^(alatt|ig|max|maximum|maximalis|legfeljebb|under|below|unter|bis|upto|kevesebb|olcsobb|cheaper|less|alatti|belul|elott|elotti|regebbi|before|older|vor)$/;
      var MINW = /^(felett|folott|feletti|tol|min|minimum|legalabb|over|above|ab|uber|tobb|more|from|plusz|plus|utan|utani|ota|ujabb|newer|after|nach|since|seit)$/;
      function ctx(i) { // a szám körüli szavak: max / min?
        var a = [t[i - 1], t[i - 2], t[i + 1], t[i + 2], t[i + 3], t[i + 4]];
        for (var k = 0; k < a.length; k++) { if (!a[k]) continue; if (MAXW.test(a[k])) return 'max'; if (MINW.test(a[k])) return 'min'; }
        return '';
      }
      for (var i = 0; i < t.length; i++) {
        var w = t[i];
        var m = w.match(/^(\d+(?:p\d+)?)([a-z]*)$/);
        if (m) {
          var n = parseFloat(m[1].replace('p', '.')), suf = m[2], nx = t[i + 1] || '', unit = suf || nx, used = suf ? 0 : 1;
          var mult = 0;
          if (/^(e|ezer|ezres|ezret|ezerig|k|eft|tsd|tausend|thousand)$/.test(unit)) mult = 1e3;
          else if (/^(m|mio|millio|milliot|millios|millioig|mft|million|millionen|milli)$/.test(unit)) mult = 1e6;
          else if (/^(ft|forint|forintig|forintos|huf)$/.test(unit)) mult = 1;
          else if (/^(eur|euro|euros)$/.test(unit)) mult = EUR;
          var c = ctx(i);
          if (/ig$|alatt/.test(unit)) c = c || 'max';
          if (mult) {
            var v = n * mult;
            if (mult === 1e3 && /^(ft|forint\w*|huf)$/.test(t[i + 2] || '')) { P.used[i + 2] = 1; }
            if (c === 'min') P.pmin = v; else P.pmax = v;
            P.used[i] = 1; if (used) P.used[i + 1] = 1;
            for (var j = i + 1; j <= i + 3; j++) if (/^(ho|havi|havonta|honap|month|monthly|monat|mo|monatlich)$/.test(t[j] || '')) { P.kinds.berles = 1; P.used[j] = 1; }
            continue;
          }
          if (/^(szemelyes|szemelyest|szemelyre|ules|uleses|ulest|ulo|fo|fos|fore|seats|seat|seater|sitzer|sitze|places|miest|mist|mistny)$/.test(unit)) { P.seats = n; P.used[i] = 1; if (used) P.used[i + 1] = 1; continue; }
          if (/^(gyerekules\w*|gyerekulo\w*|isofix\w*|childseats?|kindersitze?)$/.test(unit)) { P.child = n; P.family = '1'; P.used[i] = 1; if (used) P.used[i + 1] = 1; continue; }
          if (/^km$/.test(unit)) { P.kmmax = (/^(e|ezer)$/.test(t[i - 1] || '') ? n : n); P.used[i] = 1; if (used) P.used[i + 1] = 1; continue; }
          if (/^(le|ps|hp|loero|lovero)$/.test(unit)) { if (c === 'max') P.kwmax = n * 0.7355; else P.kwmin = n * 0.7355; P.used[i] = 1; if (used) P.used[i + 1] = 1; continue; }
          if (/^kw$/.test(unit)) { if (c === 'max') P.kwmax = n; else P.kwmin = n; P.used[i] = 1; if (used) P.used[i + 1] = 1; continue; }
          if (!suf && n >= 1990 && n <= 2035) { if (c === 'max') P.ymax = n; else P.ymin = n; P.used[i] = 1; continue; }
          if (!suf && n >= 10000) { if (c === 'min') P.pmin = n; else P.pmax = n; P.used[i] = 1; continue; }
          if (/^(es|as|os|er)$/.test(suf) || /^(es|as|os|er)$/.test(nx)) { P.T.push(m[1]); P.used[i] = 1; if (!suf) P.used[i + 1] = 1; continue; }
        }
        if (P.used[i]) continue;
        if (MAXW.test(w) || MINW.test(w) || /^(ho|havi|havonta|ezer|millio|ft|forint)$/.test(w)) continue;
        var a = ALIAS[w] || w;
        var cc = CON[a];
        if (cc) {
          var g = cc[0], val = cc[1];
          if (g === 'kind') P.kinds[val] = 1; else if (g === 'fuel') P.fuel[val] = 1; else if (g === 'body') P.body[val] = 1; else P[g] = val;
          // a márka-/típusnévként is értelmes fogalmakat szövegként is megtartjuk (pl. „avant”, „touring”, „quattro”)
          if (/^(avant|touring|variant|sportstourer|quattro|xdrive|4matic|4motion|etron|ioniq|cabrio|cabriolet|coupe|roadster|multivan)$/.test(a)) P.T.push(a);
          continue;
        }
        if (STOP.has(a) || a.length < 2 && !/\d/.test(a)) continue;
        P.T.push(a);
      }
      // bérlés + vásárlás együtt nem kizáró; „új autó bérlés” → bérlés
      if (P.kinds.berles) { delete P.kinds.rendeles; delete P.kinds.vasarlas; }
      if (P.kinds.vasarlas) { delete P.kinds.vasarlas; if (!P.kinds.keszlet && !P.kinds.rendeles) { P.kinds.keszlet = 1; P.kinds.rendeles = 1; } }
      return P;
    }
    function hasCarFacet(P) {
      return Object.keys(P.fuel).length || Object.keys(P.body).length || P.seats || P.pmax || P.pmin || P.kmmax || P.kwmin || P.kwmax || P.ymin || P.ymax || P.awd || P.family || P.trunk || P.child;
    }

    // ---------- keresés ----------
    var KBOOST = { berles: 1.12, keszlet: 1.1, rendeles: 1.0, eszkoz: 1.06, blog: 0.88, oldal: 0.92 };
    var CARK = { berles: 1, keszlet: 1, rendeles: 1 };
    function filterOK(I, P, drop) {
      var o = I.o, car = CARK[o.k];
      var kinds = Object.keys(P.kinds);
      if (kinds.length && !drop.kind && kinds.indexOf(o.k) < 0) return false;
      if (hasCarFacet(P) && !car) return false;
      var fuel = Object.keys(P.fuel);
      if (fuel.length && !drop.fuel && !fuel.some(function (f) { return I.fs[f]; })) return false;
      var body = Object.keys(P.body);
      if (body.length && !drop.body && !body.some(function (b) { return I.bs[b]; })) return false;
      if (P.seats && !drop.seats) { var s = Math.max(o.s || 0, o.so || 0) || (I.bs.van ? 7 : 0); if (!s || s < P.seats) return false; }
      if (!NP && !drop.price) {
        if (P.pmax && (!o.p || o.p > P.pmax)) return false;
        if (P.pmin && (!o.p || o.p < P.pmin)) return false;
      }
      if (P.kmmax && !drop.km && o.km != null && o.km > P.kmmax) return false;
      if (P.kwmin && !drop.kw && (!o.kw || o.kw < P.kwmin * 0.97)) return false;
      if (P.kwmax && !drop.kw && (!o.kw || o.kw > P.kwmax * 1.03)) return false;
      if (P.ymin && !drop.year && (!o.y || o.y < P.ymin)) return false;
      if (P.ymax && !drop.year && (!o.y || o.y > P.ymax)) return false;
      if (P.awd && !drop.awd && !o.aw) return false;
      if (P.child >= 3 && !drop.seats && !(o.th || o.iso >= 3)) return false;
      return true;
    }
    function score(I, P) {
      var o = I.o, sc = 1, hit = 0, n = P.T.length;
      if (n) {
        var sum = 0;
        for (var i = 0; i < n; i++) { var s = matchItem(I, P.T[i]); if (s) { hit++; sum += s; } }
        var need = n <= 2 ? n : Math.ceil(n * 0.6);
        if (hit < need) return 0;
        sc = (sum / n) * (hit === n ? 1.25 : 1);
        // teljes kifejezés egyezés a névben/címben
        var phrase = P.T.join(' ');
        if (n > 1 && (norm(o.n || '').indexOf(phrase) >= 0 || norm(o.t).indexOf(phrase) >= 0)) sc *= 1.35;
      }
      sc *= KBOOST[o.k] || 1;
      if (o.k === 'berles' && o.sub === 'abo') sc *= 0.94;
      if (P.family && CARK[o.k]) { var s2 = Math.max(o.s || 0, o.so || 0); if (s2 >= 7) sc *= 1.25; if (o.iso >= 3 || o.th) sc *= 1.15; if (I.bs.suv || I.bs.kombi || I.bs.van) sc *= 1.12; }
      if (P.sort === 'lux' && o.p) sc *= 1 + Math.min(o.p, 4e7) / 1e8;
      if (P.trunk && CARK[o.k]) sc *= o.tr ? 1 + o.tr / 900 : 0.85;
      return sc;
    }
    function search(raw) {
      var P = parse(raw);
      var out = [], relaxed = false;
      var order = [{}, { price: 1 }, { price: 1, seats: 1 }, { price: 1, seats: 1, body: 1, km: 1, kw: 1, year: 1 }, { price: 1, seats: 1, body: 1, km: 1, kw: 1, year: 1, fuel: 1, awd: 1 }, { price: 1, seats: 1, body: 1, km: 1, kw: 1, year: 1, fuel: 1, awd: 1, kind: 1 }];
      var anything = P.T.length || Object.keys(P.kinds).length || hasCarFacet(P) || P.sort || P.contact;
      if (!anything) return { P: P, list: [], relaxed: false };
      if (P.contact && !P.T.length && !Object.keys(P.kinds).length && !hasCarFacet(P)) {
        return { P: P, list: ITEMS.filter(function (I) { return /\/(kapcsolat|contact)\//.test(I.url); }), relaxed: false };
      }
      for (var r = 0; r < order.length; r++) {
        out = [];
        for (var i = 0; i < ITEMS.length; i++) {
          var I = ITEMS[i];
          if (!filterOK(I, P, order[r])) continue;
          var s = score(I, P);
          if (s > 0) out.push([s, I]);
        }
        if (out.length || !(Object.keys(P.kinds).length || hasCarFacet(P))) break;
        relaxed = true;
      }
      out.sort(function (a, b) { return b[0] - a[0]; });
      if (P.sort === 'cheap' && !NP) {
        var top = out.length ? out[0][0] : 0;
        var good = out.filter(function (x) { return x[0] >= top * 0.45 && x[1].o.p; });
        var rest = out.filter(function (x) { return good.indexOf(x) < 0; });
        good.sort(function (a, b) { return (a[1].o.k === b[1].o.k ? 0 : 0) || a[1].o.p - b[1].o.p; });
        out = good.concat(rest);
      }
      // korrekció-javaslat — csak ha kevés a találat, és a javított kérés tényleg talál valamit
      var fix = null;
      if (P.T.length && out.length < 3 && !search._inner) {
        var changed = false, fixed = P.T.map(function (w) { var c = correct(w); if (c && c !== w) { changed = true; return c; } return w; });
        if (changed) {
          var cand = fixed.join(' ');
          search._inner = 1;
          try { if (search(cand).list.length > out.length) fix = cand; } finally { search._inner = 0; }
        }
      }
      return { P: P, list: out.map(function (x) { return x[1]; }), relaxed: relaxed && out.length > 0, fix: fix };
    }

    // ---------- megjelenítés ----------
    function fmt(n) { try { return Math.round(n).toLocaleString('hu-HU').replace(/ /g, ' '); } catch (e) { return String(Math.round(n)); } }
    function priceTxt(o) {
      if (NP || !o.p) return '';
      if (o.k === 'berles') return L.netto + ' ' + fmt(o.p) + ' ' + L.ho;
      if (o.k === 'rendeles') return o.ep ? L.netto + ' ' + fmt(o.ep) + ' €' + L.tol : L.netto + ' ' + (o.p / 1e6).toFixed(1).replace('.', ',') + ' M Ft' + L.tol;
      return fmt(o.p) + ' Ft';
    }
    function fuelTxt(o) { var f = String(o.f || '').split(',')[0].trim(); return f.length < 22 ? f : ''; }
    function metaTxt(o) {
      var a = [];
      if (o.k === 'keszlet') { if (o.y) a.push(o.y); if (o.km != null) a.push(fmt(o.km) + ' ' + L.km); if (o.kw) a.push(Math.round(o.kw / 0.7355) + ' ' + L.le); a.push(fuelTxt(o)); }
      else if (CARK[o.k]) { if (o.bt) a.push(o.bt); a.push(fuelTxt(o)); var s = Math.max(o.s || 0, o.so || 0); if (s) a.push((o.so > o.s ? o.s + '–' + o.so : s) + ' ' + L.seats); if (o.tr) a.push(o.tr + ' ' + L.lit); if (o.aw) a.push(L.awd); }
      return a.filter(Boolean).join(' · ');
    }
    function hl(text, P) {
      var words = String(text || '').split(/(\s+)/);
      var q = P.T.filter(function (w) { return w.length >= 2; });
      if (!q.length) return esc(text);
      return words.map(function (w) {
        var n = norm(w);
        if (n && q.some(function (t) { return n.indexOf(t) === 0 || (t.length >= 4 && t.indexOf(n) === 0 && n.length >= 3); })) return '<mark>' + esc(w) + '</mark>';
        return esc(w);
      }).join('');
    }
    var ICON = {
      berles: '<svg viewBox="0 0 24 24"><path d="M5 16l1.5-5.2A2 2 0 0 1 8.4 9.4h7.2a2 2 0 0 1 1.9 1.4L19 16M4 16h16v3H4zM7 19v1.5M17 19v1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      blog: '<svg viewBox="0 0 24 24"><path d="M6 4h9l3 3v13H6zM9 10h6M9 13.5h6M9 17h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      eszkoz: '<svg viewBox="0 0 24 24"><rect x="6" y="3.5" width="12" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 7.5h6M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      oldal: '<svg viewBox="0 0 24 24"><path d="M5 5h14v14H5zM5 9h14" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>'
    };
    ICON.keszlet = ICON.rendeles = ICON.berles;
    function card(I, P, idx) {
      var o = I.o, car = CARK[o.k];
      var name = car ? (o.k === 'keszlet' ? (o.h || o.n || o.t) : (o.n || o.h || o.t)) : o.t;
      var img = o.i ? '<img src="' + esc(o.i) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '';
      var sub = car ? metaTxt(o) : (o.d || '');
      var pr = priceTxt(o);
      var tag = o.k === 'berles' && o.sub === 'abo' ? '<span class="cs-tag">' + esc(L.k.abo) + '</span>' : '';
      return '<a class="cs-r' + (car ? ' cs-car' : '') + '" href="' + esc(I.url) + '" data-n="' + idx + '" role="option" id="cs-o' + idx + '">' +
        '<span class="cs-img' + (o.cf ? ' cs-fit' : '') + '">' + img + '<i>' + (ICON[o.k] || ICON.oldal) + '</i></span>' +
        '<span class="cs-tx"><span class="cs-t">' + hl(name, P) + tag + '</span><span class="cs-m">' + hl(sub, P) + '</span></span>' +
        (pr ? '<span class="cs-p">' + esc(pr) + '</span>' : '') + '</a>';
    }

    // ---------- felület ----------
    var root, inp, body, chipsEl, opened = false, sel = -1, flat = [], lastQ = '', expanded = {};
    var KEY = 'ca_srch_recent';
    function recent() { try { return JSON.parse(localStorage.getItem(KEY) || '[]').slice(0, 6); } catch (e) { return []; } }
    function remember(q) { q = String(q || '').trim(); if (q.length < 2) return; try { var r = recent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); }); r.unshift(q); localStorage.setItem(KEY, JSON.stringify(r.slice(0, 6))); } catch (e) { /* privát mód */ } }

    function build() {
      root = document.createElement('div');
      root.className = 'cs-ov'; root.setAttribute('hidden', '');
      root.innerHTML = '<div class="cs-bd" data-close></div>' +
        '<div class="cs-pn" role="dialog" aria-modal="true" aria-label="' + esc(B0.getAttribute('aria-label') || 'Search') + '">' +
        '<div class="cs-in"><svg viewBox="0 0 24 24" class="cs-ico" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
        '<input type="search" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-autocomplete="list" aria-controls="cs-body" placeholder="' + esc(L.ph) + '">' +
        '<button class="cs-x" type="button" data-close aria-label="' + esc(L.esc) + '"><span>Esc</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
        '<div class="cs-chips" hidden></div>' +
        '<div class="cs-body" id="cs-body" role="listbox"></div>' +
        '<div class="cs-ft"><span><kbd>↑</kbd><kbd>↓</kbd> ' + esc(L.nav) + '</span><span><kbd>↵</kbd> ' + esc(L.open) + '</span><span><kbd>Esc</kbd> ' + esc(L.esc) + '</span></div></div>';
      document.body.appendChild(root);
      inp = root.querySelector('input'); body = root.querySelector('.cs-body'); chipsEl = root.querySelector('.cs-chips');
      root.addEventListener('click', function (e) {
        var c = e.target.closest('[data-close]'); if (c) { close(); return; }
        var q = e.target.closest('[data-q]'); if (q) { e.preventDefault(); inp.value = q.getAttribute('data-q'); run(); inp.focus(); return; }
        var mo = e.target.closest('[data-more]'); if (mo) { e.preventDefault(); expanded[mo.getAttribute('data-more')] = 1; run(true); return; }
        var rm = e.target.closest('[data-rm]'); if (rm) { e.preventDefault(); inp.value = rm.getAttribute('data-rm'); run(); inp.focus(); return; }
        var a = e.target.closest('a.cs-r'); if (a) remember(inp.value);
      });
      var tmr;
      inp.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(run, 70); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          var t = flat[sel >= 0 ? sel : 0];
          if (t) { remember(inp.value); location.href = t.getAttribute('href'); }
        }
      });
    }
    function move(d) {
      if (!flat.length) return;
      sel = (sel + d + flat.length) % flat.length;
      flat.forEach(function (el, i) { el.classList.toggle('on', i === sel); });
      flat[sel].scrollIntoView({ block: 'nearest' });
      inp.setAttribute('aria-activedescendant', flat[sel].id || '');
    }
    function home() {
      var h = '';
      var r = recent();
      if (r.length) h += '<div class="cs-sec"><div class="cs-h">' + esc(L.rec) + '</div><div class="cs-cl">' + r.map(function (x) { return '<button type="button" class="cs-c cs-c-r" data-q="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div></div>';
      h += '<div class="cs-sec"><div class="cs-h">' + esc(L.pop) + '</div><div class="cs-cl">' + L.chips.map(function (x) { return '<button type="button" class="cs-c" data-q="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div></div>';
      if (L.links && L.links.length) h += '<div class="cs-sec"><div class="cs-h">' + esc(L.quick) + '</div><div class="cs-ql">' + L.links.map(function (x, i) { return '<a class="cs-r cs-q" href="' + esc(DOM_PRE ? x[1] : x[1]) + '" data-n="' + i + '" id="cs-o' + i + '"><span class="cs-tx"><span class="cs-t">' + esc(x[0]) + '</span></span><span class="cs-arr">→</span></a>'; }).join('') + '</div></div>';
      body.innerHTML = h; chipsEl.hidden = true;
      flat = [].slice.call(body.querySelectorAll('a.cs-r')); sel = -1;
    }
    function facetChips(P, raw) {
      var c = [];
      Object.keys(P.kinds).forEach(function (k) { c.push(L.fac[k] || L.k[k] || k); });
      Object.keys(P.fuel).forEach(function (k) { c.push(L.fac[k]); });
      Object.keys(P.body).forEach(function (k) { c.push(L.fac[k]); });
      if (P.seats) c.push(P.seats + '+ ' + L.seats);
      if (!NP && P.pmax) c.push('≤ ' + fmt(P.pmax) + ' Ft');
      if (!NP && P.pmin) c.push('≥ ' + fmt(P.pmin) + ' Ft');
      if (P.kmmax) c.push('≤ ' + fmt(P.kmmax) + ' km');
      if (P.kwmin) c.push('≥ ' + Math.round(P.kwmin / 0.7355) + ' ' + L.le);
      if (P.kwmax) c.push('≤ ' + Math.round(P.kwmax / 0.7355) + ' ' + L.le);
      if (P.ymin) c.push(P.ymin + '–');
      if (P.ymax) c.push('–' + P.ymax);
      if (P.awd) c.push(L.fac.awd);
      if (P.family) c.push(L.fac.family);
      if (P.child) c.push(P.child + '× ' + (LANG === 'hu' ? 'gyerekülés' : 'child seat'));
      if (P.trunk) c.push(LANG === 'hu' ? 'nagy csomagtartó' : LANG === 'de' ? 'großer Kofferraum' : 'big boot');
      if (P.sort) c.push(L.fac[P.sort]);
      return c.filter(Boolean);
    }
    function run(keep) {
      var raw = inp.value;
      if (!keep) expanded = {};
      lastQ = raw;
      if (!raw.trim()) { home(); return; }
      if (!DATA) {
        body.innerHTML = '<div class="cs-msg">' + esc(L.load) + '</div>';
        load().then(function () { if (inp.value === raw) run(keep); }, function () { body.innerHTML = '<div class="cs-msg">' + esc(L.err) + '</div>'; });
        return;
      }
      EUR = DATA.eur || EUR;
      var R = search(raw), P = R.P, h = '';
      var fc = facetChips(P, raw);
      if (fc.length) { chipsEl.innerHTML = '<span class="cs-und">' + esc(L.und) + '</span>' + fc.map(function (x) { return '<span class="cs-f">' + esc(x) + '</span>'; }).join(''); chipsEl.hidden = false; }
      else { chipsEl.hidden = true; chipsEl.innerHTML = ''; }
      if (P.contact && DATA.c && (DATA.c.tel || DATA.c.mail)) {
        var c = DATA.c;
        h += '<div class="cs-ans">' + (c.tel ? '<a class="cs-r cs-a" href="tel:' + esc(c.tel) + '" data-n="0" id="cs-oa1"><span class="cs-img"><i>☎</i></span><span class="cs-tx"><span class="cs-t">' + esc(L.call) + '</span><span class="cs-m">' + esc(c.tel.replace(/^\+36(\d{2})(\d{3})(\d{4})$/, '+36 $1 $2 $3')) + '</span></span></a>' : '') +
          (c.mail ? '<a class="cs-r cs-a" href="mailto:' + esc(c.mail) + '" id="cs-oa2"><span class="cs-img"><i>✉</i></span><span class="cs-tx"><span class="cs-t">' + esc(L.mail) + '</span><span class="cs-m">' + esc(c.mail) + '</span></span></a>' : '') + '</div>';
      }
      if (R.fix && R.fix !== P.T.join(' ')) h += '<div class="cs-did">' + esc(L.did) + ' <a href="#" data-q="' + esc(R.fix) + '">' + esc(R.fix) + '</a></div>';
      if (!R.list.length && P.contact) { /* csak elérhetőséget kért — elég a válaszkártya */ }
      else if (!R.list.length) {
        h += '<div class="cs-none"><b>' + esc(L.none) + '</b><p>' + esc(L.noneTx) + '</p><div class="cs-cl">' +
          (LANG === 'hu' ? '<a class="cs-btn" href="/autot-keresek/">' + esc(L.offer) + '</a>' : '') +
          '<a class="cs-btn cs-btn2" href="' + (LANG === 'hu' || DOM_PRE ? '/kapcsolat/' : '/' + LANG + '/contact/') + '">' + esc(L.contact) + '</a></div></div>';
      } else {
        if (R.relaxed) h += '<div class="cs-did">' + esc(L.relaxed) + '</div>';
        // csoportosítás típus szerint, a csoport legjobb találata szerinti sorrendben
        var groups = [], gi = {};
        R.list.forEach(function (I) { var k = I.o.k; if (!(k in gi)) { gi[k] = groups.length; groups.push([k, []]); } groups[gi[k]][1].push(I); });
        var n = 0, LIM = groups.length === 1 ? 12 : 5;
        groups.forEach(function (g) {
          var k = g[0], arr = g[1], show = expanded[k] ? arr.length : Math.min(arr.length, LIM);
          h += '<div class="cs-sec"><div class="cs-h">' + esc(L.k[k] || k) + ' <span>' + arr.length + '</span></div>';
          for (var i = 0; i < show; i++) h += card(arr[i], P, n++);
          if (arr.length > show) h += '<button type="button" class="cs-more" data-more="' + k + '">' + esc(L.more) + ' (+' + (arr.length - show) + ')</button>';
          h += '</div>';
        });
      }
      body.innerHTML = h;
      flat = [].slice.call(body.querySelectorAll('a.cs-r'));
      sel = -1;
      if (!keep) body.scrollTop = 0;
    }
    function open(q) {
      if (!root) build();
      if (opened) { inp.focus(); return; }
      opened = true;
      root.hidden = false;
      document.documentElement.classList.add('cs-lock');
      requestAnimationFrame(function () { root.classList.add('cs-show'); });
      if (q) inp.value = q;
      run();
      setTimeout(function () { inp.focus(); inp.select(); }, 30);
      load().catch(function () { /* hibaüzenet a run-ban */ });
    }
    function close() {
      if (!opened) return;
      opened = false;
      root.classList.remove('cs-show');
      document.documentElement.classList.remove('cs-lock');
      setTimeout(function () { if (!opened) root.hidden = true; }, 160);
    }
    [].forEach.call(BTNS, function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
      b.addEventListener('mouseenter', function () { load().catch(function () {}); }, { once: true });
      b.addEventListener('focus', function () { load().catch(function () {}); }, { once: true });
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); opened ? close() : open(); return; }
      if (e.key === 'Escape' && opened) { e.preventDefault(); close(); return; }
      if (e.key === '/' && !opened) {
        var t = e.target, tag = (t && t.tagName) || '';
        if (!/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && !(t && t.isContentEditable)) { e.preventDefault(); open(); }
      }
    });
    // ?kereses=… paraméterrel nyitva érkezik (megosztható keresés)
    try { var qp = new URLSearchParams(location.search).get('kereses'); if (qp) open(qp); } catch (e) { /* régi böngésző */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
