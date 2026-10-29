// CarAdvance — dokumentum-PDF (sablonokból kitöltött szerződések, meghatalmazások, nyilatkozatok).
// Saját, függőség nélküli PDF-író (Poppins betűkészlet, logó), a CarAdvance import-szerződések arculatával:
// futó fejléc, logós címlap-fej, piros címke, cím + alcím, szürke megjegyzésdoboz, kétnyelvű hasábok elválasztó
// vonallal, címke–érték táblázatok, összegsorok, keretek, többhasábos aláírásblokk, cégadatos lábléc, oldalszám.
//
// Sablon-szintaxis (soronként):
//   @fejléc: bal | jobb            futó fejléc minden oldalon (alapértelmezés: a dokumentum címe)
//   @lábléc: Cím ;; oszlop ;; …   cégadatos lábléc; oszlopon belül „ // ” = új sor, „Címke:: érték”, „~szürke sor”
//   @mező: Címke / Fordítás | érték   a címlap bal felső adatai (Ügyszám, Szerződésszám, Dátum) — több sor lehet
//   @cégsor: szöveg              kis szürke sor a címlap-fej alatt     @címke: SZÖVEG   piros címke a cím fölött
//   @logó: nem                    logó elrejtése                       @aláírás-felirat: Unterschrift / Aláírás
//   @nyelv: hu | de-hu            egy- vagy kétnyelvű feliratok (alapból: kétnyelvű, ha van „## … || …” vagy kéthasábos bekezdés)
//   # Cím || Alcím   ## Fejezet || Fejezet (HU)   ### Alcím || Alcím
//   bal || jobb                   két hasáb (DE | HU) elválasztó vonallal; egy sor = egy bekezdés
//   [sor] Címke | érték || Címke | érték      táblázatsor (üres / kipontozott érték = kitöltendő vonal)
//   [összeg] Címke | érték || …   összegsor   [összeg!] … kiemelt (keretes, félkövér) összegsor
//   [megjegyzés] bal || jobb      szürke megjegyzésdoboz piros szegéllyel
//   [keret] … [/keret]            keretes blokk   [keret szürke] … szürke hátterű keret
//   [aláírás] Cím ~ alcím ~~ név | …   aláírási hasábok (2–4)   [aláírás+] … Dátum / Helység sorokkal
//   [címke] SZÖVEG   [oldaltörés]   ---   - felsorolás   [ ] / [x] jelölőnégyzet   **félkövér**   1. számozott pont
//   „ // ” a szövegen / táblázatcellán belül = sortörés
import { DOC_FONTS } from './docpdf-font.js';
import { LOGO_JPG, LOGO_W, LOGO_H } from './docpdf-logo.js';

