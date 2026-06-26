# เอกสารสถาปัตยกรรมระบบ
## TestManager — แอปพลิเคชันจัดการการทดสอบ

**Version:** 3.0
**Date:** 2026-06-11

> **การเปลี่ยนแปลงใน v2.0:** เพิ่มโมดูลฟีเจอร์ใหม่ 5 โมดูล (Defect Log, Daily Checklist, UAT Sessions, Ad-Hoc Cases,
> Management Summary) เพื่อทดแทนเทมเพลต Google Sheets "DTOP MoVe - Test Cases" ทั้งหมด
> ขยาย schema ของ TestCase จาก 8 ฟิลด์หลัก เป็น 30+ ฟิลด์ ให้ตรงกับ Master Test Cases sheet ที่มี 34 คอลัมน์

> **การเปลี่ยนแปลงใน v3.0:** เพิ่มโมดูลฟีเจอร์ใหม่ 6 โมดูล ได้แก่ `requirements` (พร้อม Traceability Matrix),
> `exports`, `dashboard`, `users`, `notifications` (SSE + in-app), `test-plans`, `activity-logs`
> เพิ่ม DEVELOPER ใน UserRole enum, เพิ่ม Header bar component (NotificationBell, Profile link, Sign-out)
> ปรับ Sidebar — ไม่มี user section ที่ด้านล่างอีกต่อไป เพิ่ม Requirements และ Test Plans ใน navigation

---

## 1. ภาพรวมระบบ

| Service | Technology | Port |
|---------|-----------|------|
| **API Server** | NestJS + TypeScript + Prisma | 3001 |
| **Web Client** | Next.js 14 + TypeScript + Tailwind CSS | 3000 |
| **Database** | PostgreSQL 15+ | 5432 |

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│              http://localhost:3000                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / REST
┌──────────────────────▼──────────────────────────────────────┐
│               Next.js Client (Port 3000)                    │
│         App Router · TanStack Query · Zustand               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST  http://localhost:3001/api/v1
                       │ Authorization: Bearer <access_token>
                       │ Cookie: refresh_token (httpOnly)
                       │ SSE: GET /notifications/stream
┌──────────────────────▼──────────────────────────────────────┐
│               NestJS API Server (Port 3001)                 │
│      Clean Architecture · JWT Auth · Role Guards            │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database (Port 5432)                │
│              Database: test_management                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. สถาปัตยกรรม Backend (NestJS)

### 2.1 โมดูลฟีเจอร์

**ที่มีอยู่แล้ว (v1.0):** `auth` · `projects` · `test-suites` · `test-cases` · `test-runs` · `upload` · `reports`

**ใหม่ (v2.0):** `defects` · `checklists` · `uat` · `adhoc`

**ใหม่ (v3.0):** `requirements` · `exports` · `dashboard` · `users` · `notifications` · `test-plans` · `activity-logs`

### 2.2 ชั้นของ Clean Architecture

```
server/src/
├── main.ts
├── app.module.ts
│
├── shared/
│   ├── constants/
│   ├── decorators/             # @CurrentUser, @Public, @Roles
│   ├── filters/                # AllExceptionsFilter
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   ├── interceptors/           # ResponseInterceptor
│   └── types/                  # ApiResponse<T>, CollectionResponse<T>
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── [feature]/
    ├── dto/
    ├── [feature].controller.ts
    ├── [feature].service.ts
    └── [feature].module.ts
```

### 2.3 Global Middleware Stack

```
Request
  → Helmet (security headers)
  → cookie-parser
  → CORS
  → ThrottlerGuard (rate limiting)
  → JwtAuthGuard (skipped for @Public routes)
  → RolesGuard
  → ValidationPipe (whitelist: true)
  → Controller → Service → Prisma
  → ResponseInterceptor ({ data, meta })
  → AllExceptionsFilter
Response
```

### 2.4 รูปแบบมาตรฐาน API

**Base URL:** `http://localhost:3001/api/v1/`

**สำเร็จ (รายการเดียว):** `{ "data": {...}, "meta": { "timestamp": "..." } }`

**สำเร็จ (หลายรายการ):** `{ "data": [...], "pagination": { "page", "limit", "total", "totalPages" }, "meta": {...} }`

