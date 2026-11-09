// CarAdvance CRM — ügyféloldali nyelvek piaconként (2026-11-09, SK/CZ ellenőrzés 1–3. pont).
// A piac (HU / SK / CZ …) a CRM-kérés domainjéből jön (marketOf): aki a caradvance.sk/belso felületen küld ajánlatot,
// adatbekérőt vagy aláírási linket, annak az ügyfele szlovák nyelvű oldalt, szlovák e-mailt és .sk linket kap.
// Itt csak a nyelvfüggő szövegek vannak — a működés (tokenek, ellenőrzések) piactól független.

export const MARKET_SITE = { HU: 'https://www.caradvance.hu', SK: 'https://www.caradvance.sk', CZ: 'https://www.caradvance.cz', PL: 'https://www.caradvance.pl' };
export const siteOf = (market) => MARKET_SITE[market] || MARKET_SITE.HU;
export const langOf = (market) => (market === 'SK' ? 'sk' : market === 'CZ' ? 'cs' : 'hu');
export const CONTACT = {
  hu: { phone: '+36 30 233 6060', email: 'sales@caradvance.hu' },
  sk: { phone: '+421 915 410 555', email: 'info@caradvance.sk' },
  cs: { phone: '+420 604 313 136', email: 'info@caradvance.cz' }
};
export const contactOf = (lang) => CONTACT[lang] || CONTACT.hu;
const pick = (lang, o) => (o[lang] != null ? o[lang] : o.hu);

/* ---------- megszólítás, záró formula ---------- */
export function hello(lang, name) {
  if (lang === 'sk') return name ? `Dobrý deň, ${name},` : 'Vážený zákazník,';
  if (lang === 'cs') return name ? `Dobrý den, ${name},` : 'Vážený zákazníku,';
  return `Kedves ${name || 'Ügyfelünk'}!`;
}
export const regards = (lang) => pick(lang, { hu: 'Üdvözlettel:<br>CarAdvance', sk: 'S pozdravom<br>CarAdvance', cs: 'S pozdravem<br>CarAdvance' });
export function shellFooter(lang) {
  const c = contactOf(lang);
  return pick(lang, {
    hu: `Kérdés esetén válaszoljon erre az e-mailre, vagy hívjon: ${c.phone}.`,
    sk: `Ak máte otázku, odpovedzte na tento e-mail alebo zavolajte: ${c.phone}.`,
    cs: `Máte-li dotaz, odpovězte na tento e-mail nebo zavolejte: ${c.phone}.`
  });
}
const dateFmt = (lang, sec) => new Date(sec * 1000).toLocaleDateString(lang === 'sk' ? 'sk-SK' : lang === 'cs' ? 'cs-CZ' : 'hu-HU', { timeZone: 'Europe/Budapest' });

/* ---------- ajánlat: árcímkék és azonosítók ---------- */
const VAT = {
  sk: { net: ['bez DPH', 'cena bez DPH'], hu27: ['s 27 % maďarskou DPH', 'cena s 27 % maďarskou DPH'], de19: ['s 19 % nemeckou DPH', 'cena s 19 % nemeckou DPH'] },
  cs: { net: ['bez DPH', 'cena bez DPH'], hu27: ['s 27% maďarskou DPH', 'cena s 27% maďarskou DPH'], de19: ['s 19% německou DPH', 'cena s 19% německou DPH'] }
};
export const vatShort = (lang, mode) => ((VAT[lang] || {})[mode] || [])[0] || '';
export const vatLong = (lang, mode) => ((VAT[lang] || {})[mode] || [])[1] || '';
const PERIOD = { sk: { 'hó': 'mes.', 'hónap': 'mes.', 'havonta': 'mes.', 'év': 'rok', 'nap': 'deň', 'hét': 'týždeň' }, cs: { 'hó': 'měs.', 'hónap': 'měs.', 'havonta': 'měs.', 'év': 'rok', 'nap': 'den', 'hét': 'týden' } };
export const periodText = (lang, p) => ((PERIOD[lang] || {})[String(p || '').trim()] || p || '');
export function idLineL(lang, it) {
  if (lang === 'hu') return null;
  return [it.ad_id ? 'mobile.de ID inzerátu: ' + it.ad_id : '', it.config_code ? (it.brand ? it.brand + ' ' : '') + (lang === 'sk' ? 'konfiguračný kód: ' : 'konfigurační kód: ') + it.config_code : ''].filter(Boolean).join(' · ');
}
export function deliveryL(lang, priceTxt) {
  if (!priceTxt) return '';
  return lang === 'sk' ? `Poplatok za dopravu: ${priceTxt} (jednorazovo)` : lang === 'cs' ? `Poplatek za dopravu: ${priceTxt} (jednorázově)` : `Szállítási díj: ${priceTxt} (egyszeri)`;
}