const PW = 595.28, PH = 841.89, ML = 34, MR = 34, CW = PW - ML - MR;
const C = { ink: '0.086 0.098 0.133', txt: '0.16 0.17 0.2', mut: '0.42 0.45 0.5', lab: '0.5 0.53 0.58', line: '0.86 0.88 0.91', soft: '0.93 0.94 0.95', red: '0.886 0 0.102', note: '0.957 0.961 0.969', blank: '0.45 0.47 0.52' };
const HEX4 = Array.from({ length: 4096 }, (_, i) => i.toString(16).padStart(4, '0'));
const TBL = {}; const BYTES = {};
function b64ToBytes(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function table(f) {
  if (TBL[f]) return TBL[f];
  const T = []; for (const [cp, g] of Object.entries(DOC_FONTS[f].map)) T[Number(cp)] = { g: g[0], h: HEX4[g[0]], w: g[1] };
  return (TBL[f] = T);
}
const SUBST = { 0x2212: 0x2013, 0xa0: 0x20, 0x2610: 0x20, 0x2611: 0x20, 0x2612: 0x20, 0x202f: 0x20, 0x2009: 0x20 };
const n2 = (v) => (Math.round(v * 100) / 100).toString();

/* ============================== alacsony szintű PDF ============================== */
class Doc {
  constructor() { this.pages = []; this.used = {}; for (const f of Object.keys(DOC_FONTS)) this.used[f] = new Array(DOC_FONTS[f].ng).fill(0); this.newPage(); }
  newPage() { this.cur = []; this.pages.push(this.cur); }
  enc(text, f) {
    const T = table(f); const used = this.used[f]; let hex = ''; const s = String(text);
    for (let i = 0; i < s.length; i++) { let cp = s.charCodeAt(i); if (SUBST[cp] != null) cp = SUBST[cp]; let e = T[cp]; if (!e) { cp = 63; e = T[63]; } used[e.g] = cp; hex += e.h; }
    return hex;
  }
  width(text, f, size) {
    const T = table(f); let w = 0; const s = String(text);
    for (let i = 0; i < s.length; i++) { let cp = s.charCodeAt(i); if (SUBST[cp] != null) cp = SUBST[cp]; const e = T[cp] || T[63]; w += e.w; }
    return w * size / 1000;
  }
  text(t, x, y, f, size, color, page) { (page || this.cur).push(`BT ${color || C.ink} rg /F${f} ${n2(size)} Tf ${n2(x)} ${n2(y)} Td <${this.enc(t, f)}> Tj ET`); }
  line(x1, y1, x2, y2, color, w, page) { (page || this.cur).push(`${color || C.line} RG ${w || 0.6} w ${n2(x1)} ${n2(y1)} m ${n2(x2)} ${n2(y2)} l S`); }
  fill(x, y, w, h, color, page) { (page || this.cur).push(`${color} rg ${n2(x)} ${n2(y)} ${n2(w)} ${n2(h)} re f`); }
  stroke(x, y, w, h, color, lw, page) { (page || this.cur).push(`${color || C.line} RG ${lw || 0.6} w ${n2(x)} ${n2(y)} ${n2(w)} ${n2(h)} re S`); }
  box(x, y, s, on, page) { // jelölőnégyzet: y = alapvonal
    const p = page || this.cur; p.push(`${C.mut} RG 0.6 w ${n2(x)} ${n2(y - 1)} ${n2(s)} ${n2(s)} re S`);
    if (on) p.push(`${C.ink} RG 0.9 w ${n2(x + 1.6)} ${n2(y + s * 0.45 - 1)} m ${n2(x + s * 0.42)} ${n2(y + 0.6)} l ${n2(x + s - 1.4)} ${n2(y + s - 2.4)} l S`);
  }
  /** Kép: alapból a logó; img = { bytes: Uint8Array JPEG, w, h, comps } egyéb (pl. aláírás) JPEG-hez. */
  image(x, y, w, h, page, img) {
    if (!this.imgs) this.imgs = [];
    let k = img ? this.imgs.indexOf(img) : this.imgs.findIndex((q) => q.logo);
    if (k < 0) { this.imgs.push(img || { logo: true }); k = this.imgs.length - 1; }
    (page || this.cur).push(`q ${n2(w)} 0 0 ${n2(h)} ${n2(x)} ${n2(y)} cm /Im${k} Do Q`);
  }
  build(info, decorate) {
    const te = new TextEncoder(); const chunks = []; const offs = []; let pos = 0;
    const push = (x) => { const u = typeof x === 'string' ? te.encode(x) : x; chunks.push(u); pos += u.length; };
    // a fej- és lábléc (oldalszám) a végén kerül az oldalakra — előbb, hogy a felhasznált karakterek is bekerüljenek a fontba
    const total = this.pages.length; this.pages.forEach((pg, i) => decorate(pg, i, total));
    const objs = []; const add = (b) => { objs.push(b); return objs.length; };
    const fontRef = {}; const fonts = Object.keys(DOC_FONTS).filter((f) => this.used[f].some(Boolean));
    for (const f of fonts) {
      const F = DOC_FONTS[f]; const ttf = BYTES[f] || (BYTES[f] = b64ToBytes(F.b64));
      const ff = add({ dict: `/Length1 ${ttf.length}`, stream: ttf });
      const fd = add(`<< /Type /FontDescriptor /FontName /${F.name} /Flags 32 /FontBBox [${F.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${F.asc} /Descent ${F.desc} /CapHeight ${F.cap} /StemV ${f === 'B' || f === 'S' ? 120 : 70} /FontFile2 ${ff} 0 R >>`);
      const ws = Object.values(F.map).sort((a, b) => a[0] - b[0]).map((g) => `${g[0]} [${g[1]}]`).join(' ');
      const cid = add(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${F.name} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${fd} 0 R /W [${ws}] /CIDToGIDMap /Identity >>`);
      const used = []; this.used[f].forEach((u, g) => { if (u) used.push([g, u]); });
      let cm = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
      for (let i = 0; i < used.length; i += 100) { const part = used.slice(i, i + 100); cm += `${part.length} beginbfchar\n` + part.map(([g, u]) => `<${HEX4[g]}> <${u.toString(16).padStart(4, '0')}>`).join('\n') + '\nendbfchar\n'; }
      cm += 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
      const tu = add({ dict: '', stream: te.encode(cm) });
      fontRef[f] = add(`<< /Type /Font /Subtype /Type0 /BaseFont /${F.name} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${tu} 0 R >>`);
    }
    const imgRefs = (this.imgs || []).map((im) => {
      if (im.logo) { const jb = BYTES.logo || (BYTES.logo = b64ToBytes(LOGO_JPG)); return add({ dict: `/Type /XObject /Subtype /Image /Width ${LOGO_W} /Height ${LOGO_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, stream: jb }); }
      return add({ dict: `/Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /${im.comps === 1 ? 'DeviceGray' : 'DeviceRGB'} /BitsPerComponent 8 /Filter /DCTDecode`, stream: im.bytes });
    });
    const xobj = imgRefs.length ? `/XObject << ${imgRefs.map((r, k) => `/Im${k} ${r} 0 R`).join(' ')} >>` : '';
    const pagesId = objs.length + this.pages.length * 2 + 1;
    const pageIds = [];
    const fontDict = fonts.map((f) => `/F${f} ${fontRef[f]} 0 R`).join(' ');
    for (const ops of this.pages) {
      const cId = add({ dict: '', stream: te.encode(ops.join('\n')) });
      pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << ${fontDict} >> ${xobj} >> /Contents ${cId} 0 R >>`));
    }
    const pid = add(`<< /Type /Pages /Kids [${pageIds.map((p) => p + ' 0 R').join(' ')}] /Count ${pageIds.length} >>`);
    if (pid !== pagesId) throw new Error('pdf pages id');
    const pdfStr = (s) => '<FEFF' + [...String(s)].map((ch) => ch.codePointAt(0).toString(16).padStart(4, '0')).join('').toUpperCase() + '>';
    const infoId = add(`<< /Title ${pdfStr(info.title || 'Dokumentum')} /Author ${pdfStr(info.author || 'CarAdvance')} /Producer (CarAdvance CRM) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z) >>`);
    const catId = add(`<< /Type /Catalog /Pages ${pid} 0 R >>`);
    push('%PDF-1.7\n'); push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    objs.forEach((o, i) => {
      offs.push(pos);
      if (typeof o === 'string') push(`${i + 1} 0 obj\n${o}\nendobj\n`);
      else { push(`${i + 1} 0 obj\n<< ${o.dict} /Length ${o.stream.length} >>\nstream\n`); push(o.stream); push('\nendstream\nendobj\n'); }
    });
    const xref = pos;
    push(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
    push(`trailer\n<< /Size ${objs.length + 1} /Root ${catId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(pos); let p = 0; for (const c of chunks) { out.set(c, p); p += c.length; }
    return out;
  }
}

