(function () {
  const SURVEY_TYPE = 'high';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const blockQ1_1 = document.getElementById('block-q1_1');
  const blockQ4_1 = document.getElementById('block-q4_1');
  const form = document.getElementById('survey-form');

  function t(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }
  function retranslate(el) { if (window.I18N && window.I18N.applyTranslations) window.I18N.applyTranslations(el); }

  // --- Q1 / Q4 visibility (same as medium)
  function updateQ1_1Visibility() {
    const checked = Array.from(form.querySelectorAll('input[name="q1"]:checked')).map(function (el) { return el.value; });
    const showQ1_1 = checked.length > 0 && !(checked.length === 1 && checked[0] === 'None of the above');
    if (blockQ1_1) blockQ1_1.hidden = !showQ1_1;
  }
  form.querySelectorAll('input[name="q1"]').forEach(function (input) {
    input.addEventListener('change', updateQ1_1Visibility);
  });
  updateQ1_1Visibility();

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

  // --- Q3 / Q4.1 entity cards
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
        '<div class="entity-card-header"><h4 data-i18n="' + titleKey + '"></h4><button type="button" class="btn-remove-card" data-i18n="btn.remove"></button></div>' +
        '<div class="fields">' +
        '<label><span data-i18n="field.fullName"></span> <input type="text" name="' + containerId + '_' + id + '_fullName" required></label>' +
        '<label><span data-i18n="field.rfc"></span> <input type="text" name="' + containerId + '_' + id + '_rfc" required></label>' +
        '<label><span data-i18n="field.curp"></span> <input type="text" name="' + containerId + '_' + id + '_curp" required></label></div>';
    } else {
      card.innerHTML =
        '<div class="entity-card-header"><h4 data-i18n="' + titleKey + '"></h4><button type="button" class="btn-remove-card" data-i18n="btn.remove"></button></div>' +
        '<div class="fields">' +
        '<label><span data-i18n="field.fullLegalName"></span> <input type="text" name="' + containerId + '_' + id + '_fullLegalName" required></label>' +
        '<label><span data-i18n="field.rfc"></span> <input type="text" name="' + containerId + '_' + id + '_rfc" required></label></div>';
    }
    container.appendChild(card);
    retranslate(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });
  }
  document.getElementById('q3-add-individual').addEventListener('click', function () { createEntityCard('individual', 'q3-entities'); });
  document.getElementById('q3-add-company').addEventListener('click', function () { createEntityCard('company', 'q3-entities'); });
  document.getElementById('q4_1-add-individual').addEventListener('click', function () { createEntityCard('individual', 'q4_1-entities'); });
  document.getElementById('q4_1-add-company').addEventListener('click', function () { createEntityCard('company', 'q4_1-entities'); });

  // --- Q5.1 Directors (min 1 general director OR min 2 members of board)
  function addDirector(type) {
    const container = document.getElementById('q5_1-entities');
    if (!container) return;
    const id = 'dir_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const titleKey = type === 'general_director' ? 'entity.generalDirector' : 'entity.boardMember';
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.dataset.directorType = type;
    card.dataset.entityId = id;
    card.innerHTML =
      '<div class="entity-card-header"><h4 data-i18n="' + titleKey + '"></h4><button type="button" class="btn-remove-card" data-i18n="btn.remove"></button></div>' +
      '<div class="fields">' +
      '<label><span data-i18n="field.fullName"></span> <input type="text" name="q5_1_' + id + '_fullName" required></label>' +
      '<label><span data-i18n="field.dob"></span> <input type="text" name="q5_1_' + id + '_dob" placeholder="DD - MM - YYYY" required></label>' +
      '<label><span data-i18n="field.country"></span> <input type="text" name="q5_1_' + id + '_country" required></label>' +
      '<p class="entity-card-upload-title" data-i18n="field.officialIdTitle"></p>' +
      '<div class="file-upload-wrap"><label><span data-i18n="field.officialId"></span> <input type="file" name="q5_1_' + id + '_file" accept="*" required></label>' +
      '<div class="file-name" data-file-name></div><div class="file-error" data-file-error></div></div></div>';
    container.appendChild(card);
    retranslate(card);
    const fileInput = card.querySelector('input[type="file"]');
    const nameEl = card.querySelector('[data-file-name]');
    const errEl = card.querySelector('[data-file-error]');
    const wrapEl = card.querySelector('.file-upload-wrap');
    fileInput.addEventListener('change', function () {
      errEl.textContent = '';
      nameEl.textContent = '';
      wrapEl.classList.remove('has-file');
      if (fileInput.files && fileInput.files[0]) {
        var f = fileInput.files[0];
        if (f.size > MAX_FILE_SIZE) { errEl.textContent = t('file.tooBig'); fileInput.value = ''; return; }
        nameEl.textContent = f.name;
        wrapEl.classList.add('has-file');
      }
    });
  }
  var q5_1Container = document.getElementById('q5_1-entities');
  if (q5_1Container) {
    q5_1Container.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.btn-remove-card');
      if (!btn) return;
      var card = btn.closest('.entity-card');
      if (card && card.parentNode) card.parentNode.removeChild(card);
    });
  }
  document.getElementById('q5_1-add-director').addEventListener('click', function () { addDirector('general_director'); });
  document.getElementById('q5_1-add-board').addEventListener('click', function () { addDirector('member_of_board'); });

  // --- Q5.2 Shareholders (min 1)
  function addShareholder() {
    const container = document.getElementById('q5_2-entities');
    if (!container) return;
    const id = 'shr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.dataset.entityId = id;
    card.innerHTML =
      '<div class="entity-card-header"><h4 data-i18n="entity.shareholder"></h4><button type="button" class="btn-remove-card" data-i18n="btn.remove"></button></div>' +
      '<div class="fields">' +
      '<label><span data-i18n="field.fullName"></span> <input type="text" name="q5_2_' + id + '_fullName" required></label>' +
      '<label><span data-i18n="field.curpIf"></span> <input type="text" name="q5_2_' + id + '_curp"></label>' +
      '<label><span data-i18n="field.rfcIf"></span> <input type="text" name="q5_2_' + id + '_rfc"></label>' +
      '<label><span data-i18n="field.taxNumber"></span> <input type="text" name="q5_2_' + id + '_taxNumber"></label>' +
      '<label><span data-i18n="field.ownershipPct"></span> <input type="text" name="q5_2_' + id + '_shares" required></label></div>';
    container.appendChild(card);
    retranslate(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });
  }
  document.getElementById('q5_2-add-shareholder').addEventListener('click', addShareholder);

  // --- Q6 High Risk: one UBO block with all fields and conditionals.
  // Canonical English values are kept on inputs; only labels carry data-i18n keys.
  var SOURCE_OPTIONS = [
    { value: 'Salary/bonuses (employment)', key: 'q6.source.opt.1' },
    { value: 'Business profits/dividends from another company', key: 'q6.source.opt.2' },
    { value: 'Sale of a business / shares', key: 'q6.source.opt.3' },
    { value: 'Sale of real estate or other asset', key: 'q6.source.opt.4' },
    { value: 'Inheritance', key: 'q6.source.opt.5' },
    { value: 'Investment returns (securities/funds/crypto/other)', key: 'q6.source.opt.6' },
    { value: 'Loan (bank or third party)', key: 'q6.source.opt.7' },
    { value: 'Other (specify)', key: 'q6.source.opt.8' }
  ];
  function addUBOHighBlock() {
    const container = document.getElementById('q6-entities');
    if (!container) return;
    const id = 'ubo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const card = document.createElement('div');
    card.className = 'entity-card entity-card-ubo-high';
    card.dataset.uboId = id;

    var amountRadios = '<div class="options options-radio" data-amount-radios>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="Less than $50,000.00 MXN (specify)"><span class="option-label" data-i18n="q6.amount.opt.1"></span></label>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="Between $50,001.00 - $100,000.00 MXN"><span class="option-label" data-i18n="q6.amount.opt.2"></span></label>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="Between $100,001.00 - $150,000.00 MXN"><span class="option-label" data-i18n="q6.amount.opt.3"></span></label>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="More than $150,000.00 (specify)"><span class="option-label" data-i18n="q6.amount.opt.4"></span></label>' +
      '</div><div class="q6-cond-amount-specify conditional-field" hidden><label><span data-i18n="q6.specify"></span> <input type="text" name="q6_' + id + '_amount_specify" data-i18n-ph="q6.amount.specify.ph"></label></div>';

    var howLongRadios = '<div class="options options-radio" data-howlong-radios>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="Between 1 month and less than a year"><span class="option-label" data-i18n="q6.howlong.opt.1"></span></label>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="Between 1 and 2 years"><span class="option-label" data-i18n="q6.howlong.opt.2"></span></label>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="Between 2 and 5 years"><span class="option-label" data-i18n="q6.howlong.opt.3"></span></label>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="More than 5 years (specify)"><span class="option-label" data-i18n="q6.howlong.opt.4"></span></label>' +
      '</div><div class="q6-cond-howlong-specify conditional-field" hidden><label><span data-i18n="q6.howlong.specify"></span> <input type="text" name="q6_' + id + '_howlong_specify"></label></div>';

    var sourceCheckboxes = '<div class="options options-checkbox" data-source-options>';
    SOURCE_OPTIONS.forEach(function (opt) {
      var nameAttr = 'q6_' + id + '_source';
      var otherAttr = opt.value === 'Other (specify)' ? ' data-other-specify' : '';
      sourceCheckboxes += '<label><input type="checkbox" name="' + nameAttr + '" value="' + opt.value + '"' + otherAttr + '><span class="option-label" data-i18n="' + opt.key + '"></span></label>';
    });
    sourceCheckboxes += '</div><div class="q6-cond-source-other conditional-field" hidden><label><span data-i18n="q6.specify"></span> <input type="text" name="q6_' + id + '_source_other_specify"></label></div>';

    card.innerHTML =
      '<div class="entity-card-header"><h4 data-i18n="entity.ubo"></h4><button type="button" class="btn-remove-card" data-i18n="btn.remove"></button></div>' +
      '<div class="fields">' +
      '<label><span data-i18n="field.uboName"></span> <input type="text" name="q6_' + id + '_name" required></label>' +
      '<label><span data-i18n="field.ownershipPct"></span> <input type="text" name="q6_' + id + '_ownership"></label>' +
      '<label><span data-i18n="field.uboPosition"></span> <input type="text" name="q6_' + id + '_position"></label>' +
      '<label><span data-i18n="field.uboExpertise"></span> <textarea name="q6_' + id + '_expertise" rows="4"></textarea></label>' +
      '<label><span data-i18n="field.uboRole"></span> <textarea name="q6_' + id + '_role" rows="4"></textarea></label>' +
      '<label><span data-i18n="field.uboDecisions"></span> <input type="text" name="q6_' + id + '_decisions"></label>' +
      '<p class="ubo-subheading" data-i18n="q6.amount.title"></p>' + amountRadios +
      '<p class="ubo-subheading" data-i18n="q6.howlong.title"></p>' + howLongRadios +
      '<p class="ubo-subheading" data-i18n="q6.source.title"></p>' + sourceCheckboxes +
      '<p class="ubo-subheading" data-i18n="q6.sourceProof.title"></p><div class="file-upload-wrap" data-source-wrap><label><span data-i18n="field.docMax"></span> <input type="file" name="q6_' + id + '_source_file" accept="*"></label><div class="file-name" data-source-file-name></div><div class="file-error" data-source-file-error></div></div>' +
      '<p class="ubo-subheading" data-i18n="q6.proofAddress.title"></p><div class="file-upload-wrap"><label><span data-i18n="field.docMax"></span> <input type="file" name="q6_' + id + '_file" accept="*" required></label><div class="file-name" data-file-name></div><div class="file-error" data-file-error></div></div>' +
      '<p class="ubo-subheading" data-i18n="q6.declaration.text"></p>' +
      '<div class="options options-radio"><label><input type="radio" name="q6_' + id + '_declaration" value="Yes" required><span class="option-label" data-i18n="opt.yes"></span></label><label><input type="radio" name="q6_' + id + '_declaration" value="No"><span class="option-label" data-i18n="opt.no"></span></label></div>' +
      '</div>';
    container.appendChild(card);
    retranslate(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });

    // Amount conditional: "Less than $50,000 (specify)" OR "More than $150,000 (specify)"
    var amountSpecify = card.querySelector('.q6-cond-amount-specify');
    if (amountSpecify) {
      var updateAmountSpecifyVisibility = function () {
        var selected = card.querySelector('input[name="q6_' + id + '_amount"]:checked');
        var show = selected && (selected.value === 'Less than $50,000.00 MXN (specify)' || selected.value === 'More than $150,000.00 (specify)');
        amountSpecify.hidden = !show;
      };
      card.querySelectorAll('input[name="q6_' + id + '_amount"]').forEach(function (radio) {
        radio.addEventListener('change', updateAmountSpecifyVisibility);
      });
    }
    // How long conditional: More than 5 years (specify)
    var howLongSpecify = card.querySelector('.q6-cond-howlong-specify');
    card.querySelectorAll('input[name="q6_' + id + '_howlong"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        howLongSpecify.hidden = radio.value !== 'More than 5 years (specify)';
      });
    });
    // Source Other (specify)
    var sourceOtherSpecify = card.querySelector('.q6-cond-source-other');
    card.querySelectorAll('input[name="q6_' + id + '_source"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var otherChecked = card.querySelector('input[name="q6_' + id + '_source"][data-other-specify]:checked');
        sourceOtherSpecify.hidden = !otherChecked;
      });
    });

    function wireFile(fileInput, nameEl, errEl, wrapEl) {
      if (!fileInput || !wrapEl) return;
      fileInput.addEventListener('change', function () {
        if (errEl) errEl.textContent = '';
        if (nameEl) nameEl.textContent = '';
        wrapEl.classList.remove('has-file');
        if (fileInput.files && fileInput.files[0]) {
          var f = fileInput.files[0];
          if (f.size > MAX_FILE_SIZE) { if (errEl) errEl.textContent = t('file.tooBig'); fileInput.value = ''; return; }
          if (nameEl) nameEl.textContent = f.name;
          wrapEl.classList.add('has-file');
        }
      });
    }
    wireFile(
      card.querySelector('input[name="q6_' + id + '_file"]'),
      card.querySelector('[data-file-name]'),
      card.querySelector('[data-file-error]'),
      card.querySelector('.file-upload-wrap:not([data-source-wrap])')
    );
    wireFile(
      card.querySelector('input[name="q6_' + id + '_source_file"]'),
      card.querySelector('[data-source-file-name]'),
      card.querySelector('[data-source-file-error]'),
      card.querySelector('[data-source-wrap]')
    );
  }
  document.getElementById('q6-add-ubo').addEventListener('click', addUBOHighBlock);

  // --- Signature
  (function () {
    var canvas = document.getElementById('signature-canvas');
    var placeholder = document.getElementById('signature-placeholder');
    var removeBtn = document.getElementById('remove-signature-btn');
    if (!canvas || !removeBtn) return;
    var ctx = canvas.getContext('2d');
    var drawing = false;
    var hasStroke = false;
    function setCanvasSize() {
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
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
      var rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function start(e) { e.preventDefault(); drawing = true; var pos = getCoord(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); hasStroke = true; if (placeholder) placeholder.style.visibility = 'hidden'; }
    function move(e) { e.preventDefault(); if (!drawing) return; var pos = getCoord(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
    function end(e) { e.preventDefault(); drawing = false; }
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

  // --- Collectors
  function getSelectedValues(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (el) { return el.value; });
  }
  function getSelectedValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function collectEntities(containerId) {
    var individuals = [], companies = [];
    var container = document.getElementById(containerId);
    if (!container) return { individuals: individuals, companies: companies };
    container.querySelectorAll('.entity-card').forEach(function (card) {
      var fullName = card.querySelector('input[name$="_fullName"]');
      var fullLegalName = card.querySelector('input[name$="_fullLegalName"]');
      var rfc = card.querySelector('input[name$="_rfc"]');
      var curp = card.querySelector('input[name$="_curp"]');
      if (fullName && rfc && curp) individuals.push({ fullName: fullName.value.trim(), rfc: rfc.value.trim(), curp: curp.value.trim() });
      else if (fullLegalName && rfc) companies.push({ fullLegalName: fullLegalName.value.trim(), rfc: rfc.value.trim() });
    });
    return { individuals: individuals, companies: companies };
  }
  function collectQ3() { return collectEntities('q3-entities'); }
  function collectQ4_1() { return collectEntities('q4_1-entities'); }
  function collectQ5_2() {
    var list = [];
    var container = document.getElementById('q5_2-entities');
    if (!container) return list;
    container.querySelectorAll('.entity-card').forEach(function (card) {
      var fullName = card.querySelector('input[name$="_fullName"]');
      var shares = card.querySelector('input[name$="_shares"]');
      if (!fullName || !shares) return;
      var curpIn = card.querySelector('input[name$="_curp"]');
      var rfcIn = card.querySelector('input[name$="_rfc"]');
      var taxIn = card.querySelector('input[name$="_taxNumber"]');
      list.push({
        fullName: fullName.value.trim(),
        curp: curpIn ? curpIn.value.trim() : '',
        rfc: rfcIn ? rfcIn.value.trim() : '',
        taxNumber: taxIn ? taxIn.value.trim() : '',
        numberOfShares: shares.value.trim()
      });
    });
    return list;
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = reader.result;
        var base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
        resolve({ base64: base64, fileName: file.name, mimeType: file.type || 'application/octet-stream' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function validate() {
    var errors = [];

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

    var q5_1Container = document.getElementById('q5_1-entities');
    if (q5_1Container) {
      var dirCount = 0, boardCount = 0;
      var cards = q5_1Container.querySelectorAll('.entity-card');
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (!c.dataset.directorType) continue;
        var nameInput = c.querySelector('input[name$="_fullName"]');
        var hasName = nameInput && nameInput.value.trim();
        var fileInput = c.querySelector('input[type="file"]');
        var hasFile = fileInput && fileInput.files && fileInput.files[0];
        if (!hasName || !hasFile) continue;
        if (c.dataset.directorType === 'general_director') dirCount++;
        else if (c.dataset.directorType === 'member_of_board') boardCount++;
      }
      if (dirCount < 1 && boardCount < 2) errors.push(t('err.q5_1'));
    }

    var q5_2 = collectQ5_2();
    if (q5_2.length < 1) errors.push(t('err.q5_2'));

    var q6Cards = document.getElementById('q6-entities');
    if (!q6Cards || q6Cards.querySelectorAll('.entity-card').length === 0) errors.push(t('err.q6'));
    else {
      q6Cards.querySelectorAll('.entity-card').forEach(function (card) {
        var nameInput = card.querySelector('input[name$="_name"]');
        var fileInput = card.querySelector('input[type="file"][name$="_file"]');
        if (!nameInput || !nameInput.value.trim()) errors.push(t('err.q6.uboName'));
        if (!fileInput || !fileInput.files || !fileInput.files[0]) errors.push(t('err.q6.file'));
        else if (fileInput.files[0].size > MAX_FILE_SIZE) errors.push(t('err.q6.fileBig'));
        if (!card.querySelector('input[name$="_declaration"]:checked')) errors.push(t('err.q6.declaration'));
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
    if (errs.length > 0) { showError(errs.join(' ')); return; }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('btn.saving'); }

    var promises = [];
    var q5_1Data = { generalDirectors: [], boardMembers: [] };
    var container5_1 = document.getElementById('q5_1-entities');
    if (container5_1) {
      container5_1.querySelectorAll('.entity-card').forEach(function (card) {
        var type = card.dataset.directorType;
        var fullName = card.querySelector('input[name$="_fullName"]');
        var dob = card.querySelector('input[name$="_dob"]');
        var country = card.querySelector('input[name$="_country"]');
        var fileInput = card.querySelector('input[type="file"]');
        if (!fullName || !fileInput || !fileInput.files || !fileInput.files[0]) return;
        var nameVal = fullName.value.trim();
        var dobVal = dob ? dob.value.trim() : '';
        var countryVal = country ? country.value.trim() : '';
        promises.push(readFileAsBase64(fileInput.files[0]).then(function (obj) {
          var item = { fullName: nameVal, dateOfBirth: dobVal, countryOfResidence: countryVal, fileName: obj.fileName, fileBase64: obj.base64, mimeType: obj.mimeType };
          if (type === 'general_director') q5_1Data.generalDirectors.push(item);
          else if (type === 'member_of_board') q5_1Data.boardMembers.push(item);
        }));
      });
    }

    var q6List = [];
    var q6Container = document.getElementById('q6-entities');
    if (q6Container) {
      q6Container.querySelectorAll('.entity-card').forEach(function (card) {
        var id = card.dataset.uboId;
        if (!id) return;
        var nameInput = card.querySelector('input[name="q6_' + id + '_name"]');
        var fileInput = card.querySelector('input[name="q6_' + id + '_file"]');
        var sourceFileInput = card.querySelector('input[name="q6_' + id + '_source_file"]');
        if (!nameInput || !fileInput || !fileInput.files || !fileInput.files[0]) return;
        var nameVal = nameInput.value.trim();
        var ownership = (card.querySelector('input[name="q6_' + id + '_ownership"]') || {}).value || '';
        var position = (card.querySelector('input[name="q6_' + id + '_position"]') || {}).value || '';
        var expertise = (card.querySelector('textarea[name="q6_' + id + '_expertise"]') || {}).value || '';
        var role = (card.querySelector('textarea[name="q6_' + id + '_role"]') || {}).value || '';
        var decisions = (card.querySelector('input[name="q6_' + id + '_decisions"]') || {}).value || '';
        var amount = getSelectedValue('q6_' + id + '_amount') || '';
        var amountSpecify = (card.querySelector('input[name="q6_' + id + '_amount_specify"]') || {}).value || '';
        var howlong = getSelectedValue('q6_' + id + '_howlong') || '';
        var howlongSpecify = (card.querySelector('input[name="q6_' + id + '_howlong_specify"]') || {}).value || '';
        var sourceArr = getSelectedValues('q6_' + id + '_source');
        var sourceOther = (card.querySelector('input[name="q6_' + id + '_source_other_specify"]') || {}).value || '';
        var declaration = getSelectedValue('q6_' + id + '_declaration') || '';
        var mainFilePromise = readFileAsBase64(fileInput.files[0]);
        var sourceFilePromise = (sourceFileInput && sourceFileInput.files && sourceFileInput.files[0]) ? readFileAsBase64(sourceFileInput.files[0]) : Promise.resolve(null);
        promises.push(Promise.all([mainFilePromise, sourceFilePromise]).then(function (arr) {
          var obj = arr[0];
          var sourceObj = arr[1];
          q6List.push({
            uboFullName: nameVal,
            ownershipPercentage: ownership,
            positionOrTitle: position,
            expertise: expertise,
            roleAndResponsibilities: role,
            decisionsFunds: decisions,
            amountContributed: amount,
            amountSpecify: amountSpecify,
            howLongContributed: howlong,
            howLongSpecify: howlongSpecify,
            sourceOfWealth: sourceArr,
            sourceOtherSpecify: sourceOther,
            declaration: declaration,
            fileName: obj.fileName,
            fileBase64: obj.base64,
            mimeType: obj.mimeType,
            sourceFileName: sourceObj ? sourceObj.fileName : null,
            sourceFileBase64: sourceObj ? sourceObj.base64 : null,
            sourceMimeType: sourceObj ? sourceObj.mimeType : null
          });
        }));
      });
    }

    Promise.all(promises).then(function () {
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
        q5_1: q5_1Data,
        q5_2: collectQ5_2(),
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
