const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool, initDb } = require('./db');
const auth = require('./auth');
const { buildSubmissionPdf } = require('./pdf');

const app = express();
const port = process.env.PORT || 3333;

// Per-file cap must match the client-side limit in survey.js / survey-high.js.
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_SUBMISSION = 60;

app.set('trust proxy', 1); // behind Railway's proxy (correct req.secure / x-forwarded-proto)
app.disable('x-powered-by');

app.use(helmet({
  // Subresources are same-origin and relative; upgrading them breaks plain-HTTP local dev.
  contentSecurityPolicy: { useDefaults: true, directives: { upgradeInsecureRequests: null } },
  // Cross-origin isolation headers are not needed and block the logo in some embeds.
  crossOriginEmbedderPolicy: false,
}));

// A survey with ~10 MB attachments per file needs headroom, but nowhere near the
// old 50 MB: that let anyone bloat the database with a single anonymous request.
app.use(express.json({ limit: '15mb' }));

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many submissions, please try again later' },
});

// Only failed logins count, so a working session is never locked out by its own use.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many login attempts, please try again later' },
});

// ---- Static files ----
// Only ./public is public. Server sources, internal task documents, design mockups
// and node_modules live outside it and are no longer reachable over HTTP.
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'deny',
  index: false, // no directory listing / implicit index.html at "/"
}));

// ---- Helpers ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SURVEY_TYPES = ['medium', 'high', 'new_company', 'existing_company'];
const SURVEY_TYPES_WITH_EMAIL = ['medium', 'high'];

// Both the file name and the MIME type come from whatever the client uploaded, and
// both end up in response headers. Header values must be ASCII — a raw "Ñ" survives
// HTTP/1.1 but breaks the HPACK-encoded response behind Railway's HTTP/2 edge, which
// is why "CSF MARTIN QUIÑONES.pdf" would not download.

// RFC 6266: plain ASCII filename for old clients + RFC 5987 UTF-8 form for the rest.
function contentDisposition(fileName) {
  const name = String(fileName || 'file');
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
  return 'attachment; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(name);
}

// Accept only a well-formed type/subtype; anything else (empty, non-ASCII, header
// injection attempts) falls back to a generic binary type.
function safeMimeType(mimeType) {
  const mt = String(mimeType || '');
  return /^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/.test(mt) ? mt : 'application/octet-stream';
}

// Walk the answers payload, pull out base64 file blobs into a descriptor list,
// and strip the base64 from the (deep-copied) answers so the JSONB stays lean.
// Each descriptor carries a setId() that writes the new DB file id back into the
// matching answer object once the row is inserted.
function extractFiles(surveyType, answers) {
  const clean = JSON.parse(JSON.stringify(answers || {}));
  const fds = [];

  function takeMain(obj, field) {
    if (obj && obj.fileBase64) {
      const buffer = Buffer.from(obj.fileBase64, 'base64');
      const fileName = obj.fileName || null;
      const mimeType = obj.mimeType || null;
      delete obj.fileBase64;
      obj.fileId = null;
      fds.push({ field: field, fileName: fileName, mimeType: mimeType, buffer: buffer, setId: function (id) { obj.fileId = id; } });
    }
  }
  function takeSource(obj, field) {
    if (obj && obj.sourceFileBase64) {
      const buffer = Buffer.from(obj.sourceFileBase64, 'base64');
      const fileName = obj.sourceFileName || null;
      const mimeType = obj.sourceMimeType || null;
      delete obj.sourceFileBase64;
      obj.sourceFileId = null;
      fds.push({ field: field, fileName: fileName, mimeType: mimeType, buffer: buffer, setId: function (id) { obj.sourceFileId = id; } });
    }
  }
  // Medium Risk only: Constancia de Situación Fiscal (CSF), one per UBO.
  function takeCsf(obj, field) {
    if (obj && obj.csfFileBase64) {
      const buffer = Buffer.from(obj.csfFileBase64, 'base64');
      const fileName = obj.csfFileName || null;
      const mimeType = obj.csfMimeType || null;
      delete obj.csfFileBase64;
      obj.csfFileId = null;
      fds.push({ field: field, fileName: fileName, mimeType: mimeType, buffer: buffer, setId: function (id) { obj.csfFileId = id; } });
    }
  }

  // The registered-company surveys carry three standalone documents instead of
  // per-UBO uploads; their UBO list holds no files at all.
  if (surveyType === 'new_company' || surveyType === 'existing_company') {
    takeMain(clean.registrationProof, 'registrationProof');
    takeMain(clean.taxOpinion, 'taxOpinion');
    takeMain(clean.complianceProgram, 'complianceProgram');
    return { clean: clean, fds: fds };
  }

  if (Array.isArray(clean.q6)) {
    clean.q6.forEach(function (u, i) {
      takeMain(u, 'q6[' + i + '].proofOfAddress');
      takeSource(u, 'q6[' + i + '].proofOfSourceOfWealth');
      if (surveyType === 'medium') takeCsf(u, 'q6[' + i + '].csf');
    });
  }
  if (surveyType === 'high' && clean.q5_1) {
    (clean.q5_1.generalDirectors || []).forEach(function (d, i) { takeMain(d, 'q5_1.generalDirector[' + i + '].officialId'); });
    (clean.q5_1.boardMembers || []).forEach(function (d, i) { takeMain(d, 'q5_1.boardMember[' + i + '].officialId'); });
  }

  return { clean: clean, fds: fds };
}

