// Pure access-control logic (no I/O) so it is trivial to unit test.
const RANK = { viewer: 1, editor: 2, owner: 3 };
const NEED = { read: 1, write: 2, owner: 3 };

export function roleFor(doc, user) {
  if (!doc || !user) return null;
  if (doc.owner === user) return 'owner';
  return doc.shares?.find((s) => s.username === user)?.role ?? null;
}
export const allows = (role, action) => !!role && RANK[role] >= NEED[action];
