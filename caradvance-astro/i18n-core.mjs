/**
 * i18n-core.mjs — a teljes oldal-fordítás közös motorja (kivonatolás + alkalmazás).
 * Egység = olyan elem, amelynek tartalma csak szöveg + inline elem (a, strong, span, br…).
 * Kulcs: a tartalom, ahol az inline elemek <gN>…</gN> / <xN/> jelölők, a számok {N} helyőrzők.
 */
import { parse, serialize } from 'parse5';

export const INLINE = new Set(['a','abbr','b','bdi','bdo','br','cite','code','data','dfn','em','i','img','kbd','mark','q','s','samp','small','span','strong','sub','sup','time','u','var','wbr','del','ins','font','label']);
const VOID = new Set(['br','img','wbr','input']);
const SKIP = new Set(['script','style','noscript','template','svg','math','textarea','select','code','pre','iframe','video','audio','canvas','object']);
const ATTRS = ['alt','title','placeholder','aria-label'];
const LETTER = /[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]/;
const NUM = /\d+(?:[.,   ]\d+)*/g;

const attr = (n, k) => (n.attrs || []).find((a) => a.name === k);
const isEl = (n) => n && n.tagName;
const skipEl = (n) => SKIP.has(n.tagName) || (attr(n,'translate') && attr(n,'translate').value === 'no') || /(^|\s)notranslate(\s|$)/.test((attr(n,'class')||{}).value || '');

function inlineOnly(n) {
  for (const c of n.childNodes || []) {
    if (c.nodeName === '#text' || c.nodeName === '#comment') continue;
    if (!isEl(c) || !INLINE.has(c.tagName) || skipEl(c)) return false;
    if (!inlineOnly(c)) return false;
  }
  return true;
}
function textOf(n) { let s = ''; for (const c of n.childNodes || []) s += c.nodeName === '#text' ? c.value : (isEl(c) ? textOf(c) : ''); return s; }

export function maskNums(s) { const nums = []; const k = s.split(/(<\/?[gx]\d+\/?>)/).map((part, i) => (i % 2 ? part : part.replace(NUM, (m) => { nums.push(m); return '{' + nums.length + '}'; }))).join(''); return { k, nums }; }
export function unmaskNums(s, nums) { return s.replace(/\{(\d+)\}/g, (m, i) => (nums[+i - 1] !== undefined ? nums[+i - 1] : m)); }
const norm = (s) => s.replace(/\s+/g, ' ');

/** inline tartalom → kulcs + visszaállítási adat */
function unitKey(children) {
  const tags = []; let out = '';
  const walk = (nodes) => {
    for (const c of nodes) {
      if (c.nodeName === '#text') out += c.value.replace(/[<>]/g, (x) => (x === '<' ? '‹' : '›'));
      else if (isEl(c)) {
        const i = tags.length; tags.push(c);
        if (VOID.has(c.tagName)) out += `<x${i}/>`;
        else { out += `<g${i}>`; walk(c.childNodes || []); out += `</g${i}>`; }
      }
    }
  };
  walk(children);
  const lead = out.match(/^\s*/)[0], trail = out.match(/\s*$/)[0];
  const core = norm(out.trim());
  const { k, nums } = maskNums(core);
  return { key: k, nums, tags, lead, trail };
}

/** fordítás → node-ok (az eredeti inline elemek attribútumaival) */
function buildNodes(tr, tags, parentNode) {
  const res = []; const stack = [{ kids: res }]; const re = /<(\/?)([gx])(\d+)(\/?)>|([^<]+)/g; let m;
  const txt = (v) => ({ nodeName: '#text', value: v.replace(/‹/g, '<').replace(/›/g, '>'), parentNode });
  while ((m = re.exec(tr))) {
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) { top.kids.push(txt(m[5])); continue; }
    const orig = tags[+m[3]]; if (!orig) continue;
    if (m[2] === 'x') { top.kids.push({ ...orig, childNodes: [] }); continue; }
    if (m[1] === '/') { if (stack.length > 1) stack.pop(); continue; }
    const el = { ...orig, childNodes: [] }; top.kids.push(el); stack.push({ kids: el.childNodes, el });
  }
  const fix = (nodes, p) => { for (const n of nodes) { n.parentNode = p; if (n.childNodes) fix(n.childNodes, n); } };
  fix(res, parentNode);
  return res;
}

