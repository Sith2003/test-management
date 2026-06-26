# เอกสาร API — Test Management System

> **Base URL:** `http://localhost:3001/api/v1`
> **รูปแบบข้อมูล:** JSON (ยกเว้นการดาวน์โหลดไฟล์)
> **การยืนยันตัวตน:** Bearer Token ใน Header `Authorization: Bearer <token>`

---

## สารบัญ

1. [การยืนยันตัวตน (Auth)](#1-การยืนยันตัวตน-auth)
2. [โครงการ (Projects)](#2-โครงการ-projects)
3. [Test Suites](#3-test-suites)
4. [Test Cases](#4-test-cases)
5. [Test Runs](#5-test-runs)
6. [Defects (บันทึกข้อบกพร่อง)](#6-defects-บันทึกข้อบกพร่อง)
7. [Daily Checklist](#7-daily-checklist)
8. [UAT (User Acceptance Testing)](#8-uat-user-acceptance-testing)
9. [Ad-Hoc Cases](#9-ad-hoc-cases)
10. [Upload / Import](#10-upload--import)
11. [Reports (รายงาน)](#11-reports-รายงาน)
12. [Exports (ส่งออกไฟล์)](#12-exports-ส่งออกไฟล์)
13. [Dashboard](#13-dashboard)
14. [Requirements (ความต้องการ)](#14-requirements-ความต้องการ)
15. [Users (จัดการผู้ใช้)](#15-users-จัดการผู้ใช้)
16. [Test Plans (แผนการทดสอบ)](#16-test-plans-แผนการทดสอบ)
17. [Notifications (การแจ้งเตือน)](#17-notifications-การแจ้งเตือน)
18. [Activity Log (ประวัติกิจกรรม)](#18-activity-log-ประวัติกิจกรรม)
19. [Health Check](#19-health-check)

---

## หมายเหตุทั่วไป

### รูปแบบการตอบกลับ (Response Format)

```json
// ข้อมูลเดี่ยว
{
  "data": { ... },
  "meta": { "timestamp": "2026-06-11T10:00:00.000Z" }
}

// ข้อมูลหลายรายการ (พร้อม Pagination)
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": { "timestamp": "2026-06-11T10:00:00.000Z" }
}

// เกิดข้อผิดพลาด
{
  "error": {
    "code": "NOT_FOUND",
    "message": "ไม่พบข้อมูลที่ต้องการ"
  },
  "meta": { "timestamp": "..." }
}
```

### HTTP Status Codes

| Code | ความหมาย |
|------|----------|
| `200` | สำเร็จ |
| `201` | สร้างข้อมูลสำเร็จ |
| `204` | สำเร็จ (ไม่มีข้อมูลตอบกลับ) |
| `400` | ข้อมูลที่ส่งมาไม่ถูกต้อง |
| `401` | ไม่ได้เข้าสู่ระบบ หรือ Token หมดอายุ |
| `403` | ไม่มีสิทธิ์เข้าถึง |
| `404` | ไม่พบข้อมูล |
| `409` | ข้อมูลซ้ำกัน (เช่น ชื่อโครงการ) |
| `503` | ระบบหรือฐานข้อมูลไม่พร้อมใช้งาน |

### ระดับสิทธิ์ (Roles)

| Role | ความสามารถ |
|------|-----------|
| `ADMIN` | เข้าถึงทุกอย่าง รวมถึงจัดการผู้ใช้ทั้งหมด |
| `MANAGER` | จัดการโครงการ สร้าง/แก้ไข/ลบทุก Entity ในโครงการ |
| `TESTER` | สร้างและแก้ไข Test Cases, รันการทดสอบ, บันทึกผล |
| `DEVELOPER` | ดูข้อมูลได้แบบ Read-mostly เหมือน VIEWER แต่ออกแบบมาสำหรับ Developer workflow |
| `VIEWER` | ดูข้อมูลได้อย่างเดียว |

### Enums ที่ใช้ในระบบ

| Enum | ค่าที่ใช้ได้ |
|------|------------|
| `Priority` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `Severity` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `CaseStatus` | `ACTIVE`, `DRAFT`, `ARCHIVED` |
| `ResultStatus` | `PENDING`, `PASS`, `FAIL`, `BLOCKED`, `SKIPPED` |
| `RunStatus` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `ABORTED` |
| `DefectStatus` | `OPEN`, `IN_PROGRESS`, `FIXED`, `RETEST`, `VERIFIED`, `REOPENED`, `CLOSED`, `WONTFIX` |
| `TestType` | `FUNCTIONAL`, `NON_FUNCTIONAL`, `INTEGRATION`, `REGRESSION`, `SMOKE`, `UAT`, `PERFORMANCE`, `SECURITY` |
| `TestEnvironment` | `STAGING`, `DEV`, `UAT`, `PRODUCTION` |
| `AutomationStatus` | `MANUAL`, `AUTOMATED`, `IN_PROGRESS` |
| `ReviewStatus` | `DRAFT`, `READY`, `IN_REVIEW`, `APPROVED`, `REJECTED` |
| `PlatformPortal` | `WEB_PORTAL`, `MOBILE_APP`, `API`, `ADMIN_PORTAL` |
| `UrgencyFlag` | `NORMAL`, `HIGH`, `CRITICAL` |
| `AdhocStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED` |
| `UatSessionStatus` | `PLANNED`, `IN_PROGRESS`, `SIGNED_OFF`, `REJECTED` |
| `UatResultStatus` | `PENDING`, `PASS`, `FAIL`, `BLOCKED` |
| `ChecklistEntryStatus` | `PENDING`, `DONE`, `SKIPPED`, `BLOCKED` |
| `PlanStatus` | `DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| `NotificationType` | `REVIEW_REQUESTED`, `REVIEW_APPROVED`, `REVIEW_REJECTED`, `DEFECT_ASSIGNED`, `RESULT_ASSIGNED`, `COMMENT_ADDED`, `DEFECT_STATUS_CHANGED`, `TEST_RUN_COMPLETED` |

---

## 1. การยืนยันตัวตน (Auth)

### `POST /auth/register` — สมัครสมาชิก
ไม่ต้องใช้ Token

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "สมชาย ใจดี",
  "password": "password123"
}
```

**Response `201`:**
```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "สมชาย ใจดี",
      "role": "TESTER",
      "createdAt": "2026-06-11T10:00:00.000Z"
    }
  }
}
```

---

### `POST /auth/login` — เข้าสู่ระบบ
ไม่ต้องใช้ Token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "สมชาย ใจดี",
      "role": "TESTER"
    }
  }
}
```

---

### `POST /auth/refresh` — รีเฟรช Token
ใช้ httpOnly Cookie `refreshToken` (ไม่ต้องใส่ใน Header)

**Response `200`:** `{ "data": { "accessToken": "eyJhbGci..." } }`

---

### `POST /auth/logout` — ออกจากระบบ
**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `GET /auth/me` — ข้อมูลผู้ใช้ปัจจุบัน
ต้องใช้ Token

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "สมชาย ใจดี",
    "role": "TESTER",
    "isActive": true,
    "createdAt": "2026-06-11T10:00:00.000Z"
  }
}
```

---

### `PATCH /auth/profile` — แก้ไขชื่อของตัวเอง
ต้องใช้ Token

**Request Body:**
```json
{ "name": "สมชาย อัพเดต" }
```

**Response `200`:** ข้อมูล User ที่อัพเดตแล้ว

---

### `PATCH /auth/change-password` — เปลี่ยนรหัสผ่าน
ต้องใช้ Token

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 2. โครงการ (Projects)

### `GET /projects` — รายการโครงการทั้งหมด
ต้องใช้ Token

**Query Parameters:**
| ชื่อ | ประเภท | คำอธิบาย |
|------|--------|---------|
| `page` | number | หน้าที่ต้องการ (ค่าเริ่มต้น: 1) |
| `limit` | number | จำนวนต่อหน้า (ค่าเริ่มต้น: 20) |

**Response `200`:** รายการโครงการพร้อม Pagination

---

### `POST /projects` — สร้างโครงการใหม่
ต้องใช้ Token

**Request Body:**
```json
{
  "name": "โครงการทดสอบ A",
  "key": "PJA",
  "description": "คำอธิบายโครงการ (ไม่บังคับ)"
}
```

**Response `201`:** ข้อมูลโครงการที่สร้างใหม่

---

### `GET /projects/:id` — รายละเอียดโครงการ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** ข้อมูลโครงการพร้อมสมาชิกและสถิติ

---

### `PATCH /projects/:id` — แก้ไขโครงการ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:**
```json
{
  "name": "ชื่อใหม่",
  "description": "คำอธิบายใหม่"
}
```

---

### `DELETE /projects/:id` — ลบโครงการ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `ADMIN`
⚠️ **ลบข้อมูลทั้งหมดในโครงการ (Cascade)**

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `GET /projects/:id/members` — รายชื่อสมาชิกโครงการ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** รายการสมาชิกพร้อมข้อมูลผู้ใช้และ Role

---

### `POST /projects/:id/members` — เพิ่มสมาชิก
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `ADMIN`

**Request Body:**
```json
{
  "userId": "uuid-ของผู้ใช้",
  "role": "TESTER"
}
```

---

### `DELETE /projects/:id/members/:userId` — ลบสมาชิก
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `ADMIN`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 3. Test Suites

### `GET /projects/:projectId/suites` — โครงสร้าง Suite ทั้งหมด
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** โครงสร้างต้นไม้ (Tree) ของ Suite ทั้งหมดในโครงการ

---

### `POST /projects/:projectId/suites` — สร้าง Suite ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "name": "Regression Suite",
  "description": "คำอธิบาย (ไม่บังคับ)",
  "parentId": "uuid-suite-แม่ (ไม่บังคับ)"
}
```

---

### `PATCH /projects/:projectId/suites/reorder` — เรียงลำดับ Suite ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "orders": [
    { "suiteId": "uuid-1", "order": 0 },
    { "suiteId": "uuid-2", "order": 1 }
  ]
}
```

---

### `PATCH /projects/:projectId/suites/:suiteId` — แก้ไข Suite
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "name": "ชื่อ Suite ใหม่",
  "description": "คำอธิบายใหม่"
}
```

---

### `DELETE /projects/:projectId/suites/:suiteId` — ลบ Suite
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 4. Test Cases

### `GET /projects/:projectId/cases` — รายการ Test Cases
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:**
| ชื่อ | ประเภท | คำอธิบาย |
|------|--------|---------|
| `page` | number | หน้าที่ต้องการ |
| `limit` | number | จำนวนต่อหน้า |
| `suiteId` | string (UUID) | กรองตาม Suite |
| `status` | CaseStatus | กรองตามสถานะ |
| `priority` | Priority | กรองตามความสำคัญ |
| `search` | string | ค้นหาจากชื่อ, คำอธิบาย, หรือ Case ID |
| `sortBy` | string | เรียงตาม field (ค่าเริ่มต้น: `createdAt`) |
| `order` | `asc` \| `desc` | ทิศทางการเรียง (ค่าเริ่มต้น: `desc`) |

---

### `POST /projects/:projectId/cases` — สร้าง Test Case ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "title": "ทดสอบการ Login ด้วย Credentials ที่ถูกต้อง",
  "description": "คำอธิบาย (ไม่บังคับ)",
  "preconditions": "ผู้ใช้มีบัญชีอยู่ในระบบ",
  "scenario": "Login Flow",
  "suiteId": "uuid (ไม่บังคับ)",
  "priority": "HIGH",
  "status": "ACTIVE",
  "severity": "CRITICAL",
  "testType": "FUNCTIONAL",
  "testEnvironment": "STAGING",
  "automationStatus": "MANUAL",
  "reviewStatus": "APPROVED",
  "platformPortal": "WEB_PORTAL",
  "urgencyFlag": "NORMAL",
  "assignedDeveloper": "นักพัฒนาที่รับผิดชอบ",
  "requirementId": "REQ-001",
  "testData": "Email: test@test.com, Password: 123456",
  "expectedResult": "เข้าสู่ระบบสำเร็จ ไปยังหน้า Dashboard",
  "tags": ["smoke", "regression"],
  "steps": [
    { "action": "เปิดหน้า Login", "expectedResult": "หน้า Login แสดงผล" },
    { "action": "กรอก Email และ Password", "expectedResult": "ข้อมูลถูกกรอกครบ" },
    { "action": "กดปุ่ม Login", "expectedResult": "เข้าสู่ระบบสำเร็จ" }
  ]
}
```

**Response `201`:** ข้อมูล Test Case ที่สร้างใหม่พร้อม Steps

---

### `POST /projects/:projectId/cases/bulk` — สร้าง Test Cases จำนวนมาก (สูงสุด 100)
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:** `{ "cases": [ ...CreateTestCaseDto[] ] }`

**Response `201`:** รายการ Test Cases ที่สร้างสำเร็จ

---

### `PATCH /projects/:projectId/cases/bulk` — จัดการ Test Cases จำนวนมาก
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
// ย้าย Suite
{ "ids": ["uuid-1", "uuid-2"], "action": "MOVE", "suiteId": "uuid-suite-ปลายทาง" }

// เปลี่ยนสถานะ
{ "ids": ["uuid-1", "uuid-2"], "action": "SET_STATUS", "status": "ARCHIVED" }

// ลบ
{ "ids": ["uuid-1", "uuid-2"], "action": "DELETE" }
```

**Response `200`:** `{ "data": { "affected": 2 } }`

---

### `GET /projects/:projectId/cases/:caseId` — รายละเอียด Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** ข้อมูล Test Case ครบทุก field พร้อม Steps

---

### `PATCH /projects/:projectId/cases/:caseId` — แก้ไข Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:** Field เดียวกับการสร้าง (ทุก field ไม่บังคับ)

---

### `DELETE /projects/:projectId/cases/:caseId` — ลบ Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `GET /projects/:projectId/cases/:caseId/comments` — รายการ Comments ของ Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "ตรวจสอบแล้ว ควรเพิ่ม edge case สำหรับ empty email",
      "author": { "id": "uuid", "name": "สมชาย", "email": "..." },
      "createdAt": "2026-06-11T10:00:00.000Z"
    }
  ]
}
```

---

### `POST /projects/:projectId/cases/:caseId/comments` — เพิ่ม Comment ใน Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Request Body:** `{ "content": "ข้อความ Comment" }`

**Response `201`:** ข้อมูล Comment ที่สร้างใหม่

---

### `DELETE /projects/:projectId/cases/:caseId/comments/:commentId` — ลบ Comment ของ Test Case
ต้องใช้ Token | เจ้าของ Comment หรือสิทธิ์ `MANAGER` ขึ้นไป

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 5. Test Runs

### `GET /projects/:projectId/runs` — รายการ Test Runs
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:** `page`, `limit`

---

### `POST /projects/:projectId/runs` — สร้าง Test Run ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "name": "Regression Run Sprint 5",
  "description": "คำอธิบาย (ไม่บังคับ)",
  "testCaseIds": ["uuid-1", "uuid-2", "uuid-3"],
  "sprint": "Sprint 5",
  "version": "v1.2.3"
}
```

**Response `201`:** Test Run ที่สร้างพร้อม Results เริ่มต้น (สถานะ `PENDING`)

---

### `GET /projects/:projectId/runs/:runId` — รายละเอียด Test Run
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** Test Run พร้อม Results ทั้งหมดและสถิติ

---

### `PATCH /projects/:projectId/runs/:runId` — แก้ไข Test Run
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:** `{ "name"?, "description"?, "sprint"?, "version"? }`

---

### `DELETE /projects/:projectId/runs/:runId` — ลบ Test Run
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `PATCH /projects/:projectId/runs/:runId/results/:resultId` — บันทึกผลการทดสอบ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "status": "PASS",
  "notes": "ทดสอบผ่าน ไม่พบปัญหา",
  "evidenceUrl": "https://link-to-screenshot.com"
}
```

**Response `200`:** ข้อมูล Result ที่อัพเดตแล้ว

---

## 6. Defects (บันทึกข้อบกพร่อง)

### `GET /projects/:projectId/defects` — รายการ Defects
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:** `page`, `limit`, `status` (DefectStatus), `search`

---

### `POST /projects/:projectId/defects` — บันทึก Defect ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "title": "ปุ่ม Login ไม่ทำงานบน iOS Safari",
  "testCaseId": "uuid (ไม่บังคับ)",
  "module": "Authentication",
  "description": "รายละเอียดของ Bug",
  "stepsToReproduce": "1. เปิด Safari\n2. กดปุ่ม Login",
  "expectedResult": "เข้าสู่ระบบได้",
  "actualResult": "ปุ่มไม่ตอบสนอง",
  "severity": "HIGH",
  "priority": "HIGH",
  "assignedToId": "uuid-นักพัฒนา (ไม่บังคับ)",
  "bugPattern": "UI/UX Bug"
}
```

**Response `201`:** ข้อมูล Defect ที่สร้างใหม่

---

### `GET /projects/:projectId/defects/:defectId` — รายละเอียด Defect
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** ข้อมูล Defect ครบถ้วน รวมถึง Comments

---

### `PATCH /projects/:projectId/defects/:defectId` — แก้ไข Defect
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:** Field เดียวกับการสร้าง รวมถึง `status` (DefectStatus)

วงจรชีวิต DefectStatus: `OPEN` → `IN_PROGRESS` → `FIXED` → `RETEST` → `VERIFIED` → `CLOSED`
นอกจากนี้ยังสามารถตั้งเป็น `REOPENED` หรือ `WONTFIX` ได้ทุกขั้นตอน (สิทธิ์ `MANAGER` ขึ้นไป)

---

### `DELETE /projects/:projectId/defects/:defectId` — ลบ Defect
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `GET /projects/:projectId/defects/:defectId/comments` — รายการ Comments
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "ตรวจสอบแล้วพบว่าเป็นปัญหา CSS",
      "author": { "id": "uuid", "name": "สมชาย", "email": "..." },
      "createdAt": "2026-06-11T10:00:00.000Z"
    }
  ]
}
```

---

### `POST /projects/:projectId/defects/:defectId/comments` — เพิ่ม Comment
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Request Body:** `{ "content": "ข้อความ Comment" }`

**Response `201`:** ข้อมูล Comment ที่สร้างใหม่

---

### `DELETE /projects/:projectId/defects/:defectId/comments/:commentId` — ลบ Comment
ต้องใช้ Token | เจ้าของ Comment หรือสิทธิ์ `MANAGER` ขึ้นไป

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 7. Daily Checklist

### `GET /projects/:projectId/checklist/items` — รายการ Checklist Template
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** รายการ Checklist Items ทั้งหมดของโครงการ

---

### `POST /projects/:projectId/checklist/items` — เพิ่ม Checklist Item
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:**
```json
{
  "title": "ตรวจสอบ Server Status",
  "order": 1
}
```

---

### `PATCH /projects/:projectId/checklist/items/:itemId` — แก้ไข Checklist Item
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:** `{ "title"?, "order"?, "isActive"? }`

---

### `DELETE /projects/:projectId/checklist/items/:itemId` — ลบ Checklist Item
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `GET /projects/:projectId/checklist/sessions` — ประวัติ Checklist Sessions
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** รายการ Sessions ทั้งหมดพร้อมวันที่

---

### `GET /projects/:projectId/checklist/sessions/today` — Checklist วันนี้
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

สร้าง Session ใหม่โดยอัตโนมัติหากยังไม่มีของวันนี้

**Response `200`:** Session ของวันนี้พร้อม Entries ทั้งหมด

---

### `PATCH /projects/:projectId/checklist/sessions/:sessionId/entries/:entryId` — อัพเดต Entry
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "status": "DONE",
  "notes": "ตรวจสอบแล้ว ปกติดี"
}
```

`status` เป็น `ChecklistEntryStatus`: `PENDING`, `DONE`, `SKIPPED`, `BLOCKED`

---

## 8. UAT (User Acceptance Testing)

### `GET /projects/:projectId/uat` — รายการ UAT Sessions
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

---

### `POST /projects/:projectId/uat` — สร้าง UAT Session ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:**
```json
{
  "name": "UAT Sprint 5 — Release v1.2",
  "version": "v1.2.3",
  "environmentUrl": "https://staging.example.com",
  "uatStartDate": "2026-06-10",
  "uatEndDate": "2026-06-17",
  "supportContact": "dev-team@example.com"
}
```

---

### `GET /projects/:projectId/uat/:sessionId` — รายละเอียด UAT Session
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** Session พร้อม Results ทั้งหมด

---

### `PATCH /projects/:projectId/uat/:sessionId` — แก้ไข UAT Session
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:** Field เดียวกับการสร้าง (ทุก field ไม่บังคับ)

---

### `POST /projects/:projectId/uat/:sessionId/cases` — เพิ่ม Test Cases ใน Session
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:** `{ "testCaseIds": ["uuid-1", "uuid-2"] }`

---

### `DELETE /projects/:projectId/uat/:sessionId/cases/:testCaseId` — ลบ Test Case ออกจาก Session
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `PATCH /projects/:projectId/uat/:sessionId/results/:resultId` — บันทึกผล UAT
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "status": "PASS",
  "actualResult": "ระบบทำงานถูกต้องตามที่คาดหวัง",
  "evidenceUrl": "https://link-to-evidence.com",
  "comments": "ผ่านการทดสอบ"
}
```

---

### `POST /projects/:projectId/uat/:sessionId/sign-off` — อนุมัติ UAT Session
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:**
```json
{
  "signOffNote": "ผ่านการตรวจสอบทั้งหมด อนุมัติ Release",
  "status": "SIGNED_OFF"
}
```

---

### `DELETE /projects/:projectId/uat/:sessionId` — ลบ UAT Session
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 9. Ad-Hoc Cases

### `GET /projects/:projectId/adhoc` — รายการ Ad-Hoc Cases
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:** `page`, `limit`

---

### `POST /projects/:projectId/adhoc` — บันทึก Ad-Hoc Case ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "issueDescription": "พบข้อผิดพลาดในการแสดงราคาสินค้า",
  "requestor": "สมหญิง ทดสอบ",
  "requestDate": "2026-06-11",
  "requestType": "Bug Report",
  "urgency": "HIGH",
  "sourceSystem": "E-Commerce Web",
  "module": "Product Catalog",
  "impactAssessment": "ผู้ใช้เห็นราคาผิดพลาด กระทบยอดขาย",
  "affectedEnvironment": "PRODUCTION",
  "notes": "พบครั้งแรก 11/06/2026"
}
```

---

### `GET /projects/:projectId/adhoc/:adhocId` — รายละเอียด Ad-Hoc Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

---

### `PATCH /projects/:projectId/adhoc/:adhocId` — แก้ไข Ad-Hoc Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

---

### `POST /projects/:projectId/adhoc/:adhocId/convert` — แปลงเป็น Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Response `201`:** Test Case ที่สร้างจาก Ad-Hoc Case

---

### `POST /projects/:projectId/adhoc/:adhocId/convert-to-defect` — แปลงเป็น Defect
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Response `201`:** Defect ที่สร้างจาก Ad-Hoc Case

---

### `DELETE /projects/:projectId/adhoc/:adhocId` — ลบ Ad-Hoc Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 10. Upload / Import

### `POST /upload/preview` — ดูตัวอย่างก่อน Import
ต้องใช้ Token
`Content-Type: multipart/form-data`

**Form Data:**
| ชื่อ | ประเภท | คำอธิบาย |
|------|--------|---------|
| `file` | File | ไฟล์ Excel (.xlsx, .xls) หรือ CSV (สูงสุด 10 MB) |

**Response `200`:**
```json
{
  "data": {
    "rows": [ { "title": "...", "priority": "HIGH", ... } ],
    "total": 25,
    "headers": ["title", "description", "priority", "status"]
  }
}
```

---

### `POST /upload/import` — นำเข้า Test Cases จากไฟล์
ต้องใช้ Token
`Content-Type: multipart/form-data`

**Form Data:**
| ชื่อ | ประเภท | คำอธิบาย |
|------|--------|---------|
| `file` | File | ไฟล์ Excel หรือ CSV |
| `projectId` | string | UUID ของโครงการ **(บังคับ)** |
| `suiteId` | string | UUID ของ Suite ที่ต้องการ (ไม่บังคับ) |

**Response `201`:**
```json
{
  "data": {
    "imported": 20,
    "failed": 2,
    "errors": ["แถวที่ 5: ไม่มี Title"]
  }
}
```

---

### `GET /upload/template` — ดาวน์โหลด Template ไฟล์
**ไม่ต้องใช้ Token** (`@Public` — เข้าถึงได้โดยไม่ต้อง Login)

**Response:** ไฟล์ Excel (.xlsx) พร้อม Column Headers และตัวอย่าง

---

## 11. Reports (รายงาน)

### `GET /projects/:projectId/reports/summary` — สรุปภาพรวมโครงการ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:**
```json
{
  "data": {
    "totalCases": 150,
    "totalRuns": 12,
    "passRate": 87.5,
    "activeCases": 120,
    "draftCases": 20,
    "archivedCases": 10,
    "completedRuns": 10,
    "inProgressRuns": 2
  }
}
```

---

### `GET /projects/:projectId/reports/runs` — ประวัติ Test Runs
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** รายการ Runs พร้อมสถิติ pass/fail/blocked/skipped ต่อ Run

---

### `GET /projects/:projectId/reports/suites` — สรุปตาม Suite
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** รายการ Suite พร้อมจำนวน Test Cases แยกตามสถานะ

---

### `GET /projects/:projectId/reports/defect-trend` — แนวโน้ม Defects รายวัน
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:** `days` (จำนวนวันย้อนหลัง, ค่าเริ่มต้น: 30)

**Response `200`:**
```json
{
  "data": [
    { "date": "2026-06-01", "open": 5, "closed": 2, "total": 7 },
    { "date": "2026-06-02", "open": 6, "closed": 3, "total": 9 }
  ]
}
```

---

### `GET /projects/:projectId/reports/pass-rate-trend` — แนวโน้ม Pass Rate
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** Pass Rate ของ 10 Test Runs ล่าสุดที่ Completed

---

### `GET /projects/:projectId/reports/automation-coverage` — สัดส่วน Automation
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:**
```json
{
  "data": {
    "manual": 80,
    "automated": 50,
    "inProgress": 20,
    "total": 150
  }
}
```

---

### `GET /projects/:projectId/reports/requirement-coverage` — ความครอบคลุม Requirements
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:**
```json
{
  "data": {
    "totalRequirements": 30,
    "coveredRequirements": 25,
    "coveragePercent": 83.3
  }
}
```

---

## 12. Exports (ส่งออกไฟล์)

> Response เป็นไฟล์ Binary พร้อม Header `Content-Disposition: attachment`

### `GET /projects/:projectId/exports/uat-report/:sessionId/pdf` — Export UAT รายงาน PDF
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response:** ไฟล์ PDF รายงาน UAT Session พร้อมข้อมูลครบถ้วน

---

### `GET /projects/:projectId/exports/defects/excel` — Export Defects เป็น Excel
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response:** ไฟล์ Excel (.xlsx) รายการ Defects ทั้งหมดของโครงการ

---

### `GET /projects/:projectId/exports/runs/:runId/results/excel` — Export ผลการทดสอบเป็น Excel
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response:** ไฟล์ Excel (.xlsx) ผลการทดสอบทั้งหมดของ Test Run นั้น

---

## 13. Dashboard

### `GET /dashboard/summary` — สรุปข้อมูลภาพรวมทุกโครงการ
ต้องใช้ Token

ผู้ใช้ `ADMIN` เห็นข้อมูลทุกโครงการ, ผู้ใช้อื่นเห็นเฉพาะโครงการที่ตนเป็นสมาชิก

**Response `200`:**
```json
{
  "data": {
    "openDefects": 12,
    "uatPendingSignOff": 3,
    "neverRunCases": 45,
    "myAssignedDefects": 5
  }
}
```

---

## 14. Requirements (ความต้องการ)

### `GET /projects/:projectId/requirements/coverage` — สถิติความครอบคลุม
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:**
```json
{
  "data": {
    "total": 30,
    "covered": 25,
    "coveredPercent": 83.3,
    "passedPercent": 72.0
  }
}
```

---

### `GET /projects/:projectId/requirements/traceability` — Traceability Matrix
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** รายการ Requirements พร้อม Test Cases ที่ผูกไว้และสถานะผลการทดสอบล่าสุด

---

### `GET /projects/:projectId/requirements` — รายการ Requirements
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:** `page`, `limit`, `search`, `priority`

---

### `POST /projects/:projectId/requirements` — สร้าง Requirement ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:**
```json
{
  "title": "ระบบต้องรองรับการ Login ด้วย Email",
  "description": "รายละเอียด Requirement",
  "externalId": "JIRA-123",
  "priority": "HIGH"
}
```

**Response `201`:** Requirement ที่สร้างพร้อม `reqId` (เช่น `REQ-001`)

---

### `GET /projects/:projectId/requirements/:requirementId` — รายละเอียด Requirement
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** Requirement พร้อม Test Cases ที่ผูกไว้ทั้งหมดและ Documents

---

### `PATCH /projects/:projectId/requirements/:requirementId` — แก้ไข Requirement
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

---

### `DELETE /projects/:projectId/requirements/:requirementId` — ลบ Requirement
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `POST /projects/:projectId/requirements/:requirementId/link` — ผูก Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:** `{ "testCaseId": "uuid" }`

**Response `201`:** ข้อมูล Link ที่สร้างใหม่

---

### `DELETE /projects/:projectId/requirements/:requirementId/link/:testCaseId` — ยกเลิกการผูก Test Case
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `GET /projects/:projectId/requirements/:requirementId/documents` — รายการเอกสาร
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** รายการไฟล์/เอกสารที่แนบกับ Requirement

---

### `POST /projects/:projectId/requirements/:requirementId/documents` — แนบเอกสาร
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `TESTER`

**Request Body:**
```json
{
  "name": "ชื่อเอกสาร",
  "url": "https://link-to-document.com",
  "fileType": "pdf"
}
```

**Response `201`:** ข้อมูล Document ที่แนบสำเร็จ

---

### `DELETE /projects/:projectId/requirements/:requirementId/documents/:documentId` — ลบเอกสาร
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 15. Users (จัดการผู้ใช้)

> ⚠️ **ทุก Endpoint ในส่วนนี้ต้องการสิทธิ์ `ADMIN` เท่านั้น**

### `GET /users` — รายการผู้ใช้ทั้งหมด

**Query Parameters:**
| ชื่อ | ประเภท | คำอธิบาย |
|------|--------|---------|
| `page` | number | หน้าที่ต้องการ |
| `limit` | number | จำนวนต่อหน้า |
| `search` | string | ค้นหาจากชื่อหรือ Email |
| `role` | UserRole | กรองตาม Role (`ADMIN`, `MANAGER`, `TESTER`, `DEVELOPER`, `VIEWER`) |
| `isActive` | boolean | กรองตามสถานะ Active |

---

### `GET /users/:userId` — รายละเอียดผู้ใช้

**Response `200`:** ข้อมูลผู้ใช้ (ไม่รวม Password)

---

### `PATCH /users/:userId` — แก้ไข Role หรือสถานะผู้ใช้

**Request Body:**
```json
{
  "role": "MANAGER",
  "isActive": true
}
```

---

### `DELETE /users/:userId` — ลบผู้ใช้

**Response `204`:** ไม่มีข้อมูลตอบกลับ
⚠️ ไม่สามารถลบตัวเองได้

---

## 16. Test Plans (แผนการทดสอบ)

### `GET /projects/:projectId/plans` — รายการ Test Plans
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:** `page`, `limit`, `status` (PlanStatus)

**Response `200`:** รายการ Test Plans พร้อม Pagination

---

### `POST /projects/:projectId/plans` — สร้าง Test Plan ใหม่
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:**
```json
{
  "name": "Sprint 5 Test Plan",
  "description": "แผนการทดสอบสำหรับ Sprint 5",
  "startDate": "2026-06-15",
  "endDate": "2026-06-30",
  "status": "DRAFT"
}
```

**Response `201`:** Test Plan ที่สร้างใหม่

---

### `GET /projects/:projectId/plans/:planId` — รายละเอียด Test Plan
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Response `200`:** Test Plan พร้อมผู้รับผิดชอบ (Assignees) ทั้งหมด

---

### `PATCH /projects/:projectId/plans/:planId` — แก้ไข Test Plan
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Request Body:** Field เดียวกับการสร้าง (ทุก field ไม่บังคับ) รวมถึง `status` (PlanStatus)

---

### `DELETE /projects/:projectId/plans/:planId` — ลบ Test Plan
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `POST /projects/:projectId/plans/:planId/assignees/:userId` — เพิ่มผู้รับผิดชอบ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `201`:** ข้อมูล Assignee ที่เพิ่มสำเร็จ

---

### `DELETE /projects/:projectId/plans/:planId/assignees/:userId` — ลบผู้รับผิดชอบ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `MANAGER`

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

## 17. Notifications (การแจ้งเตือน)

### `GET /notifications` — รายการ Notifications ของตัวเอง
ต้องใช้ Token

**Query Parameters:** `page`, `limit`, `unreadOnly` (boolean)

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "DEFECT_ASSIGNED",
      "title": "Defect ถูกมอบหมายให้คุณ",
      "message": "DEF-005: ปุ่ม Login ไม่ทำงาน",
      "isRead": false,
      "link": "/projects/uuid/defects/uuid",
      "createdAt": "2026-06-11T10:00:00.000Z"
    }
  ]
}
```

---

### `PATCH /notifications/:id/read` — ทำเครื่องหมายว่าอ่านแล้ว
ต้องใช้ Token

**Response `200`:** ข้อมูล Notification ที่อัพเดตแล้ว

---

### `PATCH /notifications/read-all` — ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
ต้องใช้ Token

**Response `200`:** `{ "data": { "updated": 5 } }`

---

### `DELETE /notifications/:id` — ลบ Notification
ต้องใช้ Token

**Response `204`:** ไม่มีข้อมูลตอบกลับ

---

### `GET /notifications/stream` — รับ Notifications แบบ Real-time (SSE)
ต้องใช้ Token
`Accept: text/event-stream`

Server-Sent Events (SSE) สำหรับรับ Notification ใหม่แบบ Real-time

**Response:** Stream ของ Events ในรูปแบบ:
```
data: {"id":"uuid","type":"COMMENT_ADDED","title":"มีความคิดเห็นใหม่","message":"...","isRead":false}

data: {"type":"ping"}
```

> การเชื่อมต่อจะส่ง `ping` event เพื่อ keep-alive ทุก 30 วินาที

---

## 18. Activity Log (ประวัติกิจกรรม)

### `GET /projects/:projectId/activity` — ประวัติกิจกรรมในโครงการ
ต้องใช้ Token | สิทธิ์ขั้นต่ำ: `VIEWER`

**Query Parameters:**
| ชื่อ | ประเภท | คำอธิบาย |
|------|--------|---------|
| `page` | number | หน้าที่ต้องการ |
| `limit` | number | จำนวนต่อหน้า |
| `userId` | string | กรองตามผู้ใช้ที่ดำเนินการ |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "action": "TEST_CASE_CREATED",
      "entityType": "TestCase",
      "entityId": "uuid",
      "entityLabel": "DEMO-001: ทดสอบ Login",
      "user": { "id": "uuid", "name": "สมชาย", "email": "..." },
      "createdAt": "2026-06-11T10:00:00.000Z"
    }
  ]
}
```

---

## 19. Health Check

### `GET /health` — ตรวจสอบสถานะระบบ
ไม่ต้องใช้ Token

**Response `200`:**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-06-11T10:26:14.972Z",
    "uptime": 3600,
    "responseTimeMs": 2,
    "services": {
      "database": {
        "status": "ok",
        "latencyMs": 2
      }
    },
    "memory": {
      "heapUsedMb": 50,
      "heapTotalMb": 52,
      "rssMb": 110
    }
  }
}
```

| Field | คำอธิบาย |
|-------|---------|
| `status` | `"ok"` = ระบบปกติ, `"error"` = มีปัญหา |
| `uptime` | เวลาที่ Server ทำงาน (วินาที) |
| `responseTimeMs` | เวลาที่ใช้ตอบกลับ Request นี้ (ms) |
| `services.database.latencyMs` | Latency ในการเชื่อมต่อฐานข้อมูล (ms) |
| `memory.heapUsedMb` | หน่วยความจำที่ใช้งานจริง (MB) |

---

*เอกสารนี้ครอบคลุม API ทั้งหมด 19 โมดูล รวม 90+ Endpoints*
*อัพเดตล่าสุด: มิถุนายน 2569*