/* ---------- ajánlat-válasz API hibaüzenetei ---------- */
const OFFER_ERR = {
  bad: { hu: 'Érvénytelen ajánlat-hivatkozás.', sk: 'Neplatný odkaz na ponuku.', cs: 'Neplatný odkaz na nabídku.' },
  missing: { hu: 'Ez az ajánlat nem található, vagy már nem érvényes.', sk: 'Táto ponuka sa nenašla alebo už nie je platná.', cs: 'Tato nabídka nebyla nalezena nebo již není platná.' },
  answered: { hu: 'Erre az ajánlatra már válaszolt — köszönjük! Ha mégis változtatna, írjon nekünk vagy hívjon.', sk: 'Na túto ponuku ste už odpovedali — ďakujeme! Ak by ste chceli niečo zmeniť, napíšte nám alebo zavolajte.', cs: 'Na tuto nabídku jste již odpověděli — děkujeme! Pokud byste chtěli něco změnit, napište nám nebo zavolejte.' },
  action: { hu: 'Ismeretlen művelet.', sk: 'Neznáma akcia.', cs: 'Neznámá akce.' },
  choose: { hu: 'Válassza ki, melyik autót kéri.', sk: 'Vyberte, ktoré auto chcete.', cs: 'Vyberte, který vůz chcete.' },
  msg: { hu: 'Kérjük, írja le röviden, mit módosítanánk.', sk: 'Napíšte, prosím, stručne, čo máme zmeniť.', cs: 'Napište prosím stručně, co máme změnit.' },
  answered2: { hu: 'Erre az ajánlatra már válaszolt.', sk: 'Na túto ponuku ste už odpovedali.', cs: 'Na tuto nabídku jste již odpověděli.' },
  server: { hu: 'Szerver hiba. Kérjük, próbálja újra, vagy hívjon minket: +36 30 233 6060.', sk: 'Chyba servera. Skúste to, prosím, znova alebo nám zavolajte: +421 915 410 555.', cs: 'Chyba serveru. Zkuste to prosím znovu nebo nám zavolejte: +420 604 313 136.' }
};
export const offerErr = (lang, k) => pick(lang, OFFER_ERR[k] || OFFER_ERR.server);

