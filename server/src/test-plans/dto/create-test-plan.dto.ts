import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsArray, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTestPlanDto {
  @ApiProperty({ example: 'Sprint 5 Test Plan' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({ required: false, example: 'Sprint 5' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  sprint?: string;

  @ApiProperty({ required: false, example: '1.4.2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  version?: string;

  @ApiProperty({ required: false, description: 'ISO date string for target date' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiProperty({ required: false, type: [String], description: 'User UUIDs to assign to this plan' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  assigneeIds?: string[];
}
