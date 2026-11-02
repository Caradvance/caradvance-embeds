/**
 * CarAdvance chat — tudásbázis oldalanként (caradvance.hu / caradvance.sk / caradvance.cz).
 * Csak olyan tény kerül ide, ami a weboldalon is szerepel. Árakat, készletet a modell az élő
 * keresőindexből (kereses-index*.json) kap, nem innen — így mindig a weboldal aktuális adatait mondja.
 * Ha a weboldal szövege változik (pl. új kapcsolattartó), itt is frissíteni kell.
 */

export const SITES = {
  hu: {
    base: 'https://www.caradvance.hu',
    index: '/kereses-index.json',
    prefix: '',
    lang: 'hu',
    phone: '+36 30 233 6060',
    wa: '36302336060',
    email: 'info@caradvance.hu'
  },
  sk: {
    base: 'https://www.caradvance.sk',
    index: '/kereses-index-sk.json',
    prefix: '/sk',
    lang: 'sk',
    phone: '+421 915 410 555',
    wa: '421915410555',
    email: 'info@caradvance.sk'
  },
  pl: {
    base: 'https://www.caradvance.pl',
    indexBase: 'https://www.caradvance.hu',   // a keresőindex a közös Pages-projektben van (a .pl domain bekötése előtt is elérhető)
    index: '/kereses-index-pl.json',
    prefix: '/pl',
    lang: 'pl',
    phone: '+36 30 233 6060',
    wa: '36302336060',
    email: 'info@caradvance.hu'
  },
  eu: {
    base: 'https://www.caradvance.eu',
    indexBase: 'https://www.caradvance.hu',   // a keresőindex a közös Pages-projektben van
    index: '/kereses-index-eu-de.json',
    indexL: {"de": "/kereses-index-eu-de.json", "fr": "/kereses-index-eu-fr.json", "it": "/kereses-index-eu-it.json", "es": "/kereses-index-eu-es.json"},
    prefix: '/eu',
    lang: 'de',
    phone: '+49 89 99998 100',
    wa: '36302336060',
    email: 'import@caradvance.de'
  },
  ch: {
    base: 'https://www.caradvance.ch',
    indexBase: 'https://www.caradvance.hu',   // a keresőindex a közös Pages-projektben van
    index: '/kereses-index-ch-de.json',
    indexL: { de: '/kereses-index-ch-de.json', fr: '/kereses-index-ch-fr.json', it: '/kereses-index-ch-it.json', en: '/kereses-index-ch-en.json' },
    prefix: '/ch',
    lang: 'de',
    phone: '+41 79 715 85 80',
    wa: '41797158580',
    email: 'info@caradvance.ch'
  },
  cz: {
    base: 'https://www.caradvance.cz',
    index: '/kereses-index-cs.json',
    prefix: '/cs',
    lang: 'cs',
    phone: '+420 604 313 136',
    wa: '421915410555',
    email: 'info@caradvance.cz'
  }
};

export const LANG_NAME = {
  hu: 'Hungarian', sk: 'Slovak', cs: 'Czech', pl: 'Polish', it: 'Italian', es: 'Spanish', en: 'English', de: 'German', fr: 'French', uk: 'Ukrainian', zh: 'Simplified Chinese'
};

