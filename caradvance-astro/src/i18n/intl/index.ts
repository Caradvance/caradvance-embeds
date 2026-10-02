import type { IntlContent, PageKey } from './types';
import map from '../intl-map.json';
import en from './en';
import de from './de';
import fr from './fr';
import uk from './uk';
import zh from './zh';

// Az elkészült nyelvek tartalma. Új nyelv: fájl + import + ide felvenni.
export const CONTENT: Partial<Record<string, IntlContent>> = { en, de, fr, uk, zh };

export const INTL_MAP = map as { live: string[]; pages: Record<PageKey, Record<string, string>> };
export const PAGE_KEYS = Object.keys(INTL_MAP.pages) as PageKey[];

export function contentFor(lang: string): IntlContent | undefined { return CONTENT[lang]; }
export function pathFor(key: PageKey, lang: string): string { return INTL_MAP.pages[key][lang]; }
export function slugFor(key: PageKey, lang: string): string {
  return pathFor(key, lang).replace(/^\/[a-z]{2}\//, '').replace(/\/$/, '');
}
export function keyForPath(path: string): PageKey | undefined {
  const p = path.endsWith('/') ? path : path + '/';
  return PAGE_KEYS.find((k) => Object.values(INTL_MAP.pages[k]).includes(p));
}
/** cél feloldása: oldal-kulcs ('rental') → az adott nyelvű URL; '#...', '/...', 'tel:' marad */
export function resolveHref(target: string, lang: string): string {
  if ((INTL_MAP.pages as any)[target]) return pathFor(target as PageKey, lang);
  return target;
}
export function isLive(lang: string): boolean { return INTL_MAP.live.includes(lang); }
