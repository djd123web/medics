/* Navigation, display options and footer year. No tracking, no cookies. */
(function () {
  var root = document.documentElement;

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---- Display options (stored only on this device, in localStorage) ---- */
  var KEY = 'medics-display';
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* storage unavailable */ } }
  function apply(o) {
    ['text', 'theme', 'spacing'].forEach(function (k) {
      if (o[k] && o[k] !== 'standard') root.setAttribute('data-' + k, o[k]); else root.removeAttribute('data-' + k);
    });
  }
  var prefs = read();
  apply(prefs);

  var btn = document.getElementById('display-toggle');
  var panel = document.getElementById('display-panel');
  if (btn && panel) {
    btn.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', String(open));
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { panel.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
    ['text', 'theme', 'spacing'].forEach(function (k) {
      var val = prefs[k] || 'standard';
      var input = panel.querySelector('input[name="' + k + '"][value="' + val + '"]');
      if (input) input.checked = true;
    });
    panel.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.name) { prefs[t.name] = t.value; write(prefs); apply(prefs); }
    });
    var reset = document.getElementById('display-reset');
    if (reset) reset.addEventListener('click', function () {
      prefs = {}; write(prefs); apply(prefs);
      ['text', 'theme', 'spacing'].forEach(function (k) {
        var i = panel.querySelector('input[name="' + k + '"][value="standard"]'); if (i) i.checked = true;
      });
    });
  }

  /* ---- Desktop dropdown menus (click, Enter/Space, arrow keys, Escape; also hover with a mouse) ---- */
  var groups = Array.prototype.slice.call(document.querySelectorAll('.has-sub'));
  function setOpen(g, open) {
    var t = g.querySelector('.sub-toggle'), p = g.querySelector('.sub');
    t.setAttribute('aria-expanded', String(open));
    if (open) p.removeAttribute('hidden'); else { p.setAttribute('hidden', ''); g.removeAttribute('data-hover'); g.removeAttribute('data-pinned'); }
  }
  function closeAll(except) { groups.forEach(function (g) { if (g !== except) setOpen(g, false); }); }
  groups.forEach(function (g) {
    var t = g.querySelector('.sub-toggle'), p = g.querySelector('.sub'), timer;
    t.addEventListener('click', function () {
      closeAll(g);
      if (g.getAttribute('data-hover') === '1') {          /* opened by hovering: a click keeps it open */
        g.removeAttribute('data-hover'); g.setAttribute('data-pinned', '1'); setOpen(g, true); return;
      }
      var open = t.getAttribute('aria-expanded') !== 'true';
      setOpen(g, open);
      if (open) g.setAttribute('data-pinned', '1');
    });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); closeAll(g); setOpen(g, true);
        var first = p.querySelector('a'); if (first) first.focus();
      }
    });
    p.addEventListener('keydown', function (e) {
      var links = Array.prototype.slice.call(p.querySelectorAll('a')), i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); links[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
    });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && t.getAttribute('aria-expanded') === 'true') { e.preventDefault(); setOpen(g, false); t.focus(); }
    });
    g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) setOpen(g, false); });
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      g.addEventListener('mouseenter', function () {
        clearTimeout(timer); closeAll(g);
        if (t.getAttribute('aria-expanded') !== 'true') { setOpen(g, true); g.setAttribute('data-hover', '1'); }
      });
      g.addEventListener('mouseleave', function () {
        timer = setTimeout(function () { if (!g.hasAttribute('data-pinned') && !g.contains(document.activeElement)) setOpen(g, false); }, 200);
      });
    }
  });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest || !t.closest('.has-sub') || t.closest('.sub a')) closeAll();
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
