/**
 * CarAdvance — caradvance.sk / caradvance.cz: maradék magyar szövegek fordítása (build lépés, a seo-perf.mjs hívja
 * a skcz-slugs.mjs UTÁN).
 *
 *  1. A futásidejű fordítóba (i18n/rt-sk.js, rt-cs.js) beírja a hiányzó szövegeket (skcz-text-data.mjs),
 *     és sablon-szabályokat ad hozzá (készlet-szöveg, autó-leírás, modelloldal-mondatok, dátum, perc).
 *  2. Ugyanezt a fordítót a buildben is lefuttatja a dist/sk és dist/cs összes HTML-oldalán
 *     (szövegek, title, meta description, og:*, alt, JSON-LD, linkek) — így a Google és a látogató
 *     már a letöltött HTML-ben szlovák / cseh szöveget és szlovák / cseh linket kap, nem csak JS után.
 *  3. A blog főoldalán a kártyák címét / kivonatát a cikkoldalakból veszi, a csak magyar cikkek kártyáit törli.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { M as XM, G as XGL } from './skcz-text-data.mjs';

const NUM = /\d+(?:[.,\u00a0\u202f ]\d+)*/g;

// ---------- 1. szótár-sablonok ----------
function tmplText(hu, tgt) {
  const nums = [];
  const key = hu.replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; });
  if (!nums.length) return [hu, tgt];
  const used = new Set();
  const val = tgt.replace(NUM, (m) => { const i = nums.findIndex((n, j) => n === m && !used.has(j)); if (i < 0) return m; used.add(i); return '{' + (i + 1) + '}'; });
  return [key, val];
}
function tmplG(hu, tgt) {
  const nums = [];
  const key = hu.split(/(<\/?[gx]\d+\/?>)/).map((x, i) => (i % 2 ? x : x.replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; }))).join('');
  if (!nums.length) return [hu, tgt];
  const used = new Set();
  const val = tgt.split(/(<\/?[gx]\d+\/?>)/).map((x, i) => (i % 2 ? x : x.replace(NUM, (m) => { const k = nums.findIndex((n, j) => n === m && !used.has(j)); if (k < 0) return m; used.add(k); return '{' + (k + 1) + '}'; }))).join('');
  return [key, val];
}
function extra(l) {
  const c = l === 'sk' ? 1 : 2; const m = {}; const g = {};
  for (const e of XM) { const [k, v] = tmplText(e[0], e[c]); m[k] = v; if (k !== e[0]) m[e[0]] = e[c]; }
  for (const e of XGL) { const [k, v] = tmplG(e[0], e[c]); g[k] = v; }
  // Csehországban az árak koronában (Kč) jelennek meg: minden €-s kulcs Kč-s változata is kell
  if (l === 'cs') {
    const kc = (o) => { for (const k of Object.keys(o)) if (k.includes('€')) { const k2 = k.split('€').join('Kč'); if (!(k2 in o)) o[k2] = o[k].split('€').join('Kč'); } };
    kc(m); kc(g);
  }
  return { m, g };
}

