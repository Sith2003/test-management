import { Module } from '@nestjs/common';
import { TestRunsController } from './test-runs.controller';
import { TestRunsService } from './test-runs.service';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [ProjectsModule, ActivityLogModule],
  controllers: [TestRunsController],
  providers: [TestRunsService],
  exports: [TestRunsService],
})
export class TestRunsModule {}
