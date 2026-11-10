// Build lépés (a skcz-fix1109.mjs után): Mr. JOB SK „Zostávajúce drobnosti” (2026-11-09), Marc — minden piacon és nyelven:
//  1  Bérelhető márkák: a menüben (statikus legördülő + mega-menu.js) csak az a márka marad, amelyből van bérelhető autó
//     (window.SUB.brand_totals a /autoink/ oldalon); közvetlen linknél (?marka=volvo) az autólista fölött üzenet:
//     „Momentálne nemáme v ponuke – radi vám auto zabezpečíme na objednávku.” (a piac nyelvén); SK / CZ: üzemanyag-szűrő feliratai
//  2  Régi, a bérelhető kínálatban már nem szereplő bérlési modelloldalak (pl. Audi Q7, BMW M5) törlése → a middleware 301-gyel a márkára
//     szűrt bérelhető listára irányít; kikerülnek a sitemapből és a keresőindexből
//  4  Kereső: eladott autók („Predané …”, „Elkelt …”) kivétele a „készleten” találatok közül (minden piac indexéből)
//  5  Kereső .cz: a készleten lévő autók euróára (ep) a szlovák indexből — a kereső € és Kč árat mutat
// Hiba esetén logol, a buildet nem állítja meg. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); }
  return out;
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const ALIAS = { vw: 'volkswagen', mercedesbenz: 'mercedes', mercedes: 'mercedes', seat: 'seat' };
const bkey = (s) => { const n = norm(s); return ALIAS[n] || n; };

/* ---------- 1) bérelhető márkák ---------- */
let BR = null;
try {
  const h = fs.readFileSync(path.join(DIST, 'autoink', 'index.html'), 'utf8');
  const m = h.match(/"brand_totals"\s*:\s*(\{[^}]*\})/);
  if (m) { const o = JSON.parse(m[1]); BR = new Set(Object.keys(o).filter((k) => +o[k] > 0).map(bkey)); }
} catch (e) { console.log('[skcz-fix1110] brand_totals hiba:', e.message); }
const NOTE = {
  sk: 'Momentálne nemáme v ponuke – radi vám auto zabezpečíme na objednávku.',
  cs: 'Momentálně nemáme v nabídce – rádi vám vůz zajistíme na objednávku.',
  hu: 'Ebből a márkából jelenleg nincs bérelhető autónk – szívesen beszerezzük Önnek rendelésre.',
  en: 'We currently have no cars of this brand for rent – we will gladly source one for you to order.',
  de: 'Derzeit haben wir keine Mietwagen dieser Marke – gern besorgen wir Ihnen eines auf Bestellung.',
  pl: 'Obecnie nie mamy w ofercie aut tej marki – chętnie sprowadzimy je dla Państwa na zamówienie.',
  fr: 'Nous n’avons actuellement aucune voiture de cette marque à louer – nous vous en procurons volontiers une sur commande.',
  it: 'Al momento non abbiamo auto a noleggio di questo marchio – saremo lieti di procurarne una su ordinazione.',
  es: 'Actualmente no tenemos coches de esta marca en alquiler – con gusto le conseguimos uno por encargo.',
  uk: 'Наразі в нас немає авто цієї марки в оренді – охоче привеземо його на замовлення.',
  zh: '我们目前没有该品牌的租赁车辆——可为您按订单采购。',
};
const FUEL = { sk: { 'Benzin': 'Benzín', 'Dízel': 'Diesel', 'Hibrid': 'Hybrid', 'Elektromos': 'Elektro', 'Plug-in hibrid': 'Plug-in hybrid' }, cs: { 'Benzin': 'Benzín', 'Dízel': 'Diesel', 'Hibrid': 'Hybrid', 'Elektromos': 'Elektro', 'Plug-in hibrid': 'Plug-in hybrid' } };
const hubJs = (lg) => '<script id="ca-brand-note">(function(){var N=' + JSON.stringify(NOTE[lg] || NOTE.en) + ',F=' + JSON.stringify(FUEL[lg] || null) + ';' +
  'function nq(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[^a-z]/g,"");}var AL={vw:"volkswagen",mercedesbenz:"mercedes"};' +
  'function run(){var s=document.getElementById("sf-brand");if(!s||!s.options.length)return false;' +
  'if(F){var fs=document.getElementById("sf-fuel");if(fs)[].forEach.call(fs.options,function(o){var t=o.textContent.trim();if(F[t])o.textContent=F[t];});}' +
  'var q=nq(new URLSearchParams(location.search).get("marka"));if(!q)return true;q=AL[q]||q;' +
  'var ok=[].some.call(s.options,function(o){var v=nq(o.value||o.textContent);return v&&(AL[v]||v)===q;});' +
  'if(ok||document.getElementById("ca-brand-msg"))return true;var l=document.getElementById("sub-list");if(!l)return true;' +
  'var d=document.createElement("div");d.id="ca-brand-msg";d.setAttribute("role","status");d.textContent=N;' +
  'd.style.cssText="margin:0 0 18px;padding:14px 18px;border-radius:12px;background:#fff4f4;border:1px solid #f3c6c9;color:#8a0f1a;font-weight:600;font-size:15px;line-height:1.45";' +
  'l.parentNode.insertBefore(d,l);return true;}' +
  'var n=0;(function t(){if(run()||++n>40)return;setTimeout(t,150);})();})();</script>';