**ข้อผิดพลาด:** `{ "error": { "code", "message", "details" }, "meta": { "timestamp", "path", "method" } }`

| Prisma Code | HTTP | ความหมาย |
|-------------|------|---------|
| P2002 | 409 | ละเมิดข้อจำกัดความไม่ซ้ำกัน |
| P2025 | 404 | ไม่พบรายการ |
| ThrottlerException | 429 | เกินขีดจำกัดอัตราการเรียกใช้ |

### 2.5 ขั้นตอนการยืนยันตัวตน

- `accessToken`: เก็บในหน่วยความจำ (Zustand store) หมดอายุใน 15 นาที
- `refreshToken`: httpOnly cookie, SameSite=Strict หมดอายุใน 7 วัน
- เมื่อได้รับ 401: client จะเก็บคำขอไว้ในคิว แล้วเรียก `POST /auth/refresh` จากนั้นส่งคำขอในคิวซ้ำ

---

## 3. รายการ API Endpoints

### 3.1 Auth & Profile

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | ลงทะเบียน |
| POST | `/auth/login` | Public | เข้าสู่ระบบ |
| POST | `/auth/refresh` | Public | รีเฟรช token |
| POST | `/auth/logout` | Auth | ออกจากระบบ |
| GET | `/auth/me` | Auth | ข้อมูลผู้ใช้ปัจจุบัน |
| PATCH | `/auth/profile` | Auth | แก้ไขชื่อ |
| PATCH | `/auth/change-password` | Auth | เปลี่ยนรหัสผ่าน |

### 3.2 Projects & Members

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects` | Auth | รายการโปรเจกต์ |
| POST | `/projects` | Auth | สร้างโปรเจกต์ |
| GET | `/projects/:id` | Member | รายละเอียดโปรเจกต์ |
| PATCH | `/projects/:id` | Manager+ | แก้ไขโปรเจกต์ |
| DELETE | `/projects/:id` | Admin | ลบโปรเจกต์ |
| GET | `/projects/:id/members` | Member | รายชื่อสมาชิก |
| POST | `/projects/:id/members` | Admin | เพิ่มสมาชิก |
| DELETE | `/projects/:id/members/:userId` | Admin | ลบสมาชิก |

### 3.3 Test Suites & Cases

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/suites` | Member | โครงสร้างต้นไม้ suite |
| POST | `/projects/:id/suites` | Tester+ | สร้าง suite |
| PATCH | `/projects/:id/suites/reorder` | Tester+ | เรียงลำดับ suite ใหม่ |
| PATCH | `/projects/:id/suites/:suiteId` | Tester+ | แก้ไข suite |
| DELETE | `/projects/:id/suites/:suiteId` | Manager+ | ลบ suite |
| GET | `/projects/:id/cases` | Member | รายการ case (แบ่งหน้า, กรองข้อมูล) |
| POST | `/projects/:id/cases` | Tester+ | สร้าง case |
| POST | `/projects/:id/cases/bulk` | Tester+ | สร้างพร้อมกันหลายรายการ |
| PATCH | `/projects/:id/cases/bulk` | Tester+ | Bulk MOVE/SET_STATUS/DELETE |
| GET | `/projects/:id/cases/:caseId` | Member | รายละเอียด case |
| PATCH | `/projects/:id/cases/:caseId` | Tester+ | แก้ไข case |
| DELETE | `/projects/:id/cases/:caseId` | Manager+ | ลบ case |
| GET | `/projects/:id/cases/:caseId/comments` | Member | รายการ comments ของ case |
| POST | `/projects/:id/cases/:caseId/comments` | Member | เพิ่ม comment |
| DELETE | `/projects/:id/cases/:caseId/comments/:commentId` | Owner/Manager+ | ลบ comment |

