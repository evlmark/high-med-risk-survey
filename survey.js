(function () {
  const FORM_STORAGE_KEY = 'mediumRiskSurveyResults';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const blockQ1_1 = document.getElementById('block-q1_1');
  const blockQ4_1 = document.getElementById('block-q4_1');
  const form = document.getElementById('survey-form');

  // --- Q1: show Q1.1 only when at least one option is selected and it's not only "None of this"
  function updateQ1_1Visibility() {
    const checked = Array.from(form.querySelectorAll('input[name="q1"]:checked')).map((el) => el.value);
    const showQ1_1 = checked.length > 0 && !(checked.length === 1 && checked[0] === 'None of this');
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

  // --- Q3 / Q4.1: Add individual / Add company (with remove)
  function createEntityCard(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const isIndividual = type === 'individual';
    const title = isIndividual ? 'Individual' : 'Company';
    const html = document.createElement('div');
    html.className = 'entity-card';
    html.dataset.entityId = id;
    if (isIndividual) {
      html.innerHTML =
        '<div class="entity-card-header">' +
        '<h4>' + title + '</h4>' +
        '<button type="button" class="btn-remove-card" title="Remove">Remove</button>' +
        '</div>' +
        '<div class="fields">' +
        '<label>Full name <input type="text" name="' + containerId + '_' + id + '_fullName" required></label>' +
        '<label>RFC <input type="text" name="' + containerId + '_' + id + '_rfc" required></label>' +
        '<label>CURP <input type="text" name="' + containerId + '_' + id + '_curp" required></label>' +
        '</div>';
    } else {
      html.innerHTML =
        '<div class="entity-card-header">' +
        '<h4>' + title + '</h4>' +
        '<button type="button" class="btn-remove-card" title="Remove">Remove</button>' +
        '</div>' +
        '<div class="fields">' +
        '<label>Full legal name <input type="text" name="' + containerId + '_' + id + '_fullLegalName" required></label>' +
        '<label>RFC <input type="text" name="' + containerId + '_' + id + '_rfc" required></label>' +
        '</div>';
    }
    container.appendChild(html);
    html.querySelector('.btn-remove-card').addEventListener('click', function () { html.remove(); });
  }

  document.getElementById('q3-add-individual').addEventListener('click', function () {
    createEntityCard('individual', 'q3-entities');
  });
  document.getElementById('q3-add-company').addEventListener('click', function () {
    createEntityCard('company', 'q3-entities');
  });

  document.getElementById('q4_1-add-individual').addEventListener('click', function () {
    createEntityCard('individual', 'q4_1-entities');
  });
  document.getElementById('q4_1-add-company').addEventListener('click', function () {
    createEntityCard('company', 'q4_1-entities');
  });

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
      '<h4>UBO</h4>' +
      '<button type="button" class="btn-remove-card" title="Remove">Remove</button>' +
      '</div>' +
      '<div class="fields">' +
      '<label>UBO Full Name <input type="text" name="q6_' + id + '_name" required></label>' +
      '<div class="file-upload-wrap" data-wrap="' + id + '">' +
      '<label>UBO proof of address (document, max 10 MB) <input type="file" name="q6_' + id + '_file" accept="*" data-ubo-file required></label>' +
      '<div class="file-name" data-file-name></div>' +
      '<div class="file-error" data-file-error></div>' +
      '</div>' +
      '</div>';
    container.appendChild(wrap);
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
          errEl.textContent = 'File must be 10 MB or smaller.';
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

    window.getSignatureBase64 = function () {
      return hasStroke ? canvas.toDataURL('image/png') : null;
    };
    window.hasSignature = function () { return hasStroke; };
  })();

  // --- Collect Q3 entities
  function collectQ3() {
    const individuals = [];
    const companies = [];
    const container = document.getElementById('q3-entities');
    if (!container) return { individuals, companies };
    container.querySelectorAll('.entity-card').forEach(function (card) {
      const fullName = card.querySelector('input[name$="_fullName"]');
      const fullLegalName = card.querySelector('input[name$="_fullLegalName"]');
      const rfc = card.querySelector('input[name$="_rfc"]');
      const curp = card.querySelector('input[name$="_curp"]');
      if (fullName && rfc && curp) {
        individuals.push({
          fullName: fullName.value.trim(),
          rfc: rfc.value.trim(),
          curp: curp.value.trim()
        });
      } else if (fullLegalName && rfc) {
        companies.push({
          fullLegalName: fullLegalName.value.trim(),
          rfc: rfc.value.trim()
        });
      }
    });
    return { individuals, companies };
  }

  function collectQ4_1() {
    const individuals = [];
    const companies = [];
    const container = document.getElementById('q4_1-entities');
    if (!container) return { individuals, companies };
    container.querySelectorAll('.entity-card').forEach(function (card) {
      const fullName = card.querySelector('input[name$="_fullName"]');
      const fullLegalName = card.querySelector('input[name$="_fullLegalName"]');
      const rfc = card.querySelector('input[name$="_rfc"]');
      const curp = card.querySelector('input[name$="_curp"]');
      if (fullName && rfc && curp) {
        individuals.push({
          fullName: fullName.value.trim(),
          rfc: rfc.value.trim(),
          curp: curp.value.trim()
        });
      } else if (fullLegalName && rfc) {
        companies.push({
          fullLegalName: fullLegalName.value.trim(),
          rfc: rfc.value.trim()
        });
      }
    });
    return { individuals, companies };
  }

  function collectQ6() {
    const list = [];
    const container = document.getElementById('q6-entities');
    if (!container) return list;
    container.querySelectorAll('.entity-card').forEach(function (card) {
      const nameInput = card.querySelector('input[type="text"]');
      const fileInput = card.querySelector('input[type="file"]');
      if (!nameInput || !fileInput || !fileInput.files || !fileInput.files[0]) return;
      const file = fileInput.files[0];
      if (file.size > MAX_FILE_SIZE) return;
      const reader = new FileReader();
      reader.onload = function () { /* will collect after async */ };
      list.push({
        uboFullName: nameInput.value.trim(),
        fileInput: fileInput
      });
    });
    return list;
  }

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

    if (getSelectedValues('q1').length === 0) errors.push('Question 1: select at least one option.');
    if (blockQ1_1 && !blockQ1_1.hidden && !getSelectedValue('q1_1')) errors.push('Question 1.1: select one option.');
    if (!getSelectedValue('q2')) errors.push('Question 2: select Yes or No.');
    var q3 = collectQ3();
    if (q3.individuals.length === 0 && q3.companies.length === 0) errors.push('Question 3: add at least one provider (individual or company).');
    if (!getSelectedValue('q4')) errors.push('Question 4: select one option.');
    if (blockQ4_1 && !blockQ4_1.hidden) {
      var q4_1 = collectQ4_1();
      if (q4_1.individuals.length === 0 && q4_1.companies.length === 0) errors.push('Question 4.1: add at least one client (individual or company).');
    }
    var q5El = document.getElementById('q5');
    if (!q5El || !q5El.value.trim()) errors.push('Question 5: please explain your business model.');
    var q6Cards = document.getElementById('q6-entities');
    if (!q6Cards || q6Cards.querySelectorAll('.entity-card').length === 0) errors.push('Question 6: add at least one UBO with proof of address.');
    else {
      q6Cards.querySelectorAll('.entity-card').forEach(function (card) {
        var nameInput = card.querySelector('input[type="text"]');
        var fileInput = card.querySelector('input[type="file"]');
        if (!nameInput || !nameInput.value.trim()) errors.push('Question 6: UBO Full Name is required for each UBO.');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) errors.push('Question 6: proof of address file is required for each UBO.');
        else if (fileInput.files[0].size > MAX_FILE_SIZE) errors.push('Question 6: one of the files exceeds 10 MB.');
      });
    }
    if (!getSelectedValue('q7')) errors.push('Question 7: select Yes or No.');
    if (!getSelectedValue('q8')) errors.push('Question 8: select Yes or No.');
    if (typeof window.hasSignature !== 'function' || !window.hasSignature()) errors.push('Please add your signature.');

    return errors;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errs = validate();
    var errEl = form.querySelector('.form-actions .error-message');
    if (errEl) errEl.remove();
    if (errs.length > 0) {
      var msg = document.createElement('p');
      msg.className = 'error-message';
      msg.textContent = errs.join(' ');
      form.querySelector('.form-actions').prepend(msg);
      return;
    }

    var q6Promises = [];
    document.getElementById('q6-entities').querySelectorAll('.entity-card').forEach(function (card) {
      var nameInput = card.querySelector('input[type="text"]');
      var fileInput = card.querySelector('input[type="file"]');
      if (!nameInput || !fileInput || !fileInput.files || !fileInput.files[0]) return;
      var name = nameInput.value.trim();
      q6Promises.push(
        readFileAsBase64(fileInput.files[0]).then(function (obj) {
          return {
            uboFullName: name,
            fileName: obj.fileName,
            fileBase64: obj.base64,
            mimeType: obj.mimeType
          };
        })
      );
    });

    Promise.all(q6Promises).then(function (q6List) {
      var signatureDataUrl = typeof window.getSignatureBase64 === 'function' ? window.getSignatureBase64() : null;
      var payload = {
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
      try {
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        if (err.name === 'QuotaExceededError') {
          var msg = document.createElement('p');
          msg.className = 'error-message';
          msg.textContent = 'Data is too large to save (e.g. files). Try smaller files.';
          form.querySelector('.form-actions').prepend(msg);
          return;
        }
        throw err;
      }
      window.location.href = 'results-medium.html';
    });
  });
})();
