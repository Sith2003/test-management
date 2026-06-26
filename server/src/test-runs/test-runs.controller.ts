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
  ApiQuery,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { TestRunsService } from './test-runs.service';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { UpdateTestRunDto } from './dto/update-test-run.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';
import { PAGINATION } from '../shared/constants/pagination.constants';

class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  limit?: number = PAGINATION.DEFAULT_LIMIT;
}

@ApiTags('Test Runs')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/runs', version: '1' })
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Get()
  @ApiOperation({ summary: 'List test runs for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Test runs retrieved successfully' })
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: PaginationQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testRunsService.findAll(projectId, user, query.page, query.limit);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new test run from selected test cases' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Test run created successfully' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestRunDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testRunsService.create(projectId, dto, user);
  }

  @Get(':runId')
  @ApiOperation({ summary: 'Get a test run with results' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'runId', description: 'Test run UUID' })
  @ApiResponse({ status: 200, description: 'Test run retrieved successfully' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testRunsService.findOne(projectId, runId, user);
  }

  @Patch(':runId')
  @ApiOperation({ summary: 'Update a test run' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'runId', description: 'Test run UUID' })
  @ApiResponse({ status: 200, description: 'Test run updated successfully' })
  update(
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @Body() dto: UpdateTestRunDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testRunsService.update(projectId, runId, dto, user);
  }

  @Delete(':runId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a test run' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'runId', description: 'Test run UUID' })
  @ApiResponse({ status: 204, description: 'Test run deleted successfully' })
  remove(
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.testRunsService.remove(projectId, runId, user);
  }

  @Patch(':runId/results/:resultId')
  @ApiOperation({ summary: 'Update a test result (execute: PASS/FAIL/BLOCKED/SKIPPED)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'runId', description: 'Test run UUID' })
  @ApiParam({ name: 'resultId', description: 'Test result UUID' })
  @ApiResponse({ status: 200, description: 'Test result updated successfully' })
  updateResult(
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @Param('resultId') resultId: string,
    @Body() dto: UpdateResultDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testRunsService.updateResult(projectId, runId, resultId, dto, user);
  }
}
