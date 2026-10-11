# Architecture note

## What I prioritized
1. **A correct sharing model**, since it is the part most likely to hide bugs. Access is a pure function (`lib/permissions.js`: `roleFor`, `allows`) with roles owner > editor > viewer, enforced on the server for every document route. The UI hides controls for viewers, but the server is the source of truth (viewer `PUT` returns 403).
2. **Content integrity.** Documents are stored as HTML from Tiptap and **sanitized on the server** (`sanitize-html` allow-list) on every save and import, so a shared document can't carry script into another user's browser. Plain-text imports are HTML-escaped.
3. **A usable editing loop:** debounced auto-save (800 ms), visible save status, pending edits flushed when switching documents.
4. **One honest upload path:** import `.txt/.md/.docx` into a new editable document (the most product-relevant option, and it reuses the editor/storage path). Type and size limits are shown in the UI and enforced on the server.

## Stack and why
- **Next.js (App Router) + React:** one deployable unit for UI and API; route handlers fill the Express role. Deploys free on Vercel.
- **MongoDB (native driver):** a document is one aggregate: `{title, content, owner, shares:[{username, role}], updatedAt}`. Embedding shares makes "owned" and "shared with me" simple indexed queries (`owner`, `shares.username`) with no joins.
- **Tiptap:** ProseMirror-based, React-friendly, outputs clean HTML.

## Data model
`documents`: `_id, title, content (sanitized HTML), owner, shares[{username, role}], updatedAt`. Users are a fixed seeded list in code (mock auth).

## Deliberate scope cuts
Real authentication, real-time collaboration/CRDTs, version history, comments, PDF export, image embedding.

## With another 2-4 hours
Real auth (NextAuth/OAuth) and share-by-email; version history (snapshot on save, restore); export to Markdown/PDF; Mongo indexes plus an API-level integration test in CI; optimistic concurrency (`updatedAt` check) to prevent silent overwrites between two editors; presence indicators.