const HU = `
# CarAdvance — caradvance.hu (Magyarország)
- Szolgáltató és szerződő fél: Caradvance GmbH, Bgm-Graf-Ring 21, 82538 Geretsried, Németország (Amtsgericht München, HRB 151009). 2003 óta működik, 5000+ eladott prémium autó, 5,0★ Google-értékelés.
- Magyarországi képviselő: BH Group Zrt. — tartja a kapcsolatot az ügyfelekkel és segít az ügyintézésben; szerződést a Caradvance GmbH köt.
- Kapcsolat: telefon és WhatsApp +36 30 233 6060, e-mail info@caradvance.hu, hétköznap 9–17 óra. Kapcsolat oldal: https://www.caradvance.hu/kapcsolat/

## Szolgáltatások
1) Tartós autóbérlés (havidíjas, nem napidíjas kölcsönzés): minimum 6 hónap, utána 30 napos felmondással folytatható. Kilométerkeret modelltől függően 2 000–4 000 km/hó. Egyszeri, visszajáró kaució 2 000–10 000 € modelltől függően (a kaució biztosíték, nem bérleti díj; a visszaadás és a nyitott ügyek lezárása után 30 napon belül visszajár). A havidíjban benne van: szerviz, adó, casco, kötelező biztosítás, nyári és téli gumi. Bérbeadó a Caradvance GmbH; a bérelt autók német rendszámmal közlekednek. Feltételek: https://www.caradvance.hu/berlesi-feltetelek/ — bérelhető autók: https://www.caradvance.hu/autoink/#berelheto
2) Megvásárolható prémium autók Németországból: leinformált, bevizsgált autók, többségük érvényes gyári garanciával; finanszírozás igény szerint (partnereink: Euroleasing / MBH Bank és Merkantil / OTP Bank).
3) Egyedi autó rendelés (új autó gyárból, BMW, MINI, Mercedes, Audi) német áron: https://www.caradvance.hu/egyedi-auto-rendeles/
4) Autóimport Németországból teljes körűen: kiválasztás, leinformálás és helyszíni bevizsgálás, szállítás, honosítás; 1 év szavatosság minden autóra. Ajánlatkérés: https://www.caradvance.hu/auto-rendeles/
5) Bizományos értékesítés (eladjuk az autódat): profi fotók és videó, hirdetés a nagy platformokon; a jutalék 30%-át nonprofit szervezeteknek ajánljuk fel. https://www.caradvance.hu/bizomanyos/
- Kalkulátorok: honosítás (regisztrációs adó + illeték): https://www.caradvance.hu/honositas-kalkulator/ · átírás: https://www.caradvance.hu/atiras-kalkulator/
- Árak: a weboldalon szereplő árak tájékoztató jellegűek, a végleges árat az írásos ajánlat tartalmazza. Magánszemély vevőnek a feltételek teljesülésekor 19% német áfával számlázunk; a magyarországi regisztrációs adót és a honosítás költségét az ajánlat részletezi.
`;

const SK = `
# CarAdvance — caradvance.sk (Slovensko)
- Poskytovateľ, predávajúci a prenajímateľ (zmluvná strana): Caradvance GmbH, Bgm-Graf-Ring 21, 82538 Geretsried, Nemecko (Amtsgericht München, HRB 151009, IČ DPH DE232664616). Pôsobí od roku 2003, 5000+ predaných prémiových áut.
- Obchodný sprostredkovateľ pre Slovensko: Mr. Job SK s.r.o., Cesta na Senec 2/A, 821 04 Bratislava (IČO 52 005 445). Prijíma dopyty, radí po slovensky, česky aj anglicky a pomáha s administratívou; zmluvy uzatvára a podpisuje výlučne Caradvance GmbH. Mr. Job SK nie je predávajúcim ani prenajímateľom.
- Kontakt: info@caradvance.sk · +421 915 410 555 (aj WhatsApp) · Po–Pi 9:00–17:00 · https://www.caradvance.sk/kontakt/
- Tím: Pavel Horemuž — vedúci CarAdvance pre Slovensko a Česko (aj dovoz áut z Nemecka), +421 915 410 555 · Veronika Diničová — prenájom a predaj, +421 918 700 722 · Andreas Horemuž — prenájom a predaj, +421 917 222 122. Všetci sú dostupní aj na WhatsApp; e-mail info@caradvance.sk.

## Služby
1) Dlhodobý prenájom prémiových áut: minimálne 6 mesiacov, potom pokračuje na dobu neurčitú s 30-dňovou výpoveďou. Limit kilometrov podľa auta 2 000–4 000 km/mesiac. Jednorazová vratná kaucia 2 000–10 000 € podľa modelu (zábezpeka, nie nájomné; vracia sa do 30 dní po vrátení auta a vyriešení otvorených vecí). V mesačnom nájomnom: servis a údržba, daň, PZP a havarijné poistenie (Casco), letné a zimné pneumatiky, asistenčné služby. Spoluúčasť pri Casco podľa individuálnej dohody v zmluve. Ceny prenájmu sú uvedené bez DPH a sú určené najmä firmám s IČ DPH; súkromným osobám pripravíme individuálnu ponuku. Prenajať si auto môžu zákazníci s bydliskom alebo sídlom na Slovensku, v Česku, v Nemecku aj v inej krajine. Zmluvy sa podpisujú online (elektronicky), bez návštevy kancelárie. Prenajaté autá jazdia s nemeckým evidenčným číslom. Krátkodobý prenájom neponúkame. Podmienky: https://www.caradvance.sk/prenajom/podmienky-a-kaucia/ · autá na prenájom: https://www.caradvance.sk/auta/#berelheto
2) Autá na predaj a objednávka nového auta na mieru (BMW, MINI, Mercedes, Audi) z Nemecka; financovanie (lízing, úver) poskytuje partnerská finančná inštitúcia podľa vlastných podmienok.
3) Dovoz auta z Nemecka: vyhľadanie, preverenie a kontrola na mieste, preprava na Slovensko, pomoc s prihlásením. https://www.caradvance.sk/dovoz/
- DPH: Caradvance GmbH je nemecký podnikateľ. Súkromnej osobe účtuje slovenskú DPH 23 %, ak auto dopraví na Slovensko Caradvance GmbH alebo osoba konajúca na jej účet. Nemeckú DPH 19 % len pri ojazdenom aute, ktoré si kupujúci sám prevezme v Nemecku a prepravu si zabezpečí sám. Autá v osobitnom režime zdaňovania prirážky — DPH sa na faktúre neuvádza. Firme s platným IČ DPH v inom štáte EÚ — bez DPH (oslobodené dodanie v rámci EÚ). Pri novom aute sa DPH vždy platí v krajine kupujúceho. Nikdy nesľubuj „nemeckú DPH 19 %“ ako všeobecné pravidlo.
- Ceny na webe sú orientačné; konečnú cenu obsahuje písomná ponuka a zmluva.
- Kalkulačky: poplatok za prihlásenie dovezeného auta https://www.caradvance.sk/dovoz/kalkulacka-poplatkov/ · poplatok za prepis https://www.caradvance.sk/dovoz/kalkulacka-prepisu/ (správny poplatok = sadzba podľa výkonu × ekologický koeficient, najmenej 33 €; elektromobil 33 €).
- Na Slovensku neponúkame komisionálny predaj ani charitatívny program — nespomínaj ich.
`;

