import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../shared/decorators/public.decorator';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    const start = Date.now();

    let dbStatus: 'ok' | 'error' = 'ok';
    let dbLatencyMs = 0;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = 'error';
    }

    const uptimeSeconds = Math.floor(process.uptime());
    const memUsage = process.memoryUsage();

    return {
      status: dbStatus === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: uptimeSeconds,
      responseTimeMs: Date.now() - start,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      memory: {
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
      },
    };
  }
}
