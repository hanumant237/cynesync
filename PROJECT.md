# CineSync — PROJECT

A modern personal media streaming platform for videos that the user owns or is
authorized to access.

This document describes the project vision, folder structure, coding standards,
tech stack, future roadmap, and UI principles.

---

## 1. Project Vision

CineSync lets a user stream and enjoy their own (or explicitly authorized)
video library from anywhere, on any device, with a clean, fast, and reliable
experience. The platform is designed around three pillars:

1. **Ownership & access** — the user's media stays theirs; CineSync is a player
   and organizer, never a content publisher.
2. **In sync** — shared viewing (watch parties) keeps everyone on the same
   frame, with low-latency playback control.
3. **Clean foundation** — a scalable architecture that future phases can extend
   without rewriting.

> **Current phase:** Foundation only. No business logic, streaming, FFmpeg,
> chat, voice chat, watch-party functionality, authentication, or deployment
> is implemented yet. The goal of this phase is a clean, scalable, fully
> compiling base.

---

## 2. Tech Stack

### Frontend

| Concern        | Technology                                   |
| -------------- | -------------------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19           |
| Language       | TypeScript 5                                 |
| Styling        | Tailwind CSS 4 + shadcn/ui (New York)        |
| Icons          | lucide-react                                 |
| Animation      | Framer Motion                                |
| HTTP client    | Axios (`src/services/httpClient.ts`)         |
| Realtime       | Socket.IO Client (`src/services/socket.ts`)  |
| State          | React Context (navigation); TanStack Query + Zustand available |
| Routing model  | Single `/` route + client-side view switching (hash-synced) |

> **Note on routing:** The original spec mentioned React Router. The host
> environment mandates a single user-visible route (`/`), so navigation is
> implemented in-app via `NavigationContext` (URL-hash-synced). This preserves
> shareable URLs, browser back/forward, and a real 404 path while staying
> within the single-route constraint. The same component-based "page" model is
> used, so migrating individual pages to real routes later is trivial.
>
> **Note on folder naming:** View components live in `src/views/` rather than
> `src/pages/`. In Next.js, a `src/pages/` directory is reserved for the legacy
> Pages Router and would conflict with the App Router; `views/` avoids that
> collision while keeping the same conceptual role.

### Backend

| Concern        | Technology                                   |
| -------------- | -------------------------------------------- |
| Runtime        | Node.js                                      |
| HTTP framework | Express                                      |
| Realtime       | Socket.IO                                    |
| Language       | TypeScript                                   |

The backend lives in `backend/` as a standalone project with its own
`package.json` and `tsconfig.json`. It is excluded from the Next.js build so
the frontend compiles independently. See `backend/README.md`.

---

## 3. Folder Structure

```
.
├── src/                       # Frontend (Next.js App Router)
│   ├── app/                   # Next.js routes (only `/`)
│   │   ├── layout.tsx         # Root layout: providers + MainLayout
│   │   ├── page.tsx           # Single route — view switcher
│   │   └── globals.css        # Tailwind + theme tokens
│   ├── components/
│   │   ├── layout/            # Navbar, Footer, MainLayout, PageShell
│   │   └── ui/                # shadcn/ui primitives
│   ├── views/                # View components (NOT Next.js routes)
│   │   ├── HomePage.tsx
│   │   ├── PlayerPage.tsx
│   │   ├── WatchPartyPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── layouts/               # Layout barrel re-exports
│   ├── hooks/                 # useNavigation, use-mobile, use-toast
│   ├── services/              # httpClient, api, socket
│   ├── context/               # NavigationContext, AppProviders
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Constants + barrel
│   ├── assets/                # Static assets
│   └── styles/                # Additional CSS tokens
│
├── backend/                   # Standalone backend service
│   └── src/
│       ├── routes/            # Express routers
│       ├── controllers/       # Request handlers
│       ├── middleware/        # auth, errors, logging
│       ├── services/          # Business logic
│       ├── socket/            # Socket.IO handlers
│       ├── utils/             # Shared helpers
│       ├── config/            # Env + app config
│       ├── types/             # Shared backend types
│       └── index.ts           # Server entry point
│
├── prisma/                    # Prisma schema (available)
├── public/                    # Static public assets
├── PROJECT.md                 # This file
├── README.md                  # Setup & scripts
└── .env.example               # Frontend env template
```

---

## 4. Coding Standards

- **TypeScript everywhere** with strict typing. Prefer `interface` for object
  shapes and `type` for unions/aliases.
- **Path alias**: use `@/*` for `src/*` imports (configured in `tsconfig.json`).
- **App Router conventions**: only `src/app/` may define routes. The single
  user-visible route is `/`. Do not add new top-level routes.
- **Client vs server**: mark client components with `"use client"`. Keep
  server components default. Realtime/Socket.IO and SDK calls are server-side
  only (backend), never in the browser bundle.
- **No business logic in components**: pages are thin; logic lives in
  `services/` and `hooks/`.
- **shadcn/ui first**: prefer existing `components/ui/*` primitives over
  hand-rolled components.
- **Styling**: Tailwind utility classes; theme tokens from `globals.css`. No
  indigo/blue unless explicitly requested.
- **Naming**: `PascalCase` for components, `camelCase` for functions/variables,
  `SCREAMING_SNAKE_CASE` for constants.
- **Barrel exports**: each folder exposes an `index.ts` for clean imports.
- **Comments**: document *why*, not *what*. Keep placeholder `TODO (future
  phase)` markers explicit so the next phase knows where to work.

---

## 5. UI Principles

- **Responsive, mobile-first**: design for small screens, then enhance with
  `sm:`/`md:`/`lg:` breakpoints. Touch targets ≥ 44px.
- **Sticky footer**: the layout uses `min-h-screen flex flex-col` with the
  footer pinned to the bottom on short pages and pushed down naturally on long
  pages — never overlapping or floating.
- **Accessibility**: semantic HTML (`header`, `main`, `nav`, `footer`), ARIA
  states (e.g. `aria-current` on active nav), keyboard-accessible controls,
  `sr-only` where needed, and descriptive alt text.
- **Loading & error states**: every async surface shows a loading state and a
  clear, actionable error message.
- **Subtle motion**: Framer Motion for hover/focus/page transitions; never
  blocking.
- **Consistency**: aligned cards, consistent padding (`p-4`/`p-6`), and uniform
  spacing (`gap-4`/`gap-6`).
- **Minimal by default**: this foundation phase renders page titles only; UI
  design is deferred to later phases.

---

## 6. Future Roadmap

Phases are intentionally sequenced so each builds on a stable base.

1. **Foundation** *(this phase)* — folder structure, layout, placeholder pages,
   service/config scaffolding, docs. No business logic.
2. **Media library** — list/detail UI, media ingestion, metadata, thumbnails.
3. **Streaming** — adaptive playback, range requests, transcoding (FFmpeg).
4. **Player** — full player controls, resume, subtitles, quality selection.
5. **Watch parties** — Socket.IO rooms, synchronized playback, presence.
6. **Chat & voice** — text chat and (later) voice chat in watch parties.
7. **Authentication** — identity, sessions, per-user libraries & permissions.
8. **Deployment** — production build, hosting, CDN, observability.

> Out of scope for the current phase: streaming, FFmpeg, Socket.IO
> functionality, watch parties, chat, voice chat, authentication, and
> deployment.
