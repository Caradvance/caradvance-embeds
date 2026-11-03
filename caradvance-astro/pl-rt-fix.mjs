// rt-pl: a szlovák alapból öröklött runtime-részek lengyelre igazítása (Marc, 2026-11-04 — űrlap)
const XD_PL = {"pcs":"szt.","now":"dostępne od zaraz","more":"kolejne samochody","newcar":"Przekazujemy fabrycznie nowy samochód z przebiegiem 0 km.","newcars":"Fabrycznie nowe samochody z przebiegiem 0 km.","none":"Obecnie brak egzemplarzy dostępnych od zaraz","soon":"Wkrótce dostępne",
"mon":{"január":"styczeń","február":"luty","március":"marzec","április":"kwiecień","május":"maj","június":"czerwiec","július":"lipiec","augusztus":"sierpień","szeptember":"wrzesień","október":"październik","november":"listopad","december":"grudzień"},
"fuel":{"benzin":"benzyna","dízel":"diesel","diesel":"diesel","elektromos":"elektryczny","hibrid":"hybryda","plug-in hibrid":"hybryda plug-in"},
"fuelAdj":{"benzin":"benzynowy","dízel":"diesel","diesel":"diesel","elektromos":"elektryczny","hibrid":"hybrydowy","plug-in hibrid":"hybrydowy plug-in"},
"gear":{"Automata":"automatyczna","Manuális":"manualna"},
"drive":{"Hátsókerék":"napęd na tył","Hátsókerékhajtás":"napęd na tył","Összkerék":"napęd na cztery koła","Összkerékhajtás":"napęd na cztery koła","Elsőkerék":"napęd na przód","Elsőkerékhajtás":"napęd na przód"},
"body":{"Cabrio":"kabriolet","Kabrió":"kabriolet","SUV":"SUV","Sportautó":"samochód sportowy","Limuzin":"limuzyna","Kombi":"kombi","Coupé":"coupé","Egyterű":"minivan","Kisautó":"mały samochód","Terepjáró":"samochód terenowy","prémium autó":"samochód premium"},
"premCat":"samochodów premium","cls":"Klasa $1","lim":"Limuzyna","door":"drzwiowy",
"rent":"Wynajem $1","rentFrom":"Wynajem $1 — wynajem długoterminowy od $2 €/mies.","ltNew":"Wynajem długoterminowy $1 — fabrycznie nowy $2 w opłacie miesięcznej","rentNewLt":"Wynajem $1 — fabrycznie nowy $2 w wynajmie długoterminowym","how":"Wynajem $1 — jak działa wynajem długoterminowy","which":"Który model $1 mogę wynająć?","cmp":"Porównanie wersji $1","why":"Dlaczego $1",
"tell":"Napisz nam, która wersja $1, kolor i termin rozpoczęcia Cię interesują — przygotujemy bezpłatną ofertę dopasowaną do Ciebie.","faq":"Najczęstsze pytania o wynajem $1",
"fee":"Opłata miesięczna obejmuje korzystanie z fabrycznie nowego samochodu $1 z ustalonym limitem kilometrów; serwis, podatek oraz komplet opon letnich i zimowych pokrywamy my. Dokładne warunki podajemy z góry na piśmie w ofercie.",
"who":"Czy $1 może wynająć osoba prywatna i firma?","yes":"Tak, wynajem długoterminowy $1 jest dostępny dla osób prywatnych i firm. Dla firmy czynsz stanowi koszt uzyskania przychodu.","sim":"Podobne modele $1 do wynajęcia","quote":"Wynajem $1 — poproś o ofertę","lt":"Wynajem długoterminowy $1","km":"Jaki jest limit kilometrów w wynajmie długoterminowym $1?",
"meta":"Wynajem i wynajem długoterminowy $1 od $2 €/mies.: limit $3 km/mies., od $4 mies., kaucja od $5 €.","sold":"Sprzedany: $1. Szukasz podobnego samochodu? Zobacz aktualną ofertę.","sale":"Na sprzedaż $1. Cena $2. Sprawdzony import z Niemiec z udokumentowaną historią od CarAdvance.","desc":"$1 – $2, $3. $4 KM, $5, $6. Cena netto z gwarancją, import CarAdvance.",
"min":"$1 min","minr":"$1 min czytania","soldOn":"Sprzedany: $1","saleShort":"Na sprzedaż $1. Cena $2.","soldRef":"Sprzedany · $1 · podobny sprowadzimy dla Ciebie.",
"view":{"oldalnézet":"widok z boku","elölnézet":"widok z przodu","hátulnézet":"widok z tyłu"},
"nav":"Orientacyjna cena paliwa według węgierskiego urzędu NAV, $1 $2 – aktualizowana automatycznie co miesiąc","cheaper":"Przy miesięcznym przebiegu $1 km <g0>$2</g0> jest miesięcznie <g1>tańszy o $3</g1>.","suit":"$1 walizek kabinowych (szacunkowo)",
"gPop":"<g0>$1</g0> to popularny wybór w kategorii $2. W <g1>wynajmie długoterminowym</g1> możesz nim jeździć bez zamrażania dużej kwoty: płacisz jedną <g2>opłatę miesięczną</g2>, a serwisem, podatkiem i oponami zajmujemy się my. Na tym polega <g3>długoterminowy wynajem samochodu</g3>: przewidywalne koszty, nowy samochód i żadnych kłopotów z odsprzedażą.",
"gVar":"Obecnie możesz wynająć wersję <g0>$1</g0> ($2) od $3 €/mies.","gLease":"Wolisz leasing? Możliwości <g0>leasingu $1</g0> i finansowania znajdziesz na stronie Finansowanie – leasing.","gOrder":"$1 możesz mieć również <g0>na zamówienie</g0> prosto z Niemiec — pod klucz.",
"gOrderPrice":"<g0>od <g2>$1 €</g2> <g1>netto</g1></g0> <g3>Zamów</g3>","gRentPrice":"<g0><g1>netto</g1> od <g2>$1 €</g2>/mies.</g0><g3>Poproś o wynajem</g3>"};
function objEnd(t, i) { let d = 0, s = false, e = false; for (let k = i; k < t.length; k++) { const c = t[k]; if (s) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') s = false; continue; } if (c === '"') s = true; else if (c === '{') d++; else if (c === '}') { d--; if (d === 0) return k + 1; } } return -1; }
export function plRt(b, l) {
  b = b.replace(/'info@caradvance\.sk'\)/g, "'info@caradvance.hu')");            // a .pl kapcsolattartója a magyar központ
  if (l !== 'pl') return b;
  if (!/var UNITS=\{pl:/.test(b)) b = b.replace('var UNITS={', 'var UNITS={pl:{m:"/mies.",p:"od"},');
  const i = b.indexOf('var XD='); if (i > -1) { const j = objEnd(b, i + 7); if (j > 0) b = b.slice(0, i + 7) + JSON.stringify(XD_PL) + b.slice(j); }
  b = b.split("replace(/\\bLE\\b/g,'k')").join("replace(/\\bLE\\b/g,'KM')");
  b = b.split("(LG==='cs'?' míst':' miest')").join("(LG==='cs'?' míst':LG==='pl'?' miejsc':' miest')");
  return b;
}
