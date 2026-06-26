import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { Priority, CaseStatus, ProjectMemberRole, TestType, AutomationStatus, Severity } from '@prisma/client';

// Column name mapping for smart detection
const COLUMN_MAPPINGS: Record<string, string[]> = {
  id: ['id', 'tc id', 'tc-id', 'test case id', 'case id', 'tc#', 'test id', 'test case no', 'tc no'],
  suite: ['suite', 'module', 'section', 'feature', 'category', 'component', 'suite/module'],
  subSuite: ['sub-module', 'sub module', 'submodule', 'sub suite', 'subsuite', 'sub-suite'],
  scenario: ['scenario', 'test scenario', 'user scenario', 'use case', 'user story'],
  title: ['title', 'name', 'test name', 'test case name', 'test case', 'summary', 'test case title'],
  description: ['description', 'objective', 'test objective', 'desc', 'detail'],
  preconditions: ['preconditions', 'precondition', 'pre-conditions', 'pre conditions', 'prerequisites', 'prerequisite'],
  stepAction: ['step', 'steps', 'action', 'step action', 'test step', 'test steps', 'step description', 'actions', 'test procedure', 'procedure'],
  expectedResult: ['expected result', 'expected', 'expected results', 'expected outcome', 'expected behavior', 'expected output', 'result'],
  testData: ['test data', 'data', 'input data', 'test input', 'input', 'test value', 'values'],
  testType: ['test type', 'type', 'testing type', 'test category', 'test kind'],
  priority: ['priority', 'importance', 'test priority'],
  severity: ['severity', 'sev'],
  tags: ['tags', 'labels', 'tag', 'label'],
  status: ['status', 'case status', 'state', 'execution status'],
  automationStatus: ['automation status', 'automation', 'automated', 'auto status'],
  requirementId: ['requirement id', 'req id', 'requirement', 'story id', 'jira id', 'ticket id'],
  platformPortal: ['platform/portal', 'platform', 'portal', 'platform portal'],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, ' ');
}

function detectColumn(header: string): string | null {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.includes(normalized)) {
      return field;
    }
  }
  return null;
}

function parsePriority(value: string | undefined): Priority {
  if (!value) return Priority.MEDIUM;
  const normalized = value.toUpperCase().trim();
  if (normalized === 'CRITICAL') return Priority.CRITICAL;
  if (normalized === 'HIGH') return Priority.HIGH;
  if (normalized === 'LOW') return Priority.LOW;
  if (normalized === 'MEDIUM' || normalized === 'NORMAL') return Priority.MEDIUM;
  if (normalized === 'P1' || normalized === 'S1') return Priority.CRITICAL;
  if (normalized === 'P2' || normalized === 'S2') return Priority.HIGH;
  if (normalized === 'P3' || normalized === 'S3') return Priority.MEDIUM;
  if (normalized === 'P4' || normalized === 'S4') return Priority.LOW;
  return Priority.MEDIUM;
}

function parseCaseStatus(value: string | undefined): CaseStatus {
  if (!value) return CaseStatus.ACTIVE;
  const normalized = value.toUpperCase().trim();
  if (normalized === 'DRAFT') return CaseStatus.DRAFT;
  if (normalized === 'ARCHIVED' || normalized === 'INACTIVE') return CaseStatus.ARCHIVED;
  return CaseStatus.ACTIVE;
}

function parseTestType(value: string | undefined): TestType | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase().trim().replace(/[\s\-]/g, '_');
  const map: Record<string, TestType> = {
    FUNCTIONAL: TestType.FUNCTIONAL,
    NON_FUNCTIONAL: TestType.NON_FUNCTIONAL,
    REGRESSION: TestType.REGRESSION,
    SMOKE: TestType.SMOKE,
    SANITY: TestType.SMOKE,        // map sanity → smoke
    INTEGRATION: TestType.INTEGRATION,
    PERFORMANCE: TestType.PERFORMANCE,
    SECURITY: TestType.SECURITY,
    UAT: TestType.UAT,
    EXPLORATORY: TestType.FUNCTIONAL, // fallback
  };
  return map[normalized] ?? undefined;
}