// ---------- sablon-szabályok (ES5, a böngészőben és itt is fut) ----------
const XD = {
  sk: {
    pcs: 'ks', now: 'ihneď k dispozícii', more: 'ďalšie autá', newcar: 'Odovzdávame úplne nové auto s 0 km.', newcars: 'Úplne nové autá s 0 km.',
    none: 'Momentálne nie je ihneď k dispozícii žiadny kus', soon: 'Čoskoro k dispozícii',
    mon: { 'január': 'január', 'február': 'február', 'március': 'marec', 'április': 'apríl', 'május': 'máj', 'június': 'jún', 'július': 'júl', 'augusztus': 'august', 'szeptember': 'september', 'október': 'október', 'november': 'november', 'december': 'december' },
    fuel: { 'benzin': 'benzín', 'dízel': 'diesel', 'diesel': 'diesel', 'elektromos': 'elektrina', 'hibrid': 'hybrid', 'plug-in hibrid': 'plug-in hybrid' },
    fuelAdj: { 'benzin': 'benzín', 'dízel': 'diesel', 'diesel': 'diesel', 'elektromos': 'elektrický', 'hibrid': 'hybrid', 'plug-in hibrid': 'plug-in hybrid' },
    gear: { 'Automata': 'automat', 'Manuális': 'manuál' },
    drive: { 'Hátsókerék': 'zadný náhon', 'Hátsókerékhajtás': 'zadný náhon', 'Összkerék': 'pohon všetkých kolies', 'Összkerékhajtás': 'pohon všetkých kolies', 'Elsőkerék': 'predný náhon', 'Elsőkerékhajtás': 'predný náhon' },
    body: { 'Cabrio': 'kabriolet', 'Kabrió': 'kabriolet', 'SUV': 'SUV', 'Sportautó': 'športové auto', 'Limuzin': 'limuzína', 'Kombi': 'kombi', 'Coupé': 'kupé', 'Egyterű': 'MPV', 'Kisautó': 'malé auto', 'Terepjáró': 'terénne auto' },
    cls: 'trieda $1', lim: 'Limuzína', door: 'dverová',
    rent: 'Prenájom $1', rentFrom: 'Prenájom $1 — dlhodobý prenájom od $2 €/mes.', ltNew: 'Dlhodobý prenájom $1 — úplne nové $2 za mesačný poplatok',
    rentNewLt: 'Prenájom $1 — úplne nové $2 v dlhodobom prenájme', how: 'Prenájom $1 — ako funguje dlhodobý prenájom', which: 'Ktoré $1 si môžem prenajať?',
    cmp: 'Porovnanie verzií $1', why: 'Prečo $1', tell: 'Napíšte nám, ktorá verzia $1, farba a termín začiatku vás zaujíma — pripravíme bezplatnú ponuku na mieru.',
    faq: 'Časté otázky o prenájme $1', fee: 'Mesačný poplatok zahŕňa používanie úplne nového auta $1 s dohodnutým limitom kilometrov; servis, daň a sadu letných a zimných pneumatík hradíme my. Presné podmienky vopred písomne uvedieme v ponuke.',
    who: 'Môže si $1 prenajať súkromná osoba aj firma?', yes: 'Áno, dlhodobý prenájom $1 je dostupný pre súkromné osoby aj firmy. Pre firmu je nájomné daňovo uznateľným nákladom.',
    sim: 'Podobné modely $1 na prenájom', quote: 'Prenájom $1 — požiadajte o ponuku', lt: 'Dlhodobý prenájom $1', km: 'Aký je limit kilometrov pri dlhodobom prenájme $1?',
    meta: 'Prenájom a dlhodobý prenájom $1 od $2 €/mes.: limit $3 km/mes., od $4 mesiacov, kaucia od $5 €.',
    sold: 'Predané: $1. Hľadáte podobné auto? Pozrite si aktuálnu ponuku.', sale: 'Na predaj $1. Cena $2. Overený dovoz z Nemecka s preukázanou históriou od CarAdvance.',
    desc: '$1 – $2, $3. $4 k, $5, $6. Cena bez DPH so zárukou, dovoz CarAdvance.', min: '$1 min', minr: '$1 min čítania',
    gPop: '<g0>$1</g0> je obľúbenou voľbou v kategórii $2. V <g1>dlhodobom prenájme</g1> ho môžete jazdiť bez toho, aby ste doň viazali veľkú sumu: platíte jeden <g2>mesačný poplatok</g2>, servis, daň a pneumatiky vybavíme my. To je podstata <g3>dlhodobého prenájmu auta</g3>: predvídateľné náklady, nové auto a žiadne starosti s ďalším predajom.',
    gVar: 'Momentálne si môžete prenajať verziu <g0>$1</g0> ($2) od $3 €/mes.',
    gLease: 'Radšej lízing? Pozrite si možnosti <g0>lízingu $1</g0> a financovania v kalkulačke.',
    gOrder: '$1 môžete mať aj <g0>na objednávku</g0> priamo z Nemecka — na kľúč.',
    gOrderPrice: '<g0>od <g2>$1 €</g2> <g1>bez DPH</g1></g0> <g3>Objednať</g3>',
    gRentPrice: '<g0><g1>bez DPH</g1> od <g2>$1 €</g2>/mes.</g0><g3>Požiadať o prenájom</g3>'
  },
  cs: {
    pcs: 'ks', now: 'ihned k dispozici', more: 'další vozy', newcar: 'Předáváme zcela nový vůz s 0 km.', newcars: 'Zcela nové vozy s 0 km.',
    none: 'Momentálně není ihned k dispozici žádný kus', soon: 'Brzy k dispozici',
    mon: { 'január': 'leden', 'február': 'únor', 'március': 'březen', 'április': 'duben', 'május': 'květen', 'június': 'červen', 'július': 'červenec', 'augusztus': 'srpen', 'szeptember': 'září', 'október': 'říjen', 'november': 'listopad', 'december': 'prosinec' },
    fuel: { 'benzin': 'benzín', 'dízel': 'diesel', 'diesel': 'diesel', 'elektromos': 'elektřina', 'hibrid': 'hybrid', 'plug-in hibrid': 'plug-in hybrid' },
    fuelAdj: { 'benzin': 'benzín', 'dízel': 'diesel', 'diesel': 'diesel', 'elektromos': 'elektrický', 'hibrid': 'hybrid', 'plug-in hibrid': 'plug-in hybrid' },
    gear: { 'Automata': 'automat', 'Manuális': 'manuál' },
    drive: { 'Hátsókerék': 'zadní náhon', 'Hátsókerékhajtás': 'zadní náhon', 'Összkerék': 'pohon všech kol', 'Összkerékhajtás': 'pohon všech kol', 'Elsőkerék': 'přední náhon', 'Elsőkerékhajtás': 'přední náhon' },
    body: { 'Cabrio': 'kabriolet', 'Kabrió': 'kabriolet', 'SUV': 'SUV', 'Sportautó': 'sportovní vůz', 'Limuzin': 'limuzína', 'Kombi': 'kombi', 'Coupé': 'kupé', 'Egyterű': 'MPV', 'Kisautó': 'malý vůz', 'Terepjáró': 'terénní vůz' },
    cls: 'třída $1', lim: 'Limuzína', door: 'dveřová',
    rent: 'Pronájem $1', rentFrom: 'Pronájem $1 — dlouhodobý pronájem od $2 €/měs.', ltNew: 'Dlouhodobý pronájem $1 — zcela nové $2 za měsíční poplatek',
    rentNewLt: 'Pronájem $1 — zcela nové $2 v dlouhodobém pronájmu', how: 'Pronájem $1 — jak funguje dlouhodobý pronájem', which: 'Které $1 si mohu pronajmout?',
    cmp: 'Srovnání verzí $1', why: 'Proč $1', tell: 'Napište nám, která verze $1, barva a termín zahájení vás zajímá — připravíme bezplatnou nabídku na míru.',
    faq: 'Časté dotazy k pronájmu $1', fee: 'Měsíční poplatek zahrnuje užívání zcela nového vozu $1 s dohodnutým limitem kilometrů; servis, daň a sadu letních a zimních pneumatik hradíme my. Přesné podmínky předem písemně uvedeme v nabídce.',
    who: 'Může si $1 pronajmout soukromá osoba i firma?', yes: 'Ano, dlouhodobý pronájem $1 je dostupný pro soukromé osoby i firmy. Pro firmu je nájemné daňově uznatelným nákladem.',
    sim: 'Podobné modely $1 k pronájmu', quote: 'Pronájem $1 — požádejte o nabídku', lt: 'Dlouhodobý pronájem $1', km: 'Jaký je limit kilometrů při dlouhodobém pronájmu $1?',
    meta: 'Pronájem a dlouhodobý pronájem $1 od $2 €/měs.: limit $3 km/měs., od $4 měsíců, kauce od $5 €.',
    sold: 'Prodáno: $1. Hledáte podobný vůz? Podívejte se na aktuální nabídku.', sale: 'Na prodej $1. Cena $2. Prověřený dovoz z Německa s doloženou historií od CarAdvance.',
    desc: '$1 – $2, $3. $4 k, $5, $6. Cena bez DPH se zárukou, dovoz CarAdvance.', min: '$1 min', minr: '$1 min čtení',
    gPop: '<g0>$1</g0> je oblíbenou volbou v kategorii $2. V <g1>dlouhodobém pronájmu</g1> s ním můžete jezdit, aniž byste do něj vázali velkou částku: platíte jediný <g2>měsíční poplatek</g2>, servis, daň a pneumatiky zařídíme my. To je podstata <g3>dlouhodobého pronájmu auta</g3>: předvídatelné náklady, nový vůz a žádné starosti s dalším prodejem.',
    gVar: 'Momentálně si můžete pronajmout verzi <g0>$1</g0> ($2) od $3 €/měs.',
    gLease: 'Raději leasing? Podívejte se na možnosti <g0>leasingu $1</g0> a financování v kalkulačce.',
    gOrder: '$1 můžete mít i <g0>na objednávku</g0> přímo z Německa — na klíč.',
    gOrderPrice: '<g0>od <g2>$1 €</g2> <g1>bez DPH</g1></g0> <g3>Objednat</g3>',
    gRentPrice: '<g0><g1>bez DPH</g1> od <g2>$1 €</g2>/měs.</g0><g3>Poptat pronájem</g3>'
  }
};

