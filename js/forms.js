/* Accessible forms: searchable country and calling-code selectors, E.164 phone
   normalisation, CV upload checks, inline validation and real submission to the
   configured form service. Nothing is sent unless an endpoint is configured. */
(function () {
  'use strict';
  var CFG = window.MEDICS_CONFIG || {};
  var COUNTRIES = window.MEDICS_COUNTRIES || [];
  var KEEP_ZERO = window.MEDICS_KEEP_ZERO || [];

  function norm(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }
  var liveRegion = document.getElementById('combo-live');

  /* ---------- Combobox (ARIA 1.2 editable combobox with list autocomplete) ---------- */
  function Combo(opts) {
    var input = opts.input, listId = input.id + '-list';
    var list = el('ul', { id: listId, role: 'listbox', 'aria-label': opts.label, hidden: '' });
    var hidden = opts.hidden;
    var items = opts.items, shown = [], active = -1, selected = null;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.parentNode.appendChild(list);

    var toggle = el('button', { type: 'button', class: 'combo-toggle', 'aria-label': 'Show all options for ' + opts.label, tabindex: '-1' }, '\u25BE');
    input.parentNode.appendChild(toggle);

    function announce(msg) { if (liveRegion) liveRegion.textContent = msg; }
    function open() { list.removeAttribute('hidden'); input.setAttribute('aria-expanded', 'true'); }
    function close() { list.setAttribute('hidden', ''); input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
    function isOpen() { return !list.hasAttribute('hidden'); }

    function render(q) {
      var nq = norm(q || '').trim(), digits = nq.replace(/^\+/, '');
      function score(it) {
        if (!nq) return 5;
        var name = norm(it.name);
        if (it.iso.toLowerCase() === nq) return 0;
        if (name === nq) return 0;
        if (name.indexOf(nq) === 0) return 1;
        if (/^\d+$/.test(digits) && it.dial === digits) return 2;
        if (new RegExp('(^|[\\s(\\-])' + nq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(name)) return 3;
        if (/^\d+$/.test(digits) && it.dial.indexOf(digits) === 0) return 4;
        if (name.indexOf(nq) !== -1) return 6;
        return 99;
      }
      shown = items.map(function (it, idx) { return { it: it, s: score(it), i: idx }; })
        .filter(function (x) { return x.s < 99; })
        .sort(function (a, b) { return a.s - b.s || a.i - b.i; })
        .map(function (x) { return x.it; });
      list.innerHTML = '';
      if (!shown.length) {
        list.appendChild(el('li', { class: 'none', role: 'option', 'aria-disabled': 'true' }, 'No matches. Try a country name or calling code.'));
        announce('No matches');
      } else {
        shown.forEach(function (it, i) {
          var li = el('li', { id: listId + '-' + i, role: 'option', 'aria-selected': 'false' }, it.label);
          li.addEventListener('mousedown', function (e) { e.preventDefault(); });
          li.addEventListener('click', function (e) { e.preventDefault(); choose(it); });
          list.appendChild(li);
        });
        announce(shown.length + (shown.length === 1 ? ' result' : ' results') + ' available. Use the up and down arrow keys, then Enter to choose.');
      }
      active = -1;
      input.removeAttribute('aria-activedescendant');
    }
    function setActive(i) {
      var opts2 = list.querySelectorAll('[role="option"]:not(.none)');
      if (!opts2.length) return;
      if (i < 0) i = opts2.length - 1;
      if (i >= opts2.length) i = 0;
      Array.prototype.forEach.call(opts2, function (o) { o.setAttribute('aria-selected', 'false'); });
      active = i;
      opts2[i].setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', opts2[i].id);
      opts2[i].scrollIntoView({ block: 'nearest' });
    }
    function choose(it) {
      selected = it;
      input.value = it.label;
      if (hidden) hidden.value = it.value;
      input.removeAttribute('aria-invalid');
      close();
      if (opts.onChoose) opts.onChoose(it);
    }
    function clear() { selected = null; if (hidden) hidden.value = ''; }

    input.addEventListener('input', function () { clear(); render(input.value); open(); if (opts.onClear) opts.onClear(); });
    input.addEventListener('click', function () {
      if (!isOpen()) { render(selected ? '' : input.value); open(); }
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen()) { render(input.value); open(); } setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen()) { render(input.value); open(); } setActive(active - 1); }
      else if (e.key === 'Enter') {
        if (isOpen()) {
          e.preventDefault();
          if (active >= 0) choose(shown[active]); else if (shown.length === 1) choose(shown[0]);
        }
      } else if (e.key === 'Escape') { if (isOpen()) { e.preventDefault(); close(); } }
      else if (e.key === 'Tab') { if (isOpen() && active >= 0) choose(shown[active]); else close(); }
    });
    input.addEventListener('blur', function () {
      setTimeout(function () {
        close();
        if (!selected) {
          var v = norm(input.value).trim();
          var exact = items.filter(function (it) { return norm(it.label) === v || norm(it.name) === v; });
          if (exact.length === 1) choose(exact[0]);
        }
      }, 120);
    });
    toggle.addEventListener('click', function () {
      if (isOpen()) { close(); } else { render(''); open(); input.focus(); }
    });

    return {
      select: function (it) { choose(it); },
      get: function () { return selected; },
      clear: function () { clear(); input.value = ''; },
      reset: function () { clear(); input.value = ''; close(); }
    };
  }

  /* ---------- Phone handling ---------- */
  function toE164(dial, iso, nationalRaw) {
    var raw = String(nationalRaw || '').trim();
    if (!raw) return { empty: true };
    var digits;
    if (raw.charAt(0) === '+') {
      digits = raw.replace(/\D/g, '');
    } else if (/^00/.test(raw.replace(/[^\d+]/g, ''))) {
      digits = raw.replace(/\D/g, '').replace(/^00/, '');
    } else {
      digits = raw.replace(/\D/g, '');
      if (!dial) return { error: 'Choose a calling code first.' };
      if (digits.charAt(0) === '0' && KEEP_ZERO.indexOf(iso) === -1) digits = digits.slice(1);
      digits = dial + digits;
    }
    if (!/^\d+$/.test(digits)) return { error: 'Use digits only (spaces, dashes and brackets are fine).' };
    if (digits.length < 8) return { error: 'This number looks too short.' };
    if (digits.length > 15) return { error: 'This number looks too long. International numbers have at most 15 digits.' };
    return { e164: '+' + digits };
  }

  /* ---------- Form wiring ---------- */
  function setupForm(form) {
    var kind = form.getAttribute('data-kind'); // 'contact' | 'careers'
    var endpoint = kind === 'careers' ? CFG.careersEndpoint : CFG.contactEndpoint;
    var simulate = CFG.simulateSubmission === true;
    var connected = endpoint && !/YOUR_|^\s*$/.test(endpoint);
    var statusBox = form.querySelector('.form-status');
    var summaryBox = form.querySelector('.error-summary-slot');
    var submitBtn = form.querySelector('button[type="submit"]');
    var phoneInput = form.querySelector('#phone');
    var phonePreview = form.querySelector('#phone-preview');
    var hiddenE164 = form.querySelector('input[name="phone_e164"]');

    form.setAttribute('action', endpoint || '');
    Array.prototype.forEach.call(document.querySelectorAll('.js-max-mb'), function (n) { n.textContent = String(CFG.maxCvMB || 5); });

    if (!connected && !simulate) {
      var warn = el('div', { class: 'status-box warn' });
      warn.appendChild(el('strong', null, 'Setup required: this form is not connected yet.'));
      warn.appendChild(el('span', null, ' It will not send anything until the site owner adds a form-service endpoint in js/config.js. Please do not rely on it yet.'));
      form.insertBefore(warn, form.firstChild);
    }

    /* Country + calling code comboboxes */
    var countryItems = COUNTRIES.map(function (c) {
      return { name: c[0], iso: c[1], dial: c[2], value: c[0], label: c[0], search: norm(c[0] + ' ' + c[1]) };
    });
    var dialItems = COUNTRIES.map(function (c) {
      return { name: c[0], iso: c[1], dial: c[2], value: '+' + c[2], label: c[0] + ' (+' + c[2] + ')', search: norm(c[0] + ' ' + c[1]) };
    });
    var dialManual = false;
    var countryCombo = Combo({ input: form.querySelector('#country'), hidden: form.querySelector('input[name="country"]'), items: countryItems, label: 'country',
      onChoose: function (it) {
        if (!dialManual) {
          var match = dialItems.filter(function (d) { return d.iso === it.iso; })[0];
          if (match) dialCombo.select(match);
        }
        updatePreview();
      } });
    var dialCombo = Combo({ input: form.querySelector('#calling-code'), hidden: form.querySelector('input[name="calling_code"]'), items: dialItems, label: 'calling code',
      onChoose: function () { updatePreview(); }, onClear: function () { updatePreview(); } });
    form.querySelector('#calling-code').addEventListener('input', function () { dialManual = true; });
    /* Default calling code: United States (+1). Choosing a country still updates it
       unless the visitor has picked a calling code themselves. */
    function setDefaultDial() {
      var us = dialItems.filter(function (d) { return d.iso === 'US'; })[0];
      if (us) dialCombo.select(us);
    }
    setDefaultDial();

    function currentPhone() {
      var d = dialCombo.get();
      var raw = phoneInput ? phoneInput.value : '';
      return toE164(d ? d.dial : '', d ? d.iso : '', raw);
    }
    function updatePreview() {
      if (!phonePreview) return;
      var r = currentPhone();
      if (hiddenE164) hiddenE164.value = r.e164 || '';
      phonePreview.textContent = r.e164 ? 'We will receive this number as ' + r.e164 + '.' : (r.error && phoneInput.value ? r.error : '');
    }
    if (phoneInput) phoneInput.addEventListener('input', updatePreview);

    /* Preselect position from ?position= */
    var posSel = form.querySelector('#position');
    if (posSel) {
      var p = new URLSearchParams(location.search).get('position');
      if (p) Array.prototype.forEach.call(posSel.options, function (o) { if (o.getAttribute('data-key') === p) posSel.value = o.value; });
    }

    /* CV file feedback, remove button and drag and drop */
    var cv = form.querySelector('#cv'), cvInfo = form.querySelector('#cv-info');
    var cvRemove = form.querySelector('#cv-remove'), dz = form.querySelector('#cv-drop'), prog = form.querySelector('#upload-progress');
    function fmtSize(n) { return n / 1024 < 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
    function cvProblem(file) {
      if (!file) return 'Choose your CV file.';
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      var allowed = CFG.allowedCvExtensions || ['pdf', 'doc', 'docx'];
      if (allowed.indexOf(ext) === -1) return 'Your CV must be a PDF, DOC or DOCX file.';
      var max = (CFG.maxCvMB || 5) * 1024 * 1024;
      if (file.size > max) return 'Your CV is ' + (file.size / 1048576).toFixed(1) + ' MB. The limit is ' + (CFG.maxCvMB || 5) + ' MB.';
      if (file.size === 0) return 'This file looks empty. Please choose another file.';
      return '';
    }
    function cvChanged() {
      var f = cv.files && cv.files[0];
      if (cvRemove) cvRemove.hidden = !f;
      if (!f) { cvInfo.textContent = ''; return; }
      var prob = cvProblem(f);
      cvInfo.textContent = prob ? '' : 'Selected file: ' + f.name + ' (' + fmtSize(f.size) + ').';
      if (prob) showFieldError(cv, prob); else clearFieldError(cv);
    }
    if (cv) cv.addEventListener('change', cvChanged);
    if (cv && cvRemove) cvRemove.addEventListener('click', function () {
      cv.value = ''; cvInfo.textContent = 'File removed.'; clearFieldError(cv); cvRemove.hidden = true; cv.focus();
    });
    if (dz && cv) {
      ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
      dz.addEventListener('drop', function (e) {
        var files = e.dataTransfer && e.dataTransfer.files;
        if (!files || !files.length) return;
        try { cv.files = files; } catch (x) { return; }
        cvChanged();
      });
    }

    /* Error helpers */
    function describedBase(input) { return (input.getAttribute('data-base-desc') || ''); }
    function showFieldError(input, msg) {
      var id = input.id + '-error', e = document.getElementById(id);
      if (!e) { e = el('span', { id: id, class: 'error-text' }); input.closest('.field').appendChild(e); }
      e.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', (describedBase(input) + ' ' + id).trim());
    }
    function clearFieldError(input) {
      var e = document.getElementById(input.id + '-error'); if (e) e.remove();
      input.removeAttribute('aria-invalid');
      var base = describedBase(input); if (base) input.setAttribute('aria-describedby', base); else input.removeAttribute('aria-describedby');
    }
    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (i) {
      if (i.getAttribute('aria-describedby')) i.setAttribute('data-base-desc', i.getAttribute('aria-describedby'));
      i.addEventListener('input', function () { if (i.getAttribute('aria-invalid') === 'true') clearFieldError(i); });
      i.addEventListener('change', function () { if (i.getAttribute('aria-invalid') === 'true' && i.type !== 'file') clearFieldError(i); });
    });

    function validate() {
      var errs = [];
      function need(id, msg) {
        var i = form.querySelector('#' + id);
        if (!i) return;
        var bad = (i.type === 'checkbox') ? !i.checked : !String(i.value).trim();
        if (bad) errs.push({ input: i, msg: msg });
      }
      need('name', 'Enter your full name.');
      var email = form.querySelector('#email');
      if (!String(email.value).trim()) errs.push({ input: email, msg: 'Enter your email address.' });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) errs.push({ input: email, msg: 'Enter an email address in this format: name@example.com.' });
      if (kind === 'careers') need('position', 'Choose the position you are applying for.');
      if (kind === 'contact') need('reason', 'Choose the reason for your message.');
      var cin = form.querySelector('#country');
      if (!countryCombo.get()) errs.push({ input: cin, msg: 'Choose your country from the list.' });
      var din = form.querySelector('#calling-code');
      var phoneRaw = phoneInput ? phoneInput.value.trim() : '';
      if (kind === 'careers' || phoneRaw) {
        if (!dialCombo.get() && !(phoneRaw.charAt(0) === '+')) errs.push({ input: din, msg: 'Choose your international calling code from the list.' });
        if (!phoneRaw) errs.push({ input: phoneInput, msg: 'Enter your telephone number.' });
        else { var r = currentPhone(); if (r.error) errs.push({ input: phoneInput, msg: r.error }); }
      }
      var ext = form.querySelector('#extension');
      if (ext && ext.value && !/^[0-9#*,; ]{1,10}$/.test(ext.value)) errs.push({ input: ext, msg: 'Use digits only for the extension, up to 10 characters.' });
      var li = form.querySelector('#linkedin');
      if (li && li.value.trim() && !/^https?:\/\/([a-z0-9-]+\.)*linkedin\.com\/.+/i.test(li.value.trim())) errs.push({ input: li, msg: 'Enter a full LinkedIn address starting with https://' });
      if (kind === 'careers') {
        need('cover', 'Write a short introduction or cover message.');
        var f = cv.files && cv.files[0]; var prob = cvProblem(f);
        if (prob) errs.push({ input: cv, msg: prob });
      } else { need('message', 'Write your message.'); need('subject', 'Enter a subject.'); }
      need('privacy', 'Confirm that you have read the Privacy Policy.');
      return errs;
    }

    function setStatus(type, title, body) {
      statusBox.innerHTML = '';
      var b = el('div', { class: 'status-box ' + type });
      b.appendChild(el('strong', null, title));
      if (body) b.appendChild(el('span', null, body));
      statusBox.appendChild(b);
      statusBox.setAttribute('role', type === 'ok' ? 'status' : 'alert');
      statusBox.focus();
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      summaryBox.innerHTML = ''; statusBox.innerHTML = '';
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), clearFieldError);
      updatePreview();
      var errs = validate();
      if (errs.length) {
        errs.forEach(function (e) { showFieldError(e.input, e.msg); });
        var box = el('div', { class: 'error-summary', role: 'alert', tabindex: '-1' });
        box.appendChild(el('h2', null, 'Please fix ' + errs.length + (errs.length === 1 ? ' problem' : ' problems') + ' before sending'));
        var ul = el('ul');
        errs.forEach(function (e) {
          var li = el('li'); var a = el('a', { href: '#' + e.input.id }, e.msg);
          a.addEventListener('click', function (x) { x.preventDefault(); e.input.focus(); });
          li.appendChild(a); ul.appendChild(li);
        });
        box.appendChild(ul); summaryBox.appendChild(box); box.focus();
        return;
      }
      var hp = form.querySelector('input[name="_gotcha"]');
      if (hp && hp.value) { setStatus('ok', 'Thank you.', ' Your message has been received.'); return; }
      if (simulate) {
        /* Simulation mode (see js/config.js): the form is validated exactly as in production,
           but nothing is transmitted. */
        var picked = cv && cv.files && cv.files[0];
        var detail = {
          email: (form.querySelector('#email') || {}).value || '',
          position: posSel ? posSel.value : '',
          file: picked ? picked.name : '',
          size: picked ? fmtSize(picked.size) : ''
        };
        submitBtn.disabled = true; submitBtn.setAttribute('aria-busy', 'true');
        var label = submitBtn.textContent; submitBtn.textContent = 'Sending\u2026';
        var duration = kind === 'careers' ? Math.min(3200, 1400 + (picked ? picked.size / 1048576 * 500 : 0)) : 900;
        function finishSim() {
          form.reset(); countryCombo.reset(); dialCombo.reset(); setDefaultDial(); dialManual = false;
          if (cvInfo) cvInfo.textContent = ''; if (cvRemove) cvRemove.hidden = true; if (phonePreview) phonePreview.textContent = '';
          if (kind === 'careers') {
            setStatus('ok', 'Application received. Thank you.',
              ' We have your application' + (detail.position ? ' for ' + detail.position : '') + (detail.file ? ' and your CV (' + detail.file + ', ' + detail.size + ')' : '') + '. If your profile matches a position, we will contact you at ' + detail.email + '.');
          } else {
            setStatus('ok', 'Message received. Thank you.', ' We will reply to ' + detail.email + '.');
          }
          submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); submitBtn.textContent = label;
        }
        if (prog && kind === 'careers') {
          var bar = prog.querySelector('.progress-bar span'), lab = prog.querySelector('.progress-label'), t0 = Date.now();
          prog.hidden = false;
          (function tick() {
            var t = Math.min(1, (Date.now() - t0) / duration), pct = Math.round(100 * (1 - Math.pow(1 - t, 2)));
            prog.setAttribute('aria-valuenow', String(pct)); bar.style.width = pct + '%'; lab.textContent = 'Uploading your application\u2026 ' + pct + '%';
            if (t < 1) setTimeout(tick, 60); else { prog.hidden = true; finishSim(); }
          })();
        } else { setTimeout(finishSim, duration); }
        return;
      }
      if (!connected) {
        setStatus('fail', 'This form is not connected yet.', ' Nothing was sent. The site owner needs to connect a form service (see the README). Please try again later.');
        return;
      }
      var data = new FormData(form);
      if (hiddenE164 && hiddenE164.value) data.set('phone_e164', hiddenE164.value);
      var ext2 = form.querySelector('#extension'); if (ext2 && ext2.value) data.set('phone_extension', ext2.value);
      submitBtn.disabled = true; submitBtn.setAttribute('aria-busy', 'true');
      var original = submitBtn.textContent; submitBtn.textContent = 'Sending\u2026';
      fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok) {
            form.reset(); countryCombo.reset(); dialCombo.reset(); setDefaultDial(); dialManual = false; if (cvInfo) cvInfo.textContent = ''; if (phonePreview) phonePreview.textContent = '';
            setStatus('ok', kind === 'careers' ? 'Application received. Thank you.' : 'Message received. Thank you.',
              kind === 'careers' ? ' We have your application and CV. If your profile matches a position, we will contact you at the email address you gave.' : ' We will reply to the email address you gave.');
          } else {
            var detail = (res.body && res.body.errors && res.body.errors.map(function (e) { return e.message; }).join(' ')) || '';
            setStatus('fail', 'We could not send your ' + (kind === 'careers' ? 'application' : 'message') + '.', ' ' + (detail ? detail + ' ' : '') + 'Your details are still in the form. Please check them and try again, or try again later.');
          }
        })
        .catch(function () {
          setStatus('fail', 'We could not send your ' + (kind === 'careers' ? 'application' : 'message') + '.', ' There may be a problem with your internet connection. Your details are still in the form. Please try again.');
        })
        .then(function () { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); submitBtn.textContent = original; });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('form[data-kind]'), setupForm);
})();
