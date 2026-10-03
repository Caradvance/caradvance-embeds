/**
 * i18n-rental.mjs — a bérlési Részletek-oldalak (/berelheto-auto/…) adatvezérelt mondatainak fordítása
 *
 * A src/data/rentalPage.ts a napi Choice-szinkron adataiból rak össze mondatokat (ár, futáskeret,
 * futamidő, kaució, darabszám, változatok, színek). Ezek naponta változnak, ezért szótárral nem
 * követhetők — itt a rentalPage.ts mondat-sablonjait tükrözzük minden nyelvre. A számok {n}
 * helyőrzőként, a típusnevek változatlanul kerülnek át.
 */
const LIST = '\\{\\d+\\}(?:(?:, \\{\\d+\\})* vagy \\{\\d+\\})?';
const KMT = `(?:(${LIST}) km\\/hó futáskerettel|egyedi futáskerettel)`;
const MOT = `(?:(${LIST}) hónapos futamidővel|rugalmas futamidővel)`;
const R = (s) => new RegExp('^' + s + '$');

const P = {
  en: {
    vintro: (n) => `You can currently choose from ${n} versions: `, vprice: (x) => `from ${x} €/month`, trim: 'trim', series: (n) => `${n} Series`, rent: (n) => `${n} rental`,
    or: ' or ', km: (l) => (l ? `a mileage allowance of ${l} km/month` : 'an individual mileage allowance'), mo: (l) => (l ? `a ${l}-month term` : 'a flexible term'),
    hero: (n, huf, km, mo, f, g) => `Brand-new ${n} on long-term rental from ${huf} Ft/month — with ${km}, ${mo} and a one-off refundable deposit. ${f} drive, ${g} transmission.`,
    lead: (n, huf, km, mo, cnt, now, vars, dep, n2) => `<g0>${n} rental</g0> is the easiest way to a brand-new car: on <g1>long-term rental</g1> you can drive it from ${huf} Ft/month, with ${km} and ${mo}. ${cnt ? `Right now you can choose from ${cnt} ${n2} cars${now ? ` (${now} available immediately)` : ''}` : 'You can choose from several versions'}${vars ? `, in ${vars} versions` : ''}. One-off refundable <g2>deposit</g2> from ${dep} €; service, tax and summer/winter tyres are covered by us. No need to own it: at the end of the rental you simply hand it back or switch to a new model.`,
    price: (n, huf, eur, km, mo, dep, depMax) => `<g0>${n} rental</g0> starts from ${huf} Ft (${eur} €) per month, with ${km} and ${mo}. The one-off refundable <g1>deposit</g1> starts from ${dep} €${depMax ? `, ${depMax} € for the more powerful versions` : ''}. The exact fee depends on the version, colour and equipment package — you can see the monthly fee and availability of every model among our <g2>cars available for rent</g2>.`,
    faqPrice: (n, huf, eur, km, mo, vars) => `The monthly rental fee of the ${n} starts from ${huf} Ft (${eur} €), with ${km} and ${mo}.${vars ? ' By version: ' + vars + '.' : ''} Contact us for an exact, personalised offer.`,
    perMonth: ' €/month from',
    desc: (n, huf, km, mo, dep, z, body, soon) => `${n} rental and long-term lease from ${huf} Ft/month${km ? `, ${km} km/month mileage` : ''}${mo ? `, for ${mo} months` : ''}, deposit from ${dep} €. Brand-new, ${z} km ${body}${soon ? ', available now or soon.' : ''}`,
    term: (l) => `The long-term rental term is ${l} months. After that you can extend it or switch to a new model — even a new car every six months.`,
    avail: (now, n, later) => `${now ? `${now} ${n} available immediately` : 'No car is available immediately at the moment'}${later ? '; more cars: ' + later : ''}. We hand over a brand-new car with 0 km.`,
    pcs: ' pcs', availList: 'Available for rent: ', colors: 'Colours available for rent: ',
    related: (a, b) => ` Looking for another model? Have a look at the <g4>${a}</g4>${b ? ` and <g5>${b}</g5>` : ''} rental models too.`,
  },
  de: {
    vintro: (n) => `Derzeit stehen ${n} Varianten zur Auswahl: `, vprice: (x) => `ab ${x} €/Monat`, trim: 'Ausstattung', series: (n) => `${n}er`, rent: (n) => `${n} mieten`,
    or: ' oder ', km: (l) => (l ? `${l} km/Monat Laufleistung` : 'individueller Laufleistung'), mo: (l) => (l ? `${l} Monaten Laufzeit` : 'flexibler Laufzeit'),
    hero: (n, huf, km, mo, f, g) => `Neuer ${n} in der Langzeitmiete ab ${huf} Ft/Monat — mit ${km}, ${mo} und einer einmaligen, rückzahlbaren Kaution. ${f}-Antrieb, ${g}.`,
    lead: (n, huf, km, mo, cnt, now, vars, dep, n2) => `<g0>${n} mieten</g0> ist der einfachste Weg zu einem Neuwagen: In der <g1>Langzeitmiete</g1> fahren Sie ihn ab ${huf} Ft/Monat, mit ${km} und ${mo}. ${cnt ? `Derzeit stehen ${cnt} ${n2} zur Auswahl${now ? ` (${now} sofort verfügbar)` : ''}` : 'Mehrere Varianten stehen zur Auswahl'}${vars ? `, in den Varianten ${vars}` : ''}. Einmalige, rückzahlbare <g2>Kaution</g2> ab ${dep} €; Service, Steuer sowie Sommer- und Winterreifen übernehmen wir. Sie müssen das Auto nicht besitzen: Am Ende der Miete geben Sie es einfach zurück oder wechseln auf ein neues Modell.`,
    price: (n, huf, eur, km, mo, dep, depMax) => `Die Monatsrate für <g0>${n} mieten</g0> beginnt bei ${huf} Ft (${eur} €), mit ${km} und ${mo}. Die einmalige, rückzahlbare <g1>Kaution</g1> beginnt bei ${dep} €${depMax ? `, bei den stärkeren Varianten ${depMax} €` : ''}. Der genaue Preis hängt von Variante, Farbe und Ausstattungspaket ab — Monatsrate und Verfügbarkeit jedes Modells sehen Sie bei unseren <g2>verfügbaren Mietwagen</g2>.`,
    faqPrice: (n, huf, eur, km, mo, vars) => `Die monatliche Miete für den ${n} beginnt bei ${huf} Ft (${eur} €), mit ${km} und ${mo}.${vars ? ' Je nach Variante: ' + vars + '.' : ''} Für ein genaues, persönliches Angebot kontaktieren Sie uns.`,
    perMonth: ' €/Monat ab',
    desc: (n, huf, km, mo, dep, z, body, soon) => `${n} mieten und Langzeitmiete ab ${huf} Ft/Monat${km ? `, ${km} km/Monat Laufleistung` : ''}${mo ? `, für ${mo} Monate` : ''}, Kaution ab ${dep} €. Neu, ${z} km, ${body}${soon ? ', sofort oder bald verfügbar.' : ''}`,
    term: (l) => `Die Laufzeit der Langzeitmiete beträgt ${l} Monate. Danach können Sie verlängern oder auf ein neues Modell wechseln — auf Wunsch alle sechs Monate ein neues Auto.`,
    avail: (now, n, later) => `${now ? `${now} ${n} sofort verfügbar` : 'Derzeit ist kein Fahrzeug sofort verfügbar'}${later ? '; weitere Autos: ' + later : ''}. Wir übergeben einen Neuwagen mit 0 km.`,
    pcs: ' Stück', availList: 'Mietbar: ', colors: 'Verfügbare Farben: ',
    related: (a, b) => ` Suchen Sie ein anderes Modell? Sehen Sie sich auch die Mietmodelle <g4>${a}</g4>${b ? ` und <g5>${b}</g5>` : ''} an.`,
  },
  fr: {
    vintro: (n) => `Vous avez actuellement le choix entre ${n} versions : `, vprice: (x) => `à partir de ${x} €/mois`, trim: 'finition', series: (n) => `Série ${n}`, rent: (n) => `Location ${n}`,
    or: ' ou ', km: (l) => (l ? `un forfait de ${l} km/mois` : 'un kilométrage personnalisé'), mo: (l) => (l ? `une durée de ${l} mois` : 'une durée flexible'),
    hero: (n, huf, km, mo, f, g) => `${n} neuve en location longue durée dès ${huf} Ft/mois — avec ${km}, ${mo} et un dépôt de garantie unique et remboursable. Motorisation ${f}, boîte ${g}.`,
    lead: (n, huf, km, mo, cnt, now, vars, dep, n2) => `La <g0>location ${n}</g0> est le moyen le plus simple de rouler en voiture neuve : en <g1>location longue durée</g1>, dès ${huf} Ft/mois, avec ${km} et ${mo}. ${cnt ? `Vous avez actuellement le choix entre ${cnt} ${n2}${now ? ` (${now} disponibles immédiatement)` : ''}` : 'Plusieurs versions sont disponibles'}${vars ? `, en versions ${vars}` : ''}. <g2>Dépôt de garantie</g2> unique et remboursable dès ${dep} € ; l’entretien, la taxe et les pneus été/hiver sont à notre charge. Inutile d’en être propriétaire : à la fin de la location, vous la rendez simplement ou passez à un nouveau modèle.`,
    price: (n, huf, eur, km, mo, dep, depMax) => `Le loyer mensuel de la <g0>location ${n}</g0> démarre à ${huf} Ft (${eur} €), avec ${km} et ${mo}. Le <g1>dépôt de garantie</g1> unique et remboursable démarre à ${dep} €${depMax ? `, ${depMax} € pour les versions plus puissantes` : ''}. Le prix exact dépend de la version, de la couleur et du pack d’équipement — loyer et disponibilité de chaque modèle parmi nos <g2>voitures disponibles à la location</g2>.`,
    faqPrice: (n, huf, eur, km, mo, vars) => `Le loyer mensuel de la ${n} démarre à ${huf} Ft (${eur} €), avec ${km} et ${mo}.${vars ? ' Par version : ' + vars + '.' : ''} Contactez-nous pour une offre précise et personnalisée.`,
    perMonth: ' €/mois dès',
    desc: (n, huf, km, mo, dep, z, body, soon) => `Location ${n} et location longue durée dès ${huf} Ft/mois${km ? `, ${km} km/mois` : ''}${mo ? `, pour ${mo} mois` : ''}, dépôt dès ${dep} €. Neuve, ${z} km, ${body}${soon ? ', disponible immédiatement ou prochainement.' : ''}`,
    term: (l) => `La durée de la location longue durée est de ${l} mois. Ensuite, vous pouvez prolonger ou passer à un nouveau modèle — jusqu’à une voiture neuve tous les six mois.`,
    avail: (now, n, later) => `${now ? `${now} ${n} disponibles immédiatement` : 'Aucune voiture n’est disponible immédiatement pour le moment'}${later ? ' ; autres voitures : ' + later : ''}. Nous livrons une voiture neuve, 0 km.`,
    pcs: ' unités', availList: 'Disponibles à la location : ', colors: 'Couleurs disponibles : ',
    related: (a, b) => ` Vous cherchez un autre modèle ? Découvrez aussi les modèles <g4>${a}</g4>${b ? ` et <g5>${b}</g5>` : ''} en location.`,
  },
  uk: {
    vintro: (n) => `Зараз можна обрати з ${n} версій: `, vprice: (x) => `від ${x} €/міс.`, trim: 'комплектація', series: (n) => `${n} Series`, rent: (n) => `Оренда ${n}`,
    or: ' або ', km: (l) => (l ? `лімітом пробігу ${l} км/міс.` : 'індивідуальним лімітом пробігу'), mo: (l) => (l ? `терміном ${l} міс.` : 'гнучким терміном'),
    hero: (n, huf, km, mo, f, g) => `Новий ${n} у довгострокову оренду від ${huf} Ft/міс. — з ${km}, ${mo} та одноразовою заставою, що повертається. Привід: ${f}, коробка: ${g}.`,
    lead: (n, huf, km, mo, cnt, now, vars, dep, n2) => `<g0>Оренда ${n}</g0> — найпростіший шлях до нового авто: у <g1>довгостроковій оренді</g1> від ${huf} Ft/міс., з ${km} і ${mo}. ${cnt ? `Зараз можна обрати з ${cnt} авто ${n2}${now ? ` (${now} доступні одразу)` : ''}` : 'Доступно кілька версій'}${vars ? `, у версіях ${vars}` : ''}. Одноразова <g2>застава</g2> від ${dep} €, яка повертається; сервіс, податок і літні/зимові шини — за наш рахунок. Не потрібно володіти авто: наприкінці оренди ви просто повертаєте його або переходите на нову модель.`,
    price: (n, huf, eur, km, mo, dep, depMax) => `Щомісячний платіж за <g0>оренду ${n}</g0> — від ${huf} Ft (${eur} €), з ${km} і ${mo}. Одноразова <g1>застава</g1>, що повертається, — від ${dep} €${depMax ? `, для потужніших версій ${depMax} €` : ''}. Точна ціна залежить від версії, кольору та пакета комплектації — платіж і наявність кожної моделі дивіться серед наших <g2>авто для оренди</g2>.`,
    faqPrice: (n, huf, eur, km, mo, vars) => `Щомісячна плата за оренду ${n} — від ${huf} Ft (${eur} €), з ${km} і ${mo}.${vars ? ' За версіями: ' + vars + '.' : ''} Зв’яжіться з нами для точної персональної пропозиції.`,
    perMonth: ' €/міс. від',
    desc: (n, huf, km, mo, dep, z, body, soon) => `Оренда ${n} та довгострокова оренда від ${huf} Ft/міс.${km ? `, ${km} км/міс.` : ''}${mo ? `, на ${mo} міс.` : ''}, застава від ${dep} €. Нове, ${z} км, ${body}${soon ? ', доступно одразу або незабаром.' : ''}`,
    term: (l) => `Термін довгострокової оренди — ${l} міс. Потім можна продовжити або перейти на нову модель — навіть нове авто кожні пів року.`,
    avail: (now, n, later) => `${now ? `${now} авто ${n} доступні одразу` : 'Зараз немає авто, доступних одразу'}${later ? '; інші авто: ' + later : ''}. Передаємо нове авто з пробігом 0 км.`,
    pcs: ' шт.', availList: 'Доступно для оренди: ', colors: 'Доступні кольори: ',
    related: (a, b) => ` Шукаєте іншу модель? Перегляньте також моделі <g4>${a}</g4>${b ? ` і <g5>${b}</g5>` : ''} для оренди.`,
  },
  zh: {
    vintro: (n) => `目前有 ${n} 个版本可选：`, vprice: (x) => `${x} €/月起`, trim: '配置', series: (n) => `${n}系`, rent: (n) => `${n} 租赁`,
    or: ' 或 ', km: (l) => (l ? `每月 ${l} 公里里程` : '个性化里程'), mo: (l) => (l ? `${l} 个月租期` : '灵活租期'),
    hero: (n, huf, km, mo, f, g) => `全新 ${n} 长期租赁，每月 ${huf} Ft 起——${km}、${mo}，一次性可退押金。${f}动力，${g}变速箱。`,
    lead: (n, huf, km, mo, cnt, now, vars, dep, n2) => `<g0>${n} 租赁</g0>是开上新车最简单的方式：<g1>长期租赁</g1>每月 ${huf} Ft 起，${km}，${mo}。${cnt ? `目前共有 ${cnt} 辆 ${n2} 可选${now ? `（${now} 辆可立即提车）` : ''}` : '多种版本可选'}${vars ? `，版本：${vars}` : ''}。一次性可退<g2>押金</g2> ${dep} € 起；保养、税费及夏季/冬季轮胎由我们承担。无需拥有车辆：租期结束时直接归还，或换成新车型。`,
    price: (n, huf, eur, km, mo, dep, depMax) => `<g0>${n} 租赁</g0>月租 ${huf} Ft（${eur} €）起，${km}，${mo}。一次性可退<g1>押金</g1> ${dep} € 起${depMax ? `，高性能版本为 ${depMax} €` : ''}。具体价格取决于版本、颜色和配置套餐——所有车型的月租和供货情况可在<g2>可租车辆</g2>中查看。`,
    faqPrice: (n, huf, eur, km, mo, vars) => `${n} 的月租 ${huf} Ft（${eur} €）起，${km}，${mo}。${vars ? '各版本：' + vars + '。' : ''}如需准确的个性化报价，请联系我们。`,
    perMonth: ' €/月起',
    desc: (n, huf, km, mo, dep, z, body, soon) => `${n} 租赁及长期租赁，每月 ${huf} Ft 起${km ? `，每月 ${km} 公里` : ''}${mo ? `，${mo} 个月` : ''}，押金 ${dep} € 起。全新 ${z} 公里${body}${soon ? '，现车或即将到货。' : ''}`,
    term: (l) => `长期租赁期限为 ${l} 个月。之后可以续租或换成新车型——甚至每半年换一辆新车。`,
    avail: (now, n, later) => `${now ? `${now} 辆 ${n} 可立即提车` : '目前没有可立即提车的车辆'}${later ? '；更多车辆：' + later : ''}。交付全新 0 公里车辆。`,
    pcs: ' 辆', availList: '可租版本：', colors: '可选颜色：',
    related: (a, b) => ` 在找其他车型？也看看可租的 <g4>${a}</g4>${b ? ` 和 <g5>${b}</g5>` : ''} 车型。`,
  },
};