/* ---------- ajánlat e-mail ---------- */
const plural = (lang, n, one, few, many) => (n === 1 ? one : lang === 'hu' ? one : n >= 2 && n <= 4 ? few : many);
export function offerSubject(lang, items, again) {
  const n = items.length;
  if (lang === 'sk') return `${again ? 'Pripomienka: ' : ''}Naša ponuka — ${n > 1 ? n + ' ' + plural(lang, n, 'auto', 'autá', 'áut') : items[0].title}`;
  if (lang === 'cs') return `${again ? 'Připomínka: ' : ''}Naše nabídka — ${n > 1 ? n + ' ' + plural(lang, n, 'vůz', 'vozy', 'vozů') : items[0].title}`;
  return `${again ? 'Emlékeztető: ' : ''}Ajánlatunk — ${n > 1 ? n + ' autó' : items[0].title}`;
}
export const OFFER_MAIL = {
  sk: {
    intro: (many, attached) => `Ďakujeme za váš dopyt! Na základe vašich požiadaviek sme pre vás pripravili ${many ? 'nasledujúce ponuky' : 'nasledujúcu ponuku'}.` + (attached ? ` ${many ? 'Podrobné ponuky' : 'Podrobnú ponuku'} (s výbavou a fotografiami) nájdete v <b>prílohe</b>.` : '') + (many ? ' Vyberte si auto, ktoré vás zaujíma — pri každom vidíte cenu.' : ''),
    pdf: 'Ponuku z konfigurátora výrobcu posielame v prílohe (PDF).', config: 'Pozrieť konfiguráciu na stránke výrobcu ↗', pickBtn: 'Vyberám toto', carBtn: 'Detail auta ↗',
    ask: 'Ponuku na vybrané auto môžete jedným kliknutím prijať alebo požiadať o zmenu:', accept: 'Prijať ponuku', modify: 'Žiadam o zmenu', fallback: 'Ak tlačidlá nefungujú, otvorte tento odkaz:'
  },
  cs: {
    intro: (many, attached) => `Děkujeme za vaši poptávku! Na základě vašich požadavků jsme pro vás připravili ${many ? 'následující nabídky' : 'následující nabídku'}.` + (attached ? ` ${many ? 'Podrobné nabídky' : 'Podrobnou nabídku'} (s výbavou a fotografiemi) najdete v <b>příloze</b>.` : '') + (many ? ' Vyberte si vůz, který vás zajímá — u každého vidíte cenu.' : ''),
    pdf: 'Nabídku z konfigurátoru výrobce zasíláme v příloze (PDF).', config: 'Zobrazit konfiguraci na stránce výrobce ↗', pickBtn: 'Vybírám toto', carBtn: 'Detail vozu ↗',
    ask: 'Nabídku na vybraný vůz můžete jedním kliknutím přijmout nebo požádat o změnu:', accept: 'Přijmout nabídku', modify: 'Žádám o změnu', fallback: 'Pokud tlačítka nefungují, otevřete tento odkaz:'
  }
};

/* ---------- adatbekérő e-mail ---------- */
export function dataReqMail(lang, { name, msgHtml, link, exp }) {
  const btn = (t) => `<p style="margin:18px 0"><a href="${link}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:999px;display:inline-block">${t}</a></p>`;
  if (lang === 'sk') return {
    subject: 'Prosíme o zadanie vašich údajov — CarAdvance',
    html: `<p>${hello(lang, name)}</p><p>na prípravu zmlúv vás prosíme o zadanie osobných údajov a nahratie kópie <b>občianskeho preukazu</b> (obe strany, fotografia alebo PDF).</p>${msgHtml}${btn('Zadať údaje a nahrať doklady')}
      <p>Údaje sa k nám dostanú šifrovaným spojením a použijeme ich výlučne na uzavretie zmluvy a súvisiace úradné úkony.</p>
      <p style="color:#6b7280;font-size:12px">Odkaz je osobný, nepreposielajte ho. Platí do ${dateFmt(lang, exp)}.</p><p>${regards(lang)}</p>`
  };
  if (lang === 'cs') return {
    subject: 'Prosíme o zadání vašich údajů — CarAdvance',
    html: `<p>${hello(lang, name)}</p><p>pro přípravu smluv vás prosíme o zadání osobních údajů a nahrání kopie <b>občanského průkazu</b> (obě strany, fotografie nebo PDF).</p>${msgHtml}${btn('Zadat údaje a nahrát doklady')}
      <p>Údaje se k nám dostanou šifrovaným spojením a použijeme je výhradně k uzavření smlouvy a souvisejícím úředním úkonům.</p>
      <p style="color:#6b7280;font-size:12px">Odkaz je osobní, nepřeposílejte ho. Platí do ${dateFmt(lang, exp)}.</p><p>${regards(lang)}</p>`
  };
  return null; // magyar: a régi szöveg marad
}

