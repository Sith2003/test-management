import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Priority, Severity, DefectStatus } from '@prisma/client';

export class CreateDefectDto {
  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsUUID()
  testCaseId?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  module?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(5000)
  stepsToReproduce?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  expectedResult?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  actualResult?: string;

  @ApiProperty({ enum: Severity, required: false, default: 'MEDIUM' })
  @IsOptional() @IsEnum(Severity)
  severity?: Severity;

  @ApiProperty({ enum: Priority, required: false, default: 'MEDIUM' })
  @IsOptional() @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ enum: DefectStatus, required: false })
  @IsOptional() @IsEnum(DefectStatus)
  status?: DefectStatus;

  @ApiProperty({ required: false })
  @IsOptional() @IsUUID()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsUUID()
  relatedDefectId?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(500)
  bugPattern?: string;
}
