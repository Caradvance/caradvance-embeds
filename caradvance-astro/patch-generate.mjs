// Build-time patcher: a repo gyokereben levo generate.mjs-t alakitja at ugy,
// hogy a napi keszlet-pipeline (Google Sheet) oszlopaibol dolgozzon.
//
// Miert patch es nem atirt generate.mjs: a generate.mjs ~196 kB, es a kezi
// szerkesztese/karbantartasa nehez. Igy az eredeti fajl valtozatlan marad, ez a
// modul pedig egy MASOLATON dolgozik a build alatt (.gen-src/generate.mjs).
//
// Ha barmelyik horgony eltunik (mert valaki atirja a generate.mjs-t), ez a modul
// HIBAT dob -> a prebuild.mjs elkapja -> a build NEM all le, a repoban levo
// utolso jo /autoink/ es /auto/ marad. Ez szandekos.
//
// Hasznalat:  node patch-generate.mjs <utvonal/generate.mjs>
import fs from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('patch-generate: hianyzo fajl-argumentum'); process.exit(2); }
let s = fs.readFileSync(file, 'utf8');
const log = [];
function rep(from, to, label, allowMulti) {
  const i = s.indexOf(from);
  if (i === -1) throw new Error('patch-generate: NEM TALALHATO horgony -> ' + label);
  if (!allowMulti && s.indexOf(from, i + 1) !== -1) throw new Error('patch-generate: NEM EGYEDI horgony -> ' + label);
  s = s.slice(0, i) + to + s.slice(i + from.length);
  log.push(label);
}
function repAll(re, to, label) {
  const n = (s.match(re) || []).length;
  if (!n) throw new Error('patch-generate: NEM TALALHATO minta -> ' + label);
  s = s.replace(re, to);
  log.push(label + ' (' + n + 'x)');
}

/* ---------------------------------------------------------------- 1. helperek */
rep(
`const isOwn = (c) => (c.sajat || "").toLowerCase() === "igen";`,
`const isOwn = (c) => (c.sajat || "").toLowerCase() === "igen";
// ---- Sheet-vezerelt segedek (a napi keszlet-pipeline oszlopai) -------------
// A pipeline irja: slug, elkelt, elkelt_datum, tipus, berelheto, kaucio_eur,
// berlet_2000_eur, berlet_3000_eur, vetel_huf, kep_irany_ok, seo_*, json_ld.
const slugOf   = (c) => String(c.slug || "").trim() || slugify(c.modell);
const isSold   = (c) => String(c.elkelt || "").trim().toLowerCase() === "igen";
const soldDate = (c) => String(c.elkelt_datum || "").trim().slice(0, 10);
const tipusOf  = (c) => (String(c.tipus || "").trim().toLowerCase() || "eladas");
const isBiz    = (c) => tipusOf(c) === "bizomanyos";
const isRent   = (c) => String(c.berelheto || "").trim().toLowerCase() === "igen" && nEur(c.berlet_2000_eur) > 0;
// Tukrozes: kezi lista VAGY a pipeline azt irta, hogy a fokep balra nez.
const mirrorOf = (c) => {
  // A kezzel valasztott fokepet SOHA nem tukrozzuk: azt mar ugy valasztottuk ki,
  // hogy a helyes iranyba nez. A kodba irt MIRROR lista csak akkor szol bele, ha
  // nincs kezi valasztas. (2026.08.28: a G 63 mint-white igy fordult volna vissza.)
  if (String(c.kep_url_manual || '').trim()) {
    return /^nem\\s*\\(\\s*balra/i.test(String(c.kep_irany_ok || ''));
  }
  return MIRROR.has(slugOf(c)) || /^nem\\s*\\(\\s*balra/i.test(String(c.kep_irany_ok || ''));
};
const huRound  = (eur, rate) => Math.ceil((Number(eur) || 0) * Math.round(rate) / 10000) * 10000;
const fmtDateHu = (d) => { const m = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(d || ""); return m ? m[1] + ". " + m[2] + ". " + m[3] + "." : (d || ""); };`,
'helperek');

/* ---------------------------------------------------------------- 2. ar */
rep(
`  const eur = nEur(c.vetel_eur_netto) || nEur(c.vetel_eur) / 1.19;
  const main = hufUp(eur);
  return { eur, main, huGross: 0, save: 0 };`,
`  // A netto es a Ft-ar ugyanaz a keplet, amit a pipeline is hasznal:
  //   netto = round(brutto / 1.19);  Ft = ceil(netto * round(rate) / 10000) * 10000
  const gross = nEur(c.vetel_eur);
  const eur = nEur(c.vetel_eur_netto) || (gross ? Math.round(gross / 1.19) : 0);
  const main = nEur(c.vetel_huf) || hufUp(eur);
  return { eur, main, huGross: 0, save: 0 };`,
'priceOf');

/* ---------------------------------------------------------------- 3. aktiv */
rep(
`const isActive = (c) => {
  if ((c.aktiv || "igen").toLowerCase() === "nem") return false;
  const m = String(c.modell || "");`,
`const isActive = (c) => {
  if ((c.aktiv || "igen").toLowerCase() === "nem") return false;
  if (String(c.elkelt || "").trim().toLowerCase() === "igen") return false; // eladott -> kulon ful
  const m = String(c.modell || "");`,
'isActive');

/* ---------------------------------------------------------------- 4. slug */
repAll(/slugify\(c\.modell\)/g, 'slugOf(c)', 'slug a Sheetbol');
repAll(/slugify\(x\.modell\)/g, 'slugOf(x)', 'slug a Sheetbol (related)');

