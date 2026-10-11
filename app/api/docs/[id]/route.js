import { route, json, readBody, loadDoc, validTitle, HttpError } from '@/lib/api.js';
import { docs } from '@/lib/db.js';
import { clean } from '@/lib/sanitize.js';

export const GET = route(async (_req, { user, params }) => {
  const { doc, role } = await loadDoc(params.id, user, 'read');
  return json({
    id: String(doc._id), title: doc.title, content: doc.content, owner: doc.owner, role,
    updatedAt: doc.updatedAt, shares: role === 'owner' ? doc.shares : undefined,
  });
});

export const PUT = route(async (req, { user, params }) => {
  const { doc } = await loadDoc(params.id, user, 'write');
  const { title, content } = await readBody(req);
  const set = { updatedAt: new Date() };
  if (title !== undefined) {
    if (!validTitle(title)) throw new HttpError(400, 'Title must be 1-200 characters');
    set.title = title.trim();
  }
  if (content !== undefined) {
    if (typeof content !== 'string') throw new HttpError(400, 'Content must be a string');
    set.content = clean(content);
  }
  await (await docs()).updateOne({ _id: doc._id }, { $set: set });
  return json({ ok: true, updatedAt: set.updatedAt });
});

export const DELETE = route(async (_req, { user, params }) => {
  const { doc } = await loadDoc(params.id, user, 'owner');
  await (await docs()).deleteOne({ _id: doc._id });
  return json({ ok: true });
});
