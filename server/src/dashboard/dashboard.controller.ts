import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get global dashboard summary for the current user' })
  @ApiResponse({ status: 200, description: 'Dashboard summary counts' })
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getSummary(user);
  }
}
