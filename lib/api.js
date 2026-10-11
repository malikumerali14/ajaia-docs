import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { docs } from './db.js';
import { roleFor, allows } from './permissions.js';


export const USERS = ['umer', 'ahtisham', 'ali'];

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const json = (data, status = 200) => Response.json(data, { status });

// Wraps a handler: resolves the user, params, and turns errors into JSON responses.
export const route = (fn, { open = false } = {}) => async (req, ctx) => {
  try {
    const v = (await cookies()).get('user')?.value;
    const user = USERS.includes(v) ? v : null;
    if (!user && !open) throw new HttpError(401, 'Not signed in');
    return await fn(req, { user, params: await ctx?.params });
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'Something went wrong' }, 500);
  }
};

export const validTitle = (t) => typeof t === 'string' && t.trim().length > 0 && t.length <= 200;

export async function loadDoc(id, user, action) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new HttpError(404, 'Document not found');
  const doc = await (await docs()).findOne({ _id: new ObjectId(id) });

  if (!doc) throw new HttpError(404, 'Document not found');
  const role = roleFor(doc, user);

  if (!role) throw new HttpError(403, 'You do not have access to this document');
  
  if (!allows(role, action)) throw new HttpError(403, action === 'owner' ? 'Only the owner can do this' : 'You have view-only access');
  return { doc, role };
}
export async function readBody(req) {
  try { return await req.json(); } catch { throw new HttpError(400, 'Invalid JSON body'); }
}
