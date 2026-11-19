// hu-faq.mjs — a három magyar GYIK oldal (bizományos, vásárlási, bérlési) SEO-javítása és egységes, letisztult megjelenése
// SEO (build időben, a HTML-be írva, így a Google biztosan látja):
//   · bizományos GYIK: helyes megosztási cím/leírás (og), statikus FAQPage (a futásidős generátor helyett)
//   · bérlési GYIK: márkanév a címben · mindhárom: BreadcrumbList, h2 kategóriacímek, belső linkek a válaszokban,
//     kérdésenkénti horgony (megosztható link) · a válaszok szövege nem változik
// Megjelenés: fejléc piros kiemeléssel, fent maradó kereső + kategóriák, kártyás kérdések lágy nyitással
// (egyszerre egy), egységes záró kártya, sötét módban átmenetek. Csak ez a három HU oldal, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const SITE = 'https://www.caradvance.hu';
const PAGES = {
  'gyakori-kerdesek': { name: 'Gyakori kérdések — bizományos értékesítés' },
  'vasarlas-gyakori-kerdesek': { name: 'Gyakori kérdések — autóvásárlás' },
  'berles-gyakori-kerdesek': { name: 'Gyakori kérdések — tartós bérlet' },
};

// belső linkek: [kérdés eleje, kifejezés a válaszban, cél]
const LINKS = {
  'vasarlas-gyakori-kerdesek': [
    ['Miért érdemes rajtatok', 'vásárlás előnyei', '/vasarlas-elonyei/'],
    ['Milyen márkákat', 'egyedi autórendelésen', '/egyedi-auto-rendeles/'],
    ['Mit jelent a 19%-os', '19%-os német áfával', '/egyedi-auto-rendeles/'],
    ['Van garancia', 'a helyszínen bevizsgálunk', '/minosegbiztositas/'],
    ['Ti intézitek a behozatalt', 'a szállítást Németországból', '/beszerzesi-folyamat/'],
    ['Lehet finanszírozással', 'finanszírozás–lízing oldalon', '/finanszirozas-lizing/'],
    ['Van lízingkalkulátor', 'finanszírozás–lízing oldalon', '/finanszirozas-lizing/'],
    ['Hogyan indul a vásárlás', 'Böngéssz a modellek között', '/autoink/'],
  ],
  'berles-gyakori-kerdesek': [
    ['Mit jelent a tartós bérlet', 'tartós bérletben', '/tartos-berlet/'],
    ['Kinek éri meg', 'Cégeknek különösen előnyös', '/berles-elonyei/'],
    ['Milyen feltételekkel', 'A konkrét feltételeket', '/berlesi-feltetelek/'],
    ['Milyen autókat lehet', 'bérelhető autóink', '/autoink/#berelheto'],
    ['Hogyan indul a bérlés', 'Kiválasztjuk a megfelelő autót', '/berlesi-folyamat/'],
  ],
  'gyakori-kerdesek': [
    ['Kik vagytok', 'Prémium autóbérléssel', '/tartos-berlet/'],
    ['Kik vagytok', 'eladó prémium használt autókkal', '/autoink/'],
    ['Kik vagytok', 'bizományos autóértékesítéssel', '/eladom/'],
    ['Kell személyesen', 'online űrlapon', '/eladom/#ertekbecsles'],
    ['Miért megbízható', 'bevizsgálunk', '/minosegbiztositas/'],
    ['Ki intézi az átírást', 'az átírás előkészítéséről', '/atiras-kalkulator/'],
    ['Vannak rejtett költségek', 'A sávos díjon', '/ertekesitesi-folyamat/#penzugyek'],
    ['Mi a különbség', 'bizományos eladásra', '/eladom/'],
    ['Mit jelent, hogy a jutalék', 'magyar jótékony szervezeteknek', '/jotekonysag/'],
  ],
};

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const slug = (s) => strip(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const ld = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';

function seo(h, page, log) {
  const canon = SITE + '/' + page + '/';
  // 1) kérdések: horgony + belső linkek (csak a válasz részben, sosem attribútumban)
  const used = new Set();
  h = h.replace(/<details\b([^>]*)>([\s\S]*?)<\/details>/g, (all, attrs, inner) => {
    const sm = inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    if (!sm) return all;
    const q = strip(sm[1]).replace(/\s*\+$/, '');
    let id = slug(q.replace(/\+/g, ' '));
    while (used.has(id)) id += '-2';
    used.add(id);
    if (!/\sid="/.test(attrs)) attrs += ' id="' + id + '"';
    const head = inner.slice(0, sm.index + sm[0].length);
    let body = inner.slice(sm.index + sm[0].length);
    for (const [qs, phrase, url] of LINKS[page] || []) {
      if (!q.startsWith(qs)) continue;
      // csak <a>-n kívül, első előfordulás
      const parts = body.split(/(<a\b[\s\S]*?<\/a>)/);
      let done = false;
      for (let i = 0; i < parts.length && !done; i += 2) {
        const k = parts[i].indexOf(phrase);
        if (k > -1 && !/<[^>]*$/.test(parts[i].slice(0, k))) {
          parts[i] = parts[i].slice(0, k) + '<a class="ca-qlink" href="' + url + '">' + phrase + '</a>' + parts[i].slice(k + phrase.length);
          done = true;
        }
      }
      if (done) { body = parts.join(''); log.links++; } else log.miss.push(qs + ' → ' + phrase);
    }
    return '<details' + attrs + '>' + head + body + '</details>';
  });

  // 2) kategóriacímek h2-ként
  if (page === 'gyakori-kerdesek') {
    h = h.replace(/<h3 class="faq-cat-title"([^>]*)>([\s\S]*?)<\/h3>/g, (a, at, t) => { log.h2++; return '<h2 class="faq-cat-title"' + at + '>' + t + '</h2>'; });
  } else {
    const labels = {};
    h.replace(/<button class="gyik-tab[^"]*" data-cat="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g, (a, c, t) => { labels[c] = t.trim(); return a; });
    const seen = new Set();
    h = h.replace(/<details class="gyik-item" data-cat="([^"]+)"/g, (a, c) => {
      if (seen.has(c) || !labels[c]) return a;
      seen.add(c); log.h2++;
      return '<h2 class="ca-fcat" data-cat="' + c + '">' + labels[c] + '</h2>' + a;
    });
  }

  // 3) fejléc: a második sor piros kiemelésként (bizományosnál nincs span)
  if (page === 'gyakori-kerdesek') h = h.replace(/(<h1[^>]*>Gyakori kérdések —)<br>([^<]+)<\/h1>/, '$1 <br><span class="accent">$2</span></h1>');

  // 4) címek, megosztás
  if (page === 'gyakori-kerdesek') {
    const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
    const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (t) h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, '$1' + t + '$2');
    if (d) h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, '$1' + d + '$2');
    // statikus FAQPage a futásidős generátor helyett
    const items = [];
    h.replace(/<details\b[^>]*class="faq-item"[^>]*>([\s\S]*?)<\/details>/g, (a, inner) => {
      const sm = inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
      const am = inner.match(/<div class="faq-a"[^>]*>([\s\S]*)<\/div>\s*$/);
      if (!sm || !am) return a;
      let ans = am[1].replace(/<table[\s\S]*?<\/table>/, (tb) => {
        const rows = [];
        tb.replace(/<tr data-lo="(\d*)" data-hi="(\d*)" data-min="(\d*)"[^>]*>[\s\S]*?<td class="pct">([^<]*)<\/td>/g, (x, lo, hi, mn, pct) => {
          const f = (n) => String(Number(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          rows.push((hi ? f(lo) + '–' + f(hi) + ' €' : f(lo) + ' € felett') + ': ' + pct + ' (minimum ' + f(mn) + ' €)');
          return x;
        });
        return ' Sávok: ' + rows.join('; ') + '. ';
      });
      items.push({ '@type': 'Question', name: strip(sm[1]), acceptedAnswer: { '@type': 'Answer', text: strip(ans) } });
      return a;
    });
    h = h.replace(/<script>\(function\(\)\{try\{var items=\[\]\.slice\.call\(document\.querySelectorAll\('\.faq-item'\)\);var faqs=[\s\S]*?<\/script>/, () => { log.gen = 1; return ''; });
    if (items.length) { h = h.replace('</head>', () => ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items }) + '</head>'); log.faq = items.length; }
  }
  if (page === 'berles-gyakori-kerdesek') {
    h = h.replace('<title>Gyakori kérdések a tartós bérletről (6 hónaptól)</title>', '<title>Gyakori kérdések a tartós bérletről (6 hónaptól) | CarAdvance</title>');
    h = h.replace('content="Gyakori kérdések a tartós bérletről (6 hónaptól)"', 'content="Gyakori kérdések a tartós bérletről (6 hónaptól) | CarAdvance"');
    h = h.replace('content="Gyakori kérdések a tartós bérletről (6 hónaptól)"', 'content="Gyakori kérdések a tartós bérletről (6 hónaptól) | CarAdvance"');
  }
  // 5) morzsamenü-jelölés
  h = h.replace('</head>', () => ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Főoldal', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: PAGES[page].name, item: canon },
  ] }) + '</head>');
  return h;
}

