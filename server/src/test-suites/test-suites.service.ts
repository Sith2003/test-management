import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import { UpdateSuiteDto } from './dto/update-suite.dto';
import { ReorderSuitesDto } from './dto/reorder-suites.dto';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { ProjectMemberRole } from '@prisma/client';

export type SuiteWithChildren = {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  children?: SuiteWithChildren[];
  _count?: { testCases: number };
};

function enrichCount(suite: SuiteWithChildren): number {
  const own = suite._count?.testCases ?? 0;
  const childTotal = (suite.children ?? []).reduce((acc, child) => acc + enrichCount(child), 0);
  const total = own + childTotal;
  suite._count = { testCases: total };
  return total;
}

function buildTree(suites: SuiteWithChildren[]): SuiteWithChildren[] {
  const map = new Map<string, SuiteWithChildren>();
  const roots: SuiteWithChildren[] = [];

  for (const suite of suites) {
    map.set(suite.id, { ...suite, children: [] });
  }

  for (const suite of suites) {
    const node = map.get(suite.id)!;
    if (suite.parentId && map.has(suite.parentId)) {
      const parent = map.get(suite.parentId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.forEach(enrichCount);

  return roots;
}

@Injectable()
export class TestSuitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async findAll(projectId: string, user: JwtPayload): Promise<SuiteWithChildren[]> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const suites = await this.prisma.testSuite.findMany({
      where: { projectId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { testCases: true } },
      },
    });

    return buildTree(suites as SuiteWithChildren[]);
  }

  async create(projectId: string, dto: CreateSuiteDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);

    if (dto.parentId) {
      const parent = await this.prisma.testSuite.findFirst({
        where: { id: dto.parentId, projectId },
      });
      if (!parent) {
        throw new NotFoundException('Parent suite not found in this project');
      }
    }

    return this.prisma.testSuite.create({
      data: {
        projectId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        description: dto.description,
        order: dto.order ?? 0,
      },
      include: {
        _count: { select: { testCases: true } },
      },
    });
  }

  async update(projectId: string, suiteId: string, dto: UpdateSuiteDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);

    const suite = await this.prisma.testSuite.findFirst({ where: { id: suiteId, projectId } });
    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === suiteId) {
        throw new NotFoundException('A suite cannot be its own parent');
      }
      if (dto.parentId !== null) {
        const parent = await this.prisma.testSuite.findFirst({
          where: { id: dto.parentId, projectId },
        });
        if (!parent) {
          throw new NotFoundException('Parent suite not found in this project');
        }
      }
    }

    return this.prisma.testSuite.update({
      where: { id: suiteId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
      include: {
        _count: { select: { testCases: true } },
      },
    });
  }

  async remove(projectId: string, suiteId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);

    const suite = await this.prisma.testSuite.findFirst({ where: { id: suiteId, projectId } });
    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }

    await this.prisma.testSuite.delete({ where: { id: suiteId } });
  }

  async reorder(projectId: string, dto: ReorderSuitesDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    await this.prisma.$transaction(
      dto.orders.map(item =>
        this.prisma.testSuite.update({
          where: { id: item.suiteId },
          data: { order: item.order },
        })
      )
    );
    return { updated: dto.orders.length };
  }
}
