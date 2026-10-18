/**
 * CarAdvance — országfüggő árak (Cloudflare Pages middleware)
 *
 * Magyarország és az USA (a Google innen indexel) látogatói az oldalt árakkal kapják.
 * Minden más ország látogatója ugyanazon az URL-en az ár nélküli változatot kapja
 * (a build által készített dist/_np/… másolat), az árak a forráskódban sincsenek benne.
 *
 * Munkatársi kivétel: a ?ca_pv=<kód> link egyszer megnyitva egy évre süti-t állít,
 * azzal külföldről is látszanak az árak.  ?ca_pv=off  — kikapcsolja.
 * A kódot itt csak hash formában tároljuk (a repó nyilvános).
 */
import { priceAllowed, sha, T_HASH, COOKIE } from '../lib/geo.js';

function withHeaders(res, extra) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

export async function onRequest(context) {
  try {
    return await handle(context);
  } catch (e) {
    // Bármilyen hiba esetén az eredeti oldal megy ki — a magyar látogatót soha nem akaszthatja meg.
    return context.next();
  }
}

// Megszűnt "Új autó bérlése" (/uj-auto-berlese/): 301 a bérlési oldalakra (térkép: src/data/ujRedirects.json)
const UJ_MAP = {"audi-a3":"audi-a3-sportback","audi-a6":"audi-a6-avant","audi-q5":"audi-q5-sportback","bmw-3-as-limuzin":"bmw-3-as-limuzin","bmw-4-es-coupe":"bmw-4-es-coupe","bmw-5-os-limuzin":"bmw-5-os-limuzin","bmw-5-os-touring":"bmw-5-os-touring","bmw-x1":"bmw-x1","bmw-x3":"bmw-x3","bmw-x5":"bmw-x5","bmw-x6":"bmw-x6","mercedes-amg-c-osztaly-limuzin":"mercedes-benz-c-osztaly","mercedes-amg-c-osztaly-t-modell":"mercedes-benz-c-osztaly","mercedes-c-osztaly-limuzin":"mercedes-benz-c-osztaly","mercedes-c-osztaly-t-modell":"mercedes-benz-c-osztaly","mercedes-amg-e-osztaly-limuzin":"mercedes-benz-e-osztaly-limuzin","mercedes-amg-e-osztaly-t-modell":"mercedes-benz-e-osztaly-limuzin","mercedes-e-osztaly-limuzin":"mercedes-benz-e-osztaly-limuzin","mercedes-e-osztaly-t-modell":"mercedes-benz-e-osztaly-limuzin","mercedes-gla":"mercedes-benz-gla","mercedes-glb":"mercedes-benz-glb","mercedes-glc":"mercedes-benz-glc","mercedes-glc-coupe":"mercedes-benz-glc-coupe","mercedes-gle":"mercedes-benz-gle","mercedes-gle-coupe":"mercedes-benz-gle-coupe","mini-cooper-3-ajtos":"mini-cooper","mini-cooper-5-ajtos":"mini-cooper","mini-john-cooper-works":"mini-cooper","mini-cooper-cabrio":"mini-cooper-cabrio","mini-countryman":"mini-countryman","audi-q7":"audi-q7","bmw-3-as-touring":"bmw-3-as-touring","bmw-m2-coupe":"bmw-m2-coupe","bmw-m3-limuzin":"bmw-m3-limuzin","bmw-m3-touring":"bmw-m3-touring","bmw-m4-coupe":"bmw-m4-coupe","bmw-m5-limuzin":"bmw-m5-limuzin","bmw-m5-touring":"bmw-m5-touring","mercedes-a-osztaly":"mercedes-a-osztaly","mercedes-amg-cle-coupe":"mercedes-amg-cle-coupe","mercedes-b-osztaly":"mercedes-b-osztaly","mercedes-cle-cabrio":"mercedes-cle-cabrio","mercedes-cle-coupe":"mercedes-cle-coupe","mercedes-s-osztaly":"mercedes-s-osztaly"};
const UJ_LANDING = { en: '/en/car-rental-budapest/', de: '/de/auto-mieten-budapest/', fr: '/fr/location-voiture-budapest/', uk: '/uk/orenda-avto-budapesht/', zh: '/zh/budapest-car-rental/' };
function ujRedirect(url) {
  const m = url.pathname.match(/^(?:\/(en|de|fr|uk|zh|sk|cs))?\/uj-auto-berlese(?:\/([a-z0-9-]+))?\/?$/);
  if (!m) return null;
  const l = m[1] || '', pre = l ? '/' + l : '';
  let to;
  if (m[2] && UJ_MAP[m[2]]) to = pre + '/berelheto-auto/' + UJ_MAP[m[2]] + '-berles/';
  else to = l ? (UJ_LANDING[l] || pre + '/autoink/') : '/autoink/#berelheto';
  return new Response(null, { status: 301, headers: { Location: new URL(to, url.origin).toString(), 'Cache-Control': 'public, max-age=3600' } });
}