const PL = `
# CarAdvance — caradvance.pl (Polska)
- Usługodawca, sprzedawca i wynajmujący (strona umowy): Caradvance GmbH, Bgm-Graf-Ring 21, 82538 Geretsried, Niemcy (Amtsgericht München, HRB 151009, VAT UE DE232664616). Działa od 2003 roku, ponad 5000 sprzedanych samochodów premium.
- Pośrednik handlowy dla Polski: Mr.JOB POLAND Sp. z o.o., ul. Pory 78, 02-757 Warszawa, Polska (REGON 368854599, NIP 5213804274, VAT UE PL5213804274). Przyjmuje zapytania, doradza i pomaga w formalnościach; umowy zawiera i podpisuje wyłącznie Caradvance GmbH. Mr.JOB POLAND Sp. z o.o. nie jest sprzedawcą ani wynajmującym.
- Kontakt: info@caradvance.hu · +36 30 233 6060 (także WhatsApp) · pn–pt 9:00–17:00 · https://www.caradvance.pl/kontakt/
- Zespół: Ferenc Csadi — odpowiedzialny za rynek polski, rozmawia po polsku i prowadzi klientów z Polski przez cały import, +36 30 233 6060 · Károly Tóth — dyrektor handlowy (kontakty z rynkiem niemieckim, cały proces importu), +36 30 214 6989 · Balázs Bajzáth — Sales Manager (oferty, dokumenty, pytania handlowe), +36 30 094 2081. Wszyscy dostępni także przez WhatsApp; e-mail info@caradvance.hu.

## Usługi
1) Wynajem długoterminowy samochodów premium: minimum 6 miesięcy, potem umowa trwa na czas nieokreślony z 30-dniowym okresem wypowiedzenia. Limit kilometrów zależnie od samochodu 2 000–4 000 km/mies. Jednorazowa zwrotna kaucja 2 000–10 000 € zależnie od modelu (zabezpieczenie, nie czynsz; zwracana w ciągu 30 dni po zwrocie auta i zamknięciu otwartych spraw). W opłacie miesięcznej: serwis i przeglądy, podatek, ubezpieczenie OC i AC, opony letnie i zimowe, assistance. Udział własny w AC według indywidualnych ustaleń w umowie. Ceny wynajmu są podane netto (bez VAT) i są przeznaczone głównie dla firm z numerem VAT UE; osobom prywatnym przygotujemy indywidualną ofertę. Wynająć samochód mogą klienci z miejscem zamieszkania lub siedzibą w Polsce, w Niemczech lub w innym kraju. Umowy podpisuje się online (elektronicznie), bez wizyty w biurze. Wynajęte samochody jeżdżą na niemieckich tablicach rejestracyjnych. Wynajmu krótkoterminowego nie oferujemy. Warunki: https://www.caradvance.pl/wynajem/warunki-i-kaucja/ · samochody na wynajem: https://www.caradvance.pl/samochody/#berelheto
2) Samochody na sprzedaż i zamówienie nowego samochodu skonfigurowanego pod klienta (BMW, MINI, Mercedes, Audi) z Niemiec; finansowanie (leasing, kredyt) zapewnia partnerska instytucja finansowa na własnych warunkach.
3) Import samochodu z Niemiec: wyszukanie, sprawdzenie i oględziny na miejscu, transport do Polski, pomoc przy akcyzie i rejestracji. https://www.caradvance.pl/import/
- VAT: Caradvance GmbH jest niemieckim przedsiębiorcą. Osobie prywatnej nalicza polski VAT 23 %, jeśli samochód do Polski dostarcza Caradvance GmbH lub osoba działająca na jej rzecz. Niemiecki VAT 19 % tylko przy samochodzie używanym, który kupujący sam odbiera w Niemczech i sam organizuje transport. Samochody w procedurze marży — VAT nie jest wykazywany na fakturze. Firmie z ważnym numerem VAT UE w innym państwie UE — bez VAT (wewnątrzwspólnotowa dostawa). Przy nowym samochodzie VAT zawsze płaci się w kraju kupującego (WNT). Nigdy nie obiecuj „niemieckiego VAT 19 %” jako ogólnej zasady.
- Akcyza przy imporcie samochodu osobowego do Polski: 3,1 % wartości przy silniku do 2000 cm³, 18,6 % powyżej 2000 cm³; hybrydy 1,55 % (do 2000 cm³) i 9,3 % (2000–3500 cm³); hybrydy plug-in do 2000 cm³ zwolnione do 31.12.2029; samochody elektryczne i wodorowe 0 %. Kalkulator akcyzy: https://www.caradvance.pl/import/kalkulator-akcyzy/ · kalkulator PCC (2 % przy zakupie od osoby prywatnej w Polsce): https://www.caradvance.pl/import/kalkulator-pcc/
- Ceny na stronie są orientacyjne i podane w euro; kwoty w złotych są tylko przybliżone (według bieżącego kursu). Ostateczną cenę zawiera pisemna oferta i umowa.
- W Polsce nie oferujemy sprzedaży komisowej ani programu charytatywnego — nie wspominaj o nich.
`;

