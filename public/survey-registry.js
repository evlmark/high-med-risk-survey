// Shared logic for the two registered-company surveys. Both forms are identical
// apart from question 3 (Padrón registration vs. filed Vulnerable Activity notices),
// so the survey type is read off the form and only travels with the payload.
(function () {
  const form = document.getElementById('survey-form');
  if (!form) return;

  const SURVEY_TYPE = form.dataset.surveyType === 'existing_company' ? 'existing_company' : 'new_company';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — the server enforces the same cap

  function t(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }
  function retranslate(el) { if (window.I18N && window.I18N.applyTranslations) window.I18N.applyTranslations(el); }

  // --- Uploads: show the chosen name, reject anything over the limit
  function wireUpload(wrapId) {
    const wrapEl = document.getElementById(wrapId);
    if (!wrapEl) return;
    const input = wrapEl.querySelector('input[type="file"]');
    const nameEl = wrapEl.querySelector('[data-file-name]');
    const errEl = wrapEl.querySelector('[data-file-error]');
    input.addEventListener('change', function () {
      errEl.textContent = '';
      nameEl.textContent = '';
      wrapEl.classList.remove('has-file');
      if (input.files && input.files[0]) {
        const f = input.files[0];
        if (f.size > MAX_FILE_SIZE) {
          errEl.textContent = t('file.tooBig');
          input.value = '';
          return;
        }
        nameEl.textContent = f.name;
        wrapEl.classList.add('has-file');
      }
    });
  }
  wireUpload('doc3-wrap');
  wireUpload('tax-wrap');
  wireUpload('compliance-wrap');

  // --- Q6: the free-text box only belongs to "Other (specify)"
  const fundsOtherWrap = document.getElementById('funds-other-wrap');
  function updateFundsOther() {
    const selected = form.querySelector('input[name="funds"]:checked');
    const isOther = !!selected && selected.value === 'Other (specify)';
    if (!fundsOtherWrap) return;
    fundsOtherWrap.hidden = !isOther;
    if (!isOther) {
      const input = document.getElementById('funds-other');
      if (input) input.value = '';
    }
  }
  form.querySelectorAll('input[name="funds"]').forEach(function (input) {
    input.addEventListener('change', updateFundsOther);
  });
  updateFundsOther();

  // --- Q7: UBO cards. These are the first six fields of the High Risk UBO block,
  // reusing its i18n keys so the wording stays identical across surveys.
  function addUBOBlock() {
    const container = document.getElementById('ubo-entities');
    if (!container) return;
    const id = 'ubo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const card = document.createElement('div');
    card.className = 'entity-card entity-card-ubo-high';
    card.dataset.uboId = id;
    card.innerHTML =
      '<div class="entity-card-header">' +
      '<h4 data-i18n="entity.ubo"></h4>' +
      '<button type="button" class="btn-remove-card" data-i18n="btn.remove"></button>' +
      '</div>' +
      '<div class="fields">' +
      '<label><span data-i18n="field.uboName"></span> <input type="text" name="ubo_' + id + '_name" required></label>' +
      '<label><span data-i18n="field.ownershipPct"></span> <input type="text" name="ubo_' + id + '_ownership" required></label>' +
      '<label><span data-i18n="field.uboPosition"></span> <input type="text" name="ubo_' + id + '_position"></label>' +
      '<label><span data-i18n="field.uboExpertise"></span> <textarea name="ubo_' + id + '_expertise" rows="4" required></textarea></label>' +
      '<label><span data-i18n="field.uboRole"></span> <textarea name="ubo_' + id + '_role" rows="4" required></textarea></label>' +
      '<label><span data-i18n="field.uboDecisions"></span> <textarea name="ubo_' + id + '_decisions" rows="3" required></textarea></label>' +
      '</div>';
    container.appendChild(card);
    retranslate(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });
  }
  document.getElementById('ubo-add').addEventListener('click', addUBOBlock);

  // --- Signature canvas (same as the Medium/High surveys)
  (function () {
    const canvas = document.getElementById('signature-canvas');
    const placeholder = document.getElementById('signature-placeholder');
    const removeBtn = document.getElementById('remove-signature-btn');
    if (!canvas || !removeBtn) return;

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
      var pos = getCoord(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      hasStroke = true;
      if (placeholder) placeholder.style.visibility = 'hidden';
    }
    function move(e) {
      e.preventDefault();
      if (!drawing) return;
      var pos = getCoord(e);
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

    window.getSignatureBase64 = function () { return hasStroke ? canvas.toDataURL('image/png') : null; };
    window.hasSignature = function () { return hasStroke; };
  })();

  // --- Collect
  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const dataUrl = reader.result;
        const base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
        resolve({ base64: base64, fileName: file.name, mimeType: file.type || 'application/octet-stream' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function fileOf(inputId) {
    const el = document.getElementById(inputId);
    return (el && el.files && el.files[0]) ? el.files[0] : null;
  }
  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function getSelectedValue(name) {
    const el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function collectUBOs() {
    const out = [];
    const container = document.getElementById('ubo-entities');
    if (!container) return out;
    container.querySelectorAll('.entity-card').forEach(function (card) {
      const pick = function (suffix) {
        const el = card.querySelector('[name$="_' + suffix + '"]');
        return el ? el.value.trim() : '';
      };
      out.push({
        uboFullName: pick('name'),
        ownershipPercentage: pick('ownership'),
        positionOrTitle: pick('position'),
        expertise: pick('expertise'),
        roleAndResponsibilities: pick('role'),
        decisionsFunds: pick('decisions'),
      });
    });
    return out;
  }

  function validate() {
    const errors = [];

    if (!val('legalRepName')) errors.push(t('err.legalRep'));
    if (!val('companyName')) errors.push(t('err.companyName'));

    const doc3 = fileOf('doc3-file');
    if (!doc3) errors.push(t('err.reg.doc3'));
    else if (doc3.size > MAX_FILE_SIZE) errors.push(t('file.tooBig'));

    const tax = fileOf('tax-file');
    if (!tax) errors.push(t('err.reg.tax'));
    else if (tax.size > MAX_FILE_SIZE) errors.push(t('file.tooBig'));

    // Question 5 is optional — only the size still has to hold.
    const compliance = fileOf('compliance-file');
    if (compliance && compliance.size > MAX_FILE_SIZE) errors.push(t('file.tooBig'));

    const funds = getSelectedValue('funds');
    if (!funds) errors.push(t('err.reg.funds'));
    else if (funds === 'Other (specify)' && !val('funds-other')) errors.push(t('err.reg.fundsOther'));

    const ubos = collectUBOs();
    if (!ubos.length) errors.push(t('err.reg.ubo'));
    else {
      // "Position or title" is explicitly "(if any)", so it stays optional.
      const incomplete = ubos.some(function (u) {
        return !u.uboFullName || !u.ownershipPercentage || !u.expertise ||
          !u.roleAndResponsibilities || !u.decisionsFunds;
      });
      if (incomplete) errors.push(t('err.reg.uboFields'));
    }

    if (!val('ticket')) errors.push(t('err.reg.ticket'));

    if (!getSelectedValue('oath')) errors.push(t('err.reg.oath'));
    if (!getSelectedValue('pep')) errors.push(t('err.reg.pep'));
    if (typeof window.hasSignature !== 'function' || !window.hasSignature()) errors.push(t('err.signature'));

    return errors.filter(function (e, i) { return errors.indexOf(e) === i; });
  }

  function showError(text) {
    const existing = form.querySelector('.form-actions .error-message');
    if (existing) existing.remove();
    const msg = document.createElement('p');
    msg.className = 'error-message';
    msg.textContent = text;
    form.querySelector('.form-actions').prepend(msg);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const errs = validate();
    const existing = form.querySelector('.form-actions .error-message');
    if (existing) existing.remove();
    if (errs.length > 0) { showError(errs.join(' ')); return; }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('btn.saving'); }

    // Read the three documents in a fixed order so the payload never depends on
    // which FileReader happens to finish first.
    const reads = [
      readFileAsBase64(fileOf('doc3-file')),
      readFileAsBase64(fileOf('tax-file')),
      fileOf('compliance-file') ? readFileAsBase64(fileOf('compliance-file')) : Promise.resolve(null),
    ];

    Promise.all(reads).then(function (files) {
      const doc = function (f) {
        return f ? { fileName: f.fileName, fileBase64: f.base64, mimeType: f.mimeType } : null;
      };
      const funds = getSelectedValue('funds');
      const answers = {
        legalRepName: val('legalRepName'),
        companyName: val('companyName'),
        registrationProof: doc(files[0]),
        taxOpinion: doc(files[1]),
        complianceProgram: doc(files[2]),
        fundsOrigin: funds,
        fundsOriginOther: funds === 'Other (specify)' ? val('funds-other') : '',
        ubos: collectUBOs(),
        averageTicket: val('ticket'),
        declarationOath: getSelectedValue('oath'),
        declarationPep: getSelectedValue('pep'),
        signature: typeof window.getSignatureBase64 === 'function' ? window.getSignatureBase64() : null,
      };
      const lang = (window.I18N && window.I18N.getLang) ? window.I18N.getLang() : 'es';
      return fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyType: SURVEY_TYPE, language: lang, answers: answers }),
      });
    }).then(function (res) {
      if (!res || !res.ok) throw new Error('submit failed');
      return res.json();
    }).then(function () {
      window.location.replace('success.html');
    }).catch(function () {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = t('btn.submit'); }
      showError(t('err.network'));
    });
  });
})();
