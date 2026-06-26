import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateAdhocDto } from './dto/create-adhoc.dto';
import { UpdateAdhocDto } from './dto/update-adhoc.dto';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { buildPaginationMeta, CollectionResponse } from '../shared/types/api-response.types';
import { ProjectMemberRole, AdhocStatus, Priority, Severity } from '@prisma/client';
import { PAGINATION } from '../shared/constants/pagination.constants';

@Injectable()
export class AdhocService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  private async generateAdhocId(projectId: string): Promise<string> {
    const count = await this.prisma.adhocCase.count({ where: { projectId } });
    return `ADHOC-${String(count + 1).padStart(3, '0')}`;
  }

  async findAll(projectId: string, user: JwtPayload, page = 1, limit = 20): Promise<CollectionResponse<unknown>> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.adhocCase.count({ where: { projectId } }),
      this.prisma.adhocCase.findMany({
        where: { projectId }, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedQa: { select: { id: true, name: true } },
          relatedTc: { select: { id: true, caseId: true, title: true } },
        },
      }),
    ]);
    return { data: items, pagination: buildPaginationMeta({ page, limit, total }), meta: { timestamp: new Date().toISOString() } };
  }

  async findOne(projectId: string, adhocId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const adhoc = await this.prisma.adhocCase.findFirst({
      where: { id: adhocId, projectId },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedQa: { select: { id: true, name: true } },
        relatedTc: { select: { id: true, caseId: true, title: true } },
        convertedTc: { select: { id: true, caseId: true, title: true } },
      },
    });
    if (!adhoc) throw new NotFoundException('Ad-hoc case not found');
    return adhoc;
  }

  async create(projectId: string, dto: CreateAdhocDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const adhocId = await this.generateAdhocId(projectId);
    const { requestDate: rawDate, ...restDto } = dto;
    const requestDate = rawDate ? new Date(rawDate) : new Date();
    return this.prisma.adhocCase.create({
      data: { projectId, adhocId, createdById: user.id, requestDate, ...restDto },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async update(projectId: string, adhocId: string, dto: UpdateAdhocDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const adhoc = await this.prisma.adhocCase.findFirst({ where: { id: adhocId, projectId } });
    if (!adhoc) throw new NotFoundException('Ad-hoc case not found');
    const data: Record<string, unknown> = { ...dto };
    if (dto.completionDate) data['completionDate'] = new Date(dto.completionDate);
    return this.prisma.adhocCase.update({
      where: { id: adhocId },
      data,
      include: { createdBy: { select: { id: true, name: true } }, assignedQa: { select: { id: true, name: true } } },
    });
  }

  async convertToTc(projectId: string, adhocId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const adhoc = await this.prisma.adhocCase.findFirst({ where: { id: adhocId, projectId } });
    if (!adhoc) throw new NotFoundException('Ad-hoc case not found');
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { key: true } });
    const count = await this.prisma.testCase.count({ where: { projectId } });
    const caseId = `${project?.key ?? 'TC'}-${String(count + 1).padStart(3, '0')}`;
    const tc = await this.prisma.testCase.create({
      data: {
        projectId, caseId,
        title: adhoc.issueDescription.substring(0, 200),
        description: adhoc.findings ?? adhoc.issueDescription,
        testData: adhoc.testDataUsed,
        notesFindings: adhoc.notes,
        requirementId: adhoc.relatedTcId,
        createdById: user.id,
      },
    });
    await this.prisma.adhocCase.update({
      where: { id: adhocId },
      data: { convertedToTc: true, convertedTcId: tc.id, status: AdhocStatus.RESOLVED },
    });
    return tc;
  }

  async remove(projectId: string, adhocId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    const adhoc = await this.prisma.adhocCase.findFirst({ where: { id: adhocId, projectId } });
    if (!adhoc) throw new NotFoundException('Ad-hoc case not found');
    await this.prisma.adhocCase.delete({ where: { id: adhocId } });
  }

  async convertToDefect(projectId: string, adhocId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const adhoc = await this.prisma.adhocCase.findFirst({ where: { id: adhocId, projectId } });
    if (!adhoc) throw new NotFoundException('Ad-hoc case not found');

    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { key: true } });
    const count = await this.prisma.defect.count({ where: { projectId } });
    const defectId = `DEF-${String(count + 1).padStart(3, '0')}`;

    const defect = await this.prisma.defect.create({
      data: {
        projectId,
        defectId,
        createdById: user.id,
        title: adhoc.issueDescription.substring(0, 200),
        description: adhoc.findings ?? adhoc.issueDescription,
        stepsToReproduce: adhoc.testStepsPerformed ?? undefined,
        severity: adhoc.severity ?? Severity.MEDIUM,
        priority: Priority.MEDIUM,
        module: adhoc.module ?? undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (adhoc.status !== AdhocStatus.RESOLVED) {
      await this.prisma.adhocCase.update({
        where: { id: adhocId },
        data: { status: AdhocStatus.RESOLVED },
      });
    }

    return defect;
  }
}
