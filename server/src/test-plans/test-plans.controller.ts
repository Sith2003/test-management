import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { TestPlansService } from './test-plans.service';
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Test Plans')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/plans', version: '1' })
export class TestPlansController {
  constructor(private readonly testPlansService: TestPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all test plans for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.testPlansService.findAll(projectId, user);
  }

  @Get(':planId')
  @ApiOperation({ summary: 'Get a test plan with linked runs' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testPlansService.findOne(projectId, planId, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new test plan' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestPlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testPlansService.create(projectId, user, dto);
  }

  @Patch(':planId')
  @ApiOperation({ summary: 'Update a test plan' })
  update(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Body() dto: UpdateTestPlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testPlansService.update(projectId, planId, user, dto);
  }

  @Delete(':planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a test plan' })
  remove(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testPlansService.remove(projectId, planId, user);
  }

  @Post(':planId/runs/:runId')
  @ApiOperation({ summary: 'Link a test run to this plan' })
  @ApiResponse({ status: 200 })
  linkRun(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('runId') runId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testPlansService.linkRun(projectId, planId, runId, user);
  }

  @Delete(':planId/runs/:runId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a test run from this plan' })
  unlinkRun(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('runId') runId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testPlansService.unlinkRun(projectId, planId, runId, user);
  }
}
