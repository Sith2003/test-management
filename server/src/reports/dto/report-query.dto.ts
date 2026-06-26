import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @ApiProperty({ required: false, description: 'Start date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, default: 10, description: 'Number of recent runs to include' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
