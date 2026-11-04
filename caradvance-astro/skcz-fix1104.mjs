// Build lépés (a market-404.mjs után fut): caradvance.sk + caradvance.cz — Mr. JOB SK „Zoznam opráv” (2026-11-04), Marc.
// A kész szlovák (dist/sk) és cseh (dist/cs) gyökér-oldalakon (az /en/, /de/, /hu/ alváltozatok nélkül):
//  A1  ajánlatkérő ablak (eglOrder) statikus magyar szövegei → SK / CZ (a futásidejű fordító ugyanezt kapja)
//      + fejléc: „1 199 € od” → „od 1 199 €”
//  A2  „Kérdésem van” → „Mám otázku” / „Mám dotaz”
//  B4–8, B10  bérlési GYIK / folyamat / havidíj / autók / átlátható ár: a lektorált szövegek
//  B9  konfigurátor árfolyam: SK törölve, CZ a valós EUR/CZK árfolyam (rt-cs.js FX.T)
//  B11 üzemanyag és színek: statikus szöveg + futásidejű szótár; hiányzó színnév → a gyártó német neve (rt-de)
//  B12 „Hľadám auto” / „Hledám vůz”: BMW / Audi / Mercedes / VW csoportnevek
//  C13–17 (SK) főoldali GYIK-ár (a modelloldalak címéből számolva), kellékszavatosság, „takmer nové”
//  D20 „Prémiové” fül: a bérelhető raktári autó „Podrobnosti” linkje a saját adatlapjának bérlési blokkjára visz
//      (#ca-rent: havidíj km-keretenként, kaució, ajánlatkérés)
//  +   általános: a statikus HTML magyar szövegcsomópontjai (és placeholder / title / alt / aria-label) a futásidejű
//      szótár (dist/i18n/rt-sk.js, rt-cs.js) pontos találataival előre lefordítva — a Google és a JS nélküli
//      látogató is szlovák / cseh szöveget kap (a JS ugyanazt az eredményt adná, csak később).
// Hiba esetén csak logol, a buildet nem állítja meg. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITES = [
  { lg: 'sk', root: path.join(DIST, 'sk'), sub: /^(en|de|hu)\//, rt: path.join(DIST, 'i18n', 'rt-sk.js') },
  { lg: 'cs', root: path.join(DIST, 'cs'), sub: /^(en|de)\//, rt: path.join(DIST, 'i18n', 'rt-cs.js') },
];

/* ---------- A1, A2, B7, B11: magyar kulcs → lektorált szöveg (statikus + futásidejű) ---------- */
const HU = {
  intro: 'Állítsd össze az autót a gyártó hivatalos német konfigurátorában (motor, szín, felszereltség), majd illeszd be ide a konfiguráció linkjét — vagy töltsd fel a konfiguráció PDF-jét. Ez alapján küldjük az ajánlatot.',
  tip: 'Tipp: a konfigurátorban a „Mentés” / „Konfiguráció megosztása” gombbal kapsz linket; az „Összegzés” oldalon PDF-et is letölthetsz.',
  help: 'Még nem konfiguráltam — kérek segítséget a konfiguráláshoz',
  note: 'Az ajánlatkérés nem kötelez semmire — a konfigurációd alapján elkészítjük az ajánlatot, és felvesszük veled a kapcsolatot.',
  linkPh: 'https://… (illeszd be a konfiguráció linkjét)',
  msgPh: 'Megjegyzés (pl. kívánt átvétel, keret, kérdés)…',
  km: 'A kereten felüli kilométereket visszaadáskor számoljuk el.',
};
const OV = {
  sk: {
    '1. Adataid': '1. Vaše údaje', '2. Konfiguráció': '2. Konfigurácia',
    [HU.intro]: 'Zostavte si auto v oficiálnom nemeckom konfigurátore výrobcu (motor, farba, výbava) a sem vložte odkaz na konfiguráciu — alebo nahrajte konfiguráciu vo formáte PDF. Na jej základe vám pošleme ponuku.',
    'Az autó konfigurálása': 'Konfigurovať auto',
    [HU.tip]: 'Tip: odkaz získate v konfigurátore tlačidlom na uloženie alebo zdieľanie konfigurácie; na stránke so súhrnom si môžete stiahnuť aj PDF.',
    'A konfiguráció linkje': 'Odkaz na konfiguráciu', 'A konfiguráció PDF-je': 'Konfigurácia v PDF', 'vagy': 'alebo',
    [HU.help]: 'Auto som ešte nekonfiguroval — prosím o pomoc s konfiguráciou',
    'Ajánlatkérés elküldése': 'Odoslať žiadosť o ponuku',
    [HU.note]: 'Žiadosť o ponuku vás k ničomu nezaväzuje — na základe vašej konfigurácie pripravíme ponuku a ozveme sa vám.',
    [HU.linkPh]: 'https://… (vložte odkaz na konfiguráciu)',
    [HU.msgPh]: 'Poznámka (napr. želaný termín, rozpočet, otázky)…',
    'Kérdésem van': 'Mám otázku',
    'Túlfutott kilométer': 'Kilometre nad limit',
    [HU.km]: 'Kilometre nad dohodnutý limit vyúčtujeme pri vrátení auta.',
    'Benzin': 'Benzín', 'Dízel': 'Diesel', 'Hibrid': 'Hybrid',
    'Tiszta fehér': 'Čisto biela', 'Mélyfekete gyöngyház': 'Hlboko čierna perleť', 'Királyvörös metál': 'Kráľovsky červená metalíza',
  },
  cs: {
    '1. Adataid': '1. Vaše údaje', '2. Konfiguráció': '2. Konfigurace',
    [HU.intro]: 'Sestavte si vůz v oficiálním německém konfigurátoru výrobce (motor, barva, výbava) a sem vložte odkaz na konfiguraci — nebo nahrajte konfiguraci ve formátu PDF. Na jejím základě vám zašleme nabídku.',
    'Az autó konfigurálása': 'Konfigurovat vůz',
    [HU.tip]: 'Tip: odkaz získáte v konfigurátoru tlačítkem pro uložení nebo sdílení konfigurace; na stránce se souhrnem si můžete stáhnout i PDF.',
    'A konfiguráció linkje': 'Odkaz na konfiguraci', 'A konfiguráció PDF-je': 'Konfigurace v PDF', 'vagy': 'nebo',
    [HU.help]: 'Vůz jsem ještě nekonfiguroval — prosím o pomoc s konfigurací',
    'Ajánlatkérés elküldése': 'Odeslat poptávku',
    [HU.note]: 'Poptávka vás k ničemu nezavazuje — na základě vaší konfigurace připravíme nabídku a ozveme se vám.',
    [HU.linkPh]: 'https://… (vložte odkaz na konfiguraci)',
    [HU.msgPh]: 'Poznámka (např. požadovaný termín, rozpočet, dotazy)…',
    'Kérdésem van': 'Mám dotaz',
    'Túlfutott kilométer': 'Kilometry nad limit',
    [HU.km]: 'Kilometry nad sjednaný limit vyúčtujeme při vrácení vozu.',
    'Benzin': 'Benzín', 'Dízel': 'Nafta', 'Hibrid': 'Hybrid',
    'Tiszta fehér': 'Čistě bílá', 'Mélyfekete gyöngyház': 'Hluboce černá perleť', 'Királyvörös metál': 'Královsky červená metalíza',
  },
};

/* ---------- B4–B10, C13–C17: lektorált szöveg (a kész SK / CZ szövegben; JSON-LD-ben is) ---------- */
const WORD = {
  sk: [
    // B4 faktúra
    ['Áno, pri firemnom prenájme vystavujeme riadnu faktúru s DPH, s prehľadným vyúčtovaním po položkách.',
      'Áno. Firme – platiteľovi DPH vystaví Caradvance GmbH faktúru bez DPH s prenesením daňovej povinnosti (DPH priznáva odberateľ), s prehľadným vyúčtovaním po položkách. Súkromnej osobe s DPH 23 %.'],
    // B5 doba prenájmu
    ['Na krátky aj dlhý čas.', 'Minimálne na 6 mesiacov.'],
    // B6 fakturácia
    ['Faktúru posielame vždy 1. dňa v mesiaci a mesačný poplatok sa platí vopred.',
      'Mesiac prenájmu sa počíta odo dňa odovzdania auta; nájomné sa platí vopred, najneskôr do 5. dňa mesiaca prenájmu.'],
    // B8 autá
    ['s krátkou dobou viazanosti', 's minimálnou dobou prenájmu 6 mesiacov'],
    // C14 kellékszavatosság
    ['1-ročná zodpovednosť za vady na každé auto', 'Zodpovednosť za vady: 1 rok pri jazdených, 2 roky pri nových autách'],
    ['1-ročná zodpovednosť za vady — ručíme za každé auto', 'Zodpovednosť za vady 1 rok pri jazdených a 2 roky pri nových autách — ručíme za každé auto'],
    ['Na každé auto platí 1-ročná zodpovednosť za vady.', 'Zodpovednosť za vady je 1 rok pri jazdených a 2 roky pri nových autách.'],
    ['Na dovezené aj ostatné autá platí 1-ročná zodpovednosť za vady — pretože', 'Zodpovednosť za vady je 1 rok pri jazdených a 2 roky pri nových autách — pretože'],
    ['Na dovezené autá platí 1-ročná zodpovednosť za vady, pretože', 'Zodpovednosť za vady je 1 rok pri jazdených a 2 roky pri nových autách, pretože'],
    ['— na dovezené autá platí 1-ročná zodpovednosť za vady.', '— zodpovednosť za vady je 1 rok pri jazdených a 2 roky pri nových autách.'],
    ['s overenými autami, 1-ročnou zodpovednosťou za vady,', 's overenými autami, zodpovednosťou za vady (1 rok pri jazdených, 2 roky pri nových autách),'],
    ['u nás platí 1-ročná zodpovednosť za vady.', 'u nás platí zodpovednosť za vady 1 rok pri jazdených a 2 roky pri nových autách.'],
    ['Kontroly a 1-ročná zodpovednosť za vady', 'Kontroly a zodpovednosť za vady'],
    ['— a na každé auto platí 1-ročná zodpovednosť za vady.', '— a zodpovednosť za vady je 1 rok pri jazdených a 2 roky pri nových autách.'],
    ['Na každé predané auto platí 1-ročná zodpovednosť za vady.', 'Na každé predané auto platí zodpovednosť za vady: 1 rok pri jazdených, 2 roky pri nových autách.'],
    ['; na každé auto platí 1-ročná zodpovednosť za vady.', '; zodpovednosť za vady je 1 rok pri jazdených a 2 roky pri nových autách.'],
    [', 1-ročná zodpovednosť za vady, dovoz', ', zodpovednosť za vady 1–2 roky (jazdené / nové autá), dovoz'],
    [/>(\s*)1-ročná na každé auto(\s*)</g, (m, a, b) => '>' + a + '1 rok pri jazdených, 2 roky pri nových autách' + b + '<'],
    [/>(\s*)1-ročná(\s*)</g, (m, a, b) => '>' + a + '1–2 roky' + b + '<'],
    // C15
    ['Pri ojazdených autách zodpovedáme za vady 1 rok od prevzatia auta; na nové autá platí záruka výrobcu.',
      'Pri ojazdených autách zodpovedáme za vady 1 rok od prevzatia auta, pri nových autách 2 roky; na nové autá navyše platí záruka výrobcu.'],
    // C16
    ['zdokumentovaná história a 1 rok záruky na dovezené autá.', 'zdokumentovaná história, 2 roky zodpovednosti za vady a záruka výrobcu.'],
  ],
  cs: [
    ['Ano, při firemním pronájmu vystavujeme řádnou fakturu s DPH, s transparentním položkovým vyúčtováním.',
      'Ano. Firmě – plátci DPH vystaví Caradvance GmbH fakturu bez DPH s přenesením daňové povinnosti (DPH přiznává odběratel), s transparentním položkovým vyúčtováním. Soukromé osobě s DPH 21 %.'],
    ['Na krátkou i dlouhou dobu.', 'Minimálně na 6 měsíců.'],
    ['Fakturu posíláme vždy 1. den v měsíci a měsíční poplatek se platí předem.',
      'Měsíc pronájmu se počítá ode dne předání vozu; nájemné se platí předem, nejpozději do 5. dne měsíce pronájmu.'],
    ['s krátkou dobou trvání', 's minimální dobou pronájmu 6 měsíců'],
  ],
};
// C17 (csak a bérlési oldalakon: /prenajom/…)
const WORD_RENT_SK = [
  ['prenajať nové alebo málo jazdené nemecké prémiové auto v bezchybnom stave', 'prenajať nové alebo takmer nové nemecké prémiové auto v bezchybnom stave (presný stav a nájazd uvádza ponuka)'],
  ['nové alebo málo používané prémiové autá v bezchybnom stave', 'nové alebo takmer nové prémiové autá v bezchybnom stave (presný stav a nájazd uvádza ponuka)'],
  ['Nemecké nové alebo málo jazdené autá', 'Nemecké nové alebo takmer nové autá'],
  ['nové alebo málo jazdené', 'nové alebo takmer nové – presný stav a nájazd uvádza ponuka'],
  ['nové alebo málo používané', 'nové alebo takmer nové – presný stav a nájazd uvádza ponuka'],
];
// B10 (behozatal + átlátható ár): nincs átírási díj
const NO_PREPIS = {
  sk: [[/<li>\s*(?:<b>)?\s*Poplatok za prepis\s*(?:<\/b>)?\s*<\/li>/g, ''], [/,\s*poplatok za prepis(?=\s*,)/g, '']],
  cs: [[/<li>\s*(?:<b>)?\s*Poplatek za přepis\s*(?:<\/b>)?\s*<\/li>/g, ''], [/,\s*poplatek za přepis(?=\s*,)/g, '']],
};
// B12 „Hľadám auto” csoportnevek (a modell-lista szkriptjében: 'kulcs':[ … ])
const GROUPS = {
  sk: { 'A sorozat': 'Rad A', 'Q sorozat': 'Rad Q', 'Sport / elektromos': 'Šport / elektrické', '1-es / 2-es': 'Rad 1 / Rad 2', '3-as / 4-es': 'Rad 3 / Rad 4', '5-ös / 6-os': 'Rad 5 / Rad 6', '7-es / 8-as': 'Rad 7 / Rad 8', 'A / B-osztály': 'Trieda A / B', 'C-osztály': 'Trieda C', 'E-osztály': 'Trieda E', 'S-osztály': 'Trieda S', 'EQ (elektromos)': 'EQ (elektrické)', 'Klasszikus': 'Klasické', 'Kompakt': 'Kompaktné', 'Limuzin': 'Limuzína', 'Egyterű / haszon': 'MPV / úžitkové', 'ID. (elektromos)': 'ID. (elektrické)' },
  cs: { 'A sorozat': 'Řada A', 'Q sorozat': 'Řada Q', 'Sport / elektromos': 'Sport / elektrické', '1-es / 2-es': 'Řada 1 / Řada 2', '3-as / 4-es': 'Řada 3 / Řada 4', '5-ös / 6-os': 'Řada 5 / Řada 6', '7-es / 8-as': 'Řada 7 / Řada 8', 'A / B-osztály': 'Třída A / B', 'C-osztály': 'Třída C', 'E-osztály': 'Třída E', 'S-osztály': 'Třída S', 'EQ (elektromos)': 'EQ (elektrické)', 'Klasszikus': 'Klasické', 'Kompakt': 'Kompaktní', 'Limuzin': 'Limuzína', 'Egyterű / haszon': 'MPV / užitkové', 'ID. (elektromos)': 'ID. (elektrické)' },
};
const RENT_BOX = {
  sk: { tag: 'Na prenájom', h: 'Prenájom tohto auta', note: 'Mesačná splátka bez DPH pri prenájme na min. 6 mesiacov. Konečnú cenu uvádza písomná ponuka.', cta: 'Požiadať o ponuku prenájmu' },
  cs: { tag: 'K pronájmu', h: 'Pronájem tohoto vozu', note: 'Měsíční splátka bez DPH při pronájmu na min. 6 měsíců. Konečnou cenu uvádí písemná nabídka.', cta: 'Poptat pronájem' },
};

/* ---------- segédek ---------- */
const DEC = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: '\u00a0' };
const dec = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (DEC[e] ?? m));
const encT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const encA = (s) => encT(s).replace(/"/g, '&quot;');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');
const R = (h, list) => { for (const [a, b] of list) h = typeof a === 'string' ? h.split(a).join(b) : h.replace(a, b); return h; };
function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); }
  return out;
}
function readM(file) {
  const t = fs.readFileSync(file, 'utf8'); const i = t.indexOf('var M='), j = t.indexOf('};var G=');
  if (i < 0 || j < 0) throw new Error('M not found in ' + file);
  return { t, i: i + 6, j: j + 1, M: JSON.parse(t.slice(i + 6, j + 1)) };
}