/* ============================== gazdag szöveg (félkövér, jelölőnégyzet, kitöltendő vonal) ============================== */
const BLANK_RE = /^(?:…{2,}|\.{4,}|_{3,})$/;
/** Szöveg → szavak; minden szó szegmensek listája: {t, f} | {box, on} | {blank} */
function tokenize(text, base, bold) {
  const words = []; let curW = null; let isBold = false;
  const pushSeg = (seg) => { if (!curW) { curW = []; words.push(curW); } curW.push(seg); };
  const s = String(text).replace(/\s+/g, ' ').trim();
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('**', i)) { isBold = !isBold; i += 2; continue; }
    if (s[i] === ' ') { curW = null; i++; continue; }
    if (s.startsWith('// ', i) && (i === 0 || s[i - 1] === ' ')) { words.push([{ br: true }]); curW = null; i += 3; continue; }
    const cb = s.slice(i, i + 3).match(/^\[( |x|X)\]/);
    if (cb) { pushSeg({ box: true, on: cb[1] !== ' ' }); curW = null; i += 3; continue; }
    const bl = s.slice(i).match(/^(…{2,}|\.{4,}|_{3,})/);
    if (bl) { pushSeg({ blank: true }); i += bl[1].length; continue; }
    let j = i; while (j < s.length && s[j] !== ' ' && !s.startsWith('**', j) && !/^\[( |x|X)\]/.test(s.slice(j, j + 3)) && !/^(…{2,}|\.{4,}|_{3,})/.test(s.slice(j))) j++;
    if (j === i) j = i + 1;
    pushSeg({ t: s.slice(i, j), f: isBold ? bold : base }); i = j;
  }
  return words;
}
function segW(d, seg, size) { return seg.box ? size * 0.95 + 3 : seg.blank ? size * 7.5 : d.width(seg.t, seg.f, size); }
function wordW(d, w, size) { return w.reduce((a, s) => a + segW(d, s, size), 0); }
/** Sorokra törés: [{words, w}] */
function wrapWords(d, words, size, maxW, base) {
  const sp = d.width(' ', base, size); const lines = []; let line = []; let lw = 0;
  for (const w of words) {
    if (w[0] && w[0].br) { lines.push({ words: line, w: lw }); line = []; lw = 0; continue; }
    const ww = wordW(d, w, size);
    if (!line.length) { line = [w]; lw = ww; continue; }
    if (lw + sp + ww <= maxW) { line.push(w); lw += sp + ww; } else { lines.push({ words: line, w: lw }); line = [w]; lw = ww; }
  }
  if (line.length) lines.push({ words: line, w: lw });
  return lines.length ? lines : [{ words: [], w: 0 }];
}
function drawLine(d, ln, x, y, size, color, base, page, align, maxW) {
  const sp = d.width(' ', base, size); let cx = x;
  if (align === 'right' && maxW) cx = x + maxW - ln.w;
  ln.words.forEach((w, wi) => {
    if (wi) cx += sp;
    for (const s of w) {
      const sw = segW(d, s, size);
      if (s.box) d.box(cx + 0.5, y, size * 0.95, s.on, page);
      else if (s.blank) d.line(cx, y - 1.2, cx + sw - 2, y - 1.2, C.blank, 0.5, page);
      else d.text(s.t, cx, y, s.f, size, color, page);
      cx += sw;
    }
  });
}

/* ============================== dokumentum-elrendezés ============================== */
const NUM_RE = /^((?:\d+\.)+\d*|\d+\)|[a-z]\)|\([a-z0-9]+\))\s+/i;
const isBlank = (v) => !String(v || '').replace(/[\s…._—-]/g, '');
const normName = (v) => String(v || '').replace(/\*\*/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
/** JPEG méretei (SOF marker) */
export function jpegInfo(u) {
  if (!u || u[0] !== 0xff || u[1] !== 0xd8) return null;
  let i = 2;
  while (i < u.length - 9) {
    if (u[i] !== 0xff) { i++; continue; }
    const mk = u[i + 1]; const len = (u[i + 2] << 8) + u[i + 3];
    if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) return { h: (u[i + 5] << 8) + u[i + 6], w: (u[i + 7] << 8) + u[i + 8], comps: u[i + 9] };
    i += 2 + len;
  }
  return null;
}

