import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [RequirementsController],
  providers: [RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
