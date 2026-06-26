import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority } from '@prisma/client';

export class ListRequirementsQuery {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  search?: string;

  @ApiProperty({ enum: Priority, required: false })
  @IsOptional() @IsEnum(Priority)
  priority?: Priority;
}
