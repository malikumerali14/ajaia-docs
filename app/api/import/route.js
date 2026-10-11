import { route, json, HttpError } from '@/lib/api.js';
import { docs } from '@/lib/db.js';
import { clean } from '@/lib/sanitize.js';
import { fileToHtml, MAX_UPLOAD } from '@/lib/importer.js';

// Upload a .txt/.md/.docx and turn it into a new editable document.
export const POST = route(async (req, { user }) => {
  const file = (await req.formData().catch(() => null))?.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'No file uploaded');
  if (file.size > MAX_UPLOAD) throw new HttpError(413, 'File too large (max 2 MB)');
  let parsed;
  try { parsed = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer())); }
  catch (e) {
    if (e.message.startsWith('Unsupported')) throw new HttpError(400, e.message);
    throw new HttpError(422, 'Could not read that file. Is it valid?');
  }
  const { insertedId } = await (await docs()).insertOne({
    title: parsed.title, content: clean(parsed.html), owner: user, shares: [], updatedAt: new Date(),
  });
  return json({ id: String(insertedId) }, 201);
});
