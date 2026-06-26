import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProjectMemberRole } from '@prisma/client';

export class UpdateMemberDto {
  @ApiProperty({ enum: ProjectMemberRole })
  @IsEnum(ProjectMemberRole)
  role!: ProjectMemberRole;
}
