const PDFDocument = require('pdfkit');
const zlib = require('zlib');

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// The signature arrives as client-supplied base64 inside answers, and pdfkit hands PNG
// pixel data to png-js, which inflates it in a zlib callback. A corrupt IDAT stream
// therefore throws *asynchronously*, escapes the try/catch below and takes the whole
// process down — one bad submission would kill the service on every PDF download.
// Inflate it ourselves first: zlib.inflateSync throws synchronously and is catchable,
// so anything pdfkit would choke on is rejected here instead.
function isRenderablePng(buf) {
  try {
    if (!Buffer.isBuffer(buf) || buf.length < 8 || !buf.subarray(0, 8).equals(PNG_MAGIC)) return false;
    const idat = [];
    let sawIhdr = false;
    let offset = 8;
    while (offset + 8 <= buf.length) {
      const length = buf.readUInt32BE(offset);
      const type = buf.toString('ascii', offset + 4, offset + 8);
      const dataStart = offset + 8;
      if (dataStart + length > buf.length) return false; // truncated chunk
      if (type === 'IHDR') sawIhdr = true;
      else if (type === 'IDAT') idat.push(buf.subarray(dataStart, dataStart + length));
      else if (type === 'IEND') break;
      offset = dataStart + length + 4; // + CRC
    }
    if (!sawIhdr || !idat.length) return false;
    zlib.inflateSync(Buffer.concat(idat));
    return true;
  } catch (e) {
    return false;
  }
}

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
      q2_1: '5.1. Jurisdictions where the company operates or has direct relationships',
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
    q2_1: '5.1. Jurisdictions where the company operates or has direct relationships',
    q3: '6. Who are your 3 main providers by volume?',
    q4: '7. Which segment represents the clients you have?',
    q4_1: '7.1. Who are your 3 main clients by volume?',
    q5: '8. Please explain your business model.',
    q6: '9. Information of every UBO holding, directly or indirectly, 25% or more of the capital stock (proof of address + Tax Status Certificate / CSF).',
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
  return q6.map(function (u, idx) {
    const lines = [];
    lines.push('UBO #' + (idx + 1) + ': ' + (u.uboFullName || ''));
    lines.push('  Proof of address file: ' + (u.fileName || '—'));
    lines.push('  Tax Status Certificate (CSF) file: ' + (u.csfFileName || '—'));
    return lines.join('\n');
  }).join('\n\n');
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
  if (a.q2_1) push('q2_1', a.q2_1);
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
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('Signature');
        doc.moveDown(0.2);
        let buf = null;
        try {
          buf = Buffer.from(sig.split(',')[1] || '', 'base64');
        } catch (e) {
          buf = null;
        }
        if (buf && isRenderablePng(buf)) {
          doc.image(buf, { width: 200 });
        } else {
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