### 3.4 Test Runs

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/runs` | Member | รายการ run |
| POST | `/projects/:id/runs` | Tester+ | สร้าง run |
| GET | `/projects/:id/runs/:runId` | Member | run พร้อมผลลัพธ์ |
| PATCH | `/projects/:id/runs/:runId` | Tester+ | แก้ไข run |
| DELETE | `/projects/:id/runs/:runId` | Manager+ | ลบ run |
| PATCH | `/projects/:id/runs/:runId/results/:resultId` | Tester+ | บันทึกผลการทดสอบ |

### 3.5 Upload & Reports

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| POST | `/upload/preview` | Auth | แปลงไฟล์ แล้วคืนตัวอย่างข้อมูล |
| POST | `/upload/import` | Auth | นำเข้าแถวข้อมูล |
| GET | `/upload/template` | **Public** | ดาวน์โหลดเทมเพลต (ไม่ต้อง Login) |
| GET | `/projects/:id/reports/summary` | Member | สถิติสรุป |
| GET | `/projects/:id/reports/runs` | Member | ประวัติการ run |
| GET | `/projects/:id/reports/suites` | Member | สรุปแยกตาม suite |
| GET | `/projects/:id/reports/defect-trend` | Member | แนวโน้ม defect รายวัน (30 วัน) |
| GET | `/projects/:id/reports/pass-rate-trend` | Member | Pass rate ของ 10 run ล่าสุด |
| GET | `/projects/:id/reports/automation-coverage` | Member | สัดส่วน Manual/Automated |
| GET | `/projects/:id/reports/requirement-coverage` | Member | ความครอบคลุม requirements |

### 3.6 Defect Log

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/defects` | Member | รายการ defect (กรองข้อมูล) |
| POST | `/projects/:id/defects` | Tester+ | สร้าง defect |
| GET | `/projects/:id/defects/:defectId` | Member | รายละเอียด defect + comments |
| PATCH | `/projects/:id/defects/:defectId` | Tester+ | แก้ไข defect (รวม status) |
| DELETE | `/projects/:id/defects/:defectId` | Manager+ | ลบ defect |
| GET | `/projects/:id/defects/:defectId/comments` | Member | รายการ comments |
| POST | `/projects/:id/defects/:defectId/comments` | Member | เพิ่ม comment |
| DELETE | `/projects/:id/defects/:defectId/comments/:commentId` | Owner/Manager+ | ลบ comment |

### 3.7 Daily QA Checklist

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/checklist/items` | Member | รายการ item เทมเพลต checklist |
| POST | `/projects/:id/checklist/items` | Manager+ | สร้าง item |
| PATCH | `/projects/:id/checklist/items/:itemId` | Manager+ | แก้ไข item |
| DELETE | `/projects/:id/checklist/items/:itemId` | Manager+ | ลบ item |
| GET | `/projects/:id/checklist/sessions` | Member | รายการ session รายวัน (ประวัติ) |
| GET | `/projects/:id/checklist/sessions/today` | Member | session วันนี้ (หรือสร้างใหม่) |
| POST | `/projects/:id/checklist/sessions` | Tester+ | เริ่ม session ใหม่สำหรับวันที่กำหนด |
| PATCH | `/projects/:id/checklist/sessions/:sessionId/entries/:entryId` | Tester+ | ทำเครื่องหมายสถานะ item |

### 3.8 UAT Sessions

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/uat` | Member | รายการ UAT session |
| POST | `/projects/:id/uat` | Manager+ | สร้าง UAT session |
| GET | `/projects/:id/uat/:sessionId` | Member | รายละเอียด session + ผลลัพธ์ |
| PATCH | `/projects/:id/uat/:sessionId` | Manager+ | แก้ไขข้อมูล session |
| DELETE | `/projects/:id/uat/:sessionId` | Manager+ | ลบ session |
| POST | `/projects/:id/uat/:sessionId/cases` | Manager+ | เพิ่ม test case เข้า UAT |
| DELETE | `/projects/:id/uat/:sessionId/cases/:caseId` | Manager+ | ลบ case |
| PATCH | `/projects/:id/uat/:sessionId/results/:resultId` | Any | บันทึกผล UAT |
| POST | `/projects/:id/uat/:sessionId/sign-off` | Manager+ | อนุมัติ (SIGNED_OFF/REJECTED) |

