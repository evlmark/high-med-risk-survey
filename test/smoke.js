// Smoke tests for the survey server.
//
// Run with:  npm test
//
// There is no database here: a stub `pg` driver is injected into require.cache
// before server.js loads, so the real request path — static serving, security
// headers, extractFiles, the insert transaction, size and rate limits, download
// headers — is exercised end to end and the SQL it would run is asserted on.
const path = require('path');
const ROOT = path.join(__dirname, '..');

const queries = [];
let nextId = 100;
let fileRow = {
  file_name: 'CSF MARTIN QUIÑONES.pdf',
  mime_type: 'application/pdf',
  data: Buffer.from('%PDF-1.4\nx\n%%EOF\n'),
};

class FakeClient {
  async query(sql, params) {
    queries.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
    if (/INSERT INTO submissions/.test(sql)) return { rows: [{ id: 1 }] };
    if (/INSERT INTO files/.test(sql)) return { rows: [{ id: nextId++ }] };
    return { rows: [] };
  }
  release() {}
}
class FakePool {
  on() {}
  async connect() { return new FakeClient(); }
  async query(sql, params) {
    queries.push({ sql, params });
    if (/FROM files WHERE id/.test(sql)) return { rows: [fileRow] };
    return { rows: [] };
  }
}
const pgPath = require.resolve('pg', { paths: [ROOT] });
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: { Pool: FakePool } };

process.env.PORT = process.env.TEST_PORT || '3999';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.SESSION_SECRET = 'fixed-test-secret';
process.env.DATABASE_URL = 'postgres://stub/stub';
require(path.join(ROOT, 'server.js'));

const BASE = 'http://127.0.0.1:' + process.env.PORT;
const b64 = (n) => Buffer.alloc(n, 0x41).toString('base64');
// Rate limits are keyed by client IP. `trust proxy` is on, so a distinct
// X-Forwarded-For gives each functional assertion its own bucket and only the
// rate-limit tests below deliberately share one.
let ipSeq = 0;
const post = (p, body, ip) => fetch(BASE + p, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip || ('10.0.' + Math.floor(ipSeq / 250) + '.' + (++ipSeq % 250)) },
  body: JSON.stringify(body),
}).then(async (r) => ({ status: r.status, headers: r.headers, body: await r.text() }));

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); };

// ---- fixtures ----
function ubo(name, poaBytes, csfBytes) {
  return {
    uboFullName: name,
    fileName: name + '-poa.pdf', fileBase64: b64(poaBytes), mimeType: 'application/pdf',
    csfFileName: name + '-csf.pdf', csfFileBase64: b64(csfBytes), csfMimeType: 'application/pdf',
  };
}
const baseAnswers = (q6) => ({
  legalRepName: 'Ana López', companyName: 'Acme SA de CV', email: 'ana@acme.mx',
  q1: ['None of the above'], q1_1: null, q2: 'Yes', q2_1: 'Panamá\nHong Kong',
  q3: { individuals: [], companies: [{ fullLegalName: 'Prov SA', rfc: 'AAA010101AAA' }] },
  q4: 'x', q4_1: null, q5: 'Business model text', q6: q6, q7: 'Yes', q8: 'Yes',
  signature: 'data:image/png;base64,' + b64(50),
});
const regAnswers = (extra) => Object.assign({
  legalRepName: 'Luis Ortega', companyName: 'Nueva SA de CV',
  registrationProof: { fileName: 'padron.pdf', fileBase64: b64(500), mimeType: 'application/pdf' },
  taxOpinion: { fileName: 'opinion.pdf', fileBase64: b64(700), mimeType: 'application/pdf' },
  complianceProgram: { fileName: 'manual.pdf', fileBase64: b64(900), mimeType: 'application/pdf' },
  fundsOrigin: 'Other (specify)', fundsOriginOther: 'Venta de un terreno familiar',
  ubos: [{
    uboFullName: 'Luis Ortega', ownershipPercentage: '60%', positionOrTitle: 'CEO',
    expertise: '12 años en logística', roleAndResponsibilities: 'Dirección general',
    decisionsFunds: 'Aprueba pagos y distribución de utilidades',
  }],
  averageTicket: '$15,000.00 MXN',
  declarationOath: 'Yes', declarationPep: 'Yes',
  signature: 'data:image/png;base64,' + Buffer.alloc(50, 0x41).toString('base64'),
}, extra || {});

