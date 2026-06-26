# Product Requirements Document (PRD)
## TestManager — แอปพลิเคชันจัดการการทดสอบ

**Version:** 3.1
**Date:** 2026-06-22
**Status:** Active Development

> **การขยายขอบเขต v2.0:** จากการวิเคราะห์เทมเพลต Google Sheets "DTOP MoVe - Test Cases"
> (`1maKuhBClm2Cz2-aWyLBKZJCZX0-p60YtFPPl176J3xY`) เวอร์ชันนี้จะแทนที่สเปรดชีตดังกล่าวทั้งหมด
> ด้วยเว็บแอปพลิเคชันที่สร้างขึ้นเพื่อวัตถุประสงค์นี้โดยเฉพาะ ครอบคลุมทุก 6 แท็บในชีต

> **การขยายขอบเขต v3.0:** เพิ่มโมดูลใหม่เพื่อรองรับกระบวนการ QA ที่ครบวงจร ได้แก่
> Requirements Management (พร้อม Traceability Matrix และ Document Attachments),
> Test Plans, Notifications (Real-time SSE), Activity Log และ Global User Management
> นอกจากนี้ยังเพิ่ม DEVELOPER ในฐานะ User Role ระดับระบบ

> **การขยายขอบเขต v3.1:** ปรับปรุงฟีเจอร์ที่มีอยู่ให้สมบูรณ์ยิ่งขึ้น ได้แก่
> Activity Log ครบวงจร, Test Case Bulk Operations, Suite Drag-and-Drop Reorder,
> Defect Comments Thread, Defect Retest Workflow, Test Plan ↔ Test Run Linking,
> DefectHistory และ ActivityFeed Sidebar ในหน้า Test Case Detail,
> "Log Defect" Button ใน Test Run Executor และ Export Excel สำหรับ Defects และ Run Results

---

## 1. ภาพรวมของผลิตภัณฑ์

TestManager คือแพลตฟอร์มจัดการการทดสอบบนเว็บ ที่ช่วยให้ทีม QA สามารถเขียน test case ติดตาม defect รัน test run จัดการ UAT session รัน daily QA checklist จัดการ requirements, วางแผนการทดสอบ และสร้างรายงานระดับผู้บริหาร — ทั้งหมดในแอปพลิเคชันเดียว ระบบนี้แทนที่กระบวนการทำงาน QA ที่ใช้สเปรดชีต (Excel/Google Sheets) ด้วยอินเทอร์เฟซเว็บที่มีโครงสร้าง ทำงานร่วมกันได้ และตรวจสอบได้

---

## 2. เป้าหมายและวัตถุประสงค์

| เป้าหมาย | ตัวชี้วัดความสำเร็จ |
|------|----------------|
| แทนที่กระบวนการ QA ที่ใช้สเปรดชีต | ทุก 6 แท็บในเทมเพลตอ้างอิงมีเว็บเทียบเท่า |
| รวมศูนย์การจัดการ test case | TC ทุกรายการจัดเก็บ กรองได้ และค้นหาได้พร้อม metadata ครบถ้วน |
| ปรับปรุงการรัน test ให้คล่องตัว | Test run และ UAT session สร้าง รัน และเสร็จสมบูรณ์ได้แบบ end-to-end |
| รองรับการติดตาม defect | Defect เชื่อมโยงกับ test case พร้อมการจัดการ lifecycle ของสถานะ |
| รองรับการปฏิบัติงาน QA รายวัน | Daily checklist กรอกและบันทึกต่อ session ได้ |
| มอบความมองเห็นระดับผู้บริหาร | KPI dashboard ที่คำนวณอัตโนมัติครอบคลุมทุก module |
| รองรับการทดสอบ ad-hoc | รับและติดตามคำร้องที่อยู่นอกขอบเขตจนเสร็จสมบูรณ์ |
| รองรับการนำเข้าข้อมูลจากสเปรดชีตจำนวนมาก | สามารถนำเข้าไฟล์ Google Sheets / Excel ที่มีอยู่ได้ |
| รองรับ Requirements Traceability | Requirement ทุกรายการ link กับ test case และติดตาม pass rate ได้ |
| รองรับการวางแผนการทดสอบ | Test plan สร้าง กำหนด assignee ผูก test run และติดตามสถานะได้ |
| แจ้งเตือน Real-time | สมาชิกทีมได้รับแจ้งเตือนเมื่อมีกิจกรรมที่เกี่ยวข้อง |
| ตรวจสอบย้อนหลังได้ | Activity log บันทึกทุกการเปลี่ยนแปลงสำคัญในระดับโปรเจกต์ |

---

## 3. กลุ่มผู้ใช้เป้าหมาย

| บุคลิก | คำอธิบาย |
|---------|-------------|
| **QA Lead / Manager** | สร้างโปรเจกต์ จัดการสมาชิกทีม ตรวจสอบรายงาน อนุมัติการ sign-off UAT สร้าง requirements และ test plans |
| **Test Engineer / Tester** | เขียน test case รัน test run บันทึก defect กรอก daily checklist ผูก test case กับ requirement |
| **Developer** | ดู defect และผลการทดสอบที่เกี่ยวข้องกับฟีเจอร์ของตน รับแจ้งเตือนเมื่อ defect ถูกมอบหมาย |
| **UAT Tester / Business User** | รัน UAT test case และ sign off การยอมรับ |
| **Stakeholder / Viewer** | เข้าถึงรายงาน สถานะ UAT และ management dashboard แบบอ่านอย่างเดียว |

---

