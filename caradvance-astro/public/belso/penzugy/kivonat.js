/* CarAdvance — banki kivonat-export (XLS/XLSX/CSV) feldolgozása a böngészőben (SheetJS).
 * Raiffeisen-formátum: munkalap neve = számlaszám, blokkok: „Könyvelésre váró tételek” (zárolások — kihagyjuk)
 * és „Könyvelt tételek” (ezeket importáljuk); fejléc: Típus | Könyvelés dátuma | Értéknap | Azonosító | Összeg | (Adatok) | Közlemény/1..5
 * A deviza a sorokból derül ki (pl. kártyás „7,40 EUR Vásárlás” = az Összeg oszlop → EUR számla). */
(function (root) {
  'use strict';
  function num(s) {
    s = String(s == null ? '' : s).replace(/\s| /g, '');
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
    return Number(s);
  }
  function isTitle(r) {
    var ne = r.filter(function (c) { return String(c).trim() !== ''; });
    return ne.length === 1 && typeof r[0] === 'string' && r[0].trim() && !/^\d/.test(r[0]);
  }
  function guessCurrency(rows, sheetName) {
    var votes = {};
    rows.forEach(function (o) {
      var amt = Math.abs(num(o['Összeg'])); if (!amt) return;
      Object.keys(o).forEach(function (k) {
        if (!/^Közlemény|^Adatok/.test(k)) return;
        var v = String(o[k] || ''), m;
        if ((m = /^([\d.]+,\d{2})\s+([A-Z]{3})\b/.exec(v)) || (m = /^([A-Z]{3})\s+([\d.]+,\d{2})$/.exec(v))) {
          var a = /^[A-Z]/.test(m[1]) ? num(m[2]) : num(m[1]), c = /^[A-Z]/.test(m[1]) ? m[1] : m[2];
          if (Math.abs(a - amt) < 0.006) votes[c] = (votes[c] || 0) + 1;
        }
      });
    });
    var best = 'HUF', n = 0;
    Object.keys(votes).forEach(function (c) { if (votes[c] > n) { best = c; n = votes[c]; } });
    if (!n && /^\d{8}-\d{8}(-\d{8})?$/.test(sheetName || '')) best = 'HUF';
    return best;
  }
  function parseSheet(XLSX, ws, name) {
    var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
    var out = [], pending = 0, title = '', head = null, take = false;
    for (var i = 0; i < aoa.length; i++) {
      var r = aoa[i];
      var empty = r.every(function (c) { return String(c).trim() === ''; });
      if (empty) { head = null; continue; }
      if (isTitle(r)) { title = String(r[0]).trim(); head = null; continue; }
      if (r.indexOf('Típus') !== -1 && r.indexOf('Összeg') !== -1) {
        head = r.map(function (c) { return String(c).trim(); });
        take = !title || /könyvelt tételek/i.test(title) && !/vár/i.test(title);
        continue;
      }
      if (!head) continue;
      var o = {};
      head.forEach(function (h, j) { if (h) o[h] = r[j]; });
      if (take) out.push(o); else pending++;
    }
    return { sheet: name, ext_id: name, rows: out, pending: pending, currency: guessCurrency(out, name) };
  }
  function parseWorkbook(XLSX, wb) {
    return wb.SheetNames.map(function (n) { return parseSheet(XLSX, wb.Sheets[n], n); }).filter(function (s) { return s.rows.length || s.pending; });
  }
  var api = { parseWorkbook: parseWorkbook, parseSheet: parseSheet, guessCurrency: guessCurrency };
  root.CAKivonat = api;
})(typeof window !== 'undefined' ? window : globalThis);
