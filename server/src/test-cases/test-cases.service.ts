import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { BulkCreateTestCasesDto } from './dto/bulk-create.dto';
import { BulkUpdateTestCasesDto, BulkAction } from './dto/bulk-update.dto';
import { ListTestCasesQuery, SortOrder } from './dto/list-test-cases.query';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { buildPaginationMeta, CollectionResponse } from '../shared/types/api-response.types';
import { ProjectMemberRole, ReviewStatus, NotificationType, Prisma } from '@prisma/client';
import { ReviewTestCaseDto } from './dto/review-test-case.dto';
import { PAGINATION } from '../shared/constants/pagination.constants';

@Injectable()
export class TestCasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly activityLog: ActivityLogService,
    private readonly notifications: NotificationsService,
  ) {}

  private async generateCaseId(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { key: true },
    });

    const count = await this.prisma.testCase.count({ where: { projectId } });
    const nextNum = String(count + 1).padStart(3, '0');
    return `${project?.key ?? 'TC'}-${nextNum}`;
  }

  async findAll(
    projectId: string,
    user: JwtPayload,
    query: ListTestCasesQuery,
  ): Promise<CollectionResponse<unknown>> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Prisma.TestCaseWhereInput = { projectId };

    if (query.suiteId) where.suiteId = query.suiteId;
    if (query.priority) where.priority = query.priority;
    if (query.status) where.status = query.status;
    if (query.reviewStatus) where.reviewStatus = query.reviewStatus;
    if (query.scenario) where['scenario'] = query.scenario;
    if (query.tag) where['tags'] = { has: query.tag };

    if (query.search) {
      where['OR'] = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { caseId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.order ?? SortOrder.DESC;

    const [total, items] = await Promise.all([
      this.prisma.testCase.count({ where }),
      this.prisma.testCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          suite: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          steps: { orderBy: { order: 'asc' }, select: { id: true, order: true, action: true, expectedResult: true } },
          _count: { select: { steps: true } },
        },
      }),
    ]);

    return {
      data: items,
      pagination: buildPaginationMeta({ page, limit, total }),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async findOne(projectId: string, caseId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const testCase = await this.prisma.testCase.findFirst({
      where: { id: caseId, projectId },
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        steps: { orderBy: { order: 'asc' } },
      },
    });

    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    return testCase;
  }

  async create(projectId: string, dto: CreateTestCaseDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    if (dto.suiteId) {
      const suite = await this.prisma.testSuite.findFirst({
        where: { id: dto.suiteId, projectId },
      });
      if (!suite) {
        throw new NotFoundException('Test suite not found in this project');
      }
    }

    const caseId = await this.generateCaseId(projectId);

    const created = await this.prisma.testCase.create({
      data: {
        projectId,
        caseId,
        title: dto.title,
        description: dto.description,
        preconditions: dto.preconditions,
        suiteId: dto.suiteId ?? null,
        priority: dto.priority,
        status: dto.status,
        tags: dto.tags ?? [],
        createdById: user.id,
        severity: dto.severity,
        testType: dto.testType,
        testEnvironment: dto.testEnvironment,
        automationStatus: dto.automationStatus,
        reviewStatus: dto.reviewStatus,
        platformPortal: dto.platformPortal,
        requirementId: dto.requirementId,
        assignedDeveloper: dto.assignedDeveloper,
        urgencyFlag: dto.urgencyFlag,
        testData: dto.testData,
        expectedResult: dto.expectedResult,
        steps: dto.steps
          ? {
              create: dto.steps.map((step) => ({
                order: step.order,
                action: step.action,
                expectedResult: step.expectedResult,
              })),
            }
          : undefined,
      },
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        steps: { orderBy: { order: 'asc' } },
      },
    });

    void this.activityLog.log({
      projectId,
      userId: user.id,
      action: 'CREATED',
      entityType: 'TEST_CASE',
      entityId: created.id,
      entityName: `${created.caseId}: ${created.title}`,
    });

    return created;
  }

  async update(projectId: string, caseId: string, dto: UpdateTestCaseDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const testCase = await this.prisma.testCase.findFirst({ where: { id: caseId, projectId } });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    if (dto.suiteId) {
      const suite = await this.prisma.testSuite.findFirst({
        where: { id: dto.suiteId, projectId },
      });
      if (!suite) {
        throw new NotFoundException('Test suite not found in this project');
      }
    }

    // Replace steps if provided
    if (dto.steps !== undefined) {
      await this.prisma.testStep.deleteMany({ where: { testCaseId: caseId } });
    }

    const updated = await this.prisma.testCase.update({
      where: { id: caseId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.preconditions !== undefined && { preconditions: dto.preconditions }),
        ...(dto.suiteId !== undefined && { suiteId: dto.suiteId }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.severity !== undefined && { severity: dto.severity }),
        ...(dto.testType !== undefined && { testType: dto.testType }),
        ...(dto.testEnvironment !== undefined && { testEnvironment: dto.testEnvironment }),
        ...(dto.automationStatus !== undefined && { automationStatus: dto.automationStatus }),
        ...(dto.reviewStatus !== undefined && { reviewStatus: dto.reviewStatus }),
        ...(dto.platformPortal !== undefined && { platformPortal: dto.platformPortal }),
        ...(dto.requirementId !== undefined && { requirementId: dto.requirementId }),
        ...(dto.assignedDeveloper !== undefined && { assignedDeveloper: dto.assignedDeveloper }),
        ...(dto.urgencyFlag !== undefined && { urgencyFlag: dto.urgencyFlag }),
        ...(dto.testData !== undefined && { testData: dto.testData }),
        ...(dto.expectedResult !== undefined && { expectedResult: dto.expectedResult }),
        ...(dto.steps !== undefined && {
          steps: {
            create: dto.steps.map((step) => ({
              order: step.order,
              action: step.action,
              expectedResult: step.expectedResult,
            })),
          },
        }),
      },
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        steps: { orderBy: { order: 'asc' } },
      },
    });

    void this.activityLog.log({
      projectId,
      userId: user.id,
      action: 'UPDATED',
      entityType: 'TEST_CASE',
      entityId: updated.id,
      entityName: `${updated.caseId}: ${updated.title}`,
    });

    return updated;
  }

  async review(projectId: string, caseId: string, user: JwtPayload, dto: ReviewTestCaseDto) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const testCase = await this.prisma.testCase.findFirst({ where: { id: caseId, projectId } });
    if (!testCase) throw new NotFoundException('Test case not found');

    // Determine if user has reviewer privileges (Manager+ in project or Admin globally)
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    const isReviewer =
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      member?.role === ProjectMemberRole.ADMIN ||
      member?.role === ProjectMemberRole.MANAGER;

    const current = testCase.reviewStatus as ReviewStatus;

    // Submitter transitions (any tester): DRAFT/REJECTED/READY → IN_REVIEW
    const submitterAllowed: ReviewStatus[] = [ReviewStatus.DRAFT, ReviewStatus.REJECTED, ReviewStatus.READY];
    // Reviewer transitions: IN_REVIEW → APPROVED / REJECTED; APPROVED → IN_REVIEW (re-open)
    const reviewerAllowed: ReviewStatus[] = [ReviewStatus.IN_REVIEW, ReviewStatus.APPROVED];

    const canSubmit = submitterAllowed.includes(current) && dto.status === ReviewStatus.IN_REVIEW;
    const canReview =
      isReviewer &&
      reviewerAllowed.includes(current) &&
      (dto.status === ReviewStatus.APPROVED ||
        dto.status === ReviewStatus.REJECTED ||
        dto.status === ReviewStatus.IN_REVIEW);

    if (!canSubmit && !canReview) {
      throw new ForbiddenException(
        `Cannot transition from ${current} to ${dto.status} with your role`,
      );
    }

    if (dto.status === ReviewStatus.REJECTED && !dto.comment?.trim()) {
      throw new BadRequestException('A rejection comment is required');
    }

    const reviewed = await this.prisma.testCase.update({
      where: { id: caseId },
      data: {
        reviewStatus: dto.status,
        // Clear comment on re-submit; set comment on reject; keep comment on approve
        reviewComment:
          dto.status === ReviewStatus.IN_REVIEW
            ? null
            : dto.comment?.trim() ?? null,
      },
    });

    const actionMap: Record<string, string> = {
      [ReviewStatus.IN_REVIEW]: 'REVIEW_SUBMITTED',
      [ReviewStatus.APPROVED]: 'REVIEW_APPROVED',
      [ReviewStatus.REJECTED]: 'REVIEW_REJECTED',
    };
    void this.activityLog.log({
      projectId,
      userId: user.id,
      action: actionMap[dto.status] ?? 'REVIEW_UPDATED',
      entityType: 'TEST_CASE',
      entityId: reviewed.id,
      entityName: `${reviewed.caseId}: ${reviewed.title}`,
    });

    // If submitting for review → notify managers
    if (dto.status === ReviewStatus.IN_REVIEW) {
      const managers = await this.prisma.projectMember.findMany({
        where: { projectId, role: { in: [ProjectMemberRole.MANAGER, ProjectMemberRole.ADMIN] } },
        include: { user: { select: { id: true, email: true } } },
      });
      for (const m of managers) {
        if (m.userId !== user.id) {
          void this.notifications.create({
            userId: m.userId,
            userEmail: m.user.email,
            type: NotificationType.REVIEW_REQUESTED,
            title: 'Test Case Review Requested',
            message: `${user.name ?? 'Someone'} submitted "${testCase.title}" for review.`,
            link: `/projects/${projectId}/cases/${testCase.id}/edit`,
          });
        }
      }
    }

    // If approved/rejected → notify author
    if (([ReviewStatus.APPROVED, ReviewStatus.REJECTED] as ReviewStatus[]).includes(dto.status) && testCase.createdById !== user.id) {
      const author = await this.prisma.user.findUnique({ where: { id: testCase.createdById }, select: { email: true } });
      if (author) {
        void this.notifications.create({
          userId: testCase.createdById,
          userEmail: author.email,
          type: dto.status === ReviewStatus.APPROVED ? NotificationType.REVIEW_APPROVED : NotificationType.REVIEW_REJECTED,
          title: `Test Case ${dto.status === ReviewStatus.APPROVED ? 'Approved' : 'Rejected'}`,
          message: `"${testCase.title}" has been ${dto.status.toLowerCase()} by ${user.name ?? 'a reviewer'}.`,
          link: `/projects/${projectId}/cases/${testCase.id}/edit`,
        });
      }
    }

    return reviewed;
  }

  async remove(projectId: string, caseId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const testCase = await this.prisma.testCase.findFirst({ where: { id: caseId, projectId } });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    void this.activityLog.log({
      projectId,
      userId: user.id,
      action: 'DELETED',
      entityType: 'TEST_CASE',
      entityId: testCase.id,
      entityName: `${testCase.caseId}: ${testCase.title}`,
    });

    await this.prisma.testCase.delete({ where: { id: caseId } });
  }

  async bulkCreate(projectId: string, dto: BulkCreateTestCasesDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const created = [];

    for (const testCaseDto of dto.testCases) {
      if (testCaseDto.suiteId) {
        const suite = await this.prisma.testSuite.findFirst({
          where: { id: testCaseDto.suiteId, projectId },
        });
        if (!suite) {
          throw new NotFoundException(`Test suite '${testCaseDto.suiteId}' not found in this project`);
        }
      }

      const caseId = await this.generateCaseId(projectId);

      const testCase = await this.prisma.testCase.create({
        data: {
          projectId,
          caseId,
          title: testCaseDto.title,
          description: testCaseDto.description,
          preconditions: testCaseDto.preconditions,
          suiteId: testCaseDto.suiteId ?? null,
          priority: testCaseDto.priority,
          status: testCaseDto.status,
          tags: testCaseDto.tags ?? [],
          createdById: user.id,
          steps: testCaseDto.steps
            ? {
                create: testCaseDto.steps.map((step) => ({
                  order: step.order,
                  action: step.action,
                  expectedResult: step.expectedResult,
                })),
              }
            : undefined,
        },
        include: {
          steps: { orderBy: { order: 'asc' } },
        },
      });

      created.push(testCase);
    }

    return { created, count: created.length };
  }

  async bulkUpdate(projectId: string, dto: BulkUpdateTestCasesDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    // Safety: ensure all IDs belong to this project
    const where = { id: { in: dto.ids }, projectId };
    if (dto.action === BulkAction.DELETE) {
      await this.prisma.testCase.deleteMany({ where });
      return { affected: dto.ids.length };
    }
    if (dto.action === BulkAction.MOVE) {
      const result = await this.prisma.testCase.updateMany({ where, data: { suiteId: dto.suiteId ?? null } });
      return { affected: result.count };
    }
    if (dto.action === BulkAction.SET_STATUS && dto.status) {
      const result = await this.prisma.testCase.updateMany({ where, data: { status: dto.status } });
      return { affected: result.count };
    }
    return { affected: 0 };
  }

  async findScenarios(projectId: string, user: JwtPayload): Promise<string[]> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const rows = await this.prisma.testCase.findMany({
      where: { projectId, scenario: { not: null } },
      select: { scenario: true },
      distinct: ['scenario'],
      orderBy: { scenario: 'asc' },
    });
    return rows.map((r) => r.scenario as string);
  }

  async getAvailableTags(projectId: string, user: JwtPayload): Promise<string[]> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const rows = await this.prisma.testCase.findMany({
      where: { projectId },
      select: { tags: true },
    });
    const tagSet = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tags) tagSet.add(tag);
    }
    return Array.from(tagSet).sort();
  }

  // --- Comments ---

  async getComments(projectId: string, testCaseId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const tc = await this.prisma.testCase.findFirst({ where: { id: testCaseId, projectId } });
    if (!tc) throw new NotFoundException('Test case not found');
    return this.prisma.testCaseComment.findMany({
      where: { testCaseId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(projectId: string, testCaseId: string, content: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const tc = await this.prisma.testCase.findFirst({ where: { id: testCaseId, projectId } });
    if (!tc) throw new NotFoundException('Test case not found');
    const comment = await this.prisma.testCaseComment.create({
      data: { testCaseId, authorId: user.id, content },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    // After creating the comment, notify test case author
    if (tc.createdById !== user.id) {
      const author = await this.prisma.user.findUnique({ where: { id: tc.createdById }, select: { email: true } });
      if (author) {
        void this.notifications.create({
          userId: tc.createdById,
          userEmail: author.email,
          type: NotificationType.COMMENT_ADDED,
          title: 'New Comment on Test Case',
          message: `${user.name ?? 'Someone'} commented on "${tc.title}".`,
          link: `/projects/${projectId}/cases/${tc.id}/edit`,
        });
      }
    }

    return comment;
  }

  async deleteComment(projectId: string, testCaseId: string, commentId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const comment = await this.prisma.testCaseComment.findFirst({
      where: { id: commentId, testCaseId, testCase: { projectId } },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== user.id) {
      await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    }
    await this.prisma.testCaseComment.delete({ where: { id: commentId } });
    return { deleted: true };
  }
}