## 4. บทบาทผู้ใช้และสิทธิ์การใช้งาน

ระบบบังคับใช้ลำดับชั้นบทบาท: **ADMIN > MANAGER > TESTER > DEVELOPER > VIEWER**

**บทบาทระดับระบบ (Global Role):**

| Role | คำอธิบาย |
|------|---------|
| `ADMIN` | สิทธิ์สูงสุด เข้าถึงทุกโปรเจกต์ จัดการผู้ใช้ระดับระบบได้ |
| `MANAGER` | สร้างและจัดการโปรเจกต์ที่ตนเป็นสมาชิก |
| `TESTER` | เขียนและรัน test ในโปรเจกต์ที่ตนเป็นสมาชิก |
| `DEVELOPER` | Read-only เหมือน Viewer ออกแบบมาสำหรับ developer workflow (ดู defect, test result) |
| `VIEWER` | อ่านข้อมูลได้อย่างเดียว ไม่สามารถสร้างหรือแก้ไขสิ่งใดได้ |

**สิทธิ์ต่อ Role (ระดับโปรเจกต์):**

| การกระทำ | ADMIN | MANAGER | TESTER | DEVELOPER | VIEWER |
|--------|:-----:|:-------:|:------:|:---------:|:------:|
| สร้าง / ลบโปรเจกต์ | ✓ | ✓ | — | — | — |
| จัดการสมาชิกโปรเจกต์ | ✓ | ✓ | — | — | — |
| สร้าง / แก้ไข test case | ✓ | ✓ | ✓ | — | — |
| ลบ test case | ✓ | ✓ | — | — | — |
| Bulk Operations บน test case | ✓ | ✓ | ✓ | — | — |
| สร้าง / รัน test run | ✓ | ✓ | ✓ | — | — |
| บันทึก / อัปเดต defect | ✓ | ✓ | ✓ | — | — |
| ปิด / แก้ไข defect | ✓ | ✓ | — | — | — |
| ดู defect | ✓ | ✓ | ✓ | ✓ | ✓ |
| กรอก daily QA checklist | ✓ | ✓ | ✓ | — | — |
| สร้าง / จัดการ UAT session | ✓ | ✓ | — | — | — |
| รัน UAT test case | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sign off UAT | ✓ | ✓ | — | — | — |
| ส่ง ad-hoc case | ✓ | ✓ | ✓ | — | — |
| แปลง ad-hoc เป็น test case / defect | ✓ | ✓ | ✓ | — | — |
| นำเข้า test case (CSV/Excel) | ✓ | ✓ | ✓ | — | — |
| สร้าง / แก้ไข requirement | ✓ | ✓ | — | — | — |
| ผูก test case กับ requirement | ✓ | ✓ | ✓ | — | — |
| สร้าง / แก้ไข test plan | ✓ | ✓ | — | — | — |
| ผูก / ถอด test run กับ test plan | ✓ | ✓ | — | — | — |
| ดูรายงานและ management summary | ✓ | ✓ | ✓ | ✓ | ✓ |
| จัดการผู้ใช้ (global) | ✓ | — | — | — | — |

> ลำดับชั้นบทบาทถูกบังคับใช้ทั้งในระดับโปรเจกต์ (`ProjectMemberRole`) และระดับระบบ (`UserRole`) สิทธิ์ที่มีผลของผู้ใช้คือระดับที่สูงกว่าในสองระดับนั้น

---

## 5. ฟีเจอร์หลัก

### 5.1 การยืนยันตัวตนและการจัดการผู้ใช้

- **FR-AUTH-01:** ผู้ใช้สามารถลงทะเบียนด้วยชื่อ email และรหัสผ่าน (ขั้นต่ำ 8 ตัวอักษร)
- **FR-AUTH-02:** ผู้ใช้สามารถเข้าสู่ระบบด้วย email และรหัสผ่าน
- **FR-AUTH-03:** Session ใช้ JWT access token (หมดอายุใน 15 นาที) พร้อม silent refresh ผ่าน httpOnly refresh token cookie (หมดอายุใน 7 วัน)
- **FR-AUTH-04:** ผู้ใช้สามารถออกจากระบบ ซึ่งจะทำให้ refresh token หมดอายุ
- **FR-AUTH-05:** ผู้ใช้ที่เข้าสู่ระบบสามารถดูและอัปเดตโปรไฟล์ของตนเองได้จากหน้า Profile ใน Header bar
- **FR-AUTH-06:** ผู้ใช้สามารถเปลี่ยนรหัสผ่านของตนเองได้จากหน้า Profile
- **FR-AUTH-07:** Endpoint เข้าสู่ระบบถูกจำกัดอัตราที่ 5 ครั้งต่อ 15 นาทีต่อ IP

---

### 5.2 การจัดการโปรเจกต์

- **FR-PROJ-01:** ผู้ใช้ที่เข้าสู่ระบบสามารถสร้างโปรเจกต์ด้วยชื่อ key ที่ไม่ซ้ำกัน (เช่น `DTOP`) และคำอธิบายที่เป็นตัวเลือก
- **FR-PROJ-02:** Project key ใช้เป็น prefix สำหรับ ID ของ test case ที่สร้างอัตโนมัติ
- **FR-PROJ-03:** เจ้าของโปรเจกต์สามารถเพิ่มและลบสมาชิกทีม โดยกำหนดบทบาทให้แต่ละคน
- **FR-PROJ-04:** ผู้ใช้สามารถเป็นสมาชิกของหลายโปรเจกต์โดยมีบทบาทต่างกันในแต่ละโปรเจกต์
- **FR-PROJ-05:** โปรเจกต์สามารถเก็บถาวรได้ (soft delete ผ่าน flag `isActive`)
- **FR-PROJ-06:** หน้าภาพรวมโปรเจกต์แสดงจำนวน test case, defect ที่เปิดอยู่, run ที่ดำเนินการอยู่, และ UAT session

