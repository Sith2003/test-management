import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@Controller({ path: 'projects/:projectId/activity', version: '1' })
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.activityLogService.findAll(projectId, user, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      entityType,
    });
  }
}
