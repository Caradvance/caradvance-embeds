import type { IntlContent } from './types';

const de: IntlContent = {
  ui: {
    htmlLang: 'de',
    ogLocale: 'de_DE',
    nav: {
      services: 'Leistungen', rental: 'Auto-Langzeitmiete', import: 'Autoimport aus Deutschland', regtax: 'Registrierungssteuer-Rechner',
      cars: 'Autos', carsAvail: 'Verfügbare Autos', carsNew: 'Neuwagen-Konfigurator',
      company: 'Unternehmen', contact: 'Kontakt', hu: 'Magyar oldal',
    },
    common: { call: 'Anrufen', whatsapp: 'WhatsApp', email: 'E-Mail', inHu: '(auf Ungarisch)', home: 'Startseite', office: 'Büro bei Budapest', hours: 'Mo–Fr 9:00–17:00' },
    trust: [
      ['23 Jahre', 'Caradvance GmbH, Deutschland — seit 2003'],
      ['5000+', 'Premium-Autos an zufriedene Kunden übergeben'],
      ['5,0 ★', 'Google-Bewertung'],
      ['Deutsch', 'persönlicher Service — auch auf Englisch und Französisch'],
    ],
    form: {
      h2: 'Sagen Sie uns, was Sie suchen',
      lead: 'Schreiben Sie uns kurz — wir antworten auf Deutsch, meist noch am selben Werktag.',
      name: 'Ihr Name', email: 'E-Mail', phone: 'Telefon (optional)', interest: 'Ich interessiere mich für',
      interests: { rental: 'Auto-Langzeitmiete', import: 'Autokauf / Import', regtax: 'Zulassung meines Autos in Ungarn', other: 'Etwas anderes' },
      msg: 'Nachricht', msgPh: 'Modell, Budget, Zeitplan, Fragen…',
      consent: 'Ich habe die <a href="/adatkezeles/" target="_blank" rel="noopener">Datenschutzhinweise</a> und die <a href="/aszf/" target="_blank" rel="noopener">AGB</a> (auf Ungarisch) gelesen und akzeptiere sie.',
      submit: 'Anfrage senden', sending: 'Wird gesendet…', ok: 'Vielen Dank! Wir haben Ihre Anfrage erhalten und melden uns in Kürze.', err: 'Leider ist ein Fehler aufgetreten. Bitte rufen Sie +36 30 233 6060 an oder schreiben Sie an info@caradvance.hu.', need: 'Bitte geben Sie Ihre E-Mail-Adresse oder Telefonnummer an und akzeptieren Sie die Datenschutzhinweise.',
    },
    footer: {
      tagline: 'Premium-Autos aus Deutschland für Menschen in Ungarn — Langzeitmiete, Import und Zulassung, auf Deutsch.',
      services: 'Leistungen', cars: 'Autos', company: 'Unternehmen', legal: 'Rechtliches (auf Ungarisch)',
      privacy: 'Datenschutz', terms: 'AGB', imprint: 'Impressum', cookies: 'Cookie-Einstellungen',
      rep: 'Vertretung in Ungarn: BH Group Zrt.', huSite: 'Magyar oldal',
    },
    calc: {
      h2: 'Rechner für die ungarische Registrierungssteuer 2026',
      lead: 'Geben Sie Motorleistung, Umweltklasse und Alter des Autos ein — der Rechner zeigt die Registrierungssteuer (offizielle NAV-Tabelle ab 1. Januar 2026), die Erwerbsgebühr und die gesamten amtlichen Kosten der Zulassung in Ungarn.',
      cls: 'Umweltklasse', clsHint: 'Feld V.9 im ungarischen Fahrzeugschein; bei ausländischen Autos aus der Euro-Abgasnorm abgeleitet.',
      clsOpts: ['Besser als 14 und Erstzulassung nach dem 31.12.2020 — oder Hybrid', 'Besser als 14 (z. B. Euro 6)', '12–14 (z. B. Euro 5)', '9–11 (z. B. Euro 4)', '8 oder schlechter', '5E / 5Z — vollelektrisch oder emissionsfrei (steuerfrei)'],
      power: 'Motorleistung', powerHint: 'In kW oder PS — wird automatisch umgerechnet.', hp: 'PS',
      cc: 'Hubraum (Gebühr der Identitätsprüfung)', ccOpts: ['bis 1400 cm³ oder elektrisch — 22 950 Ft', '1401–2000 cm³ — 24 975 Ft', 'über 2000 cm³ — 27 000 Ft'],
      kind: 'Um welches Auto geht es?', used: 'Gebraucht, im Ausland zugelassen', newHu: 'Neuwagen (Erstzulassung in Ungarn)', newHint: 'Für Neuwagen gibt es keine Altersermäßigung.',
      firstReg: 'Erstzulassung (im Ausland)', procStart: 'Beginn des Verfahrens in Ungarn', procHint: 'In der Regel der Monat, in dem das Auto nach Ungarn kommt.',
      months: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
      total: 'Geschätzte amtliche Zulassungskosten', band: 'Leistungsstufe', base: 'Grundsteuer', elapsed: 'Vergangene Monate', monthsUnit: 'Monate', mult: 'Altersfaktor', reduction: 'Altersermäßigung',
      regtax: 'Zu zahlende Registrierungssteuer', duty: 'Erwerbsgebühr', dutyExempt: '(befreit)', origin: 'Identitätsprüfung', docs: 'Fahrzeugschein + Fahrzeugbrief', sum: 'Gesamt',
      exempt: 'Steuerfrei',
      disc: '<b>Nur zur Information.</b> Nicht enthalten: technische Prüfung zur Zulassung und Kennzeichen (Gebühren je nach Prüfstelle) sowie der Transport. Die Steuer setzt immer die ungarische Steuerbehörde (NAV) fest. Quelle: NAV-Tabellen, 01.01.2026.',
      cta: 'Zulassung von uns erledigen lassen →',
    },
    faqTitle: 'Häufige Fragen',
  },

  pages: {
    home: {
      title: 'Premium-Autos in Ungarn: Langzeitmiete & Import | CarAdvance',
      desc: 'Deutschsprachiger Autoservice für Expats in Ungarn: Auto-Langzeitmiete in Budapest, Autoimport aus Deutschland und ungarische Zulassung — den Papierkram erledigen wir.',
      kicker: 'Für Deutsche, Österreicher und Expats in Ungarn',
      h1: 'Ihr Premium-Auto in Ungarn —<br><span class="accent">ohne Papierkram</span>',
      sub: 'Langzeitmiete neuer BMW-, MINI-, Mercedes- und Audi-Modelle, Autos aus Deutschland zu deutschen Preisen und die komplette ungarische Zulassung — auf Deutsch, aus einer Hand.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Angebot anfordern', '#ajanlat'], cta2: ['Auto mieten Budapest', 'rental'],
      breadcrumb: 'Startseite',
      secs: [
        {
          kicker: 'Was wir tun', h2: 'Drei Wege, wie wir Ausländern in Ungarn helfen',
          cards: [
            ['Auto-Langzeitmiete', 'Ein neues Premium-Auto mit deutschem Kennzeichen, Mindestlaufzeit 6 Monate — Service, Steuer, Versicherung sowie Sommer- und Winterreifen in einer festen Monatsrate.'],
            ['Autoimport aus Deutschland', 'Wir finden das passende Auto auf dem deutschen Markt, prüfen es vor Ort, bringen es nach Ungarn und übergeben es mit ungarischem Kennzeichen.'],
            ['Zulassung & Behördengänge', 'Sie ziehen mit Ihrem Auto nach Ungarn? Wir berechnen die Registrierungssteuer und erledigen Prüfungen, NAV und Regierungsamt für Sie.'],
          ],
          links: [['Auto-Langzeitmiete', 'rental'], ['Autoimport', 'import'], ['Registrierungssteuer-Rechner', 'regtax']],
        },
        {
          kicker: 'Warum CarAdvance', h2: 'Ein deutsches Autohaus mit ungarischem Team',
          p: [
            'CarAdvance ist die Marke der <strong>Caradvance GmbH</strong> (Geretsried bei München), die seit 2003 Premium-Autos verkauft und vermietet. In Ungarn vertritt uns die <strong>BH Group Zrt.</strong>, deren Team bei Budapest Transport, Zulassung und alles übernimmt, was auf Ungarisch erledigt werden muss.',
            'Viele unserer Kunden sind Expats, Diplomaten und internationale Familien, die ein zuverlässiges Auto wollen, ohne sich mit der ungarischen Bürokratie zu beschäftigen. Sie sprechen mit einem Team auf Deutsch — von der ersten Frage bis zur Schlüsselübergabe.',
          ],
          ul: [
            'Verträge und Rechnungen von einem deutschen Unternehmen (Caradvance GmbH)',
            'Privatkunden können mit 19 % deutscher MwSt. kaufen',
            'BMW, MINI, Mercedes-Benz, Audi und weitere Premium-Marken',
            'Finanzierung und Leasing über unsere ungarischen Partner',
          ],
        },
        {
          kicker: 'So funktioniert’s', h2: 'In vier Schritten zum Schlüssel',
          steps: [
            ['Wunsch mitteilen', 'Miete oder Kauf, Modell, Budget und Zeitplan — per Formular, Telefon, WhatsApp oder E-Mail.'],
            ['Klares Angebot erhalten', 'Ein transparentes, aufgeschlüsseltes Angebot — ohne versteckte Kosten.'],
            ['Wir erledigen alles', 'Bestellung oder Suche, Transport aus Deutschland, Versicherung — bei Kaufautos auch die ungarische Zulassung.'],
            ['Losfahren', 'Sie erhalten das Auto fahrbereit — Mietwagen mit deutschem Kennzeichen, Kaufautos mit ungarischem Kennzeichen und Papieren.'],
          ],
        },
      ],
      faq: [
        ['Sprechen Sie Deutsch?', 'Ja. Unser Team arbeitet auf Deutsch, Englisch, Französisch und Ungarisch — Sie können den gesamten Ablauf mit uns auf Deutsch abwickeln, und Ihr Angebot erhalten Sie auf Deutsch.'],
        ['Kann ich als Ausländer in Budapest ein Auto langfristig mieten?', 'Ja. Unsere Langzeitmiete beginnt bei 6 Monaten und steht Privatpersonen und Unternehmen offen, die in Ungarn leben oder arbeiten. Die Autos behalten ihr deutsches Kennzeichen; Service, Kfz-Steuer, Vollkasko- und Haftpflichtversicherung sowie Sommer- und Winterreifen sind in der Monatsrate enthalten.'],
        ['Können Sie ein Auto aus Deutschland für mich importieren?', 'Ja — neu oder gebraucht. Wir suchen auf dem deutschen Markt, prüfen die Historie, besichtigen das Auto vor Ort, transportieren es nach Ungarn und erledigen die ungarische Zulassung.'],
        ['Ich ziehe mit meinem eigenen Auto nach Ungarn. Können Sie helfen?', 'Ja. Die Zulassung eines ausländischen Autos in Ungarn umfasst Identitätsprüfung, technische Prüfung, Registrierungssteuer (NAV) und das Regierungsamt. Nutzen Sie unseren Rechner für eine erste Schätzung — den Ablauf übernehmen wir.'],
        ['Wo sind Sie?', 'Unser ungarisches Büro befindet sich in Solymár direkt bei Budapest (2083 Solymár, Ibolya utca 18.), geöffnet Montag–Freitag 9:00–17:00. Vertragspartner ist die Caradvance GmbH in Geretsried.'],
      ],
      formInterest: 'other',
    },

    rental: {
      title: 'Auto mieten Budapest – Langzeitmiete ab 6 Monaten | CarAdvance',
      desc: 'Auto mieten in Budapest langfristig: neue BMW, MINI, Mercedes & Audi ab 6 Monaten — Service, Steuer, Versicherung und Winterreifen inklusive. Deutschsprachiger Service in Ungarn.',
      kicker: 'Auto-Langzeitmiete in Budapest',
      h1: 'Auto mieten in Budapest —<br><span class="accent">neue Premium-Autos ab 6 Monaten</span>',
      sub: 'Deutsches Kennzeichen, eine feste Monatsrate inklusive Service, Kfz-Steuer, Vollkasko und Sommer-/Winterreifen. Neue BMW-, MINI-, Mercedes-Benz- und Audi-Modelle — ideal für Expats und internationale Unternehmen in Ungarn.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Mietangebot anfordern', '#ajanlat'], cta2: ['Verfügbare Autos', '/autoink/#berelheto'],
      breadcrumb: 'Auto mieten Budapest',
      service: 'Auto-Langzeitmiete in Budapest',
      secs: [
        {
          kicker: 'Alles inklusive', h2: 'Das ist in der Monatsrate enthalten',
          cards: [
            ['Service & Wartung', 'Wartung nach Herstellervorgabe sowie Verschleißteile wie Bremsbeläge, Bremsscheiben und Wischer.'],
            ['Deutsches Kennzeichen, Steuer & Gebühren', 'Das Auto ist in Deutschland auf die Caradvance GmbH zugelassen — Kfz-Steuer, amtliche Gebühren und vorgeschriebene Prüfungen sind enthalten.'],
            ['Versicherung', 'Haftpflicht und Vollkasko — von uns abgeschlossen und bezahlt.'],
            ['Sommer- & Winterreifen', 'Beide Sätze inklusive, mit Saisonwechsel und Einlagerung.'],
            ['Assistance', 'Pannenhilfe in Ungarn und in den erlaubten Ländern.'],
            ['Ersatzwagen', 'Bei einer Reparatur nach einem Schaden ein vergleichbares Auto für die ersten 10 Werktage (je nach Verfügbarkeit).'],
          ],
          note: 'Nicht enthalten: Kraftstoff und AdBlue, Autobahnvignette, Maut, Parken, Wagenwäsche, Bußgelder sowie die Selbstbeteiligung im Schadenfall.',
        },
        {
          kicker: 'Klare Bedingungen', h2: 'Die Mietbedingungen im Überblick',
          table: {
            head: ['', ''],
            rows: [
              ['Mindestlaufzeit', '6 volle Monate ab Übergabe — danach läuft der Vertrag zu gleichen Bedingungen weiter, kündbar mit 30 Tagen Frist zum Ende eines Mietmonats.'],
              ['Kaution', '3.000–10.000 € je nach Modell; Rückzahlung innerhalb von 30 Tagen nach Rückgabe. Manche Mieten starten ohne Kaution vorab.'],
              ['Kilometer', 'Monatliches Kontingent (z. B. 2.000 km pro Monat), über die gesamte Laufzeit addiert.'],
              ['Selbstbeteiligung', '10 % des Schadens (Diebstahl: 20 %), mindestens 1.000 € je Schadenfall.'],
              ['Zahlung', 'Feste Monatsrate in EUR oder HUF, per Überweisung.'],
              ['Vertragspartner', 'Caradvance GmbH (Deutschland); die BH Group Zrt. ist unsere Vertretung in Ungarn.'],
            ],
          },
          links: [['Alle Bedingungen & Kaution (auf Ungarisch)', '/berlesi-feltetelek/']],
        },
        {
          kicker: 'Die Autos', h2: 'Premium-Modelle für die Langzeitmiete',
          p: [
            'Wählen Sie aus aktuellen Modellen von <strong>BMW</strong> (1er bis X7, M-Modelle), <strong>MINI</strong>, <strong>Mercedes-Benz</strong> (A- bis S-Klasse, GLC, GLE) und <strong>Audi</strong>. Manche Autos sind sofort verfügbar, andere werden nach Ihren Wünschen neu bestellt — dann beginnt die Miete erst am Tag der Übergabe.',
            'Nach der Mindestlaufzeit können Sie das Auto behalten, mit 30 Tagen Frist zurückgeben oder auf ein anderes Modell wechseln.',
          ],
          links: [['Verfügbare Autos (auf Ungarisch)', '/autoink/#berelheto'], ['Neuwagen-Miete nach Marke (auf Ungarisch)', '/uj-auto-berlese/']],
        },
        {
          kicker: 'Warum Langzeitmiete', h2: 'Warum Expats mieten statt kaufen',
          ul: [
            '<strong>Keine große Anfangsinvestition</strong> — eine planbare Monatsrate.',
            '<strong>Kein ungarischer Papierkram</strong> — das Auto bleibt in Deutschland zugelassen, mit deutschem Kennzeichen; Steuer, Versicherung und Prüfungen übernehmen wir.',
            '<strong>Flexibel</strong> — nach 6 Monaten mit 30 Tagen Frist kündbar, ideal für Entsendungen unbestimmter Dauer.',
            '<strong>Immer ein neues Auto</strong> — kein Wiederverkaufsrisiko, wenn Sie Ungarn verlassen.',
          ],
        },
      ],
      faq: [
        ['Ist das eine Tagesmiete?', 'Nein — wir sind auf die Langzeitmiete in Budapest und ganz Ungarn spezialisiert, ab 6 Monaten. Für Kurztrips von wenigen Tagen ist eine klassische Autovermietung die bessere Wahl.'],
        ['Können Ausländer in Ungarn ein Auto langfristig mieten?', 'Ja. Privatpersonen und Unternehmen, die in Ungarn leben oder arbeiten, können bei uns mieten. Sie benötigen einen gültigen Führerschein und einen Ausweis; die nötigen Unterlagen nennen wir Ihnen im Angebot.'],
        ['Was ist in der Monatsrate enthalten?', 'Service und Wartung, Verschleißteile, Kfz-Steuer und Gebühren, Haftpflicht und Vollkasko, Sommer- und Winterreifen mit Einlagerung sowie Assistance. Kraftstoff, Maut, Parken, Bußgelder und die Selbstbeteiligung sind nicht enthalten.'],
        ['Welches Kennzeichen hat der Mietwagen?', 'Ein deutsches. Das Auto ist in Deutschland auf den Vermieter, die Caradvance GmbH, zugelassen — eine ungarische Zulassung ist nicht nötig; Fahrzeugschein und Versicherungskarte erhalten Sie mit dem Auto.'],
        ['Wie hoch ist die Kaution?', 'Zwischen 3.000 € und 10.000 € je nach Fahrzeugkategorie. Sie ist eine Sicherheit, keine Gebühr, und wird innerhalb von 30 Tagen nach Rückgabe und Abschluss offener Vorgänge erstattet. Manche Mieten starten ohne Kaution vorab.'],
        ['Kann ich vorzeitig kündigen?', 'Die Mindestlaufzeit beträgt 6 volle Monate. Danach läuft der Vertrag zu gleichen Bedingungen weiter und kann mit 30 Tagen Frist schriftlich zum Ende eines Mietmonats gekündigt werden — oder Sie wechseln auf ein anderes Auto.'],
        ['Darf ich mit dem Auto ins Ausland fahren?', 'Ja, in die im Vertrag genannten erlaubten Länder; die Assistance gilt in Ungarn und in diesen Ländern.'],
      ],
      formInterest: 'rental',
    },

    import: {
      title: 'Autoimport aus Deutschland nach Ungarn – Komplettservice | CarAdvance',
      desc: 'Auto in Deutschland kaufen und in Ungarn fahren: Wir suchen, prüfen, transportieren und melden es mit ungarischem Kennzeichen an. Deutsche Preise, 19 % deutsche MwSt. für Privatkunden.',
      kicker: 'Autoimport aus Deutschland nach Ungarn',
      h1: 'Ihr Auto aus Deutschland —<br><span class="accent">wir bringen es nach Ungarn</span>',
      sub: 'Europas größter Premium-Automarkt zu deutschen Preisen. Wir finden das passende Auto, prüfen es vor Ort, transportieren es und erledigen die ungarische Zulassung — Sie erhalten es mit ungarischem Kennzeichen.',
      video: '/caradvance-hero-beszerzesi.mp4', poster: '/caradvance-hero-beszerzesi-poster.jpg',
      cta1: ['Autosuche anfragen', '#ajanlat'], cta2: ['Registrierungssteuer berechnen', 'regtax'],
      breadcrumb: 'Autoimport aus Deutschland',
      service: 'Autoimport aus Deutschland nach Ungarn',
      secs: [
        {
          kicker: 'Warum Deutschland', h2: 'Warum ein Auto in Deutschland kaufen',
          cards: [
            ['Riesige Auswahl', 'Ein Vielfaches des ungarischen Angebots — besonders gut ausgestattete Premium-Modelle.'],
            ['Besserer Zustand', 'Deutsche Autos haben meist ein lückenloses Scheckheft und weniger versteckte Mängel.'],
            ['Deutsche Preise', 'Privatkunden kaufen bei der Caradvance GmbH mit 19 % deutscher MwSt.'],
          ],
        },
        {
          kicker: 'Unser Service', h2: 'Was wir für Sie erledigen',
          steps: [
            ['Suche & Auswahl', 'Wir durchsuchen den gesamten deutschen Markt (z. B. mobile.de, AutoScout24) nach Ihren Wünschen.'],
            ['Historie prüfen', 'Prüfung in internationalen Datenbanken — Unfälle, Kilometerstand, Herkunft.'],
            ['Besichtigung vor Ort', 'Unser Experte prüft das Auto vor Ort, bevor Sie entscheiden.'],
            ['Verhandlung & Kauf', 'Wir verhandeln für Sie und kümmern uns um den Vertrag.'],
            ['Versicherter Transport', 'Professioneller Transport nach Ungarn mit hoher Versicherungssumme.'],
            ['Ungarische Zulassung', 'Identitätsprüfung, technische Prüfung, Registrierungssteuer (NAV), Kennzeichen und Papiere.'],
            ['Übergabe', 'Sie erhalten das Auto fahrbereit, auf Ihren Namen zugelassen, mit 1 Jahr Gewährleistung für Privatkunden.'],
          ],
        },
        {
          kicker: 'Kosten', h2: 'Was kostet der Autoimport aus Deutschland?',
          p: ['Der Endpreis setzt sich aus Kaufpreis und Importkosten zusammen. Sie erhalten vorab eine aufgeschlüsselte Kalkulation — ohne versteckte Kosten.'],
          table: {
            head: ['Posten', 'Abhängig von'],
            rows: [
              ['Kaufpreis', 'Das Auto — Privatkunden zahlen 19 % deutsche MwSt.'],
              ['Transport', 'Strecke und Fahrzeug — im Angebot aufgeschlüsselt'],
              ['Registrierungssteuer', 'Leistung (kW), Umweltklasse und Alter — 0 Ft für Elektroautos'],
              ['Erwerbsgebühr', 'kW × Satz je nach Alter — 0 Ft für Elektroautos'],
              ['Prüfungen & Papiere', 'Identitätsprüfung 22.950–27.000 Ft, technische Prüfung, Fahrzeugschein + Brief 12.000 Ft, Kennzeichen'],
              ['Unsere Servicegebühr', 'Vorab fest vereinbart'],
            ],
          },
          links: [['Registrierungssteuer berechnen', 'regtax']],
        },
        {
          kicker: 'Neu oder gebraucht', h2: 'Neuwagen nach Wunsch oder Gebrauchte vom deutschen Markt',
          p: [
            'Sie suchen einen <strong>Neuwagen</strong>? Wir bestellen BMW-, MINI-, Mercedes-Benz- und Audi-Modelle nach Ihrer Konfiguration zu deutschen Preisen. Sie suchen einen <strong>Gebrauchtwagen</strong>? Wir finden gut dokumentierte Autos auf dem deutschen Markt und prüfen sie vor dem Kauf.',
            'Bei Gebrauchten dauert es von der Auswahl bis zur Übergabe meist 5–14 Tage, abhängig vom Auto und den Prüfterminen.',
          ],
          links: [['Neuwagen-Konfigurator (auf Ungarisch)', '/egyedi-auto-rendeles/'], ['Autos auf Lager (auf Ungarisch)', '/autoink/']],
        },
      ],
      faq: [
        ['Wie lange dauert der Import eines Autos aus Deutschland nach Ungarn?', 'Bei Gebrauchtwagen meist 5–14 Tage von der Auswahl bis zur Übergabe mit ungarischem Kennzeichen, je nach Auto und Prüfterminen. Bei Neuwagen hängt es von der Lieferzeit des Werks ab.'],
        ['Kann ich als Privatperson mit deutscher MwSt. kaufen?', 'Ja. Privatpersonen können bei der Caradvance GmbH mit 19 % deutscher MwSt. statt der ungarischen 27 % kaufen. Die Details zu Ihrem Auto erklären wir im Angebot.'],
        ['Muss ich nach Deutschland reisen?', 'Nein. Wir suchen, prüfen, kaufen und transportieren das Auto — Sie müssen nicht reisen.'],
        ['Gibt es eine Gewährleistung auf das importierte Auto?', 'Privatkunden erhalten 1 Jahr Gewährleistung, und wir helfen bei der Versicherung (Haftpflicht und Kasko).'],
        ['Kann das importierte Auto finanziert werden?', 'Ja. Importierte Autos können über unsere ungarischen Partner finanziert oder geleast werden — für Privatpersonen und Unternehmen.'],
      ],
      formInterest: 'import',
    },

    regtax: {
      title: 'Registrierungssteuer Ungarn – Rechner 2026 & Zulassung | CarAdvance',
      desc: 'Kostenloser Rechner für die ungarische Registrierungssteuer (regisztrációs adó) nach den offiziellen NAV-Tabellen 2026: Steuer, Erwerbsgebühr und Gebühren für die Zulassung eines ausländischen Autos in Ungarn.',
      kicker: 'Ausländisches Auto in Ungarn zulassen',
      h1: 'Registrierungssteuer Ungarn —<br><span class="accent">die Gesamtkosten in einer Minute</span>',
      sub: 'Sie ziehen mit Ihrem Auto nach Ungarn oder importieren eines? Berechnen Sie Registrierungssteuer (regisztrációs adó), Erwerbsgebühr und amtliche Gebühren mit den NAV-Tabellen 2026 — die Zulassung übernehmen wir.',
      video: '/caradvance-hero-beszerzesi.mp4', poster: '/caradvance-hero-beszerzesi-poster.jpg',
      cta1: ['Jetzt berechnen', '#kalkulator'], cta2: ['Zulassung beauftragen', '#ajanlat'],
      breadcrumb: 'Registrierungssteuer-Rechner',
      service: 'Zulassung ausländischer Autos in Ungarn',
      secs: [
        {
          kicker: 'So wird berechnet', h2: 'Wie die ungarische Registrierungssteuer berechnet wird',
          p: [
            'Seit dem 1. März 2025 richtet sich die Registrierungssteuer nach der <strong>Motorleistung (kW)</strong> und der <strong>Umweltklasse</strong>. Der Grundbetrag wird durch einen <strong>Altersfaktor</strong> reduziert — je mehr Monate seit der Erstzulassung im Ausland vergangen sind, desto niedriger die Steuer. Vollelektrische (5E) und emissionsfreie (5Z) Autos sind befreit; Plug-in-Hybride zahlen den niedrigsten Satz.',
            'Die Steuer setzt die ungarische Steuerbehörde (NAV) per Bescheid fest; die Zahlung ist Voraussetzung für die Zulassung. Dazu kommen Erwerbsgebühr, Identitäts- und technische Prüfung, Papiere und Kennzeichen.',
          ],
        },
        {
          kicker: 'Ablauf', h2: 'Ein ausländisches Auto in Ungarn zulassen — Schritt für Schritt',
          steps: [
            ['Identitätsprüfung', 'Prüfung der Fahrzeug-Identnummern und Papiere bei einer zugelassenen Prüfstelle.'],
            ['Technische Prüfung', 'Prüfung zur Zulassung; es wird ein ungarisches technisches Datenblatt ausgestellt.'],
            ['Registrierungssteuer', 'Von der NAV festgesetzt und erhoben — nach Leistung, Klasse und Alter.'],
            ['Zulassung', 'Erwerbsgebühr, Versicherung, ungarischer Fahrzeugschein, Fahrzeugbrief und Kennzeichen beim Regierungsamt.'],
          ],
          note: 'Wer in Ungarn wohnt, darf ein im Ausland zugelassenes Auto nur eingeschränkt nutzen — meist muss es hier zugelassen werden. Wir prüfen Ihre Situation und übernehmen den gesamten Ablauf.',
          links: [['Ausführlicher Leitfaden (auf Ungarisch)', '/blog/regisztracios-ado-2026/']],
        },
      ],
      faq: [
        ['Wie hoch ist die Registrierungssteuer in Ungarn 2026?', 'Sie hängt von Motorleistung (kW), Umweltklasse und Alter ab. Der Grundbetrag reicht von 47.000 Ft bis zu mehreren Millionen Forint; der Altersfaktor kann ihn um bis zu 90 % senken. Nutzen Sie den Rechner oben für Ihr Auto.'],
        ['Zahlen Elektroautos in Ungarn Registrierungssteuer?', 'Nein. Vollelektrische (5E) und emissionsfreie (5Z) Pkw sind befreit. Plug-in-Hybride sind steuerpflichtig, fallen aber in die günstigste Spalte.'],
        ['Welche Kosten kommen bei der Zulassung noch dazu?', 'Erwerbsgebühr (kW × Satz je nach Alter), Identitätsprüfung (22.950–27.000 Ft je nach Hubraum), technische Prüfung, Fahrzeugschein und -brief (12.000 Ft) und Kennzeichen.'],
        ['Wer legt den endgültigen Betrag fest?', 'Die ungarische Steuerbehörde (NAV) setzt die Registrierungssteuer per Bescheid fest. Unser Rechner liefert eine verlässliche Schätzung auf Basis der offiziellen Tabellen 2026.'],
        ['Können Sie mein Auto für mich zulassen?', 'Ja. Wir übernehmen Prüfungen, das NAV-Verfahren und das Regierungsamt und geben Ihnen das Auto mit ungarischem Kennzeichen und Papieren zurück.'],
      ],
      formInterest: 'regtax',
    },

    contact: {
      title: 'Kontakt – CarAdvance, deutschsprachiger Autoservice bei Budapest',
      desc: 'Kontaktieren Sie CarAdvance auf Deutsch: Auto-Langzeitmiete, Autoimport aus Deutschland und Zulassung in Ungarn. Büro bei Budapest, Telefon +36 30 233 6060, info@caradvance.hu.',
      kicker: 'Kontakt',
      h1: 'Sprechen Sie mit uns —<br><span class="accent">auf Deutsch</span>',
      sub: 'Fragen zur Langzeitmiete, zum Autoimport oder zur Zulassung Ihres Autos in Ungarn? Rufen Sie an, schreiben Sie per WhatsApp oder nutzen Sie das Formular — wir antworten meist noch am selben Werktag.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Nachricht senden', '#ajanlat'], cta2: ['Anrufen +36 30 233 6060', 'tel:+36302336060'],
      breadcrumb: 'Kontakt',
      secs: [
        {
          kicker: 'Erreichbarkeit', h2: 'So erreichen Sie uns',
          cards: [
            ['Telefon & WhatsApp', '<a href="tel:+36302336060">+36 30 233 6060</a> · <a href="https://wa.me/36302336060" target="_blank" rel="noopener">WhatsApp</a>'],
            ['E-Mail', '<a href="mailto:info@caradvance.hu">info@caradvance.hu</a>'],
            ['Büro bei Budapest', 'BH Group Zrt. · 2083 Solymár, Ibolya utca 18. · Mo–Fr 9:00–17:00'],
          ],
        },
        {
          kicker: 'Wer wir sind', h2: 'Die Unternehmen hinter CarAdvance',
          p: [
            '<strong>Caradvance GmbH</strong> — Bgm-Graf-Ring 21, 82538 Geretsried, Deutschland. Verkäufer und Vermieter; Ihre Verträge und Rechnungen stellt die Caradvance GmbH aus.',
            '<strong>BH Group Zrt.</strong> — die ungarische Vertretung der Caradvance GmbH. Unser ungarisches Team betreut Kundenkontakt, Transport aus Deutschland, Zulassung und Behördengänge.',
          ],
        },
      ],
      faq: [
        ['Welche Sprachen sprechen Sie?', 'Deutsch, Englisch, Französisch und Ungarisch.'],
        ['Wann sind Sie erreichbar?', 'Montag bis Freitag, 9:00–17:00. Nachrichten außerhalb der Bürozeiten beantworten wir am nächsten Werktag.'],
        ['Kann ich das Büro besuchen?', 'Ja, nach Terminvereinbarung — unser Büro ist in Solymár, direkt bei Budapest.'],
      ],
      formInterest: 'other',
    },
  },
};

export default de;