/* ---------------------------------------------------------------- 5. CSS */
rep(
`.rate-note{margin-top:16px;font-size:12.5px;color:var(--muted);text-align:center}
\`;`,
`.rate-note{margin-top:16px;font-size:12.5px;color:var(--muted);text-align:center}
/* ---- Eladva (sold) ---- */
.card.sold .media img{filter:grayscale(.5) brightness(.86)}
.soldbadge{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-11deg);background:rgba(214,31,44,.93);color:#fff;font-size:clamp(17px,3.4vw,28px);font-weight:900;letter-spacing:.13em;text-transform:uppercase;padding:9px 24px;border-radius:8px;border:3px solid #fff;box-shadow:0 12px 30px rgba(0,0,0,.34);z-index:4;pointer-events:none;white-space:nowrap}
.solddate{position:absolute;bottom:10px;left:10px;background:rgba(16,17,20,.84);color:#fff;font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px;z-index:4}
.soldnote{background:#FDECEE;border:1px solid #F6C9CE;color:#8E1B25;border-radius:12px;padding:14px 18px;font-weight:700;font-size:14.5px;margin:0 0 18px}
/* ---- Berelheto arak ---- */
.rentprices{margin-top:auto;display:grid;gap:5px;font-size:13.5px}
.rentprices .rp{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-weight:700}
.rentprices .rp b{color:var(--ink);font-weight:800}
.rentprices .rp.kau{border-top:1px dashed var(--line);margin-top:5px;padding-top:6px}
\`;`,
'cardCss');

/* ---------------------------------------------------------------- 6. carCard */
rep(
`function carCard(c, rate, rel) {
  const g = galleryOf(c);
  const p = priceOf(c, rate);
  const href = \`\${rel}auto/\${slugOf(c)}/\`;
  const mir = MIRROR.has(slugOf(c)) ? ' class="mir"' : "";
  const badge = FEATURED.includes(slugOf(c)) ? '<span class="feat">Kiemelt</span>' : "";`,
`function soldOverlay(c) {
  const d = soldDate(c);
  return '<span class="soldbadge">Eladva</span>' +
    (d ? '<span class="solddate">Elkelt: ' + esc(fmtDateHu(d)) + '</span>' : "");
}
function rentPricesHtml(c, rate) {
  const k = nEur(c.kaucio_eur), a2 = nEur(c.berlet_2000_eur), a3 = nEur(c.berlet_3000_eur);
  const row = (lab, eur) => eur
    ? \`<div class="rp"><span>\${lab}</span><b>\${eur.toLocaleString("hu-HU")} € <span style="color:var(--muted);font-weight:700">≈ \${fmtHUF(huRound(eur, rate))}</span></b></div>\`
    : "";
  return \`<div class="rentprices">\${row("2 000 km / hó", a2)}\${row("3 000 km / hó", a3)}\${k ? \`<div class="rp kau"><span>Kaució</span><b>\${k.toLocaleString("hu-HU")} €</b></div>\` : ""}</div>\`;
}
function carCard(c, rate, rel, opts) {
  opts = opts || {};
  const g = galleryOf(c);
  const p = priceOf(c, rate);
  const href = \`\${rel}auto/\${slugOf(c)}/\`;
  const mir = mirrorOf(c) ? ' class="mir"' : "";
  const badge = !opts.sold && FEATURED.includes(slugOf(c)) ? '<span class="feat">Kiemelt</span>' : "";`,
'carCard fej');

rep(
`  const cross = p.save > 0 ? \`<span class="pcross" data-cross>\${fmtHUF(p.huGross)}</span>\` : "";
  const save = p.save > 0 ? \`<span class="psave" data-save>−\${fmtHUF(p.save)}</span>\` : "";
  return \`<a class="card" href="\${attr(href)}" data-marka="\${attr(c.marka || "")}" data-kar="\${attr(c.karosszeria || "")}" data-uz="\${attr(c.uzemanyag || "")}"><div class="media">\${img}\${badge}\${ujBadge(c, true)}</div>
  <div class="body"><div class="meta"><span class="cond">Használt</span><span class="year">\${esc(c.evjarat || "")}</span></div>
  <h3 class="title">\${esc((c.modell || "").trim())}</h3>
  <div class="specs">\${esc(specStr(c))}</div>
  <div class="pricerow" data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}">\${cross}<span class="price" data-main>\${fmtHUF(p.main)}</span><span class="peur">\${fmtEUR(p.eur)}</span>\${save}</div>
  <span class="cbtn">Részletek</span></div></a>\`;
}`,
`  const cross = p.save > 0 ? \`<span class="pcross" data-cross>\${fmtHUF(p.huGross)}</span>\` : "";
  const save = p.save > 0 ? \`<span class="psave" data-save>−\${fmtHUF(p.save)}</span>\` : "";
  const priceRow = opts.rent
    ? rentPricesHtml(c, rate)
    : \`<div class="pricerow" data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}">\${cross}<span class="price" data-main>\${fmtHUF(p.main)}</span><span class="peur">\${fmtEUR(p.eur)}</span>\${save}</div>\`;
  const cond = opts.rent ? "Bérelhető" : (opts.sold ? "Elkelt" : "Használt");
  return \`<a class="card\${opts.sold ? " sold" : ""}" href="\${attr(href)}" data-marka="\${attr(c.marka || "")}" data-kar="\${attr(c.karosszeria || "")}" data-uz="\${attr(c.uzemanyag || "")}"><div class="media">\${img}\${badge}\${opts.sold ? soldOverlay(c) : ujBadge(c, true)}</div>
  <div class="body"><div class="meta"><span class="cond">\${cond}</span><span class="year">\${esc(c.evjarat || "")}</span></div>
  <h3 class="title">\${esc((c.modell || "").trim())}</h3>
  <div class="specs">\${esc(specStr(c))}</div>
  \${priceRow}
  <span class="cbtn">Részletek</span></div></a>\`;
}`,
'carCard test');