---

### 5.3 โครงสร้างลำดับชั้น Test Suite

โครงสร้าง suite สะท้อนลำดับชั้น **Module → Sub-Module → Test Scenario** จากสเปรดชีตอ้างอิง (3 ระดับ)

- **FR-SUITE-01:** Test suite ก่อตัวเป็นลำดับชั้น 3 ระดับ: Module → Sub-Module → Scenario
- **FR-SUITE-02:** ผู้ใช้สามารถสร้าง เปลี่ยนชื่อ เรียงลำดับใหม่ด้วย drag-and-drop และลบ suite ในทุกระดับ
- **FR-SUITE-03:** การลบ suite หลักไม่ลบ suite ย่อยหรือ test case — จะถูก unlink แทน
- **FR-SUITE-04:** Suite tree แสดงในแถบด้านซ้ายของหน้า Test Cases
- **FR-SUITE-05:** การเลือก node ใน tree จะกรอง test case ไปยัง suite นั้นและทุก suite ที่อยู่ภายใต้
- **FR-SUITE-06:** Suite สามารถเรียงลำดับใหม่ได้ผ่าน drag-and-drop โดยใช้ `@dnd-kit` และบันทึก sort order ไปยัง server ทันที

---

### 5.4 Test Cases

โมเดล test case แมปโดยตรงกับชีต **Master Test Cases** ที่มี 34 คอลัมน์

- **FR-TC-01:** Test case อยู่ในโปรเจกต์และอาจอยู่ใน suite ด้วยก็ได้ (ในระดับใดก็ได้ของลำดับชั้น)
- **FR-TC-02:** แต่ละ test case จัดเก็บฟิลด์ดังต่อไปนี้:

  **ข้อมูลประจำตัวและการจำแนก**
  | Field | Type | Notes |
  |-------|------|-------|
  | TC-ID | String | Auto-generated: `{PROJ_KEY}-{SEQ}` |
  | Title | String | Required |
  | Module / Suite | FK → Suite | การจัดกลุ่มระดับบนสุด |
  | Sub-Module | FK → Suite | การจัดกลุ่มระดับสอง |
  | Test Scenario | FK → Suite | การจัดกลุ่มระดับสาม |
  | Platform / Portal | Enum | WEB_PORTAL, MOBILE_APP, API, ADMIN_PORTAL |
  | Development Source | String | เช่น DTOP, ชื่อทีมภายใน |
  | Requirement ID | String | การอ้างอิง requirement ภายนอก (เช่น CR-001) |

  **เนื้อหาการทดสอบ**
  | Field | Type | Notes |
  |-------|------|-------|
  | Description / Preconditions | Text | เงื่อนไขการตั้งค่า |
  | Test Steps | Ordered list | แต่ละขั้นตอน: action + expected result |
  | Test Data | Text | ข้อมูลตัวอย่างสำหรับการรัน |
  | Expected Result | Text | ผลลัพธ์ที่คาดหวังโดยรวม |

  **การจำแนกประเภท**
  | Field | Type | Values |
  |-------|------|--------|
  | Priority | Enum | CRITICAL / HIGH / MEDIUM / LOW |
  | Severity | Enum | CRITICAL / HIGH / MEDIUM / LOW |
  | Test Type | Enum | FUNCTIONAL / NON_FUNCTIONAL / INTEGRATION / REGRESSION / SMOKE / UAT / PERFORMANCE / SECURITY |
  | Test Environment | Enum | STAGING / DEV / UAT / PRODUCTION |
  | Automation Status | Enum | MANUAL / AUTOMATED / IN_PROGRESS |
  | Review Status | Enum | DRAFT / READY / IN_REVIEW / APPROVED / REJECTED |
  | Review Comment | Text | หมายเหตุจากผู้ review เมื่อ REJECTED |
  | Status | Enum | ACTIVE / DRAFT / ARCHIVED |
  | Tags | String[] | ป้ายกำกับแบบอิสระ |

  **บริบทคำร้อง** (สำหรับ change request / ที่มาจาก ad-hoc)
  | Field | Type |
  |-------|------|
  | Request Type | String |
  | Urgency Flag | Enum: NORMAL / HIGH / CRITICAL |
  | Source / Requestor | String |
  | Impact Assessment | Text |
  | Design Screenshot URL | String |

  **การติดตามการรัน** (สะท้อนผลลัพธ์ล่าสุด)
  | Field | Type | Notes |
  |-------|------|-------|
  | Last Execution Status | Enum | NOT_RUN / PASS / FAIL / BLOCKED / SKIPPED |
  | Actual Result | Text | จากการรันครั้งล่าสุด |
  | Evidence / Proof | String | URL ไปยังภาพหน้าจอ/การบันทึก |
  | Linked Defect ID | FK → Defect | กำหนดเมื่อการรันล้มเหลว |
  | Notes / Findings | Text | ข้อสังเกตของ QA |
  | QA Suggestion | Text | คำแนะนำของ QA |
  | PM Decision | Text | การตอบสนองของ PM |
  | Assigned Developer | String | Developer ที่รับผิดชอบ |
  | Created By | FK → User | |
  | Created Date | DateTime | |
  | Last Updated | DateTime | |

