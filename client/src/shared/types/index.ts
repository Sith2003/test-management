// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  QA = 'QA',
  VIEWER = 'VIEWER',
  DEVELOPER = 'DEVELOPER',
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CaseStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}

export enum RunStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED',
}

export enum ResultStatus {
  PENDING = 'PENDING',
  PASS = 'PASS',
  FAIL = 'FAIL',
  BLOCKED = 'BLOCKED',
  SKIPPED = 'SKIPPED',
}

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TestType {
  FUNCTIONAL = 'FUNCTIONAL',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL',
  INTEGRATION = 'INTEGRATION',
  REGRESSION = 'REGRESSION',
  SMOKE = 'SMOKE',
  UAT = 'UAT',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
}

export enum TestEnvironment {
  STAGING = 'STAGING',
  DEV = 'DEV',
  UAT = 'UAT',
  PRODUCTION = 'PRODUCTION',
}

export enum AutomationStatus {
  MANUAL = 'MANUAL',
  AUTOMATED = 'AUTOMATED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ProjectMemberRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  QA = 'QA',
  VIEWER = 'VIEWER',
}

export enum PlatformPortal {
  WEB_PORTAL = 'WEB_PORTAL',
  MOBILE_APP = 'MOBILE_APP',
  API = 'API',
  ADMIN_PORTAL = 'ADMIN_PORTAL',
}

export enum UrgencyFlag {
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DefectStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  FIXED = 'FIXED',
  RETEST = 'RETEST',
  VERIFIED = 'VERIFIED',
  REOPENED = 'REOPENED',
  CLOSED = 'CLOSED',
  WONTFIX = 'WONTFIX',
}

export enum AdhocStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum PlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum UatSessionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SIGNED_OFF = 'SIGNED_OFF',
  REJECTED = 'REJECTED',
}

export enum UatResultStatus {
  PENDING = 'PENDING',
  PASS = 'PASS',
  FAIL = 'FAIL',
  BLOCKED = 'BLOCKED',
}

export enum ChecklistEntryStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  SKIPPED = 'SKIPPED',
  BLOCKED = 'BLOCKED',
}

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project
export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  logoUrl?: string | null;
  ownerId: string;
  owner?: User;
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    testCases: number;
    testRuns: number;
    testSuites: number;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  project?: Project;
  createdAt: string;
}

export interface TestPlanAssignee {
  id: string;
  planId: string;
  userId: string;
  user: { id: string; name: string; email: string };
}

export interface TestPlanRun {
  id: string;
  name: string;
  status: RunStatus;
  sprint?: string | null;
  version?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  _count: { results: number };
  stats: { total: number; pass: number; fail: number; passRate: number };
}

