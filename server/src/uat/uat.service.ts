import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateUatSessionDto } from './dto/create-uat-session.dto';
import { AddUatCasesDto } from './dto/add-uat-cases.dto';
import { UpdateUatResultDto } from './dto/update-uat-result.dto';
import { SignOffUatDto, SignOffDecision } from './dto/sign-off-uat.dto';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { ProjectMemberRole, UatSessionStatus, UatResultStatus } from '@prisma/client';
import { buildPaginationMeta, CollectionResponse } from '../shared/types/api-response.types';
import { PAGINATION } from '../shared/constants/pagination.constants';

const SESSION_INCLUDE = {
  createdBy: { select: { id: true, name: true } },
  signOffBy: { select: { id: true, name: true } },
  _count: { select: { results: true } },
};

@Injectable()
export class UatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  private async generateSessionId(projectId: string): Promise<string> {
    const count = await this.prisma.uatSession.count({ where: { projectId } });
    return `UAT-${String(count + 1).padStart(3, '0')}`;
  }

  async findAll(projectId: string, user: JwtPayload): Promise<CollectionResponse<unknown>> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const items = await this.prisma.uatSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: SESSION_INCLUDE,
    });
    return { data: items, pagination: buildPaginationMeta({ page: 1, limit: items.length, total: items.length }), meta: { timestamp: new Date().toISOString() } };
  }

  async findOne(projectId: string, sessionId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const session = await this.prisma.uatSession.findFirst({
      where: { id: sessionId, projectId },
      include: {
        ...SESSION_INCLUDE,
        results: {
          include: {
            testCase: { include: { steps: { orderBy: { order: 'asc' } } } },
            tester: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('UAT session not found');
    return session;
  }

  async create(projectId: string, dto: CreateUatSessionDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const sessionId = await this.generateSessionId(projectId);
    return this.prisma.uatSession.create({
      data: {
        projectId, sessionId, createdById: user.id,
        name: dto.name, version: dto.version,
        environmentUrl: dto.environmentUrl,
        uatStartDate: dto.uatStartDate ? new Date(dto.uatStartDate) : undefined,
        uatEndDate: dto.uatEndDate ? new Date(dto.uatEndDate) : undefined,
        supportContact: dto.supportContact,
      },
      include: SESSION_INCLUDE,
    });
  }

  async update(projectId: string, sessionId: string, dto: CreateUatSessionDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const session = await this.prisma.uatSession.findFirst({ where: { id: sessionId, projectId } });
    if (!session) throw new NotFoundException('UAT session not found');
    return this.prisma.uatSession.update({
      where: { id: sessionId },
      data: {
        name: dto.name, version: dto.version, environmentUrl: dto.environmentUrl,
        uatStartDate: dto.uatStartDate ? new Date(dto.uatStartDate) : undefined,
        uatEndDate: dto.uatEndDate ? new Date(dto.uatEndDate) : undefined,
        supportContact: dto.supportContact,
      },
      include: SESSION_INCLUDE,
    });
  }

  async addCases(projectId: string, sessionId: string, dto: AddUatCasesDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const session = await this.prisma.uatSession.findFirst({ where: { id: sessionId, projectId } });
    if (!session) throw new NotFoundException('UAT session not found');
    const existing = await this.prisma.uatResult.findMany({ where: { sessionId }, select: { testCaseId: true } });
    const existingIds = new Set(existing.map((r) => r.testCaseId));
    const newIds = dto.testCaseIds.filter((id) => !existingIds.has(id));
    if (newIds.length > 0) {
      await this.prisma.uatResult.createMany({
        data: newIds.map((testCaseId) => ({ sessionId, testCaseId, status: UatResultStatus.PENDING })),
      });
      if (session.status === UatSessionStatus.PLANNED) {
        await this.prisma.uatSession.update({ where: { id: sessionId }, data: { status: UatSessionStatus.IN_PROGRESS } });
      }
    }
    return this.findOne(projectId, sessionId, user);
  }

  async removeCase(projectId: string, sessionId: string, testCaseId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    await this.prisma.uatResult.deleteMany({ where: { sessionId, testCaseId } });
  }

  async updateResult(projectId: string, sessionId: string, resultId: string, dto: UpdateUatResultDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const session = await this.prisma.uatSession.findFirst({ where: { id: sessionId, projectId } });
    if (!session) throw new NotFoundException('UAT session not found');
    const result = await this.prisma.uatResult.findFirst({ where: { id: resultId, sessionId } });
    if (!result) throw new NotFoundException('UAT result not found');
    return this.prisma.uatResult.update({
      where: { id: resultId },
      data: { ...dto, testerId: user.id, executedAt: new Date() },
      include: { testCase: { select: { id: true, caseId: true, title: true } }, tester: { select: { id: true, name: true } } },
    });
  }

  async signOff(projectId: string, sessionId: string, dto: SignOffUatDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const session = await this.prisma.uatSession.findFirst({ where: { id: sessionId, projectId } });
    if (!session) throw new NotFoundException('UAT session not found');
    const newStatus = dto.decision === SignOffDecision.ACCEPTED ? UatSessionStatus.SIGNED_OFF : UatSessionStatus.REJECTED;
    return this.prisma.uatSession.update({
      where: { id: sessionId },
      data: { status: newStatus, signOffById: user.id, signOffNote: dto.note, signedOffAt: new Date() },
      include: SESSION_INCLUDE,
    });
  }

  async remove(projectId: string, sessionId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const session = await this.prisma.uatSession.findFirst({ where: { id: sessionId, projectId } });
    if (!session) throw new NotFoundException('UAT session not found');
    await this.prisma.uatSession.delete({ where: { id: sessionId } });
  }
}
