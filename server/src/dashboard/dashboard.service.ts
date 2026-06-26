import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: JwtPayload) {
    const projectIds =
      user.role === UserRole.ADMIN
        ? (await this.prisma.project.findMany({ select: { id: true } })).map((p) => p.id)
        : (
            await this.prisma.projectMember.findMany({
              where: { userId: user.id },
              select: { projectId: true },
            })
          ).map((m) => m.projectId);

    const [openDefects, uatPendingSignOff, neverRunCases, myAssignedDefects] = await Promise.all([
      this.prisma.defect.count({
        where: { projectId: { in: projectIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.uatSession.count({
        where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' },
      }),
      this.prisma.testCase.count({
        where: { projectId: { in: projectIds }, lastExecutionStatus: null },
      }),
      this.prisma.defect.count({
        where: { assignedToId: user.id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
    ]);

    return { openDefects, uatPendingSignOff, neverRunCases, myAssignedDefects };
  }
}