const CZ = `
# CarAdvance — caradvance.cz (Česko)
- Poskytovatel, prodávající a pronajímatel (smluvní strana): Caradvance GmbH, Bgm-Graf-Ring 21, 82538 Geretsried, Německo (Amtsgericht München, HRB 151009, DIČ DE232664616). Působí od roku 2003, 5000+ prodaných prémiových vozů.
- Obchodní zprostředkovatel: Mr. Job SK s.r.o., Cesta na Senec 2/A, 821 04 Bratislava, Slovensko (IČO 52 005 445). Přijímá poptávky, radí česky, slovensky i anglicky a pomáhá s administrativou; smlouvy uzavírá a podepisuje výhradně Caradvance GmbH. Mr. Job SK není prodávajícím ani pronajímatelem.
- Kontakt: info@caradvance.cz · +420 604 313 136 (WhatsApp: +421 915 410 555) · Po–Pá 9:00–17:00 · https://www.caradvance.cz/kontakt/
- Tým: Pavel Horemuž — vedoucí CarAdvance pro Slovensko a Česko (i dovoz vozů z Německa), +420 604 313 136 · Veronika Diničová — pronájem a prodej, +421 918 700 722 · Andreas Horemuž — pronájem a prodej, +421 917 222 122. Všichni jsou dostupní i na WhatsApp.

## Služby
1) Dlouhodobý pronájem prémiových vozů: minimálně 6 měsíců, poté pokračuje na dobu neurčitou s 30denní výpovědí. Limit kilometrů podle vozu 2 000–4 000 km/měsíc. Jednorázová vratná kauce 2 000–10 000 € podle modelu (jistota, ne nájemné; vrací se do 30 dnů po vrácení vozu a vyřízení otevřených věcí). V měsíčním nájemném: servis a údržba, daň, povinné ručení a havarijní pojištění, letní a zimní pneumatiky, asistenční služby. Spoluúčast u havarijního pojištění podle individuální dohody ve smlouvě. Ceny pronájmu jsou bez DPH a jsou určeny hlavně firmám s DIČ; soukromým osobám připravíme individuální nabídku. Pronajmout si vůz mohou zákazníci s bydlištěm nebo sídlem v Česku, na Slovensku, v Německu i v jiné zemi. Smlouvy se podepisují online (elektronicky), bez návštěvy kanceláře. Pronajaté vozy jezdí s německou registrační značkou. Krátkodobý pronájem nenabízíme. Podmínky: https://www.caradvance.cz/pronajem/podminky-a-kauce/ · vozy k pronájmu: https://www.caradvance.cz/vozy/#berelheto
2) Vozy na prodej a objednávka nového vozu na míru (BMW, MINI, Mercedes, Audi) z Německa; financování (leasing, úvěr) poskytuje partnerská finanční instituce podle vlastních podmínek.
3) Dovoz vozu z Německa: vyhledání, prověření a kontrola na místě, přeprava do Česka, pomoc s registrací. https://www.caradvance.cz/dovoz/
- DPH: Caradvance GmbH je německý podnikatel. Soukromé osobě účtuje českou DPH 21 %, pokud vůz do Česka dopraví Caradvance GmbH nebo osoba jednající na její účet. Německou DPH 19 % jen u ojetého vozu, který si kupující sám převezme v Německu a přepravu si zajistí sám. Vozy ve zvláštním režimu zdanění přirážky — DPH se na faktuře neuvádí. Firmě s platným DIČ v jiném státě EU — bez DPH (osvobozené dodání v rámci EU). U nového vozu se DPH vždy platí v zemi kupujícího. Nikdy neslibuj „německou DPH 19 %“ jako obecné pravidlo.
- Ceny na webu jsou orientační; konečnou cenu obsahuje písemná nabídka a smlouva.
- Kalkulačky: poplatky za registraci dovezeného vozu https://www.caradvance.cz/dovoz/kalkulacka-poplatku/ · poplatky za přepis https://www.caradvance.cz/dovoz/kalkulacka-prepisu/ (správní poplatek 800 Kč za osobní auto, 0 Kč při přidělení značky EL; emisní poplatek u Euro 2 a starších 3 000–10 000 Kč).
- V Česku nenabízíme komisní prodej ani charitativní program — nezmiňuj je.
`;

