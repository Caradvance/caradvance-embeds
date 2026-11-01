/**
 * caradvance.ch — Importkostenrechner (statt der slowakischen Zulassungsgebühren-Rechner), 4 Sprachen.
 *
 *  /import/importkosten-rechner/ — Einfuhrabgaben für einen Personenwagen aus Deutschland in die Schweiz:
 *    Automobilsteuer 4 % des Fahrzeugwerts, Einfuhr-MWST 8,1 % (Bemessung: Entgelt + Kosten bis zum
 *    Bestimmungsort + Automobilsteuer + Gebühren), Verzollungsnachweis Form. 13.20 A CHF 20.
 *    Seit 1. 1. 2024 erhebt die Schweiz auf Industriegüter (auch Personenwagen) keinen Zoll mehr.
 *    Quelle: BAZG, «Fahrzeuge definitiv in die Schweiz einführen» (Stand 2026).
 * Die Seite behält Kopf, Fusszeile und Stile; ersetzt werden <main>, Titel, Beschreibungen und JSON-LD.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const YEAR = new Date().getFullYear();

const T = {
  de: {
    eyebrow: `Rechner ${YEAR}`, title: 'Importkosten für ein Auto aus Deutschland', lead: 'Kaufpreis eingeben – Sie sehen sofort Automobilsteuer, Einfuhr-MWST und die gesamten Einfuhrabgaben in Franken.',
    price: 'Kaufpreis des Fahrzeugs', cur: 'Währung', fx: 'Wechselkurs EUR/CHF', fxHint: 'Für die Verzollung gilt der Devisenkurs (Verkauf) des BAZG am Tag der Einfuhr.',
    trans: 'Transport bis zum Bestimmungsort in der Schweiz (CHF)', transHint: 'Kosten bis zum Bestimmungsort gehören zur MWST-Bemessung. Bei Lieferung durch uns im Angebot ausgewiesen.',
    total: 'Einfuhrabgaben total', rValue: 'Fahrzeugwert in CHF', rTax: 'Automobilsteuer (4 %)', rVatBase: 'MWST-Bemessungsgrundlage', rVat: 'Einfuhr-MWST (8,1 %)', rFee: 'Verzollungsnachweis (Form. 13.20 A)', rSum: 'Einfuhrabgaben', rAll: 'Fahrzeug inkl. Transport und Abgaben',
    cta: 'Import, Verzollung und Zulassung übernehmen wir →',
    disc: '<b>Der Rechner dient nur zur Orientierung.</b> Die Abgaben veranlagt das BAZG bei der Einfuhr. Nicht enthalten: Prüfung beim kantonalen Strassenverkehrsamt (MFK), Kontrollschilder, Versicherung, Verkehrssteuer sowie eine allfällige CO₂-Sanktion bei Neuwagen. Seit 1. 1. 2024 wird auf Personenwagen kein Zoll mehr erhoben.',
    h1: `Auto aus Deutschland importieren ${YEAR} —<br><span class="accent">Importkosten-Rechner</span>`,
    sub: 'Beim Import eines Personenwagens in die Schweiz bezahlen Sie 4 % Automobilsteuer und 8,1 % Einfuhr-MWST. Rechnen Sie die Abgaben in Sekunden aus – den ganzen Import inklusive Verzollung und Zulassung übernehmen wir.',
    btn1: 'Importkosten berechnen', btn2: 'Ich brauche Hilfe',
    ratesH: 'Einfuhrabgaben für Personenwagen', ratesL: 'Die Abgaben werden auf dem Fahrzeugwert in Franken berechnet; die MWST zusätzlich auf Transport, Automobilsteuer und Gebühren.',
    rates: [['Zoll auf Personenwagen (seit 1. 1. 2024)', '0'], ['Automobilsteuer', '4 % des Fahrzeugwerts'], ['Einfuhr-Mehrwertsteuer', '8,1 %'], ['Verzollungsnachweis Form. 13.20 A', 'CHF 20']],
    th: ['Abgabe', 'Satz'], procEy: 'Ablauf des Imports', procH: 'In vier Schritten zum eigenen Auto aus Deutschland',
    steps: [['Kauf und Dokumente', 'Wir kaufen das Fahrzeug in Deutschland; bei der Ausfuhr in die Schweiz stellt Caradvance GmbH die Rechnung ohne deutsche MwSt. aus.'],
      ['Verzollung', 'Anmeldung beim Schweizer Zoll mit Rechnung und Fahrzeugausweis; bezahlt werden Automobilsteuer und Einfuhr-MWST. Sie erhalten den Prüfungsbericht Form. 13.20 A.'],
      ['Prüfung (MFK)', 'Technische Prüfung beim kantonalen Strassenverkehrsamt – mit Übereinstimmungsbescheinigung (CoC) bzw. Typengenehmigung.'],
      ['Zulassung', 'Schweizer Kontrollschilder und Fahrzeugausweis beim Strassenverkehrsamt Ihres Wohnkantons.']],
    faqH: 'Häufige Fragen',
    faq: [[`Wie hoch sind die Einfuhrabgaben für ein Auto aus Deutschland ${YEAR}?`, 'Für einen Personenwagen bezahlen Sie 4 % Automobilsteuer auf dem Fahrzeugwert und 8,1 % Einfuhr-Mehrwertsteuer. Die MWST wird auf dem Kaufpreis zuzüglich Transport bis zum Bestimmungsort, Automobilsteuer und Gebühren berechnet. Zoll fällt seit dem 1. Januar 2024 auf Personenwagen nicht mehr an.'],
      ['Bezahle ich auch die deutsche Mehrwertsteuer?', 'Nein. Wird das Fahrzeug in die Schweiz ausgeführt, ist die Lieferung in Deutschland steuerfrei; Caradvance GmbH stellt die Rechnung ohne deutsche MwSt. aus. In der Schweiz fällt die Einfuhr-MWST von 8,1 % an.'],
      ['Was kostet die Zulassung in der Schweiz zusätzlich?', 'Hinzu kommen die Prüfung beim kantonalen Strassenverkehrsamt, die Kontrollschilder und der Fahrzeugausweis – die Gebühren legt jeder Kanton selbst fest. Dazu kommen Versicherung und die kantonale Verkehrssteuer.'],
      ['Gibt es eine CO₂-Sanktion?', 'Für Personenwagen, die im Ausland vor weniger als 12 Monaten (bzw. vor weniger als 6 Monaten mit höchstens 5000 km) erstmals zugelassen wurden, kann bei Überschreitung der CO₂-Zielvorgabe vor der Erstzulassung eine Sanktion des Bundesamts für Energie anfallen. Wir prüfen das für Ihr Wunschfahrzeug im Voraus.'],
      ['Übernehmen Sie den ganzen Import?', 'Ja. Wir suchen und prüfen das Fahrzeug in Deutschland, organisieren Transport und Verzollung und unterstützen Sie bei Prüfung und Zulassung. Alle Kosten sehen Sie vorab im Angebot.']],
    ctaT: 'Import und Zulassung aus einer Hand', ctaP: 'Wir finden Ihr Wunschauto, prüfen es vor Ort, bringen es in die Schweiz und unterstützen Sie bei Verzollung und Zulassung.',
    foot: 'Der Rechner dient nur zur Orientierung. Grundlage: Automobilsteuergesetz (AStG), Mehrwertsteuergesetz (MWSTG), Merkblätter des BAZG.',
    metaT: `Auto aus Deutschland importieren ${YEAR} — Importkosten-Rechner | CarAdvance`, metaD: `Was kostet der Import eines Autos aus Deutschland in die Schweiz ${YEAR}? Rechner: 4 % Automobilsteuer, 8,1 % Einfuhr-MWST, kein Zoll auf Personenwagen.`,
    appName: 'Importkosten-Rechner für Autos aus Deutschland'
  },
  fr: {
    eyebrow: `Calculateur ${YEAR}`, title: 'Coûts d’importation d’une voiture d’Allemagne', lead: 'Saisissez le prix d’achat : vous voyez immédiatement l’impôt sur les véhicules automobiles, la TVA à l’importation et le total des redevances en francs.',
    price: 'Prix d’achat du véhicule', cur: 'Devise', fx: 'Taux de change EUR/CHF', fxHint: 'Pour le dédouanement, l’OFDF applique le cours des devises (vente) du jour de l’importation.',
    trans: 'Transport jusqu’au lieu de destination en Suisse (CHF)', transHint: 'Les frais jusqu’au lieu de destination font partie de la base de calcul de la TVA. En cas de livraison par nos soins, ils figurent dans l’offre.',
    total: 'Redevances d’importation au total', rValue: 'Valeur du véhicule en CHF', rTax: 'Impôt sur les véhicules automobiles (4 %)', rVatBase: 'Base de calcul de la TVA', rVat: 'TVA à l’importation (8,1 %)', rFee: 'Justificatif de dédouanement (form. 13.20 A)', rSum: 'Redevances d’importation', rAll: 'Véhicule, transport et redevances compris',
    cta: 'Nous nous chargeons de l’importation, du dédouanement et de l’immatriculation →',
    disc: '<b>Ce calculateur est purement indicatif.</b> Les redevances sont taxées par l’OFDF lors de l’importation. Non compris : contrôle technique auprès de l’office cantonal de la circulation, plaques, assurance, impôt cantonal sur les véhicules et une éventuelle sanction CO₂ pour les voitures neuves. Depuis le 1er janvier 2024, aucun droit de douane n’est perçu sur les voitures de tourisme.',
    h1: `Importer une voiture d’Allemagne ${YEAR} —<br><span class="accent">calculateur des coûts</span>`,
    sub: 'Pour importer une voiture de tourisme en Suisse, vous payez 4 % d’impôt sur les véhicules automobiles et 8,1 % de TVA à l’importation. Calculez les redevances en quelques secondes – nous nous chargeons de toute l’importation, dédouanement et immatriculation compris.',
    btn1: 'Calculer les coûts', btn2: 'J’ai besoin d’aide',
    ratesH: 'Redevances d’importation des voitures de tourisme', ratesL: 'Les redevances sont calculées sur la valeur du véhicule en francs ; la TVA s’applique en outre au transport, à l’impôt automobile et aux émoluments.',
    rates: [['Droits de douane sur les voitures de tourisme (depuis le 1.1.2024)', '0'], ['Impôt sur les véhicules automobiles', '4 % de la valeur'], ['TVA à l’importation', '8,1 %'], ['Justificatif de dédouanement form. 13.20 A', 'CHF 20']],
    th: ['Redevance', 'Taux'], procEy: 'Déroulement de l’importation', procH: 'Quatre étapes jusqu’à votre voiture d’Allemagne',
    steps: [['Achat et documents', 'Nous achetons le véhicule en Allemagne ; pour l’exportation vers la Suisse, Caradvance GmbH établit la facture sans TVA allemande.'],
      ['Dédouanement', 'Déclaration à la douane suisse avec facture et permis de circulation ; l’impôt automobile et la TVA à l’importation sont payés. Vous recevez le rapport d’expertise form. 13.20 A.'],
      ['Contrôle technique', 'Expertise auprès de l’office cantonal de la circulation routière – avec certificat de conformité (CoC) ou réception par type.'],
      ['Immatriculation', 'Plaques suisses et permis de circulation auprès de l’office de la circulation de votre canton de domicile.']],
    faqH: 'Questions fréquentes',
    faq: [[`Quel est le montant des redevances d’importation pour une voiture d’Allemagne en ${YEAR} ?`, 'Pour une voiture de tourisme, vous payez 4 % d’impôt sur les véhicules automobiles sur la valeur du véhicule et 8,1 % de TVA à l’importation. La TVA est calculée sur le prix d’achat, majoré du transport jusqu’au lieu de destination, de l’impôt automobile et des émoluments. Depuis le 1er janvier 2024, aucun droit de douane n’est plus perçu sur les voitures de tourisme.'],
      ['Dois-je aussi payer la TVA allemande ?', 'Non. Lorsque le véhicule est exporté en Suisse, la livraison est exonérée en Allemagne ; Caradvance GmbH établit la facture sans TVA allemande. En Suisse, la TVA à l’importation de 8,1 % s’applique.'],
      ['Que coûte en plus l’immatriculation en Suisse ?', 'S’y ajoutent le contrôle auprès de l’office cantonal de la circulation, les plaques et le permis de circulation – chaque canton fixe ses propres émoluments – ainsi que l’assurance et l’impôt cantonal sur les véhicules.'],
      ['Une sanction CO₂ peut-elle s’appliquer ?', 'Pour les voitures immatriculées pour la première fois à l’étranger il y a moins de 12 mois (ou moins de 6 mois avec 5000 km au plus), une sanction de l’Office fédéral de l’énergie peut être due avant la première immatriculation si l’objectif d’émission de CO₂ est dépassé. Nous le vérifions à l’avance pour le véhicule souhaité.'],
      ['Vous chargez-vous de toute l’importation ?', 'Oui. Nous cherchons et contrôlons le véhicule en Allemagne, organisons le transport et le dédouanement et vous accompagnons pour le contrôle et l’immatriculation. Tous les coûts figurent à l’avance dans l’offre.']],
    ctaT: 'Importation et immatriculation d’un seul interlocuteur', ctaP: 'Nous trouvons la voiture de vos rêves, la contrôlons sur place, l’amenons en Suisse et vous accompagnons pour le dédouanement et l’immatriculation.',
    foot: 'Ce calculateur est purement indicatif. Bases : loi sur l’imposition des véhicules automobiles (Limpauto), loi sur la TVA (LTVA), notices de l’OFDF.',
    metaT: `Importer une voiture d’Allemagne ${YEAR} — calculateur des coûts | CarAdvance`, metaD: `Combien coûte l’importation d’une voiture d’Allemagne en Suisse en ${YEAR} ? Calculateur : 4 % d’impôt automobile, 8,1 % de TVA à l’importation, pas de droits de douane.`,
    appName: 'Calculateur des coûts d’importation de voitures d’Allemagne'
  },
  it: {
    eyebrow: `Calcolatore ${YEAR}`, title: 'Costi di importazione di un’auto dalla Germania', lead: 'Inserisca il prezzo d’acquisto: vede subito l’imposta sugli autoveicoli, l’IVA all’importazione e il totale dei tributi in franchi.',
    price: 'Prezzo d’acquisto del veicolo', cur: 'Valuta', fx: 'Tasso di cambio EUR/CHF', fxHint: 'Per l’imposizione doganale vale il corso delle divise (vendita) dell’UDSC del giorno dell’importazione.',
    trans: 'Trasporto fino al luogo di destinazione in Svizzera (CHF)', transHint: 'Le spese fino al luogo di destinazione rientrano nella base di calcolo dell’IVA. Se la consegna la effettuiamo noi, sono indicate nell’offerta.',
    total: 'Tributi d’importazione in totale', rValue: 'Valore del veicolo in CHF', rTax: 'Imposta sugli autoveicoli (4 %)', rVatBase: 'Base di calcolo dell’IVA', rVat: 'IVA all’importazione (8,1 %)', rFee: 'Prova dell’imposizione doganale (mod. 13.20 A)', rSum: 'Tributi d’importazione', rAll: 'Veicolo con trasporto e tributi',
    cta: 'Importazione, sdoganamento e immatricolazione li gestiamo noi →',
    disc: '<b>Il calcolatore ha valore puramente indicativo.</b> I tributi sono riscossi dall’UDSC all’importazione. Non sono inclusi: collaudo presso l’ufficio cantonale della circolazione, targhe, assicurazione, imposta cantonale di circolazione ed eventuale sanzione CO₂ per le auto nuove. Dal 1° gennaio 2024 sulle automobili non si riscuotono più dazi.',
    h1: `Importare un’auto dalla Germania ${YEAR} —<br><span class="accent">calcolatore dei costi</span>`,
    sub: 'Per importare un’automobile in Svizzera paga il 4 % di imposta sugli autoveicoli e l’8,1 % di IVA all’importazione. Calcoli i tributi in pochi secondi – all’intera importazione, sdoganamento e immatricolazione compresi, pensiamo noi.',
    btn1: 'Calcola i costi', btn2: 'Ho bisogno di aiuto',
    ratesH: 'Tributi d’importazione per le automobili', ratesL: 'I tributi sono calcolati sul valore del veicolo in franchi; l’IVA si applica inoltre a trasporto, imposta sugli autoveicoli ed emolumenti.',
    rates: [['Dazio sulle automobili (dal 1° 1° 2024)', '0'], ['Imposta sugli autoveicoli', '4 % del valore'], ['IVA all’importazione', '8,1 %'], ['Prova dell’imposizione doganale mod. 13.20 A', 'CHF 20']],
    th: ['Tributo', 'Aliquota'], procEy: 'Come funziona l’importazione', procH: 'In quattro passi alla sua auto dalla Germania',
    steps: [['Acquisto e documenti', 'Acquistiamo il veicolo in Germania; per l’esportazione in Svizzera Caradvance GmbH emette la fattura senza IVA tedesca.'],
      ['Sdoganamento', 'Dichiarazione alla dogana svizzera con fattura e licenza di circolazione; si pagano l’imposta sugli autoveicoli e l’IVA all’importazione. Riceve il rapporto di perizia mod. 13.20 A.'],
      ['Collaudo', 'Collaudo tecnico presso l’ufficio cantonale della circolazione – con certificato di conformità (CoC) o omologazione.'],
      ['Immatricolazione', 'Targhe svizzere e licenza di circolazione presso l’ufficio della circolazione del suo cantone di domicilio.']],
    faqH: 'Domande frequenti',
    faq: [[`Quanto costano i tributi d’importazione per un’auto dalla Germania nel ${YEAR}?`, 'Per un’automobile paga il 4 % di imposta sugli autoveicoli sul valore del veicolo e l’8,1 % di IVA all’importazione. L’IVA è calcolata sul prezzo d’acquisto più il trasporto fino al luogo di destinazione, l’imposta sugli autoveicoli e gli emolumenti. Dal 1° gennaio 2024 sulle automobili non si riscuotono più dazi.'],
      ['Pago anche l’IVA tedesca?', 'No. Se il veicolo è esportato in Svizzera, la fornitura in Germania è esente; Caradvance GmbH emette la fattura senza IVA tedesca. In Svizzera si applica l’IVA all’importazione dell’8,1 %.'],
      ['Quanto costa in più l’immatricolazione in Svizzera?', 'Si aggiungono il collaudo presso l’ufficio cantonale della circolazione, le targhe e la licenza di circolazione – ogni cantone stabilisce i propri emolumenti – oltre all’assicurazione e all’imposta cantonale di circolazione.'],
      ['Può esserci una sanzione CO₂?', 'Per le automobili immatricolate per la prima volta all’estero da meno di 12 mesi (o da meno di 6 mesi con al massimo 5000 km), prima della prima immatricolazione può essere dovuta una sanzione dell’Ufficio federale dell’energia se l’obiettivo di CO₂ è superato. Lo verifichiamo in anticipo per il veicolo desiderato.'],
      ['Vi occupate dell’intera importazione?', 'Sì. Cerchiamo e controlliamo il veicolo in Germania, organizziamo trasporto e sdoganamento e la accompagniamo per collaudo e immatricolazione. Tutti i costi sono indicati in anticipo nell’offerta.']],
    ctaT: 'Importazione e immatricolazione da un unico interlocutore', ctaP: 'Troviamo l’auto che desidera, la controlliamo sul posto, la portiamo in Svizzera e la accompagniamo per sdoganamento e immatricolazione.',
    foot: 'Il calcolatore ha valore puramente indicativo. Basi: legge sull’imposizione degli autoveicoli (LIAut), legge sull’IVA (LIVA), promemoria dell’UDSC.',
    metaT: `Importare un’auto dalla Germania ${YEAR} — calcolatore dei costi | CarAdvance`, metaD: `Quanto costa importare un’auto dalla Germania in Svizzera nel ${YEAR}? Calcolatore: 4 % di imposta sugli autoveicoli, 8,1 % di IVA all’importazione, nessun dazio.`,
    appName: 'Calcolatore dei costi d’importazione di auto dalla Germania'
  },
  en: {
    eyebrow: `Calculator ${YEAR}`, title: 'Import costs for a car from Germany', lead: 'Enter the purchase price – you instantly see the automobile tax, import VAT and total import charges in Swiss francs.',
    price: 'Purchase price of the car', cur: 'Currency', fx: 'EUR/CHF exchange rate', fxHint: 'For customs clearance, the FOCBS foreign exchange rate (selling) on the day of import applies.',
    trans: 'Transport to the destination in Switzerland (CHF)', transHint: 'Costs up to the destination are part of the VAT base. If we deliver the car, they are shown in our offer.',
    total: 'Total import charges', rValue: 'Vehicle value in CHF', rTax: 'Automobile tax (4%)', rVatBase: 'VAT base', rVat: 'Import VAT (8.1%)', rFee: 'Proof of customs clearance (form 13.20 A)', rSum: 'Import charges', rAll: 'Car incl. transport and charges',
    cta: 'We handle import, customs clearance and registration →',
    disc: '<b>This calculator is for guidance only.</b> The charges are assessed by the FOCBS on import. Not included: inspection at the cantonal road traffic office, number plates, insurance, cantonal vehicle tax and any CO₂ sanction for new cars. Since 1 January 2024 no customs duty is levied on passenger cars.',
    h1: `Importing a car from Germany ${YEAR} —<br><span class="accent">import cost calculator</span>`,
    sub: 'When you import a passenger car into Switzerland, you pay 4% automobile tax and 8.1% import VAT. Work out the charges in seconds – we take care of the whole import, including customs clearance and registration.',
    btn1: 'Calculate import costs', btn2: 'I need help',
    ratesH: 'Import charges for passenger cars', ratesL: 'The charges are calculated on the vehicle value in Swiss francs; VAT is also charged on transport, automobile tax and fees.',
    rates: [['Customs duty on passenger cars (since 1 Jan 2024)', '0'], ['Automobile tax', '4% of the vehicle value'], ['Import VAT', '8.1%'], ['Proof of customs clearance, form 13.20 A', 'CHF 20']],
    th: ['Charge', 'Rate'], procEy: 'How the import works', procH: 'Four steps to your car from Germany',
    steps: [['Purchase and documents', 'We buy the car in Germany; for export to Switzerland, Caradvance GmbH issues the invoice without German VAT.'],
      ['Customs clearance', 'Declaration at Swiss customs with invoice and registration document; automobile tax and import VAT are paid. You receive the inspection report form 13.20 A.'],
      ['Inspection', 'Technical inspection at the cantonal road traffic office – with certificate of conformity (CoC) or type approval.'],
      ['Registration', 'Swiss number plates and vehicle registration document at the road traffic office of your canton of residence.']],
    faqH: 'Frequently asked questions',
    faq: [[`How much are the import charges for a car from Germany in ${YEAR}?`, 'For a passenger car you pay 4% automobile tax on the vehicle value and 8.1% import VAT. VAT is calculated on the purchase price plus transport to the destination, automobile tax and fees. Since 1 January 2024 no customs duty is charged on passenger cars.'],
      ['Do I also pay German VAT?', 'No. When the car is exported to Switzerland, the supply is VAT-exempt in Germany; Caradvance GmbH issues the invoice without German VAT. In Switzerland, import VAT of 8.1% applies.'],
      ['What does registration in Switzerland cost on top?', 'Add the inspection at the cantonal road traffic office, number plates and the registration document – each canton sets its own fees – plus insurance and the cantonal vehicle tax.'],
      ['Can a CO₂ sanction apply?', 'For cars first registered abroad less than 12 months ago (or less than 6 months ago with no more than 5,000 km), a sanction by the Swiss Federal Office of Energy may be due before first registration if the CO₂ target is exceeded. We check this in advance for the car you want.'],
      ['Do you handle the whole import?', 'Yes. We find and inspect the car in Germany, organise transport and customs clearance and support you with inspection and registration. You see all costs in advance in our offer.']],
    ctaT: 'Import and registration from a single source', ctaP: 'We find the car you want, inspect it on site, bring it to Switzerland and support you with customs clearance and registration.',
    foot: 'This calculator is for guidance only. Legal basis: Automobile Tax Act, VAT Act, FOCBS information sheets.',
    metaT: `Importing a car from Germany to Switzerland ${YEAR} — cost calculator | CarAdvance`, metaD: `What does it cost to import a car from Germany to Switzerland in ${YEAR}? Calculator: 4% automobile tax, 8.1% import VAT, no customs duty on passenger cars.`,
    appName: 'Import cost calculator for cars from Germany'
  }
};

function calcHtml(t, links, fx) {
  return `
<div class="lk" id="kalkulator">
<div class="lk-head">
<span class="lk-eyebrow">${t.eyebrow}</span>
<h2 class="lk-title">${t.title}</h2>
<p class="lk-lead">${t.lead}</p>
</div>
<div class="lk-grid">
<div class="lk-inputs">
<div class="lk-field">
<label for="chi-price"><span class="lk-lbl">${t.price}</span></label>
<div class="lk-gy2">
<input type="number" id="chi-price" class="lk-in" value="40000" min="0" step="100" inputmode="numeric">
<div class="lk-seg lk-seg-unit" role="group" aria-label="${t.cur}">
<button type="button" class="lk-segbtn" id="chi-ueur" aria-pressed="true">€</button>
<button type="button" class="lk-segbtn" id="chi-uchf" aria-pressed="false">CHF</button>
</div>
</div>
<span class="lk-hint" id="chi-conv">—</span>
</div>
<div class="lk-field">
<label for="chi-fx"><span class="lk-lbl">${t.fx}</span></label>
<input type="number" id="chi-fx" class="lk-in" value="${fx}" min="0.5" max="2" step="0.0001" inputmode="decimal">
<span class="lk-hint">${t.fxHint}</span>
</div>
<div class="lk-field">
<label for="chi-tr"><span class="lk-lbl">${t.trans}</span></label>
<input type="number" id="chi-tr" class="lk-in" value="0" min="0" step="10" inputmode="numeric">
<span class="lk-hint">${t.transHint}</span>
</div>
</div>
<div class="lk-result">
<div class="lk-monthly">
<span class="lk-mlabel">${t.total}</span>
<div class="lk-mval"><span class="lk-mnum" id="chi-total">—</span></div>
</div>
<div class="lk-rows">
<div class="lk-row"><span>${t.rValue}</span><b id="chi-o-val">—</b></div>
<div class="lk-row"><span>${t.rTax}</span><b id="chi-o-ast">—</b></div>
<div class="lk-row"><span>${t.rVatBase}</span><b id="chi-o-vb">—</b></div>
<div class="lk-row"><span>${t.rVat}</span><b id="chi-o-vat">—</b></div>
<div class="lk-row"><span>${t.rFee}</span><b>CHF 20</b></div>
<div class="lk-row lk-total"><span>${t.rSum}</span><b id="chi-o-sum">—</b></div>
<div class="lk-row"><span>${t.rAll}</span><b id="chi-o-all">—</b></div>
</div>
<a class="lk-cta" href="${links.kontakt}">${t.cta}</a>
<p class="lk-disc">${t.disc}</p>
</div>
</div>
</div>`;
}

const JS = `<script id="chi-js">(function(){
function $(i){return document.getElementById(i)}
var cur='eur';
function g(x){return String(Math.round(x)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u2019')}
function chf(x){return 'CHF\\u00a0'+g(x)}
function eur(x){return g(x)+'\\u00a0€'}
function num(i){return parseFloat(String($(i).value).replace(',','.'))||0}
function calc(){
 var fx=num('chi-fx')||0.93,p=num('chi-price'),tr=num('chi-tr');
 var val=cur==='eur'?p*fx:p;
 $('chi-conv').textContent=cur==='eur'?('≈ '+chf(val)):('≈ '+eur(p/fx));
 var ast=Math.round(val*0.04),fee=20,vb=val+tr+ast+fee,vat=Math.round(vb*0.081),sum=ast+vat+fee;
 $('chi-o-val').textContent=chf(val);$('chi-o-ast').textContent=chf(ast);$('chi-o-vb').textContent=chf(vb);$('chi-o-vat').textContent=chf(vat);
 $('chi-o-sum').textContent=chf(sum);$('chi-total').textContent=chf(sum);$('chi-o-all').textContent=chf(val+tr+sum);
}
function setCur(c){if(c===cur)return;var fx=num('chi-fx')||0.93,p=num('chi-price');cur=c;$('chi-price').value=c==='eur'?Math.round(p/fx):Math.round(p*fx);$('chi-ueur').setAttribute('aria-pressed',c==='eur');$('chi-uchf').setAttribute('aria-pressed',c==='chf');calc()}
$('chi-ueur').addEventListener('click',function(){setCur('eur')});$('chi-uchf').addEventListener('click',function(){setCur('chf')});
['chi-price','chi-fx','chi-tr'].forEach(function(i){$(i).addEventListener('input',calc);$(i).addEventListener('change',calc)});
calc();
})();</script>`;

function mainHtml(t, hero, links, fx, contact) {
  const heroHtml = hero
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${t.h1}</h1>`)
    .replace(/(<p class="sub[^"]*">)[\s\S]*?(<\/p>)/, `$1${t.sub}$2`)
    .replace(/(<a class="btn btn-primary" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1#kalkulator$2${t.btn1}$3`)
    .replace(/(<a class="btn btn-white" href=")[^"]*(">)[\s\S]*?(<\/a>)/, `$1${links.kontakt}$2${t.btn2}$3`);
  return `<main>
${heroHtml}
<div id="ca-kalk">
${calcHtml(t, links, fx)}

<section class="sec">
<h2>${t.ratesH}</h2>
<p class="lede">${t.ratesL}</p>
<div class="scroll"><table><thead><tr><th>${t.th[0]}</th><th class="n">${t.th[1]}</th></tr></thead><tbody>${t.rates.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join('')}</tbody></table></div>
</section>

<section class="ca-proc">
<span class="ca-eyebrow">${t.procEy}</span>
<h2 class="ca-sectitle">${t.procH}</h2>
<div class="ca-steps">
${t.steps.map(([a, p], i) => `<div class="ca-step"><div class="ca-sn">${i + 1}</div><h3>${a}</h3><p>${p}</p></div>`).join('\n')}
</div>
</section>

<section class="sec">
<h2>${t.faqH}</h2>
<div class="faq">
${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary>\n<p>${esc(a)}</p></details>`).join('\n')}
</div>
</section>

<section class="sec">
<div class="cta">
<div class="t">${t.ctaT}</div>
<p>${t.ctaP}</p>
<p><b>${contact.phone}</b> · ${contact.email}</p>
</div>
<p class="foot">${t.foot}</p>
</section>
</div>
${JS}
</main>`;
}

function ld(t, l, url) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: t.appName, url, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: l, offers: { '@type': 'Offer', price: '0', priceCurrency: 'CHF' } },
      { '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  }).replace(/<\//g, '<\\/');
}

/** h: die übersetzte CH-Seite; gibt die ersetzte Seite zurück (oder unverändert, wenn kein <main>). */
export function chCalcPage(h, kind, l, links, url, fx, contact = { phone: '', email: '' }) {
  const t = T[l] || T.de;
  const ms = h.indexOf('<main'), me = h.indexOf('</main>');
  if (ms < 0 || me < 0) return h;
  const main = h.slice(ms, me + 7);
  const hero = (main.match(/<section class="hero">[\s\S]*?<\/section>/) || [''])[0];
  h = h.slice(0, ms) + mainHtml(t, hero, links, fx, contact) + h.slice(me + 7);
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(t.metaT)}</title>`);
  h = h.replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(t.metaD) + b);
  h = h.replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*(")/g, (w, a, b) => a + esc(t.metaT) + b);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${ld(t, l, url)}</script>`);
  return h;
}
export const CALC_PAGES = { 'dovoz/kalkulacka-poplatkov/': 'import' };
