import { Module } from '@nestjs/common';
import { TestCasesController } from './test-cases.controller';
import { TestCasesService } from './test-cases.service';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [ProjectsModule, ActivityLogModule],
  controllers: [TestCasesController],
  providers: [TestCasesService],
  exports: [TestCasesService],
})
export class TestCasesModule {}
