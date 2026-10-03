/**
 * i18n-expat.mjs — "külföldieknek" réteg a lefordított tükör-oldalakon (2026-10)
 *
 * A /en/ /de/ /fr/ /uk/ /zh/ oldalak szerkezete UGYANAZ, mint a magyar oldalé (menü,
 * szekciók, képek — az i18n-mirror.mjs fordítja). Az 5 kulcsoldalon (home, rental, import,
 * regtax, contact) erre jön rá a külföldieknek szóló tartalom a src/i18n/intl/<nyelv>.ts-ből:
 *   - <title>, meta description, og/twitter cím+leírás (kulcsszó-optimalizált),
 *   - hero: kis felirat (kicker), H1 és alcím,
 *   - egy "expat" blokk (kártyák, lépések, táblázat, GYIK) — a főoldalon a hero után,
 *     a többi oldalon a tartalom végén.
 */
import fs from 'node:fs';

const FAQ_T = { en: 'Questions from expats', de: 'Fragen von Expats', fr: 'Questions fréquentes des expatriés', uk: 'Запитання від експатів', zh: '外籍人士常见问题' };

export function loadIntl(l) {
  try {
    let s = fs.readFileSync(`src/i18n/intl/${l}.ts`, 'utf8');
    s = s.replace(/^import[^\n]*\n/gm, '').replace(/const\s+\w+\s*:\s*IntlContent\s*=/, 'return').replace(/export\s+default\s+\w+;?/, '');
    return new Function(s)();
  } catch (e) { console.log('[expat] ' + l + ': ' + e.message); return null; }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const noParen = (s) => String(s).replace(/\s*[（(][^()（）]*[)）]\s*$/, '');

const CSS = `<style id="xp-css">
h1 .accent{color:var(--red,#E2001A);filter:brightness(1.35)}
.xp-kicker{display:inline-block;margin:0 auto 14px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(6px)}
.xp{background:var(--bg,#F4F7FB);color:var(--ink,#141519);font-family:var(--font,inherit)}
.xp-in{max-width:1180px;margin:0 auto;padding:64px 20px 24px}
.xp-sec{margin:0 0 60px}
.xp-k{display:inline-flex;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--red,#E2001A);margin-bottom:10px}
.xp h2{font-size:clamp(26px,3.2vw,38px);line-height:1.15;margin:0 0 14px;font-weight:800;letter-spacing:-.01em;color:var(--ink,#141519)}
.xp-lead,.xp p{font-size:17px;line-height:1.65;color:#3a3f4b;max-width:900px;margin:0 0 14px}
.xp a{color:var(--red,#E2001A)}
.xp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;margin-top:24px}
.xp-card{background:#fff;border:1px solid var(--line,#E6EAF1);border-radius:16px;padding:24px;box-shadow:0 8px 28px rgba(20,21,25,.05)}
.xp-card h3{font-size:18px;line-height:1.3;margin:0 0 8px;color:var(--ink,#141519)}
.xp-card p{font-size:15.5px;margin:0;color:#4a5160}
.xp-ul{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:10px;max-width:900px}
.xp-ul li{position:relative;padding:14px 16px 14px 46px;background:#fff;border:1px solid var(--line,#E6EAF1);border-radius:14px;font-size:16px;line-height:1.5}
.xp-ul li:before{content:"✓";position:absolute;left:16px;top:13px;width:20px;height:20px;border-radius:50%;background:var(--red,#E2001A);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}
.xp-steps{counter-reset:xp;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:24px;padding:0;list-style:none}
.xp-steps li{counter-increment:xp;background:#fff;border:1px solid var(--line,#E6EAF1);border-radius:16px;padding:22px 22px 20px}
.xp-steps li:before{content:counter(xp);display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--navy,#0B0B0D);color:#fff;font-weight:800;margin-bottom:12px}
.xp-steps b{display:block;font-size:17px;margin-bottom:6px}
.xp-steps span{font-size:15px;line-height:1.55;color:#4a5160}
.xp-table{width:100%;max-width:980px;border-collapse:separate;border-spacing:0;margin-top:22px;background:#fff;border:1px solid var(--line,#E6EAF1);border-radius:16px;overflow:hidden;font-size:15.5px}
.xp-table th,.xp-table td{text-align:left;padding:14px 18px;border-bottom:1px solid var(--line,#E6EAF1);vertical-align:top;line-height:1.5}
.xp-table tr:last-child td{border-bottom:0}
.xp-table thead th{background:var(--navy,#0B0B0D);color:#fff;font-weight:700}
.xp-table td:first-child{font-weight:700;white-space:nowrap}
.xp-note{margin-top:18px;padding:14px 18px;border-radius:14px;background:#fff7e6;border:1px solid #ffe2a8;color:#6b4e00;font-size:15px;max-width:980px}
.xp-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.xp-links a{display:inline-flex;align-items:center;padding:12px 20px;border-radius:999px;background:var(--navy,#0B0B0D);color:#fff;text-decoration:none;font-weight:700;font-size:15px}
.xp-links a:first-child{background:var(--red,#E2001A)}
.xp-faq{max-width:980px;margin-top:20px;display:grid;gap:10px}
.xp-faq details{background:#fff;border:1px solid var(--line,#E6EAF1);border-radius:14px;padding:0 18px}
.xp-faq summary{cursor:pointer;list-style:none;padding:16px 28px 16px 0;font-weight:700;font-size:16.5px;position:relative}
.xp-faq summary::-webkit-details-marker{display:none}
.xp-faq summary:after{content:"+";position:absolute;right:0;top:12px;font-size:22px;color:var(--red,#E2001A)}
.xp-faq details[open] summary:after{content:"–"}
.xp-faq details p{margin:0 0 16px;font-size:15.5px}
@media(max-width:640px){.xp-in{padding:44px 16px 8px}.xp-table td:first-child{white-space:normal}.xp-table th,.xp-table td{padding:12px}}
</style>`;

function href(target, l, M) {
  if (M.pages[target]) return M.pages[target][l];
  if (target === '#ajanlat') return M.pages.contact[l];
  return target;
}

export function renderBlock(P, ui, l, M) {
  const secs = (P.secs || []).map((s) => {
    let o = `<section class="xp-sec"${s.id ? ` id="${esc(s.id)}"` : ''}>`;
    if (s.kicker) o += `<span class="xp-k">${s.kicker}</span>`;
    o += `<h2>${s.h2}</h2>`;
    if (s.lead) o += `<p class="xp-lead">${s.lead}</p>`;
    for (const p of s.p || []) o += `<p>${p}</p>`;
    if (s.ul) o += `<ul class="xp-ul">${s.ul.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    if (s.cards) o += `<div class="xp-cards">${s.cards.map(([t, x]) => `<div class="xp-card"><h3>${t}</h3><p>${x}</p></div>`).join('')}</div>`;
    if (s.steps) o += `<ol class="xp-steps">${s.steps.map(([t, x]) => `<li><b>${t}</b><span>${x}</span></li>`).join('')}</ol>`;
    if (s.table) {
      const hd = s.table.head && s.table.head.some((x) => x) ? `<thead><tr>${s.table.head.map((x) => `<th>${x}</th>`).join('')}</tr></thead>` : '';
      o += `<table class="xp-table">${hd}<tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    if (s.note) o += `<div class="xp-note">${s.note}</div>`;
    if (s.links) o += `<div class="xp-links">${s.links.map(([t, k]) => `<a href="${esc(href(k, l, M))}">${noParen(t)}</a>`).join('')}</div>`;
    return o + '</section>';
  }).join('');
  const faq = P.faq && P.faq.length ? `<section class="xp-sec"><h2>${FAQ_T[l] || ui.faqTitle}</h2><div class="xp-faq">${P.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>` : '';
  return `<div class="xp" id="expat" lang="${l === 'zh' ? 'zh-Hans' : l}"><div class="xp-in">${secs}${faq}</div></div>`;
}

const setMeta = (h, re, val) => (re.test(h) ? h.replace(re, (m) => m.replace(/content="[^"]*"/, `content="${esc(val)}"`)) : h);

/** h: a lefordított HTML; key: oldal-kulcs; C: intl tartalom; M: intl-map */
export function applyExpat(h, key, l, C, M) {
  const P = C && C.pages && C.pages[key];
  if (!P) return h;
  // fej
  h = h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(P.title)}</title>`);
  h = setMeta(h, /<meta\s+name="description"[^>]*>/i, P.desc);
  h = setMeta(h, /<meta\s+property="og:title"[^>]*>/i, P.title);
  h = setMeta(h, /<meta\s+property="og:description"[^>]*>/i, P.desc);
  h = setMeta(h, /<meta\s+name="twitter:title"[^>]*>/i, P.title);
  h = setMeta(h, /<meta\s+name="twitter:description"[^>]*>/i, P.desc);
  h = h.replace(/<\/head>/i, CSS + '\n</head>');
  // hero: kicker + H1 + alcím
  // a hero címsora: <h1>, vagy (pl. /uj-auto-berlese/) egy "…-h1" osztályú div — ez utóbbiból valódi H1 lesz
  const hm = h.match(/<h1([^>]*)>[\s\S]*?<\/h1>/i) || h.match(/<div(\s+class="[^"]*-h1"[^>]*)>[\s\S]*?<\/div>/i);
  if (hm) {
    const at = hm.index;
    const attrs = hm[0].startsWith('<div') ? hm[1].replace(/>$/, '') + ' style="margin:0"' : hm[1];
    const newH1 = `${P.kicker ? `<div class="xp-kicker">${P.kicker}</div>` : ''}<h1${attrs}>${P.h1}</h1>`;
    h = h.slice(0, at) + newH1 + h.slice(at + hm[0].length);
    const after = at + newH1.length;
    const rest = h.slice(after, after + 4000);
    const sm = rest.match(/<p([^>]*class="[^"]*sub[^"]*"[^>]*)>[\s\S]*?<\/p>/i);
    if (sm) h = h.slice(0, after + sm.index) + `<p${sm[1]}>${P.sub}</p>` + h.slice(after + sm.index + sm[0].length);
  }
  // expat blokk
  const block = renderBlock(P, C.ui, l, M);
  if (key === 'home' && /<section class="wrap" id="autoink">/.test(h)) h = h.replace(/<section class="wrap" id="autoink">/, block + '<section class="wrap" id="autoink">');
  else if (/<\/main>/i.test(h)) h = h.replace(/<\/main>/i, block + '</main>');
  else h = h.replace(/<footer/i, block + '<footer');
  return h;
}
