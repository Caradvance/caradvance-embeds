/* CarAdvance — egységes, lépésenkénti autó-űrlap (bérlés / vásárlás / rendelés)
   A meglévő modálokat (ab-modal = bérlés, cain-modal = kártyás érdeklődés, egl-modal = új autó rendelése)
   alakítja át: fejléc specifikációkkal, ár-kártyák (cég / magánszemély), lépésjelző, lépés-kártyák,
   becsült díj + Mégse / Következő lépés. Az eredeti mezők, árlogika és beküldés változatlan marad —
   csak áthelyezzük őket a lépésekbe. Betöltés: caradvance-chat.js.
   Bérlés (HU): euró árak, kötelező EUR-fizetés + szerződésdokumentumok (/szerzodes-minta/). */
(function () {
  'use strict';
  if (window.__caForms) return; window.__caForms = 1;

  var HOST = location.hostname;
  var MK = /\.sk$/.test(HOST) ? 'sk' : /\.cz$/.test(HOST) ? 'cs' : /\.pl$/.test(HOST) ? 'pl' : 'hu';
  var LG = String(document.documentElement.lang || MK).toLowerCase().slice(0, 2);

  /* ---------- szövegek ---------- */
  var TX = {
    hu: { v2: { chosen: 'A választásod', change: 'Módosítás', monthly: 'Havi bérleti díj', gross: 'Bruttó · 19% német áfával', net: 'Nettó · + áfa', depT: 'Visszajáró kaució', incl: ['Szerviz, gumiabroncsok és gépjárműadó a díjban', 'Kötelező és casco biztosítás a díjban (önrésszel)', 'Assistance (autómentés) szolgáltatás'], declT: 'Nyilatkozatok és dokumentumok', declS: 'A folytatáshoz olvasd el és fogadd el az alábbi nyilatkozatokat.', contactT: 'Kapcsolatfelvétel', contactS: 'Kérd az ajánlatunkat — kollégánk rövid időn belül felveszi veled a kapcsolatot.', sendNote: 'Az elküldés nem végleges — felvesszük veled a kapcsolatot.', phoneReq: 'Kérlek add meg a telefonszámod is, hogy fel tudjunk hívni.', pick: 'Válassz', avail1: 'db elérhető', send: 'Ajánlatot kérek', lbl: { lastname: 'Vezetéknév', firstname: 'Keresztnév', company: 'Cégnév', taxid: 'Adószám', phone: 'Telefonszám', email: 'E-mail cím', message: 'Megjegyzés' }, ph: { lastname: 'pl. Kovács', firstname: 'pl. János', company: 'Cégnév', taxid: 'Adószám', phone: '+36 30 123 4567', email: 'pelda@email.hu', message: 'Megjegyzés, kívánt felszereltség…' }, months: 'hónap' }, eurCons: 'Tudomásul veszem, hogy a havi bérleti díjat és a kauciót <b>euróban (EUR)</b> kell megfizetni a Caradvance GmbH részére; a forintösszegek csak tájékoztató jellegűek. *', docCons: 'Megismertem a bérléshez aláírandó <b>szerződésdokumentumokat</b>, és elfogadom, hogy a szerződés ezek alapján jön létre: *', docs: ['Bérleti szerződés', '1. sz. melléklet – Bérleti feltételek', '2. sz. melléklet – Átadási jegyzőkönyv', '3. sz. melléklet – Sérülésrajzok', '4. sz. melléklet – Jogosult vezetők'], consErr: 'Kérlek fogadd el az euróban történő fizetést és a szerződésdokumentumokat.', pdf: 'minta, PDF', recap: 'Összegzés', recapSub: 'Ellenőrizd a választásaidat, mielőtt elküldöd.', change: 'Módosítás', adapted: 'A választásodhoz igazítottuk a többi beállítást.', otherCfg: 'Más kivitellel elérhető — kattints, és átállítjuk', co: 'Cégként · nettó ár', priv: 'Magánszemélyként', vat19: '(19% német áfával)', plusVat: '+ áfa', estG: 'Becsült havi díj (bruttó)', estN: 'Becsült havi díj (nettó)', priceN: 'Ár (nettó)', priceG: 'Ár (bruttó)', price: 'Ár', cancel: 'Mégse', back: 'Vissza', next: 'Következő lépés', send: 'Ajánlat kérése', order: 'Rendelés elküldése', inq: 'Érdeklődés elküldése', sending: 'Küldés…', info: 'Fontos információ', pick: 'Kérlek válassz egy lehetőséget a továbblépéshez.', disc: 'Az ár tájékoztató jellegű. A pontos díj a kiválasztott konfigurációtól és elérhetőségtől függően változhat.', discSale: 'Az ár tájékoztató jellegű, élő árfolyammal számolva. A végleges árat az írásos ajánlat tartalmazza.', avail: 'Elérhető', availIn: function (c, m) { return 'A kiválasztott hónapban (' + m + ') ' + c + ' autó elérhető. Foglalásod a következő lépésekben véglegesítheted.'; }, availNow: function (c) { return c + ' autó azonnal elérhető. Foglalásod a következő lépésekben véglegesítheted.'; }, dep: 'Kaució', newCar: 'Új autó · rendelésre', fuels: 'Hajtás', opt: 'opcionális',
      s: { avail: ['Elérhetőség', 'Válaszd ki, mikortól szeretnéd átvenni az autót.', 'Elérhetőség'], fuel: ['Üzemanyag', 'Válaszd ki a hajtásláncot.', 'Üzemanyag'], term: ['Bérlési futamidő', 'Mennyi időre szeretnéd bérelni az autót?', 'Futamidő'], km: ['Km-keret / hó', 'Válaszd ki a havi futásteljesítményt.', 'Km-keret'], spec: ['Szín és kivitel', 'Válaszd ki a színt és a felszereltséget.', 'Kivitel'], contact: ['Adataid', 'Add meg az elérhetőségeidet — ezekre küldjük az ajánlatot.', 'Adatok'], mode: ['Vásárlás módja', 'Hogyan szeretnéd megvásárolni az autót?', 'Vásárlás'], pay: ['Fizetés', 'Egy összegben vagy finanszírozással fizetnél?', 'Fizetés'], start: ['Kezdés', 'Mikortól szeretnéd az autót?', 'Kezdés'], file: ['Specifikáció', 'Ha van kész felszereltségi listád, töltsd fel (opcionális).', 'Specifikáció'] } },
    en: { v2: { chosen: 'Your selection', change: 'Change', monthly: 'Monthly rent', gross: 'Gross · incl. 19% German VAT', net: 'Net · + VAT', depT: 'Refundable deposit', incl: ['Service, tyres and vehicle tax included', 'Liability and comprehensive insurance included (with excess)', 'Roadside assistance'], declT: 'Declarations and documents', declS: 'Please read and accept the following declarations to continue.', contactT: 'Contact', contactS: 'Request our offer — a colleague will contact you shortly.', sendNote: 'Sending is not binding — we will contact you.', phoneReq: 'Please enter your phone number so we can call you.', pick: 'Choose', avail1: 'available', send: 'Request offer', lbl: { lastname: 'Last name', firstname: 'First name', company: 'Company name', taxid: 'Tax number', phone: 'Phone', email: 'E-mail', message: 'Message' }, ph: { lastname: 'e.g. Smith', firstname: 'e.g. John', company: 'Company name', taxid: 'Tax number', phone: '+36 30 123 4567', email: 'name@example.com', message: 'Message, preferred equipment…' }, months: 'months' }, eurCons: 'I acknowledge that the monthly rent and the deposit are payable <b>in euros (EUR)</b> to Caradvance GmbH; forint amounts are for information only. *', docCons: 'I have read the <b>contract documents</b> I will sign for the rental and accept that the contract is concluded on this basis: *', docs: ['Rental agreement', 'Annex 1 – Rental conditions', 'Annex 2 – Handover protocol', 'Annex 3 – Damage sketches', 'Annex 4 – Authorised drivers'], consErr: 'Please accept payment in euros and the contract documents.', pdf: 'sample, PDF', recap: 'Summary', recapSub: 'Check your choices before sending.', change: 'Change', adapted: 'We adjusted the other settings to match your choice.', otherCfg: 'Available with another configuration — click to switch', co: 'As a company · net price', priv: 'As a private person', vat19: '(incl. 19% German VAT)', plusVat: '+ VAT', estG: 'Estimated monthly fee (gross)', estN: 'Estimated monthly fee (net)', priceN: 'Price (net)', priceG: 'Price (gross)', price: 'Price', cancel: 'Cancel', back: 'Back', next: 'Next step', send: 'Request offer', order: 'Send order', inq: 'Send inquiry', sending: 'Sending…', info: 'Important information', pick: 'Please choose an option to continue.', disc: 'The price is indicative. The exact fee depends on the selected configuration and availability.', discSale: 'The price is indicative, calculated with the live exchange rate. The final price is stated in the written offer.', avail: 'Available', availIn: function (c, m) { return c + ' car(s) available in the selected month (' + m + '). You can finalise your booking in the next steps.'; }, availNow: function (c) { return c + ' car(s) available immediately. You can finalise your booking in the next steps.'; }, dep: 'Deposit', newCar: 'New car · made to order', fuels: 'Powertrain', opt: 'optional',
      s: { avail: ['Availability', 'Choose when you would like to take over the car.', 'Availability'], fuel: ['Fuel', 'Choose the powertrain.', 'Fuel'], term: ['Rental term', 'How long would you like to rent the car?', 'Term'], km: ['Mileage / month', 'Choose your monthly mileage.', 'Mileage'], spec: ['Colour & trim', 'Choose the colour and the equipment.', 'Trim'], contact: ['Your details', 'Enter your contact details — we will send the offer there.', 'Details'], mode: ['Purchase type', 'How would you like to buy the car?', 'Purchase'], pay: ['Payment', 'Pay in one sum or with financing?', 'Payment'], start: ['Start', 'From when do you need the car?', 'Start'], file: ['Specification', 'Upload your equipment list if you have one (optional).', 'Spec'] } },
    de: { v2: { chosen: 'Ihre Auswahl', change: 'Ändern', monthly: 'Monatsmiete', gross: 'Brutto · inkl. 19 % dt. MwSt.', net: 'Netto · + MwSt.', depT: 'Rückzahlbare Kaution', incl: ['Wartung, Reifen und Kfz-Steuer inklusive', 'Haftpflicht- und Vollkaskoversicherung inklusive (mit Selbstbeteiligung)', 'Pannenhilfe'], declT: 'Erklärungen und Dokumente', declS: 'Bitte lesen und bestätigen Sie die folgenden Erklärungen.', contactT: 'Kontakt', contactS: 'Fordern Sie unser Angebot an — wir melden uns in Kürze.', sendNote: 'Die Anfrage ist unverbindlich — wir melden uns bei Ihnen.', phoneReq: 'Bitte geben Sie Ihre Telefonnummer an.', pick: 'Auswählen', avail1: 'verfügbar', send: 'Angebot anfordern', lbl: { lastname: 'Nachname', firstname: 'Vorname', company: 'Firmenname', taxid: 'Steuernummer', phone: 'Telefon', email: 'E-Mail', message: 'Nachricht' }, ph: { lastname: 'z. B. Müller', firstname: 'z. B. Anna', company: 'Firmenname', taxid: 'Steuernummer', phone: '+49 151 1234567', email: 'name@beispiel.de', message: 'Nachricht, gewünschte Ausstattung…' }, months: 'Monate' }, eurCons: 'Ich nehme zur Kenntnis, dass Monatsmiete und Kaution <b>in Euro (EUR)</b> an die Caradvance GmbH zu zahlen sind; Forint-Beträge dienen nur zur Information. *', docCons: 'Ich habe die <b>Vertragsunterlagen</b> gelesen, die ich für die Miete unterzeichne, und akzeptiere, dass der Vertrag auf dieser Grundlage zustande kommt: *', docs: ['Mietvertrag', 'Anlage 1 – Mietbedingungen', 'Anlage 2 – Übergabeprotokoll', 'Anlage 3 – Schadenskizzen', 'Anlage 4 – Berechtigte Fahrer'], consErr: 'Bitte bestätigen Sie die Zahlung in Euro und die Vertragsunterlagen.', pdf: 'Muster, PDF', recap: 'Zusammenfassung', recapSub: 'Prüfen Sie Ihre Auswahl vor dem Absenden.', change: 'Ändern', adapted: 'Die übrigen Einstellungen wurden an Ihre Wahl angepasst.', otherCfg: 'Mit anderer Konfiguration verfügbar — klicken zum Umstellen', co: 'Als Firma · Nettopreis', priv: 'Als Privatperson', vat19: '(inkl. 19 % dt. MwSt.)', plusVat: '+ MwSt.', estG: 'Geschätzte Monatsrate (brutto)', estN: 'Geschätzte Monatsrate (netto)', priceN: 'Preis (netto)', priceG: 'Preis (brutto)', price: 'Preis', cancel: 'Abbrechen', back: 'Zurück', next: 'Nächster Schritt', send: 'Angebot anfordern', order: 'Bestellung senden', inq: 'Anfrage senden', sending: 'Wird gesendet…', info: 'Wichtige Information', pick: 'Bitte wählen Sie eine Option, um fortzufahren.', disc: 'Der Preis ist unverbindlich. Die genaue Rate hängt von Konfiguration und Verfügbarkeit ab.', discSale: 'Der Preis ist unverbindlich, mit dem Tageskurs berechnet. Den Endpreis nennt das schriftliche Angebot.', avail: 'Verfügbar', availIn: function (c, m) { return 'Im gewählten Monat (' + m + ') ist/sind ' + c + ' Fahrzeug(e) verfügbar. Die Buchung schließen Sie in den nächsten Schritten ab.'; }, availNow: function (c) { return c + ' Fahrzeug(e) sofort verfügbar. Die Buchung schließen Sie in den nächsten Schritten ab.'; }, dep: 'Kaution', newCar: 'Neuwagen · auf Bestellung', fuels: 'Antrieb', opt: 'optional',
      s: { avail: ['Verfügbarkeit', 'Wählen Sie, ab wann Sie das Auto übernehmen möchten.', 'Verfügbarkeit'], fuel: ['Kraftstoff', 'Wählen Sie den Antrieb.', 'Kraftstoff'], term: ['Mietdauer', 'Wie lange möchten Sie das Auto mieten?', 'Laufzeit'], km: ['Kilometer / Monat', 'Wählen Sie Ihre monatliche Laufleistung.', 'Kilometer'], spec: ['Farbe & Ausstattung', 'Wählen Sie Farbe und Ausstattung.', 'Ausstattung'], contact: ['Ihre Daten', 'Geben Sie Ihre Kontaktdaten an — wir senden das Angebot dorthin.', 'Daten'], mode: ['Kaufart', 'Wie möchten Sie das Auto kaufen?', 'Kauf'], pay: ['Zahlung', 'Einmalzahlung oder Finanzierung?', 'Zahlung'], start: ['Beginn', 'Ab wann benötigen Sie das Auto?', 'Beginn'], file: ['Spezifikation', 'Laden Sie Ihre Ausstattungsliste hoch, falls vorhanden (optional).', 'Spezifikation'] } },
    sk: { recap: 'Zhrnutie', recapSub: 'Pred odoslaním skontrolujte svoj výber.', change: 'Zmeniť', adapted: 'Ostatné nastavenia sme prispôsobili vášmu výberu.', otherCfg: 'Dostupné s inou konfiguráciou — kliknite a prepneme', co: 'Ako firma · cena bez DPH', priv: 'Ako súkromná osoba', vat19: '(s DPH)', plusVat: '+ DPH', estG: 'Odhadovaný mesačný poplatok (s DPH)', estN: 'Odhadovaný mesačný poplatok (bez DPH)', priceN: 'Cena (bez DPH)', priceG: 'Cena (s DPH)', price: 'Cena', cancel: 'Zrušiť', back: 'Späť', next: 'Ďalší krok', send: 'Požiadať o ponuku', order: 'Odoslať objednávku', inq: 'Odoslať dopyt', sending: 'Odosiela sa…', info: 'Dôležitá informácia', pick: 'Pre pokračovanie vyberte jednu z možností.', disc: 'Cena je orientačná. Presný poplatok závisí od zvolenej konfigurácie a dostupnosti.', discSale: 'Cena je orientačná. Konečnú cenu uvedie písomná ponuka.', avail: 'Dostupné', availIn: function (c, m) { return 'Vo zvolenom mesiaci (' + m + ') je dostupných ' + c + ' áut. Rezerváciu dokončíte v ďalších krokoch.'; }, availNow: function (c) { return 'Ihneď dostupných: ' + c + '. Rezerváciu dokončíte v ďalších krokoch.'; }, dep: 'Kaucia', newCar: 'Nové auto · na objednávku', fuels: 'Pohon', opt: 'voliteľné',
      s: { avail: ['Dostupnosť', 'Vyberte, odkedy chcete auto prevziať.', 'Dostupnosť'], fuel: ['Palivo', 'Vyberte pohon.', 'Palivo'], term: ['Doba prenájmu', 'Na ako dlho si chcete auto prenajať?', 'Doba'], km: ['Km limit / mesiac', 'Vyberte mesačný nájazd.', 'Km limit'], spec: ['Farba a výbava', 'Vyberte farbu a výbavu.', 'Výbava'], contact: ['Vaše údaje', 'Zadajte kontaktné údaje — pošleme vám na ne ponuku.', 'Údaje'], mode: ['Spôsob kúpy', 'Ako chcete auto kúpiť?', 'Kúpa'], pay: ['Platba', 'Jednorazovo alebo s financovaním?', 'Platba'], start: ['Začiatok', 'Odkedy potrebujete auto?', 'Začiatok'], file: ['Špecifikácia', 'Ak máte zoznam výbavy, nahrajte ho (voliteľné).', 'Špecifikácia'] } },
    cs: { recap: 'Shrnutí', recapSub: 'Před odesláním zkontrolujte svůj výběr.', change: 'Změnit', adapted: 'Ostatní nastavení jsme přizpůsobili vašemu výběru.', otherCfg: 'Dostupné s jinou konfigurací — klikněte a přepneme', co: 'Jako firma · cena bez DPH', priv: 'Jako soukromá osoba', vat19: '(s DPH)', plusVat: '+ DPH', estG: 'Odhadovaný měsíční poplatek (s DPH)', estN: 'Odhadovaný měsíční poplatek (bez DPH)', priceN: 'Cena (bez DPH)', priceG: 'Cena (s DPH)', price: 'Cena', cancel: 'Zrušit', back: 'Zpět', next: 'Další krok', send: 'Požádat o nabídku', order: 'Odeslat objednávku', inq: 'Odeslat poptávku', sending: 'Odesílá se…', info: 'Důležitá informace', pick: 'Pro pokračování vyberte jednu z možností.', disc: 'Cena je orientační. Přesný poplatek závisí na zvolené konfiguraci a dostupnosti.', discSale: 'Cena je orientační. Konečnou cenu uvede písemná nabídka.', avail: 'Dostupné', availIn: function (c, m) { return 'Ve zvoleném měsíci (' + m + ') je dostupných ' + c + ' vozů. Rezervaci dokončíte v dalších krocích.'; }, availNow: function (c) { return 'Ihned dostupných: ' + c + '. Rezervaci dokončíte v dalších krocích.'; }, dep: 'Kauce', newCar: 'Nový vůz · na objednávku', fuels: 'Pohon', opt: 'volitelné',
      s: { avail: ['Dostupnost', 'Vyberte, odkdy chcete vůz převzít.', 'Dostupnost'], fuel: ['Palivo', 'Vyberte pohon.', 'Palivo'], term: ['Doba pronájmu', 'Na jak dlouho si chcete vůz pronajmout?', 'Doba'], km: ['Km limit / měsíc', 'Vyberte měsíční nájezd.', 'Km limit'], spec: ['Barva a výbava', 'Vyberte barvu a výbavu.', 'Výbava'], contact: ['Vaše údaje', 'Zadejte kontaktní údaje — pošleme na ně nabídku.', 'Údaje'], mode: ['Způsob koupě', 'Jak chcete vůz koupit?', 'Koupě'], pay: ['Platba', 'Jednorázově, nebo s financováním?', 'Platba'], start: ['Začátek', 'Odkdy potřebujete vůz?', 'Začátek'], file: ['Specifikace', 'Pokud máte seznam výbavy, nahrajte ho (volitelné).', 'Specifikace'] } },
    pl: { recap: 'Podsumowanie', recapSub: 'Sprawdź swój wybór przed wysłaniem.', change: 'Zmień', adapted: 'Pozostałe ustawienia dopasowaliśmy do Twojego wyboru.', otherCfg: 'Dostępne w innej konfiguracji — kliknij, aby przełączyć', co: 'Jako firma · cena netto', priv: 'Jako osoba prywatna', vat19: '(z VAT)', plusVat: '+ VAT', estG: 'Szacowana opłata miesięczna (brutto)', estN: 'Szacowana opłata miesięczna (netto)', priceN: 'Cena (netto)', priceG: 'Cena (brutto)', price: 'Cena', cancel: 'Anuluj', back: 'Wstecz', next: 'Dalej', send: 'Poproś o ofertę', order: 'Wyślij zamówienie', inq: 'Wyślij zapytanie', sending: 'Wysyłanie…', info: 'Ważna informacja', pick: 'Wybierz jedną z opcji, aby kontynuować.', disc: 'Cena orientacyjna. Dokładna opłata zależy od wybranej konfiguracji i dostępności.', discSale: 'Cena orientacyjna. Ostateczną cenę podamy w pisemnej ofercie.', avail: 'Dostępny', availIn: function (c, m) { return 'W wybranym miesiącu (' + m + ') dostępnych aut: ' + c + '. Rezerwację dokończysz w kolejnych krokach.'; }, availNow: function (c) { return 'Od ręki dostępnych aut: ' + c + '. Rezerwację dokończysz w kolejnych krokach.'; }, dep: 'Kaucja', newCar: 'Nowy samochód · na zamówienie', fuels: 'Napęd', opt: 'opcjonalnie',
      s: { avail: ['Dostępność', 'Wybierz, od kiedy chcesz odebrać samochód.', 'Dostępność'], fuel: ['Paliwo', 'Wybierz napęd.', 'Paliwo'], term: ['Okres najmu', 'Na jak długo chcesz wynająć samochód?', 'Okres'], km: ['Limit km / mies.', 'Wybierz miesięczny przebieg.', 'Limit km'], spec: ['Kolor i wersja', 'Wybierz kolor i wyposażenie.', 'Wersja'], contact: ['Twoje dane', 'Podaj dane kontaktowe — wyślemy na nie ofertę.', 'Dane'], mode: ['Sposób zakupu', 'Jak chcesz kupić samochód?', 'Zakup'], pay: ['Płatność', 'Jednorazowo czy z finansowaniem?', 'Płatność'], start: ['Start', 'Od kiedy potrzebujesz samochodu?', 'Start'], file: ['Specyfikacja', 'Jeśli masz listę wyposażenia, prześlij ją (opcjonalnie).', 'Specyfikacja'] } }
  };
  var T = TX[LG] || TX[MK] || TX.hu;

  /* ---------- ikonok ---------- */
  var IC = {
    cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    fuel: '<path d="M4 21V5.5A2.5 2.5 0 0 1 6.5 3h6A2.5 2.5 0 0 1 15 5.5V21M3 21h13M4 10.5h11"/><path d="M15 8l3 3v6.5a1.5 1.5 0 0 0 3 0V9.5L18 6.5"/>',
    gear: '<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/>',
    car: '<path d="M3 13l2.2-5.2A2 2 0 0 1 7 6.6h10a2 2 0 0 1 1.8 1.2L21 13v4.5a1 1 0 0 1-1 1h-1.5M3 13v4.5a1 1 0 0 0 1 1h1.5M3 13h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    gauge: '<path d="M12 14l4.5-4.5"/><path d="M3.5 17.5a9 9 0 1 1 17 0"/><circle cx="12" cy="14" r="1.2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.4"/>',
    right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    plug: '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M3 11v4c0 1.7 2.7 3 6 3 1.2 0 2.3-.2 3.2-.5"/><ellipse cx="17" cy="15" rx="4" ry="2"/><path d="M13 15v3c0 1.1 1.8 2 4 2s4-.9 4-2v-3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    bldg: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M10 21v-4h4v4"/>',
    dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    chev: '<path d="M6 9l6 6 6-6"/>'
  };
  /* Fényezések: valós árnyalat + felület (metál / gyöngyház / uni / matt), névvel párosítva */
  var PAINT = {
    'alpesi fehér': '#f1f2ef', 'ascot szürke': '#9a9ea0', 'brooklyn szürke metál': '#7c8186', 'chili piros': '#c8102e',
    'csillogó rézszürke metál': '#6f6761', 'daytonaszürke gyöngyház': '#4a4d52', 'delfinszürke metál': '#6d7276', 'dűne szürke metál': '#a39c8f',
    'ecotronic szürke': '#7a7e80', 'fekete uni': '#0e0f10', 'floretezüst metál': '#b9bcbe', 'füstszürke metál / fekete': '#5e6266',
    'gleccserfehér metál': '#e8e9e6', 'grafitszürke metál': '#4d5155', 'grenadillfekete metál': '#17181a', 'indiumszürke metál': '#5c5f62',
    'királyvörös metál': '#a3141f', 'királyvörös metál / fekete': '#a3141f', 'kozmoszfekete metál': '#121314', 'krémfehér': '#edebe3',
    'legend szürke': '#3b3f42', 'manufaktur alpesi szürke uni': '#a7aaa6', 'manhattan szürke metál': '#5e6266', 'melting ezüst': '#a9acae',
    'mélyfekete gyöngyház': '#0f1012', 'mélyfekete gyöngyház / fekete': '#0f1012', 'mélységfekete': '#0d0e11', 'mítoszfekete metál': '#101113',
    'nanuq fehér': '#eeefeb', 'navarrakék metál': '#1f3a6b', 'obszidiánfekete metál': '#121314', 'oryxfehér gyöngyház': '#f2f1ea',
    'osztrigaezüst metál': '#a7a9a8', 'piritezüst metál': '#a39a88', 'poláris fehér uni': '#ecedee', 'reflexezüst metál': '#b7babc',
    'scale ezüst metál': '#9ea2a4', 'sophisto szürke briliáns metál': '#3c3f42', 'storm bay metál': '#4f5a61', 'tavascan kék metál': '#2b3e5e',
    'tiszta fehér': '#f1f2f2', 'tiszta fehér uni': '#f1f2f2', 'tiszta kék metál': '#2e6aa8', 'wolf szürke': '#5e6266', 'wolf szürke metál': '#5e6266',
    'zafírfekete metál': '#101215', 'árnyékszürke': '#55585b', 'éjkék metál': '#1e2a44', 'élénkpiros': '#b5121b', 'éjfekete uni': '#0b0c0d',
    'éjfélfekete': '#121418', 'éjfélfekete metál': '#121418'
  };
  function hexRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); if (isNaN(n)) return null; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function cssRgb(c) { var m = c.slice(0, 3).map(function (v) { return Math.max(0, Math.min(255, Math.round(v))); }); return 'rgb(' + m.join(',') + ')'; }
  function mixC(c, t, a) { return c.map(function (v, i) { return v + (t[i] - v) * a; }); }
  function rgbOf(cssCol) { var m = /rgba?\((\d+)\D+(\d+)\D+(\d+)/.exec(cssCol || ''); return m ? [+m[1], +m[2], +m[3]] : hexRgb(cssCol); }
  function finishOf(name) { var n = String(name || '').toLowerCase(); return /matt/.test(n) ? 'matt' : /gyöngyház|pearl|perleffekt/.test(n) ? 'pearl' : /metál|metal|briliáns|ezüst|silver/.test(n) ? 'metal' : 'uni'; }
  function swatch(name, fallback) {
    var n = String(name || '').toLowerCase().trim();
    if (/lásd a fotókon|see photos|siehe fotos/.test(n)) return 'conic-gradient(from 210deg,#e8ebef,#9aa3ad,#2b3442,#c6c9cd,#e8ebef)';
    var b = hexRgb(PAINT[n]) || rgbOf(fallback) || [150, 155, 160];
    var W = [255, 255, 255], K = [0, 0, 0], f = finishOf(n), lum = (0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2]) / 255;
    var hi = f === 'matt' ? 0.14 : f === 'uni' ? 0.42 : 0.62, dk = lum < 0.15 ? 0.0 : 0.3;
    var top = mixC(b, W, (lum < 0.15 ? 0.35 : 0.28)), mid = b, band = mixC(b, W, hi), pre = mixC(b, W, hi * 0.35), low = mixC(b, K, dk), refl = mixC(b, W, f === 'matt' ? 0.04 : 0.12);
    var g = 'linear-gradient(180deg,' + cssRgb(top) + ' 0%,' + cssRgb(mid) + ' 30%,' + cssRgb(pre) + ' 39%,' + cssRgb(band) + ' 45%,' + cssRgb(mid) + ' 51.5%,' + cssRgb(mixC(b, K, dk * 0.6)) + ' 57%,' + cssRgb(refl) + ' 72%,' + cssRgb(low) + ' 100%)';
    var layers = [];
    if (/\/\s*fekete|\/\s*black|\/\s*schwarz/.test(n)) layers.push('linear-gradient(135deg,transparent 70%,#111214 70.5%)');
    if (f === 'metal' || f === 'pearl') layers.push('radial-gradient(120% 55% at 25% 8%,rgba(255,255,255,' + (f === 'pearl' ? '.4' : '.28') + '),transparent 60%)');
    layers.push(g);
    return layers.join(',');
  }
  function svg(k, cls) { return '<svg class="' + (cls || 'caf-ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }

  /* ---------- segédek ---------- */
  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function tx(e) { return e ? String(e.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shown(e) { if (!e) return false; if (e.hidden) return false; var s = e.style && e.style.display; return s !== 'none'; }
  function huN(s) { var m = String(s || '').replace(/ /g, ' ').match(/(\d{1,3}(?:[ .]\d{3})+|\d+)\s*Ft/); return m ? +m[1].replace(/[ .]/g, '') : 0; }
  function fmtFt(n) { return Math.round(n).toLocaleString('hu-HU').replace(/ /g, ' ') + ' Ft'; }
  function cleanP(s) {
    s = String(s || '').trim(); var sub = (s.match(/\(([^)]*)\)\s*$/) || [])[1] || '';
    if (s.indexOf('≈') > -1) s = '≈ ' + s.split('≈').slice(1).join('≈').trim();
    else s = s.replace(/^(bruttó|nettó|brutto|netto|gross|net|bez DPH|s DPH)\s*/i, '');
    var plus = /\+\s*(áfa|VAT|MwSt\.?|DPH)\s*$/i.exec(s); if (plus) { s = s.slice(0, plus.index).trim(); if (!sub) sub = plus[0].trim(); }
    s = s.replace(/\s*\([^)]*\)\s*$/, '').trim();
    return { v: s, sub: sub ? (/^\+/.test(sub) ? '(' + sub + ')' : '(' + sub + ')') : '' };
  }
  function shortLbl(t) { return String(t || '').split(/\s[–·-]\s|\s\(/)[0].trim(); }
  function isPriv(M) { var b = q(M.A.buyer, M.modal); return !!(b && b.value === 'Magánszemély'); }

  /* kattintás-kontextus: melyik kártyáról / gombról nyílt a modál (fejléc-adatokhoz) */
  var CTX = null;
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var b = t.closest('.sub-rent'); if (b) { CTX = { k: 'rent', card: b.closest('.sub-card'), ds: b.dataset, t: Date.now() }; return; }
    b = t.closest('.ca-inq'); if (b) { CTX = { k: 'card', card: b.closest('.card'), t: Date.now() }; return; }
    b = t.closest('[data-egl-order]'); if (b) { CTX = { k: 'egl', ds: b.dataset, t: Date.now() }; }
  }, true);
  function ctx(k) { return CTX && CTX.k === k && Date.now() - CTX.t < 8000 ? CTX : null; }
  /* a megnyitáskor rögzített kontextus — a modál nyitva tartása alatt nem jár le */
  function octx(M, k) { var c = M && M.oc; if (!c) return null; if (k === 'card' && c.k === 'page') return c; return c.k === k ? c : null; }

  /* ---------- adapterek ---------- */
  function abCfg(M) {
    var c = window.__ABCFG; if (!c) return null;
    var t = tx(q('#abTitle', M.modal));
    var dn = function (s) { return String(s).replace(/(\d)er\b/g, '$1').replace(/^VW(?=\s|$)/, 'Volkswagen'); };
    var x = octx(M, 'rent'); if (x && x.ds && x.ds.name && c[x.ds.name]) return c[x.ds.name];
    for (var k in c) { if (dn(k) === t || k === t) return c[k]; }
    return null;
  }
  function abPrices(M) {
    var cfg = abCfg(M); if (!cfg || !cfg.X) return null;
    var ids = ['#abFuel', '#abTerm', '#abKm', '#abColor', '#abAus'], sel = [];
    for (var i = 0; i < 5; i++) { var o = q(ids[i] + ' .ab-opt.active', M.modal); sel.push(o ? +o.getAttribute('data-vi') : null); }
    var av = q('#abAvPick .ab-opt.active', M.modal), sa = av ? +av.getAttribute('data-vi') : null;
    var lo = null, hi = null;
    cfg.X.forEach(function (x) {
      for (var p = 0; p < 5; p++) if (sel[p] !== null && x[p] !== sel[p]) return;
      if (sa !== null && x[5] !== sa) return;
      var v = x[7]; if (v == null) return;
      if (lo === null || v < lo) lo = v; if (hi === null || v > hi) hi = v;
    });
    if (lo === null) return null;
    var r = window.__ABRATE || 364, f = function (vm) { return Math.ceil((lo + 650) * vm * r / 10000) * 10000; };
    return { co: f(1), priv: f(1.19), coE: lo + 650, privE: Math.round((lo + 650) * 1.19), from: lo !== hi };
  }

  var AB = {
    sel: '.ab-modal', card: '.ab-card', form: '#abForm', head: '.ab-head', img: '#abImg', title: '#abTitle', eyebrow: '.ab-eyebrow',
    tgl: '.ab-tgl', tglAttr: 'data-abb', buyer: '#abBuyer', submit: '.ab-submit', msg: '#abMsg', close: '.ab-x',
    hide: ['.ab-toggle', '.ab-sticky', '.ab-submit', '#abPrice', '#abAvail', '#abDep'],
    kind: function () { return 'rent'; },
    steps: function (M) {
      var m = M.modal, cb = q('#abCo', m); cb = cb && cb.closest('.ab-block');
      return [
        { k: 'avail', nodes: ['#abAvBlock', '#abDateBlock'], late: '#abDateBlock', name: 'avail', info: true, renum: true },
        { k: 'fuel', nodes: ['#abFuel'], name: 'fuel' },
        { k: 'term', nodes: ['#abTerm'], name: 'term' },
        { k: 'km', nodes: ['#abKm'], name: 'km' },
        { k: 'spec', nodes: ['#abColor', '#abAus', '#abAusInfo'], name: null, names: ['color', 'ausstattung'], renum: true, split: true },
        { k: 'contact', nodes: [cb, '.ab-plate', '.ab-consent:not(.ab-plate)', '#abMsg', '.ab-note'], contact: true, hideFirstLabel: '.ab-label' }
      ];
    },
    prices: function (M) {
      var priv = isPriv(M), cur = tx(q('#abStickyPrice', M.modal)) || tx(q('#abPrice', M.modal));
      var p = MK === 'hu' && qa('.ab-tgl', M.modal).length > 1 ? abPrices(M) : null;
      var fe = function (e) { return Math.round(e).toLocaleString('hu-HU').replace(/\u00a0/g, ' ') + ' €/hó' + (p.from ? '-tól' : ''); };
      return { pair: p ? { co: fmtFt(p.co) + '/hó' + (p.from ? '-tól' : ''), priv: fmtFt(p.priv) + '/hó' + (p.from ? '-tól' : ''), coE: fe(p.coE), privE: fe(p.privE) } : null, cur: cur, priv: priv };
    },
    est: function (M) {
      var s = tx(q('#abStickyPrice', M.modal)) || tx(q('#abPrice', M.modal));
      var priv = isPriv(M);
      var c = cleanP(s);
      var dep = tx(q('#abStickyDep', M.modal)) || tx(q('#abDep', M.modal));
      var pp = MK === 'hu' ? abPrices(M) : null, eur = '';
      if (pp) eur = Math.round(priv ? pp.privE : pp.coE).toLocaleString('hu-HU').replace(/\u00a0/g, ' ') + ' €/hó' + (pp.from ? '-tól' : '') + (priv ? ' · bruttó' : ' · nettó');
      return { label: priv ? T.estG : T.estN, val: c.v, sub: c.sub, eur: eur, dep: dep, disc: T.disc };
    },
    specs: function (M) {
      var out = [], c = octx(M, 'rent'), card = c && c.card, m = M.modal;
      var av = tx(q('#abAvail', m)).replace(/^●\s*/, '');
      if (av) out.push(['cal', av]);
      var cfg = abCfg(M), fo = q('#abFuel .ab-opt.active', m);
      var fl = fo ? tx(fo) : (cfg && cfg.F ? cfg.F.map(function (f) { return f === 'PHEV' ? 'Hibrid' : f; }).join(' / ') : (c && c.ds && c.ds.fuels) || '');
      if (fl) out.push(['fuel', fl]);
      if (!card) {
        qa('.r').forEach(function (r) {
          var k = tx(q('.k', r)); if (!k) return; var v = tx(r).replace(k, '').trim(); if (!v) return;
          if (/^Hajtás|^Váltó/.test(k) && !out.some(function (o) { return o[0] === 'gear'; })) out.push(['gear', /aut/i.test(v) ? 'Automata' : v]);
          else if (/^Karosszéria|^Kategória/.test(k) && !out.some(function (o) { return o[0] === 'car'; })) out.push(['car', v]);
        });
      }
      if (card) {
        var sp = tx(q('.sub-specs', card)).split('·').map(function (x) { return x.trim(); }).filter(Boolean);
        if (sp[1]) out.push(['gear', sp[1]]); if (sp[0]) out.push(['car', sp[0]]);
        var yr = tx(q('.sub-year', card)); if (yr) out.push(['gauge', yr]);
      }
      return out;
    },
    info: function (M) {
      var o = q('#abAvPick .ab-opt.active', M.modal);
      if (o) { var c = tx(q('.ab-cnt', o)).replace(/\D/g, ''), mth = tx(o).replace(/\s*\d+\s*db\s*$/, ''); if (c) return /azonnal|raktáron|immediately|sofort/i.test(mth) ? T.availNow(c) : T.availIn(c, mth); }
      var tip = q('#abAvBlock .ab-av-tip', M.modal); return tip ? tx(tip) : '';
    },
    btn: function () { return T.send; }
  };

  var CAIN = {
    sel: '.cain-modal', card: '.cain-card', form: '.cain-form', head: '.cain-head', img: '.cain-head img', title: '.cain-head h3', eyebrow: '.cain-eyebrow',
    tgl: '.cain-tgl', tglAttr: 'data-buyer', buyer: 'input[name=buyer]', submit: '.cain-submit', msg: '.cain-msg', close: '.cain-x',
    hide: ['.cain-toggle', '.cain-submit', '.cain-sub', '.cain-buy', '.cain-rent'],
    kind: function (M) { var r = q('.cain-rent', M.modal); return r && r.style.display !== 'none' ? 'rentcard' : 'sale'; },
    steps: function (M, kind) {
      var m = M.modal;
      var contact = ['.cain-company'].concat(qa('.cain-grid:not(.cain-company)', m)).concat(['textarea[name=message]', '.cain-consent', '.cain-msg', '[data-caf=note]']);
      if (kind === 'rentcard') {
        var kms = qa('input[name=km]', m).map(function (i) { return i.closest('label'); });
        var fts = qa('input[name=futamido]', m).map(function (i) { return i.closest('label'); });
        var kz = q('input[name=kezdes]', m), note = q('[data-caf=rnote]', m);
        return [
          { k: 'km', nodes: kms, name: 'km' },
          { k: 'term', nodes: fts, name: 'futamido' },
          { k: 'start', nodes: [kz, note], name: null },
          { k: 'contact', nodes: contact, contact: true }
        ];
      }
      var pays = qa('input[name=payment]', m).map(function (i) { return i.closest('label'); });
      return [
        { k: 'mode', nodes: ['.cain-modes'], name: 'mode' },
        { k: 'pay', nodes: pays.concat(['.cain-fin']), name: 'payment' },
        { k: 'contact', nodes: contact, contact: true }
      ];
    },
    prices: function (M, kind) {
      var priv = isPriv(M), raw = tx(q('.cain-sub', M.modal)), first = raw.split('·')[0].trim();
      var c = octx(M, 'card'), card = c && c.card, biz = card && card.classList.contains('bizcard'), isNew = /^(Új|New|Neu|Nové|Nový|Nowy)$/.test(tx(card && q('.cond', card)));
      var n = huN(first);
      if (MK === 'hu' && kind === 'sale' && n && !biz && !isNew && qa('.cain-tgl', M.modal).length > 1) {
        return { pair: { co: fmtFt(n), priv: fmtFt(Math.ceil(n * 1.19 / 10000) * 10000) }, cur: first, priv: priv };
      }
      return { pair: null, cur: kind === 'rentcard' ? raw : (raw.split('·').slice(0, 2).join(' · ') || raw), priv: priv };
    },
    est: function (M, kind) {
      var p = CAIN.prices(M, kind), priv = isPriv(M);
      if (kind === 'rentcard') return { label: T.estN, val: p.cur, sub: '', disc: T.disc };
      if (p.pair) return { label: priv ? T.priceG : T.priceN, val: priv ? '≈ ' + p.pair.priv : p.pair.co, sub: priv ? T.vat19 : T.plusVat, disc: T.discSale };
      return { label: T.price, val: p.cur, sub: '', disc: T.discSale };
    },
    specs: function (M) {
      var out = [], c = octx(M, 'card');
      if (c && c.specs) return c.specs;
      var card = c && c.card; if (!card) return out;
      var cond = tx(q('.cond', card)), yr = tx(q('.year', card));
      if (cond || yr) out.push(['cal', [cond, yr].filter(Boolean).join(' · ')]);
      tx(q('.specs', card)).split('·').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (s) {
        out.push([/km/i.test(s) ? 'gauge' : /automat|manu|kézi|schalt|DSG|tronic/i.test(s) ? 'gear' : /diesel|dízel|benzin|hybrid|hibrid|elektr|PHEV|petrol/i.test(s) ? 'fuel' : 'tag', s]);
      });
      return out;
    },
    btn: function () { return T.send; }
  };

  var EGL = {
    sel: '.egl-modal', card: '.egl-modal-card', form: '.egl-form', head: '.egl-modal-head', img: '.egl-modal-head img', title: '.egl-modal-head h3', eyebrow: '.egl-modal-eyebrow',
    tgl: '.egl-tgl', tglAttr: 'data-buyer', buyer: 'input[name=buyer]', submit: '.egl-fsubmit', msg: '.egl-fmsg', close: '.egl-modal-x',
    hide: ['.egl-toggle', '.egl-fsubmit', '.egl-modal-sub'],
    kind: function () { return 'order'; },
    steps: function (M) {
      var bl = qa('.egl-fblock', M.modal);
      var fuel = q('#eglFuelBlock', M.modal) || bl[0];
      var file = bl.filter(function (b) { return b.querySelector('input[type=file]'); })[0];
      var cont = bl.filter(function (b) { return b.querySelector('input[name=lastname]'); })[0];
      var buy = bl.filter(function (b) { return b.querySelector('input[name=payment]'); })[0];
      var s = [{ k: 'fuel', nodes: [fuel], name: 'fuel' }];
      if (buy) s.push({ k: 'mode', nodes: [buy], name: 'payment' });
      if (file) s.push({ k: 'file', nodes: [file], name: null });
      s.push({ k: 'contact', nodes: [cont, '.egl-consent', '.egl-fmsg', '.egl-fnote'], contact: true });
      return s;
    },
    prices: function (M) { var p = tx(q('#eglOrderPrice', M.modal)), tol = q('#eglOrderTol', M.modal); return { pair: null, cur: p ? p + (tol && shown(tol) ? ' ' + tx(tol) : '') : '', priv: isPriv(M) }; },
    est: function (M) { var p = EGL.prices(M); return { label: T.price, val: p.cur, sub: p.cur ? T.plusVat : '', disc: T.discSale }; },
    specs: function (M) {
      var c = octx(M, 'egl'), out = [['tag', T.newCar]];
      var f = c && c.ds && c.ds.fuels; if (f) out.push(['fuel', f.split(',').map(function (x) { return x.trim(); }).join(' / ')]);
      return out;
    },
    btn: function () { return T.order; }
  };
  var ADS = [AB, CAIN, EGL];

  /* ---------- CSS ---------- */
  function css() {
    if (document.getElementById('cafCss')) return;
    var st = document.createElement('style'); st.id = 'cafCss';
    st.textContent = [
      '.caf{--r:#E2001A;--ink:#141519;--mut:#5A6B82;--ln:#E6EAF1;--bg:#F4F6F9;--bl:#1D5FD1}',
      '.caf.cain-modal{font-family:inherit!important}',

      '.caf .caf-card{width:min(760px,100%)!important;max-width:760px!important;padding:0 28px 0!important;border-radius:24px!important;scroll-behavior:smooth}',
      /* fejléc */
      '.caf .caf-top{display:grid!important;grid-template-columns:230px minmax(0,1fr);gap:22px;align-items:center;margin:22px 0 14px!important;padding-right:40px!important}',
      '.caf .caf-top>img{width:100%!important;height:136px!important;object-fit:contain!important;background:linear-gradient(180deg,#f3f5f9,#e9edf3);border-radius:14px!important;padding:6px;box-sizing:border-box;filter:none}',
      '.caf .caf-top h3{font-size:24px!important;line-height:1.15!important;margin:4px 0 10px!important;letter-spacing:-.01em;color:var(--ink)!important}',
      '.caf .caf-top h3.long{font-size:19px!important}',
      '.caf .ab-eyebrow,.caf .cain-eyebrow,.caf .egl-modal-eyebrow{font-size:12.5px!important;letter-spacing:.14em!important;font-weight:800!important;color:var(--r)!important}',
      '.caf-specs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 16px}',
      '.caf-spec{display:flex;align-items:center;gap:8px;font-size:13.5px;color:#2b3442;font-weight:500;min-width:0}',
      '.caf-spec span{line-height:1.3}',
      '.caf-spec.wide{grid-column:1/-1}',
      '.caf-ic{width:18px;height:18px;flex:0 0 auto;color:#1f2a3a}',
      /* árkártyák */
      '.caf-prices{display:grid;grid-template-columns:1fr 1fr;gap:0;background:var(--bg);border-radius:16px;margin:0 0 14px;position:relative}',
      '.caf-pbox{all:unset;box-sizing:border-box;cursor:pointer;padding:11px 18px;border-radius:16px;display:flex;flex-direction:column;justify-content:center;gap:2px;min-height:68px;position:relative;transition:background .15s,box-shadow .15s,color .15s;color:var(--ink)}',
      '.caf-pbox .l{font-size:13.5px;font-weight:600;color:#3a4556}',
      '.caf-pbox .v{font-size:22px;font-weight:800;letter-spacing:-.01em;line-height:1.15}',
      '.caf-pbox .s{font-size:12.5px;color:var(--mut)}',
      '.caf-pbox.on{background:var(--r);color:#fff;box-shadow:0 12px 26px rgba(226,0,26,.28)}',
      '.caf-pbox.on .l,.caf-pbox.on .s{color:rgba(255,255,255,.92)}',
      '.caf-pbox:not(.on):hover{background:#eceff4}',
      '.caf-pbox:focus-visible{outline:3px solid #9ec2ff;outline-offset:2px}',
      '.caf-prices.single{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:4px 8px 4px 0}',
      '.caf-prices.single .caf-pbox{flex:1 1 260px}',
      '.caf-prices.single .caf-pbox{cursor:default}',
      '.caf-seg{display:flex;gap:4px;background:#fff;border:1px solid var(--ln);border-radius:12px;padding:4px;margin-right:8px}',
      '.caf-seg button{all:unset;cursor:pointer;font-size:13.5px;font-weight:700;color:var(--mut);padding:9px 14px;border-radius:9px;white-space:nowrap}',
      '.caf-seg button.on{background:var(--r);color:#fff}',
      /* lépésjelző */
      '.caf-stepper{display:flex;align-items:flex-start;margin:0 -28px 14px;padding:10px 28px 0;border-bottom:1px solid var(--ln);overflow-x:auto;scrollbar-width:none;position:sticky;top:0;z-index:6;background:rgba(255,255,255,.97);backdrop-filter:blur(6px)}',
      '.caf-stepper::-webkit-scrollbar{display:none}',
      '.caf-sp{all:unset;cursor:pointer;flex:1 1 0;min-width:84px;display:flex;flex-direction:column;align-items:center;gap:8px;padding:0 4px 12px;position:relative;font-size:14.5px;font-weight:500;color:#3a4556;text-align:center}',
      '.caf-sp:before{content:"";position:absolute;top:16px;left:calc(-50% + 22px);right:calc(50% + 22px);height:2px;background:var(--ln)}',
      '.caf-sp:first-child:before{display:none}',
      '.caf-sp i{font-style:normal;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14.5px;background:#eef1f5;color:#3a4556;border:1.5px solid #d7dde6;position:relative;z-index:1}',
      '.caf-sp.on{color:var(--r);font-weight:700}',
      '.caf-sp.on i{background:var(--r);border-color:var(--r);color:#fff;box-shadow:0 0 0 4px rgba(226,0,26,.12)}',
      '.caf-sp.on:after{content:"";position:absolute;left:12%;right:12%;bottom:-1px;height:3px;border-radius:3px;background:var(--r)}',
      '.caf-sp.done i{background:#fff;border-color:var(--r);color:var(--r)}',
      '.caf-sp.done:before,.caf-sp.on:before{background:var(--r)}',
      /* lépés-kártyák */
      '.caf-steps{display:flex;flex-direction:column;gap:12px;margin-bottom:6px}',
      '.caf-step{border:1px solid var(--ln);border-radius:18px;background:#fff;transition:box-shadow .15s,opacity .15s}',
      '.caf-step.on{box-shadow:0 10px 28px rgba(15,27,45,.07);border-color:#dfe4ec}',
      '.caf-step:not(.on){background:#f8f9fb}',
      '.caf-sh{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 20px;cursor:pointer}',
      '.caf-step.on .caf-sh{cursor:default;align-items:flex-start;padding-bottom:6px}',
      '.caf-sh .n{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;background:#c9d0db;color:#fff}',
      '.caf-step.on .caf-sh .n{background:#7c8696}',
      '.caf-step.done .caf-sh .n{background:#fff;border:1.5px solid #19a35b;color:#19a35b}',
      '.caf-sh h4{margin:0;font-size:19px;font-weight:800;color:var(--ink);line-height:1.25}',
      '.caf-sh p{margin:3px 0 0;font-size:14px;color:var(--mut);line-height:1.4}',
      '.caf-step:not(.on) .caf-sh h4,.caf-step:not(.on) .caf-sh p{color:#8c96a5}',
      '.caf-step.done .caf-sh h4{color:#3a4556}',
      '.caf-sum{display:inline-flex;align-items:center;gap:8px;max-width:290px;font-size:14.5px;font-weight:600;color:#3a4556;background:#fff;border:1px solid #dfe4ec;border-radius:12px;padding:10px 14px;white-space:nowrap;overflow:hidden}',
      '.caf-sum span{overflow:hidden;text-overflow:ellipsis;min-width:0}',
      '.caf-sum:empty{display:none}',
      '.caf-step.on .caf-sum{display:none}',
      '.caf-sum .caf-ic{width:17px;height:17px;color:#19a35b}',
      '.caf-sb{display:none;padding:10px 20px 20px 68px}',
      '.caf-step.on .caf-sb{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}',
      '.caf-step.on.hasinfo .caf-sb{grid-template-columns:minmax(0,1fr) 250px;align-items:start}',
      '.caf-body{display:flex;flex-direction:column;gap:12px;min-width:0}',
      '.caf-ibox{background:#EEF4FC;border-radius:14px;padding:14px 16px;font-size:13.5px;line-height:1.5;color:#2b3442}',
      '.caf-ibox b{display:flex;align-items:center;gap:8px;color:var(--bl);font-size:14.5px;margin-bottom:4px}',
      '.caf-ibox b .caf-ic{color:var(--bl);width:20px;height:20px}',
      '.caf-err{display:none;font-size:13.5px;font-weight:600;color:#b3121f;background:#fdeaec;border-radius:10px;padding:9px 12px}',
      '.caf-err.on{display:block}',
      /* eredeti elemek a lépésekben */
      '.caf .caf-body .ab-block,.caf .caf-body .egl-fblock{border:0!important;padding:0!important;margin:0!important;background:none!important;box-shadow:none!important}',
      '.caf .caf-body .ab-pick,.caf .caf-body .egl-fuelpick{display:flex!important;flex-wrap:wrap;gap:10px!important}',
      '.caf .caf-body .ab-opt,.caf .caf-body .egl-fuelopt{display:inline-flex!important;align-items:center;gap:8px;min-height:50px;padding:12px 18px!important;border:1.5px solid #dfe4ec!important;border-radius:14px!important;background:#fff!important;color:var(--ink)!important;font-size:15px!important;font-weight:600!important;cursor:pointer;box-shadow:0 1px 2px rgba(15,27,45,.04);transition:border-color .12s,background .12s,box-shadow .12s;margin:0!important}',
      '.caf .caf-body .ab-opt:hover,.caf .caf-body .egl-fuelopt:hover{border-color:#b9c3d1!important}',
      '.caf .caf-body .ab-opt.active,.caf .caf-body .egl-fuelopt.active{border-color:var(--r)!important;background:#fff5f6!important;color:var(--r)!important;box-shadow:0 0 0 3px rgba(226,0,26,.08)!important}',
      '.caf .caf-body .ab-opt.dis{opacity:.4;cursor:not-allowed}',
      '.caf .caf-body .ab-opt input,.caf .caf-body .egl-fuelopt input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px}',
      '.caf .caf-body .ab-cnt{background:#dff5e9!important;color:#0f8a4b!important;font-weight:700;font-size:12.5px;border-radius:8px;padding:3px 8px;margin-left:4px}',
      '.caf .caf-body .ab-avtot{width:100%;font-size:13.5px;color:var(--mut);margin:0 0 2px}',
      '.caf .caf-body .ab-label{font-size:14.5px!important;font-weight:800!important;color:var(--ink)!important;margin:4px 0 8px!important}',
      '.caf .caf-body .cain-radio,.caf .caf-body .egl-radio{display:flex!important;align-items:center;gap:12px;padding:14px 16px!important;border:1.5px solid #dfe4ec!important;border-radius:14px;background:#fff;font-size:14.5px!important;font-weight:600;color:var(--ink);cursor:pointer;margin:0!important;transition:border-color .12s,background .12s}',
      '.caf .caf-body .cain-radio:has(input:checked),.caf .caf-body .egl-radio:has(input:checked){border-color:var(--r)!important;background:#fff5f6}',
      '.caf .caf-body .cain-radio input,.caf .caf-body .egl-radio input{accent-color:var(--r);width:19px;height:19px;flex:0 0 auto}',
      '.caf .caf-body .cain-modes,.caf .caf-body .cain-fin,.caf .caf-body .egl-subblock{display:flex;flex-direction:column;gap:10px;border:0!important;padding:0!important;margin:0!important}',
      '.caf .caf-body .cain-sublabel,.caf .caf-body .egl-sublabel{font-size:14px!important;font-weight:800!important;margin:6px 0 0!important;color:var(--ink)}',
      '.caf .caf-body input[type=text],.caf .caf-body input[type=tel],.caf .caf-body input[type=email],.caf .caf-body input[type=date],.caf .caf-body textarea{width:100%;box-sizing:border-box;font:inherit;font-size:15px!important;color:var(--ink);background:#f7f9fc!important;border:1.5px solid #dfe4ec!important;border-radius:12px!important;padding:13px 14px!important;outline:none;min-height:50px}',
      '.caf .caf-body input:focus,.caf .caf-body textarea:focus{border-color:var(--r)!important;background:#fff!important}',
      '.caf .caf-body .ab-grid,.caf .caf-body .cain-grid,.caf .caf-body .egl-fgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.caf .caf-body .ab-grid[style*="none"],.caf .caf-body .cain-grid[style*="none"],.caf .caf-body .egl-fgrid[style*="none"]{display:none!important}',
      '.caf .caf-body .ab-consent,.caf .caf-body .cain-consent,.caf .caf-body .egl-consent{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.45;color:#2b3442}',
      '.caf .caf-body .ab-consent input,.caf .caf-body .cain-consent input,.caf .caf-body .egl-consent input{width:19px;height:19px;accent-color:var(--r);flex:0 0 auto;margin-top:1px}',
      '.caf .caf-body .ab-note,.caf .caf-body .cain-note,.caf .caf-body .egl-fnote,.caf .caf-body .egl-fhint{font-size:12.5px!important;color:var(--mut)!important;text-align:left!important;margin:0!important}',
      '.caf .caf-body .ab-ausinfo{background:#f7f9fc;border-radius:12px;padding:12px 14px;font-size:13px}',
      '.caf.cain-modal .caf-top>img,.caf.egl-modal .caf-top>img{object-fit:cover!important;padding:0!important}',
      '.caf .caf-body .egl-fblock{display:flex!important;flex-direction:column;gap:10px}',
      '.caf .caf-body input[type=file]{font-size:14px;padding:12px;border:1.5px dashed #c9d2e0;border-radius:12px;background:#f7f9fc;width:100%;box-sizing:border-box}',
      '.caf .caf-hl{display:none!important}',
      '.caf .caf-body .ab-opt.dis{text-decoration:none!important;opacity:.5;cursor:pointer!important;border-style:dashed!important}',
      '.caf .caf-body .ab-opt.dis.caf-col{opacity:1}',
      '.caf .caf-body .ab-opt.dis.caf-col .caf-sw{opacity:.8}',
      '.caf .caf-body .ab-opt.dis.caf-col .caf-cn{color:#8c96a5}',
      '.caf .caf-body .ab-opt.dis:hover{opacity:.85;border-color:#b9c3d1!important}',
      '.caf .caf-body .ab-opt.dis *{text-decoration:none!important}',
      '.caf .caf-body .ab-opt.caf-col{flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:148px;padding:8px 8px 10px!important;min-height:0!important;text-align:left}',
      '.caf .caf-body .ab-opt.caf-col .caf-sw{display:block;height:74px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}',
      '.caf .caf-body .ab-opt.caf-col .caf-cn{font-size:13.5px;line-height:1.3;font-weight:600;color:var(--ink);padding:0 2px}',
      '.caf .caf-body .ab-opt.caf-col.active .caf-cn{color:var(--r)}',
      '.caf .caf-body .ab-opt.caf-col.active .caf-sw{box-shadow:inset 0 0 0 1px rgba(0,0,0,.08),0 0 0 2px #fff,0 0 0 4px rgba(226,0,26,.35)}',
      '.caf-pbox .e{font-size:14px;font-weight:700;opacity:.95}',
      '.caf-pbox:not(.on) .e{color:#3a4556}',
      '.caf-est .eu{font-size:15px;font-weight:800;color:#1f2a3a;margin-top:1px}',
      '.caf-rr .v em{font-style:normal;font-size:14px;font-weight:700;color:#3a4556}',
      '.caf-cons{display:flex;flex-direction:column;gap:12px;background:#fffaf0;border:1px solid #f3e2bf;border-radius:14px;padding:14px 16px}',
      '.caf-cons .ab-consent span{display:block}',
      '.caf-cons b{font-weight:800}',
      '.caf-docs{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px}',
      '.caf-docs a{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--ink);background:#fff;border:1px solid #dfe4ec;border-radius:10px;padding:7px 10px;text-decoration:none}',
      '.caf-docs a:hover{border-color:var(--r);color:var(--r)}',
      '.caf-docs a .caf-ic{width:16px;height:16px;color:var(--r)}',
      '.caf-cons small{font-size:12px;color:var(--mut)}',
      '.caf-req.bad{outline:2px solid #f4a3ad;outline-offset:4px;border-radius:8px}',
      '.caf-note{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:#0f6b3d;background:#e6f6ec;border-radius:10px;padding:9px 12px}',
      '.caf-note .caf-ic{width:17px;height:17px;color:#0f6b3d}',
      '.caf-recap{border:1px solid #dfe4ec;border-radius:16px;background:#f8f9fb;padding:14px 16px 6px;margin-bottom:6px}',
      '.caf-rh{display:flex;align-items:center;gap:12px;margin-bottom:8px}',
      '.caf-rh img{width:84px;height:54px;object-fit:contain;background:#fff;border-radius:10px;flex:0 0 auto}',
      '.caf-rh b{display:block;font-size:16px;font-weight:800;color:var(--ink)}',
      '.caf-rh span{display:block;font-size:13.5px;color:var(--mut)}',
      '.caf-rr{display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #e6eaf1;font-size:14px}',
      '.caf-rr .k{color:var(--mut);font-weight:600}',
      '.caf-rr .v{color:var(--ink);font-weight:700;display:flex;align-items:center;gap:8px;min-width:0}',
      '.caf-rr .v small{font-weight:500;color:var(--mut)}',
      '.caf-rr.tot .v{font-size:17px;font-weight:800}',
      '.caf-rsw{display:inline-block;width:22px;height:22px;border-radius:6px;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}',
      '.caf-rch{all:unset;cursor:pointer;font-size:13px;font-weight:700;color:var(--r);padding:4px 6px;border-radius:8px}',
      '.caf-rch:hover{background:#fff0f2}',
      '.caf #abAvBlock>.ab-label,.caf #abFuel>.ab-label,.caf #abTerm>.ab-label,.caf #abKm>.ab-label,.caf .caf-body .egl-flabel{display:none!important}',
      '.caf .caf-park{display:none!important}',
      /* lábléc */
      '.caf-foot{position:sticky;bottom:0;margin:14px -28px 0;background:#fff;border-top:1px solid var(--ln);z-index:5;box-shadow:0 -10px 24px rgba(15,27,45,.05)}',
      '.caf-est{display:grid;grid-template-columns:auto minmax(0,1fr);gap:24px;align-items:center;background:#f6f7f9;padding:10px 28px}',
      '.caf-est .l{font-size:14.5px;font-weight:600;color:#3a4556}',
      '.caf-est .v{font-size:25px;font-weight:800;color:var(--ink);letter-spacing:-.01em;line-height:1.15;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}',
      '.caf-est .v small{font-size:13px;font-weight:500;color:var(--mut)}',
      '.caf-est .s{font-size:13px;color:var(--mut)}',
      '.caf-est .dp{font-size:12.5px;color:var(--mut);margin-top:2px}',
      '.caf-est .d{font-size:12.5px;color:var(--mut);line-height:1.5;text-align:right}',
      '.caf-est.empty{display:none}',
      '.caf-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 28px 16px}',
      '.caf-b0{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;min-height:52px;padding:0 24px;border:1.5px solid #d7dde6;border-radius:14px;font-size:16px;font-weight:700;color:var(--ink);background:#fff}',
      '.caf-b0:hover{background:#f4f6f9}',
      '.caf-b1{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;min-width:min(300px,100%);padding:0 28px;border-radius:14px;background:var(--r);color:#fff;font-size:17px;font-weight:800;box-shadow:0 12px 24px rgba(226,0,26,.25);transition:filter .12s}',
      '.caf-b1:hover{filter:brightness(.94)}',
      '.caf-b1[disabled]{opacity:.6;cursor:wait}',
      '.caf-b1 .caf-ic,.caf-b0 .caf-ic{width:20px;height:20px;color:currentColor}',
      /* V2 elrendezés */
      '.caf.caf-v2 .caf-card{width:min(1120px,100%)!important;max-width:1120px!important}',
      '.caf-v2 .caf-prices,.caf-v2 .caf-foot,.caf-v2 .caf-recap,.caf-v2 .caf-sum,.caf-v2 .caf-step:not(.caf-csec) .caf-sh p{display:none!important}',
      '.caf-v2 .caf-top{grid-template-columns:360px minmax(0,1fr)!important;gap:28px!important}',
      '.caf-v2 .caf-top>img{height:190px!important}',
      '.caf.ab-modal .caf-top>img{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important;outline:0!important;mix-blend-mode:multiply}',
      '.caf-v2 .caf-top h3{font-size:32px!important;margin:6px 0 14px!important}',
      '.caf-v2 .caf-specs{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 18px}',
      '.caf-v2 .caf-spec{font-size:14.5px}',
      '.caf-v2 .caf-spec .caf-ic{width:36px;height:36px;padding:8px;box-sizing:border-box;background:#f3f5f8;border-radius:10px}',
      '.caf-gw{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,1fr);gap:22px;align-items:start}',
      '.caf-v2 .caf-steps{gap:14px}',
      '.caf-v2 .caf-step{background:#fff!important;opacity:1!important;box-shadow:0 1px 3px rgba(15,27,45,.05)}',
      '.caf-v2 .caf-step .caf-sb{display:grid!important;grid-template-columns:minmax(0,1fr)!important;padding:4px 20px 20px 70px!important}',
      '.caf-v2 .caf-step .caf-ibox{display:none!important}',
      '.caf-v2 .caf-sh{cursor:default!important;padding:18px 20px 8px!important;align-items:center!important}',
      '.caf-v2 .caf-sh .n{width:36px;height:36px;font-size:17px;background:#eef1f5!important;color:var(--ink)!important;border:0!important}',
      '.caf-v2 .caf-step.done .caf-sh .n{background:#e7f6ee!important;color:#0f8a4b!important}',
      '.caf-v2 .caf-sh h4{color:var(--ink)!important;font-size:20px}',
      '.caf-ii{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#e3e8ef;color:#5A6B82;font-size:11px;font-weight:800;font-style:italic;vertical-align:middle;margin-left:4px;cursor:help}',
      '.caf-v2 #abTerm .ab-pick,.caf-v2 #abKm .ab-pick{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))}',
      '.caf-v2 #abFuel .ab-pick{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))}',
      '.caf-v2 .caf-body .ab-opt{justify-content:center}',
      '.caf-v2 #abFuel .ab-opt{justify-content:flex-start;gap:12px}',
      '.caf-oi{width:22px!important;height:22px!important}',
      '.caf-v2 #abAvBlock{position:relative}',
      '.caf-v2 #abAvBlock .ab-avtot{display:none!important}',
      '.caf-v2 #abAvBlock:not(.caf-ddopen) #abAvPick{display:none!important}',
      '.caf-v2 #abAvBlock.caf-ddopen #abAvPick{position:absolute;z-index:20;left:0;right:0;top:64px;background:#fff;border:1px solid #dfe4ec;border-radius:14px;box-shadow:0 16px 40px rgba(15,27,45,.16);padding:8px;display:flex!important;flex-direction:column;gap:6px!important}',
      '.caf-v2 #abAvBlock.caf-ddopen #abAvPick .ab-opt{justify-content:space-between;width:100%;box-sizing:border-box}',
      '.caf-dd{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:0 16px;border:1.5px solid #dfe4ec;border-radius:14px;background:#fff;box-shadow:0 2px 8px rgba(15,27,45,.05);font-size:16px;font-weight:600;color:var(--ink)}',
      '.caf-dd .t{flex:1}',
      '.caf-dd .bdg,.caf-ar .bdg{background:#dff5e9;color:#0f8a4b;font-size:12.5px;font-weight:700;border-radius:8px;padding:3px 9px;white-space:nowrap}',
      '.caf-chev{width:18px!important;height:18px!important;color:#3a4556}',
      '.caf-aside{position:sticky;top:96px;display:flex;flex-direction:column;gap:14px}',
      '.caf-acard{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:16px 18px;box-shadow:0 1px 3px rgba(15,27,45,.05)}',
      '.caf-aside .caf-acard:first-child{background:#f6f8fb}',
      '.caf-ah{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}',
      '.caf-ah b{font-size:19px;font-weight:800;color:var(--ink)}',
      '.caf-ah .caf-rch{display:inline-flex;align-items:center;gap:6px}',
      '.caf-ah .caf-rch .caf-ic{width:15px;height:15px;color:var(--r)}',
      '.caf-arows{background:#fff;border-radius:14px;border:1px solid #e9edf2}',
      '.caf-ar{display:grid;grid-template-columns:22px 112px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;border-top:1px solid #eef1f5;font-size:14px;cursor:pointer}',
      '.caf-ar:first-child{border-top:0}',
      '.caf-ar .caf-ic{width:20px;height:20px;color:#3a4556}',
      '.caf-ar .k{color:#5A6B82}',
      '.caf-ar .v{color:var(--ink);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.caf-ar .caf-rsw{width:20px;height:20px}',
      '.caf-apr{display:flex;flex-direction:column;gap:2px}',
      '.caf-apr .l{font-size:14.5px;font-weight:600;color:#3a4556}',
      '.caf-apr .big{font-size:32px;font-weight:800;letter-spacing:-.01em;color:var(--ink);line-height:1.15}',
      '.caf-apr .mid{font-size:22px;font-weight:800;color:var(--ink)}',
      '.caf-apr .s{font-size:13.5px;color:var(--mut)}',
      '.caf-apr .eu{font-size:15px;font-weight:800;color:#1f2a3a}',
      '.caf-apr hr{border:0;border-top:1px solid #eef1f5;margin:12px 0;width:100%}',
      '.caf-apr ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}',
      '.caf-apr li{display:flex;gap:9px;align-items:flex-start;font-size:14px;color:#2b3442}',
      '.caf-apr li .caf-ic{width:18px;height:18px;flex:0 0 auto;color:#fff;background:#19a35b;border-radius:50%;padding:3px;box-sizing:border-box}',
      '.caf-aseg{display:flex;gap:4px;background:#f1f4f8;border-radius:11px;padding:4px;margin-bottom:10px}',
      '.caf-aseg button{all:unset;cursor:pointer;flex:1;text-align:center;font-size:13px;font-weight:700;color:#5A6B82;padding:8px 6px;border-radius:8px}',
      '.caf-aseg button.on{background:#fff;color:var(--r);box-shadow:0 1px 3px rgba(15,27,45,.12)}',
      '.caf-v2 .caf-csec{margin-top:18px}',
      '.caf-v2 .caf-csec .caf-sh .n{background:var(--r)!important;color:#fff!important}',
      '.caf-v2 .caf-csec .caf-sh p{display:block!important}',
      '.caf-v2 .caf-csec .caf-sb{padding:6px 20px 20px!important}',
      '.caf-v2 .caf-csec .caf-body{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}',
      '.caf-v2 .caf-csec .caf-body>*{grid-column:1/-1}',
      '.caf-v2 .caf-csec .caf-body>.ab-block{grid-column:1;grid-row:1}',
      '.caf-v2 .caf-csec .caf-body>.caf-decl{grid-column:2;grid-row:1}',
      '.caf-v2 .caf-csec .ab-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
      '.caf-v2 .caf-csec .ab-grid[style*="none"]{display:none!important}',
      '.caf-v2 .caf-csec .ab-block{display:flex!important;flex-direction:column;gap:14px}',
      '.caf-f{display:flex;flex-direction:column;gap:6px;min-width:0}',
      '.caf-fl{font-size:14px;font-weight:700;color:var(--ink)}',
      '.caf-fl i{color:var(--r);font-style:normal}',
      '.caf-in{position:relative;display:flex}',
      '.caf-in>.caf-ic{position:absolute;left:13px;top:15px;width:19px;height:19px;color:#5A6B82;pointer-events:none}',
      '.caf.caf-v2 .caf-body .caf-in input,.caf.caf-v2 .caf-body .caf-in textarea{padding-left:42px!important;background:#fff!important}',
      '.caf-v2 .caf-csec .ab-note{display:none!important}',
      '.caf-v2 .caf-in textarea{min-height:96px}',
      '.caf-cnt{position:absolute;right:12px;bottom:8px;font-size:11.5px;color:#8c96a5}',
      '.caf-f.caf-off>.caf-fl,.caf-f.caf-off .caf-in>.caf-ic,.caf-f.caf-off .caf-cnt{display:none}',
      '.caf-decl{background:#fffaf2;border:1px solid #f1e3c7;border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:14px}',
      '.caf-dh{display:flex;gap:12px;align-items:flex-start}',
      '.caf-dh .caf-ic{width:28px;height:28px;color:#1f2a3a}',
      '.caf-dh b{display:block;font-size:17px;font-weight:800;color:var(--ink)}',
      '.caf-dh span{display:block;font-size:13.5px;color:var(--mut)}',
      '.caf-v2 .caf-decl .caf-cons{background:none;border:0;padding:0}',
      '.caf-v2 .caf-docs{flex-direction:column;flex-wrap:nowrap}',
      '.caf-v2 .caf-docs a{display:grid;grid-template-columns:18px minmax(0,1fr) auto 18px;align-items:center;gap:10px;padding:10px 12px}',
      '.caf-pdf{font-size:11px;font-weight:700;color:#8c96a5;letter-spacing:.04em}',
      '.caf-dli{width:17px!important;height:17px!important;color:#3a4556!important}',
      '.caf-v2 .caf-decl small{display:none}',
      '.caf-bar{position:sticky;bottom:0;margin:16px -28px 0;background:#fff;border-top:1px solid var(--ln);box-shadow:0 -10px 24px rgba(15,27,45,.06);display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(280px,1fr);gap:20px;align-items:center;padding:14px 28px 16px;z-index:7}',
      '.caf-be,.caf-bd{display:flex;gap:12px;align-items:center;min-width:0}',
      '.caf-bd{border-left:1px solid #eef1f5;padding-left:20px}',
      '.caf-be>.caf-ic,.caf-bd>.caf-ic{width:30px;height:30px;color:#1f2a3a;flex:0 0 auto}',
      '.caf-be .l,.caf-bd .l{display:block;font-size:13.5px;font-weight:600;color:#3a4556}',
      '.caf-be .v{display:block;font-size:25px;font-weight:800;color:var(--ink);line-height:1.15}',
      '.caf-be .v small{font-size:13px;font-weight:500;color:var(--mut)}',
      '.caf-be .eu{display:block;font-size:14.5px;font-weight:800;color:#1f2a3a}',
      '.caf-bd .v{display:block;font-size:20px;font-weight:800;color:var(--ink)}',
      '.caf-bd .s{display:block;font-size:12.5px;color:var(--mut)}',
      '.caf-bg{display:flex;flex-direction:column;align-items:stretch;gap:6px}',
      '.caf-bg .caf-b1{width:100%}',
      '.caf-bg small{font-size:12px;color:var(--mut);text-align:center}',
      '@media(max-width:900px){.caf-gw{grid-template-columns:1fr}.caf-aside{position:static}.caf-v2 .caf-csec .caf-body{grid-template-columns:1fr}.caf-v2 .caf-csec .caf-body>.caf-decl{grid-column:1;grid-row:auto}.caf-bar{grid-template-columns:1fr auto}.caf-bd{display:none}.caf-bg small{display:none}}',
      '@media(max-width:640px){.caf-v2 .caf-step:not(.on){display:block!important}.caf-v2 .caf-step .caf-sb{padding:4px 0 14px!important}.caf-v2 .caf-step{border:1px solid #e3e8ef!important;padding:0 14px}.caf-v2 .caf-sh{padding:14px 0 6px!important}.caf-v2 .caf-top{grid-template-columns:1fr!important}.caf-v2 .caf-top>img{height:130px!important}.caf-v2 .caf-top h3{font-size:22px!important}.caf-v2 .caf-specs{display:none}.caf-v2 #abTerm .ab-pick,.caf-v2 #abKm .ab-pick{grid-template-columns:repeat(2,1fr)}.caf-v2 #abFuel .ab-pick{grid-template-columns:1fr 1fr}.caf-v2 .caf-csec .ab-grid{grid-template-columns:1fr}.caf-bar{margin:12px -16px 0;padding:10px 16px calc(12px + env(safe-area-inset-bottom));grid-template-columns:1fr;gap:8px}.caf-be .v{font-size:20px}.caf-ar{grid-template-columns:20px 100px minmax(0,1fr) auto}}',

      /* mobil */
      '@media(max-width:640px){',
      '.caf .caf-card{width:100%!important;max-height:100dvh!important;height:100dvh;border-radius:0!important;padding:0 16px 0!important;margin:0!important}',
      '.caf .caf-top{margin-top:16px!important}',
      '.caf{padding:0!important;align-items:stretch!important}',
      '.caf .caf-top{grid-template-columns:1fr;gap:10px;padding-right:0!important;text-align:left}',
      '.caf .caf-top>img{height:120px!important}',
      '.caf .caf-top h3{font-size:21px!important;margin:2px 0 4px!important}',
      '.caf-specs{display:none}',
      '.caf-prices{margin-bottom:12px}.caf-pbox{padding:10px 12px;min-height:60px}.caf-pbox .v{font-size:18px}.caf-pbox .l{font-size:12.5px}.caf-pbox .s{font-size:11.5px}',
      '.caf-prices.single{grid-template-columns:1fr}.caf-seg{margin:0 8px 8px}',
      '.caf-stepper{margin:0 -16px 14px;padding:10px 16px 0}',
      '.caf-sp{min-width:44px;font-size:12px;padding-bottom:10px}.caf-sp i{width:28px;height:28px;font-size:13px}.caf-sp:before{top:14px;left:calc(-50% + 18px);right:calc(50% + 18px)}',
      '.caf-sp:not(.on) span{display:none}.caf-sp.on{flex:2 1 0}.caf-sp.on span{white-space:nowrap}',
      '.caf-step:not(.on){display:none}',
      '.caf-step.on{border:0;box-shadow:none;background:none}',
      '.caf-sh{padding:6px 0 4px;gap:12px}.caf-sh h4{font-size:18px}',
      '.caf-sb,.caf-step.on.hasinfo .caf-sb{padding:10px 0 12px;grid-template-columns:1fr}',
      '.caf .caf-body .ab-grid,.caf .caf-body .cain-grid,.caf .caf-body .egl-fgrid{grid-template-columns:1fr}',
      '.caf .caf-body .ab-opt,.caf .caf-body .egl-fuelopt{flex:1 1 calc(50% - 10px);justify-content:center}',
      '.caf .caf-body .ab-opt.caf-col{width:auto;flex:1 1 calc(50% - 10px)}',
      '.caf-rr{grid-template-columns:1fr auto;gap:2px 10px}.caf-rr .k{grid-column:1/-1;font-size:12.5px}',
      '.caf-foot{margin:10px -16px 0}',
      '.caf-est{grid-template-columns:1fr;gap:4px;padding:10px 16px}.caf-est .v{font-size:22px}.caf-est .d{display:none}',
      '.caf-nav{padding:10px 16px calc(12px + env(safe-area-inset-bottom))}.caf-b0{min-height:50px;padding:0 16px;font-size:15px}.caf-b1{min-width:0;flex:1;min-height:52px;font-size:16px;padding:0 16px}',
      '}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- színminták + nem kompatibilis opciók ---------- */
  function decorate(M) {
    if (M.A !== AB) return;
    qa('#abColor .ab-opt:not([data-csw])', M.modal).forEach(function (l) {
      l.setAttribute('data-csw', '1'); l.classList.add('caf-col');
      var dot = l.querySelector('i'), nm = tx(l);
      var sw = mk('span', 'caf-sw'); sw.style.background = swatch(nm, dot ? dot.style.background || dot.style.backgroundColor : '');
      if (dot) dot.replaceWith(sw); else l.insertBefore(sw, l.firstChild);
      var tn = [].filter.call(l.childNodes, function (c) { return c.nodeType === 3 && c.nodeValue.trim(); })[0];
      if (tn) { var sp = mk('span', 'caf-cn'); sp.textContent = tn.nodeValue.trim(); tn.replaceWith(sp); }
    });
    qa('.ab-opt.dis:not([title])', M.modal).forEach(function (l) { l.title = T.otherCfg; });
    if (M.v2) decorateV2(M);
  }
  function activeVi(m, p) { var o = m.querySelector('.ab-opt.active[data-fp="' + p + '"]'); return o ? +o.getAttribute('data-vi') : null; }
  function forceSelect(M, fp, vi) {
    var m = M.modal, prev = [];
    for (var p = 0; p <= 5; p++) prev[p] = activeVi(m, p);
    for (var c = 0; c < 3; c++) {            /* minden választás törlése (az egyértelmű, automatikus értékek visszajönnek) */
      for (p = 0; p <= 5; p++) { var o = m.querySelector('.ab-opt.active[data-fp="' + p + '"]'); if (o) o.click(); }
    }
    var t = m.querySelector('.ab-opt[data-fp="' + fp + '"][data-vi="' + vi + '"]');
    if (!t || t.classList.contains('dis')) { /* visszaállítás */ prev.forEach(function (v, i) { if (v === null) return; var x = m.querySelector('.ab-opt[data-fp="' + i + '"][data-vi="' + v + '"]:not(.dis):not(.active)'); if (x) x.click(); }); return; }
    if (!t.classList.contains('active')) t.click();
    var order = [5, 0, 4, 3, 1, 2];           /* a korábbi választások visszaállítása, ahol még összeillenek */
    order.forEach(function (i) {
      if (i === fp || prev[i] === null) return;
      var x = m.querySelector('.ab-opt[data-fp="' + i + '"][data-vi="' + prev[i] + '"]');
      if (x && !x.classList.contains('dis') && !x.classList.contains('active')) x.click();
    });
    decorate(M); later(M);
    var blk0 = q(['#abFuel', '#abTerm', '#abKm', '#abColor', '#abAus', '#abAvPick'][fp], m), d = M.defs && M.defs[M.cur], body = (M.v2 && blk0 && blk0.closest('.caf-body')) || (d && q('.caf-body', d.sec));
    if (body) {
      var n = q('.caf-note', body) || mk('div', 'caf-note');
      n.innerHTML = svg('check') + '<span>' + esc(T.adapted) + '</span>'; body.insertBefore(n, q('.caf-err', body));
      clearTimeout(M.nt); M.nt = setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 5000);
    }
  }
  document.addEventListener('click', function (e) {
    var o = e.target && e.target.closest && e.target.closest('.caf .ab-opt.dis');
    if (!o) return;
    var mo = o.closest('.ab-modal'), M = mo && stateOf(mo); if (!M) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    forceSelect(M, +o.getAttribute('data-fp'), +o.getAttribute('data-vi'));
  }, true);

  /* ---------- euró-fizetés + szerződésdokumentumok elfogadása (HU bérlés) ---------- */
  var DOCS = ['/szerzodes-minta/1-berleti-szerzodes-mietvertrag.pdf', '/szerzodes-minta/2-berleti-feltetelek-mietbedingungen.pdf', '/szerzodes-minta/3-atadasi-jegyzokonyv-uebergabeprotokoll.pdf', '/szerzodes-minta/4-serulesrajzok-schadenskizzen.pdf', '/szerzodes-minta/5-jogosult-vezetok-fahrer.pdf'];
  function consents(M) {
    if (M.cons) return M.cons;
    var w = mk('div', 'caf-cons');
    w.innerHTML =
      '<label class="ab-consent caf-req"><input type="checkbox" name="eurpay" data-caf-req="1"><span>' + T.eurCons + '</span></label>' +
      '<label class="ab-consent caf-req"><input type="checkbox" name="contractdocs" data-caf-req="1"><span>' + T.docCons +
      '<span class="caf-docs">' + DOCS.map(function (u, i) { return '<a href="' + u + '" target="_blank" rel="noopener">' + svg('doc') + esc(T.docs[i]) + '</a>'; }).join('') + '</span><small>(' + esc(T.pdf) + ')</small></span></label>';
    w.addEventListener('click', function (e) { if (e.target.closest('a')) e.stopPropagation(); });
    M.cons = w; return w;
  }
  function reqOk(M) {
    var bad = qa('input[data-caf-req]', M.modal).filter(function (i) { return !i.checked && i.closest('.caf-step'); });
    qa('.caf-req', M.modal).forEach(function (l) { var i = q('input', l); l.classList.toggle('bad', !!(i && !i.checked && bad.length)); });
    return !bad.length;
  }
  document.addEventListener('submit', function (e) {   /* Enterrel sem lehet megkerülni */
    var f = e.target; if (!f || f.id !== 'abForm') return;
    var mo = f.closest('.ab-modal'), M = mo && stateOf(mo); if (!M || !M.cons || !M.cons.closest('form')) return;
    if (!reqOk(M)) { e.preventDefault(); e.stopImmediatePropagation(); var g = q('#abMsg', mo); if (g) { g.className = 'ab-msg err'; g.textContent = T.consErr; } }
  }, true);
  (function () {   /* a lead-ben is jelenjen meg */
    var prev = window.caLeadExtras;
    var mine = function () {
      var r = {}; try { if (prev) r = prev.apply(this, arguments) || {}; } catch (e) { }
      try {
        var m = document.getElementById('abRent');
        if (m && m.getAttribute('aria-hidden') === 'false') {
          var a = m.querySelector('input[name=eurpay]'), b = m.querySelector('input[name=contractdocs]');
          if (a) r['Euróban fizet'] = a.checked ? 'Tudomásul vette (bérleti díj és kaució EUR-ban)' : 'NEM';
          if (b) r['Szerződésdokumentumok'] = b.checked ? 'Megismerte és elfogadta (bérleti szerződés + 1–4. sz. melléklet)' : 'NEM';
        }
      } catch (e) { }
      return r;
    };
    window.caLeadExtras = mine;
  })();

  /* ---------- összegzés (utolsó lépés) ---------- */
  function recap(M) {
    var d = M.defs.filter(function (x) { return x.contact; })[0]; if (!d || !d.recap) return;
    var rows = [];
    M.defs.forEach(function (x, i) {
      if (x.contact || x.sec.classList.contains('caf-x')) return;
      if (x.split) {
        [['#abColor', 'color'], ['#abAus', 'ausstattung']].forEach(function (pr) {
          var blk = q(pr[0], M.modal); if (!blk || blk.style.display === 'none') return;
          var inp = q('input[name=' + pr[1] + ']:checked', blk), lab = inp && inp.closest('label'), sw2 = '';
          var cs2 = lab && q('.caf-sw', lab); if (cs2) sw2 = '<i class="caf-rsw" style="background:' + esc(cs2.style.background) + '"></i>';
          var kt = tx(q('.ab-label', blk)).replace(/^\d+\.\s*/, '');
          rows.push('<div class="caf-rr"><span class="k">' + esc(kt) + '</span><span class="v">' + sw2 + esc(lab ? tx(lab) : '—') + '</span><button type="button" class="caf-rch" data-go="' + i + '">' + esc(T.change) + '</button></div>');
        });
        return;
      }
      var s = T.s[x.k] || [x.k], v = summary(M, x), sw = '';
      var ci = q('input[name=color]:checked', x.sec);
      if (ci) { var cl = ci.closest('label'), cs = cl && q('.caf-sw', cl); if (cs) sw = '<i class="caf-rsw" style="background:' + esc(cs.style.background) + '"></i>'; }
      rows.push('<div class="caf-rr"><span class="k">' + esc(s[0]) + '</span><span class="v">' + sw + esc(v || '—') + '</span><button type="button" class="caf-rch" data-go="' + i + '">' + esc(T.change) + '</button></div>');
    });
    var e = M.A.est(M, M.kind), car = tx(q(M.A.title, M.modal)), img = q(M.A.img, M.modal);
    var html = '<div class="caf-rh">' + (img && img.getAttribute('src') ? '<img src="' + esc(img.getAttribute('src')) + '" alt="">' : '') + '<div><b>' + esc(T.recap) + '</b><span>' + esc(car) + '</span></div></div>' + rows.join('') +
      (e && e.val ? '<div class="caf-rr tot"><span class="k">' + esc(e.label) + '</span><span class="v">' + esc(e.val) + (e.eur ? ' <em>' + esc(e.eur) + '</em>' : '') + (e.sub ? ' <small>' + esc(e.sub) + '</small>' : '') + '</span></div>' : '');
    if (d.recap.__h !== html) { d.recap.innerHTML = html; d.recap.__h = html; }
    d.recap.style.display = rows.length ? '' : 'none';
  }

  /* ---------- felépítés ---------- */
  function resolve(M, n) { return typeof n === 'string' ? q(n, M.modal) : n; }

  function setup(M) {
    var A = M.A, m = M.modal, card = q(A.card, m), form = q(A.form, m), head = q(A.head, m);
    if (!card || !form || !head) return false;
    if (!M.ready) {
      css();
      m.classList.add('caf'); card.classList.add('caf-card'); head.classList.add('caf-top');
      A.hide.forEach(function (s) { qa(s, m).forEach(function (e) { e.classList.add('caf-hl'); }); });
      if (A === CAIN) {
        var rn = q('.cain-rent p.cain-note', m); if (rn) rn.setAttribute('data-caf', 'rnote');
        var fn = qa('.cain-form > p.cain-note', m); if (fn.length) fn[fn.length - 1].setAttribute('data-caf', 'note');
      }
      M.specs = mk('div', 'caf-specs');
      var ht = head.querySelector(':scope > div'); (ht || head).appendChild(M.specs);
      M.prices = mk('div', 'caf-prices'); head.parentNode.insertBefore(M.prices, head.nextSibling);
      M.stepper = mk('div', 'caf-stepper'); M.prices.parentNode.insertBefore(M.stepper, M.prices.nextSibling);
      M.steps = mk('div', 'caf-steps'); form.insertBefore(M.steps, form.firstChild);
      M.park = mk('div', 'caf-park'); form.appendChild(M.park);
      M.foot = mk('div', 'caf-foot',
        '<div class="caf-est"><div><div class="l"></div><div class="v"></div><div class="eu"></div><div class="s"></div><div class="dp"></div></div><div class="d"></div></div>' +
        '<div class="caf-nav"><button type="button" class="caf-b0"></button><button type="button" class="caf-b1"></button></div>');
      card.appendChild(M.foot);
      M.b0 = q('.caf-b0', M.foot); M.b1 = q('.caf-b1', M.foot);
      M.b0.addEventListener('click', function () { if (M.cur > 0) go(M, M.cur - 1); else { var x = q(A.close, m); if (x) x.click(); } });
      M.b1.addEventListener('click', function () { next(M); });
      M.stepper.addEventListener('click', function (e) { var b = e.target.closest('.caf-sp'); if (!b) return; var i = +b.getAttribute('data-i'); if (M.v2) scrollToSec(M, M.defs[i].sec); else go(M, i); });
      M.prices.addEventListener('click', function (e) {
        var b = e.target.closest('[data-who]'); if (!b) return;
        var who = b.getAttribute('data-who');
        var t = qa(A.tgl, m).filter(function (x) { return x.getAttribute(A.tglAttr) === who; })[0];
        if (t) t.click(); later(M);
      });
      m.addEventListener('click', function () { later(M); });
      m.addEventListener('change', function () { later(M); });
      m.addEventListener('input', function (e) { if (e.target && e.target.closest('.caf-step')) clearErr(M); });
      try { new MutationObserver(function () { decorate(M); }).observe(m, { childList: true, subtree: true }); } catch (e) { }
      M.ready = true;
    }
    build(M);
    return true;
  }

  function build(M) {
    var A = M.A, kind = A.kind(M);
    /* minden korábbi tartalmat parkolóba (a mezők a formon belül maradnak) */
    qa('.caf-step', M.modal).forEach(function (sec) { qa('.caf-body', sec).forEach(function (b) { while (b.firstChild) M.park.appendChild(b.firstChild); }); if (sec.parentNode) sec.parentNode.removeChild(sec); });
    M.steps.innerHTML = ''; M.stepper.innerHTML = '';
    M.kind = kind; M.defs = A.steps(M, kind); M.cur = 0;
    M.defs.forEach(function (d, i) {
      var s = T.s[d.k] || [d.k, '', d.k];
      var sec = mk('section', 'caf-step', '<div class="caf-sh"><span class="n">' + (i + 1) + '</span><div><h4>' + esc(s[0]) + '</h4><p>' + esc(s[1]) + '</p></div><span class="caf-sum"></span></div><div class="caf-sb"><div class="caf-body"></div></div>');
      var body = q('.caf-body', sec);
      d.nodes.forEach(function (n) { var e = resolve(M, n); if (e) body.appendChild(e); });
      if (d.info) { sec.classList.add('hasinfo'); q('.caf-sb', sec).appendChild(mk('div', 'caf-ibox', '<b>' + svg('info') + esc(T.info) + '</b><span class="t"></span>')); }
      if (d.hideFirstLabel) { var fl = q(d.hideFirstLabel, body); if (fl) fl.classList.add('caf-hl'); }
      if (d.contact && M.A === AB && MK === 'hu') { var cw = consents(M), asz = q('.ab-consent:not(.ab-plate):not(.caf-req)', body); body.insertBefore(cw, asz || q('.caf-err', body)); }
      if (d.contact) { d.recap = mk('div', 'caf-recap'); body.insertBefore(d.recap, body.firstChild); d.recap.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) go(M, +b.getAttribute('data-go')); }); }
      body.appendChild(mk('div', 'caf-err', esc(T.pick)));
      q('.caf-sh', sec).addEventListener('click', function () { if (M.cur !== i) go(M, i); });
      d.sec = sec; M.steps.appendChild(sec);
      var sp = mk('button', 'caf-sp', '<i>' + (i + 1) + '</i><span>' + esc(s[2]) + '</span>'); sp.type = 'button'; sp.setAttribute('data-i', i); d.sp = sp; M.stepper.appendChild(sp);
    });
    /* üresen maradt eredeti konténerek elrejtése */
    if (M.A === CAIN) { ['.cain-buy', '.cain-rent'].forEach(function (s) { var e = q(s, M.modal); if (e) e.classList.add('caf-hl'); }); }
    M.v2 = isV2(M); layoutV2(M, M.v2);
    go(M, 0, true);
  }

  function visibleDefs(M) { return M.defs.filter(function (d) { return !d.sec.classList.contains('caf-x'); }); }

  function go(M, i, silent) {
    var list = M.defs;
    if (i < 0) i = 0; if (i > list.length - 1) i = list.length - 1;
    while (list[i] && list[i].sec.classList.contains('caf-x') && i < list.length - 1) i++;
    M.cur = i;
    var vi = 0;
    list.forEach(function (d, j) {
      var x = d.sec.classList.contains('caf-x');
      d.sec.style.display = x ? 'none' : ''; d.sp.style.display = x ? 'none' : '';
      if (!x) { vi++; q('.n', d.sec).textContent = vi; q('i', d.sp).textContent = j < i ? '' : vi; if (j < i) q('i', d.sp).innerHTML = svg('check', 'caf-ic'); }
      d.sec.classList.toggle('on', j === i); d.sec.classList.toggle('done', j < i);
      d.sp.classList.toggle('on', j === i); d.sp.classList.toggle('done', j < i);
    });
    clearErr(M); refresh(M);
    if (!silent && !M.v2) {
      var card = q(M.A.card, M.modal), sec = list[i].sec;
      if (card) {
        var doScroll = function () {
          var top;
          if (window.innerWidth <= 640) top = M.stepper.offsetTop;
          else {
            var cr = card.getBoundingClientRect(), sr = sec.getBoundingClientRect();
            top = card.scrollTop + (sr.top - cr.top) - M.stepper.offsetHeight - 16;
          }
          card.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        };
        requestAnimationFrame(function () { requestAnimationFrame(doScroll); });
      }
      var f = sec.querySelector('.caf-body input:not([type=hidden]):not([type=radio]):not([type=checkbox]),.caf-body textarea');
      if (f && list[i].contact && window.innerWidth > 640) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { } }, 250);
    }
  }

  function lastIdx(M) { for (var j = M.defs.length - 1; j >= 0; j--) if (!M.defs[j].sec.classList.contains('caf-x')) return j; return 0; }

  function clearErr(M) { qa('.caf-err.on', M.modal).forEach(function (e) { e.classList.remove('on'); }); }

  function valid(M, d) {
    if (d.names) return d.names.every(function (n) { return valid(M, { name: n, sec: d.sec }); });
    if (!d.name) return true;
    var f = q(M.A.form, M.modal), all = qa('input[name="' + d.name + '"]', f).filter(function (i) { return d.sec.contains(i) || d.name === 'mode'; });
    if (!all.length) return true;
    var en = all.filter(function (i) { return !i.disabled; }); if (!en.length) return true;
    return all.some(function (i) { return i.checked; });
  }

  function next(M) {
    var d = M.defs[M.cur];
    if (!valid(M, d)) { var e = q('.caf-err', d.sec); if (e) e.classList.add('on'); return; }
    if (M.cur >= lastIdx(M)) {
      if (!reqOk(M)) { var g = q(M.A.msg, M.modal); if (g) { g.className = (M.A === AB ? 'ab-msg' : 'cain-msg') + ' err'; g.textContent = T.consErr; } var bl = q('.caf-req.bad', M.modal); if (bl) bl.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      submit(M); return;
    }
    var j = M.cur + 1; while (j < M.defs.length && M.defs[j].sec.classList.contains('caf-x')) j++;
    go(M, j);
  }

  function submit(M) {
    var f = q(M.A.form, M.modal), b = q(M.A.submit, M.modal);
    if (!f) return;
    try { if (f.requestSubmit) { if (b && f.contains(b)) f.requestSubmit(b); else f.requestSubmit(); } else if (b) b.click(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); } catch (e) { if (b) b.click(); }
    later(M); setTimeout(function () { refresh(M); var g = q(M.A.msg, M.modal); if (g && tx(g)) { var card = q(M.A.card, M.modal); if (card) card.scrollTo({ top: card.scrollHeight, behavior: 'smooth' }); } }, 120);
  }

  function summary(M, d) {
    var body = q('.caf-body', d.sec); if (!body) return '';
    if (d.contact) {
      if (d.recap && d.recap.contains(body)) return '';
      var ln = q('input[name=lastname]', body), fn = q('input[name=firstname]', body), em = q('input[name=email]', body);
      return [(ln && ln.value || '') + ' ' + (fn && fn.value || ''), em && em.value].map(function (x) { return (x || '').trim(); }).filter(Boolean).join(' · ');
    }
    var out = [];
    qa('input:checked', body).forEach(function (i) {
      if (i.type === 'checkbox') return;
      var l = i.closest('label'), t = i.value;
      if (l) { var cn = l.querySelector('.ab-cnt'); t = cn ? tx(l).slice(0, tx(l).length - tx(cn).length).trim() : tx(l); }
      out.push(t);
    });
    qa('input[type=text],input[type=date]', body).forEach(function (i) {
      if (!i.value) return;
      if (i.type === 'date') { var p = i.value.split('-'); out.push(LG === 'hu' ? p[0] + '. ' + p[1] + '. ' + p[2] + '.' : p[2] + '.' + p[1] + '.' + p[0]); } else out.push(i.value);
    });
    qa('input[type=file]', body).forEach(function (i) { if (i.files && i.files[0]) out.push(i.files[0].name); });
    return out.join(' · ');
  }

  var tm = 0;
  function later(M) { clearTimeout(tm); tm = setTimeout(function () { refresh(M); }, 30); }

  function refresh(M) {
    if (!M.defs || M.modal.getAttribute('aria-hidden') !== 'false') return;
    var A = M.A, m = M.modal;
    decorate(M);
    /* később érkező blokkok (pl. átvételi dátum) a helyükre */
    M.defs.forEach(function (d) {
      if (d.late) { var e = q(d.late, m), body = q('.caf-body', d.sec); if (e && e.parentNode !== body) { var err = q('.caf-err', body); body.insertBefore(e, err); } }
      /* üres lépés elrejtése (pl. nincs színválasztás) */
      if (!d.contact) {
        var body2 = q('.caf-body', d.sec), any = [].some.call(body2.children, function (c) { return !c.classList.contains('caf-err') && !c.classList.contains('caf-hl') && shown(c) && (c.matches('input,textarea,select') || c.querySelector('input,textarea,select,label,li') || tx(c)); });
        var was = d.sec.classList.contains('caf-x'); d.sec.classList.toggle('caf-x', !any);
        if (was !== !any) { d.sec.style.display = any ? '' : 'none'; d.sp.style.display = any ? '' : 'none'; }
      }
      if (d.renum) qa('.ab-label', d.sec).forEach(function (l) { var n = l.firstChild; if (n && n.nodeType === 3 && /^\s*\d+\.\s*/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/^\s*\d+\.\s*/, ''); });
      var s = q('.caf-sum', d.sec), v = summary(M, d);
      s.innerHTML = v ? svg('check') + '<span>' + esc(v) + '</span>' : '';
      if (d.info) { var t = q('.caf-ibox .t', d.sec), it = A.info ? A.info(M) : ''; t.textContent = it; q('.caf-ibox', d.sec).style.display = it ? '' : 'none'; d.sec.classList.toggle('hasinfo', !!it); }
    });
    recap(M);
    /* sorszámok újraszámolása */
    var vi = 0; M.defs.forEach(function (d, j) { if (d.sec.classList.contains('caf-x')) return; vi++; q('.n', d.sec).textContent = vi; if (j >= M.cur) q('i', d.sp).textContent = vi; });
    /* specifikációk */
    var sp = A.specs(M) || [];
    M.specs.innerHTML = sp.slice(0, 6).map(function (x, i) { return '<div class="caf-spec">' + svg(x[0]) + '<span title="' + esc(x[1]) + '">' + esc(x[1]) + '</span></div>'; }).join('');
    var h3 = q(A.title, m); if (h3) h3.classList.toggle('long', tx(h3).length > 30);
    /* árak */
    var p = A.prices(M, M.kind), tg = qa(A.tgl, m);
    var key = JSON.stringify(p) + tg.length;
    if (M.pkey !== key) {
      M.pkey = key;
      if (p.pair) {
        M.prices.className = 'caf-prices';
        M.prices.innerHTML =
          '<button type="button" class="caf-pbox' + (!p.priv ? ' on' : '') + '" data-who="Cég"><span class="l">' + esc(T.co) + '</span><span class="v">' + esc(p.pair.co) + '</span>' + (p.pair.coE ? '<span class="e">' + esc(p.pair.coE) + ' + ' + esc(T.plusVat.replace(/^\+\s*/, '')) + '</span>' : '') + '</button>' +
          '<button type="button" class="caf-pbox' + (p.priv ? ' on' : '') + '" data-who="Magánszemély"><span class="l">' + esc(T.priv) + '</span><span class="v">' + esc(p.pair.priv) + '</span>' + (p.pair.privE ? '<span class="e">' + esc(p.pair.privE) + ' ' + esc(T.vat19) + '</span>' : '<span class="s">' + esc(T.vat19) + '</span>') + '</button>';
      } else {
        M.prices.className = 'caf-prices single';
        var seg = tg.length > 1 ? '<div class="caf-seg">' + tg.map(function (t) { var w = t.getAttribute(A.tglAttr); return '<button type="button" data-who="' + esc(w) + '" class="' + (t.classList.contains('active') ? 'on' : '') + '" title="' + esc(tx(t)) + '">' + esc(shortLbl(tx(t))) + '</button>'; }).join('') + '</div>' : '';
        var cp = cleanP(p.cur), act = tg.filter(function (t) { return t.classList.contains('active'); })[0];
        var lb = act && tg.length > 1 ? shortLbl(tx(act)) : T.price;
        M.prices.innerHTML = (p.cur ? '<div class="caf-pbox"><span class="l">' + esc(lb) + '</span><span class="v" style="font-size:20px">' + esc(cp.v) + (cp.sub ? ' <small style="font-size:13px;font-weight:500;color:#5A6B82">' + esc(cp.sub) + '</small>' : '') + '</span></div>' : '<div></div>') + seg;
        M.prices.style.display = (p.cur || seg) ? '' : 'none';
      }
    }
    /* lábléc */
    var e = A.est(M, M.kind), est = q('.caf-est', M.foot);
    est.classList.toggle('empty', !e || !e.val);
    if (e && e.val) {
      q('.l', est).textContent = e.label; q('.v', est).innerHTML = esc(e.val) + (e.sub ? ' <small>' + esc(e.sub) + '</small>' : ''); q('.s', est).textContent = '';
      q('.dp', est).textContent = e.dep || ''; q('.d', est).textContent = e.disc || '';
      var eu = q('.eu', est); eu.textContent = e.eur || ''; eu.style.display = e.eur ? '' : 'none';
    }
    if (M.v2) refreshV2(M);
    var last = M.cur >= lastIdx(M), ob = q(A.submit, m), busy = ob && ob.disabled;
    M.b0.innerHTML = M.cur > 0 ? svg('left') + esc(T.back) : esc(T.cancel);
    M.b1.innerHTML = busy ? esc(T.sending) : esc(last ? A.btn(M) : T.next) + svg('right');
    M.b1.disabled = !!busy;
  }

  /* ---------- V2 elrendezés (teszt: BMW X3, vagy ?caf=v2 az URL-ben) ---------- */
  var TV = (T.v2 || TX.hu.v2);
  function isV2(M) {
    if (M.A !== AB) return false;
    if (/[?&#]caf=v2/.test(location.href)) return true;
    if (/[?&#]caf=v1/.test(location.href)) return false;
    return /^BMW X3\b/i.test(tx(q('#abTitle', M.modal)));
  }
  function scrollToSec(M, sec) {
    var card = q(M.A.card, M.modal); if (!card || !sec) return;
    var top = card.scrollTop + (sec.getBoundingClientRect().top - card.getBoundingClientRect().top) - M.stepper.offsetHeight - 14;
    card.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
  var FIELDS = { lastname: 'user', firstname: 'user', company: 'bldg', taxid: 'doc', phone: 'phone', email: 'mail', message: 'pen' };
  function wrapFields(M, on) {
    Object.keys(FIELDS).forEach(function (n) {
      var inp = q('#abForm [name=' + n + ']', M.modal); if (!inp) return;
      if (!inp.hasAttribute('data-ph0')) inp.setAttribute('data-ph0', inp.placeholder || '');
      var w = inp.closest('.caf-f');
      if (on && !w) {
        w = mk('div', 'caf-f'); var req = /\*/.test(inp.getAttribute('data-ph0')) || n === 'phone';
        w.innerHTML = '<label class="caf-fl">' + esc(TV.lbl[n] || n) + (req ? ' <i>*</i>' : '') + '</label><div class="caf-in">' + svg(FIELDS[n]) + '</div>';
        inp.parentNode.insertBefore(w, inp); q('.caf-in', w).appendChild(inp);
        if (n === 'message') { var cnt = mk('span', 'caf-cnt', '0 / 500'); q('.caf-in', w).appendChild(cnt); inp.addEventListener('input', function () { cnt.textContent = (inp.value || '').length + ' / 500'; }); }
      }
      if (w) w.classList.toggle('caf-off', !on);
      inp.placeholder = on ? (TV.ph[n] || '') : inp.getAttribute('data-ph0');
      if (n === 'message') { if (on) inp.maxLength = 500; else inp.removeAttribute('maxlength'); }
    });
  }
  function layoutV2(M, on) {
    var m = M.modal, form = q('#abForm', m), card = q('.ab-card', m);
    m.classList.toggle('caf-v2', !!on);
    if (!form || !card) return;
    if (!on) {
      if (M.gw && M.gw.parentNode) { form.insertBefore(M.steps, M.gw); M.gw.parentNode.removeChild(M.gw); }
      if (M.bar) M.bar.style.display = 'none';
      if (M.wrapped) wrapFields(M, false);
      return;
    }
    if (!M.gw) {
      M.gw = mk('div', 'caf-gw'); M.aside = mk('aside', 'caf-aside');
      M.aside.addEventListener('click', function (e) {
        var b = e.target.closest('[data-go]'); if (b) { scrollToSec(M, M.defs[+b.getAttribute('data-go')].sec); return; }
        var w = e.target.closest('[data-who]'); if (w) { var t = qa('.ab-tgl', m).filter(function (x) { return x.getAttribute('data-abb') === w.getAttribute('data-who'); })[0]; if (t) t.click(); later(M); }
      });
    }
    form.insertBefore(M.gw, M.steps); M.gw.appendChild(M.steps); M.gw.appendChild(M.aside);
    var cd = M.defs.filter(function (d) { return d.contact; })[0];
    if (cd) {
      form.insertBefore(cd.sec, M.gw.nextSibling); cd.sec.classList.add('caf-csec');
      var h4 = q('.caf-sh h4', cd.sec), hp = q('.caf-sh p', cd.sec); if (h4) h4.textContent = TV.contactT; if (hp) hp.textContent = TV.contactS;
      var spl = cd.sp && q('span', cd.sp); if (spl) spl.textContent = TV.contactT;
      var body = q('.caf-body', cd.sec);
      if (!M.decl) M.decl = mk('div', 'caf-decl', '<div class="caf-dh">' + svg('doc') + '<div><b>' + esc(TV.declT) + '</b><span>' + esc(TV.declS) + '</span></div></div>');
      var cb = q('#abCo', m); cb = cb && cb.closest('.ab-block');
      body.insertBefore(M.decl, cb ? cb.nextSibling : body.firstChild);
      ['.ab-plate', '.caf-cons', '.ab-consent:not(.ab-plate):not(.caf-req)'].forEach(function (sel) { var e = q(sel, body); if (e && !M.decl.contains(e)) M.decl.appendChild(e); });
      qa('.caf-docs a', M.decl).forEach(function (a) { if (!a.querySelector('.caf-pdf')) { a.insertAdjacentHTML('beforeend', '<span class="caf-pdf">PDF</span>' + svg('dl', 'caf-ic caf-dli')); } });
    }
    wrapFields(M, true); M.wrapped = true;
    if (!M.bar) {
      M.bar = mk('div', 'caf-bar',
        '<div class="caf-be">' + svg('coins') + '<div><span class="l"></span><b class="v"></b><span class="eu"></span></div></div>' +
        '<div class="caf-bd">' + svg('shield') + '<div><span class="l">' + esc(TV.depT) + '</span><b class="v"></b><span class="s"></span></div></div>' +
        '<div class="caf-bg"><button type="button" class="caf-b1 caf-send">' + esc(TV.send) + svg('right') + '</button><small>' + esc(TV.sendNote) + '</small></div>');
      card.appendChild(M.bar);
      q('.caf-send', M.bar).addEventListener('click', function () { submitV2(M); });
    }
    M.bar.style.display = '';
  }
  function decorateV2(M) {
    var m = M.modal;
    qa('#abFuel .ab-opt:not([data-fic])', m).forEach(function (l) {
      l.setAttribute('data-fic', '1'); var t = tx(l).toLowerCase();
      var ic = /hibrid|hybrid|phev/.test(t) ? 'leaf' : /elektr|electric/.test(t) ? 'plug' : /benzin|petrol/.test(t) ? 'drop' : 'fuel';
      l.insertAdjacentHTML('afterbegin', svg(ic, 'caf-ic caf-oi'));
    });
    qa('#abTerm .ab-opt:not([data-tx]), #abKm .ab-opt:not([data-tx])', m).forEach(function (l) {
      l.setAttribute('data-tx', '1');
      [].forEach.call(l.childNodes, function (c) {
        if (c.nodeType !== 3) return;
        c.nodeValue = c.nodeValue.replace(/(\d+)\s*hó\.?\s*$/, '$1 ' + TV.months).replace(/(\d)(\d{3})\s*km\/hó/, '$1 $2 km');
      });
      var num = parseInt(tx(l).replace(/[^\d]/g, ''), 10); if (!isNaN(num)) l.style.order = num;
    });
    var blk = q('#abAvBlock', m), pick = q('#abAvPick', m);
    if (blk && pick) {
      if (!M.dd || M.dd.parentNode !== blk) {
        M.dd = mk('button', 'caf-dd'); M.dd.type = 'button';
        M.dd.addEventListener('click', function (e) { e.preventDefault(); blk.classList.toggle('caf-ddopen'); });
        blk.insertBefore(M.dd, pick);
        pick.addEventListener('click', function (e) { if (e.target.closest('.ab-opt')) setTimeout(function () { blk.classList.remove('caf-ddopen'); }, 0); });
      }
      var a = q('.ab-opt.active', pick), cn = a && q('.ab-cnt', a), lab = a ? tx(a).replace(tx(cn), '').trim() : TV.pick + '…';
      var html = svg('cal') + '<span class="t">' + esc(lab) + '</span>' + (cn ? '<span class="bdg">' + esc(tx(cn).replace(/\s*db\s*$/, '') + ' ' + TV.avail1) + '</span>' : '') + svg('chev', 'caf-ic caf-chev');
      if (M.dd.__h !== html) { M.dd.innerHTML = html; M.dd.__h = html; }
    }
  }
  function depParts(M) {
    var d = tx(q('#abDep', M.modal)) || tx(q('#abStickyDep', M.modal));
    var r = /:\s*(.+?Ft)\s*\(([^)]+)\)\s*·?\s*(.*)$/.exec(d);
    return r ? { v: r[1], s: '(' + r[2] + ')' + (r[3] ? ' · ' + r[3] : '') } : { v: d.replace(/^[^:]*:\s*/, ''), s: '' };
  }
  function stepDone(M, d) {
    if (d.contact) return false;
    var names = d.names || (d.name ? [d.name] : []);
    if (!names.length) return true;
    return names.every(function (n) { var all = qa('input[name="' + n + '"]', d.sec); return !all.length || all.some(function (i) { return i.checked; }); });
  }
  function refreshV2(M) {
    var m = M.modal, first = -1;
    M.defs.forEach(function (d, i) {
      var done = stepDone(M, d); if (!done && first < 0 && !d.sec.classList.contains('caf-x')) first = i;
      d.sp.classList.toggle('done', done); d.sp.classList.toggle('on', false); d.sec.classList.toggle('done', done);
      var ii = q('i', d.sp); if (done) { if (!q('svg', ii)) ii.innerHTML = svg('check', 'caf-ic'); } else if (q('svg', ii)) ii.textContent = q('.n', d.sec).textContent;
      var hp = q('.caf-sh p', d.sec); if (hp && !d.contact) { var h4 = q('.caf-sh h4', d.sec); if (h4 && !q('.caf-ii', h4)) { h4.insertAdjacentHTML('beforeend', ' <span class="caf-ii" title="' + esc(hp.textContent) + '">i</span>'); } }
    });
    if (first >= 0) M.defs[first].sp.classList.add('on');
    var rows = [], ic = { avail: 'cal', fuel: 'leaf', term: 'clock', km: 'gauge' };
    M.defs.forEach(function (d, i) {
      if (d.contact || d.sec.classList.contains('caf-x')) return;
      if (d.split) {
        [['#abColor', 'color', 'tag'], ['#abAus', 'ausstattung', 'car']].forEach(function (pr) {
          var blk = q(pr[0], m); if (!blk || blk.style.display === 'none') return;
          var inp = q('input[name=' + pr[1] + ']:checked', blk), lab = inp && inp.closest('label'), cs = lab && q('.caf-sw', lab);
          rows.push('<div class="caf-ar" data-go="' + i + '">' + (cs ? '<i class="caf-rsw" style="background:' + esc(cs.style.background) + '"></i>' : svg(pr[2])) + '<span class="k">' + esc(tx(q('.ab-label', blk)).replace(/^\d+\.\s*/, '')) + '</span><span class="v">' + esc(lab ? tx(lab) : '—') + '</span></div>');
        });
        return;
      }
      var v = summary(M, d), bd = '';
      if (d.k === 'avail') { var a = q('#abAvPick .ab-opt.active .ab-cnt', m); if (a) bd = '<span class="bdg">' + esc(tx(a)) + '</span>'; }
      if (d.k === 'fuel') { var fl = (v || '').toLowerCase(); ic.fuel = /hibrid|hybrid|phev/.test(fl) ? 'leaf' : /elektr/.test(fl) ? 'plug' : /benzin/.test(fl) ? 'drop' : 'fuel'; }
      if (d.k === 'term') v = (v || '').replace(/(\d+)\s*hó(?![a-záéíóöőúüű])/i, '$1 ' + TV.months);
      if (d.k === 'km') v = (v || '').replace(/(\d)(\d{3})\s*km\/hó/, '$1 $2 km');
      rows.push('<div class="caf-ar" data-go="' + i + '">' + svg(ic[d.k] || 'check') + '<span class="k">' + esc((T.s[d.k] || [d.k])[0]) + '</span><span class="v">' + esc(v || '—') + '</span>' + bd + '</div>');
    });
    var e = AB.est(M), priv = isPriv(M), dp = depParts(M), tg = qa('.ab-tgl', m);
    var seg = tg.length > 1 ? '<div class="caf-aseg">' + tg.map(function (t) { return '<button type="button" data-who="' + esc(t.getAttribute('data-abb')) + '" class="' + (t.classList.contains('active') ? 'on' : '') + '">' + esc(shortLbl(tx(t)).replace(/\s*·.*$/, '')) + '</button>'; }).join('') + '</div>' : '';
    var html = '<div class="caf-acard"><div class="caf-ah"><b>' + esc(TV.chosen) + '</b><button type="button" class="caf-rch" data-go="0">' + svg('pen') + esc(TV.change) + '</button></div><div class="caf-arows">' + rows.join('') + '</div></div>' +
      '<div class="caf-acard caf-apr">' + seg + '<span class="l">' + esc(TV.monthly) + '</span><b class="big">' + esc((e.val || '').replace(/^≈\s*/, '')) + '</b><span class="s">' + esc(priv ? TV.gross : TV.net) + '</span>' + (e.eur ? '<span class="eu">' + esc(e.eur) + '</span>' : '') +
      '<hr><span class="l">' + esc(TV.depT) + '</span><b class="mid">' + esc(dp.v) + '</b><span class="s">' + esc(dp.s) + '</span><hr><ul>' + TV.incl.map(function (x) { return '<li>' + svg('check') + esc(x) + '</li>'; }).join('') + '</ul></div>';
    if (M.aside.__h !== html) { M.aside.innerHTML = html; M.aside.__h = html; }
    if (M.bar) {
      q('.caf-be .l', M.bar).textContent = e.label; q('.caf-be .v', M.bar).innerHTML = esc(e.val || '') + (e.sub ? ' <small>' + esc(e.sub) + '</small>' : ''); q('.caf-be .eu', M.bar).textContent = e.eur || '';
      q('.caf-bd .v', M.bar).textContent = dp.v; q('.caf-bd .s', M.bar).textContent = dp.s;
      var ob = q('.ab-submit', m), sb = q('.caf-send', M.bar), busy = !!(ob && ob.disabled), lbl = (busy ? esc(T.sending) : esc(TV.send)) + svg('right');
      sb.disabled = busy; if (sb.__h !== lbl) { sb.innerHTML = lbl; sb.__h = lbl; }
    }
  }
  function submitV2(M) {
    var m = M.modal;
    for (var i = 0; i < M.defs.length; i++) {
      var d = M.defs[i]; if (d.contact || d.sec.classList.contains('caf-x')) continue;
      if (!valid(M, d)) { var er = q('.caf-err', d.sec); if (er) er.classList.add('on'); scrollToSec(M, d.sec); return; }
    }
    var ph = q('#abForm [name=phone]', m);
    if (ph && !(ph.value || '').trim()) { var g = q('#abMsg', m); if (g) { g.className = 'ab-msg err'; g.textContent = TV.phoneReq; } ph.focus(); return; }
    if (!reqOk(M)) { var g2 = q('#abMsg', m); if (g2) { g2.className = 'ab-msg err'; g2.textContent = T.consErr; } var bl = q('.caf-req.bad', m); if (bl) bl.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    submit(M);
  }

  /* ---------- megnyitás figyelése ---------- */
  var STATES = [];
  function stateOf(modal) {
    for (var i = 0; i < STATES.length; i++) if (STATES[i].modal === modal) return STATES[i];
    var A = null; for (var j = 0; j < ADS.length; j++) if (modal.matches(ADS[j].sel)) { A = ADS[j]; break; }
    if (!A) return null;
    var M = { modal: modal, A: A }; STATES.push(M); return M;
  }
  function onOpen(modal) {
    var M = stateOf(modal); if (!M) return;
    M.oc = (CTX && (Date.now() - CTX.t < 8000 || (CTX.k === 'page' && Date.now() - CTX.t < 600000))) ? CTX : null;
    try { if (setup(M)) { var card = q(M.A.card, modal); if (card) card.scrollTop = 0; } } catch (err) { if (window.console) console.warn('ca-forms', err); }
    clearInterval(M.iv); M.iv = setInterval(function () { if (modal.getAttribute('aria-hidden') !== 'false') { clearInterval(M.iv); return; } refresh(M); }, 500);
  }
  function watch() {
    try {
      new MutationObserver(function (list) {
        list.forEach(function (r) {
          var t = r.target;
          if (r.type === 'attributes' && t.getAttribute && t.getAttribute('aria-hidden') === 'false' && t.matches && ADS.some(function (a) { return t.matches(a.sel); })) {
            setTimeout(function () { onOpen(t); }, 0);
          }
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['aria-hidden'], subtree: true });
    } catch (e) { }
    qa(ADS.map(function (a) { return a.sel; }).join(',')).forEach(function (mo) { if (mo.getAttribute('aria-hidden') === 'false') onOpen(mo); });
  }

  /* ---------- használtautó-adatlap: „Ajánlatkérés” → ugyanaz az űrlap ---------- */
  function pageInquiry() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href^="mailto:"]');
      if (!a || typeof window.caInquiry !== 'function') return;
      var panel = a.closest('.panel'); if (!panel || !panel.querySelector('.price')) return;
      var name = tx(panel.querySelector('.ptitle') || document.querySelector('h1'));
      if (!name) return;
      e.preventDefault();
      var img = document.querySelector('.gallery img, .hero img, main img[src*="/"]');
      var price = [tx(panel.querySelector('.price')), tx(panel.querySelector('.peur'))].filter(Boolean).join(' · ');
      var cond = tx(panel.querySelector('.cond'));
      var specs = [];
      var yr = tx(panel.querySelector('.year')); if (cond || yr) specs.push(['cal', [cond, yr].filter(Boolean).join(' · ')]);
      var facts = {};
      qa('.k, dt, th').forEach(function (el) {
        if (el.children.length) return;
        var t = tx(el); if (!/^(Kilométer|Üzemanyag|Sebességváltó|Váltó|Teljesítmény|Mileage|Fuel|Gearbox|Power|Kilometerstand|Kraftstoff|Getriebe|Leistung|Najazdené|Palivo|Prevodovka|Výkon|Najeto|Převodovka|Przebieg|Paliwo|Skrzynia|Moc)$/i.test(t)) return;
        var v = tx(el.parentElement).replace(t, '').trim(); if (v && !facts[t]) facts[t] = v;
      });
      Object.keys(facts).forEach(function (k) {
        var ic = /km|kilom|najazd|najet|przebieg|mileage/i.test(k) ? 'gauge' : /üzem|fuel|kraft|paliv|paliw/i.test(k) ? 'fuel' : /vált|gear|getr|prevod|převod|skrzyn/i.test(k) ? 'gear' : 'car';
        var v = facts[k]; if (ic === 'gauge' && /^\d+$/.test(v)) v = (+v).toLocaleString('hu-HU') + ' km';
        specs.push([ic, v]);
      });
      CTX = { k: 'page', specs: specs.slice(0, 6), t: Date.now() };
      var kind = /bizomány|komis/i.test(cond) ? 'biz' : 'sale';
      window.caInquiry({ name: name, img: img ? img.getAttribute('src') : '', price: price, kind: kind, isNew: /^(Új|New|Neu|Nové|Nový|Nowy)$/.test(cond) });
      setTimeout(function () { CTX = { k: 'page', specs: specs.slice(0, 6), t: Date.now() }; var mo = document.querySelector('.cain-modal'); var M = mo && stateOf(mo); if (M) { M.oc = CTX; refresh(M); } }, 60);
    }, true);
  }
  /* a page-kontextust a CAIN adapter is olvassa */
  var _ctx = ctx; ctx = function (k) { if (k === 'card' && CTX && CTX.k === 'page' && Date.now() - CTX.t < 600000) return CTX; return _ctx(k); };

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () { watch(); pageInquiry(); });
})();
