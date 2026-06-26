import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { ProjectMemberRole, ResultStatus } from '@prisma/client';
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';

const planInclude = {
  createdBy: { select: { id: true, name: true } },
  assignees: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  _count: { select: { testRuns: true } },
} as const;

@Injectable()
export class TestPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async findAll(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const plans = await this.prisma.testPlan.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: planInclude,
    });

    // Compute progress for each plan
    const plansWithProgress = await Promise.all(
      plans.map(async (plan) => {
        const runs = await this.prisma.testRun.findMany({
          where: { planId: plan.id },
          select: { status: true, results: { select: { status: true } } },
        });
        const totalResults = runs.reduce((sum, r) => sum + r.results.length, 0);
        const passedResults = runs.reduce(
          (sum, r) => sum + r.results.filter((res) => res.status === ResultStatus.PASS).length,
          0,
        );
        const completedRuns = runs.filter((r) => r.status === 'COMPLETED').length;
        return {
          ...plan,
          progress: {
            totalRuns: runs.length,
            completedRuns,
            totalResults,
            passedResults,
            passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
          },
        };
      }),
    );

    return { data: plansWithProgress };
  }

  async findOne(projectId: string, planId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const plan = await this.prisma.testPlan.findFirst({
      where: { id: planId, projectId },
      include: {
        ...planInclude,
        testRuns: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true } },
            results: { select: { status: true } },
            _count: { select: { results: true } },
          },
        },
      },
    });

    if (!plan) throw new NotFoundException('Test plan not found');

    const runsWithStats = plan.testRuns.map((run) => {
      const total = run.results.length;
      const pass = run.results.filter((r) => r.status === ResultStatus.PASS).length;
      const fail = run.results.filter((r) => r.status === ResultStatus.FAIL).length;
      const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
      const { results, ...runWithoutResults } = run;
      return { ...runWithoutResults, stats: { total, pass, fail, passRate } };
    });

    const totalResults = plan.testRuns.reduce((s, r) => s + r.results.length, 0);
    const passedResults = plan.testRuns.reduce(
      (s, r) => s + r.results.filter((res) => res.status === ResultStatus.PASS).length,
      0,
    );
    const completedRuns = plan.testRuns.filter((r) => r.status === 'COMPLETED').length;

    const { testRuns, ...planWithoutRuns } = plan;
    return {
      ...planWithoutRuns,
      testRuns: runsWithStats,
      progress: {
        totalRuns: plan.testRuns.length,
        completedRuns,
        totalResults,
        passedResults,
        passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
      },
    };
  }

  async create(projectId: string, user: JwtPayload, dto: CreateTestPlanDto) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    return this.prisma.testPlan.create({
      data: {
        projectId,
        name: dto.name,
        sprint: dto.sprint,
        version: dto.version,
        description: dto.description,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        status: 'DRAFT',
        createdById: user.id,
        ...(dto.assigneeIds?.length && {
          assignees: {
            create: dto.assigneeIds.map((userId) => ({ userId })),
          },
        }),
      },
      include: planInclude,
    });
  }

  async update(projectId: string, planId: string, user: JwtPayload, dto: UpdateTestPlanDto) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const plan = await this.prisma.testPlan.findFirst({ where: { id: planId, projectId } });
    if (!plan) throw new NotFoundException('Test plan not found');

    return this.prisma.testPlan.update({
      where: { id: planId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sprint !== undefined && { sprint: dto.sprint }),
        ...(dto.version !== undefined && { version: dto.version }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetDate !== undefined && {
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.assigneeIds !== undefined && {
          assignees: {
            deleteMany: {},
            create: dto.assigneeIds.map((userId) => ({ userId })),
          },
        }),
      },
      include: planInclude,
    });
  }

  async remove(projectId: string, planId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const plan = await this.prisma.testPlan.findFirst({ where: { id: planId, projectId } });
    if (!plan) throw new NotFoundException('Test plan not found');

    await this.prisma.testPlan.delete({ where: { id: planId } });
  }

  async linkRun(projectId: string, planId: string, runId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const [plan, run] = await Promise.all([
      this.prisma.testPlan.findFirst({ where: { id: planId, projectId } }),
      this.prisma.testRun.findFirst({ where: { id: runId, projectId } }),
    ]);

    if (!plan) throw new NotFoundException('Test plan not found');
    if (!run) throw new NotFoundException('Test run not found');

    return this.prisma.testRun.update({ where: { id: runId }, data: { planId } });
  }

  async unlinkRun(projectId: string, planId: string, runId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    await this.prisma.testRun.updateMany({
      where: { id: runId, planId },
      data: { planId: null },
    });
  }
}