const mm = { rm: 0, menu: 0, hub: 0, js: 0 };
try {
  if (BR && BR.size) {
    for (const f of walk(DIST, [])) {
      if (/\.html$/.test(f)) {
        let h = fs.readFileSync(f, 'utf8'); const s = h;
        if (h.indexOf('ddi-brand') > -1) {
          h = h.replace(/<a class="ddi ddi-brand" href="[^"]*[?&]marka=([a-z0-9-]+)[^"]*">[\s\S]*?<\/a>/g, (a, k) => { if (BR.has(bkey(k))) return a; mm.rm++; return ''; });
        }
        if (h.indexOf('id="sf-brand"') > -1 && h.indexOf('id="ca-brand-note"') < 0) {
          const lg = ((h.match(/<html[^>]*\slang="([a-z]{2})/i) || [])[1] || 'hu').toLowerCase();
          const bi = h.lastIndexOf('</body>'); if (bi > 0) { h = h.slice(0, bi) + hubJs(lg) + h.slice(bi); mm.hub++; }
        }
        if (h !== s) { fs.writeFileSync(f, h); mm.menu++; }
      } else if (/(^|[\\/])mega-menu(-test)?\.js$/.test(f)) {
        let j = fs.readFileSync(f, 'utf8'); const s = j;
        j = j.replace(/(var RENT_BRANDS = \[)([^\]]*)(\])/, (a, p1, body, p3) => p1 + body.split(/,\s*(?=B\()/).filter((b) => { const k = (b.match(/B\('([a-z]+)'/) || [])[1]; return !k || BR.has(bkey(k)); }).join(', ') + p3);
        if (j !== s) { fs.writeFileSync(f, j); mm.js++; }
      }
    }
  }
  console.log('[skcz-fix1110] bérelhető márkák: ' + (BR ? [...BR].join(',') : '?') + ' · menüből kivett link: ' + mm.rm + ' (' + mm.menu + ' oldal) · mega-menu.js: ' + mm.js + ' · lista-üzenet: ' + mm.hub + ' oldal');
} catch (e) { console.log('[skcz-fix1110] márkák hiba:', e && e.stack || e); }

/* ---------- 2) jelenleg nem bérelhető modellek (Marc, 2026-11-10) ----------
   A régi, a bérelhető kínálatban már nem szereplő modelloldalak MEGMARADNAK (nincs törlés / 301, nincs halott link):
   „Jelenleg nem elérhető” jelzés, az ár és a díj-megjegyzés rejtve, a gombok helyett „Érdekel — szóljanak, ha újra elérhető”
   űrlap (→ /api/lead, bérlési érdeklődésként a piac postafiókjába és a CRM-be), és az aktuálisan elérhető autókra mutató gomb.
   Az autólista (/autoink/ és minden nyelvi / piaci megfelelője) alján külön szekció sorolja fel ezeket a modelleket (márkaszűrővel együtt).
   A keresőindexből továbbra is kimaradnak (régi ár ne jelenjen meg); a sitemapben maradnak. */
const NA = {
  hu: { badge: 'Jelenleg nem elérhető', h: 'Jelenleg nem elérhető modellek', intro: 'Ezek a modellek korábban szerepeltek bérelhető kínálatunkban. Jelezze érdeklődését, és szólunk, amint újra elérhetők.', want: 'Érdekel — szóljanak, ha elérhető', more: 'Részletek', avail: 'Elérhető autók', box: 'Ez a modell jelenleg nem elérhető bérlésre.', boxTx: 'Jelezze érdeklődését, és amint újra elérhető, felvesszük Önnel a kapcsolatot — vagy nézze meg jelenleg elérhető autóinkat.', mt: 'Érdeklődés', name: 'Név', email: 'E-mail', phone: 'Telefon', note: 'Megjegyzés (pl. futamidő, km-keret) — nem kötelező', cons: 'Hozzájárulok, hogy a CarAdvance a megadott elérhetőségeken felvegye velem a kapcsolatot ezzel kapcsolatban.', send: 'Küldés', ok: 'Köszönjük! Szólunk, amint újra elérhető:', err: 'Hiba történt. Kérjük, próbálja újra, vagy hívjon minket.', need: 'Adjon meg e-mail címet vagy telefonszámot, és fogadja el a hozzájárulást.', close: 'Bezárás' },
  en: { badge: 'Currently not available', h: 'Currently unavailable models', intro: 'These models were previously part of our rental range. Register your interest and we will let you know as soon as they are available again.', want: 'Interested — notify me', more: 'Details', avail: 'Available cars', box: 'This model is currently not available for rent.', boxTx: 'Register your interest and we will contact you as soon as it is available again — or browse our currently available cars.', mt: 'Register interest', name: 'Name', email: 'E-mail', phone: 'Phone', note: 'Note (e.g. term, mileage) — optional', cons: 'I agree that CarAdvance may contact me about this using the details provided.', send: 'Send', ok: 'Thank you! We will let you know as soon as it is available again:', err: 'Something went wrong. Please try again or call us.', need: 'Please enter an e-mail or phone number and accept the consent.', close: 'Close' },
  de: { badge: 'Derzeit nicht verfügbar', h: 'Derzeit nicht verfügbare Modelle', intro: 'Diese Modelle waren bereits in unserem Mietangebot. Melden Sie Ihr Interesse an – wir informieren Sie, sobald sie wieder verfügbar sind.', want: 'Interesse — bitte benachrichtigen', more: 'Details', avail: 'Verfügbare Fahrzeuge', box: 'Dieses Modell ist derzeit nicht zur Miete verfügbar.', boxTx: 'Melden Sie Ihr Interesse an – wir melden uns, sobald es wieder verfügbar ist. Oder sehen Sie sich unsere aktuell verfügbaren Fahrzeuge an.', mt: 'Interesse anmelden', name: 'Name', email: 'E-Mail', phone: 'Telefon', note: 'Anmerkung (z. B. Laufzeit, Kilometer) — optional', cons: 'Ich bin einverstanden, dass CarAdvance mich dazu über die angegebenen Kontaktdaten kontaktiert.', send: 'Senden', ok: 'Vielen Dank! Wir melden uns, sobald es wieder verfügbar ist:', err: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns an.', need: 'Bitte E-Mail oder Telefonnummer angeben und die Einwilligung bestätigen.', close: 'Schließen' },
  fr: { badge: 'Actuellement indisponible', h: 'Modèles actuellement indisponibles', intro: 'Ces modèles faisaient partie de notre offre de location. Signalez votre intérêt et nous vous préviendrons dès qu’ils seront de nouveau disponibles.', want: 'Intéressé — me prévenir', more: 'Détails', avail: 'Voitures disponibles', box: 'Ce modèle n’est actuellement pas disponible à la location.', boxTx: 'Signalez votre intérêt et nous vous contacterons dès qu’il sera de nouveau disponible — ou découvrez nos voitures disponibles.', mt: 'Signaler mon intérêt', name: 'Nom', email: 'E-mail', phone: 'Téléphone', note: 'Remarque (durée, kilométrage…) — facultatif', cons: 'J’accepte que CarAdvance me contacte à ce sujet via les coordonnées fournies.', send: 'Envoyer', ok: 'Merci ! Nous vous préviendrons dès qu’il sera de nouveau disponible :', err: 'Une erreur s’est produite. Veuillez réessayer ou nous appeler.', need: 'Indiquez un e-mail ou un numéro de téléphone et acceptez le consentement.', close: 'Fermer' },
  it: { badge: 'Attualmente non disponibile', h: 'Modelli attualmente non disponibili', intro: 'Questi modelli facevano parte della nostra offerta di noleggio. Segnala il tuo interesse e ti avviseremo non appena saranno di nuovo disponibili.', want: 'Mi interessa — avvisatemi', more: 'Dettagli', avail: 'Auto disponibili', box: 'Questo modello non è attualmente disponibile a noleggio.', boxTx: 'Segnala il tuo interesse e ti contatteremo non appena sarà di nuovo disponibile — oppure guarda le auto disponibili.', mt: 'Segnala interesse', name: 'Nome', email: 'E-mail', phone: 'Telefono', note: 'Nota (durata, chilometraggio…) — facoltativa', cons: 'Acconsento a essere contattato da CarAdvance in merito tramite i recapiti indicati.', send: 'Invia', ok: 'Grazie! Ti avviseremo non appena sarà di nuovo disponibile:', err: 'Si è verificato un errore. Riprova o chiamaci.', need: 'Inserisci un’e-mail o un numero di telefono e accetta il consenso.', close: 'Chiudi' },
  es: { badge: 'Actualmente no disponible', h: 'Modelos actualmente no disponibles', intro: 'Estos modelos formaban parte de nuestra oferta de alquiler. Indíquenos su interés y le avisaremos en cuanto vuelvan a estar disponibles.', want: 'Me interesa — avisadme', more: 'Detalles', avail: 'Coches disponibles', box: 'Este modelo no está disponible para alquiler en este momento.', boxTx: 'Indíquenos su interés y le contactaremos en cuanto vuelva a estar disponible — o vea nuestros coches disponibles.', mt: 'Indicar interés', name: 'Nombre', email: 'E-mail', phone: 'Teléfono', note: 'Nota (plazo, kilometraje…) — opcional', cons: 'Acepto que CarAdvance me contacte al respecto con los datos facilitados.', send: 'Enviar', ok: '¡Gracias! Le avisaremos en cuanto vuelva a estar disponible:', err: 'Se ha producido un error. Inténtelo de nuevo o llámenos.', need: 'Indique un e-mail o teléfono y acepte el consentimiento.', close: 'Cerrar' },
  pl: { badge: 'Obecnie niedostępny', h: 'Obecnie niedostępne modele', intro: 'Te modele były wcześniej w naszej ofercie wynajmu. Zgłoś zainteresowanie, a damy znać, gdy tylko znów będą dostępne.', want: 'Jestem zainteresowany — dajcie znać', more: 'Szczegóły', avail: 'Dostępne samochody', box: 'Ten model jest obecnie niedostępny do wynajmu.', boxTx: 'Zgłoś zainteresowanie, a skontaktujemy się, gdy tylko znów będzie dostępny — lub zobacz aktualnie dostępne samochody.', mt: 'Zgłoś zainteresowanie', name: 'Imię i nazwisko', email: 'E-mail', phone: 'Telefon', note: 'Uwagi (okres, limit km…) — opcjonalnie', cons: 'Wyrażam zgodę na kontakt ze strony CarAdvance w tej sprawie za pomocą podanych danych.', send: 'Wyślij', ok: 'Dziękujemy! Damy znać, gdy znów będzie dostępny:', err: 'Wystąpił błąd. Spróbuj ponownie lub zadzwoń do nas.', need: 'Podaj e-mail lub telefon i zaakceptuj zgodę.', close: 'Zamknij' },
  sk: { badge: 'Momentálne nedostupné', h: 'Momentálne nedostupné modely', intro: 'Tieto modely boli v minulosti v našej ponuke prenájmu. Dajte nám vedieť o svojom záujme a ozveme sa, hneď ako budú opäť dostupné.', want: 'Mám záujem — ozvite sa', more: 'Detail', avail: 'Dostupné autá', box: 'Tento model momentálne nie je dostupný na prenájom.', boxTx: 'Dajte nám vedieť o svojom záujme a ozveme sa vám, hneď ako bude opäť dostupný — alebo si pozrite aktuálne dostupné autá.', mt: 'Záujem o auto', name: 'Meno', email: 'E-mail', phone: 'Telefón', note: 'Poznámka (napr. doba prenájmu, limit km) — nepovinné', cons: 'Súhlasím, aby ma CarAdvance v tejto veci kontaktovala na uvedených kontaktoch.', send: 'Odoslať', ok: 'Ďakujeme! Ozveme sa, hneď ako bude opäť dostupné:', err: 'Nastala chyba. Skúste to znova alebo nám zavolajte.', need: 'Zadajte e-mail alebo telefón a potvrďte súhlas.', close: 'Zavrieť' },
  cs: { badge: 'Momentálně nedostupné', h: 'Momentálně nedostupné modely', intro: 'Tyto modely byly v minulosti v naší nabídce pronájmu. Dejte nám vědět o svém zájmu a ozveme se, jakmile budou opět dostupné.', want: 'Mám zájem — ozvěte se', more: 'Detail', avail: 'Dostupné vozy', box: 'Tento model momentálně není dostupný k pronájmu.', boxTx: 'Dejte nám vědět o svém zájmu a ozveme se vám, jakmile bude opět dostupný — nebo si prohlédněte aktuálně dostupné vozy.', mt: 'Zájem o vůz', name: 'Jméno', email: 'E-mail', phone: 'Telefon', note: 'Poznámka (např. doba pronájmu, limit km) — nepovinné', cons: 'Souhlasím, aby mě CarAdvance v této věci kontaktovala na uvedených kontaktech.', send: 'Odeslat', ok: 'Děkujeme! Ozveme se, jakmile bude opět dostupný:', err: 'Došlo k chybě. Zkuste to znovu nebo nám zavolejte.', need: 'Zadejte e-mail nebo telefon a potvrďte souhlas.', close: 'Zavřít' },
  uk: { badge: 'Наразі недоступно', h: 'Наразі недоступні моделі', intro: 'Ці моделі раніше були в нашій пропозиції оренди. Залиште заявку — ми повідомимо, щойно вони знову будуть доступні.', want: 'Цікавить — повідомте мене', more: 'Детальніше', avail: 'Доступні авто', box: 'Ця модель наразі недоступна для оренди.', boxTx: 'Залиште заявку — ми зв’яжемося з вами, щойно вона знову буде доступна, або перегляньте доступні авто.', mt: 'Залишити заявку', name: 'Ім’я', email: 'E-mail', phone: 'Телефон', note: 'Примітка (термін, пробіг…) — необов’язково', cons: 'Я погоджуюся, щоб CarAdvance зв’язалася зі мною щодо цього за вказаними контактами.', send: 'Надіслати', ok: 'Дякуємо! Ми повідомимо, щойно знову буде доступно:', err: 'Сталася помилка. Спробуйте ще раз або зателефонуйте нам.', need: 'Вкажіть e-mail або телефон і підтвердіть згоду.', close: 'Закрити' },
  zh: { badge: '暂不可租', h: '暂不可租的车型', intro: '这些车型曾在我们的租赁车队中。登记您的兴趣，一旦重新可租我们会立即通知您。', want: '感兴趣 — 有车时通知我', more: '详情', avail: '可租车辆', box: '该车型目前暂不可租。', boxTx: '登记您的兴趣，一旦重新可租我们将与您联系——或浏览目前可租的车辆。', mt: '登记兴趣', name: '姓名', email: '电子邮箱', phone: '电话', note: '备注（租期、里程等）— 选填', cons: '我同意 CarAdvance 通过所留联系方式就此与我联系。', send: '提交', ok: '谢谢！重新可租时我们会通知您：', err: '出现错误，请重试或致电我们。', need: '请填写电子邮箱或电话，并勾选同意。', close: '关闭' }
};
const naLang = (h) => { const l = ((h.match(/<html[^>]*\slang="([a-zA-Z-]+)"/) || [])[1] || 'hu').toLowerCase().slice(0, 2); return NA[l] ? l : 'en'; };
const escH = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NA_CSS = '<style id="ca-na-css">.ca-na .ca-pbox,.ca-na .cd-note,.ca-na .cd-nav-price,.ca-na #arak,.ca-na a[href="#arak"]{display:none!important}.ca-na-chip{background:#e2001a!important;color:#fff!important;border-color:#e2001a!important}'
  + '.ca-na-box{margin:14px 0 16px;padding:16px 18px;border-radius:14px;background:rgba(226,0,26,.07);border:1px solid rgba(226,0,26,.28)}.ca-na-box b{display:block;font-size:17px;margin-bottom:4px}.ca-na-box span{opacity:.85;font-size:14.5px;line-height:1.5}'
  + '.ca-wl-m{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(10,10,12,.62);padding:16px}.ca-wl-m.on{display:flex}'
  + '.ca-wl-d{position:relative;width:100%;max-width:440px;background:#fff;color:#141519;border-radius:18px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:inherit;max-height:92vh;overflow:auto}'
  + '.ca-wl-d h3{margin:0 0 4px;font-size:20px;color:#141519}.ca-wl-d .ca-wl-car{margin:0 0 14px;color:#e2001a;font-weight:700}.ca-wl-d label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px;color:#141519}'
  + '.ca-wl-d input[type=text],.ca-wl-d input[type=email],.ca-wl-d input[type=tel],.ca-wl-d textarea{display:block;width:100%;box-sizing:border-box;border:1px solid #d5d9e0;border-radius:10px;padding:10px 12px;font:inherit;font-size:15px;background:#fff;color:#141519;margin-top:4px}'
  + '.ca-wl-d textarea{min-height:64px;resize:vertical}.ca-wl-d .ca-wl-c{display:flex;gap:9px;align-items:flex-start;font-weight:400;font-size:13px;line-height:1.45;margin-top:12px}.ca-wl-d .ca-wl-c input{margin-top:3px}'
  + '.ca-wl-d .ca-wl-b{display:flex;gap:8px;margin-top:16px}.ca-wl-d button{border:0;border-radius:999px;padding:12px 20px;font:inherit;font-weight:700;cursor:pointer}.ca-wl-send{background:#e2001a;color:#fff;flex:1}.ca-wl-x{background:#eef0f4;color:#141519}'
  + '.ca-wl-msg{margin-top:10px;font-size:14px;line-height:1.45}.ca-wl-msg.err{color:#b0001a}.ca-wl-msg.ok{color:#17663a;font-weight:600}'
  + '#ca-na{margin:46px 0 10px}#ca-na .ca-na-intro{margin:6px 0 18px;opacity:.8;max-width:760px;line-height:1.55}#ca-na .ca-na-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}'
  + '#ca-na .ca-na-c{border:1px solid rgba(127,127,127,.22);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;background:rgba(127,127,127,.04)}'
  + '#ca-na .ca-na-i{position:relative;display:block;aspect-ratio:16/10;background:rgba(127,127,127,.1)}#ca-na .ca-na-i img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(.45);opacity:.9}'
  + '#ca-na .ca-na-i span{position:absolute;left:10px;top:10px;background:#141519;color:#fff;font-size:11.5px;font-weight:700;padding:5px 10px;border-radius:999px}'
  + '#ca-na .ca-na-t{padding:12px 14px 4px;font-weight:700;font-size:16px}#ca-na .ca-na-a{padding:8px 14px 14px;display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}'
  + '#ca-na .ca-na-a button{border:0;border-radius:999px;background:#e2001a;color:#fff;font:inherit;font-weight:700;font-size:13px;padding:9px 14px;cursor:pointer}#ca-na .ca-na-a a{border:1px solid rgba(127,127,127,.4);border-radius:999px;font-weight:700;font-size:13px;padding:8px 14px;text-decoration:none;color:inherit}'
  + '#ca-na[hidden],#ca-na .ca-na-c[hidden]{display:none!important}</style>';
// kliensoldali rész: érdeklődés-ablak (minden .ca-wl-open gomb) + márkaszűrő az autólista szekcióján
const NA_CLIENT = function () {
  var T = window.__CA_NA_T, L = window.__CA_NA_L, m = null, car = '';
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function build() {
    m = document.createElement('div'); m.className = 'ca-wl-m'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<form class="ca-wl-d" novalidate><h3>' + esc(T.mt) + '</h3><p class="ca-wl-car"></p>'
      + '<label>' + esc(T.name) + '<input type="text" name="n" autocomplete="name"></label>'
      + '<label>' + esc(T.email) + '<input type="email" name="e" autocomplete="email"></label>'
      + '<label>' + esc(T.phone) + '<input type="tel" name="p" autocomplete="tel"></label>'
      + '<label>' + esc(T.note) + '<textarea name="o"></textarea></label>'
      + '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">'
      + '<label class="ca-wl-c"><input type="checkbox" name="c"><span>' + esc(T.cons) + '</span></label><div class="ca-wl-msg" role="status"></div>'
      + '<div class="ca-wl-b"><button type="submit" class="ca-wl-send">' + esc(T.send) + '</button><button type="button" class="ca-wl-x">' + esc(T.close) + '</button></div></form>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.classList.contains('ca-wl-x')) m.classList.remove('on'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && m) m.classList.remove('on'); });
    var f = m.querySelector('form');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = f.querySelector('.ca-wl-msg'), v = function (n) { return (f.elements[n].value || '').trim(); };
      if ((!v('e') && !v('p')) || !f.elements.c.checked) { g.className = 'ca-wl-msg err'; g.textContent = T.need; return; }
      var b = f.querySelector('.ca-wl-send'); b.disabled = true;
      var P = { 'Típus': 'Bérlés — érdeklődés (jelenleg nem elérhető autó)', 'Autó': car, 'Név': v('n'), 'E-mail': v('e'), 'Telefon': v('p'),
        'Megjegyzés': (v('o') ? v('o') + ' · ' : '') + 'Jelenleg nem elérhető — értesítést kér, ha újra bérelhető.', 'Nyelv': L, website: v('website') };
      try { if (window.caLeadExtras) Object.assign(P, window.caLeadExtras()); } catch (_e) {}
      P.page = location.href;
      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(P) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.ok === false) throw 0;
          g.className = 'ca-wl-msg ok'; g.textContent = T.ok + ' ' + car;
          [].forEach.call(f.querySelectorAll('input,textarea'), function (i) { if (i.type !== 'checkbox') i.value = ''; });
          try { if (window.caFireLead) window.caFireLead('varolista'); } catch (_e) {}
        }); })
        .catch(function () { g.className = 'ca-wl-msg err'; g.textContent = T.err; })
        .then(function () { b.disabled = false; });
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.ca-wl-open'); if (!t) return;
    e.preventDefault(); if (!m) build(); car = t.getAttribute('data-car') || '';
    m.querySelector('.ca-wl-car').textContent = car;
    var g = m.querySelector('.ca-wl-msg'); g.className = 'ca-wl-msg'; g.textContent = '';
    m.classList.add('on'); setTimeout(function () { var i = m.querySelector('input[name=n]'); if (i) i.focus(); }, 40);
  });
  var s = document.getElementById('ca-na');
  if (s) {
    var q = new URLSearchParams(location.search).get('marka');
    if (q) {
      q = q.toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''); var AL = { vw: 'volkswagen', mercedesbenz: 'mercedes' }; q = AL[q] || q; var n = 0;
      [].forEach.call(s.querySelectorAll('.ca-na-c'), function (c) { var ok = c.getAttribute('data-brand') === q; c.hidden = !ok; if (ok) n++; });
      if (!n) s.hidden = true;
    }
  }
};
const naJs = (lg) => '<script id="ca-na-js">window.__CA_NA_T=' + JSON.stringify(NA[lg]) + ';window.__CA_NA_L=' + JSON.stringify(lg) + ';(' + NA_CLIENT.toString() + ')();</script>';
const gone = []; // a keresőindexből kimaradó oldalak
try {
  // a piaci / nyelvi autólisták (hub): prefix → hub útvonal
  const HUB = new Map();
  for (const f of walk(DIST, [])) {
    if (!/[\\/]index\.html$/.test(f)) continue;
    const rel = path.relative(DIST, f).split(path.sep).join('/');
    if (/^(admin|i18n)\//.test(rel)) continue;
    const h0 = fs.readFileSync(f, 'utf8');
    if (h0.indexOf('id="sf-brand"') < 0 || h0.indexOf('<div id="sub-list"></div>') < 0) continue;
    const parts = rel.split('/'); parts.pop(); const slug = parts.pop(); const pre = parts.join('/');
    if (!HUB.has(pre)) HUB.set(pre, { file: f, url: '/' + (pre ? pre + '/' : '') + slug + '/' });
  }
  const byPre = new Map();
  let nP = 0;
  for (const f of walk(DIST, [])) {
    const rel = path.relative(DIST, f).split(path.sep).join('/');
    if (!/\/index\.html$/.test(rel) || /^(admin|i18n)\//.test(rel)) continue; // az ár nélküli (_np) változatok is
    let h = fs.readFileSync(f, 'utf8');
    // bérlési modelloldal sablon (cd-hero + cd-lead, magyar megfelelője /berelheto-auto/…), de bérlési ablak (sub-rent) nélkül = már nincs kínálatban
    if (h.indexOf('cd-hero') < 0 || h.indexOf('cd-lead') < 0 || h.indexOf('sub-rent') > -1 || h.indexOf('/berelheto-auto/') < 0) continue;
    gone.push('/' + rel.replace(/index\.html$/, ''));
    const lg = naLang(h); const T = NA[lg];
    const car = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const brand = car.split(' ')[0] || '';
    const parts = rel.split('/'); parts.pop(); parts.pop(); parts.pop(); const pre = parts.join('/');
    const hub = HUB.get(pre); const bq = bkey(brand);
    const hubUrl = hub ? hub.url + '?marka=' + encodeURIComponent(bq) + '#berelheto' : '/';
    if (h.indexOf('id="ca-na-css"') < 0) {
      // jelzés: elérhetőség-chip → „nem elérhető”, ár rejtve, gombok → érdeklődés + elérhető autók
      h = h.replace(/(<span class="cd-chip)(">)([^<]*)(<\/span><span class="cd-chip cd-chip-year">)/, (a, p1, p2, t, p4) => p1 + ' ca-na-chip' + p2 + escH(T.badge) + p4);
      const box = '<div class="ca-na-box"><b>' + escH(T.box) + '</b><span>' + escH(T.boxTx) + '</span></div>';
      if (/<div class="ca-pbox/.test(h)) h = h.replace(/(<div class="ca-pbox)/, box + '$1');
      h = h.replace(/<div class="cd-cta">[\s\S]*?<\/div>/g, () => '<div class="cd-cta"><a class="cd-btn cd-btn-red ca-wl-open" href="#" data-car="' + escH(car) + '">' + escH(T.want) + '</a><a class="cd-btn cd-btn-white" href="' + escH(hubUrl) + '">' + escH(T.avail) + '</a></div>');
      // az információs blokk második gombsora (cd-cta2) és minden további bérlési gomb (?berles=… — sticky menü, alsó sáv)
      h = h.replace(/<div class="cd-cta2">[\s\S]*?<\/div>/g, () => '<div class="cd-cta2"><a class="cd-btn cd-btn-red ca-wl-open" href="#" data-car="' + escH(car) + '">' + escH(T.want) + '</a><a class="cd-btn cd-btn-dark" href="' + escH(hubUrl) + '">' + escH(T.avail) + '</a></div>');
      h = h.replace(/<a class="([^"]*)" href="[^"]*[?&]berles=[^"]*">[\s\S]*?<\/a>/g, (m0, cls) => '<a class="' + cls + ' ca-wl-open" href="#" data-car="' + escH(car) + '">' + escH(T.want) + '</a>');
      if (h.indexOf('ca-na-box') < 0) h = h.replace(/<div class="cd-cta">/, box + '<div class="cd-cta">');
      h = h.replace(/<body([^>]*)>/, (a, at) => (/class="/.test(at) ? '<body' + at.replace(/class="/, 'class="ca-na ') + '>' : '<body' + at + ' class="ca-na">'));
      h = h.replace('</head>', NA_CSS + '</head>');
      const bi = h.lastIndexOf('</body>'); if (bi > 0) h = h.slice(0, bi) + naJs(lg) + h.slice(bi);
      fs.writeFileSync(f, h); nP++;
    }
    // kártya az autólistára
    const og = (h.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
    const img = og.replace(/^https:\/\/www\.caradvance\.(hu|sk|cz|pl|ch|eu)/, '');
    if (hub && car) {
      if (!byPre.has(pre)) byPre.set(pre, new Map());
      const mp = byPre.get(pre); if (!mp.has(car)) mp.set(car, { car, bq, img, url: '/' + rel.replace(/index\.html$/, '') });
    }
  }
  // szekció az autólisták aljára
  let nH = 0;
  for (const [pre, hub] of HUB) {
    const mp = byPre.get(pre); if (!mp || !mp.size) continue;
    let h = fs.readFileSync(hub.file, 'utf8'); if (h.indexOf('id="ca-na"') > -1) continue;
    const lg = naLang(h); const T = NA[lg];
    const list = [...mp.values()].sort((a, b) => a.car.localeCompare(b.car));
    const cards = list.map((c) => '<div class="ca-na-c" data-brand="' + escH(c.bq) + '"><a class="ca-na-i" href="' + escH(c.url) + '">' + (c.img ? '<img src="' + escH(c.img) + '" alt="' + escH(c.car) + '" loading="lazy">' : '') + '<span>' + escH(T.badge) + '</span></a>'
      + '<div class="ca-na-t">' + escH(c.car) + '</div><div class="ca-na-a"><button type="button" class="ca-wl-open" data-car="' + escH(c.car) + '">' + escH(T.want) + '</button><a href="' + escH(c.url) + '">' + escH(T.more) + '</a></div></div>').join('');
    const sec = '<section id="ca-na" aria-labelledby="ca-na-h"><div class="sub-brand-h"><h3 id="ca-na-h">' + escH(T.h) + '</h3><span class="ln"></span><span class="ct">' + list.length + '</span></div><p class="ca-na-intro">' + escH(T.intro) + '</p><div class="ca-na-g">' + cards + '</div></section>';
    h = h.replace('<div id="sub-list"></div>', '<div id="sub-list"></div>' + sec);
    if (h.indexOf('id="ca-na-css"') < 0) h = h.replace('</head>', NA_CSS + '</head>');
    if (h.indexOf('id="ca-na-js"') < 0) { const bi = h.lastIndexOf('</body>'); if (bi > 0) h = h.slice(0, bi) + naJs(lg) + h.slice(bi); }
    fs.writeFileSync(hub.file, h); nH++;
  }
  // a middleware már nem irányít át (az oldalak élnek) — üres lista
  fs.writeFileSync(path.join(DIST, 'gone-paths.json'), '{}');
  console.log('[skcz-fix1110] nem elérhető bérlési modelloldal megtartva + jelölve: ' + nP + ' (pl. ' + gone.slice(0, 3).join(', ') + ') · autólista-szekció: ' + nH + ' oldal');
} catch (e) { console.log('[skcz-fix1110] nem elérhető modellek hiba:', e && e.stack || e); }

