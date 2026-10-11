import { route, json, USERS } from '@/lib/api.js';

export const GET = route(async (_req, { user }) => json({ username: user, users: USERS }));
