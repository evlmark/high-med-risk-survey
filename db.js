const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[db] DATABASE_URL is not set. Set it to your PostgreSQL connection string.');
}

// Railway (and most managed Postgres) require SSL for external connections.
// Allow disabling via DATABASE_SSL=false for local Docker/dev.
function sslConfig() {
  const flag = (process.env.DATABASE_SSL || '').toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'off') return false;
  if (flag === 'true' || flag === '1' || flag === 'on') return { rejectUnauthorized: false };
  // Auto: enable SSL for remote hosts, disable for localhost and Railway's
  // private network (postgres.railway.internal), where the standard Postgres
  // image runs without SSL. Override anytime with DATABASE_SSL=true/false.
  if (!connectionString) return false;
  if (/localhost|127\.0\.0\.1|\.railway\.internal/.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString,
  ssl: sslConfig(),
  max: 5,
});

pool.on('error', function (err) {
  console.error('[db] Unexpected pool error:', err.message);
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      survey_type TEXT NOT NULL,
      legal_rep_name TEXT,
      email TEXT,
      language TEXT,
      answers JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      field TEXT,
      file_name TEXT,
      mime_type TEXT,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_files_submission ON files(submission_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(survey_type);');
  console.log('[db] Schema ready.');
}

module.exports = { pool, initDb };
