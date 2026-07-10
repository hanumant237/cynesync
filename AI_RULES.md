# AI_RULES.md

Quick-reference guide for AI coding assistants (and humans) working on the
CineSync codebase. Follow these rules to keep generated code consistent with
existing patterns.

---

## Tech Stack

- **Next.js 16 (App Router) + React 19** — single user-visible route `/` with
  client-side view switching via `NavigationContext` (URL-hash-synced). Views
  live in `src/views/`, not `src/pages/` (reserved for legacy Pages Router).
- **TypeScript 5** — strict typing; path alias `@/*` → `./src/*`. Use
  `interface` for object shapes and `type` for unions/aliases.
- **Tailwind CSS 4 + shadcn/ui (New York, neutral base, CSS variables)** —
  styling via utility classes and theme tokens from `globals.css`; `cn()`
  helper from `src/lib/utils.ts` using `clsx` + `tailwind-merge`.
- **Prisma + SQLite** — ORM via `@prisma/client`; schema in
  `prisma/schema.prisma`; client instantiated in `src/lib/db.ts`.
- **Socket.IO Client** — realtime via `src/services/socket.ts`; Socket.IO
  server lives in the standalone `backend/` project.
- **Axios** — HTTP client centralized in `src/services/httpClient.ts`; API
  wrappers in `src/services/api.ts`.
- **Framer Motion** — animations (hover, focus, page transitions).
- **TanStack Query + Zustand** — server state via React Query; client state
  via Zustand stores when needed.
- **Lucide React** — the only icon library.
- **Standalone Express backend** in `backend/` with its own `package.json`,
  `tsconfig.json`, and build process; excluded from the Next.js build.

---

## Library Rules

| Concern               | Use                                                  | Don't Use                                      |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| UI primitives          | `@/components/ui/*` (shadcn/ui, New York)            | Hand-rolled components when a primitive exists |
| Styling                | Tailwind utility classes + `cn()` from `@/lib/utils` | Inline styles, CSS modules, styled-components |
| Icons                  | `lucide-react`                                       | Any other icon library                          |
| Animation              | `framer-motion`                                      | CSS animations for interactive motion          |
| Forms                  | `react-hook-form` + `zod` (via `@hookform/resolvers`) | Manual form state                               |
| Tables                 | `@tanstack/react-table`                              | Hand-rolled tables                              |
| Date handling          | `date-fns`                                           | Moment.js, dayjs                                |
| HTTP requests          | Axios via `src/services/httpClient.ts`               | fetch, got, axios instances elsewhere           |
| Realtime               | `socket.io-client` via `src/services/socket.ts`      | Raw WebSockets                                  |
| Server state           | `@tanstack/react-query`                              | Manual fetch + state                            |
| Client state           | Zustand                                              | Redux, Recoil, Context for complex state        |
| Markdown rendering     | `react-markdown`                                     | Custom parsers                                  |
| Syntax highlighting    | `react-syntax-highlighter`                           | Prism direct imports                            |
| Charts                 | `recharts`                                           | Chart.js, D3 directly                           |
| Drag & drop            | `@dnd-kit/*`                                         | react-beautiful-dnd                             |
| Rich text editing      | `@mdxeditor/editor`                                  | TipTap, Slate                                   |
| Carousels              | `embla-carousel-react`                              | Swiper                                          |
| Video streaming (HLS)  | `hls.js`                                             | Video.js, Shaka Player                          |
| Drawer/Sheet            | `vaul` (shadcn drawer)                               | Custom overlays                                 |
| Toasts                 | `sonner` and/or `@/components/ui/toaster`            | react-hot-toast                                 |
| Themes                 | `next-themes`                                        | Custom theme logic                              |
| Unique IDs             | `uuid`                                               | nanoid (frontend); nanoid is backend-only       |
| i18n                   | `next-intl`                                          | react-intl                                      |
| Auth                   | `next-auth`                                          | Custom auth                                     |
| Resizable panels       | `react-resizable-panels`                             | Custom splitters                                |
| Class merging          | `clsx` + `tailwind-merge` (already in `cn()`)        | Re-implementing                                 |

---

## Coding Conventions

- **Import alias**: use `@/*` for all `src/*` imports (configured in `tsconfig.json`).
- **Client vs server**: mark client components with `"use client"`. Server
  components are the default. Keep Socket.IO / SDK calls server-side only
  (backend), never in the browser bundle.
- **Barrel exports**: each folder exposes an `index.ts` for clean imports.
- **Routing**: no new top-level routes — only the single `/` route. Navigation
  is handled in-app via `NavigationContext` (URL-hash-synced).
- **No business logic in components**: pages are thin; logic lives in
  `services/` and `hooks/`.
- **shadcn/ui first**: prefer existing `components/ui/*` primitives over
  hand-rolled components. Don't edit `components/ui/*` directly — create new
  components if you need customized behavior.
- **Naming**: `PascalCase` for components, `camelCase` for functions/variables,
  `SCREAMING_SNAKE_CASE` for constants.
- **Comments**: document *why*, not *what*.
