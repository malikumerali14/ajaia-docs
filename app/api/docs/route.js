import { route, json, readBody, validTitle, HttpError } from '@/lib/api.js';
import { docs } from '@/lib/db.js';

export const GET = route(async (_req, { user }) => {
  const col = await docs();
  const owned = await col.find({ owner: user }).project({ title: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).toArray();
  const shared = await col.find({ 'shares.username': user }).project({ title: 1, updatedAt: 1, owner: 1, shares: 1 }).sort({ updatedAt: -1 }).toArray();
  return json({
    owned: owned.map((d) => ({ id: String(d._id), title: d.title, updatedAt: d.updatedAt })),
    shared: shared.map((d) => ({ id: String(d._id), title: d.title, updatedAt: d.updatedAt, owner: d.owner, role: d.shares.find((s) => s.username === user).role })),
  });
});

export const POST = route(async (req, { user }) => {
  const title = (await readBody(req)).title ?? 'Untitled document';
  if (!validTitle(title)) throw new HttpError(400, 'Title must be 1-200 characters');
  const { insertedId } = await (await docs()).insertOne({ title: title.trim(), content: '', owner: user, shares: [], updatedAt: new Date() });
  return json({ id: String(insertedId) }, 201);
});