/* ---------- 4 + 5) keresőindexek ---------- */
const SOLD = /^(Elkelt|Eladva|Predané|Predaný|Predaná|Prodáno|Prodaný|Prodané|Prodaná|Sprzedan\w*|Verkauft|Sold|Vendu\w*|Venduto|Venduta|Vendido|Vendida|Продано|已售)(?=[\s:·,—–-]|$)/i;
try {
  const idxFiles = walk(DIST, []).filter((f) => /kereses-index[^/\\]*\.json$/.test(f));
  // SK index: autó-slug → euróár
  const EP = new Map();
  for (const f of idxFiles.filter((f) => /kereses-index-sk\.json$|[\\/]sk[\\/]kereses-index\.json$/.test(f))) {
    try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); for (const o of j.items || []) if (o.k === 'keszlet' && o.ep) { const m = String(o.u || '').match(/\/auto\/([^/]+)\//); if (m) EP.set(m[1], o.ep); } } catch (e) {}
  }
  let sold = 0, ep = 0, gi = 0;
  for (const f of idxFiles) {
    let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(j.items)) continue;
    const n0 = j.items.length; let ch = false;
    j.items = j.items.filter((o) => {
      if (o.k === 'keszlet' && (SOLD.test(String(o.t || '').trim()) || SOLD.test(String(o.h || '').trim()))) { sold++; return false; }
      if (gone.length && o.u && (gone.includes(o.u) || gone.includes(String(o.u).replace(/^\/(sk|cs|pl|ch|eu)(?=\/)/, '')))) { gi++; return false; }
      return true;
    });
    if (j.items.length !== n0) ch = true;
    if (/kereses-index-cs\.json$|[\\/]cs[\\/]kereses-index\.json$/.test(f)) {
      for (const o of j.items) { if (o.k === 'keszlet' && !o.ep) { const m = String(o.u || '').match(/\/auto\/([^/]+)\//); if (m && EP.has(m[1])) { o.ep = EP.get(m[1]); o.pc = 'CZK'; ep++; ch = true; } } }
    }
    if (ch) fs.writeFileSync(f, JSON.stringify(j));
  }
  console.log('[skcz-fix1110] keresőindex: ' + idxFiles.length + ' fájl · eladott autó kivéve: ' + sold + ' · régi bérlési oldal kivéve: ' + gi + ' · CZ euróár: ' + ep);
} catch (e) { console.log('[skcz-fix1110] index hiba:', e && e.stack || e); }
