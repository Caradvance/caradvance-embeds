// CarAdvance — ügyfélfiók (build utáni lépés, a seo-search.mjs után fut)
//  1. Minden oldal menüjébe a kereső gomb és a Kapcsolat közé betesz egy profil ikont (→ fiók oldal az oldal nyelvén).
//  2. Legenerálja a fiók oldalakat nyelvenként: /fiok/, /en/account/, /de/konto/, /fr/compte/, /uk/kabinet/, /zh/account/, /sk/ucet/, /cs/ucet/
//     (sablon: az ÁSZF oldal az adott nyelven — így a menü és a lábléc már le van fordítva). noindex.
// Hiba esetén sem állítja meg a buildet.
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const ROOT = path.resolve('dist');
const log = (...a) => console.log('[fiok]', ...a);
const ACCOUNT_PATH = { hu: '/fiok/', en: '/en/account/', de: '/de/konto/', fr: '/fr/compte/', uk: '/uk/kabinet/', zh: '/zh/account/', sk: '/sk/ucet/', cs: '/cs/ucet/' };
const LANGS = Object.keys(ACCOUNT_PATH);
const LABEL = { hu: 'Fiókom', en: 'My account', de: 'Mein Konto', fr: 'Mon compte', uk: 'Мій кабінет', zh: '我的账户', sk: 'Môj účet', cs: 'Můj účet' };
const PERSON = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="12" cy="8.2" r="3.9" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M4.6 20.2c.9-3.9 3.9-6.1 7.4-6.1s6.5 2.2 7.4 6.1" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>';

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };
const hash = async (f) => { try { return crypto.createHash('sha1').update(await readFile(path.join(ROOT, f))).digest('hex').slice(0, 10); } catch { return '0'; } };

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

function pageLang(html) {
  const m = html.match(/data-ca-search[^>]*data-lang="([a-z]{2})"/) || html.match(/<html[^>]*\blang="([a-z]{2})/i);
  const l = m ? m[1].toLowerCase() : 'hu';
  return ACCOUNT_PATH[l] ? l : 'hu';
}



try {
  const v = { css: await hash('fiok.css'), js: await hash('fiok-nav.js'), acss: await hash('fiok-app.css'), ajs: await hash('fiok-app.js'), i18n: await hash('fiok-i18n.js') };
  const HEAD = `<link rel="stylesheet" href="/fiok.css?v=${v.css}"><script src="/fiok-nav.js?v=${v.js}" defer></script>`;
  let navN = 0, files = 0;

  for await (const f of walk(ROOT)) {
    files++;
    let h = await readFile(f, 'utf8');
    if (!h.includes('class="ca-sbtn"') || h.includes('class="ca-pbtn"')) continue;
    const L = pageLang(h);
    const btn = `<a class="ca-pbtn" href="${ACCOUNT_PATH[L]}" aria-label="${esc(LABEL[L])}" title="${esc(LABEL[L])}">${PERSON}</a>`;
    const i = h.indexOf('class="ca-sbtn"');
    const j = h.indexOf('</button>', i);
    if (j < 0) continue;
    h = h.slice(0, j + 9) + ' ' + btn + h.slice(j + 9);
    if (!h.includes('/fiok-nav.js')) h = h.replace('</head>', HEAD + '</head>');
    navN++;
    await writeFile(f, h);
  }
  log(`${files} HTML · profil ikon: ${navN} oldal`);

  // ---- fiók oldalak ----
  const sandbox = { window: {} };
  vm.runInNewContext(await readFile(path.join(ROOT, 'fiok-i18n.js'), 'utf8'), sandbox);
  const I18N = sandbox.window.CA_ACCT_I18N;
  const huAlt = async (huPath) => {
    try {
      const t = await readFile(path.join(ROOT, huPath.split('#')[0], 'index.html'), 'utf8');
      const map = {};
      for (const m of t.matchAll(/<link rel="alternate" hreflang="([a-zA-Z-]+)" href="https:\/\/www\.caradvance\.hu([^"]+)"/g)) map[m[1].slice(0, 2)] = m[2];
      return map;
    } catch { return {}; }
  };
  const BASE = { privacy: '/adatkezeles/', contact: '/kapcsolat/' };
  const ALT = {};
  for (const [k, p] of Object.entries(BASE)) ALT[k] = await huAlt(p);

  let made = 0;
  for (const L of LANGS) {
    const tplPath = path.join(ROOT, L === 'hu' ? '' : L, 'aszf', 'index.html');
    if (!(await exists(tplPath))) { log('nincs sablon:', L); continue; }
    let h = await readFile(tplPath, 'utf8');
    const T = I18N[L] || I18N.hu;
    const links = {};
    for (const [k, p] of Object.entries(BASE)) {
      const hashPart = p.includes('#') ? '#' + p.split('#')[1] : '';
      let u = L === 'hu' ? p : (ALT[k][L] ? ALT[k][L] + hashPart : '');
      if (!u && L !== 'hu' && (await exists(path.join(ROOT, L, p.split('#')[0], 'index.html')))) u = '/' + L + p;
      links[k] = u || p;
    }
    const main = `<main class="acct"><section class="acct-hero"><div class="acct-hero-in"><div class="acct-kicker">${esc(T.kicker)}</div><h1 id="acct-h1">${esc(T.h1Out)}</h1><p id="acct-sub">${esc(T.subOut)}</p></div></section>` +
      `<div class="acct-wrap"><div id="ca-acct" data-lang="${L}" data-links="${esc(JSON.stringify(links))}"><div class="ac-loading">${esc(T.loading)}</div></div>` +
      `<noscript><div class="ac-card ac-msg">JavaScript · +36 30 233 6060 · info@caradvance.hu</div></noscript></div></main>`;
    h = h.replace(/<main[\s\S]*<\/main>/, main);
    h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(T.h1Anon)} — CarAdvance</title>`);
    h = h.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(T.subOut)}">`);
    h = h.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="https://www.caradvance.hu${ACCOUNT_PATH[L]}">`);
    h = h.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>/g, '');
    h = h.replace(/<meta name="robots"[^>]*>/g, '');
    h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    h = h.replace(/<meta property="og:(title|description|url)"[^>]*>/g, '');
    h = h.replace(/(<a hreflang="([a-zA-Z-]+)" class="langopt[^"]*" href=")[^"]*"/g, (m, a, hl) => a + (ACCOUNT_PATH[hl.slice(0, 2)] || '/') + '"');
    h = h.replace(/(<a class="ca-pbtn" href="[^"]*")/, '$1 aria-current="page"');
    h = h.replace('</head>', `<meta name="robots" content="noindex, nofollow"><link rel="stylesheet" href="/fiok-app.css?v=${v.acss}"><script src="/fiok-i18n.js?v=${v.i18n}" defer></script><script src="/fiok-app.js?v=${v.ajs}" defer></script></head>`);
    const out = path.join(ROOT, ACCOUNT_PATH[L], 'index.html');
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, h);
    made++;
  }
  log(`fiók oldalak: ${made} nyelv (${LANGS.map((l) => ACCOUNT_PATH[l]).join(' ')})`);
} catch (e) {
  log('HIBA (a build folytatódik):', e && e.stack || e);
}
