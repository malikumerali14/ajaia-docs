import { route, json, readBody, HttpError, USERS } from '@/lib/api.js';

export const POST = route(async (req) => {
  const u = String((await readBody(req)).username || '').toLowerCase();
  if (!USERS.includes(u)) throw new HttpError(400, 'Unknown user');
  const res = json({ username: u });
  res.headers.append('Set-Cookie', `user=${u}; Path=/; HttpOnly; SameSite=Lax`);
  return res;
}, { open: true });