- **FR-TC-03:** แต่ละ test step มี: ลำดับ, action, expected result
- **FR-TC-04:** สามารถเพิ่ม ลบ และเรียงลำดับ step ใหม่ได้ในฟอร์ม
- **FR-TC-05:** TC-ID ถูกสร้างอัตโนมัติต่อโปรเจกต์โดยใช้ key prefix และตัวนับลำดับ
- **FR-TC-06:** Test case สามารถกรองโดย: suite, สถานะ, priority, severity, ประเภทการทดสอบ, environment, automation status, review status, requirement ID, และการค้นหาแบบข้อความอิสระ
- **FR-TC-07:** Test case รองรับ pagination (ค่าเริ่มต้น 20 รายการต่อหน้า สูงสุด 100)
- **FR-TC-08:** Test case สามารถสร้างทีละรายการผ่านฟอร์ม หรือนำเข้าจำนวนมากผ่านการนำเข้าไฟล์
- **FR-TC-09:** หน้ารายละเอียด test case แสดงทุกฟิลด์ ขั้นตอน defect ที่เชื่อมโยง และประวัติการรัน
- **FR-TC-10:** Test case รองรับ Bulk Operations: ย้าย Suite, เปลี่ยนสถานะ, ลบพร้อมกันหลายรายการ โดยเลือกผ่าน checkbox และแสดง toolbar
- **FR-TC-11:** Test case รองรับ Comments — สมาชิกทีมสามารถแสดงความคิดเห็น อภิปราย หรือบันทึกข้อสังเกต
- **FR-TC-12:** หน้า Test Case Detail แสดง Defect History Section และ Activity Feed Sidebar แบบ real-time ใน sidebar ด้านขวา
- **FR-TC-13:** Review Status รองรับสถานะ REJECTED พร้อม `reviewComment` ที่บันทึกเหตุผลจากผู้ review

---

### 5.5 การนำเข้าจำนวนมาก (Excel / CSV)

รองรับการนำเข้าจากไฟล์ที่มีโครงสร้างเหมือนเทมเพลต Google Sheets อ้างอิง

- **FR-IMP-01:** ผู้ใช้สามารถอัปโหลดไฟล์ `.xlsx`, `.xls`, หรือ `.csv`
- **FR-IMP-02:** ระบบตรวจจับ column mapping อัตโนมัติจาก header alias ทั่วไป (ไม่คำนึงถึงตัวพิมพ์เล็ก/ใหญ่)
- **FR-IMP-03:** หลายแถวที่มี TC-ID เดียวกันจะถูกจัดกลุ่มเป็น test case เดียวที่มีหลาย step
- **FR-IMP-04:** ตัวอย่างการนำเข้าแสดง 50 แถวแรกก่อนยืนยัน
- **FR-IMP-05:** มีเทมเพลต `.xlsx` ที่ดาวน์โหลดได้โดยไม่ต้อง Login (`@Public` endpoint)
- **FR-IMP-06:** Module / Sub-Module / Scenario ที่อ้างอิงในไฟล์จะถูกสร้างเป็น suite โดยอัตโนมัติ
- **FR-IMP-07:** การนำเข้าคืนค่าสรุป: จำนวนแถวทั้งหมด นำเข้าแล้ว ล้มเหลว และรายละเอียดข้อผิดพลาด

---

### 5.6 Test Runs

- **FR-RUN-01:** Test run สร้างขึ้นโดยการเลือก test case จากโปรเจกต์ (กรองได้ตาม module, priority, environment)
- **FR-RUN-02:** แต่ละ run มี: ชื่อ คำอธิบาย sprint, version และสถานะ (PENDING / IN_PROGRESS / COMPLETED / ABORTED)
- **FR-RUN-03:** สำหรับแต่ละ test case ที่เลือก จะสร้าง result record ที่มีสถานะ PENDING
- **FR-RUN-04:** Tester รันแต่ละ result โดยกำหนดสถานะ (PASS / FAIL / BLOCKED / SKIPPED) เพิ่มหมายเหตุ และอัปโหลด evidence URL
- **FR-RUN-05:** สถานะ run อัปเดตอัตโนมัติ: IN_PROGRESS เมื่อมี result ใดถูกกำหนด, COMPLETED เมื่อ result ทั้งหมดได้รับการแก้ไข
- **FR-RUN-06:** เมื่อ result ถูกกำหนดเป็น FAIL หรือ BLOCKED ปุ่ม "Log Defect" จะปรากฏ ให้ Tester สร้าง defect ใหม่ที่เชื่อมโยงกับ result นั้นโดยตรง
- **FR-RUN-07:** Run ที่เสร็จสมบูรณ์แสดงสรุป pass/fail/blocked/skipped/pending
- **FR-RUN-08:** Test run แสดงรายการตามลำดับเวลาจากล่าสุดไปเก่าสุด
- **FR-RUN-09:** ผลการรันครั้งล่าสุดจะถูกเขียนกลับไปยังฟิลด์ `lastExecutionStatus` ของ test case
- **FR-RUN-10:** Export ผลการทดสอบเป็นไฟล์ Excel ได้

---

### 5.7 Defect Log

แมปกับแท็บชีต **Defect Log** Defect เชื่อมโยงกับ test case และมี lifecycle เป็นของตัวเอง

