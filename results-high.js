(function () {
  const FORM_STORAGE_KEY = 'highRiskSurveyResults';

  var data;
  try {
    var raw = sessionStorage.getItem(FORM_STORAGE_KEY);
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {
    data = null;
  }

  var noDataEl = document.getElementById('no-data');
  var tableWrap = document.getElementById('results-table-wrap');
  var tbody = document.getElementById('results-tbody');

  function escapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function row(question, answerHtml) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<th>' + escapeHtml(question) + '</th><td>' + answerHtml + '</td>';
    return tr;
  }

  function formatList(arr) {
    if (!arr || arr.length === 0) return '';
    return arr.map(function (item) { return '<div class="list-item">' + escapeHtml(item) + '</div>'; }).join('');
  }

  function formatQ3(q3) {
    if (!q3) return '';
    var parts = [];
    (q3.individuals || []).forEach(function (i) {
      parts.push('Individual: ' + escapeHtml(i.fullName) + '<br>RFC: ' + escapeHtml(i.rfc) + '<br>CURP: ' + escapeHtml(i.curp));
    });
    (q3.companies || []).forEach(function (c) {
      parts.push('Company: ' + escapeHtml(c.fullLegalName) + '<br>RFC: ' + escapeHtml(c.rfc));
    });
    return '<div class="list-item">' + parts.join('</div><div class="list-item">') + '</div>';
  }

  var allFiles = [];

  function downloadLink(fileName, fileIndex) {
    if (fileIndex === undefined || fileIndex < 0) return escapeHtml(fileName || 'document');
    return '<a href="#" class="download-link" data-download-idx="' + fileIndex + '">Download ' + escapeHtml(fileName || 'document') + '</a>';
  }

  function formatQ5_1(q5_1) {
    if (!q5_1) return '';
    var parts = [];
    (q5_1.generalDirectors || []).forEach(function (d) {
      var idx = d.fileBase64 ? allFiles.push({ base64: d.fileBase64, fileName: d.fileName || 'official-id', mimeType: d.mimeType || 'application/octet-stream' }) - 1 : -1;
      parts.push('General director: ' + escapeHtml(d.fullName) + ', DOB: ' + escapeHtml(d.dateOfBirth) + ', Country: ' + escapeHtml(d.countryOfResidence) + ' — ' + downloadLink(d.fileName, idx));
    });
    (q5_1.boardMembers || []).forEach(function (d) {
      var idx = d.fileBase64 ? allFiles.push({ base64: d.fileBase64, fileName: d.fileName || 'official-id', mimeType: d.mimeType || 'application/octet-stream' }) - 1 : -1;
      parts.push('Member of board: ' + escapeHtml(d.fullName) + ', DOB: ' + escapeHtml(d.dateOfBirth) + ', Country: ' + escapeHtml(d.countryOfResidence) + ' — ' + downloadLink(d.fileName, idx));
    });
    return '<div class="list-item">' + parts.join('</div><div class="list-item">') + '</div>';
  }

  function formatQ5_2(q5_2) {
    if (!q5_2 || q5_2.length === 0) return '';
    return q5_2.map(function (s) {
      var line = 'Full name: ' + escapeHtml(s.fullName) + ', Number of shares: ' + escapeHtml(s.numberOfShares);
      if (s.curp) line += ', CURP: ' + escapeHtml(s.curp);
      if (s.rfc) line += ', RFC: ' + escapeHtml(s.rfc);
      if (s.taxNumber) line += ', Tax number: ' + escapeHtml(s.taxNumber);
      return '<div class="list-item">' + line + '</div>';
    }).join('');
  }

  function formatQ6(q6) {
    if (!q6 || q6.length === 0) return '';
    return q6.map(function (u) {
      var fileIdx = u.fileBase64 ? allFiles.push({ base64: u.fileBase64, fileName: u.fileName || 'proof-of-address', mimeType: u.mimeType || 'application/octet-stream' }) - 1 : -1;
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
      html += '<br>Declaration: ' + escapeHtml(u.declaration);
      html += '<br>' + downloadLink(u.fileName, fileIdx);
      html += '</div>';
      return html;
    }).join('');
  }

  if (!data) {
    noDataEl.hidden = false;
    tableWrap.hidden = true;
    return;
  }

  noDataEl.hidden = true;
  tableWrap.hidden = false;

  var rows = [];
  rows.push(row('1. Is the company currently engaged in any of the following activities?', formatList(data.q1)));
  if (data.q1_1 != null) rows.push(row('1.1. How long has the company been engaged in this activity?', escapeHtml(data.q1_1)));
  rows.push(row('2. Does the company operate in or have direct relationships with any of the following jurisdictions?', escapeHtml(data.q2)));
  rows.push(row('3. Who are your 3 main providers by volume?', formatQ3(data.q3)));
  rows.push(row('4. Which segment represents the clients you have?', escapeHtml(data.q4)));
  if (data.q4_1 != null) rows.push(row('4.1. Who are your 3 main clients by volume?', formatQ3(data.q4_1)));
  rows.push(row('5. Please explain your business model.', '<pre style="margin:0; white-space:pre-wrap; font-family:inherit;">' + escapeHtml(data.q5) + '</pre>'));
  rows.push(row('5.1. Other Administrators or Directors', formatQ5_1(data.q5_1)));
  rows.push(row('5.2. Information from shareholders', formatQ5_2(data.q5_2)));
  rows.push(row('6. Please provide information of the UBO\'s', formatQ6(data.q6)));
  rows.push(row('7. I declare under oath that the information in this form is true and accurate...', escapeHtml(data.q7)));
  rows.push(row('8. I declare that I am not a politically exposed person (PEP)...', escapeHtml(data.q8)));
  if (data.signature) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<th>Add your signature</th><td><img alt="Signature" class="signature-image"></td>';
    tr.querySelector('img').src = data.signature;
    rows.push(tr);
  }

  rows.forEach(function (r) { tbody.appendChild(r); });

  tbody.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-download-idx]');
    if (!link) return;
    e.preventDefault();
    var idx = parseInt(link.getAttribute('data-download-idx'), 10);
    var file = allFiles[idx];
    if (!file || !file.base64) return;
    try {
      var binary = atob(file.base64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var blob = new Blob([bytes], { type: file.mimeType || 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = file.fileName || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  });
})();
