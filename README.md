
## Features
- Create, rename, edit, auto-save, reopen and delete documents
- Rich text: headings (H1-H3), bold, italic, underline, bulleted and numbered lists
- **File upload:** `.txt`, `.md`, `.docx` (max 2 MB) become a new editable document
- **Sharing:** owner grants another user *viewer* or *editor* access; "My documents" vs "Shared with me" with role badges; owner can change or revoke access
- Persistence in MongoDB (content stored as sanitized HTML)

## Test accounts
Mock sign-in with three seeded users: `umer`, `ahtisham`, `ali`.
To review sharing: sign in as **umer** in one window and **ahtisham** in another (private/incognito window), create a doc as umer, share it with ahtisham, then refresh ahtisham's page.


## Deploy (free): Vercel + MongoDB Atlas
1. Atlas: create a free M0 cluster, add a database user, and under *Network Access* allow `0.0.0.0/0` (Vercel uses dynamic IPs).
2. Push this folder to GitHub, import it into Vercel.
3. Add env vars `MONGODB_URI` (and optionally `MONGODB_DB`). Deploy.

