import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ChecklistEntryStatus } from '@prisma/client';

export class UpdateChecklistEntryDto {
  @ApiProperty({ enum: ChecklistEntryStatus })
  @IsEnum(ChecklistEntryStatus)
  status!: ChecklistEntryStatus;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
