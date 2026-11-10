// Shared by the EDD questionnaires: Basic, Advanced and the combined Basic + Advanced
// page. Each questionnaire's own questions live in a "part" (window.EDD_PARTS.*,
// defined in survey-basic-edd.js / survey-edd.js); this file owns what every page
// has once — legal representative, company name, oath, PEP, signature — and submit.
//
// A part is { validate(): string[], collect(): object | Promise<object> }. collect()
// may reject with an Error carrying `userMessage` to show the respondent.
(function () {
  function t(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }
  function lang() { return (window.I18N && window.I18N.getLang) ? window.I18N.getLang() : 'es'; }
  function retranslate(el) { if (window.I18N && window.I18N.applyTranslations) window.I18N.applyTranslations(el); }

  // Error texts start with "Pregunta 4: …" / "Question 4: …". On the combined page
  // the same question has another number, so `map` ({ '4': '13' }) rewrites it.
  function renumber(text, map) {
    if (!map) return text;
    return String(text).replace(/^(\S+ )(\d+(?:\.\d+)?)(:)/, function (m, word, n, colon) {
      return map[n] ? word + map[n] + colon : m;
    });
  }

  function initSignature() {
    const canvas = document.getElementById('signature-canvas');
    const placeholder = document.getElementById('signature-placeholder');
    const removeBtn = document.getElementById('remove-signature-btn');
    if (!canvas || !removeBtn) return { has: function () { return false; }, data: function () { return null; } };

    const ctx = canvas.getContext('2d');
    let drawing = false;
    let hasStroke = false;

    function setCanvasSize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
    function clearSignature() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasStroke = false;
      if (placeholder) placeholder.style.visibility = '';
    }
    function getCoord(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function start(e) {
      e.preventDefault();
      drawing = true;
      const pos = getCoord(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      hasStroke = true;
      if (placeholder) placeholder.style.visibility = 'hidden';
    }
    function move(e) {
      e.preventDefault();
      if (!drawing) return;
      const pos = getCoord(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    function end(e) {
      e.preventDefault();
      drawing = false;
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });

    removeBtn.addEventListener('click', clearSignature);
    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();

    return {
      has: function () { return hasStroke; },
      data: function () { return hasStroke ? canvas.toDataURL('image/png') : null; },
    };
  }

  // opts: { oathErr, pepErr } i18n keys for the declaration errors, and an optional
  // declMap to renumber them.
  function run(form, surveyType, parts, opts) {
    opts = opts || {};
    const signature = initSignature();

    function val(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }
    function radio(name) {
      const el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }
    function showError(text) {
      const existing = form.querySelector('.form-actions .error-message');
      if (existing) existing.remove();
      if (!text) return;
      const msg = document.createElement('p');
      msg.className = 'error-message';
      msg.textContent = text;
      form.querySelector('.form-actions').prepend(msg);
    }
    function validate() {
      let errors = [];
      if (!val('legalRepName')) errors.push(t('err.legalRep'));
      if (!val('companyName')) errors.push(t('err.companyName'));
      parts.forEach(function (p) { errors = errors.concat(p.validate()); });
      if (!radio('oath')) errors.push(renumber(t(opts.oathErr), opts.declMap));
      if (!radio('pep')) errors.push(renumber(t(opts.pepErr), opts.declMap));
      if (!signature.has()) errors.push(t('err.signature'));
      return errors.filter(function (e, i) { return errors.indexOf(e) === i; });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const errs = validate();
      if (errs.length > 0) { showError(errs.join(' ')); return; }
      showError('');

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('btn.saving'); }

      Promise.all(parts.map(function (p) { return p.collect(); })).then(function (results) {
        const answers = { legalRepName: val('legalRepName'), companyName: val('companyName') };
        results.forEach(function (r) { Object.assign(answers, r); });
        answers.declarationOath = radio('oath');
        answers.declarationPep = radio('pep');
        answers.signature = signature.data();
        return fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surveyType: surveyType, language: lang(), answers: answers }),
        });
      }).then(function (res) {
        if (!res || !res.ok) throw new Error('submit failed');
        window.location.replace('success.html');
      }).catch(function (err) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = t('btn.submit'); }
        showError((err && err.userMessage) || t('err.network'));
      });
    });
  }

  window.EDD_PARTS = window.EDD_PARTS || {};
  window.EDD = { t: t, lang: lang, retranslate: retranslate, renumber: renumber, run: run };
})();
