import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectMemberRole } from '@prisma/client';

export class AddMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ enum: ProjectMemberRole, required: false, default: ProjectMemberRole.QA })
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;
}
