(function () {
  // ---- Elements ----
  var loginView = document.getElementById('login-view');
  var mainView = document.getElementById('main-view');
  var listView = document.getElementById('list-view');
  var detailView = document.getElementById('detail-view');
  var logoutBtn = document.getElementById('logout-btn');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var listTable = document.getElementById('list-table');
  var listTbody = document.getElementById('list-tbody');
  var listEmpty = document.getElementById('list-empty');
  var detailTbody = document.getElementById('detail-tbody');
  var detailMeta = document.getElementById('detail-meta');
  var pdfLink = document.getElementById('pdf-link');
  var refreshBtn = document.getElementById('refresh-btn');
  var backBtn = document.getElementById('back-btn');

  var currentFilter = '';

  // ---- Helpers ----
  function escapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  function api(path, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    return fetch(path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { ok: res.ok, status: res.status, body: body };
      });
    });
  }
  function fmtDate(s) {
    if (!s) return '';
    try { return new Date(s).toLocaleString(); } catch (e) { return s; }
  }
  var TYPE_LABELS = {
    medium: 'Medium Risk',
    high: 'High Risk',
    new_company: 'New company (<3 months)',
    existing_company: 'Company (>3 months)'
  };
  function typeLabel(t) { return TYPE_LABELS[t] || t || 'Unknown'; }
  function isRegistrySurvey(t) { return t === 'new_company' || t === 'existing_company'; }

  // ---- Views ----
  function showLogin() {
    loginView.hidden = false;
    mainView.hidden = true;
    logoutBtn.hidden = true;
  }
  function showMain() {
    loginView.hidden = true;
    mainView.hidden = false;
    logoutBtn.hidden = false;
    showList();
    loadList(currentFilter);
  }
  function showList() {
    listView.hidden = false;
    detailView.hidden = true;
  }
  function showDetail() {
    listView.hidden = true;
    detailView.hidden = false;
  }

  // ---- Auth ----
  function checkAuth() {
    api('/api/admin/me').then(function (r) {
      if (r.body && r.body.authenticated) showMain();
      else showLogin();
    }).catch(showLogin);
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var pw = document.getElementById('admin-password').value;
    api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pw }) }).then(function (r) {
      if (r.ok) {
        document.getElementById('admin-password').value = '';
        showMain();
      } else {
        loginError.textContent = r.body && r.body.error === 'ADMIN_PASSWORD is not configured on the server'
          ? 'Server is missing ADMIN_PASSWORD configuration.'
          : 'Invalid password.';
        loginError.hidden = false;
      }
    }).catch(function () {
      loginError.textContent = 'Could not reach the server.';
      loginError.hidden = false;
    });
  });

  logoutBtn.addEventListener('click', function () {
    api('/api/admin/logout', { method: 'POST' }).then(showLogin).catch(showLogin);
  });

  // ---- List ----
  var filterBtns = document.querySelectorAll('.filter-btn');
  for (var i = 0; i < filterBtns.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        currentFilter = btn.getAttribute('data-filter') || '';
        for (var j = 0; j < filterBtns.length; j++) filterBtns[j].classList.remove('active');
        btn.classList.add('active');
        loadList(currentFilter);
      });
    })(filterBtns[i]);
  }
  refreshBtn.addEventListener('click', function () { loadList(currentFilter); });
  backBtn.addEventListener('click', function () { showList(); });

  function loadList(type) {
    var url = '/api/admin/submissions' + (type ? '?type=' + encodeURIComponent(type) : '');
    api(url).then(function (r) {
      if (r.status === 401) { showLogin(); return; }
      var subs = (r.body && r.body.submissions) || [];
      renderList(subs);
    });
  }

  function renderList(subs) {
    listTbody.innerHTML = '';
    if (!subs.length) {
      listEmpty.hidden = false;
      listTable.hidden = true;
      return;
    }
    listEmpty.hidden = true;
    listTable.hidden = false;
    subs.forEach(function (s) {
      var tr = document.createElement('tr');
      tr.className = 'list-row';
      tr.innerHTML =
        '<td>' + escapeHtml(s.id) + '</td>' +
        '<td>' + escapeHtml(fmtDate(s.created_at)) + '</td>' +
        '<td>' + escapeHtml(typeLabel(s.survey_type)) + '</td>' +
        '<td>' + escapeHtml(s.company_name) + '</td>' +
        '<td>' + escapeHtml(s.legal_rep_name) + '</td>' +
        '<td>' + escapeHtml(s.email) + '</td>';
      tr.addEventListener('click', function () { openDetail(s.id); });
      listTbody.appendChild(tr);
    });
  }

  // ---- Detail ----
  function openDetail(id) {
    api('/api/admin/submissions/' + id).then(function (r) {
      if (r.status === 401) { showLogin(); return; }
      if (!r.ok || !r.body || !r.body.submission) return;
      renderDetail(r.body.submission, r.body.files || []);
      showDetail();
      window.scrollTo(0, 0);
    });
  }

  // The registered-company surveys share every question except number 3.
  function registryLabels(type) {
    return {
      legalRepName: '1. Full Name of Legal Representative',
      companyName: '2. Company name',
      doc3: type === 'new_company'
        ? '3. Proof of registration in the Padrón (SAT Federal Vulnerable Activity Registry)'
        : '3. Records of filed Vulnerable Activity notices (last 3 months)',
      taxOpinion: '4. Positive tax compliance opinion',
      complianceProgram: '5. Evidence of compliance program (optional, AML/CFT & KYC manual)',
      fundsOrigin: '6. Origin of the funds the business operates with',
      averageTicket: '7. Average ticket per transaction (MXN)',
      ubos: "8. UBO information",
      oath: '9. Declaration under oath (information is true and accurate).',
      pep: '10. Declaration of not being a politically exposed person (PEP).'
    };
  }

  // Sub-fields of one UBO, each shown as its own labelled row.
  var UBO_FIELDS = [
    { key: 'ownershipPercentage', label: 'Ownership percentage', pre: false },
    { key: 'positionOrTitle', label: 'Position or title within the company', pre: false, optional: true },
    { key: 'expertise', label: 'Relevant expertise', pre: true },
    { key: 'roleAndResponsibilities', label: 'Role and main responsibilities', pre: true },
    { key: 'decisionsFunds', label: 'Decisions on funds', pre: true }
  ];

  // A full-width heading row inside the detail table (spans both columns).
  function subheadRow(text) {
    var tr = document.createElement('tr');
    tr.className = 'detail-subhead';
    tr.innerHTML = '<td colspan="2">' + escapeHtml(text) + '</td>';
    return tr;
  }

  // Push each UBO as a heading plus one row per sub-question, so long expertise
  // and responsibilities answers no longer run into each other.
  function pushRegistryUbos(ubos, rows) {
    if (!ubos || !ubos.length) {
      rows.push(row('—', ''));
      return;
    }
    ubos.forEach(function (u, idx) {
      rows.push(subheadRow('UBO #' + (idx + 1) + ': ' + (u.uboFullName || '')));
      UBO_FIELDS.forEach(function (f) {
        var val = u[f.key];
        if (f.optional && !val) return;
        var cell = f.pre ? '<div class="answer-pre">' + escapeHtml(val) + '</div>' : escapeHtml(val);
        rows.push(row(f.label, cell));
      });
    });
  }

  function fmtDoc(doc) {
    if (!doc) return '<span class="muted">not provided</span>';
    return downloadLink(doc.fileId, doc.fileName);
  }

  function renderRegistryDetail(a, type, rows) {
    var L = registryLabels(type);
    rows.push(row(L.legalRepName, escapeHtml(a.legalRepName)));
    rows.push(row(L.companyName, escapeHtml(a.companyName)));
    rows.push(row(L.doc3, fmtDoc(a.registrationProof)));
    rows.push(row(L.taxOpinion, fmtDoc(a.taxOpinion)));
    rows.push(row(L.complianceProgram, fmtDoc(a.complianceProgram)));
    var funds = escapeHtml(a.fundsOrigin);
    if (a.fundsOriginOther) funds += ' — ' + escapeHtml(a.fundsOriginOther);
    rows.push(row(L.fundsOrigin, funds));
    rows.push(row(L.averageTicket, escapeHtml(a.averageTicket)));
    rows.push(subheadRow(L.ubos));
    pushRegistryUbos(a.ubos, rows);
    rows.push(row(L.oath, escapeHtml(a.declarationOath)));
    rows.push(row(L.pep, escapeHtml(a.declarationPep)));
  }

  // English (canonical) labels with the displayed numbering, by survey type.
  function labelsFor(type) {
    var base = {
      legalRepName: '1. Full Name of Legal Representative',
      companyName: '2. Company name',
      email: '3. Email',
      q1: '4. Is the company currently engaged in any of the following activities?',
      q1_1: '4.1. How long has the company been engaged in this activity?',
      q2: '5. Does the company operate in or have direct relationships with any of the listed jurisdictions?',
      q2_1: '5.1. Which jurisdictions (listed by the client)',
      q3: '6. Who are your 3 main providers by volume?',
      q4: '7. Which segment represents the clients you have?',
      q4_1: '7.1. Who are your 3 main clients by volume?',
      q5: '8. Please explain your business model.',
      q7: '10. Declaration under oath (information is true and accurate).',
      q8: '11. Declaration of not being a politically exposed person (PEP).'
    };
    if (type === 'high') {
      base.q5_1 = '8.1. Other Administrators or Directors';
      base.q5_2 = '8.2. Information from shareholders';
      base.q6 = '9. UBO information';
    } else {
      base.q6 = '9. UBO information (25% or more ownership): proof of address + CSF';
    }
    return base;
  }

  // Per-detail lookup, refreshed on every openDetail: fileId -> {size, hash}, and
  // how many files in this submission share each content hash.
  var detailFilesById = {};
  var detailHashCounts = {};

  function setDetailFiles(files) {
    detailFilesById = {};
    detailHashCounts = {};
    (files || []).forEach(function (f) {
      detailFilesById[f.id] = f;
      if (f.hash) detailHashCounts[f.hash] = (detailHashCounts[f.hash] || 0) + 1;
    });
  }

  function fmtBytes(n) {
    if (n == null) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function downloadLink(fileId, fileName) {
    if (!fileId) return escapeHtml(fileName || '—');
    var html = '<a class="download-link" href="/api/admin/files/' + fileId + '">' + escapeHtml(fileName || 'document') + '</a>';
    var meta = detailFilesById[fileId];
    if (meta) {
      if (meta.size != null) html += ' <span class="file-meta">' + escapeHtml(fmtBytes(meta.size)) + '</span>';
      // Same bytes attached to more than one question in this submission.
      if (meta.hash && detailHashCounts[meta.hash] > 1) {
        html += ' <span class="file-dup" title="Identical file uploaded to another question">⚠ same file</span>';
      }
    }
    return html;
  }
  function fmtList(arr) {
    if (!arr || !arr.length) return '';
    return arr.map(function (x) { return '<div class="list-item">' + escapeHtml(x) + '</div>'; }).join('');
  }
  function fmtEntities(group) {
    if (!group) return '';
    var parts = [];
    (group.individuals || []).forEach(function (i) {
      parts.push('Individual: ' + escapeHtml(i.fullName) + '<br>RFC: ' + escapeHtml(i.rfc) + '<br>CURP: ' + escapeHtml(i.curp));
    });
    (group.companies || []).forEach(function (c) {
      parts.push('Company: ' + escapeHtml(c.fullLegalName) + '<br>RFC: ' + escapeHtml(c.rfc));
    });
    if (!parts.length) return '';
    return '<div class="list-item">' + parts.join('</div><div class="list-item">') + '</div>';
  }
  function fmtDirectors(q5_1) {
    if (!q5_1) return '';
    var parts = [];
    (q5_1.generalDirectors || []).forEach(function (d) {
      parts.push('General director: ' + escapeHtml(d.fullName) + ', DOB: ' + escapeHtml(d.dateOfBirth) + ', Country: ' + escapeHtml(d.countryOfResidence) + ' — ' + downloadLink(d.fileId, d.fileName));
    });
    (q5_1.boardMembers || []).forEach(function (d) {
      parts.push('Board member: ' + escapeHtml(d.fullName) + ', DOB: ' + escapeHtml(d.dateOfBirth) + ', Country: ' + escapeHtml(d.countryOfResidence) + ' — ' + downloadLink(d.fileId, d.fileName));
    });
    if (!parts.length) return '';
    return '<div class="list-item">' + parts.join('</div><div class="list-item">') + '</div>';
  }
  function fmtShareholders(q5_2) {
    if (!q5_2 || !q5_2.length) return '';
    return q5_2.map(function (s) {
      var line = 'Full name: ' + escapeHtml(s.fullName) + ', Ownership: ' + escapeHtml(s.numberOfShares);
      if (s.curp) line += ', CURP: ' + escapeHtml(s.curp);
      if (s.rfc) line += ', RFC: ' + escapeHtml(s.rfc);
      if (s.taxNumber) line += ', Tax: ' + escapeHtml(s.taxNumber);
      return '<div class="list-item">' + line + '</div>';
    }).join('');
  }
  function fmtUboMedium(q6) {
    if (!q6 || !q6.length) return '';
    return q6.map(function (u) {
      var html = '<div class="list-item ubo-result-block">';
      html += '<strong>' + escapeHtml(u.uboFullName) + '</strong>';
      html += '<br>Proof of address: ' + downloadLink(u.fileId, u.fileName);
      // CSF was added after the first submissions; older rows have no file at all.
      html += '<br>Tax Status Certificate (CSF): ' +
        (u.csfFileId ? downloadLink(u.csfFileId, u.csfFileName) : '<span class="muted">not provided</span>');
      html += '</div>';
      return html;
    }).join('');
  }
  function fmtUboHigh(q6) {
    if (!q6 || !q6.length) return '';
    return q6.map(function (u) {
      var html = '<div class="list-item ubo-result-block">';
      html += '<strong>' + escapeHtml(u.uboFullName) + '</strong>';
      html += '<br>Ownership: ' + escapeHtml(u.ownershipPercentage) + ' | Position: ' + escapeHtml(u.positionOrTitle);
      if (u.expertise) html += '<br>Expertise: ' + escapeHtml(u.expertise);
      if (u.roleAndResponsibilities) html += '<br>Role: ' + escapeHtml(u.roleAndResponsibilities);
      if (u.decisionsFunds) html += '<br>Decisions: ' + escapeHtml(u.decisionsFunds);
      html += '<br>Amount contributed: ' + escapeHtml(u.amountContributed);
      if (u.amountSpecify) html += ' — ' + escapeHtml(u.amountSpecify);
      html += '<br>How long: ' + escapeHtml(u.howLongContributed);
      if (u.howLongSpecify) html += ' — ' + escapeHtml(u.howLongSpecify);
      if (u.sourceOfWealth && u.sourceOfWealth.length) html += '<br>Source of wealth: ' + escapeHtml(u.sourceOfWealth.join('; '));
      if (u.sourceOtherSpecify) html += ' — ' + escapeHtml(u.sourceOtherSpecify);
      if (u.sourceFileId) html += '<br>Proof of source of wealth: ' + downloadLink(u.sourceFileId, u.sourceFileName);
      html += '<br>Declaration: ' + escapeHtml(u.declaration);
      html += '<br>Proof of address: ' + downloadLink(u.fileId, u.fileName);
      html += '</div>';
      return html;
    }).join('');
  }

  function row(question, answerHtml) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<th>' + escapeHtml(question) + '</th><td>' + (answerHtml || '<span class="muted">—</span>') + '</td>';
    return tr;
  }

  function renderDetail(sub, files) {
    var a = sub.answers || {};
    var type = sub.survey_type;
    var L = labelsFor(type);
    setDetailFiles(files);

    detailMeta.innerHTML =
      '<div><strong>Submission #' + escapeHtml(sub.id) + '</strong> · ' + escapeHtml(typeLabel(type)) + '</div>' +
      '<div class="muted">' + escapeHtml(fmtDate(sub.created_at)) + ' · language filled: ' + escapeHtml(sub.language || '—') + '</div>';

    pdfLink.setAttribute('href', '/api/admin/submissions/' + sub.id + '/pdf');

    detailTbody.innerHTML = '';
    var rows = [];

    if (isRegistrySurvey(type)) {
      renderRegistryDetail(a, type, rows);
      rows.forEach(function (r) { detailTbody.appendChild(r); });
      appendSignatureRow(a);
      return;
    }

    rows.push(row(L.legalRepName, escapeHtml(a.legalRepName)));
    rows.push(row(L.companyName, escapeHtml(a.companyName)));
    rows.push(row(L.email, escapeHtml(a.email)));
    rows.push(row(L.q1, fmtList(a.q1)));
    if (a.q1_1 != null) rows.push(row(L.q1_1, escapeHtml(a.q1_1)));
    rows.push(row(L.q2, escapeHtml(a.q2)));
    if (a.q2_1) rows.push(row(L.q2_1, '<pre class="answer-pre">' + escapeHtml(a.q2_1) + '</pre>'));
    rows.push(row(L.q3, fmtEntities(a.q3)));
    rows.push(row(L.q4, escapeHtml(a.q4)));
    if (a.q4_1 != null) rows.push(row(L.q4_1, fmtEntities(a.q4_1)));
    rows.push(row(L.q5, '<pre class="answer-pre">' + escapeHtml(a.q5) + '</pre>'));
    if (type === 'high') {
      rows.push(row(L.q5_1, fmtDirectors(a.q5_1)));
      rows.push(row(L.q5_2, fmtShareholders(a.q5_2)));
      rows.push(row(L.q6, fmtUboHigh(a.q6)));
    } else {
      rows.push(row(L.q6, fmtUboMedium(a.q6)));
    }
    rows.push(row(L.q7, escapeHtml(a.q7)));
    rows.push(row(L.q8, escapeHtml(a.q8)));
    rows.forEach(function (r) { detailTbody.appendChild(r); });
    appendSignatureRow(a);
  }

  function appendSignatureRow(a) {
    if (!a.signature) return;
    var tr = document.createElement('tr');
    tr.innerHTML = '<th>Signature</th><td><img alt="Signature" class="signature-image"></td>';
    tr.querySelector('img').src = a.signature;
    detailTbody.appendChild(tr);
  }

  // ---- Init ----
  checkAuth();
})();