class Layout {
  constructor(meta) {
    this.d = new Doc(); this.meta = meta; this.top = PH - 52; this.bottom = 40; this.y = this.top; this.x0 = ML; this.x1 = PW - MR; this.frames = [];
  }
  get w() { return this.x1 - this.x0; }
  newPage() {
    // nyitott keretek lezárása az oldal alján, folytatás az új oldalon
    for (const fr of this.frames) this.closeFrame(fr, this.bottom - 4, true);
    this.d.newPage(); this.y = this.top;
    for (const fr of this.frames) { fr.page = this.d.cur; fr.y0 = this.y + 4; fr.idx = this.d.cur.length; }
    this.y -= this.frames.length ? 10 : 0;
  }
  ensure(h) { if (this.y - h < this.bottom) this.newPage(); }
  /** Bekezdés (gazdag szöveg) egy hasábban; visszatér a sorok listájával mérésre is használható. */
  measure(text, o) {
    const size = o.size || 8.6; const base = o.f || 'L'; let t = String(text || ''); let num = '';
    if (o.num !== false) { const m = t.match(NUM_RE); if (m) { num = m[1]; t = t.slice(m[0].length); } }
    let bullet = false; if (/^- /.test(t) && o.bullets !== false) { bullet = true; t = t.slice(2); }
    const ind = num ? Math.max(this.d.width(num, base, size) + 5, 13) : bullet ? 10 : 0;
    const lines = wrapWords(this.d, tokenize(t, base, o.bf || 'S'), size, o.w - ind, base);
    return { lines, num, bullet, ind, size, base, lh: size * (o.lh || 1.48) };
  }
  drawMeasured(m, x, y, color, page, o) {
    o = o || {};
    m.lines.forEach((ln, i) => {
      const yy = y - m.lh * (i + 1) + m.lh * 0.22;
      if (i === 0 && m.num) this.d.text(m.num, x, yy, m.base, m.size, color, page);
      if (i === 0 && m.bullet) this.d.text('•', x + 1, yy, m.base, m.size, color, page);
      drawLine(this.d, ln, x + m.ind, yy, m.size, color, m.base, page, o.align, o.maxW);
    });
    return m.lines.length * m.lh;
  }
  /** Szöveg folyamatosan, oldaltöréssel (egy hasáb, teljes szélesség). */
  para(text, o) {
    o = o || {}; const m = this.measure(text, { ...o, w: o.w || this.w });
    for (let i = 0; i < m.lines.length; i++) {
      this.ensure(m.lh);
      const one = { ...m, lines: [m.lines[i]], num: i === 0 ? m.num : '', bullet: i === 0 && m.bullet };
      this.drawMeasured(one, (o.x || this.x0), this.y, o.color || C.txt);
      this.y -= m.lh;
    }
    this.y -= o.after == null ? 3 : o.after;
  }
  /** Két hasáb, soronként együtt törve; középen elválasztó vonal. */
  pair(a, b, o) {
    o = o || {}; const gap = 26; const cw = (this.w - gap) / 2; const xb = this.x0 + cw + gap;
    const A = this.measure(a, { ...o, w: cw }); const B = this.measure(b, { ...o, w: cw });
    const n = Math.max(A.lines.length, B.lines.length); const lh = Math.max(A.lh, B.lh);
    for (let i = 0; i < n; i++) {
      this.ensure(lh);
      if (A.lines[i]) this.drawMeasured({ ...A, lines: [A.lines[i]], num: i === 0 ? A.num : '', bullet: i === 0 && A.bullet }, this.x0, this.y, o.color || C.txt);
      if (B.lines[i]) this.drawMeasured({ ...B, lines: [B.lines[i]], num: i === 0 ? B.num : '', bullet: i === 0 && B.bullet }, xb, this.y, o.colorB || o.color || C.txt);
      if (o.divider !== false) this.d.line(this.x0 + cw + gap / 2, this.y + 2, this.x0 + cw + gap / 2, this.y - lh - (i === n - 1 ? (o.after == null ? 5 : o.after) - 1 : 0), C.line, 0.6);
      this.y -= lh;
    }
    this.y -= o.after == null ? 5 : o.after;
  }
  heading(a, b, level) {
    const size = level === 2 ? 10.4 : 8.6; const f = level === 2 ? 'S' : 'S';
    this.ensure(level === 2 ? 84 : 52);
    this.y -= level === 2 ? (this.y > this.top - 20 ? 2 : 14) : 6;
    const gap = 26; const cw = (this.w - gap) / 2;
    const A = this.measure(a, { w: b != null ? cw : this.w, size, f, num: false, bullets: false });
    const B = b != null ? this.measure(b, { w: cw, size, f, num: false, bullets: false }) : null;
    const h = Math.max(A.lines.length * A.lh, B ? B.lines.length * B.lh : 0);
    this.drawMeasured(A, this.x0, this.y, C.ink);
    if (B) this.drawMeasured(B, this.x0 + cw + gap, this.y, level === 2 ? '0.3 0.32 0.37' : C.mut);
    this.y -= h + 3;
    this.d.line(this.x0, this.y, this.x1, this.y, level === 2 ? '0.8 0.82 0.86' : C.line, level === 2 ? 0.8 : 0.6);
    this.y -= level === 2 ? 9 : 5;
  }
  /** Táblázatsor: [[címke, érték], [címke, érték]] vagy [[címke, érték]] */
  row(cells, o) {
    o = o || {}; const gap = 26; const two = cells.length > 1; const cw = two ? (this.w - gap) / 2 : this.w;
    const lw = cw * (o.amount ? 0.6 : two ? 0.44 : 0.32); const vw = cw - lw - 8;
    const ms = cells.map(([l, v]) => ({
      L: this.measure(l, { w: lw - 6, size: o.amount ? 8.8 : 7.9, f: o.strong ? 'S' : 'L', bf: 'S', num: false, bullets: false, lh: 1.45 }),
      V: this.measure(isBlank(v) ? '' : v, { w: vw, size: o.amount ? 9.2 : 8.4, f: o.strong ? 'S' : 'R', bf: 'S', num: false, bullets: false, lh: 1.45 }),
      blank: isBlank(v), raw: v
    }));
    const h = Math.max(...ms.map((m) => Math.max(m.L.lines.length * m.L.lh, m.blank ? 12 : m.V.lines.length * m.V.lh))) + (o.amount ? 12 : 8);
    this.ensure(h);
    const yTop = this.y;
    ms.forEach((m, i) => {
      const x = this.x0 + i * (cw + gap);
      if (!String(cells[i][0] || '').trim() && (!String(cells[i][1] || '').trim() || /^[–—-]$/.test(String(cells[i][1]).trim()))) return; // üres cella
      if (o.strong) this.d.stroke(x - 3, yTop - h, cw + 6, h, '0.2 0.22 0.27', 0.9);
      this.drawMeasured(m.L, x + 6, yTop - 4, o.amount ? C.ink : C.lab);
      if (m.blank) {
        const by = yTop - 4 - m.L.lh * 0.8; const bx0 = o.amount ? x + cw - 90 : x + lw; const bx1 = o.amount ? x + cw - 14 : x + cw - 4;
        this.d.line(bx0, by, bx1, by, C.blank, 0.5);
        const cur = String(m.raw || '').replace(/[\s…._]/g, '');
        if (o.amount && cur) this.d.text(cur, x + cw - 4 - this.d.width(cur, o.strong ? 'B' : 'R', 9.2), by + 1.5, o.strong ? 'B' : 'R', 9.2, C.ink);
      } else this.drawMeasured(m.V, x + lw, yTop - 4, C.ink, null, o.amount ? { align: 'right', maxW: vw - 2 } : null);
      if (!o.strong) this.d.line(x, yTop - h, x + cw, yTop - h, C.soft, 0.7);
    });
    if (two && !o.strong) this.d.line(this.x0 + cw + gap / 2, yTop, this.x0 + cw + gap / 2, yTop - h, C.line, 0.6);
    this.y -= h + (o.strong ? 6 : 0);
  }
  note(a, b) {
    const pad = 9; const gap = 26; const two = b != null; const cw = two ? (this.w - 2 * pad - gap) / 2 : this.w - 2 * pad;
    const A = this.measure(a, { w: cw, size: 7.5, f: 'L', bf: 'S', num: false, lh: 1.5 }); const B = two ? this.measure(b, { w: cw, size: 7.5, f: 'L', bf: 'S', num: false, lh: 1.5 }) : null;
    const h = Math.max(A.lines.length * A.lh, B ? B.lines.length * B.lh : 0) + 2 * pad;
    this.ensure(h + 6);
    this.d.fill(this.x0, this.y - h, this.w, h, C.note); this.d.fill(this.x0, this.y - h, 2.2, h, C.red);
    this.drawMeasured(A, this.x0 + pad + 4, this.y - pad + 2, C.txt);
    if (B) this.drawMeasured(B, this.x0 + pad + 4 + cw + gap, this.y - pad + 2, C.txt);
    this.y -= h + 10;
  }
  tag(text) {
    const s = 6.6; const t = String(text).toUpperCase(); const w = this.d.width(t, 'B', s) + 18 + t.length * 0.5;
    this.ensure(26); this.y -= 2;
    this.d.fill(this.x0, this.y - 15, w, 15, C.red);
    // ritkított betűköz: karakterenként
    let cx = this.x0 + 9; for (const ch of t) { this.d.text(ch, cx, this.y - 10.2, 'B', s, '1 1 1'); cx += this.d.width(ch, 'B', s) + 0.5; }
    this.y -= 26;
  }
  title(a, b) {
    this.ensure(70);
    const A = this.measure(a, { w: this.w, size: 19, f: 'B', bf: 'B', num: false, bullets: false, lh: 1.25 });
    this.drawMeasured(A, this.x0, this.y, C.ink); this.y -= A.lines.length * A.lh + 2;
    if (b) { const B = this.measure(b, { w: this.w, size: 12.2, f: 'L', bf: 'R', num: false, bullets: false, lh: 1.35 }); this.drawMeasured(B, this.x0, this.y, C.mut); this.y -= B.lines.length * B.lh; }
    this.y -= 14;
  }
  openFrame(gray) { this.ensure(70); this.y -= 2; const fr = { page: this.d.cur, y0: this.y, idx: this.d.cur.length, gray, x0: this.x0, x1: this.x1 }; this.frames.push(fr); this.x0 += 10; this.x1 -= 10; this.y -= 10; }
  closeFrame(fr, yEnd, cont) {
    const h = fr.y0 - yEnd; if (h <= 0) return;
    if (fr.gray) fr.page.splice(fr.idx, 0, `${C.note} rg ${n2(fr.x0)} ${n2(yEnd)} ${n2(fr.x1 - fr.x0)} ${n2(h)} re f`);
    this.d.stroke(fr.x0, yEnd, fr.x1 - fr.x0, h, '0.8 0.82 0.86', 0.7, fr.page);
  }
  endFrame() { const fr = this.frames.pop(); if (!fr) return; this.x0 = fr.x0; this.x1 = fr.x1; this.y -= 4; this.closeFrame(fr, this.y, false); this.y -= 10; }
  signatures(parts, withDate, caption) {
    const n = Math.max(1, parts.length); const gap = 22; const cw = (this.w - gap * (n - 1)) / n;
    const P = parts.map((p) => {
      const [main, name] = p.split('~~').map((s) => s.trim()); const [t, sub] = main.split(/\s+~\s+|~/).map((s) => (s || '').trim());
      return { T: this.measure(t || '', { w: cw, size: 8.4, f: 'S', num: false, bullets: false, lh: 1.4 }), S: sub ? this.measure(sub, { w: cw, size: 7.4, f: 'L', num: false, bullets: false, lh: 1.4 }) : null,
        N: name && !isBlank(name) ? this.measure(name, { w: cw - 6, size: 7.6, f: 'R', num: false, bullets: false, lh: 1.35 }) : null, nameRaw: name || '', tRaw: t || '' };
    });
    const headH = Math.max(...P.map((q) => q.T.lines.length * q.T.lh + (q.S ? q.S.lines.length * q.S.lh : 0)));
    const nameH = Math.max(0, ...P.map((q) => (q.N ? q.N.lines.length * q.N.lh : 0)));
    const H = 8 + headH + (withDate ? 32 : 0) + 34 + nameH + 18; this.ensure(H); this.y -= 8;
    const y0 = this.y; const lineY = y0 - headH - (withDate ? 32 : 0) - 34;
    P.forEach((q, i) => {
      const x = this.x0 + i * (cw + gap); let y = y0;
      this.drawMeasured(q.T, x, y, C.ink); y -= q.T.lines.length * q.T.lh;
      if (q.S) this.drawMeasured(q.S, x, y, C.mut);
      if (withDate) {
        let yy = y0 - headH;
        for (const lb of this.meta.bilingual ? ['Datum / Dátum', 'Ort / Helység'] : ['Dátum', 'Helység']) {
          yy -= 16; this.d.text(lb, x, yy, 'L', 7.4, C.mut); const lx = x + this.d.width(lb, 'L', 7.4) + 4; this.d.line(lx, yy - 1, Math.min(x + cw - 6, lx + 92), yy - 1, C.blank, 0.5);
        }
      }
      if (this.meta.sig && q.nameRaw && normName(q.nameRaw) === normName(this.meta.sig.name)) {
        const im = this.meta.sig.img; const ih = 34; const iw = Math.min(cw - 10, ih * im.w / im.h);
        this.d.image(x + 2, lineY + 1.5, iw, iw * im.h / im.w, null, im);
        this.d.text('elektronikusan aláírva · ' + this.meta.sig.when, x + cw - 6 - this.d.width('elektronikusan aláírva · ' + this.meta.sig.when, 'L', 5.6), lineY + 2.5, 'L', 5.6, C.red);
      } else if (this.meta.specimens && this.meta.specimens.length) {
        // tárolt aláírásminta (személyek / céges aláírók): a hasáb neve (~~) vagy címe alapján
        const keys = [q.nameRaw, q.tRaw].filter(Boolean).map(normName);
        const sp = this.meta.specimens.find((z) => z.keys.some((k) => k && keys.includes(k)));
        if (sp) { const im = sp.img; let ih = 32; let iw = ih * im.w / im.h; if (iw > cw - 12) { iw = cw - 12; ih = iw * im.h / im.w; } this.d.image(x + 4, lineY + 1, iw, ih, null, im); }
      }
      this.d.line(x, lineY, x + cw - 6, lineY, '0.35 0.37 0.42', 0.6);
      let yb = lineY - 2; if (q.N) { this.drawMeasured(q.N, x, yb, C.ink); yb -= q.N.lines.length * q.N.lh; }
      this.d.text(caption, x, yb - 8, 'L', 6.8, C.mut);
    });
    this.y = lineY - nameH - 22;
  }
}

