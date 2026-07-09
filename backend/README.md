# CineSync Backend

Express + Socket.IO + TypeScript service for CineSync.

> **Status:** Foundation only. No business logic, streaming, or socket
> functionality is implemented in this phase — see `../PROJECT.md` for the
> roadmap.

## Structure

```
backend/
  src/
    routes/        Express routers
    controllers/   Request handlers
    middleware/    Express middleware (auth, errors, logging)
    services/      Business logic
    socket/        Socket.IO event handlers
    utils/         Shared helpers
    config/        Env + app configuration
    types/         Shared backend types
    index.ts       Server entry point
  package.json
  tsconfig.json
  .env.example
```

## Getting started (future phase)

```bash
cd backend
cp .env.example .env
bun install      # or npm install
bun run dev
```

The backend listens on `PORT` (default `4001`). The frontend reaches it
through the gateway using the `XTransformPort` query parameter.
