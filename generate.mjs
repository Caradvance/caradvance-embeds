#!/usr/bin/env node
/*
 * CarAdvance static site generator (SEO-native).
 * Reads the Google Sheet (gviz CSV) -> writes real, pre-rendered HTML:
 *   /index.html                     (home: hero + stats + featured)
 *   /autoink/index.html             (catalog: every active car in HTML)
 *   /auto/<slug>/index.html         (one real page per car + schema.org Vehicle)
 *   /sitemap.xml, /robots.txt
 *
 * Design tokens + card style match the approved live design.
 * All content is baked into the HTML (no iframes, no client-fetch for content) => strong SEO.
 * A small client script only refreshes the EUR->HUF rate; prices already render server-side.
 *
 * Usage:
 *   node generate.mjs                 # fetch live sheet, write to ./build
 *   node generate.mjs --csv file.csv  # use a local CSV (offline test)
 *   OUT=dist node generate.mjs        # change output dir
 */
import { promises as fs } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------- config
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y/gviz/tq?tqx=out:csv";
// Absolute base used for <link rel=canonical>, OG tags and sitemap.
// After you point caradvance.hu at GitHub Pages, change this to "https://caradvance.hu".
const SITE_BASE = (process.env.SITE_BASE || "https://caradvance.hu").replace(/\/$/, "");
const OUT = process.env.OUT || "build";
const BRAND = "CarAdvance";
const CONTACT_EMAIL = "info@caradvance.hu";
const DEFAULT_RATE = 402; // EUR->HUF fallback if live rate can't be fetched at build time

// --------------------------------------------------------------- helpers
const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const attr = (s) => esc(s);
const slugify = (m) =>
  String(m).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const nEur = (v) => Number(String(v == null ? "" : v).replace(/[^\d.]/g, "")) || 0;
const fmtHUF = (v) => v.toLocaleString("hu-HU") + " Ft";
const fmtEUR = (v) => v.toLocaleString("hu-HU") + " €";

function driveImg(u) {
  u = String(u || "").trim();
  if (!u) return "";
  let m = u.match(/\/d\/([-\w]{20,})/) || u.match(/[?&]id=([-\w]{20,})/);
  if (m) return "https://lh3.googleusercontent.com/d/" + m[1] + "=w1600";
  if (/^[-\w]{25,}$/.test(u)) return "https://lh3.googleusercontent.com/d/" + u + "=w1600";
  return u;
}
// Chosen "hero" main photo per car (3/4 side profile). Keyed by `kulcs`
// (mobile.de car key) -> a distinctive substring of the chosen image URL.
const MAIN_PICK = {"bmw-x7-m50d-m-sport-pro-22-b-w": "fe568239", "bmw-x2-xdrive20d-m-sport-pro-20-h-k": "0ec9c853", "bmw-x6-m60i-xdrive-full-option-carbon-m-sitze": "b71ffd45", "bmw-i5-m60-xdrive-i5m60-xdrive": "c2e8e425", "bmw-x5-xdrive30d": "905fe271", "bmw-x6-xdrive30d-m-sport-pro": "c6b0483d", "bmw-x5-xdrive30d-m-sport-pro-luft-22": "7cc9ba26", "porsche-911-carrera-4-gts-approved-3-jahre-voll-leder": "44ce52eb", "bmw-x7-xdrive40d-m-sport-pro-23-luft-h-k": "64574841", "bmw-x5-xdrive40d-m-sport-pro-full-option": "a3dc7592", "bmw-x6-xdrive30d-m-sport-pro-individual-22": "921b1d29", "bmw-x6-xdrive30d-m-sport-pro-luft-22": "a05d3035", "bmw-x5-xdrive30d-m-sport-pro-22-luft": "db6ae02a", "bmw-x5-xdrive30d-m-sport-pro-22": "c32a177b", "bmw-x5-m-competition-21-22": "4783b10e", "porsche-911-carrera-gts-approved-3-jahre-voll-leder": "7544b234", "bmw-x6-xdrive30d-m-sport-pro-22-individual": "87861b10", "bmw-x7-xdrive40d-m-sport-pro-22": "2ad119b8", "porsche-panamera-gts-standheizung-allradlenkung-ptv-pano": "c25bffa2"};
function galleryOf(c) {
  const list = String(c.galeria || "")
    .split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).map(driveImg);
  const main = driveImg(c.kep_url) || list[0] || "";
  const all = [];
  if (main) all.push(main);
  for (const g of list) if (g && !all.includes(g)) all.push(g);
  const pick = MAIN_PICK[slugify(c.modell)];
  if (pick) {
    const i = all.findIndex((u) => u.includes(pick));
    if (i > 0) { const [p] = all.splice(i, 1); all.unshift(p); }
  } else if (all.length > 1 && /classistatic|mo-prod/.test(all[0])) {
    // Same system for every mobile.de-sourced car: the 3/4 side-profile shot is
    // reliably the 2nd photo, so promote it to the main image automatically.
    const [p] = all.splice(1, 1); all.unshift(p);
  }
  return all;
}
const DE2HU = {"3.sitzreihe": "Harmadik üléssor","abdeckkappen außenspiegel m carbon": "M Carbon tükörborítások","ablage-paket": "Tárolórekesz-csomag","abstandsregeltempostat": "Adaptív tempomat","adaptive sportsitze plus (18-wege, elektrisch) mit memory-paket": "Adaptív sportülések Plus (18-utas, elektromos, memóriával)","adaptives fahrwerk m-technic": "M-Technic adaptív futómű","adaptives fahrwerk professional": "Adaptív futómű (Professional)","adaptives kurvenlicht": "Adaptív kanyarfény","aerodynamik-paket": "Aerodinamikai csomag","aerodynamik-paket m-technic": "M-Technic aerodinamikai csomag","airbag beifahrerseite": "Utasoldali légzsák","airbag beifahrerseite abschaltbar": "Kikapcsolható utasoldali légzsák","airbag fahrer-/beifahrerseite": "Vezető- és utasoldali légzsák","airbag fahrerseite": "Vezetőoldali légzsák","aktivsitze vorn": "Aktív első ülések","akustischer fußgängerschutz (außensound)": "Akusztikus gyalogosvédelem (külső hang)","alarmanlage": "Riasztó","alpinweiß-lackierung (uni)": "Alpesi fehér fényezés (uni)","ambiente-beleuchtung": "Ambient világítás","ambiente-beleuchtung dachhimmel": "Ambient tetőkárpit-világítás","anhänger-stabilisierungs-programm (asl)": "Utánfutó-stabilizáló program (ASL)","anhängerkupplung (kugelkopf schwenkbar)": "Vonóhorog (kihajtható)","anti-blockier-system (abs)": "Blokkolásgátló (ABS)","anti-diebstahl-recorder": "Lopásgátló rögzítő","antriebsart: allradantrieb": "Összkerékhajtás","antriebsart: xdrive (allrad)": "Összkerékhajtás (xDrive)","audio-navigationssystem": "Audio-navigációs rendszer","ausstattungs-paket: connected professional": "Connected Professional csomag","ausstattungs-paket: connected teaser": "Connected Teaser csomag","automatisch abblendende innen-/außenspiegel mit integriertem regensensor": "Öntompuló bel- és külső tükrök esőszenzorral","außenausstattung: shadow-line": "Shadow-Line csomag","außenausstattung: shadow-line hochglanz": "Shadow-Line fényes csomag","außenausstattung: shadow-line hochglanz (erweiterter umfang)": "Shadow-Line fényes csomag (bővített)","außenspiegel unterschale lackiert": "Fényezett tükör-alsóborítás","außenspiegel wagenfarbe": "Karosszériaszínű tükrök","außenspiegel asphärisch, links": "Aszférikus bal tükör","außenspiegel elektr. anklappbar": "Elektromosan behajtható tükrök","außenspiegel elektr. anklappbar, alle spiegel mit abblendautomatik": "Elektromosan behajtható, öntompuló tükrök","außenspiegel elektr. heiz- und anklappbar": "Elektromos, fűthető, behajtható tükrök","außenspiegel elektr. verstell- und heizbar": "Elektromosan állítható, fűthető tükrök","außenspiegel elektr. verstell- und heizbar, beide": "Elektromosan állítható, fűthető tükrök (mindkét oldal)","außenspiegel lackiert in exterieurfarbe - porsche exclusive manufaktur": "Karosszériaszínű tükrök (Porsche Exclusive Manufaktur)","außenspiegel mit abblendautomatik, links": "Öntompuló bal tükör","außenspiegel mit bordsteinautomatik, rechts": "Szegély-automatika a jobb tükörön","außenspiegel-paket (erweitert)": "Tükör-csomag (bővített)","bmw curved display": "BMW Curved Display","bmw display-key": "BMW Display-kulcs","bmw drive recorder (dashcam)": "BMW Drive Recorder (fedélzeti kamera)","bmw indi. erw. led. schwarz": "BMW Individual bővített LED (fekete)","bmw iconicsounds electric (soundgenerator)": "BMW IconicSounds Electric (hanggenerátor)","bmw individuallackierung dravit-grau metallic": "BMW Individual Dravit-szürke metálfényezés","bmw live cockpit plus": "BMW Live Cockpit Plus","bmw live cockpit professional": "BMW Live Cockpit Professional","bmw-sportsitze vorn": "BMW első sportülések","bmw-sportsitze vorn, elektr. verstellbar (links mit memory)": "BMW elektromos első sportülések (bal memóriával)","bedienelemente galvanisiert": "Galvanizált kezelőelemek","beleuchtung": "Világítás","belüftung": "Szellőzés","blinkleuchte in außenspiegel integriert": "Tükörbe épített irányjelző","blinkleuchten led": "LED irányjelzők","bordcomputer": "Fedélzeti számítógép","bremsanlage: m sportbremsen (bremssättel lackiert)": "M sportfék (fényezett nyergek)","bremsanlage: m sportbremsen (bremssättel lackiert, blau hochglänzend)": "M sportfék (kék nyergek)","bremsanlage: m sportbremsen (bremssättel lackiert, rot hochglänzend)": "M sportfék (piros nyergek)","bremsanlage: m sportbremsen (bremssättel lackiert, schwarz hochglänzend)": "M sportfék (fekete nyergek)","bremsassistent": "Vészfék-asszisztens","bremsen": "Fékek","bremsenergierückgewinnung (rekuperationssystem)": "Fékenergia-visszanyerés","bremssättel in schwarz (hochglanz) - porsche exclusive manufaktur": "Fekete féknyergek (Porsche Exclusive Manufaktur)","comfort-paket": "Komfort csomag","connect plus (bluetooth, apple carplay, wlan, vehicle-tracking-system)": "Connect Plus (Bluetooth, Apple CarPlay, WiFi, járműkövetés)","dab-tuner (radioempfang digital)": "DAB digitális rádió","dachhimmel alcantara / anthrazit": "Alcantara tetőkárpit (antracit)","dachhimmel anthrazit": "Antracit tetőkárpit","dachhimmel sowie verkleidung a-/b-/c-säule in race-tex": "Race-Tex tetőkárpit és oszlopborítás","dachreling aluminium satiniert": "Szatinált alumínium tetősín","dachreling hochglanz shadow-line": "Fényes Shadow-Line tetősín","diebstahl-warnanlage": "Riasztó","diebstahl-warnanlage mit innenraumüberwachung": "Riasztó belső térfigyeléssel","diebstahlsicherung für räder (felgenschlösser)": "Kerék-lopásgátló (felnizár)","doppelkupplungsgetriebe": "Duplakuplungos váltó","drehzahlmesser": "Fordulatszámmérő","durchladeeinrichtung (mittelarmlehne hinten)": "Átrakodó nyílás (hátsó könyöklő)","dynamische bremsleuchte": "Dinamikus féklámpa","dynamische stabilitäts-control (dsc)": "Menetstabilizáló (DSC)","dynamische stabilitäts-control (dsc) mit erweiterter umfang": "Menetstabilizáló (DSC, bővített)","dynamische tractions control (dtc)": "Kipörgésgátló (DTC)","einschaltautomatik für fahrlicht": "Automatikus világításkapcsolás","einstiegsblenden mit modellbezeichnung (aluminium schwarz)": "Beszállólécek modellfelirattal (fekete alumínium)","einstiegsleisten mit schriftzug bmw (beleuchtet)": "BMW feliratos beszállólécek (világító)","einstiegsleisten mit schriftzug bmw individual": "BMW Individual feliratos beszállólécek","elektrisch anklappbare außenspiegel inkl. türvorfeldbeleuchtung": "Elektromosan behajtható tükrök beszállásvilágítással","elektrisches schiebe-/hubdach (glas)": "Elektromos üveg tolótető","elektromotor 192 kw (system: 442 kw) va": "Első elektromotor 192 kW (rendszer: 442 kW)","elektromotor 250 kw (system: 442 kw) ha": "Hátsó elektromotor 250 kW (rendszer: 442 kW)","elektromotor 442 kw (cont. 127 kw, dual-elektromotor)": "Dupla elektromotor 442 kW","erste hilfe-kasten / verbandkasten": "Elsősegélycsomag","exclusive design heckleuchten": "Exclusive Design hátsó lámpák","exclusive design tankdeckel": "Exclusive Design tanksapka","exterieurumfänge iconic glow": "Iconic Glow külső elemek","fahrassistenz-system: active guard (bremsassistent)": "Active Guard vészfék-asszisztens","fahrassistenz-system: ampel-erkennung": "Jelzőlámpa-felismerés","fahrassistenz-system: anfahr-assistent": "Elindulás-asszisztens","fahrassistenz-system: anhängerassistent": "Utánfutó-asszisztens","fahrassistenz-system: auffahrwarnsystem mit bremsfunktion": "Ütközés-figyelmeztetés vészfékkel","fahrassistenz-system: aufmerksamkeits-assistent": "Figyelemfigyelő asszisztens","fahrassistenz-system: ausweich-assistent": "Kitérési asszisztens","fahrassistenz-system: autobahnassistent": "Autópálya-asszisztens","fahrassistenz-system: bmw gestiksteuerung": "BMW gesztusvezérlés","fahrassistenz-system: bmw natural interactive": "BMW Natural Interactive vezérlés","fahrassistenz-system: bmw night vision": "BMW éjjellátó (Night Vision)","fahrassistenz-system: berganfahr-assistent (hill-holder)": "Hegymeneti elindulás-asszisztens","fahrassistenz-system: driving assistant": "Driving Assistant vezetőtámogató","fahrassistenz-system: driving assistant plus": "Driving Assistant Plus","fahrassistenz-system: driving assistant professional": "Driving Assistant Professional","fahrassistenz-system: einparkhilfe seite": "Oldalsó parkolóradar","fahrassistenz-system: fahrerlebnisschalter": "Menetmód-választó","fahrassistenz-system: falschfahrwarnung": "Behajtási irány figyelmeztetés","fahrassistenz-system: fernlichtassistent": "Távolsági fény asszisztens","fahrassistenz-system: frontkollisionswarnung": "Frontális ütközés-figyelmeztetés","fahrassistenz-system: heckaufprall-vermeidung (prävention heckkollision)": "Hátsó ütközés megelőzése","fahrassistenz-system: kreuzungs-assistent": "Kereszteződés-asszisztens","fahrassistenz-system: lenk- und spurführungs-assistent": "Kormányzás- és sávtartó asszisztens","fahrassistenz-system: manövrierassistent": "Manőverező asszisztens","fahrassistenz-system: park-assistent": "Parkoló-asszisztens","fahrassistenz-system: park-assistent vorn und hinten": "Parkoló-asszisztens (elöl-hátul)","fahrassistenz-system: parken anfahrüberwachung": "Elindulás-figyelő parkoláskor","fahrassistenz-system: parken ferngesteuert (mit display-key)": "Távvezérelt parkolás (Display-kulccsal)","fahrassistenz-system: performance control": "Performance Control","fahrassistenz-system: post-crash-system (pc-ibrake)": "Ütközés utáni fékrendszer (PC-iBrake)","fahrassistenz-system: querverkehrs-assistent": "Keresztforgalom-asszisztens","fahrassistenz-system: rückfahr-assistent": "Tolató-asszisztens","fahrassistenz-system: rückfahr-assistent professional": "Tolató-asszisztens (Professional)","fahrassistenz-system: rückfahrhilfe notbremsfunktion (active pdc)": "Tolatási vészfék (Active PDC)","fahrassistenz-system: speed-limit-anzeige": "Sebességkorlát-kijelző","fahrassistenz-system: spurwechsel-warnsystem": "Sávváltás-figyelmeztető","fahrassistenz-system: spurwechselassistent": "Sávváltó-asszisztens","fahrassistenz-system: verkehrszeichenerkennung": "Közlekedésitábla-felismerés","fahrassistenz-system: verkehrszeichenerkennung mit speed limit-assistent": "Táblafelismerés sebességkorlát-asszisztenssel","fahrassistenz-system: aktiver spurhalteassistent": "Aktív sávtartó asszisztens","fahrwerk tiefergelegt": "Ültetett futómű","fahrwerkssystem: executive drive pro (wankstabilisierung)": "Executive Drive Pro (aktív dőlésstabilizálás)","fensterheber elektrisch": "Elektromos ablakemelők","fensterheber elektrisch vorn + hinten": "Elektromos ablakemelők (elöl-hátul)","fensterzierleisten schwarz": "Fekete ablakkeret-díszlécek","fernentriegelung heckklappe": "Távnyitású csomagtérajtó","fond-entertainment-system professional": "Hátsó szórakoztatórendszer (Professional)","freisprecheinrichtung bluetooth mit usb-/audio-schnittstelle": "Bluetooth kihangosító USB-/audio-csatlakozóval","freisprecheinrichtung bluetooth mit erweiterte smartphone-anbindung": "Bluetooth kihangosító bővített telefoncsatlakozással","frontkamera": "Első kamera","frontscheibe (ausführung: klimakomfort)": "Klímakomfort szélvédő","fußmatten": "Szőnyegek","fußmatten velours": "Velúr szőnyegek","fußraumbeleuchtung hinten": "Hátsó lábtérvilágítás","fußraumbeleuchtung vorn": "Első lábtérvilágítás","fzg. ohne modell-schriftzug": "Modellfelirat nélkül","gepäckraum-abtrennung (netz)": "Csomagtér-elválasztó háló","gepäckraum-paket": "Csomagtér-csomag","gepäckraumabdeckung / rollo": "Csomagtérroló","gepäckraumbeleuchtung": "Csomagtérvilágítás","geschwindigkeits-begrenzeranlage (speed limit device)": "Sebességkorlátozó","geschwindigkeits-regelanlage mit bremsfunktion": "Tempomat fékfunkcióval","geschwindigkeits-regelanlage, aktiv mit stop&go-funktion": "Adaptív tempomat Stop&Go-val","getriebe 7-gang - doppelkupplungsgetriebe mit steptronic und schaltwippen": "7 fokozatú duplakuplungos váltó váltófülekkel","getriebe 8-gang - doppelkupplungsgetriebe (pdk)": "8 fokozatú duplakuplungos váltó (PDK)","getriebe sport-automatic - mit steptronic (8-stufen)": "8 fokozatú Steptronic Sport automata","getriebe für elektrofahrzeug": "Elektromos hajtáslánc","getränkehalter": "Pohártartó","getränkehalter mit kühlfunktion / wärmefunktion": "Hűthető/fűthető pohártartó","head-up-display": "Head-up kijelző","head-up-display full color": "Színes head-up kijelző","heckklappe zweiteilig": "Kétrészes csomagtérajtó","heckklappenbetätigung automatisch": "Elektromos csomagtérajtó","heckleuchten led": "LED hátsó lámpák","heckscheibe heizbar": "Fűthető hátsó szélvédő","heckspoiler": "Hátsó légterelő","heckspoiler (m carbon)": "M Carbon hátsó légterelő","heckspoiler (m-technic)": "M-Technic hátsó légterelő","heckunterteil sport design lackiert": "Sport Design fényezett hátsó alsó rész","hifi-lautsprechersystem": "HiFi hangrendszer","homelink® (frei programmierbarer garagentoröffner)": "HomeLink garázskapu-nyitó","induktionsladeschale für smartphone (wireless charging)": "Vezeték nélküli telefontöltő","innenausstattung": "Belső kárpitozás","innenausstattung: edelholz fineline": "Fineline nemesfa díszbetét","innenausstattung: glas-applikationen (craftedclarity) für bedienelemente": "CraftedClarity üveg díszbetétek","innenausstattung: interieurleisten alu rhombicle mit akzentleiste": "Alu Rhombicle díszlécek akcentcsíkkal","innenausstattung: interieurleisten carbon": "Carbon díszlécek","innenausstattung: interieurleisten edelholz fineline mit metalleffekt": "Fineline nemesfa díszlécek fémeffekttel","innenausstattung: interieurleisten m dunkel-silber / aluminium rhombicle": "M sötét-ezüst / alumínium Rhombicle díszlécek","innenausstattung: interieurleisten, schwarz hochglänzend": "Fényes fekete díszlécek","innenausstattung: microfaser race-tex": "Race-Tex mikroszálas kárpit","innenraumfilter: aktivkohlefilter (geruchsfilter)": "Aktívszenes pollenszűrő","innenspiegel mit abblendautomatik": "Öntompuló belső tükör","innenspiegel rahmenlos": "Keret nélküli belső tükör","innovations-paket": "Innovációs csomag","instrumententafel luxury": "Luxury műszerfal","instrumententafel sensatec": "Sensatec műszerfal","instrumententafel lederbezogen": "Bőrbevonatú műszerfal","interieur-paket carbon matt": "Matt carbon belső csomag","ionisator": "Ionizátor","isofix-aufnahmen für kindersitz an beifahrersitz": "Isofix rögzítés az utasülésen","isofix-aufnahmen für kindersitz an rücksitz": "Isofix rögzítés a hátsó ülésen","karosserie": "Karosszéria","kennzeichenbeleuchtung led": "LED rendszámtábla-világítás","keyless drive": "Kulcs nélküli indítás","klimaautomatik 2-zonen": "2 zónás automata klíma","klimaautomatik 2-zonen mit autom. umluft-control, erweiterter umfang": "2 zónás automata klíma (bővített)","klimaautomatik 3-zonen mit autom. umluft-control": "3 zónás automata klíma","klimaautomatik 4-zonen mit autom. umluft-control": "4 zónás automata klíma","klimaautomatik 5-zonen mit autom. umluft-control": "5 zónás automata klíma","knieairbag beifahrerseite": "Utasoldali térdlégzsák","knieairbag fahrerseite": "Vezetőoldali térdlégzsák","komfort": "Komfort","komfortsitze vorn elektr. verstellbar (links mit memory)": "Elektromos komfortülések elöl (bal memóriával)","komfortsitze vorn elektr. verstellbar (mit memory)": "Elektromos komfortülések elöl (memóriával)","komfortzugang (ehemals porsche entry & drive)": "Kulcs nélküli komfortbelépő","komfortzugang (öffnungs- und schließsystem)": "Komfortbelépő (kulcs nélküli)","kopf-airbag-system porsche side impact protection system (posip)": "Fej-légzsák rendszer (POSIP)","kopf-airbag-system hinten": "Hátsó fejlégzsák","kopf-airbag-system vorn": "Első fejlégzsák","kopfstützen hinten klappbar": "Lehajtható hátsó fejtámlák","kraftstofftank: vergrößert": "Nagyobb üzemanyagtank","kühlergrill beleuchtet (iconic glow)": "Világító hűtőrács (Iconic Glow)","led-lichtelemente": "LED fényelemek","led-türprojektoren „porsche“ schriftzug": "PORSCHE feliratos LED ajtóvetítők","lm-felgen": "Könnyűfém felnik","lm-felgen 8x20 (v-speiche 873 m, bicolor)": "Könnyűfém felnik 8x20 (873 M, kétszínű)","lm-felgen vorn/hinten: 8x19 / 8,5x19 (doppelspeiche 995 m, jetblack)": "Könnyűfém felnik 8x19/8,5x19 (995 M, Jetblack)","lm-felgen vorn/hinten: 9,5x22 / 10,5x22 (doppelspeiche 742 m, jet black)": "Könnyűfém felnik 9,5x22/10,5x22 (742 M, Jet Black)","ladekabel (5,0 m) mit typ 2-stecker (mode 3, 22 kw)": "Töltőkábel (5 m, Type 2, 22 kW)","ladekabel wechselstrom / gleichstrom (32 a / 230 v)": "Töltőkábel (AC/DC, 32 A / 230 V)","laderaumboden herausnehmbar": "Kivehető csomagtérfenék","leder": "Bőr kárpit","lederpaket 930": "Bőrcsomag 930","lendenwirbelstütze sitz vorn links": "Deréktámasz a bal első ülésen","lendenwirbelstütze sitz vorn links und rechts": "Deréktámasz az első üléseken","lendenwirbelstütze sitz vorn links und rechts, elektr. verstellbar": "Elektromos deréktámasz az első üléseken","lenkrad (leder) mit multifunktion m-technic": "M-Technic multifunkciós bőrkormány","lenkrad (sport/leder m-technic) mit multifunktion": "M bőr sportkormány, multifunkciós","lenkrad heizbar": "Fűthető kormány","lenksäule (lenkrad) elektr. verstellbar und fahrerairbag": "Elektromosan állítható kormányoszlop","lenksäule (lenkrad) mechan. verstellbar": "Mechanikusan állítható kormányoszlop","lenkung": "Kormányzás","leseleuchten hinten": "Hátsó olvasólámpák","leseleuchten vorn": "Első olvasólámpák","licht- und regensensor": "Fény- és esőszenzor","licht-design-paket": "Fény-dizájn csomag","luftauslass (air breather) chrom": "Króm légkivezető (Air Breather)","luftfeder mit niveauregelung": "Légrugózás szintszabályozással","m multifunktionssitze vorn": "M multifunkciós első ülések","m sport pro paket": "M Sport Pro csomag","metallic-lackierung": "Metálfényezés","metallic-lackierung m brooklyn grau": "M Brooklyn-szürke metálfényezés","mittelarmlehne hinten": "Hátsó könyöklő","mittelarmlehne vorn": "Első könyöklő","mobile online dienste android auto": "Android Auto","modellbezeichnung schwarz lackiert (matt)": "Matt fekete modellfelirat","nebelscheinwerfer led": "LED ködlámpák","nicht bezeichnetes detail": "Egyéb felszereltség","notrufsystem (ecall)": "Segélyhívó (eCall)","otto-partikelfilter (opf)": "Benzinrészecske-szűrő (OPF)","panoramadach (glas)": "Panorámatető (üveg)","panoramadach sky lounge (glas, led-beleuchtung)": "Sky Lounge panorámatető (LED-világítás)","park-distance-control (pdc)": "Parkolóradar (PDC)","park-distance-control (pdc) vorn und hinten": "Parkolóradar elöl-hátul (PDC)","parkassistent vorne und hinten inkl. rückfahrkamera": "Parkoló-asszisztens tolatókamerával","parkassistent-paket": "Parkoló-asszisztens csomag","parkassistent-paket plus": "Parkoló-asszisztens csomag Plus","parkassistent-paket professional": "Parkoló-asszisztens csomag (Professional)","parkbremse elektrisch": "Elektromos kézifék","porsche communications management (pcm) inkl. online - navigationsmodul": "Porsche Communication Management (PCM) online navigációval","porsche stability management (psm)": "Porsche Stability Management (PSM)","porsche torque vectoring plus (ptv plus)": "Porsche Torque Vectoring Plus (PTV Plus)","porsche vehicle tracking system plus (pvts plus)": "Porsche járműkövető rendszer (PVTS Plus)","porsche wappen auf deckel ablagefach race-tex": "Porsche címer a tárolórekesz fedelén (Race-Tex)","porsche wappen auf kopfstützen - porsche exclusive manufaktur": "Porsche címer a fejtámlákon (Exclusive Manufaktur)","privacy-verglasung": "Sötétített üvegek","radioempfang digital (dab+)": "DAB+ digitális rádió","radnaben - abdeckungen porschewappen farbig": "Színes Porsche-címeres kerékagysapkák","reifen-reparaturkit": "Defektjavító készlet","reifendruck-kontrollsystem": "Guminyomás-ellenőrző rendszer","rußpartikelfilter": "Részecskeszűrő","rückfahrkamera": "Tolatókamera","rückfahrkamera mit 360° panorama view": "360°-os tolatókamera","rücksitzlehne geteilt/klappbar (40:20:40)": "Osztott dönthető hátsó ülés (40:20:40)","scr-system (adblue-technologie)": "SCR rendszer (AdBlue)","sensatec perforiert schwarz": "Perforált fekete Sensatec kárpit","schalt-/wählhebelgriff alcantara / race-tex": "Alcantara/Race-Tex váltógomb","scheibenwaschdüsen heizbar": "Fűthető ablakmosó fúvókák","scheinwerfer bmw individual shadow-line": "BMW Individual Shadow-Line fényszórók","scheinwerfer led": "LED fényszórók","scheinwerfer led mit adaptiver lichtverteilung": "Adaptív LED fényszórók","scheinwerfer laserlicht": "Lézerfényszórók","schnellladefunktion 22 kw (ac)": "22 kW-os gyorstöltés (AC)","schnellladevorrichtung flexible fast charger (mode 2)": "Flexible Fast Charger gyorstöltő (Mode 2)","schwellerabdeckung / -verkleidung wagenfarbe sportdesign": "Karosszériaszínű Sportdesign küszöbborítás","seitenairbag hinten": "Hátsó oldallégzsák","seitenairbag vorn": "Első oldallégzsák","serien-fahrwerk": "Alapfutómű","service-system: apple carplay information (vorbereitung)": "Apple CarPlay előkészítés","service-system: augmented reality für navigation": "Kiterjesztett valóság a navigációhoz","service-system: bmw intelligent personal assistant": "BMW Intelligent Personal Assistant","service-system: concierge services": "Concierge szolgáltatások","service-system: connecteddrive services": "ConnectedDrive szolgáltatások","service-system: gesetzlicher notruf": "Törvényi segélyhívó (eCall)","service-system: intelligenter notruf inkl. teleservices": "Intelligens segélyhívó + TeleServices","service-system: real time traffic information (rtti)": "Valós idejű forgalmi információ (RTTI)","service-system: remote 3d view": "Remote 3D View","service-system: remote services": "Remote Services távszolgáltatások","servolenkung integral - aktivlenkung": "Integrál aktív kormányzás","servolenkung plus": "Szervokormány Plus","servolenkung servotronic": "Servotronic szervokormány","servolenkung elektro-mechanisch": "Elektromechanikus szervokormány","sicherheit": "Biztonság","sicherheitssystem active protection": "Active Protection biztonsági rendszer","sicht": "Látás","sitzausstattung: 7-sitzer": "7 üléses kivitel","sitze": "Ülések","sitze vorn elektr. verstellbar (mit memory)": "Elektromos első ülések (memóriával)","sitze vorn mit massagefunktion": "Első ülések masszázsfunkcióval","sitzheizung (dreistufig)": "Ülésfűtés (háromfokozatú)","sitzheizung vorn": "Első ülésfűtés","sitzheizung vorn + hinten": "Első + hátsó ülésfűtés","sonnenblenden race-tex": "Race-Tex napellenzők","sonnenblenden mit spiegel (beleuchtet)": "Napellenzők világító tükörrel","sonnenschutzrollo an türscheiben hinten": "Hátsó ajtórolók","sonnenschutzverglasung (hinten abgedunkelt)": "Sötétített hátsó üvegek","sound-system bowers & wilkins": "Bowers & Wilkins hangrendszer","sound-system harman-kardon": "Harman/Kardon hangrendszer","spiegel-paket": "Tükör-csomag","sport-auspuffanlage m": "M sportkipufogó","sport-auspuffanlage, endrohre schwarz": "Sportkipufogó (fekete végekkel)","sport-chrono-paket": "Sport Chrono csomag","sport-design-paket": "Sport Design csomag","sport-fahrwerk (m-technic)": "M-Technic sportfutómű","sport-fahrwerk (pasm) elektronisch gesteuert": "PASM elektronikus sportfutómű","sportdesign schwellerverkleidungen lackiert in schwarz (matt)": "SportDesign matt fekete küszöbborítás","sportdifferential": "Sportdifferenciálmű","sportsitze vorn": "Első sportülések","sportsitze vorn elektr. verstellbar (links mit memory)": "Elektromos első sportülések (bal memóriával)","spurhalteassistent inkl. verkehrszeichenerkennung": "Sávtartó asszisztens táblafelismeréssel","spurwechselassistent": "Sávváltó-asszisztens","start/stop-anlage": "Start/Stop rendszer","start/stop-anlage (funktion)": "Start/Stop rendszer","steckdose (12v-anschluß) in mittelkonsole und koffer-/laderaum (4-fach)": "12V-os csatlakozók (4 db)","surround-kamerasystem (surround view)": "Körkép kamerarendszer (Surround View)","tv-funktion plus bei navigationssystem": "TV-funkció Plus a navigációhoz","tagfahrlicht led": "LED nappali menetfény","travel und comfort system": "Travel & Comfort rendszer","trittbretter seitlich (aluminium)": "Oldalsó fellépők (alumínium)","turbo": "Turbó","usb-schnittstelle": "USB-csatlakozó","universal-garagentoröffner": "Univerzális garázskapu-nyitó","veganza perforiert schwarz": "Perforált fekete Veganza kárpit","variable sportlenkung": "Változó áttételű sportkormányzás","verglasung akustikglas": "Akusztikus üvegezés","verglasung getönt": "Sötétített üvegezés","wegfahrsperre": "Indításgátló","widescreen display": "Széles kijelző","windschutzscheibe mit graukeil": "Szélvédő szürke sávval","wärme-/sonnenschutzverglasung": "Hő- és fényvédő üvegezés","wärmeschutzverglasung getönt": "Sötétített hővédő üvegezés","zentralverriegelung mit diebstahlsicherung und crashsensor": "Központi zár lopásgátlóval és ütközésérzékelővel","zentralverriegelung mit fernbedienung": "Távirányítós központi zár","zentralverriegelung mit funkfernbedienung": "Rádiós távirányítós központi zár"};