/** Az elektronikus aláírás tanúsítvány-oldala (audit-napló) a dokumentum végén. */
function certificatePage(L, sg, img) {
  const d = L.d; L.newPage();
  L.tag('Elektronikus aláírás · Signaturprotokoll');
  L.title('Aláírási tanúsítvány', 'Az elektronikus aláírás adatai és ellenőrző kódjai');
  L.note('Ez a lap a dokumentum elválaszthatatlan része. A dokumentum tartalmának SHA-256 ellenőrzőkódja az aláíráskor rögzítésre került; bármilyen utólagos módosítás megváltoztatja a kódot. Egyszerű elektronikus aláírás (eIDAS-rendelet 3. cikk 10. pont), az aláíró azonosítása az e-mail címére küldött egyszeri kóddal (OTP) történt.');
  for (const [k, v] of sg.rows || []) L.row([[k, String(v == null ? '' : v)]]);
  if (img) {
    L.ensure(120); L.y -= 14; d.text('Az aláíró saját kezű (digitálisan rajzolt) aláírása:', L.x0, L.y, 'R', 8, C.mut); L.y -= 8;
    const h = 80; const w = Math.min(260, h * img.w / img.h);
    d.stroke(L.x0, L.y - h - 8, w + 16, h + 8, C.line, 0.6); d.image(L.x0 + 8, L.y - h - 4, w, w * img.h / img.w > h ? h : w * img.h / img.w, null, img); L.y -= h + 20;
  }
  if (sg.statement) { L.y -= 6; L.para('Az aláíró nyilatkozata: „' + sg.statement + '”', { size: 7.6, color: C.mut }); }
}