// A futásidejű fordítóba kerülő kód (ES5). Az XD táblát a build írja be.
const XR_SRC = String.raw`
var XD=__XD__;
var XMON='(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)';
var XMI={'január':1,'február':2,'március':3,'április':4,'május':5,'június':6,'július':7,'augusztus':8,'szeptember':9,'október':10,'november':11,'december':12};
function XF(t,a){return t.replace(/\$(\d)/g,function(_,i){return a[+i]==null?'':a[+i]})}
function XN(n){n=String(n).trim();var t=M[n];if(t!=null)return t;return n.replace(/(\d)-(as|es|os|ös|ás|és)(?=\s|$)/g,'$1').replace(/\b([A-Z])-osztály\b/g,XD.cls).replace(/\bLimuzin\b/g,XD.lim).replace(/\bajtós\b/g,XD.door);}
function XOK(x){return !!x&&/^[A-Z0-9]/.test(x)&&!/[őűöüŐŰÖÜ]/.test(x)&&!/(^|\s)(és|vagy|az|a|egy|bérlés|bérlet|tartós|autó|autók)(\s|$)/i.test(x);}
function XNN(n){var x=XN(n);return XOK(x)?x:null;}
function XLIST(s){return s.replace(new RegExp(XMON,'g'),function(m){return XD.mon[m]}).replace(/(\d+) db\b/g,'$1 '+XD.pcs);}
function XT(s){return s.replace(/\bLE\b/g,'k').replace(/\bplug-in hibrid\b/g,XD.fuelAdj['plug-in hibrid']).replace(/\bdízel\b/g,'diesel').replace(/\bbenzin\b/g,XD.fuelAdj.benzin).replace(/\bhibrid\b/g,'hybrid').replace(/\belektromos\b/g,XD.fuelAdj.elektromos).replace(/\bAutomata\b/g,XD.gear.Automata).replace(/\bManuális\b/g,XD.gear['Manuális']);}
var XRR=[
 [/^(\d+) db (.+?) azonnal elérhető(?:; további autók: (.+?))?\. Vadonatúj, 0 km-es autót adunk át\.$/,function(m){var n=XNN(m[2]);if(!n)return null;return m[1]+' '+XD.pcs+' '+n+' '+XD.now+(m[3]?'; '+XD.more+': '+XLIST(m[3]):'')+'. '+XD.newcar;}],
 [/^Jelenleg nincs azonnal elérhető darab; további autók: (.+?)\. Vadonatúj, 0 km-es autót adunk át\.$/,function(m){return XD.none+'; '+XD.more+': '+XLIST(m[1])+'. '+XD.newcar;}],
 [/^Hamarosan elérhető; további autók — (.+?)\. Vadonatúj, 0 km-es autók\.$/,function(m){return XD.soon+'; '+XD.more+' — '+XLIST(m[1])+'. '+XD.newcars;}],
 [/^(\d+) db (.+)$/,function(m){var n=XNN(m[2]);return n?m[1]+' '+XD.pcs+' '+n:null;}],
 [/^A\(z\) (.+) (plug-in hibrid|benzin|dízel|diesel|elektromos|hibrid) üzemű ([^.]+)\. (\d+) LE, ([^,]+), ([^.]+)\. Nettó ár \(áfa nélkül\) garanciával, CarAdvance import\.$/,function(m){return XF(XD.desc,[0,m[1],XD.fuel[m[2]]||m[2],XD.body[m[3]]||m[3],m[4],XD.gear[m[5]]||m[5],XD.drive[m[6]]||m[6]]);}],
 [/^Elkelt: (.+)\. Hasonlót keresel\? Nézd meg az aktuális készletet\.$/,function(m){return XF(XD.sold,[0,XT(m[1])]);}],
 [/^Eladó (.+)\. Ára (.+?)\. Ellenőrzött előéletű német import a CarAdvance-től\.$/,function(m){return XF(XD.sale,[0,XT(m[1]),m[2]]);}],
 [/^(.+) bérlés és tartós bérlet (.+?) €\/hó-tól: (.+?) km\/hó futáskeret, (\d+) hónap, kaució (.+?) €-tól\.$/,function(m){var n=XNN(m[1]);return n?XF(XD.meta,[0,n,m[2],m[3],m[4],m[5]]):null;}],
 [/^(.+) bérlés — tartós bérlet (.+?) €\/hó-tól$/,function(m){var n=XNN(m[1]);return n?XF(XD.rentFrom,[0,n,m[2]]):null;}],
 [/^(.+) tartós bérlet — vadonatúj (\S+) havidíjjal$/,function(m){var n=XNN(m[1]);return n?XF(XD.ltNew,[0,n,XD.body[m[2]]||m[2]]):null;}],
 [/^(.+) bérlés — vadonatúj (\S+) tartós bérletben$/,function(m){var n=XNN(m[1]);return n?XF(XD.rentNewLt,[0,n,XD.body[m[2]]||m[2]]):null;}],
 [/^(.+) bérlés — így működik a tartós bérlet$/,function(m){var n=XNN(m[1]);return n?XF(XD.how,[0,n]):null;}],
 [/^(.+) bérlés — kérj ajánlatot$/,function(m){var n=XNN(m[1]);return n?XF(XD.quote,[0,n]):null;}],
 [/^Melyik (.+) bérelhető\?$/,function(m){var n=XNN(m[1]);return n?XF(XD.which,[0,n]):null;}],
 [/^(.+) változatok összehasonlítása$/,function(m){var n=XNN(m[1]);return n?XF(XD.cmp,[0,n]):null;}],
 [/^Miért a (.+)$/,function(m){var n=XNN(m[1]);return n?XF(XD.why,[0,n]):null;}],
 [/^Mondd el, melyik (.+) változat, szín és kezdési időpont érdekel — díjmentes, személyre szabott ajánlatot adunk\.$/,function(m){var n=XNN(m[1]);return n?XF(XD.tell,[0,n]):null;}],
 [/^Gyakori kérdések a (.+) bérléséről$/,function(m){var n=XNN(m[1]);return n?XF(XD.faq,[0,n]):null;}],
 [/^A havidíj a vadonatúj (.+) használatát tartalmazza a megadott futáskerettel; a szervizt, az adót és a nyári-téli gumiszettet mi álljuk\. A pontos feltételeket az ajánlatban előre, írásban rögzítjük\.$/,function(m){var n=XNN(m[1]);return n?XF(XD.fee,[0,n]):null;}],
 [/^Magánszemélyként és cégként is bérelhető a (.+)\?$/,function(m){var n=XNN(m[1]);return n?XF(XD.who,[0,n]):null;}],
 [/^Igen, a (.+) tartós bérlet magánszemélyeknek és cégeknek is elérhető\. Cégként a bérleti díj a könyvelésben elszámolható költség\.$/,function(m){var n=XNN(m[1]);return n?XF(XD.yes,[0,n]):null;}],
 [/^Hasonló bérelhető (.+) modellek$/,function(m){var n=XNN(m[1]);return n?XF(XD.sim,[0,n]):null;}],
 [/^Mekkora a futáskeret a (.+) tartós bérletnél\?$/,function(m){var n=XNN(m[1]);return n?XF(XD.km,[0,n]):null;}],
 [/^(.+) tartós bérlet$/,function(m){var n=XNN(m[1]);return n?XF(XD.lt,[0,n]):null;}],
 [/^(.+) bérlés$/,function(m){var n=XNN(m[1]);return n?XF(XD.rent,[0,n]):null;}],
 [new RegExp('^(\\d{4})\\. '+XMON+' (\\d{1,2})\\.$'),function(m){return m[3]+'. '+XMI[m[2]]+'. '+m[1];}],
 [/^(\d+) perc olvasás$/,function(m){return XF(XD.minr,[0,m[1]]);}],
 [/^(\d+) perc$/,function(m){return XF(XD.min,[0,m[1]]);}]
];
function XR(k){var kc=/Kč/.test(k);if(kc)k=k.replace(/Kč/g,'€');for(var i=0;i<XRR.length;i++){var m=k.match(XRR[i][0]);if(m){var r=XRR[i][1](m);if(r!=null)return kc?r.replace(/€/g,'Kč'):r;}}return null;}
var XGR=[
 [/^A <g0>(.+?)<\/g0> (\S+) kategóriájában népszerű választás\. <g1>Tartós bérletben<\/g1> úgy vezetheted, hogy nem kötsz le benne nagy összeget: egyetlen <g2>havi díjat<\/g2> fizetsz, a szervizt, az adót és a gumikat mi intézzük\. Ez a <g3>hosszú távú autóbérlés<\/g3> lényege: kiszámítható költség, új autó, továbbeladási gond nélkül\.$/,function(m){var n=XNN(m[1]);return n?XF(XD.gPop,[0,n,XD.body[m[2]]||m[2]]):null;}],
 [/^Jelenleg a\(z\) <g0>(.+?)<\/g0> kivitel bérelhető \(([^)]+)\), (.+?) €\/hó-tól\.$/,function(m){return XF(XD.gVar,[0,m[1],XD.fuelAdj[m[2]]||m[2],m[3]]);}],
 [/^Inkább lízingelnéd\? Nézd meg a <g0>(.+?) lízing<\/g0> és finanszírozás lehetőségeit a kalkulátorral\.$/,function(m){var n=XNN(m[1]);return n?XF(XD.gLease,[0,n]):null;}],
 [/^A (.+?) <g0>egyedi rendeléssel<\/g0> is a tiéd lehet Németországból — akár 19% német áfával, kulcsrakészen\.$/,function(m){var n=XNN(m[1]);return n?XF(XD.gOrder,[0,n]):null;}],
 [/^<g0><g1>nettó<\/g1> <g2>(.+?) €<\/g2>-tól<\/g0> <g3>Rendeld meg<\/g3>$/,function(m){return XF(XD.gOrderPrice,[0,m[1]]);}],
 [/^<g0><g1>nettó<\/g1><g2>(.+?) €<\/g2>\/hó-tól<\/g0><g3>Bérlés igénylése<\/g3>$/,function(m){return XF(XD.gRentPrice,[0,m[1]]);}]
];
function XG(k){var kc=/Kč/.test(k);if(kc)k=k.replace(/Kč/g,'€');for(var i=0;i<XGR.length;i++){var m=k.match(XGR[i][0]);if(m){var r=XGR[i][1](m);if(r!=null)return kc?r.replace(/€/g,'Kč'):r;}}return null;}
`;

