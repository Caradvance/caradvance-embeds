// Build — utolsó lépés: az asztali mega menü (public/mega-menu.js) betöltése MINDEN oldalra,
// minden nyelven (hu, en, de, fr, uk, zh, sk, cs) és a _np (ár nélküli) változatokon is.
// Csak azokra az oldalakra kerül, amelyeken van fő menü (class="ca-navwrap"). Mobilon a script nem csinál semmit.
// A ?v= a fájl tartalmának hash-e, így módosítás után a böngésző azonnal az új változatot tölti le
// (a statikus fájlok 4 órán át cache-elődnek).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIST = 'dist';
const FILE = path.join(DIST, 'mega-menu.js');
if (!fs.existsSync(FILE)) { console.log('[megamenu] nincs dist/mega-menu.js — kihagyva'); process.exit(0); }
const v = crypto.createHash('sha1').update(fs.readFileSync(FILE)).digest('hex').slice(0, 10);
const TAG = '<script src="/mega-menu.js?v=' + v + '" defer></script>';
// belső (munkatársi) oldalak, tesztoldalak és API kimarad
const SKIP = /(^|\/)(belso|_ttest|teszt-mega-menu|api)(\/|$)/;

let done = 0, skipped = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.html?$/i.test(e.name)) continue;
    const rel = path.relative(DIST, p).split(path.sep).join('/');
    if (SKIP.test(rel)) { skipped++; continue; }
    let h = fs.readFileSync(p, 'utf8');
    if (h.indexOf('class="ca-navwrap"') < 0 || h.indexOf('/mega-menu.js') >= 0) { skipped++; continue; }
    const i = h.search(/<\/head>/i);
    if (i < 0) { skipped++; continue; }
    h = h.slice(0, i) + TAG + h.slice(i);
    fs.writeFileSync(p, h);
    done++;
  }
}
walk(DIST);
console.log('[megamenu] beillesztve: ' + done + ' oldal, kihagyva: ' + skipped + ' (v=' + v + ')');
