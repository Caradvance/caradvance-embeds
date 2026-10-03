import type { IntlContent } from './types';

const en: IntlContent = {
  ui: {
    htmlLang: 'en',
    ogLocale: 'en_GB',
    nav: {
      services: 'Services', rental: 'Long-term car rental', import: 'Car import from Germany', regtax: 'Registration tax calculator',
      cars: 'Cars', carsAvail: 'Available cars', carsNew: 'New car configurator',
      company: 'Company', contact: 'Contact', hu: 'Magyar oldal',
    },
    common: { call: 'Call us', whatsapp: 'WhatsApp', email: 'E-mail', inHu: '(in Hungarian)', home: 'Home', office: 'Office near Budapest', hours: 'Mon–Fri 9:00–17:00' },
    trust: [
      ['23 years', 'Caradvance GmbH, Germany — since 2003'],
      ['5000+', 'premium cars delivered to happy customers'],
      ['5.0 ★', 'Google rating'],
      ['English', 'personal service — also in German and French'],
    ],
    form: {
      h2: 'Tell us what you need',
      lead: 'Send a short message — we reply in English, usually the same working day.',
      name: 'Your name', email: 'E-mail', phone: 'Phone (optional)', interest: 'I am interested in',
      interests: { rental: 'Long-term car rental', import: 'Buying / importing a car', regtax: 'Registering my car in Hungary', other: 'Something else' },
      msg: 'Message', msgPh: 'Car model, budget, timing, questions…',
      consent: 'I have read and accept the <a href="/adatkezeles/" target="_blank" rel="noopener">privacy notice</a> and the <a href="/aszf/" target="_blank" rel="noopener">terms</a> (in Hungarian).',
      submit: 'Send request', sending: 'Sending…', ok: 'Thank you! We received your request and will get back to you shortly.', err: 'Sorry, something went wrong. Please call +36 30 233 6060 or e-mail info@caradvance.hu.', need: 'Please add your e-mail or phone number and accept the privacy notice.',
    },
    footer: {
      tagline: 'Premium cars from Germany for people living in Hungary — long-term rental, import and registration, in English.',
      services: 'Services', cars: 'Cars', company: 'Company', legal: 'Legal (in Hungarian)',
      privacy: 'Privacy notice', terms: 'Terms & conditions', imprint: 'Imprint', cookies: 'Cookie settings',
      rep: 'Hungarian representative: BH Group Zrt.', huSite: 'Magyar oldal',
    },
    calc: {
      h2: 'Hungarian registration tax calculator 2026',
      lead: 'Set the engine power, environmental class and age of the car — the calculator shows the registration tax (official NAV table valid from 1 January 2026), the transfer duty and the total official cost of registering the car in Hungary.',
      cls: 'Environmental class', clsHint: 'Shown in field V.9 of a Hungarian registration certificate; derived from the Euro emission standard of a foreign car.',
      clsOpts: ['Better than 14 and first registered after 31.12.2020 — or hybrid', 'Better than 14 (e.g. Euro 6)', '12–14 (e.g. Euro 5)', '9–11 (e.g. Euro 4)', '8 or worse', '5E / 5Z — fully electric or zero emission (exempt)'],
      power: 'Engine power', powerHint: 'Enter kW or hp — it is converted automatically.', hp: 'hp',
      cc: 'Engine size (originality inspection fee)', ccOpts: ['up to 1400 cm³ or electric — 22 950 Ft', '1401–2000 cm³ — 24 975 Ft', 'over 2000 cm³ — 27 000 Ft'],
      kind: 'Which car is it?', used: 'Used, registered abroad', newHu: 'Brand new (first registration in Hungary)', newHint: 'A brand-new car gets no age reduction.',
      firstReg: 'First registration (abroad)', procStart: 'Start of the Hungarian procedure', procHint: 'Usually the month the car arrives in Hungary.',
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      total: 'Estimated official cost of registration', band: 'Power band', base: 'Base registration tax', elapsed: 'Months elapsed', monthsUnit: 'months', mult: 'Age multiplier', reduction: 'Age reduction',
      regtax: 'Registration tax payable', duty: 'Transfer duty', dutyExempt: '(exempt)', origin: 'Originality inspection', docs: 'Registration certificate + title', sum: 'Total',
      exempt: 'Tax-free',
      disc: '<b>For information only.</b> Not included: technical inspection for registration and number plates (fees vary by station) and transport. The tax is always determined by the Hungarian tax authority (NAV). Source: NAV tables, 01.01.2026.',
      cta: 'Let us handle the registration →',
    },
    faqTitle: 'Frequently asked questions',
  },

  pages: {
    home: {
      title: 'Premium Car Rental & Car Import in Budapest | CarAdvance',
      desc: 'English-speaking car service for expats in Hungary: long-term premium car rental in Budapest, car import from Germany and Hungarian registration — all paperwork handled for you.',
      kicker: 'For expats and international families in Hungary',
      h1: 'Your premium car in Hungary —<br><span class="accent">without the paperwork</span>',
      sub: 'Long-term rental of new BMW, MINI, Mercedes and Audi models, cars imported from Germany at German prices, and the complete Hungarian registration — in English, from one team.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Request an offer', '#ajanlat'], cta2: ['Car rental Budapest', 'rental'],
      breadcrumb: 'Home',
      secs: [
        {
          kicker: 'What we do', h2: 'Three ways we help foreigners living in Hungary',
          cards: [
            ['Long-term car rental', 'A new premium car with German plates for a minimum of 6 months — service, tax, insurance and summer/winter tyres included in one fixed monthly fee.'],
            ['Car import from Germany', 'We find the right car on the German market, inspect it on site, bring it to Hungary and hand it over with Hungarian plates.'],
            ['Registration & paperwork', 'Bringing your own car to Hungary? We calculate the registration tax and handle the inspections, NAV and the government office for you.'],
          ],
          links: [['Long-term car rental', 'rental'], ['Car import', 'import'], ['Registration tax calculator', 'regtax']],
        },
        {
          kicker: 'Why CarAdvance', h2: 'A German car company with a Hungarian team',
          p: [
            'CarAdvance is the brand of <strong>Caradvance GmbH</strong> (Geretsried, near Munich), selling and renting premium cars since 2003. In Hungary we are represented by <strong>BH Group Zrt.</strong>, whose team near Budapest takes care of transport, registration and everything that has to be done in Hungarian.',
            'Many of our customers are expats, diplomats and international families who want a reliable car without dealing with Hungarian bureaucracy. You talk to one team in English (or German) — from the first question to the keys in your hand.',
          ],
          ul: [
            'Contracts and invoices from a German company (Caradvance GmbH)',
            'Private buyers can purchase with 19% German VAT',
            'BMW, MINI, Mercedes-Benz, Audi and other premium brands',
            'Financing and leasing through our Hungarian partners',
          ],
        },
        {
          kicker: 'How it works', h2: 'From request to keys in four steps',
          steps: [
            ['Tell us what you need', 'Rental or purchase, model, budget and timing — by form, phone, WhatsApp or e-mail.'],
            ['Receive a clear offer', 'A transparent, itemised offer in English — no hidden costs.'],
            ['We handle everything', 'Ordering or sourcing, transport from Germany, insurance — and for purchased cars the Hungarian registration.'],
            ['Drive away', 'You receive the car ready to drive — rental cars with German plates, purchased cars with Hungarian plates and documents.'],
          ],
        },
      ],
      faq: [
        ['Do you speak English?', 'Yes. Our team works in English, German and French as well as Hungarian — you can handle the whole process with us in English, and we send your offer in English.'],
        ['Can I rent a car long term in Budapest as a foreigner?', 'Yes. Our long-term rental starts at 6 months and is available to private individuals and companies living or working in Hungary. The cars keep their German plates; service, vehicle tax, comprehensive and third-party insurance and summer/winter tyres are included in the monthly fee.'],
        ['Can you import a car from Germany for me?', 'Yes — new or used. We search the German market, check the car’s history, inspect it on site, transport it to Hungary and complete the Hungarian registration, so you receive it with Hungarian plates.'],
        ['I am moving to Hungary with my own car. Can you help?', 'Yes. Registering a foreign car in Hungary involves an originality inspection, a technical inspection, the registration tax (NAV) and the government office. Use our registration tax calculator for a first estimate, then let us handle the process.'],
        ['Where are you located?', 'Our Hungarian office is in Solymár, just outside Budapest (2083 Solymár, Ibolya utca 18.), open Monday–Friday 9:00–17:00. The contracting company is Caradvance GmbH in Geretsried, Germany.'],
      ],
      formInterest: 'other',
    },

    rental: {
      title: 'Car Rental Budapest – Long-Term Premium Car Rental | CarAdvance',
      desc: 'Long-term car rental in Budapest from 6 months: new BMW, MINI, Mercedes & Audi with service, tax, insurance and winter tyres included. English-speaking service for expats in Hungary.',
      kicker: 'Long-term car rental in Budapest',
      h1: 'Car rental Budapest —<br><span class="accent">new premium cars from 6 months</span>',
      sub: 'German plates, one fixed monthly fee with service, vehicle tax, comprehensive insurance and summer/winter tyres included. New BMW, MINI, Mercedes-Benz and Audi models — ideal for expats and international companies in Hungary.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Request a rental offer', '#ajanlat'], cta2: ['See available cars', '/autoink/#berelheto'],
      breadcrumb: 'Car rental Budapest',
      service: 'Long-term car rental in Budapest',
      secs: [
        {
          kicker: 'All-inclusive', h2: 'What is included in the monthly fee',
          cards: [
            ['Service & maintenance', 'Scheduled service according to the manufacturer, plus wear parts such as brake pads, discs and wipers.'],
            ['German plates, tax & fees', 'The car is registered in Germany to Caradvance GmbH — vehicle tax, official fees and the mandatory inspections are included.'],
            ['Insurance', 'Third-party liability and comprehensive insurance — arranged and paid by us.'],
            ['Summer & winter tyres', 'Both sets included, with seasonal change and storage.'],
            ['Assistance', 'Roadside assistance in Hungary and in the permitted countries.'],
            ['Replacement car', 'If your car is being repaired after damage, a similar car for the first 10 working days (subject to fleet availability).'],
          ],
          note: 'Not included: fuel and AdBlue, motorway vignette, tolls, parking, car wash, fines, and the insurance excess in case of damage.',
        },
        {
          kicker: 'Clear terms', h2: 'Rental terms at a glance',
          table: {
            head: ['', ''],
            rows: [
              ['Minimum term', '6 full months from handover — then it continues on the same terms with 30 days’ notice (to the end of a rental month).'],
              ['Deposit', '3,000–10,000 € depending on the model; refunded within 30 days after return. Some rentals start without an upfront deposit.'],
              ['Mileage', 'Monthly allowance (e.g. 2,000 km per month), added up over the whole term.'],
              ['Insurance excess', '10% of the damage (theft: 20%), at least 1,000 € per claim.'],
              ['Payment', 'Fixed monthly fee in EUR or HUF, by bank transfer.'],
              ['Contract partner', 'Caradvance GmbH (Germany); BH Group Zrt. is our representative in Hungary.'],
            ],
          },
          links: [['Full terms & deposit details (in Hungarian)', '/berlesi-feltetelek/']],
        },
        {
          kicker: 'The cars', h2: 'Premium models for long-term rental',
          p: [
            'Choose from current <strong>BMW</strong> (1 Series to X7, M models), <strong>MINI</strong>, <strong>Mercedes-Benz</strong> (A-Class to S-Class, GLC, GLE) and <strong>Audi</strong> models. Some cars are available immediately; others are ordered new to your specification — in that case the rental starts on the day of handover, not on signing.',
            'After the minimum term you can keep the car, return it with 30 days’ notice, or switch to another model.',
          ],
          links: [['Available cars (in Hungarian)', '/autoink/#berelheto'], ['New car rental by brand (in Hungarian)', '/uj-auto-berlese/']],
        },
        {
          kicker: 'Why long-term', h2: 'Why expats choose long-term rental instead of buying',
          ul: [
            '<strong>No large upfront investment</strong> — one predictable monthly fee.',
            '<strong>No Hungarian paperwork</strong> — the car stays registered in Germany with German plates; tax, insurance and inspections are our job.',
            '<strong>Flexible</strong> — after 6 months you can end the contract with 30 days’ notice, ideal for assignments of uncertain length.',
            '<strong>Always a new car</strong> — no resale risk when you leave Hungary.',
          ],
        },
      ],
      faq: [
        ['Is this a daily car rental?', 'No — we specialise in long-term car rental in Budapest and across Hungary, starting at 6 months. For short trips of a few days, a classic rental company is the better choice.'],
        ['Can foreigners rent a car long term in Hungary?', 'Yes. Private individuals and companies living or working in Hungary can rent from us. You need a valid driving licence and identification; we explain the required documents in your offer.'],
        ['What is included in the monthly price?', 'Service and maintenance, wear parts, vehicle tax and official fees, third-party liability and comprehensive insurance, summer and winter tyres with storage, and assistance. Fuel, tolls, parking, fines and the insurance excess are not included.'],
        ['Which number plates does the rental car have?', 'German plates. The car is registered in Germany to Caradvance GmbH, the lessor — no Hungarian registration is needed, and you receive the German registration document and the insurance card with the car.'],
        ['How much is the deposit?', 'Between 3,000 € and 10,000 € depending on the car category. It is a security, not a fee, and is refunded within 30 days after the car is returned and any open matters are closed. Some rentals start without an upfront deposit.'],
        ['Can I end the contract early?', 'The minimum term is 6 full months. After that the contract continues on the same terms and can be ended with 30 days’ written notice to the end of a rental month — or you can switch to another car.'],
        ['Can I drive the car abroad?', 'Yes, within the permitted countries listed in the contract; assistance is valid in Hungary and in those countries.'],
      ],
      formInterest: 'rental',
    },

    import: {
      title: 'Car Import from Germany to Hungary – Turnkey | CarAdvance',
      desc: 'Buy a car from Germany and drive it in Hungary: we source, inspect, transport and register it with Hungarian plates. German prices, 19% German VAT for private buyers, English-speaking service.',
      kicker: 'Car import from Germany to Hungary',
      h1: 'Buy your car in Germany —<br><span class="accent">we bring it to Hungary</span>',
      sub: 'The largest premium car market in Europe, at German prices. We find the right car, inspect it on site, transport it and complete the Hungarian registration — you receive it with Hungarian plates.',
      video: '/caradvance-hero-beszerzesi.mp4', poster: '/caradvance-hero-beszerzesi-poster.jpg',
      cta1: ['Request a car search', '#ajanlat'], cta2: ['Calculate registration tax', 'regtax'],
      breadcrumb: 'Car import from Germany',
      service: 'Car import from Germany to Hungary',
      secs: [
        {
          kicker: 'Why Germany', h2: 'Why buy a car in Germany',
          cards: [
            ['Huge choice', 'Many times the Hungarian offer — especially well-equipped premium models.'],
            ['Better condition', 'German cars typically have a documented service history and fewer hidden defects.'],
            ['German prices', 'Private buyers can buy from Caradvance GmbH with 19% German VAT.'],
          ],
        },
        {
          kicker: 'Our service', h2: 'What we do for you',
          steps: [
            ['Search & selection', 'We search the whole German market (e.g. mobile.de, AutoScout24) according to your wishes.'],
            ['History check', 'We check the car in international databases — accident history, mileage, origin.'],
            ['On-site inspection', 'Our expert inspects the car on site before you decide.'],
            ['Negotiation & purchase', 'We negotiate in German on your behalf and handle the contract.'],
            ['Insured transport', 'Professional transport to Hungary with high-value insurance.'],
            ['Hungarian registration', 'Originality inspection, technical inspection, registration tax (NAV), plates and documents.'],
            ['Handover', 'You receive the car ready to drive, registered in your name, with a 1-year warranty for private buyers.'],
          ],
        },
        {
          kicker: 'Costs', h2: 'What does importing a car from Germany cost?',
          p: ['The final price consists of the purchase price and the import costs. We give you an itemised calculation before you commit — no hidden costs.'],
          table: {
            head: ['Item', 'Depends on'],
            rows: [
              ['Purchase price', 'The car — private buyers can pay 19% German VAT'],
              ['Transport', 'Distance and car — itemised in the offer'],
              ['Registration tax', 'Power (kW), environmental class and age — 0 Ft for electric cars'],
              ['Transfer duty', 'kW × rate depending on age — 0 Ft for electric cars'],
              ['Inspections & documents', 'Originality inspection 22,950–27,000 Ft, technical inspection, certificate + title 12,000 Ft, plates'],
              ['Our service fee', 'Fixed in advance'],
            ],
          },
          links: [['Calculate the registration tax', 'regtax']],
        },
        {
          kicker: 'New or used', h2: 'New cars to order, or used cars from the German market',
          p: [
            'Looking for a <strong>new car</strong>? We order BMW, MINI, Mercedes-Benz and Audi models configured to your specification at German prices. Looking for a <strong>used car</strong>? We find well-documented cars on the German market and check them before purchase.',
            'Typical lead time for a used car is 5–14 days from selection to handover, depending on the car and the registration appointments.',
          ],
          links: [['New car configurator (in Hungarian)', '/egyedi-auto-rendeles/'], ['Cars in stock (in Hungarian)', '/autoink/']],
        },
      ],
      faq: [
        ['How long does it take to import a car from Germany to Hungary?', 'For a used car typically 5–14 days from selection to handover with Hungarian plates, depending on the car and the inspection appointments. New cars depend on the factory delivery time.'],
        ['Can I buy with German VAT as a private person?', 'Yes. Private individuals can buy from Caradvance GmbH with 19% German VAT instead of the Hungarian 27%. We explain the details for your specific car in the offer.'],
        ['Do I need to travel to Germany?', 'No. We search, inspect, buy and transport the car — you do not need to travel.'],
        ['Is the imported car covered by a warranty?', 'Private buyers receive a 1-year warranty, and we help with insurance (KGFB and casco).'],
        ['Can the imported car be financed?', 'Yes. Imported cars can be financed or leased through our Hungarian partners, for private individuals and companies.'],
      ],
      formInterest: 'import',
    },

    regtax: {
      title: 'Hungary Registration Tax Calculator 2026 – Register a Foreign Car',
      desc: 'Free Hungarian registration tax calculator (regisztrációs adó) based on the official 2026 NAV tables: tax, transfer duty and fees for registering a foreign car in Hungary — explained in English.',
      kicker: 'Registering a foreign car in Hungary',
      h1: 'Hungary registration tax calculator —<br><span class="accent">the total cost in one minute</span>',
      sub: 'Moving to Hungary with your car, or importing one? Calculate the Hungarian registration tax (regisztrációs adó), the transfer duty and the official fees with the 2026 NAV tables — then let us handle the registration.',
      video: '/caradvance-hero-beszerzesi.mp4', poster: '/caradvance-hero-beszerzesi-poster.jpg',
      cta1: ['Calculate now', '#kalkulator'], cta2: ['Let us register your car', '#ajanlat'],
      breadcrumb: 'Registration tax calculator',
      service: 'Registration of foreign cars in Hungary',
      secs: [
        {
          kicker: 'How it works', h2: 'How the Hungarian registration tax is calculated',
          p: [
            'Since 1 March 2025 the registration tax is based on the car’s <strong>engine power (kW)</strong> and its <strong>environmental class</strong>. The base amount is reduced by an <strong>age multiplier</strong> — the more months have passed since the first registration abroad, the lower the tax. Fully electric (5E) and zero-emission (5Z) cars are exempt; plug-in hybrids pay the lowest rate.',
            'The tax is set by the Hungarian tax authority (NAV) in a formal decision, and payment is a condition of registration. On top of it come the transfer duty, the originality and technical inspections, documents and number plates.',
          ],
        },
        {
          kicker: 'The process', h2: 'Registering a foreign car in Hungary — step by step',
          steps: [
            ['Originality inspection', 'Check of the identification numbers and documents at an authorised station.'],
            ['Technical inspection', 'Inspection for registration; a Hungarian technical data sheet is issued.'],
            ['Registration tax', 'Determined and collected by NAV, based on power, class and age.'],
            ['Registration', 'Transfer duty, insurance, Hungarian registration certificate, title and plates at the government office.'],
          ],
          note: 'If you live in Hungary, using a foreign-registered car is restricted — in most cases it has to be registered here. We check your situation and handle the whole process for you.',
          links: [['Detailed guide in Hungarian', '/blog/regisztracios-ado-2026/']],
        },
      ],
      faq: [
        ['How much is the registration tax in Hungary in 2026?', 'It depends on engine power (kW), environmental class and age. The base amount ranges from 47,000 Ft to several million forints, and the age multiplier can reduce it by up to 90%. Use the calculator above for your car.'],
        ['Do electric cars pay registration tax in Hungary?', 'No. Fully electric (5E) and zero-emission (5Z) passenger cars are exempt. Plug-in hybrids are taxable but fall into the most favourable column.'],
        ['What else do I pay when registering a foreign car?', 'Transfer duty (kW × rate depending on age), the originality inspection (22,950–27,000 Ft by engine size), the technical inspection, the registration certificate and title (12,000 Ft) and the number plates.'],
        ['Who sets the final amount?', 'The Hungarian tax authority (NAV) determines the registration tax in a formal decision. Our calculator gives a reliable estimate based on the official 2026 tables.'],
        ['Can you register my car for me?', 'Yes. We handle the inspections, the NAV procedure and the government office, and hand the car back with Hungarian plates and documents.'],
      ],
      formInterest: 'regtax',
    },

    contact: {
      title: 'Contact CarAdvance – English-Speaking Car Service near Budapest',
      desc: 'Contact CarAdvance in English: long-term car rental, car import from Germany and car registration in Hungary. Office near Budapest, phone +36 30 233 6060, info@caradvance.hu.',
      kicker: 'Contact',
      h1: 'Talk to us —<br><span class="accent">in English</span>',
      sub: 'Questions about long-term rental, importing a car or registering your car in Hungary? Call, write on WhatsApp or send the form — we usually reply the same working day.',
      video: '/caradvance-hero-x5.mp4', poster: '/caradvance-hero-x5-poster.jpg',
      cta1: ['Send a message', '#ajanlat'], cta2: ['Call +36 30 233 6060', 'tel:+36302336060'],
      breadcrumb: 'Contact',
      secs: [
        {
          kicker: 'Get in touch', h2: 'How to reach us',
          cards: [
            ['Phone & WhatsApp', '<a href="tel:+36302336060">+36 30 233 6060</a> · <a href="https://wa.me/36302336060" target="_blank" rel="noopener">WhatsApp</a>'],
            ['E-mail', '<a href="mailto:info@caradvance.hu">info@caradvance.hu</a>'],
            ['Office near Budapest', 'BH Group Zrt. · 2083 Solymár, Ibolya utca 18. · Mon–Fri 9:00–17:00'],
          ],
        },
        {
          kicker: 'Who we are', h2: 'The companies behind CarAdvance',
          p: [
            '<strong>Caradvance GmbH</strong> — Bgm-Graf-Ring 21, 82538 Geretsried, Germany. Seller and lessor; your contracts and invoices are issued by Caradvance GmbH.',
            '<strong>BH Group Zrt.</strong> — the Hungarian representative of Caradvance GmbH. Our Hungarian team handles customer contact, transport from Germany, registration and paperwork.',
          ],
        },
      ],
      faq: [
        ['Which languages do you speak?', 'English, German, French and Hungarian.'],
        ['When are you available?', 'Monday to Friday, 9:00–17:00. Messages sent outside office hours are answered on the next working day.'],
        ['Can I visit the office?', 'Yes, by appointment — our office is in Solymár, just outside Budapest.'],
      ],
      formInterest: 'other',
    },
  },
};

export default en;
