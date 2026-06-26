# Problems & Solutions — Test Management System

> ระบบนี้ใช้งานร่วมกันระหว่าง QA / Developer / PM
> เอกสารนี้รวบรวมปัญหาที่ยังขาดอยู่และแนวทางแก้ไข

---

## P1 — Defect Retest Workflow (HIGH)

### Problem
เมื่อ Developer แก้ bug แล้ว QA ไม่รู้ว่ามี bug ที่ต้องไป retest
- Defect มีแค่ status: `Open` / `In Progress` / `Closed`
- ไม่มี status `Fixed` ที่บอกว่า "Dev แก้แล้ว รอ QA ตรวจ"
- ไม่มี status `Retest` / `Verified` / `Reopened`
- ไม่มีประวัติว่า bug นี้ถูก reopen กี่ครั้ง
- ไม่มีการแจ้งเตือน QA เมื่อ Dev เปลี่ยน status เป็น Fixed

### Solution
**เพิ่ม Defect Status ให้ครบ lifecycle:**

```
Open → In Progress → Fixed → Retest → Verified ✅
                                     ↘ Reopened → In Progress (วนซ้ำ)
```

**การเปลี่ยนแปลงที่ต้องทำ:**
1. เพิ่ม enum `DefectStatus`: `OPEN`, `IN_PROGRESS`, `FIXED`, `RETEST`, `VERIFIED`, `CLOSED`, `REOPENED`
2. เพิ่ม field บน Defect: `retestCount Int @default(0)`, `fixedAt DateTime?`, `verifiedAt DateTime?`, `verifiedById String?`
3. Backend: เมื่อ status เปลี่ยนเป็น `FIXED` → สร้าง in-app notification ไปหา QA ที่ assigned
4. Frontend: Defect detail page แสดง status badge + transition buttons ตาม role
   - Dev เห็นปุ่ม "Mark as Fixed"
   - QA เห็นปุ่ม "Verify" และ "Reopen"
5. Defect List: เพิ่ม filter "Needs Retest" สำหรับ QA

---

## P2 — Release Readiness Dashboard (HIGH)

### Problem
PM และ TL ไม่มีหน้าสรุปที่บอกว่า "sprint นี้ปล่อย production ได้ไหม"
- ต้องเปิดหลายหน้าเพื่อรวมข้อมูลเอง
- ไม่รู้ว่ามี Critical/High bug ที่ยังเปิดอยู่กี่ตัว
- ไม่รู้ว่า test cases ผ่านกี่ % ของ sprint นี้
- ไม่มีสัญญาณ Go / No-Go ที่ชัดเจน

### Solution
**เพิ่มหน้า "Release Readiness" ใน Reports:**

แสดง panel สรุป:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Test Pass Rate | ≥ 90% | 87% | ⚠️ |
| Critical Bugs Open | 0 | 2 | ❌ |
| High Bugs Open | ≤ 3 | 1 | ✅ |
| Requirements Covered | ≥ 80% | 92% | ✅ |
| Untested Cases | 0 | 5 | ⚠️ |

**Go/No-Go Badge:**
- ✅ **GO** — ผ่านทุก threshold
- ⚠️ **CONDITIONAL** — มีบางอย่างต้องระวัง
- ❌ **NO-GO** — มี blocker (Critical bug หรือ pass rate ต่ำ)

**การเปลี่ยนแปลงที่ต้องทำ:**
1. Backend: endpoint `GET /projects/:id/reports/release-readiness?version=x&sprint=y`
2. Frontend: หน้า Reports เพิ่ม tab "Release Readiness"
3. ให้ filter ตาม sprint หรือ version ที่มีใน test run

---

## P3 — Traceability Matrix (HIGH)

### Problem
ไม่มี view เดียวที่แสดง end-to-end chain:
```
Requirement → Test Cases → Execution Result → Defects
```
- QA ไม่รู้ว่า requirement ไหนยังไม่ได้เขียน test case
- PM ไม่รู้ว่า requirement ไหนยังไม่ได้ execute
- ไม่รู้ว่า requirement ไหนมี bug ค้างอยู่

### Solution
**เพิ่ม Traceability Matrix page ใน Requirements section:**

ตารางแสดงผลแบบ:

| Requirement | Test Cases | Last Run | Pass | Fail | Open Bugs |
|-------------|------------|----------|------|------|-----------|
| REQ-001 Login | TC-001, TC-002 | Sprint 3 | 2 | 0 | 0 ✅ |
| REQ-002 Register | TC-003 | Sprint 2 | 0 | 1 | 1 ❌ |
| REQ-003 Reset PW | — | Never | — | — | — ⚠️ |

Color coding:
- ✅ Green — covered + passing + no bugs
- ⚠️ Yellow — not tested yet หรือ no test case
- ❌ Red — failing หรือ has open bug

**การเปลี่ยนแปลงที่ต้องทำ:**
1. Backend: endpoint `GET /projects/:id/requirements/traceability`
   - join Requirements + TestCases + TestResults + Defects
   - คืน summary ต่อ requirement
2. Frontend: หน้า Requirements เพิ่ม tab "Traceability Matrix"
3. Click requirement row → ดู linked test cases + results + defects

---

## P4 — Defect ↔ Test Case Linking (HIGH)

### Problem
- เมื่อ test run fail และ QA สร้าง defect → defect ไม่ได้ link กลับหา test case
- ไม่รู้ว่า defect นี้มาจาก test case ไหน
- เมื่อ defect ถูก verify → ไม่มีการ mark test result ว่าผ่านแล้ว
- ไม่มีทาง track ว่า test case นี้เคยมี bug กี่ครั้ง

### Solution
**เพิ่ม field `testCaseId` และ `testResultId` บน Defect (testResultId มีอยู่แล้วบางส่วน):**

1. เมื่อสร้าง defect จาก test result → auto-populate `testCaseId`
2. Defect detail แสดง "Found in: TC-001 — User Login" (link ไปหา test case)
3. Test Case detail แสดง "Related Defects: 2 open, 1 closed"
4. เมื่อ defect เปลี่ยน status เป็น `VERIFIED` → suggest ให้ rerun test case นั้น

**การเปลี่ยนแปลงที่ต้องทำ:**
1. Schema: เพิ่ม `testCaseId String?` บน `Defect` model
2. Backend: populate testCaseId เมื่อ create defect จาก test result
3. Frontend: TestCase detail เพิ่ม section "Defect History"

---

## P5 — Sprint / Version Report (MEDIUM)

### Problem
- Test Run มี `sprint` และ `version` field อยู่แล้ว
- แต่ไม่มีรายงานสรุปแบบ "Sprint X ทำอะไรไปบ้าง"
- PM ต้องการ sprint summary ก่อน sprint review meeting

### Solution
**เพิ่ม Sprint Summary Report:**

```
Sprint 3 — Summary
──────────────────────────────
Test Cases Executed:  45
  Pass:               38 (84%)
  Fail:               5  (11%)
  Blocked:            2  (4%)

New Bugs Found:       7
  Critical:           1
  High:               3
  Medium/Low:         3

Bugs Resolved:        5
Bugs Carried Over:    2

Requirements Tested:  12/15 (80%)
```

**การเปลี่ยนแปลงที่ต้องทำ:**
1. Backend: endpoint `GET /projects/:id/reports/sprint-summary?sprint=x`
2. Frontend: Reports เพิ่ม tab "Sprint Summary" พร้อม dropdown เลือก sprint
3. เพิ่มปุ่ม Export PDF สำหรับแนบใน sprint review

---

## P6 — Notification System (MEDIUM)

### Problem
ทีมไม่รู้เมื่อมีสิ่งสำคัญเกิดขึ้น:
- Dev ไม่รู้เมื่อมี defect ถูก assign ให้ตัวเอง
- QA ไม่รู้เมื่อ Dev mark bug ว่า Fixed (ต้องไป retest)
- PM ไม่รู้เมื่อ test run เสร็จสมบูรณ์
- ทุกคนต้องเข้ามาเช็คระบบเองตลอดเวลา

### Solution
**ระบบ In-App Notification เบื้องต้น:**

| Event | Notify |
|-------|--------|
| Defect assigned | Assignee |
| Defect status → Fixed | QA ที่ create defect |
| Defect status → Verified | Assignee (Dev) |
| Defect Reopened | Assignee (Dev) |
| Test Run completed | Project Manager |

