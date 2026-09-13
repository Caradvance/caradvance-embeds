// Build lepes: H1 hozzaadasa a /auto/<slug>/ autó-aloldalakhoz.
//
// MIERT
// Az autó-részletes oldalak (generate.mjs) a modell nevét egy <div class="ptitle">
// elemben mutatják (oldalsáv) + a morzsában, de NINCS rajtuk <h1>. Az Ahrefs Site
// Audit ezért ~49 auto-oldalt jelöl "H1 tag missing"-ként. A H1 valódi on-page
// jelzés, ezért a modell nevét H1-be tesszük — a megjelenés változatlan marad
// (a .ptitle osztály viszi a stílust, a beszúrt margin:0 kiüti a H1 alapmargóját).
//
// A kesz dist/-en dolgozik, tehát a generált ES a kézzel megtartott (Fiesta, Focus)
// oldalakra is érvényes. Idempotens (ha már van <h1>, kihagyja); hiba esetén exit 0.
import fs from 'node:fs';

const DIST = 'dist';

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

try {
  const dir = DIST + '/auto';
  if (!fs.existsSync(dir)) { console.log('seo-h1: nincs dist/auto - kihagyva'); process.exit(0); }

  let fixed = 0, already = 0, skip = 0;
  for (const f of walk(dir)) {
    let h = fs.readFileSync(f, 'utf8');
    if (/<h1[\s>]/i.test(h)) { already++; continue; }         // már van H1 - idempotens
    const m = h.match(/<div class="ptitle">([\s\S]*?)<\/div>/);
    if (m) {
      h = h.replace(m[0], '<h1 class="ptitle" style="margin:0">' + m[1] + '</h1>');
      fs.writeFileSync(f, h);
      fixed++;
    } else { skip++; }
  }
  console.log('seo-h1: H1 hozzaadva ' + fixed + ' auto-oldalhoz (' + already + ' mar volt, ' + skip + ' kihagyva - nincs .ptitle)');
} catch (e) {
  console.log('seo-h1: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)');
  process.exit(0);
}
