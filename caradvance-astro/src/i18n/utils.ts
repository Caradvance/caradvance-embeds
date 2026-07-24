import { ui, defaultLang, localeList, type Locale, type UIKey } from './ui';

// Returns a translator for the given locale. Missing keys fall back to hu,
// so a half-translated locale still renders (in Hungarian) instead of breaking.
export function useTranslations(lang: Locale) {
  const base = ui[defaultLang];
  const over = (ui as Record<string, Partial<typeof base>>)[lang] ?? {};
  const dict = { ...base, ...over };
  return (key: UIKey) => dict[key];
}

// Build a localized URL. hu stays at the root; others get an /<lang> prefix.
//   localizedPath('hu', '/eladom')  -> '/eladom'
//   localizedPath('de', '/eladom')  -> '/de/eladom'
export function localizedPath(lang: Locale, path: string): string {
  const clean = path === '/' ? '' : path;
  return lang === defaultLang ? (clean || '/') : `/${lang}${clean || ''}` || `/${lang}/`;
}

export { localeList, defaultLang };
export type { Locale };