/** rt-<l>.js kiegészítése: extra M/G elemek + XR/XG szabályok. Idempotens. */
function patchRt(src, l) {
  if (src.includes('function XR(k)')) return src;
  const { m, g } = extra(l);
  let s = src;
  const mj = JSON.stringify(m); const gj = JSON.stringify(g);
  const rep = (a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('rt anchor missing: ' + a); s = s.slice(0, i) + b + s.slice(i + a.length); };
  if (Object.keys(m).length) rep('var M={', 'var M=' + mj.slice(0, -1) + ',');
  if (Object.keys(g).length) rep('var G={', 'var G=' + gj.slice(0, -1) + ',');
  const code = XR_SRC.split('__XD__').join(JSON.stringify(XD[l]));
  rep('function tr(s){', code + 'function tr(s){');
  rep("if(r==null&&k.indexOf(' · ')>0)", "if(r==null)r=XR(k);if(r==null&&k.indexOf(' · ')>0)");
  rep('if(t==null)return;e.__ig=1;', 'if(t==null)t=XG(u.k);if(t==null)return;e.__ig=1;');
  rep('if(r==null||r===k)return null;var a=s.match', "if(r!=null)r=r.replace(/\\b(?:info|sales)@caradvance\\.hu\\b/g,'info@caradvance." + (l === 'cs' ? 'cz' : 'sk') + "');if(r==null||r===k)return null;var a=s.match");
  return s;
}

