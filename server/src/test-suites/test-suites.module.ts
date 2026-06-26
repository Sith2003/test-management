import { Module } from '@nestjs/common';
import { TestSuitesController } from './test-suites.controller';
import { TestSuitesService } from './test-suites.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [TestSuitesController],
  providers: [TestSuitesService],
  exports: [TestSuitesService],
})
export class TestSuitesModule {}
