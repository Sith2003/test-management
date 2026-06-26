# Product Requirements Document (PRD)
## TestManager — Test Management Application

**Version:** 3.1
**Date:** 2026-06-22
**Status:** Active Development

> **v2.0 Scope Expansion:** Based on analysis of the Google Sheets template "DTOP MoVe - Test Cases"
> (`1maKuhBClm2Cz2-aWyLBKZJCZX0-p60YtFPPl176J3xY`), this version replaces that spreadsheet entirely
> with a purpose-built web application covering all 6 tabs in the sheet.

> **v3.0 Scope Expansion:** New modules added to support a complete QA lifecycle:
> Requirements Management (with Traceability Matrix and Document Attachments),
> Test Plans, Notifications (Real-time SSE), Activity Log, and Global User Management.
> DEVELOPER added as a system-level User Role.

> **v3.1 Scope Expansion:** Enhancements to existing features including:
> Full Activity Log, Test Case Bulk Operations, Suite Drag-and-Drop Reorder,
> Defect Comments Thread, Defect Retest Workflow, Test Plan ↔ Test Run Linking,
> DefectHistory and ActivityFeed Sidebar on Test Case Detail page,
> "Log Defect" Button in Test Run Executor, and Excel Export for Defects and Run Results.

---

## 1. Product Overview

TestManager is a web-based test management platform that enables QA teams to write test cases, track defects, execute test runs, manage UAT sessions, run daily QA checklists, manage requirements, plan testing, and generate executive-level reports — all in a single application. The system replaces spreadsheet-based QA workflows (Excel/Google Sheets) with a structured, collaborative, and auditable web interface.

---

## 2. Goals and Objectives

| Goal | Success Metric |
|------|----------------|
| Replace spreadsheet-based QA workflows | All 6 tabs from the reference template have web equivalents |
| Centralize test case management | Every TC is stored, filterable, and searchable with complete metadata |
| Streamline test execution | Test runs and UAT sessions can be created, executed, and completed end-to-end |
| Support defect tracking | Defects are linked to test cases with full lifecycle status management |
| Support daily QA operations | Daily checklists can be filled in and recorded per session |
| Provide executive visibility | Auto-calculated KPI dashboard across all modules |
| Support ad-hoc testing | Out-of-scope or emergency test requests are received and tracked to completion |
| Support bulk data import | Existing Google Sheets / Excel files can be imported |
| Support Requirements Traceability | Every requirement is linked to test cases and pass rates are tracked |
| Support test planning | Test plans can be created, assigned, linked to test runs, and tracked by status |
| Real-time notifications | Team members receive notifications when relevant activities occur |
| Full auditability | Activity log records all significant changes at the project level |

---

## 3. Target User Personas

| Persona | Description |
|---------|-------------|
| **QA Lead / Manager** | Creates projects, manages team members, reviews reports, approves UAT sign-offs, creates requirements and test plans |
| **Test Engineer / Tester** | Writes test cases, executes test runs, logs defects, fills in daily checklists, links test cases to requirements |
| **Developer** | Views defects and test results related to their features, receives notifications when a defect is assigned |
| **UAT Tester / Business User** | Executes UAT test cases and signs off acceptance |
| **Stakeholder / Viewer** | Read-only access to reports, UAT status, and management dashboard |

---

## 4. User Roles and Permissions

The system enforces a role hierarchy: **ADMIN > MANAGER > TESTER > DEVELOPER > VIEWER**

**System-Level (Global) Roles:**

| Role | Description |
|------|-------------|
| `ADMIN` | Highest privilege; accesses all projects; manages users globally |
| `MANAGER` | Creates and manages projects they are a member of |
| `TESTER` | Writes and executes tests in projects they are a member of |
| `DEVELOPER` | Read-only like Viewer; designed for developer workflow (view defects, test results) |
| `VIEWER` | Read-only access; cannot create or modify anything |

**Per-Role Permissions (Project Level):**

