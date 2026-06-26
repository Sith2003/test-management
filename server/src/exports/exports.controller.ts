import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { ProjectsService } from '../projects/projects.service';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';
import { ProjectMemberRole } from '@prisma/client';

@ApiTags('Exports')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/exports', version: '1' })
export class ExportsController {
  constructor(
    private readonly exportsService: ExportsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get('uat-report/:sessionId/pdf')
  @ApiOperation({ summary: 'Export UAT session report as PDF' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'sessionId', description: 'UAT Session UUID' })
  async exportUatReportPdf(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.exportsService.buildUatReportPdf(projectId, sessionId, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="uat-report-${sessionId}.pdf"`);
    res.send(buffer);
  }

  @Get('defects/excel')
  @ApiOperation({ summary: 'Export all project defects as Excel' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  async exportDefectsExcel(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    await this.projectsService.checkProjectAccess(projectId, user, ProjectMemberRole.VIEWER);
    const buffer = await this.exportsService.buildDefectsExcel(projectId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="defects.xlsx"');
    res.send(buffer);
  }

  @Get('runs/:runId/results/excel')
  @ApiOperation({ summary: 'Export test run results as Excel' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'runId', description: 'Test Run UUID' })
  async exportRunResultsExcel(
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.exportsService.buildRunResultsExcel(projectId, runId, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="run-results-${runId}.xlsx"`);
    res.send(buffer);
  }
}
