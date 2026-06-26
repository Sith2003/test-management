import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { Prisma, ProjectMemberRole } from '@prisma/client';
import { PAGINATION } from '../shared/constants/pagination.constants';

export interface LogActivityInput {
  projectId: string;
  userId: string;
  action: string;
  entityType: 'TEST_CASE' | 'DEFECT' | 'TEST_RUN';
  entityId: string;
  entityName: string;
  diff?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async log(input: LogActivityInput): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        projectId: input.projectId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityName: input.entityName,
        ...(input.diff ? { diff: input.diff as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async findAll(
    projectId: string,
    user: JwtPayload,
    query: { page?: number; limit?: number; entityType?: string },
  ) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { projectId };
    if (query.entityType) where['entityType'] = query.entityType;

    const [total, items] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