// Financing / legal / marketing boilerplate scraped from mobile.de -> drop (not equipment)
const EQ_JUNK = /(jahreszins|sollzins|monatsrate|\banzahlung|schlussrate|gesamtbetrag|laufzeit|fahrzeugpreis|zahlungsart|finanzierung|darlehen|openbank|check24|impressum|\bagb\b|widerrufen|bestellvorgang|hingucker|funktioniert|eintragen|ergebnis erhalten|abschließen|online-kredit|\bkredit\b|unverbindlich|zuhause|erhältst|bequem|\buvm\b|ratenzahlung|\braten\b|monate|[€%]|datenschutz|barrierefrei|fahrzeugbeschreibung|sicherheitslücke|vulnerability|einstellungen|erklärung|gewährleistung|widerrufs|nutzungsbedingungen|cookie|\banzeige\b|händler|imprint)/i;
// German compound stems (unambiguous) -> drop untranslatable German
const DE_STEMS = /(ß|ä|reifen|heizung|belüftung|beleuchtung|scheinwerfer|scheibe|spiegel|\bleder|licht\b|leuchte|assistent|assistenz|\bpaket|anlage|automatik|differ|sperr|kupplung|verglasung|lenkung|lenkrad|fahrwerk|getriebe|zylinder|blende|träger|steuerung|regelung|warner|halter|bezug|ausstattung|rückfahr|einpark|standheiz|allrad|sommer|winter|allwetter|ganzjahr|sitzheiz|felgen?|\bfelge|räder|\bsitze?\b|fahrer|beifahrer|außen|\binnen|hinten|\bvorn|wärme|kühl|verstellbar|abblend|schwenkbar|federung|dämpfer|schiebedach|\bdach\b|heckklappe|kofferraum|\btüren?\b|lackierung|getönt|abgedunkelt|freisprech|sprachsteuerung|regensensor|lichtsensor|nichtraucher|gewähr|garantie\b|reifendruck|schaltknauf|aufkleber|feuerlöscher|funkanlage|anhänger|fahrzeug|datenschutz|barrierefrei|beschreibung|einstellung|erklärung|sicherheit|vulnerability|deutsch|vorhanden|\bsecurity\b|\breport\b|\benglish\b|\bbrief\b|umfang|inklusive|serienmäßig|optional|\bpkw\b|\bkfz\b|\blkw\b|neuwagen|gebrauchtwagen|jahreswagen|vorführwagen|tageszulassung|reimport|eu-fahrzeug|personenkraftwagen|netto\s*export|export\s*preis|\beur\b|\bparken\b|e-?mail\s*schreiben|\bschreiben\b|\bteilen\b|\binserat\b|beanstanden|\bdrucken\b|\bmerken\b|zwischenfinanzierung|probefahrt|nachricht\s*senden|zur\s*merkliste)/i;
// Whole German function/marker words (matched per-token, accent-safe)
const DE_WORDS = new Set(["und","mit","für","der","die","das","dein","deine","deiner","den","dem","des","von","kannst","du","im","am","ein","eine","einfach","absoluter","absolute","online","abschließen","abschliessen","zuhause","wahl","bank","erhältst","bequem","unverbindliches","dich","deinem","zur","zum","ist","sind","vorhanden","deutsches","deutsche","deutscher","zum","beim","oder","auch","sowie","inkl"]);
const DE_RULES = [
  [/deutsches?\s+fahrzeug/i, "Német jármű (német okmányokkal)"],
  [/scheckheftgepflegt|scheckheft/i, "Szervizkönyvvel"],
  [/nichtraucher/i, "Nemdohányzó autó"],
  [/unfallfrei/i, "Sérülésmentes"],
  [/sommerreifen/i, "Nyári gumik"],
  [/winterreifen/i, "Téli gumik"],
  [/(allwetter|ganzjahres)reifen/i, "Négyévszakos gumik"],
  [/standheizung/i, "Állófűtés"],
  [/sitzheizung/i, "Ülésfűtés"],
  [/(sitzbelüftung|belüftete\s+sitze|sitzklimatisierung|sitzlüftung)/i, "Szellőztetett ülések"],
  [/(massagesitze|massagefunktion|massage)/i, "Masszázs ülés"],
  [/(luftfederung|luftfahrwerk|niveauregulierung)/i, "Légrugózás"],
  [/anhängerkupplung/i, "Vonóhorog"],
  [/panorama/i, "Panorámatető"],
  [/schiebedach/i, "Tolótető"],
  [/(rückfahr|reversier)kamera/i, "Tolatókamera"],
  [/(360|surround|umgebungs?).{0,8}kamera/i, "360°-os kamera"],
  [/head-?up/i, "Head-Up kijelző"],
  [/(klimaautomatik|klimaanlage|klimatronic)/i, "Automata klíma"],
  [/xenon/i, "Xenon fényszóró"],
  [/(led-?scheinwerfer|matrix|laserlicht|voll-?led)/i, "LED fényszóró"],
  [/kurvenlicht/i, "Kanyarfény"],
  [/(sperrdiff|sperrdifferenzial|differenzialsperre|hinterachs)/i, "Zárható differenciálmű"],
  [/(allradantrieb|\ballrad\b|4x4|4matic|quattro|xdrive)/i, "Összkerékhajtás"],
  [/sportfahrwerk/i, "Sportfutómű"],
  [/adaptive?s?\s*fahrwerk|adaptivfahrwerk/i, "Adaptív futómű"],
  [/((sport)?abgasanlage|sportauspuff)/i, "Sport kipufogó"],
  [/multifunktionslenkrad/i, "Multifunkciós kormány"],
  [/(lederlenkrad|leder\s*lenkrad|sportlenkrad)/i, "Bőr kormány"],
  [/freisprech/i, "Kihangosító"],
  [/(keyless|komfortzugang|schlüssellos)/i, "Kulcs nélküli nyitás"],
  [/soft-?close/i, "Soft-close ajtók"],
  [/heckklappe|elektr.*kofferraum/i, "Elektromos csomagtérajtó"],
  [/navigation/i, "Navigációs rendszer"],
  [/(einparkhilfe|parksensor|\bpdc\b|parkassistent|einparkassistent)/i, "Parkolóasszisztens"],
  [/(tempomat|geschwindigkeitsregel|abstandsregel|acc\b)/i, "Adaptív tempomat"],
  [/(memory-?paket|memoryfunktion|sitzmemory)/i, "Memória funkció"],
  [/(vollleder|nappaleder|lederpolster|lederausstattung|\bleder\b)/i, "Bőr belső"],
  [/(alufelgen|leichtmetallfelgen|leichtmetallräder|alu-?räder)/i, "Könnyűfém felnik"],
  [/metallic/i, "Metálfényezés"],
  [/(getönte|abgedunkelte).{0,10}(scheiben|glas|verglasung)|privacy/i, "Sötétített üvegek"],
  [/ambiente/i, "Ambient világítás"],
  [/standklimatisierung|standlüftung/i, "Állóklíma"],
  [/spurhalte|spurassistent|spurwechsel/i, "Sávtartó asszisztens"],
  [/totwinkel|toter\s*winkel|spurwechselassistent/i, "Holttér-figyelő"],
  [/verkehrszeichen/i, "Táblafelismerés"],
  [/nachtsicht/i, "Éjjellátó"],
  [/(soundsystem|harman|bang\s*&?\s*olufsen|bowers|meridian|burmester)/i, "Prémium hangrendszer"],
  [/apple\s*carplay|android\s*auto/i, "Apple CarPlay / Android Auto"],
  [/wireless\s*charging|induktiv.*laden|kabellos.*laden/i, "Vezeték nélküli töltő"],
  [/garagentoröffner|home-?link/i, "Garázskapu-nyitó"],
  [/modellbezeichnung/i, "Modellfelirat"],
  [/schwellerabdeckung|schwellerverkleidung|küssellei|einstiegsblenden|einstiegsleisten/i, "Beépített küszöbvédők"],
  [/dachhimmel/i, "Tetőkárpit"],
  [/innovationspaket|innovations-paket/i, "Innovációs csomag"],
  [/cd-?spieler|cd-?wechsler/i, "CD-lejátszó"],
  [/fensterheber/i, "Elektromos ablakemelők"],
  [/geschwindigkeits-?begrenzer|\bbegrenzer\b|speed limit device/i, "Sebességkorlátozó"],
  [/musikstreaming/i, "Zenei streaming"],
  [/partikelfilter/i, "Részecskeszűrő"],
  [/schaltwippen/i, "Váltófülek a kormányon"],
  [/sportpaket/i, "Sport csomag"],
  [/touchscreen/i, "Érintőképernyő"],
  [/traktionskontrolle|traktions-?control|\bDTC\b/i, "Kipörgésgátló"],
  [/kombiinstrument/i, "Digitális műszerfal"],
  [/\bESP\b|elektronisches stabilit|stabilitäts-?control|\bDSC\b/i, "Menetstabilizáló (ESP/DSC)"],
  [/\bABS\b|anti-?blockier/i, "Blokkolásgátló (ABS)"],
  [/mittelarmlehne/i, "Középső könyöklő"],
  [/\barmlehne\b/i, "Könyöklő"],
  [/\btuner\b|tuner\/?radio/i, "Rádió"],
  [/nebelscheinwerfer|nebellicht/i, "Ködlámpák"],
  [/regensensor/i, "Esőszenzor"],
  [/lichtsensor/i, "Fényszenzor"],
  [/zentralverriegelung/i, "Központi zár"],
  [/servolenkung|servotronic/i, "Szervokormány"],
  [/wegfahrsperre/i, "Indításgátló"],
  [/bordcomputer|bord-?computer/i, "Fedélzeti számítógép"],
  [/start.?stop/i, "Start/Stop rendszer"],
  [/gepäckraum|kofferraum/i, "Csomagtér"],
  [/lordose|lendenwirbel/i, "Deréktámasz"],
  [/durchlade|durchladeeinrichtung/i, "Átrakodó nyílás"],
  [/reifendruck/i, "Guminyomás-ellenőrző rendszer"],
  [/notruf|ecall/i, "Vészhívó (eCall)"],
  [/rußpartikel|otto-?partikel/i, "Részecskeszűrő"],
  [/scheibenwaschd|waschdüsen/i, "Fűthető ablakmosó fúvókák"],
  [/fußmatten/i, "Szőnyegek"],
  [/warndreieck/i, "Elakadásjelző háromszög"],
  [/verbandkasten|erste hilfe/i, "Elsősegélycsomag"],
  [/mild-?hybrid|mildhybrid/i, "Mild-hybrid hajtás"],
  [/schadstoffarm|abgasnorm|euro 6/i, "Euro 6 norma"],
  [/personalisierungssystem|personal profile|personal esim|my modes/i, "Személyre szabás"],
];
function hasPhone(s) {
  return /(\+\s?49|\b0049|\btel\.?\b|telefon|\bhandy\b|\bmobil\b|\bwhatsapp\b|\b0\d{2,4}[\s\/.-]\d{4,}|\d{3,}[\s\/.-]\d{4,})/i.test(String(s));
}
function hasGermanWord(s) {
  return String(s).toLowerCase().split(/[^a-zà-ÿőű]+/).some((w) => w && DE_WORDS.has(w));
}
// German -> Hungarian for a felszereltseg item; returns Hungarian string or null (drop)
function translateEquip(raw) {
  let s = cleanDE(String(raw == null ? "" : raw).trim());
  if (!s) return null;
  const key = s.replace(/\s+/g, " ").toLowerCase();
  if (DE2HU[key]) return DE2HU[key];   // exact dictionary hit (translate)
  for (const [re, hu] of DE_RULES) if (re.test(s)) return hu;  // pattern translate
  if (hasPhone(s)) return null;        // German / any phone numbers
  if (EQ_JUNK.test(s)) return null;    // financing / legal junk
  if (DE_STEMS.test(s)) return null;   // untranslatable German compound
  if (hasGermanWord(s)) return null;   // German sentence / marker word
  return s;                            // already Hungarian
}