- **FR-DEF-01:** Defect สามารถสร้างจาก test result ที่ล้มเหลว หรือสร้างด้วยตนเองจากหน้า Defect Log
- **FR-DEF-02:** แต่ละ defect มี:
  | Field | Type |
  |-------|------|
  | Defect ID | Auto-generated: `DEF-{SEQ}` |
  | Test Case ID | FK → TestCase (optional) |
  | Module | String (สืบทอดจาก test case หรือกรอกด้วยตนเอง) |
  | Defect Title | String (required) |
  | Description | Text |
  | Steps to Reproduce | Text |
  | Expected Result | Text |
  | Actual Result | Text |
  | Severity | Enum: CRITICAL / HIGH / MEDIUM / LOW |
  | Priority | Enum: CRITICAL / HIGH / MEDIUM / LOW |
  | Status | Enum: OPEN / IN_PROGRESS / FIXED / RETEST / VERIFIED / REOPENED / CLOSED / WONTFIX |
  | Assigned To | FK → User |
  | Related Defect ID | FK → Defect (optional) |
  | Bug Pattern | String |
  | Attachment URLs | String[] |
  | Test Result ID | FK → TestResult (optional) |
  | Comments | DefectComment[] |
  | Retest Count | Int |
  | Fixed At | DateTime (optional) |
  | Verified At | DateTime (optional) |
  | Verified By | FK → User (optional) |
  | Created By | FK → User |
  | Created At | DateTime |
  | Updated At | DateTime |

- **FR-DEF-03:** สถานะ defect เป็นไปตาม workflow:
  ```
  OPEN → IN_PROGRESS → FIXED → RETEST → VERIFIED → CLOSED
    ↕                    ↑
    REOPENED ←───────────┘
    WONTFIX (ณ จุดใดก็ได้โดย Manager+)
  ```
- **FR-DEF-04:** รายการ defect รองรับการกรองตามสถานะ severity, priority, module และผู้รับผิดชอบ
- **FR-DEF-05:** จากหน้ารายละเอียด defect ผู้ใช้สามารถไปยัง test case ที่เชื่อมโยงได้
- **FR-DEF-06:** หน้ารายละเอียด test case แสดงจำนวนและลิงก์ไปยัง defect ทั้งหมดที่เชื่อมโยง
- **FR-DEF-07:** Defect รองรับ Comments thread เพื่อติดตามการสนทนาและความคืบหน้า
- **FR-DEF-08:** Export รายการ defect ทั้งหมดเป็นไฟล์ Excel ได้
- **FR-DEF-09:** หน้ารายละเอียด defect แสดง Retest Timeline ที่บันทึก retest count, fixed at, verified at และ verified by
- **FR-DEF-10:** ปุ่ม transition สถานะใน Defect Detail แสดงตาม Role ที่มีสิทธิ์ (role-aware)
- **FR-DEF-11:** เมื่อ defect ถูก VERIFIED ระบบแนะนำให้รัน test run อีกครั้งเพื่อยืนยัน

---

### 5.8 Daily QA Checklist

แมปกับแท็บชีต **Daily QA Checklist** ตรวจสอบให้แน่ใจว่า QA environment ได้รับการตรวจสอบก่อนเริ่มการทดสอบในแต่ละวัน

- **FR-CHK-01:** โปรเจกต์มีชุด checklist item ที่กำหนดค่าได้ (เช่น "ตรวจสอบว่า test environment เข้าถึงได้")
- **FR-CHK-02:** Checklist item สามารถสร้าง แก้ไข เรียงลำดับใหม่ และลบได้โดย Manager+
- **FR-CHK-03:** ในแต่ละวัน Tester+ สามารถเปิด Daily Checklist และทำเครื่องหมายแต่ละ item เป็น: DONE / SKIPPED / BLOCKED
- **FR-CHK-04:** แต่ละรายการ checklist มีฟิลด์หมายเหตุและบันทึกวันที่และผู้ใช้ที่กรอก
- **FR-CHK-05:** Checklist session (บันทึกของวันหนึ่ง) เชื่อมโยงกับโปรเจกต์และวันที่ — มีได้เพียงหนึ่ง session ต่อโปรเจกต์ต่อวัน
- **FR-CHK-06:** ประวัติ checklist แสดง session ก่อนหน้า (วันที่, ผู้ที่กรอกเสร็จ, สรุป pass/fail)

---

### 5.9 UAT Test & Sign-Off

แมปกับแท็บชีต **UAT Test & Sign-Off** จัดการ session การทดสอบการยอมรับจากผู้ใช้อย่างเป็นทางการพร้อม sign-off จากผู้มีส่วนได้เสีย

- **FR-UAT-01:** UAT session สร้างโดย Manager+ ด้วย: ชื่อโปรเจกต์ version, environment URL, ช่วง UAT (วันเริ่ม/สิ้นสุด) และผู้ติดต่อสนับสนุน
- **FR-UAT-02:** Test case ถูกเลือกและเพิ่มใน UAT session (ตาม module หรือทีละรายการ)
- **FR-UAT-03:** UAT tester (บทบาท VIEWER หรือสูงกว่า) สามารถรัน UAT test case แต่ละรายการโดยบันทึก: PASS / FAIL / BLOCKED และเพิ่มความคิดเห็น
- **FR-UAT-04:** แต่ละ UAT result มี: ชื่อ tester, วันที่รัน, actual result และ evidence URL
- **FR-UAT-05:** ความคืบหน้าของ UAT session ถูกติดตามด้วย pass rate และเปอร์เซ็นต์ความสมบูรณ์
- **FR-UAT-06:** Manager+ สามารถ sign off UAT session อย่างเป็นทางการ โดยทำเครื่องหมายเป็น SIGNED_OFF หรือ REJECTED พร้อม sign-off note
- **FR-UAT-07:** UAT report ถูกสร้างขึ้นแสดง: สถิติสรุป การแบ่งรายละเอียดต่อ module, สถานะ sign-off และรายชื่อ tester ที่ sign off
- **FR-UAT-08:** UAT report ที่ sign แล้วสามารถ export เป็น PDF ได้ผ่าน Exports endpoint

