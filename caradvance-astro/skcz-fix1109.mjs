// Build lépés (a skcz-fix1104.mjs után fut): caradvance.sk + caradvance.cz — Mr. JOB SK „Súhrnná kontrola” (2026-11-06), Marc.
//  5   bérlési modelloldalak: a „Požiadať o ponuku” / „Chci nabídku” gombok (.sub-rent) nem a /kontakt/?berles=… oldalra
//      visznek, hanem a bérlési ablakot (abRent) nyitják az adott modellel; a #ponuka / #nabidka hivatkozás is megnyitja
//      (ugyanígy a PL / CH / EU és a SK / CZ idegen nyelvű oldalain: #offer)
//  6   összehasonlító táblázat: „visszaadod” → „vrátite ho” / „vrátíte ho”
//  7   Hľadám auto / Hledám vůz: két magyar mondat
//  8   bérlési modelloldal bevezetője, ha magyarul maradt (BMW X3) — a számok az aktuális kínálatból
//  10  felszereltség: „Vászontető” → „Plátenná strecha” / „Plátěná střecha”
//  12  SK VOP čl. 10: 2 éves kellékszavatosság új autóknál (fogyasztó)
//  13  adatkezelési tájékoztató 3. pont: „Príprava a elektronický podpis zmluvy” sor (SK + CZ)
//  14  a csapat nyelvei: a német törölve (szlovák, cseh, angol)
//  16  „Prémiové” fül bérelhető autói: az adatlap bérlési módban (#ca-rent) csak a bérlési ajánlatot mutatja (havidíj),
//      a „Požiadať o ponuku prenájmu” gomb saját bérlési űrlapot nyit (POST /api/lead), nem a magyar Kapcsolat oldalt
// Hiba esetén csak logol, a buildet nem állítja meg. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITES = [
  { lg: 'sk', root: path.join(DIST, 'sk'), sub: /^(en|de|hu)\//, hash: 'ponuka', rt: path.join(DIST, 'i18n', 'rt-sk.js') },
  { lg: 'cs', root: path.join(DIST, 'cs'), sub: /^(en|de)\//, hash: 'nabidka', rt: path.join(DIST, 'i18n', 'rt-cs.js') },
];

/* ---------- szövegek ---------- */
const LANGS = {
  sk: [['po slovensky, anglicky alebo nemecky', 'po slovensky, česky alebo anglicky'], ['po slovensky, anglicky aj nemecky', 'po slovensky, česky aj anglicky'],
       ['Po slovensky, anglicky alebo nemecky', 'Po slovensky, česky alebo anglicky'], ['Po slovensky, anglicky aj nemecky', 'Po slovensky, česky aj anglicky']],
  cs: [['česky, slovensky, anglicky nebo německy', 'česky, slovensky nebo anglicky'], ['Česky, slovensky, anglicky nebo německy', 'Česky, slovensky nebo anglicky']],
};
const WORDS = {
  sk: [['Vászontető', 'Plátenná strecha']],
  cs: [['Vászontető', 'Plátěná střecha']],
};
const HLADAM = {
  sk: [[/A szűrők ugyanazok, mint a (<b\b[^>]*>)mobile\.de<\/b> keresőjében — pontosan ezekkel a feltételekkel keresünk Németország teljes kínálatában\./g, 'Filtre sú rovnaké ako vo vyhľadávači $1mobile.de</b> — presne podľa týchto podmienok hľadáme v celej ponuke Nemecka.'],
       ['A szűrők ugyanazok, mint a mobile.de keresőjében — pontosan ezekkel a feltételekkel keresünk Németország teljes kínálatában.', 'Filtre sú rovnaké ako vo vyhľadávači mobile.de — presne podľa týchto podmienok hľadáme v celej ponuke Nemecka.'],
       ['További szűrők — szín, kárpit, felszereltség, ajtók, tulajdonosok…', 'Ďalšie filtre — farba, čalúnenie, výbava, dvere, počet majiteľov…']],
  cs: [[/A szűrők ugyanazok, mint a (<b\b[^>]*>)mobile\.de<\/b> keresőjében — pontosan ezekkel a feltételekkel keresünk Németország teljes kínálatában\./g, 'Filtry jsou stejné jako ve vyhledávači $1mobile.de</b> — přesně podle těchto podmínek hledáme v celé nabídce Německa.'],
       ['A szűrők ugyanazok, mint a mobile.de keresőjében — pontosan ezekkel a feltételekkel keresünk Németország teljes kínálatában.', 'Filtry jsou stejné jako ve vyhledávači mobile.de — přesně podle těchto podmínek hledáme v celé nabídce Německa.'],
       ['További szűrők — szín, kárpit, felszereltség, ajtók, tulajdonosok…', 'Další filtry — barva, čalounění, výbava, dveře, počet majitelů…']],
};
const VISSZA = { sk: 'vrátite ho', cs: 'vrátíte ho' };
const VOP_SK = [['<li>Na <strong>nové autá</strong> sa vzťahuje záruka výrobcu, resp. záruka poskytnutá v zmluve.</li>',
  '<li>Pri <strong>nových autách</strong> – pri zákazníkovi, ktorý je spotrebiteľom – zodpovedá Poskytovateľ za vady 2 roky od prevzatia; okrem toho sa na ne vzťahuje záruka výrobcu.</li>'],
  ['Na nové autá sa vzťahuje záruka výrobcu, resp. záruka poskytnutá v zmluve.', 'Pri nových autách – pri zákazníkovi, ktorý je spotrebiteľom – zodpovedá Poskytovateľ za vady 2 roky od prevzatia; okrem toho sa na ne vzťahuje záruka výrobcu.']];
const PRIV = {
  sk: { file: 'ochrana-osobnych-udajov/index.html', after: /<tr><td><strong>Uzavretie a plnenie zmluvy<\/strong>[\s\S]*?<\/tr>/, mark: 'Príprava a elektronický podpis zmluvy',
        row: '<tr><td><strong>Príprava a elektronický podpis zmluvy</strong></td><td>Caradvance GmbH</td><td>údaje a kópie dokladov zadané cez zabezpečený formulár, podpis, čas podpisu, IP adresa a údaje o zariadení (protokol o podpise)</td><td>GDPR čl. 6 ods. 1 písm. b)</td><td>rovnaká lehota ako pri zmluve</td></tr>' },
  cs: { file: 'ochrana-osobnich-udaju/index.html', after: /<tr><td><strong>Uzavření a plnění smlouvy<\/strong>[\s\S]*?<\/tr>/, mark: 'Příprava a elektronický podpis smlouvy',
        row: '<tr><td><strong>Příprava a elektronický podpis smlouvy</strong></td><td>Caradvance GmbH</td><td>údaje a kopie dokladů zadané přes zabezpečený formulář, podpis, čas podpisu, IP adresa a údaje o zařízení (protokol o podpisu)</td><td>GDPR čl. 6 odst. 1 písm. b)</td><td>stejná lhůta jako u smlouvy</td></tr>' },
};

/* ---------- 8: magyarul maradt bérlési bevezető ---------- */
const LEAD_RE = /<p class="cd-lead"([^>]*)>A <strong>((?:Prenájom|Pronájem) [^<]+)<\/strong> a legegyszerűbb út egy vadonatúj prémium ([^<:]+?)-(?:hoz|hez|höz): <strong>[^<]*<\/strong> (od [^<]+?\/(?:mes|měs)\.) vezetheted, ([\d\s ]+[–-][\d\s ]+) km\/hó futáskerettel és (\d+) hónapos futamidővel\. Jelenleg ([\d\s ]+) db [^<(]+? közül választhatsz \(([\d\s ]+) db azonnal elérhető\), ([^<]+?) kivitelben\. Egyszeri, visszajáró <strong>[^<]*<\/strong> ([\d\s ]+) €-tól; a szervizt, az adót és a nyári-téli gumit mi álljuk\. Nem kell tulajdonolnod: a bérlet végén egyszerűen visszaadod, vagy új modellre váltasz\.<\/p>/g;
const num = (s) => +String(s).replace(/\D/g, '');
const fmtN = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// „z” / „zo” (SK), „z” / „ze” (CZ): a szám kiejtett alakja szerint
function zPrep(n, lg) {
  const s = String(n), d = +s[0], len = s.length;
  const sib = (len === 1 && [4, 6, 7].includes(d)) || (len === 2 && (['14', '16', '17'].includes(s) || [4, 6, 7].includes(d))) || (len === 3 && [1, 4, 6, 7].includes(d));
  return sib ? (lg === 'sk' ? 'zo' : 'ze') : 'z';
}
const andList = (s, lg) => { const a = s.split(/\s*,\s*/).filter(Boolean); return a.length < 2 ? s : a.slice(0, -1).join(', ') + (lg === 'sk' ? ' a ' : ' a ') + a[a.length - 1]; };
function fixLead(h, lg) {
  return h.replace(LEAD_RE, (m, at, title, body, price, km, term, total, now, vers, dep) => {
    const t = num(total), n = num(now), kmS = km.replace(/\s*[–-]\s*/, '–').replace(/\s+/g, ' ').trim(), months = +term;
    const isSuv = /SUV/i.test(body);
    if (lg === 'sk') {
      const mes = months >= 5 ? 'mesiacov' : months >= 2 ? 'mesiace' : 'mesiac';
      return '<p class="cd-lead"' + at + '><strong>' + title + '</strong> je najjednoduchšia cesta k úplne novému prémiovému ' + (isSuv ? 'SUV' : 'autu') + ': v <strong>dlhodobom prenájme</strong> ho môžete jazdiť ' + price + ', s limitom ' + kmS + ' km/mesiac a dobou prenájmu ' + months + ' ' + mes + '. Momentálne si môžete vybrať ' + zPrep(t, 'sk') + ' ' + fmtN(t) + ' áut ' + title.replace(/^Prenájom\s+/, '') + ' (' + fmtN(n) + ' ihneď k dispozícii) vo vyhotoveniach ' + andList(vers, 'sk') + '. Jednorazová vratná <strong>kaucia</strong> od ' + fmtN(num(dep)) + ' €; servis, daň a letné aj zimné pneumatiky hradíme my. Auto nemusíte vlastniť: na konci prenájmu ho jednoducho vrátite alebo prejdete na nový model.</p>';
    }
    const mes = months >= 5 ? 'měsíců' : months >= 2 ? 'měsíce' : 'měsíc';
    return '<p class="cd-lead"' + at + '><strong>' + title + '</strong> je nejjednodušší cesta k úplně novému prémiovému ' + (isSuv ? 'SUV' : 'vozu') + ': v <strong>dlouhodobém pronájmu</strong> s ním můžete jezdit ' + price + ', s limitem ' + kmS + ' km/měsíc a dobou pronájmu ' + months + ' ' + mes + '. Aktuálně si můžete vybrat ' + zPrep(t, 'cs') + ' ' + fmtN(t) + ' vozů ' + title.replace(/^Pronájem\s+/, '') + ' (' + fmtN(n) + ' ihned k dispozici) ve verzích ' + andList(vers, 'cs') + '. Jednorázová vratná <strong>kauce</strong> od ' + fmtN(num(dep)) + ' €; servis, daň a letní i zimní pneumatiky hradíme my. Vůz nemusíte vlastnit: na konci pronájmu ho jednoduše vrátíte nebo přejdete na nový model.</p>';
  });
}

/* ---------- 5: bérlési gombok ---------- */
const OPEN_JS = (hash) => '<script id="ca-rent-hash">(function(){var H="#' + hash + '";function go(){if(location.hash!==H)return;var b=document.querySelector(".sub-rent");if(!b)return;if(window.caOpenRent){window.caOpenRent(b.dataset);}else{b.click();}}' +
  'function boot(){setTimeout(go,60);}if(document.readyState==="complete")boot();else window.addEventListener("load",boot);window.addEventListener("hashchange",go);})();</script>';
function fixRentBtns(h, hash) {
  let n = 0;
  h = h.replace(/<a\b([^>]*\bclass="[^"]*\bsub-rent\b[^"]*"[^>]*)>/g, (tag, at) => {
    if (!/\shref="[^"]*[?&](?:amp;)?berles=/.test(at)) return tag;
    n++; return '<a' + at.replace(/\shref="[^"]*"/, ' href="#' + hash + '"') + '>';
  });
  if (n && h.indexOf('id="ca-rent-hash"') < 0) { const bi = h.lastIndexOf('</body>'); if (bi > 0) h = h.slice(0, bi) + OPEN_JS(hash) + h.slice(bi); }
  return { h, n };
}

/* ---------- 16: prémium bérelhető autó adatlapja ---------- */
const RQ = {
  sk: { show: 'Zobraziť aj predajnú cenu', name: 'Meno a priezvisko', email: 'E-mail', phone: 'Telefón', company: 'Firma (nepovinné)', km: 'Mesačný limit km', msg: 'Poznámka (nepovinné)', send: 'Odoslať žiadosť o prenájom', sending: 'Odosiela sa…',
        consent: 'Súhlasím so spracovaním osobných údajov podľa <a href="/ochrana-osobnych-udajov/" target="_blank" rel="noopener">zásad ochrany osobných údajov</a>.', ok: 'Ďakujeme! Vašu žiadosť sme dostali — čoskoro sa vám ozveme s ponukou.', err: 'Odoslanie sa nepodarilo. Zavolajte nám na +421 915 410 555 alebo napíšte na info@caradvance.sk.', need: 'Vyplňte meno, e-mail a telefón a potvrďte súhlas.', type: 'Prenájom' },
  cs: { show: 'Zobrazit i prodejní cenu', name: 'Jméno a příjmení', email: 'E-mail', phone: 'Telefon', company: 'Firma (nepovinné)', km: 'Měsíční limit km', msg: 'Poznámka (nepovinné)', send: 'Odeslat poptávku pronájmu', sending: 'Odesílá se…',
        consent: 'Souhlasím se zpracováním osobních údajů podle <a href="/ochrana-osobnich-udaju/" target="_blank" rel="noopener">zásad ochrany osobních údajů</a>.', ok: 'Děkujeme! Vaši poptávku jsme obdrželi — brzy se vám ozveme s nabídkou.', err: 'Odeslání se nezdařilo. Zavolejte nám na +420 604 313 136 nebo napište na info@caradvance.cz.', need: 'Vyplňte jméno, e-mail a telefon a potvrďte souhlas.', type: 'Pronájem' },
};
const RQ_CSS = '<style id="ca-rq-css">#ca-rent .ca-rq-btn{display:block;width:100%;text-align:center;background:#00806A;color:#fff;font:inherit;font-weight:800;border:0;border-radius:10px;padding:12px 14px;cursor:pointer}#ca-rent .ca-rq-btn:hover{background:#006b59}#ca-rent .ca-rq-btn[hidden]{display:none}#ca-rent{scroll-margin-top:96px}' +
  '#ca-rent form.ca-rq{display:grid;gap:8px;margin-top:12px}#ca-rent form.ca-rq[hidden]{display:none}#ca-rent .ca-rq input,#ca-rent .ca-rq select,#ca-rent .ca-rq textarea{width:100%;box-sizing:border-box;font:inherit;font-size:14px;border:1px solid #d5dbe5;border-radius:9px;padding:10px 11px;background:#fff;color:#141519}' +
  '#ca-rent .ca-rq textarea{min-height:64px;resize:vertical}#ca-rent .ca-rq label.ca-rq-c{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:#5a6b82;line-height:1.4}#ca-rent .ca-rq label.ca-rq-c input{width:auto;margin-top:2px}#ca-rent .ca-rq label.ca-rq-c a{display:inline;background:none;color:#00806A;padding:0;font-weight:700;text-decoration:underline}' +
  '#ca-rent .ca-rq .ca-rq-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}#ca-rent .ca-rq-msg{font-size:13.5px;line-height:1.45;margin:10px 0 0;padding:10px 12px;border-radius:9px}#ca-rent .ca-rq-msg.ok{background:#e3f5f0;color:#00594a}#ca-rent .ca-rq-msg.err{background:#fde8ea;color:#a3001a}' +
  '#ca-rent .ca-rq-show{display:inline-block;margin-top:10px;background:none!important;color:#00806A!important;padding:0!important;font-size:13px;font-weight:700;text-decoration:underline;text-align:left}' +
  'html.ca-rentmode #ca-rent+.panel{display:none}html.dark #ca-rent,[data-theme=dark] #ca-rent{background:#15181d}html.dark #ca-rent .ca-rq input,html.dark #ca-rent .ca-rq select,html.dark #ca-rent .ca-rq textarea{background:#0f1115;color:#e9edf3;border-color:#2a303a}</style>';
function rqForm(L) {
  return '<button type="button" class="ca-rq-btn" aria-expanded="false">' + '%CTA%' + '</button>' +
    '<form class="ca-rq" hidden novalidate>' +
    '<input name="name" autocomplete="name" placeholder="' + L.name + ' *" aria-label="' + L.name + '" required>' +
    '<input name="email" type="email" autocomplete="email" placeholder="' + L.email + ' *" aria-label="' + L.email + '" required>' +
    '<input name="phone" type="tel" autocomplete="tel" placeholder="' + L.phone + ' *" aria-label="' + L.phone + '" required>' +
    '<input name="company" autocomplete="organization" placeholder="' + L.company + '" aria-label="' + L.company + '">' +
    '<select name="km" aria-label="' + L.km + '"></select>' +
    '<textarea name="message" placeholder="' + L.msg + '" aria-label="' + L.msg + '"></textarea>' +
    '<input class="ca-rq-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<label class="ca-rq-c"><input type="checkbox" name="consent" required> <span>' + L.consent + '</span></label>' +
    '<button type="submit" class="ca-rq-btn">' + L.send + '</button></form><p class="ca-rq-msg" hidden></p>';
}
const RQ_JS = (L) => '<script id="ca-rq-js">(function(){var L=' + JSON.stringify({ show: L.show, send: L.send, sending: L.sending, ok: L.ok, err: L.err, need: L.need, type: L.type, km: L.km }) + ';var box=document.getElementById("ca-rent");if(!box)return;' +
  'var btn=box.querySelector(".ca-rq-btn"),f=box.querySelector("form.ca-rq"),msg=box.querySelector(".ca-rq-msg"),sel=f&&f.querySelector("select[name=km]");if(!btn||!f)return;' +
  'var rows=[].slice.call(box.querySelectorAll(".rentprices .rp")).filter(function(r){return !/\\bkau\\b/.test(r.className);}).map(function(r){var s=r.querySelector("span"),b=r.querySelector("b");return {l:(s?s.textContent:"").replace(/:\\s*$/,"").trim(),p:(b?b.textContent:"").trim()};}).filter(function(x){return x.l;});' +
  'rows.forEach(function(x){var o=document.createElement("option");o.value=x.l;o.textContent=x.l+(x.p?" — "+x.p:"");sel.appendChild(o);});if(!rows.length)sel.remove();' +
  'var kau=box.querySelector(".rentprices .rp.kau b");' +
  'if(location.hash==="#ca-rent"){document.documentElement.classList.add("ca-rentmode");var a=document.createElement("a");a.href="#";a.className="ca-rq-show";a.textContent=L.show;a.addEventListener("click",function(e){e.preventDefault();document.documentElement.classList.remove("ca-rentmode");a.remove();var p=box.nextElementSibling;if(p&&p.scrollIntoView)p.scrollIntoView({behavior:"smooth",block:"start"});});box.appendChild(a);}' +
  'btn.addEventListener("click",function(){f.hidden=!f.hidden;btn.setAttribute("aria-expanded",String(!f.hidden));if(!f.hidden){btn.hidden=true;var i=f.querySelector("input");if(i)i.focus();}});' +
  'f.addEventListener("submit",function(e){e.preventDefault();var fd=new FormData(f),sb=f.querySelector("button[type=submit]");var nm=(fd.get("name")||"").trim(),em=(fd.get("email")||"").trim(),ph=(fd.get("phone")||"").trim();' +
  'if(!nm||!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(em)||ph.replace(/\\D/g,"").length<6||!fd.get("consent")){msg.hidden=false;msg.className="ca-rq-msg err";msg.textContent=L.need;return;}' +
  'var km=fd.get("km")||"",row=rows.filter(function(x){return x.l===km;})[0];var h1=document.querySelector("h1"),t=(h1?h1.textContent:document.title).replace(/\\s+/g," ").trim();' +
  'var P={"Típus":"Bérlés","Konstrukció":"Bérlés","Autó":t,"Km-keret":km,"Becsült havidíj":row?row.p:"","Kaució":kau?kau.textContent.trim():"","Cégnév":(fd.get("company")||"").trim(),"Vásárló":(fd.get("company")||"").trim()?"Cég":"","Név":nm,"Telefon":ph,"E-mail":em,"Megjegyzés":(fd.get("message")||"").trim(),"website":fd.get("website")||"","consent":true,"page":location.href.split("#")[0]};' +
  'try{if(window.caLeadExtras)Object.assign(P,window.caLeadExtras());}catch(_e){}sb.disabled=true;sb.textContent=L.sending;' +
  'fetch("/api/lead",{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(P)}).then(function(r){if(!r.ok)throw 0;}).then(function(){try{if(window.caFireLead)window.caFireLead("berles");}catch(_e){}f.reset();f.hidden=true;msg.hidden=false;msg.className="ca-rq-msg ok";msg.textContent=L.ok;})' +
  '.catch(function(){sb.disabled=false;sb.textContent=L.send;msg.hidden=false;msg.className="ca-rq-msg err";msg.textContent=L.err;});});})();</script>';
function fixPremium(h, lg) {
  const i = h.indexOf('<div id="ca-rent">'); if (i < 0 || h.indexOf('id="ca-rq-js"') > 0) return h;
  const L = RQ[lg];
  // a doboz végén lévő CTA-link (bármilyen href) → gomb + űrlap
  const j = h.indexOf('</div>', h.indexOf('<p>', i));
  const seg = h.slice(i, j + 6);
  const m = seg.match(/<a href="[^"]*">([^<]+)<\/a><\/div>$/); if (!m) return h;
  const seg2 = seg.slice(0, seg.length - m[0].length) + rqForm(L).replace('%CTA%', m[1]) + '</div>';
  h = h.slice(0, i) + RQ_CSS + '<script>if(location.hash==="#ca-rent")document.documentElement.classList.add("ca-rentmode")</script>' + seg2 + h.slice(j + 6);
  const bi = h.lastIndexOf('</body>'); if (bi > 0) h = h.slice(0, bi) + RQ_JS(L) + h.slice(bi);
  return h;
}

/* ---------- segédek ---------- */
const R = (h, list) => { for (const [a, b] of list) h = typeof a === 'string' ? h.split(a).join(b) : h.replace(a, b); return h; };
function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); }
  return out;
}
const RAWB = /(<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<textarea\b[\s\S]*?<\/textarea\s*>|<!--[\s\S]*?-->)/i;
function inText(h, fn) {
  const blocks = h.split(RAWB);
  for (let i = 0; i < blocks.length; i += 2) blocks[i] = blocks[i].split(/(<[^>]*>)/).map((p) => (p && p[0] !== '<' ? fn(p) : p)).join('');
  return blocks.join('');
}