rep(`  const mir = MIRROR.has(slugOf(c)) ? ' class="mir"' : "";
  const img = g[0]
    ? \`<img\${mir} src="\${attr(g[0])}" alt="\${attr((c.modell || "").trim())}" loading="lazy" referrerpolicy="no-referrer"><span class="ph" style="display:none">fotó hamarosan</span>\`
    : \`<span class="ph">fotó hamarosan</span>\`;
  const spec = [c.km, c.teljesitmeny, c.valto, c.uzemanyag].filter(Boolean).join(" · ");`,
`  const mir = mirrorOf(c) ? ' class="mir"' : "";
  const img = g[0]
    ? \`<img\${mir} src="\${attr(g[0])}" alt="\${attr((c.modell || "").trim())}" loading="lazy" referrerpolicy="no-referrer"><span class="ph" style="display:none">fotó hamarosan</span>\`
    : \`<span class="ph">fotó hamarosan</span>\`;
  const spec = [c.km, c.teljesitmeny, c.valto, c.uzemanyag].filter(Boolean).join(" · ");`,
'featCard tukrozes');

rep(`  const mirHero = MIRROR.has(slug);`, `  const mirHero = mirrorOf(c);`, 'renderDetail tukrozes');

/* ============================ renderCatalog -> fulek ====================== */
const oldHead = `function renderCatalog(cars, rate) {
  const active = cars.filter(isActive).sort((a, b) => {`;
rep(oldHead, `function renderCatalog(cars, rate) {
  const active = cars.filter(isActive).sort((a, b) => {`, 'katalogus fej (no-op)');

// A body csere: a regi <div class="count"> + grid blokk helyere fulek kerulnek.
rep(
`  <div class="count" id="count">\${active.length} autó</div>
  <div class="grid" id="grid">\${active.map((c) => carCard(c, rate, "../")).join("")}</div>
</div>`,
`  <div class="autok-head" style="margin:0 0 18px">
    <div class="autok-tabs" role="tablist">
      <button class="autok-tab on" data-tab="eladas" type="button">Eladó autók (\${sale.length})</button>
      <button class="autok-tab" data-tab="berelheto" type="button">Bérelhető (\${rent.length})</button>\${biz.length ? \`
      <button class="autok-tab" data-tab="bizomanyos" type="button">Bizományos (\${biz.length})</button>\` : ""}\${sold.length ? \`
      <button class="autok-tab" data-tab="eladva" type="button">Eladva (\${sold.length})</button>\` : ""}
    </div>
  </div>
  <div class="autok-panel on" id="panel-eladas">
    <div class="count" id="count">\${sale.length} autó</div>
    <div class="grid" id="grid">\${sale.map((c) => carCard(c, rate, "../")).join("")}</div>
  </div>
  <div class="autok-panel" id="panel-berelheto">
    <p class="ptab">Bérlés minimum 6 hónapos időtartamtól, havidíjas konstrukcióban. A havi díj a választott km-kerettől függ; a kaució egyszeri, a bérlés végén visszajár.</p>
    <div class="count">\${rent.length} autó</div>
    <div class="grid">\${rent.length ? rent.map((c) => carCard(c, rate, "../", { rent: true })).join("") : '<div class="empty">Jelenleg nincs bérelhető autó a készletben.</div>'}</div>
  </div>\${biz.length ? \`
  <div class="autok-panel" id="panel-bizomanyos">
    <p class="ptab">Bizományos autók: magánszemélyek és partnereink autói, amelyeket mi értékesítünk — ugyanazzal a bevizsgálással és ügyintézéssel.</p>
    <div class="count">\${biz.length} autó</div>
    <div class="grid">\${biz.map((c) => carCard(c, rate, "../")).join("")}</div>
  </div>\` : ""}\${sold.length ? \`
  <div class="autok-panel" id="panel-eladva">
    <p class="ptab">Ezek az autók már elkeltek — referenciaként hagyjuk fent őket. Ha hasonlót keresel, a teljes német piacról behozzuk neked.</p>
    <div class="count">\${sold.length} autó</div>
    <div class="grid">\${sold.map((c) => carCard(c, rate, "../", { sold: true })).join("")}</div>
  </div>\` : ""}
</div>`,
'katalogus fulek');

// szuro-script + tab-script
rep(
`\`;
  return page({
    title: "Megvásárolható autóink — CarAdvance",`,
`
(function(){var tabs=[].slice.call(document.querySelectorAll('.autok-tab'));
 tabs.forEach(function(b){b.addEventListener('click',function(){
  tabs.forEach(function(x){x.classList.toggle('on',x===b);});
  document.querySelectorAll('.autok-panel').forEach(function(p){p.classList.toggle('on',p.id==='panel-'+b.getAttribute('data-tab'));});
  if(location.hash!=='#'+b.getAttribute('data-tab'))history.replaceState(null,'','#'+b.getAttribute('data-tab'));
 });});
 var h=(location.hash||'').replace('#','');
 if(h){var t=tabs.filter(function(x){return x.getAttribute('data-tab')===h;})[0];if(t)t.click();}
})();
</script>\`;
  return page({
    title: "Megvásárolható autóink — CarAdvance",`,
'katalogus tab-script');

// a regi </script> zaras torlese (a fenti beszurast megelozo sor)
rep(`['q','marka','kar','uz'].forEach(function(id){var e=document.getElementById(id);e.addEventListener('input',f);e.addEventListener('change',f);});})();
</script>
(function(){var tabs=`,
`['q','marka','kar','uz'].forEach(function(id){var e=document.getElementById(id);e.addEventListener('input',f);e.addEventListener('change',f);});})();
(function(){var tabs=`,
'script zaras');

// halmazok + ptab css
rep(`  const brands = [...new Set(active.map((c) => c.marka).filter(Boolean))].sort();`,
`  const sale = active.filter((c) => !isBiz(c));
  const rent = active.filter(isRent);
  const biz  = active.filter(isBiz);
  const sold = cars.filter(isSold)
    .sort((a, b) => String(soldDate(b)).localeCompare(String(soldDate(a))));
  const brands = [...new Set(active.map((c) => c.marka).filter(Boolean))].sort();`,
'katalogus halmazok');