// Equipment overrides for active cars whose sheet felszereltseg is import junk
// (mobile.de footer scraped instead of the Ausstattung). Keyed by `kulcs`
// (mobile.de image key). Raw German here; the generator translates it below.
const EQUIP_OVERRIDE = {"e4/e498a290-8d7c-41ee-a73b-cd92a66fc13a": "#Kültér | Anhängerkupplung (Kugelkopf schwenkbar) | Dachreling Aluminium satiniert | Heckklappenbetätigung automatisch | LM-Felgen | Panoramadach (Glas) | Sonnenschutzverglasung (hinten abgedunkelt) | #Komfort / beltér | Ambiente-Beleuchtung | Außenspiegel elektr. anklappbar, alle Spiegel mit Abblendautomatik | Außenspiegel elektr. verstell- und heizbar | BMW Live Cockpit Plus | DAB-Tuner (Radioempfang digital) | Fahrassistenz-System: Driving Assistant | Fahrassistenz-System: Driving Assistant Professional | Fahrassistenz-System: Einparkhilfe Seite | Fahrassistenz-System: Park-Assistent | Fahrassistenz-System: Rückfahr-Assistent | Geschwindigkeits-Begrenzeranlage (Speed Limit Device) | Geschwindigkeits-Regelanlage mit Bremsfunktion | Geschwindigkeits-Regelanlage, Aktiv mit Stop&Go-Funktion | HiFi-Lautsprechersystem | Induktionsladeschale für Smartphone (Wireless Charging) | Klimaautomatik 4-Zonen mit autom. Umluft-Control | Lendenwirbelstütze Sitz vorn links | Lenkrad (Sport/Leder M-Technic) mit Multifunktion | Luftfeder mit Niveauregelung | Parkassistent-Paket | Parkassistent-Paket Professional | Park-Distance-Control (PDC) vorn und hinten | Rückfahrkamera | Sitzheizung vorn | Sound-System Harman-Kardon | Start/Stop-Anlage (Funktion) | Wärme-/Sonnenschutzverglasung | #Biztonság / környezet | Adaptives Fahrwerk M-Technic | Alarmanlage | Antriebsart: Allradantrieb | Antriebsart: xDrive (Allrad) | Dynamische Stabilitäts-Control (DSC) mit erweiterter Umfang | Fahrassistenz-System: Active Guard (Bremsassistent) | Fahrassistenz-System: aktiver Spurhalteassistent | Fahrassistenz-System: Auffahrwarnsystem mit Bremsfunktion | Fahrassistenz-System: Aufmerksamkeits-Assistent | Fahrassistenz-System: Fernlichtassistent | Fahrassistenz-System: Speed-Limit-Anzeige | Fahrassistenz-System: Spurwechselassistent | Fahrassistenz-System: Spurwechsel-Warnsystem | Gepäckraum-Abtrennung (Netz) | Komfortzugang (Öffnungs- und Schließsystem) | Reifendruck-Kontrollsystem | Rußpartikelfilter | Scheinwerfer LED mit adaptiver Lichtverteilung | Service-System: Gesetzlicher Notruf | Service-System: Intelligenter Notruf inkl. TeleServices | #Komfort / beltér | SENSAFIN DEKORGESTEPPT | #Egyéb | Aerodynamik-Paket M-Technic | Alpinweiß-Lackierung (Uni) | Außenausstattung: Shadow-Line | Außenausstattung: Shadow-Line Hochglanz (erweiterter Umfang) | Außenspiegel mit Bordsteinautomatik, rechts | Außenspiegel-Paket (erweitert) | Ausstattungs-Paket: Connected Professional | Bremsanlage: M Sportbremsen (Bremssättel lackiert) | Bremsanlage: M Sportbremsen (Bremssättel lackiert, rot hochglänzend) | Bremsenergierückgewinnung (Rekuperationssystem) | Dachhimmel Anthrazit | Diebstahlsicherung für Räder (Felgenschlösser) | Einstiegsleisten mit Schriftzug BMW Individual | Erste Hilfe-Kasten / Verbandkasten | Fahrassistenz-System: Anhängerassistent | Fahrassistenz-System: BMW Gestiksteuerung | Fahrassistenz-System: Fahrerlebnisschalter | Fahrassistenz-System: Falschfahrwarnung | Fahrassistenz-System: Heckaufprall-Vermeidung (Prävention Heckkollision) | Fahrassistenz-System: Kreuzungs-Assistent | Fahrassistenz-System: Parken Anfahrüberwachung | Fahrassistenz-System: Querverkehrs-Assistent | Fußmatten Velours | Getriebe Sport-Automatic - mit Steptronic (8-Stufen) | Heckklappe zweiteilig | Innenausstattung: Interieurleisten Carbon | Karosserie: 5-türig | Kühlergrill beleuchtet (Iconic Glow) | M Sport | Mild-Hybrid 219 kW (Motor 3,0 Ltr. - 210 kW Diesel) | Modellpflege | Motor 3,0 Ltr. - 210 kW Mild-Hybrid Diesel | Personalisierungssystem (Personal eSIM) | Radstand Standard | Reifen-Reparaturset (Mobility-Pack) | Schadstoffarm nach Abgasnorm Euro 6e | Scheinwerfer BMW Individual Shadow-Line | Service-System: ConnectedDrive Services | Sicherheitsgurte M | Sicherheitssystem Active Protection | Sitzbezug / Polsterung: Ledernachbildung Sensafin | Sonnenschutzrollo an Türscheiben hinten | Sport-Automatic Getriebe | Travel und Comfort System | Warndreieck | #Sport | BMW-Sportsitze vorn | BMW-Sportsitze vorn, elektr. verstellbar (links mit Memory) | M Sport Pro Paket | Sport-Auspuffanlage M", "ae/aef32313-b261-42ee-a3e1-4a94f06444ad": "#Kültér | Heckklappenbetätigung automatisch | LM-Felgen vorn/hinten: 8,5x20 / 10x20 (Sternspeiche 938 M, Bicolor, Jetblack) | Panoramadach (Glas) | Sonnenschutzverglasung (hinten abgedunkelt) | #Komfort / beltér | Ambiente-Beleuchtung | Audio-Navigationssystem | Außenspiegel elektr. anklappbar, alle Spiegel mit Abblendautomatik | DAB-Tuner (Radioempfang digital) | Durchladeeinrichtung (Mittelarmlehne hinten) | Fahrassistenz-System: Driving Assistant Professional | Fahrassistenz-System: Einparkhilfe Seite | Fahrassistenz-System: Park-Assistent | Fahrassistenz-System: Rückfahr-Assistent | Fensterheber elektrisch vorn + hinten | Freisprecheinrichtung Bluetooth mit USB-/Audio-Schnittstelle | Geschwindigkeits-Begrenzeranlage (Speed Limit Device) | Geschwindigkeits-Regelanlage mit Bremsfunktion | Geschwindigkeits-Regelanlage, Aktiv mit Stop&Go-Funktion | Head-up-Display Full Color | Induktionsladeschale für Smartphone (Wireless Charging) | Klimaautomatik 4-Zonen mit autom. Umluft-Control | Komfortsitze vorn elektr. verstellbar (links mit Memory) | Lenkrad (Sport/Leder M-Technic) mit Multifunktion | Lenkrad heizbar | Parkassistent-Paket Plus | Rückfahrkamera | Service-System: Augmented Reality für Navigation | Sitzheizung vorn + hinten | Sound-System Bowers & Wilkins | Surround-Kamerasystem (Surround View) | Zentralverriegelung mit Diebstahlsicherung und Crashsensor | #Biztonság / környezet | Adaptives Fahrwerk Professional | Airbag Beifahrerseite | Airbag Fahrerseite | Alarmanlage | Anti-Blockier-System (ABS) | Antriebsart: xDrive (Allrad) | Bremsassistent | Fahrassistenz-System: aktiver Spurhalteassistent | Fahrassistenz-System: Frontkollisionswarnung | Fahrassistenz-System: Rückfahrhilfe Notbremsfunktion (Active PDC) | Fahrassistenz-System: Speed-Limit-Anzeige | Fahrassistenz-System: Spurwechselassistent | Fahrassistenz-System: Spurwechsel-Warnsystem | Komfortzugang (Öffnungs- und Schließsystem) | Kopf-Airbag-System hinten | Kopf-Airbag-System vorn | Reifendruck-Kontrollsystem | Scheinwerfer LED mit adaptiver Lichtverteilung | Seitenairbag vorn | Service-System: Gesetzlicher Notruf | Service-System: Intelligenter Notruf inkl. TeleServices | #Egyéb | Akustischer Fußgängerschutz (Außensound) | Anhänger-Stabilisierungs-Programm (ASL) | Außenausstattung: Shadow-Line Hochglanz (erweiterter Umfang) | Außenspiegel-Paket (erweitert) | BMW Curved Display | BMW IconicSounds Electric (Soundgenerator) | Bremsanlage: M Sportbremsen (Bremssättel lackiert, blau hochglänzend) | Bremsanlage: M Sportbremsen (Bremssättel lackiert, rot hochglänzend) | Dachhimmel Anthrazit | Diebstahlsicherung für Räder (Felgenschlösser) | Elektromotor 192 kW (System: 442 kW) VA | Elektromotor 250 kW (System: 442 kW) HA | Elektromotor 442 kW (cont. 127 kW, Dual-Elektromotor) | Exterieurumfänge Iconic Glow | Fahrassistenz-System: Active Guard (Bremsassistent) | Fahrassistenz-System: Ampel-Erkennung | Fahrassistenz-System: Ausweich-Assistent | Fahrassistenz-System: Autobahnassistent | Fahrassistenz-System: BMW Natural Interactive | Fahrassistenz-System: Fahrerlebnisschalter | Fahrassistenz-System: Falschfahrwarnung | Fahrassistenz-System: Heckaufprall-Vermeidung (Prävention Heckkollision) | Fahrassistenz-System: Kreuzungs-Assistent | Fahrassistenz-System: Post-Crash-System (PC-iBrake) | Fahrassistenz-System: Querverkehrs-Assistent | Fußmatten Velours | Getriebe für Elektrofahrzeug | Heckspoiler (M-Technic) | Innenausstattung: Interieurleisten M Dunkel-Silber / Aluminium Rhombicle | Innenausstattung: Interieurleisten M Dunkel-Silber / Carbon Fibre mit Silberfäden hochglänzend | Karosserie: 4-türig | Ladekabel (5,0 m) mit Typ 2-Stecker (Mode 3, 22 kW) | Ladekabel Wechselstrom / Gleichstrom (32 A / 230 V) | Lenksäule (Lenkrad) mechan. verstellbar | Personalisierungssystem (BMW My Modes) | Personalisierungssystem (Personal eSIM) | Reifen-Reparaturset (Mobility-Pack) | Reifen-Reparaturset Plus (Mobility-Pack) | Scheinwerfer BMW Individual Shadow-Line | Schnellladefunktion 22 kW (AC) | Schnellladevorrichtung Flexible Fast Charger (Mode 2) | Service-System: ConnectedDrive Services | Service-System: Remote 3D View | Sicherheitsgurte M | Sitzbezug / Polsterung: Ledernachbildung Veganza perforiert (Espresso Braun) | Sitzbezug / Polsterung: M Alcantara / Veganza Kombination (Schwarz) | Travel und Comfort System | Warndreieck | #Sport | M Sport Pro Paket | Sportsitze vorn", "ca/ca7bae64-676d-42cb-bec5-1499ba6bf63c": "#Kültér | Anhängerkupplung (Kugelkopf schwenkbar) | Dachreling Hochglanz Shadow-Line | Heckklappenbetätigung automatisch | LM-Felgen 8x20 (V-Speiche 873 M, Bicolor) | Panoramadach (Glas) | Sonnenschutzverglasung (hinten abgedunkelt) | #Komfort / beltér | Airbag Beifahrerseite abschaltbar | Außenspiegel elektr. anklappbar | Außenspiegel elektr. verstell- und heizbar | Außenspiegel mit Abblendautomatik, links | BMW Live Cockpit Plus | Comfort-Paket | Fahrassistenz-System: Driving Assistant Plus | Fahrassistenz-System: Einparkhilfe Seite | Fahrassistenz-System: Park-Assistent | Fahrassistenz-System: Rückfahr-Assistent | Fensterheber elektrisch | Geschwindigkeits-Begrenzeranlage (Speed Limit Device) | Geschwindigkeits-Regelanlage mit Bremsfunktion | Geschwindigkeits-Regelanlage, Aktiv mit Stop&Go-Funktion | Getriebe 7-Gang - Doppelkupplungsgetriebe mit Steptronic und Schaltwippen | Head-up-Display | Induktionsladeschale für Smartphone (Wireless Charging) | Innenspiegel mit Abblendautomatik | Isofix-Aufnahmen für Kindersitz an Beifahrersitz | Isofix-Aufnahmen für Kindersitz an Rücksitz | Klimaautomatik 2-Zonen mit autom. Umluft-Control, erweiterter Umfang | Lenkrad (Leder) mit Multifunktion M-Technic | Lenkrad heizbar | Licht- und Regensensor | Multimedia-Schnittstelle 2 x USB (Typ C) Mittelkonsole vorn und 2 x USB-Ladeanschluß (Typ C) Mittelkonsole hinten | Parkassistent-Paket Professional | Park-Distance-Control (PDC) vorn und hinten | Radioempfang digital (DAB+) | Rückfahrkamera mit 360° Panorama View | Rücksitzlehne geteilt/klappbar (40:20:40) | Servolenkung Servotronic | Sitze vorn elektr. verstellbar (mit Memory) | Sitzheizung vorn | Sound-System Harman-Kardon | Start/Stop-Anlage (Funktion) | Zentralverriegelung mit Diebstahlsicherung und Crashsensor | Zentralverriegelung mit Fernbedienung | #Biztonság / környezet | Adaptives Fahrwerk M-Technic | Airbag Fahrer-/Beifahrerseite | Anti-Blockier-System (ABS) | Antriebsart: Allradantrieb | Antriebsart: xDrive (Allrad) | Diebstahl-Warnanlage | Dynamische Stabilitäts-Control (DSC) | Fahrassistenz-System: Active Guard (Bremsassistent) | Fahrassistenz-System: Anfahr-Assistent | Fahrassistenz-System: Aufmerksamkeits-Assistent | Fahrassistenz-System: Fernlichtassistent | Fahrassistenz-System: Speed-Limit-Anzeige | Komfortzugang (Öffnungs- und Schließsystem) | Kopf-Airbag-System hinten | Kopf-Airbag-System vorn | Reifendruck-Kontrollsystem | Rußpartikelfilter | Scheinwerfer LED | Scheinwerfer LED mit adaptiver Lichtverteilung | Seitenairbag vorn | Service-System: Gesetzlicher Notruf | Service-System: Intelligenter Notruf inkl. TeleServices | #Egyéb | Aktivsitze vorn | Anti-Diebstahl-Recorder | Außenausstattung: Shadow-Line Hochglanz | Außenausstattung: Shadow-Line Hochglanz (erweiterter Umfang) | Außenspiegel mit Bordsteinautomatik, rechts | BMW Drive Recorder (Dashcam) | Bremsanlage: M Sportbremsen (Bremssättel lackiert, rot hochglänzend) | Dachhimmel Anthrazit | Diebstahlsicherung für Räder (Felgenschlösser) | Erste Hilfe-Kasten / Verbandkasten | Fahrassistenz-System: Heckaufprall-Vermeidung (Prävention Heckkollision) | Fahrassistenz-System: Lenk- und Spurführungs-Assistent | Fahrassistenz-System: Manövrierassistent | Fahrassistenz-System: Parken ferngesteuert (mit Display-Key) | Fahrassistenz-System: Performance Control | Fahrassistenz-System: Post-Crash-System (PC-iBrake) | Fahrassistenz-System: Querverkehrs-Assistent | Fahrassistenz-System: Rückfahr-Assistent Professional | Fußraumbeleuchtung hinten | Fußraumbeleuchtung vorn | Gepäckraumbeleuchtung | Getränkehalter | Heckleuchten LED | Heckspoiler (M-Technic) | Innenausstattung: Interieurleisten, schwarz hochglänzend | Instrumententafel Luxury | Karosserie: 5-türig | Kennzeichenbeleuchtung LED | Kraftstofftank: vergrößert | Kühlergrill beleuchtet (Iconic Glow) | Laderaumboden herausnehmbar | Leseleuchten hinten | Leseleuchten vorn | M Sport | Mild-Hybrid 120 kW (Motor 2,0 Ltr. - 110 kW Diesel) | Motor 2,0 Ltr. - 110 kW Mild-Hybrid Diesel (B47) | Parkbremse elektrisch | Personalisierungssystem (BMW My Modes) | Personalisierungssystem (Personal eSIM) | Radstand Standard | Reifen-Reparaturset Plus (Mobility-Pack) | Schadstoffarm nach Abgasnorm Euro 6e | Scheibenwaschdüsen heizbar | Scheinwerfer BMW Individual Shadow-Line | Serien-Fahrwerk | Service-System: ConnectedDrive Services | Service-System: Remote 3D View | Sicherheitsgurte M | Sitzbezug / Polsterung: Ledernachbildung Veganza perforiert (Schwarz) | Spiegel-Paket | Steckdose (12V-Anschluß) in Mittelkonsole und Koffer-/Laderaum (4-fach) | Verglasung Akustikglas | Warndreieck | #Sport | M Sport Pro Paket | Sportsitze vorn", "70/70599f2f-dba9-4802-b496-5e6ab11a1df8": "#Kültér | Dachreling Hochglanz Shadow-Line | LM-Felgen vorn/hinten: 9,5x22 / 10,5x22 (Y-Speiche 758, Bicolor, Orbit-Grau, BMW Individual) | Panoramadach Sky Lounge (Glas, LED-Beleuchtung) | Sonnenschutzverglasung (hinten abgedunkelt) | #Komfort / beltér | Ambiente-Beleuchtung | Außenspiegel elektr. anklappbar | Außenspiegel elektr. anklappbar, alle Spiegel mit Abblendautomatik | Außenspiegel elektr. verstell- und heizbar | BMW Live Cockpit Professional | DAB-Tuner (Radioempfang digital) | Fahrassistenz-System: Driving Assistant | Fahrassistenz-System: Driving Assistant Professional | Fahrassistenz-System: Park-Assistent | Fahrassistenz-System: Rückfahr-Assistent | Freisprecheinrichtung Bluetooth mit erweiterte Smartphone-Anbindung | Geschwindigkeits-Begrenzeranlage (Speed Limit Device) | Geschwindigkeits-Regelanlage mit Bremsfunktion | Geschwindigkeits-Regelanlage, Aktiv mit Stop&Go-Funktion | Head-up-Display | Induktionsladeschale für Smartphone (Wireless Charging) | Isofix-Aufnahmen für Kindersitz an Rücksitz | Klimaautomatik 5-Zonen mit autom. Umluft-Control | Komfortsitze vorn elektr. verstellbar (mit Memory) | Lenkrad (Sport/Leder M-Technic) mit Multifunktion | Licht- und Regensensor | Mittelarmlehne hinten | Mittelarmlehne vorn | Parkassistent-Paket Plus | Park-Distance-Control (PDC) vorn und hinten | Rückfahrkamera | Rücksitzlehne geteilt/klappbar (40:20:40) | Service-System: Apple CarPlay Information (Vorbereitung) | Service-System: Real Time Traffic Information (RTTI) | Servolenkung Integral - Aktivlenkung | Servolenkung Servotronic | Sitze vorn mit Massagefunktion | Sitzheizung vorn + hinten | Sound-System Bowers & Wilkins | Start/Stop-Anlage (Funktion) | Surround-Kamerasystem (Surround View) | TV-Funktion Plus bei Navigationssystem | Universal-Garagentoröffner | USB-Schnittstelle | #Biztonság / környezet | Adaptives Kurvenlicht | Airbag Fahrer-/Beifahrerseite | Alarmanlage | Anti-Blockier-System (ABS) | Antriebsart: Allradantrieb | Antriebsart: xDrive (Allrad) | Fahrassistenz-System: Active Guard (Bremsassistent) | Fahrassistenz-System: Active Guard Plus (Spurhalteassistent, Frontkollisionswarnung) | Fahrassistenz-System: aktiver Spurhalteassistent | Fahrassistenz-System: Aufmerksamkeits-Assistent | Fahrassistenz-System: BMW Night Vision | Fahrassistenz-System: Fernlichtassistent | Fahrassistenz-System: Rückfahrhilfe Notbremsfunktion (Active PDC) | Fahrassistenz-System: Speed-Limit-Anzeige | Fahrassistenz-System: Spurwechsel-Warnsystem | Gepäckraum-Abtrennung (Netz) | Knieairbag Beifahrerseite | Knieairbag Fahrerseite | Komfortzugang (Öffnungs- und Schließsystem) | Kopf-Airbag-System hinten | Kopf-Airbag-System vorn | Lenksäule (Lenkrad) elektr. verstellbar und Fahrerairbag | Luftfeder mit Niveauregelung | Nebelscheinwerfer LED | Reifendruck-Kontrollsystem | Rußpartikelfilter | Scheinwerfer Laserlicht | Scheinwerfer LED | Seitenairbag vorn | Service-System: Gesetzlicher Notruf | Service-System: Intelligenter Notruf inkl. TeleServices | Tagfahrlicht LED | Wegfahrsperre | #Komfort / beltér | Leder | #Egyéb | 3.Sitzreihe | Aerodynamik-Paket M-Technic | Anhänger-Stabilisierungs-Programm (ASL) | Außenausstattung: Shadow-Line Hochglanz | Außenspiegel mit Bordsteinautomatik, rechts | Außenspiegel-Paket (erweitert) | Ausstattungs-Paket: Connected Teaser | Bedienelemente galvanisiert | BMW Display-Key | Bremsanlage: M Sportbremsen (Bremssättel lackiert) | Dachhimmel Alcantara / Anthrazit | Diebstahlsicherung für Räder (Felgenschlösser) | Dynamische Tractions Control (DTC) | Einstiegsleisten mit Schriftzug BMW (beleuchtet) | Fahrassistenz-System: Ausweich-Assistent | Fahrassistenz-System: BMW Gestiksteuerung | Fahrassistenz-System: Fahrerlebnisschalter | Fahrassistenz-System: Falschfahrwarnung | Fahrassistenz-System: Frontkollisionswarnung | Fahrassistenz-System: Heckaufprall-Vermeidung (Prävention Heckkollision) | Fahrassistenz-System: Kreuzungs-Assistent | Fahrassistenz-System: Querverkehrs-Assistent | Fahrwerkssystem: Executive Drive Pro (Wankstabilisierung) | Fond-Entertainment-System Professional | Fußmatten Velours | Getriebe Sport-Automatic - mit Steptronic (8-Stufen) | Harnstofftank (SCR): 22 Ltr. | Heckklappe zweiteilig | Heckleuchten LED | Innenausstattung: Glas-Applikationen (CraftedClarity) für Bedienelemente | Innenausstattung: Interieurleisten Edelholz Fineline mit Metalleffekt | Instrumententafel lederbezogen | Instrumententafel Sensatec | Karosserie: 5-türig | LED-Lichtelemente | Luftauslass (Air Breather) Chrom | Motor 3,0 Ltr. - 294 kW Turbodiesel | Parkbremse elektrisch | Personalisierungssystem (Personal Profile) | Radstand 3105 mm | Schadstoffarm nach Abgasnorm Euro 6d-TEMP | Scheibenwaschdüsen heizbar | SCR-System (AdBlue-Technologie) | Service-System: Concierge Services | Service-System: ConnectedDrive Services | Service-System: Remote 3D View | Service-System: Remote Services | Sicherheitssystem Active Protection | Sitzausstattung: 7-Sitzer | Sitzbezug / Polsterung: Leder Vernasca | Sport-Automatic Getriebe | Sportdifferential | Steckdose (12V-Anschluß) in Mittelkonsole und Koffer-/Laderaum (4-fach) | Verglasung Akustikglas | Warndreieck | #Sport | Sport-Auspuffanlage M", "24/24857cd6-33a6-4c12-8302-fd0c2ef1f671": "#Kültér | LM-Felgen vorn/hinten: 9,5x22 / 10,5x22 (Doppelspeiche 742 M, Jet Black) | Panoramadach Sky Lounge (Glas, LED-Beleuchtung) | Sonnenschutzverglasung (hinten abgedunkelt) | #Komfort / beltér | Ambiente-Beleuchtung | Außenspiegel elektr. anklappbar, alle Spiegel mit Abblendautomatik | Außenspiegel elektr. heiz- und anklappbar | Außenspiegel mit Abblendautomatik, links | BMW Live Cockpit Plus | DAB-Tuner (Radioempfang digital) | Fahrassistenz-System: Driving Assistant | HiFi-Lautsprechersystem | Induktionsladeschale für Smartphone (Wireless Charging) | Innovations-Paket | Klimaautomatik 4-Zonen mit autom. Umluft-Control | Lendenwirbelstütze Sitz vorn links und rechts | Lenkrad (Sport/Leder M-Technic) mit Multifunktion | M Multifunktionssitze vorn | Parkassistent-Paket | Parkassistent-Paket Professional | Servolenkung Integral - Aktivlenkung | Sitzheizung vorn | Sitzheizung vorn + hinten | Sound-System Harman-Kardon | Start/Stop-Anlage (Funktion) | #Biztonság / környezet | Adaptives Fahrwerk M-Technic | Alarmanlage | Antriebsart: Allradantrieb | Antriebsart: xDrive (Allrad) | Fahrassistenz-System: Active Guard (Bremsassistent) | Fahrassistenz-System: Auffahrwarnsystem mit Bremsfunktion | Fahrassistenz-System: Fernlichtassistent | Fahrassistenz-System: Speed-Limit-Anzeige | Fahrassistenz-System: Spurwechselassistent | Fahrassistenz-System: Spurwechsel-Warnsystem | Komfortzugang (Öffnungs- und Schließsystem) | Otto-Partikelfilter (OPF) | Reifendruck-Kontrollsystem | Scheinwerfer LED mit adaptiver Lichtverteilung | Service-System: Gesetzlicher Notruf | Service-System: Intelligenter Notruf inkl. TeleServices | #Komfort / beltér | BMW INDI. ERW. LED. SCHWARZ | #Egyéb | Abdeckkappen Außenspiegel M Carbon | Aerodynamik-Paket | Aerodynamik-Paket M-Technic | Alpinweiß-Lackierung (Uni) | Außenausstattung: Shadow-Line | Außenausstattung: Shadow-Line Hochglanz (erweiterter Umfang) | Außenspiegel mit Bordsteinautomatik, rechts | Außenspiegel-Paket (erweitert) | Ausstattungs-Paket: Connected Professional | Bremsanlage: M Sportbremsen (Bremssättel lackiert) | Bremsanlage: M Sportbremsen (Bremssättel lackiert, rot hochglänzend) | Bremsenergierückgewinnung (Rekuperationssystem) | Dachhimmel Alcantara / Anthrazit | Dachhimmel Anthrazit | Diebstahlsicherung für Räder (Felgenschlösser) | Fahrassistenz-System: BMW Gestiksteuerung | Fahrassistenz-System: Querverkehrs-Assistent | Fußmatten Velours | Getränkehalter mit Kühlfunktion / Wärmefunktion | Getriebe Sport-Automatic - mit Steptronic (8-Stufen) | Heckspoiler (M Carbon) | Heckspoiler (M-Technic) | Innenausstattung: Glas-Applikationen (CraftedClarity) für Bedienelemente | Innenausstattung: Interieurleisten Carbon | Innenausstattung: Interieurleisten Edelholz Fineline mit Metalleffekt | Karosserie: 5-türig | Mild-Hybrid 390 kW (Motor 4,4 Ltr. - 390 kW) | Modellpflege | Motor 4,4 Ltr. - 390 kW V8 Mild-Hybrid (S 68) | Personalisierungssystem (Personal eSIM) | Radstand Standard | Schadstoffarm nach Abgasnorm Euro 6d | Service-System: ConnectedDrive Services | Sicherheitsgurte M | Sicherheitssystem Active Protection | Sitzbezug / Polsterung: Ledernachbildung Sensafin | Sonnenschutzrollo an Türscheiben hinten | Sport-Automatic Getriebe | Sportdifferential | Travel und Comfort System | Warndreieck | #Sport | M Sport Pro Paket | Sport-Auspuffanlage M", "a7/a7dc8d85-ed43-4ab1-96c6-ee60a0e7ea0d": "#Egyéb | Advanced 3D Bang & Olufsen Soundsystem Ambiente-Lichtpaket | Beheizte und wärmereflektierende Windschutzscheibe Beheiztes Multifunktions-Sportlenkrad in Vollleder mit dunklem Chrom und roter Markierung | Bremssättel in Gelb | DAB Radio | Dark Package | Einsätze aus schwarz eloxiertem und gebürstetem Aluminium Getönte Scheiben, schall- und wärmegedämmt | Hinteres Lamborghini Logo in mattschwarz | Lüftungsschlitze auf der Motorhaube in Wagenfarbe Mattschwarze Endrohre | Off-Road Modes | Panoramadach | Parkassistenzpaket mit Remote Park Assist | Rücksitze beheizbar | Soft Close | Stitching am Lenkrad in Nero Ade | Stitching in Nero Ade | Style-Paket in Karosseriefarbe mit Frontsplitter Unicolor Leder - Nero Ade | Vollständig elektrisch einstellbare Vordersitze mit Belüftung und Massage | 23\"-Taigete schwarz glänzend | 3 Jahre Garantie | 3 Jahre Wartungspaket | uvm. | #Egyéb", "f6/f677662b-60fa-4f36-9332-2ebca3215f12": "#Egyéb | Farbe: Rosso | Innen: Vollleder schwarz | Radio | Leichtmetallfelgen | elektrsiche Fensterheber | elektronische Wegfahrsperre | ... | #Egyéb | #Egyéb", "90/90411835-0048-491c-80bf-773d3e6abfa5": "#Egyéb | 0E0E Chromitschwarzmetallic | #Egyéb | AV Lederausstattung Schwarz, Glattleder | #Egyéb | Q1J Adaptive Sportsitze vorn (18-Wege, elektrisch) | JH2 Beifahrerdisplay | 1LU Bremssättel lackiert in Schwarz (hochglanz) | 1D3 Elektrisch ausklappbare Anhangezugvorrichtung | KS1 Head-Up Display | 5MH Interieur-Paket Carbon | PV4 Spurhalteassistent inklusive Nothaltefunktion | 9M9 Standheizung | 9WU Vorrüstung Porsche Rear Seat Entertainment | 3NS 2+1 Komfort-Fondsitzanlage | 58D 22-Loll RS Spyder Design Räder inklusive Radhausverbreiterungen in Exterieurfarbe | HD-Matrix LED-Hauptscheinwerfer abgedunkelt | GT-Sportlenkrad inklusive Lenkradheizung | BOSE® Surround Sound-System | Sport Chrono Paket | Sport Design Bugteil | Sportendrohre dunkelbronze | Luftfederung | Panorama Dachsystem | Sitzheizung vorn | Exterieur-Paket Schwarz (hochglanz) | Excluisve Design Tankdeckel | Porsche Schriftzug lackiert in Schwarz (hochglanz) | Servolenkung Plus | Adaptive Luftfederung mit Niveauregulierung inkl. PASM | 90 Liter Kraftstofftankt | Privacy-Verglasung | Interieur-Paket Aluminium gebürstet in Schwarz | Türeinstiegsblenden Aluminium gebürstet in Schwarz, beleuchtet | Porsche Wappen auf Kopfstützen Vordersitze | ParkAssistent inklusive Surround View (360-Grad-Kamera) | Surround View inklusive Aktive Einparkunterstützung | Verkehrszeichenerkennung | Spurwechselassistent | Abstandstempomat | Komfortzugang (Keyless-Go) | Soft-Close-Türen | Ambientebeleuchtung | Alarmanlage inkl. Innenraumüberwachung | Memory-Paket für Fahrer und Beifahrer | Smartphone-Ablage inkl. kabellosem Laden | Sprachsteuerung | #Egyéb | #Egyéb", "21/21517196-1dbe-4130-873d-60971294348b": "#Egyéb | 2T Tiefschwarz Metallic | EL Lederausstattung Clubleder in Basaltschwarz und Textil PASCHA in Schwarz/Darksilver | 2Y2 Targa Bügel in Schwarz (seidenglanz) | 1V Verdeck Schwarz | 59C 20-/21-Zoll RS Spyder Räder lackiert in Darksilver (seidenglanz) | QE3 Ablagenetz Beifahrerfußraum | Q1J Adaptive Sportsitze Plus (18-Wege, elektrisch) mit Memory-Paket | 6FU Außenspiegel lackiert in Exterieurfarbe | AYG Bordmappe Heritage Design | 9VL BOSE Surround Sound-System | ALC Cupholderblende Leder | 6BC Einleger Lamellen im Heckdeckel lackiert in Schwarz (hochglanz) | 0NA Entfall Modellbezeichnung | AYE Fußmatten Heritage Design | VC2 Garagentoröffner nach HomeLink Standard | 2PJ GT-Sportlenkrad in Leder inklusive Lenkradheizung | 8JU HD-Matrix LED-Hauptscheinwerfer abgedunkelt | 04P Heritage Design Paket PASCHA | 4F2 Komfortzugang | 2UH Liftsystem Vorderachse | 3V1 Porsche InnoDrive inkl. Abstandsregeltempomat | 4KT Privacy Verglasung | 1N3 Servolenkung Plus | 5XH Sonnenblenden Leder | 8HL Sport Chrono Paket inklusive Porsche Track Precision App & Reifentemperaturanzeige | 0P9 Sportabgasanlage (Endrohrblenden in Schwarz) | 2D1 SportDesign Paket | 2TK Sportsitz Plus Rückenlehne Leder mit Dekorelement PASCHA | 7Y8 Spurwechselassistent | FT3 Surround View inklusive Aktive Einparkunterstützung | VT2 Türeinstiegsblenden Aluminium gebürstet in Darksilver, beleuchtet | QK3 Vorrüstung Porsche Dashcam | 4GP Windschutzscheibe mit Graukeil | #Egyéb"};
const isJunkFelsz = (s) => { s = String(s == null ? '' : s); return s.trim().length < 40 || /\bPkw\b|Impressum|Datenschutz|Barrierefreiheit|Vertrag widerrufen|Report Security/i.test(s); };
const felszFor = (c) => { const k = String(c.kulcs || '').trim(); if (k && EQUIP_OVERRIDE[k] && isJunkFelsz(c.felszereltseg)) return EQUIP_OVERRIDE[k]; return c.felszereltseg; };