/* ---------- futtatás ---------- */
const stat = {};
for (const S of SITES) {
  const st = stat[S.lg] = { pages: 0, btn: 0, btnPages: 0, lead: 0, prem: 0, priv: 0, vop: 0, lang: 0 };
  try {
    for (const f of walk(S.root, [])) {
      const rel = path.relative(S.root, f).split(path.sep).join('/');
      const isHtml = /\.html$/.test(f), isData = /\.(json|js)$/.test(f);
      if (!isHtml && !isData) continue;
      const sub = S.sub.test(rel);
      const s = fs.readFileSync(f, 'utf8'); let h = s;
      if (isData) {
        if (sub) continue;
        h = R(R(h, LANGS[S.lg]), WORDS[S.lg]);
        if (h !== s) fs.writeFileSync(f, h);
        continue;
      }
      if (sub) {
        // idegen nyelvű alváltozat: csak a bérlési gombok
        const b = fixRentBtns(h, 'offer'); h = b.h; st.btn += b.n; if (b.n) st.btnPages++;
        if (h !== s) { fs.writeFileSync(f, h); st.pages++; }
        continue;
      }
      // 8 (előbb, mert a bekezdés a „visszaadod” szót is tartalmazza)
      if (h.indexOf('a legegyszerűbb út') > 0) { const h2 = fixLead(h, S.lg); if (h2 !== h) { st.lead++; h = h2; } }
      // 6
      if (h.indexOf('visszaadod') > 0) h = inText(h, (t) => t.replace(/\bvisszaadod\b/g, VISSZA[S.lg]));
      // 7
      if (/^(hladam-auto|hledam-vuz)\//.test(rel) || h.indexOf('A szűrők ugyanazok') > 0 || h.indexOf('További szűrők') > 0) h = R(h, HLADAM[S.lg]);
      // 10, 14
      const hl = h; h = R(h, LANGS[S.lg]); if (h !== hl) st.lang++;
      h = R(h, WORDS[S.lg]);
      // 12
      if (S.lg === 'sk' && rel === 'obchodne-podmienky/index.html') { const h2 = R(h, VOP_SK); if (h2 !== h) { st.vop++; h = h2; } }
      // 13
      const PV = PRIV[S.lg];
      if (rel === PV.file && h.indexOf(PV.mark) < 0) { const h2 = h.replace(PV.after, (m) => m + ' ' + PV.row); if (h2 !== h) { st.priv++; h = h2; } }
      // 5
      const b = fixRentBtns(h, S.hash); h = b.h; st.btn += b.n; if (b.n) st.btnPages++;
      // 16
      if (/^auto\/[^/]+\/index\.html$/.test(rel)) { const h2 = fixPremium(h, S.lg); if (h2 !== h) { st.prem++; h = h2; } }
      if (h !== s) { fs.writeFileSync(f, h); st.pages++; }
    }
    // futásidejű szótár és keresőindex
    for (const f of [S.rt, path.join(DIST, 'kereses-index-' + S.lg + '.json'), path.join(S.root, 'kereses-index.json')]) {
      if (!fs.existsSync(f)) continue;
      const s = fs.readFileSync(f, 'utf8'); const h = R(R(s, LANGS[S.lg]), WORDS[S.lg]); if (h !== s) fs.writeFileSync(f, h);
    }
    console.log('[skcz-fix1109] ' + S.lg + ': ' + st.pages + ' oldal · bérlési gomb: ' + st.btn + ' (' + st.btnPages + ' oldal) · bevezető: ' + st.lead + ' · prémium bérlés űrlap: ' + st.prem + ' · nyelvek: ' + st.lang + ' oldal · VOP: ' + st.vop + ' · adatkezelés: ' + st.priv);
  } catch (e) { console.log('[skcz-fix1109] ' + S.lg + ' hiba:', e && e.stack || e); }
}

// PL / CH / EU: ugyanaz a bérlési gomb (a /kontakt/?berles= helyett a bérlési ablak)
try {
  let n = 0, p = 0;
  for (const d of ['pl', 'ch', 'eu']) {
    for (const f of walk(path.join(DIST, d), [])) {
      if (!/\.html$/.test(f)) continue;
      const s = fs.readFileSync(f, 'utf8'); if (s.indexOf('sub-rent') < 0) continue;
      const b = fixRentBtns(s, 'offer'); if (b.n) { fs.writeFileSync(f, b.h); n += b.n; p++; }
    }
  }
  console.log('[skcz-fix1109] PL / CH / EU bérlési gomb: ' + n + ' (' + p + ' oldal)');
} catch (e) { console.log('[skcz-fix1109] PL / CH / EU hiba:', e && e.message); }