rep(`.empty{grid-column:1/-1;color:var(--muted);padding:40px;text-align:center}
\` + cardCss();`,
`.empty{grid-column:1/-1;color:var(--muted);padding:40px;text-align:center}
.ptab{color:var(--muted);font-size:14.5px;line-height:1.6;margin:0 0 16px;max-width:70ch}
\` + cardCss();`,
'katalogus css');

// a szuro csak az elado fulre hat -> a count id-t ott hagyjuk, de a grid-et vedjuk
rep(`(function(){var g=document.getElementById('grid'),cards=[].slice.call(g.children);`,
`(function(){var g=document.getElementById('grid');if(!g)return;var cards=[].slice.call(g.children);`,
'szuro vedes');

// leiras: aktiv darabszam helyett elado darabszam
rep(`    desc: \`Böngéssz \${active.length} prémium autó között`, `    desc: \`Böngéssz \${sale.length} prémium autó között`, 'katalogus desc');

/* ============================ renderDetail: eladva + SEO ================= */
rep(`      availability: "https://schema.org/InStock", url: SITE_BASE + "/auto/" + slug + "/",`,
`      availability: isSold(c) ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: SITE_BASE + "/auto/" + slug + "/",`,
'JSON-LD SoldOut');

rep(`  return page({
    title: \`\${title} (\${c.evjarat || ""}) — \${BRAND}\`,
    desc: \`\${title} eladó — \${specStr(c)}. \${fmtHUF(p.main)} (\${fmtEUR(p.eur)}). Nettó ár (áfa nélkül), garancia, \${BRAND} import.\`,
    canonical: SITE_BASE + "/auto/" + slug + "/", rel: "../../", css, body,
    head: \`<meta property="og:type" content="product">\${g[0] ? \`<meta property="og:image" content="\${attr(g[0])}">\` : ""}
<script type="application/ld+json">\${JSON.stringify(ld)}</script>
<script type="application/ld+json">\${JSON.stringify(bc)}</script>\`,
  });`,
`  // A Sheet seo_title / seo_description / json_ld mezoi elsobbseget kapnak
  // (ezeket a napi pipeline allitja elo, Ahrefs-kulcsszavakra hangolva).
  const seoT = String(c.seo_title || "").trim();
  const seoD = String(c.seo_description || "").trim();
  let sheetLd = "";
  try { const raw = String(c.json_ld || "").trim(); if (raw) sheetLd = JSON.stringify(JSON.parse(raw)); } catch (e) {}
  return page({
    title: seoT || \`\${title} ((\${c.evjarat || ""}) — \${BRAND}\`.replace("((", "("),
    desc: seoD || \`\${title} eladó — \${specStr(c)}. \${fmtHUF(p.main)} (\${fmtEUR(p.eur)}). Nettó ár (áfa nélkül), garancia, \${BRAND} import.\`,
    canonical: SITE_BASE + "/auto/" + slug + "/", rel: "../../", css, body,
    head: \`<meta property="og:type" content="product">\${g[0] ? \`<meta property="og:image" content="\${attr(g[0])}">\` : ""}
<script type="application/ld+json">\${sheetLd || JSON.stringify(ld)}</script>
<script type="application/ld+json">\${JSON.stringify(bc)}</script>\`,
  });`,
'detail SEO a Sheetbol');

/* ---- 1. ELADVA jelvény a reszletes oldal fokepen ---- */
rep(
`  const stage = g.length
    ? \`<div class="stage"><img id="stg"\${mirHero ? ' class="mir"' : ""} src="\${attr(g[0])}" alt="\${attr(title)}" referrerpolicy="no-referrer">`,
`  const soldTag = isSold(c) ? soldOverlay(c) : "";
  const stage = g.length
    ? \`<div class="stage"\${isSold(c) ? ' style="position:relative"' : ""}><img id="stg"\${mirHero ? ' class="mir"' : ""} src="\${attr(g[0])}" alt="\${attr(title)}" referrerpolicy="no-referrer">\${soldTag}`,
'reszletes oldal ELADVA jelveny');

/* ---- 2. eladva savok a torzsben ---- */
rep(
`  <div class="crumb"><a href="../../">Főoldal</a> / <a href="../../autoink/">Autóink</a> / <b>\${esc(title)}</b></div>`,
`  <div class="crumb"><a href="../../">Főoldal</a> / <a href="../../autoink/">Autóink</a>\${isSold(c) ? ' / <a href="../../autoink/#eladva">Eladva</a>' : ""} / <b>\${esc(title)}</b></div>
  \${isSold(c) ? \`<p class="soldnote">Ez az autó elkelt\${soldDate(c) ? " (" + esc(fmtDateHu(soldDate(c))) + ")" : ""}. Referenciaként hagyjuk fent — ha hasonlót keresel, a teljes német piacról behozzuk neked. <a href="../../autoink/" style="color:#8E1B25;text-decoration:underline">Aktuális készletünk →</a></p>\` : ""}`,
'reladva sav a torzsben');

/* ---- 3. eladva: a "Kapcsolat"/ar oldalsav helyett is jelezzuk ---- */

/* ---- 4. main(): eladott autoknak is legyen aloldala ---- */
rep(
`  const active = cars.filter(isActive);
  const urls = [SITE_BASE + "/", SITE_BASE + "/autoink/"];
  const seen = new Set();
  for (const c of active) {
    const slug = slugOf(c);
    if (!slug || seen.has(slug)) continue; // first active wins on dupes
    seen.add(slug);
    await write(\`auto/\${slug}/index.html\`, renderDetail(c, cars, rate));
    urls.push(SITE_BASE + "/auto/" + slug + "/");
  }`,
`  const active = cars.filter(isActive);
  // Eladott autok: a sorrend a legutobb elkelt eloszor. Az aloldal megmarad
  // (SEO-referencia + a vevo latja, mit adtunk mar el), de SoldOut jelolessel.
  const soldCars = cars.filter(isSold)
    .sort((a, b) => String(soldDate(b)).localeCompare(String(soldDate(a))));
  const urls = [SITE_BASE + "/", SITE_BASE + "/autoink/"];
  const seen = new Set();
  for (const c of [...active, ...soldCars]) {
    const slug = slugOf(c);
    if (!slug || seen.has(slug)) continue; // first active wins on dupes
    seen.add(slug);
    await write(\`auto/\${slug}/index.html\`, renderDetail(c, cars, rate));
    urls.push(SITE_BASE + "/auto/" + slug + "/");
  }`,
'main: eladott aloldalak');