### 3.9 Ad-Hoc Cases

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/adhoc` | Member | รายการ ad-hoc case |
| POST | `/projects/:id/adhoc` | Tester+ | ส่ง ad-hoc case |
| GET | `/projects/:id/adhoc/:adhocId` | Member | รายละเอียด |
| PATCH | `/projects/:id/adhoc/:adhocId` | Tester+ | แก้ไข |
| DELETE | `/projects/:id/adhoc/:adhocId` | Manager+ | ลบ |
| POST | `/projects/:id/adhoc/:adhocId/convert` | Tester+ | แปลงเป็น test case อย่างเป็นทางการ |
| POST | `/projects/:id/adhoc/:adhocId/convert-to-defect` | Tester+ | แปลงเป็น defect |

### 3.10 Requirements (อัปเดต v3.0)

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/requirements/coverage` | Member | สถิติความครอบคลุม |
| GET | `/projects/:id/requirements/traceability` | Member | Traceability Matrix |
| GET | `/projects/:id/requirements` | Member | รายการ requirements (กรองได้) |
| POST | `/projects/:id/requirements` | Manager+ | สร้าง requirement |
| GET | `/projects/:id/requirements/:reqId` | Member | รายละเอียด + linked test cases |
| PATCH | `/projects/:id/requirements/:reqId` | Manager+ | แก้ไข |
| DELETE | `/projects/:id/requirements/:reqId` | Manager+ | ลบ |
| POST | `/projects/:id/requirements/:reqId/link` | Tester+ | ผูก test case |
| DELETE | `/projects/:id/requirements/:reqId/link/:tcId` | Tester+ | ยกเลิกการผูก |
| GET | `/projects/:id/requirements/:reqId/documents` | Member | รายการเอกสารที่แนบ |
| POST | `/projects/:id/requirements/:reqId/documents` | Tester+ | แนบเอกสาร |
| DELETE | `/projects/:id/requirements/:reqId/documents/:docId` | Manager+ | ลบเอกสาร |

### 3.11 Test Plans (ใหม่ v3.0)

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/plans` | Member | รายการ test plans |
| POST | `/projects/:id/plans` | Manager+ | สร้าง test plan |
| GET | `/projects/:id/plans/:planId` | Member | รายละเอียด + assignees |
| PATCH | `/projects/:id/plans/:planId` | Manager+ | แก้ไข plan |
| DELETE | `/projects/:id/plans/:planId` | Manager+ | ลบ plan |
| POST | `/projects/:id/plans/:planId/assignees/:userId` | Manager+ | เพิ่ม assignee |
| DELETE | `/projects/:id/plans/:planId/assignees/:userId` | Manager+ | ลบ assignee |

### 3.12 Notifications (ใหม่ v3.0)

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/notifications` | Auth | รายการ notifications ของตัวเอง |
| PATCH | `/notifications/:id/read` | Auth | ทำเครื่องหมายว่าอ่านแล้ว |
| PATCH | `/notifications/read-all` | Auth | ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว |
| DELETE | `/notifications/:id` | Auth | ลบ notification |
| GET | `/notifications/stream` | Auth | SSE stream (real-time) |

### 3.13 Activity Log (ใหม่ v3.0)

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/activity` | Member | ประวัติกิจกรรมในโปรเจกต์ |

### 3.14 Exports

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/projects/:id/exports/uat-report/:sessionId/pdf` | Member | Export UAT PDF |
| GET | `/projects/:id/exports/defects/excel` | Member | Export defects Excel |
| GET | `/projects/:id/exports/runs/:runId/results/excel` | Member | Export run results Excel |

### 3.15 Dashboard & Users

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/dashboard/summary` | Auth | สรุป KPI ทุกโปรเจกต์ |
| GET | `/users` | Admin | รายการผู้ใช้ทั้งหมด |
| GET | `/users/:userId` | Admin | รายละเอียดผู้ใช้ |
| PATCH | `/users/:userId` | Admin | แก้ไข role / สถานะผู้ใช้ |
| DELETE | `/users/:userId` | Admin | ลบผู้ใช้ |

### 3.16 Health Check

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-------------|
| GET | `/health` | Public | ตรวจสอบสถานะระบบและฐานข้อมูล |

---

## 4. โครงสร้างฐานข้อมูล

### 4.1 ตารางที่มีอยู่แล้ว (v1.0 / v2.0 — อัปเดต)

```
users
  id (UUID PK) · email (unique) · name · password (bcrypt)
  role (UserRole: ADMIN|MANAGER|TESTER|DEVELOPER|VIEWER) · is_active