const P = 'html.ca-faq body ';
const D = 'html.ca-faq.ca-dark body ';
const LN = 'rgba(18,19,23,.08)';
const CARD = 'background:#fff!important;border:1px solid ' + LN + '!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 8px 22px rgba(18,19,23,.05)!important;';
const CARDD = 'background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;';
const ITEM = ':is(.faq-item,.gyik-item)';
const SUM = ITEM + '>summary';

const CSS = '<style id="ca-faq-css">'
  // közös háttér: nincs éles sávhatár
  + P + ':is(.cah>section.block,section.section#gyik){background:transparent!important;background-color:transparent!important}'
  // ---- fejléc
  + P + 'section.hero .brand-logo{display:none!important}'
  + D + 'section.hero{background:transparent!important;background-image:none!important}'
  + P + 'section.hero video{filter:brightness(.58) saturate(1.05)}'
  + P + 'section.hero :is(h1,.sub){text-shadow:0 2px 24px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.35)}'
  + P + 'section.hero h1 .accent{color:#F0182F!important;-webkit-text-fill-color:#F0182F!important;background:none!important;text-shadow:0 2px 18px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)!important}'
  + P + 'section.hero .sub{max-width:660px!important;margin-left:auto!important;margin-right:auto!important}'
  + P + 'section.hero .scrolldown{color:rgba(18,19,23,.62)!important;background:none!important;border:0!important;text-shadow:none!important;flex-direction:column!important;align-items:center!important;gap:4px!important;font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase}'
  + D + 'section.hero .scrolldown{color:rgba(255,255,255,.7)!important}'
  + P + 'section.hero .scrolldown svg{animation:caQBob 1.8s ease-in-out infinite}'
  + '@keyframes caQBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}'
  + '@media(max-width:640px){' + P + 'section.hero .scrolldown{display:none!important}' + P + 'section.hero .cta-row{flex-wrap:nowrap!important;gap:8px!important;justify-content:center}' + P + 'section.hero .cta-row .btn{padding:12px 15px!important;font-size:14px!important;white-space:nowrap}}'
  // ---- bevezető középre
  + P + ':is(#kategoriak,#gyik) :is(.eyebrow){display:table!important;margin-left:auto!important;margin-right:auto!important}'
  + P + ':is(#kategoriak,#gyik) :is(.sec-title,.sec-lead,.sec-intro){text-align:center!important;margin-left:auto!important;margin-right:auto!important;max-width:640px}'
  // ---- ragadós kereső + kategóriák
  + P + '.ca-qbar{position:sticky;top:84px;z-index:30;max-width:880px;margin:26px auto 8px;padding:10px;border-radius:22px;' + CARD + '}'
  + D + '.ca-qbar{background:rgba(24,25,30,.96)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 10px 30px rgba(0,0,0,.35)!important}'
  + P + '.ca-qbar :is(.faq-search,#gyikSearch){margin:0!important;max-width:none!important;width:100%!important}'
  + P + '.ca-qbar .faq-search{position:relative}'
  + P + '.ca-qbar :is(#faqq,#gyikSearch){width:100%!important;height:46px!important;border-radius:999px!important;border:1px solid ' + LN + '!important;background:#F5F5F7 url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27%3E%3Ccircle cx=%277%27 cy=%277%27 r=%275.5%27/%3E%3Cpath d=%27m11 11 4 4%27/%3E%3C/svg%3E") 16px 50%/16px no-repeat!important;padding:0 18px 0 42px!important;font-family:inherit!important;font-size:15px!important;color:inherit!important;box-shadow:none!important;outline:none}'
  + P + '.ca-qbar .faq-search>svg{display:none!important}'
  + D + '.ca-qbar :is(#faqq,#gyikSearch){background-color:rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.1)!important;color:#fff!important}'
  + P + '.ca-qbar :is(#faqq,#gyikSearch):focus{border-color:#E2001A!important}'
  + P + '.ca-qbar :is(.faq-tabs,.gyik-tabs){display:flex!important;flex-wrap:wrap;gap:6px!important;margin:10px 0 0!important;justify-content:center}'
  + P + '.ca-qbar :is(.faq-tab,.gyik-tab){height:36px!important;padding:0 15px!important;border-radius:999px!important;border:1px solid ' + LN + '!important;background:transparent!important;color:inherit!important;font-family:inherit!important;font-weight:600!important;font-size:13.5px!important;cursor:pointer;box-shadow:none!important;transition:all .2s}'
  + D + '.ca-qbar :is(.faq-tab,.gyik-tab){border-color:rgba(255,255,255,.12)!important;color:rgba(255,255,255,.85)!important}'
  + P + '.ca-qbar :is(.faq-tab.on,.gyik-tab.is-active){background:#121317!important;border-color:#121317!important;color:#fff!important}'
  + D + '.ca-qbar :is(.faq-tab.on,.gyik-tab.is-active){background:#fff!important;border-color:#fff!important;color:#121317!important}'
  + '@media(max-width:760px){' + P + '.ca-qbar{top:76px;border-radius:18px;margin-left:-4px;margin-right:-4px}' + P + '.ca-qbar :is(.faq-tabs,.gyik-tabs){flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;-webkit-mask:linear-gradient(90deg,#000 88%,transparent);mask:linear-gradient(90deg,#000 88%,transparent)}' + P + '.ca-qbar :is(.faq-tabs,.gyik-tabs)::-webkit-scrollbar{display:none}' + P + '.ca-qbar :is(.faq-tab,.gyik-tab){flex:0 0 auto}}'
  // ---- lista és kategóriacímek
  + P + '#faqbody .faq-cat{padding-top:0!important;padding-bottom:0!important}'
  + P + ':is(#faqbody .faq-list,.gyik-list){max-width:880px!important;margin-left:auto!important;margin-right:auto!important;display:flex!important;flex-direction:column!important;gap:10px!important}'
  + P + ':is(.faq-cat-title,.ca-fcat){max-width:880px;margin:44px auto 14px!important;font-size:clamp(20px,2.2vw,24px)!important;font-weight:800!important;letter-spacing:-.02em;display:flex;align-items:center;gap:10px;color:inherit}'
  + P + ':is(.faq-cat-title,.ca-fcat)::before{content:"";width:6px;height:22px;border-radius:3px;background:#E2001A;flex:0 0 auto}'
  + P + '.gyik-list>.ca-fcat:first-child{margin-top:18px!important}'
  + P + ':is(.gyik-wrap,.gyik-list,#faqbody){text-align:left!important}' + P + ':is(.faq-cat-title,.ca-fcat){justify-content:flex-start!important;text-align:left!important;width:100%}'
  + P + '.ca-fcat.ca-hide{display:none!important}'
  // ---- kérdéskártyák
  + P + ITEM + '{border-radius:18px!important;overflow:hidden;margin:0!important;padding:0!important;transition:box-shadow .3s,border-color .3s;' + CARD + '}'
  + D + ITEM + '{' + CARDD + '}'
  + P + ITEM + '[open]{border-color:rgba(226,0,26,.25)!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 18px 40px rgba(18,19,23,.08)!important}'
  + D + ITEM + '[open]{border-color:rgba(255,77,94,.3)!important}'
  + P + SUM + '{list-style:none!important;cursor:pointer;display:flex!important;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 18px 22px!important;font-size:16px!important;font-weight:700!important;line-height:1.35!important;color:inherit!important;background:none!important;border:0!important}'
  + P + SUM + '::-webkit-details-marker{display:none}'
  + P + SUM + '::before{display:none!important;content:none!important}'
  + P + SUM + ' .pl{display:none!important}'
  // egységes +/× ikon (mint az összes többi magyar oldalon): piros kör, rajzolt fehér kereszt, pontosan középen
  + P + SUM + '::after{content:""!important;position:static!important;flex:0 0 28px!important;width:28px!important;height:28px!important;border-radius:50%!important;border:0!important;background:linear-gradient(#fff,#fff) center/12px 2px no-repeat,linear-gradient(#fff,#fff) center/2px 12px no-repeat,#E2001A!important;background-color:#E2001A!important;box-shadow:0 4px 12px rgba(226,0,26,.25)!important;transform:none!important;transition:transform .35s cubic-bezier(.2,.8,.2,1)!important}'
  + P + ITEM + '[open]>summary::after{transform:rotate(45deg)!important}'
  + D + SUM + '{color:#fff!important}'
  + P + ITEM + ' :is(.faq-a,.ca-ans){padding:0 22px 20px!important;font-size:15px!important;line-height:1.65!important;margin:0!important;border:0!important;background:none!important}'
  + P + ITEM + ' .ca-ans>p{margin:0 0 10px!important}' + P + ITEM + ' .ca-ans>p:last-child{margin-bottom:0!important}'
  + D + ITEM + ' :is(.faq-a,.ca-ans){color:rgba(255,255,255,.75)!important}'
  + P + ITEM + ' a.ca-qlink,' + P + ITEM + ' :is(.faq-a,.ca-ans) a{color:#E2001A!important;font-weight:600;text-decoration:underline;text-decoration-color:rgba(226,0,26,.3);text-underline-offset:3px}'
  + D + ITEM + ' :is(.faq-a,.ca-ans) a{color:#FF6B78!important}'
  + P + ITEM + '.ca-flash{animation:caQFlash 1.6s ease}'
  + '@keyframes caQFlash{0%,40%{box-shadow:0 0 0 3px rgba(226,0,26,.35),0 18px 40px rgba(18,19,23,.08)}100%{}}'
  + P + ':is(#faqnores,#gyikEmpty){max-width:880px;margin:20px auto!important;text-align:center;opacity:.7}'
  // ---- záró kártya
  + P + '#kapcsolat>.wrap,' + P + '.el-cta{position:relative;overflow:hidden;max-width:1080px!important;width:auto!important;box-sizing:border-box!important;margin:30px auto 60px!important;border-radius:32px!important;background:#121317!important;color:#fff!important;padding:56px 28px!important;text-align:center!important;display:block!important;border:0!important;box-shadow:none!important}'
  + P + ':is(#kapcsolat>.wrap,.el-cta)::before{content:"";position:absolute;inset:auto -10% -60% -10%;height:120%;background:radial-gradient(50% 50% at 50% 50%,rgba(226,0,26,.28),transparent 70%)!important;background-color:transparent!important;pointer-events:none}'
  + P + ':is(#kapcsolat>.wrap,.el-cta)>*{position:relative}'
  + P + ':is(#kapcsolat,.el-cta) :is(h2,.sec-title){color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:clamp(26px,3.2vw,36px)!important;font-weight:800!important;letter-spacing:-.02em;margin:0 0 10px!important;text-align:center!important}'
  + P + ':is(#kapcsolat,.el-cta) :is(p,.sec-lead){color:rgba(255,255,255,.75)!important;max-width:520px;margin:0 auto 24px!important;text-align:center!important}'
  + P + ':is(#kapcsolat,.el-cta) .btn{margin:4px!important}'
  + P + ':is(#kapcsolat .btn-primary,.el-cta .btn){background:#E2001A!important;border:1px solid #E2001A!important;color:#fff!important;box-shadow:0 10px 30px rgba(226,0,26,.35)!important}'
  + P + '#kapcsolat .btn-white{background:transparent!important;border:1px solid rgba(255,255,255,.25)!important;color:#fff!important;box-shadow:none!important}'
  + D + ':is(#kapcsolat>.wrap,.el-cta){background:transparent!important;max-width:none!important;border-radius:0!important}'
  + D + ':is(#kapcsolat>.wrap,.el-cta)::before{inset:10% 15%;height:auto;background:radial-gradient(50% 50% at 50% 55%,rgba(226,0,26,.16),transparent 72%)!important}'
  + '@media(max-width:1120px){' + P + ':is(#kapcsolat>.wrap,.el-cta){margin-left:16px!important;margin-right:16px!important}' + D + ':is(#kapcsolat>.wrap,.el-cta){margin-left:auto!important;margin-right:auto!important}}'
  + '</style>';

