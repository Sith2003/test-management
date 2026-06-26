import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { BulkCreateTestCasesDto } from './dto/bulk-create.dto';
import { BulkUpdateTestCasesDto } from './dto/bulk-update.dto';
import { ListTestCasesQuery } from './dto/list-test-cases.query';
import { ReviewTestCaseDto } from './dto/review-test-case.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Test Cases')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/cases', version: '1' })
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  @Get()
  @ApiOperation({ summary: 'List test cases with filters and pagination' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Test cases retrieved successfully' })
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: ListTestCasesQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.findAll(projectId, user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new test case' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Test case created successfully' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.create(projectId, dto, user);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create test cases (max 100)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Test cases created successfully' })
  bulkCreate(
    @Param('projectId') projectId: string,
    @Body() dto: BulkCreateTestCasesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.bulkCreate(projectId, dto, user);
  }

  @Patch('bulk')
  @ApiOperation({ summary: 'Bulk update test cases (move, set status, or delete)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Bulk operation applied successfully' })
  bulkUpdate(
    @Param('projectId') projectId: string,
    @Body() dto: BulkUpdateTestCasesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.bulkUpdate(projectId, dto, user);
  }

  @Get('scenarios')
  @ApiOperation({ summary: 'Get distinct scenario names for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  getScenarios(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.findScenarios(projectId, user);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all distinct tags used in a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  getTags(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.getAvailableTags(projectId, user);
  }

  @Get(':caseId/comments')
  @ApiOperation({ summary: 'List comments on a test case' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'caseId' })
  getComments(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.getComments(projectId, caseId, user);
  }

  @Post(':caseId/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment to a test case' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'caseId' })
  addComment(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Body('content') content: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.addComment(projectId, caseId, content, user);
  }

  @Delete(':caseId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment from a test case' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'caseId' }) @ApiParam({ name: 'commentId' })
  deleteComment(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.testCasesService.deleteComment(projectId, caseId, commentId, user) as unknown as Promise<void>;
  }

  @Get(':caseId')
  @ApiOperation({ summary: 'Get a test case with steps' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'caseId', description: 'Test case UUID' })
  @ApiResponse({ status: 200, description: 'Test case retrieved successfully' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.findOne(projectId, caseId, user);
  }

  @Patch(':caseId')
  @ApiOperation({ summary: 'Update a test case' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'caseId', description: 'Test case UUID' })
  @ApiResponse({ status: 200, description: 'Test case updated successfully' })
  update(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Body() dto: UpdateTestCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.update(projectId, caseId, dto, user);
  }

  @Patch(':caseId/review')
  @ApiOperation({ summary: 'Update review status (submit, approve, reject)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'caseId', description: 'Test case UUID' })
  @ApiResponse({ status: 200, description: 'Review status updated' })
  review(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @Body() dto: ReviewTestCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testCasesService.review(projectId, caseId, user, dto);
  }

  @Delete(':caseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a test case' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'caseId', description: 'Test case UUID' })
  @ApiResponse({ status: 204, description: 'Test case deleted successfully' })
  remove(
    @Param('projectId') projectId: string,
    @Param('caseId') caseId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.testCasesService.remove(projectId, caseId, user);
  }
}
