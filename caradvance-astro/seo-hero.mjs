// Build lepes: MINDEN hero egységesítése a kezdőlap hero-jához (fókusz: mobil).
//
// A kezdőlap/autoink a ".hero" osztályt használja (helyes mobil szabályokkal).
// A többi oldal saját hero-osztályt használ, ami mobilon nem egyezett:
//   - .egl-land-hero  (egyedi lista)  – fészkelt, felső+oldalsó wrapper padding
//   - .egl-mhero      (bérlés lista)  – fészkelt, oldalsó wrapper padding
//   - .kaphero        (kapcsolat)     – fészkelt, oldalsó wrapper padding
//   - .bizhero        (bizomanyos)    – top-level, hiányzó mobil szabály
//   - .cd-hero        (autó-aloldal)  – a .astro-ban javítva külön
// Ez a lepes a kész dist/-en dolgozik, idempotens, hiba esetén tovabblep.
import fs from 'node:fs';

// (A) .inner felső margó egységesítése 24px-re minden oldalon (.hero-s oldalak)
const FROM = 'max-width:1120px;margin:64px auto 0';
const TO = 'max-width:1120px;margin:24px auto 0';
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
try {
  let n = 0;
  for (const f of walk('dist')) {
    let h = fs.readFileSync(f, 'utf8');
    if (h.includes(FROM)) { h = h.split(FROM).join(TO); fs.writeFileSync(f, h); n++; }
  }
  console.log('seo-hero: .inner felso terkoz egysegesitve ' + n + ' oldalon');
} catch (e) { console.log('seo-hero: (A) FIGYELEM - ' + (e && e.message)); }

// (B) per-oldal hero-igazitas — egy <style> beszurasa a </head> ele, markerrel
function inject(file, marker, css) {
  try {
    if (!fs.existsSync(file)) { return; }
    let h = fs.readFileSync(file, 'utf8');
    if (h.includes(marker) || !h.includes('</head>')) return;
    h = h.replace('</head>', '<style id="' + marker + '">' + css + '</style></head>');
    fs.writeFileSync(file, h);
    console.log('seo-hero: igazitva -> ' + file);
  } catch (e) { console.log('seo-hero: ' + file + ' FIGYELEM - ' + (e && e.message)); }
}

// A kezdőlap mobil hero geometriaja:
//   top-level hero:  margin:8px; margin-top:calc(8px - navh); radius:22; padding:84 18 72; min-h:480
//   fészkelt hero:   ugyanaz, de az oldalsó 20px wrapper-paddingből -12px margóval tör ki (=> 8px szél)
const TOP = 'margin:8px!important;margin-top:calc(8px - var(--navh))!important;border-radius:22px!important;padding:84px 18px 72px!important;min-height:480px!important;';
const NEST = 'border-radius:22px!important;padding:84px 18px 72px!important;min-height:480px!important;margin-left:-12px!important;margin-right:-12px!important;margin-bottom:8px!important;';
const LOGOROW = 'display:flex!important;flex-wrap:wrap!important;justify-content:center!important;align-items:center!important;gap:12px 16px!important;max-width:100%!important;margin:0 auto 18px!important;';
const LOGOIMG = 'height:30px!important;width:auto!important;max-width:76px!important;object-fit:contain!important;';
const FILTERS = '.egl-filters .egl-search,.egl-filters select{height:46px!important;padding:12px 14px!important;font-size:14px!important;border:1px solid #e2e5ea!important;border-radius:12px!important;box-shadow:0 1px 2px rgba(8,8,10,.05)!important;}.egl-filters select{padding:12px 40px 12px 14px!important;}';

// Egyedi lista: fészkelt + extra 34px felső wrapper-padding kiegyenlítése + logók + szűrők
inject('dist/egyedi-auto-rendeles/index.html', 'cd-align-egl',
  '@media(max-width:640px){.egl-land-hero{' + NEST + 'margin-top:calc(8px - var(--navh) - 34px)!important;}}' +
  '.egl-land-brandrow{' + LOGOROW + '}.egl-land-brandrow img{' + LOGOIMG + '}' +
  FILTERS
);

// Bérlés lista (rental): fészkelt egl-mhero + logósor biztonsági behúzás
inject('dist/uj-auto-berlese/index.html', 'cd-align-uab',
  '@media(max-width:640px){.egl-mhero{' + NEST + '}}' +
  '.egl-mhero-logos{' + LOGOROW + '}.egl-mhero-logos img{' + LOGOIMG + '}'
);

// Bizomanyos: top-level bizhero
inject('dist/bizomanyos/index.html', 'cd-align-biz',
  '@media(max-width:640px){.bizhero{' + TOP + '}}'
);

// Kapcsolat: fészkelt kaphero
inject('dist/kapcsolat/index.html', 'cd-align-kap',
  '@media(max-width:640px){.kaphero{' + NEST + '}}'
);

process.exit(0);