function parseAutomationStatus(value: string | undefined): AutomationStatus | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase().trim();
  if (normalized === 'AUTOMATED' || normalized === 'AUTO') return AutomationStatus.AUTOMATED;
  if (normalized === 'MANUAL') return AutomationStatus.MANUAL;
  if (normalized === 'IN_PROGRESS' || normalized === 'IN PROGRESS') return AutomationStatus.IN_PROGRESS;
  return undefined;
}

function parseSeverity(value: string | undefined): Severity | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase().trim();
  if (normalized === 'CRITICAL' || normalized === 'S1') return Severity.CRITICAL;
  if (normalized === 'HIGH' || normalized === 'S2') return Severity.HIGH;
  if (normalized === 'MEDIUM' || normalized === 'S3') return Severity.MEDIUM;
  if (normalized === 'LOW' || normalized === 'S4') return Severity.LOW;
  return undefined;
}

/** Split a multi-line steps cell (numbered or newline-separated) into individual step strings */
function splitStepsCell(raw: string): string[] {
  if (!raw.trim()) return [];
  // Split on numbered list like "1. xxx\n2. xxx" or just newlines
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  // Strip leading "1." "2." etc.
  return lines.map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
}

interface ParsedTestCase {
  externalId?: string;
  suiteName?: string;
  subSuiteName?: string;
  scenario?: string;
  title: string;
  description?: string;
  preconditions?: string;
  expectedResult?: string;
  testData?: string;
  testType?: TestType;
  severity?: Severity;
  automationStatus?: AutomationStatus;
  requirementId?: string;
  platformPortal?: string;
  priority: Priority;
  status: CaseStatus;
  tags: string[];
  steps: Array<{ action: string; expectedResult?: string }>;
}

function parseWorkbook(buffer: Buffer, isCSV: boolean): XLSX.WorkBook {
  return XLSX.read(buffer, {
    type: 'buffer',
    cellText: true,
    cellDates: true,
    raw: false,
    ...(isCSV ? { codepage: 65001 } : {}),
  });
}

