import api from '@/shared/services/api';
import type {
  ReportSummary,
  RunHistoryEntry,
  SuiteBreakdownEntry,
} from '@/shared/types';

interface Wrapped<T> {
  data: T;
  meta: { timestamp: string };
}

export interface DefectTrendEntry {
  date: string;
  open: number;
  closed: number;
}

export interface PassRateTrendEntry {
  runId: string;
  runName: string;
  date: string;
  passRate: number;
  total: number;
}

export interface AutomationCoverageData {
  manual: number;
  automated: number;
  inProgress: number;
  total: number;
}

export interface RequirementCoverageData {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercent: number;
}

export const reportService = {
  async getSummary(projectId: string): Promise<ReportSummary> {
    const res = await api.get<never, Wrapped<{
      project: unknown;
      summary: {
        totalCases: number; totalRuns: number;
        casesByStatus: Record<string, number>;
        runsByStatus: Record<string, number>;
        resultsByStatus: { pass: number; fail: number; blocked: number; skipped: number; pending: number };
        openDefects: number;
      };
    }>>(`/projects/${projectId}/reports/summary`);
    const s = res.data.summary;
    const r = s.resultsByStatus;
    const executed = r.pass + r.fail + r.blocked + r.skipped;
    return {
      totalCases: s.totalCases,
      totalRuns: s.totalRuns,
      passRate: executed > 0 ? r.pass / executed : 0,
      activeCases: s.casesByStatus['ACTIVE'] ?? 0,
      draftCases: s.casesByStatus['DRAFT'] ?? 0,
      archivedCases: s.casesByStatus['ARCHIVED'] ?? 0,
      completedRuns: s.runsByStatus['COMPLETED'] ?? 0,
      inProgressRuns: s.runsByStatus['IN_PROGRESS'] ?? 0,
      openDefects: s.openDefects ?? 0,
    };
  },

  async getRunHistory(projectId: string): Promise<RunHistoryEntry[]> {
    const res = await api.get<never, Wrapped<{
      runs: Array<{
        id: string; name: string; createdAt: string; totalResults: number;
        statusCounts: { pass: number; fail: number; blocked: number; skipped: number; pending: number };
        passRate: number;
      }>;
      total: number;
    }>>(`/projects/${projectId}/reports/run-history`);
    return res.data.runs.map((r) => ({
      runId: r.id,
      runName: r.name,
      date: r.createdAt,
      pass: r.statusCounts.pass,
      fail: r.statusCounts.fail,
      blocked: r.statusCounts.blocked,
      skipped: r.statusCounts.skipped,
      pending: r.statusCounts.pending,
      total: r.totalResults,
      passRate: r.passRate,
    }));
  },

  async getSuiteBreakdown(projectId: string): Promise<SuiteBreakdownEntry[]> {
    const res = await api.get<never, Wrapped<{
      suites: Array<{
        id: string; name: string; totalCases: number;
        latestResults: { pass: number; fail: number; blocked: number; skipped: number; pending: number; untested: number };
      }>;
    }>>(`/projects/${projectId}/reports/suite-breakdown`);
    return res.data.suites.map((s) => ({
      suiteId: s.id,
      suiteName: s.name,
      totalCases: s.totalCases,
      pass: s.latestResults.pass,
      fail: s.latestResults.fail,
      blocked: s.latestResults.blocked,
      pending: s.latestResults.pending,
      untested: s.latestResults.untested,
    }));
  },

  async getDefectTrend(projectId: string): Promise<DefectTrendEntry[]> {
    const res = await api.get<never, Wrapped<{ trend: DefectTrendEntry[] }>>(
      `/projects/${projectId}/reports/defect-trend`
    );
    return res.data.trend;
  },

  async getPassRateTrend(projectId: string): Promise<PassRateTrendEntry[]> {
    const res = await api.get<never, Wrapped<{
      trend: Array<{ runName: string; createdAt: string; passRate: number; total: number }>;
    }>>(`/projects/${projectId}/reports/pass-rate-trend`);
    // Backend sends passRate as 0-100; component multiplies by 100, so divide here to keep it in 0-1
    return res.data.trend.map((t) => ({
      runId: '',
      runName: t.runName,
      date: t.createdAt,
      passRate: t.passRate / 100,
      total: t.total,
    }));
  },

  async getAutomationCoverage(projectId: string): Promise<AutomationCoverageData> {
    const res = await api.get<never, Wrapped<{ coverage: Record<string, number> }>>(
      `/projects/${projectId}/reports/automation-coverage`
    );
    const c = res.data.coverage;
    const manual = c['MANUAL'] ?? 0;
    const automated = c['AUTOMATED'] ?? 0;
    const inProgress = c['IN_PROGRESS'] ?? 0;
    return { manual, automated, inProgress, total: manual + automated + inProgress };
  },

  async getRequirementCoverage(projectId: string): Promise<RequirementCoverageData> {
    const res = await api.get<never, Wrapped<{ total: number; covered: number; coveredPercent: number }>>(
      `/projects/${projectId}/reports/requirement-coverage`
    );
    return {
      totalRequirements: res.data.total,
      coveredRequirements: res.data.covered,
      coveragePercent: res.data.coveredPercent,
    };
  },

  async getSprintSummary(projectId: string, sprint?: string, version?: string): Promise<SprintSummaryData> {
    const params = new URLSearchParams();
    if (sprint) params.set('sprint', sprint);
    if (version) params.set('version', version);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get<never, Wrapped<SprintSummaryData>>(
      `/projects/${projectId}/reports/sprint-summary${query}`
    );
    return res.data;
  },

  async getReleaseReadiness(projectId: string, sprint?: string, version?: string): Promise<ReleaseReadinessData> {
    const params = new URLSearchParams();
    if (sprint) params.set('sprint', sprint);
    if (version) params.set('version', version);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get<never, Wrapped<ReleaseReadinessData>>(
      `/projects/${projectId}/reports/release-readiness${query}`
    );
    return res.data;
  },
};

export interface SprintSummaryData {
  sprint: string | null;
  version: string | null;
  filters: {
    sprints: string[];
    versions: string[];
  };
  summary: {
    totalRuns: number;
    testResults: {
      total: number;
      pass: number;
      fail: number;
      blocked: number;
      skipped: number;
      pending: number;
    };
    bugsFound: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    bugsResolved: number;
    bugsCarriedOver: number;
    requirements: {
      tested: number;
      total: number;
    };
  } | null;
}

export interface ReleaseReadinessMetric {
  value: number;
  target: number;
  total?: number;
  passed?: number;
  covered?: number;
}

export interface ReleaseReadinessData {
  verdict: 'GO' | 'CONDITIONAL' | 'NO_GO';
  sprint: string | null;
  version: string | null;
  metrics: {
    passRate: ReleaseReadinessMetric;
    criticalOpen: ReleaseReadinessMetric;
    highOpen: ReleaseReadinessMetric;
    reqCoverage: ReleaseReadinessMetric;
    untested: ReleaseReadinessMetric;
    totalOpenDefects: number;
  };
  filters: {
    sprints: string[];
    versions: string[];
  };
}
