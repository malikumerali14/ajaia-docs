import { route, json, readBody, loadDoc, HttpError, USERS } from '@/lib/api.js';
import { docs } from '@/lib/db.js';

export const POST = route(async (req, { user, params }) => {
  const { doc } = await loadDoc(params.id, user, 'owner');
  const body = await readBody(req);
  const username = String(body.username || '').toLowerCase();
  const role = body.role || 'viewer';
  if (!['viewer', 'editor'].includes(role)) throw new HttpError(400, 'Role must be viewer or editor');
  if (!USERS.includes(username)) throw new HttpError(400, 'Unknown user');
  if (username === user) throw new HttpError(400, 'You already own this document');
  const col = await docs();
  const upd = await col.updateOne({ _id: doc._id, 'shares.username': username }, { $set: { 'shares.$.role': role } });
  if (!upd.matchedCount) await col.updateOne({ _id: doc._id }, { $push: { shares: { username, role } } });
  return json({ username, role });
});

export const DELETE = route(async (req, { user, params }) => {
  const { doc } = await loadDoc(params.id, user, 'owner');
  const username = new URL(req.url).searchParams.get('username');
  await (await docs()).updateOne({ _id: doc._id }, { $pull: { shares: { username } } });
  return json({ ok: true });
});