/** A (kiegészített) futásidejű fordító betöltése Node-ban. */
function loadRt(src, l) {
  const host = l === 'sk' ? 'www.caradvance.sk' : 'www.caradvance.cz';
  const code = src.replace("if(document.body)run();else document.addEventListener('DOMContentLoaded',run);",
    'globalThis.__X={tr:tr,G:G,M:M,PG:PG,SL:SL,CUR:CUR,XG:XG,LG:LG};');
  const ctx = { window: {}, location: { hostname: host }, document: { addEventListener() {}, body: null }, navigator: {}, console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 20000 });
  return ctx.__X;
}

// ---------- 2. minimális HTML-fa (pontos visszaírással) ----------
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
function parse(html) {
  const root = { type: 'root', children: [] }; const st = [root];
  const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  let i = 0, m;
  const text = (t) => { if (t) st[st.length - 1].children.push({ type: 'text', raw: t }); };
  while ((m = re.exec(html))) {
    text(html.slice(i, m.index)); i = re.lastIndex;
    const top = st[st.length - 1];
    if (m[1]) { // záró tag
      const name = m[1].toLowerCase(); let k = st.length - 1;
      while (k > 0 && st[k].name !== name) k--;
      if (k === 0) { top.children.push({ type: 'text', raw: m[0], lit: 1 }); continue; }
      st[k].close = m[0]; st.length = k; continue;
    }
    if (!m[2]) { top.children.push({ type: 'text', raw: m[0], lit: 1 }); continue; } // komment, doctype
    const name = m[2].toLowerCase();
    const el = { type: 'el', name, open: m[0], children: [], close: '' };
    top.children.push(el);
    if (VOID.has(name) || m[0].endsWith('/>')) continue;
    if (RAW.has(name)) { // nyers tartalom a záró tagig
      const end = html.toLowerCase().indexOf('</' + name, i);
      const e2 = end < 0 ? html.length : end;
      if (e2 > i) el.children.push({ type: 'text', raw: html.slice(i, e2), rawtext: name !== 'title' && name !== 'textarea' ? 1 : 0 });
      const cm = /^<\/[a-zA-Z][\w:-]*\s*>/.exec(html.slice(e2));
      el.close = cm ? cm[0] : ''; i = e2 + (cm ? cm[0].length : 0); re.lastIndex = i; continue;
    }
    st.push(el);
  }
  text(html.slice(i));
  return root;
}
function ser(n) {
  if (n.type === 'text') return n.raw;
  const inner = n.children.map(ser).join('');
  return n.type === 'root' ? inner : n.open + inner + n.close;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', bdquo: '„', ldquo: '“', rdquo: '”', euro: '€', middot: '·', rarr: '→', larr: '←' };
const dec = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (w, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e.toLowerCase()] ?? w)));
const encT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const encA = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function getAttr(open, a) {
  const m = new RegExp('\\s' + a + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(open);
  return m ? dec(m[1] ?? m[2] ?? m[3] ?? '') : null;
}
function setAttr(el, a, v) {
  const re = new RegExp('(\\s' + a + '\\s*=\\s*)(?:"[^"]*"|\'[^\']*\'|[^\\s>]+)', 'i');
  el.open = el.open.replace(re, (w, p) => p + '"' + encA(v) + '"');
}

const IL = new Set(['a', 'b', 'strong', 'em', 'i', 'u', 'span', 'small', 'mark', 'sup', 'sub', 'abbr', 'br', 'wbr']);
const VD = new Set(['br', 'wbr', 'img']);
const SKIP = new Set(['script', 'style', 'textarea', 'code', 'pre', 'noscript']);
const AT = ['placeholder', 'title', 'aria-label', 'alt'];
const META = /^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)$/i;

