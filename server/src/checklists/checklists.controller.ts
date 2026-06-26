import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistEntryDto } from './dto/update-checklist-entry.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Checklists')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/checklist', version: '1' })
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get('items')
  @ApiOperation({ summary: 'Get checklist template items' })
  @ApiParam({ name: 'projectId' })
  getItems(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.checklistsService.getItems(projectId, user);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create checklist item' })
  @ApiParam({ name: 'projectId' })
  createItem(@Param('projectId') projectId: string, @Body() dto: CreateChecklistItemDto, @CurrentUser() user: JwtPayload) {
    return this.checklistsService.createItem(projectId, dto, user);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update checklist item' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'itemId' })
  updateItem(@Param('projectId') projectId: string, @Param('itemId') itemId: string, @Body() dto: CreateChecklistItemDto, @CurrentUser() user: JwtPayload) {
    return this.checklistsService.updateItem(projectId, itemId, dto, user);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete checklist item' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'itemId' })
  deleteItem(@Param('projectId') projectId: string, @Param('itemId') itemId: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.checklistsService.deleteItem(projectId, itemId, user);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List checklist sessions history' })
  @ApiParam({ name: 'projectId' })
  getSessions(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.checklistsService.getSessions(projectId, user);
  }

  @Get('sessions/today')
  @ApiOperation({ summary: 'Get or create today\'s checklist session' })
  @ApiParam({ name: 'projectId' })
  getTodaySession(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.checklistsService.getTodaySession(projectId, user);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a checklist session for a specific date' })
  @ApiParam({ name: 'projectId' })
  createSession(
    @Param('projectId') projectId: string,
    @Body('date') date: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.checklistsService.createSessionForDate(projectId, date, user);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get a specific checklist session with entries' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' })
  getSession(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.checklistsService.getSessionById(projectId, sessionId, user);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a checklist session' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' })
  deleteSession(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.checklistsService.deleteSession(projectId, sessionId, user);
  }

  @Patch('sessions/:sessionId/entries/:entryId')
  @ApiOperation({ summary: 'Update checklist entry status' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' }) @ApiParam({ name: 'entryId' })
  updateEntry(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateChecklistEntryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.checklistsService.updateEntry(projectId, sessionId, entryId, dto, user);
  }
}