rep(
`  console.log(\`Parsed \${cars.length} rows, \${cars.filter(isActive).length} active. Rate=\${rate}\`);`,
`  const _a = cars.filter(isActive);
  console.log(\`Parsed \${cars.length} rows | aktiv \${_a.length} | elado \${_a.filter((c) => !isBiz(c)).length}\` +
    \` | berelheto \${_a.filter(isRent).length} | bizomanyos \${_a.filter(isBiz).length}\` +
    \` | eladva \${cars.filter(isSold).length} | 1 EUR = \${rate} Ft\`);`,
'main: naplo');

rep(
`  console.log(\`Done. \${seen.size} car pages + home + catalog + sitemap (\${urls.length} urls) -> \${outDir}\`);`,
`  console.log(\`Done. \${seen.size} car pages (ebbol \${soldCars.length} eladott) + home + catalog + sitemap (\${urls.length} urls) -> \${outDir}\`);`,
'main: zaro naplo');

/* ---- kezi fokep (kep_url_manual) > kodba irt MAIN_INJECT / GALLERY_OVERRIDE -- */
rep(`function galleryOf(c) {
  const slug = slugOf(c);
  const _ov = GALLERY_OVERRIDE[slug];
  if (_ov) return applyInject(slug, _ov.slice());`,
`function galleryOf(c) {
  const slug = slugOf(c);
  // Ha a Sheetben ki van tolve a kep_url_manual, AZ a fokep: a kodba irt
  // MAIN_INJECT / GALLERY_OVERRIDE nem irhatja felul a kezi valasztast.
  const manual = String(c.kep_url_manual || "").trim();
  if (manual) {
    const list = String(c.galeria || "").split(/[\\n,]+/).map((x) => x.trim()).filter(Boolean).map(driveImg);
    const hero = driveImg(manual);
    const out = [hero];
    for (const g of list) if (g && g !== hero) out.push(g);
    return out;
  }
  const _ov = GALLERY_OVERRIDE[slug];
  if (_ov) return applyInject(slug, _ov.slice());`,
'kezi fokep elsobbsege');

/* ---- JSON-LD: a Sheet json_ld-je a bazis, de a keszlet-allapot a generatore -- */
rep(`  let sheetLd = "";
  try { const raw = String(c.json_ld || "").trim(); if (raw) sheetLd = JSON.stringify(JSON.parse(raw)); } catch (e) {}`,
`  // A Sheet json_ld-je a bazis (a pipeline allitja elo), de a keszlet-allapotot
  // MINDIG a generator donti el: eladott auton SoldOut kell, nem InStock.
  let sheetLd = "";
  try {
    const raw = String(c.json_ld || "").trim();
    if (raw) {
      const o = JSON.parse(raw);
      o.itemCondition = o.itemCondition || "https://schema.org/UsedCondition";
      if (!o.description && descText) o.description = descText;
      o.offers = Object.assign({ "@type": "Offer", price: p.main, priceCurrency: "HUF" }, o.offers || {}, {
        availability: isSold(c) ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        url: SITE_BASE + "/auto/" + slug + "/",
      });
      sheetLd = JSON.stringify(o);
    }
  } catch (e) {}`,
'JSON-LD osszefuzes');

/* ---- Eladva: kisebb jelveny + a realizalt ar NEM latszik ---------------- */
// Uzleti dontes: az eladott autonal a konkret vetelar nem publikus (a
// kovetkezo vevo ne abbol induljon), de az auto maga fent marad referenciaként.
rep(`.soldbadge{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-11deg);background:rgba(214,31,44,.93);color:#fff;font-size:clamp(17px,3.4vw,28px);font-weight:900;letter-spacing:.13em;text-transform:uppercase;padding:9px 24px;border-radius:8px;border:3px solid #fff;box-shadow:0 12px 30px rgba(0,0,0,.34);z-index:4;pointer-events:none;white-space:nowrap}`,
`.soldbadge{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-9deg);background:rgba(214,31,44,.92);color:#fff;font-size:clamp(12px,1.5vw,16px);font-weight:900;letter-spacing:.11em;text-transform:uppercase;padding:6px 15px;border-radius:6px;border:2px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.3);z-index:4;pointer-events:none;white-space:nowrap}
.soldprice{font-size:13px;font-weight:600;color:var(--muted)}
.soldprice span{display:block;margin-top:6px;line-height:1.45}`,
'kisebb ELADVA jelveny + soldprice css');

rep(`  const priceRow = opts.rent
    ? rentPricesHtml(c, rate)
    : \`<div class="pricerow" data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}">\${cross}<span class="price" data-main>\${fmtHUF(p.main)}</span><span class="peur">\${fmtEUR(p.eur)}</span>\${save}</div>\`;`,
`  const priceRow = opts.sold
    ? \`<div class="pricerow" data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}"><span class="price" data-main>\${fmtHUF(p.main)}</span><span class="peur">\${fmtEUR(p.eur)}</span></div>
      <div class="soldprice"><span>Elkelt\${soldDate(c) ? " &middot; " + esc(fmtDateHu(soldDate(c))) : ""} &middot; hasonlót behozunk neked.</span></div>\`
    : (opts.rent
      ? rentPricesHtml(c, rate)
      : \`<div class="pricerow" data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}">\${cross}<span class="price" data-main>\${fmtHUF(p.main)}</span><span class="peur">\${fmtEUR(p.eur)}</span>\${save}</div>\`);`,
'kartya: eladott autonal ar + elkelt-jelzes');