// ---- Public: submit a survey ----
app.post('/api/submit', submitLimiter, async function (req, res) {
  try {
    const body = req.body || {};
    const surveyType = SURVEY_TYPES.indexOf(body.surveyType) >= 0 ? body.surveyType : null;
    if (!surveyType) return res.status(400).json({ error: 'invalid surveyType' });

    const answers = body.answers;
    if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'missing answers' });

    const language = body.language === 'en' ? 'en' : 'es';
    const legalRepName = (answers.legalRepName || '').toString().trim();
    const email = (answers.email || '').toString().trim();
    if (!legalRepName) return res.status(400).json({ error: 'legalRepName required' });
    // Only the Medium/High surveys ask for an email; the registered-company ones do
    // not have that question, so it is required there only if one was sent anyway.
    if (SURVEY_TYPES_WITH_EMAIL.indexOf(surveyType) >= 0) {
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'valid email required' });
    } else if (email && !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'valid email required' });
    }

    const extracted = extractFiles(surveyType, answers);

    // The browser enforces the same limits, but the endpoint is public: re-check here
    // so a hand-crafted request cannot push oversized blobs into the database.
    if (extracted.fds.length > MAX_FILES_PER_SUBMISSION) {
      return res.status(413).json({ error: 'too many files' });
    }
    const tooBig = extracted.fds.find(function (fd) { return fd.buffer.length > MAX_FILE_BYTES; });
    if (tooBig) {
      return res.status(413).json({ error: 'file too large: ' + (tooBig.fileName || tooBig.field) });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ins = await client.query(
        'INSERT INTO submissions(survey_type, legal_rep_name, email, language, answers) VALUES($1,$2,$3,$4,$5) RETURNING id',
        [surveyType, legalRepName, email, language, JSON.stringify(extracted.clean)]
      );
      const submissionId = ins.rows[0].id;
      for (const fd of extracted.fds) {
        const fr = await client.query(
          'INSERT INTO files(submission_id, field, file_name, mime_type, data) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [submissionId, fd.field, fd.fileName, fd.mimeType, fd.buffer]
        );
        fd.setId(fr.rows[0].id);
      }
      if (extracted.fds.length) {
        await client.query('UPDATE submissions SET answers=$1 WHERE id=$2', [JSON.stringify(extracted.clean), submissionId]);
      }
      await client.query('COMMIT');
      res.json({ ok: true, id: submissionId });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[submit] error:', err.message);
    res.status(500).json({ error: 'could not save submission' });
  }
});

// ---- Admin auth ----
app.post('/api/admin/login', loginLimiter, function (req, res) {
  const password = (req.body || {}).password;
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured on the server' });
  }
  if (!auth.checkPassword(password)) {
    return res.status(401).json({ error: 'invalid password' });
  }
  auth.setSessionCookie(req, res);
  res.json({ ok: true });
});

