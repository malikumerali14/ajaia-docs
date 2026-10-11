// End-to-end API test against a real (in-memory) MongoDB and the built Next.js server.
// Opt-in: `npm run build && RUN_E2E=1 npm test`  (downloads a MongoDB binary on first run).
import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const enabled = process.env.RUN_E2E === '1';
const base = 'http://localhost:3333';
let mongo, proc;

before(async () => {
  if (!enabled) return;
  mongo = await MongoMemoryServer.create();
  proc = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3333'], {
    env: { ...process.env, MONGODB_URI: mongo.getUri() }, stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try { await fetch(base + '/api/me'); return; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  throw new Error('server did not start');
});
after(async () => { proc?.kill(); await mongo?.stop(); });

const call = (user, method, url, body) =>
  fetch(base + url, { method, headers: { 'Content-Type': 'application/json', Cookie: `user=${user}` }, body: body && JSON.stringify(body) });

test('owner/editor/viewer flow with persistence and sanitization', { skip: !enabled }, async () => {
  const { id } = await (await call('umer', 'POST', '/api/docs', { title: 'Plan' })).json();
  assert.strictEqual((await call('ahtisham', 'GET', `/api/docs/${id}`)).status, 403);

  await call('umer', 'POST', `/api/docs/${id}/share`, { username: 'ahtisham', role: 'viewer' });
  assert.strictEqual((await (await call('ahtisham', 'GET', `/api/docs/${id}`)).json()).role, 'viewer');
  assert.strictEqual((await call('ahtisham', 'PUT', `/api/docs/${id}`, { content: '<p>x</p>' })).status, 403);
  assert.strictEqual((await call('ahtisham', 'POST', `/api/docs/${id}/share`, { username: 'ali' })).status, 403);

  await call('umer', 'POST', `/api/docs/${id}/share`, { username: 'ahtisham', role: 'editor' });
  assert.strictEqual((await call('ahtisham', 'PUT', `/api/docs/${id}`, { content: '<h1>Hi</h1><script>x</script>' })).status, 200);
  const saved = await (await call('umer', 'GET', `/api/docs/${id}`)).json();
  assert.match(saved.content, /<h1>Hi<\/h1>/);
  assert.doesNotMatch(saved.content, /script/);

  const list = await (await call('ahtisham', 'GET', '/api/docs')).json();
  assert.strictEqual(list.shared.length, 1);
  assert.strictEqual(list.shared[0].role, 'editor');

  await call('umer', 'DELETE', `/api/docs/${id}/share?username=ahtisham`);
  assert.strictEqual((await call('ahtisham', 'GET', `/api/docs/${id}`)).status, 403);
});