export interface TestPlan {
  id: string;
  projectId: string;
  name: string;
  sprint?: string | null;
  version?: string | null;
  description?: string | null;
  targetDate?: string | null;
  status: PlanStatus;
  createdById: string;
  createdBy: { id: string; name: string };
  assignees: TestPlanAssignee[];
  _count: { testRuns: number };
  progress?: {
    totalRuns: number;
    completedRuns: number;
    totalResults: number;
    passedResults: number;
    passRate: number;
  };
  testRuns?: TestPlanRun[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestPlanInput {
  name: string;
  description?: string;
  sprint?: string;
  version?: string;
  targetDate?: string;
  assigneeIds?: string[];
}

export interface UpdateTestPlanInput {
  name?: string;
  description?: string;
  sprint?: string;
  version?: string;
  targetDate?: string | null;
  status?: PlanStatus;
  assigneeIds?: string[];
}

// Test Suite
export interface TestSuite {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  parentId: string | null;
  parent?: TestSuite;
  children?: TestSuite[];
  testCases?: TestCase[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    testCases: number;
    children: number;
  };
}

// Test Step
export interface TestStep {
  id: string;
  testCaseId: string;
  order: number;
  action: string;
  expectedResult: string;
  createdAt: string;
  updatedAt: string;
}

// Test Case (expanded)
export interface TestCase {
  id: string;
  caseId: string;
  title: string;
  description: string | null;
  preconditions: string | null;
  scenario: string | null;
  testData: string | null;
  expectedResult: string | null;
  priority: Priority;
  severity: Severity | null;
  status: CaseStatus;
  testType: TestType | null;
  testEnvironment: TestEnvironment | null;
  automationStatus: AutomationStatus;
  reviewStatus: ReviewStatus;
  reviewComment: string | null;
  platformPortal: PlatformPortal | null;
  developmentSource: string | null;
  requirementId: string | null;
  assignedDeveloper: string | null;
  requestType: string | null;
  urgencyFlag: UrgencyFlag;
  sourceRequestor: string | null;
  impactAssessment: string | null;
  designScreenshotUrl: string | null;
  lastExecutionStatus: ResultStatus | null;
  lastActualResult: string | null;
  lastEvidenceUrl: string | null;
  notesFindings: string | null;
  qaSuggestion: string | null;
  pmDecision: string | null;
  projectId: string;
  suiteId: string | null;
  suite?: TestSuite;
  steps?: TestStep[];
  _count?: { steps: number };
  tags: string[];
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

// Test Run
export interface TestRun {
  id: string;
  name: string;
  description: string | null;
  status: RunStatus;
  sprint: string | null;
  version: string | null;
  projectId: string;
  project?: Project;
  results?: TestResult[];
  createdById: string;
  createdBy?: User;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { results: number };
  plan?: { id: string; name: string; sprint?: string | null; version?: string | null } | null;
}

// Test Result
export interface TestResult {
  id: string;
  runId: string;
  run?: TestRun;
  testCaseId: string;
  testCase?: TestCase;
  status: ResultStatus;
  notes: string | null;
  evidenceUrl: string | null;
  executedById: string | null;
  executedBy?: User;
  executedAt: string | null;
  assigneeId: string | null;
  assignee?: Pick<User, 'id' | 'name' | 'email'> | null;
  createdAt: string;
  updatedAt: string;
}

// Defect
export interface Defect {
  id: string;
  defectId: string;
  projectId: string;
  testCaseId: string | null;
  testCase?: Pick<TestCase, 'id' | 'caseId' | 'title'> | null;
  module: string | null;
  title: string;
  description: string | null;
  stepsToReproduce: string | null;
  expectedResult: string | null;
  actualResult: string | null;
  severity: Severity;
  priority: Priority;
  status: DefectStatus;
  assignedToId: string | null;
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null;
  relatedDefectId: string | null;
  bugPattern: string | null;
  retestCount: number;
  fixedAt: string | null;
  verifiedAt: string | null;
  verifiedById: string | null;
  verifiedBy?: Pick<User, 'id' | 'name'> | null;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

// Checklist
export interface ChecklistItem {
  id: string;
  projectId: string;
  title: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistEntry {
  id: string;
  sessionId: string;
  itemId: string;
  item: ChecklistItem;
  status: ChecklistEntryStatus;
  notes: string | null;
  completedById: string | null;
  completedBy?: Pick<User, 'id' | 'name'> | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSession {
  id: string;
  projectId: string;
  date: string;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  entries?: ChecklistEntry[];
  createdAt: string;
  updatedAt: string;
  _count?: { entries: number };
}

// UAT
export interface UatResult {
  id: string;
  sessionId: string;
  testCaseId: string;
  testCase?: TestCase;
  testerId: string | null;
  tester?: Pick<User, 'id' | 'name'> | null;
  status: UatResultStatus;
  actualResult: string | null;
  evidenceUrl: string | null;
  comments: string | null;
  executedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UatSession {
  id: string;
  projectId: string;
  sessionId: string;
  name: string;
  version: string | null;
  environmentUrl: string | null;
  uatStartDate: string | null;
  uatEndDate: string | null;
  supportContact: string | null;
  status: UatSessionStatus;
  signOffById: string | null;
  signOffBy?: Pick<User, 'id' | 'name'> | null;
  signOffNote: string | null;
  signedOffAt: string | null;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  results?: UatResult[];
  createdAt: string;
  updatedAt: string;
  _count?: { results: number };
}

// Ad-Hoc
export interface AdhocCase {
  id: string;
  projectId: string;
  adhocId: string;
  requestDate: string;
  requestor: string;
  requestType: string | null;
  urgency: UrgencyFlag;
  sourceSystem: string | null;
  module: string | null;
  issueDescription: string;
  impactAssessment: string | null;
  affectedEnvironment: string | null;
  testApproach: string | null;
  testStepsPerformed: string | null;
  testDataUsed: string | null;
  findings: string | null;
  status: AdhocStatus;
  severity: Severity | null;
  assignedQaId: string | null;
  assignedQa?: Pick<User, 'id' | 'name'> | null;
  assignedDeveloper: string | null;
  relatedBugId: string | null;
  relatedTcId: string | null;
  resolution: string | null;
  completionDate: string | null;
  convertedToTc: boolean;
  convertedTcId: string | null;
  notes: string | null;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

// Requirement
export interface RequirementDocument {
  id: string;
  requirementId: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Requirement {
  id: string;
  projectId: string;
  reqId: string;
  title: string;
  description: string | null;
  externalId: string | null;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  _count?: { testCases: number };
  testCases?: Array<{ id: string; caseId: string; title: string; lastExecutionStatus: string | null }>;
  documents?: RequirementDocument[];
}

export interface RequirementCoverage {
  total: number;
  covered: number;
  coveredPercent: number;
  passedPercent: number;
}

export interface CreateRequirementInput {
  title: string;
  description?: string;
  externalId?: string;
  priority?: Priority;
}

export interface DefectComment {
  id: string;
  defectId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
}

// API Response types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiMeta {
  timestamp: string;
  path?: string;
  method?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface CollectionResponse<T> {
  data: T[];
  pagination: Pagination;
  meta: ApiMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
}

// Auth types
export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Upload types
export interface UploadPreviewRow {
  title: string;
  description?: string;
  preconditions?: string;
  priority?: Priority;
  status?: CaseStatus;
  suiteId?: string;
  tags?: string[];
  steps?: Array<{ action: string; expectedResult: string }>;
  [key: string]: unknown;
}

export interface UploadPreviewResponse {
  rows: UploadPreviewRow[];
  total: number;
  headers: string[];
}

// Report types
export interface ReportSummary {
  totalCases: number;
  totalRuns: number;
  passRate: number;
  activeCases: number;
  draftCases: number;
  archivedCases: number;
  completedRuns: number;
  inProgressRuns: number;
  openDefects: number;
}

export interface ProjectStats {
  totalCases: number;
  totalSuites: number;
  totalRuns: number;
  casesByStatus: Record<string, number>;
  runsByStatus: Record<string, number>;
  resultsByStatus: { pass: number; fail: number; blocked: number; skipped: number; pending: number };
  passRate: number;
  openDefects: number;
  pendingReview: number;
}

export interface RunHistoryEntry {
  runId: string;
  runName: string;
  date: string;
  pass: number;
  fail: number;
  blocked: number;
  skipped: number;
  pending: number;
  total: number;
  passRate: number;
}

export interface SuiteBreakdownEntry {
  suiteId: string;
  suiteName: string;
  totalCases: number;
  pass: number;
  fail: number;
  blocked: number;
  pending: number;
  untested: number;
}

// Form input types
export interface CreateProjectInput { name: string; key: string; description?: string; logoUrl?: string; }
export interface UpdateProjectInput { name?: string; description?: string; }

export interface CreateTestCaseInput {
  title: string;
  description?: string;
  preconditions?: string;
  scenario?: string;
  testData?: string;
  expectedResult?: string;
  priority: Priority;
  severity?: Severity;
  status: CaseStatus;
  testType?: TestType;
  testEnvironment?: TestEnvironment;
  automationStatus?: AutomationStatus;
  reviewStatus?: ReviewStatus;
  platformPortal?: PlatformPortal;
  developmentSource?: string;
  requirementId?: string;
  assignedDeveloper?: string;
  requestType?: string;
  urgencyFlag?: UrgencyFlag;
  sourceRequestor?: string;
  impactAssessment?: string;
  designScreenshotUrl?: string;
  notesFindings?: string;
  qaSuggestion?: string;
  pmDecision?: string;
  suiteId?: string;
  tags?: string[];
  steps?: Array<{ action: string; expectedResult: string }>;
}
export interface UpdateTestCaseInput extends Partial<CreateTestCaseInput> {}

export interface CreateTestRunInput { name: string; description?: string; testCaseIds: string[]; sprint?: string; version?: string; }
export interface UpdateTestResultInput { status: ResultStatus; notes?: string; assigneeId?: string | null; }

export interface CreateDefectInput {
  title: string;
  testCaseId?: string;
  module?: string;
  description?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  severity?: Severity;
  priority?: Priority;
  assignedToId?: string;
  bugPattern?: string;
}

export interface CreateUatSessionInput {
  name: string;
  version?: string;
  environmentUrl?: string;
  uatStartDate?: string;
  uatEndDate?: string;
  supportContact?: string;
}

export interface CreateAdhocInput {
  issueDescription: string;
  requestor: string;
  requestDate?: string;
  requestType?: string;
  urgency?: UrgencyFlag;
  sourceSystem?: string;
  module?: string;
  impactAssessment?: string;
  affectedEnvironment?: string;
  notes?: string;
}

export interface LoginInput { email: string; password: string; }
export interface RegisterInput { email: string; name: string; password: string; }

export interface TestCaseFilters {
  page?: number;
  limit?: number;
  suiteId?: string;
  status?: CaseStatus;
  priority?: Priority;
  reviewStatus?: ReviewStatus;
  search?: string;
  scenario?: string;
  tag?: string;
}

export interface TestCaseComment {
  id: string;
  testCaseId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
  action: string;
  entityType: 'TEST_CASE' | 'DEFECT' | 'TEST_RUN';
  entityId: string;
  entityName: string;
  diff: Record<string, unknown> | null;
  createdAt: string;
}

export enum NotificationType {
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  REVIEW_REJECTED = 'REVIEW_REJECTED',
  DEFECT_ASSIGNED = 'DEFECT_ASSIGNED',
  RESULT_ASSIGNED = 'RESULT_ASSIGNED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  DEFECT_STATUS_CHANGED = 'DEFECT_STATUS_CHANGED',
  TEST_RUN_COMPLETED = 'TEST_RUN_COMPLETED',
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
