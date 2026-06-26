-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('FUNCTIONAL', 'NON_FUNCTIONAL', 'INTEGRATION', 'REGRESSION', 'SMOKE', 'UAT', 'PERFORMANCE', 'SECURITY');

-- CreateEnum
CREATE TYPE "TestEnvironment" AS ENUM ('STAGING', 'DEV', 'UAT', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('MANUAL', 'AUTOMATED', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'READY', 'IN_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "PlatformPortal" AS ENUM ('WEB_PORTAL', 'MOBILE_APP', 'API', 'ADMIN_PORTAL');

-- CreateEnum
CREATE TYPE "UrgencyFlag" AS ENUM ('NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED', 'WONTFIX');

-- CreateEnum
CREATE TYPE "AdhocStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "UatSessionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'SIGNED_OFF', 'REJECTED');

-- CreateEnum
CREATE TYPE "UatResultStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ChecklistEntryStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED', 'BLOCKED');

-- AlterTable
ALTER TABLE "test_cases" ADD COLUMN     "assigned_developer" TEXT,
ADD COLUMN     "automation_status" "AutomationStatus" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "design_screenshot_url" TEXT,
ADD COLUMN     "development_source" TEXT,
ADD COLUMN     "expected_result" TEXT,
ADD COLUMN     "impact_assessment" TEXT,
ADD COLUMN     "last_actual_result" TEXT,
ADD COLUMN     "last_evidence_url" TEXT,
ADD COLUMN     "last_execution_status" "ResultStatus",
ADD COLUMN     "notes_findings" TEXT,
ADD COLUMN     "platform_portal" "PlatformPortal",
ADD COLUMN     "pm_decision" TEXT,
ADD COLUMN     "qa_suggestion" TEXT,
ADD COLUMN     "request_type" TEXT,
ADD COLUMN     "requirement_id" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "severity" "Severity",
ADD COLUMN     "source_requestor" TEXT,
ADD COLUMN     "test_data" TEXT,
ADD COLUMN     "test_environment" "TestEnvironment",
ADD COLUMN     "test_type" "TestType",
ADD COLUMN     "urgency_flag" "UrgencyFlag" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "test_results" ADD COLUMN     "evidence_url" TEXT;

-- CreateTable
CREATE TABLE "defects" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "defect_id" TEXT NOT NULL,
    "test_case_id" TEXT,
    "module" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps_to_reproduce" TEXT,
    "expected_result" TEXT,
    "actual_result" TEXT,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to_id" TEXT,
    "related_defect_id" TEXT,
    "bug_pattern" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_sessions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_entries" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "status" "ChecklistEntryStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completed_by_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uat_sessions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "environment_url" TEXT,
    "uat_start_date" DATE,
    "uat_end_date" DATE,
    "support_contact" TEXT,
    "status" "UatSessionStatus" NOT NULL DEFAULT 'PLANNED',
    "sign_off_by_id" TEXT,
    "sign_off_note" TEXT,
    "signed_off_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uat_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "test_case_id" TEXT NOT NULL,
    "tester_id" TEXT,
    "status" "UatResultStatus" NOT NULL DEFAULT 'PENDING',
    "actual_result" TEXT,
    "evidence_url" TEXT,
    "comments" TEXT,
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uat_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adhoc_cases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "adhoc_id" TEXT NOT NULL,
    "request_date" DATE NOT NULL,
    "requestor" TEXT NOT NULL,
    "request_type" TEXT,
    "urgency" "UrgencyFlag" NOT NULL DEFAULT 'NORMAL',
    "source_system" TEXT,
    "module" TEXT,
    "issue_description" TEXT NOT NULL,
    "impact_assessment" TEXT,
    "affected_environment" TEXT,
    "test_approach" TEXT,
    "test_steps_performed" TEXT,
    "test_data_used" TEXT,
    "findings" TEXT,
    "status" "AdhocStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "Severity",
    "assigned_qa_id" TEXT,
    "assigned_developer" TEXT,
    "related_bug_id" TEXT,
    "related_tc_id" TEXT,
    "related_test_case_id" TEXT,
    "resolution" TEXT,
    "completion_date" DATE,
    "converted_to_tc" BOOLEAN NOT NULL DEFAULT false,
    "converted_tc_id" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adhoc_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "defects_project_id_defect_id_key" ON "defects"("project_id", "defect_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_sessions_project_id_date_key" ON "checklist_sessions"("project_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_entries_session_id_item_id_key" ON "checklist_entries"("session_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "uat_sessions_project_id_session_id_key" ON "uat_sessions"("project_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uat_results_session_id_test_case_id_key" ON "uat_results"("session_id", "test_case_id");

-- CreateIndex
CREATE UNIQUE INDEX "adhoc_cases_project_id_adhoc_id_key" ON "adhoc_cases"("project_id", "adhoc_id");

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_related_defect_id_fkey" FOREIGN KEY ("related_defect_id") REFERENCES "defects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_sessions" ADD CONSTRAINT "checklist_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_sessions" ADD CONSTRAINT "checklist_sessions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "checklist_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_sessions" ADD CONSTRAINT "uat_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_sessions" ADD CONSTRAINT "uat_sessions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_sessions" ADD CONSTRAINT "uat_sessions_sign_off_by_id_fkey" FOREIGN KEY ("sign_off_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_results" ADD CONSTRAINT "uat_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "uat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_results" ADD CONSTRAINT "uat_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_results" ADD CONSTRAINT "uat_results_tester_id_fkey" FOREIGN KEY ("tester_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhoc_cases" ADD CONSTRAINT "adhoc_cases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhoc_cases" ADD CONSTRAINT "adhoc_cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhoc_cases" ADD CONSTRAINT "adhoc_cases_assigned_qa_id_fkey" FOREIGN KEY ("assigned_qa_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhoc_cases" ADD CONSTRAINT "adhoc_cases_related_test_case_id_fkey" FOREIGN KEY ("related_test_case_id") REFERENCES "test_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhoc_cases" ADD CONSTRAINT "adhoc_cases_converted_tc_id_fkey" FOREIGN KEY ("converted_tc_id") REFERENCES "test_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
