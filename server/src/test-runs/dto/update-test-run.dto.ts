import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { RunStatus } from '@prisma/client';

export class UpdateTestRunDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiProperty({ enum: RunStatus, required: false })
  @IsOptional()
  @IsEnum(RunStatus)
  status?: RunStatus;

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
}