/* ---- Eladva: a reszletes oldal oldalsavja ------------------------------- */
rep(`        <div class="badge"><span class="cond">Használt</span><span class="year">\${esc(c.evjarat || "")}</span></div>
        <div class="ptitle">\${ujBadge(c, false)}\${esc(title)}</div>
        <div data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}">
          <div class="plabel">Nettó ár</div>
          <div class="price" data-main>\${fmtHUF(p.main)}</div>
          <div class="peur">\${fmtEUR(p.eur)}</div>
        </div>
        <div class="taxnote">Nettó ár (áfa nélkül). Árfolyam: 1 € ≈ \${rate} Ft.</div>
        <a class="btn btn-primary" style="width:100%;margin-top:16px" href="mailto:\${CONTACT_EMAIL}?subject=\${encodeURIComponent("Ajánlatkérés: " + title)}">Ajánlatkérés</a>`,
`        <div class="badge"><span class="cond">\${isSold(c) ? "Elkelt" : "Használt"}</span><span class="year">\${esc(c.evjarat || "")}</span></div>
        <div class="ptitle">\${isSold(c) ? "" : ujBadge(c, false)}\${esc(title)}</div>
        \${isSold(c) ? \`<div data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}">
          <div class="plabel">Eladási ár volt</div>
          <div class="price" data-main>\${fmtHUF(p.main)}</div>
          <div class="peur">\${fmtEUR(p.eur)}</div>
        </div>
        <div class="taxnote">Ez az autó elkelt\${soldDate(c) ? " (" + esc(fmtDateHu(soldDate(c))) + ")" : ""} — az ár referenciaként látszik. Hasonlót a teljes német piacról behozunk neked: szállítással, honosítással, teljes ügyintézéssel.</div>\` : \`<div data-eur="\${p.eur}" data-net="\${nEur(c.vetel_eur_netto)}">
          <div class="plabel">Nettó ár</div>
          <div class="price" data-main>\${fmtHUF(p.main)}</div>
          <div class="peur">\${fmtEUR(p.eur)}</div>
        </div>
        <div class="taxnote">Nettó ár (áfa nélkül). Árfolyam: 1 € ≈ \${rate} Ft.</div>\`}
        <a class="btn btn-primary" style="width:100%;margin-top:16px" href="mailto:\${CONTACT_EMAIL}?subject=\${encodeURIComponent((isSold(c) ? "Hasonlót keresek: " : "Ajánlatkérés: ") + title)}">\${isSold(c) ? "Hasonlót keresek" : "Ajánlatkérés"}</a>`,
'reszletes oldal: eladott autonal nincs ar');

/* ---- Eladva: a PDF adatlap (arral) ne jelenjen meg eladott autonal ------ */
rep(`      <div class="panel dl">
        <h4 style="margin:0 0 6px;font-size:18px;font-weight:800">Autó adatlap</h4>`,
`      \${isSold(c) ? "" : \`<div class="panel dl">
        <h4 style="margin:0 0 6px;font-size:18px;font-weight:800">Autó adatlap</h4>`,
'PDF panel nyitas');

rep(`        <button class="btn btn-soft dlbtn" id="pdfbtn" type="button">\${DL_ICON}Adatlap letöltése (PDF)</button>
      </div>`,
`        <button class="btn btn-soft dlbtn" id="pdfbtn" type="button">\${DL_ICON}Adatlap letöltése (PDF)</button>
      </div>\`}`,
'PDF panel zaras');

/* ---- Duplikalt sorok: egy slug = egy kartya ---------------------------- */
// A Sheetben elofordul, hogy ugyanaz az auto ket sorban van (pl. Porsche 911
// Carrera GTS). A reszletes oldal eddig is deduplikalt (main(): "first active
// wins"), a katalogus viszont ket kartyat rajzolt ugyanarra az URL-re.
rep(`  const sale = active.filter((c) => !isBiz(c));`,
`  const dedupe = (list) => { const seen = new Set(); return list.filter((c) => {
    const k = slugOf(c); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
  const sale = dedupe(active.filter((c) => !isBiz(c)));`,
'katalogus: dedup (elado)');

rep(`  const rent = active.filter(isRent);
  const biz  = active.filter(isBiz);`,
`  const rent = dedupe(active.filter(isRent));
  const biz  = dedupe(active.filter(isBiz));`,
'katalogus: dedup (berelheto, bizomanyos)');

rep(`  const sold = cars.filter(isSold)
    .sort((a, b) => String(soldDate(b)).localeCompare(String(soldDate(a))));`,
`  const sold = dedupe(cars.filter(isSold)
    .sort((a, b) => String(soldDate(b)).localeCompare(String(soldDate(a)))));`,
'katalogus: dedup (eladva)');

/* ---- VEDELEM: soha ne kerulhessen ki "0 Ft" ---------------------------- */
// 2026.08.28: a Sheetben 18 sajat autonak nem volt ara -> az oldalon 18 kartya
// "0 Ft"-ot mutatott volna. Ar nelkul inkabb ne legyen szam.
rep(`const fmtHUF = (v) => v.toLocaleString("hu-HU") + " Ft";
const fmtEUR = (v) => v.toLocaleString("hu-HU") + " €";`,
`const fmtHUF = (v) => (Number(v) > 0 ? Number(v).toLocaleString("hu-HU") + " Ft" : "Ár kérésre");
const fmtEUR = (v) => (Number(v) > 0 ? Number(v).toLocaleString("hu-HU") + " €" : "");`,
'0 Ft helyett "Ár kérésre"');

// A kliensoldali arfolyam-frissito is irna felul 0-ra -> ott is vedjuk.
rep(`var mE=e.querySelector('[data-main]'); if(mE)mE.textContent=f(main);`,
`var mE=e.querySelector('[data-main]'); if(mE&&main>0)mE.textContent=f(main);`,
'arfolyam-frissito: 0-t ne irjon ki');

