/**
 * i18n-templates.mjs — autónként változó (Sheetből generált) mondatok fordítása mintákkal (2026-10)
 * A /auto/<slug>/ oldalak címe, leírása, morzsamenüje stb. minden autónál más — ezeket nem
 * szótárból, hanem mintákból fordítjuk; a típusnév, évjárat, km, ár változatlanul átkerül.
 */
const W = {
  en: { sale: '$1 for sale · $2 · $3 km | CarAdvance', sold: 'Sold: $1 · $2 · $3 km | CarAdvance',
        saleD: '$1 for sale, $2, $3 km, $4 hp, $5, $6. Price $7 Ft. German import with verified history from CarAdvance.',
        soldD: 'Sold: $1, $2, $3 km, $4 hp, $5, $6. Looking for something similar? See our current stock.',
        desc: (n, y, km, f, b, p, u, g, d) => `${n}${y ? ' — year ' + y : ''}, ${km ? km + ' driven, ' : ''}${f}, ${b}. ${p} ${u === 'LE' ? 'hp' : u}, ${g}, ${d}. Net price (excl. VAT) with warranty, imported by CarAdvance.` },
  de: { sale: '$1 kaufen · $2 · $3 km | CarAdvance', sold: 'Verkauft: $1 · $2 · $3 km | CarAdvance',
        saleD: '$1 zu verkaufen, $2, $3 km, $4 PS, $5, $6. Preis $7 Ft. Deutscher Import mit geprüfter Historie von CarAdvance.',
        soldD: 'Verkauft: $1, $2, $3 km, $4 PS, $5, $6. Suchen Sie etwas Ähnliches? Sehen Sie sich unseren aktuellen Bestand an.',
        desc: (n, y, km, f, b, p, u, g, d) => `${n}${y ? ', Baujahr ' + y : ''}, ${km ? km + ' gelaufen, ' : ''}${f}, ${b}. ${p} ${u === 'LE' ? 'PS' : u}, ${g}, ${d}. Nettopreis (ohne MwSt.) mit Garantie, Import durch CarAdvance.` },
  fr: { sale: '$1 à vendre · $2 · $3 km | CarAdvance', sold: 'Vendu : $1 · $2 · $3 km | CarAdvance',
        saleD: '$1 à vendre, $2, $3 km, $4 ch, $5, $6. Prix $7 Ft. Import allemand à l’historique vérifié par CarAdvance.',
        soldD: 'Vendu : $1, $2, $3 km, $4 ch, $5, $6. Vous cherchez un modèle similaire ? Découvrez notre stock actuel.',
        desc: (n, y, km, f, b, p, u, g, d) => `${n}${y ? ', année ' + y : ''}, ${km ? km + ' parcourus, ' : ''}${f}, ${b}. ${p} ${u === 'LE' ? 'ch' : u}, ${g}, ${d}. Prix HT avec garantie, importé par CarAdvance.` },
  uk: { sale: '$1 на продаж · $2 · $3 км | CarAdvance', sold: 'Продано: $1 · $2 · $3 км | CarAdvance',
        saleD: '$1 на продаж, $2, $3 км, $4 к.с., $5, $6. Ціна $7 Ft. Імпорт з Німеччини з перевіреною історією від CarAdvance.',
        soldD: 'Продано: $1, $2, $3 км, $4 к.с., $5, $6. Шукаєте схоже? Перегляньте наші авто в наявності.',
        desc: (n, y, km, f, b, p, u, g, d) => `${n}${y ? ', ' + y + ' р.' : ''}, ${km ? 'пробіг ' + km + ', ' : ''}${f}, ${b}. ${p} ${u === 'LE' ? 'к.с.' : u}, ${g}, ${d}. Ціна нетто (без ПДВ) з гарантією, імпорт CarAdvance.` },
  zh: { sale: '在售 $1 · $2 · $3 公里 | CarAdvance', sold: '已售：$1 · $2 · $3 公里 | CarAdvance',
        saleD: '在售 $1，$2，$3 公里，$4 马力，$5，$6。价格 $7 Ft。CarAdvance 德国进口，车史已核实。',
        soldD: '已售：$1，$2，$3 公里，$4 马力，$5，$6。想找类似的车？请查看我们的现有库存。',
        desc: (n, y, km, f, b, p, u, g, d) => `${n}${y ? '，' + y + ' 年款' : ''}，${km ? '已行驶 ' + km + '，' : ''}${f}，${b}。${p} ${u === 'LE' ? '马力' : u}，${g}，${d}。含质保净价（不含增值税），由 CarAdvance 进口。` },
  sk: { sale: '$1 na predaj · $2 · $3 km | CarAdvance', sold: 'Predané: $1 · $2 · $3 km | CarAdvance',
        saleD: '$1 na predaj, $2, $3 km, $4 k, $5, $6. Cena $7 Ft. Dovoz z Nemecka s overenou históriou od CarAdvance.',
        soldD: 'Predané: $1, $2, $3 km, $4 k, $5, $6. Hľadáte niečo podobné? Pozrite si našu aktuálnu ponuku.',
        desc: (n, y, km, f, b, p, u, g, d) => `${n}${y ? ', rok výroby ' + y : ''}, ${km ? 'najazdené ' + km + ', ' : ''}${f}, ${b}. ${p} ${u === 'LE' ? 'k' : u}, ${g}, ${d}. Cena bez DPH so zárukou, dovoz CarAdvance.` },
  cs: { sale: '$1 na prodej · $2 · $3 km | CarAdvance', sold: 'Prodáno: $1 · $2 · $3 km | CarAdvance',
        saleD: '$1 na prodej, $2, $3 km, $4 k, $5, $6. Cena $7 Ft. Dovoz z Německa s ověřenou historií od CarAdvance.',
        soldD: 'Prodáno: $1, $2, $3 km, $4 k, $5, $6. Hledáte něco podobného? Podívejte se na naši aktuální nabídku.',
        desc: (n, y, km, f, b, p, u, g, d) => `${n}${y ? ', rok výroby ' + y : ''}, ${km ? 'najeto ' + km + ', ' : ''}${f}, ${b}. ${p} ${u === 'LE' ? 'k' : u}, ${g}, ${d}. Cena bez DPH se zárukou, dovoz CarAdvance.` },
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const HUSIG = /[őűŐŰ]|[áéíóöúü]|\b(és|az|egy|a|hogy|nem|vagy|autó|Eladó|Elkelt|Főoldal|Autóink)\b/;

export function makeTemplater(l, D) {
  const w = W[l]; if (!w) return () => null;
  const word = (x) => { const t = D[x] || D[cap(x)]; if (!t) return x; return x[0] === x[0].toLowerCase() && l !== 'de' ? t.charAt(0).toLowerCase() + t.slice(1) : t; };
  const sub = (tpl, m) => tpl.replace(/\$(\d)/g, (_, i) => m[+i] || '');
  return function (k) {
    let m;
    if ((m = k.match(/^Eladó (.+) · (\{\d+\}) · (\{\d+\}) km \| CarAdvance$/))) return sub(w.sale, m);
    if ((m = k.match(/^Elkelt (.+) · (\{\d+\}) · (\{\d+\}) km \| CarAdvance$/))) return sub(w.sold, m);
    if ((m = k.match(/^Eladó (.+) · (\{\d+\}) \| CarAdvance$/))) return w.sale.replace(/ · \$3 km| · \$3 км| · \$3 公里/, '').replace('$1', m[1]).replace('$2', m[2]);
    if ((m = k.match(/^(Eladó|Elkelt) (.+?)(?: · (\{\d+\}))? \| CarAdvance$/))) {
      let t = (m[1] === 'Eladó' ? w.sale : w.sold).replace(/ · \$3 (?:km|км|公里)/, '');
      if (!m[3]) t = t.replace(/ · \$2/, '');
      return t.replace('$1', m[2]).replace('$2', m[3] || '');
    }
    if ((m = k.match(/^Eladó (.+), (\{\d+\}), (\{\d+\}) km, (\{\d+\}) LE, ([^,]+), ([^.]+)\. Ára (\{\d+\}) Ft\. Ellenőrzött előéletű német import a CarAdvance-től\.$/))) { m[5] = word(m[5]); m[6] = word(m[6]); return sub(w.saleD, m); }
    if ((m = k.match(/^Elkelt: (.+), (\{\d+\}), (\{\d+\}) km, (\{\d+\}) LE, ([^,]+), ([^.]+)\. Hasonlót keresel\? Nézd meg az aktuális készletet\.$/))) { m[5] = word(m[5]); m[6] = word(m[6]); return sub(w.soldD, m); }
    if ((m = k.match(/^A\(z\) (.+?)(?: (\{\d+\}(?:\/\{\d+\})?))? évjáratú, (?:(.+?) futott, )?(.+?) üzemű (.+?)\. (\{\d+\}) (kW|LE)(?:, ([^,.]*))?(?:, ([^.]*))?\s*\. Nettó ár \(áfa nélkül\) garanciával, CarAdvance import\.$/)))
      return w.desc(m[1], m[2], m[3], word(m[4]), word(m[5]), m[6], m[7], word(m[8] || '') || '', word(m[9] || '') || '').replace(/, , \./, '.').replace(/, \./, '.').replace(/，，。/, '。').replace(/，。/, '。');
    if (/^<g0>Főoldal<\/g0> \/ <g1>Autóink<\/g1> \/ /.test(k))
      return k.replace(/<g0>Főoldal<\/g0>/, `<g0>${D['Főoldal'] || 'Home'}</g0>`).replace(/<g1>Autóink<\/g1>/, `<g1>${D['Autóink'] || 'Cars'}</g1>`).replace(/<g2>Eladva<\/g2>/, `<g2>${D['Eladva'] || 'Sold'}</g2>`);
    if (k.includes(' · ') && !/<[gx]\d/.test(k)) {
      let ok = true; const out = k.split(' · ').map((p) => { if (/^\{\d+\}$/.test(p) || neutral(p)) return p; const t = D[p] || D[cap(p)]; if (!t) { ok = false; return p; } return t; });
      if (ok) return out.join(' · ');
    }
    return null;
  };
}
/** nincs benne magyar szöveg (típusnév, márka, német felszereltség) → nem kell fordítani */
export const neutral = (k) => !HUSIG.test(k.replace(/Coupé|COUPÉ|Café|Citroën|Škoda|Mélységfekete/g, ' ').replace(/<\/?[gx]\d+\/?>/g, ' ').replace(/\{\d+\}/g, ' '));
