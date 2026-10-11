import sanitizeHtml from 'sanitize-html';

// Documents are stored as HTML (Tiptap output) and always sanitized server-side.
export const clean = (html) =>
  sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'u', 's']),
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
