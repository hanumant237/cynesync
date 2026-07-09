# CineSync

A modern personal media streaming platform for videos that the user owns or is
authorized to access.

> **Status:** Foundation phase. This repository contains a clean, scalable,
> fully compiling base only — no business logic, streaming, chat, watch-party,
> authentication, or deployment is implemented yet. See
> [`PROJECT.md`](./PROJECT.md) for the full vision and roadmap.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4,
  shadcn/ui, Framer Motion, Axios, Socket.IO Client.
- **Backend (placeholder):** Node.js, Express, Socket.IO, TypeScript — lives in
  `backend/` as a standalone project.

---

## Installation

Prerequisites: [Bun](https://bun.sh) (recommended), Node.js 18+.

```bash
# from the repository root
bun install
```

Copy the frontend environment template and adjust if needed:

```bash
cp .env.example .env
```

> The backend is a separate project. To prepare it (future phase):
> ```bash
> cd backend
> cp .env.example .env
> bun install
> ```

---

## Running the Frontend

```bash
bun run dev
```

The app starts on port **3000**. Open the **Preview Panel** to view it (the
sandbox does not expose `localhost` directly — use the preview / "Open in New
Tab" button).

Navigation between the placeholder pages (Home, Player, Watch Party, Settings)
happens in-app via the Navbar; the URL hash mirrors the current view
(`#home`, `#player`, …). An unknown hash shows the 404 view.

---

## Running the Backend

The backend is foundation-only in this phase. To start it in a future phase:

```bash
cd backend
bun run dev      # listens on PORT (default 4001)
```

The frontend reaches the backend through the gateway using the `XTransformPort`
query parameter (e.g. `/api/...?XTransformPort=4001`).

---

## Development Scripts

### Frontend (repository root)

| Script            | Description                                  |
| ----------------- | -------------------------------------------- |
| `bun run dev`     | Start the Next.js dev server on port 3000    |
| `bun run lint`    | Run ESLint                                   |
| `bun run build`   | Production build (not used in dev)           |
| `bun run db:push` | Push the Prisma schema to the database       |

### Backend (`backend/`)

| Script                | Description                                  |
| --------------------- | -------------------------------------------- |
| `bun run dev`         | Start the backend with hot reload            |
| `bun run build`       | Compile TypeScript                           |
| `bun run typecheck`   | Type-check without emitting                  |

---

## Project Layout

See [`PROJECT.md`](./PROJECT.md) for the full folder structure, coding
standards, UI principles, and roadmap. In short:

- `src/` — frontend (single `/` route + client-side views)
- `backend/` — standalone Express + Socket.IO service (placeholder)
- `PROJECT.md` — vision, structure, standards, roadmap
- `README.md` — this file
