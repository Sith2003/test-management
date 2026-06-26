# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack **Test Management Application** — NestJS (TypeScript) backend + Next.js (TypeScript) frontend.

## Commands

### Root (run both services)
```bash
npm install           # install all workspaces
npm run dev           # start server (port 3001) + client (port 3000) concurrently
npm run db:migrate    # run Prisma migrations
npm run db:generate   # regenerate Prisma client
npm run db:seed       # seed demo data (admin@example.com / Admin@123456!)
npm run db:studio     # open Prisma Studio
```

### Server only (`cd server`)
```bash
npm run dev           # NestJS watch mode on port 3001
npm run build         # compile TypeScript
npm run db:migrate    # prisma migrate dev
```

### Client only (`cd client`)
```bash
npm run dev           # Next.js dev on port 3000
npm run build         # production build
npm run lint          # ESLint
```

## Architecture

### Server — NestJS + Clean Architecture
```
server/src/
├── main.ts                  # bootstrap: helmet, cookie-parser, versioning, swagger at /api/docs
├── app.module.ts            # global guards: JwtAuthGuard, RolesGuard, ThrottlerGuard
├── shared/
│   ├── types/               # ApiResponse<T>, CollectionResponse<T>, buildPaginationMeta()
│   ├── constants/           # PAGINATION, SEARCH, RATE_LIMITS
│   ├── decorators/          # @CurrentUser(), @Public(), @Roles()
│   ├── filters/             # AllExceptionsFilter (P2002→409, P2025→404, Throttler→429)
│   ├── guards/              # JwtAuthGuard, RolesGuard
│   └── interceptors/        # ResponseInterceptor (wraps in { data, meta })
├── prisma/                  # PrismaModule (global), PrismaService
└── [feature]/               # auth, projects, test-suites, test-cases, test-runs, upload, reports
    ├── dto/
    ├── [feature].controller.ts
    ├── [feature].service.ts
    └── [feature].module.ts
```

**API prefix**: `/api/v1/` (URI versioning)
**Auth**: JWT access token (15 min) in `Authorization: Bearer` + refresh token (7 days) in `httpOnly` cookie `refresh_token`
**Response format**: `{ data: T, meta: { timestamp } }` — wrapped automatically by `ResponseInterceptor`
**Collection format**: `{ data: T[], pagination: { page, limit, total, totalPages }, meta }`

### Client — Next.js App Router + Feature-Based Architecture
```
client/src/
├── app/
│   ├── layout.tsx           # root layout with Providers
│   ├── (auth)/              # login, register (public)
│   └── (main)/              # protected layout with Sidebar
│       ├── layout.tsx       # client-side auth guard (redirects to /login)
│       ├── dashboard/
│       └── projects/[projectId]/
│           ├── cases/       # test cases list, new, [caseId]/edit
│           ├── runs/        # test runs list, [runId] executor
│           ├── upload/
│           └── reports/
├── shared/
│   ├── types/index.ts       # all TypeScript interfaces & enums
│   ├── services/api.ts      # Axios instance with auth interceptor + auto-refresh
│   ├── stores/authStore.ts  # Zustand store (persisted to localStorage)
│   └── components/
│       ├── Providers.tsx    # QueryClientProvider + Toaster
│       ├── Sidebar.tsx      # detects projectId from pathname via regex
│       └── ui/              # Button, Input, Select, Badge, Modal, Spinner, EmptyState, Pagination
└── features/
    ├── auth/                # LoginForm, RegisterForm (Zod + react-hook-form)
    ├── projects/            # ProjectList, ProjectCard, CreateProjectModal
    ├── test-cases/          # TestCaseList, TestCaseForm (with steps), TestSuiteTree
    ├── test-runs/           # TestRunList, CreateTestRunModal, TestRunExecutor
    ├── upload/              # UploadForm (drag-drop preview + import)
    ├── reports/             # SummaryCards, RunHistoryChart (Recharts), SuiteBreakdown
    └── dashboard/           # DashboardStats
```

**State**: TanStack Query v5 (server state) + Zustand (client/auth state)
**HTTP**: Axios — response interceptor unwraps `{ data }`, handles 401 → auto-refresh → retry
**Forms**: react-hook-form + Zod
**Styling**: Tailwind CSS v3 with custom `primary` color palette

## Database Schema (Prisma)

All tables use snake_case via `@@map`/`@map`. UUIDs for all PKs.

Key models: `User`, `Project` (unique `key` for case ID prefix), `ProjectMember`, `TestSuite` (self-referential tree), `TestCase` (unique `[projectId, caseId]`), `TestStep`, `TestRun`, `TestResult`, `Requirement`, `RequirementTestCase`.

Enums: `UserRole/ProjectMemberRole` (ADMIN > MANAGER > TESTER > VIEWER), `Priority` (CRITICAL/HIGH/MEDIUM/LOW), `CaseStatus` (ACTIVE/DRAFT/ARCHIVED), `RunStatus` (PENDING/IN_PROGRESS/COMPLETED/ABORTED), `ResultStatus` (PENDING/PASS/FAIL/BLOCKED/SKIPPED).

## Coding Standards (see docs/coding/)

- **TypeScript**: strict mode, `noImplicitAny`, `strictNullChecks`; no `any` without justification
- **NestJS**: Clean Architecture layers — always use DTOs with `class-validator`; `@Public()` for unauthenticated routes; role hierarchy numeric comparison
- **Next.js**: App Router; `'use client'` only when needed; feature-based directory structure
- **Git**: Git Flow (main → develop → feature/TICKET-description); conventional commits (`feat`, `fix`, `security`, `refactor`)
- **API**: All errors use `{ error: { code, message }, meta: { timestamp, path, method } }` format
- **Security**: OWASP Top 10; bcrypt min 10 rounds; JWT in Authorization header (not URL); httpOnly cookies for refresh tokens; input validation via class-validator (server) or Zod (client)

## Environment Setup

Copy `.env.example` to `server/.env`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/test_management"
JWT_SECRET="your-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
PORT=3001
```

Copy to `client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```
