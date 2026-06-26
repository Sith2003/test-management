import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { ListRequirementsQuery } from './dto/list-requirements.query';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { buildPaginationMeta, CollectionResponse } from '../shared/types/api-response.types';
import { ProjectMemberRole, ResultStatus, DefectStatus } from '@prisma/client';
import { PAGINATION } from '../shared/constants/pagination.constants';

@Injectable()
export class RequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  private async generateReqId(projectId: string): Promise<string> {
    const count = await this.prisma.requirement.count({ where: { projectId } });
    return `REQ-${String(count + 1).padStart(3, '0')}`;
  }

  async findAll(
    projectId: string,
    user: JwtPayload,
    query: ListRequirementsQuery,
  ): Promise<CollectionResponse<unknown>> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { projectId };
    if (query.priority) where['priority'] = query.priority;
    if (query.search) {
      where['OR'] = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { reqId: { contains: query.search, mode: 'insensitive' } },
        { externalId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.requirement.count({ where }),
      this.prisma.requirement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { testCases: true } },
        },
      }),
    ]);

    return {
      data: items,
      pagination: buildPaginationMeta({ page, limit, total }),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async findOne(projectId: string, requirementId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const requirement = await this.prisma.requirement.findFirst({
      where: { id: requirementId, projectId },
      include: {
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                caseId: true,
                title: true,
                lastExecutionStatus: true,
              },
            },
          },
        },
      },
    });

    if (!requirement) throw new NotFoundException('Requirement not found');
    return requirement;
  }

  async create(projectId: string, dto: CreateRequirementDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const reqId = await this.generateReqId(projectId);

    return this.prisma.requirement.create({
      data: {
        projectId,
        reqId,
        ...dto,
      },
      include: {
        _count: { select: { testCases: true } },
      },
    });
  }

  async update(
    projectId: string,
    requirementId: string,
    dto: UpdateRequirementDto,
    user: JwtPayload,
  ) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const requirement = await this.prisma.requirement.findFirst({
      where: { id: requirementId, projectId },
    });
    if (!requirement) throw new NotFoundException('Requirement not found');

    return this.prisma.requirement.update({
      where: { id: requirementId },
      data: dto,
      include: {
        _count: { select: { testCases: true } },
      },
    });
  }

  async remove(projectId: string, requirementId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);

    const requirement = await this.prisma.requirement.findFirst({
      where: { id: requirementId, projectId },
    });
    if (!requirement) throw new NotFoundException('Requirement not found');

    await this.prisma.requirement.delete({ where: { id: requirementId } });
  }

  async linkTestCase(
    projectId: string,
    requirementId: string,
    testCaseId: string,
    user: JwtPayload,
  ) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const requirement = await this.prisma.requirement.findFirst({
      where: { id: requirementId, projectId },
    });
    if (!requirement) throw new NotFoundException('Requirement not found');

    const testCase = await this.prisma.testCase.findFirst({
      where: { id: testCaseId, projectId },
    });
    if (!testCase) throw new NotFoundException('Test case not found in this project');

    const existing = await this.prisma.requirementTestCase.findUnique({
      where: { requirementId_testCaseId: { requirementId, testCaseId } },
    });
    if (existing) {
      throw new ConflictException('Test case is already linked to this requirement');
    }

    return this.prisma.requirementTestCase.create({
      data: { requirementId, testCaseId },
      include: {
        testCase: { select: { id: true, caseId: true, title: true, lastExecutionStatus: true } },
      },
    });
  }

  async unlinkTestCase(
    projectId: string,
    requirementId: string,
    testCaseId: string,
    user: JwtPayload,
  ): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const requirement = await this.prisma.requirement.findFirst({
      where: { id: requirementId, projectId },
    });
    if (!requirement) throw new NotFoundException('Requirement not found');

    const link = await this.prisma.requirementTestCase.findUnique({
      where: { requirementId_testCaseId: { requirementId, testCaseId } },
    });
    if (!link) throw new NotFoundException('Link between requirement and test case not found');

    await this.prisma.requirementTestCase.delete({
      where: { requirementId_testCaseId: { requirementId, testCaseId } },
    });
  }

  async getTraceability(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const activeDefectStatuses = [
      DefectStatus.OPEN,
      DefectStatus.IN_PROGRESS,
      DefectStatus.RETEST,
      DefectStatus.REOPENED,
    ];

    const requirements = await this.prisma.requirement.findMany({
      where: { projectId },
      orderBy: { reqId: 'asc' },
      include: {
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                caseId: true,
                title: true,
                lastExecutionStatus: true,
                _count: { select: { defects: true } },
              },
            },
          },
        },
      },
    });

    // Collect all test case IDs across requirements to batch-fetch open defect counts
    const allTcIds = requirements.flatMap((r) =>
      r.testCases.map((link) => link.testCase.id),
    );

    const openDefectsByTc = new Map<string, number>();
    if (allTcIds.length > 0) {
      const defectCounts = await this.prisma.defect.groupBy({
        by: ['testCaseId'],
        where: {
          projectId,
          testCaseId: { in: allTcIds },
          status: { in: activeDefectStatuses },
        },
        _count: { id: true },
      });
      for (const d of defectCounts) {
        if (d.testCaseId) openDefectsByTc.set(d.testCaseId, d._count.id);
      }
    }

    const rows = requirements.map((req) => {
      const testCases = req.testCases.map((link) => ({
        id: link.testCase.id,
        caseId: link.testCase.caseId,
        title: link.testCase.title,
        lastExecutionStatus: link.testCase.lastExecutionStatus,
        openDefects: openDefectsByTc.get(link.testCase.id) ?? 0,
      }));

      const total = testCases.length;
      const pass = testCases.filter((tc) => tc.lastExecutionStatus === ResultStatus.PASS).length;
      const fail = testCases.filter((tc) => tc.lastExecutionStatus === ResultStatus.FAIL).length;
      const blocked = testCases.filter((tc) => tc.lastExecutionStatus === ResultStatus.BLOCKED).length;
      const untested = testCases.filter((tc) => !tc.lastExecutionStatus).length;
      const openDefects = testCases.reduce((sum, tc) => sum + tc.openDefects, 0);

      let rowStatus: 'GREEN' | 'YELLOW' | 'RED';
      if (total === 0) {
        rowStatus = 'RED'; // no test cases at all
      } else if (fail > 0 || blocked > 0 || openDefects > 0) {
        rowStatus = 'RED'; // has failures or open bugs
      } else if (untested > 0) {
        rowStatus = 'YELLOW'; // covered but some untested
      } else {
        rowStatus = 'GREEN'; // all passing, no open bugs
      }

      return {
        id: req.id,
        reqId: req.reqId,
        title: req.title,
        priority: req.priority,
        externalId: req.externalId,
        testCases,
        summary: { total, pass, fail, blocked, untested },
        openDefects,
        rowStatus,
      };
    });

    const totalReqs = rows.length;
    const green = rows.filter((r) => r.rowStatus === 'GREEN').length;
    const yellow = rows.filter((r) => r.rowStatus === 'YELLOW').length;
    const red = rows.filter((r) => r.rowStatus === 'RED').length;

    return { rows, stats: { total: totalReqs, green, yellow, red } };
  }

  async getCoverage(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const allRequirements = await this.prisma.requirement.findMany({
      where: { projectId },
      include: {
        testCases: {
          include: {
            testCase: { select: { lastExecutionStatus: true } },
          },
        },
      },
    });

    const total = allRequirements.length;
    let covered = 0;
    let passed = 0;

    for (const req of allRequirements) {
      const linkedTcs = req.testCases;
      if (linkedTcs.length > 0) {
        covered++;
        const hasPassed = linkedTcs.some(
          (link) => link.testCase.lastExecutionStatus === ResultStatus.PASS,
        );
        if (hasPassed) passed++;
      }
    }

    const coveredPercent = total > 0 ? Math.round((covered / total) * 100) : 0;
    const passedPercent = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, covered, coveredPercent, passedPercent };
  }

  async getDocuments(projectId: string, requirementId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    return this.prisma.requirementDocument.findMany({
      where: { requirementId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async uploadDocument(
    projectId: string,
    requirementId: string,
    file: Express.Multer.File,
    user: JwtPayload,
  ) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const req = await this.prisma.requirement.findFirst({
      where: { id: requirementId, projectId },
      select: { id: true },
    });
    if (!req) throw new NotFoundException('Requirement not found');

    // Save file to uploads/requirements/
    const uploadDir = path.join(process.cwd(), 'uploads', 'requirements');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${requirementId}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const url = `/uploads/requirements/${filename}`;

    return this.prisma.requirementDocument.create({
      data: {
        requirementId,
        name: file.originalname,
        url,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
  }

  async deleteDocument(
    projectId: string,
    requirementId: string,
    documentId: string,
    user: JwtPayload,
  ): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    const doc = await this.prisma.requirementDocument.findFirst({
      where: { id: documentId, requirementId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // Delete physical file
    const filePath = path.join(process.cwd(), doc.url);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch { /* ignore if already gone */ }
    }

    await this.prisma.requirementDocument.delete({ where: { id: documentId } });
  }
}