| Action | ADMIN | MANAGER | TESTER | DEVELOPER | VIEWER |
|--------|:-----:|:-------:|:------:|:---------:|:------:|
| Create / Delete project | ✓ | ✓ | — | — | — |
| Manage project members | ✓ | ✓ | — | — | — |
| Create / Edit test case | ✓ | ✓ | ✓ | — | — |
| Delete test case | ✓ | ✓ | — | — | — |
| Bulk operations on test cases | ✓ | ✓ | ✓ | — | — |
| Create / Execute test run | ✓ | ✓ | ✓ | — | — |
| Log / Update defect | ✓ | ✓ | ✓ | — | — |
| Close / Resolve defect | ✓ | ✓ | — | — | — |
| View defect | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fill daily QA checklist | ✓ | ✓ | ✓ | — | — |
| Create / Manage UAT session | ✓ | ✓ | — | — | — |
| Execute UAT test case | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sign off UAT | ✓ | ✓ | — | — | — |
| Submit ad-hoc case | ✓ | ✓ | ✓ | — | — |
| Convert ad-hoc to test case / defect | ✓ | ✓ | ✓ | — | — |
| Import test cases (CSV/Excel) | ✓ | ✓ | ✓ | — | — |
| Create / Edit requirement | ✓ | ✓ | — | — | — |
| Link test case to requirement | ✓ | ✓ | ✓ | — | — |
| Create / Edit test plan | ✓ | ✓ | — | — | — |
| Link / Unlink test run from test plan | ✓ | ✓ | — | — | — |
| View reports and management summary | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage users (global) | ✓ | — | — | — | — |

> The role hierarchy is enforced at both the project level (`ProjectMemberRole`) and system level (`UserRole`). The effective permission for a user is the higher of the two levels.

---

## 5. Core Features

### 5.1 Authentication and User Management

- **FR-AUTH-01:** Users can register with a name, email, and password (minimum 8 characters)
- **FR-AUTH-02:** Users can log in with email and password
- **FR-AUTH-03:** Sessions use a JWT access token (expires in 15 minutes) with silent refresh via an httpOnly refresh token cookie (expires in 7 days)
- **FR-AUTH-04:** Users can log out, which invalidates the refresh token
- **FR-AUTH-05:** Logged-in users can view and update their own profile from the Profile page in the Header bar
- **FR-AUTH-06:** Users can change their own password from the Profile page
- **FR-AUTH-07:** The login endpoint is rate-limited to 5 attempts per 15 minutes per IP

---

### 5.2 Project Management

- **FR-PROJ-01:** Logged-in users can create a project with a name, a unique key (e.g., `DTOP`), and an optional description
- **FR-PROJ-02:** The project key is used as a prefix for auto-generated test case IDs
- **FR-PROJ-03:** Project owners can add and remove team members, assigning a role to each
- **FR-PROJ-04:** Users can be members of multiple projects with different roles in each
- **FR-PROJ-05:** Projects can be archived (soft delete via `isActive` flag)
- **FR-PROJ-06:** The project overview page shows total test case count, open defects, active runs, and UAT sessions

---

### 5.3 Test Suite Hierarchy

The suite structure mirrors the **Module → Sub-Module → Test Scenario** hierarchy from the reference spreadsheet (3 levels).

- **FR-SUITE-01:** Test suites form a 3-level hierarchy: Module → Sub-Module → Scenario
- **FR-SUITE-02:** Users can create, rename, reorder via drag-and-drop, and delete suites at any level
- **FR-SUITE-03:** Deleting a parent suite does not delete child suites or test cases — they are unlinked instead
- **FR-SUITE-04:** The suite tree is displayed in the left panel of the Test Cases page
- **FR-SUITE-05:** Selecting a node in the tree filters test cases to that suite and all suites beneath it
- **FR-SUITE-06:** Suites can be reordered via drag-and-drop using `@dnd-kit`, with sort order persisted to the server immediately

---

### 5.4 Test Cases

The test case model maps directly to the **Master Test Cases** sheet with 34 columns.

