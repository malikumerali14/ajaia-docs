import { route, json } from '@/lib/api.js';

export const POST = route(async () => {
  const res = json({ ok: true });
  res.headers.append('Set-Cookie', 'user=; Path=/; Max-Age=0');
  return res;
}, { open: true });
