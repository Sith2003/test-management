import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const isDev = configService.get<string>('NODE_ENV') !== 'production';
    super({
      log: isDev
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [
            { emit: 'stdout', level: 'error' },
          ],
    });
  }

  async onModuleInit(): Promise<void> {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    if (isDev) {
      // Log slow queries (>100ms) in development
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (e: { duration: number; query: string }) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