/** A futó fejléc / címlap-fej / lábléc kirajzolása (minden oldalon, az oldalszám ismeretében). */
function decorate(L, meta) {
  const d = L.d;
  return (pg, i, total) => {
    // futó fejléc
    const [hl, hr] = meta.header;
    if (hl || hr) {
      let x = ML; const parts = String(hl || '').split(/\s+\/\s+/);
      parts.forEach((p, k) => { if (k) { d.text('/', x + 3, PH - 24, 'L', 6.8, C.lab, pg); x += 12; } d.text(p, x, PH - 24, 'L', 6.8, C.mut, pg); x += d.width(p, 'L', 6.8); });
      if (hr) d.text(hr, PW - MR - d.width(hr, 'L', 6.8), PH - 24, 'L', 6.8, C.mut, pg);
      d.line(ML, PH - 31, PW - MR, PH - 31, C.line, 0.7, pg);
    }
    // lábléc
    const pgTxt = (meta.bilingual ? 'Seite / Oldal ' : 'Oldal ') + (i + 1) + ' / ' + total;
    if (meta.footer) {
      const ft = meta.footer; const top = 76;
      d.line(ML, top, PW - MR, top, '0.8 0.82 0.86', 0.8, pg);
      d.text(ft.title, ML, top - 12, 'S', 6.8, C.ink, pg);
      const cw = (PW - ML - MR) / Math.max(1, ft.cols.length);
      ft.cols.forEach((col, k) => {
        let y = top - 25; const x = ML + k * cw;
        const fit = (t, w) => { let s = t; while (s.length > 3 && d.width(s, 'L', 5.8) > w) s = s.slice(0, -1); return s === t ? t : s.slice(0, -1) + '…'; };
        for (const ln of col) {
          const m = ln.match(/^(.*?)::\s*(.*)$/);
          if (m) { const lb = m[1].trim(); const lw = d.width(lb, 'L', 5.8) + 3; d.text(lb, x, y, 'L', 5.8, C.lab, pg); d.text(fit(m[2], cw - lw - 8), x + lw, y, 'L', 5.8, C.txt, pg); }
          else if (ln.startsWith('~')) d.text(fit(ln.slice(1).trim(), cw - 8), x, y, 'L', 5.8, C.lab, pg);
          else d.text(fit(ln, cw - 8), x, y, 'L', 5.8, C.txt, pg);
          y -= 7.4;
        }
      });
    } else d.line(ML, 34, PW - MR, 34, C.line, 0.6, pg);
    d.text(pgTxt, PW - MR - d.width(pgTxt, 'L', 6.4), 16, 'L', 6.4, C.lab, pg);
    const idt = [meta.number, meta.hash ? 'SHA-256: ' + meta.hash.slice(0, 16) + '…' : ''].filter(Boolean).join(' · ');
    if (idt) d.text(idt, ML, 16, 'L', 5.8, C.lab, pg);
  };
}