/* statikus szövegcsomópontok + attribútumok fordítása (szkript / stílus / textarea kihagyva) */
const RAWB = /(<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<textarea\b[\s\S]*?<\/textarea\s*>|<noscript\b[\s\S]*?<\/noscript\s*>|<template\b[\s\S]*?<\/template\s*>|<!--[\s\S]*?-->)/i;
const AT = /\s(placeholder|title|aria-label|alt)="([^"]*)"/g;
function pretranslate(h, M) {
  let n = 0;
  const attrs = (tag) => tag.replace(AT, (all, a, v) => { const k = norm(dec(v)); const r = k && M[k]; if (r && r !== k) { n++; return ' ' + a + '="' + encA(r) + '"'; } return all; });
  const blocks = h.split(RAWB);
  for (let bi = 0; bi < blocks.length; bi++) {
    const blk = blocks[bi]; if (!blk) continue;
    if (bi % 2 === 1) { // szkript / stílus / megjegyzés: érintetlen; textarea: csak a nyitó tag attribútumai
      if (/^<textarea\b/i.test(blk)) blocks[bi] = blk.replace(/^<textarea\b[^>]*>/i, attrs);
      continue;
    }
    const parts = blk.split(/(<[^>]*>)/);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (!p) continue;
      if (p[0] === '<') { if (/^<[a-z]/i.test(p) && p.indexOf('="') > 0) parts[i] = attrs(p); continue; }
      const raw = dec(p), k = norm(raw); if (!k || !/[A-Za-zÀ-ž]/.test(k)) continue;
      const r = M[k]; if (r == null || r === k || typeof r !== 'string') continue;
      const a = raw.match(/^\s*/)[0], b = raw.match(/\s*$/)[0];
      parts[i] = encT(a + r + b); n++;
      // <option> érték nélkül: a belső (magyar) érték marad a beküldéshez (ugyanígy tesz a futásidejű fordító)
      const prev = parts[i - 1];
      if (prev && /^<option\b/i.test(prev) && !/\svalue=/i.test(prev)) parts[i - 1] = prev.replace(/^<option\b/i, '<option value="' + encA(k) + '"');
    }
    blocks[bi] = parts.join('');
  }
  return { h: blocks.join(''), n };
}
/* csak a szövegcsomópontokban cserél (tagek, attribútumok, szkript / stílus érintetlen) */
function inText(h, fn) {
  const blocks = h.split(RAWB);
  for (let i = 0; i < blocks.length; i += 2) blocks[i] = blocks[i].split(/(<[^>]*>)/).map((p) => (p && p[0] !== '<' ? fn(p) : p)).join('');
  return blocks.join('');
}
const fmtN = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* színnév-tartalék (ha sem a szótárban, sem a gyári német névben nincs): magyar színszavak → SK / CZ, a márkanév marad */
const CW = {
  sk: { kék: 'modrá', piros: 'červená', vörös: 'červená', zöld: 'zelená', szürke: 'sivá', fehér: 'biela', fekete: 'čierna', ezüst: 'strieborná', sárga: 'žltá', barna: 'hnedá', bézs: 'béžová', lila: 'fialová', narancs: 'oranžová', bordó: 'bordová', metál: 'metalíza', gyöngyház: 'perleť', uni: 'uni', sötét: 'tmavá', világos: 'svetlá', petrol: 'petrolejová' },
  cs: { kék: 'modrá', piros: 'červená', vörös: 'červená', zöld: 'zelená', szürke: 'šedá', fehér: 'bílá', fekete: 'černá', ezüst: 'stříbrná', sárga: 'žlutá', barna: 'hnědá', bézs: 'béžová', lila: 'fialová', narancs: 'oranžová', bordó: 'vínová', metál: 'metalíza', gyöngyház: 'perleť', uni: 'uni', sötét: 'tmavá', világos: 'světlá', petrol: 'petrolejová' },
};
const PF = {
  sk: { tanzanit: 'Tanzanitová', oxid: 'Oxidová', hegyi: 'Horská', urán: 'Uránová', atlasz: 'Atlas', nyíl: 'Šípová', elefántcsont: 'Slonovinová', delfin: 'Delfínová', grafit: 'Grafitová', éjfél: 'Polnočná', zafír: 'Zafírová', ásvány: 'Minerálna', gleccser: 'Ľadovcová', kristály: 'Kryštálová', obszidián: 'Obsidiánová', ónix: 'Ónyxová', holdkő: 'Mesačná', árnyék: 'Tieňová', füst: 'Dymová', réz: 'Medená', kozmosz: 'Kozmická', mítosz: 'Mýtická', alkony: 'Súmračná', ibolya: 'Fialková', óceán: 'Oceánska' },
  cs: { tanzanit: 'Tanzanitová', oxid: 'Oxidová', hegyi: 'Horská', urán: 'Uranová', atlasz: 'Atlas', nyíl: 'Šípová', elefántcsont: 'Slonovinová', delfin: 'Delfínová', grafit: 'Grafitová', éjfél: 'Půlnoční', zafír: 'Safírová', ásvány: 'Minerální', gleccser: 'Ledovcová', kristály: 'Křišťálová', obszidián: 'Obsidiánová', ónix: 'Onyxová', holdkő: 'Měsíční', árnyék: 'Stínová', füst: 'Kouřová', réz: 'Měděná', kozmosz: 'Kosmická', mítosz: 'Mýtická', alkony: 'Soumračná', ibolya: 'Fialková', óceán: 'Oceánská' },
};
const CWRE = /^(.*?)(kék|piros|vörös|zöld|szürke|fehér|fekete|ezüst|sárga|barna|bézs|lila|narancs|bordó)$/i;
function colTr(c, lg) {
  const W = CW[lg], X = PF[lg]; let hit = false;
  const out = c.split(' ').map((t) => {
    const l = t.toLowerCase();
    if (W[l]) { hit = true; return W[l]; }
    const m = l.match(CWRE);
    if (m && m[1]) { const p = X[m[1]]; if (!p) return null; hit = true; return p + ' ' + W[m[2]]; }
    if (/[őűöüáéíóú]/i.test(t)) return null;
    return t;
  });
  if (!hit || out.some((x) => x == null)) return null;
  const r = out.join(' ');
  return r.charAt(0).toUpperCase() + r.slice(1);
}