**การเปลี่ยนแปลงที่ต้องทำ:**
1. Schema: เพิ่ม `Notification` model (id, userId, type, message, link, isRead, createdAt)
2. Backend: service สร้าง notification เมื่อ event trigger
3. Frontend: bell icon บน Sidebar แสดง unread count + dropdown list
4. Mark as read เมื่อ click

---

## P7 — Test Plan (MEDIUM)

### Problem
ปัจจุบันมี Test Run (การ execute) แต่ขาด Test Plan ระดับวางแผน:
- ไม่มีที่กำหนดว่า sprint นี้จะ test อะไร ใครรับผิดชอบ deadline เมื่อไหร่
- Test Run หลายอันกระจัดกระจาย ไม่รู้ว่าเป็นส่วนของ sprint ไหน
- QA Lead ไม่สามารถ assign งาน test ให้ทีมได้อย่างเป็นระบบ

### Solution
**เพิ่ม Test Plan layer:**

```
Test Plan (Sprint 3 — v1.2.0)
  ├── Scope: REQ-001 to REQ-010
  ├── Assignees: QA1, QA2
  ├── Target Date: 2026-06-20
  ├── Status: In Progress (60%)
  └── Test Runs:
      ├── Run #12 — Smoke Tests (Done)
      ├── Run #13 — Regression (In Progress)
      └── Run #14 — UAT (Pending)
```

**การเปลี่ยนแปลงที่ต้องทำ:**
1. Schema: เพิ่ม `TestPlan` model (id, projectId, name, sprint, version, targetDate, status)
2. TestRun เพิ่ม `planId String?` field
3. Backend: CRUD สำหรับ TestPlan
4. Frontend: หน้า Test Plans ใน sidebar

---

## P8 — Test Case Review Workflow (LOW)

### Problem
QA เขียน test case แล้ว execute ได้เลย ไม่มี review process:
- Test case คุณภาพต่ำ / ไม่ครอบคลุม scenario จริงอาจผ่านไป
- QA Lead ไม่มีช่องทาง approve test case ก่อน execute

### Solution
**เพิ่ม status transition:**
```
Draft → In Review → Approved → Active
                  ↘ Rejected → Draft (พร้อม comment)
```

- เฉพาะ status `Approved` / `Active` ถึงจะ include ใน test run ได้
- QA Lead (Manager role) สามารถ approve/reject พร้อม comment

---

## P9 — Activity Log / Audit Trail (LOW)

### Problem
ไม่มีประวัติว่าใครแก้อะไร เมื่อไหร่:
- Test case ถูกแก้โดยใคร
- Defect status เปลี่ยนเมื่อไหร่ โดยใคร
- ไม่มี accountability

### Solution
**เพิ่ม Activity Log:**
1. Schema: `ActivityLog` model (id, projectId, userId, action, entityType, entityId, diff, createdAt)
2. Log ทุก create/update/delete บน TestCase, TestRun, Defect
3. Frontend: แสดง activity feed ใน project dashboard และใน entity detail

---

## สรุป Roadmap แนะนำ

### Phase 1 — Core Workflow (ทำก่อน)
| # | Feature | ประโยชน์ |
|---|---------|---------|
| P1 | Defect Retest Workflow | Dev แก้ bug → QA รู้ต้องไป retest |
| P2 | Release Readiness Dashboard | PM ตัดสินใจปล่อยได้ทันที |
| P3 | Traceability Matrix | เห็น req → test → result ในที่เดียว |
| P4 | Defect ↔ Test Case Linking | รู้ว่า bug มาจาก test case ไหน |

### Phase 2 — Team Efficiency
| # | Feature | ประโยชน์ |
|---|---------|---------|
| P5 | Sprint Report | สรุปผลก่อน sprint review meeting |
| P6 | Notification System | ไม่ต้องเช็คระบบเองตลอดเวลา |
| P7 | Test Plan | QA Lead วางแผนและ assign งานได้ |

### Phase 3 — Quality & Governance
| # | Feature | ประโยชน์ |
|---|---------|---------|
| P8 | Test Case Review | test case quality control |
| P9 | Activity Log | audit trail + accountability |

---

*Last updated: 2026-06-11*
*Author: System Analysis*