---

### 5.10 Ad-Hoc Special Cases

แมปกับแท็บชีต **Ad-Hoc Special Cases** รับคำร้องการทดสอบที่อยู่นอกขอบเขตหรือฉุกเฉิน ซึ่งไม่เหมาะกับ workflow ของ test case มาตรฐาน

- **FR-ADHOC-01:** Tester+ ใดก็ตามสามารถส่ง ad-hoc case ด้วย: Request Date, Requestor, Request Type, Urgency (NORMAL / HIGH / CRITICAL), Source System, Module (ถ้าทราบ), Issue Description, Impact Assessment และ Affected Environment
- **FR-ADHOC-02:** Ad-hoc ID ถูกสร้างอัตโนมัติ: `ADHOC-{SEQ}`
- **FR-ADHOC-03:** หลังการตรวจสอบ tester บันทึก: Test Approach, Test Steps Performed, Test Data Used, Findings / Actual Result
- **FR-ADHOC-04:** สถานะเป็นไปตาม: OPEN → IN_PROGRESS → RESOLVED / ESCALATED
- **FR-ADHOC-05:** ฟิลด์การแก้ไข: Severity, Assigned QA, Assigned Developer, Related Bug ID, Related TC-ID, Resolution notes, Completion Date
- **FR-ADHOC-06:** Tester+ สามารถแปลง ad-hoc case ที่แก้ไขแล้วเป็น test case อย่างเป็นทางการ — สร้าง TestCase record ใหม่ที่กรอกข้อมูลล่วงหน้าจากข้อมูล ad-hoc
- **FR-ADHOC-07:** Tester+ สามารถแปลง ad-hoc case เป็น Defect อย่างเป็นทางการ — สร้าง Defect record ใหม่
- **FR-ADHOC-08:** รายการ ad-hoc รองรับการกรองตาม urgency, สถานะ, module และ requestor

---

### 5.11 Management Summary Dashboard

แมปกับแท็บชีต **Management Summary** ให้ QA KPI ที่คำนวณอัตโนมัติครอบคลุมทุก module

- **FR-MGT-01:** การ์ดสรุประดับโปรเจกต์แสดง:
  - จำนวน Test Case ทั้งหมด (ตามสถานะ: Active / Draft / Archived)
  - จำนวน Test Case ทั้งหมดตาม Module
  - จำนวน Defect ทั้งหมด (ตามสถานะ: Open / In Progress / Fixed / Closed)
  - อัตรา pass ของ Test Run (ข้าม N run ล่าสุด)
  - ความครอบคลุมของ Automation (Automated / Manual / In Progress)
  - สถานะ UAT session

- **FR-MGT-02:** ตารางรายละเอียดต่อ module แสดงจำนวนต่อ module ของ: จำนวน TC ทั้งหมด ตาม priority ตาม review status และอัตรา pass ของ run ล่าสุด

- **FR-MGT-03:** Global dashboard รวบรวมสถิติจากทุกโปรเจกต์ของผู้ใช้ แถวที่สอง (second row) แสดง: Open Defects, UAT Pending Sign-Off, Never-Run Cases, My Assigned Defects

- **FR-MGT-04:** Project Dashboard แสดง ActivityFeed Sidebar ที่แสดงกิจกรรมล่าสุด 30 รายการของโปรเจกต์

---

### 5.12 รายงาน (Reports)

- **FR-REP-01:** หน้ารายงานต่อโปรเจกต์แสดงตัวชี้วัดใน 6 กราฟ:
  1. **Defect Trend Chart** — กราฟเส้นแสดงแนวโน้ม Defect รายวัน ย้อนหลัง 30 วัน
  2. **Pass Rate Trend Chart** — กราฟแท่งแสดง Pass Rate ของ 10 Test Run ล่าสุด
  3. **Automation Coverage Chart** — กราฟ Pie แสดงสัดส่วน Manual / Automated / In Progress
  4. **Requirement Coverage Chart** — กราฟแสดงเปอร์เซ็นต์ Requirements ที่ cover แล้ว
  5. **Release Readiness Card** — สรุปความพร้อมก่อน release (pass rate, open critical defects, requirement coverage)
  6. **Sprint Summary Report** — สรุปผลต่อ sprint: test cases run, pass rate, defects found/closed
- **FR-REP-02:** รายงานกรองได้ตามช่วงวันที่ module และ environment
- **FR-REP-03:** Global dashboard แสดงยอดรวมจากทุกโปรเจกต์ที่เข้าถึงได้
- **FR-REP-04:** ผู้ใช้สามารถ Print หน้า Reports เป็น PDF ผ่านฟังก์ชัน Print ของเบราว์เซอร์

---

### 5.13 Requirements Management

