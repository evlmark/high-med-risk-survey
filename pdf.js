const PDFDocument = require('pdfkit');

// English (canonical) question labels with the displayed numbering.
// Internal answer keys are unchanged; only the display number/text differs by survey type.
function labelsFor(type) {
  if (type === 'high') {
    return {
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
      q5_1: '8.1. Other Administrators or Directors',
      q5_2: '8.2. Information from shareholders',
      q6: "9. UBO information",
      q7: '10. I declare under oath that the information in this form is true and accurate, and that I have not omitted any relevant information.',
      q8: '11. I declare that I am not a politically exposed person (PEP), nor the company’s UBOs, shareholders or other legal representatives.',
    };
  }
  return {
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
    q6: "9. Please provide all of the UBO's proof of address.",
    q7: '10. I declare under oath that the information in this form is true and accurate, and that I have not omitted any relevant information.',
    q8: '11. I declare that I am not a politically exposed person (PEP), nor the company’s UBOs, shareholders or other legal representatives.',
  };
}

function fmtEntities(group) {
  if (!group) return '';
  const lines = [];
  (group.individuals || []).forEach(function (i) {
    lines.push('Individual: ' + (i.fullName || '') + ' | RFC: ' + (i.rfc || '') + ' | CURP: ' + (i.curp || ''));
  });
  (group.companies || []).forEach(function (c) {
    lines.push('Company: ' + (c.fullLegalName || '') + ' | RFC: ' + (c.rfc || ''));
  });
  return lines.join('\n');
}

function fmtDirectors(q5_1) {
  if (!q5_1) return '';
  const lines = [];
  (q5_1.generalDirectors || []).forEach(function (d) {
    lines.push('General director: ' + (d.fullName || '') + ' | DOB: ' + (d.dateOfBirth || '') +
      ' | Country: ' + (d.countryOfResidence || '') + ' | ID file: ' + (d.fileName || '—'));
  });
  (q5_1.boardMembers || []).forEach(function (d) {
    lines.push('Board member: ' + (d.fullName || '') + ' | DOB: ' + (d.dateOfBirth || '') +
      ' | Country: ' + (d.countryOfResidence || '') + ' | ID file: ' + (d.fileName || '—'));
  });
  return lines.join('\n');
}

function fmtShareholders(q5_2) {
  if (!q5_2 || !q5_2.length) return '';
  return q5_2.map(function (s) {
    let line = 'Name: ' + (s.fullName || '') + ' | Ownership: ' + (s.numberOfShares || '');
    if (s.curp) line += ' | CURP: ' + s.curp;
    if (s.rfc) line += ' | RFC: ' + s.rfc;
    if (s.taxNumber) line += ' | Tax: ' + s.taxNumber;
    return line;
  }).join('\n');
}

function fmtUboHigh(q6) {
  if (!q6 || !q6.length) return '';
  return q6.map(function (u, idx) {
    const lines = [];
    lines.push('UBO #' + (idx + 1) + ': ' + (u.uboFullName || ''));
    lines.push('  Ownership: ' + (u.ownershipPercentage || '—') + ' | Position: ' + (u.positionOrTitle || '—'));
    if (u.expertise) lines.push('  Expertise: ' + u.expertise);
    if (u.roleAndResponsibilities) lines.push('  Role: ' + u.roleAndResponsibilities);
    if (u.decisionsFunds) lines.push('  Decisions on funds: ' + u.decisionsFunds);
    let amount = u.amountContributed || '—';
    if (u.amountSpecify) amount += ' (' + u.amountSpecify + ')';
    lines.push('  Amount contributed: ' + amount);
    let howlong = u.howLongContributed || '—';
    if (u.howLongSpecify) howlong += ' (' + u.howLongSpecify + ')';
    lines.push('  How long contributing: ' + howlong);
    if (u.sourceOfWealth && u.sourceOfWealth.length) {
      let src = u.sourceOfWealth.join('; ');
      if (u.sourceOtherSpecify) src += ' (' + u.sourceOtherSpecify + ')';
      lines.push('  Source of wealth: ' + src);
    }
    if (u.sourceFileName) lines.push('  Proof of source of wealth file: ' + u.sourceFileName);
    lines.push('  Proof of address file: ' + (u.fileName || '—'));
    lines.push('  Declaration of lawful origin: ' + (u.declaration || '—'));
    return lines.join('\n');
  }).join('\n\n');
}

function fmtUboMedium(q6) {
  if (!q6 || !q6.length) return '';
  return q6.map(function (u) {
    return (u.uboFullName || '') + ' | Proof of address file: ' + (u.fileName || '—');
  }).join('\n');
}

function buildRows(submission) {
  const a = submission.answers || {};
  const type = submission.survey_type;
  const L = labelsFor(type);
  const rows = [];
  const push = function (key, value) {
    if (value === undefined || value === null || value === '') return;
    rows.push([L[key] || key, value]);
  };

  push('legalRepName', a.legalRepName);
  push('companyName', a.companyName);
  push('email', a.email);
  push('q1', Array.isArray(a.q1) ? a.q1.join('\n') : a.q1);
  if (a.q1_1) push('q1_1', a.q1_1);
  push('q2', a.q2);
  push('q3', fmtEntities(a.q3));
  push('q4', a.q4);
  if (a.q4_1) push('q4_1', fmtEntities(a.q4_1));
  push('q5', a.q5);
  if (type === 'high') {
    push('q5_1', fmtDirectors(a.q5_1));
    push('q5_2', fmtShareholders(a.q5_2));
    push('q6', fmtUboHigh(a.q6));
  } else {
    push('q6', fmtUboMedium(a.q6));
  }
  push('q7', a.q7);
  push('q8', a.q8);
  return rows;
}

// Returns a Promise<Buffer> with the rendered PDF.
function buildSubmissionPdf(submission) {
  return new Promise(function (resolve, reject) {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', function (c) { chunks.push(c); });
      doc.on('end', function () { resolve(Buffer.concat(chunks)); });
      doc.on('error', reject);

      const type = submission.survey_type === 'high' ? 'High Risk' : 'Medium Risk';
      const created = submission.created_at ? new Date(submission.created_at).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '';

      doc.fontSize(18).font('Helvetica-Bold').text(type + ' Survey — Submission #' + submission.id);
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#555');
      doc.text('Legal representative: ' + (submission.legal_rep_name || '—'));
      doc.text('Email: ' + (submission.email || '—'));
      doc.text('Language filled: ' + (submission.language || '—'));
      doc.text('Submitted: ' + created);
      doc.fillColor('#000');
      doc.moveDown(0.8);

      const rows = buildRows(submission);
      rows.forEach(function (r) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text(r[0]);
        doc.moveDown(0.15);
        doc.fontSize(10).font('Helvetica').fillColor('#333').text(String(r[1]), { paragraphGap: 2 });
        doc.moveDown(0.6);
      });

      // Signature image (kept inline in answers as a data URL)
      const sig = submission.answers && submission.answers.signature;
      if (sig && typeof sig === 'string' && sig.indexOf('data:image') === 0) {
        try {
          const b64 = sig.split(',')[1];
          const buf = Buffer.from(b64, 'base64');
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('Signature');
          doc.moveDown(0.2);
          doc.image(buf, { width: 200 });
        } catch (e) {
          doc.fontSize(10).font('Helvetica').fillColor('#999').text('(signature could not be rendered)');
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildSubmissionPdf };
