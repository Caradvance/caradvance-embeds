// ─────────────────────────────────────────────────────────────
//  CarAdvance — idegen nyelvű oldalak (külföldiek Magyarországon)
//  Egy nyelv = egy fájl (en.ts, de.ts, …). Az oldal-URL-ek az
//  intl-map.json-ban vannak; itt csak a tartalom.
// ─────────────────────────────────────────────────────────────
export type PageKey = 'home' | 'rental' | 'import' | 'regtax' | 'contact';

export type Section = {
  id?: string;
  kicker?: string;
  h2: string;
  lead?: string;
  p?: string[];                       // bekezdések (HTML engedett: <strong>, <a>)
  ul?: string[];                      // felsorolás
  cards?: [string, string][];         // [cím, szöveg]
  steps?: [string, string][];         // számozott lépések
  table?: { head: string[]; rows: string[][] };
  note?: string;
  links?: [string, PageKey | string][]; // gombok: [felirat, oldal-kulcs vagy URL]
};

export type Page = {
  title: string;         // <title>
  desc: string;          // meta description
  kicker: string;
  h1: string;            // HTML: <span class="accent">…</span> engedett
  sub: string;
  video: string;         // hero videó (public/)
  poster: string;
  cta1: [string, PageKey | string];
  cta2?: [string, PageKey | string];
  secs: Section[];
  faq: [string, string][];
  formInterest?: 'rental' | 'import' | 'regtax' | 'other';
  service?: string;      // schema.org Service név
  breadcrumb: string;    // a kenyérmorzsa felirata
};

export type CalcStrings = {
  h2: string; lead: string;
  cls: string; clsHint: string; clsOpts: [string, string, string, string, string, string]; // 1..5, 0 (EV)
  power: string; powerHint: string; hp: string;
  cc: string; ccOpts: [string, string, string];
  kind: string; used: string; newHu: string; newHint: string;
  firstReg: string; procStart: string; procHint: string;
  months: string[];
  total: string; band: string; base: string; elapsed: string; monthsUnit: string; mult: string; reduction: string;
  regtax: string; duty: string; dutyExempt: string; origin: string; docs: string; sum: string;
  exempt: string; disc: string; cta: string;
};

export type Ui = {
  htmlLang: string;      // <html lang>
  ogLocale: string;
  nav: {
    services: string; rental: string; import: string; regtax: string;
    cars: string; carsAvail: string; carsNew: string;
    company: string; contact: string; hu: string;
  };
  common: { call: string; whatsapp: string; email: string; inHu: string; home: string; office: string; hours: string };
  trust: [string, string][];
  form: {
    h2: string; lead: string; name: string; email: string; phone: string; interest: string;
    interests: { rental: string; import: string; regtax: string; other: string };
    msg: string; msgPh: string; consent: string; submit: string; sending: string; ok: string; err: string; need: string;
  };
  footer: { tagline: string; services: string; cars: string; company: string; legal: string; privacy: string; terms: string; imprint: string; cookies: string; rep: string; huSite: string };
  calc: CalcStrings;
  faqTitle: string;
};

export type IntlContent = { ui: Ui; pages: Record<PageKey, Page> };
