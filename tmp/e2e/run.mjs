import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:3100/api/v1';
const OUT = 'tmp/e2e/out';
const deviceId = process.env.DEVICE ?? randomUUID();
const H = { 'X-Device-Id': deviceId };
const t0 = Date.now(); const ts = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
const save = (name, data) => writeFileSync(`${OUT}/${name}.json`, JSON.stringify(data, null, 2));
async function call(method, path, body, { raw = false } = {}) {
  const init = { method, headers: { ...H } };
  if (body instanceof FormData) init.body = body; else if (body !== undefined) { init.body = JSON.stringify(body); init.headers['Content-Type'] = 'application/json'; }
  const started = Date.now(); const res = await fetch(BASE + path, init);
  const ms = Date.now() - started;
  if (raw) return { status: res.status, ms, buf: Buffer.from(await res.arrayBuffer()) };
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, ms, json };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const step = process.argv[2] ?? 'all';
console.log('device', deviceId);

let r = await call('POST', '/devices', { platform: 'android', appVersion: '1.0.0', locale: 'ar-EG', region: 'EG' });
console.log(ts(), 'POST /devices', r.status);

// 1. upload → analysis
const form = new FormData();
form.append('file', new Blob([readFileSync('tmp/e2e/omar-ai-engineer.pdf')], { type: 'application/pdf' }), 'Omar_Khaled_CV.pdf');
r = await call('POST', '/cv/uploads', form); console.log(ts(), 'POST /cv/uploads', r.status, JSON.stringify(r.json).slice(0, 200));
const uploadId = r.json.uploadId;
let upload;
for (;;) { upload = await call('GET', `/cv/uploads/${uploadId}`); if (upload.json.status !== 'parsing') break; await sleep(1500); }
console.log(ts(), 'upload done', upload.json.status); save('1-upload', upload.json);

r = await call('GET', '/cv'); console.log(ts(), 'GET /cv', r.status); save('2-cv', r.json);

// 2. preferences: Germany, any city, every work type
r = await call('PUT', '/preferences', { country: 'DE', city: null, workTypes: ['on_site', 'hybrid', 'remote'], willingToRelocate: true });
console.log(ts(), 'PUT /preferences', r.status, JSON.stringify(r.json)); save('3-preferences', r.json);

// 3. matches — poll while "searching", exactly like the app
let polls = 0; let matches;
for (;;) {
  matches = await call('GET', '/jobs/matches'); polls++;
  console.log(ts(), `GET /jobs/matches #${polls}`, matches.status, matches.json.status, `${matches.json.jobs?.length ?? '-'} jobs`, `${matches.ms}ms`, (matches.json.jobs ?? []).map((j) => j.match).join(','));
  if (matches.status !== 200 || matches.json.status !== 'searching') break;
  await sleep(3000); // the app's new poll interval
}
save('4-matches', matches.json);
for (const j of matches.json.jobs ?? []) console.log(`   ${j.match}% ${j.title} | ${j.company} | locations=${JSON.stringify(j.locations)}
      why=${JSON.stringify(j.whyMatch)} gaps=${JSON.stringify(j.gaps)}`);
// Limits: what the app would show if it ever sent these.
r = await call('POST', '/applications', { jobIds: Array.from({ length: 21 }, (_, i) => `job_${i}`) }); console.log(ts(), 'POST /applications ×21 →', r.status, JSON.stringify(r.json));
r = await call('PUT', '/preferences', { country: 'DE', city: null, workTypes: [] }); console.log(ts(), 'PUT /preferences workTypes=[] →', r.status, JSON.stringify(r.json));
r = await call('PUT', '/preferences', { country: 'DE', city: null, workTypes: ['on_site', 'hybrid', 'remote'], willingToRelocate: true });
// a second call — cache path timing
r = await call('GET', '/jobs/matches'); console.log(ts(), 'GET /jobs/matches (again)', r.status, `${r.ms}ms`);

// 4. apply to every match
const ids = (matches.json.jobs ?? []).slice(0, 2).map((j) => j.id); // like the user's test: two jobs
r = await call('POST', '/applications', { jobIds: ids }); console.log(ts(), 'POST /applications', r.status, JSON.stringify(r.json).slice(0, 300));
const batchId = r.json.batchId; let batch;
for (;;) { batch = await call('GET', `/applications/batches/${batchId}`); if (batch.json.status !== 'processing') break; await sleep(1500); }
console.log(ts(), 'batch', batch.json.status, JSON.stringify(batch.json.progress)); save('5-batch', batch.json);
r = await call('GET', '/applications'); save('6-applications', r.json);
for (const app of r.json.applications ?? r.json) {
  const pdf = await call('GET', `/applications/${app.id}/cv`, undefined, { raw: true });
  writeFileSync(`${OUT}/cv-${app.id}.pdf`, pdf.buf);
  console.log(ts(), 'tailored CV', app.id, app.status, app.job.title, pdf.status, `${pdf.buf.length}B`);
}
console.log(ts(), 'done');