(async () => {
  await new Promise((r) => setTimeout(r, 700));

  // ---- only ./public is reachable over HTTP ----
  for (const [p, want] of [
    ['/', 404], ['/medium.html', 200], ['/high.html', 200], ['/admin.html', 200],
    ['/new-company.html', 200], ['/existing-company.html', 200], ['/survey-registry.js', 200],
    ['/success.html', 200], ['/styles.css', 200], ['/logo.png', 200], ['/survey.js', 200],
    ['/server.js', 404], ['/db.js', 404], ['/auth.js', 404], ['/pdf.js', 404],
    ['/package.json', 404], ['/.git/config', 404], ['/.git/HEAD', 404],
    ['/githubkey.txt', 404], ['/Task%20for%20survey.txt', 404],
    ['/DEPLOY-RAILWAY.md', 404], ['/Design/Survey-9.png', 404],
    ['/node_modules/express/package.json', 404], ['/index.html', 404],
    ['/test/smoke.js', 404],
  ]) {
    const r = await fetch(BASE + p);
    check(`static ${p} -> ${want}`, r.status === want, `got ${r.status}`);
  }

  // ---- security headers ----
  const h = (await fetch(BASE + '/medium.html')).headers;
  check('CSP header set', !!h.get('content-security-policy'), 'missing');
  check('no upgrade-insecure-requests', !/upgrade-insecure-requests/.test(h.get('content-security-policy') || ''), '');
  check('X-Content-Type-Options', h.get('x-content-type-options') === 'nosniff', h.get('x-content-type-options'));
  check('X-Frame-Options', !!h.get('x-frame-options'), h.get('x-frame-options'));
  check('HSTS', !!h.get('strict-transport-security'), h.get('strict-transport-security'));
  check('no x-powered-by', !h.get('x-powered-by'), h.get('x-powered-by'));

  // ---- Medium Risk: POA + CSF per UBO ----
  queries.length = 0;
  const ok = await post('/api/submit', {
    surveyType: 'medium', language: 'es',
    answers: baseAnswers([ubo('Ana', 1000, 2000), ubo('Beto', 3000, 4000)]),
  });
  check('submit 200', ok.status === 200, ok.status + ' ' + ok.body);

  const fileRows = queries.filter((q) => /INSERT INTO files/.test(q.sql));
  check('file fields correct',
    JSON.stringify(fileRows.map((q) => q.params[1])) ===
    JSON.stringify(['q6[0].proofOfAddress', 'q6[0].csf', 'q6[1].proofOfAddress', 'q6[1].csf']),
    JSON.stringify(fileRows.map((q) => q.params[1])));
  check('CSF bytes stored', fileRows[1].params[4].length === 2000 && fileRows[3].params[4].length === 4000, '');
  check('CSF names stored', fileRows[1].params[2] === 'Ana-csf.pdf' && fileRows[3].params[2] === 'Beto-csf.pdf', '');

  const finalUpdate = queries.filter((q) => /UPDATE submissions SET answers/.test(q.sql)).pop();
  const stored = JSON.parse(finalUpdate.params[0]);
  check('no base64 left in JSONB', !/fileBase64|csfFileBase64/.test(finalUpdate.params[0]), '');
  check('csfFileId back-written', stored.q6[0].csfFileId === 101 && stored.q6[1].csfFileId === 103, '');
  check('q2_1 stored', stored.q2_1 === 'Panamá\nHong Kong', JSON.stringify(stored.q2_1));

  // ---- High Risk is untouched by the CSF change ----
  queries.length = 0;
  const hi = await post('/api/submit', {
    surveyType: 'high', language: 'en',
    answers: Object.assign(baseAnswers([{ uboFullName: 'Cee', fileName: 'c.pdf', fileBase64: b64(10), mimeType: 'application/pdf', csfFileBase64: b64(10), csfFileName: 'ignored.pdf' }]), {
      q5_1: { generalDirectors: [{ fullName: 'D', dateOfBirth: '01-01-1980', countryOfResidence: 'MX', fileName: 'id.pdf', fileBase64: b64(20), mimeType: 'application/pdf' }], boardMembers: [] },
      q5_2: [{ fullName: 'S', numberOfShares: '30%' }],
    }),
  });
  const hiFields = queries.filter((q) => /INSERT INTO files/.test(q.sql)).map((q) => q.params[1]);
  check('high submit 200', hi.status === 200, hi.status + ' ' + hi.body);
  check('high: no csf field extracted', !hiFields.some((f) => /csf/.test(f)), JSON.stringify(hiFields));

  // ---- registered-company surveys ----
  for (const st of ['new_company', 'existing_company']) {
    queries.length = 0;
    const r = await post('/api/submit', { surveyType: st, language: 'es', answers: regAnswers() });
    check(st + ': submit 200 without email', r.status === 200, r.status + ' ' + r.body);
    const rows = queries.filter((q) => /INSERT INTO files/.test(q.sql));
    check(st + ': 3 documents stored',
      JSON.stringify(rows.map((q) => q.params[1])) === JSON.stringify(['registrationProof', 'taxOpinion', 'complianceProgram']),
      JSON.stringify(rows.map((q) => q.params[1])));
    check(st + ': document sizes', rows.map((q) => q.params[4].length).join(',') === '500,700,900',
      rows.map((q) => q.params[4].length).join(','));
    const upd = queries.filter((q) => /UPDATE submissions SET answers/.test(q.sql)).pop();
    const a = JSON.parse(upd.params[0]);
    check(st + ': no base64 left', !/fileBase64/.test(upd.params[0]), '');
    check(st + ': fileIds back-written',
      !!a.registrationProof.fileId && !!a.taxOpinion.fileId && !!a.complianceProgram.fileId, '');
    check(st + ': funds + other kept',
      a.fundsOrigin === 'Other (specify)' && a.fundsOriginOther === 'Venta de un terreno familiar', '');
    check(st + ': exactly the 6 UBO fields',
      Object.keys(a.ubos[0]).join(',') === 'uboFullName,ownershipPercentage,positionOrTitle,expertise,roleAndResponsibilities,decisionsFunds',
      Object.keys(a.ubos[0]).join(','));
    check(st + ': average ticket kept', a.averageTicket === '$15,000.00 MXN', a.averageTicket);
    check(st + ': declarations kept', a.declarationOath === 'Yes' && a.declarationPep === 'Yes', '');
    check(st + ': signature kept inline', typeof a.signature === 'string' && a.signature.indexOf('data:image') === 0, '');
    check(st + ': survey_type persisted',
      queries.find((q) => /INSERT INTO submissions/.test(q.sql)).params[0] === st, '');
  }

  queries.length = 0;
  const noOpt = await post('/api/submit', {
    surveyType: 'new_company', language: 'en', answers: regAnswers({ complianceProgram: null }),
  });
  const noOptFields = queries.filter((q) => /INSERT INTO files/.test(q.sql)).map((q) => q.params[1]);
  check('optional compliance doc may be missing',
    noOpt.status === 200 && JSON.stringify(noOptFields) === JSON.stringify(['registrationProof', 'taxOpinion']),
    noOpt.status + ' ' + JSON.stringify(noOptFields));

  // ---- validation ----
  check('medium still requires email',
    (await post('/api/submit', { surveyType: 'medium', language: 'es', answers: { legalRepName: 'X' } })).status === 400, '');
  check('new_company rejects a malformed email if sent',
    (await post('/api/submit', { surveyType: 'new_company', language: 'es', answers: regAnswers({ email: 'not-an-email' }) })).status === 400, '');
  check('unknown surveyType -> 400',
    (await post('/api/submit', { surveyType: 'brand_new', answers: { legalRepName: 'X' } })).status === 400, '');
  check('empty legalRepName -> 400',
    (await post('/api/submit', { surveyType: 'medium', answers: {} })).status === 400, '');
  check('oversized UBO file -> 413',
    (await post('/api/submit', { surveyType: 'medium', language: 'es', answers: baseAnswers([ubo('Big', 11 * 1024 * 1024, 100)]) })).status === 413, '');
  check('oversized registry document -> 413',
    (await post('/api/submit', {
      surveyType: 'existing_company', language: 'es',
      answers: regAnswers({ taxOpinion: { fileName: 'big.pdf', fileBase64: b64(11 * 1024 * 1024), mimeType: 'application/pdf' } }),
    })).status === 413, '');

  // ---- download headers must stay ASCII (HTTP/2-safe) ----
  const login = await post('/api/admin/login', { password: 'test-password-123' }, '203.0.113.12');
  const cookie = login.headers.getSetCookie()[0].split(';')[0];
  const dl = await fetch(BASE + '/api/admin/files/5', { headers: { cookie } });
  const cd = dl.headers.get('content-disposition') || '';
  check('download 200 with bytes', dl.status === 200 && (await dl.arrayBuffer()).byteLength === 17, dl.status);
  check('Content-Disposition is pure ASCII', /^[\x20-\x7E]*$/.test(cd), JSON.stringify(cd));
  const star = (cd.match(/filename\*=UTF-8''(.*)$/) || [])[1];
  check('UTF-8 name recoverable', star && decodeURIComponent(star) === 'CSF MARTIN QUIÑONES.pdf', JSON.stringify(cd));
  check('Content-Type preserved', dl.headers.get('content-type') === 'application/pdf', dl.headers.get('content-type'));

  fileRow = { file_name: 'x\r\nX-Injected: yes.pdf', mime_type: 'bogus mime; x', data: Buffer.from('%PDF-\n') };
  const dl2 = await fetch(BASE + '/api/admin/files/6', { headers: { cookie } });
  check('no header injection via file name', !dl2.headers.get('x-injected'), 'x-injected present');
  check('bogus mime -> octet-stream', dl2.headers.get('content-type') === 'application/octet-stream', dl2.headers.get('content-type'));

  // ---- rate limits and auth ----
  let submitBlocked = 0;
  for (let i = 0; i < 12; i++) {
    const r = await post('/api/submit', { surveyType: 'medium', language: 'es', answers: baseAnswers([ubo('R' + i, 10, 10)]) }, '203.0.113.10');
    if (r.status === 429) submitBlocked++;
  }
  check('submit rate-limited', submitBlocked > 0, submitBlocked + ' of 12 blocked');

  const loginCodes = [];
  for (let i = 0; i < 12; i++) loginCodes.push((await post('/api/admin/login', { password: 'wrong-' + i }, '203.0.113.11')).status);
  check('login rate-limited', loginCodes.includes(429), 'codes: ' + loginCodes.join(','));
  check('admin endpoint 401 without cookie', (await fetch(BASE + '/api/admin/submissions')).status === 401, '');

  // ---- PDF export renders every survey type, and survives a corrupt signature ----
  const { buildSubmissionPdf } = require(path.join(ROOT, 'pdf'));
  for (const [label, sub] of [
    ['medium', { id: 1, survey_type: 'medium', answers: baseAnswers([ubo('A', 10, 10)]) }],
    ['high', { id: 2, survey_type: 'high', answers: baseAnswers([ubo('A', 10, 10)]) }],
    ['new_company', { id: 3, survey_type: 'new_company', answers: regAnswers() }],
    ['existing_company', { id: 4, survey_type: 'existing_company', answers: regAnswers() }],
    ['corrupt signature', { id: 5, survey_type: 'medium', answers: Object.assign(baseAnswers([]), { signature: 'data:image/png;base64,' + Buffer.from('not a png').toString('base64') }) }],
  ]) {
    try {
      const buf = await buildSubmissionPdf(sub);
      check('pdf: ' + label, buf.length > 800, buf.length + ' bytes');
    } catch (e) {
      check('pdf: ' + label, false, e.message);
    }
  }
  await new Promise((r) => setTimeout(r, 400)); // a crash would land here, not in the catch

  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
  let failed = 0;
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${pad(r.name, 48)} ${r.ok ? '' : '| ' + r.detail}`);
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