/* ---------- futtatás ---------- */
if (process.argv[1] && /skcz-fix1104\.mjs$/.test(process.argv[1])) {
  let DE = {};
  try { DE = readM(path.join(DIST, 'i18n', 'rt-de.js')).M; } catch (e) { console.log('[skcz-fix1104] rt-de:', e.message); }
  for (const S of SITES) {
    try {
      if (!fs.existsSync(S.root)) { console.log('[skcz-fix1104] nincs', S.root); continue; }
      const files = walk(S.root, []).filter((f) => /\.html$/.test(f)).map((f) => ({ f, rel: path.relative(S.root, f).split(path.sep).join('/') })).filter((x) => !S.sub.test(x.rel));
      // színek: a bérlési adatok (__ABCFG "C") színei, amelyekre a szótárban nincs fordítás → a gyártó német neve
      const R0 = readM(S.rt), M0 = R0.M, COL = {};
      for (const { f } of files) {
        const h = fs.readFileSync(f, 'utf8'); if (h.indexOf('"C":[') < 0) continue;
        for (const m of h.matchAll(/"C":\[([^\]]*)\]/g)) for (const c of m[1].matchAll(/"([^"\\]+)"/g)) COL[c[1]] = 1;
      }
      const CADD = {};
      for (const c of Object.keys(COL)) {
        if (OV[S.lg][c]) continue;
        if (M0[c] == null || M0[c] === c) { if (DE[c] && DE[c] !== c) CADD[c] = DE[c]; else { const x = colTr(c, S.lg); if (x && x !== c) CADD[c] = x; } }
      }
      // a futásidejű szótár: lektorált + hiányzó színek; CZ: „Dízel …” → „Nafta …”
      const M = Object.assign({}, M0, CADD, OV[S.lg]);
      if (S.lg === 'cs') for (const k of Object.keys(M)) if (/^Dízel\b/.test(k) && /^Diesel\b/.test(M[k])) M[k] = M[k].replace(/^Diesel/, 'Nafta');
      let rt = R0.t.slice(0, R0.i) + JSON.stringify(M) + R0.t.slice(R0.j);
      for (const [a, b] of WORD[S.lg]) if (typeof a === 'string') rt = rt.split(JSON.stringify(a).slice(1, -1)).join(JSON.stringify(b).slice(1, -1));
      if (rt !== R0.t) fs.writeFileSync(S.rt, rt);
      // színnevek mondatokban (pl. „Farby na prenájom: …”): többszavas magyar színnév → fordítás
      const CSENT = Object.keys(COL).filter((c) => / /.test(c) && M[c] && M[c] !== c).sort((a, b) => b.length - a.length).map((c) => [c, M[c]]);

      // C13: a legolcsóbb bérlés a modelloldalak címéből
      let min = null, bmw = null;
      if (S.lg === 'sk') {
        for (const { f, rel } of files) {
          if (!/^prenajom\/[^/]+\/index\.html$/.test(rel)) continue;
          const t = (fs.readFileSync(f, 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1] || '';
          const m = t.match(/^Prenájom (.+?) — .*?od ([\d\s\u00a0]+) €/); if (!m) continue;
          const v = +m[2].replace(/\D/g, ''); if (!v) continue;
          if (!min || v < min.v) min = { v, n: m[1] };
          if (/^BMW /.test(m[1]) && (!bmw || v < bmw.v)) bmw = { v, n: m[1] };
        }
      }
      // D20: „Prémiové” fül — bérelhető raktári autók (kártya + adatlap)
      const PREM = {};
      const hubRel = S.lg === 'sk' ? 'auta/index.html' : 'vozy/index.html';
      const FX = (R0.t.match(/var FX=(\{[^}]*\})/) || [])[1]; const fxT = FX ? JSON.parse(FX).T : null;

      let n = 0, tr = 0;
      for (const { f, rel } of files) {
        const P = '/' + rel.replace(/index\.html$/, '');
        const s = fs.readFileSync(f, 'utf8'); let h = s;
        // 1) statikus magyar szövegek
        const pt = pretranslate(h, M); h = pt.h; tr += pt.n;
        // 2) lektorált szövegek (JSON-LD-ben is)
        h = R(h, WORD[S.lg]);
        if (S.lg === 'sk' && /^prenajom\//.test(rel)) h = R(h, WORD_RENT_SK);
        if (/^(dovoz\/|o-nas\/transparentnost\/)/.test(rel)) h = R(h, NO_PREPIS[S.lg]);
        if (CSENT.length && h.indexOf(' metál') > 0) h = inText(h, (x) => R(x, CSENT));
        // A1 fejléc: „1 199 € od” → „od 1 199 €”
        h = h.replace(/(<span id="eglOrderPrice"[^>]*>[^<]*<\/span>)(\s*)(<span[^>]*id="eglOrderTol"[^>]*>[^<]*<\/span>)/, '$3 $1');
        // B9 árfolyam
        if (S.lg === 'sk') h = h.replace(/\s*Podľa aktuálneho kurzu \(1[\s\u00a0]*€[\s\u00a0]*=[\s\u00a0]*<span id="cdFx"[^>]*>[^<]*<\/span>[\s\u00a0]*€\);\s*k/g, ' K');
        else if (fxT) h = h.replace(/(Podle aktuálního kurzu \(1[\s\u00a0]*€[\s\u00a0]*=[\s\u00a0]*)<span id="cdFx"([^>]*)>[^<]*<\/span>([\s\u00a0]*Kč\))/g, (m, a, at, b) => a + '<span class="cd-fx-czk"' + at + '>' + String(fxT).replace('.', ',') + '</span>' + b);
        // B12 csoportnevek a modell-lista szkriptben
        if (/^(hladam-auto|hledam-vuz)\//.test(rel)) for (const [k, v] of Object.entries(GROUPS[S.lg])) h = h.split("'" + k + "':[").join("'" + v + "':[");
        // C13 főoldali GYIK-ár
        if (S.lg === 'sk' && rel === 'index.html' && min && bmw)
          h = h.replace(/Najvýhodnejšia mesačná splátka začína od [\d\s\u00a0]+ €\/mes\. bez DPH \([^)]*\), naše prémiové BMW sú dostupné od [\d\s\u00a0]+ €\/mes\. bez DPH;/g,
            'Najvýhodnejšia mesačná splátka začína od ' + fmtN(min.v) + ' €/mes. bez DPH (' + min.n + '), BMW je dostupné od ' + fmtN(bmw.v) + ' €/mes. bez DPH (' + bmw.n + ');');
        // /prenajom/ címe: a legolcsóbb modell ára
        if (S.lg === 'sk' && rel === 'prenajom/index.html' && min) {
          const m = h.match(/<title>[^<]*?od ([\d\s\u00a0]+) €/);
          if (m && +m[1].replace(/\D/g, '') !== min.v) { const re = new RegExp('od ' + esc(m[1]).replace(/[\s\u00a0]+/g, '[\\s\\u00a0]?') + ' €', 'g'); h = h.replace(re, 'od ' + fmtN(min.v) + ' €'); }
        }
        // D20 kártyák
        if (rel === hubRel) {
          h = h.replace(/<a class="card"([^>]*?) href="\.\.\/auto\/([^"/]+)\/"([^>]*)>([\s\S]*?)<\/a>/g, (m, a1, slug, a2, body) => {
            const i = body.indexOf('<div class="rentprices"'); if (i < 0) return m;
            let d = 0, j = i; const re = /<\/?div\b/g; re.lastIndex = i;
            for (let x; (x = re.exec(body));) { d += x[0] === '<div' ? 1 : -1; if (d === 0) { j = body.indexOf('>', x.index) + 1; break; } }
            PREM[slug] = body.slice(i, j);
            return '<a class="card"' + a1 + ' href="../auto/' + slug + '/#ca-rent"' + a2 + '>' + body + '</a>';
          });
        }
        if (h !== s) { fs.writeFileSync(f, h); n++; }
      }
      // D20 adatlapok: bérlési blokk
      let pn = 0; const B = RENT_BOX[S.lg];
      for (const [slug, rp] of Object.entries(PREM)) {
        const f = path.join(S.root, 'auto', slug, 'index.html'); if (!fs.existsSync(f)) continue;
        let h = fs.readFileSync(f, 'utf8'); if (h.indexOf('id="ca-rent"') > 0) continue;
        const box = '<style>#ca-rent{margin:0 0 16px;border:2px solid #00806A;border-radius:14px;padding:18px;background:#fff}#ca-rent .ca-rt{display:inline-block;font-size:12px;font-weight:800;color:#00594a;background:#e3f5f0;border-radius:999px;padding:4px 10px}#ca-rent h2{font-size:19px;margin:10px 0 12px;line-height:1.25}#ca-rent .rentprices{display:grid;gap:6px;font-size:14px}#ca-rent .rp{display:flex;justify-content:space-between;gap:12px;color:#5a6b82;font-weight:700}#ca-rent .rp b{color:#1d2430;font-weight:800}#ca-rent .rp.kau{border-top:1px dashed #e1e6ee;margin-top:4px;padding-top:8px}#ca-rent p{font-size:13px;color:#5a6b82;margin:12px 0 14px;line-height:1.45}#ca-rent a{display:block;text-align:center;background:#00806A;color:#fff;font-weight:800;border-radius:10px;padding:12px 14px;text-decoration:none}</style>' +
          '<div id="ca-rent"><span class="ca-rt">' + B.tag + '</span><h2>' + B.h + '</h2>' + rp + '<p>' + B.note + '</p><a href="/kontakt/">' + B.cta + '</a></div>';
        const h2 = h.replace(/(<aside class="side"[^>]*>)/, '$1' + box);
        if (h2 !== h) { fs.writeFileSync(f, h2); pn++; }
      }
      console.log('[skcz-fix1104] ' + S.lg + ': ' + n + ' oldal, ' + tr + ' statikus fordítás, +' + Object.keys(CADD).length + ' szín (gyári név), prémium bérlés: ' + Object.keys(PREM).length + ' kártya / ' + pn + ' adatlap' + (min ? ', legolcsóbb: ' + min.n + ' ' + min.v + ' €, BMW: ' + (bmw && bmw.n + ' ' + bmw.v) : ''));
    } catch (e) { console.log('[skcz-fix1104] ' + S.lg + ' hiba:', e && e.stack || e); }
  }

  // A bérlési gomb ár-címkéje (data-price) a szlovák formában („od 1 149 €/mes.”) került a többi piac / nyelv oldalára:
  // PL, CH, EU és a SK / CZ idegen nyelvű változatai — az oldal nyelvén (Marc, 2026-11-04).
  try {
    const UNIT = { pl: ['od ', ' €/mies.'], en: ['from ', ' €/month'], de: ['ab ', ' €/Monat'], hu: ['', ' €/hó-tól'], fr: ['dès ', ' €/mois'], it: ['da ', ' €/mese'], es: ['desde ', ' €/mes'] };
    const ROOTS = [['pl', null], ['ch', null], ['eu', null], ['sk', /^(en|de|hu)\//], ['cs', /^(en|de)\//]];
    let dp = 0;
    for (const [d, only] of ROOTS) {
      const root = path.join(DIST, d);
      for (const f of walk(root, [])) {
        if (!/\.html$/.test(f)) continue;
        const rel = path.relative(root, f).split(path.sep).join('/'); if (only && !only.test(rel)) continue;
        const s = fs.readFileSync(f, 'utf8'); if (s.indexOf('data-price="') < 0 && !/\/(?:mes|měs)\./.test(s)) continue;
        const lg = ((s.match(/<html[^>]*\slang="([a-z]{2})/i) || [])[1] || '').toLowerCase(); const U = UNIT[lg]; if (!U) continue;
        const unit = U[1].slice(U[1].indexOf('/') + 1);
        // „od 1 149 €/mes.”, „od CHF 1’030/mes.”, „od 27 260 Kč/měs.”, „od 1 114 € (≈ 4 890 zł)/mes.” — a gomb data-price-ában és a listákban is
        const h = s.replace(/data-price="([^"]*?)od ([^"<>]{1,40}?\d[^"<>]{0,40}?)\/(?:mes|měs)\."/g, (m, pre, n) => 'data-price="' + pre + U[0] + n + '/' + unit + '"')
          .replace(/>od ([^"<>]{1,40}?\d[^"<>]{0,40}?)\/(?:mes|měs)\.(\s*)</g, (m, n, ws) => '>' + U[0] + n + '/' + unit + ws + '<');
        if (h !== s) { fs.writeFileSync(f, h); dp++; }
      }
    }
    console.log('[skcz-fix1104] data-price nyelvi forma: ' + dp + ' oldal');
  } catch (e) { console.log('[skcz-fix1104] data-price hiba:', e && e.message); }
}
