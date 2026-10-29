/* CarAdvance — dokumentumsablon HTML-előnézet (Ügyfél adatlap + Szerződések / Dokumentumsablonok oldal).
 * Ugyanazt a szintaxist érti, mint a PDF-motor (lib/docpdf.js): @direktívák, # / ## / ###, "bal || jobb",
 * [sor], [összeg], [összeg!], [megjegyzés], [keret] … [/keret], [címke], [aláírás] / [aláírás+], [oldaltörés],
 * ---, "- " felsorolás, [ ] / [x], **félkövér**, " // " sortörés, {{valtozo}}. */
(function () {
  var css = '.dpv{font-family:Poppins,"Plus Jakarta Sans",system-ui,sans-serif;color:#262a33}'
    + '.dpv .rh{display:flex;justify-content:space-between;gap:10px;font-size:10px;color:#8a909a;border-bottom:1px solid #e3e6ea;padding-bottom:5px;margin-bottom:12px}'
    + '.dpv .cov{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}.dpv .cov .f{font-size:11px;line-height:1.7}.dpv .cov .f span{color:#8a909a}'
    + '.dpv .logo{font-weight:800;font-size:18px;letter-spacing:-.02em;color:#6b7280}.dpv .logo b{color:#E2001A}'
    + '.dpv .cs{font-size:10px;color:#8a909a;border-bottom:1px solid #d6dae1;padding-bottom:5px;margin-bottom:12px}'
    + '.dpv .tag{display:inline-block;background:#E2001A;color:#fff;font-weight:800;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:3px;margin:4px 0 10px}'
    + '.dpv h3{font-size:19px;margin:2px 0 0;font-weight:800;color:#161922}.dpv .st{font-size:14px;color:#6b7280;font-weight:300;margin:2px 0 12px}'
    + '.dpv h4{font-size:12.5px;font-weight:700;margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid #cdd1d8;display:grid;grid-template-columns:1fr 1fr;gap:20px}.dpv h4.one{display:block}.dpv h4 span+span{color:#4b5260}'
    + '.dpv h5{font-size:11px;font-weight:700;margin:10px 0 4px;padding-bottom:3px;border-bottom:1px solid #e3e6ea;display:grid;grid-template-columns:1fr 1fr;gap:20px}.dpv h5.one{display:block}.dpv h5 span+span{color:#6b7280}'
    + '.dpv p{margin:0 0 4px}.dpv .two{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:0 0 4px}.dpv .two>div{min-width:0}.dpv .two>div+div{border-left:1px solid #e3e6ea;padding-left:12px}'
    + '.dpv .row{display:grid;grid-template-columns:1fr 1fr;gap:20px;border-bottom:1px solid #eef0f2;padding:4px 0}.dpv .row.one{grid-template-columns:1fr}.dpv .row .c{display:grid;grid-template-columns:42% 1fr;gap:6px;min-width:0}.dpv .row .c+.c{border-left:1px solid #e3e6ea;padding-left:12px}'
    + '.dpv .row .l{color:#80868f;font-size:11px}.dpv .row.amt .c{grid-template-columns:1fr auto}.dpv .row.amt .v{text-align:right;font-weight:600}.dpv .row.strong{border:1.5px solid #333;padding:6px 8px;margin:4px 0;font-weight:700}'
    + '.dpv .note{background:#f4f5f7;border-left:3px solid #E2001A;padding:8px 12px;margin:6px 0 10px;font-size:11px;display:grid;grid-template-columns:1fr 1fr;gap:20px}.dpv .note.one{display:block}'
    + '.dpv .frame{border:1px solid #cdd1d8;padding:8px 10px;margin:6px 0 10px}.dpv .frame.gray{background:#f4f5f7}'
    + '.dpv .cb{display:inline-block;width:11px;height:11px;border:1.3px solid #6b7280;border-radius:2px;vertical-align:-1px;margin-right:5px;text-align:center;font-size:9px;line-height:9px;font-weight:800}'
    + '.dpv .bl{display:inline-block;min-width:70px;border-bottom:1px solid #8a909a;height:1em;vertical-align:-2px}'
    + '.dpv ul{margin:0 0 4px;padding-left:18px}.dpv hr{border:0;border-top:1px solid #d6dae1;margin:8px 0}'
    + '.dpv .pb{border-top:2px dashed #c8ced8;margin:16px 0;text-align:center;font-size:10px;color:#9aa2b0;line-height:0}.dpv .pb span{background:#fff;padding:0 8px}'
    + '.dpv .sig{display:flex;gap:22px;margin-top:22px}.dpv .sig>div{flex:1;min-width:0}.dpv .sig b{display:block;font-size:11.5px}.dpv .sig small{display:block;color:#80868f}.dpv .sig .ln{border-top:1px solid #555;margin-top:34px;padding-top:3px;font-size:11px}.dpv .sig .dt{font-size:10.5px;color:#80868f;margin-top:8px}'
    + '.dpv .sgi{display:block;height:38px;max-width:90%;margin-top:6px;object-fit:contain;object-position:left bottom}'
    + '.dpv .ft{margin-top:18px;border-top:1px solid #cdd1d8;padding-top:5px;font-size:9.5px;color:#80868f}.dpv .ft b{color:#262a33}'
    + '.dpv mark{background:#fff3c4;padding:0 2px;border-radius:3px}.dpv mark.v{background:#e6f4ee;color:#0d6b4c}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /** vars === null: sablon-nézet (a változók nevei zöld címkeként) */
  function inl(raw, vars, labels) {
    var bold = false;
    return esc(raw).replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, function (m, k) {
      if (vars === null) return '<mark class="v" title="' + esc(k) + '">' + esc((labels && labels[k]) || k) + '</mark>';
      var v = vars[k]; return v && String(v).trim() ? esc(v) : '<mark title="' + esc(k) + '">' + esc((labels && labels[k]) || k) + '</mark>';
    }).replace(/\[( |x|X)\]/g, function (m, x) { return '<span class="cb">' + (x !== ' ' ? '✓' : '') + '</span>'; })
      .replace(/(…{2,}|\.{4,}|_{3,})/g, '<span class="bl"></span>')
      .replace(/(^| )\/\/ /g, '$1<br>')
      .replace(/\*\*/g, function () { bold = !bold; return bold ? '<b>' : '</b>'; }) + (bold ? '</b>' : '');
  }
  function split2(s) { var i = s.indexOf('||'); return i < 0 ? [s.trim(), null] : [s.slice(0, i).trim(), s.slice(i + 2).trim()]; }
  function cell(c) { var i = c.indexOf('|'); return i < 0 ? [c.trim(), ''] : [c.slice(0, i).trim(), c.slice(i + 1).trim()]; }
  function nk(v) { return String(v || '').replace(/\*\*/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase(); }
  function preview(text, vars, labels, sigs) {
    var out = [], ul = false, D = { fields: [] }, body = [];
    var I = function (s) { return inl(s, vars, labels); };
    String(text || '').split('\n').forEach(function (raw) {
      var m = raw.match(/^@([^\s:]+)\s*:\s*(.*)$/);
      if (!m) { body.push(raw); return; }
      var k = m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), v = m[2].trim();
      if (k === 'mezo') D.fields.push(v.split('|')); else D[k] = v;
    });
    if (D.fejlec) { var h = D.fejlec.split('|'); out.push('<div class="rh"><span>' + I(h[0] || '') + '</span><span>' + I(h[1] || '') + '</span></div>'); }
    if (D.fields.length || !/^(nem|no|off)$/i.test(D.logo || '')) {
      out.push('<div class="cov"><div class="f">' + D.fields.map(function (f) { var l = (f[0] || '').split(' / '); return esc(l[0]) + (l[1] ? ' <span>/ ' + esc(l[1]) + '</span>' : '') + ' &nbsp; ' + I((f[1] || '').trim()); }).join('<br>') + '</div>'
        + (/^(nem|no|off)$/i.test(D.logo || '') ? '' : '<div class="logo"><b>car</b>advance</div>') + '</div>');
    }
    if (D.cegsor) out.push('<div class="cs">' + I(D.cegsor) + '</div>');
    if (D.cimke) out.push('<div class="tag">' + I(D.cimke) + '</div>');
    body.forEach(function (raw) {
      var t = raw.replace(/\s+$/, '').trim(), m;
      if (ul && !/^- /.test(t)) { out.push('</ul>'); ul = false; }
      if (!t) { out.push('<div style="height:6px"></div>'); return; }
      if (/^\[oldaltörés\]$/i.test(t)) { out.push('<div class="pb"><span>oldaltörés</span></div>'); return; }
      if (/^-{3,}$/.test(t)) { out.push('<hr>'); return; }
      if ((m = t.match(/^\[keret( szürke)?\]$/i))) { out.push('<div class="frame' + (m[1] ? ' gray' : '') + '">'); return; }
      if (/^\[\/keret\]$/i.test(t)) { out.push('</div>'); return; }
      if ((m = t.match(/^\[címke\]\s*(.*)$/i))) { out.push('<div class="tag">' + I(m[1]) + '</div>'); return; }
      if ((m = t.match(/^\[megjegyzés\]\s*(.*)$/i))) { var p = split2(m[1]); out.push('<div class="note' + (p[1] == null ? ' one' : '') + '"><div>' + I(p[0]) + '</div>' + (p[1] != null ? '<div>' + I(p[1]) + '</div>' : '') + '</div>'); return; }
      if ((m = t.match(/^\[(sor|összeg!?)\]\s*(.*)$/i))) {
        var cells = m[2].split('||').map(cell), amt = /összeg/i.test(m[1]), strong = /!/.test(m[1]);
        out.push('<div class="row' + (cells.length < 2 ? ' one' : '') + (amt ? ' amt' : '') + (strong ? ' strong' : '') + '">' + cells.map(function (c) { return '<div class="c"><span class="l">' + I(c[0]) + '</span><span class="v">' + (c[1] ? I(c[1]) : '<span class="bl"></span>') + '</span></div>'; }).join('') + '</div>');
        return;
      }
      if ((m = t.match(/^\[aláírás(\+?)\]\s*(.*)$/i))) {
        var plus = !!m[1];
        out.push('<div class="sig">' + m[2].split('|').map(function (part) {
          var nm = part.split('~~'), tt = nm[0].split('~');
          var nmVal = nm[1] ? nm[1].trim().replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, function (m, k) { return vars && vars[k] ? vars[k] : ''; }) : '';
          var keys = [nk(nmVal), nk((tt[0] || '').trim())];
          var nv = keys[0]; var sp = (sigs || []).filter(function (z) { return (z.names || []).some(function (n) { var k = nk(n); return k && (keys.indexOf(k) >= 0 || (nv && k.length > 3 && nv.slice(-k.length) === k)); }); })[0];
          return '<div><b>' + I((tt[0] || '').trim()) + '</b>' + (tt[1] ? '<small>' + I(tt[1].trim()) + '</small>' : '') + (plus ? '<div class="dt">Dátum <span class="bl"></span><br>Helység <span class="bl"></span></div>' : '')
            + (sp && /^data:image\/jpeg;base64,/.test(sp.src) ? '<img class="sgi" src="' + esc(sp.src) + '" alt="aláírás">' : '') + '<div class="ln"' + (sp ? ' style="margin-top:2px"' : '') + '>' + (nm[1] ? I(nm[1].trim()) : '&nbsp;') + '</div></div>';
        }).join('') + '</div>');
        return;
      }
      if (/^# /.test(t)) { var a = split2(t.slice(2)); out.push('<h3>' + I(a[0]) + '</h3>' + (a[1] ? '<div class="st">' + I(a[1]) + '</div>' : '<div style="height:10px"></div>')); return; }
      if ((m = t.match(/^(#{2,3}) (.*)$/))) { var hh = split2(m[2]), tg = m[1].length === 2 ? 'h4' : 'h5'; out.push('<' + tg + (hh[1] == null ? ' class="one"' : '') + '><span>' + I(hh[0]) + '</span>' + (hh[1] != null ? '<span>' + I(hh[1]) + '</span>' : '') + '</' + tg + '>'); return; }
      if (t.indexOf('||') >= 0) { var q = split2(t); out.push('<div class="two"><div>' + I(q[0]) + '</div><div>' + I(q[1]) + '</div></div>'); return; }
      if (/^- /.test(t)) { if (!ul) { out.push('<ul>'); ul = true; } out.push('<li>' + I(t.slice(2)) + '</li>'); return; }
      out.push('<p>' + I(t) + '</p>');
    });
    if (ul) out.push('</ul>');
    if (D.lablec) { var c = D.lablec.split(';;'); out.push('<div class="ft"><b>' + I(c[0]) + '</b> · ' + c.slice(1).map(function (x) { return I(x.replace(/~/g, '').replace(/::/g, ':')); }).join(' · ') + '</div>'); }
    return out.join('');
  }
  function usedKeys(text) { var o = []; String(text || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, function (m, k) { if (o.indexOf(k) < 0) o.push(k); return m; }); return o; }
  window.CADoc = { preview: preview, usedKeys: usedKeys, esc: esc };
})();