const BODY = {
  kombi: { en: 'estate', de: 'Kombi', fr: 'break', uk: 'універсал', zh: '旅行车' }, limuzin: { en: 'saloon', de: 'Limousine', fr: 'berline', uk: 'седан', zh: '轿车' },
  kabrió: { en: 'convertible', de: 'Cabrio', fr: 'cabriolet', uk: 'кабріолет', zh: '敞篷车' }, suv: { en: 'SUV', de: 'SUV', fr: 'SUV', uk: 'SUV', zh: 'SUV' },
  'suv coupé': { en: 'SUV coupé', de: 'SUV-Coupé', fr: 'SUV coupé', uk: 'SUV-купе', zh: '轿跑SUV' }, egyterű: { en: 'MPV', de: 'Van', fr: 'monospace', uk: 'мінівен', zh: 'MPV' },
  ferdehátú: { en: 'hatchback', de: 'Schrägheck', fr: 'compacte', uk: 'хетчбек', zh: '掀背车' }, kupé: { en: 'coupé', de: 'Coupé', fr: 'coupé', uk: 'купе', zh: '轿跑车' },
  coupé: { en: 'coupé', de: 'Coupé', fr: 'coupé', uk: 'купе', zh: '轿跑车' }, crossover: { en: 'crossover', de: 'Crossover', fr: 'crossover', uk: 'кросовер', zh: '跨界车' },
  kisautó: { en: 'small car', de: 'Kleinwagen', fr: 'citadine', uk: 'малолітражка', zh: '小型车' }, 'prémium autó': { en: 'premium car', de: 'Premium-Auto', fr: 'voiture premium', uk: 'преміум-авто', zh: '高端汽车' },
};
const MONTHS_HU = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  uk: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