// Equipment: "#Category | item | item | #Category2 | item ..."
function equipmentOf(c) {
  const parts = String(felszFor(c) || "").split("|").map((s) => s.trim()).filter(Boolean);
  const cats = [];
  let cur = null;
  for (const p of parts) {
    if (p.startsWith("#")) { cur = { title: p.replace(/^#/, "").trim(), items: [] }; cats.push(cur); }
    else { if (!cur) { cur = { title: "Felszereltség", items: [] }; cats.push(cur); } const t = translateEquip(p); if (t && !cur.items.includes(t)) cur.items.push(t); }
  }
  return cats.filter((c) => c.items.length);
}

// Manually added cars not (yet) in the sheet — appended to the sheet rows at build.
const EXTRA_CARS = [
  {"modell": "Porsche Panamera GTS/Standheizung/Allradlenkung/PTV/Pano", "marka": "Porsche", "karosszeria": "Limuzin", "km": "21.970 km", "teljesitmeny": "500 LE", "valto": "Automata", "uzemanyag": "Benzin", "evjarat": "04/2025", "hajtas": "Összkerékhajtás", "berlet_eur": "", "vetel_eur": "149890", "vetel_eur_netto": "125958", "kep_url": "https://img.classistatic.de/api/v1/mo-prod/images/c2/c25bffa2-9097-4bc2-8296-f47fa38dab19?rule=mo-1600", "kiemelt": "", "felszereltseg": "#Egyéb | Ablage-Paket, Adaptive Sportsitze inkl. Sitzverstellung 18-Wege und Memory-Paket | Fahrer-Memory-Paket | Außenspiegel elektr. verstellbar, mit Memory | Lenksäule (Lenkrad) elektr. verstellbar | Außenspiegel lackiert, Außenspiegel Unterschale lackiert | Bremssättel schwarz (Hochglanz) | Dachhimmel Race-Tex | Einstiegsblenden (Carbon) beleuchtet | Fahrassistenz-System: aktiver Park-Assistent vorn und hinten inkl. Rückfahrkamera und Surround View | Fensterzierleisten schwarz (Hochglanz) | Head-up-Display | Home-Link (Garagentoröffner) | Interieur-Paket: Carbon | Interieur-Paket: GTS (Leder/Race-Tex, Ziernähte in Kontrastfarbe) | Ionisator zur Luftreinigung | Kopfstützen vorn und hinten mit Porschewappen | Lenkrad heizbar (GT Sport / Leder) mit Multifunktion und Schaltfunktion | LM-Felgen (lackiert), LM-Felgen vorn/hinten: 9,5x21 / 11,5x21 (Panamera Exclusive Design Rad) | Metallic-Lackierung | Modellbezeichnung lackiert | Panorama-Schiebedach zweiteilig vorn elektrisch | Porsche Torque Vectoring Plus (PTV Plus) | Schwellerabdeckung / -verkleidung Wagenfarbe Sportdesign | Sound-System BOSE | Sport-Design-Paket schwarz Hochglanz | Standheizung | Tankdeckel Exclusive Design | Verglasung hinten abgedunkelt (Privacyverglasung) | Vierradlenkung | Ziffernblatt farbig | Sport Chrono Stoppuhr", "galeria": "https://img.classistatic.de/api/v1/mo-prod/images/c2/c25bffa2-9097-4bc2-8296-f47fa38dab19?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/40/40bf255d-11a0-4b2d-a385-43d6503d5be2?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/65/653110b8-56a5-4782-a2f0-b51cc27c4b05?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/e6/e67d9dcc-a9ec-4ffb-8b04-c438fd45fe6a?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/a0/a0aeb8a8-3806-4f62-a187-a47ffae995cc?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/be/bede2478-76df-4980-837c-8211ce560b8a?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/f8/f821cf0a-95c0-48a9-845d-0695cbc55c34?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/16/164a66c4-d540-4293-88c0-8e3fa4385f8f?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/d0/d09de451-1bff-4c2c-8245-6f26f5995443?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/94/94f941db-d0b2-4980-8992-fe96c9fface6?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/90/90919828-d9d7-4626-83b5-25425a146ee1?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/0c/0cc24c64-cc91-40a8-ba15-364a6daf1935?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/98/989cbfa4-a107-47d4-b08f-30e21b6ae704?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/d6/d6bbc053-1f32-4e31-bf2c-feeeffaeec89?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/35/350b5e04-fc69-41a2-8815-775c988741c1?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/c7/c7157254-db74-4bd2-ae72-a0f7f1f1b288?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/ca/ca40b236-7567-4d66-ae35-d3bdec04675b?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/f6/f6fa9815-9ab2-4086-a2c3-6e4cfb251f56?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/9f/9fc330fa-35f7-44db-984d-4bd9fc695a33?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/1f/1f5a10b2-a7c3-44f6-8d1d-45fffa891b38?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/79/79f01e10-574a-4aee-b277-cb0422c5cec6?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/4b/4b58f1cd-e1c2-4e36-b2e3-9347e3b44efa?rule=mo-1600, https://img.classistatic.de/api/v1/mo-prod/images/a6/a62e93bb-90a2-4e2f-9761-c1106900ca8d?rule=mo-1600", "aktiv": "igen", "sajat": "", "forras": "wega", "kulcs": "c2/c25bffa2-9097-4bc2-8296-f47fa38dab19"}
];

function priceOf(c, rate) {
  const hufUp = (e) => Math.ceil((Number(e) || 0) * rate / 10000) * 10000;
  // Show the NET price everywhere (áfa nélkül). Fall back to gross/1.19 if net missing.
  const eur = nEur(c.vetel_eur_netto) || nEur(c.vetel_eur) / 1.19;
  const main = hufUp(eur);
  return { eur, main, huGross: 0, save: 0 };
}
// Cars sold / no longer listed on mobile.de — hidden even if still "igen" in the sheet.
const SOLD_OUT = [/range\s*rover\s*5\.?0\s*sv/i, /t6\s*multivan/i, /fiorino/i];
const isActive = (c) => {
  if ((c.aktiv || "igen").toLowerCase() === "nem") return false;
  const m = String(c.modell || "");
  if (SOLD_OUT.some((re) => re.test(m))) return false;
  return true;
};
const isOwn = (c) => (c.sajat || "").toLowerCase() === "igen";
const specStr = (c) => [c.km, c.valto, c.uzemanyag].filter(Boolean).join(" · ");

// CSV parser (quoted fields, embedded newlines)
function parseCSV(t) {
  const rows = []; let i = 0, f = "", row = [], q = false;
  while (i < t.length) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else { if (ch === '"') q = true; else if (ch === ",") { row.push(f); f = ""; }
      else if (ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (ch === "\r") {} else f += ch; }
    i++;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.some((x) => x && x.trim())).map((r) => {
    const o = {}; head.forEach((h, i) => (o[h] = (r[i] || "").trim())); return o;
  });
}

async function getRate() {
  const apis = [
    ["https://api.frankfurter.app/latest?from=EUR&to=HUF", (d) => d?.rates?.HUF],
    ["https://open.er-api.com/v6/latest/EUR", (d) => d?.rates?.HUF],
  ];
  for (const [url, pick] of apis) {
    try {
      const ctl = AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined;
      const r = await fetch(url, ctl ? { signal: ctl } : {});
      if (!r.ok) continue;
      const v = pick(await r.json());
      if (v && v > 0) return Math.round(v);
    } catch (_) {}
  }
  return DEFAULT_RATE;
}

// --------------------------------------------------------------- shared UI
const FONT =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">';

const BASE_CSS = `
:root{--font:'Plus Jakarta Sans',system-ui,sans-serif;--navy:#0B0B0D;--red:#E2001A;--ink:#141519;--muted:#5A6B82;--line:#E6EAF1;--bg:#F4F7FB;--soft:#EEF1F6;--radius:16px;--navh:80px}
*{box-sizing:border-box}html,body{margin:0;width:100%;max-width:100vw;overflow-x:clip}
body{font-family:var(--font);background:var(--bg);color:var(--ink);line-height:1.5}
a{color:inherit}
img{max-width:100%}
.wrap{width:100%;max-width:1160px;margin:0 auto;padding:28px 16px}
.btn{display:inline-block;text-align:center;font-weight:700;padding:13px 22px;border-radius:999px;text-decoration:none;cursor:pointer;transition:background .15s,color .15s}
.btn-primary{background:var(--navy);color:#fff}.btn-primary:hover{background:#000}
.btn-red{background:var(--red);color:#fff}.btn-red:hover{filter:brightness(.94)}
.btn-soft{background:var(--soft);color:var(--ink)}.btn-soft:hover{background:var(--navy);color:#fff}
/* header/nav */
.ca-navwrap{position:sticky;top:0;z-index:1000;display:flex;justify-content:center;padding:32px 14px 0}
.ca-nav{position:relative;width:100%;max-width:1200px;display:flex;align-items:center;gap:14px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 22px 8px 22px;box-shadow:0 14px 40px rgba(8,8,10,.20)}
.ca-nav .brand{display:flex;align-items:center;flex-shrink:0;text-decoration:none}.ca-nav .brand img{height:30px;width:auto;display:block}
.ca-nav .menu{list-style:none;display:flex;align-items:center;gap:6px;margin:0;padding:0;flex:1;justify-content:center}
.navitem{position:relative}
.navlink{border:0;background:transparent;font:inherit;font-weight:700;font-size:15px;color:var(--ink);padding:12px 15px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:color .15s;text-decoration:none}
.navlink .chev{font-size:13px;color:var(--muted);transition:transform .15s}
.navitem:hover .navlink{color:var(--red)}.navitem:hover .navlink .chev{transform:rotate(180deg);color:var(--red)}
.dropdown{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(4px);min-width:236px;padding-top:12px;opacity:0;visibility:hidden;transition:opacity .16s,transform .16s;z-index:1001}
.navitem:hover .dropdown{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
.dd-inner{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 50px rgba(8,8,10,.18);padding:8px;display:flex;flex-direction:column}
.ddi{display:block;padding:10px 14px;border-radius:10px;text-decoration:none;color:var(--ink);font-weight:600;font-size:14px;white-space:nowrap;transition:.12s}
.ddi:hover{background:#F4F7FB;color:var(--red)}
.navright{display:flex;align-items:center;gap:12px;flex-shrink:0}
.kapcsolat{display:inline-flex;align-items:center;gap:8px;background:var(--navy);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:999px;white-space:nowrap;transition:transform .15s,box-shadow .15s,background .15s;box-shadow:0 6px 18px rgba(11,11,13,.22)}
.kapcsolat::after{content:"→";font-size:15px;transition:transform .15s}
.kapcsolat:hover{background:var(--red);box-shadow:0 8px 22px rgba(226,0,26,.4);transform:translateY(-1px)}.kapcsolat:hover::after{transform:translateX(3px)}
.navflag{width:28px;height:28px;border-radius:50%;flex:0 0 auto;background-size:cover;background-position:center;box-shadow:0 0 0 1px rgba(11,11,13,.12),0 2px 6px rgba(0,0,0,.15)}
.lang{position:relative}
.langbtn{display:inline-flex;align-items:center;gap:6px;background:transparent;border:0;border-radius:999px;padding:4px 6px;cursor:pointer}
.langbtn:hover{background:#F4F7FB}
.langbtn .lchev{width:7px;height:7px;border-right:2px solid #9aa4b2;border-bottom:2px solid #9aa4b2;transform:rotate(45deg);margin-top:-3px}
.langmenu{position:absolute;top:100%;right:0;margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 50px rgba(8,8,10,.18);padding:8px;display:none;flex-direction:column;min-width:192px;z-index:1002}
.lang.open .langmenu{display:flex}
.langopt{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;text-decoration:none;color:var(--ink);font-weight:600;font-size:14px;white-space:nowrap}
.langopt:hover{background:#F4F7FB;color:var(--red)}
.lf{width:22px;height:22px;border-radius:50%;flex:0 0 auto;background-size:cover;background-position:center;box-shadow:0 0 0 1px rgba(11,11,13,.12)}
.m-langtitle{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:12px 12px 6px}
.m-langs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 6px 8px}
.m-langopt{display:flex;align-items:center;gap:9px;padding:10px;border-radius:10px;text-decoration:none;color:var(--ink);font-weight:600;font-size:14px}
.m-langopt:hover{background:#F4F7FB;color:var(--red)}
.burger{display:none;flex-direction:column;justify-content:center;gap:4px;width:44px;height:44px;border:1px solid var(--line);background:#F4F7FB;border-radius:12px;cursor:pointer;padding:0}
.burger span{display:block;width:20px;height:2px;background:var(--ink);margin:0 auto;border-radius:2px;transition:.2s}
.ca-navwrap.open .burger span:nth-child(1){transform:translateY(6px) rotate(45deg)}
.ca-navwrap.open .burger span:nth-child(2){opacity:0}
.ca-navwrap.open .burger span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
.mobilepanel{display:none;position:absolute;top:calc(100% + 8px);left:14px;right:14px;background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 24px 60px rgba(8,8,10,.24);padding:10px;max-height:76vh;overflow:auto;z-index:1001}
.ca-navwrap.open .mobilepanel{display:block}
.m-acc{border-bottom:1px solid var(--line)}
.m-accbtn{width:100%;display:flex;justify-content:space-between;align-items:center;background:none;border:0;font:inherit;font-weight:700;font-size:16px;color:var(--ink);padding:15px 12px;cursor:pointer}
.m-plus{font-size:20px;color:var(--muted);font-weight:400}.m-acc.open .m-plus{transform:rotate(45deg)}
.m-sub{display:none;flex-direction:column;padding:0 12px 10px}.m-acc.open .m-sub{display:flex}
.m-sub a{padding:9px 8px;text-decoration:none;color:var(--muted);font-weight:600;font-size:14.5px}.m-sub a:hover{color:var(--red)}
.m-kapcsolat{display:block;text-align:center;background:var(--navy);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:15px;border-radius:999px;margin:12px 6px 6px}
@media(max-width:1024px){.ca-nav .menu{display:none}.kapcsolat{display:none}.lang{display:none}.burger{display:flex}.ca-nav{gap:10px;padding:8px 12px}.navright{margin-left:auto}}
/* footer */
.footer{background:var(--navy);color:#cfd6e2;margin-top:56px}
.footer-in{max-width:1160px;margin:0 auto;padding:40px 20px 28px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px}
@media(max-width:760px){.footer-in{grid-template-columns:1fr}}
.footer h4{color:#fff;font-size:15px;margin:0 0 12px}
.footer a{color:#cfd6e2;text-decoration:none;display:block;margin:7px 0;font-size:14px}
.footer a:hover{color:#fff}
.footer .brand{height:40px;width:auto;display:block;margin-bottom:4px}
.footer .copy{border-top:1px solid rgba(255,255,255,.12);text-align:center;padding:16px;font-size:12.5px;color:#8b95a7}
`;

function navHtml(rel) {
  const cat = rel + "autoink/";
  const items = [
    ["Prémium autóbérlés", [["Bérelhető autóink", "#"], ["Rövid távú bérlés", "#"], ["Hosszú távú bérlés", "#"], ["Flotta kezelés", "#"], ["Feltételek", "#"]]],
    ["Megvásárolható autóink", [["Autóink", cat], ["Új autóink – egyedi rendelés", "#"], ["Finanszírozás – lízing", "#"], ["Előnyök", "#"]]],
    ["Bizományos értékesítés", [["Autóink", cat], ["Eladom az autómat", "#"], ["Jótékonyság", "#"], ["Értékesítési folyamat", "#"], ["Gyakori kérdések", "#"]]],
    ["Import", [["Autó rendelés", "#"], ["Beszerzési folyamat", "#"], ["Előnyök", "#"], ["Referenciák", "#"]]],
    ["Rólunk", [["Miért mi?", "#"], ["Caradvance Garancia", "#"], ["Caradvance Hungary", "#"], ["Referenciák", "#"], ["Partnereink", "#"], ["Media", "#"], ["Blog", "#"]]],
  ];
  const langs = [
    ["hu", "Magyar", rel], ["en", "English", "#"], ["de", "Deutsch", "#"], ["fr", "Français", "#"],
    ["sk", "Slovenčina", "#"], ["cs", "Čeština", "#"], ["pl", "Polski", "#"], ["uk", "Українська", "#"], ["zh", "中文", "#"],
  ];
  const fcc = { hu: "hu", en: "gb", de: "de", fr: "fr", sk: "sk", cs: "cz", pl: "pl", uk: "ua", zh: "cn" };
  const langMenu = langs.map(([c, name, href]) => `<a class="langopt" href="${attr(href)}"><span class="lf" style="background-image:url(https://flagcdn.com/w80/${fcc[c]}.png)"></span><span>${esc(name)}</span></a>`).join("");
  const mobileLangs = langs.map(([c, name, href]) => `<a class="m-langopt" href="${attr(href)}"><span class="lf" style="background-image:url(https://flagcdn.com/w80/${fcc[c]}.png)"></span><span>${esc(name)}</span></a>`).join("");
  const desktop = items.map(([label, subs]) =>
    `<li class="navitem"><button class="navlink" type="button">${esc(label)}<span class="chev">⌄</span></button><div class="dropdown"><div class="dd-inner">${subs.map(([t, h]) => `<a class="ddi" href="${attr(h)}">${esc(t)}</a>`).join("")}</div></div></li>`).join("");
  const mobile = items.map(([label, subs]) =>
    `<div class="m-acc"><button class="m-accbtn" type="button">${esc(label)}<span class="m-plus">+</span></button><div class="m-sub">${subs.map(([t, h]) => `<a href="${attr(h)}">${esc(t)}</a>`).join("")}</div></div>`).join("");
  return `<div class="ca-navwrap"><nav class="ca-nav" aria-label="Főmenü">
  <a class="brand" href="${rel}"><img src="${rel}caradvance-logo.webp" alt="CarAdvance — the automotive people" width="403" height="133"></a>
  <ul class="menu">${desktop}</ul>
  <div class="navright">
    <a class="kapcsolat" href="mailto:${CONTACT_EMAIL}">Kapcsolat</a>
    <div class="lang"><button class="langbtn" type="button" aria-label="Nyelvváltás"><span class="navflag" style="background-image:url(https://flagcdn.com/w80/hu.png)"></span><span class="lchev"></span></button><div class="langmenu">${langMenu}</div></div>
    <button class="burger" type="button" aria-label="Menü"><span></span><span></span><span></span></button>
  </div>
</nav>
<div class="mobilepanel">${mobile}<a class="m-kapcsolat" href="mailto:${CONTACT_EMAIL}">Kapcsolat</a><div class="m-langtitle">Nyelv</div><div class="m-langs">${mobileLangs}</div></div>
</div>`;
}
function footerHtml(rel) {
  return `<footer class="footer"><div class="footer-in">
  <div><img class="brand" src="${rel}caradvance-logo-white.webp" alt="CarAdvance" width="403" height="133">
    <p style="margin:12px 0 0;max-width:34ch;font-size:14px">Prémium autók Németországból — bérlés, megvásárolható autók, import és bizományos értékesítés.</p></div>
  <div><h4>Menü</h4>
    <a href="${rel}autoink/">Megvásárolható autóink</a>
    <a href="${rel}#berles">Prémium autóbérlés</a>
    <a href="${rel}#bizomany">Bizományos értékesítés</a>
    <a href="${rel}#import">Import</a></div>
  <div><h4>Kapcsolat</h4>
    <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    <a href="${rel}#rolunk">Rólunk</a></div>
</div><div class="copy">© ${new Date().getFullYear()} ${BRAND} · BH Group</div></footer>`;
}

// EUR->HUF live refresh (content already server-rendered; this only fine-tunes prices)
const FX_SCRIPT = `<script>
(function(){var R=${DEFAULT_RATE};
function up(e){var eur=+e.getAttribute('data-eur')||0,net=+e.getAttribute('data-net')||0;
 var main=Math.ceil(eur*R/10000)*10000, gross=Math.ceil((net||eur/1.19)*1.27*R/10000)*10000, save=gross-main;
 var f=function(v){return v.toLocaleString('hu-HU')+' Ft'};
 var mE=e.querySelector('[data-main]'); if(mE)mE.textContent=f(main);
 var cE=e.querySelector('[data-cross]'); if(cE&&save>0)cE.textContent=f(gross);
 var sE=e.querySelector('[data-save]'); if(sE&&save>0)sE.textContent='−'+f(save);}
function all(){document.querySelectorAll('[data-eur]').forEach(up);}
fetch('https://api.frankfurter.app/latest?from=EUR&to=HUF',{cache:'no-store'})
 .then(function(r){return r.json()}).then(function(d){if(d&&d.rates&&d.rates.HUF){R=Math.round(d.rates.HUF);all();var rv=document.getElementById('ratev');if(rv)rv.textContent=R;}}).catch(function(){});
})();
</script>`;

const NAV_SCRIPT = `<script>
(function(){var w=document.querySelector('.ca-navwrap');if(!w)return;
var b=w.querySelector('.burger');if(b)b.addEventListener('click',function(){w.classList.toggle('open');});
w.querySelectorAll('.m-accbtn').forEach(function(x){x.addEventListener('click',function(){x.parentElement.classList.toggle('open');});});
var lang=w.querySelector('.lang'),lb=w.querySelector('.langbtn');if(lb)lb.addEventListener('click',function(e){e.stopPropagation();lang.classList.toggle('open');});document.addEventListener('click',function(){if(lang)lang.classList.remove('open');});})();
</script>`;

// ---- "Under construction" gate ---------------------------------------
// Flip CONSTRUCTION to false (and rebuild) to open the site to the public.
// Change ACCESS_CODE to whatever you want to share with the team.
const CONSTRUCTION = true;
const ACCESS_CODE = "CarAdvance2027";
const GATE_HEAD = CONSTRUCTION ? `<meta name="robots" content="noindex,nofollow">
<script>(function(){try{if(localStorage.getItem('ca_ok')===${JSON.stringify(ACCESS_CODE)})document.documentElement.classList.add('ca-ok');}catch(e){}})();</script>
<style>html:not(.ca-ok) body{overflow:hidden}
#ca-gate{position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#0B0B0D,#26272C);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',system-ui,sans-serif;text-align:center;padding:24px}
html.ca-ok #ca-gate{display:none}
#ca-gate .box{max-width:460px;width:100%}
#ca-gate img{height:56px;width:auto;margin:0 auto 28px;display:block}
#ca-gate h1{font-size:32px;font-weight:800;margin:0 0 12px;letter-spacing:-.02em}
#ca-gate p{color:#c7cdd6;font-size:16px;line-height:1.55;margin:0 0 28px}
#ca-gate form{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
#ca-gate input{flex:1;min-width:180px;max-width:260px;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:16px;outline:none}
#ca-gate input::placeholder{color:#9aa4b2}
#ca-gate button{background:#E2001A;color:#fff;border:0;border-radius:12px;padding:14px 24px;font-weight:800;font-size:16px;cursor:pointer}
#ca-gate .err{color:#ff8a8a;font-size:14px;margin-top:16px;min-height:18px;font-weight:600}</style>` : "";
function gateBody(rel) {
  if (!CONSTRUCTION) return "";
  return `<div id="ca-gate"><div class="box">
  <img src="${rel}caradvance-logo-white.webp" alt="CarAdvance">
  <h1>Hamarosan indul</h1>
  <p>Weboldalunk még építés alatt áll. Ha rendelkezel belépési kóddal, itt megtekintheted az előnézetet.</p>
  <form onsubmit="return caGate(event)"><input id="ca-code" type="password" placeholder="Belépési kód" autocomplete="off" autofocus><button type="submit">Belépés</button></form>
  <div class="err" id="ca-err"></div>
</div></div>
<script>function caGate(e){e.preventDefault();var v=(document.getElementById('ca-code').value||'').trim();if(v===${JSON.stringify(ACCESS_CODE)}){try{localStorage.setItem('ca_ok',v);}catch(_){}document.documentElement.classList.add('ca-ok');}else{document.getElementById('ca-err').textContent='Hibás kód, próbáld újra.';}return false;}</script>`;
}

function page({ title, desc, canonical, rel, css, body, head = "", bodyClass = "" }) {
  return `<!doctype html><html lang="hu"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${attr(canonical)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${attr(canonical)}"><meta property="og:locale" content="hu_HU">
<meta name="twitter:card" content="summary_large_image">
${FONT}
<style>${BASE_CSS}${css || ""}</style>
${head}
${GATE_HEAD}
</head><body class="${bodyClass}">
${gateBody(rel)}
${navHtml(rel)}
${body}
${footerHtml(rel)}
${NAV_SCRIPT}
${FX_SCRIPT}
</body></html>`;
}

// --------------------------------------------------------------- car card
function cardCss() {
  return `
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
@media(max-width:920px){.grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;position:relative;text-decoration:none;color:inherit;transition:transform .18s,box-shadow .18s}
.card:hover{transform:translateY(-3px);box-shadow:0 16px 36px rgba(8,8,10,.12);border-color:#d6deea}
.media{aspect-ratio:16/10;background:linear-gradient(135deg,#1A1B1F,#26272C);position:relative;overflow:hidden}
.media img{width:100%;height:100%;object-fit:cover;display:block}
.media .ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#7a828f;font-size:12px}
.own{position:absolute;top:12px;left:12px;background:#fff;border-radius:999px;padding:6px 11px;font-size:11px;font-weight:800;color:var(--navy);box-shadow:0 4px 12px rgba(8,8,10,.25)}
.body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1}
.meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.cond{background:var(--soft);color:var(--muted);font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px}
.year{color:var(--muted);font-size:13px;font-weight:700}
.title{font-size:17px;font-weight:800;letter-spacing:-.01em;margin:0 0 6px;overflow-wrap:anywhere;word-break:break-word;min-width:0}
.card .body{min-width:0}
.specs{color:var(--muted);font-size:13px;font-weight:600;margin-bottom:14px}
.pricerow{display:flex;align-items:baseline;gap:10px;margin-top:auto;flex-wrap:wrap}
.pcross{width:100%;color:var(--muted);font-size:14px;font-weight:700;text-decoration:line-through}
.price{font-size:23px;font-weight:800}.peur{color:var(--muted);font-size:14px;font-weight:700}
.psave{background:#E7F8EE;color:#1DA851;font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px}
.cbtn{margin-top:14px;display:block;text-align:center;background:var(--soft);color:var(--ink);font-weight:700;padding:12px;border-radius:999px}
.card:hover .cbtn{background:var(--navy);color:#fff}
.feat{position:absolute;top:12px;right:12px;background:var(--red);color:#fff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;z-index:2}
.autok-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:8px 0 22px}
.autok-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:5px}
.autok-tab{border:0;background:transparent;font:inherit;font-weight:700;font-size:14px;color:var(--ink);padding:10px 20px;border-radius:999px;cursor:pointer;transition:.2s}
.autok-tab.on{background:var(--navy);color:#fff}
.autok-tab:not(.on):hover{background:#F0F3F8}
.autok-panel{display:none}.autok-panel.on{display:block}
.autok-more{text-align:center;margin-top:24px}
.rate-note{margin-top:16px;font-size:12.5px;color:var(--muted);text-align:center}
`;
}
function carCard(c, rate, rel) {
  const g = galleryOf(c);
  const p = priceOf(c, rate);
  const href = `${rel}auto/${slugify(c.modell)}/`;
  const img = g[0]
    ? `<img src="${attr(g[0])}" alt="${attr((c.modell || "").trim())}" loading="lazy" referrerpolicy="no-referrer"><span class="ph" style="display:none">fotó hamarosan</span>`
    : `<span class="ph">fotó hamarosan</span>`;
  const cross = p.save > 0 ? `<span class="pcross" data-cross>${fmtHUF(p.huGross)}</span>` : "";
  const save = p.save > 0 ? `<span class="psave" data-save>−${fmtHUF(p.save)}</span>` : "";
  return `<a class="card" href="${attr(href)}" data-marka="${attr(c.marka || "")}" data-kar="${attr(c.karosszeria || "")}" data-uz="${attr(c.uzemanyag || "")}"><div class="media">${img}</div>
  <div class="body"><div class="meta"><span class="cond">Használt</span><span class="year">${esc(c.evjarat || "")}</span></div>
  <h3 class="title">${esc((c.modell || "").trim())}</h3>
  <div class="specs">${esc(specStr(c))}</div>
  <div class="pricerow" data-eur="${p.eur}" data-net="${nEur(c.vetel_eur_netto)}">${cross}<span class="price" data-main>${fmtHUF(p.main)}</span><span class="peur">${fmtEUR(p.eur)}</span>${save}</div>
  <span class="cbtn">Részletek</span></div></a>`;
}

// Featured card with "Kiemelt" badge; mode "sale" (default) or "rent"
function featCard(c, rate, mode) {
  const g = galleryOf(c);
  const href = `auto/${slugify(c.modell)}/`;
  const img = g[0]
    ? `<img src="${attr(g[0])}" alt="${attr((c.modell || "").trim())}" loading="lazy" referrerpolicy="no-referrer"><span class="ph" style="display:none">fotó hamarosan</span>`
    : `<span class="ph">fotó hamarosan</span>`;
  const spec = [c.km, c.teljesitmeny, c.valto, c.uzemanyag].filter(Boolean).join(" · ");
  let priceRow, cond;
  if (mode === "rent") {
    const eur = nEur(c.berlet_eur);
    const hufMo = Math.ceil((eur * rate) / 1000) * 1000;
    cond = "Bérelhető";
    priceRow = `<div class="pricerow"><span class="price">${eur.toLocaleString("hu-HU")} €/hó</span><span class="peur">≈ ${fmtHUF(hufMo)}/hó</span></div>`;
  } else {
    const p = priceOf(c, rate);
    cond = "Használt";
    const cross = p.save > 0 ? `<span class="pcross" data-cross>${fmtHUF(p.huGross)}</span>` : "";
    const save = p.save > 0 ? `<span class="psave" data-save>−${fmtHUF(p.save)}</span>` : "";
    priceRow = `<div class="pricerow" data-eur="${p.eur}" data-net="${nEur(c.vetel_eur_netto)}">${cross}<span class="price" data-main>${fmtHUF(p.main)}</span><span class="peur">${fmtEUR(p.eur)}</span>${save}</div>`;
  }
  return `<a class="card" href="${attr(href)}"><div class="media">${img}<span class="feat">Kiemelt</span></div>
  <div class="body"><div class="meta"><span class="cond">${cond}</span><span class="year">${esc(c.evjarat || "")}</span></div>
  <h3 class="title">${esc((c.modell || "").trim())}</h3>
  <div class="specs">${esc(spec)}</div>
  ${priceRow}
  <span class="cbtn">Részletek</span></div></a>`;
}

// --------------------------------------------------------------- HOME
const YT_SVG = '<svg viewBox="0 0 28 20" width="24" aria-label="YouTube"><rect width="28" height="20" rx="5" fill="#FF0000"/><path d="M11 6l7 4-7 4z" fill="#fff"/></svg>';
const GMARK = '<svg class="gmark" viewBox="0 0 48 48" width="20" height="20" aria-label="Google"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

const CONTENT_CSS = `
.cah{--navy-2:#1A1B1F;--navy-3:#26272C;--red-dark:#B80015;--card:#fff;--cr:22px;--shadow:0 14px 40px rgba(8,8,10,.10)}
.cah .wrap{max-width:1120px;margin:0 auto;padding:0 24px}
.cah .block{padding:56px 0}
.cah .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--red)}
.cah .eyebrow::before{content:"";width:26px;height:3px;background:var(--red);border-radius:2px}
.cah h2.sec-title{font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-.02em;color:var(--navy);margin:14px 0 12px}
.cah .card{background:var(--card);border:1px solid var(--line);border-radius:var(--cr);box-shadow:var(--shadow)}
.cah .reveal{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
.cah .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.cah .reveal{opacity:1;transform:none;transition:none}}
.cah .chip{display:inline-flex;align-items:center;gap:8px;background:#fff;color:var(--navy);font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;text-decoration:none;transition:transform .18s,box-shadow .18s}
.cah .chip:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.25)}
.cah .chip.cta{background:var(--red);color:#fff;box-shadow:0 12px 28px rgba(226,0,26,.38)}
.cah .chip.cta:hover{background:var(--red-dark)}
.cah .svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:38px}
.cah .svc{padding:34px 30px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.cah .svc-media{margin:-34px -30px 24px;height:185px;background:linear-gradient(135deg,var(--navy),var(--navy-3));display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:calc(var(--cr) - 1px) calc(var(--cr) - 1px) 0 0}
.cah .svc-media img{width:100%;height:100%;object-fit:cover;display:block}
.cah .svc .tag{align-self:flex-start;font-size:12.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--red);background:rgba(226,0,26,.09);padding:6px 12px;border-radius:999px;margin-bottom:16px}
.cah .svc h3{font-size:23px;font-weight:800;color:var(--navy);letter-spacing:-.01em;margin-bottom:10px}
.cah .svc p{color:var(--muted);font-size:15.5px;margin-bottom:18px}
.cah .svc ul{list-style:none;margin:0 0 24px;padding:0}
.cah .svc ul li{position:relative;padding-left:28px;font-size:14.5px;color:var(--ink);font-weight:600;margin-bottom:9px}
.cah .svc ul li::before{content:"";position:absolute;left:0;top:4px;width:17px;height:17px;border-radius:50%;background:var(--red);-webkit-mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>') center/100% no-repeat;mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>') center/100% no-repeat}
.cah .svc .btn{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:8px;background:var(--navy);color:#fff;font-weight:700;font-size:14.5px;padding:12px 22px;border-radius:999px;text-decoration:none;transition:background .18s,transform .18s}
.cah .svc .btn:hover{background:var(--navy-3);transform:translateY(-2px)}
.cah .svc .btn-row{margin-top:auto;display:flex;flex-wrap:wrap;gap:8px}
.cah .svc .btn-row .btn{margin-top:0;font-size:12.5px;padding:10px 13px;white-space:nowrap}
.cah .svc .btn-outline{background:#fff;color:var(--navy);border:2px solid var(--navy)}
.cah .svc .btn-outline:hover{background:var(--navy);color:#fff}
.cah .svc .btn-red{background:var(--red);color:#fff}
.cah .svc .btn-red:hover{background:var(--red);color:#fff;filter:brightness(.93)}
.cah .svc.charity-accent{border-top:4px solid var(--red)}
.cah .platforms{margin:2px 0 24px}
.cah .plat-lbl{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.cah .plat-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cah .plat{display:inline-flex;align-items:center;border-radius:10px;padding:8px 14px;border:1px solid var(--line);background:#fff}
.cah .plat-img{height:22px;width:auto;display:block}
.cah .plat-mobile{background:#340050;border-color:#340050;padding:6px 12px}.cah .plat-img-mb{height:24px}
.cah .plat-as24{background:#F4F200;border-color:#F4F200;padding:6px 12px}.cah .plat-img-as{height:26px}
.cah .plat-huhu{background:#1A1A1A;border-color:#1A1A1A;padding:6px 12px}.cah .plat-img-hu{height:22px}
.cah .plat-heycar{background:#072962;border-color:#072962;padding:6px 12px}.cah .plat-img-hc{height:26px}
.cah .soc{width:34px;height:34px;border-radius:9px;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(8,8,10,.12)}
.cah .soc img{width:100%;height:100%;object-fit:cover;display:block}
.cah .soc-yt{background:#fff;border:1px solid var(--line)}
.cah .charity{background:linear-gradient(160deg,var(--navy),var(--navy-2));color:#fff;border:none;padding:44px 40px;display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center;position:relative;overflow:hidden;margin-top:8px}
.cah .charity::before{content:"♥";position:absolute;right:-30px;bottom:-70px;font-size:280px;color:rgba(226,0,26,.14);line-height:1}
.cah .charity h3{font-size:clamp(22px,3vw,28px);font-weight:800;letter-spacing:-.01em;margin:12px 0 12px}
.cah .charity p{color:rgba(255,255,255,.84);font-size:15.5px}
.cah .charity .eyebrow{color:#fff}
.cah .charity-btn{margin-top:22px;position:relative}
.cah .charity-btn-mobile{display:none}
.cah .org-list{display:flex;flex-wrap:wrap;gap:10px;position:relative}
.cah .org-logo{background:#fff;border-radius:14px;padding:10px 14px;min-height:74px;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.22)}
.cah .org-logo img{height:54px;max-width:150px;width:auto;object-fit:contain;display:block}
.cah .org-sos{background:#009DE0}
.cah .why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:38px}
.cah .why{padding:26px 24px;display:flex;gap:16px;align-items:flex-start}
.cah .why .n{flex:0 0 auto;width:42px;height:42px;border-radius:12px;background:var(--navy);color:#fff;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center}
.cah .why h3{font-size:16px;font-weight:800;color:var(--navy);margin-bottom:5px}
.cah .why p{font-size:14px;color:var(--muted)}
.cah .why-special{background:linear-gradient(140deg,var(--red),var(--red-dark));border:none;position:relative;overflow:hidden;box-shadow:0 18px 44px rgba(226,0,26,.35)}
.cah .why-special::after{content:"♥";position:absolute;right:-14px;bottom:-34px;font-size:110px;color:rgba(255,255,255,.14);line-height:1}
.cah .why-special .n{background:#fff;color:var(--red);font-size:19px}
.cah .why-special h3{color:#fff}.cah .why-special p{color:rgba(255,255,255,.88)}
@media(max-width:960px){.cah .svc-grid{grid-template-columns:1fr}.cah .charity{grid-template-columns:1fr;padding:34px 26px}.cah .why-grid{grid-template-columns:1fr;max-width:560px;margin-left:auto;margin-right:auto}.cah .charity-btn:not(.charity-btn-mobile){display:none}.cah .charity-btn-mobile{display:inline-flex}}
`;

const CONTENT_CSS2 = `
.cah p.sec-lead{font-size:17px;color:var(--muted);max-width:640px;margin-top:6px}
.cah .values-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:38px}
.cah .value{padding:28px 24px;transition:transform .2s,box-shadow .2s}
.cah .value:hover{transform:translateY(-4px);box-shadow:0 20px 46px rgba(8,8,10,.14)}
.cah .value .ic{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.09);margin-bottom:16px}
.cah .value .ic svg{width:26px;height:26px;stroke:var(--red)}
.cah .value h3{font-size:17px;font-weight:800;color:var(--navy);margin-bottom:8px}
.cah .value p{font-size:14.5px;color:var(--muted)}
.cah .story-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;align-items:stretch;margin-top:24px}
.cah .story-text{display:flex;flex-direction:column;justify-content:space-between}
.cah .story-text p{color:var(--muted);font-size:16.5px;margin:0}
.cah .story-text p+p{margin-top:16px}
.cah .story-text p strong{color:var(--navy)}
.cah .mission{background:linear-gradient(160deg,var(--navy),var(--navy-2));color:#fff;border:none;padding:28px 30px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.cah .mission::before{content:"";position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(226,0,26,.22);filter:blur(10px)}
.cah .mission-logo{width:180px;height:auto;margin-bottom:16px;position:relative}
.cah .mission h3{font-size:21px;font-weight:800;margin-bottom:10px;position:relative}
.cah .mission p{color:rgba(255,255,255,.85);font-size:15px;position:relative}
.cah .mission-since{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);font-size:14px;position:relative}
.cah .mission-since strong{color:#fff}
.cah .mission .sig{margin-top:14px;font-weight:700;color:#fff;position:relative}
.cah .mission .sig span{display:block;font-weight:500;font-size:13.5px;color:rgba(255,255,255,.65)}
.cah .story-foot{margin-top:22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.cah .bhg-logo{width:60px;height:auto;border-radius:10px;box-shadow:0 6px 16px rgba(8,8,10,.14)}
.cah .story-more{background:var(--navy);color:#fff;display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:14.5px;padding:12px 22px;border-radius:999px;text-decoration:none;transition:background .18s,transform .18s}
.cah .story-more:hover{background:var(--red);transform:translateY(-2px)}
.cah .rev-summary{display:inline-flex;align-items:center;gap:10px;margin-top:16px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:10px 20px}
.cah .rev-summary b{font-size:18px}
.cah .rev-summary .rs-txt{color:#6B7688;font-size:14px}
.cah .gstars{color:#F4A300;letter-spacing:2px;font-size:16px;line-height:1}
.cah .rev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:32px}
.cah .rev-card{padding:22px;display:flex;flex-direction:column;gap:12px}
.cah .rev-card header{display:flex;align-items:center;gap:12px}
.cah .rev-av{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px;flex:none}
.cah .rev-card .who{flex:1;min-width:0}.cah .rev-card .gmark{flex:none}
.cah .rev-card .who b{display:block;font-size:14px;line-height:1.2;color:var(--navy)}
.cah .rev-card .who span{font-size:12px;color:#8A93A3}
.cah .rev-card p{font-size:14.5px;color:#3D4552;line-height:1.6;margin:0}
.cah .rev-foot{margin-top:22px;text-align:center;font-size:13px;color:#8A93A3}
.cah .rev-foot a{color:var(--navy);font-weight:700;text-decoration:none;display:inline-block;margin-top:6px}
.cah .rev-foot a:hover{color:var(--red)}
.cah .seo-copy{font-size:15.5px;color:#3D4756;max-width:820px}
.cah .seo-copy p{margin-bottom:14px}
.cah .seo-copy a{color:var(--red);font-weight:700;text-decoration:none}
.cah .seo-copy strong{color:var(--navy)}
.cah .faq-list{max-width:820px;display:flex;flex-direction:column;gap:12px;margin-top:26px}
.cah .faq-item{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
.cah .faq-item summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 22px;font-weight:700;font-size:16px;color:var(--navy)}
.cah .faq-item summary::-webkit-details-marker{display:none}
.cah .faq-item summary::after{content:"+";flex:none;width:26px;height:26px;border-radius:50%;background:var(--bg);color:var(--red);font-weight:800;display:flex;align-items:center;justify-content:center;transition:transform .2s}
.cah .faq-item[open] summary::after{transform:rotate(45deg)}
.cah .faq-item .faq-a{padding:0 22px 18px;font-size:15px;color:#3D4756;line-height:1.65}
.cah .faq-item .faq-a a{color:var(--red);font-weight:700;text-decoration:none}
@media(max-width:960px){.cah .values-grid{grid-template-columns:repeat(2,1fr)}.cah .story-grid{grid-template-columns:1fr}.cah .rev-grid{grid-template-columns:1fr}}
@media(max-width:560px){.cah .values-grid{grid-template-columns:1fr}}
`;

function svcCard({ img, alt, tag, title, lead, items, extra, accent }) {
  return `<div class="card svc${accent ? " charity-accent" : ""} reveal">
  <div class="svc-media"><img src="${attr(img)}" alt="${attr(alt)}" loading="lazy"></div>
  <span class="tag">${esc(tag)}</span><h3>${esc(title)}</h3>
  <p>${lead}</p>
  <ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
  ${extra}
</div>`;
}

function contentSections(rel) {
  const cat = rel + "autoink/";
  const svc = [
    svcCard({ img: rel + "piros-bmw-x6-m-premium-autoberles.webp", alt: "Piros BMW X6 M — prémium autóbérlés", tag: "Prémium autóbérlés", title: "Prémium autóbérlés",
      lead: "<strong>Miért vásárolnál, ha bérelhetsz?</strong> Élvezd a prémium autózás minden előnyét vásárlás nélkül — rugalmas, hosszú távú bérléssel, már fél évtől.",
      items: ["Válogatott prémium modellek", "Rugalmas futamidő — minimum 6 hónaptól", "Átadás-átvétel egyeztetett helyszínen"],
      extra: `<div class="btn-row"><a class="btn" href="${cat}">Autóink</a><a class="btn btn-red" href="${cat}">Új autó</a><a class="btn btn-outline" href="#">Rövid távú bérlés</a><a class="btn btn-outline" href="#">Hosszú távú bérlés</a></div>` }),
    svcCard({ img: rel + "bmw-m3-touring-premium-auto-eladas.webp", alt: "BMW M3 Touring — prémium autó eladás", tag: "Prémium autó eladás", title: "Prémium autó eladás",
      lead: "<strong>Miért kockáztatnál, ha biztosra is mehetsz?</strong> Kínálatunkban gondosan válogatott, bevizsgált prémium autók — egyenesen Németországból.",
      items: ["Leinformált, bevizsgált prémium modellek", "Autóink többsége érvényes gyári garanciával", "Finanszírozási lehetőség igény szerint"],
      extra: `<div class="btn-row"><a class="btn" href="${cat}">Autólista →</a><a class="btn btn-outline" href="#">Részletek</a><a class="btn btn-outline" href="#">Finanszírozás</a></div>` }),
    svcCard({ img: rel + "autoszallitas-autoimport-nemetorszagbol.webp", alt: "Autószállítás — autóimport Németországból", tag: "Autóimport", title: "Autóimport Németországból",
      lead: "<strong>Miért érnéd be a hazai kínálattal?</strong> A teljes német piac kínálata — pontosan a Te igényeid szerint, kulcsrakészen.",
      items: ["Leinformálás és helyszíni bevizsgálás", "Szállítás és teljes körű honosítás", "1 év szavatosság minden autóra"],
      extra: `<div class="platforms"><span class="plat-lbl">A teljes kínálat innen:</span><div class="plat-row"><span class="plat plat-mobile"><img class="plat-img plat-img-mb" src="${rel}mobile-de.webp" alt="mobile.de" loading="lazy"></span><span class="plat plat-as24"><img class="plat-img plat-img-as" src="${rel}autoscout24.webp" alt="AutoScout24" loading="lazy"></span><span class="plat plat-heycar"><img class="plat-img plat-img-hc" src="${rel}heycar.webp" alt="heycar" loading="lazy"></span></div></div><a class="btn" href="#">Tudj meg többet →</a>` }),
    svcCard({ img: rel + "toyota-rav4-hybrid-hasznaltauto-eladas.webp", alt: "Toyota RAV4 Hybrid — használtautó-eladás", tag: "Használtautó-eladás", title: "Eladjuk az autódat", accent: true,
      lead: "<strong>Miért vesződnél az eladással?</strong> Teljes körűen kezeljük helyetted — Te csak átveszed a vételárat, mi pedig még jót is teszünk közben.",
      items: ["Profi fotók és videók minden autóhoz", "Hirdetés a legnagyobb platformokon", "A jutalék egy része jótékony célra megy"],
      extra: `<div class="platforms"><span class="plat-lbl">Itt hirdetjük az autódat:</span><div class="plat-row"><span class="plat plat-huhu"><img class="plat-img plat-img-hu" src="${rel}hasznaltauto-hu.webp" alt="Használtautó.hu" loading="lazy"></span><span class="plat plat-mobile"><img class="plat-img plat-img-mb" src="${rel}mobile-de.webp" alt="mobile.de" loading="lazy"></span></div><span class="plat-lbl" style="margin-top:14px">Itt mutatjuk meg videón:</span><div class="plat-row"><span class="soc"><img src="${rel}instagram.webp" alt="Instagram" loading="lazy"></span><span class="soc"><img src="${rel}facebook.webp" alt="Facebook" loading="lazy"></span><span class="soc"><img src="${rel}tiktok.webp" alt="TikTok" loading="lazy"></span><span class="soc soc-yt">${YT_SVG}</span></div></div><div class="btn-row"><a class="btn" href="#">Tudj meg többet →</a><a class="btn btn-outline" href="#jotekonysag">Jótékonysági program</a></div>` }),
  ].join("");

  const orgs = [
    ["sos-gyermekfalvak-magyarorszag.webp", "SOS Gyermekfalvak Magyarország", " org-sos"],
    ["magyar-elelmiszerbank-egyesulet.webp", "Magyar Élelmiszerbank Egyesület", ""],
    ["bator-tabor.webp", "Bátor Tábor", ""],
    ["magyar-maltai-szeretetszolgalat.webp", "Magyar Máltai Szeretetszolgálat", ""],
    ["rex-kutyaotthon-alapitvany.webp", "Rex Kutyaotthon Alapítvány", ""],
    ["heim-pal-orszagos-gyermekgyogyaszati-intezet.webp", "Heim Pál Országos Gyermekgyógyászati Intézet", ""],
    ["patent-egyesulet.webp", "PATENT Egyesület", ""],
  ].map(([f, a, cls]) => `<span class="org-logo${cls}"><img src="${rel}${f}" alt="${attr(a)}" loading="lazy"></span>`).join("");

  const steps = [
    ["1", "Meghallgatunk", "Először megértjük, mire van szükséged — csak utána javaslunk autót vagy megoldást."],
    ["2", "Ellenőrzünk", "A kinézett autót leinformáljuk, és a helyszínen alaposan megnézzük, hogy minden rendben van-e vele, mielőtt véglegesítenéd a vásárlást."],
    ["3", "Kulcsrakészen intézzük", "Szállítás, honosítás, papírmunka — mindent mi kezelünk, Neked csak át kell venned."],
    ["4", "Kiállunk érte", "Legyen szó importált vagy hazai használt autóról, minden esetben 1 év szavatosságot vállalunk — mert biztosak vagyunk a munkánkban."],
    ["5", "Melletted maradunk", "Az átadás után sem szakad meg a kapcsolatunk — kérdéseiddel és garanciális ügyeiddel is bizalommal fordulhatsz hozzánk."],
  ].map(([n, t, p]) => `<div class="card why reveal"><div class="n">${n}</div><div><h3>${esc(t)}</h3><p>${esc(p)}</p></div></div>`).join("");

  const revs = [
    ["AI", "#D8232A", "Alexandru Ion", "2 éve", "Kiváló munka. Délelőtt 11-re érkeztem, és 14 órára, a fizetés után már vittem is az autót. Az ár stimmelt, az autó minden adata pontos volt. Köszönöm!"],
    ["CG", "#0E9F6E", "Ciccio Grifó", "4 éve", "Komoly, és főleg előzékeny, kedves munkatársak. A megkereséseket és e-maileket gyorsan megválaszolják."],
    ["BM", "#7C3AED", "Bad Martin", "2 éve", "Nagyon kedves és hozzáértő munkatársak. Itt fel is veszik a telefont — és pontosan azt kapod, amit ígérnek."],
    ["R", "#F4A300", "RMF", "1 éve", "Nagyon jó kapcsolat. Barátságos és teljesen megbízható! Bármikor újra, szívesen :-)"],
    ["D", "#2563EB", "Dennis", "3 éve", "Szuper kedves személyzet, korrekt, gördülékeny ügyintézés — összességében nagyon elégedett vagyok."],
    ["S", "#141519", "Saab900 Freak", "2 éve", "Nagyon igyekvő csapat, korrekt hozzáállás — itt profik dolgoznak."],
  ];
  const reviewCards = revs.map(([i, c, n, a, t]) => `<article class="card rev-card reveal"><header><span class="rev-av" style="background:${c}">${esc(i)}</span><span class="who"><b>${esc(n)}</b><span>${esc(a)}</span></span>${GMARK}</header><div class="gstars">★★★★★</div><p>${esc(t)}</p></article>`).join("");
  const faqs = [
    ["Mennyibe kerül a prémium autóbérlés a Caradvance-nál?", `A legkedvezőbb havidíj 912 €/hó nettó-tól indul (Mini Cooper), prémium BMW-ink 937 €/hó nettó-tól érhetők el; a konkrét ár a modelltől, a bérlés időtartamától és a havi km-kerettől függ. Az aktuális <a href="#autoink">bérelhető autókat itt találod</a>, ajánlatért hívd Pálinkás Áront: <a href="tel:+36300942081">+36 30 094 2081</a>.`],
    ["Lehet hosszú távra vagy tartósan autót bérelni?", "A rövid távú bérlés mellett hosszú távú és tartós autóbérlést is kínálunk, rugalmas időtartammal — a hosszabb elköteleződés kedvezőbb havidíjat jelent. Az átadás-átvétel egyeztetett helyszínen történik, Pest megyén belül."],
    ["Kell kauciót fizetni a bérléshez, és mennyit?", "Igen, a bérléshez egyszeri, visszatérítendő kaució szükséges, amelynek összege a modelltől függ. Példák: BMW X2 — 3 000 €, BMW 550e és BMW X7 — 7 500 €, a csúcsmodelleknél (pl. BMW M5 vagy X6 M) akár 10 000 €."],
    ["Hogyan működik az autóimport Németországból?", `Elmondod, milyen autót keresel, mi pedig a teljes német piacról ajánlunk: az autót leinformáljuk, a helyszínen bevizsgáljuk, majd intézzük a szállítást, a honosítást és a teljes papírmunkát. Az importált autókra 1 év szavatosságot vállalunk. Tóth Károly import igazgató: <a href="tel:+36302146989">+36 30 214 6989</a>.`],
    ["Milyen garanciát kapok a megvásárolt autóra?", "Minden importált és eladó autónkra 1 év szavatosságot vállalunk. Minden jármű előélete ismert és dokumentált, az átadás előtt helyszíni bevizsgáláson esik át — az átadás után is számíthatsz ránk garanciális ügyekben."],
    ["Milyen eladó BMW-k és használt prémium autók érhetők el?", `Kínálatunkban gondosan válogatott, bevizsgált prémium használt autók szerepelnek — főként BMW X5 és X6, emellett további modellek is, mint BMW 550e, BMW X7 vagy BMW X2 —, azonnal elérhetően, igény szerint finanszírozással. A teljes kínálatot az <a href="#autoink">Autóink</a> szekcióban találod.`],
    ["Hogyan tudom eladni az autómat a Caradvance-szal?", "Bizományos értékesítésben teljes körűen kezeljük az eladást: profi fotókat és videót készítünk, a legnagyobb platformokon hirdetünk, és mi tárgyalunk a vevőkkel — te csak átveszed a vételárat. A jutalék egy részét magyar jótékonysági szervezeteknek ajánljuk fel."],
    ["Van finanszírozási lehetőség autóvásárlásnál?", `Igen, eladó autóinkhoz igény szerint finanszírozási lehetőséget is biztosítunk — a részletekről kereskedelmi vezetőnk ad tájékoztatást: <a href="mailto:sales@caradvance.hu">sales@caradvance.hu</a>.`],
    ["Kik állnak a Caradvance Hungary mögött?", "A Caradvance a müncheni Caradvance GmbH márkája, amely 2003 óta foglalkozik prémium használt autókkal Sauerlachban. Magyarországon a BH Group Zrt. képviseli Caradvance Hungary néven — a bérlések és eladások többsége közvetlenül a német Caradvance GmbH-val jön létre, mi pedig itthonról, magyarul kísérünk végig."],
    ["Hol találom a Caradvance irodáját és mikor vagytok elérhetők?", `Irodánk címe: 2083 Solymár, Ibolya utca 12. — Budapesttől 15 percre. Munkaidő: hétfőtől péntekig 9:00–17:00. Telefon: <a href="tel:+36302336060">+36 30 233 6060</a>, e-mail: <a href="mailto:info@caradvance.hu">info@caradvance.hu</a>.`],
    ["Miért megbízható a Caradvance?", "Több mint 5000 eladott autó, 5,0-s Google-értékelés és 23 év német piaci tapasztalat áll mögöttünk. Minden autót leinformálunk és bevizsgálunk, nincs apró betű és nincs rejtett költség — importált autóinkra 1 év szavatosságot vállalunk."],
  ];
  const faqItems = faqs.map(([q, a]) => `<details class="faq-item"><summary>${esc(q)}</summary><div class="faq-a">${a}</div></details>`).join("");
  return `<div class="cah">
<section class="block" id="szolgaltatasok"><div class="wrap">
  <span class="eyebrow reveal">Szolgáltatásaink</span>
  <h2 class="sec-title reveal">Amivel foglalkozunk</h2>
  <div class="svc-grid">${svc}</div>
</div></section>
<section class="block" id="jotekonysag-blokk" style="padding-top:0"><div class="wrap">
  <div class="card charity reveal" id="jotekonysag">
    <div>
      <span class="eyebrow">Jótékonyság</span>
      <h3>Minden eladott autóval jót teszünk</h3>
      <p>Hisszük, hogy a sikernek akkor van igazi értéke, ha másokkal is megosztjuk. Ezért a használtautó-eladások jutalékának jelentős részét magyar nonprofit szervezeteknek ajánljuk fel — és minden autó videójában megmutatjuk, hova kerül a támogatás.</p>
      <a class="chip cta charity-btn" href="#">Add el az autód — tegyünk jót együtt</a>
    </div>
    <div class="org-list">${orgs}</div>
    <a class="chip cta charity-btn charity-btn-mobile" href="#">Add el az autód — tegyünk jót együtt</a>
  </div>
</div></section>
<section class="block" id="miert" style="padding-top:0"><div class="wrap">
  <span class="eyebrow reveal">Miért a Caradvance?</span>
  <h2 class="sec-title reveal">Így dolgozunk</h2>
  <div class="why-grid">${steps}<div class="card why why-special reveal"><div class="n">♥</div><div><h3>Visszaadunk</h3><p>A használtautó-eladások jutalékának egy részével magyar jótékonysági szervezeteket támogatunk.</p></div></div></div>
</div></section>
<section class="block" id="tortenet" style="padding-top:0"><div class="wrap">
  <span class="eyebrow reveal">Történetünk</span>
  <h2 class="sec-title reveal">Kik vagyunk?</h2>
  <p class="sec-lead reveal">A Caradvance a müncheni Caradvance GmbH márkája — Magyarországon a BH Group Zrt. képviseli, Caradvance Hungary néven.</p>
  <div class="story-grid">
    <div class="story-text reveal">
      <p>A <strong>Caradvance GmbH</strong> 2003 óta a német autópiac megbízható szereplője: Sauerlachban, München mellett működő kereskedésük több mint két évtizede foglalkozik prémium használt autókkal — a mobile.de-n <strong>5 csillagos értékeléssel</strong>. Náluk az autó nem áru, hanem felelősség: minden járműnek ismert az előélete, és minden ügyfél pontosan azt kapja, amit ígértek neki.</p>
      <p>A <strong>BH Group Zrt.</strong> kizárólag a Caradvance GmbH <strong>hivatalos magyarországi képviselete</strong> — Caradvance Hungary néven mi vagyunk az itthoni kapcsolat: magyarul, helyben, személyesen. <strong>Az autóbérlés és az eladások többsége közvetlenül a német Caradvance GmbH-n keresztül zajlik</strong> — Te tehát egy több mint két évtizedes múltú német kereskedéssel szerződsz, mi pedig végigkísérünk itthonról: leinformált, bevizsgált autók, kulcsrakész átadás, <strong>1 év szavatossággal</strong>.</p>
      <p>Több mint <strong>5000 eladott autó</strong> és ügyfeleink <strong>5,0-s értékelése</strong> mutatja: a két ország legjobbjait összekötni működő recept.</p>
      <div class="story-foot"><img class="bhg-logo" src="${rel}bh-group-zrt.webp" alt="BH Group Zrt." loading="lazy"><a class="btn story-more" href="https://caradvance.de/" target="_blank" rel="noopener">Tudj meg többet rólunk →</a></div>
    </div>
    <div class="card mission reveal">
      <img class="mission-logo" src="${rel}caradvance-the-automotive-people.webp" alt="Caradvance — the automotive people" loading="lazy">
      <h3>Küldetésünk</h3>
      <p>Visszaadni a bizalmat az autókereskedelembe. Minden autó mögött álljon valódi előélet, minden ügylet mögött valódi felelősségvállalás — és minden eladásból jusson valami vissza a közösségnek is.</p>
      <div class="mission-since">A <strong>Caradvance GmbH</strong> 2003 óta a német autópiac megbízható szereplője — erre a tapasztalatra építünk itthon is.</div>
      <div class="sig">Caradvance csapata<span>BH Group Zrt. · Solymár</span></div>
    </div>
  </div>
</div></section>
<section class="block" id="ertekek" style="padding-top:0"><div class="wrap">
  <span class="eyebrow reveal">Értékeink</span>
  <h2 class="sec-title reveal">Amiben hiszünk</h2>
  <div class="values-grid">
    <div class="card value reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg></div><h3>Átláthatóság</h3><p>Minden autót leinformálunk és bevizsgálunk. Nincs apró betű, nincs rejtett költség — azt kapod, amit ígérünk.</p></div>
    <div class="card value reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg></div><h3>Biztonság</h3><p>Importált autóinkra 1 év szavatosságot vállalunk, mert kiállunk azért, amit átadunk.</p></div>
    <div class="card value reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3.2"/><path d="M2.5 20c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5"/><path d="M15.5 3.5a3.2 3.2 0 010 6.2M18 20c-.4-1.9-1.3-3.3-2.5-4.2"/></svg></div><h3>Személyes figyelem</h3><p>Nem eladunk, hanem segítünk. Végigkísérünk a teljes folyamaton — az első kérdéstől az átadásig.</p></div>
    <div class="card value reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.6-9.5-9C.7 8.6 2.6 5 6 5c2 0 3.4 1 4.5 2.6L12 9l1.5-1.4C14.6 6 16 5 18 5c3.4 0 5.3 3.6 3.5 7-2.5 4.4-9.5 9-9.5 9z"/></svg></div><h3>Társadalmi felelősség</h3><p>A használtautó-eladások jutalékának jelentős részét magyar jótékonysági szervezeteknek ajánljuk fel.</p></div>
  </div>
</div></section>
<section class="block" id="velemenyek"><div class="wrap">
  <span class="eyebrow reveal">Vélemények</span>
  <h2 class="sec-title reveal">Amit ügyfeleink mondanak rólunk</h2>
  <div class="rev-summary reveal"><span class="gstars">★★★★★</span><b>5,0</b><span class="rs-txt">a Google-n</span></div>
  <div class="rev-grid">${reviewCards}</div>
  <div class="rev-foot reveal">Valódi Google-vélemények a Caradvance-ról, magyarra fordítva. Eredeti nyelv: német / angol.<br><a href="https://www.google.com/maps/search/?api=1&query=Caradvance+GmbH+Autovermietung" target="_blank" rel="noopener">Összes vélemény megtekintése a Google-n →</a></div>
</div></section>
<section class="block" id="gyik" style="padding-top:0"><div class="wrap">
  <span class="eyebrow reveal">Jó tudni</span>
  <h2 class="sec-title reveal">Prémium autóbérlés és autóimport Németországból — egy kézből</h2>
  <div class="seo-copy reveal">
    <p>A <strong>Caradvance Hungary</strong> a müncheni Caradvance GmbH hivatalos magyarországi képviselete: <strong>prémium autóbérlés</strong>, gondosan bevizsgált <strong>eladó BMW és más prémium használt autók</strong>, valamint kulcsrakész <strong>autóimport Németországból</strong> — Budapesten és környékén, solymári irodánkból, országos kiszolgálással.</p>
    <p>Autóbérlésnél nálunk nem napidíjas <strong>autókölcsönzést</strong> kapsz, hanem rugalmas, <strong>havidíjas konstrukciót, minimum 6 hónapos időtartamtól</strong>: válogatott BMW modelljeink hosszú távú, akár egy éven túli használatra is elérhetők. Ha vásárolnál, <a href="#autoink">eladó autóink</a> mindegyike leinformált, helyszínen bevizsgált és <strong>1 év szavatossággal</strong> érkezik. Ha pedig pontosan tudod, mit keresel, a teljes német piacról importáljuk neked: <strong>autó behozatal Németországból</strong> szállítással, honosítással és teljes ügyintézéssel — te csak átveszed a kulcsot.</p>
    <p>Saját autódat is <a href="#szolgaltatasok">eladjuk bizományos értékesítésben</a>: profi fotókkal, videóval, a legnagyobb hirdetési platformokon — és minden eladás jutalékának egy részét magyar jótékonysági szervezeteknek ajánljuk fel. Több mint <strong>5000 eladott autó</strong> és <strong>5,0-s Google-értékelés</strong> áll mögöttünk.</p>
  </div>
  <h2 class="sec-title reveal" style="margin-top:44px;font-size:clamp(24px,3vw,32px)">Gyakori kérdések</h2>
  <div class="faq-list reveal">${faqItems}</div>
</div></section>
</div>
<script>(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});document.querySelectorAll('.cah .reveal').forEach(function(el){io.observe(el)});})();</script>`;
}

function renderHome(cars, rate) {
  const active = cars.filter(isActive);
  const pickFeat = (list) => list.filter(isOwn).concat(list.filter((c) => !isOwn(c))).slice(0, 3);
  const saleFeat = pickFeat(active.filter((c) => nEur(c.vetel_eur) > 0));
  const rentFeat = pickFeat(active.filter((c) => nEur(c.berlet_eur) > 0));
  const css = `
.hero{position:relative;overflow:hidden;color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:540px;padding:20px 24px 72px;border-radius:32px;margin:8px 16px 16px;margin-top:calc(6px - var(--navh));background:linear-gradient(180deg,#17181C,#0B0B0D 62%,#060607)}
@media(max-width:640px){.hero{margin:8px;margin-top:calc(8px - var(--navh));border-radius:22px;padding:84px 18px 72px;min-height:480px}}
.hero .video-bg{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover}
.hero .overlay{position:absolute;inset:0;z-index:1;background:radial-gradient(1100px 460px at 50% -10%,rgba(226,0,26,.18),transparent 60%),linear-gradient(180deg,rgba(8,8,10,.42),rgba(8,8,10,.48) 45%,rgba(8,8,10,.7))}
.hero .inner{position:relative;z-index:2;max-width:1120px;margin:64px auto 0}
.hero .brand-logo{height:64px;width:auto;display:block;margin:0 auto 26px;filter:drop-shadow(0 4px 18px rgba(0,0,0,.5))}
@media(max-width:640px){.hero .brand-logo{height:48px;margin-bottom:20px}}
.hero h1{font-size:clamp(32px,5vw,56px);line-height:1.08;font-weight:800;letter-spacing:-.025em;margin:0 0 16px;white-space:nowrap;text-shadow:0 2px 24px rgba(0,0,0,.35)}
@media(max-width:900px){.hero h1{white-space:normal;font-size:clamp(28px,7vw,40px)}}
.hero .sub{font-size:clamp(16px,1.7vw,19px);line-height:1.5;color:#E7EAF0;max-width:600px;margin:0 auto 32px;text-shadow:0 1px 12px rgba(0,0,0,.4)}
.hero .cta-row{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;align-items:center}
.hero .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:16px;padding:15px 32px;border-radius:999px;text-decoration:none;cursor:pointer;border:0;transition:background .15s}
.hero .btn-primary{background:var(--red);color:#fff;box-shadow:0 10px 30px rgba(226,0,26,.4)}
.hero .btn-primary:hover{background:#B80015}
.hero .btn-white{background:#fff;color:var(--navy)}.hero .btn-white:hover{background:#ECEEF2}
.hero .scrolldown{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:3;display:flex;flex-direction:column;align-items:center;gap:4px;color:rgba(255,255,255,.82);background:none;border:0;cursor:pointer;font:inherit;letter-spacing:.05em;font-size:11px;text-transform:uppercase;animation:caScrollBob 1.9s ease-in-out infinite}
.hero .scrolldown:hover{color:#fff}.hero .scrolldown svg{width:26px;height:26px}
@keyframes caScrollBob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,8px)}}
.stats{max-width:1160px;margin:28px auto 0;position:relative;z-index:3;padding:0 20px}
.stats-in{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
@media(max-width:700px){.stats-in{grid-template-columns:1fr 1fr}}
.stat{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 14px 40px rgba(8,8,10,.08);text-align:center;padding:26px 22px}
.stat .n{font-size:clamp(26px,3.2vw,34px);font-weight:800;letter-spacing:-.02em;color:var(--navy)}.stat .n b{color:var(--red)}
.stat .l{color:var(--muted);font-size:13.5px;font-weight:600;margin-top:6px;line-height:1.4}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:8px 0 22px;flex-wrap:wrap}
.sec-head h2{font-size:28px;font-weight:800;letter-spacing:-.02em;margin:6px 0 0}
.feyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--red)}
.feyebrow::before{content:"";width:26px;height:3px;background:var(--red);border-radius:2px}
.sec-head p{color:var(--muted);margin:6px 0 0;font-size:15px}
` + cardCss() + CONTENT_CSS + CONTENT_CSS2;

  const stats = [
    ["5000<b>+</b>", "eladott prémium autó"],
    ["23 <b>év</b>", "Tapasztalat — a Caradvance GmbH 2003 óta"],
    ["5,0<b>★</b>", "Google-értékelés"],
    ["1 <b>év</b>", "szavatosság minden importált autóra"],
  ];
  const body = `
<section class="hero">
  <video class="video-bg" autoplay muted loop playsinline preload="auto" poster="caradvance-hero-x5-poster.jpg"><source src="caradvance-hero-x5.mp4" type="video/mp4"></video>
  <div class="overlay"></div>
  <div class="inner">
    <img class="brand-logo" src="caradvance-logo-white.webp" alt="CarAdvance — the automotive people" width="403" height="133">
    <h1>Prémium autók Németországból</h1>
    <p class="sub">Prémium autóbérlés és eladás, autóimport Németországból — a te autódat pedig bizományban eladjuk.</p>
    <div class="cta-row"><a class="btn btn-primary" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Autót keresek")}">Autót keresek</a><a class="btn btn-white" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Autó eladása – bizomány")}">Add el az autód</a></div>
  </div>
  <button class="scrolldown" aria-label="Görgess lejjebb" onclick="window.scrollBy({top:Math.round(innerHeight*0.9),behavior:'smooth'})">Görgess<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
</section>
<div class="stats"><div class="stats-in">${stats.map(([n, l]) => `<div class="stat"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`).join("")}</div></div>
<section class="wrap" id="autoink">
  <div class="autok-head"><div><span class="feyebrow">Kínálat</span><h2>Autóink</h2></div>
    <div class="autok-tabs" role="tablist">
      <button class="autok-tab" data-tab="berelheto" type="button">Bérelhető autók</button>
      <button class="autok-tab on" data-tab="elado" type="button">Eladó autók</button>
    </div>
  </div>
  <div class="autok-panel on" id="panel-elado">
    <div class="grid">${saleFeat.map((c) => featCard(c, rate, "sale")).join("")}</div>
    <div class="autok-more"><a class="btn btn-red" href="autoink/">Összes eladó autónk →</a></div>
  </div>
  <div class="autok-panel" id="panel-berelheto">
    ${rentFeat.length
      ? `<div class="grid">${rentFeat.map((c) => featCard(c, rate, "rent")).join("")}</div><div class="autok-more"><a class="btn btn-red" href="autoink/">Összes bérelhető autónk →</a></div>`
      : `<div style="text-align:center;padding:52px 24px;background:#fff;border:1px solid var(--line);border-radius:18px"><p style="color:var(--muted);font-size:16.5px;max-width:460px;margin:0 auto 20px">Bérelhető prémium autóink hamarosan itt is elérhetők lesznek. Addig is szívesen adunk személyre szabott bérlési ajánlatot.</p><a class="btn btn-red" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Autóbérlés érdeklődés")}">Kérj bérlési ajánlatot</a></div>`}
  </div>
  <div class="rate-note">A feltüntetett árak nettó árak (áfa nélkül). A forint árak élő árfolyammal számolódnak, óránként frissülnek (1 € = <span id="ratev">${rate}</span> Ft).</div>
</section>
${contentSections("")}
<script>document.querySelectorAll('.autok-tab').forEach(function(t){t.addEventListener('click',function(){document.querySelectorAll('.autok-tab').forEach(function(x){x.classList.remove('on')});t.classList.add('on');document.querySelectorAll('.autok-panel').forEach(function(p){p.classList.remove('on')});var el=document.getElementById('panel-'+t.dataset.tab);if(el)el.classList.add('on');});});</script>`;

  const ld = {
    "@context": "https://schema.org", "@type": "AutoDealer", name: BRAND,
    url: SITE_BASE + "/", email: CONTACT_EMAIL, areaServed: "HU",
    description: "Prémium autók Németországból — bérlés, eladás, import és bizományos értékesítés.",
  };
  return page({
    title: "CarAdvance — Prémium autók Németországból | Bérlés, eladás, import",
    desc: "Prémium autók Németországból: megvásárolható autók, prémium autóbérlés, import és bizományos értékesítés. Átlátható árak, garancia.",
    canonical: SITE_BASE + "/", rel: "", css, body,
    head: `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
  });
}

// --------------------------------------------------------------- CATALOG
function renderCatalog(cars, rate) {
  const active = cars.filter(isActive).sort((a, b) => nEur(a.vetel_eur) - nEur(b.vetel_eur));
  const css = `
.crumb{font-size:14px;color:var(--muted);font-weight:600;margin-bottom:14px}.crumb a{text-decoration:none}.crumb a:hover{color:var(--red)}.crumb b{color:var(--ink)}
.chead h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0 0 4px}
.chead p{color:var(--muted);margin:0 0 22px;font-size:15px}
.filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px}
.filters input,.filters select{padding:11px 14px;border:1px solid var(--line);border-radius:10px;font-family:inherit;font-size:14px;background:#fff;color:var(--ink)}
.filters input{min-width:220px}
.count{color:var(--muted);font-size:13px;font-weight:600;margin-bottom:14px}
.empty{grid-column:1/-1;color:var(--muted);padding:40px;text-align:center}
` + cardCss();
  const brands = [...new Set(active.map((c) => c.marka).filter(Boolean))].sort();
  const bodies = [...new Set(active.map((c) => c.karosszeria).filter(Boolean))].sort();
  const fuels = [...new Set(active.map((c) => c.uzemanyag).filter(Boolean))].sort();
  const body = `
<div class="wrap">
  <div class="crumb"><a href="../">Főoldal</a> / <b>Megvásárolható autóink</b></div>
  <div class="chead"><h1>Megvásárolható autóink</h1><p>Prémium autók Németországból, nettó árakkal (áfa nélkül). Az árak élő árfolyammal frissülnek (1 € = <span id="ratev">${rate}</span> Ft).</p></div>
  <div class="filters">
    <input id="q" placeholder="Keresés (pl. X5, Porsche)…">
    <select id="marka"><option value="">Minden márka</option>${brands.map((b) => `<option>${esc(b)}</option>`).join("")}</select>
    <select id="kar"><option value="">Minden karosszéria</option>${bodies.map((b) => `<option>${esc(b)}</option>`).join("")}</select>
    <select id="uz"><option value="">Minden üzemanyag</option>${fuels.map((b) => `<option>${esc(b)}</option>`).join("")}</select>
  </div>
  <div class="count" id="count">${active.length} autó</div>
  <div class="grid" id="grid">${active.map((c) => carCard(c, rate, "../")).join("")}</div>
</div>
<script>
(function(){var g=document.getElementById('grid'),cards=[].slice.call(g.children);
var meta=cards.map(function(el){return{el:el,t:(el.querySelector('.title').textContent||'').toLowerCase(),
 m:(el.getAttribute('data-marka')||''),k:(el.getAttribute('data-kar')||''),u:(el.getAttribute('data-uz')||'')}});
function f(){var q=(document.getElementById('q').value||'').toLowerCase(),m=document.getElementById('marka').value,k=document.getElementById('kar').value,u=document.getElementById('uz').value,n=0;
 meta.forEach(function(o){var ok=(!q||o.t.indexOf(q)>=0)&&(!m||o.m===m)&&(!k||o.k===k)&&(!u||o.u===u);o.el.style.display=ok?'':'none';if(ok)n++;});
 document.getElementById('count').textContent=n+' autó';}
['q','marka','kar','uz'].forEach(function(id){var e=document.getElementById(id);e.addEventListener('input',f);e.addEventListener('change',f);});})();
</script>`;
  return page({
    title: "Megvásárolható autóink — CarAdvance",
    desc: `Böngéssz ${active.length} prémium autó között Németországból — BMW, Porsche és más márkák, nettó árakkal (áfa nélkül) és garanciával.`,
    canonical: SITE_BASE + "/autoink/", rel: "../", css, body,
  });
}

// --------------------------------------------------------------- DETAIL
// ---- Detail-page extras: salesperson team, benefits, PDF adatlap --------
const absUrl = (u) => SITE_BASE + "/" + String(u).replace(/^\//, "");
const hufUpR = (e, rate) => Math.ceil((Number(e) || 0) * rate / 10000) * 10000;
const SALES_EMAIL = "sales@caradvance.hu";
const TEAM = ["Tóth Károly", "Csadi Ferenc", "Vadnai Zsombor"];
const EMP = {
  "Csadi Ferenc": { role: "Kereskedelmi vezető", tel: "+36 30 094 2081", wa: "36300942081", img: "caradvance-emp-csadi.webp" },
  "Tóth Károly": { role: "Import igazgató", tel: "+36 30 214 6989", wa: "36302146989", img: "caradvance-emp-toth.webp" },
  "Vadnai Zsombor": { role: "Értékesítési vezető", tel: "+36 30 094 2105", wa: "36300942105", img: "caradvance-emp-vadnai.webp" },
};
const initials = (n) => n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const IC_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3h3l1.6 4-2 1.4a12 12 0 0 0 5 5l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3z"/></svg>';
const IC_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>';
const IC_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .3-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.2.1.5.1.6-.1l.7-.9c.2-.3.4-.2.7-.1l2 .9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>';
const DL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;margin-right:8px"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>';
const SPEC_ICONS = {
  "Kilométer": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 17a9 9 0 1 1 15 0"/><path d="M12 13l3.6-3.2"/><circle cx="12" cy="13" r="1.3" fill="currentColor" stroke="none"/></svg>',
  "Teljesítmény": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  "Üzemanyag": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15M3 20h11"/><path d="M13 8h3l2 2v7a1.5 1.5 0 0 0 3 0V9l-2.5-3"/><path d="M7 8h4"/></svg>',
  "Váltó": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8M18 8v4M6 12h12"/></svg>',
  "Évjárat": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M8.5 14.5l2 2 4-4"/></svg>',
  "Hajtás": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l1.8-4.5A2 2 0 0 1 6.7 7h10.6a2 2 0 0 1 1.9 1.5L21 13v4H3z"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/></svg>',
};
// Trim trailing German parenthetical leftovers from old data; keep Hungarian ones.
const DEFLAG = /(System|Getriebe|Scheinwerfer|Verglasung|Anlage|Bremss|\bSitz|Außen|Innen|Fahrassistenz|Lackierung|schwarz|blau|\bvorn\b|hinten|\bmit\b|\bund\b|\bfür\b|Dachhimmel|Felgen|elektr|abgedunkelt|Multifunktion|Öffnungs|Wireless|Rekuperation|Radioempfang|Kugelkopf|beleuchtet|Hochglanz|Steptronic|Speed Limit|Stop&Go-Funktion)/;
function cleanDE(s) {
  s = String(s || "").trim();
  for (let guard = 0; guard < 3; guard++) {
    if (!s.endsWith(")")) break;
    let depth = 0, open = -1;
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === ")") depth++;
      else if (s[i] === "(") { depth--; if (depth === 0) { open = i; break; } }
    }
    if (open <= 0) break;
    const inner = s.slice(open + 1, -1);
    const before = s.slice(0, open).trim();
    if (before && DEFLAG.test(inner)) s = before; else break;
  }
  return s;
}

const PDFCSS = `
.xs{width:100%;background:#fff;color:#141519;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.xs *{box-sizing:border-box}
.xs-hd{display:flex;justify-content:space-between;align-items:center}
.xs-logo{height:46px;width:auto;display:block}
.xs-hr{text-align:right}.xs-ht{font-size:26px;font-weight:800;letter-spacing:.04em;color:#0B0B0D}
.xs-hs{font-size:12px;color:#5A6B82;font-weight:600}
.xs-rl{height:4px;background:#E2001A;border-radius:2px;margin:12px 0 18px}
.xs-ttl{font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.1}
.xs-sub{color:#E2001A;font-weight:700;font-size:14px;margin-top:3px;text-transform:uppercase;letter-spacing:.02em}
.xs-hero{margin:14px 0 6px;border-radius:12px;overflow:hidden;break-inside:avoid}
.xs-hero img{width:100%;display:block;object-fit:cover;max-height:380px}
.xs-thg{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:6px;break-inside:avoid}
.xs-tw{border-radius:7px;overflow:hidden;height:56px}
.xs-grow{display:flex;gap:10px;margin-bottom:10px;break-inside:avoid;page-break-inside:avoid}
.xs-gi{flex:1;min-width:0;border-radius:10px;overflow:hidden;background:#F4F7FB;border:1px solid #E6EAF1;break-inside:avoid;page-break-inside:avoid}
.xs-gi img{width:100%;height:auto;display:block}
.xs-tw img{width:100%;height:100%;object-fit:cover;display:block}
.xs-desc{font-size:13px;color:#374151;line-height:1.6;margin:6px 0 2px}
.xs-icrow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 16px;margin:10px 0;break-inside:avoid}
.xs-ic{display:flex;align-items:center;gap:10px}
.xs-icn{width:40px;height:40px;border-radius:11px;background:#EEF2F8;color:#5A6B82;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.xs-icn svg{width:20px;height:20px}
.xs-ictx{display:flex;flex-direction:column;min-width:0}
.xs-ik{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#8a94a6}
.xs-iv{font-size:14px;font-weight:800;line-height:1.2;word-break:break-word}
.xs-pb{break-before:page;page-break-before:always}
.xs-pbox{display:flex;gap:14px;margin:6px 0 8px;break-inside:avoid;align-items:stretch}
.xs-pl{flex:1;background:#F4F7FB;border:1px solid #E6EAF1;color:#141519;border-radius:14px;padding:18px 22px}
.xs-plab{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a94a6}
.xs-huf{font-size:32px;font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-top:4px;color:#0B0B0D}
.xs-eur{font-size:15px;font-weight:700;color:#5A6B82;margin-top:2px}
.xs-pdiv{height:1px;background:#E6EAF1;margin:12px 0}
.xs-pcross{font-size:13px;color:#5A6B82;font-weight:600}.xs-pcross s{color:#9aa3b2}
.xs-psave{display:inline-block;background:#E7F8EE;color:#1DA851;font-size:13px;font-weight:800;padding:6px 13px;border-radius:999px;margin-top:8px}
.xs-pnote{font-size:11px;color:#8a94a6;font-weight:600;margin-top:12px}
.xs-pers{width:252px;background:#F4F7FB;border:1px solid #E6EAF1;border-radius:14px;padding:14px}
.xs-pterm{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#8a94a6;margin-bottom:4px}
.xs-tmem{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #E6EAF1}
.xs-tmem:last-of-type{border-bottom:0}
.xs-tpf{width:42px;height:42px;border-radius:50%;object-fit:cover;object-position:center top;background:#e3e9f2;flex-shrink:0}
.xs-tpi{display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#0B0B0D}
.xs-tinfo{min-width:0}
.xs-tn{font-size:13px;font-weight:800;line-height:1.15}
.xs-tr{font-size:10.5px;color:#5A6B82;font-weight:600}
.xs-tt{font-size:12px;font-weight:700;margin-top:1px}
.xs-pemail{font-size:12px;font-weight:700;margin-top:9px;text-align:center;color:#0B0B0D}
.xs-h2{font-size:15px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;color:#0B0B0D;margin:14px 0 6px;padding-left:10px;border-left:4px solid #E2001A}
.xs-spec{width:100%;border-collapse:collapse}
.xs-spec td{padding:5px 4px;border-bottom:1px solid #EEF1F6;font-size:12px;vertical-align:top}
.xs-sk{color:#5A6B82;width:42%}.xs-sv2{font-weight:700;text-align:right}
.xs-feat{column-count:3;column-gap:18px}
.xs-fcat{break-inside:avoid;margin-bottom:11px}
.xs-fct{font-size:10.5px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#E2001A;margin-bottom:3px}
.xs-fit{font-size:11px;color:#374151;line-height:1.5}
.xs-ft{margin-top:16px;padding-top:12px;border-top:1px solid #E6EAF1;font-size:10.5px;color:#8a94a6;font-weight:600;text-align:center}`;

// Server-side "Autó adatlap" PDF document (opened + auto-printed on the client).
function buildPdfSheet(c, rate) {
  const g = galleryOf(c).map((u) => u);
  const eur = nEur(c.vetel_eur_netto) || nEur(c.vetel_eur) / 1.19, main = hufUpR(eur, rate);
  const save = 0;
  const srows = [
    ["Évjárat", c.evjarat], ["Teljesítmény", c.teljesitmeny], ["Hajtás", c.hajtas], ["Váltó", c.valto],
    ["Üzemanyag", c.uzemanyag], ["Karosszéria", c.karosszeria], ["Márka", c.marka], ["Kilométer", c.km],
  ].filter(([, v]) => v && v !== "—");
  const parts = String(felszFor(c) || "").split("|").map((s) => s.trim()).filter(Boolean);
  let feat = ""; { let cur = null, items = [];
    const flush = () => { if (cur && items.length) feat += `<div class="xs-fcat"><div class="xs-fct">${esc(cur)}</div><div class="xs-fit">${items.map(esc).join(" · ")}</div></div>`; items = []; };
    parts.forEach((p) => { if (p.startsWith("#")) { flush(); cur = p.slice(1); } else { if (!cur) cur = "Felszereltség"; const t = translateEquip(p); if (t && !items.includes(t)) items.push(t); } }); flush(); }
  const iconsArr = [["Kilométeróra", c.km, "Kilométer"], ["Teljesítmény", c.teljesitmeny, "Teljesítmény"], ["Üzemanyag", c.uzemanyag, "Üzemanyag"], ["Váltó", c.valto, "Váltó"], ["Évjárat", c.evjarat, "Évjárat"], ["Hajtás", c.hajtas, "Hajtás"]]
    .filter((x) => x[1] && x[1] !== "—").map((x) => `<div class="xs-ic"><span class="xs-icn">${SPEC_ICONS[x[2]] || ""}</span><span class="xs-ictx"><span class="xs-ik">${esc(x[0])}</span><span class="xs-iv">${esc(x[1])}</span></span></div>`).join("");
  const sub = [c.karosszeria].filter(Boolean).join(" · ");
  const hero = g[0] ? `<div class="xs-hero"><img src="${attr(g[0])}" referrerpolicy="no-referrer"></div>` : "";
  const teamPDF = TEAM.map((nm) => { const e = EMP[nm] || {};
    const im = e.img ? `<img class="xs-tpf" src="${attr(absUrl(e.img))}" referrerpolicy="no-referrer">` : `<div class="xs-tpf xs-tpi">${initials(nm)}</div>`;
    return `<div class="xs-tmem">${im}<div class="xs-tinfo"><div class="xs-tn">${esc(nm)}</div><div class="xs-tr">${esc(e.role || "")}</div>${e.tel ? `<div class="xs-tt">${esc(e.tel)}</div>` : ""}</div></div>`;
  }).join("");
  let galleryHTML = "";
  for (let i = 0; i < g.length; i += 2) {
    galleryHTML += `<div class="xs-grow"><div class="xs-gi"><img src="${attr(g[i])}" referrerpolicy="no-referrer"></div>` +
      (g[i + 1] ? `<div class="xs-gi"><img src="${attr(g[i + 1])}" referrerpolicy="no-referrer"></div>` : '<div class="xs-gi" style="visibility:hidden"></div>') + `</div>`;
  }
  const inner = `<div class="xs">
  <div class="xs-hd">
    <img class="xs-logo" src="${attr(absUrl("caradvance-logo.webp"))}" referrerpolicy="no-referrer" alt="caradvance">
    <div class="xs-hr"><div class="xs-ht">ADATLAP</div><div class="xs-hs">Eladó prémium autó</div></div>
  </div>
  <div class="xs-rl"></div>
  <div class="xs-ttl">${esc(c.modell)}</div>${sub ? `<div class="xs-sub">${esc(sub)}</div>` : ""}
  ${hero}
  <div class="xs-icrow">${iconsArr}</div>
  <div class="xs-pbox">
    <div class="xs-pl">
      <div class="xs-plab">NETTÓ ÁR</div>
      <div class="xs-huf">${fmtHUF(main)}</div>
      <div class="xs-eur">${eur.toLocaleString("hu-HU")} €</div>
      <div class="xs-pnote">Nettó ár (áfa nélkül) · Árfolyam: 1 € = ${Math.round(rate).toLocaleString("hu-HU")} Ft</div>
    </div>
    <div class="xs-pers">
      <div class="xs-pterm">Kapcsolat</div>
      ${teamPDF}
      <div class="xs-pemail">${esc(CONTACT_EMAIL)}</div>
    </div>
  </div>
  <div class="xs-h2 xs-pb">Műszaki adatok</div>
  <table class="xs-spec">${srows.map((r) => `<tr><td class="xs-sk">${esc(r[0])}</td><td class="xs-sv2">${esc(r[1])}</td></tr>`).join("")}</table>
  <div class="xs-h2">Felszereltség</div>
  <div class="xs-feat">${feat}</div>
  ${g.length ? `<div class="xs-h2 xs-pb">Galéria</div>${galleryHTML}` : ""}
  <div class="xs-ft">caradvance — the automotive people &nbsp;·&nbsp; www.caradvance.hu &nbsp;·&nbsp; +36 30 094 2081 &nbsp;·&nbsp; ${esc(SALES_EMAIL)}</div>
</div>`;
  const fname = ((c.modell || "caradvance autó").replace(/["*]/g, "").trim()) + " - adatlap";
  const printJs = `window.addEventListener('load',function(){var im=[].slice.call(document.images),n=im.length,c=0,fired=false;function go(){if(fired)return;fired=true;var f=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();f.then(function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},300);});}window.onafterprint=function(){setTimeout(function(){window.close();},300);};if(!n)return go();im.forEach(function(x){if(x.complete){if(++c===n)go();}else{x.onload=x.onerror=function(){if(++c===n)go();};}});setTimeout(go,7000);});`;
  return `<!doctype html><html lang="hu"><head><meta charset="utf-8"><title>${esc(fname)}</title>` +
    `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">` +
    `<style>@page{size:A4;margin:12mm}html,body{margin:0;background:#fff}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}${PDFCSS}</style>` +
    `</head><body>${inner}<script>${printJs}</` + `script></body></html>`;
}

function benefitsHtml() {
  const items = [
    ["23 év tapasztalat", "2003 óta Németországban, 5000+ eladott prémium autó."],
    ["Bevizsgált német import", "dokumentált, átlátható előélet, valós kilométeróra."],
    ["1 év szavatosság", "minden eladott autónkra vállaljuk."],
    ["Kulcsrakész, honosítva", "a papírmunkát és a forgalomba helyezést mi intézzük."],
    ["Kedvezőbb ár", "német áfával, a magyar 27%-os árnál olcsóbban."],
    ["5,0 ★ Google-értékelés", "elégedett vásárlók, személyes ügyintézés."],
  ];
  return `<ul class="why">${items.map(([b, t]) => `<li><span class="wc">✓</span><div><b>${esc(b)}</b> — ${esc(t)}</div></li>`).join("")}</ul>`;
}

function contactCardHtml() {
  const rows = TEAM.map((nm) => {
    const e = EMP[nm] || {};
    const photo = e.img ? `<img src="${attr(absUrl(e.img))}" referrerpolicy="no-referrer" alt="${attr(nm)}" loading="lazy">` : `<div class="pinit">${initials(nm)}</div>`;
    let cc = "";
    if (e.tel) cc += `<a href="tel:${e.tel.replace(/\s/g, "")}">${IC_PHONE}${esc(e.tel)}</a>`;
    if (e.wa) cc += `<a class="wa" href="https://wa.me/${e.wa}" target="_blank" rel="noopener">${IC_WA}WhatsApp</a>`;
    return `<div class="tmem">${photo}<div class="tinfo"><div class="pname">${esc(nm)}</div><div class="prole">${esc(e.role || "")}</div><div class="tcontact">${cc}</div></div></div>`;
  }).join("");
  return `<div class="panel contact"><h4>Kapcsolat</h4>${rows}<div class="crow" style="margin-top:14px"><span class="ci">${IC_MAIL}</span> <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></div></div>`;
}

function renderDetail(c, cars, rate) {
  const g = galleryOf(c);
  const p = priceOf(c, rate);
  const slug = slugify(c.modell);
  const title = (c.modell || "").trim();
  const eq = equipmentOf(c);
  const flat = eq.flatMap((cat) => cat.items);
  const iconItems = [["Kilométer", c.km], ["Teljesítmény", c.teljesitmeny], ["Üzemanyag", c.uzemanyag], ["Váltó", c.valto], ["Évjárat", c.evjarat], ["Hajtás", c.hajtas]].filter(([, v]) => v);
  // Related: same brand first, then fill with closest-priced other cars.
  // Dedupe by slug so the current car / duplicates never repeat.
  const _price = nEur(c.vetel_eur);
  const _pool = cars.filter((x) => isActive(x) && slugify(x.modell) !== slug);
  const _same = _pool.filter((x) => x.marka === c.marka);
  const _rest = _pool.filter((x) => x.marka !== c.marka)
    .sort((a, b) => Math.abs(nEur(a.vetel_eur) - _price) - Math.abs(nEur(b.vetel_eur) - _price));
  const related = [];
  const _seen = new Set([slug]);
  for (const x of [..._same, ..._rest]) {
    const s = slugify(x.modell);
    if (_seen.has(s)) continue;
    _seen.add(s);
    related.push(x);
    if (related.length >= 3) break;
  }
  const descText =
    `A(z) ${title} ${c.evjarat ? c.evjarat + " évjáratú, " : ""}${c.km ? c.km + " futott, " : ""}` +
    `${c.uzemanyag ? c.uzemanyag.toLowerCase() + " üzemű " : ""}${c.karosszeria || "prémium autó"}. ` +
    `${c.teljesitmeny ? c.teljesitmeny + ", " : ""}${c.valto || ""}${c.hajtas ? ", " + c.hajtas : ""}. ` +
    `Nettó ár (áfa nélkül) garanciával, ${BRAND} import.`;

  // Járműleírás: categorized equipment, first 12 items shown, rest collapsed.
  let _shown = 0;
  const cateqHtml = eq.map((cat) => {
    const hideH = _shown >= 12;
    let s = `<div class="cath${hideH ? " cmore" : ""}">${esc(cat.title)}</div>`;
    s += cat.items.map((it) => { const hide = _shown >= 12; _shown++; return `<div class="catit${hide ? " cmore" : ""}">${esc(it)}</div>`; }).join("");
    return s;
  }).join("");
  const pdfDoc = buildPdfSheet(c, rate);
  const pdfName = ((c.modell || "caradvance auto").replace(/["*]/g, "").trim()) + " - adatlap";

  const css = `
.crumb{font-size:14px;color:var(--muted);font-weight:600;margin-bottom:18px}.crumb a{text-decoration:none}.crumb a:hover{color:var(--red)}.crumb b{color:var(--ink)}
.layout{display:grid;gap:28px;align-items:start;grid-template-columns:minmax(0,1fr) minmax(0,360px)}
@media(max-width:1024px){.layout{grid-template-columns:1fr}}
.gallery{min-width:0}
.stage{position:relative;width:100%;aspect-ratio:4/3;border-radius:18px;overflow:hidden;background:linear-gradient(135deg,#1A1B1F,#26272C)}
.stage img{width:100%;height:100%;object-fit:contain;display:block}
.counter{position:absolute;bottom:14px;right:14px;background:rgba(11,11,13,.75);color:#fff;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px}
.nav-btn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.6);border:0;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.7}
.nav-btn:hover{opacity:1;background:#fff}.nav-btn.prev{left:12px}.nav-btn.next{right:12px}
.thumbs{display:flex;gap:10px;margin-top:12px;overflow-x:auto;padding-bottom:6px}
.thumbs img{height:72px;width:108px;flex:0 0 auto;object-fit:cover;border-radius:10px;cursor:pointer;opacity:.6;border:2px solid transparent}
.thumbs img.active{opacity:1;border-color:var(--red)}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;margin-top:22px}
.card:first-of-type{margin-top:0}
.sec-h{font-size:21px;font-weight:800;margin:0 0 14px}
.iconrow{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:560px){.iconrow{grid-template-columns:1fr 1fr}}
.ic .k{font-size:12px;color:var(--muted);font-weight:700}.ic .v{font-size:15px;font-weight:800}
.desc{color:#33404f;line-height:1.65;font-size:15px}
table{width:100%;border-collapse:collapse}td{padding:11px 4px;border-bottom:1px solid var(--line);font-size:14.5px}td.k{color:var(--muted);font-weight:600;width:45%}td.v{font-weight:700}
.cateq{columns:2;column-gap:32px}@media(max-width:560px){.cateq{columns:1}}
.cateq .cath{font-weight:800;font-size:14px;margin:12px 0 6px;break-inside:avoid}.cateq .cath:first-child{margin-top:0}
.cateq .catit{padding:3px 0;color:#33404f;font-size:14px;break-inside:avoid}.cateq .catit::before{content:"•";color:var(--muted);margin-right:8px}
.side{display:flex;flex-direction:column;gap:18px}
@media(min-width:1025px){.side{position:sticky;top:84px}}
.panel{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px}
.badge{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.cond{background:var(--soft);color:var(--muted);font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px}
.own{display:inline-block;background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:5px 11px;font-size:11px;font-weight:800;color:var(--navy);margin-bottom:10px}
.year{font-weight:800;color:var(--muted)}
.ptitle{font-size:23px;font-weight:800;letter-spacing:-.02em;margin:6px 0 10px;line-height:1.15;overflow-wrap:anywhere;word-break:break-word}
.pcross{color:var(--muted);font-size:17px;font-weight:700;text-decoration:line-through}
.price{font-size:38px;font-weight:800;letter-spacing:-.02em;line-height:1.05}
.peur{color:var(--muted);font-weight:700;font-size:18px;margin-top:6px}
.plabel{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
.psave{display:inline-block;background:#E7F8EE;color:#1DA851;font-size:13px;font-weight:800;padding:6px 13px;border-radius:999px;margin-top:10px}
.taxnote{color:var(--muted);font-size:12.5px;font-weight:600;margin-top:8px}
.rel-h{margin:44px 0 18px;font-size:24px;font-weight:800}
.rel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}@media(max-width:900px){.rel-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.rel-grid{grid-template-columns:1fr}}
.ic{display:flex;align-items:center;gap:10px}
.ic .dot{width:40px;height:40px;border-radius:11px;background:#EEF2F8;color:#5A6B82;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ic .dot svg{width:20px;height:20px}
.dfeat{display:grid;grid-template-columns:1fr 1fr;column-gap:24px;color:#33404f;font-size:14px}
@media(max-width:560px){.dfeat{grid-template-columns:1fr}}
.dfeat>div{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 14px;border-radius:8px}
.dfeat>div::after{content:"✓";color:#12924a;font-weight:800;flex-shrink:0}
.dfeat>div:nth-child(4n+1),.dfeat>div:nth-child(4n+2){background:#F5F7FA}
.dfeat .fmore{display:none}.dfeat.open .fmore{display:flex}
.cateq .cmore{display:none}.cateq.open .cmore{display:block}
.showmore{margin-top:14px;background:none;border:0;color:var(--red);font-weight:700;font-size:14.5px;cursor:pointer;font-family:inherit;padding:0}
.dl .dlbtn{width:100%;border:0;font-family:inherit;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.contact h4{margin:0 0 14px;font-size:18px;font-weight:800}
.tmem{display:flex;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line)}
.tmem:last-of-type{border-bottom:0}
.tmem img{width:56px;height:56px;border-radius:50%;object-fit:cover;object-position:center top;flex-shrink:0;background:#e3e9f2}
.pinit{width:56px;height:56px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;flex-shrink:0}
.tinfo{min-width:0}.pname{font-weight:800;font-size:15px}.prole{color:var(--muted);font-size:12.5px;font-weight:600}
.tcontact{display:flex;flex-wrap:wrap;gap:5px 14px;margin-top:5px;font-size:13.5px;font-weight:700}
.tcontact a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:5px}
.tcontact a svg{width:15px;height:15px}.tcontact .wa{color:#1DA851}
.crow{display:flex;align-items:center;gap:10px}.crow a{color:inherit;text-decoration:none}
.crow .ci{width:38px;height:38px;border-radius:10px;background:#EAF1FB;color:#2b6ce0;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.crow .ci svg{width:19px;height:19px}
.why{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:13px}
.why li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#33404f;line-height:1.5}
.why .wc{width:22px;height:22px;border-radius:6px;background:#E7F8EE;color:#1DA851;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;margin-top:1px}
` + cardCss();

  const specs = [
    ["Évjárat", c.evjarat], ["Kilométer", c.km], ["Teljesítmény", c.teljesitmeny],
    ["Üzemanyag", c.uzemanyag], ["Váltó", c.valto], ["Hajtás", c.hajtas],
    ["Márka", c.marka], ["Karosszéria", c.karosszeria],
  ].filter(([, v]) => v);

  const stage = g.length
    ? `<div class="stage"><img id="stg" src="${attr(g[0])}" alt="${attr(title)}" referrerpolicy="no-referrer">
       ${g.length > 1 ? '<button class="nav-btn prev" onclick="ca_step(-1)" aria-label="Előző">‹</button><button class="nav-btn next" onclick="ca_step(1)" aria-label="Következő">›</button>' : ""}
       <span class="counter"><span id="cidx">1</span> / ${g.length}</span></div>
       ${g.length > 1 ? `<div class="thumbs" id="thumbs">${g.map((u, i) => `<img src="${attr(u)}" alt="${attr(title + " – " + (i + 1))}" referrerpolicy="no-referrer" onclick="ca_go(${i})" class="${i === 0 ? "active" : ""}">`).join("")}</div>` : ""}`
    : `<div class="stage"><span class="counter">fotó hamarosan</span></div>`;

  const cross = p.save > 0 ? `<div class="pcross" data-cross>${fmtHUF(p.huGross)}</div>` : "";
  const save = p.save > 0 ? `<div class="psave" data-save>−${fmtHUF(p.save)}</div>` : "";

  const body = `
<div class="wrap">
  <div class="crumb"><a href="../../">Főoldal</a> / <a href="../../autoink/">Autóink</a> / <b>${esc(title)}</b></div>
  <div class="layout">
    <div class="gallery">${stage}
      <div class="card"><h2 class="sec-h">Áttekintés</h2>
        <div class="iconrow">${iconItems.map(([k, v]) => `<div class="ic"><span class="dot">${SPEC_ICONS[k] || ""}</span><div><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div></div>`).join("")}</div>
        <p class="desc" style="margin-top:18px">${esc(descText)}</p>
      </div>
      <div class="card"><h2 class="sec-h">Műszaki adatok</h2>
        <table><tbody>${specs.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join("")}</tbody></table></div>
      ${flat.length ? `<div class="card"><h2 class="sec-h">Felszereltség</h2><div class="dfeat" id="featbox">${flat.map((f, i) => `<div class="${i >= 8 ? "fmore" : ""}"><span>${esc(f)}</span></div>`).join("")}</div>${flat.length > 8 ? `<button class="showmore" data-t="featbox" data-l="Több megjelenítése (${flat.length - 8})">Több megjelenítése (${flat.length - 8})</button>` : ""}</div>` : ""}
      ${eq.length ? `<div class="card"><h2 class="sec-h">Járműleírás</h2><div class="cateq" id="cateqbox">${cateqHtml}</div>${flat.length > 12 ? `<button class="showmore" data-t="cateqbox" data-l="Több megjelenítése">Több megjelenítése</button>` : ""}</div>` : ""}
    </div>
    <aside class="side">
      <div class="panel">
        <div class="badge"><span class="cond">Használt</span><span class="year">${esc(c.evjarat || "")}</span></div>
        <div class="ptitle">${esc(title)}</div>
        <div data-eur="${p.eur}" data-net="${nEur(c.vetel_eur_netto)}">
          <div class="plabel">Nettó ár</div>
          <div class="price" data-main>${fmtHUF(p.main)}</div>
          <div class="peur">${fmtEUR(p.eur)}</div>
        </div>
        <div class="taxnote">Nettó ár (áfa nélkül). Árfolyam: 1 € ≈ ${rate} Ft.</div>
        <a class="btn btn-primary" style="width:100%;margin-top:16px" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Ajánlatkérés: " + title)}">Ajánlatkérés</a>
        <a class="btn btn-soft" style="width:100%;margin-top:10px" href="../../autoink/">Vissza a listához</a>
      </div>
      <div class="panel dl">
        <h4 style="margin:0 0 6px;font-size:18px;font-weight:800">Autó adatlap</h4>
        <p style="margin:0 0 14px;color:var(--muted);font-size:14px;line-height:1.45">Töltsd le az autó teljes adatlapját PDF-ben — árral, műszaki adatokkal és felszereltséggel. A megnyíló ablakban válaszd a „Mentés PDF-ként” opciót.</p>
        <button class="btn btn-soft dlbtn" id="pdfbtn" type="button">${DL_ICON}Adatlap letöltése (PDF)</button>
      </div>
      ${contactCardHtml()}
      <div class="panel"><h4 style="margin:0 0 14px;font-size:18px;font-weight:800">Miért tőlünk vásárolj?</h4>${benefitsHtml()}</div>
    </aside>
  </div>
  ${related.length ? `<h2 class="rel-h">Hasonló autók</h2><div class="rel-grid">${related.map((r) => carCard(r, rate, "../../")).join("")}</div>` : ""}
</div>
<script>
(function(){
  [].forEach.call(document.querySelectorAll('.showmore'),function(b){b.addEventListener('click',function(){var box=document.getElementById(b.getAttribute('data-t'));if(!box)return;var o=box.classList.toggle('open');b.textContent=o?'Kevesebb megjelenítése':b.getAttribute('data-l');});});
  var PDF_DOC=${JSON.stringify(pdfDoc).replace(/</g, "\\u003c")};
  var PDF_NAME=${JSON.stringify(pdfName)};
  var pb=document.getElementById('pdfbtn');
  if(pb)pb.addEventListener('click',function(){var w=window.open('about:blank','_blank');if(!w){alert('A böngésző blokkolta a felugró ablakot. Engedélyezd, majd próbáld újra a letöltést.');return;}w.document.open();w.document.write(PDF_DOC);w.document.close();try{w.document.title=PDF_NAME;}catch(e){}try{w.addEventListener('load',function(){try{w.document.title=PDF_NAME;}catch(e){}});}catch(e){}});
})();
</` + `script>
${g.length > 1 ? `<script>
var CAG=${JSON.stringify(g)},CI=0;
function ca_go(i){CI=(i+CAG.length)%CAG.length;document.getElementById('stg').src=CAG[CI];document.getElementById('cidx').textContent=CI+1;
 var t=document.getElementById('thumbs');if(t){[].forEach.call(t.children,function(im,j){im.className=j===CI?'active':'';});}}
function ca_step(d){ca_go(CI+d);}
</script>` : ""}`;

  const ld = {
    "@context": "https://schema.org", "@type": "Car", name: title,
    brand: { "@type": "Brand", name: c.marka || "" },
    ...(g[0] ? { image: g[0] } : {}),
    description: descText,
    ...(c.uzemanyag ? { fuelType: c.uzemanyag } : {}),
    ...(c.valto ? { vehicleTransmission: c.valto } : {}),
    ...(c.km ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: nEur(c.km), unitCode: "KMT" } } : {}),
    ...(c.evjarat ? { vehicleModelDate: c.evjarat } : {}),
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer", price: p.main, priceCurrency: "HUF",
      availability: "https://schema.org/InStock", url: SITE_BASE + "/auto/" + slug + "/",
    },
  };
  const bc = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Főoldal", item: SITE_BASE + "/" },
      { "@type": "ListItem", position: 2, name: "Autóink", item: SITE_BASE + "/autoink/" },
      { "@type": "ListItem", position: 3, name: title, item: SITE_BASE + "/auto/" + slug + "/" },
    ],
  };
  return page({
    title: `${title} (${c.evjarat || ""}) — ${BRAND}`,
    desc: `${title} eladó — ${specStr(c)}. ${fmtHUF(p.main)} (${fmtEUR(p.eur)}). Nettó ár (áfa nélkül), garancia, ${BRAND} import.`,
    canonical: SITE_BASE + "/auto/" + slug + "/", rel: "../../", css, body,
    head: `<meta property="og:type" content="product">${g[0] ? `<meta property="og:image" content="${attr(g[0])}">` : ""}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(bc)}</script>`,
  });
}

// --------------------------------------------------------------- write
async function main() {
  const args = process.argv.slice(2);
  const csvArg = args.includes("--csv") ? args[args.indexOf("--csv") + 1] : null;
  let csv;
  if (csvArg) { csv = await fs.readFile(csvArg, "utf8"); console.log("Using local CSV:", csvArg); }
  else { console.log("Fetching sheet…"); csv = await (await fetch(SHEET_CSV_URL, { cache: "no-store" })).text(); }
  const cars = parseCSV(csv);
  for (const ec of EXTRA_CARS) if (!cars.some((c) => slugify(c.modell) === slugify(ec.modell))) cars.push(ec);
  const rate = await getRate();
  console.log(`Parsed ${cars.length} rows, ${cars.filter(isActive).length} active. Rate=${rate}`);

  const outDir = path.resolve(OUT);
  await fs.mkdir(outDir, { recursive: true });

  const write = async (rel, html) => {
    const fp = path.join(outDir, rel);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, html);
  };

  await write("index.html", renderHome(cars, rate));
  await write("autoink/index.html", renderCatalog(cars, rate));

  const active = cars.filter(isActive);
  const urls = [SITE_BASE + "/", SITE_BASE + "/autoink/"];
  const seen = new Set();
  for (const c of active) {
    const slug = slugify(c.modell);
    if (!slug || seen.has(slug)) continue; // first active wins on dupes
    seen.add(slug);
    await write(`auto/${slug}/index.html`, renderDetail(c, cars, rate));
    urls.push(SITE_BASE + "/auto/" + slug + "/");
  }

  const now = new Date().toISOString().slice(0, 10);
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  await write("sitemap.xml", sitemap);
  await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_BASE}/sitemap.xml\n`);

  console.log(`Done. ${seen.size} car pages + home + catalog + sitemap (${urls.length} urls) -> ${outDir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