/* ---- Duplikalt sorok OSSZEFUZESE (nem csak elrejtese) ------------------ */
// A Sheetben ugyanaz az auto ket sorban is szerepelhet:
//   - a kezi (sajat=igen) sor: sok galeria-fotó, de nincs ara/slugja
//   - a pipeline sora: mobile_id, ar, slug, SEO — de galeria nelkul
// Osszefuzzuk: a pipeline sora a bazis, a kezi sor kitolti a hianyzo mezoket.
rep(`function isNew(c) {`,
`function mergeDuplicates_(cars) {
  const groups = new Map();
  for (const c of cars) {
    const k = slugOf(c);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  const drop = new Set();
  const NEM_MASOLHATO = { aktiv: 1, elkelt: 1, elkelt_datum: 1, mobile_id: 1, sajat: 1, tipus: 1 };
  groups.forEach(function (list) {
    if (list.length < 2) return;
    const act = list.filter(function (c) {
      return String(c.aktiv || 'igen').toLowerCase() !== 'nem' && !isSold(c);
    });
    if (act.length < 2) return;
    // bazis: amelyiknek van mobile_id-ja ES ara (a pipeline friss sora)
    const rank = function (c) {
      return (String(c.mobile_id || '').trim() ? 2 : 0) + (nEur(c.vetel_eur) > 0 ? 1 : 0);
    };
    act.sort(function (a, b) { return rank(b) - rank(a); });
    const base = act[0];
    act.slice(1).forEach(function (other) {
      Object.keys(other).forEach(function (key) {
        if (NEM_MASOLHATO[key]) return;
        if (String(base[key] == null ? '' : base[key]).trim() === ''
            && String(other[key] == null ? '' : other[key]).trim() !== '') {
          base[key] = other[key];
        }
      });
      drop.add(other);
    });
  });
  return cars.filter(function (c) { return !drop.has(c); });
}
function isNew(c) {`,
'mergeDuplicates_ fuggveny');

rep(`  const cars = parseCSV(csv);
  for (const ec of EXTRA_CARS) if (!cars.some((c) => slugOf(c) === slugify(ec.modell))) cars.push(ec);`,
`  let cars = parseCSV(csv);
  for (const ec of EXTRA_CARS) if (!cars.some((c) => slugOf(c) === slugify(ec.modell))) cars.push(ec);
  const elotte = cars.length;
  cars = mergeDuplicates_(cars);
  if (cars.length !== elotte) console.log('Duplikalt sorok osszefuzve: ' + (elotte - cars.length));`,
'main: duplikaltak osszefuzese');

/* ---- a slugOf definiciojaban a global csere onmagara mutatna: visszaallitjuk -- */
rep('const slugOf   = (c) => String(c.slug || "").trim() || slugOf(c);',
    'const slugOf   = (c) => String(c.slug || "").trim() || slugify(c.modell);',
    'slugOf rekurzio-javitas');

/* ------------------------------------------------- 41. hero a katalogus fuleken
   Marc, 2026.08.30.: pontosan olyan hero, mint a tobbi oldalon (fooldal) —
   ugyanaz a video, logo, cim, alcim, ket gomb es a "Gorgess" jelzes. A fulvaltas
   csak a szoveget csereli, a video marad. */
rep(
`  const body = \`
<div class="wrap">
  <div class="crumb"><a href="../">Főoldal</a> / <b>Megvásárolható autóink</b></div>`,
`  const heroVar = (tab, h, p, cta, goto) => \`
  <div class="inner ch-var\${tab === "eladas" ? " on" : ""}" data-hero="\${tab}">
    <img class="brand-logo" src="/caradvance-logo-white.webp" alt="CarAdvance — the automotive people" width="403" height="133">
    \${tab === "eladas" ? \`<h1>\${esc(h)}</h1>\` : \`<div class="hh">\${esc(h)}</div>\`}
    <p class="sub">\${esc(p)}</p>
    <div class="cta-row"><a class="btn btn-primary" href="#autok"\${goto ? \` data-goto="\${goto}"\` : ""}>\${esc(cta)}</a><a class="btn btn-white" href="/eladom">Add el az autód</a></div>
  </div>\`;
  const body = \`
<section class="hero">
  <video class="video-bg" autoplay muted loop playsinline preload="auto" poster="/caradvance-hero-x5-poster.jpg"><source src="/caradvance-hero-x5.mp4" type="video/mp4"></video>
  <div class="overlay"></div>
\${heroVar("eladas", "Megvásárolható autóink",
  "Prémium autók Németországból, nettó áron — bevizsgálva, garanciával, teljes ügyintézéssel.",
  sale.length + " autó a készletben")}
\${heroVar("berelheto", "Bérelhető autóink",
  "Havidíjas konstrukció 6 hónaptól, 2 000 vagy 3 000 km/hó kerettel. A kaució a bérlés végén visszajár.",
  rent.length + " bérelhető autó")}
\${biz.length ? heroVar("bizomanyos", "Bizományos autóink",
  "Partnereink és magánszemélyek autói — ugyanazzal a bevizsgálással és ügyintézéssel, mint a saját készletünk.",
  biz.length + " bizományos autó") : ""}
\${sold.length ? heroVar("eladva", "Már elkelt autóink",
  "Ezeket az autókat mi hoztuk be és adtuk el. Ha hasonlót keresel, a teljes német piacról behozzuk neked.",
  "Aktuális készletünk", "eladas") : ""}
  <button class="scrolldown" type="button" aria-label="Görgess lejjebb" onclick="var e=document.getElementById('autok');if(e)e.scrollIntoView({behavior:'smooth'})">Görgess<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
</section>
<div class="wrap">
  <div class="crumb"><a href="../">Főoldal</a> / <b>Megvásárolható autóink</b></div>`,
'katalogus hero (fooldal-stilus)');