app.post('/api/admin/logout', function (req, res) {
  auth.clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/admin/me', function (req, res) {
  res.json({ authenticated: auth.isAuthenticated(req) });
});

// ---- Admin data ----
app.get('/api/admin/submissions', auth.requireAdmin, async function (req, res) {
  try {
    const type = req.query.type;
    let rows;
    if (SURVEY_TYPES.indexOf(type) >= 0) {
      rows = (await pool.query(
        'SELECT id, survey_type, legal_rep_name, email, answers->>\'companyName\' AS company_name, language, created_at FROM submissions WHERE survey_type=$1 ORDER BY created_at DESC',
        [type]
      )).rows;
    } else {
      rows = (await pool.query(
        'SELECT id, survey_type, legal_rep_name, email, answers->>\'companyName\' AS company_name, language, created_at FROM submissions ORDER BY created_at DESC'
      )).rows;
    }
    res.json({ submissions: rows });
  } catch (err) {
    console.error('[submissions] error:', err.message);
    res.status(500).json({ error: 'query failed' });
  }
});

app.get('/api/admin/submissions/:id', auth.requireAdmin, async function (req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'bad id' });
    const sub = (await pool.query('SELECT * FROM submissions WHERE id=$1', [id])).rows[0];
    if (!sub) return res.status(404).json({ error: 'not found' });
    const files = (await pool.query(
      'SELECT id, field, file_name, mime_type FROM files WHERE submission_id=$1 ORDER BY id',
      [id]
    )).rows;
    res.json({ submission: sub, files: files });
  } catch (err) {
    console.error('[submission] error:', err.message);
    res.status(500).json({ error: 'query failed' });
  }
});

app.get('/api/admin/files/:id', auth.requireAdmin, async function (req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'bad id' });
    const f = (await pool.query('SELECT file_name, mime_type, data FROM files WHERE id=$1', [id])).rows[0];
    if (!f) return res.status(404).json({ error: 'not found' });
    res.setHeader('Content-Type', safeMimeType(f.mime_type));
    res.setHeader('Content-Disposition', contentDisposition(f.file_name || ('file-' + id)));
    res.send(f.data);
  } catch (err) {
    console.error('[file] error:', err.message);
    res.status(500).json({ error: 'download failed' });
  }
});

app.get('/api/admin/submissions/:id/pdf', auth.requireAdmin, async function (req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'bad id' });
    const sub = (await pool.query('SELECT * FROM submissions WHERE id=$1', [id])).rows[0];
    if (!sub) return res.status(404).json({ error: 'not found' });
    const buf = await buildSubmissionPdf(sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition('submission-' + id + '.pdf'));
    res.send(buf);
  } catch (err) {
    console.error('[pdf] error:', err.message);
    res.status(500).json({ error: 'pdf failed' });
  }
});

// ---- Not found ----
// The root used to serve a landing page listing both surveys and the admin panel.
// Clients get direct links to /medium.html and /high.html instead, so "/" and every
// other unknown path answer a bare 404 that reveals nothing about what exists.
app.use(function (req, res) {
  res.status(404).type('text/plain').send('Not Found');
});

// ---- Last-resort net ----
// Some dependencies (pdfkit's PNG decoder, for one) throw from native callbacks where
// no request-level try/catch can reach them. Default behaviour is to kill the process,
// which turns one malformed stored row into an outage for every client filling the form.
// Log loudly and keep serving; Railway still restarts us if the process really dies.
process.on('uncaughtException', function (err) {
  console.error('[fatal] uncaught exception (server kept alive):', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', function (reason) {
  console.error('[fatal] unhandled rejection (server kept alive):', reason);
});

// ---- Start ----
initDb().catch(function (err) {
  console.error('[db] init failed (server will still start; DB ops will fail until fixed):', err.message);
});

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[auth] WARNING: ADMIN_PASSWORD is not set — admin login will be disabled.');
}

app.listen(port, '0.0.0.0', function () {
  console.log('Survey app listening on port', port);
});
