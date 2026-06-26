# Role-Based Access Control (RBAC)

## Overview

The system has two layers of role-based access:

| Layer | Where Applied | Roles |
|-------|--------------|-------|
| **Global Role** | System-wide (JWT payload) | `ADMIN`, `MANAGER`, `TESTER`, `DEVELOPER`, `VIEWER` |
| **Project Role** | Per-project membership | `ADMIN`, `MANAGER`, `TESTER`, `VIEWER` |

**Global ADMIN bypasses all project-level checks** — they have unrestricted access to every resource.

---

## Role Hierarchy

```
Global:  ADMIN(4) > MANAGER(3) > TESTER(2) > DEVELOPER(1) > VIEWER(0)
Project: ADMIN(3) > MANAGER(2) > TESTER(1) > VIEWER(0)
```

> **DEVELOPER** is a global-only role. At the project level, a user with global DEVELOPER role is treated as **VIEWER** by default unless explicitly added as a project member with a higher role.

---

## Global Role Capabilities

| Capability | VIEWER | DEVELOPER | TESTER | MANAGER | ADMIN |
|-----------|:------:|:---------:|:------:|:-------:|:-----:|
| Login / Register | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update own profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| Change own password | ✓ | ✓ | ✓ | ✓ | ✓ |
| View own notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create project | ✓ | ✓ | ✓ | ✓ | ✓ |
| View dashboard summary | ✓ | ✓ | ✓ | ✓ | ✓ |
| **View all projects** (even non-member) | ✗ | ✗ | ✓ | ✗ | ✓ |
| Manage system users | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create system users | ✗ | ✗ | ✗ | ✗ | ✓ |
| Reset any user's password | ✗ | ✗ | ✗ | ✗ | ✓ |
| Delete any user | ✗ | ✗ | ✗ | ✗ | ✓ |

### DEVELOPER Role Notes

The `DEVELOPER` global role is designed for software developers who need visibility into the QA process without write access:

- **Default project access**: Equivalent to project `VIEWER` — can browse test cases, defects, test results, and reports for projects they are assigned to
- **Primary use case**: Viewing defects assigned to them, checking test results for features they built, reading test case specifications
- **Elevation**: A project ADMIN can add a DEVELOPER user to a project with a higher role (e.g., `TESTER`) if needed

---

## Project Role Capabilities

These apply once a user is a member of a project (or is global ADMIN).

### Projects

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View project details | ✓ | ✓ | ✓ | ✓ |
| Update project (name, description) | ✗ | ✗ | ✓ | ✓ |
| Delete project | ✗ | ✗ | ✗ | ✓ |
| View members | ✓ | ✓ | ✓ | ✓ |
| Add member | ✗ | ✗ | ✗ | ✓ |
| Remove member | ✗ | ✗ | ✗ | ✓ |

### Test Suites

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View suite tree | ✓ | ✓ | ✓ | ✓ |
| Create suite | ✗ | ✓ | ✓ | ✓ |
| Update suite | ✗ | ✓ | ✓ | ✓ |
| Reorder suites (drag-and-drop) | ✗ | ✓ | ✓ | ✓ |
| Delete suite | ✗ | ✓ | ✓ | ✓ |

### Test Cases

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View test cases | ✓ | ✓ | ✓ | ✓ |
| Create test case | ✗ | ✓ | ✓ | ✓ |
| Update test case | ✗ | ✓ | ✓ | ✓ |
| Delete test case | ✗ | ✗ | ✓ | ✓ |
| Bulk create / bulk update / bulk delete | ✗ | ✓ | ✓ | ✓ |
| Import from Excel/CSV | ✗ | ✓ | ✓ | ✓ |
| View test case comments | ✓ | ✓ | ✓ | ✓ |
| Add test case comment | ✓ | ✓ | ✓ | ✓ |
| Delete own comment | ✓ | ✓ | ✓ | ✓ |
| Delete any comment | ✗ | ✗ | ✓ | ✓ |

### Test Runs

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View test runs | ✓ | ✓ | ✓ | ✓ |
| Create test run | ✗ | ✓ | ✓ | ✓ |
| Update test run | ✗ | ✓ | ✓ | ✓ |
| Execute result (PASS/FAIL/BLOCKED/SKIP) | ✗ | ✓ | ✓ | ✓ |
| Delete test run | ✗ | ✗ | ✓ | ✓ |
| Export run results (Excel) | ✓ | ✓ | ✓ | ✓ |

### Requirements

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View requirements & coverage | ✓ | ✓ | ✓ | ✓ |
| View traceability matrix | ✓ | ✓ | ✓ | ✓ |
| Create requirement | ✗ | ✗ | ✓ | ✓ |
| Update requirement | ✗ | ✗ | ✓ | ✓ |
| Delete requirement | ✗ | ✗ | ✓ | ✓ |
| Link / unlink test case | ✗ | ✓ | ✓ | ✓ |

### Requirements Documents

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View attached documents | ✓ | ✓ | ✓ | ✓ |
| Attach document (add URL/link) | ✗ | ✓ | ✓ | ✓ |
| Delete document | ✗ | ✗ | ✓ | ✓ |

