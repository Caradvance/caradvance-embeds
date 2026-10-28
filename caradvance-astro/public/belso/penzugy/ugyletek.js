/* CarAdvance — Pénzügy › „Ügyletek” fül: az ügyfél-adatlapokon rögzített bevételek / költségek gyűjtője.
 * Adatforrás: /api/belso-crm/fin/summary (ügyletenkénti tételek, forintra átszámítva).
 * Az időszakszűrő a Pénzügy oldal felső időszakválasztója (hónap–hónap), a tétel dátuma szerint. */
(function () {
  'use strict';
  var LINES = ['Eladás', 'Import', 'Bérlés', 'Bizományos'];
  var COLORS = { 'Eladás': '#128a63', 'Import': '#c07a1e', 'Bérlés': '#3a63b0', 'Bizományos': '#7a3ea8' };
  var D = null, F = { q: '', line: '', all: false, sort: 'profit', only: true };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ft(n) { n = Math.round(Number(n) || 0); var s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (n < 0 ? '−' : '') + s + ' Ft'; }
  function pct(a, b) { return b ? (Math.round(a / b * 1000) / 10).toString().replace('.', ',') + '%' : '—'; }
  function cls(n) { return n < -0.5 ? 'neg' : n > 0.5 ? 'pos' : ''; }

  function load() {
    return fetch('/api/belso-crm/fin/summary', { credentials: 'same-origin' }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status); return j; });
    });
  }

  function compute(from, to) {
    var inRange = function (d) { if (F.all) return true; var m = String(d || '').slice(0, 7); return (!from || m >= from) && (!to || m <= to); };
    var by = {};
    D.deals.forEach(function (d) { by[d.id] = { d: d, inc: 0, cost: 0, n: 0, nofile: 0 }; });
    D.items.forEach(function (it) {
      var r = by[it.deal_id]; if (!r || !inRange(it.fdate)) return;
      r.n++;
      if (it.kind === 'income') r.inc += Number(it.amount_huf) || 0;
      else { r.cost += Number(it.amount_huf) || 0; if (!it.has_file) r.nofile++; }
    });
    return Object.keys(by).map(function (k) { var r = by[k]; r.profit = r.inc - r.cost; return r; });
  }

  function render(el, from, to) {
    var rows = compute(from, to);
    var withData = rows.filter(function (r) { return r.n; });
    var tot = withData.reduce(function (a, r) { a.inc += r.inc; a.cost += r.cost; a.nofile += r.nofile; return a; }, { inc: 0, cost: 0, nofile: 0 });
    tot.profit = tot.inc - tot.cost;
    var perLine = LINES.map(function (l) {
      var rs = withData.filter(function (r) { return r.d.line === l; });
      var x = rs.reduce(function (a, r) { a.inc += r.inc; a.cost += r.cost; return a; }, { inc: 0, cost: 0 });
      return { line: l, n: rs.length, inc: x.inc, cost: x.cost, profit: x.inc - x.cost };
    });
    var q = F.q.toLowerCase().trim();
    var list = (F.only ? withData : rows).filter(function (r) {
      return (!F.line || r.d.line === F.line) && (!q || (r.d.name + ' ' + (r.d.car || '')).toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, b) {
      if (F.sort === 'name') return String(a.d.name).localeCompare(String(b.d.name), 'hu');
      if (F.sort === 'inc') return b.inc - a.inc;
      if (F.sort === 'cost') return b.cost - a.cost;
      if (F.sort === 'margin') return (b.inc ? b.profit / b.inc : -1e9) - (a.inc ? a.profit / a.inc : -1e9);
      return b.profit - a.profit;
    });
    var period = F.all ? 'minden időszak' : (from === to ? from : from + ' – ' + to);

    el.innerHTML =
      '<div class="kpis">'
      + '<div class="kpi"><span>Ügyletek bevétele</span><b>' + ft(tot.inc) + '</b><small>' + esc(period) + '</small></div>'
      + '<div class="kpi"><span>Ügyletek költsége</span><b>' + ft(tot.cost) + '</b><small>' + withData.length + ' ügylet pénzügyi adattal</small></div>'
      + '<div class="kpi"><span>Haszon (mérleg)</span><b class="' + cls(tot.profit) + '" style="color:' + (tot.profit >= 0 ? 'var(--ok)' : 'var(--neg)') + '">' + ft(tot.profit) + '</b><small>árrés: ' + pct(tot.profit, tot.inc) + '</small></div>'
      + '<div class="kpi"><span>Átlagos haszon / ügylet</span><b>' + ft(withData.length ? tot.profit / withData.length : 0) + '</b><small>&nbsp;</small></div>'
      + '<div class="kpi' + (tot.nofile ? ' alert' : '') + '" id="uNoFile"><span>Számla nélküli költség</span><b>' + tot.nofile + '</b><small>' + (tot.nofile ? 'kattints a szűréshez' : 'minden költséghez van számla') + '</small></div>'
      + '</div>'
      + '<div class="card"><h2>Üzletáganként</h2><div style="overflow:auto"><table><thead><tr><th>Üzletág</th><th class="n">Ügylet</th><th class="n">Bevétel</th><th class="n">Költség</th><th class="n">Haszon</th><th class="n">Árrés</th></tr></thead><tbody>'
      + perLine.map(function (x) {
        return '<tr style="cursor:pointer" data-line="' + esc(x.line) + '"><td><span class="ldot" style="background:' + COLORS[x.line] + '"></span>' + esc(x.line) + '</td><td class="n">' + x.n + '</td><td class="n">' + (x.n ? ft(x.inc) : '–') + '</td><td class="n">' + (x.n ? ft(x.cost) : '–') + '</td><td class="n" style="font-weight:800;color:' + (!x.n ? 'var(--mut)' : x.profit >= 0 ? 'var(--ok)' : 'var(--neg)') + '">' + (x.n ? ft(x.profit) : '–') + '</td><td class="n">' + pct(x.profit, x.inc) + '</td></tr>';
      }).join('')
      + '</tbody><tfoot><tr style="font-weight:800"><td>Összesen</td><td class="n">' + withData.length + '</td><td class="n">' + ft(tot.inc) + '</td><td class="n">' + ft(tot.cost) + '</td><td class="n" style="color:' + (tot.profit >= 0 ? 'var(--ok)' : 'var(--neg)') + '">' + ft(tot.profit) + '</td><td class="n">' + pct(tot.profit, tot.inc) + '</td></tr></tfoot></table></div></div>'
      + '<div class="card"><h2>Ügyletek</h2>'
      + '<div class="row" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">'
      + '<input class="in" id="uQ" type="search" placeholder="Keresés ügyfélre / autóra…" value="' + esc(F.q) + '" style="flex:1;min-width:200px">'
      + '<select class="in" id="uLine"><option value="">Minden üzletág</option>' + LINES.map(function (l) { return '<option' + (l === F.line ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>'
      + '<select class="in" id="uSort"><option value="profit">Rendezés: haszon</option><option value="margin">árrés</option><option value="inc">bevétel</option><option value="cost">költség</option><option value="name">név</option></select>'
      + '<label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="uOnly"' + (F.only ? ' checked' : '') + '> csak pénzügyi adattal</label>'
      + '<label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="uAll"' + (F.all ? ' checked' : '') + '> minden időszak</label>'
      + '<button class="btn sm ghost" id="uCsv">CSV letöltés</button></div>'
      + '<div style="overflow:auto"><table><thead><tr><th>Ügyfél</th><th>Üzletág</th><th>Státusz</th><th class="n">Bevétel</th><th class="n">Költség</th><th class="n">Haszon</th><th class="n">Árrés</th><th class="n">Tétel</th><th></th></tr></thead><tbody>'
      + (list.length ? list.map(function (r) {
        return '<tr><td><b>' + esc(r.d.name || 'Névtelen') + '</b>' + (r.d.car ? '<div class="small muted">' + esc(r.d.car) + '</div>' : '') + '</td>'
          + '<td><span class="ldot" style="background:' + (COLORS[r.d.line] || '#999') + '"></span>' + esc(r.d.line) + '</td>'
          + '<td><span class="badge' + (r.d.status === 'Lezárva' ? ' ok' : '') + '">' + esc(r.d.status || '') + '</span></td>'
          + '<td class="n">' + (r.inc ? ft(r.inc) : '–') + '</td><td class="n">' + (r.cost ? ft(r.cost) : '–') + '</td>'
          + '<td class="n" style="font-weight:800;color:' + (r.profit >= 0 ? 'var(--ok)' : 'var(--neg)') + '">' + (r.n ? ft(r.profit) : '–') + '</td>'
          + '<td class="n">' + pct(r.profit, r.inc) + '</td>'
          + '<td class="n">' + r.n + (r.nofile ? ' <span class="badge warn" title="számla nélküli költség">' + r.nofile + ' számla hiányzik</span>' : '') + '</td>'
          + '<td class="n"><a class="btn sm ghost" href="/belso/ugyfel/?id=' + r.d.id + '#s6" target="_blank" rel="noopener">Adatlap ↗</a></td></tr>';
      }).join('') : '<tr><td colspan="9" class="muted" style="text-align:center;padding:22px">' + (withData.length ? 'Nincs a szűrésnek megfelelő ügylet.' : 'Még nincs pénzügyi adat. Az ügyfél adatlapján a „6. Pénzügy” szekcióban rögzíthetők a bevételek és költségek.') + '</td></tr>')
      + '</tbody></table></div>'
      + '<p class="small muted" style="margin:10px 0 0">Az euróban rögzített tételek a rögzítéskori árfolyamon, forintban szerepelnek. Az ügyletek pénzügye a cég banki eredménykimutatásától független nyilvántartás (ügyletenkénti haszonkalkuláció).</p></div>';

    var rerender = function () { render(el, from, to); };
    var qi = el.querySelector('#uQ');
    qi.oninput = function () { F.q = qi.value; var pos = qi.selectionStart; rerender(); var n = el.querySelector('#uQ'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
    el.querySelector('#uLine').onchange = function () { F.line = this.value; rerender(); };
    var so = el.querySelector('#uSort'); so.value = F.sort; so.onchange = function () { F.sort = this.value; rerender(); };
    el.querySelector('#uOnly').onchange = function () { F.only = this.checked; rerender(); };
    el.querySelector('#uAll').onchange = function () { F.all = this.checked; rerender(); };
    [].forEach.call(el.querySelectorAll('tr[data-line]'), function (tr) { tr.onclick = function () { F.line = F.line === tr.dataset.line ? '' : tr.dataset.line; rerender(); }; });
    el.querySelector('#uNoFile').onclick = function () { if (!tot.nofile) return; F.only = true; F.sort = 'cost'; rerender(); };
    el.querySelector('#uCsv').onclick = function () {
      var lines = [['Ügyfél', 'Autó', 'Üzletág', 'Státusz', 'Bevétel (Ft)', 'Költség (Ft)', 'Haszon (Ft)', 'Árrés %', 'Tételek', 'Számla nélküli költség']];
      list.forEach(function (r) { lines.push([r.d.name, r.d.car || '', r.d.line, r.d.status || '', Math.round(r.inc), Math.round(r.cost), Math.round(r.profit), r.inc ? (Math.round(r.profit / r.inc * 1000) / 10) : '', r.n, r.nofile]); });
      var csv = '﻿' + lines.map(function (l) { return l.map(function (v) { v = String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'ugyletek-' + (F.all ? 'osszes' : from + '_' + to) + '.csv'; a.click();
    };
  }

  /** A Pénzügy oldal hívja, amikor az „Ügyletek” fül aktív. */
  window.CA_renderUgyletek = function (el, from, to) {
    if (D) return render(el, from, to);
    el.innerHTML = '<div class="card muted">Ügyletek betöltése…</div>';
    load().then(function (j) { D = j; render(el, from, to); })
      .catch(function (e) { el.innerHTML = '<div class="card">Az ügyletek pénzügyi adatai nem tölthetők be: ' + esc(e.message) + '</div>'; });
  };
  window.CA_reloadUgyletek = function () { D = null; };
})();
