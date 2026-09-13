// Build lepes: on-page "konfigurátor" relevancia az /egyedi-auto-rendeles/ oldalon.
//
// MIERT
// Az oldal az Ahrefs/GSC szerint a "bmw konfigurátor", "mercedes konfigurátor",
// "audi konfigurátor" kulcsszavakra a 7-8. pozicion all, DE 0 kattintassal — mert a
// latoto on-page tartalom alig hasznalja a "konfigurátor" szot (a H1 "Egyedi autó
// rendelés", a H2 "Autó behozatal..."). Ez a lepes a mar meglevo, jol strukturalt
// tartalmat egeszíti ki a konfigurátor-klaszterre: H2-cim, egy uj bekezdes, egy GYIK
// tetel, es a lathato GYIK-hez illeszkedo FAQPage strukturalt adat.
//
// A kesz dist/-en dolgozik, pontos szoveg-horgonyokra tamaszkodik, idempotens
// (ujra futtatva nem duplikal), hiba eseten exit 0 (a build megy tovabb).
import fs from 'node:fs';

const FILE = 'dist/egyedi-auto-rendeles/index.html';

try {
  if (!fs.existsSync(FILE)) { console.log('seo-egyedi: nincs ' + FILE + ' - kihagyva'); process.exit(0); }
  let h = fs.readFileSync(FILE, 'utf8');
  let changed = false;

  // 1) H2 — a konfigurátor kulcsszavak a cimbe (eros on-page jelzes)
  const H2_OLD = '<h2 class="egl-seo-h">Autó behozatal Németországból — egyedi rendelés kulcsrakészen</h2>';
  const H2_NEW = '<h2 class="egl-seo-h">BMW, Mercedes és Audi konfigurátor – egyedi autó rendelés Németországból</h2>';
  if (h.includes(H2_OLD)) { h = h.replace(H2_OLD, H2_NEW); changed = true; }

  // 2) Uj bekezdes a konfigurátorrol (a "Jó tudni" blokk 3. bekezdese utan)
  const P_ANCHOR = 'Válaszd ki a márkát fent, és nézd meg az elérhető modelleket.</p>';
  const P_NEW = '<p>Ismered a gyári <strong>BMW konfigurátor</strong>, <strong>Mercedes konfigurátor</strong> vagy <strong>Audi konfigurátor</strong> felületét? Állítsd össze ott az álomautódat — motorizáció, szín, felni és felszereltség —, a kész specifikációt pedig küldd el nekünk: megkeressük a német piacon, bevizsgáljuk, és kulcsrakészen, forgalomba helyezve, forintban is kiszámítható áron hozzuk be. Így a konfigurálás élményét megkapod, az ügyintézést pedig ránk bízhatod.</p>';
  if (h.includes(P_ANCHOR) && !h.includes('BMW konfigurátor</strong>')) {
    h = h.replace(P_ANCHOR, P_ANCHOR + ' ' + P_NEW);
    changed = true;
  }

  // 3) Konfigurátor GYIK-elem (a "Gyakori kérdések" H2 utan)
  const FAQ_ANCHOR = '<h2 class="egl-seo-h">Gyakori kérdések</h2>';
  const FAQ_Q = 'Használhatom a BMW, Mercedes vagy Audi konfigurátort?';
  const FAQ_A = 'Igen — állítsd össze az autót a gyári konfigurátorban, majd küldd el nekünk a kész felszereltségi specifikációt. Megkeressük a német piacon, bevizsgáljuk, és kulcsrakészen, honosítva hozzuk be. A konfigurálás a tiéd, a beszerzés és a teljes ügyintézés a miénk.';
  const FAQ_NEW = '<details><summary>' + FAQ_Q + '<span class="pl">+</span></summary><p>' + FAQ_A + '</p></details>';
  if (h.includes(FAQ_ANCHOR) && !h.includes(FAQ_Q)) {
    h = h.replace(FAQ_ANCHOR, FAQ_ANCHOR + ' ' + FAQ_NEW);
    changed = true;
  }

  // 4) FAQPage strukturalt adat (a lathato GYIK-hez illeszkedve) — a </head> ele, egyszer
  if (!h.includes('"@type":"FAQPage"')) {
    const faq = [
      [FAQ_Q, FAQ_A],
      ['Hogyan zajlik az egyedi autó rendelés?', 'Válaszd ki a márkát és a modellt, mondd el a kívánt felszereltséget és költségkeretet, a többit mi intézzük: felkutatjuk a német piacon, a helyszínen bevizsgáljuk, megvásároljuk, behozzuk és a nevedre, forgalomba helyezve adjuk át — kulcsrakészen.'],
      ['Mennyibe kerül a behozatal?', 'A behozatal, a vám és a teljes ügyintézés díja a modelltől függ, de átlátható és előre rögzített. A nagy német kínálat és a 19%-os német áfa miatt a végösszeg gyakran még így is kedvezőbb, mint egy hasonló hazai autóé.'],
      ['Melyik márkákat lehet rendelni?', 'Elsősorban német prémium márkákat: BMW, MINI, Mercedes és Audi. Gyakorlatilag a teljes német kínálatból megkeressük a hozzád illő új vagy alig használt darabot.'],
      ['Mit jelent a 19%-os német áfa?', 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett — ez önmagában több százezer forintos megtakarítást jelenthet.'],
      ['Mennyi idő a teljes folyamat?', 'A kiválasztott modelltől és a beszerzéstől függ, jellemzően néhány hét. A pontos időt előre egyeztetjük, és végig tájékoztatunk a folyamat állásáról.'],
    ];
    const json = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    };
    const tag = '<script type="application/ld+json">' + JSON.stringify(json) + '</' + 'script>';
    if (h.includes('</head>')) { h = h.replace('</head>', tag + '</head>'); changed = true; }
  }

  if (changed) { fs.writeFileSync(FILE, h); console.log('seo-egyedi: on-page konfigurátor relevancia frissitve'); }
  else { console.log('seo-egyedi: nincs teendo (mar frissitve vagy hianyzo horgony)'); }
} catch (e) {
  console.log('seo-egyedi: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
