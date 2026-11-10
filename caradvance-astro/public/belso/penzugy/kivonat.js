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
  /* ---------- CSV (RFC 4180) ---------- */
  function csvRows(text) {
    var out = [], row = [], f = '', q = false, i, c;
    text = String(text || '').replace(/^﻿/, '');
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
      if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0] !== '') out.push(row); row = []; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); out.push(row); }
    return out;
  }
  function csvObjects(text) {
    var r = csvRows(text); if (!r.length) return [];
    var h = r[0].map(function (x) { return x.trim(); });
    return r.slice(1).map(function (a) { var o = {}; h.forEach(function (k, j) { o[k] = a[j] == null ? '' : a[j]; }); return o; });
  }
  /* ---------- Revolut Business ---------- */
  function isRevolut(text) { var h = String(text || '').slice(0, 800); return /Date completed \(UTC\)/.test(h) && /Payment currency/.test(h) && /Total amount/.test(h); }
  function huNum(n) { var v = Number(n); if (!isFinite(v)) return ''; var s = Math.abs(v).toFixed(2).split('.'); return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1]; }
  /** Revolut Business „account statement” CSV → számlánként (EUR Main, HUF Main…) egy-egy lap a közös sorformátumban.
   *  Csak COMPLETED tételek; a díj (Total amount − Amount) külön „Díj, jutalék” sor ugyanazzal az azonosítóval,
   *  így az utalás üzletágát örökli. Pénzváltás a saját devizaszámlák között: „Pénzváltás” (belső mozgás). */
  function parseRevolut(text, fileName) {
    var by = {}, skipped = 0;
    csvObjects(text).forEach(function (r) {
      if (r['State'] && r['State'] !== 'COMPLETED') { skipped++; return; }
      var acc = r['Account'] || ('Main ' + r['Payment currency']), cur = r['Payment currency'] || 'EUR';
      var iban = (r['International account number'] || '').replace(/\s/g, '');
      var key = 'REVOLUT-' + (iban || 'X') + '-' + cur;
      var sh = by[key] = by[key] || { sheet: 'Revolut ' + acc, ext_id: key, name: 'Revolut ' + acc + (iban ? ' (' + iban.slice(-4) + ')' : ''), currency: cur, rows: [], pending: 0, file: fileName };
      var d = (r['Date completed (UTC)'] || r['Date started (UTC)'] || '').slice(0, 10);
      var T = r['Type'], desc = r['Description'] || '', ref = r['Reference'] || '';
      var amt = Number(r['Amount']), tot = Number(r['Total amount']);
      var o = { 'Könyvelés dátuma': d, 'Értéknap': (r['Date started (UTC)'] || d).slice(0, 10), 'Azonosító': r['ID'], 'Összeg': amt };
      var orig = r['Orig currency'] && r['Orig currency'] !== cur ? huNum(r['Orig amount']) + ' ' + r['Orig currency'] : '';
      if (T === 'CARD_PAYMENT' || T === 'CARD_REFUND' || T === 'CARD_CHARGEBACK') {
        o['Típus'] = T === 'CARD_PAYMENT' ? 'Kártyás vásárlás (Revolut)' : 'Kártyás visszatérítés (Revolut)';
        o['Közlemény/1'] = 'Kártya: ' + String(r['Card label'] || '').replace(/^.*\s[-–]\s/, '') + (r['Card number'] ? ' ' + r['Card number'].slice(-4) : ''); // „BH Group Zrt. - Némethy Zsófia” → csak a kártyabirtokos (különben az átvezetés-szabály elkapná)
        o['Közlemény/2'] = desc.replace(/^Refund from /i, '');
        o['Közlemény/3'] = orig;
        o['Közlemény/4'] = r['MCC'] ? 'MCC ' + r['MCC'] : '';
      } else if (T === 'TRANSFER') {
        o['Típus'] = amt < 0 ? 'Átutalás (Revolut)' : 'Jóváírás (Revolut)';
        o['Közlemény/1'] = (r['Beneficiary IBAN'] || r['Beneficiary account number'] || '').replace(/\s/g, '');
        o['Közlemény/2'] = r['Beneficiary name'] || desc.replace(/^(To|From) /i, '');
        o['Közlemény/3'] = ref; o['Közlemény/4'] = orig;
      } else if (T === 'TOPUP') {
        o['Típus'] = 'Jóváírás (Revolut)'; o['Közlemény/2'] = desc.replace(/^Money added from /i, ''); o['Közlemény/3'] = ref;
      } else if (T === 'FEE') {
        o['Típus'] = 'Díj, jutalék (Revolut)'; o['Közlemény/1'] = desc; o['Közlemény/2'] = ref;
      } else if (T === 'EXCHANGE') {
        o['Típus'] = 'Pénzváltás (Revolut)'; o['Közlemény/2'] = desc; o['Közlemény/3'] = ref;
      } else if (T === 'ATM') {
        o['Típus'] = 'Készpénzfelvétel (Revolut)'; o['Közlemény/2'] = desc; o['Közlemény/3'] = orig; o['Közlemény/4'] = r['MCC'] ? 'MCC ' + r['MCC'] : '';
      } else {
        o['Típus'] = (T || 'Egyéb') + ' (Revolut)'; o['Közlemény/2'] = desc; o['Közlemény/3'] = ref;
      }
      sh.rows.push(o);
      var fee = Math.round((tot - amt) * 100) / 100;
      if (isFinite(fee) && fee !== 0) sh.rows.push({ 'Típus': 'Díj, jutalék (Revolut)', 'Könyvelés dátuma': d, 'Értéknap': d, 'Azonosító': r['ID'], 'Összeg': fee, 'Közlemény/1': 'Tranzakciós díj', 'Közlemény/2': desc });
    });
    var out = Object.keys(by).map(function (k) { return by[k]; });
    if (out[0]) out[0].pending = skipped;
    return out;
  }
  /* Revolut „expenses” ZIP: expenses.csv + receipt_<dátum>_expenseID=<id>.<ext> → bizonylatok a tranzakció-azonosítóval. */
  function parseRevolutExpenses(csvText, fileNames) {
    var files = {};
    fileNames.forEach(function (n) { var m = /expenseID=([0-9a-f-]{36})/i.exec(n); if (m) (files[m[1]] = files[m[1]] || []).push(n); });
    var out = [];
    csvObjects(csvText).forEach(function (r) {
      var fs = files[r['Expense ID']]; if (!fs) return;
      var rate = parseFloat(String(r['Tax rate'] || '').replace('%', '').replace(',', '.'));
      fs.forEach(function (f, i) {
        out.push({ entry: f, expense_id: r['Expense ID'] + (i ? '-' + i : ''), tx_id: r['Transaction ID'], date: (r['Transaction completed (UTC)'] || r['Transaction started (UTC)'] || '').slice(0, 10),
          desc: r['Transaction description'] || '', note: r['Expense description'] || '', amount: Math.abs(Number(r['Amount (Payment currency)'])) || null, currency: r['Payment currency'] || 'HUF',
          vat: isFinite(rate) ? rate : null, category: r['Expense category name'] || '' });
      });
    });
    return out;
  }
  function isoOf(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'number' || /^\d{5}(\.\d+)?$/.test(String(v))) return new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 864e5).toISOString().slice(0, 10);
    var s = String(v).trim(), m = /^(\d{4})[.\-\/ ]+(\d{1,2})[.\-\/ ]+(\d{1,2})/.exec(s);
    return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
  }
  function rowDate(o) { return isoOf(o['Könyvelés dátuma']); }
  var api = { parseWorkbook: parseWorkbook, parseSheet: parseSheet, guessCurrency: guessCurrency, isRevolut: isRevolut, parseRevolut: parseRevolut, parseRevolutExpenses: parseRevolutExpenses, csvObjects: csvObjects, rowDate: rowDate };
  root.CAKivonat = api;
})(typeof window !== 'undefined' ? window : globalThis);
