import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ListProjectsQuery } from './dto/list-projects.query';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { buildPaginationMeta, CollectionResponse } from '../shared/types/api-response.types';
import { ProjectMemberRole, UserRole } from '@prisma/client';
import { PAGINATION } from '../shared/constants/pagination.constants';

type ProjectWithCounts = {
  id: string;
  name: string;
  description: string | null;
  key: string;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { members: number; testCases: number; testRuns: number };
};

type MemberWithUser = {
  id: string;
  role: ProjectMemberRole;
  createdAt: Date;
  user: { id: string; email: string; name: string; role: string };
};

const ROLE_HIERARCHY: Record<ProjectMemberRole, number> = {
  [ProjectMemberRole.VIEWER]: 0,
  [ProjectMemberRole.QA]: 1,
  [ProjectMemberRole.MANAGER]: 2,
  [ProjectMemberRole.ADMIN]: 3,
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: JwtPayload,
    query: ListProjectsQuery,
  ): Promise<CollectionResponse<ProjectWithCounts>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const whereBase = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { key: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Admins and Testers see all projects, others see only their member projects
    const where =
      user.role === UserRole.ADMIN || user.role === UserRole.QA
        ? whereBase
        : {
            ...whereBase,
            members: { some: { userId: user.id } },
          };

    const [total, items] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { members: true, testCases: true, testRuns: true } },
        },
      }),
    ]);

    return {
      data: items as ProjectWithCounts[],
      pagination: buildPaginationMeta({ page, limit, total }),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async findOne(id: string, user: JwtPayload): Promise<ProjectWithCounts> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, testCases: true, testRuns: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.checkProjectAccess(id, user, ProjectMemberRole.VIEWER, { allowDeveloper: true });
    return project as ProjectWithCounts;
  }

  async create(dto: CreateProjectDto, user: JwtPayload) {
    if (user.role === UserRole.QA || user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Insufficient permissions to create projects');
    }

    const existing = await this.prisma.project.findUnique({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Project with key '${dto.key}' already exists`);
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        key: dto.key,
        logoUrl: dto.logoUrl,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: ProjectMemberRole.ADMIN },
        },
      },
      include: {
        _count: { select: { members: true, testCases: true, testRuns: true } },
      },
    });

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, user: JwtPayload) {
    if (user.role === UserRole.QA || user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Insufficient permissions to update projects');
    }

    await this.checkProjectAccess(id, user, ProjectMemberRole.MANAGER);

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
      include: {
        _count: { select: { members: true, testCases: true, testRuns: true } },
      },
    });

    return project;
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    if (user.role === UserRole.QA || user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Insufficient permissions to delete projects');
    }

    await this.checkProjectAccess(id, user, ProjectMemberRole.ADMIN);
    await this.prisma.project.delete({ where: { id } });
  }

  async getMembers(projectId: string, user: JwtPayload): Promise<MemberWithUser[]> {
    await this.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members as MemberWithUser[];
  }

  async addMember(projectId: string, dto: AddMemberDto, user: JwtPayload): Promise<MemberWithUser> {
    await this.checkProjectAccess(projectId, user, ProjectMemberRole.ADMIN);

    const targetUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!targetUser) {
      throw new NotFoundException(`User with email '${dto.email}' not found`);
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUser.id } },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: dto.role ?? ProjectMemberRole.QA,
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    return member as MemberWithUser;
  }

  async removeMember(projectId: string, userId: string, user: JwtPayload): Promise<void> {
    await this.checkProjectAccess(projectId, user, ProjectMemberRole.ADMIN);

    if (userId === user.id) {
      throw new BadRequestException('Cannot remove yourself from the project');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this project');
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async updateMember(projectId: string, targetUserId: string, dto: { role: ProjectMemberRole }, user: JwtPayload): Promise<MemberWithUser> {
    await this.checkProjectAccess(projectId, user, ProjectMemberRole.ADMIN);

    if (targetUserId === user.id) {
      throw new BadRequestException('Cannot change your own role');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this project');
    }

    const updated = await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    return updated as MemberWithUser;
  }

  async checkProjectAccess(
    projectId: string,
    user: JwtPayload,
    requiredRole: ProjectMemberRole,
    options?: { allowDeveloper?: boolean },
  ): Promise<void> {
    // Global admin has full access
    if (user.role === UserRole.ADMIN) return;

    // Global testers can read (VIEWER-level) any project without being a member
    if (user.role === UserRole.QA && requiredRole === ProjectMemberRole.VIEWER) return;

    // Developers are blocked unless the caller explicitly allows them (defects + project reads only)
    if (user.role === UserRole.DEVELOPER && !options?.allowDeveloper) {
      throw new ForbiddenException('Developers can only access the Defect Log');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const userRoleLevel = ROLE_HIERARCHY[member.role] ?? -1;
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenException(
        `Insufficient project permissions. Required: ${requiredRole}, your role: ${member.role}`,
      );
    }
  }
}
