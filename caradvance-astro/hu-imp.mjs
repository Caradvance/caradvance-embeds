// hu-imp.mjs — Autó rendelés / Import főoldal (HU, /auto-rendeles/) letisztult megjelenés + SEO
// A KERESŐHÖZ (section.ik #rendeles, #buyForm) NEM NYÚL: se HTML, se CSS, se JS.
// SEO (build időben, a HTML-ben): a beágyazott keresőtől jövő, másik oldalra (/autot-keresek/) mutató Service-jelölés
// kikerül, BreadcrumbList, belső linkek a GYIK-válaszokban, kérdésenkénti horgony. A szövegek nem változnak.
// Megjelenés: fejléc olvashatóbb (sötétebb videó, élénk piros kiemelés), egységes számkártyák, kiegyensúlyozott
// csapatkártya, költségkártyák ikonnal, kiemelt kalkulátor-sáv, SEO-szöveg Bővebben, GYIK két oszlop 6 + összes,
// sötét módban puha átmenetek. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const FILE = path.join(DIST, 'auto-rendeles', 'index.html');
const SITE = 'https://www.caradvance.hu';

const LINKS = [
  ['Hogyan indul el az importfolyamat', '„Autó rendelés” űrlapot', '#rendeles'],
  ['Milyen költségekkel kell számolnom', 'kalkulátorunkban', '/honositas-kalkulator/'],
  ['Kapok garanciát', '1 éves jótállást', '/minosegbiztositas/'],
  ['Mennyi ideig tart egy autó behozatala', 'a német piaci keresés és bevizsgálás', '/beszerzesi-folyamat/'],
  ['Megéri autót hozni', 'tételes kalkulációnk', '/honositas-kalkulator/'],
  ['Milyen autókat tudtok behozni', 'német használtautót vagy új autót', '/autoink/'],
  ['Ti intézitek a külföldi', 'regisztrációs adó', '/honositas-kalkulator/'],
];

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const slug = (s) => strip(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

function seo(h, log) {
  // 1) a keresőtől származó, /autot-keresek/ URL-ű Service-jelölés eltávolítása (csak a jelölés, a kereső marad)
  h = h.replace(/<script type="application\/ld\+json">(\{[^<]*?"@type":"Service"[^<]*?\})<\/script>/g, (a, j) => {
    try { const o = JSON.parse(j); if (o.url && /\/autot-keresek\//.test(o.url)) { log.svc++; return ''; } } catch (e) {}
    return a;
  });
  // 2) GYIK: horgony + belső linkek (csak .imp-faq-ban)
  const k = h.indexOf('class="imp-faq');
  if (k > -1) {
    const end = h.indexOf('</div>', h.lastIndexOf('</details>'));
    let seg = h.slice(k, end);
    const used = new Set();
    seg = seg.replace(/<details\b([^>]*)>([\s\S]*?)<\/details>/g, (all, attrs, inner) => {
      const sm = inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
      if (!sm) return all;
      const q = strip(sm[1]).replace(/\s*\+$/, '');
      let id = slug(q); while (used.has(id)) id += '-2'; used.add(id);
      if (!/\sid="/.test(attrs)) attrs += ' id="' + id + '"';
      const head = inner.slice(0, sm.index + sm[0].length);
      let body = inner.slice(sm.index + sm[0].length);
      for (const [qs, phrase, url] of LINKS) {
        if (!q.startsWith(qs)) continue;
        const i = body.indexOf(phrase);
        if (i > -1 && !/<a\b[^>]*>[^<]*$/.test(body.slice(0, i))) { body = body.slice(0, i) + '<a class="ca-qlink" href="' + url + '">' + phrase + '</a>' + body.slice(i + phrase.length); log.links++; }
        else log.miss.push(qs);
      }
      return '<details' + attrs + '>' + head + body + '</details>';
    });
    h = h.slice(0, k) + seg + h.slice(end);
  }
  // 2b) a kalkulátor-sáv második gombja: ne vigyen vissza a keresőhöz, hanem közvetlen kapcsolat Tóth Károllyal
  h = h.replace(/<a class="ic-btn ic-btn-w"([^>]*)href="#rendeles"([^>]*)>Pontos ajánlatot kérek<\/a>/, (a, x, y) => { log.cta = 1; return '<a class="ic-btn ic-btn-w ca-call"' + x + 'href="tel:+36302146989"' + y + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>Hívj minket</a><a class="ic-btn ic-btn-w ca-wa"' + x + 'href="https://wa.me/36302146989" target="_blank" rel="noopener"' + y + '><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.6-.1 1.3z"/></svg>WhatsApp</a>'; });
  // 3) morzsamenü
  h = h.replace('</head>', () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Autóbehozatal Németországból', item: SITE + '/auto-rendeles/' },
  ] }) + '</script></head>');
  return h;
}

const P = 'html.ca-imp body section.imp ';
const D = 'html.ca-imp.ca-dark body section.imp ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:#fff!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 10px 26px rgba(18,19,23,.06)!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;';
// a főoldal kártyastílusa (üveg világosban, „bevel” + piros alsó fény sötétben)
const HL = 'background:linear-gradient(125deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 34%,rgba(255,255,255,.06) 55%,rgba(255,255,255,.24) 100%),rgba(255,255,255,.55)!important;border:1px solid rgba(255,255,255,.85)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),inset -1px -1px 1px rgba(255,255,255,.55),inset 0 -14px 28px rgba(255,255,255,.18),inset 0 0 0 1px rgba(18,19,23,.04),0 1px 2px rgba(18,19,23,.05),0 24px 60px rgba(18,19,23,.12)!important;';
const HD = 'background:radial-gradient(70% 45% at 50% 100%,rgba(226,0,26,.2),rgba(226,0,26,0) 72%),linear-gradient(#2A2B30 0%,#1B1C21 48%,#141519 100%)!important;background-color:#17181C!important;border:1px solid transparent!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.45),inset -1px -1px 1px rgba(255,255,255,.16),inset 0 0 0 1px rgba(255,255,255,.06),inset 0 10px 30px rgba(255,255,255,.05),0 30px 70px rgba(0,0,0,.55),0 4px 14px rgba(0,0,0,.35)!important;';
const IC = { // 1..6 ikon (vételár, szállítás, adó, illeték, vizsga, ügyintézés)
  1: '<path d="M3 12h18M7 16h2m6 0h2"/><path d="M5 12l2-5h10l2 5v6H5z"/>',
  2: '<path d="M2 16V7h11v9M13 10h4l3 3v3h-7"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  3: '<path d="M7 3h10v18l-5-3-5 3z"/><path d="M10 8h4M10 12h4"/>',
  4: '<path d="M4 7h16v12H4z"/><path d="M4 11h16M8 15h3"/>',
  5: '<path d="M9 12l2 2 4-4"/><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  6: '<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/>',
};

const CSS = '<style id="ca-imp-css">'
  // fejléc (csak a hero, a kereső szekciója érintetlen)
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.62) saturate(1.05)}'
  + P + 'section.hero .scrim{background:linear-gradient(90deg,rgba(8,8,10,.86),rgba(8,8,10,.62) 52%,rgba(8,8,10,.28)),linear-gradient(180deg,rgba(8,8,10,.25),rgba(8,8,10,.55))!important}'
  + P + 'section.hero :is(h1,.sub,.hero-src-t){text-shadow:0 2px 22px rgba(0,0,0,.6),0 1px 3px rgba(0,0,0,.4)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .hero-ey{color:#FF3B4E!important;text-shadow:0 1px 10px rgba(0,0,0,.6)}'
  // tömör fejléc: belépéskor a kereső doboza látszódjon (a keresőhöz nem nyúl, csak a fölötte lévő fejlécet tömöríti)
  + '@media(min-width:641px){' + P + 'section.hero{min-height:0!important;padding-bottom:220px!important}'
  + P + 'section.hero .inner.hero-l{margin-top:clamp(84px,11.5vh,104px)!important}'
  + P + 'section.hero .hero-ey{font-size:13px!important;margin-bottom:8px!important}'
  + P + 'section.hero h1{font-size:clamp(30px,min(4vw,6.2vh),52px)!important;line-height:1.06!important;margin-bottom:12px!important}'
  + P + 'section.hero .sub{font-size:clamp(15px,2.1vh,17px)!important;line-height:1.5!important;max-width:780px!important;margin-bottom:16px!important}'
  + P + 'section.hero .hero-src-t{font-size:13.5px!important}' + P + 'section.hero .hero-src img{height:26px!important}}'
  + '@media(max-width:640px){' + P + 'section.hero .inner.hero-l{margin-top:78px!important}'
  + P + 'section.hero .hero-ey{font-size:12px!important;margin-bottom:6px!important}'
  + P + 'section.hero h1{font-size:27px!important;line-height:1.08!important;margin-bottom:10px!important}'
  + P + 'section.hero .sub{display:none!important}' + P + 'section.hero .ca-subm{display:block!important;font-size:15px;line-height:1.45;color:rgba(255,255,255,.9);margin:0 0 12px;max-width:340px}'
  + P + 'section.hero .hero-src{gap:8px!important;flex-wrap:nowrap!important}' + P + 'section.hero .hero-src-t{display:none!important}' + P + 'section.hero .hero-src img{height:22px!important}}'
  + P + 'section.hero .ca-subm{display:none}'
  // a kereső mögött a videó puhán elhalványul az oldal hátterébe, így a doboz tisztán elválik (a keresőhöz nem nyúl)
  + P + 'section.hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:min(330px,46%);z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(245,245,247,0) 0%,rgba(245,245,247,.55) 38%,rgba(245,245,247,.9) 70%,#F5F5F7 100%)!important;background-color:transparent!important}'
  + D + 'section.hero::after{background:linear-gradient(180deg,rgba(13,15,19,0) 0%,rgba(13,15,19,.6) 38%,rgba(13,15,19,.92) 70%,#0D0F13 100%)!important;background-color:transparent!important}' + 'html.ca-dark.ca-imp.ca-dark body section.imp section.hero::after{background-color:transparent!important}'
  + P + 'section.hero .inner{z-index:3!important}'
  + '@media(max-width:640px){' + P + 'section.hero::after{height:min(190px,36%)}}'
  // számkártyák
  + P + '.stats .stat{border-radius:24px!important;' + HL + '}'
  + D + '.stats .stat{' + HD + '}'
  // márkalogók: ne érjenek a kártya széléhez, kisebb szélességen se lógjanak ki
  + P + '.stats .stat:nth-child(2) .stat-logos{flex-wrap:nowrap!important;justify-content:center!important;gap:clamp(6px,.9vw,12px)!important;padding:0 clamp(6px,1.2vw,16px)!important;box-sizing:border-box;width:100%}'
  + P + '.stats .stat:nth-child(2) .stat-logos img{flex:0 1 auto;min-width:0;max-width:20%!important;width:auto!important;height:auto!important;max-height:26px!important;object-fit:contain}'
  + P + '.stats .stat:nth-child(2) .stat-logos img[alt=Audi]{max-width:26%!important;max-height:15px!important}'
  + D + '.stats .stat .num{color:#fff!important}'
  + D + '.stats .stat .lbl{color:rgba(255,255,255,.65)!important}'
  // fejrészek
  + D + '.imp-head h2,' + D + '.imp-seo-h{color:#fff!important}'
  + D + '.imp-head p{color:rgba(255,255,255,.65)!important}'
  // csapat
  + P + '.imp-team{max-width:960px;margin:0 auto!important}'
  + P + '.team-card{display:grid!important;grid-template-columns:minmax(0,5fr) minmax(0,7fr)!important;border-radius:28px!important;overflow:hidden;' + HL + '}'
  + D + '.team-card{' + HD + '}'
  + D + '.team-card :is(.tc-name){color:#fff!important}' + D + '.team-card .tc-bio{color:rgba(255,255,255,.72)!important}'
  + D + '.tc-chip{background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.12)!important;color:#fff!important}'
  + P + '.tc-photo{min-height:100%!important}'
  + P + '.tc-contact{flex-direction:row!important;flex-wrap:wrap!important}'
  + P + '.imp-team-note{border-radius:20px!important;text-align:center;' + HL + '}'
  + D + '.imp-team-note{' + HD + '}' + D + '.imp-team-note b{color:#fff}' + D + '.imp-team-note span{color:rgba(255,255,255,.65)!important}'
  + '@media(max-width:760px){' + P + '.team-card{grid-template-columns:1fr!important}' + P + '.tc-photo{min-height:300px!important}' + P + '.tc-contact{flex-direction:column!important}}'
  // költségek
  + P + '.ic-grid{gap:14px!important}'
  + P + '.ic-card{border-radius:22px!important;padding:24px 22px 22px!important;' + HL + '}'
  + D + '.ic-card{' + HD + '}'
  + D + '.ic-card h3{color:#fff!important}' + D + '.ic-card p{color:rgba(255,255,255,.65)!important}'
  + P + '.ic-card .ic-n{width:46px!important;height:46px!important;border-radius:14px!important;background:linear-gradient(180deg,#FF2A40,#E2001A 60%,#B80015)!important;color:#fff!important;margin-bottom:16px!important;position:relative;box-shadow:inset 1px 1px 1px rgba(255,255,255,.45),0 10px 22px rgba(226,0,26,.35)!important}'
  
  + P + '.ic-card .ic-n.ca-ico{font-size:0!important}'
  + P + '.ic-card .ic-n svg{width:22px;height:22px}'
  + P + '.ic-card .ic-n i{position:absolute;right:-6px;top:-6px;width:20px;height:20px;border-radius:50%;background:#fff;color:#E2001A;box-shadow:0 2px 6px rgba(0,0,0,.25);font-family:inherit;font-weight:800;font-size:11px;line-height:20px;text-align:center;font-style:normal}'
  + P + '.ic-card h3{font-size:18px!important}'
  // a piros linkek egy szintre: a kártya oszlop, a link a kártya aljára kerül
  + P + '.ic-grid{align-items:stretch!important}' + P + '.ic-card{display:flex!important;flex-direction:column!important;align-items:flex-start!important}' + P + '.ic-card>a{margin-top:auto!important;padding-top:12px}'
  + P + '.ic-cta{position:relative;overflow:hidden;border-radius:26px!important;padding:28px 30px!important;background:#121317!important}'
  + P + '.ic-cta::before{content:"";position:absolute;inset:-40% -10% auto 40%;height:180%;background:radial-gradient(50% 50% at 50% 50%,rgba(226,0,26,.3),transparent 70%);pointer-events:none}'
  + P + '.ic-cta>*{position:relative}'
  + P + '.ic-cta b{font-size:20px!important}'
  + P + '.ic-btn{border-radius:999px!important;padding:14px 22px!important;box-shadow:0 10px 26px rgba(226,0,26,.35)}'
  + P + '.ic-btn.ic-btn-w{background:transparent!important;border:1px solid rgba(255,255,255,.28)!important;color:#fff!important;box-shadow:none}'
  + P + '.ic-btn:is(.ca-call,.ca-wa){display:inline-flex!important;align-items:center;justify-content:center;gap:8px}' + P + '.ic-btn.ca-wa:hover{border-color:#25D366!important;color:#25D366!important}' + P + '.ic-btn.ca-call:hover{border-color:#fff!important}'
  + '@media(min-width:900px){' + P + '.ic-cta{flex-wrap:nowrap!important}' + P + '.ic-cta>div{flex:1 1 auto!important;min-width:0}' + P + '.ic-cta .ic-btn{flex:0 0 auto!important}}'
  + '@media(max-width:899px){' + P + '.ic-cta>div{flex:1 1 100%!important}' + P + '.ic-cta .ic-btn{flex:1 1 0!important;box-sizing:border-box;white-space:nowrap}}'
  + '@media(max-width:640px){' + P + '.ic-cta .ic-btn{flex:1 1 100%!important;max-width:100%}}'
  + D + '.ic-cta{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03))!important;border:1px solid rgba(255,255,255,.08)}'
  + P + '.ic-opt{border-radius:20px!important;transition:transform .2s,box-shadow .2s;' + HL + '}'
  + P + '.ic-opt:hover{transform:translateY(-2px)}'
  + D + '.ic-opt{' + HD + '}' + D + '.ic-opt b{color:#fff!important}' + D + '.ic-opt span{color:rgba(255,255,255,.65)!important}'
  // SEO-szöveg
  + P + '.imp-seo{text-align:center!important}'
  + P + '.imp-seo p{text-align:left}'
  + P + '.imp-seo .imp-tag{display:table;margin:0 auto 10px}'
  + D + '.imp-seo p{color:rgba(255,255,255,.7)!important}' + D + '.imp-seo strong{color:#fff!important}'
  + P + '.ca-imore{overflow:hidden;max-height:0;transition:max-height .5s ease}' + P + '.ca-imore.open{max-height:2000px}'
  + P + '.ca-imb{display:inline-flex;align-items:center;gap:6px;margin:4px auto 0;background:none;border:1px solid rgba(18,19,23,.14);border-radius:999px;padding:10px 18px;font-family:inherit;font-weight:600;font-size:13.5px;color:inherit;cursor:pointer}'
  + D + '.ca-imb{border-color:rgba(255,255,255,.18);color:#fff}'
  + P + '.ca-imb i{font-style:normal;transition:transform .3s}' + P + '.ca-imb.open i{transform:rotate(180deg)}'
  // GYIK két oszlop
  + P + '.imp-faq{max-width:1080px!important;display:grid!important;grid-template-columns:1fr 1fr;gap:12px!important;align-items:start}'
  + P + '.imp-faq details{border-radius:18px!important;transition:border-color .3s,box-shadow .3s;' + CARD + '}'
  + D + '.imp-faq details{' + CARDD + '}' + D + '.imp-faq summary{color:#fff!important}' + D + '.imp-faq p{color:rgba(255,255,255,.72)!important}'
  + P + '.imp-faq details[open]{border-color:rgba(226,0,26,.28)!important}'
  + P + '.imp-faq details.ca-more{display:none}' + P + '.imp-faq.ca-all details.ca-more{display:block}'
  + P + '.imp-faq a.ca-qlink{color:#E2001A;font-weight:600;text-decoration:underline;text-decoration-color:rgba(226,0,26,.3);text-underline-offset:3px}'
  + D + '.imp-faq a.ca-qlink{color:#FF6B78}'
  + P + '.ca-ifb{grid-column:1/-1;justify-self:center;margin-top:8px;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:999px;border:1px solid rgba(18,19,23,.16);background:transparent;color:inherit;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}'
  + D + '.ca-ifb{border-color:rgba(255,255,255,.2);color:#fff}'
  + '@media(max-width:860px){' + P + '.imp-faq{grid-template-columns:1fr}}'
  + '</style>';

const JS = '<script id="ca-imp-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var root=$("section.imp");if(!root||root.__i)return;root.__i=1;H.classList.add("ca-imp");'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;e.setAttribute("data-dm-skip","1");return e}'
  + 'var sb=$("section.hero .sub",root);if(sb&&!$(".ca-subm",root)){var sm=el("p","ca-subm","Nagyobb választék, jobb állapot, kedvezőbb ár — kulcsrakészen, a nevedre írt forgalmival.");sm.setAttribute("aria-hidden","true");sb.parentNode.insertBefore(sm,sb.nextSibling)}'
  // költség-ikonok
  + 'var IC=' + JSON.stringify(IC) + ';$$(".ic-card .ic-n",root).forEach(function(n){var k=n.textContent.trim();if(IC[k]&&!n.querySelector("svg")){n.classList.add("ca-ico");n.innerHTML=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\'+IC[k]+"</svg><i>"+k+"</i>"}});'
  // SEO Bővebben
  + 'var seo=$(".imp-seo",root);if(seo){var ps=$$(":scope>p",seo);if(ps.length>1){var m=el("div","ca-imore");ps.slice(1).forEach(function(p){m.appendChild(p)});var b=el("button","ca-imb","Bővebben <i>⌄</i>");b.type="button";b.addEventListener("click",function(){var o=m.classList.toggle("open");b.classList.toggle("open",o);b.firstChild.nodeValue=o?"Kevesebb ":"Bővebben "});seo.appendChild(b);seo.appendChild(m)}}'
  // GYIK 6 + összes, horgony
  + 'var fq=$(".imp-faq",root);if(fq){var ds=$$("details",fq);if(ds.length>6){ds.slice(6).forEach(function(d){d.classList.add("ca-more")});var fb=el("button","ca-ifb","Összes kérdés ("+ds.length+") <i>⌄</i>");fb.type="button";fq.appendChild(fb);fb.addEventListener("click",function(){var o=fq.classList.toggle("ca-all");fb.firstChild.nodeValue=o?"Kevesebb kérdés ":"Összes kérdés ("+ds.length+") "})}'
  + 'function hash(){var id=decodeURIComponent(location.hash.slice(1));var d=id&&document.getElementById(id);if(!d||ds.indexOf(d)<0)return;fq.classList.add("ca-all");d.open=true;setTimeout(function(){scrollTo({top:d.getBoundingClientRect().top+scrollY-140,behavior:"smooth"})},250)}hash();addEventListener("hashchange",hash)}'
  // sötét mód inline színek takarítása (a keresőt kihagyva)
  + 'function cln(){$$(".team-card,.team-card *,.imp-team-note,.imp-team-note *,.ic-card,.ic-card *,.ic-cta,.ic-cta *,.ic-opt,.ic-opt *,.imp-seo,.imp-seo *,.imp-faq,.imp-faq *,.imp-head,.imp-head *",root).forEach(function(x){if(x.tagName==="IMG"||x.closest(".ik")||x.classList.contains("tc-flag")||(x.getAttribute("style")||"").indexOf("url(")>-1)return;["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}'
  + '[200,700,1600,3200].forEach(function(t){setTimeout(cln,t)});'
  + '})();</script>';

export function apply(h) {
  const log = { svc: 0, links: 0, miss: [], cta: 0 };
  if (h.indexOf('id="ca-imp-css"') > -1 || h.indexOf('class="imp') < 0) return { h, log };
  h = seo(h, log);
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return { h, log };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(FILE)) { console.log('[hu-imp] nincs', FILE); process.exit(0); }
  const src = fs.readFileSync(FILE, 'utf8');
  const { h, log } = apply(src);
  if (h === src) console.log('[hu-imp] már alkalmazva');
  else { fs.writeFileSync(FILE, h); console.log('[hu-imp] auto-rendeles: linkek', log.links, 'Service törölve', log.svc, log.miss.length ? 'HIÁNYZÓ: ' + log.miss.join(' | ') : ''); }
}
