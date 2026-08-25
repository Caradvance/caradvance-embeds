export const FAMILIES = {
  A3: {
    tagline: 'A prémium kompakt, amivel a mindennapok is élménnyé válnak',
    video: 'O6fZDiaic0Y',
    intro: 'Az Audi A3 a prémium kompakt szegmens mércéje: feszes, precíz vezetési élmény, kiváló anyagminőség és a nagyobb Audikból ismert digitális élmény egy kezelhető méretű karosszériában. Németországból, egyedi konfigurációval és kulcsrakész behozatallal a CarAdvance-től.',
    highlights: [
      { icon: '⚡', title: 'Hatékony TFSI és TDI motorok', text: 'Mild-hybrid technológiával támogatott, kulturált és takarékos erőforrások a városi és autópályás használatra egyaránt.' },
      { icon: '🅿️', title: 'Digitális Audi élmény', text: 'Audi virtual cockpit és 10,1"-os MMI touch érintőképernyő, okostelefon-integrációval (Apple CarPlay, Android Auto).' },
      { icon: '🛡️', title: 'Prémium biztonság', text: 'Fejlett vezetéstámogató rendszerek, LED / Matrix LED fényszórók és az Audi ismert felépítési minősége.' },
    ],
    sections: [
      { title: 'Vezetési élmény és felszereltség', body: 'Az A3 alapból is gazdagon felszerelt: kétzónás klíma, digitális műszeregység, ambient világítás és minőségi kárpitok. A választható S line csomaggal sportosabb megjelenést és feszesebb futóművet kapsz, míg a Matrix LED fényszóró éjszaka is nappali biztonságot ad.' },
      { title: 'Miért a CarAdvance-től rendeld?', body: 'Müncheni hátterünkkel közvetlen rálátásunk van a német piacra. Magánszemélyként akár 19%-os német áfával vásárolhatsz a hazai 27% helyett, a teljes behozatalt — keresés, ellenőrzés, szállítás, honosítás — kulcsrakészen intézzük, előre rögzített, átlátható feltételekkel.' },
    ],
    faq: [
      { q: 'Mennyi idő alatt érkezik meg az autó?', a: 'Új, gyári rendelés esetén a szállítási idő a konfigurációtól függ; készletről elérhető darabnál akár néhány hét. Konkrét határidőt a kiválasztott konfigurációra adunk.' },
      { q: 'Mennyit spórolok a német áfával?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett, ami a listaár jelentős részét jelentheti.' },
    ],
  },
  RS3: {
    tagline: 'Öthengeres legenda: 400 lóerő, quattro, tiszta érzelem',
    video: 'O6fZDiaic0Y',
    intro: 'Az Audi RS 3 a szegmens egyik legkarizmatikusabb sportautója. A 2,5 literes, öthengeres TFSI motor 400 lóerővel és jellegzetes hangjával, a quattro összkerékhajtással és az RS torque splitterrel olyan élményt ad, amit egyszer érezni kell. Németországból, kulcsrakészen.',
    highlights: [
      { icon: '🔥', title: '2.5 TFSI · 400 LE', text: 'Az ikonikus öthengeres motor 500 Nm nyomatékkal, 3,8 mp-es 0–100 km/h gyorsulással.' },
      { icon: '🏁', title: 'quattro + torque splitter', text: 'Változtatható nyomatékelosztás a hátsó keréken — drift mód és tökéletes tapadás egyben.' },
      { icon: '🎯', title: 'RS dizájn és kijelzők', text: 'RS-specifikus lökhárítók, kipufogó, sportülések és dedikált RS műszeregység-nézetek.' },
    ],
    sections: [
      { title: 'Teljesítmény, ami megkülönböztet', body: 'Az RS 3 nem csupán gyors: az öthengeres motor egyedi gyújtási sorrendje adja azt a hangot és karaktert, ami az Audi Sport örökségének része. A választható RS dinamikus csomaggal a végsebesség 290 km/h-ra emelhető, kerámia fékek pedig a versenypályára is felkészítenek.' },
      { title: 'Miért a CarAdvance-től rendeld?', body: 'Müncheni hátterünkkel közvetlen rálátásunk van a német piacra. Magánszemélyként akár 19%-os német áfával vásárolhatsz a hazai 27% helyett, a teljes behozatalt kulcsrakészen intézzük, előre rögzített feltételekkel.' },
    ],
    faq: [
      { q: 'A végsebesség hogyan emelhető?', a: 'Az RS dinamikus csomaggal a gyárilag korlátozott 250 km/h akár 290 km/h-ra emelhető. A pontos elérhetőséget a konfigurációnál egyeztetjük.' },
      { q: 'Mennyit spórolok a német áfával?', a: 'Magánszemélyként a müncheni Caradvance GmbH-n keresztül akár 19%-os német áfával vásárolhatsz a hazai 27% helyett.' },
    ],
  },
};

