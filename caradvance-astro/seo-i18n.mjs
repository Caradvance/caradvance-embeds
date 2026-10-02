#!/usr/bin/env node
/**
 * seo-i18n.mjs — többnyelvű hreflang-klaszterek (2026-10)
 *
 * A src/i18n/intl-map.json alapján minden lefordított oldal-csoportra
 * (pl. /auto-rendeles/ ↔ /en/car-import-from-germany/ ↔ …) a csoport ÖSSZES
 * élő oldalán kicseréli a hreflang linkeket a teljes klaszterre:
 *   hu + az élő nyelvek + x-default (= magyar).
 * Csak létező (dist-ben megtalálható) oldalra mutat. Az élő idegen nyelvű oldalak
 * canonicalját és og:locale-ját is rendbe teszi.
 * Idempotens. Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.caradvance.hu';
const OG = { hu: 'hu_HU', en: 'en_GB', de: 'de_DE', fr: 'fr_FR', uk: 'uk_UA', zh: 'zh_CN' };
const HREFLANG = { hu: 'hu', en: 'en', de: 'de', fr: 'fr', uk: 'uk', zh: 'zh-Hans' };

const fileOf = (p) => path.join(DIST, p.replace(/^\//, ''), 'index.html');

try {
  const M = JSON.parse(fs.readFileSync('src/i18n/intl-map.json', 'utf8'));
  const langs = ['hu', ...M.live];
  let groups = 0, files = 0;
  for (const key of Object.keys(M.pages)) {
    const g = M.pages[key];
    const members = langs.filter((l) => g[l] && fs.existsSync(fileOf(g[l])));
    if (members.length < 2) continue;              // nincs mit összekötni
    groups++;
    const block = members.map((l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE}${g[l]}">`).join('\n')
      + (members.includes('hu') ? `\n<link rel="alternate" hreflang="x-default" href="${SITE}${g.hu}">` : '');
    for (const l of members) {
      const f = fileOf(g[l]);
      let h = fs.readFileSync(f, 'utf8');
      h = h.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>\s*\n?/g, '');
      h = h.replace(/<\/head>/i, block + '\n</head>');
      if (l !== 'hu') {
        const canon = `<link rel="canonical" href="${SITE}${g[l]}">`;
        h = /<link rel="canonical"[^>]*>/i.test(h) ? h.replace(/<link rel="canonical"[^>]*>/i, canon) : h.replace(/<\/head>/i, canon + '\n</head>');
        const og = `<meta property="og:locale" content="${OG[l]}">`;
        h = /<meta property="og:locale"[^>]*>/i.test(h) ? h.replace(/<meta property="og:locale"[^>]*>/i, og) : h.replace(/<\/head>/i, og + '\n</head>');
        // Open Graph / Twitter: ha hiányzik, a <title>-ből, a leírásból és a hero posterből pótoljuk
        if (!/<meta property="og:title"/i.test(h)) {
          const t = (h.match(/<title>([^<]*)<\/title>/i) || [, ''])[1];
          const d = (h.match(/<meta name="description" content="([^"]*)"/i) || [, ''])[1];
          const img = (h.match(/<video[^>]*poster="([^"]+)"/i) || [, '/caradvance-hero-x5-poster.jpg'])[1];
          const abs = img.startsWith('http') ? img : SITE + img;
          const tags = [`<meta property="og:type" content="website">`, `<meta property="og:site_name" content="CarAdvance">`,
            `<meta property="og:title" content="${t}">`, `<meta property="og:description" content="${d}">`,
            `<meta property="og:url" content="${SITE}${g[l]}">`, `<meta property="og:image" content="${abs}">`,
            `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${t}">`,
            `<meta name="twitter:description" content="${d}">`, `<meta name="twitter:image" content="${abs}">`].join('\n');
          h = h.replace(/<\/head>/i, tags + '\n</head>');
        }
      }
      fs.writeFileSync(f, h);
      files++;
    }
  }
  console.log(`[i18n] ${groups} oldalcsoport, ${files} fájl hreflang-klaszterrel · élő nyelvek: hu, ${M.live.join(', ')}`);
} catch (e) {
  console.log('[i18n] FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
