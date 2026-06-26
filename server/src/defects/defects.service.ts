import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { CreateDefectCommentDto } from './dto/create-defect-comment.dto';
import { ListDefectsQuery } from './dto/list-defects.query';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { buildPaginationMeta, CollectionResponse } from '../shared/types/api-response.types';
import { ProjectMemberRole, DefectStatus, NotificationType } from '@prisma/client';
import { PAGINATION } from '../shared/constants/pagination.constants';

const VALID_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  OPEN:        ['IN_PROGRESS', 'WONTFIX'],
  IN_PROGRESS: ['FIXED', 'OPEN', 'WONTFIX'],
  FIXED:       ['RETEST', 'IN_PROGRESS'],
  RETEST:      ['VERIFIED', 'REOPENED'],
  VERIFIED:    ['CLOSED'],
  REOPENED:    ['IN_PROGRESS', 'WONTFIX'],
  CLOSED:      [],
  WONTFIX:     [],
};

@Injectable()
export class DefectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly activityLog: ActivityLogService,
    private readonly notifications: NotificationsService,
  ) {}

  private async generateDefectId(projectId: string): Promise<string> {
    const count = await this.prisma.defect.count({ where: { projectId } });
    return `DEF-${String(count + 1).padStart(3, '0')}`;
  }

  async findAll(projectId: string, user: JwtPayload, query: ListDefectsQuery): Promise<CollectionResponse<unknown>> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER, { allowDeveloper: true });
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { projectId };
    if (query.status) where['status'] = query.status;
    if (query.severity) where['severity'] = query.severity;
    if (query.priority) where['priority'] = query.priority;
    if (query.assignedToId) where['assignedToId'] = query.assignedToId;
    if (query.testCaseId) where['testCaseId'] = query.testCaseId;
    if (query.search) {
      where['OR'] = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { defectId: { contains: query.search, mode: 'insensitive' } },
        { module: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.defect.count({ where }),
      this.prisma.defect.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          testCase: { select: { id: true, caseId: true, title: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      }),
    ]);
    return { data: items, pagination: buildPaginationMeta({ page, limit, total }), meta: { timestamp: new Date().toISOString() } };
  }

  async findOne(projectId: string, defectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER, { allowDeveloper: true });
    const defect = await this.prisma.defect.findFirst({
      where: { id: defectId, projectId },
      include: {
        testCase: { select: { id: true, caseId: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        relatedDefect: { select: { id: true, defectId: true, title: true } },
      },
    });
    if (!defect) throw new NotFoundException('Defect not found');
    return defect;
  }

  async create(projectId: string, dto: CreateDefectDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    if (dto.testCaseId) {
      const tc = await this.prisma.testCase.findFirst({ where: { id: dto.testCaseId, projectId } });
      if (!tc) throw new NotFoundException('Test case not found in this project');
    }
    const defectId = await this.generateDefectId(projectId);
    const created = await this.prisma.defect.create({
      data: { projectId, defectId, createdById: user.id, ...dto },
      include: {
        testCase: { select: { id: true, caseId: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    void this.activityLog.log({
      projectId,
      userId: user.id,
      action: 'CREATED',
      entityType: 'DEFECT',
      entityId: created.id,
      entityName: `${created.defectId}: ${created.title}`,
    });

    return created;
  }

  async update(projectId: string, defectId: string, dto: UpdateDefectDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA, { allowDeveloper: true });
    const defect = await this.prisma.defect.findFirst({ where: { id: defectId, projectId } });
    if (!defect) throw new NotFoundException('Defect not found');

    const extraData: Record<string, unknown> = {};

    if (dto.status && dto.status !== defect.status) {
      const allowed = VALID_TRANSITIONS[defect.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(`Cannot transition from ${defect.status} to ${dto.status}`);
      }
      if (dto.status === DefectStatus.FIXED) {
        extraData['fixedAt'] = new Date();
      }
      if (dto.status === DefectStatus.VERIFIED) {
        extraData['verifiedAt'] = new Date();
        extraData['verifiedById'] = user.id;
      }
      if (dto.status === DefectStatus.REOPENED) {
        extraData['retestCount'] = { increment: 1 };
        extraData['fixedAt'] = null;
        extraData['verifiedAt'] = null;
        extraData['verifiedById'] = null;
      }
    }

    const updated = await this.prisma.defect.update({
      where: { id: defectId },
      data: { ...dto, ...extraData },
      include: {
        testCase: { select: { id: true, caseId: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });

    const action = dto.status && dto.status !== defect.status ? 'STATUS_CHANGED' : 'UPDATED';
    void this.activityLog.log({
      projectId,
      userId: user.id,
      action,
      entityType: 'DEFECT',
      entityId: updated.id,
      entityName: `${updated.defectId}: ${updated.title}`,
      ...(action === 'STATUS_CHANGED' && { diff: { from: defect.status, to: dto.status } }),
    });

    // Notify new assignee when defect is assigned
    if (dto.assignedToId && dto.assignedToId !== defect.assignedToId && dto.assignedToId !== user.id) {
      const assignee = await this.prisma.user.findUnique({ where: { id: dto.assignedToId }, select: { email: true } });
      if (assignee) {
        void this.notifications.create({
          userId: dto.assignedToId,
          userEmail: assignee.email,
          type: NotificationType.DEFECT_ASSIGNED,
          title: 'Defect Assigned to You',
          message: `${user.name ?? 'Someone'} assigned defect "${updated.title}" to you.`,
          link: `/projects/${projectId}/defects/${defect.id}`,
        });
      }
    }

    // Notify creator on status change to terminal states
    if (dto.status && ([DefectStatus.VERIFIED, DefectStatus.CLOSED] as DefectStatus[]).includes(dto.status) && defect.createdById !== user.id) {
      const creator = await this.prisma.user.findUnique({ where: { id: defect.createdById }, select: { email: true } });
      if (creator) {
        void this.notifications.create({
          userId: defect.createdById,
          userEmail: creator.email,
          type: NotificationType.DEFECT_STATUS_CHANGED,
          title: `Defect ${dto.status.charAt(0) + dto.status.slice(1).toLowerCase()}`,
          message: `Defect "${updated.title}" has been marked as ${dto.status.toLowerCase()}.`,
          link: `/projects/${projectId}/defects/${defect.id}`,
        });
      }
    }

    return updated;
  }

  async remove(projectId: string, defectId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const defect = await this.prisma.defect.findFirst({ where: { id: defectId, projectId } });
    if (!defect) throw new NotFoundException('Defect not found');

    void this.activityLog.log({
      projectId,
      userId: user.id,
      action: 'DELETED',
      entityType: 'DEFECT',
      entityId: defect.id,
      entityName: `${defect.defectId}: ${defect.title}`,
    });

    await this.prisma.defect.delete({ where: { id: defectId } });
  }

  async listComments(projectId: string, defectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER, { allowDeveloper: true });
    const defect = await this.prisma.defect.findFirst({ where: { id: defectId, projectId } });
    if (!defect) throw new NotFoundException('Defect not found');
    const comments = await this.prisma.defectComment.findMany({
      where: { defectId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    return { data: comments };
  }

  async addComment(projectId: string, defectId: string, dto: CreateDefectCommentDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER, { allowDeveloper: true });
    const defect = await this.prisma.defect.findFirst({ where: { id: defectId, projectId } });
    if (!defect) throw new NotFoundException('Defect not found');
    const comment = await this.prisma.defectComment.create({
      data: { defectId, authorId: user.id, content: dto.content },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify defect creator/assignee (not the commenter)
    const defectFull = await this.prisma.defect.findFirst({
      where: { id: defectId },
      include: {
        createdBy: { select: { id: true, email: true } },
        assignedTo: { select: { id: true, email: true } },
      },
    });
    if (defectFull) {
      const notifyIds = new Set<string>();
      if (defectFull.createdById !== user.id) notifyIds.add(defectFull.createdById);
      if (defectFull.assignedToId && defectFull.assignedToId !== user.id) notifyIds.add(defectFull.assignedToId);
      for (const recipientId of notifyIds) {
        const recipientEmail = recipientId === defectFull.createdById
          ? defectFull.createdBy.email
          : defectFull.assignedTo!.email;
        void this.notifications.create({
          userId: recipientId,
          userEmail: recipientEmail,
          type: NotificationType.COMMENT_ADDED,
          title: 'New Comment on Defect',
          message: `${user.name ?? 'Someone'} commented on "${defectFull.title}".`,
          link: `/projects/${projectId}/defects/${defectFull.id}`,
        });
      }
    }

    return comment;
  }

  async deleteComment(projectId: string, defectId: string, commentId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER, { allowDeveloper: true });
    const defect = await this.prisma.defect.findFirst({ where: { id: defectId, projectId } });
    if (!defect) throw new NotFoundException('Defect not found');
    const comment = await this.prisma.defectComment.findFirst({ where: { id: commentId, defectId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const isAuthor = comment.authorId === user.id;
    let isManagerPlus = false;
    try {
      await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
      isManagerPlus = true;
    } catch {
      // not a manager
    }

    if (!isAuthor && !isManagerPlus) {
      throw new ForbiddenException('Only the comment author or a project manager can delete this comment');
    }

    await this.prisma.defectComment.delete({ where: { id: commentId } });
  }
}
