import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get project summary statistics' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project summary statistics' })
  getSummary(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.reportsService.getProjectSummary(projectId, user);
  }

  @Get('run-history')
  @ApiOperation({ summary: 'Get run history with pass/fail/blocked/skipped/pending counts' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Run history with result statistics' })
  getRunHistory(
    @Param('projectId') projectId: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getRunHistory(projectId, user, query);
  }

  @Get('suite-breakdown')
  @ApiOperation({ summary: 'Get per-suite test case counts and latest result status breakdown' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Suite breakdown with test result statistics' })
  getSuiteBreakdown(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.reportsService.getSuiteBreakdown(projectId, user);
  }

  @Get('defect-trend')
  @ApiOperation({ summary: 'Get defect trend grouped by day for the last N days' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Daily defect open/closed trend' })
  getDefectTrend(
    @Param('projectId') projectId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getDefectTrend(projectId, user, days);
  }

  @Get('pass-rate-trend')
  @ApiOperation({ summary: 'Get pass rate trend across the last 10 completed test runs' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Pass rate trend per completed run' })
  getPassRateTrend(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.reportsService.getPassRateTrend(projectId, user);
  }

  @Get('automation-coverage')
  @ApiOperation({ summary: 'Get automation coverage breakdown by automation status' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Automation coverage grouped by status' })
  getAutomationCoverage(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.reportsService.getAutomationCoverage(projectId, user);
  }

  @Get('requirement-coverage')
  @ApiOperation({ summary: 'Get requirement coverage — how many requirements have at least one linked test case' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Requirement coverage statistics' })
  getRequirementCoverage(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.reportsService.getRequirementCoverage(projectId, user);
  }

  @Get('sprint-summary')
  @ApiOperation({ summary: 'Get sprint/version summary — test execution, bug counts, and requirement coverage' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Sprint summary with test results, bugs, and requirements' })
  getSprintSummary(
    @Param('projectId') projectId: string,
    @Query('sprint') sprint: string | undefined,
    @Query('version') version: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getSprintSummary(projectId, user, sprint, version);
  }

  @Get('release-readiness')
  @ApiOperation({ summary: 'Get release readiness — Go/No-Go verdict with key quality metrics' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Release readiness verdict and metrics' })
  getReleaseReadiness(
    @Param('projectId') projectId: string,
    @Query('sprint') sprint: string | undefined,
    @Query('version') version: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getReleaseReadiness(projectId, user, sprint, version);
  }
}
