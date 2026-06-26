import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority, Severity, DefectStatus } from '@prisma/client';

export class ListDefectsQuery {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;

  @ApiProperty({ enum: DefectStatus, required: false })
  @IsOptional() @IsEnum(DefectStatus)
  status?: DefectStatus;

  @ApiProperty({ enum: Severity, required: false })
  @IsOptional() @IsEnum(Severity)
  severity?: Severity;

  @ApiProperty({ enum: Priority, required: false })
  @IsOptional() @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  testCaseId?: string;
}