- **FR-TC-01:** Test cases belong to a project and may optionally belong to a suite (at any level of the hierarchy)
- **FR-TC-02:** Each test case stores the following fields:

  **Identity and Classification**
  | Field | Type | Notes |
  |-------|------|-------|
  | TC-ID | String | Auto-generated: `{PROJ_KEY}-{SEQ}` |
  | Title | String | Required |
  | Module / Suite | FK → Suite | Top-level grouping |
  | Sub-Module | FK → Suite | Second-level grouping |
  | Test Scenario | FK → Suite | Third-level grouping |
  | Platform / Portal | Enum | WEB_PORTAL, MOBILE_APP, API, ADMIN_PORTAL |
  | Development Source | String | e.g. DTOP, internal team name |
  | Requirement ID | String | External requirement reference (e.g. CR-001) |

  **Test Content**
  | Field | Type | Notes |
  |-------|------|-------|
  | Description / Preconditions | Text | Setup conditions |
  | Test Steps | Ordered list | Each step: action + expected result |
  | Test Data | Text | Sample data for the run |
  | Expected Result | Text | Overall expected outcome |

  **Classification**
  | Field | Type | Values |
  |-------|------|--------|
  | Priority | Enum | CRITICAL / HIGH / MEDIUM / LOW |
  | Severity | Enum | CRITICAL / HIGH / MEDIUM / LOW |
  | Test Type | Enum | FUNCTIONAL / NON_FUNCTIONAL / INTEGRATION / REGRESSION / SMOKE / UAT / PERFORMANCE / SECURITY |
  | Test Environment | Enum | STAGING / DEV / UAT / PRODUCTION |
  | Automation Status | Enum | MANUAL / AUTOMATED / IN_PROGRESS |
  | Review Status | Enum | DRAFT / READY / IN_REVIEW / APPROVED / REJECTED |
  | Review Comment | Text | Reviewer note when status is REJECTED |
  | Status | Enum | ACTIVE / DRAFT / ARCHIVED |
  | Tags | String[] | Free-form labels |

  **Request Context** (for change requests / ad-hoc-originated cases)
  | Field | Type |
  |-------|------|
  | Request Type | String |
  | Urgency Flag | Enum: NORMAL / HIGH / CRITICAL |
  | Source / Requestor | String |
  | Impact Assessment | Text |
  | Design Screenshot URL | String |

  **Run Tracking** (reflects the latest result)
  | Field | Type | Notes |
  |-------|------|-------|
  | Last Execution Status | Enum | NOT_RUN / PASS / FAIL / BLOCKED / SKIPPED |
  | Actual Result | Text | From the most recent run |
  | Evidence / Proof | String | URL to screenshot/recording |
  | Linked Defect ID | FK → Defect | Set when a run fails |
  | Notes / Findings | Text | QA observations |
  | QA Suggestion | Text | QA recommendation |
  | PM Decision | Text | PM response |
  | Assigned Developer | String | Responsible developer |
  | Created By | FK → User | |
  | Created Date | DateTime | |
  | Last Updated | DateTime | |

- **FR-TC-03:** Each test step has: sequence, action, expected result
- **FR-TC-04:** Steps can be added, deleted, and reordered within the form
- **FR-TC-05:** TC-ID is auto-generated per project using the key prefix and a sequence counter
- **FR-TC-06:** Test cases can be filtered by: suite, status, priority, severity, test type, environment, automation status, review status, requirement ID, and free-text search
- **FR-TC-07:** Test cases support pagination (default 20 per page, max 100)
- **FR-TC-08:** Test cases can be created one at a time via form, or bulk-imported via file upload
- **FR-TC-09:** The test case detail page shows all fields, steps, linked defects, and run history
- **FR-TC-10:** Test cases support Bulk Operations: move to suite, change status, delete multiple at once — selected via checkboxes with a toolbar
- **FR-TC-11:** Test cases support a Comments thread — team members can leave comments, discuss, or record observations
- **FR-TC-12:** The Test Case Detail page shows a Defect History Section and an Activity Feed Sidebar on the right
- **FR-TC-13:** Review Status supports the REJECTED state with a `reviewComment` field capturing the reviewer's reason

---

### 5.5 Bulk Import (Excel / CSV)

Supports importing from files structured like the reference Google Sheets template.

