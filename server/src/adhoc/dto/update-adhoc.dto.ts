import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsBoolean, MaxLength } from 'class-validator';
import { UrgencyFlag, Severity, AdhocStatus } from '@prisma/client';

export class UpdateAdhocDto {
  @IsOptional() @IsEnum(AdhocStatus) status?: AdhocStatus;
  @IsOptional() @IsEnum(Severity) severity?: Severity;
  @IsOptional() @IsEnum(UrgencyFlag) urgency?: UrgencyFlag;
  @IsOptional() @IsString() @MaxLength(2000) testApproach?: string;
  @IsOptional() @IsString() @MaxLength(5000) testStepsPerformed?: string;
  @IsOptional() @IsString() @MaxLength(2000) testDataUsed?: string;
  @IsOptional() @IsString() @MaxLength(5000) findings?: string;
  @IsOptional() @IsUUID() assignedQaId?: string;
  @IsOptional() @IsString() @MaxLength(200) assignedDeveloper?: string;
  @IsOptional() @IsString() @MaxLength(200) relatedBugId?: string;
  @IsOptional() @IsString() @MaxLength(200) relatedTcId?: string;
  @IsOptional() @IsString() @MaxLength(2000) resolution?: string;
  @IsOptional() @IsDateString() completionDate?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
