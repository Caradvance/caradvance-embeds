// Build utolsó lépése: a site-szintű szkriptek tartalom-hash szerinti verziót kapnak minden HTML-ben,
// így egy módosítás AZONNAL megjelenik minden látogatónál (nem a böngésző régi, gyorsítótárazott példánya fut).
//  1) ca-forms.js hash → a caradvance-chat.js betöltője (/ca-forms.js?v=<hash>)
//  2) caradvance-chat.js hash → minden dist/**/*.html (/caradvance-chat.js?v=<hash>)
// Hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const hash = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(dist, f))).digest('hex').slice(0, 10);

try {
  let fv = '';
  try { fv = hash('ca-forms.js'); } catch (e) { /* nincs ca-forms.js */ }
  const chatP = path.join(dist, 'caradvance-chat.js');
  if (fv && fs.existsSync(chatP)) {
    const c = fs.readFileSync(chatP, 'utf8');
    const c2 = c.replace(/\/ca-forms\.js(\?v=[0-9a-z]+)?/g, '/ca-forms.js?v=' + fv);
    if (c2 !== c) fs.writeFileSync(chatP, c2);
  }
  let cv = '';
  try { cv = hash('caradvance-chat.js'); } catch (e) { /* nincs chat.js */ }
  let files = 0;
  if (cv) {
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!/\.html$/.test(e.name)) continue;
        const s = fs.readFileSync(p, 'utf8');
        const n = s.replace(/\/caradvance-chat\.js(\?v=[0-9a-z]+)?(?=["'])/g, '/caradvance-chat.js?v=' + cv);
        if (n !== s) { fs.writeFileSync(p, n); files++; }
      }
    })(dist);
  }
  console.log('ver-assets: ca-forms v=' + fv + ', caradvance-chat v=' + cv + ', ' + files + ' HTML frissítve');
} catch (e) {
  console.log('ver-assets: kihagyva — ' + (e && e.message));
}