- **FR-IMP-01:** Users can upload `.xlsx`, `.xls`, or `.csv` files
- **FR-IMP-02:** The system auto-detects column mapping from common header aliases (case-insensitive)
- **FR-IMP-03:** Multiple rows with the same TC-ID are grouped into a single test case with multiple steps
- **FR-IMP-04:** An import preview shows the first 50 rows before confirmation
- **FR-IMP-05:** A downloadable `.xlsx` template is available without login (`@Public` endpoint)
- **FR-IMP-06:** Module / Sub-Module / Scenario values referenced in the file are auto-created as suites
- **FR-IMP-07:** Import returns a summary: total rows, imported, failed, and error details

---

### 5.6 Test Runs

- **FR-RUN-01:** A test run is created by selecting test cases from a project (filterable by module, priority, environment)
- **FR-RUN-02:** Each run has: name, description, sprint, version, and status (PENDING / IN_PROGRESS / COMPLETED / ABORTED)
- **FR-RUN-03:** For each selected test case, a result record is created with PENDING status
- **FR-RUN-04:** Testers execute each result by setting status (PASS / FAIL / BLOCKED / SKIPPED), adding notes, and uploading an evidence URL
- **FR-RUN-05:** Run status updates automatically: IN_PROGRESS when any result is set, COMPLETED when all results are resolved
- **FR-RUN-06:** When a result is set to FAIL or BLOCKED, a "Log Defect" button appears, letting the Tester create a new defect linked directly to that result
- **FR-RUN-07:** Completed runs show a pass/fail/blocked/skipped/pending summary
- **FR-RUN-08:** Test runs are listed in reverse chronological order
- **FR-RUN-09:** The latest run result is written back to the test case's `lastExecutionStatus` field
- **FR-RUN-10:** Run results can be exported to an Excel file

---

### 5.7 Defect Log

Maps to the **Defect Log** sheet tab. Defects are linked to test cases and have their own lifecycle.

- **FR-DEF-01:** Defects can be created from a failed test result, or manually from the Defect Log page
- **FR-DEF-02:** Each defect has:
  | Field | Type |
  |-------|------|
  | Defect ID | Auto-generated: `DEF-{SEQ}` |
  | Test Case ID | FK → TestCase (optional) |
  | Module | String (inherited from test case or entered manually) |
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

- **FR-DEF-03:** Defect status follows this workflow:
  ```
  OPEN → IN_PROGRESS → FIXED → RETEST → VERIFIED → CLOSED
    ↕                    ↑
    REOPENED ←───────────┘
    WONTFIX (at any point by Manager+)
  ```
- **FR-DEF-04:** The defect list supports filtering by status, severity, priority, module, and assignee
- **FR-DEF-05:** From the defect detail page, users can navigate to the linked test case
- **FR-DEF-06:** The test case detail page shows the count and links to all associated defects
- **FR-DEF-07:** Defects support a Comments thread to track discussion and progress
- **FR-DEF-08:** All defects can be exported to an Excel file
- **FR-DEF-09:** The defect detail page shows a Retest Timeline recording retest count, fixed at, verified at, and verified by
- **FR-DEF-10:** Status transition buttons on the Defect Detail page are role-aware (shown only to users with permission)
- **FR-DEF-11:** When a defect is VERIFIED, the system suggests re-running the associated test run for final confirmation

---

### 5.8 Daily QA Checklist

Maps to the **Daily QA Checklist** sheet tab. Ensures the QA environment is verified before testing begins each day.

