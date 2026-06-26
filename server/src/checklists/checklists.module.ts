import { Module } from '@nestjs/common';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