function sheetToRows(workbook: XLSX.WorkBook): { headers: string[]; rows: Record<string, unknown>[] } {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rawRows.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = (rawRows[0] as unknown[]).map((h) => String(h ?? '').trim());
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i] as unknown[];
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) {
        obj[headers[j]] = row[j] ?? '';
      }
    }
    rows.push(obj);
  }

  return { headers, rows };
}

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  parseFile(buffer: Buffer, originalName: string, isCSV: boolean): { headers: string[]; rows: Record<string, unknown>[] } {
    try {
      const workbook = parseWorkbook(buffer, isCSV);
      return sheetToRows(workbook);
    } catch (err) {
      throw new BadRequestException(
        `Failed to parse ${isCSV ? 'CSV' : 'Excel'} file: ${originalName}. Error: ${String(err)}`,
      );
    }
  }

  preview(buffer: Buffer, originalName: string): { rows: Record<string, unknown>[]; headers: string[]; total: number } {
    const isCSV = originalName.toLowerCase().endsWith('.csv');
    const { headers, rows } = this.parseFile(buffer, originalName, isCSV);

    if (headers.length === 0) {
      throw new BadRequestException('File has no headers or data');
    }

    return {
      rows: rows.slice(0, 50),
      headers,
      total: rows.length,
    };
  }

  async importTestCases(
    buffer: Buffer,
    originalName: string,
    projectId: string,
    user: JwtPayload,
    defaultSuiteId?: string,
  ) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isCSV = originalName.toLowerCase().endsWith('.csv');
    const { headers, rows } = this.parseFile(buffer, originalName, isCSV);

    if (rows.length === 0) {
      throw new BadRequestException('File contains no data rows');
    }

    // Detect columns
    const columnMap: Record<string, string> = {};
    for (const header of headers) {
      const mapped = detectColumn(header);
      if (mapped) {
        columnMap[mapped] = header;
      }
    }

    if (!columnMap['title']) {
      throw new BadRequestException(
        'Could not detect a title column. Expected headers like: title, name, test name, test case name',
      );
    }

    // Group rows by TC ID (multiple rows with same TC ID = multiple steps)
    const testCaseMap = new Map<string, ParsedTestCase>();
    const orderedIds: string[] = [];

    for (const row of rows) {
      const getVal = (field: string) => {
        const header = columnMap[field];
        return header ? String(row[header] ?? '').trim() : '';
      };

      const title = getVal('title');
      if (!title) continue;

      const externalId = getVal('id') || `import_${Date.now()}_${Math.random()}`;
      const stepAction = getVal('stepAction');
      const expectedResult = getVal('expectedResult');

      if (!testCaseMap.has(externalId)) {
        testCaseMap.set(externalId, {
          externalId,
          suiteName: getVal('suite') || undefined,
          subSuiteName: getVal('subSuite') || undefined,
          scenario: getVal('scenario') || undefined,
          title,
          description: getVal('description') || undefined,
          preconditions: getVal('preconditions') || undefined,
          expectedResult: expectedResult || undefined,
          testData: getVal('testData') || undefined,
          testType: parseTestType(getVal('testType')),
          severity: parseSeverity(getVal('severity')),
          automationStatus: parseAutomationStatus(getVal('automationStatus')),
          requirementId: getVal('requirementId') || undefined,
          platformPortal: getVal('platformPortal') || undefined,
          priority: parsePriority(getVal('priority')),
          status: parseCaseStatus(getVal('status')),
          tags: getVal('tags')
            ? getVal('tags').split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
            : [],
          steps: [],
        });
        orderedIds.push(externalId);
      }

      // Handle steps: either single-row multiline cell or multi-row (one step per row)
      if (stepAction) {
        const tc = testCaseMap.get(externalId)!;
        const stepLines = splitStepsCell(stepAction);
        if (stepLines.length > 1) {
          // Multiline steps in single cell — split into individual steps, shared expectedResult
          stepLines.forEach((line) => {
            tc.steps.push({ action: line, expectedResult: expectedResult || undefined });
          });
        } else {
          tc.steps.push({ action: stepAction.trim(), expectedResult: expectedResult || undefined });
        }
      }
    }

    // Cache suite name -> id mapping
    const suiteCache = new Map<string, string>();

    const getOrCreateSuite = async (suiteName: string): Promise<string> => {
      if (suiteCache.has(suiteName)) {
        return suiteCache.get(suiteName)!;
      }

      let suite = await this.prisma.testSuite.findFirst({
        where: { projectId, name: suiteName },
        select: { id: true },
      });

      if (!suite) {
        suite = await this.prisma.testSuite.create({
          data: { projectId, name: suiteName },
          select: { id: true },
        });
      }

      suiteCache.set(suiteName, suite.id);
      return suite.id;
    };

    // Get current count for case ID generation
    let currentCount = await this.prisma.testCase.count({ where: { projectId } });
    const created = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < orderedIds.length; i++) {
      const tc = testCaseMap.get(orderedIds[i])!;
      try {
        let suiteId = defaultSuiteId ?? null;

        if (tc.suiteName) {
          suiteId = await getOrCreateSuite(tc.suiteName);
        }

        currentCount++;
        const caseId = `${project.key}-${String(currentCount).padStart(3, '0')}`;

        const testCase = await this.prisma.testCase.create({
          data: {
            projectId,
            caseId,
            title: tc.title,
            description: tc.description,
            preconditions: tc.preconditions,
            scenario: tc.scenario,
            expectedResult: tc.expectedResult,
            testData: tc.testData,
            testType: tc.testType,
            severity: tc.severity,
            automationStatus: tc.automationStatus ?? undefined,
            requirementId: tc.requirementId,
            suiteId,
            priority: tc.priority,
            status: tc.status,
            tags: tc.tags,
            createdById: user.id,
            steps: {
              create: tc.steps.map((step, stepIdx) => ({
                order: stepIdx + 1,
                action: step.action,
                expectedResult: step.expectedResult,
              })),
            },
          },
        });

        created.push(testCase);
      } catch (err) {
        errors.push({ row: i + 2, error: String(err) });
      }
    }

    return {
      imported: created.length,
      failed: errors.length,
      total: orderedIds.length,
      errors: errors.slice(0, 20),
    };
  }

  async generateTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Quality Intelligence';
    wb.created = new Date();

    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    function styleHeader(sheet: ExcelJS.Worksheet, color: string) {
      const row = sheet.getRow(1);
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        };
      });
      row.height = 30;
    }

    // ── 1. Master Test Cases ─────────────────────────────────────────────────
    const masterSheet = wb.addWorksheet('Master Test Cases');
    masterSheet.columns = [
      { header: 'TC-ID',               key: 'tcId',            width: 12 },
      { header: 'Module',              key: 'module',          width: 20 },
      { header: 'Sub-Module',          key: 'subModule',       width: 20 },
      { header: 'Platform/Portal',     key: 'platform',        width: 18 },
      { header: 'Development Source',  key: 'devSource',       width: 22 },
      { header: 'Test Scenario',       key: 'scenario',        width: 30 },
      { header: 'Test Case Title',     key: 'title',           width: 40 },
      { header: 'Preconditions',       key: 'preconditions',   width: 35 },
      { header: 'Test Steps',          key: 'steps',           width: 45 },
      { header: 'Test Data',           key: 'testData',        width: 25 },
      { header: 'Expected Result',     key: 'expectedResult',  width: 45 },
      { header: 'Priority',            key: 'priority',        width: 12 },
      { header: 'Test Type',           key: 'testType',        width: 18 },
      { header: 'Severity',            key: 'severity',        width: 14 },
      { header: 'Test Environment',    key: 'environment',     width: 20 },
      { header: 'Automation Status',   key: 'automationStatus',width: 20 },
      { header: 'Requirement ID',      key: 'requirementId',   width: 18 },
      { header: 'Assigned Developer',  key: 'assignedDev',     width: 22 },
      { header: 'Created By',          key: 'createdBy',       width: 18 },
      { header: 'Created Date',        key: 'createdDate',     width: 16 },
      { header: 'Last Updated',        key: 'lastUpdated',     width: 16 },
      { header: 'Review Status',       key: 'reviewStatus',    width: 16 },
      { header: 'Request Type',        key: 'requestType',     width: 16 },
      { header: 'Urgency Flag',        key: 'urgencyFlag',     width: 14 },
      { header: 'Source/Requestor',    key: 'sourceRequestor', width: 20 },
      { header: 'Impact Assessment',   key: 'impactAssessment',width: 22 },
      { header: 'Notes/Findings',      key: 'notes',           width: 30 },
      { header: 'Design Screenshot',   key: 'designScreenshot',width: 20 },
      { header: 'Execution Status',    key: 'executionStatus', width: 18 },
      { header: 'Actual Result',       key: 'actualResult',    width: 35 },
      { header: 'Evidence/Proof',      key: 'evidence',        width: 20 },
      { header: 'Defect ID',           key: 'defectId',        width: 14 },
      { header: 'QA Suggestion',       key: 'qaSuggestion',    width: 30 },
      { header: 'PM Decision',         key: 'pmDecision',      width: 20 },
    ];
    styleHeader(masterSheet, 'FF1A73E8');

    masterSheet.getColumn('steps').alignment = { wrapText: true, vertical: 'top' };
    masterSheet.getColumn('expectedResult').alignment = { wrapText: true, vertical: 'top' };
    masterSheet.getColumn('preconditions').alignment = { wrapText: true, vertical: 'top' };

    // ── 2. Ad-Hoc Special Cases ──────────────────────────────────────────────
    const adhocSheet = wb.addWorksheet('Ad-Hoc Special Cases');
    adhocSheet.columns = [
      { header: 'ADHOC-ID',               key: 'adhocId',         width: 14 },
      { header: 'Request Date',            key: 'requestDate',     width: 16 },
      { header: 'Requestor',              key: 'requestor',       width: 20 },
      { header: 'Request Type',           key: 'requestType',     width: 18 },
      { header: 'Urgency',                key: 'urgency',         width: 12 },
      { header: 'Source System',          key: 'sourceSystem',    width: 18 },
      { header: 'Module (if known)',       key: 'module',          width: 20 },
      { header: 'Issue Description',      key: 'issueDescription',width: 40 },
      { header: 'Impact Assessment',      key: 'impactAssessment',width: 25 },
      { header: 'Affected Environment',   key: 'affectedEnv',     width: 22 },
      { header: 'Test Approach',          key: 'testApproach',    width: 25 },
      { header: 'Test Steps Performed',   key: 'testSteps',       width: 40 },
      { header: 'Test Data Used',         key: 'testData',        width: 22 },
      { header: 'Findings / Actual Result',key: 'findings',       width: 40 },
      { header: 'Status',                 key: 'status',          width: 14 },
      { header: 'Severity',               key: 'severity',        width: 14 },
      { header: 'Assigned QA',            key: 'assignedQA',      width: 18 },
      { header: 'Assigned Developer',     key: 'assignedDev',     width: 22 },
      { header: 'Related Bug ID',         key: 'relatedBugId',    width: 16 },
      { header: 'Related TC-ID',          key: 'relatedTcId',     width: 16 },
      { header: 'Resolution',             key: 'resolution',      width: 30 },
      { header: 'Completion Date',        key: 'completionDate',  width: 18 },
      { header: 'Converted to TC?',       key: 'convertedToTC',   width: 16 },
      { header: 'Notes',                  key: 'notes',           width: 30 },
    ];
    styleHeader(adhocSheet, 'FFEA4335');

    // ── 3. UAT Test & Sign-Off ───────────────────────────────────────────────
    const uatSheet = wb.addWorksheet('UAT Test & Sign-Off');
    uatSheet.columns = [
      { header: 'UAT-ID',                   key: 'uatId',           width: 12 },
      { header: 'Business Scenario',        key: 'scenario',        width: 35 },
      { header: 'Module / Feature',         key: 'module',          width: 22 },
      { header: 'Steps to Perform',         key: 'steps',           width: 40 },
      { header: 'Expected Result',          key: 'expectedResult',  width: 35 },
      { header: 'Actual Result',            key: 'actualResult',    width: 35 },
      { header: 'Status',                   key: 'status',          width: 14 },
      { header: 'Severity (if failed)',     key: 'severity',        width: 18 },
      { header: 'Tested By',                key: 'testedBy',        width: 18 },
      { header: 'Test Date',                key: 'testDate',        width: 14 },
      { header: 'Environment',              key: 'environment',     width: 16 },
      { header: 'Evidence (screenshot)',    key: 'evidence',        width: 22 },
      { header: 'Bug ID (if raised)',       key: 'bugId',           width: 16 },
      { header: 'Comments / Suggestions',  key: 'comments',        width: 35 },
    ];
    styleHeader(uatSheet, 'FF34A853');

    // ── 4. Daily QA Checklist ────────────────────────────────────────────────
    const checklistSheet = wb.addWorksheet('Daily QA Checklist');
    checklistSheet.columns = [
      { header: '#',                    key: 'no',     width: 6 },
      { header: 'Daily QA Checklist Item', key: 'item', width: 60 },
      { header: 'Status',               key: 'status', width: 14 },
      { header: 'Notes',                key: 'notes',  width: 35 },
      { header: 'Date',                 key: 'date',   width: 14 },
    ];
    styleHeader(checklistSheet, 'FFFF9800');

    const checklistItems = [
      'Verify test environments are accessible (DEV/SIT/UAT)',
      'Check deployment status — confirm latest build is deployed',
      'Review overnight automated test results',
      'Triage new bugs reported since last check',
      'Update bug statuses in Defect Log',
      'Run smoke tests on critical workflows',
      'Verify fixes for bugs marked as Fixed by developers',
      'Update test execution status in Master Test Cases',
      'Check for new/changed requirements from PM/BA',
      'Review ad-hoc test requests and prioritize',
      'Update Management Summary dashboard',
      'Send daily QA status update to team',
      'Review test data availability and refresh if needed',
      'Check integration points with external systems',
      'Document any new risks or blockers discovered',
      'Plan next day\'s testing priorities',
    ];
    checklistItems.forEach((item, i) => {
      checklistSheet.addRow({ no: i + 1, item, status: '', notes: '', date: '' });
    });

    // ── 5. Defect Log ────────────────────────────────────────────────────────
    const defectSheet = wb.addWorksheet('Defect Log');
    defectSheet.columns = [
      { header: 'Defect ID',            key: 'defectId',          width: 14 },
      { header: 'Test Case ID',         key: 'testCaseId',        width: 14 },
      { header: 'Module',               key: 'module',            width: 20 },
      { header: 'Defect Title',         key: 'title',             width: 40 },
      { header: 'Description',          key: 'description',       width: 40 },
      { header: 'Steps to Reproduce',   key: 'stepsToReproduce',  width: 40 },
      { header: 'Expected Result',      key: 'expectedResult',    width: 35 },
      { header: 'Actual Result',        key: 'actualResult',      width: 35 },
      { header: 'Severity',             key: 'severity',          width: 14 },
      { header: 'Priority',             key: 'priority',          width: 12 },
      { header: 'Status',               key: 'status',            width: 14 },
      { header: 'Assigned To',          key: 'assignedTo',        width: 18 },
      { header: 'Related Defect',       key: 'relatedDefect',     width: 16 },
      { header: 'Bug Pattern',          key: 'bugPattern',        width: 25 },
    ];
    styleHeader(defectSheet, 'FFC62828');

    // ── 6. Management Summary ────────────────────────────────────────────────
    const summarySheet = wb.addWorksheet('Management Summary');
    summarySheet.columns = [
      { header: 'Metric',               key: 'metric',   width: 40 },
      { header: 'Value',                key: 'value',    width: 16 },
      { header: 'Formula Source',       key: 'source',   width: 25 },
      { header: 'Status',               key: 'status',   width: 16 },
    ];
    styleHeader(summarySheet, 'FF1A73E8');
    const summaryRows = [
      { metric: 'Total Test Cases', value: '', source: 'Master Test Cases', status: '' },
      { metric: 'Executed', value: '', source: 'Master Test Cases', status: '' },
      { metric: 'Passed', value: '', source: 'Master Test Cases', status: '' },
      { metric: 'Failed', value: '', source: 'Master Test Cases', status: '' },
      { metric: 'Blocked', value: '', source: 'Master Test Cases', status: '' },
      { metric: 'Not Executed', value: '', source: 'Master Test Cases', status: '' },
      { metric: 'Pass Rate (%)', value: '', source: 'Calculated', status: '' },
      { metric: 'Total Defects', value: '', source: 'Defect Log', status: '' },
      { metric: 'Critical/High Defects', value: '', source: 'Defect Log', status: '' },
      { metric: 'Open Defects', value: '', source: 'Defect Log', status: '' },
      { metric: 'UAT Pass Rate (%)', value: '', source: 'UAT Test & Sign-Off', status: '' },
    ];
    summaryRows.forEach((r) => summarySheet.addRow(r));

    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
