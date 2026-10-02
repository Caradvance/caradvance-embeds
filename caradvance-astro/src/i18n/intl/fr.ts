import type { IntlContent } from './types';

const fr: IntlContent = {
  ui: {
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    nav: {
      services: 'Services', rental: 'Location longue durée', import: 'Import de voiture d’Allemagne', regtax: 'Calculateur de taxe d’immatriculation',
      cars: 'Voitures', carsAvail: 'Voitures disponibles', carsNew: 'Configurateur voiture neuve',
      company: 'Société', contact: 'Contact', hu: 'Magyar oldal',
    },
    common: { call: 'Appeler', whatsapp: 'WhatsApp', email: 'E-mail', inHu: '(en hongrois)', home: 'Accueil', office: 'Bureau près de Budapest', hours: 'Lun–Ven 9h00–17h00' },
    trust: [
      ['23 ans', 'Caradvance GmbH, Allemagne — depuis 2003'],
      ['5000+', 'voitures premium livrées à des clients satisfaits'],
      ['5,0 ★', 'note Google'],
      ['Français', 'service personnel — aussi en anglais et en allemand'],
    ],
    form: {
      h2: 'Dites-nous ce que vous cherchez',
      lead: 'Envoyez-nous un court message — nous répondons en français, généralement le jour ouvré même.',
      name: 'Votre nom', email: 'E-mail', phone: 'Téléphone (facultatif)', interest: 'Je suis intéressé(e) par',
      interests: { rental: 'Location longue durée', import: 'Achat / import d’une voiture', regtax: 'Immatriculer ma voiture en Hongrie', other: 'Autre chose' },
      msg: 'Message', msgPh: 'Modèle, budget, délai, questions…',
      consent: 'J’ai lu et j’accepte la <a href="/adatkezeles/" target="_blank" rel="noopener">politique de confidentialité</a> et les <a href="/aszf/" target="_blank" rel="noopener">conditions générales</a> (en hongrois).',
      submit: 'Envoyer la demande', sending: 'Envoi…', ok: 'Merci ! Nous avons bien reçu votre demande et revenons vers vous très vite.', err: 'Désolé, une erreur est survenue. Appelez le +36 30 233 6060 ou écrivez à info@caradvance.hu.', need: 'Indiquez votre e-mail ou votre téléphone et acceptez la politique de confidentialité.',
    },
    footer: {
      tagline: 'Voitures premium d’Allemagne pour les résidents en Hongrie — location longue durée, import et immatriculation.',
      services: 'Services', cars: 'Voitures', company: 'Société', legal: 'Mentions légales (en hongrois)',
      privacy: 'Confidentialité', terms: 'CGV', imprint: 'Mentions légales', cookies: 'Paramètres des cookies',
      rep: 'Représentant en Hongrie : BH Group Zrt.', huSite: 'Magyar oldal',
    },
    calc: {
      h2: 'Calculateur de la taxe d’immatriculation hongroise 2026',
      lead: 'Indiquez la puissance, la classe environnementale et l’âge de la voiture : le calculateur affiche la taxe d’immatriculation (barème officiel NAV en vigueur au 1er janvier 2026), le droit de mutation et le coût officiel total de l’immatriculation en Hongrie.',
      cls: 'Classe environnementale', clsHint: 'Champ V.9 du certificat d’immatriculation hongrois ; pour une voiture étrangère, déduite de la norme Euro.',
      clsOpts: ['Meilleure que 14 et 1re immatriculation après le 31/12/2020 — ou hybride', 'Meilleure que 14 (p. ex. Euro 6)', '12–14 (p. ex. Euro 5)', '9–11 (p. ex. Euro 4)', '8 ou moins bonne', '5E / 5Z — 100 % électrique ou zéro émission (exonérée)'],
      power: 'Puissance du moteur', powerHint: 'En kW ou en ch — conversion automatique.', hp: 'ch',
      cc: 'Cylindrée (frais du contrôle d’origine)', ccOpts: ['jusqu’à 1400 cm³ ou électrique — 22 950 Ft', '1401–2000 cm³ — 24 975 Ft', 'plus de 2000 cm³ — 27 000 Ft'],
      kind: 'De quelle voiture s’agit-il ?', used: 'Occasion, immatriculée à l’étranger', newHu: 'Neuve (1re immatriculation en Hongrie)', newHint: 'Une voiture neuve ne bénéficie d’aucune réduction liée à l’âge.',
      firstReg: 'Première immatriculation (à l’étranger)', procStart: 'Début de la procédure en Hongrie', procHint: 'En général le mois d’arrivée de la voiture en Hongrie.',
      months: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
      total: 'Coût officiel estimé de l’immatriculation', band: 'Tranche de puissance', base: 'Taxe de base', elapsed: 'Mois écoulés', monthsUnit: 'mois', mult: 'Coefficient d’âge', reduction: 'Réduction liée à l’âge',
      regtax: 'Taxe d’immatriculation à payer', duty: 'Droit de mutation', dutyExempt: '(exonéré)', origin: 'Contrôle d’origine', docs: 'Certificat + titre de propriété', sum: 'Total',
      exempt: 'Exonérée',
      disc: '<b>À titre indicatif.</b> Non inclus : contrôle technique d’immatriculation et plaques (tarifs variables selon le centre) ainsi que le transport. La taxe est toujours fixée par l’administration fiscale hongroise (NAV). Source : barèmes NAV, 01/01/2026.',
      cta: 'Confiez-nous l’immatriculation →',
    },
    faqTitle: 'Questions fréquentes',
  },

  pages: {
    home: {
      title: 'Voiture premium en Hongrie : location & import | CarAdvance',
      desc: 'Service automobile pour les expatriés en Hongrie : location longue durée de voitures premium à Budapest, import de voiture d’Allemagne et immatriculation hongroise — nous gérons toutes les formalités.',
      kicker: 'Pour les expatriés et les familles internationales en Hongrie',
      h1: 'Votre voiture premium en Hongrie —<br><span class="accent">sans paperasse</span>',
      sub: 'Location longue durée de BMW, MINI, Mercedes et Audi neuves, voitures importées d’Allemagne aux prix allemands et immatriculation hongroise complète — une seule équipe s’occupe de tout.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Demander une offre', '#ajanlat'], cta2: ['Location voiture Budapest', 'rental'],
      breadcrumb: 'Accueil',
      secs: [
        {
          kicker: 'Nos services', h2: 'Trois façons d’aider les étrangers vivant en Hongrie',
          cards: [
            ['Location longue durée', 'Une voiture premium neuve à partir de 6 mois, entretien, taxe, assurance et pneus été/hiver compris — un loyer mensuel fixe.'],
            ['Import d’Allemagne', 'Nous trouvons la bonne voiture sur le marché allemand, l’inspectons sur place, l’amenons en Hongrie et vous la remettons immatriculée.'],
            ['Immatriculation & formalités', 'Vous vous installez en Hongrie avec votre voiture ? Nous calculons la taxe d’immatriculation et gérons les contrôles, la NAV et le bureau gouvernemental.'],
          ],
          links: [['Location longue durée', 'rental'], ['Import de voiture', 'import'], ['Calculateur de taxe', 'regtax']],
        },
        {
          kicker: 'Pourquoi CarAdvance', h2: 'Une société automobile allemande avec une équipe hongroise',
          p: [
            'CarAdvance est la marque de <strong>Caradvance GmbH</strong> (Geretsried, près de Munich), qui vend et loue des voitures premium depuis 2003. En Hongrie, nous sommes représentés par <strong>BH Group Zrt.</strong>, dont l’équipe près de Budapest gère le transport, l’immatriculation et toutes les démarches en hongrois.',
            'Beaucoup de nos clients sont des expatriés, des diplomates et des familles internationales qui veulent une voiture fiable sans affronter la bureaucratie hongroise. Vous traitez avec une seule équipe, de la première question à la remise des clés.',
          ],
          ul: [
            'Contrats et factures émis par une société allemande (Caradvance GmbH)',
            'Les particuliers peuvent acheter avec la TVA allemande de 19 %',
            'BMW, MINI, Mercedes-Benz, Audi et d’autres marques premium',
            'Financement et leasing via nos partenaires hongrois',
          ],
        },
        {
          kicker: 'Comment ça marche', h2: 'De la demande aux clés en quatre étapes',
          steps: [
            ['Votre besoin', 'Location ou achat, modèle, budget et délai — par formulaire, téléphone, WhatsApp ou e-mail.'],
            ['Une offre claire', 'Une offre transparente et détaillée — sans frais cachés.'],
            ['Nous gérons tout', 'Commande ou recherche, transport depuis l’Allemagne, immatriculation hongroise, assurance.'],
            ['Prenez la route', 'Vous recevez la voiture prête à rouler, avec plaques et papiers hongrois.'],
          ],
        },
      ],
      faq: [
        ['Parlez-vous français ?', 'Oui. Notre directeur import, Károly Tóth, parle français ; l’équipe travaille aussi en anglais, en allemand et en hongrois. Vous pouvez mener tout le projet avec nous en français.'],
        ['Puis-je louer une voiture longue durée à Budapest en tant qu’étranger ?', 'Oui. Notre location longue durée commence à 6 mois et s’adresse aux particuliers et aux entreprises qui vivent ou travaillent en Hongrie. Entretien, taxe hongroise sur les véhicules, assurances tous risques et responsabilité civile ainsi que pneus été/hiver sont inclus dans le loyer.'],
        ['Pouvez-vous importer une voiture d’Allemagne pour moi ?', 'Oui — neuve ou d’occasion. Nous cherchons sur le marché allemand, vérifions l’historique, inspectons la voiture sur place, la transportons en Hongrie et réalisons l’immatriculation hongroise.'],
        ['Je m’installe en Hongrie avec ma propre voiture. Pouvez-vous m’aider ?', 'Oui. L’immatriculation d’une voiture étrangère en Hongrie comprend un contrôle d’origine, un contrôle technique, la taxe d’immatriculation (NAV) et le bureau gouvernemental. Utilisez notre calculateur pour une première estimation — nous nous occupons du reste.'],
        ['Où êtes-vous situés ?', 'Notre bureau hongrois se trouve à Solymár, aux portes de Budapest (2083 Solymár, Ibolya utca 18.), ouvert du lundi au vendredi de 9h00 à 17h00. La société contractante est Caradvance GmbH à Geretsried (Allemagne).'],
      ],
      formInterest: 'other',
    },

    rental: {
      title: 'Location voiture Budapest – longue durée dès 6 mois | CarAdvance',
      desc: 'Location de voiture longue durée à Budapest dès 6 mois : BMW, MINI, Mercedes et Audi neuves, entretien, taxe, assurance et pneus hiver inclus. Service pour les expatriés en Hongrie.',
      kicker: 'Location de voiture longue durée à Budapest',
      h1: 'Location voiture Budapest —<br><span class="accent">voitures premium neuves dès 6 mois</span>',
      sub: 'Un loyer mensuel fixe incluant entretien, taxe hongroise sur les véhicules, assurance tous risques et pneus été/hiver. BMW, MINI, Mercedes-Benz et Audi neuves — idéal pour les expatriés et les entreprises internationales en Hongrie.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Demander une offre de location', '#ajanlat'], cta2: ['Voitures disponibles', '/autoink/#berelheto'],
      breadcrumb: 'Location voiture Budapest',
      service: 'Location de voiture longue durée à Budapest',
      secs: [
        {
          kicker: 'Tout compris', h2: 'Ce qui est inclus dans le loyer mensuel',
          cards: [
            ['Entretien', 'Entretien selon le constructeur et pièces d’usure (plaquettes, disques, essuie-glaces).'],
            ['Taxe & frais officiels', 'Taxe hongroise sur les véhicules, frais officiels et contrôle technique obligatoire.'],
            ['Assurance', 'Responsabilité civile (KGFB) et tous risques (casco) — souscrites et payées par nous.'],
            ['Pneus été & hiver', 'Les deux jeux sont inclus, avec changement saisonnier et stockage.'],
            ['Assistance', 'Assistance routière en Hongrie et dans les pays autorisés.'],
            ['Véhicule de remplacement', 'En cas de réparation après sinistre, un véhicule similaire pendant les 10 premiers jours ouvrés (selon disponibilité).'],
          ],
          note: 'Non inclus : carburant et AdBlue, vignette autoroutière, péages, stationnement, lavage, amendes et franchise en cas de sinistre.',
        },
        {
          kicker: 'Conditions claires', h2: 'Les conditions de location en bref',
          table: {
            head: ['', ''],
            rows: [
              ['Durée minimale', '6 mois complets à partir de la remise — ensuite reconduction aux mêmes conditions, résiliable avec un préavis de 30 jours (fin du mois de location).'],
              ['Dépôt de garantie', '3 000–10 000 € selon le modèle ; remboursé sous 30 jours après la restitution. Certaines locations démarrent sans dépôt initial.'],
              ['Kilométrage', 'Forfait mensuel (p. ex. 2 000 km par mois), cumulé sur toute la durée.'],
              ['Franchise', '10 % du dommage (vol : 20 %), au minimum 1 000 € par sinistre.'],
              ['Paiement', 'Loyer mensuel fixe en EUR ou en HUF, par virement.'],
              ['Contractant', 'Caradvance GmbH (Allemagne) ; BH Group Zrt. est notre représentant en Hongrie.'],
            ],
          },
          links: [['Conditions complètes et dépôt (en hongrois)', '/berlesi-feltetelek/']],
        },
        {
          kicker: 'Les voitures', h2: 'Des modèles premium en location longue durée',
          p: [
            'Choisissez parmi les modèles actuels <strong>BMW</strong> (Série 1 à X7, modèles M), <strong>MINI</strong>, <strong>Mercedes-Benz</strong> (Classe A à Classe S, GLC, GLE) et <strong>Audi</strong>. Certaines voitures sont disponibles immédiatement ; d’autres sont commandées neuves selon vos souhaits — la location commence alors le jour de la remise.',
            'Après la durée minimale, vous pouvez garder la voiture, la restituer avec 30 jours de préavis ou passer à un autre modèle.',
          ],
          links: [['Voitures disponibles (en hongrois)', '/autoink/#berelheto'], ['Location de voiture neuve par marque (en hongrois)', '/uj-auto-berlese/']],
        },
        {
          kicker: 'Pourquoi la longue durée', h2: 'Pourquoi les expatriés louent plutôt que d’acheter',
          ul: [
            '<strong>Pas de gros investissement</strong> — un loyer mensuel prévisible.',
            '<strong>Aucune formalité hongroise</strong> — immatriculation, taxe, assurance et contrôles sont notre affaire.',
            '<strong>Flexible</strong> — après 6 mois, résiliable avec 30 jours de préavis, idéal pour les missions de durée incertaine.',
            '<strong>Toujours une voiture neuve</strong> — aucun risque de revente lorsque vous quittez la Hongrie.',
          ],
        },
      ],
      faq: [
        ['S’agit-il de location à la journée ?', 'Non — nous sommes spécialisés dans la location longue durée à Budapest et dans toute la Hongrie, à partir de 6 mois. Pour quelques jours, un loueur classique est plus adapté.'],
        ['Un étranger peut-il louer une voiture longue durée en Hongrie ?', 'Oui. Les particuliers et les entreprises qui vivent ou travaillent en Hongrie peuvent louer chez nous. Il faut un permis de conduire valide et une pièce d’identité ; nous précisons les documents nécessaires dans l’offre.'],
        ['Que comprend le loyer mensuel ?', 'Entretien, pièces d’usure, taxe hongroise sur les véhicules et frais officiels, responsabilité civile et tous risques, pneus été/hiver avec stockage, et assistance. Carburant, péages, stationnement, amendes et franchise ne sont pas inclus.'],
        ['Quel est le montant du dépôt de garantie ?', 'Entre 3 000 € et 10 000 € selon la catégorie. C’est une garantie, pas un frais, remboursée sous 30 jours après la restitution et la clôture des dossiers en cours. Certaines locations démarrent sans dépôt initial.'],
        ['Puis-je résilier plus tôt ?', 'La durée minimale est de 6 mois complets. Ensuite, le contrat se poursuit aux mêmes conditions et peut être résilié par écrit avec 30 jours de préavis à la fin d’un mois de location — ou vous changez de voiture.'],
        ['Puis-je rouler à l’étranger ?', 'Oui, dans les pays autorisés indiqués au contrat ; l’assistance est valable en Hongrie et dans ces pays.'],
      ],
      formInterest: 'rental',
    },

    import: {
      title: 'Importer une voiture d’Allemagne en Hongrie – clé en main | CarAdvance',
      desc: 'Achetez votre voiture en Allemagne et roulez en Hongrie : nous la trouvons, l’inspectons, la transportons et l’immatriculons. Prix allemands, TVA allemande de 19 % pour les particuliers.',
      kicker: 'Import de voiture d’Allemagne en Hongrie',
      h1: 'Achetez en Allemagne —<br><span class="accent">nous l’amenons en Hongrie</span>',
      sub: 'Le plus grand marché européen de voitures premium, aux prix allemands. Nous trouvons la bonne voiture, l’inspectons sur place, la transportons et réalisons l’immatriculation hongroise — vous la recevez avec des plaques hongroises.',
      video: '/caradvance-hero-beszerzesi.mp4', poster: '/caradvance-hero-beszerzesi-poster.jpg',
      cta1: ['Demander une recherche', '#ajanlat'], cta2: ['Calculer la taxe', 'regtax'],
      breadcrumb: 'Import de voiture d’Allemagne',
      service: 'Import de voiture d’Allemagne en Hongrie',
      secs: [
        {
          kicker: 'Pourquoi l’Allemagne', h2: 'Pourquoi acheter une voiture en Allemagne',
          cards: [
            ['Un choix immense', 'Bien plus que l’offre hongroise — surtout en modèles premium bien équipés.'],
            ['Meilleur état', 'Les voitures allemandes ont souvent un historique d’entretien complet et moins de défauts cachés.'],
            ['Prix allemands', 'Les particuliers achètent chez Caradvance GmbH avec la TVA allemande de 19 %.'],
          ],
        },
        {
          kicker: 'Notre service', h2: 'Ce que nous faisons pour vous',
          steps: [
            ['Recherche & sélection', 'Nous parcourons tout le marché allemand (p. ex. mobile.de, AutoScout24) selon vos critères.'],
            ['Vérification de l’historique', 'Contrôle dans des bases internationales — accidents, kilométrage, origine.'],
            ['Inspection sur place', 'Notre expert inspecte la voiture avant votre décision.'],
            ['Négociation & achat', 'Nous négocions pour vous et gérons le contrat.'],
            ['Transport assuré', 'Transport professionnel vers la Hongrie avec une assurance élevée.'],
            ['Immatriculation hongroise', 'Contrôle d’origine, contrôle technique, taxe d’immatriculation (NAV), plaques et papiers.'],
            ['Remise', 'Vous recevez la voiture prête à rouler, à votre nom, avec une garantie d’un an pour les particuliers.'],
          ],
        },
        {
          kicker: 'Coûts', h2: 'Combien coûte l’import d’une voiture d’Allemagne ?',
          p: ['Le prix final comprend le prix d’achat et les frais d’import. Vous recevez un calcul détaillé avant de vous engager — sans frais cachés.'],
          table: {
            head: ['Poste', 'Dépend de'],
            rows: [
              ['Prix d’achat', 'La voiture — TVA allemande de 19 % pour les particuliers'],
              ['Transport', 'Distance et véhicule — détaillé dans l’offre'],
              ['Taxe d’immatriculation', 'Puissance (kW), classe environnementale et âge — 0 Ft pour une électrique'],
              ['Droit de mutation', 'kW × taux selon l’âge — 0 Ft pour une électrique'],
              ['Contrôles & documents', 'Contrôle d’origine 22 950–27 000 Ft, contrôle technique, certificat + titre 12 000 Ft, plaques'],
              ['Nos honoraires', 'Fixés à l’avance'],
            ],
          },
          links: [['Calculer la taxe d’immatriculation', 'regtax']],
        },
        {
          kicker: 'Neuve ou d’occasion', h2: 'Voitures neuves sur commande ou occasions du marché allemand',
          p: [
            'Vous cherchez une <strong>voiture neuve</strong> ? Nous commandons des BMW, MINI, Mercedes-Benz et Audi configurées selon vos souhaits, aux prix allemands. Une <strong>occasion</strong> ? Nous trouvons des voitures bien documentées et les contrôlons avant l’achat.',
            'Pour une occasion, comptez en général 5 à 14 jours entre la sélection et la remise, selon la voiture et les rendez-vous de contrôle.',
          ],
          links: [['Configurateur voiture neuve (en hongrois)', '/egyedi-auto-rendeles/'], ['Voitures en stock (en hongrois)', '/autoink/']],
        },
      ],
      faq: [
        ['Combien de temps faut-il pour importer une voiture d’Allemagne en Hongrie ?', 'Pour une occasion, généralement 5 à 14 jours entre la sélection et la remise avec plaques hongroises, selon la voiture et les rendez-vous. Pour une neuve, cela dépend du délai d’usine.'],
        ['Puis-je acheter avec la TVA allemande en tant que particulier ?', 'Oui. Les particuliers peuvent acheter chez Caradvance GmbH avec 19 % de TVA allemande au lieu des 27 % hongrois. Nous détaillons les modalités pour votre voiture dans l’offre.'],
        ['Dois-je me rendre en Allemagne ?', 'Non. Nous cherchons, inspectons, achetons et transportons la voiture — vous n’avez pas à voyager.'],
        ['La voiture importée est-elle garantie ?', 'Les particuliers bénéficient d’une garantie d’un an, et nous aidons pour l’assurance (responsabilité civile et tous risques).'],
        ['La voiture importée peut-elle être financée ?', 'Oui, via nos partenaires hongrois, en financement ou en leasing, pour les particuliers comme pour les entreprises.'],
      ],
      formInterest: 'import',
    },

    regtax: {
      title: 'Taxe d’immatriculation Hongrie – calculateur 2026 | CarAdvance',
      desc: 'Calculateur gratuit de la taxe d’immatriculation hongroise (regisztrációs adó) selon les barèmes NAV 2026 : taxe, droit de mutation et frais pour immatriculer une voiture étrangère en Hongrie.',
      kicker: 'Immatriculer une voiture étrangère en Hongrie',
      h1: 'Taxe d’immatriculation en Hongrie —<br><span class="accent">le coût total en une minute</span>',
      sub: 'Vous vous installez en Hongrie avec votre voiture, ou vous en importez une ? Calculez la taxe d’immatriculation (regisztrációs adó), le droit de mutation et les frais officiels avec les barèmes NAV 2026 — puis confiez-nous l’immatriculation.',
      video: '/caradvance-hero-beszerzesi.mp4', poster: '/caradvance-hero-beszerzesi-poster.jpg',
      cta1: ['Calculer maintenant', '#kalkulator'], cta2: ['Nous confier l’immatriculation', '#ajanlat'],
      breadcrumb: 'Calculateur de taxe d’immatriculation',
      service: 'Immatriculation de voitures étrangères en Hongrie',
      secs: [
        {
          kicker: 'Le calcul', h2: 'Comment la taxe d’immatriculation hongroise est calculée',
          p: [
            'Depuis le 1er mars 2025, la taxe dépend de la <strong>puissance du moteur (kW)</strong> et de la <strong>classe environnementale</strong>. Le montant de base est réduit par un <strong>coefficient d’âge</strong> : plus il s’est écoulé de mois depuis la première immatriculation à l’étranger, plus la taxe est basse. Les voitures 100 % électriques (5E) et zéro émission (5Z) sont exonérées ; les hybrides rechargeables paient le taux le plus bas.',
            'La taxe est fixée par l’administration fiscale hongroise (NAV) par décision, et son paiement conditionne l’immatriculation. S’y ajoutent le droit de mutation, les contrôles d’origine et technique, les documents et les plaques.',
          ],
        },
        {
          kicker: 'La procédure', h2: 'Immatriculer une voiture étrangère en Hongrie — étape par étape',
          steps: [
            ['Contrôle d’origine', 'Vérification des numéros d’identification et des documents dans un centre agréé.'],
            ['Contrôle technique', 'Contrôle pour l’immatriculation ; une fiche technique hongroise est établie.'],
            ['Taxe d’immatriculation', 'Fixée et perçue par la NAV, selon la puissance, la classe et l’âge.'],
            ['Immatriculation', 'Droit de mutation, assurance, certificat d’immatriculation hongrois, titre et plaques au bureau gouvernemental.'],
          ],
          note: 'Si vous résidez en Hongrie, l’usage d’une voiture immatriculée à l’étranger est limité — dans la plupart des cas, elle doit être immatriculée ici. Nous examinons votre situation et gérons toute la procédure.',
          links: [['Guide détaillé (en hongrois)', '/blog/regisztracios-ado-2026/']],
        },
      ],
      faq: [
        ['Combien coûte la taxe d’immatriculation en Hongrie en 2026 ?', 'Elle dépend de la puissance (kW), de la classe environnementale et de l’âge. Le montant de base va de 47 000 Ft à plusieurs millions de forints ; le coefficient d’âge peut le réduire jusqu’à 90 %. Utilisez le calculateur ci-dessus pour votre voiture.'],
        ['Les voitures électriques paient-elles la taxe d’immatriculation en Hongrie ?', 'Non. Les voitures particulières 100 % électriques (5E) et zéro émission (5Z) sont exonérées. Les hybrides rechargeables sont taxables mais relèvent de la colonne la plus favorable.'],
        ['Quels autres frais à l’immatriculation ?', 'Le droit de mutation (kW × taux selon l’âge), le contrôle d’origine (22 950–27 000 Ft selon la cylindrée), le contrôle technique, le certificat et le titre (12 000 Ft) et les plaques.'],
        ['Qui fixe le montant définitif ?', 'L’administration fiscale hongroise (NAV) fixe la taxe par décision. Notre calculateur donne une estimation fiable basée sur les barèmes officiels 2026.'],
        ['Pouvez-vous immatriculer ma voiture pour moi ?', 'Oui. Nous gérons les contrôles, la procédure NAV et le bureau gouvernemental, et vous rendons la voiture avec plaques et papiers hongrois.'],
      ],
      formInterest: 'regtax',
    },

    contact: {
      title: 'Contact – CarAdvance, service automobile près de Budapest',
      desc: 'Contactez CarAdvance : location longue durée, import de voiture d’Allemagne et immatriculation en Hongrie. Bureau près de Budapest, tél. +36 30 233 6060, info@caradvance.hu.',
      kicker: 'Contact',
      h1: 'Parlons de votre projet —<br><span class="accent">en français</span>',
      sub: 'Une question sur la location longue durée, l’import ou l’immatriculation de votre voiture en Hongrie ? Appelez, écrivez sur WhatsApp ou utilisez le formulaire — nous répondons généralement le jour ouvré même.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Envoyer un message', '#ajanlat'], cta2: ['Appeler +36 30 233 6060', 'tel:+36302336060'],
      breadcrumb: 'Contact',
      secs: [
        {
          kicker: 'Nous joindre', h2: 'Comment nous contacter',
          cards: [
            ['Téléphone & WhatsApp', '<a href="tel:+36302336060">+36 30 233 6060</a> · <a href="https://wa.me/36302336060" target="_blank" rel="noopener">WhatsApp</a>'],
            ['E-mail', '<a href="mailto:info@caradvance.hu">info@caradvance.hu</a>'],
            ['Bureau près de Budapest', 'BH Group Zrt. · 2083 Solymár, Ibolya utca 18. · Lun–Ven 9h00–17h00'],
          ],
        },
        {
          kicker: 'Qui sommes-nous', h2: 'Les sociétés derrière CarAdvance',
          p: [
            '<strong>Caradvance GmbH</strong> — Bgm-Graf-Ring 21, 82538 Geretsried, Allemagne. Vendeur et loueur ; vos contrats et factures sont émis par Caradvance GmbH.',
            '<strong>BH Group Zrt.</strong> — représentant hongrois de Caradvance GmbH. Notre équipe en Hongrie gère la relation client, le transport depuis l’Allemagne, l’immatriculation et les formalités.',
          ],
        },
      ],
      faq: [
        ['Dans quelles langues travaillez-vous ?', 'En français, en anglais, en allemand et en hongrois.'],
        ['Quand êtes-vous joignables ?', 'Du lundi au vendredi, de 9h00 à 17h00. Les messages reçus en dehors de ces horaires sont traités le jour ouvré suivant.'],
        ['Puis-je venir au bureau ?', 'Oui, sur rendez-vous — notre bureau est à Solymár, aux portes de Budapest.'],
      ],
      formInterest: 'other',
    },
  },
};

export default fr;