export function makeRental(l, D, RT = {}) {
  const p = P[l]; if (!p) return () => null;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const w = (x) => { if (!x) return x; const t = D[x] || D[cap(x)] || RT[x] || RT[cap(x)]; if (!t) return x; return x[0] === x[0].toLowerCase() && l !== 'de' ? t.charAt(0).toLowerCase() + t.slice(1) : t; };
  const words = (s) => s.split(', ').map(w).join(', ');
  const or = (s) => (s ? s.replace(' vagy ', p.or) : s);
  const nm = (n) => (n ? n.replace(/(\{\d+\})-(?:es|as|os|ös|ás)\b/g, (x, d) => p.series(d)).replace(/\b(Limuzin|Kombi|Kabrió|Touring)\b/g, (x) => (x === 'Touring' ? x : (BODY[x.toLowerCase()] || {})[l] ? (l === 'de' || l === 'zh' ? BODY[x.toLowerCase()][l] : cap(BODY[x.toLowerCase()][l])) : x)) : n);
  const body = (b) => { const k = (b || '').toLowerCase(); return (BODY[k] && BODY[k][l]) || w(b); };
  const NOTE = {};
  const EQ = /^(.*?) · felszereltség: (.+)$/;
  for (const [k, v] of Object.entries(D)) {
    if (!k.startsWith('Jelenleg {1} változat közül választhatsz: ')) continue;
    for (const it of k.matchAll(/<g(\d+)>.*?<\/g\1> — (.*?), (\{\d+\}) €\/hó-tól/g)) {
      const a = v.indexOf(`</g${it[1]}>`), b = v.indexOf(it[3], a); if (a < 0 || b < 0) continue;
      let seg = v.slice(a + `</g${it[1]}>`.length, b).replace(/^\s*[—–-]+\s*/, '').replace(/[,，;；]?\s*(from|ab|à partir de|dès|від|起)?\s*$/i, '').trim();
      const hu = it[2].replace(EQ, '$1'); seg = seg.replace(/\s*·\s*[^·]*$/, (x) => (EQ.test(it[2]) ? '' : x));
      if (seg && !NOTE[hu]) NOTE[hu] = seg;
    }
  }
  const note = (n) => { const m = n.match(EQ); const base = m ? m[1] : n; const t = NOTE[base] || (D[base] || RT[base]) || (/^[a-záéíóöőúüű -]+$/i.test(base) && w(base) !== base ? w(base) : null); if (!t) return null; return t + (m ? ` · ${p.trim}: ${m[2]}` : ''); };
  const months = (s) => MONTHS_HU.reduce((a, m, i) => a.replace(new RegExp(m, 'g'), MONTHS[l][i]), s).replace(/ db\b/g, p.pcs);
  // design-szöveg + színlista: a modell-leírás korábbi fordításából (bármilyen színlistával) kinyerjük az előtagot
  const DESIGN = {};
  for (const [k, v] of Object.entries(D)) {
    const m = k.match(/^(.*?) Bérelhető színek: [^.]+\.$/);
    if (!m) continue;
    const parts = v.split(/(?<=[.!?。])\s*/); if (parts.length < 2) continue;
    DESIGN[m[1]] = parts.slice(0, -1).join(l === 'zh' ? '' : ' ');
  }
  return function (k) {
    let m;
    if ((m = k.match(/^(.*?) Bérelhető színek: ([^.]+)\.$/)) && DESIGN[m[1]]) return DESIGN[m[1]] + (l === 'zh' ? '' : ' ') + p.colors + m[2].split(', ').map((c) => RT[c] || D[c] || c).join(', ') + (l === 'zh' ? '。' : '.');
    if ((m = k.match(R(`Vadonatúj (.+?) tartós bérletben (\\{\\d+\\}) Ft\\/hó-tól — ${KMT}, ${MOT} és egyszeri, visszajáró kaucióval\\. (.+?) hajtás, (.+?) váltó\\.`))))
      return p.hero(nm(m[1]), m[2], p.km(or(m[3])), p.mo(or(m[4])), words(m[5]), w(m[6]));
    if ((m = k.match(R(`Az? <g0>(.+?) bérlés<\\/g0> a legegyszerűbb út egy vadonatúj autóhoz: <g1>tartós bérletben<\\/g1> (\\{\\d+\\}) Ft\\/hó-tól vezetheted, ${KMT} és ${MOT}\\. (?:Jelenleg (\\{\\d+\\}) db (.+?) közül választhatsz(?: \\((\\{\\d+\\}) db azonnal elérhető\\))?|Több változat közül választhatsz)(?:, (.+?) kivitelben)?\\. Egyszeri, visszajáró <g2>kaució<\\/g2> (\\{\\d+\\}) €-tól; a szervizt, az adót és a nyári-téli gumit mi álljuk\\. Nem kell tulajdonolnod: a bérlet végén egyszerűen visszaadod, vagy új modellre váltasz\\.`))))
      return p.lead(nm(m[1]), m[2], p.km(or(m[3])), p.mo(or(m[4])), m[5], m[7], m[8], m[9], nm(m[6] || m[1]));
    if ((m = k.match(R(`Az? <g0>(.+?) bérlés<\\/g0> havidíja (\\{\\d+\\}) Ft \\((\\{\\d+\\}) €\\) -tól indul ${KMT} és ${MOT}\\. Az egyszeri, visszatérítendő <g1>kaució<\\/g1> (\\{\\d+\\}) €-tól indul(?:, az erősebb változatoknál (\\{\\d+\\}) €)?\\. A pontos díj a változattól, a színtől és a felszereltségi csomagtól függ — a <g2>bérelhető autóink<\\/g2> között minden modell havidíját és elérhetőségét látod\\.`))))
      return p.price(nm(m[1]), m[2], m[3], p.km(or(m[4])), p.mo(or(m[5])), m[6], m[7]);
    if ((m = k.match(R(`Az? (.+?) havi bérleti díja (\\{\\d+\\}) Ft \\((\\{\\d+\\}) €\\) -tól indul ${KMT} és ${MOT}\\.(?: Változatonként: (.+?)\\.)? Pontos, személyre szabott ajánlatért keress minket\\.`))))
      return p.faqPrice(nm(m[1]), m[2], m[3], p.km(or(m[4])), p.mo(or(m[5])), m[6] ? m[6].replace(/ €\/hó-tól/g, p.perMonth) : '');
    if ((m = k.match(R(`(.+?) bérlés és tartós bérlet (\\{\\d+\\}) Ft\\/hó-tól(?:, (${LIST}) km\\/hó futáskerettel)?(?:, (${LIST}) hónapra)?, kaució (\\{\\d+\\}) €-tól\\. Vadonatúj, (\\{\\d+\\}) km-es (.+?)(, azonnal vagy hamarosan elérhető\\.|\\.)?`))))
      return p.desc(nm(m[1]), m[2], or(m[3]), or(m[4]), m[5], m[6], body(m[7]), !!(m[8] && m[8].startsWith(','))) + (m[8] === '.' ? '.' : '');
    if ((m = k.match(R(`A tartós bérlet futamideje (${LIST}) hónap\\. Utána meghosszabbíthatod, vagy új modellre válthatsz — akár félévente új autóval\\.`))))
      return p.term(or(m[1]));
    if ((m = k.match(R(`(?:(\\{\\d+\\}) db (.+?) azonnal elérhető|Jelenleg nincs azonnal elérhető darab)(?:; további autók: (.+?))?\\. Vadonatúj, \\{\\d+\\} km-es autót adunk át\\.`))))
      return p.avail(m[1], nm(m[2]), m[3] ? months(m[3]) : '');
    if ((m = k.match(/^Bérelhető: (.+)\.$/)) && /\)$/.test(m[1]))
      return p.availList + m[1].replace(/\(([^)]+)\)/g, (x, f) => '(' + w(f) + ')') + (l === 'zh' ? '。' : '.');
    if ((m = k.match(/^(Ha nem szeretnél tulajdonolni, .+? lehetőségeit\.)(?: Más modellt keresel\? Nézd meg a bérelhető <g4>(.+?)<\/g4>(?: és <g5>(.+?)<\/g5>)? modelleket is\.)$/))) {
      let base = D[m[1]];
      if (!base) { const k2 = Object.keys(D).find((x) => x.startsWith(m[1]) && x.includes('<g4>')); if (k2) { const v2 = D[k2]; const i = v2.indexOf('<g4>'); const cut = Math.max(v2.lastIndexOf('. ', i), v2.lastIndexOf('。', i), v2.lastIndexOf('! ', i)); if (cut > 0) base = v2.slice(0, cut + 1); } }
      if (base) return base + p.related(m[2], m[3]);
    }
    if ((m = k.match(/^Jelenleg (\{\d+\}) változat közül választhatsz: (.+)\.$/))) {
      let ok = true; const out = [];
      for (const it of m[2].split('; ')) { const x = it.match(/^(<g(\d+)>.*?<\/g\2>) — (.*?), (\{\d+\}) €\/hó-tól$/); if (!x) { ok = false; break; } const t = note(x[3]); if (!t) { ok = false; break; } out.push(`${x[1]} — ${t}, ${p.vprice(x[4])}`); }
      if (ok) return p.vintro(m[1]) + out.join(l === 'zh' ? '；' : '; ') + (l === 'zh' ? '。' : '.');
    }
    if ((m = k.match(/^([A-Z][^<>{}]*?(?:\{\d+\}[^<>{}]*?)*) bérlés$/))) return p.rent(nm(m[1]));
    if (/^(<g\d+>[^<]*<\/g\d+>)+$/.test(k)) {
      let ok = true;
      const r = k.replace(/(<g\d+>)([^<]*)(<\/g\d+>)/g, (x, a1, t, a2) => {
        const tr = t.split(' · ').map((pp) => { const q = pp.trim(); if (!q || /^[{}\d\/ ]+(km)?$/.test(q.replace(/\{\d+\}/g, '1'))) return pp; const z = D[q] || RT[q] || D[cap(q)] || RT[cap(q)] || (BODY[q.toLowerCase()] || {})[l]; if (z) return z; const kmh = q.match(/^(.*)km\/hó$/); if (kmh) return kmh[1] + (P[l].km('X').includes('km/month') ? 'km/month' : l === 'de' ? 'km/Monat' : l === 'fr' ? 'km/mois' : l === 'uk' ? 'км/міс.' : '公里/月'); if (/^[A-Za-z0-9 .\-]+$/.test(q)) return pp; ok = false; return pp; }).join(' · ');
        return a1 + tr + a2;
      });
      if (ok && r !== k) return r;
    }
    return null;
  };
}
