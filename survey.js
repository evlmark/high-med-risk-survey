(function () {
  const SURVEY_TYPE = 'medium';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const blockQ1_1 = document.getElementById('block-q1_1');
  const blockQ4_1 = document.getElementById('block-q4_1');
  const form = document.getElementById('survey-form');

  function t(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }
  function retranslate(el) { if (window.I18N && window.I18N.applyTranslations) window.I18N.applyTranslations(el); }

  // --- Q1: show Q1.1 only when at least one option is selected and it's not only "None of the above"
  function updateQ1_1Visibility() {
    const checked = Array.from(form.querySelectorAll('input[name="q1"]:checked')).map((el) => el.value);
    const showQ1_1 = checked.length > 0 && !(checked.length === 1 && checked[0] === 'None of the above');
    if (blockQ1_1) blockQ1_1.hidden = !showQ1_1;
  }
  form.querySelectorAll('input[name="q1"]').forEach(function (input) {
    input.addEventListener('change', updateQ1_1Visibility);
  });
  updateQ1_1Visibility();

  // --- Q4: show Q4.1 if option 2 or 3 (index 1 or 2)
  function updateQ4_1Visibility() {
    const selected = form.querySelector('input[name="q4"]:checked');
    const options = Array.from(form.querySelectorAll('input[name="q4"]'));
    const idx = selected ? options.indexOf(selected) : -1;
    if (blockQ4_1) blockQ4_1.hidden = idx !== 1 && idx !== 2;
  }
  form.querySelectorAll('input[name="q4"]').forEach(function (input) {
    input.addEventListener('change', updateQ4_1Visibility);
  });
  updateQ4_1Visibility();

  // --- Q3 / Q4.1: Add individual / Add company (with remove). Labels are i18n keys; input
  // name/value attributes stay canonical so stored data is language-independent.
  function createEntityCard(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const isIndividual = type === 'individual';
    const titleKey = isIndividual ? 'entity.individual' : 'entity.company';
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.dataset.entityId = id;
    if (isIndividual) {
      card.innerHTML =
        '<div class="entity-card-header">' +
        '<h4 data-i18n="' + titleKey + '"></h4>' +
        '<button type="button" class="btn-remove-card" data-i18n="btn.remove"></button>' +
        '</div>' +
        '<div class="fields">' +
        '<label><span data-i18n="field.fullName"></span> <input type="text" name="' + containerId + '_' + id + '_fullName" required></label>' +
        '<label><span data-i18n="field.rfc"></span> <input type="text" name="' + containerId + '_' + id + '_rfc" required></label>' +
        '<label><span data-i18n="field.curp"></span> <input type="text" name="' + containerId + '_' + id + '_curp" required></label>' +
        '</div>';
    } else {
      card.innerHTML =
        '<div class="entity-card-header">' +
        '<h4 data-i18n="' + titleKey + '"></h4>' +
        '<button type="button" class="btn-remove-card" data-i18n="btn.remove"></button>' +
        '</div>' +
        '<div class="fields">' +
        '<label><span data-i18n="field.fullLegalName"></span> <input type="text" name="' + containerId + '_' + id + '_fullLegalName" required></label>' +
        '<label><span data-i18n="field.rfc"></span> <input type="text" name="' + containerId + '_' + id + '_rfc" required></label>' +
        '</div>';
    }
    container.appendChild(card);
    retranslate(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });
  }

  document.getElementById('q3-add-individual').addEventListener('click', function () { createEntityCard('individual', 'q3-entities'); });
  document.getElementById('q3-add-company').addEventListener('click', function () { createEntityCard('company', 'q3-entities'); });
  document.getElementById('q4_1-add-individual').addEventListener('click', function () { createEntityCard('individual', 'q4_1-entities'); });
  document.getElementById('q4_1-add-company').addEventListener('click', function () { createEntityCard('company', 'q4_1-entities'); });

  // --- Q6: Add UBO (name + file upload, with remove)
  function addUBOBlock() {
    const container = document.getElementById('q6-entities');
    if (!container) return;
    const id = 'ubo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const wrap = document.createElement('div');
    wrap.className = 'entity-card';
    wrap.dataset.uboId = id;
    wrap.innerHTML =
      '<div class="entity-card-header">' +
      '<h4 data-i18n="entity.ubo"></h4>' +
      '<button type="button" class="btn-remove-card" data-i18n="btn.remove"></button>' +
      '</div>' +
      '<div class="fields">' +
      '<label><span data-i18n="field.uboName"></span> <input type="text" name="q6_' + id + '_name" required></label>' +
      '<div class="file-upload-wrap" data-wrap="' + id + '">' +
      '<label><span data-i18n="field.uboProof"></span> <input type="file" name="q6_' + id + '_file" accept="*" data-ubo-file required></label>' +
      '<div class="file-name" data-file-name></div>' +
      '<div class="file-error" data-file-error></div>' +
      '</div>' +
      '</div>';
    container.appendChild(wrap);
    retranslate(wrap);
    wrap.querySelector('.btn-remove-card').addEventListener('click', function () { wrap.remove(); });

    const fileInput = wrap.querySelector('input[type="file"]');
    const nameEl = wrap.querySelector('[data-file-name]');
    const errEl = wrap.querySelector('[data-file-error]');
    const wrapEl = wrap.querySelector('.file-upload-wrap');

    fileInput.addEventListener('change', function () {
      errEl.textContent = '';
      nameEl.textContent = '';
      wrapEl.classList.remove('has-file');
      if (fileInput.files && fileInput.files[0]) {
        const f = fileInput.files[0];
        if (f.size > MAX_FILE_SIZE) {
          errEl.textContent = t('file.tooBig');
          fileInput.value = '';
          return;
        }
        nameEl.textContent = f.name;
        wrapEl.classList.add('has-file');
      }
    });
  }

  document.getElementById('q6-add-ubo').addEventListener('click', addUBOBlock);

  // --- Signature canvas
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

  // --- Collect Q3 / Q4.1 entities
  function collectEntities(containerId) {
    const individuals = [];
    const companies = [];
    const container = document.getElementById(containerId);
    if (!container) return { individuals, companies };
    container.querySelectorAll('.entity-card').forEach(function (card) {
      const fullName = card.querySelector('input[name$="_fullName"]');
      const fullLegalName = card.querySelector('input[name$="_fullLegalName"]');
      const rfc = card.querySelector('input[name$="_rfc"]');
      const curp = card.querySelector('input[name$="_curp"]');
      if (fullName && rfc && curp) {
        individuals.push({ fullName: fullName.value.trim(), rfc: rfc.value.trim(), curp: curp.value.trim() });
      } else if (fullLegalName && rfc) {
        companies.push({ fullLegalName: fullLegalName.value.trim(), rfc: rfc.value.trim() });
      }
    });
    return { individuals, companies };
  }
  function collectQ3() { return collectEntities('q3-entities'); }
  function collectQ4_1() { return collectEntities('q4_1-entities'); }

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

  function getSelectedValues(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (el) { return el.value; });
  }
  function getSelectedValue(name) {
    const el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function validate() {
    const errors = [];

    var legalRep = document.getElementById('legalRepName');
    if (!legalRep || !legalRep.value.trim()) errors.push(t('err.legalRep'));
    var company = document.getElementById('companyName');
    if (!company || !company.value.trim()) errors.push(t('err.companyName'));
    var emailEl = document.getElementById('email');
    if (!emailEl || !EMAIL_RE.test(emailEl.value.trim())) errors.push(t('err.email'));

    if (getSelectedValues('q1').length === 0) errors.push(t('err.q1'));
    if (blockQ1_1 && !blockQ1_1.hidden && !getSelectedValue('q1_1')) errors.push(t('err.q1_1'));
    if (!getSelectedValue('q2')) errors.push(t('err.q2'));
    var q3 = collectQ3();
    if (q3.individuals.length === 0 && q3.companies.length === 0) errors.push(t('err.q3'));
    if (!getSelectedValue('q4')) errors.push(t('err.q4'));
    if (blockQ4_1 && !blockQ4_1.hidden) {
      var q4_1 = collectQ4_1();
      if (q4_1.individuals.length === 0 && q4_1.companies.length === 0) errors.push(t('err.q4_1'));
    }
    var q5El = document.getElementById('q5');
    if (!q5El || !q5El.value.trim()) errors.push(t('err.q5'));
    var q6Cards = document.getElementById('q6-entities');
    if (!q6Cards || q6Cards.querySelectorAll('.entity-card').length === 0) errors.push(t('err.q6'));
    else {
      q6Cards.querySelectorAll('.entity-card').forEach(function (card) {
        var nameInput = card.querySelector('input[type="text"]');
        var fileInput = card.querySelector('input[type="file"]');
        if (!nameInput || !nameInput.value.trim()) errors.push(t('err.q6.uboName'));
        if (!fileInput || !fileInput.files || !fileInput.files[0]) errors.push(t('err.q6.file'));
        else if (fileInput.files[0].size > MAX_FILE_SIZE) errors.push(t('err.q6.fileBig'));
      });
    }
    if (!getSelectedValue('q7')) errors.push(t('err.q7'));
    if (!getSelectedValue('q8')) errors.push(t('err.q8'));
    if (typeof window.hasSignature !== 'function' || !window.hasSignature()) errors.push(t('err.signature'));

    return errors;
  }

  function showError(text) {
    var errEl = form.querySelector('.form-actions .error-message');
    if (errEl) errEl.remove();
    var msg = document.createElement('p');
    msg.className = 'error-message';
    msg.textContent = text;
    form.querySelector('.form-actions').prepend(msg);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errs = validate();
    var existing = form.querySelector('.form-actions .error-message');
    if (existing) existing.remove();
    if (errs.length > 0) {
      showError(errs.join(' '));
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('btn.saving'); }

    var q6Promises = [];
    document.getElementById('q6-entities').querySelectorAll('.entity-card').forEach(function (card) {
      var nameInput = card.querySelector('input[type="text"]');
      var fileInput = card.querySelector('input[type="file"]');
      if (!nameInput || !fileInput || !fileInput.files || !fileInput.files[0]) return;
      var name = nameInput.value.trim();
      q6Promises.push(
        readFileAsBase64(fileInput.files[0]).then(function (obj) {
          return { uboFullName: name, fileName: obj.fileName, fileBase64: obj.base64, mimeType: obj.mimeType };
        })
      );
    });

    Promise.all(q6Promises).then(function (q6List) {
      var signatureDataUrl = typeof window.getSignatureBase64 === 'function' ? window.getSignatureBase64() : null;
      var answers = {
        legalRepName: document.getElementById('legalRepName').value.trim(),
        companyName: document.getElementById('companyName').value.trim(),
        email: document.getElementById('email').value.trim(),
        q1: getSelectedValues('q1'),
        q1_1: blockQ1_1 && !blockQ1_1.hidden ? getSelectedValue('q1_1') : null,
        q2: getSelectedValue('q2'),
        q3: collectQ3(),
        q4: getSelectedValue('q4'),
        q4_1: blockQ4_1 && !blockQ4_1.hidden ? collectQ4_1() : null,
        q5: document.getElementById('q5').value.trim(),
        q6: q6List,
        q7: getSelectedValue('q7'),
        q8: getSelectedValue('q8'),
        signature: signatureDataUrl
      };
      var lang = (window.I18N && window.I18N.getLang) ? window.I18N.getLang() : 'es';
      return fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyType: SURVEY_TYPE, language: lang, answers: answers })
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
