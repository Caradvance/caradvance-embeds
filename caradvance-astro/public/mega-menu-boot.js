/* TESZT: a valódi oldalt (alapból a főoldalt) tölti be, és az új mega menüt teszi rá. Az éles menü nem változik.
   Másik oldal: /teszt-mega-menu/?oldal=/autoink/ */
(function () {
  var q = new URLSearchParams(location.search).get('oldal') || '/';
  if (!/^\/[A-Za-z0-9\-_/]*$/.test(q) || q.indexOf('//') >= 0 || q.indexOf('/teszt-mega-menu') === 0) q = '/';
  var LT = '<', BODY_END = LT + '/body>', SCRIPT_END = LT + '/script>';
  fetch(q, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (html) {
    html = html.replace(new RegExp(LT + '!-- ca-tracking:start -->[\\s\\S]*?' + LT + '!-- ca-tracking:end -->', 'g'), '');
    html = html.replace(new RegExp(LT + 'head([^>]*)>', 'i'), LT + 'head$1>' + LT + 'meta name="robots" content="noindex,nofollow">');
    var bar = LT + 'div style="position:fixed;left:14px;bottom:14px;z-index:2147483000;background:#0B0B0D;color:#fff;font:600 13px/1.3 Plus Jakarta Sans,system-ui,sans-serif;padding:10px 14px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.25)">TESZT – új mega menü (csak asztali nézet, min. 1100 px)' + LT + '/div>';
    var i = html.toLowerCase().lastIndexOf(BODY_END);
    var add = bar + LT + 'script src="/mega-menu-test.js?v=3">' + SCRIPT_END;
    html = i >= 0 ? html.slice(0, i) + add + html.slice(i) : html + add;
    document.open(); document.write(html); document.close();
  }).catch(function () { var d = document.querySelector('.ld'); if (d) d.textContent = 'Az előnézet nem töltődött be. Frissítsd az oldalt.'; });
})();