/** végigjárja a dokumentumot; fn(kind, key, apply) — apply(fordítás) beírja */
export function visit(doc, fn) {
  const rec = (n) => {
    if (!isEl(n) && n.nodeName !== '#document' && n.nodeName !== '#document-fragment') return;
    if (isEl(n)) {
      if (n.tagName === 'title') { const t = norm(textOf(n).trim()); if (LETTER.test(t)) { const { k, nums } = maskNums(t); fn('text', k, (tr) => { n.childNodes = [{ nodeName: '#text', value: unmaskNums(tr, nums), parentNode: n }]; }); } return; }
      if (n.tagName === 'meta') {
        const nm = (attr(n,'name')||attr(n,'property')||{}).value || '';
        if (/^(description|og:title|og:description|twitter:title|twitter:description)$/.test(nm)) { const c = attr(n,'content'); if (c && LETTER.test(c.value)) { const { k, nums } = maskNums(norm(c.value.trim())); fn('text', k, (tr) => { c.value = unmaskNums(tr, nums); }); } }
        return;
      }
      if (n.tagName === 'script') {
        const ty = (attr(n,'type')||{}).value || '';
        if (/ld\+json/.test(ty) && n.childNodes[0]) {
          let data; try { data = JSON.parse(n.childNodes[0].value); } catch { return; }
          const jr = (o) => { if (Array.isArray(o)) return o.forEach(jr); if (o && typeof o === 'object') for (const kk of Object.keys(o)) { const v = o[kk]; if (typeof v === 'string' && /^(name|description|text|headline|alternateName|serviceType|articleSection|caption|slogan|disambiguatingDescription)$/.test(kk) && LETTER.test(v) && !/^https?:/.test(v)) { const { k, nums } = maskNums(norm(v.trim())); fn('text', k, (tr) => { o[kk] = unmaskNums(tr, nums); }); } else jr(v); } };
          jr(data); n.__ld = data;
        }
        return;
      }
      if (skipEl(n)) return;
      for (const a of ATTRS) { const at = attr(n, a); if (at && LETTER.test(at.value)) { const { k, nums } = maskNums(norm(at.value.trim())); fn('text', k, (tr) => { at.value = unmaskNums(tr, nums); }); } }
      if (n.tagName === 'input') { const ty = (attr(n,'type')||{}).value; const v = attr(n,'value'); if (v && /^(submit|button)$/.test(ty) && LETTER.test(v.value)) { const { k, nums } = maskNums(norm(v.value.trim())); fn('text', k, (tr) => { v.value = unmaskNums(tr, nums); }); } }
      if (n.tagName !== 'html' && n.tagName !== 'body' && n.tagName !== 'head' && inlineOnly(n) && LETTER.test(textOf(n))) {
        const u = unitKey(n.childNodes || []);
        // attribútumok a belső inline elemeken (pl. img alt) is
        const inner = (nodes) => { for (const c of nodes) if (isEl(c)) { for (const a of ATTRS) { const at = attr(c, a); if (at && LETTER.test(at.value)) { const { k, nums } = maskNums(norm(at.value.trim())); fn('text', k, (tr) => { at.value = unmaskNums(tr, nums); }); } } inner(c.childNodes || []); } };
        inner(n.childNodes || []);
        fn('unit', u.key, (tr) => { const nodes = buildNodes(unmaskNums(tr, u.nums), u.tags, n); if (u.lead) nodes.unshift({ nodeName: '#text', value: u.lead, parentNode: n }); if (u.trail) nodes.push({ nodeName: '#text', value: u.trail, parentNode: n }); n.childNodes = nodes; });
        return;
      }
    }
    for (const c of [...(n.childNodes || [])]) {
      if (c.nodeName === '#text') {
        if (LETTER.test(c.value) && isEl(n) && !skipEl(n)) { const lead = c.value.match(/^\s*/)[0], trail = c.value.match(/\s*$/)[0]; const { k, nums } = maskNums(norm(c.value.trim())); fn('unit', k, (tr) => { c.value = lead + unmaskNums(tr, nums).replace(/<[^>]+>/g, '') + trail; }); }
      } else rec(c);
    }
    if (n.content) rec(n.content);
  };
  rec(doc);
}
export function finishLd(doc) {
  const rec = (n) => { if (n.__ld) { n.childNodes[0].value = JSON.stringify(n.__ld); delete n.__ld; } for (const c of n.childNodes || []) rec(c); };
  rec(doc);
}
export { parse, serialize };