projects
  id (UUID PK) · name · key (unique) · description · is_active
  created_by_id (FK → users)

project_members
  id (UUID PK) · project_id (FK → projects, CASCADE)
  user_id (FK → users) · role (ProjectMemberRole: ADMIN|MANAGER|TESTER|VIEWER)
  [UNIQUE: project_id + user_id]

test_suites
  id (UUID PK) · project_id (FK → projects, CASCADE)
  parent_id (FK → test_suites, self-ref, nullable)
  name · order

test_cases
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  suite_id (FK → test_suites, nullable)
  case_id (string, project-scoped)
  title (required)
  description · preconditions · scenario
  test_data · expected_result
  priority (Enum: CRITICAL|HIGH|MEDIUM|LOW)
  severity (Enum: CRITICAL|HIGH|MEDIUM|LOW)
  status (CaseStatus: ACTIVE|DRAFT|ARCHIVED)
  test_type · test_environment · automation_status
  review_status (Enum: DRAFT|READY|IN_REVIEW|APPROVED|REJECTED)
  platform_portal · development_source · requirement_id
  assigned_developer · request_type
  urgency_flag (Enum: NORMAL|HIGH|CRITICAL)
  source_requestor · impact_assessment · design_screenshot_url
  last_execution_status · last_actual_result · last_evidence_url
  notes_findings · qa_suggestion · pm_decision
  tags (String[])
  created_by_id (FK → users)
  [UNIQUE: project_id + case_id]

test_steps
  id (UUID PK) · test_case_id (FK → test_cases, CASCADE)
  order (Int) · action · expected_result

test_runs
  id (UUID PK) · project_id (FK → projects, CASCADE)
  name · description · sprint · version
  status (RunStatus: PENDING|IN_PROGRESS|COMPLETED|ABORTED)
  created_by_id (FK → users) · started_at · completed_at

test_results
  id (UUID PK) · run_id (FK → test_runs, CASCADE)
  test_case_id (FK → test_cases)
  assignee_id (FK → users, nullable)
  status (ResultStatus: PENDING|PASS|FAIL|BLOCKED|SKIPPED)
  notes · evidence_url · duration · executed_at
  [UNIQUE: run_id + test_case_id]

requirements
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  req_id (string, project-scoped)          -- e.g. REQ-001
  title (required)
  description
  external_id                              -- JIRA / external reference
  priority (Enum: CRITICAL|HIGH|MEDIUM|LOW)
  created_by_id (FK → users)
  [UNIQUE: project_id + req_id]

requirement_test_cases
  id (UUID PK)
  requirement_id (FK → requirements, CASCADE)
  test_case_id (FK → test_cases)
  [UNIQUE: requirement_id + test_case_id]

defects
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  defect_id (string, project-scoped)
  test_case_id (FK → test_cases, nullable)
  test_result_id (FK → test_results, nullable)
  module
  title (required)
  description · steps_to_reproduce · expected_result · actual_result
  severity (Enum: CRITICAL|HIGH|MEDIUM|LOW)
  priority (Enum: CRITICAL|HIGH|MEDIUM|LOW)
  status (Enum: OPEN|IN_PROGRESS|FIXED|RETEST|VERIFIED|REOPENED|CLOSED|WONTFIX)
  assigned_to_id (FK → users, nullable)
  related_defect_id (FK → defects, self-ref, nullable)
  bug_pattern
  attachment_urls (String[])
  created_by_id (FK → users)

checklist_items
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  title (required) · order (Int) · is_active (Boolean)

checklist_sessions
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  date (Date) · created_by_id (FK → users)
  [UNIQUE: project_id + date]

checklist_entries
  id (UUID PK)
  session_id (FK → checklist_sessions, CASCADE)
  item_id (FK → checklist_items)
  status (Enum: PENDING|DONE|SKIPPED|BLOCKED)
  notes · completed_by_id (FK → users, nullable) · completed_at

uat_sessions
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  session_id (string, project-scoped)
  name (required) · version · environment_url
  uat_start_date · uat_end_date · support_contact · report_date
  status (Enum: PLANNED|IN_PROGRESS|SIGNED_OFF|REJECTED)
  sign_off_by_id (FK → users, nullable)
  sign_off_note · signed_off_at · created_by_id (FK → users)

