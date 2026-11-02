/* CarAdvance – Choice equipment -> public/abo-feat-<lang>.json builder
 * Needs CADV_SYNC.norm (tools/choice-sync.js). Pure function, browser or Node.
 *   CADV_EQUIP({items, eqByPair, files, extra, today}) -> {files, changed, missing, stats}
 * items   : Items[] of the fleetshop /v1/mobilityOffer/grouped response
 * eqByPair: { "<RentalObjectIdent>|<OfferIdent>": [German equipment strings] }  (from /v1/mobilityOffer/<ro>/<off>)
 * files   : current public/abo-feat-<lang>.json objects { de:{}, hu:{}, en:{}, sk:{}, cs:{}, pl:{}, fr:{}, uk:{}, zh:{} }
 * extra   : { "<German item>": { hu:"..", en:"..", ... } } translations for items not yet in the dictionary
 * missing : German items still without translation (translate them, pass as extra, call again)
 * Per (model, trim) the longest equipment list among that trim's offers is used (ties: lexicographic);
 * if the offers' lists differ, a one-line "may vary" note is appended. The German->language dictionary is
 * rebuilt from the published files (items line up by position), so no separate dictionary file is needed.
 */
var CADV_EQUIP = (function () {
  'use strict';
  var LANGS = ['de', 'hu', 'en', 'sk', 'cs', 'pl', 'fr', 'uk', 'zh'];
  var NOTE = {
    hu: 'A felszereltség járművenként kissé eltérhet; a pontos specifikációt az ajánlatban véglegesítjük.',
    de: 'Die Ausstattung kann je Fahrzeug leicht abweichen; die genaue Spezifikation wird im Angebot bestätigt.',
    en: 'Equipment may vary slightly by vehicle; the exact specification is confirmed in your offer.',
    sk: 'Výbava sa môže líšiť podľa vozidla; presná špecifikácia bude potvrdená v ponuke.',
    cs: 'Výbava se může u jednotlivých vozidel mírně lišit; přesná specifikace bude potvrzena v nabídce.',
    pl: 'Wyposażenie może się nieznacznie różnić w zależności od pojazdu; dokładna specyfikacja zostanie potwierdzona w ofercie.',
    fr: "L'équipement peut varier légèrement selon le véhicule ; la spécification exacte est confirmée dans votre offre.",
    uk: 'Комплектація може дещо відрізнятися залежно від автомобіля; точна специфікація підтверджується в пропозиції.',
    zh: '各车辆配置可能略有差异，具体规格以报价为准。'
  };
  function split(s, lang) {
    var a = String(s || '').split(' • ').map(function (x) { return x.trim(); }).filter(Boolean);
    if (a.length && a[a.length - 1] === NOTE[lang]) a.pop();
    return a;
  }
  function build(o) {
    var norm = CADV_SYNC.norm, files = o.files || {}, extra = o.extra || {}, eqByPair = o.eqByPair || {};
    var dict = {};
    Object.keys(files.de || {}).forEach(function (k) {
      Object.keys(files.de[k]).forEach(function (t) {
        var d = split(files.de[k][t], 'de');
        LANGS.forEach(function (l) {
          if (l === 'de') return;
          var tr = files[l] && files[l][k] && files[l][k][t];
          if (tr == null) return;
          var a = split(tr, l);
          if (a.length !== d.length) return;
          d.forEach(function (g, i) { (dict[g] = dict[g] || {})[l] = a[i]; });
        });
      });
    });
    Object.keys(extra).forEach(function (g) { dict[g] = Object.assign(dict[g] || {}, extra[g]); });
    var cand = {};
    (o.items || []).forEach(function (it) {
      var r = norm(it, o.today || '2000-01-01', {});
      (it.Locations || []).forEach(function (loc) {
        var id = loc && loc.ident, lst = id && eqByPair[id.Item1 + '|' + id.Item2];
        if (!lst || !lst.length) return;
        var c = (cand[r.key + '\u0001' + r.trim] = cand[r.key + '\u0001' + r.trim] || { key: r.key, trim: r.trim, lists: {} });
        c.lists[lst.join('\u0002')] = lst;
      });
    });
    var out = {}, changed = {}, missing = {}, stats = { trims: 0, ambiguous: 0, updated: 0 };
    LANGS.forEach(function (l) { out[l] = JSON.parse(JSON.stringify(files[l] || {})); });
    Object.keys(cand).forEach(function (ck) {
      var c = cand[ck], lists = Object.keys(c.lists).map(function (k) { return c.lists[k]; });
      var best = lists.reduce(function (a, b) { return (b.length > a.length || (b.length === a.length && b.join('\u0002') > a.join('\u0002'))) ? b : a; });
      var amb = lists.length > 1; stats.trims++; if (amb) stats.ambiguous++;
      best.forEach(function (g) { if (!dict[g] || LANGS.some(function (l) { return l !== 'de' && !dict[g][l]; })) missing[g] = 1; });
      LANGS.forEach(function (l) {
        var items = best.map(function (g) { return l === 'de' ? g : (dict[g] && dict[g][l]); });
        if (items.some(function (x) { return !x; })) return;
        var s = items.join(' • ') + (amb ? ' • ' + NOTE[l] : '');
        out[l][c.key] = out[l][c.key] || {};
        if (out[l][c.key][c.trim] !== s) { out[l][c.key][c.trim] = s; changed[l] = 1; stats.updated++; }
      });
    });
    return { files: out, changed: Object.keys(changed), missing: Object.keys(missing), stats: stats };
  }
  return build;
})();
if (typeof module !== 'undefined') module.exports = CADV_EQUIP;