// ---- Variáns-szintű adatok ----
export const MODELS = {
  'a3lim-benzin': { key:'a3lim', name:'Audi A3 Limousine', family:'A3', body:'Limuzin', fuels:['Benzin','Hibrid','Dízel'], from:32650,
    specs:[['Karosszéria','4 ajtós limuzin'],['Motorok','1.5 TFSI / 2.0 TDI (mild-hybrid)'],['Teljesítmény','116–150 LE'],['Hajtás','Első / quattro'],['Váltó','7 fokozatú S tronic'],['Gyorsulás (0–100)','kb. 8,1 mp-től'],['Végsebesség','kb. 224 km/h'],['Csomagtér','425 liter'],['Fogyasztás','kb. 5,3 l/100 km-től']] },
  'a3sb-benzin': { key:'a3sb', name:'Audi A3 Sportback', family:'A3', body:'Ferdehátú', fuels:['Benzin','Hibrid','Dízel'], from:31850,
    specs:[['Karosszéria','5 ajtós ferdehátú'],['Motorok','1.5 TFSI / 2.0 TDI (mild-hybrid)'],['Teljesítmény','116–150 LE'],['Hajtás','Első / quattro'],['Váltó','7 fokozatú S tronic'],['Gyorsulás (0–100)','kb. 8,1 mp-től'],['Végsebesség','kb. 224 km/h'],['Csomagtér','380 liter'],['Fogyasztás','kb. 5,3 l/100 km-től']] },
  'a3allstreet-benzin': { key:'a3allstreet', name:'Audi A3 allstreet', family:'A3', body:'Ferdehátú (crossover)', fuels:['Benzin','Hibrid','Dízel'], from:36550,
    specs:[['Karosszéria','Emelt, crossover stílusú A3'],['Motorok','1.5 TFSI / 2.0 TDI (mild-hybrid)'],['Teljesítmény','116–150 LE'],['Hajtás','Első / quattro'],['Váltó','7 fokozatú S tronic'],['Hasmagasság','Emelt, robusztus dizájn'],['Gyorsulás (0–100)','kb. 8,3 mp-től'],['Csomagtér','380 liter'],['Fogyasztás','kb. 5,4 l/100 km-től']] },
  'rs3lim-benzin': { key:'rs3lim', name:'Audi RS 3 Limousine', family:'RS3', body:'Limuzin', fuels:['Benzin'], from:70500,
    specs:[['Karosszéria','4 ajtós sportlimuzin'],['Motor','2.5 TFSI öthengeres'],['Teljesítmény','400 LE / 500 Nm'],['Hajtás','quattro + RS torque splitter'],['Váltó','7 fokozatú S tronic'],['Gyorsulás (0–100)','3,8 mp'],['Végsebesség','250 km/h (opc. 290 km/h)'],['Csomagtér','321 liter'],['Fék','Opcionális kerámia']] },
  'rs3sb-benzin': { key:'rs3sb', name:'Audi RS 3 Sportback', family:'RS3', body:'Ferdehátú', fuels:['Benzin'], from:68500,
    specs:[['Karosszéria','5 ajtós sport ferdehátú'],['Motor','2.5 TFSI öthengeres'],['Teljesítmény','400 LE / 500 Nm'],['Hajtás','quattro + RS torque splitter'],['Váltó','7 fokozatú S tronic'],['Gyorsulás (0–100)','3,8 mp'],['Végsebesség','250 km/h (opc. 290 km/h)'],['Csomagtér','282 liter'],['Fék','Opcionális kerámia']] },
};
