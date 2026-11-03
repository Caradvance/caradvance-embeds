#!/usr/bin/env node
/**
 * market-404.mjs — helyi nyelvű 404-oldal a caradvance.pl / .ch / .eu domainekre (Marc, 2026-11-03)
 *
 * Ugyanaz, mint a skcz-local.mjs notFound() a .sk/.cz-re: a dist/404.html keretéből, a piac saját láblécével.
 *   dist/404-pl-pl.html  404-pl-en.html  404-pl-de.html
 *   dist/404-ch-de.html  404-ch-fr.html  404-ch-it.html  404-ch-en.html
 *   dist/404-eu-de.html  404-eu-fr.html  404-eu-it.html  404-eu-es.html
 * A middleware (functions/_middleware.js) ezeket adja ki 404-es státusszal a nem létező címekre;
 * a _routes.json-on kívüli címekhez (a Pages statikus 404.html-je) a dist/404.html-be tett kis szkript
 * cseréli le a tartalmat ugyanerre. Idempotens; hibára exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

const T = {
  pl: { title: 'Nie znaleziono strony — CarAdvance', code: '404 — nie znaleziono strony', h1: 'Nie znaleźliśmy tej strony', p: 'Być może w adresie jest literówka albo strona nie jest już dostępna.', hintB: 'Szukasz auta z nieaktualnego linku?', hint: 'Jeśli zostało już sprzedane, usunęliśmy je z oferty. Chętnie znajdziemy podobne na całym rynku niemieckim.', cars: 'Nasze samochody', home: 'Strona główna', q: 'Pytania?' },
  en: { title: 'Page not found — CarAdvance', code: '404 — page not found', h1: 'We couldn’t find this page', p: 'There may be a typo in the address, or the page is no longer available.', hintB: 'Looking for a car from an old link?', hint: 'If it has already been sold, we have removed it from our offer. We’ll gladly find you a similar one across the whole German market.', cars: 'Our cars', home: 'Home', q: 'Questions?' },
  de: { title: 'Seite nicht gefunden — CarAdvance', code: '404 — Seite nicht gefunden', h1: 'Diese Seite haben wir nicht gefunden', p: 'Vielleicht enthält die Adresse einen Tippfehler, oder die Seite ist nicht mehr verfügbar.', hintB: 'Sie suchen ein Auto aus einem alten Link?', hint: 'Wenn es bereits verkauft ist, haben wir es aus dem Angebot genommen. Gerne finden wir Ihnen ein ähnliches auf dem gesamten deutschen Markt.', cars: 'Unsere Autos', home: 'Startseite', q: 'Fragen?' },
  fr: { title: 'Page introuvable — CarAdvance', code: '404 — page introuvable', h1: 'Nous n’avons pas trouvé cette page', p: 'L’adresse contient peut-être une faute de frappe, ou la page n’est plus disponible.', hintB: 'Vous cherchez une voiture depuis un ancien lien ?', hint: 'Si elle a déjà été vendue, nous l’avons retirée de l’offre. Nous vous en trouverons volontiers une similaire sur tout le marché allemand.', cars: 'Nos voitures', home: 'Accueil', q: 'Des questions ?' },
  it: { title: 'Pagina non trovata — CarAdvance', code: '404 — pagina non trovata', h1: 'Non abbiamo trovato questa pagina', p: 'Forse l’indirizzo contiene un errore di battitura, oppure la pagina non è più disponibile.', hintB: 'Cerca un’auto da un vecchio link?', hint: 'Se è già stata venduta, l’abbiamo tolta dall’offerta. Saremo lieti di trovarle un’auto simile su tutto il mercato tedesco.', cars: 'Le nostre auto', home: 'Home', q: 'Domande?' },
  es: { title: 'Página no encontrada — CarAdvance', code: '404 — página no encontrada', h1: 'No hemos encontrado esta página', p: 'Puede que la dirección tenga un error, o que la página ya no esté disponible.', hintB: '¿Busca un coche de un enlace antiguo?', hint: 'Si ya se ha vendido, lo hemos retirado de la oferta. Con gusto le encontraremos uno similar en todo el mercado alemán.', cars: 'Nuestros coches', home: 'Inicio', q: '¿Preguntas?' },
};

// piac → nyelvek: [nyelv, URL-előtag, autók oldal, a nyelv főoldala a dist-ben]
const M = {
  pl: { mail: 'info@caradvance.hu', tel: '+36302336060', telTxt: '+36 30 233 6060', langs: [['pl', '', '/samochody/', 'pl'], ['en', '/en', '/en/samochody/', 'pl/en'], ['de', '/de', '/de/samochody/', 'pl/de']] },
  ch: { mail: 'info@caradvance.ch', tel: '+41797158580', telTxt: '+41 79 715 85 80', langs: [['de', '', '/fahrzeuge/', 'ch'], ['fr', '/fr', '/fr/fahrzeuge/', 'ch/fr'], ['it', '/it', '/it/fahrzeuge/', 'ch/it'], ['en', '/en', '/en/fahrzeuge/', 'ch/en']] },
  eu: { mail: 'import@caradvance.de', tel: '+498999998100', telTxt: '+49 89 99998 100', langs: [['de', '/de', '/de/fahrzeuge/', 'eu/de'], ['fr', '/fr', '/fr/vehicules/', 'eu/fr'], ['it', '/it', '/it/veicoli/', 'eu/it'], ['es', '/es', '/es/vehiculos/', 'eu/es']] },
};

const SWAP = '<script id="ca-404m">(function(){var m=/(^|\\.)caradvance\\.(pl|ch|eu)$/.exec(location.hostname);if(!m)return;var k=m[2],g=/^\\/(en|de|fr|it|es)\\//.exec(location.pathname),d={pl:"pl",ch:"de",eu:"de"}[k],ok={pl:"pl en de",ch:"de fr it en",eu:"de fr it es"}[k].split(" "),l=g&&ok.indexOf(g[1])>=0?g[1]:d;document.documentElement.style.visibility="hidden";fetch("/404-"+k+"-"+l).then(function(r){if(!r.ok)throw 0;return r.text();}).then(function(t){document.open();document.write(t);document.close();}).catch(function(){document.documentElement.style.visibility="";});})();</script>';

function run() {
  const rootF = path.join(DIST, '404.html'); if (!fs.existsSync(rootF)) return 'nincs dist/404.html';
  let base = fs.readFileSync(rootF, 'utf8');
  if (!/<main class="box">[\s\S]*?<\/main>/.test(base)) return 'a 404.html-ben nincs <main class="box">';
  const made = [];
  for (const [mk, C] of Object.entries(M)) {
    for (const [lg, pre, cars, homeDir] of C.langs) {
      const N = T[lg]; const home = path.join(DIST, homeDir, 'index.html');
      if (!fs.existsSync(home)) continue;
      let t = base.replace(/<script id="ca-404[lm]">[\s\S]*?<\/script>/g, '')
        .replace(/<html lang="[^"]*">/, `<html lang="${lg}">`)
        .replace(/<title>[^<]*<\/title>/, `<title>${N.title}</title>`)
        .replace(/<link rel="canonical"[^>]*>/, '')
        .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, '')
        .replace(/<main class="box">[\s\S]*?<\/main>/, () => `<main class="box"> <img class="logo" src="/caradvance-logo.webp" alt="CarAdvance"> <div class="code">${N.code}</div> <h1>${N.h1}</h1> <p>${N.p}</p> <div class="hint"><strong>${N.hintB}</strong><br>${N.hint}</div> <div class="btns"><a class="btn primary" href="${cars}">${N.cars}</a> <a class="btn soft" href="${pre}/">${N.home}</a></div> <div class="foot">${N.q} <a href="mailto:${C.mail}">${C.mail}</a> · <a href="tel:${C.tel}">${C.telTxt}</a></div> </main>`);
      const hh = fs.readFileSync(home, 'utf8');
      const f = /<footer class="cafoot"[\s\S]*?<\/footer>/.exec(hh);
      if (f && /<footer class="cafoot"[\s\S]*?<\/footer>/.test(t)) t = t.replace(/<footer class="cafoot"[\s\S]*?<\/footer>/, () => f[0].replace(new RegExp(`href="/${mk}/`, 'g'), 'href="/'));
      if (!/name="robots"/.test(t)) t = t.replace(/<head>/, '<head><meta name="robots" content="noindex,follow">');
      fs.writeFileSync(path.join(DIST, `404-${mk}-${lg}.html`), t);
      made.push(`${mk}-${lg}`);
    }
  }
  // a Pages statikus 404.html-je (a _routes.json-on kívüli címek): .pl/.ch/.eu-n a helyi változatra cserél
  if (!base.includes('id="ca-404m"')) { base = base.replace(/<head>/, '<head>' + SWAP); fs.writeFileSync(rootF, base); }
  return `${made.length} oldal: ${made.join(', ')}`;
}
try { console.log('[market-404] ' + run()); } catch (e) { console.log('[market-404] hiba: ' + (e && e.stack || e)); }
