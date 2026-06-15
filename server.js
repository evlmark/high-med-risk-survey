const express = require('express');
const path = require('path');
const { pool, initDb } = require('./db');
const auth = require('./auth');
const { buildSubmissionPdf } = require('./pdf');

const app = express();
const port = process.env.PORT || 3333;

app.set('trust proxy', 1); // behind Railway's proxy (correct req.secure / x-forwarded-proto)
app.use(express.json({ limit: '50mb' }));

// ---- Static files ----
app.use(express.static(__dirname));

// ---- Helpers ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (Array.isArray(clean.q6)) {
    clean.q6.forEach(function (u, i) {
      takeMain(u, 'q6[' + i + '].proofOfAddress');
      takeSource(u, 'q6[' + i + '].proofOfSourceOfWealth');
    });
  }
  if (surveyType === 'high' && clean.q5_1) {
    (clean.q5_1.generalDirectors || []).forEach(function (d, i) { takeMain(d, 'q5_1.generalDirector[' + i + '].officialId'); });
    (clean.q5_1.boardMembers || []).forEach(function (d, i) { takeMain(d, 'q5_1.boardMember[' + i + '].officialId'); });
  }

  return { clean: clean, fds: fds };
}

// ---- Public: submit a survey ----
app.post('/api/submit', async function (req, res) {
  try {
    const body = req.body || {};
    const surveyType = body.surveyType === 'high' ? 'high' : (body.surveyType === 'medium' ? 'medium' : null);
    if (!surveyType) return res.status(400).json({ error: 'invalid surveyType' });

    const answers = body.answers;
    if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'missing answers' });

    const language = body.language === 'en' ? 'en' : 'es';
    const legalRepName = (answers.legalRepName || '').toString().trim();
    const email = (answers.email || '').toString().trim();
    if (!legalRepName) return res.status(400).json({ error: 'legalRepName required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'valid email required' });

    const extracted = extractFiles(surveyType, answers);

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
app.post('/api/admin/login', function (req, res) {
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
    if (type === 'medium' || type === 'high') {
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
    res.setHeader('Content-Type', f.mime_type || 'application/octet-stream');
    const safeName = (f.file_name || ('file-' + id)).replace(/"/g, '');
    res.setHeader('Content-Disposition', 'attachment; filename="' + safeName + '"');
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
    res.setHeader('Content-Disposition', 'attachment; filename="submission-' + id + '.pdf"');
    res.send(buf);
  } catch (err) {
    console.error('[pdf] error:', err.message);
    res.status(500).json({ error: 'pdf failed' });
  }
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
