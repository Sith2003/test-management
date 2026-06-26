import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsArray, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { PlanStatus } from '@prisma/client';

export class UpdateTestPlanDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  sprint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  version?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  targetDate?: string | null;

  @ApiProperty({ required: false, enum: PlanStatus })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  assigneeIds?: string[];
}