- **FR-REQ-01:** Manager+ สามารถสร้าง Requirement พร้อมชื่อ, คำอธิบาย, Priority และ External ID (เช่น JIRA ticket) แต่ละ requirement ได้รับ ID อัตโนมัติ (`REQ-{SEQ}`)
- **FR-REQ-02:** Tester+ สามารถผูก Test Case กับ Requirement เพื่อสร้าง Traceability
- **FR-REQ-03:** ระบบแสดง Coverage Statistics: จำนวน Requirement ทั้งหมด, กี่รายการที่มี Test Case ผูก, เปอร์เซ็นต์ที่ผ่านการทดสอบ
- **FR-REQ-04:** Traceability Matrix แสดง Requirement x Test Case พร้อมสถานะผลการทดสอบล่าสุด (แสดงในแท็บแยกต่างหากในหน้า Requirements)
- **FR-REQ-05:** Tester+ สามารถแนบเอกสาร (URL หรือ link) เข้ากับ Requirement แต่ละรายการ
- **FR-REQ-06:** Manager+ สามารถลบเอกสารที่แนบกับ Requirement
- **FR-REQ-07:** รายการ Requirement รองรับการค้นหาตามชื่อและกรองตาม Priority

---

### 5.14 Test Plans

- **FR-PLAN-01:** Manager+ สามารถสร้าง Test Plan พร้อมชื่อ, คำอธิบาย, sprint, version, วันที่เป้าหมาย และสถานะเริ่มต้น
- **FR-PLAN-02:** Test Plan มีสถานะ: DRAFT → ACTIVE → COMPLETED / ARCHIVED
- **FR-PLAN-03:** Manager+ สามารถมอบหมาย Assignee (สมาชิกทีม) ให้กับ Test Plan เพื่อกำหนดความรับผิดชอบ
- **FR-PLAN-04:** รายการ Test Plan รองรับการกรองตาม Status และแสดง Progress Bar ของแต่ละ plan
- **FR-PLAN-05:** ผู้ใช้ทุก Role สามารถดูรายการ Test Plans ได้
- **FR-PLAN-06:** Manager+ สามารถผูก (link) และถอด (unlink) Test Run เข้ากับ Test Plan เพื่อจัดกลุ่ม run ที่อยู่ในแผนเดียวกัน
- **FR-PLAN-07:** หน้า Plan Detail แสดงรายการ Test Run ที่ผูกไว้ พร้อมสถานะและ progress ของแต่ละ run

---

### 5.15 Notifications

- **FR-NOTIF-01:** ระบบสร้าง Notification โดยอัตโนมัติเมื่อเกิดกิจกรรมที่เกี่ยวข้องกับผู้ใช้ (มอบหมาย defect, ขอ review, มี comment ใหม่ เป็นต้น)
- **FR-NOTIF-02:** ผู้ใช้รับ Notification แบบ Real-time ผ่าน Server-Sent Events (SSE) โดยไม่ต้อง refresh
- **FR-NOTIF-03:** Notification Bell ใน Header bar แสดงจำนวนที่ยังไม่ได้อ่าน
- **FR-NOTIF-04:** ผู้ใช้สามารถทำเครื่องหมาย Notification ว่าอ่านแล้ว ทีละรายการหรือทั้งหมด
- **FR-NOTIF-05:** ผู้ใช้สามารถลบ Notification ออกจากรายการ
- **FR-NOTIF-06:** คลิก Notification เพื่อไปยัง entity ที่เกี่ยวข้องโดยตรง

---

### 5.16 Document Attachments (RequirementDocuments)

- **FR-DOC-01:** Requirement แต่ละรายการสามารถแนบเอกสารได้หลายรายการ (Spec, Wireframe, Meeting Notes)
- **FR-DOC-02:** เอกสารจัดเก็บเป็น URL / Link (ไม่ได้จัดเก็บไฟล์โดยตรงในระบบ)
- **FR-DOC-03:** Tester+ สามารถแนบเอกสารใหม่ได้
- **FR-DOC-04:** Manager+ สามารถลบเอกสารที่แนบได้
- **FR-DOC-05:** VIEWER สามารถดูรายการเอกสารทั้งหมดได้

---

### 5.17 Activity Log

- **FR-ACT-01:** ระบบบันทึก Activity Log อัตโนมัติเมื่อเกิดเหตุการณ์สำคัญในโปรเจกต์ ได้แก่: สร้าง/อัปเดต/ลบ TestCase, สร้าง/อัปเดตสถานะ/ลบ Defect, สร้าง/อัปเดตสถานะ/ลบ TestRun
- **FR-ACT-02:** Activity log record เก็บข้อมูล: projectId, userId, action (CREATE/UPDATE/DELETE/STATUS_CHANGE), entityType, entityId, entityName และ diff (การเปลี่ยนแปลง field)
- **FR-ACT-03:** `GET /api/projects/:id/activity` คืนค่า activity 30 รายการล่าสุดสำหรับโปรเจกต์นั้น
- **FR-ACT-04:** ActivityFeed component แสดงใน sidebar ของ Project Dashboard และหน้า Test Case Detail
- **FR-ACT-05:** Activity log อ่านได้โดย Tester+ ขึ้นไป (VIEWER ไม่เห็น)

---

### 5.18 Exports

- **FR-EXP-01:** Manager+ สามารถ Export UAT Report เป็นไฟล์ PDF ผ่าน `/api/projects/:id/exports/uat-pdf`
- **FR-EXP-02:** Manager+ สามารถ Export Defect List เป็นไฟล์ Excel ผ่าน `/api/projects/:id/exports/defects-excel`
- **FR-EXP-03:** Tester+ สามารถ Export Test Run Results เป็นไฟล์ Excel ผ่าน `/api/projects/:id/exports/run-results-excel`

---

## 6. ข้อกำหนดที่ไม่ใช่ฟังก์ชัน

### 6.1 ประสิทธิภาพ
- การตอบสนองของ API สำหรับ list endpoint: < 300ms ที่ p95 ภายใต้โหลดปกติ
- การนำเข้าไฟล์สูงสุด 1,000 แถวเสร็จสมบูรณ์ภายใน 10 วินาที
- Frontend initial load (LCP): < 2.5 วินาที บนอินเทอร์เน็ตบรอดแบนด์มาตรฐาน