// Saját domainek: caradvance.sk → dist/sk/… , caradvance.cz → dist/cs/… (a build i18n-mirror.mjs lépése készíti)
const DOMAINS = { 'caradvance.sk': 'sk', 'www.caradvance.sk': 'sk', 'caradvance.cz': 'cs', 'www.caradvance.cz': 'cs' };
const HU_SITE = 'https://www.caradvance.hu';
const LANG_SITE = { sk: 'https://www.caradvance.sk', cs: 'https://www.caradvance.cz' };
// true = a caradvance.hu/sk/… és /cs/… címek 301-gyel a saját domainre mennek (csak ha a domainek már élnek!)
const SKCZ_REDIRECT = true;
/** Abszolút caradvance.hu/sk|cs URL → saját domain (canonical, hreflang, og:url, linkek). */
function toLangSite(v) {
  const m = /^https:\/\/(?:www\.)?caradvance\.hu\/(sk|cs)(\/.*)?$/.exec(v);
  return m ? LANG_SITE[m[1]] + (m[2] || '/') : v;
}

// Régi (magyar) cím → szlovák/cseh cím: a build (skcz-slugs.mjs) írja ki a dist/sk|cs/_slugs.json fájlba
const SLUGS = {};
async function slugMap(env, l, origin) {
  if (SLUGS[l]) return SLUGS[l];
  try {
    const r = await env.ASSETS.fetch(new Request(new URL('/' + l + '/_slugs.json', origin).toString()));
    SLUGS[l] = r.status === 200 ? await r.json() : {};
  } catch (e) { SLUGS[l] = {}; }
  return SLUGS[l];
}
function locOf(map, p) { const q = p.endsWith('/') ? p : p + '/'; return map[q] || null; }