- **FR-CHK-01:** Projects have a configurable set of checklist items (e.g., "Verify that the test environment is accessible")
- **FR-CHK-02:** Checklist items can be created, edited, reordered, and deleted by Manager+
- **FR-CHK-03:** Each day, Tester+ can open the Daily Checklist and mark each item as: DONE / SKIPPED / BLOCKED
- **FR-CHK-04:** Each checklist entry has a notes field and records the date and user who filled it in
- **FR-CHK-05:** A checklist session (one day's record) is linked to a project and date — only one session per project per day
- **FR-CHK-06:** Checklist history shows previous sessions (date, who completed it, pass/fail summary)

---

### 5.9 UAT Test & Sign-Off

Maps to the **UAT Test & Sign-Off** sheet tab. Manages formal user acceptance testing sessions with stakeholder sign-off.

- **FR-UAT-01:** UAT sessions are created by Manager+ with: project name, version, environment URL, UAT window (start/end dates), and support contact
- **FR-UAT-02:** Test cases are selected and added to a UAT session (by module or individually)
- **FR-UAT-03:** UAT testers (VIEWER role or above) can execute each UAT test case by recording: PASS / FAIL / BLOCKED and adding comments
- **FR-UAT-04:** Each UAT result has: tester name, run date, actual result, and evidence URL
- **FR-UAT-05:** UAT session progress is tracked with a pass rate and completion percentage
- **FR-UAT-06:** Manager+ can formally sign off a UAT session, marking it as SIGNED_OFF or REJECTED with a sign-off note
- **FR-UAT-07:** UAT report shows: summary statistics, per-module breakdown, sign-off status, and list of testers who signed off
- **FR-UAT-08:** A signed UAT report can be exported to PDF via the Exports endpoint

---

### 5.10 Ad-Hoc Special Cases

Maps to the **Ad-Hoc Special Cases** sheet tab. Accepts out-of-scope or emergency test requests that do not fit the standard test case workflow.

- **FR-ADHOC-01:** Any Tester+ can submit an ad-hoc case with: Request Date, Requestor, Request Type, Urgency (NORMAL / HIGH / CRITICAL), Source System, Module (if known), Issue Description, Impact Assessment, and Affected Environment
- **FR-ADHOC-02:** Ad-hoc ID is auto-generated: `ADHOC-{SEQ}`
- **FR-ADHOC-03:** After investigation, the tester records: Test Approach, Test Steps Performed, Test Data Used, Findings / Actual Result
- **FR-ADHOC-04:** Status follows: OPEN → IN_PROGRESS → RESOLVED / ESCALATED
- **FR-ADHOC-05:** Resolution fields: Severity, Assigned QA, Assigned Developer, Related Bug ID, Related TC-ID, Resolution notes, Completion Date
- **FR-ADHOC-06:** Tester+ can convert a resolved ad-hoc case into a formal test case — creates a new TestCase record pre-populated from ad-hoc data
- **FR-ADHOC-07:** Tester+ can convert an ad-hoc case into a formal Defect — creates a new Defect record
- **FR-ADHOC-08:** The ad-hoc list supports filtering by urgency, status, module, and requestor

---

### 5.11 Management Summary Dashboard

Maps to the **Management Summary** sheet tab. Provides auto-calculated QA KPIs across all modules.

- **FR-MGT-01:** Project-level summary cards display:
  - Total test cases (by status: Active / Draft / Archived)
  - Total test cases by module
  - Total defects (by status: Open / In Progress / Fixed / Closed)
  - Pass rate of test runs (across the N most recent runs)
  - Automation coverage (Automated / Manual / In Progress)
  - UAT session status

- **FR-MGT-02:** Per-module detail table shows counts per module: total TCs, by priority, by review status, and pass rate of the most recent run

- **FR-MGT-03:** Global dashboard aggregates statistics across all the user's projects; a second row shows: Open Defects, UAT Pending Sign-Off, Never-Run Cases, My Assigned Defects

- **FR-MGT-04:** The Project Dashboard shows an ActivityFeed Sidebar displaying the 30 most recent project activities

---

### 5.12 Reports

- **FR-REP-01:** The per-project reports page shows metrics across 6 charts:
  1. **Defect Trend Chart** — Line chart of daily defect trend over the past 30 days
  2. **Pass Rate Trend Chart** — Bar chart of pass rate for the 10 most recent test runs
  3. **Automation Coverage Chart** — Pie chart showing Manual / Automated / In Progress breakdown
  4. **Requirement Coverage Chart** — Chart showing percentage of requirements covered
  5. **Release Readiness Card** — Summary of release readiness (pass rate, open critical defects, requirement coverage)
  6. **Sprint Summary Report** — Per-sprint summary: test cases run, pass rate, defects found/closed
- **FR-REP-02:** Reports can be filtered by date range, module, and environment
- **FR-REP-03:** The global dashboard shows totals across all accessible projects
- **FR-REP-04:** Users can print the Reports page as a PDF via the browser's print function

---

### 5.13 Requirements Management

- **FR-REQ-01:** Manager+ can create a Requirement with a name, description, priority, and external ID (e.g., JIRA ticket). Each requirement is auto-assigned an ID (`REQ-{SEQ}`)
- **FR-REQ-02:** Tester+ can link Test Cases to a Requirement to build traceability
- **FR-REQ-03:** The system displays Coverage Statistics: total requirements, how many have linked test cases, and percentage passing
- **FR-REQ-04:** A Traceability Matrix shows Requirement × Test Case with the latest test result status (displayed in a separate tab on the Requirements page)
- **FR-REQ-05:** Tester+ can attach documents (URL or link) to individual requirements
- **FR-REQ-06:** Manager+ can delete documents attached to a requirement
- **FR-REQ-07:** The requirements list supports search by name and filtering by priority

---

### 5.14 Test Plans

- **FR-PLAN-01:** Manager+ can create a Test Plan with a name, description, sprint, version, target date, and initial status
- **FR-PLAN-02:** Test plan status: DRAFT → ACTIVE → COMPLETED / ARCHIVED
- **FR-PLAN-03:** Manager+ can assign Assignees (team members) to a Test Plan to define ownership
- **FR-PLAN-04:** The test plan list supports filtering by status and shows a Progress Bar for each plan
- **FR-PLAN-05:** All roles can view the test plan list
- **FR-PLAN-06:** Manager+ can link and unlink Test Runs to/from a Test Plan to group related runs under one plan
- **FR-PLAN-07:** The Plan Detail page shows all linked Test Runs with their status and per-run progress

---

### 5.15 Notifications

- **FR-NOTIF-01:** The system automatically creates Notifications when activities relevant to a user occur (defect assigned, review requested, new comment, etc.)
- **FR-NOTIF-02:** Users receive Notifications in real-time via Server-Sent Events (SSE) without requiring a page refresh
- **FR-NOTIF-03:** The Notification Bell in the Header bar shows the unread count
- **FR-NOTIF-04:** Users can mark notifications as read individually or all at once
- **FR-NOTIF-05:** Users can delete notifications from the list
- **FR-NOTIF-06:** Clicking a notification navigates directly to the related entity

---

### 5.16 Document Attachments (RequirementDocuments)

- **FR-DOC-01:** Each requirement can have multiple documents attached (Spec, Wireframe, Meeting Notes)
- **FR-DOC-02:** Documents are stored as URLs / links (no binary file storage in the system)
- **FR-DOC-03:** Tester+ can attach new documents
- **FR-DOC-04:** Manager+ can delete attached documents
- **FR-DOC-05:** VIEWER can view all attached documents

---

### 5.17 Activity Log

- **FR-ACT-01:** The system automatically records an Activity Log entry when significant events occur in a project: create/update/delete TestCase, create/update status/delete Defect, create/update status/delete TestRun
- **FR-ACT-02:** Each activity log record stores: projectId, userId, action (CREATE/UPDATE/DELETE/STATUS_CHANGE), entityType, entityId, entityName, and diff (field-level changes)
- **FR-ACT-03:** `GET /api/projects/:id/activity` returns the 30 most recent activity entries for that project
- **FR-ACT-04:** The ActivityFeed component is displayed in the sidebar of the Project Dashboard and the Test Case Detail page
- **FR-ACT-05:** Activity log is readable by Tester+ (VIEWER cannot see activity log)

---

### 5.18 Exports

- **FR-EXP-01:** Manager+ can export a UAT Report as a PDF file via `/api/projects/:id/exports/uat-pdf`
- **FR-EXP-02:** Manager+ can export the Defect List as an Excel file via `/api/projects/:id/exports/defects-excel`
- **FR-EXP-03:** Tester+ can export Test Run Results as an Excel file via `/api/projects/:id/exports/run-results-excel`

---

## 6. Non-Functional Requirements

### 6.1 Performance
- API response for list endpoints: < 300ms at p95 under normal load
- File imports of up to 1,000 rows complete within 10 seconds
- Frontend initial load (LCP): < 2.5 seconds on standard broadband

### 6.2 Security
- All passwords hashed with bcrypt (minimum 10 rounds)
- JWT secret minimum 32 characters; access tokens are short-lived (15 minutes)
- Refresh tokens stored in httpOnly, SameSite=Strict cookies
- All input validated server-side via class-validator DTOs
- OWASP Top 10 compliance: parameterized queries only, no raw SQL accepting user input, CSRF protection via SameSite cookies, security headers via Helmet
- Rate limiting on all endpoints; stricter limits on auth endpoints

### 6.3 Usability
- Application is responsive for desktop browsers (1280px+)
- All forms display inline validation errors
- Loading state shown for all async operations
- Toast notifications for success/error feedback
- Thai language content must render correctly (UTF-8 throughout)
- Uses APS Design System (Figma) — Font: Public Sans + Inter, Primary color: #015C91

### 6.4 Data Integrity
- Test case IDs are unique per project (composite unique key `[projectId, caseId]`)
- Defect IDs are unique per project
- Ad-hoc IDs are unique per project
- Requirement IDs are unique per project (`[projectId, reqId]`)
- Deleting a project cascades to all associated data
- Test results are unique per `[runId, testCaseId]`

---

## 7. Out of Scope (v3.1)

Items not yet implemented:

- CI/CD integration (webhook triggers)
- Field-level version history / full audit trail of test cases (only project-level Activity Log exists)
- Direct binary file uploads in results (URL-only)
- Mobile responsive layout (desktop 1280px+ only)
- SSO / OAuth login
- Time tracking per test run
- Automated test runner integration (Playwright, Cypress)
- Email notifications (in-app SSE notifications only)
- Slack / Teams integration

**Previously out of scope, now implemented:**
- ~~Export UAT report to PDF~~ → **Implemented** (ExportsModule)
- ~~Email notifications~~ → **Partially: In-app real-time notifications via SSE implemented**
- ~~Test Plans~~ → **Implemented** (TestPlansModule)
- ~~Requirements Management~~ → **Implemented** (RequirementsModule with Traceability)
- ~~Activity Log~~ → **Implemented** (ActivityLogModule v3.1)
- ~~Export Defects / Run Results to Excel~~ → **Implemented** (ExportsModule v3.1)
- ~~Test Plan ↔ Test Run Linking~~ → **Implemented** (v3.1)

---

## 8. Reference: Sheet-to-Feature Mapping

| Google Sheets Tab | Web App Section | Route |
|-------------------|-----------------|-------|
| Master Test Cases | Test Cases | `/projects/:id/cases` |
| Defect Log | Defect Log | `/projects/:id/defects` |
| Daily QA Checklist | Daily Checklist | `/projects/:id/checklist` |
| Management Summary | Reports / Dashboard | `/projects/:id/reports` |
| UAT Test & Sign-Off | UAT Sessions | `/projects/:id/uat` |
| Ad-Hoc Special Cases | Ad-Hoc Cases | `/projects/:id/adhoc` |
| *(new in v3.0)* | Requirements | `/projects/:id/requirements` |
| *(new in v3.0)* | Test Plans | `/projects/:id/plans` |

---

## 9. Seed / Demo Data

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin User | admin@example.com | Admin@123456! | ADMIN |
| Manager User | manager@example.com | Manager@123456! | MANAGER |
| Tester User | tester@example.com | Tester@123456! | TESTER |
| Tester User 2 | tester2@example.com | Tester@123456! | TESTER |
| Developer User | developer@example.com | Developer@123456! | DEVELOPER |

**Demo Project:** "ShopEase — E-Commerce Platform" (key: `DEMO`)

The demo project contains sample data for every module:
- 10 Test Suites
- 35 Test Cases
- 10 Requirements
- 2 Test Plans
- 4 Test Runs
- 8 Defects
- 2 UAT Sessions
- 5 Ad-Hoc Cases
- 10 Checklist Items + 3 Checklist Sessions
