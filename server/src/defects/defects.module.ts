import { Module } from '@nestjs/common';
import { DefectsController } from './defects.controller';
import { DefectsService } from './defects.service';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [ProjectsModule, ActivityLogModule],
  controllers: [DefectsController],
  providers: [DefectsService],
  exports: [DefectsService],
})
export class DefectsModule {}
