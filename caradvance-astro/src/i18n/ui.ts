// ── Language config ──────────────────────────────────────────────
// All 9 locales the site routes for. Order = order shown in switcher.
export const localeList = ['hu', 'en', 'de', 'fr', 'sk', 'cs', 'pl', 'uk', 'zh'] as const;
export type Locale = (typeof localeList)[number];
export const defaultLang: Locale = 'hu';

// Human names + flag codes (flagcdn.com) for the language switcher.
export const languageNames: Record<Locale, string> = {
  hu: 'Magyar', en: 'English', de: 'Deutsch', fr: 'Français',
  sk: 'Slovenčina', cs: 'Čeština', pl: 'Polski', uk: 'Українська', zh: '中文',
};
export const flagCode: Record<Locale, string> = {
  hu: 'hu', en: 'gb', de: 'de', fr: 'fr', sk: 'sk', cs: 'cz', pl: 'pl', uk: 'ua', zh: 'cn',
};

// ── Translation dictionary ───────────────────────────────────────
// hu is the complete baseline. Any locale that is missing a key falls
// back to hu (see src/i18n/utils.ts). Fill the other locales in here
// (or wire them to your Google Sheet) to translate the whole site.
export const ui = {
  hu: {
    'nav.rental': 'Prémium autóbérlés',
    'nav.buy': 'Megvásárolható autóink',
    'nav.consign': 'Bizományos értékesítés',
    'nav.import': 'Import',
    'nav.about': 'Rólunk',
    'nav.contact': 'Kapcsolat',

    'home.title': 'Prémium autók Németországból',
    'home.sub': 'Prémium autóbérlés és eladás, autóimport Németországból — a te autódat pedig bizományban eladjuk.',
    'home.cta1': 'Kérj ajánlatot',
    'home.cta2': 'Add el az autód',

    'eladom.title1': 'Eladjuk az autódat — profin, gyorsan,',
    'eladom.title2': 'egy jó ügyért',
    'eladom.sub': 'Profi fotó és videó, nagy elérés a Használtautó.hu-n és teljes ügyintézés. Te csak átadod az autót — a többit mi intézzük, és minden eladásból egy magyar jótékony szervezetet is támogatunk.',
    'eladom.cta': 'Eladnám az autóm',
    'pill.charity': 'Jótékonyság',
    'pill.why': 'Miért velünk?',
    'pill.media': 'Fotó és videó',
    'pill.alone': 'Egyedül vagy velünk?',
    'pill.how': 'Hogyan működik?',
    'pill.team': 'Csapatunk',
    'pill.faq': 'GYIK',

    'foot.tagline': 'Prémium autók Németországból — bérlés, megvásárolható autók, import és bizományos értékesítés.',
    'foot.menu': 'Menü',
    'foot.contact': 'Kapcsolat',
  },

  // Fully translated example. Others fall back to hu until filled.
  en: {
    'nav.rental': 'Premium car rental',
    'nav.buy': 'Cars for sale',
    'nav.consign': 'Consignment sales',
    'nav.import': 'Import',
    'nav.about': 'About us',
    'nav.contact': 'Contact',

    'home.title': 'Premium cars from Germany',
    'home.sub': 'Premium car rental and sales, car import from Germany — and we sell your car on consignment.',
    'home.cta1': 'Request a quote',
    'home.cta2': 'Sell your car',

    'eladom.title1': 'We sell your car — professionally, fast,',
    'eladom.title2': 'for a good cause',
    'eladom.sub': 'Professional photos and video, wide reach on the biggest platforms, and full paperwork handled. You just hand over the car — we take care of the rest, and every sale supports a Hungarian charity.',
    'eladom.cta': 'I want to sell my car',
    'pill.charity': 'Charity',
    'pill.why': 'Why us?',
    'pill.media': 'Photo & video',
    'pill.alone': 'Alone or with us?',
    'pill.how': 'How it works',
    'pill.team': 'Our team',
    'pill.faq': 'FAQ',

    'foot.tagline': 'Premium cars from Germany — rental, cars for sale, import and consignment sales.',
    'foot.menu': 'Menu',
    'foot.contact': 'Contact',
  },
} as const;

export type UIKey = keyof (typeof ui)['hu'];
