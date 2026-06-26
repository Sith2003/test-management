# Project Memory: test-management

## Stack
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL (port 3001)
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS (port 3000)
- **Package manager**: npm with workspaces

## Key Patterns
- API base: `/api/v1/` (URI versioning)
- Auth: JWT access token (15min) in Bearer header + refresh token (7d) in `refresh_token` httpOnly cookie
- Response wrapper: `{ data: T, meta: { timestamp } }` via ResponseInterceptor
- All routes protected by JwtAuthGuard globally; use `@Public()` for open endpoints
- DB: snake_case tables via @@map/@map; UUID PKs

## Important Files
- `server/prisma/schema.prisma` — full DB schema
- `server/src/main.ts` — bootstrap (helmet, versioning, swagger at /api/docs)
- `server/src/app.module.ts` — global guards
- `server/src/shared/` — decorators, guards, filters, interceptors, types
- `client/src/shared/services/api.ts` — Axios with auto-refresh
- `client/src/shared/stores/authStore.ts` — Zustand auth (persisted)
- `client/src/shared/types/index.ts` — all TS interfaces

## Seed Data
- Admin: admin@example.com / Admin@123456!
- Tester: tester@example.com / Tester@123456!
- Demo project: "Demo Project" (key: DEMO)

## User Preferences
- Follow coding standards in docs/coding/ strictly
- NestJS (not Express), Next.js (not Vite React)
- npm (not yarn/bun)
- TypeScript strict mode throughout