/* ---------- aláírás: kérelem, kód, aláírt példány ---------- */
export function signReqMail(lang, { name, docsHtml, msgHtml, link, exp }) {
  const btn = (t) => `<p style="margin:18px 0"><a href="${link}" style="background:#e2001a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 24px;border-radius:999px;display:inline-block">${t}</a></p>`;
  if (lang === 'sk') return { subject: 'Dokumenty na podpis — CarAdvance', html: `<p>${hello(lang, name)}</p><p>posielame vám na elektronický podpis tieto dokumenty:</p>${docsHtml}${msgHtml}
    <p>Dokumenty si môžete prečítať a podpísať tlačidlom nižšie. Na podpis vám na túto e-mailovú adresu pošleme jednorazový kód.</p>${btn('Zobraziť a podpísať dokumenty')}
    <p style="color:#6b7280;font-size:12px">Odkaz je osobný, nepreposielajte ho. Platí do ${dateFmt(lang, exp)}. Ak sa vás to netýka, dajte nám, prosím, vedieť.</p>` };
  if (lang === 'cs') return { subject: 'Dokumenty k podpisu — CarAdvance', html: `<p>${hello(lang, name)}</p><p>zasíláme vám k elektronickému podpisu tyto dokumenty:</p>${docsHtml}${msgHtml}
    <p>Dokumenty si můžete přečíst a podepsat tlačítkem níže. K podpisu vám na tuto e-mailovou adresu zašleme jednorázový kód.</p>${btn('Zobrazit a podepsat dokumenty')}
    <p style="color:#6b7280;font-size:12px">Odkaz je osobní, nepřeposílejte ho. Platí do ${dateFmt(lang, exp)}. Pokud se vás to netýká, dejte nám prosím vědět.</p>` };
  return null;
}
export function otpMail(lang, { name, code, big }) {
  if (lang === 'sk') return { subject: `Kód na podpis: ${code}`, html: `<p>${hello(lang, name)}</p><p>na podpis dokumentov, ktoré vám poslala spoločnosť CarAdvance, zadajte tento kód:</p>${big}
    <p style="color:#6b7280;font-size:13px">Kód platí 10 minút a možno ho použiť iba raz. Ak ste oň nežiadali, tento e-mail ignorujte a dajte nám, prosím, vedieť.</p>` };
  if (lang === 'cs') return { subject: `Kód k podpisu: ${code}`, html: `<p>${hello(lang, name)}</p><p>k podpisu dokumentů, které vám zaslala společnost CarAdvance, zadejte tento kód:</p>${big}
    <p style="color:#6b7280;font-size:13px">Kód platí 10 minut a lze jej použít pouze jednou. Pokud jste o něj nežádali, tento e-mail ignorujte a dejte nám prosím vědět.</p>` };
  return null;
}
export function signedMail(lang, { name, when, list, doneCount, waitNames, coNames }) {
  if (lang === 'sk') return { subject: 'Podpísané dokumenty — CarAdvance', html: `<p>${hello(lang, name)}</p><p>ďakujeme, nasledujúce dokumenty ste elektronicky podpísali (${when}):</p>${list}`
    + (doneCount ? `<p>${waitNames ? 'Už konečné' : 'Podpísané'} vyhotovenia (PDF s protokolom o podpise) posielame v prílohe — uschovajte si ich, prosím.</p>` : '')
    + (waitNames ? `<p>Dvojjazyčné zmluvy (${waitNames}) teraz podpíše aj ${coNames}; vyhotovenia podpísané oboma stranami vám potom pošleme e-mailom.</p>` : '') + `<p>${regards(lang)}</p>` };
  if (lang === 'cs') return { subject: 'Podepsané dokumenty — CarAdvance', html: `<p>${hello(lang, name)}</p><p>děkujeme, následující dokumenty jste elektronicky podepsali (${when}):</p>${list}`
    + (doneCount ? `<p>${waitNames ? 'Již konečná' : 'Podepsaná'} vyhotovení (PDF s protokolem o podpisu) zasíláme v příloze — uschovejte si je prosím.</p>` : '')
    + (waitNames ? `<p>Dvojjazyčné smlouvy (${waitNames}) nyní podepíše i ${coNames}; vyhotovení podepsaná oběma stranami vám poté zašleme e-mailem.</p>` : '') + `<p>${regards(lang)}</p>` };
  return null;
}
export function bothSignedMail(lang, { name, partner, when, list }) {
  if (lang === 'sk') return { subject: 'Dokumenty podpísané oboma stranami — CarAdvance', html: `<p>${hello(lang, name)}</p><p>spoločnosť ${partner} tiež podpísala nasledujúce dokumenty (${when}):</p>${list}<p>Konečné vyhotovenia podpísané oboma stranami (PDF s protokolmi o podpise) posielame v prílohe — uschovajte si ich, prosím.</p><p>${regards(lang)}</p>` };
  if (lang === 'cs') return { subject: 'Dokumenty podepsané oběma stranami — CarAdvance', html: `<p>${hello(lang, name)}</p><p>společnost ${partner} také podepsala následující dokumenty (${when}):</p>${list}<p>Konečná vyhotovení podepsaná oběma stranami (PDF s protokoly o podpisu) zasíláme v příloze — uschovejte si je prosím.</p><p>${regards(lang)}</p>` };
  return null;
}

