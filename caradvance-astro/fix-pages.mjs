// Build step: copy the original generator-built /autoink/ and /auto/ pages
// into the Astro public dir, and patch their (frozen, old) chrome so the
// logo and menu links work under the current www.caradvance.hu deployment.
import fs from 'node:fs';

function cp(src, dst) {
  if (!fs.existsSync(src)) { console.log('fix-pages: missing ' + src); return; }
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

cp('../autoink', 'public/autoink');
cp('../auto', 'public/auto');

// copy root static assets (logo, hero videos, images) so the site is self-contained
for (const f of fs.readdirSync('..')) {
  if (/\.(webp|png|jpe?g|mp4|svg|ico|gif)$/i.test(f)) {
    try { if (fs.statSync('../' + f).isFile()) fs.copyFileSync('../' + f, 'public/' + f); } catch (e) {}
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') fix(p);
  }
}

function fix(p) {
  let h = fs.readFileSync(p, 'utf8');
  // relative assets (../logo.webp, ../../hero.mp4, favicon, ...) -> absolute
  h = h.replace(/"(?:\.\.\/)+([A-Za-z0-9._-]*\.(?:webp|png|jpe?g|mp4|ico|svg))"/g, '"/$1"');
  // menu links that were dead placeholders in the old build
  h = h.replace(/href="\.\.\/autoink\/"/g, 'href="/autoink/"');
  h = h.replace(/href="#">Eladom az autómat</g, 'href="/eladom">Eladom az autómat<');
  h = h.replace(/href="#">Jótékonyság</g, 'href="/jotekonysag">Jótékonyság<');
  h = h.replace(/href="#">Értékesítési folyamat</g, 'href="/ertekesitesi-folyamat">Értékesítési folyamat<');
  h = h.replace(/href="#">Gyakori kérdések</g, 'href="/gyakori-kerdesek">Gyakori kérdések<');
  h = h.replace(/href="#">Bérelhető autóink</g, 'href="/berelheto">Bérelhető autóink<');
  // add the "Bizományos autóink" submenu item (added later, missing from the old build)
  if (!h.includes('>Bizományos autóink<')) {
    h = h.replace(/<a class="ddi" href="\/eladom">Eladom az autómat<\/a>/g, '<a class="ddi" href="/bizomanyos">Bizományos autóink</a><a class="ddi" href="/eladom">Eladom az autómat</a>');
    h = h.replace(/<a href="\/eladom">Eladom az autómat<\/a>/g, '<a href="/bizomanyos">Bizományos autóink</a><a href="/eladom">Eladom az autómat</a>');
  }
  // inject the consignment "supported cause" widget on /auto/<slug>/ car pages
  if (p.indexOf('public/auto/') === 0 && h.indexOf('/biz-widget.js') < 0) {
    h = h.replace('</body>', '<script src="/biz-widget.js"></script></body>');
  }
  // inject the rental "bérlési ajánlat" widget on /auto/<slug>/ car pages
  if (p.indexOf('public/auto/') === 0 && h.indexOf('/rent-widget.js') < 0) {
    h = h.replace('</body>', '<script src="/rent-widget.js"></script></body>');
  }
  // inject the CarAdvance chat widget on every generator page
  if (h.indexOf('/caradvance-chat.js') < 0) {
    h = h.replace('</body>', '<script src="/caradvance-chat.js" defer></script></body>');
  }
  // raise the floating nav (was too low)
  h = h.replace(/padding:32px 14px 0/g, 'padding:12px 14px 0');
  fs.writeFileSync(p, h);
}

walk('public/autoink');
walk('public/auto');
console.log('fix-pages: done');
