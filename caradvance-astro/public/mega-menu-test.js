/* CarAdvance — asztali mega menü (élő). Minden oldalra a build utolsó lépése (inject-megamenu.mjs) teszi be.
   Asztali nézetben (>= 1100 px) a fő menüpontok alá teljes szélességű panelt nyit; mobilon a régi menü marad.
   Nyelv: a <html lang> alapján (hu, en, de, fr, uk, zh, sk, cs). A linkek magyar útvonalak — a nyelvi oldalakon
   a rt-<nyelv>.js futásidejű fordító lokalizálja őket, a .sk/.cz domainen pedig az árakat is átváltja. */
(function () {
  'use strict';
  if (window.__caMM) return; window.__caMM = 1;
  var MIN_W = 1100;
  /* ---- nyelv: a <html lang> alapján (hu, en, de, fr, uk, zh-Hans, sk, cs) ---- */
  var LANGS = ['hu', 'en', 'de', 'fr', 'uk', 'zh', 'sk', 'cs'];
  var LANG = (function () { var l = String(document.documentElement.getAttribute('lang') || 'hu').toLowerCase().split('-')[0]; return LANGS.indexOf(l) >= 0 ? l : 'hu'; })();
  var LI = LANGS.indexOf(LANG);
  /* fordítások: magyar kulcs -> [en, de, fr, uk, zh, sk, cs] */
  var TR = {
    'Bérelhető autóink': ['Cars available for rent', 'Verfügbare Mietwagen', 'Voitures disponibles à la location', 'Авто для оренди', '可租车辆', 'Autá na prenájom', 'Vozy k pronájmu'],
    'Kiemelt bérelhető autók': ['Featured rental cars', 'Ausgewählte Mietwagen', 'Voitures de location à la une', 'Рекомендовані авто для оренди', '精选租赁车辆', 'Odporúčané autá na prenájom', 'Doporučené vozy k pronájmu'],
    'Összes bérelhető autó': ['All rental cars', 'Alle Mietwagen', 'Toutes les voitures de location', 'Усі авто для оренди', '全部租赁车辆', 'Všetky autá na prenájom', 'Všechny vozy k pronájmu'],
    'Mi a tartós bérlet?': ['What is long-term rental?', 'Was ist Langzeitmiete?', 'Qu’est-ce que la location longue durée ?', 'Що таке довгострокова оренда?', '什么是长期租赁？', 'Čo je dlhodobý prenájom?', 'Co je dlouhodobý pronájem?'],
    'Minden benne van egy havi díjban': ['Everything in one monthly fee', 'Alles in einer Monatsrate', 'Tout compris dans un loyer mensuel', 'Усе в одному щомісячному платежі', '一笔月费，全部包含', 'Všetko v jednom mesačnom poplatku', 'Vše v jednom měsíčním poplatku'],
    'Autók összehasonlítása': ['Compare cars', 'Autos vergleichen', 'Comparer les voitures', 'Порівняння авто', '车辆对比', 'Porovnanie áut', 'Porovnání vozů'],
    'Akár 3 modell egymás mellett': ['Up to 3 models side by side', 'Bis zu 3 Modelle nebeneinander', 'Jusqu’à 3 modèles côte à côte', 'До 3 моделей поруч', '最多 3 款车型并排对比', 'Až 3 modely vedľa seba', 'Až 3 modely vedle sebe'],
    'Bérlési folyamat': ['Rental process', 'Ablauf der Miete', 'Déroulement de la location', 'Процес оренди', '租赁流程', 'Proces prenájmu', 'Průběh pronájmu'],
    'Lépésről lépésre az átadásig': ['Step by step to handover', 'Schritt für Schritt bis zur Übergabe', 'Étape par étape jusqu’à la remise', 'Крок за кроком до передачі', '一步步直到交车', 'Krok za krokom až po odovzdanie', 'Krok za krokem až k předání'],
    'Feltételek és kaució': ['Terms and deposit', 'Bedingungen und Kaution', 'Conditions et caution', 'Умови та застава', '条款与押金', 'Podmienky a kaucia', 'Podmínky a kauce'],
    'Önrész, km-keret, kaució': ['Excess, mileage limit, deposit', 'Selbstbeteiligung, km-Kontingent, Kaution', 'Franchise, kilométrage, caution', 'Франшиза, ліміт км, застава', '自付额、里程额度、押金', 'Spoluúčasť, limit km, kaucia', 'Spoluúčast, limit km, kauce'],
    'Előnyök': ['Benefits', 'Vorteile', 'Avantages', 'Переваги', '优势', 'Výhody', 'Výhody'],
    'Miért éri meg bérelni?': ['Why rent?', 'Warum mieten?', 'Pourquoi louer ?', 'Чому варто орендувати?', '为什么选择租赁？', 'Prečo sa oplatí prenajať?', 'Proč se vyplatí pronajmout?'],
    'Gyakori kérdések': ['FAQ', 'Häufige Fragen', 'Questions fréquentes', 'Часті запитання', '常见问题', 'Časté otázky', 'Časté dotazy'],
    'Válaszok a gyakori kérdésekre': ['Answers to common questions', 'Antworten auf häufige Fragen', 'Réponses aux questions fréquentes', 'Відповіді на часті запитання', '常见问题解答', 'Odpovede na časté otázky', 'Odpovědi na časté dotazy'],
    'Egyedi autó rendelés': ['Custom car order', 'Individuelle Autobestellung', 'Voiture sur mesure', 'Індивідуальне замовлення авто', '定制订车', 'Auto na mieru', 'Vůz na míru'],
    'Kiemelt eladó autók': ['Featured cars for sale', 'Ausgewählte Autos zum Verkauf', 'Voitures à vendre à la une', 'Рекомендовані авто на продаж', '精选在售车辆', 'Odporúčané autá na predaj', 'Doporučené vozy na prodej'],
    'Összes eladó autó': ['All cars for sale', 'Alle Autos zum Verkauf', 'Toutes les voitures à vendre', 'Усі авто на продаж', '全部在售车辆', 'Všetky autá na predaj', 'Všechny vozy na prodej'],
    'Autóink': ['Our cars', 'Unsere Autos', 'Nos voitures', 'Наші авто', '我们的车辆', 'Naše autá', 'Naše vozy'],
    'Ellenőrzött autók Németországból': ['Inspected cars from Germany', 'Geprüfte Autos aus Deutschland', 'Voitures contrôlées d’Allemagne', 'Перевірені авто з Німеччини', '来自德国的检测车辆', 'Preverené autá z Nemecka', 'Prověřené vozy z Německa'],
    'Finanszírozás – lízing': ['Financing – leasing', 'Finanzierung – Leasing', 'Financement – leasing', 'Фінансування – лізинг', '融资 – 租赁', 'Financovanie – lízing', 'Financování – leasing'],
    'Havi részlet kiszámolása': ['Calculate the monthly instalment', 'Monatsrate berechnen', 'Calculer la mensualité', 'Розрахунок щомісячного платежу', '计算月供', 'Výpočet mesačnej splátky', 'Výpočet měsíční splátky'],
    'Operatív lízing': ['Operating lease', 'Operating-Leasing', 'Leasing opérationnel', 'Оперативний лізинг', '经营租赁', 'Operatívny lízing', 'Operativní leasing'],
    'Cégeknek, nettó áron': ['For companies, at net prices', 'Für Firmen, zu Nettopreisen', 'Pour les entreprises, prix HT', 'Для компаній, ціни без ПДВ', '面向企业，不含税价格', 'Pre firmy, za ceny bez DPH', 'Pro firmy, za ceny bez DPH'],
    'Miért vásárolj tőlünk?': ['Why buy from us?', 'Warum bei uns kaufen?', 'Pourquoi acheter chez nous ?', 'Чому купувати в нас?', '为什么在我们这里购车？', 'Prečo kúpiť u nás?', 'Proč koupit u nás?'],
    'Áfa, garancia, átadás': ['VAT, warranty, handover', 'MwSt., Garantie, Übergabe', 'TVA, garantie, remise', 'ПДВ, гарантія, передача', '增值税、保修、交车', 'DPH, záruka, odovzdanie', 'DPH, záruka, předání'],
    'Bizományos autóink': ['Our consignment cars', 'Unsere Kommissionsautos', 'Nos voitures en dépôt-vente', 'Наші авто на комісії', '我们的寄售车辆', 'Naše autá v komisnom predaji', 'Naše vozy v komisním prodeji'],
    'Összes bizományos autó': ['All consignment cars', 'Alle Kommissionsautos', 'Toutes les voitures en dépôt-vente', 'Усі авто на комісії', '全部寄售车辆', 'Všetky autá v komisnom predaji', 'Všechny vozy v komisním prodeji'],
    'Eladom az autómat': ['Sell my car', 'Mein Auto verkaufen', 'Vendre ma voiture', 'Продати моє авто', '出售我的车', 'Predať moje auto', 'Prodat moje auto'],
    'Ingyenes értékbecslés': ['Free valuation', 'Kostenlose Bewertung', 'Estimation gratuite', 'Безкоштовна оцінка', '免费估价', 'Bezplatné ocenenie', 'Bezplatné ocenění'],
    'Eladó autók ügyfeleinktől': ['Cars for sale from our clients', 'Autos unserer Kunden', 'Voitures de nos clients', 'Авто наших клієнтів на продаж', '客户在售车辆', 'Autá na predaj od našich klientov', 'Vozy na prodej od našich klientů'],
    'Értékesítési folyamat': ['Sales process', 'Verkaufsablauf', 'Processus de vente', 'Процес продажу', '销售流程', 'Proces predaja', 'Průběh prodeje'],
    'Mi intézünk mindent': ['We handle everything', 'Wir erledigen alles', 'Nous nous occupons de tout', 'Ми все беремо на себе', '一切由我们办理', 'Všetko vybavíme my', 'Vše vyřídíme my'],
    'Jótékonyság': ['Charity', 'Wohltätigkeit', 'Solidarité', 'Благодійність', '公益', 'Charita', 'Charita'],
    'Minden eladás után adományozunk': ['We donate after every sale', 'Wir spenden nach jedem Verkauf', 'Un don après chaque vente', 'Пожертва після кожного продажу', '每成交一辆车都会捐款', 'Po každom predaji darujeme', 'Po každém prodeji darujeme'],
    'Díjak, határidők, papírok': ['Fees, deadlines, paperwork', 'Gebühren, Fristen, Papiere', 'Frais, délais, documents', 'Комісії, терміни, документи', '费用、期限、文件', 'Poplatky, termíny, doklady', 'Poplatky, lhůty, doklady'],
    'Akiket támogatunk': ['Who we support', 'Wen wir unterstützen', 'Ceux que nous soutenons', 'Кого ми підтримуємо', '我们支持的机构', 'Koho podporujeme', 'Koho podporujeme'],
    'Add el nálunk az autód': ['Sell your car with us', 'Verkaufen Sie Ihr Auto bei uns', 'Vendez votre voiture avec nous', 'Продайте авто з нами', '通过我们出售您的车', 'Predajte auto s nami', 'Prodejte auto s námi'],
    'Ingyenes értékbecslés, hirdetés, bemutatás és papírmunka – mi intézzük.': ['Free valuation, advertising, viewings and paperwork – we handle it all.', 'Kostenlose Bewertung, Inserat, Besichtigungen und Papierkram – wir erledigen alles.', 'Estimation gratuite, annonce, visites et formalités – nous nous occupons de tout.', 'Безкоштовна оцінка, реклама, покази та документи – усе робимо ми.', '免费估价、发布广告、带看及办理手续——全部由我们负责。', 'Bezplatné ocenenie, inzercia, obhliadky a papierovanie – všetko vybavíme.', 'Bezplatné ocenění, inzerce, prohlídky a papírování – vše vyřídíme.'],
    'Értékbecslést kérek': ['Get a valuation', 'Bewertung anfragen', 'Demander une estimation', 'Замовити оцінку', '申请估价', 'Chcem ocenenie', 'Chci ocenění'],
    'Támogatjuk': ['We support', 'Wir unterstützen', 'Nous soutenons', 'Підтримуємо', '我们支持', 'Podporujeme', 'Podporujeme'],
    'Támogattuk': ['We supported', 'Unterstützt', 'Nous avons soutenu', 'Ми підтримали', '已支持', 'Podporili sme', 'Podpořili jsme'],
    'Eladva': ['Sold', 'Verkauft', 'Vendu', 'Продано', '已售', 'Predané', 'Prodáno'],
    'Elkelt': ['Sold', 'Verkauft', 'Vendu', 'Продано', '售出日期', 'Predané', 'Prodáno'],
    'elkelt': ['sold', 'verkauft', 'vendu', 'продано', '已售出', 'predané', 'prodáno'],
    'bruttó': ['incl. VAT', 'brutto', 'TTC', 'з ПДВ', '含税', 's DPH', 's DPH'],
    'nettó': ['excl. VAT', 'netto', 'HT', 'без ПДВ', '不含税', 'bez DPH', 'bez DPH'],
    'Ajánlatot kérek': ['Request a quote', 'Angebot anfordern', 'Demander un devis', 'Запросити пропозицію', '获取报价', 'Chcem ponuku', 'Chci nabídku'],
    'készleten': ['in stock', 'auf Lager', 'en stock', 'в наявності', '现货', 'skladom', 'skladem'],
    'Azonnal elvihető': ['Available immediately', 'Sofort verfügbar', 'Disponible immédiatement', 'Доступно одразу', '即刻可提', 'Ihneď k odberu', 'Ihned k odběru'],
    'elérhető': ['available', 'verfügbar', 'disponibles', 'доступно', '辆可用', 'dostupné', 'k dispozici'],
    'azonnal elérhető': ['available now', 'sofort verfügbar', 'disponibles tout de suite', 'доступно одразу', '辆现车', 'ihneď dostupné', 'ihned k dispozici'],
    'Hamarosan': ['Coming soon', 'Demnächst', 'Bientôt', 'Незабаром', '即将上市', 'Čoskoro', 'Brzy'],
    'Autó rendelés': ['Car order', 'Autobestellung', 'Commande de voiture', 'Замовлення авто', '订车', 'Objednávka auta', 'Objednávka vozu'],
    'Megkeressük, ellenőrizzük, hazahozzuk': ['We find, inspect and deliver it', 'Wir finden, prüfen und liefern es', 'Nous trouvons, contrôlons et livrons', 'Знайдемо, перевіримо, доставимо', '我们寻车、检测并运回', 'Nájdeme, preveríme, privezieme', 'Najdeme, prověříme, dovezeme'],
    'Beszerzési folyamat': ['Sourcing process', 'Beschaffungsablauf', 'Processus d’achat', 'Процес закупівлі', '采购流程', 'Proces obstarania', 'Průběh obstarání'],
    'Az ajánlattól a forgalomba helyezésig': ['From offer to registration', 'Vom Angebot bis zur Zulassung', 'De l’offre à l’immatriculation', 'Від пропозиції до реєстрації', '从报价到上牌', 'Od ponuky po prihlásenie', 'Od nabídky po registraci'],
    'Egyedül vagy velünk?': ['On your own or with us?', 'Allein oder mit uns?', 'Seul ou avec nous ?', 'Самостійно чи з нами?', '自己办还是交给我们？', 'Sami alebo s nami?', 'Sami, nebo s námi?'],
    'Költségek és kockázatok összevetve': ['Costs and risks compared', 'Kosten und Risiken im Vergleich', 'Coûts et risques comparés', 'Порівняння витрат і ризиків', '成本与风险对比', 'Porovnanie nákladov a rizík', 'Srovnání nákladů a rizik'],
    'Miért Németországból?': ['Why from Germany?', 'Warum aus Deutschland?', 'Pourquoi d’Allemagne ?', 'Чому з Німеччини?', '为什么选择德国车？', 'Prečo z Nemecka?', 'Proč z Německa?'],
    'Referenciák': ['References', 'Referenzen', 'Références', 'Відгуки', '客户案例', 'Referencie', 'Reference'],
    'Ügyfeleink autói': ['Our clients’ cars', 'Autos unserer Kunden', 'Voitures de nos clients', 'Авто наших клієнтів', '客户的车辆', 'Autá našich klientov', 'Vozy našich klientů'],
    'Csak 30% előleg': ['Only 30% down payment', 'Nur 30 % Anzahlung', 'Seulement 30 % d’acompte', 'Лише 30% передоплати', '仅需 30% 定金', 'Len 30 % záloha', 'Jen 30% záloha'],
    'A legkedvezőbb a piacon': ['The best deal on the market', 'Das günstigste am Markt', 'Le plus avantageux du marché', 'Найвигідніше на ринку', '市场最优条件', 'Najvýhodnejšie na trhu', 'Nejvýhodnější na trhu'],
    'Kalkulátorok': ['Calculators', 'Rechner', 'Calculateurs', 'Калькулятори', '计算器', 'Kalkulačky', 'Kalkulačky'],
    'Honosítás kalkulátor': ['Registration cost calculator', 'Zulassungskostenrechner', 'Calculateur d’immatriculation', 'Калькулятор реєстрації', '落户费用计算器', 'Kalkulačka poplatkov', 'Kalkulačka poplatků'],
    'Átírás kalkulátor': ['Transfer fee calculator', 'Umschreibungsrechner', 'Calculateur de transfert', 'Калькулятор переоформлення', '过户费计算器', 'Kalkulačka prepisu', 'Kalkulačka přepisu'],
    'Lízing kalkulátor': ['Leasing calculator', 'Leasingrechner', 'Calculateur de leasing', 'Лізинговий калькулятор', '租赁计算器', 'Lízingová kalkulačka', 'Leasingová kalkulačka'],
    'Autó Németországból, kulcsrakészen': ['Cars from Germany, turnkey', 'Autos aus Deutschland, schlüsselfertig', 'Voitures d’Allemagne, clés en main', 'Авто з Німеччини під ключ', '德国车，交钥匙服务', 'Auto z Nemecka na kľúč', 'Vůz z Německa na klíč'],
    'Szállítás, honosítás, forgalomba helyezés – mi intézzük.': ['Transport, registration and paperwork – we handle it.', 'Transport, Zulassung und Papiere – wir erledigen das.', 'Transport, homologation, immatriculation – nous nous en chargeons.', 'Доставка, оформлення, реєстрація – усе робимо ми.', '运输、落户、上牌——全部由我们办理。', 'Doprava, prihlásenie, evidencia – vybavíme to.', 'Doprava, registrace, přihlášení – vyřídíme to.'],
    'Autót rendelek': ['Order a car', 'Auto bestellen', 'Commander une voiture', 'Замовити авто', '我要订车', 'Objednať auto', 'Objednat vůz'],
    '23 év': ['23 years', '23 Jahre', '23 ans', '23 роки', '23 年', '23 rokov', '23 let'],
    'tapasztalat': ['of experience', 'Erfahrung', 'd’expérience', 'досвіду', '行业经验', 'skúseností', 'zkušeností'],
    '2003 óta Németországban': ['In Germany since 2003', 'Seit 2003 in Deutschland', 'En Allemagne depuis 2003', 'У Німеччині з 2003 року', '自 2003 年起扎根德国', 'V Nemecku od roku 2003', 'V Německu od roku 2003'],
    'eladott prémium autó': ['premium cars sold', 'verkaufte Premiumautos', 'voitures premium vendues', 'проданих преміум-авто', '辆高端车已售出', 'predaných prémiových áut', 'prodaných prémiových vozů'],
    'Nézd meg ügyfeleink autóit': ['See our clients’ cars', 'Autos unserer Kunden ansehen', 'Voir les voitures de nos clients', 'Подивіться авто наших клієнтів', '查看客户的车辆', 'Pozrite si autá našich klientov', 'Prohlédněte si vozy našich klientů'],
    'Tovább': ['More', 'Mehr', 'En savoir plus', 'Детальніше', '了解更多', 'Viac', 'Více'],
    'Miért mi?': ['Why us?', 'Warum wir?', 'Pourquoi nous ?', 'Чому ми?', '为什么选择我们？', 'Prečo my?', 'Proč my?'],
    'Német háttér, magyar ügyintézés': ['German background, personal service', 'Deutscher Hintergrund, persönlicher Service', 'Racines allemandes, service personnalisé', 'Німецька база, особистий сервіс', '德国背景，贴心服务', 'Nemecké zázemie, osobný prístup', 'Německé zázemí, osobní přístup'],
    'Átláthatóság': ['Transparency', 'Transparenz', 'Transparence', 'Прозорість', '透明', 'Transparentnosť', 'Transparentnost'],
    'Tételes, előre rögzített árak': ['Itemised prices, fixed up front', 'Detaillierte, vorab festgelegte Preise', 'Prix détaillés, fixés à l’avance', 'Детальні, заздалегідь зафіксовані ціни', '明细清晰、事先确定的价格', 'Položkové, vopred stanovené ceny', 'Položkové, předem stanovené ceny'],
    'Minőségbiztosítás': ['Quality assurance', 'Qualitätssicherung', 'Assurance qualité', 'Контроль якості', '质量保证', 'Zabezpečenie kvality', 'Zajištění kvality'],
    'Ellenőrzött autók, garancia': ['Inspected cars, warranty', 'Geprüfte Autos, Garantie', 'Voitures contrôlées, garantie', 'Перевірені авто, гарантія', '检测车辆，提供保修', 'Preverené autá, záruka', 'Prověřené vozy, záruka'],
    'Ügyfeleink történetei': ['Our clients’ stories', 'Geschichten unserer Kunden', 'Histoires de nos clients', 'Історії наших клієнтів', '客户故事', 'Príbehy našich klientov', 'Příběhy našich klientů'],
    'Media': ['Media', 'Medien', 'Médias', 'Медіа', '媒体', 'Médiá', 'Média'],
    'Megjelenések': ['Press coverage', 'Presse', 'Dans la presse', 'Публікації', '媒体报道', 'V médiách', 'V médiích'],
    'Blog': ['Blog', 'Blog', 'Blog', 'Блог', '博客', 'Blog', 'Blog'],
    'Útmutatók, adók, árak': ['Guides, taxes, prices', 'Ratgeber, Steuern, Preise', 'Guides, taxes, prix', 'Поради, податки, ціни', '指南、税费、价格', 'Návody, dane, ceny', 'Návody, daně, ceny'],
    'Gyere be hozzánk': ['Visit us', 'Besuchen Sie uns', 'Rendez-nous visite', 'Завітайте до нас', '欢迎来访', 'Navštívte nás', 'Navštivte nás'],
    'Solymár, Ibolya utca 18. – hétfőtől péntekig 9–17.': ['Solymár, Ibolya utca 18 – Monday to Friday 9:00–17:00', 'Solymár, Ibolya utca 18 – Montag bis Freitag 9–17 Uhr', 'Solymár, Ibolya utca 18 – du lundi au vendredi 9h–17h', 'Solymár, Ibolya utca 18 – пн–пт 9:00–17:00', 'Solymár, Ibolya utca 18 – 周一至周五 9:00–17:00', 'Solymár, Ibolya utca 18 – pondelok až piatok 9:00–17:00', 'Solymár, Ibolya utca 18 – pondělí až pátek 9:00–17:00'],
    'Kapcsolat': ['Contact', 'Kontakt', 'Contact', 'Контакти', '联系我们', 'Kontakt', 'Kontakt'],
    '5,0': ['5.0', '5,0', '5,0', '5,0', '5.0', '5,0', '5,0'],
    'Google-értékelés': ['Google rating', 'Google-Bewertung', 'Note Google', 'Оцінка в Google', 'Google 评分', 'Hodnotenie Google', 'Hodnocení Google'],
    'Elégedett ügyfeleink szerint': ['From our happy clients', 'Von unseren zufriedenen Kunden', 'Selon nos clients satisfaits', 'За відгуками задоволених клієнтів', '来自满意客户的评价', 'Podľa našich spokojných klientov', 'Podle našich spokojených klientů'],
    'Bevizsgált autók': ['Inspected cars', 'Geprüfte Autos', 'Voitures contrôlées', 'Перевірені авто', '经检测车辆', 'Preverené autá', 'Prověřené vozy'],
    'Dokumentált előélet, valós km': ['Documented history, genuine mileage', 'Dokumentierte Historie, echte km', 'Historique documenté, kilométrage réel', 'Задокументована історія, реальний пробіг', '记录完整，里程真实', 'Zdokumentovaná história, reálne km', 'Doložená historie, skutečné km'],
    'Kövess minket': ['Follow us', 'Folgen Sie uns', 'Suivez-nous', 'Слідкуйте за нами', '关注我们', 'Sledujte nás', 'Sledujte nás'],
    'Menü': ['Menu', 'Menü', 'Menu', 'Меню', '菜单', 'Menu', 'Menu'],
    'Kiemelt': ['Featured', 'Highlights', 'À la une', 'Рекомендуємо', '精选', 'Odporúčame', 'Doporučujeme'],
    '5,0 Google értékelés': ['5.0 Google rating', '5,0 Google-Bewertung', '5,0 sur Google', '5,0 в Google', 'Google 评分 5.0', 'Hodnotenie 5,0 na Google', 'Hodnocení 5,0 na Google'],
    'Válasz 1 órán belül, munkaidőben': ['Reply within 1 hour during business hours', 'Antwort binnen 1 Stunde zu Geschäftszeiten', 'Réponse sous 1 heure aux heures ouvrées', 'Відповідь протягом 1 години в робочий час', '工作时间内 1 小时内回复', 'Odpoveď do 1 hodiny v pracovnom čase', 'Odpověď do 1 hodiny v pracovní době'],
    'Főmenü': ['Main menu', 'Hauptmenü', 'Menu principal', 'Головне меню', '主菜单', 'Hlavné menu', 'Hlavní menu'],
    /* autóadatok */
    'Benzin': ['Petrol', 'Benzin', 'Essence', 'Бензин', '汽油', 'Benzín', 'Benzín'],
    'Dízel': ['Diesel', 'Diesel', 'Diesel', 'Дизель', '柴油', 'Diesel', 'Diesel'],
    'Hibrid': ['Hybrid', 'Hybrid', 'Hybride', 'Гібрид', '混合动力', 'Hybrid', 'Hybrid'],
    'Elektromos': ['Electric', 'Elektro', 'Électrique', 'Електро', '纯电', 'Elektro', 'Elektro'],
    'Automata': ['Automatic', 'Automatik', 'Automatique', 'Автомат', '自动挡', 'Automat', 'Automat'],
    'Manuális': ['Manual', 'Schaltgetriebe', 'Manuelle', 'Механіка', '手动挡', 'Manuál', 'Manuál'],
    'SUV / Terepjáró': ['SUV', 'SUV / Geländewagen', 'SUV / 4x4', 'SUV / позашляховик', 'SUV / 越野车', 'SUV / terénne', 'SUV / terénní'],
    'Kisautó': ['Small car', 'Kleinwagen', 'Citadine', 'Малолітражка', '小型车', 'Malé auto', 'Malý vůz'],
    'Limuzin': ['Sedan', 'Limousine', 'Berline', 'Седан', '轿车', 'Limuzína', 'Limuzína'],
    'Kombi': ['Estate', 'Kombi', 'Break', 'Універсал', '旅行车', 'Kombi', 'Kombi'],
    'Kabrió': ['Convertible', 'Cabrio', 'Cabriolet', 'Кабріолет', '敞篷车', 'Kabriolet', 'Kabriolet'],
    'Egyterű': ['MPV', 'Van', 'Monospace', 'Мінівен', 'MPV', 'MPV', 'MPV'],
    'Coupé': ['Coupé', 'Coupé', 'Coupé', 'Купе', '轿跑', 'Kupé', 'Kupé'],
    'Kompakt': ['Compact', 'Kompakt', 'Compacte', 'Компакт', '紧凑型', 'Kompakt', 'Kompakt'],
    'SUV Coupé': ['SUV Coupé', 'SUV-Coupé', 'SUV coupé', 'SUV-купе', 'SUV 轿跑', 'SUV kupé', 'SUV kupé'],
    'Ferdehátú': ['Hatchback', 'Schrägheck', 'Berline compacte', 'Хетчбек', '掀背车', 'Hatchback', 'Hatchback'],
    'Touring': ['Touring', 'Touring', 'Touring', 'Універсал', '旅行版', 'Touring', 'Touring'],
    'Használt autók': ['Used cars', 'Gebrauchtwagen', 'Voitures d’occasion', 'Вживані авто', '二手车', 'Jazdené autá', 'Ojeté vozy'],
    'Új autók': ['New cars', 'Neuwagen', 'Voitures neuves', 'Нові авто', '新车', 'Nové autá', 'Nové vozy'],
    'Összes új autó': ['All new cars', 'Alle Neuwagen', 'Toutes les voitures neuves', 'Усі нові авто', '全部新车', 'Všetky nové autá', 'Všechny nové vozy'],
    'Németország': ['Germany', 'Deutschland', 'Allemagne', 'Німеччина', '德国', 'Nemecko', 'Německo']
  };
  function t(s) { if (!LI) return s; var r = TR[s]; return (r && r[LI - 1]) || s; }
  function tx(s) { return esc(t(s)); }
  /* üzemanyag / váltó / kategória a forrásadatokból (magyar vagy német/angol alak) */
  var FUEL = { 'Benzin': 'Benzin', 'Benzín': 'Benzin', 'Petrol': 'Benzin', 'Dízel': 'Dízel', 'Diesel': 'Dízel', 'PHEV': 'Hibrid', 'Hibrid': 'Hibrid', 'Hybrid': 'Hibrid', 'Elektromos': 'Elektromos', 'Elektro': 'Elektromos', 'EV': 'Elektromos' };
  function tFuel(f) { return t(FUEL[f] || f); }
  function tSpec(s) { return String(s || '').split(' · ').map(function (x) { x = x.trim(); return FUEL[x] ? tFuel(x) : t(x); }).join(' · '); }
  var MONTHS_HU = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    uk: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'],
    sk: ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'],
    cs: ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
  };
  /* "2026. november" -> nyelv szerinti hónap + év */
  function tMonth(s) {
    var m = /^(\d{4})\.\s*([a-záéíóöőúüű]+)/i.exec(String(s || '')); if (!m || !LI) return s;
    var i = MONTHS_HU.indexOf(m[2].toLowerCase()); if (i < 0) return s;
    if (LANG === 'zh') return m[1] + '年' + (i + 1) + '月';
    return MONTHS[LANG][i] + ' ' + m[1];
  }
  /* eladás dátuma (YYYY-MM-DD) a nyelv szokása szerint */
  function tDate(y, mo, d) {
    if (LANG === 'hu') return y + '. ' + mo + '. ' + d + '.';
    if (LANG === 'zh') return y + '年' + (+mo) + '月' + (+d) + '日';
    if (LANG === 'sk' || LANG === 'cs') return (+d) + '. ' + (+mo) + '. ' + y;
    if (LANG === 'de' || LANG === 'uk') return d + '.' + mo + '.' + y;
    return d + '/' + mo + '/' + y;
  }
  /* bérleti ár: "390 000 Ft /hó-tól · nettó" a nyelv szerint */
  var PER = { en: ['from ', '/month'], de: ['ab ', '/Monat'], fr: ['dès ', '/mois'], uk: ['від ', '/міс.'], zh: ['', ' 起/月'], sk: ['od ', '/mes.'], cs: ['od ', '/měs.'] };
  function rentPrice(ft) {
    if (!LI) return '<strong>' + esc(ft) + '</strong><em>/hó-tól · nettó</em>';
    var p = PER[LANG]; return '<strong>' + esc(p[0] + ft) + '</strong><em>' + esc(p[1].trim()) + ' · ' + tx('nettó') + '</em>';
  }
  /* modellnév a nyelv szerint (a forrás német: "3er Limousine", "A-Klasse") */
  function dispName(b, mo) {
    var B0 = b === 'VW' ? 'Volkswagen' : b, s = String(mo);
    if (LANG === 'hu') {
      var D = { '1': '1-es', '2': '2-es', '3': '3-as', '4': '4-es', '5': '5-ös', '6': '6-os', '7': '7-es', '8': '8-as' };
      s = s.replace(/\b(\d)er\b/g, function (_, d) { return D[d] || d; }).replace(/\bLimousine\b/g, 'Limuzin').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, '$1-osztály');
    } else if (LANG === 'de') {
      s = s.replace(/\bCoupe\b/g, 'Coupé');
    } else if (LANG === 'fr') {
      s = s.replace(/\b(\d)er\b/g, 'Série $1').replace(/\bLimousine\b/g, 'Berline').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, 'Classe $1');
    } else if (LANG === 'sk') {
      s = s.replace(/\b(\d)er\b/g, 'rad $1').replace(/\bLimousine\b/g, 'Limuzína').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, 'Trieda $1');
    } else if (LANG === 'cs') {
      s = s.replace(/\b(\d)er\b/g, 'řada $1').replace(/\bLimousine\b/g, 'Limuzína').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, 'Třída $1');
    } else {
      s = s.replace(/\b(\d)er\b/g, '$1 Series').replace(/\bLimousine\b/g, 'Sedan').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, '$1-Class');
    }
    return B0 + ' ' + s;
  }
  /* .sk / .cz domain: ott a magyar útvonalak helyett a helyi útvonalakon vannak az adatoldalak */
  var DOM = (/(^|\.)caradvance\.(sk|cz)$/.exec(location.hostname) || [])[2] || '';
  var SRC = DOM === 'sk' ? { autoink: '/auta/', biz: '/komisny-predaj/', nw: '/predaj/auto-na-mieru/' } : DOM === 'cz' ? { autoink: '/vozy/', biz: '/komisni-prodej/', nw: '/prodej/vuz-na-miru/' } : { autoink: '/autoink/', biz: '/bizomanyos/', nw: '/egyedi-auto-rendeles/' };
  /* Használt autók: mindegyiknél az a fotó, amelyen az autó eleje balra néz (mint az új autók stúdióképein).
     Csak ezek közül kerül 4 a menübe (az /autoink/ sorrendjében); ha kevesebb van, a többi az első képével egészül ki. */
  var USED_IMG = {
    'bmw-x5-xdrive30d-m-sport-pro-panorama-22-m-lm-head-up-afas': 'https://img.hasznaltautocdn.com/2048x1536/23351824/29222237.jpg',
    'porsche-911-carrera-gts-approved-3-jahre-voll-leder': 'https://img.classistatic.de/api/v1/mo-prod/images/13/13a5093c-c9cb-4401-ab23-c77d93146e66?rule=mo-1600',
    'bmw-120d-xdrive-m-sport-a': 'https://img.classistatic.de/api/v1/mo-prod/images/c9/c9f2e392-4efa-4e1f-bdc2-0ab83cc6146c?rule=mo-1600',
    'volkswagen-tiguan-1-5etsi-r-line-matrix-ahk-vollausstattung': 'https://img.classistatic.de/api/v1/mo-prod/images/20/20b6e710-6e87-4c55-b371-2dce43aa95d2?rule=mo-1600',
    'bmw-x2-xdrive20d-m-pro-black-beige-pano-hud-fullfull': 'https://img.classistatic.de/api/v1/mo-prod/images/9c/9c7aec49-8f2c-4af9-b4d1-8313f93ebfb4?rule=mo-1600',
    'bmw-x7-m50d-m-sport-pro-22-b-w': 'https://img.classistatic.de/api/v1/mo-prod/images/50/50a7d2b2-354d-4a25-9739-65dbe3e64ccb?rule=mo-1600'
  };
  /* Új autók fül: a konfigurátor (/egyedi-auto-rendeles/) adataiból, ugyanazzal az árral és képpel */
  var PICK_NEW = ['BMW X5', 'Mercedes-Benz GLC Coupé', 'Audi Q5', 'MINI Countryman'];
  var SALE_TAB = 'used';
  function phone() { var p = (window.CA_CFG && window.CA_CFG.PHONE) || '+36 30 233 6060'; return { txt: p, tel: 'tel:' + String(p).replace(/[^\d+]/g, '') }; }
  var ICON = {
    car: '<path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6M6 11h12"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
    compare: '<path d="M7 7h11l-3-3M17 17h-11l3 3"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7h3.5"/>',
    shield: '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1-8.5 15a12 12 0 0 1-8.5-15a12 12 0 0 0 8.5-3"/><path d="M9 12l2 2l4-4"/>',
    star: '<path d="M12 17.75l-6.17 3.24l1.18-6.87l-5-4.86l6.9-1l3.09-6.26l3.09 6.26l6.9 1l-5 4.86l1.18 6.87z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M12 17v.01M12 13.5a1.5 1.5 0 0 1 1-1.5a2.6 2.6 0 1 0-3-4"/>',
    store: '<path d="M3 21h18M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2-4h14l2 4M5 21v-10.15M19 21v-10.15"/>',
    sliders: '<path d="M4 6h8M16 6h4M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="14" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    euro: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4a5 5 0 1 0 0 7.2"/><path d="M7 10.5h6.5M7 13.5h6.5"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9a2 2 0 0 0-1.8-1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1-1.8-1M12 7v10"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 12v.01M3 13a20 20 0 0 0 18 0"/>',
    cash: '<rect x="7" y="9" width="14" height="10" rx="2"/><circle cx="14" cy="14" r="2"/><path d="M17 9v-2a2 2 0 0 0-2-2h-10a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>',
    garage: '<path d="M3 20v-11l9-5l9 5v11M13 13h4M13 16h4M8 20v-7h8v7"/>',
    heart: '<path d="M19.5 12.57l-7.5 7.43l-7.5-7.43a5 5 0 1 1 7.5-6.57a5 5 0 1 1 7.5 6.58"/>',
    timeline: '<path d="M4 16l6-7l5 5l5-6"/><circle cx="15" cy="14" r="1"/><circle cx="10" cy="9" r="1"/><circle cx="4" cy="16" r="1"/><circle cx="20" cy="8" r="1"/>',
    truck: '<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h-2v-11a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5"/>',
    list: '<path d="M3.5 5.5l1.5 1.5l2.5-2.5M3.5 11.5l1.5 1.5l2.5-2.5M3.5 17.5l1.5 1.5l2.5-2.5M11 6h9M11 12h9M11 18h9"/>',
    calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="7" width="8" height="3" rx="1"/><path d="M8 14v.01M12 14v.01M16 14v.01M8 17v.01M12 17v.01M16 17v.01"/>',
    scale: '<path d="M7 20h10M6 6l6-1l6 1M12 3v17M9 12l-3-6l-3 6a3 3 0 0 0 6 0M21 12l-3-6l-3 6a3 3 0 0 0 6 0"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85"/>',
    eye: '<circle cx="12" cy="12" r="2"/><path d="M22 12c-2.67 4.67-6 7-10 7s-7.33-2.33-10-7c2.67-4.67 6-7 10-7s7.33 2.33 10 7"/>',
    cert: '<circle cx="15" cy="15" r="3"/><path d="M13 17.5v4.5l2-1.5l2 1.5v-4.5M10 19h-5a2 2 0 0 1-2-2v-10c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-1 1.73M6 9h12M6 12h3M6 15h2"/>',
    news: '<path d="M16 6h3a1 1 0 0 1 1 1v11a2 2 0 0 1-4 0v-13a1 1 0 0 0-1-1h-10a1 1 0 0 0-1 1v12a3 3 0 0 0 3 3h11M8 8h4M8 12h4M8 16h4"/>',
    media: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3l-5 3z"/>',
    phone: '<path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5l5 2v4a2 2 0 0 1-2 2a16 16 0 0 1-15-15a2 2 0 0 1 2-2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    pin: '<circle cx="12" cy="11" r="3"/><path d="M17.66 16.66l-4.24 4.24a2 2 0 0 1-2.83 0l-4.25-4.24a8 8 0 1 1 11.32 0z"/>',
    arrow: '<path d="M5 12h14M13 18l6-6M13 6l6 6"/>'
  };
  function svg(n, s) { return '<svg class="mm-ic" width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || '') + '</svg>'; }
  var B = function (k, n, href) { return { k: k, n: n, href: href }; };
  var RENT_BRANDS = [B('bmw', 'BMW'), B('mercedes', 'Mercedes'), B('audi', 'Audi'), B('mini', 'MINI'), B('vw', 'Volkswagen'), B('cupra', 'CUPRA'), B('seat', 'SEAT'), B('hyundai', 'Hyundai'), B('kia', 'Kia'), B('volvo', 'Volvo'), B('man', 'MAN')]
    .map(function (b) { b.href = '/autoink/?marka=' + (b.k === 'vw' ? 'volkswagen' : b.k) + '#berelheto'; return b; });
  var BUY_BRANDS = [B('bmw', 'BMW'), B('mini', 'MINI'), B('mercedes', 'Mercedes'), B('audi', 'Audi')]
    .map(function (b) { b.href = '/egyedi-auto-rendeles/?brand=' + b.k; return b; });
  var P = [
    { brands: RENT_BRANDS, bt: 'Bérelhető autóink', bhref: '/autoink/#berelheto', bcols: 6, cars: 'rent', ct: 'Kiemelt bérelhető autók', call: 'Összes bérelhető autó', callHref: '/autoink/#berelheto',
      links: [['info', 'Mi a tartós bérlet?', '/tartos-berlet/', 'Minden benne van egy havi díjban'], ['compare', 'Autók összehasonlítása', '/auto-osszehasonlitas/', 'Akár 3 modell egymás mellett'], ['route', 'Bérlési folyamat', '/berlesi-folyamat/', 'Lépésről lépésre az átadásig'], ['shield', 'Feltételek és kaució', '/berlesi-feltetelek/', 'Önrész, km-keret, kaució'], ['star', 'Előnyök', '/berles-elonyei/', 'Miért éri meg bérelni?'], ['help', 'Gyakori kérdések', '/berles-gyakori-kerdesek/', 'Válaszok a gyakori kérdésekre']],
      f: { img: '/piros-bmw-x6-m-premium-autoberles.webp', t: 'Prémium autó, egy havi díjért', s: 'Szerviz, gumi, biztosítás és adó a díjban.', cta: 'Bérelhető autóink', href: '/autoink/#berelheto' } },
    { brands: BUY_BRANDS, bt: 'Egyedi autó rendelés', bhref: '/egyedi-auto-rendeles/', bcols: 4, cars: 'sale', ct: 'Kiemelt eladó autók', call: 'Összes eladó autó', callHref: '/autoink/',
      links: [['store', 'Autóink', '/autoink/', 'Ellenőrzött autók Németországból'], ['coin', 'Finanszírozás – lízing', '/finanszirozas-lizing/', 'Havi részlet kiszámolása'], ['briefcase', 'Operatív lízing', '/operativ-lizing/', 'Cégeknek, nettó áron'], ['star', 'Előnyök', '/vasarlas-elonyei/', 'Miért vásárolj tőlünk?'], ['help', 'Gyakori kérdések', '/vasarlas-gyakori-kerdesek/', 'Áfa, garancia, átadás']],
      f: { img: '/bmw-m3-touring-premium-auto-eladas.webp', t: 'Konfiguráld, mi beszerezzük', s: 'BMW, MINI, Mercedes és Audi – gyári konfigurátorral.', cta: 'Egyedi rendelés', href: '/egyedi-auto-rendeles/' } },
    { cars: 'biz', ct: 'Bizományos autóink', call: 'Összes bizományos autó', callHref: '/bizomanyos/',
      links: [['cash', 'Eladom az autómat', '/eladom/', 'Ingyenes értékbecslés'], ['garage', 'Bizományos autóink', '/bizomanyos/', 'Eladó autók ügyfeleinktől'], ['timeline', 'Értékesítési folyamat', '/ertekesitesi-folyamat/', 'Mi intézünk mindent'], ['heart', 'Jótékonyság', '/jotekonysag/', 'Minden eladás után adományozunk'], ['help', 'Gyakori kérdések', '/gyakori-kerdesek/', 'Díjak, határidők, papírok']],
      f: { img: '/toyota-rav4-hybrid-hasznaltauto-eladas.webp', t: 'Mennyit ér az autód?', s: 'Hirdetjük, bemutatjuk, eladjuk – te csak átveszed a pénzt.', cta: 'Értékbecslést kérek', href: '/eladom/' } },
    { links: [['truck', 'Autó rendelés', '/auto-rendeles/', 'Megkeressük, ellenőrizzük, hazahozzuk'], ['list', 'Beszerzési folyamat', '/beszerzesi-folyamat/', 'Az ajánlattól a forgalomba helyezésig'], ['scale', 'Egyedül vagy velünk?', '/egyedul-vagy-velunk/', 'Költségek és kockázatok összevetve'], ['star', 'Előnyök', '/elonyok/', 'Miért Németországból?'], ['users', 'Referenciák', '/referenciak/', 'Ügyfeleink autói']],
      badge: { t: 'Csak 30% előleg', s: 'A legkedvezőbb a piacon', href: '/auto-rendeles/' },
      side: { t: 'Kalkulátorok', items: [['calc', 'Honosítás kalkulátor', '/honositas-kalkulator/'], ['calc', 'Átírás kalkulátor', '/atiras-kalkulator/'], ['calc', 'Lízing kalkulátor', '/finanszirozas-lizing/']] },
      f: { img: '/autoszallitas-autoimport-nemetorszagbol.webp', t: 'Autó Németországból, kulcsrakészen', s: 'Szállítás, honosítás, forgalomba helyezés – mi intézzük.', cta: 'Autót rendelek', href: '/auto-rendeles/' },
      minis: [['clock', '23 év', 'tapasztalat', '2003 óta Németországban', '/miert-mi/'], ['truck', '5000+', 'eladott prémium autó', 'Nézd meg ügyfeleink autóit', '/referenciak/']] },
    { links: [['users', 'Miért mi?', '/miert-mi/', 'Német háttér, magyar ügyintézés'], ['eye', 'Átláthatóság', '/atlathatosag/', 'Tételes, előre rögzített árak'], ['cert', 'Minőségbiztosítás', '/minosegbiztositas/', 'Ellenőrzött autók, garancia'], ['star', 'Referenciák', '/referenciak/', 'Ügyfeleink történetei'], ['media', 'Media', '/media/', 'Megjelenések'], ['news', 'Blog', '/blog/', 'Útmutatók, adók, árak']],
      f: { img: '/caradvance-iroda.webp', t: 'Gyere be hozzánk', s: 'Solymár, Ibolya utca 18. – hétfőtől péntekig 9–17.', cta: 'Kapcsolat', href: '/kapcsolat/' },
      minis: [['soc:g', '5,0', 'Google-értékelés', 'Elégedett ügyfeleink szerint', '/referenciak/'], ['cert', 'Minőségbiztosítás', 'Bevizsgált autók', 'Dokumentált előélet, valós km', '/minosegbiztositas/']],
      soc: [['fb', 'Facebook', 'Hírek, új autók, akciók', 'https://www.facebook.com/caradvancehungary/'], ['ig', 'Instagram', 'Fotók és sztorik az autóinkról', 'https://www.instagram.com/caradvance_hungary/'],
        ['tt', 'TikTok', 'Rövid videók, átadások', 'https://www.tiktok.com/search?q=caradvance'], ['yt', 'YouTube', 'Bemutatók és videók', 'https://www.youtube.com/channel/UCbmogjjIDqVwFtFoA-h3jjw'], ['li', 'LinkedIn', 'Céges hírek, partnerek', 'https://www.linkedin.com/search/results/companies/?keywords=caradvance']] }
  ];
  /* közösségi ikonok – ugyanazok, mint a weboldal láblécében */
  var SOC = {
    fb: '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="mmFb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18ACFE"/><stop offset="1" stop-color="#0163E0"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#mmFb)"/><path fill="#fff" d="M26.6 40V26.4h4.6l.7-5.4h-5.3v-3.4c0-1.6.4-2.6 2.7-2.6H32v-4.8c-.5-.1-2.2-.2-4.1-.2-4.1 0-6.9 2.5-6.9 7.1V21h-4.6v5.4H21V40h5.6z"/></svg>',
    ig: '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="mmIg" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect width="48" height="48" rx="12" fill="url(#mmIg)"/><rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="24" cy="24" r="6.2" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="31.6" cy="16.4" r="2" fill="#fff"/></svg>',
    tt: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#000"/><g transform="translate(1.2 0)"><path fill="#25F4EE" d="M29.6 9.5c.6 3.6 2.9 6.2 6.5 6.6v5.1c-2.4 0-4.6-.7-6.5-2v9.6c0 5.3-4.3 9.6-9.6 9.6s-9.6-4.3-9.6-9.6 4.3-9.6 9.6-9.6c.5 0 1 0 1.5.1v5.3c-.5-.2-1-.2-1.5-.2-2.4 0-4.4 2-4.4 4.4s2 4.4 4.4 4.4 4.4-2 4.4-4.4V9.5h5.2z" transform="translate(-1.4 -1.2)"/><path fill="#FE2C55" d="M29.6 9.5c.6 3.6 2.9 6.2 6.5 6.6v5.1c-2.4 0-4.6-.7-6.5-2v9.6c0 5.3-4.3 9.6-9.6 9.6s-9.6-4.3-9.6-9.6 4.3-9.6 9.6-9.6c.5 0 1 0 1.5.1v5.3c-.5-.2-1-.2-1.5-.2-2.4 0-4.4 2-4.4 4.4s2 4.4 4.4 4.4 4.4-2 4.4-4.4V9.5h5.2z" transform="translate(1 1)"/><path fill="#fff" d="M29.6 9.5c.6 3.6 2.9 6.2 6.5 6.6v5.1c-2.4 0-4.6-.7-6.5-2v9.6c0 5.3-4.3 9.6-9.6 9.6s-9.6-4.3-9.6-9.6 4.3-9.6 9.6-9.6c.5 0 1 0 1.5.1v5.3c-.5-.2-1-.2-1.5-.2-2.4 0-4.4 2-4.4 4.4s2 4.4 4.4 4.4 4.4-2 4.4-4.4V9.5h5.2z"/></g></svg>',
    g: '<svg viewBox="0 0 48 48" aria-label="Google"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
    yt: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#FF0033"/><path fill="#fff" d="M19.5 15.5v17l14-8.5z"/></svg>',
    li: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#0A66C2"/><rect x="12" y="19" width="5.4" height="17" fill="#fff"/><circle cx="14.7" cy="13.6" r="3.2" fill="#fff"/><path fill="#fff" d="M21.6 19h5.2v2.4c.8-1.4 2.6-2.8 5.3-2.8 5.4 0 6.4 3.5 6.4 8.1V36h-5.4v-8.1c0-2-.1-4.4-2.7-4.4-2.7 0-3.1 2.1-3.1 4.3V36h-5.4V19z"/></svg>'
  };
  var CSS = '' +
    '@media (min-width:1100px){.mm-on .ca-nav .menu .dropdown{display:none!important}.mm-on .ca-nav .menu .navitem.mm-act>.navlink{color:#E2001A}}' +
    '@media (max-width:1099.98px){.mm-panel{display:none!important}}' +
    '.mm-panel{position:absolute;left:50%;top:calc(100% + 10px);transform:translate(-50%,6px);width:min(1320px,calc(100vw - 28px));background:#fff;border-radius:26px;box-shadow:0 22px 60px rgba(8,8,10,.22);opacity:0;visibility:hidden;transition:opacity .16s ease,transform .16s ease,visibility 0s .16s;z-index:1001;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#14151A}' +
    '.mm-panel.open{opacity:1;visibility:visible;transform:translate(-50%,0);transition:opacity .16s ease,transform .16s ease}' +
    '.mm-in{display:grid;gap:28px;padding:28px 30px 20px}' +
    '.mm-h{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#7A8496;margin:0 0 10px;display:flex;align-items:center;gap:6px}' +
    '.mm-h a{color:inherit;text-decoration:none}.mm-h a:hover{color:#E2001A}' +
    '.mm-brands{display:grid;gap:2px 8px}' +
    '.mm-b{display:flex;align-items:center;gap:14px;padding:9px 12px;border-radius:14px;text-decoration:none;color:#14151A;font-weight:700;font-size:16px}' +
    '.mm-b:hover,.mm-b:focus-visible{background:#F4F5F7;outline:none}' +
    '.mm-b img{width:46px;height:30px;object-fit:contain;object-position:center;flex:none}' +
    '.mm-l{display:flex;gap:12px;padding:9px 10px;border-radius:14px;text-decoration:none;color:#14151A}' +
    '.mm-l:hover,.mm-l:focus-visible{background:#F4F5F7;outline:none}.mm-l:hover .mm-ic{color:#E2001A}' +
    '.mm-l .mm-ic{color:#5A6B82;flex:none;margin-top:1px;transition:color .12s}' +
    '.mm-l b{display:block;font-size:15px;font-weight:700;line-height:1.3}.mm-l span{display:block;font-size:13px;color:#5A6B82;line-height:1.4;margin-top:2px}' +
    '.mm-chip{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #E6EAF1;border-radius:14px;text-decoration:none;color:#14151A;font-weight:700;font-size:14px;margin-bottom:8px}' +
    '.mm-chip:hover{border-color:#E2001A;color:#E2001A}' +
    '.mm-card{display:block;border-radius:20px;overflow:hidden;background:#0B0B0D;color:#fff;text-decoration:none;position:relative;min-height:250px}' +
    '.mm-card img{width:100%;height:150px;object-fit:cover;display:block}' +
    '.mm-card .mm-ct{padding:14px 16px 16px}.mm-card b{display:block;font-size:17px;line-height:1.3}.mm-card span{display:block;font-size:13px;color:#C9CFDA;margin:4px 0 12px}' +
    '.mm-btn{display:inline-flex;align-items:center;gap:6px;background:#E2001A;color:#fff;border-radius:999px;padding:9px 16px;font-size:13px;font-weight:700}' +
    '.mm-card:hover .mm-btn{background:#B80015}' +
    '.mm-foot{display:flex;flex-wrap:wrap;gap:22px;padding:13px 30px;border-top:1px solid #E6EAF1;font-size:13px;color:#5A6B82}' +
    '.mm-foot span{display:inline-flex;align-items:center;gap:6px}.mm-foot a{color:inherit;text-decoration:none}.mm-foot a:hover{color:#E2001A}' +
    '.mm-in.mm-split{grid-template-columns:minmax(260px,300px) minmax(0,1fr);gap:0;padding:0}' +
    '.mm-left{padding:26px 18px 18px 22px;border-right:1px solid #E6EAF1;background:#FAFBFC;border-radius:26px 0 0 0}' +
    '.mm-right{padding:26px 28px 18px 26px;display:flex;flex-direction:column;gap:20px;min-width:0}' +
    '.mm-rowhead{display:flex;align-items:baseline;justify-content:space-between;gap:12px}' +
    '.mm-more{font-size:13px;font-weight:700;color:#E2001A;text-decoration:none;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.mm-more:hover{color:#B80015}' +
    '.mm-cars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}' +
    '.mm-car{display:block;text-decoration:none;color:#14151A;border:1px solid #E6EAF1;border-radius:18px;overflow:hidden;background:#fff;transition:box-shadow .15s,border-color .15s,transform .15s}' +
    '.mm-car:hover,.mm-car:focus-visible{border-color:#E2001A;box-shadow:0 10px 26px rgba(15,23,42,.10);transform:translateY(-2px);outline:none}' +
    '.mm-car .mm-ph{aspect-ratio:16/10;background:#F1F4F9 center/cover no-repeat}' +
    '.mm-car .mm-cb{padding:10px 12px 12px}.mm-car b{display:block;font-size:14px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.mm-car .mm-sp{display:block;font-size:12px;color:#7A8496;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.mm-car .mm-pr{display:flex;align-items:baseline;gap:6px;margin-top:8px}.mm-car .mm-pr strong{font-size:16px;color:#E2001A}.mm-car .mm-pr em{font-style:normal;font-size:11.5px;color:#7A8496}' +
    '.mm-sk{border-radius:18px;background:linear-gradient(90deg,#F1F4F9,#F7F9FC,#F1F4F9);background-size:200% 100%;animation:mmsk 1.2s linear infinite;aspect-ratio:16/14}' +
    '@keyframes mmsk{to{background-position:-200% 0}}' +
    '.mm-single{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:0;border-radius:20px;overflow:hidden;background:#0B0B0D;color:#fff;text-decoration:none;min-height:230px}' +
    '.mm-single .mm-ph{background:#222 center/cover no-repeat}.mm-single .mm-ct{padding:22px 22px;display:flex;flex-direction:column;justify-content:center}' +
    '.mm-single b{font-size:20px;line-height:1.25}.mm-single span{display:block;font-size:14px;color:#C9CFDA;margin:8px 0 16px}' +
    '.mm-schip svg{width:22px;height:22px;flex-shrink:0;display:block}' +
    '.mm-ngos-w{margin-bottom:18px}.mm-ngos{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}' +
    '.mm-ng{display:flex;align-items:center;justify-content:center;height:56px;padding:6px 10px;border:1px solid #E6EAF1;border-radius:14px;background:#fff;transition:border-color .15s,box-shadow .15s}' +
    '.mm-ng:hover{border-color:#E2001A;box-shadow:0 6px 16px rgba(15,23,42,.08)}.mm-ng img{max-width:100%;max-height:42px;width:auto;height:auto;object-fit:contain;display:block}' +
    '.mm-rh-l{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.mm-rh-l .mm-h{margin:0}.mm-rowhead{align-items:center!important;margin-bottom:10px}' +
    '.mm-tabs{display:inline-flex;gap:2px;background:#F1F4F9;border-radius:999px;padding:3px}' +
    '.mm-tab{border:0;background:transparent;font:inherit;font-size:12.5px;font-weight:700;color:#5A6B82;padding:5px 13px;border-radius:999px;cursor:pointer;line-height:1.3}' +
    '.mm-tab:hover{color:#0B0B0D}.mm-tab.on{background:#0B0B0D;color:#fff}' +
    '.mm-siderow{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}' +
    '.mm-badge{display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:16px;background:#FFF1F2;border:1px solid #FBD0D5;text-decoration:none;color:#0B0B0D;flex:none;transition:border-color .15s,box-shadow .15s}' +
    '.mm-badge:hover{border-color:#E2001A;box-shadow:0 8px 20px rgba(226,0,26,.12)}.mm-badge .mm-ic2{display:flex}' +
    '.mm-badge strong{display:block;font-size:16px;font-weight:800;color:#E2001A;line-height:1.2}.mm-badge em{display:block;font-style:normal;font-size:12px;font-weight:600;color:#5A6B82}' +
    '.mm-mini .mm-ic2 svg{width:24px;height:24px;display:block}.mm-mini strong.mm-long{font-size:20px;line-height:1.2}' +
    '.mm-frow>*{min-height:232px}' +
    '.mm-frow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,2.3fr);gap:14px;align-items:stretch}' +
    '.mm-frow .mm-single{min-height:200px}.mm-frow .mm-single b{font-size:18px}.mm-frow .mm-single .mm-ct{padding:18px 20px}' +
    '.mm-mini{display:flex;flex-direction:column;justify-content:space-between;gap:10px;border:1px solid #E6EAF1;background:#F7F9FC;border-radius:20px;padding:18px;text-decoration:none;color:#14151A;transition:border-color .15s,box-shadow .15s,transform .15s}' +
    '.mm-mini:hover{border-color:#E2001A;box-shadow:0 10px 26px rgba(15,23,42,.10);transform:translateY(-2px)}' +
    '.mm-mini strong{display:block;font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.05;color:#0B0B0D}' +
    '.mm-mini b{display:block;font-size:14px;margin-top:4px}.mm-mini div span{display:block;font-size:12.5px;color:#7A8496;margin-top:4px;line-height:1.35}' +
    '.mm-mini .mm-go{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;color:#E2001A}' +
    '.mm-chips{display:flex;gap:10px;flex-wrap:wrap}.mm-chips .mm-chip{margin:0}' +
    '.mm-car.mm-new .mm-ph{aspect-ratio:16/9;background-size:contain;background-color:#fff;margin:10px 12px 0}' +
    '.mm-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}.mm-meta img{height:24px;width:46px;object-fit:contain;object-position:left center}.mm-meta span{font-size:12px;color:#7A8496}' +
    '.mm-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.mm-av,.mm-fu{display:inline-block;font-size:11px;font-weight:700;color:#fff;border-radius:7px;padding:3px 8px;line-height:1.3}.mm-av{background:#64748b}.mm-av.now{background:#15803D}' +
    '.mm-car.mm-cta{background:#0B0B0D;color:#fff;border-color:#0B0B0D;display:flex;align-items:center}.mm-car.mm-cta b{white-space:normal;font-size:16px;margin-top:8px}.mm-car.mm-cta .mm-sp{color:#C9CFDA}.mm-ic2{color:#E2001A}.mm-car.mm-cta:hover{border-color:#E2001A}' +
    '.mm-b img[src*="mercedes"]{transform:scale(1.45)}.mm-meta img[src*="mercedes"]{transform:scale(1.4);transform-origin:left center}' +
    '.mm-car .mm-ph{position:relative}' +
    '.mm-stamp{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%) rotate(-8deg);background:#E2001A;color:#fff;font-weight:800;font-size:15px;letter-spacing:.12em;text-transform:uppercase;padding:6px 16px;border-radius:10px;border:2px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.25)}' +
    '.mm-when{position:absolute;left:10px;bottom:10px;background:rgba(11,11,13,.85);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px}' +
    '.mm-sold .mm-pr strong{color:#0B0B0D}' +
    '.mm-ngo{display:flex;align-items:center;gap:8px;margin-top:10px;padding:7px 9px;border-radius:11px;background:#F4F7FB;border:1px solid #E6EAF1}' +
    '.mm-ngo img{width:26px;height:26px;object-fit:contain;border-radius:6px;background:#fff;flex-shrink:0}' +
    '.mm-ngo span{font-size:11.5px;font-weight:700;line-height:1.25;color:#0B0B0D;white-space:normal;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}' +
    '.mm-ngo em{display:block;font-style:normal;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8a94a6}' +
    '.mm-meta .mm-bt{font-style:normal;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0B0B0D;line-height:24px;height:24px;white-space:nowrap}' +
    '.mm-all{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;color:#E2001A;text-decoration:none;margin:8px 0 0 12px}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtEur(v) { return Math.round(Number(v) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €'; }
  function shortName(m) { return String(m || '').replace(/["'*]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 4).join(' '); }
  var DATA = { rent: null, sale: null, loading: false };
  function thumb(u) { var img = String(u || '');
    /* hasznaltauto.hu: a 2048 px-es képet a böngésző ~230 px-re kicsinyítve recésen (pixelesen) rajzolja -> a 640x480-as változat éles és kisebb */
    if (img.indexOf('hasznaltautocdn.com/') >= 0) img = img.replace(/\/\d+x\d+\//, '/640x480/'); if (img.indexOf('classistatic') >= 0) { if (/rule=mo-\d+/.test(img)) img = img.replace(/rule=mo-\d+/, 'rule=mo-640'); else img += (/\?$/.test(img) ? '' : (img.indexOf('?') < 0 ? '?' : '&')) + 'rule=mo-640'; } return img; }
  function txt(el) { return el ? el.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : ''; }
  function km(s) { var n = String(s || '').replace(/\D/g, ''); return n ? n.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' km' : ''; }
  /* Az /autoink/ oldalon látható autók (ugyanaz a sorrend, kép és forintár), az oldal HTML-jéből. */
  function parseCards(doc, sel, kind, rate) {
    var list = [].slice.call(doc.querySelectorAll(sel)).slice(0, kind === 'sale' ? 60 : 4).map(function (a) {
      var href = (a.getAttribute('href') || ''); try { var u = new URL(href, location.origin + SRC.autoink); href = u.pathname + u.search + u.hash; } catch (e) { href = href.replace(/^(\.\.\/)+/, '/').replace(/^([^/])/, '/$1'); }
      var im = a.querySelector('.media img');
      var parts = txt(a.querySelector('.specs')).split('·').map(function (x) { return x.trim(); });
      var year = txt(a.querySelector('.year')).split('/').pop();
      var sp = [year, km(parts[0]), parts[parts.length - 1]].filter(Boolean).join(' · ');
      var ft = '', sub = '';
      if (kind === 'rent') { var rp = a.querySelector('.rentprices .rp b span'); ft = txt(rp).replace(/^≈\s*/, ''); sub = txt(a.querySelector('.rentprices .rp span')) || '2 000 km / hó'; }
      else {
        ft = txt(a.querySelector('.pricerow .price'));
        /* ugyanúgy számolva, mint az /autoink/ oldal: a forintár az euróárból, az élő árfolyammal (Math.round), 10 000-re felfelé */
        var pe = a.querySelector('.pricerow[data-eur]'), eu = pe ? +pe.getAttribute('data-eur') : 0;
        if (eu > 0 && rate > 0) ft = (Math.ceil(eu * Math.round(rate) / 10000) * 10000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0Ft';
      }
      var tt = txt(a.querySelector('.title'));
      var sl = (/\/auto\/([^/?#]+)/.exec(href) || [])[1] || '';
      return { href: href, t: tt, sp: sp, yr: [txt(a.querySelector('.cond')), txt(a.querySelector('.year'))].filter(Boolean).join(' · '), brand: a.getAttribute('data-marka') || tt, img: USED_IMG[sl] || (im ? im.getAttribute('src') : ''), mapped: !!USED_IMG[sl], ft: /Ft|€|Kč/.test(ft) ? ft : '', sub: sub, feat: !!a.querySelector('.feat') };
    });
    if (kind !== 'sale') return list;
    var good = list.filter(function (c) { return c.mapped; });
    return good.concat(list.filter(function (c) { return !c.mapped; })).slice(0, 4);
  }
  /* a konfigurátor oldal beágyazott adataiból: {key, name, body, fuel, img, from (bruttó €), slug, hide} */
  function parseNew(html, rate) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var st = scriptText(doc, /function card\(c\)/); if (!st) return [];
    var objs = st.match(/\{(?:brand:'[A-Z]+',)?key:'[^']+',name:'[^']+'[^{}]*\}/g) || [];
    var g = function (o, k) { var m = new RegExp('(?:^|[{,])' + k + ":'([^']*)'").exec(o); return m ? m[1] : ''; };
    var R = Math.round(rate || 0) || 361, FS = { 'Benzin': 'benzin', 'Dízel': 'dizel', 'Hibrid': 'hibrid', 'Elektromos': 'elektromos' };
    var LOGO = { BMW: '/bl-bmw-dark.webp', MB: '/bl-mercedes-dark.webp', AUDI: '/bl-audi-dark.webp', MINI: '/bl-mini-dark.webp' };
    DATA.newN = objs.filter(function (o) { return !/hide:true/.test(o); }).length;
    return PICK_NEW.map(function (nm) {
      var o = objs.filter(function (x) { return g(x, 'name') === nm && !/hide:true/.test(x); })[0]; if (!o) return null;
      var brand = g(o, 'brand') || 'BMW', key = g(o, 'key'), fuel = g(o, 'fuel'), from = +((/from:(\d+)/.exec(o) || [])[1] || 0);
      var net = Math.round(from / 1.19);
      return { isNewCar: true, t: nm, img: g(o, 'img') || ('/bmw/' + key + '.webp?v=6'), logo: LOGO[brand] || '',
        href: '/egyedi-auto-rendeles/' + (g(o, 'slug') || (key + '-' + (FS[fuel] || 'benzin'))),
        sp: [g(o, 'body'), 'Automata', fuel].filter(Boolean).join(' · '),
        ft: Math.round(net * R).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0Ft' };
    }).filter(Boolean);
  }
  var LK = { 'VW': 'vw', 'BMW': 'bmw', 'Audi': 'audi', 'Mercedes-Benz': 'mercedes', 'MINI': 'mini', 'Hyundai': 'hyundai', 'CUPRA': 'cupra', 'Kia': 'kia', 'MAN': 'man', 'Seat': 'seat', 'Volvo': 'volvo' };
  /* márka -> kis logó (ugyanaz, mint a bérelhető kártyákon); ha nincs logófájl, a márka neve jelenik meg */
  var BRAND_RE = [[/^(vw|volkswagen)\b/i, 'Volkswagen', '/bl-vw-dark.webp'], [/^bmw\b/i, 'BMW', '/bl-bmw-dark.webp'], [/^audi\b/i, 'Audi', '/bl-audi-dark.webp'], [/^mercedes/i, 'Mercedes-Benz', '/bl-mercedes-dark.webp'],
    [/^mini\b/i, 'MINI', '/bl-mini-dark.webp'], [/^cupra\b/i, 'CUPRA', '/bl-cupra-dark.webp'], [/^seat\b/i, 'SEAT', '/bl-seat-dark.webp'], [/^hyundai\b/i, 'Hyundai', '/bl-hyundai-dark.webp'], [/^kia\b/i, 'Kia', '/bl-kia-dark.webp'],
    [/^volvo\b/i, 'Volvo', '/bl-volvo-dark.webp'], [/^man\b/i, 'MAN', '/bl-man-dark.webp'], [/^porsche\b/i, 'Porsche', '/brand-porsche.png'], [/^ford\b/i, 'Ford', ''], [/^jaguar\b/i, 'Jaguar', ''],
    [/^land\s*rover|^range\s*rover/i, 'Land Rover', ''], [/^ferrari\b/i, 'Ferrari', ''], [/^skoda|^škoda/i, 'Škoda', ''], [/^toyota\b/i, 'Toyota', ''], [/^tesla\b/i, 'Tesla', '']];
  function brandOf(s) {
    s = String(s || '').trim();
    for (var i = 0; i < BRAND_RE.length; i++) if (BRAND_RE[i][0].test(s)) return { n: BRAND_RE[i][1], logo: BRAND_RE[i][2] };
    return { n: s.split(' ')[0], logo: '' };
  }
  function metaHtml(brand, right) {
    var b = brandOf(brand);
    var l = b.logo ? '<img src="' + b.logo + '" alt="' + esc(b.n) + '" width="46" height="24">' : (b.n ? '<i class="mm-bt">' + esc(b.n) + '</i>' : '');
    return '<div class="mm-meta">' + l + '<span>' + esc(right || '') + '</span></div>';
  }
  var FC = { 'Benzin': '#e8820c', 'Dízel': '#6b7280', 'PHEV': '#00997E', 'Hibrid': '#00997E', 'Elektromos': '#0D79FF', 'EV': '#0D79FF' };
  function rhref(b, mo) {
    var D = { '1': '1-es', '2': '2-es', '3': '3-as', '4': '4-es', '5': '5-ös', '6': '6-os', '7': '7-es', '8': '8-as' };
    var n = (b === 'VW' ? 'Volkswagen' : b) + ' ' + String(mo).replace(/\b(\d)er\b/g, function (_, d) { return D[d] || d; }).replace(/\bLimousine\b/g, 'Limuzin').replace(/\bCoupe\b/g, 'Coupé').replace(/\b([A-Z])-Klasse\b/g, '$1-osztály');
    return '/berelheto-auto/' + n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-berles';
  }
  /* kiegyensúlyozott JSON-objektum kivágása egy szövegből (a sztringeken belüli zárójeleket kihagyva) */
  function jsonAt(t, i) {
    var d = 0, q = false, e = false;
    for (var j = i; j < t.length; j++) {
      var ch = t[j];
      if (q) { if (e) e = false; else if (ch === '\\') e = true; else if (ch === '"') q = false; continue; }
      if (ch === '"') q = true; else if (ch === '{' || ch === '[') d++; else if (ch === '}' || ch === ']') { d--; if (!d) return t.slice(i, j + 1); }
    }
    throw new Error('json');
  }
  function scriptText(doc, re) { var ss = doc.querySelectorAll('script'); for (var i = 0; i < ss.length; i++) { if (re.test(ss[i].textContent)) return ss[i].textContent; } return ''; }
  function parseSub(doc, rate) {
    var st = scriptText(doc, /window\.SUB\s*=/), rt = scriptText(doc, /var PHOTO\s*=/);
    var SUB = JSON.parse(jsonAt(st, st.indexOf('{', st.search(/window\.SUB\s*=/))));
    var pm = /var PHOTO\s*=\s*(\{[^;]*?\});/.exec(rt); var PHOTO = pm ? JSON.parse(pm[1]) : {};
    var R = rate || SUB.rate_fallback || 364;
    var PICK = [['VW', 'Tiguan'], ['BMW', '3er Limousine'], ['Mercedes-Benz', 'GLC Coupé'], ['BMW', 'X5']];
    var ab = []; try { var at = scriptText(doc, /window\.__ABSTOCK\s*=/); ab = JSON.parse(jsonAt(at, at.indexOf('[', at.search(/window\.__ABSTOCK\s*=/)))); } catch (e) { ab = []; }
    var out = [];
    PICK.forEach(function (pk) {
      var m = (SUB.models || []).filter(function (x) { return x.brand === pk[0] && x.model === pk[1]; })[0];
      if (m && m.net) { out.push(m); return; }
      var st = ab.filter(function (c) { return c.b === (pk[0] === 'VW' ? 'Volkswagen' : pk[0]) && new RegExp('\\b' + pk[1] + '\\b').test(c.t) && c.r && c.r[0]; });
      if (st.length) out.push({ brand: pk[0], model: pk[1], stock: st, cat: 'SUV / Terepjáró', gears: ['Automata'], fuels: [st[0].f === 'Diesel' ? 'Dízel' : st[0].f], now: st.length, eurFix: st[0].r[0][1], href: st[0].u, yr: st[0].y });
    });
    DATA.rentN = (SUB.models || []).reduce(function (s, m) { return s + (m.count || 0); }, 0);
    return out.map(function (m) {
      var eff = m.eurFix || (m.net + 650);
      return { href: m.href || rhref(m.brand, m.model), t: dispName(m.brand, m.model), img: PHOTO[m.brand + ' ' + m.model] || (m.stock && m.stock[0].i) || '', logo: LK[m.brand] ? '/bl-' + LK[m.brand] + '-dark.webp' : '',
        yr: m.stock ? (String(m.yr || '').split('/').pop() + ' · készleten') : (m.stockOnly ? 'Azonnal elvihető' : '0 km · 2026'), sp: [m.cat].concat(m.gears || []).filter(Boolean).join(' · '),
        avail: m.now > 0 ? m.now + ' ' + t(m.stock ? 'azonnal elérhető' : 'elérhető') : ((m.later && m.later[0]) ? tMonth(m.later[0].d) : t('Hamarosan')), now: m.now > 0,
        fuels: (m.fuels || []).map(function (f) { return f === 'PHEV' ? 'Hibrid' : f; }),
        ft: ((m.eurFix ? Math.round(eff * R / 10000) : Math.ceil(eff * R / 10000)) * 10000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0Ft', eur: eff, isNew: true };
    });
  }
  function loadBiz(cb) {
    function go() {
      try {
        /* a /bizomanyos/ oldal a forrás: eladott autók (SOLD: eladó-oldali alapítvány + dátum) és a régi forintárak (HUFOV) */
        var soldP = fetch(SRC.biz, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (h) {
          var m = /var SOLD\s*=\s*\{([\s\S]*?)\};/.exec(h), out = {}, ov = {};
          if (m) m[1].replace(/['"]([a-z0-9-]+)['"]\s*:\s*\{([^}]*)\}/g, function (_, k, body) {
            var g = function (n) { var x = new RegExp(n + "\\s*:\\s*['\"]([^'\"]*)['\"]").exec(body); return x ? x[1] : ''; };
            out[k] = { seller: g('seller'), date: g('date') }; return _;
          });
          var hv = /var HUFOV\s*=\s*\{([^}]*)\}/.exec(h);
          if (hv) hv[1].replace(/['"]([a-z0-9-]+)['"]\s*:\s*(\d+)/g, function (_, k, v) { ov[k] = +v; return _; });
          return { sold: out, ov: ov };
        }).catch(function () { return { sold: {}, ov: {} }; });
        BIZ.loadCars(function (all) { soldP.then(function (S) {
          var SOLD = S.sold, slugOf = function (c) { return BIZ.slugify ? BIZ.slugify(c.modell) : ''; };
          var active = (all || []).filter(function (c) { return !SOLD[slugOf(c)]; });
          var sold = (all || []).filter(function (c) { return SOLD[slugOf(c)]; })
            .sort(function (a, b) { return (SOLD[slugOf(b)].date || '').localeCompare(SOLD[slugOf(a)].date || ''); });
          var P = BIZ.PROJECTS || {};
          DATA.ngos = (BIZ.ORDER || Object.keys(P)).map(function (k) { return P[k]; }).filter(Boolean);
          DATA.biz = active.concat(sold).slice(0, 4).map(function (c) {
            var slug = slugOf(c), so = SOLD[slug];
            var huf = Number(c.huf) || S.ov[slug] || (BIZ.ftOf ? BIZ.ftOf(c.eur) : 0);
            var sp = [String(c.evjarat || '').split('/').pop(), c.km, c.uzemanyag].filter(Boolean).join(' · ');
            var pr = P[(so && so.seller) || c.seller] || null;
            var dm = so && /^(\d{4})-(\d{2})-(\d{2})/.exec(so.date || '');
            return { href: '/auto/' + slug + '/?biz=1', t: c.modell, sp: sp, img: c.img,
              ngo: pr ? { n: pr.name, logo: pr.logo } : null, sold: so ? (dm ? tDate(dm[1], dm[2], dm[3]) : t('Eladva')) : '',
              ft: huf ? (BIZ.fmtFt ? BIZ.fmtFt(huf) : Math.round(huf).toLocaleString('hu-HU')) + (BIZ.fmtFt && /Ft/.test(BIZ.fmtFt(1)) ? '' : ' Ft') : '' };
          });
          DATA.bizN = active.length;
          DATA.biz.forEach(function (c) { if (c.img) { var i = new Image(); i.referrerPolicy = 'no-referrer'; i.src = thumb(c.img); } });
          cb();
        }); });
      } catch (e) { DATA.biz = []; cb(); }
    }
    if (window.BIZ && BIZ.loadCars) go();
    else { var sc = document.createElement('script'); sc.src = '/biz-data.js?v=1020'; sc.onload = go; sc.onerror = function () { DATA.biz = []; cb(); }; document.head.appendChild(sc); }
  }
  function loadData(cb) {
    if (DATA.rent || DATA.loading) return;
    DATA.loading = true;
    var rateP = fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=HUF', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { return j && j.rates && j.rates.HUF; }).catch(function () { return 0; });
    Promise.all([fetch(SRC.autoink, { credentials: 'same-origin' }).then(function (r) { return r.text(); }), rateP]).then(function (res) {
      var html = res[0], rate = res[1];
      var doc = new DOMParser().parseFromString(html, 'text/html');
      try { DATA.rent = parseSub(doc, rate); } catch (e) { DATA.rent = parseCards(doc, '#panel-berelheto a.card', 'rent'); }
      DATA.sale = parseCards(doc, '#grid a.card', 'sale', rate);
      [].slice.call(doc.querySelectorAll('.autok-tab')).forEach(function (b) {
        var m = /\((\d+)\)/.exec(b.textContent || ''); if (!m) return;
        if (/Bérelhető|prenájom|pronájm/i.test(b.textContent)) { if (!DATA.rentN) DATA.rentN = +m[1]; } else if (/Eladó autók|na predaj|na prodej/i.test(b.textContent)) DATA.saleN = +m[1];
      });
      loadBiz(cb);
      fetch(SRC.nw, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (h) {
        DATA.nw = parseNew(h, rate);
        DATA.nw.forEach(function (c) { var i = new Image(); i.src = c.img; });
        cb();
      }).catch(function () { DATA.nw = []; cb(); });
      DATA.rent.concat(DATA.sale).forEach(function (c) { if (c.img) { var i = new Image(); i.referrerPolicy = 'no-referrer'; i.src = thumb(c.img); } });
      cb();
    }).catch(function () { DATA.rent = []; DATA.sale = []; cb(); });
  }
  function newCard(c) {
    var np = !!window.CA_NP;
    var fu = c.fuels.map(function (f) { return '<span class="mm-fu" style="background:' + (FC[f] || '#4b5563') + '">' + esc(tFuel(f)) + '</span>'; }).join('');
    return '<a class="mm-car mm-new" href="' + esc(c.href) + '"><div class="mm-ph" style="background-image:url(\'' + c.img + '\')"></div><div class="mm-cb">' +
      '<div class="mm-meta">' + (c.logo ? '<img src="' + c.logo + '" alt="" width="40" height="18">' : '') + '<span>' + esc(tSpec(c.yr)) + '</span></div>' +
      '<b>' + esc(c.t) + '</b><span class="mm-sp">' + esc(tSpec(c.sp)) + '</span>' +
      '<div class="mm-tags"><span class="mm-av' + (c.now ? ' now' : '') + '">' + esc(c.avail) + '</span>' + fu + '</div>' +
      '<div class="mm-pr">' + (np ? '<strong>' + tx('Ajánlatot kérek') + '</strong>' : rentPrice(c.ft)) + '</div></div></a>';
  }
  function carCard(c, kind) {
    if (c.isNew) return newCard(c);
    var np = !!window.CA_NP || !c.ft;
    var price = np ? '<strong>' + tx('Ajánlatot kérek') + '</strong>'
      : kind === 'rent' ? '<strong>' + esc(c.ft) + '/hó</strong><em>' + esc(c.sub.replace(/\s*\/\s*/, '/')) + '</em>'
      : '<strong>' + esc(c.ft) + '</strong>' + (kind === 'sale' ? '<em>' + tx('nettó') + '</em>' : kind === 'biz' ? '<em>' + tx(c.sold ? 'elkelt' : 'bruttó') + '</em>' : '');
    var stamp = c.sold ? '<span class="mm-stamp">' + tx('Eladva') + '</span><span class="mm-when">' + tx('Elkelt') + ': ' + esc(c.sold) + '</span>' : '';
    var ngo = c.ngo ? '<div class="mm-ngo">' + (c.ngo.logo ? '<img src="' + esc(c.ngo.logo) + '" alt="" width="26" height="26" loading="lazy">' : '') + '<span><em>' + tx(c.sold ? 'Támogattuk' : 'Támogatjuk') + '</em>' + esc(c.ngo.n) + '</span></div>' : '';
    return '<a class="mm-car' + (c.sold ? ' mm-sold' : '') + '" href="' + esc(c.href) + '"><div class="mm-ph" style="background-image:url(\'' + thumb(c.img).replace(/'/g, '%27') + '\')">' + stamp + '</div><div class="mm-cb"><b>' + esc(shortName(c.t)) + '</b><span class="mm-sp">' + esc(tSpec(c.sp)) + '</span><div class="mm-pr">' + price + '</div>' + ngo + '</div></a>';
  }
  /* új autó kártya: stúdiókép, márkalogó, "2026 · Németország", nettó ár -tól */
  function newCarCard(c) {
    var np = !!window.CA_NP;
    var pr = np ? '<strong>' + tx('Ajánlatot kérek') + '</strong>'
      : !LI ? '<strong>' + esc(c.ft) + '</strong><em>-tól · nettó</em>'
      : LANG === 'zh' ? '<strong>' + esc(c.ft) + ' 起</strong><em>' + tx('nettó') + '</em>'
      : '<strong>' + esc(PER[LANG][0] + c.ft) + '</strong><em>' + tx('nettó') + '</em>';
    return '<a class="mm-car mm-new" href="' + esc(c.href) + '"><div class="mm-ph" style="background-image:url(\'' + c.img + '\')"></div><div class="mm-cb">' +
      '<div class="mm-meta">' + (c.logo ? '<img src="' + c.logo + '" alt="" width="40" height="18">' : '') + '<span>2026 · ' + tx('Németország') + '</span></div>' +
      '<b>' + esc(c.t) + '</b><span class="mm-sp">' + esc(tSpec(c.sp)) + '</span><div class="mm-pr">' + pr + '</div></div></a>';
  }
  function carsHtml(p) {
    var isNw = p.cars === 'sale' && SALE_TAB === 'new';
    var list = isNw ? DATA.nw : DATA[p.cars];
    if (list && !list.length && !isNw && p.cars !== 'sale') return '';
    var body = !list ? '<div class="mm-sk"></div><div class="mm-sk"></div><div class="mm-sk"></div><div class="mm-sk"></div>'
      : list.map(function (c) { return c.isNewCar ? newCarCard(c) : carCard(c, p.cars); }).join('') +
        (p.cars === 'biz' && list.length < 4 ? '<a class="mm-car mm-cta" href="/eladom/"><div class="mm-cb"><span class="mm-ic2">' + svg('cash', 28) + '</span><b>' + tx('Add el nálunk az autód') + '</b><span class="mm-sp" style="white-space:normal">' + tx('Ingyenes értékbecslés, hirdetés, bemutatás és papírmunka – mi intézzük.') + '</span><span class="mm-btn" style="margin-top:12px">' + tx('Értékbecslést kérek') + ' ' + svg('arrow', 15) + '</span></div></a>' : '');
    var n = p.cars === 'rent' ? DATA.rentN : p.cars === 'biz' ? DATA.bizN : DATA.saleN;
    var ng = '';
    if (p.cars === 'biz') {
      ng = '<div class="mm-ngos-w"><p class="mm-h"><a href="/jotekonysag/">' + tx('Akiket támogatunk') + ' ›</a></p><div class="mm-ngos">' +
        (DATA.ngos ? DATA.ngos.map(function (o) { return '<a class="mm-ng" href="/jotekonysag/" title="' + esc(o.name) + '"><img src="' + esc(o.logo) + '" alt="' + esc(o.name) + '" width="120" height="44"></a>'; }).join('')
        : new Array(8).join('<div class="mm-sk" style="aspect-ratio:auto;height:56px"></div>')) + '</div></div>';
    }
    var tabs = '', more = '<a class="mm-more" href="' + p.callHref + '">' + tx(p.call) + (n ? ' (' + n + ')' : '') + ' ' + svg('arrow', 15) + '</a>';
    if (p.cars === 'sale') {
      tabs = '<span class="mm-tabs" role="tablist"><button type="button" role="tab" class="mm-tab' + (isNw ? '' : ' on') + '" data-tab="used" aria-selected="' + !isNw + '">' + tx('Használt autók') + '</button><button type="button" role="tab" class="mm-tab' + (isNw ? ' on' : '') + '" data-tab="new" aria-selected="' + isNw + '">' + tx('Új autók') + '</button></span>';
      if (isNw) more = '<a class="mm-more" href="/egyedi-auto-rendeles/">' + tx('Összes új autó') + ' ' + svg('arrow', 15) + '</a>';
    }
    return ng + '<div><div class="mm-rowhead"><div class="mm-rh-l"><p class="mm-h">' + tx(p.ct) + '</p>' + tabs + '</div>' + more + '</div><div class="mm-cars">' + body + '</div></div>';
  }
  function panelHtml(p) {
    var h = '<div class="mm-in mm-split"><div class="mm-left"><p class="mm-h">' + tx('Menü') + '</p>' +
      p.links.map(function (l) { return '<a class="mm-l" href="' + l[2] + '">' + svg(l[0]) + '<div><b>' + tx(l[1]) + '</b><span>' + tx(l[3]) + '</span></div></a>'; }).join('') + '</div><div class="mm-right">';
    if (p.brands) {
      h += '<div><p class="mm-h"><a href="' + p.bhref + '">' + tx(p.bt) + ' ›</a></p><div class="mm-brands" style="grid-template-columns:repeat(' + p.bcols + ',minmax(0,1fr))">' +
        p.brands.map(function (b) { return '<a class="mm-b" href="' + b.href + '"><img src="/bl-' + b.k + '-dark.webp" alt="" width="46" height="30">' + esc(b.n) + '</a>'; }).join('') + '</div></div>';
    }
    if (p.cars) h += '<div class="mm-carswrap">' + carsHtml(p) + '</div>';
    else {
      if (p.side) h += '<div class="mm-siderow"><div><p class="mm-h">' + tx(p.side.t) + '</p><div class="mm-chips">' + p.side.items.map(function (s) { return '<a class="mm-chip" href="' + s[2] + '">' + svg(s[0], 18) + tx(s[1]) + '</a>'; }).join('') + '</div></div>' +
        (p.badge ? '<a class="mm-badge" href="' + p.badge.href + '"><span class="mm-ic2">' + svg('euro', 24) + '</span><span><strong>' + tx(p.badge.t) + '</strong><em>' + tx(p.badge.s) + '</em></span></a>' : '') + '</div>';
      var mini = (p.minis || []).map(function (m) { return '<a class="mm-mini" href="' + m[4] + '"><span class="mm-ic2">' + (m[0].indexOf('soc:') === 0 ? SOC[m[0].slice(4)] : svg(m[0], 24)) + '</span><div><strong' + (t(m[1]).length > 8 ? ' class="mm-long"' : '') + '>' + tx(m[1]) + '</strong><b>' + tx(m[2]) + '</b><span>' + tx(m[3]) + '</span></div><span class="mm-go">' + tx('Tovább') + ' ' + svg('arrow', 14) + '</span></a>'; }).join('');
      if (p.soc) h += '<div><p class="mm-h">' + tx('Kövess minket') + '</p><div class="mm-chips">' + p.soc.map(function (x) { return '<a class="mm-chip mm-schip" href="' + x[3] + '" target="_blank" rel="noopener">' + SOC[x[0]] + esc(x[1]) + '</a>'; }).join('') + '</div></div>';
      h += '<div><p class="mm-h">' + tx('Kiemelt') + '</p><div class="' + (mini ? 'mm-frow' : '') + '">' + mini + '<a class="mm-single" href="' + p.f.href + '"><div class="mm-ph" style="background-image:url(\'' + p.f.img + '\')"></div><div class="mm-ct"><b>' + tx(p.f.t) + '</b><span>' + tx(p.f.s) + '</span><span class="mm-btn" style="align-self:flex-start;margin:0">' + tx(p.f.cta) + ' ' + svg('arrow', 16) + '</span></div></a></div></div>';
    }
    h += '</div></div><div class="mm-foot"><span>' + svg('star', 16) + tx('5,0 Google értékelés') + '</span><span>' + svg('phone', 16) + '<a href="' + esc(phone().tel) + '">' + esc(phone().txt) + '</a></span><span>' + svg('clock', 16) + tx('Válasz 1 órán belül, munkaidőben') + '</span><span>' + svg('pin', 16) + 'Geretsried (DE) · Solymár (HU)</span></div>';
    return h;
  }

  function init() {
    var wrap = document.querySelector('.ca-navwrap');
    var items = wrap ? [].slice.call(wrap.querySelectorAll('.ca-nav .menu > .navitem')) : [];
    if (!wrap || items.length < 5) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var panel = el('<div class="mm-panel" role="region" aria-label="' + tx('Főmenü') + '"></div>');
    wrap.appendChild(panel);
    var cur = -1, tOpen = 0, tClose = 0;
    function desktop() { return window.matchMedia('(min-width:' + MIN_W + 'px)').matches; }
    function sync() { wrap.classList.toggle('mm-on', desktop()); if (!desktop()) close(); }
    function open(i) {
      clearTimeout(tClose);
      if (cur !== i) { panel.innerHTML = panelHtml(P[i]); cur = i; }
      items.forEach(function (li, k) { li.classList.toggle('mm-act', k === i); li.classList.remove('open'); var b = li.querySelector('.navlink'); if (b) b.setAttribute('aria-expanded', k === i ? 'true' : 'false'); });
      panel.classList.add('open');
    }
    function close() {
      clearTimeout(tOpen); panel.classList.remove('open'); cur = cur;
      items.forEach(function (li) { li.classList.remove('mm-act'); var b = li.querySelector('.navlink'); if (b) b.setAttribute('aria-expanded', 'false'); });
    }
    function closeSoon() { clearTimeout(tClose); tClose = setTimeout(close, 220); }
    items.forEach(function (li, i) {
      var btn = li.querySelector('.navlink'); if (!btn) return;
      btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
      li.addEventListener('mouseenter', function () { if (!desktop()) return; clearTimeout(tOpen); clearTimeout(tClose); tOpen = setTimeout(function () { open(i); }, panel.classList.contains('open') ? 60 : 140); });
      li.addEventListener('mouseleave', function () { if (!desktop()) return; clearTimeout(tOpen); closeSoon(); });
      btn.addEventListener('click', function (e) { if (!desktop()) return; e.preventDefault(); e.stopImmediatePropagation(); if (panel.classList.contains('open') && cur === i) close(); else open(i); }, true);
      btn.addEventListener('keydown', function (e) { if (!desktop()) return; if (e.key === 'ArrowDown') { e.preventDefault(); open(i); var a = panel.querySelector('a'); if (a) a.focus(); } });
    });
    panel.addEventListener('mouseenter', function () { clearTimeout(tClose); });
    panel.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.mm-tab'); if (!b) return; e.preventDefault(); SALE_TAB = b.getAttribute('data-tab'); refresh(); var nb = panel.querySelector('.mm-tab[data-tab="' + SALE_TAB + '"]'); if (nb) nb.focus(); });
    panel.addEventListener('mouseleave', closeSoon);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) { var b = items[cur] && items[cur].querySelector('.navlink'); close(); if (b) b.focus(); } });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    panel.addEventListener('focusout', function (e) { if (!panel.contains(e.relatedTarget) && !wrap.querySelector('.menu').contains(e.relatedTarget)) close(); });
    var mq = window.matchMedia('(min-width:' + MIN_W + 'px)');
    if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync);
    window.addEventListener('resize', sync); sync();
    // a képek előtöltése az első rámutatáskor, hogy a panel azonnal teljes legyen
    wrap.querySelector('.menu').addEventListener('mouseenter', function () { P.forEach(function (p) { var im = new Image(); im.src = p.f.img; }); }, { once: true });
    function refresh() { var w = panel.querySelector('.mm-carswrap'); if (w && cur >= 0 && P[cur].cars) w.innerHTML = carsHtml(P[cur]); }
    wrap.querySelector('.menu').addEventListener('mouseenter', function () { loadData(refresh); });
    wrap.querySelector('.menu').addEventListener('focusin', function () { loadData(refresh); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
