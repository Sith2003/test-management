import { Module } from '@nestjs/common';
import { TestPlansController } from './test-plans.controller';
import { TestPlansService } from './test-plans.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [TestPlansController],
  providers: [TestPlansService],
  exports: [TestPlansService],
})
export class TestPlansModule {}
