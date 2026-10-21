# User Custom Instructions & Rules

- **API Keys Storage**: All API keys provided by the user must always be saved directly into the root `/.env` environment file and declared in `/.env.example`.
- **No Unnecessary Folders**: Never create arbitrary or unexpected folders/subfolders for environment variables or credentials that could break standard Node/Vite/Express environment resolution.
- **Server-Side Security**: All API keys must strictly be kept server-side in `server.ts` via `process.env` and accessed through `/api/*` proxy routes.
