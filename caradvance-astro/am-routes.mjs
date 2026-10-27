// Ajánlatmotor: a Pages Functions csak a _routes.json "include" szabályain fut.
// A belső modul (/belso/ajanlatmotor/*) és az ügyfél-ajánlat (/ajanlat/auto/*) útvonalát a lánc legvégén vesszük fel.
// Az /api/* már benne van (seo-noprice.mjs). Ha nem fér bele a 100 szabályba, a build álljon meg: így nem megy ki néma 404.
import fs from 'node:fs';
import path from 'node:path';

const rp = path.join('dist', '_routes.json');
if (!fs.existsSync(rp)) { console.log('[am-routes] nincs dist/_routes.json, a Functions minden útvonalon fut'); process.exit(0); }
const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
r.include = r.include || [];
const covered = (w) => r.include.some((x) => x === w || x === '/*' || (x.endsWith('/*') && w.startsWith(x.slice(0, -1))));
const added = [];
for (const w of ['/belso/ajanlatmotor/*', '/ajanlat/auto/*']) if (!covered(w)) { r.include.push(w); added.push(w); }
const total = r.include.length + (r.exclude || []).length;
if (total > 100) throw new Error(`[am-routes] _routes.json: ${total} szabály (max. 100), az Ajánlatmotor útvonalai nem férnek bele`);
fs.writeFileSync(rp, JSON.stringify(r, null, 2));
console.log(`[am-routes] _routes.json: ${added.length ? added.join(', ') + ' felvéve' : 'már lefedve'} · ${total} szabály`);
