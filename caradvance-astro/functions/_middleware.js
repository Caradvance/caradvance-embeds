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

// Saját domainek: caradvance.sk → dist/sk/… , caradvance.cz → dist/cs/… (a build i18n-mirror.mjs lépése készíti)
const DOMAINS = { 'caradvance.sk': 'sk', 'www.caradvance.sk': 'sk', 'caradvance.cz': 'cs', 'www.caradvance.cz': 'cs' };
const HU_SITE = 'https://www.caradvance.hu';

async function serveDomain(context, url, l) {
  const { request, env, next } = context;
  const p = url.pathname;
  if (!url.hostname.startsWith('www.')) { url.hostname = 'www.' + url.hostname; return Response.redirect(url.toString(), 301); }
  if (p.startsWith('/api/')) return next();
  const pre = '/' + l + '/';
  if (p === '/' + l || p.startsWith(pre)) { url.pathname = p.slice(l.length + 1) || '/'; return Response.redirect(url.toString(), 301); }
  if (p === '/robots.txt' || p === '/sitemap.xml') return env.ASSETS.fetch(new Request(new URL('/' + l + p, url.origin).toString()));
  if (/\.[a-z0-9]{1,5}$/i.test(p)) return next();                  // közös fájlok: képek, js, css, videó
  if (!p.endsWith('/')) { url.pathname = p + '/'; return Response.redirect(url.toString(), 301); }
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const r = await env.ASSETS.fetch(new Request(new URL('/' + l + p, url.origin).toString(), { method: request.method }));
  if (r.status !== 200) return Response.redirect(new URL('/', url.origin).toString(), 302);
  const isFileUrl = (v) => /\.[a-z0-9]{1,5}$/i.test(v.split(/[?#]/)[0]);
  class Fix {
    constructor(a) { this.a = a; }
    element(e) {
      const v = e.getAttribute(this.a); if (!v) return;
      let n = v;
      if (v.startsWith(pre)) n = v.slice(l.length + 1);
      else if (v === '/' + l) n = '/';
      else if (v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/api/') && !isFileUrl(v)) n = HU_SITE + v; // magyar / más nyelvű oldal
      if (n !== v) e.setAttribute(this.a, n);
    }
  }
  const out = new HTMLRewriter().on('a[href]', new Fix('href')).on('form[action]', new Fix('action')).transform(r);
  return withHeaders(out, { 'X-CA-Domain': l, 'Cache-Control': 'public, max-age=0, must-revalidate' });
}

async function handle(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const p = url.pathname;

  const dl = DOMAINS[url.hostname];
  if (dl) return serveDomain(context, url, dl);

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
