import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TestSuitesModule } from './test-suites/test-suites.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { TestRunsModule } from './test-runs/test-runs.module';
import { UploadModule } from './upload/upload.module';
import { ReportsModule } from './reports/reports.module';
import { DefectsModule } from './defects/defects.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { UatModule } from './uat/uat.module';
import { AdhocModule } from './adhoc/adhoc.module';
import { UsersModule } from './users/users.module';
import { RequirementsModule } from './requirements/requirements.module';
import { ExportsModule } from './exports/exports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { TestPlansModule } from './test-plans/test-plans.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { RATE_LIMITS } from './shared/constants/pagination.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: RATE_LIMITS.DEFAULT_TTL,
        limit: RATE_LIMITS.DEFAULT_LIMIT,
      },
    ]),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TestSuitesModule,
    TestCasesModule,
    TestRunsModule,
    UploadModule,
    ReportsModule,
    DefectsModule,
    ChecklistsModule,
    UatModule,
    AdhocModule,
    UsersModule,
    RequirementsModule,
    ExportsModule,
    DashboardModule,
    HealthModule,
    TestPlansModule,
    ActivityLogModule,
    MailModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
