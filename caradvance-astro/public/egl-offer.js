/* Új autó – ajánlatkérés (az /egyedi-auto-rendeles/ lista és a modelloldalak közös ablaka, #eglOrder).
   1. Adataid → 2. Konfiguráció (gomb a gyártó hivatalos NÉMET konfigurátorához + link beillesztése vagy PDF feltöltése)
   → 3. Vásárlás módja → beküldés (/api/lead, Típus: „Ajánlatkérés – új autó”). A ca-forms.js lépésekre bontja. */
(function () {
  'use strict';
  var SALES_EMAIL = 'info@caradvance.hu', PHONE = '+36 30 233 6060';
  var $ = function (id) { return document.getElementById(id); };

  /* ---- nyelvek (a külföldi oldalak futásidejű fordítója ezeket a szövegeket nem ismeri) ---- */
  var LG = String(document.documentElement.lang || 'hu').toLowerCase().slice(0, 2);
  var TX = {
    hu: { eyebrow: 'Ajánlatkérés', btn: 'Ajánlatot kérek', person: '1. Adataid', cfg: '2. Konfiguráció', intro: 'Állítsd össze az autót a gyártó hivatalos német konfigurátorában (motor, szín, felszereltség), majd illeszd be ide a konfiguráció linkjét — vagy töltsd fel a konfiguráció PDF-jét. Ez alapján küldjük az ajánlatot.',
      cfgBtn: '{car} konfigurálása', host: 'a {brand} hivatalos német konfigurátora ({host})', tip: 'Tipp: a konfigurátorban a „Mentés” / „Konfiguráció megosztása” gombbal kapsz linket; az „Összegzés” oldalon PDF-et is letölthetsz.',
      linkL: 'A konfiguráció linkje', linkPh: 'https://… (illeszd be a konfiguráció linkjét)', or: 'vagy', pdfL: 'A konfiguráció PDF-je', help: 'Még nem konfiguráltam — kérek segítséget a konfiguráláshoz', msgPh: 'Megjegyzés (pl. kívánt átvétel, keret, kérdés)…',
      submit: 'Ajánlatkérés elküldése', note: 'Az ajánlatkérés nem kötelez semmire — a konfigurációd alapján elkészítjük az ajánlatot, és felvesszük veled a kapcsolatot.', sending: 'Küldés…',
      stLink: '✓ Konfiguráció linkje megadva', stPdf: '✓ PDF kiválasztva: ', stHelp: '✓ Segítséget kérsz a konfiguráláshoz',
      eCo: 'Kérlek add meg a cég nevét.', eName: 'Kérlek add meg a vezeték- és keresztneved, valamint az e-mail címed.', eMail: 'Kérlek ellenőrizd az e-mail címed.',
      eLink: 'A konfiguráció linkje nem tűnik érvényes webcímnek — másold ki a böngésző címsorából vagy a „Link másolása” gombbal.', eBig: 'A PDF túl nagy (max. 8 MB).',
      eCfg: 'Illeszd be a konfiguráció linkjét, vagy töltsd fel a PDF-et — ha még nem konfiguráltál, jelöld be, hogy segítséget kérsz.',
      eMode: 'Kérlek válaszd ki, hogyan szeretnéd megvásárolni az autót.', ePay: 'Kérlek válaszd ki a fizetés módját.', eFin: 'Kérlek válaszd ki a finanszírozás módját.', eCons: 'Kérlek fogadd el az ÁSZF-et és az adatkezelési tájékoztatót.',
      eSend: 'A küldés nem sikerült. Kérjük, hívj minket: {phone}, vagy írj az {mail} címre.', thanks: 'Köszönjük! Megkaptuk az ajánlatkérésed — hamarosan keresünk.' },
    en: { eyebrow: 'Request an offer', btn: 'Request an offer', person: '1. Your details', cfg: '2. Configuration', intro: 'Build the car in the manufacturer’s official German configurator (engine, colour, equipment), then paste the link to your configuration here — or upload the configuration PDF. We will prepare the offer based on it.',
      cfgBtn: 'Configure the {car}', host: 'the official German {brand} configurator ({host})', tip: 'Tip: use “Save” / “Share configuration” in the configurator to get a link; the “Summary” page also lets you download a PDF.',
      linkL: 'Link to your configuration', linkPh: 'https://… (paste the link to your configuration)', or: 'or', pdfL: 'Configuration PDF', help: 'I haven’t configured it yet — please help me with the configuration', msgPh: 'Message (e.g. preferred delivery, budget, questions)…',
      submit: 'Send offer request', note: 'The request is non-binding — we prepare the offer based on your configuration and get in touch with you.', sending: 'Sending…',
      stLink: '✓ Configuration link added', stPdf: '✓ PDF selected: ', stHelp: '✓ You asked for help with the configuration',
      eCo: 'Please enter the company name.', eName: 'Please enter your last name, first name and e-mail address.', eMail: 'Please check your e-mail address.',
      eLink: 'The configuration link does not look like a valid web address — copy it from the address bar or with the “Copy link” button.', eBig: 'The PDF is too large (max. 8 MB).',
      eCfg: 'Paste the link to your configuration or upload the PDF — if you haven’t configured it yet, tick that you need help.',
      eMode: 'Please choose how you would like to buy the car.', ePay: 'Please choose the payment method.', eFin: 'Please choose the type of financing.', eCons: 'Please accept the terms and the privacy policy.',
      eSend: 'Sending failed. Please call us: {phone}, or write to {mail}.', thanks: 'Thank you! We have received your request and will contact you soon.' },
    de: { eyebrow: 'Angebotsanfrage', btn: 'Angebot anfordern', person: '1. Ihre Daten', cfg: '2. Konfiguration', intro: 'Stellen Sie das Fahrzeug im offiziellen deutschen Konfigurator des Herstellers zusammen (Motor, Farbe, Ausstattung) und fügen Sie hier den Link zu Ihrer Konfiguration ein – oder laden Sie das PDF hoch. Auf dieser Basis erstellen wir Ihr Angebot.',
      cfgBtn: '{car} konfigurieren', host: 'offizieller deutscher {brand}-Konfigurator ({host})', tip: 'Tipp: Über „Speichern“ / „Konfiguration teilen“ erhalten Sie einen Link; auf der Seite „Zusammenfassung“ können Sie auch ein PDF herunterladen.',
      linkL: 'Link zu Ihrer Konfiguration', linkPh: 'https://… (Link zur Konfiguration einfügen)', or: 'oder', pdfL: 'PDF der Konfiguration', help: 'Ich habe noch nicht konfiguriert – bitte helfen Sie mir bei der Konfiguration', msgPh: 'Nachricht (z. B. Wunschtermin, Budget, Fragen)…',
      submit: 'Angebotsanfrage senden', note: 'Die Anfrage ist unverbindlich – wir erstellen das Angebot anhand Ihrer Konfiguration und melden uns bei Ihnen.', sending: 'Wird gesendet…',
      stLink: '✓ Konfigurationslink angegeben', stPdf: '✓ PDF ausgewählt: ', stHelp: '✓ Sie wünschen Hilfe bei der Konfiguration',
      eCo: 'Bitte geben Sie den Firmennamen an.', eName: 'Bitte geben Sie Nachname, Vorname und E-Mail-Adresse an.', eMail: 'Bitte prüfen Sie Ihre E-Mail-Adresse.',
      eLink: 'Der Link sieht nicht wie eine gültige Webadresse aus – kopieren Sie ihn aus der Adresszeile oder über „Link kopieren“.', eBig: 'Das PDF ist zu groß (max. 8 MB).',
      eCfg: 'Fügen Sie den Link zu Ihrer Konfiguration ein oder laden Sie das PDF hoch – falls Sie noch nicht konfiguriert haben, kreuzen Sie an, dass Sie Hilfe wünschen.',
      eMode: 'Bitte wählen Sie, wie Sie das Fahrzeug kaufen möchten.', ePay: 'Bitte wählen Sie die Zahlungsart.', eFin: 'Bitte wählen Sie die Art der Finanzierung.', eCons: 'Bitte akzeptieren Sie die AGB und die Datenschutzerklärung.',
      eSend: 'Senden fehlgeschlagen. Bitte rufen Sie uns an: {phone}, oder schreiben Sie an {mail}.', thanks: 'Vielen Dank! Wir haben Ihre Anfrage erhalten und melden uns in Kürze.' },
    sk: { eyebrow: 'Žiadosť o ponuku', btn: 'Žiadam o ponuku', person: '1. Vaše údaje', cfg: '2. Konfigurácia', intro: 'Zostavte si auto v oficiálnom nemeckom konfigurátore výrobcu (motor, farba, výbava) a sem vložte odkaz na konfiguráciu — alebo nahrajte konfiguráciu vo formáte PDF. Na jej základe vám pošleme ponuku.',
      cfgBtn: 'Konfigurovať {car}', host: 'oficiálny nemecký konfigurátor {brand} ({host})', tip: 'Tip: odkaz získate v konfigurátore tlačidlom na uloženie alebo zdieľanie konfigurácie; na stránke so súhrnom si môžete stiahnuť aj PDF.',
      linkL: 'Odkaz na konfiguráciu', linkPh: 'https://… (vložte odkaz na konfiguráciu)', or: 'alebo', pdfL: 'Konfigurácia v PDF', help: 'Auto som ešte nekonfiguroval — prosím o pomoc s konfiguráciou', msgPh: 'Poznámka (napr. želaný termín, rozpočet, otázky)…',
      submit: 'Odoslať žiadosť o ponuku', note: 'Žiadosť o ponuku vás k ničomu nezaväzuje — na základe vašej konfigurácie pripravíme ponuku a ozveme sa vám.', sending: 'Odosiela sa…',
      stLink: '✓ Odkaz na konfiguráciu zadaný', stPdf: '✓ Vybrané PDF: ', stHelp: '✓ Žiadate o pomoc s konfiguráciou',
      eCo: 'Zadajte, prosím, názov firmy.', eName: 'Zadajte, prosím, priezvisko, meno a e-mailovú adresu.', eMail: 'Skontrolujte, prosím, e-mailovú adresu.',
      eLink: 'Odkaz nevyzerá ako platná webová adresa – skopírujte ho z adresného riadka alebo tlačidlom „Kopírovať odkaz“.', eBig: 'PDF je príliš veľké (max. 8 MB).',
      eCfg: 'Vložte odkaz na konfiguráciu alebo nahrajte PDF – ak ste ešte nekonfigurovali, označte, že žiadate o pomoc.',
      eMode: 'Vyberte, prosím, ako chcete auto kúpiť.', ePay: 'Vyberte, prosím, spôsob platby.', eFin: 'Vyberte, prosím, spôsob financovania.', eCons: 'Prijmite, prosím, obchodné podmienky a zásady ochrany osobných údajov.',
      eSend: 'Odoslanie zlyhalo. Zavolajte nám: {phone}, alebo napíšte na {mail}.', thanks: 'Ďakujeme! Vašu žiadosť sme prijali, čoskoro sa ozveme.' },
    cs: { eyebrow: 'Žádost o nabídku', btn: 'Žádám o nabídku', person: '1. Vaše údaje', cfg: '2. Konfigurace', intro: 'Sestavte si vůz v oficiálním německém konfigurátoru výrobce (motor, barva, výbava) a sem vložte odkaz na konfiguraci — nebo nahrajte konfiguraci ve formátu PDF. Na jejím základě vám zašleme nabídku.',
      cfgBtn: 'Konfigurovat {car}', host: 'oficiální německý konfigurátor {brand} ({host})', tip: 'Tip: odkaz získáte v konfigurátoru tlačítkem pro uložení nebo sdílení konfigurace; na stránce se souhrnem si můžete stáhnout i PDF.',
      linkL: 'Odkaz na konfiguraci', linkPh: 'https://… (vložte odkaz na konfiguraci)', or: 'nebo', pdfL: 'Konfigurace v PDF', help: 'Vůz jsem ještě nekonfiguroval — prosím o pomoc s konfigurací', msgPh: 'Poznámka (např. požadovaný termín, rozpočet, dotazy)…',
      submit: 'Odeslat poptávku', note: 'Poptávka vás k ničemu nezavazuje — na základě vaší konfigurace připravíme nabídku a ozveme se vám.', sending: 'Odesílá se…',
      stLink: '✓ Odkaz na konfiguraci zadán', stPdf: '✓ Vybrané PDF: ', stHelp: '✓ Žádáte o pomoc s konfigurací',
      eCo: 'Zadejte prosím název firmy.', eName: 'Zadejte prosím příjmení, jméno a e-mailovou adresu.', eMail: 'Zkontrolujte prosím e-mailovou adresu.',
      eLink: 'Odkaz nevypadá jako platná webová adresa – zkopírujte jej z adresního řádku nebo tlačítkem „Kopírovat odkaz“.', eBig: 'PDF je příliš velké (max. 8 MB).',
      eCfg: 'Vložte odkaz na konfiguraci nebo nahrajte PDF – pokud jste ještě nekonfigurovali, označte, že žádáte o pomoc.',
      eMode: 'Vyberte prosím, jak chcete vůz koupit.', ePay: 'Vyberte prosím způsob platby.', eFin: 'Vyberte prosím způsob financování.', eCons: 'Přijměte prosím obchodní podmínky a zásady ochrany osobních údajů.',
      eSend: 'Odeslání se nezdařilo. Zavolejte nám: {phone}, nebo napište na {mail}.', thanks: 'Děkujeme! Vaši žádost jsme přijali, brzy se ozveme.' },
    pl: { eyebrow: 'Zapytanie ofertowe', btn: 'Poproś o ofertę', person: '1. Twoje dane', cfg: '2. Konfiguracja', intro: 'Skonfiguruj samochód w oficjalnym niemieckim konfiguratorze producenta (silnik, kolor, wyposażenie), a następnie wklej tutaj link do konfiguracji – lub prześlij plik PDF. Na tej podstawie przygotujemy ofertę.',
      cfgBtn: 'Skonfiguruj {car}', host: 'oficjalny niemiecki konfigurator {brand} ({host})', tip: 'Wskazówka: link otrzymasz przyciskiem „Zapisz” / „Udostępnij konfigurację”; na stronie „Podsumowanie” możesz też pobrać PDF.',
      linkL: 'Link do konfiguracji', linkPh: 'https://… (wklej link do konfiguracji)', or: 'lub', pdfL: 'PDF konfiguracji', help: 'Jeszcze nie skonfigurowałem(-am) – proszę o pomoc w konfiguracji', msgPh: 'Wiadomość (np. preferowany termin, budżet, pytania)…',
      submit: 'Wyślij zapytanie ofertowe', note: 'Zapytanie jest niezobowiązujące – przygotujemy ofertę na podstawie Twojej konfiguracji i skontaktujemy się z Tobą.', sending: 'Wysyłanie…',
      stLink: '✓ Podano link do konfiguracji', stPdf: '✓ Wybrano PDF: ', stHelp: '✓ Prosisz o pomoc w konfiguracji',
      eCo: 'Podaj nazwę firmy.', eName: 'Podaj nazwisko, imię i adres e-mail.', eMail: 'Sprawdź adres e-mail.',
      eLink: 'Link nie wygląda na prawidłowy adres – skopiuj go z paska adresu lub przyciskiem „Kopiuj link”.', eBig: 'Plik PDF jest za duży (maks. 8 MB).',
      eCfg: 'Wklej link do konfiguracji lub prześlij PDF – jeśli jeszcze nie konfigurowałeś(-aś), zaznacz, że potrzebujesz pomocy.',
      eMode: 'Wybierz, jak chcesz kupić samochód.', ePay: 'Wybierz sposób płatności.', eFin: 'Wybierz rodzaj finansowania.', eCons: 'Zaakceptuj regulamin i politykę prywatności.',
      eSend: 'Wysyłanie nie powiodło się. Zadzwoń do nas: {phone} lub napisz na {mail}.', thanks: 'Dziękujemy! Otrzymaliśmy Twoje zapytanie i wkrótce się odezwiemy.' },
    fr: { eyebrow: 'Demande d’offre', btn: 'Demander une offre', person: '1. Vos coordonnées', cfg: '2. Configuration', intro: 'Configurez le véhicule dans le configurateur officiel allemand du constructeur (moteur, couleur, équipements), puis collez ici le lien de votre configuration – ou téléversez le PDF. Nous préparerons l’offre sur cette base.',
      cfgBtn: 'Configurer {car}', host: 'configurateur officiel allemand {brand} ({host})', tip: 'Astuce : le bouton « Enregistrer » / « Partager la configuration » vous donne un lien ; la page « Récapitulatif » permet aussi de télécharger un PDF.',
      linkL: 'Lien vers votre configuration', linkPh: 'https://… (collez le lien de votre configuration)', or: 'ou', pdfL: 'PDF de la configuration', help: 'Je n’ai pas encore configuré – merci de m’aider pour la configuration', msgPh: 'Message (p. ex. date souhaitée, budget, questions)…',
      submit: 'Envoyer la demande d’offre', note: 'La demande est sans engagement – nous préparons l’offre selon votre configuration et vous recontactons.', sending: 'Envoi…',
      stLink: '✓ Lien de configuration indiqué', stPdf: '✓ PDF sélectionné : ', stHelp: '✓ Vous demandez de l’aide pour la configuration',
      eCo: 'Veuillez indiquer le nom de l’entreprise.', eName: 'Veuillez indiquer votre nom, prénom et adresse e-mail.', eMail: 'Veuillez vérifier votre adresse e-mail.',
      eLink: 'Le lien ne semble pas être une adresse web valide – copiez-le depuis la barre d’adresse ou avec « Copier le lien ».', eBig: 'Le PDF est trop volumineux (max. 8 Mo).',
      eCfg: 'Collez le lien de votre configuration ou téléversez le PDF – si vous n’avez pas encore configuré, cochez que vous souhaitez de l’aide.',
      eMode: 'Veuillez choisir comment vous souhaitez acheter le véhicule.', ePay: 'Veuillez choisir le mode de paiement.', eFin: 'Veuillez choisir le type de financement.', eCons: 'Veuillez accepter les CG et la politique de confidentialité.',
      eSend: 'L’envoi a échoué. Appelez-nous : {phone}, ou écrivez à {mail}.', thanks: 'Merci ! Nous avons bien reçu votre demande et vous recontactons rapidement.' },
    it: { eyebrow: 'Richiesta di offerta', btn: 'Richiedi un’offerta', person: '1. I suoi dati', cfg: '2. Configurazione', intro: 'Configuri l’auto nel configuratore ufficiale tedesco del costruttore (motore, colore, equipaggiamento), poi incolli qui il link della configurazione – oppure carichi il PDF. Prepareremo l’offerta su questa base.',
      cfgBtn: 'Configura {car}', host: 'configuratore ufficiale tedesco {brand} ({host})', tip: 'Suggerimento: con «Salva» / «Condividi configurazione» ottiene un link; nella pagina «Riepilogo» può anche scaricare un PDF.',
      linkL: 'Link alla configurazione', linkPh: 'https://… (incolli il link della configurazione)', or: 'oppure', pdfL: 'PDF della configurazione', help: 'Non ho ancora configurato – chiedo aiuto per la configurazione', msgPh: 'Messaggio (es. data desiderata, budget, domande)…',
      submit: 'Invia la richiesta di offerta', note: 'La richiesta non è vincolante – prepariamo l’offerta in base alla sua configurazione e la ricontattiamo.', sending: 'Invio in corso…',
      stLink: '✓ Link della configurazione indicato', stPdf: '✓ PDF selezionato: ', stHelp: '✓ Ha chiesto aiuto per la configurazione',
      eCo: 'Indichi il nome dell’azienda.', eName: 'Indichi cognome, nome e indirizzo e-mail.', eMail: 'Controlli l’indirizzo e-mail.',
      eLink: 'Il link non sembra un indirizzo web valido – lo copi dalla barra degli indirizzi o con «Copia link».', eBig: 'Il PDF è troppo grande (max. 8 MB).',
      eCfg: 'Incolli il link della configurazione o carichi il PDF – se non ha ancora configurato, indichi che desidera aiuto.',
      eMode: 'Scelga come desidera acquistare l’auto.', ePay: 'Scelga il metodo di pagamento.', eFin: 'Scelga il tipo di finanziamento.', eCons: 'Accetti le CG e l’informativa sulla privacy.',
      eSend: 'Invio non riuscito. Ci chiami: {phone}, oppure scriva a {mail}.', thanks: 'Grazie! Abbiamo ricevuto la sua richiesta e la ricontatteremo a breve.' },
    es: { eyebrow: 'Solicitud de oferta', btn: 'Solicitar oferta', person: '1. Sus datos', cfg: '2. Configuración', intro: 'Configure el coche en el configurador oficial alemán del fabricante (motor, color, equipamiento) y pegue aquí el enlace de su configuración – o suba el PDF. Prepararemos la oferta en base a ella.',
      cfgBtn: 'Configurar {car}', host: 'configurador oficial alemán de {brand} ({host})', tip: 'Consejo: con «Guardar» / «Compartir configuración» obtiene un enlace; en la página «Resumen» también puede descargar un PDF.',
      linkL: 'Enlace a su configuración', linkPh: 'https://… (pegue el enlace de su configuración)', or: 'o', pdfL: 'PDF de la configuración', help: 'Todavía no he configurado – necesito ayuda con la configuración', msgPh: 'Mensaje (p. ej. fecha deseada, presupuesto, preguntas)…',
      submit: 'Enviar solicitud de oferta', note: 'La solicitud no es vinculante – preparamos la oferta según su configuración y nos pondremos en contacto con usted.', sending: 'Enviando…',
      stLink: '✓ Enlace de configuración indicado', stPdf: '✓ PDF seleccionado: ', stHelp: '✓ Ha solicitado ayuda con la configuración',
      eCo: 'Indique el nombre de la empresa.', eName: 'Indique apellido, nombre y correo electrónico.', eMail: 'Compruebe su correo electrónico.',
      eLink: 'El enlace no parece una dirección web válida – cópielo de la barra de direcciones o con «Copiar enlace».', eBig: 'El PDF es demasiado grande (máx. 8 MB).',
      eCfg: 'Pegue el enlace de su configuración o suba el PDF – si aún no ha configurado, marque que necesita ayuda.',
      eMode: 'Elija cómo desea comprar el coche.', ePay: 'Elija la forma de pago.', eFin: 'Elija el tipo de financiación.', eCons: 'Acepte las condiciones generales y la política de privacidad.',
      eSend: 'No se pudo enviar. Llámenos: {phone}, o escriba a {mail}.', thanks: '¡Gracias! Hemos recibido su solicitud y nos pondremos en contacto pronto.' }
  };
  var L = TX[LG] || TX.en, T0 = TX.hu;
  function t(k, v) { var s = L[k] || T0[k] || k; if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); }); return s; }
  window.caEglT = t;
  function localizeDom() {
    if (LG === 'hu') return;
    var set = function (sel, k, attr) { [].forEach.call(document.querySelectorAll(sel), function (e) { if (attr) e.setAttribute(attr, t(k)); else e.textContent = t(k); }); };
    set('#eglOrder .egl-modal-eyebrow', 'eyebrow'); set('#eglPersonBlock .egl-flabel', 'person'); set('#eglCfgBlock .egl-flabel', 'cfg'); set('.egl-cfgintro', 'intro'); set('.egl-cfgtip', 'tip');
    set('label[for=eglCfgLink]', 'linkL'); set('#eglCfgLink', 'linkPh', 'placeholder'); set('.egl-cfgor span', 'or'); set('label[for=eglCfgFile]', 'pdfL'); set('.egl-cfghelp span', 'help');
    set('#eglCfgBlock textarea', 'msgPh', 'placeholder'); set('#eglOrder .egl-fsubmit', 'submit'); set('#eglOrder .egl-fnote', 'note'); set('.egl-order', 'btn'); set('[data-egl-order]', 'btn');
  }

  /* ---- a gyártók hivatalos német konfigurátorai (modell szerint) ---- */
  var BMW = { '1-es': 'F70/31GE', '1-es M': 'F70/21GE', '2-es Active Tourer': 'U06/21BY', '2-es Coupé': 'G42/61CM', '2-es Coupé M': 'G42/51FA', '2-es Gran Coupé': 'F74/41GG', '2-es Gran Coupé M': 'F74/31GG',
    '3-as': 'NA0G50/31JM', '3-as M': 'NA0G50/41KB', '3-as Touring': 'G21/11FY', '3-as Touring M': 'G21/21GL', '4-es Coupé': 'G22/11HB', '4-es Coupé M': 'G22/81DA', '4-es Gran Coupé': 'G26/11HC', '4-es Gran Coupé M': 'G26/61FB',
    '4-es Cabrio': 'G23/81DB', '4-es Cabrio M': 'G23/71DB', '5-ös': 'G60/11FJ', '5-ös Touring': 'G61/11GV', '7-es': 'G70/61HZ', '7-es 750e': 'G70/71HZ', '7-es M760e': 'G70/81HZ',
    'M2': 'G87/41DM', 'M3': 'G80/11HJ', 'M3 Touring': 'G81/21GB', 'M4': 'G82/11HK', 'M4 Cabrio': 'G83/41BA', 'M5': 'G90/81FK', 'M5 Touring': 'G99/81GV',
    'X1': 'U11/11EE', 'X1 M': 'U11/11EF', 'X2': 'U10/21GM', 'X2 M': 'U10/81GM', 'X3': 'G45/31KA', 'X3 M': 'G45/81GP', 'X5': 'G65/61JF', 'X5 M': 'G65/81JF', 'X6': 'G06/31EX', 'X6 M': 'G06/41EX', 'X6 M Competition': 'F96/21ET',
    'X7': 'G07/21EM', 'X7 M': 'G07/31EM', 'XM': 'G09/31CS', 'i3': 'NA0G50/31JB', 'i4': 'G26/51HD', 'i4 M': 'G26/71HD', 'i5': 'G60/61HG', 'i5 M': 'G60/41HG', 'i5 Touring': 'G61/71HH', 'i5 Touring M': 'G61/61HH',
    'i7': 'G70/61HY', 'i7 M': 'G70/81HY', 'iX': 'I20/41CF', 'iX M': 'I20/61CF', 'iX1': 'U11/11HM', 'iX2': 'U10/71GN', 'iX3': 'NA5/11HR', 'iX5': 'G65/61HV' };
  var MINI = { 'Cooper': 'F66/11GD', 'Cooper 5 ajtós': 'F65/41GD', 'Cooper Cabrio': 'F67/11GX', 'Countryman': 'U25/11GA', 'John Cooper Works': 'F66/31GD', 'John Cooper Works Cabrio': 'F67/31GX', 'John Cooper Works Countryman ALL4': 'U25/31GA' };
  var MB = { 'A-osztály': 'W177', 'C-osztály': 'W206', 'C-osztály T-Modell': 'S206', 'CLE Coupé': 'C236', 'CLE Cabrio': 'A236', 'E-osztály': 'W214', 'E-osztály T-Modell': 'S214',
    'GLA': 'H247', 'GLC': 'X254', 'GLC Coupé': 'C254', 'GLE': 'V167', 'GLE Coupé': 'C167', 'S-osztály': 'W223' };
  var AUDI = { 'A3 Limousine': 'a3/a3-limousine', 'A3 Sportback': 'a3/a3-sportback', 'A3 allstreet': 'a3/a3-allstreet', 'A5 Avant': 'a5/a5-avant', 'A5 Limousine': 'a5/a5-limousine',
    'A6 Avant e-tron': 'a6-e-tron/a6-avant-e-tron', 'A6 Sportback e-tron': 'a6-e-tron/a6-sportback-e-tron', 'A6 Avant': 'a6/a6-avant', 'A6 Limousine': 'a6/a6-limousine', 'A6 allroad': 'a6/a6-allroad',
    'Q3 Sportback': 'q3/q3-sportback', 'Q3': 'q3/q3-suv', 'Q5 Sportback': 'q5/q5-sportback', 'Q5': 'q5/q5-suv', 'Q6 Sportback e-tron': 'q6-e-tron/q6-sportback-e-tron', 'Q6 e-tron': 'q6-e-tron/q6-suv-e-tron',
    'Q7': 'q7/q7-suv', 'Q8': 'q8/q8-suv', 'Q9': 'q9/q9-suv', 'RS 3 Limousine': 'a3/rs-3-limousine', 'RS 3 Sportback': 'a3/rs-3-sportback', 'RS 5 Avant': 'a5/rs-5-avant', 'RS 5 Limousine': 'a5/rs-5-limousine',
    'RS Q8 performance': 'q8/rs-q8-suv-performance', 'RS e-tron GT': 'e-tron-gt/rs-e-tron-gt', 'e-tron GT': 'e-tron-gt/e-tron-gt-quattro' };
  /* pontos név, különben a leghosszabb illeszkedő előtag (pl. „X5 xDrive30d” → X5) */
  function look(map, n) {
    if (map[n]) return map[n];
    var best = '';
    Object.keys(map).forEach(function (k) { if ((n === k || n.indexOf(k + ' ') === 0) && k.length > best.length) best = k; });
    return best ? map[best] : '';
  }
  function cfgOf(name) {
    var n = String(name || '').trim(), m;
    if ((m = n.match(/^BMW\s+(.+)$/i))) { var b = look(BMW, m[1]); return { brand: 'BMW', url: b ? 'https://configure.bmw.de/de_DE/configure/' + b : 'https://www.bmw.de/de/konfigurator.html', host: 'bmw.de' }; }
    if ((m = n.match(/^MINI\s+(.+)$/i))) { var c = look(MINI, m[1]); return { brand: 'MINI', url: c ? 'https://configure.mini.de/de_DE/configure/' + c : 'https://www.mini.de/de_DE/home.html', host: 'mini.de' }; }
    if ((m = n.match(/^Mercedes(?:-Benz|-AMG)?\s+(.+)$/i))) { var t = look(MB, m[1]); return { brand: 'Mercedes-Benz', url: t ? 'https://www.mercedes-benz.de/passengercars/mercedes-benz-cars/car-configurator.html/start/CCci/DE/de/tc/' + t : 'https://www.mercedes-benz.de/passengercars/configurator.html', host: 'mercedes-benz.de' }; }
    if ((m = n.match(/^Audi\s+(.+)$/i))) { var a = look(AUDI, m[1]); return { brand: 'Audi', url: 'https://www.audi.de/de/neuwagen/' + (a ? a + '/konfigurator/' : ''), host: 'audi.de' }; }
    return null;
  }
  window.caEglCfg = cfgOf;

  var modal, form, msgEl;
  function showMsg(kind, txt) { if (msgEl) { msgEl.className = 'egl-fmsg ' + kind; msgEl.textContent = txt; } }
  function setBuyer(v) {
    var be = $('eglBuyer'); if (be) be.value = v;
    [].forEach.call(modal.querySelectorAll('.egl-tgl'), function (t) { t.classList.toggle('active', t.getAttribute('data-buyer') === v); });
    var isCo = v === 'Cég', comp = $('eglCompanyFields'); if (comp) comp.style.display = isCo ? '' : 'none';
    var m1 = $('eglMode1'), l1 = $('eglMode1Label');
    if (m1 && l1) { var tx = isCo ? 'Nettó EUR-ban, Németországból (Caradvance GmbH)' : '19% német áfával, Németországból (Caradvance GmbH)'; m1.value = tx; l1.textContent = tx; }
  }
  function fileName() { var f = $('eglCfgFile'); return f && f.files && f.files[0] ? f.files[0].name : ''; }
  function syncCfg() {
    var st = $('eglCfgState'); if (!st) return;
    var link = ($('eglCfgLink') || {}).value || '', fn = fileName(), help = $('eglCfgHelp') && $('eglCfgHelp').checked;
    st.textContent = link.trim() ? t('stLink') : fn ? t('stPdf') + fn : help ? t('stHelp') : '';
    st.style.display = st.textContent ? '' : 'none';
  }
  /* lépésenkénti ellenőrzés (a ca-forms.js „Következő lépés” gombja is ezt hívja) */
  function checkPerson() {
    var fd = new FormData(form);
    if (fd.get('buyer') === 'Cég' && !String(fd.get('company') || '').trim()) return t('eCo');
    if (!String(fd.get('lastname') || '').trim() || !String(fd.get('firstname') || '').trim() || !String(fd.get('email') || '').trim()) return t('eName');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(fd.get('email')).trim())) return t('eMail');
    return '';
  }
  function checkCfg() {
    var link = String(($('eglCfgLink') || {}).value || '').trim(), help = $('eglCfgHelp') && $('eglCfgHelp').checked, f = $('eglCfgFile');
    if (link && !/^https?:\/\/\S+\.\S+/i.test(link)) return t('eLink');
    if (f && f.files && f.files[0] && f.files[0].size > 8 * 1024 * 1024) return t('eBig');
    if (!link && !fileName() && !help) return t('eCfg');
    return '';
  }
  window.caEglCheck = { person: checkPerson, cfg: checkCfg };

  function open(d) {
    if (!modal) return;
    form.reset(); setBuyer('Magánszemély'); showMsg('', '');
    var im = $('eglOrderImg'); if (im) { im.src = d.img || im.src || ''; im.alt = d.name || ''; }
    var set = function (id, v) { var e = $(id); if (e) e.textContent = v || ''; };
    var price = d.price || '';
    set('eglOrderTitle', d.name);
    set('eglOrderPrice', (/\d/.test(price) && price.indexOf('Ft') > -1 && !/nettó/i.test(price)) ? 'nettó ' + price : price);
    var hasPrice = /\d/.test(price) && price.indexOf('Ft') > -1, tol = $('eglOrderTol'), info = $('eglOrderInfo'), tip = $('eglOrderTip');
    if (tol) tol.style.display = hasPrice ? '' : 'none';
    if (info) {
      info.style.display = hasPrice ? '' : 'none';
      if (tip && hasPrice) tip.innerHTML = 'Az árak nettó árak, élő árfolyammal' + (window.__caFX ? ' (1&nbsp;€ = ' + window.__caFX + '&nbsp;Ft)' : '') + '. A végleges ár a választott felszereltségtől és az adott kedvezménytől függ. A képek csak illusztrációk.';
    }
    var cc = $('eglOrderCar'); if (cc) cc.value = d.name || '';
    var c = cfgOf(d.name), btn = $('eglCfgBtn'), bt = $('eglCfgBtnT');
    if (btn) { btn.href = c ? c.url : '#'; btn.style.display = c ? '' : 'none'; }
    if (bt) bt.textContent = t('cfgBtn', { car: d.name || '' });
    var host = $('eglCfgHost'); if (host) host.textContent = c ? t('host', { brand: c.brand, host: c.host }) : '';
    var fin = $('eglFinancing'); if (fin) fin.style.display = 'none';
    syncCfg();
    modal.setAttribute('aria-hidden', 'false'); document.documentElement.style.overflow = 'hidden';
  }
  function close() { if (modal) { modal.setAttribute('aria-hidden', 'true'); document.documentElement.style.overflow = ''; } }
  window.caEglOpen = open;

  function submit(e) {
    e.preventDefault();
    var err = checkPerson() || checkCfg(); if (err) { showMsg('err', err); return; }
    var fd = new FormData(form), mode = fd.get('mode'), payment = fd.get('payment');
    if (!mode) { showMsg('err', t('eMode')); return; }
    if (!payment) { showMsg('err', t('ePay')); return; }
    if (payment === 'Finanszírozással' && !fd.get('financing')) { showMsg('err', t('eFin')); return; }
    if (!fd.get('consent')) { showMsg('err', t('eCons')); return; }
    var btn = form.querySelector('.egl-fsubmit'), label = btn.textContent; btn.disabled = true; btn.textContent = t('sending');
    var last = String(fd.get('lastname') || '').trim(), first = String(fd.get('firstname') || '').trim(), car = String(fd.get('car') || ''), c = cfgOf(car);
    var link = String(fd.get('cfglink') || '').trim(), help = !!fd.get('cfghelp');
    var P = { 'Típus': 'Ajánlatkérés – új autó', 'Autó': car, 'Vásárló': fd.get('buyer') || '', 'Cégnév': String(fd.get('company') || '').trim(), 'Adószám': String(fd.get('taxid') || '').trim(),
      'Vezetéknév': last, 'Keresztnév': first, 'Név': (last + ' ' + first).trim(), 'Telefon': String(fd.get('phone') || '').trim(), 'E-mail': String(fd.get('email') || '').trim(),
      'Konfiguráció linkje': link, 'Konfigurálás': help && !link && !fileName() ? 'Még nem konfigurált — segítséget kér' : '', 'Gyári konfigurátor': c ? c.url : '',
      'Vásárlás módja': mode || '', 'Fizetés': payment || '', 'Finanszírozás': fd.get('financing') || '', 'Megjegyzés': String(fd.get('message') || '').trim(),
      'Ár (tájékoztató)': ($('eglOrderPrice') || {}).textContent || '', page: location.href };
    try { if (window.caLeadExtras) Object.assign(P, window.caLeadExtras()); } catch (_e) { }
    P['Típus'] = 'Ajánlatkérés – új autó';
    var f = $('eglCfgFile'), file = f && f.files && f.files[0];
    var go = function () {
      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(P) }).then(function (r) { if (!r.ok) throw 0; }).then(function () {
        try { if (window.caFireLead) window.caFireLead('egyedi-rendeles'); } catch (_e) { }
        form.reset(); setBuyer('Magánszemély'); btn.disabled = false; btn.textContent = label; close();
        if (window.caShowThanks) window.caShowThanks('ok'); else alert(t('thanks'));
      }).catch(function () {
        btn.disabled = false; btn.textContent = label;
        showMsg('err', t('eSend', { phone: PHONE, mail: SALES_EMAIL }));
        if (window.caShowThanks) window.caShowThanks('error');
      });
    };
    if (!file) return go();
    var fr = new FileReader();
    fr.onload = function () { P._attachment = { filename: file.name, content: String(fr.result).split(',')[1] || '' }; go(); };
    fr.onerror = go; fr.readAsDataURL(file);
  }

  function init() {
    modal = $('eglOrder'); form = $('eglOrderForm'); msgEl = $('eglOrderMsg');
    if (!modal || !form || modal.__eglOffer) return; modal.__eglOffer = 1;
    localizeDom();
    [].forEach.call(modal.querySelectorAll('.egl-tgl'), function (t) { t.addEventListener('click', function () { setBuyer(t.getAttribute('data-buyer')); }); });
    form.addEventListener('change', function (e) {
      var t = e.target; if (!t) return;
      if (t.name === 'payment') { var fin = $('eglFinancing'); if (fin) fin.style.display = t.value === 'Finanszírozással' ? '' : 'none'; }
      if (t.id === 'eglCfgFile' || t.id === 'eglCfgHelp') { syncCfg(); showMsg('', ''); }
    });
    form.addEventListener('input', function (e) { if (e.target && e.target.id === 'eglCfgLink') syncCfg(); });
    form.addEventListener('submit', submit);
    modal.addEventListener('click', function (e) { if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') close(); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.egl-order,[data-egl-order]'); if (!b) return;
      e.preventDefault();
      open({ name: b.getAttribute('data-name'), img: b.getAttribute('data-img'), price: b.getAttribute('data-price') });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
