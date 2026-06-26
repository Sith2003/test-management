import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { UpdateTestRunDto } from './dto/update-test-run.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { ProjectMemberRole, RunStatus, ResultStatus, NotificationType } from '@prisma/client';
import { buildPaginationMeta } from '../shared/types/api-response.types';
import { PAGINATION } from '../shared/constants/pagination.constants';

@Injectable()
export class TestRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly activityLog: ActivityLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(projectId: string, user: JwtPayload, page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.testRun.count({ where: { projectId } }),
      this.prisma.testRun.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { results: true } },
          plan: { select: { id: true, name: true, sprint: true, version: true } },
        },
      }),
    ]);

    return {
      data: items,
      pagination: buildPaginationMeta({ page, limit, total }),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async findOne(projectId: string, runId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, sprint: true, version: true } },
        results: {
          include: {
            testCase: {
              include: { steps: { orderBy: { order: 'asc' } } },
            },
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Test run not found');
    }

    return run;
  }

  async create(projectId: string, dto: CreateTestRunDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    // Validate all test cases belong to this project
    const testCases = await this.prisma.testCase.findMany({
      where: { id: { in: dto.testCaseIds }, projectId },
      select: { id: true },
    });

    if (testCases.length !== dto.testCaseIds.length) {
      const foundIds = new Set(testCases.map((tc) => tc.id));
      const missing = dto.testCaseIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `The following test case IDs do not belong to this project: ${missing.join(', ')}`,
      );
    }

    const run = await this.prisma.testRun.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        sprint: dto.sprint,
        version: dto.version,
        planId: dto.planId,
        createdById: user.id,
        status: RunStatus.PENDING,
        results: {
          create: dto.testCaseIds.map((testCaseId) => ({
            testCaseId,
            status: ResultStatus.PENDING,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { results: true } },
        plan: { select: { id: true, name: true, sprint: true, version: true } },
      },
    });

    void this.activityLog.log({
      projectId,
      userId: user.id,
      action: 'CREATED',
      entityType: 'TEST_RUN',
      entityId: run.id,
      entityName: run.name,
    });

    return run;
  }

  async update(projectId: string, runId: string, dto: UpdateTestRunDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const run = await this.prisma.testRun.findFirst({ where: { id: runId, projectId } });
    if (!run) {
      throw new NotFoundException('Test run not found');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData['name'] = dto.name;
    if (dto.description !== undefined) updateData['description'] = dto.description;
    if (dto.status !== undefined) {
      updateData['status'] = dto.status;
      if (dto.status === RunStatus.IN_PROGRESS && !run.startedAt) {
        updateData['startedAt'] = new Date();
      } else if (
        (dto.status === RunStatus.COMPLETED || dto.status === RunStatus.ABORTED) &&
        !run.completedAt
      ) {
        updateData['completedAt'] = new Date();
      }
    }

    const updated = await this.prisma.testRun.update({
      where: { id: runId },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { results: true } },
      },
    });

    if (dto.status && dto.status !== run.status) {
      void this.activityLog.log({
        projectId,
        userId: user.id,
        action: 'STATUS_CHANGED',
        entityType: 'TEST_RUN',
        entityId: updated.id,
        entityName: updated.name,
        diff: { from: run.status, to: dto.status },
      });
    }

    return updated;
  }

  async remove(projectId: string, runId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);

    const run = await this.prisma.testRun.findFirst({ where: { id: runId, projectId } });
    if (!run) {
      throw new NotFoundException('Test run not found');
    }

    await this.prisma.testRun.delete({ where: { id: runId } });
  }

  async updateResult(
    projectId: string,
    runId: string,
    resultId: string,
    dto: UpdateResultDto,
    user: JwtPayload,
  ) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const result = await this.prisma.testResult.findFirst({
      where: { id: resultId, runId },
      include: { run: { select: { projectId: true } } },
    });

    if (!result || result.run.projectId !== projectId) {
      throw new NotFoundException('Test result not found');
    }

    const isExecuted =
      dto.status !== ResultStatus.PENDING;

    const updatedResult = await this.prisma.testResult.update({
      where: { id: resultId },
      data: {
        status: dto.status,
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(isExecuted && { executedAt: new Date() }),
      },
      include: {
        testCase: { select: { id: true, caseId: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify new assignee when result is assigned
    if (dto.assigneeId && dto.assigneeId !== result.assigneeId && dto.assigneeId !== user.id) {
      const assignee = await this.prisma.user.findUnique({ where: { id: dto.assigneeId }, select: { email: true } });
      if (assignee) {
        const run = await this.prisma.testRun.findUnique({ where: { id: runId }, select: { name: true } });
        void this.notifications.create({
          userId: dto.assigneeId,
          userEmail: assignee.email,
          type: NotificationType.RESULT_ASSIGNED,
          title: 'Test Result Assigned to You',
          message: `${user.name ?? 'Someone'} assigned a test result in "${run?.name ?? 'a run'}" to you.`,
          link: `/projects/${projectId}/runs/${runId}`,
        });
      }
    }

    // Auto-update run status if all results have been executed
    await this.syncRunStatus(runId, projectId, user.id);

    return updatedResult;
  }

  private async syncRunStatus(runId: string, projectId?: string, executorId?: string): Promise<void> {
    const run = await this.prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        results: { select: { status: true } },
        createdBy: { select: { id: true, email: true } },
      },
    });

    if (!run) return;

    const allDone = run.results.every((r) => r.status !== ResultStatus.PENDING);
    const anyInProgress = run.results.some((r) => r.status !== ResultStatus.PENDING);

    if (allDone && run.status !== RunStatus.COMPLETED && run.status !== RunStatus.ABORTED) {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: {
          status: RunStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Notify run creator that run is complete (if not the executor)
      if (projectId && executorId && run.createdById !== executorId) {
        void this.notifications.create({
          userId: run.createdById,
          userEmail: run.createdBy.email,
          type: NotificationType.TEST_RUN_COMPLETED,
          title: 'Test Run Completed',
          message: `All results in test run "${run.name}" have been executed.`,
          link: `/projects/${projectId}/runs/${runId}`,
        });
      }
    } else if (anyInProgress && run.status === RunStatus.PENDING) {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: {
          status: RunStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });
    }
  }
}