uat_results
  id (UUID PK)
  session_id (FK → uat_sessions, CASCADE)
  test_case_id (FK → test_cases)
  tester_id (FK → users, nullable)
  status (Enum: PENDING|PASS|FAIL|BLOCKED)
  actual_result · evidence_url · comments · executed_at
  [UNIQUE: session_id + test_case_id]

adhoc_cases
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  adhoc_id (string, project-scoped)
  request_date · requestor · request_type
  urgency (Enum: NORMAL|HIGH|CRITICAL)
  source_system · module · issue_description · impact_assessment
  affected_environment · test_approach · test_steps_performed
  test_data_used · findings
  status (Enum: OPEN|IN_PROGRESS|RESOLVED|ESCALATED)
  severity (nullable) · assigned_qa_id (FK → users, nullable)
  assigned_developer · related_bug_id · related_tc_id
  resolution · completion_date · converted_to_tc · converted_tc_id
  notes · created_by_id (FK → users)
```

### 4.2 ตารางใหม่ (v3.0)

```
defect_comments
  id (UUID PK)
  defect_id (FK → defects, CASCADE)
  author_id (FK → users)
  content (required)
  created_at · updated_at

test_case_comments
  id (UUID PK)
  test_case_id (FK → test_cases, CASCADE)
  author_id (FK → users)
  content (required)
  created_at · updated_at

requirement_documents
  id (UUID PK)
  requirement_id (FK → requirements, CASCADE)
  name (required)
  url (required)
  file_type
  uploaded_by_id (FK → users)
  created_at

test_plans
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  name (required)
  description
  start_date (Date, nullable)
  end_date (Date, nullable)
  status (PlanStatus: DRAFT|ACTIVE|COMPLETED|ARCHIVED)
  created_by_id (FK → users)
  created_at · updated_at

test_plan_assignees
  id (UUID PK)
  plan_id (FK → test_plans, CASCADE)
  user_id (FK → users)
  [UNIQUE: plan_id + user_id]

activity_logs
  id (UUID PK)
  project_id (FK → projects, CASCADE)
  user_id (FK → users)
  action (String)                        -- e.g. TEST_CASE_CREATED, DEFECT_STATUS_CHANGED
  entity_type (String)                   -- e.g. TestCase, Defect, TestRun
  entity_id (String)
  entity_label (String, nullable)        -- human-readable: e.g. "DEMO-001: Login Test"
  metadata (Json, nullable)              -- additional context
  created_at

notifications
  id (UUID PK)
  user_id (FK → users)                   -- recipient
  type (NotificationType enum)
  title (String)
  message (String)
  link (String, nullable)                -- deep link to entity
  is_read (Boolean, default false)
  created_at
```

### 4.3 รูปแบบการตั้งชื่อ
- ชื่อตารางทั้งหมด: `snake_case` (ผ่าน Prisma `@@map`)
- ชื่อคอลัมน์ทั้งหมด: `snake_case` (ผ่าน Prisma `@map`)
- PK ทั้งหมด: UUID v4 (`@default(uuid())`)
- timestamp ทั้งหมด: `created_at`, `updated_at` (`@updatedAt`)
- Boolean flag: นำหน้าด้วย `is_` (เช่น `is_active`, `is_read`)

---

## 5. สถาปัตยกรรม Frontend (Next.js)

### 5.1 โครงสร้าง Route

```
client/src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
│
└── (main)/
    ├── layout.tsx                      # Auth guard + Header + Sidebar
    ├── dashboard/page.tsx              # สถิติรวมของทุกโปรเจกต์
    ├── profile/page.tsx                # แก้ไขโปรไฟล์ + เปลี่ยนรหัสผ่าน
    ├── admin/
    │   └── users/page.tsx              # Admin: จัดการผู้ใช้ระดับระบบ
    └── projects/
        ├── page.tsx                    # รายการโปรเจกต์
        └── [projectId]/
            ├── page.tsx                # ภาพรวมโปรเจกต์
            ├── cases/
            │   ├── page.tsx            # รายการ test case (suite tree + ตาราง)
            │   ├── new/page.tsx
            │   └── [caseId]/edit/page.tsx
            ├── runs/
            │   ├── page.tsx
            │   └── [runId]/page.tsx    # ตัวรัน test run
            ├── defects/
            │   ├── page.tsx
            │   └── [defectId]/page.tsx
            ├── checklist/
            │   └── page.tsx
            ├── uat/
            │   ├── page.tsx
            │   └── [sessionId]/page.tsx
            ├── adhoc/
            │   └── page.tsx
            ├── requirements/           # NEW v3.0
            │   └── page.tsx
            ├── plans/                  # NEW v3.0
            │   └── page.tsx
            ├── upload/page.tsx
            └── reports/page.tsx
