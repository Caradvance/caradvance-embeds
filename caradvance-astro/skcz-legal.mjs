/**
 * CarAdvance — caradvance.sk / caradvance.cz: áfa- és jogi szövegek (a skcz-local.mjs hívja minden sk/cs HTML-re)
 *
 * Mr. JOB SK javaslata (2026-10-23) alapján:
 *   - nincs általános 19%-os német áfa-ígéret (új autónál soha; használtnál csak németországi saját átvételnél),
 *   - bérlés: a nettó céges ár látszik, magánszemélynek egyedi ajánlat,
 *   - a Mr. Job SK s.r.o. „obchodný sprostredkovateľ” (cs: „obchodní zprostředkovatel”), nem képviselet,
 *   - biztosítás / lízing: nem közvetítünk, a partner keresi meg az ügyfelet,
 *   - szavatosság („zodpovednosť za vady”) a „záruka” helyett, egyéni önrész, egységes határidők,
 *   - használt autó: a fogyasztói végár (áfával) az első ár, mellette a céges nettó ár.
 * A szövegek a skcz-legal-data.mjs-ben vannak.
 */
import fs from 'node:fs';
import { LEGAL } from './skcz-legal-data.mjs';
import { P3 } from './skcz-p3-data.mjs';

const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
function elEnd(s, i) {
  const m = /^<([a-z][a-z0-9-]*)\b[^>]*?(\/?)>/i.exec(s.slice(i, i + 4000));
  if (!m) return -1;
  const tag = m[1].toLowerCase();
  if (VOID.test(tag) || m[2] === '/') return i + m[0].length;
  const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
  re.lastIndex = i + m[0].length;
  let depth = 1, x;
  while ((x = re.exec(s))) {
    if (x[1]) { if (--depth === 0) return x.index + x[0].length; }
    else if (!/\/>$/.test(x[0])) depth++;
  }
  return -1;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function applyRules(s, rules, st, key) {
  for (const [a, b] of rules) {
    const o = s;
    s = typeof a === 'string' ? s.split(a).join(b) : s.replace(a, b);
    if (s !== o && st) st[key] = (st[key] || 0) + 1;
  }
  return s;
}
function faqPick(list, q, rel) {
  for (const f of list) if (f[0].test(q) && (!f[3] || f[3].test(rel))) return f;
  return null;
}

/* ---------- GYIK: HTML <details> ---------- */
function faqHtml(h, L, rel, st) {
  const re = /<details\b[^>]*>/g;
  let out = '', pos = 0, m;
  while ((m = re.exec(h))) {
    const end = elEnd(h, m.index);
    if (end < 0) continue;
    let blk = h.slice(m.index, end);
    const sm = /<summary\b[^>]*>([\s\S]*?)<\/summary>/.exec(blk);
    if (sm) {
      const q = plain(sm[1]).replace(/\s*[+−–-]\s*$/, '').trim();
      const f = faqPick(L.FAQ, q, rel);
      if (f) {
        let si = sm[1];
        if (f[1]) si = si.replace(/^(\s*)([^<]+)/, (a, sp, t) => sp + esc(f[1]) + (/\s$/.test(t) ? ' ' : ''));
        let nb = blk.slice(0, sm.index) + sm[0].replace(sm[1], si);
        let rest = blk.slice(sm.index + sm[0].length);
        const am = /<(p|div)\b[^>]*>/.exec(rest);
        if (am) {
          const ae = elEnd(rest, am.index);
          if (ae > 0) rest = rest.slice(0, am.index) + am[0] + esc(f[2]) + '</' + am[1] + '>' + rest.slice(ae);
        }
        blk = nb + rest;
        st.faq = (st.faq || 0) + 1;
      }
    }
    out += h.slice(pos, m.index) + blk;
    pos = end;
    re.lastIndex = end;
  }
  return out + h.slice(pos);
}

/* ---------- JSON-LD ---------- */
function fixLd(o, L, l, rel, site, st) {
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      if (v['@type'] === 'Question' && typeof v.name === 'string') {
        const f = faqPick(L.FAQ, v.name.trim(), rel);
        if (f) {
          if (f[1]) v.name = f[1];
          if (v.acceptedAnswer && typeof v.acceptedAnswer === 'object') v.acceptedAnswer.text = f[2];
          st.faqld = (st.faqld || 0) + 1;
        }
      }
      // Mr. Job SK: nem „Caradvance Hungary”, és a saját domainre mutat (B29)
      if (typeof v.name === 'string' && /Mr\.?\s?Job/i.test(v.name)) {
        delete v.alternateName;
        if (typeof v.url === 'string' && /caradvance\.hu/.test(v.url)) v.url = site + '/';
      }
      // AutoDealer / Organization a főoldalon: saját domain, saját ország
      if (/AutoDealer|LocalBusiness/.test(String(v['@type'])) && typeof v.url === 'string' && /caradvance\.hu\/?$/.test(v.url)) {
        v.url = site + '/';
        if (v.areaServed === 'HU') v.areaServed = L.PRICE.cc;
      }
      for (const k of Object.keys(v)) v[k] = walk(v[k]);
      return v;
    }
    if (typeof v === 'string') return applyRules(v, L.RULES, null);
    return v;
  };
  return walk(o);
}