const JS = '<script id="ca-faq-js">(function(){var H=document.documentElement;'
  + 'function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}'
  + 'var items=$$(".faq-item,.gyik-item");if(!items.length||H.__faq)return;H.__faq=1;H.classList.add("ca-faq");'
  // kereső + kategóriák egy ragadós sávba
  + 'var srch=$(".faq-search")||$("#gyikSearch"),tabs=$(".faq-tabs")||$(".gyik-tabs");if(srch&&tabs){var bar=document.createElement("div");bar.className="ca-qbar";bar.setAttribute("data-dm-skip","1");srch.parentNode.insertBefore(bar,srch);bar.appendChild(srch);bar.appendChild(tabs)}'
  // válasz-burkoló a lágy nyitáshoz (vásárlás/bérlés)
  + 'items.forEach(function(d){var s=d.querySelector("summary");if(!s)return;var a=d.querySelector(".faq-a,.ca-ans");if(!a){a=document.createElement("div");a.className="ca-ans";while(s.nextSibling)a.appendChild(s.nextSibling);d.appendChild(a)}d.__a=a;'
  + 's.addEventListener("click",function(e){e.preventDefault();tog(d)})});'
  + 'var RM=matchMedia("(prefers-reduced-motion: reduce)").matches;'
  + 'function anim(d,open){var a=d.__a;if(d.__an)d.__an.cancel();if(RM||!a.animate){d.open=open;return}if(open){d.open=true;var h=a.scrollHeight;d.__an=a.animate([{height:"0px",opacity:0},{height:h+"px",opacity:1}],{duration:420,easing:"cubic-bezier(.2,.8,.2,1)"});d.__an.onfinish=function(){d.__an=null}}else{var h2=a.offsetHeight;d.__an=a.animate([{height:h2+"px",opacity:1},{height:"0px",opacity:0}],{duration:300,easing:"cubic-bezier(.4,0,.2,1)"});d.__an.onfinish=function(){d.open=false;d.__an=null}}}'
  + 'function tog(d){var o=!d.open||d.__closing;if(o){items.forEach(function(x){if(x!==d&&x.open)anim(x,false)});anim(d,true);if(d.id&&history.replaceState)history.replaceState(null,"","#"+d.id)}else anim(d,false)}'
  // horgonyos link: kinyitja és odagörget
  + 'function hash(){var id=decodeURIComponent(location.hash.slice(1));if(!id)return;var d=document.getElementById(id);if(!d||items.indexOf(d)<0)return;d.hidden=false;d.open=true;setTimeout(function(){var y=d.getBoundingClientRect().top+scrollY-170;scrollTo({top:y,behavior:"smooth"});d.classList.add("ca-flash");setTimeout(function(){d.classList.remove("ca-flash")},1700)},300)}'
  + 'hash();addEventListener("hashchange",hash);'
  // kategóriacímek elrejtése szűréskor (vásárlás/bérlés)
  + 'var heads=$$(".ca-fcat");function sync(){heads.forEach(function(h){var c=h.getAttribute("data-cat"),any=items.some(function(i){return i.getAttribute("data-cat")===c&&!i.hidden});h.classList.toggle("ca-hide",!any)})}'
  + 'if(heads.length){var sI=$("#gyikSearch");if(sI)sI.addEventListener("input",function(){setTimeout(sync,0)});$$(".gyik-tab").forEach(function(t){t.addEventListener("click",function(){setTimeout(sync,0)})});sync()}'
  // Görgess a kérdésekhez
  + 'var sd=$("section.hero .scrolldown");if(sd){sd.removeAttribute("onclick");sd.addEventListener("click",function(e){e.preventDefault();var t=$("#kategoriak")||$("#gyik");if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-80,behavior:"smooth"})})}'
  // sötét mód inline színeinek takarítása
  + 'function cln(){$$(".ca-qbar,.ca-qbar *,.faq-item,.faq-item *,.gyik-item,.gyik-item *,.ca-fcat,.faq-cat-title,#kapcsolat .btn,.el-cta,.el-cta *").forEach(function(x){["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)});x.setAttribute("data-dm-skip","1")})}'
  + '[200,700,1600,3200].forEach(function(t){setTimeout(cln,t)});'
  + '})();</script>';

export function apply(h, page) {
  const log = { links: 0, miss: [], h2: 0, faq: 0, gen: 0 };
  if (h.indexOf('id="ca-faq-css"') > -1) return { h, log };
  h = seo(h, page, log);
  h = h.replace('</head>', () => CSS + '</head>');
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => JS + '</body>');
  return { h, log };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  for (const page of Object.keys(PAGES)) {
    const f = path.join(DIST, page, 'index.html');
    if (!fs.existsSync(f)) { console.log('[hu-faq] nincs', f); continue; }
    const src = fs.readFileSync(f, 'utf8');
    const { h, log } = apply(src, page);
    if (h === src) { console.log('[hu-faq] már alkalmazva:', page); continue; }
    fs.writeFileSync(f, h);
    console.log('[hu-faq]', page, 'linkek:', log.links, 'h2:', log.h2, 'FAQPage:', log.faq, log.miss.length ? 'HIÁNYZÓ: ' + log.miss.join(' | ') : '');
  }
}
