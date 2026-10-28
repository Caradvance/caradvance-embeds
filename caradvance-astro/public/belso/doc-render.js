/* CarAdvance — dokumentumsablon előnézet (Ügyfél adatlap + Szerződések / Dokumentumok oldal).
 * Szintaxis: "# " cím, "## " fejezet, "bal || jobb" két hasáb, "[ ] / [x]" jelölőnégyzet, "- " felsorolás,
 * "[aláírás] Bal | Jobb" aláírás, "[oldaltörés]", "---" vonal, {{valtozo}} adat. */
(function () {
  var css = '.dpv h3{font-size:15px;margin:4px 0 8px}.dpv h4{font-size:12.5px;color:#E2001A;margin:12px 0 4px}.dpv p{margin:0 0 3px}'
    + '.dpv .two{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0 0 3px}.dpv .two>div{min-width:0}.dpv .two>div:first-child{color:#4b5260}'
    + '.dpv .two.h3{font-size:14px;font-weight:800;margin:4px 0 8px}.dpv .two.h4{font-size:12.5px;font-weight:800;color:#E2001A;margin:12px 0 4px}.dpv .two.h4>div:first-child{color:#E2001A}'
    + '.dpv .cb{display:inline-block;width:11px;height:11px;border:1.3px solid #6b7280;border-radius:2px;vertical-align:-1px;margin-right:6px;text-align:center;font-size:9px;line-height:9px;font-weight:800}'
    + '.dpv ul{margin:0 0 3px;padding-left:18px}.dpv hr{border:0;border-top:1px solid #d6dae1;margin:8px 0}'
    + '.dpv .pb{border-top:2px dashed #c8ced8;margin:14px 0;text-align:center;font-size:10px;color:#9aa2b0;line-height:0}.dpv .pb span{background:#fff;padding:0 8px}'
    + '.dpv .sig{display:flex;gap:30px;margin-top:34px}.dpv .sig div{flex:1;border-top:1px solid #9aa2b0;padding-top:4px;font-weight:700;white-space:pre-line}'
    + '.dpv mark{background:#fff3c4;padding:0 2px;border-radius:3px}.dpv mark.v{background:#e6f4ee;color:#0d6b4c}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /** vars === null: sablon-nézet (a változók nevei zöld címkeként) */
  function inl(raw, vars, labels) {
    return esc(raw).replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, function (m, k) {
      if (vars === null) return '<mark class="v" title="' + esc(k) + '">' + esc((labels && labels[k]) || k) + '</mark>';
      var v = vars[k]; return v && String(v).trim() ? esc(v) : '<mark title="' + esc(k) + '">' + esc((labels && labels[k]) || k) + '</mark>';
    }).replace(/^\[( |x)\]\s*/i, function (m, x) { return '<span class="cb">' + (x.toLowerCase() === 'x' ? '✕' : '') + '</span>'; });
  }
  function preview(text, vars, labels) {
    var out = [], ul = false;
    String(text || '').split('\n').forEach(function (raw) {
      var t = raw.replace(/\s+$/, '');
      if (ul && !/^- /.test(t)) { out.push('</ul>'); ul = false; }
      if (!t.trim()) { out.push('<div style="height:7px"></div>'); return; }
      if (/^\[oldaltörés\]$/i.test(t.trim())) { out.push('<div class="pb"><span>oldaltörés</span></div>'); return; }
      if (/^-{3,}$/.test(t.trim())) { out.push('<hr>'); return; }
      var sg = t.match(/^\[aláírás\]\s*(.*)$/i);
      if (sg) { var ps = sg[1].split('|'); out.push('<div class="sig"><div>' + inl((ps[0] || '').trim(), vars, labels) + '</div>' + (ps[1] != null ? '<div>' + inl(ps[1].trim(), vars, labels) + '</div>' : '<div style="border:0"></div>') + '</div>'); return; }
      var h = t.indexOf('# ') === 0 ? 'h3' : t.indexOf('## ') === 0 ? 'h4' : '';
      var body = h === 'h3' ? t.slice(2) : h === 'h4' ? t.slice(3) : t;
      if (body.indexOf('||') >= 0) { var i = body.indexOf('||'); out.push('<div class="two ' + h + '"><div>' + inl(body.slice(0, i).trim(), vars, labels) + '</div><div>' + inl(body.slice(i + 2).trim(), vars, labels) + '</div></div>'); return; }
      if (h) { out.push('<' + h + '>' + inl(body, vars, labels) + '</' + h + '>'); return; }
      if (/^- /.test(t)) { if (!ul) { out.push('<ul>'); ul = true; } out.push('<li>' + inl(t.slice(2), vars, labels) + '</li>'); return; }
      out.push('<p>' + inl(t, vars, labels) + '</p>');
    });
    if (ul) out.push('</ul>');
    return out.join('');
  }
  function usedKeys(text) { var o = []; String(text || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, function (m, k) { if (o.indexOf(k) < 0) o.push(k); return m; }); return o; }
  window.CADoc = { preview: preview, usedKeys: usedKeys, esc: esc };
})();
