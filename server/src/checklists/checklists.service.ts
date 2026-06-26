import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistEntryDto } from './dto/update-checklist-entry.dto';
import { JwtPayload } from '../shared/decorators/current-user.decorator';
import { ProjectMemberRole, ChecklistEntryStatus } from '@prisma/client';

const DEFAULT_ITEMS = [
  'Verify test environments are accessible (DEV / SIT / UAT)',
  'Check deployment status — confirm latest build is deployed',
  'Review overnight automated test results',
  'Verify test data is clean and ready',
  'Check all QA tools are functional',
  'Review any open blockers from the previous day',
  'Confirm assigned test cases for today',
];

@Injectable()
export class ChecklistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getItems(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    let items = await this.prisma.checklistItem.findMany({
      where: { projectId, isActive: true },
      orderBy: { order: 'asc' },
    });
    // seed defaults if none exist
    if (items.length === 0) {
      await this.prisma.checklistItem.createMany({
        data: DEFAULT_ITEMS.map((title, i) => ({ projectId, title, order: i })),
      });
      items = await this.prisma.checklistItem.findMany({ where: { projectId, isActive: true }, orderBy: { order: 'asc' } });
    }
    return items;
  }

  async createItem(projectId: string, dto: CreateChecklistItemDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const count = await this.prisma.checklistItem.count({ where: { projectId } });
    return this.prisma.checklistItem.create({
      data: { projectId, title: dto.title, order: dto.order ?? count },
    });
  }

  async updateItem(projectId: string, itemId: string, dto: CreateChecklistItemDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const item = await this.prisma.checklistItem.findFirst({ where: { id: itemId, projectId } });
    if (!item) throw new NotFoundException('Checklist item not found');
    return this.prisma.checklistItem.update({ where: { id: itemId }, data: dto });
  }

  async deleteItem(projectId: string, itemId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const item = await this.prisma.checklistItem.findFirst({ where: { id: itemId, projectId } });
    if (!item) throw new NotFoundException('Checklist item not found');
    await this.prisma.checklistItem.update({ where: { id: itemId }, data: { isActive: false } });
  }

  async getSessions(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    return this.prisma.checklistSession.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
      take: 30,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { entries: true } },
      },
    });
  }

  async getTodaySession(projectId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let session = await this.prisma.checklistSession.findUnique({
      where: { projectId_date: { projectId, date: today } },
      include: {
        entries: {
          include: { item: true, completedBy: { select: { id: true, name: true } } },
          orderBy: { item: { order: 'asc' } },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!session) {
      session = await this._createSession(projectId, today, user);
    }
    return session;
  }

  async getSessionById(projectId: string, sessionId: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const session = await this.prisma.checklistSession.findFirst({
      where: { id: sessionId, projectId },
      include: {
        entries: {
          include: { item: true, completedBy: { select: { id: true, name: true } } },
          orderBy: { item: { order: 'asc' } },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!session) throw new NotFoundException('Checklist session not found');
    return session;
  }

  async createSessionForDate(projectId: string, dateStr: string, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const existing = await this.prisma.checklistSession.findUnique({
      where: { projectId_date: { projectId, date } },
    });
    if (existing) throw new ConflictException('A checklist session already exists for this date');
    return this._createSession(projectId, date, user);
  }

  async deleteSession(projectId: string, sessionId: string, user: JwtPayload): Promise<void> {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const session = await this.prisma.checklistSession.findFirst({ where: { id: sessionId, projectId } });
    if (!session) throw new NotFoundException('Checklist session not found');
    if (session.createdById !== user.id) {
      await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.MANAGER);
    }
    await this.prisma.checklistSession.delete({ where: { id: sessionId } });
  }

  private async _createSession(projectId: string, date: Date, user: JwtPayload) {
    const items = await this.prisma.checklistItem.findMany({ where: { projectId, isActive: true }, orderBy: { order: 'asc' } });
    if (items.length === 0) await this.getItems(projectId, user);
    const freshItems = await this.prisma.checklistItem.findMany({ where: { projectId, isActive: true }, orderBy: { order: 'asc' } });
    return this.prisma.checklistSession.create({
      data: {
        projectId,
        date,
        createdById: user.id,
        entries: {
          create: freshItems.map((item) => ({ itemId: item.id, status: ChecklistEntryStatus.PENDING })),
        },
      },
      include: {
        entries: {
          include: { item: true, completedBy: { select: { id: true, name: true } } },
          orderBy: { item: { order: 'asc' } },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateEntry(projectId: string, sessionId: string, entryId: string, dto: UpdateChecklistEntryDto, user: JwtPayload) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.QA);
    const session = await this.prisma.checklistSession.findFirst({ where: { id: sessionId, projectId } });
    if (!session) throw new NotFoundException('Checklist session not found');
    const entry = await this.prisma.checklistEntry.findFirst({ where: { id: entryId, sessionId } });
    if (!entry) throw new NotFoundException('Checklist entry not found');
    return this.prisma.checklistEntry.update({
      where: { id: entryId },
      data: {
        status: dto.status,
        notes: dto.notes,
        completedById: user.id,
        completedAt: new Date(),
      },
      include: { item: true, completedBy: { select: { id: true, name: true } } },
    });
  }
}