/* ---------- Ár-blokk: használt autó adatlapja (B2/G1) ---------- */
let CZK = 24.47;
try { CZK = +JSON.parse(fs.readFileSync('src/i18n/intl-map.json', 'utf8')).fx.CZK || CZK; } catch (e) {}
const nb = (s) => s.replace(/\s/g, ' ');
const fmtE = (n) => nb(Math.round(n).toLocaleString('sk-SK')) + ' €';
const fmtK = (n) => nb((Math.round(n * CZK / 10) * 10).toLocaleString('cs-CZ')) + ' Kč';
const mainOf = (l, eur) => (l === 'cs' ? fmtK(eur) : fmtE(eur));             // a fő ár: sk → €, cs → Kč (a szerződés pénzneme €)
const subOf = (l, eur) => (l === 'cs' ? fmtE(eur) + ' (≈ ' + fmtK(eur) + ')' : fmtE(eur));
function priceBlock(h, L, l, contact, st) {
  const P = L.PRICE;
  const re = new RegExp('<div data-eur="(\\d+(?:\\.\\d+)?)" data-net="[^"]*">\\s*<div class="plabel">' + P.label + '</div>\\s*<div class="price" data-main[^>]*>[^<]*</div>\\s*<div class="peur">[^<]*</div>\\s*</div>\\s*<div class="taxnote">[^<]*</div>', 'g');
  return h.replace(re, (all, e) => {
    const eur = +e; if (!eur) return all;
    st.price = (st.price || 0) + 1;
    return '<div class="ca-vat" data-eur="' + e + '">' +
      '<div class="plabel">' + P.del + '</div>' +
      '<div class="price">' + mainOf(l, eur * P.vat) + '</div>' +
      '<div class="peur" style="font-size:14px">' + (l === 'cs' ? fmtE(eur * P.vat) + ' · ' : '') + P.incl + '</div>' +
      '<div class="ca-vatv" style="margin-top:12px;font-size:14px;line-height:1.45"><b>' + subOf(l, eur * 1.19) + '</b> ' + P.pick + '</div>' +
      '<div class="ca-vatv" style="margin-top:8px;font-size:14px;line-height:1.45"><b>' + subOf(l, eur) + '</b> ' + P.co + '</div>' +
      '</div><div class="taxnote">' + P.call + ' <a href="tel:' + contact.tel + '">' + contact.phone + '</a> ' + P.call2 + '</div>';
  });
}
/* Kártyák (lista, főoldal, hasonló autók): az első ár a fogyasztói végár áfával, alatta a céges nettó */
function cardPrices(h, L, l, st) {
  const P = L.PRICE, V = String(P.vat);
  // statikus kártyák (generate.mjs): az áthúzott „magyar bruttó” és a megtakarítás a magyar 27%-hoz mért — kimarad
  h = h.replace(/<div class="pricerow" data-eur="(\d+(?:\.\d+)?)"(?: data-net="[^"]*")?>(?:<span class="pcross"[^>]*>[^<]*<\/span>)?<span class="price" data-main[^>]*>[^<]*<\/span><span class="peur">[^<]*<\/span>(?:<span class="psave"[^>]*>[^<]*<\/span>)?<\/div>/g, (all, e) => {
    const eur = +e; if (!eur) return all;
    st.scard = (st.scard || 0) + 1;
    return '<div class="pricerow" data-eur="' + e + '"><span class="price">' + mainOf(l, eur * P.vat) + '</span><span class="peur">' + P.with + ' · ' + fmtE(eur) + ' ' + P.net + '</span></div>';
  });
  // JS-ből rajzolt kártyák
  const M = (x) => (l === 'cs' ? "(Math.round(" + x + "*" + CZK + "/10)*10).toLocaleString('cs-CZ')+' Kč'" : "Math.round(" + x + ").toLocaleString('sk-SK')+' €'");
  const pairs = [
    ["'<div class=\"pricerow\"><span class=\"price\">'+esc(ft(priceFt(car.eurNet)))+'</span><span class=\"peur\">'+esc(eur(car.eurNet))+'</span></div>'",
     "'<div class=\"pricerow\"><span class=\"price\">'+esc(" + M('car.eurNet*' + V) + ")+'</span><span class=\"peur\">'+esc('" + P.with + " · '+Math.round(car.eurNet).toLocaleString('sk-SK')+' € " + P.net + "')+'</span></div>'"],
    ["+'<div class=\"pricerow\"><span class=\"price\">'+esc(R.fmtFt(huf))+'</span><span class=\"peur\">'+Math.round(c.eur/1.19).toLocaleString('hu-HU')+' €</span></div>'",
     "+'<div class=\"pricerow\"><span class=\"price\">'+" + M('c.eur/1.19*' + V) + "+'</span><span class=\"peur\">" + P.with + " · '+Math.round(c.eur/1.19).toLocaleString('sk-SK')+' € " + P.net + "</span></div>'"]
  ];
  for (const [a, b] of pairs) if (h.includes(a)) { h = h.split(a).join(b); st.cards = (st.cards || 0) + 1; }
  return h;
}