rep(
`  <div class="autok-head" style="margin:0 0 18px">
    <div class="autok-tabs" role="tablist">
      <button class="autok-tab on" data-tab="eladas"`,
`  <div class="autok-head" id="autok" style="margin:0 0 18px">
    <div class="autok-tabs" role="tablist">
      <button class="autok-tab on" data-tab="eladas"`,
'hero cta horgony');

rep(
`  <div class="chead"><h1>Megvásárolható autóink</h1><p>Prémium autók Németországból, nettó árakkal (áfa nélkül). Az árak élő árfolyammal frissülnek (1 € = <span id="ratev">\${rate}</span> Ft).</p></div>`,
`  <div class="crate">Az árak nettó árak (áfa nélkül), élő árfolyammal frissülnek — 1 € = <span id="ratev">\${rate}</span> Ft.</div>`,
'chead helyett arfolyam-sor');

rep(
`.crumb{font-size:14px;color:var(--muted);font-weight:600;margin-bottom:14px}`,
`.hero{position:relative;overflow:hidden;color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:540px;padding:20px 24px 72px;border-radius:32px;margin:8px 16px 16px;margin-top:calc(6px - var(--navh));background:linear-gradient(180deg,#17181C,#0B0B0D 62%,#060607)}
.hero .video-bg{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover}
.hero .overlay{position:absolute;inset:0;z-index:1;background:radial-gradient(1100px 460px at 50% -10%,rgba(226,0,26,.18),transparent 60%),linear-gradient(180deg,rgba(8,8,10,.42),rgba(8,8,10,.48) 45%,rgba(8,8,10,.7))}
.hero .inner{position:relative;z-index:2;max-width:1120px;margin:64px auto 0;display:none}
.hero .inner.on{display:block}
.hero .brand-logo{height:64px;width:auto;display:block;margin:0 auto 26px;filter:drop-shadow(0 4px 18px rgba(0,0,0,.5))}
.hero h1,.hero .hh{font-size:clamp(30px,4.6vw,52px);line-height:1.08;font-weight:800;letter-spacing:-.025em;margin:0 0 16px;text-shadow:0 2px 24px rgba(0,0,0,.35)}
.hero .sub{font-size:clamp(16px,1.7vw,19px);line-height:1.5;color:#E7EAF0;max-width:640px;margin:0 auto 32px;text-shadow:0 1px 12px rgba(0,0,0,.4)}
.hero .cta-row{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;align-items:center}
.hero .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:16px;padding:15px 32px;border-radius:999px;text-decoration:none;cursor:pointer;border:0;transition:background .15s}
.hero .btn-primary{background:var(--red);color:#fff;box-shadow:0 10px 30px rgba(226,0,26,.4)}
.hero .btn-primary:hover{background:#B80015}
.hero .btn-white{background:#fff;color:var(--navy)}
.hero .btn-white:hover{background:#ECEEF2}
.hero .scrolldown{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:3;display:flex;flex-direction:column;align-items:center;gap:4px;color:rgba(255,255,255,.82);background:none;border:0;cursor:pointer;font:inherit;letter-spacing:.05em;font-size:11px;text-transform:uppercase;animation:caScrollBob 1.9s ease-in-out infinite}
.hero .scrolldown svg{width:26px;height:26px}
@keyframes caScrollBob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,8px)}}
@media(max-width:640px){.hero{margin:8px;margin-top:calc(8px - var(--navh));border-radius:22px;padding:84px 18px 72px;min-height:480px}.hero .brand-logo{height:48px;margin-bottom:20px}}
.crate{font-size:14px;color:var(--muted);font-weight:600;margin:0 0 18px}
.crumb{font-size:14px;color:var(--muted);font-weight:600;margin-bottom:14px}`,
'katalogus hero css');

rep(
` tabs.forEach(function(b){b.addEventListener('click',function(){
  tabs.forEach(function(x){x.classList.toggle('on',x===b);});
  document.querySelectorAll('.autok-panel').forEach(function(p){p.classList.toggle('on',p.id==='panel-'+b.getAttribute('data-tab'));});`,
` var heroSwap=function(name){document.querySelectorAll('.hero .ch-var').forEach(function(v){v.classList.toggle('on',v.getAttribute('data-hero')===name);});};
 document.querySelectorAll('.btn[data-goto]').forEach(function(a){a.addEventListener('click',function(e){
  e.preventDefault();var g=a.getAttribute('data-goto');
  var t=tabs.filter(function(x){return x.getAttribute('data-tab')===g;})[0];if(t)t.click();
  var el=document.getElementById('autok');if(el)el.scrollIntoView({behavior:'smooth'});});});
 tabs.forEach(function(b){b.addEventListener('click',function(){
  tabs.forEach(function(x){x.classList.toggle('on',x===b);});
  heroSwap(b.getAttribute('data-tab'));
  document.querySelectorAll('.autok-panel').forEach(function(p){p.classList.toggle('on',p.id==='panel-'+b.getAttribute('data-tab'));});`,
'hero valtas a fulekkel');

/* -- a fulek bevezeto mondata mar a hero-ban van, itt csak ismetles volt -- */
[
  ['    <p class="ptab">Bérlés minimum 6 hónapos időtartamtól, havidíjas konstrukcióban. A havi díj a választott km-kerettől függ; a kaució egyszeri, a bérlés végén visszajár.</p>\n', 'ptab berlet'],
  ['    <p class="ptab">Bizományos autók: magánszemélyek és partnereink autói, amelyeket mi értékesítünk — ugyanazzal a bevizsgálással és ügyintézéssel.</p>\n', 'ptab bizomanyos'],
  ['    <p class="ptab">Ezek az autók már elkeltek — referenciaként hagyjuk fent őket. Ha hasonlót keresel, a teljes német piacról behozzuk neked.</p>\n', 'ptab eladva'],
].forEach(function (x) { rep(x[0], '', x[1] + ' torlese (a hero mondja el)'); });

fs.writeFileSync(file, s);
console.log('patch-generate: ' + log.length + ' modositas rendben');
