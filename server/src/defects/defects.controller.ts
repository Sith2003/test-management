import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DefectsService } from './defects.service';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { CreateDefectCommentDto } from './dto/create-defect-comment.dto';
import { ListDefectsQuery } from './dto/list-defects.query';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Defects')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/defects', version: '1' })
export class DefectsController {
  constructor(private readonly defectsService: DefectsService) {}

  @Get()
  @ApiOperation({ summary: 'List defects' })
  @ApiParam({ name: 'projectId' })
  findAll(@Param('projectId') projectId: string, @Query() query: ListDefectsQuery, @CurrentUser() user: JwtPayload) {
    return this.defectsService.findAll(projectId, user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create defect' })
  @ApiParam({ name: 'projectId' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateDefectDto, @CurrentUser() user: JwtPayload) {
    return this.defectsService.create(projectId, dto, user);
  }

  @Get(':defectId')
  @ApiOperation({ summary: 'Get defect detail' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'defectId' })
  findOne(@Param('projectId') projectId: string, @Param('defectId') defectId: string, @CurrentUser() user: JwtPayload) {
    return this.defectsService.findOne(projectId, defectId, user);
  }

  @Patch(':defectId')
  @ApiOperation({ summary: 'Update defect' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'defectId' })
  update(@Param('projectId') projectId: string, @Param('defectId') defectId: string, @Body() dto: UpdateDefectDto, @CurrentUser() user: JwtPayload) {
    return this.defectsService.update(projectId, defectId, dto, user);
  }

  @Delete(':defectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete defect' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'defectId' })
  remove(@Param('projectId') projectId: string, @Param('defectId') defectId: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.defectsService.remove(projectId, defectId, user);
  }

  @Get(':defectId/comments')
  @ApiOperation({ summary: 'List comments on a defect' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'defectId' })
  listComments(@Param('projectId') projectId: string, @Param('defectId') defectId: string, @CurrentUser() user: JwtPayload) {
    return this.defectsService.listComments(projectId, defectId, user);
  }

  @Post(':defectId/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment to a defect' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'defectId' })
  addComment(
    @Param('projectId') projectId: string,
    @Param('defectId') defectId: string,
    @Body() dto: CreateDefectCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.defectsService.addComment(projectId, defectId, dto, user);
  }

  @Delete(':defectId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment from a defect' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'defectId' }) @ApiParam({ name: 'commentId' })
  deleteComment(
    @Param('projectId') projectId: string,
    @Param('defectId') defectId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.defectsService.deleteComment(projectId, defectId, commentId, user);
  }
}
