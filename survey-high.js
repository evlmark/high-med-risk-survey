(function () {
  const FORM_STORAGE_KEY = 'highRiskSurveyResults';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const blockQ1_1 = document.getElementById('block-q1_1');
  const blockQ4_1 = document.getElementById('block-q4_1');
  const form = document.getElementById('survey-form');

  // --- Q1 / Q4 visibility (same as medium)
  function updateQ1_1Visibility() {
    const checked = Array.from(form.querySelectorAll('input[name="q1"]:checked')).map(function (el) { return el.value; });
    const showQ1_1 = checked.length > 0 && !(checked.length === 1 && checked[0] === 'None of this');
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

  // --- Q3 / Q4.1 entity cards (same as medium)
  function createEntityCard(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const isIndividual = type === 'individual';
    const title = isIndividual ? 'Individual' : 'Company';
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.dataset.entityId = id;
    if (isIndividual) {
      card.innerHTML =
        '<div class="entity-card-header"><h4>' + title + '</h4><button type="button" class="btn-remove-card" title="Remove">Remove</button></div>' +
        '<div class="fields">' +
        '<label>Full name <input type="text" name="' + containerId + '_' + id + '_fullName" required></label>' +
        '<label>RFC <input type="text" name="' + containerId + '_' + id + '_rfc" required></label>' +
        '<label>CURP <input type="text" name="' + containerId + '_' + id + '_curp" required></label></div>';
    } else {
      card.innerHTML =
        '<div class="entity-card-header"><h4>' + title + '</h4><button type="button" class="btn-remove-card" title="Remove">Remove</button></div>' +
        '<div class="fields">' +
        '<label>Full legal name <input type="text" name="' + containerId + '_' + id + '_fullLegalName" required></label>' +
        '<label>RFC <input type="text" name="' + containerId + '_' + id + '_rfc" required></label></div>';
    }
    container.appendChild(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });
  }
  document.getElementById('q3-add-individual').addEventListener('click', function () { createEntityCard('individual', 'q3-entities'); });
  document.getElementById('q3-add-company').addEventListener('click', function () { createEntityCard('company', 'q3-entities'); });
  document.getElementById('q4_1-add-individual').addEventListener('click', function () { createEntityCard('individual', 'q4_1-entities'); });
  document.getElementById('q4_1-add-company').addEventListener('click', function () { createEntityCard('company', 'q4_1-entities'); });

  // --- Q5.1 Directors (min 1 general director, min 2 members of board)
  function addDirector(type) {
    const container = document.getElementById('q5_1-entities');
    if (!container) return;
    const id = 'dir_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const title = type === 'general_director' ? 'General director' : 'Member of board';
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.dataset.directorType = type;
    card.dataset.entityId = id;
    card.innerHTML =
      '<div class="entity-card-header"><h4>' + title + '</h4><button type="button" class="btn-remove-card" title="Remove">Remove</button></div>' +
      '<div class="fields">' +
      '<label>Full name <input type="text" name="q5_1_' + id + '_fullName" required></label>' +
      '<label>Date of birth <input type="text" name="q5_1_' + id + '_dob" placeholder="DD - MM - YYYY" required></label>' +
      '<label>Country of residence <input type="text" name="q5_1_' + id + '_country" required></label>' +
      '<p class="entity-card-upload-title">Upload Official ID</p>' +
      '<div class="file-upload-wrap"><label>Official ID (document, max 10 MB) <input type="file" name="q5_1_' + id + '_file" accept="*" required></label>' +
      '<div class="file-name" data-file-name></div><div class="file-error" data-file-error></div></div></div>';
    container.appendChild(card);
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
        if (f.size > MAX_FILE_SIZE) { errEl.textContent = 'File must be 10 MB or smaller.'; fileInput.value = ''; return; }
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
      '<div class="entity-card-header"><h4>Shareholder</h4><button type="button" class="btn-remove-card" title="Remove">Remove</button></div>' +
      '<div class="fields">' +
      '<label>Full name <input type="text" name="q5_2_' + id + '_fullName" required></label>' +
      '<label>CURP (optional) <input type="text" name="q5_2_' + id + '_curp"></label>' +
      '<label>RFC (optional) <input type="text" name="q5_2_' + id + '_rfc"></label>' +
      '<label>Tax number (if no CURP/RFC) (optional) <input type="text" name="q5_2_' + id + '_taxNumber"></label>' +
      '<label>Number of shares <input type="text" name="q5_2_' + id + '_shares" required></label></div>';
    container.appendChild(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });
  }
  document.getElementById('q5_2-add-shareholder').addEventListener('click', addShareholder);

  // --- Q6 High Risk: one UBO block with all fields and conditionals
  var SOURCE_OPTIONS = [
    'Salary/bonuses (employment)',
    'Business profits/dividends from another company',
    'Sale of a business / shares',
    'Sale of real estate or other asset',
    'Inheritance',
    'Investment returns (securities/funds/crypto/other)',
    'Loan (bank or third party)',
    'Other (specify)'
  ];
  function addUBOHighBlock() {
    const container = document.getElementById('q6-entities');
    if (!container) return;
    const id = 'ubo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const card = document.createElement('div');
    card.className = 'entity-card entity-card-ubo-high';
    card.dataset.uboId = id;

    var amountRadios = '<div class="options options-radio" data-amount-radios>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="Less than $50,000.00 MXN (specify)"><span class="option-label">Less than $50,000.00 MXN (specify).</span></label>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="Between $50,001.00 - $100,000.00 MXN"><span class="option-label">Between $50,001.00 - $100,000.00 MXN.</span></label>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="Between $100,001.00 - $150,000.00 MXN"><span class="option-label">Between $100,001.00 - $150,000.00 MXN.</span></label>' +
      '<label><input type="radio" name="q6_' + id + '_amount" value="More than $150,000.00"><span class="option-label">More than $150,000.00</span></label>' +
      '</div><div class="q6-cond-amount-specify conditional-field" hidden><label>Specify <input type="text" name="q6_' + id + '_amount_specify" placeholder="Text or amount"></label></div>';

    var howLongRadios = '<div class="options options-radio" data-howlong-radios>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="Between 1 month and less than a year"><span class="option-label">Between 1 month and less than a year.</span></label>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="Between 1 and 2 years"><span class="option-label">Between 1 and 2 years.</span></label>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="Between 2 and 5 years"><span class="option-label">Between 2 and 5 years.</span></label>' +
      '<label><input type="radio" name="q6_' + id + '_howlong" value="More than 5 years (specify)"><span class="option-label">More than 5 years (specify)</span></label>' +
      '</div><div class="q6-cond-howlong-specify conditional-field" hidden><label>Specify (e.g. number of years) <input type="text" name="q6_' + id + '_howlong_specify"></label></div>';

    var sourceCheckboxes = '<div class="options options-checkbox" data-source-options>';
    SOURCE_OPTIONS.forEach(function (opt) {
      var val = opt;
      var nameAttr = 'q6_' + id + '_source';
      if (opt === 'Other (specify)') {
        sourceCheckboxes += '<label><input type="checkbox" name="' + nameAttr + '" value="' + val + '" data-other-specify><span class="option-label">' + opt + '</span></label>';
      } else {
        sourceCheckboxes += '<label><input type="checkbox" name="' + nameAttr + '" value="' + val + '"><span class="option-label">' + opt + '</span></label>';
      }
    });
    sourceCheckboxes += '</div><div class="q6-cond-source-other conditional-field" hidden><label>Specify <input type="text" name="q6_' + id + '_source_other_specify"></label></div>';

    card.innerHTML =
      '<div class="entity-card-header"><h4>UBO</h4><button type="button" class="btn-remove-card" title="Remove">Remove</button></div>' +
      '<div class="fields">' +
      '<label>UBO Full Name <input type="text" name="q6_' + id + '_name" required></label>' +
      '<label>Ownership percentage <input type="text" name="q6_' + id + '_ownership"></label>' +
      '<label>Position or title within the company (if any) <input type="text" name="q6_' + id + '_position"></label>' +
      '<label>Please describe the UBO’s relevant expertise (up to 250 words): Include information such as years of experience, sectors/markets, roles held, key skills, education/certifications, notable achievements, and other relevant information. <textarea name="q6_' + id + '_expertise" rows="4"></textarea></label>' +
      '<label>Describe the UBO’s role and main responsibilities within the company (up to 250 words) <textarea name="q6_' + id + '_role" rows="4"></textarea></label>' +
      '<label>What decisions related to funds/resources does the UBO approve or influence (use, distribution, disposal, etc.) <input type="text" name="q6_' + id + '_decisions"></label>' +
      '<p class="ubo-subheading">Approximate amount contributed by the UBO to start the business</p>' + amountRadios +
      '<p class="ubo-subheading">How long has the UBO contributed to the company?</p>' + howLongRadios +
      '<p class="ubo-subheading">What is the source of the UBO’s wealth to provide the company with growth funds or investment?</p>' + sourceCheckboxes +
      '<p class="ubo-subheading">Add UBO Proof of address</p><div class="file-upload-wrap"><label>Document, max 10 MB <input type="file" name="q6_' + id + '_file" accept="*" required></label><div class="file-name" data-file-name></div><div class="file-error" data-file-error></div></div>' +
      '<p class="ubo-subheading">I declare that the information provided is true, accurate, and complete to the best of my knowledge, and that the funds/resources described are of lawful origin.</p>' +
      '<div class="options options-radio"><label><input type="radio" name="q6_' + id + '_declaration" value="Yes" required><span class="option-label">Yes</span></label><label><input type="radio" name="q6_' + id + '_declaration" value="No"><span class="option-label">No</span></label></div>' +
      '</div>';
    container.appendChild(card);
    card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); });

    // Amount conditional: show specify field ONLY when "More than $150,000.00" is selected
    var amountSpecify = card.querySelector('.q6-cond-amount-specify');
    if (amountSpecify) {
      card.querySelectorAll('input[name="q6_' + id + '_amount"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
          amountSpecify.hidden = radio.value !== 'More than $150,000.00';
        });
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

    var fileInput = card.querySelector('input[type="file"]');
    var nameEl = card.querySelector('[data-file-name]');
    var errEl = card.querySelector('[data-file-error]');
    var wrapEl = card.querySelector('.file-upload-wrap');
    fileInput.addEventListener('change', function () {
      errEl.textContent = '';
      nameEl.textContent = '';
      wrapEl.classList.remove('has-file');
      if (fileInput.files && fileInput.files[0]) {
        var f = fileInput.files[0];
        if (f.size > MAX_FILE_SIZE) { errEl.textContent = 'File must be 10 MB or smaller.'; fileInput.value = ''; return; }
        nameEl.textContent = f.name;
        wrapEl.classList.add('has-file');
      }
    });
  }
  document.getElementById('q6-add-ubo').addEventListener('click', addUBOHighBlock);

  // --- Signature (same as medium)
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
  function collectQ3() {
    var individuals = [], companies = [];
    var container = document.getElementById('q3-entities');
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
  function collectQ4_1() {
    var individuals = [], companies = [];
    var container = document.getElementById('q4_1-entities');
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
  function collectQ5_1() {
    var directors = [], board = [];
    var container = document.getElementById('q5_1-entities');
    if (!container) return { generalDirectors: directors, boardMembers: board };
    container.querySelectorAll('.entity-card').forEach(function (card) {
      var type = card.dataset.directorType;
      var fullName = card.querySelector('input[name$="_fullName"]');
      var dob = card.querySelector('input[name$="_dob"]');
      var country = card.querySelector('input[name$="_country"]');
      var fileInput = card.querySelector('input[type="file"]');
      if (!fullName || !dob || !country || !fileInput || !fileInput.files || !fileInput.files[0]) return;
      var obj = { fullName: fullName.value.trim(), dateOfBirth: dob.value.trim(), countryOfResidence: country.value.trim(), officialIdFile: fileInput.files[0] };
      if (type === 'general_director') directors.push(obj);
      else if (type === 'member_of_board') board.push(obj);
    });
    return { generalDirectors: directors, boardMembers: board };
  }
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
    if (getSelectedValues('q1').length === 0) errors.push('Question 1: select at least one option.');
    if (blockQ1_1 && !blockQ1_1.hidden && !getSelectedValue('q1_1')) errors.push('Question 1.1: select one option.');
    if (!getSelectedValue('q2')) errors.push('Question 2: select Yes or No.');
    var q3 = collectQ3();
    if (q3.individuals.length === 0 && q3.companies.length === 0) errors.push('Question 3: add at least one provider.');
    if (!getSelectedValue('q4')) errors.push('Question 4: select one option.');
    if (blockQ4_1 && !blockQ4_1.hidden) {
      var q4_1 = collectQ4_1();
      if (q4_1.individuals.length === 0 && q4_1.companies.length === 0) errors.push('Question 4.1: add at least one client.');
    }
    var q5El = document.getElementById('q5');
    if (!q5El || !q5El.value.trim()) errors.push('Question 5: please explain your business model.');
    var q5_1Container = document.getElementById('q5_1-entities');
    if (q5_1Container) {
      var dirCount = 0, boardCount = 0;
      var cards = q5_1Container.querySelectorAll('.entity-card');
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (!c.dataset.directorType) continue;
        var hasName = c.querySelector('input[name$="_fullName"]') && c.querySelector('input[name$="_fullName"]').value.trim();
        var fileInput = c.querySelector('input[type="file"]');
        var hasFile = fileInput && fileInput.files && fileInput.files[0];
        if (!hasName || !hasFile) continue;
        if (c.dataset.directorType === 'general_director') dirCount++;
        else if (c.dataset.directorType === 'member_of_board') boardCount++;
      }
      if (dirCount < 1) errors.push('Question 5.1: add at least 1 general director.');
      if (boardCount < 2) errors.push('Question 5.1: add at least 2 members of the board.');
    }
    var q5_2 = collectQ5_2();
    if (q5_2.length < 1) errors.push('Question 5.2: add at least one shareholder.');
    var q6Cards = document.getElementById('q6-entities');
    if (!q6Cards || q6Cards.querySelectorAll('.entity-card').length === 0) errors.push('Question 6: add at least one UBO.');
    else {
      q6Cards.querySelectorAll('.entity-card').forEach(function (card) {
        if (!card.querySelector('input[name$="_name"]') || !card.querySelector('input[name$="_name"]').value.trim()) errors.push('Question 6: UBO Full Name is required.');
        if (!card.querySelector('input[type="file"]') || !card.querySelector('input[type="file"]').files || !card.querySelector('input[type="file"]').files[0]) errors.push('Question 6: proof of address file is required for each UBO.');
        else if (card.querySelector('input[type="file"]').files[0].size > MAX_FILE_SIZE) errors.push('Question 6: one of the files exceeds 10 MB.');
        if (!card.querySelector('input[name$="_declaration"]:checked')) errors.push('Question 6: declaration Yes/No is required for each UBO.');
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
        promises.push(readFileAsBase64(fileInput.files[0]).then(function (obj) {
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
            mimeType: obj.mimeType
          });
        }));
      });
    }

    Promise.all(promises).then(function () {
      var signatureDataUrl = typeof window.getSignatureBase64 === 'function' ? window.getSignatureBase64() : null;
      var payload = {
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
      window.location.href = 'results-high.html';
    });
  });
})();
