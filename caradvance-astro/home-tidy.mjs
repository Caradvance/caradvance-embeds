// Build lépés: letisztult, átláthatóbb magyar főoldal (CSAK dist/index.html). A többi lépés UTÁN fut. Idempotens.
// Az elemeket a parse5 forráspozíciói alapján, szövegszinten vágja/illeszti — a HTML többi része érintetlen marad.
//  · a statisztika-sáv (logókkal, mobile.de) marad; a hero bizalmi sávja kimarad (ne ismétlődjenek a számok)
//  · szolgáltatás-kártyák: egy cím, egy mondat, 3 pont, EGY gomb (a platformlogók és a gombsorok kimaradnak)
//  · „Kik vagyunk?” + „Amiben hiszünk” → egy tömör „Rólunk” rész; a jótékonysági kártya ide kerül
//  · vélemények: 3 kártya (+ link az összesre)
//  · „Jó tudni” SEO-szöveg összecsukva („Bővebben”), GYIK: 5 kérdés látszik, a többi gombra nyílik
//  · záró ajánlatkérő kártya a GYIK után
// Új sorrend: hero → Autóink → számsáv → Szolgáltatások → Így dolgozunk → Rólunk → Vélemények → GYIK → Ajánlatkérés → lábléc
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const FILE = path.join('dist', 'index.html');
const FAQ_SHOW = 5, REV_SHOW = 3;

// a szolgáltatás-kártyák egyetlen gombja (címke szerint)
const SVC_CTA = [
  [/Prémium autóbérlés/, '/autoink/#berelheto', 'Bérelhető autók'],
  [/Prémium autó eladás/, '/autoink/', 'Megvásárolható autók'],
  [/Autóimport/, '/auto-rendeles/', 'Autót rendelek'],
  [/Használtautó-eladás|Eladjuk az autódat/, '/eladom/', 'Eladom az autómat'],
];

const CSS = '<style id="ca-dark-tidy-css">'
  // szolgáltatás-kártyák: egy gomb, egységes alj
  + '#szolgaltatasok .card.svc{display:flex;flex-direction:column}#szolgaltatasok .card.svc ul{margin-bottom:22px}'
  + '#szolgaltatasok .ca-svc-cta{margin-top:auto;align-self:flex-start}'
  // Rólunk
  + '#rolunk .ca-about{display:grid;grid-template-columns:1.05fr 1fr;gap:34px;align-items:center;margin-top:8px}'
  + '#rolunk .ca-about p{font-size:17px;line-height:1.65;margin:0 0 22px;opacity:.88}'
  + '#rolunk .ca-vals{display:grid;grid-template-columns:1fr 1fr;gap:14px}'
  + '#rolunk .ca-vals .card{padding:20px 20px 18px;margin:0}#rolunk .ca-vals .card h3{margin:12px 0 6px;font-size:16.5px}#rolunk .ca-vals .card p{margin:0;font-size:13.5px;line-height:1.5;opacity:.75}'
  + '#rolunk .ca-vals .ic{width:38px;height:38px}'
  + '#rolunk #jotekonysag{margin-top:34px}'
  + '@media(max-width:900px){#rolunk .ca-about{grid-template-columns:1fr}}@media(max-width:520px){#rolunk .ca-vals{grid-template-columns:1fr}}'
  // vélemények: link az összesre
  + '#velemenyek .ca-rev-all{display:inline-flex;margin-top:18px}'
  // „Bővebben” (SEO-szöveg) és GYIK
  + '#gyik .ca-seo-h{font-size:clamp(20px,2.2vw,26px)!important;line-height:1.3;max-width:760px;opacity:.92}'
  + '#gyik details.ca-more{margin:6px 0 40px}#gyik details.ca-more>summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-weight:700;color:#ff3b4e}'
  + '#gyik details.ca-more>summary::-webkit-details-marker{display:none}#gyik details.ca-more>summary::after{content:"＋";font-size:14px}#gyik details.ca-more[open]>summary::after{content:"－"}'
  + '#gyik details.ca-more .seo-copy{margin-top:16px}'
  + '#gyik .faq-list:not(.ca-all-open) .faq-item.ca-faq-more{display:none}'
  + '#gyik .ca-faq-btn{margin-top:16px}'
  // záró ajánlatkérő kártya
  + '#ca-cta .card.ca-cta-card{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:24px;padding:48px 44px}'
  + '#ca-cta .card.ca-cta-card>div{width:100%;display:flex;flex-direction:column;align-items:center}'
  + '#ca-cta h2{margin:0 0 8px;font-size:clamp(26px,3vw,38px);letter-spacing:-.02em}#ca-cta p{margin:0;opacity:.8;font-size:16px}'
  + '#ca-cta .ca-cta-btns{display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center}'
  // telefonszám-gomb: Liquid Glass üveggomb ikonnal (jóváhagyott „A”)
  + '#ca-cta .ca-tel{display:inline-flex;align-items:center;gap:9px;color:#fff!important;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.06))!important;border:1px solid rgba(255,255,255,.28)!important;'
  + '-webkit-backdrop-filter:blur(12px) saturate(180%);backdrop-filter:blur(12px) saturate(180%);box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),inset -1px -1px 1px rgba(255,255,255,.12),0 10px 26px rgba(0,0,0,.35)!important;transition:background .25s,border-color .25s}'
  + '#ca-cta .ca-tel:hover{background:linear-gradient(180deg,rgba(255,255,255,.24),rgba(255,255,255,.10))!important;border-color:rgba(255,255,255,.45)!important}'
  + '#ca-cta .ca-cta-alt{display:block;margin-top:12px;font-size:14px;opacity:.75}#ca-cta .ca-cta-alt a{color:inherit;font-weight:700}'
  + '@media(max-width:640px){#ca-cta .card.ca-cta-card{padding:28px 22px}}'
  + '</style>';

