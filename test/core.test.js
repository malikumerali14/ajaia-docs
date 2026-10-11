import { test } from 'node:test';
import assert from 'node:assert';
import { roleFor, allows } from '../lib/permissions.js';
import { clean } from '../lib/sanitize.js';
import { fileToHtml } from '../lib/importer.js';

const doc = { owner: 'umer', shares: [{ username: 'ahtisham', role: 'viewer' }, { username: 'carol', role: 'editor' }] };

test('sharing permissions: owner / editor / viewer / stranger', () => {
  assert.strictEqual(roleFor(doc, 'umer'), 'owner');
  assert.strictEqual(roleFor(doc, 'ahtisham'), 'viewer');
  assert.strictEqual(roleFor(doc, 'dave'), null);
  assert.ok(allows('viewer', 'read') && !allows('viewer', 'write'));
  assert.ok(allows('editor', 'write') && !allows('editor', 'owner'));
  assert.ok(allows('owner', 'owner'));
  assert.ok(!allows(null, 'read'));
});

test('sanitizer keeps formatting, strips scripts and unsafe links', () => {
  const out = clean('<h1>T</h1><p><strong>b</strong><u>u</u><script>alert(1)</script><a href="javascript:x">l</a></p><ul><li>i</li></ul>');
  assert.match(out, /<h1>T<\/h1>/);
  assert.match(out, /<u>u<\/u>/);
  assert.match(out, /<ul><li>i<\/li><\/ul>/);
  assert.doesNotMatch(out, /script|javascript:/);
});

test('import: txt is escaped, md is rendered, bad types rejected', async () => {
  const t = await fileToHtml('notes.txt', Buffer.from('Hi <b>x</b>\n\nSecond'));
  assert.strictEqual(t.title, 'notes');
  assert.match(t.html, /&lt;b&gt;x/);
  assert.strictEqual((t.html.match(/<p>/g) || []).length, 2);
  const m = await fileToHtml('a.md', Buffer.from('# Head\n\n- one\n- two'));
  assert.match(m.html, /<h1[^>]*>Head<\/h1>/);
  assert.match(m.html, /<li>one<\/li>/);
  await assert.rejects(() => fileToHtml('evil.exe', Buffer.from('x')), /Unsupported/);
});
