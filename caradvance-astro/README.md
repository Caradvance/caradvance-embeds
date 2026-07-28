# CarAdvance — Astro rebuild (scaffold)

A working Astro foundation for the site, proving the architecture that solves the two
problems we kept hitting: **duplicated nav/footer** and **no real multi-language support**.

It builds to plain static HTML, so it runs on GitHub Pages *or* Cloudflare Pages.

## What already works

- **One shared nav + footer.** Defined once in `src/components/Nav.astro` and
  `Footer.astro`, included on every page via `src/layouts/Base.astro`. Change them once →
  every page (and every language) updates. No more editing 250 files.
- **Real 9-language routing.** `hu` at the root (`/`, `/eladom`), the other 8 at
  `/en/`, `/de/`, `/fr/`, `/sk/`, `/cs/`, `/pl/`, `/uk/`, `/zh/`. Configured in
  `astro.config.mjs`.
- **`hreflang` on every page** (all 9 locales + `x-default`) — the piece Google needs to
  index and rank each language version. Generated automatically by `src/components/Hreflang.astro`.
- **Two pages ported:** the home hero and the Eladom hero, both fed from a translation
  dictionary. `hu` and `en` are fully translated; the other 7 locales currently fall back to
  Hungarian until you fill them in.

A production build generates 18 pages today (2 pages × 9 locales) and grows automatically as
you add pages.

## Project structure

```
astro.config.mjs          site + i18n config (the 9 locales live here)
src/
  i18n/ui.ts              translation dictionary — ALL text lives here, per locale
  i18n/utils.ts           t(lang) translator + localizedPath() URL helper
  layouts/Base.astro      <html> shell: head, hreflang, nav, footer, page slot
  components/
    Nav.astro             the shared top nav + language switcher
    Footer.astro          the shared footer
    Hreflang.astro        emits the hreflang alternate links
    Home.astro            home hero
    Eladom.astro          Eladom hero (other sections drop in here the same way)
  pages/
    index.astro           /            (hu home)
    eladom.astro          /eladom      (hu Eladom)
    [lang]/index.astro    /en, /de …   (home for the other 8 locales)
    [lang]/eladom.astro   /en/eladom … (Eladom for the other 8 locales)
```

## Run it locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs static site to dist/
```

(If you ever see a `shiki` error on a fresh install, just run `npm install shiki` once — it's
a code-highlighter dependency Astro pulls in; unrelated to the site.)

## How to translate the whole site

Open `src/i18n/ui.ts`. `hu` is the complete baseline. Add the other locales' strings there
(or wire this file to your Google Sheet so translations come from the sheet like your car data
does). Any key you don't translate falls back to Hungarian, so nothing ever breaks.

## How to add pages / sections

Each section becomes a small `.astro` component that reads text with `t(lang)` and gets dropped
into a page. The nav, footer, i18n, and hreflang apply to it automatically. Porting the rest of
the Eladom page (jótékonyság, miért velünk, comparison table, hét lépés, fotó/videó) is exactly
this mechanical step.

## Deploy to Cloudflare Pages (preview first)

This is a *build* project (unlike your current prebuilt-HTML repo), so the Pages settings differ:

| Setting | Value |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 18+ (env var `NODE_VERSION=20` if needed) |

Put this in a **new repo or a branch** and point a Cloudflare Pages project at it. Cloudflare
gives every branch its own preview URL, so you can review the whole thing before it ever touches
`caradvance.hu`. Nothing here affects your live site or email.

## Notes

- Images/video currently load from `https://caradvance.hu/…` (your existing assets). For a fully
  self-contained build, drop them into `public/` and switch the paths to `/…`.
- This scaffold intentionally ports 2 pages to prove the pattern end-to-end. The remaining ~26
  pages follow the same structure.


<!-- build: refresh www after sheet-driven rebuild (2026-07-28) -->

<!-- build refresh: nav links + side images + Uj label -->

<!-- build: carousel + live FX endpoint -->