/* ---------- aláírási nyilatkozat és tanúsítvány (az aláírt PDF-ben is) ---------- */
export const SIGN_STATEMENT_SK = 'Uvedený dokument (dokumenty) som si prečítal(a), porozumel(a) som jeho obsahu a svojím elektronickým podpisom ho prijímam. Beriem na vedomie, že údaje o podpise (meno, e-mailová adresa, čas, IP adresa, zariadenie) sa zaznamenávajú na preukázanie pravosti.';
export const SIGN_STATEMENT_CS = 'Uvedený dokument (dokumenty) jsem si přečetl(a), porozuměl(a) jsem jeho obsahu a svým elektronickým podpisem jej přijímám. Beru na vědomí, že údaje o podpisu (jméno, e-mailová adresa, čas, IP adresa, zařízení) se zaznamenávají k prokázání pravosti.';
export const statementOf = (lang) => (lang === 'sk' ? SIGN_STATEMENT_SK : lang === 'cs' ? SIGN_STATEMENT_CS : null);
// a tanúsítvány sorainak címkéi (hu kulcs → sk / cs); a PDF-ben „helyi / magyar” formában jelennek meg
export const CERT_LB = {
  'Dokumentum': { sk: 'Dokument', cs: 'Dokument' },
  'Dokumentum-azonosító (tartalom SHA-256)': { sk: 'ID dokumentu (obsah SHA-256)', cs: 'ID dokumentu (obsah SHA-256)' },
  'Aláírási kérelem': { sk: 'Žiadosť o podpis', cs: 'Žádost o podpis' },
  'Aláíró (nyilvántartott)': { sk: 'Podpisujúci (evidovaný)', cs: 'Podepisující (evidovaný)' },
  'Aláíró által begépelt név': { sk: 'Meno zadané podpisujúcim', cs: 'Jméno zadané podepisujícím' },
  'E-mail cím': { sk: 'E-mailová adresa', cs: 'E-mailová adresa' },
  'Azonosítás': { sk: 'Overenie', cs: 'Ověření' },
  'Aláírás időpontja': { sk: 'Čas podpisu', cs: 'Čas podpisu' },
  'IP-cím': { sk: 'IP adresa', cs: 'IP adresa' },
  'Eszköz / böngésző': { sk: 'Zariadenie / prehliadač', cs: 'Zařízení / prohlížeč' },
  'Aláíráskép SHA-256': { sk: 'Obrázok podpisu SHA-256', cs: 'Obrázek podpisu SHA-256' }
};
export const certIdent = (lang) => (lang === 'sk' ? 'jednorazový kód (OTP) zaslaný na e-mailovú adresu overený' : lang === 'cs' ? 'jednorázový kód (OTP) zaslaný na e-mailovou adresu ověřen' : null);

