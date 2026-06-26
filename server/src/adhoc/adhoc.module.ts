import { Module } from '@nestjs/common';
import { AdhocController } from './adhoc.controller';
import { AdhocService } from './adhoc.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [AdhocController],
  providers: [AdhocService],
  exports: [AdhocService],
})
export class AdhocModule {}
