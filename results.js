(function () {
  const FORM_STORAGE_KEY = 'mediumRiskSurveyResults';

  var data;
  try {
    var raw = sessionStorage.getItem(FORM_STORAGE_KEY) || localStorage.getItem(FORM_STORAGE_KEY);
    data = raw ? JSON.parse(raw) : null;
    if (data) try { localStorage.removeItem(FORM_STORAGE_KEY); } catch (e) {}
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
    return '<div class="list-item">' + arr.map(function (item) { return escapeHtml(item); }).join('</div><div class="list-item">') + '</div>';
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

  function formatQ6(q6) {
    if (!q6 || q6.length === 0) return '';
    var parts = [];
    q6.forEach(function (item, idx) {
      var name = escapeHtml(item.uboFullName);
      var fileLabel = escapeHtml(item.fileName || 'document');
      var btn = '<a href="#" class="download-link" data-q6-index="' + idx + '">Download ' + fileLabel + '</a>';
      parts.push(name + ' — ' + btn);
    });
    return '<div class="list-item">' + parts.join('</div><div class="list-item">') + '</div>';
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

  if (data.q1_1 != null) {
    rows.push(row('1.1. How long has the company been engaged in this activity?', escapeHtml(data.q1_1)));
  }

  rows.push(row('2. Does the company operate in or have direct relationships with any of the following jurisdictions?', escapeHtml(data.q2)));

  rows.push(row('3. Who are your 3 main providers by volume?', formatQ3(data.q3)));

  rows.push(row('4. Which segment represents the clients you have?', escapeHtml(data.q4)));

  if (data.q4_1 != null) {
    rows.push(row('4.1. Who are your 3 main clients by volume?', formatQ3(data.q4_1)));
  }

  rows.push(row('5. Please explain your business model.', '<pre style="margin:0; white-space:pre-wrap; font-family:inherit;">' + escapeHtml(data.q5) + '</pre>'));

  rows.push(row('6. Please provide all of the UBO\'s proof of address.', formatQ6(data.q6)));

  rows.push(row('7. I declare under oath that the information in this form is true and accurate, and that I have not omitted any relevant information that could affect this process.', escapeHtml(data.q7)));
  rows.push(row('8. I declare that I am not a politically exposed person (PEP), nor the company\'s UBOs, shareholders or other legal representatives, nor do we have ties with public officials or authorities that could interfere with the transparency required for this relationship.', escapeHtml(data.q8)));

  if (data.signature) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<th>Add your signature</th><td><img alt="Signature" class="signature-image"></td>';
    tr.querySelector('img').src = data.signature;
    rows.push(tr);
  }

  rows.forEach(function (r) { tbody.appendChild(r); });

  // Download handlers for Q6 files
  tbody.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-q6-index]');
    if (!link || !data.q6) return;
    e.preventDefault();
    var idx = parseInt(link.getAttribute('data-q6-index'), 10);
    var item = data.q6[idx];
    if (!item || !item.fileBase64) return;
    var mime = item.mimeType || 'application/octet-stream';
    var fileName = item.fileName || 'UBO-proof-of-address';
    try {
      var binary = atob(item.fileBase64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var blob = new Blob([bytes], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  });
})();