/**
 * A kitöltött sablonszöveg → PDF (Uint8Array).
 * meta: { title, number, hash, sub (dokumentumtípus a fejlécben) }
 */
export function renderDocPdf(filled, meta) {
  meta = meta || {};
  const raw = String(filled || '').replace(/\r/g, '').split('\n');
  // 1. direktívák
  const M = { header: null, footer: null, fields: [], company: '', tag: '', logo: true, caption: '' };
  const body = [];
  for (const ln of raw) {
    const m = ln.match(/^@([a-zá-űA-ZÁ-Ű_-]+)\s*:\s*(.*)$/);
    if (!m) { body.push(ln); continue; }
    const k = m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); const v = m[2].trim();
    if (k === 'fejlec') M.header = v.split('|').map((s) => s.trim());
    else if (k === 'lablec') { const [t, ...cols] = v.split(';;').map((s) => s.trim()); M.footer = { title: t, cols: cols.map((c) => c.split(/\s+\/\/\s+/).map((s) => s.trim()).filter(Boolean)) }; }
    else if (k === 'mezo') { const [l, val] = v.split('|'); M.fields.push([(l || '').trim(), (val || '').trim()]); }
    else if (k === 'cegsor') M.company = v;
    else if (k === 'cimke') M.tag = v;
    else if (k === 'logo') M.logo = !/^(nem|no|off|0)$/i.test(v);
    else if (k === 'alairas-felirat') M.caption = v;
    else if (k === 'nyelv') M.lang = v.toLowerCase();
  }
  const bilingual = M.lang ? /de|en/.test(M.lang) : body.some((l) => (/^## /.test(l) || !/^\s*(#|\[)/.test(l)) && l.indexOf('||') >= 0);
  const h1 = body.find((l) => /^# /.test(l)); const [t1, t2] = h1 ? h1.slice(2).split('||').map((s) => s.trim()) : [meta.title || '', ''];
  const plainT = (s) => String(s || '').replace(/\*\*/g, '');
  const meta2 = {
    header: M.header || [plainT([t1, t2].filter(Boolean).join(' / ')), meta.sub || ''],
    footer: M.footer, bilingual, number: meta.number || '', hash: meta.hash || ''
  };
  let sigImg = null;
  if (meta.sign && meta.sign.jpeg) { const inf = jpegInfo(meta.sign.jpeg); if (inf) sigImg = { bytes: meta.sign.jpeg, ...inf }; }
  if (sigImg) meta2.sig = { img: sigImg, name: meta.sign.match || '', when: meta.sign.when || '' };
  // tárolt aláírásminták: [{ names: [...], jpeg: Uint8Array }]
  meta2.specimens = (meta.specimens || []).map((z) => { const inf = z.jpeg && jpegInfo(z.jpeg); return inf ? { img: { bytes: z.jpeg, ...inf }, keys: (z.names || []).map(normName).filter(Boolean) } : null; }).filter(Boolean);
  const L = new Layout(meta2);
  L.bottom = M.footer ? 92 : 46;
  const caption = M.caption || (bilingual ? 'Unterschrift / Aláírás' : 'aláírás');
  // 2. címlap-fej: bal oldalt a mezők (Ügyszám, Szerződésszám, Dátum), jobb oldalt a logó
  const d = L.d; let y = L.top - 8;
  if (M.logo || M.fields.length) {
    const lh = 42; const lw = lh * LOGO_W / LOGO_H;
    if (M.logo) d.image(PW - MR - lw, y - lh - 4, lw, lh);
    let fy = y - 12; const labX = ML + 150;
    for (const [l, v] of M.fields) {
      const [a, b] = l.split(/\s+\/\s+/);
      const wa = d.width(a, 'L', 8.4); const wb = b ? d.width(' / ' + b, 'L', 8.4) : 0;
      d.text(a, labX - wa - wb, fy, 'L', 8.4, C.ink); if (b) d.text(' / ' + b, labX - wb, fy, 'L', 8.4, C.mut);
      if (isBlank(v)) d.line(labX + 14, fy - 1, labX + 84, fy - 1, C.ink, 0.5); else d.text(v.replace(/^[…\s]+$/, ''), labX + 14, fy, 'R', 8.4, C.ink);
      fy -= 13.5;
    }
    L.y = Math.min(y - lh - 18, fy - 8);
  }
  if (M.company) { L.y -= 4; d.text(M.company, ML, L.y, 'L', 6.8, C.mut); L.y -= 8; d.line(ML, L.y, PW - MR, L.y, '0.8 0.82 0.86', 0.8); L.y -= 20; }
  else if (M.logo || M.fields.length) L.y -= 6;
  if (M.tag) L.tag(M.tag);
  // 3. törzs
  let gapPending = false;
  for (const rawLn of body) {
    const ln = rawLn.replace(/\t/g, '    ').replace(/\s+$/, '');
    const t = ln.trim();
    if (!t) { if (!gapPending) { L.y -= 5; gapPending = true; } continue; }
    gapPending = false;
    if (/^\[oldaltörés\]$/i.test(t)) { L.newPage(); continue; }
    if (/^-{3,}$/.test(t)) { L.ensure(10); L.y -= 4; d.line(L.x0, L.y, L.x1, L.y, C.line, 0.7); L.y -= 8; continue; }
    if (/^\[keret( szürke)?\]$/i.test(t)) { L.openFrame(/szürke/i.test(t)); continue; }
    if (/^\[\/keret\]$/i.test(t)) { L.endFrame(); continue; }
    let m = t.match(/^\[címke\]\s*(.*)$/i); if (m) { L.tag(m[1]); continue; }
    m = t.match(/^\[aláírás(\+?)\]\s*(.*)$/i); if (m) { L.signatures(m[2].split('|').map((s) => s.trim()).filter((s, i) => s || i === 0), !!m[1], caption); continue; }
    m = t.match(/^\[megjegyzés\]\s*(.*)$/i); if (m) { const [a, b] = m[1].split('||'); L.note(a.trim(), b != null ? b.trim() : null); continue; }
    m = t.match(/^\[(sor|összeg!?)\]\s*(.*)$/i);
    if (m) {
      const cells = m[2].split('||').map((c) => { const i = c.indexOf('|'); return i < 0 ? [c.trim(), ''] : [c.slice(0, i).trim(), c.slice(i + 1).trim()]; });
      L.row(cells, { amount: /összeg/i.test(m[1]), strong: /!/.test(m[1]) }); continue;
    }
    if (/^# /.test(t)) { const [a, b] = t.slice(2).split('||').map((s) => s.trim()); L.title(a, b); continue; }
    m = t.match(/^(#{2,3}) (.*)$/); if (m) { const [a, b] = m[2].split('||').map((s) => s.trim()); L.heading(a, b, m[1].length); continue; }
    if (/^(Kelt|Datum|Dátum|Kelt \/ Datum|Ort)\b/.test(t)) L.ensure(175); // a keltezés maradjon együtt az aláírásokkal
    if (t.indexOf('||') >= 0) { const i = t.indexOf('||'); L.pair(t.slice(0, i).trim(), t.slice(i + 2).trim()); continue; }
    L.para(t, { after: 3 });
  }
  while (L.frames.length) L.endFrame();
  if (meta.sign) certificatePage(L, meta.sign, sigImg);
  return d.build({ title: meta.title || plainT(t1), author: 'CarAdvance' }, decorate(L, meta2));
}