```

### 5.2 โครงสร้างโมดูลฟีเจอร์

```
client/src/features/
├── auth/
├── projects/
├── test-cases/
├── test-runs/
├── upload/
├── reports/
├── dashboard/
├── defects/
│   ├── services/defectService.ts
│   ├── hooks/useDefects.ts
│   └── components/
│       ├── DefectList.tsx
│       ├── DefectForm.tsx
│       ├── DefectDetail.tsx
│       └── CreateDefectModal.tsx
├── checklist/
│   ├── services/checklistService.ts
│   ├── hooks/useChecklist.ts
│   └── components/
│       ├── ChecklistSession.tsx
│       ├── ChecklistHistory.tsx
│       └── ChecklistItemManager.tsx
├── uat/
│   ├── services/uatService.ts
│   ├── hooks/useUat.ts
│   └── components/
│       ├── UatSessionList.tsx
│       ├── UatExecutor.tsx
│       ├── UatSignOff.tsx
│       └── CreateUatSessionModal.tsx
├── adhoc/
│   ├── services/adhocService.ts
│   ├── hooks/useAdhoc.ts
│   └── components/
│       ├── AdhocList.tsx
│       ├── AdhocForm.tsx
│       └── ConvertToTcModal.tsx
├── requirements/               # NEW v3.0
│   ├── services/requirementsService.ts
│   ├── hooks/useRequirements.ts
│   └── components/
│       ├── RequirementList.tsx
│       ├── RequirementForm.tsx
│       ├── RequirementDetail.tsx
│       └── LinkTestCaseModal.tsx
├── test-plans/                 # NEW v3.0
│   ├── services/testPlanService.ts
│   ├── hooks/useTestPlans.ts
│   └── components/
│       ├── TestPlanList.tsx
│       ├── TestPlanForm.tsx
│       └── AssigneeManager.tsx
└── notifications/              # NEW v3.0
    ├── services/notificationsService.ts
    ├── hooks/useNotifications.ts
    └── components/
        ├── NotificationBell.tsx
        └── NotificationDropdown.tsx
```

### 5.3 Layout: Header Bar และ Sidebar (อัปเดต v3.0)

**Header Bar** (แถบด้านบน, สีขาว) — มองเห็นได้จากทุกหน้า:
```
[Logo / App Name]  ────────────────  [NotificationBell] [Profile Link] [Sign-out]
```

- **NotificationBell**: แสดง badge จำนวนที่ยังไม่อ่าน, คลิกเพื่อดู dropdown รายการแจ้งเตือน
- **Profile Link**: นำไปยังหน้า `/profile` (แก้ไขชื่อ + เปลี่ยนรหัสผ่าน)
- **Sign-out**: ออกจากระบบและกลับไปหน้า Login

**Sidebar** (แถบด้านซ้าย, สี `#0f0f12`) — แสดงเมนูตามโปรเจกต์:
```
[Project Name]
├── Test Cases
├── Test Runs
├── Defect Log
├── Daily Checklist
├── UAT
├── Ad-Hoc Cases
├── Requirements        ← NEW v3.0
├── Test Plans          ← NEW v3.0
├── Import
└── Reports
```

> Sidebar ไม่มี user section ที่ด้านล่างอีกต่อไป (ย้ายไปที่ Header bar แล้ว)

### 5.4 การจัดการ State

| ประเภท | Tool | การคงอยู่ |
|------|------|-------------|
| Server state (ข้อมูลจาก API) | TanStack Query v5 | In-memory cache |
| Auth state | Zustand + persist | localStorage |
| UI state (modals, filters) | React `useState` | Component-local |
| Notification stream | SSE + React `useEffect` | In-memory |

