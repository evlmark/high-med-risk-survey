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
    if (/UPDATE submissions SET docs_attached/.test(sql)) return { rows: [{ docs_attached: params[0] }] };
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
    ['/test/smoke.js', 404], ['/advanced-edd.html', 200], ['/survey-edd.js', 200],
    ['/basic-edd.html', 200], ['/survey-basic-edd.js', 200], ['/countries.js', 200],
  ]) {
    const r = await fetch(BASE + p);
    check(`static ${p} -> ${want}`, r.status === want, `got ${r.status}`);
  }

  // ---- build version + revalidation ----
  const verRes = await fetch(BASE + '/api/admin/me');
  check('api responses carry X-App-Version', !!verRes.headers.get('x-app-version'), 'missing');
  const jsRes = await fetch(BASE + '/admin.js');
  check('scripts are served no-cache', jsRes.headers.get('cache-control') === 'no-cache', jsRes.headers.get('cache-control'));
  const htmlRes = await fetch(BASE + '/admin.html');
  check('pages are served no-cache', htmlRes.headers.get('cache-control') === 'no-cache', htmlRes.headers.get('cache-control'));

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

  // ---- Basic EDD (no documents) ----
  const basicAnswers = () => ({
    legalRepName: 'Luis Prieto', companyName: 'Mediana SA de CV',
    cashShare: '21% - 40%', averageTicket: '1500',
    channels: [{ channel: 'Online', detail: 'www.mediana.mx' }, { channel: 'In-store', detail: 'Av. Reforma 1' }],
    customers: { types: ['Individuals', 'Other'], other: 'Hoteles' },
    suppliers: [{ name: 'Proveedor Uno', country: 'MX' }, { name: 'Supplier Two', country: 'US' }],
    wireTransfers: 'Yes, receive only', wireCountries: ['US', 'CN'],
    operatesAbroad: 'No', abroadCountries: [],
    seasonal: 'Yes', seasonalMonths: [6, 7, 12],
    ubos: [{ fullName: 'Ana Prieto', experience: ['Founded or actively managed a business carrying out the same activity'],
      functions: ['Manages day-to-day business operations', 'Other'], functionsOther: 'Firma contratos' }],
    declarationOath: 'Yes', declarationPep: 'Yes',
    signature: 'data:image/png;base64,' + b64(50),
  });
  queries.length = 0;
  const be1 = await post('/api/submit', { surveyType: 'basic_edd', language: 'es', answers: basicAnswers() });
  check('basic edd: submit 200 without email', be1.status === 200, be1.status + ' ' + be1.body);
  check('basic edd: no file rows', !queries.some((q) => /INSERT INTO files/.test(q.sql)), '');
  const beIns = queries.find((q) => /INSERT INTO submissions/.test(q.sql));
  const beStored = beIns ? JSON.parse(beIns.params[4]) : {};
  check('basic edd: answers stored as sent', beIns && beIns.params[0] === 'basic_edd' &&
    JSON.stringify(beStored.wireCountries) === '["US","CN"]' && beStored.ubos[0].functionsOther === 'Firma contratos', beIns ? beIns.params[4].slice(0, 80) : 'no insert');

  // ---- Advanced EDD ----
  const doc = (name, n) => ({ fileName: name, fileBase64: b64(n), mimeType: 'application/pdf' });
  const eddAnswers = (extra) => Object.assign({
    legalRepName: 'Rosa Medina', companyName: 'Grande SA de CV',
    licenses: { notRequired: false, description: 'Licencia sanitaria COFEPRIS', files: [doc('cofepris.pdf', 300), doc('municipal.pdf', 310)] },
    padron: { notRequired: false, explanation: '', files: [doc('acuse-padron.pdf', 320)] },
    vaNotices: { files: [doc('aviso-ago.pdf', 330), doc('aviso-sep.pdf', 340), doc('aviso-oct.pdf', 350)] },
    taxReturn: { files: [doc('anual-2025.pdf', 360)] },
    photos: { files: [doc('p1.jpg', 370), doc('p2.jpg', 380), doc('p3.jpg', 390)] },
    declarationOath: 'Yes', declarationPep: 'Yes',
    signature: 'data:image/png;base64,' + b64(50),
  }, extra || {});

  queries.length = 0;
  const e1 = await post('/api/submit', { surveyType: 'advanced_edd', language: 'es', answers: eddAnswers() });
  check('edd: submit 200 without email', e1.status === 200, e1.status + ' ' + e1.body);
  const eRows = queries.filter((q) => /INSERT INTO files/.test(q.sql));
  check('edd: every file stored under its group',
    JSON.stringify(eRows.map((q) => q.params[1])) === JSON.stringify([
      'licenses[0]', 'licenses[1]', 'padron[0]', 'vaNotices[0]', 'vaNotices[1]', 'vaNotices[2]',
      'taxReturn[0]', 'photos[0]', 'photos[1]', 'photos[2]']),
    JSON.stringify(eRows.map((q) => q.params[1])));
  check('edd: file bytes intact', eRows.map((q) => q.params[4].length).join(',') === '300,310,320,330,340,350,360,370,380,390', '');
  const eUpd = queries.filter((q) => /UPDATE submissions SET answers/.test(q.sql)).pop();
  const ea = JSON.parse(eUpd.params[0]);
  check('edd: no base64 left', !/fileBase64/.test(eUpd.params[0]), '');
  check('edd: fileIds back-written', ea.photos.files.every((f) => !!f.fileId) && ea.vaNotices.files.length === 3, '');
  check('edd: license text kept', ea.licenses.description === 'Licencia sanitaria COFEPRIS', '');

  queries.length = 0;
  const e2 = await post('/api/submit', { surveyType: 'advanced_edd', language: 'en', answers: eddAnswers({
    licenses: { notRequired: true, description: '', files: [] },
    padron: { notRequired: true, explanation: 'No realizamos actividades vulnerables', files: [] },
    vaNotices: null,
  }) });
  const e2Fields = queries.filter((q) => /INSERT INTO files/.test(q.sql)).map((q) => q.params[1]);
  check('edd: not-required path stores only tax + photos', e2.status === 200 &&
    JSON.stringify(e2Fields) === JSON.stringify(['taxReturn[0]', 'photos[0]', 'photos[1]', 'photos[2]']), e2.status + ' ' + JSON.stringify(e2Fields));

  // Body limits: 50 MB only for Advanced EDD, 15 MB for the rest, tiny elsewhere.
  const big = (n) => doc('big.pdf', n);
  const e3 = await post('/api/submit', { surveyType: 'advanced_edd', language: 'es', answers: eddAnswers({
    taxReturn: { files: [big(7 * 1024 * 1024), big(7 * 1024 * 1024)] } }) });
  check('edd: ~20 MB body accepted', e3.status === 200, e3.status + ' ' + e3.body.slice(0, 80));
  const m3 = await post('/api/submit', { surveyType: 'medium', language: 'es',
    answers: baseAnswers([ubo('Big1', 6 * 1024 * 1024, 10), ubo('Big2', 6 * 1024 * 1024, 10)]) });
  check('medium: >15 MB body still refused', m3.status === 413, m3.status);
  const loginBig = await post('/api/admin/login', { password: 'x'.repeat(200 * 1024) }, '198.51.100.90');
  check('admin login: large body refused', loginBig.status === 413, loginBig.status);

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

  // ---- deep search over answers ----
  // A fresh medium submission whose company is only named inside q3 providers.
  await post('/api/submit', { surveyType: 'medium', language: 'es',
    answers: Object.assign(baseAnswers([ubo('Z', 10, 10)]), {
      legalRepName: 'Someone Else', companyName: 'Front Co', email: 'filler@x.com',
      q3: { individuals: [], companies: [{ fullLegalName: 'HIDDEN TARGET SA DE CV', rfc: 'HTS010101AAA' }] },
    }) }, '198.51.100.77');
  // The stub does not persist, so assert the query SHAPE the endpoint builds instead:
  const srch = await fetch(BASE + '/api/admin/submissions?q=HIDDEN%20TARGET', { headers: { cookie } });
  const srchQ = queries.filter((x) => /FROM submissions WHERE/.test(x.sql)).pop();
  check('deep search 200', srch.status === 200, srch.status);
  check('deep search hits answers::text', srchQ && /answers::text ILIKE/.test(srchQ.sql), srchQ && srchQ.sql);
  check('deep search is parameterized', srchQ && srchQ.params && srchQ.params[0] === '%HIDDEN TARGET%', srchQ && JSON.stringify(srchQ.params));
  const both = await fetch(BASE + '/api/admin/submissions?type=medium&q=abc', { headers: { cookie } });
  const bq = queries.filter((x) => /FROM submissions WHERE/.test(x.sql)).pop();
  check('search + type combine', both.status === 200 && /survey_type=\$1 AND/.test(bq.sql), bq && bq.sql);

  // ---- CSV export ----
  const exp = await fetch(BASE + '/api/admin/submissions/export.csv', { headers: { cookie } });
  const expText = await exp.text();
  check('export needs auth', (await fetch(BASE + '/api/admin/submissions/export.csv')).status === 401, '');
  check('export is CSV', exp.status === 200 && /text\/csv/.test(exp.headers.get('content-type') || ''), exp.status + ' ' + exp.headers.get('content-type'));
  check('export has header row', expText.replace(/^\uFEFF/, '').split('\r\n')[0] === 'ID,Date,Type,Company,Legal representative,Email,Docs attached', JSON.stringify(expText.slice(0,80)));
  check('export route not shadowed by :id', !/bad id|not found/.test(expText), expText.slice(0,60));

  // ---- docs-attached flag ----
  check('docs-attached needs auth',
    (await post('/api/admin/submissions/5/docs-attached', { attached: true })).status === 401, '');
  const setOn = await fetch(BASE + '/api/admin/submissions/5/docs-attached', {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ attached: true }),
  });
  const setOnBody = await setOn.json();
  check('docs-attached set true', setOn.status === 200 && setOnBody.docsAttached === true, setOn.status + ' ' + JSON.stringify(setOnBody));
  check('docs-attached UPDATE ran',
    queries.some((q) => /UPDATE submissions SET docs_attached=\$1 WHERE id=\$2/.test(q.sql) && q.params[0] === true && q.params[1] === 5), '');
  const setOff = await fetch(BASE + '/api/admin/submissions/5/docs-attached', {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ attached: false }),
  });
  check('docs-attached set false', setOff.status === 200 && (await setOff.json()).docsAttached === false, setOff.status);
  const badId = await fetch(BASE + '/api/admin/submissions/0/docs-attached', {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ attached: true }),
  });
  check('docs-attached bad id -> 400', badId.status === 400, badId.status);

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
    ['basic_edd', { id: 8, survey_type: 'basic_edd', answers: basicAnswers() }],
    ['basic_edd empty', { id: 9, survey_type: 'basic_edd', answers: { legalRepName: 'X' } }],
    ['advanced_edd', { id: 6, survey_type: 'advanced_edd', answers: eddAnswers() }],
    ['advanced_edd not-required', { id: 7, survey_type: 'advanced_edd', answers: eddAnswers({ licenses: { notRequired: true, files: [] }, padron: { notRequired: true, explanation: 'n/a', files: [] }, vaNotices: null }) }],
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