/* ---------- ajánlat PDF-ek (eladási + bérleti) — 2026-11-09, Marc ---------- */
// A HU szöveg az alapértelmezés (docpdf.js); SK / CZ esetén ezek a feliratok mennek a PDF-be.
const PDF_CO = {
  sk: { co: 'Caradvance GmbH · Mr. Job SK s.r.o.', web: 'www.caradvance.sk', addr: 'Cesta na Senec 2/A, 821 04 Bratislava' },
  cs: { co: 'Caradvance GmbH · Mr. Job SK s.r.o.', web: 'www.caradvance.cz', addr: 'Cesta na Senec 2/A, 821 04 Bratislava' }
};
export const PDF_T = {
  sk: {
    offer: 'Ponuka', offerCar: 'Ponuka auta', madeFor: (c) => 'Pripravené pre: ' + c, price: 'Cena ponuky', code: 'Konfiguračný kód: ', main: 'Hlavné údaje',
    eqHi: 'Výbava — hlavné položky', eq: 'Výbava', eqMore: 'Ďalšia výbava', contactCol: 'Kontakt', web: 'Web', number: 'Číslo', date: 'Dátum', person: 'Kontaktná osoba',
    closing: (c) => 'Ponuka bola pripravená na základe uvedenej konfigurácie; obrázky sú ilustračné. Ponuku môžete prijať alebo požiadať o zmenu tlačidlami v e-maile.' + (c && c.name ? ' Kontaktná osoba: **' + c.name + '**' + (c.email ? ' · ' + c.email : '') + (c.phone ? ' · ' + c.phone : '') : ''),
    rentTitle: 'PONUKA PRENÁJMU', offerNo: 'Číslo ponuky', dateL: 'Dátum', lessor: 'Prenajímateľ: ', to: 'Adresát ponuky: ', monthly: 'MESAČNÉ NÁJOMNÉ (S DPH)',
    secVeh: 'Údaje o vozidle', secEq: 'Výbava', secTerms: 'Podmienky prenájmu', rentDoc: 'Ponuka prenájmu — ',
    ...PDF_CO.sk, phoneL: 'Tel.', mailL: 'E-mail'
  },
  cs: {
    offer: 'Nabídka', offerCar: 'Nabídka vozu', madeFor: (c) => 'Připraveno pro: ' + c, price: 'Nabídková cena', code: 'Konfigurační kód: ', main: 'Hlavní údaje',
    eqHi: 'Výbava — hlavní položky', eq: 'Výbava', eqMore: 'Další výbava', contactCol: 'Kontakt', web: 'Web', number: 'Číslo', date: 'Datum', person: 'Kontaktní osoba',
    closing: (c) => 'Nabídka byla připravena na základě uvedené konfigurace; obrázky jsou ilustrační. Nabídku můžete přijmout nebo požádat o změnu tlačítky v e-mailu.' + (c && c.name ? ' Kontaktní osoba: **' + c.name + '**' + (c.email ? ' · ' + c.email : '') + (c.phone ? ' · ' + c.phone : '') : ''),
    rentTitle: 'NABÍDKA PRONÁJMU', offerNo: 'Číslo nabídky', dateL: 'Datum', lessor: 'Pronajímatel: ', to: 'Adresát nabídky: ', monthly: 'MĚSÍČNÍ NÁJEMNÉ (S DPH)',
    secVeh: 'Údaje o vozidle', secEq: 'Výbava', secTerms: 'Podmínky pronájmu', rentDoc: 'Nabídka pronájmu — ',
    ...PDF_CO.cs, phoneL: 'Tel.', mailL: 'E-mail'
  }
};
/* bérleti ajánlat: a builder (belso-crm) szövegei */
const MON = { január: 0, február: 1, március: 2, április: 3, május: 4, június: 5, július: 6, augusztus: 7, szeptember: 8, október: 9, november: 10, december: 11 };
const MON_L = { sk: ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'], cs: ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'] };
export const RENT_T = {
  sk: {
    newCar: 'Nové vozidlo', dePlate: 'Nemecké EČV', km: 'Stav km', variant: 'Verzia', fuel: 'Palivo', gear: 'Prevodovka', cond: 'Stav', plate: 'EČV',
    isNew: 'Nové', used: 'Ojazdené', de: 'Nemecké', hu: 'Maďarské', per: '/ mes.', net: (n) => 'bez DPH ' + n + ' € + 19 % DPH',
    term: 'Doba prenájmu', months: (m) => m + (m >= 5 ? ' mesiacov' : m >= 2 ? ' mesiace' : ' mesiac'), start: 'začiatok: ', kmL: 'Limit km', monthly: 'mesačne', dep: 'Kaucia',
    make: 'Značka / model', body: 'Kategória', color: 'Farba (výrobná)', avail: 'Dostupnosť', rentStart: 'Začiatok prenájmu', deliv: 'Poplatok za dopravu', once: ' (jednorazovo)',
    tTerm: (m, s, e) => `Doba prenájmu: **${m}**${s ? ' (začiatok: ' + s + (e ? ', koniec: ' + e : '') + ')' : ''}.`,
    tRent: (p, net) => `Mesačné nájomné: **${p} s DPH**${net ? ' (' + net + ')' : ''}, splatné mesačne vopred, vždy na začiatku mesiaca.`,
    tDep: (d) => `Kaucia: **${d}**, splatná pri začiatku prenájmu; vracia sa po vrátení nepoškodeného vozidla.`,
    tDeliv: (d) => `Poplatok za dopravu: **${d}** (jednorazovo), splatný pri odovzdaní vozidla.`,
    tKm: (k, tot, over) => `Mesačný limit kilometrov: **${k} km / mes.**${tot ? ' (za celú dobu prenájmu ' + tot + ' km)' : ''}${over ? '; nad limit sa účtuje **' + over + '**' : ''}.`,
    tNew: (de) => `Vozidlo sa odovzdáva nové, s 0 km${de ? ', **s nemeckým EČV**' : ''}.`,
    tValid: (d) => `Platnosť ponuky: **${d}**.`,
    cats: { 'Külső felszereltség': 'Exteriér', 'Komfort / belső tér': 'Komfort / interiér', 'Biztonság / asszisztensek': 'Bezpečnosť / asistenti', 'Sport': 'Šport', 'Connectivity / egyéb': 'Konektivita / ostatné' },
    file: 'Ponuka_prenajmu_', fileSale: 'CarAdvance_ponuka_', locale: 'sk-SK', now: 'Ihneď'
  },
  cs: {
    newCar: 'Nový vůz', dePlate: 'Německá SPZ', km: 'Stav km', variant: 'Verze', fuel: 'Palivo', gear: 'Převodovka', cond: 'Stav', plate: 'SPZ',
    isNew: 'Nový', used: 'Ojetý', de: 'Německá', hu: 'Maďarská', per: '/ měs.', net: (n) => 'bez DPH ' + n + ' € + 19 % DPH',
    term: 'Doba pronájmu', months: (m) => m + (m >= 5 ? ' měsíců' : m >= 2 ? ' měsíce' : ' měsíc'), start: 'začátek: ', kmL: 'Limit km', monthly: 'měsíčně', dep: 'Kauce',
    make: 'Značka / model', body: 'Kategorie', color: 'Barva (výrobní)', avail: 'Dostupnost', rentStart: 'Začátek pronájmu', deliv: 'Poplatek za dopravu', once: ' (jednorázově)',
    tTerm: (m, s, e) => `Doba pronájmu: **${m}**${s ? ' (začátek: ' + s + (e ? ', konec: ' + e : '') + ')' : ''}.`,
    tRent: (p, net) => `Měsíční nájemné: **${p} s DPH**${net ? ' (' + net + ')' : ''}, splatné měsíčně předem, vždy na začátku měsíce.`,
    tDep: (d) => `Kauce: **${d}**, splatná při zahájení pronájmu; vrací se po vrácení nepoškozeného vozu.`,
    tDeliv: (d) => `Poplatek za dopravu: **${d}** (jednorázově), splatný při předání vozu.`,
    tKm: (k, tot, over) => `Měsíční limit kilometrů: **${k} km / měs.**${tot ? ' (za celou dobu pronájmu ' + tot + ' km)' : ''}${over ? '; nad limit se účtuje **' + over + '**' : ''}.`,
    tNew: (de) => `Vůz se předává nový, s 0 km${de ? ', **s německou SPZ**' : ''}.`,
    tValid: (d) => `Platnost nabídky: **${d}**.`,
    cats: { 'Külső felszereltség': 'Exteriér', 'Komfort / belső tér': 'Komfort / interiér', 'Biztonság / asszisztensek': 'Bezpečnost / asistenti', 'Sport': 'Sport', 'Connectivity / egyéb': 'Konektivita / ostatní' },
    file: 'Nabidka_pronajmu_', fileSale: 'CarAdvance_nabidka_', locale: 'cs-CZ', now: 'Ihned'
  }
};
/** Elérhetőség (pl. „Azonnal”, „December”, „2026. december”) a piac nyelvén. */
export function availL(lang, v) {
  const s = String(v || '').trim(); const T = RENT_T[lang]; if (!T || !s) return s;
  if (/^azonnal/i.test(s)) return T.now;
  return s.replace(/[a-záéíóöőúüű]+/gi, (w) => { const k = MON[w.toLowerCase()]; return k == null ? w : MON_L[lang][k]; });
}
/** Teljesítmény „LE” → „k” (kone / koně). */
export const powerL = (lang, v) => (lang && lang !== 'hu' && v ? String(v).replace(/\bLE\b/g, 'k') : v);
