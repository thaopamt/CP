# Zenith — Education Management System

Nx monorepo: a React (Vite) SPA with three role-based portals + a NestJS API
sharing typed contracts via a typed-only library.

## Layout

```
apps/
  web/          # Vite + React 18 + Tailwind — single SPA with /admin, /teacher, /student
  api/          # NestJS 10 + TypeORM 0.3 + Postgres + @dataui/crud + Passport JWT
libs/
  shared/       # UserRole enum, IUser interface, JwtPayload — imported by both sides
  ui/           # Button, Card, StatCard, ScheduleItem, QuestCard — shared React primitives
  config/       # tailwind.preset.cjs (design tokens single source of truth)
design/         # Stitch UI prototypes (read-only reference)
```

## Quick start

```bash
# 1. Install deps
pnpm install

# 2. Boot Postgres (Docker)
docker run -d --name cp-pg -p 5432:5432 \
  -e POSTGRES_USER=cp -e POSTGRES_PASSWORD=cp -e POSTGRES_DB=cp postgres:16-alpine

# 3. Env
cp .env.example apps/api/.env

# 4. Boot the API (TypeORM synchronize creates tables in dev)
pnpm exec nx serve api

# 5. Boot the web app
pnpm exec nx serve web
#    open http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:3000`, so the
client uses a relative `baseURL` in dev (no CORS preflight headache).

## Manual RBAC verification

1. Visit `/` while logged out → redirected to `/login`.
2. Sign in as `admin@cp.local` → land on `/admin`.
3. Manually navigate to `/teacher` while admin → redirected back to `/admin`.
4. Same for `/student`. Sign out, sign in as a teacher, etc.
5. Hard-refresh on `/teacher` while signed in → stays put (proves Zustand
   `isHydrated` wait works).
6. Hit `GET /api/users` without a token → `401`.
7. With a student JWT, `GET /api/users` → `200`; `POST /api/users` → `403`.
8. With an admin JWT, `POST /api/users` → `201`.

## Where the deliverables live

| Deliverable | Path |
|---|---|
| **Directory tree** | This README + the live `apps/`, `libs/` folders |
| **Install commands** | See "Quick start" above + the plan at `~/.claude/plans/` |
| **Web `App.tsx`** | [apps/web/src/app/App.tsx](apps/web/src/app/App.tsx) |
| **`RoleGuard.tsx`** | [apps/web/src/app/guards/RoleGuard.tsx](apps/web/src/app/guards/RoleGuard.tsx) |
| **API `BaseEntity`** | [apps/api/src/common/entities/base.entity.ts](apps/api/src/common/entities/base.entity.ts) |
| **`@dataui/crud` controller** | [apps/api/src/modules/users/users.controller.ts](apps/api/src/modules/users/users.controller.ts) |
| **`CrudConfigService.load()`** | [apps/api/src/main.ts](apps/api/src/main.ts) |
| **Shared `user.interface.ts`** | [libs/shared/src/lib/user.interface.ts](libs/shared/src/lib/user.interface.ts) |
| **Tailwind preset** | [libs/config/tailwind.preset.cjs](libs/config/tailwind.preset.cjs) |

## Tech stack

| Layer | Pieces |
|---|---|
| Frontend | React 18 · Vite · Tailwind · React Router v6 · Zustand · @tanstack/react-query · axios · Framer Motion |
| Backend | NestJS 10 · TypeORM 0.3 · Postgres 16 · @dataui/crud@5 · Passport JWT · class-validator |
| Shared | TypeScript 5 · `@cp/shared` types · `@cp/ui` components · `@cp/config` tokens |
| Tooling | Nx 20 · pnpm · ESLint · Prettier |

## Key design decisions

See `~/.claude/plans/vai-tr-b-n-l-stateless-wombat.md` for the full plan with pitfalls.

- **`CrudConfigService.load()` runs FIRST** in `apps/api/src/main.ts`, before
  `AppModule` import. Decorators run at module load time; if you reverse the
  order the `@Crud()` config below silently uses defaults.
- **`UserRole` defined exactly once** in `libs/shared/src/lib/user-role.enum.ts`
  and imported by both NestJS and React via `@cp/shared`.
- **`passwordHash`** has both `@Column({ select: false })` AND
  `query.exclude: ['passwordHash']` in `@Crud` — belt and suspenders.
- **Zustand persist + `isHydrated`** — `RoleGuard` returns `null` until the
  store finishes hydrating from localStorage, otherwise a hard refresh on
  `/admin` would briefly redirect to `/login`.
- **TS path aliases** resolved by `@nx/vite/plugins/nx-tsconfig-paths.plugin`
  (not `vite-tsconfig-paths`).