function findAll(node, pred, out = []) {
  if (pred(node)) out.push(node);
  (node.childNodes || []).forEach((c) => findAll(c, pred, out));
  if (node.content) findAll(node.content, pred, out);
  return out;
}
const attr = (n, k) => { const a = (n.attrs || []).find((x) => x.name === k); return a ? a.value : null; };
const hasClass = (n, c) => (' ' + (attr(n, 'class') || '') + ' ').indexOf(' ' + c + ' ') > -1;
const loc = (n) => n.sourceCodeLocation;

try {
  if (!fs.existsSync(FILE)) { console.log('[home-tidy] nincs dist/index.html'); }
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-dark-tidy-css"') > -1) { console.log('[home-tidy] már alkalmazva'); }
    else {
      const doc = parse(h, { sourceCodeLocationInfo: true });
      const byId = (id) => findAll(doc, (n) => attr(n, 'id') === id)[0];
      const edits = []; // [start, end, replacement]
      const cut = (n) => edits.push([loc(n).startOffset, loc(n).endOffset, '']);
      const src = (n) => h.slice(loc(n).startOffset, loc(n).endOffset);
      const inner = (n) => h.slice(loc(n).startTag.endOffset, loc(n).endTag.startOffset);

      // 1) a statisztika-sáv (logókkal, köztük a mobile.de) marad; a hero bizalmi sávja kimarad, hogy a számok ne ismétlődjenek
      const trust = findAll(doc, (n) => n.tagName === 'div' && hasClass(n, 'ca-trust'))[0];
      if (trust) cut(trust);

      // 2) szolgáltatás-kártyák: platformlogók és gombsorok ki, egy gomb be; a futásidejű gombátíró kihagyja (data-cahome)
      const svc = byId('szolgaltatasok');
      findAll(svc, (n) => n.tagName === 'div' && hasClass(n, 'svc') && hasClass(n, 'card')).forEach((card) => {
        const label = findAll(card, (n) => hasClass(n, 'tag'))[0];
        const txt = label ? h.slice(loc(label).startTag.endOffset, loc(label).endTag.startOffset) : '';
        const m = SVC_CTA.find(([re]) => re.test(txt));
        card.childNodes.filter((c) => c.tagName && (hasClass(c, 'platforms') || hasClass(c, 'btn-row') || (c.tagName === 'a' && hasClass(c, 'btn')))).forEach(cut);
        const st = loc(card).startTag; edits.push([st.endOffset - 1, st.endOffset - 1, ' data-cahome="1"']);
        if (m) edits.push([loc(card).endTag.startOffset, loc(card).endTag.startOffset, '<a class="btn btn-red ca-svc-cta" href="' + m[1] + '">' + m[2] + ' →</a>']);
      });

      // 3) Rólunk: a „Kik vagyunk?” + „Amiben hiszünk” helyett; a jótékonysági kártya ide kerül
      //    (a blokk azonosítóját átnevezzük, különben a chat szkript visszamozgatná az autós rész alá)
      const tort = byId('tortenet'), ert = byId('ertekek'), jot = byId('jotekonysag-blokk'), rev = byId('velemenyek');
      const vals = findAll(ert, (n) => n.tagName === 'div' && hasClass(n, 'value') && hasClass(n, 'card')).map((v) => {
        const ic = findAll(v, (n) => hasClass(n, 'ic'))[0], h3 = findAll(v, (n) => n.tagName === 'h3')[0], p = findAll(v, (n) => n.tagName === 'p')[0];
        const first = p ? inner(p).split(/(?<=\.)\s/)[0] : '';
        return '<div class="card value reveal">' + (ic ? src(ic) : '') + (h3 ? src(h3) : '') + '<p>' + first + '</p></div>';
      }).join('');
      const charity = jot ? findAll(jot, (n) => attr(n, 'id') === 'jotekonysag')[0] : null;
      const rolunk = '<section class="block" id="rolunk" style="padding-top:0"><div class="wrap">'
        + '<span class="eyebrow reveal">Rólunk</span><h2 class="sec-title reveal">Kik vagyunk?</h2>'
        + '<div class="ca-about"><div class="reveal"><p>A Caradvance a németországi <strong>Caradvance GmbH</strong> márkája — 2003 óta a német autópiac megbízható szereplője. '
        + 'Magyarországon a <strong>BH Group Zrt.</strong> képviseli: magyarul, helyben, személyesen kísérünk végig, leinformált, bevizsgált autókkal és <strong>1 év szavatossággal</strong>.</p>'
        + '<a class="btn btn-outline" href="/miert-mi/">Tudj meg többet rólunk →</a></div>'
        + '<div class="ca-vals">' + vals + '</div></div>'
        + (charity ? src(charity) : '') + '</div></section>';
      if (tort) cut(tort); if (ert) cut(ert); if (jot) cut(jot);
      // a Rólunk a vélemények ELÉ kerül (előbb kik vagyunk, utána a bizonyíték: amit az ügyfeleink mondanak)
      if (rev) edits.push([loc(rev).startOffset, loc(rev).startOffset, rolunk]);

      // 4) vélemények: 3 kártya + link az összesre (a „Google-n” link marad a lábjegyzetben)
      if (rev) {
        const cards = findAll(rev, (n) => n.tagName === 'article' && hasClass(n, 'rev-card'));
        cards.slice(REV_SHOW).forEach(cut);
      }

      // 5) „Jó tudni”: SEO-szöveg összecsukva; GYIK: első 5 látszik, a többi gombra nyílik
      const gyik = byId('gyik');
      if (gyik) {
        const seo = findAll(gyik, (n) => hasClass(n, 'seo-copy'))[0];
        if (seo) {
          edits.push([loc(seo).startOffset, loc(seo).startOffset, '<details class="ca-more"><summary>Bővebben a Caradvance-ról</summary>']); edits.push([loc(seo).endOffset, loc(seo).endOffset, '</details>']);
          // összecsukva nem úszhat be (különben kinyitva láthatatlan maradna) — a reveal osztály kimarad
          const ca = loc(seo).startTag.attrs && loc(seo).startTag.attrs.class; if (ca) edits.push([ca.startOffset, ca.endOffset, 'class="' + attr(seo, 'class').replace(/\s*\breveal\b/, '') + '"']);
        }
        // a „Jó tudni” cím kisebb, bevezető jellegű (a GYIK a fő cím)
        const seoH = findAll(gyik, (n) => n.tagName === 'h2' && hasClass(n, 'sec-title'))[0];
        if (seoH) { const ca = loc(seoH).startTag.attrs.class; edits.push([ca.startOffset, ca.endOffset, 'class="' + attr(seoH, 'class') + ' ca-seo-h"']); }
        const items = findAll(gyik, (n) => n.tagName === 'details' && hasClass(n, 'faq-item'));
        items.slice(FAQ_SHOW).forEach((it) => { const st = loc(it).startTag; const a = it.attrs.find((x) => x.name === 'class'); const al = st.attrs && st.attrs.class;
          if (al) edits.push([al.startOffset, al.endOffset, 'class="' + a.value + ' ca-faq-more"']); });
        const list = findAll(gyik, (n) => hasClass(n, 'faq-list'))[0];
        if (list && items.length > FAQ_SHOW) edits.push([loc(list).endOffset, loc(list).endOffset,
          '<button type="button" class="btn btn-outline ca-faq-btn" onclick="var l=this.previousElementSibling;l.classList.toggle(\'ca-all-open\');this.textContent=l.classList.contains(\'ca-all-open\')?\'Kevesebb kérdés\':\'Összes kérdés (' + items.length + ')\'">Összes kérdés (' + items.length + ')</button>']);
        // 6) záró ajánlatkérő kártya a GYIK után
        edits.push([loc(gyik).endOffset, loc(gyik).endOffset,
          '<section class="block" id="ca-cta" style="padding-top:10px"><div class="wrap"><div class="card ca-cta-card reveal">'
          + '<div><h2>Melyik autó érdekel?</h2><p>Írd meg, mit keresel — személyre szabott ajánlatot küldünk.</p></div>'
          + '<div><div class="ca-cta-btns"><a class="btn btn-red" href="/autot-keresek/">Ajánlatot kérek →</a><a class="btn ca-tel" data-dm-skip href="tel:+36302336060"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>+36 30 233 6060</a></div>'
          + '<span class="ca-cta-alt">vagy írj nekünk: <a href="mailto:info@caradvance.hu">info@caradvance.hu</a></span></div>'
          + '</div></div></section>']);
      }

      // szerkesztések hátulról előre, hogy a pozíciók ne csússzanak
      edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
      for (const [s, e, r] of edits) h = h.slice(0, s) + r + h.slice(e);
      h = h.replace('</head>', CSS + '</head>');
      fs.writeFileSync(FILE, h);
      console.log('[home-tidy] letisztult főoldal: ' + edits.length + ' módosítás');
    }
  }
} catch (e) { console.log('[home-tidy] hiba:', e.message); }