const CH = `
# CarAdvance — caradvance.ch (Schweiz / Suisse / Svizzera) — website in German, French, Italian and English
- Anbieter, Verkäufer, Vermieter und einziger Vertragspartner: Caradvance GmbH, Bgm.-Graf-Ring 21, 82538 Geretsried, Deutschland (Amtsgericht München, HRB 151009, USt-IdNr. DE232664616). Seit 2003, über 5000 verkaufte Premium-Autos. Kunden in der Schweiz betreuen wir direkt sowie über unseren Vertriebspartner Red Pro Switzerland GmbH, Champ-de-la-Croix 66, 1720 Corminboeuf (Handelsregister Kanton Freiburg CH-217.3.581.328-1, UID CHE-277.402.073); Verträge schliesst ausschliesslich die Caradvance GmbH ab, der Vertriebspartner ist weder Verkäufer noch Vermieter.
- Kontakt Schweiz: info@caradvance.ch · +41 79 715 85 80 (auch WhatsApp) · Mo–Fr 9–17 Uhr · https://www.caradvance.ch/kontakt/ (fr: https://www.caradvance.ch/fr/kontakt/, it: https://www.caradvance.ch/it/kontakt/, en: https://www.caradvance.ch/en/kontakt/)
- Team: Károly Tóth — Verkaufsleiter (Kontakte zum deutschen Markt, gesamter Importprozess), +36 30 214 6989 · Balázs Bajzáth — Sales Manager (Angebote, Dokumente, kaufmännische Fragen), +36 30 094 2081 · Zsombor Vadnai — Verkauf, +36 30 094 2105. Alle auch per WhatsApp erreichbar.
- Sprachversionen: Deutsch https://www.caradvance.ch/ · Français https://www.caradvance.ch/fr/ · Italiano https://www.caradvance.ch/it/ · English https://www.caradvance.ch/en/ (gleiche Pfade mit Sprachpräfix, z. B. /fr/mieten/).

## Leistungen
1) Langzeitmiete von Premium-Neuwagen (keine Tagesmiete): mindestens 6 Monate, danach unbefristet mit 30 Tagen Kündigungsfrist. Kilometerpaket je nach Auto 2 000–4 000 km/Monat. Einmalige, rückzahlbare Kaution je nach Modell (Sicherheit, keine Miete; Rückzahlung innert 30 Tagen nach Rückgabe und Erledigung offener Punkte). In der Monatsmiete enthalten: Service und Wartung, Fahrzeugsteuer, Haftpflicht- und Vollkaskoversicherung (deutsche Versicherung, Selbstbehalt laut Vertrag), Sommer- und Winterreifen, Pannenhilfe. Die Autos sind in Deutschland auf die Caradvance GmbH zugelassen und fahren mit deutschen Kennzeichen. Die Miete richtet sich vor allem an Personen mit Wohnsitz im Ausland, die in der Schweiz arbeiten (z. B. Grenzgänger, Entsandte, die ihren Wohnsitz im Ausland behalten), sowie an Firmen. Personen mit Wohnsitz in der Schweiz dürfen ein im Ausland zugelassenes Auto in der Schweiz grundsätzlich nicht verwenden. Wird das Auto mehr als 6 Monate pro Jahr in der Schweiz genutzt, braucht es eine Zollbewilligung (Formular 15.30) — wir helfen dabei; ob Schweizer Kennzeichen nötig sind, entscheidet das kantonale Strassenverkehrsamt. Mietpreise sind netto, zuzüglich der gesetzlichen MWST nach den für den Mieter geltenden Regeln. Verträge werden online unterschrieben. Bedingungen: https://www.caradvance.ch/mieten/bedingungen-und-kaution/ · Mietautos: https://www.caradvance.ch/mieten/ · FAQ: https://www.caradvance.ch/mieten/haeufige-fragen/
2) Premium-Autos zum Kauf aus Deutschland (geprüft, meist mit Werksgarantie): https://www.caradvance.ch/fahrzeuge/ — und Neuwagen nach Mass (BMW, MINI, Mercedes, Audi) mit Konfigurator: https://www.caradvance.ch/kaufen/neuwagen-nach-mass/ · Finanzierung/Leasing über Partner-Leasinggesellschaften nach Bonitätsprüfung, Konditionen legt die Leasinggesellschaft fest (Konsumkreditgesetz): https://www.caradvance.ch/kaufen/finanzierung-leasing/
3) Autoimport aus Deutschland in die Schweiz: Suche, Prüfung und Besichtigung vor Ort, Transport, Verzollung, Hilfe bei MFK und Zulassung. https://www.caradvance.ch/import/ · Auto-Suchauftrag: https://www.caradvance.ch/import/auto-suche/
- Steuern beim Import: Bei Lieferung in die Schweiz stellt die Caradvance GmbH ohne deutsche MWST in Rechnung (steuerfreie Ausfuhr). Bei der Einfuhr zahlt der Kunde 4 % Automobilsteuer und 8,1 % Einfuhr-MWST; seit 1.1.2024 kein Zoll auf Personenwagen. Die Verzollung organisieren wir. Bei Abholung in Deutschland: Rechnung mit 19 % deutscher MWST, die nach Ausfuhrnachweis erstattet wird. MWST-pflichtige Schweizer Firmen können die Einfuhr-MWST als Vorsteuer abziehen. Zulassung: Prüfbericht Formular 13.20 A vom Zoll (CHF 20), technische Prüfung (MFK) und Zulassung beim kantonalen Strassenverkehrsamt; Gebühren je Kanton; Schweizer Haftpflichtversicherung nötig (Versicherungsnachweis). Autos, die weniger als 12 Monate im Ausland zugelassen waren (oder weniger als 6 Monate und höchstens 5000 km), können vor der ersten Zulassung einer CO₂-Sanktion unterliegen — wir prüfen das vorab. Importdauer für ein Auto ab Lager: 5–14 Tage.
- Importkosten-Rechner: https://www.caradvance.ch/import/importkosten-rechner/
- Preise: Die Website zeigt Preise in CHF mit dem Euro-Betrag in Klammern; abgerechnet wird in Euro, die CHF-Beträge sind Richtwerte zum aktuellen Kurs. Den Endpreis enthält das schriftliche Angebot.
- In der Schweiz bieten wir keinen Kommissionsverkauf, kein Operating Leasing für Privatpersonen und kein Charity-Programm an — erwähne sie nicht. Keine Kurzzeitmiete.
`;

