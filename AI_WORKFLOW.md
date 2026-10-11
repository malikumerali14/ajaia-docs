# AI workflow note
> DRAFT: edit every section so it reflects what *you* actually did and verified.

## Tools used
Claude (chat) for scaffolding, API design, and drafting docs. [YOU: add any other tools, e.g. Copilot, Cursor.]

## Where AI materially sped things up
- Scaffolding the Next.js + MongoDB structure and the route handlers
- Generating the first pass of the Tiptap toolbar and React state wiring
- Drafting the unit tests and the documentation

## What I changed or rejected
- The first draft used Express + SQLite; I redirected the AI to MongoDB/Next.js to match the MERN requirement, and the code was rebuilt rather than patched.
- Insisted content be sanitized server-side rather than trusting editor output.
- [YOU: add real examples, e.g. UI tweaks, bugs you found, suggestions you declined.]

## How I verified
- Unit tests (`npm test`) for permissions, sanitization and import; production build passes.
- Server smoke test of auth, validation and error paths.
- [YOU: manual browser walkthrough: create, format, refresh, upload each file type, share umer -> ahtisham as viewer then editor, check ali cannot edit as viewer.]
- [YOU: result of `RUN_E2E=1 npm test` and your Atlas deployment check.]