### 5.5 ระบบดีไซน์

- **สี:** `primary` (Indigo / Tailwind custom palette), สีตามความหมายของสถานะ
- **Card:** `bg-white rounded-xl ring-1 ring-gray-900/[0.06]`
- **Layout หน้า:** `PageHeader` (border-b, `px-8 py-5`) + เนื้อหาใน `px-8 py-6`
- **Header bar:** `bg-white border-b` — อยู่ด้านบนของ layout
- **Sidebar:** `bg-[#0f0f12]`, รายการที่เลือกอยู่ใช้ `border-l-2 border-indigo-400`
- **Textarea / Input:** `rounded-lg border border-gray-200`, focus ring สี indigo
- **Status badge:** มีสีตามค่า enum ของสถานะ (เช่น OPEN=สีแดง, PASS=สีเขียว)

---

## 6. การตั้งค่าสภาพแวดล้อมการพัฒนา

### สิ่งที่ต้องติดตั้งก่อน
- Node.js 20+
- PostgreSQL 15+
- npm 9+

### Environment Variables

**`server/.env`**
```
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/test_management
JWT_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

**`client/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### คำสั่ง

```bash
# จาก root directory
npm install          # ติดตั้ง workspace ทั้งหมด
npm run db:migrate   # รัน Prisma migrations
npm run db:generate  # สร้าง Prisma client ใหม่
npm run db:seed      # เติมข้อมูลตัวอย่าง (5 users + ShopEase project)
npm run db:studio    # เปิด Prisma Studio
npm run dev          # เริ่ม server (:3001) + client (:3000)

# Server เท่านั้น
cd server && npm run dev    # NestJS watch mode
cd server && npm run build  # Compile TypeScript

# Client เท่านั้น
cd client && npm run dev    # Next.js dev mode
cd client && npm run build  # Production build
cd client && npm run lint   # ESLint

# เข้าถึง Swagger UI
open http://localhost:3001/api/docs
```

---

## 7. การตัดสินใจเชิงออกแบบที่สำคัญ

| การตัดสินใจ | ทางเลือก | เหตุผล |
|----------|--------|--------|
| ORM | Prisma | Query ที่ type-safe และมีเครื่องมือ migration ที่ดีเยี่ยม |
| การกำหนดเวอร์ชัน API | URI `/v1/` | ชัดเจน และเป็นมิตรกับ cache |
| การเก็บ token | Memory (access) + httpOnly cookie (refresh) | refresh token ปลอดภัยจาก XSS |
| การ routing ฝั่ง Frontend | Next.js App Router | routing แบบ file-based, รองรับ nested layout |
| การจัดการ state | TanStack Query + Zustand | แยก server state กับ client state ออกจากกัน |
| การตรวจสอบข้อมูล | class-validator (server) + Zod (client) | เหมาะสมกับแต่ละ runtime |
| Real-time Notifications | Server-Sent Events (SSE) | เบากว่า WebSocket สำหรับ one-way server push, รองรับโดย browser ทุกตัว |
| DefectStatus lifecycle | เพิ่ม RETEST และ REOPENED | สะท้อน QA workflow จริง: ต้องทดสอบซ้ำหลัง Fixed, และเปิดใหม่หากยัง fail |
| Profile/Signout location | Header bar (ไม่ใช่ Sidebar) | เป็น UX pattern มาตรฐาน ทำให้ Sidebar เน้น project navigation |
| Requirement Documents | เก็บเป็น URL/Link ไม่ใช่ binary | ไม่ต้องจัดการ file storage, เชื่อมกับ Google Drive / SharePoint ได้ง่าย |
| Activity Log | แยก table | Query ง่าย, ไม่กระทบ performance ของ main queries |
| รูปแบบ TC-ID | `{PROJ_KEY}-{padded_counter}` | อ่านง่าย และกำหนดขอบเขตตามโปรเจกต์ |
| การลบแบบ cascade | Project → ข้อมูลลูกทั้งหมด | ป้องกันข้อมูลกำพร้าผ่าน Prisma `onDelete: Cascade` |