const EU = `
# CarAdvance — caradvance.eu — Deutschland (/de/), France (/fr/), Italia (/it/), España (/es/) — website in German, French, Italian and Spanish
- Seller, lessor and only contractual party: Caradvance GmbH, Bgm.-Graf-Ring 21, 82538 Geretsried (near Munich), Germany (Amtsgericht München, HRB 151009, VAT ID DE232664616). Since 2003, more than 5000 premium cars sold. No local agent or partner: customers in Germany, France, Italy and Spain are served directly by Caradvance GmbH. Contracts are signed online.
- Contact: import@caradvance.de · phone +49 89 99998 100 · WhatsApp +36 30 233 6060 (WhatsApp only on this number, not on the phone number) · Mon–Fri 9–17 · https://www.caradvance.eu/de/kontakt/ (fr: https://www.caradvance.eu/fr/contact/, it: https://www.caradvance.eu/it/contatti/, es: https://www.caradvance.eu/es/contacto/). Advice in German and English (French too); written enquiries also in Italian and Spanish.
- Each language version addresses one country: German = Germany, French = France, Italian = Italy, Spanish = Spain. Answer for the country of the visitor's language.

## Services (only these three — there is NO import service, NO car-search service, NO consignment, NO charity on caradvance.eu)
1) Long-term rental (DE Langzeitmiete, FR location longue durée, IT noleggio a lungo termine, ES renting) of new premium cars: minimum 6 months, then open-ended with 30 days' notice; 2 000–4 000 km/month depending on the car; one-off refundable deposit (security, not rent). Included: service and maintenance, vehicle tax, liability and comprehensive insurance (German insurer, excess per contract), summer and winter tyres, breakdown assistance. Cars are registered in Germany to Caradvance GmbH (German plates). Customers with residence or registered office in Germany, France, Italy, Spain or another EU country can rent. Rental prices are shown net: DE plus 19 % VAT; private customers in FR/IT/ES pay the VAT of their country (FR 20 %, IT 22 %, ES 21 %); companies with an EU VAT number are invoiced without VAT (reverse charge). Italy: under art. 93-bis Codice della Strada a document signed by the owner is kept on board (we provide it); use in Italy for more than 30 days a year requires entry in the REVE register. France/Spain: whether a German-registered car may be used long-term depends on national rules — we clarify this before the contract.
   Rental pages: de https://www.caradvance.eu/de/langzeitmiete/ · fr https://www.caradvance.eu/fr/location-longue-duree/ · it https://www.caradvance.eu/it/noleggio-lungo-termine/ · es https://www.caradvance.eu/es/renting/
2) Cars for sale from our stock in Germany (checked premium cars, mostly with manufacturer warranty), delivered to the customer's door with all documents (registration certificate, CoC, invoice) or collected near Munich: de https://www.caradvance.eu/de/fahrzeuge/ · fr https://www.caradvance.eu/fr/vehicules/ · it https://www.caradvance.eu/it/veicoli/ · es https://www.caradvance.eu/es/vehiculos/. The buyer registers the car in his own country (DE: we can handle the German registration on request). VAT: DE price incl. 19 %; FR/IT/ES private buyers: VAT of their country on delivery by us (FR 20 %, IT 22 %, ES 21 %), German 19 % if they collect the car in Germany; companies with a valid EU VAT number: tax-exempt intra-Community supply.
3) New cars to order (BMW, MINI, Mercedes-Benz, Audi) with the configurator: de https://www.caradvance.eu/de/kaufen/neuwagen-nach-wunsch/ (fr /fr/achat/voiture-neuve-sur-mesure/, it /it/acquisto/auto-nuova-su-misura/, es /es/compra/coche-nuevo-a-medida/). New cars: VAT of the country of registration (FR/IT/ES: invoiced without German VAT, the buyer pays local VAT at registration). Financing/leasing via partner leasing companies after a credit check; terms depend on the country.
- Prices on the website are in EUR and indicative; the final price is in the written offer.
`;

export const KB = { hu: HU, sk: SK, cz: CZ, pl: PL, ch: CH, eu: EU };
