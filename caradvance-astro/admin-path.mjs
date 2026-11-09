// Build lépés (a lánc végén, az am-routes.mjs után): a munkatársi felület új címe /admin/ (eddig /belso/) — Marc, 2026-11-09.
//  · minden dist/**/belso mappa → mellette dist/**/admin (a HTML / JS / CSS hivatkozásai /admin/-ra írva; az /api/belso* API-k maradnak),
//    a régi mappa törlődik (a régi címeket a _middleware.js és a _redirects 301-gyel az /admin/-ra viszi)
//  · a többi oldal (pl. /alairas/) /belso/… hivatkozásai is /admin/…-ra
//  · _routes.json: minden /belso… szabály mellé az /admin… megfelelője (Functions: /admin/ajanlatmotor/*)
//  · _redirects: /belso → /admin (statikus kiszolgálás esetére is); _headers: /admin/* noindex
// Hiba esetén logol, a buildet nem állítja meg. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const TEXT = /\.(html?|js|mjs|css|json|txt|xml|webmanifest)$/i;
const RE = /(?<!\/api)\/belso(?=[\/"'?#`\s)\\]|$)/g;
const fix = (s) => s.replace(RE, '/admin').replace(/Belső irányítópult/g, 'Admin').replace(/BELSŐ IRÁNYÍTÓPULT/g, 'ADMIN');

function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); }
  return out;
}
function belsoDirs(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(d, e.name);
    if (e.name === 'belso') out.push(p); else if (e.name !== 'node_modules' && e.name !== 'admin') belsoDirs(p, out);
  }
  return out;
}

try {
  let nd = 0, nf = 0, no = 0;
  // 1) belso → admin
  for (const src of belsoDirs(DIST, [])) {
    const dst = path.join(path.dirname(src), 'admin');
    for (const f of walk(src, [])) {
      const t = path.join(dst, path.relative(src, f)); fs.mkdirSync(path.dirname(t), { recursive: true });
      if (TEXT.test(f)) fs.writeFileSync(t, fix(fs.readFileSync(f, 'utf8'))); else fs.copyFileSync(f, t);
      nf++;
    }
    fs.rmSync(src, { recursive: true, force: true }); nd++;
  }
  // 2) a többi oldal hivatkozásai (pl. /alairas/ → /admin/doc-render.js)
  for (const f of walk(DIST, [])) {
    if (!/\.(html?|js)$/i.test(f)) continue;
    const s = fs.readFileSync(f, 'utf8'); if (s.indexOf('/belso') < 0) continue;
    const h = s.replace(RE, '/admin'); if (h !== s) { fs.writeFileSync(f, h); no++; }
  }
  // 3) _routes.json
  const rp = path.join(DIST, '_routes.json');
  if (fs.existsSync(rp)) {
    const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    for (const k of ['include', 'exclude']) {
      if (!Array.isArray(r[k])) continue;
      const add = r[k].filter((x) => /^\/belso(\/|$)/.test(x)).map((x) => x.replace(/^\/belso/, '/admin')).filter((x) => !r[k].includes(x));
      r[k].push(...add);
    }
    if (Array.isArray(r.include) && !r.include.some((x) => x === '/*' || x === '/admin/*' || x === '/admin/ajanlatmotor/*')) r.include.push('/admin/ajanlatmotor/*');
    const total = (r.include || []).length + (r.exclude || []).length;
    if (total > 100) console.log('[admin-path] FIGYELEM: _routes.json ' + total + ' szabály (max. 100)');
    fs.writeFileSync(rp, JSON.stringify(r, null, 2));
  }
  // 4) _redirects + _headers
  const rf = path.join(DIST, '_redirects');
  let red = fs.existsSync(rf) ? fs.readFileSync(rf, 'utf8') : '';
  if (red.indexOf('/belso/* /admin/:splat') < 0) { red = '/belso /admin/ 301\n/belso/* /admin/:splat 301\n' + red; fs.writeFileSync(rf, red); }
  const hf = path.join(DIST, '_headers');
  let hd = fs.existsSync(hf) ? fs.readFileSync(hf, 'utf8') : '';
  if (hd.indexOf('/admin/*') < 0) { hd += (hd && !hd.endsWith('\n') ? '\n' : '') + '/admin/*\n  X-Robots-Tag: noindex, nofollow\n'; fs.writeFileSync(hf, hd); }
  console.log('[admin-path] /belso → /admin: ' + nd + ' mappa, ' + nf + ' fájl, ' + no + ' további oldal hivatkozása átírva');
} catch (e) { console.log('[admin-path] hiba:', e && e.stack || e); }
