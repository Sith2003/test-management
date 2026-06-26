import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UrgencyFlag, Severity, AdhocStatus } from '@prisma/client';

export class CreateAdhocDto {
  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(2000)
  @Transform(({ value }: { value: string }) => value?.trim())
  issueDescription!: string;

  @ApiProperty()
  @IsString() @MinLength(1) @MaxLength(200)
  requestor!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsDateString()
  requestDate?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  requestType?: string;

  @ApiProperty({ enum: UrgencyFlag, required: false, default: 'NORMAL' })
  @IsOptional() @IsEnum(UrgencyFlag)
  urgency?: UrgencyFlag;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  sourceSystem?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  module?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  impactAssessment?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  affectedEnvironment?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string;
}
