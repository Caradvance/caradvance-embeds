// Build futtató. Az éles (main) és minden más ág a teljes "build:full" láncot futtatja.
// Csak a develop ágon (Cloudflare: CF_PAGES_BRANCH=develop) maradnak ki a SEO- és
// idegen nyelvű lépések, hogy a fejlesztői előnézet gyorsan elkészüljön.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const full = JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).scripts['build:full'];
const DEV_SKIP = new Set(['seo-noprice', 'seo-desc', 'seo-ujberles', 'skcz-local', 'pl-site', 'cz-phone', 'cz-final', 'ch-site', 'eu-site', 'km-note', 'share-meta', 'skcz-fix1104', 'skcz-fix1109', 'pdf-photos', 'mirror-car-photos', 'seo-audit-fix', 'market-404', 'seo-landing', 'skcz-langs', 'skcz-fix1110']);
const dev = process.env.CF_PAGES_BRANCH === 'develop';
const steps = full.split('&&').map((s) => s.trim()).filter(Boolean)
  .filter((s) => !(dev && DEV_SKIP.has((s.split(/\s+/)[1] || '').replace(/\.mjs$/, ''))));
console.log(dev ? `[build-run] develop: gyors build, ${steps.length} lépés` : '[build-run] teljes build');
for (const s of steps) execSync(s, { stdio: 'inherit', env: { ...process.env, PATH: './node_modules/.bin:' + process.env.PATH } });
