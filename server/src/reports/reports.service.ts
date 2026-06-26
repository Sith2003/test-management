import { Injectable, NotFoundException } from '@nestjs/common';
import { DefectStatus, ReviewStatus, Prisma, ProjectMemberRole, ResultStatus, RunStatus, Severity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getProjectSummary(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, key: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [
      totalCases,
      totalSuites,
      totalRuns,
      casesByPriority,
      casesByStatus,
      runsByStatus,
      resultCounts,
      openDefects,
      pendingReview,
    ] = await Promise.all([
      this.prisma.testCase.count({ where: { projectId } }),
      this.prisma.testSuite.count({ where: { projectId } }),
      this.prisma.testRun.count({ where: { projectId } }),

      this.prisma.testCase.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { id: true },
      }),

      this.prisma.testCase.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true },
      }),

      this.prisma.testRun.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true },
      }),

      this.prisma.testResult.groupBy({
        by: ['status'],
        where: { run: { projectId } },
        _count: { id: true },
      }),

      this.prisma.defect.count({ where: { projectId, status: { notIn: [DefectStatus.CLOSED, DefectStatus.WONTFIX] } } }),

      this.prisma.testCase.count({ where: { projectId, reviewStatus: { in: [ReviewStatus.DRAFT, ReviewStatus.READY] } } }),
    ]);

    const resultCountMap: Record<string, number> = {};
    for (const r of resultCounts) {
      resultCountMap[r.status] = r._count.id;
    }

    return {
      project,
      summary: {
        totalCases,
        totalSuites,
        totalRuns,
        casesByPriority: Object.fromEntries(casesByPriority.map((r) => [r.priority, r._count.id])),
        casesByStatus: Object.fromEntries(casesByStatus.map((r) => [r.status, r._count.id])),
        runsByStatus: Object.fromEntries(runsByStatus.map((r) => [r.status, r._count.id])),
        resultsByStatus: {
          pass: resultCountMap[ResultStatus.PASS] ?? 0,
          fail: resultCountMap[ResultStatus.FAIL] ?? 0,
          blocked: resultCountMap[ResultStatus.BLOCKED] ?? 0,
          skipped: resultCountMap[ResultStatus.SKIPPED] ?? 0,
          pending: resultCountMap[ResultStatus.PENDING] ?? 0,
        },
        openDefects,
        pendingReview,
      },
    };
  }

  async getRunHistory(projectId: string, user: JwtPayload, query: ReportQueryDto) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const limit = query.limit ?? 10;
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.startDate) dateFilter.gte = new Date(query.startDate);
    if (query.endDate) dateFilter.lte = new Date(query.endDate);
    const hasDateFilter = dateFilter.gte !== undefined || dateFilter.lte !== undefined;

    const runs = await this.prisma.testRun.findMany({
      where: {
        projectId,
        ...(hasDateFilter && { createdAt: dateFilter }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true } },
        results: {
          select: { status: true },
        },
      },
    });

    const runsWithStats = runs.map((run) => {
      const statusCounts: Record<string, number> = {
        pass: 0,
        fail: 0,
        blocked: 0,
        skipped: 0,
        pending: 0,
      };

      for (const result of run.results) {
        const key = result.status.toLowerCase();
        if (key in statusCounts) {
          statusCounts[key]++;
        }
      }

      const total = run.results.length;
      const passRate = total > 0 ? Math.round((statusCounts['pass'] / total) * 100) : 0;

      return {
        id: run.id,
        name: run.name,
        status: run.status,
        createdBy: run.createdBy,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        createdAt: run.createdAt,
        totalResults: total,
        statusCounts,
        passRate,
      };
    });

    return { runs: runsWithStats, total: runsWithStats.length };
  }

  async getSuiteBreakdown(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const suites = await this.prisma.testSuite.findMany({
      where: { projectId },
      include: {
        _count: { select: { testCases: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    const breakdowns = await Promise.all(
      suites.map(async (suite) => {
        // Get latest results for each test case in this suite
        const testCaseIds = await this.prisma.testCase
          .findMany({
            where: { suiteId: suite.id },
            select: { id: true },
          })
          .then((cases) => cases.map((c) => c.id));

        if (testCaseIds.length === 0) {
          return {
            id: suite.id,
            name: suite.name,
            description: suite.description,
            parentId: suite.parentId,
            totalCases: 0,
            latestResults: {
              pass: 0,
              fail: 0,
              blocked: 0,
              skipped: 0,
              pending: 0,
              untested: 0,
            },
          };
        }

        // Get most recent result for each test case using Prisma ORM
        // Find the latest testResult per testCase by getting grouped max IDs
        const allResults = await this.prisma.testResult.findMany({
          where: {
            testCaseId: { in: testCaseIds },
            run: { projectId },
          },
          select: { testCaseId: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });

        // Deduplicate by testCaseId, keeping latest
        const latestByCase = new Map<string, { status: ResultStatus }>();
        for (const r of allResults) {
          if (!latestByCase.has(r.testCaseId)) {
            latestByCase.set(r.testCaseId, { status: r.status });
          }
        }
        const latestResults = Array.from(latestByCase.values());

        const statusCounts: Record<string, number> = {
          pass: 0,
          fail: 0,
          blocked: 0,
          skipped: 0,
          pending: 0,
          untested: testCaseIds.length,
        };

        for (const result of latestResults) {
          const key = result.status.toLowerCase();
          if (key in statusCounts && key !== 'untested') {
            statusCounts[key]++;
            statusCounts['untested']--;
          }
        }

        return {
          id: suite.id,
          name: suite.name,
          description: suite.description,
          parentId: suite.parentId,
          totalCases: testCaseIds.length,
          latestResults: statusCounts,
        };
      }),
    );

    return { suites: breakdowns };
  }

  async getDefectTrend(projectId: string, user: JwtPayload, days = 30) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const defects = await this.prisma.defect.findMany({
      where: { projectId, createdAt: { gte: since } },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, { open: number; closed: number; total: number }>();

    for (const defect of defects) {
      const dateKey = defect.createdAt.toISOString().split('T')[0];
      if (!buckets.has(dateKey)) {
        buckets.set(dateKey, { open: 0, closed: 0, total: 0 });
      }
      const bucket = buckets.get(dateKey)!;
      bucket.total++;
      if (
        defect.status === DefectStatus.OPEN ||
        defect.status === DefectStatus.IN_PROGRESS
      ) {
        bucket.open++;
      } else {
        bucket.closed++;
      }
    }

    const trend: { date: string; open: number; closed: number; total: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const bucket = buckets.get(dateKey) ?? { open: 0, closed: 0, total: 0 };
      trend.push({ date: dateKey, ...bucket });
    }

    return { trend };
  }

  async getPassRateTrend(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const runs = await this.prisma.testRun.findMany({
      where: { projectId, status: RunStatus.COMPLETED },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        results: { select: { status: true } },
      },
    });

    const trend = runs.reverse().map((run) => {
      const total = run.results.length;
      const pass = run.results.filter((r) => r.status === ResultStatus.PASS).length;
      const fail = run.results.filter((r) => r.status === ResultStatus.FAIL).length;
      const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
      return {
        runName: run.name,
        createdAt: run.createdAt,
        passRate,
        pass,
        fail,
        total,
      };
    });

    return { trend };
  }

  async getAutomationCoverage(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const groups = await this.prisma.testCase.groupBy({
      by: ['automationStatus'],
      where: { projectId },
      _count: { id: true },
    });

    const coverage: Record<string, number> = {
      MANUAL: 0,
      AUTOMATED: 0,
      IN_PROGRESS: 0,
    };

    for (const group of groups) {
      coverage[group.automationStatus] = group._count.id;
    }

    return { coverage };
  }

  async getRequirementCoverage(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const total = await this.prisma.requirement.count({ where: { projectId } });

    const coveredRequirements = await this.prisma.requirement.findMany({
      where: { projectId },
      select: {
        id: true,
        _count: { select: { testCases: true } },
      },
    });

    const covered = coveredRequirements.filter((r) => r._count.testCases >= 1).length;
    const coveredPercent = total > 0 ? Math.round((covered / total) * 100) : 0;

    return { total, covered, coveredPercent };
  }

  async getSprintSummary(projectId: string, user: JwtPayload, sprint?: string, version?: string) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const [availableSprints, availableVersions] = await Promise.all([
      this.prisma.testRun.findMany({
        where: { projectId, sprint: { not: null } },
        select: { sprint: true },
        distinct: ['sprint'],
        orderBy: { sprint: 'asc' },
      }),
      this.prisma.testRun.findMany({
        where: { projectId, version: { not: null } },
        select: { version: true },
        distinct: ['version'],
        orderBy: { version: 'asc' },
      }),
    ]);

    const filters = {
      sprints: availableSprints.map((s) => s.sprint).filter(Boolean) as string[],
      versions: availableVersions.map((v) => v.version).filter(Boolean) as string[],
    };

    if (!sprint && !version) {
      return { sprint: null, version: null, filters, summary: null };
    }

    const runWhere: Prisma.TestRunWhereInput = { projectId };
    if (sprint) runWhere.sprint = sprint;
    if (version) runWhere.version = version;

    const runs = await this.prisma.testRun.findMany({
      where: runWhere,
      select: { id: true },
    });
    const runIds = runs.map((r) => r.id);

    if (runIds.length === 0) {
      return {
        sprint: sprint ?? null,
        version: version ?? null,
        filters,
        summary: {
          totalRuns: 0,
          testResults: { total: 0, pass: 0, fail: 0, blocked: 0, skipped: 0, pending: 0 },
          bugsFound: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
          bugsResolved: 0,
          bugsCarriedOver: 0,
          requirements: { tested: 0, total: 0 },
        },
      };
    }

    const testResults = await this.prisma.testResult.findMany({
      where: { runId: { in: runIds } },
      select: { id: true, status: true, testCaseId: true },
    });

    const resultIds = testResults.map((r) => r.id);
    const testedCaseIds = [...new Set(testResults.map((r) => r.testCaseId))];

    const resultCounts = { total: testResults.length, pass: 0, fail: 0, blocked: 0, skipped: 0, pending: 0 };
    for (const r of testResults) {
      const key = r.status.toLowerCase() as keyof typeof resultCounts;
      if (key in resultCounts) (resultCounts as Record<string, number>)[key]++;
    }

    const activeStatuses: DefectStatus[] = [DefectStatus.OPEN, DefectStatus.IN_PROGRESS, DefectStatus.RETEST, DefectStatus.REOPENED];

    const [sprintDefects, totalReqs, coveredReqs] = await Promise.all([
      this.prisma.defect.findMany({
        where: { projectId, testResultId: { in: resultIds } },
        select: { severity: true, status: true },
      }),
      this.prisma.requirement.count({ where: { projectId } }),
      this.prisma.requirement.count({
        where: { projectId, testCases: { some: { id: { in: testedCaseIds } } } },
      }),
    ]);

    const bugsFound = { total: sprintDefects.length, critical: 0, high: 0, medium: 0, low: 0 };
    for (const d of sprintDefects) {
      const s = d.severity.toLowerCase() as keyof typeof bugsFound;
      if (s in bugsFound) (bugsFound as Record<string, number>)[s]++;
    }

    return {
      sprint: sprint ?? null,
      version: version ?? null,
      filters,
      summary: {
        totalRuns: runIds.length,
        testResults: resultCounts,
        bugsFound,
        bugsResolved: sprintDefects.filter((d) => !activeStatuses.includes(d.status as DefectStatus)).length,
        bugsCarriedOver: sprintDefects.filter((d) => activeStatuses.includes(d.status as DefectStatus)).length,
        requirements: { tested: coveredReqs, total: totalReqs },
      },
    };
  }

  async getReleaseReadiness(projectId: string, user: JwtPayload, sprint?: string, version?: string) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    // Build run filter based on optional sprint/version scope
    const runWhere: Prisma.TestRunWhereInput = { projectId };
    if (sprint) runWhere.sprint = sprint;
    if (version) runWhere.version = version;

    const activeDefectStatuses = [
      DefectStatus.OPEN,
      DefectStatus.IN_PROGRESS,
      DefectStatus.RETEST,
      DefectStatus.REOPENED,
    ];

    const [
      totalResults,
      passedResults,
      criticalOpen,
      highOpen,
      totalOpenDefects,
      totalCases,
      testedCaseIds,
      totalReqs,
      coveredReqs,
      availableSprints,
      availableVersions,
    ] = await Promise.all([
      this.prisma.testResult.count({ where: { run: runWhere } }),
      this.prisma.testResult.count({ where: { run: runWhere, status: ResultStatus.PASS } }),
      this.prisma.defect.count({
        where: { projectId, severity: Severity.CRITICAL, status: { in: activeDefectStatuses } },
      }),
      this.prisma.defect.count({
        where: { projectId, severity: Severity.HIGH, status: { in: activeDefectStatuses } },
      }),
      this.prisma.defect.count({
        where: { projectId, status: { in: activeDefectStatuses } },
      }),
      this.prisma.testCase.count({ where: { projectId } }),
      this.prisma.testResult.findMany({
        where: { run: runWhere },
        select: { testCaseId: true },
        distinct: ['testCaseId'],
      }),
      this.prisma.requirement.count({ where: { projectId } }),
      this.prisma.requirement.count({
        where: { projectId, testCases: { some: {} } },
      }),
      this.prisma.testRun.findMany({
        where: { projectId, sprint: { not: null } },
        select: { sprint: true },
        distinct: ['sprint'],
        orderBy: { sprint: 'asc' },
      }),
      this.prisma.testRun.findMany({
        where: { projectId, version: { not: null } },
        select: { version: true },
        distinct: ['version'],
        orderBy: { version: 'asc' },
      }),
    ]);

    const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;
    const untestedCount = totalCases - testedCaseIds.length;
    const reqCoverage = totalReqs > 0 ? Math.round((coveredReqs / totalReqs) * 100) : 100;

    const THRESHOLDS = {
      passRate: 90,
      criticalOpen: 0,
      highOpen: 3,
      reqCoverage: 80,
      untested: 0,
    };

    const isNoGo = criticalOpen > 0 || (totalResults > 0 && passRate < 80);
    const isGo =
      passRate >= THRESHOLDS.passRate &&
      criticalOpen === 0 &&
      highOpen <= THRESHOLDS.highOpen &&
      reqCoverage >= THRESHOLDS.reqCoverage &&
      untestedCount === 0;

    const verdict: 'GO' | 'CONDITIONAL' | 'NO_GO' = isNoGo ? 'NO_GO' : isGo ? 'GO' : 'CONDITIONAL';

    return {
      verdict,
      sprint: sprint ?? null,
      version: version ?? null,
      metrics: {
        passRate: {
          value: passRate,
          target: THRESHOLDS.passRate,
          total: totalResults,
          passed: passedResults,
        },
        criticalOpen: { value: criticalOpen, target: THRESHOLDS.criticalOpen },
        highOpen: { value: highOpen, target: THRESHOLDS.highOpen },
        reqCoverage: {
          value: reqCoverage,
          target: THRESHOLDS.reqCoverage,
          total: totalReqs,
          covered: coveredReqs,
        },
        untested: { value: untestedCount, target: THRESHOLDS.untested, total: totalCases },
        totalOpenDefects,
      },
      filters: {
        sprints: availableSprints.map((s) => s.sprint).filter(Boolean) as string[],
        versions: availableVersions.map((v) => v.version).filter(Boolean) as string[],
      },
    };
  }
}