function makeTranslator(X, l) {
  const { tr, G, PG, SL } = X;
  const cur = (s) => (X.CUR ? X.CUR(s) : s);
  const MAIL = 'info@caradvance.' + (l === 'cs' ? 'cz' : 'sk');
  const mail = (s) => s.replace(/\b(?:info|sales)@caradvance\.hu\b/g, MAIL);
  const T = (s) => { const t = tr(s); const b = t != null ? t : s; const c = mail(cur(b)); return c !== s ? c : null; };
  const SUBJ = l === 'cs'
    ? [[/^Ajánlatkérés: /, 'Poptávka: '], [/^Hasonlót keresek: /, 'Hledám podobný vůz: '], [/^Auto eladas$/, 'Prodej vozu'], [/^Autó eladása – bizomány$/, 'Prodej vozu – komisní prodej'], [/^Ertekesitesi folyamat - kerdes$/, 'Proces prodeje – dotaz'], [/^Kerdes$/, 'Dotaz'], [/^Video$/, 'Video']]
    : [[/^Ajánlatkérés: /, 'Žiadosť o ponuku: '], [/^Hasonlót keresek: /, 'Hľadám podobné auto: '], [/^Auto eladas$/, 'Predaj auta'], [/^Autó eladása – bizomány$/, 'Predaj auta – komisionálny predaj'], [/^Ertekesitesi folyamat - kerdes$/, 'Proces predaja – otázka'], [/^Kerdes$/, 'Otázka'], [/^Video$/, 'Video']];
  function mailto(h) {
    const m = /^mailto:([^?]*)(\?.*)?$/i.exec(h); if (!m) return h;
    let q = m[2] || '';
    q = q.replace(/([?&]subject=)([^&]*)/i, (w, k, v) => {
      let d; try { d = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { return w; }
      let t = tr(d); if (t == null) { t = d; for (const [re, r] of SUBJ) if (re.test(t)) { t = t.replace(re, r); break; } }
      return k + encodeURIComponent(t);
    });
    return 'mailto:' + mail(m[1]) + q;
  }
  function ukey(e) {
    const tags = []; let out = '', ok = true, hasEl = false, hasTx = false;
    (function w(ns) {
      for (const c of ns) {
        if (!ok) return;
        if (c.type === 'text') { if (c.lit) { ok = false; return; } const v = dec(c.raw); out += v; if (/\S/.test(v)) hasTx = true; }
        else if (c.type === 'el') {
          if (!IL.has(c.name)) { ok = false; return; }
          hasEl = true; const j = tags.length; tags.push(c);
          if (VD.has(c.name)) out += '<x' + j + '/>'; else { out += '<g' + j + '>'; w(c.children); out += '</g' + j + '>'; }
        }
      }
    })(e.children);
    if (!ok || !hasEl || !hasTx) return null;
    return { k: out.replace(/\s+/g, ' ').trim(), tags };
  }
  function inl(e) {
    if (!e.children.length || e.children.length < 2) return false;
    const u = ukey(e); if (!u) return false;
    let t = G[u.k]; const nums = [];
    if (t == null) {
      const mk = u.k.split(/(<\/?[gx]\d+\/?>)/).map((x, i) => (i % 2 ? x : x.replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; }))).join('');
      t = G[mk]; if (t != null) t = t.replace(/\{(\d+)\}/g, (_, i) => nums[i - 1] || '');
    }
    if (t == null) t = X.XG(u.k);
    if (t == null) return false;
    const used = {}; const root = { children: [] }; const st = [root];
    const re = /<(\/?)([gx])(\d+)(\/?)>|([^<]+)/g; let m;
    while ((m = re.exec(t))) {
      const top = st[st.length - 1];
      if (m[5] !== undefined) { top.children.push({ type: 'text', raw: encT(m[5]), done: 1 }); continue; }
      const o = u.tags[+m[3]]; if (!o) continue;
      if (m[1]) { if (st.length > 1) st.pop(); continue; }
      const n = { type: 'el', name: o.name, open: o.open, close: o.close, children: [] };
      used[m[3]] = 1; top.children.push(n);
      if (m[2] === 'g' && !m[4]) st.push(n);
    }
    e.children = root.children;
    return true;
  }
  function lk(e) {
    if (e.name === 'a') { const h0 = getAttr(e.open, 'href'); if (h0 && /^mailto:/i.test(h0)) { const n0 = mailto(h0); if (n0 !== h0) setAttr(e, 'href', n0); return; } }
    if (e.name !== 'a' || getAttr(e.open, 'hreflang') != null) return;
    if (/langopt/.test(getAttr(e.open, 'class') || '')) return;
    const h = getAttr(e.open, 'href'); if (!h) return;
    const m = h.match(/^(?:https?:\/\/(?:www\.)?caradvance\.hu)?(\/[^?#]*)([?#].*)?$/); if (!m) return;
    const p = m[1];
    if (/^\/(en|de|fr|uk|zh|sk|cs|_np|api|i18n)\//.test(p) || /\.[a-z0-9]{2,5}$/i.test(p)) return;
    let n = p.slice(-1) === '/' ? p : p + '/';
    let t;
    if (n === '/berelheto/') t = (SL['/autoink/'] || '/' + l + '/autoink/') + '#berelheto';
    else { if (!PG[n]) return; if (typeof PG[n] === 'string') n = PG[n]; t = (SL[n] || ('/' + l + n)) + (m[2] || ''); }
    if (t !== h) setAttr(e, 'href', t);
  }
  function attrs(e) {
    for (const a of AT) { const v = getAttr(e.open, a); if (v) { const t = tr(v); if (t != null) setAttr(e, a, t); } }
    if (e.name === 'meta') {
      const nm = getAttr(e.open, 'name') || getAttr(e.open, 'property') || '';
      if (META.test(nm)) { const v = getAttr(e.open, 'content'); if (v) { const t = tr(v); if (t != null) setAttr(e, 'content', t); } }
    }
    if (e.name === 'input' && /^(submit|button)$/i.test(getAttr(e.open, 'type') || '')) { const v = getAttr(e.open, 'value'); if (v) { const t = tr(v); if (t != null) setAttr(e, 'value', t); } }
  }
  function ld(e) {
    if (!/application\/ld\+json/i.test(getAttr(e.open, 'type') || '')) return;
    const c = e.children[0]; if (!c) return;
    let o; try { o = JSON.parse(c.raw); } catch (x) { return; }
    let ch = false;
    (function w(x) {
      if (Array.isArray(x)) { x.forEach((v, i) => { if (typeof v === 'string') { const t = tr(v); if (t != null) { x[i] = t; ch = true; } } else w(v); }); return; }
      if (x && typeof x === 'object') for (const k of Object.keys(x)) {
        const v = x[k];
        if (typeof v === 'string' && /@caradvance\.hu\b/.test(v)) { x[k] = mail(v); ch = true; }
        else if (typeof v === 'string' && /^(name|description|headline|text|alternateName|caption|articleSection|about|disambiguatingDescription)$/.test(k)) { const t = tr(v); if (t != null) { x[k] = t; ch = true; } }
        else if (v && typeof v === 'object') w(v);
      }
    })(o);
    if (ch) c.raw = JSON.stringify(o).replace(/<\//g, '<\\/');
  }
  function walk(e) {
    if (e.type === 'text') {
      if (e.lit || e.done || e.rawtext) return;
      const v = dec(e.raw); if (!/\S/.test(v)) return;
      const t = T(v); if (t != null && t !== v) e.raw = encT(t);
      return;
    }
    if (e.type === 'el') {
      if (e.name === 'script') { ld(e); return; }
      if (e.name !== 'style') attrs(e);                       // textarea placeholder is
      if (SKIP.has(e.name)) return;
      inl(e); lk(e);
    }
    for (const c of e.children) walk(c);
  }
  return (html) => { const r = parse(html); walk(r); return ser(r); };
}

// ---------- 3. blog főoldal: kártyák a szlovák / cseh cikkekből ----------
function fixBlogIndex(html, l, base, map) {
  const info = (loc) => {
    try {
      const h = fs.readFileSync(path.join(base, loc, 'index.html'), 'utf8');
      const t = (h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
      const d = (h.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1];
      return { title: t ? t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null, desc: d || null };
    } catch (e) { return {}; }
  };
  const cardRe = /<a\b[^>]*class="(bl-card|bl-feat)"[^>]*>[\s\S]*?<\/a>/g;
  const cards = [];
  html.replace(cardRe, (a, cls) => { cards.push({ a, cls }); return a; });
  if (!cards.length) return html;
  const keep = [];
  for (const c of cards) {
    const hu = (c.a.match(/href="([^"]+)"/) || [])[1] || '';
    const q = hu.replace(/^https:\/\/(?:www\.)?caradvance\.hu/, '');
    const loc = map[q];
    c.ok = !!(loc && loc !== '/blog/');
    if (!c.ok) continue;
    const inf = info(loc);
    let a = c.a.replace(/href="[^"]+"/, 'href="/' + l + loc + '"');
    if (inf.title) a = a.replace(/(class="bl-(?:card|feat)title"[^>]*>)[\s\S]*?(<\/span>)/, (w, p, s) => p + encT(dec(inf.title)) + s);
    if (inf.desc) a = a.replace(/(class="bl-(?:card|feat)exc"[^>]*>)[\s\S]*?(<\/span>)/, (w, p, s) => p + inf.desc + s);
    c.out = a; keep.push(c);
  }
  // ha a kiemelt cikk csak magyar: az első megmaradó kártya lesz a kiemelt
  const feat = cards.find((c) => c.cls === 'bl-feat');
  let promoted = null;
  if (feat && !feat.ok) {
    const first = keep.find((c) => c.cls === 'bl-card');
    if (first) {
      const g = (re) => (first.out.match(re) || [])[1];
      const href = g(/href="([^"]+)"/), img = g(/class="bl-cardimg"[^>]*style="([^"]*)"/), cat = g(/class="bl-cat"[^>]*>([\s\S]*?)<\/span>/),
        title = g(/class="bl-cardtitle"[^>]*>([\s\S]*?)<\/span>/), exc = g(/class="bl-cardexc"[^>]*>([\s\S]*?)<\/span>/), meta = g(/class="bl-meta"[^>]*>([\s\S]*?<\/span>)\s*<\/span>/);
      let a = feat.a.replace(/href="[^"]+"/, 'href="' + href + '"');
      if (img) a = a.replace(/(class="bl-featimg"[^>]*style=")[^"]*(")/, (w, p, s) => p + img + s);
      if (cat) a = a.replace(/(class="bl-cat"[^>]*>)[\s\S]*?(<\/span>)/, (w, p, s) => p + cat + s);
      if (title) a = a.replace(/(class="bl-feattitle"[^>]*>)[\s\S]*?(<\/span>)/, (w, p, s) => p + title + s);
      if (exc) a = a.replace(/(class="bl-featexc"[^>]*>)[\s\S]*?(<\/span>)/, (w, p, s) => p + exc + s);
      if (meta) a = a.replace(/(class="bl-meta"[^>]*>)[\s\S]*?<\/span>(\s*<\/span>)/, (w, p, s) => p + meta + s);
      feat.out = a; feat.ok = true; promoted = first;
    }
  }
  let i = 0;
  return html.replace(cardRe, () => { const c = cards[i++]; if (c === promoted) return ''; return c.ok ? c.out : ''; });
}

// ---------- futtatás ----------
export function run(DIST = 'dist') {
  const out = [];
  for (const l of ['sk', 'cs']) {
    const base = path.join(DIST, l);
    if (!fs.existsSync(path.join(base, 'index.html'))) continue;
    // 1. runtime
    let X = null; let rtn = 0;
    for (const d of [path.join(DIST, 'i18n'), path.join(DIST, '_np', 'i18n')]) {
      const f = path.join(d, 'rt-' + l + '.js');
      if (!fs.existsSync(f)) continue;
      const s = fs.readFileSync(f, 'utf8');
      const n = patchRt(s, l);
      if (n !== s) { fs.writeFileSync(f, n); rtn++; }
      if (!X) X = loadRt(n, l);
    }
    if (!X) { out.push(l + ': nincs rt'); continue; }
    let map = {};
    try { map = JSON.parse(fs.readFileSync(path.join(base, '_slugs.json'), 'utf8')); } catch (e) { /* nincs */ }
    // 3. blog főoldal
    let blog = 0;
    for (const bi of [path.join(base, 'blog', 'index.html')]) {
      if (!fs.existsSync(bi)) continue;
      const h = fs.readFileSync(bi, 'utf8'); const n = fixBlogIndex(h, l, base, map);
      if (n !== h) { fs.writeFileSync(bi, n); blog++; }
    }
    // 2. HTML-oldalak
    const translate = makeTranslator(X, l);
    let files = 0, changed = 0, errs = 0;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!e.name.endsWith('.html')) continue;
        files++;
        try {
          const h = fs.readFileSync(p, 'utf8'); const n = translate(h);
          if (n !== h) { fs.writeFileSync(p, n); changed++; }
        } catch (x) { errs++; }
      }
    })(base);
    out.push(`${l}: rt ${rtn} fájl, HTML ${changed}/${files} módosítva${errs ? ', hiba: ' + errs : ''}, blog-főoldal: ${blog}`);
  }
  return '[skcz-text] ' + (out.join(' | ') || 'nincs sk/cs');
}

// tesztekhez
export { patchRt, loadRt, makeTranslator, parse, ser, fixBlogIndex };