async function serveDomain(context, url, l) {
  const { request, env, next } = context;
  const p = url.pathname;
  if (!url.hostname.startsWith('www.')) { url.hostname = 'www.' + url.hostname; return Response.redirect(url.toString(), 301); }
  if (p.startsWith('/api/')) return next();
  { const ur = ujRedirect(url); if (ur) return ur; }
  const pre = '/' + l + '/';
  if (p === '/' + l || p.startsWith(pre)) {
    const rest = p.slice(l.length + 1) || '/';
    url.pathname = locOf(await slugMap(env, l, url.origin), rest) || rest;
    return Response.redirect(url.toString(), 301);
  }
  if (p === '/robots.txt' || p === '/sitemap.xml') return env.ASSETS.fetch(new Request(new URL('/' + l + p, url.origin).toString()));
  if (/\.[a-z0-9]{1,5}$/i.test(p)) return next();                  // közös fájlok: képek, js, css, videó
  if (!p.endsWith('/')) { url.pathname = p + '/'; return Response.redirect(url.toString(), 301); }
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const r = await env.ASSETS.fetch(new Request(new URL('/' + l + p, url.origin).toString(), { method: request.method }));
  if (r.status !== 200) {
    const loc = locOf(await slugMap(env, l, url.origin), p);           // régi magyar cím → új cím
    if (loc && loc !== p) { url.pathname = loc; return Response.redirect(url.toString(), 301); }
    return Response.redirect(new URL('/', url.origin).toString(), 302);
  }
  const isFileUrl = (v) => /\.[a-z0-9]{1,5}$/i.test(v.split(/[?#]/)[0]);
  class Fix {
    constructor(a) { this.a = a; }
    element(e) {
      const v = e.getAttribute(this.a); if (!v) return;
      let n = v;
      if (v.startsWith(pre)) n = v.slice(l.length + 1);
      else if (v === '/' + l) n = '/';
      else if (/^\/(sk|cs)(\/|$)/.test(v)) n = toLangSite(HU_SITE + v);                  // a másik saját domain
      else if (v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/api/') && !isFileUrl(v)) n = HU_SITE + v; // magyar / más nyelvű oldal
      else if (/^https:\/\/(?:www\.)?caradvance\.hu\/(sk|cs)(\/|$)/.test(v)) n = toLangSite(v); // abszolút .hu/sk|cs
      if (n !== v) e.setAttribute(this.a, n);
    }
  }
  const abs = (a) => ({ element(e) { const v = e.getAttribute(a); if (v) { const n = toLangSite(v); if (n !== v) e.setAttribute(a, n); } } });
  const out = new HTMLRewriter()
    .on('a[href]', new Fix('href')).on('form[action]', new Fix('action'))
    .on('link[href]', abs('href'))                                   // canonical, hreflang alternate
    .on('meta[content]', abs('content'))                             // og:url
    .transform(r);
  return withHeaders(out, { 'X-CA-Domain': l, 'Cache-Control': 'public, max-age=0, must-revalidate' });
}

async function handle(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const p = url.pathname;

  const dl = DOMAINS[url.hostname];
  if (dl) return serveDomain(context, url, dl);
  if (SKCZ_REDIRECT && /(^|\.)caradvance\.hu$/.test(url.hostname)) {
    const lm = /^\/(sk|cs)(\/.*)?$/.exec(p);
    if (lm) {
      const rest = lm[2] || '/';
      const loc = /\.[a-z0-9]{1,5}$/i.test(rest) ? rest : (locOf(await slugMap(env, lm[1], url.origin), rest) || rest);
      return new Response(null, { status: 301, headers: { Location: LANG_SITE[lm[1]] + loc + url.search, 'Cache-Control': 'public, max-age=3600' } });
    }
  }
  { const ur = ujRedirect(url); if (ur) return ur; }

  if (p.startsWith('/api/')) return next();
  if (p.startsWith('/_np/')) return withHeaders(await next(), { 'X-Robots-Tag': 'noindex, nofollow' });

  // Munkatársi kivétel be/ki
  const tok = url.searchParams.get('ca_pv');
  if (tok !== null) {
    url.searchParams.delete('ca_pv');
    const loc = url.pathname + (url.search || '');
    if (tok === 'off') {
      return new Response(null, { status: 302, headers: { Location: loc, 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`, 'Cache-Control': 'no-store' } });
    }
    if ((await sha(tok)) === T_HASH) {
      const k = await sha(tok + '|cookie');
      return new Response(null, { status: 302, headers: { Location: loc, 'Set-Cookie': `${COOKIE}=${k}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`, 'Cache-Control': 'no-store' } });
    }
  }

  // ?ca_np=1 — előnézet: így látja egy külföldi látogató (teszteléshez; árat nem fed fel)
  const preview = url.searchParams.get('ca_np') === '1';
  if (!preview && (await priceAllowed(request))) {
    const r = await next();
    return withHeaders(r, { 'Vary': 'Cookie' });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  // Ár nélküli változat keresése: /x/ → /_np/x/ ; /rent-data.js → /_np/rent-data.js
  const isFile = /\.[a-z0-9]{1,5}$/i.test(p);
  if (!isFile && !p.endsWith('/')) return next(); // a Pages előbb a perjeles URL-re irányít
  const npUrl = new URL('/_np' + p, url.origin);
  try {
    const r = await env.ASSETS.fetch(new Request(npUrl.toString(), { method: request.method }));
    if (r.status === 200) {
      return withHeaders(r, { 'Cache-Control': 'private, no-store', 'X-CA-NP': '1', 'Vary': 'Cookie' });
    }
  } catch (e) { /* ha nincs változat, megy az eredeti */ }
  return next();
}
