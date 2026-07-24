import { defineConfig } from 'astro/config';

// Site-wide config. The i18n block gives us real language routing:
//   hu  -> served at the root (/, /eladom, ...)
//   en  -> /en/, /en/eladom, ...  and the same for de, fr, sk, cs, pl, uk, zh
export default defineConfig({
  site: 'https://caradvance.hu',
  // We don't use code blocks; disabling syntax highlighting avoids loading shiki.
  markdown: { syntaxHighlight: false },
  i18n: {
    defaultLocale: 'hu',
    locales: ['hu', 'en', 'de', 'fr', 'sk', 'cs', 'pl', 'uk', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
