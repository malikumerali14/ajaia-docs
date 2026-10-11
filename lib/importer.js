import path from 'node:path';
import mammoth from 'mammoth';
import { marked } from 'marked';

export const IMPORT_TYPES = ['.txt', '.md', '.docx'];
export const MAX_UPLOAD = 2 * 1024 * 1024;

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Converts an uploaded file to { title, html }. Output must still be sanitized by the caller.
export async function fileToHtml(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  if (!IMPORT_TYPES.includes(ext)) throw new Error(`Unsupported file type. Use ${IMPORT_TYPES.join(', ')}`);
  let html;
  if (ext === '.docx') html = (await mammoth.convertToHtml({ buffer })).value;
  else if (ext === '.md') html = marked.parse(buffer.toString('utf8'));
  else html = buffer.toString('utf8').split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  return { title: path.basename(filename, ext).slice(0, 200) || 'Imported document', html };
}
