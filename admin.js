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
  function typeLabel(t) { return t === 'high' ? 'High Risk' : 'Medium Risk'; }

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

  // English (canonical) labels with the displayed numbering, by survey type.
  function labelsFor(type) {
    var base = {
      legalRepName: '1. Full Name of Legal Representative',
      companyName: '2. Company name',
      email: '3. Email',
      q1: '4. Is the company currently engaged in any of the following activities?',
      q1_1: '4.1. How long has the company been engaged in this activity?',
      q2: '5. Does the company operate in or have direct relationships with any of the listed jurisdictions?',
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
      base.q6 = "9. UBO proof of address";
    }
    return base;
  }

  function downloadLink(fileId, fileName) {
    if (!fileId) return escapeHtml(fileName || '—');
    return '<a class="download-link" href="/api/admin/files/' + fileId + '">' + escapeHtml(fileName || 'document') + '</a>';
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
      return '<div class="list-item">' + escapeHtml(u.uboFullName) + ' — ' + downloadLink(u.fileId, u.fileName) + '</div>';
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

    detailMeta.innerHTML =
      '<div><strong>Submission #' + escapeHtml(sub.id) + '</strong> · ' + escapeHtml(typeLabel(type)) + '</div>' +
      '<div class="muted">' + escapeHtml(fmtDate(sub.created_at)) + ' · language filled: ' + escapeHtml(sub.language || '—') + '</div>';

    pdfLink.setAttribute('href', '/api/admin/submissions/' + sub.id + '/pdf');

    detailTbody.innerHTML = '';
    var rows = [];
    rows.push(row(L.legalRepName, escapeHtml(a.legalRepName)));
    rows.push(row(L.companyName, escapeHtml(a.companyName)));
    rows.push(row(L.email, escapeHtml(a.email)));
    rows.push(row(L.q1, fmtList(a.q1)));
    if (a.q1_1 != null) rows.push(row(L.q1_1, escapeHtml(a.q1_1)));
    rows.push(row(L.q2, escapeHtml(a.q2)));
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

    if (a.signature) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<th>Signature</th><td><img alt="Signature" class="signature-image"></td>';
      tr.querySelector('img').src = a.signature;
      detailTbody.appendChild(tr);
    }
  }

  // ---- Init ----
  checkAuth();
})();