/* ---------- Bérlési ár-táblázat: a „Pre súkromné osoby” oszlop törlése ---------- */
function dropPrivCol(h, st) {
  return h.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, (t) => {
    const hm = /<thead\b[^>]*>[\s\S]*?<\/thead>/.exec(t);
    if (!hm) return t;
    const ths = hm[0].match(/<th\b[^>]*>[\s\S]*?<\/th>/g) || [];
    const idx = ths.findIndex((x) => /^(Pre súkromné osoby|Pro soukromé osoby)$/.test(plain(x)));
    if (idx < 0) return t;
    st.col = 1;
    return t.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/g, (tr) => {
      let i = -1;
      return tr.replace(/<(t[hd])\b[^>]*>[\s\S]*?<\/\1>/g, (c) => (++i === idx ? '' : c));
    });
  });
}

/* ---------- Lízing / financovanie oldal (B33): csak kapcsolatfelvétel, a szerződést a lízingcég köti ---------- */
function financePage(h, L, st) {
  const F = L.FIN;
  const a = h.indexOf('<section class="fl"'); if (a < 0) return h;
  const b = elEnd(h, a); if (b < 0) return h;
  let fl = h.slice(a, b);
  const hs = fl.indexOf('<section class="hero"'); const he = hs >= 0 ? elEnd(fl, hs) : -1;
  if (hs < 0 || he < 0) return h;
  let hero = fl.slice(hs, he)
    .replace(/<div class="fl-herologos"[\s\S]*?<\/span><\/div>/, '')
    .replace(/(<p class="sub[^"]*"[^>]*>)[\s\S]*?(<\/p>)/, '$1' + esc(F.sub) + '$2')
    .replace(/<a class="btn btn-primary" href="#kalkulator"[^>]*>[^<]*<\/a>/, '<a class="btn btn-primary" href="' + F.href + '">' + esc(F.cta) + '</a>');
  const cid = (/data-astro-cid-[a-z0-9]+/.exec(hero) || [''])[0];
  const A = cid ? ' ' + cid + '=""' : '';
  const sec = '<section class="section" style="padding-top:56px"' + A + '><div class="wrap center"' + A + '><span class="eyebrow"' + A + '>' + esc(F.eyebrow) + '</span><h2 class="sec-title"' + A + '>' + esc(F.h2) + '</h2><p class="sec-intro"' + A + ' style="max-width:760px;margin-left:auto;margin-right:auto">' + esc(F.p) + '</p><div class="cta-row" style="justify-content:center;margin-top:22px"' + A + '><a class="btn btn-primary" href="' + F.href + '"' + A + '>' + esc(F.cta) + '</a></div></div></section>';
  const open = fl.slice(0, fl.indexOf('>') + 1);
  h = h.slice(0, a) + open + ' ' + hero + ' ' + sec + ' </section>' + h.slice(b);
  // kalkulátor / partnerek / GYIK strukturált adatai ki, leírás frissítve
  h = h.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"(?:FAQPage|FinancialProduct|WebApplication)"[\s\S]*?<\/script>/g, '');
  h = h.replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*(")/g, '$1' + esc(F.desc) + '$2');
  st.fin = 1;
  return h;
}

/* ---------- 3. fázis: kapcsolat-oldal, import-kapcsolattartó, értékelések (C10, C14) ---------- */
const FLAG = (codes) => codes.split(/ +/).filter(Boolean).map((c) => '<span class="kap-rflag" style="background-image:url(https://flagcdn.com/w40/' + c + '.png)"></span>').join('');
const telOf = (p) => p.replace(/[^\d+]/g, '');
function contactPage(h, Q, st) {
  const C = Q.CONTACT; if (!C || h.indexOf('class="kap-hero"') < 0) return h;
  const a = h.indexOf('<div class="kap-hero"'); const b = elEnd(h, a);
  if (a < 0 || b < 0) return h;
  h = h.slice(0, a) + h.slice(b);                                   // magyar megyetérkép + régiós kapcsolattartók ki
  h = h.replace(/(<p class="kaphero-sub"[^>]*>)[\s\S]*?(<\/p>)/, '$1' + esc(C.sub) + '$2')
    .replace(/(<img class="kaphero-bg" src=")[^"]*(")/, '$1/bmw-m3-touring-premium-auto-eladas.webp$2')
    .replace(/(<div class="kap-sec-title"[^>]*>)[^<]*(<\/div>)/, '$1' + esc(C.teamTitle) + '$2')
    .replace(/(<p class="kap-sec-sub"[^>]*>)[^<]*(<\/p>)/, '$1' + esc(C.teamSub) + '$2')
    .replace(/<div class="kap-team-scroll" style="margin-top:6px"><div class="kap-team" id="kap-team2"><\/div><\/div>/, '');
  const chip = (ic, t, href) => href ? '<a class="kap-chip' + (href.indexOf('wa.me') >= 0 ? ' kap-wa' : '') + '" href="' + href + '"' + (href.indexOf('wa.me') >= 0 ? ' target="_blank" rel="noopener"' : '') + '><span class="ic">' + ic + '</span>' + esc(t) + '</a>' : '<span class="kap-chip"><span class="ic">' + ic + '</span>' + esc(t) + '</span>';
  const O = C.office;
  const office = '<div class="kap-office-body" style="grid-column:1/-1"><div class="kap-office-name">' + esc(O.name) + '</div><div class="kap-office-role">' + esc(O.role) + '</div><p class="kap-office-bio">' + esc(O.bio) + '</p><div class="kap-office-chips">' +
    chip('🕘', O.hours) + chip('📍', O.addr) + chip('✉', O.email, 'mailto:' + O.email) + chip('✆', '+421 915 410 555', 'tel:+421915410555') + chip('🟢', 'WhatsApp', 'https://wa.me/421915410555') + '</div></div>';
  const team = C.team.map((t) => '<div class="kap-card"><div class="kap-photo"><img src="' + t.img + '" alt="' + esc(t.name) + '" loading="lazy"></div><div class="body"><div class="nm">' + esc(t.name) + '<span class="kap-flags">' + FLAG(t.flags) + '</span></div><div class="rl">' + esc(t.role) + '</div><div class="bio">' + esc(t.bio) + '</div><div class="cc">' +
    chip('✆', t.phone, 'tel:' + telOf(t.phone)) + chip('🟢', 'WhatsApp', 'https://wa.me/' + telOf(t.phone).replace('+', '')) + chip('✉', O.email, 'mailto:' + O.email) + '</div></div></div>').join('');
  h = h.replace(/<div class="kap-office" id="kap-office"><\/div>/, '<div class="kap-office" id="kap-office">' + office + '</div>');
  h = h.replace(/<div class="kap-team" id="kap-team"><\/div>/, '<div class="kap-team" id="kap-team">' + team + '</div>');
  // a régi (magyar csapatot, megyetérképet rajzoló) script ki
  h = h.replace(/<script>\s*\(function\(\)\{\s*var COUNTIES = [\s\S]*?<\/script>/, '');
  h = h.replace(/<script>\s*\(function\(\)\{\s*var AT='\\u0040'[\s\S]*?<\/script>/, '');
  st.contact = 1;
  return h;
}
function importCard(h, Q, st) {
  const I = Q.IMPORT; if (!I) return h;
  return h.replace(/<article class="team-card"[^>]*>[\s\S]*?<\/article>/g, (art) => {
    if (art.indexOf('Tóth Károly') < 0) return art;
    st.imp = 1;
    return art
      .replace(/(<div class="tc-photo"[^>]*><img src=")[^"]*(" alt=")[^"]*(")/, '$1' + I.img + '$2' + esc(I.alt) + '$3')
      .replace(/(<span class="tc-role"[^>]*>)[^<]*(<\/span>)/, '$1' + esc(I.role) + '$2')
      .replace(/(<h3 class="tc-name"[^>]*>)[^<]*(<\/h3>)/, '$1' + esc(I.name) + '$2')
      .replace(/(<div class="tc-flags"[^>]*>)[\s\S]*?(<\/div>)/, (m, o, c) => o + I.flags.map(([f, t]) => '<span class="tc-flag" style="background-image:url(https://flagcdn.com/w80/' + f + '.png)" title="' + t + '"></span>').join('') + c)
      .replace(/(<p class="tc-bio"[^>]*>)[\s\S]*?(<\/p>)/, '$1' + esc(I.bio) + '$2')
      .replace(/(<a class="tc-chip" href="mailto:)[^"]*("[^>]*>[\s\S]*?<\/svg>)\s*[^<]*(<\/a>)/, '$1' + I.email + '$2 ' + I.email + '$3');
  });
}
function reviewsLd(h, st) {
  if (h.indexOf('"@type":"Review"') < 0) return h;
  const SKT = {};
  h.replace(/<span class="ref-rev-id"[^>]*><b[^>]*>([^<]+)<\/b>[\s\S]*?<p class="ref-rev-text"[^>]*>([\s\S]*?)<\/p>/g, (m, n, t) => { SKT[n.trim()] = plain(t); return m; });
  return h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, a, js, b) => {
    if (js.indexOf('"Review"') < 0) return all;
    try {
      const fix = (v) => {
        if (Array.isArray(v)) return v.filter((x) => !(x && x['@type'] === 'Review' && !SKT[(x.author && x.author.name || '').trim()])).map(fix);
        if (v && typeof v === 'object') {
          if (v['@type'] === 'Review') { const n = (v.author && v.author.name || '').trim(); if (SKT[n]) v.reviewBody = SKT[n]; st.rev = (st.rev || 0) + 1; }
          for (const k of Object.keys(v)) v[k] = fix(v[k]);
        }
        return v;
      };
      return a + JSON.stringify(fix(JSON.parse(js))).replace(/<\//g, '<\\/') + b;
    } catch (e) { return all; }
  });
}

export function legal(h, l, rel, contact, site) {
  const L0 = LEGAL[l]; const st = {};
  if (!L0) return [h, st];
  const Q = P3[l] || { RULES: [], JS: [] };
  const L = Object.assign({}, L0, { JS: L0.JS.concat(Q.JS), RULES: L0.RULES.concat(Q.RULES) });
  // 1) beágyazott scriptek / űrlapok (pontos egyezések)
  h = applyRules(h, L.JS, st, 'js');
  // 2) JSON-LD
  h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, a, js, b) => {
    try { return a + JSON.stringify(fixLd(JSON.parse(js), L, l, rel, site, st)).replace(/<\//g, '<\\/') + b; } catch (e) { return all; }
  });
  // 3) GYIK (HTML)
  h = faqHtml(h, L, rel, st);
  // 4) szöveg-szabályok a scripteken / stílusokon kívül
  const parts = h.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/);
  h = parts.map((p, i) => (i % 2 ? p : applyRules(p, L.RULES, st, 'rule'))).join('');
  // 5) ár-blokk, kártyák, bérlési táblázat
  h = priceBlock(h, L, l, contact, st);
  h = cardPrices(h, L, l, st);
  h = dropPrivCol(h, st);
  if (L.FIN && L.FIN.re.test(rel)) h = financePage(h, L, st);
  if (rel === 'kontakt/index.html') h = contactPage(h, Q, st);
  h = importCard(h, Q, st);
  h = reviewsLd(h, st);
  // 6) a GYIK-kereső rejtett szövege (data-text) a látható szövegből — ne maradjon benne magyar / régi szöveg (B12, C11)
  h = h.replace(/<([a-z]+)\b([^>]*?)\sdata-text="[^"]*"([^>]*)>/g, (tag, t, a1, a2, off) => {
    const end = elEnd(h, off); if (end < 0) return tag;
    const txt = plain(h.slice(off + tag.length, end)).replace(/\s*\+\s*/g, ' ').toLowerCase().replace(/"/g, '&quot;');
    st.dtext = (st.dtext || 0) + 1;
    return '<' + t + a1 + ' data-text="' + txt + '"' + a2 + '>';
  });
  // 7) üresen maradt bekezdések
  h = h.replace(/<p\b[^>]*>\s*<\/p>/g, '');
  return [h, st];
}
