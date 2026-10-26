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
  cz: {
    base: 'https://www.caradvance.cz',
    index: '/kereses-index-cs.json',
    prefix: '/cs',
    lang: 'cs',
    phone: '+421 915 410 555',
    wa: '421915410555',
    email: 'info@caradvance.cz'
  }
};

export const LANG_NAME = {
  hu: 'Hungarian', sk: 'Slovak', cs: 'Czech', en: 'English', de: 'German', fr: 'French', uk: 'Ukrainian', zh: 'Simplified Chinese'
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

const CZ = `
# CarAdvance — caradvance.cz (Česko)
- Poskytovatel, prodávající a pronajímatel (smluvní strana): Caradvance GmbH, Bgm-Graf-Ring 21, 82538 Geretsried, Německo (Amtsgericht München, HRB 151009, DIČ DE232664616). Působí od roku 2003, 5000+ prodaných prémiových vozů.
- Obchodní zprostředkovatel: Mr. Job SK s.r.o., Cesta na Senec 2/A, 821 04 Bratislava, Slovensko (IČO 52 005 445). Přijímá poptávky, radí česky, slovensky i anglicky a pomáhá s administrativou; smlouvy uzavírá a podepisuje výhradně Caradvance GmbH. Mr. Job SK není prodávajícím ani pronajímatelem.
- Kontakt: info@caradvance.cz · +421 915 410 555 (i WhatsApp) · Po–Pá 9:00–17:00 · https://www.caradvance.cz/kontakt/
- Tým: Pavel Horemuž — vedoucí CarAdvance pro Slovensko a Česko (i dovoz vozů z Německa), +421 915 410 555 · Veronika Diničová — pronájem a prodej, +421 918 700 722 · Andreas Horemuž — pronájem a prodej, +421 917 222 122. Všichni jsou dostupní i na WhatsApp.

## Služby
1) Dlouhodobý pronájem prémiových vozů: minimálně 6 měsíců, poté pokračuje na dobu neurčitou s 30denní výpovědí. Limit kilometrů podle vozu 2 000–4 000 km/měsíc. Jednorázová vratná kauce 2 000–10 000 € podle modelu (jistota, ne nájemné; vrací se do 30 dnů po vrácení vozu a vyřízení otevřených věcí). V měsíčním nájemném: servis a údržba, daň, povinné ručení a havarijní pojištění, letní a zimní pneumatiky, asistenční služby. Spoluúčast u havarijního pojištění podle individuální dohody ve smlouvě. Ceny pronájmu jsou bez DPH a jsou určeny hlavně firmám s DIČ; soukromým osobám připravíme individuální nabídku. Pronajmout si vůz mohou zákazníci s bydlištěm nebo sídlem v Česku, na Slovensku, v Německu i v jiné zemi. Smlouvy se podepisují online (elektronicky), bez návštěvy kanceláře. Pronajaté vozy jezdí s německou registrační značkou. Krátkodobý pronájem nenabízíme. Podmínky: https://www.caradvance.cz/pronajem/podminky-a-kauce/ · vozy k pronájmu: https://www.caradvance.cz/vozy/#berelheto
2) Vozy na prodej a objednávka nového vozu na míru (BMW, MINI, Mercedes, Audi) z Německa; financování (leasing, úvěr) poskytuje partnerská finanční instituce podle vlastních podmínek.
3) Dovoz vozu z Německa: vyhledání, prověření a kontrola na místě, přeprava do Česka, pomoc s registrací. https://www.caradvance.cz/dovoz/
- DPH: Caradvance GmbH je německý podnikatel. Soukromé osobě účtuje českou DPH 21 %, pokud vůz do Česka dopraví Caradvance GmbH nebo osoba jednající na její účet. Německou DPH 19 % jen u ojetého vozu, který si kupující sám převezme v Německu a přepravu si zajistí sám. Vozy ve zvláštním režimu zdanění přirážky — DPH se na faktuře neuvádí. Firmě s platným DIČ v jiném státě EU — bez DPH (osvobozené dodání v rámci EU). U nového vozu se DPH vždy platí v zemi kupujícího. Nikdy neslibuj „německou DPH 19 %“ jako obecné pravidlo.
- Ceny na webu jsou orientační; konečnou cenu obsahuje písemná nabídka a smlouva.
- Kalkulačky: poplatky za registraci dovezeného vozu https://www.caradvance.cz/dovoz/kalkulacka-poplatku/ · poplatky za přepis https://www.caradvance.cz/dovoz/kalkulacka-prepisu/ (správní poplatek 800 Kč za osobní auto, 0 Kč při přidělení značky EL; emisní poplatek u Euro 2 a starších 3 000–10 000 Kč).
- V Česku nenabízíme komisní prodej ani charitativní program — nezmiňuj je.
`;

export const KB = { hu: HU, sk: SK, cz: CZ };