### 6.2 ความปลอดภัย
- รหัสผ่านทั้งหมด hash ด้วย bcrypt (ขั้นต่ำ 10 รอบ)
- JWT secret ขั้นต่ำ 32 ตัวอักษร; access token มีอายุสั้น (15 นาที)
- Refresh token จัดเก็บใน httpOnly, SameSite=Strict cookies
- ตรวจสอบ input ทั้งหมดฝั่ง server ผ่าน class-validator DTOs
- การปฏิบัติตาม OWASP Top 10: ใช้ parameterized query เท่านั้น ไม่มี raw SQL ที่รับ user input, ป้องกัน CSRF ผ่าน SameSite cookies, security header ผ่าน Helmet
- Rate limiting บน endpoint ทั้งหมด; จำกัดเข้มงวดขึ้นสำหรับ auth endpoint

### 6.3 ความสามารถใช้งาน
- แอปพลิเคชัน responsive สำหรับ desktop browser (1280px+)
- ฟอร์มทั้งหมดแสดงข้อผิดพลาดการตรวจสอบแบบ inline
- แสดงสถานะ loading สำหรับการดำเนินการ async ทั้งหมด
- Toast notification สำหรับ feedback ความสำเร็จ/ข้อผิดพลาด
- เนื้อหาภาษาไทยต้องแสดงผลได้ถูกต้อง (UTF-8 ตลอด)
- ใช้ Design System จาก APS Design (Figma) — Font: Public Sans + Inter, Primary: #015C91

### 6.4 ความสมบูรณ์ของข้อมูล
- Test case ID ไม่ซ้ำกันต่อโปรเจกต์ (composite unique key `[projectId, caseId]`)
- Defect ID ไม่ซ้ำกันต่อโปรเจกต์
- Ad-hoc ID ไม่ซ้ำกันต่อโปรเจกต์
- Requirement ID ไม่ซ้ำกันต่อโปรเจกต์ (`[projectId, reqId]`)
- การลบโปรเจกต์จะ cascade ไปยังข้อมูลที่เกี่ยวข้องทั้งหมด
- Test result ไม่ซ้ำกันต่อ `[runId, testCaseId]`

---

## 7. นอกขอบเขต (v3.1)

สิ่งที่ยังไม่ได้ implement:

- การผสานรวม CI/CD (webhook trigger)
- การจัดเวอร์ชัน / ประวัติ audit trail ระดับ field ของ test case (มีเฉพาะ Activity Log ระดับ project)
- การแนบไฟล์โดยตรง (upload binary file) ในผลลัพธ์ (ใช้ URL เท่านั้น)
- Mobile responsive layout (รองรับ desktop 1280px+ เท่านั้น)
- การเข้าสู่ระบบด้วย SSO / OAuth
- การติดตามเวลาต่อการรัน test
- การผสานรวม automated test runner (Playwright, Cypress)
- Email notifications (มีเฉพาะ in-app SSE notifications)
- Slack / Teams integration

**สิ่งที่เคย Out of Scope แต่ Implemented แล้ว:**
- ~~Export UAT report เป็น PDF~~ → **Implemented** (ExportsModule)
- ~~Email notifications~~ → **Partially: In-app real-time notifications via SSE implemented**
- ~~Test Plans~~ → **Implemented** (TestPlansModule)
- ~~Requirements Management~~ → **Implemented** (RequirementsModule with Traceability)
- ~~Activity Log~~ → **Implemented** (ActivityLogModule v3.1)
- ~~Export Defects / Run Results to Excel~~ → **Implemented** (ExportsModule v3.1)
- ~~Test Plan ↔ Test Run Linking~~ → **Implemented** (v3.1)

---

## 8. อ้างอิง: การแมประหว่างชีตและฟีเจอร์

| Google Sheets Tab | Web App Section | Route |
|-------------------|-----------------|-------|
| Master Test Cases | Test Cases | `/projects/:id/cases` |
| Defect Log | Defect Log | `/projects/:id/defects` |
| Daily QA Checklist | Daily Checklist | `/projects/:id/checklist` |
| Management Summary | Reports / Dashboard | `/projects/:id/reports` |
| UAT Test & Sign-Off | UAT Sessions | `/projects/:id/uat` |
| Ad-Hoc Special Cases | Ad-Hoc Cases | `/projects/:id/adhoc` |
| *(ใหม่ใน v3.0)* | Requirements | `/projects/:id/requirements` |
| *(ใหม่ใน v3.0)* | Test Plans | `/projects/:id/plans` |

---

## 9. ข้อมูล Seed / Demo

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin User | admin@example.com | Admin@123456! | ADMIN |
| Manager User | manager@example.com | Manager@123456! | MANAGER |
| Tester User | tester@example.com | Tester@123456! | TESTER |
| Tester User 2 | tester2@example.com | Tester@123456! | TESTER |
| Developer User | developer@example.com | Developer@123456! | DEVELOPER |

**Demo Project:** "ShopEase — E-Commerce Platform" (key: `DEMO`)

Demo project มีข้อมูลตัวอย่างสำหรับทุก module:
- 10 Test Suites
- 35 Test Cases
- 10 Requirements
- 2 Test Plans
- 4 Test Runs
- 8 Defects
- 2 UAT Sessions
- 5 Ad-Hoc Cases
- 10 Checklist Items + 3 Checklist Sessions
