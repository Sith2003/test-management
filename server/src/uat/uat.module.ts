import { Module } from '@nestjs/common';
import { UatController } from './uat.controller';
import { UatService } from './uat.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [UatController],
  providers: [UatService],
  exports: [UatService],
})
export class UatModule {}