### Test Plans

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View test plans | ✓ | ✓ | ✓ | ✓ |
| Create test plan | ✗ | ✗ | ✓ | ✓ |
| Update test plan | ✗ | ✗ | ✓ | ✓ |
| Add / remove assignees | ✗ | ✗ | ✓ | ✓ |
| Delete test plan | ✗ | ✗ | ✓ | ✓ |

### Defects

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View defects | ✓ | ✓ | ✓ | ✓ |
| Create defect | ✗ | ✓ | ✓ | ✓ |
| Update defect (including status) | ✗ | ✓ | ✓ | ✓ |
| Delete defect | ✗ | ✗ | ✓ | ✓ |
| Export defects (Excel) | ✓ | ✓ | ✓ | ✓ |
| View defect comments | ✓ | ✓ | ✓ | ✓ |
| Add defect comment | ✓ | ✓ | ✓ | ✓ |
| Delete own comment | ✓ | ✓ | ✓ | ✓ |
| Delete any comment | ✗ | ✗ | ✓ | ✓ |

### Ad-Hoc Cases

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View ad-hoc cases | ✓ | ✓ | ✓ | ✓ |
| Submit ad-hoc case | ✗ | ✓ | ✓ | ✓ |
| Update ad-hoc case | ✗ | ✓ | ✓ | ✓ |
| Convert to test case | ✗ | ✓ | ✓ | ✓ |
| Convert to defect | ✗ | ✓ | ✓ | ✓ |
| Delete ad-hoc case | ✗ | ✗ | ✓ | ✓ |

### Checklists

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View checklist items & sessions | ✓ | ✓ | ✓ | ✓ |
| Create / update / delete checklist item | ✗ | ✗ | ✓ | ✓ |
| Update checklist entry status | ✗ | ✓ | ✓ | ✓ |

### UAT Sessions

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View UAT sessions | ✓ | ✓ | ✓ | ✓ |
| Create UAT session | ✗ | ✗ | ✓ | ✓ |
| Update UAT session | ✗ | ✗ | ✓ | ✓ |
| Add / remove test cases | ✗ | ✗ | ✓ | ✓ |
| Execute UAT result | ✓ | ✓ | ✓ | ✓ |
| **Sign off UAT session** | ✗ | ✗ | ✓ | ✓ |
| Delete UAT session | ✗ | ✗ | ✓ | ✓ |
| Export UAT report (PDF) | ✓ | ✓ | ✓ | ✓ |

### Reports & Exports

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View all reports (summary, trends, coverage) | ✓ | ✓ | ✓ | ✓ |
| Export UAT report PDF | ✓ | ✓ | ✓ | ✓ |
| Export defects Excel | ✓ | ✓ | ✓ | ✓ |
| Export run results Excel | ✓ | ✓ | ✓ | ✓ |

### Notifications

All roles can manage their own notifications. There are no special restrictions — notifications are always scoped to the current user.

| Action | VIEWER | TESTER | MANAGER | ADMIN |
|--------|:------:|:------:|:-------:|:-----:|
| View own notifications | ✓ | ✓ | ✓ | ✓ |
| Mark notification as read | ✓ | ✓ | ✓ | ✓ |
| Mark all notifications as read | ✓ | ✓ | ✓ | ✓ |
| Delete own notification | ✓ | ✓ | ✓ | ✓ |
| Receive real-time SSE stream | ✓ | ✓ | ✓ | ✓ |

---

## Authentication Endpoints (Public)

| Endpoint | Auth Required |
|----------|:-------------:|
| `POST /auth/register` | ✗ |
| `POST /auth/login` | ✗ |
| `POST /auth/refresh` | ✗ |
| `POST /auth/logout` | ✗ |
| `GET /upload/template` | ✗ |

---

## Default Roles on Actions

| Event | Assigned Role |
|-------|--------------|
| New user registers | Global `TESTER` |
| User creates a project | Project `ADMIN` |
| Admin adds a member | Project `TESTER` (default) |

---

## Implementation Reference

| Concern | Location |
|---------|----------|
| Global guards registration | `server/src/app.module.ts` |
| JWT guard | `server/src/shared/guards/JwtAuthGuard` |
| Roles guard | `server/src/shared/guards/RolesGuard` |
| `@Public()` / `@Roles()` decorators | `server/src/shared/decorators/` |
| Project access check | `server/src/projects/projects.service.ts` → `checkProjectAccess()` |
| Frontend auth guard | `client/src/app/(main)/layout.tsx` |
| Auth store (Zustand) | `client/src/shared/stores/authStore.ts` |

---

## Pending Implementation

- [ ] **Notification delivery triggers** — ensure all `NotificationType` events (e.g., `REVIEW_REQUESTED`, `TEST_RUN_COMPLETED`) actually create Notification records in every relevant service method
- [ ] **Activity Log write points** — ensure all major mutations (create/update/delete for TestCase, Defect, TestRun, Requirement) write to the `activity_logs` table
